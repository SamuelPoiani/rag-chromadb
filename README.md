# RAG Implementation with ChromaDB

This project demonstrates a practical implementation of Retrieval-Augmented Generation (RAG) using ChromaDB and OpenAI's embeddings. It's designed to help understand how RAG systems work by creating a simple but effective document retrieval and question-answering system.

## 🚀 Features

- Document ingestion and chunking
- Vector embeddings generation using OpenAI
- Efficient vector storage with ChromaDB
- Semantic search capabilities
- Context-aware question answering

## 🛠️ Technology Stack

- **Node.js** - Runtime environment
- **ChromaDB** - Vector database for storing and retrieving embeddings
- **OpenAI API** - For generating embeddings and text completion
- **LangChain** - For text splitting and document handling
- **Axios** - HTTP client for fetching documents

## 📋 Prerequisites

- Node.js installed on your system
- ChromaDB server running locally
- OpenAI API key

## 🔧 Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Ensure ChromaDB is running locally on port 8000

## 💻 Usage

The project provides several key functions:

- `addDocumentToChroma(url)`: Fetches a document from a URL, processes it, and stores it in ChromaDB
- `queryAndGetResponse(query)`: Performs semantic search and generates a response based on the retrieved context
- `splitIntoChunks(text)`: Splits text into manageable chunks for processing

Example usage:
```javascript
// Add a document to the knowledge base
await addDocumentToChroma('https://example.com/document');

// Query the system
const response = await queryAndGetResponse('What is RAG?');
```

## 🎓 Learning Objectives

This project helps understand:
- How RAG systems combine retrieval and generation
- Vector embeddings and semantic search
- Document chunking and processing
- Integration of multiple AI services

## 📝 Notes

- The system uses OpenAI's `text-embedding-3-small` model for embeddings
- Documents are split into chunks of 1000 tokens with 200 token overlap
- The ChromaDB collection is named "my_collection"