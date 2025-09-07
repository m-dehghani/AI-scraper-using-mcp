import { OllamaOptions } from './interfaces';
export declare class OllamaService {
    private readonly logger;
    private readonly ollama;
    constructor();
    processPrompt(prompt: string, options?: OllamaOptions): Promise<string>;
    analyzeScrapedContent(content: string, analysisType?: 'summary' | 'extract' | 'categorize', model?: string): Promise<string>;
    extractStructuredData(content: string, schema: string, model?: string): Promise<string>;
    isAvailable(): Promise<boolean>;
    getAvailableModels(): Promise<string[]>;
    pullModel(modelName: string): Promise<void>;
}
