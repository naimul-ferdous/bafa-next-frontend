/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { commonService } from "@/libs/services/commonService";
import { ctwCommonService } from "@/libs/services/ctwCommonService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import { cadetService } from "@/libs/services/cadetService";
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

interface CadetRow {
  id?: number;
  cadet_id: number;
  cadet_number: string;
  cadet_name: string;
  cadet_rank: string;
  cadet_gender: string;
  branch: string;
  mark: number;
  conversation_mark: number;
  detail_marks: { [detailId: number]: number };
  detail_inputs: { [detailId: number]: string };
  is_active: boolean;
}

const timeToSeconds = (timeStr: string | null): number => {
  if (!timeStr) return 0;
  if (typeof timeStr !== 'string') return parseFloat(timeStr) || 0;
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return parseFloat(timeStr) || 0;
};

const secondsToTime = (seconds: number): string => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const calculateMark = (detail: any, value: string, gender: string): number => {
  const scores = detail?.scores || [];
  const isFemale = gender.toLowerCase() === 'female';
  
  if (!scores || scores.length === 0) {
    const directValue = parseFloat(value);
    return isNaN(directValue) ? 0 : directValue;
  }

  const firstScore = scores[0];
  const isTimeBased = isFemale ? !!firstScore?.female_time : !!firstScore?.male_time;

if (isTimeBased) {
    const cadetSeconds = timeToSeconds(value);
    if (cadetSeconds === 0) return 0;

    // Sort scores by time (DESCENDING - slowest first)
    const sortedScores = [...scores].sort((a: any, b: any) => {
      const timeA = timeToSeconds(isFemale ? a.female_time : a.male_time);
      const timeB = timeToSeconds(isFemale ? b.female_time : b.male_time);
      return timeB - timeA;
    });

    // For time-based: lower time = better. Find first where cadet >= scoreTime
    let bestMark = 0;
    for (const s of sortedScores) {
      const scoreTime = timeToSeconds(isFemale ? s.female_time : s.male_time);
      if (cadetSeconds >= scoreTime) {
        bestMark = parseFloat(isFemale ? s.female_mark : s.male_mark);
        break;
      }
    }
    return bestMark;
  } else {
    const cadetQty = parseFloat(value) || 0;
    if (cadetQty === 0) return 0;

    // Sort scores by quantity (descending)
    const sortedScores = [...scores].sort((a: any, b: any) => {
      const qtyA = parseFloat(isFemale ? a.female_quantity : a.male_quantity) || 0;
      const qtyB = parseFloat(isFemale ? b.female_quantity : b.male_quantity) || 0;
      return qtyB - qtyA;
    });

    // For quantity-based: higher qty = better
    let bestMark = 0;
    for (const s of sortedScores) {
      const scoreQty = parseFloat(isFemale ? s.female_quantity : s.male_quantity) || 0;
      if (cadetQty >= scoreQty) {
        bestMark = parseFloat(isFemale ? s.female_mark : s.male_mark);
        break;
      }
    }
    return bestMark;
  }
};

const PT_EXAM_MODULE_CODE = "pt_exam";

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
  const [moduleId, setModuleId] = useState<number>(0);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [loadingEstimatedMarks, setLoadingEstimatedMarks] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [moduleAssigned, setModuleAssigned] = useState(false);

  const currentEstimatedMark = estimatedMarks.find((em: any) => em.exam_type_id === formData.exam_type_id);
  const stationDetails = currentEstimatedMark?.details || [];

  useEffect(() => {
    if (!user?.id) return;

    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const options = await ctwCommonService.getPtExamFormOptions(user.id);

        if (options) {
          setCourses(options.courses);
          setPrograms(options.programs);
          setBranches(options.branches);
          setGroups(options.groups);
          setExams(options.exams);

          if (options.module) {
            setModuleId(options.module.id);
          }
        }
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, [user?.id]);

  useEffect(() => {
    if (!formData.course_id) {
      setSemesters([]);
      if (!initialData) setFormData(prev => ({ ...prev, semester_id: 0 }));
      return;
    }

    const loadSemesters = async () => {
      try {
        setLoadingSemesters(true);
        if (!initialData) setFormData(prev => ({ ...prev, semester_id: 0 }));
        const result = await commonService.getSemestersByCourse(formData.course_id);
        setSemesters(result);
      } catch (err) {
        console.error("Failed to load semesters:", err);
        setSemesters([]);
      } finally {
        setLoadingSemesters(false);
      }
    };

    loadSemesters();
  }, [formData.course_id, initialData]);

  useEffect(() => {
    const loadEstimatedMarks = async () => {
      if (!moduleId || !formData.course_id || !formData.semester_id) {
        setEstimatedMarks([]);
        return;
      }

      try {
        setLoadingEstimatedMarks(true);
        const response = await ctwResultsModuleService.getEstimatedMarks(moduleId, {
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
  }, [moduleId, formData.course_id, formData.semester_id]);

  const hasEstimatedMark = (examTypeId: number): boolean => {
    return estimatedMarks.some((em: any) => em.exam_type_id === examTypeId);
  };

  const getMaxConvMark = (): number => {
    if (!formData.exam_type_id) return 0;
    const em = estimatedMarks.find((em: any) => em.exam_type_id === formData.exam_type_id);
    return em?.conversation_mark ? parseFloat(em.conversation_mark) : 0;
  };

  const getTotalRawMax = (gender: string): number => {
    return stationDetails.reduce((sum: number, d: any) => {
      return sum + parseFloat(gender.toLowerCase() === 'female' ? d.female_marks : d.male_marks);
    }, 0);
  };

  useEffect(() => {
    const loadCadets = async () => {
      if (!user?.id || !moduleId || !formData.course_id || !formData.semester_id || !formData.exam_type_id) {
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

        const cadetParams: any = {
          per_page: 500,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          is_current: 1,
        };
        if (formData.program_id) cadetParams.program_id = formData.program_id;
        if (formData.branch_id) cadetParams.branch_id = formData.branch_id;
        if (formData.group_id) cadetParams.group_id = formData.group_id;

        const cadetsRes = await cadetService.getAllCadets(cadetParams);

        const rows: CadetRow[] = cadetsRes.data.map((cadet: any) => {
          const currentRank = cadet.assigned_ranks?.find((ar: any) => ar.rank)?.rank;
          return {
            cadet_id: cadet.id,
            cadet_number: cadet.cadet_number || "",
            cadet_name: cadet.name,
            cadet_rank: currentRank?.short_name || currentRank?.name || "Officer Cadet",
            cadet_gender: cadet.gender || "Male",
            branch: cadet.assigned_branchs?.find((ab: any) => ab.is_current)?.branch?.name || cadet.assigned_branchs?.[0]?.branch?.name || "N/A",
            mark: 0,
            conversation_mark: 0,
            detail_marks: {},
            detail_inputs: {},
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
  }, [user?.id, moduleId, formData.course_id, formData.semester_id, formData.program_id, formData.branch_id, formData.group_id, formData.exam_type_id, initialData]);

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
  }, [initialData]);

  useEffect(() => {
    if (!initialData || stationDetails.length === 0) return;

    if (initialData.achieved_marks && initialData.achieved_marks.length > 0) {
      setModuleAssigned(true);
      const uniqueCadets = Array.from(new Set(initialData.achieved_marks.map(m => m.cadet_id)));
      const rows: CadetRow[] = uniqueCadets.map(cadetId => {
        const mark = initialData.achieved_marks?.find(m => m.cadet_id === cadetId);
        const currentRank = mark?.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank;

        const detailMarks: { [key: number]: number } = {};
        const detailInputs: { [key: number]: string } = {};

        mark?.details?.forEach((d: any) => {
          const detailId = d.ctw_results_module_estimated_marks_details_id;
          if (detailId) {
            detailMarks[detailId] = parseFloat(d.marks) || 0;

            const stationDetail = stationDetails.find((sd: any) => sd.id === detailId);
            const isFemale = mark?.cadet?.gender?.toLowerCase() === 'female';
            const firstScore = stationDetail?.scores?.[0];
            const isTimeBased = isFemale ? !!firstScore?.female_time : !!firstScore?.male_time;

            if (isTimeBased && d.qty) {
              detailInputs[detailId] = secondsToTime(parseFloat(d.qty));
            } else {
              detailInputs[detailId] = d.achieved_time || d.qty?.toString() || d.marks?.toString() || "0";
            }
          }
        });

        const rawSum = Object.values(detailMarks).reduce((sum, m) => sum + m, 0);

        return {
          cadet_id: cadetId,
          cadet_number: mark?.cadet?.cadet_number || "",
          cadet_name: mark?.cadet?.name || "Unknown",
          cadet_rank: currentRank?.short_name || currentRank?.name || "Officer Cadet",
          cadet_gender: mark?.cadet?.gender || "Male",
          branch: mark?.cadet?.assigned_branchs?.find((ab: any) => ab.is_current)?.branch?.name || mark?.cadet?.assigned_branchs?.[0]?.branch?.name || "N/A",
          mark: rawSum,
          conversation_mark: mark?.achieved_mark || 0,
          detail_marks: detailMarks,
          detail_inputs: detailInputs,
          is_active: mark?.is_active || true,
        };
      });
      setCadetRows(rows);
    }
  }, [initialData, stationDetails.length]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCadetInputChange = (cadetIndex: number, detailId: number, value: string, gender: string) => {
    const detail = stationDetails.find((d: any) => d.id === detailId);
    if (!detail) return;

    const mark = calculateMark(detail, value, gender);

    setCadetRows(prev => {
      const updated = [...prev];
      const cadet = updated[cadetIndex];
      const updatedDetailInputs = { ...cadet.detail_inputs, [detailId]: value };
      const updatedDetailMarks = { ...cadet.detail_marks, [detailId]: mark };

      const totalRawMark = Object.values(updatedDetailMarks).reduce((sum: number, m: any) => sum + m, 0);
      const isFemale = gender.toLowerCase() === 'female';
      const cadetTotalMaxRaw = stationDetails.reduce((sum: number, d: any) => {
        return sum + parseFloat(isFemale ? d.female_marks : d.male_marks);
      }, 0);

      const convMax = getMaxConvMark();
      let calculatedConvMark = 0;
      if (cadetTotalMaxRaw > 0 && convMax > 0) {
        calculatedConvMark = (totalRawMark / cadetTotalMaxRaw) * convMax;
      } else {
        calculatedConvMark = totalRawMark;
      }

      updated[cadetIndex] = {
        ...cadet,
        detail_inputs: updatedDetailInputs,
        detail_marks: updatedDetailMarks,
        mark: totalRawMark,
        conversation_mark: parseFloat(calculatedConvMark.toFixed(2))
      };
      return updated;
    });
  };

  const handleCadetChange = (cadetIndex: number, field: keyof CadetRow, value: any) => {
    setCadetRows(prev => {
      const updated = [...prev];
      updated[cadetIndex] = {
        ...updated[cadetIndex],
        [field]: value
      };
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
        const details: any[] = [];

        Object.entries(c.detail_marks).forEach(([detailId, val]) => {
          const detailInput = c.detail_inputs[parseInt(detailId)] || "0";
          const detail = stationDetails.find((d: any) => d.id === parseInt(detailId));
          const isFemale = c.cadet_gender.toLowerCase() === 'female';
          const firstScore = detail?.scores?.[0];
          const isTimeBased = isFemale ? !!firstScore?.female_time : !!firstScore?.male_time;

          details.push({
            ctw_results_module_estimated_marks_details_id: parseInt(detailId),
            marks: val,
            qty: isTimeBased ? timeToSeconds(detailInput) : parseFloat(detailInput) || 0,
            achieved_time: isTimeBased ? detailInput : null
          });
        });

        marks.push({
          cadet_id: c.cadet_id,
          achieved_mark: c.conversation_mark || 0,
          details: details
        });
      });

      const submitData = {
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        program_id: formData.program_id || undefined,
        branch_id: formData.branch_id || undefined,
        group_id: formData.group_id || undefined,
        exam_type_id: formData.exam_type_id,
        instructor_id: user.id,
        ctw_results_module_id: moduleId,
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
        <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
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
              <select
                value={formData.semester_id}
                onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                required
                disabled={!formData.course_id || loadingSemesters}
              >
                <option value={0}>
                  {loadingSemesters ? "Loading..." : !formData.course_id ? "Select course first" : "Select Semester"}
                </option>
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
                    <option
                      key={exam.id}
                      value={exam.id}
                      disabled={!hasEM}
                    >
                      {exam.name} ({exam.code}) {!hasEM ? "- No Estimated Mark" : ""}
                    </option>
                  );
                })}
              </select>
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
            {loadingCadets && (
              <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
            )}
          </h3>

          {!filtersSelected ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
              <p>Please select Course, Semester, and Exam Type to load cadets</p>
            </div>
          ) : loadingCadets ? (
            <div className="w-full min-h-[20vh] flex items-center justify-center">
              <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
            </div>
          ) : !moduleAssigned ? (
            <div className="text-center py-12 text-red-500">
              <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-2" />
              <p className="font-medium">You are not assigned to the PT Exam module for the selected course & semester.</p>
            </div>
          ) : cadetRows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:user-group" className="w-10 h-10 mx-auto mb-2" />
              <p>No cadets assigned to you for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-2 text-center uppercase whitespace-nowrap" rowSpan={2}>SL</th>
                    <th className="border border-black px-2 py-2 text-center uppercase whitespace-nowrap" rowSpan={2}>BD</th>
                    <th className="border border-black px-2 py-2 text-center uppercase whitespace-nowrap" rowSpan={2}>Rk</th>
                    <th className="border border-black px-2 py-2 text-left uppercase whitespace-nowrap" rowSpan={2}>Name</th>
                    <th className="border border-black px-2 py-2 text-left uppercase whitespace-nowrap" rowSpan={2}>Br</th>
                    {stationDetails.map((detail: any) => (
                      <th key={detail.id} className="border border-black px-1 py-2 text-center uppercase" colSpan={2}>
                        {detail.name}
                      </th>
                    ))}
                    <th className="border border-black px-2 py-2 text-center uppercase whitespace-nowrap" rowSpan={2}>
                      Total {getTotalRawMax(cadetRows[0]?.cadet_gender || 'male')}
                    </th>
                    <th className="border border-black px-2 py-2 text-center uppercase whitespace-nowrap" rowSpan={2}>
                      Out of {getMaxConvMark()}
                    </th>
                  </tr>
                  <tr>
                    {stationDetails.map((detail: any) => {
                      const isFemale = (cadetRows[0]?.cadet_gender || 'male').toLowerCase() === 'female';
                      const firstScore = detail.scores?.[0];
                      const isTimeBased = isFemale ? !!firstScore?.female_time : !!firstScore?.male_time;
                      return (
                        <React.Fragment key={detail.id}>
                          <th className="border border-black px-1 py-1 text-center uppercase font-normal">
                            {isTimeBased ? "Time" : "Qty"}
                          </th>
                          <th className="border border-black px-1 py-1 text-center uppercase font-normal bg-gray-50">
                            Mks
                          </th>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {cadetRows.map((cadet, index) => (
                    <tr key={cadet.cadet_id}>
                      <td className="border border-black px-2 py-1 text-center">{index + 1}</td>
                      <td className="border border-black px-2 py-1 text-center">{cadet.cadet_number}</td>
                      <td className="border border-black px-2 py-1 text-center">{cadet.cadet_rank}</td>
                      <td className="border border-black px-2 py-1 font-medium">
                        {cadet.cadet_name}
                        {cadet.cadet_gender?.toLowerCase() === "female" && (
                          <span className="ml-1 text-pink-600 font-semibold text-xs">(F)</span>
                        )}
                      </td>
                      <td className="border border-black px-2 py-1">{cadet.branch}</td>

                      {stationDetails.map((detail: any) => {
                        const isFemale = cadet.cadet_gender.toLowerCase() === 'female';
                        const firstScore = detail.scores?.[0];
                        const isTimeBased = isFemale ? !!firstScore?.female_time : !!firstScore?.male_time;
                        
                        return (
                          <React.Fragment key={detail.id}>
                            <td className="border border-black px-1 py-1 text-center">
                              <input
                                type="text"
                                value={cadet.detail_inputs[detail.id] || ""}
                                onChange={(e) => handleCadetInputChange(index, detail.id, e.target.value, cadet.cadet_gender)}
                                className="w-12 px-1 py-1 border border-gray-300 rounded text-center text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                                placeholder={isTimeBased ? "0:00" : "0"}
                              />
                            </td>
                            <td className="border border-black px-1 py-1 text-center bg-gray-50">
                              {cadet.detail_marks[detail.id] || 0}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      <td className="border border-black px-1 py-1 text-center bg-blue-50 font-bold">
                        {cadet.mark || 0}
                      </td>
                      <td className="border border-black px-1 py-1 text-center bg-green-50 font-bold">
                        {cadet.conversation_mark || 0}
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
