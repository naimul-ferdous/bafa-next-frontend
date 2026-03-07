/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwAssessmentOlqTypeService } from "@/libs/services/atwAssessmentOlqTypeService";
import { commonService } from "@/libs/services/commonService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Modal } from "@/components/ui/modal";
import type { AtwAssessmentOlqType, AtwAssessmentOlqTypeAssignment } from "@/libs/types/atwAssessmentOlq";
import type { SystemCourse } from "@/libs/types/system";
import { useCan } from "@/context/PagePermissionsContext";
import Label from "@/components/form/Label";

export default function AtwOlqAssignmentsPage() {
  const router = useRouter();
  const can = useCan();

  const [assignments, setAssignments] = useState<AtwAssessmentOlqTypeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Form State
  const [availableTypes, setAvailableTypes] = useState<AtwAssessmentOlqType[]>([]);
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    atw_assessment_olq_type_id: "",
    course_id: "",
    is_active: true
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await atwAssessmentOlqTypeService.getAllAssignments({
        page: pagination.current_page,
        per_page: pagination.per_page,
        course_id: selectedCourseId ? parseInt(selectedCourseId) : undefined,
      });
      setAssignments(res.data);
      setPagination(prev => ({
        ...prev,
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total,
        from: res.from,
        to: res.to,
      }));
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current_page, pagination.per_page, selectedCourseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const options = await commonService.getResultOptions();
        if (options) {
          setCourses(options.courses || []);
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
      }
    };
    loadCourses();
  }, []);

  const loadOptions = async () => {
    try {
      const [typesRes] = await Promise.all([
        atwAssessmentOlqTypeService.getAllTypes({ per_page: 1000 })
      ]);
      setAvailableTypes(typesRes.data.filter(t => t.is_active));
    } catch (error) {
      console.error("Failed to load options:", error);
    }
  };

  const handleOpenAssign = () => {
    loadOptions();
    setFormData({ atw_assessment_olq_type_id: "", course_id: "", is_active: true });
    setError("");
    setAssignModalOpen(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.atw_assessment_olq_type_id || !formData.course_id) return;

    try {
      setSubmitting(true);
      setError("");
      await atwAssessmentOlqTypeService.assignType({
        atw_assessment_olq_type_id: Number(formData.atw_assessment_olq_type_id),
        course_id: Number(formData.course_id),
        is_active: formData.is_active
      });
      setAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to assign OLQ Type");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      setSubmitting(true);
      await atwAssessmentOlqTypeService.deleteAssignment(deletingId);
      setDeleteModalOpen(false);
      setDeletingId(null);
      loadData();
    } catch (error) {
      console.error("Failed to remove assignment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handlePerPageChange = (value: number) => {
    setPagination(prev => ({ ...prev, per_page: value, current_page: 1 }));
  };

  const filteredAssignments = assignments.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.olq_type?.type_name.toLowerCase().includes(term) ||
      a.olq_type?.type_code.toLowerCase().includes(term) ||
      a.course?.name.toLowerCase().includes(term) ||
      a.course?.code.toLowerCase().includes(term)
    );
  });

  const columns: Column<AtwAssessmentOlqTypeAssignment>[] = [
    { key: "id", header: "SL.", headerAlign: "center", className: "text-center w-12 text-gray-900", render: (_, idx) => (pagination.from || 0) + idx },
    { 
      key: "type", 
      header: "OLQ Type", 
      className: "font-bold text-gray-900",
      render: (a) => (
        <div className="flex flex-col">
          <span>{a.olq_type?.type_name}</span>
          <span className="text-[10px] text-gray-500 font-mono uppercase">{a.olq_type?.type_code}</span>
        </div>
      )
    },
    { 
      key: "course", 
      header: "Assigned Course", 
      className: "text-gray-900",
      render: (a) => (
        <div className="flex items-center gap-2">
          <Icon icon="hugeicons:course" className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{a.course?.name} ({a.course?.code})</span>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (a) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${a.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {a.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (a) => (
        <button 
          onClick={() => { setDeletingId(a.id); setDeleteModalOpen(true); }}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove Assignment"
        >
          <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
        </button>
      )
    }
  ];

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">OLQ Type Assignments</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-80">
            <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by type name, code or course..." 
              value={searchTerm} 
              onChange={(e) => handleSearchChange(e.target.value)} 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" 
            />
          </div>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setPagination(prev => ({ ...prev, current_page: 1 }));
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          {can('add') && (
            <button 
              onClick={handleOpenAssign} 
              className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
            >
              <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
              Add Assignment
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <TableLoading />
      ) : (
        <DataTable
          columns={columns}
          data={filteredAssignments}
          keyExtractor={(a) => a.id.toString()}
          emptyMessage="No OLQ types assigned to courses found"
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results</div>
          <select value={pagination.per_page} onChange={(e) => handlePerPageChange(Number(e.target.value))} className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900">
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))} 
            disabled={pagination.current_page === 1} 
            className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />Prev
          </button>
          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
            <button 
              key={page} 
              onClick={() => setPagination(prev => ({ ...prev, current_page: page }))} 
              className={`px-4 py-2 text-sm rounded-lg ${pagination.current_page === page ? "bg-blue-600 text-white" : "border border-black hover:bg-gray-50"}`}
            >
              {page}
            </button>
          ))}
          <button 
            onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.last_page, prev.current_page + 1) }))} 
            disabled={pagination.current_page === pagination.last_page} 
            className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      </div>

      {/* Assign Modal - WingFormModal Design */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} showCloseButton={true} className="max-w-2xl p-0">
        <form onSubmit={handleAssign} className="p-8">
          {/* Logo and Header */}
          <div className="flex flex-col items-center mb-6">
            <div>
              <FullLogo />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase">
              Assign OLQ Type
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Link assessment types to specific courses
            </p>
          </div>

          {error && (
            <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Select OLQ Type <span className="text-red-500">*</span>
                </Label>
                <select 
                  value={formData.atw_assessment_olq_type_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, atw_assessment_olq_type_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  required
                >
                  <option value="">Choose a type...</option>
                  {availableTypes.map(t => <option key={t.id} value={t.id}>{t.type_name} ({t.type_code})</option>)}
                </select>
              </div>

              <div>
                <Label>
                  Select Course <span className="text-red-500">*</span>
                </Label>
                <select 
                  value={formData.course_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  required
                >
                  <option value="">Choose a course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label className="mb-3">Status</Label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="is_active"
                    checked={formData.is_active === true}
                    onChange={() => setFormData(prev => ({ ...prev, is_active: true }))}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">Active:</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      This assignment will be active throughout the system.
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="is_active"
                    checked={formData.is_active === false}
                    onChange={() => setFormData(prev => ({ ...prev, is_active: false }))}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">Inactive:</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      This assignment will be hidden.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50 transition-colors"
              onClick={() => setAssignModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50" 
              disabled={submitting}
            >
              {submitting ? "Assigning..." : "Save Assignment"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={confirmDelete} 
        loading={submitting}
        title="Remove Assignment" 
        message="Are you sure you want to remove this assessment type from the selected course? This will not delete the type itself."
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}
