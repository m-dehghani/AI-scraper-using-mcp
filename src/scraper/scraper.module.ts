import { Module } from '@nestjs/common';
import { HtmlParserService } from './html-parser.service';
import { XRayParserService } from './xray-parser.service';
import { ScraperService } from './scraper.service';
import { AiModule } from '../ai/ai.module';
import { McpClientService } from '../mcp/mcp-client.service';

@Module({
    imports: [AiModule],
    providers: [
        McpClientService,
        HtmlParserService,
        XRayParserService,
        ScraperService,
    ],
    exports: [
        ScraperService,
        McpClientService,
        HtmlParserService,
        XRayParserService,
    ],
})
export class ScraperModule {}
