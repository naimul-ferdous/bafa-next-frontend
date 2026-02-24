/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Label from "@/components/form/Label";
import { commonService } from "@/libs/services/commonService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import { ctwDtAssessmentResultService } from "@/libs/services/ctwDtAssessmentResultService";
import { useAuth } from "@/libs/hooks/useAuth";
import { Icon } from "@iconify/react";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup, SystemExam } from "@/libs/types/system";
import type { CadetProfile } from "@/libs/types/user";

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
  mark: number;
  marks_breakdown: { [key: number]: number };
  is_active: boolean;
}

const GSTO_ASSESSMENT_MODULE_CODE = "gsto_assessment";

export default function GstoAssessmentResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const { user, userIsSuperAdmin, userIsSystemAdmin } = useAuth();
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
  const [allCadets, setAllCadets] = useState<CadetProfile[]>([]);
  const [estimatedMarks, setEstimatedMarks] = useState<any[]>([]);
  const [moduleId, setModuleId] = useState<number>(0);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingEstimatedMarks, setLoadingEstimatedMarks] = useState(false);
  const [generatedCadetMarks, setGeneratedCadetMarks] = useState<Map<number, {dt_estimated_per_instructor:number; dt_conversation_mark:number; pf_estimated_per_instructor:number; pf_conversation_mark:number; dt_achieved: number; pf_achieved: number; total_achieved: number; avg_achieved: number; dt_converted: number; pf_converted: number; combined_converted: number }>>(new Map());
  const [generatedConfig, setGeneratedConfig] = useState({ dt_conversation_mark: 0, pf_conversation_mark: 0 });
  const [loadingGeneratedMarks, setLoadingGeneratedMarks] = useState(false);

  // Load dropdown data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingInitial(true);
        const [options, modulesRes] = await Promise.all([
          commonService.getResultOptions(),
          ctwResultsModuleService.getAllModules({ per_page: 100 }),
        ]);

        if (options) {
          setCourses(options.courses.filter(c => c.is_active));
          setSemesters(options.semesters.filter(s => s.is_active && s.is_gst));
          setPrograms(options.programs.filter(p => p.is_active));
          setBranches(options.branches.filter(b => b.is_active));
          setGroups(options.groups.filter(g => g.is_active));
          setExams(options.exams.filter(e => e.is_active));
          setAllCadets(options.cadets);
        }

        const foundModule = modulesRes.data.find((m: any) => m.code === GSTO_ASSESSMENT_MODULE_CODE);
        if (foundModule) {
          setModuleId(foundModule.id);
        }
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitialData();
  }, []);

  // Filtered cadets based on course, semester, and user's wing/subwing assignments
  const filteredCadets = useMemo(() => {
    if (!formData.course_id || !formData.semester_id || !formData.exam_type_id) return [];
    
    // Get user's assigned wings and subwings
    const userWingIds = user?.roleAssignments?.map(ra => ra.wing_id).filter(id => id != null) || [];
    const userSubWingIds = user?.roleAssignments?.map(ra => ra.sub_wing_id).filter(id => id != null) || [];
    const isRestricted = !userIsSuperAdmin && !userIsSystemAdmin;

    return allCadets.filter(cadet => {
      // Basic Course/Semester filtering
      const hasCourse = cadet.assigned_courses?.some(ac => ac.course_id === formData.course_id);
      const hasSemester = cadet.assigned_semesters?.some(as => as.semester_id === formData.semester_id);
      
      if (!hasCourse || !hasSemester) return false;

      // Optional filters
      if (formData.program_id && !cadet.assigned_programs?.some(ap => ap.program_id === formData.program_id)) return false;
      if (formData.branch_id && !cadet.assigned_branchs?.some(ab => ab.branch_id === formData.branch_id)) return false;
      if (formData.group_id && !cadet.assigned_groups?.some(ag => ag.group_id === formData.group_id)) return false;

      // Wing/Subwing restriction
      if (isRestricted) {
        const matchesWing = cadet.assigned_wings?.some(aw => userWingIds.includes(aw.wing_id));
        const matchesSubWing = userSubWingIds.length > 0 
          ? cadet.assigned_sub_wings?.some(asw => userSubWingIds.includes(asw.sub_wing_id))
          : true;

        return matchesWing && matchesSubWing;
      }

      return true;
    });
  }, [allCadets, formData.course_id, formData.semester_id, formData.exam_type_id, formData.program_id, formData.branch_id, formData.group_id, user, userIsSuperAdmin, userIsSystemAdmin]);

  // Sync cadet rows when filtered cadets change
  useEffect(() => {
    if (isEdit || initialData) return;

    const rows: CadetRow[] = filteredCadets.map(cadet => {
      const currentRank = cadet.rank;
      return {
        cadet_id: cadet.id,
        cadet_number: cadet.cadet_number || cadet.bd_no || "",
        cadet_name: cadet.name,
        cadet_rank: currentRank?.short_name || currentRank?.name || "Officer Cadet",
        branch: cadet.assigned_branchs?.find((ab: any) => ab.is_current)?.branch?.name || cadet.assigned_branchs?.[0]?.branch?.name || "N/A",
        mark: 0,
        marks_breakdown: {},
        is_active: true,
      };
    });

    setCadetRows(rows);
  }, [filteredCadets, isEdit, initialData]);

  useEffect(() => {
    const loadEstimatedMarks = async () => {
      if (!moduleId || !formData.course_id || !formData.semester_id) {
        setEstimatedMarks([]);
        return;
      }

      try {
        setLoadingEstimatedMarks(true);
        const response = await ctwResultsModuleService.getEstimatedMarks(moduleId, {
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
  }, [moduleId, formData.course_id, formData.semester_id]);

  const hasEstimatedMark = (examTypeId: number): boolean => {
    return estimatedMarks.some((em: any) => em.exam_type_id === examTypeId);
  };

  const getMaxMark = (): number => {
    if (!formData.exam_type_id) return 0;
    const em = estimatedMarks.find((em: any) => em.exam_type_id === formData.exam_type_id);
    return em?.estimated_mark_per_instructor || em?.estimated_mark || em?.mark || 0;
  };

  const getConversationMark = (): number => {
    if (!formData.exam_type_id) return 0;
    const em = estimatedMarks.find((em: any) => em.exam_type_id === formData.exam_type_id);
    return em?.conversation_mark || em?.mark || 0;
  };

  const maxMark = getMaxMark();
  const convMark = getConversationMark();
  const selectedEM = estimatedMarks.find((em: any) => em.exam_type_id === formData.exam_type_id);

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
        const uniqueCadets = Array.from(new Set(initialData.achieved_marks.map((m: any) => m.cadet_id))) as number[];
        const rows: CadetRow[] = uniqueCadets.map(cadetId => {
          const mark = initialData.achieved_marks?.find((m: any) => m.cadet_id === cadetId);
          const currentRank = mark?.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank;

          const marksBreakdown: { [key: number]: number } = {};
          if (mark?.details && mark.details.length > 0) {
            mark.details.forEach((d: any) => {
              if (d.ctw_results_module_estimated_marks_details_id) {
                marksBreakdown[d.ctw_results_module_estimated_marks_details_id] = parseFloat(d.marks || 0);
              }
            });
          }

          return {
            cadet_id: cadetId,
            cadet_number: mark?.cadet?.cadet_number || "",
            cadet_name: mark?.cadet?.name || "Unknown",
            cadet_rank: currentRank?.short_name || currentRank?.name || "Officer Cadet",
            branch: initialData.branch?.name || "N/A",
            mark: mark?.achieved_mark || 0,
            marks_breakdown: marksBreakdown,
            is_active: mark?.is_active || true,
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

        const marksMap = new Map<number, { dt_achieved: number; pf_achieved: number; total_achieved: number; avg_achieved: number; dt_converted: number; pf_converted: number; combined_converted: number; dt_estimated_per_instructor: number; dt_conversation_mark: number; pf_estimated_per_instructor: number; pf_conversation_mark: number }>();
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
          });
        });

        setGeneratedCadetMarks(marksMap);
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
    const selectedEM = estimatedMarks.find((em: any) => em.exam_type_id === formData.exam_type_id);
    if (!selectedEM?.details) return;

    const generatedDetails = selectedEM.details.filter((d: any) => d.is_generated);
    if (generatedDetails.length === 0 || generatedCadetMarks.size === 0) return;

    setCadetRows(prev => {
      if (prev.length === 0) return prev;
      return prev.map(cadet => {
        const updatedBreakdown = { ...cadet.marks_breakdown };
        let hasChange = false;

        generatedDetails.forEach((d: any) => {
          const genData = generatedCadetMarks.get(cadet.cadet_id);
          const avgAchieved = genData?.avg_achieved || 0;
          const conversationMark = parseFloat(selectedEM.conversation_mark) || 1;
          const maleMark = parseFloat(d.male_marks) || 0;

          const genMark = parseFloat(((avgAchieved / conversationMark) * maleMark).toFixed(2));

          if (updatedBreakdown[d.id] !== genMark) {
            updatedBreakdown[d.id] = genMark;
            hasChange = true;
          }
        });

        if (!hasChange) return cadet;

        const newTotal = Object.values(updatedBreakdown).reduce((sum, val) => sum + (val || 0), 0);
        return { ...cadet, marks_breakdown: updatedBreakdown, mark: newTotal };
      });
    });
  }, [generatedCadetMarks, formData.exam_type_id, estimatedMarks, cadetRows.length]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBreakdownChange = (cadetIndex: number, detailId: number, value: number, maxDetailMark: number) => {
    setCadetRows(prev => {
      const updated = [...prev];
      const cadet = { ...updated[cadetIndex] };
      const breakdown = { ...cadet.marks_breakdown };

      let finalValue = value;
      if (maxDetailMark > 0 && value > maxDetailMark) {
        finalValue = maxDetailMark;
      }

      breakdown[detailId] = finalValue;
      cadet.marks_breakdown = breakdown;

      // Recalculate total mark
      cadet.mark = Object.values(breakdown).reduce((sum, val) => sum + (val || 0), 0);

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
      const marks: any[] = [];
      cadetRows.filter(c => c.cadet_id > 0).forEach(c => {
        const details = (selectedEM?.details || []).map((d: any) => ({
          ctw_results_module_estimated_marks_details_id: d.id,
          marks: c.marks_breakdown[d.id] || 0,
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

  if (loadingInitial) {
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
          </h3>

          {!filtersSelected ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
              <p>Please select Course, Semester, and Exam Type to load cadets</p>
            </div>
          ) : cadetRows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:user-group" className="w-10 h-10 mx-auto mb-2" />
              <p>No cadets found for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Sl</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>BD No.</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Rank</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={2}>Name</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={2}>Branch</th>
                    {selectedEM?.details?.map((d: any) => (
                      <th
                        key={d.id}
                        className={`border border-black px-2 py-2 text-start`}
                        style={{ minWidth: '40px', maxWidth: '100px' }}
                        rowSpan={2}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className="font-semibold"
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '150px' }}
                          >
                            {d.name} - {d.male_marks}
                          </span>
                        </div>
                      </th>
                    ))}

                    <th
                      className={`border border-black px-2 py-2 text-start`}
                      style={{ minWidth: '40px', maxWidth: '100px' }}
                      rowSpan={2}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="font-semibold"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '150px' }}
                        >Total - {selectedEM?.details?.reduce((sum: any, d: any) => sum + parseFloat(d.male_marks || 0), 0)}</span>
                      </div>
                    </th>
                    <th
                      className={`border border-black px-2 py-2 text-start`}
                      style={{ minWidth: '40px', maxWidth: '100px' }}
                      rowSpan={2}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="font-semibold"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '150px' }}
                        >NCO Instr Assessment - {generatedConfig.dt_conversation_mark + generatedConfig.pf_conversation_mark}</span>
                      </div>
                    </th>
                    <th className="border border-black px-3 py-2 text-center">Total OA</th>

                  </tr>
                  <tr>
                    <th className="border border-black px-3 py-2 text-center">
                      {selectedEM?.details?.reduce((sum: any, d: any) => sum + parseFloat(d.male_marks || 0), 0) + generatedConfig.dt_conversation_mark + generatedConfig.pf_conversation_mark}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cadetRows.map((cadet, index) => (
                    <tr key={cadet.cadet_id} className="hover:bg-gray-50">
                      <td className="border border-black px-3 py-2 text-center font-medium">{index + 1}</td>
                      <td className="border border-black px-3 py-2 text-center font-mono">{cadet.cadet_number}</td>
                      <td className="border border-black px-3 py-2 text-center">{cadet.cadet_rank}</td>
                      <td className="border border-black px-3 py-2 font-medium">{cadet.cadet_name}</td>
                      <td className="border border-black px-3 py-2">{cadet.branch}</td>

                      {selectedEM?.details?.map((d: any) => (
                        <td key={d.id} className="border border-black px-2 py-1 text-center" style={{ minWidth: '40px', maxWidth: '100px' }}>
                          {d.is_generated ? (
                            <div className="flex flex-col items-center gap-0.5">
                              {(((generatedCadetMarks.get(cadet.cadet_id)?.avg_achieved || 0) / (parseFloat(selectedEM?.conversation_mark) || 1)) * (parseFloat(d.male_marks) || 0)).toFixed(2)}
                            </div>
                          ) : (
                            <input
                              type="number"
                              min={0}
                              max={parseFloat(d.male_marks) || undefined}
                              step={0.01}
                              value={cadet.marks_breakdown[d.id] || 0}
                              onChange={(e) => handleBreakdownChange(index, d.id, parseFloat(e.target.value) || 0, parseFloat(d.male_marks) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          )}
                        </td>
                      ))}

                      <td className="border border-black px-3 py-2 text-center font-bold">
                        {cadet.mark.toFixed(2)}
                      </td>

                      <td className="border border-black px-3 py-2 text-center font-bold">
                        {(generatedCadetMarks.get(cadet.cadet_id)?.combined_converted || 0).toFixed(2) || "N/A"}
                      </td>

                      <td className="border border-black px-3 py-2 text-center">
                        {(cadet.mark + (generatedCadetMarks.get(cadet.cadet_id)?.combined_converted || 0)).toFixed(2)}
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
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 font-bold" disabled={loading}>
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Result" : "Save Result")}
        </button>
      </div>
    </form>
  );
}