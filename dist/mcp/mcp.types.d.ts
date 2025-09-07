export declare function Tool(options: {
    name: string;
    description: string;
    parameters: any;
}): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
