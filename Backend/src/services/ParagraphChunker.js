export class ParagraphChunker {
  constructor(options = {}) {
    // Core configuration
    this.maxTokens = options.maxTokens || 1000;
    this.minTokens = options.minTokens || 100;
    this.overlapTokens = options.overlapTokens || 50;
    this.combineThreshold = options.combineThreshold || 200;
  }

  /**
   * Main chunking method
   * @param {string} text - Input text to chunk
   * @param {Object} metadata - Optional metadata to attach to chunks
   * @returns {Object} - Result with chunks and processing info
   */
  async chunk(text, metadata = {}) {
    if (!text || typeof text !== "string") {
      throw new Error("Valid text string is required");
    }

    const startTime = Date.now();

    try {
      // Step 1: Clean and normalize text
      const cleanedText = this._preprocessText(text);

      // Step 2: Split into paragraphs
      const paragraphs = this._extractParagraphs(cleanedText);

      // Step 3: Process paragraphs (combine small, split large)
      const processedParagraphs = this._optimizeParagraphs(paragraphs);

      // Step 4: Create final chunks with overlap
      const chunks = this._buildChunks(processedParagraphs);

      // Step 5: Add metadata and return
      return this._packageResults(chunks, metadata, {
        originalLength: text.length,
        cleanedLength: cleanedText.length,
        paragraphCount: paragraphs.length,
        processingTime: Date.now() - startTime,
      });
    } catch (error) {
      throw new Error(`Chunking failed: ${error.message}`);
    }
  }

  /**
   * Clean text and normalize whitespace
   */
  _preprocessText(text) {
    return text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\t/g, " ") // Convert tabs to spaces
      .replace(/ +/g, " ") // Multiple spaces to single
      .replace(/\n +/g, "\n") // Remove leading whitespace after newlines
      .replace(/\n{3,}/g, "\n\n") // Max 2 consecutive newlines
      .trim();
  }

  /**
   * Extract paragraphs from text using multiple strategies
   */
  _extractParagraphs(text) {
    // Strategy 1: Standard paragraph breaks (double newlines)
    let paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Strategy 2: If no clear paragraphs, try single newlines with heuristics
    if (paragraphs.length <= 1) {
      paragraphs = this._splitBySingleNewlines(text);
    }

    // Strategy 3: Fallback to sentence grouping
    if (paragraphs.length <= 1) {
      paragraphs = this._createParagraphsFromSentences(text);
    }

    return paragraphs.map((text, index) => ({
      id: `para_${index}`,
      text,
      tokens: this._estimateTokens(text),
      index,
    }));
  }

  _splitBySingleNewlines(text) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const paragraphs = [];
    let currentParagraph = "";

    for (const line of lines) {
      // Heuristics for paragraph boundaries
      const isNewParagraph =
        line.match(/^[A-Z]/) && // Starts with capital
        currentParagraph.match(/[.!?]\s*$/) && // Previous ends with punctuation
        line.length > 20; // Reasonable length

      if (isNewParagraph && currentParagraph) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = line;
      } else {
        currentParagraph += (currentParagraph ? " " : "") + line;
      }
    }

    if (currentParagraph) {
      paragraphs.push(currentParagraph.trim());
    }

    return paragraphs;
  }

  _createParagraphsFromSentences(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const paragraphs = [];
    let currentParagraph = "";

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      const combined =
        currentParagraph + (currentParagraph ? " " : "") + trimmedSentence;

      if (
        this._estimateTokens(combined) > this.combineThreshold &&
        currentParagraph
      ) {
        paragraphs.push(currentParagraph);
        currentParagraph = trimmedSentence;
      } else {
        currentParagraph = combined;
      }
    }

    if (currentParagraph) {
      paragraphs.push(currentParagraph);
    }

    return paragraphs;
  }

  /**
   * Optimize paragraphs by combining small ones and splitting large ones
   */
  _optimizeParagraphs(paragraphs) {
    const optimized = [];
    let i = 0;

    while (i < paragraphs.length) {
      const paragraph = paragraphs[i];

      if (paragraph.tokens > this.maxTokens) {
        // Split large paragraph
        const splitChunks = this._splitLargeParagraph(paragraph);
        optimized.push(...splitChunks);
        i++;
      } else if (
        paragraph.tokens < this.minTokens &&
        i < paragraphs.length - 1
      ) {
        // Try to combine small paragraphs
        const combined = this._combineConsecutiveParagraphs(paragraphs, i);
        optimized.push(combined.result);
        i = combined.nextIndex;
      } else {
        // Paragraph is good as-is
        optimized.push(paragraph);
        i++;
      }
    }

    return optimized;
  }

  _splitLargeParagraph(paragraph) {
    // Split by sentences while maintaining context
    const sentences = paragraph.text.match(/[^.!?]+[.!?]+/g) || [
      paragraph.text,
    ];
    const chunks = [];
    let currentText = "";
    let sentenceCount = 0;

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      const combined = currentText + (currentText ? " " : "") + trimmedSentence;

      if (this._estimateTokens(combined) > this.maxTokens && currentText) {
        // Create chunk and start new one
        chunks.push({
          id: `${paragraph.id}_split_${chunks.length}`,
          text: currentText,
          tokens: this._estimateTokens(currentText),
          index: paragraph.index,
          isSplit: true,
          splitPart: chunks.length + 1,
          sentenceCount,
        });

        currentText = trimmedSentence;
        sentenceCount = 1;
      } else {
        currentText = combined;
        sentenceCount++;
      }
    }

    // Add final chunk
    if (currentText) {
      chunks.push({
        id: `${paragraph.id}_split_${chunks.length}`,
        text: currentText,
        tokens: this._estimateTokens(currentText),
        index: paragraph.index,
        isSplit: true,
        splitPart: chunks.length + 1,
        sentenceCount,
      });
    }

    return chunks;
  }

  _combineConsecutiveParagraphs(paragraphs, startIndex) {
    let combinedText = paragraphs[startIndex].text;
    let totalTokens = paragraphs[startIndex].tokens;
    let endIndex = startIndex;
    const combinedIds = [paragraphs[startIndex].id];

    // Look ahead and combine
    for (let j = startIndex + 1; j < paragraphs.length; j++) {
      const nextParagraph = paragraphs[j];
      const potentialText = combinedText + "\n\n" + nextParagraph.text;
      const potentialTokens = this._estimateTokens(potentialText);

      if (potentialTokens <= this.maxTokens) {
        combinedText = potentialText;
        totalTokens = potentialTokens;
        endIndex = j;
        combinedIds.push(nextParagraph.id);

        // Stop if we've reached a good size
        if (totalTokens >= this.minTokens) {
          break;
        }
      } else {
        break;
      }
    }

    return {
      result: {
        id: `combined_${combinedIds.join("_")}`,
        text: combinedText,
        tokens: totalTokens,
        index: startIndex,
        isCombined: endIndex > startIndex,
        combinedFrom: combinedIds,
        combinedCount: endIndex - startIndex + 1,
      },
      nextIndex: endIndex + 1,
    };
  }

  /**
   * Build final chunks with overlap
   */
  _buildChunks(paragraphs) {
    const chunks = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      let finalText = paragraph.text;
      let overlapInfo = null;

      // Add overlap from previous chunk
      if (i > 0 && this.overlapTokens > 0) {
        const overlapText = this._extractOverlap(
          chunks[chunks.length - 1].text
        );
        if (overlapText && overlapText.length > 10) {
          // Minimum overlap length
          finalText = overlapText + "\n\n" + paragraph.text;
          overlapInfo = {
            text: overlapText,
            tokens: this._estimateTokens(overlapText),
            fromChunk: chunks[chunks.length - 1].id,
          };
        }
      }

      const chunk = {
        id: paragraph.id,
        text: finalText,
        tokens: this._estimateTokens(finalText),
        originalTokens: paragraph.tokens,
        overlap: overlapInfo,
        metadata: {
          originalIndex: paragraph.index,
          isSplit: paragraph.isSplit || false,
          isCombined: paragraph.isCombined || false,
          splitPart: paragraph.splitPart || null,
          combinedCount: paragraph.combinedCount || 1,
        },
      };

      chunks.push(chunk);
    }

    return chunks;
  }

  _extractOverlap(previousText) {
    const words = previousText.split(/\s+/);
    const targetWordCount = Math.min(
      Math.floor(this.overlapTokens * 0.75), // Convert tokens to approximate words
      Math.floor(words.length * 0.2), // Max 20% of previous chunk
      30 // Absolute maximum
    );

    if (targetWordCount <= 0) return "";

    const overlapWords = words.slice(-targetWordCount);

    // Try to end at sentence boundary if possible
    const overlapText = overlapWords.join(" ");
    const lastSentenceEnd = overlapText.lastIndexOf(".");

    if (lastSentenceEnd > overlapText.length * 0.5) {
      return overlapText.substring(0, lastSentenceEnd + 1);
    }

    return overlapText;
  }

  _packageResults(chunks, metadata, processingInfo) {
    return chunks.map((chunk, index) => ({
      ...chunk,
      chunkIndex: index,
      globalMetadata: {
        ...metadata,
        strategy: "paragraph",
        ...processingInfo,
      },
      navigation: {
        isFirst: index === 0,
        isLast: index === chunks.length - 1,
        previousChunk: index > 0 ? chunks[index - 1].id : null,
        nextChunk: index < chunks.length - 1 ? chunks[index + 1].id : null,
      },
    }));
  }

  /**
   * Rough token estimation (4 chars ≈ 1 token)
   */
  _estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
}
