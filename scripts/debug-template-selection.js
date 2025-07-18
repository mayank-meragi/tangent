#!/usr/bin/env node

/**
 * Debug script for template selection issue
 * Helps identify the "I is not iterable" error
 */

console.log('🔍 Debugging Template Selection Issue...\n');

// Test 1: Mock template structure
console.log('1. Testing template structure...');
try {
  const mockTemplate = {
    id: 'test-template',
    title: 'Test Template',
    content: 'This is a test template with {{variable}}.',
    variables: [
      {
        name: 'variable',
        type: 'string',
        default: 'default value',
        description: 'A test variable'
      }
    ]
  };

  console.log('✅ Mock template structure is valid');
  console.log('   - ID:', mockTemplate.id);
  console.log('   - Title:', mockTemplate.title);
  console.log('   - Content length:', mockTemplate.content.length);
  console.log('   - Variables count:', mockTemplate.variables.length);
  console.log('   - Variables type:', Array.isArray(mockTemplate.variables) ? 'Array' : typeof mockTemplate.variables);
} catch (error) {
  console.error('❌ Error with mock template structure:', error);
}

// Test 2: Test variable replacement with edge cases
console.log('\n2. Testing variable replacement edge cases...');
try {
  const testCases = [
    {
      name: 'Normal variables',
      content: 'Hello {{name}}, how are you?',
      variables: [{ name: 'name', default: 'World' }],
      expected: 'Hello World, how are you?'
    },
    {
      name: 'No variables',
      content: 'Hello world',
      variables: [],
      expected: 'Hello world'
    },
    {
      name: 'Undefined variables',
      content: 'Hello {{name}}',
      variables: undefined,
      expected: 'Hello {{name}}'
    },
    {
      name: 'Null variables',
      content: 'Hello {{name}}',
      variables: null,
      expected: 'Hello {{name}}'
    },
    {
      name: 'Invalid variables (not array)',
      content: 'Hello {{name}}',
      variables: 'not an array',
      expected: 'Hello {{name}}'
    },
    {
      name: 'Invalid variable object',
      content: 'Hello {{name}}',
      variables: [{ invalid: 'object' }],
      expected: 'Hello {{name}}'
    }
  ];

  const replaceTemplateVariables = (content, variables = []) => {
    let processedContent = content;
    
    // Ensure variables is an array and handle undefined/null cases
    if (!variables || !Array.isArray(variables)) {
      console.log('   ⚠️  Variables is not an array:', variables);
      return processedContent;
    }
    
    // Replace variables with their default values or prompt for user input
    for (const variable of variables) {
      if (!variable || typeof variable !== 'object' || !variable.name) {
        console.log('   ⚠️  Invalid variable in template:', variable);
        continue;
      }
      
      const placeholder = `{{${variable.name}}}`;
      if (processedContent.includes(placeholder)) {
        const defaultValue = variable.default !== undefined ? String(variable.default) : '';
        const replacement = defaultValue || `[${variable.description || variable.name}]`;
        processedContent = processedContent.replace(new RegExp(placeholder, 'g'), replacement);
      }
    }
    
    return processedContent;
  };

  for (const testCase of testCases) {
    try {
      const result = replaceTemplateVariables(testCase.content, testCase.variables);
      const passed = result === testCase.expected;
      console.log(`   ${passed ? '✅' : '❌'} ${testCase.name}: ${passed ? 'PASSED' : 'FAILED'}`);
      if (!passed) {
        console.log(`     Expected: "${testCase.expected}"`);
        console.log(`     Got: "${result}"`);
      }
    } catch (error) {
      console.log(`   ❌ ${testCase.name}: ERROR - ${error.message}`);
    }
  }
} catch (error) {
  console.error('❌ Error testing variable replacement:', error);
}

// Test 3: Test dropdown item structure
console.log('\n3. Testing dropdown item structure...');
try {
  const mockDropdownItem = {
    id: 'test-item',
    title: 'Test Item',
    description: 'Test description',
    category: 'test',
    icon: 'message-square',
    metadata: {
      template: {
        id: 'test-template',
        title: 'Test Template',
        content: 'Test content',
        variables: []
      }
    }
  };

  console.log('✅ Dropdown item structure is valid');
  console.log('   - Has metadata:', !!mockDropdownItem.metadata);
  console.log('   - Has template in metadata:', !!mockDropdownItem.metadata.template);
  console.log('   - Template has content:', !!mockDropdownItem.metadata.template.content);
  console.log('   - Template has variables:', Array.isArray(mockDropdownItem.metadata.template.variables));
} catch (error) {
  console.error('❌ Error with dropdown item structure:', error);
}

// Test 4: Common causes of "I is not iterable" error
console.log('\n4. Common causes of "I is not iterable" error...');
console.log('✅ Potential issues to check:');
console.log('   - template.variables is undefined or null');
console.log('   - template.variables is not an array');
console.log('   - template object is malformed');
console.log('   - template.content is undefined');
console.log('   - dropdown item metadata is missing');
console.log('   - dropdown item metadata.template is missing');

console.log('\n🔧 Debugging steps:');
console.log('1. Check browser console for detailed error logs');
console.log('2. Look for "Template variables is not an array" warnings');
console.log('3. Check "Processing template" logs for template structure');
console.log('4. Check "Template dropdown selection" logs for item structure');
console.log('5. Verify template service is returning valid templates');
console.log('6. Check if template files have valid frontmatter');

console.log('\n📋 Manual debugging checklist:');
console.log('1. Open Obsidian and reload the plugin');
console.log('2. Open browser console (F12)');
console.log('3. Type "/" in chat input to trigger template dropdown');
console.log('4. Check console for template loading logs');
console.log('5. Select a template and check for error logs');
console.log('6. Look for "Template variables is not an array" warnings');
console.log('7. Check if template content is being processed correctly');
console.log('8. Verify template variables are being replaced');

console.log('\n🎯 Expected console output:');
console.log('✅ "Fetching templates from service..."');
console.log('✅ "Raw templates from service: [...]"');
console.log('✅ "Processing template: {...}" for each template');
console.log('✅ "Created dropdown items: [...]"');
console.log('✅ "Template dropdown selection: {...}" when selecting');
console.log('✅ "Found template item: {...}"');
console.log('✅ "Extracted template: {...}"');
console.log('✅ "Processing template: {...}"');
console.log('✅ "Template used: ..."'); 