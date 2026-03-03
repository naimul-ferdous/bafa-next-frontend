/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwMedicalDisposalSyllabusService } from "@/libs/services/atwMedicalDisposalSyllabusService";
import type { AtwMedicalDisposalSyllabus } from "@/libs/types/atwMedicalDisposal";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import { useCan } from "@/context/PagePermissionsContext";

export default function AtwMedicalDisposalSyllabusPage() {
  const router = useRouter();
  const can = useCan();

  const [syllabuses, setSyllabuses] = useState<AtwMedicalDisposalSyllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0,
  });
  const [statusModal, setStatusModal] = useState<{ open: boolean; item: AtwMedicalDisposalSyllabus | null; loading: boolean }>({ open: false, item: null, loading: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: AtwMedicalDisposalSyllabus | null; loading: boolean }>({ open: false, item: null, loading: false });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await atwMedicalDisposalSyllabusService.getAll({ page: currentPage, per_page: perPage, search: searchTerm || undefined });
      setSyllabuses(res.data);
      setPagination({ current_page: res.current_page, last_page: res.last_page, per_page: res.per_page, total: res.total, from: res.from, to: res.to });
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => { load(); }, [load]);

  const confirmToggleStatus = async () => {
    if (!statusModal.item) return;
    setStatusModal((p) => ({ ...p, loading: true }));
    try {
      await atwMedicalDisposalSyllabusService.update(statusModal.item.id, { is_active: !statusModal.item.is_active });
      await load();
      setStatusModal({ open: false, item: null, loading: false });
    } catch { setStatusModal((p) => ({ ...p, loading: false })); }
  };

  const confirmDelete = async () => {
    if (!deleteModal.item) return;
    setDeleteModal((p) => ({ ...p, loading: true }));
    try {
      await atwMedicalDisposalSyllabusService.delete(deleteModal.item.id);
      await load();
      setDeleteModal({ open: false, item: null, loading: false });
    } catch { setDeleteModal((p) => ({ ...p, loading: false })); }
  };

  const columns: Column<AtwMedicalDisposalSyllabus>[] = [
    {
      key: "sl", header: "SL.", headerAlign: "center", className: "text-center text-gray-900 w-12",
      render: (_, index) => (pagination.from || 0) + index,
    },
    {
      key: "name", header: "Syllabus Name", className: "font-medium text-gray-900",
      render: (row) => (
        <div>
          <div>{row.name}</div>
          {row.code && <div className="text-[10px] text-gray-500 font-mono">{row.code}</div>}
        </div>
      ),
    },
    {
      key: "schemas", header: "Schema Items", headerAlign: "center", className: "text-center",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
          {row.schemas?.length ?? 0} items
        </span>
      ),
    },
    {
      key: "is_active", header: "Status", headerAlign: "center", className: "text-center",
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full ${row.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {row.is_active ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      key: "actions", header: "Actions", headerAlign: "center", className: "text-center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          {can("view") && (
            <button onClick={() => router.push(`/atw/assessments/medical-disposal/syllabus/${row.id}`)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View">
              <Icon icon="hugeicons:view" className="w-4 h-4" />
            </button>
          )}
          {can("edit") && (
            <button onClick={() => router.push(`/atw/assessments/medical-disposal/syllabus/${row.id}/edit`)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
              <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            </button>
          )}
          {can("delete") && (
            row.is_active
              ? <button onClick={() => setStatusModal({ open: true, item: row, loading: false })} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Deactivate"><Icon icon="hugeicons:unavailable" className="w-4 h-4" /></button>
              : <button onClick={() => setStatusModal({ open: true, item: row, loading: false })} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Activate"><Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" /></button>
          )}
          {can("delete") && (
            <button onClick={() => setDeleteModal({ open: true, item: row, loading: false })} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
              <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 shadow-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">ATW Medical Disposal Syllabus</h2>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text" placeholder="Search by name or code..." value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
        {can("add") && (
          <button onClick={() => router.push("/atw/assessments/medical-disposal/syllabus/create")} className="px-4 py-2 rounded-lg text-white flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95 font-medium">
            <Icon icon="hugeicons:add-circle" className="w-4 h-4" />New Syllabus
          </button>
        )}
      </div>

      {loading ? (
        <div className="w-full min-h-[40vh] flex items-center justify-center">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      ) : (
        <DataTable
          columns={columns} data={syllabuses} keyExtractor={(row) => row.id.toString()}
          emptyMessage="No syllabus found"
          onRowClick={can("view") ? (row) => router.push(`/atw/assessments/medical-disposal/syllabus/${row.id}`) : undefined}
        />
      )}

      <Pagination
        currentPage={currentPage} lastPage={pagination.last_page} total={pagination.total}
        from={pagination.from} to={pagination.to} perPage={perPage}
        onPageChange={setCurrentPage} onPerPageChange={(val) => { setPerPage(val); setCurrentPage(1); }}
      />

      <ConfirmationModal
        isOpen={statusModal.open} onClose={() => setStatusModal({ open: false, item: null, loading: false })}
        onConfirm={confirmToggleStatus}
        title={statusModal.item?.is_active ? "Deactivate Syllabus" : "Activate Syllabus"}
        message={`Are you sure you want to ${statusModal.item?.is_active ? "deactivate" : "activate"} "${statusModal.item?.name}"?`}
        confirmText={statusModal.item?.is_active ? "Deactivate" : "Activate"} cancelText="Cancel"
        loading={statusModal.loading} variant={statusModal.item?.is_active ? "danger" : "success"}
      />
      <ConfirmationModal
        isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, item: null, loading: false })}
        onConfirm={confirmDelete} title="Delete Syllabus"
        message={`Are you sure you want to permanently delete "${deleteModal.item?.name}"? This cannot be undone.`}
        confirmText="Delete" cancelText="Cancel" loading={deleteModal.loading} variant="danger"
      />
    </div>
  );
}
