import { McpScrapingOptions, McpScrapingResult } from './interfaces';
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
