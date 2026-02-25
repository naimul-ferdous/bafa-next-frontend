"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import FullLogo from "@/components/ui/fulllogo";
import { permissionService } from "@/libs/services/permissionService";
import { menuService } from "@/libs/services/menuService";
import type { Menu, Permission } from "@/libs/types/menu";

interface MenuPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: Menu | null;
  onSaved: () => void;
}

export default function MenuPermissionModal({
  isOpen,
  onClose,
  menu,
  onSaved,
}: MenuPermissionModalProps) {
  const [grouped, setGrouped] = useState<Record<string, Permission[]>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && menu) {
      loadData();
    }
  }, [isOpen, menu]);

  const loadData = async () => {
    setLoadingData(true);
    setError("");
    setSearch("");
    try {
      const response = await permissionService.getGroupedByCode({ per_page: 999 });
      setGrouped(response.data);
      setSelectedIds(new Set((menu?.permissions || []).map((p) => p.id)));
    } catch (err) {
      console.error("Failed to load permissions:", err);
      setError("Failed to load permissions");
    } finally {
      setLoadingData(false);
    }
  };

  const filteredGrouped = useMemo(() => {
    if (!search.trim()) return grouped;
    const lower = search.toLowerCase();
    const result: Record<string, Permission[]> = {};
    for (const [key, items] of Object.entries(grouped)) {
      const filtered = items.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.slug.toLowerCase().includes(lower) ||
          key.toLowerCase().includes(lower)
      );
      if (filtered.length > 0) result[key] = filtered;
    }
    return result;
  }, [grouped, search]);

  const allFilteredIds = useMemo(
    () => Object.values(filteredGrouped).flatMap((items) => items.map((p) => p.id)),
    [filteredGrouped]
  );

  const allFilteredSelected =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));

  const togglePermission = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleGroup = (items: Permission[]) => {
    const allSelected = items.every((p) => selectedIds.has(p.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      items.forEach((p) => (allSelected ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        allFilteredIds.forEach((id) => next.delete(id));
      } else {
        allFilteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menu) return;
    setError("");
    setLoading(true);
    try {
      await menuService.assignPermissions(menu.id, Array.from(selectedIds));
      onSaved();
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to save permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearch("");
    setError("");
    onClose();
  };

  const allPermissionsFlat = useMemo(() => Object.values(grouped).flat(), [grouped]);

  const selectedPermissions = useMemo(
    () => allPermissionsFlat.filter((p) => selectedIds.has(p.id)),
    [allPermissionsFlat, selectedIds]
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton={true} className="max-w-2xl max-h-[80vh] overflow-y-auto p-0 [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent">
      <form onSubmit={handleSubmit} className="p-8">

        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-6">
          <div>
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Assign Permissions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Menu: <span className="font-medium text-gray-700 dark:text-gray-300">{menu?.name}</span>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {loadingData ? (
          <div className="flex items-center justify-center py-10">
            <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">

            {/* Selected permissions chips */}
            {selectedPermissions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selected
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full font-semibold">
                    {selectedPermissions.length}
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent">
                  {selectedPermissions.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      {p.name}
                      <button
                        type="button"
                        onClick={() => togglePermission(p.id)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Icon icon="hugeicons:cancel-01" className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Search + Select All */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search permissions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                Select All
              </label>
            </div>

            {/* Grouped permission list */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-0 [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent">
              {Object.keys(filteredGrouped).length === 0 ? (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
                  No permissions found
                </p>
              ) : (
                Object.entries(filteredGrouped).map(([code, items]) => {
                  const allGroupSelected = items.every((p) => selectedIds.has(p.id));
                  const someGroupSelected = items.some((p) => selectedIds.has(p.id));
                  return (
                    <div
                      key={code}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                    >
                      {/* Group header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allGroupSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = !allGroupSelected && someGroupSelected;
                            }}
                            onChange={() => toggleGroup(items)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wide">
                            {code}
                          </span>
                        </label>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full">
                          {items.filter((p) => selectedIds.has(p.id)).length}/{items.length}
                        </span>
                      </div>
                      {/* Items */}
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {items.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">
                              {permission.name}
                            </span>
                            <span className="font-mono text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                              {permission.slug}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${permission.is_active ? "bg-green-500" : "bg-red-400"}`} />
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || loadingData}
            className="px-6 py-2 bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
