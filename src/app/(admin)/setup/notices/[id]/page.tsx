/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { aroService } from "@/libs/services/aroService";
import FullLogo from "@/components/ui/fulllogo";
import PdfViewer from "@/components/notices/PdfViewer";
import type { Aro, AroStatus } from "@/libs/types/aro";

// ── File type detection ─────────────────────────────────────────────────────
type FileType = "image" | "pdf" | "word" | "excel" | "powerpoint" | "unknown";

function detectFileType(url: string): FileType {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["xls", "xlsx"].includes(ext)) return "excel";
  if (["ppt", "pptx"].includes(ext)) return "powerpoint";
  return "unknown";
}

const FILE_META: Record<FileType, { label: string; icon: string; color: string }> = {
  image:       { label: "Image",       icon: "hugeicons:image-01",                    color: "text-purple-600" },
  pdf:         { label: "PDF",         icon: "hugeicons:pdf-02",                      color: "text-red-600"    },
  word:        { label: "Word",        icon: "hugeicons:doc-01",                      color: "text-blue-700"   },
  excel:       { label: "Excel",       icon: "hugeicons:google-sheet",                color: "text-green-700"  },
  powerpoint:  { label: "PowerPoint",  icon: "hugeicons:presentation-bar-chart-02",   color: "text-orange-600" },
  unknown:     { label: "File",        icon: "hugeicons:file-attachment",             color: "text-gray-500"   },
};


// ── File preview component ───────────────────────────────────────────────────
function FilePreview({ url }: { url: string }) {
  const type = detectFileType(url);
  const meta = FILE_META[type];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 flex items-center gap-2">
        <Icon icon={meta.icon} className={`w-5 h-5 ${meta.color}`} />
        File Preview
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 ${meta.color}`}>
          {meta.label}
        </span>
      </h2>

      <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
        {/* ── Image ── */}
        {type === "image" && (
          <div className="flex items-center justify-center p-4 bg-gray-100 min-h-[300px]">
            <Image
              src={url}
              alt="Attachment preview"
              width={1200}
              height={800}
              className="max-w-full h-auto max-h-[600px] object-contain rounded shadow"
            />
          </div>
        )}

        {/* ── PDF via react-pdf (PDF.js) ── */}
        {type === "pdf" && <PdfViewer url={url} />}

        {/* ── Word / Excel / PowerPoint / Unknown — download only ── */}
        {(type === "word" || type === "excel" || type === "powerpoint" || type === "unknown") && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-500">
            <Icon icon={meta.icon} className={`w-14 h-14 ${meta.color} opacity-40`} />
            <p className="text-sm">In-browser preview is not available for {meta.label} files.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Icon icon="hugeicons:download-04" className="w-4 h-4" />
              Download / Open {meta.label}
            </a>
          </div>
        )}
      </div>

      {/* Download link below preview */}
      <div className="mt-2 flex justify-end">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
        >
          <Icon icon="hugeicons:download-04" className="w-3.5 h-3.5" />
          Open / Download original
        </a>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<AroStatus, string> = {
  running:  "bg-green-100 text-green-800",
  draft:    "bg-gray-100 text-gray-700",
  expired:  "bg-red-100 text-red-800",
  archived: "bg-yellow-100 text-yellow-800",
};

const STATUS_LABELS: Record<AroStatus, string> = {
  running:  "Running",
  draft:    "Draft",
  expired:  "Expired",
  archived: "Archived",
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex">
      <span className="w-40 text-gray-900 font-medium flex-shrink-0">{label}</span>
      <span className="mr-4">:</span>
      <span className="text-gray-900 flex-1">{children}</span>
    </div>
  );
}

export default function ViewNoticePage() {
  const router = useRouter();
  const params = useParams();
  const noticeId = parseInt(params?.id as string);

  const [notice, setNotice] = useState<Aro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotice = useCallback(async () => {
    try {
      setLoading(true);
      const data = await aroService.getOne(noticeId);
      if (data) {
        setNotice(data);
      } else {
        setError("Notice not found");
      }
    } catch (err) {
      console.error("Failed to load notice:", err);
      setError("Failed to load notice data");
    } finally {
      setLoading(false);
    }
  }, [noticeId]);

  useEffect(() => {
    if (noticeId) loadNotice();
  }, [noticeId, loadNotice]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
        <Icon icon="hugeicons:alert-circle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 font-semibold mb-4">{error || "Notice not found"}</p>
        <button
          onClick={() => router.push("/setup/notices")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Notices
        </button>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Toolbar — hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/setup/notices")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => router.push(`/setup/notices/${notice.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Notice
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            Notice / ARO Detail Sheet
          </p>
        </div>

        {/* Notice Details */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Notice Information
          </h2>
          <div className="space-y-3">
            <InfoRow label="Title">
              <span className="font-bold">{notice.title ?? "—"}</span>
            </InfoRow>
            <InfoRow label="Expired Date">
              {notice.expired_date
                ? new Date(notice.expired_date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </InfoRow>
            <InfoRow label="Status">
              <span
                className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[notice.status]}`}
              >
                {STATUS_LABELS[notice.status]}
              </span>
            </InfoRow>
            <InfoRow label="Attachment">
              {notice.file ? (
                <a
                  href={notice.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                >
                  <Icon icon="hugeicons:file-download" className="w-4 h-4" />
                  Download / View File
                </a>
              ) : (
                <span className="text-gray-400 text-sm">No file attached</span>
              )}
            </InfoRow>
          </div>
        </div>

        {/* File Preview */}
        {notice.file && <FilePreview url={notice.file} />}

        {/* System Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            System Information
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-3 gap-x-12">
            <InfoRow label="Created At">
              {notice.created_at
                ? new Date(notice.created_at).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </InfoRow>
            <InfoRow label="Last Updated">
              {notice.updated_at
                ? new Date(notice.updated_at).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </InfoRow>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}
