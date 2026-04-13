/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwMedicalDisposalResultService } from "@/libs/services/ctwMedicalDisposalResultService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { useCan } from "@/context/PagePermissionsContext";

export default function CtwMedicalDisposalDisposalPage() {
  const router = useRouter();
  const can = useCan();

  const [results, setResults]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState("");
  const [perPage, setPerPage]         = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination]   = useState({
    current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ctwMedicalDisposalResultService.getGroupedResults({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });
      setResults(res.data);
      setPagination({
        current_page: res.current_page,
        last_page:    res.last_page,
        per_page:     res.per_page,
        total:        res.total,
        from:         res.from,
        to:           res.to,
      });
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<any>[] = [
    {
      key: "sl", header: "SL.", headerAlign: "center", className: "text-center text-gray-900 w-12",
      render: (_, index) => (pagination.from || 0) + index,
    },
    {
      key: "course", header: "Course",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.course_details?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">{row.course_details?.code || ""}</div>
        </div>
      ),
    },
    {
      key: "semester", header: "Semester",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.semester_details?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">{row.semester_details?.code || ""}</div>
        </div>
      ),
    },
    {
      key: "total_entry", header: "Total Entry", headerAlign: "center", className: "text-center font-bold text-blue-600",
      render: (row) => row.total_entry || 0,
    },
    {
      key: "total_cadets", header: "Total Cadets", headerAlign: "center", className: "text-center font-bold text-green-600",
      render: (row) => row.total_cadets || 0,
    },
    {
      key: "actions", header: "Actions", headerAlign: "center", className: "text-center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          {can("view") && (
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/ctw/assessments/medical-disposal/disposal/course/${row.course_id}/semester/${row.semester_id}`); }}
              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
              title="View Results"
            >
              <Icon icon="hugeicons:view" className="w-4 h-4" />
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase tracking-widest">ATW Medical Disposal Results</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text" placeholder="Search by course or semester..." value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        {/* {can("add") && ( */}
          <button
            onClick={() => router.push("/ctw/assessments/medical-disposal/disposal/create")}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95 font-medium"
          >
            <Icon icon="hugeicons:add-circle" className="w-4 h-4" />Add Result
          </button>
        {/* )} */}
      </div>

      {loading ? (
        <div className="w-full min-h-[20vh] flex items-center justify-center">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={results}
            keyExtractor={(_, index) => index.toString()}
            emptyMessage="No results found"
            onRowClick={(row) => router.push(`/ctw/assessments/medical-disposal/disposal/course/${row.course_id}/semester/${row.semester_id}`)}
          />

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700 font-medium">
                Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results
              </div>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />Prev
              </button>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                <button
                  key={page} onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 text-sm rounded-lg font-bold transition-all ${currentPage === page ? "bg-blue-600 text-white shadow-md" : "border border-gray-300 hover:bg-gray-50"}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={currentPage === pagination.last_page}
                className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
