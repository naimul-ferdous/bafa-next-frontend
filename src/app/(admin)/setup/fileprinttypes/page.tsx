"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FilePrintType } from "@/libs/types/filePrintType";
import { Icon } from "@iconify/react";
import { filePrintTypeService } from "@/libs/services/filePrintTypeService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { FilePrintTypeModalProvider, useFilePrintTypeModal } from "@/context/FilePrintTypeModalContext";
import FilePrintTypeFormModal from "@/components/fileprinttypes/FilePrintTypeFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

function FilePrintTypesPageContent() {
  const { openModal } = useFilePrintTypeModal();
  const [filePrintTypes, setFilePrintTypes] = useState<FilePrintType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Status toggle modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusType, setStatusType] = useState<FilePrintType | null>(null);
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

  const loadFilePrintTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await filePrintTypeService.getFilePrintTypes({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });
      // @ts-ignore - Assuming standard paginated response
      setFilePrintTypes(response.data);
      // @ts-ignore
      setPagination({
        // @ts-ignore
        current_page: response.current_page,
        // @ts-ignore
        last_page: response.last_page,
        // @ts-ignore
        per_page: response.per_page,
        // @ts-ignore
        total: response.total,
        // @ts-ignore
        from: response.from,
        // @ts-ignore
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load file print types:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadFilePrintTypes();
  }, [loadFilePrintTypes]);

  // Listen for updates
  useEffect(() => {
    const handleUpdate = () => loadFilePrintTypes();
    window.addEventListener('filePrintTypeUpdated', handleUpdate);
    return () => window.removeEventListener('filePrintTypeUpdated', handleUpdate);
  }, [loadFilePrintTypes]);

  const handleAdd = () => {
    openModal();
  };

  const handleEdit = (type: FilePrintType) => {
    openModal(type);
  };

  const handleToggleStatus = (type: FilePrintType) => {
    setStatusType(type);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusType) return;

    try {
      setStatusLoading(true);
      await filePrintTypeService.updateFilePrintType(statusType.id, {
        name: statusType.name,
        code: statusType.code,
        is_active: !statusType.is_active
      });
      await loadFilePrintTypes();
      setStatusModalOpen(false);
      setStatusType(null);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Table skeleton loader
  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div>
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
      </div>
    </div>
  );

  // Define table columns
  const columns: Column<FilePrintType>[] = [
    {
      key: "id",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900 w-16",
      render: (type, index) => (pagination.from || 0) + (index + 1),
    },
    {
      key: "name",
      header: "Type Name",
      className: "font-medium text-gray-900",
    },
    {
      key: "code",
      header: "Code",
      className: "text-gray-700 font-mono text-sm",
    },
    {
      key: "is_active",
      header: "Status",
      headerAlign: "center",
      className: "text-center w-32",
      render: (type) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
            type.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {type.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print w-32",
      render: (type) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEdit(type)}
            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
            title="Edit"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
          </button>
          {type.is_active ? (
            <button
              onClick={() => handleToggleStatus(type)}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Deactivate"
            >
              <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus(type)}
              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Activate"
            >
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
            </button>
          )}
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
          File Print Types
        </h2>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search types..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleAdd} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95">
            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
            Add Type
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableLoading />
      ) : (
        <DataTable
          columns={columns}
          data={filePrintTypes}
          keyExtractor={(type) => type.id.toString()}
          emptyMessage="No file print types found"
          onRowClick={handleEdit}
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
      <FilePrintTypeFormModal />

      {/* Status Toggle Confirmation Modal */}
      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusType?.is_active ? "Deactivate Type" : "Activate Type"}
        message={`Are you sure you want to ${statusType?.is_active ? "deactivate" : "activate"} "${statusType?.name}"?`}
        confirmText={statusType?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusType?.is_active ? "danger" : "success"}
      />
    </div>
  );
}

export default function FilePrintTypesPage() {
  return (
    <FilePrintTypeModalProvider>
      <FilePrintTypesPageContent />
    </FilePrintTypeModalProvider>
  );
}
