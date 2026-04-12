/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CtwOneMileResult } from "@/libs/types/ctwOneMile";
import { Icon } from "@iconify/react";
import { ctwOneMileResultService } from "@/libs/services/ctwOneMileResultService";
import { ctwCommonService } from "@/libs/services/ctwCommonService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

const THREE_KM_MODULE_CODE = "3_km";

export default function CtwThreeKmResultsPage() {
  const router = useRouter();
  const { user, userIsInstructor } = useAuth();
  const isInstructor = userIsInstructor;

  const [results, setResults] = useState<CtwOneMileResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [officialResults, setOfficialResults] = useState<any[]>([]);
  const [officialLoading, setOfficialLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingResult, setDeletingResult] = useState<CtwOneMileResult | null>(null);
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

  const [threeKmModuleId, setThreeKmModuleId] = useState<number | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchModuleId = async () => {
      try {
        setModuleLoading(true);
        const options = await ctwCommonService.getThreeKmFormOptions(user?.id || 0);
        if (options?.module) {
          setThreeKmModuleId(options.module.id);
        } else {
          setThreeKmModuleId(null);
          setLoading(false);
        }
      } catch (err) {
        setThreeKmModuleId(null);
        setLoading(false);
      } finally {
        setModuleLoading(false);
      }
    };
    fetchModuleId();
  }, [user?.id]);

  const loadResults = useCallback(async () => {
    if (threeKmModuleId === null || !user?.id) { setLoading(false); return; }

    try {
      setLoading(true);
      const response = await ctwOneMileResultService.getAllResults(threeKmModuleId, {
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
        instructor_id: isInstructor ? user.id : undefined,
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
  }, [currentPage, perPage, searchTerm, threeKmModuleId, isInstructor, user?.id]);

  const loadOfficialResults = useCallback(async () => {
    if (threeKmModuleId === null) return;
    try {
      setOfficialLoading(true);
      const data = await ctwOneMileResultService.getGroupedResults({
        ctw_results_module_id: threeKmModuleId,
        search: searchTerm || undefined,
      });
      const flattened: any[] = [];
      data.forEach(course => {
        if (course.semesters) {
          course.semesters.forEach((semester: any) => {
            if (semester.results) {
              semester.results.forEach((result: any) => {
                flattened.push({
                  ...result,
                  course_details: course.course_details,
                  semester_details: semester.semester_details,
                });
              });
            }
          });
        }
      });
      setOfficialResults(flattened);
    } catch (error) {
      console.error("Failed to load official results:", error);
    } finally {
      setOfficialLoading(false);
    }
  }, [threeKmModuleId, searchTerm]);

  useEffect(() => {
    if (!moduleLoading && threeKmModuleId !== null && user?.id) {
      if (isInstructor) {
        loadResults();
      } else {
        loadOfficialResults();
      }
    }
  }, [loadResults, loadOfficialResults, moduleLoading, threeKmModuleId, user?.id, isInstructor]);

  const handleAddResult = () => router.push("/ctw/results/pf/3km/create");
  const handleEditResult = (result: CtwOneMileResult) => router.push(`/ctw/results/pf/3km/${result.id}/edit`);
  const handleViewResult = (result: CtwOneMileResult | any) => router.push(`/ctw/results/pf/3km/${result.id}`);
  const handleDeleteResult = (result: CtwOneMileResult) => {
    setDeletingResult(result);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingResult) return;
    try {
      setDeleteLoading(true);
      await ctwOneMileResultService.deleteResult(deletingResult.id);
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

  const columns: Column<CtwOneMileResult>[] = [
    { key: "id", header: "SL.", headerAlign: "center", className: "text-center text-gray-900", render: (result, index) => (pagination.from || 0) + (index + 1) },
    {
      key: "course",
      header: "Course",
      className: "font-medium text-gray-900",
      render: (result) => result.course?.name || "N/A",
    },
    {
      key: "semester",
      header: "Semester",
      className: "font-medium text-gray-900",
      render: (result) => result.semester?.name || "N/A",
    },
    {
      key: "program",
      header: "Program",
      className: "text-gray-700",
      render: (result) => result.program?.name || "N/A",
    },
    {
      key: "branch",
      header: "Branch",
      className: "text-gray-700",
      render: (result) => result.branch?.name || "N/A",
    },
    {
      key: "exam_type",
      header: "Exam Type",
      className: "text-gray-700",
      render: (result) => result.exam_type?.name || "N/A",
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700 text-sm",
      render: (result) => result.created_at ? new Date(result.created_at).toLocaleDateString("en-GB") : "—"
    },
    {
      key: "actions" as keyof CtwOneMileResult,
      header: "Actions",
      headerAlign: "center" as const,
      className: "text-center no-print",
      render: (result: CtwOneMileResult) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleViewResult(result)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
          <button onClick={() => handleEditResult(result)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          <button onClick={() => handleDeleteResult(result)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
        </div>
      ),
    }
  ];

  const officialColumns: Column<any>[] = [
    { key: "id", header: "SL.", headerAlign: "center", className: "text-center text-gray-900", render: (_, index) => index + 1 },
    {
      key: "course",
      header: "Course",
      className: "font-medium text-gray-900",
      render: (row) => row.course_details?.name || "N/A",
    },
    {
      key: "semester",
      header: "Semester",
      className: "font-medium text-gray-900",
      render: (row) => row.semester_details?.name || "N/A",
    },
    {
      key: "module",
      header: "Module",
      className: "font-medium text-gray-900",
      render: (row) => row.module?.name || "N/A",
    },
    {
      key: "exam_type",
      header: "Exam Type",
      className: "text-gray-700",
      render: (row) => row.exam_type || "N/A",
    },
    {
      key: "instructor",
      header: "Instructors",
      className: "text-gray-700 text-sm",
      render: (row) => (
        <div className="space-y-1">
          {row.submissions?.map((s: any, i: number) => (
            <div key={i} className="font-medium text-blue-700">{s.instructor_details?.name}</div>
          ))}
        </div>
      ),
    },
    {
      key: "cadets",
      header: "Cadets",
      className: "text-gray-700 text-center",
      render: (row) => (
        <div className="space-y-1">
          {row.submissions?.map((s: any, i: number) => (
            <div key={i}>{s.instructor_details?.marks_count || 0}</div>
          ))}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700 text-sm",
      render: (row) => row.submissions?.[0]?.created_at ? new Date(row.submissions[0].created_at).toLocaleDateString("en-GB") : "—",
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (row) => (
        <div className="flex flex-col items-center gap-1">
          <button onClick={() => router.push(`/ctw/results/pf/3km/course/${row.course_details.id}/semester/${row.semester_details.id}`)} className="p-1 text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1 text-xs" title="View Submission">
            <Icon icon="hugeicons:view" className="w-3 h-3" /> View
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">CTW 3KM Results</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by course, semester, instructor..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
        </div>
        <div className="flex items-center gap-3">
          {isInstructor && (
            <button onClick={handleAddResult} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Result</button>
          )}
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {isInstructor ? (
        (loading) ? <TableLoading /> : (
          <>
            <DataTable columns={columns} data={results} keyExtractor={(result) => result.id.toString()} emptyMessage="No results found" />

            <div className="flex items-center justify-between mt-6">
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
          </>
        )
      ) : (
        officialLoading ? <TableLoading /> : <DataTable columns={officialColumns} data={officialResults} keyExtractor={(row, index) => index} emptyMessage="No grouped results found" />
      )}

      <ConfirmationModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Delete Result" message={`Are you sure you want to delete this result for "${deletingResult?.course?.name} - ${deletingResult?.semester?.name}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" loading={deleteLoading} variant="danger" />
    </div>
  );
}
