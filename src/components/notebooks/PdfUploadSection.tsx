// 
// components/PdfUploadSection.tsx


import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { getUserInfo } from "@/hooks/getUserInfo";
import { supabase } from "@/integrations/supabase/client";

import { LoadingScreen } from "@/components/LoadingScreen";

interface PdfUploadSectionProps {
  notebookId?: string;
  userId?: string;
}

export const PdfUploadSection = ({ notebookId, userId }: PdfUploadSectionProps) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.readAsDataURL(file);
    });
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    setIsUploading(true);
    setLoadingMessage("Chunking  document...");
    try {
      const { userId} = await getUserInfo();

      const pdfBase64 = await fileToBase64(file);
      const response = await fetch("http://localhost:5000/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          filename: file.name,
          user_id: userId,
          notebook_id: notebookId,
        }),
      });
      if (!response.ok) throw new Error("Ingestion failed");
      const data = await response.json();
      console.log(data.message);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div className="space-y-4">
      {isUploading && <LoadingScreen message={loadingMessage} />}
      <h2 className="text-lg font-semibold">Upload PDF</h2>
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
        <input
          type="file"
          accept="application/pdf" 
          onChange={handleFileUpload} 
          className="hidden"
          disabled={isUploading}
        />
        <div className="text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {isUploading ? "Uploading..." : "Drag & drop or click to upload"}
          </p>
        </div>
      </label>

      {pdfFile && (
        <p className="text-sm text-muted-foreground truncate">Selected: {pdfFile.name}</p>
      )}

    </div>
  );
};




