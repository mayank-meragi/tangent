import { GenerateContentConfig, GoogleGenAI, Type } from '@google/genai';
import { App } from 'obsidian';
import { 
  PendingToolCall,
  ToolConfirmationResult,
} from './tools';
import { MemoryService } from './memoryService';
import { getObsidianTasksGlobalFilter } from './tools/dataviewTasks';

// Message type for conversation history
export interface ConversationMessage {
  role: 'user' | 'model' | 'system';
  parts: Array<{
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string; // Base64 encoded
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

export async function streamAIResponse({
  apiKey,
  modelId,
  messages,
  onToken,
  onToolCall,
  onToolResult,
  onToolsComplete,
  onThinking,
  onToolConfirmationNeeded,
  app,
  thinkingBudget = 0,
  unifiedToolManager,
  maxNestedCalls = 3, // Prevent infinite recursion
  webSearchEnabled = false, // New parameter for web search
  abortController, // Add AbortController parameter
}: {
  apiKey: string;
  modelId: string;
  messages: ConversationMessage[];
  onToken: (token: any) => void;
  onToolCall?: (toolName: string, args: any) => void;
  onToolResult?: (toolName: string, result: any) => void;
  onToolsComplete?: (toolResults: string) => void;
  onThinking?: (thoughts: string) => void;
  onToolConfirmationNeeded?: (pendingTool: PendingToolCall) => Promise<ToolConfirmationResult>;
  app: App;
  thinkingBudget?: number;
  unifiedToolManager: any;
  maxNestedCalls?: number;
  webSearchEnabled?: boolean; // New parameter type
  abortController?: AbortController; // Add AbortController type
}) {
  // Check if already aborted before starting
  if (abortController?.signal.aborted) {
    console.log('[AI DEBUG] Request cancelled before starting');
    return;
  }

  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    if (onToken) onToken('[Gemini API key not set]');
    return;
  }
  if (!modelId || typeof modelId !== 'string' || !modelId.trim()) {
    if (onToken) onToken('[Model ID not set]');
    return;
  }
  
  try {
    // Initialize Google AI
    const genAI = new GoogleGenAI({ apiKey });
    
    // Get the last user message
    const userMessages = messages.filter(msg => msg.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (!lastUserMessage || !lastUserMessage.parts || lastUserMessage.parts.length === 0) {
      if (onToken) onToken('[No valid user message found]');
      return;
    }
    
    // For the Google GenAI SDK, we need to send just the user's prompt
    const userPrompt = lastUserMessage.parts
      .filter(part => part.text)
      .map(part => part.text)
      .join(' ');
    
    // Check if there are any files in the message
    const hasFiles = lastUserMessage.parts.some(part => part.inlineData);
    
    if (!userPrompt.trim() && !hasFiles) {
      if (onToken) onToken('[Empty user message]');
      return;
    }
    
    // --- DYNAMIC TOOL LOADING ---
    // Get all tools from the unifiedToolManager
    const allTools = unifiedToolManager?.getAllTools ? unifiedToolManager.getAllTools() : [];
    // Build function declarations for Gemini
    const toolFunctionDeclarations = allTools.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: Type.OBJECT,
        properties: tool.inputSchema?.properties || {},
        required: tool.inputSchema?.required || []
      }
    }));
    // Map for tool execution and confirmation
    const toolMap: Record<string, any> = {};
    const toolRequiresConfirmation: Record<string, boolean> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const tool of allTools as any[]) {
      const t = tool as any;
      toolMap[t.name] = t;
      toolRequiresConfirmation[t.name] = !!t.requiresConfirmation;
      console.log(`[AI DEBUG] Registered tool: ${t.name} (id: ${t.id}, type: ${t.type})`);
    }

    // Build config with either web search OR function tools, not both (mutual exclusion)
    let config: GenerateContentConfig;

    if (webSearchEnabled) {
      // Web search mode: only send Google Search tool
      config = {
        tools: [{
          googleSearch: {}
        }]
      };
      console.log('[AI DEBUG] Web search enabled - using Google Search tool only');
    } else {
      // Function calling mode: send all other tools
      config = {
        tools: [{
          functionDeclarations: toolFunctionDeclarations
        }]
      };
      console.log('Tools sent to LLM:', toolFunctionDeclarations.map((t: any) => t.name));
    }

    // Add thinking configuration if budget > 0
    if (thinkingBudget > 0) {
      config.thinkingConfig = {
        includeThoughts: true,
      };
    } else {
      // Explicitly disable thinking
      config.thinkingConfig = {
        thinkingBudget: 0
      };
    }

    // Load memory content and add it as context
    const memoryService = new MemoryService(app);
    const memoryContent = await memoryService.readMemory();
    
    // Convert our conversation messages to Gemini format
    const geminiContents = messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role, // Gemini treats system as user
      parts: msg.parts.map(part => {
        // Handle file content for Gemini
        if (part.inlineData) {
          return {
            inlineData: {
              mimeType: part.inlineData.mimeType,
              data: part.inlineData.data
            }
          };
        }
        // Handle text content
        if (part.text) {
          return { text: part.text };
        }
        // Handle function calls and responses
        if (part.functionCall) {
          return { functionCall: part.functionCall };
        }
        if (part.functionResponse) {
          return { functionResponse: part.functionResponse };
        }
        return part;
      })
    }));
    
    // Add memory context if available
    if (memoryContent.trim()) {
      const memoryContext = {
        role: 'user' as const,
        parts: [{ text: `MEMORY CONTEXT:\n\n${memoryContent}\n\n---\n\nPlease consider the above memory context when responding.` }]
      };
      
      // Insert memory context after system message but before other messages
      const systemMessageIndex = geminiContents.findIndex(msg => 
        msg.parts.some(part => part.text && part.text.includes('You are an AI assistant'))
      );
      
      if (systemMessageIndex !== -1) {
        geminiContents.splice(systemMessageIndex + 1, 0, memoryContext);
      } else {
        // If no system message found, add memory context at the beginning
        geminiContents.unshift(memoryContext);
      }
    }

    // Check abort signal before making the request
    if (abortController?.signal.aborted) {
      console.log('[AI DEBUG] Request cancelled before API call');
      return;
    }

    // Send request with tools and thinking config
    const response = await genAI.models.generateContentStream({
      model: modelId,
      contents: geminiContents,
      config: config
    });
    
    // Collect the full response from the stream
    let fullResponse: any = null;
    let hasStreamedContent = false; // Track if we've streamed any content
    
    for await (const chunk of response) {
      // Check abort signal in each iteration
      if (abortController?.signal.aborted) {
        console.log('[AI DEBUG] Streaming cancelled by user');
        return;
      }

      fullResponse = chunk; // Always update to the latest chunk

      console.log('[AI DEBUG] Streaming response:', chunk);
      // Collect text content from streaming chunks
      // Skip streaming if there are function calls, as tool execution will provide the final response
      if (chunk.candidates && chunk.candidates[0]?.content?.parts && !chunk.functionCalls) {
        onToken(chunk);
        hasStreamedContent = true; // Mark that we've streamed content
      }
    }
    
    console.log('[AI DEBUG] Full response:', fullResponse);

    // Check abort signal before processing response
    if (abortController?.signal.aborted) {
      console.log('[AI DEBUG] Request cancelled before processing response');
      return;
    }

    // Process grounding metadata if web search was used
    if (webSearchEnabled && fullResponse?.candidates?.[0]?.groundingMetadata) {
      const metadata = fullResponse.candidates[0].groundingMetadata;
      console.log('[AI DEBUG] Grounding metadata found:', metadata);
      console.log('[AI DEBUG] Grounding metadata keys:', Object.keys(metadata));
      console.log('[AI DEBUG] Full grounding metadata structure:', JSON.stringify(metadata, null, 2));
      
      if (metadata.webSearchQueries && metadata.webSearchQueries.length > 0) {
        console.log('[AI DEBUG] Web search queries structure:', metadata.webSearchQueries);
        
        // Add search context to response
        if (onToken) {
          onToken('\n\n**🌐 Sources from web search:**\n');
          metadata.webSearchQueries.forEach((query: any, index: number) => {
            // Check abort signal during processing
            if (abortController?.signal.aborted) {
              return;
            }

            console.log(`[AI DEBUG] Processing query ${index + 1}:`, query);
            console.log(`[AI DEBUG] Query type:`, typeof query);
            
            // Handle both string queries and object queries
            let searchQuery: string;
            if (typeof query === 'string') {
              // Query is a string directly
              searchQuery = query;
            } else if (typeof query === 'object' && query !== null) {
              // Query is an object, try different property names
              searchQuery = query.searchQuery || query.query || query.search || query.text || 'Unknown query';
            } else {
              searchQuery = 'Unknown query';
            }
            
            console.log(`[AI DEBUG] Extracted search query: "${searchQuery}"`);
            
            onToken(`**Query ${index + 1}:** ${searchQuery}\n`);
            
            // Look for search results in the grounding chunks
            if (metadata.groundingChunks && metadata.groundingChunks.length > 0) {
              onToken(`**Results:** ${metadata.groundingChunks.length} sources found\n`);
              metadata.groundingChunks.slice(0, 3).forEach((chunk: any, resultIndex: number) => {
                const title = chunk.web?.title || 'Untitled';
                const url = chunk.web?.uri || '#';
                onToken(`- ${resultIndex + 1}. [${title}](${url})\n`);
              });
            }
            onToken('\n');
          });
        }
      } else {
        console.log('[AI DEBUG] No web search queries found in grounding metadata');
        
        // Check if there are other properties that might contain search information
        console.log('[AI DEBUG] Available metadata properties:', Object.keys(metadata));
        
        // Try to find any search-related information in the metadata
        const searchInfo = metadata.searchResults || metadata.results || metadata.sources || metadata.citations;
        if (searchInfo && onToken) {
          console.log('[AI DEBUG] Found alternative search info:', searchInfo);
          onToken('\n\n**🌐 Sources from web search:**\n');
          onToken('**Search performed** (detailed query information not available)\n');
          if (Array.isArray(searchInfo)) {
            searchInfo.slice(0, 3).forEach((result: any, index: number) => {
              const title = result.title || result.name || 'Untitled';
              const url = result.url || result.link || '#';
              onToken(`- ${index + 1}. [${title}](${url})\n`);
            });
          }
          onToken('\n');
        }
      }
    }

    // Debug log: print all tool calls decided by LLM
    if (fullResponse?.functionCalls) {
      console.log('[AI DEBUG] Tool calls decided by LLM:', fullResponse.functionCalls);
    }
    
    // Handle thinking tokens if present
    if (fullResponse?.usageMetadata?.thoughtsTokenCount && fullResponse.usageMetadata.thoughtsTokenCount > 0) {
      
      
      // Extract thinking content if available
      let foundThinkingContent = false;
      if (fullResponse.candidates && fullResponse.candidates[0]?.content?.parts) {
        for (const part of fullResponse.candidates[0].content.parts) {
          // Check if this part is marked as thinking content
          if ((part as any).thought === true && part.text && onThinking) {
            
            onThinking(part.text);
            foundThinkingContent = true;
          }
        }
      }
      
      // If no specific thinking content found but we have thinking tokens, show a generic thinking message
      if (onThinking && !foundThinkingContent) {
        onThinking(`🧠 The model used ${fullResponse.usageMetadata.thoughtsTokenCount} thinking tokens to process this request.`);
      }
    }
    
    // Check if there are function calls
    if (fullResponse?.functionCalls && fullResponse.functionCalls.length > 0) {
      const hasToolCalls = true;
      
      // Process each function call
      for (const functionCall of fullResponse.functionCalls) {
        // Check abort signal before processing each tool call
        if (abortController?.signal.aborted) {
          console.log('[AI DEBUG] Request cancelled during tool processing');
          return;
        }

        const { name, args } = functionCall;
        const normalizedArgs = normalizeDateRangeArgs(args || {});

        // Force all create-task operations to use assistant_tasks.md
        if (name === 'writeDataviewTasks' && normalizedArgs.operation === 'create') {
          // Use provided file if specified, otherwise default to assistant_tasks.md
          if (!normalizedArgs.file) {
            normalizedArgs.file = 'assistant_tasks.md';
          }
          
          // Add global filter tags to new tasks
          const globalFilterTags = await extractGlobalFilterTags(app);
          if (globalFilterTags.length > 0) {
            // Handle both single task and bulk task creation
            if (normalizedArgs.task) {
              // Single task
              if (!normalizedArgs.task.tags) {
                normalizedArgs.task.tags = [];
              }
              // Add global filter tags that aren't already present
              for (const tag of globalFilterTags) {
                if (!normalizedArgs.task.tags.includes(tag)) {
                  normalizedArgs.task.tags.push(tag);
                }
              }
            } else if (normalizedArgs.tasks && Array.isArray(normalizedArgs.tasks)) {
              // Bulk tasks
              for (const task of normalizedArgs.tasks) {
                if (!task.tags) {
                  task.tags = [];
                }
                // Add global filter tags that aren't already present
                for (const tag of globalFilterTags) {
                  if (!task.tags.includes(tag)) {
                    task.tags.push(tag);
                  }
                }
              }
            }
          }
        }
        
        
        if (onToolCall && name) {
          onToolCall(name, normalizedArgs);
        }
        
        // Check if tool requires confirmation
        if (!name) continue; // Skip if no tool name
        
        const requiresConfirmation = toolRequiresConfirmation[name] || false;
        
        if (requiresConfirmation && onToolConfirmationNeeded) {
          // Create pending tool call
          const pendingTool: PendingToolCall = {
            id: `${name}-${Date.now()}`,
            name: name,
            args: normalizedArgs,
            requiresConfirmation: true
          };
          
          
          
          // Request confirmation from user
          const confirmationResult = await onToolConfirmationNeeded(pendingTool);
          
          // Check abort signal after confirmation
          if (abortController?.signal.aborted) {
            console.log('[AI DEBUG] Request cancelled after tool confirmation');
            return;
          }
          
          if (!confirmationResult.approved) {
            
            if (onToken) onToken(`[Tool execution cancelled by user: ${name}]`);
            continue; // Skip this tool execution
          }
          
          
        }
        
        // Execute the tool via unifiedToolManager
        console.log(`[AI DEBUG] Looking for tool: ${name} in toolMap:`, Object.keys(toolMap));
        if (name && toolMap[name]) {
          try {
            console.log(`[AI DEBUG] Executing tool: ${name} with args:`, normalizedArgs);
            const toolResult = await unifiedToolManager.callTool(toolMap[name].id, normalizedArgs || {});
            console.log(`[AI DEBUG] Tool result for ${name}:`, toolResult);
            
            // Check abort signal after tool execution
            if (abortController?.signal.aborted) {
              console.log('[AI DEBUG] Request cancelled after tool execution');
              return;
            }
            
            if (onToolResult) {
              onToolResult(name, toolResult);
            }
            
            // Create function response
            const responseContent = toolResult.type === 'success' ? toolResult.data : toolResult.error;
            console.log(`[AI DEBUG] Tool ${name} response content:`, {
              type: toolResult.type,
              data: toolResult.data,
              error: toolResult.error,
              finalContent: responseContent
            });
            
            const functionResponse = {
              name: name,
              response: {
                name: name,
                content: responseContent
              }
            };
            
            // Build follow-up conversation with tool result
            const followUpContents = [
              ...geminiContents,
              { role: 'model', parts: [{ functionCall: functionCall }] },
              { role: 'user', parts: [{ functionResponse: functionResponse }] }
            ];
            
            console.log(`[AI DEBUG] Follow-up conversation for tool ${name}:`, {
              originalMessages: geminiContents.length,
              functionCall: functionCall,
              functionResponse: functionResponse,
              totalMessages: followUpContents.length
            });
            
            
            
            // Send the tool result back to the model
            console.log(`[AI DEBUG] Sending follow-up request for tool ${name} with result:`, functionResponse);
            
            // Check abort signal before nested call
            if (abortController?.signal.aborted) {
              console.log('[AI DEBUG] Request cancelled before nested function call');
              return;
            }
            
            // Handle nested function calls with abort controller
            await handleNestedFunctionCalls(
              [functionCall],
              followUpContents,
              toolMap,
              unifiedToolManager,
              genAI,
              modelId,
              config,
              onToken,
              onToolCall,
              onToolResult,
              0,
              maxNestedCalls,
              abortController // Pass abort controller to nested calls
            );
            
          } catch (error) {
            console.error('[AI DEBUG] Tool execution error:', error);
            if (onToken) onToken(`[Tool Error: ${error}]`);
          }
        } else {
          console.error('[AI DEBUG] Unknown tool:', name);
          if (onToken) onToken(`[Unknown tool: ${name}]`);
        }
      }
      
      if (hasToolCalls && onToolsComplete) {
        onToolsComplete('Tools execution completed');
      }
    } else if (!hasStreamedContent && fullResponse?.candidates && fullResponse.candidates[0]?.content?.parts) {
      // Only process final response if we haven't streamed content already
      // Extract only non-thinking parts for the regular response
      const responseParts = fullResponse.candidates[0].content.parts
        .filter((part: any) => (part as any).thought !== true && part.text)
        .map((part: any) => part.text)
        .join('');
      
      if (responseParts) {
        onToken(responseParts);
      }
    } else if (!hasStreamedContent && fullResponse?.text) {
      // Only process fallback text if we haven't streamed content already
      // Fallback: Direct text response
      onToken(fullResponse.text);
    }
    
  } catch (error) {
    // Check if this is an abort error
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[AI DEBUG] Request was cancelled');
      return;
    }
    
    console.error('[AI DEBUG] Error in streamAIResponse:', error);
    if (onToken) onToken(`[Error: ${error}]`);
  }
}

// Utility to normalize date range strings in tool arguments
function normalizeDateRangeArgs(args: any): any {
  if (!args || typeof args !== 'object') return args;
  const dateFields = ['due', 'created', 'start', 'scheduled'];
  const normalizeField = (val: any) => {
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [start, end] = val.split('/');
      return { start, end };
    }
    return val;
  };
  // Top-level fields
  for (const field of dateFields) {
    if (args.filters && args.filters[field]) {
      args.filters[field] = normalizeField(args.filters[field]);
    }
    if (args[field]) {
      args[field] = normalizeField(args[field]);
    }
  }
  // Also handle tasks/task arrays for write tools
  if (Array.isArray(args.tasks)) {
    args.tasks = args.tasks.map((task: any) => {
      for (const field of dateFields) {
        if (task[field]) task[field] = normalizeField(task[field]);
      }
      return task;
    });
  }
  if (args.task && typeof args.task === 'object') {
    for (const field of dateFields) {
      if (args.task[field]) args.task[field] = normalizeField(args.task[field]);
    }
  }
  return args;
}

// Helper function to extract tags from global filter
async function extractGlobalFilterTags(app: App): Promise<string[]> {
  try {
    const globalFilter = await getObsidianTasksGlobalFilter(app);
    if (!globalFilter) return [];
    
    // Extract tag filters from global filter
    const tagMatches = globalFilter.match(/#(\w+)/g);
    if (tagMatches) {
      return tagMatches.map((tag: string) => tag.substring(1)); // Remove #
    }
    
    return [];
  } catch (error) {
    console.error('[AI DEBUG] Error extracting global filter tags:', error);
    return [];
  }
}

// Helper function to handle nested function calls
async function handleNestedFunctionCalls(
  functionCallParts: any[],
  followUpContents: any[],
  toolMap: Record<string, any>,
  unifiedToolManager: any,
  genAI: any,
  modelId: string,
  config: any,
  onToken: (token: any) => void,
  onToolCall?: (toolName: string, args: any) => void,
  onToolResult?: (toolName: string, result: any) => void,
  depth = 0,
  maxDepth = 3,
  abortController?: AbortController
): Promise<void> {
  if (depth >= maxDepth) {
    console.log(`[AI DEBUG] Maximum nested call depth (${maxDepth}) reached, stopping recursion`);
    return;
  }
  
  for (const functionCallPart of functionCallParts) {
    // Check abort signal before processing each nested function call
    if (abortController?.signal.aborted) {
      console.log('[AI DEBUG] Request cancelled during nested function call processing');
      return;
    }

    const nestedFunctionCall = functionCallPart.functionCall;
    if (!nestedFunctionCall) continue;
    
    const { name: nestedName, args: nestedArgs } = nestedFunctionCall;
    
    console.log(`[AI DEBUG] Processing nested function call (depth ${depth}): ${nestedName} with args:`, nestedArgs);
    
    if (onToolCall && nestedName) {
      onToolCall(nestedName, nestedArgs || {});
    }
    
    // Execute the nested tool
    if (nestedName && toolMap[nestedName]) {
      try {
        console.log(`[AI DEBUG] Executing nested tool (depth ${depth}): ${nestedName} with args:`, nestedArgs);
        const nestedToolResult = await unifiedToolManager.callTool(toolMap[nestedName].id, nestedArgs || {});
        console.log(`[AI DEBUG] Nested tool result for ${nestedName}:`, nestedToolResult);
        
        // Check abort signal after nested tool execution
        if (abortController?.signal.aborted) {
          console.log('[AI DEBUG] Request cancelled after nested tool execution');
          return;
        }

        if (onToolResult) {
          onToolResult(nestedName, nestedToolResult);
        }
        
        // Create nested function response
        const nestedResponseContent = nestedToolResult.type === 'success' ? nestedToolResult.data : nestedToolResult.error;
        const nestedFunctionResponse = {
          name: nestedName,
          response: {
            name: nestedName,
            content: nestedResponseContent
          }
        };
        
        // Build nested follow-up conversation
        const nestedFollowUpContents = [
          ...followUpContents,
          { role: 'model', parts: [{ functionCall: nestedFunctionCall }] },
          { role: 'user', parts: [{ functionResponse: nestedFunctionResponse }] }
        ];
        
        console.log(`[AI DEBUG] Sending nested follow-up request for tool ${nestedName} (depth ${depth})`);
        const nestedFollowUpResponse = await genAI.models.generateContent({
          model: modelId,
          contents: nestedFollowUpContents,
          config: config
        });
        
        // Process the nested follow-up response
        if (nestedFollowUpResponse.candidates && nestedFollowUpResponse.candidates[0]?.content?.parts) {
          const nestedTextParts = nestedFollowUpResponse.candidates[0].content.parts
            .filter((part: any) => (part as any).thought !== true && part.text)
            .map((part: any) => part.text);
          
          const nestedFunctionCallParts = nestedFollowUpResponse.candidates[0].content.parts
            .filter((part: any) => part.functionCall);
          
          if (nestedTextParts.length > 0) {
            const nestedResponseText = nestedTextParts.join('');
            console.log(`[AI DEBUG] Calling onToken with nested response for tool ${nestedName}:`, nestedResponseText);
            onToken(nestedResponseText);
          } else if (nestedFunctionCallParts.length > 0) {
            // Recursively handle further nested calls
            await handleNestedFunctionCalls(
              nestedFunctionCallParts,
              nestedFollowUpContents,
              toolMap,
              unifiedToolManager,
              genAI,
              modelId,
              config,
              onToken,
              onToolCall,
              onToolResult,
              depth + 1,
              maxDepth,
              abortController // Pass abort controller to nested calls
            );
          }
        } else if (nestedFollowUpResponse.text) {
          console.log(`[AI DEBUG] Calling onToken with nested direct text for tool ${nestedName}:`, nestedFollowUpResponse.text);
          onToken(nestedFollowUpResponse.text);
        }
        
      } catch (error) {
        console.error(`[AI DEBUG] Nested tool execution error:`, error);
        if (onToken) onToken(`[Nested Tool Error: ${error}]`);
      }
    } else {
      console.error(`[AI DEBUG] Unknown nested tool:`, nestedName);
      if (onToken) onToken(`[Unknown nested tool: ${nestedName}]`);
    }
  }
} 