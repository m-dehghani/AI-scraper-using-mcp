import { Injectable, Logger } from '@nestjs/common';
import { HtmlParserService } from './html-parser.service';
import { OllamaService } from '../ai/ollama.service';
import { McpClientService } from '../mcp/mcp-client.service';
import { McpScrapingOptions } from '../mcp/interfaces';
import {
    ScrapingResult,
    ScrapingJobOptions,
    ParsedContent,
} from './interfaces';

@Injectable()
export class ScraperService {
    private readonly logger = new Logger(ScraperService.name);

    constructor(
        private readonly mcpClient: McpClientService,
        private readonly htmlParser: HtmlParserService,
        private readonly ollamaService: OllamaService,
    ) {}

    public async scrapeAndAnalyze(
        url: string,
        options: ScrapingJobOptions = {},
    ): Promise<ScrapingResult> {
        const startTime = Date.now();
        this.logger.log(`Starting scrape and analysis for: ${url}`);

        try {
            // Check if Ollama is available
            const isOllamaAvailable = await this.ollamaService.isAvailable();
            if (!isOllamaAvailable) {
                this.logger.warn(
                    'ollama service not available, skipping AI analysis',
                );
            }

            // Step 1: Scrape the page using MCP
            this.logger.log('Step 1: Scraping page content with MCP...');
            const mcpOptions: McpScrapingOptions = {
                url,
                maxScrolls: options.maxScrolls,
                scrollDelay: options.scrollDelay,
                waitForNetworkIdle: true,
                viewport: { width: 1920, height: 1080 },
            };
            const mcpResult = await this.mcpClient.scrapeWebsite(mcpOptions);

            // Step 2: Parse the HTML content
            this.logger.log('Step 2: Parsing HTML content...');
            const parsedContent = this.htmlParser.parseContent(mcpResult.html);

            // Step 3: AI Analysis (if Ollama is available)
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

            const result: ScrapingResult = {
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
        } catch (error) {
            this.logger.error(`Scraping failed for ${url}`, error);
            throw new Error(`Scraping failed: ${error.message}`);
        }
    }

    public async scrapeMultipleUrls(
        urls: string[],
        options: ScrapingJobOptions = {},
    ): Promise<ScrapingResult[]> {
        this.logger.log(`Starting batch scraping for ${urls.length} URLs`);

        const results: ScrapingResult[] = [];
        const scrapeTaskList = urls.map(url =>
            this.scrapeAndAnalyze(url, options),
        );
        const scrapeTaskResults = await Promise.all(scrapeTaskList);
        results.push(...scrapeTaskResults);

        this.logger.log(`Batch scraping completed. Success: ${results.length}`);
        return results;
    }

    public async extractStructuredData(
        url: string,
        schema: string,
        options: ScrapingJobOptions = {},
    ): Promise<any> {
        this.logger.log(`Extracting structured data from: ${url}`);

        try {
            // Scrape the page using MCP
            const mcpOptions: McpScrapingOptions = {
                url,
                maxScrolls: options.maxScrolls,
                scrollDelay: options.scrollDelay,
                waitForNetworkIdle: true,
                viewport: { width: 1920, height: 1080 },
            };
            const mcpResult = await this.mcpClient.scrapeWebsite(mcpOptions);
            const parsedContent = this.htmlParser.parseContent(mcpResult.html);

            // Use Ollama to extract structured data
            const structuredData =
                await this.ollamaService.extractStructuredData(
                    parsedContent.text,
                    schema,
                    options.model,
                );

            return {
                url,
                extractedData: structuredData,
                metadata: {
                    scrapedAt: new Date(),
                    contentLength: parsedContent.text.length,
                },
            };
        } catch (error) {
            this.logger.error(
                `Structured data extraction failed for ${url}`,
                error,
            );
            throw new Error(
                `Structured data extraction failed: ${error.message}`,
            );
        }
    }

    private async performAIAnalysis(
        content: ParsedContent,
        options: ScrapingJobOptions,
    ): Promise<{ summary: string; keyPoints: string; categories: string }> {
        const {
            analysisType = 'summary',
            model = 'llama3.2:1b',
            chunkSize = 2000,
        } = options;

        try {
            // Chunk the content if it's too large
            const chunks = this.htmlParser.chunkContent(
                content.text,
                chunkSize,
            );
            this.logger.log(
                `Processing ${chunks.length} content chunks for AI analysis`,
            );

            // Process each chunk and combine results
            const analysisPromises = chunks.map(chunk =>
                this.ollamaService.analyzeScrapedContent(
                    chunk,
                    analysisType,
                    model,
                ),
            );

            const chunkAnalyses = await Promise.all(analysisPromises);
            const combinedAnalysis = chunkAnalyses.join('\n\n');

            // Generate final analysis
            const summary = await this.ollamaService.analyzeScrapedContent(
                combinedAnalysis,
                'summary',
                model,
            );

            const keyPoints = await this.ollamaService.analyzeScrapedContent(
                combinedAnalysis,
                'extract',
                model,
            );

            const categories = await this.ollamaService.analyzeScrapedContent(
                combinedAnalysis,
                'categorize',
                model,
            );

            return { summary, keyPoints, categories };
        } catch (error) {
            this.logger.error('AI analysis failed', error);
            return {
                summary: 'AI analysis failed',
                keyPoints: 'AI analysis failed',
                categories: 'AI analysis failed',
            };
        }
    }

    public async getHealthStatus(): Promise<{
        mcp: boolean;
        ollama: boolean;
        overall: boolean;
    }> {
        const mcpHealth = await this.mcpClient.isHealthy();
        const ollamaHealth = await this.ollamaService.isAvailable();

        return {
            mcp: mcpHealth,
            ollama: ollamaHealth,
            overall: mcpHealth && ollamaHealth,
        };
    }

    public async cleanup(): Promise<void> {
        this.logger.log('Cleaning up scraper resources...');
        await this.mcpClient.close();
    }
}
