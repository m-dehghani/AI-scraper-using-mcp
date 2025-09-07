"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var McpClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpClientService = void 0;
const common_1 = require("@nestjs/common");
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
let McpClientService = McpClientService_1 = class McpClientService {
    logger = new common_1.Logger(McpClientService_1.name);
    browser = null;
    isConnected = false;
    constructor() {
        puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
    }
    async initialize() {
        if (this.isConnected) {
            return;
        }
        try {
            this.logger.log('Initializing Puppeteer browser...');
            this.browser = await puppeteer_extra_1.default.launch({
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
        }
        catch (error) {
            this.logger.error('Failed to initialize Puppeteer browser:', error);
            throw error;
        }
    }
    async scrapeWebsite(options) {
        if (!this.browser || !this.isConnected) {
            await this.initialize();
        }
        const startTime = Date.now();
        let page = null;
        try {
            this.logger.log(`Starting Puppeteer scraping for: ${options.url}`);
            page = await this.browser.newPage();
            if (options.viewport) {
                await page.setViewport(options.viewport);
            }
            if (options.userAgent) {
                await page.setUserAgent(options.userAgent);
            }
            await page.goto(options.url, {
                waitUntil: options.waitForNetworkIdle
                    ? 'networkidle0'
                    : 'domcontentloaded',
                timeout: 30000,
            });
            if (options.maxScrolls && options.maxScrolls > 0) {
                await this.handleInfiniteScroll(page, options.maxScrolls, options.scrollDelay || 2000);
            }
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
        }
        catch (error) {
            this.logger.error('Puppeteer scraping failed:', error);
            throw new Error(`Puppeteer scraping failed: ${error.message}`);
        }
        finally {
            if (page) {
                await page.close();
            }
        }
    }
    async handleInfiniteScroll(page, maxScrolls, scrollDelay) {
        this.logger.log(`Handling infinite scroll (${maxScrolls} scrolls, ${scrollDelay}ms delay)`);
        for (let i = 0; i < maxScrolls; i++) {
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await new Promise(resolve => setTimeout(resolve, scrollDelay));
            const canScrollMore = await page.evaluate(() => {
                const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
                return scrollTop + clientHeight < scrollHeight - 10;
            });
            if (!canScrollMore) {
                this.logger.log('Reached end of page content');
                break;
            }
            this.logger.debug(`Scroll ${i + 1}/${maxScrolls} completed`);
        }
    }
    async isHealthy() {
        try {
            if (!this.browser || !this.isConnected) {
                return false;
            }
            const page = await this.browser.newPage();
            await page.goto('about:blank');
            await page.close();
            return true;
        }
        catch (error) {
            this.logger.error('Puppeteer health check failed:', error);
            return false;
        }
    }
    async close() {
        if (this.browser) {
            try {
                await this.browser.close();
                this.browser = null;
                this.isConnected = false;
                this.logger.log('Puppeteer browser closed');
            }
            catch (error) {
                this.logger.warn('Error closing Puppeteer browser:', error);
            }
        }
    }
};
exports.McpClientService = McpClientService;
exports.McpClientService = McpClientService = McpClientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], McpClientService);
//# sourceMappingURL=mcp-client.service.js.map