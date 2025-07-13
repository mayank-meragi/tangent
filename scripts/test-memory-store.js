const { Neo4jMemoryStore } = require('../tools/memory/neo4jStore');

// Mock App object for testing
const mockApp = {
  vault: {
    getName: () => 'test-vault'
  }
};

async function testMemoryStore() {
  console.log('🧠 Testing Neo4j Memory Store...\n');
  
  const memoryStore = new Neo4jMemoryStore(mockApp);
  
  try {
    // Initialize the store
    console.log('1. Initializing memory store...');
    await memoryStore.initialize();
    console.log('✅ Memory store initialized successfully\n');
    
    // Test storing a memory
    console.log('2. Testing memory storage...');
    const memoryId = await memoryStore.storeMemory({
      content: 'User loves action movies and sci-fi films',
      category: 'user_preference',
      importance: 0.8,
      confidence: 0.9,
      tags: ['movies', 'action', 'sci-fi', 'entertainment'],
      context: 'entertainment preferences',
      properties: {
        genre: 'action',
        subGenre: 'sci-fi',
        rating: 5,
        notes: 'User mentioned this multiple times'
      }
    });
    console.log('✅ Stored memory with ID:', memoryId, '\n');
    
    // Test retrieving the memory
    console.log('3. Testing memory retrieval...');
    const retrievedMemory = await memoryStore.getMemory(memoryId);
    if (retrievedMemory) {
      console.log('✅ Retrieved memory:', retrievedMemory.content);
      console.log('   Category:', retrievedMemory.category);
      console.log('   Tags:', retrievedMemory.tags.join(', '));
      console.log('   Properties:', JSON.stringify(retrievedMemory.properties, null, 2));
    } else {
      console.log('❌ Failed to retrieve memory');
    }
    console.log();
    
    // Test searching memories
    console.log('4. Testing memory search...');
    const searchResults = await memoryStore.searchMemories('action movies', {
      limit: 5,
      minImportance: 0.5
    });
    console.log('✅ Search found', searchResults.length, 'memories');
    searchResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.node.content} (relevance: ${result.relevanceScore.toFixed(2)})`);
    });
    console.log();
    
    // Test storing another memory for relationship testing
    console.log('5. Testing relationship creation...');
    const memoryId2 = await memoryStore.storeMemory({
      content: 'User enjoys watching Marvel superhero movies',
      category: 'user_preference',
      importance: 0.7,
      confidence: 0.8,
      tags: ['movies', 'superhero', 'marvel', 'entertainment'],
      context: 'entertainment preferences',
      properties: {
        genre: 'superhero',
        studio: 'marvel',
        rating: 4
      }
    });
    
    // Create a relationship between the two memories
    const relationshipId = await memoryStore.createRelationship(memoryId, memoryId2, {
      type: 'related_to',
      weight: 0.8,
      context: 'both are movie preferences',
      confidence: 0.9,
      properties: {
        relationshipType: 'genre_preference',
        strength: 'strong'
      }
    });
    console.log('✅ Created relationship with ID:', relationshipId, '\n');
    
    // Test graph search
    console.log('6. Testing graph search...');
    const graphResults = await memoryStore.graphSearch('movies', {
      maxDepth: 2,
      limit: 5
    });
    console.log('✅ Graph search found', graphResults.length, 'related memories');
    graphResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.node.content}`);
    });
    console.log();
    
    // Test memory stats
    console.log('7. Testing memory statistics...');
    const stats = await memoryStore.getMemoryStats();
    console.log('✅ Memory statistics:');
    console.log('   Total memories:', stats.totalMemories);
    console.log('   Total relationships:', stats.totalRelationships);
    console.log('   Categories:', JSON.stringify(stats.categories));
    console.log('   Average importance:', stats.averageImportance.toFixed(2));
    console.log();
    
    // Test updating memory
    console.log('8. Testing memory update...');
    await memoryStore.updateMemory(memoryId, {
      importance: 0.9,
      tags: ['movies', 'action', 'sci-fi', 'entertainment', 'favorite']
    });
    const updatedMemory = await memoryStore.getMemory(memoryId);
    console.log('✅ Updated memory importance to:', updatedMemory.importance);
    console.log('   Updated tags:', updatedMemory.tags.join(', '));
    console.log();
    
    // Test memory access tracking
    console.log('9. Testing memory access tracking...');
    await memoryStore.updateMemoryAccess(memoryId);
    const accessedMemory = await memoryStore.getMemory(memoryId);
    console.log('✅ Memory access count:', accessedMemory.accessCount);
    console.log();
    
    // Clean up test data
    console.log('10. Cleaning up test data...');
    await memoryStore.deleteMemory(memoryId);
    await memoryStore.deleteMemory(memoryId2);
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All memory store tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Memory store test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await memoryStore.close();
  }
}

// Run the test
testMemoryStore().catch(console.error); 