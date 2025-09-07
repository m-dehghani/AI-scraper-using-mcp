export interface XRayParsingResult {
    url: string;
    data: any;
    metadata: {
        scrapedAt: string;
        processingTime: number;
    };
}
