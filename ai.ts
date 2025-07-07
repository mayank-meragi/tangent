import { HumanMessage, AIMessage, ToolMessage, SystemMessage } from '@langchain/core/messages';
import { createListVaultFilesTool, createReadFileTool, createWriteFileTool } from './tools';
import { App } from 'obsidian';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

// Message type for conversation history - using LangChain message types
export type ConversationMessage = HumanMessage | AIMessage | ToolMessage | SystemMessage;

export async function streamAIResponse({
  apiKey,
  modelId,
  messages,
  onToken,
  onToolCall,
  onToolResult,
  onToolsComplete,
  app,
}: {
  apiKey: string;
  modelId: string;
  messages: ConversationMessage[];
  onToken: (token: string) => void;
  onToolCall?: (toolName: string, args: any) => void;
  onToolResult?: (toolName: string, result: any) => void;
  onToolsComplete?: (toolResults: string) => void;
  app: App;
}) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    if (onToken) onToken('[Gemini API key not set]');
    return;
  }
  if (!modelId || typeof modelId !== 'string' || !modelId.trim()) {
    if (onToken) onToken('[Model ID not set]');
    return;
  }
  
  // Create tools with app context
  const listVaultFiles = createListVaultFilesTool(app);
  const readFile = createReadFileTool(app);
  const writeFile = createWriteFileTool(app);
  const TOOL_MAP: Record<string, any> = {
    listVaultFiles,
    readFile,
    writeFile,
  };
  
  let model: any = new ChatGoogleGenerativeAI({
    apiKey,
    model: modelId,
    streaming: true,
  });
  model = model.bindTools([listVaultFiles, readFile, writeFile]);
  
  // Messages are already in LangChain format, so we can use them directly
  const formattedMessages = messages;
  
  console.log('[AI DEBUG] Received messages to send to AI:', messages);
  console.log('[AI DEBUG] Formatted messages for AI:', formattedMessages);
  const stream = await (model as any).stream(formattedMessages);
  let lastChunk = null;
  for await (const chunk of stream) {
    console.log('[AI DEBUG] Streaming chunk:', chunk);
    lastChunk = chunk;
    if (chunk?.content && chunk.tool_calls.length == 0) {
      if (Array.isArray(chunk.content)) {
        const text = (chunk.content as any[]).map((part: any) => part.text || part).join('');
        console.log('[AI DEBUG] Passing to onToken:', text);
        onToken(text);
      } else {
        const text = typeof chunk.content === 'string' ? chunk.content : '';
        console.log('[AI DEBUG] Passing to onToken:', text);
        onToken(text);
      }
    }
  }
  // After streaming, check for tool calls
  if (lastChunk && lastChunk.tool_calls && lastChunk.tool_calls.length > 0) {
    const toolResults: string[] = [];
    const toolMessages: ToolMessage[] = [];
    
    for (const toolCall of lastChunk.tool_calls) {
      console.log('[AI DEBUG] Tool call detected:', toolCall.name, toolCall.args);
      if (onToolCall) onToolCall(toolCall.name, toolCall.args);
      
      // Call the tool
      let result;
      try {
        const toolFn = TOOL_MAP[toolCall.name];
        if (toolFn) {
          const parsedArgs = typeof toolCall.args === 'string' ? JSON.parse(toolCall.args) : toolCall.args;
          console.log('[AI DEBUG] Invoking tool:', toolCall.name, parsedArgs);
          result = await toolFn.invoke({
            ...parsedArgs,
            onMessage: (msg: any) => {
              // Removed duplicate onToolCall to avoid double tool call messages in UI
              // if (msg.role === 'tool-call' && onToolCall) {
              //   onToolCall(msg.toolName, msg.toolArgs);
              // }
            }
          });
          console.log('[AI DEBUG] Tool result:', result);
        } else {
          result = `[Tool not found: ${toolCall.name}]`;
        }
      } catch (e) {
        result = `[Tool error: ${e}]`;
        console.error('[AI DEBUG] Tool error:', e);
      }
      
      if (onToolResult) onToolResult(toolCall.name, result);
      
      // Create ToolMessage for LangChain
      let toolContent = '';
      if (result && typeof result === 'object') {
        if (result.type === 'file-list') {
          toolContent = result.files.map((f: any) => `${f.type === 'folder' ? '📁' : '📄'} ${f.name}`).join('\n');
        } else if (result.type === 'text') {
          toolContent = result.text;
        } else {
          toolContent = JSON.stringify(result, null, 2);
        }
      } else {
        toolContent = String(result);
      }
      
      const toolMessage = new ToolMessage({
        content: toolContent,
        name: toolCall.name,
        tool_call_id: toolCall.id
      });
      
      toolMessages.push(toolMessage);
      
      // Format tool result for callback
      const formattedResult = `Tool ${toolCall.name} results:\n${toolContent}`;
      toolResults.push(formattedResult);
    }
    
    // Just notify that tools are complete without triggering recursive AI calls
    if (toolResults.length > 0 && onToolsComplete) {
      const combinedResults = toolResults.join('\n\n');
      console.log('[AI DEBUG] Tools completed with results:', combinedResults);
      onToolsComplete(combinedResults);
    }
  }
} 