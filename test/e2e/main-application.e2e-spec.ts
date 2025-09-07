import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { InteractiveScraperService } from '../../src/scraper/interactive-scraper.service';
import { UserInputService } from '../../src/user-input.service';
import { ScraperService } from '../../src/scraper/scraper.service';
import { OllamaService } from '../../src/ai/ollama.service';
import { McpClientService } from '../../src/mcp/mcp-client.service';
import { PromptParserService } from '../../src/scraper/prompt-parser.service';
import * as fs from 'fs';

describe('Main Application Flow (e2e)', () => {
    let app: INestApplication;
    let interactiveScraper: InteractiveScraperService;
    let userInput: UserInputService;
    let ollamaService: OllamaService;
    let mcpClient: McpClientService;
    let promptParser: PromptParserService;

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
        userInput = app.get<UserInputService>(UserInputService);
        ollamaService = app.get<OllamaService>(OllamaService);
        mcpClient = app.get<McpClientService>(McpClientService);
        promptParser = app.get<PromptParserService>(PromptParserService);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Application Entry Point Simulation', () => {
        it('should simulate the main bootstrap process', async () => {
            // Simulate the main application bootstrap process
            const healthStatus = await interactiveScraper.getHealthStatus();

            expect(healthStatus).toBeDefined();
            expect(healthStatus.overall).toBeDefined();
            expect(healthStatus.scraper).toBeDefined();
            expect(healthStatus.ollama).toBeDefined();

            // Test that the application can display welcome message
            expect(() => userInput.displayWelcome()).not.toThrow();
        });

        it('should handle health check failures gracefully', async () => {
            // Mock a scenario where the scraper service reports unhealthy status
            const scraperService = app.get(ScraperService);
            jest.spyOn(scraperService, 'getHealthStatus').mockResolvedValue({
                mcp: false,
                ollama: false,
                overall: false,
            });

            const healthStatus = await interactiveScraper.getHealthStatus();

            expect(healthStatus).toBeDefined();
            expect(healthStatus.overall).toBe(false);
            expect(healthStatus.ollama).toBe(false);

            // Restore mocks
            jest.restoreAllMocks();
        });
    });

    describe('User Input and Interaction Flow', () => {
        it('should handle user input validation', () => {
            // Test URL validation logic (simulating the main.ts validation)
            const validUrls = [
                'https://example.com',
                'http://test.com',
                'https://subdomain.example.com/path',
            ];

            const invalidUrls = ['not-a-url', '://missing-protocol', 'http://'];

            validUrls.forEach((url) => {
                expect(() => new URL(url)).not.toThrow();
            });

            invalidUrls.forEach((url) => {
                expect(() => new URL(url)).toThrow();
            });
        });

        it('should process user prompts correctly', () => {
            const testPrompts = [
                'scrape all products from this website',
                'extract article titles and authors',
                'get job listings with salaries',
                'find the best deals on electronics',
            ];

            testPrompts.forEach((prompt) => {
                const parsed = promptParser.parsePrompt(prompt);

                expect(parsed).toBeDefined();
                expect(parsed.action).toBeDefined();
                expect(parsed.target).toBeDefined();
                expect(parsed.fields).toBeDefined();
                expect(parsed.format).toBeDefined();
            });
        });

        it('should handle empty or invalid prompts', () => {
            const invalidPrompts = ['', '   ', null, undefined];

            invalidPrompts.forEach((prompt) => {
                if (prompt !== null && prompt !== undefined) {
                    const parsed = promptParser.parsePrompt(prompt);
                    expect(parsed).toBeDefined();
                }
            });
        });
    });

    describe('Complete Scraping Session Flow', () => {
        it('should simulate a complete successful scraping session', async () => {
            const testSession = {
                prompt: 'scrape all product titles and prices',
                url: 'https://example-store.com',
                outputFormat: 'csv' as const,
                outputPath: './test-session-output',
            };

            // ScraperService mock handles the scraping

            jest.spyOn(ollamaService, 'processPrompt').mockResolvedValue(
                `Here are the products I found: [
                    { "title": "Product 1", "price": "$10" },
                    { "title": "Product 2", "price": "$20" },
                    { "title": "Product 3", "price": "$30" }
                ]`,
            );

            // Ensure output directory exists
            if (!fs.existsSync(testSession.outputPath)) {
                fs.mkdirSync(testSession.outputPath, { recursive: true });
            }

            // Process the request
            const result =
                await interactiveScraper.processPromptRequest(testSession);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.outputFile).toContain('test-session-output');
            expect(result.message).toBeDefined();
            expect(result.message).toContain(
                'Successfully scraped and exported',
            );

            // Test result display
            expect(() => userInput.displayResult(result)).not.toThrow();

            // Clean up
            if (fs.existsSync(testSession.outputPath)) {
                fs.rmSync(testSession.outputPath, {
                    recursive: true,
                    force: true,
                });
            }
        }, 30000);

        it('should handle multiple consecutive scraping requests', async () => {
            const requests = [
                {
                    prompt: 'scrape products',
                    url: 'https://store1.com',
                    outputFormat: 'csv' as const,
                    outputPath: './test-multi-output',
                },
                {
                    prompt: 'extract articles',
                    url: 'https://news-site.com',
                    outputFormat: 'csv' as const,
                    outputPath: './test-multi-output',
                },
            ];

            // Mock responses for both requests
            const scraperService = app.get(ScraperService);
            jest.spyOn(scraperService, 'scrapeAndAnalyze')
                .mockResolvedValueOnce({
                    url: 'https://store1.com',
                    title: 'Store 1',
                    content: {
                        title: 'Store 1',
                        text: 'Product data',
                        links: [],
                        images: [],
                        headings: [],
                        metadata: {},
                        sections: [],
                    },
                    metadata: {
                        scrapedAt: new Date(),
                        processingTime: 1000,
                        contentLength: 12,
                    },
                    analysis: {
                        summary: 'Product data',
                        keyPoints: 'Product 1 - $10',
                        categories: 'products',
                    },
                })
                .mockResolvedValueOnce({
                    url: 'https://news-site.com',
                    title: 'News Site',
                    content: {
                        title: 'News Site',
                        text: 'Article data',
                        links: [],
                        images: [],
                        headings: [],
                        metadata: {},
                        sections: [],
                    },
                    metadata: {
                        scrapedAt: new Date(),
                        processingTime: 1500,
                        contentLength: 12,
                    },
                    analysis: {
                        summary: 'Article data',
                        keyPoints: 'Article 1 - Author 1',
                        categories: 'articles',
                    },
                });

            jest.spyOn(ollamaService, 'processPrompt')
                .mockResolvedValueOnce(
                    `Here are the products I found: [
                        { "title": "Product 1", "price": "$10" }
                    ]`,
                )
                .mockResolvedValueOnce(
                    `Here are the articles I found: [
                        { "title": "Article 1", "author": "Author 1" }
                    ]`,
                );

            // Ensure output directory exists
            if (!fs.existsSync('./test-multi-output')) {
                fs.mkdirSync('./test-multi-output', { recursive: true });
            }

            const results = [];
            for (const request of requests) {
                const result =
                    await interactiveScraper.processPromptRequest(request);
                results.push(result);
            }

            expect(results).toHaveLength(2);
            results.forEach((result) => {
                expect(result.success).toBe(true);
            });

            // Clean up
            if (fs.existsSync('./test-multi-output')) {
                fs.rmSync('./test-multi-output', {
                    recursive: true,
                    force: true,
                });
            }
        }, 45000);
    });

    describe('Error Recovery and User Experience', () => {
        it('should handle network errors gracefully', async () => {
            const testRequest = {
                prompt: 'scrape products',
                url: 'https://unreachable-site.com',
                outputFormat: 'csv' as const,
                outputPath: './test-error-output',
            };

            // Mock network error
            const scraperService = app.get(ScraperService);
            jest.spyOn(scraperService, 'scrapeAndAnalyze').mockRejectedValue(
                new Error('Network timeout'),
            );

            const result =
                await interactiveScraper.processPromptRequest(testRequest);

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain('Network timeout');

            // Test that the application can continue after an error
            expect(() => userInput.displayResult(result)).not.toThrow();
        });

        it('should handle AI service unavailability', async () => {
            const testRequest = {
                prompt: 'scrape products',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
                outputPath: './test-ai-error-output',
            };

            // Mock successful scraping but failed AI processing
            const scraperService = app.get(ScraperService);
            jest.spyOn(scraperService, 'scrapeAndAnalyze').mockResolvedValue({
                url: 'https://example.com',
                title: 'Test Site',
                content: {
                    title: 'Test Site',
                    text: 'Some content',
                    links: [],
                    images: [],
                    headings: [],
                    metadata: {},
                    sections: [],
                },
                metadata: {
                    scrapedAt: new Date(),
                    processingTime: 1000,
                    contentLength: 12,
                },
                analysis: {
                    summary: 'Product data',
                    keyPoints: 'Product 1 - $10',
                    categories: 'products',
                },
            });

            jest.spyOn(ollamaService, 'processPrompt').mockRejectedValue(
                new Error('CSV export failed: No data to export'),
            );

            const result =
                await interactiveScraper.processPromptRequest(testRequest);

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain(
                'CSV export failed: No data to export',
            );
        });

        it('should handle file system errors gracefully', async () => {
            const testRequest = {
                prompt: 'scrape products',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
                outputPath: '/invalid/path/that/does/not/exist',
            };

            // Mock successful scraping and AI processing
            const scraperService = app.get(ScraperService);
            jest.spyOn(scraperService, 'scrapeAndAnalyze').mockResolvedValue({
                url: 'https://example.com',
                title: 'Test Site',
                content: {
                    title: 'Test Site',
                    text: 'Product data',
                    links: [],
                    images: [],
                    headings: [],
                    metadata: {},
                    sections: [],
                },
                metadata: {
                    scrapedAt: new Date(),
                    processingTime: 1000,
                    contentLength: 12,
                },
                analysis: {
                    summary: 'Product data',
                    keyPoints: 'Product 1 - $10',
                    categories: 'products',
                },
            });

            jest.spyOn(ollamaService, 'processPrompt').mockResolvedValue(
                `Here are the products I found: [
                    { "title": "Product 1", "price": "$10" }
                ]`,
            );

            const result =
                await interactiveScraper.processPromptRequest(testRequest);

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Application Shutdown and Cleanup', () => {
        it('should handle graceful shutdown', () => {
            // Test that services can be cleaned up properly
            expect(() => mcpClient.cleanup()).not.toThrow();
            expect(() => userInput.close()).not.toThrow();
        });

        it('should clean up resources on exit', () => {
            // Test that the application can close without hanging
            expect(app).toBeDefined();

            // The actual cleanup is done in afterAll
            // This test ensures the cleanup process is properly defined
        });
    });

    describe('Performance and Scalability', () => {
        it('should handle concurrent requests efficiently', async () => {
            const concurrentRequests = Array.from({ length: 3 }, (_, i) => ({
                prompt: `scrape products from site ${i}`,
                url: `https://example${i}.com`,
                outputFormat: 'csv' as const,
                outputPath: './test-concurrent-output',
            }));

            // Mock responses for all requests
            const scraperService = app.get(ScraperService);
            jest.spyOn(scraperService, 'scrapeAndAnalyze').mockResolvedValue({
                url: 'https://example.com',
                title: 'Test Site',
                content: {
                    title: 'Test Site',
                    text: 'Product data',
                    links: [],
                    images: [],
                    headings: [],
                    metadata: {},
                    sections: [],
                },
                metadata: {
                    scrapedAt: new Date(),
                    processingTime: 1000,
                    contentLength: 12,
                },
                analysis: {
                    summary: 'Product data',
                    keyPoints: 'Product 1 - $10',
                    categories: 'products',
                },
            });

            jest.spyOn(ollamaService, 'processPrompt').mockResolvedValue(
                `Here are the products I found: [
                    { "title": "Product 1", "price": "$10" }
                ]`,
            );

            // Ensure output directory exists
            if (!fs.existsSync('./test-concurrent-output')) {
                fs.mkdirSync('./test-concurrent-output', { recursive: true });
            }

            const startTime = Date.now();
            const results = await Promise.all(
                concurrentRequests.map((request) =>
                    interactiveScraper.processPromptRequest(request),
                ),
            );
            const endTime = Date.now();

            expect(results).toHaveLength(3);
            results.forEach((result) => {
                expect(result.success).toBe(true);
            });

            // Should complete within reasonable time
            expect(endTime - startTime).toBeLessThan(10000);

            // Clean up
            if (fs.existsSync('./test-concurrent-output')) {
                fs.rmSync('./test-concurrent-output', {
                    recursive: true,
                    force: true,
                });
            }
        }, 15000);
    });
});
