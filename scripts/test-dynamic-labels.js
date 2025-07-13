const neo4j = require('neo4j-driver');

async function testDynamicLabels() {
    const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'password'));
    const session = driver.session();
    
    try {
        console.log('🧪 Testing dynamic labels and relationships...\n');
        
        // Test 1: List all labels
        console.log('1. Testing list_labels...');
        const labelsResult = await session.run('CALL db.labels() YIELD label RETURN label ORDER BY label');
        const labels = labelsResult.records.map(record => record.get('label'));
        console.log('   Found labels:', labels);
        console.log('   Count:', labels.length);
        
        // Test 2: List all relationship types
        console.log('\n2. Testing list_relationship_types...');
        const relTypesResult = await session.run('CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType ORDER BY relationshipType');
        const relationshipTypes = relTypesResult.records.map(record => record.get('relationshipType'));
        console.log('   Found relationship types:', relationshipTypes);
        console.log('   Count:', relationshipTypes.length);
        
        // Test 3: Create a node with a specific label
        console.log('\n3. Testing node creation with specific label...');
        const testLabel = 'TestPerson';
        const createResult = await session.run(`
            CREATE (p:${testLabel} {
                id: 'test-123',
                content: 'Test person content',
                category: 'fact',
                importance: 0.8,
                confidence: 1.0,
                tags: ['test', 'person'],
                context: 'Testing dynamic labels',
                lastAccessed: datetime(),
                accessCount: 1,
                createdAt: datetime(),
                properties: null
            })
            RETURN p.id as id
        `);
        console.log('   Created node with label:', testLabel);
        console.log('   Node ID:', createResult.records[0].get('id'));
        
        // Test 4: Verify the label was created
        console.log('\n4. Verifying new label exists...');
        const newLabelsResult = await session.run('CALL db.labels() YIELD label RETURN label ORDER BY label');
        const newLabels = newLabelsResult.records.map(record => record.get('label'));
        console.log('   Updated labels:', newLabels);
        console.log('   Test label exists:', newLabels.includes(testLabel));
        
        // Test 5: Search in specific label
        console.log('\n5. Testing search in specific label...');
        const searchResult = await session.run(`
            MATCH (p:${testLabel})
            WHERE p.content CONTAINS 'Test'
            RETURN p.content as content, p.id as id
        `);
        console.log('   Search results:', searchResult.records.length);
        searchResult.records.forEach((record, index) => {
            console.log(`   ${index + 1}. ${record.get('content')} (ID: ${record.get('id')})`);
        });
        
        // Test 6: Clean up test data
        console.log('\n6. Cleaning up test data...');
        await session.run(`MATCH (p:${testLabel}) DELETE p`);
        console.log('   Test data cleaned up');
        
        console.log('\n✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await session.close();
        await driver.close();
    }
}

testDynamicLabels().catch(console.error); 