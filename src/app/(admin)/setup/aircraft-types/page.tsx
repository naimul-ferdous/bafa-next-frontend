"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AircraftType } from "@/libs/types/aircraft";
import { Icon } from "@iconify/react";
import { aircraftService } from "@/libs/services/aircraftService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { AircraftTypeModalProvider, useAircraftTypeModal } from "@/context/AircraftTypeModalContext";
import AircraftTypeFormModal from "@/components/aircraft-types/AircraftTypeFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

function AircraftTypesPageContent() {
  const { openModal } = useAircraftTypeModal();
  const [types, setTypes] = useState<AircraftType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<AircraftType | null>(null);
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

  const loadTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await aircraftService.getAllAircraftTypes({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });
      setTypes(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load aircraft types:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    const handleUpdate = () => loadTypes();
    window.addEventListener('aircraftTypeUpdated', handleUpdate);
    return () => window.removeEventListener('aircraftTypeUpdated', handleUpdate);
  }, [loadTypes]);

  const handleAdd = () => openModal();
  const handleEdit = (type: AircraftType) => openModal(type);
  const handleDelete = (type: AircraftType) => {
    setDeletingType(type);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingType) return;
    try {
      setDeleteLoading(true);
      await aircraftService.deleteAircraftType(deletingType.id);
      await loadTypes();
      setDeleteModalOpen(false);
      setDeletingType(null);
    } catch (error: any) {
      console.error("Failed to delete aircraft type:", error);
      alert(error.message || "Failed to delete aircraft type");
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
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  const columns: Column<AircraftType>[] = [
    { key: "id", header: "SL.", headerAlign: "center", className: "text-center text-gray-900", render: (type, index) => (pagination.from || 0) + (index + 1) },
    { key: "title", header: "Type Title", className: "font-medium text-gray-900" },
    {
      key: "status",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (type) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${type.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {type.status === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
    { key: "created_by", header: "Created By", className: "text-gray-700" },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700",
      render: (type) => type.created_at ? new Date(type.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—",
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (type) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => handleEdit(type)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(type)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Aircraft Types Master Setup</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by type title..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAdd} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Aircraft Type</button>
        </div>
      </div>

      {loading ? <TableLoading /> : <DataTable columns={columns} data={types} keyExtractor={(type) => type.id.toString()} emptyMessage="No aircraft types found" />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results</div>
          <select value={perPage} onChange={(e) => handlePerPageChange(Number(e.target.value))} className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900">
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />Prev</button>
          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => setCurrentPage(page)} className={`px-4 py-2 text-sm rounded-lg ${currentPage === page ? "bg-blue-600 text-white" : "border border-black hover:bg-gray-50"}`}>{page}</button>
          ))}
          <button onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))} disabled={currentPage === pagination.last_page} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" /></button>
        </div>
      </div>

      <AircraftTypeFormModal />
      <ConfirmationModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Delete Aircraft Type" message={`Are you sure you want to delete "${deletingType?.title}"? This action cannot be undone and will fail if there are aircrafts assigned to this type.`} confirmText="Delete" cancelText="Cancel" loading={deleteLoading} variant="danger" />
    </div>
  );
}

export default function AircraftTypesPage() {
  return (
    <AircraftTypeModalProvider>
      <AircraftTypesPageContent />
    </AircraftTypeModalProvider>
  );
}
