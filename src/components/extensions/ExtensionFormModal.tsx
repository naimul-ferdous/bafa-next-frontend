/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import { systemExtensionService } from "@/libs/services/systemExtensionService";
import { roleService } from "@/libs/services/roleService";
import { useExtensionModal } from "@/context/ExtensionModalContext";
import FullLogo from "@/components/ui/fulllogo";

export default function ExtensionFormModal() {
  const { isOpen, editingExtension, closeModal } = useExtensionModal();

  const [formData, setFormData] = useState({ name: "", role_id: "" });
  const [roles, setRoles] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load roles for dropdown
  useEffect(() => {
    roleService.getAllRoles({ per_page: 1000 }).then((res) => {
      setRoles(res.data.map((r: any) => ({ label: r.name, value: r.id.toString() })));
    });
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editingExtension) {
      setFormData({
        name: editingExtension.name,
        role_id: editingExtension.role_id.toString(),
      });
    } else {
      setFormData({ name: "", role_id: "" });
    }
    setError("");
  }, [editingExtension, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role_id) {
      setError("Please select a role.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = { name: formData.name, role_id: parseInt(formData.role_id) };
      if (editingExtension) {
        await systemExtensionService.update(editingExtension.id, payload);
      } else {
        await systemExtensionService.create(payload);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent("extensionUpdated"));
    } catch (err: any) {
      setError(err.message || "Failed to save extension");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-lg p-0">
      <form onSubmit={handleSubmit} className="p-8">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-6">
          <div>
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingExtension ? "Edit Extension" : "Add a New Extension"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingExtension ? "Update extension details" : "Configure your new extension details"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>
              Extension Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter extension name"
              required
            />
          </div>

          <div>
            <Label>
              Role <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.role_id}
              onChange={(val) => handleChange("role_id", val)}
              options={[{ label: "Select a role", value: "" }, ...roles]}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-2">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-black rounded-xl"
            onClick={closeModal}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-xl disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Saving..." : editingExtension ? "Update Extension" : "Save Extension"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
