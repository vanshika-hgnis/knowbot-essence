// pages/api/ingest.ts
import type { NextApiRequest, NextApiResponse } from "next";
import pdfParse from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "@langchain/openai";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_PRIVATE_KEY!;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

type Data = { message: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { pdfBase64, filename, user_id, notebook_id } = req.body;
    if (!pdfBase64 || !filename || !user_id || !notebook_id) {
        return res.status(400).json({ message: "Missing fields." });
    }

    try {
        // 1. Convert PDF from base64 to Buffer
        const pdfBuffer = Buffer.from(pdfBase64, "base64");
        // 2. Extract text
        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text;
        if (!text.trim()) {
            return res.status(400).json({ message: "No text extracted from PDF." });
        }
        // 3. Split text
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const chunks = await splitter.splitText(text);
        console.log("Ingest route called!");
        res.status(200).json({ message: "Ingest route is working" });
        // 4. Initialize embeddings
        const embeddingsModel = new OpenAIEmbeddings();

        // 5. For each chunk, compute embedding and insert into `documents` table
        for (const chunk of chunks) {
            const vector = await embeddingsModel.embedQuery(chunk); // float[] of length ~384-1536
            // Insert directly into documents table
            // Supabase JS client can handle float[] for pgvector
            const { error } = await supabaseClient.from("documents").insert({
                user_id,
                notebook_id,
                content: chunk,
                metadata: { filename },
                embedding: vector, // This should store as a float[] in pgvector
            });
            if (error) {
                console.error("Error inserting chunk:", error);
            }
        }

        return res.status(200).json({ message: "Document ingested successfully." });
    } catch (err) {
        console.error("Ingestion error:", err);
        return res.status(500).json({ message: "Error ingesting PDF." });
    }
}
