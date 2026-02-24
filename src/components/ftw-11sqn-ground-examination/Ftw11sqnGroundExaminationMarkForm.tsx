/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/libs/hooks/useAuth";
import { commonService } from "@/libs/services/commonService";
import type { SystemCourse, SystemSemester, SystemExam } from "@/libs/types/system";
import type { User, CadetProfile } from "@/libs/types/user";
import DatePicker from "@/components/form/input/DatePicker";
import { Ftw11sqnGroundSyllabus, Ftw11sqnGroundSyllabusExercise } from "@/libs/types/ftw11sqnFlying";

interface CadetRow {
  cadet_id: number;
  cadet_bd_no: string;
  cadet_name: string;
  is_active: boolean;
  exercise_id: number;
  date: string;
  instructor_id: number;
  mark: string;
  time: string;
  remark: string;
}

interface BulkFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
  initialData?: any;
}

export default function Ftw11sqnGroundExaminationMarkForm({ onSubmit, onCancel, loading, isEdit = false, initialData }: BulkFormProps) {
  const { user, userIsSuperAdmin, userIsSystemAdmin } = useAuth();
  const [formData, setFormData] = useState({
    course_id: isEdit ? (initialData?.course_id || 0) : 0,
    semester_id: isEdit ? (initialData?.semester_id || 0) : 0,
    exam_type_id: isEdit ? (initialData?.exam_type_id || 0) : 0,
    syllabus_id: isEdit ? (initialData?.ftw_11sqn_ground_syllabus_id || 0) : 0,
  });

  // Single record edit state
  const [editData, setEditData] = useState({
    ftw_11sqn_ground_syllabus_exercise_id: initialData?.ftw_11sqn_ground_syllabus_exercise_id || 0,
    instructor_id: initialData?.instructor_id || 0,
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

  // Dropdown data
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [syllabuses, setSyllabuses] = useState<Ftw11sqnGroundSyllabus[]>([]);
  const [allCadets, setAllCadets] = useState<CadetProfile[]>([]);
  const [exercises, setExercises] = useState<Ftw11sqnGroundSyllabusExercise[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [loadingCadets, setLoadingCadets] = useState(false);

  // Load dropdown data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingInitial(true);
        const options = await commonService.getResultOptions();

        if (options) {
          setCourses(options.courses.filter(c => c.is_active));
          setSemesters(options.semesters.filter(s => s.is_active && s.is_academic));
          setExams(options.exams.filter(e => e.is_active));
          setInstructors(options.instructors);
          setSyllabuses(options.ftw11sqn_ground_syllabuses);
          setAllCadets(options.cadets);
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitialData();
  }, []);

  // Filtered cadets based on course, semester, and user's wing/subwing assignments
  const filteredCadets = useMemo(() => {
    if (!formData.course_id || !formData.semester_id) return [];
    
    // Get user's assigned wings and subwings
    const userWingIds = user?.roleAssignments?.map(ra => ra.wing_id).filter(id => id != null) || [];
    const userSubWingIds = user?.roleAssignments?.map(ra => ra.sub_wing_id).filter(id => id != null) || [];
    const isRestricted = !userIsSuperAdmin && !userIsSystemAdmin;

    return allCadets.filter(cadet => {
      // Basic Course/Semester filtering
      const hasCourse = cadet.assigned_courses?.some(ac => ac.course_id === formData.course_id);
      const hasSemester = cadet.assigned_semesters?.some(as => as.semester_id === formData.semester_id);
      
      if (!hasCourse || !hasSemester) return false;

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
  }, [allCadets, formData.course_id, formData.semester_id, user, userIsSuperAdmin, userIsSystemAdmin]);

  // Sync cadet rows when filtered cadets change
  useEffect(() => {
    if (isEdit) return;

    setLoadingCadets(true);
    const rows: CadetRow[] = filteredCadets.map(cadet => ({
      cadet_id: cadet.id,
      cadet_bd_no: cadet.bd_no || cadet.cadet_number || "",
      cadet_name: cadet.name,
      is_active: true,
      exercise_id: 0,
      date: "",
      instructor_id: 0,
      mark: "",
      time: "",
      remark: "",
    }));

    setCadetRows(rows);
    setLoadingCadets(false);
  }, [filteredCadets, isEdit]);

  // Load exercises when syllabus is selected
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

        // Extract ALL exercises from the selected syllabus
        const allExercises: Ftw11sqnGroundSyllabusExercise[] = [];
        if (selectedSyllabus.exercises && Array.isArray(selectedSyllabus.exercises)) {
          selectedSyllabus.exercises.forEach(exercise => {
            if (exercise.is_active) {
              allExercises.push(exercise);
            }
          });
        }

        setExercises(allExercises);
      } catch (err) {
        console.error("Failed to load exercises:", err);
        setError("Failed to load exercises");
      } finally {
        setLoadingExercises(false);
      }
    };

    loadExercises();
  }, [formData.syllabus_id, syllabuses]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const toggleCadetActive = (cadetIndex: number) => {
    setCadetRows(prev => {
      const updated = [...prev];
      updated[cadetIndex] = {
        ...updated[cadetIndex],
        is_active: !updated[cadetIndex].is_active
      };
      return updated;
    });
  };

  const handleEditChange = (field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.course_id) { setError("Please select a course"); return; }
    if (!formData.semester_id) { setError("Please select a semester"); return; }
    if (!formData.syllabus_id) { setError("Please select a syllabus"); return; }
    if (!formData.exam_type_id) { setError("Please select an exam type"); return; }

    try {
      if (isEdit) {
        // Edit mode - submit single record
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
          ftw_11sqn_ground_syllabus_exercise_id: editData.ftw_11sqn_ground_syllabus_exercise_id,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: initialData?.program_id || null,
          instructor_id: editData.instructor_id,
          cadet_id: initialData?.cadet_id,
          exam_type_id: formData.exam_type_id,
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
        cadetRows.filter(c => c.is_active && c.cadet_id > 0).forEach(c => {
          marks.push({
            cadet_id: c.cadet_id,
            ftw_11sqn_ground_syllabus_id: formData.syllabus_id,
            ftw_11sqn_ground_syllabus_exercise_id: c.exercise_id,
            instructor_id: c.instructor_id,
            exam_type_id: formData.exam_type_id,
            achieved_mark: c.mark,
            achieved_time: c.time,
            participate_date: c.date,
            is_present: true,
            remark: c.remark,
            is_active: true,
          });
        });

        const submitData = {
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          marks: marks,
        };

        await onSubmit(submitData);
      }
    } catch (err: any) {
      setError(err.message || (isEdit ? "Failed to update mark" : "Failed to create marks"));
    }
  };

  const filtersSelected = formData.course_id && formData.semester_id;

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.course_id}
                onChange={(e) => handleChange("course_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                required
                disabled={isEdit}
              >
                <option value={0}>Select Course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.semester_id}
                onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                required
                disabled={isEdit}
              >
                <option value={0}>Select Semester</option>
                {semesters.map(semester => (
                  <option key={semester.id} value={semester.id}>{semester.name} ({semester.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Syllabus <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.syllabus_id}
                onChange={(e) => handleChange("syllabus_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Select Syllabus</option>
                {syllabuses.map(syllabus => (
                  <option key={syllabus.id} value={syllabus.id}>
                    {syllabus.ground_full_name} ({syllabus.ground_shortname})
                  </option>
                ))}
              </select>
              {loadingExercises && formData.syllabus_id > 0 && (
                <p className="mt-1 text-xs text-blue-500 flex items-center gap-1">
                  <Icon icon="hugeicons:fan-01" className="w-3 h-3 animate-spin" />
                  Loading exercises...
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.exam_type_id}
                onChange={(e) => handleChange("exam_type_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Select Exam Type</option>
                {exams.map(exam => (
                  <option key={exam.id} value={exam.id}>{exam.name} ({exam.code})</option>
                ))}
              </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cadet</label>
                  <p className="text-gray-900">{initialData?.cadet?.name || `Cadet #${initialData?.cadet_id}`}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <p className="text-gray-900">{initialData?.course?.name || `Course #${initialData?.course_id}`}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <p className="text-gray-900">{initialData?.semester?.name || `Semester #${initialData?.semester_id}`}</p>
                </div>
              </div>
            </div>

            {/* Examination Details */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="hugeicons:book-02" className="w-5 h-5 text-blue-500" />
                Examination Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exercise <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editData.ftw_11sqn_ground_syllabus_exercise_id}
                    onChange={(e) => handleEditChange("ftw_11sqn_ground_syllabus_exercise_id", parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!formData.syllabus_id}
                  >
                    <option value={0}>Select Exercise</option>
                    {exercises.map(exercise => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.exercise_name} ({exercise.exercise_shortname})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        {instructor.name || `Instructor #${instructor.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achieved Mark</label>
                  <input
                    type="text"
                    value={editData.achieved_mark}
                    onChange={(e) => handleEditChange("achieved_mark", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter mark"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time (Hours)</label>
                  <input
                    type="text"
                    value={editData.achieved_time}
                    onChange={(e) => handleEditChange("achieved_time", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Present</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Absent Reason</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remark</label>
                  <textarea
                    value={editData.remark}
                    onChange={(e) => handleEditChange("remark", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter any remarks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
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
            ) : loadingCadets ? (
              <div className="w-full min-h-[20vh] flex items-center justify-center">
                <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
              </div>
            ) : cadetRows.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Icon icon="hugeicons:user-group" className="w-10 h-10 mx-auto mb-2" />
                <p>No cadets found for the selected course and semester</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-center uppercase text-xs">CADET</th>
                      <th className="border border-gray-300 px-3 py-2 text-center uppercase text-xs">
                        EXERCISE<span className="text-red-500">*</span>
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center uppercase text-xs">
                        DATE<span className="text-red-500">*</span>
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center uppercase text-xs">
                        INSTRUCTOR<span className="text-red-500">*</span>
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center uppercase text-xs">MARK</th>
                      <th className="border border-gray-300 px-3 py-2 text-center uppercase text-xs">TIME</th>
                      <th className="border border-gray-300 px-3 py-2 text-center uppercase text-xs">REMARK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cadetRows.map((cadet, index) => (
                      <tr key={cadet.cadet_id} className={!cadet.is_active ? "bg-gray-100 opacity-50" : ""}>
                        <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleCadetActive(index)}
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                cadet.is_active ? "bg-green-500" : "bg-gray-300"
                              }`}
                            >
                              {cadet.is_active && <Icon icon="hugeicons:tick-02" className="w-3 h-3 text-white" />}
                            </button>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{cadet.cadet_name}</div>
                              <div className="text-xs text-gray-500">{cadet.cadet_bd_no}</div>
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <select
                            value={cadet.exercise_id}
                            onChange={(e) => handleCadetChange(index, "exercise_id", parseInt(e.target.value))}
                            disabled={!cadet.is_active || !formData.syllabus_id}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          >
                            <option value={0}>
                              {!formData.syllabus_id ? "Select Syllabus first" : "Select Exercise"}
                            </option>
                            {exercises.map(exercise => (
                              <option key={exercise.id} value={exercise.id}>
                                {exercise.exercise_name} ({exercise.exercise_shortname})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <DatePicker
                            value={cadet.date}
                            onChange={(e) => handleCadetChange(index, "date", e.target.value)}
                            disabled={!cadet.is_active}
                            placeholder="dd/mm/yyyy"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <select
                            value={cadet.instructor_id}
                            onChange={(e) => handleCadetChange(index, "instructor_id", parseInt(e.target.value))}
                            disabled={!cadet.is_active}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          >
                            <option value={0}>Select</option>
                            {instructors.map(instructor => (
                              <option key={instructor.id} value={instructor.id}>
                                {instructor.name || `Instructor #${instructor.id}`}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={cadet.mark}
                            onChange={(e) => handleCadetChange(index, "mark", e.target.value)}
                            disabled={!cadet.is_active}
                            placeholder="0"
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={cadet.time}
                            onChange={(e) => handleCadetChange(index, "time", e.target.value)}
                            disabled={!cadet.is_active}
                            placeholder="0.00"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={cadet.remark}
                            onChange={(e) => handleCadetChange(index, "remark", e.target.value)}
                            disabled={!cadet.is_active}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
  );
}
