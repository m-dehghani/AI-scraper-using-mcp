// Simple tool decorator for API documentation
export function Tool(options: {
    name: string;
    description: string;
    parameters: any;
}) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        // Simple decorator implementation for documentation
        if (descriptor.value) {
            descriptor.value._toolOptions = options;
        }
        return descriptor;
    };
}
