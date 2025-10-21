class PromptBuilder {
  /**
   * Build a RAG prompt with context and query
   * @param {string} query - User's question
   * @param {Array} retrievedChunks - Relevant document chunks
   * @param {Object} options - Prompt customization options
   * @returns {string} Formatted prompt
   */
  static buildRAGPrompt(query, retrievedChunks, options = {}) {
    const {
      includeMetadata = true,
      maxContextLength = 4000,
      instructionTemplate = "default",
    } = options;

    // Build context from retrieved chunks
    const context = this.buildContext(
      retrievedChunks,
      maxContextLength,
      includeMetadata
    );

    // Get instruction template
    const instruction = this.getInstructionTemplate(instructionTemplate);

    // Combine into final prompt
    const prompt = `${instruction}

Context Information:
${context}

Question: ${query}

Answer:`;

    return prompt;
  }

  /**
   * Build context section from chunks
   * @param {Array} chunks - Retrieved chunks
   * @param {number} maxLength - Maximum context length
   * @param {boolean} includeMetadata - Whether to include metadata
   * @returns {string} Formatted context
   */
  static buildContext(chunks, maxLength, includeMetadata) {
  let context = "";
  let currentLength = 0;

  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    return "No relevant context found.";
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    if (!chunk) {
      console.warn(`Chunk at index ${i} is null/undefined, skipping`);
      continue;
    }

    let chunkText = "";

    const chunkContent = chunk.text || chunk.content || "";
    
    if (!chunkContent) {
      console.warn(`Chunk ${i} has no text content, skipping`);
      continue;
    }

    if (includeMetadata) {
      const metadata = {
        chunkIndex: chunk.chunkIndex ?? i,
        documentId: chunk.documentId ?? "Unknown",
        fileName: chunk.filename ?? chunk.fileName ?? "Unknown",
        tokens: chunk.tokens ?? chunkContent.length,
        similarity: chunk.similarity
      };
      
      const metadataStr = this.formatMetadata(metadata, i + 1);
      chunkText = `${metadataStr}\n${chunkContent}`;
    } else {
      chunkText = chunkContent;
    }

    const chunkLength = chunkText.length;

    // Check if adding this chunk would exceed max length
    if (currentLength + chunkLength > maxLength) {
      break;
    }

    context += `\n\n--- Chunk ${i + 1} ---\n${chunkText}`;
    currentLength += chunkLength;
  }

  return context || "No relevant context found.";
}

  /**
   * Format metadata for a chunk
   * @param {Object} metadata - Chunk metadata
   * @param {number} chunkNumber - Chunk number for display
   * @returns {string} Formatted metadata string
   */
  static formatMetadata(metadata, chunkNumber) {
    const parts = [`[Chunk #${chunkNumber}]`];

    if (metadata.chunkIndex !== undefined) {
      parts.push(`Index: ${metadata.chunkIndex}`);
    }

    if (metadata.documentId) {
      parts.push(`Document: ${metadata.documentId}`);
    }

    if (metadata.fileName) {
      parts.push(`File: ${metadata.fileName}`);
    }

    if (metadata.page || metadata.pageNumber) {
      parts.push(`Page: ${metadata.page || metadata.pageNumber}`);
    }

    if (metadata.tokens) {
      parts.push(`Tokens: ${metadata.tokens}`);
    }

    if (metadata.similarity !== undefined) {
      parts.push(`Similarity: ${(metadata.similarity * 100).toFixed(1)}%`);
    }

    return parts.join(" | ");
  }

  /**
   * Get instruction template for different use cases
   * @param {string} templateName - Template name
   * @returns {string} Instruction text
   */
  static getInstructionTemplate(templateName) {
    const templates = {
      default: `You are an intelligent assistant helping users understand documents. Use the context information below to answer the question accurately and concisely. If the context doesn't contain enough information to answer the question fully, acknowledge what you don't know and provide what information you can based on the context.`,

      strict: `You are an assistant that answers questions strictly based on the provided context. Only use information from the context below. If the context does not contain the answer, respond with "I cannot answer this question based on the provided documents."`,

      creative: `You are a helpful assistant. Use the context below as a knowledge base, but feel free to provide comprehensive answers that go beyond the context when helpful. Always indicate when you're using information from the context versus general knowledge.`,

      citation: `You are an assistant that provides well-cited answers. Use the context information below to answer questions, and always cite which part of the context you're using (e.g., "According to Chunk #1..." or "As mentioned in Chunk #3..."). Include source references in your answer.`,

      detailed: `You are a thorough assistant that provides detailed, comprehensive answers. Use all relevant information from the context below. Break down complex topics into understandable explanations and provide examples where applicable.`,

      concise: `You are a concise assistant. Provide brief, direct answers based strictly on the context below. Keep responses short and to the point, typically 2-3 sentences unless more detail is absolutely necessary.`,
    };

    return templates[templateName] || templates.default;
  }

  /**
   * Build a conversational prompt with chat history
   * @param {string} query - Current user question
   * @param {Array} retrievedChunks - Relevant chunks
   * @param {Array} chatHistory - Previous conversation messages
   * @param {Object} options - Prompt options
   * @returns {string} Formatted conversational prompt
   */
  static buildConversationalPrompt(
    query,
    retrievedChunks,
    chatHistory = [],
    options = {}
  ) {
    const contextSection = this.buildContext(
      retrievedChunks,
      options.maxContextLength || 4000,
      options.includeMetadata !== false
    );

    const historySection =
      chatHistory.length > 0
        ? `\nPrevious Conversation:\n${this.formatChatHistory(chatHistory)}\n`
        : "";

    const instruction = this.getInstructionTemplate(
      options.instructionTemplate || "default"
    );

    return `${instruction}

Context Information:
${contextSection}
${historySection}
Current Question: ${query}

Answer:`;
  }

  /**
   * Format chat history for prompt
   * @param {Array} chatHistory - Array of chat messages
   * @returns {string} Formatted history
   */
  static formatChatHistory(chatHistory) {
    return chatHistory
      .slice(-5) // Only include last 5 messages to avoid context overflow
      .map((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        return `${role}: ${msg.content}`;
      })
      .join("\n");
  }

  /**
   * Extract and format source citations from chunks
   * @param {Array} chunks - Retrieved chunks
   * @returns {Array} Formatted citation objects
   */
  static formatSourceCitations(chunks) {
    return chunks.map((chunk, index) => ({
      id: index + 1,
      chunkIndex: chunk.chunkIndex || index,
      documentId: chunk.documentId || chunk.metadata?.documentId || "Unknown",
      fileName: chunk.metadata?.filename || "Unknown",
      page: chunk.metadata?.page || chunk.metadata?.pageNumber || "N/A",
      relevanceScore: chunk.score ? chunk.score.toFixed(4) : "N/A",
      preview: chunk.content.substring(0, 100) + "...", // First 100 chars as preview
    }));
  }

  /**
   * Build a prompt for summarization tasks
   * @param {Array} chunks - Document chunks to summarize
   * @param {string} summaryType - Type of summary (brief, detailed, bullets)
   * @returns {string} Summarization prompt
   */
  static buildSummarizationPrompt(chunks, summaryType = "brief") {
    const content = chunks.map((chunk) => chunk.text || chunk.content).join("\n\n");

    const summaryInstructions = {
      brief: "Provide a brief summary (2-3 paragraphs) of the main points.",
      detailed:
        "Provide a comprehensive, detailed summary covering all major topics and subtopics.",
      bullets:
        "Provide a bullet-point summary of the key points and takeaways.",
    };

    return `Please summarize the following content. ${
      summaryInstructions[summaryType] || summaryInstructions.brief
    }

Content:
${content}

Summary:`;
  }

  /**
   * Build a prompt for specific document analysis
   * @param {string} query - Analysis request
   * @param {Array} chunks - Document chunks
   * @param {string} analysisType - Type of analysis
   * @returns {string} Analysis prompt
   */
  static buildAnalysisPrompt(query, chunks, analysisType = "general") {
    const context = this.buildContext(chunks, 4000, true);

    const analysisInstructions = {
      general: "Analyze the content and provide insights.",
      comparison: "Compare and contrast the different aspects mentioned.",
      extraction: "Extract and list the specific information requested.",
      sentiment: "Analyze the tone and sentiment of the content.",
    };

    return `${
      analysisInstructions[analysisType] || analysisInstructions.general
    }

Context:
${context}

Analysis Request: ${query}

Analysis:`;
  }
}

module.exports = PromptBuilder;
