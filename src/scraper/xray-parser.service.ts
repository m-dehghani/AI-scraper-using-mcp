import { Injectable, Logger } from '@nestjs/common';
import Xray from 'x-ray';
import { XRaySchema, XRayParsingResult } from './interfaces';

@Injectable()
export class XRayParserService {
    private readonly logger = new Logger(XRayParserService.name);
    private readonly xray: Xray.Instance;

    constructor() {
        this.xray = Xray();
    }

    /**
     * Parse HTML content using X-Ray with a schema
     */
    public async parseWithSchema(
        html: string,
        schema: XRaySchema,
    ): Promise<any> {
        try {
            this.logger.log('Parsing HTML content with X-Ray schema');

            // X-Ray works with URLs, so we need to create a virtual URL
            // For HTML content, we'll use a different approach
            const result = await this.xray(html, schema);

            this.logger.log('X-Ray parsing completed successfully');
            return result;
        } catch (error) {
            this.logger.error('X-Ray parsing failed', error);
            throw new Error(`X-Ray parsing failed: ${error.message}`);
        }
    }

    /**
     * Scrape a URL directly with X-Ray
     */
    public async scrapeUrl(
        url: string,
        schema: XRaySchema,
    ): Promise<XRayParsingResult> {
        const startTime = Date.now();

        try {
            this.logger.log(`Scraping URL with X-Ray: ${url}`);

            const data = await this.xray(url, schema);
            const processingTime = Date.now() - startTime;

            return {
                url,
                data,
                metadata: {
                    scrapedAt: new Date().toISOString(),
                    processingTime,
                },
            };
        } catch (error) {
            this.logger.error(`X-Ray scraping failed for ${url}`, error);
            throw new Error(`X-Ray scraping failed: ${error.message}`);
        }
    }

    /**
     * Scrape multiple URLs with the same schema
     */
    public async scrapeMultipleUrls(
        urls: string[],
        schema: XRaySchema,
    ): Promise<XRayParsingResult[]> {
        this.logger.log(`Scraping ${urls.length} URLs with X-Ray`);

        const results: XRayParsingResult[] = [];
        const errors: string[] = [];

        for (const url of urls) {
            try {
                const result = await this.scrapeUrl(url, schema);
                results.push(result);
                this.logger.log(`Successfully scraped: ${url}`);
            } catch (error) {
                const errorMsg = `Failed to scrape ${url}: ${error.message}`;
                errors.push(errorMsg);
                this.logger.error(errorMsg);
            }
        }

        this.logger.log(
            `X-Ray batch scraping completed. Success: ${results.length}, Errors: ${errors.length}`,
        );

        if (errors.length > 0) {
            this.logger.warn('Some URLs failed to scrape:', errors);
        }

        return results;
    }

    /**
     * Common schemas for different types of content
     */
    public getCommonSchemas() {
        return {
            // News article schema
            newsArticle: {
                title: 'h1',
                content: ['.article-content p', '.content p'],
                author: '.author',
                date: '.date, .published',
                tags: ['.tags a', '.categories a'],
            },

            // Product schema
            product: {
                name: 'h1, .product-title',
                price: '.price, .cost',
                description: '.description, .product-description',
                images: ['img@src'],
                rating: '.rating, .stars',
                availability: '.availability, .stock',
            },

            // Blog post schema
            blogPost: {
                title: 'h1, .post-title',
                content: ['.post-content p', '.entry-content p'],
                author: '.author, .byline',
                date: '.date, .published, time',
                categories: ['.categories a', '.tags a'],
            },

            // Generic content schema
            generic: {
                title: 'h1, title',
                headings: ['h1', 'h2', 'h3'],
                paragraphs: ['p'],
                links: ['a@href'],
                images: ['img@src'],
                lists: ['ul li', 'ol li'],
            },
        };
    }

    /**
     * Create a custom schema for specific selectors
     */
    public createCustomSchema(selectors: Record<string, string>): XRaySchema {
        return selectors;
    }
}
