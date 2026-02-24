"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Wing } from "@/libs/types/user";
import { Icon } from "@iconify/react";
import { wingService } from "@/libs/services/wingService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { WingModalProvider, useWingModal } from "@/context/WingModalContext";
import WingFormModal from "@/components/wings/WingFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

function WingsPageContent() {
  const { openModal } = useWingModal();
  const [wings, setWings] = useState<Wing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Status toggle modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusWing, setStatusWing] = useState<Wing | null>(null);
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

  const loadWings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await wingService.getAllWings({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });
      setWings(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load wings:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadWings();
  }, [loadWings]);

  // Listen for wing updates
  useEffect(() => {
    const handleWingUpdate = () => loadWings();
    window.addEventListener('wingUpdated', handleWingUpdate);
    return () => window.removeEventListener('wingUpdated', handleWingUpdate);
  }, [loadWings]);

  const handleAddWing = () => {
    openModal();
  };

  const handleEditWing = (wing: Wing) => {
    openModal(wing);
  };

  const handleViewWing = (wing: Wing) => {
    openModal(wing); // Open in modal for editing/viewing
  };

  const handleToggleStatus = (wing: Wing) => {
    setStatusWing(wing);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusWing) return;

    try {
      setStatusLoading(true);
      await wingService.updateWing(statusWing.id, {
        name: statusWing.name,
        is_active: !statusWing.is_active
      });
      await loadWings();
      setStatusModalOpen(false);
      setStatusWing(null);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExport = () => {
    console.log("Export wings");
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
  const columns: Column<Wing>[] = [
    {
      key: "id",
      header: "SL.",
      className: "text-center text-gray-900",
      render: (wing, index) => (pagination.from || 0) + (index + 1),
    },
    {
      key: "name",
      header: "Wing Name",
      className: "font-medium text-gray-900",
    },
    {
      key: "code",
      header: "Code",
      className: "text-gray-700 font-mono text-sm",
    },
    {
      key: "description",
      header: "Description",
      className: "text-gray-700",
      render: (wing) => (
        <span className="line-clamp-2">
          {wing.description || "—"}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      className: "text-gray-700",
      render: (wing) => wing.location || "—",
    },
    {
      key: "is_active",
      header: "Status",
      className: "text-center",
      render: (wing) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
            wing.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {wing.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700",
      render: (wing) =>
        wing.created_at
          ? new Date(wing.created_at).toLocaleDateString("en-GB", {
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
      render: (wing) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEditWing(wing)}
            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
            title="Edit"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
          </button>
          {wing.is_active ? (
            <button
              onClick={() => handleToggleStatus(wing)}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Deactivate"
            >
              <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus(wing)}
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
          All Wings List
        </h2>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by wing name, code..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleAddWing} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95">
            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
            Add Wing
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
          data={wings}
          keyExtractor={(wing) => wing.id.toString()}
          emptyMessage="No wings found"
          onRowClick={handleViewWing}
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

      {/* Wing Form Modal */}
      <WingFormModal />

      {/* Status Toggle Confirmation Modal */}
      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusWing?.is_active ? "Deactivate Wing" : "Activate Wing"}
        message={`Are you sure you want to ${statusWing?.is_active ? "deactivate" : "activate"} the wing "${statusWing?.name}"?`}
        confirmText={statusWing?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusWing?.is_active ? "danger" : "success"}
      />
    </div>
  );
}

export default function WingsPage() {
  return (
    <WingModalProvider>
      <WingsPageContent />
    </WingModalProvider>
  );
}
