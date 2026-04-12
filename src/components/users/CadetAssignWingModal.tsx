"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import { cadetAssignmentService } from "@/libs/services/cadetAssignmentService";
import { wingService } from "@/libs/services/wingService";
import { subWingService } from "@/libs/services/subWingService";
import { cadetService } from "@/libs/services/cadetService";
import { useAuth } from "@/context/AuthContext";
import type { User, Wing, SubWing, CadetWingAssignment, CadetSubWingAssignment, CadetProfile } from "@/libs/types/user";

interface CadetAssignWingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  cadet?: CadetProfile | null;
  onSuccess?: () => void;
}

export default function CadetAssignWingModal({
  isOpen,
  onClose,
  user,
  cadet,
  onSuccess,
}: CadetAssignWingModalProps) {
  const { user: authUser } = useAuth();

  // Detect if the logged-in user is assigned to a flying wing (no subwing)
  const authUserFlyingWing = (
    authUser?.roleAssignments?.find(ra => ra.is_active && ra.wing?.is_flying && !ra.sub_wing_id) ||
    authUser?.role_assignments?.find(ra => (ra as {is_active?: boolean}).is_active && ra.wing?.is_flying && !(ra as {sub_wing_id?: number | null}).sub_wing_id)
  )?.wing ?? null;

  const [wings, setWings] = useState<Wing[]>([]);
  const [subWings, setSubWings] = useState<SubWing[]>([]);
  const [cadetProfile, setCadetProfile] = useState<CadetProfile | null>(null);
  const [wingAssignments, setWingAssignments] = useState<CadetWingAssignment[]>([]);
  const [subWingAssignments, setSubWingAssignments] = useState<CadetSubWingAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedWingId, setSelectedWingId] = useState<number | "">("");
  const [selectedSubWingId, setSelectedSubWingId] = useState<number | "" | null>("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Load wings and cadet profile
  useEffect(() => {
    if (isOpen && (user || cadet)) {
      loadData();
    }
    if (!isOpen) {
      // Reset to flying wing pre-selection on close
      setSelectedWingId(authUserFlyingWing ? authUserFlyingWing.id : "");
    }
  }, [isOpen, user, cadet]);

  // Pre-select the logged-in user's flying wing when wings are loaded
  useEffect(() => {
    if (authUserFlyingWing) {
      setSelectedWingId(authUserFlyingWing.id);
    }
  }, [authUserFlyingWing?.id]);

  // Load subwings when wing changes
  useEffect(() => {
    if (selectedWingId) {
      loadSubWings(Number(selectedWingId));
    } else {
      setSubWings([]);
      setSelectedSubWingId("");
    }
  }, [selectedWingId]);

  const loadData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      // 1. Get wings
      const wingsRes = await wingService.getAllWings({ per_page: 100 });
      setWings(wingsRes.data);

      let foundCadet: CadetProfile | null = null;

      if (cadet) {
        foundCadet = cadet;
      } else if (user) {
        const cadetsRes = await cadetService.getAllCadets({ search: user.service_number });
        foundCadet = cadetsRes.data.find(c => c.cadet_number === user.service_number || c.email === user.email) || null;
      }

      if (foundCadet) {
        setCadetProfile(foundCadet);

        // Seed directly from cadet prop data (already loaded by list page)
        if (foundCadet.assigned_wings) {
          setWingAssignments(foundCadet.assigned_wings);
        }
        if (foundCadet.assigned_sub_wings) {
          setSubWingAssignments(foundCadet.assigned_sub_wings);
        }

        // Fetch fresh from API only if prop data is missing
        if (!foundCadet.assigned_wings || !foundCadet.assigned_sub_wings) {
          const [wingAssRes, subWingAssRes] = await Promise.all([
            cadetAssignmentService.getCadetWings(foundCadet.id),
            cadetAssignmentService.getCadetSubWings(foundCadet.id),
          ]);
          if (!foundCadet.assigned_wings) setWingAssignments(wingAssRes || []);
          if (!foundCadet.assigned_sub_wings) setSubWingAssignments(subWingAssRes || []);
        }
      } else {
        setError("Cadet profile not found.");
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load cadet data and wings");
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
    if (!cadetProfile || !selectedWingId) return;

    setLoading(true);
    setError(null);

    try {
      // Assign Wing
      await cadetAssignmentService.assignWing({
        cadet_id: cadetProfile.id,
        wing_id: Number(selectedWingId),
        start_date: startDate,
      });

      // Assign Sub-Wing if selected
      if (selectedSubWingId) {
        await cadetAssignmentService.assignSubWing({
          cadet_id: cadetProfile.id,
          sub_wing_id: Number(selectedSubWingId),
          start_date: startDate,
        });
      }

      // Reload fresh assignments from API after save
      const [wingAssRes, subWingAssRes] = await Promise.all([
        cadetAssignmentService.getCadetWings(cadetProfile.id),
        cadetAssignmentService.getCadetSubWings(cadetProfile.id),
      ]);
      setWingAssignments(wingAssRes || []);
      setSubWingAssignments(subWingAssRes || []);

      // Reset form
      setSelectedWingId("");
      setSelectedSubWingId("");

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to assign wing");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWing = async (id: number) => {
    if (!confirm("Are you sure you want to remove this wing assignment?")) return;
    try {
      await cadetAssignmentService.removeWingAssignment(id);
      setWingAssignments(prev => prev.filter(a => a.id !== id));
      onSuccess?.();
    } catch (err) {
      console.error("Failed to remove wing:", err);
      setError("Failed to remove wing assignment");
    }
  };

  const handleRemoveSubWing = async (id: number) => {
    if (!confirm("Are you sure you want to remove this sub-wing assignment?")) return;
    try {
      await cadetAssignmentService.removeSubWingAssignment(id);
      setSubWingAssignments(prev => prev.filter(a => a.id !== id));
      onSuccess?.();
    } catch (err) {
      console.error("Failed to remove sub-wing:", err);
      setError("Failed to remove sub-wing assignment");
    }
  };

  const handleClose = () => {
    setSelectedWingId("");
    setSelectedSubWingId("");
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton className="max-w-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <Icon icon="hugeicons:hierarchy-square-01" className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Cadet Wing Assignment</h3>
            <p className="text-sm text-gray-600">
              {user?.name || cadet?.name || "Cadet"} ({user?.service_number || cadet?.cadet_number || "N/A"})
            </p>
          </div>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-10">
            <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Existing Assignments */}
            {(wingAssignments.length > 0 || subWingAssignments.length > 0) && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Assignments</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {/* Wings */}
                  {wingAssignments.map((assignment) => (
                    <div
                      key={`wing-${assignment.id}`}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <div className="flex items-center gap-3">
                        <Icon icon="hugeicons:hierarchy-square-01" className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-bold text-blue-900 uppercase">
                            Wing: {assignment.wing?.name || "Unknown"}
                          </p>
                          <p className="text-[10px] text-blue-700">
                            Since: {assignment.start_date ? new Date(assignment.start_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveWing(assignment.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remove Wing"
                      >
                        <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Sub-Wings */}
                  {subWingAssignments.map((assignment) => (
                    <div
                      key={`subwing-${assignment.id}`}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                    >
                      <div className="flex items-center gap-3">
                        <Icon icon="hugeicons:hierarchy-square-02" className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-bold text-green-900 uppercase">
                            Sub-Wing: {assignment.sub_wing?.name || "Unknown"}
                          </p>
                          <p className="text-[10px] text-green-700">
                            Since: {assignment.start_date ? new Date(assignment.start_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSubWing(assignment.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remove Sub-Wing"
                      >
                        <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Add New Assignment Form */}
            {cadetProfile && (
              <form onSubmit={handleSubmit} className="p-4 border border-gray-100 bg-gray-50/50 rounded-xl">
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                  Add New Assignment
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Wing Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wing <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedWingId}
                      onChange={(e) => setSelectedWingId(e.target.value ? Number(e.target.value) : "")}
                      className={`w-full px-3 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        authUserFlyingWing
                          ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-75"
                          : "bg-white border-gray-200"
                      }`}
                      disabled={!!authUserFlyingWing}
                      required
                    >
                      <option value="">Select Wing</option>
                      {wings.map((wing) => (
                        <option key={wing.id} value={wing.id}>
                          {wing.name} ({wing.code})
                        </option>
                      ))}
                    </select>
                    {authUserFlyingWing && (
                      <p className="mt-1 text-xs text-blue-600">
                        Wing locked to your assigned wing: <span className="font-semibold">{authUserFlyingWing.name}</span>
                      </p>
                    )}
                  </div>

                  {/* SubWing Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Wing (Optional)</label>
                    <select
                      value={selectedSubWingId || ""}
                      onChange={(e) => setSelectedSubWingId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!selectedWingId || subWings.length === 0}
                    >
                      <option value="">Select Sub-Wing</option>
                      {subWings.map((subWing) => (
                        <option key={subWing.id} value={subWing.id}>
                          {subWing.name} ({subWing.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedWingId}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                        Assign Wing
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
