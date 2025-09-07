import { Module } from '@nestjs/common';
import { ScraperModule } from './scraper/scraper.module';
import { AiModule } from './ai/ai.module';
import { McpModule } from './mcp/mcp.module';
import { UserInputService } from './user-input.service';

@Module({
  imports: [ScraperModule, AiModule, McpModule],
  providers: [UserInputService],
  exports: [UserInputService],
})
export class AppModule {}
