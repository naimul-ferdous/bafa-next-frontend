/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CadetWarning } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { atwCadetWarningService } from "@/libs/services/atwCadetWarningService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

export default function AtwCadetWarningsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isInstructor = !!user?.instructor_biodata;

  const [warnings, setWarnings] = useState<CadetWarning[]>([]);
  const [loading, setLoading] = useState(true);

  const [officialResults, setOfficialResults] = useState<any[]>([]);
  const [officialLoading, setOfficialLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingWarning, setDeletingWarning] = useState<CadetWarning | null>(null);
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

  const loadWarnings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await atwCadetWarningService.getAll({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });
      setWarnings(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load warnings:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  const loadOfficialResults = useCallback(async () => {
    try {
      setOfficialLoading(true);
      const data = await atwCadetWarningService.getGroupedResults({
        search: searchTerm || undefined
      });
      setOfficialResults(data);
    } catch (error) {
      console.error("Failed to load official results:", error);
    } finally {
      setOfficialLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (isInstructor) {
      loadWarnings();
    } else {
      loadOfficialResults();
    }
  }, [loadWarnings, loadOfficialResults, isInstructor]);

  const handleAddWarning = () => router.push("/atw/assessments/warnings/create");
  const handleEditWarning = (warning: CadetWarning) => router.push(`/atw/assessments/warnings/${warning.id}/edit`);
  const handleViewWarning = (warning: CadetWarning) => router.push(`/atw/assessments/warnings/${warning.id}`);
  const handleDeleteWarning = (warning: CadetWarning) => {
    setDeletingWarning(warning);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingWarning) return;
    try {
      setDeleteLoading(true);
      await atwCadetWarningService.delete(deletingWarning.id);
      await loadWarnings();
      setDeleteModalOpen(false);
      setDeletingWarning(null);
    } catch (error) {
      console.error("Failed to delete warning:", error);
      alert("Failed to delete warning");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = () => console.log("Export warnings");
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

  const columns: Column<CadetWarning>[] = [
    { key: "id", header: "SL.", headerAlign: "center", className: "text-center text-gray-900", render: (warning, index) => (pagination.from || 0) + (index + 1) },
    {
      key: "course",
      header: "Course",
      render: (warning) => (
        <div>
          <div className="font-medium text-gray-900">{warning.course?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">{warning.course?.code || ""}</div>
        </div>
      ),
    },
    {
      key: "semester",
      header: "Semester",
      render: (warning) => (
        <div>
          <div className="font-medium text-gray-900">{warning.semester?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">{warning.semester?.code || ""}</div>
        </div>
      ),
    },
    {
      key: "cadet",
      header: "Cadet Information",
      className: "text-gray-900",
      render: (warning) => (
        <div className="flex flex-col">
          <span className="font-bold">{warning.cadet?.name || "—"}</span>
          <span className="text-[10px] text-blue-600 font-mono font-bold uppercase">{warning.cadet?.bd_no || (warning.cadet as any)?.bdno || warning.cadet?.cadet_number || "—"}</span>
        </div>
      )
    },
    {
      key: "warning",
      header: "Warning Type",
      className: "text-gray-900",
      render: (warning) => (
        <div className="flex flex-col">
          <span className="font-medium text-red-600 uppercase text-xs">{warning.warning?.name || "—"}</span>
          <span className="text-[10px] text-gray-400 font-bold">Deduction: -{Number(warning.warning?.reduced_mark || 0).toFixed(1)}</span>
        </div>
      )
    },
    {
      key: "is_active",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (warning) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase rounded-full ${warning.is_active ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
          {warning.is_active ? "Active" : "Resolved"}
        </span>
      )
    },
    {
      key: "created_at",
      header: "Date",
      headerAlign: "center",
      className: "text-center text-gray-900 font-medium",
      render: (warning) => warning.created_at ? new Date(warning.created_at).toLocaleDateString("en-GB") : "—"
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (warning) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleViewWarning(warning)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all" title="View Details"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
          <button onClick={() => handleEditWarning(warning)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-all" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          <button onClick={() => handleDeleteWarning(warning)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-all" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const officialColumns: Column<any>[] = [
    { key: "id", header: "SL.", headerAlign: "center", className: "text-center text-gray-900", render: (_, index) => index + 1 },
    {
      key: "course",
      header: "Course",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.course_details?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">{row.course_details?.code || ""}</div>
        </div>
      ),
    },
    {
      key: "semester",
      header: "Semester",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.semester_details?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">{row.semester_details?.code || ""}</div>
        </div>
      ),
    },
    {
      key: "cadets",
      header: "Total Warnings",
      className: "text-gray-700 text-center font-bold text-red-600",
      render: (row) => row.results_count || row.count || 0,
    },
    {
      key: "created_at",
      header: "Last Warning Date",
      className: "text-gray-700 text-sm",
      render: (row) => row.last_created_at ? new Date(row.last_created_at).toLocaleDateString("en-GB") : "—",
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (row) => (
        <div className="flex flex-col items-center gap-1">
            <button onClick={() => router.push(`/atw/assessments/warnings/course/${row.course_details?.id}/semester/${row.semester_details?.id}`)} className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase transition-all" title="View Details">
              <Icon icon="hugeicons:view" className="w-3.5 h-3.5" /> View Detailed
            </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase tracking-widest">ATW Cadet Warnings Management</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder={isInstructor ? "Search by cadet name, BD No, warning..." : "Search by course or semester..."} value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>
        <div className="flex items-center gap-3">
          {/* {isInstructor && ( */}
            <button onClick={handleAddWarning} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Warning</button>
          {/* )} */}
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700 transition-all shadow-md active:scale-95"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {isInstructor ? (
        loading ? (
          <TableLoading />
        ) : (
          <>
            <DataTable columns={columns} data={warnings} keyExtractor={(warning) => warning.id.toString()} emptyMessage="No cadet warnings found" onRowClick={handleViewWarning} />
            
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700 font-medium">Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results</div>
                <select value={perPage} onChange={(e) => handlePerPageChange(Number(e.target.value))} className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"><Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />Prev</button>
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`px-4 py-2 text-sm rounded-lg font-bold transition-all ${currentPage === page ? "bg-blue-600 text-white shadow-md" : "border border-gray-300 hover:bg-gray-50"}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))} disabled={currentPage === pagination.last_page} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold">Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" /></button>
              </div>
            </div>
          </>
        )
      ) : (
        officialLoading ? <TableLoading /> : <DataTable columns={officialColumns} data={officialResults} keyExtractor={(_, index) => index.toString()} emptyMessage="No results found" />
      )}

      <ConfirmationModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Delete Warning" message={`Are you sure you want to delete this warning for "${deletingWarning?.cadet?.name}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" loading={deleteLoading} variant="danger" />
    </div>
  );
}
