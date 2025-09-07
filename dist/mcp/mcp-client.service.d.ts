export interface McpScrapingOptions {
    url: string;
    maxScrolls?: number;
    scrollDelay?: number;
    waitForNetworkIdle?: boolean;
    userAgent?: string;
    viewport?: {
        width: number;
        height: number;
    };
}
export interface McpScrapingResult {
    url: string;
    title: string;
    content: string;
    html: string;
    metadata: {
        scrapedAt: string;
        processingTime: number;
        contentLength: number;
    };
}
export declare class McpClientService {
    private readonly logger;
    private browser;
    private isConnected;
    constructor();
    initialize(): Promise<void>;
    scrapeWebsite(options: McpScrapingOptions): Promise<McpScrapingResult>;
    private handleInfiniteScroll;
    isHealthy(): Promise<boolean>;
    close(): Promise<void>;
}
