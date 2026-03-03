/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type {
  AtwAssessmentCounselingResult,
  AtwAssessmentCounselingResultCreateData,
  AtwAssessmentCounselingType,
  AtwAssessmentCounselingEvent
} from "@/libs/types/atwAssessmentCounseling";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup, SystemExam } from "@/libs/types/system";
import { commonService } from "@/libs/services/commonService";
import { atwAssessmentCounselingTypeService } from "@/libs/services/atwAssessmentCounselingTypeService";
import { cadetService } from "@/libs/services/cadetService";
import { atwInstructorAssignCadetService } from "@/libs/services/atwInstructorAssignCadetService";
import { atwAssessmentCounselingResultService } from "@/libs/services/atwAssessmentCounselingResultService";
import { useAuth } from "@/libs/hooks/useAuth";
import DatePicker from "@/components/form/input/DatePicker";

interface ResultFormProps {
  initialData?: AtwAssessmentCounselingResult | null;
  onSubmit: (data: AtwAssessmentCounselingResultCreateData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function ResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const { user } = useAuth();
  const isInstructor = !!user?.instructor_biodata;
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    program_id: 0,
    branch_id: 0,
    group_id: 0,
    exam_type_id: 0,
    atw_assessment_counseling_type_id: 0,
    counseling_date: new Date().toLocaleDateString("en-GB"), // Initialize with today's date
    instructor_id: user?.id || 0,
    cadet_id: 0,
    remarks: "", // Global remarks
    is_active: true,
  });

  const [eventRemarks, setEventRemarks] = useState<{ [eventId: number]: string }>({});
  const [error, setError] = useState("");

  // Dropdown data
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [cadets, setCadets] = useState<any[]>([]);
  const [existingCadetIds, setExistingCadetIds] = useState<number[]>([]);
  
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingCadets, setLoadingCadets] = useState(false);

  // Auto-detected Counseling type
  const [detectedType, setDetectedType] = useState<AtwAssessmentCounselingType | null>(null);
  const [availableEvents, setAvailableEvents] = useState<AtwAssessmentCounselingEvent[]>([]);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const commonData = await commonService.getResultOptions();

        if (commonData) {
          setCourses(commonData.courses || []);
          setPrograms(commonData.programs || []);
          setBranches(commonData.branches || []);
          setGroups(commonData.groups || []);
          setExams(commonData.exams || []);
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

  // Fetch semesters whenever course changes
  useEffect(() => {
    if (!formData.course_id) {
      setSemesters([]);
      setExistingCadetIds([]);
      return;
    }
    const fetchSemesters = async () => {
      setLoadingSemesters(true);
      const data = await commonService.getSemestersByCourse(formData.course_id);
      setSemesters(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, semester_id: data[0].id }));
      }
      setLoadingSemesters(false);
    };
    fetchSemesters();
  }, [formData.course_id]);

  // Fetch existing results to filter out cadets (only in create mode)
  useEffect(() => {
    if (isEdit || !formData.course_id || !formData.semester_id) {
      setExistingCadetIds([]);
      return;
    }

    const fetchExistingResults = async () => {
      try {
        const res = await atwAssessmentCounselingResultService.getAllResults({
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          per_page: 1000,
        });
        
        const ids = res.data.flatMap(r => (r.result_cadets || []).map(c => c.cadet_id));
        setExistingCadetIds(ids);
      } catch (err) {
        console.error("Failed to fetch existing results:", err);
      }
    };

    fetchExistingResults();
  }, [formData.course_id, formData.semester_id, isEdit]);

  // Auto-select instructor
  useEffect(() => {
    if (user?.id && !isEdit) {
      setFormData(prev => ({ ...prev, instructor_id: user.id }));
    }
  }, [user?.id, isEdit]);

  // Load assigned cadets for instructor when course+semester are selected
  useEffect(() => {
    if (!user?.id) return;
    if (!formData.course_id || !formData.semester_id) {
      setCadets([]);
      return;
    }
    const fetchCadets = async () => {
      setLoadingCadets(true);
      const res = await atwInstructorAssignCadetService.getAll({
        instructor_id: user.id,
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        per_page: 1000,
      });
      const mapped = res.data
        .map((a: any) => ({
          id: a.cadet?.id,
          name: a.cadet?.name,
          cadet_number: a.cadet?.cadet_number,
          bd_no: a.cadet?.cadet_number,
          program_id: a.cadet?.program_id,
          branch_id: a.cadet?.branch_id,
          group_id: a.cadet?.group_id,
          is_active: true,
        }))
        .filter((c: any) => c.id);
      const unique = mapped.filter((c: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === c.id) === i);
      setCadets(unique);
      setLoadingCadets(false);
    };
    fetchCadets();
  }, [user?.id, formData.course_id, formData.semester_id]);

  // Fetch Counseling Type when course and semester change
  useEffect(() => {
    const fetchCounselingType = async () => {
      if (!formData.course_id || !formData.semester_id) {
        setDetectedType(null);
        setAvailableEvents([]);
        return;
      }

      try {
        const response = await atwAssessmentCounselingTypeService.getAllTypes({
          course_id: formData.course_id,
          semester_id: formData.semester_id,
        });

        if (response.data && response.data.length > 0) {
          const type = response.data.find(t => t.is_active) || response.data[0];
          setDetectedType(type);
          setFormData(prev => ({ ...prev, atw_assessment_counseling_type_id: type.id }));
          
          const fullType = await atwAssessmentCounselingTypeService.getType(type.id);
          if (fullType && fullType.events) {
            const activeEvents = fullType.events.filter(e => e.is_active).sort((a, b) => (a.order || 0) - (b.order || 0));
            setAvailableEvents(activeEvents);
            
            // Initialize remarks if not already set
            if (Object.keys(eventRemarks).length === 0) {
                const initialRemarks: { [key: number]: string } = {};
                activeEvents.forEach(e => {
                    initialRemarks[e.id] = "";
                });
                setEventRemarks(initialRemarks);
            }
          }
        } else {
          setDetectedType(null);
          setAvailableEvents([]);
          setFormData(prev => ({ ...prev, atw_assessment_counseling_type_id: 0 }));
        }
      } catch (err) {
        console.error("Failed to fetch counseling type:", err);
      }
    };

    if (!isEdit) {
      fetchCounselingType();
    }
  }, [formData.course_id, formData.semester_id, isEdit]);

  // Load cadets based on filters (admin only)
  useEffect(() => {
    if (isInstructor || isEdit) return;
    const loadCadets = async () => {
      if (!formData.course_id || !formData.semester_id) {
        setCadets([]);
        return;
      }

      try {
        setLoadingCadets(true);
        const cadetsRes = await cadetService.getAllCadets({
          per_page: 500,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: formData.program_id || undefined,
          branch_id: formData.branch_id || undefined,
          group_id: formData.group_id || undefined,
        });
        setCadets(cadetsRes.data.filter(c => c.is_active));
      } catch (err) {
        console.error("Failed to load cadets:", err);
      } finally {
        setLoadingCadets(false);
      }
    };

    loadCadets();
  }, [isInstructor, isEdit, formData.course_id, formData.semester_id, formData.program_id, formData.branch_id, formData.group_id]);

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        course_id: initialData.course_id,
        semester_id: initialData.semester_id,
        program_id: initialData.program_id || 0,
        branch_id: initialData.branch_id || 0,
        group_id: initialData.group_id || 0,
        exam_type_id: initialData.exam_type_id || 0,
        atw_assessment_counseling_type_id: initialData.atw_assessment_counseling_type_id,
        counseling_date: initialData.counseling_date 
            ? new Date(initialData.counseling_date).toLocaleDateString("en-GB") 
            : new Date().toLocaleDateString("en-GB"),
        instructor_id: initialData.instructor_id || 0,
        cadet_id: initialData.cadet_id || (initialData.result_cadets?.[0]?.cadet_id || 0),
        remarks: initialData.remarks || "",
        is_active: initialData.is_active,
      });

      if (initialData.counseling_type) {
        setDetectedType(initialData.counseling_type);
        if (initialData.counseling_type.events) {
            const activeEvents = initialData.counseling_type.events.filter(e => e.is_active).sort((a, b) => (a.order || 0) - (b.order || 0));
            setAvailableEvents(activeEvents);
            
            const remarksMap: { [key: number]: string } = {};
            const firstCadet = initialData.result_cadets?.[0];
            if (firstCadet && firstCadet.remarks) {
                firstCadet.remarks.forEach(r => {
                    remarksMap[r.atw_assessment_counseling_event_id] = r.remark || "";
                });
            }
            setEventRemarks(remarksMap);
        }
      }
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    if (field === "course_id") {
      setFormData(prev => ({ ...prev, course_id: value, semester_id: 0, cadet_id: 0 }));
      return;
    }
    if (field === "semester_id") {
      setFormData(prev => ({ ...prev, semester_id: value, cadet_id: 0 }));
      return;
    }
    if (field === "cadet_id") {
      const selectedCadet = cadets.find(c => c.id === value);
      if (selectedCadet) {
        setFormData(prev => ({
          ...prev,
          cadet_id: value,
          program_id: selectedCadet.program_id || prev.program_id,
          branch_id: selectedCadet.branch_id || prev.branch_id,
          group_id: selectedCadet.group_id || prev.group_id,
        }));
      } else {
        setFormData(prev => ({ ...prev, cadet_id: value }));
      }
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEventRemarkChange = (eventId: number, value: string) => {
    setEventRemarks(prev => ({ ...prev, [eventId]: value }));
  };

  const getSelectedInstructor = () => {
    return user?.name || "—";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.course_id) { setError("Please select a course"); return; }
    if (!formData.semester_id) { setError("Please select a semester"); return; }
    if (!formData.instructor_id) { setError("Instructor information not found. Please log in again."); return; }
    if (!formData.cadet_id) { setError("Please select a cadet"); return; }
    if (!formData.atw_assessment_counseling_type_id) { setError("No Counseling Type found for selected Course and Semester"); return; }

    try {
      const selectedCadet = cadets.find(c => c.id === formData.cadet_id);
      
      // Format date from dd/mm/yyyy to yyyy-mm-dd
      const dateParts = formData.counseling_date.split("/");
      const formattedDate = dateParts.length === 3 
        ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` 
        : null;

      const submitData: AtwAssessmentCounselingResultCreateData = {
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        program_id: formData.program_id || undefined,
        branch_id: formData.branch_id || undefined,
        group_id: formData.group_id || undefined,
        exam_type_id: formData.exam_type_id || undefined,
        atw_assessment_counseling_type_id: formData.atw_assessment_counseling_type_id,
        counseling_date: formattedDate || undefined,
        instructor_id: formData.instructor_id,
        remarks: formData.remarks || undefined,
        is_active: formData.is_active,
        cadets: [
          {
            cadet_id: formData.cadet_id,
            bd_no: selectedCadet?.bd_no || selectedCadet?.cadet_number || "",
            is_present: true,
            is_active: true,
            remarks: Object.entries(eventRemarks).map(([eventId, remark]) => ({
              atw_assessment_counseling_event_id: parseInt(eventId),
              remark: remark || "",
              is_active: true,
            })).filter(r => r.remark.trim() !== ""),
          }
        ],
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} result`);
    }
  };

  const filtersSelected = formData.course_id && formData.semester_id;
  
  const filteredCadets = isEdit 
    ? cadets 
    : cadets.filter(c => !existingCadetIds.includes(c.id));

  const showEvents = filtersSelected && detectedType && availableEvents.length > 0 && formData.cadet_id > 0;

  if (loadingDropdowns) {
    return (
      <div className="w-full min-h-[20vh] flex items-center justify-center">
        <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Top Dropdowns - Horizontal Layout matching the 'before' format */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Course<span className="text-red-500">*</span></label>
          <select value={formData.course_id} onChange={(e) => handleChange("course_id", parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
            <option value={0}>Select Course</option>
            {courses.map(course => (<option key={course.id} value={course.id}>{course.name}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Semester<span className="text-red-500">*</span></label>
          <div className="relative">
            <select
              value={formData.semester_id}
              onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
              required
              disabled={true}
            >
              <option value={0}>
                {loadingSemesters
                  ? "Loading..."
                  : !formData.course_id
                    ? "Select course first"
                    : semesters.length === 0
                      ? "No semester on this course"
                      : "Select Semester"}
              </option>
              {semesters.map(semester => (<option key={semester.id} value={semester.id}>{semester.name}</option>))}
            </select>
            {loadingSemesters && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Program</label>
          <select value={formData.program_id} onChange={(e) => handleChange("program_id", parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value={0}>Select Program</option>
            {programs.map(program => (<option key={program.id} value={program.id}>{program.name}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Branch</label>
          <select value={formData.branch_id} onChange={(e) => handleChange("branch_id", parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value={0}>Select Branch</option>
            {branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.name}</option>))}
          </select>
        </div>

      </div>

      {/* Second Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam Type</label>
          <select value={formData.exam_type_id} onChange={(e) => handleChange("exam_type_id", parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value={0}>Select Exam Type</option>
            {exams.map(exam => (<option key={exam.id} value={exam.id}>{exam.name}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Cadet<span className="text-red-500">*</span></label>
          <div className="relative">
            <select
              value={formData.cadet_id}
              onChange={(e) => handleChange("cadet_id", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
              required
              disabled={!formData.course_id || !formData.semester_id || loadingCadets}
            >
              <option value={0}>
                {!formData.course_id
                  ? "Select course first"
                  : !formData.semester_id
                    ? "Select semester first"
                    : loadingCadets
                      ? "Loading cadets..."
                      : filteredCadets.length === 0
                        ? "No assigned cadets found"
                        : "Select Cadet"}
              </option>
              {filteredCadets.map(cadet => (<option key={cadet.id} value={cadet.id}>{cadet.name} ({cadet.bd_no || cadet.cadet_number})</option>))}
            </select>
            {loadingCadets && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Matrix / Table - Exactly following the 'before' format structure */}
      {!showEvents ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-black rounded-xl">
          <Icon icon="hugeicons:user-edit" className="w-12 h-12 mx-auto mb-3 text-black" />
          {!filtersSelected ? (
            <p>Please select Course and Semester first</p>
          ) : !formData.cadet_id ? (
            <p>Please select a Cadet to start inputting remarks</p>
          ) : !detectedType ? (
            <p className="text-amber-600">No Counseling Type configured for this Course and Semester</p>
          ) : (
            <p>Ready to load events...</p>
          )}
        </div>
      ) : (
        <div className="border border-black rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-black uppercase">EVENTS</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-black uppercase">REMARKS<span className="text-red-500">*</span></th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-black uppercase whitespace-nowrap">{`Cadet's Initial & Date`}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-black uppercase whitespace-nowrap">Instructor (Rank & Name)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-black uppercase">OC WGS</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase">CI BAFA</th>
              </tr>
            </thead>
            <tbody>
              {availableEvents.map((event, index) => (
                <tr key={event.id} className={index !== availableEvents.length - 1 ? "border-b border-black" : ""}>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-black font-medium">
                    {event.event_name}
                  </td>
                  <td className="px-4 py-3 border-r border-black min-w-[450px]">
                    <textarea
                      value={eventRemarks[event.id] || ""}
                      onChange={(e) => handleEventRemarkChange(event.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80px] resize-none text-sm"
                      placeholder="Enter remarks..."
                      required
                    />
                  </td>
                  {index === 0 && (
                    <>
                      <td rowSpan={availableEvents.length} className="px-4 py-3 border-r border-black align-middle text-center bg-white max-w-[150px]">
                        <DatePicker
                          value={formData.counseling_date}
                          onChange={(e) => handleChange("counseling_date", e.target.value)}
                          placeholder="Select Date"
                        />
                      </td>
                      <td rowSpan={availableEvents.length} className="px-4 py-3 text-sm text-gray-900 border-r border-black align-middle text-center bg-white">
                        <div className="font-medium">{getSelectedInstructor()}</div>
                      </td>
                      <td rowSpan={availableEvents.length} className="px-4 py-3 border-r border-black align-middle text-center bg-white">—</td>
                      <td rowSpan={availableEvents.length} className="px-4 py-3 align-middle text-center bg-white">—</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Global Batch Remarks */}
      <div className="border border-gray-200 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 font-bold uppercase">Overall Summary / Additional Observations</label>
        <textarea
          value={formData.remarks}
          onChange={(e) => handleChange("remarks", e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px]"
          placeholder="Add any general summary..."
        />
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-black text-black rounded-xl hover:bg-gray-50" disabled={loading}>
          Cancel
        </button>
        <button 
          type="submit" 
          className="px-8 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold" 
          disabled={loading || !showEvents}
        >
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Counseling" : "Save Counseling")}
        </button>
      </div>
    </form>
  );
}
