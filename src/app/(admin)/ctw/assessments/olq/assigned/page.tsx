/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { ctwOlqAssignService } from "@/libs/services/ctwOlqAssignService";
import { commonService } from "@/libs/services/commonService";
import { userService } from "@/libs/services/userService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Modal } from "@/components/ui/modal";
import type { CtwOlqAssign } from "@/libs/types/ctwAssign";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch } from "@/libs/types/system";
import { useCan } from "@/context/PagePermissionsContext";
import Label from "@/components/form/Label";

export default function CtwOlqAssignmentsPage() {
  const can = useCan();

  const [assignments, setAssignments] = useState<CtwOlqAssign[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Dropdown data
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const [formData, setFormData] = useState({
    course_id: "",
    semester_id: "",
    program_id: "",
    branch_id: "",
    user_id: "",
    is_active: true,
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
      const res = await ctwOlqAssignService.getAll({
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
      console.error("Failed to load CTW OLQ assigns:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current_page, pagination.per_page, selectedCourseId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await commonService.getResultOptions();
        if (options) {
          setCourses(options.courses || []);
          setPrograms(options.programs || []);
          setBranches(options.branches?.filter((b: any) => b.is_active) || []);
          setUsers(options.users || []);
        }
      } catch (error) {
        console.error("Failed to load options:", error);
      }
    };
    loadOptions();
  }, []);

  // Load semesters when course changes in modal
  useEffect(() => {
    if (!formData.course_id) { setSemesters([]); return; }
    const fetchSemesters = async () => {
      const list = await commonService.getSemestersByCourse(parseInt(formData.course_id));
      setSemesters(list);
    };
    fetchSemesters();
  }, [formData.course_id]);

  const handleOpenAssign = () => {
    setEditingId(null);
    setFormData({ course_id: "", semester_id: "", program_id: "", branch_id: "", user_id: "", is_active: true });
    setError("");
    setAssignModalOpen(true);
  };

  const handleEdit = (a: CtwOlqAssign) => {
    setEditingId(a.id);
    setFormData({
      course_id: String(a.course_id),
      semester_id: a.semester_id ? String(a.semester_id) : "",
      program_id: a.program_id ? String(a.program_id) : "",
      branch_id: a.branch_id ? String(a.branch_id) : "",
      user_id: a.user_id ? String(a.user_id) : "",
      is_active: a.is_active,
    });
    setError("");
    setAssignModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course_id) return;
    try {
      setSubmitting(true);
      setError("");
      const payload = {
        course_id: parseInt(formData.course_id),
        semester_id: formData.semester_id ? parseInt(formData.semester_id) : undefined,
        program_id: formData.program_id ? parseInt(formData.program_id) : undefined,
        branch_id: formData.branch_id ? parseInt(formData.branch_id) : undefined,
        user_id: formData.user_id ? parseInt(formData.user_id) : undefined,
        is_active: formData.is_active,
      };
      if (editingId) {
        await ctwOlqAssignService.update(editingId, payload);
      } else {
        await ctwOlqAssignService.store(payload);
      }
      setAssignModalOpen(false);
      setEditingId(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      setSubmitting(true);
      await ctwOlqAssignService.destroy(deletingId);
      setDeleteModalOpen(false);
      setDeletingId(null);
      loadData();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePerPageChange = (value: number) => {
    setPagination(prev => ({ ...prev, per_page: value, current_page: 1 }));
  };

  const columns: Column<CtwOlqAssign>[] = [
    { key: "id", header: "SL.", headerAlign: "center", className: "text-center w-12 text-gray-900", render: (_, idx) => (pagination.from || 0) + idx },
    {
      key: "course",
      header: "Course",
      className: "font-bold text-gray-900",
      render: (a) => <span>{a.course?.name} ({a.course?.code})</span>
    },
    {
      key: "semester",
      header: "Semester",
      className: "text-gray-700",
      render: (a) => <span>{a.semester?.name || "—"}</span>
    },
    {
      key: "program",
      header: "Program",
      className: "text-gray-700",
      render: (a) => <span>{a.program?.name || "—"}</span>
    },
    {
      key: "branch",
      header: "Branch",
      className: "text-gray-700",
      render: (a) => <span>{a.branch?.name || "—"}</span>
    },
    {
      key: "user",
      header: "Assigned User",
      className: "text-gray-700",
      render: (a) => (
        <div className="flex items-center gap-2">
          <Icon icon="hugeicons:user" className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{a.user?.name || "—"}</span>
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
        <div className="flex items-center justify-center gap-1">
          {can('edit') && (
            <button onClick={() => handleEdit(a)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Edit">
              <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            </button>
          )}
          {can('delete') && (
            <button onClick={() => { setDeletingId(a.id); setDeleteModalOpen(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
              <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
            </button>
          )}
        </div>
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">CTW OLQ Assignments</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <select
            value={selectedCourseId}
            onChange={(e) => { setSelectedCourseId(e.target.value); setPagination(prev => ({ ...prev, current_page: 1 })); }}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          {can('add') && (
            <button onClick={handleOpenAssign} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
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
          data={assignments}
          keyExtractor={(a) => a.id.toString()}
          emptyMessage="No OLQ assignments found"
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
          <button onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))} disabled={pagination.current_page === 1} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />Prev
          </button>
          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => setPagination(prev => ({ ...prev, current_page: page }))} className={`px-4 py-2 text-sm rounded-lg ${pagination.current_page === page ? "bg-blue-600 text-white" : "border border-black hover:bg-gray-50"}`}>
              {page}
            </button>
          ))}
          <button onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.last_page, prev.current_page + 1) }))} disabled={pagination.current_page === pagination.last_page} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      </div>

      {/* Assign/Edit Modal */}
      <Modal isOpen={assignModalOpen} onClose={() => { setAssignModalOpen(false); setEditingId(null); }} showCloseButton={true} className="max-w-2xl p-0">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div><FullLogo /></div>
            <h2 className="text-xl font-bold text-gray-900 uppercase">{editingId ? "Edit Assignment" : "Add Assignment"}</h2>
            <p className="text-sm text-gray-500">Assign users to CTW OLQ courses</p>
          </div>

          {error && (
            <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Course <span className="text-red-500">*</span></Label>
                <select value={formData.course_id} onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value, semester_id: "" }))} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" required>
                  <option value="">Choose a course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div>
                <Label>Semester</Label>
                <select value={formData.semester_id} onChange={(e) => setFormData(prev => ({ ...prev, semester_id: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:bg-gray-50" disabled={!formData.course_id}>
                  <option value="">Choose a semester...</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <Label>Program</Label>
                <select value={formData.program_id} onChange={(e) => setFormData(prev => ({ ...prev, program_id: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="">Choose a program...</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div>
                <Label>Branch</Label>
                <select value={formData.branch_id} onChange={(e) => setFormData(prev => ({ ...prev, branch_id: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="">Choose a branch...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                </select>
              </div>
              <div>
                <Label>User</Label>
                <select value={formData.user_id} onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="">Choose a user...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label className="mb-3">Status</Label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => setFormData(prev => ({ ...prev, is_active: true }))} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Active</div>
                    <div className="text-xs text-gray-500">This assignment will be active.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => setFormData(prev => ({ ...prev, is_active: false }))} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Inactive</div>
                    <div className="text-xs text-gray-500">This assignment will be hidden.</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button type="button" className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50 transition-colors" onClick={() => { setAssignModalOpen(false); setEditingId(null); }} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={submitting}
        title="Delete Assignment"
        message="Are you sure you want to delete this OLQ assignment?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
