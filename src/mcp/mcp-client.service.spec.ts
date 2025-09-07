import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { McpClientService } from './mcp-client.service';
import { TestHelpers } from '../../test/utils/test-helpers';
import puppeteer from 'puppeteer-extra';

// Mock puppeteer
const mockPage = {
    goto: jest.fn(),
    title: jest.fn(),
    content: jest.fn(),
    evaluate: jest.fn(),
    close: jest.fn(),
    setUserAgent: jest.fn(),
    setViewport: jest.fn(),
    waitForSelector: jest.fn(),
    waitForTimeout: jest.fn(),
    scrollTo: jest.fn(),
    $: jest.fn(),
    $$: jest.fn(),
};

const mockBrowser = {
    newPage: jest.fn(),
    close: jest.fn(),
    pages: jest.fn(),
};

const mockPuppeteer = {
    launch: jest.fn(),
    connect: jest.fn(),
    use: jest.fn(),
};

jest.mock('puppeteer-extra', () => ({
    launch: jest.fn(),
    connect: jest.fn(),
    use: jest.fn(),
}));

describe('McpClientService', () => {
    let service: McpClientService;
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
                McpClientService,
                {
                    provide: Logger,
                    useValue: mockLogger,
                },
            ],
        }).compile();

        service = module.get<McpClientService>(McpClientService);

        // Setup default mocks
        mockBrowser.newPage.mockResolvedValue(mockPage);
        (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
        mockPage.goto.mockResolvedValue(undefined);
        mockPage.title.mockResolvedValue('Test Page');
        mockPage.content.mockResolvedValue(
            '<html><body>Test content</body></html>',
        );
        mockPage.evaluate.mockResolvedValue({});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('scrapeWebsite', () => {
        it('should scrape a website successfully', async () => {
            const options = {
                url: 'https://example.com',
                waitForNetworkIdle: true,
                maxScrolls: 5,
                scrollDelay: 1000,
            };

            const result = await service.scrapeWebsite(options);

            expect(result).toEqual({
                url: 'https://example.com',
                title: 'Test Page',
                content: '<html><body>Test content</body></html>',
                metadata: {},
                success: true,
            });

            expect((puppeteer.launch as jest.Mock).mock.calls.length).toBe(1);
            expect(mockPage.goto).toHaveBeenCalledWith(
                'https://example.com',
                expect.objectContaining({
                    waitUntil: 'networkidle2',
                    timeout: 60000,
                }),
            );
        });

        it('should handle navigation errors gracefully', async () => {
            const error = new Error('Navigation failed');
            mockPage.goto.mockRejectedValue(error);

            const options = {
                url: 'https://example.com',
                waitForNetworkIdle: false,
            };

            const result = await service.scrapeWebsite(options);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Navigation failed');
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Navigation failed'),
            );
        });

        it('should detect anti-bot protection', async () => {
            mockPage.title.mockResolvedValue('Just a moment...');

            const options = {
                url: 'https://example.com',
                waitForNetworkIdle: true,
            };

            await service.scrapeWebsite(options);

            expect(mockLogger.log).toHaveBeenCalledWith(
                'Detected anti-bot protection, waiting longer...',
            );
        });

        it('should handle infinite scroll', async () => {
            const options = {
                url: 'https://example.com',
                maxScrolls: 3,
                scrollDelay: 100,
            };

            // Mock scroll behavior
            let scrollCount = 0;
            mockPage.evaluate.mockImplementation((fn) => {
                if (fn.toString().includes('scrollTo')) {
                    scrollCount++;
                    return Promise.resolve();
                }
                return Promise.resolve({});
            });

            await service.scrapeWebsite(options);

            expect(mockLogger.log).toHaveBeenCalledWith(
                'Handling infinite scroll (3 scrolls, 100ms delay)',
            );
        });

        it('should handle browser initialization errors', async () => {
            const error = new Error('Browser launch failed');
            (puppeteer.launch as jest.Mock).mockRejectedValue(error);

            const options = {
                url: 'https://example.com',
            };

            const result = await service.scrapeWebsite(options);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Browser launch failed');
        });
    });

    describe('isHealthy', () => {
        it('should return true when browser can be launched', async () => {
            const result = await service.isHealthy();
            expect(result).toBe(true);
        });

        it('should return false when browser launch fails', async () => {
            (puppeteer.launch as jest.Mock).mockRejectedValue(
                new Error('Launch failed'),
            );

            const result = await service.isHealthy();
            expect(result).toBe(false);
        });
    });

    describe('cleanup', () => {
        it('should close browser on cleanup', async () => {
            await service.cleanup();

            expect(mockBrowser.close).toHaveBeenCalled();
        });

        it('should handle cleanup errors gracefully', async () => {
            mockBrowser.close.mockRejectedValue(new Error('Close failed'));

            await service.cleanup();

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error during cleanup:',
                expect.any(Error),
            );
        });
    });
});
