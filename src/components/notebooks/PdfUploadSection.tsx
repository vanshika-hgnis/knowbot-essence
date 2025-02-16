
// src/components/notebooks/PdfUploadSection.tsx
import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PdfUploadSectionProps {
  notebookId: string;
  userId: string;
}

export const PdfUploadSection = ({ notebookId, userId }: PdfUploadSectionProps) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string }[]>([]);

 const loadUploadedFiles = async () => {
    const folderPath = `notebooks/${notebookId}/${userId}/`;
    const {data,error} = await supabase.storage.from("notebook-files").list(folderPath);

    if (error) {
        console.error("Error listing files:", error);
        return;
    }
    setUploadedFiles(data || []);
 }
// load files when the components mounts or when notebook/userID  changes
useEffect(() =>{
    if(notebookId && userId){
        loadUploadedFiles();
    }
})

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      setIsUploading(true);
      await uploadPdfToSupabase(file);
      await loadUploadedFiles();
      setIsUploading(false);
    }
  };

  const uploadPdfToSupabase = async (file: File) => {
    // Define the folder path for the notebook
    const folderPath = `notebooks/${notebookId}/${userId}/`;

    // List the current files in the folder
    const { data: files, error: listError } = await supabase.storage
      .from("notebook-files")
      .list(folderPath, { limit: 10, offset: 0 });

    if (listError) {
      console.error("Error listing files:", listError);
      return;
    }

    // Enforce a limit of 3 files
    if (files && files.length >= 3) {
      console.error("Maximum number of PDF files reached.");
      alert("You have reached the limit of 3 PDF sources for this notebook.");
      return;
    }

    // Construct the file path within the folder
    const filePath = `${folderPath}${file.name}`;

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("notebook-files")
      .upload(filePath, file);

    if (error) {
      console.error("Error uploading file:", error);
      return;
    }

    console.log("File uploaded successfully:", data);
  };

  return (
    <div className="space-y-4">
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
        <p className="text-sm text-muted-foreground truncate">
          Selected: {pdfFile.name}
        </p>
      )}
      {/* Display the list of uploaded files */}
      <div className="mt-4">
        <h3 className="text-md font-semibold">Uploaded Files</h3>
        {uploadedFiles.length === 0 ? (
<p className="text-sm text-muted-foreground">No files uploaded yet.</p>
        ) : (
            <ul className="list-disc pl-5">
                {uploadedFiles.map((file,index) =>(
                    <li key={index} className="text-sm text-muted-foreground">{file.name}</li>
                ))}
            </ul>
        )
        }
      </div>
    </div>
  );
};
