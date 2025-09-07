export interface ScrapingJobOptions {
    maxScrolls?: number;
    scrollDelay?: number;
    waitForNetworkIdle?: boolean;
    userAgent?: string;
    viewport?: { width: number; height: number };
    analysisType?: 'summary' | 'extract' | 'categorize';
    model?: string;
    chunkSize?: number;
}
