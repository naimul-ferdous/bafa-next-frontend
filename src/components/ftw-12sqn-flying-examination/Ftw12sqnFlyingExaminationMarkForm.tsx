/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/libs/hooks/useAuth";
import { commonService } from "@/libs/services/commonService";
import { ftw12sqnFlyingExaminationMarkService } from "@/libs/services/ftw12sqnFlyingExaminationMarkService";
import { cadetService } from "@/libs/services/cadetService";
import instructorService from "@/libs/services/instructorService";
import type { SystemCourse, SystemSemester, SystemExam, SystemProgram, SystemBranch, SystemGroup } from "@/libs/types/system";
import type { User, CadetProfile } from "@/libs/types/user";
import type { Ftw12sqnFlyingPhaseType, Ftw12sqnFlyingSyllabus, Ftw12sqnFlyingSyllabusExercise } from "@/libs/types/ftw12sqnFlying";
import DatePicker from "@/components/form/input/DatePicker";

// Extended exercise with phase type info
interface ExerciseWithPhaseType extends Ftw12sqnFlyingSyllabusExercise {
  phase_type_id: number;
  phase_type_name: string;
}

interface CadetRow {
  cadet_id: number;
  cadet_bd_no: string;
  cadet_rank: string;
  cadet_name: string;
  cadet_branch: string;
  is_active: boolean;
  is_present: boolean;
  mission_id: number;
  date: string;
  instructor_id: number;
  phase_type_id: number;
  hrs_solo: string;
  hrs_dual: string;
  mark: string;
  remark: string;
  existing_mark_info?: {
    exists: boolean;
    date?: string;
  };
}

interface BulkFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
  initialData?: any;
}

export default function Ftw12sqnFlyingExaminationMarkForm({ onSubmit, onCancel, loading, isEdit = false, initialData }: BulkFormProps) {
  const { user, userIsSuperAdmin, userIsSystemAdmin } = useAuth();
  
  const isInstructor = !!user?.instructor_biodata;
  const defaultInstructorId = isInstructor && user ? user.id : 0;

  const [formData, setFormData] = useState({
    course_id: isEdit ? (initialData?.course_id || 0) : 0,
    semester_id: isEdit ? (initialData?.semester_id || 0) : 0,
    program_id: isEdit ? (initialData?.program_id || 0) : 0,
    branch_id: isEdit ? (initialData?.branch_id || 0) : 0,
    group_id: isEdit ? (initialData?.group_id || 0) : 0,
    exam_type_id: isEdit ? (initialData?.exam_type_id || 0) : 0,
    syllabus_id: isEdit ? (initialData?.ftw_12sqn_flying_syllabus_id || 0) : 0,
  });

  // Single record edit state
  const [editData, setEditData] = useState({
    ftw_12sqn_flying_syllabus_exercise_id: initialData?.ftw_12sqn_flying_syllabus_exercise_id || 0,
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

  const [cadetRows, setCadetRows] = useState<CadetRow[]>([]);
  const [error, setError] = useState("");
  const [timeInputs, setTimeInputs] = useState<{ [key: string]: string }>({});

  // Time conversion helpers
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
    setTimeInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleTimeInputBlur = (key: string, index?: number, field?: "hrs_solo" | "hrs_dual" | "achieved_time", isEditMode: boolean = false) => {
    const inputValue = timeInputs[key] || "";
    const totalMinutes = parseTimeToMinutes(inputValue);
    const timeStr = minutesToTimeString(totalMinutes);
    
    if (isEditMode) {
      if (field === "achieved_time") {
        setEditData(prev => ({ ...prev, achieved_time: timeStr }));
      }
    } else if (index !== undefined) {
      if (field === "hrs_solo") {
        handleCadetChange(index, "hrs_solo" as keyof CadetRow, timeStr);
      } else if (field === "hrs_dual") {
        handleCadetChange(index, "hrs_dual" as keyof CadetRow, timeStr);
      }
    }
    
    setTimeInputs(prev => ({ ...prev, [key]: timeStr }));
  };

  const getTimeInputValue = (key: string, defaultValue: string): string => {
    if (timeInputs[key] !== undefined) return timeInputs[key];
    return defaultValue || "0:00";
  };

  // Dropdown data
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [phaseTypes, setPhaseTypes] = useState<Ftw12sqnFlyingPhaseType[]>([]);
  const [syllabuses, setSyllabuses] = useState<Ftw12sqnFlyingSyllabus[]>([]);
  const [allCadets, setAllCadets] = useState<CadetProfile[]>([]);
  const [exercises, setExercises] = useState<ExerciseWithPhaseType[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Load dropdown data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingInitial(true);
        
        // Fetch options and instructors in parallel
        const [options, instructorsRes] = await Promise.all([
          commonService.getResultOptions(),
          instructorService.getAllInstructors({ per_page: 500 })
        ]);

        if (options) {
          setCourses(options.courses.filter(c => c.is_active));
          setSemesters(options.semesters.filter(s => s.is_active && !!s.is_flying));
          setPrograms((options.programs || []).filter(p => p.is_active && !!p.is_flying));
          setBranches((options.branches || []).filter(b => b.is_active && !!b.is_flying));
          setGroups(options.groups || []);
          setExams(options.exams.filter(e => e.is_active));
          setPhaseTypes(options.ftw12sqn_phase_types);
          setSyllabuses(options.ftw12sqn_syllabuses);
        }

        // Process instructors from instructorService
        const instructorsData = (instructorsRes as any)?.data?.data || (instructorsRes as any)?.data || [];
        const mappedInstructors = instructorsData.map((inst: any) => ({
          ...inst,
          id: inst.user_id || inst.id,
          name: inst.user?.name || inst.short_name || inst.name_bangla || `Instructor #${inst.id}`,
          assigned_wings: inst.assign_wings || [] 
        }));

        if (isInstructor && user) {
          setInstructors(mappedInstructors.filter((inst: any) => inst.id === user.id));
        } else if (user) {
          // Get current user's wing/subwing IDs from all sources
          const userRoleWings = user?.roleAssignments?.map(ra => ra.wing_id).filter(id => id != null) || [];
          const userRoleSubWings = user?.roleAssignments?.map(ra => ra.sub_wing_id).filter(id => id != null) || [];
          const userAssignWings = (user as any)?.assign_wings?.map((aw: any) => aw.wing_id).filter((id: any) => id != null) || [];
          const userAssignSubWings = (user as any)?.assign_wings?.map((aw: any) => aw.subwing_id).filter((id: any) => id != null) || [];

          const userWingIds = [...new Set([...userRoleWings, ...userAssignWings])];
          const userSubWingIds = [...new Set([...userRoleSubWings, ...userAssignSubWings])];

          const isRestricted = !userIsSuperAdmin && !userIsSystemAdmin;

          if (isRestricted && userWingIds.length > 0) {
            const filteredInstructors = mappedInstructors.filter((inst: any) => {
              const instWings = inst.assigned_wings;
              if (instWings.length === 0) return false; 

              // Instructor must have at least one assignment matching the user's scope
              return instWings.some((aw: any) => {
                // ONLY consider approved and active assignments
                const isApproved = aw.status === 'approved' && aw.is_active;
                if (!isApproved) return false;

                const matchesWing = userWingIds.includes(aw.wing_id);
                const instSubWingId = aw.subwing_id || aw.sub_wing_id;
                
                if (userSubWingIds.length > 0) {
                  // User is restricted to a squadron: Match wing AND specific subwing
                  return matchesWing && instSubWingId && userSubWingIds.includes(instSubWingId);
                }
                // User is Wing level: Match wing (Parent sees all subwings of that wing)
                return matchesWing;
              });
            });
            setInstructors(filteredInstructors);
          } else {
            setInstructors(mappedInstructors);
          }
        } else {
          setInstructors(mappedInstructors);
        }

      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitialData();
  }, [isInstructor, user, userIsSuperAdmin, userIsSystemAdmin]);

  useEffect(() => {
    const fetchCadets = async () => {
      if (!formData.course_id || !formData.semester_id) {
        setAllCadets([]);
        return;
      }
      try {
        const response = await cadetService.getAllCadets({
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          per_page: 200,
        });
        
        const responseData = response as any;
        const data = Array.isArray(responseData) ? responseData : (responseData?.data?.data || responseData?.data || []);
        setAllCadets(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch cadets:", err);
      }
    };

    fetchCadets();
  }, [formData.course_id, formData.semester_id]);

  // Filtered cadets based on course, semester, and user's wing/subwing assignments
  const filteredCadets = useMemo(() => {
    if (!formData.course_id || !formData.semester_id) return [];

    // The backend API already handles course/semester filtering correctly for the list of cadets
    const isRestricted = !userIsSuperAdmin && !userIsSystemAdmin;

    if (!isRestricted) {
      return allCadets;
    }

    // Get user's assigned wings and subwings from both roleAssignments and assign_wings
    const userRoleWings = user?.roleAssignments?.map(ra => ra.wing_id).filter(id => id != null) || [];
    const userRoleSubWings = user?.roleAssignments?.map(ra => ra.sub_wing_id).filter(id => id != null) || [];
    
    const userAssignWings = (user as any)?.assign_wings?.map((aw: any) => aw.wing_id).filter((id: any) => id != null) || [];
    const userAssignSubWings = (user as any)?.assign_wings?.map((aw: any) => aw.subwing_id).filter((id: any) => id != null) || [];

    const userWingIds = [...new Set([...userRoleWings, ...userAssignWings])];
    const userSubWingIds = [...new Set([...userRoleSubWings, ...userAssignSubWings])];

    if (userWingIds.length === 0) return allCadets; // fallback: return all if no wing data attached to user

    return allCadets.filter(cadet => {
      // Basic local filters
      if (formData.program_id && !cadet.assigned_programs?.some(ap => ap.program_id === formData.program_id)) return false;
      if (formData.branch_id && !cadet.assigned_branchs?.some(ab => ab.branch_id === formData.branch_id)) return false;
      if (formData.group_id && !cadet.assigned_groups?.some(ag => ag.group_id === formData.group_id)) return false;

      // If the cadet has no wings assigned somehow, they wouldn't match. But let's allow if no wing data.
      if (!cadet.assigned_wings || cadet.assigned_wings.length === 0) return true;

      // Wing restriction
      const matchesWing = cadet.assigned_wings.some(aw => userWingIds.includes(aw.wing_id));
      
      // SubWing restriction
      let matchesSubWing = true;
      if (userSubWingIds.length > 0 && cadet.assigned_sub_wings && cadet.assigned_sub_wings.length > 0) {
        matchesSubWing = cadet.assigned_sub_wings.some(asw => userSubWingIds.includes(asw.sub_wing_id));
      }

      return matchesWing && matchesSubWing;
    });
  }, [allCadets, formData.course_id, formData.semester_id, formData.program_id, formData.branch_id, formData.group_id, user, userIsSuperAdmin, userIsSystemAdmin]);

  // Sync cadet rows when filtered cadets change
  useEffect(() => {
    if (isEdit) return;

    const rows: CadetRow[] = filteredCadets.map(cadet => ({
      cadet_id: cadet.id,
      cadet_bd_no: cadet.bd_no || cadet.cadet_number || "",
      cadet_rank: cadet.assigned_ranks?.[0]?.rank?.name || "",
      cadet_name: cadet.name,
      cadet_branch: cadet.assigned_branchs?.[0]?.branch?.code || cadet.assigned_branchs?.[0]?.branch?.name || "",
      is_active: false,
      is_present: true,
      mission_id: 0,
      date: "",
      instructor_id: defaultInstructorId,
      phase_type_id: 0,
      hrs_solo: "0:00",
      hrs_dual: "0:00",
      mark: "",
      remark: "",
      existing_mark_info: undefined,
    }));

    setCadetRows(rows);
  }, [filteredCadets, isEdit, defaultInstructorId]);

  // Load exercises when syllabus is selected (all exercises from all phase types)
  useEffect(() => {
    const loadExercises = async () => {
      if (!formData.syllabus_id) {
        setExercises([]);
        return;
      }

      try {
        setLoadingExercises(true);
        // Find the selected syllabus
        const selectedSyllabus = syllabuses.find(s => s.id === formData.syllabus_id);

        if (!selectedSyllabus) {
          setExercises([]);
          setLoadingExercises(false);
          return;
        }

        // Extract ALL exercises from the selected syllabus with their phase type info
        const allExercises: ExerciseWithPhaseType[] = [];
        selectedSyllabus.syllabus_types?.forEach(syllabusType => {
          const phaseType = phaseTypes.find(pt => pt.id === syllabusType.ftw_12sqn_flying_phase_type_id);
          const phaseTypeName = phaseType?.type_name || "";

          syllabusType.exercises?.forEach(exercise => {
            if (exercise.is_active) {
              allExercises.push({
                ...exercise,
                phase_type_id: syllabusType.ftw_12sqn_flying_phase_type_id,
                phase_type_name: phaseTypeName,
              });
            }
          });
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
  }, [formData.syllabus_id, syllabuses, phaseTypes]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-select exam type based on semester
      if (field === "semester_id" && value > 0) {
        const selectedSem = semesters.find(s => s.id === value);
        if (selectedSem) {
          const semName = selectedSem.name.toLowerCase();
          const semCode = selectedSem.code?.toLowerCase() || "";

          // Check for 5th semester (Mid)
          if (semName.includes("5th") || semName.includes("5 semester") || semCode.includes("s5") || semCode.includes("sem5")) {
            const midExam = exams.find(e =>
              e.name.toLowerCase().includes("mid") ||
              e.code?.toLowerCase().includes("mid")
            );
            if (midExam) {
              updated.exam_type_id = midExam.id;
            }
          }
          // Check for 6th semester (End)
          else if (semName.includes("6th") || semName.includes("6 semester") || semCode.includes("s6") || semCode.includes("sem6")) {
            const endExam = exams.find(e =>
              e.name.toLowerCase().includes("end") ||
              e.code?.toLowerCase().includes("end")
            );
            if (endExam) {
              updated.exam_type_id = endExam.id;
            }
          }
        }
      }

      return updated;
    });
  };

  const handleCadetChange = async (cadetIndex: number, field: keyof CadetRow, value: any) => {
    setCadetRows(prev => {
      const updated = [...prev];

      // If mission is changing, update phase_type_id and reset the disabled hrs field
      if (field === "mission_id") {
        const exercise = exercises.find(ex => ex.id === value);
        const phaseTypeName = exercise?.phase_type_name?.toLowerCase() || "";
        const isDual = phaseTypeName.includes("dual");
        const isSolo = phaseTypeName.includes("solo");

        updated[cadetIndex] = {
          ...updated[cadetIndex],
          mission_id: value,
          phase_type_id: exercise?.phase_type_id || 0,
          // Reset the disabled field to default
          hrs_solo: isDual ? "0:00" : updated[cadetIndex].hrs_solo,
          hrs_dual: isSolo ? "0:00" : updated[cadetIndex].hrs_dual,
          existing_mark_info: undefined, // Reset existing mark info when mission changes
        };
      } else {
        updated[cadetIndex] = {
          ...updated[cadetIndex],
          [field]: value
        };
      }
      return updated;
    });

    // Check for existing mark when mission is selected
    if (field === "mission_id" && value > 0 && formData.course_id && formData.semester_id && formData.exam_type_id && formData.syllabus_id) {
      const cadet = cadetRows[cadetIndex];
      const exercise = exercises.find(ex => ex.id === value);

      if (cadet && exercise) {
        try {
          const result = await ftw12sqnFlyingExaminationMarkService.checkExistingMark({
            cadet_id: cadet.cadet_id,
            course_id: formData.course_id,
            semester_id: formData.semester_id,
            exam_type_id: formData.exam_type_id,
            syllabus_id: formData.syllabus_id,
            exercise_id: value,
          });

          if (result.exists) {
            setCadetRows(prev => {
              const updated = [...prev];
              updated[cadetIndex] = {
                ...updated[cadetIndex],
                existing_mark_info: {
                  exists: true,
                  date: result.date,
                },
              };
              return updated;
            });
          }
        } catch (err) {
          console.error("Failed to check existing mark:", err);
        }
      }
    }
  };

  const toggleCadetActive = (cadetIndex: number) => {
    setCadetRows(prev => {
      const updated = [...prev];
      const newState = !updated[cadetIndex].is_active;
      updated[cadetIndex] = {
        ...updated[cadetIndex],
        is_active: newState,
        is_present: newState // Selected means present
      };
      return updated;
    });
  };

  const handleEditChange = (field: string, value: any) => {
    setEditData(prev => {
      const updated = { ...prev, [field]: value };
      // If exercise changes, update phase_type_id
      if (field === "ftw_12sqn_flying_syllabus_exercise_id") {
        const exercise = exercises.find(ex => ex.id === value);
        if (exercise) {
          updated.phase_type_id = exercise.phase_type_id;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.course_id) { setError("Please select a course"); return; }
    if (!formData.semester_id) { setError("Please select a semester"); return; }
    if (!formData.syllabus_id) { setError("Please select a phase"); return; }

    try {
      if (isEdit) {
        // Edit mode - submit single record
        if (!editData.ftw_12sqn_flying_syllabus_exercise_id) { setError("Please select an exercise"); return; }
        if (!editData.instructor_id) { setError("Please select an instructor"); return; }

        const submitData = {
          ftw_12sqn_flying_syllabus_id: formData.syllabus_id,
          ftw_12sqn_flying_syllabus_exercise_id: editData.ftw_12sqn_flying_syllabus_exercise_id,
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
        // Create mode - submit bulk records
        const marks: any[] = [];

        cadetRows
          .filter(c =>
            c.is_active &&
            c.cadet_id > 0 &&
            c.mission_id > 0 &&
            !c.existing_mark_info?.exists
          )
          .forEach(c => {
            const selectedExercise = exercises.find(ex => ex.id === c.mission_id);
            const exercisePhaseTypeId = selectedExercise?.phase_type_id || c.phase_type_id;

            marks.push({
              cadet_id: c.cadet_id,
              ftw_12sqn_flying_syllabus_id: formData.syllabus_id,
              ftw_12sqn_flying_syllabus_exercise_id: c.mission_id,
              instructor_id: c.instructor_id,
              exam_type_id: formData.exam_type_id || null,
              phase_type_id: exercisePhaseTypeId,
              achieved_mark: c.mark,
              achieved_time: c.hrs_solo && c.hrs_solo !== "0:00" ? c.hrs_solo : c.hrs_dual,
              participate_date: c.date,
              is_present: true, // Selected means present
              remark: c.remark,
              is_active: true,
            });
          });

        const submitData = {
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: formData.program_id || undefined,
          branch_id: formData.branch_id || undefined,
          group_id: formData.group_id || undefined,
          marks: marks,
        };

        await onSubmit(submitData);
      }
    } catch (err: any) {
      const defaultMessage = isEdit ? "Failed to update mark" : "Failed to create marks";
      const errorMessage = err?.response?.data?.message || err?.message || defaultMessage;

      if (!errorMessage.toLowerCase().includes('success')) {
        setError(errorMessage);
      }
    }
  };

  const filtersSelected = formData.course_id && formData.semester_id;

  // Helper to get phase type name for a specific mission/exercise
  const getExercisePhaseType = (missionId: number): { isDual: boolean; isSolo: boolean } => {
    if (!missionId) return { isDual: false, isSolo: false };
    const exercise = exercises.find(ex => ex.id === missionId);
    const phaseTypeName = exercise?.phase_type_name?.toLowerCase() || "";
    return {
      isDual: phaseTypeName.includes("dual"),
      isSolo: phaseTypeName.includes("solo"),
    };
  };

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
        {/* Basic Filters */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:filter" className="w-5 h-5 text-blue-500" />
            Selection Filters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Course <span className="text-red-500">*</span>
              </label>
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
              <label className="block font-medium text-gray-700 mb-2">
                Semester <span className="text-red-500">*</span>
              </label>
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
              <label className="block font-medium text-gray-700 mb-2">Group</label>
              <select
                value={formData.group_id}
                onChange={(e) => handleChange("group_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Select Group</option>
                {groups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Phase (Syllabus) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.syllabus_id}
                onChange={(e) => handleChange("syllabus_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Select Phase</option>
                {syllabuses
                  .filter(s => 
                    (!formData.course_id || s.course_id === formData.course_id) && 
                    (!formData.semester_id || s.semester_id === formData.semester_id)
                  )
                  .map(syllabus => (
                    <option key={syllabus.id} value={syllabus.id}>
                      {syllabus.phase_full_name} ({syllabus.phase_shortname})
                    </option>
                  ))}
              </select>
              {loadingExercises && formData.syllabus_id > 0 && (
                <p className="mt-1 text-blue-500 flex items-center gap-1">
                  <Icon icon="hugeicons:fan-01" className="w-3 h-3 animate-spin" />
                  Loading exercises...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Edit Mode - Single Record */}
        {isEdit ? (
          <div className="space-y-6">
            {/* Cadet Info (Read-only) */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="hugeicons:user" className="w-5 h-5 text-blue-500" />
                Cadet Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Cadet</label>
                  <p className="text-gray-900">{initialData?.cadet?.name || `Cadet #${initialData?.cadet_id}`}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Course</label>
                  <p className="text-gray-900">{initialData?.course?.name || `Course #${initialData?.course_id}`}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Semester</label>
                  <p className="text-gray-900">{initialData?.semester?.name || `Semester #${initialData?.semester_id}`}</p>
                </div>
              </div>
            </div>

            {/* Examination Details */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="hugeicons:airplane-take-off-01" className="w-5 h-5 text-blue-500" />
                Examination Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Exercise (Mission) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editData.ftw_12sqn_flying_syllabus_exercise_id}
                    onChange={(e) => handleEditChange("ftw_12sqn_flying_syllabus_exercise_id", parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!formData.syllabus_id}
                  >
                    <option value={0}>Select Exercise</option>
                    {exercises.map(exercise => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.exercise_shortname} - ({exercise.phase_type_name})
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
                    onChange={(e) => handleEditChange("instructor_id", parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={0}>Select Instructor</option>
                    {instructors.map(instructor => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.name || (instructor as any).instructor_biodata?.name || `Instructor #${instructor.id}`}
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
                    onChange={(e) => handleEditChange("phase_type_id", parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Select Phase Type</option>
                    {phaseTypes.map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.type_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">Date</label>
                  <DatePicker
                    value={editData.participate_date}
                    onChange={(e) => handleEditChange("participate_date", e.target.value)}
                    placeholder="dd/mm/yyyy"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Marks & Results */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="hugeicons:chart-line-data-01" className="w-5 h-5 text-blue-500" />
                Marks & Results
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-2">Achieved Mark</label>
                  <input
                    type="text"
                    value={editData.achieved_mark}
                    onChange={(e) => handleEditChange("achieved_mark", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter mark"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">Time (H:MM)</label>
                  <input
                    type="text"
                    value={getTimeInputValue("edit-time", editData.achieved_time)}
                    onChange={(e) => handleTimeInputChange("edit-time", e.target.value)}
                    onBlur={() => handleTimeInputBlur("edit-time", undefined, "achieved_time", true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="0:00"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">Present</label>
                  <select
                    value={editData.is_present ? "true" : "false"}
                    onChange={(e) => handleEditChange("is_present", e.target.value === "true")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                {!editData.is_present && (
                  <div className="md:col-span-3">
                    <label className="block font-medium text-gray-700 mb-2">Absent Reason</label>
                    <input
                      type="text"
                      value={editData.absent_reason}
                      onChange={(e) => handleEditChange("absent_reason", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter reason for absence"
                    />
                  </div>
                )}

                <div className="md:col-span-3">
                  <label className="block font-medium text-gray-700 mb-2">Remark</label>
                  <textarea
                    value={editData.remark}
                    onChange={(e) => handleEditChange("remark", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter any remarks"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editData.is_active ? "true" : "false"}
                    onChange={(e) => handleEditChange("is_active", e.target.value === "true")}
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
          /* Create Mode - Cadets List */
          <div>
            {!filtersSelected ? (
              <div className="text-center py-12 text-gray-500">
                <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
                <p>Please select Course and Semester to load cadets</p>
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
                      <th className="border border-black px-3 py-2 text-center" rowSpan={2}>BD/No</th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Name</th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Branch</th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={2}>
                        Mission<span className="text-red-500">*</span>
                      </th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={2}>
                        Date<span className="text-red-500">*</span>
                      </th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={2}>
                        Instructor<span className="text-red-500">*</span>
                      </th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Syl Hrs</th>
                      <th className="border border-black px-3 py-2 text-center" colSpan={2}>hrs Flown</th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Mark</th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={2}>Remark</th>
                    </tr>
                    <tr>
                      <th className="border border-black px-2 py-2 text-center">Solo</th>
                      <th className="border border-black px-2 py-2 text-center">Dual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cadetRows.map((cadet, index) => (
                      <tr key={cadet.cadet_id} className={!cadet.is_active ? "bg-gray-100 opacity-50" : ""}>
                        <td className="border border-black px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={cadet.is_active}
                            onChange={() => toggleCadetActive(index)}
                            className="w-4 h-4 text-blue-600 border-black rounded focus:ring-blue-500 cursor-pointer mx-auto block"
                          />
                        </td>
                        <td className="border border-black px-3 py-2 whitespace-nowrap text-gray-900 text-center">
                          {cadet.cadet_bd_no}
                        </td>
                        <td className="border border-black px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                          {cadet.cadet_name}
                        </td>
                        <td className="border border-black px-3 py-2 whitespace-nowrap text-gray-900 text-center">
                          {cadet.cadet_branch}
                        </td>
                        <td className="border border-black px-2 py-1">
                          <select
                            value={cadet.mission_id}
                            onChange={(e) => handleCadetChange(index, "mission_id", parseInt(e.target.value))}
                            disabled={!cadet.is_active || !formData.syllabus_id}
                            className="w-full px-2 py-1 border border-black rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          >
                            <option value={0}>
                              {!formData.syllabus_id ? "Select Phase first" : "Select Exercise"}
                            </option>
                            {exercises.map(exercise => (
                              <option key={exercise.id} value={exercise.id}>
                                {exercise.exercise_shortname} - ({exercise.phase_type_name})
                              </option>
                            ))}
                          </select>
                        </td>
                        {cadet.existing_mark_info?.exists ? (
                          <td className="border border-black px-4 py-3 text-center bg-red-50" colSpan={7}>
                            <span className="text-red-600 font-medium">
                              Already checked on {cadet.existing_mark_info.date ? new Date(cadet.existing_mark_info.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                            </span>
                          </td>
                        ) : (
                          <>
                            <td className="border border-black px-2 py-1">
                              <DatePicker
                                value={cadet.date}
                                onChange={(e) => handleCadetChange(index, "date", e.target.value)}
                                disabled={!cadet.is_active}
                                placeholder="dd/mm/yyyy"
                                className="w-full px-2 py-1 border border-black rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                              />
                            </td>
                            <td className="border border-black px-2 py-1">
                              <select
                                value={cadet.instructor_id}
                                onChange={(e) => handleCadetChange(index, "instructor_id", parseInt(e.target.value))}
                                disabled={!cadet.is_active}
                                className="w-full px-2 py-1 border border-black rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                              >
                                <option value={0}>Select</option>
                                {instructors.map(instructor => (
                                  <option key={instructor.id} value={instructor.id}>
                                    {instructor.name || (instructor as any).instructor_biodata?.name || `Instructor #${instructor.id}`}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-black px-3 py-2 text-center">
                              {cadet.mission_id ? (exercises.find(ex => ex.id === cadet.mission_id)?.take_time_hours || "-") : "-"}
                            </td>
                            <td className="border border-black px-2 py-1">
                              {(() => {
                                const { isDual } = getExercisePhaseType(cadet.mission_id);
                                return (
                                  <input
                                    type="text"
                                    value={getTimeInputValue(`cadet-solo-${index}`, cadet.hrs_solo)}
                                    onChange={(e) => handleTimeInputChange(`cadet-solo-${index}`, e.target.value)}
                                    onBlur={() => handleTimeInputBlur(`cadet-solo-${index}`, index, "hrs_solo")}
                                    disabled={!cadet.is_active || !cadet.mission_id || isDual}
                                    placeholder="0:00"
                                    className="w-20 px-2 py-1 border border-black rounded text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                  />
                                );
                              })()}
                            </td>
                            <td className="border border-black px-2 py-1">
                              {(() => {
                                const { isSolo } = getExercisePhaseType(cadet.mission_id);
                                return (
                                  <input
                                    type="text"
                                    value={getTimeInputValue(`cadet-dual-${index}`, cadet.hrs_dual)}
                                    onChange={(e) => handleTimeInputChange(`cadet-dual-${index}`, e.target.value)}
                                    onBlur={() => handleTimeInputBlur(`cadet-dual-${index}`, index, "hrs_dual")}
                                    disabled={!cadet.is_active || !cadet.mission_id || isSolo}
                                    placeholder="0:00"
                                    className="w-20 px-2 py-1 border border-black rounded text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                  />
                                );
                              })()}
                            </td>
                            <td className="border border-black px-2 py-1">
                              <input
                                type="text"
                                value={cadet.mark}
                                onChange={(e) => handleCadetChange(index, "mark", e.target.value)}
                                disabled={!cadet.is_active}
                                className="w-24 px-2 py-1 border border-black rounded text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                              />
                            </td>
                            <td className="border border-black px-2 py-1">
                              <input
                                type="text"
                                value={cadet.remark}
                                onChange={(e) => handleCadetChange(index, "remark", e.target.value)}
                                disabled={!cadet.is_active}
                                className="w-full px-2 py-1 border border-black rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
}
          </div>
        )}
      </div>

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
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? "Saving..." : isEdit ? "Update Mark" : "Submit All Marks"}
        </button>
      </div>
    </form>
  );
}
