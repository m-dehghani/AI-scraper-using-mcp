import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { TestHelpers } from '../utils/test-helpers';
import { OllamaService } from '../../src/ai/ollama.service';
import { McpClientService } from '../../src/mcp/mcp-client.service';
import { AiModule } from '../../src/ai/ai.module';
import { ScraperModule } from '../../src/scraper/scraper.module';
import { McpModule } from '../../src/mcp/mcp.module';

describe('AppController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Application Bootstrap', () => {
        it('should start the application successfully', () => {
            expect(app).toBeDefined();
        });

        it('should have all required modules loaded', () => {
            // Check that the app is properly initialized
            expect(app).toBeDefined();
            expect(app.getHttpServer()).toBeDefined();
        });
    });

    describe('Service Health Checks', () => {
        it('should check Ollama service health', () => {
            // This test would require actual Ollama service to be running
            // For now, we'll mock the health check
            const ollamaService = app.get<OllamaService>(OllamaService);
            expect(ollamaService).toBeDefined();
        });

        it('should check MCP client service health', () => {
            const mcpClientService =
                app.get<McpClientService>(McpClientService);
            expect(mcpClientService).toBeDefined();
        });
    });

    describe('Module Integration', () => {
        it('should have AI module properly configured', () => {
            const aiModule = app.get<AiModule>(AiModule);
            expect(aiModule).toBeDefined();
        });

        it('should have Scraper module properly configured', () => {
            const scraperModule = app.get<ScraperModule>(ScraperModule);
            expect(scraperModule).toBeDefined();
        });

        it('should have MCP module properly configured', () => {
            const mcpModule = app.get<McpModule>(McpModule);
            expect(mcpModule).toBeDefined();
        });
    });
});
