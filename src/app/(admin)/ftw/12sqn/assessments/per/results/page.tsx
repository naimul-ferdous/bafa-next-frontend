/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnAssessmentPenpictureResultService } from "@/libs/services/ftw12sqnAssessmentPenpictureResultService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { useCan } from "@/context/PagePermissionsContext";

export default function Ftw12SqnViewAssessmentPenpictureResultsPage() {
  const router = useRouter();
  const { user, userIsInstructor } = useAuth();
  const can = useCan("/ftw12sqn/assessments/penpicture/results");

  const isInstructor = userIsInstructor;

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      const response = await ftw12sqnAssessmentPenpictureResultService.getGroupedResults({
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

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleAddResult = () => router.push("/ftw12sqn/assessments/penpicture/results/create");
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

  const columns: Column<any>[] = [
    { key: "sl", header: "SL.", headerAlign: "center", className: "text-center text-gray-900", render: (_, index) => index + 1 },
    {
      key: "course",
      header: "Course Name",
      render: (row) => (
        <div className="font-medium text-gray-900">{row.course_details?.name || "N/A"}</div>
      ),
    },
    {
      key: "semester",
      header: "Semester",
      render: (row) => (
        <div className="font-medium text-gray-900">{row.semester_details?.name || "N/A"}</div>
      ),
    },
    {
      key: "total_entry",
      header: "Total Entry",
      headerAlign: "center",
      className: "text-center",
      render: (row) => {
        const entry = row.total_entry ?? 0;
        const total = row.total_cadets ?? 0;
        return (
          <p>{entry}/{total}</p>
        );
      },
    },
    {
      key: "total_cadets",
      header: "Total Cadets",
      headerAlign: "center",
      className: "text-center font-bold text-green-600",
      render: (row) => `${row.total_entry || 0}/${row.total_cadets || 0}`,
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (row) => (
        <div className="flex flex-col items-center gap-1">
          {can("view") && (
            <button
              onClick={() => router.push(`/ftw12sqn/assessments/penpicture/results/course/${row.course_id}/semester/${row.semester_id}`)}
              className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase transition-all"
              title="View Results"
            >
              <Icon icon="hugeicons:view" className="w-3.5 h-3.5" /> View Results
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase tracking-widest">ATW PER Results</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by course or semester..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>
        <div className="flex items-center gap-3">
          {can("add") && (
            <button onClick={handleAddResult} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95">
              <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Result
            </button>
          )}
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700 transition-all shadow-md active:scale-95">
            <Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export
          </button>
        </div>
      </div>

      {loading ? (
        <TableLoading />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={results}
            keyExtractor={(_, index) => index.toString()}
            emptyMessage="No results found"
            onRowClick={can("view") ? (row) => router.push(`/ftw12sqn/assessments/penpicture/results/course/${row.course_id}/semester/${row.semester_id}`) : undefined}
          />

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700 font-medium">
                Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results
              </div>
              <select value={perPage} onChange={(e) => handlePerPageChange(Number(e.target.value))} className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold">
                <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />Prev
              </button>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`px-4 py-2 text-sm rounded-lg font-bold transition-all ${currentPage === page ? "bg-blue-600 text-white shadow-md" : "border border-gray-300 hover:bg-gray-50"}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))} disabled={currentPage === pagination.last_page} className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold">
                Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
