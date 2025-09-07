export interface OllamaOptions {
    model?: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    stream?: boolean;
}
export interface OllamaResponse {
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}
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
