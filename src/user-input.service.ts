import { Injectable, Logger } from '@nestjs/common';
import * as readline from 'readline';

@Injectable()
export class UserInputService {
    private readonly logger = new Logger(UserInputService.name);
    private rl: readline.Interface;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }

    public async getUserInput(prompt: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    public async getScrapingPrompt(): Promise<{ prompt: string; url: string }> {
        console.log('\n=== AI-Powered Web Scraper ===');
        console.log('Enter your scraping request. Examples:');
        console.log('- "scrape all products and their prices from this site"');
        console.log('- "extract article titles and authors"');
        console.log('- "get all job listings with salaries"');
        console.log('- "scrape product reviews and ratings"');
        console.log('');
        console.log('💡 Tip: Try simpler sites first like:');
        console.log('   - https://example.com');
        console.log('   - https://httpbin.org/html');
        console.log('   - https://quotes.toscrape.com/');
        console.log('');

        const prompt = await this.getUserInput(
            'What would you like to scrape? ',
        );
        const url = await this.getUserInput('Enter the URL to scrape: ');

        return { prompt, url };
    }

    public async askForAnotherScrape(): Promise<boolean> {
        const answer = await this.getUserInput(
            '\nWould you like to scrape another site? (y/n): ',
        );
        return answer.toLowerCase().startsWith('y');
    }

    public displayResult(result: any): void {
        console.log('\n=== Scraping Result ===');

        if (result.success) {
            console.log(`✅ Success: ${result.message}`);
            if (result.outputFile) {
                console.log(`📁 Output saved to: ${result.outputFile}`);
            }
            if (result.data && result.data.length > 0) {
                console.log(`📊 Extracted ${result.data.length} items:`);
                result.data.slice(0, 3).forEach((item: any, index: number) => {
                    console.log(
                        `  ${index + 1}. ${JSON.stringify(item, null, 2)}`,
                    );
                });
                if (result.data.length > 3) {
                    console.log(
                        `  ... and ${result.data.length - 3} more items`,
                    );
                }
            }
        } else {
            console.log(`❌ Error: ${result.message}`);
            if (result.error) {
                console.log(`   Details: ${result.error}`);
            }
        }
    }

    public displayWelcome(): void {
        console.log('\n🚀 Welcome to AI-Powered Web Scraper!');
        console.log(
            'This tool can scrape websites based on your natural language prompts.',
        );
        console.log(
            'It will extract the data you request and save it to a CSV file.',
        );
        console.log('');
    }

    public displayGoodbye(): void {
        console.log('\n👋 Thank you for using AI-Powered Web Scraper!');
        console.log('Goodbye!');
    }

    public close(): void {
        this.rl.close();
    }
}
