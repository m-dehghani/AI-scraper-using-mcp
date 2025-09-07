import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CsvExportService } from './csv-export.service';
import { TestHelpers } from '../../test/utils/test-helpers';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock path module
jest.mock('path');
const mockPath = path as jest.Mocked<typeof path>;

describe('CsvExportService', () => {
    let service: CsvExportService;
    let mockLogger: jest.Mocked<Logger>;

    beforeEach(async () => {
        mockLogger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CsvExportService,
                {
                    provide: Logger,
                    useValue: mockLogger,
                },
            ],
        }).compile();

        service = module.get<CsvExportService>(CsvExportService);

        // Setup default fs mocks
        mockFs.existsSync.mockReturnValue(true);
        mockFs.writeFileSync.mockImplementation(() => {});
        mockFs.mkdirSync.mockImplementation(() => '');

        // Setup default path mocks
        mockPath.join.mockImplementation((...args) => args.join('/'));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('exportToCsv', () => {
        it('should export data to CSV successfully', () => {
            const data = [
                { name: 'Product 1', price: '$10.99' },
                { name: 'Product 2', price: '$20.99' },
            ];
            const filename = 'test-products';
            const outputDir = './output';

            const result = service.exportToCsv(data, filename, outputDir);

            expect(result).toContain('test-products');
            expect(result).toContain('.csv');
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining('test-products'),
                expect.stringContaining('name,price'),
                'utf8',
            );
            // Check if fs methods were called
            expect(mockFs.writeFileSync).toHaveBeenCalled();
        });

        it('should create output directory if it does not exist', () => {
            mockFs.existsSync.mockReturnValue(false);

            const data = [{ name: 'Test' }];
            service.exportToCsv(data, 'test', './new-output');

            expect(mockFs.mkdirSync).toHaveBeenCalledWith('./new-output', {
                recursive: true,
            });
        });

        it('should throw error when no data to export', () => {
            const data: any[] = [];

            expect(() => {
                service.exportToCsv(data, 'test');
            }).toThrow('No data to export');
        });

        it('should handle file write errors', () => {
            const error = new Error('Write failed');
            mockFs.writeFileSync.mockImplementation(() => {
                throw error;
            });

            const data = [{ name: 'Test' }];

            expect(() => {
                service.exportToCsv(data, 'test');
            }).toThrow('CSV export failed: Write failed');

            // The error is logged and then re-thrown, so we just check that it was thrown
        });

        it('should generate timestamped filename when not provided', () => {
            const data = [{ name: 'Test' }];
            const filename = 'test';

            service.exportToCsv(data, filename);

            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                expect.stringMatching(
                    /test_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.csv/,
                ),
                expect.any(String),
                'utf8',
            );
        });

        it('should handle complex data structures', () => {
            const data = [
                {
                    name: 'Product 1',
                    price: '$10.99',
                    description: 'A great product',
                    metadata: { category: 'electronics' },
                },
                {
                    name: 'Product 2',
                    price: '$20.99',
                    description: 'Another great product',
                    metadata: { category: 'clothing' },
                },
            ];

            service.exportToCsv(data, 'complex-test');

            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('name,price,description,metadata'),
                'utf8',
            );
        });
    });

    describe('exportScrapedData', () => {
        it('should export scraped data with product extraction', () => {
            const scrapedData = TestHelpers.createSampleScrapedData();
            const prompt = 'scrape products and prices';

            const result = service.exportScrapedData(
                scrapedData,
                prompt,
                'https://example.com',
                './output',
            );

            expect(result).toContain('.csv');
            expect(mockFs.writeFileSync).toHaveBeenCalled();
        });

        it('should handle empty scraped data', () => {
            const scrapedData = {
                url: 'https://example.com',
                title: 'Empty Page',
                hasContent: false,
                contentKeys: [],
                contentTextLength: 0,
                content: {
                    text: '',
                    sections: [],
                    links: [],
                    images: [],
                    headings: [],
                    metadata: {},
                },
            };

            expect(() => {
                service.exportScrapedData(
                    scrapedData,
                    'test prompt',
                    'https://example.com',
                );
            }).toThrow('CSV export failed: No data to export');
        });

        it('should extract product information correctly', () => {
            const scrapedData = {
                url: 'https://example.com',
                title: 'Product Page',
                hasContent: true,
                contentKeys: ['sections'],
                contentTextLength: 100,
                content: {
                    text: 'Product 1 - $29.99\nProduct 2 - $39.99',
                    sections: [
                        {
                            type: 'paragraph',
                            content: 'Product 1 - $29.99',
                        },
                        {
                            type: 'paragraph',
                            content: 'Product 2 - $39.99',
                        },
                    ],
                    links: [],
                    images: [],
                    headings: [],
                    metadata: {},
                },
            };

            service.exportScrapedData(
                scrapedData,
                'scrape products and prices',
                'https://example.com',
            );

            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('product_name,price'),
                'utf8',
            );
        });
    });

    describe('private methods', () => {
        it('should extract product names correctly', () => {
            const content = 'Amazing Gaming Headset - $99.99';
            const result = (service as any).extractProductName(content);
            expect(result).toBe('Amazing Gaming Headset - $99.99');
        });

        it('should detect product-like content', () => {
            const productContent = 'Buy now - Add to cart - $29.99';
            const nonProductContent = 'This is just a regular paragraph';

            expect((service as any).looksLikeProduct(productContent)).toBe(
                true,
            );
            expect((service as any).looksLikeProduct(nonProductContent)).toBe(
                false,
            );
        });

        it('should generate CSV content correctly', () => {
            const data = [
                { name: 'Test 1', value: 'Value 1' },
                { name: 'Test 2', value: 'Value 2' },
            ];

            const result = (service as any).generateCsvContent(data);

            expect(result).toContain('name,value');
            expect(result).toContain('Test 1,Value 1');
            expect(result).toContain('Test 2,Value 2');
        });

        it('should handle special characters in CSV', () => {
            const data = [
                {
                    name: 'Product with "quotes"',
                    description: 'Description with, comma',
                },
            ];

            const result = (service as any).generateCsvContent(data);

            expect(result).toContain('"Product with ""quotes"""');
            expect(result).toContain('"Description with, comma"');
        });
    });
});
