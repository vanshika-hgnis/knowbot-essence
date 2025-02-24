// pages/api/extract-pdf.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import pdf from 'pdf-parse';

interface ResponseData {
    text?: string;
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Expect the PDF to be provided as a base64 string in the request body
    const { pdfBase64 } = req.body;
    if (!pdfBase64) {
        return res.status(400).json({ error: 'Missing pdfBase64 field in request body' });
    }

    try {
        // Convert the base64 string to a Buffer
        const buffer = Buffer.from(pdfBase64, 'base64');
        // Use pdf-parse to extract text from the Buffer
        const data = await pdf(buffer);
        return res.status(200).json({ text: data.text });
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        return res.status(500).json({ error: 'Failed to extract text from PDF' });
    }
}
