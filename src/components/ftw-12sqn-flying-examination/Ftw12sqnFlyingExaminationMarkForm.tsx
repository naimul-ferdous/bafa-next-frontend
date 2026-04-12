/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/libs/hooks/useAuth";
import { ftw12sqnFlyingExaminationMarkService } from "@/libs/services/ftw12sqnFlyingExaminationMarkService";
import type { SystemCourse, SystemSemester, SystemExam } from "@/libs/types/system";
import type { User, CadetProfile } from "@/libs/types/user";
import type {
  Ftw12sqnFlyingPhaseType,
  Ftw12sqnFlyingSyllabus,
  Ftw12sqnFlyingSyllabusExercise,
} from "@/libs/types/ftw12sqnFlying";
import DatePicker from "@/components/form/input/DatePicker";
import EditMarkModal from "./EditMarkModal";
import AddAdditionalMarkModal from "./AddAdditionalMarkModal";

// Extended exercise with phase type info
interface ExerciseWithPhaseType extends Ftw12sqnFlyingSyllabusExercise {
  phase_type_id: number;
  phase_type_name: string;
  syllabus_id: number;
  phase_sort?: number;
}

// Each row = one mission/exercise for the selected cadet
interface MissionRow {
  exercise_id: number;
  exercise_shortname: string;
  phase_type_id: number;
  phase_type_name: string;
  syllabus_id: number;
  phase_sort?: number;
  exercise_sort?: number;
  take_time_hours?: string;
  is_active: boolean;
  date: string;
  instructor_id: number;
  hrs_solo: string;
  hrs_dual: string;
  mark: string;
  time: string;
  remark: string;
  existing_mark_info?: {
    exists: boolean;
    id?: number;
    date?: string;
    instructor_id?: number;
    instructor_name?: string;
    achieved_time?: string;
    achieved_mark?: string;
    remark?: string;
  };
}

interface BulkFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
  initialData?: any;
}

export default function Ftw12sqnFlyingExaminationMarkForm({
  onSubmit,
  onCancel,
  loading,
  isEdit = false,
  initialData,
}: BulkFormProps) {
  const { user, userIsSuperAdmin, userIsSystemAdmin, userIsInstructor } = useAuth();

  const isInstructor = userIsInstructor;
  const defaultInstructorId = isInstructor && user ? user.id : 0;

  const [formData, setFormData] = useState({
    course_id: isEdit ? (initialData?.course_id || 0) : 0,
    semester_id: isEdit ? (initialData?.semester_id || 0) : 0,
    program_id: isEdit ? (initialData?.program_id || 0) : 0,
    branch_id: isEdit ? (initialData?.branch_id || 0) : 0,
    group_id: isEdit ? (initialData?.group_id || 0) : 0,
    exam_type_id: isEdit ? (initialData?.exam_type_id || 0) : 0,
    syllabus_id: isEdit ? (initialData?.ftw_12sqn_flying_syllabus_id || 0) : 0,
    // NEW: selected cadet for create-mode
    selected_cadet_id: 0,
  });

  // Selected phase IDs for checkboxes
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<number[]>([]);

  // Single record edit state
  const [editData, setEditData] = useState({
    ftw_12sqn_flying_syllabus_exercise_id:
      initialData?.ftw_12sqn_flying_syllabus_exercise_id || 0,
    instructor_id: initialData?.instructor_id || defaultInstructorId,
    phase_type_id: initialData?.phase_type_id || 0,
    achieved_mark: initialData?.achieved_mark || "",
    achieved_time: initialData?.achieved_time || "",
    participate_date: initialData?.participate_date || "",
    is_present: initialData?.is_present ?? true,
    absent_reason: initialData?.absent_reason || "",
    remark: initialData?.remark || "",
    is_active: initialData?.is_active ?? true,
  });

  // Mission rows for the selected cadet (create mode)
  const [missionRows, setMissionRows] = useState<MissionRow[]>([]);
  const [error, setError] = useState("");
  const [timeInputs, setTimeInputs] = useState<{ [key: string]: string }>({});

  // Edit/Add modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExerciseForEdit, setSelectedExerciseForEdit] = useState<MissionRow | null>(null);
  const [selectedExerciseForAdd, setSelectedExerciseForAdd] = useState<MissionRow | null>(null);

  // ── Time helpers ──────────────────────────────────────────────────────────
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr || timeStr.trim() === "") return 0;
    const cleanStr = timeStr.replace(".", ":");
    if (cleanStr.includes(":")) {
      const parts = cleanStr.split(":");
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      return hours * 60 + minutes;
    }
    const num = parseFloat(timeStr);
    if (!isNaN(num)) return Math.round(num * 60);
    return 0;
  };

  const minutesToTimeString = (totalMinutes: number): string => {
    if (totalMinutes <= 0) return "0:00";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  const handleTimeInputChange = (key: string, value: string) => {
    setTimeInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleTimeInputBlur = (
    key: string,
    exerciseId?: number,
    field?: "hrs_solo" | "hrs_dual" | "achieved_time",
    isEditMode = false
  ) => {
    const inputValue = timeInputs[key] || "";
    const totalMinutes = parseTimeToMinutes(inputValue);
    const timeStr = minutesToTimeString(totalMinutes);

    if (isEditMode) {
      if (field === "achieved_time") {
        setEditData((prev) => ({ ...prev, achieved_time: timeStr }));
      }
    } else if (exerciseId !== undefined) {
      handleMissionRowChange(exerciseId, field as keyof MissionRow, timeStr);
    }

    setTimeInputs((prev) => ({ ...prev, [key]: timeStr }));
  };

  const getTimeInputValue = (key: string, defaultValue: string): string => {
    if (timeInputs[key] !== undefined) return timeInputs[key];
    return defaultValue || "0:00";
  };

  // ── Dropdown data ─────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [phaseTypes, setPhaseTypes] = useState<Ftw12sqnFlyingPhaseType[]>([]);
  const [syllabuses, setSyllabuses] = useState<Ftw12sqnFlyingSyllabus[]>([]);
  const [allCadets, setAllCadets] = useState<CadetProfile[]>([]);
  const [exercises, setExercises] = useState<ExerciseWithPhaseType[]>([]);
  const [instructorAssignedExercises, setInstructorAssignedExercises] = useState<number[]>([]);
  const [instructorAssignedPhases, setInstructorAssignedPhases] = useState<number[]>([]);
  const [instructorAssignedCadets, setInstructorAssignedCadets] = useState<{ id: number; name: string; bd_no?: string; cadet_number?: string }[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [loadingExistingMarks, setLoadingExistingMarks] = useState(false);

  // ── Auto-select exam type when semester is selected ───────────────────────
  useEffect(() => {
    if (formData.semester_id > 0 && exams.length > 0 && formData.exam_type_id === 0) {
      const selectedSem = semesters.find((s) => s.id === formData.semester_id);
      if (selectedSem) {
        const semName = selectedSem.name.toLowerCase();
        const semCode = selectedSem.code?.toLowerCase() || "";
        let selectedExamId = 0;

        if (
          semName.includes("5th") ||
          semName.includes("5 semester") ||
          semCode.includes("s5") ||
          semCode.includes("sem5")
        ) {
          const midExam = exams.find(
            (e) =>
              e.name.toLowerCase().includes("mid") ||
              e.code?.toLowerCase().includes("mid")
          );
          if (midExam) selectedExamId = midExam.id;
        } else if (
          semName.includes("6th") ||
          semName.includes("6 semester") ||
          semCode.includes("s6") ||
          semCode.includes("sem6")
        ) {
          const endExam = exams.find(
            (e) =>
              e.name.toLowerCase().includes("end") ||
              e.code?.toLowerCase().includes("end")
          );
          if (endExam) selectedExamId = endExam.id;
        }

        if (selectedExamId > 0) {
          setFormData((prev) => ({ ...prev, exam_type_id: selectedExamId }));
        }
      }
    }
  }, [formData.semester_id, semesters, exams, formData.exam_type_id]);

  // ── Load dropdown data from single API ────────────────────────────────────────────────────
  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoadingInitial(true);

        const formDataResponse = await ftw12sqnFlyingExaminationMarkService.getFormData({
          instructor_id: isInstructor && user ? user.id : undefined,
        });

        if (formDataResponse) {
          setCourses(formDataResponse.courses || []);
          setSemesters(formDataResponse.semesters || []);
          setExams(formDataResponse.exams || []);
          setPhaseTypes(formDataResponse.phase_types || []);
          setSyllabuses(formDataResponse.syllabuses || []);

          const mappedInstructors = (formDataResponse.instructors || []).map((inst: any) => ({
            ...inst,
            id: inst.id,
            name: inst.name || inst.name_bangla || `Instructor #${inst.id}`,
          }));
          setInstructors(mappedInstructors);

          if (formDataResponse.instructor_assigned) {
            setInstructorAssignedPhases(formDataResponse.instructor_assigned.phases?.map((p: any) => p.id) || []);
            setInstructorAssignedExercises(formDataResponse.instructor_assigned.exercises || []);
            setInstructorAssignedCadets(formDataResponse.instructor_assigned.cadets || []);
          }
        }
      } catch (err) {
        console.error("Failed to load form data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingInitial(false);
      }
    };

    loadFormData();
  }, [isInstructor, user]);

  // ── Fetch cadets for course+semester from single API ────────────────────────────
  useEffect(() => {
    const fetchCadets = async () => {
      if (!formData.course_id || !formData.semester_id) {
        setAllCadets([]);
        return;
      }
      try {
        const formDataResponse = await ftw12sqnFlyingExaminationMarkService.getFormData({
          instructor_id: isInstructor && user ? user.id : undefined,
          semester_id: formData.semester_id,
          course_id: formData.course_id,
        });

        if (formDataResponse?.cadets) {
          setAllCadets(formDataResponse.cadets);
        }

        // Also update instructor assignments based on course/semester selection
        if (formDataResponse?.instructor_assigned) {
          setInstructorAssignedPhases(formDataResponse.instructor_assigned.phases?.map((p: any) => p.id) || []);
          setInstructorAssignedExercises(formDataResponse.instructor_assigned.exercises || []);
          setInstructorAssignedCadets(formDataResponse.instructor_assigned.cadets || []);
        }
      } catch (err) {
        console.error("Failed to fetch cadets:", err);
      }
    };
    fetchCadets();
  }, [formData.course_id, formData.semester_id, isInstructor, user]);

  // ── Filtered cadets list (wing/subwing restriction + instructor assignment) ─────
  const filteredCadets = useMemo(() => {
    if (!formData.course_id || !formData.semester_id) return [];
    const isRestricted = !userIsSuperAdmin && !userIsSystemAdmin;

    // For instructors, filter to only show assigned cadets
    if (isInstructor && instructorAssignedCadets.length > 0) {
      const cadetIds = new Set(instructorAssignedCadets.map(c => c.id));
      return allCadets.filter(cadet => cadetIds.has(cadet.id));
    }

    if (!isRestricted) return allCadets;

    const userRoleWings =
      user?.roleAssignments?.map((ra) => ra.wing_id).filter((id) => id != null) || [];
    const userRoleSubWings =
      user?.roleAssignments?.map((ra) => ra.sub_wing_id).filter((id) => id != null) || [];
    const userAssignWings =
      (user as any)?.assign_wings
        ?.map((aw: any) => aw.wing_id)
        .filter((id: any) => id != null) || [];
    const userAssignSubWings =
      (user as any)?.assign_wings
        ?.map((aw: any) => aw.subwing_id)
        .filter((id: any) => id != null) || [];

    const userWingIds = [...new Set([...userRoleWings, ...userAssignWings])];
    const userSubWingIds = [
      ...new Set([...userRoleSubWings, ...userAssignSubWings]),
    ];

    if (userWingIds.length === 0) return allCadets;

    return allCadets.filter((cadet) => {
      if (
        formData.program_id &&
        !cadet.assigned_programs?.some(
          (ap) => ap.program_id === formData.program_id
        )
      )
        return false;
      if (
        formData.branch_id &&
        !cadet.assigned_branchs?.some(
          (ab) => ab.branch_id === formData.branch_id
        )
      )
        return false;
      if (
        formData.group_id &&
        !cadet.assigned_groups?.some(
          (ag) => ag.group_id === formData.group_id
        )
      )
        return false;

      if (!cadet.assigned_wings || cadet.assigned_wings.length === 0)
        return true;
      const matchesWing = cadet.assigned_wings.some((aw) =>
        userWingIds.includes(aw.wing_id)
      );
      let matchesSubWing = true;
      if (
        userSubWingIds.length > 0 &&
        cadet.assigned_sub_wings &&
        cadet.assigned_sub_wings.length > 0
      ) {
        matchesSubWing = cadet.assigned_sub_wings.some((asw) =>
          userSubWingIds.includes(asw.sub_wing_id)
        );
      }
      return matchesWing && matchesSubWing;
    });
  }, [
    allCadets,
    formData.course_id,
    formData.semester_id,
    formData.program_id,
    formData.branch_id,
    formData.group_id,
    user,
    userIsSuperAdmin,
    userIsSystemAdmin,
    isInstructor,
    instructorAssignedCadets,
  ]);

  // ── Load exercises when selected phases change ──────────────────────────────
  useEffect(() => {
    const loadExercises = async () => {
      if (selectedPhaseIds.length === 0) {
        setExercises([]);
        return;
      }
      try {
        setLoadingExercises(true);
        const allExercises: ExerciseWithPhaseType[] = [];

        selectedPhaseIds.forEach((syllabusId) => {
          const selectedSyllabus = syllabuses.find((s) => s.id === syllabusId);
          if (!selectedSyllabus) return;

          selectedSyllabus.syllabus_types?.forEach((syllabusType) => {
            const phaseType = phaseTypes.find(
              (pt) => pt.id === syllabusType.ftw_12sqn_flying_phase_type_id
            );
            const phaseTypeName = phaseType?.type_name || "";
            syllabusType.exercises?.forEach((exercise) => {
              if (exercise.is_active) {
                allExercises.push({
                  ...exercise,
                  phase_type_id: syllabusType.ftw_12sqn_flying_phase_type_id,
                  phase_type_name: phaseTypeName,
                  syllabus_id: syllabusId,
                  phase_sort: selectedSyllabus.phase_sort || 0,
                });
              }
            });
          });
        });

        // Sort by phase_sort first, then by syllabus_id for consistent ordering, then by exercise_sort
        allExercises.sort((a, b) => {
          const aSort = a.phase_sort || 0;
          const bSort = b.phase_sort || 0;
          if (aSort !== bSort) return aSort - bSort;
          if (a.syllabus_id !== b.syllabus_id) return a.syllabus_id - b.syllabus_id;
          return (a.exercise_sort || 0) - (b.exercise_sort || 0);
        });

        setExercises(allExercises);
      } catch (err) {
        console.error("Failed to load exercises:", err);
        setError("Failed to load exercises");
      } finally {
        setLoadingExercises(false);
      }
    };
    loadExercises();
  }, [selectedPhaseIds, syllabuses, phaseTypes]);

  // ── Exercises filtered to instructor assignments ───────────────────────────
  const filteredExercises = useMemo(() => {
    if (!isInstructor || instructorAssignedExercises.length === 0)
      return exercises;
    return exercises.filter((ex) =>
      instructorAssignedExercises.includes(ex.id)
    );
  }, [exercises, isInstructor, instructorAssignedExercises]);

  // ── Build mission rows when cadet + exercises are ready ───────────────────
  // When the selected cadet or exercises list changes, rebuild the mission rows
  // and check for existing marks for each exercise.
  useEffect(() => {
    if (isEdit) return;
    if (!formData.selected_cadet_id || filteredExercises.length === 0) {
      setMissionRows([]);
      return;
    }

    // Filter exercises by selected phases
    const exercisesToShow = selectedPhaseIds.length > 0
      ? filteredExercises.filter((ex) => selectedPhaseIds.includes(ex.syllabus_id))
      : filteredExercises;

    if (exercisesToShow.length === 0) {
      setMissionRows([]);
      return;
    }

    // Get today's date in dd/mm/yyyy format
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayStr = `${dd}/${mm}/${yyyy}`;

    const rows: MissionRow[] = exercisesToShow.map((ex) => ({
      exercise_id: ex.id,
      exercise_shortname: ex.exercise_shortname,
      phase_type_id: ex.phase_type_id,
      phase_type_name: ex.phase_type_name,
      syllabus_id: ex.syllabus_id,
      phase_sort: ex.phase_sort,
      exercise_sort: ex.exercise_sort,
      take_time_hours: ex.take_time_hours ? String(ex.take_time_hours) : undefined,
      is_active: false,
      date: todayStr,
      instructor_id: defaultInstructorId,
      hrs_solo: "0:00",
      hrs_dual: "0:00",
      mark: "",
      time: "0:00",
      remark: "",
      existing_mark_info: undefined,
    }));

    setMissionRows(rows);

    // After building rows, fetch all existing marks in one call
    if (formData.course_id && formData.semester_id && formData.exam_type_id) {
      const fetchExistingMarks = async () => {
        setLoadingExistingMarks(true);
        try {
          const result = await ftw12sqnFlyingExaminationMarkService.getCadetMarks({
            cadet_id: formData.selected_cadet_id,
            course_id: formData.course_id,
            semester_id: formData.semester_id,
            exam_type_id: formData.exam_type_id,
          });

          if (result.marks && result.marks.length > 0) {
            const marksMap = new Map();
            result.marks.forEach((m) => {
              marksMap.set(m.ftw_12sqn_flying_syllabus_exercise_id, m);
            });

            const updated = rows.map((row) => {
              const existingMark = marksMap.get(row.exercise_id);
              if (existingMark) {
                return {
                  ...row,
                  existing_mark_info: {
                    exists: true,
                    id: existingMark.id,
                    date: existingMark.participate_date || existingMark.created_at,
                    instructor_id: existingMark.instructor_id,
                    achieved_time: existingMark.achieved_time,
                    achieved_mark: existingMark.achieved_mark,
                    remark: existingMark.remark,
                  },
                };
              }
              return row;
            });
            setMissionRows(updated);
          }
        } catch (error) {
          console.error('Failed to fetch existing marks:', error);
        } finally {
          setLoadingExistingMarks(false);
        }
      };
      fetchExistingMarks();
    }
    // Reset time inputs when cadet changes
    setTimeInputs({});
  }, [
    formData.selected_cadet_id,
    filteredExercises,
    selectedPhaseIds,
    formData.course_id,
    formData.semester_id,
    formData.exam_type_id,
    formData.syllabus_id,
    isEdit,
    defaultInstructorId,
  ]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset syllabus and cadet when semester changes
      if (field === "semester_id") {
        updated.syllabus_id = 0;
        updated.selected_cadet_id = 0;
      }
      // Reset cadet when syllabus changes
      if (field === "syllabus_id") {
        updated.selected_cadet_id = 0;
      }
      return updated;
    });
  };

  const handlePhaseCheckboxChange = (phaseId: number, checked: boolean) => {
    setSelectedPhaseIds((prev) => {
      if (checked) {
        return [...prev, phaseId];
      } else {
        return prev.filter((id) => id !== phaseId);
      }
    });
  };

  const handleSelectAllPhases = (checked: boolean) => {
    if (checked) {
      const availablePhaseIds = syllabuses
        .filter((s) => {
          if (formData.semester_id && s.semester_id !== formData.semester_id) return false;
          if (isInstructor && instructorAssignedPhases.length > 0 && !instructorAssignedPhases.includes(s.id)) return false;
          return true;
        })
        .map((s) => s.id);
      setSelectedPhaseIds(availablePhaseIds);
    } else {
      setSelectedPhaseIds([]);
    }
  };

  const handleSelectAllTableExercises = (checked: boolean) => {
    if (checked) {
      const allSyllabusIds = missionRows.map((r) => r.syllabus_id);
      setSelectedPhaseIds(allSyllabusIds);
    } else {
      setSelectedPhaseIds([]);
    }
  };

  const handleMissionRowChange = (
    exerciseId: number,
    field: keyof MissionRow,
    value: any
  ) => {
    setMissionRows((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((r) => r.exercise_id === exerciseId);
      if (idx === -1) return prev;
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const toggleMissionActive = (exerciseId: number) => {
    setMissionRows((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((r) => r.exercise_id === exerciseId);
      if (idx === -1) return prev;
      updated[idx] = {
        ...updated[idx],
        is_active: !updated[idx].is_active,
      };
      return updated;
    });
  };

  const handleUpdateExistingMark = async (row: MissionRow) => {
    if (!row.existing_mark_info?.exists || !row.existing_mark_info.id) return;

    try {
      const submitData = {
        ftw_12sqn_flying_syllabus_id: row.syllabus_id,
        ftw_12sqn_flying_syllabus_exercise_id: row.exercise_id,
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        instructor_id: row.existing_mark_info.instructor_id || row.instructor_id,
        cadet_id: formData.selected_cadet_id,
        exam_type_id: formData.exam_type_id || null,
        phase_type_id: row.phase_type_id,
        achieved_mark: row.existing_mark_info.achieved_mark,
        achieved_time: row.existing_mark_info.achieved_time,
        participate_date: row.existing_mark_info.date,
        is_present: true,
        remark: row.existing_mark_info.remark || "",
        is_active: true,
      };

      await ftw12sqnFlyingExaminationMarkService.updateMark(row.existing_mark_info.id, submitData);

      // Refresh the mission rows to get updated data
      setMissionRows((prev) => prev.map((r) => {
        if (r.exercise_id === row.exercise_id) {
          return {
            ...r,
            existing_mark_info: {
              exists: true,
              id: row.existing_mark_info?.id,
              date: row.existing_mark_info?.date,
              achieved_mark: row.existing_mark_info?.achieved_mark,
              achieved_time: row.existing_mark_info?.achieved_time,
              instructor_id: row.existing_mark_info?.instructor_id,
            },
          };
        }
        return r;
      }));

      setError("");
    } catch (err: any) {
      // If it's a success message in error, it's actually successful
      const msg = err?.message || "";
      if (!msg.toLowerCase().includes("success")) {
        console.error("Failed to update mark:", err);
        setError(msg || "Failed to update mark");
      } else {
        setError("");
      }
    }
  };

  const handleAddAdditionalMark = async (row: MissionRow) => {
    try {
      const submitData = {
        ftw_12sqn_flying_syllabus_id: row.syllabus_id,
        ftw_12sqn_flying_syllabus_exercise_id: row.exercise_id,
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        instructor_id: row.instructor_id,
        cadet_id: formData.selected_cadet_id,
        exam_type_id: formData.exam_type_id || null,
        phase_type_id: row.phase_type_id,
        achieved_mark: row.mark,
        achieved_time: row.time || row.hrs_dual,
        participate_date: row.date,
        is_present: true,
        remark: row.remark,
        is_active: true,
      };

      await ftw12sqnFlyingExaminationMarkService.createAdditionalMark(submitData);

      setError("");
    } catch (err: any) {
      const msg = err?.message || "";
      if (!msg.toLowerCase().includes("success")) {
        console.error("Failed to add additional mark:", err);
        setError(msg || "Failed to add additional mark");
      } else {
        setError("");
      }
    }
  };

  const handleEditChange = (field: string, value: any) => {
    setEditData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "ftw_12sqn_flying_syllabus_exercise_id") {
        const exercise = exercises.find((ex) => ex.id === value);
        if (exercise) updated.phase_type_id = exercise.phase_type_id;
      }
      return updated;
    });
  };

  const getExercisePhaseType = (
    phaseTypeName: string
  ): { isDual: boolean; isSolo: boolean } => {
    const name = phaseTypeName?.toLowerCase() || "";
    return { isDual: name.includes("dual"), isSolo: name.includes("solo") };
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.course_id) { setError("Please select a course"); return; }
    if (!formData.semester_id) { setError("Please select a semester"); return; }
    if (selectedPhaseIds.length === 0) { setError("Please select at least one phase"); return; }

    try {
      if (isEdit) {
        if (!editData.ftw_12sqn_flying_syllabus_exercise_id) {
          setError("Please select an exercise");
          return;
        }
        if (!editData.instructor_id) {
          setError("Please select an instructor");
          return;
        }

        const submitData = {
          ftw_12sqn_flying_syllabus_id: formData.syllabus_id,
          ftw_12sqn_flying_syllabus_exercise_id:
            editData.ftw_12sqn_flying_syllabus_exercise_id,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: initialData?.program_id || null,
          branch_id: initialData?.branch_id || null,
          group_id: initialData?.group_id || null,
          instructor_id: editData.instructor_id,
          cadet_id: initialData?.cadet_id,
          exam_type_id: formData.exam_type_id || null,
          phase_type_id: editData.phase_type_id,
          achieved_mark: editData.achieved_mark,
          achieved_time: editData.achieved_time,
          participate_date: editData.participate_date,
          is_present: editData.is_present,
          absent_reason: editData.absent_reason,
          remark: editData.remark,
          is_active: editData.is_active,
        };
        await onSubmit(submitData);
      } else {
        // Create mode — build marks from selected mission rows
        if (!formData.selected_cadet_id) {
          setError("Please select a cadet");
          return;
        }

        const marks: any[] = missionRows
          .filter(
            (r) =>
              r.is_active &&
              r.exercise_id > 0 &&
              !r.existing_mark_info?.exists
          )
          .map((r) => ({
            cadet_id: formData.selected_cadet_id,
            ftw_12sqn_flying_syllabus_id: r.syllabus_id,
            ftw_12sqn_flying_syllabus_exercise_id: r.exercise_id,
            instructor_id: r.instructor_id,
            exam_type_id: formData.exam_type_id || null,
            phase_type_id: r.phase_type_id,
            achieved_mark: r.mark,
            achieved_time:
              r.hrs_solo && r.hrs_solo !== "0:00" ? r.hrs_solo : r.hrs_dual,
            participate_date: r.date,
            is_present: true,
            remark: r.remark,
            is_active: true,
          }));

        if (marks.length === 0) {
          setError(
            "Please select at least one mission row (checkbox) to submit"
          );
          return;
        }

        const submitData = {
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: formData.program_id || undefined,
          branch_id: formData.branch_id || undefined,
          group_id: formData.group_id || undefined,
          marks,
        };
        await onSubmit(submitData);
      }
    } catch (err: any) {
      const defaultMessage = isEdit
        ? "Failed to update mark"
        : "Failed to create marks";
      const errorMessage =
        err?.response?.data?.message || err?.message || defaultMessage;
      if (!errorMessage.toLowerCase().includes("success")) {
        setError(errorMessage);
      }
    }
  };

  const filtersSelected =
    formData.course_id && formData.semester_id && selectedPhaseIds.length > 0;

  const selectedCadet = filteredCadets.find(
    (c) => c.id === formData.selected_cadet_id
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingInitial) {
    return (
      <div className="w-full min-h-[20vh] flex items-center justify-center">
        <Icon
          icon="hugeicons:fan-01"
          className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500"
        />
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
            <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* ── Selection Filters ── */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon icon="hugeicons:filter" className="w-5 h-5 text-blue-500" />
              Selection Filters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Course */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.course_id}
                  onChange={(e) =>
                    handleChange("course_id", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>Select Course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.semester_id}
                  onChange={(e) =>
                    handleChange("semester_id", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>Select Semester</option>
                  {semesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name} ({semester.code})
                    </option>
                  ))}
                </select>
              </div>


              {loadingExercises && (
                <p className="mb-2 text-blue-500 flex items-center gap-1 text-sm">
                  <Icon
                    icon="hugeicons:fan-01"
                    className="w-3 h-3 animate-spin"
                  />
                  Loading exercises...
                </p>
              )}
              {/* Select All checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    selectedPhaseIds.length > 0 &&
                    selectedPhaseIds.length >= syllabuses.filter((s) => {
                      if (formData.semester_id && s.semester_id !== formData.semester_id) return false;
                      if (isInstructor && instructorAssignedPhases.length > 0 && !instructorAssignedPhases.includes(s.id)) return false;
                      return true;
                    }).length
                  }
                  onChange={(e) => handleSelectAllPhases(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="font-medium text-gray-700 text-sm">Select All Exercises</span>
              </div>

              {syllabuses
                .filter((s) => {
                  if (formData.semester_id && s.semester_id !== formData.semester_id)
                    return false;
                  if (
                    isInstructor &&
                    instructorAssignedPhases.length > 0 &&
                    !instructorAssignedPhases.includes(s.id)
                  )
                    return false;
                  return true;
                })
                .map((syllabus) => (
                  <div key={syllabus.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPhaseIds.includes(syllabus.id)}
                      onChange={(e) =>
                        handlePhaseCheckboxChange(syllabus.id, e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700 text-sm">
                      {syllabus.phase_full_name} ({syllabus.phase_shortname})
                    </span>
                  </div>
                ))}
              {syllabuses.filter((s) => {
                if (formData.semester_id && s.semester_id !== formData.semester_id) return false;
                if (isInstructor && instructorAssignedPhases.length > 0 && !instructorAssignedPhases.includes(s.id)) return false;
                return true;
              }).length === 0 && (
                  <p className="text-gray-500 text-sm py-2">No phases available</p>
                )}

              {/* Cadet Selector — NEW (create mode only) */}
              {!isEdit && (
                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Cadet <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.selected_cadet_id}
                    onChange={(e) =>
                      handleChange("selected_cadet_id", parseInt(e.target.value))
                    }
                    disabled={!filtersSelected}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value={0}>
                      {!filtersSelected
                        ? "Select Course, Semester & Phase first"
                        : "Select Cadet"}
                    </option>
                    {filteredCadets.map((cadet) => (
                      <option key={cadet.id} value={cadet.id}>
                        {cadet.bd_no || cadet.cadet_number
                          ? `${cadet.bd_no || cadet.cadet_number} — `
                          : ""}
                        {cadet.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ── Edit Mode — Single Record ── */}
          {isEdit ? (
            <div className="space-y-6">
              {/* Cadet Info (read-only) */}
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon
                    icon="hugeicons:user"
                    className="w-5 h-5 text-blue-500"
                  />
                  Cadet Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">
                      Cadet
                    </label>
                    <p className="text-gray-900">
                      {initialData?.cadet?.name ||
                        `Cadet #${initialData?.cadet_id}`}
                    </p>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">
                      Course
                    </label>
                    <p className="text-gray-900">
                      {initialData?.course?.name ||
                        `Course #${initialData?.course_id}`}
                    </p>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">
                      Semester
                    </label>
                    <p className="text-gray-900">
                      {initialData?.semester?.name ||
                        `Semester #${initialData?.semester_id}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Examination Details */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon
                    icon="hugeicons:airplane-take-off-01"
                    className="w-5 h-5 text-blue-500"
                  />
                  Examination Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Exercise (Mission){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editData.ftw_12sqn_flying_syllabus_exercise_id}
                      onChange={(e) =>
                        handleEditChange(
                          "ftw_12sqn_flying_syllabus_exercise_id",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={!formData.syllabus_id}
                    >
                      <option value={0}>Select Exercise</option>
                      {filteredExercises.map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>
                          {exercise.exercise_shortname} -{" "}
                          ({exercise.phase_type_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Instructor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editData.instructor_id}
                      onChange={(e) =>
                        handleEditChange(
                          "instructor_id",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value={0}>Select Instructor</option>
                      {instructors.map((instructor) => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.name ||
                            (instructor as any).instructor_biodata?.name ||
                            `Instructor #${instructor.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Phase Type
                    </label>
                    <select
                      value={editData.phase_type_id}
                      onChange={(e) =>
                        handleEditChange(
                          "phase_type_id",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>Select Phase Type</option>
                      {phaseTypes.map((pt) => (
                        <option key={pt.id} value={pt.id}>
                          {pt.type_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <DatePicker
                      value={editData.participate_date}
                      onChange={(e) =>
                        handleEditChange("participate_date", e.target.value)
                      }
                      placeholder="dd/mm/yyyy"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Marks & Results */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon
                    icon="hugeicons:chart-line-data-01"
                    className="w-5 h-5 text-blue-500"
                  />
                  Marks &amp; Results
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Achieved Mark
                    </label>
                    <input
                      type="text"
                      value={editData.achieved_mark}
                      onChange={(e) =>
                        handleEditChange("achieved_mark", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter mark"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Time (H:MM)
                    </label>
                    <input
                      type="text"
                      value={getTimeInputValue("edit-time", editData.achieved_time)}
                      onChange={(e) =>
                        handleTimeInputChange("edit-time", e.target.value)
                      }
                      onBlur={() =>
                        handleTimeInputBlur(
                          "edit-time",
                          undefined,
                          "achieved_time",
                          true
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                      placeholder="0:00"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Present
                    </label>
                    <select
                      value={editData.is_present ? "true" : "false"}
                      onChange={(e) =>
                        handleEditChange(
                          "is_present",
                          e.target.value === "true"
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  {!editData.is_present && (
                    <div className="md:col-span-3">
                      <label className="block font-medium text-gray-700 mb-2">
                        Absent Reason
                      </label>
                      <input
                        type="text"
                        value={editData.absent_reason}
                        onChange={(e) =>
                          handleEditChange("absent_reason", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter reason for absence"
                      />
                    </div>
                  )}

                  <div className="md:col-span-3">
                    <label className="block font-medium text-gray-700 mb-2">
                      Remark
                    </label>
                    <textarea
                      value={editData.remark}
                      onChange={(e) =>
                        handleEditChange("remark", e.target.value)
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter any remarks"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={editData.is_active ? "true" : "false"}
                      onChange={(e) =>
                        handleEditChange("is_active", e.target.value === "true")
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── Create Mode — Mission rows for selected cadet ── */
            <div>
              {!filtersSelected ? (
                <div className="text-center py-12 text-gray-500">
                  <Icon
                    icon="hugeicons:filter"
                    className="w-10 h-10 mx-auto mb-2"
                  />
                  <p>
                    Please select Course, Semester and Phase to load missions
                  </p>
                </div>
              ) : !formData.selected_cadet_id ? (
                <div className="text-center py-12 text-gray-500">
                  <Icon
                    icon="hugeicons:user"
                    className="w-10 h-10 mx-auto mb-2"
                  />
                  <p>Please select a cadet to view their assigned missions</p>
                </div>
              ) : loadingExistingMarks ? (
                <div className="text-center py-8 text-blue-500">
                  <Icon
                    icon="hugeicons:fan-01"
                    className="w-8 h-8 animate-spin mx-auto mb-2"
                  />
                  <p className="text-sm">Checking existing marks…</p>
                </div>
              ) : missionRows.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Icon
                    icon="hugeicons:airplane-take-off-01"
                    className="w-10 h-10 mx-auto mb-2"
                  />
                  <p>No missions found for the selected phase</p>
                </div>
              ) : (
                <>
                  {/* Cadet summary bar */}
                  <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Icon
                      icon="hugeicons:user-circle"
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="font-medium text-blue-900">
                      {selectedCadet?.name}
                    </span>
                    {(selectedCadet?.bd_no || selectedCadet?.cadet_number) && (
                      <span className="text-blue-600 text-sm">
                        BD:{" "}
                        {selectedCadet?.bd_no || selectedCadet?.cadet_number}
                      </span>
                    )}
                    <span className="ml-auto text-blue-700 text-sm">
                      {missionRows.length} mission(s) in this phase
                    </span>
                  </div>

                  {/* Mission rows table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th
                            className="border border-black px-3 py-2 text-center"
                            rowSpan={2}
                          >
                            <input
                              type="checkbox"
                              checked={
                                selectedPhaseIds.length > 0 &&
                                selectedPhaseIds.length >= missionRows.length
                              }
                              onChange={(e) => handleSelectAllTableExercises(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </th>
                          <th
                            className="border border-black px-3 py-2 text-left"
                            rowSpan={2}
                          >
                            Mission / Exercise
                          </th>
                          <th
                            className="border border-black px-3 py-2 text-center"
                            rowSpan={2}
                          >
                            Phase Type
                          </th>
                          <th
                            className="border border-black px-3 py-2 text-center"
                            rowSpan={2}
                          >
                            Date
                            <span className="text-red-500">*</span>
                          </th>
                          <th
                            className="border border-black px-3 py-2 text-center"
                            rowSpan={2}
                          >
                            Instructor
                            <span className="text-red-500">*</span>
                          </th>
                          <th
                            className="border border-black px-3 py-2 text-center"
                            rowSpan={2}
                          >
                            Syl Hrs
                          </th>
                          <th
                            className="border border-black px-3 py-2 text-center"
                            colSpan={2}
                          >
                            Hrs Flown
                          </th>
                          <th
                            className="border border-black px-3 py-2 text-center"
                            rowSpan={2}
                          >
                            Mark
                          </th>
                          <th
                            className="border border-black px-3 py-2 text-center"
                            rowSpan={2}
                          >
                            Remark
                          </th>
                        </tr>
                        <tr className="bg-gray-50">
                          <th className="border border-black px-2 py-2 text-center">
                            Solo
                          </th>
                          <th className="border border-black px-2 py-2 text-center">
                            Dual
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {missionRows.map((row) => {
                          const { isDual, isSolo } = getExercisePhaseType(
                            row.phase_type_name
                          );
                          const soloKey = `mission-solo-${row.exercise_id}`;
                          const dualKey = `mission-dual-${row.exercise_id}`;
                          const isDisabled = !row.is_active;

                          return (
                            <tr
                              key={row.exercise_id}
                              className={
                                isDisabled ? "bg-gray-100 opacity-50" : ""
                              }
                            >
                              {/* Checkbox */}
                              <td className="border border-black px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedPhaseIds.includes(row.syllabus_id)}
                                  onChange={() =>
                                    handlePhaseCheckboxChange(row.syllabus_id, !selectedPhaseIds.includes(row.syllabus_id))
                                  }
                                  className="w-4 h-4 text-blue-600 border-black rounded focus:ring-blue-500 cursor-pointer mx-auto block"
                                />
                              </td>

                              {/* Mission name */}
                              <td className="border border-black px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                                {row.exercise_shortname}
                              </td>

                              {/* Phase type */}
                              <td className="border border-black px-3 py-2 text-center whitespace-nowrap text-gray-600">
                                {row.phase_type_name}
                              </td>

                              {/* Existing mark spans remaining columns */}
                              {row.existing_mark_info?.exists ? (
                                <td
                                  className="border border-black px-4 py-3 text-center bg-yellow-50"
                                  colSpan={7}
                                >
                                  <div className="text-amber-700 font-medium text-sm">
                                    <p>
                                      Mark already stored on{" "}
                                      {row.existing_mark_info.date
                                        ? new Date(
                                          row.existing_mark_info.date
                                        ).toLocaleDateString("en-GB", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })
                                        : "N/A"}
                                    </p>
                                    {row.existing_mark_info.achieved_mark && (
                                      <p className="mt-0.5 text-xs text-amber-600">
                                        Mark:{" "}
                                        {row.existing_mark_info.achieved_mark}
                                        {row.existing_mark_info.achieved_time &&
                                          ` · Time: ${row.existing_mark_info.achieved_time}`}
                                      </p>
                                    )}
                                    <div className="flex justify-center gap-2 mt-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedExerciseForEdit(row);
                                          setShowEditModal(true);
                                        }}
                                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedExerciseForAdd(row);
                                          setShowAddModal(true);
                                        }}
                                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                      >
                                        Add Additional
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              ) : (
                                <>
                                  {/* Date */}
                                  <td className="border border-black px-2 py-1">
                                    <DatePicker
                                      value={row.date}
                                      onChange={(e) =>
                                        handleMissionRowChange(
                                          row.exercise_id,
                                          "date",
                                          e.target.value
                                        )
                                      }
                                      disabled={isDisabled}
                                      placeholder="dd/mm/yyyy"
                                      className="w-full px-2 py-1 border border-black rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                  </td>

                                  {/* Instructor */}
                                  <td className="border border-black px-2 py-1">
                                    <select
                                      value={row.instructor_id}
                                      onChange={(e) =>
                                        handleMissionRowChange(
                                          row.exercise_id,
                                          "instructor_id",
                                          parseInt(e.target.value)
                                        )
                                      }
                                      disabled={isDisabled}
                                      className="w-full px-2 py-1 border border-black rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    >
                                      <option value={0}>Select</option>
                                      {instructors.map((instructor) => (
                                        <option
                                          key={instructor.id}
                                          value={instructor.id}
                                        >
                                          {instructor.name ||
                                            (instructor as any)
                                              .instructor_biodata?.name ||
                                            `Instructor #${instructor.id}`}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* Syl Hrs */}
                                  <td className="border border-black px-3 py-2 text-center">
                                    {row.take_time_hours || "-"}
                                  </td>

                                  {/* Solo */}
                                  <td className="border border-black px-2 py-1">
                                    <input
                                      type="text"
                                      value={getTimeInputValue(
                                        soloKey,
                                        row.hrs_solo
                                      )}
                                      onChange={(e) =>
                                        handleTimeInputChange(
                                          soloKey,
                                          e.target.value
                                        )
                                      }
                                      onBlur={() =>
                                        handleTimeInputBlur(
                                          soloKey,
                                          row.exercise_id,
                                          "hrs_solo"
                                        )
                                      }
                                      disabled={isDisabled || isDual}
                                      placeholder="0:00"
                                      className="w-20 px-2 py-1 border border-black rounded text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                  </td>

                                  {/* Dual */}
                                  <td className="border border-black px-2 py-1">
                                    <input
                                      type="text"
                                      value={getTimeInputValue(
                                        dualKey,
                                        row.hrs_dual
                                      )}
                                      onChange={(e) =>
                                        handleTimeInputChange(
                                          dualKey,
                                          e.target.value
                                        )
                                      }
                                      onBlur={() =>
                                        handleTimeInputBlur(
                                          dualKey,
                                          row.exercise_id,
                                          "hrs_dual"
                                        )
                                      }
                                      disabled={isDisabled || isSolo}
                                      placeholder="0:00"
                                      className="w-20 px-2 py-1 border border-black rounded text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                  </td>

                                  {/* Mark */}
                                  <td className="border border-black px-2 py-1">
                                    <input
                                      type="text"
                                      value={row.mark}
                                      onChange={(e) =>
                                        handleMissionRowChange(
                                          row.exercise_id,
                                          "mark",
                                          e.target.value
                                        )
                                      }
                                      disabled={isDisabled}
                                      className="w-24 px-2 py-1 border border-black rounded text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                  </td>

                                  {/* Remark */}
                                  <td className="border border-black px-2 py-1">
                                    <input
                                      type="text"
                                      value={row.remark}
                                      onChange={(e) =>
                                        handleMissionRowChange(
                                          row.exercise_id,
                                          "remark",
                                          e.target.value
                                        )
                                      }
                                      disabled={isDisabled}
                                      className="w-full px-2 py-1 border border-black rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2"
            disabled={loading}
          >
            {loading && (
              <Icon
                icon="hugeicons:loading-03"
                className="w-4 h-4 animate-spin"
              />
            )}
            {loading
              ? "Saving..."
              : isEdit
                ? "Update Mark"
                : "Submit All Marks"}
          </button>
        </div>
      </form>

      <EditMarkModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedExerciseForEdit(null); }}
        selectedExercise={selectedExerciseForEdit}
        onUpdate={(row) => {
          handleUpdateExistingMark(row);
          setShowEditModal(false);
          setSelectedExerciseForEdit(null);
        }}
      />

      <AddAdditionalMarkModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setSelectedExerciseForAdd(null); }}
        selectedExercise={selectedExerciseForAdd}
        onAdd={(row) => {
          handleAddAdditionalMark(row);
          setShowAddModal(false);
          setSelectedExerciseForAdd(null);
        }}
      />
    </>
  );
}