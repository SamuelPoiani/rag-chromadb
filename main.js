require('dotenv').config();

const { ChromaClient } = require("chromadb");
const { OpenAI } = require('openai');
const axios = require('axios');
const { Document } = require("langchain/document");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { encode } = require('gpt-tokenizer');

const client = new ChromaClient({
    path: "http://localhost:8000"
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Configure text splitter
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

let collection;

async function getOrCreateCollection() {
    try {
        collection = await client.getOrCreateCollection({
            name: "my_collection",
        });
        console.log('Collection ready');
        return collection;
    } catch (error) {
        console.error('Error with collection:', error);
        throw error;
    }
}

async function getEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            dimensions: 1536
        });
        
        if (!response.data || response.data.length === 0) {
            throw new Error('No embedding data received from OpenAI');
        }
        
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error getting embedding:', error);
        throw error;
    }
}

async function splitIntoChunks(text, metadata = {}) {
    try {
        const docs = await textSplitter.createDocuments([text], [metadata]);
        return docs;
    } catch (error) {
        console.error('Error splitting text into chunks:', error);
        throw error;
    }
}

async function addDocumentToChroma(url) {
    try {
        const collection = await getOrCreateCollection();
        const markdown = await fetchAndConvertToMarkdown(url);
        
        // Split the document into chunks
        const chunks = await splitIntoChunks(markdown, { source: url });
        
        // Process each chunk
        const ids = [];
        const documents = [];
        const embeddings = [];
        const metadatas = [];
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const chunkId = `${url}_chunk_${i}`;
            const embedding = await getEmbedding(chunk.pageContent);
            
            ids.push(chunkId);
            documents.push(chunk.pageContent);
            embeddings.push(embedding);
            metadatas.push({
                source: url,
                chunk_index: i,
                total_chunks: chunks.length,
                ...chunk.metadata
            });
        }
        
        // Upsert all chunks
        await collection.upsert({
            ids,
            embeddings,
            metadatas,
            documents
        });
  
        console.log(`Document added for URL: ${url} (split into ${chunks.length} chunks)`);
    } catch (error) {
        console.error('Error adding document:', error);
        console.error('Error details:', error.message);
    }
}

async function fetchAndConvertToMarkdown(url) {
    try {
        const markdownURL = `https://urltomarkdown.herokuapp.com/?url=${encodeURIComponent(url)}`;
        const response = await axios.get(markdownURL);
        return response.data;
    } catch (error) {
        console.error('Error fetching and converting to Markdown:', error);
        throw error;
    }
}

// Function to count tokens
function countTokens(text) {
    return encode(text).length;
}

async function queryAndGetResponse(query) {
    try {
        const collection = await getOrCreateCollection();
        const queryEmbedding = await getEmbedding(query);

        const results = await collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: 5  // Increased to get more context from chunks
        });

        // Combine relevant chunks for better context
        const context = results.documents[0].join('\n\n');
        
        // Count tokens in context and query
        const contextTokens = countTokens(context);
        const queryTokens = countTokens(query);
        
        console.log(`- Total tokens used: ${contextTokens + queryTokens}`);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant. Use the provided context to answer questions accurately. If you're not sure about something, say so."
                },
                {
                    role: "user",
                    content: `Context: ${context}\n\nQuestion: ${query}`
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const response = completion.choices[0].message.content;
        const responseTokens = countTokens(response);
        
        console.log('- Response tokens:', responseTokens);
        console.log('- Total tokens used:', contextTokens + queryTokens + responseTokens);
        
        return response;
    } catch (error) {
        console.error('Error in query:', error);
        throw error;
    }
}

//addDocumentToChroma('https://www.npmjs.com/package/openai');
//viewStoredDocuments();

/* async function deleteCollection() {
    try {
        const collection = await client.getCollection({ name: "my_collection" });
        await client.deleteCollection(collection);
        console.log('Collection deleted');
    } catch (error) {
        console.error('Error deleting collection:', error);
    }
}
deleteCollection(); */

queryAndGetResponse('How to make a api call to openai?').then(response => {
    console.log('Response:', response);
});

// Fix the exports syntax
module.exports = {
    addDocumentToChroma,
    queryAndGetResponse,
    getOrCreateCollection
};