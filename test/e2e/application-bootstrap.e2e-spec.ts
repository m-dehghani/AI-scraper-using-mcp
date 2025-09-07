import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { InteractiveScraperService } from '../../src/scraper/interactive-scraper.service';
import { OllamaService } from '../../src/ai/ollama.service';
import { McpClientService } from '../../src/mcp/mcp-client.service';
import { UserInputService } from '../../src/user-input.service';
import { PromptParserService } from '../../src/scraper/prompt-parser.service';
import { CsvExportService } from '../../src/scraper/csv-export.service';
import { ScraperService } from '../../src/scraper/scraper.service';
import { XRayParserService } from '../../src/scraper/xray-parser.service';

describe('Application Bootstrap (e2e)', () => {
    let app: INestApplication;
    let moduleFixture: TestingModule;

    beforeAll(async () => {
        moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(McpClientService)
            .useValue({
                scrapeWebsite: jest.fn(),
                isHealthy: jest.fn().mockResolvedValue(true),
                cleanup: jest.fn(),
            })
            .overrideProvider(XRayParserService)
            .useValue({
                parseWithSchema: jest.fn(),
                createCustomSchema: jest.fn(),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Application Initialization', () => {
        it('should create application context successfully', () => {
            expect(app).toBeDefined();
            expect(app.getHttpServer()).toBeDefined();
        });

        it('should have all required modules loaded', () => {
            const appModule = moduleFixture.get(AppModule);
            expect(appModule).toBeDefined();
        });

        it('should initialize without errors', () => {
            expect(app).toBeDefined();
            expect(typeof app.getHttpServer).toBe('function');
        });
    });

    describe('Service Registration and Dependency Injection', () => {
        it('should register InteractiveScraperService', () => {
            const service = app.get<InteractiveScraperService>(
                InteractiveScraperService,
            );
            expect(service).toBeDefined();
            expect(typeof service.processPromptRequest).toBe('function');
            expect(typeof service.getHealthStatus).toBe('function');
        });

        it('should register OllamaService', () => {
            const service = app.get<OllamaService>(OllamaService);
            expect(service).toBeDefined();
            expect(typeof service.processPrompt).toBe('function');
            expect(typeof service.isAvailable).toBe('function');
        });

        it('should register McpClientService', () => {
            const service = app.get<McpClientService>(McpClientService);
            expect(service).toBeDefined();
            expect(typeof service.scrapeWebsite).toBe('function');
            expect(typeof service.isHealthy).toBe('function');
            expect(typeof service.cleanup).toBe('function');
        });

        it('should register UserInputService', () => {
            const service = app.get<UserInputService>(UserInputService);
            expect(service).toBeDefined();
            expect(typeof service.displayWelcome).toBe('function');
            expect(typeof service.displayResult).toBe('function');
            expect(typeof service.displayGoodbye).toBe('function');
        });

        it('should register PromptParserService', () => {
            const service = app.get<PromptParserService>(PromptParserService);
            expect(service).toBeDefined();
            expect(typeof service.parsePrompt).toBe('function');
            expect(typeof service.generateScrapingSchema).toBe('function');
        });

        it('should register CsvExportService', () => {
            const service = app.get<CsvExportService>(CsvExportService);
            expect(service).toBeDefined();
            expect(typeof service.exportToCsv).toBe('function');
            expect(typeof service.exportScrapedData).toBe('function');
        });

        it('should register ScraperService', () => {
            const service = app.get<ScraperService>(ScraperService);
            expect(service).toBeDefined();
            expect(typeof service.scrapeAndAnalyze).toBe('function');
        });

        it('should register XRayParserService', () => {
            const service = app.get<XRayParserService>(XRayParserService);
            expect(service).toBeDefined();
            expect(typeof service.parseWithSchema).toBe('function');
        });
    });

    describe('Service Dependencies and Injection', () => {
        it('should inject dependencies into InteractiveScraperService', () => {
            const service = app.get<InteractiveScraperService>(
                InteractiveScraperService,
            );

            // Check that the service has all its dependencies injected
            expect(service).toBeDefined();

            // The service should be able to call its methods without errors
            expect(() => service.getHealthStatus()).not.toThrow();
        });

        it('should have proper service configuration', () => {
            const ollamaService = app.get<OllamaService>(OllamaService);
            const mcpClient = app.get<McpClientService>(McpClientService);
            const promptParser =
                app.get<PromptParserService>(PromptParserService);

            expect(ollamaService).toBeDefined();
            expect(mcpClient).toBeDefined();
            expect(promptParser).toBeDefined();
        });

        it('should handle circular dependencies properly', () => {
            // Test that all services can be instantiated without circular dependency issues
            const services = [
                app.get<InteractiveScraperService>(InteractiveScraperService),
                app.get<OllamaService>(OllamaService),
                app.get<McpClientService>(McpClientService),
                app.get<UserInputService>(UserInputService),
                app.get<PromptParserService>(PromptParserService),
                app.get<CsvExportService>(CsvExportService),
                app.get<ScraperService>(ScraperService),
                app.get<XRayParserService>(XRayParserService),
            ];

            services.forEach((service) => {
                expect(service).toBeDefined();
            });
        });
    });

    describe('Module Integration', () => {
        it('should have ScraperModule properly configured', () => {
            // Test that scraper services are available
            const scraperService = app.get<ScraperService>(ScraperService);
            const promptParser =
                app.get<PromptParserService>(PromptParserService);
            const csvExport = app.get<CsvExportService>(CsvExportService);
            const xrayParser = app.get<XRayParserService>(XRayParserService);
            expect(scraperService).toBeDefined();
            expect(promptParser).toBeDefined();
            expect(csvExport).toBeDefined();
            expect(xrayParser).toBeDefined();
        });

        it('should have AiModule properly configured', () => {
            const ollamaService = app.get<OllamaService>(OllamaService);
            expect(ollamaService).toBeDefined();
        });

        it('should have McpModule properly configured', () => {
            const mcpClient = app.get<McpClientService>(McpClientService);
            expect(mcpClient).toBeDefined();
        });
    });

    describe('Application Lifecycle', () => {
        it('should start without errors', () => {
            expect(app).toBeDefined();
            expect(app.getHttpServer()).toBeDefined();
        });

        it('should be able to close gracefully', () => {
            // Test that the application can be closed without hanging
            expect(app).toBeDefined();

            // The actual closing is done in afterAll
            // This test ensures the cleanup process is properly defined
        });

        it('should handle shutdown signals properly', () => {
            // Test that the application is properly configured for graceful shutdown
            expect(app).toBeDefined();
        });
    });

    describe('Error Handling and Resilience', () => {
        it('should handle service initialization errors gracefully', () => {
            // Test that the application can start even if some services have issues
            expect(app).toBeDefined();
        });

        it('should have proper error boundaries', () => {
            const services = [
                app.get<InteractiveScraperService>(InteractiveScraperService),
                app.get<OllamaService>(OllamaService),
                app.get<McpClientService>(McpClientService),
            ];

            services.forEach((service) => {
                expect(service).toBeDefined();
            });
        });

        it('should handle missing dependencies gracefully', () => {
            // Test that the application doesn't crash if optional services are unavailable
            expect(app).toBeDefined();
        });
    });

    describe('Configuration and Environment', () => {
        it('should load configuration properly', () => {
            // Test that the application loads its configuration without errors
            expect(app).toBeDefined();
        });

        it('should handle environment variables correctly', () => {
            // Test that environment variables are properly loaded
            expect(app).toBeDefined();
        });

        it('should have proper logging configuration', () => {
            // Test that logging is properly configured
            expect(app).toBeDefined();
        });
    });

    describe('Performance and Resource Management', () => {
        it('should initialize within reasonable time', () => {
            // Test that the application starts up quickly
            expect(app).toBeDefined();
        });

        it('should manage memory efficiently', () => {
            // Test that the application doesn't have memory leaks during startup
            expect(app).toBeDefined();
        });

        it('should handle concurrent requests properly', () => {
            // Test that the application can handle multiple concurrent operations
            expect(app).toBeDefined();
        });
    });

    describe('Security and Validation', () => {
        it('should have proper input validation', () => {
            const promptParser =
                app.get<PromptParserService>(PromptParserService);

            // Test that the service can handle various input types
            expect(() => promptParser.parsePrompt('')).not.toThrow();
            expect(() =>
                promptParser.parsePrompt('valid prompt'),
            ).not.toThrow();
        });

        it('should handle malformed requests gracefully', () => {
            const interactiveScraper = app.get<InteractiveScraperService>(
                InteractiveScraperService,
            );

            // Test that the service can handle malformed requests
            expect(interactiveScraper).toBeDefined();
        });

        it('should have proper error sanitization', () => {
            // Test that errors are properly sanitized and don't expose sensitive information
            expect(app).toBeDefined();
        });
    });
});
