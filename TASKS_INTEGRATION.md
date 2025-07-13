# Obsidian Tasks Plugin Integration

## Overview

The Tangent plugin now includes automatic integration with the [Obsidian Tasks plugin](https://github.com/obsidian-tasks-group/obsidian-tasks). This integration allows the AI to automatically respect your global task filter settings when querying tasks, ensuring consistency between your Tasks plugin configuration and AI-powered task queries.

## How It Works

### Automatic Filter Application

When you use the `queryDataviewTasks` tool in Tangent chat, the system automatically:

1. **Detects the Obsidian Tasks plugin** - Checks if the plugin is installed and enabled
2. **Reads the global filter** - Extracts your configured global filter from the Tasks plugin settings
3. **Converts the filter** - Transforms Tasks plugin filter syntax into Dataview query conditions
4. **Applies the filter** - Automatically includes the global filter in all task queries

### Supported Filter Conversions

The integration supports converting common Tasks plugin filter patterns to Dataview syntax:

| Tasks Plugin Filter | Dataview Condition |
|-------------------|-------------------|
| `not done` | `!completed` |
| `done` | `completed` |
| `#work` | `contains(tags, "work")` |
| `due before 2024-12-31` | `due < date("2024-12-31")` |
| `due after 2024-01-01` | `due > date("2024-01-01")` |
| `due on 2024-06-15` | `due = date("2024-06-15")` |
| `priority is high` | `priority = "high"` |
| `priority is medium` | `priority = "medium"` |
| `priority is low` | `priority = "low"` |
| `path includes "Projects"` | `file.path =~ "Projects"` |

### Example Usage

**User Query:** "Show me all my tasks"

**Without Integration:**
- Returns all tasks in the vault

**With Integration:**
- If your Tasks plugin global filter is set to `not done and #work`
- The AI automatically applies this filter
- Returns only incomplete tasks tagged with #work

## Setup Instructions

### 1. Install Obsidian Tasks Plugin

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Tasks"
4. Install and enable the plugin

### 2. Configure Global Filter

1. Open Obsidian Settings
2. Go to Community Plugins → Tasks
3. Find the "Global Filter" setting
4. Enter your desired filter (e.g., `not done and #work`)
5. Save the settings

### 3. Test the Integration

1. Open Tangent chat in Obsidian
2. Ask the AI to query tasks: "Show me my tasks"
3. Check the console logs for `[TASKS DEBUG]` messages
4. Verify that the global filter is being applied

## Console Debugging

The integration provides detailed console logging to help you understand what's happening:

```
[TASKS DEBUG] Obsidian Tasks plugin not found or disabled
[TASKS DEBUG] Found global filter in property 'globalFilter': not done and #work
[TASKS DEBUG] Converted filter conditions: ['!completed', '(contains(tags, "work"))']
[TASKS DEBUG] Applied global filter from Obsidian Tasks plugin
```

## Fallback Behavior

If the Obsidian Tasks plugin is not available:

- The integration gracefully degrades
- Task queries work normally without the global filter
- No error messages are shown to the user
- The system continues to function as before

## Advanced Configuration

### Multiple Filter Properties

The integration checks multiple possible property names for the global filter:

1. `globalFilter` (most common)
2. `globalFilterString`
3. `filter`
4. `defaultFilter`
5. `globalQuery`

### Custom Filter Patterns

You can extend the filter conversion logic by modifying the `convertTasksFilterToDataviewConditions` function in `tools/dataviewTasks.ts`.

## Troubleshooting

### Global Filter Not Applied

1. **Check plugin installation:**
   - Ensure Obsidian Tasks plugin is installed and enabled
   - Verify the plugin ID is `obsidian-tasks`

2. **Check filter configuration:**
   - Open Tasks plugin settings
   - Verify a global filter is configured
   - Check that the filter is not empty

3. **Check console logs:**
   - Open browser developer tools
   - Look for `[TASKS DEBUG]` messages
   - Identify where the process is failing

### Filter Conversion Issues

1. **Check filter syntax:**
   - Ensure your filter uses supported syntax
   - Refer to the conversion table above

2. **Test with simple filters:**
   - Start with basic filters like `not done`
   - Gradually add complexity

3. **Check Dataview compatibility:**
   - Ensure your Dataview queries work independently
   - Verify Dataview plugin is properly configured

## Testing

Run the test script to verify the integration:

```bash
npm run test-tasks-integration
```

This will test:
- Plugin detection
- Settings access
- Filter conversion
- Fallback behavior

## Benefits

1. **Consistency** - AI queries respect your task filtering preferences
2. **Efficiency** - No need to manually specify filters in every query
3. **Integration** - Seamless experience between Tasks plugin and AI
4. **Flexibility** - Works with or without the Tasks plugin
5. **Debugging** - Clear console logs for troubleshooting

## Future Enhancements

Potential improvements for future versions:

1. **Real-time filter updates** - Detect changes to global filter settings
2. **Custom filter mappings** - User-defined conversion rules
3. **Filter templates** - Predefined filter combinations
4. **Visual feedback** - Show applied filters in the chat interface
5. **Filter history** - Remember frequently used filter combinations

## Technical Details

### Files Modified

- `tools/dataviewTasks.ts` - Added filter detection and conversion functions
- `systemPrompt.ts` - Updated to mention the integration
- `scripts/test-tasks-integration.js` - Added test script

### Key Functions

- `getObsidianTasksGlobalFilter()` - Detects and reads the global filter
- `convertTasksFilterToDataviewConditions()` - Converts filter syntax
- `buildDataviewQuery()` - Modified to include global filter

### Error Handling

- Graceful degradation when Tasks plugin is missing
- Comprehensive error logging for debugging
- Safe property access to prevent crashes
- Multiple fallback strategies for filter detection 