/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type {
  Ftw11sqnAssessmentCounselingResult,
  Ftw11sqnAssessmentCounselingType,
  Ftw11sqnAssessmentCounselingEvent,
} from "@/libs/types/system";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup, SystemExam } from "@/libs/types/system";
import { commonService } from "@/libs/services/commonService";
import { ftw11sqnAssessmentCounselingTypeService } from "@/libs/services/ftw11sqnAssessmentCounselingTypeService";
import { cadetService } from "@/libs/services/cadetService";
import DatePicker from "@/components/form/input/DatePicker";

export interface Ftw11sqnAssessmentCounselingResultCreateData {
  course_id: number;
  semester_id: number;
  program_id: number;
  branch_id?: number;
  group_id?: number;
  exam_type_id?: number;
  ftw_11sqn_assessment_counseling_type_id: number;
  counseling_date?: string;
  instructor_id: number;
  cadet_id: number;
  remarks_global?: string;
  is_active?: boolean;
  remarks?: {
    ftw_11sqn_assessment_counseling_event_id: number;
    remark: string;
    is_active: boolean;
  }[];
}

interface ResultFormProps {
  initialData?: Ftw11sqnAssessmentCounselingResult | null;
  onSubmit: (data: Ftw11sqnAssessmentCounselingResultCreateData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function ResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    program_id: 0,
    branch_id: 0,
    group_id: 0,
    exam_type_id: 0,
    ftw_11sqn_assessment_counseling_type_id: 0,
    counseling_date: new Date().toLocaleDateString("en-GB"), // Initialize with today's date
    instructor_id: 0,
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
  const [instructors, setInstructors] = useState<any[]>([]);
  
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingCadets, setLoadingCadets] = useState(false);

  // Auto-detected Counseling type
  const [detectedType, setDetectedType] = useState<Ftw11sqnAssessmentCounselingType | null>(null);
  const [availableEvents, setAvailableEvents] = useState<Ftw11sqnAssessmentCounselingEvent[]>([]);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const commonData = await commonService.getResultOptions();

        if (commonData) {
          setCourses(commonData.courses || []);
          setSemesters(commonData.semesters.filter(s => !!s.is_flying));
          setPrograms((commonData.programs || []).filter(p => !!p.is_flying));
          setBranches(commonData.branches.filter(b => !!b.is_flying));
          setGroups(commonData.groups || []);
          setExams(commonData.exams || []);
          setInstructors(commonData.instructors || []);
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

  // Fetch Counseling Type when course and semester change
  useEffect(() => {
    const fetchCounselingType = async () => {
      if (!formData.course_id || !formData.semester_id) {
        setDetectedType(null);
        setAvailableEvents([]);
        return;
      }

      try {
        const response = await ftw11sqnAssessmentCounselingTypeService.getAllTypes({
          course_id: formData.course_id,
          semester_id: formData.semester_id,
        });

        if (response.data && response.data.length > 0) {
          const type = response.data.find(t => t.is_active) || response.data[0];
          setDetectedType(type);
          setFormData(prev => ({ ...prev, ftw_11sqn_assessment_counseling_type_id: type.id }));
          
          const fullType = await ftw11sqnAssessmentCounselingTypeService.getType(type.id);
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
          setFormData(prev => ({ ...prev, ftw_11sqn_assessment_counseling_type_id: 0 }));
        }
      } catch (err) {
        console.error("Failed to fetch counseling type:", err);
      }
    };

    if (!isEdit) {
      fetchCounselingType();
    }
  }, [formData.course_id, formData.semester_id, isEdit]);

  // Load cadets based on filters
  useEffect(() => {
    const loadCadets = async () => {
      if (!formData.course_id || !formData.semester_id || !formData.program_id) {
        setCadets([]);
        return;
      }

      try {
        setLoadingCadets(true);
        const cadetsRes = await cadetService.getAllCadets({
          per_page: 500,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: formData.program_id,
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

    if (!isEdit) {
      loadCadets();
    }
  }, [formData.course_id, formData.semester_id, formData.program_id, formData.branch_id, formData.group_id, isEdit]);

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        course_id: initialData.course_id,
        semester_id: initialData.semester_id,
        program_id: initialData.program_id,
        branch_id: initialData.branch_id || 0,
        group_id: initialData.group_id || 0,
        exam_type_id: initialData.exam_type_id || 0,
        ftw_11sqn_assessment_counseling_type_id: initialData.ftw_11sqn_assessment_counseling_type_id || 0,
        counseling_date: initialData.counseling_date 
            ? new Date(initialData.counseling_date).toLocaleDateString("en-GB") 
            : new Date().toLocaleDateString("en-GB"),
        instructor_id: initialData.instructor_id || 0,
        cadet_id: initialData.cadet_id || 0,
        remarks: initialData.remarks_global || "",
        is_active: initialData.is_active ?? true,
      });

      if (initialData.counseling_type) {
        setDetectedType(initialData.counseling_type);
        if (initialData.counseling_type.events) {
            const activeEvents = initialData.counseling_type.events.filter(e => e.is_active).sort((a, b) => (a.order || 0) - (b.order || 0));
            setAvailableEvents(activeEvents);
            
            const remarksMap: { [key: number]: string } = {};
            if (initialData.remarks) {
                initialData.remarks.forEach(r => {
                    remarksMap[r.ftw_11sqn_assessment_counseling_event_id] = r.remark || "";
                });
            }
            setEventRemarks(remarksMap);
        }
      }
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEventRemarkChange = (eventId: number, value: string) => {
    setEventRemarks(prev => ({ ...prev, [eventId]: value }));
  };

  const getSelectedInstructor = () => {
    const instructor = instructors.find(i => i.id === formData.instructor_id);
    return instructor?.name || instructor?.instructor_biodata?.name || "—";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.course_id) { setError("Please select a course"); return; }
    if (!formData.semester_id) { setError("Please select a semester"); return; }
    if (!formData.program_id) { setError("Please select a program"); return; }
    if (!formData.instructor_id) { setError("Please select an instructor"); return; }
    if (!formData.cadet_id) { setError("Please select a cadet"); return; }
    if (!formData.ftw_11sqn_assessment_counseling_type_id) { setError("No Counseling Type found for selected Course and Semester"); return; }

    try {
      // Format date from dd/mm/yyyy to yyyy-mm-dd
      const dateParts = formData.counseling_date.split("/");
      const formattedDate = dateParts.length === 3 
        ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` 
        : null;

      const submitData: Ftw11sqnAssessmentCounselingResultCreateData = {
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        program_id: formData.program_id,
        branch_id: formData.branch_id || undefined,
        group_id: formData.group_id || undefined,
        exam_type_id: formData.exam_type_id || undefined,
        ftw_11sqn_assessment_counseling_type_id: formData.ftw_11sqn_assessment_counseling_type_id,
        counseling_date: formattedDate || undefined,
        instructor_id: formData.instructor_id,
        cadet_id: formData.cadet_id,
        remarks_global: formData.remarks || undefined,
        is_active: formData.is_active,
        remarks: Object.entries(eventRemarks).map(([eventId, remark]) => ({
          ftw_11sqn_assessment_counseling_event_id: parseInt(eventId),
          remark: remark || "",
          is_active: true,
        })).filter(r => r.remark.trim() !== ""),
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} result`);
    }
  };

  const filtersSelected = formData.course_id && formData.semester_id && formData.program_id;
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

      {/* Top Dropdowns - Horizontal Layout matching ATW */}
      <div className="grid grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Course<span className="text-red-500">*</span></label>
          <select value={formData.course_id} onChange={(e) => handleChange("course_id", parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
            <option value={0}>Select Course</option>
            {courses.map(course => (<option key={course.id} value={course.id}>{course.name}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Semester<span className="text-red-500">*</span></label>
          <select value={formData.semester_id} onChange={(e) => handleChange("semester_id", parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
            <option value={0}>Select Semester</option>
            {semesters.map(semester => (<option key={semester.id} value={semester.id}>{semester.name}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Program<span className="text-red-500">*</span></label>
          <select value={formData.program_id} onChange={(e) => handleChange("program_id", parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Group</label>
          <select value={formData.group_id} onChange={(e) => handleChange("group_id", parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value={0}>Select Group</option>
            {groups.map(group => (<option key={group.id} value={group.id}>{group.name}</option>))}
          </select>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam Type</label>
          <select value={formData.exam_type_id} onChange={(e) => handleChange("exam_type_id", parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value={0}>Select Exam Type</option>
            {exams.map(exam => (<option key={exam.id} value={exam.id}>{exam.name}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Instructor<span className="text-red-500">*</span></label>
          <select value={formData.instructor_id} onChange={(e) => handleChange("instructor_id", parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
            <option value={0}>Select Instructor</option>
            {instructors.map(ins => (<option key={ins.id} value={ins.id}>{ins.name || ins.instructor_biodata?.name} ({ins.service_number || ins.instructor_biodata?.service_number})</option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Cadet<span className="text-red-500">*</span></label>
          <select 
            value={formData.cadet_id} 
            onChange={(e) => handleChange("cadet_id", parseInt(e.target.value))} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
            required
            disabled={!filtersSelected || loadingCadets}
          >
            <option value={0}>{loadingCadets ? "Loading cadets..." : "Select Cadet"}</option>
            {cadets.map(cadet => (<option key={cadet.id} value={cadet.id}>{cadet.name} ({cadet.bd_no || cadet.cadet_number})</option>))}
          </select>
        </div>
      </div>

      {/* Input Matrix / Table - Exactly following ATW format */}
      {!showEvents ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-black rounded-xl">
          <Icon icon="hugeicons:user-edit" className="w-12 h-12 mx-auto mb-3 text-black" />
          {!filtersSelected ? (
            <p>Please select Course, Semester, and Program first</p>
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
