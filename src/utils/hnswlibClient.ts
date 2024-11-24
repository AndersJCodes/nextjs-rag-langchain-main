// src/utils/hnswlibClient.ts
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "@langchain/openai";
import path from "path";

// Initialize a singleton for the vector store
let vectorStore: HNSWLib | null = null;

/**
 * Dynamically imports hnswlib-node and initializes the vector store.
 */
export const getVectorStore = async (): Promise<HNSWLib> => {
  if (!vectorStore) {
    // Dynamically import hnswlib-node
    const hnswlibModule = await import("hnswlib-node");
    const { HierarchicalNSW } = hnswlibModule;

    // Initialize embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      model: "text-embedding-ada-002", // Ensure consistency with embedding creation
    });

    // Define the path to the vector store
    const vectorStorePath = path.join(process.cwd(), "src/data/hnswlib_subset");
    try {
      // Load the vector store using LangChain's HNSWLib
      vectorStore = await HNSWLib.load(vectorStorePath, embeddings);
      console.log("Vector store loaded successfully.");
    } catch (error) {
      console.error("Failed to load the vector store:", error);
      throw new Error("Vector store loading failed.");
    }
  }
  return vectorStore;
};
