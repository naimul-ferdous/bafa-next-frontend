"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import type { InstructorBiodata, AtwInstructorAssignSubject } from "@/libs/types/user";
import type { SystemCourse, SystemSemester, SystemProgram, AtwSubjectModule } from "@/libs/types/system";
import { commonService } from "@/libs/services/commonService";
import { atwInstructorAssignSubjectService } from "@/libs/services/atwInstructorAssignSubjectService";
import { atwSubjectGroupService } from "@/libs/services/atwSubjectGroupService";
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
  const [subjects, setSubjects] = useState<AtwSubjectModule[]>([]);
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
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);

  // Load dropdown data
  useEffect(() => {
    if (isOpen && instructor) {
      loadDropdownData();
    }
  }, [isOpen, instructor]);

  // Load subjects when filters change
  useEffect(() => {
    if (selectedCourseId && selectedSemesterId && selectedProgramId) {
      loadSubjects();
    } else {
      setSubjects([]);
      setAllExistingAssignments([]);
      setSelectedSubjectIds([]);
    }
  }, [selectedCourseId, selectedSemesterId, selectedProgramId]);

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
      // Fetch available syllabus modules from atw_subject_groups table
      // as it defines which modules are valid for this Semester + Program
      const [groupedRes, assignmentsRes] = await Promise.all([
        atwSubjectGroupService.getAllSubjectGroups({
          semester_id: Number(selectedSemesterId),
          program_id: Number(selectedProgramId),
          per_page: 500,
        }),
        atwInstructorAssignSubjectService.getAll({
          course_id: Number(selectedCourseId),
          semester_id: Number(selectedSemesterId),
          program_id: Number(selectedProgramId),
          per_page: 1000
        })
      ]);

      // Map the grouped records to their module objects
      const groupedModules = groupedRes.data
        .map(g => g.module)
        .filter((m): m is AtwSubjectModule => !!m);
      
      setSubjects(groupedModules);
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
      (a) => a.subject_id === subjectId
    );
  };

  // Check if subject is assigned to ANY instructor (for these filters)
  const getAssignmentInfo = (subjectId: number) => {
    return allExistingAssignments.find(a => a.subject_id === subjectId);
  };

  // Get available subjects (not assigned to anyone yet in this specific context)
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
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider border-b pb-1">Current Subject Assignments</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {existingAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <div className="flex items-center gap-3">
                        <Icon icon="hugeicons:book-02" className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {assignment.subject?.subject_name || "Unknown Subject"}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            {assignment.subject?.subject_code} | {assignment.course?.code} | {assignment.semester?.name}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Course Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
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
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
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
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
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
              </div>

              {/* Subjects Selection */}
              {selectedCourseId && selectedSemesterId && selectedProgramId && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-700 uppercase">
                      Select Subjects <span className="text-red-500">*</span>
                    </label>
                    {availableSubjects.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs text-purple-600 hover:text-purple-700 font-bold"
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
                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center">
                      <Icon icon="hugeicons:book-02" className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No subjects found for this context. Please create syllabus modules first.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                      {subjects.map((subject) => {
                        const assignment = getAssignmentInfo(subject.id);
                        const isAssignedToMe = isSubjectAlreadyAssignedToMe(subject.id);
                        const isAssignedToOther = !!assignment && !isAssignedToMe;
                        const isDisabled = isAssignedToMe;

                        return (
                          <label
                            key={subject.id}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                              selectedSubjectIds.includes(subject.id) || isDisabled
                                ? "bg-purple-50 border-purple-300 shadow-sm"
                                : "bg-white border-gray-200 hover:border-purple-200 hover:bg-gray-50"
                            } ${isDisabled ? "opacity-75 cursor-not-allowed" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSubjectIds.includes(subject.id) || isDisabled}
                              onChange={() => !isDisabled && handleSubjectToggle(subject.id)}
                              disabled={isDisabled}
                              className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{subject.subject_name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{subject.subject_code}</span>
                                <span className="text-[10px] font-bold text-blue-600 uppercase">{subject.subjects_full_mark} Marks</span>
                              </div>
                              {isAssignedToOther && (
                                <p className="mt-2 text-[9px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full inline-block uppercase">Assigned: {assignment.instructor?.name}</p>
                              )}
                              {isAssignedToMe && (
                                <p className="mt-2 text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-block uppercase tracking-tighter">Already Your Assignment</p>
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
                  className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading || (selectedSubjectIds.length === 0)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-md transition-all active:scale-95"
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
