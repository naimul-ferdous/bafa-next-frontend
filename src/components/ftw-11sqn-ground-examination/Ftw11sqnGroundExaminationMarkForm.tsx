/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/libs/hooks/useAuth";
import { ftw11sqnGroundExaminationMarkService } from "@/libs/services/ftw11sqnGroundExaminationMarkService";
import type { SystemCourse, SystemSemester, SystemExam } from "@/libs/types/system";
import type { User, CadetProfile } from "@/libs/types/user";
import type { Ftw11sqnGroundSyllabus, Ftw11sqnGroundSyllabusExercise } from "@/libs/types/ftw11sqnFlying";
import DatePicker from "@/components/form/input/DatePicker";
import GroundEditMarkModal from "./GroundEditMarkModal";

interface ExerciseWithGroundInfo extends Ftw11sqnGroundSyllabusExercise {
  ground_type_id: number;
  ground_type_name: string;
  syllabus_id: number;
  ground_sort?: number;
}

interface GroundRow {
  exercise_id: number;
  exercise_shortname: string;
  exercise_name: string;
  ground_type_id: number;
  ground_type_name: string;
  syllabus_id: number;
  ground_sort?: number;
  exercise_sort?: number;
  is_active: boolean;
  date: string;
  instructor_id: number;
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

export default function Ftw11sqnGroundExaminationMarkForm({
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
    exam_type_id: isEdit ? (initialData?.exam_type_id || 0) : 0,
    syllabus_id: isEdit ? (initialData?.ftw_11sqn_ground_syllabus_id || 0) : 0,
    selected_cadet_id: 0,
  });

  const [selectedGroundIds, setSelectedGroundIds] = useState<number[]>([]);

  const [editData, setEditData] = useState({
    ftw_11sqn_ground_syllabus_exercise_id:
      initialData?.ftw_11sqn_ground_syllabus_exercise_id || 0,
    instructor_id: initialData?.instructor_id || defaultInstructorId,
    achieved_mark: initialData?.achieved_mark || "",
    achieved_time: initialData?.achieved_time || "",
    participate_date: initialData?.participate_date || "",
    is_present: initialData?.is_present ?? true,
    absent_reason: initialData?.absent_reason || "",
    remark: initialData?.remark || "",
    is_active: initialData?.is_active ?? true,
  });

  const [groundRows, setGroundRows] = useState<GroundRow[]>([]);
  const [error, setError] = useState("");
  const [timeInputs, setTimeInputs] = useState<{ [key: string]: string }>({});

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExerciseForEdit, setSelectedExerciseForEdit] = useState<GroundRow | null>(null);

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
    field?: "time" | "achieved_time",
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
      handleGroundRowChange(exerciseId, field as keyof GroundRow, timeStr);
    }

    setTimeInputs((prev) => ({ ...prev, [key]: timeStr }));
  };

  const getTimeInputValue = (key: string, defaultValue: string): string => {
    if (timeInputs[key] !== undefined) return timeInputs[key];
    return defaultValue || "0:00";
  };

  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [syllabuses, setSyllabuses] = useState<Ftw11sqnGroundSyllabus[]>([]);
  const [allCadets, setAllCadets] = useState<CadetProfile[]>([]);
  const [exercises, setExercises] = useState<ExerciseWithGroundInfo[]>([]);
  const [instructorAssignedGrounds, setInstructorAssignedGrounds] = useState<any[]>([]);
  const [instructorAssignedExercises, setInstructorAssignedExercises] = useState<number[]>([]);
  const [instructorAssignedCadets, setInstructorAssignedCadets] = useState<{ id: number; name: string; bd_no?: string; cadet_number?: string }[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [loadingExistingMarks, setLoadingExistingMarks] = useState(false);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoadingInitial(true);

        const formDataResponse = await ftw11sqnGroundExaminationMarkService.getFormData({
          instructor_id: isInstructor && user ? user.id : undefined,
        });

        if (formDataResponse) {
          setCourses(formDataResponse.courses || []);
          setSemesters(formDataResponse.semesters || []);
          setExams(formDataResponse.exams || []);
          setSyllabuses(formDataResponse.syllabuses || []);

          const mappedInstructors = (formDataResponse.instructors || []).map((inst: any) => ({
            ...inst,
            id: inst.id,
            name: inst.name || inst.name_bangla || `Instructor #${inst.id}`,
          }));
          setInstructors(mappedInstructors);

          if (formDataResponse.instructor_assigned) {
            setInstructorAssignedGrounds(formDataResponse.instructor_assigned.grounds || []);
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

  useEffect(() => {
    const fetchCadets = async () => {
      if (!formData.course_id || !formData.semester_id) {
        setAllCadets([]);
        return;
      }
      try {
        const formDataResponse = await ftw11sqnGroundExaminationMarkService.getFormData({
          instructor_id: isInstructor && user ? user.id : undefined,
          semester_id: formData.semester_id,
          course_id: formData.course_id,
        });

        if (formDataResponse?.cadets) {
          setAllCadets(formDataResponse.cadets);
        }
      } catch (err) {
        console.error("Failed to fetch cadets:", err);
      }
    };
    fetchCadets();
  }, [formData.course_id, formData.semester_id, isInstructor, user]);

  const filteredCadets = useMemo(() => {
    if (!formData.course_id || !formData.semester_id) return [];
    const isRestricted = !userIsSuperAdmin && !userIsSystemAdmin;

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

    // For instructors, filter to only show assigned cadets
    if (isInstructor && instructorAssignedCadets.length > 0) {
      const cadetIds = new Set(instructorAssignedCadets.map(c => c.id));
      return allCadets.filter(cadet => cadetIds.has(cadet.id));
    }

    if (userWingIds.length === 0) return allCadets;

    return allCadets.filter((cadet) => {
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
    user,
    userIsSuperAdmin,
    userIsSystemAdmin,
    isInstructor,
    instructorAssignedCadets,
  ]);

  useEffect(() => {
    const loadExercises = async () => {
      if (selectedGroundIds.length === 0) {
        setExercises([]);
        return;
      }
      try {
        setLoadingExercises(true);
        const allExercises: ExerciseWithGroundInfo[] = [];

        selectedGroundIds.forEach((syllabusId) => {
          const selectedSyllabus = syllabuses.find((s) => s.id === syllabusId);
          if (!selectedSyllabus) return;

          selectedSyllabus.exercises?.forEach((exercise) => {
            if (exercise.is_active) {
              allExercises.push({
                ...exercise,
                ground_type_id: selectedSyllabus.ftw_11sqn_ground_type_id || 0,
                ground_type_name: selectedSyllabus.ground_full_name || selectedSyllabus.ground_shortname || "",
                syllabus_id: syllabusId,
                ground_sort: selectedSyllabus.ground_sort || 0,
              });
            }
          });
        });

        allExercises.sort((a, b) => {
          const aSort = a.ground_sort || 0;
          const bSort = b.ground_sort || 0;
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
  }, [selectedGroundIds, syllabuses]);

  useEffect(() => {
    if (isEdit) return;
    if (!formData.selected_cadet_id || exercises.length === 0) {
      setGroundRows([]);
      return;
    }

    const exercisesToShow = selectedGroundIds.length > 0
      ? exercises.filter((ex) => selectedGroundIds.includes(ex.syllabus_id))
      : exercises;

    if (exercisesToShow.length === 0) {
      setGroundRows([]);
      return;
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayStr = `${dd}/${mm}/${yyyy}`;

    const rows: GroundRow[] = exercisesToShow.map((ex) => ({
      exercise_id: ex.id,
      exercise_shortname: ex.exercise_shortname,
      exercise_name: ex.exercise_name,
      ground_type_id: ex.ground_type_id,
      ground_type_name: ex.ground_type_name,
      syllabus_id: ex.syllabus_id,
      ground_sort: ex.ground_sort,
      exercise_sort: ex.exercise_sort,
      is_active: false,
      date: todayStr,
      instructor_id: defaultInstructorId,
      mark: "",
      time: "0:00",
      remark: "",
      existing_mark_info: undefined,
    }));

    setGroundRows(rows);

    if (formData.course_id && formData.semester_id && formData.exam_type_id) {
      const fetchExistingMarks = async () => {
        setLoadingExistingMarks(true);
        try {
          const result = await ftw11sqnGroundExaminationMarkService.getCadetMarks({
            cadet_id: formData.selected_cadet_id,
            course_id: formData.course_id,
            semester_id: formData.semester_id,
            exam_type_id: formData.exam_type_id,
          });

          if (result.marks && result.marks.length > 0) {
            const marksMap = new Map();
            result.marks.forEach((m) => {
              marksMap.set(m.ftw_11sqn_ground_syllabus_exercise_id, m);
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
            setGroundRows(updated);
          }
        } catch (error) {
          console.error('Failed to fetch existing marks:', error);
        } finally {
          setLoadingExistingMarks(false);
        }
      };
      fetchExistingMarks();
    }
    setTimeInputs({});
  }, [
    formData.selected_cadet_id,
    exercises,
    selectedGroundIds,
    formData.course_id,
    formData.semester_id,
    formData.exam_type_id,
    isEdit,
    defaultInstructorId,
  ]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "semester_id") {
        updated.syllabus_id = 0;
        updated.selected_cadet_id = 0;
      }
      if (field === "syllabus_id") {
        updated.selected_cadet_id = 0;
      }
      return updated;
    });
  };

  const handleGroundCheckboxChange = (groundId: number, checked: boolean) => {
    setSelectedGroundIds((prev) => {
      if (checked) {
        return [...prev, groundId];
      } else {
        return prev.filter((id) => id !== groundId);
      }
    });
  };

  const handleSelectAllGrounds = (checked: boolean) => {
    if (checked) {
      const availableGroundIds = syllabuses
        .filter((s) => {
          if (formData.semester_id && s.semester_id !== formData.semester_id) return false;
          return true;
        })
        .map((s) => s.id);
      setSelectedGroundIds(availableGroundIds);
    } else {
      setSelectedGroundIds([]);
    }
  };

  const handleGroundRowChange = (
    exerciseId: number,
    field: keyof GroundRow,
    value: any
  ) => {
    setGroundRows((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((r) => r.exercise_id === exerciseId);
      if (idx === -1) return prev;
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const toggleGroundActive = (exerciseId: number) => {
    setGroundRows((prev) => {
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

  const handleUpdateExistingMark = async (row: GroundRow) => {
    if (!row.existing_mark_info?.exists || !row.existing_mark_info.id) return;
    const markInfo = row.existing_mark_info;

    try {
      const submitData = {
        ftw_11sqn_ground_syllabus_id: row.syllabus_id,
        ftw_11sqn_ground_syllabus_exercise_id: row.exercise_id,
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        instructor_id: markInfo.instructor_id || row.instructor_id,
        cadet_id: formData.selected_cadet_id,
        exam_type_id: formData.exam_type_id || null,
        achieved_mark: markInfo.achieved_mark,
        achieved_time: markInfo.achieved_time,
        participate_date: markInfo.date,
        is_present: true,
        remark: markInfo.remark || "",
        is_active: true,
      };

      await ftw11sqnGroundExaminationMarkService.updateMark(markInfo.id as number, submitData);

      setGroundRows((prev) => prev.map((r) => {
        if (r.exercise_id === row.exercise_id) {
          return {
            ...r,
            existing_mark_info: {
              exists: true,
              id: markInfo.id,
              date: markInfo.date,
              achieved_mark: markInfo.achieved_mark,
              achieved_time: markInfo.achieved_time,
              instructor_id: markInfo.instructor_id,
              remark: markInfo.remark,
            },
          };
        }
        return r;
      }));

      setError("");
    } catch (err: any) {
      const msg = err?.message || "";
      if (!msg.toLowerCase().includes("success")) {
        console.error("Failed to update mark:", err);
        setError(msg || "Failed to update mark");
      } else {
        setError("");
      }
    }
  };

  const handleEditChange = (field: string, value: any) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.course_id) { setError("Please select a course"); return; }
    if (!formData.semester_id) { setError("Please select a semester"); return; }
    if (selectedGroundIds.length === 0) { setError("Please select at least one ground"); return; }

    try {
      if (isEdit) {
        if (!editData.ftw_11sqn_ground_syllabus_exercise_id) {
          setError("Please select an exercise");
          return;
        }
        if (!editData.instructor_id) {
          setError("Please select an instructor");
          return;
        }

        const submitData = {
          ftw_11sqn_ground_syllabus_id: formData.syllabus_id,
          ftw_11sqn_ground_syllabus_exercise_id:
            editData.ftw_11sqn_ground_syllabus_exercise_id,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: initialData?.program_id || null,
          branch_id: initialData?.branch_id || null,
          group_id: initialData?.group_id || null,
          instructor_id: editData.instructor_id,
          cadet_id: initialData?.cadet_id,
          exam_type_id: formData.exam_type_id || null,
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
        if (!formData.selected_cadet_id) {
          setError("Please select a cadet");
          return;
        }

        const marks: any[] = groundRows
          .filter(
            (r) =>
              r.is_active &&
              r.exercise_id > 0 &&
              !r.existing_mark_info?.exists
          )
          .map((r) => ({
            cadet_id: formData.selected_cadet_id,
            ftw_11sqn_ground_syllabus_id: r.syllabus_id,
            ftw_11sqn_ground_syllabus_exercise_id: r.exercise_id,
            instructor_id: r.instructor_id,
            exam_type_id: formData.exam_type_id || null,
            achieved_mark: r.mark,
            achieved_time: r.time,
            participate_date: r.date,
            is_present: true,
            remark: r.remark,
            is_active: true,
          }));

        if (marks.length === 0) {
          setError(
            "Please select at least one ground exercise row (checkbox) to submit"
          );
          return;
        }

        const submitData = {
          course_id: formData.course_id,
          semester_id: formData.semester_id,
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
    formData.course_id && formData.semester_id && selectedGroundIds.length > 0;

  const selectedCadet = filteredCadets.find(
    (c) => c.id === formData.selected_cadet_id
  );

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

              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Exam Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.exam_type_id}
                  onChange={(e) =>
                    handleChange("exam_type_id", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>Select Exam Type</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name} ({exam.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Ground (Syllabus) <span className="text-red-500">*</span>
                </label>
                {loadingExercises && (
                  <p className="mb-2 text-blue-500 flex items-center gap-1 text-sm">
                    <Icon
                      icon="hugeicons:fan-01"
                      className="w-3 h-3 animate-spin"
                    />
                    Loading exercises...
                  </p>
                )}
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                  <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-200">
                    <input
                      type="checkbox"
                      checked={
                        selectedGroundIds.length > 0 &&
                        syllabuses.filter((s) => {
                          if (formData.semester_id && s.semester_id !== formData.semester_id) return false;
                          return true;
                        }).length === selectedGroundIds.length
                      }
                      onChange={(e) => handleSelectAllGrounds(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-700 text-sm">Select All</span>
                  </div>
                  <div className="space-y-2">
                    {syllabuses
                      .filter((s) => {
                        if (formData.semester_id && s.semester_id !== formData.semester_id)
                          return false;
                        return true;
                      })
                      .map((syllabus) => (
                        <div key={syllabus.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedGroundIds.includes(syllabus.id)}
                            onChange={(e) =>
                              handleGroundCheckboxChange(syllabus.id, e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700 text-sm">
                            {syllabus.ground_full_name} ({syllabus.ground_shortname})
                          </span>
                        </div>
                      ))}
                  </div>
                  {syllabuses.filter((s) => {
                    if (formData.semester_id && s.semester_id !== formData.semester_id) return false;
                    return true;
                  }).length === 0 && (
                      <p className="text-gray-500 text-sm py-2">No grounds available</p>
                    )}
                </div>
                {selectedGroundIds.length > 0 && (
                  <p className="mt-1 text-sm text-blue-600">
                    {selectedGroundIds.length} ground(s) selected
                  </p>
                )}
              </div>
            </div>
          </div>

          {!isEdit && (
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="hugeicons:user" className="w-5 h-5 text-blue-500" />
                Cadet Selection
              </h3>
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
                      ? "Select Course, Semester & Ground first"
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
            </div>
          )}

          {isEdit ? (
            <div className="space-y-6">
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

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon
                    icon="hugeicons:book-02"
                    className="w-5 h-5 text-blue-500"
                  />
                  Examination Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Exercise <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editData.ftw_11sqn_ground_syllabus_exercise_id}
                      onChange={(e) =>
                        handleEditChange(
                          "ftw_11sqn_ground_syllabus_exercise_id",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value={0}>Select Exercise</option>
                      {exercises.map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>
                          {exercise.exercise_shortname} - {exercise.exercise_name}
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
            <div>
              {!filtersSelected ? (
                <div className="text-center py-12 text-gray-500">
                  <Icon
                    icon="hugeicons:filter"
                    className="w-10 h-10 mx-auto mb-2"
                  />
                  <p>
                    Please select Course, Semester and Ground to load exercises
                  </p>
                </div>
              ) : !formData.selected_cadet_id ? (
                <div className="text-center py-12 text-gray-500">
                  <Icon
                    icon="hugeicons:user"
                    className="w-10 h-10 mx-auto mb-2"
                  />
                  <p>Please select a cadet to view their assigned grounds</p>
                </div>
              ) : loadingExistingMarks ? (
                <div className="text-center py-8 text-blue-500">
                  <Icon
                    icon="hugeicons:fan-01"
                    className="w-8 h-8 animate-spin mx-auto mb-2"
                  />
                  <p className="text-sm">Checking existing marks…</p>
                </div>
              ) : groundRows.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Icon
                    icon="hugeicons:book-02"
                    className="w-10 h-10 mx-auto mb-2"
                  />
                  <p>No grounds found for the selected ground</p>
                </div>
              ) : (
                <>
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
                      {groundRows.length} exercise(s) in this ground
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th
                            className="border border-black px-3 py-2 text-center"
                            rowSpan={2}
                          >
                            SEL
                          </th>
                          <th
                            className="border border-black px-3 py-2 text-left"
                            rowSpan={2}
                          >
                            Exercise
                          </th>
                          <th
                            className="border border-black px-3 py-2 text-center"
                            rowSpan={2}
                          >
                            Ground
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
                            Mark
                          </th>
                          <th
                            className="border border-black px-3 py-2 text-center"
                            rowSpan={2}
                          >
                            Time
                          </th>
                          <th
                            className="border border-black px-3 py-2 text-center"
                            rowSpan={2}
                          >
                            Remark
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {groundRows.map((row) => (
                          <tr
                            key={row.exercise_id}
                            className={
                              !row.is_active
                                ? "bg-gray-100 opacity-50"
                                : row.existing_mark_info?.exists
                                  ? "bg-yellow-50"
                                  : ""
                            }
                          >
                            <td className="border border-black px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={row.is_active}
                                onChange={() => toggleGroundActive(row.exercise_id)}
                                disabled={row.existing_mark_info?.exists}
                                className="w-4 h-4 text-blue-600 border-black rounded focus:ring-blue-500 cursor-pointer mx-auto block"
                              />
                            </td>
                            <td className="border border-black px-3 py-2 text-left">
                            <div className="font-medium text-gray-900">
                              {row.exercise_shortname}
                            </div>
                            <div className="text-xs text-gray-500">
                              {row.exercise_name}
                            </div>
                          </td>
                          <td className="border border-black px-3 py-2 text-center text-gray-700">
                            {row.ground_type_name}
                          </td>
                          {row.existing_mark_info?.exists ? (
                            <td
                              className="border border-black px-4 py-3 text-center bg-yellow-50"
                              colSpan={5}
                            >
                              <div className="text-amber-700 font-medium text-sm">
                                <p>
                                  Already submitted on{" "}
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
                                    Mark: {row.existing_mark_info.achieved_mark}
                                    {row.existing_mark_info.achieved_time &&
                                      ` · Time: ${row.existing_mark_info.achieved_time}`}
                                  </p>
                                )}
                              </div>
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
                              </div>
                            </td>
                          ) : (
                            <>
                              <td className="border border-black px-2 py-1">
                                <DatePicker
                                  value={row.date}
                                  onChange={(e) =>
                                    handleGroundRowChange(
                                      row.exercise_id,
                                      "date",
                                      e.target.value
                                    )
                                  }
                                  disabled={!row.is_active}
                                  placeholder="dd/mm/yyyy"
                                  className="w-full px-2 py-1 border border-black rounded text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                />
                              </td>
                              <td className="border border-black px-2 py-1">
                                <select
                                  value={row.instructor_id}
                                  onChange={(e) =>
                                    handleGroundRowChange(
                                      row.exercise_id,
                                      "instructor_id",
                                      parseInt(e.target.value)
                                    )
                                  }
                                  disabled={!row.is_active}
                                  className="w-full px-2 py-1 border border-black rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                >
                                  <option value={0}>Select</option>
                                  {instructors.map((instructor) => (
                                    <option key={instructor.id} value={instructor.id}>
                                      {instructor.name ||
                                        `Instructor #${instructor.id}`}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="border border-black px-2 py-1">
                                <input
                                  type="text"
                                  value={row.mark}
                                  onChange={(e) =>
                                    handleGroundRowChange(
                                      row.exercise_id,
                                      "mark",
                                      e.target.value
                                    )
                                  }
                                  disabled={!row.is_active}
                                  placeholder="0"
                                  className="w-20 px-2 py-1 border border-black rounded text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                />
                              </td>
                              <td className="border border-black px-2 py-1">
                                <input
                                  type="text"
                                  value={getTimeInputValue(`ground-time-${row.exercise_id}`, row.time)}
                                  onChange={(e) =>
                                    handleTimeInputChange(`ground-time-${row.exercise_id}`, e.target.value)
                                  }
                                  onBlur={() =>
                                    handleTimeInputBlur(
                                      `ground-time-${row.exercise_id}`,
                                      row.exercise_id,
                                      "time"
                                    )
                                  }
                                  disabled={!row.is_active}
                                  placeholder="0:00"
                                  className="w-20 px-2 py-1 border border-black rounded text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                />
                              </td>
                              <td className="border border-black px-2 py-1">
                                <input
                                  type="text"
                                  value={row.remark}
                                  onChange={(e) =>
                                    handleGroundRowChange(
                                      row.exercise_id,
                                      "remark",
                                      e.target.value
                                    )
                                  }
                                  disabled={!row.is_active}
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
                </>
              )}
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

      <GroundEditMarkModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedExerciseForEdit(null); }}
        selectedExercise={selectedExerciseForEdit}
        onUpdate={(row) => {
          handleUpdateExistingMark(row);
          setShowEditModal(false);
          setSelectedExerciseForEdit(null);
        }}
      />
    </>
  );
}
