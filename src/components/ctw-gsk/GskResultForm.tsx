/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { commonService } from "@/libs/services/commonService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import { ctwInstructorAssignCadetService } from "@/libs/services/ctwInstructorAssignCadetService";
import { ctwInstructorAssignModuleService } from "@/libs/services/ctwInstructorAssignModuleService";
import { useAuth } from "@/libs/hooks/useAuth";
import { Icon } from "@iconify/react";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup, SystemExam } from "@/libs/types/system";
import type { CtwGskResult } from "@/libs/types/ctwGsk";

interface ResultFormProps {
  initialData?: CtwGskResult | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

interface CadetRow {
  id?: number;
  cadet_id: number;
  cadet_number: string;
  cadet_name: string;
  cadet_rank: string;
  branch: string;
  mark: number;
  is_active: boolean;
}

const GSK_MODULE_CODE = "gsk";

export default function GskResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    program_id: 0,
    branch_id: 0,
    group_id: 0,
    exam_type_id: 0,
    remarks: "",
    is_active: true,
  });

  const [cadetRows, setCadetRows] = useState<CadetRow[]>([]);
  const [error, setError] = useState("");

  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [estimatedMarks, setEstimatedMarks] = useState<any[]>([]);
  const [gskModuleId, setGskModuleId] = useState<number>(0);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [loadingEstimatedMarks, setLoadingEstimatedMarks] = useState(false);
  const [moduleAssigned, setModuleAssigned] = useState(false);

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const [options, modulesRes] = await Promise.all([
          commonService.getResultOptions(),
          ctwResultsModuleService.getAllModules({ per_page: 100 }),
        ]);

        if (options) {
          setCourses(options.courses);
          setSemesters(options.semesters);
          setPrograms(options.programs);
          setBranches(options.branches);
          setGroups(options.groups);
          setExams(options.exams);
        }

        const gskModule = modulesRes.data.find((m: any) => m.code === GSK_MODULE_CODE);
        if (gskModule) {
          setGskModuleId(gskModule.id);
        }
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, []);

  useEffect(() => {
    const loadEstimatedMarks = async () => {
      if (!gskModuleId || !formData.course_id || !formData.semester_id) {
        setEstimatedMarks([]);
        return;
      }

      try {
        setLoadingEstimatedMarks(true);
        const response = await ctwResultsModuleService.getEstimatedMarks(gskModuleId, {
          course_id: formData.course_id,
          semester_id: formData.semester_id,
        });
        setEstimatedMarks(response);
      } catch (err) {
        console.error("Failed to load estimated marks:", err);
        setEstimatedMarks([]);
      } finally {
        setLoadingEstimatedMarks(false);
      }
    };

    loadEstimatedMarks();
  }, [gskModuleId, formData.course_id, formData.semester_id]);

  const hasEstimatedMark = (examTypeId: number): boolean => {
    return estimatedMarks.some((em: any) => em.exam_type_id === examTypeId);
  };

  const getMaxMark = (): number => {
    if (!formData.exam_type_id) return 0;
    const em = estimatedMarks.find((em: any) => em.exam_type_id === formData.exam_type_id);
    return em?.estimated_mark || em?.mark || 0;
  };

  const maxMark = getMaxMark();

  useEffect(() => {
    const loadCadets = async () => {
      if (!user?.id || !gskModuleId || !formData.course_id || !formData.semester_id || !formData.exam_type_id) {
        setCadetRows([]);
        setModuleAssigned(false);
        return;
      }

      try {
        setLoadingCadets(true);

        const moduleAssignRes = await ctwInstructorAssignModuleService.getAll({
          instructor_id: user.id,
          module_code: GSK_MODULE_CODE,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          is_active: true,
        });

        if (!moduleAssignRes.data || moduleAssignRes.data.length === 0) {
          setModuleAssigned(false);
          setCadetRows([]);
          return;
        }

        setModuleAssigned(true);

        const params: any = {
          per_page: 500,
          instructor_id: user.id,
          ctw_results_module_id: gskModuleId,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          is_active: true,
        };
        if (formData.program_id) params.program_id = formData.program_id;
        if (formData.branch_id) params.branch_id = formData.branch_id;
        if (formData.group_id) params.group_id = formData.group_id;

        const assignedCadetsRes = await ctwInstructorAssignCadetService.getAll(params);

        const rows: CadetRow[] = assignedCadetsRes.data
          .filter((ac: any) => ac.cadet)
          .map((ac: any) => {
            const cadet = ac.cadet;
            const currentRank = cadet.assigned_ranks?.find((ar: any) => ar.rank)?.rank;
            return {
              cadet_id: cadet.id,
              cadet_number: cadet.cadet_number || "",
              cadet_name: cadet.name,
              cadet_rank: currentRank?.short_name || currentRank?.name || "Officer Cadet",
              branch: cadet.assigned_branchs?.find((ab: any) => ab.is_current)?.branch?.name || cadet.assigned_branchs?.[0]?.branch?.name || "N/A",
              mark: 0,
              is_active: true,
            };
          });

        setCadetRows(rows);
      } catch (err) {
        console.error("Failed to load cadets:", err);
      } finally {
        setLoadingCadets(false);
      }
    };

    if (!initialData) {
      loadCadets();
    }
  }, [user?.id, gskModuleId, formData.course_id, formData.semester_id, formData.program_id, formData.branch_id, formData.group_id, formData.exam_type_id, initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        course_id: initialData.course_id,
        semester_id: initialData.semester_id,
        program_id: initialData.program_id || 0,
        branch_id: initialData.branch_id || 0,
        group_id: initialData.group_id || 0,
        exam_type_id: initialData.exam_type_id,
        remarks: initialData.remarks || "",
        is_active: initialData.is_active,
      });

      if (initialData.achieved_marks && initialData.achieved_marks.length > 0) {
        const uniqueCadets = Array.from(new Set(initialData.achieved_marks.map(m => m.cadet_id)));
        const rows: CadetRow[] = uniqueCadets.map(cadetId => {
          const mark = initialData.achieved_marks?.find(m => m.cadet_id === cadetId);
          const currentRank = mark?.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank;

          return {
            cadet_id: cadetId,
            cadet_number: mark?.cadet?.cadet_number || "",
            cadet_name: mark?.cadet?.name || "Unknown",
            cadet_rank: currentRank?.short_name || currentRank?.name || "Officer Cadet",
            branch: initialData.branch?.name || "N/A",
            mark: mark?.achieved_mark || 0,
            is_active: mark?.is_active || true,
          };
        });
        setCadetRows(rows);
      }
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCadetChange = (cadetIndex: number, field: keyof CadetRow, value: any) => {
    setCadetRows(prev => {
      const updated = [...prev];
      let finalValue = value;
      if (field === "mark" && maxMark > 0 && typeof value === "number" && value > maxMark) {
        finalValue = maxMark;
      }
      updated[cadetIndex] = { ...updated[cadetIndex], [field]: finalValue };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.course_id) { setError("Please select a course"); return; }
    if (!formData.semester_id) { setError("Please select a semester"); return; }
    if (!formData.exam_type_id) { setError("Please select an exam type"); return; }
    if (!user?.id) { setError("User session error: Instructor ID not found. Please re-login."); return; }

    try {
      const marks: any[] = [];
      cadetRows.filter(c => c.cadet_id > 0).forEach(c => {
        marks.push({ cadet_id: c.cadet_id, achieved_mark: c.mark || 0 });
      });

      const submitData = {
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        program_id: formData.program_id || undefined,
        branch_id: formData.branch_id || undefined,
        group_id: formData.group_id || undefined,
        exam_type_id: formData.exam_type_id,
        instructor_id: user.id,
        ctw_results_module_id: gskModuleId,
        remarks: formData.remarks || undefined,
        is_active: formData.is_active,
        marks: marks,
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} result`);
    }
  };

  const filtersSelected = formData.course_id && formData.semester_id && formData.exam_type_id;

  if (loadingDropdowns) {
    return (
      <div className="w-full min-h-[20vh] flex items-center justify-center">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:file-01" className="w-5 h-5 text-blue-500" />
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Course <span className="text-red-500">*</span></Label>
              <select value={formData.course_id} onChange={(e) => handleChange("course_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" required>
                <option value={0}>Select Course</option>
                {courses.map(course => (<option key={course.id} value={course.id}>{course.name} ({course.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Semester <span className="text-red-500">*</span></Label>
              <select value={formData.semester_id} onChange={(e) => handleChange("semester_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" required>
                <option value={0}>Select Semester</option>
                {semesters.map(semester => (<option key={semester.id} value={semester.id}>{semester.name} ({semester.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Program</Label>
              <select value={formData.program_id} onChange={(e) => handleChange("program_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                <option value={0}>Select Program (Optional)</option>
                {programs.map(program => (<option key={program.id} value={program.id}>{program.name} ({program.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Branch</Label>
              <select value={formData.branch_id} onChange={(e) => handleChange("branch_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                <option value={0}>Select Branch (Optional)</option>
                {branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Group</Label>
              <select value={formData.group_id} onChange={(e) => handleChange("group_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                <option value={0}>Select Group (Optional)</option>
                {groups.map(group => (<option key={group.id} value={group.id}>{group.name} ({group.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Exam Type <span className="text-red-500">*</span></Label>
              <select
                value={formData.exam_type_id}
                onChange={(e) => handleChange("exam_type_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                required
                disabled={!formData.course_id || !formData.semester_id || loadingEstimatedMarks}
              >
                <option value={0}>
                  {loadingEstimatedMarks ? "Loading..." : (!formData.course_id || !formData.semester_id) ? "Select course & semester first" : "Select Exam Type"}
                </option>
                {exams.map(exam => {
                  const hasEM = hasEstimatedMark(exam.id);
                  return (
                    <option key={exam.id} value={exam.id} disabled={!hasEM}>
                      {exam.name} ({exam.code}) {!hasEM ? "- No Estimated Mark" : ""}
                    </option>
                  );
                })}
              </select>
              {formData.course_id && formData.semester_id && !loadingEstimatedMarks && (
                <p className="mt-1 text-xs text-gray-500">Only exam types with estimated marks for the selected course & semester are enabled</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label>Remarks</Label>
              <textarea value={formData.remarks} onChange={(e) => handleChange("remarks", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Enter any remarks (optional)"></textarea>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:note-edit" className="w-5 h-5 text-blue-500" />
            Cadets Marks Entry
            {loadingCadets && <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />}
          </h3>

          {!filtersSelected ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
              <p>Please select Course, Semester, and Exam Type to load cadets</p>
            </div>
          ) : loadingCadets ? (
            <div className="w-full min-h-[20vh] flex items-center justify-center">
              <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
            </div>
          ) : !moduleAssigned ? (
            <div className="text-center py-12 text-red-500">
              <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-2" />
              <p className="font-medium">You are not assigned to the GSK module for the selected course & semester.</p>
              <p className="text-sm text-gray-500 mt-1">Please contact admin to assign you to this module.</p>
            </div>
          ) : cadetRows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:user-group" className="w-10 h-10 mx-auto mb-2" />
              <p>No cadets assigned to you for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr>
                    <th className="border border-black px-3 py-2 text-center uppercase">SL</th>
                    <th className="border border-black px-3 py-2 text-center uppercase">CADET NO.</th>
                    <th className="border border-black px-3 py-2 text-center uppercase">RANK</th>
                    <th className="border border-black px-3 py-2 text-left uppercase">NAME</th>
                    <th className="border border-black px-3 py-2 text-left uppercase">BRANCH</th>
                    <th className="border border-black px-3 py-2 text-center uppercase">MARK{maxMark > 0 ? ` (Max: ${maxMark})` : ""}</th>
                  </tr>
                </thead>
                <tbody>
                  {cadetRows.map((cadet, index) => (
                    <tr key={cadet.cadet_id}>
                      <td className="border border-black px-3 py-2 text-center font-medium">{index + 1}</td>
                      <td className="border border-black px-3 py-2 text-center">{cadet.cadet_number}</td>
                      <td className="border border-black px-3 py-2 text-center">{cadet.cadet_rank}</td>
                      <td className="border border-black px-3 py-2 font-medium">{cadet.cadet_name}</td>
                      <td className="border border-black px-3 py-2 font-medium">{cadet.branch}</td>
                      <td className="border border-black px-2 py-1 text-center">
                        <input
                          type="number"
                          min={0}
                          max={maxMark > 0 ? maxMark : undefined}
                          step={0.01}
                          value={cadet.mark || 0}
                          onChange={(e) => handleCadetChange(index, "mark", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2" disabled={loading}>
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Result" : "Save Result")}
        </button>
      </div>
    </form>
  );
}
