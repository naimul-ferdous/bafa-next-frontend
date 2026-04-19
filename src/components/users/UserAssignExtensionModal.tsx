/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import { Modal } from "@/components/ui/modal";
import { systemExtensionService } from "@/libs/services/systemExtensionService";
import {
  userAssignedExtensionService,
  UserAssignedExtension,
} from "@/libs/services/userAssignedExtensionService";
import type { SystemExtension } from "@/libs/types/systemExtension";
import type { User } from "@/libs/types/user";

interface UserAssignExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess?: () => void;
}

export default function UserAssignExtensionModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: UserAssignExtensionModalProps) {
  const [extensions, setExtensions] = useState<SystemExtension[]>([]);
  const [assignments, setAssignments] = useState<UserAssignedExtension[]>([]);
  const [selectedExtensionId, setSelectedExtensionId] = useState<string>("");
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load extensions and existing assignments when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;
    loadData();
  }, [isOpen, user]);

  const loadData = async () => {
    if (!user) return;
    setLoadingData(true);
    setError(null);
    try {
      const [extRes, assignRes] = await Promise.all([
        systemExtensionService.getAll({ per_page: 1000 }),
        userAssignedExtensionService.getByUser(user.id),
      ]);
      setExtensions(extRes.data);
      setAssignments(assignRes);
    } catch (err) {
      console.error("Failed to load extension data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  // Collect all role IDs assigned to this user
  // Support both user.roles (users page) and user.role_assignments (instructors page)
  const userRoleIds = new Set<number>([
    ...(user?.roles ?? []).map((r: any) => Number(r.id)),
    ...((user as any)?.role_assignments ?? (user as any)?.roleAssignments ?? [])
      .map((a: any) => Number(a.role?.id || a.role_id))
      .filter(Boolean),
  ]);

  // Assigned extension IDs for filtering dropdown
  const assignedExtensionIds = new Set(assignments.map((a) => a.extension_id));

  // Available extensions: matches one of the user's roles AND not yet assigned
  const availableExtensions = extensions.filter(
    (ext) =>
      userRoleIds.has(Number(ext.role_id)) &&
      !assignedExtensionIds.has(ext.id)
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedExtensionId) return;

    setSubmitting(true);
    setError(null);
    try {
      await userAssignedExtensionService.assign(user.id, parseInt(selectedExtensionId));
      setSelectedExtensionId("");
      await loadData();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to assign extension");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to remove this extension assignment?")) return;

    setRemovingId(assignmentId);
    setError(null);
    try {
      await userAssignedExtensionService.remove(assignmentId);
      await loadData();
      onSuccess?.();
    } catch (err) {
      console.error("Failed to remove extension assignment:", err);
      setError("Failed to remove assignment");
    } finally {
      setRemovingId(null);
    }
  };

  const handleClose = () => {
    setSelectedExtensionId("");
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton className="max-w-2xl">
      <div className="p-6">
        {/* Header — same design as UserAssignRoleModal */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">
            Bangladesh Air Force Academy
          </h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
            User Extension Assignments
          </h2>
          <p className="text-sm text-gray-500">
            Manage extensions for {user?.name || "User"} ({user?.service_number || "N/A"})
          </p>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-10">
            <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Current Assignments */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Current Extensions
              </h4>

              {assignments.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {assignment.extension?.name || "—"}
                          </p>
                          {assignment.extension?.role && (
                            <p className="text-xs text-gray-500">
                              Role: {assignment.extension.role.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(assignment.id)}
                        disabled={removingId === assignment.id}
                        className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Remove Assignment"
                      >
                        {removingId === assignment.id ? (
                          <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
                  <p className="text-sm text-gray-500">No extensions assigned yet.</p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-6" />

            {/* Assign New Extension */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Assign New Extension
              </h4>

              {availableExtensions.length === 0 ? (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
                  <p className="text-sm text-blue-600">
                    {userRoleIds.size === 0
                      ? "This user has no roles assigned. Assign a role first to see available extensions."
                      : "No extensions available for this user's roles, or all have already been assigned."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAssign} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Extension
                    </label>
                    <select
                      value={selectedExtensionId}
                      onChange={(e) => setSelectedExtensionId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    >
                      <option value="">-- Select an extension --</option>
                      {availableExtensions.map((ext) => (
                        <option key={ext.id} value={ext.id}>
                          {ext.name}
                          {ext.role ? ` (${ext.role.name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !selectedExtensionId}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    {submitting ? (
                      <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    )}
                    Assign
                  </button>
                </form>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end mt-8 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
