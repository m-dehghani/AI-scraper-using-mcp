import { ParsedContent } from './interfaces';
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
