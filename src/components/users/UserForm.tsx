/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { roleService } from "@/libs/services/roleService";
import { rankService } from "@/libs/services/rankService";
import FullLogo from "@/components/ui/fulllogo";
import type { User, Role, Rank } from "@/libs/types/user";
import { Icon } from "@iconify/react";
import DatePicker from "@/components/form/input/DatePicker";
import { getImageUrl } from "@/libs/utils/formatter";

interface UserFormProps {
  initialData?: User | null;
  onSubmit: (data: any, selectedRoles: number[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

export default function UserForm({ initialData, onSubmit, onCancel, loading: externalLoading, isEdit = false }: UserFormProps) {
  const [formData, setFormData] = useState({
    service_number: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    rank_id: "" as string | number,
    date_of_birth: "",
    date_of_joining: "",
    blood_group: "",
    address: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Image states
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");

  // Roles and Ranks state
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [ranksLoading, setRanksLoading] = useState(false);

  // Format date from YYYY-MM-DD to DD/MM/YYYY
  const formatDateForDisplay = (dateStr?: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // Load roles and ranks on mount
  useEffect(() => {
    loadRoles();
    loadRanks();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        service_number: initialData.service_number,
        name: initialData.name,
        email: initialData.email,
        password: "",
        phone: initialData.phone || "",
        rank_id: initialData.rank_id || "",
        date_of_birth: formatDateForDisplay(initialData.date_of_birth),
        date_of_joining: formatDateForDisplay(initialData.date_of_joining),
        blood_group: initialData.blood_group || "",
        address: initialData.address || "",
        is_active: initialData.is_active !== false,
      });
      // Set selected roles from the user
      const roleIds = initialData.roles?.map(r => r.id) || [];
      setSelectedRoles(roleIds);

      // Set image previews
      if (initialData.profile_photo) setProfilePhotoPreview(getImageUrl(initialData.profile_photo));
      if (initialData.signature) setSignaturePreview(getImageUrl(initialData.signature));
    }
  }, [initialData]);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { setError("Profile picture size must be less than 1MB"); return; }
      try {
        const base64 = await convertToBase64(file);
        setProfilePhoto(base64);
        setProfilePhotoPreview(URL.createObjectURL(file));
      } catch { setError("Failed to process profile picture"); }
    }
  };

  const handleSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { setError("Signature size must be less than 1MB"); return; }
      try {
        const base64 = await convertToBase64(file);
        setSignature(base64);
        setSignaturePreview(URL.createObjectURL(file));
      } catch { setError("Failed to process signature"); }
    }
  };

  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await roleService.getAllRoles({ per_page: 1000 });
      setRoles(response.data.filter(r => r.is_active !== false));
    } catch (error) {
      console.error("Failed to load roles:", error);
    } finally {
      setRolesLoading(false);
    }
  };

  const loadRanks = async () => {
    try {
      setRanksLoading(true);
      const response = await rankService.getAllRanks({ per_page: 1000 });
      setRanks(response.data.filter(r => r.is_active !== false));
    } catch (error) {
      console.error("Failed to load ranks:", error);
    } finally {
      setRanksLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const submitData: any = { 
        ...formData,
        profile_photo: profilePhoto,
        signature: signature,
      };
      if (isEdit && !submitData.password) {
        delete submitData.password;
      }

      await onSubmit(submitData, selectedRoles);
    } catch (err: any) {
      setError(err.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const isFormLoading = loading || externalLoading;

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200">
      <form onSubmit={handleSubmit}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
            {isEdit ? "Edit User" : "Add a New User"}
          </h2>
          <p className="text-sm text-gray-500">
            {isEdit ? "Update user details and roles" : "Configure your new user details and roles"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
              1. Basic Information
            </h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Profile Picture */}
              <div>
                <Label>Profile Picture</Label>
                <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative overflow-hidden">
                  {profilePhotoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profilePhotoPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Icon icon="hugeicons:user-circle" className="w-12 h-12 text-blue-400 mb-2" />
                      <p className="text-xs text-red-500">No file selected</p>
                      <p className="text-xs text-gray-500">Max file size 1 MB</p>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleProfilePhotoChange} />
                </label>
              </div>

              {/* Signature */}
              <div>
                <Label>Signature</Label>
                <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative overflow-hidden">
                  {signaturePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={signaturePreview} alt="Signature Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Icon icon="hugeicons:pen-tool-01" className="w-12 h-12 text-blue-400 mb-2" />
                      <p className="text-xs text-red-500">No file selected</p>
                      <p className="text-xs text-gray-500">Max file size 1 MB</p>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleSignatureChange} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>BD Number <span className="text-red-500">*</span></Label>
                <Input value={formData.service_number} onChange={(e) => handleChange("service_number", e.target.value)} placeholder="e.g. 123456" required />
              </div>
              <div>
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="e.g. John Doe" required />
              </div>
              <div>
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="e.g. john@example.com" required />
              </div>
              <div>
                <Label>Password {!isEdit && <span className="text-red-500">*</span>} {isEdit && <span className="text-xs text-gray-500">(leave blank to keep current)</span>}</Label>
                <Input type="password" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} placeholder="••••••••" required={!isEdit} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="e.g. +8801712345678" />
              </div>
              <div>
                <Label>Rank</Label>
                <select 
                  value={formData.rank_id} 
                  onChange={(e) => handleChange("rank_id", e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={ranksLoading}
                >
                  <option value="">Select Rank</option>
                  {ranks.map((rank) => (
                    <option key={rank.id} value={rank.id}>
                      {rank.name} ({rank.short_name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Blood Group</Label>
                <select value={formData.blood_group} onChange={(e) => handleChange("blood_group", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Blood Group</option>
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
              <div>
                <Label>Date of Birth</Label>
                <DatePicker value={formData.date_of_birth} onChange={(e) => handleChange("date_of_birth", e.target.value)} placeholder="dd/mm/yyyy" />
              </div>
              <div>
                <Label>Date of Joining</Label>
                <DatePicker value={formData.date_of_joining} onChange={(e) => handleChange("date_of_joining", e.target.value)} placeholder="dd/mm/yyyy" />
              </div>
            </div>
            <div className="mt-4">
              <Label>Address</Label>
              <textarea value={formData.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="Enter address (optional)" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="mt-4">
              <Label className="mb-3">Status</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <span className="text-gray-900">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <span className="text-gray-900">Inactive</span>
                </label>
              </div>
            </div>
          </div>

          {/* Roles Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
              2. Assign Roles
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({selectedRoles.length} selected)
              </span>
            </h2>

            {rolesLoading ? (
              <div className="text-center py-4 text-gray-500">
                <Icon icon="hugeicons:loading-03" className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading roles...
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No roles available</div>
            ) : (
              <div className="overflow-y-auto rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedRoles.includes(role.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-white'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.id)}
                        onChange={() => handleRoleToggle(role.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {role.name}
                          {role.is_super_admin && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
                              Super
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <div className="text-xs text-gray-500 truncate" title={role.description}>
                            {role.description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <Icon icon="hugeicons:information-circle" className="w-4 h-4 inline mr-2" />
            All fields marked with <span className="text-red-500">*</span> are required
          </p>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-300">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            onClick={onCancel}
            disabled={isFormLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            disabled={isFormLoading}
          >
            {isFormLoading ? (
              <>
                <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              isEdit ? "Update User" : "Save User"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
