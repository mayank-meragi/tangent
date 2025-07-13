const net = require('net');

function checkNeo4jPort() {
  console.log('Checking if Neo4j is running on localhost:7687...');
  
  const client = new net.Socket();
  
  client.connect(7687, 'localhost', () => {
    console.log('✅ Neo4j is running and accessible on port 7687!');
    console.log('You can now test the full connection with: npm run test-neo4j');
    client.destroy();
  });
  
  client.on('error', (err) => {
    console.log('❌ Neo4j is not running on port 7687');
    console.log('Please start Neo4j Desktop and create a database');
    console.log('\nSetup steps:');
    console.log('1. Download Neo4j Desktop from https://neo4j.com/download/');
    console.log('2. Install and launch Neo4j Desktop');
    console.log('3. Create a new database named "tangent-memory"');
    console.log('4. Set password to "password"');
    console.log('5. Start the database');
    console.log('6. Run this check again');
  });
  
  client.setTimeout(5000, () => {
    console.log('❌ Connection timeout - Neo4j may not be running');
    client.destroy();
  });
}

checkNeo4jPort(); 