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
import type { CtwHurdlesResult } from "@/libs/types/ctwHurdles";

interface ResultFormProps {
  initialData?: CtwHurdlesResult | null;
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
  mark: number; // Raw total mark
  conversation_mark: number; // Final mark
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
  const hasTime = isFemale ? !!firstScore?.female_time : !!firstScore?.male_time;
  const hasQty = isFemale ? !!firstScore?.female_quantity : !!firstScore?.male_quantity;

  // If no time and no quantity, treat as direct mark input
  if (!hasTime && !hasQty) {
    return parseFloat(value) || 0;
  }

  if (hasTime) {
    const cadetSeconds = timeToSeconds(value);
    if (cadetSeconds === 0) return 0;

    // Sort scores by time (DESCENDING - slowest first)
    const sortedScores = [...scores].sort((a: any, b: any) => {
      const timeA = timeToSeconds(isFemale ? a.female_time : a.male_time);
      const timeB = timeToSeconds(isFemale ? b.female_time : b.male_time);
      return timeB - timeA;
    });

    // For time-based (lower time = better):
    // Sorted descending: 0:57=17, 0:54=18, 0:51=19, 0:50=20
    // Cadet 0:55 (330s): check if 330 >= scoreTime (cadet is slower than threshold)
    // 330 >= 342 (0:57)? NO
    // 330 >= 324 (0:54)? YES -> 18 marks (STOP!)
    let bestMark = 0;
    for (const s of sortedScores) {
      const scoreTime = timeToSeconds(isFemale ? s.female_time : s.male_time);
      if (cadetSeconds >= scoreTime) {
        bestMark = parseFloat(isFemale ? s.female_mark : s.male_mark);
        break;
      }
    }
    return bestMark;
  } else if (hasQty) {
    const cadetQty = parseFloat(value) || 0;
    if (cadetQty === 0) return 0;

    // Sort scores by quantity (descending)
    const sortedScores = [...scores].sort((a: any, b: any) => {
      const qtyA = parseFloat(isFemale ? a.female_quantity : a.male_quantity) || 0;
      const qtyB = parseFloat(isFemale ? b.female_quantity : b.male_quantity) || 0;
      return qtyB - qtyA;
    });

    // For quantity-based: higher qty = better marks
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

  return parseFloat(value) || 0;
};

// Returns false when the estimated mark for this gender is 0 — station is N/A for that gender
const isDetailApplicable = (detail: any, gender: string): boolean => {
  const isFemale = gender.toLowerCase() === 'female';
  const mark = parseFloat(isFemale ? detail.female_marks : detail.male_marks) || 0;
  return mark > 0;
};

const HURDLES_MODULE_CODE = "hurdle_test";

export default function HurdlesResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
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
  const hurdleDetails = currentEstimatedMark?.details || [];

  useEffect(() => {
    if (!user?.id) return;

    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const options = await ctwCommonService.getHurdlesFormOptions(user.id);

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
    return hurdleDetails.reduce((sum: number, d: any) => {
      const mark = parseFloat(gender.toLowerCase() === 'female' ? d.female_marks : d.male_marks) || 0;
      // Skip N/A stations (estimated mark = 0 for this gender)
      if (mark <= 0) return sum;
      return sum + mark;
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
          module_code: HURDLES_MODULE_CODE,
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

        const convMax = getMaxConvMark();

        const rows: CadetRow[] = cadetsRes.data.map((cadet: any) => {
          const currentRank = cadet.assigned_ranks?.find((ar: any) => ar.rank)?.rank;
          const isFemale = (cadet.gender || "Male").toLowerCase() === "female";

          const cadetTotalMaxRaw = hurdleDetails.reduce((sum: number, d: any) => {
            const m = parseFloat(isFemale ? d.female_marks : d.male_marks) || 0;
            if (m <= 0) return sum;
            return sum + m;
          }, 0);

          const detailMarks: { [key: number]: number } = {};
          const detailInputs: { [key: number]: string } = {};

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

  // Step 1: set formData immediately when initialData arrives (no stationDetails dependency)
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

  // Step 2: populate cadetRows once hurdleDetails are loaded
  useEffect(() => {
    if (!initialData || hurdleDetails.length === 0) return;

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
            const stationDetail = hurdleDetails.find((sd: any) => sd.id === detailId);
            const isFemale = mark?.cadet?.gender?.toLowerCase() === 'female';
            const firstScore = stationDetail?.scores?.[0];
            const hasTime = isFemale ? !!firstScore?.female_time : !!firstScore?.male_time;
            const hasQty = isFemale ? !!firstScore?.female_quantity : !!firstScore?.male_quantity;

            if (hasTime && d.qty) {
              detailInputs[detailId] = secondsToTime(parseFloat(d.qty));
            } else if (!hasTime && !hasQty) {
              detailInputs[detailId] = d.qty?.toString() || "0";
            } else {
              detailInputs[detailId] = d.achieved_time || d.qty?.toString() || "0";
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
  }, [initialData, hurdleDetails.length]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCadetInputChange = (cadetIndex: number, detailId: number, value: string, gender: string) => {
    const detail = hurdleDetails.find((d: any) => d.id === detailId);
    if (!detail) return;

    const firstScore = detail.scores?.[0];
    const isFemale = gender.toLowerCase() === 'female';
    const hasTime = isFemale ? !!firstScore?.female_time : !!firstScore?.male_time;
    const hasQty = isFemale ? !!firstScore?.female_quantity : !!firstScore?.male_quantity;
    let mark = calculateMark(detail, value, gender);

    // For non-time and non-qty details, apply max mark logic
    if (!hasTime && !hasQty) {
      const maxMark = isFemale
        ? parseFloat(detail.female_marks) || 0
        : parseFloat(detail.male_marks) || 0;
      const inputVal = parseFloat(value);
      if (!value || value === "" || isNaN(inputVal)) {
        mark = maxMark;
        value = maxMark.toString();
      } else if (inputVal > maxMark) {
        mark = maxMark;
        value = maxMark.toString();
      }
    }

    setCadetRows(prev => {
      const updated = [...prev];
      const cadet = updated[cadetIndex];

      // Check if this detail is time/qty-based
      const dFirstScore = hurdleDetails.find(d => d.id === detailId)?.scores?.[0];
      const dIsFemale = cadet.cadet_gender.toLowerCase() === 'female';
      const isTimeDetail = dIsFemale
        ? (!!dFirstScore?.female_time || !!dFirstScore?.female_quantity)
        : (!!dFirstScore?.male_time || !!dFirstScore?.male_quantity);

        // Check if ANY non-time detail has 0 marks - if so, Time should be 0 too
        let hasZeroNonTime = false;
        for (const d of hurdleDetails) {
          // Skip if this detail is not applicable for this gender (estimated mark is 0)
          if (!isDetailApplicable(d, cadet.cadet_gender)) continue;

          const dFirstScore = d.scores?.[0];
          const dHasTime = isFemale
            ? (!!dFirstScore?.female_time || !!dFirstScore?.female_quantity)
            : (!!dFirstScore?.male_time || !!dFirstScore?.male_quantity);

          if (!dHasTime) {
            // Check existing marks OR new mark being entered
            const existingMark = cadet.detail_marks[d.id];
            const newMark = (d.id === detailId) ? mark : 0;
            const checkMark = (d.id === detailId) ? newMark : existingMark;

            if (!checkMark || checkMark === 0) {
              hasZeroNonTime = true;
              break;
            }
          }
        }

      // If current is Time detail and any non-time is 0, only set Time to 0 if Time mark is POSITIVE
      // Negative Time marks should always calculate
      if (isTimeDetail && hasZeroNonTime && mark > 0) {
        mark = 0;
      }

      const updatedDetailInputs = { ...cadet.detail_inputs, [detailId]: value };
      let updatedDetailMarks = { ...cadet.detail_marks, [detailId]: mark };

      // If any non-time is 0, only zero out POSITIVE time-based marks (keep negative marks)
      if (hasZeroNonTime) {
        for (const d of hurdleDetails) {
          // Skip if this detail is not applicable for this gender (estimated mark is 0)
          if (!isDetailApplicable(d, cadet.cadet_gender)) continue;

          const dFirstScore = d.scores?.[0];
          const dHasTime = isFemale
            ? (!!dFirstScore?.female_time || !!dFirstScore?.female_quantity)
            : (!!dFirstScore?.male_time || !!dFirstScore?.male_quantity);

          if (dHasTime && updatedDetailMarks[d.id] > 0) {
            updatedDetailMarks[d.id] = 0;
          }
        }
      }

      const totalRawMark = Object.values(updatedDetailMarks).reduce((sum: number, m: any) => sum + m, 0);

      const cadetTotalMaxRaw = hurdleDetails.reduce((sum: number, d: any) => {
        // Skip details not applicable for this gender (estimated mark is 0)
        if (!isDetailApplicable(d, cadet.cadet_gender)) return sum;
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
          const detail = hurdleDetails.find((d: any) => d.id === parseInt(detailId));
          if (!detail) return;
          if (!isDetailApplicable(detail, c.cadet_gender)) return;

          const isFemale = c.cadet_gender.toLowerCase() === 'female';
          const firstScore = detail.scores?.[0];
          const hasTime = isFemale ? !!firstScore?.female_time : !!firstScore?.male_time;
          const hasQty = isFemale ? !!firstScore?.female_quantity : !!firstScore?.male_quantity;

          const detailInput = c.detail_inputs[parseInt(detailId)];
          const isAutoMark = !hasTime && !hasQty;
          const inputVal = detailInput ? parseFloat(detailInput) : 0;

          if (isAutoMark) {
            details.push({
              ctw_results_module_estimated_marks_details_id: parseInt(detailId),
              marks: inputVal,
              qty: null,
              achieved_time: null
            });
          } else {
            details.push({
              ctw_results_module_estimated_marks_details_id: parseInt(detailId),
              marks: val,
              qty: hasTime ? timeToSeconds(detailInput || "0") : (parseFloat(detailInput || "0") || 0),
              achieved_time: hasTime ? detailInput : null
            });
          }
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
                {courses.map(course => (<option key={course.id} value={course.id}>{course.name}</option>))}
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
                {semesters.map(semester => (<option key={semester.id} value={semester.id}>{semester.name}</option>))}
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
            {/* <div className="md:col-span-2">
              <Label>Remarks</Label>
              <textarea value={formData.remarks} onChange={(e) => handleChange("remarks", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Enter any remarks (optional)"></textarea>
            </div> */}
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
              <p className="font-medium">You are not assigned to the Hurdles module for the selected course & semester.</p>
            </div>
          ) : cadetRows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:user-group" className="w-10 h-10 mx-auto mb-2" />
              <p>No cadets assigned to you for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>SL</th>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>BD/No</th>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>Rank</th>
                    <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={2}>Name</th>
                    <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={2}>Branch</th>
                    {/* Non-time/qty details — rowSpan=2 */}
                    {hurdleDetails.filter((detail: any) => {
                      const fs = detail.scores?.[0];
                      return !fs?.male_time && !fs?.female_time && !fs?.male_quantity && !fs?.female_quantity;
                    }).map((detail: any) => {
                      const maleMark = parseFloat(detail.male_marks) || 0;
                      const femaleMark = parseFloat(detail.female_marks) || 0;
                      return (
                        <th key={detail.id} className="border border-black px-1 py-2 text-center align-middle" rowSpan={2}>
                          <div className="h-32 flex flex-col items-center justify-center w-12 mx-auto">
                            <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{detail.name} - {maleMark}/{femaleMark}</span>
                          </div>
                        </th>
                      );
                    })}
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>
                      <div className="h-32 flex flex-col items-center justify-center w-12 mx-auto">
                        <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>HD Mk</span>
                      </div>
                    </th>
                    {/* Time/qty details — colSpan=2, rowSpan=1 (sub-headers in row 2) */}
                    {hurdleDetails.filter((detail: any) => {
                      const fs = detail.scores?.[0];
                      return !!fs?.male_time || !!fs?.female_time || !!fs?.male_quantity || !!fs?.female_quantity;
                    }).map((detail: any) => {
                      const maleMark = parseFloat(detail.male_marks) || 0;
                      const femaleMark = parseFloat(detail.female_marks) || 0;
                      return (
                        <th key={detail.id} className="border border-black px-1 py-2 text-center align-middle" colSpan={2}>
                          <div className="h-32 flex flex-col items-center justify-center w-12 mx-auto">
                            <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{detail.name} - {maleMark}/{femaleMark}</span>
                          </div>
                        </th>
                      );
                    })}
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>
                      <div className="h-32 flex flex-col items-center justify-center w-12 mx-auto">
                        <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Ttl Mk</span>
                      </div>
                    </th>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>
                      <div className="h-32 flex flex-col items-center justify-center w-12 mx-auto">
                        <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Conv ({getMaxConvMark()})</span>
                      </div>
                    </th>
                  </tr>
                  <tr>
                    {/* Sub-headers for time/qty details only */}
                    {hurdleDetails.filter((detail: any) => {
                      const fs = detail.scores?.[0];
                      return !!fs?.male_time || !!fs?.female_time || !!fs?.male_quantity || !!fs?.female_quantity;
                    }).map((detail: any) => {
                      const fs = detail.scores?.[0];
                      const hasTime = !!fs?.male_time || !!fs?.female_time;
                      return (
                        <React.Fragment key={detail.id}>
                          <th className="border border-black px-1 py-1 text-center align-middle text-xs">{hasTime ? "Time" : "Qty"}</th>
                          <th className="border border-black px-1 py-1 text-center align-middle text-xs">Mk</th>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {cadetRows.map((cadet, index) => {
                    const isFemale = cadet.cadet_gender.toLowerCase() === 'female';
                    return (
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

                        {/* Non-time/qty detail inputs */}
                        {hurdleDetails.filter((detail: any) => {
                          const fs = detail.scores?.[0];
                          return !fs?.male_time && !fs?.female_time && !fs?.male_quantity && !fs?.female_quantity;
                        }).map((detail: any) => {
                          const maxMark = isFemale ? parseFloat(detail.female_marks) || 0 : parseFloat(detail.male_marks) || 0;
                          const applicable = isDetailApplicable(detail, cadet.cadet_gender);
                          return (
                            <td key={detail.id} className="border border-black px-1 py-1 text-center">
                              {applicable ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={maxMark}
                                  value={cadet.detail_inputs[detail.id] || ""}
                                  onChange={(e) => handleCadetInputChange(index, detail.id, e.target.value, cadet.cadet_gender)}
                                  className="w-12 px-1 py-1 border border-gray-300 rounded text-center text-xs focus:ring-2 focus:ring-blue-500"
                                  placeholder="0"
                                />
                              ) : (
                                <span className="text-gray-400 text-xs">N/A</span>
                              )}
                            </td>
                          );
                        })}

                        {/* HD Mk */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {(() => {
                            let hdSum = 0;
                            for (const d of hurdleDetails) {
                              if (!isDetailApplicable(d, cadet.cadet_gender)) continue;
                              const dFirstScore = d.scores?.[0];
                              const dHasTime = !!dFirstScore?.male_time || !!dFirstScore?.female_time;
                              const dHasQty = !!dFirstScore?.male_quantity || !!dFirstScore?.female_quantity;
                              if (!dHasTime && !dHasQty) {
                                hdSum += cadet.detail_marks[d.id] || 0;
                              }
                            }
                            return hdSum;
                          })()}
                        </td>

                        {/* Time/qty detail inputs */}
                        {hurdleDetails.filter((detail: any) => {
                          const fs = detail.scores?.[0];
                          return !!fs?.male_time || !!fs?.female_time || !!fs?.male_quantity || !!fs?.female_quantity;
                        }).map((detail: any) => {
                          const firstScore = detail.scores?.[0];
                          const hasTime = !!firstScore?.male_time || !!firstScore?.female_time;
                          const maxMark = isFemale ? parseFloat(detail.female_marks) || 0 : parseFloat(detail.male_marks) || 0;
                          const applicable = isDetailApplicable(detail, cadet.cadet_gender);
                          return (
                            <React.Fragment key={detail.id}>
                              <td className="border border-black px-1 py-1 text-center">
                                {applicable ? (
                                  <input
                                    type={hasTime ? "text" : "number"}
                                    min="0"
                                    max={maxMark}
                                    value={cadet.detail_inputs[detail.id] || ""}
                                    onChange={(e) => handleCadetInputChange(index, detail.id, e.target.value, cadet.cadet_gender)}
                                    className="w-12 px-1 py-1 border border-gray-300 rounded text-center text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                                    placeholder={hasTime ? "0:00" : "0"}
                                  />
                                ) : (
                                  <span className="text-gray-400 text-xs">N/A</span>
                                )}
                              </td>
                              <td className="border border-black px-1 py-1 text-center">
                                {applicable ? (cadet.detail_marks[detail.id]?.toFixed(2) || "0.00") : <span className="text-gray-400 text-xs">—</span>}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {cadet.mark?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {cadet.conversation_mark?.toFixed(2) || "0.00"}
                        </td>
                      </tr>
                    );
                  })}
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
