/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { branchService } from "@/libs/services/branchService";
import { commonService } from "@/libs/services/commonService";
import { useBranchModal } from "@/context/BranchModalContext";
import FullLogo from "@/components/ui/fulllogo";
import type { SystemProgram } from "@/libs/types/system";

export default function BranchFormModal() {
  const { isOpen, editingBranch, closeModal } = useBranchModal();
  const [formData, setFormData] = useState({
    program_id: "" as number | "",
    name: "",
    short_name: "",
    description: "",
    category: "",
    is_active: true,
  });
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [error, setError] = useState("");

  // Load programs
  useEffect(() => {
    if (isOpen) {
      const loadPrograms = async () => {
        try {
          setLoadingPrograms(true);
          const options = await commonService.getResultOptions();
          if (options) {
            setPrograms(options.programs || []);
          }
        } catch (error) {
          console.error("Failed to load programs:", error);
        } finally {
          setLoadingPrograms(false);
        }
      };
      loadPrograms();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editingBranch) {
      setFormData({
        program_id: editingBranch.program_id || "",
        name: editingBranch.name,
        short_name: editingBranch.short_name || "",
        description: editingBranch.description || "",
        category: editingBranch.category || "",
        is_active: editingBranch.is_active !== false,
      });
    } else {
      setFormData({
        program_id: "",
        name: "",
        short_name: "",
        description: "",
        category: "",
        is_active: true,
      });
    }
    setError("");
  }, [editingBranch, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        program_id: formData.program_id === "" ? null : formData.program_id,
      };

      if (editingBranch) {
        await branchService.updateBranch(editingBranch.id, submitData);
      } else {
        await branchService.createBranch(submitData);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('branchUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save branch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-2xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <div>
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingBranch ? "Edit Branch" : "Add a New Branch"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingBranch ? "Update branch details" : "Configure your new branch details"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Program <span className="text-red-500">*</span></Label>
            <select
              value={formData.program_id}
              onChange={(e) => handleChange("program_id", e.target.value ? parseInt(e.target.value) : "")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
              disabled={loadingPrograms}
            >
              <option value="">Select a Program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.code})
                </option>
              ))}
            </select>
            {loadingPrograms && <p className="text-xs text-blue-500 mt-1">Loading programs...</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Branch Name <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Enter branch name" required />
            </div>
            <div>
              <Label>Short Name</Label>
              <Input value={formData.short_name} onChange={(e) => handleChange("short_name", e.target.value)} placeholder="e.g. ENG" />
            </div>
          </div>

          <div>
            <Label>Category</Label>
            <Input value={formData.category} onChange={(e) => handleChange("category", e.target.value)} placeholder="e.g. Technical, Administrative" />
          </div>

          <div>
            <Label>Description</Label>
            <textarea value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Enter description (optional)" rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This branch will be available for use throughout the system.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This branch will be hidden from general use.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-2 pt-2">
          <button type="button" className="px-6 py-2 border border-gray-300 text-black rounded-xl" onClick={closeModal} disabled={loading}>Cancel</button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>{loading ? "Saving..." : editingBranch ? "Update Branch" : "Save Branch"}</button>
        </div>
      </form>
    </Modal>
  );
}
