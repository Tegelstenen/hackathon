// app/sign-generator/page.tsx
"use client";

import { useState } from "react";
import GenerateSignForm from "@/components/custom/GenerateSignForm";
import PdfViewer from "@/components/custom/PdfViewer";

export default function GenerateSignPage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      {/* Left column: the sign generator form */}
      <div className="w-1/2 p-4 border-r border-gray-300">
        <GenerateSignForm
          onPdfGenerated={(url: string) => {
            setPdfUrl(url);
            setLoading(false);
            setError(null);
          }}
          setLoading={setLoading}
          setError={setError}
        />
      </div>

      {/* Right column: the PDF viewer */}
      <div className="w-1/2 p-4">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Loading...
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-red-500">
            {error}
          </div>
        ) : pdfUrl ? (
            <PdfViewer pdfUrl={pdfUrl} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Your compiled PDF will appear here.
          </div>
        )}
      </div>
    </div>
  );
}