/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { cadetService } from "@/libs/services/cadetService";
import { semesterService } from "@/libs/services/semesterService";
import { commonService } from "@/libs/services/commonService";
import FullLogo from "@/components/ui/fulllogo";
import { Icon } from "@iconify/react";
import { CadetProfile } from "@/libs/types/user";
import { SystemSemester, SystemCourse, SystemProgram, SystemBranch, SystemGroup } from "@/libs/types/system";

interface CadetDemotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cadet: CadetProfile | null;
  onSuccess: () => void;
}

export default function CadetDemotionModal({ isOpen, onClose, cadet, onSuccess }: CadetDemotionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  
  const [formData, setFormData] = useState({
    target_semester_id: "",
    course_id: "",
    program_id: "",
    branch_id: "",
    group_id: "",
    start_date: new Date().toISOString().split("T")[0],
    reason: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      setFormData({
        target_semester_id: "",
        course_id: "",
        program_id: "",
        branch_id: "",
        group_id: "",
        start_date: new Date().toISOString().split("T")[0],
        reason: "",
      });
      setError("");
    }
  }, [isOpen]);

  const loadOptions = async () => {
    try {
      const [semRes, options] = await Promise.all([
        semesterService.getAllSemesters({ per_page: 100 }),
        commonService.getResultOptions(),
      ]);
      setSemesters(semRes.data);
      if (options) {
        setCourses(options.courses);
        setPrograms(options.programs);
        setBranches(options.branches);
        setGroups(options.groups);
      }
    } catch (err: any) {
      console.error("Failed to load options:", err);
      setError("Failed to load options.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadet) return;

    const currentSemesterAssignment = cadet.assigned_semesters?.find(s => s.is_current);
    if (!currentSemesterAssignment) {
      setError("Cadet has no current semester assignment to demote from.");
      return;
    }

    if (!formData.target_semester_id) {
      setError("Please select the target semester.");
      return;
    }

    if (!formData.course_id) {
      setError("Please select the course.");
      return;
    }

    if (!formData.reason) {
      setError("Please provide a reason for demotion.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await cadetService.downgradeSemester(cadet.id, {
        current_semester_assignment_id: currentSemesterAssignment.id,
        target_semester_id: Number(formData.target_semester_id),
        course_id: Number(formData.course_id),
        program_id: formData.program_id ? Number(formData.program_id) : undefined,
        branch_id: formData.branch_id ? Number(formData.branch_id) : undefined,
        group_id: formData.group_id ? Number(formData.group_id) : undefined,
        start_date: formData.start_date,
        reason: formData.reason,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to demote cadet:", err);
      setError(err.response?.data?.message || err.message || "Failed to demote cadet.");
    } finally {
      setLoading(false);
    }
  };

  const currentSemester = cadet?.assigned_semesters?.find(s => s.is_current)?.semester;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true} className="max-w-2xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <FullLogo />
          <h2 className="text-xl font-bold text-gray-900 mt-4 text-center uppercase tracking-wide">Demote Cadet</h2>
          <p className="text-sm text-gray-500 font-medium">
            {cadet ? `${cadet.name} (${cadet.cadet_number})` : ""}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-3">
            <Icon icon="hugeicons:alert-circle" className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <Label>Current Semester</Label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-semibold">
              {currentSemester?.name || "Not Assigned"}
            </div>
          </div>

          <div>
            <Label>Target Semester <span className="text-red-500">*</span></Label>
            <select
              value={formData.target_semester_id}
              onChange={(e) => setFormData({ ...formData, target_semester_id: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Target Semester...</option>
              {semesters
                .filter(s => s.id !== currentSemester?.id)
                .map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Course <span className="text-red-500">*</span></Label>
            <select
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <Label>Program (Optional)</Label>
            <select
              value={formData.program_id}
              onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Change</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <Label>Branch (Optional)</Label>
            <select
              value={formData.branch_id}
              onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Change</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <Label>Group (Optional)</Label>
            <select
              value={formData.group_id}
              onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Change</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div>
            <Label>Demotion Date <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label>Reason <span className="text-red-500">*</span></Label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide reason for demotion..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 font-bold shadow-lg shadow-red-200 transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading && <Icon icon="hugeicons:fan-01" className="animate-spin w-4 h-4" />}
            Demote Cadet
          </button>
        </div>
      </form>
    </Modal>
  );
}
