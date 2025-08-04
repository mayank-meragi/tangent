// interface SessionConfig {
//     model: string;
//     generationConfig?: {
//         responseModalities: string[];
//         temperature?: number;
//         maxOutputTokens?: number;
//     };
//     systemInstruction?: string;
// }

// interface AudioChunk {
//     data: string; // Base64 encoded audio
//     mimeType: string;
// }

// export class GeminiLiveClient {
//     private ws: WebSocket | null = null;
//     private apiKey: string;

//     constructor(apiKey: string) {
//         this.apiKey = apiKey;
//     }

//     async connect(config: SessionConfig): Promise<void> {
//         const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`;

//         // this.ws = new WebSocket(wsUrl, [], {
//         //     headers: {
//         //         'Authorization': `Bearer ${this.apiKey}`,
//         //         'Content-Type': 'application/json'
//         //     }
//         // });

//         return new Promise((resolve, reject) => {
//             this.ws!.onopen = () => {
//                 // Send setup message
//                 this.sendSetup(config);
//                 resolve();
//             };

//             this.ws!.onerror = (error) => {
//                 reject(error);
//             };

//             this.ws!.onmessage = (event) => {
//                 this.handleMessage(event.data);
//             };

//             this.ws!.onclose = () => {
//                 console.log('WebSocket connection closed');
//             };
//         });
//     }

//     private sendSetup(config: SessionConfig): void {
//         const setupMessage = {
//             setup: {
//                 model: config.model,
//                 generationConfig: config.generationConfig || {
//                     responseModalities: ["AUDIO", "TEXT"]
//                 },
//                 systemInstruction: config.systemInstruction
//             }
//         };

//         this.send(setupMessage);
//     }

//     sendRealtimeInput(audioChunk: AudioChunk): void {
//         const message = {
//             realtimeInput: {
//                 mediaChunks: [{
//                     data: audioChunk.data,
//                     mimeType: audioChunk.mimeType
//                 }]
//             }
//         };

//         this.send(message);
//     }

//     sendClientContent(text: string, endOfTurn = false): void {
//         const message = {
//             clientContent: {
//                 turns: [{
//                     role: "user",
//                     parts: [{ text }]
//                 }],
//                 turnComplete: endOfTurn
//             }
//         };

//         this.send(message);
//     }

//     private send(message: any): void {
//         if (this.ws && this.ws.readyState === WebSocket.OPEN) {
//             this.ws.send(JSON.stringify(message));
//         }
//     }

//     private handleMessage(data: string): void {
//         try {
//             const message = JSON.parse(data);

//             if (message.setupComplete) {
//                 console.log('Setup complete:', message.setupComplete);
//             } else if (message.serverContent) {
//                 this.handleServerContent(message.serverContent);
//             } else if (message.toolCall) {
//                 this.handleToolCall(message.toolCall);
//             }
//         } catch (error) {
//             console.error('Error parsing message:', error);
//         }
//     }

//     private handleServerContent(content: any): void {
//         if (content.modelTurn?.parts) {
//             content.modelTurn.parts.forEach((part: any) => {
//                 if (part.text) {
//                     console.log('Received text:', part.text);
//                 }
//                 if (part.inlineData?.data) {
//                     // Handle audio data - base64 encoded
//                     console.log('Received audio data');
//                     this.playAudio(part.inlineData.data);
//                 }
//             });
//         }
//     }

//     private handleToolCall(toolCall: any): void {
//         console.log('Tool call received:', toolCall);
//         // Handle function calls here
//     }

//     private playAudio(base64Audio: string): void {
//         // Convert base64 to audio and play
//         const audioData = atob(base64Audio);
//         const audioBuffer = new ArrayBuffer(audioData.length);
//         const view = new Uint8Array(audioBuffer);

//         for (let i = 0; i < audioData.length; i++) {
//             view[i] = audioData.charCodeAt(i);
//         }

//         // Create audio context and play
//         const audioContext = new AudioContext();
//         audioContext.decodeAudioData(audioBuffer).then(decodedData => {
//             const source = audioContext.createBufferSource();
//             source.buffer = decodedData;
//             source.connect(audioContext.destination);
//             source.start();
//         });
//     }

//     disconnect(): void {
//         if (this.ws) {
//             this.ws.close();
//             this.ws = null;
//         }
//     }
// }

// Empty export to make this file a module
export { };
