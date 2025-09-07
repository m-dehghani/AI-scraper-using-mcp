import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { TestHelpers } from '../../test/utils/test-helpers';

// Mock the ollama module before any imports
const mockOllama = {
    generate: jest.fn(),
    list: jest.fn(),
    pull: jest.fn(),
};

jest.mock('ollama', () => ({
    Ollama: jest.fn().mockImplementation(() => mockOllama),
}));

describe('OllamaService', () => {
    let service: OllamaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OllamaService,
                {
                    provide: Logger,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                        warn: jest.fn(),
                        debug: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<OllamaService>(OllamaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('processPrompt', () => {
        it('should process a prompt successfully', async () => {
            const mockResponse = {
                response: 'Test response from Ollama',
            };
            mockOllama.generate.mockResolvedValue(mockResponse);

            const result = await service.processPrompt('Test prompt');

            expect(result).toBe('Test response from Ollama');
            expect(mockOllama.generate).toHaveBeenCalledWith({
                model: 'llama3.2:1b',
                prompt: 'Test prompt',
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    num_predict: 2048,
                },
            });
        });

        it('should handle custom options', async () => {
            const mockResponse = {
                response: 'Custom response',
            };
            mockOllama.generate.mockResolvedValue(mockResponse);

            const options = {
                model: 'custom-model',
                temperature: 0.5,
                topP: 0.8,
                maxTokens: 1000,
            };

            const result = await service.processPrompt('Test prompt', options);

            expect(result).toBe('Custom response');
            expect(mockOllama.generate).toHaveBeenCalledWith({
                model: 'custom-model',
                prompt: 'Test prompt',
                options: {
                    temperature: 0.5,
                    top_p: 0.8,
                    num_predict: 1000,
                },
            });
        });

        it('should handle errors gracefully', async () => {
            const error = new Error('Ollama connection failed');
            mockOllama.generate.mockRejectedValue(error);

            await expect(service.processPrompt('Test prompt')).rejects.toThrow(
                'Ollama connection failed',
            );
        });
    });

    describe('analyzeScrapedContent', () => {
        it('should analyze content for summary', async () => {
            const mockResponse = {
                response: 'This is a summary of the content',
            };
            mockOllama.generate.mockResolvedValue(mockResponse);

            const result = await service.analyzeScrapedContent(
                'Sample content to analyze',
                'summary',
            );

            expect(result).toBe('This is a summary of the content');
            expect(mockOllama.generate).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: 'llama3.2:1b',
                    prompt: expect.stringContaining(
                        'Sample content to analyze',
                    ),
                }),
            );
        });

        it('should analyze content for extraction', async () => {
            const mockResponse = {
                response: 'Extracted data: products and prices',
            };
            mockOllama.generate.mockResolvedValue(mockResponse);

            const result = await service.analyzeScrapedContent(
                'Sample content',
                'extract',
            );

            expect(result).toBe('Extracted data: products and prices');
        });

        it('should analyze content for categorization', async () => {
            const mockResponse = {
                response: 'Categories: electronics, clothing',
            };
            mockOllama.generate.mockResolvedValue(mockResponse);

            const result = await service.analyzeScrapedContent(
                'Sample content',
                'categorize',
            );

            expect(result).toBe('Categories: electronics, clothing');
        });
    });

    describe('extractStructuredData', () => {
        it('should extract structured data successfully', async () => {
            const mockResponse = {
                response: '{"products": [{"name": "Test", "price": "$10"}]}',
            };
            mockOllama.generate.mockResolvedValue(mockResponse);

            const schema = 'Extract products with names and prices';
            const result = await service.extractStructuredData(
                'Sample content',
                schema,
            );

            expect(result).toBe(
                '{"products": [{"name": "Test", "price": "$10"}]}',
            );
            expect(mockOllama.generate).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: 'llama3.2:1b',
                    prompt: expect.stringContaining(schema),
                }),
            );
        });
    });

    describe('isAvailable', () => {
        it('should return true when Ollama is available', async () => {
            mockOllama.list.mockResolvedValue({ models: [] });

            const result = await service.isAvailable();

            expect(result).toBe(true);
        });

        it('should return false when Ollama is not available', async () => {
            mockOllama.list.mockRejectedValue(new Error('Connection failed'));

            const result = await service.isAvailable();

            expect(result).toBe(false);
        });
    });
});
