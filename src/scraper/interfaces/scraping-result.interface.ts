import { ParsedContent } from './parsed-content.interface';

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
