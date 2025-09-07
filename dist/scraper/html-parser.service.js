"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var HtmlParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlParserService = void 0;
const common_1 = require("@nestjs/common");
const cheerio = __importStar(require("cheerio"));
let HtmlParserService = HtmlParserService_1 = class HtmlParserService {
    logger = new common_1.Logger(HtmlParserService_1.name);
    parseContent(html) {
        const $ = cheerio.load(html);
        this.removeUnwantedElements($);
        const title = this.extractTitle($);
        const text = this.extractText($);
        const links = this.extractLinks($);
        const images = this.extractImages($);
        const headings = this.extractHeadings($);
        const metadata = this.extractMetadata($);
        const sections = this.extractSections($);
        this.logger.log(`Parsed content: ${sections.length} sections, ${links.length} links`);
        return {
            title,
            text,
            links,
            images,
            headings,
            metadata,
            sections,
        };
    }
    extractRelevantContent(html, selectors = []) {
        const $ = cheerio.load(html);
        this.removeUnwantedElements($);
        const content = [];
        if (selectors.length > 0) {
            selectors.forEach(selector => {
                $(selector).each((_, element) => {
                    const text = $(element).text().trim();
                    if (text) {
                        content.push(text);
                    }
                });
            });
        }
        else {
            const defaultSelectors = [
                'article',
                '.content',
                '.main-content',
                '.post-content',
                '.entry-content',
                '.article-content',
                'main',
                '.container',
            ];
            defaultSelectors.forEach(selector => {
                $(selector).each((_, element) => {
                    const text = $(element).text().trim();
                    if (text && text.length > 100) {
                        content.push(text);
                    }
                });
            });
            if (content.length === 0) {
                const bodyText = $('body').text().trim();
                if (bodyText) {
                    content.push(bodyText);
                }
            }
        }
        return content.filter(text => text.length > 50);
    }
    removeUnwantedElements($) {
        $('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar').remove();
        $('[class*="ad-"], [class*="sponsor"], [class*="promo"]').remove();
        $('[data-ad], [data-sponsor], [data-promo]').remove();
    }
    extractTitle($) {
        return ($('title').text().trim() ||
            $('h1').first().text().trim() ||
            'Untitled');
    }
    extractText($) {
        return $('body').text().replace(/\s+/g, ' ').trim();
    }
    extractLinks($) {
        const links = [];
        $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            if (href &&
                !href.startsWith('#') &&
                !href.startsWith('javascript:')) {
                links.push(href);
            }
        });
        return [...new Set(links)];
    }
    extractImages($) {
        const images = [];
        $('img[src]').each((_, element) => {
            const src = $(element).attr('src');
            if (src) {
                images.push(src);
            }
        });
        return [...new Set(images)];
    }
    extractHeadings($) {
        const headings = [];
        $('h1, h2, h3, h4, h5, h6').each((_, element) => {
            const text = $(element).text().trim();
            if (text) {
                headings.push(text);
            }
        });
        return headings;
    }
    extractMetadata($) {
        const metadata = {};
        $('meta').each((_, element) => {
            const name = $(element).attr('name') || $(element).attr('property');
            const content = $(element).attr('content');
            if (name && content) {
                metadata[name] = content;
            }
        });
        return metadata;
    }
    extractSections($) {
        const sections = [];
        $('h1, h2, h3, h4, h5, h6').each((_, element) => {
            const heading = $(element);
            const level = parseInt(heading.prop('tagName')?.substring(1) ?? '1');
            const text = heading.text().trim();
            if (text) {
                sections.push({
                    type: 'heading',
                    content: text,
                    level,
                });
            }
        });
        $('p').each((_, element) => {
            const text = $(element).text().trim();
            if (text && text.length > 20) {
                sections.push({
                    type: 'paragraph',
                    content: text,
                });
            }
        });
        $('ul, ol').each((_, element) => {
            const list = $(element);
            const items = [];
            list.find('li').each((_, li) => {
                const text = $(li).text().trim();
                if (text) {
                    items.push(text);
                }
            });
            if (items.length > 0) {
                sections.push({
                    type: 'list',
                    content: list.prop('tagName') === 'UL'
                        ? 'Unordered List'
                        : 'Ordered List',
                    items,
                });
            }
        });
        $('table').each((_, element) => {
            const table = $(element);
            const text = table.text().trim();
            if (text && text.length > 50) {
                sections.push({
                    type: 'table',
                    content: text,
                });
            }
        });
        return sections;
    }
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }
    chunkContent(content, maxChunkSize = 2000) {
        const chunks = [];
        const sentences = content.split(/[.!?]+/);
        let currentChunk = '';
        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence)
                continue;
            if (currentChunk.length + trimmedSentence.length > maxChunkSize) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                }
                currentChunk = trimmedSentence;
            }
            else {
                currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
            }
        }
        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }
        return chunks;
    }
};
exports.HtmlParserService = HtmlParserService;
exports.HtmlParserService = HtmlParserService = HtmlParserService_1 = __decorate([
    (0, common_1.Injectable)()
], HtmlParserService);
//# sourceMappingURL=html-parser.service.js.map