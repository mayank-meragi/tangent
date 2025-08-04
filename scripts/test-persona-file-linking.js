// Simple test for persona file linking functionality
console.log('=== Testing Persona File Linking ===\n');

// Test 1: File link parsing
function testFileLinkParsing() {
  console.log('1. Testing file link parsing...');
  
  const content = `
You are my personal dietician. Your job is to help me consistently lose fat while gaining lean muscle.

### Core Responsibilities

1. **Daily Food Intake Analysis**
   * Analyze my daily food intake logged in [[test-diet-log.md]]
   * Compare with targets in [[nutrition-goals.md]]
   * Track patterns using [[meal-history.md]]

2. **Target Comparison**
   * Compare my intake with my daily target from [[nutrition-goals.md|my nutrition goals]]:
`;

  // Test the regex pattern
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const linkContent = match[1];
    
    const separatorIndex = linkContent.indexOf('|');
    let filePath, displayText;

    if (separatorIndex !== -1) {
      filePath = linkContent.substring(0, separatorIndex).trim();
      displayText = linkContent.substring(separatorIndex + 1).trim();
    } else {
      filePath = linkContent.trim();
    }

    if (!filePath.startsWith('#') && !filePath.startsWith('^')) {
      if (!filePath.endsWith('.md')) {
        filePath += '.md';
      }

      links.push({
        originalText: fullMatch,
        filePath: filePath,
        displayText: displayText,
        exists: false
      });
    }
  }

  console.log('Found links:', links);
  
  // Expected results
  const expected = [
    { originalText: '[[test-diet-log.md]]', filePath: 'test-diet-log.md', displayText: undefined, exists: false },
    { originalText: '[[nutrition-goals.md]]', filePath: 'nutrition-goals.md', displayText: undefined, exists: false },
    { originalText: '[[meal-history.md]]', filePath: 'meal-history.md', displayText: undefined, exists: false },
    { originalText: '[[nutrition-goals.md|my nutrition goals]]', filePath: 'nutrition-goals.md', displayText: 'my nutrition goals', exists: false }
  ];

  console.log('Expected:', expected);
  console.log('Test passed:', JSON.stringify(links) === JSON.stringify(expected));
  console.log('');
}

// Test 2: System prompt generation
function testSystemPromptGeneration() {
  console.log('2. Testing system prompt generation...');
  
  const persona = {
    id: 'dietician',
    name: 'Dietician',
    description: 'Personal dietician',
    content: 'Analyze my daily food intake logged in [[test-diet-log.md]]',
    color: '#10B981',
    author: 'system',
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
    fileContext: `
--- test-diet-log.md ---
# Diet Log

## 2024-01-15
- BF: Oatmeal with berries (300 kcal, 12g protein)
- Lunch: Chicken salad (450 kcal, 35g protein)
- Dinner: Salmon with quinoa (550 kcal, 45g protein)
- Total: 1300 kcal, 92g protein
- Notes: Good day, need more protein
`
  };

  // Mock createSystemPrompt function
  const createSystemPrompt = (persona) => {
    const basePrompt = 'You are an AI assistant whose job is to help the user with their questions.';
    
    if (persona) {
      let enhancedPrompt = `${basePrompt}

# Active Persona: ${persona.name}
${persona.content}`;

      // Add file context if available
      if (persona.fileContext) {
        enhancedPrompt += `

# Linked Files Context
The following files are linked to this persona and provide additional context:

${persona.fileContext}`;
      }

      return enhancedPrompt;
    }

    return basePrompt;
  };

  const systemPrompt = createSystemPrompt(persona);
  
  console.log('Generated system prompt:');
  console.log(systemPrompt);
  console.log('');
  console.log('File context included:', systemPrompt.includes('test-diet-log.md'));
  console.log('File content included:', systemPrompt.includes('Oatmeal with berries'));
  console.log('');
}

// Run tests
testFileLinkParsing();
testSystemPromptGeneration();

console.log('=== Tests Complete ==='); 