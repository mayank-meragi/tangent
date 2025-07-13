#!/usr/bin/env node

/**
 * Test script to check if MCP server commands are available
 * Run this script to diagnose command availability issues
 */

const { spawn } = require('child_process');
const os = require('os');

const commands = [
  { name: 'uvx', description: 'UV package manager' },
  { name: 'npx', description: 'Node.js package runner' },
  { name: 'node', description: 'Node.js runtime' },
  { name: 'python', description: 'Python interpreter' },
  { name: 'pip', description: 'Python package manager' }
];

function testCommand(commandObj) {
  return new Promise((resolve) => {
    const command = commandObj.name;
    const isWindows = os.platform() === 'win32';
    const shell = isWindows ? 'cmd.exe' : '/bin/zsh';
    const args = isWindows ? ['/c', `where ${command}`] : ['-c', `which ${command}`];
    
    const child = spawn(shell, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let error = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        command: commandObj.name,
        description: commandObj.description,
        available: code === 0,
        path: output.trim(),
        error: error.trim()
      });
    });
  });
}

async function main() {
  console.log('🔍 Testing MCP server command availability...\n');
  
  const results = await Promise.all(commands.map(testCommand));
  
  console.log('Results:\n');
  
  results.forEach((result) => {
    const status = result.available ? '✅' : '❌';
    console.log(`${status} ${result.command} (${result.description})`);
    
    if (result.available) {
      console.log(`   Path: ${result.path}`);
    } else {
      console.log(`   Error: ${result.error || 'Command not found'}`);
    }
    console.log('');
  });
  
  // Check PATH environment
  console.log('🔧 Environment Information:');
  console.log(`Platform: ${os.platform()}`);
  console.log(`Architecture: ${os.arch()}`);
  console.log(`Node.js version: ${process.version}`);
  console.log(`PATH: ${process.env.PATH}`);
  
  // Provide recommendations
  console.log('\n💡 Recommendations:');
  
  const missingCommands = results.filter(r => !r.available);
  
  if (missingCommands.length === 0) {
    console.log('✅ All commands are available! Your system is ready for MCP servers.');
  } else {
    console.log('❌ Some commands are missing. Here are installation instructions:');
    
    missingCommands.forEach(({ command }) => {
      switch (command) {
        case 'uvx':
          console.log('\n📦 Install UV:');
          console.log('   macOS/Linux: curl -LsSf https://astral.sh/uv/install.sh | sh');
          console.log('   Windows: pip install uv');
          console.log('   Or: pip install uv');
          break;
        case 'npx':
        case 'node':
          console.log('\n📦 Install Node.js:');
          console.log('   Download from: https://nodejs.org/');
          console.log('   Or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash');
          break;
        case 'python':
        case 'pip':
          console.log('\n📦 Install Python:');
          console.log('   Download from: https://python.org/');
          console.log('   Or use pyenv: https://github.com/pyenv/pyenv');
          break;
      }
    });
    
    console.log('\n🔄 After installation:');
    console.log('   1. Restart your terminal');
    console.log('   2. Restart Obsidian');
    console.log('   3. Run this script again to verify');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCommand, main }; 