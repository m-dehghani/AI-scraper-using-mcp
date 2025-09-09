export interface ParsedPrompt {
    action: 'scrape' | 'extract' | 'analyze';
    target: string;
    fields: string[];
    format: 'csv' | 'json' | 'text';
    additionalInstructions?: string;
}
