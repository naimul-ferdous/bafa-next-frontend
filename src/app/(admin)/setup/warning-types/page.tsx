"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SystemWarningType } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { warningTypeService } from "@/libs/services/warningTypeService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { WarningTypeModalProvider, useWarningTypeModal } from "@/context/WarningTypeModalContext";
import WarningTypeFormModal from "@/components/warning-types/WarningTypeFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

function WarningTypesPageContent() {
  const { openModal } = useWarningTypeModal();
  const [warningTypes, setWarningTypes] = useState<SystemWarningType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Status toggle modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusWarningType, setStatusWarningType] = useState<SystemWarningType | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });

  const loadWarningTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await warningTypeService.getAllWarningTypes({ page: currentPage, per_page: perPage, search: searchTerm || undefined });
      setWarningTypes(response.data);
      setPagination({ current_page: response.current_page, last_page: response.last_page, per_page: response.per_page, total: response.total, from: response.from, to: response.to });
    } catch (error) {
      console.error("Failed to load warning types:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => { loadWarningTypes(); }, [loadWarningTypes]);
  useEffect(() => {
    const handleWarningTypeUpdate = () => loadWarningTypes();
    window.addEventListener('warningTypeUpdated', handleWarningTypeUpdate);
    return () => window.removeEventListener('warningTypeUpdated', handleWarningTypeUpdate);
  }, [loadWarningTypes]);

  const handleAddWarningType = () => openModal();
  const handleEditWarningType = (warningType: SystemWarningType) => openModal(warningType);
  const handleViewWarningType = (warningType: SystemWarningType) => openModal(warningType);

  const handleToggleStatus = (warningType: SystemWarningType) => {
    setStatusWarningType(warningType);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusWarningType) return;

    try {
      setStatusLoading(true);
      await warningTypeService.updateWarningType(statusWarningType.id, {
        name: statusWarningType.name,
        code: statusWarningType.code,
        reduced_mark: statusWarningType.reduced_mark,
        is_active: !statusWarningType.is_active
      });
      await loadWarningTypes();
      setStatusModalOpen(false);
      setStatusWarningType(null);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExport = () => console.log("Export warning types");
  const handleSearchChange = (value: string) => { setSearchTerm(value); setCurrentPage(1); };
  const handlePerPageChange = (value: number) => { setPerPage(value); setCurrentPage(1); };

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  const getReducedMarkColor = (mark: number) => {
    if (mark <= 0) return "bg-gray-100 text-gray-800";
    if (mark <= 5) return "bg-blue-100 text-blue-800";
    if (mark <= 10) return "bg-yellow-100 text-yellow-800";
    if (mark <= 20) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const columns: Column<SystemWarningType>[] = [
    { key: "id", header: "SL.", headerAlign: "center", className: "text-center text-gray-900", render: (warningType, index) => (pagination.from || 0) + (index + 1) },
    { key: "name", header: "Warning Type Name", className: "font-medium text-gray-900" },
    { key: "code", header: "Code", className: "text-gray-700 font-mono text-sm" },
    { key: "form_number", header: "Form No.", className: "text-gray-700 whitespace-nowrap", render: (warningType) => warningType.form_number || "—" },
    { key: "reduced_mark", header: "Reduced Mark", headerAlign: "center", className: "text-center", render: (warningType) => (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${getReducedMarkColor(Number(warningType.reduced_mark))}`}>
        -{Number(warningType.reduced_mark).toFixed(1)}
      </span>
    )},
    { key: "category", header: "Category", className: "text-gray-700", render: (warningType) => warningType.category || "—" },
    { key: "description", header: "Description", className: "text-gray-700", render: (warningType) => (
      <span className="line-clamp-2">{warningType.description || "—"}</span>
    )},
    { key: "is_active", header: "Status", headerAlign: "center", className: "text-center", render: (warningType) => (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${warningType.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
        {warningType.is_active ? "Active" : "Inactive"}
      </span>
    )},
    { key: "actions", header: "Actions", headerAlign: "center", className: "text-center no-print", render: (warningType) => (
      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => handleEditWarningType(warningType)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
        {warningType.is_active ? (
          <button
            onClick={() => handleToggleStatus(warningType)}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Deactivate"
          >
            <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => handleToggleStatus(warningType)}
            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Activate"
          >
            <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 shadow-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">All Warning Types List</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by name, code, category..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAddWarningType} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Warning Type</button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-gray-700 flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 transition-all"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {loading ? <TableLoading /> : <DataTable columns={columns} data={warningTypes} keyExtractor={(warningType) => warningType.id.toString()} emptyMessage="No warning types found" onRowClick={handleViewWarningType} />}

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

      <WarningTypeFormModal />
      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusWarningType?.is_active ? "Deactivate Warning Type" : "Activate Warning Type"}
        message={`Are you sure you want to ${statusWarningType?.is_active ? "deactivate" : "activate"} the warning type "${statusWarningType?.name}"?`}
        confirmText={statusWarningType?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusWarningType?.is_active ? "danger" : "success"}
      />
    </div>
  );
}

export default function WarningTypesPage() {
  return (
    <WarningTypeModalProvider>
      <WarningTypesPageContent />
    </WarningTypeModalProvider>
  );
}
