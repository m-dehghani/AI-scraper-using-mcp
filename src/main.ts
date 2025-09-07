import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ScraperService } from './scraper/scraper.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting AI-powered web scraper application...');

  const appContext = await NestFactory.createApplicationContext(AppModule);
  const scraper = appContext.get(ScraperService);

  try {
    // Check health status
    const healthStatus = await scraper.getHealthStatus();
    logger.log('Service health status:', healthStatus);

    if (!healthStatus.overall) {
      logger.warn(
        'Some services are not healthy. Check your Ollama installation and browser setup.',
      );
    }

    // Example usage - you can modify this to accept command line arguments
    const exampleUrl = 'https://www.reddit.com/';
    logger.log(`Example: Scraping ${exampleUrl}...`);

    // Uncomment the following lines to run a test scrape
    const result = await scraper.scrapeAndAnalyze(exampleUrl);
    logger.log('Scraping result:', JSON.stringify(result, null, 2));

    logger.log(
      'Application ready. Use MCP tools to interact with the scraper.',
    );
  } catch (error) {
    logger.error('Application startup failed:', error);
  } finally {
    // Cleanup resources
    await scraper.cleanup();
    await appContext.close();
    logger.log('Application shutdown complete.');
  }
}

bootstrap().catch((error) => {
  console.error('Fatal error during bootstrap:', error);
  process.exit(1);
});
