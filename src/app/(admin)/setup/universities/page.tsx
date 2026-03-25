"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SystemUniversity } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { universityService } from "@/libs/services/universityService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { UniversityModalProvider, useUniversityModal } from "@/context/UniversityModalContext";
import UniversityFormModal from "@/components/universities/UniversityFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

function UniversitiesPageContent() {
  const { openModal } = useUniversityModal();
  const [universities, setUniversities] = useState<SystemUniversity[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingUniversity, setDeletingUniversity] = useState<SystemUniversity | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusUniversity, setStatusUniversity] = useState<SystemUniversity | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

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

  const loadUniversities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await universityService.getAllUniversities({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });
      setUniversities(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load universities:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadUniversities();
  }, [loadUniversities]);

  useEffect(() => {
    const handleUpdate = () => loadUniversities();
    window.addEventListener('universityUpdated', handleUpdate);
    return () => window.removeEventListener('universityUpdated', handleUpdate);
  }, [loadUniversities]);

  const handleToggleStatus = (university: SystemUniversity) => {
    setStatusUniversity(university);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusUniversity) return;
    try {
      setStatusLoading(true);
      await universityService.updateUniversity(statusUniversity.id, {
        name: statusUniversity.name,
        short_name: statusUniversity.short_name || "",
        is_active: !statusUniversity.is_active,
      });
      await loadUniversities();
      setStatusModalOpen(false);
      setStatusUniversity(null);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeleteClick = (university: SystemUniversity) => {
    setDeletingUniversity(university);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUniversity) return;
    try {
      setDeleteLoading(true);
      await universityService.deleteUniversity(deletingUniversity.id);
      await loadUniversities();
      setDeleteModalOpen(false);
      setDeletingUniversity(null);
    } catch (error) {
      console.error("Failed to delete university:", error);
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

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
    </div>
  );

  const columns: Column<SystemUniversity>[] = [
    {
      key: "id",
      header: "SL.",
      className: "text-center text-gray-900",
      render: (_, index) => (pagination.from || 0) + index,
    },
    {
      key: "name",
      header: "University Name",
      className: "font-medium text-gray-900",
    },
    {
      key: "short_name",
      header: "Short Name",
      className: "text-gray-700 font-medium",
      render: (u) => u.short_name || "—",
    },
    {
      key: "code",
      header: "Code",
      className: "text-gray-700 font-mono text-sm",
    },
    {
      key: "is_current",
      header: "Current",
      className: "text-center",
      render: (university) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
          university.is_current ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
        }`}>
          {university.is_current ? "Current" : "—"}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      className: "text-center",
      render: (university) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
          university.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {university.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700",
      render: (university) =>
        university.created_at
          ? new Date(university.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          : "—",
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (university) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openModal(university)}
            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
            title="Edit"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
          </button>
          {university.is_active ? (
            <button
              onClick={() => handleToggleStatus(university)}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Deactivate"
            >
              <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus(university)}
              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Activate"
            >
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDeleteClick(university)}
            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
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
          All Universities List
        </h2>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by university name, code..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal()}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
            Add University
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableLoading />
      ) : (
        <DataTable
          columns={columns}
          data={universities}
          keyExtractor={(u) => u.id.toString()}
          emptyMessage="No universities found"
          onRowClick={(u) => openModal(u)}
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
      <UniversityFormModal />

      {/* Status Toggle Confirmation */}
      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusUniversity?.is_active ? "Deactivate University" : "Activate University"}
        message={`Are you sure you want to ${statusUniversity?.is_active ? "deactivate" : "activate"} "${statusUniversity?.name}"?`}
        confirmText={statusUniversity?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusUniversity?.is_active ? "danger" : "success"}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete University"
        message={`Are you sure you want to delete "${deletingUniversity?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}

export default function UniversitiesPage() {
  return (
    <UniversityModalProvider>
      <UniversitiesPageContent />
    </UniversityModalProvider>
  );
}
