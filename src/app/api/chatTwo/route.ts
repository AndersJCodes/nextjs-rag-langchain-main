// src/pages/api/chat.ts
import {
  Message as VercelChatMessage,
  StreamingTextResponse,
  createStreamDataTransformer,
} from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";

import { getVectorStore } from "../../../utils/hnswlibClient";

export const dynamic = "force-dynamic";

/**
 * Basic memory formatter that stringifies and passes
 * message history directly into the model.
 */
const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `Answer the user's questions based primarily on the info in the context. If the answer is not in the context, see if you can find it elsewhere as long as it has to do with föreningar in sundsvall or similar. If the user asks for more information about a förening, see what you know about it, however try to use only information available to you, dont make it up if you dont know it. Please answer in Swedish.:
    ==============================
    Context: {context}
    ==============================
    Current conversation: {chat_history}
    
    user: {question}
    assistant:`;

export async function POST(req: Request) {
  try {
    // Extract the `messages` from the body of the request
    const { messages } = await req.json();

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Invalid input: messages are required." },
        { status: 400 }
      );
    }

    const formattedPreviousMessages = messages
      .slice(0, -1)
      .map(formatMessage)
      .join("\n");

    const currentMessageContent = messages[messages.length - 1].content;

    // Extract the number of documents to retrieve from the user's prompt
    /*     const numberOfDocumentsMatch =
      currentMessageContent.match(/(\d+)\s*clubs?/i);
    const topK = numberOfDocumentsMatch
      ? parseInt(numberOfDocumentsMatch[1], 10)
      : 5; */

    // Initialize and load the HNSWLib vector store
    const vectorStore = await getVectorStore();

    // Perform similarity search to retrieve top K documents
    const topK = 20;
    const similaritySearchResults = await vectorStore.similaritySearch(
      currentMessageContent,
      topK
    );

    // Convert retrieved documents to string context
    const context = formatDocumentsAsString(similaritySearchResults);

    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    const model = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      model: "gpt-4",
      temperature: 0,
      streaming: true,
      verbose: true,
    });

    /**
     * Chat models stream message chunks rather than bytes, so this
     * output parser handles serialization and encoding.
     */
    const parser = new HttpResponseOutputParser();

    const chain = RunnableSequence.from([
      {
        question: (input: any) => input.question,
        chat_history: (input: any) => input.chat_history,
        context: () => context,
      },
      prompt,
      model,
      parser,
    ]);

    // Convert the response into a friendly text-stream
    const stream = await chain.stream({
      chat_history: formattedPreviousMessages,
      question: currentMessageContent,
    });

    // Respond with the stream
    return new StreamingTextResponse(
      stream.pipeThrough(createStreamDataTransformer())
    );
  } catch (e: any) {
    console.error("Error in POST /api/chat:", e);
    return Response.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
