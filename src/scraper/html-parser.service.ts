import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ParsedContent, ContentSection } from './interfaces';

@Injectable()
export class HtmlParserService {
    private readonly logger = new Logger(HtmlParserService.name);

    public parseContent(html: string): ParsedContent {
        const $ = cheerio.load(html);

        // Remove unwanted elements
        this.removeUnwantedElements($);

        const title = this.extractTitle($);
        const text = this.extractText($);
        const links = this.extractLinks($);
        const images = this.extractImages($);
        const headings = this.extractHeadings($);
        const metadata = this.extractMetadata($);
        const sections = this.extractSections($);

        this.logger.log(
            `Parsed content: ${sections.length} sections, ${links.length} links`,
        );

        return {
            title,
            text,
            links,
            images,
            headings,
            metadata,
            sections,
        };
    }

    public extractRelevantContent(
        html: string,
        selectors: string[] = [],
    ): string[] {
        const $ = cheerio.load(html);
        this.removeUnwantedElements($);

        const content: string[] = [];

        // If specific selectors provided, use them
        if (selectors.length > 0) {
            selectors.forEach(selector => {
                $(selector).each((_, element) => {
                    const text = $(element).text().trim();
                    if (text) {
                        content.push(text);
                    }
                });
            });
        } else {
            // Default content extraction
            const defaultSelectors = [
                'article',
                '.content',
                '.main-content',
                '.post-content',
                '.entry-content',
                '.article-content',
                'main',
                '.container',
            ];

            defaultSelectors.forEach(selector => {
                $(selector).each((_, element) => {
                    const text = $(element).text().trim();
                    if (text && text.length > 100) {
                        content.push(text);
                    }
                });
            });

            // If no content found with selectors, extract from body
            if (content.length === 0) {
                const bodyText = $('body').text().trim();
                if (bodyText) {
                    content.push(bodyText);
                }
            }
        }

        return content.filter(text => text.length > 50); // Filter out very short content
    }

    private removeUnwantedElements($: cheerio.Root): void {
        // Remove script, style, and other non-content elements
        $(
            'script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar',
        ).remove();

        // Remove elements with common ad/spam classes
        $('[class*="ad-"], [class*="sponsor"], [class*="promo"]').remove();

        // Remove elements with common spam attributes
        $('[data-ad], [data-sponsor], [data-promo]').remove();
    }

    private extractTitle($: cheerio.Root): string {
        return (
            $('title').text().trim() ||
            $('h1').first().text().trim() ||
            'Untitled'
        );
    }

    private extractText($: cheerio.Root): string {
        return $('body').text().replace(/\s+/g, ' ').trim();
    }

    private extractLinks($: cheerio.Root): string[] {
        const links: string[] = [];
        $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            if (
                href &&
                !href.startsWith('#') &&
                !href.startsWith('javascript:')
            ) {
                links.push(href);
            }
        });
        return [...new Set(links)]; // Remove duplicates
    }

    private extractImages($: cheerio.Root): string[] {
        const images: string[] = [];
        $('img[src]').each((_, element) => {
            const src = $(element).attr('src');
            if (src) {
                images.push(src);
            }
        });
        return [...new Set(images)]; // Remove duplicates
    }

    private extractHeadings($: cheerio.Root): string[] {
        const headings: string[] = [];
        $('h1, h2, h3, h4, h5, h6').each((_, element) => {
            const text = $(element).text().trim();
            if (text) {
                headings.push(text);
            }
        });
        return headings;
    }

    private extractMetadata($: cheerio.Root): Record<string, string> {
        const metadata: Record<string, string> = {};

        // Extract meta tags
        $('meta').each((_, element) => {
            const name = $(element).attr('name') || $(element).attr('property');
            const content = $(element).attr('content');
            if (name && content) {
                metadata[name] = content;
            }
        });

        return metadata;
    }

    private extractSections($: cheerio.Root): ContentSection[] {
        const sections: ContentSection[] = [];

        // Extract headings and their content
        $('h1, h2, h3, h4, h5, h6').each((_, element) => {
            const heading = $(element);
            const level = parseInt(
                heading.prop('tagName')?.substring(1) ?? '1',
            );
            const text = heading.text().trim();

            if (text) {
                sections.push({
                    type: 'heading',
                    content: text,
                    level,
                });
            }
        });

        // Extract paragraphs
        $('p').each((_, element) => {
            const text = $(element).text().trim();
            if (text && text.length > 20) {
                sections.push({
                    type: 'paragraph',
                    content: text,
                });
            }
        });

        // Extract lists
        $('ul, ol').each((_, element) => {
            const list = $(element);
            const items: string[] = [];
            list.find('li').each((_, li) => {
                const text = $(li).text().trim();
                if (text) {
                    items.push(text);
                }
            });

            if (items.length > 0) {
                sections.push({
                    type: 'list',
                    content:
                        list.prop('tagName') === 'UL'
                            ? 'Unordered List'
                            : 'Ordered List',
                    items,
                });
            }
        });

        // Extract tables
        $('table').each((_, element) => {
            const table = $(element);
            const text = table.text().trim();
            if (text && text.length > 50) {
                sections.push({
                    type: 'table',
                    content: text,
                });
            }
        });

        return sections;
    }

    public cleanText(text: string): string {
        return text
            .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
            .replace(/\n\s*\n/g, '\n') // Remove empty lines
            .trim();
    }

    public chunkContent(
        content: string,
        maxChunkSize: number = 2000,
    ): string[] {
        const chunks: string[] = [];
        const sentences = content.split(/[.!?]+/);

        let currentChunk = '';
        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;

            if (currentChunk.length + trimmedSentence.length > maxChunkSize) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                }
                currentChunk = trimmedSentence;
            } else {
                currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }
}
