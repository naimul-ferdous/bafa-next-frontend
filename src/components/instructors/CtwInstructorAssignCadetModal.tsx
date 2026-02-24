/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { cadetService } from "@/libs/services/cadetService";
import FullLogo from "@/components/ui/fulllogo";
import { Icon } from "@iconify/react";
import { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup } from "@/libs/types/system";
import { CadetProfile, InstructorBiodata } from "@/libs/types/user";
import { CtwInstructorAssignCadet, ctwInstructorAssignCadetService } from "@/libs/services/ctwInstructorAssignCadetService";
import { commonService } from "@/libs/services/commonService";
import type { CtwResultsModule } from "@/libs/types/ctw";

interface CtwInstructorAssignCadetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instructor: InstructorBiodata | null;
}

export default function CtwInstructorAssignCadetModal({ isOpen, onClose, onSuccess, instructor }: CtwInstructorAssignCadetModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Options
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [modules, setModules] = useState<CtwResultsModule[]>([]);

  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [existingAssignments, setExistingAssignments] = useState<CtwInstructorAssignCadet[]>([]);
  const [selectedCadetIds, setSelectedCadetIds] = useState<number[]>([]);
  const [cadetSearch, setCadetSearch] = useState("");

  const [formData, setFormData] = useState({
    course_id: "",
    semester_id: "",
    program_id: "",
    branch_id: "",
    group_id: "",
    ctw_results_module_id: "",
    is_active: true,
  });

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      setFormData({
        course_id: "",
        semester_id: "",
        program_id: "",
        branch_id: "",
        group_id: "",
        ctw_results_module_id: "",
        is_active: true,
      });
      setSelectedCadetIds([]);
      setCadetSearch("");
      setError("");
    }
  }, [isOpen, instructor]);

  // Load cadets and assignments when selection context changes
  useEffect(() => {
    const loadCadetsAndAssignments = async () => {
      if (formData.course_id && formData.semester_id && formData.ctw_results_module_id) {
        try {
          const commonParams = {
            course_id: Number(formData.course_id),
            semester_id: Number(formData.semester_id),
            program_id: formData.program_id ? Number(formData.program_id) : undefined,
            branch_id: formData.branch_id ? Number(formData.branch_id) : undefined,
            group_id: formData.group_id ? Number(formData.group_id) : undefined,
          };

          const [cadetsRes, assignmentsRes] = await Promise.all([
            cadetService.getAllCadets({
              ...commonParams,
              per_page: 500,
            }),
            ctwInstructorAssignCadetService.getAll({
              ...commonParams,
              ctw_results_module_id: Number(formData.ctw_results_module_id),
              per_page: 500,
            })
          ]);

          setCadets(cadetsRes.data);
          setExistingAssignments(assignmentsRes.data);
        } catch (err: any) {
          console.error("Failed to load cadets/assignments:", err);
        }
      } else {
        setCadets([]);
        setExistingAssignments([]);
        setSelectedCadetIds([]);
      }
    };

    loadCadetsAndAssignments();
  }, [formData.course_id, formData.semester_id, formData.program_id, formData.branch_id, formData.group_id, formData.ctw_results_module_id, instructor?.user_id]);

  const loadOptions = async () => {
    try {
      const options = await commonService.getResultOptions();
      if (options) {
        setCourses(options.courses);
        setSemesters(options.semesters);
        setPrograms(options.programs);
        setBranches(options.branches);
        setGroups(options.groups);

        // Extract modules from instructor's CTW assigned modules
        if (instructor?.user?.ctw_assigned_modules) {
          const assignedModules = instructor.user.ctw_assigned_modules
            .filter((am: any) => am.is_active && am.module)
            .map((am: any) => am.module);
          // De-duplicate by module id
          const uniqueModules = assignedModules.filter(
            (m: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === m.id) === i
          );
          setModules(uniqueModules);
        } else {
          setModules([]);
        }
      }
    } catch (err: any) {
      console.error("Failed to load options:", err);
      setError("Failed to load dropdown options.");
    }
  };

  // Get the selected module's instructor_count
  const selectedModule = modules.find(m => m.id === Number(formData.ctw_results_module_id));
  const maxInstructors = selectedModule?.instructor_count || 0;

  // Get all assignments for a specific cadet
  const getCadetAssignments = (cadetId: number) => {
    return existingAssignments.filter(a => a.cadet_id === cadetId);
  };

  // Count unique instructors assigned to a cadet for this module
  const getCadetAssignedInstructorCount = (cadetId: number) => {
    const assignments = getCadetAssignments(cadetId);
    return new Set(assignments.map(a => a.instructor_id)).size;
  };

  // Check if cadet is assigned to THIS instructor
  const isCadetAssignedToMe = (cadetId: number) => {
    return existingAssignments.some(a => a.cadet_id === cadetId && a.instructor_id === instructor?.user_id);
  };

  // Check if cadet has reached instructor_count limit
  const isCadetFull = (cadetId: number) => {
    if (maxInstructors <= 0) return false;
    return getCadetAssignedInstructorCount(cadetId) >= maxInstructors;
  };

  const handleCadetSelection = (cadetId: number) => {
    setSelectedCadetIds(prev =>
      prev.includes(cadetId)
        ? prev.filter(id => id !== cadetId)
        : [...prev, cadetId]
    );
  };

  const handleSelectAllCadets = () => {
    const availableFilteredIds = filteredCadets
      .filter(c => !isCadetAssignedToMe(c.id) && !isCadetFull(c.id))
      .map(c => c.id);

    if (availableFilteredIds.length === 0) return;

    const allAvailableSelected = availableFilteredIds.every(id => selectedCadetIds.includes(id));

    if (allAvailableSelected) {
      setSelectedCadetIds(prev => prev.filter(id => !availableFilteredIds.includes(id)));
    } else {
      setSelectedCadetIds(prev => Array.from(new Set([...prev, ...availableFilteredIds])));
    }
  };

  const filteredCadets = cadets.filter(c =>
    c.name.toLowerCase().includes(cadetSearch.toLowerCase()) ||
    (c.cadet_number && c.cadet_number.toLowerCase().includes(cadetSearch.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!instructor?.user) {
      setError("No instructor selected.");
      return;
    }

    if (!formData.course_id || !formData.semester_id || !formData.ctw_results_module_id) {
      setError("Please select a module first.");
      return;
    }

    if (selectedCadetIds.length === 0) {
      setError("Please select at least one cadet.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await ctwInstructorAssignCadetService.create({
        instructor_id: instructor.user_id,
        course_id: Number(formData.course_id),
        semester_id: Number(formData.semester_id),
        program_id: formData.program_id ? Number(formData.program_id) : undefined,
        branch_id: formData.branch_id ? Number(formData.branch_id) : undefined,
        group_id: formData.group_id ? Number(formData.group_id) : undefined,
        ctw_results_module_id: Number(formData.ctw_results_module_id),
        cadet_ids: selectedCadetIds,
        is_active: formData.is_active,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to assign cadets:", err);
      setError(err.response?.data?.message || err.message || "Failed to assign cadets.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    if (name === "ctw_results_module_id") {
      // Find the assignment for this module to auto-fill scope fields
      const assignment = instructor?.user?.ctw_assigned_modules?.find(
        (am: any) => am.ctw_results_module_id === Number(value) && am.is_active
      );

      if (assignment) {
        setFormData(prev => ({
          ...prev,
          ctw_results_module_id: value,
          course_id: String(assignment.course_id),
          semester_id: String(assignment.semester_id),
          program_id: assignment.program_id ? String(assignment.program_id) : "",
          branch_id: assignment.branch_id ? String(assignment.branch_id) : "",
          group_id: assignment.group_id ? String(assignment.group_id) : "",
        }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true} className="max-w-6xl p-0 overflow-hidden">
      <form onSubmit={handleSubmit} className="flex flex-col h-[90vh]">
        {/* Header */}
        <div className="px-8 py-4 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
            <FullLogo />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Assign Cadets to Module</h2>
              <p className="text-xs text-gray-500">Instructor: {instructor?.user ? `${instructor.user.name} (${instructor.user.service_number})` : "..."}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-8 mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs flex items-center gap-2 shrink-0">
            <Icon icon="hugeicons:alert-circle" className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden p-8 pt-0 gap-8">
          {/* Left Column: Module Selection & Read-only Details */}
          <div className="w-1/3 space-y-6 overflow-y-auto pr-2 custom-scrollbar border-r border-gray-100">
            <div className="space-y-6 pt-4">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Icon icon="hugeicons:package" className="w-4 h-4" />
                  Select Module
                </h3>
                <select
                  value={formData.ctw_results_module_id}
                  onChange={(e) => handleChange("ctw_results_module_id", e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold"
                >
                  <option value="">Choose from assigned modules...</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Icon icon="hugeicons:configuration-01" className="w-4 h-4" />
                  Assignment Scope
                </h3>

                <div className="space-y-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <div className="flex items-start text-sm">
                    <span className="w-24 text-gray-500 font-medium">Course</span>
                    <span className="mx-2 text-gray-400">:</span>
                    <span className="flex-1 font-bold text-gray-900">
                      {formData.course_id ? courses.find(c => c.id === Number(formData.course_id))?.name : "—"}
                    </span>
                  </div>
                  <div className="flex items-start text-sm">
                    <span className="w-24 text-gray-500 font-medium">Semester</span>
                    <span className="mx-2 text-gray-400">:</span>
                    <span className="flex-1 font-bold text-gray-900">
                      {formData.semester_id ? semesters.find(s => s.id === Number(formData.semester_id))?.name : "—"}
                    </span>
                  </div>
                  <div className="flex items-start text-sm">
                    <span className="w-24 text-gray-500 font-medium">Program</span>
                    <span className="mx-2 text-gray-400">:</span>
                    <span className="flex-1 font-bold text-gray-900">
                      {formData.program_id ? programs.find(p => p.id === Number(formData.program_id))?.name : "—"}
                    </span>
                  </div>
                  <div className="flex items-start text-sm">
                    <span className="w-24 text-gray-500 font-medium">Branch</span>
                    <span className="mx-2 text-gray-400">:</span>
                    <span className="flex-1 font-bold text-gray-900">
                      {formData.branch_id ? branches.find(b => b.id === Number(formData.branch_id))?.name : "—"}
                    </span>
                  </div>
                  <div className="flex items-start text-sm">
                    <span className="w-24 text-gray-500 font-medium">Group</span>
                    <span className="mx-2 text-gray-400">:</span>
                    <span className="flex-1 font-bold text-gray-900">
                      {formData.group_id ? groups.find(g => g.id === Number(formData.group_id))?.name : "All Groups"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Cadet Selection */}
          <div className="flex-1 flex flex-col min-w-0 pt-4">
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Icon icon="hugeicons:user-group" className="w-4 h-4" />
                  Cadet Selection
                </h3>
                {cadets.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllCadets}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all"
                  >
                    <Icon icon={filteredCadets.filter(c => !isCadetAssignedToMe(c.id) && !isCadetFull(c.id)).length > 0 && filteredCadets.filter(c => !isCadetAssignedToMe(c.id) && !isCadetFull(c.id)).every(c => selectedCadetIds.includes(c.id)) ? "hugeicons:tick-02" : "hugeicons:checklist"} className="w-4 h-4" />
                    {filteredCadets.filter(c => !isCadetAssignedToMe(c.id) && !isCadetFull(c.id)).length > 0 && filteredCadets.filter(c => !isCadetAssignedToMe(c.id) && !isCadetFull(c.id)).every(c => selectedCadetIds.includes(c.id)) ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              <div className="relative">
                <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or BD number..."
                  value={cadetSearch}
                  onChange={(e) => setCadetSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  disabled={!formData.ctw_results_module_id}
                />
              </div>
            </div>

            <div className="flex-1 border border-gray-100 rounded-2xl overflow-hidden">
              <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                {filteredCadets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredCadets.map((cadet) => {
                      const assignedToMe = isCadetAssignedToMe(cadet.id);
                      const full = isCadetFull(cadet.id);
                      const assignedCount = getCadetAssignedInstructorCount(cadet.id);
                      const isDisabled = assignedToMe || (full && !assignedToMe);
                      const isSelected = selectedCadetIds.includes(cadet.id);
                      const hasPartialAssignments = assignedCount > 0 && !full && !assignedToMe;

                      return (
                        <div
                          key={cadet.id}
                          className={`relative p-3 rounded-xl border transition-all cursor-pointer group ${
                            assignedToMe
                              ? 'border-green-200 bg-green-50/50 cursor-not-allowed'
                              : full
                                ? 'border-red-200 bg-red-50/50 cursor-not-allowed'
                                : isSelected
                                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                                  : hasPartialAssignments
                                    ? 'border-orange-200 bg-orange-50/30 hover:border-blue-200'
                                    : 'border-gray-200 bg-white hover:border-blue-200'
                          }`}
                          onClick={() => !isDisabled && handleCadetSelection(cadet.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              assignedToMe
                                ? 'bg-green-100 text-green-600'
                                : full
                                  ? 'bg-red-100 text-red-600'
                                  : isSelected
                                    ? 'bg-blue-600 text-white'
                                    : hasPartialAssignments
                                      ? 'bg-orange-100 text-orange-500'
                                      : 'bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500'
                            }`}>
                              <Icon icon={assignedToMe ? "hugeicons:tick-02" : full ? "hugeicons:cancel-01" : "hugeicons:user"} className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${
                                assignedToMe ? 'text-green-900' : full ? 'text-red-900' : isSelected ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {cadet.name}
                              </p>
                              <p className="text-[10px] text-gray-500 font-mono tracking-tighter">
                                BD-{cadet.cadet_number}
                              </p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              {maxInstructors > 0 && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  assignedToMe
                                    ? 'bg-green-100 text-green-700'
                                    : full
                                      ? 'bg-red-100 text-red-700'
                                      : assignedCount > 0
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {assignedCount}/{maxInstructors}
                                </span>
                              )}
                              {isSelected && !isDisabled && (
                                <Icon icon="hugeicons:tick-02" className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Icon icon="hugeicons:user-group" className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-sm font-bold text-gray-500 mb-1">
                      {!formData.ctw_results_module_id
                        ? "Select Module First"
                        : cadetSearch ? "No Cadets Found" : "No Cadets Available"}
                    </p>
                    <p className="text-xs text-gray-400 max-w-[200px]">
                      {!formData.ctw_results_module_id
                        ? "Please select a module from the dropdown above to view and assign cadets."
                        : cadetSearch ? `No matches found for "${cadetSearch}"` : "There are no cadets matching the selected criteria."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedCadetIds.length > 0 && (
              <div className="mt-4 px-4 py-2 bg-blue-50 rounded-lg flex items-center justify-between shrink-0 border border-blue-100">
                <span className="text-xs font-bold text-blue-700">
                  {selectedCadetIds.length} Cadets selected for assignment
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCadetIds([])}
                  className="text-[10px] uppercase font-bold text-blue-600 hover:underline"
                >
                  Clear Selection
                </button>
              </div>
            )}

            <div className="flex justify-end items-center gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none"
                disabled={loading || selectedCadetIds.length === 0}
              >
                {loading && <Icon icon="hugeicons:fan-01" className="animate-spin w-4 h-4" />}
                Assign {selectedCadetIds.length > 0 ? `${selectedCadetIds.length} Cadets` : 'Cadets'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
