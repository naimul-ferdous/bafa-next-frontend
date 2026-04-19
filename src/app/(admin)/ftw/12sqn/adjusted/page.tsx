"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import {
  ftw12sqnResultsBupAdjustMarkGradingService,
  Ftw12sqnResultsBupAdjustMarkGrading,
} from "@/libs/services/ftw12sqnResultsBupAdjustMarkGradingService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import {
  Ftw12sqnAdjustedModalProvider,
  useFtw12sqnAdjustedModal,
} from "@/context/Ftw12sqnAdjustedModalContext";
import Ftw12sqnAdjustedFormModal from "@/components/ftw-12sqn-adjusted/Ftw12sqnAdjustedFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

function AdjustedPageContent() {
  const { openModal } = useFtw12sqnAdjustedModal();
  const [records, setRecords] = useState<Ftw12sqnResultsBupAdjustMarkGrading[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ftw12sqnResultsBupAdjustMarkGrading | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ftw12sqnResultsBupAdjustMarkGradingService.getAll({
        page: currentPage,
        per_page: perPage,
      });
      setRecords(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load records:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Listen for record updates
  useEffect(() => {
    const handleUpdate = () => loadRecords();
    window.addEventListener('ftw12sqnAdjustedUpdated', handleUpdate);
    return () => window.removeEventListener('ftw12sqnAdjustedUpdated', handleUpdate);
  }, [loadRecords]);

  const handleAdd = () => {
    openModal();
  };

  const handleEdit = (record: Ftw12sqnResultsBupAdjustMarkGrading) => {
    openModal(record);
  };

  const handleView = (record: Ftw12sqnResultsBupAdjustMarkGrading) => {
    openModal(record);
  };

  const handleDelete = (record: Ftw12sqnResultsBupAdjustMarkGrading) => {
    setDeleteTarget(record);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await ftw12sqnResultsBupAdjustMarkGradingService.remove(deleteTarget.id);
      await loadRecords();
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete record:", error);
      alert("Failed to delete record");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = () => {
    console.log("Export records");
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  const filteredRecords = searchTerm
    ? records.filter((r) =>
        (r.grade || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    : records;

  // Table skeleton loader
  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div>
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
      </div>
    </div>
  );

  // Define table columns
  const columns: Column<Ftw12sqnResultsBupAdjustMarkGrading>[] = [
    {
      key: "id",
      header: "SL.",
      className: "text-center text-gray-900",
      render: (_record, index) => (pagination.from || 0) + index,
    },
    {
      key: "obtain_mark",
      header: "Obtain Mark",
      className: "font-medium text-gray-900",
      render: (record) => (record.obtain_mark !== null && record.obtain_mark !== undefined ? record.obtain_mark : "—"),
    },
    {
      key: "adjusted_mark",
      header: "Adjusted Mark",
      className: "font-medium text-gray-900",
      render: (record) => (record.adjusted_mark !== null && record.adjusted_mark !== undefined ? record.adjusted_mark : "—"),
    },
    {
      key: "grade",
      header: "Grade",
      className: "text-gray-700 font-mono text-sm",
      render: (record) => record.grade || "—",
    },
    {
      key: "created_by",
      header: "Created By",
      className: "text-gray-700",
      render: (record) => record.creator?.name || "—",
    },
    {
      key: "updated_by",
      header: "Updated By",
      className: "text-gray-700",
      render: (record) => record.updater?.name || "—",
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700",
      render: (record) =>
        record.created_at
          ? new Date(record.created_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (record) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEdit(record)}
            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
            title="Edit"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(record)}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 shadow-sm">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <FullLogo />
        </div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
          Bangladesh Air Force Academy
        </h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">
          Adjusted Mark Grading List
        </h2>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by grade..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleAdd} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95">
            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
            Add Record
          </button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-gray-700 flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
            <Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableLoading />
      ) : (
        <DataTable
          columns={columns}
          data={filteredRecords}
          keyExtractor={(record) => record.id.toString()}
          emptyMessage="No records found"
          onRowClick={handleView}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        lastPage={pagination.last_page}
        total={pagination.total}
        from={pagination.from}
        to={pagination.to}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={handlePerPageChange}
      />

      {/* Form Modal */}
      <Ftw12sqnAdjustedFormModal />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Record"
        message={`Are you sure you want to delete record #${deleteTarget?.id ?? ""}?`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}

export default function AdjustedPage() {
  return (
    <Ftw12sqnAdjustedModalProvider>
      <AdjustedPageContent />
    </Ftw12sqnAdjustedModalProvider>
  );
}
