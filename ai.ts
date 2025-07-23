import { GenerateContentConfig, GoogleGenAI, Type } from '@google/genai';
import { App } from 'obsidian';
import { 
  PendingToolCall,
  ToolConfirmationResult,
} from './tools';
import { MemoryService } from './memoryService';


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
    
    // Simplified AI calling loop - inspired by user's pseudocode
    const currentMessages = [...geminiContents];
    const maxIterations = 10; // Prevent infinite loops
    let iteration = 0;
    
    while (iteration < maxIterations) {
      iteration++;
      console.log(`[AI DEBUG] AI call iteration ${iteration}`);
      
      // Check abort signal before each AI call
      if (abortController?.signal.aborted) {
        console.log('[AI DEBUG] Request cancelled before AI call');
        return;
      }
      
      // Call AI with current messages
      console.log(`[AI DEBUG] Sending ${currentMessages.length} messages to AI in iteration ${iteration}:`, currentMessages.map(m => ({ role: m.role, parts: m.parts.length })));
      const response = await genAI.models.generateContentStream({
        model: modelId,
        contents: currentMessages,
        config: config
      });
      
      // Collect the full response from the stream
      let fullResponse: any = null;
      let hasStreamedContent = false;
      
      for await (const chunk of response) {
        // Check abort signal in each iteration
        if (abortController?.signal.aborted) {
          console.log('[AI DEBUG] Streaming cancelled by user');
          return;
        }

        fullResponse = chunk; // Always update to the latest chunk

        console.log('[AI DEBUG] Streaming response:', chunk);
        // Stream text content if no function calls
        if (chunk.candidates && chunk.candidates[0]?.content?.parts && !chunk.functionCalls) {
          onToken(chunk);
          hasStreamedContent = true;
        }
      }
      
      console.log('[AI DEBUG] Full response:', fullResponse);
      console.log('[AI DEBUG] Full response structure:', {
        hasFunctionCalls: !!fullResponse?.functionCalls,
        functionCallsLength: fullResponse?.functionCalls?.length || 0,
        hasCandidates: !!fullResponse?.candidates,
        candidatesLength: fullResponse?.candidates?.length || 0,
        hasContent: !!fullResponse?.candidates?.[0]?.content,
        hasParts: !!fullResponse?.candidates?.[0]?.content?.parts,
        partsLength: fullResponse?.candidates?.[0]?.content?.parts?.length || 0
      });

      // Check abort signal before processing response
      if (abortController?.signal.aborted) {
        console.log('[AI DEBUG] Request cancelled before processing response');
        return;
      }
      
      // Check if there are function calls
      if (fullResponse?.functionCalls && fullResponse.functionCalls.length > 0) {
        console.log(`[AI DEBUG] Found ${fullResponse.functionCalls.length} function calls`);
        
        // Execute each function call
        for (const functionCall of fullResponse.functionCalls) {
          const { name, args } = functionCall;
          const normalizedArgs = normalizeDateRangeArgs(args || {});
          
          console.log(`[AI DEBUG] Executing function: ${name} with args:`, normalizedArgs);
          
          if (onToolCall && name) {
            onToolCall(name, normalizedArgs);
          }
          
          // Check if tool requires confirmation
          if (!name) continue;
          
          const requiresConfirmation = toolRequiresConfirmation[name] || false;
          
          if (requiresConfirmation && onToolConfirmationNeeded) {
            const pendingTool: PendingToolCall = {
              id: `${name}-${Date.now()}`,
              name: name,
              args: normalizedArgs,
              requiresConfirmation: true
            };
            
            const confirmationResult = await onToolConfirmationNeeded(pendingTool);
            
            if (abortController?.signal.aborted) {
              console.log('[AI DEBUG] Request cancelled after tool confirmation');
              return;
            }
            
            if (!confirmationResult.approved) {
              if (onToken) onToken(`[Tool execution cancelled by user: ${name}]`);
              continue;
            }
          }
          
          // Execute the tool
          if (name && toolMap[name]) {
            try {
              const toolResult = await unifiedToolManager.callTool(toolMap[name].id, normalizedArgs || {});
              console.log(`[AI DEBUG] Tool result for ${name}:`, toolResult);
              
              if (abortController?.signal.aborted) {
                console.log('[AI DEBUG] Request cancelled after tool execution');
                return;
              }
              
              if (onToolResult) {
                onToolResult(name, toolResult);
              }
              
              // Create function response
              const responseContent = toolResult.type === 'success' ? toolResult.data : toolResult.error;
              const functionResponse = {
                name: name,
                response: {
                  name: name,
                  content: responseContent
                }
              };
              
              // Add function call and response to messages for next iteration
              currentMessages.push(
                { role: 'model', parts: [{ functionCall: functionCall }] },
                { role: 'user', parts: [{ functionResponse: functionResponse }] }
              );
              
              console.log(`[AI DEBUG] Added function result to messages for ${name}`);
              console.log(`[AI DEBUG] Updated currentMessages length: ${currentMessages.length}`);
              console.log(`[AI DEBUG] Last two messages added:`, currentMessages.slice(-2));
              
            } catch (error) {
              console.error('[AI DEBUG] Tool execution error:', error);
              if (onToken) onToken(`[Tool Error: ${error}]`);
            }
          } else {
            console.error('[AI DEBUG] Unknown tool:', name);
            if (onToken) onToken(`[Unknown tool: ${name}]`);
          }
        }
        
        // Continue to next iteration to let AI respond to tool results
        continue;
      } else {
        // No function calls, AI has finished responding
        console.log('[AI DEBUG] No function calls found, AI response complete');
        
        // If we haven't streamed content, process the final response
        if (!hasStreamedContent && fullResponse?.candidates && fullResponse.candidates[0]?.content?.parts) {
          const responseParts = fullResponse.candidates[0].content.parts
            .filter((part: any) => (part as any).thought !== true && part.text)
            .map((part: any) => part.text)
            .join('');
          
          if (responseParts) {
            console.log(`[AI DEBUG] Processing final response parts: "${responseParts}"`);
            onToken(responseParts);
          }
        } else if (!hasStreamedContent && fullResponse?.text) {
          console.log(`[AI DEBUG] Processing final response text: "${fullResponse.text}"`);
          onToken(fullResponse.text);
        } else if (!hasStreamedContent && fullResponse === null) {
          console.log('[AI DEBUG] Full response is null, this might indicate an issue with the AI call');
          if (onToken) onToken('[AI response was empty or null]');
        } else if (hasStreamedContent) {
          console.log('[AI DEBUG] Content was already streamed, no need to process final response');
        } else {
          console.log('[AI DEBUG] No response content found to process');
        }
        
        // Break out of the loop - AI is done
        break;
      }
    }
    
    if (iteration >= maxIterations) {
      console.log('[AI DEBUG] Maximum iterations reached, stopping');
      if (onToken) onToken('[Maximum AI iterations reached]');
    }

    // Process grounding metadata if web search was used (moved from old code)
    if (webSearchEnabled) {
      console.log('[AI DEBUG] Web search was enabled, but grounding metadata processing moved to individual iterations');
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