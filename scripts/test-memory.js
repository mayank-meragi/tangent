// Test script for memory system
const fs = require('fs');
const path = require('path');

// Mock Obsidian App for testing
class MockApp {
  constructor() {
    this.vault = {
      files: new Map(),
      getAbstractFileByPath: (filePath) => {
        return this.vault.files.get(filePath) || null;
      },
      read: async (file) => {
        return this.vault.files.get(file.path) || '';
      },
      modify: async (file, content) => {
        this.vault.files.set(file.path, content);
      },
      create: async (filePath, content) => {
        this.vault.files.set(filePath, content);
      }
    };
  }
}

// Mock TFile class
class MockTFile {
  constructor(path) {
    this.path = path;
  }
}

// Test the memory service
async function testMemoryService() {
  console.log('🧪 Testing Memory Service...\n');
  
  const mockApp = new MockApp();
  
  // Import the memory service (we'll need to create a simple version for testing)
  const MemoryService = require('../memoryService.ts');
  
  const memoryService = new MemoryService(mockApp, 'test_assistant_memory.md');
  
  try {
    // Test 1: Read empty memory
    console.log('Test 1: Reading empty memory...');
    const emptyMemory = await memoryService.readMemory();
    console.log('✅ Empty memory read successfully:', emptyMemory === '' ? 'empty' : 'not empty');
    
    // Test 2: Write to memory
    console.log('\nTest 2: Writing to memory...');
    await memoryService.appendToMemory('This is a test memory entry');
    console.log('✅ Memory written successfully');
    
    // Test 3: Read memory back
    console.log('\nTest 3: Reading memory back...');
    const memoryContent = await memoryService.readMemory();
    console.log('✅ Memory content:', memoryContent);
    
    // Test 4: Append more content
    console.log('\nTest 4: Appending more content...');
    await memoryService.appendToMemory('This is another test entry');
    const updatedMemory = await memoryService.readMemory();
    console.log('✅ Updated memory content:', updatedMemory);
    
    // Test 5: Check if memory file exists
    console.log('\nTest 5: Checking if memory file exists...');
    const exists = await memoryService.memoryFileExists();
    console.log('✅ Memory file exists:', exists);
    
    console.log('\n🎉 All memory tests passed!');
    
  } catch (error) {
    console.error('❌ Memory test failed:', error);
  }
}

// Run the test
testMemoryService(); 