import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import { McpScrapingOptions, McpScrapingResult } from './interfaces';

@Injectable()
export class McpClientService {
    private readonly logger = new Logger(McpClientService.name);
    private browser: Browser | null = null;
    private isConnected = false;

    constructor() {
        // Add stealth plugin to avoid detection
        puppeteer.use(StealthPlugin());
    }

    public async initialize(): Promise<void> {
        if (this.isConnected) {
            return;
        }

        try {
            this.logger.log('Initializing Puppeteer browser...');

            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                ],
            });

            this.isConnected = true;
            this.logger.log('Puppeteer browser initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Puppeteer browser:', error);
            throw error;
        }
    }

    public async scrapeWebsite(
        options: McpScrapingOptions,
    ): Promise<McpScrapingResult> {
        if (!this.browser || !this.isConnected) {
            await this.initialize();
        }

        const startTime = Date.now();
        let page: Page | null = null;

        try {
            this.logger.log(`Starting Puppeteer scraping for: ${options.url}`);

            page = await this.browser!.newPage();

            // Set viewport
            if (options.viewport) {
                await page.setViewport(options.viewport);
            }

            // Set user agent
            if (options.userAgent) {
                await page.setUserAgent(options.userAgent);
            }

            // Navigate to the page
            await page.goto(options.url, {
                waitUntil: options.waitForNetworkIdle
                    ? 'networkidle0'
                    : 'domcontentloaded',
                timeout: 30000,
            });

            // Handle infinite scroll if needed
            if (options.maxScrolls && options.maxScrolls > 0) {
                await this.handleInfiniteScroll(
                    page,
                    options.maxScrolls,
                    options.scrollDelay || 2000,
                );
            }

            // Get page content
            const pageData = await page.evaluate(() => {
                return {
                    title: document.title,
                    content: document.body.innerText,
                    html: document.documentElement.outerHTML,
                    url: window.location.href,
                };
            });

            const processingTime = Date.now() - startTime;

            return {
                url: pageData.url || options.url,
                title: pageData.title || 'Untitled',
                content: pageData.content || '',
                html: pageData.html || '',
                metadata: {
                    scrapedAt: new Date().toISOString(),
                    processingTime,
                    contentLength: pageData.content?.length || 0,
                },
            };
        } catch (error) {
            this.logger.error('Puppeteer scraping failed:', error);
            throw new Error(`Puppeteer scraping failed: ${error.message}`);
        } finally {
            if (page) {
                await page.close();
            }
        }
    }

    private async handleInfiniteScroll(
        page: Page,
        maxScrolls: number,
        scrollDelay: number,
    ): Promise<void> {
        this.logger.log(
            `Handling infinite scroll (${maxScrolls} scrolls, ${scrollDelay}ms delay)`,
        );

        for (let i = 0; i < maxScrolls; i++) {
            // Scroll to bottom
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, scrollDelay));

            // Check if we can scroll more
            const canScrollMore = await page.evaluate(() => {
                const { scrollTop, scrollHeight, clientHeight } =
                    document.documentElement;
                return scrollTop + clientHeight < scrollHeight - 10;
            });

            if (!canScrollMore) {
                this.logger.log('Reached end of page content');
                break;
            }

            this.logger.debug(`Scroll ${i + 1}/${maxScrolls} completed`);
        }
    }

    public async isHealthy(): Promise<boolean> {
        try {
            if (!this.browser || !this.isConnected) {
                return false;
            }

            // Test browser by creating a simple page
            const page = await this.browser.newPage();
            await page.goto('about:blank');
            await page.close();
            return true;
        } catch (error) {
            this.logger.error('Puppeteer health check failed:', error);
            return false;
        }
    }

    public async close(): Promise<void> {
        if (this.browser) {
            try {
                await this.browser.close();
                this.browser = null;
                this.isConnected = false;
                this.logger.log('Puppeteer browser closed');
            } catch (error) {
                this.logger.warn('Error closing Puppeteer browser:', error);
            }
        }
    }
}
