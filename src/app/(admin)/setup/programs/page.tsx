/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SystemProgram } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { programService } from "@/libs/services/programService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import { useCan } from "@/context/PagePermissionsContext";

export default function ProgramsPage() {
  const router = useRouter();
  const { userIsSystemAdmin } = useAuth();
  const can = useCan();

  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<SystemProgram | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk selection
  const [showSelection, setShowSelection] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDisableModalOpen, setBulkDisableModalOpen] = useState(false);
  const [bulkDisableLoading, setBulkDisableLoading] = useState(false);

  const allSelected = programs.length > 0 && programs.every((p) => selectedIds.has(p.id));
  const someSelected = programs.some((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(programs.map((p) => p.id)));
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelection = () => {
    if (showSelection) setSelectedIds(new Set());
    setShowSelection((prev) => !prev);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setSelectedIds(new Set());
      const response = await programService.getAllPrograms({ page: currentPage, per_page: perPage, search: searchTerm || undefined });
      setPrograms(response.data);
      setPagination({ current_page: response.current_page, last_page: response.last_page, per_page: response.per_page, total: response.total, from: response.from, to: response.to });
    } catch (error) {
      console.error("Failed to load programs:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => { loadData(); }, [loadData]);

  const confirmBulkDisable = async () => {
    try {
      setBulkDisableLoading(true);
      await Promise.all([...selectedIds].map((id) => programService.updateProgram(id, { is_active: false })));
      await loadData();
      setBulkDisableModalOpen(false);
    } catch (error) {
      console.error("Failed to bulk disable:", error);
    } finally {
      setBulkDisableLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedProgram) return;
    try {
      setDeleteLoading(true);
      await programService.deleteProgram(selectedProgram.id);
      await loadData();
      setDeleteModalOpen(false);
      setSelectedProgram(null);
    } catch (error) {
      console.error("Failed to delete program:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const checkboxColumn: Column<SystemProgram> = {
    key: "checkbox",
    header: (
      <input
        type="checkbox"
        checked={allSelected}
        ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
        onChange={toggleSelectAll}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    headerAlign: "center",
    className: "text-center w-10",
    render: (item) => (
      <input
        type="checkbox"
        checked={selectedIds.has(item.id)}
        onChange={() => toggleSelectOne(item.id)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />
    ),
  };

  const columns: Column<SystemProgram>[] = [
    ...(showSelection ? [checkboxColumn] : []),
    { key: "id", header: "SL.", headerAlign: "center", className: "text-center w-16", render: (_, index) => (pagination.from || 0) + index },
    { key: "name", header: "Program Name", className: "font-semibold text-gray-900" },
    { key: "short_name", header: "Short Name", className: "text-gray-600", render: (p) => p.short_name || "—" },
    { key: "duration_months", header: "Duration (months)", headerAlign: "center", className: "text-gray-700 text-center", render: (p) => (p as any).duration_months || "—" },
    {
      key: "is_changeable",
      header: "Changeable",
      headerAlign: "center",
      className: "text-center",
      render: (p) => p.is_changeable ? (
        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">YES</span>
      ) : (
        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">NO</span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (p) => (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {p.is_active ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center w-24 no-print",
      render: (item) => (
        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          {(can("edit") || userIsSystemAdmin) && (
            <button onClick={() => router.push(`/setup/programs/${item.id}/edit`)} className="text-yellow-600 hover:text-yellow-700">
              <Icon icon="hugeicons:pencil-edit-01" className="w-5 h-5" />
            </button>
          )}
          {(can("delete") || userIsSystemAdmin) && (
            <button onClick={() => { setSelectedProgram(item); setDeleteModalOpen(true); }} className="text-red-600 hover:text-red-700">
              <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">All Programs List</h2>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(can("delete") || userIsSystemAdmin) && (
            <button
              onClick={toggleSelection}
              className={`px-3 py-2 text-sm rounded-lg border flex items-center gap-1.5 transition-colors ${
                showSelection ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon icon="hugeicons:task-done-01" className="w-4 h-4" />
              Select
            </button>
          )}
        </div>
        {(can("create") || userIsSystemAdmin) && (
          <button onClick={() => router.push("/setup/programs/create")} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
            <Icon icon="hugeicons:add-circle" className="w-5 h-5" />
            Add Program
          </button>
        )}
      </div>

      {showSelection && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-700">{selectedIds.size} item{selectedIds.size > 1 ? "s" : ""} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setBulkDisableModalOpen(true)} className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1.5">
              <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
              Disable Selected
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100">
              Deselect All
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" /></div>
      ) : (
        <DataTable columns={columns} data={programs} keyExtractor={(p) => p.id.toString()} onRowClick={(p) => router.push(`/setup/programs/${p.id}`)} emptyMessage="No programs found" />
      )}

      <Pagination
        currentPage={currentPage}
        lastPage={pagination.last_page}
        total={pagination.total}
        from={pagination.from}
        to={pagination.to}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={(val) => { setPerPage(val); setCurrentPage(1); }}
      />

      <ConfirmationModal
        isOpen={bulkDisableModalOpen}
        onClose={() => setBulkDisableModalOpen(false)}
        onConfirm={confirmBulkDisable}
        title="Disable Selected"
        message={`Are you sure you want to disable ${selectedIds.size} selected program${selectedIds.size > 1 ? "s" : ""}?`}
        confirmText="Disable All"
        cancelText="Cancel"
        loading={bulkDisableLoading}
        variant="warning"
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Program"
        message={`Are you sure you want to delete "${selectedProgram?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
