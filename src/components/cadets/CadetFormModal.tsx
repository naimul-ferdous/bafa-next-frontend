/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { cadetService } from "@/libs/services/cadetService";
import { useCadetModal } from "@/context/CadetModalContext";
import FullLogo from "@/components/ui/fulllogo";

export default function CadetFormModal() {
  const { isOpen, editingCadet, closeModal } = useCadetModal();
  const [formData, setFormData] = useState({
    cadet_number: "",
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    date_of_joining: "",
    blood_group: "",
    address: "",
    batch: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    guardian_name: "",
    guardian_phone: "",
    guardian_relation: "",
    medical_conditions: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingCadet) {
      setFormData({
        cadet_number: editingCadet.cadet_number,
        name: editingCadet.name,
        email: editingCadet.email || "",
        phone: editingCadet.phone || "",
        date_of_birth: editingCadet.date_of_birth || "",
        date_of_joining: editingCadet.date_of_joining || "",
        blood_group: editingCadet.blood_group || "",
        address: editingCadet.address || "",
        batch: editingCadet.batch || "",
        emergency_contact_name: editingCadet.emergency_contact_name || "",
        emergency_contact_phone: editingCadet.emergency_contact_phone || "",
        guardian_name: editingCadet.guardian_name || "",
        guardian_phone: editingCadet.guardian_phone || "",
        guardian_relation: editingCadet.guardian_relation || "",
        medical_conditions: editingCadet.medical_conditions || "",
        is_active: editingCadet.is_active !== false,
      });
    } else {
      setFormData({
        cadet_number: "",
        name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        date_of_joining: "",
        blood_group: "",
        address: "",
        batch: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        guardian_name: "",
        guardian_phone: "",
        guardian_relation: "",
        medical_conditions: "",
        is_active: true,
      });
    }
    setError("");
  }, [editingCadet, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingCadet) {
        await cadetService.updateCadet(editingCadet.id, formData);
      } else {
        await cadetService.createCadet(formData);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('cadetUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save cadet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-4xl p-0">
      <form onSubmit={handleSubmit} className="p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-center mb-6">
          <div><FullLogo /></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingCadet ? "Edit Cadet" : "Add a New Cadet"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingCadet ? "Update cadet details" : "Configure your new cadet details"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Cadet Number <span className="text-red-500">*</span></Label>
              <Input value={formData.cadet_number} onChange={(e) => handleChange("cadet_number", e.target.value)} placeholder="e.g. CD12345" required />
            </div>
            <div>
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="e.g. John Doe" required />
            </div>
            <div>
              <Label>Batch</Label>
              <Input value={formData.batch} onChange={(e) => handleChange("batch", e.target.value)} placeholder="e.g. 2024-A" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="e.g. john@example.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+8801712345678" />
            </div>
            <div>
              <Label>Blood Group</Label>
              <select value={formData.blood_group} onChange={(e) => handleChange("blood_group", e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={formData.date_of_birth} onChange={(e) => handleChange("date_of_birth", e.target.value)} />
            </div>
            <div>
              <Label>Date of Joining</Label>
              <Input type="date" value={formData.date_of_joining} onChange={(e) => handleChange("date_of_joining", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Address</Label>
            <textarea value={formData.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="Enter address (optional)" rows={2} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Emergency Contact Name</Label>
              <Input value={formData.emergency_contact_name} onChange={(e) => handleChange("emergency_contact_name", e.target.value)} placeholder="Contact name" />
            </div>
            <div>
              <Label>Emergency Contact Phone</Label>
              <Input value={formData.emergency_contact_phone} onChange={(e) => handleChange("emergency_contact_phone", e.target.value)} placeholder="+8801712345678" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Guardian Name</Label>
              <Input value={formData.guardian_name} onChange={(e) => handleChange("guardian_name", e.target.value)} placeholder="Guardian name" />
            </div>
            <div>
              <Label>Guardian Phone</Label>
              <Input value={formData.guardian_phone} onChange={(e) => handleChange("guardian_phone", e.target.value)} placeholder="+8801712345678" />
            </div>
            <div>
              <Label>Guardian Relation</Label>
              <Input value={formData.guardian_relation} onChange={(e) => handleChange("guardian_relation", e.target.value)} placeholder="e.g. Father, Mother" />
            </div>
          </div>

          <div>
            <Label>Medical Conditions</Label>
            <textarea value={formData.medical_conditions} onChange={(e) => handleChange("medical_conditions", e.target.value)} placeholder="Any medical conditions or allergies (optional)" rows={2} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This cadet is currently enrolled.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This cadet is no longer enrolled.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-2 pt-2">
          <button type="button" className="px-6 py-2 border border-gray-300 text-black rounded-xl" onClick={closeModal} disabled={loading}>Cancel</button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>{loading ? "Saving..." : editingCadet ? "Update Cadet" : "Save Cadet"}</button>
        </div>
      </form>
    </Modal>
  );
}
