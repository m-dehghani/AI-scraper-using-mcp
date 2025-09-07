import { ContentSection } from './content-section.interface';

export interface ParsedContent {
    title: string;
    text: string;
    links: string[];
    images: string[];
    headings: string[];
    metadata: Record<string, string>;
    sections: ContentSection[];
}
