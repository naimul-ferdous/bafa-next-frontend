"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import type { InstructorBiodata, AtwInstructorAssignSubject } from "@/libs/types/user";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup, AtwSubject } from "@/libs/types/system";
import { commonService } from "@/libs/services/commonService";
import { atwInstructorAssignSubjectService } from "@/libs/services/atwInstructorAssignSubjectService";
import { atwSubjectService } from "@/libs/services/atwSubjectService";
import FullLogo from "../ui/fulllogo";

interface InstructorAssignSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: InstructorBiodata | null;
  onSuccess?: () => void;
}

export default function InstructorAssignSubjectModal({
  isOpen,
  onClose,
  instructor,
  onSuccess,
}: InstructorAssignSubjectModalProps) {
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [subjects, setSubjects] = useState<AtwSubject[]>([]);
  const [existingAssignments, setExistingAssignments] = useState<AtwInstructorAssignSubject[]>([]);
  const [allExistingAssignments, setAllExistingAssignments] = useState<AtwInstructorAssignSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | "">("");
  const [selectedProgramId, setSelectedProgramId] = useState<number | "">("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | "">("");
  const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);

  // Load dropdown data
  useEffect(() => {
    if (isOpen && instructor) {
      loadDropdownData();
    }
  }, [isOpen, instructor]);

  // Load subjects when filters change
  useEffect(() => {
    if (selectedCourseId && selectedSemesterId && selectedProgramId && selectedBranchId) {
      loadSubjects();
    } else {
      setSubjects([]);
      setAllExistingAssignments([]);
      setSelectedSubjectIds([]);
    }
  }, [selectedCourseId, selectedSemesterId, selectedProgramId, selectedBranchId, selectedGroupId]);

  const loadDropdownData = async () => {
    setLoadingData(true);
    try {
      const [options, assignments] = await Promise.all([
        commonService.getResultOptions(),
        instructor?.user_id
          ? atwInstructorAssignSubjectService.getByInstructor(instructor.user_id)
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

  const loadSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const params = {
        course_id: Number(selectedCourseId),
        semester_id: Number(selectedSemesterId),
        program_id: Number(selectedProgramId),
        branch_id: Number(selectedBranchId),
        per_page: 100,
      };
      
      const queryParams = selectedGroupId 
        ? { ...params, group_id: Number(selectedGroupId) }
        : params;

      const [subjectsRes, assignmentsRes] = await Promise.all([
        atwSubjectService.getAllSubjects(queryParams),
        atwInstructorAssignSubjectService.getAll({ ...queryParams, per_page: 1000 })
      ]);

      setSubjects(subjectsRes.data);
      setAllExistingAssignments(assignmentsRes.data);
      setSelectedSubjectIds([]);
    } catch (err) {
      console.error("Failed to load subjects:", err);
      setSubjects([]);
      setAllExistingAssignments([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Check if subject is already assigned to THIS instructor
  const isSubjectAlreadyAssignedToMe = (subjectId: number) => {
    return existingAssignments.some(
      (a) =>
        a.subject_id === subjectId &&
        a.course_id === Number(selectedCourseId) &&
        a.semester_id === Number(selectedSemesterId) &&
        a.program_id === Number(selectedProgramId) &&
        a.branch_id === Number(selectedBranchId) &&
        (!selectedGroupId || a.group_id === Number(selectedGroupId))
    );
  };

  // Check if subject is assigned to ANY instructor (for these filters)
  const getAssignmentInfo = (subjectId: number) => {
    return allExistingAssignments.find(a => a.subject_id === subjectId);
  };

  // Get available subjects (not assigned to anyone yet)
  const availableSubjects = subjects.filter((s) => !getAssignmentInfo(s.id));

  const handleSubjectToggle = (subjectId: number) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSubjectIds.length === availableSubjects.length) {
      setSelectedSubjectIds([]);
    } else {
      setSelectedSubjectIds(availableSubjects.map((s) => s.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructor?.user_id || selectedSubjectIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const result = await atwInstructorAssignSubjectService.bulkAssign({
        instructor_id: instructor.user_id,
        course_id: Number(selectedCourseId),
        semester_id: Number(selectedSemesterId),
        program_id: Number(selectedProgramId),
        branch_id: Number(selectedBranchId),
        group_id: selectedGroupId ? Number(selectedGroupId) : undefined,
        subject_ids: selectedSubjectIds,
      });

      if (!result) throw new Error("Failed to assign subjects");

      // Reload assignments
      const assignments = await atwInstructorAssignSubjectService.getByInstructor(instructor.user_id);
      setExistingAssignments(assignments);

      // Reset form
      setSelectedSubjectIds([]);
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to assign subjects";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to remove this subject assignment?")) return;

    try {
      await atwInstructorAssignSubjectService.delete(assignmentId);
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
    setSelectedSubjectIds([]);
    setSubjects([]);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton className="max-w-4xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div>
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Assign Subjects
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {instructor?.user?.name || "Instructor"} ({instructor?.user?.service_number || "N/A"})
          </p>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-10">
            <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            {/* Existing Assignments */}
            {existingAssignments.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Subject Assignments</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {existingAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <Icon icon="hugeicons:book-02" className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {assignment.subject?.subject_name || "Unknown Subject"} ({assignment.subject?.subject_code})
                          </p>
                          <p className="text-xs text-gray-500">
                            {assignment.course?.code} | {assignment.semester?.name} | {assignment.program?.code} | {assignment.branch?.code}
                            {assignment.group?.name ? ` | ${assignment.group.name}` : ''}
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
                    onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
                    onChange={(e) => setSelectedSemesterId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
                    Program <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    required
                  >
                    <option value="">Select</option>
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
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    required
                  >
                    <option value="">Select</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Group Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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

              {/* Subjects Selection */}
              {selectedCourseId && selectedSemesterId && selectedProgramId && selectedBranchId && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Subjects <span className="text-red-500">*</span>
                    </label>
                    {availableSubjects.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs text-purple-600 hover:text-purple-700"
                      >
                        {selectedSubjectIds.length === availableSubjects.length ? "Deselect All" : "Select All"}
                      </button>
                    )}
                  </div>

                  {loadingSubjects ? (
                    <div className="flex items-center justify-center py-4">
                      <Icon icon="hugeicons:fan-01" className="w-6 h-6 animate-spin text-purple-500" />
                    </div>
                  ) : subjects.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No subjects found for selected filters</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                      {subjects.map((subject) => {
                        const assignment = getAssignmentInfo(subject.id);
                        const isAssignedToMe = isSubjectAlreadyAssignedToMe(subject.id);
                        const isAssignedToOther = !!assignment && !isAssignedToMe;
                        // Only disable if already assigned to THIS specific instructor
                        const isDisabled = isAssignedToMe;

                        return (
                          <label
                            key={subject.id}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedSubjectIds.includes(subject.id) || isDisabled
                                ? "bg-purple-100 border border-purple-300"
                                : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                            } ${isDisabled ? "opacity-75 cursor-not-allowed" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSubjectIds.includes(subject.id) || isDisabled}
                              onChange={() => !isDisabled && handleSubjectToggle(subject.id)}
                              disabled={isDisabled}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{subject.subject_code}</p>
                              <p className="text-xs text-gray-500 truncate">{subject.subject_name}</p>
                              {isAssignedToOther && (
                                <p className="text-[10px] font-bold text-orange-600 uppercase">Also Assigned: {assignment.instructor?.name || 'Other'}</p>
                              )}
                              {isAssignedToMe && (
                                <p className="text-[10px] font-bold text-green-600 uppercase">Your Assignment</p>
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
                  disabled={loading || (selectedSubjectIds.length === 0 && availableSubjects.length > 0)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                      Assign {selectedSubjectIds.length > 0 ? `(${selectedSubjectIds.length})` : ""} Subjects
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
