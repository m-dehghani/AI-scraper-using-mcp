/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { InteractiveScraperService } from './interactive-scraper.service';
import { ScraperService } from './scraper.service';
import { PromptParserService } from './prompt-parser.service';
import { CsvExportService } from './csv-export.service';
import { OllamaService } from '../ai/ollama.service';
import { TestHelpers } from '../../test/utils/test-helpers';

describe('InteractiveScraperService', () => {
    let service: InteractiveScraperService;
    let mockScraperService: jest.Mocked<ScraperService>;
    let mockPromptParser: jest.Mocked<PromptParserService>;
    let mockCsvExport: jest.Mocked<CsvExportService>;
    let mockOllama: jest.Mocked<OllamaService>;
    let mockLogger: jest.Mocked<Logger>;

    beforeEach(async () => {
        mockScraperService = {
            scrapeAndAnalyze: jest.fn(),
        } as any;

        mockPromptParser = {
            parsePrompt: jest.fn(),
        } as any;

        mockCsvExport = {
            exportToCsv: jest.fn(),
            exportScrapedData: jest.fn(),
        } as any;

        mockOllama = {
            ...TestHelpers.createMockOllamaService(),
            logger: mockLogger,
            ollama: {} as any,
        } as any;

        mockLogger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InteractiveScraperService,
                {
                    provide: ScraperService,
                    useValue: mockScraperService,
                },
                {
                    provide: PromptParserService,
                    useValue: mockPromptParser,
                },
                {
                    provide: CsvExportService,
                    useValue: mockCsvExport,
                },
                {
                    provide: OllamaService,
                    useValue: mockOllama,
                },
                {
                    provide: Logger,
                    useValue: mockLogger,
                },
            ],
        }).compile();

        service = module.get<InteractiveScraperService>(
            InteractiveScraperService,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('processPromptRequest', () => {
        it('should process a successful scraping request', async () => {
            const request = {
                prompt: 'scrape all products and their prices from this site',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
                outputPath: './output',
            };

            const scrapedData = TestHelpers.createSampleScrapedData();
            const parsedPrompt = TestHelpers.createSampleParsedPrompt();
            const aiResponse = TestHelpers.createSampleAiResponse();

            mockPromptParser.parsePrompt.mockReturnValue(parsedPrompt);
            mockScraperService.scrapeAndAnalyze.mockResolvedValue(scrapedData);
            mockOllama.processPrompt.mockResolvedValue(
                JSON.stringify(aiResponse),
            );
            mockCsvExport.exportToCsv.mockReturnValue('./output/test.csv');

            const result = await service.processPromptRequest(request);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(scrapedData);
            expect(result.outputFile).toBe('./output/test.csv');
            expect(result.message).toContain(
                'Successfully scraped and exported',
            );
        });

        it('should handle insufficient content and return empty data', async () => {
            const request = {
                prompt: 'scrape products',
                url: 'https://blocked-site.com',
                outputFormat: 'csv' as const,
            };

            const scrapedData = {
                url: 'https://blocked-site.com',
                title: 'Just a moment...',
                content: {
                    title: 'Just a moment...',
                    text: 'Just a moment...',
                    links: [],
                    images: [],
                    headings: [],
                    metadata: {},
                    sections: [],
                },
                analysis: {
                    summary: 'Blocked page',
                    keyPoints: 'Just a moment...',
                    categories: 'blocked',
                },
                metadata: {
                    scrapedAt: new Date(),
                    processingTime: 1000,
                    contentLength: 240,
                },
            };

            const parsedPrompt = TestHelpers.createSampleParsedPrompt();
            const aiResponse = TestHelpers.createSampleAiResponse();
            // Ensure Ollama is available so extractWithAI gets called
            mockOllama.isAvailable.mockResolvedValue(true);
            mockPromptParser.parsePrompt.mockReturnValue(parsedPrompt);
            mockScraperService.scrapeAndAnalyze.mockResolvedValue(scrapedData);

            const result = await service.processPromptRequest(request);

            expect(result.success).toBe(false);
            expect(result.data).toEqual([]);
            expect(result.error).toContain(
                'Scraping failed - no data extracted',
            );
        });

        it('should handle AI extraction errors', async () => {
            const request = {
                prompt: 'scrape products',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
            };

            const scrapedData = TestHelpers.createSampleScrapedData();
            const parsedPrompt = TestHelpers.createSampleParsedPrompt();

            mockPromptParser.parsePrompt.mockReturnValue(parsedPrompt);
            mockScraperService.scrapeAndAnalyze.mockResolvedValue(scrapedData);
            mockOllama.processPrompt.mockRejectedValue(
                new Error('AI processing failed'),
            );

            const result = await service.processPromptRequest(request);

            expect(result.success).toBe(false);
            expect(result.error).toContain(
                'Scraping failed - no data extracted',
            );
        });

        it('should handle CSV export errors', async () => {
            const request = {
                prompt: 'scrape products',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
            };

            const scrapedData = TestHelpers.createSampleScrapedData();
            const parsedPrompt = TestHelpers.createSampleParsedPrompt();
            const aiResponse = TestHelpers.createSampleAiResponse();

            mockPromptParser.parsePrompt.mockReturnValue(parsedPrompt);
            mockScraperService.scrapeAndAnalyze.mockResolvedValue(scrapedData);
            mockOllama.processPrompt.mockResolvedValue(
                JSON.stringify(aiResponse),
            );
            mockCsvExport.exportToCsv.mockImplementation(() => {
                throw new Error('CSV export failed');
            });

            const result = await service.processPromptRequest(request);

            expect(result.success).toBe(false);
            expect(result.error).toContain(
                'Scraping failed - no data extracted',
            );
        });

        it('should handle scraping service errors', async () => {
            const request = {
                prompt: 'scrape products',
                url: 'https://example.com',
                outputFormat: 'csv' as const,
            };

            const parsedPrompt = TestHelpers.createSampleParsedPrompt();

            mockPromptParser.parsePrompt.mockReturnValue(parsedPrompt);
            mockScraperService.scrapeAndAnalyze.mockRejectedValue(
                new Error('Scraping failed'),
            );

            const result = await service.processPromptRequest(request);

            expect(result.success).toBe(false);
            expect(result.error).toContain(
                'Scraping failed - no data extracted',
            );
        });
    });

    describe('extractWithAI', () => {
        it('should extract data with AI successfully', async () => {
            const scrapedData = TestHelpers.createSampleScrapedData();
            const parsedPrompt = TestHelpers.createSampleParsedPrompt();
            const aiResponse = TestHelpers.createSampleAiResponse();

            // Ensure the mock is set up correctly
            mockOllama.processPrompt.mockResolvedValue(
                JSON.stringify(aiResponse),
            );

            const result = await service['extractWithAI'](
                scrapedData,
                parsedPrompt,
                'scrape products',
            );

            expect(result).toEqual(aiResponse);
            expect(mockOllama.processPrompt).toHaveBeenCalled();
        });

        it('should return empty array for insufficient content', async () => {
            const scrapedData = {
                url: 'https://example.com',
                title: 'Just a moment...',
                content: {
                    title: 'Just a moment...',
                    text: 'Just a moment...',
                    links: [],
                    images: [],
                    headings: [],
                    metadata: {},
                    sections: [],
                },
                analysis: {
                    summary: 'Blocked page',
                    keyPoints: 'Just a moment...',
                    categories: 'blocked',
                },
                metadata: {
                    scrapedAt: new Date(),
                    processingTime: 1000,
                    contentLength: 240,
                },
            };

            const parsedPrompt = TestHelpers.createSampleParsedPrompt();

            const result = await service['extractWithAI'](
                scrapedData,
                parsedPrompt,
                'scrape products',
            );

            expect(result).toEqual([]);
            expect(mockOllama.processPrompt).not.toHaveBeenCalled();
        });

        it('should handle malformed JSON from AI', async () => {
            const scrapedData = TestHelpers.createSampleScrapedData();
            const parsedPrompt = TestHelpers.createSampleParsedPrompt();

            mockOllama.processPrompt.mockResolvedValue('Invalid JSON response');

            await expect(
                service['extractWithAI'](
                    scrapedData,
                    parsedPrompt,
                    'scrape products',
                ),
            ).rejects.toThrow();
        });

        it('should handle JSON with trailing commas', async () => {
            const scrapedData = TestHelpers.createSampleScrapedData();
            const parsedPrompt = TestHelpers.createSampleParsedPrompt();
            const malformedJson = '[{"name": "Test", "price": "$10",}]';

            mockOllama.processPrompt.mockResolvedValue(malformedJson);

            const result = await service['extractWithAI'](
                scrapedData,
                parsedPrompt,
                'scrape products',
            );

            expect(result).toEqual([{ name: 'Test', price: '$10' }]);
        });
    });

    describe('tryParseJson', () => {
        it('should parse valid JSON', () => {
            const validJson = '{"name": "Test", "price": "$10"}';
            const result = service['tryParseJson'](validJson);
            expect(result).toEqual({ name: 'Test', price: '$10' });
        });

        it('should handle JSON with trailing commas', () => {
            const jsonWithTrailingComma = '{"name": "Test", "price": "$10",}';
            const result = service['tryParseJson'](jsonWithTrailingComma);
            expect(result).toEqual({ name: 'Test', price: '$10' });
        });

        it('should handle JSON with newlines', () => {
            const jsonWithNewlines = '{\n"name": "Test",\n"price": "$10"\n}';
            const result = service['tryParseJson'](jsonWithNewlines);
            expect(result).toEqual({ name: 'Test', price: '$10' });
        });

        it('should return null for invalid JSON', () => {
            const invalidJson = 'Invalid JSON string';
            const result = service['tryParseJson'](invalidJson);
            expect(result).toBeNull();
        });
    });

    describe('extractDataBasedOnPrompt', () => {
        it('should extract data based on parsed prompt', async () => {
            const scrapedData = TestHelpers.createSampleScrapedData();
            const parsedPrompt = TestHelpers.createSampleParsedPrompt();
            const aiResponse = TestHelpers.createSampleAiResponse();

            mockOllama.processPrompt.mockResolvedValue(
                JSON.stringify(aiResponse),
            );

            const result = await service['extractDataBasedOnPrompt'](
                scrapedData,
                parsedPrompt,
                'scrape products',
            );

            expect(result).toEqual(aiResponse);
        });

        it('should handle different prompt types', async () => {
            const scrapedData = TestHelpers.createSampleScrapedData();
            const parsedPrompt = {
                action: 'scrape' as const,
                target: 'articles',
                fields: ['title', 'content'],
                format: 'csv' as const,
                additionalInstructions: 'Extract all articles',
            };

            const aiResponse = [
                { title: 'Article 1', content: 'Content 1' },
                { title: 'Article 2', content: 'Content 2' },
            ];

            mockOllama.processPrompt.mockResolvedValue(
                JSON.stringify(aiResponse),
            );

            const result = await service['extractDataBasedOnPrompt'](
                scrapedData,
                parsedPrompt,
                'scrape articles',
            );

            expect(result).toEqual(aiResponse);
        });
    });
});
