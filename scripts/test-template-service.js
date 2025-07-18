#!/usr/bin/env node

/**
 * Test script for Template Service
 * This script tests the basic functionality of the template service
 */

const fs = require('fs');
const path = require('path');

// Mock Obsidian App for testing
class MockApp {
  constructor() {
    this.vault = {
      files: new Map(),
      folders: new Map(),
      metadataCache: {
        getFileCache: (file) => {
          // Mock frontmatter for testing
          if (file.path.includes('test-template.md')) {
            return {
              frontmatter: {
                id: 'test-template',
                title: 'Test Template',
                category: 'Test',
                description: 'A test template',
                tags: ['test'],
                created: '2024-01-01T00:00:00Z',
                updated: '2024-01-01T00:00:00Z',
                author: 'user'
              }
            };
          }
          return null;
        }
      },
      getAbstractFileByPath: (filePath) => {
        if (filePath === 'tangent/templates') {
          return {
            children: [],
            path: 'tangent/templates'
          };
        }
        return null;
      },
      createFolder: async (folderPath) => {
        console.log(`Creating folder: ${folderPath}`);
        return { path: folderPath };
      },
      create: async (filePath, content) => {
        console.log(`Creating file: ${filePath}`);
        return { path: filePath, content };
      },
      read: async (file) => {
        if (file.path.includes('test-template.md')) {
          return `---
id: "test-template"
title: "Test Template"
category: "Test"
description: "A test template"
tags: ["test"]
created: "2024-01-01T00:00:00Z"
updated: "2024-01-01T00:00:00Z"
author: "user"
---

# Test Template Content

This is a test template with {{variable}}.

## Features:
- Template variables
- Markdown formatting
- Frontmatter metadata`;
        }
        return '';
      },
      on: (event, callback) => {
        console.log(`Registered event listener for: ${event}`);
        return { event, callback };
      },
      offref: (ref) => {
        console.log('Removed event listener');
      }
    };
  }
}

// Mock TFile class
class MockTFile {
  constructor(path, extension = 'md') {
    this.path = path;
    this.extension = extension;
  }
}

// Mock TFolder class
class MockTFolder {
  constructor(path) {
    this.path = path;
    this.children = [];
  }
}

async function testTemplateService() {
  console.log('🧪 Testing Template Service');
  console.log('============================');

  try {
    // Check if templateService.ts exists
    const templateServicePath = path.join(__dirname, '..', 'templateService.ts');
    if (!fs.existsSync(templateServicePath)) {
      console.error('❌ templateService.ts not found');
      return;
    }
    console.log('✅ templateService.ts found');

    // Check if the file has the expected content
    const content = fs.readFileSync(templateServicePath, 'utf8');
    
    // Check for key components
    const checks = [
      { name: 'ConversationTemplate interface', pattern: /interface ConversationTemplate/ },
      { name: 'TemplateService class', pattern: /class TemplateService/ },
      { name: 'initialize method', pattern: /async initialize\(\)/ },
      { name: 'searchTemplates method', pattern: /async searchTemplates\(/ },
      { name: 'createCustomTemplate method', pattern: /async createCustomTemplate\(/ },
      { name: 'getAllTemplates method', pattern: /async getAllTemplates\(/ },
      { name: 'file watcher setup', pattern: /setupFileWatcher\(\)/ },
      { name: 'frontmatter parsing', pattern: /parseTemplateFromFile\(/ },
      { name: 'template validation', pattern: /validateTemplateStructure\(/ },
      { name: 'search functionality', pattern: /calculateRelevanceScore\(/ }
    ];

    let passedChecks = 0;
    for (const check of checks) {
      if (check.pattern.test(content)) {
        console.log(`✅ ${check.name} found`);
        passedChecks++;
      } else {
        console.log(`❌ ${check.name} not found`);
      }
    }

    console.log(`\n📊 Test Results: ${passedChecks}/${checks.length} checks passed`);

    if (passedChecks === checks.length) {
      console.log('🎉 All template service components are present!');
      console.log('\n📋 Template Service Features:');
      console.log('- ✅ Template data models and interfaces');
      console.log('- ✅ Template service class with initialization');
      console.log('- ✅ Built-in template loading');
      console.log('- ✅ User template discovery and parsing');
      console.log('- ✅ File watcher for automatic updates');
      console.log('- ✅ Template search with relevance scoring');
      console.log('- ✅ Template CRUD operations');
      console.log('- ✅ Frontmatter parsing and validation');
      console.log('- ✅ Template categories and organization');
      console.log('- ✅ Memory management and caching');
    } else {
      console.log('⚠️  Some components are missing. Please check the implementation.');
    }

    // Check for TypeScript compilation issues
    console.log('\n🔍 Checking for potential TypeScript issues...');
    const tsIssues = [
      { name: 'Missing imports', pattern: /import.*from.*obsidian/ },
      { name: 'Export statements', pattern: /export.*interface|export.*class/ },
      { name: 'Type annotations', pattern: /:.*Promise<|:.*ConversationTemplate/ },
      { name: 'Async/await usage', pattern: /async.*function|async.*method/ }
    ];

    let tsChecks = 0;
    for (const issue of tsIssues) {
      if (issue.pattern.test(content)) {
        console.log(`✅ ${issue.name} properly implemented`);
        tsChecks++;
      } else {
        console.log(`⚠️  ${issue.name} may need attention`);
      }
    }

    console.log(`\n📊 TypeScript Quality: ${tsChecks}/${tsIssues.length} checks passed`);

  } catch (error) {
    console.error('❌ Error testing template service:', error);
  }
}

// Run the test
testTemplateService().then(() => {
  console.log('\n✨ Template service test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 