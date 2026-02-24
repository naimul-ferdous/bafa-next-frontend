"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import { instructorAssignWingService } from "@/libs/services/instructorAssignWingService";
import { wingService } from "@/libs/services/wingService";
import { subWingService } from "@/libs/services/subWingService";
import type { InstructorBiodata, Wing, SubWing, InstructorAssignWing } from "@/libs/types/user";

interface InstructorAssignWingModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: InstructorBiodata | null;
  onSuccess?: () => void;
}

export default function InstructorAssignWingModal({
  isOpen,
  onClose,
  instructor,
  onSuccess,
}: InstructorAssignWingModalProps) {
  const [wings, setWings] = useState<Wing[]>([]);
  const [subWings, setSubWings] = useState<SubWing[]>([]);
  const [existingAssignments, setExistingAssignments] = useState<InstructorAssignWing[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedWingId, setSelectedWingId] = useState<number | "">("");
  const [selectedSubWingId, setSelectedSubWingId] = useState<number | "" | null>("");

  // Load wings and existing assignments
  useEffect(() => {
    if (isOpen && instructor) {
      loadData();
    }
  }, [isOpen, instructor]);

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
    try {
      const [wingsRes, assignmentsRes] = await Promise.all([
        wingService.getAllWings({ per_page: 100 }),
        instructor?.user_id ? instructorAssignWingService.getByInstructor(instructor.user_id) : Promise.resolve([]),
      ]);
      setWings(wingsRes.data);
      setExistingAssignments(assignmentsRes);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data");
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
    if (!instructor?.user_id || !selectedWingId) return;

    setLoading(true);
    setError(null);

    try {
      await instructorAssignWingService.create({
        wing_id: Number(selectedWingId),
        subwing_id: selectedSubWingId ? Number(selectedSubWingId) : null,
        instructor_id: instructor.user_id,
        status: "pending",
        is_active: true,
      });

      // Reload assignments
      const assignments = await instructorAssignWingService.getByInstructor(instructor.user_id);
      setExistingAssignments(assignments);

      // Reset form
      setSelectedWingId("");
      setSelectedSubWingId("");

      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to assign wing";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to remove this wing assignment?")) return;

    try {
      await instructorAssignWingService.delete(assignmentId);
      setExistingAssignments(prev => prev.filter(a => a.id !== assignmentId));
      onSuccess?.();
    } catch (err) {
      console.error("Failed to delete assignment:", err);
      setError("Failed to remove assignment");
    }
  };

  const getStatusBadge = (assignmentStatus: string) => {
    switch (assignmentStatus) {
      case "approved":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Approved</span>;
      case "processing":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Processing</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Pending</span>;
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
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Icon icon="hugeicons:hierarchy-square-01" className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Assign Wing</h3>
            <p className="text-sm text-gray-600">
              {instructor?.user?.name || "Instructor"} ({instructor?.user?.service_number || "N/A"})
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
            {existingAssignments.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Wing Assignments</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {existingAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <Icon icon="hugeicons:hierarchy-square-01" className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {assignment.wing?.name || "Unknown Wing"}
                          </p>
                          {assignment.sub_wing && (
                            <p className="text-xs text-gray-500">{assignment.sub_wing.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(assignment.status)}
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Remove"
                        >
                          <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                        </button>
                      </div>
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
            <form onSubmit={handleSubmit}>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Assignment</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Wing Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wing <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedWingId}
                    onChange={(e) => setSelectedWingId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Wing</option>
                    {wings.map((wing) => (
                      <option key={wing.id} value={wing.id}>
                        {wing.name} ({wing.code})
                      </option>
                    ))}
                  </select>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          </>
        )}
      </div>
    </Modal>
  );
}
