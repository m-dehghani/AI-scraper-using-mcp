export interface PromptScrapingRequest {
    prompt: string;
    url: string;
    outputFormat?: 'csv' | 'json' | 'text';
    outputPath?: string;
}
