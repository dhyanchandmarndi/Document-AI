import { ChromaClient } from "chromadb";
// import {}

const client = new ChromaClient({
  host: "localhost",
  port: 8000,
});

export async function storeEmbeddings(embeddings) {
  const collection = await client.getOrCreateCollection({
    name: "my-collection",
    embeddingFunction: null,
  });

  const documents = embeddings.map((e) => e.text);
  const vectors = embeddings.map((e) => e.embedding);

  const ids = embeddings.map((e, i) => e.id || `chunk_${i}`);

  console.log("📌 Debug before insert:");
  console.log("Documents:", documents.length);
  console.log("Embeddings:", vectors.length);
  console.log("IDs:", ids.length);

  await collection.add({
    documents,
    embeddings: vectors,
    ids,
  });

  console.log(`✅ Stored ${embeddings.length} embeddings in ChromaDB`);

  const results = await collection.query({
    queryEmbeddings: [vectors[0]], // reuse one embedding for test
    nResults: 2,
  });
  console.log("🔎 Query results:", results);
}
