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
import type { CtwOneMileResult } from "@/libs/types/ctwOneMile";

interface ResultFormProps {
  initialData?: CtwOneMileResult | null;
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
  cadet_gender?: string;
  branch: string;
  practices: { [key: number]: number };
  avg_practice: number;
  conv_practice: number;
  test_mark: number;
  conv_exam: number;
  mark: number;
  is_active: boolean;
}

const ONE_MILE_MODULE_CODE = "one_mile";

export default function OneMileResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
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

  // Dropdown data
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [estimatedMarks, setEstimatedMarks] = useState<any[]>([]);
  const [oneMileModule, setOneMileModule] = useState<any>(null);
  const [oneMileModuleId, setOneMileModuleId] = useState<number>(0);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [loadingEstimatedMarks, setLoadingEstimatedMarks] = useState(false);
  const [moduleAssigned, setModuleAssigned] = useState(false);

  // Load dropdown data + find one mile module
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

        // Find one mile module
        const moduleData = modulesRes.data.find((m: any) => m.code === ONE_MILE_MODULE_CODE);
        if (moduleData) {
          setOneMileModule(moduleData);
          setOneMileModuleId(moduleData.id);
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

  // Load estimated marks from DB when course + semester are selected
  useEffect(() => {
    const loadEstimatedMarks = async () => {
      if (!oneMileModuleId || !formData.course_id || !formData.semester_id) {
        setEstimatedMarks([]);
        return;
      }

      try {
        setLoadingEstimatedMarks(true);
        const response = await ctwResultsModuleService.getEstimatedMarks(oneMileModuleId, {
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
  }, [oneMileModuleId, formData.course_id, formData.semester_id]);

  // Check if exam type exists in the fetched estimated marks
  const hasEstimatedMark = (examTypeId: number): boolean => {
    return estimatedMarks.some((em: any) => em.exam_type_id === examTypeId);
  };

  // Get estimated mark value for the selected exam type
  const getEstimatedMarkInfo = () => {
    if (!formData.exam_type_id) return null;
    return estimatedMarks.find((em: any) => em.exam_type_id === formData.exam_type_id);
  };

  const estimatedMarkInfo = getEstimatedMarkInfo();
  const maxTestMark = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.estimated_mark_per_instructor || estimatedMarkInfo.mark || 0) : 0;
  const conversationMark = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.conversation_mark || 0) : 0;
  const practiceCount = estimatedMarkInfo ? parseInt(estimatedMarkInfo.practice_count || 0) : 0;
  const convPracticeWeight = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.convert_of_practice || 0) : 0;
  const convExamWeight = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.convert_of_exam || 0) : 0;

  // Auto-load cadets from ctw_instructor_assign_cadets after exam type selected
  useEffect(() => {
    const loadCadets = async () => {
      if (!user?.id || !oneMileModuleId || !formData.course_id || !formData.semester_id || !formData.exam_type_id) {
        setCadetRows([]);
        setModuleAssigned(false);
        return;
      }

      try {
        setLoadingCadets(true);

        const moduleAssignRes = await ctwInstructorAssignModuleService.getAll({
          instructor_id: user.id,
          module_code: ONE_MILE_MODULE_CODE,
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
          ctw_results_module_id: oneMileModuleId,
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
              cadet_rank: currentRank?.short_name || currentRank?.name || "-",
              cadet_gender: cadet.gender,
              branch: cadet.assigned_branchs?.find((ab: any) => ab.is_current)?.branch?.name || cadet.assigned_branchs?.[0]?.branch?.name || "N/A",
              practices: {},
              avg_practice: 0,
              conv_practice: 0,
              test_mark: 0,
              conv_exam: 0,
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
  }, [user?.id, oneMileModuleId, formData.course_id, formData.semester_id, formData.program_id, formData.branch_id, formData.group_id, formData.exam_type_id, initialData]);

  // Populate form with initial data
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
        setModuleAssigned(true); // Module is assigned if initial data exists
        const uniqueCadets = Array.from(new Set(initialData.achieved_marks.map(m => m.cadet_id)));
        const rows: CadetRow[] = uniqueCadets.map(cadetId => {
          const mark = initialData.achieved_marks?.find(m => m.cadet_id === cadetId);
          const currentRank = mark?.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank;

          const test_mark = parseFloat(String(mark?.achieved_mark || 0)); // Raw exam mark is now in achieved_mark

          const practices: { [key: number]: number } = {};
          let pIdx = 1;
          let practicesTotalForAvg = 0;
          let practicesCountForAvg = 0;


          if (mark?.details) {
            mark.details.forEach(det => {
              if (det.practices_marks !== null && det.practices_marks !== undefined) {
                const practiceVal = parseFloat(String(det.practices_marks));
                practices[pIdx] = practiceVal;
                practicesTotalForAvg += practiceVal;
                practicesCountForAvg++;
                pIdx++;
              }
              // marks in details are no longer used for exam mark
            });
          }
          const avg_practice = practicesCountForAvg > 0 ? practicesTotalForAvg / practicesCountForAvg : 0;

          const row: CadetRow = {
            cadet_id: cadetId,
            cadet_number: mark?.cadet?.cadet_number || "",
            cadet_name: mark?.cadet?.name || "Unknown",
            cadet_rank: currentRank?.short_name || currentRank?.name || "-",
            cadet_gender: mark?.cadet?.gender,
            branch: initialData.branch?.name || "N/A",
            practices: practices, // Assign the correctly populated practices object
            avg_practice: avg_practice,
            conv_practice: 0,
            test_mark: test_mark,
            conv_exam: 0,
            mark: 0, // Initialize to 0, updateCalculatedMarks will set the correct total
            is_active: mark?.is_active || true,
          };

          return updateCalculatedMarks(row);
        });
        setCadetRows(rows);
      }
    }
  }, [initialData, oneMileModule]); // Added oneMileModule dependency to ensure calculations run when module data is available

  const updateCalculatedMarks = (cadet: CadetRow): CadetRow => {
    // 1. Calculate Average Practice Mark
    let totalPracticeMark = 0;
    let actualCount = 0;
    for (let i = 1; i <= practiceCount; i++) {
      if (cadet.practices[i] !== undefined && !isNaN(cadet.practices[i])) {
        totalPracticeMark += cadet.practices[i];
        actualCount++;
      }
    }
    const avgPractice = actualCount > 0 ? totalPracticeMark / actualCount : cadet.avg_practice;

    // 2. Convert Practice: (AvgPractice * Weight / 100)
    const conv_practice = (avgPractice * convPracticeWeight) / 100;

    // 3. Convert Exam: (TestMark * Weight / 100)
    const conv_exam = (cadet.test_mark * convExamWeight) / 100;
    
    // 4. Final Total
    let finalMark = conv_practice + conv_exam;
    
    // Cap by conversationMark if defined
    if (conversationMark > 0 && finalMark > conversationMark) {
      finalMark = conversationMark;
    }
    
    return {
      ...cadet,
      avg_practice: parseFloat(avgPractice.toFixed(2)),
      conv_practice: parseFloat(conv_practice.toFixed(2)),
      conv_exam: parseFloat(conv_exam.toFixed(2)),
      mark: parseFloat(finalMark.toFixed(2))
    };
  };

  const handlePracticeChange = (cadetIndex: number, practiceIndex: number, value: number) => {
    setCadetRows(prev => {
      const updated = [...prev];
      updated[cadetIndex].practices = { ...updated[cadetIndex].practices, [practiceIndex]: value };
      updated[cadetIndex] = updateCalculatedMarks(updated[cadetIndex]);
      return updated;
    });
  };

  const handleTestMarkChange = (cadetIndex: number, value: number) => {
    let finalValue = value;
    if (maxTestMark > 0 && finalValue > maxTestMark) finalValue = maxTestMark;

    setCadetRows(prev => {
      const updated = [...prev];
      updated[cadetIndex].test_mark = finalValue;
      updated[cadetIndex] = updateCalculatedMarks(updated[cadetIndex]);
      return updated;
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // const handleCadetChange = (cadetIndex: number, field: keyof CadetRow, value: any) => {
  //   setCadetRows(prev => {
  //     const updated = [...prev];
  //     let finalValue = value;
  //     if (field === "mark" && conversationMark > 0 && typeof value === "number" && value > conversationMark) {
  //       finalValue = conversationMark;
  //     }
  //     updated[cadetIndex] = {
  //       ...updated[cadetIndex],
  //       [field]: finalValue
  //     };
  //     return updated;
  //   });
  // };

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
        
        // Add each practice as a separate row in details
        Object.values(c.practices).forEach(val => {
          details.push({
            practices_marks: val,
            ctw_results_module_estimated_marks_details_id: estimatedMarkInfo?.details?.[0]?.id
          });
        });

        marks.push({
          cadet_id: c.cadet_id,
          achieved_mark: c.test_mark || 0, // Now storing raw exam mark here
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
        ctw_results_module_id: oneMileModuleId,
        remarks: formData.remarks || undefined,
        is_active: formData.is_active,
        marks: marks,
      };
      console.log("Submitting data:", submitData);
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
              <p className="font-medium">You are not assigned to the One Mile module for the selected course & semester.</p>
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
                    <th className="border border-black px-3 py-2 text-center text-sm whitespace-nowrap" rowSpan={2}>SL</th>
                    <th className="border border-black px-3 py-2 text-center text-sm whitespace-nowrap" rowSpan={2}>BD No.</th>
                    <th className="border border-black px-3 py-2 text-center text-sm whitespace-nowrap" rowSpan={2}>Rank</th>
                    <th className="border border-black px-3 py-2 text-left text-sm whitespace-nowrap" rowSpan={2}>Name</th>
                    <th className="border border-black px-3 py-2 text-left text-sm whitespace-nowrap" rowSpan={2}>Branch</th>
                    {practiceCount > 0 && (
                      <th className="border border-black px-3 py-2 text-center text-sm" colSpan={practiceCount}>Practices</th>
                    )}
                    <th className="border border-black px-3 py-2 text-center text-sm whitespace-nowrap" rowSpan={2}>Avg. <br/> Practice</th>
                    <th className="border border-black px-3 py-2 text-center text-sm whitespace-nowrap" rowSpan={2}>Exam <br/> {maxTestMark > 0 ? `${maxTestMark}` : ""}</th>
                    <th className="border border-black px-3 py-2 text-center text-sm whitespace-nowrap" rowSpan={2}>Prac <br/> ({convPracticeWeight}%)</th>
                    <th className="border border-black px-3 py-2 text-center text-sm whitespace-nowrap" rowSpan={2}>Exam <br/> ({convExamWeight}%)</th>
                    <th className="border border-black px-3 py-2 text-center text-sm whitespace-nowrap" rowSpan={2}>Total</th>
                  </tr>
                  {practiceCount > 0 && (
                    <tr>
                      {Array.from({ length: practiceCount }, (_, i) => i + 1).map(p => (
                        <th key={p} className="border border-black px-3 py-2 text-center text-xs">P{p}</th>
                      ))}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {cadetRows.map((cadet, index) => (
                    <tr key={cadet.cadet_id}>
                      <td className="border border-black px-3 py-2 text-center font-medium">{index + 1}</td>
                      <td className="border border-black px-3 py-2 text-center">{cadet.cadet_number}</td>
                      <td className="border border-black px-3 py-2 text-center">{cadet.cadet_rank}</td>
                      <td className="border border-black px-3 py-2 font-medium">{cadet.cadet_name}</td>
                      <td className="border border-black px-3 py-2 font-medium">{cadet.branch}</td>
                      
                      {Array.from({ length: practiceCount }, (_, i) => i + 1).map(p => (
                        <td key={p} className="border border-black px-2 py-1 text-center">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={cadet.practices[p] || 0}
                            onChange={(e) => handlePracticeChange(index, p, parseFloat(e.target.value) || 0)}
                            className="w-16 px-1 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                        </td>
                      ))}

                      {/* Avg Practice */}
                      <td className="border border-black px-2 py-1 text-center font-medium">
                        {cadet.avg_practice}
                      </td>

                      <td className="border border-black px-2 py-1 text-center">
                        <input
                          type="number"
                          min={0}
                          max={maxTestMark > 0 ? maxTestMark : undefined}
                          step={0.01}
                          value={cadet.test_mark || 0}
                          onChange={(e) => handleTestMarkChange(index, parseFloat(e.target.value) || 0)}
                          className="w-16 px-1 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-black px-2 py-1 text-center font-semibold">
                        {cadet.conv_practice}
                      </td>
                      <td className="border border-black px-2 py-1 text-center font-semibold">
                        {cadet.conv_exam}
                      </td>
                      <td className="border border-black px-2 py-1 text-center font-semibold">
                        {cadet.mark}
                        {/* <input
                          type="number"
                          min={0}
                          max={conversationMark > 0 ? conversationMark : undefined}
                          step={0.01}
                          value={cadet.mark || 0}
                          readOnly={practiceCount > 0}
                          onChange={(e) => !practiceCount && handleCadetChange(index, "mark", parseFloat(e.target.value) || 0)}
                          className={`w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm font-bold focus:ring-2 focus:ring-blue-500 ${practiceCount > 0 ? 'bg-gray-100' : 'bg-white'}`}
                          placeholder="0"
                        /> */}
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
