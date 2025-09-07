export interface ParsedContent {
    title: string;
    text: string;
    links: string[];
    images: string[];
    headings: string[];
    metadata: Record<string, string>;
    sections: ContentSection[];
}
export interface ContentSection {
    type: 'heading' | 'paragraph' | 'list' | 'table' | 'other';
    content: string;
    level?: number;
    items?: string[];
}
export declare class HtmlParserService {
    private readonly logger;
    parseContent(html: string): ParsedContent;
    extractRelevantContent(html: string, selectors?: string[]): string[];
    private removeUnwantedElements;
    private extractTitle;
    private extractText;
    private extractLinks;
    private extractImages;
    private extractHeadings;
    private extractMetadata;
    private extractSections;
    cleanText(text: string): string;
    chunkContent(content: string, maxChunkSize?: number): string[];
}
