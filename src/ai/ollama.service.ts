import { Injectable, Logger } from '@nestjs/common';
import { Ollama } from 'ollama';
import { OllamaOptions } from './interfaces';

@Injectable()
export class OllamaService {
    private readonly logger = new Logger(OllamaService.name);
    private readonly ollama: Ollama;

    constructor() {
        const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.ollama = new Ollama({ host: baseUrl });
    }

    public async processPrompt(
        prompt: string,
        options: OllamaOptions = {},
    ): Promise<string> {
        const {
            model = 'llama3.2:1b',
            temperature = 0.7,
            topP = 0.9,
            maxTokens = 2048,
        } = options;

        try {
            this.logger.log(`Processing prompt with model: ${model}`);

            const response = await this.ollama.generate({
                model,
                prompt,
                options: {
                    temperature,
                    top_p: topP,
                    num_predict: maxTokens,
                },
            });

            this.logger.log('Prompt processed successfully');
            return response.response;
        } catch (error) {
            this.logger.error('Failed to process prompt with Ollama', error);
            throw new Error(`Ollama processing failed: ${error.message}`);
        }
    }

    public async analyzeScrapedContent(
        content: string,
        analysisType: 'summary' | 'extract' | 'categorize' = 'summary',
        model: string = 'llama3.2:1b',
    ): Promise<string> {
        const prompts = {
            summary: `Please provide a concise summary of the following web content. Focus on the main topics, key information, and important details:

${content}

Summary:`,
            extract: `Extract the most important information from the following web content. Return only the key facts, data points, and relevant details in a structured format:

${content}

Key Information:`,
            categorize: `Analyze the following web content and categorize it. Provide the main category, subcategories, and key topics:

${content}

Categorization:`,
        };

        const prompt = prompts[analysisType];
        return this.processPrompt(prompt, { model, temperature: 0.3 });
    }

    public async extractStructuredData(
        content: string,
        schema: string,
        model: string = 'llama3.2:1b',
    ): Promise<string> {
        const prompt = `Extract structured data from the following web content according to the specified schema. Return the data in JSON format:

Schema: ${schema}

Content:
${content}

Extracted Data (JSON):`;

        return this.processPrompt(prompt, {
            model,
            temperature: 0.1, // Low temperature for more consistent extraction
        });
    }

    public async isAvailable(): Promise<boolean> {
        try {
            await this.ollama.list();
            return true;
        } catch (error) {
            this.logger.warn('Ollama service not available', error.message);
            return false;
        }
    }

    public async getAvailableModels(): Promise<string[]> {
        try {
            const response = await this.ollama.list();
            return response.models?.map((model: any) => model.name) || [];
        } catch (error) {
            this.logger.error('Failed to get available models', error);
            return [];
        }
    }

    public async pullModel(modelName: string): Promise<void> {
        try {
            this.logger.log(`Pulling model: ${modelName}`);
            await this.ollama.pull({ model: modelName });
            this.logger.log(`Model ${modelName} pulled successfully`);
        } catch (error) {
            this.logger.error(`Failed to pull model ${modelName}`, error);
            throw new Error(`Failed to pull model: ${error.message}`);
        }
    }
}
