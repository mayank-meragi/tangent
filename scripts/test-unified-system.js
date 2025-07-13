const neo4j = require('neo4j-driver');

async function testUnifiedSystem() {
    const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'password'));
    const session = driver.session();
    
    try {
        console.log('🧪 Testing unified graph system...\n');
        
        // Test 1: List current labels and relationships
        console.log('1. Current labels and relationships...');
        const labelsResult = await session.run('CALL db.labels() YIELD label RETURN label ORDER BY label');
        const labels = labelsResult.records.map(record => record.get('label'));
        console.log('   Labels:', labels);
        
        const relTypesResult = await session.run('CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType ORDER BY relationshipType');
        const relTypes = relTypesResult.records.map(record => record.get('relationshipType'));
        console.log('   Relationship types:', relTypes);
        
        // Test 2: Create a Person node
        console.log('\n2. Creating a Person node...');
        const personResult = await session.run(`
            CREATE (p:Person {
                id: 'test-person-1',
                content: 'John is a software developer',
                importance: 0.8,
                confidence: 1.0,
                tags: ['person', 'developer'],
                context: 'User information',
                lastAccessed: datetime(),
                accessCount: 1,
                createdAt: datetime(),
                properties: null
            })
            RETURN p.id as id
        `);
        console.log('   Created Person node:', personResult.records[0].get('id'));
        
        // Test 3: Create a Preference node
        console.log('\n3. Creating a Preference node...');
        const prefResult = await session.run(`
            CREATE (p:Preference {
                id: 'test-pref-1',
                content: 'John likes basketball',
                importance: 0.7,
                confidence: 1.0,
                tags: ['preference', 'sport'],
                context: 'User preference',
                lastAccessed: datetime(),
                accessCount: 1,
                createdAt: datetime(),
                properties: null
            })
            RETURN p.id as id
        `);
        console.log('   Created Preference node:', prefResult.records[0].get('id'));
        
        // Test 4: Create a relationship between them
        console.log('\n4. Creating relationship between nodes...');
        await session.run(`
            MATCH (person:Person {id: 'test-person-1'})
            MATCH (pref:Preference {id: 'test-pref-1'})
            CREATE (person)-[:LIKES {context: 'John likes basketball'}]->(pref)
        `);
        console.log('   Created LIKES relationship');
        
        // Test 5: Query the connected information
        console.log('\n5. Querying connected information...');
        const queryResult = await session.run(`
            MATCH (person:Person)-[r:LIKES]->(pref:Preference)
            WHERE person.content CONTAINS 'John'
            RETURN person.content as person, r.context as relationship, pref.content as preference
        `);
        
        queryResult.records.forEach((record, index) => {
            console.log(`   ${index + 1}. ${record.get('person')} ${record.get('relationship')} ${record.get('preference')}`);
        });
        
        // Test 6: Verify new labels and relationships
        console.log('\n6. Verifying new labels and relationships...');
        const newLabelsResult = await session.run('CALL db.labels() YIELD label RETURN label ORDER BY label');
        const newLabels = newLabelsResult.records.map(record => record.get('label'));
        console.log('   Updated labels:', newLabels);
        
        const newRelTypesResult = await session.run('CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType ORDER BY relationshipType');
        const newRelTypes = newRelTypesResult.records.map(record => record.get('relationshipType'));
        console.log('   Updated relationship types:', newRelTypes);
        
        // Test 7: Clean up test data
        console.log('\n7. Cleaning up test data...');
        await session.run("MATCH (n) WHERE n.id IN ['test-person-1', 'test-pref-1'] DETACH DELETE n");
        console.log('   Test data cleaned up');
        
        console.log('\n✅ Unified system test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await session.close();
        await driver.close();
    }
}

testUnifiedSystem().catch(console.error); 