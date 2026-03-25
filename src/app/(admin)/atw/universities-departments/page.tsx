"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AtwUniversityDepartment } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { atwUniversityDepartmentService } from "@/libs/services/atwUniversityDepartmentService";
import { universityService } from "@/libs/services/universityService";
import type { SystemUniversity } from "@/libs/types/system";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { AtwUniversityDepartmentModalProvider, useAtwUniversityDepartmentModal } from "@/context/AtwUniversityDepartmentModalContext";
import AtwUniversityDepartmentFormModal from "@/components/atw-universities/AtwUniversityDepartmentFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

function DepartmentsPageContent() {
  const { openModal } = useAtwUniversityDepartmentModal();
  const [departments, setDepartments] = useState<AtwUniversityDepartment[]>([]);
  const [universities, setUniversities] = useState<SystemUniversity[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<AtwUniversityDepartment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusDepartment, setStatusDepartment] = useState<AtwUniversityDepartment | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterUniversityId, setFilterUniversityId] = useState<number | undefined>(undefined);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0,
  });

  useEffect(() => {
    universityService.getAllUniversities({ per_page: 100 }).then(res => setUniversities(res.data));
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await atwUniversityDepartmentService.getAllDepartments({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
        university_id: filterUniversityId,
      });
      setDepartments(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load departments:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, filterUniversityId]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    const handleUpdate = () => loadDepartments();
    window.addEventListener('departmentUpdated', handleUpdate);
    return () => window.removeEventListener('departmentUpdated', handleUpdate);
  }, [loadDepartments]);

  const handleToggleStatus = (department: AtwUniversityDepartment) => {
    setStatusDepartment(department);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusDepartment) return;
    try {
      setStatusLoading(true);
      await atwUniversityDepartmentService.updateDepartment(statusDepartment.id, {
        name: statusDepartment.name,
        code: statusDepartment.code,
        university_id: statusDepartment.university_id,
        is_active: !statusDepartment.is_active,
      });
      await loadDepartments();
      setStatusModalOpen(false);
      setStatusDepartment(null);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeleteClick = (department: AtwUniversityDepartment) => {
    setDeletingDepartment(department);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingDepartment) return;
    try {
      setDeleteLoading(true);
      await atwUniversityDepartmentService.deleteDepartment(deletingDepartment.id);
      await loadDepartments();
      setDeleteModalOpen(false);
      setDeletingDepartment(null);
    } catch (error) {
      console.error("Failed to delete department:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleUniversityFilterChange = (value: number | undefined) => {
    setFilterUniversityId(value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  const getUniversityName = (universityId: number) => {
    const u = universities.find(u => u.id === universityId);
    return u ? (u.short_name || u.name) : "—";
  };

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
    </div>
  );

  const columns: Column<AtwUniversityDepartment>[] = [
    {
      key: "id",
      header: "SL.",
      className: "text-center text-gray-900",
      render: (_, index) => (pagination.from || 0) + index,
    },
    {
      key: "university_id",
      header: "University",
      className: "text-gray-700 font-medium",
      render: (d) => getUniversityName(d.university_id),
    },
    {
      key: "name",
      header: "Department Name",
      className: "font-medium text-gray-900",
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
      render: (d) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
          d.is_current ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
        }`}>
          {d.is_current ? "Current" : "—"}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      className: "text-center",
      render: (d) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
          d.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {d.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700",
      render: (d) =>
        d.created_at
          ? new Date(d.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          : "—",
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (d) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openModal(d)}
            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
            title="Edit"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
          </button>
          {d.is_active ? (
            <button
              onClick={() => handleToggleStatus(d)}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Deactivate"
            >
              <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus(d)}
              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Activate"
            >
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDeleteClick(d)}
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
          All University Departments List
        </h2>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-72">
            <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <select
            value={filterUniversityId ?? ""}
            onChange={(e) => handleUniversityFilterChange(e.target.value ? Number(e.target.value) : undefined)}
            className="py-2 px-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          >
            <option value="">All Universities</option>
            {universities.map(u => (
              <option key={u.id} value={u.id}>{u.short_name || u.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => openModal()}
          className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"
        >
          <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
          Add Department
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <TableLoading />
      ) : (
        <DataTable
          columns={columns}
          data={departments}
          keyExtractor={(d) => d.id.toString()}
          emptyMessage="No departments found"
          onRowClick={(d) => openModal(d)}
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
      <AtwUniversityDepartmentFormModal />

      {/* Status Toggle Confirmation */}
      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusDepartment?.is_active ? "Deactivate Department" : "Activate Department"}
        message={`Are you sure you want to ${statusDepartment?.is_active ? "deactivate" : "activate"} "${statusDepartment?.name}"?`}
        confirmText={statusDepartment?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusDepartment?.is_active ? "danger" : "success"}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${deletingDepartment?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}

export default function UniversityDepartmentsPage() {
  return (
    <AtwUniversityDepartmentModalProvider>
      <DepartmentsPageContent />
    </AtwUniversityDepartmentModalProvider>
  );
}
