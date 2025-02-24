import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pdfParse from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@supabase/supabase-js";
import { CohereEmbeddings } from "@langchain/cohere";
import { v4 as uuidValidate } from "uuid";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 5000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_PRIVATE_KEY!;
const supabaseClient = createClient(supabaseUrl, supabaseKey);
const Cohere_API_KEY = process.env.COHRE_API_KEY!;


// Function to get embeddings from Hugging Face


// Endpoint to ingest PDF into Supabase
app.post("/ingest", async (req: express.Request, res: express.Response): Promise<void> => {
    const { pdfBase64, filename, user_id, notebook_id } = req.body;

    // Validate UUIDs
    if (!pdfBase64 || !filename || !user_id || !notebook_id) {
        res.status(400).json({ message: "Missing fields." });
        return;
    }
    console.log("Received PDF for user:", user_id, "Notebook:", notebook_id);
    try {
        console.log("Processing PDF:", filename);

        const pdfBuffer = Buffer.from(pdfBase64, "base64");
        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text;

        if (!text.trim()) {
            res.status(400).json({ message: "No text extracted from PDF." });
            return;
        }

        console.log("Splitting text into chunks...");
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const chunks = await splitter.splitText(text);
        console.log(`Created ${chunks.length} chunks`);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`Processing chunk ${i + 1}/${chunks.length}`);

            try {
                const embeddings = new CohereEmbeddings({
                    model: "embed-english-v3.0",
                    apiKey: Cohere_API_KEY
                });
                const vector = await embeddings.embedQuery(chunk);
                console.log(vector.length)
                // Format vector properly for Supabase
                const formattedEmbedding = `[${vector.join(",")}]`;

                const { error } = await supabaseClient.from("documents").insert({
                    user_id,
                    notebook_id,
                    content: chunk,
                    metadata: { filename, chunk_index: i },
                    embedding: formattedEmbedding,
                });

                if (error) {
                    console.error(`Error inserting chunk ${i}:`, error);
                }
            } catch (error) {
                console.error(`Error processing chunk ${i}:`, error);
            }
        }

        res.status(200).json({
            message: "Document ingested successfully.",
            chunks_processed: chunks.length
        });
    } catch (err) {
        console.error("Ingestion error:", err);
        res.status(500).json({
            message: "Error ingesting PDF.",
            error: err instanceof Error ? err.message : "Unknown error"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
