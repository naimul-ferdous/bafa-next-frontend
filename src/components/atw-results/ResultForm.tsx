/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Label from "@/components/form/Label";
import { cadetService } from "@/libs/services/cadetService";
import { commonService } from "@/libs/services/commonService";
import { atwResultService } from "@/libs/services/atwResultService";
import { atwInstructorAssignSubjectService } from "@/libs/services/atwInstructorAssignSubjectService";
import { atwSubjectGroupService } from "@/libs/services/atwSubjectGroupService";
import { useAuth } from "@/libs/hooks/useAuth";
import { Icon } from "@iconify/react";
import type { SystemCourse, SystemSemester, SystemProgram, SystemProgramChangeableSemester, SystemExam, AtwSubjectsModuleMarksheetMark, AtwSubjectModule } from "@/libs/types/system";
import type { AtwResult } from "@/libs/types/atwResult";
import Link from "next/link";

interface ResultFormProps {
  initialData?: AtwResult | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

interface CadetRow {
  id?: number;
  cadet_id: number;
  cadet_bd_no: string;
  cadet_name: string;
  cadet_rank: string;
  cadet_branch: string;
  gender?: string;
  remarks: string;
  is_present: boolean;
  absent_reason: string;
  is_active: boolean;
  marks: { [markId: number]: number | string };
}

// Group marks by type
interface MarkGroup {
  type: string;
  marks: AtwSubjectsModuleMarksheetMark[];
}

export default function ResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const { user, userIsSystemAdmin } = useAuth();
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    program_id: 0,
    system_programs_changeable_semester_id: null as number | null,
    exam_type_id: 0,
    atw_subject_id: 0, // This will store the Subject Module ID
    instructor_id: 0,
    is_active: true,
  });

  useEffect(() => {
    if (!initialData && user?.id) {
      setFormData(prev => ({ ...prev, instructor_id: user.id }));
    }
  }, [user, initialData]);

  const [cadetRows, setCadetRows] = useState<CadetRow[]>([]);
  const [error, setError] = useState("");
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [existingResultId, setExistingResultId] = useState<number | null>(null);

  // Check if record already exists
  useEffect(() => {
    const checkExistence = async () => {
      if (isEdit) return; // Don't check existence in edit mode
      
      if (
        formData.course_id &&
        formData.semester_id &&
        formData.program_id &&
        formData.exam_type_id &&
        formData.atw_subject_id &&
        formData.instructor_id
      ) {
        try {
          const { exists, id } = await atwResultService.checkExistence({
            course_id: formData.course_id,
            semester_id: formData.semester_id,
            program_id: formData.program_id,
            ...(formData.system_programs_changeable_semester_id
              ? { system_programs_changeable_semester_id: formData.system_programs_changeable_semester_id }
              : { changeable_semester_null: true }
            ),
            exam_type_id: formData.exam_type_id,
            atw_subject_id: formData.atw_subject_id,
            instructor_id: formData.instructor_id
          });

          if (exists) {
            setAlreadyExists(true);
            setExistingResultId(id ?? null);
            if (error !== "This result has already been entered for the selected criteria.") {
              setError("This result has already been entered for the selected criteria.");
            }
          } else {
            setAlreadyExists(false);
            setExistingResultId(null);
            if (error === "This result has already been entered for the selected criteria.") {
              setError("");
            }
          }
        } catch (err) {
          console.error("Failed to check result existence:", err);
        }
      } else {
        setAlreadyExists(false);
        if (error === "This result has already been entered for the selected criteria.") {
          setError("");
        }
      }
    };

    checkExistence();
  }, [
    formData.course_id,
    formData.semester_id,
    formData.program_id,
    formData.system_programs_changeable_semester_id,
    formData.exam_type_id,
    formData.atw_subject_id,
    formData.instructor_id,
    isEdit,
    error
  ]);

  // Dropdown data
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);
  // Tracks which program IDs can show as a base (non-changeable) option; null = no restriction (admin)
  const [baseAllowedProgramIds, setBaseAllowedProgramIds] = useState<Set<number> | null>(null);
  const [subjectMappings, setSubjectMappings] = useState<AtwSubjectModule[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  // Selected subject for marks
  const [selectedSubjectMapping, setSelectedSubjectMapping] = useState<AtwSubjectModule | null>(null);
  const [markGroups, setMarkGroups] = useState<MarkGroup[]>([]);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const options = await commonService.getResultOptions();

        if (options) {
          let coursesList = options.courses;

          // programs now include changeable_semesters from getResultOptions
          let programsList: SystemProgram[] = options.programs;

          if (!userIsSystemAdmin && user?.id) {
            // Fetch UNIQUE courses and programs from instructor assignments
            try {
              const res = await atwInstructorAssignSubjectService.getAll({
                instructor_id: user.id,
                per_page: 1000
              });

              if (res && res.data && res.data.length > 0) {
                const assignedCourseIds = new Set(res.data.map((as: any) => Number(as.course_id)));
                const assignedProgramIds = new Set(res.data.map((as: any) => Number(as.program_id)));
                const assignedChangeableIds = new Set(
                  res.data
                    .filter((as: any) => as.system_programs_changeable_semester_id != null)
                    .map((as: any) => Number(as.system_programs_changeable_semester_id))
                );
                const programsWithBaseAssignments = new Set(
                  res.data
                    .filter((as: any) => as.system_programs_changeable_semester_id == null)
                    .map((as: any) => Number(as.program_id))
                );
                coursesList = options.courses.filter(c => assignedCourseIds.has(Number(c.id)));
                programsList = options.programs
                  .filter(p => assignedProgramIds.has(Number(p.id)))
                  .map(p => ({
                    ...p,
                    changeable_semesters: (p.changeable_semesters || []).filter(
                      (cs: SystemProgramChangeableSemester) => assignedChangeableIds.has(Number(cs.id))
                    )
                  }));
                setBaseAllowedProgramIds(programsWithBaseAssignments);
              } else {
                // Try alternate method
                const instructorAssignments = await atwInstructorAssignSubjectService.getByInstructor(user.id);
                if (instructorAssignments && instructorAssignments.length > 0) {
                  const assignedCourseIds = new Set(instructorAssignments.map((as: any) => Number(as.course_id)));
                  const assignedProgramIds = new Set(instructorAssignments.map((as: any) => Number(as.program_id)));
                  const assignedChangeableIds = new Set(
                    instructorAssignments
                      .filter((as: any) => as.system_programs_changeable_semester_id != null)
                      .map((as: any) => Number(as.system_programs_changeable_semester_id))
                  );
                  const programsWithBaseAssignments = new Set(
                    instructorAssignments
                      .filter((as: any) => as.system_programs_changeable_semester_id == null)
                      .map((as: any) => Number(as.program_id))
                  );
                  coursesList = options.courses.filter(c => assignedCourseIds.has(Number(c.id)));
                  programsList = options.programs
                    .filter(p => assignedProgramIds.has(Number(p.id)))
                    .map(p => ({
                      ...p,
                      changeable_semesters: (p.changeable_semesters || []).filter(
                        (cs: SystemProgramChangeableSemester) => assignedChangeableIds.has(Number(cs.id))
                      )
                    }));
                  setBaseAllowedProgramIds(programsWithBaseAssignments);
                }
              }
            } catch (err) {
              console.error("Failed to fetch instructor assignments for course/program filtering:", err);
            }
          }

          setCourses(coursesList);
          setPrograms(programsList);
          setExams(options.exams);
        }
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, [user, userIsSystemAdmin]);

  // Logic to load subject mappings based on context
  const loadSubjects = useCallback(async () => {
    if (!formData.course_id || !formData.semester_id || !formData.program_id) {
      setSubjectMappings([]);
      return;
    }

    try {
      let modules: AtwSubjectModule[] = [];

      const changeableFilter = formData.system_programs_changeable_semester_id
        ? { system_programs_changeable_semester_id: formData.system_programs_changeable_semester_id }
        : { changeable_semester_null: true };

      if (userIsSystemAdmin) {
        // Admin: Load subjects available for this Semester + Program
        const response = await atwSubjectGroupService.getAllSubjectGroups({
          semester_id: formData.semester_id,
          program_id: formData.program_id,
          ...changeableFilter,
          per_page: 500,
        });

        modules = response.data
          .map(g => g.module)
          .filter((m): m is AtwSubjectModule => !!m && !!m.id);
      } else if (user?.id) {
        // Instructor: Load assigned subjects from service
        const response = await atwInstructorAssignSubjectService.getAll({
          instructor_id: user.id,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: formData.program_id,
          ...changeableFilter,
          per_page: 500
        });

        modules = response.data
          .map((as: any) => as.subject || as.module || (as.subject_id ? { id: as.subject_id, ...as.subject } : null))
          .filter((m: any) => m && m.id && (m.subject_name || m.name));

        // Fallback to user object if service returns empty
        if (modules.length === 0 && (user as any).atw_assigned_subjects) {
          modules = (user as any).atw_assigned_subjects
            .filter((as: any) => 
              Number(as.course_id) === Number(formData.course_id) &&
              Number(as.semester_id) === Number(formData.semester_id) &&
              Number(as.program_id) === Number(formData.program_id)
            )
            .map((as: any) => as.subject || as.module)
            .filter((m: any) => m && m.id && (m.subject_name || m.name));
        }
      }

      // If in Edit mode, ensure the subject from initialData is in the list
      if (isEdit && initialData?.subject) {
        const initialSubject = initialData.subject;
        if (!modules.find(m => m.id === initialSubject.id)) {
          modules.push(initialSubject);
        }
      }

      const uniqueModules = modules.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setSubjectMappings(uniqueModules);
    } catch (err) {
      console.error("Failed to load subjects:", err);
    }
  }, [formData.course_id, formData.semester_id, formData.program_id, formData.system_programs_changeable_semester_id, userIsSystemAdmin, user, isEdit, initialData]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    if (formData.atw_subject_id) {
      const subjectModule = subjectMappings.find(s => s.id === formData.atw_subject_id);
      setSelectedSubjectMapping(subjectModule || null);

      if (subjectModule?.marksheet?.marks) {
        const groups: { [key: string]: AtwSubjectsModuleMarksheetMark[] } = {};
        subjectModule.marksheet.marks.forEach(mark => {
          const type = mark.type || "Other";
          if (!groups[type]) groups[type] = [];
          groups[type].push(mark);
        });
        setMarkGroups(Object.entries(groups).map(([type, marks]) => ({ type, marks })));
        setFormData(prev => ({ ...prev, atw_subject_module_id: subjectModule.id } as any));
      } else {
        // Fallback: if we are in Edit mode and the initialData has the subject with marks
        if (isEdit && initialData?.subject?.id === formData.atw_subject_id && initialData.subject.marksheet?.marks) {
          const fallbackModule = initialData.subject;
          setSelectedSubjectMapping(fallbackModule);
          const groups: { [key: string]: AtwSubjectsModuleMarksheetMark[] } = {};
          fallbackModule.marksheet.marks.forEach((mark: any) => {
            const type = mark.type || "Other";
            if (!groups[type]) groups[type] = [];
            groups[type].push(mark);
          });
          setMarkGroups(Object.entries(groups).map(([type, marks]) => ({ type, marks })));
          setFormData(prev => ({ ...prev, atw_subject_module_id: fallbackModule.id } as any));
        } else {
          setMarkGroups([]);
          setFormData(prev => ({ ...prev, atw_subject_module_id: 0 } as any));
        }
      }
    } else {
      setSelectedSubjectMapping(null);
      setMarkGroups([]);
      setFormData(prev => ({ ...prev, atw_subject_module_id: 0 } as any));
    }
  }, [formData.atw_subject_id, subjectMappings, isEdit, initialData]);

  // Auto-load cadets when filters change
  useEffect(() => {
    const loadCadets = async () => {
      // Only load if required filters are selected
      if (!formData.course_id || !formData.semester_id || !formData.program_id || !formData.atw_subject_id) {
        setCadetRows([]);
        return;
      }

      try {
        setLoadingCadets(true);

        // Get ALL cadets assigned to this course, semester, program where is_current is true
        // If a changeable program is selected (e.g. BSc in Engineering), filter by that too
        const cadetsRes = await cadetService.getAllCadets({
          per_page: 500,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: formData.program_id,
          ...(formData.system_programs_changeable_semester_id
            ? { changeable_program_id: formData.system_programs_changeable_semester_id }
            : { exclude_changeable: 1 }),
          is_current: 1
        });
        
        const cadetsList = cadetsRes.data;

        // Create cadet rows
        const rows: CadetRow[] = cadetsList.filter(c => c).map(cadet => {
          const currentRank = cadet.assigned_ranks?.find((ar: any) => ar.is_current || ar.rank)?.rank;
          const branchName =
            cadet.assigned_branchs?.find((ab: any) => ab.is_current)?.branch?.name ||
            cadet.assigned_branchs?.[0]?.branch?.name ||
            "N/A";
          return {
            cadet_id: cadet.id,
            cadet_bd_no: cadet.bd_no || cadet.cadet_number || "",
            cadet_name: cadet.name,
            cadet_rank: currentRank?.short_name || currentRank?.name || "-",
            cadet_branch: branchName,
            gender: cadet.gender,
            remarks: "",
            is_present: true,
            absent_reason: "",
            is_active: true,
            marks: {},
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
  }, [formData.course_id, formData.semester_id, formData.program_id, formData.atw_subject_id, initialData]);

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        course_id: initialData.course_id,
        semester_id: initialData.semester_id,
        program_id: initialData.program_id,
        system_programs_changeable_semester_id: initialData.system_programs_changeable_semester_id ?? null,
        exam_type_id: initialData.exam_type_id,
        atw_subject_id: initialData.atw_subject_id || initialData.atw_subject_module_id || 0,
        instructor_id: initialData.instructor_id || 0,
        is_active: initialData.is_active,
      });

      if (initialData.result_getting_cadets && initialData.result_getting_cadets.length > 0) {
        const rows: CadetRow[] = initialData.result_getting_cadets.map(c => {
          const marks: { [markId: number]: number } = {};
          c.cadet_marks?.forEach(m => {
            marks[m.atw_subjects_module_marksheet_mark_id] = Number(m.achieved_mark) || 0;
          });
          const currentRank = c.cadet?.assigned_ranks?.find((ar: any) => ar.rank)?.rank;
          return {
            id: c.id,
            cadet_id: c.cadet_id,
            cadet_bd_no: c.cadet_bd_no,
            cadet_name: c.cadet?.name || "Unknown",
            cadet_rank: currentRank?.short_name || currentRank?.name || "-",
            cadet_branch: c.cadet?.assigned_branchs?.find((ab: any) => ab.is_current)?.branch?.name || c.cadet?.assigned_branchs?.[0]?.branch?.name || initialData.branch?.name || "N/A",
            gender: c.cadet?.gender,
            remarks: c.remarks || "",
            is_present: c.is_present,
            absent_reason: c.absent_reason || "",
            is_active: c.is_active,
            marks,
          };
        });
        setCadetRows(rows);
      }
    }
  }, [initialData]);

  // Fetch semesters when course changes
  useEffect(() => {
    if (!formData.course_id) {
      setSemesters([]);
      return;
    }
    const fetchSemesters = async () => {
      setLoadingSemesters(true);
      const semestersList = await commonService.getSemestersByCourse(formData.course_id);
      setSemesters(semestersList);
      if (semestersList.length === 1) {
        setFormData(prev => ({ ...prev, semester_id: semestersList[0].id }));
      } else if (semestersList.length > 0 && !isEdit) {
        setFormData(prev => ({ ...prev, semester_id: semestersList[0].id }));
      }
      setLoadingSemesters(false);
    };
    fetchSemesters();
  }, [formData.course_id, isEdit]);

  // Get changeable program options for selected semester (SubjectForm pattern)
  const getChangeableOptions = (): { csId: number; programId: number; label: string }[] => {
    if (!formData.semester_id) return [];
    const result: { csId: number; programId: number; label: string }[] = [];
    programs.forEach(p => {
      p.changeable_semesters?.forEach((cs: SystemProgramChangeableSemester) => {
        if (cs.semester_id === formData.semester_id) {
          result.push({ csId: cs.id, programId: p.id, label: `${cs.name} (${cs.code})` });
        }
      });
    });
    return result;
  };

  // Encoded select value (SubjectForm pattern)
  const progSelectValue = formData.system_programs_changeable_semester_id
    ? `cs:${formData.system_programs_changeable_semester_id}:${formData.program_id}`
    : formData.program_id === 0 ? '0' : String(formData.program_id);

  const handleProgramChange = (val: string) => {
    if (!val || val === '0') {
      setFormData(prev => ({ ...prev, program_id: 0, system_programs_changeable_semester_id: null, atw_subject_id: 0 }));
      return;
    }
    if (val.startsWith('cs:')) {
      const parts = val.split(':');
      setFormData(prev => ({ ...prev, system_programs_changeable_semester_id: Number(parts[1]), program_id: Number(parts[2]), atw_subject_id: 0 }));
    } else {
      setFormData(prev => ({ ...prev, program_id: Number(val), system_programs_changeable_semester_id: null, atw_subject_id: 0 }));
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field === 'course_id') {
      setFormData(prev => ({ ...prev, [field]: value, semester_id: 0, program_id: 0, system_programs_changeable_semester_id: null, atw_subject_id: 0 }));
    } else if (field === 'semester_id') {
      setFormData(prev => ({ ...prev, [field]: value, program_id: 0, system_programs_changeable_semester_id: null, atw_subject_id: 0 }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleMarkChange = (cadetIndex: number, markId: number, value: number | string) => {
    setCadetRows(prev => {
      const updated = [...prev];
      updated[cadetIndex] = {
        ...updated[cadetIndex],
        marks: { ...updated[cadetIndex].marks, [markId]: value }
      };
      return updated;
    });
  };

  const handlePresentChange = (cadetIndex: number, isPresent: boolean) => {
    setCadetRows(prev => {
      const updated = [...prev];
      updated[cadetIndex] = {
        ...updated[cadetIndex],
        is_present: isPresent,
        marks: isPresent ? updated[cadetIndex].marks : {}
      };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.course_id || !formData.semester_id || !formData.program_id || !formData.atw_subject_id) {
      setError("Please fill in all required fields.");
      return;
    }

    const moduleId = selectedSubjectMapping?.id;
    if (!moduleId) {
      setError("Critical Error: Linked module not found for this subject.");
      return;
    }

    try {
      const submitData = {
        ...formData,
        system_programs_changeable_semester_id: formData.system_programs_changeable_semester_id ?? null,
        atw_subject_module_id: moduleId, // Ensure module ID is sent
        cadets: cadetRows.filter(c => c.cadet_id > 0).map(c => {
          const allMarksList = selectedSubjectMapping?.marksheet?.marks || [];
          const combinedMarks = allMarksList.filter(m => m.is_combined);
          return {
            cadet_id: c.cadet_id,
            cadet_bd_no: c.cadet_bd_no,
            remarks: c.remarks || undefined,
            is_present: c.is_present,
            absent_reason: c.is_present ? undefined : c.absent_reason,
            is_active: c.is_active,
            marks: [
              ...Object.entries(c.marks).map(([markId, achievedMark]) => ({
                atw_subject_module_id: moduleId,
                atw_subjects_module_marksheet_mark_id: parseInt(markId),
                achieved_mark: typeof achievedMark === "number" ? achievedMark : (parseFloat(achievedMark as string) || 0),
                is_active: true,
              })),
              ...(c.is_present ? combinedMarks.map(m => ({
                atw_subject_module_id: moduleId,
                atw_subjects_module_marksheet_mark_id: m.id,
                achieved_mark: calcCombinedValue(m, c.marks),
                is_active: true,
              })) : []),
            ],
          };
        }),
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} result`);
    }
  };

  // Set of mark IDs that are referenced by a combined mark (should be excluded from total)
  const refMarkIds = useMemo(() => {
    const marks = selectedSubjectMapping?.marksheet?.marks || [];
    return new Set(marks.flatMap(m =>
      m.is_combined && m.combined_cols ? m.combined_cols.map(c => c.referenced_mark_id) : []
    ));
  }, [selectedSubjectMapping]);

  // Map of mark ID → mark object for combined value lookups
  const marksById = useMemo(() => {
    const marks = selectedSubjectMapping?.marksheet?.marks || [];
    return Object.fromEntries(marks.map(m => [m.id, m]));
  }, [selectedSubjectMapping]);

  // Calculate a combined mark's auto value: best (n-1) of n referenced inputs, scaled to combined_percentage
  const calcCombinedValue = (mark: AtwSubjectsModuleMarksheetMark, cadetMarkValues: { [markId: number]: number | string }): number => {
    if (!mark.combined_cols || mark.combined_cols.length === 0) return 0;
    const bestCount = mark.combined_cols.length - 1;
    if (bestCount <= 0) return 0;
    const refValues = mark.combined_cols.map(col => {
      const refMark = marksById[col.referenced_mark_id];
      const val = cadetMarkValues[col.referenced_mark_id];
      const inputVal = val !== undefined && val !== "" ? parseFloat(String(val)) || 0 : 0;
      const estMark = Number(refMark?.estimate_mark) || 0;
      return { inputVal, estMark };
    });
    refValues.sort((a, b) => b.inputVal - a.inputVal);
    const best = refValues.slice(0, bestCount);
    const sumInputs = best.reduce((acc, r) => acc + r.inputVal, 0);
    const sumEstimates = best.reduce((acc, r) => acc + r.estMark, 0);
    if (sumEstimates === 0) return sumInputs;
    return (sumInputs / sumEstimates) * Number(mark.percentage);
  };

  const filtersSelected = formData.course_id && formData.semester_id && formData.program_id;
  const subjectSelected = formData.atw_subject_id > 0;

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
        {/* Basic Information */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:file-01" className="w-5 h-5 text-blue-500" />
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Course <span className="text-red-500">*</span></Label>
              <select value={formData.course_id} onChange={(e) => handleChange("course_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" required disabled={isEdit}>
                <option value={0}>Select Course</option>
                {courses.map(course => (<option key={course.id} value={course.id}>{course.name} ({course.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Semester <span className="text-red-500">*</span></Label>
              <select
                value={formData.semester_id}
                onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                required
                disabled={isEdit || !formData.course_id || loadingSemesters || (!!formData.course_id && !loadingSemesters && semesters.length === 0) || (semesters.length === 1)}
              >
                {loadingSemesters ? (
                  <option value={0}>Loading semesters...</option>
                ) : !formData.course_id ? (
                  <option value={0}>Select Course First</option>
                ) : semesters.length === 0 ? (
                  <option value={0}>No semester on this course</option>
                ) : semesters.length === 1 ? (
                  <option value={semesters[0].id}>{semesters[0].name} ({semesters[0].code})</option>
                ) : (
                  <>
                    <option value={0}>Select Semester</option>
                    {semesters.map(semester => (
                      <option key={semester.id} value={semester.id}>{semester.name} ({semester.code})</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div>
              <Label>Program <span className="text-red-500">*</span></Label>
              <select value={progSelectValue} onChange={(e) => handleProgramChange(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" required disabled={isEdit}>
                <option value={0}>Select Program</option>
                {programs
                  .filter(p => !baseAllowedProgramIds || baseAllowedProgramIds.has(Number(p.id)))
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                {getChangeableOptions().map(c => (
                  <option key={`cs-${c.csId}`} value={`cs:${c.csId}:${c.programId}`}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Exam Type <span className="text-red-500">*</span></Label>
              <select value={formData.exam_type_id} onChange={(e) => handleChange("exam_type_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" required disabled={isEdit}>
                <option value={0}>Select Exam Type</option>
                {exams.map(exam => (<option key={exam.id} value={exam.id}>{exam.name} ({exam.code})</option>))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Subject <span className="text-red-500">*</span></Label>
              <select value={formData.atw_subject_id} onChange={(e) => handleChange("atw_subject_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 font-semibold disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" required disabled={isEdit}>
                <option value={0}>Select Subject</option>
                {subjectMappings.map(s => (<option key={s.id} value={s.id}>{s.subject_name || (s as any).name} ({s.subject_code || (s as any).code})</option>))}
              </select>
            </div>
          </div>
        </div>

        {/* Marks Table */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:note-edit" className="w-5 h-5 text-blue-500" />
            Result Marks Entry
            {selectedSubjectMapping && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ~ {selectedSubjectMapping.subject_name || (selectedSubjectMapping as any).name} ({selectedSubjectMapping.subject_code || (selectedSubjectMapping as any).code})
              </span>
            )}
          </h3>

          {!filtersSelected ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
              <p>Please select Course, Semester, and Program to load cadets</p>
            </div>
          ) : !subjectSelected ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:book-02" className="w-10 h-10 mx-auto mb-2" />
              <p>Please select a Subject to see mark columns</p>
            </div>
          ) : alreadyExists ? (
            <div className="text-center py-12 text-red-500 bg-red-50 rounded-lg border border-red-100">
              <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-2" />
              <p className="font-semibold text-lg uppercase tracking-wider">Already Result Map inputed</p>
              <p className="text-sm">A result for these criteria already exists in the system.</p>
              {existingResultId && (
                <div className="mt-3">
                  <Link href={`/atw/results/${existingResultId}/edit`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                    Edit Existing Result
                  </Link>
                </div>
              )}
            </div>
          ) : loadingCadets ? (
            <div className="w-full min-h-[20vh] flex items-center justify-center">
              <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
            </div>
          ) : cadetRows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:user-group" className="w-10 h-10 mx-auto mb-2" />
              <p>No cadets found for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  {/* First header row - Mark type groups (single-col groups span all 3 rows) */}
                  <tr>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={3}>SL</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={3}>BD NO.</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={3}>RANK</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={3}>NAME</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={3}>BRANCH</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={3}>PRESENT</th>
                    {markGroups.map(group => {
                      const colSpan = group.marks.reduce((acc, m) => acc + (!m.is_combined && Number(m.estimate_mark) !== Number(m.percentage) ? 2 : 1), 0);
                      if (colSpan === 1) {
                        const m = group.marks[0];
                        const est = Number(m.estimate_mark);
                        const pct = Number(m.percentage);
                        return (
                          <th key={group.type} className="border border-black px-2 py-1 text-center font-semibold uppercase min-w-[100px]" rowSpan={3}>
                            <div className="text-xs">{m.name}</div>
                            <div className="text-xs font-bold">{(!m.is_combined && est !== pct) ? `${est}/${pct}` : pct}</div>
                          </th>
                        );
                      }
                      return (
                        <th key={group.type} className="border border-black px-3 py-2 text-center font-semibold uppercase" colSpan={colSpan}>
                          {group.type}
                        </th>
                      );
                    })}
                    <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={3}>TOTAL</th>
                  </tr>
                  {/* Second header row - mark names for multi-col groups only */}
                  <tr>
                    {markGroups.flatMap(group => {
                      const colSpan = group.marks.reduce((acc, m) => acc + (!m.is_combined && Number(m.estimate_mark) !== Number(m.percentage) ? 2 : 1), 0);
                      if (colSpan === 1) return [];
                      return group.marks.map(mark => (
                        <th key={mark.id}
                          className="border border-black px-2 py-2 text-center"
                          colSpan={!mark.is_combined && Number(mark.estimate_mark) !== Number(mark.percentage) ? 2 : 1}
                        >
                          <div className="text-xs font-medium uppercase">{mark.name}</div>
                        </th>
                      ));
                    })}
                  </tr>
                  {/* Third header row - sub-labels for multi-col groups only */}
                  <tr>
                    {markGroups.flatMap(group => {
                      const colSpan = group.marks.reduce((acc, m) => acc + (!m.is_combined && Number(m.estimate_mark) !== Number(m.percentage) ? 2 : 1), 0);
                      if (colSpan === 1) return [];
                      return group.marks.map(mark => {
                        if (!mark.is_combined && Number(mark.estimate_mark) !== Number(mark.percentage)) {
                          return (
                            <React.Fragment key={`sub-${mark.id}`}>
                              <th className="border border-black px-1 py-1 text-center w-[80px] min-w-[80px] max-w-[80px]">{Number(mark.estimate_mark).toFixed(0)}</th>
                              <th className="border border-black px-1 py-1 text-center w-[80px] min-w-[80px] max-w-[80px]">{Number(mark.percentage).toFixed(0)}</th>
                            </React.Fragment>
                          );
                        }
                        return (
                          <th key={`sub-${mark.id}`} className="border border-black px-1 py-1 text-center w-[100px] min-w-[100px] max-w-[100px]">
                            {Number(mark.percentage).toFixed(0)}
                          </th>
                        );
                      });
                    })}
                  </tr>
                </thead>
                <tbody>
                  {cadetRows.map((cadet, index) => {
                    // Calculate row total — referenced marks excluded (combined replaces them)
                    const rowTotal = markGroups.reduce((acc, group) => {
                      return acc + group.marks.reduce((groupAcc, mark) => {
                        if (refMarkIds.has(mark.id)) return groupAcc; // skip — counted via combined
                        if (mark.is_combined) {
                          return groupAcc + (cadet.is_present ? calcCombinedValue(mark, cadet.marks) : 0);
                        }
                        const markVal = cadet.marks[mark.id];
                        const inputMark = markVal !== undefined && markVal !== "" ? parseFloat(String(markVal)) || 0 : 0;
                        let adjustedMark = inputMark;
                        if (Number(mark.estimate_mark) !== Number(mark.percentage) && mark.estimate_mark > 0) {
                          adjustedMark = (inputMark / mark.estimate_mark) * mark.percentage;
                        }
                        return groupAcc + (cadet.is_present ? adjustedMark : 0);
                      }, 0);
                    }, 0);

                    return (
                      <tr key={cadet.cadet_id} className="hover:bg-gray-50 transition-colors">
                        <td className="border border-black px-3 py-2 text-center font-medium">{index + 1}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadet.cadet_bd_no}</td>
                        <td className="border border-black px-3 py-2 text-center">{cadet.cadet_rank}</td>
                        <td className={`border border-black px-3 py-2 font-medium ${!cadet.is_present ? 'text-red-500 italic' : ''}`}>
                          {cadet.cadet_name} {cadet.gender === 'female' && <span className="text-pink-600 font-bold ml-1">(F)</span>}
                        </td>
                        <td className="border border-black px-3 py-2 text-center">{cadet.cadet_branch}</td>
                        <td className="border border-black px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={cadet.is_present}
                            onChange={(e) => handlePresentChange(index, e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                          />
                        </td>
                        {markGroups.flatMap(group =>
                          group.marks.map(mark => {
                            const markVal = cadet.marks[mark.id];
                            const inputMark = markVal !== undefined && markVal !== "" ? parseFloat(String(markVal)) || 0 : 0;
                            const isSplit = !mark.is_combined && Number(mark.estimate_mark) !== Number(mark.percentage);

                            if (mark.is_combined) {
                              const combinedVal = cadet.is_present ? calcCombinedValue(mark, cadet.marks) : 0;
                              return (
                                <td key={mark.id} className={`border border-black px-2 py-1 text-center w-[100px] min-w-[100px] max-w-[100px] font-bold ${!cadet.is_present ? "bg-gray-200 text-gray-400" : "bg-blue-50 text-blue-800"}`}>
                                  {cadet.is_present ? combinedVal.toFixed(2) : "—"}
                                </td>
                              );
                            }

                            if (isSplit) {
                              const convertedValue = mark.estimate_mark > 0 ? (inputMark / mark.estimate_mark) * mark.percentage : 0;
                              return (
                                <React.Fragment key={mark.id}>
                                  <td className={`border border-black px-2 py-1 text-center w-[80px] min-w-[80px] max-w-[80px] ${!cadet.is_present ? "bg-gray-200" : ""}`}>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      pattern="[0-9]*\.?[0-9]*"
                                      value={cadet.is_present ? (cadet.marks[mark.id] !== undefined ? cadet.marks[mark.id] : "") : ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "") {
                                          handleMarkChange(index, mark.id, "");
                                          return;
                                        }
                                        if (/^\d*\.?\d*$/.test(val)) {
                                          const inputValue = parseFloat(val);
                                          if (!isNaN(inputValue) && inputValue > mark.estimate_mark) {
                                            handleMarkChange(index, mark.id, mark.estimate_mark);
                                          } else {
                                            handleMarkChange(index, mark.id, val);
                                          }
                                        }
                                      }}
                                      onBlur={(e) => {
                                        const val = e.target.value;
                                        if (val !== "") {
                                          const parsed = parseFloat(val);
                                          if (!isNaN(parsed)) {
                                            handleMarkChange(index, mark.id, parsed);
                                          } else {
                                            handleMarkChange(index, mark.id, "");
                                          }
                                        }
                                      }}
                                      disabled={!cadet.is_present}
                                      className={`w-full px-2 py-1 border rounded text-center text-sm font-bold focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!cadet.is_present
                                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed border-transparent"
                                        : "border-gray-300 bg-white"
                                        }`}
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className={`border border-black px-2 py-1 text-center text-gray-900 w-[80px] min-w-[80px] max-w-[80px] ${!cadet.is_present ? "bg-gray-200" : ""}`}>
                                    {convertedValue.toFixed(2)}
                                  </td>
                                </React.Fragment>
                              );
                            } else {
                              return (
                                <td key={mark.id} className={`border border-black px-2 py-1 text-center w-[100px] min-w-[100px] max-w-[100px] ${!cadet.is_present ? "bg-gray-200" : ""}`}>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="[0-9]*\.?[0-9]*"
                                    value={cadet.is_present ? (cadet.marks[mark.id] !== undefined ? cadet.marks[mark.id] : "") : ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "") {
                                        handleMarkChange(index, mark.id, "");
                                        return;
                                      }
                                      if (/^\d*\.?\d*$/.test(val)) {
                                        const inputValue = parseFloat(val);
                                        if (!isNaN(inputValue) && inputValue > mark.estimate_mark) {
                                          handleMarkChange(index, mark.id, mark.estimate_mark);
                                        } else {
                                          handleMarkChange(index, mark.id, val);
                                        }
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const val = e.target.value;
                                      if (val !== "") {
                                        const parsed = parseFloat(val);
                                        if (!isNaN(parsed)) {
                                          handleMarkChange(index, mark.id, parsed);
                                        } else {
                                          handleMarkChange(index, mark.id, "");
                                        }
                                      }
                                    }}
                                    disabled={!cadet.is_present}
                                    className={`w-full px-2 py-1 border rounded text-center text-sm font-bold focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!cadet.is_present
                                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed border-transparent"
                                      : "border-gray-300 bg-white"
                                      }`}
                                    placeholder="0"
                                  />
                                </td>
                              );
                            }
                          })
                        )}
                        <td className="border border-black px-3 py-2 text-center font-black">
                          {(Number(rowTotal) || 0).toFixed(2)} ~ {Math.ceil(Number(rowTotal) || 0)}
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
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-100 transition-colors" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className={`px-6 py-2 text-white rounded-xl flex items-center gap-2 shadow-md transition-all ${alreadyExists ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`} disabled={loading || alreadyExists}>
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Result" : "Save Result")}
        </button>
      </div>
    </form>
  );
}
