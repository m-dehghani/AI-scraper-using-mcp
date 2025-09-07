# AI-Powered Web Scraper Setup Guide

This application provides an AI-powered web scraping system with infinite scroll support and local LLM integration using Ollama.

## Prerequisites

### 1. Install Ollama
Download and install Ollama from [https://ollama.ai](https://ollama.ai)

### 2. Pull a Model
```bash
# Pull a lightweight model for testing
ollama pull llama3

# Or pull a more powerful model
ollama pull llama3.1:8b
```

### 3. Verify Ollama is Running
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

## Environment Configuration

Create a `.env` file in the project root:

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434

# Browser Configuration
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=30000

# Scraping Configuration
DEFAULT_MAX_SCROLLS=20
DEFAULT_SCROLL_DELAY=2000
DEFAULT_CHUNK_SIZE=2000

# AI Configuration
DEFAULT_MODEL=llama3
DEFAULT_TEMPERATURE=0.7
```

## Usage

### Running the Application
```bash
npm run start:dev
```

### Available MCP Tools

The application exposes the following MCP tools:

1. **scrape-infinite-scroll**: Scrape a single URL with infinite scroll support
2. **scrape-batch-urls**: Scrape multiple URLs in batch
3. **extract-structured-data**: Extract structured data according to a schema
4. **scraper-health-check**: Check the health status of services

### Example Usage

#### Single URL Scraping
```typescript
// Example: Scrape a news website with infinite scroll
const result = await scraper.scrapeAndAnalyze('https://example-news-site.com', {
    maxScrolls: 10,
    analysisType: 'summary',
    model: 'llama3'
});
```

#### Batch Scraping
```typescript
// Example: Scrape multiple URLs
const urls = [
    'https://site1.com',
    'https://site2.com',
    'https://site3.com'
];

const results = await scraper.scrapeMultipleUrls(urls, {
    maxScrolls: 5,
    analysisType: 'categorize'
});
```

#### Structured Data Extraction
```typescript
// Example: Extract product information
const schema = "Extract product name, price, description, and availability";
const result = await scraper.extractStructuredData(
    'https://ecommerce-site.com/product/123',
    schema
);
```

## Architecture

### Core Components

1. **BrowserManagerService**: Handles headless browser automation with Playwright
2. **HtmlParserService**: Parses and extracts content from HTML using Cheerio
3. **OllamaService**: Integrates with local Ollama LLM for AI analysis
4. **ScraperService**: Orchestrates the entire scraping pipeline
5. **ScraperTool**: Exposes MCP tools for external interaction

### Features

- **Infinite Scroll Support**: Automatically handles infinite scroll pages
- **AI-Powered Analysis**: Uses local Ollama models for content analysis
- **Batch Processing**: Scrape multiple URLs efficiently
- **Structured Data Extraction**: Extract data according to custom schemas
- **Health Monitoring**: Built-in health checks for all services
- **Error Handling**: Robust error handling and retry mechanisms
- **Progress Reporting**: Real-time progress updates via MCP

## Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   - Ensure Ollama is running: `ollama serve`
   - Check if the model is installed: `ollama list`
   - Verify the API endpoint: `curl http://localhost:11434/api/tags`

2. **Browser Launch Failed**
   - Install Playwright browsers: `npx playwright install chromium`
   - Check system dependencies for headless browser support

3. **Memory Issues**
   - Reduce `chunkSize` for large pages
   - Lower `maxScrolls` for pages with heavy content
   - Use smaller models (e.g., `llama3` instead of `llama3.1:8b`)

### Performance Tips

1. **Optimize Scroll Settings**
   - Adjust `scrollDelay` based on page load times
   - Set appropriate `maxScrolls` to avoid infinite loops

2. **AI Analysis Optimization**
   - Use smaller models for faster processing
   - Reduce `chunkSize` for better memory usage
   - Choose appropriate `analysisType` for your needs

3. **Resource Management**
   - Monitor memory usage during batch operations
   - Implement proper cleanup in long-running processes

## Development

### Project Structure
```
src/
├── scraper/          # Browser automation and HTML parsing
├── ai/               # Ollama integration
├── mcp/              # MCP tools and protocol
└── main.ts           # Application entry point
```

### Adding New Features

1. **New Scraping Strategies**: Extend `BrowserManagerService`
2. **Additional AI Models**: Enhance `OllamaService`
3. **Custom Parsers**: Add new methods to `HtmlParserService`
4. **New MCP Tools**: Create additional tools in `mcp/` directory

## License

This project is licensed under the MIT License.
