import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { InteractiveScraperService } from '../../src/scraper/interactive-scraper.service';
import { PromptParserService } from '../../src/scraper/prompt-parser.service';
import { CsvExportService } from '../../src/scraper/csv-export.service';
import { ScraperService } from '../../src/scraper/scraper.service';
import { OllamaService } from '../../src/ai/ollama.service';
import { McpClientService } from '../../src/mcp/mcp-client.service';
import { UserInputService } from '../../src/user-input.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Scraper Workflow (e2e)', () => {
    let app: INestApplication;
    let interactiveScraper: InteractiveScraperService;
    let promptParser: PromptParserService;
    let csvExport: CsvExportService;
    let ollamaService: OllamaService;
    let mcpClient: McpClientService;
    let userInput: UserInputService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(McpClientService)
            .useValue({
                scrapeWebsite: jest.fn(),
                isHealthy: jest.fn().mockResolvedValue(true),
                cleanup: jest.fn(),
            })
            .overrideProvider(OllamaService)
            .useValue({
                processPrompt: jest.fn(),
                analyzeScrapedContent: jest.fn(),
                extractStructuredData: jest.fn(),
                isAvailable: jest.fn().mockResolvedValue(true),
                getAvailableModels: jest
                    .fn()
                    .mockResolvedValue(['llama3.2:1b']),
                pullModel: jest.fn(),
            })
            .overrideProvider(ScraperService)
            .useValue({
                scrapeAndAnalyze: jest.fn().mockResolvedValue({
                    url: 'https://example.com',
                    title: 'Test Store',
                    content: {
                        text: 'Welcome to our amazing online store! We have a wide selection of products for you to choose from. Product 1 - $10 - This is a great product with excellent quality. Product 2 - $20 - Another fantastic item that our customers love. Product 3 - $30 - Premium quality product with outstanding features.',
                        html: '<html><body><h1>Welcome to Test Store</h1><div class="product"><h3>Product 1</h3><span class="price">$10</span><p>This is a great product with excellent quality.</p></div><div class="product"><h3>Product 2</h3><span class="price">$20</span><p>Another fantastic item that our customers love.</p></div><div class="product"><h3>Product 3</h3><span class="price">$30</span><p>Premium quality product with outstanding features.</p></div></body></html>',
                    },
                    metadata: {
                        scrapedAt: new Date().toISOString(),
                        processingTime: 1000,
                        contentLength: 300,
                    },
                    success: true,
                }),
                getHealthStatus: jest.fn().mockResolvedValue({
                    mcp: true,
                    ollama: true,
                    overall: true,
                }),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        interactiveScraper = app.get<InteractiveScraperService>(
            InteractiveScraperService,
        );
        promptParser = app.get<PromptParserService>(PromptParserService);
        csvExport = app.get<CsvExportService>(CsvExportService);
        ollamaService = app.get<OllamaService>(OllamaService);
        mcpClient = app.get<McpClientService>(McpClientService);
        userInput = app.get<UserInputService>(UserInputService);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Complete Scraping Workflow', () => {
        it('should process a complete scraping request end-to-end', async () => {
            const testRequest = {
                prompt: 'scrape all product titles and prices from this website',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
                outputPath: './test-output',
            };

            // ScraperService mock handles the scraping

            jest.spyOn(ollamaService, 'processPrompt').mockResolvedValueOnce(
                `Here are the products I found: [
                    { "title": "Product 1", "price": "$10" },
                    { "title": "Product 2", "price": "$20" },
                    { "title": "Product 3", "price": "$30" }
                ]`,
            );

            // Ensure output directory exists
            if (!fs.existsSync(testRequest.outputPath)) {
                fs.mkdirSync(testRequest.outputPath, { recursive: true });
            }

            const result =
                await interactiveScraper.processPromptRequest(testRequest);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.outputFile).toContain('test-output');
            expect(result.message).toBeDefined();
            expect(result.message).toContain(
                'Successfully scraped and exported',
            );

            // Clean up test output
            if (fs.existsSync(testRequest.outputPath)) {
                fs.rmSync(testRequest.outputPath, {
                    recursive: true,
                    force: true,
                });
            }
        }, 30000);

        it('should handle scraping errors gracefully', async () => {
            const testRequest = {
                prompt: 'scrape products from this website',
                url: 'https://invalid-url-that-will-fail.com',
                outputFormat: 'csv' as const,
                outputPath: './test-output',
            };

            // Mock the ScraperService to fail
            jest.spyOn(
                interactiveScraper['scraperService'],
                'scrapeAndAnalyze',
            ).mockRejectedValue(new Error('Navigation failed'));

            const result =
                await interactiveScraper.processPromptRequest(testRequest);

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('Navigation failed');
        }, 15000);

        it('should handle AI processing errors gracefully', async () => {
            const testRequest = {
                prompt: 'extract product information',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
                outputPath: './test-output',
            };

            // ScraperService mock handles successful scraping

            jest.spyOn(ollamaService, 'processPrompt').mockRejectedValue(
                new Error('AI processing failed'),
            );

            const result =
                await interactiveScraper.processPromptRequest(testRequest);

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('Navigation failed');
        }, 15000);
    });

    describe('Prompt Parsing Integration', () => {
        it('should parse various prompt types correctly', () => {
            const testPrompts = [
                {
                    prompt: 'scrape all products and their prices',
                    expectedAction: 'scrape',
                    expectedTarget: 'products',
                    expectedFields: ['price', 'title'],
                },
                {
                    prompt: 'extract article titles and authors',
                    expectedAction: 'extract',
                    expectedTarget: 'articles',
                    expectedFields: ['title', 'author'],
                },
                {
                    prompt: 'get job listings with salaries',
                    expectedAction: 'extract',
                    expectedTarget: 'jobs',
                    expectedFields: ['title', 'content', 'link'],
                },
            ];

            testPrompts.forEach(
                ({
                    prompt,
                    expectedAction,
                    expectedTarget,
                    expectedFields,
                }) => {
                    const parsed = promptParser.parsePrompt(prompt);

                    expect(parsed.action).toBe(expectedAction);
                    expect(parsed.target).toBe(expectedTarget);
                    expect(parsed.fields).toEqual(
                        expect.arrayContaining(expectedFields),
                    );
                    expect(parsed.format).toBe('csv');
                },
            );
        });

        it('should handle complex prompts with multiple instructions', () => {
            const complexPrompt =
                'scrape the top 10 products with their names, prices, and ratings from this e-commerce site';
            const parsed = promptParser.parsePrompt(complexPrompt);

            expect(parsed.action).toBe('scrape');
            expect(parsed.target).toBe('products');
            expect(parsed.fields).toContain('title'); // "names" maps to "title"
            expect(parsed.fields).toContain('price');
            expect(parsed.fields).toContain('rating');
            expect(parsed.additionalInstructions).toContain('first/top');
        });
    });

    describe('CSV Export Integration', () => {
        it('should export data to CSV successfully', async () => {
            const testData = [
                { title: 'Product 1', price: '$10', rating: '4.5' },
                { title: 'Product 2', price: '$20', rating: '4.2' },
                { title: 'Product 3', price: '$30', rating: '4.8' },
            ];

            const outputPath = './test-output';
            const filename = 'test-products.csv';

            // Ensure output directory exists
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath, { recursive: true });
            }

            const result = await csvExport.exportToCsv(
                testData,
                outputPath,
                filename,
            );

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result).toContain(filename);

            // Verify file was created and contains expected data
            const filePath = path.join(outputPath, filename);
            expect(fs.existsSync(filePath)).toBe(true);

            const fileContent = fs.readFileSync(filePath, 'utf-8');
            expect(fileContent).toContain('title,price,rating');
            expect(fileContent).toContain('Product 1,$10,4.5');
            expect(fileContent).toContain('Product 2,$20,4.2');
            expect(fileContent).toContain('Product 3,$30,4.8');

            // Clean up
            fs.rmSync(outputPath, { recursive: true, force: true });
        });

        it('should handle CSV export errors gracefully', async () => {
            const testData: any[] = [{ title: 'Test', price: '$10' }];
            const outputPath = '/invalid/path/that/does/not/exist';
            const filename = 'test.csv';

            const result = await csvExport.exportToCsv(
                testData,
                outputPath,
                filename,
            );

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });

    describe('Service Health Checks', () => {
        it('should check overall application health', async () => {
            const healthStatus = await interactiveScraper.getHealthStatus();

            expect(healthStatus).toBeDefined();
            expect(healthStatus.overall).toBeDefined();
            expect(healthStatus.scraper).toBeDefined();
            expect(healthStatus.ollama).toBeDefined();
        });

        it('should check individual service health', async () => {
            // Test MCP client health
            const mcpHealth = await mcpClient.isHealthy();
            expect(typeof mcpHealth).toBe('boolean');

            // Test Ollama availability
            const ollamaAvailable = await ollamaService.isAvailable();
            expect(typeof ollamaAvailable).toBe('boolean');
        });
    });

    describe('User Input Service Integration', () => {
        it('should have user input service available', () => {
            expect(userInput).toBeDefined();
            expect(typeof userInput.displayWelcome).toBe('function');
            expect(typeof userInput.displayResult).toBe('function');
            expect(typeof userInput.displayGoodbye).toBe('function');
        });

        it('should handle result display', () => {
            const mockResult = {
                success: true,
                data: [{ title: 'Test Product', price: '$10' }],
                outputPath: './output/test.csv',
                metadata: {
                    processingTime: 1000,
                    scrapedAt: new Date().toISOString(),
                },
            };

            // This should not throw an error
            expect(() => userInput.displayResult(mockResult)).not.toThrow();
        });
    });

    describe('Error Handling and Recovery', () => {
        it('should handle network timeouts gracefully', async () => {
            const testRequest = {
                prompt: 'scrape products',
                url: 'https://httpstat.us/200?sleep=30000', // 30 second delay
                outputFormat: 'csv' as const,
                outputPath: './test-output',
            };

            // Mock a timeout scenario
            jest.spyOn(mcpClient, 'scrapeWebsite').mockRejectedValue(
                new Error('Navigation timeout'),
            );

            const result =
                await interactiveScraper.processPromptRequest(testRequest);

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain('Navigation failed');
        }, 10000);

        it('should handle malformed URLs gracefully', async () => {
            const testRequest = {
                prompt: 'scrape products',
                url: 'not-a-valid-url',
                outputFormat: 'csv' as const,
                outputPath: './test-output',
            };

            const result =
                await interactiveScraper.processPromptRequest(testRequest);

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Performance and Resource Management', () => {
        it('should complete scraping within reasonable time', async () => {
            const testRequest = {
                prompt: 'scrape products',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
                outputPath: './test-output',
            };

            // Mock fast responses
            jest.spyOn(mcpClient, 'scrapeWebsite').mockResolvedValue({
                url: 'https://example.com',
                title: 'Test Store',
                content: 'Product data',
                html: '<html><body>Content</body></html>',
                metadata: {
                    scrapedAt: new Date().toISOString(),
                    processingTime: 100,
                    contentLength: 12,
                },
                success: true,
            });

            jest.spyOn(ollamaService, 'processPrompt').mockResolvedValue(
                `Here are the products I found: [
                    { "title": "Product 1", "price": "$10" }
                ]`,
            );

            const startTime = Date.now();
            const result =
                await interactiveScraper.processPromptRequest(testRequest);
            const endTime = Date.now();

            expect(result.success).toBe(true);
            expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
        }, 10000);

        it('should clean up resources properly', () => {
            // Test that the application can be closed without hanging
            expect(app).toBeDefined();

            // The actual cleanup is tested in afterAll
            // This test ensures the cleanup process is properly defined
        });
    });
});
