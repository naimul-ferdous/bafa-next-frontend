/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CtwResultsModule } from "@/libs/types/ctw";
import { Icon } from "@iconify/react";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

export default function CtwModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<CtwResultsModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingModule, setDeletingModule] = useState<CtwResultsModule | null>(null);
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

  const loadModules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ctwResultsModuleService.getAllModules({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });

      setModules(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load CTW modules:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const handleAddModule = () => router.push("/ctw/modules/create");
  const handleEditModule = (module: CtwResultsModule) => router.push(`/ctw/modules/${module.id}/edit`);
  const handleViewModule = (module: CtwResultsModule) => router.push(`/ctw/modules/${module.id}`);
  const handleDeleteModule = (module: CtwResultsModule) => {
    setDeletingModule(module);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingModule) return;
    try {
      setDeleteLoading(true);
      await ctwResultsModuleService.deleteModule(deletingModule.id);
      await loadModules();
      setDeleteModalOpen(false);
      setDeletingModule(null);
    } catch (error) {
      console.error("Failed to delete module:", error);
      alert("Failed to delete module");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = () => console.log("Export modules");
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

  const columns: Column<CtwResultsModule>[] = [
    { key: "id", header: "SL.", headerAlign:"center", className: "text-center text-gray-900", render: (_, index) => (pagination.from || 0) + index },
    { key: "full_name", header: "Module Name", className: "font-medium text-gray-900" },
    { key: "short_name", header: "Short Name", className: "text-gray-700" },
    { key: "code", header: "Code", className: "text-gray-700 font-mono text-sm text-center", headerAlign: "center" },
    {
      key: "assessment",
      header: "Assessment",
      headerAlign: "center",
      className: "text-center",
      render: (module) => module.assessment ? (
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full uppercase bg-indigo-100 text-indigo-800">
          {module.assessment}
        </span>
      ) : (
        <span className="text-gray-400 text-xs">—</span>
      ),
    },
    {
        key: "estimated_marks",
        header: "Estimated Marks",
        headerAlign: "center",
        className: "text-center",
        render: (module) => (
            <div className="flex flex-col gap-1 items-center">
                {module.estimated_marks && module.estimated_marks.length > 0 ? (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                        {module.estimated_marks.length} Configured
                    </span>
                ) : (
                    <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                        Not Configured
                    </span>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/ctw/modules/${module.id}`);
                    }}
                    className="text-[10px] text-primary hover:underline font-semibold"
                >
                    Manage Marks
                </button>
            </div>
        )
    },
    {
      key: "is_active",
      header: "Status",
      headerAlign:"center",
      className: "text-center",
      render: (module) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${module.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {module.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (module: CtwResultsModule) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleViewModule(module)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
          <button onClick={() => handleEditModule(module)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          <button onClick={() => handleDeleteModule(module)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">CTW Modules List</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by module name, code..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAddModule} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
            Add Module
          </button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {loading ? <TableLoading /> : <DataTable columns={columns} data={modules} keyExtractor={(module) => module.id.toString()} emptyMessage="No modules found" onRowClick={handleViewModule} />}

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

      <ConfirmationModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Delete Module" message={`Are you sure you want to delete "${deletingModule?.full_name}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" loading={deleteLoading} variant="danger" />
    </div>
  );
}
