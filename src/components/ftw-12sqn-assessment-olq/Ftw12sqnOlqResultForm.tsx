/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import type {
  Ftw12sqnAssessmentOlqResult,
  Ftw12sqnAssessmentOlqResultCreateData,
  Ftw12sqnAssessmentOlqType,
  Ftw12sqnAssessmentOlqTypeEstimatedMark
} from "@/libs/types/ftw12sqnAssessmentOlq";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup, SystemExam } from "@/libs/types/system";
import { commonService } from "@/libs/services/commonService";
import { cadetService } from "@/libs/services/cadetService";
import { ftw12sqnAssessmentOlqTypeService } from "@/libs/services/ftw12sqnAssessmentOlqTypeService";

interface Ftw12sqnOlqResultFormProps {
  initialData?: Ftw12sqnAssessmentOlqResult | null;
  onSubmit: (data: Ftw12sqnAssessmentOlqResultCreateData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

interface CadetRow {
  id?: number;
  cadet_id: number;
  bd_no: string;
  cadet_name: string;
  cadet_rank: string;
  is_present: boolean;
  absent_reason: string;
  marks: { [estimatedMarkId: number]: number };
}

export default function Ftw12sqnOlqResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: Ftw12sqnOlqResultFormProps) {
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    program_id: 0,
    branch_id: 0,
    group_id: 0,
    exam_type_id: 0,
    ftw_12sqn_assessment_olq_type_id: 0,
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
  const [allOlqTypes, setAllOlqTypes] = useState<Ftw12sqnAssessmentOlqType[]>([]);
  const [filteredOlqTypes, setFilteredOlqTypes] = useState<Ftw12sqnAssessmentOlqType[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingCadets, setLoadingCadets] = useState(false);

  // Selected OLQ type for marks
  const [selectedOlqType, setSelectedOlqType] = useState<Ftw12sqnAssessmentOlqType | null>(null);
  const [estimatedMarks, setEstimatedMarks] = useState<Ftw12sqnAssessmentOlqTypeEstimatedMark[]>([]);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const [options, olqTypesRes] = await Promise.all([
          commonService.getResultOptions(),
          ftw12sqnAssessmentOlqTypeService.getAllTypes({ per_page: 100 }),
        ]);

        if (options) {
          setCourses(options.courses.filter(c => c.is_active));
          setSemesters(options.semesters.filter(s => s.is_active));
          setPrograms(options.programs.filter(p => p.is_active));
          setBranches(options.branches.filter(b => b.is_active));
          setGroups(options.groups.filter(g => g.is_active));
          setExams(options.exams.filter(e => e.is_active));
        }
        
        setAllOlqTypes(olqTypesRes.data.filter(t => t.is_active));
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, []);

  // Filter OLQ types by selected semester
  useEffect(() => {
    if (formData.semester_id) {
      const filtered = allOlqTypes.filter(type =>
        type.semesters?.some(s => s.semester_id === formData.semester_id)
      );
      setFilteredOlqTypes(filtered);

      if (formData.ftw_12sqn_assessment_olq_type_id && !filtered.find(t => t.id === formData.ftw_12sqn_assessment_olq_type_id)) {
        setFormData(prev => ({ ...prev, ftw_12sqn_assessment_olq_type_id: 0 }));
      }
    } else {
      setFilteredOlqTypes(allOlqTypes);
    }
  }, [formData.semester_id, allOlqTypes, formData.ftw_12sqn_assessment_olq_type_id]);

  // Update selected OLQ type and estimated marks when type changes
  useEffect(() => {
    if (formData.ftw_12sqn_assessment_olq_type_id) {
      const type = allOlqTypes.find(t => t.id === formData.ftw_12sqn_assessment_olq_type_id);
      setSelectedOlqType(type || null);
      setEstimatedMarks(type?.estimated_marks?.filter(m => m.is_active) || []);
    } else {
      setSelectedOlqType(null);
      setEstimatedMarks([]);
    }
  }, [formData.ftw_12sqn_assessment_olq_type_id, allOlqTypes]);

  // Auto-load cadets when filters change
  useEffect(() => {
    const loadCadets = async () => {
      if (!formData.course_id || !formData.semester_id || !formData.program_id || !formData.branch_id) {
        setCadetRows([]);
        return;
      }

      try {
        setLoadingCadets(true);
        const cadetsRes = await cadetService.getAllCadets({
          per_page: 500,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: formData.program_id,
          branch_id: formData.branch_id,
          group_id: formData.group_id || undefined,
        });

        const rows: CadetRow[] = cadetsRes.data.filter(c => c.is_active).map(cadet => {
          const currentRank = cadet.assigned_ranks?.find(ar => ar.rank)?.rank;
          return {
            cadet_id: cadet.id,
            bd_no: cadet.bd_no || cadet.cadet_number || "",
            cadet_name: cadet.name,
            cadet_rank: currentRank?.short_name || currentRank?.name || "Officer Cadet",
            is_present: true,
            absent_reason: "",
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
  }, [formData.course_id, formData.semester_id, formData.program_id, formData.branch_id, formData.group_id, initialData]);

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        course_id: initialData.course_id,
        semester_id: initialData.semester_id,
        program_id: initialData.program_id,
        branch_id: initialData.branch_id,
        group_id: initialData.group_id || 0,
        exam_type_id: initialData.exam_type_id || 0,
        ftw_12sqn_assessment_olq_type_id: initialData.ftw_12sqn_assessment_olq_type_id,
        remarks: initialData.remarks || "",
        is_active: initialData.is_active,
      });

      if (initialData.result_cadets && initialData.result_cadets.length > 0) {
        const rows: CadetRow[] = initialData.result_cadets.map(c => {
          const marks: { [markId: number]: number } = {};
          c.marks?.forEach(m => {
            marks[m.ftw_12sqn_assessment_olq_type_estimated_mark_id] = parseFloat(String(m.achieved_mark));
          });
          const currentRank = c.cadet?.assigned_ranks?.find(ar => ar.rank)?.rank;
          return {
            id: c.id,
            cadet_id: c.cadet_id,
            bd_no: c.bd_no,
            cadet_name: c.cadet?.name || "Unknown",
            cadet_rank: currentRank?.short_name || currentRank?.name || "Officer Cadet",
            is_present: c.is_present,
            absent_reason: c.absent_reason || "",
            marks,
          };
        });
        setCadetRows(rows);
      }
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMarkChange = (cadetIndex: number, estimatedMarkId: number, value: number) => {
    setCadetRows(prev => {
      const updated = [...prev];
      updated[cadetIndex] = {
        ...updated[cadetIndex],
        marks: { ...updated[cadetIndex].marks, [estimatedMarkId]: value }
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

  const calculateTotal = (marks: { [key: number]: number }) => {
    // Calculate: sum of (estimated_mark * inputed_mark)
    let total = 0;
    estimatedMarks.forEach(em => {
      const inputedMark = marks[em.id] || 0;
      const estimatedMark = parseFloat(String(em.estimated_mark || 0));
      total += estimatedMark * inputedMark;
    });

    // Use multiplier if enabled
    if (selectedOlqType?.is_multiplier) {
      const mult = parseFloat(selectedOlqType.multiplier || "1");
      total = total * mult;
    }

    return total;
  };

  const calculateMaxTotal = () => {
    // Max total = sum of all (estimated_marks * 10) when input is 10 for each
    let total = estimatedMarks.reduce((sum, em) => sum + (parseFloat(String(em.estimated_mark || 0)) * 10), 0);

    // Use multiplier if enabled
    if (selectedOlqType?.is_multiplier) {
      const mult = parseFloat(selectedOlqType.multiplier || "1");
      total = total * mult;
    }

    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.course_id) { setError("Please select a course"); return; }
    if (!formData.semester_id) { setError("Please select a semester"); return; }
    if (!formData.program_id) { setError("Please select a program"); return; }
    if (!formData.branch_id) { setError("Please select a branch"); return; }
    if (!formData.ftw_12sqn_assessment_olq_type_id) { setError("Please select an OLQ type"); return; }

    try {
      const submitData: Ftw12sqnAssessmentOlqResultCreateData = {
        course_id: formData.course_id,
        semester_id: formData.semester_id,
        program_id: formData.program_id,
        branch_id: formData.branch_id,
        group_id: formData.group_id || undefined,
        exam_type_id: formData.exam_type_id || undefined,
        ftw_12sqn_assessment_olq_type_id: formData.ftw_12sqn_assessment_olq_type_id,
        remarks: formData.remarks || undefined,
        is_active: formData.is_active,
        cadets: cadetRows.filter(c => c.cadet_id > 0).map(c => ({
          cadet_id: c.cadet_id,
          bd_no: c.bd_no,
          is_present: c.is_present,
          absent_reason: c.is_present ? undefined : c.absent_reason,
          marks: Object.entries(c.marks).map(([estimatedMarkId, achievedMark]) => ({
            ftw_12sqn_assessment_olq_type_estimated_mark_id: parseInt(estimatedMarkId),
            achieved_mark: achievedMark || 0,
          })),
        })),
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} result`);
    }
  };

  const filtersSelected = formData.course_id && formData.semester_id && formData.program_id && formData.branch_id;
  const olqTypeSelected = formData.ftw_12sqn_assessment_olq_type_id > 0;

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
              <Label>Program <span className="text-red-500">*</span></Label>
              <select value={formData.program_id} onChange={(e) => handleChange("program_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" required>
                <option value={0}>Select Program</option>
                {programs.map(program => (<option key={program.id} value={program.id}>{program.name} ({program.code})</option>))}
              </select>
            </div>

            <div>
              <Label>Branch <span className="text-red-500">*</span></Label>
              <select value={formData.branch_id} onChange={(e) => handleChange("branch_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" required>
                <option value={0}>Select Branch</option>
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
              <Label>Exam Type</Label>
              <select value={formData.exam_type_id} onChange={(e) => handleChange("exam_type_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                <option value={0}>Select Exam Type (Optional)</option>
                {exams.map(exam => (<option key={exam.id} value={exam.id}>{exam.name} ({exam.code})</option>))}
              </select>
            </div>

            <div>
              <Label>OLQ Type <span className="text-red-500">*</span></Label>
              <select value={formData.ftw_12sqn_assessment_olq_type_id} onChange={(e) => handleChange("ftw_12sqn_assessment_olq_type_id", parseInt(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" required>
                <option value={0}>Select OLQ Type {formData.semester_id ? `(${filteredOlqTypes.length} available)` : ""}</option>
                {filteredOlqTypes.map(type => (<option key={type.id} value={type.id}>{type.type_name} ({type.type_code})</option>))}
              </select>
            </div>

            <div>
              <Label>Remarks</Label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                placeholder="Optional remarks"
              />
            </div>
          </div>
        </div>

        {/* Marks Table */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:note-edit" className="w-5 h-5 text-blue-500" />
            FTW 12sqn OLQ Assessment ({cadetRows.length} Cadets)
            {selectedOlqType && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                - {selectedOlqType.type_name} ({selectedOlqType.type_code})
              </span>
            )}
          </h3>

          {!filtersSelected ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
              <p>Please select Course, Semester, Program, and Branch to load cadets</p>
            </div>
          ) : !olqTypeSelected ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="hugeicons:document-01" className="w-10 h-10 mx-auto mb-2" />
              <p>Please select an OLQ Type to see assessment columns</p>
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
                  <tr>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>SL.</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>BD/NO</th>
                    <th className="border border-black px-3 py-2 text-left" rowSpan={2}>NAME</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>RANK</th>
                    <th className="border border-black px-3 py-2 text-center" rowSpan={2}>PRESENT</th>
                    {estimatedMarks.map(mark => (
                      <th
                        key={mark.id}
                        className="border border-black px-2 py-2 text-center"
                        style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', minWidth: '50px', height: '200px' }}
                      >
                        <span className="font-semibold text-xs uppercase">{mark.event_name}</span>
                      </th>
                    ))}
                    <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={2}>TOTAL</th>
                  </tr>
                  <tr>
                    {estimatedMarks.map(mark => (
                      <th key={`est-${mark.id}`} className="border border-black px-2 py-1 text-center text-xs">
                        <span className="block">(Max: 10)</span>
                        <span className="block text-blue-600">EM: {parseFloat(String(mark.estimated_mark)).toFixed(1)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cadetRows.map((cadet, index) => (
                    <tr key={cadet.cadet_id}>
                      <td className="border border-black px-3 py-2 text-center font-medium">{index + 1}</td>
                      <td className="border border-black px-3 py-2 text-center">{cadet.bd_no}</td>
                      <td className={`border border-black px-3 py-2 font-medium ${!cadet.is_present ? 'text-red-500' : ''}`}>
                        {cadet.cadet_name}
                      </td>
                      <td className="border border-black px-3 py-2 text-center">{cadet.cadet_rank}</td>
                      <td className="border border-black px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={cadet.is_present}
                          onChange={(e) => handlePresentChange(index, e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                        />
                      </td>
                      {estimatedMarks.map(mark => (
                        <td key={mark.id} className={`border border-black px-1 py-1 text-center ${!cadet.is_present ? "bg-gray-100" : ""}`}>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={cadet.is_present ? (cadet.marks[mark.id] || 0) : 0}
                            onChange={(e) => {
                              const inputValue = parseFloat(e.target.value) || 0;
                              const clampedValue = Math.min(Math.max(0, inputValue), 10);
                              handleMarkChange(index, mark.id, clampedValue);
                            }}
                            disabled={!cadet.is_present}
                            className={`w-full px-1 py-1 border rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!cadet.is_present
                              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                              : "border-gray-300 bg-white"
                              }`}
                            style={{ minWidth: '45px' }}
                          />
                        </td>
                      ))}
                      <td className="border border-black px-3 py-2 text-center font-bold">
                        {cadet.is_present ? calculateTotal(cadet.marks).toFixed(2) : "0.00"}
                        {cadet.is_present && selectedOlqType?.is_multiplier && (
                          <span className="block text-xs text-green-600">(x{selectedOlqType.multiplier})</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="font-bold bg-gray-50">
                    <td className="border border-black px-3 py-2 text-center" colSpan={5}>Maximum Input / Estimated Mark</td>
                    {estimatedMarks.map(mark => (
                      <td key={`max-${mark.id}`} className="border border-black px-2 py-2 text-center">
                        <span className="block">10</span>
                        <span className="block text-blue-600 text-xs">({parseFloat(String(mark.estimated_mark)).toFixed(1)})</span>
                      </td>
                    ))}
                    <td className="border border-black px-3 py-2 text-center">
                      {calculateMaxTotal().toFixed(2)}
                      {selectedOlqType?.is_multiplier && (
                        <span className="block text-xs text-green-600">(x{selectedOlqType.multiplier})</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-4 pt-4">
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
