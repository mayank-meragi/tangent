# 🗄️ Neo4j Memory System Setup Guide

## 🎯 Overview

Your AI assistant now has a powerful, persistent memory system powered by Neo4j graph database. This system allows the AI to:

- **Store** important information persistently
- **Retrieve** relevant memories based on context
- **Connect** related concepts through graph relationships
- **Analyze** knowledge patterns and insights
- **Forget** outdated information when needed

## 🚀 Quick Setup

### Option 1: Neo4j Desktop (Recommended)

1. **Download Neo4j Desktop**
   - Visit: [https://neo4j.com/download/](https://neo4j.com/download/)
   - Click "Download Neo4j Desktop"
   - Choose macOS version

2. **Install & Launch**
   - Open the downloaded `.dmg` file
   - Drag Neo4j Desktop to Applications
   - Launch from Applications folder

3. **Create Database**
   - Click "New" → "Create a Local Graph"
   - **Name**: `tangent-memory`
   - **Version**: Neo4j 5.x (latest)
   - **Password**: `password`
   - **Port**: `7687` (default)
   - Click "Create"

4. **Start Database**
   - Click "Start" button next to your database
   - Wait for green status indicator
   - Database is now running on `bolt://localhost:7687`

### Option 2: Docker (Alternative)

If you prefer Docker:

```bash
# Start Neo4j with Docker
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs neo4j
```

## ✅ Verification

Test your setup:

```bash
# Check if Neo4j is running
npm run check-neo4j

# Test full connection
npm run test-neo4j

# Verify memory tools integration
npm run test-memory-integration
```

## 🧠 Memory System Features

### Available Tools

1. **`store_memory`** - Store important information
   - Categories: user_preference, fact, experience, concept, temporal, conversation
   - Includes importance, confidence, tags, and context

2. **`retrieve_memory`** - Search and retrieve memories
   - Semantic search with relevance scoring
   - Filter by category, importance, and tags

3. **`graph_search`** - Graph traversal search
   - Find related concepts through relationships
   - Configurable depth and edge types

4. **`find_path`** - Find shortest path between concepts
   - Discover connections between memories
   - Useful for understanding relationships

5. **`analyze_graph`** - Analyze knowledge graph structure
   - Get statistics about your memory system
   - Find central concepts and clusters

6. **`update_memory`** - Update existing memories
   - Modify importance, tags, or other properties
   - Track access patterns

7. **`forget_memory`** - Remove outdated information
   - Delete specific memories or patterns
   - Clean up expired memories

### Memory Categories

- **`user_preference`** - User likes, dislikes, preferences
- **`fact`** - General knowledge and facts
- **`experience`** - Past experiences and events
- **`concept`** - Abstract concepts and ideas
- **`temporal`** - Time-based information
- **`conversation`** - Conversation history and context

## 🎯 Example Usage

### Storing Information

**User**: "I love action movies and sci-fi films"

**AI Response**: 
```json
{
  "tool": "store_memory",
  "parameters": {
    "content": "User loves action movies and sci-fi films",
    "category": "user_preference",
    "importance": 0.8,
    "confidence": 0.9,
    "tags": ["movies", "action", "sci-fi", "entertainment"],
    "context": "entertainment preferences"
  }
}
```

### Retrieving Information

**User**: "What movies should I watch?"

**AI Response**:
```json
{
  "tool": "retrieve_memory",
  "parameters": {
    "query": "movie preferences entertainment",
    "limit": 5,
    "minImportance": 0.5
  }
}
```

**AI**: "Based on your love for action movies and sci-fi films, I recommend..."

### Graph Search

**User**: "What do you know about my entertainment preferences?"

**AI Response**:
```json
{
  "tool": "graph_search",
  "parameters": {
    "query": "entertainment preferences",
    "maxDepth": 2,
    "limit": 10
  }
}
```

## 🔧 Configuration

### Connection Settings

The memory system is configured to connect to:
- **Host**: `localhost`
- **Port**: `7687`
- **Username**: `neo4j`
- **Password**: `password`

To change these settings, edit `tools/memory/neo4jStore.ts`:

```typescript
constructor(app: App, uri = 'bolt://localhost:7687', username = 'neo4j', password = 'password')
```

### Memory Properties

Each memory can include:
- **content**: The actual information
- **category**: Type of memory (see categories above)
- **importance**: 0-1 scale of importance
- **confidence**: 0-1 scale of confidence in the information
- **tags**: Array of relevant tags
- **context**: Additional context
- **properties**: Custom key-value pairs
- **expiresAt**: Optional expiration date

## 📊 Monitoring & Maintenance

### Access Neo4j Browser

1. In Neo4j Desktop, click "Open" next to your database
2. Browser opens at `http://localhost:7474`
3. Login with username `neo4j` and password `password`
4. Run Cypher queries to explore your data

### Useful Queries

```cypher
// View all memories
MATCH (m:Memory) RETURN m LIMIT 10

// Find memories by category
MATCH (m:Memory {category: 'user_preference'}) RETURN m

// Search for specific content
MATCH (m:Memory) WHERE m.content CONTAINS 'movie' RETURN m

// View relationships
MATCH (m1:Memory)-[r]->(m2:Memory) RETURN m1, r, m2 LIMIT 10

// Get memory statistics
MATCH (m:Memory) RETURN count(m) as total, avg(m.importance) as avgImportance
```

### Cleanup

The system automatically:
- Tracks memory access patterns
- Updates relevance scores
- Cleans up expired memories
- Maintains relationship weights

## 🚨 Troubleshooting

### Connection Issues

1. **Neo4j not running**
   ```bash
   npm run check-neo4j
   ```
   - Start Neo4j Desktop and ensure database is running

2. **Wrong credentials**
   - Verify username is `neo4j` and password is `password`
   - Or update connection settings in code

3. **Port conflicts**
   - Ensure port 7687 is available
   - Check if another Neo4j instance is running

### Memory Operation Issues

1. **Serialization errors**
   - The system automatically handles complex objects
   - Maps, Sets, and nested objects are converted to Neo4j-compatible formats

2. **Performance issues**
   - Indexes are automatically created for better performance
   - Use `analyze_graph` to check system health

## 🎉 Next Steps

1. **Start your Obsidian plugin**
2. **Test with simple commands**:
   - "Remember that I like action movies"
   - "What do you know about my preferences?"
   - "Find related concepts to movies"
3. **Explore the Neo4j browser** to see your data
4. **Monitor memory patterns** as you use the system

Your AI assistant now has a powerful, persistent memory that will learn and adapt to your preferences over time! 🧠✨ 