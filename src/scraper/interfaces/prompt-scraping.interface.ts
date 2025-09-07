export interface PromptScrapingRequest {
    prompt: string;
    url: string;
    outputFormat?: 'csv' | 'json' | 'text';
    outputPath?: string;
}

export interface PromptScrapingResult {
    success: boolean;
    data: any[];
    outputFile?: string;
    message: string;
    error?: string;
}

export interface ParsedPrompt {
    action: 'scrape' | 'extract' | 'analyze';
    target: string;
    fields: string[];
    format: 'csv' | 'json' | 'text';
    additionalInstructions?: string;
}
