/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { AtwMedicalDisposalSyllabus, AtwMedicalDisposalSyllabusPayload, AtwMedicalDisposalSyllabusSchema } from "@/libs/types/atwMedicalDisposal";

interface SyllabusFormProps {
  initialData?: AtwMedicalDisposalSyllabus | null;
  onSubmit: (data: AtwMedicalDisposalSyllabusPayload) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export type { AtwMedicalDisposalSyllabusPayload as SyllabusFormData };

export default function SyllabusForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: SyllabusFormProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [schemas, setSchemas] = useState<Partial<AtwMedicalDisposalSyllabusSchema>[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code || "");
      setIsActive(initialData.is_active);
      setSchemas(
        initialData.schemas?.map((s) => ({ id: s.id, name: s.name, code: s.code, is_active: s.is_active })) || []
      );
    }
  }, [initialData]);

  const addSchema = () => setSchemas((p) => [...p, { name: "", code: "", is_active: true }]);

  const updateSchema = (index: number, field: keyof AtwMedicalDisposalSyllabusSchema, value: any) => {
    setSchemas((p) => p.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const removeSchema = (index: number) => setSchemas((p) => p.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Syllabus name is required."); return; }
    setError("");
    await onSubmit({
      name: name.trim(),
      code: code.trim() || undefined,
      is_active: isActive,
      schemas: schemas.filter((s) => s.name?.trim()) as Partial<AtwMedicalDisposalSyllabusSchema>[],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Basic Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Syllabus Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter syllabus name"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. MDS-001"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Active</label>
          <button
            type="button"
            onClick={() => setIsActive((p) => !p)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      {/* Schema Items */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Schema Items
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {schemas.length}
            </span>
          </h3>
          <button
            type="button"
            onClick={addSchema}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 font-medium"
          >
            <Icon icon="hugeicons:add-circle" className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>

        {schemas.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No schema items. Click &quot;Add Item&quot; to add one.</p>
        ) : (
          <div className="space-y-2">
            {schemas.map((schema, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-3">
                <span className="text-xs text-gray-400 w-5 text-center font-bold">{i + 1}</span>
                <input
                  type="text"
                  placeholder="Name *"
                  value={schema.name || ""}
                  onChange={(e) => updateSchema(i, "name", e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-900"
                />
                <input
                  type="text"
                  placeholder="Code"
                  value={schema.code || ""}
                  onChange={(e) => updateSchema(i, "code", e.target.value)}
                  className="w-28 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => removeSchema(i)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
        >
          {loading ? (
            <><Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />{isEdit ? "Updating..." : "Saving..."}</>
          ) : (
            <><Icon icon="hugeicons:floppy-disk" className="w-4 h-4" />{isEdit ? "Update Syllabus" : "Save Syllabus"}</>
          )}
        </button>
      </div>
    </form>
  );
}
