"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import type { InstructorBiodata, CtwInstructorAssignModule } from "@/libs/types/user";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup, CtwResultsModule } from "@/libs/types/ctw";
import { commonService } from "@/libs/services/commonService";
import { ctwInstructorAssignModuleService } from "@/libs/services/ctwInstructorAssignModuleService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import FullLogo from "../ui/fulllogo";

interface InstructorAssignModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: InstructorBiodata | null;
  onSuccess?: () => void;
}

export default function InstructorAssignModuleModal({
  isOpen,
  onClose,
  instructor,
  onSuccess,
}: InstructorAssignModuleModalProps) {
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [modules, setModules] = useState<CtwResultsModule[]>([]);
  const [existingAssignments, setExistingAssignments] = useState<CtwInstructorAssignModule[]>([]);
  const [allExistingAssignments, setAllExistingAssignments] = useState<CtwInstructorAssignModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | "">("");
  const [selectedProgramId, setSelectedProgramId] = useState<number | "">("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | "">("");
  const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);

  // Load dropdown data
  useEffect(() => {
    if (isOpen && instructor) {
      loadDropdownData();
    }
  }, [isOpen, instructor]);

  // Load modules progressively: fetch after course + semester, re-fetch on program/branch/group change
  useEffect(() => {
    if (selectedCourseId && selectedSemesterId) {
      loadModules();
    } else {
      setModules([]);
      setAllExistingAssignments([]);
      setSelectedModuleIds([]);
    }
  }, [selectedCourseId, selectedSemesterId, selectedProgramId, selectedBranchId, selectedGroupId]);

  // Reset downstream selections when upstream changes
  const handleCourseChange = (value: number | "") => {
    setSelectedCourseId(value);
    setSelectedSemesterId("");
    setSelectedProgramId("");
    setSelectedBranchId("");
    setSelectedGroupId("");
    setSelectedModuleIds([]);
  };

  const handleSemesterChange = (value: number | "") => {
    setSelectedSemesterId(value);
    setSelectedProgramId("");
    setSelectedBranchId("");
    setSelectedGroupId("");
    setSelectedModuleIds([]);
  };

  const handleProgramChange = (value: number | "") => {
    setSelectedProgramId(value);
    setSelectedBranchId("");
    setSelectedGroupId("");
    setSelectedModuleIds([]);
  };

  const handleBranchChange = (value: number | "") => {
    setSelectedBranchId(value);
    setSelectedGroupId("");
    setSelectedModuleIds([]);
  };

  const handleGroupChange = (value: number | "") => {
    setSelectedGroupId(value);
    setSelectedModuleIds([]);
  };

  const loadDropdownData = async () => {
    setLoadingData(true);
    try {
      const [options, assignments] = await Promise.all([
        commonService.getResultOptions(),
        instructor?.user_id
          ? ctwInstructorAssignModuleService.getByInstructor(instructor.user_id)
          : Promise.resolve([]),
      ]);

      if (options) {
        setCourses(options.courses);
        setSemesters(options.semesters);
        setPrograms(options.programs);
        setBranches(options.branches);
        setGroups(options.groups);
      }

      setExistingAssignments(assignments);
    } catch (err) {
      console.error("Failed to load dropdown data:", err);
      setError("Failed to load required data. Please refresh the page.");
    } finally {
      setLoadingData(false);
    }
  };

  const loadModules = async () => {
    setLoadingModules(true);
    try {
      // Build filter params - only include selected values
      const assignmentFilters: Record<string, number | string> = {
        course_id: Number(selectedCourseId),
        semester_id: Number(selectedSemesterId),
        per_page: 1000,
      };
      if (selectedProgramId) assignmentFilters.program_id = Number(selectedProgramId);
      if (selectedBranchId) assignmentFilters.branch_id = Number(selectedBranchId);
      if (selectedGroupId) assignmentFilters.group_id = Number(selectedGroupId);

      const [modulesWithEM, assignmentsRes] = await Promise.all([
        ctwResultsModuleService.getModulesWithEstimatedMarks({
          course_id: Number(selectedCourseId),
          semester_id: Number(selectedSemesterId),
        }),
        ctwInstructorAssignModuleService.getAll(assignmentFilters as any)
      ]);

      setModules(modulesWithEM);
      setAllExistingAssignments(assignmentsRes.data);
      setSelectedModuleIds([]);
    } catch (err) {
      console.error("Failed to load modules:", err);
      setModules([]);
      setAllExistingAssignments([]);
    } finally {
      setLoadingModules(false);
    }
  };

  // Check if module is already assigned to THIS instructor
  const isModuleAlreadyAssignedToMe = (moduleId: number) => {
    return existingAssignments.some(
      (a) =>
        a.ctw_results_module_id === moduleId &&
        a.course_id === Number(selectedCourseId) &&
        a.semester_id === Number(selectedSemesterId) &&
        (!selectedProgramId || a.program_id === Number(selectedProgramId)) &&
        (!selectedBranchId || a.branch_id === Number(selectedBranchId)) &&
        (!selectedGroupId || a.group_id === Number(selectedGroupId))
    );
  };

  // Get all assignments for a module (for these filters)
  const getAssignmentsForModule = (moduleId: number) => {
    return allExistingAssignments.filter(a => a.ctw_results_module_id === moduleId);
  };

  // Count unique instructors assigned to a module
  const getAssignedInstructorCount = (moduleId: number) => {
    const assignments = getAssignmentsForModule(moduleId);
    const uniqueInstructorIds = new Set(assignments.map(a => a.instructor_id));
    return uniqueInstructorIds.size;
  };

  // Check if module has reached its instructor limit
  const isModuleFull = (module: CtwResultsModule) => {
    if (!module.instructor_count || module.instructor_count <= 0) return false;
    return getAssignedInstructorCount(module.id) >= module.instructor_count;
  };

  // Get available modules (not already assigned to me AND not full)
  const availableModules = modules.filter((m) => !isModuleAlreadyAssignedToMe(m.id) && !isModuleFull(m));

  const handleModuleToggle = (moduleId: number) => {
    setSelectedModuleIds((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedModuleIds.length === availableModules.length) {
      setSelectedModuleIds([]);
    } else {
      setSelectedModuleIds(availableModules.map((m) => m.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructor?.user_id || selectedModuleIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        instructor_id: instructor.user_id,
        course_id: Number(selectedCourseId),
        semester_id: Number(selectedSemesterId),
        module_ids: selectedModuleIds,
      };
      if (selectedProgramId) payload.program_id = Number(selectedProgramId);
      if (selectedBranchId) payload.branch_id = Number(selectedBranchId);
      if (selectedGroupId) payload.group_id = Number(selectedGroupId);

      const result = await ctwInstructorAssignModuleService.bulkAssign(payload);

      if (!result) throw new Error("Failed to assign modules");

      // Reload assignments
      const assignments = await ctwInstructorAssignModuleService.getByInstructor(instructor.user_id);
      setExistingAssignments(assignments);

      // Reset form
      setSelectedModuleIds([]);
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to assign modules";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to remove this module assignment?")) return;

    try {
      await ctwInstructorAssignModuleService.delete(assignmentId);
      setExistingAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
      onSuccess?.();
    } catch (err) {
      console.error("Failed to delete assignment:", err);
      setError("Failed to remove assignment");
    }
  };

  const handleClose = () => {
    setSelectedCourseId("");
    setSelectedSemesterId("");
    setSelectedProgramId("");
    setSelectedBranchId("");
    setSelectedGroupId("");
    setSelectedModuleIds([]);
    setModules([]);
    setError(null);
    onClose();
  };

  // Minimum required: course + semester
  const canShowModules = !!(selectedCourseId && selectedSemesterId);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton className="max-w-4xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div>
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Assign CTW Modules
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {instructor?.user?.name || "Instructor"} ({instructor?.user?.service_number || "N/A"})
          </p>
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
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Module Assignments</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {existingAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <Icon icon="hugeicons:package" className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {assignment.module?.full_name || "Unknown Module"} ({assignment.module?.code})
                          </p>
                          <p className="text-xs text-gray-500">
                            {assignment.course?.code} | {assignment.semester?.name} | {assignment.program?.code} | {assignment.branch?.code}{assignment.group?.name ? ` | ${assignment.group.name}` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remove"
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
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                {/* Course Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleCourseChange(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  >
                    <option value="">Select</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSemesterId}
                    onChange={(e) => handleSemesterChange(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  >
                    <option value="">Select</option>
                    {semesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        {semester.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Program Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => handleProgramChange(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Programs</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => handleBranchChange(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Group Selection (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => handleGroupChange(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Groups</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modules Selection - show after course + semester selected */}
              {canShowModules && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Modules <span className="text-red-500">*</span>
                    </label>
                    {availableModules.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        {selectedModuleIds.length === availableModules.length ? "Deselect All" : "Select All"}
                      </button>
                    )}
                  </div>

                  {loadingModules ? (
                    <div className="flex items-center justify-center py-4">
                      <Icon icon="hugeicons:fan-01" className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  ) : modules.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No modules with estimated marks found for this course & semester</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                      {modules.map((module) => {
                        const isAssignedToMe = isModuleAlreadyAssignedToMe(module.id);
                        const assignedCount = getAssignedInstructorCount(module.id);
                        const maxInstructors = module.instructor_count || 0;
                        const isFull = isModuleFull(module);
                        const isDisabled = isAssignedToMe || (isFull && !isAssignedToMe);
                        const hasOtherAssignments = assignedCount > 0 && !isAssignedToMe;

                        return (
                          <label
                            key={module.id}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                              isAssignedToMe
                                ? "bg-green-50 border border-green-300"
                                : isFull
                                  ? "bg-red-50 border border-red-200"
                                  : selectedModuleIds.includes(module.id)
                                    ? "bg-blue-100 border border-blue-300"
                                    : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                            } ${isDisabled ? "opacity-75 cursor-not-allowed" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedModuleIds.includes(module.id) || isAssignedToMe}
                              onChange={() => !isDisabled && handleModuleToggle(module.id)}
                              disabled={isDisabled}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{module.code}</p>
                              <p className="text-xs text-gray-500 truncate">{module.full_name}</p>
                              {maxInstructors > 0 && (
                                <p className={`text-[10px] font-bold uppercase ${assignedCount >= maxInstructors ? 'text-red-600' : 'text-gray-400'}`}>
                                  {assignedCount}/{maxInstructors} Instructors
                                </p>
                              )}
                              {isAssignedToMe && (
                                <p className="text-[10px] font-bold text-green-600 uppercase">Your Assignment</p>
                              )}
                              {isFull && !isAssignedToMe && (
                                <p className="text-[10px] font-bold text-red-600 uppercase">Full</p>
                              )}
                              {hasOtherAssignments && !isFull && !isAssignedToMe && (
                                <p className="text-[10px] font-bold text-orange-600 uppercase">{assignedCount} Assigned</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading || (selectedModuleIds.length === 0 && availableModules.length > 0)}
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
                      Assign {selectedModuleIds.length > 0 ? `(${selectedModuleIds.length})` : ""} Modules
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
