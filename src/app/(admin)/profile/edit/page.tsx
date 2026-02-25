/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/libs/hooks/useAuth";
import { authService } from "@/libs/services/authService";
import { rankService } from "@/libs/services/rankService";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import FullLogo from "@/components/ui/fulllogo";
import { Icon } from "@iconify/react";
import { UpdateProfileRequest, Rank } from "@/libs/types";
import DatePicker from "@/components/form/input/DatePicker";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    blood_group: "",
    address: "",
    rank_id: "" as string | number,
    date_of_birth: "",
    date_of_joining: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Image states
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");

  // Ranks state
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

  useEffect(() => {
    loadRanks();
  }, []);

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

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        blood_group: user.blood_group || "",
        address: user.address || "",
        rank_id: user.rank_id || "",
        date_of_birth: formatDateForDisplay(user.date_of_birth),
        date_of_joining: formatDateForDisplay(user.date_of_joining),
      });

      if (user.profile_photo) setProfilePhotoPreview(user.profile_photo);
      if (user.signature) setSignaturePreview(user.signature);
    }
  }, [user]);

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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const submitData: UpdateProfileRequest = {
        ...formData,
      };

      // Only include images if they were changed (base64 strings)
      if (profilePhoto) submitData.profile_photo = profilePhoto;
      if (signature) submitData.signature = signature;

      const response = await authService.updateProfile(submitData);
      if (response.success) {
        setSuccess("Profile updated successfully!");
        await refreshUser();
        setTimeout(() => {
          router.push("/profile");
        }, 1500);
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/profile");
  };

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/atw/subjects")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
      </div>
      <form onSubmit={handleSubmit} className="px-4">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit My Profile</h2>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
            <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 mb-6 bg-green-50 border border-green-200 rounded-lg text-green-600 flex items-center gap-2">
            <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5" />
            {success}
          </div>
        )}

        <div className="space-y-8">
          {/* Profile Photos */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
              1. Profile & Signature
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Profile Photo */}
              <div>
                <Label>Profile Picture</Label>
                <label className="mt-2 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative overflow-hidden transition-all">
                  {profilePhotoPreview ? (
                    <Image src={profilePhotoPreview} alt="Profile Preview" fill className="object-contain p-2" />
                  ) : (
                    <div className="text-center">
                      <Icon icon="hugeicons:user-circle" className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 uppercase font-medium">Click to upload photo</p>
                      <p className="text-[10px] text-gray-400 mt-1">Max 1MB, Image files only</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleProfilePhotoChange} />
                  {profilePhotoPreview && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <p className="text-white text-xs font-bold uppercase">Change Photo</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Signature */}
              <div>
                <Label>Signature</Label>
                <label className="mt-2 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative overflow-hidden transition-all">
                  {signaturePreview ? (
                    <Image src={signaturePreview} alt="Signature Preview" fill className="object-contain p-2" />
                  ) : (
                    <div className="text-center">
                      <Icon icon="hugeicons:pencil-edit-01" className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 uppercase font-medium">Click to upload signature</p>
                      <p className="text-[10px] text-gray-400 mt-1">Max 1MB, Image files only</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleSignatureChange} />
                  {signaturePreview && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <p className="text-white text-xs font-bold uppercase">Change Signature</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
              2. Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Super Admin"
                  required
                />
              </div>

              <div className="lg:col-span-2">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="e.g. admin@bafa.mil.bd"
                  required
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="e.g. +88017XXXXXXXX"
                />
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
                <select
                  value={formData.blood_group}
                  onChange={(e) => handleChange("blood_group", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
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
                <Label>BD Number (Service Number)</Label>
                <div className="px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600 font-bold">
                  {user?.service_number || "N/A"}
                </div>
              </div>

              <div>
                <Label>Date of Birth</Label>
                <DatePicker
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange("date_of_birth", e.target.value)}
                  placeholder="dd/mm/yyyy"
                />
              </div>

              <div>
                <Label>Date of Joining</Label>
                <DatePicker
                  value={formData.date_of_joining}
                  onChange={(e) => handleChange("date_of_joining", e.target.value)}
                  placeholder="dd/mm/yyyy"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label>Address</Label>
              <textarea
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter your full address"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex gap-3">
            <Icon icon="hugeicons:information-circle" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              You are editing your personal profile. Some sensitive fields like BD Number are read-only and can only be changed by system administrators.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-10 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Icon icon="hugeicons:save-01" className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
