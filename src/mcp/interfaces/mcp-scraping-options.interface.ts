export interface McpScrapingOptions {
    url: string;
    maxScrolls?: number;
    scrollDelay?: number;
    waitForNetworkIdle?: boolean;
    userAgent?: string;
    viewport?: { width: number; height: number };
}
