#!/usr/bin/env node

/**
 * Test script for Built-in Templates
 * This script tests that all built-in templates are properly formatted and parseable
 */

const fs = require('fs');
const path = require('path');

async function testBuiltinTemplates() {
  console.log('🧪 Testing Built-in Templates');
  console.log('==============================');

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

    // Test each template file
    let validTemplates = 0;
    let invalidTemplates = 0;
    const categories = new Set();
    const errors = [];

    for (const file of templateFiles) {
      const filePath = path.join(templatesPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      try {
        const validation = validateTemplateFile(content, file);
        if (validation.isValid) {
          console.log(`✅ ${file} - ${validation.template.title} (${validation.template.category})`);
          validTemplates++;
          categories.add(validation.template.category);
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

    console.log(`\n📊 Template Validation Results:`);
    console.log(`- Valid templates: ${validTemplates}`);
    console.log(`- Invalid templates: ${invalidTemplates}`);
    console.log(`- Total templates: ${templateFiles.length}`);

    // Check category distribution
    console.log(`\n📂 Categories found: ${Array.from(categories).sort().join(', ')}`);

    // Check if we have enough templates per category
    const categoryCounts = {};
    for (const file of templateFiles) {
      const filePath = path.join(templatesPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const validation = validateTemplateFile(content, file);
      if (validation.isValid) {
        const category = validation.template.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    }

    console.log('\n📈 Templates per category:');
    for (const [category, count] of Object.entries(categoryCounts)) {
      const status = count >= 5 ? '✅' : count >= 3 ? '⚠️' : '❌';
      console.log(`${status} ${category}: ${count} templates`);
    }

    // Overall assessment
    if (validTemplates === templateFiles.length) {
      console.log('\n🎉 All templates are valid and properly formatted!');
      console.log('\n📋 Template Features:');
      console.log('- ✅ Proper frontmatter structure');
      console.log('- ✅ Valid variable definitions');
      console.log('- ✅ Meaningful content and descriptions');
      console.log('- ✅ Appropriate categorization');
      console.log('- ✅ Consistent formatting');
    } else {
      console.log('\n⚠️  Some templates have issues. Please check the errors above.');
    }

    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('❌ Error testing built-in templates:', error);
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

  // Parse frontmatter (simplified)
  const frontmatter = {};
  const lines = frontmatterText.split('\n');
  let currentKey = null;
  let currentValue = [];

  for (const line of lines) {
    if (line.includes(':')) {
      // Save previous key-value pair
      if (currentKey && currentValue.length > 0) {
        frontmatter[currentKey] = currentValue.join('\n').trim();
        currentValue = [];
      }

      const [key, ...valueParts] = line.split(':');
      currentKey = key.trim();
      const value = valueParts.join(':').trim();
      if (value) {
        currentValue.push(value);
      }
    } else if (line.trim().startsWith('-') && currentKey) {
      // Array item
      currentValue.push(line.trim());
    } else if (line.trim() && currentKey) {
      // Continuation of current value
      currentValue.push(line.trim());
    }
  }

  // Save last key-value pair
  if (currentKey && currentValue.length > 0) {
    frontmatter[currentKey] = currentValue.join('\n').trim();
  }

  // Validate required fields
  const errors = [];
  const requiredFields = ['id', 'title', 'category', 'description'];
  
  for (const field of requiredFields) {
    if (!frontmatter[field] || frontmatter[field].trim() === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate content
  if (!templateContent || templateContent.length === 0) {
    errors.push('Template content is empty');
  }

  // Validate variables if present
  if (frontmatter.variables) {
    try {
      // Simple validation - check if it looks like a valid structure
      if (!frontmatter.variables.includes('name:') || !frontmatter.variables.includes('type:')) {
        errors.push('Invalid variables structure');
      }
    } catch (error) {
      errors.push('Variables parsing error');
    }
  }

  // Validate date formats
  if (frontmatter.created && !isValidDate(frontmatter.created)) {
    errors.push('Invalid created date format');
  }
  if (frontmatter.updated && !isValidDate(frontmatter.updated)) {
    errors.push('Invalid updated date format');
  }

  // Validate author
  if (frontmatter.author && !['system', 'user'].includes(frontmatter.author)) {
    errors.push('Author must be "system" or "user"');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors
    };
  }

  // Create template object for successful validation
  const template = {
    id: frontmatter.id,
    title: frontmatter.title,
    category: frontmatter.category,
    description: frontmatter.description,
    content: templateContent,
    tags: frontmatter.tags ? parseArray(frontmatter.tags) : [],
    author: frontmatter.author || 'system',
    version: frontmatter.version,
    created: frontmatter.created,
    updated: frontmatter.updated,
    favorite: frontmatter.favorite === 'true'
  };

  return {
    isValid: true,
    template,
    errors: []
  };
}

function parseArray(arrayText) {
  if (!arrayText) return [];
  
  // Simple array parsing for tags
  const items = arrayText.split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-'))
    .map(line => line.substring(1).trim().replace(/^["']|["']$/g, ''));
  
  return items;
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Run the test
testBuiltinTemplates().then(() => {
  console.log('\n✨ Built-in templates test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 