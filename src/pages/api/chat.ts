import type { NextApiRequest, NextApiResponse } from "next";
import { ChatMistralAI } from "@langchain/mistralai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
    BaseRetriever,
    type BaseRetrieverInput,
} from "@langchain/core/retrievers";
import { Document } from "langchain/document";

type Data = { answer: string };

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_PRIVATE_KEY!;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Custom retriever class that implements BaseRetriever

export interface CustomRetrieverInput extends BaseRetrieverInput { }
class CustomRetriever extends BaseRetriever {
    lc_namespace = ["langchain", "retrievers"];
    private documents: Document[];

    constructor(documents: Document[]) {
        super();
        this.documents = documents;
    }

    async getRelevantDocuments(): Promise<Document[]> {
        return this.documents;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method !== "POST") {
        return res.status(405).end("Method not allowed");
    }
    const { question, chat_history, user_id, notebook_id } = req.body;
    if (!question || !user_id || !notebook_id) {
        return res.status(400).json({ answer: "Missing question, user_id, or notebook_id" });
    }

    try {
        // 1. Embed the user question
        const embeddingsModel = new OpenAIEmbeddings();
        const queryEmbedding = await embeddingsModel.embedQuery(question);

        // 2. Call the custom Postgres function match_documents
        const { data, error } = await supabaseClient.rpc("match_documents", {
            query_embedding: queryEmbedding,
            match_count: 5,
            filter_user_id: user_id,
            filter_notebook_id: notebook_id,
        });
        if (error) {
            console.error("Error calling match_documents:", error);
            return res.status(500).json({ answer: "Error retrieving documents." });
        }

        // 3. Create Documents from the returned rows
        const docs = (data || []).map((row: any) =>
            new Document({
                pageContent: row.content,
                metadata: row.metadata,
            })
        );

        // 4. Build a chain with a Mistral LLM
        const llm = new ChatMistralAI({
            model: "mistral-large-latest",
            temperature: 0,
            maxRetries: 2,
            apiKey: process.env.MISTRAL_API_KEY || "your-mistral-api-key",
        });

        const prompt = ChatPromptTemplate.fromTemplate(`
Answer the user's question based on the following context:
{context}
Question: {input}
`);

        const combineDocsChain = await createStuffDocumentsChain({ llm, prompt });

        // 5. Create a proper retriever instance and combine it with the chain
        const retriever = new CustomRetriever(docs);
        const retrievalChain = await createRetrievalChain({
            combineDocsChain,
            retriever,
        });

        const result = await retrievalChain.invoke({
            input: question,
            chat_history: chat_history || [],
        });

        return res.status(200).json({ answer: (result.text as string) || (result.result as string) });
    } catch (err) {
        console.error("Chat error:", err);
        return res.status(500).json({ answer: "Error generating answer." });
    }
}