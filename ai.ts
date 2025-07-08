import { GenerateContentConfig, GoogleGenAI, Type } from '@google/genai';
import { App } from 'obsidian';
import { 
  listVaultFiles, 
  readFile, 
  writeFile,
  readMemory,
  updateMemory,
  ToolResult,
  listVaultFilesFunction,
  readFileFunction,
  writeFileFunction,
  readMemoryFunction,
  updateMemoryFunction,
  PendingToolCall,
  ToolConfirmationResult,
} from './tools';

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

// Tool map for easy lookup
const TOOL_MAP: Record<string, (app: App, args: any) => Promise<ToolResult>> = {
  listVaultFiles,
  readFile,
  writeFile,
  readMemory,
  updateMemory,
};

// Tool function map for easy lookup of confirmation requirements
const TOOL_FUNCTION_MAP: Record<string, any> = {
  listVaultFiles: listVaultFilesFunction,
  readFile: readFileFunction,
  writeFile: writeFileFunction,
  readMemory: readMemoryFunction,
  updateMemory: updateMemoryFunction,
};

// Convert our tool functions to Google GenAI SDK format
const convertToolFunction = (toolFunc: any) => ({
  name: toolFunc.name,
  description: toolFunc.description,
  parameters: {
    type: Type.OBJECT,
    properties: toolFunc.parameters.properties,
    required: toolFunc.parameters.required || []
  }
});

// Convert tool function declarations for Google GenAI
const TOOL_FUNCTIONS = [
  convertToolFunction(listVaultFilesFunction),
  convertToolFunction(readFileFunction),
  convertToolFunction(writeFileFunction),
  convertToolFunction(readMemoryFunction),
  convertToolFunction(updateMemoryFunction),
];

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
}: {
  apiKey: string;
  modelId: string;
  messages: ConversationMessage[];
  onToken: (token: string) => void;
  onToolCall?: (toolName: string, args: any) => void;
  onToolResult?: (toolName: string, result: any) => void;
  onToolsComplete?: (toolResults: string) => void;
  onThinking?: (thoughts: string) => void;
  onToolConfirmationNeeded?: (pendingTool: PendingToolCall) => Promise<ToolConfirmationResult>;
  app: App;
  thinkingBudget?: number;
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
    
    console.log('[AI DEBUG] Sending conversation to AI with tools and thinking budget. Last message:', userPrompt, 'thinking budget:', thinkingBudget);
    
    // Build config with thinking configuration
    const config: GenerateContentConfig = {
      tools: [{
        functionDeclarations: TOOL_FUNCTIONS
      }]
    };
    
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
    
    // Convert our conversation messages to Gemini format
    const geminiContents = messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role, // Gemini treats system as user
      parts: msg.parts
    }));
    
    console.log('[AI DEBUG] Sending full conversation history with', geminiContents.length, 'messages');
    console.log('[AI DEBUG] Conversation breakdown:', geminiContents.map((msg, i) => `${i+1}. ${msg.role}: ${msg.parts[0]?.text?.substring(0, 50)}...`));
    
    // Send request with tools and thinking config
    const response = await genAI.models.generateContent({
      model: modelId,
      contents: geminiContents,
      config: config
    });
    
    console.log('[AI DEBUG] Response received:', response);
    
    // Handle thinking tokens if present
    if (response.usageMetadata?.thoughtsTokenCount && response.usageMetadata.thoughtsTokenCount > 0) {
      console.log('[AI DEBUG] Thinking tokens:', response.usageMetadata.thoughtsTokenCount);
      
      // Extract thinking content if available
      let foundThinkingContent = false;
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          // Check if this part is marked as thinking content
          if ((part as any).thought === true && part.text && onThinking) {
            console.log('[AI DEBUG] Found thinking content:', part.text);
            onThinking(part.text);
            foundThinkingContent = true;
          }
        }
      }
      
      // If no specific thinking content found but we have thinking tokens, show a generic thinking message
      if (onThinking && !foundThinkingContent) {
        onThinking(`🧠 The model used ${response.usageMetadata.thoughtsTokenCount} thinking tokens to process this request.`);
      }
    }
    
    // Check if there are function calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      let hasToolCalls = true;
      
      // Process each function call
      for (const functionCall of response.functionCalls) {
        const { name, args } = functionCall;
        console.log('[AI DEBUG] Function call:', name, args);
        
        if (onToolCall && name) {
          onToolCall(name, args || {});
        }
        
        // Check if tool requires confirmation
        if (!name) continue; // Skip if no tool name
        
        const toolFunction = TOOL_FUNCTION_MAP[name];
        const requiresConfirmation = toolFunction?.requiresConfirmation || false;
        
        if (requiresConfirmation && onToolConfirmationNeeded) {
          // Create pending tool call
          const pendingTool: PendingToolCall = {
            id: `${name}-${Date.now()}`,
            name: name,
            args: args || {},
            requiresConfirmation: true
          };
          
          console.log('[AI DEBUG] Tool requires confirmation:', pendingTool);
          
          // Request confirmation from user
          const confirmationResult = await onToolConfirmationNeeded(pendingTool);
          
          if (!confirmationResult.approved) {
            console.log('[AI DEBUG] Tool execution denied by user');
            if (onToken) onToken(`[Tool execution cancelled by user: ${name}]`);
            continue; // Skip this tool execution
          }
          
          console.log('[AI DEBUG] Tool execution approved by user');
        }
        
        // Execute the tool
        if (name && TOOL_MAP[name]) {
          try {
            const toolResult = await TOOL_MAP[name](app, args || {});
            console.log('[AI DEBUG] Tool result:', toolResult);
            
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
            
            console.log('[AI DEBUG] Sending follow-up with', followUpContents.length, 'messages including tool result');
            
            // Send the tool result back to the model
            const followUpResponse = await genAI.models.generateContent({
              model: modelId,
              contents: followUpContents,
              config: config
            });
            
            // Handle thinking in follow-up response
            if (followUpResponse.usageMetadata?.thoughtsTokenCount && followUpResponse.usageMetadata.thoughtsTokenCount > 0) {
              console.log('[AI DEBUG] Follow-up thinking tokens:', followUpResponse.usageMetadata.thoughtsTokenCount);
              
              // Extract thinking content from follow-up response
              let foundFollowUpThinking = false;
              if (followUpResponse.candidates && followUpResponse.candidates[0]?.content?.parts) {
                for (const part of followUpResponse.candidates[0].content.parts) {
                  // Check if this part is marked as thinking content
                  if ((part as any).thought === true && part.text && onThinking) {
                    console.log('[AI DEBUG] Found follow-up thinking content:', part.text);
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
                .filter(part => (part as any).thought !== true && part.text)
                .map(part => part.text)
                .join('');
              
              if (responseParts) {
                console.log('[AI DEBUG] Follow-up response (filtered):', responseParts);
                onToken(responseParts);
              }
            } else if (followUpResponse.text) {
              console.log('[AI DEBUG] Follow-up response:', followUpResponse.text);
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
    } else if (response.candidates && response.candidates[0]?.content?.parts) {
      // Extract only non-thinking parts for the regular response
      const responseParts = response.candidates[0].content.parts
        .filter(part => (part as any).thought !== true && part.text)
        .map(part => part.text)
        .join('');
      
      if (responseParts) {
        console.log('[AI DEBUG] Direct text response (filtered):', responseParts);
        onToken(responseParts);
      }
    } else if (response.text) {
      // Fallback: Direct text response
      console.log('[AI DEBUG] Direct text response:', response.text);
      onToken(response.text);
    }
    
  } catch (error) {
    console.error('[AI DEBUG] Error in streamAIResponse:', error);
    if (onToken) onToken(`[Error: ${error}]`);
  }
} 