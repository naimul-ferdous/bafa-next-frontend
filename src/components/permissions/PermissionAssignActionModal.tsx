"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import { permissionService } from "@/libs/services/permissionService";
import type { Permission, PermissionAction } from "@/libs/types/menu";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  code: string;
  permissions: Permission[]; // existing permissions in this code group
}

export default function PermissionAssignActionModal({ isOpen, onClose, onSuccess, code, permissions }: Props) {
  const [availableActions, setAvailableActions] = useState<PermissionAction[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // IDs / codes already assigned in this group (match by ID or by action relation code or by slug suffix)
  const assignedActionIds = permissions
    .map((p) => p.permission_action_id ?? p.action?.id)
    .filter((id): id is number => id != null);

  const assignedActionCodes = permissions
    .map((p) => p.action?.code ?? p.slug?.replace(`${code}-`, "") ?? "")
    .filter(Boolean);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds([]);
    setError(null);

    const load = async () => {
      setLoading(true);
      try {
        const actions = await permissionService.getAvailableActions();
        setAvailableActions(actions);
      } catch {
        setError("Failed to load actions.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen]);

  const isActionAssigned = (action: PermissionAction) =>
    assignedActionIds.includes(action.id) || assignedActionCodes.includes(action.code);

  const toggleAction = (id: number, actionCode: string) => {
    if (isActionAssigned({ id, code: actionCode } as PermissionAction)) return; // already assigned, cannot toggle
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) { onClose(); return; }

    // Use first existing permission as a template
    const template = permissions[0];
    if (!template) { setError("No reference permission found."); return; }

    setSaving(true);
    setError(null);
    try {
      await Promise.all(
        selectedIds.map((actionId) => {
          const action = availableActions.find((a) => a.id === actionId);
          if (!action) return null;
          return permissionService.createPermission({
            name:                 `${template.name.replace(/\s+\w+$/, "")} ${action.name}`.trim(),
            code:                 code,
            slug:                 `${code}-${action.code}`,
            module:               template.module,
            wing_id:              template.wing_id   ?? null,
            subwing_id:           template.subwing_id ?? null,
            is_active:            true,
            permission_action_id: actionId,
          });
        })
      );
      onSuccess();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { setError(null); onClose(); };

  const ACTION_COLORS: Record<string, string> = {
    view:   "bg-blue-100   text-blue-700   border-blue-200",
    add:    "bg-green-100  text-green-700  border-green-200",
    edit:   "bg-yellow-100 text-yellow-700 border-yellow-200",
    delete: "bg-red-100    text-red-700    border-red-200",
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton className="max-w-sm">
      <div className="p-6">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Assign Actions</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Permission code: <span className="font-mono font-semibold text-gray-700 uppercase">{code}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Action list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Icon icon="hugeicons:fan-01" className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {availableActions.map((action) => {
              const isAssigned = isActionAssigned(action);
              const isSelected = selectedIds.includes(action.id);
              const color = ACTION_COLORS[action.code] ?? "bg-gray-100 text-gray-700 border-gray-200";
              return (
                <label
                  key={action.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isAssigned
                      ? `${color} opacity-70 cursor-not-allowed`
                      : isSelected
                        ? `${color} cursor-pointer`
                        : "bg-gray-50 border-gray-200 text-gray-600 cursor-pointer hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isAssigned || isSelected}
                    disabled={isAssigned}
                    onChange={() => toggleAction(action.id, action.code)}
                    className="w-4 h-4 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{action.name}</span>
                    <span className="ml-2 text-xs font-mono opacity-60">{action.code}</span>
                  </div>
                  {isAssigned && (
                    <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4 opacity-60 flex-shrink-0" />
                  )}
                </label>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || selectedIds.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
          >
            {saving
              ? <><Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />Saving...</>
              : <><Icon icon="hugeicons:tick-02" className="w-4 h-4" />Add {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}</>
            }
          </button>
        </div>
      </div>
    </Modal>
  );
}
