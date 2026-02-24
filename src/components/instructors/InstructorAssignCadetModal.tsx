/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { cadetService } from "@/libs/services/cadetService";
import FullLogo from "@/components/ui/fulllogo";
import { Icon } from "@iconify/react";
import { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup } from "@/libs/types/system";
import { AtwSubject } from "@/libs/types";
import { CadetProfile, InstructorBiodata } from "@/libs/types/user";
import { AtwInstructorAssignCadet, atwInstructorAssignCadetService } from "@/libs/services/atwInstructorAssignCadetService";
import { commonService } from "@/libs/services/commonService";

interface InstructorAssignCadetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instructor: InstructorBiodata | null;
}

export default function InstructorAssignCadetModal({ isOpen, onClose, onSuccess, instructor }: InstructorAssignCadetModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Options
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [subjects, setSubjects] = useState<AtwSubject[]>([]);

  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [existingAssignments, setExistingAssignments] = useState<AtwInstructorAssignCadet[]>([]);
  const [selectedCadetIds, setSelectedCadetIds] = useState<number[]>([]);
  const [cadetSearch, setCadetSearch] = useState("");

  const [formData, setFormData] = useState({
    course_id: "",
    semester_id: "",
    program_id: "",
    branch_id: "",
    group_id: "",
    subject_id: "",
    is_current: true,
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
        subject_id: "",
        is_current: true,
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
      if (formData.course_id && formData.semester_id && formData.branch_id && formData.subject_id) {
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
            atwInstructorAssignCadetService.getAll({
              ...commonParams,
              subject_id: Number(formData.subject_id),
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
  }, [formData.course_id, formData.semester_id, formData.program_id, formData.branch_id, formData.group_id, formData.subject_id, instructor?.user_id]);

  const loadOptions = async () => {
    try {
      const options = await commonService.getResultOptions();
      if (options) {
        setCourses(options.courses);
        setSemesters(options.semesters);
        setPrograms(options.programs);
        setBranches(options.branches);
        setGroups(options.groups);
        
        // Extract subjects directly from instructor's assignments
        if (instructor?.user?.atw_assigned_subjects) {
          const assignedSubjects = instructor.user.atw_assigned_subjects
            .map((as: any) => as.subject)
            .filter((s: any) => s !== null);
          setSubjects(assignedSubjects);
        } else {
          setSubjects([]);
        }
      }
    } catch (err: any) {
      console.error("Failed to load options:", err);
      setError("Failed to load dropdown options.");
    }
  };

  const handleCadetSelection = (cadetId: number) => {
    setSelectedCadetIds(prev =>
      prev.includes(cadetId)
        ? prev.filter(id => id !== cadetId)
        : [...prev, cadetId]
    );
  };

  const handleSelectAllCadets = () => {
    // Only select cadets that are NOT already assigned
    const unassignedFilteredIds = filteredCadets
      .filter(c => !existingAssignments.some(a => a.cadet_id === c.id))
      .map(c => c.id);

    if (unassignedFilteredIds.length === 0) return;

    const allUnassignedSelected = unassignedFilteredIds.every(id => selectedCadetIds.includes(id));

    if (allUnassignedSelected) {
      setSelectedCadetIds(prev => prev.filter(id => !unassignedFilteredIds.includes(id)));
    } else {
      setSelectedCadetIds(prev => Array.from(new Set([...prev, ...unassignedFilteredIds])));
    }
  };

  console.log("Selected:", instructor);

  const filteredCadets = cadets.filter(c =>
    c.name.toLowerCase().includes(cadetSearch.toLowerCase()) ||
    c.cadet_number.toLowerCase().includes(cadetSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!instructor?.user) {
      setError("No instructor selected.");
      return;
    }

    if (!formData.course_id || !formData.semester_id || !formData.program_id || !formData.branch_id || !formData.subject_id) {
      setError("Please fill all required fields.");
      return;
    }

    if (selectedCadetIds.length === 0) {
      setError("Please select at least one cadet.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await atwInstructorAssignCadetService.create({
        instructor_id: instructor?.user_id,
        course_id: Number(formData.course_id),
        semester_id: Number(formData.semester_id),
        program_id: Number(formData.program_id),
        branch_id: Number(formData.branch_id),
        group_id: formData.group_id ? Number(formData.group_id) : undefined,
        subject_id: Number(formData.subject_id),
        cadet_ids: selectedCadetIds,
        is_current: formData.is_current,
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
    if (name === "subject_id") {
      const selectedSubject = subjects.find(s => s.id === Number(value));
      if (selectedSubject) {
        // Find the specific assignment to get the group_id if it exists
        const assignment = instructor?.user?.atw_assigned_subjects?.find(as => as.subject_id === selectedSubject.id);
        
        setFormData(prev => ({
          ...prev,
          subject_id: value,
          course_id: String(selectedSubject.course_id),
          semester_id: String(selectedSubject.semester_id),
          program_id: String(selectedSubject.program_id),
          branch_id: String(selectedSubject.branch_id),
          group_id: assignment?.group_id ? String(assignment.group_id) : "",
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
              <h2 className="text-lg font-bold text-gray-900">Assign Cadets to Subject</h2>
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
          {/* Left Column: Subject Selection & Read-only Details */}
          <div className="w-1/3 space-y-6 overflow-y-auto pr-2 custom-scrollbar border-r border-gray-100">
            <div className="space-y-6 pt-4">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Icon icon="hugeicons:book-02" className="w-4 h-4" />
                  Select Subject
                </h3>
                <select
                  value={formData.subject_id}
                  onChange={(e) => handleChange("subject_id", e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold"
                >
                  <option value="">Choose from assigned subjects...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subject_name} ({s.subject_code})
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
                      {formData.group_id ? groups.find(g => g.id === Number(formData.group_id))?.name : "—"}
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
                    <Icon icon={filteredCadets.length > 0 && filteredCadets.every(c => selectedCadetIds.includes(c.id)) ? "hugeicons:tick-02" : "hugeicons:checklist"} className="w-4 h-4" />
                    {filteredCadets.length > 0 && filteredCadets.every(c => selectedCadetIds.includes(c.id)) ? 'Deselect All' : 'Select All'}
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
                  disabled={!formData.subject_id}
                />
              </div>
            </div>

            <div className="flex-1 border border-gray-100 rounded-2xl overflow-hidden">
              <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                {filteredCadets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredCadets.map((cadet) => {
                      const assignment = existingAssignments.find(a => a.cadet_id === cadet.id);
                      const alreadyAssigned = !!assignment;
                      const isAssignedToMe = assignment?.instructor_id === instructor?.user_id;
                      const isSelected = selectedCadetIds.includes(cadet.id);

                      return (
                        <div
                          key={cadet.id}
                          className={`relative p-3 rounded-xl border transition-all cursor-pointer group ${alreadyAssigned
                              ? isAssignedToMe
                                ? 'border-green-200 bg-green-50/50 cursor-not-allowed'
                                : 'border-red-200 bg-red-50/50 cursor-not-allowed'
                              : isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-blue-200'
                            }`}
                          onClick={() => !alreadyAssigned && handleCadetSelection(cadet.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${alreadyAssigned
                                ? isAssignedToMe ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                : isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500'
                              }`}>
                              <Icon icon={alreadyAssigned ? "hugeicons:tick-02" : "hugeicons:user"} className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${alreadyAssigned ? isAssignedToMe ? 'text-green-900' : 'text-red-900' : isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                {cadet.name}
                              </p>
                              <p className="text-[10px] text-gray-500 font-mono tracking-tighter">
                                BD-{cadet.cadet_number}
                              </p>
                              {/* {alreadyAssigned && (
                                <p className={`text-[8px] font-bold uppercase mt-0.5 ${isAssignedToMe ? 'text-green-600' : 'text-red-600'}`}>
                                  {isAssignedToMe ? 'Assigned to you' : `Assigned`}
                                </p>
                              )} */}
                            </div>
                            {isSelected && !alreadyAssigned && (
                              <div className="shrink-0">
                                <Icon icon="hugeicons:tick-02" className="w-4 h-4 text-blue-600" />
                              </div>
                            )}
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
                      {!formData.subject_id
                        ? "Select Subject First"
                        : cadetSearch ? "No Cadets Found" : "No Cadets Available"}
                    </p>
                    <p className="text-xs text-gray-400 max-w-[200px]">
                      {!formData.subject_id
                        ? "Please select a subject from the dropdown above to view and assign cadets."
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
