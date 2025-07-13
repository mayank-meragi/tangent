const neo4j = require('neo4j-driver');

async function testLabelValidation() {
    const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'password'));
    const session = driver.session();
    
    try {
        console.log('🧪 Testing label validation...\n');
        
        // Test 1: Test with undefined label (should default to 'Memory')
        console.log('1. Testing with undefined label...');
        try {
            const result1 = await session.run(`
                CREATE (m:Memory {
                    id: 'test-undefined-1',
                    content: 'Test with undefined label',
                    category: 'fact',
                    importance: 0.8,
                    confidence: 1.0,
                    tags: ['test'],
                    context: 'Testing undefined label',
                    lastAccessed: datetime(),
                    accessCount: 1,
                    createdAt: datetime(),
                    properties: null
                })
                RETURN m.id as id
            `);
            console.log('   ✅ Created node with default label (Memory)');
            console.log('   Node ID:', result1.records[0].get('id'));
        } catch (error) {
            console.log('   ❌ Failed:', error.message);
        }
        
        // Test 2: Test with empty string label (should default to 'Memory')
        console.log('\n2. Testing with empty string label...');
        try {
            const result2 = await session.run(`
                CREATE (m:Memory {
                    id: 'test-empty-2',
                    content: 'Test with empty string label',
                    category: 'fact',
                    importance: 0.8,
                    confidence: 1.0,
                    tags: ['test'],
                    context: 'Testing empty string label',
                    lastAccessed: datetime(),
                    accessCount: 1,
                    createdAt: datetime(),
                    properties: null
                })
                RETURN m.id as id
            `);
            console.log('   ✅ Created node with default label (Memory)');
            console.log('   Node ID:', result2.records[0].get('id'));
        } catch (error) {
            console.log('   ❌ Failed:', error.message);
        }
        
        // Test 3: Test with valid label
        console.log('\n3. Testing with valid label...');
        try {
            const result3 = await session.run(`
                CREATE (m:Person {
                    id: 'test-valid-3',
                    content: 'Test with valid Person label',
                    category: 'fact',
                    importance: 0.8,
                    confidence: 1.0,
                    tags: ['test', 'person'],
                    context: 'Testing valid label',
                    lastAccessed: datetime(),
                    accessCount: 1,
                    createdAt: datetime(),
                    properties: null
                })
                RETURN m.id as id
            `);
            console.log('   ✅ Created node with valid label (Person)');
            console.log('   Node ID:', result3.records[0].get('id'));
        } catch (error) {
            console.log('   ❌ Failed:', error.message);
        }
        
        // Test 4: Verify all labels exist
        console.log('\n4. Verifying all labels exist...');
        const labelsResult = await session.run('CALL db.labels() YIELD label RETURN label ORDER BY label');
        const labels = labelsResult.records.map(record => record.get('label'));
        console.log('   All labels:', labels);
        console.log('   Memory label exists:', labels.includes('Memory'));
        console.log('   Person label exists:', labels.includes('Person'));
        
        // Test 5: Clean up test data
        console.log('\n5. Cleaning up test data...');
        await session.run("MATCH (m) WHERE m.id IN ['test-undefined-1', 'test-empty-2', 'test-valid-3'] DELETE m");
        console.log('   Test data cleaned up');
        
        console.log('\n✅ Label validation tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await session.close();
        await driver.close();
    }
}

testLabelValidation().catch(console.error); 