"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import { roleService } from "@/libs/services/roleService";
import { userService } from "@/libs/services/userService";
import type { InstructorBiodata, Role, RoleAssignment } from "@/libs/types/user";

interface InstructorAssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: InstructorBiodata | null;
  onSuccess?: () => void;
}

export default function InstructorAssignRoleModal({
  isOpen,
  onClose,
  instructor,
  onSuccess,
}: InstructorAssignRoleModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");

  useEffect(() => {
    if (isOpen && instructor) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, instructor]);

  const loadData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const rolesRes = await roleService.getAllRoles({ per_page: 100 });
      setRoles(rolesRes.data);
      // Seed from what's already loaded on the instructor object
      const existing: RoleAssignment[] =
        instructor?.user?.role_assignments ||
        instructor?.user?.roleAssignments ||
        [];
      setAssignments(existing);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructor?.user_id || !selectedRoleId) return;

    setLoading(true);
    setError(null);
    try {
      const isPrimary = assignments.length === 0;
      await userService.assignRole(instructor.user_id, {
        role_id: Number(selectedRoleId),
        is_primary: isPrimary,
      });
      setSelectedRoleId("");
      onSuccess?.();
      // Reload from fresh data via parent, optimistically add chip
      const addedRole = roles.find(r => r.id === Number(selectedRoleId));
      if (addedRole) {
        setAssignments(prev => [
          ...prev,
          {
            id: Date.now(), // temp id until reload
            user_id: instructor.user_id,
            role_id: addedRole.id,
            is_primary: isPrimary,
            is_active: true,
            created_at: "",
            updated_at: "",
            role: addedRole,
          } as RoleAssignment,
        ]);
      }
    } catch {
      setError("Failed to assign role");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (assignment: RoleAssignment) => {
    if (!instructor?.user_id) return;
    if (!confirm(`Remove role "${assignment.role?.name}"?`)) return;

    try {
      await userService.removeRole(instructor.user_id, assignment.id);
      setAssignments(prev => prev.filter(a => a.id !== assignment.id));
      onSuccess?.();
    } catch {
      setError("Failed to remove role");
    }
  };

  const handleClose = () => {
    setSelectedRoleId("");
    setError(null);
    onClose();
  };

  // Roles not yet assigned
  const assignedRoleIds = assignments.map(a => a.role_id);
  const availableRoles = roles.filter(r => !assignedRoleIds.includes(r.id));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton className="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Icon icon="hugeicons:user-shield-01" className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Assign Role</h3>
            <p className="text-sm text-gray-600">
              {instructor?.user?.name || "Instructor"} ({instructor?.user?.service_number || "N/A"})
            </p>
          </div>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-10">
            <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            {/* Current Assignments */}
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Roles</h4>
              {assignments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assignments.map(a => (
                    <span
                      key={a.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                        a.is_primary
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Icon icon="hugeicons:shield-user" className="w-3.5 h-3.5" />
                      {a.role?.name || `Role #${a.role_id}`}
                      {a.is_primary && (
                        <span className="text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full ml-0.5">
                          Primary
                        </span>
                      )}
                      <button
                        onClick={() => handleRemove(a)}
                        className="ml-0.5 text-red-400 hover:text-red-600 rounded-full"
                        title="Remove"
                      >
                        <Icon icon="hugeicons:cancel-01" className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No roles assigned yet.</p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Add Role Form */}
            {availableRoles.length > 0 ? (
              <form onSubmit={handleAdd}>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Role</h4>
                <div className="flex gap-3">
                  <select
                    value={selectedRoleId}
                    onChange={e => setSelectedRoleId(e.target.value ? Number(e.target.value) : "")}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select role...</option>
                    {availableRoles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={loading || !selectedRoleId}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  >
                    {loading ? (
                      <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    )}
                    Assign
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-gray-400 italic">All available roles are already assigned.</p>
            )}

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
