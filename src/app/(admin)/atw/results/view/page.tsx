/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AtwResult } from "@/libs/types/atwResult";
import { Icon } from "@iconify/react";
import { atwResultService } from "@/libs/services/atwResultService";
import { atwApprovalService } from "@/libs/services/atwApprovalService";
import type { AtwResultApprovalAuthority } from "@/libs/types/atwApproval";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Modal } from "@/components/ui/modal";
import { useCan } from "@/context/PagePermissionsContext";

interface GroupedResult {
  course_details: {
    id: number;
    name: string;
    code: string;
  };
  semester_details: {
    semester_info: {
      id: number;
      name: string;
      code: string;
    };
    results: any[];
  }[];
}

export default function AtwViewResultsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const can = useCan("/atw/results");

  const [results, setResults] = useState<AtwResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingResult, setDeletingResult] = useState<AtwResult | null>(null);
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

  const [approvalAuthorities, setApprovalAuthorities] = useState<AtwResultApprovalAuthority[]>([]);
  const [forwardModal, setForwardModal] = useState<{
    open: boolean;
    result: AtwResult | null;
    loading: boolean;
    error: string;
  }>({ open: false, result: null, loading: false, error: "" });

  const isInstructor = !!user?.instructor_biodata;
  const instructorId = isInstructor ? user?.id : undefined;

  // Check if current user can do initial forward (has is_initial_cadet_approve authority)
  const canInitialForward = useMemo(() => {
    const userRoleIds = (user as any)?.roles?.map((r: any) => r.id) ?? [];
    const userId = user?.id;
    return approvalAuthorities.some((a) => {
      if (!a.is_initial_cadet_approve || !a.is_active) return false;
      if (a.user_id && a.user_id === userId) return true;
      if (a.role_id && userRoleIds.includes(a.role_id)) return true;
      return false;
    });
  }, [approvalAuthorities, user]);

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      if (isInstructor) {
        const response = await atwResultService.getAllResults({
          page: currentPage,
          per_page: perPage,
          search: searchTerm || undefined,
          instructor_id: instructorId,
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
      } else {
        const data = await atwResultService.getGroupedResults({
          search: searchTerm || undefined,
        });
        setGroupedResults(data);
      }
    } catch (error) {
      console.error("Failed to load results:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, isInstructor, instructorId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Fetch authorities once on mount (global config, not per-result)
  useEffect(() => {
    atwApprovalService.getAuthorities({ allData: true, is_active: true })
      .then((res) => setApprovalAuthorities(res.data))
      .catch(() => { });
  }, []);

  // Group results for Admin View (Non-instructor) - Semester wise
  const flattenedAdminResults = useMemo(() => {
    if (isInstructor) return [];
    const flat: any[] = [];
    groupedResults.forEach(courseGroup => {
      courseGroup.semester_details.forEach(semesterGroup => {
        // Group all results for this semester into one row
        const firstResult = semesterGroup.results[0];
        flat.push({
          ...firstResult,
          id: `${courseGroup.course_details.id}-${semesterGroup.semester_info.id}`,
          course_id: courseGroup.course_details.id,
          semester_id: semesterGroup.semester_info.id,
          course_name: courseGroup.course_details.name,
          course_code: courseGroup.course_details.code,
          semester_name: semesterGroup.semester_info.name,
          all_results: semesterGroup.results,
          total_cadets: Math.max(...semesterGroup.results.map((r: any) => r.total_cadets || 0), 0)
        });
      });
    });
    return flat;
  }, [groupedResults, isInstructor]);

  const handleAddResult = () => router.push("/atw/results/create");
  const handleEditResult = (result: AtwResult) => router.push(`/atw/results/${result.id}/edit`);
  const handleViewResult = (resultId: number) => router.push(`/atw/results/${resultId}`);
  const handleViewSemesterResults = (courseId: number, semesterId: number) => {
    router.push(`/atw/results/course/${courseId}/semester/${semesterId}`);
  };
  const handleDeleteResult = (result: AtwResult) => {
    setDeletingResult(result);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingResult) return;
    try {
      setDeleteLoading(true);
      await atwResultService.deleteResult(deletingResult.id);
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

  const handleForwardResult = (result: AtwResult) => {
    setForwardModal({ open: true, result, loading: false, error: "" });
  };

  const handleConfirmForward = async () => {
    const result = forwardModal.result;
    if (!result) return;
    setForwardModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      // Forward to only the NEXT authority in the sort chain, not all non-initial authorities
      const nextAuthority = [...approvalAuthorities]
        .filter((a) => !a.is_initial_cadet_approve && a.is_active)
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))[0];

      await atwApprovalService.approveSubject({
        course_id: result.course_id,
        semester_id: result.semester_id,
        program_id: result.program_id,
        branch_id: result.branch_id,
        subject_id: result.atw_subject_id,
        instructor_id: result.instructor_id,
        status: "pending",
        cadet_ids: result.result_getting_cadets?.map((c) => c.cadet_id) ?? [],
        authority_ids: nextAuthority ? [nextAuthority.id] : [],
      });
      setForwardModal({ open: false, result: null, loading: false, error: "" });
      await loadResults();
    } catch (err: any) {
      const msg = err?.errors
        ? Object.values(err.errors).flat().join(" ")
        : err?.message || "Failed to forward result.";
      setForwardModal((prev) => ({ ...prev, loading: false, error: msg }));
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

  const RenderChips = ({ items, max = 2, color = "gray" }: { items: string[], max?: number, color?: string }) => {
    if (!items || items.length === 0) return <span className="text-gray-400">N/A</span>;

    const colorClasses: Record<string, string> = {
      gray: "bg-gray-50 text-gray-600 border-gray-200",
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      purple: "bg-purple-50 text-purple-600 border-purple-100",
      green: "bg-green-50 text-green-600 border-green-100",
      orange: "bg-orange-50 text-orange-600 border-orange-100",
      indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };

    const selectedColor = colorClasses[color] || colorClasses.gray;
    const displayed = items.slice(0, max);
    const remaining = items.length - max;

    return (
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {displayed.map((item, i) => (
          <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${selectedColor} whitespace-nowrap `}>
            {item}
          </span>
        ))}
        {remaining > 0 && (
          <span className="px-2 py-0.5 bg-white text-gray-500 rounded-full text-[10px] font-bold border border-dashed border-gray-300" title={items.slice(max).join(', ')}>
            +{remaining} more
          </span>
        )}
      </div>
    );
  };

  const instructorColumns: Column<AtwResult>[] = [
    {
      key: "id",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900",
      render: (_, index) => (pagination.from || 0) + (index)
    },
    {
      key: "course",
      header: "Course",
      render: (result) => (
        <div>
          <div className="font-medium text-gray-900">{result.course?.name || "N/A"}</div>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (result) => {
        const subjectModule = result.subject?.module || result.subject || result.atw_subject_module;
        return (
          <div className="font-medium text-gray-900">{subjectModule?.subject_name || "N/A"} ({subjectModule?.subject_code || ""})</div>
        );
      },
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
      render: (result) => result.program?.name || "N/A",
    },
    {
      key: "branch",
      header: "Branch",
      className: "text-gray-700",
      render: (result) => result.branch?.name || "N/A",
    },
    {
      key: "total_entry",
      header: "No of Cadets",
      headerAlign: "center",
      className: "text-center",
      render: (result) => {
        const entry = result.result_getting_cadets?.length ?? 0;
        const total = result.total_cadets ?? 0;
        const allEntered = total > 0 && entry >= total;
        return (
          <p>
            {entry}
          </p>
        );
      },
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700 text-sm",
      render: (result) => result.created_at ? new Date(result.created_at).toLocaleDateString("en-GB") : "—"
    },
    {
      key: "approval_stats",
      header: "Approval",
      headerAlign: "center",
      className: "text-center",
      render: (result) => {
        const stats = result.approval_stats;
        const sa = (result as any).subject_approval;
        // Subject approved by final authority → forwarded to program level
        if (sa?.approved_by) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 whitespace-nowrap">
              ↑ Forwarded
            </span>
          );
        }
        // Forwarded to authority but pending their review (not yet approved)
        if (sa?.forwarded_by) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 whitespace-nowrap">
              ⏳ Under Review
            </span>
          );
        }
        if (!stats || stats.total === 0) return <span className="text-gray-400 text-xs">—</span>;
        if (stats.approved === stats.total) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 whitespace-nowrap">
              ✓ All Cadets Approved
            </span>
          );
        }
        if (stats.approved === 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 whitespace-nowrap">
              ✗ Not Approved
            </span>
          );
        }
        const remaining = stats.total - stats.approved;
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 whitespace-nowrap">
            {stats.approved}/{stats.total} Approved
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (result) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          {can('view') && (
            <button onClick={() => handleViewResult(result.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
          )}
          {can('edit') && (
            <button onClick={() => handleEditResult(result)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          )}
          {can('delete') && (
            <button onClick={() => handleDeleteResult(result)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
          )}
          {canInitialForward && (() => {
            const sa = result.subject_approval;
            const stats = result.approval_stats;
            // Use per-result forwarding flag so other instructors' forward action
            // doesn't hide the button for this instructor
            const isMyResultForwarded = !!(stats as any)?.is_result_forwarded;
            if (isMyResultForwarded) return null;
            const allCadetsApproved = (stats?.approved ?? 0) > 0 && (stats?.approved ?? 0) >= (stats?.total ?? 0);
            const canForward = (!sa?.approved_by) && allCadetsApproved;
            return (
              <button
                onClick={() => handleForwardResult(result)}
                disabled={!canForward}
                title={canForward ? "Forward to Higher Authority" : "All cadets must be approved before forwarding"}
                className={`p-1 rounded ${canForward ? "text-indigo-600 hover:bg-indigo-50" : "text-gray-300 cursor-not-allowed"}`}
              >
                <Icon icon="hugeicons:share-04" className="w-4 h-4" />
              </button>
            );
          })()}
        </div>
      ),
    },
  ];

  const adminColumns: Column<any>[] = [
    {
      key: "id",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900",
      render: (_, index) => index + 1
    },
    {
      key: "course",
      header: "Course",
      render: (res) => (
        <div>
          <div className="font-medium text-gray-900">{res.course_name}</div>
          <div className="text-xs text-gray-500">{res.course_code}</div>
        </div>
      )
    },
    {
      key: "semester",
      header: "Semester",
      className: "font-medium text-gray-700",
      render: (res) => res.semester_name
    },
    {
      key: "program",
      header: "Program",
      render: (res) => {
        const items = Array.from(new Set(res.all_results?.map((r: any) => r.program?.name).filter(Boolean))) as string[];
        return <RenderChips items={items} color="purple" />;
      }
    },
    {
      key: "branch",
      header: "Branch",
      render: (res) => {
        const items = Array.from(new Set(res.all_results?.map((r: any) => r.branch?.name).filter(Boolean))) as string[];
        return <RenderChips items={items} color="blue" />;
      }
    },
    {
      key: "subject",
      header: "Subjects",
      render: (res) => {
        const items = res.all_results?.map((r: any) => (
          r.subject?.module?.subject_name ||
          r.subject?.subject_name ||
          r.atw_subject_module?.subject_name
        )).filter(Boolean) as string[];
        return <RenderChips items={items} color="indigo" max={3} />;
      },
    },
    {
      key: "instructor",
      header: "Instructors",
      render: (res) => {
        const items = Array.from(new Set(res.all_results?.map((r: any) => r.instructor?.name).filter(Boolean))) as string[];
        return <RenderChips items={items} color="green" />;
      }
    },
    {
      key: "total_cadets",
      header: "Cadets",
      headerAlign: "center",
      className: "text-center",
      render: (res) => <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{res.total_cadets || 0}</span>
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (res) => (
        <div className="flex items-center justify-center gap-1">
          {can('view') && (
            <button
              onClick={() => handleViewSemesterResults(res.course_id, res.semester_id)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="View Details"
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
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">ATW Results Management</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search results..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
        </div>
        <div className="flex items-center gap-3">
          {isInstructor && can('add') && (
            <button onClick={handleAddResult} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
              <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
              Add Result
            </button>
          )}
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {loading ? (
        <TableLoading />
      ) : isInstructor ? (
        <>
          <DataTable
            columns={instructorColumns}
            data={results}
            keyExtractor={(result) => result.id.toString()}
            emptyMessage="No results found"
            onRowClick={can('view') ? (res) => handleViewResult(res.id) : undefined}
          />
          <div className="flex items-center justify-between mt-4">
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
        </>
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={adminColumns}
            data={flattenedAdminResults}
            keyExtractor={(res) => res.id.toString()}
            emptyMessage="No results found"
            onRowClick={can('view') ? (res) => handleViewSemesterResults(res.course_id, res.semester_id) : undefined}
          />
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Result"
        message={`Are you sure you want to delete this ATW result for "${deletingResult?.subject?.module?.subject_name || deletingResult?.subject?.subject_name || deletingResult?.atw_subject_module?.subject_name || 'this subject'}"? This will also delete all associated cadets and marks. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />

      {/* Initial Subject Forward Modal */}
      <Modal
        isOpen={forwardModal.open}
        onClose={() => setForwardModal((prev) => ({ ...prev, open: false }))}
        showCloseButton
        className="max-w-lg"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
              <Icon icon="hugeicons:share-04" className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Forward to Higher Authority</h2>
              <p className="text-xs text-gray-500">Initial subject result forwarding</p>
            </div>
          </div>

          {forwardModal.result && (() => {
            const r = forwardModal.result!;
            const subjectModule = r.subject?.module || r.subject || r.atw_subject_module;
            const rows: [string, string][] = [
              ["Course", r.course?.name || "—"],
              ["Semester", r.semester?.name || "—"],
              ["Program", r.program?.name || "—"],
              ["Branch", r.branch?.name || "—"],
              ["Subject", subjectModule?.subject_name ? `${subjectModule.subject_name} (${subjectModule.subject_code})` : "—"],
              ["Exam Type", r.exam_type?.name || "—"],
            ];
            return (
              <div className="mb-5 rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
                {rows.map(([label, value]) => (
                  <div key={label} className="flex px-4 py-2.5">
                    <span className="w-28 text-gray-500 shrink-0">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          <p className="text-sm text-gray-600 mb-5">
            This will mark the subject result as forwarded to the higher authority for further review and approval. This action records your approval at the subject level.
          </p>

          {forwardModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {forwardModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            <button
              onClick={() => setForwardModal((prev) => ({ ...prev, open: false }))}
              disabled={forwardModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmForward}
              disabled={forwardModal.loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
            >
              {forwardModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              <Icon icon="hugeicons:share-04" className="w-4 h-4" />
              Confirm Forward
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
