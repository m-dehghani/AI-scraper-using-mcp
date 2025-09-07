import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

export class TestHelpers {
    /**
     * Create a testing module with mocked dependencies
     */
    static createTestingModule(providers: any[]): Promise<TestingModule> {
        return Test.createTestingModule({
            providers: [
                ...providers,
                {
                    provide: Logger,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                        warn: jest.fn(),
                        debug: jest.fn(),
                        verbose: jest.fn(),
                    },
                },
            ],
        }).compile();
    }

    /**
     * Mock Ollama service responses
     */
    static createMockOllamaService() {
        return {
            processPrompt: jest.fn(),
            analyzeScrapedContent: jest.fn(),
            extractStructuredData: jest.fn(),
            isAvailable: jest.fn().mockResolvedValue(true),
            getAvailableModels: jest.fn().mockResolvedValue(['llama3.2:1b']),
            pullModel: jest.fn().mockResolvedValue(undefined),
        };
    }

    /**
     * Mock MCP client service
     */
    static createMockMcpClientService() {
        return {
            scrapeWebsite: jest.fn(),
            isHealthy: jest.fn().mockReturnValue(true),
        };
    }

    /**
     * Mock CSV export service
     */
    static createMockCsvExportService() {
        return {
            exportToCsv: jest.fn(),
            exportScrapedData: jest.fn(),
        };
    }

    /**
     * Create sample scraped data for testing
     */
    static createSampleScrapedData() {
        return {
            url: 'https://example.com',
            title: 'Test Page',
            content: {
                title: 'Test Page',
                text: 'Sample content with products and prices. This is a longer text to ensure it passes the 500 character minimum requirement for content validation. Product 1 - $29.99 is a great product with excellent features. Product 2 - $39.99 offers premium quality and outstanding performance. Both products are highly recommended by customers and have received excellent reviews. The pricing is competitive and the quality is exceptional. Customers love these products and they are bestsellers in their category.',
                sections: [
                    {
                        type: 'paragraph' as const,
                        content: 'Product 1 - $29.99',
                    },
                    {
                        type: 'paragraph' as const,
                        content: 'Product 2 - $39.99',
                    },
                ],
                links: [
                    'https://example.com/product1',
                    'https://example.com/product2',
                ],
                images: ['https://example.com/image1.jpg'],
                headings: ['Products', 'Prices'],
                metadata: {
                    description: 'Test page with products',
                },
            },
            analysis: {
                summary: 'Test page with products and pricing information',
                keyPoints: 'Product 1 - $29.99, Product 2 - $39.99',
                categories: 'products, pricing',
            },
            metadata: {
                scrapedAt: new Date(),
                processingTime: 1000,
                contentLength: 1000,
            },
        };
    }

    /**
     * Create sample AI response data
     */
    static createSampleAiResponse() {
        return [
            {
                product_name: 'Test Product 1',
                price: '$29.99',
                description: 'Test product description',
            },
            {
                product_name: 'Test Product 2',
                price: '$39.99',
                description: 'Another test product',
            },
        ];
    }

    /**
     * Create sample parsed prompt
     */
    static createSampleParsedPrompt() {
        return {
            action: 'scrape' as const,
            target: 'products',
            fields: ['price', 'title'],
            format: 'csv' as const,
            additionalInstructions: 'Extract all available items',
        };
    }

    /**
     * Wait for async operations to complete
     */
    static async waitFor(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Create a mock file system for testing
     */
    static createMockFileSystem() {
        const mockFiles: Record<string, string> = {};

        return {
            writeFileSync: jest.fn((path: string, content: string) => {
                mockFiles[path] = content;
            }),
            readFileSync: jest.fn((path: string) => {
                return mockFiles[path] || '';
            }),
            existsSync: jest.fn((path: string) => {
                return path in mockFiles;
            }),
            mkdirSync: jest.fn(),
            getMockFiles: () => mockFiles,
            clearMockFiles: () => {
                Object.keys(mockFiles).forEach((key) => delete mockFiles[key]);
            },
        };
    }
}
