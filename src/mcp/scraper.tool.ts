import { Injectable, Logger } from '@nestjs/common';
import { Tool } from './mcp.types';
import { z } from 'zod';
import { ScraperService } from '../scraper/scraper.service';
import { ScrapingJobOptions } from '../scraper/interfaces';
import { XRayParserService } from '../scraper/xray-parser.service';

const ScrapingOptionsSchema = z.object({
    url: z.string().url('Invalid URL format'),
    maxScrolls: z.number().min(1).max(100).default(20),
    scrollDelay: z.number().min(500).max(10000).default(2000),
    analysisType: z
        .enum(['summary', 'extract', 'categorize'])
        .default('summary'),
    model: z.string().default('llama3'),
    chunkSize: z.number().min(500).max(5000).default(2000),
});

const BatchScrapingOptionsSchema = z.object({
    urls: z.array(z.string().url('Invalid URL format')).min(1).max(10),
    maxScrolls: z.number().min(1).max(100).default(20),
    scrollDelay: z.number().min(500).max(10000).default(2000),
    analysisType: z
        .enum(['summary', 'extract', 'categorize'])
        .default('summary'),
    model: z.string().default('llama3'),
    chunkSize: z.number().min(500).max(5000).default(2000),
});

const StructuredDataSchema = z.object({
    url: z.string().url('Invalid URL format'),
    schema: z
        .string()
        .min(10, 'Schema description must be at least 10 characters'),
    maxScrolls: z.number().min(1).max(100).default(20),
    scrollDelay: z.number().min(500).max(10000).default(2000),
    model: z.string().default('llama3'),
});

@Injectable()
export class ScraperTool {
    private readonly logger = new Logger(ScraperTool.name);

    constructor(
        private readonly scraperService: ScraperService,
        private readonly xrayParser: XRayParserService,
    ) {}

    @Tool({
        name: 'scrape-infinite-scroll',
        description:
            'Scrapes content from a web page with infinite scroll functionality and analyzes it using AI',
        parameters: ScrapingOptionsSchema,
    })
    public async scrapeInfiniteScroll(params: any): Promise<any> {
        try {
            this.logger.log(
                `Starting infinite scroll scraping for: ${params.url}`,
            );

            const options: ScrapingJobOptions = {
                maxScrolls: params.maxScrolls,
                scrollDelay: params.scrollDelay,
                analysisType: params.analysisType,
                model: params.model,
                chunkSize: params.chunkSize,
            };

            const result = await this.scraperService.scrapeAndAnalyze(
                params.url,
                options,
            );

            this.logger.log('Scraping completed successfully');
            return {
                success: true,
                data: result,
                message: 'Content scraped and analyzed successfully',
            };
        } catch (error) {
            this.logger.error('Scraping failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to scrape content',
            };
        }
    }

    @Tool({
        name: 'scrape-batch-urls',
        description:
            'Scrapes multiple URLs in batch with infinite scroll and AI analysis',
        parameters: BatchScrapingOptionsSchema,
    })
    public async scrapeBatchUrls(params: any): Promise<any> {
        try {
            this.logger.log(
                `Starting batch scraping for ${params.urls.length} URLs`,
            );

            const options: ScrapingJobOptions = {
                maxScrolls: params.maxScrolls,
                scrollDelay: params.scrollDelay,
                analysisType: params.analysisType,
                model: params.model,
                chunkSize: params.chunkSize,
            };

            const results = [];
            for (let i = 0; i < params.urls.length; i++) {
                const url = params.urls[i];
                this.logger.log(
                    `Processing URL ${i + 1}/${params.urls.length}: ${url}`,
                );

                try {
                    const result = await this.scraperService.scrapeAndAnalyze(
                        url,
                        options,
                    );
                    results.push({
                        url,
                        success: true,
                        data: result,
                    });
                } catch (error) {
                    this.logger.error(`Failed to scrape ${url}:`, error);
                    results.push({
                        url,
                        success: false,
                        error:
                            error instanceof Error
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
        } catch (error) {
            this.logger.error('Batch scraping failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to perform batch scraping',
            };
        }
    }

    @Tool({
        name: 'extract-structured-data',
        description:
            'Extracts structured data from a web page based on a custom schema using AI',
        parameters: StructuredDataSchema,
    })
    public async extractStructuredData(params: any): Promise<any> {
        try {
            this.logger.log(`Extracting structured data from: ${params.url}`);

            const options: ScrapingJobOptions = {
                maxScrolls: params.maxScrolls,
                scrollDelay: params.scrollDelay,
                analysisType: 'extract',
                model: params.model,
            };

            const result = await this.scraperService.scrapeAndAnalyze(
                params.url,
                options,
            );

            // Use AI to extract structured data based on the schema
            const structuredData =
                await this.scraperService.extractStructuredData(
                    params.url,
                    params.schema,
                    options,
                );

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
        } catch (error) {
            this.logger.error('Structured data extraction failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to extract structured data',
            };
        }
    }

    @Tool({
        name: 'scraper-health-check',
        description: 'Checks the health status of the scraper services',
        parameters: z.object({}),
    })
    public async healthCheck(): Promise<any> {
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
        } catch (error) {
            this.logger.error('Health check failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Health check failed',
            };
        }
    }

    @Tool({
        name: 'scrape-with-xray',
        description:
            'Scrapes content from a web page using X-Ray with schema-based extraction',
        parameters: z.object({
            url: z.string().url('Invalid URL format'),
            schema: z
                .record(z.string())
                .describe('X-Ray schema for data extraction'),
        }),
    })
    public async scrapeWithXRay(params: any): Promise<any> {
        try {
            this.logger.log(`Scraping with X-Ray: ${params.url}`);

            const result = await this.xrayParser.scrapeUrl(
                params.url,
                params.schema,
            );

            this.logger.log('X-Ray scraping completed successfully');
            return {
                success: true,
                url: result.url,
                data: result.data,
                metadata: result.metadata,
            };
        } catch (error) {
            this.logger.error('X-Ray scraping failed', error);
            return {
                success: false,
                url: params.url,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    @Tool({
        name: 'get-xray-schemas',
        description:
            'Returns common X-Ray schemas for different types of content',
        parameters: z.object({}),
    })
    public getXRaySchemas() {
        try {
            this.logger.log('Getting X-Ray schemas');

            const schemas = this.xrayParser.getCommonSchemas();

            return {
                success: true,
                schemas,
                description: 'Common X-Ray schemas for different content types',
            };
        } catch (error) {
            this.logger.error('Failed to get X-Ray schemas', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
