"use client";

import { useState } from "react";
import CompileLatexForm from "@/components/custom/CompileLatexForm";
import PdfViewer from "@/components/custom/PdfViewer";

export default function CompileLatexPage() {
  // We'll store the PDF URL (created from the blob) in state.
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      {/* Left column: the compile form */}
      <div className="w-1/2 p-4 border-r border-gray-300">
        <CompileLatexForm onPdfGenerated={setPdfUrl} />
      </div>

      {/* Right column: the PDF viewer */}
      <div className="w-1/2 p-4">
        {pdfUrl ? (
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