/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { groupService } from "@/libs/services/groupService";
import { useGroupModal } from "@/context/GroupModalContext";
import FullLogo from "@/components/ui/fulllogo";

export default function GroupFormModal() {
  const { isOpen, editingGroup, closeModal } = useGroupModal();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    capacity: 0,
    current_strength: 0,
    formation_date: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (editingGroup) {
      setFormData({
        name: editingGroup.name,
        code: editingGroup.code,
        description: editingGroup.description || "",
        capacity: editingGroup.capacity || 0,
        current_strength: editingGroup.current_strength || 0,
        formation_date: editingGroup.formation_date || "",
        is_active: editingGroup.is_active !== false,
      });
    } else {
      // Reset form for new group
      setFormData({
        name: "",
        code: "",
        description: "",
        capacity: 0,
        current_strength: 0,
        formation_date: "",
        is_active: true,
      });
    }
    setError("");
  }, [editingGroup, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingGroup) {
        await groupService.updateGroup(editingGroup.id, formData);
      } else {
        await groupService.createGroup(formData);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('groupUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save group");
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
            {editingGroup ? "Edit Group" : "Add a New Group"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingGroup ? "Update group details" : "Configure your new group details"}
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
              <Label>Group Name <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Enter group name" required />
            </div>
            <div>
              <Label>Code <span className="text-red-500">*</span></Label>
              <Input 
                value={formData.code} 
                onChange={(e) => handleChange("code", e.target.value)} 
                placeholder="Enter group code" 
                required 
                disabled={!!editingGroup}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Capacity</Label>
              <Input type="number" value={formData.capacity} onChange={(e) => handleChange("capacity", parseInt(e.target.value) || 0)} placeholder="0" />
            </div>
            <div>
              <Label>Current Strength</Label>
              <Input type="number" value={formData.current_strength} onChange={(e) => handleChange("current_strength", parseInt(e.target.value) || 0)} placeholder="0" />
            </div>
            <div>
              <Label>Formation Date</Label>
              <Input type="date" value={formData.formation_date} onChange={(e) => handleChange("formation_date", e.target.value)} />
            </div>
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
                  <div className="text-sm text-gray-500 dark:text-gray-400">This group will be available for use throughout the system.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This group will be hidden from general use.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-2 pt-2">
          <button type="button" className="px-6 py-2 border border-gray-300 text-black rounded-xl" onClick={closeModal} disabled={loading}>Cancel</button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>{loading ? "Saving..." : editingGroup ? "Update Group" : "Save Group"}</button>
        </div>
      </form>
    </Modal>
  );
}
