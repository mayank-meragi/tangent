#!/usr/bin/env node

/**
 * Test script for task filtering with specific scenario
 * Tests the filtering of tasks with #task tag vs tasks without it
 */

// Mock tasks data matching the user's scenario
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
  }
];

// Mock global filter
const globalFilter = '#task';

console.log('Testing task filtering with specific scenario...\n');

console.log('=== Test Data ===');
console.log('Global filter:', globalFilter);
console.log('Tasks:');
mockTasks.forEach((task, index) => {
  console.log(`  ${index + 1}. "${task.text}" - Tags: [${task.tags.join(', ')}] - Completed: ${task.completed}`);
});

console.log('\n=== Filter Conversion Test ===');

// Simulate the filter conversion logic
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
      const tags = tagMatches.map(tag => tag.substring(1)); // Remove #
      const tagConditions = tags.map(tag => `contains(tags, "${tag}")`).join(' OR ');
      conditions.push(`(${tagConditions})`);
      console.log(`[TASKS DEBUG] Tag filter conditions: ${tagConditions}`);
      console.log(`[TASKS DEBUG] Looking for tags: [${tags.join(', ')}]`);
    }
    
    // Handle completion status
    if (filter.includes('not done')) {
      conditions.push('!completed');
    } else if (filter.includes('done')) {
      conditions.push('completed');
    }
    
  } catch (error) {
    console.error('[TASKS DEBUG] Error converting Tasks filter:', error);
  }
  
  return conditions;
}

const conditions = convertTasksFilterToDataviewConditions(globalFilter);
console.log('Generated conditions:', conditions);

console.log('\n=== Task Filtering Test ===');

// Simulate the fallback filtering logic
function applyGlobalFilter(tasks, globalFilter) {
  const globalFilterTags = [];
  let globalFilterCompleted = undefined;
  
  if (globalFilter) {
    // Extract tag filters from global filter
    const tagMatches = globalFilter.match(/#(\w+)/g);
    if (tagMatches) {
      globalFilterTags.push(...tagMatches.map(tag => tag.substring(1)));
    }
    
    // Extract completion status from global filter
    if (globalFilter.includes('not done')) {
      globalFilterCompleted = false;
    } else if (globalFilter.includes('done')) {
      globalFilterCompleted = true;
    }
  }
  
  console.log(`[TASKS DEBUG] Global filter tags: [${globalFilterTags.join(', ')}]`);
  console.log(`[TASKS DEBUG] Global filter completed: ${globalFilterCompleted}`);
  
  return tasks.filter(task => {
    let include = true;
    
    // Apply completion filter
    if (globalFilterCompleted !== undefined && task.completed !== globalFilterCompleted) {
      console.log(`  Task "${task.text}" excluded: completion status mismatch (${task.completed} vs ${globalFilterCompleted})`);
      include = false;
    }
    
    // Apply tag filter
    if (globalFilterTags.length > 0) {
      const hasGlobalTag = globalFilterTags.some(tag => task.tags.includes(tag));
      if (!hasGlobalTag) {
        console.log(`  Task "${task.text}" excluded: missing required tags [${globalFilterTags.join(', ')}] (has: [${task.tags.join(', ')}])`);
        include = false;
      } else {
        console.log(`  Task "${task.text}" included: has required tags [${globalFilterTags.join(', ')}]`);
      }
    }
    
    return include;
  });
}

const filteredTasks = applyGlobalFilter(mockTasks, globalFilter);

console.log('\n=== Results ===');
console.log(`Original tasks: ${mockTasks.length}`);
console.log(`Filtered tasks: ${filteredTasks.length}`);

if (filteredTasks.length > 0) {
  console.log('Included tasks:');
  filteredTasks.forEach((task, index) => {
    console.log(`  ${index + 1}. "${task.text}" - Tags: [${task.tags.join(', ')}]`);
  });
} else {
  console.log('No tasks matched the filter');
}

console.log('\n=== Expected vs Actual ===');
console.log('Expected: Only the first task (with #task tag) should be included');
console.log('Actual: ', filteredTasks.length === 1 && filteredTasks[0].text === 'this is a task' ? '✅ Correct' : '❌ Incorrect');

console.log('\n=== Debugging Info ===');
console.log('If the filtering is not working correctly, check:');
console.log('1. Tag extraction from global filter');
console.log('2. Tag matching logic in the fallback function');
console.log('3. Dataview query generation for the main function');
console.log('4. Console logs for [TASKS DEBUG] messages');

// Test with different filter variations
console.log('\n=== Additional Filter Tests ===');

const testFilters = [
  '#task',
  'not done and #task',
  '#task and not done',
  'done and #task'
];

testFilters.forEach(filter => {
  console.log(`\nTesting filter: "${filter}"`);
  const testConditions = convertTasksFilterToDataviewConditions(filter);
  const testFiltered = applyGlobalFilter(mockTasks, filter);
  console.log(`  Conditions: ${testConditions.join(' AND ')}`);
  console.log(`  Results: ${testFiltered.length} tasks`);
}); 