/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { commonService } from "@/libs/services/commonService";
import { ctwCommonService } from "@/libs/services/ctwCommonService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import { cadetService } from "@/libs/services/cadetService";
import { ctwInstructorAssignModuleService } from "@/libs/services/ctwInstructorAssignModuleService";
import { ctwOneMilePracticeService } from "@/libs/services/ctwOneMilePracticeService";
import { useAuth } from "@/libs/hooks/useAuth";
import { Icon } from "@iconify/react";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup, SystemExam } from "@/libs/types/system";
import type { CtwOneMileResult } from "@/libs/types/ctwOneMile";
import OneMilePracticeModal from "./OneMilePracticeModal";

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
  const [oneMileModuleId, setOneMileModuleId] = useState<number>(0);
  const [oneMileModule, setOneMileModule] = useState<any>(null);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [loadingEstimatedMarks, setLoadingEstimatedMarks] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [moduleAssigned, setModuleAssigned] = useState(false);
  const [showing, setShowing] = useState<"form" | "practice">("form");

  // Practice section state
  const [practiceDate, setPracticeDate] = useState("");
  const [practiceMarks, setPracticeMarks] = useState<{ [cadetId: number]: { achieved_mark: number; remark: string } }>({});
  const [loadingPractices, setLoadingPractices] = useState(false);
  const [savingPractices, setSavingPractices] = useState(false);
  const [practiceError, setPracticeError] = useState("");
  const [practiceSuccess, setPracticeSuccess] = useState("");
  const [allPractices, setAllPractices] = useState<any[]>([]);
  const [loadingAllPractices, setLoadingAllPractices] = useState(false);
  const [practiceTab, setPracticeTab] = useState<"entry" | "history">("entry");
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [modalPracticeDate, setModalPracticeDate] = useState("");
  const [modalPracticeMarks, setModalPracticeMarks] = useState<{ [cadetId: number]: { achieved_mark: number; remark: string } }>({});
  const [bestPracticesLoaded, setBestPracticesLoaded] = useState(false);

  // Load all form options in a single API call
  useEffect(() => {
    if (!user?.id) return;

    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const options = await ctwCommonService.getOneMileFormOptions(user.id);

        if (options) {
          setCourses(options.courses);
          setPrograms(options.programs);
          setBranches(options.branches);
          setGroups(options.groups);
          setExams(options.exams);

          if (options.module) {
            setOneMileModuleId(options.module.id);
            setOneMileModule(options.module);
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

  // Load all practice records when filters are ready
  const loadAllPractices = async () => {
    if (!oneMileModuleId || !formData.course_id || !formData.semester_id || !formData.exam_type_id) {
      setAllPractices([]);
      return [];
    }
    try {
      setLoadingAllPractices(true);
      const data = await ctwOneMilePracticeService.getPractices({
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        ctw_results_module_id: oneMileModuleId,
        exam_type_id: formData.exam_type_id,
      });
      setAllPractices(data);
      return data;
    } catch {
      // ignore
    } finally {
      setLoadingAllPractices(false);
    }
    return [];
  };

  useEffect(() => {
    loadAllPractices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oneMileModuleId, formData.course_id, formData.semester_id, formData.exam_type_id]);

  // Compute best 3 practices for each cadet and update cadet rows
  useEffect(() => {
    console.log("useEffect triggered:", { cadetRowsLen: cadetRows.length, allPracticesLen: allPractices.length, loadingCadets, loadingAllPractices, practiceCount });
    if (cadetRows.length === 0 || allPractices.length === 0 || loadingCadets || loadingAllPractices) return;

    const computeBestPractices = () => {
      console.log("Computing best practices, allPractices:", allPractices.length);
      const updatedRows = cadetRows.map(cadet => {
        const cadetPractices = allPractices.filter((p: any) => p.cadet_id === cadet.cadet_id);
        if (cadetPractices.length === 0) {
          console.log(`Cadet ${cadet.cadet_id}: no practices found`);
          return { ...cadet, practices: {}, avg_practice: 0 };
        }

        // Sort by achieved_mark descending and take top 3
        // FIX: Use Number() instead of parseFloat() to handle both string and number types
        const sortedMarks = [...cadetPractices]
          .map((p) => Number(p.achieved_mark))
          .filter((m) => !isNaN(m))
          .sort((a, b) => b - a)
          .slice(0, 3);

        console.log(`Cadet ${cadet.cadet_id}: sortedMarks=`, sortedMarks);

        const bestPractices: { [key: number]: number } = {};
        sortedMarks.forEach((mark, idx) => {
          bestPractices[idx + 1] = mark;
        });

        const avgPractice = sortedMarks.length > 0
          ? sortedMarks.reduce((a, b) => a + b, 0) / sortedMarks.length
          : 0;

        console.log(`Cadet ${cadet.cadet_id}: bestPractices=`, bestPractices, ", avgPractice=", avgPractice);

        const updatedCadet = { ...cadet, practices: bestPractices, avg_practice: parseFloat(avgPractice.toFixed(2)) };
        return updateCalculatedMarks(updatedCadet, true);
      });

      console.log("Setting cadet rows with best practices");
      setCadetRows(JSON.parse(JSON.stringify(updatedRows)));
      setBestPracticesLoaded(true);
    };

    computeBestPractices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPractices, loadingAllPractices, oneMileModuleId, formData.course_id, formData.semester_id, formData.exam_type_id]);

  // Check if exam type exists in the fetched estimated marks
  const hasEstimatedMark = (examTypeId: number): boolean => {
    return estimatedMarks.some((em: any) => em.exam_type_id === examTypeId);
  };

  // Get estimated mark info for the selected exam type
  const getEstimatedMarkInfo = () => {
    if (!formData.exam_type_id) return null;
    return estimatedMarks.find((em: any) => em.exam_type_id === formData.exam_type_id);
  };

  const estimatedMarkInfo = getEstimatedMarkInfo();
  const maxTestMark = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.estimated_mark_per_instructor || estimatedMarkInfo.mark || 0) : 0;
  const conversationMark = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.conversation_mark || 0) : 0;
  const practiceCount = estimatedMarkInfo ? parseInt(estimatedMarkInfo.practice_count || 3) : 3;
  const convPracticeWeight = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.convert_of_practice || 0) : 0;
  const convExamWeight = estimatedMarkInfo ? parseFloat(estimatedMarkInfo.convert_of_exam || 0) : 0;

  // Helper to calculate total mark
  const calculateTotal = (avgPractice: number, testMark: number) => {
    const convPractice = avgPractice * convPracticeWeight / 100;
    const convExam = testMark * convExamWeight / 100;
    let total = convPractice + convExam;
    if (conversationMark > 0 && total > conversationMark) {
      total = conversationMark;
    }
    return Math.round(total * 100) / 100;
  };

  // Helper function to get best 3 practices for a cadet
  // FIX: Use Number() instead of parseFloat() to handle both string and number types
  const getBestPractices = (cadetId: number) => {
    if (!allPractices || allPractices.length === 0) return { practices: {}, avg: 0 };
    const cadetPractices = allPractices.filter((p: any) => p.cadet_id === cadetId);
    if (cadetPractices.length === 0) return { practices: {}, avg: 0 };

    const sortedMarks = [...cadetPractices]
      .map(p => Number(p.achieved_mark))
      .filter(m => !isNaN(m))
      .sort((a, b) => b - a)
      .slice(0, 3);

    const bestPractices: { [key: number]: number } = {};
    sortedMarks.forEach((mark, idx) => { bestPractices[idx + 1] = mark; });
    const avg = sortedMarks.length > 0 ? sortedMarks.reduce((a, b) => a + b, 0) / sortedMarks.length : 0;

    return { practices: bestPractices, avg: parseFloat(avg.toFixed(2)) };
  };

  // Auto-load cadets after exam type selected
  // First check if instructor is assigned to this module via ctw_instructor_assign_modules
  useEffect(() => {
    const loadCadets = async () => {
      // Required: user, module, course, semester, exam_type
      if (!user?.id || !oneMileModuleId || !formData.course_id || !formData.semester_id || !formData.exam_type_id) {
        setCadetRows([]);
        setModuleAssigned(false);
        return;
      }

      try {
        setLoadingCadets(true);

        // First check if instructor is assigned to this one_mile module
        const moduleAssignRes = await ctwInstructorAssignModuleService.getAll({
          instructor_id: user.id,
          module_code: ONE_MILE_MODULE_CODE,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          is_active: true,
        });

        if (!moduleAssignRes.data || moduleAssignRes.data.length === 0) {
          // Instructor is NOT assigned to this module
          setModuleAssigned(false);
          setCadetRows([]);
          return;
        }

        setModuleAssigned(true);

        // Fetch cadets directly by course + semester
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

          const test_mark = Number(mark?.achieved_mark || 0); // FIX: Use Number() for consistency

          const practices: { [key: number]: number } = {};
          let pIdx = 1;
          let practicesTotalForAvg = 0;
          let practicesCountForAvg = 0;

          if (mark?.details) {
            mark.details.forEach(det => {
              if (det.practices_marks !== null && det.practices_marks !== undefined) {
                const practiceVal = Number(det.practices_marks); // FIX: Use Number() for consistency
                practices[pIdx] = practiceVal;
                practicesTotalForAvg += practiceVal;
                practicesCountForAvg++;
                pIdx++;
              }
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
            practices: practices,
            avg_practice: avg_practice,
            conv_practice: 0,
            conv_exam: 0,
            test_mark: test_mark,
            mark: 0,
            is_active: mark?.is_active || true,
          };

          return updateCalculatedMarks(row);
        });
        setCadetRows(rows);
      }
    }
  }, [initialData, oneMileModule]);

  const updateCalculatedMarks = (cadet: CadetRow, skipAvgRecalc = false): CadetRow => {
    // 1. Calculate Average Practice Mark
    let totalPracticeMark = 0;
    let actualCount = 0;
    for (let i = 1; i <= practiceCount; i++) {
      if (cadet.practices[i] !== undefined && !isNaN(cadet.practices[i])) {
        totalPracticeMark += cadet.practices[i];
        actualCount++;
      }
    }
    const avgPractice = skipAvgRecalc
      ? cadet.avg_practice
      : (actualCount > 0 ? totalPracticeMark / actualCount : cadet.avg_practice);

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

  // Practice section handlers
  const handlePracticeDateChange = async (date: string) => {
    setPracticeDate(date);
    if (!date || !formData.course_id || !formData.semester_id || !oneMileModuleId) return;

    let formattedDate = date;
    const dateParts = date.split('/');
    if (dateParts.length === 3) {
      const [day, month, year] = dateParts;
      formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const dateObj = new Date(formattedDate);
      if (isNaN(dateObj.getTime())) {
        setPracticeError("Please enter a valid date."); return;
      }
    }

    try {
      setLoadingPractices(true);
      setPracticeError("");
      const existing = await ctwOneMilePracticeService.getPractices({
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        ctw_results_module_id: oneMileModuleId,
        exam_type_id: formData.exam_type_id,
        practice_date: formattedDate,
      });

      const merged: { [cadetId: number]: { achieved_mark: number; remark: string } } = {};
      cadetRows.forEach(c => {
        merged[c.cadet_id] = { achieved_mark: 0, remark: "" };
      });
      existing.forEach(p => {
        merged[p.cadet_id] = {
          achieved_mark: p.achieved_mark,
          remark: p.remark || "",
        };
      });
      setPracticeMarks(merged);
    } catch {
      setPracticeError("Failed to load existing practices for this date.");
    } finally {
      setLoadingPractices(false);
    }
  };

  const handlePracticeMarkChange = (cadetId: number, field: "achieved_mark" | "remark", value: string | number) => {
    setPracticeMarks(prev => ({
      ...prev,
      [cadetId]: {
        ...prev[cadetId],
        [field]: value,
      },
    }));
  };

  const handleSavePractices = async () => {
    setPracticeError("");
    setPracticeSuccess("");

    if (!practiceDate) { setPracticeError("Please select a practice date."); return; }
    if (!formData.course_id || !formData.semester_id) { setPracticeError("Course and semester are required."); return; }
    if (!formData.exam_type_id) { setPracticeError("Please select an exam type first."); return; }
    if (!user?.id) { setPracticeError("User session error. Please re-login."); return; }

    const practices = cadetRows.map(c => ({
      cadet_id: c.cadet_id,
      achieved_mark: practiceMarks[c.cadet_id]?.achieved_mark ?? 0,
      remark: practiceMarks[c.cadet_id]?.remark || undefined,
    }));

    try {
      setSavingPractices(true);
      await ctwOneMilePracticeService.saveBulk({
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        ctw_results_module_id: oneMileModuleId,
        exam_type_id: formData.exam_type_id,
        instructor_id: user.id,
        practice_date: practiceDate,
        practices,
      });
      setPracticeSuccess("Practices saved successfully.");
      await loadAllPractices();
    } catch (err: any) {
      setPracticeError(err.message || "Failed to save practices.");
    } finally {
      setSavingPractices(false);
    }
  };

  const openPracticeModal = () => {
    setModalPracticeDate("");
    const initial: { [cadetId: number]: { achieved_mark: number; remark: string } } = {};
    cadetRows.forEach(c => {
      initial[c.cadet_id] = { achieved_mark: 0, remark: "" };
    });
    setModalPracticeMarks(initial);
    setShowPracticeModal(true);
  };

  const handleModalPracticeMarkChange = (cadetId: number, field: "achieved_mark" | "remark", value: string | number) => {
    setModalPracticeMarks(prev => ({
      ...prev,
      [cadetId]: {
        ...prev[cadetId],
        [field]: value,
      },
    }));
  };

  const handleSaveModalPractices = async () => {
    setPracticeError("");
    setPracticeSuccess("");

    if (!modalPracticeDate) { setPracticeError("Please select a practice date."); return; }

    let formattedDate = "";

    if (modalPracticeDate.includes('/')) {
      const dateParts = modalPracticeDate.split('/');
      if (dateParts.length === 3) {
        const [day, month, year] = dateParts;
        formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        setPracticeError("Invalid date format. Use dd/mm/yyyy"); return;
      }
    } else if (modalPracticeDate.includes('-') && modalPracticeDate.length === 10) {
      formattedDate = modalPracticeDate;
    } else {
      setPracticeError("Invalid date format."); return;
    }

    const finalDateObj = new Date(formattedDate);
    if (!formattedDate || isNaN(finalDateObj.getTime())) {
      setPracticeError("Please enter a valid date."); return;
    }

    if (!formData.course_id || !formData.semester_id) { setPracticeError("Course and semester are required."); return; }
    if (!formData.exam_type_id) { setPracticeError("Please select an exam type first."); return; }
    if (!user?.id) { setPracticeError("User session error. Please re-login."); return; }

    const practices = cadetRows.map(c => ({
      cadet_id: c.cadet_id,
      achieved_mark: modalPracticeMarks[c.cadet_id]?.achieved_mark ?? 0,
      remark: modalPracticeMarks[c.cadet_id]?.remark || undefined,
    }));

    try {
      setSavingPractices(true);
      await ctwOneMilePracticeService.saveBulk({
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        ctw_results_module_id: oneMileModuleId,
        exam_type_id: formData.exam_type_id,
        instructor_id: user.id,
        practice_date: formattedDate,
        practices,
      });
      setPracticeSuccess("Practices saved successfully.");
      setShowPracticeModal(false);
      setModalPracticeDate("");
      setBestPracticesLoaded(false);

      // Load practices and get returned data
      const practicesData = await loadAllPractices();

      // Compute best practices using the freshly loaded data
      // FIX: Use Number() instead of parseFloat() to handle both string and number types
      if (cadetRows.length > 0 && practicesData.length > 0) {
        const updatedRows = cadetRows.map(cadet => {
          const cadetPractices = practicesData.filter((p: any) => p.cadet_id === cadet.cadet_id);
          if (cadetPractices.length === 0) return { ...cadet, practices: {}, avg_practice: 0 };

          const sortedMarks = [...cadetPractices]
            .map(p => Number(p.achieved_mark))
            .filter(m => !isNaN(m))
            .sort((a, b) => b - a)
            .slice(0, 3);

          const bestPractices: { [key: number]: number } = {};
          sortedMarks.forEach((mark, idx) => { bestPractices[idx + 1] = mark; });
          const avgPractice = sortedMarks.length > 0 ? sortedMarks.reduce((a, b) => a + b, 0) / sortedMarks.length : 0;

          const updatedCadet = { ...cadet, practices: bestPractices, avg_practice: parseFloat(avgPractice.toFixed(2)) };
          return updateCalculatedMarks(updatedCadet, true);
        });
        setCadetRows(updatedRows);
      }
    } catch (err: any) {
      setPracticeError(err.message || "Failed to save practices.");
    } finally {
      setSavingPractices(false);
    }
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
          achieved_mark: c.test_mark || 0,
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
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between ">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon icon="hugeicons:note-edit" className="w-5 h-5 text-blue-500" />
              {showing === "form" ? "Cadets Marks Entry" : "Cadets Practice Marks"}
              {loadingCadets && (
                <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
              )}
            </h3>
            <div className="rounded-full">
              <div className="flex items-center gap-2">
                <div className="inline-flex gap-1 rounded-full border border-gray-300 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowing("form")}
                    className={`px-4 py-1 rounded-full border border-gray-300 ${showing === "form" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowing("practice")}
                    className={`px-4 py-1 rounded-full border border-gray-300 ${showing === "practice" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    Practices
                  </button>
                </div>
                {showing === "practice" && (
                  <button
                    type="button"
                    onClick={openPracticeModal}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1 text-xs"
                  >
                    <Icon icon="hugeicons:add" className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>

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
            <>
              {showing === "form" ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr>
                        <th className="border border-black px-3 py-2 text-center whitespace-nowrap" rowSpan={2}>SL</th>
                        <th className="border border-black px-3 py-2 text-center whitespace-nowrap" rowSpan={2}>BD No.</th>
                        <th className="border border-black px-3 py-2 text-center whitespace-nowrap" rowSpan={2}>Rank</th>
                        <th className="border border-black px-3 py-2 text-left whitespace-nowrap" rowSpan={2}>Name</th>
                        <th className="border border-black px-3 py-2 text-left whitespace-nowrap" rowSpan={2}>Branch</th>
                        {practiceCount > 0 && (
                          <th className="border border-black px-3 py-2 text-center" colSpan={practiceCount}>Practices</th>
                        )}
                        <th className="border border-black px-3 py-2 text-center whitespace-nowrap" rowSpan={2}>Avg. <br /> Practice</th>
                        <th className="border border-black px-3 py-2 text-center whitespace-nowrap" rowSpan={2}>Exam <br /> {maxTestMark > 0 ? `${maxTestMark}` : ""}</th>
                        <th className="border border-black px-3 py-2 text-center whitespace-nowrap" rowSpan={2}>Prac <br /> ({convPracticeWeight}%)</th>
                        <th className="border border-black px-3 py-2 text-center whitespace-nowrap" rowSpan={2}>Exam <br /> ({convExamWeight}%)</th>
                        <th className="border border-black px-3 py-2 text-center whitespace-nowrap" rowSpan={2}>Total</th>
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
                      {cadetRows.map((cadet, index) => {
                        const bestData = getBestPractices(cadet.cadet_id);
                        const bestPractices = bestData.practices;
                        const bestAvg = bestData.avg;
                        return (
                          <tr key={cadet.cadet_id}>
                            <td className="border border-black px-3 py-2 text-center">{index + 1}</td>
                            <td className="border border-black px-3 py-2 text-center">{cadet.cadet_number}</td>
                            <td className="border border-black px-3 py-2 text-center">{cadet.cadet_rank}</td>
                            <td className="border border-black px-3 py-2">{cadet.cadet_name}</td>
                            <td className="border border-black px-3 py-2">{cadet.branch}</td>

                            {Array.from({ length: practiceCount }, (_, i) => i + 1).map(p => (
                              <td key={p} className="border border-black px-2 py-1 text-center">
                                {bestPractices && bestPractices[p] !== undefined ? (
                                  <span className="text-xs font-medium">{bestPractices[p]}</span>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            ))}

                            <td className="border border-black px-2 py-1 text-center">
                              {bestAvg > 0 ? bestAvg : <span className="text-gray-300">-</span>}
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              <input
                                type="number"
                                min={0}
                                max={maxTestMark > 0 ? maxTestMark : undefined}
                                step={0.01}
                                value={cadet.test_mark || 0}
                                onChange={(e) => handleTestMarkChange(index, parseFloat(e.target.value) || 0)}
                                className="w-16 px-1 py-1 border border-gray-300 rounded text-center text-xs focus:ring-2 focus:ring-blue-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0"
                              />
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              {bestAvg > 0 ? Math.round(bestAvg * convPracticeWeight / 100 * 100) / 100 : 0}
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              {cadet.test_mark > 0 ? Math.round(cadet.test_mark * convExamWeight / 100 * 100) / 100 : 0}
                            </td>
                            <td className="border border-black px-2 py-1 text-center">
                              {calculateTotal(bestAvg, cadet.test_mark)}
                            </td>
                          </tr>
                        )})}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div>
                  {allPractices.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Icon icon="hugeicons:calendar" className="w-10 h-10 mx-auto mb-2" />
                      <p>No practice records found for the selected filters</p>
                      <button type="button" onClick={openPracticeModal} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Add Practice Marks
                      </button>
                    </div>
                  ) : (
                    (() => {
                      const practiceDates = Array.from(new Set(allPractices.map((p: any) => {
                        const date = p.practice_date;
                        if (date && typeof date === 'string') {
                          return date.split('T')[0];
                        }
                        return String(date);
                      }))).sort();
                      return (
                        <div>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-black text-xs">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-black px-3 py-2 text-center whitespace-nowrap">SL</th>
                                  <th className="border border-black px-3 py-2 text-center whitespace-nowrap">BD No.</th>
                                  <th className="border border-black px-3 py-2 text-center whitespace-nowrap">Rank</th>
                                  <th className="border border-black px-3 py-2 text-left whitespace-nowrap">Name</th>
                                  {practiceDates.map((d) => (
                                    <th key={d} className="border border-black px-3 py-2 text-center whitespace-nowrap">{d}</th>
                                  ))}
                                  <th className="border border-black px-3 py-2 text-center whitespace-nowrap bg-yellow-50">Avg</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cadetRows.map((cadet, index) => {
                                  const cadetPractices = allPractices.filter((p: any) => p.cadet_id === cadet.cadet_id);
                                  const marks = practiceDates.map(d => {
                                    const rec = cadetPractices.find((p: any) => {
                                      const pDate = p.practice_date;
                                      if (pDate && typeof pDate === 'string') {
                                        return pDate.split('T')[0] === d;
                                      }
                                      return String(pDate) === d;
                                    });
                                    return rec ? Number(rec.achieved_mark) : null; // FIX: Use Number()
                                  });
                                  const validMarks = marks.filter((m): m is number => m !== null);
                                  const avg = validMarks.length > 0 ? (validMarks.reduce((a, b) => a + b, 0) / validMarks.length).toFixed(2) : "-";
                                  return (
                                    <tr key={cadet.cadet_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                      <td className="border border-black px-3 py-2 text-center">{index + 1}</td>
                                      <td className="border border-black px-3 py-2 text-center">{cadet.cadet_number}</td>
                                      <td className="border border-black px-3 py-2 text-center">{cadet.cadet_rank}</td>
                                      <td className="border border-black px-3 py-2">{cadet.cadet_name}</td>
                                      {marks.map((m, i) => (
                                        <td key={i} className="border border-black px-3 py-2 text-center">{m !== null ? m : <span className="text-gray-300">-</span>}</td>
                                      ))}
                                      <td className="border border-black px-3 py-2 text-center font-semibold bg-yellow-50">{avg}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </>
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

      {/* Practice Modal */}
      <OneMilePracticeModal
        isOpen={showPracticeModal}
        onClose={() => setShowPracticeModal(false)}
        courses={courses}
        semesters={semesters}
        selectedCourseId={formData.course_id}
        selectedSemesterId={formData.semester_id}
        maxTestMark={maxTestMark}
        cadetRows={cadetRows}
        modalPracticeDate={modalPracticeDate}
        setModalPracticeDate={setModalPracticeDate}
        modalPracticeMarks={modalPracticeMarks}
        onChangePracticeMark={handleModalPracticeMarkChange}
        onSave={handleSaveModalPractices}
        saving={savingPractices}
        error={practiceError}
        success={practiceSuccess}
      />
    </form>
  );
}