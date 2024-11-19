require('dotenv').config();

const { getOrCreateCollection } = require('./main.js');

async function viewStoredDocuments() {
    try {
        const collection = await getOrCreateCollection();
        const result = await collection.get();

        console.log('\n=== Stored Documents ===');
        if (!result.ids.length) {
            console.log('No documents found in the collection');
            return;
        }

        // Group chunks by source URL
        const documentsBySource = {};
        for (let i = 0; i < result.ids.length; i++) {
            const metadata = result.metadatas[i];
            const source = metadata.source;
            
            if (!documentsBySource[source]) {
                documentsBySource[source] = {
                    chunks: [],
                    totalChunks: metadata.total_chunks
                };
            }
            
            documentsBySource[source].chunks.push({
                index: metadata.chunk_index,
                preview: result.documents[i].substring(0, 200)
            });
        }

        // Display organized results
        Object.entries(documentsBySource).forEach(([source, data]) => {
            console.log(`\nDocument Source: ${source}`);
            console.log(`Total Chunks: ${data.totalChunks}`);
            data.chunks.forEach(chunk => {
                console.log(`\nChunk ${chunk.index + 1}/${data.totalChunks}:`);
                console.log('Preview:', chunk.preview + '...');
            });
        });
    } catch (error) {
        console.error('Error viewing documents:', error);
    }
}

// Example usage:
viewStoredDocuments();