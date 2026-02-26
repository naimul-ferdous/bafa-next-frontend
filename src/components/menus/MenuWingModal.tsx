"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import FullLogo from "@/components/ui/fulllogo";
import { commonService } from "@/libs/services/commonService";
import { menuService } from "@/libs/services/menuService";
import type { Menu } from "@/libs/types/menu";
import type { Wing, SubWing } from "@/libs/types/user";

interface MenuWingModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: Menu | null;
  onSaved: () => void;
}

export default function MenuWingModal({
  isOpen,
  onClose,
  menu,
  onSaved,
}: MenuWingModalProps) {
  const [wings, setWings] = useState<Wing[]>([]);
  const [allSubWings, setAllSubWings] = useState<SubWing[]>([]);
  const [subWings, setSubWings] = useState<SubWing[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedWing, setSelectedWing] = useState<number | null>(null);
  const [selectedSubWing, setSelectedSubWing] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (menu) {
      setSelectedWing(menu.wing_id || null);
      setSelectedSubWing(menu.subwing_id || null);
    }
  }, [menu, isOpen]);

  useEffect(() => {
    if (selectedWing) {
      const filtered = allSubWings.filter((sw) => sw.wing_id === selectedWing);
      setSubWings(filtered);
    } else {
      setSubWings([]);
    }
  }, [selectedWing, allSubWings]);

  const loadData = async () => {
    setLoadingData(true);
    setError("");
    try {
      const data = await commonService.getResultOptions();
      if (data) {
        setWings(data.wings || []);
        setAllSubWings(data.sub_wings || []);
      }
    } catch (err) {
      console.error("Failed to load options:", err);
      setError("Failed to load wings and sub wings");
    } finally {
      setLoadingData(false);
    }
  };

  const handleWingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value) : null;
    setSelectedWing(val);
    setSelectedSubWing(null); // Reset subwing when wing changes
  };

  const handleSubWingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value) : null;
    setSelectedSubWing(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menu) return;
    setError("");
    setLoading(true);
    try {
      await menuService.updateMenu(menu.id, {
        name: menu.name,
        slug: menu.slug,
        order: menu.order,
        is_active: menu.is_active,
        wing_id: selectedWing,
        subwing_id: selectedSubWing,
      });
      onSaved();
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to update menu assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      showCloseButton={true}
      className="max-w-md max-h-[80vh] overflow-y-auto p-0 [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent"
    >
      <form onSubmit={handleSubmit} className="p-8">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-6">
          <div>
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4">
            Assign Wing & Sub Wing
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wing
              </label>
              <select
                value={selectedWing || ""}
                onChange={handleWingChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">All Wings</option>
                {wings.map((wing) => (
                  <option key={wing.id} value={wing.id}>
                    {wing.name} {wing.code ? `(${wing.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sub Wing
              </label>
              <select
                value={selectedSubWing || ""}
                onChange={handleSubWingChange}
                className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  !selectedWing ? "bg-gray-50 dark:bg-gray-900 cursor-not-allowed" : ""
                }`}
                disabled={!selectedWing}
              >
                {!selectedWing ? (
                  <option value="">Select Wing First</option>
                ) : subWings.length === 0 ? (
                  <option value="">No Sub Wings Available</option>
                ) : (
                  <>
                    <option value="">All Sub Wings</option>
                    {subWings.map((subWing) => (
                      <option key={subWing.id} value={subWing.id}>
                        {subWing.name} {subWing.code ? `(${subWing.code})` : ""}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || loadingData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loading ? "Saving..." : "Save Assignment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
