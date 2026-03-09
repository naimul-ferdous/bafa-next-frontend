/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { roleService } from "@/libs/services/roleService";
import { rankService } from "@/libs/services/rankService";
import { wingService } from "@/libs/services/wingService";
import { subWingService } from "@/libs/services/subWingService";
import { userService } from "@/libs/services/userService";
import FullLogo from "@/components/ui/fulllogo";
import SearchableSelect from "@/components/form/SearchableSelect";
import type { User, Role, Rank, Wing, SubWing } from "@/libs/types/user";
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
  const router = useRouter();
  const [formData, setFormData] = useState({
    service_number: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    rank_id: "" as string | number,
    wing_id: "" as string | number,
    sub_wing_id: "" as string | number,
    date_of_birth: "",
    date_of_joining: "",
    blood_group: "",
    address: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Image states
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");

  // Roles, Ranks, Wings, Sub-Wings state
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [ranksLoading, setRanksLoading] = useState(false);
  const [wings, setWings] = useState<Wing[]>([]);
  const [wingsLoading, setWingsLoading] = useState(false);
  const [subWings, setSubWings] = useState<SubWing[]>([]);
  const [subWingsLoading, setSubWingsLoading] = useState(false);

  // Real-time search states
  const [searchStatus, setSearchStatus] = useState<{
    type: 'idle' | 'loading' | 'found' | 'not_found' | 'already_exists';
    message: string;
  }>({ type: 'idle', message: '' });
  const [foundUserId, setFoundUserId] = useState<number | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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

  // Load initial data on mount
  useEffect(() => {
    loadRoles();
    loadRanks();
    loadWings();
  }, []);

  // Load sub-wings when wing changes
  useEffect(() => {
    if (formData.wing_id) {
      loadSubWings(Number(formData.wing_id));
    } else {
      setSubWings([]);
      setFormData(prev => ({ ...prev, sub_wing_id: "" }));
    }
  }, [formData.wing_id]);

  useEffect(() => {
    if (initialData) {
      // Find primary role assignment for wing/sub-wing
      const primaryAssignment = initialData.role_assignments?.find(a => a.is_primary) || initialData.role_assignments?.[0];

      setFormData({
        service_number: initialData.service_number,
        name: initialData.name,
        email: initialData.email,
        password: "",
        phone: initialData.phone || "",
        rank_id: initialData.rank_id || "",
        wing_id: primaryAssignment?.wing_id || "",
        sub_wing_id: primaryAssignment?.sub_wing_id || "",
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
      if (initialData.profile_photo) setProfilePhotoPreview(initialData.profile_photo);
      if (initialData.signature) setSignaturePreview(initialData.signature);
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
      const hiddenSlugs = ['instructor', 'atw-cic', 'atw-course-tutor'];
      const hiddenNames = ['ATW CIC', 'ATW Course Tutor', 'Instructor'];
      setRoles(response.data.filter(r =>
        r.is_active !== false &&
        !hiddenSlugs.includes(r.slug || '') &&
        !hiddenNames.includes(r.name)
      ));
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

  const loadWings = async () => {
    try {
      setWingsLoading(true);
      const response = await wingService.getAllWings({ per_page: 1000 });
      setWings(response.data.filter(w => w.is_active !== false));
    } catch (error) {
      console.error("Failed to load wings:", error);
    } finally {
      setWingsLoading(false);
    }
  };

  const loadSubWings = async (wingId: number) => {
    try {
      setSubWingsLoading(true);
      const result = await subWingService.getSubWingsByWing(wingId);
      setSubWings(result.filter(sw => sw.is_active !== false));
    } catch (error) {
      console.error("Failed to load sub-wings:", error);
      setSubWings([]);
    } finally {
      setSubWingsLoading(false);
    }
  };

  // Real-time BD number search
  const handleSearchBdNumber = async (query: string) => {
    if (!query || query.length < 2) {
      if (!query) {
        setSearchStatus({ type: 'idle', message: '' });
        setFoundUserId(null);
        setAutoFilledFields(new Set());
      }
      return;
    }

    setSearchStatus({ type: 'loading', message: 'Searching...' });

    try {
      const user = await userService.findUserByServiceNumber(query);
      if (user) {
        setFoundUserId(user.id);
        setSearchStatus({
          type: 'already_exists',
          message: `User "${user.name}" already exists with BD No ${query}.`
        });
      } else {
        setFoundUserId(null);
        setAutoFilledFields(new Set());
        setSearchStatus({
          type: 'not_found',
          message: `No existing user found. You can create a new user.`
        });
      }
    } catch (err: any) {
      setSearchStatus({ type: 'idle', message: '' });
    }
  };

  const handleServiceNumberChange = (value: string) => {
    handleChange("service_number", value);
    setFoundUserId(null);
    setAutoFilledFields(new Set());
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!value || value.length < 2) {
      if (!value) setSearchStatus({ type: 'idle', message: '' });
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      handleSearchBdNumber(value);
    }, 600);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, []);

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
    setFieldErrors({});

    if (!formData.phone) { setError("Phone is required"); return; }
    if (!formData.rank_id) { setError("Rank is required"); return; }
    if (!formData.blood_group) { setError("Blood Group is required"); return; }
    if (!formData.date_of_birth) { setError("Date of Birth is required"); return; }
    if (!formData.date_of_joining) { setError("Date of Joining is required"); return; }
    if (!formData.address) { setError("Address is required"); return; }
    if (!formData.wing_id) { setError("Wing is required"); return; }
    if (selectedRoles.length === 0) { setError("At least one role must be selected"); return; }

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
      if (err.errors && typeof err.errors === 'object') {
        setFieldErrors(err.errors);
        setError(err.message || "Validation failed. Please fix the errors below.");
      } else {
        setError(err.message || "Failed to save user");
      }
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
            <p className="font-semibold">{error}</p>
            {Object.keys(fieldErrors).length > 0 && (
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                {Object.entries(fieldErrors).map(([field, messages]) =>
                  messages.map((msg, i) => (
                    <li key={`${field}-${i}`}>{msg}</li>
                  ))
                )}
              </ul>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
              1. Basic Information
            </h2>

            {/* BD Number Search Section (only on create) */}
            {!isEdit && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <Label>BD/Service Number <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input value={formData.service_number} onChange={(e) => handleServiceNumberChange(e.target.value)} placeholder="e.g. 123456" required />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSearchBdNumber(formData.service_number)}
                        disabled={searchStatus.type === 'loading'}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex-shrink-0 h-[42px] flex items-center justify-center min-w-[42px]"
                      >
                        {searchStatus.type === 'loading' ? (
                          <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />
                        ) : (
                          <Icon icon="hugeicons:search-01" className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.service_number && <p className="text-xs text-red-500 mt-1">{fieldErrors.service_number[0]}</p>}
                  </div>
                  <div className="col-span-3">
                    {searchStatus.type === 'not_found' && (
                      <div className="p-2.5 text-sm flex items-center gap-2 text-blue-700">
                        <Icon icon="hugeicons:information-circle" className="w-5 h-5" />
                        <span>{searchStatus.message}</span>
                      </div>
                    )}
                    {searchStatus.type === 'loading' && (
                      <div className="p-2.5 text-sm flex items-center gap-2 text-gray-700">
                        <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />
                        <span>Searching...</span>
                      </div>
                    )}
                    {searchStatus.type === 'already_exists' && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-orange-700 text-sm">
                          <Icon icon="hugeicons:alert-02" className="w-5 h-5 flex-shrink-0" />
                          <span>{searchStatus.message}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push(`/users/${foundUserId}/edit`)}
                          className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 flex items-center gap-1.5 flex-shrink-0"
                        >
                          <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                          Edit User
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Profile Picture */}
              <div>
                <Label>Profile Picture</Label>
                <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative overflow-hidden">
                  {profilePhotoPreview ? (
                    <Image src={profilePhotoPreview} alt="Profile Preview" fill className="object-cover" />
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
                    <Image src={signaturePreview} alt="Signature Preview" fill className="object-cover" />
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
              {/* Show BD Number field in edit mode (non-searchable) */}
              {isEdit && (
              <div>
                <Label>BD/Service Number <span className="text-red-500">*</span></Label>
                <Input value={formData.service_number} onChange={(e) => handleChange("service_number", e.target.value)} placeholder="e.g. 123456" required />
                {fieldErrors.service_number && <p className="text-xs text-red-500 mt-1">{fieldErrors.service_number[0]}</p>}
              </div>
              )}
              <div>
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="e.g. John Doe" required />
                {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name[0]}</p>}
              </div>
              <div>
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="e.g. john@example.com" required />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email[0]}</p>}
              </div>
              <div>
                <Label>Password {!isEdit && <span className="text-red-500">*</span>} {isEdit && <span className="text-xs text-gray-500">(leave blank to keep current)</span>}</Label>
                <Input type="password" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} placeholder="••••••••" required={!isEdit} />
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password[0]}</p>}
              </div>
              <div>
                <Label>Phone <span className="text-red-500">*</span></Label>
                <Input value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="e.g. +8801712345678" required />
                {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone[0]}</p>}
              </div>
              <div>
                <Label>Rank <span className="text-red-500">*</span></Label>
                <SearchableSelect
                  options={ranks.map(r => ({ value: r.id.toString(), label: `${r.name} (${r.short_name})` }))}
                  value={formData.rank_id.toString()}
                  onChange={(val) => handleChange("rank_id", val)}
                  placeholder="Select Rank"
                  required
                />
              </div>
              <div>
                <Label>Blood Group <span className="text-red-500">*</span></Label>
                <SearchableSelect
                  options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => ({ value: bg, label: bg }))}
                  value={formData.blood_group}
                  onChange={(val) => handleChange("blood_group", val)}
                  placeholder="Select Blood Group"
                  required
                />
              </div>
              <div>
                <Label>Date of Birth <span className="text-red-500">*</span></Label>
                <DatePicker value={formData.date_of_birth} onChange={(e) => handleChange("date_of_birth", e.target.value)} placeholder="dd/mm/yyyy" required />
              </div>
              <div>
                <Label>Date of Joining <span className="text-red-500">*</span></Label>
                <DatePicker value={formData.date_of_joining} onChange={(e) => handleChange("date_of_joining", e.target.value)} placeholder="dd/mm/yyyy" required />
              </div>
            </div>
            <div className="mt-4">
              <Label>Address <span className="text-red-500">*</span></Label>
              <textarea value={formData.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="Enter address" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
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

          {/* Roles & Wing Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
              2. Roles & Wing Access
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label> Wing <span className="text-red-500">*</span></Label>
                <SearchableSelect
                  options={wings.map(w => ({ value: w.id.toString(), label: `${w.name} (${w.code})` }))}
                  value={formData.wing_id.toString()}
                  onChange={(val) => handleChange("wing_id", val)}
                  placeholder="No Wing Assignment"
                  required
                />
                {wingsLoading && <p className="text-xs text-gray-500 mt-1 italic">Loading wings...</p>}
              </div>

              {formData.wing_id && subWings.length > 0 && (
                <div>
                  <Label> Sub-Wing</Label>
                  <SearchableSelect
                    options={subWings.map(sw => ({ value: sw.id.toString(), label: `${sw.name} (${sw.code})` }))}
                    value={formData.sub_wing_id.toString()}
                    onChange={(val) => handleChange("sub_wing_id", val)}
                    placeholder="No Sub-Wing Assignment"
                  />
                  {subWingsLoading && <p className="text-xs text-gray-500 mt-1 italic">Loading sub-wings...</p>}
                </div>
              )}
            </div>

            <h3 className="text-md font-bold text-gray-700 mb-3">
              Assign Roles <span className="text-red-500">*</span>
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({selectedRoles.length} selected)
              </span>
            </h3>

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
