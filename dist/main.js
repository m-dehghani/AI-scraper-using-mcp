"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const scraper_service_1 = require("./scraper/scraper.service");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    logger.log('Starting AI-powered web scraper application...');
    const appContext = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const scraper = appContext.get(scraper_service_1.ScraperService);
    try {
        const healthStatus = await scraper.getHealthStatus();
        logger.log('Service health status:', healthStatus);
        if (!healthStatus.overall) {
            logger.warn('Some services are not healthy. Check your Ollama installation and browser setup.');
        }
        const exampleUrl = 'https://www.reddit.com/';
        logger.log(`Example: Scraping ${exampleUrl}...`);
        const result = await scraper.scrapeAndAnalyze(exampleUrl);
        logger.log('Scraping result:', JSON.stringify(result, null, 2));
        logger.log('Application ready. Use MCP tools to interact with the scraper.');
    }
    catch (error) {
        logger.error('Application startup failed:', error);
    }
    finally {
        await scraper.cleanup();
        await appContext.close();
        logger.log('Application shutdown complete.');
    }
}
bootstrap().catch((error) => {
    console.error('Fatal error during bootstrap:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map