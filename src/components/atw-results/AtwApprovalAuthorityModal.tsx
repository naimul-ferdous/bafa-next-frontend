"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import { AtwResultApprovalAuthority } from "@/libs/types/atwApproval";
import { Role } from "@/libs/types/user";
import { roleService } from "@/libs/services/roleService";
import { atwApprovalService } from "@/libs/services/atwApprovalService";
import FullLogo from "@/components/ui/fulllogo";

interface AtwApprovalAuthorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  authority: AtwResultApprovalAuthority | null;
}

export default function AtwApprovalAuthorityModal({
  isOpen,
  onClose,
  onSuccess,
  authority,
}: AtwApprovalAuthorityModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    role_id: "",
    is_cadet_approve: false,
    is_forward: false,
    is_final: false,
    is_initial_cadet_approve: false,
    is_initial_forward: false,
    is_active: true,
  });

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (authority) {
        setFormData({
          role_id: authority.role_id.toString(),
          is_cadet_approve: authority.is_cadet_approve,
          is_forward: authority.is_forward,
          is_final: authority.is_final,
          is_initial_cadet_approve: authority.is_initial_cadet_approve,
          is_initial_forward: authority.is_initial_forward,
          is_active: authority.is_active,
        });
      } else {
        setFormData({
          role_id: "",
          is_cadet_approve: false,
          is_forward: false,
          is_final: false,
          is_initial_cadet_approve: false,
          is_initial_forward: false,
          is_active: true,
        });
      }
    }
  }, [isOpen, authority]);

  const loadInitialData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const rolesRes = await roleService.getAllRoles({ per_page: 1000 });
      setRoles(rolesRes.data);
    } catch (err) {
      console.error("Failed to load roles:", err);
      setError("Failed to load required data. Please refresh the page.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        role_id: parseInt(formData.role_id),
      };

      if (authority) {
        await atwApprovalService.updateAuthority(authority.id, data);
      } else {
        await atwApprovalService.storeAuthority(data);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save authority:", err);
      setError("Failed to save authority. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton className="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase text-center">
            {authority ? "Edit ATW Authority" : "Add ATW Approval Authority"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Define roles and permissions for result approval processes.
          </p>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-10">
            <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Permissions & Status</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_cadet_approve}
                      onChange={(e) => setFormData({ ...formData, is_cadet_approve: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Cadet Approve</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_forward}
                      onChange={(e) => setFormData({ ...formData, is_forward: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Forward</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_final}
                      onChange={(e) => setFormData({ ...formData, is_final: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Final Authority</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_initial_cadet_approve}
                      onChange={(e) => setFormData({ ...formData, is_initial_cadet_approve: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Initial Cadet Approve</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_initial_forward}
                      onChange={(e) => setFormData({ ...formData, is_initial_forward: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Initial Forward</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Is Active</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                >
                  {loading ? (
                    <>
                      <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon icon={authority ? "hugeicons:tick-02" : "hugeicons:add-circle"} className="w-4 h-4" />
                      {authority ? "Update Authority" : "Save Authority"}
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
