import { Module } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { HtmlParserService } from './html-parser.service';
import { ScraperService } from './scraper.service';
import { PromptParserService } from './prompt-parser.service';
import { CsvExportService } from './csv-export.service';
import { InteractiveScraperService } from './interactive-scraper.service';
import { AiModule } from '../ai/ai.module';
import { McpClientService } from '../mcp/mcp-client.service';

@Module({
    imports: [AiModule],
    providers: [
        McpClientService,
        HtmlParserService,
        ScraperService,
        PromptParserService,
        CsvExportService,
        InteractiveScraperService,
        {
            provide: Logger,
            useValue: new Logger(McpClientService.name),
        },
    ],
    exports: [
        ScraperService,
        McpClientService,
        HtmlParserService,
        PromptParserService,
        CsvExportService,
        InteractiveScraperService,
    ],
})
export class ScraperModule {}
