// scripts/recreateVectorStore.ts
import dotenv from "dotenv";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "@langchain/openai";
import path from "path";
import fs from "fs/promises";
import Bottleneck from "bottleneck"; // For rate limiting
import pRetry from "p-retry"; // For retrying failed attempts

dotenv.config({ path: ".env.local" });

const recreateVectorStore = async () => {
  try {
    // Initialize OpenAI Embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      model: "text-embedding-ada-002", // Ensure this matches the model used during embedding creation
    });

    // Define paths
    const dataDir = path.join(process.cwd(), "src/data");
    const clubsPath = path.join(dataDir, "clubs_subset.json"); // Use the subset
    const vectorStoreDir = path.join(dataDir, "hnswlib_subset"); // New directory to save the vector store

    // Read clubs data
    const clubsData = JSON.parse(await fs.readFile(clubsPath, "utf8"));

    // Create Document objects with metadata
    const documents = clubsData.map((club: any) => ({
      pageContent: `${club.name} is located in ${club.municipality}. It caters to ages ${club.agerange} and focuses on ${club.category} activities.`,
      metadata: {
        id: club.id,
        name: club.name,
        url: club.url,
        municipality: club.municipality,
        agerange: club.agerange,
        area: club.area,
        category: club.category,
        activity: club.activity,
      },
    }));

    // Initialize HNSWLib Vector Store
    const vectorStore = new HNSWLib(embeddings, { space: "cosine" });

    // Initialize Bottleneck for rate limiting
    const limiter = new Bottleneck({
      maxConcurrent: 5, // Number of concurrent requests
      minTime: 200, // Minimum time between requests in ms
    });

    // Function to add a single document with retry logic
    const addDocumentWithRetry = async (document: any) => {
      await pRetry(
        async () => {
          await vectorStore.addDocuments([document]);
          console.log(`Added document: ${document.metadata.name}`);
        },
        {
          onFailedAttempt: (error) => {
            console.warn(
              `Attempt ${error.attemptNumber} failed for document ${document.metadata.name}. ${error.retriesLeft} retries left.`
            );
          },
          retries: 5, // Number of retries
          factor: 2, // Exponential backoff factor
          minTimeout: 1000, // Minimum wait time between retries in ms
        }
      );
    };

    console.log(
      "Adding documents to the vector store with rate limiting and retries..."
    );

    // Schedule adding documents through the limiter
    const promises = documents.map((document: any) =>
      limiter.schedule(() => addDocumentWithRetry(document))
    );

    await Promise.all(promises);

    console.log("All documents added successfully.");

    // Save the vector store to the specified directory
    console.log(`Saving the vector store to ${vectorStoreDir}...`);
    await vectorStore.save(vectorStoreDir);
    console.log(`Vector store saved to ${vectorStoreDir}`);
  } catch (error) {
    console.error("Error recreating vector store:", error);
    process.exit(1);
  }
};

recreateVectorStore();
