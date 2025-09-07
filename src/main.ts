import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { InteractiveScraperService } from './scraper/interactive-scraper.service';
import { UserInputService } from './user-input.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting AI-powered web scraper application...');

  const appContext = await NestFactory.createApplicationContext(AppModule);
  const interactiveScraper = appContext.get(InteractiveScraperService);
  const userInput = appContext.get(UserInputService);

  try {
    // Check health status
    const healthStatus = await interactiveScraper.getHealthStatus();
    logger.log('Service health status:', healthStatus);

    if (!healthStatus.overall) {
      logger.warn(
        'Some services are not healthy. Check your Ollama installation and browser setup.',
      );
    }

    // Display welcome message
    userInput.displayWelcome();

    // Interactive loop
    let continueScraping = true;
    while (continueScraping) {
      try {
        // Get user input
        const { prompt, url } = await userInput.getScrapingPrompt();

        if (!prompt || !url) {
          console.log('❌ Both prompt and URL are required. Please try again.');
          continue;
        }

        // Validate URL
        try {
          new URL(url);
        } catch {
          console.log('❌ Invalid URL format. Please try again.');
          continue;
        }

        console.log(`\n🔄 Processing your request: "${prompt}"`);
        console.log(`🌐 Scraping URL: ${url}`);
        console.log('⏳ This may take a moment...\n');

        // Process the scraping request
        const result = await interactiveScraper.processPromptRequest({
          prompt,
          url,
          outputFormat: 'csv',
          outputPath: './output',
        });

        // Display results
        userInput.displayResult(result);

        // Ask if user wants to continue
        continueScraping = await userInput.askForAnotherScrape();
      } catch (error) {
        logger.error('Error during scraping session:', error);
        console.log(`❌ An error occurred: ${error.message}`);
        console.log('Please try again with a different prompt or URL.\n');

        // Ask if user wants to continue despite the error
        continueScraping = await userInput.askForAnotherScrape();
      }
    }

    // Display goodbye message
    userInput.displayGoodbye();
  } catch (error) {
    logger.error('Application startup failed:', error);
    console.error('❌ Application failed to start:', error.message);
  } finally {
    // Cleanup resources
    userInput.close();
    await appContext.close();
    logger.log('Application shutdown complete.');
  }
}

bootstrap().catch((error) => {
  console.error('Fatal error during bootstrap:', error);
  process.exit(1);
});
