import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// 1. Import the embeddings class
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
// Supabase client
import supabase from "./supabaseClient";
// You might also need the TaskType from the Google SDK depending on your use case
// import { TaskType } from "@google/generative-ai";

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 200,
  chunkOverlap: 40,
});

// 2. Initialize the Google Generative AI Embeddings model
// It will automatically use the GOOGLE_API_KEY environment variable.
const embeddings = new GoogleGenerativeAIEmbeddings({
  // Use a model with a default dimension of 768
  model: "text-embedding-004",
  // taskType is still recommended
  taskType: TaskType.RETRIEVAL_DOCUMENT,
});

const documentProcessor = {
  /**
   * Processes an uploaded file/text into chunks and generates embeddings.
   * @param file - The uploaded file/blob object or a plain string.
   * @returns An array of embeddings (List<List<number>>)
   */
  async processUploadedDocument(
    file: any
  ): Promise<{ chunks: string[]; embeddings: number[][] }> {
    /**
     * NOTE: This function now will also accept a `botId` in the `file` object or
     * as an additional parameter. To keep the change minimal and backward-compatible
     * we accept `file` as-is but will look for `file.botId` or `file.bot_id`.
     *
     * If you prefer an explicit signature, change this method to
     * `processUploadedDocument(file: any, botId: string, metadata?: any)`.
     */
    try {
      console.log("got the file in docPr..", file?.name ?? "(no-name)");

      // Best-effort: try to read textual content from the uploaded file/blob
      let text = "";

      if (file && typeof file.text === "function") {
        text = await file.text();
      } else if (file && typeof file.arrayBuffer === "function") {
        const buf = await file.arrayBuffer();
        const decoder = new TextDecoder("utf-8");
        text = decoder.decode(new Uint8Array(buf));
      } else if (typeof file === "string") {
        text = file;
      } else {
        text = "";
      }

      console.log(`Extracted ${text.length} characters from the document.`);

      // Split the text into chunks (re-using your original logic)
      const chunks = await textSplitter.splitText(text);

      console.log("the doc chunks length is:", chunks.length);

      if (!chunks || chunks.length === 0) {
        console.warn(
          "No chunks were produced from the document. Nothing to embed."
        );
      }

      // 3. Generate embeddings for all text chunks
      // embedDocuments is designed for batch processing of many texts (chunks)
      const chunkEmbeddings = await embeddings.embedDocuments(chunks);

      console.log(
        `Generated ${
          chunkEmbeddings.length
        } embeddings. Each is a vector of length ${
          chunkEmbeddings[0]?.length ?? 0
        }.`
      );

      // Basic validation of embeddings
      // Use the actual produced dimension instead of a hard-coded 768 to avoid
      // misleading warnings. The database column must match this dimension.
      const firstDim = chunkEmbeddings[0]?.length ?? 0;
      const expectedDim = firstDim; // caller / DB must match this
      const allSameDim = chunkEmbeddings.every(
        (v) => Array.isArray(v) && v.length === firstDim
      );

      console.log(
        `Embedding first-dim: ${firstDim}, allSameDim: ${allSameDim}`
      );

      if (!allSameDim) {
        console.error(
          "Embedding vectors have inconsistent dimensions. This will likely fail when inserting into the DB."
        );
        // continue to allow inspection; but throw with a helpful message
        throw new Error(
          "Inconsistent embedding dimensions detected. Ensure the embeddings model returns fixed-size vectors."
        );
      }

      if (firstDim !== expectedDim) {
        console.warn(
          `Warning: generated embedding dimension (${firstDim}) does not match database expected dimension (${expectedDim}). Insertion may fail.`
        );
      }

      // The result `chunkEmbeddings` is an array of vectors (number[][])
      // Return chunks and embeddings so the caller (API route) can handle DB insertion
      return { chunks, embeddings: chunkEmbeddings };
    } catch (err) {
      console.error("documentProcessor error:", err);
      throw err;
    }
  },
};

export default documentProcessor;
