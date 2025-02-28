import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { MistralAI } from "@langchain/mistralai";
import { ChatMistralAI } from "@langchain/mistralai"
import { PromptTemplate } from "@langchain/core/prompts"
import { queryObjects } from "node:v8";



dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_PRIVATE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const HF_ACCESS_TOKEN = process.env.HUGGINGFACE_API_KEY!;
// Initialize Mistral AI
const llm = new ChatMistralAI({
    model: "mistral-large-latest",  // Ensure correct model
    temperature: 0,
    maxRetries: 2,
});

const SERVER_URL = "http://localhost:5000"; // Ensure this matches your server.ts host and port




/**
 * Retrieve relevant documents from Supabase using vector search
 */
const retrieveDocuments = async (queryEmbedding: number[], userId?: string, notebookId?: string, topK: number = 3) => {
    try {
        const { data, error } = await supabase.rpc("match_documents", {
            query_embedding: queryEmbedding,
            match_count: topK,
            filter_user_id: userId || null,
            filter_notebook_id: notebookId || null
        });

        if (error) {
            console.error("Error retrieving documents:", error);
            return [];
        }

        return data.map((doc: any) => doc.content).join("\n\n");
    } catch (error) {
        console.error("Error in document retrieval:", error);
        return "";
    }
};

/**
 * Generate response using Mistral AI
 */
const generateChatResponse = async (query: string, context: string) => {
    try {
        const messages = [
            { role: "system", content: "You are a helpful AI assistant." },
            { role: "user", content: `Context:\n${context}\n\nUser Query: ${query}` }
        ];

        const prompt = PromptTemplate.fromTemplate(
            `Your our Friendly Teacher or Mentor to a student with professor-level knowledge in this field.\n\nContext:\n${context}\n\nReply and explain the following query in a way that a student can understand:\n\n${query}\n`
        );
        const chain = prompt.pipe(llm);
        const response = await chain.invoke({
            output_language: "English",
            input: prompt,
        });
        let contentStr = "";
        if (typeof response.content === 'string') {
            contentStr = response.content;
        } else if (Array.isArray(response.content)) {
            // Extract text from complex content array
            contentStr = response.content
                .map(item => {
                    if (typeof item === 'string') return item;
                    if (item.type === 'text') return item.text;
                    return '';
                })
                .join('');
        }
        // console.log("API Response:", contentStr);
        // return response.content;
        return contentStr
    } catch (error) {
        console.error("Error generating chat response:", error);
        return "I'm sorry, I couldn't process your request.";
    }
};

/**
 * Chat endpoint
 */
app.post("/chat", async (req: express.Request, res: express.Response): Promise<void> => {
    const { query, user_id, notebook_id } = req.body;

    if (!query) {
        console.log(res.status(400).json({ message: "Missing query." }));
    }

    try {
        console.log("Generating query embedding...");
        // const embeddingResponse = await generateEmbeddings(query);

        const embeddingResponse = await fetch(`${SERVER_URL}/generate-embedding`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: query })
        })
            .then(async res => {
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Server Error: ${res.status} - ${errorText}`);
                }
                return res.json();
            })
            .then(data => data.embedding)
            .catch(err => {
                console.error("Error fetching embedding:", err);
                return null;
            });
        if (!embeddingResponse || !Array.isArray(embeddingResponse)) {
            console.log(res.status(500).json({ message: "Failed to generate embeddings." }));
        }

        const queryEmbedding = embeddingResponse as number[];

        console.log("Retrieving relevant documents...");
        const context = await retrieveDocuments(queryEmbedding, user_id, notebook_id);

        console.log("Generating AI response...");
        const response = await generateChatResponse(query, context);

        res.status(200).json({ response });
    } catch (error) {
        console.error("Error processing chat request:", error);
        res.status(500).json({ message: "Error processing chat request." });
    }
});

app.listen(PORT, () => {
    console.log(`Chat server running on port ${PORT}`);
});
