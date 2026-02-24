/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { ftw11sqnFlyingExamApprovalProcessService } from "@/libs/services/ftw11sqnFlyingExamApprovalProcessService";
import { roleService } from "@/libs/services/roleService";
import { useApprovalProcessModal } from "@/context/ApprovalProcessModalContext";
import FullLogo from "@/components/ui/fulllogo";
import type { Role } from "@/libs/types/user";

export default function ApprovalProcessFormModal() {
  const { isOpen, editingProcess, closeModal } = useApprovalProcessModal();
  const [formData, setFormData] = useState({
    status_code: "",
    role_id: "",
    description: "",
    status: "active" as "active" | "inactive" | "draft",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Load all roles when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editingProcess) {
      setFormData({
        status_code: editingProcess.status_code || "",
        role_id: editingProcess.role_id?.toString() || "",
        description: editingProcess.description || "",
        status: editingProcess.status || "active",
      });
    } else {
      // Reset form for new process
      setFormData({
        status_code: "",
        role_id: "",
        description: "",
        status: "active",
      });
    }
    setError("");
  }, [editingProcess, isOpen]);

  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await roleService.getAllRoles({ per_page: 1000 });
      setRoles(response.data.filter((r) => r.is_active !== false));
    } catch (error) {
      console.error("Failed to load roles:", error);
    } finally {
      setRolesLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const submitData = {
        status_code: formData.status_code,
        role_id: parseInt(formData.role_id),
        description: formData.description || undefined,
        status: formData.status,
      };

      if (editingProcess) {
        await ftw11sqnFlyingExamApprovalProcessService.update(editingProcess.id, submitData);
      } else {
        await ftw11sqnFlyingExamApprovalProcessService.create(submitData);
      }

      closeModal();
      // Trigger a custom event to reload list
      window.dispatchEvent(new CustomEvent("approvalProcessUpdated"));
    } catch (err: any) {
      setError(err.message || "Failed to save approval process");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-2xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-6">
          <div>
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingProcess ? "Edit Approval Process" : "Add New Approval Process"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingProcess
              ? "Update approval process details"
              : "Configure a new approval level in the hierarchy"}
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
              <Label>
                Level Code <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.status_code}
                onChange={(e) => handleChange("status_code", e.target.value)}
                placeholder="e.g., 1, 2, 3..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Lower number = earlier in approval chain (1 = first approver)
              </p>
            </div>

            <div>
              <Label>
                Role <span className="text-red-500">*</span>
              </Label>
              {rolesLoading ? (
                <div className="text-sm text-gray-500 py-2">Loading roles...</div>
              ) : (
                <select
                  value={formData.role_id}
                  onChange={(e) => handleChange("role_id", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">Users with this role can approve at this level</p>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter description (optional)"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formData.status === "active"}
                  onChange={() => handleChange("status", "active")}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-900 dark:text-white">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formData.status === "inactive"}
                  onChange={() => handleChange("status", "inactive")}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-900 dark:text-white">Inactive</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formData.status === "draft"}
                  onChange={() => handleChange("status", "draft")}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-900 dark:text-white">Draft</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-black rounded-xl"
            onClick={closeModal}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>
            {loading ? "Saving..." : editingProcess ? "Update Process" : "Save Process"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
