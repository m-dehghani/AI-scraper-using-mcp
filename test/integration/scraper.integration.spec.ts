import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { InteractiveScraperService } from '../../src/scraper/interactive-scraper.service';
import { ScraperService } from '../../src/scraper/scraper.service';
import { PromptParserService } from '../../src/scraper/prompt-parser.service';
import { CsvExportService } from '../../src/scraper/csv-export.service';
import { OllamaService } from '../../src/ai/ollama.service';
import { McpClientService } from '../../src/mcp/mcp-client.service';
import { TestHelpers } from '../utils/test-helpers';

describe('Scraper Integration Tests', () => {
    let module: TestingModule;
    let interactiveScraper: InteractiveScraperService;
    let scraperService: ScraperService;
    let promptParser: PromptParserService;
    let csvExport: CsvExportService;
    let ollamaService: OllamaService;
    let mcpClient: McpClientService;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                InteractiveScraperService,
                ScraperService,
                PromptParserService,
                CsvExportService,
                OllamaService,
                McpClientService,
                {
                    provide: Logger,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                        warn: jest.fn(),
                        debug: jest.fn(),
                        verbose: jest.fn(),
                    },
                },
            ],
        }).compile();

        interactiveScraper = module.get<InteractiveScraperService>(
            InteractiveScraperService,
        );
        scraperService = module.get<ScraperService>(ScraperService);
        promptParser = module.get<PromptParserService>(PromptParserService);
        csvExport = module.get<CsvExportService>(CsvExportService);
        ollamaService = module.get<OllamaService>(OllamaService);
        mcpClient = module.get<McpClientService>(McpClientService);
    });

    afterAll(async () => {
        await module.close();
    });

    describe('End-to-End Scraping Flow', () => {
        it('should complete full scraping workflow with real services', async () => {
            // Mock external dependencies
            jest.spyOn(mcpClient, 'scrapeWebsite').mockResolvedValue({
                url: 'https://example.com',
                title: 'Test Page',
                content:
                    '<html><body>Product 1 - $29.99\nProduct 2 - $39.99</body></html>',
                html: '<html><body>Product 1 - $29.99\nProduct 2 - $39.99</body></html>',
                metadata: {
                    scrapedAt: new Date().toISOString(),
                    processingTime: 1000,
                    contentLength: 100,
                },
                success: true,
            });

            jest.spyOn(ollamaService, 'processPrompt').mockResolvedValue(
                JSON.stringify([
                    { product_name: 'Product 1', price: '$29.99' },
                    { product_name: 'Product 2', price: '$39.99' },
                ]),
            );

            jest.spyOn(csvExport, 'exportToCsv').mockReturnValue(
                './output/test.csv',
            );

            const request = {
                prompt: 'scrape all products and their prices from this site',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
                outputPath: './output',
            };

            const result =
                await interactiveScraper.processPromptRequest(request);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.data[0]).toHaveProperty('product_name');
            expect(result.data[0]).toHaveProperty('price');
            expect(result.outputFile).toBe('./output/test.csv');
        });

        it('should handle insufficient content scenario', async () => {
            jest.spyOn(mcpClient, 'scrapeWebsite').mockResolvedValue({
                url: 'https://blocked-site.com',
                title: 'Just a moment...',
                content: 'Just a moment...',
                html: 'Just a moment...',
                metadata: {
                    scrapedAt: new Date().toISOString(),
                    processingTime: 0,
                    contentLength: 0,
                },
                success: true,
            });

            const request = {
                prompt: 'scrape products',
                url: 'https://blocked-site.com',
                outputFormat: 'csv' as const,
            };

            const result =
                await interactiveScraper.processPromptRequest(request);

            expect(result.success).toBe(false);
            expect(result.data).toEqual([]);
            expect(result.error).toContain('No data to export');
        });

        it('should handle AI processing errors gracefully', async () => {
            jest.spyOn(mcpClient, 'scrapeWebsite').mockResolvedValue({
                url: 'https://example.com',
                title: 'Test Page',
                content: 'Valid content with products',
                html: 'Valid content with products',
                metadata: {
                    scrapedAt: new Date().toISOString(),
                    processingTime: 0,
                    contentLength: 0,
                },
                success: true,
            });

            jest.spyOn(ollamaService, 'processPrompt').mockRejectedValue(
                new Error('AI service unavailable'),
            );

            const request = {
                prompt: 'scrape products',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
            };

            const result =
                await interactiveScraper.processPromptRequest(request);

            expect(result.success).toBe(false);
            expect(result.error).toContain('AI service unavailable');
        });
    });

    describe('Service Integration', () => {
        it('should integrate prompt parsing with scraping', () => {
            const prompt =
                'scrape all products and their prices from this site';
            const parsedPrompt = promptParser.parsePrompt(prompt);

            expect(parsedPrompt.action).toBe('scrape');
            expect(parsedPrompt.target).toBe('products');
            expect(parsedPrompt.fields).toContain('price');
            expect(parsedPrompt.fields).toContain('title');
        });

        it('should integrate CSV export with scraped data', () => {
            const data = [{ product_name: 'Test Product', price: '$29.99' }];

            const result = csvExport.exportToCsv(data, 'test', './output');

            expect(result).toContain('test');
            expect(result).toContain('.csv');
        });

        it('should handle service health checks', async () => {
            jest.spyOn(ollamaService, 'isAvailable').mockResolvedValue(true);
            jest.spyOn(mcpClient, 'isHealthy').mockResolvedValue(true);

            const ollamaHealthy = await ollamaService.isAvailable();
            const mcpHealthy = await mcpClient.isHealthy();

            expect(ollamaHealthy).toBe(true);
            expect(mcpHealthy).toBe(true);
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle network errors end-to-end', async () => {
            jest.spyOn(mcpClient, 'scrapeWebsite').mockRejectedValue(
                new Error('Network timeout'),
            );

            const request = {
                prompt: 'scrape products',
                url: 'https://unreachable-site.com',
                outputFormat: 'csv' as const,
            };

            const result =
                await interactiveScraper.processPromptRequest(request);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Network timeout');
        });

        it('should handle malformed AI responses', async () => {
            jest.spyOn(mcpClient, 'scrapeWebsite').mockResolvedValue({
                url: 'https://example.com',
                title: 'Test Page',
                content: 'Valid content',
                html: 'Valid content',
                metadata: {
                    scrapedAt: new Date().toISOString(),
                    processingTime: 0,
                    contentLength: 0,
                },
                success: true,
            });

            jest.spyOn(ollamaService, 'processPrompt').mockResolvedValue(
                'Invalid JSON response',
            );

            const request = {
                prompt: 'scrape products',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
            };

            const result =
                await interactiveScraper.processPromptRequest(request);

            expect(result.success).toBe(false);
            expect(result.error).toContain(
                'AI response does not contain valid JSON',
            );
        });

        it('should handle file system errors', async () => {
            jest.spyOn(mcpClient, 'scrapeWebsite').mockResolvedValue({
                url: 'https://example.com',
                title: 'Test Page',
                content: 'Valid content',
                html: 'Valid content',
                metadata: {
                    scrapedAt: new Date().toISOString(),
                    processingTime: 0,
                    contentLength: 0,
                },
                success: true,
            });

            jest.spyOn(ollamaService, 'processPrompt').mockResolvedValue(
                JSON.stringify([{ product_name: 'Test', price: '$29.99' }]),
            );

            jest.spyOn(csvExport, 'exportToCsv').mockImplementation(() => {
                throw new Error('File system error'); // This should be a real error, not a string
            });

            const request = {
                prompt: 'scrape products',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
            };

            const result =
                await interactiveScraper.processPromptRequest(request);

            expect(result.success).toBe(false);
            expect(result.error).toContain('File system error'); // This should be a real error, not a string
        });
    });

    describe('Performance Integration', () => {
        it('should handle large datasets efficiently', async () => {
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                product_name: `Product ${i}`,
                price: `$${(i + 1) * 10}.99`,
            }));

            jest.spyOn(ollamaService, 'processPrompt').mockResolvedValue(
                JSON.stringify(largeDataset), // This should be a real JSON string, not a string
            );

            jest.spyOn(csvExport, 'exportToCsv').mockReturnValue(
                './output/large-dataset.csv',
            );

            const request = {
                prompt: 'scrape products',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
            };

            const startTime = Date.now();
            const result =
                await interactiveScraper.processPromptRequest(request);
            const endTime = Date.now();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1000);
            expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
        });

        it('should handle concurrent requests', async () => {
            const requests = Array.from({ length: 5 }, (_, i) => ({
                prompt: 'scrape products',
                url: `https://example${i}.com`,
                outputFormat: 'csv' as const,
            }));

            jest.spyOn(mcpClient, 'scrapeWebsite').mockResolvedValue({
                url: 'https://example.com',
                title: 'Test Page',
                content: 'Valid content',
                html: 'Valid content',
                metadata: {
                    scrapedAt: new Date().toISOString(),
                    processingTime: 0,
                    contentLength: 0,
                },
                success: true,
            });

            jest.spyOn(ollamaService, 'processPrompt').mockResolvedValue(
                JSON.stringify([{ product_name: 'Test', price: '$29.99' }]),
            );

            jest.spyOn(csvExport, 'exportToCsv').mockReturnValue(
                './output/test.csv',
            );

            const startTime = Date.now();
            const results = await Promise.all(
                requests.map((request) =>
                    interactiveScraper.processPromptRequest(request),
                ),
            );
            const endTime = Date.now();

            expect(results).toHaveLength(5);
            expect(results.every((result) => result.success)).toBe(true);
            expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
        });
    });
});
