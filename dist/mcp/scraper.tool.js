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
var ScraperTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperTool = void 0;
const common_1 = require("@nestjs/common");
const mcp_types_1 = require("./mcp.types");
const zod_1 = require("zod");
const scraper_service_1 = require("../scraper/scraper.service");
const xray_parser_service_1 = require("../scraper/xray-parser.service");
const ScrapingOptionsSchema = zod_1.z.object({
    url: zod_1.z.string().url('Invalid URL format'),
    maxScrolls: zod_1.z.number().min(1).max(100).default(20),
    scrollDelay: zod_1.z.number().min(500).max(10000).default(2000),
    analysisType: zod_1.z
        .enum(['summary', 'extract', 'categorize'])
        .default('summary'),
    model: zod_1.z.string().default('llama3'),
    chunkSize: zod_1.z.number().min(500).max(5000).default(2000),
});
const BatchScrapingOptionsSchema = zod_1.z.object({
    urls: zod_1.z.array(zod_1.z.string().url('Invalid URL format')).min(1).max(10),
    maxScrolls: zod_1.z.number().min(1).max(100).default(20),
    scrollDelay: zod_1.z.number().min(500).max(10000).default(2000),
    analysisType: zod_1.z
        .enum(['summary', 'extract', 'categorize'])
        .default('summary'),
    model: zod_1.z.string().default('llama3'),
    chunkSize: zod_1.z.number().min(500).max(5000).default(2000),
});
const StructuredDataSchema = zod_1.z.object({
    url: zod_1.z.string().url('Invalid URL format'),
    schema: zod_1.z
        .string()
        .min(10, 'Schema description must be at least 10 characters'),
    maxScrolls: zod_1.z.number().min(1).max(100).default(20),
    scrollDelay: zod_1.z.number().min(500).max(10000).default(2000),
    model: zod_1.z.string().default('llama3'),
});
let ScraperTool = ScraperTool_1 = class ScraperTool {
    scraperService;
    xrayParser;
    logger = new common_1.Logger(ScraperTool_1.name);
    constructor(scraperService, xrayParser) {
        this.scraperService = scraperService;
        this.xrayParser = xrayParser;
    }
    async scrapeInfiniteScroll(params) {
        try {
            this.logger.log(`Starting infinite scroll scraping for: ${params.url}`);
            const options = {
                maxScrolls: params.maxScrolls,
                scrollDelay: params.scrollDelay,
                analysisType: params.analysisType,
                model: params.model,
                chunkSize: params.chunkSize,
            };
            const result = await this.scraperService.scrapeAndAnalyze(params.url, options);
            this.logger.log('Scraping completed successfully');
            return {
                success: true,
                data: result,
                message: 'Content scraped and analyzed successfully',
            };
        }
        catch (error) {
            this.logger.error('Scraping failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to scrape content',
            };
        }
    }
    async scrapeBatchUrls(params) {
        try {
            this.logger.log(`Starting batch scraping for ${params.urls.length} URLs`);
            const options = {
                maxScrolls: params.maxScrolls,
                scrollDelay: params.scrollDelay,
                analysisType: params.analysisType,
                model: params.model,
                chunkSize: params.chunkSize,
            };
            const results = [];
            for (let i = 0; i < params.urls.length; i++) {
                const url = params.urls[i];
                this.logger.log(`Processing URL ${i + 1}/${params.urls.length}: ${url}`);
                try {
                    const result = await this.scraperService.scrapeAndAnalyze(url, options);
                    results.push({
                        url,
                        success: true,
                        data: result,
                    });
                }
                catch (error) {
                    this.logger.error(`Failed to scrape ${url}:`, error);
                    results.push({
                        url,
                        success: false,
                        error: error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    });
                }
            }
            this.logger.log('Batch scraping completed');
            return {
                success: true,
                data: results,
                message: `Batch scraping completed for ${params.urls.length} URLs`,
            };
        }
        catch (error) {
            this.logger.error('Batch scraping failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to perform batch scraping',
            };
        }
    }
    async extractStructuredData(params) {
        try {
            this.logger.log(`Extracting structured data from: ${params.url}`);
            const options = {
                maxScrolls: params.maxScrolls,
                scrollDelay: params.scrollDelay,
                analysisType: 'extract',
                model: params.model,
            };
            const result = await this.scraperService.scrapeAndAnalyze(params.url, options);
            const structuredData = await this.scraperService.extractStructuredData(params.url, params.schema, options);
            this.logger.log('Structured data extraction completed');
            return {
                success: true,
                data: {
                    url: params.url,
                    schema: params.schema,
                    extractedData: structuredData,
                    rawContent: result,
                },
                message: 'Structured data extracted successfully',
            };
        }
        catch (error) {
            this.logger.error('Structured data extraction failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to extract structured data',
            };
        }
    }
    async healthCheck() {
        try {
            this.logger.log('Performing health check...');
            const healthStatus = await this.scraperService.getHealthStatus();
            return {
                success: true,
                data: {
                    status: healthStatus.overall ? 'healthy' : 'unhealthy',
                    services: {
                        mcp: healthStatus.mcp ? 'healthy' : 'unhealthy',
                        ollama: healthStatus.ollama ? 'healthy' : 'unhealthy',
                    },
                    timestamp: new Date().toISOString(),
                },
                message: 'Health check completed',
            };
        }
        catch (error) {
            this.logger.error('Health check failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Health check failed',
            };
        }
    }
    async scrapeWithXRay(params) {
        try {
            this.logger.log(`Scraping with X-Ray: ${params.url}`);
            const result = await this.xrayParser.scrapeUrl(params.url, params.schema);
            this.logger.log('X-Ray scraping completed successfully');
            return {
                success: true,
                url: result.url,
                data: result.data,
                metadata: result.metadata,
            };
        }
        catch (error) {
            this.logger.error('X-Ray scraping failed', error);
            return {
                success: false,
                url: params.url,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    getXRaySchemas() {
        try {
            this.logger.log('Getting X-Ray schemas');
            const schemas = this.xrayParser.getCommonSchemas();
            return {
                success: true,
                schemas,
                description: 'Common X-Ray schemas for different content types',
            };
        }
        catch (error) {
            this.logger.error('Failed to get X-Ray schemas', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
};
exports.ScraperTool = ScraperTool;
__decorate([
    (0, mcp_types_1.Tool)({
        name: 'scrape-infinite-scroll',
        description: 'Scrapes content from a web page with infinite scroll functionality and analyzes it using AI',
        parameters: ScrapingOptionsSchema,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScraperTool.prototype, "scrapeInfiniteScroll", null);
__decorate([
    (0, mcp_types_1.Tool)({
        name: 'scrape-batch-urls',
        description: 'Scrapes multiple URLs in batch with infinite scroll and AI analysis',
        parameters: BatchScrapingOptionsSchema,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScraperTool.prototype, "scrapeBatchUrls", null);
__decorate([
    (0, mcp_types_1.Tool)({
        name: 'extract-structured-data',
        description: 'Extracts structured data from a web page based on a custom schema using AI',
        parameters: StructuredDataSchema,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScraperTool.prototype, "extractStructuredData", null);
__decorate([
    (0, mcp_types_1.Tool)({
        name: 'scraper-health-check',
        description: 'Checks the health status of the scraper services',
        parameters: zod_1.z.object({}),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScraperTool.prototype, "healthCheck", null);
__decorate([
    (0, mcp_types_1.Tool)({
        name: 'scrape-with-xray',
        description: 'Scrapes content from a web page using X-Ray with schema-based extraction',
        parameters: zod_1.z.object({
            url: zod_1.z.string().url('Invalid URL format'),
            schema: zod_1.z
                .record(zod_1.z.string())
                .describe('X-Ray schema for data extraction'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScraperTool.prototype, "scrapeWithXRay", null);
__decorate([
    (0, mcp_types_1.Tool)({
        name: 'get-xray-schemas',
        description: 'Returns common X-Ray schemas for different types of content',
        parameters: zod_1.z.object({}),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ScraperTool.prototype, "getXRaySchemas", null);
exports.ScraperTool = ScraperTool = ScraperTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [scraper_service_1.ScraperService,
        xray_parser_service_1.XRayParserService])
], ScraperTool);
//# sourceMappingURL=scraper.tool.js.map