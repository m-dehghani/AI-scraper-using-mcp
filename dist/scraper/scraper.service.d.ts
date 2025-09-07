import { HtmlParserService, ParsedContent } from './html-parser.service';
import { OllamaService } from '../ai/ollama.service';
import { McpClientService } from '../mcp/mcp-client.service';
export interface ScrapingResult {
    url: string;
    title: string;
    content: ParsedContent;
    analysis: {
        summary: string;
        keyPoints: string;
        categories: string;
    };
    metadata: {
        scrapedAt: Date;
        processingTime: number;
        contentLength: number;
    };
}
export interface ScrapingJobOptions {
    maxScrolls?: number;
    scrollDelay?: number;
    waitForNetworkIdle?: boolean;
    userAgent?: string;
    viewport?: {
        width: number;
        height: number;
    };
    analysisType?: 'summary' | 'extract' | 'categorize';
    model?: string;
    chunkSize?: number;
}
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
