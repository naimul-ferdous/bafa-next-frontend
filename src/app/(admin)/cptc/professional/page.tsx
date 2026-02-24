"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CptcProfessionalResult } from "@/libs/types/cptcProfessionalResult";
import { Icon } from "@iconify/react";
import { cptcProfessionalResultService } from "@/libs/services/cptcProfessionalResultService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

export default function CptcProfessionalPage() {
  const router = useRouter();
  const [results, setResults] = useState<CptcProfessionalResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingResult, setDeletingResult] = useState<CptcProfessionalResult | null>(null);
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

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cptcProfessionalResultService.getAllResults({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });
      setResults(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load results:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleAddResult = () => router.push("/cptc/professional/create");
  const handleEditResult = (result: CptcProfessionalResult) => router.push(`/cptc/professional/${result.id}/edit`);
  const handleViewResult = (result: CptcProfessionalResult) => router.push(`/cptc/professional/${result.id}`);
  const handleDeleteResult = (result: CptcProfessionalResult) => {
    setDeletingResult(result);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingResult) return;
    try {
      setDeleteLoading(true);
      await cptcProfessionalResultService.deleteResult(deletingResult.id);
      await loadResults();
      setDeleteModalOpen(false);
      setDeletingResult(null);
    } catch (error) {
      console.error("Failed to delete result:", error);
      alert("Failed to delete result");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = () => console.log("Export results");
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

  const columns: Column<CptcProfessionalResult>[] = [
    {
      key: "id",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900",
      render: (result, index) => (pagination.from || 0) + (index)
    },
    {
      key: "course",
      header: "Course",
      render: (result) => (
        <div>
          <div className="font-medium text-gray-900">{result.course?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">{result.course?.code || ""}</div>
        </div>
      ),
    },
    {
      key: "semester",
      header: "Semester",
      className: "text-gray-700",
      render: (result) => result.semester?.name || "N/A",
    },
    {
      key: "program",
      header: "Program",
      className: "text-gray-700",
      render: (result) => result.program?.name || "—",
    },
    {
      key: "branch",
      header: "Branch",
      className: "text-gray-700",
      render: (result) => result.branch?.name || "—",
    },
    {
      key: "group",
      header: "Group",
      className: "text-gray-700",
      render: (result) => result.group?.name || "—",
    },
    {
      key: "cadets",
      header: "Cadets",
      headerAlign: "center",
      className: "text-center",
      render: (result) => (
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {result.cadet_marks?.length || 0}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700 text-sm",
      render: (result) => result.created_at ? new Date(result.created_at).toLocaleDateString("en-GB") : "—"
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (result) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => handleViewResult(result)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
          <button onClick={() => handleEditResult(result)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          <button onClick={() => handleDeleteResult(result)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">CPTC Professional Results Management</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by course, semester, branch..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAddResult} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Result</button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {loading ? <TableLoading /> : <DataTable columns={columns} data={results} keyExtractor={(result) => result.id.toString()} emptyMessage="No results found" />}

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
          {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
            let page;
            if (pagination.last_page <= 5) {
              page = i + 1;
            } else if (currentPage <= 3) {
              page = i + 1;
            } else if (currentPage >= pagination.last_page - 2) {
              page = pagination.last_page - 4 + i;
            } else {
              page = currentPage - 2 + i;
            }
            return (
              <button key={page} onClick={() => setCurrentPage(page)} className={`px-4 py-2 text-sm rounded-lg ${currentPage === page ? "bg-blue-600 text-white" : "border border-black hover:bg-gray-50"}`}>{page}</button>
            );
          })}
          <button onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))} disabled={currentPage === pagination.last_page} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" /></button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Professional Result"
        message={`Are you sure you want to delete this professional result for "${deletingResult?.course?.name} - ${deletingResult?.semester?.name}"? This will also delete all associated cadet marks. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
