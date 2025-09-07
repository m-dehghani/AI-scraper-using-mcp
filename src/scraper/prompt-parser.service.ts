import { Injectable, Logger } from '@nestjs/common';
import { ParsedPrompt } from './interfaces';

@Injectable()
export class PromptParserService {
    private readonly logger = new Logger(PromptParserService.name);

    public parsePrompt(prompt: string): ParsedPrompt {
        this.logger.log(`Parsing prompt: ${prompt}`);

        const lowerPrompt = prompt.toLowerCase();

        // Determine action
        let action: 'scrape' | 'extract' | 'analyze' = 'scrape';
        if (lowerPrompt.includes('extract') || lowerPrompt.includes('get')) {
            action = 'extract';
        } else if (
            lowerPrompt.includes('analyze') ||
            lowerPrompt.includes('summarize')
        ) {
            action = 'analyze';
        }

        // Extract fields mentioned in the prompt
        const fields = this.extractFields(prompt);

        // Determine output format
        let format: 'csv' | 'json' | 'text' = 'csv';
        if (lowerPrompt.includes('json')) {
            format = 'json';
        } else if (
            lowerPrompt.includes('text') ||
            lowerPrompt.includes('summary')
        ) {
            format = 'text';
        }

        // Extract target (what to scrape)
        const target = this.extractTarget(prompt);

        // Extract additional instructions
        const additionalInstructions =
            this.extractAdditionalInstructions(prompt);

        const parsed: ParsedPrompt = {
            action,
            target,
            fields,
            format,
            additionalInstructions,
        };

        this.logger.log('Parsed prompt:', parsed);
        return parsed;
    }

    private extractFields(prompt: string): string[] {
        const fields: string[] = [];

        // Common field patterns
        const fieldPatterns = [
            { pattern: /(?:price|cost|amount|fee)/gi, field: 'price' },
            { pattern: /(?:title|name|product)/gi, field: 'title' },
            { pattern: /(?:description|desc|details)/gi, field: 'description' },
            { pattern: /(?:link|url|href)/gi, field: 'link' },
            { pattern: /(?:image|img|photo)/gi, field: 'image' },
            { pattern: /(?:rating|score|stars)/gi, field: 'rating' },
            {
                pattern: /(?:availability|stock|inventory)/gi,
                field: 'availability',
            },
            { pattern: /(?:category|type|genre)/gi, field: 'category' },
            { pattern: /(?:author|writer|creator)/gi, field: 'author' },
            { pattern: /(?:date|time|published)/gi, field: 'date' },
            { pattern: /(?:location|address|place)/gi, field: 'location' },
            { pattern: /(?:phone|contact|number)/gi, field: 'contact' },
        ];

        fieldPatterns.forEach(({ pattern, field }) => {
            if (pattern.test(prompt)) {
                fields.push(field);
            }
        });

        // If no specific fields found, add common defaults
        if (fields.length === 0) {
            fields.push('title', 'content', 'link');
        }

        return [...new Set(fields)]; // Remove duplicates
    }

    private extractTarget(prompt: string): string {
        const lowerPrompt = prompt.toLowerCase();

        // Look for specific targets
        if (lowerPrompt.includes('product')) {
            return 'products';
        } else if (
            lowerPrompt.includes('article') ||
            lowerPrompt.includes('post')
        ) {
            return 'articles';
        } else if (
            lowerPrompt.includes('news') ||
            lowerPrompt.includes('story')
        ) {
            return 'news';
        } else if (
            lowerPrompt.includes('job') ||
            lowerPrompt.includes('career')
        ) {
            return 'jobs';
        } else if (
            lowerPrompt.includes('event') ||
            lowerPrompt.includes('meeting')
        ) {
            return 'events';
        } else if (
            lowerPrompt.includes('review') ||
            lowerPrompt.includes('rating')
        ) {
            return 'reviews';
        } else if (
            lowerPrompt.includes('item') ||
            lowerPrompt.includes('listing')
        ) {
            return 'items';
        }

        return 'content'; // Default target
    }

    private extractAdditionalInstructions(prompt: string): string | undefined {
        const instructions: string[] = [];

        // Look for specific instructions
        if (prompt.includes('all') || prompt.includes('every')) {
            instructions.push('Extract all available items');
        }

        if (prompt.includes('first') || prompt.includes('top')) {
            instructions.push('Extract only the first/top items');
        }

        if (prompt.includes('latest') || prompt.includes('recent')) {
            instructions.push('Focus on latest/recent content');
        }

        if (prompt.includes('detailed') || prompt.includes('complete')) {
            instructions.push('Extract detailed information');
        }

        if (prompt.includes('brief') || prompt.includes('short')) {
            instructions.push('Extract brief information only');
        }

        return instructions.length > 0 ? instructions.join('. ') : undefined;
    }

    public generateScrapingSchema(
        parsedPrompt: ParsedPrompt,
    ): Record<string, string> {
        const schema: Record<string, string> = {};

        // Generate X-Ray schema based on parsed fields
        parsedPrompt.fields.forEach((field) => {
            switch (field) {
                case 'title':
                    schema.title = 'h1, .title, .product-title, .item-title';
                    break;
                case 'price':
                    schema.price = '.price, .cost, .amount, [class*="price"]';
                    break;
                case 'description':
                    schema.description = '.description, .content, .details, p';
                    break;
                case 'link':
                    schema.link = 'a@href';
                    break;
                case 'image':
                    schema.image = 'img@src';
                    break;
                case 'rating':
                    schema.rating =
                        '.rating, .stars, .score, [class*="rating"]';
                    break;
                case 'availability':
                    schema.availability = '.availability, .stock, .inventory';
                    break;
                case 'category':
                    schema.category = '.category, .type, .genre, .tag';
                    break;
                case 'author':
                    schema.author = '.author, .writer, .byline';
                    break;
                case 'date':
                    schema.date = '.date, .time, .published, time';
                    break;
                case 'location':
                    schema.location = '.location, .address, .place';
                    break;
                case 'contact':
                    schema.contact = '.phone, .contact, .number';
                    break;
                default:
                    schema[field] = `.${field}, [class*="${field}"]`;
            }
        });

        return schema;
    }
}
