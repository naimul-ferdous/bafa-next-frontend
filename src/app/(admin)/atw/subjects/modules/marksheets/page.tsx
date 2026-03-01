/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AtwSubjectsModuleMarksheet } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { atwMarksheetService } from "@/libs/services/atwMarksheetService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import { useCan } from "@/context/PagePermissionsContext";

export default function AtwMarksheetsPage() {
  const router = useRouter();
  const { userIsSystemAdmin } = useAuth();
  const can = useCan();
  const [marksheets, setMarksheets] = useState<AtwSubjectsModuleMarksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMarksheet, setSelectedMarksheet] = useState<AtwSubjectsModuleMarksheet | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk selection
  const [showSelection, setShowSelection] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDisableModalOpen, setBulkDisableModalOpen] = useState(false);
  const [bulkDisableLoading, setBulkDisableLoading] = useState(false);

  const allSelected = marksheets.length > 0 && marksheets.every(m => selectedIds.has(m.id));
  const someSelected = marksheets.some(m => selectedIds.has(m.id));

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(marksheets.map(m => m.id)));
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelection = () => {
    if (showSelection) setSelectedIds(new Set());
    setShowSelection(prev => !prev);
  };

  const confirmBulkDisable = async () => {
    try {
      setBulkDisableLoading(true);
      await atwMarksheetService.bulkDisable([...selectedIds]);
      await loadData();
      setBulkDisableModalOpen(false);
    } catch (error) {
      console.error("Failed to bulk disable:", error);
    } finally {
      setBulkDisableLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setSelectedIds(new Set());
      const response = await atwMarksheetService.getAllMarksheets({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });

      setMarksheets(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load marksheets:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = () => router.push("/atw/subjects/modules/marksheets/create");
  const handleEdit = (item: AtwSubjectsModuleMarksheet) => router.push(`/atw/subjects/modules/marksheets/${item.id}/edit`);
  const handleView = (item: AtwSubjectsModuleMarksheet) => router.push(`/atw/subjects/modules/marksheets/${item.id}`);

  const handleDeleteClick = (item: AtwSubjectsModuleMarksheet) => {
    setSelectedMarksheet(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedMarksheet) return;
    try {
      setDeleteLoading(true);
      await atwMarksheetService.deleteMarksheet(selectedMarksheet.id);
      await loadData();
      setDeleteModalOpen(false);
      setSelectedMarksheet(null);
    } catch (error) {
      console.error("Failed to delete marksheet:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const checkboxColumn: Column<AtwSubjectsModuleMarksheet> = {
    key: "checkbox",
    header: (
      <input
        type="checkbox"
        checked={allSelected}
        ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
        onChange={toggleSelectAll}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer"
        onClick={e => e.stopPropagation()}
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
        onClick={e => e.stopPropagation()}
      />
    ),
  };

  const columns: Column<AtwSubjectsModuleMarksheet>[] = [
    ...(showSelection ? [checkboxColumn] : []),
    {
      key: "id",
      header: "SL.",
      className: "text-center w-16",
      render: (_, index) => (pagination.from || 0) + index
    },
    { key: "name", header: "Marksheet Name", className: "font-semibold text-gray-900" },
    { key: "code", header: "Code", className: "text-gray-600 font-mono" },
    {
      key: "marks",
      header: "Components",
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.marks?.map((m, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100 uppercase">
              {m.name} ({m.percentage}%)
            </span>
          )) || <span className="text-gray-400 italic text-xs">No components</span>}
        </div>
      )
    },
    {
      key: "is_active",
      header: "Status",
      className: "text-center",
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {item.is_active ? "ACTIVE" : "INACTIVE"}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-center w-24",
      render: (item) => (
        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          {can('edit') && (
            <button onClick={() => handleEdit(item)} className="text-yellow-600 hover:text-yellow-700">
              <Icon icon="hugeicons:pencil-edit-01" className="w-5 h-5" />
            </button>
          )}
          {can('delete') && (
            <button onClick={() => handleDeleteClick(item)} className="text-red-600 hover:text-red-700">
              <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">ATW Subject Module Marksheets</h2>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search marksheets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {can('delete') && (
            <button
              onClick={toggleSelection}
              className={`px-3 py-2 text-sm rounded-lg border flex items-center gap-1.5 transition-colors ${
                showSelection
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon icon="hugeicons:task-done-01" className="w-4 h-4" />
              Select
            </button>
          )}
        </div>
        <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Icon icon="hugeicons:add-circle" className="w-5 h-5" />
          Add Marksheet
        </button>
      </div>

      {/* Bulk Action Bar */}
      {showSelection && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-700">
            {selectedIds.size} item{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setBulkDisableModalOpen(true)}
              className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1.5 transition-colors"
            >
              <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
              Disable Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" /></div>
      ) : (
        <DataTable
          columns={columns}
          data={marksheets}
          keyExtractor={(item) => item.id.toString()}
          onRowClick={handleView}
          emptyMessage="No marksheets found"
        />
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
        message={`Are you sure you want to disable ${selectedIds.size} selected marksheet${selectedIds.size > 1 ? "s" : ""}? They can be re-enabled individually later.`}
        confirmText="Disable All"
        cancelText="Cancel"
        loading={bulkDisableLoading}
        variant="warning"
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Marksheet"
        message={`Are you sure you want to delete "${selectedMarksheet?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
