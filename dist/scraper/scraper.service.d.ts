import { HtmlParserService } from './html-parser.service';
import { OllamaService } from '../ai/ollama.service';
import { McpClientService } from '../mcp/mcp-client.service';
import { ScrapingResult, ScrapingJobOptions } from './interfaces';
export declare class ScraperService {
    private readonly mcpClient;
    private readonly htmlParser;
    private readonly ollamaService;
    private readonly logger;
    constructor(mcpClient: McpClientService, htmlParser: HtmlParserService, ollamaService: OllamaService);
    scrapeAndAnalyze(url: string, options?: ScrapingJobOptions): Promise<ScrapingResult>;
    scrapeMultipleUrls(urls: string[], options?: ScrapingJobOptions): Promise<ScrapingResult[]>;
    extractStructuredData(url: string, schema: string, options?: ScrapingJobOptions): Promise<any>;
    private performAIAnalysis;
    getHealthStatus(): Promise<{
        mcp: boolean;
        ollama: boolean;
        overall: boolean;
    }>;
    cleanup(): Promise<void>;
}
