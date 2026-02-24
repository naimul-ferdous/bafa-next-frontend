/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { instructorService } from "@/libs/services/instructorService";
import { useInstructorModal } from "@/context/InstructorModalContext";
import FullLogo from "@/components/ui/fulllogo";

export default function InstructorFormModal() {
  const { isOpen, editingInstructor, closeModal } = useInstructorModal();
  const [formData, setFormData] = useState({
    user_id: 0,
    specialization: "",
    qualification: "",
    years_of_experience: 0,
    instructor_since: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingInstructor) {
      setFormData({
        user_id: editingInstructor.user_id,
        specialization: editingInstructor.specialization || "",
        qualification: editingInstructor.qualification || "",
        years_of_experience: editingInstructor.years_of_experience || 0,
        instructor_since: editingInstructor.instructor_since || "",
        emergency_contact_name: editingInstructor.emergency_contact_name || "",
        emergency_contact_phone: editingInstructor.emergency_contact_phone || "",
      });
    } else {
      setFormData({
        user_id: 0,
        specialization: "",
        qualification: "",
        years_of_experience: 0,
        instructor_since: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
      });
    }
    setError("");
  }, [editingInstructor, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingInstructor) {
        await instructorService.updateInstructor(editingInstructor.id, formData);
      } else {
        await instructorService.createInstructor(formData);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('instructorUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save instructor");
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
            {editingInstructor ? "Edit Instructor" : "Add a New Instructor"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingInstructor ? "Update instructor details" : "Configure your new instructor details"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {!editingInstructor && (
            <div>
              <Label>User ID <span className="text-red-500">*</span></Label>
              <Input type="number" value={formData.user_id} onChange={(e) => handleChange("user_id", parseInt(e.target.value))} placeholder="Enter user ID" required />
              <p className="text-xs text-gray-500 mt-1">Enter the ID of an existing user to link as instructor</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Specialization</Label>
              <Input value={formData.specialization} onChange={(e) => handleChange("specialization", e.target.value)} placeholder="e.g. Aviation, Engineering" />
            </div>
            <div>
              <Label>Qualification</Label>
              <Input value={formData.qualification} onChange={(e) => handleChange("qualification", e.target.value)} placeholder="e.g. PhD, Masters" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Years of Experience</Label>
              <Input type="number" value={formData.years_of_experience} onChange={(e) => handleChange("years_of_experience", parseInt(e.target.value))} placeholder="0" />
            </div>
            <div>
              <Label>Instructor Since</Label>
              <Input type="date" value={formData.instructor_since} onChange={(e) => handleChange("instructor_since", e.target.value)} />
            </div>
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
        </div>

        <div className="flex items-center justify-end gap-3 mt-2 pt-2">
          <button type="button" className="px-6 py-2 border border-gray-300 text-black rounded-xl" onClick={closeModal} disabled={loading}>Cancel</button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>{loading ? "Saving..." : editingInstructor ? "Update Instructor" : "Save Instructor"}</button>
        </div>
      </form>
    </Modal>
  );
}
