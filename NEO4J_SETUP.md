# Neo4j Memory System Setup Guide

This guide will help you set up Neo4j as the knowledge graph backend for your AI assistant's memory system.

## Prerequisites

1. **Node.js** (version 16 or higher)
2. **Neo4j Database** (local or cloud)

## Step 1: Install Neo4j

### Option A: Neo4j Desktop (Recommended for Development)

1. Download Neo4j Desktop from [https://neo4j.com/download/](https://neo4j.com/download/)
2. Install and launch Neo4j Desktop
3. Create a new project
4. Add a new database:
   - Choose "Create a Local Graph"
   - Name: `tangent-memory`
   - Version: Neo4j 5.x
   - Password: `password` (or your preferred password)
5. Start the database

### Option B: Neo4j Cloud (Production)

1. Go to [https://neo4j.com/cloud/platform/aura-graph-database/](https://neo4j.com/cloud/platform/aura-graph-database/)
2. Create a free account
3. Create a new database
4. Note down the connection details (URI, username, password)

## Step 2: Install Dependencies

Run the following command in your project directory:

```bash
npm install
```

This will install the `neo4j-driver` dependency that was added to your `package.json`.

## Step 3: Configure Connection

### For Local Neo4j Desktop:

The default configuration should work:
- URI: `bolt://localhost:7687`
- Username: `neo4j`
- Password: `password` (or what you set during installation)

### For Neo4j Cloud:

Update the connection details in `tools/memory/neo4jStore.ts`:

```typescript
constructor(app: App, uri = 'your-neo4j-uri', username = 'neo4j', password = 'your-password') {
```

## Step 4: Test the Connection

1. Start your Neo4j database
2. Run your Obsidian plugin
3. The memory system will automatically initialize when first used

## Step 5: Verify Installation

You can test the memory system by using the AI assistant to:

1. **Store a memory**: "Remember that I like action movies"
2. **Retrieve memories**: "What do you know about my movie preferences?"
3. **Graph search**: "Find information related to movies"

## Available Memory Tools

Your AI assistant now has access to these memory tools:

### 1. `store_memory`
Store important information in the knowledge graph.

**Example**: "Remember that I prefer action movies and dislike romantic comedies"

### 2. `retrieve_memory`
Search and retrieve relevant memories.

**Example**: "What do you know about my preferences?"

### 3. `graph_search`
Perform graph traversal to find related information.

**Example**: "Find all information related to entertainment preferences"

### 4. `find_path`
Find the shortest path between two concepts.

**Example**: "How are my movie preferences connected to my work schedule?"

### 5. `analyze_graph`
Analyze the knowledge graph structure.

**Example**: "Show me statistics about my stored memories"

### 6. `update_memory`
Update existing memories with new information.

**Example**: "Update my movie preference to include sci-fi"

### 7. `forget_memory`
Remove outdated or incorrect information.

**Example**: "Forget that I liked romantic comedies"

## Memory Categories

The system supports these memory categories:

- **user_preference**: User likes, dislikes, and preferences
- **fact**: General facts and information
- **experience**: Past experiences and events
- **concept**: Abstract concepts and ideas
- **temporal**: Time-sensitive information
- **conversation**: Conversation history and context

## Graph Relationships

The system automatically creates relationships between memories:

- **related_to**: General relationship
- **part_of**: Part-whole relationship
- **causes**: Causal relationship
- **similar_to**: Similarity relationship
- **contradicts**: Contradictory information
- **temporal_before/after**: Temporal relationships
- **mentions**: Reference relationship
- **prefers/dislikes**: Preference relationships

## Performance Tips

1. **Indexes**: The system automatically creates indexes for better performance
2. **Constraints**: Unique constraints ensure data integrity
3. **Cleanup**: Expired memories are automatically cleaned up
4. **Caching**: Frequently accessed memories are optimized

## Troubleshooting

### Connection Issues

1. **Check Neo4j is running**: Ensure your Neo4j database is started
2. **Verify credentials**: Check username/password in the constructor
3. **Network issues**: For cloud instances, check firewall settings
4. **Port conflicts**: Ensure port 7687 is available for local instances

### Performance Issues

1. **Memory size**: Large graphs may need more RAM
2. **Indexes**: Ensure indexes are created (automatic on first run)
3. **Query optimization**: Use specific categories and limits

### Data Issues

1. **Backup**: Regularly backup your Neo4j database
2. **Migration**: Use Neo4j's export/import tools for data migration
3. **Cleanup**: Use the cleanup function to remove expired memories

## Advanced Configuration

### Custom Relationship Types

You can add custom relationship types by modifying the `MemoryRelationship` interface in `neo4jStore.ts`.

### Custom Properties

Each memory can have additional properties stored in the `properties` field.

### Graph Algorithms

For advanced graph analysis, install the Neo4j Graph Data Science library:

```cypher
CALL gds.list() YIELD name, signature, description
```

## Security Considerations

1. **Authentication**: Use strong passwords for Neo4j
2. **Network**: Restrict network access to Neo4j
3. **Encryption**: Enable SSL/TLS for production deployments
4. **Backup**: Regular backups of your knowledge graph

## Monitoring

Monitor your Neo4j database using:

1. **Neo4j Browser**: Access at `http://localhost:7474`
2. **Neo4j Desktop**: Built-in monitoring tools
3. **Logs**: Check Neo4j logs for errors

## Example Usage Scenarios

### Scenario 1: Learning User Preferences

```
User: "I love action movies"
AI: [calls store_memory with content="User loves action movies", category="user_preference"]

User: "Recommend me a movie"
AI: [calls retrieve_memory with query="movie preferences"]
AI: "Based on your preference for action movies, I recommend..."
```

### Scenario 2: Connecting Related Information

```
User: "I'm busy with work this week"
AI: [calls store_memory with content="User is busy with work this week", category="temporal"]

User: "What should I watch tonight?"
AI: [calls graph_search with query="entertainment preferences"]
AI: "Given your busy work schedule and love for action movies, I suggest a short action film..."
```

### Scenario 3: Updating Information

```
User: "Actually, I'm starting to like romantic comedies too"
AI: [calls update_memory with newContent="User likes both action movies and romantic comedies"]
```

This setup gives your AI assistant a powerful, persistent memory system that can learn, adapt, and provide contextually relevant responses based on your interactions. 