/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { CtwMedicalDisposalSyllabus, CtwMedicalDisposalSyllabusPayload, CtwMedicalDisposalSyllabusSchema } from "@/libs/types/ctwMedicalDisposal";

interface SyllabusFormProps {
  initialData?: CtwMedicalDisposalSyllabus | null;
  onSubmit: (data: CtwMedicalDisposalSyllabusPayload) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export type { CtwMedicalDisposalSyllabusPayload as SyllabusFormData };

export default function SyllabusForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: SyllabusFormProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [schemas, setSchemas] = useState<Partial<CtwMedicalDisposalSyllabusSchema>[]>([]);
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

  const updateSchema = (index: number, field: keyof CtwMedicalDisposalSyllabusSchema, value: any) => {
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
      schemas: schemas.filter((s) => s.name?.trim()) as Partial<CtwMedicalDisposalSyllabusSchema>[],
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Syllabus Name <span className="text-red-500">*</span></Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter syllabus name"
            />
          </div>
          <div>
            <Label>Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. MDS-001"
            />
          </div>
        </div>

        {/* Schema Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h4 className="text-sm font-semibold text-gray-700">Schema Items</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {schemas.length}
              </span>
            </div>
            <button
              type="button"
              onClick={addSchema}
              className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 flex items-center gap-1 font-semibold"
            >
              <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {schemas.map((schema, i) => (
              <div key={i} className="p-4 rounded-lg border border-dashed border-gray-200 relative">
                <button
                  type="button"
                  onClick={() => removeSchema(i)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                >
                  <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={schema.name || ""}
                      onChange={(e) => updateSchema(i, "name", e.target.value)}
                      placeholder="e.g. Written Test"
                    />
                  </div>
                  <div>
                    <Label>Code</Label>
                    <Input
                      value={schema.code || ""}
                      onChange={(e) => updateSchema(i, "code", e.target.value)}
                      placeholder="e.g. WT-01"
                    />
                  </div>
                </div>
              </div>
            ))}

            {schemas.length === 0 && (
              <div className="text-center py-8 text-gray-500 italic border-2 border-dashed border-gray-200 rounded-lg">
                No schema items added yet. Click &quot;Add Item&quot; to start configuring.
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <Label className="mb-3">Status</Label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="is_active_syllabus"
                checked={isActive === true}
                onChange={() => setIsActive(true)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="is_active_syllabus"
                checked={isActive === false}
                onChange={() => setIsActive(false)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900">Inactive</span>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50"
        >
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Syllabus" : "Save Syllabus")}
        </button>
      </div>
    </form>
  );
}
