import { App, TFile } from 'obsidian';

// Types for task data
export interface DateRange {
  start?: string;
  end?: string;
}

export interface TaskData {
  text: string;
  completed?: boolean;
  due?: string | DateRange;
  created?: string | DateRange;
  start?: string | DateRange;
  scheduled?: string | DateRange;
  priority?: 'high' | 'medium' | 'low';
  project?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  description?: string;
  content?: string;
}

export interface TaskFilters {
  completed?: boolean;
  due?: string | DateRange;
  created?: string | DateRange;
  start?: string | DateRange;
  scheduled?: string | DateRange;
  tags?: string[];
  project?: string;
  dateRange?: DateRange;
}

export interface QueryOptions {
  query?: string;
  queryType?: 'TASK' | 'LIST' | 'TABLE';
  source?: string;
  filters?: TaskFilters;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  limit?: number;
  format?: 'json' | 'text' | 'markdown';
}

export interface WriteOptions {
  operation: 'create' | 'update' | 'delete' | 'toggle';
  file: string;
  tasks?: TaskData[];
  task?: TaskData;
  taskId?: string;
  position?: 'top' | 'bottom' | number;
  metadata?: Record<string, any>;
}

// Function to get Obsidian Tasks plugin global filter
export async function getObsidianTasksGlobalFilter(app: App): Promise<string | null> {
  try {
    // Get all available plugins
    const allPlugins = (app as any).plugins.plugins;
    
    // Try multiple possible plugin IDs for the Tasks plugin
    const possiblePluginIds = [
      'obsidian-tasks',
      'tasks',
      'obsidian-tasks-group',
      'obsidian-tasks-group-obsidian-tasks',
      'obsidian-tasks-plugin'
    ];
    
    let tasksPlugin = null;
    
    for (const id of possiblePluginIds) {
      if (allPlugins[id]) {
        tasksPlugin = allPlugins[id];
        break;
      }
    }
    
    if (!tasksPlugin) {
      return null;
    }
    
    // Check if plugin is enabled - look at _userDisabled property
    const isEnabled = !tasksPlugin._userDisabled;
    
    if (!isEnabled) {
      return null;
    }
    
    // Access the plugin settings - try to get from the plugin's data
    let settings = null;
    
    // Try to access the plugin's data directly
    if (tasksPlugin.data) {
      settings = tasksPlugin.data;
    } else if (tasksPlugin.settings) {
      settings = tasksPlugin.settings;
    } else if (tasksPlugin.instance?.settings) {
      settings = tasksPlugin.instance.settings;
    } else {
      // Try to access the plugin's internal data
      
      // Look for common data properties
      const dataProperties = ['data', 'settings', 'config', 'options', 'preferences'];
      for (const prop of dataProperties) {
        if (tasksPlugin[prop]) {
          settings = tasksPlugin[prop];
          break;
        }
      }
      
      // Try to access the plugin's API
      if (!settings && tasksPlugin.apiV1) {
        try {
          const api = tasksPlugin.apiV1;
          
          // Try to get settings from API
          if (api.getSettings) {
            settings = api.getSettings();
          } else if (api.settings) {
            settings = api.settings;
          }
        } catch (error) {
          // Ignore API access errors
        }
      }
      
      // Try to access the plugin's cache or other internal structures
      if (!settings && tasksPlugin.cache) {
        
        // Look for settings in cache
        if (tasksPlugin.cache.settings) {
          settings = tasksPlugin.cache.settings;
        }
        
        // Try to access cache state
        if (!settings && tasksPlugin.cache.state) {
          if (tasksPlugin.cache.state.settings) {
            settings = tasksPlugin.cache.state.settings;
          }
        }
        
        // Try to access the plugin's internal data through cache
        if (!settings) {
          // Look for any property that might contain settings
          for (const [, value] of Object.entries(tasksPlugin.cache)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              if ((value as any).settings) {
                settings = (value as any).settings;
                break;
              }
            }
          }
        }
      }
    }
    
    if (!settings) {
      
      // Try to access the plugin's internal data through other properties
      
      // Check if the plugin has a loadData method that might give us access to settings
      if (typeof tasksPlugin.loadData === 'function') {
        try {
          const loadedData = await tasksPlugin.loadData();
          if (loadedData && typeof loadedData === 'object') {
            settings = loadedData;
          }
        } catch (error) {
          // Ignore data loading errors
        }
      }
      
      // Try to access through the plugin's internal structures
      if (!settings) {
        // Check if there's a way to access the plugin's internal state
        for (const prop of Object.keys(tasksPlugin)) {
          const value = (tasksPlugin as any)[prop];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            if ((value as any).settings) {
              settings = (value as any).settings;
              break;
            }
          }
        }
      }
      
      if (!settings) {
        return null;
      }
    }
    
    
    // The global filter is typically stored in the settings
    // Common property names for the global filter
    const possibleFilterProperties = [
      'globalFilter',
      'globalFilterString',
      'filter',
      'defaultFilter',
      'globalQuery'
    ];
    
    for (const prop of possibleFilterProperties) {
      if (settings[prop] && typeof settings[prop] === 'string' && settings[prop].trim()) {
        return settings[prop].trim();
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('[TASKS DEBUG] Error accessing Tasks plugin:', error);
    return null;
  }
}

// Function to convert Tasks global filter to Dataview query conditions
export function convertTasksFilterToDataviewConditions(globalFilter: string): string[] {
  const conditions: string[] = [];
  
  if (!globalFilter || !globalFilter.trim()) {
    return conditions;
  }
  
  try {
    // Common Tasks filter patterns and their Dataview equivalents
    const filter = globalFilter.trim();
    
    // Handle common Tasks filter patterns
    if (filter.includes('not done')) {
      conditions.push('!completed');
    } else if (filter.includes('done')) {
      conditions.push('completed');
    }
    
    // Handle tag filters
    const tagMatches = filter.match(/#(\w+)/g);
    if (tagMatches) {
      const tags = tagMatches.map(tag => tag.substring(1)); // Remove #
      // For Dataview, we need to check if the tag exists in the tags array
      // Using contains() should work, but let's be more explicit about exact matching
      const tagConditions = tags.map(tag => `contains(tags, "${tag}")`).join(' OR ');
      conditions.push(`(${tagConditions})`);
    }
    
    // Handle path filters
    const pathMatches = filter.match(/path includes "([^"]+)"/);
    if (pathMatches) {
      conditions.push(`file.path =~ "${pathMatches[1]}"`);
    }
    
    // Handle due date filters
    if (filter.includes('due before')) {
      const dateMatch = filter.match(/due before (\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        conditions.push(`due < date("${dateMatch[1]}")`);
      }
    } else if (filter.includes('due after')) {
      const dateMatch = filter.match(/due after (\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        conditions.push(`due > date("${dateMatch[1]}")`);
      }
    } else if (filter.includes('due on')) {
      const dateMatch = filter.match(/due on (\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        conditions.push(`due = date("${dateMatch[1]}")`);
      }
    }
    
    // Handle priority filters
    if (filter.includes('priority is high')) {
      conditions.push('priority = "high"');
    } else if (filter.includes('priority is medium')) {
      conditions.push('priority = "medium"');
    } else if (filter.includes('priority is low')) {
      conditions.push('priority = "low"');
    }
    
    
  } catch (error) {
    console.error('[TASKS DEBUG] Error converting Tasks filter:', error);
  }
  
  return conditions;
}

// Helper function to build Dataview query
async function buildDataviewQuery(options: QueryOptions, app?: App): Promise<string> {
  const { queryType = 'TASK', source, filters, sort, limit } = options;
  
  if (options.query) {
    return options.query;
  }

  let query = queryType;
  
  // Add source
  if (source) {
    query += ` FROM "${source}"`;
  }
  
  // Add filters
  const conditions: string[] = [];
  
  // Apply user-provided filters
  if (filters?.completed !== undefined) {
    conditions.push(filters.completed ? 'completed' : '!completed');
  }
  
  // Handle date filters with support for ranges
  if (filters?.due) {
    if (typeof filters.due === 'string') {
      conditions.push(`due = date("${filters.due}")`);
    } else if (filters.due.start && filters.due.end) {
      conditions.push(`due >= date("${filters.due.start}") AND due <= date("${filters.due.end}")`);
    } else if (filters.due.start) {
      conditions.push(`due >= date("${filters.due.start}")`);
    } else if (filters.due.end) {
      conditions.push(`due <= date("${filters.due.end}")`);
    }
  }
  
  if (filters?.created) {
    if (typeof filters.created === 'string') {
      conditions.push(`created = date("${filters.created}")`);
    } else if (filters.created.start && filters.created.end) {
      conditions.push(`created >= date("${filters.created.start}") AND created <= date("${filters.created.end}")`);
    } else if (filters.created.start) {
      conditions.push(`created >= date("${filters.created.start}")`);
    } else if (filters.created.end) {
      conditions.push(`created <= date("${filters.created.end}")`);
    }
  }
  
  if (filters?.start) {
    if (typeof filters.start === 'string') {
      conditions.push(`start = date("${filters.start}")`);
    } else if (filters.start.start && filters.start.end) {
      conditions.push(`start >= date("${filters.start.start}") AND start <= date("${filters.start.end}")`);
    } else if (filters.start.start) {
      conditions.push(`start >= date("${filters.start.start}")`);
    } else if (filters.start.end) {
      conditions.push(`start <= date("${filters.start.end}")`);
    }
  }
  
  if (filters?.scheduled) {
    if (typeof filters.scheduled === 'string') {
      conditions.push(`scheduled = date("${filters.scheduled}")`);
    } else if (filters.scheduled.start && filters.scheduled.end) {
      conditions.push(`scheduled >= date("${filters.scheduled.start}") AND scheduled <= date("${filters.scheduled.end}")`);
    } else if (filters.scheduled.start) {
      conditions.push(`scheduled >= date("${filters.scheduled.start}")`);
    } else if (filters.scheduled.end) {
      conditions.push(`scheduled <= date("${filters.scheduled.end}")`);
    }
  }
  
  if (filters?.tags && filters.tags.length > 0) {
    const tagConditions = filters.tags.map(tag => `contains(tags, "${tag}")`).join(' OR ');
    conditions.push(`(${tagConditions})`);
  }
  
  if (filters?.project) {
    conditions.push(`project = "${filters.project}"`);
  }
  
  if (filters?.dateRange) {
    if (filters.dateRange.start) {
      conditions.push(`created >= date("${filters.dateRange.start}")`);
    }
    if (filters.dateRange.end) {
      conditions.push(`created <= date("${filters.dateRange.end}")`);
    }
  }
  
  // Apply Obsidian Tasks plugin global filter if available
  if (app) {
    const globalFilter = await getObsidianTasksGlobalFilter(app);
    if (globalFilter) {
      const globalConditions = convertTasksFilterToDataviewConditions(globalFilter);
      conditions.push(...globalConditions);
    }
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  // Add sorting
  if (sort) {
    query += ` SORT ${sort.field} ${sort.order}`;
  }
  
  // Add limit
  if (limit) {
    query += ` LIMIT ${limit}`;
  }
  
  return query;
}

// Helper function to parse task from markdown
function parseTaskFromMarkdown(line: string): TaskData | null {
  const taskRegex = /^(\s*)- \[([ xX])\] (.+)$/;
  const match = line.match(taskRegex);
  
  if (!match) return null;
  
  const [, , status, text] = match;
  const completed = status.toLowerCase() === 'x';
  
  // Extract metadata from text
  const metadata: Record<string, any> = {};
  const tags: string[] = [];
  
  // Extract tags
  const tagRegex = /#(\w+)/g;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(text)) !== null) {
    tags.push(tagMatch[1]);
  }
  
  // Extract emoji shorthands
  const dueMatch = text.match(/🗓️(\d{4}-\d{2}-\d{2}(?:-\d{4}-\d{2}-\d{2})?|\d{4}-\d{2}-\d{2}\+|-?\d{4}-\d{2}-\d{2})/);
  if (dueMatch) {
    const dueStr = dueMatch[1];
    if (dueStr.includes('-') && dueStr.split('-').length === 6) {
      // Range format: YYYY-MM-DD-YYYY-MM-DD
      const parts = dueStr.split('-');
      metadata.due = {
        start: `${parts[0]}-${parts[1]}-${parts[2]}`,
        end: `${parts[3]}-${parts[4]}-${parts[5]}`
      };
    } else if (dueStr.endsWith('+')) {
      // Start only: YYYY-MM-DD+
      metadata.due = { start: dueStr.slice(0, -1) };
    } else if (dueStr.startsWith('-')) {
      // End only: -YYYY-MM-DD
      metadata.due = { end: dueStr.slice(1) };
    } else {
      // Single date: YYYY-MM-DD
      metadata.due = dueStr;
    }
  }
  
  const completionMatch = text.match(/✅(\d{4}-\d{2}-\d{2}(?:-\d{4}-\d{2}-\d{2})?|\d{4}-\d{2}-\d{2}\+|-?\d{4}-\d{2}-\d{2})/);
  if (completionMatch) {
    const completionStr = completionMatch[1];
    if (completionStr.includes('-') && completionStr.split('-').length === 6) {
      const parts = completionStr.split('-');
      metadata.completion = {
        start: `${parts[0]}-${parts[1]}-${parts[2]}`,
        end: `${parts[3]}-${parts[4]}-${parts[5]}`
      };
    } else if (completionStr.endsWith('+')) {
      metadata.completion = { start: completionStr.slice(0, -1) };
    } else if (completionStr.startsWith('-')) {
      metadata.completion = { end: completionStr.slice(1) };
    } else {
      metadata.completion = completionStr;
    }
  }
  
  const createdMatch = text.match(/➕(\d{4}-\d{2}-\d{2}(?:-\d{4}-\d{2}-\d{2})?|\d{4}-\d{2}-\d{2}\+|-?\d{4}-\d{2}-\d{2})/);
  if (createdMatch) {
    const createdStr = createdMatch[1];
    if (createdStr.includes('-') && createdStr.split('-').length === 6) {
      const parts = createdStr.split('-');
      metadata.created = {
        start: `${parts[0]}-${parts[1]}-${parts[2]}`,
        end: `${parts[3]}-${parts[4]}-${parts[5]}`
      };
    } else if (createdStr.endsWith('+')) {
      metadata.created = { start: createdStr.slice(0, -1) };
    } else if (createdStr.startsWith('-')) {
      metadata.created = { end: createdStr.slice(1) };
    } else {
      metadata.created = createdStr;
    }
  }
  
  const startMatch = text.match(/🛫(\d{4}-\d{2}-\d{2}(?:-\d{4}-\d{2}-\d{2})?|\d{4}-\d{2}-\d{2}\+|-?\d{4}-\d{2}-\d{2})/);
  if (startMatch) {
    const startStr = startMatch[1];
    if (startStr.includes('-') && startStr.split('-').length === 6) {
      const parts = startStr.split('-');
      metadata.start = {
        start: `${parts[0]}-${parts[1]}-${parts[2]}`,
        end: `${parts[3]}-${parts[4]}-${parts[5]}`
      };
    } else if (startStr.endsWith('+')) {
      metadata.start = { start: startStr.slice(0, -1) };
    } else if (startStr.startsWith('-')) {
      metadata.start = { end: startStr.slice(1) };
    } else {
      metadata.start = startStr;
    }
  }
  
  const scheduledMatch = text.match(/⏳(\d{4}-\d{2}-\d{2}(?:-\d{4}-\d{2}-\d{2})?|\d{4}-\d{2}-\d{2}\+|-?\d{4}-\d{2}-\d{2})/);
  if (scheduledMatch) {
    const scheduledStr = scheduledMatch[1];
    if (scheduledStr.includes('-') && scheduledStr.split('-').length === 6) {
      const parts = scheduledStr.split('-');
      metadata.scheduled = {
        start: `${parts[0]}-${parts[1]}-${parts[2]}`,
        end: `${parts[3]}-${parts[4]}-${parts[5]}`
      };
    } else if (scheduledStr.endsWith('+')) {
      metadata.scheduled = { start: scheduledStr.slice(0, -1) };
    } else if (scheduledStr.startsWith('-')) {
      metadata.scheduled = { end: scheduledStr.slice(1) };
    } else {
      metadata.scheduled = scheduledStr;
    }
  }
  
  // Extract inline metadata
  const inlineMetadataRegex = /\[([^:]+)::\s*([^\]]+)\]/g;
  let inlineMatch;
  while ((inlineMatch = inlineMetadataRegex.exec(text)) !== null) {
    const [, key, value] = inlineMatch;
    metadata[key.trim()] = value.trim();
  }
  
  // Clean text from metadata
  const cleanText = text
    .replace(/🗓️\d{4}-\d{2}-\d{2}/g, '')
    .replace(/🗓️\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}/g, '')
    .replace(/🗓️\d{4}-\d{2}-\d{2}\+/g, '')
    .replace(/🗓️-\d{4}-\d{2}-\d{2}/g, '')
    .replace(/✅\d{4}-\d{2}-\d{2}/g, '')
    .replace(/✅\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}/g, '')
    .replace(/✅\d{4}-\d{2}-\d{2}\+/g, '')
    .replace(/✅-\d{4}-\d{2}-\d{2}/g, '')
    .replace(/➕\d{4}-\d{2}-\d{2}/g, '')
    .replace(/➕\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}/g, '')
    .replace(/➕\d{4}-\d{2}-\d{2}\+/g, '')
    .replace(/➕-\d{4}-\d{2}-\d{2}/g, '')
    .replace(/🛫\d{4}-\d{2}-\d{2}/g, '')
    .replace(/🛫\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}/g, '')
    .replace(/🛫\d{4}-\d{2}-\d{2}\+/g, '')
    .replace(/🛫-\d{4}-\d{2}-\d{2}/g, '')
    .replace(/⏳\d{4}-\d{2}-\d{2}/g, '')
    .replace(/⏳\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}/g, '')
    .replace(/⏳\d{4}-\d{2}-\d{2}\+/g, '')
    .replace(/⏳-\d{4}-\d{2}-\d{2}/g, '')
    .replace(/\[[^:]+::\s*[^\]]+\]/g, '')
    .replace(/#\w+/g, '')
    .trim();
  
  return {
    text: cleanText,
    completed,
    tags,
    ...metadata
  };
}

// Helper function to format task to markdown
function formatTaskToMarkdown(task: TaskData): string {
  // Ensure task.text exists, fallback to empty string if not
  const taskText = task.text || task.description || task.content || 'Untitled Task';
  
  let line = `- [${task.completed ? 'x' : ' '}] ${taskText}`;
  
  // Add tags
  if (task.tags && task.tags.length > 0) {
    line += ' ' + task.tags.map(tag => `#${tag}`).join(' ');
  }
  
  // Add emoji shorthands
  if (task.due) {
    if (typeof task.due === 'string') {
      line += ` 🗓️${task.due}`;
    } else if (task.due.start && task.due.end) {
      line += ` 🗓️${task.due.start}-${task.due.end}`;
    } else if (task.due.start) {
      line += ` 🗓️${task.due.start}+`;
    } else if (task.due.end) {
      line += ` 🗓️-${task.due.end}`;
    }
  }
  
  if (task.created) {
    if (typeof task.created === 'string') {
      line += ` ➕${task.created}`;
    } else if (task.created.start && task.created.end) {
      line += ` ➕${task.created.start}-${task.created.end}`;
    } else if (task.created.start) {
      line += ` ➕${task.created.start}+`;
    } else if (task.created.end) {
      line += ` ➕-${task.created.end}`;
    }
  }
  
  if (task.start) {
    if (typeof task.start === 'string') {
      line += ` 🛫${task.start}`;
    } else if (task.start.start && task.start.end) {
      line += ` 🛫${task.start.start}-${task.start.end}`;
    } else if (task.start.start) {
      line += ` 🛫${task.start.start}+`;
    } else if (task.start.end) {
      line += ` 🛫-${task.start.end}`;
    }
  }
  
  if (task.scheduled) {
    if (typeof task.scheduled === 'string') {
      line += ` ⏳${task.scheduled}`;
    } else if (task.scheduled.start && task.scheduled.end) {
      line += ` ⏳${task.scheduled.start}-${task.scheduled.end}`;
    } else if (task.scheduled.start) {
      line += ` ⏳${task.scheduled.start}+`;
    } else if (task.scheduled.end) {
      line += ` ⏳-${task.scheduled.end}`;
    }
  }
  
  if (task.completed && task.metadata?.completion) {
    const completion = task.metadata.completion;
    if (typeof completion === 'string') {
      line += ` ✅${completion}`;
    } else if (completion.start && completion.end) {
      line += ` ✅${completion.start}-${completion.end}`;
    } else if (completion.start) {
      line += ` ✅${completion.start}+`;
    } else if (completion.end) {
      line += ` ✅-${completion.end}`;
    }
  }
  
  // Add inline metadata
  if (task.metadata) {
    for (const [key, value] of Object.entries(task.metadata)) {
      if (key !== 'completion') { // Already handled above
        line += ` [${key}:: ${value}]`;
      }
    }
  }
  
  return line;
}

// Main query function
export async function queryDataviewTasks(app: App, options: QueryOptions): Promise<any> {
  try {
    
    // Check if Dataview plugin is available
    const dataviewPlugin = (app as any).plugins.plugins.dataview;
    if (!dataviewPlugin) {
      throw new Error('Dataview plugin is not installed or enabled');
    }
    
    if (!dataviewPlugin.api || typeof dataviewPlugin.api.query !== 'function') {
      throw new Error('Dataview plugin API is not available or query method is missing');
    }
    
    // Build the query
    const query = await buildDataviewQuery(options, app);
    
    // For simple queries, we can also try a fallback method
    if (!query.includes('FROM') && !query.includes('WHERE')) {
      return await fallbackTaskQuery(app, options);
    }
    
    // Execute the query using Dataview API
    
    let results;
    try {
      results = await dataviewPlugin.api.query(query);
    } catch (queryError) {
      console.error('[DATAVIEW DEBUG] Query execution error:', queryError);
      throw new Error(`Dataview query failed: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`);
    }
    
    // Handle different response formats from Dataview
    let resultArray: any[] = [];
    
    if (results && typeof results === 'object') {
      if (Array.isArray(results.value)) {
        resultArray = results.value;
      } else if (Array.isArray(results)) {
        resultArray = results;
      } else if (results.value && typeof results.value === 'object') {
        // If results.value is an object, try to extract array from it
        if (Array.isArray(results.value.values)) {
          resultArray = results.value.values;
        } else if (Array.isArray(results.value.rows)) {
          resultArray = results.value.rows;
        } else if (Array.isArray(results.value.data)) {
          resultArray = results.value.data;
        } else {
          // If it's a single result, wrap it in an array
          resultArray = [results.value];
        }
      } else {
        // Fallback: wrap single result in array
        resultArray = [results];
      }
    }
    
    
    // Check if results contain valid task data
    const hasValidTasks = resultArray.some((item: any) => {
      if (item && typeof item === 'object') {
        return item.text || (item.task && item.task.text) || (item.task && typeof item.task === 'string');
      }
      return false;
    });
    
    if (!hasValidTasks && resultArray.length > 0) {
      return await fallbackTaskQuery(app, options);
    }
    
    // Process results based on format
    const format = options.format || 'json';
    
    if (format === 'json') {
      return {
        type: 'success',
        data: {
          query,
          results: resultArray,
          count: resultArray.length
        }
      };
    } else if (format === 'text' || format === 'markdown') {
      // Convert to text/markdown format
      const formattedResults = resultArray.map((item: any, index: number) => {
        if (item && typeof item === 'object') {
          // Try different possible task object structures
          let taskText = null;
          let taskObject = null;
          
          // Check if it's a direct task object
          if (item.text) {
            taskText = item.text;
            taskObject = item;
          } else if (item.task && item.task.text) {
            taskText = item.task.text;
            taskObject = item.task;
          } else if (item.task && typeof item.task === 'string') {
            taskText = item.task;
            taskObject = { text: item.task };
          } else if (item.file && item.file.path) {
            return `File: ${item.file.path}`;
          } else if (item.link) {
            return `Link: ${item.link}`;
          } else if (typeof item === 'string') {
            // Handle case where Dataview returns task as a string
            taskText = item;
            taskObject = { text: item };
          } else {
            // Try to extract any text-like property
            const textProps = ['text', 'content', 'description', 'title', 'name', 'task'];
            for (const prop of textProps) {
              if (item[prop]) {
                if (typeof item[prop] === 'string') {
                  taskText = item[prop];
                  taskObject = { text: item[prop] };
                  break;
                } else if (item[prop] && typeof item[prop] === 'object' && item[prop].text) {
                  taskText = item[prop].text;
                  taskObject = item[prop];
                  break;
                }
              }
            }
          }
          
          if (taskText) {
            // Ensure task text is not undefined or empty
            if (taskText === 'undefined' || taskText === 'null' || taskText.trim() === '') {
              return `- [ ] Invalid task (text: ${taskText})`;
            }
            
            return formatTaskToMarkdown(taskObject);
          } else {
            return JSON.stringify(item);
          }
        } else if (typeof item === 'string') {
          return item;
        } else {
          return String(item);
        }
      }).join('\n');
      
      return {
        type: 'success',
        data: {
          query,
          results: formattedResults,
          count: resultArray.length
        }
      };
    }
    
    return {
      type: 'success',
      data: resultArray
    };
    
  } catch (error) {
    console.error('[DATAVIEW DEBUG] Query error:', error);
    return {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Main write function
export async function writeDataviewTasks(app: App, options: WriteOptions): Promise<any> {
  try {
    
    const { operation, file: filePath, tasks, task, position = 'bottom' } = options;
    
    // Get or create the target file
    let targetFile = app.vault.getAbstractFileByPath(filePath) as TFile;
    
    if (!targetFile) {
      // Create the file if it doesn't exist
      const content = `# ${filePath.split('/').pop()?.replace('.md', '') || 'Tasks'}\n\n`;
      targetFile = await app.vault.create(filePath, content) as TFile;
    }
    
    // Read current content
    const currentContent = await app.vault.read(targetFile);
    const lines = currentContent.split('\n');
    
    let newContent = '';
    
    switch (operation) {
      case 'create':
        if (tasks && tasks.length > 0) {
          // Bulk create
          const taskLines = tasks.map(t => formatTaskToMarkdown(t));
          
          if (position === 'top') {
            newContent = taskLines.join('\n') + '\n\n' + currentContent;
          } else if (position === 'bottom') {
            newContent = currentContent + '\n\n' + taskLines.join('\n');
          } else if (typeof position === 'number') {
            const insertIndex = Math.min(position, lines.length);
            lines.splice(insertIndex, 0, ...taskLines);
            newContent = lines.join('\n');
          }
        } else if (task) {
          // Single task create
          const taskLine = formatTaskToMarkdown(task);
          
          if (position === 'top') {
            newContent = taskLine + '\n\n' + currentContent;
          } else if (position === 'bottom') {
            newContent = currentContent + '\n\n' + taskLine;
          } else if (typeof position === 'number') {
            const insertIndex = Math.min(position, lines.length);
            lines.splice(insertIndex, 0, taskLine);
            newContent = lines.join('\n');
          }
        }
        break;
        
             case 'update': {
         if (!options.taskId || !task) {
           throw new Error('taskId and task are required for update operation');
         }
         
         // Find and update the specific task
         let updated = false;
         for (let i = 0; i < lines.length; i++) {
           const parsedTask = parseTaskFromMarkdown(lines[i]);
           if (parsedTask && parsedTask.text.includes(options.taskId)) {
             lines[i] = formatTaskToMarkdown(task);
             updated = true;
             break;
           }
         }
         
         if (!updated) {
           throw new Error(`Task with ID ${options.taskId} not found`);
         }
         
         newContent = lines.join('\n');
         break;
       }
        
             case 'delete': {
         if (!options.taskId) {
           throw new Error('taskId is required for delete operation');
         }
         
         // Find and remove the specific task
         const filteredLines = lines.filter(line => {
           const parsedTask = parseTaskFromMarkdown(line);
           return !parsedTask || !parsedTask.text.includes(options.taskId!);
         });
         
         newContent = filteredLines.join('\n');
         break;
       }
        
      case 'toggle':
        if (!options.taskId) {
          throw new Error('taskId is required for toggle operation');
        }
        
        // Find and toggle the specific task
        for (let i = 0; i < lines.length; i++) {
          const parsedTask = parseTaskFromMarkdown(lines[i]);
          if (parsedTask && parsedTask.text.includes(options.taskId)) {
            const toggledTask = { ...parsedTask, completed: !parsedTask.completed };
            lines[i] = formatTaskToMarkdown(toggledTask);
            break;
          }
        }
        
        newContent = lines.join('\n');
        break;
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    // Write the updated content
    await app.vault.modify(targetFile, newContent);
    
    
    return {
      type: 'success',
      data: {
        operation,
        file: filePath,
        tasksProcessed: tasks?.length || (task ? 1 : 0)
      }
    };
    
  } catch (error) {
    console.error('[DATAVIEW DEBUG] Write error:', error);
    return {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export function declarations for Gemini
export const queryDataviewTasksFunction = {
  name: 'queryDataviewTasks',
  description: 'Query and retrieve tasks using Dataview plugin',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Custom Dataview query (optional if using filters)'
      },
      queryType: {
        type: 'string',
        enum: ['TASK', 'LIST', 'TABLE'],
        description: 'Type of Dataview query'
      },
      source: {
        type: 'string',
        description: 'Source file or folder to query'
      },
      filters: {
        type: 'object',
        properties: {
          completed: {
            type: 'boolean',
            description: 'Filter by completion status'
          },
          due: {
            oneOf: [
              {
                type: 'string',
                description: 'Filter by due date (YYYY-MM-DD or relative like "this week")'
              },
              {
                type: 'object',
                properties: {
                  start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                  end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                },
                description: 'Filter by due date range'
              }
            ],
            description: 'Filter by due date (single date or range)'
          },
          created: {
            oneOf: [
              {
                type: 'string',
                description: 'Filter by creation date (YYYY-MM-DD)'
              },
              {
                type: 'object',
                properties: {
                  start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                  end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                },
                description: 'Filter by creation date range'
              }
            ],
            description: 'Filter by creation date (single date or range)'
          },
          start: {
            oneOf: [
              {
                type: 'string',
                description: 'Filter by start date (YYYY-MM-DD)'
              },
              {
                type: 'object',
                properties: {
                  start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                  end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                },
                description: 'Filter by start date range'
              }
            ],
            description: 'Filter by start date (single date or range)'
          },
          scheduled: {
            oneOf: [
              {
                type: 'string',
                description: 'Filter by scheduled date (YYYY-MM-DD)'
              },
              {
                type: 'object',
                properties: {
                  start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                  end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                },
                description: 'Filter by scheduled date range'
              }
            ],
            description: 'Filter by scheduled date (single date or range)'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by tags'
          },
          project: {
            type: 'string',
            description: 'Filter by project metadata'
          },
          dateRange: {
            type: 'object',
            properties: {
              start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
              end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
            },
            description: 'Filter by general date range (affects created date)'
          }
        }
      },
      sort: {
        type: 'object',
        properties: {
          field: { type: 'string', description: 'Field to sort by' },
          order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' }
        }
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results'
      },
      format: {
        type: 'string',
        enum: ['json', 'text', 'markdown'],
        description: 'Output format'
      }
    }
  }
};

// Fallback task query function that doesn't rely on Dataview API
async function fallbackTaskQuery(app: App, options: QueryOptions): Promise<any> {
  try {
    
    const { filters, format = 'json' } = options;
    const allFiles = app.vault.getMarkdownFiles();
    const results: any[] = [];
    
    // Get global filter from Tasks plugin
    const globalFilter = await getObsidianTasksGlobalFilter(app);
    let globalFilterTags: string[] = [];
    let globalFilterCompleted: boolean | undefined = undefined;
    
    if (globalFilter) {
      // Extract tag filters from global filter
      const tagMatches = globalFilter.match(/#(\w+)/g);
      if (tagMatches) {
        globalFilterTags = tagMatches.map((tag: string) => tag.substring(1)); // Remove #
      }
      
      // Extract completion status from global filter
      if (globalFilter.includes('not done')) {
        globalFilterCompleted = false;
      } else if (globalFilter.includes('done')) {
        globalFilterCompleted = true;
      }
    }
    
    for (const file of allFiles) {
      const content = await app.vault.read(file);
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const task = parseTaskFromMarkdown(line);
        
        if (task) {
          // Apply filters
          let include = true;
          
          // Apply user-provided filters
          if (filters?.completed !== undefined && task.completed !== filters.completed) {
            include = false;
          }
          
          if (filters?.tags && filters.tags.length > 0) {
            const hasTag = filters.tags.some(tag => task.tags?.includes(tag));
            if (!hasTag) include = false;
          }
          
          if (filters?.project && task.metadata?.project !== filters.project) {
            include = false;
          }
          
          // Apply global filter from Tasks plugin
          if (globalFilterCompleted !== undefined && task.completed !== globalFilterCompleted) {
            include = false;
          }
          
          if (globalFilterTags.length > 0) {
            const hasGlobalTag = globalFilterTags.some(tag => task.tags?.includes(tag));
            if (!hasGlobalTag) {
              include = false;
            }
          }
          
          if (include) {
            results.push({
              task,
              file: file.path,
              line: i + 1
            });
          }
        }
      }
    }
    
    
    if (format === 'json') {
      return {
        type: 'success',
        data: {
          query: 'fallback',
          results,
          count: results.length
        }
      };
    } else if (format === 'text' || format === 'markdown') {
      const formattedResults = results.map(item => {
        return formatTaskToMarkdown(item.task);
      }).join('\n');
      
      return {
        type: 'success',
        data: {
          query: 'fallback',
          results: formattedResults,
          count: results.length
        }
      };
    }
    
    return {
      type: 'success',
      data: results
    };
    
  } catch (error) {
    console.error('[DATAVIEW DEBUG] Fallback query error:', error);
    return {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export const writeDataviewTasksFunction = {
  name: 'writeDataviewTasks',
  description: 'Create and update tasks in Obsidian files',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['create', 'update', 'delete', 'toggle'],
        description: 'Operation to perform'
      },
      file: {
        type: 'string',
        description: 'Target file path'
      },
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Task description' },
            completed: { type: 'boolean', description: 'Completion status' },
            due: {
              oneOf: [
                { type: 'string', description: 'Due date (YYYY-MM-DD)' },
                {
                  type: 'object',
                  properties: {
                    start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                    end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                  },
                  description: 'Due date range'
                }
              ],
              description: 'Due date (single date or range)'
            },
            created: {
              oneOf: [
                { type: 'string', description: 'Creation date (YYYY-MM-DD)' },
                {
                  type: 'object',
                  properties: {
                    start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                    end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                  },
                  description: 'Creation date range'
                }
              ],
              description: 'Creation date (single date or range)'
            },
            start: {
              oneOf: [
                { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                {
                  type: 'object',
                  properties: {
                    start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                    end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                  },
                  description: 'Start date range'
                }
              ],
              description: 'Start date (single date or range)'
            },
            scheduled: {
              oneOf: [
                { type: 'string', description: 'Scheduled date (YYYY-MM-DD)' },
                {
                  type: 'object',
                  properties: {
                    start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                    end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                  },
                  description: 'Scheduled date range'
                }
              ],
              description: 'Scheduled date (single date or range)'
            },
            priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Priority level' },
            project: { type: 'string', description: 'Project association' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
            metadata: { type: 'object', description: 'Custom metadata' }
          },
          required: ['text']
        },
        description: 'Task data for bulk operations'
      },
      task: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Task description' },
          completed: { type: 'boolean', description: 'Completion status' },
          due: {
            oneOf: [
              { type: 'string', description: 'Due date (YYYY-MM-DD)' },
              {
                type: 'object',
                properties: {
                  start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                  end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                },
                description: 'Due date range'
              }
            ],
            description: 'Due date (single date or range)'
          },
          created: {
            oneOf: [
              { type: 'string', description: 'Creation date (YYYY-MM-DD)' },
              {
                type: 'object',
                properties: {
                  start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                  end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                },
                description: 'Creation date range'
              }
            ],
            description: 'Creation date (single date or range)'
          },
          start: {
            oneOf: [
              { type: 'string', description: 'Start date (YYYY-MM-DD)' },
              {
                type: 'object',
                properties: {
                  start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                  end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                },
                description: 'Start date range'
              }
            ],
            description: 'Start date (single date or range)'
          },
          scheduled: {
            oneOf: [
              { type: 'string', description: 'Scheduled date (YYYY-MM-DD)' },
              {
                type: 'object',
                properties: {
                  start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                  end: { type: 'string', description: 'End date (YYYY-MM-DD)' }
                },
                description: 'Scheduled date range'
              }
            ],
            description: 'Scheduled date (single date or range)'
          },
          priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Priority level' },
          project: { type: 'string', description: 'Project association' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
          metadata: { type: 'object', description: 'Custom metadata' }
        },
        required: ['text'],
        description: 'Single task data'
      },
      taskId: {
        type: 'string',
        description: 'Task identifier for update/delete operations'
      },
      position: {
        type: 'string',
        enum: ['top', 'bottom'],
        description: 'Where to insert new tasks'
      },
      metadata: {
        type: 'object',
        description: 'Additional metadata'
      }
    },
    required: ['operation', 'file']
  }
}; 