export interface ContentSection {
    type: 'heading' | 'paragraph' | 'list' | 'table' | 'price' | 'other';
    content: string;
    level?: number; // For headings
    items?: string[]; // For lists
}
