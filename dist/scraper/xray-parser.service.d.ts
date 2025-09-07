import { XRaySchema, XRayParsingResult } from './interfaces';
export declare class XRayParserService {
    private readonly logger;
    private readonly xray;
    constructor();
    parseWithSchema(html: string, schema: XRaySchema): Promise<any>;
    scrapeUrl(url: string, schema: XRaySchema): Promise<XRayParsingResult>;
    scrapeMultipleUrls(urls: string[], schema: XRaySchema): Promise<XRayParsingResult[]>;
    getCommonSchemas(): {
        newsArticle: {
            title: string;
            content: string[];
            author: string;
            date: string;
            tags: string[];
        };
        product: {
            name: string;
            price: string;
            description: string;
            images: string[];
            rating: string;
            availability: string;
        };
        blogPost: {
            title: string;
            content: string[];
            author: string;
            date: string;
            categories: string[];
        };
        generic: {
            title: string;
            headings: string[];
            paragraphs: string[];
            links: string[];
            images: string[];
            lists: string[];
        };
    };
    createCustomSchema(selectors: Record<string, string>): XRaySchema;
}
