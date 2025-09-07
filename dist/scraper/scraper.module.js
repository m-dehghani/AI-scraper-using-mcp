"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperModule = void 0;
const common_1 = require("@nestjs/common");
const html_parser_service_1 = require("./html-parser.service");
const xray_parser_service_1 = require("./xray-parser.service");
const scraper_service_1 = require("./scraper.service");
const ai_module_1 = require("../ai/ai.module");
const mcp_client_service_1 = require("../mcp/mcp-client.service");
let ScraperModule = class ScraperModule {
};
exports.ScraperModule = ScraperModule;
exports.ScraperModule = ScraperModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_module_1.AiModule],
        providers: [
            mcp_client_service_1.McpClientService,
            html_parser_service_1.HtmlParserService,
            xray_parser_service_1.XRayParserService,
            scraper_service_1.ScraperService,
        ],
        exports: [
            scraper_service_1.ScraperService,
            mcp_client_service_1.McpClientService,
            html_parser_service_1.HtmlParserService,
            xray_parser_service_1.XRayParserService,
        ],
    })
], ScraperModule);
//# sourceMappingURL=scraper.module.js.map