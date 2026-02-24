/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { rankService } from "@/libs/services/rankService";
import { useRankModal } from "@/context/RankModalContext";
import FullLogo from "@/components/ui/fulllogo";

export default function RankFormModal() {
  const { isOpen, editingRank, closeModal } = useRankModal();
  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    hierarchy_level: 1,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (editingRank) {
      setFormData({
        name: editingRank.name,
        short_name: editingRank.short_name,
        hierarchy_level: editingRank.hierarchy_level,
        is_active: editingRank.is_active,
      });
    } else {
      // Reset form for new rank
      setFormData({
        name: "",
        short_name: "",
        hierarchy_level: 1,
        is_active: true,
      });
    }
    setError("");
  }, [editingRank, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingRank) {
        await rankService.updateRank(editingRank.id, formData);
      } else {
        await rankService.createRank(formData);
      }
      closeModal();
      // Trigger a custom event to reload rank list
      window.dispatchEvent(new CustomEvent('rankUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save rank");
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
            {editingRank ? "Edit Rank" : "Add a New Rank"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingRank ? "Update rank details" : "Configure your new rank details"}
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
                Rank Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter rank name"
                required
              />
            </div>

            <div>
              <Label>
                Short Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.short_name}
                onChange={(e) => handleChange("short_name", e.target.value)}
                placeholder="Enter short name"
                required
              />
            </div>
          </div>

          <div>
            <Label>
              Hierarchy Level <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              value={formData.hierarchy_level}
              onChange={(e) => handleChange("hierarchy_level", parseInt(e.target.value))}
              placeholder="Enter hierarchy level"
              min="1"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Higher numbers indicate higher ranks in the hierarchy
            </p>
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
                    This rank will be available for use throughout the system.
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
                    This rank will be hidden from general use.
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
            {loading ? "Saving..." : editingRank ? "Update Rank" : "Save Rank"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
