import { Module } from '@nestjs/common';
import { ScraperModule } from './scraper/scraper.module';
import { AiModule } from './ai/ai.module';
import { McpModule } from './mcp/mcp.module';

@Module({
    imports: [ScraperModule, AiModule, McpModule],
})
export class AppModule {}
