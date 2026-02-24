/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import FullLogo from "../ui/fulllogo";
import { Modal } from "@/components/ui/modal";
import { userService } from "@/libs/services/userService";
import { roleService } from "@/libs/services/roleService";
import { wingService } from "@/libs/services/wingService";
import { subWingService } from "@/libs/services/subWingService";
import type { User, Role, Wing, SubWing } from "@/libs/types/user";

interface UserAssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess?: () => void;
}

export default function UserAssignRoleModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: UserAssignRoleModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [wings, setWings] = useState<Wing[]>([]);
  const [subWings, setSubWings] = useState<SubWing[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const [selectedWingId, setSelectedWingId] = useState<number | "" | null>("");
  const [selectedSubWingId, setSelectedSubWingId] = useState<number | "" | null>("");
  const [isPrimary, setIsPrimary] = useState(false);

  // Load initial data
  useEffect(() => {
    if (isOpen && user) {
      loadInitialData();
    }
  }, [isOpen, user]);

  // Load subwings when wing changes
  useEffect(() => {
    if (selectedWingId) {
      loadSubWings(Number(selectedWingId));
    } else {
      setSubWings([]);
      setSelectedSubWingId("");
    }
  }, [selectedWingId]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const [rolesRes, wingsRes] = await Promise.all([
        roleService.getAllRoles({ per_page: 1000 }),
        wingService.getAllWings({ per_page: 100 }),
      ]);
      setRoles(rolesRes.data.filter(r => r.is_active !== false));
      setWings(wingsRes.data);
    } catch (err) {
      console.error("Failed to load initial data:", err);
      setError("Failed to load roles and wings");
    } finally {
      setLoadingData(false);
    }
  };

  const loadSubWings = async (wingId: number) => {
    try {
      const result = await subWingService.getSubWingsByWing(wingId);
      setSubWings(result);
    } catch (err) {
      console.error("Failed to load sub-wings:", err);
      setSubWings([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRoleId) return;

    setLoading(true);
    setError(null);

    try {
      await userService.assignRole(user.id, {
        role_id: Number(selectedRoleId),
        wing_id: selectedWingId ? Number(selectedWingId) : null,
        sub_wing_id: selectedSubWingId ? Number(selectedSubWingId) : null,
        is_primary: isPrimary,
      });

      // Reset form
      setSelectedRoleId("");
      setSelectedWingId("");
      setSelectedSubWingId("");
      setIsPrimary(false);

      onSuccess?.();
      onClose(); // Close after success or keep open to manage? Instructor modal stays open.
      // Actually, userService.assignRole might be used to add one assignment.
    } catch (err: any) {
      setError(err.message || "Failed to assign role");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!user || !confirm("Are you sure you want to remove this role assignment?")) return;

    try {
      await userService.removeRole(user.id, assignmentId);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to remove role:", err);
      setError("Failed to remove assignment");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton className="max-w-3xl">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
            User Role Assignments
          </h2>
          <p className="text-sm text-gray-500">
            Manage roles and wing access for {user?.name || "User"} ({user?.service_number || "N/A"})
          </p>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-10">
            <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Existing Assignments */}
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Assignments</h4>
              {user?.role_assignments && user.role_assignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {user.role_assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${assignment.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900">
                              {assignment.role?.name || "Unknown Role"}
                            </p>
                            {assignment.is_primary && (
                              <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-blue-100 text-blue-700">
                                Primary
                              </span>
                            )}
                          </div>
                          {(assignment.wing || assignment.sub_wing) && (
                            <p className="text-xs text-gray-500">
                              {assignment.wing?.name}
                              {assignment.sub_wing && ` / ${assignment.sub_wing.name}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remove Assignment"
                      >
                        <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  No roles currently assigned
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Add New Assignment Form */}
            <form onSubmit={handleSubmit} className="p-4 border border-blue-100 bg-blue-50/30 rounded-xl">
              <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                Assign New Role & Wing
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Role Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.is_super_admin ? "(Super Admin)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Wing Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wing Access</label>
                  <select
                    value={selectedWingId || ""}
                    onChange={(e) => setSelectedWingId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Wing Assignment</option>
                    {wings.map((wing) => (
                      <option key={wing.id} value={wing.id}>
                        {wing.name} ({wing.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* SubWing Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Wing Access</label>
                  <select
                    value={selectedSubWingId || ""}
                    onChange={(e) => setSelectedSubWingId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedWingId || subWings.length === 0}
                  >
                    <option value="">No Sub-Wing Assignment</option>
                    {subWings.map((subWing) => (
                      <option key={subWing.id} value={subWing.id}>
                        {subWing.name} ({subWing.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Set as Primary Assignment
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedRoleId}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                      Add Assignment
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
