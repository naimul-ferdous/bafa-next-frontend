"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export default function PdfViewer({ url }: { url: string }) {
  const [blobUrl, setBlobUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl = "";
    setLoading(true);
    setError(false);
    setBlobUrl("");
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
        <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-sm">Loading PDF…</span>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-500">
        <Icon icon="hugeicons:pdf-02" className="w-14 h-14 text-red-300" />
        <p className="text-sm">Could not load PDF preview.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
        >
          <Icon icon="hugeicons:download-04" className="w-4 h-4" />
          Open PDF
        </a>
      </div>
    );
  }

  return (
    <embed
      src={blobUrl}
      type="application/pdf"
      className="w-full h-[700px]"
    />
  );
}
