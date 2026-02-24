/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import { useCtwModuleEstimatedMarkModal } from "@/context/CtwModuleEstimatedMarkModalContext";
import FullLogo from "@/components/ui/fulllogo";
import { courseService } from "@/libs/services/courseService";
import { semesterService } from "@/libs/services/semesterService";
import { programService } from "@/libs/services/programService";
import { branchService } from "@/libs/services/branchService";
import { examService } from "@/libs/services/examService";
import type { 
  CtwResultsModuleEstimatedMark,
  CtwResultsModuleEstimatedMarkDetail 
} from "@/libs/types/ctw";

export default function CtwResultsModuleEstimatedMarkFormModal() {
  const { isOpen, moduleId, editingMark, closeModal } = useCtwModuleEstimatedMarkModal();
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    program_id: 0,
    branch_id: 0,
    exam_type_id: 0,
    estimated_mark_per_instructor: "" as string | number,
    conversation_mark: "" as string | number,
    is_active: true,
    details: [] as CtwResultsModuleEstimatedMarkDetail[],
  });

  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);
  
  const [fetchingOptions, setFetchingOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setFetchingOptions(true);
        const [courseRes, semesterRes, programRes, branchRes, examRes] = await Promise.all([
          courseService.getAllCourses({ per_page: 100 }),
          semesterService.getAllSemesters({ per_page: 100 }),
          programService.getAllPrograms({ per_page: 100 }),
          branchService.getAllBranches({ per_page: 100 }),
          examService.getAllExams({ per_page: 100 }),
        ]);

        setCourses(courseRes.data || []);
        setSemesters(semesterRes.data || []);
        setPrograms(programRes.data || []);
        setBranches(branchRes.data || []);
        setExams(examRes.data || []);
      } catch (err) {
        console.error("Failed to fetch form options:", err);
      } finally {
        setFetchingOptions(false);
      }
    };

    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editingMark) {
      setFormData({
        course_id: editingMark.course_id,
        semester_id: editingMark.semester_id,
        program_id: editingMark.program_id || 0,
        branch_id: editingMark.branch_id || 0,
        exam_type_id: editingMark.exam_type_id,
        estimated_mark_per_instructor: editingMark.estimated_mark_per_instructor ?? "",
        conversation_mark: editingMark.conversation_mark ?? "",
        is_active: editingMark.is_active !== false,
        details: editingMark.details || [],
      });
    } else {
      // Reset form for new mark
      setFormData({
        course_id: 0,
        semester_id: 0,
        program_id: 0,
        branch_id: 0,
        exam_type_id: 0,
        estimated_mark_per_instructor: "",
        conversation_mark: "",
        is_active: true,
        details: [],
      });
    }
    setError("");
  }, [editingMark, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailChange = (index: number, field: keyof CtwResultsModuleEstimatedMarkDetail, value: any) => {
    const updatedDetails = [...formData.details];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setFormData(prev => ({ ...prev, details: updatedDetails }));
  };

  const addDetailRow = () => {
    setFormData(prev => ({
      ...prev,
      details: [...prev.details, { name: "", male_quantity: 0, female_quantity: 0, male_marks: 0, female_marks: 0 }]
    }));
  };

  const removeDetailRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleId) return;
    setError("");
    setLoading(true);

    try {
      const submitData: any = { ...formData };
      if (submitData.program_id === 0) submitData.program_id = null;
      if (submitData.branch_id === 0) submitData.branch_id = null;

      if (editingMark) {
        await ctwResultsModuleService.updateEstimatedMark(moduleId, editingMark.id, submitData);
      } else {
        await ctwResultsModuleService.storeEstimatedMark(moduleId, submitData);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('ctwModuleEstimatedMarkUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save estimated mark");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-3xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingMark ? "Edit Estimated Mark" : "Add New Estimated Mark"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingMark ? "Update configuration" : "Configure new estimated mark"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Course <span className="text-red-500">*</span></Label>
              <select
                value={formData.course_id}
                onChange={(e) => handleChange("course_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Select Course</option>
                {courses.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Semester <span className="text-red-500">*</span></Label>
              <select
                value={formData.semester_id}
                onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Select Semester</option>
                {semesters.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Program</Label>
              <select
                value={formData.program_id}
                onChange={(e) => handleChange("program_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Select Program (Optional)</option>
                {programs.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Branch</Label>
              <select
                value={formData.branch_id}
                onChange={(e) => handleChange("branch_id", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Select Branch (Optional)</option>
                {branches.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Exam Type <span className="text-red-500">*</span></Label>
            <select
              value={formData.exam_type_id}
              onChange={(e) => handleChange("exam_type_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Select Exam Type</option>
              {exams.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-bold text-gray-900 dark:text-white">Configuration Details</h3>
              <button
                type="button"
                onClick={addDetailRow}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 flex items-center gap-1 font-semibold"
              >
                <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                Add Row
              </button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {formData.details.map((detail, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 relative">
                  <button
                    type="button"
                    onClick={() => removeDetailRow(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                  >
                    <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                      <Label>Detail Name</Label>
                      <Input 
                        value={detail.name} 
                        onChange={(e) => handleDetailChange(index, "name", e.target.value)} 
                        placeholder="e.g. Practical, Theory" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Male Quantity</Label>
                      <Input 
                        type="number" 
                        value={detail.male_quantity} 
                        onChange={(e) => handleDetailChange(index, "male_quantity", e.target.value === "" ? 0 : parseInt(e.target.value))} 
                        placeholder="Male Qty" 
                      />
                    </div>
                    <div>
                      <Label>Female Quantity</Label>
                      <Input 
                        type="number" 
                        value={detail.female_quantity} 
                        onChange={(e) => handleDetailChange(index, "female_quantity", e.target.value === "" ? 0 : parseInt(e.target.value))} 
                        placeholder="Female Qty" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Male Marks</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={detail.male_marks} 
                        onChange={(e) => handleDetailChange(index, "male_marks", e.target.value === "" ? 0 : parseFloat(e.target.value))} 
                        placeholder="Male Marks" 
                      />
                    </div>
                    <div>
                      <Label>Female Marks</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={detail.female_marks} 
                        onChange={(e) => handleDetailChange(index, "female_marks", e.target.value === "" ? 0 : parseFloat(e.target.value))} 
                        placeholder="Female Marks" 
                      />
                    </div>
                  </div>
                </div>
              ))}
              {formData.details.length === 0 && (
                <div className="text-center py-8 text-gray-500 italic border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  No details added yet. Click "Add Row" to start configuring.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 mt-4">
            <div>
              <Label>Total Mark Per Instructor (Optional)</Label>
              <Input type="number" step="0.01" value={formData.estimated_mark_per_instructor} onChange={(e) => handleChange("estimated_mark_per_instructor", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="Enter mark" />
            </div>
            <div>
              <Label>Total Conversation Mark (Optional)</Label>
              <Input type="number" step="0.01" value={formData.conversation_mark} onChange={(e) => handleChange("conversation_mark", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="Enter mark" />
            </div>
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="is_active_mark" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="is_active_mark" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Inactive</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8">
          <button type="button" className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50 transition-colors" onClick={closeModal} disabled={loading}>Cancel</button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors" disabled={loading || fetchingOptions}>
            {loading ? "Saving..." : editingMark ? "Update Mark" : "Save Mark"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
