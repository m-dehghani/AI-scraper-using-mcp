import { Injectable, Logger } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { PromptParserService } from './prompt-parser.service';
import { CsvExportService } from './csv-export.service';
import { XRayParserService } from './xray-parser.service';
import { OllamaService } from '../ai/ollama.service';
import {
    PromptScrapingRequest,
    PromptScrapingResult,
    ParsedPrompt,
} from './interfaces';

@Injectable()
export class InteractiveScraperService {
    private readonly logger = new Logger(InteractiveScraperService.name);

    constructor(
        private readonly scraperService: ScraperService,
        private readonly promptParser: PromptParserService,
        private readonly csvExport: CsvExportService,
        private readonly xrayParser: XRayParserService,
        private readonly ollamaService: OllamaService,
    ) {}

    public async processPromptRequest(
        request: PromptScrapingRequest,
    ): Promise<PromptScrapingResult> {
        try {
            this.logger.log(`Processing prompt request: ${request.prompt}`);

            // Parse the user prompt
            const parsedPrompt = this.promptParser.parsePrompt(request.prompt);

            // Scrape the website
            const scrapedData = await this.scraperService.scrapeAndAnalyze(
                request.url,
                {
                    maxScrolls: 10,
                    scrollDelay: 2000,
                    analysisType: 'extract',
                },
            );

            // Debug: Log the scraped data structure
            this.logger.log('Scraped data structure:', {
                url: scrapedData.url,
                title: scrapedData.title,
                hasContent: !!scrapedData.content,
                contentKeys: scrapedData.content
                    ? Object.keys(scrapedData.content)
                    : [],
                contentTextLength: scrapedData.content?.text?.length || 0,
            });

            // Extract structured data based on the prompt
            let structuredData = await this.extractDataBasedOnPrompt(
                scrapedData,
                parsedPrompt,
                request.prompt,
            );

            // If AI returned too few items, supplement with basic extraction and de-duplicate
            if (Array.isArray(structuredData) && structuredData.length < 10) {
                const supplemental = this.extractBasicData(
                    scrapedData,
                    parsedPrompt,
                );
                const seen = new Set<string>();
                const merged: any[] = [];
                const pushUnique = (item: any) => {
                    const key = JSON.stringify(item);
                    if (!seen.has(key)) {
                        seen.add(key);
                        merged.push(item);
                    }
                };
                structuredData.forEach(pushUnique);
                supplemental.forEach(pushUnique);
                structuredData = merged.slice(0, 50);
            }

            // Export to CSV
            let outputFile: string | undefined;
            if (request.outputFormat === 'csv' || !request.outputFormat) {
                // Generate filename based on URL and prompt
                const urlSlug = request.url
                    .replace(/[^a-zA-Z0-9]/g, '_')
                    .substring(0, 50);
                const promptSlug = request.prompt
                    .replace(/[^a-zA-Z0-9]/g, '_')
                    .substring(0, 30);
                const filename = `scraped_${urlSlug}_${promptSlug}`;

                // Use the AI-extracted structured data
                outputFile = this.csvExport.exportToCsv(
                    structuredData,
                    filename,
                    request.outputPath || './output',
                );
            }

            return {
                success: true,
                data: structuredData,
                outputFile,
                message: `Successfully scraped and exported ${structuredData.length} items to ${outputFile}`,
            };
        } catch (error) {
            this.logger.error('Prompt processing failed:', error);

            return {
                success: false,
                data: [],
                outputFile: undefined,
                message: 'Scraping failed - no data extracted',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async extractDataBasedOnPrompt(
        scrapedData: any,
        parsedPrompt: ParsedPrompt,
        originalPrompt: string,
    ): Promise<any[]> {
        try {
            // If Ollama is available, use AI to extract structured data
            const isOllamaAvailable = await this.ollamaService.isAvailable();
            this.logger.log(
                'extractDataBasedOnPrompt - isOllamaAvailable:',
                isOllamaAvailable,
            );

            if (isOllamaAvailable) {
                this.logger.log(
                    'extractDataBasedOnPrompt - Using AI extraction',
                );
                const aiData = await this.extractWithAI(
                    scrapedData,
                    parsedPrompt,
                    originalPrompt,
                );

                // Fallback if AI returns no data
                if (Array.isArray(aiData) && aiData.length > 0) {
                    return aiData;
                }

                this.logger.warn(
                    'AI returned no data, falling back to basic extraction',
                );
                return this.extractBasicData(scrapedData, parsedPrompt);
            } else {
                this.logger.log(
                    'extractDataBasedOnPrompt - Using X-Ray extraction',
                );
                // Fallback to X-Ray extraction
                return await this.extractWithXRay(scrapedData, parsedPrompt);
            }
        } catch (error) {
            this.logger.error('Data extraction failed:', error);
            // Return basic extracted data
            return this.extractBasicData(scrapedData, parsedPrompt);
        }
    }

    private tryParseJson(jsonString: string): any {
        try {
            return JSON.parse(jsonString);
        } catch (parseError) {
            this.logger.warn(
                'JSON parsing failed, trying to clean the response:',
                parseError.message,
            );

            // Try to clean the JSON by removing common issues
            const cleanedJson = jsonString
                .replace(/,\s*}/g, '}') // Remove trailing commas
                .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
                .replace(/\n/g, ' ') // Replace newlines with spaces
                .replace(/\s+/g, ' '); // Normalize whitespace

            try {
                return JSON.parse(cleanedJson);
            } catch (secondError) {
                this.logger.warn(
                    'Second JSON parsing attempt failed:',
                    secondError.message,
                );
                return null;
            }
        }
    }

    private async extractWithAI(
        scrapedData: any,
        parsedPrompt: ParsedPrompt,
        originalPrompt: string,
    ): Promise<any[]> {
        // Extract content from various possible structures
        let content = '';
        if (scrapedData.content?.text) {
            content = scrapedData.content.text;
        } else if (typeof scrapedData.content === 'string') {
            content = scrapedData.content;
        } else if (scrapedData.content) {
            // If content is an object, try to extract text from it
            content = JSON.stringify(scrapedData.content);
        }
        const title = scrapedData.title || '';

        // Debug logging (can be removed in production)
        // this.logger.log('extractWithAI - Content length:', content.length);
        this.logger.log('extractWithAI - Title:', title);
        this.logger.log('extractWithAI - Content length:', content.length);
        this.logger.log(
            'extractWithAI - Content preview:',
            content.substring(0, 200),
        );

        // Check if we have sufficient content to extract real data
        // Use a lower threshold for testing or when content is clearly valid
        const minContentLength = process.env.NODE_ENV === 'test' ? 50 : 100;

        if (
            content.length < minContentLength ||
            title.includes('Just a moment') ||
            title.includes('Checking your browser') ||
            content.includes('Just a moment') ||
            content.includes('Checking your browser')
        ) {
            this.logger.warn(
                'Insufficient content detected, returning empty array to prevent fake data generation',
            );
            return [];
        }

        // Helper to build prompt per chunk
        const buildPrompt = (chunk: string) => `
You are a web scraping assistant. Extract the requested information from the web content.

User Request: "${originalPrompt}"
Target: ${parsedPrompt.target}
Fields to extract: ${parsedPrompt.fields.join(', ')}

Web Content:
${chunk}

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON array, no additional text, explanations, or markdown
- Do not include any text before or after the JSON array
- Ensure all JSON is properly formatted with correct quotes and commas
- Extract ONLY REAL data from the web content - NEVER use example, placeholder, or generic data
- DO NOT generate fake product names like "Product Name" or "Another Product"
- DO NOT generate fake prices like "$29.99" or "€25.50" unless they actually appear in the content
- If the user is asking for products and prices, look for actual product names and their corresponding prices from the content
- Extract prices in their original format (e.g., $29.99, €25.50, £19.99) ONLY if they exist in the content
- For product names, use the actual names found in the content
- If no real products/prices are found in the content, return an empty array []
- If the content is insufficient (like "Just a moment..." or very short text), return an empty array []
 - Return as many distinct items as present (up to 50). Do not omit items.

Return only the JSON array with real data extracted from the content above:`;

        const chunkSize = 3500;
        const chunks: string[] = [];
        for (let i = 0; i < content.length; i += chunkSize) {
            chunks.push(
                content.substring(i, Math.min(i + chunkSize, content.length)),
            );
        }

        const aggregated: any[] = [];
        const seen = new Set<string>();

        const parseFromResponse = (aiResponse: string): any[] | null => {
            // Method 1: Look for JSON array pattern
            const arrayMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                const arr = this.tryParseJson(arrayMatch[0]);
                if (Array.isArray(arr)) return arr;
            }
            // Method 2: Object pattern
            const objMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (objMatch) {
                const obj = this.tryParseJson(objMatch[0]);
                if (obj && !Array.isArray(obj)) return [obj];
                if (Array.isArray(obj)) return obj;
            }
            // Method 3: Common prefixes
            const prefixes = [
                'JSON Array:',
                'Result:',
                'Data:',
                'Extracted Data:',
            ];
            for (const prefix of prefixes) {
                const idx = aiResponse.indexOf(prefix);
                if (idx !== -1) {
                    const after = aiResponse
                        .substring(idx + prefix.length)
                        .trim();
                    const m = after.match(/\[[\s\S]*\]/);
                    if (m) {
                        const arr = this.tryParseJson(m[0]);
                        if (Array.isArray(arr)) return arr;
                    }
                }
            }
            return null;
        };

        try {
            for (const [idx, chunk] of chunks.entries()) {
                this.logger.log(
                    `AI extraction on chunk ${idx + 1}/${chunks.length}`,
                );
                const aiResponse = await this.ollamaService.processPrompt(
                    buildPrompt(chunk),
                    { model: 'llama3.2:1b', temperature: 0.1 },
                );

                const items = parseFromResponse(aiResponse);
                if (items && items.length > 0) {
                    for (const item of items) {
                        const key = JSON.stringify(item);
                        if (!seen.has(key)) {
                            seen.add(key);
                            aggregated.push(item);
                        }
                    }
                }
            }

            if (aggregated.length > 0) {
                return aggregated;
            }
            throw new Error('AI response does not contain valid JSON array');
        } catch (error) {
            this.logger.warn(
                'AI extraction failed, falling back to basic extraction:',
                error,
            );
            return this.extractBasicData(scrapedData, parsedPrompt);
        }
    }

    private async extractWithXRay(
        scrapedData: any,
        parsedPrompt: ParsedPrompt,
    ): Promise<any[]> {
        try {
            // Generate X-Ray schema based on parsed prompt
            const schema =
                this.promptParser.generateScrapingSchema(parsedPrompt);

            // Use X-Ray to extract data from the HTML
            const extractedData = await this.xrayParser.parseWithSchema(
                scrapedData.content?.html || scrapedData.html || '',
                schema,
            );

            return Array.isArray(extractedData)
                ? extractedData
                : [extractedData];
        } catch (error) {
            this.logger.warn(
                'X-Ray extraction failed, falling back to basic extraction:',
                error,
            );
            return this.extractBasicData(scrapedData, parsedPrompt);
        }
    }

    private extractBasicData(
        scrapedData: any,
        parsedPrompt: ParsedPrompt,
    ): any[] {
        const data: any[] = [];

        // Extract basic information from scraped content
        if (scrapedData.content && scrapedData.content.sections) {
            scrapedData.content.sections.forEach(
                (section: any, index: number) => {
                    const item: any = {
                        index: index,
                        url: scrapedData.url,
                        scraped_at: new Date().toISOString(),
                    };

                    // Add fields based on parsed prompt
                    parsedPrompt.fields.forEach((field) => {
                        switch (field) {
                            case 'title':
                                item.title =
                                    section.content ||
                                    scrapedData.title ||
                                    'No title';
                                break;
                            case 'content':
                            case 'description':
                                item.description =
                                    section.content || 'No description';
                                break;
                            case 'link':
                                item.link = scrapedData.url;
                                break;
                            case 'price': {
                                // Try to extract price from this specific section
                                const pricePatterns = [
                                    /\$[\d,]+\.?\d*/g,
                                    /€[\d,]+\.?\d*/g,
                                    /£[\d,]+\.?\d*/g,
                                    /¥[\d,]+\.?\d*/g,
                                    /[\d,]+\.?\d*\s*(?:USD|EUR|GBP|JPY)/gi,
                                ];

                                let extractedPrice = '';
                                for (const pattern of pricePatterns) {
                                    const matches =
                                        section.content?.match(pattern);
                                    if (matches && matches.length > 0) {
                                        extractedPrice = matches[0];
                                        break;
                                    }
                                }
                                item[field] =
                                    extractedPrice || 'Price not found';
                                break;
                            }
                            default:
                                item[field] = section.content || null;
                        }
                    });

                    data.push(item);
                },
            );
        }

        // If no sections found, create a comprehensive basic entry
        if (data.length === 0) {
            const basicItem: any = {
                url: scrapedData.url || 'Unknown URL',
                scraped_at: new Date().toISOString(),
            };

            parsedPrompt.fields.forEach((field) => {
                switch (field) {
                    case 'title':
                        basicItem.title = scrapedData.title || 'No title';
                        break;
                    case 'content':
                    case 'description':
                        basicItem.description =
                            scrapedData.content?.text || 'No content';
                        break;
                    case 'link':
                        basicItem.link = scrapedData.url || 'Unknown URL';
                        break;
                    case 'price': {
                        // Try to extract price from the overall content
                        const pricePatterns = [
                            /\$[\d,]+\.?\d*/g,
                            /€[\d,]+\.?\d*/g,
                            /£[\d,]+\.?\d*/g,
                            /¥[\d,]+\.?\d*/g,
                            /[\d,]+\.?\d*\s*(?:USD|EUR|GBP|JPY)/gi,
                        ];

                        let extractedPrice = '';
                        for (const pattern of pricePatterns) {
                            const matches =
                                scrapedData.content?.text?.match(pattern);
                            if (matches && matches.length > 0) {
                                extractedPrice = matches[0];
                                break;
                            }
                        }
                        basicItem.price = extractedPrice || 'Price not found';
                        break;
                    }
                    case 'image':
                        basicItem.image =
                            scrapedData.content?.images?.[0] || null;
                        break;
                    default:
                        basicItem[field] = null;
                }
            });

            // Add additional useful fields
            if (scrapedData.content) {
                if (
                    scrapedData.content.links &&
                    scrapedData.content.links.length > 0
                ) {
                    basicItem.links = scrapedData.content.links
                        .slice(0, 3)
                        .join('; ');
                }
                if (
                    scrapedData.content.headings &&
                    scrapedData.content.headings.length > 0
                ) {
                    basicItem.headings = scrapedData.content.headings
                        .slice(0, 3)
                        .join('; ');
                }
            }

            data.push(basicItem);
        }

        return data;
    }

    public async getHealthStatus(): Promise<{
        scraper: boolean;
        ollama: boolean;
        overall: boolean;
    }> {
        const scraperHealth = await this.scraperService.getHealthStatus();

        return {
            scraper: scraperHealth.overall,
            ollama: scraperHealth.ollama,
            overall: scraperHealth.overall,
        };
    }
}
