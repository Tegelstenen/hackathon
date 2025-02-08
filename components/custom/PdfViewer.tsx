"use client";

type PdfViewerProps = {
  pdfUrl: string;
};

export default function PdfViewer({ pdfUrl }: PdfViewerProps) {
  return (
    <div className="h-full">
      <iframe
        src={pdfUrl}
        className="w-full h-full"
        title="Compiled PDF"
      ></iframe>
    </div>
  );
}