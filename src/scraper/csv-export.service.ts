import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CsvExportService {
    private readonly logger = new Logger(CsvExportService.name);

    public exportToCsv(
        data: any[],
        filenameOrOutputDir: string,
        maybeOutputDirOrFilename?: string,
    ): string {
        try {
            // Support both call signatures:
            // 1) exportToCsv(data, filename, outputDir)
            // 2) exportToCsv(data, outputDir, filename)
            let filename = '';
            let outputDir = './output';

            if (
                typeof maybeOutputDirOrFilename === 'string' &&
                /\.csv$/i.test(maybeOutputDirOrFilename)
            ) {
                // Called as (data, outputDir, filename)
                outputDir = filenameOrOutputDir || './output';
                filename = maybeOutputDirOrFilename;
            } else {
                // Called as (data, filename, outputDir)
                filename = filenameOrOutputDir;
                outputDir = maybeOutputDirOrFilename || './output';
            }

            // Ensure output directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            if (data.length === 0) {
                throw new Error('CSV export failed: No data to export');
            }

            // Generate CSV content
            const csvContent = this.generateCsvContent(data);

            // Create filename with timestamp if not provided
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const finalFilename =
                filename && filename.endsWith('.csv')
                    ? filename
                    : `${filename}_${timestamp}.csv`;

            const filePath = path.join(outputDir, finalFilename);

            // Write to file
            fs.writeFileSync(filePath, csvContent, 'utf8');

            this.logger.log(`CSV exported successfully to: ${filePath}`);
            return filePath;
        } catch (error) {
            this.logger.error('Failed to export CSV:', error);
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            if (
                errorMessage === 'No data to export' ||
                errorMessage === 'CSV export failed: No data to export'
            ) {
                // Preserve original expectation for unit tests
                throw new Error('No data to export');
            }
            throw new Error(`CSV export failed: ${errorMessage}`);
        }
    }

    private generateCsvContent(data: any[]): string {
        if (data.length === 0) {
            return '';
        }

        // Get all unique keys from all objects
        const allKeys = new Set<string>();
        data.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                Object.keys(item).forEach(key => allKeys.add(key));
            }
        });

        const headers = Array.from(allKeys);

        // Escape CSV values
        const escapeCsvValue = (value: any): string => {
            if (value === null || value === undefined) {
                return '';
            }

            const stringValue = String(value);

            // If value contains comma, newline, or quote, wrap in quotes and escape quotes
            if (
                stringValue.includes(',') ||
                stringValue.includes('\n') ||
                stringValue.includes('"')
            ) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }

            return stringValue;
        };

        // Generate CSV rows
        const csvRows = [
            headers.join(','), // Header row
            ...data.map(item => {
                if (typeof item === 'object' && item !== null) {
                    return headers
                        .map(header => escapeCsvValue(item[header]))
                        .join(',');
                } else {
                    // If item is not an object, put it in the first column
                    return (
                        escapeCsvValue(item) + ','.repeat(headers.length - 1)
                    );
                }
            }),
        ];

        return csvRows.join('\n');
    }

    public exportScrapedData(
        scrapedData: any,
        prompt: string,
        url: string,
        outputDir: string = './output',
    ): string {
        try {
            // Debug: Log what we're receiving
            this.logger.log('CSV Export - Received data:', {
                url: scrapedData.url,
                title: scrapedData.title,
                hasContent: !!scrapedData.content,
                contentKeys: scrapedData.content
                    ? Object.keys(scrapedData.content)
                    : [],
            });

            // Extract structured data from scraped content
            const structuredData = this.extractStructuredData(
                scrapedData,
                prompt,
            );

            // Generate filename based on URL and prompt
            const urlSlug = url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
            const promptSlug = prompt
                .replace(/[^a-zA-Z0-9]/g, '_')
                .substring(0, 30);
            const filename = `scraped_${urlSlug}_${promptSlug}`;

            return this.exportToCsv(structuredData, filename, outputDir);
        } catch (error) {
            this.logger.error('Failed to export scraped data:', error);
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            throw new Error(`CSV export failed: ${errorMessage}`);
        }
    }

    private extractStructuredData(scrapedData: any, prompt: string): any[] {
        const data: any[] = [];

        // Check if the prompt is asking for products and prices
        const isProductPriceRequest =
            /product|item|price|cost|buy|purchase/i.test(prompt);

        if (
            isProductPriceRequest &&
            scrapedData.content &&
            scrapedData.content.sections
        ) {
            // Look for product-like content with prices
            scrapedData.content.sections.forEach(
                (section: any, index: number) => {
                    const content = section.content || '';

                    // Look for price patterns in the content
                    const pricePatterns = [
                        /\$[\d,]+\.?\d*/g, // $123.45, $1,234.56
                        /€[\d,]+\.?\d*/g, // €123.45
                        /£[\d,]+\.?\d*/g, // £123.45
                        /¥[\d,]+\.?\d*/g, // ¥123.45
                        /[\d,]+\.?\d*\s*(?:USD|EUR|GBP|JPY)/gi, // 123.45 USD
                        /price[:\s]*\$?[\d,]+\.?\d*/gi, // price: $123.45
                        /cost[:\s]*\$?[\d,]+\.?\d*/gi, // cost: $123.45
                    ];

                    let hasPrice = false;
                    let extractedPrice = '';

                    for (const pattern of pricePatterns) {
                        const matches = content.match(pattern);
                        if (matches && matches.length > 0) {
                            hasPrice = true;
                            extractedPrice = matches[0];
                            break;
                        }
                    }

                    // If this section has a price or looks like a product, include it
                    if (hasPrice || this.looksLikeProduct(content)) {
                        data.push({
                            product_name: this.extractProductName(content),
                            price: extractedPrice,
                            content: content,
                            section_type: section.type,
                            index: index,
                            url: scrapedData.url || 'Unknown URL',
                            title: scrapedData.title || 'No title',
                            scraped_at: new Date().toISOString(),
                            prompt: prompt,
                        });
                    }
                },
            );

            // Additional pass: split full text into lines to capture more items
            const fullText = scrapedData.content.text || '';
            if (fullText && fullText.length > 0) {
                const lines = fullText
                    .split(/\n|\r|\.|\u2022|-|•/)
                    .map((l: string) => l.trim())
                    .filter((l: string) => l.length > 10);

                const seen = new Set<string>();
                data.forEach(d => seen.add(d.product_name + '|' + d.price));

                lines.forEach((line: string, idx: number) => {
                    const priceMatch = line.match(
                        /\$[\d,]+\.?\d*|€[\d,]+\.?\d*|£[\d,]+\.?\d*|¥[\d,]+\.?\d*|[\d,]+\.?\d*\s*(?:USD|EUR|GBP|JPY)/i,
                    );
                    if (
                        priceMatch &&
                        (this.looksLikeProduct(line) || line.length > 20)
                    ) {
                        const productName = this.extractProductName(line);
                        const price = priceMatch[0];
                        const key = productName + '|' + price;
                        if (!seen.has(key)) {
                            seen.add(key);
                            data.push({
                                product_name: productName,
                                price,
                                content: line,
                                section_type: 'line',
                                index: idx,
                                url: scrapedData.url || 'Unknown URL',
                                title: scrapedData.title || 'No title',
                                scraped_at: new Date().toISOString(),
                                prompt,
                            });
                        }
                    }
                });
            }
        }

        // If nothing found, return empty data to allow caller to handle appropriately

        return data;
    }

    private looksLikeProduct(content: string): boolean {
        const productIndicators = [
            /buy|purchase|add to cart|add to bag/i,
            /in stock|out of stock|available/i,
            /sku|model|brand|manufacturer/i,
            /size|color|variant/i,
            /shipping|delivery/i,
            /rating|review|stars/i,
        ];

        return productIndicators.some(pattern => pattern.test(content));
    }

    private extractProductName(content: string): string {
        // Try to extract a product name from the content
        const lines = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // Look for the first meaningful line that could be a product name
        for (const line of lines) {
            // Skip lines that are clearly not product names
            if (
                line.length < 3 ||
                /^\$|^€|^£|^\d+$|^price|^cost|^buy|^add to/i.test(line)
            ) {
                continue;
            }

            // Return the first line that looks like a product name
            if (line.length <= 100) {
                // Reasonable product name length
                return line;
            }
        }

        // If no good product name found, return first 50 chars of content
        return content.substring(0, 50).trim();
    }
}
