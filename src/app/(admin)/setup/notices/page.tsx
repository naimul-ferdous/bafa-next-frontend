/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Aro, AroStatus } from "@/libs/types/aro";
import { Icon } from "@iconify/react";
import { aroService } from "@/libs/services/aroService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

const STATUS_STYLES: Record<AroStatus, string> = {
  running:  "bg-green-100 text-green-800",
  draft:    "bg-gray-100 text-gray-700",
  expired:  "bg-red-100 text-red-800",
  archived: "bg-yellow-100 text-yellow-800",
};

const STATUS_LABELS: Record<AroStatus, string> = {
  running:  "Running",
  draft:    "Draft",
  expired:  "Expired",
  archived: "Archived",
};

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Aro[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Status toggle modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusNotice, setStatusNotice] = useState<Aro | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AroStatus | "">("");
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

  const loadNotices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await aroService.getAll({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      });

      setNotices(response.data);
      setPagination({
        current_page: response.current_page,
        last_page:    response.last_page,
        per_page:     response.per_page,
        total:        response.total,
        from:         response.from,
        to:           response.to,
      });
    } catch (error) {
      console.error("Failed to load notices:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, statusFilter]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const handleAddNotice    = () => router.push("/setup/notices/create");
  const handleEditNotice   = (notice: Aro) => router.push(`/setup/notices/${notice.id}/edit`);
  const handleViewNotice   = (notice: Aro) => router.push(`/setup/notices/${notice.id}`);
  
  const handleToggleStatus = (notice: Aro) => {
    setStatusNotice(notice);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusNotice) return;

    try {
      setStatusLoading(true);
      // Toggle logic: If running -> archived, if archived/draft/expired -> running
      const newStatus: AroStatus = statusNotice.status === 'running' ? 'archived' : 'running';
      await aroService.updateStatus(statusNotice.id, newStatus);
      await loadNotices();
      setStatusModalOpen(false);
      setStatusNotice(null);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExport        = () => console.log("Export notices");
  const handleSearchChange  = (value: string) => { setSearchTerm(value); setCurrentPage(1); };
  const handleStatusChange  = (value: string)  => { setStatusFilter(value as AroStatus | ""); setCurrentPage(1); };
  const handlePerPageChange = (value: number)  => { setPerPage(value); setCurrentPage(1); };

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  const columns: Column<Aro>[] = [
    {
      key: "id",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900",
      render: (_, index) => (pagination.from || 0) + index,
    },
    {
      key: "title",
      header: "Title",
      className: "font-medium text-gray-900",
      render: (notice) => notice.title ?? "—",
    },
    {
      key: "expired_date",
      header: "Expired Date",
      headerAlign: "center",
      className: "text-center text-gray-700",
      render: (notice) =>
        notice.expired_date
          ? new Date(notice.expired_date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
    },
    {
      key: "status",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (notice) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[notice.status]}`}
        >
          {STATUS_LABELS[notice.status]}
        </span>
      ),
    },
    {
      key: "file",
      header: "File",
      headerAlign: "center",
      className: "text-center",
      render: (notice) =>
        notice.file ? (
          <a
            href={notice.file}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <Icon icon="hugeicons:file-download" className="w-4 h-4" />
            View
          </a>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (notice: Aro) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleViewNotice(notice)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View">
            <Icon icon="hugeicons:view" className="w-4 h-4" />
          </button>
          <button onClick={() => handleEditNotice(notice)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors" title="Edit">
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(notice)}
            className={`p-1 rounded transition-colors ${notice.status === 'running' ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
            title={notice.status === 'running' ? "Archive Notice" : "Restore Notice"}
          >
            <Icon icon={notice.status === 'running' ? "hugeicons:unavailable" : "hugeicons:checkmark-circle-02"} className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">Notices / ARO List</h2>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative w-72">
            <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="running">Running</option>
            <option value="expired">Expired</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddNotice}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
            Add Notice
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg text-gray-700 flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
          >
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
          data={notices}
          keyExtractor={(notice) => notice.id.toString()}
          emptyMessage="No notices found"
          onRowClick={handleViewNotice}
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

      {/* Status Toggle Confirmation Modal */}
      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusNotice?.status === 'running' ? "Archive Notice" : "Restore Notice"}
        message={`Are you sure you want to ${statusNotice?.status === 'running' ? "archive" : "restore"} the notice "${statusNotice?.title}"?`}
        confirmText={statusNotice?.status === 'running' ? "Archive" : "Restore"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusNotice?.status === 'running' ? "danger" : "success"}
      />
    </div>
  );
}
