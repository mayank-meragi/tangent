#!/usr/bin/env node

/**
 * Comprehensive debugging script for task filtering issues
 * This will help us understand exactly what's happening in the user's environment
 */

console.log('🔍 TASK FILTERING DEBUG SCRIPT');
console.log('================================\n');

// Step 1: Check if we can access the Tasks plugin
console.log('STEP 1: Checking Tasks Plugin Access');
console.log('-------------------------------------');

// Mock different scenarios to test
const testScenarios = [
  {
    name: 'Tasks plugin with globalFilter property',
    plugins: {
      'obsidian-tasks': {
        enabled: true,
        settings: {
          globalFilter: '#task'
        }
      }
    }
  },
  {
    name: 'Tasks plugin with globalFilterString property',
    plugins: {
      'obsidian-tasks': {
        enabled: true,
        settings: {
          globalFilterString: '#task'
        }
      }
    }
  },
  {
    name: 'Tasks plugin with filter property',
    plugins: {
      'obsidian-tasks': {
        enabled: true,
        settings: {
          filter: '#task'
        }
      }
    }
  },
  {
    name: 'Tasks plugin disabled',
    plugins: {
      'obsidian-tasks': {
        enabled: false,
        settings: {
          globalFilter: '#task'
        }
      }
    }
  },
  {
    name: 'No Tasks plugin',
    plugins: {}
  }
];

testScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. Testing: ${scenario.name}`);
  
  const mockApp = {
    plugins: {
      plugins: scenario.plugins
    }
  };
  
  // Simulate the getObsidianTasksGlobalFilter function
  function getObsidianTasksGlobalFilter(app) {
    try {
      const tasksPlugin = app.plugins.plugins['obsidian-tasks'];
      
      if (!tasksPlugin || !tasksPlugin.enabled) {
        console.log('  ❌ Tasks plugin not found or disabled');
        return null;
      }
      
      const settings = tasksPlugin.settings || tasksPlugin.instance?.settings;
      
      if (!settings) {
        console.log('  ❌ Could not access Tasks plugin settings');
        return null;
      }
      
      const possibleFilterProperties = [
        'globalFilter',
        'globalFilterString',
        'filter',
        'defaultFilter',
        'globalQuery'
      ];
      
      for (const prop of possibleFilterProperties) {
        if (settings[prop] && typeof settings[prop] === 'string' && settings[prop].trim()) {
          console.log(`  ✅ Found global filter in property '${prop}': ${settings[prop]}`);
          return settings[prop].trim();
        }
      }
      
      console.log('  ❌ No global filter found in Tasks plugin settings');
      console.log('  Available properties:', Object.keys(settings));
      return null;
      
    } catch (error) {
      console.log('  ❌ Error accessing Tasks plugin:', error.message);
      return null;
    }
  }
  
  const result = getObsidianTasksGlobalFilter(mockApp);
  console.log(`  Result: ${result || 'null'}`);
});

// Step 2: Test filter conversion
console.log('\n\nSTEP 2: Testing Filter Conversion');
console.log('----------------------------------');

const testFilters = [
  '#task',
  'not done and #task',
  '#task and not done',
  'done and #task',
  'path includes "Projects" and #task'
];

function convertTasksFilterToDataviewConditions(globalFilter) {
  const conditions = [];
  
  if (!globalFilter || !globalFilter.trim()) {
    return conditions;
  }
  
  try {
    const filter = globalFilter.trim();
    
    // Handle tag filters
    const tagMatches = filter.match(/#(\w+)/g);
    if (tagMatches) {
      const tags = tagMatches.map(tag => tag.substring(1));
      const tagConditions = tags.map(tag => `contains(tags, "${tag}")`).join(' OR ');
      conditions.push(`(${tagConditions})`);
      console.log(`  Tags found: [${tags.join(', ')}]`);
      console.log(`  Tag conditions: ${tagConditions}`);
    }
    
    // Handle completion status
    if (filter.includes('not done')) {
      conditions.push('!completed');
      console.log('  Completion filter: !completed');
    } else if (filter.includes('done')) {
      conditions.push('completed');
      console.log('  Completion filter: completed');
    }
    
    // Handle path filters
    const pathMatches = filter.match(/path includes "([^"]+)"/);
    if (pathMatches) {
      conditions.push(`file.path =~ "${pathMatches[1]}"`);
      console.log(`  Path filter: file.path =~ "${pathMatches[1]}"`);
    }
    
  } catch (error) {
    console.log('  ❌ Error converting filter:', error.message);
  }
  
  return conditions;
}

testFilters.forEach(filter => {
  console.log(`\nTesting filter: "${filter}"`);
  const conditions = convertTasksFilterToDataviewConditions(filter);
  console.log(`  Final conditions: [${conditions.join(', ')}]`);
});

// Step 3: Test task parsing
console.log('\n\nSTEP 3: Testing Task Parsing');
console.log('----------------------------');

const testTasks = [
  '- [ ] #task this is a task 📅 2025-07-14',
  '- [ ] this is not a task 📅 2025-07-14',
  '- [x] #task completed task 📅 2025-07-14',
  '- [ ] #work #task multiple tags 📅 2025-07-14'
];

function parseTaskFromMarkdown(line) {
  const taskRegex = /^(\s*)- \[([ xX])\] (.+)$/;
  const match = line.match(taskRegex);
  
  if (!match) return null;
  
  const [, , status, text] = match;
  const completed = status.toLowerCase() === 'x';
  
  const metadata = {};
  const tags = [];
  
  // Extract tags
  const tagRegex = /#(\w+)/g;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(text)) !== null) {
    tags.push(tagMatch[1]);
  }
  
  // Extract emoji shorthands
  const dueMatch = text.match(/🗓️(\d{4}-\d{2}-\d{2})/);
  if (dueMatch) metadata.due = dueMatch[1];
  
  // Clean text from metadata
  const cleanText = text
    .replace(/🗓️\d{4}-\d{2}-\d{2}/g, '')
    .replace(/#\w+/g, '')
    .trim();
  
  return {
    text: cleanText,
    completed,
    tags,
    ...metadata
  };
}

testTasks.forEach((taskLine, index) => {
  console.log(`\nTask ${index + 1}: "${taskLine}"`);
  const task = parseTaskFromMarkdown(taskLine);
  if (task) {
    console.log(`  Parsed: text="${task.text}", completed=${task.completed}, tags=[${task.tags.join(', ')}], due=${task.due || 'none'}`);
  } else {
    console.log('  ❌ Failed to parse task');
  }
});

// Step 4: Test complete filtering workflow
console.log('\n\nSTEP 4: Testing Complete Filtering Workflow');
console.log('-------------------------------------------');

const mockTasks = [
  {
    text: 'this is a task',
    completed: false,
    tags: ['task'],
    due: '2025-07-14'
  },
  {
    text: 'this is not a task',
    completed: false,
    tags: [],
    due: '2025-07-14'
  },
  {
    text: 'completed task',
    completed: true,
    tags: ['task'],
    due: '2025-07-14'
  }
];

function testCompleteWorkflow(globalFilter, tasks) {
  console.log(`\nTesting with global filter: "${globalFilter}"`);
  
  // Step 1: Get global filter
  const filter = globalFilter;
  console.log(`  1. Global filter: ${filter}`);
  
  // Step 2: Convert to conditions
  const conditions = convertTasksFilterToDataviewConditions(filter);
  console.log(`  2. Dataview conditions: [${conditions.join(', ')}]`);
  
  // Step 3: Apply filtering
  const globalFilterTags = [];
  let globalFilterCompleted = undefined;
  
  if (filter) {
    const tagMatches = filter.match(/#(\w+)/g);
    if (tagMatches) {
      globalFilterTags.push(...tagMatches.map(tag => tag.substring(1)));
    }
    
    if (filter.includes('not done')) {
      globalFilterCompleted = false;
    } else if (filter.includes('done')) {
      globalFilterCompleted = true;
    }
  }
  
  console.log(`  3. Extracted filters: tags=[${globalFilterTags.join(', ')}], completed=${globalFilterCompleted}`);
  
  const filteredTasks = tasks.filter(task => {
    let include = true;
    
    if (globalFilterCompleted !== undefined && task.completed !== globalFilterCompleted) {
      console.log(`    ❌ Task "${task.text}" excluded: completion mismatch`);
      include = false;
    }
    
    if (globalFilterTags.length > 0) {
      const hasGlobalTag = globalFilterTags.some(tag => task.tags.includes(tag));
      if (!hasGlobalTag) {
        console.log(`    ❌ Task "${task.text}" excluded: missing tags [${globalFilterTags.join(', ')}]`);
        include = false;
      } else {
        console.log(`    ✅ Task "${task.text}" included: has tags [${globalFilterTags.join(', ')}]`);
      }
    }
    
    return include;
  });
  
  console.log(`  4. Results: ${filteredTasks.length}/${tasks.length} tasks included`);
  filteredTasks.forEach((task, index) => {
    console.log(`     ${index + 1}. "${task.text}" - Tags: [${task.tags.join(', ')}]`);
  });
  
  return filteredTasks;
}

const testWorkflows = [
  '#task',
  'not done and #task',
  'done and #task'
];

testWorkflows.forEach(filter => {
  testCompleteWorkflow(filter, mockTasks);
});

console.log('\n\n🔍 DEBUGGING COMPLETE');
console.log('====================');
console.log('\nNext steps:');
console.log('1. Check the console logs in your Obsidian environment');
console.log('2. Look for [TASKS DEBUG] messages');
console.log('3. Verify which path is being taken (Dataview API vs fallback)');
console.log('4. Check if the global filter is being detected correctly');
console.log('5. Verify that the filtering logic is being applied'); 