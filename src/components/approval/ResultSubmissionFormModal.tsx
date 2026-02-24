/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { ftw11sqnResultSubmissionService } from "@/libs/services/ftw11sqnResultSubmissionService";
import { useResultSubmissionModal } from "@/context/ResultSubmissionModalContext";
import FullLogo from "@/components/ui/fulllogo";
import { Icon } from "@iconify/react";
import type { LevelStatus } from "@/libs/types/approval";

// Simple select options interfaces
interface SelectOption {
  id: number;
  name: string;
  code?: string;
}

interface ResultSubmissionFormModalProps {
  courses?: SelectOption[];
  semesters?: SelectOption[];
  examTypes?: SelectOption[];
  syllabi?: SelectOption[];
}

export default function ResultSubmissionFormModal({
  courses = [],
  semesters = [],
  examTypes = [],
  syllabi = [],
}: ResultSubmissionFormModalProps) {
  const { isOpen, editingSubmission, viewMode, closeModal } = useResultSubmissionModal();
  const [formData, setFormData] = useState({
    course_id: "",
    semester_id: "",
    exam_type_id: "",
    syllabus_id: "",
    remarks: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [levelStatuses, setLevelStatuses] = useState<LevelStatus[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Load level status when viewing a submission
  useEffect(() => {
    if (isOpen && editingSubmission && viewMode !== 'create') {
      loadLevelStatus();
    }
  }, [isOpen, editingSubmission, viewMode]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && viewMode === 'create') {
      setFormData({
        course_id: "",
        semester_id: "",
        exam_type_id: "",
        syllabus_id: "",
        remarks: "",
      });
      setLevelStatuses([]);
    }
    setError("");
  }, [isOpen, viewMode]);

  const loadLevelStatus = async () => {
    if (!editingSubmission) return;
    try {
      setLoadingStatus(true);
      const status = await ftw11sqnResultSubmissionService.getLevelStatus(editingSubmission.id);
      if (status) {
        setLevelStatuses(status.levels);
      }
    } catch (err) {
      console.error("Failed to load level status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const submitData = {
        course_id: parseInt(formData.course_id),
        semester_id: parseInt(formData.semester_id),
        exam_type_id: formData.exam_type_id ? parseInt(formData.exam_type_id) : undefined,
        syllabus_id: formData.syllabus_id ? parseInt(formData.syllabus_id) : undefined,
        remarks: formData.remarks || undefined,
      };

      await ftw11sqnResultSubmissionService.createSubmission(submitData);

      closeModal();
      window.dispatchEvent(new CustomEvent('resultSubmissionUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to create submission");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!editingSubmission) return;
    setLoading(true);
    setError("");

    try {
      await ftw11sqnResultSubmissionService.submitForApproval(editingSubmission.id);
      closeModal();
      window.dispatchEvent(new CustomEvent('resultSubmissionUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to submit for approval");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'forwarded':
        return 'bg-green-500';
      case 'in_review':
      case 'pending':
        return 'bg-yellow-500';
      case 'waiting':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'submitted':
      case 'in_review':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'returned':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Create mode form
  const renderCreateForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>
            Course <span className="text-red-500">*</span>
          </Label>
          <select
            value={formData.course_id}
            onChange={(e) => handleChange("course_id", e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} {course.code && `(${course.code})`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>
            Semester <span className="text-red-500">*</span>
          </Label>
          <select
            value={formData.semester_id}
            onChange={(e) => handleChange("semester_id", e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Semester</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Exam Type</Label>
          <select
            value={formData.exam_type_id}
            onChange={(e) => handleChange("exam_type_id", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Exam Type (Optional)</option>
            {examTypes.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Syllabus</Label>
          <select
            value={formData.syllabus_id}
            onChange={(e) => handleChange("syllabus_id", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Syllabus (Optional)</option>
            {syllabi.map((syllabus) => (
              <option key={syllabus.id} value={syllabus.id}>
                {syllabus.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label>Remarks</Label>
        <textarea
          value={formData.remarks}
          onChange={(e) => handleChange("remarks", e.target.value)}
          placeholder="Enter remarks (optional)"
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
        <button
          type="button"
          className="px-6 py-2 border border-gray-300 text-black rounded-xl"
          onClick={closeModal}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>
          {loading ? "Creating..." : "Create Submission"}
        </button>
      </div>
    </form>
  );

  // View mode - submission details with approval workflow
  const renderViewMode = () => (
    <div className="space-y-6">
      {/* Submission Info */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-500">Submission Code</p>
          <p className="font-semibold">{editingSubmission?.submission_code}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(editingSubmission?.status || '')}`}>
            {editingSubmission?.status?.toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500">Course</p>
          <p className="font-medium">{editingSubmission?.course?.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Semester</p>
          <p className="font-medium">{editingSubmission?.semester?.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Cadets</p>
          <p className="font-medium">{editingSubmission?.total_cadets}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Current Level</p>
          <p className="font-medium">Level {editingSubmission?.current_approval_level}</p>
        </div>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">{editingSubmission?.approved_count || 0}</p>
          <p className="text-sm text-green-700">Approved</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">{editingSubmission?.rejected_count || 0}</p>
          <p className="text-sm text-red-700">Rejected</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-yellow-600">{editingSubmission?.pending_count || 0}</p>
          <p className="text-sm text-yellow-700">Pending</p>
        </div>
      </div>

      {/* Approval Workflow Steps */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:workflow-square-06" className="w-5 h-5" />
          Approval Workflow
        </h3>

        {loadingStatus ? (
          <div className="text-center py-4 text-gray-500">Loading workflow status...</div>
        ) : levelStatuses.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No approval workflow configured</div>
        ) : (
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200"></div>

            <div className="space-y-4">
              {levelStatuses.map((level, index) => (
                <div key={level.level} className="relative flex items-start gap-4">
                  {/* Step Indicator */}
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getStatusColor(level.status)}`}>
                    {level.status === 'completed' || level.status === 'forwarded' ? (
                      <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5" />
                    ) : (
                      level.level
                    )}
                  </div>

                  {/* Step Content */}
                  <div className={`flex-1 pb-4 ${index === levelStatuses.length - 1 ? '' : 'border-b border-gray-100'}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{level.authority_name}</span>
                      {level.is_current_level && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Current</span>
                      )}
                      {level.can_final_approve && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">Final</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{level.role_name}</p>

                    {(level.status === 'completed' || level.status === 'forwarded') && (
                      <div className="mt-2 text-xs text-gray-500">
                        {level.completed_by && <p>Completed by: {level.completed_by}</p>}
                        {level.completed_at && <p>At: {new Date(level.completed_at).toLocaleString()}</p>}
                      </div>
                    )}

                    {level.is_current_level && level.status !== 'waiting' && (
                      <div className="mt-2 flex gap-2 text-xs">
                        <span className="text-green-600">{level.approved_cadets || 0} Approved</span>
                        <span className="text-red-600">{level.rejected_cadets || 0} Rejected</span>
                        <span className="text-yellow-600">{level.pending_cadets || 0} Pending</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          className="px-6 py-2 border border-gray-300 text-black rounded-xl"
          onClick={closeModal}
        >
          Close
        </button>
        {editingSubmission?.status === 'draft' && (
          <button
            onClick={handleSubmitForApproval}
            className="px-6 py-2 bg-blue-500 text-white rounded-xl flex items-center gap-2"
            disabled={loading}
          >
            <Icon icon="hugeicons:sent" className="w-4 h-4" />
            {loading ? "Submitting..." : "Submit for Approval"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-3xl p-0">
      <div className="p-8">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-6">
          <div>
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {viewMode === 'create' ? "Create New Submission" : "Submission Details"}
          </h2>
          <p className="text-sm text-gray-500">
            {viewMode === 'create'
              ? "Create a new result submission batch for approval"
              : `Viewing submission ${editingSubmission?.submission_code}`}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {viewMode === 'create' ? renderCreateForm() : renderViewMode()}
      </div>
    </Modal>
  );
}
