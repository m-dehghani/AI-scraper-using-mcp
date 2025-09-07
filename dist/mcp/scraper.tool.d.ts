import { ScraperService } from '../scraper/scraper.service';
import { XRayParserService } from '../scraper/xray-parser.service';
export declare class ScraperTool {
    private readonly scraperService;
    private readonly xrayParser;
    private readonly logger;
    constructor(scraperService: ScraperService, xrayParser: XRayParserService);
    scrapeInfiniteScroll(params: any): Promise<any>;
    scrapeBatchUrls(params: any): Promise<any>;
    extractStructuredData(params: any): Promise<any>;
    healthCheck(): Promise<any>;
    scrapeWithXRay(params: any): Promise<any>;
    getXRaySchemas(): {
        success: boolean;
        schemas: {
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
        description: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        schemas?: undefined;
        description?: undefined;
    };
}
