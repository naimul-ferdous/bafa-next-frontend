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
import type { CtwPtExamResult } from "@/libs/types/ctwPtExam";

interface ResultFormProps {
  initialData?: CtwPtExamResult | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

interface DetailEntry {
  detail_id: number;
  quantity: number;
  mark: number;
}

interface CadetRow {
  id?: number;
  cadet_id: number;
  cadet_number: string;
  cadet_name: string;
  cadet_rank: string;
  branch: string;
  cadet_gender: string;
  detail_entries: { [detail_id: number]: DetailEntry };
  total_mark: number;
  is_active: boolean;
}

const PT_EXAM_MODULE_CODE = "pt_exam";

const normalizeGender = (gender: string): string => {
  if (!gender) return "male";
  return gender.toLowerCase().startsWith("f") ? "female" : "male";
};

const lookupMark = (detail: any, quantity: number, gender: string): number => {
  if (!detail.scores || detail.scores.length === 0) return 0;
  const qtyField = gender === "female" ? "female_quantity" : "male_quantity";
  const markField = gender === "female" ? "female_mark" : "male_mark";
  const sorted = [...detail.scores].sort((a: any, b: any) => parseFloat(b[qtyField]) - parseFloat(a[qtyField]));
  const matched = sorted.find((s: any) => quantity >= parseFloat(s[qtyField]));
  return matched ? parseFloat(matched[markField]) : 0;
};

const getDetailMaxMark = (detail: any, gender: string): number => {
  const markField = gender === "female" ? "female_marks" : "male_marks";
  const maxFromField = parseFloat(detail[markField] || 0);
  if (maxFromField > 0) return maxFromField;
  if (detail.scores && detail.scores.length > 0) {
    const scoreMarkField = gender === "female" ? "female_mark" : "male_mark";
    return Math.max(...detail.scores.map((s: any) => parseFloat(s[scoreMarkField] || 0)));
  }
  return 0;
};

export default function PtExamResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
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
  const [ptExamModuleId, setPtExamModuleId] = useState<number>(0);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [loadingEstimatedMarks, setLoadingEstimatedMarks] = useState(false);
  const [moduleAssigned, setModuleAssigned] = useState(false);

  // Derive details from the selected exam type's estimated mark entry
  const selectedEM = estimatedMarks.find((em: any) => em.exam_type_id === formData.exam_type_id);
  const details: any[] = selectedEM?.details || [];
  const hasScoresRow = details.some((d: any) => d.scores && d.scores.length > 0);

  // Load dropdown data + find pt exam module
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

        const ptExamModule = modulesRes.data.find((m: any) => m.code === PT_EXAM_MODULE_CODE);
        if (ptExamModule) setPtExamModuleId(ptExamModule.id);
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingDropdowns(false);
      }
    };
    loadDropdownData();
  }, []);

  // Load estimated marks when course + semester are selected
  useEffect(() => {
    const loadEstimatedMarks = async () => {
      if (!ptExamModuleId || !formData.course_id || !formData.semester_id) {
        setEstimatedMarks([]);
        return;
      }
      try {
        setLoadingEstimatedMarks(true);
        const response = await ctwResultsModuleService.getEstimatedMarks(ptExamModuleId, {
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
  }, [ptExamModuleId, formData.course_id, formData.semester_id]);

  const hasEstimatedMark = (examTypeId: number): boolean => {
    return estimatedMarks.some((em: any) => em.exam_type_id === examTypeId);
  };

  // Auto-load cadets after all required filters are selected (create mode only)
  useEffect(() => {
    const loadCadets = async () => {
      if (!user?.id || !ptExamModuleId || !formData.course_id || !formData.semester_id || !formData.exam_type_id) {
        setCadetRows([]);
        setModuleAssigned(false);
        return;
      }

      try {
        setLoadingCadets(true);

        const moduleAssignRes = await ctwInstructorAssignModuleService.getAll({
          instructor_id: user.id,
          module_code: PT_EXAM_MODULE_CODE,
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
          ctw_results_module_id: ptExamModuleId,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          is_active: true,
        };
        if (formData.program_id) params.program_id = formData.program_id;
        if (formData.branch_id) params.branch_id = formData.branch_id;
        if (formData.group_id) params.group_id = formData.group_id;

        const assignedCadetsRes = await ctwInstructorAssignCadetService.getAll(params);

        // Build initial detail entries for each cadet using currently loaded details
        const currentEM = estimatedMarks.find((em: any) => em.exam_type_id === formData.exam_type_id);
        const currentDetails: any[] = currentEM?.details || [];
        const initialDetailEntries: { [detail_id: number]: DetailEntry } = {};
        currentDetails.forEach((d: any) => {
          initialDetailEntries[d.id] = { detail_id: d.id, quantity: 0, mark: 0 };
        });

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
              cadet_gender: normalizeGender(cadet.gender || ""),
              detail_entries: { ...initialDetailEntries },
              total_mark: 0,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, ptExamModuleId, formData.course_id, formData.semester_id, formData.program_id, formData.branch_id, formData.group_id, formData.exam_type_id, initialData]);

  // Populate form with initial data (edit mode)
  useEffect(() => {
    if (!initialData) return;

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
      const uniqueCadetIds = Array.from(new Set(initialData.achieved_marks.map((m: any) => m.cadet_id)));
      const rows: CadetRow[] = uniqueCadetIds.map(cadetId => {
        const mark = initialData.achieved_marks?.find((m: any) => m.cadet_id === cadetId) as any;
        const currentRank = mark?.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank;

        const detail_entries: { [detail_id: number]: DetailEntry } = {};
        if (mark?.details && Array.isArray(mark.details)) {
          mark.details.forEach((det: any) => {
            const did = det.ctw_results_module_estimated_marks_details_id;
            detail_entries[did] = {
              detail_id: did,
              quantity: parseFloat(det.qty || 0),
              mark: parseFloat(det.marks || 0),
            };
          });
        }

        const total_mark = Object.values(detail_entries).reduce((sum, e) => sum + e.mark, 0);

        return {
          cadet_id: cadetId as number,
          cadet_number: mark?.cadet?.cadet_number || "",
          cadet_name: mark?.cadet?.name || "Unknown",
          cadet_rank: currentRank?.short_name || currentRank?.name || "Officer Cadet",
          branch: initialData.branch?.name || "N/A",
          cadet_gender: normalizeGender(mark?.cadet?.gender || ""),
          detail_entries,
          total_mark,
          is_active: mark?.is_active ?? true,
        };
      });
      setCadetRows(rows);
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailChange = (cadetIndex: number, detailId: number, field: "quantity" | "mark", value: number) => {
    setCadetRows(prev => {
      const updated = [...prev];
      const cadet = { ...updated[cadetIndex] };
      const detail = details.find((d: any) => d.id === detailId);
      const entries = { ...cadet.detail_entries };
      const entry = entries[detailId] || { detail_id: detailId, quantity: 0, mark: 0 };

      if (field === "quantity" && detail?.scores?.length > 0) {
        const newMark = lookupMark(detail, value, cadet.cadet_gender);
        entries[detailId] = { ...entry, quantity: value, mark: newMark };
      } else if (field === "mark") {
        const maxMark = getDetailMaxMark(detail, cadet.cadet_gender);
        const clampedMark = maxMark > 0 ? Math.min(value, maxMark) : value;
        entries[detailId] = { ...entry, mark: clampedMark };
      }

      cadet.detail_entries = entries;
      cadet.total_mark = Object.values(entries).reduce((sum, e) => sum + e.mark, 0);
      updated[cadetIndex] = cadet;
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
      const marks: any[] = cadetRows.filter(c => c.cadet_id > 0).map(c => ({
        cadet_id: c.cadet_id,
        achieved_mark: c.total_mark || 0,
        details: Object.values(c.detail_entries).map(e => ({
          ctw_results_module_estimated_marks_details_id: e.detail_id,
          qty: e.quantity || 0,
          marks: e.mark || 0,
        })),
      }));

      const submitData = {
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        program_id: formData.program_id || undefined,
        branch_id: formData.branch_id || undefined,
        group_id: formData.group_id || undefined,
        exam_type_id: formData.exam_type_id,
        instructor_id: user.id,
        ctw_results_module_id: ptExamModuleId,
        remarks: formData.remarks || undefined,
        is_active: formData.is_active,
        marks,
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? "update" : "create"} result`);
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
        {/* Basic Information */}
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
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>

            <div>
              <Label>Semester <span className="text-red-500">*</span></Label>
              <select value={formData.semester_id} onChange={(e) => handleChange("semester_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" required>
                <option value={0}>Select Semester</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>

            <div>
              <Label>Program</Label>
              <select value={formData.program_id} onChange={(e) => handleChange("program_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                <option value={0}>Select Program (Optional)</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
              </select>
            </div>

            <div>
              <Label>Branch</Label>
              <select value={formData.branch_id} onChange={(e) => handleChange("branch_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                <option value={0}>Select Branch (Optional)</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
            </div>

            <div>
              <Label>Group</Label>
              <select value={formData.group_id} onChange={(e) => handleChange("group_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                <option value={0}>Select Group (Optional)</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.code})</option>)}
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
                      {exam.name} ({exam.code}){!hasEM ? " - No Estimated Mark" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Remarks</Label>
              <textarea value={formData.remarks} onChange={(e) => handleChange("remarks", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Enter any remarks (optional)" />
            </div>
          </div>
        </div>

        {/* Cadets Marks Entry */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:note-edit" className="w-5 h-5 text-blue-500" />
            Cadets Marks Entry
            {loadingCadets && <Icon icon="hugeicons:fan-01" className="w-5 h-5 animate-spin text-blue-500" />}
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
          ) : !moduleAssigned && !isEdit ? (
            <div className="text-center py-12 text-red-500">
              <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-2" />
              <p className="font-medium">You are not assigned to the PT Exam module for the selected course & semester.</p>
              <p className="text-sm text-gray-500 mt-1">Please contact admin to assign you to this module.</p>
            </div>
          ) : cadetRows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:user-group" className="w-10 h-10 mx-auto mb-2" />
              <p>No cadets assigned to you for the selected filters</p>
            </div>
          ) : details.length === 0 ? (
            <div className="text-center py-12 text-yellow-600">
              <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-2" />
              <p>No PT Exam details configured for this exam type. Please set up estimated mark details first.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  {/* Row 1: fixed columns + detail names + total */}
                  <tr>
                    <th rowSpan={hasScoresRow ? 2 : 1} className="border border-black px-2 py-2 text-center whitespace-nowrap">SL</th>
                    <th rowSpan={hasScoresRow ? 2 : 1} className="border border-black px-2 py-2 text-center whitespace-nowrap">BD No.</th>
                    <th rowSpan={hasScoresRow ? 2 : 1} className="border border-black px-2 py-2 text-center whitespace-nowrap">Rank</th>
                    <th rowSpan={hasScoresRow ? 2 : 1} className="border border-black px-2 py-2 text-left">Name</th>
                    <th rowSpan={hasScoresRow ? 2 : 1} className="border border-black px-2 py-2 text-left">Branch</th>
                    {details.map((detail: any) => {
                      const hasScores = detail.scores && detail.scores.length > 0;
                      return hasScores ? (
                        <th key={detail.id} colSpan={2} className="border border-black px-2 py-2 text-center">
                          {detail.name}
                          <div className="text-xs font-normal text-gray-500 normal-case">
                            {parseFloat(detail.male_marks || 0)} / {parseFloat(detail.female_marks || 0)}
                          </div>
                        </th>
                      ) : (
                        <th key={detail.id} rowSpan={hasScoresRow ? 2 : 1} className="border border-black px-2 py-2 text-center">
                          {detail.name}
                          <div className="text-xs font-normal text-gray-500 normal-case">
                            {parseFloat(detail.male_marks || 0)} / {parseFloat(detail.female_marks || 0)}
                          </div>
                        </th>
                      );
                    })}
                    <th rowSpan={hasScoresRow ? 2 : 1} className="border border-black px-2 py-2 text-center whitespace-nowrap">Total</th>
                  </tr>
                  {/* Row 2: Qty | Mark sub-headers for score-based details */}
                  {hasScoresRow && (
                    <tr>
                      {details.map((detail: any) => {
                        const hasScores = detail.scores && detail.scores.length > 0;
                        return hasScores ? (
                          <React.Fragment key={detail.id}>
                            <th className="border border-black px-2 py-1 text-center text-xs">Qty</th>
                            <th className="border border-black px-2 py-1 text-center text-xs">Mark</th>
                          </React.Fragment>
                        ) : null;
                      })}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {cadetRows.map((cadet, index) => (
                    <tr key={cadet.cadet_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-black px-2 py-2 text-center font-medium">{index + 1}</td>
                      <td className="border border-black px-2 py-2 text-center">{cadet.cadet_number}</td>
                      <td className="border border-black px-2 py-2 text-center">{cadet.cadet_rank}</td>
                      <td className="border border-black px-2 py-2 font-medium">
                        {cadet.cadet_name}
                        {cadet.cadet_gender === "female" && <span className="ml-1 text-pink-600 text-xs font-semibold">(F)</span>}
                      </td>
                      <td className="border border-black px-2 py-2">{cadet.branch}</td>
                      {details.map((detail: any) => {
                        const hasScores = detail.scores && detail.scores.length > 0;
                        const entry = cadet.detail_entries[detail.id] || { detail_id: detail.id, quantity: 0, mark: 0 };
                        const maxMark = getDetailMaxMark(detail, cadet.cadet_gender);

                        if (hasScores) {
                          return (
                            <React.Fragment key={detail.id}>
                              <td className="border border-black px-1 py-1 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={entry.quantity === 0 ? "" : entry.quantity}
                                  onChange={(e) => handleDetailChange(index, detail.id, "quantity", parseFloat(e.target.value) || 0)}
                                  className="w-16 px-1 py-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-blue-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="0"
                                />
                              </td>
                              <td className="border border-black px-2 py-2 text-center">
                                {entry.mark.toFixed(2)}
                              </td>
                            </React.Fragment>
                          );
                        } else {
                          return (
                            <td key={detail.id} className="border border-black px-1 py-1 text-center">
                              <input
                                type="number"
                                min={0}
                                max={maxMark > 0 ? maxMark : undefined}
                                step={0.01}
                                value={entry.mark === 0 ? "" : entry.mark}
                                onChange={(e) => handleDetailChange(index, detail.id, "mark", parseFloat(e.target.value) || 0)}
                                className="w-16 px-1 py-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-blue-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0"
                              />
                            </td>
                          );
                        }
                      })}
                      <td className="border border-black px-2 py-2 text-center font-bold">
                        {cadet.total_mark.toFixed(2)}
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
