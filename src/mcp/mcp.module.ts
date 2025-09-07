import { Module } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ScraperTool } from './scraper.tool';
import { McpClientService } from './mcp-client.service';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
    imports: [ScraperModule],
    providers: [
        ScraperTool,
        McpClientService,
        {
            provide: Logger,
            useValue: new Logger(McpClientService.name),
        },
    ],
    exports: [ScraperTool, McpClientService],
})
export class McpModule {}
