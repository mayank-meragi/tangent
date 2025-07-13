# Memory System Documentation

## Overview

The Tangent plugin now includes a file-based memory system that allows the AI to store and retrieve information across conversations. This memory is automatically included as context in every AI interaction.

## How It Works

### Memory File
- Memory is stored in a file called `assistant_memory.md` in your Obsidian vault
- This file is automatically created when the first memory entry is written
- Memory entries are timestamped and organized chronologically

### Memory Tools

The AI has access to two memory-related tools:

1. **writeToMemory** - Appends content to the memory file
   - Parameters: `content` (string) - The content to append
   - No confirmation required
   - Use this to store important information for future reference

2. **readMemory** - Reads the current content of the memory file
   - No parameters required
   - No confirmation required
   - Use this to retrieve previously stored information

### Automatic Context Integration

- Memory content is automatically included as context in every AI conversation
- The AI will see memory content before responding to your messages
- This allows the AI to maintain context across multiple conversations

## Usage Examples

### Storing User Preferences
```
User: "I prefer to write in a formal academic style"
AI: [Uses writeToMemory to store this preference]
```

### Remembering Important Information
```
User: "My project deadline is next Friday"
AI: [Uses writeToMemory to store this deadline]
```

### Retrieving Previous Context
```
User: "What was my project deadline again?"
AI: [Uses readMemory to find the stored deadline]
```

## Memory File Format

The memory file (`assistant_memory.md`) is structured as follows:

```markdown
## 2024-01-15T10:30:00.000Z

User prefers formal academic writing style.

## 2024-01-15T14:45:00.000Z

Project deadline is next Friday.

## 2024-01-16T09:15:00.000Z

User is working on a research paper about AI ethics.
```

## Best Practices

1. **Store Important Information**: Use memory for user preferences, deadlines, project details, and other important context
2. **Be Specific**: When storing information, be specific and clear about what should be remembered
3. **Regular Cleanup**: The memory file can grow large over time. Consider periodically reviewing and cleaning up old entries
4. **Privacy**: Remember that memory content is stored in plain text in your vault

## Technical Details

- Memory file location: `assistant_memory.md` (configurable)
- File format: Markdown with timestamped sections
- Integration: Memory content is injected into AI context automatically
- Tools: Available through the unified tool manager
- No external dependencies: Uses Obsidian's built-in file system

## Troubleshooting

### Memory Not Working
1. Check if the `assistant_memory.md` file exists in your vault
2. Verify that the memory tools are available in the AI's tool list
3. Check the browser console for any error messages

### Memory File Too Large
1. Open `assistant_memory.md` in Obsidian
2. Review and remove old or irrelevant entries
3. Consider archiving old memory to a separate file

### Memory Not Being Used
1. Ensure the AI has access to the memory tools
2. Check that the memory file contains relevant content
3. Verify that the system prompt includes memory instructions 