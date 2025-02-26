import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pdfParse from "pdf-parse";

import { createClient } from "@supabase/supabase-js";
import { CohereEmbeddings } from "@langchain/cohere";
import { HfInference } from '@huggingface/inference'
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 5000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_PRIVATE_KEY!;
const supabaseClient = createClient(supabaseUrl, supabaseKey);
const Cohere_API_KEY = process.env.COHERE_API_KEY!;
const HF_ACCESS_TOKEN = process.env.HUGGINGFACE_API_KEY!;

// Function to get embeddings from Hugging Face


// const generateEmbeddings = async (text: string, retries = 3, delay = 2000): Promise<number[] | null> => {
//     console.log(HF_ACCESS_TOKEN)
//     for (let i = 0; i < retries; i++) {
//         try {
//             const response = await fetch("https://router.huggingface.co/hf-inference/models/jinaai/jina-embeddings-v2-base-en", {
//                 method: "POST",
//                 headers: {
//                     "Authorization": `Bearer ${HF_ACCESS_TOKEN}`,
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({ inputs: text })
//             });

//             if (response.status === 503) {
//                 console.warn(`Hugging Face API is temporarily unavailable. Retrying in ${delay}ms...`);
//                 await new Promise(res => setTimeout(res, delay));
//                 continue; // Retry request
//             }

//             if (!response.ok) {
//                 throw new Error(`Embedding API failed: ${response.statusText}`);
//             }

//             const result = await response.json();
//             return result[0]; // Extract the embedding vector
//         } catch (error) {
//             console.error(`Error generating embeddings (attempt ${i + 1}):`, error);
//             await new Promise(res => setTimeout(res, delay)); // Wait before retrying
//         }
//     }

//     console.error("Max retries reached. Hugging Face API unavailable.");
//     return null;
// };


const generateEmbeddings = async (text: string, retries = 3, delay = 2000): Promise<number[] | null> => {
    console.log(HF_ACCESS_TOKEN)
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch("https://router.huggingface.co/hf-inference/models/mixedbread-ai/mxbai-embed-large-v1", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${HF_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ inputs: text })
            });

            if (response.status === 503) {
                console.warn(`Hugging Face API is temporarily unavailable. Retrying in ${delay}ms...`);
                await new Promise(res => setTimeout(res, delay));
                continue; // Retry request
            }

            if (!response.ok) {
                throw new Error(`Embedding API failed: ${response.statusText}`);
            }

            const result = await response.json();

            // Debug the response format
            console.log("API Response type:", typeof result);
            console.log("API Response structure:", JSON.stringify(result).substring(0, 100) + "...");

            // Handle different response formats
            if (Array.isArray(result)) {
                // If result is already an array of numbers, return it
                if (typeof result[0] === 'number') {
                    return result;
                }
                // If result is an array containing an array of numbers
                else if (Array.isArray(result[0])) {
                    return result[0];
                }
            }

            // If result is an object with embeddings
            if (result && typeof result === 'object' && 'embeddings' in result) {
                return result.embeddings;
            }

            // Return the result directly - modify this in your document insert logic
            return result;
        } catch (error) {
            console.error(`Error generating embeddings (attempt ${i + 1}):`, error);
            await new Promise(res => setTimeout(res, delay)); // Wait before retrying
        }
    }

    console.error("Max retries reached. Hugging Face API unavailable.");
    return null;
};






app.post("/ingest", async (req: express.Request, res: express.Response): Promise<void> => {
    const { pdfBase64, filename, user_id, notebook_id } = req.body;

    if (!pdfBase64 || !filename || !user_id || !notebook_id) {
        res.status(400).json({ message: "Missing fields." });
        return;
    }

    console.log("Received PDF:", filename, "from user:", user_id);

    try {
        const pdfBuffer = Buffer.from(pdfBase64, "base64");
        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text.trim();

        if (!text) {
            res.status(400).json({ message: "No text extracted from PDF." });
            return;
        }

        console.log("Generating embeddings...");
        // const vector = await generateEmbeddings(text);
        // const embeddings = new CohereEmbeddings({
        //     model: "embed-english-v3.0",
        //     apiKey: Cohere_API_KEY
        // });
        // const vector = await embeddings.embedQuery(text);
        const vector = await generateEmbeddings(text);
        if (!vector) {
            res.status(500).json({ message: "Error generating embeddings." });
            return;
        }

        // Check how to process the vector correctly depending on its format
        let embeddingString;
        if (Array.isArray(vector)) {
            embeddingString = `[${vector.join(",")}]`;
        } else if (typeof vector === 'object') {
            // If vector is an object, convert it to string in the appropriate format
            embeddingString = JSON.stringify(vector);
        } else {
            console.error("Unexpected embedding format:", vector);
            res.status(500).json({ message: "Error processing embeddings format." });
            return;
        }

        const { error } = await supabaseClient.from("documents").insert({
            user_id,
            notebook_id,
            content: text,
            metadata: { filename },
            embedding: embeddingString,
            filename, // Save the filename
        });

        if (error) {
            console.error("Error inserting document:", error);
            res.status(500).json({ message: "Error inserting document." });
            return;
        }

        res.status(200).json({ message: "Document uploaded successfully." });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Error processing document." });
    }
});






app.get("/documents", async (req: express.Request, res: express.Response): Promise<void> => {
    const { user_id, notebook_id } = req.query;

    if (!user_id || !notebook_id) {
        console.log(res.status(400).json({ message: "Missing user_id or notebook_id." }));
    }

    const { data, error } = await supabaseClient
        .from("documents")
        .select("id, filename")
        .eq("user_id", user_id)
        .eq("notebook_id", notebook_id);

    if (error) {
        console.error("Error fetching documents:", error);
        console.log(res.status(500).json({ message: "Error fetching documents." }));
    }

    res.status(200).json(data);
});



app.delete("/documents/:id", async (req: express.Request, res: express.Response): Promise<void> => {
    const { id } = req.params;

    const { error } = await supabaseClient.from("documents").delete().eq("id", id);

    if (error) {
        console.error("Error deleting document:", error);
        console.log(res.status(500).json({ message: "Error deleting document." }));
    }

    res.status(200).json({ message: "Document deleted successfully." });
});



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});






