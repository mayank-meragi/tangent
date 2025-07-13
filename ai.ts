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
}) {
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
    
    if (!userPrompt.trim()) {
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
    }

    // Build config with thinking configuration
    const config: GenerateContentConfig = {
      tools: [{
        functionDeclarations: toolFunctionDeclarations
      }]
    };

    // Debug log: print tool names sent to LLM
    console.log('Tools sent to LLM:', toolFunctionDeclarations.map((t: any) => t.name));

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
    let geminiContents = messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role, // Gemini treats system as user
      parts: msg.parts
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

    // Send request with tools and thinking config
    const response = await genAI.models.generateContentStream({
      model: modelId,
      contents: geminiContents,
      config: config
    });
    
    // Collect the full response from the stream
    let fullResponse: any = null;
    
    for await (const chunk of response) {
      fullResponse = chunk; // Always update to the latest chunk

      console.log('[AI DEBUG] Streaming response:', chunk);
      // Collect text content from streaming chunks
      if (chunk.candidates && chunk.candidates[0]?.content?.parts) {
        onToken(chunk);
      }
    }
    
    console.log('[AI DEBUG] Full response:', fullResponse);

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
        const { name, args } = functionCall;
        
        
        if (onToolCall && name) {
          onToolCall(name, args || {});
        }
        
        // Check if tool requires confirmation
        if (!name) continue; // Skip if no tool name
        
        const requiresConfirmation = toolRequiresConfirmation[name] || false;
        
        if (requiresConfirmation && onToolConfirmationNeeded) {
          // Create pending tool call
          const pendingTool: PendingToolCall = {
            id: `${name}-${Date.now()}`,
            name: name,
            args: args || {},
            requiresConfirmation: true
          };
          
          
          
          // Request confirmation from user
          const confirmationResult = await onToolConfirmationNeeded(pendingTool);
          
          if (!confirmationResult.approved) {
            
            if (onToken) onToken(`[Tool execution cancelled by user: ${name}]`);
            continue; // Skip this tool execution
          }
          
          
        }
        
        // Execute the tool via unifiedToolManager
        if (name && toolMap[name]) {
          try {
            const toolResult = await unifiedToolManager.callTool(toolMap[name].id, args || {});
            
            
            if (onToolResult) {
              onToolResult(name, toolResult);
            }
            
            // Create function response
            const functionResponse = {
              name: name,
              response: {
                name: name,
                content: toolResult
              }
            };
            
            // Build follow-up conversation with tool result
            const followUpContents = [
              ...geminiContents,
              { role: 'model', parts: [{ functionCall: functionCall }] },
              { role: 'user', parts: [{ functionResponse: functionResponse }] }
            ];
            
            
            
            // Send the tool result back to the model
            const followUpResponse = await genAI.models.generateContent({
              model: modelId,
              contents: followUpContents,
              config: config
            });
            
            // Handle thinking in follow-up response
            if (followUpResponse.usageMetadata?.thoughtsTokenCount && followUpResponse.usageMetadata.thoughtsTokenCount > 0) {
              
              
              // Extract thinking content from follow-up response
              let foundFollowUpThinking = false;
              if (followUpResponse.candidates && followUpResponse.candidates[0]?.content?.parts) {
                for (const part of followUpResponse.candidates[0].content.parts) {
                  // Check if this part is marked as thinking content
                  if ((part as any).thought === true && part.text && onThinking) {
                    
                    onThinking(part.text);
                    foundFollowUpThinking = true;
                  }
                }
              }
              
              // If no specific thinking content found but we have thinking tokens, show a generic thinking message
              if (onThinking && !foundFollowUpThinking) {
                onThinking(`🧠 The model used ${followUpResponse.usageMetadata.thoughtsTokenCount} additional thinking tokens after tool execution.`);
              }
            }
            
            // Stream the follow-up response
            if (followUpResponse.candidates && followUpResponse.candidates[0]?.content?.parts) {
              // Extract only non-thinking parts for the regular response
              const responseParts = followUpResponse.candidates[0].content.parts
                .filter((part: any) => (part as any).thought !== true && part.text)
                .map((part: any) => part.text)
                .join('');
              
              if (responseParts) {
                
                onToken(responseParts);
              }
            } else if (followUpResponse.text) {
              
              onToken(followUpResponse.text);
            }
            
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
    } else if (fullResponse?.candidates && fullResponse.candidates[0]?.content?.parts) {
      // Extract only non-thinking parts for the regular response
      const responseParts = fullResponse.candidates[0].content.parts
        .filter((part: any) => (part as any).thought !== true && part.text)
        .map((part: any) => part.text)
        .join('');
      
      if (responseParts) {
        
        onToken(responseParts);
      }
    } else if (fullResponse?.text) {
      // Fallback: Direct text response
      
      onToken(fullResponse.text);
    }
    
  } catch (error) {
    console.error('[AI DEBUG] Error in streamAIResponse:', error);
    if (onToken) onToken(`[Error: ${error}]`);
  }
} 