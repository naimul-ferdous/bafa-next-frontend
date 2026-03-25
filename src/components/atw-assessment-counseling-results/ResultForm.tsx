/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { atwAssessmentCounselingResultService } from "@/libs/services/atwAssessmentCounselingResultService";
import { atwUserAssignService } from "@/libs/services/atwUserAssignService";
import { useAuth } from "@/libs/hooks/useAuth";
import DatePicker from "@/components/form/input/DatePicker";
import SearchableSelect from "@/components/form/SearchableSelect";

interface ResultFormProps {
  initialData?: AtwAssessmentCounselingResult | null;
  onSubmit: (data: AtwAssessmentCounselingResultCreateData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function ResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const router = useRouter();
  const { user, userIsInstructor } = useAuth();
  const isInstructor = userIsInstructor;
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
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [cadets, setCadets] = useState<any[]>([]);
  const [cadetToResultMap, setCadetToResultMap] = useState<{ [cadetId: number]: number }>({});
  const [duplicateWarning, setDuplicateWarning] = useState<{ name: string; resultId: number } | null>(null);
  
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingCadets, setLoadingCadets] = useState(false);

  // Auto-detected Counseling type
  const [detectedType, setDetectedType] = useState<AtwAssessmentCounselingType | null>(null);
  const [availableEvents, setAvailableEvents] = useState<AtwAssessmentCounselingEvent[]>([]);

  // 1. Initial Load: Get Courses and Exams
  useEffect(() => {
    const loadInitialOptions = async () => {
      try {
        setLoadingDropdowns(true);
        const options = await atwAssessmentCounselingResultService.getFormOptions();
        if (options) {
          setCourses(options.courses);
          setExams(options.exams);
        }
      } catch (err) {
        console.error("Failed to load initial form options:", err);
        setError("Failed to load form options. Please refresh.");
      } finally {
        setLoadingDropdowns(false);
      }
    };
    loadInitialOptions();
  }, []);

  // 2. Chained Data Load: When Course or Semester changes
  useEffect(() => {
    if (!formData.course_id) return;

    const loadContextData = async () => {
      try {
        if (!formData.semester_id) setLoadingSemesters(true);
        else setLoadingCadets(true);

        const options = await atwAssessmentCounselingResultService.getFormOptions({
          course_id: formData.course_id,
          semester_id: formData.semester_id || undefined
        });

        if (options) {
          // If only course selected, update semesters
          if (!formData.semester_id) {
            setSemesters(options.semesters);
            // Auto-select first semester
            if (options.semesters.length > 0) {
              setFormData(prev => ({ ...prev, semester_id: options.semesters[0].id }));
            }
          } 
          // If both selected, update cadets, events, and duplicate map
          else {
            setCadets(options.cadets);
            setCadetToResultMap(options.existing_results_map);
            
            if (options.counseling_type) {
              setDetectedType(options.counseling_type);
              setFormData(prev => ({ ...prev, atw_assessment_counseling_type_id: options.counseling_type!.id }));
              
              const activeEvents = (options.counseling_type.events || [])
                .filter((e: AtwAssessmentCounselingEvent) => e.is_active)
                .sort((a: AtwAssessmentCounselingEvent, b: AtwAssessmentCounselingEvent) => (a.order || 0) - (b.order || 0));
              setAvailableEvents(activeEvents);

              // Reset/Init remarks
              const initialRemarks: { [key: number]: string } = {};
              activeEvents.forEach((e: AtwAssessmentCounselingEvent) => { initialRemarks[e.id] = ""; });
              setEventRemarks(initialRemarks);
            } else {
              setDetectedType(null);
              setAvailableEvents([]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load context data:", err);
      } finally {
        setLoadingSemesters(false);
        setLoadingCadets(false);
      }
    };

    loadContextData();
  }, [formData.course_id, formData.semester_id]);

  // Populate form with initial data (Edit mode)
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
      
      if (!isEdit && value && cadetToResultMap[value]) {
        setDuplicateWarning({
          name: selectedCadet?.name || "this cadet",
          resultId: cadetToResultMap[value]
        });
      } else {
        setDuplicateWarning(null);
      }

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
    if (!formData.exam_type_id) { setError("Please select an exam type"); return; }
    if (!formData.instructor_id) { setError("Instructor information not found. Please log in again."); return; }
    if (!formData.cadet_id) { setError("Please select a cadet"); return; }
    if (duplicateWarning) { setError(`Counseling is already done for ${duplicateWarning.name}. Please edit existing result instead.`); return; }
    if (!formData.atw_assessment_counseling_type_id) { setError("No Counseling Type found for selected Course and Semester"); return; }

    try {
      const selectedCadet = cadets.find(c => c.id === formData.cadet_id);
      
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
  const showEvents = filtersSelected && detectedType && availableEvents.length > 0 && formData.cadet_id > 0 && !duplicateWarning;

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

      {/* Top Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Select Course<span className="text-red-500">*</span></label>
          <SearchableSelect
            options={courses.map((c: any) => ({ value: c.id.toString(), label: c.name }))}
            value={formData.course_id.toString()}
            onChange={(val: string) => handleChange("course_id", parseInt(val))}
            placeholder="Select Course"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Select Semester<span className="text-red-500">*</span></label>
          <SearchableSelect
            options={semesters.map((s: any) => ({ value: s.id.toString(), label: s.name }))}
            value={formData.semester_id.toString()}
            onChange={(val: string) => handleChange("semester_id", parseInt(val))}
            placeholder={
              loadingSemesters 
                ? "Loading semesters..." 
                : !formData.course_id 
                  ? "Select course first" 
                  : semesters.length === 0 
                    ? "No semesters found" 
                    : "Select Semester"
            }
            disabled={!formData.course_id || loadingSemesters}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Select Exam Type<span className="text-red-500">*</span></label>
          <SearchableSelect
            options={exams.map((e: any) => ({ value: e.id.toString(), label: e.name }))}
            value={formData.exam_type_id.toString()}
            onChange={(val: string) => handleChange("exam_type_id", parseInt(val))}
            placeholder="Select Exam Type"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Select Cadet <span className="text-gray-500 font-normal italic">(Search by Name or BD No)</span><span className="text-red-500">*</span></label>
          <SearchableSelect
            options={cadets.map((c: any) => ({
              value: c.id.toString(),
              label: `${c.name} (${c.bd_no || c.cadet_number})${cadetToResultMap[c.id] ? " — [ALREADY COUNSELED]" : ""}`,
              ...(cadetToResultMap[c.id] ? { className: "text-orange-500 font-medium" } : {}),
            }))}
            value={formData.cadet_id.toString()}
            onChange={(val: string) => handleChange("cadet_id", parseInt(val))}
            placeholder={
              !formData.course_id || !formData.semester_id
                ? "Select course & semester first"
                : loadingCadets
                  ? "Loading cadets..."
                  : cadets.length === 0
                    ? "No assigned cadets found"
                    : "Search for a cadet..."
            }
            disabled={isEdit || !formData.course_id || !formData.semester_id || loadingCadets}
            required
          />
        </div>
      </div>

      {/* Input Matrix */}
      {!showEvents ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-black rounded-xl">
          <Icon icon="hugeicons:user-edit" className="w-12 h-12 mx-auto mb-3 text-black" />
          {duplicateWarning ? (
            <div className="space-y-4">
                <p className="text-amber-700 font-bold text-lg">Counseling Session Already Recorded</p>
                <p className="text-gray-600">A counseling record already exists for <b>{duplicateWarning.name}</b> in this semester.</p>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => router.push(`/atw/assessments/counselings/results/${duplicateWarning.resultId}/edit`)}
                    className="px-6 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 flex items-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Icon icon="hugeicons:pencil-edit-01" className="w-5 h-5" />
                    EDIT EXISTING RESULT
                  </button>
                </div>
            </div>
          ) : !filtersSelected ? (
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
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-black uppercase whitespace-nowrap">{`Cadet's Initial & Date`}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-black uppercase whitespace-nowrap">Instructor (Rank & Name)</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-black uppercase">OC WGS</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase">CI BAFA</th>
              </tr>
            </thead>
            <tbody>
              {availableEvents.map((event: AtwAssessmentCounselingEvent, index: number) => (
                <tr key={event.id} className={index !== availableEvents.length - 1 ? "border-b border-black" : ""}>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-black font-medium">
                    {event.event_name}
                  </td>
                  <td className="px-4 py-3 border-r border-black min-w-[450px]">
                    <textarea
                      value={eventRemarks[event.id] || ""}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleEventRemarkChange(event.id, e.target.value)}
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
                          onChange={(e: any) => handleChange("counseling_date", e.target.value)}
                          placeholder="Select Date"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
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
