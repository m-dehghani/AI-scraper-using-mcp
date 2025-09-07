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
var ScraperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperService = void 0;
const common_1 = require("@nestjs/common");
const html_parser_service_1 = require("./html-parser.service");
const ollama_service_1 = require("../ai/ollama.service");
const mcp_client_service_1 = require("../mcp/mcp-client.service");
let ScraperService = ScraperService_1 = class ScraperService {
    mcpClient;
    htmlParser;
    ollamaService;
    logger = new common_1.Logger(ScraperService_1.name);
    constructor(mcpClient, htmlParser, ollamaService) {
        this.mcpClient = mcpClient;
        this.htmlParser = htmlParser;
        this.ollamaService = ollamaService;
    }
    async scrapeAndAnalyze(url, options = {}) {
        const startTime = Date.now();
        this.logger.log(`Starting scrape and analysis for: ${url}`);
        try {
            const isOllamaAvailable = await this.ollamaService.isAvailable();
            if (!isOllamaAvailable) {
                this.logger.warn('ollama service not available, skipping AI analysis');
            }
            this.logger.log('Step 1: Scraping page content with MCP...');
            const mcpOptions = {
                url,
                maxScrolls: options.maxScrolls,
                scrollDelay: options.scrollDelay,
                waitForNetworkIdle: true,
                viewport: { width: 1920, height: 1080 },
            };
            const mcpResult = await this.mcpClient.scrapeWebsite(mcpOptions);
            this.logger.log('Step 2: Parsing HTML content...');
            const parsedContent = this.htmlParser.parseContent(mcpResult.html);
            let analysis = {
                summary: 'AI analysis not available',
                keyPoints: 'AI analysis not available',
                categories: 'AI analysis not available',
            };
            if (isOllamaAvailable) {
                this.logger.log('Step 3: Performing AI analysis...');
                analysis = await this.performAIAnalysis(parsedContent, options);
            }
            const processingTime = Date.now() - startTime;
            const result = {
                url: mcpResult.url,
                title: mcpResult.title,
                content: parsedContent,
                analysis,
                metadata: {
                    scrapedAt: new Date(mcpResult.metadata.scrapedAt),
                    processingTime,
                    contentLength: mcpResult.metadata.contentLength,
                },
            };
            this.logger.log(`Scraping completed in ${processingTime}ms`);
            return result;
        }
        catch (error) {
            this.logger.error(`Scraping failed for ${url}`, error);
            throw new Error(`Scraping failed: ${error.message}`);
        }
    }
    async scrapeMultipleUrls(urls, options = {}) {
        this.logger.log(`Starting batch scraping for ${urls.length} URLs`);
        const results = [];
        const errors = [];
        for (const url of urls) {
            try {
                const result = await this.scrapeAndAnalyze(url, options);
                results.push(result);
                this.logger.log(`Successfully scraped: ${url}`);
            }
            catch (error) {
                const errorMsg = `Failed to scrape ${url}: ${error.message}`;
                errors.push(errorMsg);
                this.logger.error(errorMsg);
            }
        }
        this.logger.log(`Batch scraping completed. Success: ${results.length}, Errors: ${errors.length}`);
        if (errors.length > 0) {
            this.logger.warn('Some URLs failed to scrape:', errors);
        }
        return results;
    }
    async extractStructuredData(url, schema, options = {}) {
        this.logger.log(`Extracting structured data from: ${url}`);
        try {
            const mcpOptions = {
                url,
                maxScrolls: options.maxScrolls,
                scrollDelay: options.scrollDelay,
                waitForNetworkIdle: true,
                viewport: { width: 1920, height: 1080 },
            };
            const mcpResult = await this.mcpClient.scrapeWebsite(mcpOptions);
            const parsedContent = this.htmlParser.parseContent(mcpResult.html);
            const structuredData = await this.ollamaService.extractStructuredData(parsedContent.text, schema, options.model);
            return {
                url,
                extractedData: structuredData,
                metadata: {
                    scrapedAt: new Date(),
                    contentLength: parsedContent.text.length,
                },
            };
        }
        catch (error) {
            this.logger.error(`Structured data extraction failed for ${url}`, error);
            throw new Error(`Structured data extraction failed: ${error.message}`);
        }
    }
    async performAIAnalysis(content, options) {
        const { analysisType = 'summary', model = 'llama3', chunkSize = 2000, } = options;
        try {
            const chunks = this.htmlParser.chunkContent(content.text, chunkSize);
            this.logger.log(`Processing ${chunks.length} content chunks for AI analysis`);
            const analysisPromises = chunks.map(chunk => this.ollamaService.analyzeScrapedContent(chunk, analysisType, model));
            const chunkAnalyses = await Promise.all(analysisPromises);
            const combinedAnalysis = chunkAnalyses.join('\n\n');
            const summary = await this.ollamaService.analyzeScrapedContent(combinedAnalysis, 'summary', model);
            const keyPoints = await this.ollamaService.analyzeScrapedContent(combinedAnalysis, 'extract', model);
            const categories = await this.ollamaService.analyzeScrapedContent(combinedAnalysis, 'categorize', model);
            return { summary, keyPoints, categories };
        }
        catch (error) {
            this.logger.error('AI analysis failed', error);
            return {
                summary: 'AI analysis failed',
                keyPoints: 'AI analysis failed',
                categories: 'AI analysis failed',
            };
        }
    }
    async getHealthStatus() {
        const mcpHealth = await this.mcpClient.isHealthy();
        const ollamaHealth = await this.ollamaService.isAvailable();
        return {
            mcp: mcpHealth,
            ollama: ollamaHealth,
            overall: mcpHealth && ollamaHealth,
        };
    }
    async cleanup() {
        this.logger.log('Cleaning up scraper resources...');
        await this.mcpClient.close();
    }
};
exports.ScraperService = ScraperService;
exports.ScraperService = ScraperService = ScraperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mcp_client_service_1.McpClientService,
        html_parser_service_1.HtmlParserService,
        ollama_service_1.OllamaService])
], ScraperService);
//# sourceMappingURL=scraper.service.js.map