/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import { Modal } from "@/components/ui/modal";
import { commonService } from "@/libs/services/commonService";
import { ctwCommonService } from "@/libs/services/ctwCommonService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import { cadetService } from "@/libs/services/cadetService";
import { ctwInstructorAssignModuleService } from "@/libs/services/ctwInstructorAssignModuleService";
import { ctwDtAssessmentResultService } from "@/libs/services/ctwDtAssessmentResultService";
import { useAuth } from "@/libs/hooks/useAuth";
import { Icon } from "@iconify/react";
import type { SystemCourse, SystemSemester, SystemExam } from "@/libs/types/system";

interface ResultFormProps {
  initialData?: any | null;
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
  mark: number | "";
  detail_marks: { [detailId: number]: number | "" };
  is_active: boolean;
}

const GSTO_ASSESSMENT_MODULE_CODE = "gsto_assessment";

export default function GstoAssessmentResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    exam_type_id: 0,
    result_date: new Date().toISOString().split("T")[0],
    remarks: "",
    is_active: true,
  });

  const [cadetRows, setCadetRows] = useState<CadetRow[]>([]);
  const [error, setError] = useState("");
  const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [estimatedMarks, setEstimatedMarks] = useState<any[]>([]);
  const [moduleId, setModuleId] = useState<number>(0);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingEstimatedMarks, setLoadingEstimatedMarks] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [moduleAssigned, setModuleAssigned] = useState(false);
  const [generatedCadetMarks, setGeneratedCadetMarks] = useState<Map<number, {dt_estimated_per_instructor:number; dt_conversation_mark:number; pf_estimated_per_instructor:number; pf_conversation_mark:number; dt_achieved: number; pf_achieved: number; total_achieved: number; avg_achieved: number; dt_converted: number; pf_converted: number; combined_converted: number; dt_days: number; pf_days: number }>>(new Map());
  const [generatedConfig, setGeneratedConfig] = useState({ dt_conversation_mark: 0, pf_conversation_mark: 0 });
  const [loadingGeneratedMarks, setLoadingGeneratedMarks] = useState(false);

  // Load dropdown data in a single API call
  useEffect(() => {
    if (!user?.id) return;

    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const options = await ctwCommonService.getGstoAssessmentFormOptions(user.id);

        if (options) {
          setCourses(options.courses.filter(c => c.is_active));
          setExams(options.exams.filter(e => e.is_active));

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

  // Load semesters dynamically when course is selected
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
        setSemesters(result.filter(s => s.is_active && s.is_gst));
      } catch (err) {
        console.error("Failed to load semesters:", err);
        setSemesters([]);
      } finally {
        setLoadingSemesters(false);
      }
    };

    loadSemesters();
  }, [formData.course_id, initialData]);

  // Load estimated marks
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

  // Active estimated mark config for selected exam type
  const activeEstimatedMark = estimatedMarks.find((em: any) => em.exam_type_id === formData.exam_type_id);
  const assessmentDetails: any[] = activeEstimatedMark?.details || [];

  // Max mark per detail
  const getDetailMaxMark = (detail: any): number => parseFloat(detail.male_marks || detail.female_marks || 0);

  // Total max across all details
  const maxDetailTotal = assessmentDetails.reduce((sum, d) => sum + getDetailMaxMark(d), 0);

  // Per-cadet calculations
  const getCadetDetailTotal = (cadet: CadetRow): number =>
    assessmentDetails.reduce((sum, d) => sum + (Number(cadet.detail_marks[d.id]) || 0), 0);

  // Load cadets when filters are selected
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
          module_code: GSTO_ASSESSMENT_MODULE_CODE,
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
        const cadetsRes = await cadetService.getAllCadets(cadetParams);

        const rows: CadetRow[] = cadetsRes.data.map((cadet: any) => {
          const currentRank = cadet.assigned_ranks?.find((ar: any) => ar.rank)?.rank;
          return {
            cadet_id: cadet.id,
            cadet_number: cadet.cadet_number || "",
            cadet_name: cadet.name,
            cadet_rank: currentRank?.short_name || currentRank?.name || "Officer Cadet",
            branch: cadet.assigned_branchs?.find((ab: any) => ab.is_current)?.branch?.name || cadet.assigned_branchs?.[0]?.branch?.name || "N/A",
            mark: "",
            detail_marks: {},
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
  }, [user?.id, moduleId, formData.course_id, formData.semester_id, formData.exam_type_id, initialData]);

  // Handle edit mode
  useEffect(() => {
    if (initialData) {
      setModuleAssigned(true);
      setFormData({
        course_id: initialData.course_id,
        semester_id: initialData.semester_id,
        exam_type_id: initialData.exam_type_id,
        result_date: initialData.result_date || new Date().toISOString().split("T")[0],
        remarks: initialData.remarks || "",
        is_active: initialData.is_active,
      });

      if (initialData.achieved_marks && initialData.achieved_marks.length > 0) {
        const uniqueCadets = Array.from(new Set(initialData.achieved_marks.map((m: any) => m.cadet_id))) as number[];
        const rows: CadetRow[] = uniqueCadets.map(cadetId => {
          const markRecord = initialData.achieved_marks?.find((m: any) => m.cadet_id === cadetId);
          const currentRank = markRecord?.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank;

          // Rebuild detail_marks from stored details
          const detail_marks: { [detailId: number]: number } = {};
          if (markRecord?.details && markRecord.details.length > 0) {
            markRecord.details.forEach((d: any) => {
              if (d.ctw_results_module_estimated_marks_details_id) {
                detail_marks[d.ctw_results_module_estimated_marks_details_id] = parseFloat(d.marks || 0);
              }
            });
          }

          return {
            cadet_id: cadetId,
            cadet_number: markRecord?.cadet?.cadet_number || "",
            cadet_name: markRecord?.cadet?.name || "Unknown",
            cadet_rank: currentRank?.short_name || currentRank?.name || "Officer Cadet",
            branch: markRecord?.cadet?.assigned_branchs?.find((ab: any) => ab.is_current)?.branch?.name || markRecord?.cadet?.assigned_branchs?.[0]?.branch?.name || "N/A",
            mark: markRecord?.achieved_mark || "",
            detail_marks: detail_marks,
            is_active: markRecord?.is_active ?? true,
          };
        });
        setCadetRows(rows);
      }
    }
  }, [initialData]);

  // Fetch generated marks from dt_assessment + pf_assessment when course/semester change
  useEffect(() => {
    const hasAnyGenerated = estimatedMarks.some((em: any) =>
      em.details?.some((d: any) => d.is_generated)
    );

    if (!formData.course_id || !formData.semester_id || !hasAnyGenerated) {
      setGeneratedCadetMarks(new Map());
      setGeneratedConfig({ dt_conversation_mark: 0, pf_conversation_mark: 0 });
      return;
    }

    const fetchGeneratedMarks = async () => {
      try {
        setLoadingGeneratedMarks(true);
        const response = await ctwDtAssessmentResultService.getAssessmentObservationDtPf({
          course_id: formData.course_id,
          semester_id: formData.semester_id,
        });

        const marksMap = new Map<number, { dt_achieved: number; pf_achieved: number; total_achieved: number; avg_achieved: number; dt_converted: number; pf_converted: number; combined_converted: number; dt_estimated_per_instructor: number; dt_conversation_mark: number; pf_estimated_per_instructor: number; pf_conversation_mark: number; dt_days: number; pf_days: number }>();
        response.data.forEach((row: any) => {
          marksMap.set(row.cadet_id, {
            dt_estimated_per_instructor: response.dt_estimated_per_instructor,
            dt_conversation_mark: response.dt_conversation_mark,
            pf_estimated_per_instructor: response.pf_estimated_per_instructor,
            pf_conversation_mark: response.pf_conversation_mark,
            dt_achieved: row.dt_achieved,
            pf_achieved: row.pf_achieved,
            total_achieved: row.total_achieved,
            avg_achieved: row.avg_achieved,
            dt_converted: row.dt_converted,
            pf_converted: row.pf_converted,
            combined_converted: row.combined_converted,
            dt_days: row.dt_days || 0,
            pf_days: row.pf_days || 0,
          });
        });

        setGeneratedCadetMarks(marksMap);
        console.log("Generated Cadet Marks Map:", Array.from(marksMap.entries()).slice(0, 3));
        setGeneratedConfig({
          dt_conversation_mark: response.dt_conversation_mark || 0,
          pf_conversation_mark: response.pf_conversation_mark || 0,
        });
      } catch (err) {
        console.error("Failed to fetch generated marks:", err);
        setGeneratedCadetMarks(new Map());
        setGeneratedConfig({ dt_conversation_mark: 0, pf_conversation_mark: 0 });
      } finally {
        setLoadingGeneratedMarks(false);
      }
    };

    fetchGeneratedMarks();
  }, [formData.course_id, formData.semester_id, estimatedMarks]);

  // Apply generated marks into cadet rows whenever they load or generated marks update
  useEffect(() => {
    console.log("=== GSTO Generated Marks Effect Triggered ===", {
      estimatedMarksCount: estimatedMarks.length,
      examTypeId: formData.exam_type_id,
      generatedCadetMarksSize: generatedCadetMarks.size,
    });
    
    const selectedEM = estimatedMarks.find((em: any) => em.exam_type_id === formData.exam_type_id);
    console.log("selectedEM:", selectedEM);
    if (!selectedEM?.details) {
      console.log("No selectedEM or details - returning");
      return;
    }

    const generatedDetails = selectedEM.details.filter((d: any) => d.is_generated);
    console.log("generatedDetails:", generatedDetails);
    if (generatedDetails.length === 0 || generatedCadetMarks.size === 0) {
      console.log("No generatedDetails or cadet marks - returning");
      return;
    }

    setCadetRows(prev => {
      if (prev.length === 0) return prev;
      return prev.map(cadet => {
        const updatedBreakdown = { ...cadet.detail_marks };
        let hasChange = false;

        generatedDetails.forEach((d: any) => {
          const genData = generatedCadetMarks.get(cadet.cadet_id);
          const maleMark = parseFloat(d.male_marks) || 0;
          
          const dtAchieved = genData?.dt_achieved || 0;
          const pfAchieved = genData?.pf_achieved || 0;
          const dtEstimated = genData?.dt_estimated_per_instructor || 100;
          const pfEstimated = genData?.pf_estimated_per_instructor || 100;
          let dtDays = genData?.dt_days || 0;
          let pfDays = genData?.pf_days || 0;
          
          // If days are 0, derive from achieved/estimated
          if (dtDays === 0 && dtEstimated > 0 && dtAchieved > 0) {
            dtDays = Math.round(dtAchieved / dtEstimated);
          }
          if (pfDays === 0 && pfEstimated > 0 && pfAchieved > 0) {
            pfDays = Math.round(pfAchieved / pfEstimated);
          }
          
          const dtMax = dtDays * dtEstimated; // days × estimated per day
          const pfMax = pfDays * pfEstimated; // days × estimated per day
          const conversationLimit = 70;
          
          const dtPercentage = dtMax > 0 ? (dtAchieved / dtMax) * 100 : 0;
          const pfPercentage = pfMax > 0 ? (pfAchieved / pfMax) * 100 : 0;
          const avgPercentage = (dtPercentage + pfPercentage) / 2;
          let genMark = (avgPercentage / conversationLimit) * maleMark;
          
          // Cap at male_marks max value
          if (genMark > maleMark) {
            genMark = maleMark;
          }


          if (updatedBreakdown[d.id] === undefined || Math.abs((updatedBreakdown[d.id] || 0) - genMark) > 0.01) {
            updatedBreakdown[d.id] = genMark;
            hasChange = true;
          }
        });

        if (!hasChange) return cadet;

        const newTotal = Object.values(updatedBreakdown).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
        
        console.log(`Cadet ${cadet.cadet_id} - Final:`, {
          detail_marks: updatedBreakdown,
          mark: newTotal
        });
        
        return { ...cadet, detail_marks: updatedBreakdown, mark: newTotal };
      });
    });
  }, [generatedCadetMarks, formData.exam_type_id, estimatedMarks, cadetRows.length, formData.course_id, formData.semester_id]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailMarkChange = (cadetIndex: number, detailId: number, value: number | "") => {
    setCadetRows(prev => {
      const updated = [...prev];
      const cadet = { ...updated[cadetIndex] };
      const detailMarks = { ...cadet.detail_marks };

      detailMarks[detailId] = value;
      cadet.detail_marks = detailMarks;

      cadet.mark = Object.values(detailMarks).reduce((sum: number, val) => sum + (Number(val) || 0), 0);

      updated[cadetIndex] = cadet;
      return updated;
    });
  };

  const handleCadetChange = (cadetIndex: number, field: string, value: any) => {
    setCadetRows(prev => {
      const updated = [...prev];
      updated[cadetIndex] = { ...updated[cadetIndex], [field]: value };
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
        const details = (activeEstimatedMark?.details || []).map((d: any) => ({
          ctw_results_module_estimated_marks_details_id: d.id,
          marks: c.detail_marks[d.id] || 0,
        }));
        marks.push({
          cadet_id: c.cadet_id,
          achieved_mark: c.mark || 0,
          details: details,
        });
      });

      const submitData = {
        course_id: formData.course_id,
        semester_id: formData.semester_id,
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
    <>
      <Modal isOpen={errorModal.open} onClose={() => setErrorModal({ open: false, message: "" })} className="max-w-md mx-4 p-6">
        <div className="flex flex-col items-center text-center gap-4 pt-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <Icon icon="hugeicons:alert-circle" className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Submission Failed</h3>
            <p className="text-sm text-gray-600">{errorModal.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorModal({ open: false, message: "" })}
            className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium text-sm"
          >
            OK
          </button>
        </div>
      </Modal>

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
              {!!formData.course_id && !!formData.semester_id && !loadingEstimatedMarks && (
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
            {loadingCadets && <Icon icon="hugeicons:fan-01" className="w-5 h-5 animate-spin text-blue-500" />}
          </h3>

          {!filtersSelected ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
              <p>Please select Course, Semester, and Exam Type to load cadets</p>
            </div>
          ) : loadingCadets ? (
            <div className="w-full min-h-[20vh] flex items-center justify-center">
              <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
            </div>
          ) : !moduleAssigned ? (
            <div className="text-center py-12 text-red-500">
              <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-2" />
              <p className="font-medium">You are not assigned to the GSTO Assessment Observation module for the selected course & semester.</p>
              <p className="text-sm text-gray-500 mt-1">Please contact admin to assign you to this module.</p>
            </div>
          ) : cadetRows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:user-group" className="w-10 h-10 mx-auto mb-2" />
              <p>No cadets found for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>Sl</th>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>BD No.</th>
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={2}>Rank</th>
                    <th className="border border-black px-2 py-2 text-left align-middle min-w-[140px]" rowSpan={2}>Name</th>
                    <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={2}>Branch</th>

                    {assessmentDetails.length > 0 ? (
                      <>
                        {assessmentDetails.map((d: any) => (
                          <th key={d.id} className="border border-black px-1 py-1 text-center align-middle font-semibold max-w-[70px]">
                            {d.name}
                          </th>
                        ))}
                        <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>
                          Total - {maxDetailTotal}
                        </th>
                        <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>
                          NCO - {Number(generatedConfig.dt_conversation_mark || 0) + Number(generatedConfig.pf_conversation_mark || 0)}
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="border border-black px-2 py-2 text-center align-middle">Mark</th>
                        <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={2}>Total</th>
                      </>
                    )}
                  </tr>
                  <tr>
                    {assessmentDetails.length > 0 ? (
                      assessmentDetails.map((d: any) => (
                        <th key={d.id} className="border border-black px-1 py-1 text-center text-gray-600">
                          {getDetailMaxMark(d)}
                        </th>
                      ))
                    ) : (
                      <th className="border border-black px-2 py-1 text-center">N/A</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {cadetRows.map((cadet, index) => {
                    const cadetDetailTotal: number = getCadetDetailTotal(cadet);
                    const cadetTotal = assessmentDetails.length > 0 ? cadetDetailTotal : cadet.mark;
                    return (
                      <tr key={cadet.cadet_id}>
                        <td className="border border-black px-2 py-1 text-center font-medium">{index + 1}</td>
                        <td className="border border-black px-2 py-1 text-center font-mono">{cadet.cadet_number}</td>
                        <td className="border border-black px-2 py-1 text-center">{cadet.cadet_rank}</td>
                        <td className="border border-black px-2 py-1 font-medium">{cadet.cadet_name}</td>
                        <td className="border border-black px-2 py-1">{cadet.branch}</td>

                        {assessmentDetails.length > 0 ? (
                          <>
                            {assessmentDetails.map((d: any) => (
                              <td key={d.id} className="border border-black px-1 py-1 text-center">
                                {d.is_generated ? (
                                  <div className="flex flex-col items-center gap-0.5">
                                    {cadet.detail_marks[d.id] ? parseFloat(cadet.detail_marks[d.id].toString()).toFixed(2) : "-"}
                                  </div>
                                ) : (
                                  <input
                                    type="number"
                                    min={0}
                                    max={getDetailMaxMark(d) || undefined}
                                    step={0.01}
                                    value={cadet.detail_marks[d.id] ?? ""}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      if (v === "") { handleDetailMarkChange(index, d.id, ""); return; }
                                      const parsed = parseFloat(v);
                                      const maxMark = getDetailMaxMark(d);
                                      const clamped = maxMark > 0 && !isNaN(parsed) && parsed > maxMark ? maxMark : parsed;
                                      handleDetailMarkChange(index, d.id, isNaN(clamped) ? "" : clamped);
                                    }}
                                    className="w-14 px-1 py-0.5 border border-gray-300 rounded text-center text-xs focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                                  />
                                )}
                              </td>
                            ))}
                            <td className="border border-black px-2 py-1 text-center font-bold">{cadetDetailTotal > 0 ? cadetDetailTotal.toFixed(2) : "-"}</td>
                            <td className="border border-black px-2 py-1 text-center font-bold">
                              {(generatedCadetMarks.get(cadet.cadet_id)?.combined_converted || 0).toFixed(2) || "-"}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="border border-black px-1 py-1 text-center">
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={cadet.mark}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  handleCadetChange(index, "mark", v === "" ? "" : parseFloat(v));
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-xs focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                              />
                            </td>
                            <td className="border border-black px-2 py-1 text-center font-bold">
                              {cadet.mark !== "" ? Number(cadet.mark).toFixed(2) : "-"}
                            </td>
                          </>
                        )}
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
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 font-bold" disabled={loading}>
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Result" : "Save Result")}
        </button>
      </div>
    </form>
    </>
  );
}
