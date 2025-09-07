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
var XRayParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.XRayParserService = void 0;
const common_1 = require("@nestjs/common");
const x_ray_1 = __importDefault(require("x-ray"));
let XRayParserService = XRayParserService_1 = class XRayParserService {
    logger = new common_1.Logger(XRayParserService_1.name);
    xray;
    constructor() {
        this.xray = (0, x_ray_1.default)();
    }
    async parseWithSchema(html, schema) {
        try {
            this.logger.log('Parsing HTML content with X-Ray schema');
            const result = await this.xray(html, schema);
            this.logger.log('X-Ray parsing completed successfully');
            return result;
        }
        catch (error) {
            this.logger.error('X-Ray parsing failed', error);
            throw new Error(`X-Ray parsing failed: ${error.message}`);
        }
    }
    async scrapeUrl(url, schema) {
        const startTime = Date.now();
        try {
            this.logger.log(`Scraping URL with X-Ray: ${url}`);
            const data = await this.xray(url, schema);
            const processingTime = Date.now() - startTime;
            return {
                url,
                data,
                metadata: {
                    scrapedAt: new Date().toISOString(),
                    processingTime,
                },
            };
        }
        catch (error) {
            this.logger.error(`X-Ray scraping failed for ${url}`, error);
            throw new Error(`X-Ray scraping failed: ${error.message}`);
        }
    }
    async scrapeMultipleUrls(urls, schema) {
        this.logger.log(`Scraping ${urls.length} URLs with X-Ray`);
        const results = [];
        const errors = [];
        for (const url of urls) {
            try {
                const result = await this.scrapeUrl(url, schema);
                results.push(result);
                this.logger.log(`Successfully scraped: ${url}`);
            }
            catch (error) {
                const errorMsg = `Failed to scrape ${url}: ${error.message}`;
                errors.push(errorMsg);
                this.logger.error(errorMsg);
            }
        }
        this.logger.log(`X-Ray batch scraping completed. Success: ${results.length}, Errors: ${errors.length}`);
        if (errors.length > 0) {
            this.logger.warn('Some URLs failed to scrape:', errors);
        }
        return results;
    }
    getCommonSchemas() {
        return {
            newsArticle: {
                title: 'h1',
                content: ['.article-content p', '.content p'],
                author: '.author',
                date: '.date, .published',
                tags: ['.tags a', '.categories a'],
            },
            product: {
                name: 'h1, .product-title',
                price: '.price, .cost',
                description: '.description, .product-description',
                images: ['img@src'],
                rating: '.rating, .stars',
                availability: '.availability, .stock',
            },
            blogPost: {
                title: 'h1, .post-title',
                content: ['.post-content p', '.entry-content p'],
                author: '.author, .byline',
                date: '.date, .published, time',
                categories: ['.categories a', '.tags a'],
            },
            generic: {
                title: 'h1, title',
                headings: ['h1', 'h2', 'h3'],
                paragraphs: ['p'],
                links: ['a@href'],
                images: ['img@src'],
                lists: ['ul li', 'ol li'],
            },
        };
    }
    createCustomSchema(selectors) {
        return selectors;
    }
};
exports.XRayParserService = XRayParserService;
exports.XRayParserService = XRayParserService = XRayParserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], XRayParserService);
//# sourceMappingURL=xray-parser.service.js.map