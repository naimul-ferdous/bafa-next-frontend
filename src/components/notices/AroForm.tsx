/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import DatePicker from "@/components/form/input/DatePicker";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import type { Aro, AroStatus } from "@/libs/types/aro";

/** Convert flatpickr output "DD/MM/YYYY" → ISO "YYYY-MM-DD" for the API */
function dmyToIso(dmy: string): string {
  const [d, m, y] = dmy.split("/");
  return `${y}-${m?.padStart(2, "0")}-${d?.padStart(2, "0")}`;
}

interface AroFormProps {
  initialData?: Aro | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

const STATUS_OPTIONS: { value: AroStatus; label: string; description: string }[] = [
  { value: "draft",    label: "Draft",    description: "Not yet published. Only visible to admins." },
  { value: "running",  label: "Running",  description: "Active and visible to all users." },
  { value: "expired",  label: "Expired",  description: "Past the expiry date. Read-only." },
  { value: "archived", label: "Archived", description: "Archived for record keeping." },
];

export default function AroForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: AroFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    expired_date: "",
    status: "running" as AroStatus,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title:        initialData.title        ?? "",
        expired_date: initialData.expired_date
          ? initialData.expired_date.split("T")[0]
          : "",
        status: initialData.status ?? "draft",
      });
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await onSubmit({ ...formData, file: selectedFile ?? undefined });
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? "update" : "create"} notice`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto">
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Title */}
        <div>
          <Label>Title <span className="text-red-500">*</span></Label>
          <textarea
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Enter notice / ARO title"
            required
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-0 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Expired Date */}
          <div>
            <Label>Expired Date <span className="text-red-500">*</span></Label>
            <DatePicker
              value={formData.expired_date}
              onChange={(e) => handleChange("expired_date", dmyToIso(e.target.value))}
              placeholder="dd/mm/yyyy"
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <Label>Attachment (PDF / Doc / Image)</Label>
            <div
              className="border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Icon icon="hugeicons:file-attachment" className="w-5 h-5" />
                  <span className="truncate max-w-xs">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    <Icon icon="hugeicons:cancel-01" className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Icon icon="hugeicons:upload-04" className="w-5 h-5" />
                  <span>Click to upload file</span>
                  <span className="text-xs text-gray-400 ml-auto">max 10MB</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Show existing file when editing */}
            {isEdit && initialData?.file && !selectedFile && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <Icon icon="hugeicons:file-download" className="w-4 h-4 text-blue-500" />
                <span>Current:</span>
                <a
                  href={initialData.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate max-w-xs"
                >
                  View existing file
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <Label className="mb-3">Status <span className="text-red-500">*</span></Label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STATUS_OPTIONS.map(({ value, label, description }) => (
              <label
                key={value}
                className={`flex flex-col gap-1 p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.status === value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value={value}
                    checked={formData.status === value}
                    onChange={() => handleChange("status", value)}
                    className="w-4 h-4 text-blue-600 border-gray-300"
                  />
                  <span className="font-medium text-gray-900 text-sm">{label}</span>
                </div>
                <span className="text-xs text-gray-500 pl-6">{description}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2"
        >
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading
            ? (isEdit ? "Updating..." : "Saving...")
            : (isEdit ? "Update Notice" : "Save Notice")}
        </button>
      </div>
    </form>
  );
}
