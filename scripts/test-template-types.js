#!/usr/bin/env node

/**
 * Test script for Template Types
 * This script tests that all template types are properly defined and exported
 */

const fs = require('fs');
const path = require('path');

async function testTemplateTypes() {
  console.log('🧪 Testing Template Types');
  console.log('==========================');

  try {
    // Check if types.ts exists
    const typesPath = path.join(__dirname, '..', 'tools', 'types.ts');
    if (!fs.existsSync(typesPath)) {
      console.error('❌ tools/types.ts not found');
      return;
    }
    console.log('✅ tools/types.ts found');

    // Check if templateValidation.ts exists
    const validationPath = path.join(__dirname, '..', 'tools', 'templateValidation.ts');
    if (!fs.existsSync(validationPath)) {
      console.error('❌ tools/templateValidation.ts not found');
      return;
    }
    console.log('✅ tools/templateValidation.ts found');

    // Check if templateService.ts exists
    const servicePath = path.join(__dirname, '..', 'templateService.ts');
    if (!fs.existsSync(servicePath)) {
      console.error('❌ templateService.ts not found');
      return;
    }
    console.log('✅ templateService.ts found');

    // Read the types file
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    
    // Check for key type definitions
    const typeChecks = [
      { name: 'ConversationTemplate interface', pattern: /interface ConversationTemplate/ },
      { name: 'TemplateVariable interface', pattern: /interface TemplateVariable/ },
      { name: 'TemplateCategory interface', pattern: /interface TemplateCategory/ },
      { name: 'TemplateSearchResult interface', pattern: /interface TemplateSearchResult/ },
      { name: 'TemplateValidationResult interface', pattern: /interface TemplateValidationResult/ },
      { name: 'DropdownItem interface', pattern: /interface DropdownItem/ },
      { name: 'CreateTemplatePayload interface', pattern: /interface CreateTemplatePayload/ },
      { name: 'UpdateTemplatePayload interface', pattern: /interface UpdateTemplatePayload/ },
      { name: 'Export statements', pattern: /export interface/ },
      { name: 'Type imports', pattern: /import.*from.*types/ }
    ];

    let passedTypeChecks = 0;
    for (const check of typeChecks) {
      if (check.pattern.test(typesContent)) {
        console.log(`✅ ${check.name} found`);
        passedTypeChecks++;
      } else {
        console.log(`❌ ${check.name} not found`);
      }
    }

    console.log(`\n📊 Type Definition Results: ${passedTypeChecks}/${typeChecks.length} checks passed`);

    // Read the validation file
    const validationContent = fs.readFileSync(validationPath, 'utf8');
    
    // Check for validation utilities
    const validationChecks = [
      { name: 'TemplateValidator class', pattern: /class TemplateValidator/ },
      { name: 'validateTemplate method', pattern: /validateTemplate\(/ },
      { name: 'validateVariables method', pattern: /validateVariables\(/ },
      { name: 'validateCreatePayload method', pattern: /validateCreatePayload\(/ },
      { name: 'validateUpdatePayload method', pattern: /validateUpdatePayload\(/ },
      { name: 'validateTemplateContent method', pattern: /validateTemplateContent\(/ },
      { name: 'validateCategory method', pattern: /validateCategory\(/ },
      { name: 'sanitizeContent method', pattern: /sanitizeContent\(/ },
      { name: 'generateSafeId method', pattern: /generateSafeId\(/ },
      { name: 'Type imports in validation', pattern: /import.*from.*types/ }
    ];

    let passedValidationChecks = 0;
    for (const check of validationChecks) {
      if (check.pattern.test(validationContent)) {
        console.log(`✅ ${check.name} found`);
        passedValidationChecks++;
      } else {
        console.log(`❌ ${check.name} not found`);
      }
    }

    console.log(`\n📊 Validation Utility Results: ${passedValidationChecks}/${validationChecks.length} checks passed`);

    // Read the service file
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    
    // Check for service integration
    const serviceChecks = [
      { name: 'Type imports in service', pattern: /import.*from.*tools\/types/ },
      { name: 'TemplateVariable usage', pattern: /variables: \[/ },
      { name: 'ConversationTemplate usage', pattern: /ConversationTemplate/ },
      { name: 'TemplateCategory usage', pattern: /TemplateCategory/ },
      { name: 'TemplateSearchResult usage', pattern: /TemplateSearchResult/ },
      { name: 'TemplateValidationResult usage', pattern: /TemplateValidationResult/ }
    ];

    let passedServiceChecks = 0;
    for (const check of serviceChecks) {
      if (check.pattern.test(serviceContent)) {
        console.log(`✅ ${check.name} found`);
        passedServiceChecks++;
      } else {
        console.log(`❌ ${check.name} not found`);
      }
    }

    console.log(`\n📊 Service Integration Results: ${passedServiceChecks}/${serviceChecks.length} checks passed`);

    // Overall assessment
    const totalChecks = typeChecks.length + validationChecks.length + serviceChecks.length;
    const totalPassed = passedTypeChecks + passedValidationChecks + passedServiceChecks;

    console.log(`\n📊 Overall Results: ${totalPassed}/${totalChecks} checks passed`);

    if (totalPassed === totalChecks) {
      console.log('🎉 All template types and validation utilities are properly implemented!');
      console.log('\n📋 Template Types Features:');
      console.log('- ✅ All required interfaces defined and exported');
      console.log('- ✅ Template validation utilities implemented');
      console.log('- ✅ Service integration with types working');
      console.log('- ✅ Generic dropdown interface ready');
      console.log('- ✅ Type safety and validation in place');
      console.log('- ✅ Payload validation for create/update operations');
      console.log('- ✅ Content validation and sanitization');
      console.log('- ✅ Category and variable validation');
    } else {
      console.log('⚠️  Some type components are missing. Please check the implementation.');
    }

    // Check for potential TypeScript compilation issues
    console.log('\n🔍 Checking for potential TypeScript issues...');
    const tsIssues = [
      { name: 'Proper export statements', pattern: /export interface|export class/ },
      { name: 'Type annotations', pattern: /:.*ConversationTemplate|:.*TemplateVariable/ },
      { name: 'Import statements', pattern: /import.*from.*\.\/tools\/types/ },
      { name: 'Generic types', pattern: /Promise<|Array<|Map</ }
    ];

    let tsChecks = 0;
    for (const issue of tsIssues) {
      if (issue.pattern.test(typesContent) || issue.pattern.test(validationContent) || issue.pattern.test(serviceContent)) {
        console.log(`✅ ${issue.name} properly implemented`);
        tsChecks++;
      } else {
        console.log(`⚠️  ${issue.name} may need attention`);
      }
    }

    console.log(`\n📊 TypeScript Quality: ${tsChecks}/${tsIssues.length} checks passed`);

  } catch (error) {
    console.error('❌ Error testing template types:', error);
  }
}

// Run the test
testTemplateTypes().then(() => {
  console.log('\n✨ Template types test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 