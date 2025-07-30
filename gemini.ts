/**
 * Custom implementation of Google GenAI package
 * Implements only the methods used in this project
 */

// Type enum matching the original package
export enum Type {
    TYPE_UNSPECIFIED = "TYPE_UNSPECIFIED",
    STRING = "STRING",
    NUMBER = "NUMBER",
    INTEGER = "INTEGER",
    BOOLEAN = "BOOLEAN",
    ARRAY = "ARRAY",
    OBJECT = "OBJECT",
    NULL = "NULL"
}

// Configuration types
export interface GenerateContentConfig {
    tools?: Array<{
        functionDeclarations?: Array<{
            name: string;
            description: string;
            parameters: {
                type: Type;
                properties: Record<string, any>;
                required: string[];
            };
        }>;
        googleSearch?: Record<string, any>;
    }>;
    thinkingConfig?: {
        includeThoughts?: boolean;
        thinkingBudget?: number;
    };
    responseSchema?: {
        type: Type;
        properties: Record<string, any>;
        required: string[];
    };
    responseMimeType?: string;
}

// Content types
export interface Content {
    role: 'user' | 'model';
    parts: Array<{
        text?: string;
        inlineData?: {
            mimeType: string;
            data: string;
        };
        functionCall?: {
            name: string;
            args: Record<string, any>;
        };
        functionResponse?: {
            name: string;
            response: {
                name: string;
                content: any;
            };
        };
    }>;
}

// Response types
export interface GenerateContentResponse {
    candidates?: Array<{
        content?: {
            role: string;
            parts: Array<{
                text?: string;
                functionCall?: {
                    name: string;
                    args: Record<string, any>;
                };
            }>;
        };
    }>;
    functionCalls?: Array<{
        name: string;
        args: Record<string, any>;
    }>;
    text?: string;
    groundingMetadata?: {
        webSearchQueries?: string[];
        groundingChunks?: Array<{
            web?: {
                title?: string;
                uri?: string;
            };
        }>;
        groundingSupports?: Array<{
            web?: {
                title?: string;
                uri?: string;
                snippet?: string;
            };
        }>;
    };
}

// API Client for making HTTP requests
class ApiClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey: string, baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    async requestStream(params: {
        path: string;
        queryParams: Record<string, any>;
        body: string;
        httpMethod: string;
        httpOptions?: any;
        abortSignal?: AbortSignal;
    }): Promise<AsyncIterable<GenerateContentResponse>> {
        const url = new URL(`${this.baseUrl}/${params.path}`);

        // Add API key to query params
        url.searchParams.set('key', this.apiKey);

        // Add other query params
        Object.entries(params.queryParams).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        const response = await fetch(url.toString(), {
            method: params.httpMethod,
            headers: {
                'Content-Type': 'application/json',
            },
            body: params.body,
            signal: params.abortSignal,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const body = response.body;
        if (!body) {
            throw new Error('Response body is null');
        }

        return this.createSSEReadableStream(body);
    }

    private createSSEReadableStream(body: ReadableStream<Uint8Array>): AsyncIterable<GenerateContentResponse> {
        const reader = body.getReader();
        const decoder = new TextDecoder();

        return {
            async *[Symbol.asyncIterator]() {
                try {
                    for (; ;) {
                        const { done, value } = await reader.read();
                        if (done) {
                            break;
                        }

                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') {
                                    return;
                                }

                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed) {
                                        yield parsed;
                                    }
                                } catch {
                                    // Skip invalid JSON
                                }
                            }
                        }
                    }
                } finally {
                    reader.releaseLock();
                }
            }
        };
    }

    async request(params: {
        path: string;
        queryParams: Record<string, any>;
        body: string;
        httpMethod: string;
        httpOptions?: any;
        abortSignal?: AbortSignal;
    }): Promise<GenerateContentResponse> {
        const url = new URL(`${this.baseUrl}/${params.path}`);

        // Add API key to query params
        url.searchParams.set('key', this.apiKey);

        // Add other query params
        Object.entries(params.queryParams).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        const response = await fetch(url.toString(), {
            method: params.httpMethod,
            headers: {
                'Content-Type': 'application/json',
            },
            body: params.body,
            signal: params.abortSignal,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }
}

// Models class for handling model operations
class Models {
    private apiClient: ApiClient;

    constructor(apiClient: ApiClient) {
        this.apiClient = apiClient;
    }

    // Helper function to clean JSON schema by removing additionalProperties
    private cleanJsonSchema(schema: any): any {
        if (!schema || typeof schema !== 'object') {
            return schema;
        }

        const cleaned: any = {};
        for (const [key, value] of Object.entries(schema)) {
            // Skip additionalProperties field as it's not supported by the API
            if (key === 'additionalProperties') {
                continue;
            }

            if (Array.isArray(value)) {
                cleaned[key] = value.map(item => this.cleanJsonSchema(item));
            } else if (typeof value === 'object' && value !== null) {
                cleaned[key] = this.cleanJsonSchema(value);
            } else {
                cleaned[key] = value;
            }
        }

        return cleaned;
    }

    // Helper function to process function declarations and clean their parameters
    private processFunctionDeclarations(functionDeclarations: any[]): any[] {
        return functionDeclarations.map(func => {
            const processed = { ...func };

            // Clean parameters if they exist
            if (processed.parameters) {
                processed.parameters = this.cleanJsonSchema(processed.parameters);
            }

            return processed;
        });
    }

    async generateContentStream(params: {
        model: string;
        contents: Content[];
        config?: GenerateContentConfig;
    }): Promise<AsyncIterable<GenerateContentResponse>> {
        const path = `${params.model}:streamGenerateContent?alt=sse`;

        const body: any = {
            contents: params.contents
        };

        // Handle config fields - put them directly in the body, not in a config object
        if (params.config) {
            if (params.config.tools) {
                // Process tools and clean function declarations
                body.tools = params.config.tools.map(tool => {
                    const processedTool = { ...tool };
                    if (processedTool.functionDeclarations) {
                        processedTool.functionDeclarations = this.processFunctionDeclarations(processedTool.functionDeclarations);
                    }
                    return processedTool;
                });
            }
            if (params.config.thinkingConfig) {
                // thinkingConfig should be nested inside generationConfig
                body.generationConfig = {
                    thinkingConfig: params.config.thinkingConfig
                };
            }
            if (params.config.responseSchema) {
                body.responseSchema = this.cleanJsonSchema(params.config.responseSchema);
            }
            if (params.config.responseMimeType) {
                body.responseMimeType = params.config.responseMimeType;
            }
        }

        return this.apiClient.requestStream({
            path,
            queryParams: {},
            body: JSON.stringify(body),
            httpMethod: 'POST'
        });
    }

    async generateContent(params: {
        model: string;
        contents: Content[];
        config?: GenerateContentConfig;
    }): Promise<GenerateContentResponse> {
        const path = `${params.model}:generateContent`;

        const body: any = {
            contents: params.contents
        };

        // Handle config fields - put them directly in the body, not in a config object
        if (params.config) {
            if (params.config.tools) {
                // Process tools and clean function declarations
                body.tools = params.config.tools.map(tool => {
                    const processedTool = { ...tool };
                    if (processedTool.functionDeclarations) {
                        processedTool.functionDeclarations = this.processFunctionDeclarations(processedTool.functionDeclarations);
                    }
                    return processedTool;
                });
            }
            if (params.config.thinkingConfig) {
                // thinkingConfig should be nested inside generationConfig
                body.generationConfig = {
                    thinkingConfig: params.config.thinkingConfig
                };
            }
            if (params.config.responseSchema) {
                body.responseSchema = this.cleanJsonSchema(params.config.responseSchema);
            }
            if (params.config.responseMimeType) {
                body.responseMimeType = params.config.responseMimeType;
            }
        }

        return this.apiClient.request({
            path,
            queryParams: {},
            body: JSON.stringify(body),
            httpMethod: 'POST'
        });
    }
}

// Main GoogleGenAI class
export class GoogleGenAI {
    private apiKey: string;
    private apiClient: ApiClient;
    public models: Models;

    constructor(options: { apiKey: string; vertexai?: boolean; httpOptions?: any }) {
        if (!options.apiKey) {
            throw new Error('API key is required');
        }

        this.apiKey = options.apiKey;
        this.apiClient = new ApiClient(this.apiKey);
        this.models = new Models(this.apiClient);
    }
}

