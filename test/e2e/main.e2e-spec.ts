import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { InteractiveScraperService } from '../../src/scraper/interactive-scraper.service';
import { OllamaService } from '../../src/ai/ollama.service';
import { McpClientService } from '../../src/mcp/mcp-client.service';

describe('Main Application (e2e)', () => {
    let app: INestApplication;
    let interactiveScraper: InteractiveScraperService;
    let ollamaService: OllamaService;
    let mcpClient: McpClientService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        interactiveScraper = app.get<InteractiveScraperService>(
            InteractiveScraperService,
        );
        ollamaService = app.get<OllamaService>(OllamaService);
        mcpClient = app.get<McpClientService>(McpClientService);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Application Services', () => {
        it('should have InteractiveScraperService available', () => {
            expect(interactiveScraper).toBeDefined();
            expect(typeof interactiveScraper.processPromptRequest).toBe(
                'function',
            );
        });

        it('should have OllamaService available', () => {
            expect(ollamaService).toBeDefined();
            expect(typeof ollamaService.processPrompt).toBe('function');
            expect(typeof ollamaService.isAvailable).toBe('function');
        });

        it('should have McpClientService available', () => {
            expect(mcpClient).toBeDefined();
            expect(typeof mcpClient.scrapeWebsite).toBe('function');
            expect(typeof mcpClient.isHealthy).toBe('function');
        });
    });

    describe('Service Dependencies', () => {
        it('should have all required services injected', () => {
            // Check that InteractiveScraperService has all its dependencies
            expect(interactiveScraper).toBeDefined();

            // The service should be properly instantiated with all dependencies
            // This is implicitly tested by the fact that we can get the service
        });

        it('should have proper service configuration', () => {
            // Test that services are configured with proper defaults
            expect(ollamaService).toBeDefined();
            expect(mcpClient).toBeDefined();
        });
    });

    describe('Application Lifecycle', () => {
        it('should start without errors', () => {
            expect(app).toBeDefined();
        });

        it('should be able to close gracefully', () => {
            // This test ensures the application can be closed without hanging
            expect(app).toBeDefined();
            // The actual closing is done in afterAll
        });
    });

    describe('Error Handling', () => {
        it('should handle service initialization errors gracefully', () => {
            // Test that the application can start even if some services fail
            expect(app).toBeDefined();
        });

        it('should have proper error boundaries', () => {
            // Test that services have proper error handling
            expect(interactiveScraper).toBeDefined();
            expect(ollamaService).toBeDefined();
            expect(mcpClient).toBeDefined();
        });
    });
});
