export interface PromptScrapingResult {
    success: boolean;
    data: unknown;
    outputFile?: string;
    message: string;
    error?: string;
}
