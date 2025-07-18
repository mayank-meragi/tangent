#!/usr/bin/env node

/**
 * Test script for Plugin Template Access
 * This script tests that the built plugin can access bundled templates
 */

const fs = require('fs');
const path = require('path');

async function testPluginTemplates() {
  console.log('🧪 Testing Plugin Template Access');
  console.log('==================================');

  try {
    // Check if main.js exists (built plugin)
    const mainJsPath = path.join(__dirname, '..', 'main.js');
    if (!fs.existsSync(mainJsPath)) {
      console.error('❌ main.js not found. Please run "npm run build" first.');
      return { success: false, error: 'main.js not found' };
    }
    console.log('✅ main.js found');

    // Read the built plugin file
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
    
    // Check for bundled templates in the built file
    console.log('\n📦 Checking for bundled templates in main.js...');
    
    // Look for the define injection pattern
    const definePattern = /__SYSTEM_TEMPLATES__.*?JSON\.parse\(/;
    const defineMatch = mainJsContent.match(definePattern);
    
    if (defineMatch) {
      console.log('✅ Found __SYSTEM_TEMPLATES__ define injection');
    } else {
      console.log('❌ __SYSTEM_TEMPLATES__ define injection not found');
    }

    // Look for template content in the built file
    const templatePatterns = [
      /writing-brainstorm/,
      /analysis-breakdown/,
      /creative-brainstorm/,
      /productivity-plan/,
      /research-explore/,
      /technical-debug/,
      /learning-study/
    ];

    let foundTemplates = 0;
    templatePatterns.forEach(pattern => {
      if (pattern.test(mainJsContent)) {
        console.log(`✅ Found template: ${pattern.source}`);
        foundTemplates++;
      } else {
        console.log(`❌ Missing template: ${pattern.source}`);
      }
    });

    // Check file size
    const fileSize = fs.statSync(mainJsPath).size;
    const fileSizeKB = (fileSize / 1024).toFixed(2);
    console.log(`\n📏 main.js size: ${fileSize} bytes (${fileSizeKB} KB)`);

    // Check for TemplateService class
    const templateServicePatterns = [
      /class TemplateService/,
      /loadBundledTemplates/,
      /installBundledTemplates/,
      /getAllTemplates/,
      /searchTemplates/
    ];

    console.log('\n🔧 Checking TemplateService implementation...');
    let foundMethods = 0;
    templateServicePatterns.forEach(pattern => {
      if (pattern.test(mainJsContent)) {
        console.log(`✅ Found: ${pattern.source}`);
        foundMethods++;
      } else {
        console.log(`❌ Missing: ${pattern.source}`);
      }
    });

    // Summary
    console.log('\n📋 Summary:');
    if (foundTemplates >= 5 && foundMethods >= 4) {
      console.log('✅ Plugin appears to have bundled templates and TemplateService');
      console.log(`✅ Found ${foundTemplates}/7 template references`);
      console.log(`✅ Found ${foundMethods}/5 TemplateService methods`);
    } else {
      console.log('⚠️  Plugin may be missing some template functionality');
      console.log(`⚠️  Found ${foundTemplates}/7 template references`);
      console.log(`⚠️  Found ${foundMethods}/5 TemplateService methods`);
    }

    return {
      success: foundTemplates >= 5 && foundMethods >= 4,
      foundTemplates,
      foundMethods,
      fileSize,
      hasDefineInjection: !!defineMatch
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testPluginTemplates()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Plugin template test passed!');
        process.exit(0);
      } else {
        console.log('\n💥 Plugin template test failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testPluginTemplates }; 