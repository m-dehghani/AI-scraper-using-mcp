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
    success: boolean;
    error?: string;
}
