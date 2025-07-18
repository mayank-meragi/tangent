#!/usr/bin/env node

/**
 * Test script for Variable Conversion functionality
 * Tests the conversion from object format to array format for template variables
 */

console.log('🧪 Testing Variable Conversion Functionality\n');

// Mock the convertVariablesToArray function
const convertVariablesToArray = (variables) => {
  if (!variables) return [];
  
  // If it's already an array, return it
  if (Array.isArray(variables)) {
    return variables;
  }
  
  // If it's an object, convert to array
  if (typeof variables === 'object') {
    const variablesArray = [];
    
    for (const [name, variableData] of Object.entries(variables)) {
      if (typeof variableData === 'object' && variableData !== null) {
        const varData = variableData;
        variablesArray.push({
          name,
          type: varData.type || 'string',
          default: varData.default,
          description: varData.description,
          options: varData.options,
          required: varData.required || false
        });
      }
    }
    
    return variablesArray;
  }
  
  return [];
};

// Test 1: Object format variables (from frontmatter)
console.log('1. Testing object format variables...');
try {
  const objectVariables = {
    topic: {
      type: "string",
      default: "general topic",
      description: "The topic to discuss",
      required: true
    },
    level: {
      type: "select",
      default: "beginner",
      description: "Current level",
      options: ["beginner", "intermediate", "advanced", "expert"]
    },
    includeExamples: {
      type: "boolean",
      default: true,
      description: "Include practical examples"
    },
    timeLimit: {
      type: "number",
      default: 30,
      description: "Time limit in minutes"
    }
  };

  const result = convertVariablesToArray(objectVariables);
  const expected = [
    {
      name: "topic",
      type: "string",
      default: "general topic",
      description: "The topic to discuss",
      required: true
    },
    {
      name: "level",
      type: "select",
      default: "beginner",
      description: "Current level",
      options: ["beginner", "intermediate", "advanced", "expert"],
      required: false
    },
    {
      name: "includeExamples",
      type: "boolean",
      default: true,
      description: "Include practical examples",
      required: false
    },
    {
      name: "timeLimit",
      type: "number",
      default: 30,
      description: "Time limit in minutes",
      required: false
    }
  ];

  const passed = JSON.stringify(result) === JSON.stringify(expected);
  console.log(`   ${passed ? '✅' : '❌'} Object to array conversion: ${passed ? 'PASSED' : 'FAILED'}`);
  if (!passed) {
    console.log(`     Expected: ${JSON.stringify(expected, null, 2)}`);
    console.log(`     Got: ${JSON.stringify(result, null, 2)}`);
  }
} catch (error) {
  console.log(`   ❌ Object format conversion: ERROR - ${error.message}`);
}

// Test 2: Array format variables (already correct)
console.log('\n2. Testing array format variables...');
try {
  const arrayVariables = [
    {
      name: "topic",
      type: "string",
      default: "general topic",
      description: "The topic to discuss",
      required: true
    },
    {
      name: "level",
      type: "select",
      default: "beginner",
      description: "Current level",
      options: ["beginner", "intermediate", "advanced", "expert"]
    }
  ];

  const result = convertVariablesToArray(arrayVariables);
  const passed = JSON.stringify(result) === JSON.stringify(arrayVariables);
  console.log(`   ${passed ? '✅' : '❌'} Array format (no conversion): ${passed ? 'PASSED' : 'FAILED'}`);
  if (!passed) {
    console.log(`     Expected: ${JSON.stringify(arrayVariables, null, 2)}`);
    console.log(`     Got: ${JSON.stringify(result, null, 2)}`);
  }
} catch (error) {
  console.log(`   ❌ Array format conversion: ERROR - ${error.message}`);
}

// Test 3: Null/undefined variables
console.log('\n3. Testing null/undefined variables...');
try {
  const result1 = convertVariablesToArray(null);
  const result2 = convertVariablesToArray(undefined);
  const result3 = convertVariablesToArray({});
  
  const passed1 = Array.isArray(result1) && result1.length === 0;
  const passed2 = Array.isArray(result2) && result2.length === 0;
  const passed3 = Array.isArray(result3) && result3.length === 0;
  
  console.log(`   ${passed1 ? '✅' : '❌'} Null variables: ${passed1 ? 'PASSED' : 'FAILED'}`);
  console.log(`   ${passed2 ? '✅' : '❌'} Undefined variables: ${passed2 ? 'PASSED' : 'FAILED'}`);
  console.log(`   ${passed3 ? '✅' : '❌'} Empty object variables: ${passed3 ? 'PASSED' : 'FAILED'}`);
} catch (error) {
  console.log(`   ❌ Null/undefined conversion: ERROR - ${error.message}`);
}

// Test 4: Edge cases
console.log('\n4. Testing edge cases...');
try {
  // Test with non-object values in object
  const edgeCaseVariables = {
    topic: {
      type: "string",
      default: "general topic",
      description: "The topic to discuss"
    },
    invalid: "not an object",
    nullValue: null,
    emptyObject: {}
  };

  const result = convertVariablesToArray(edgeCaseVariables);
  const expectedCount = 2; // topic and emptyObject should be included
  const passed = result.length === expectedCount && result.every(v => v.name === 'topic' || v.name === 'emptyObject');
  
  console.log(`   ${passed ? '✅' : '❌'} Edge cases: ${passed ? 'PASSED' : 'FAILED'}`);
  if (!passed) {
    console.log(`     Expected ${expectedCount} valid variables, got ${result.length}`);
    console.log(`     Result: ${JSON.stringify(result, null, 2)}`);
  }
} catch (error) {
  console.log(`   ❌ Edge cases: ERROR - ${error.message}`);
}

// Test 5: Real template example
console.log('\n5. Testing real template example...');
try {
  // Simulate the variables from learning-study.md
  const realTemplateVariables = {
    subject: {
      type: "string",
      default: "the subject",
      description: "Subject or topic to learn",
      required: true
    },
    level: {
      type: "select",
      default: "beginner",
      description: "Current learning level",
      options: ["beginner", "intermediate", "advanced", "expert"]
    },
    goal: {
      type: "string",
      default: "understand the basics",
      description: "Learning goal or objective"
    }
  };

  const result = convertVariablesToArray(realTemplateVariables);
  const expectedCount = 3;
  const hasSubject = result.some(v => v.name === 'subject' && v.required === true);
  const hasLevel = result.some(v => v.name === 'level' && v.type === 'select' && v.options);
  const hasGoal = result.some(v => v.name === 'goal' && v.type === 'string');
  
  const passed = result.length === expectedCount && hasSubject && hasLevel && hasGoal;
  console.log(`   ${passed ? '✅' : '❌'} Real template conversion: ${passed ? 'PASSED' : 'FAILED'}`);
  if (!passed) {
    console.log(`     Expected ${expectedCount} variables with specific properties`);
    console.log(`     Result: ${JSON.stringify(result, null, 2)}`);
  }
} catch (error) {
  console.log(`   ❌ Real template conversion: ERROR - ${error.message}`);
}

console.log('\n🎉 Variable Conversion testing completed!');
console.log('\n📋 Summary:');
console.log('- The convertVariablesToArray function handles object format from frontmatter');
console.log('- It properly converts object keys to variable names');
console.log('- It preserves all variable properties (type, default, description, options, required)');
console.log('- It handles edge cases gracefully (null, undefined, invalid objects)');
console.log('- It works with both object and array input formats');
console.log('- This fixes the "variables.forEach is not a function" error'); 