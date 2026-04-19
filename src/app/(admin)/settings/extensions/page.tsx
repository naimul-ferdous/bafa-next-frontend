"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { systemExtensionService } from "@/libs/services/systemExtensionService";
import type { SystemExtension } from "@/libs/types/systemExtension";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import { ExtensionModalProvider, useExtensionModal } from "@/context/ExtensionModalContext";
import ExtensionFormModal from "@/components/extensions/ExtensionFormModal";

function ExtensionsPageContent() {
  const { openModal } = useExtensionModal();
  const [extensions, setExtensions] = useState<SystemExtension[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingExtension, setDeletingExtension] = useState<SystemExtension | null>(null);
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

  const loadExtensions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await systemExtensionService.getAll({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });
      setExtensions(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load extensions:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadExtensions();
  }, [loadExtensions]);

  // Listen for extension updates
  useEffect(() => {
    const handleUpdate = () => loadExtensions();
    window.addEventListener("extensionUpdated", handleUpdate);
    return () => window.removeEventListener("extensionUpdated", handleUpdate);
  }, [loadExtensions]);

  const handleAddExtension = () => openModal();
  const handleEditExtension = (ext: SystemExtension) => openModal(ext);

  const handleDeleteExtension = (ext: SystemExtension) => {
    setDeletingExtension(ext);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingExtension) return;
    try {
      setDeleteLoading(true);
      await systemExtensionService.delete(deletingExtension.id);
      await loadExtensions();
      setDeleteModalOpen(false);
      setDeletingExtension(null);
    } catch (error) {
      console.error("Failed to delete extension:", error);
      alert("Failed to delete extension");
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
      <div>
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
      </div>
    </div>
  );

  const columns: Column<SystemExtension>[] = [
    {
      key: "id",
      header: "SL.",
      className: "text-center text-gray-900",
      render: (_ext, index) => (pagination.from || 0) + index,
    },
    {
      key: "name",
      header: "Extension Name",
      className: "font-medium text-gray-900",
    },
    {
      key: "role_id",
      header: "Role",
      className: "text-gray-700",
      render: (ext) => ext.role?.name || "—",
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700 whitespace-nowrap",
      render: (ext) =>
        ext.created_at
          ? new Date(ext.created_at).toLocaleDateString("en-GB", {
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
      render: (ext) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEditExtension(ext)}
            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
            title="Edit"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteExtension(ext)}
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
          All Extensions List
        </h2>
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
            placeholder="Search by extension name..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddExtension}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
            Add Extension
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableLoading />
      ) : (
        <DataTable
          columns={columns}
          data={extensions}
          keyExtractor={(ext) => ext.id.toString()}
          emptyMessage="No extensions found"
          onRowClick={handleEditExtension}
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

      {/* Extension Form Modal */}
      <ExtensionFormModal />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Extension"
        message={`Are you sure you want to delete the extension "${deletingExtension?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}

export default function ExtensionsPage() {
  return (
    <ExtensionModalProvider>
      <ExtensionsPageContent />
    </ExtensionModalProvider>
  );
}
