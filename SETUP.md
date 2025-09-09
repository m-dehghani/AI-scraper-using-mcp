# AI-Powered Web Scraper Setup Guide

This application provides an AI-powered web scraping system with infinite scroll support, local LLM integration using Ollama, and Model Context Protocol (MCP) integration for seamless LLM orchestration.

## 🚀 Features

- **🤖 AI-Powered Analysis**: Local LLM integration using Ollama for privacy-focused content analysis
- **🌐 Infinite Scroll Support**: Advanced browser automation with Puppeteer-extra and stealth plugins
- **📊 Schema-Based Extraction**: AI-guided extraction using content-aware prompts
- **🔧 MCP Integration**: Standardized tool exposure for LLM agents and external systems
- **⚡ Batch Processing**: Efficient multi-URL scraping with parallel processing
- **🛡️ Anti-Detection**: Stealth browser automation to avoid bot detection
- **📈 Health Monitoring**: Built-in service health checks and monitoring
- **🎯 Flexible Parsing**: AI-centric parsing with Cheerio-based helpers

## 📋 Prerequisites

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

## 🛠️ Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Build the project:**
```bash
npm run build
```

3. **Run the application:**
```bash
npm start
```

## 🔧 Environment Configuration

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

## 🎯 Available MCP Tools

The application exposes the following MCP tools for LLM agent interaction:

### 1. `scrape-infinite-scroll`
Scrapes content from a web page with infinite scroll functionality and AI analysis.

**Parameters:**
- `url` (string): Target URL to scrape
- `maxScrolls` (number, optional): Maximum scroll attempts (default: 20)
- `scrollDelay` (number, optional): Delay between scrolls in ms (default: 2000)
- `analysisType` (enum): 'summary', 'extract', or 'categorize' (default: 'summary')
- `model` (string, optional): Ollama model to use (default: 'llama3')
- `chunkSize` (number, optional): Content chunk size for AI processing (default: 2000)

### 2. `scrape-batch-urls`
Scrapes multiple URLs in batch with infinite scroll and AI analysis.

**Parameters:**
- `urls` (array): Array of URLs to scrape (max 10)
- `maxScrolls`, `scrollDelay`, `analysisType`, `model`, `chunkSize` (same as above)

### 3. `extract-structured-data`
Extracts structured data from a web page based on a custom schema using AI.

**Parameters:**
- `url` (string): Target URL
- `schema` (string): Description of data to extract
- `maxScrolls`, `scrollDelay`, `model` (same as above)



### 6. `scraper-health-check`
Checks the health status of all scraper services.

## 📖 Usage Examples

### Single URL Scraping
```typescript
// Example: Scrape a news website with infinite scroll
const result = await scraper.scrapeAndAnalyze('https://example-news-site.com', {
    maxScrolls: 10,
    analysisType: 'summary',
    model: 'llama3'
});
```

### Batch Scraping
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

### Structured Data Extraction
```typescript
// Example: Extract product information
const schema = "Extract product name, price, description, and availability";
const result = await scraper.extractStructuredData(
    'https://ecommerce-site.com/product/123',
    schema
);
```



## 🏗️ Architecture

### Core Components

1. **McpClientService**: Puppeteer-extra browser automation with stealth capabilities
2. **HtmlParserService**: Cheerio-based HTML parsing and content extraction

4. **OllamaService**: Official Ollama package integration for local LLM inference
5. **ScraperService**: Orchestrates the complete scraping and analysis pipeline
6. **ScraperTool**: Exposes MCP tools for external LLM agent interaction

### Technology Stack

- **NestJS**: Modular backend framework with dependency injection
- **Puppeteer-extra + Stealth Plugin**: Advanced browser automation with anti-detection
- **Ollama**: Local LLM hosting and inference
- **Cheerio**: Server-side jQuery implementation for HTML parsing

- **Zod**: Runtime type validation for MCP tool parameters
- **TypeScript**: Type-safe development with modern ES features

### Features

- **Infinite Scroll Support**: Automatically handles infinite scroll pages
- **AI-Powered Analysis**: Uses local Ollama models for content analysis
- **Batch Processing**: Scrape multiple URLs efficiently
- **Structured Data Extraction**: Extract data according to custom schemas
- **Health Monitoring**: Built-in health checks for all services
- **Error Handling**: Robust error handling and retry mechanisms
- **Progress Reporting**: Real-time progress updates via MCP
- **Anti-Detection**: Stealth browser automation to avoid bot detection

## 🐛 Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   - Ensure Ollama is running: `ollama serve`
   - Check if the model is installed: `ollama list`
   - Verify the API endpoint: `curl http://localhost:11434/api/tags`

2. **Browser Launch Failed**
   - Puppeteer-extra handles browser installation automatically
   - Check system dependencies for headless browser support
   - Ensure sufficient system resources

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

## 🏃‍♂️ Development

### Available Scripts

```bash
# Development
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Lint
npm run lint

# Format
npm run format
```

### Project Structure
```
src/
├── ai/                    # AI/LLM integration
│   ├── ai.module.ts
│   └── ollama.service.ts
├── mcp/                   # MCP tools and protocol
│   ├── mcp.module.ts
│   ├── mcp-client.service.ts
│   ├── mcp.types.ts
│   └── scraper.tool.ts
├── scraper/               # Web scraping services
│   ├── scraper.module.ts
│   ├── scraper.service.ts
│   ├── html-parser.service.ts

├── app.module.ts          # Root module
└── main.ts               # Application entry point
```

### Adding New Features

1. **New Scraping Strategies**: Extend `McpClientService`
2. **Additional AI Models**: Enhance `OllamaService`
3. **Custom Parsers**: Add new methods to `HtmlParserService`
4. **New MCP Tools**: Create additional tools in `mcp/` directory

## 🔒 Security Considerations

- **Local LLM Processing**: All AI analysis happens locally using Ollama
- **No External API Calls**: Content analysis is performed on your own infrastructure
- **Stealth Browser Automation**: Anti-detection measures to avoid bot blocking
- **Rate Limiting**: Built-in delays and scroll management to be respectful to target sites

## 📄 License

This project is licensed under the MIT License.
