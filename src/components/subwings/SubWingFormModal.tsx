/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { subWingService } from "@/libs/services/subWingService";
import { wingService } from "@/libs/services/wingService";
import { useSubWingModal } from "@/context/SubWingModalContext";
import FullLogo from "@/components/ui/fulllogo";
import type { Wing } from "@/libs/types/user";

export default function SubWingFormModal() {
  const { isOpen, editingSubWing, closeModal } = useSubWingModal();
  const [wings, setWings] = useState<Wing[]>([]);
  const [formData, setFormData] = useState({
    wing_id: 0,
    name: "",
    code: "",
    description: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load wings for dropdown
  useEffect(() => {
    if (isOpen) {
      loadWings();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editingSubWing) {
      setFormData({
        wing_id: editingSubWing.wing_id,
        name: editingSubWing.name,
        code: editingSubWing.code || "",
        description: editingSubWing.description || "",
        is_active: editingSubWing.is_active !== false,
      });
    } else {
      // Reset form for new sub-wing
      setFormData({
        wing_id: 0,
        name: "",
        code: "",
        description: "",
        is_active: true,
      });
    }
    setError("");
  }, [editingSubWing, isOpen]);

  const loadWings = async () => {
    try {
      const response = await wingService.getAllWings({ per_page: 1000 });
      setWings(response.data.filter(wing => wing.is_active));
    } catch (error) {
      console.error("Failed to load wings:", error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingSubWing) {
        await subWingService.updateSubWing(editingSubWing.id, formData);
      } else {
        await subWingService.createSubWing(formData);
      }
      closeModal();
      // Trigger a custom event to reload sub-wing list
      window.dispatchEvent(new CustomEvent('subWingUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save sub-wing");
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
            {editingSubWing ? "Edit Sub-Wing" : "Add a New Sub-Wing"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingSubWing ? "Update sub-wing details" : "Configure your new sub-wing details"}
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
              Parent Wing <span className="text-red-500">*</span>
            </Label>
            <select
              value={formData.wing_id}
              onChange={(e) => handleChange("wing_id", parseInt(e.target.value))}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select a wing</option>
              {wings.map((wing) => (
                <option key={wing.id} value={wing.id}>
                  {wing.name} ({wing.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Sub-Wing Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter sub-wing name"
                required
              />
            </div>

            <div>
              <Label>
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="Enter sub-wing code"
                required
                disabled={!!editingSubWing}
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter description (optional)"
            />
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="is_active"
                  checked={formData.is_active === true}
                  onChange={() => handleChange("is_active", true)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    This sub-wing will be available for use throughout the system.
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="is_active"
                  checked={formData.is_active === false}
                  onChange={() => handleChange("is_active", false)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    This sub-wing will be hidden from general use.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-2 pt-2">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-black rounded-xl"
            onClick={closeModal}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>
            {loading ? "Saving..." : editingSubWing ? "Update Sub-Wing" : "Save Sub-Wing"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
