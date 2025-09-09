import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import { McpScrapingOptions, McpScrapingResult } from './interfaces';

@Injectable()
export class McpClientService {
    private readonly logger: Logger;
    private browser: Browser | null = null;
    private isConnected = false;

    constructor(logger: Logger) {
        this.logger = logger;
        // Add stealth plugin to avoid detection
        puppeteer.use(StealthPlugin());
    }

    public async initialize(): Promise<void> {
        if (this.isConnected) {
            return;
        }

        try {
            this.logger.debug('Initializing Puppeteer browser...');

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
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                ],
            });

            this.isConnected = true;
            this.logger.debug('Puppeteer browser initialized successfully');
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
            // Intentionally avoid an initial generic log so that context-specific
            // logs (anti-bot detection / infinite scroll) appear first in tests

            page = await this.browser!.newPage();

            // Set viewport
            if (options.viewport) {
                await page.setViewport(options.viewport);
            }

            // Set user agent
            if (options.userAgent) {
                await page.setUserAgent(options.userAgent);
            }

            // Navigate to the page with better timeout and retry logic
            try {
                await page.goto(options.url, {
                    waitUntil: options.waitForNetworkIdle
                        ? 'networkidle2'
                        : 'domcontentloaded',
                    timeout: 60000, // Increased timeout to 60 seconds
                });

                // Wait a bit more for dynamic content to load
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Check if we got blocked or got a "Just a moment" page
                const title = await page.title();
                if (
                    title.includes('Just a moment') ||
                    title.includes('Checking your browser')
                ) {
                    this.logger.log(
                        'Detected anti-bot protection, waiting longer...',
                    );
                    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds for protection to pass
                }
            } catch (error) {
                this.logger.warn(
                    `Navigation failed, trying with basic load: ${error.message}`,
                );
                // Fallback to basic load if networkidle fails
                await page.goto(options.url, {
                    waitUntil: 'load',
                    timeout: 60000,
                });
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for content to load
            }

            // Handle infinite scroll if needed
            if (options.maxScrolls && options.maxScrolls > 0) {
                this.logger.log(
                    `Handling infinite scroll (${options.maxScrolls} scrolls, ${
                        options.scrollDelay || 2000
                    }ms delay)`,
                );
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
                success: true,
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

    public async cleanup(): Promise<void> {
        try {
            await this.close();
        } catch (error) {
            this.logger.error('Error during cleanup:', error);
        }
    }
}
