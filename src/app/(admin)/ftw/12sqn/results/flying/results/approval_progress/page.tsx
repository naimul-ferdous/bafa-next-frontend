"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { ftw12sqnFlyingExamApprovalProcessService } from "@/libs/services/ftw12sqnFlyingExamApprovalProcessService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { ApprovalProcessModalProvider, useApprovalProcessModal } from "@/context/ApprovalProcessModalContext";
import ApprovalProcessFormModal from "@/components/approval/ApprovalProcessFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import type { ApprovalProcess } from "@/libs/types/approval";
import Sqn12ApprovalProcessFormModal from "@/components/approval/Sqn12ApprovalProcessFormModal";

function ApprovalProcessPageContent() {
  const { openModal } = useApprovalProcessModal();
  const [processes, setProcesses] = useState<ApprovalProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProcess, setDeletingProcess] = useState<ApprovalProcess | null>(null);
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

  const loadProcesses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ftw12sqnFlyingExamApprovalProcessService.getAll({
        page: currentPage,
        per_page: perPage,
      });

      // Filter by search term client-side
      let filteredData = response.data;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredData = response.data.filter(
          (p) =>
            p.status_code?.toLowerCase().includes(term) ||
            p.role?.name?.toLowerCase().includes(term) ||
            p.description?.toLowerCase().includes(term)
        );
      }

      // Sort by status_code
      filteredData.sort((a, b) => parseInt(a.status_code) - parseInt(b.status_code));

      setProcesses(filteredData);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load approval processes:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  // Listen for process updates
  useEffect(() => {
    const handleProcessUpdate = () => loadProcesses();
    window.addEventListener("approvalProcessUpdated", handleProcessUpdate);
    return () => window.removeEventListener("approvalProcessUpdated", handleProcessUpdate);
  }, [loadProcesses]);

  const handleAddProcess = () => {
    openModal();
  };

  const handleEditProcess = (process: ApprovalProcess) => {
    openModal(process);
  };

  const handleDeleteProcess = (process: ApprovalProcess) => {
    setDeletingProcess(process);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingProcess) return;

    try {
      setDeleteLoading(true);
      await ftw12sqnFlyingExamApprovalProcessService.delete(deletingProcess.id);
      await loadProcesses();
      setDeleteModalOpen(false);
      setDeletingProcess(null);
    } catch (error) {
      console.error("Failed to delete approval process:", error);
      alert("Failed to delete approval process");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  // Table skeleton loader
  const TableSkeleton = () => (
    <div className="animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["SL.", "Level", "Role", "Description", "Status", "Created At", "Actions"].map((header, i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: perPage }).map((_, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-8 bg-gray-200 rounded-full w-8"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 bg-gray-200 rounded-full w-16 mx-auto"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Define table columns
  const columns: Column<ApprovalProcess>[] = [
    {
      key: "id",
      header: "SL.",
      className: "text-center text-gray-900",
      render: (_, index) => (pagination.from || 0) + index,
    },
    {
      key: "status_code",
      header: "Level",
      className: "text-center font-bold text-gray-900",
      headerAlign: "center",
      render: (process) => (
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold text-lg">
          {process.status_code}
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      className: "font-medium text-gray-900",
      render: (process) => (
        <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-700">
          {process.role?.name || "—"}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      className: "text-gray-700",
      render: (process) => <span className="line-clamp-2">{process.description || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      headerAlign: "center",
      render: (process) => (
        <span
          className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full ${
            process.status === "active"
              ? "bg-green-100 text-green-800"
              : process.status === "inactive"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {process.status === "active" ? "Active" : process.status === "inactive" ? "Inactive" : "Draft"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700 whitespace-nowrap",
      render: (process) =>
        process.created_at
          ? new Date(process.created_at).toLocaleDateString("en-GB", {
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
      render: (process) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => handleEditProcess(process)}
            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
            title="Edit"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteProcess(process)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <FullLogo />
        </div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
          FTW 12sqn Flying Examination - Approval Process Management
        </h2>
        <p className="text-sm text-gray-500 mt-1">Configure the approval hierarchy levels</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon
            icon="hugeicons:search-01"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by level or role..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddProcess}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
          >
            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
            Add Level
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={processes}
          keyExtractor={(process) => process.id.toString()}
          emptyMessage="No approval processes found. Click 'Add Level' to create one."
        />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results
          </div>
          <select
            value={perPage}
            onChange={(e) => handlePerPageChange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />
            Prev
          </button>
          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 text-sm rounded-lg ${
                currentPage === page ? "bg-blue-600 text-white" : "border border-black hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(pagination.last_page, prev + 1))}
            disabled={currentPage === pagination.last_page}
            className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      </div>

      {/* Form Modal */}
      <Sqn12ApprovalProcessFormModal />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Approval Level"
        message={`Are you sure you want to delete approval level "${deletingProcess?.status_code}" (${deletingProcess?.role?.name})? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}

export default function ApprovalProcessPage() {
  return (
    <ApprovalProcessModalProvider>
      <ApprovalProcessPageContent />
    </ApprovalProcessModalProvider>
  );
}
