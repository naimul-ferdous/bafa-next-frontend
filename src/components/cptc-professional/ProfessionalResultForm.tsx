/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { courseService } from "@/libs/services/courseService";
import { semesterService } from "@/libs/services/semesterService";
import { programService } from "@/libs/services/programService";
import { branchService } from "@/libs/services/branchService";
import { groupService } from "@/libs/services/groupService";
import { cadetService } from "@/libs/services/cadetService";
import Label from "@/components/form/Label";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup } from "@/libs/types/system";
import type { Cadet } from "@/libs/types/cadet";
import type { CptcProfessionalResult, CptcProfessionalResultFormData } from "@/libs/types/cptcProfessionalResult";

interface ProfessionalResultFormProps {
  initialData?: CptcProfessionalResult;
  onSubmit: (data: CptcProfessionalResultFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function ProfessionalResultForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  isEdit = false,
}: ProfessionalResultFormProps) {
  const [error, setError] = useState("");

  // Dropdown data
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    course_id: initialData?.course_id || 0,
    semester_id: initialData?.semester_id || 0,
    program_id: initialData?.program_id || 0,
    branch_id: initialData?.branch_id || 0,
    group_id: initialData?.group_id || 0,
    is_active: initialData?.is_active ?? true,
  });

  const [selectedCadets, setSelectedCadets] = useState<{
    id?: number;
    cadet_id: number;
    achieved_mark: number;
    remarks: string;
    is_active: boolean;
  }[]>([]);

  // Initialize selected cadets from initial data
  useEffect(() => {
    if (initialData?.cadet_marks) {
      setSelectedCadets(initialData.cadet_marks.map(cm => ({
        id: cm.id,
        cadet_id: cm.cadet_id,
        achieved_mark: parseFloat(String(cm.achieved_mark)),
        remarks: cm.remarks || "",
        is_active: cm.is_active,
      })));
    }
  }, [initialData]);

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingDropdowns(true);
        const [coursesRes, semestersRes, programsRes, branchesRes, groupsRes] = await Promise.all([
          courseService.getAllCourses({ per_page: 100 }),
          semesterService.getAllSemesters({ per_page: 100 }),
          programService.getAllPrograms({ per_page: 100 }),
          branchService.getAllBranches({ per_page: 100 }),
          groupService.getAllGroups({ per_page: 100 }),
        ]);

        setCourses(coursesRes.data.filter(c => c.is_active));
        setSemesters(semestersRes.data.filter(s => s.is_active));
        setPrograms(programsRes.data.filter(p => p.is_active));
        setBranches(branchesRes.data.filter(b => b.is_active));
        setGroups(groupsRes.data.filter(g => g.is_active));
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setError("Failed to load required data");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadData();
  }, []);

  // Load cadets when course, semester, branch are selected
  useEffect(() => {
    const loadCadets = async () => {
      if (!formData.course_id || !formData.semester_id || !formData.branch_id) {
        setCadets([]);
        setSelectedCadets([]);
        return;
      }

      try {
        const params: any = {
          per_page: 500,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          branch_id: formData.branch_id,
        };

        if (formData.program_id) params.program_id = formData.program_id;
        if (formData.group_id) params.group_id = formData.group_id;

        const cadetsRes = await cadetService.getAllCadets(params);
        const loadedCadets = cadetsRes.data;
        setCadets(loadedCadets);

        // Auto-populate cadets in table (only if not editing or if cadets list changed)
        if (!isEdit || selectedCadets.length === 0) {
          setSelectedCadets(loadedCadets.map(cadet => {
            // Check if this cadet already has data (for edit mode)
            const existingCadet = initialData?.cadet_marks?.find(cm => cm.cadet_id === cadet.id);
            return {
              id: existingCadet?.id,
              cadet_id: cadet.id,
              achieved_mark: existingCadet?.achieved_mark ? parseFloat(String(existingCadet.achieved_mark)) : 0,
              remarks: existingCadet?.remarks || "",
              is_active: existingCadet?.is_active ?? true,
            };
          }));
        }
      } catch (err) {
        console.error("Failed to load cadets:", err);
      }
    };

    loadCadets();
  }, [formData.course_id, formData.semester_id, formData.branch_id, formData.program_id, formData.group_id]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCadetMarkChange = (cadetId: number, field: string, value: any) => {
    setSelectedCadets(prev => prev.map(c =>
      c.cadet_id === cadetId ? { ...c, [field]: value } : c
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.course_id || !formData.semester_id || !formData.branch_id) {
      setError("Please select Course, Semester, and Branch");
      return;
    }

    if (selectedCadets.length === 0) {
      setError("No cadets found for the selected filters");
      return;
    }

    try {
      await onSubmit({
        ...formData,
        program_id: formData.program_id || undefined,
        branch_id: formData.branch_id || undefined,
        group_id: formData.group_id || undefined,
        cadets: selectedCadets,
      });
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} result`);
    }
  };

  if (loadingDropdowns) {
    return (
      <div className="text-center py-12">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:file-02" className="w-5 h-5 text-blue-500" />
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Course <span className="text-red-500">*</span></Label>
            <select
              value={formData.course_id}
              onChange={(e) => handleChange("course_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Semester <span className="text-red-500">*</span></Label>
            <select
              value={formData.semester_id}
              onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Select Semester</option>
              {semesters.map(semester => (
                <option key={semester.id} value={semester.id}>{semester.name} ({semester.code})</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Program</Label>
            <select
              value={formData.program_id}
              onChange={(e) => handleChange("program_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select Program (Optional)</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>{program.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Branch</Label>
            <select
              value={formData.branch_id}
              onChange={(e) => handleChange("branch_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select Branch (Optional)</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Group</Label>
            <select
              value={formData.group_id}
              onChange={(e) => handleChange("group_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select Group (Optional)</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="is_active" className="mb-0">Active</Label>
          </div>
        </div>
      </div>

      {/* Cadets Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:user-group" className="w-5 h-5 text-blue-500" />
          Cadets & Marks
        </h3>

        {!formData.course_id || !formData.semester_id || !formData.branch_id ? (
          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <Icon icon="hugeicons:information-circle" className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 font-medium">Please select Course, Semester, and Branch</p>
            <p className="text-sm text-gray-500 mt-1">Cadets will be loaded automatically after selecting branch</p>
          </div>
        ) : selectedCadets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">SL</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">BD No</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Rank</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Name</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 border-b">Achieved Mark <span className="text-red-500">*</span></th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Remarks</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 border-b">Active</th>
                </tr>
              </thead>
              <tbody>
                {selectedCadets.map((sc, index) => {
                  const cadet = cadets.find(c => c.id === sc.cadet_id) || initialData?.cadet_marks?.find(cm => cm.cadet_id === sc.cadet_id)?.cadet;
                  return (
                    <tr key={sc.cadet_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{cadet?.bd_no}</td>
                      <td className="px-4 py-3 text-gray-700">{cadet?.assignedRanks?.[0]?.rank?.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-900">{cadet?.name}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={sc.achieved_mark}
                          onChange={(e) => handleCadetMarkChange(sc.cadet_id, "achieved_mark", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={sc.remarks}
                          onChange={(e) => handleCadetMarkChange(sc.cadet_id, "remarks", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Optional remarks"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={sc.is_active}
                          onChange={(e) => handleCadetMarkChange(sc.cadet_id, "is_active", e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
            <Icon icon="hugeicons:user-remove-02" className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">No cadets found for the selected filters</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <>
              <Icon icon="hugeicons:fan-01" className="w-5 h-5 animate-spin" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Icon icon="hugeicons:tick-02" className="w-5 h-5" />
              {isEdit ? 'Update Result' : 'Create Result'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
