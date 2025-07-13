const neo4j = require('neo4j-driver');

async function testNeo4jConnection() {
  console.log('Testing Neo4j connection...');
  
  // Create driver
  const driver = neo4j.driver(
    'bolt://localhost:7687',
    neo4j.auth.basic('neo4j', 'password')
  );
  
  try {
    // Test connection
    const session = driver.session();
    const result = await session.run('RETURN 1 as test');
    await session.close();
    
    console.log('✅ Neo4j connection successful!');
    console.log('Test result:', result.records[0].get('test').toNumber());
    
    // Test memory operations
    await testMemoryOperations(driver);
    
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error.message);
    console.log('\nPlease ensure:');
    console.log('1. Neo4j is running on localhost:7687');
    console.log('2. Username is "neo4j" and password is "password"');
    console.log('3. Or update the connection details in the test script');
  } finally {
    await driver.close();
  }
}

async function testMemoryOperations(driver) {
  console.log('\nTesting memory operations...');
  
  const session = driver.session();
  
  try {
    // Create a test memory
    const createResult = await session.run(`
      CREATE (m:Memory {
        id: 'test-memory-1',
        content: 'User likes action movies',
        category: 'user_preference',
        importance: 0.8,
        confidence: 1.0,
        tags: ['movies', 'action', 'preference'],
        context: 'entertainment preferences',
        lastAccessed: datetime(),
        accessCount: 1,
        createdAt: datetime(),
        properties: {}
      })
      RETURN m.id as id
    `);
    
    console.log('✅ Created test memory:', createResult.records[0].get('id'));
    
    // Retrieve the memory
    const retrieveResult = await session.run(`
      MATCH (m:Memory {id: 'test-memory-1'})
      RETURN m.content as content, m.category as category
    `);
    
    if (retrieveResult.records.length > 0) {
      const record = retrieveResult.records[0];
      console.log('✅ Retrieved memory:', record.get('content'), `(${record.get('category')})`);
    }
    
    // Search memories
    const searchResult = await session.run(`
      MATCH (m:Memory)
      WHERE m.content CONTAINS 'action' OR ANY(tag IN m.tags WHERE tag CONTAINS 'action')
      RETURN m.content as content
      LIMIT 5
    `);
    
    console.log('✅ Search found', searchResult.records.length, 'memories');
    
    // Clean up test data
    await session.run(`
      MATCH (m:Memory {id: 'test-memory-1'})
      DETACH DELETE m
    `);
    
    console.log('✅ Cleaned up test data');
    
  } catch (error) {
    console.error('❌ Memory operations failed:', error.message);
  } finally {
    await session.close();
  }
}

// Run the test
testNeo4jConnection().catch(console.error); 