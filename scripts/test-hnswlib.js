// test-hnswlib.js
const hnswlib = require("hnswlib-node");

const main = async () => {
  try {
    const dim = 128; // Dimension of embeddings
    const numElements = 1000; // Number of elements

    const index = new hnswlib.Index("cosine", dim);
    index.initIndex(numElements);

    console.log("hnswlib-node initialized successfully.");
  } catch (error) {
    console.error("Error initializing hnswlib-node:", error);
  }
};

main();
