"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OllamaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaService = void 0;
const common_1 = require("@nestjs/common");
const ollama_1 = require("ollama");
let OllamaService = OllamaService_1 = class OllamaService {
    logger = new common_1.Logger(OllamaService_1.name);
    ollama;
    constructor() {
        const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.ollama = new ollama_1.Ollama({ host: baseUrl });
    }
    async processPrompt(prompt, options = {}) {
        const { model = 'llama3', temperature = 0.7, topP = 0.9, maxTokens = 2048, } = options;
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
        }
        catch (error) {
            this.logger.error('Failed to process prompt with Ollama', error);
            throw new Error(`Ollama processing failed: ${error.message}`);
        }
    }
    async analyzeScrapedContent(content, analysisType = 'summary', model = 'llama3') {
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
    async extractStructuredData(content, schema, model = 'llama3') {
        const prompt = `Extract structured data from the following web content according to the specified schema. Return the data in JSON format:

Schema: ${schema}

Content:
${content}

Extracted Data (JSON):`;
        return this.processPrompt(prompt, {
            model,
            temperature: 0.1,
        });
    }
    async isAvailable() {
        try {
            await this.ollama.list();
            return true;
        }
        catch (error) {
            this.logger.warn('Ollama service not available', error.message);
            return false;
        }
    }
    async getAvailableModels() {
        try {
            const response = await this.ollama.list();
            return response.models?.map((model) => model.name) || [];
        }
        catch (error) {
            this.logger.error('Failed to get available models', error);
            return [];
        }
    }
    async pullModel(modelName) {
        try {
            this.logger.log(`Pulling model: ${modelName}`);
            await this.ollama.pull({ model: modelName });
            this.logger.log(`Model ${modelName} pulled successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to pull model ${modelName}`, error);
            throw new Error(`Failed to pull model: ${error.message}`);
        }
    }
};
exports.OllamaService = OllamaService;
exports.OllamaService = OllamaService = OllamaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], OllamaService);
//# sourceMappingURL=ollama.service.js.map