"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import { universitySemesterService, SystemUniversitySemester } from "@/libs/services/universitySemesterService";
import { universityService } from "@/libs/services/universityService";
import { useCan } from "@/context/PagePermissionsContext";

export default function UniversitySemestersPage() {
  const can = useCan();
  const [semesters, setSemesters] = useState<SystemUniversitySemester[]>([]);
  const [universities, setUniversities] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUniversitySemester | null>(null);
  const [formData, setFormData] = useState({ university_id: "", name: "", short_name: "", code: "", is_active: true });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: SystemUniversitySemester | null; loading: boolean }>({ open: false, item: null, loading: false });
  const [statusModal, setStatusModal] = useState<{ open: boolean; item: SystemUniversitySemester | null; loading: boolean }>({ open: false, item: null, loading: false });

  const loadSemesters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await universitySemesterService.getAll({ page: currentPage, per_page: perPage, search: searchTerm || undefined });
      setSemesters(res.data);
      setPagination({ current_page: res.current_page, last_page: res.last_page, per_page: res.per_page, total: res.total, from: res.from, to: res.to });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => { loadSemesters(); }, [loadSemesters]);

  useEffect(() => {
    universityService.getAllUniversities({ per_page: 1000 }).then(res => setUniversities(res.data));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormData({ university_id: "", name: "", short_name: "", code: "", is_active: true });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (item: SystemUniversitySemester) => {
    setEditing(item);
    setFormData({
      university_id: item.university_id.toString(),
      name: item.name,
      short_name: item.short_name || "",
      code: item.code || "",
      is_active: item.is_active,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.university_id) { setFormError("Please select a university."); return; }
    if (!formData.name.trim()) { setFormError("Name is required."); return; }
    setFormLoading(true);
    setFormError(null);
    try {
      const payload = {
        university_id: parseInt(formData.university_id),
        name: formData.name,
        short_name: formData.short_name || null,
        code: formData.code || null,
        is_active: formData.is_active,
      };
      if (editing) {
        await universitySemesterService.update(editing.id, payload);
      } else {
        await universitySemesterService.create(payload);
      }
      setModalOpen(false);
      await loadSemesters();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save.");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.item) return;
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      await universitySemesterService.delete(deleteModal.item.id);
      setDeleteModal({ open: false, item: null, loading: false });
      await loadSemesters();
    } catch {
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const confirmToggleStatus = async () => {
    if (!statusModal.item) return;
    setStatusModal(prev => ({ ...prev, loading: true }));
    try {
      await universitySemesterService.update(statusModal.item.id, { is_active: !statusModal.item.is_active });
      setStatusModal({ open: false, item: null, loading: false });
      await loadSemesters();
    } catch {
      setStatusModal(prev => ({ ...prev, loading: false }));
    }
  };

  const columns: Column<SystemUniversitySemester>[] = [
    {
      key: "id", header: "SL.", headerAlign: "center", className: "text-center text-gray-900",
      render: (_, index) => (pagination.from || 0) + index,
    },
    {
      key: "university_id", header: "University", className: "font-medium text-gray-700",
      render: (s) => s.university?.name || "—",
    },
    { key: "name", header: "Name", className: "font-medium text-gray-900" },
    { key: "short_name", header: "Short Name", className: "text-gray-700", render: (s) => s.short_name || "—" },
    { key: "code", header: "Code", className: "text-gray-700 font-mono text-sm", render: (s) => s.code || "—" },
    {
      key: "is_active", header: "Status", headerAlign: "center", className: "text-center",
      render: (s) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${s.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {s.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions", header: "Actions", headerAlign: "center", className: "text-center no-print",
      render: (s) => (
        <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
          {/* {can('edit') && ( */}
            <button onClick={() => openEdit(s)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
              <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            </button>
          {/* )} */}
          {can('delete') && (
            s.is_active ? (
              <button onClick={() => setStatusModal({ open: true, item: s, loading: false })} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Deactivate">
                <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setStatusModal({ open: true, item: s, loading: false })} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Activate">
                <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              </button>
            )
          )}
          {can('delete') && (
            <button onClick={() => setDeleteModal({ open: true, item: s, loading: false })} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete">
              <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">University Semester Management</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text" placeholder="Search by name, code..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0"
          />
        </div>
        {/* {can('add') && ( */}
          <button onClick={openAdd} className="px-4 py-2 rounded-lg text-white flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
            Add Semester
          </button>
        {/* )} */}
      </div>

      {loading ? (
        <div className="w-full min-h-[20vh] flex items-center justify-center">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      ) : (
        <DataTable columns={columns} data={semesters} keyExtractor={s => s.id.toString()} emptyMessage="No university semesters found" onRowClick={can('edit') ? openEdit : undefined} />
      )}

      <Pagination
        currentPage={currentPage} lastPage={pagination.last_page} total={pagination.total}
        from={pagination.from} to={pagination.to} perPage={perPage}
        onPageChange={setCurrentPage} onPerPageChange={v => { setPerPage(v); setCurrentPage(1); }}
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} showCloseButton className="max-w-lg">
        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="mb-4"><FullLogo /></div>
            <h2 className="text-xl font-bold text-gray-900 uppercase">
              {editing ? "Edit University Semester" : "Add University Semester"}
            </h2>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University <span className="text-red-500">*</span></label>
              <select
                value={formData.university_id}
                onChange={e => setFormData({ ...formData, university_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
              >
                <option value="">Select University</option>
                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input
                type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. Spring 2026"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                <input
                  type="text" value={formData.short_name} onChange={e => setFormData({ ...formData, short_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g. Spr-26"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g. SPR26"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Is Active</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
                Cancel
              </button>
              <button
                type="submit" disabled={formLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
              >
                {formLoading ? <><Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />Saving...</> : <><Icon icon={editing ? "hugeicons:tick-02" : "hugeicons:add-circle"} className="w-4 h-4" />{editing ? "Update" : "Save"}</>}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={statusModal.open} onClose={() => setStatusModal({ open: false, item: null, loading: false })}
        onConfirm={confirmToggleStatus}
        title={statusModal.item?.is_active ? "Deactivate Semester" : "Activate Semester"}
        message={`Are you sure you want to ${statusModal.item?.is_active ? "deactivate" : "activate"} "${statusModal.item?.name}"?`}
        confirmText={statusModal.item?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel" loading={statusModal.loading}
        variant={statusModal.item?.is_active ? "danger" : "success"}
      />

      <ConfirmationModal
        isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, item: null, loading: false })}
        onConfirm={confirmDelete}
        title="Delete University Semester"
        message={`Are you sure you want to delete "${deleteModal.item?.name}"? This action cannot be undone.`}
        confirmText="Delete" cancelText="Cancel" loading={deleteModal.loading} variant="danger"
      />
    </div>
  );
}
