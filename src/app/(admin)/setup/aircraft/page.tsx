"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Aircraft } from "@/libs/types/aircraft";
import { Icon } from "@iconify/react";
import { aircraftService } from "@/libs/services/aircraftService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { AircraftModalProvider, useAircraftModal } from "@/context/AircraftModalContext";
import AircraftFormModal from "@/components/aircraft/AircraftFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

function AircraftPageContent() {
  const { openModal } = useAircraftModal();
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAircraft, setDeletingAircraft] = useState<Aircraft | null>(null);
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

  const loadAircrafts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await aircraftService.getAllAircrafts({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });
      setAircrafts(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load aircrafts:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadAircrafts();
  }, [loadAircrafts]);

  useEffect(() => {
    const handleUpdate = () => loadAircrafts();
    window.addEventListener('aircraftUpdated', handleUpdate);
    return () => window.removeEventListener('aircraftUpdated', handleUpdate);
  }, [loadAircrafts]);

  const handleAdd = () => openModal();
  const handleEdit = (aircraft: Aircraft) => openModal(aircraft);
  const handleDelete = (aircraft: Aircraft) => {
    setDeletingAircraft(aircraft);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAircraft) return;
    try {
      setDeleteLoading(true);
      await aircraftService.deleteAircraft(deletingAircraft.id);
      await loadAircrafts();
      setDeleteModalOpen(false);
      setDeletingAircraft(null);
    } catch (error: any) {
      console.error("Failed to delete aircraft:", error);
      alert(error.message || "Failed to delete aircraft");
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

  const columns: Column<Aircraft>[] = [
    { key: "id", header: "SL.", className: "text-center text-gray-900", render: (a, index) => (pagination.from || 0) + (index + 1) },
    { key: "title", header: "Aircraft Title", className: "font-medium text-gray-900" },
    { key: "type", header: "Type", className: "text-gray-700", render: (a) => a.type?.title || "—" },
    { key: "tail_no", header: "Tail No", className: "text-gray-700" },
    { key: "code", header: "Code", className: "text-gray-700" },
    { key: "series", header: "Series", className: "text-gray-700 capitalize", render: (a) => a.series || "—" },
    { key: "tarmac", header: "Tarmac", className: "text-gray-700 capitalize", render: (a) => a.tarmac || "—" },
    {
      key: "status",
      header: "Status",
      className: "text-center",
      render: (a) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${a.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {a.status === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (a) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => handleEdit(a)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(a)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Aircraft Fleet Master Setup</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by title, tail no, code..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAdd} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Aircraft</button>
        </div>
      </div>

      {loading ? <TableLoading /> : <DataTable columns={columns} data={aircrafts} keyExtractor={(a) => a.id.toString()} emptyMessage="No aircrafts found in the fleet" />}

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

      <AircraftFormModal />
      <ConfirmationModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Delete Aircraft" message={`Are you sure you want to delete "${deletingAircraft?.title}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" loading={deleteLoading} variant="danger" />
    </div>
  );
}

export default function AircraftPage() {
  return (
    <AircraftModalProvider>
      <AircraftPageContent />
    </AircraftModalProvider>
  );
}
