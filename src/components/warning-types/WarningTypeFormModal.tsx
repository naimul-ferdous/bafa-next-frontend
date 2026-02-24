/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { warningTypeService } from "@/libs/services/warningTypeService";
import { useWarningTypeModal } from "@/context/WarningTypeModalContext";
import FullLogo from "@/components/ui/fulllogo";

export default function WarningTypeFormModal() {
  const { isOpen, editingWarningType, closeModal } = useWarningTypeModal();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    reduced_mark: 0,
    category: "",
    consequences: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingWarningType) {
      setFormData({
        name: editingWarningType.name,
        code: editingWarningType.code,
        description: editingWarningType.description || "",
        reduced_mark: editingWarningType.reduced_mark,
        category: editingWarningType.category || "",
        consequences: editingWarningType.consequences || "",
        is_active: editingWarningType.is_active !== false,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        description: "",
        reduced_mark: 0,
        category: "",
        consequences: "",
        is_active: true,
      });
    }
    setError("");
  }, [editingWarningType, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingWarningType) {
        await warningTypeService.updateWarningType(editingWarningType.id, formData);
      } else {
        await warningTypeService.createWarningType(formData);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('warningTypeUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save warning type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-2xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <div><FullLogo /></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingWarningType ? "Edit Warning Type" : "Add a New Warning Type"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingWarningType ? "Update warning type details" : "Configure your new warning type details"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Warning Type Name <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="e.g. Safety Violation" required />
            </div>
            <div>
              <Label>Code <span className="text-red-500">*</span></Label>
              <Input 
                value={formData.code} 
                onChange={(e) => handleChange("code", e.target.value)} 
                placeholder="e.g. SV01" 
                required 
                disabled={!!editingWarningType}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Reduced Mark <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={formData.reduced_mark}
                onChange={(e) => handleChange("reduced_mark", parseFloat(e.target.value) || 0)}
                placeholder="e.g. 0.5, 1.0, 5.0"
                min={0}
                step={0.1}
                required
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={formData.category} onChange={(e) => handleChange("category", e.target.value)} placeholder="e.g. Safety, Discipline" />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Enter description (optional)" rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <Label>Consequences</Label>
            <textarea value={formData.consequences} onChange={(e) => handleChange("consequences", e.target.value)} placeholder="Enter possible consequences (optional)" rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This warning type will be available for use throughout the system.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This warning type will be hidden from general use.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-2 pt-2">
          <button type="button" className="px-6 py-2 border border-gray-300 text-black rounded-xl" onClick={closeModal} disabled={loading}>Cancel</button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>{loading ? "Saving..." : editingWarningType ? "Update Warning Type" : "Save Warning Type"}</button>
        </div>
      </form>
    </Modal>
  );
}
