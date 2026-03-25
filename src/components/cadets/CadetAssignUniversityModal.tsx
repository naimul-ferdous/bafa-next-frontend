"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import { cadetAssignmentService } from "@/libs/services/cadetAssignmentService";
import { universityService } from "@/libs/services/universityService";
import { universitySemesterService, SystemUniversitySemester } from "@/libs/services/universitySemesterService";
import type { CadetProfile, CadetUniversityAssignment } from "@/libs/types/user";
import type { SystemUniversity, AtwUniversityDepartment } from "@/libs/types/system";
import apiClient from "@/libs/auth/api-client";
import { getToken } from "@/libs/auth/auth-token";
import FullLogo from "../ui/fulllogo";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cadet?: CadetProfile | null;
  onSuccess?: () => void;
}

export default function CadetAssignUniversityModal({ isOpen, onClose, cadet, onSuccess }: Props) {
  const [universities, setUniversities] = useState<SystemUniversity[]>([]);
  const [departments, setDepartments] = useState<AtwUniversityDepartment[]>([]);
  const [universitySemesters, setUniversitySemesters] = useState<SystemUniversitySemester[]>([]);
  const [assignments, setAssignments] = useState<CadetUniversityAssignment[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state (used for both new assign and edit)
  const [editingAssignment, setEditingAssignment] = useState<CadetUniversityAssignment | null>(null);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | "">("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | "">("");
  const [selectedUniversitySemesterId, setSelectedUniversitySemesterId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [isCurrent, setIsCurrent] = useState(true);

  // Derived from cadet prop
  const currentSemesterAssignment = cadet?.assigned_semesters?.find((s) => s.is_current);
  const currentProgramAssignment  = cadet?.assigned_programs?.find((p) => p.is_current);

  const changeableProgramEntry = currentProgramAssignment?.program?.changeable_semesters?.find(
    (cs) => cs.semester_id === currentSemesterAssignment?.semester_id
  ) ?? currentProgramAssignment?.program?.changeable_semesters?.[0] ?? null;

  // Check if this semester already has an assignment
  const existingForSemester = assignments.find(
    (a) => a.semester_id === currentSemesterAssignment?.semester_id
  ) ?? null;

  const isEditing = editingAssignment !== null;

  useEffect(() => {
    if (isOpen && cadet) loadData();
  }, [isOpen, cadet]);

  // Reset edit state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditingAssignment(null);
      setSelectedUniversityId("");
      setSelectedDepartmentId("");
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedUniversityId && !editingAssignment) {
      loadDepartments(Number(selectedUniversityId));
      loadUniversitySemesters(Number(selectedUniversityId));
    } else if (!selectedUniversityId) {
      setDepartments([]);
      setSelectedDepartmentId("");
      setUniversitySemesters([]);
      setSelectedUniversitySemesterId("");
    }
  }, [selectedUniversityId]);

  const loadData = async () => {
    if (!cadet) return;
    setLoadingData(true);
    setError(null);
    try {
      const [univRes, assRes] = await Promise.all([
        universityService.getAllUniversities({ per_page: 100 }),
        cadetAssignmentService.getCadetUniversities(cadet.id),
      ]);
      setUniversities(univRes.data);
      setAssignments(assRes || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const loadDepartments = async (universityId: number, preselectedDepartmentId?: number | "") => {
    try {
      const token = getToken();
      const res = await apiClient.get<{ data: AtwUniversityDepartment[] }>(
        `/atw-university-departments?university_id=${universityId}&per_page=100`,
        token
      );
      setDepartments(res?.data || []);
      setSelectedDepartmentId(preselectedDepartmentId ?? "");
    } catch {
      setDepartments([]);
    }
  };

  const loadUniversitySemesters = async (universityId: number, preselectedId?: number | "") => {
    try {
      const res = await universitySemesterService.getAll({ university_id: universityId, per_page: 100 });
      setUniversitySemesters(res.data || []);
      setSelectedUniversitySemesterId(preselectedId ?? "");
    } catch {
      setUniversitySemesters([]);
    }
  };

  const handleEdit = (a: CadetUniversityAssignment) => {
    setEditingAssignment(a);
    setSelectedUniversityId(a.university_id);
    setSelectedDepartmentId(a.atw_university_department_id ?? "");
    setSelectedUniversitySemesterId(a.university_semester_id ?? "");
    setStartDate(a.start_date ? new Date(a.start_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    setIsCurrent(a.is_current ?? true);
    if (a.university_id) {
      loadDepartments(a.university_id, a.atw_university_department_id ?? "");
      loadUniversitySemesters(a.university_id, a.university_semester_id ?? "");
    }
  };

  const handleCancelEdit = () => {
    setEditingAssignment(null);
    setSelectedUniversityId("");
    setSelectedDepartmentId("");
    setSelectedUniversitySemesterId("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadet || !selectedUniversityId || !selectedDepartmentId) return;
    setLoading(true);
    setError(null);
    try {
      if (isEditing && editingAssignment) {
        await cadetAssignmentService.updateUniversityAssignment(editingAssignment.id, {
          university_id: Number(selectedUniversityId),
          university_semester_id: selectedUniversitySemesterId ? Number(selectedUniversitySemesterId) : null,
          atw_university_department_id: Number(selectedDepartmentId),
          changeable_program_id: changeableProgramEntry?.id ?? null,
          start_date: startDate,
          is_current: isCurrent,
        });
      } else {
        if (!currentSemesterAssignment?.semester_id) return;
        await cadetAssignmentService.assignUniversity({
          cadet_id: cadet.id,
          university_id: Number(selectedUniversityId),
          university_semester_id: selectedUniversitySemesterId ? Number(selectedUniversitySemesterId) : null,
          semester_id: currentSemesterAssignment.semester_id,
          atw_university_department_id: Number(selectedDepartmentId),
          changeable_program_id: changeableProgramEntry?.id ?? null,
          start_date: startDate,
          is_current: isCurrent,
        });
      }
      const updated = await cadetAssignmentService.getCadetUniversities(cadet.id);
      setAssignments(updated || []);
      setEditingAssignment(null);
      setSelectedUniversityId("");
      setSelectedDepartmentId("");
      setSelectedUniversitySemesterId("");
      setIsCurrent(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm("Remove this university assignment?")) return;
    try {
      await cadetAssignmentService.removeUniversityAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      if (editingAssignment?.id === id) handleCancelEdit();
      onSuccess?.();
    } catch {
      setError("Failed to remove assignment");
    }
  };

  const handleClose = () => {
    setEditingAssignment(null);
    setSelectedUniversityId("");
    setSelectedDepartmentId("");
    setSelectedUniversitySemesterId("");
    setError(null);
    onClose();
  };

  // Whether to show the new-assign form (only if no existing for this semester)
  const showForm = isEditing || !existingForSemester;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton className="max-w-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 flex items-center justify-center">
            <FullLogo />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Assign University</h3>
            <p className="text-sm text-gray-500">{cadet?.name} — {cadet?.cadet_number}</p>
          </div>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-10">
            <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-[10px] font-bold text-indigo-400 uppercase mb-0.5">Current Semester</p>
                <p className="text-sm font-semibold text-indigo-900">
                  {currentSemesterAssignment?.semester?.name || "—"}
                </p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                <p className="text-[10px] font-bold text-purple-400 uppercase mb-0.5">Changeable Program</p>
                <p className="text-sm font-semibold text-purple-900">
                  {currentProgramAssignment?.program?.name || "—"}
                </p>
                {currentProgramAssignment?.program?.short_name && (
                  <p className="text-xs text-purple-500">{currentProgramAssignment.program.short_name}</p>
                )}
                {(() => {
                  const cs = currentProgramAssignment?.program?.changeable_semesters;
                  const first = cs && cs.length > 0 ? cs[0] : null;
                  if (!first) return null;
                  return (
                    <>
                      <Icon icon="hugeicons:arrow-down-02" className="text-center w-4 h-4" />
                      <div className="mt-1.5 pt-1.5">
                        <p className="text-xs font-semibold text-purple-800">{first.name}</p>
                        {first.short_name && (
                          <p className="text-[11px] text-purple-500">{first.short_name}</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {assignments.length > 0 && (
              <div className="mb-4">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {assignments.map((a) => {
                    const isThisSemester = a.semester_id === currentSemesterAssignment?.semester_id;
                    const isBeingEdited = editingAssignment?.id === a.id;
                    return (
                      <div
                        key={a.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${isBeingEdited ? "bg-yellow-50 border-yellow-200" : a.is_current ? "bg-blue-50 border-blue-100" : "bg-gray-50 border-gray-100"}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon icon="hugeicons:university" className="w-5 h-5 text-blue-500 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {a.university?.name || "Unknown"}
                              {a.is_current && (
                                <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold uppercase">Current</span>
                              )}
                              {isThisSemester && !isBeingEdited && (
                                <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold uppercase">This Semester</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {a.department?.name && <span>{a.department.name} · </span>}
                              {a.university_semester?.name && <span>{a.university_semester.name} · </span>}
                              {a.semester?.name} · Since {a.start_date ? new Date(a.start_date).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isBeingEdited ? (
                            <button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Cancel Edit">
                              <Icon icon="hugeicons:cancel-01" className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => handleEdit(a)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Edit">
                              <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleRemove(a.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Remove">
                            <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notice when semester already assigned and not editing */}
            {existingForSemester && !isEditing && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-center gap-2">
                <Icon icon="hugeicons:information-circle" className="w-4 h-4 shrink-0" />
                University already assigned for <strong>{currentSemesterAssignment?.semester?.name}</strong>. Click the edit button above to change it.
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            {/* Form — shown only for new assign or when editing */}
            {showForm && (
              <form onSubmit={handleSubmit} className="p-4 border border-gray-100 bg-gray-50/50 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* University */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      University <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedUniversityId}
                      onChange={(e) => setSelectedUniversityId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select University</option>
                      {universities.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* University Semester */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      University Semester
                    </label>
                    <select
                      value={selectedUniversitySemesterId}
                      onChange={(e) => setSelectedUniversitySemesterId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={!selectedUniversityId}
                    >
                      <option value="">Select Semester (optional)</option>
                      {universitySemesters.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}{s.short_name ? ` (${s.short_name})` : ""}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={!selectedUniversityId || departments.length === 0}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Is Current */}
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCurrent}
                    onChange={(e) => setIsCurrent(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Mark as current university
                </label>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {isEditing && (
                    <button type="button" onClick={handleCancelEdit} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                      Cancel
                    </button>
                  )}
                  <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedUniversityId || !selectedDepartmentId}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <><Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />{isEditing ? "Saving..." : "Assigning..."}</>
                    ) : (
                      <><Icon icon={isEditing ? "hugeicons:checkmark-circle-02" : "hugeicons:add-circle"} className="w-4 h-4" />{isEditing ? "Save Changes" : "Assign University"}</>
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
