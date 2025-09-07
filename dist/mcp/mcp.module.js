"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpModule = void 0;
const common_1 = require("@nestjs/common");
const scraper_tool_1 = require("./scraper.tool");
const mcp_client_service_1 = require("./mcp-client.service");
const scraper_module_1 = require("../scraper/scraper.module");
let McpModule = class McpModule {
};
exports.McpModule = McpModule;
exports.McpModule = McpModule = __decorate([
    (0, common_1.Module)({
        imports: [scraper_module_1.ScraperModule],
        providers: [scraper_tool_1.ScraperTool, mcp_client_service_1.McpClientService],
        exports: [scraper_tool_1.ScraperTool, mcp_client_service_1.McpClientService],
    })
], McpModule);
//# sourceMappingURL=mcp.module.js.map