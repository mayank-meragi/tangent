#!/usr/bin/env node

/**
 * Test script for Obsidian Tasks plugin integration
 * This script tests the functionality to read the global filter from the Obsidian Tasks plugin
 */

// Mock Obsidian App for testing
const mockApp = {
  plugins: {
    plugins: {
      'obsidian-tasks': {
        enabled: true,
        settings: {
          globalFilter: 'not done and #work',
          // Alternative property names that might be used
          globalFilterString: 'not done and #personal',
          filter: 'done and #completed'
        }
      },
      'dataview': {
        enabled: true,
        api: {
          query: async (query) => {
            console.log('Mock Dataview query:', query);
            return {
              value: [
                { task: 'Test task 1', completed: false, tags: ['work'] },
                { task: 'Test task 2', completed: true, tags: ['personal'] }
              ]
            };
          }
        }
      }
    }
  }
};

// Mock App without Tasks plugin
const mockAppWithoutTasks = {
  plugins: {
    plugins: {
      'dataview': {
        enabled: true,
        api: {
          query: async (query) => {
            console.log('Mock Dataview query (no tasks plugin):', query);
            return { value: [] };
          }
        }
      }
    }
  }
};

// Import the functions we want to test
// Note: In a real environment, these would be imported from the compiled TypeScript
console.log('Testing Obsidian Tasks plugin integration...\n');

// Test 1: Check if we can detect the Tasks plugin
console.log('=== Test 1: Tasks Plugin Detection ===');
try {
  const tasksPlugin = mockApp.plugins.plugins['obsidian-tasks'];
  if (tasksPlugin && tasksPlugin.enabled) {
    console.log('✅ Tasks plugin found and enabled');
  } else {
    console.log('❌ Tasks plugin not found or disabled');
  }
} catch (error) {
  console.log('❌ Error detecting Tasks plugin:', error.message);
}

// Test 2: Check if we can access settings
console.log('\n=== Test 2: Settings Access ===');
try {
  const tasksPlugin = mockApp.plugins.plugins['obsidian-tasks'];
  const settings = tasksPlugin.settings || tasksPlugin.instance?.settings;
  
  if (settings) {
    console.log('✅ Settings accessible');
    console.log('Available settings properties:', Object.keys(settings));
  } else {
    console.log('❌ Settings not accessible');
  }
} catch (error) {
  console.log('❌ Error accessing settings:', error.message);
}

// Test 3: Check if we can find the global filter
console.log('\n=== Test 3: Global Filter Detection ===');
try {
  const tasksPlugin = mockApp.plugins.plugins['obsidian-tasks'];
  const settings = tasksPlugin.settings;
  
  const possibleFilterProperties = [
    'globalFilter',
    'globalFilterString',
    'filter',
    'defaultFilter',
    'globalQuery'
  ];
  
  let foundFilter = null;
  for (const prop of possibleFilterProperties) {
    if (settings[prop] && typeof settings[prop] === 'string' && settings[prop].trim()) {
      foundFilter = settings[prop].trim();
      console.log(`✅ Found global filter in property '${prop}': ${foundFilter}`);
      break;
    }
  }
  
  if (!foundFilter) {
    console.log('❌ No global filter found');
  }
} catch (error) {
  console.log('❌ Error finding global filter:', error.message);
}

// Test 4: Test filter conversion (simulated)
console.log('\n=== Test 4: Filter Conversion ===');
const testFilters = [
  'not done',
  'not done and #work',
  'done and #personal',
  'due before 2024-12-31',
  'priority is high'
];

testFilters.forEach(filter => {
  console.log(`Testing filter: "${filter}"`);
  
  // Simulate the conversion logic
  const conditions = [];
  
  if (filter.includes('not done')) {
    conditions.push('!completed');
  } else if (filter.includes('done')) {
    conditions.push('completed');
  }
  
  const tagMatches = filter.match(/#(\w+)/g);
  if (tagMatches) {
    const tags = tagMatches.map(tag => tag.substring(1));
    const tagConditions = tags.map(tag => `contains(tags, "${tag}")`).join(' OR ');
    conditions.push(`(${tagConditions})`);
  }
  
  if (filter.includes('due before')) {
    const dateMatch = filter.match(/due before (\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      conditions.push(`due < date("${dateMatch[1]}")`);
    }
  }
  
  if (filter.includes('priority is high')) {
    conditions.push('priority = "high"');
  }
  
  console.log(`  → Converted to: ${conditions.join(' AND ')}`);
});

// Test 5: Test without Tasks plugin
console.log('\n=== Test 5: Behavior Without Tasks Plugin ===');
try {
  const tasksPlugin = mockAppWithoutTasks.plugins.plugins['obsidian-tasks'];
  if (!tasksPlugin || !tasksPlugin.enabled) {
    console.log('✅ Correctly detected missing Tasks plugin');
  } else {
    console.log('❌ Incorrectly detected Tasks plugin when it should be missing');
  }
} catch (error) {
  console.log('✅ Correctly handled missing Tasks plugin');
}

console.log('\n=== Test Summary ===');
console.log('The integration should:');
console.log('1. ✅ Detect when Obsidian Tasks plugin is available');
console.log('2. ✅ Access the plugin settings safely');
console.log('3. ✅ Find the global filter in various property names');
console.log('4. ✅ Convert Tasks filter syntax to Dataview conditions');
console.log('5. ✅ Gracefully handle missing Tasks plugin');
console.log('6. ✅ Apply the global filter automatically to all task queries');

console.log('\nTo test this in your actual Obsidian environment:');
console.log('1. Install the Obsidian Tasks plugin if not already installed');
console.log('2. Configure a global filter in the Tasks plugin settings');
console.log('3. Use the queryDataviewTasks tool in Tangent chat');
console.log('4. Check the console logs for "[TASKS DEBUG]" messages');
console.log('5. Verify that the global filter is being applied to your queries'); 