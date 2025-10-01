let extractor = null;

// Lazy load Xenova transformers pipeline (dynamic import in CommonJS)
async function loadModel() {
  if (!extractor) {
    const { pipeline } = await import("@xenova/transformers");
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
}

// Create embeddings
async function getEmbeddings(textChunks) {
  const model = await loadModel();
  const results = [];

  for (const chunk of textChunks) {
    const output = await model(chunk.text, {
      pooling: "mean",
      normalize: true,
    });

    results.push({
      id: chunk.id,
      text: chunk.text,
      embedding: Array.from(output.tolist()[0]),
      metadata: chunk.metadata,
      navigation: chunk.navigation,
    });
  }

  return results; // array of { id, text, embedding, metadata, navigation }
}

module.exports = { getEmbeddings };
