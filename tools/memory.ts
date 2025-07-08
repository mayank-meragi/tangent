import { App, TFile } from 'obsidian';
import { ToolResult, ToolFunction } from './types';

const MEMORY_FILE_PATH = 'assistant_memory.md';

// Memory template with structured sections
const MEMORY_TEMPLATE = `# Assistant Memory

This file contains important information about the user for providing personalized assistance.

## 1. Identity & Profile
- **Name:** 
- **Preferred Pronouns:** 
- **Role/Profession:** 
- **Contact Details:** 

## 2. Daily Routine & Habits
- **Typical Wake/Sleep Times:** 
- **Work Hours:** 
- **Break Schedules:** 
- **Exercise or Meditation:** 

## 3. Goals & Priorities
- **Short-Term Goals:** 
- **Long-Term Goals:** 
- **Projects in Progress:** 
- **Areas of Focus:** 

## 4. Communication Style
- **Tone:** 
- **Response Expectations:** 
- **Preferred Channels:** 

## 5. Tasks & To-Dos
- **Current Tasks:** 
- **Recurring Tasks:** 
- **Deadlines:** 
- **Delegated Responsibilities:** 

## 6. Calendar & Scheduling
- **Preferred Meeting Times:** 
- **Blocked Focus Hours:** 
- **Event Preferences:** 
- **Available Calendars:** 

## 7. Knowledge & Skills
- **Areas of Expertise:** 
- **Tools/Platforms Used:** 
- **Learning Goals:** 
- **Topics of Interest:** 

## 8. Preferences & Interests
- **Food/Diet:** 
- **Music/Movies/Books:** 
- **Travel Habits:** 
- **Shopping/Brands:** 

## 9. People & Relationships
- **Close Contacts:** 
- **Work Relationships:** 
- **Collaboration Preferences:** 
- **Important Dates:** 

## 10. Tech Stack & Integrations
- **Devices:** 
- **OS/Platforms:** 

## 11. Context & Environment
- **Current Location:** 
- **Time Zone:** 
- **Internet Availability:** 
- **Physical Constraints:**

## Writing Style
- 
- 

---

## Conversation History & Updates

*Recent interactions and important notes will be added below with timestamps*

`;

export const readMemoryFunction: ToolFunction = {
  name: 'readMemory',
  description: 'Read the assistant memory file to recall important information from past conversations',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  requiresConfirmation: false
};

export const updateMemoryFunction: ToolFunction = {
  name: 'updateMemory',
  description: 'Update the assistant memory file by overwriting it with complete new content. The AI should read the current memory, intelligently merge new information, and provide the complete updated file content.',
  parameters: {
    type: 'object',
    properties: {
      updatedContent: {
        type: 'string',
        description: 'The complete updated memory file content that will replace the existing file'
      }
    },
    required: ['updatedContent']
  },
  requiresConfirmation: false
};

export async function readMemory(app: App, args: {}): Promise<ToolResult> {
  try {
    const vault = app.vault;
    
    // Try to get the memory file
    const file = vault.getAbstractFileByPath(MEMORY_FILE_PATH);
    if (!file) {
      // Memory file doesn't exist yet, create it with template
      await vault.create(MEMORY_FILE_PATH, MEMORY_TEMPLATE);
      return {
        type: 'text',
        text: 'Memory file created with template structure. All sections are currently empty and ready to be filled with user information.'
      };
    }
    
    // Check if it's actually a file (not a folder)
    if (!(file instanceof TFile)) {
      return {
        type: 'error',
        error: `${MEMORY_FILE_PATH} exists but is not a file`
      };
    }
    
    // Read the memory file content
    const content = await vault.read(file);
    
    return {
      type: 'text',
      text: content || 'Memory file exists but is empty.'
    };
  } catch (error) {
    return {
      type: 'error',
      error: `Error reading memory: ${error}`
    };
  }
}

export async function updateMemory(app: App, args: { updatedContent: string }): Promise<ToolResult> {
  try {
    const { updatedContent } = args;
    const vault = app.vault;
    
    // Create timestamp
    const timestamp = new Date().toISOString();
    
    // Ensure the file exists, create if not
    let file = vault.getAbstractFileByPath(MEMORY_FILE_PATH) as TFile;
    if (!file) {
      file = await vault.create(MEMORY_FILE_PATH, MEMORY_TEMPLATE) as TFile;
    }
    
    // Add metadata comment at the top with update timestamp
    const contentWithTimestamp = `<!-- Last updated: ${timestamp} -->\n${updatedContent}`;
    
    // Overwrite the entire file with the updated content
    await vault.modify(file, contentWithTimestamp);
    
    return {
      type: 'text',
      text: `Memory successfully updated. The entire file has been overwritten with the new content.`
    };
  } catch (error) {
    return {
      type: 'error',
      error: `Error updating memory: ${error}`
    };
  }
} 