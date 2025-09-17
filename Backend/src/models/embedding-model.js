import { pipeline } from "@xenova/transformers";

let extractor = null;

// Initialize model once
const loadModel = async () => {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
};

// create embeddings
export const getEmbeddings = async (textChunks) => {
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
};
