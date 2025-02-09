// \app\production\page.tsx
"use client";

import { useState } from "react";
import GenerateLatexForm from "@/components/custom/GenerateLatexForm";
import PdfViewer from "@/components/custom/PdfViewer";
import { Loader2 } from "lucide-react";

export default function GenerateVisualPage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      {/* Left column: full-height, flex layout */}
      <div className="w-1/2 p-4 border-r border-gray-300 flex flex-col h-full">
        <GenerateLatexForm
          onPdfGenerated={(url: string) => {
            setPdfUrl(url);
            setLoading(false);
            setLoadingMessage(null);
            setError(null);
          }}
          setLoading={setLoading}
          setLoadingMessage={setLoadingMessage}
          setError={setError}
        />
      </div>

      {/* Right column: the PDF viewer or loading state */}
      <div className="w-1/2 p-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center space-x-2 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{loadingMessage ?? "Loading..."}</span>
            </div>
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