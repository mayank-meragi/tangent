#!/usr/bin/env node

/**
 * Test script for Bundled Templates Access
 * This script simulates how the plugin would access bundled templates
 */

const fs = require('fs');
const path = require('path');

async function testBundledTemplatesAccess() {
  console.log('🧪 Testing Bundled Templates Access');
  console.log('===================================');

  try {
    // Simulate the bundled templates (same as esbuild would inject)
    const templatesPath = path.join(__dirname, '..', 'templates');
    const bundledTemplates = {};
    
    if (fs.existsSync(templatesPath)) {
      const templateFiles = fs.readdirSync(templatesPath)
        .filter(file => file.endsWith('.md'))
        .sort();
      
      for (const file of templateFiles) {
        const filePath = path.join(templatesPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(path.join(__dirname, '..'), filePath);
        bundledTemplates[relativePath] = content;
      }
    }

    // Simulate the global variable injection
    globalThis.__SYSTEM_TEMPLATES__ = bundledTemplates;

    // Test template access (simulating TemplateService.loadBundledTemplates)
    const loadBundledTemplates = () => {
      try {
        // Access bundled templates from global variable injected by esbuild
        if (typeof globalThis.__SYSTEM_TEMPLATES__ !== 'undefined') {
          return globalThis.__SYSTEM_TEMPLATES__;
        }
        
        // Fallback for development environment
        if (typeof window !== 'undefined' && window.__SYSTEM_TEMPLATES__) {
          return window.__SYSTEM_TEMPLATES__;
        }
        
        return null;
      } catch (error) {
        console.error('Failed to load bundled templates:', error);
        return null;
      }
    };

    // Test the access
    const templates = loadBundledTemplates();
    
    if (!templates) {
      console.error('❌ Failed to access bundled templates');
      return { success: false, error: 'No templates found' };
    }

    console.log(`✅ Successfully accessed ${Object.keys(templates).length} bundled templates`);

    // Test template content parsing
    let validTemplates = 0;
    let invalidTemplates = 0;
    const errors = [];

    for (const [relativePath, content] of Object.entries(templates)) {
      try {
        const validation = validateTemplateContent(content, relativePath);
        if (validation.isValid) {
          console.log(`✅ ${path.basename(relativePath)} - ${validation.template.title}`);
          validTemplates++;
        } else {
          console.log(`❌ ${path.basename(relativePath)} - ${validation.errors.join(', ')}`);
          invalidTemplates++;
          errors.push(`${relativePath}: ${validation.errors.join(', ')}`);
        }
      } catch (error) {
        console.log(`❌ ${path.basename(relativePath)} - Parse error: ${error.message}`);
        invalidTemplates++;
        errors.push(`${relativePath}: Parse error - ${error.message}`);
      }
    }

    // Test template installation simulation
    console.log('\n📦 Template Installation Simulation:');
    const installResults = simulateTemplateInstallation(templates);
    console.log(`✅ Would install: ${installResults.installCount} templates`);
    console.log(`⏭️  Would skip: ${installResults.skipCount} templates (already exist)`);
    console.log(`❌ Would fail: ${installResults.errorCount} templates`);

    // Summary
    console.log('\n📋 Summary:');
    if (validTemplates > 0 && invalidTemplates === 0) {
      console.log('✅ All bundled templates are valid and accessible');
    } else if (validTemplates > 0) {
      console.log('⚠️  Some templates are valid, but there are issues to fix');
    } else {
      console.log('❌ No valid templates found');
    }

    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    return {
      success: validTemplates > 0 && invalidTemplates === 0,
      validTemplates,
      invalidTemplates,
      installResults,
      errors
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

function validateTemplateContent(content, relativePath) {
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    return {
      isValid: false,
      errors: ['Invalid frontmatter format']
    };
  }

  const frontmatterText = frontmatterMatch[1];
  const templateContent = frontmatterMatch[2].trim();

  // Parse frontmatter (simple YAML-like parsing)
  const frontmatter = {};
  const lines = frontmatterText.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      try {
        // Try to parse as JSON for arrays/objects
        frontmatter[key] = JSON.parse(value);
      } catch {
        // Fall back to string
        frontmatter[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  }

  // Validate required fields
  const errors = [];
  if (!frontmatter.title) errors.push('Missing title');
  if (!frontmatter.category) errors.push('Missing category');
  if (!frontmatter.description) errors.push('Missing description');
  if (!frontmatter.author) errors.push('Missing author');
  if (!templateContent || templateContent.length === 0) errors.push('Empty template content');

  // Validate author is "system" for bundled templates
  if (frontmatter.author !== 'system') {
    errors.push('Author must be "system" for bundled templates');
  }

  return {
    isValid: errors.length === 0,
    errors,
    template: {
      title: frontmatter.title,
      category: frontmatter.category,
      author: frontmatter.author
    }
  };
}

function simulateTemplateInstallation(bundledTemplates) {
  let installCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const [relativePath, content] of Object.entries(bundledTemplates)) {
    try {
      // Extract filename from relative path
      const fileName = path.basename(relativePath);
      const systemTemplatePath = `tangent/templates/system/${fileName}`;
      
      // Simulate checking if template already exists
      // In real implementation, this would check the vault
      const templateExists = Math.random() < 0.3; // 30% chance of existing
      
      if (templateExists) {
        skipCount++;
      } else {
        installCount++;
      }
    } catch (error) {
      errorCount++;
    }
  }

  return { installCount, skipCount, errorCount };
}

// Run the test
if (require.main === module) {
  testBundledTemplatesAccess()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Bundled templates access test passed!');
        process.exit(0);
      } else {
        console.log('\n💥 Bundled templates access test failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testBundledTemplatesAccess }; 