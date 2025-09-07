import { Module } from '@nestjs/common';
import { ScraperTool } from './scraper.tool';
import { McpClientService } from './mcp-client.service';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
    imports: [ScraperModule],
    providers: [ScraperTool, McpClientService],
    exports: [ScraperTool, McpClientService],
})
export class McpModule {}
