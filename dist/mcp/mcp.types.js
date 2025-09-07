"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tool = Tool;
function Tool(options) {
    return function (target, propertyKey, descriptor) {
        if (descriptor.value) {
            descriptor.value._toolOptions = options;
        }
        return descriptor;
    };
}
//# sourceMappingURL=mcp.types.js.map