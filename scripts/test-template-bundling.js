#!/usr/bin/env node

/**
 * Test script for Template Bundling
 * This script tests that system templates are properly bundled with the plugin
 */

const fs = require('fs');
const path = require('path');

async function testTemplateBundling() {
  console.log('🧪 Testing Template Bundling');
  console.log('============================');

  try {
    // Check if templates folder exists
    const templatesPath = path.join(__dirname, '..', 'templates');
    if (!fs.existsSync(templatesPath)) {
      console.error('❌ templates/ folder not found');
      return;
    }
    console.log('✅ templates/ folder found');

    // Get all template files
    const templateFiles = fs.readdirSync(templatesPath)
      .filter(file => file.endsWith('.md'))
      .sort();

    console.log(`📁 Found ${templateFiles.length} template files`);

    if (templateFiles.length === 0) {
      console.error('❌ No template files found');
      return;
    }

    // Test bundling simulation
    const bundledTemplates = {};
    let validTemplates = 0;
    let invalidTemplates = 0;
    const errors = [];

    for (const file of templateFiles) {
      const filePath = path.join(templatesPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(path.join(__dirname, '..'), filePath);
      
      try {
        // Validate template structure
        const validation = validateTemplateFile(content, file);
        if (validation.isValid) {
          bundledTemplates[relativePath] = content;
          console.log(`✅ ${file} - ${validation.template.title} (${validation.template.category})`);
          validTemplates++;
        } else {
          console.log(`❌ ${file} - ${validation.errors.join(', ')}`);
          invalidTemplates++;
          errors.push(`${file}: ${validation.errors.join(', ')}`);
        }
      } catch (error) {
        console.log(`❌ ${file} - Parse error: ${error.message}`);
        invalidTemplates++;
        errors.push(`${file}: Parse error - ${error.message}`);
      }
    }

    // Test bundling output
    console.log('\n📦 Bundling Simulation Results:');
    console.log(`✅ Valid templates: ${validTemplates}`);
    console.log(`❌ Invalid templates: ${invalidTemplates}`);
    console.log(`📊 Total bundled: ${Object.keys(bundledTemplates).length}`);

    // Test bundle size
    const bundleSize = JSON.stringify(bundledTemplates).length;
    const bundleSizeKB = (bundleSize / 1024).toFixed(2);
    console.log(`📏 Bundle size: ${bundleSize} bytes (${bundleSizeKB} KB)`);

    if (bundleSize > 1024 * 1024) { // 1MB limit
      console.warn('⚠️  Bundle size is large (>1MB), consider optimizing templates');
    }

    // Test esbuild define injection
    console.log('\n🔧 Testing esbuild define injection:');
    const defineValue = JSON.stringify(bundledTemplates);
    console.log(`📝 Define value length: ${defineValue.length} characters`);
    console.log(`📝 Define value preview: ${defineValue.substring(0, 100)}...`);

    // Summary
    console.log('\n📋 Summary:');
    if (validTemplates > 0 && invalidTemplates === 0) {
      console.log('✅ All templates are valid and ready for bundling');
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
      bundleSize,
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

function validateTemplateFile(content, filename) {
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

// Run the test
if (require.main === module) {
  testTemplateBundling()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Template bundling test passed!');
        process.exit(0);
      } else {
        console.log('\n💥 Template bundling test failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testTemplateBundling }; 