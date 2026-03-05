/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Ftw12sqnAssessmentCounselingResult } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { ftw12sqnAssessmentCounselingResultService } from "@/libs/services/ftw12sqnAssessmentCounselingResultService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

export default function Ftw12sqnAssessmentCounselingResultsPage() {
  const router = useRouter();
  const { user, userIsInstructor } = useAuth();
  const isInstructor = userIsInstructor;

  const [results, setResults] = useState<Ftw12sqnAssessmentCounselingResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [officialResults, setOfficialResults] = useState<any[]>([]);
  const [officialLoading, setOfficialLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingResult, setDeletingResult] = useState<Ftw12sqnAssessmentCounselingResult | null>(null);
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
      const response = await ftw12sqnAssessmentCounselingResultService.getAllResults({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
        instructor_id: isInstructor ? user?.id : undefined,
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
  }, [currentPage, perPage, searchTerm, isInstructor, user?.id]);

  const loadOfficialResults = useCallback(async () => {
    try {
      setOfficialLoading(true);
      const data = await ftw12sqnAssessmentCounselingResultService.getGroupedResults({
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
      loadResults();
    } else {
      loadOfficialResults();
    }
  }, [loadResults, loadOfficialResults, isInstructor]);

  const handleAddResult = () => router.push("/ftw/12sqn/assessments/counselings/results/create");
  const handleEditResult = (result: Ftw12sqnAssessmentCounselingResult) => router.push(`/ftw/12sqn/assessments/counselings/results/${result.id}/edit`);
  const handleViewResult = (result: Ftw12sqnAssessmentCounselingResult) => router.push(`/ftw/12sqn/assessments/counselings/results/${result.id}`);
  const handleDeleteResult = (result: Ftw12sqnAssessmentCounselingResult) => {
    setDeletingResult(result);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingResult) return;
    try {
      setDeleteLoading(true);
      await ftw12sqnAssessmentCounselingResultService.deleteResult(deletingResult.id);
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

  const handleExport = () => window.print();
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

  const columns: Column<Ftw12sqnAssessmentCounselingResult>[] = [
    { key: "id", header: "SL.", headerAlign: "center", className: "text-center text-gray-900", render: (result, index) => (pagination.from || 0) + (index + 1) },
    {
      key: "cadet",
      header: "Cadet",
      className: "text-gray-900 font-medium",
      render: (result) => {
        const cadet = result.cadet as any;
        const cadetId = cadet?.cadet_number || cadet?.service_number || cadet?.bd_no || "N/A";
        return (
          <div className="flex flex-col">
            <span>{cadet?.name || "—"}</span>
            <span className="text-xs text-gray-500 font-mono">{cadetId}</span>
          </div>
        );
      }
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
      render: (result) => (
        <div>
          <div className="font-medium text-gray-900">{result.semester?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">{result.semester?.code || ""}</div>
        </div>
      ),
    },
    {
      key: "counseling_type",
      header: "Counseling Type",
      className: "text-gray-900",
      render: (result) => (
        <div className="flex flex-col">
          <span className="font-medium">{result.counseling_type?.type_name || "—"}</span>
        </div>
      )
    },
    {
      key: "instructor",
      header: "Instructor",
      className: "text-gray-700",
      render: (result) => (
        <div>
          <div className="font-medium text-gray-900">{result.instructor?.name || "—"}</div>
        </div>
      )
    },
    {
      key: "created_at",
      header: "Date",
      headerAlign: "center",
      className: "text-center text-gray-900 font-medium",
      render: (result) => result.created_at ? new Date(result.created_at).toLocaleDateString("en-GB") : "—"
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (result) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleViewResult(result)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all" title="View"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
          <button onClick={() => handleEditResult(result)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-all" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          <button onClick={() => handleDeleteResult(result)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-all" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
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
      key: "program",
      header: "Program",
      className: "text-gray-700",
      render: (row) => row.program_details?.name || "N/A",
    },
    {
      key: "cadets",
      header: "Batches",
      className: "text-gray-700 text-center font-bold text-blue-600",
      render: (row) => row.results_count || row.count || 0,
    },
    {
      key: "created_at",
      header: "Last Created",
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
            <button onClick={() => router.push(`/ftw/12sqn/assessments/counselings/results/course/${row.course_details?.id}/semester/${row.semester_details?.id}`)} className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase transition-all" title="View Results">
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase tracking-widest underline decoration-2 underline-offset-4">INTERVIEW/COUNSELLING REPORT (FTW 12SQN)</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by course, semester, instructor..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>
        <div className="flex items-center gap-3">
          {/* {isInstructor && ( */}
            <button onClick={handleAddResult} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Result</button>
          {/* )} */}
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-gray-800 hover:bg-gray-900 transition-all shadow-md active:scale-95"><Icon icon="hugeicons:printer" className="w-4 h-4 mr-2" />Print Report</button>
        </div>
      </div>

      {isInstructor ? (
        loading ? (
          <TableLoading />
        ) : (
          <>
            <DataTable columns={columns} data={results} keyExtractor={(result) => result.id.toString()} emptyMessage="No results found" onRowClick={handleViewResult} />
            
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700 font-medium">Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results</div>
                <select value={perPage} onChange={(e) => handlePerPageChange(Number(e.target.value))} className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"><Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />Prev</button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                    let pageNum = i + 1;
                    if (currentPage > 3 && pagination.last_page > 5) {
                      pageNum = currentPage - 2 + i;
                      if (pageNum > pagination.last_page) pageNum = pagination.last_page - (4 - i);
                    }
                    return (
                      <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-10 h-10 text-sm rounded-lg transition-all font-medium ${currentPage === pageNum ? "bg-blue-600 text-white shadow-md" : "border border-gray-300 hover:bg-gray-50"}`}>{pageNum}</button>
                    );
                  })}
                </div>
                <button onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))} disabled={currentPage === pagination.last_page} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold">Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" /></button>
              </div>
            </div>
          </>
        )
      ) : (
        officialLoading ? <TableLoading /> : <DataTable columns={officialColumns} data={officialResults} keyExtractor={(_, index) => index.toString()} emptyMessage="No results found" />
      )}

      <ConfirmationModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Delete Result" message={`Are you sure you want to delete this counseling result batch? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" loading={deleteLoading} variant="danger" />
    </div>
  );
}
