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
import { cadetService } from "@/libs/services/cadetService";

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
  const { user, userIsInstructor } = useAuth();
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

  const [cadetCounts, setCadetCounts] = useState<Record<string, number>>({});
  const [loadingCadets, setLoadingCadets] = useState(false);

  const [approvalAuthorities, setApprovalAuthorities] = useState<AtwResultApprovalAuthority[]>([]);
  const [forwardModal, setForwardModal] = useState<{
    open: boolean;
    result: AtwResult | null;
    loading: boolean;
    error: string;
  }>({ open: false, result: null, loading: false, error: "" });
  const [showRoleModal, setShowRoleModal] = useState(false);

  const isInstructor = userIsInstructor;
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

        // Fetch live cadet counts
        setLoadingCadets(true);
        const counts: Record<string, number> = {};
        const uniqueContexts = new Set<string>();
        response.data.forEach((r: any) => {
          if (r.course_id && r.semester_id && r.program_id) {
            uniqueContexts.add(`${r.course_id}-${r.semester_id}-${r.program_id}`);
          }
        });

        const countPromises = Array.from(uniqueContexts).map(async (context) => {
          const [cId, sId, pId] = context.split('-').map(Number);
          try {
            const res = await cadetService.getAllCadets({
              course_id: cId,
              semester_id: sId,
              program_id: pId,
              is_current: 1,
              per_page: 1
            });
            counts[context] = res.total || 0;
          } catch (err) {
            counts[context] = 0;
          }
        });
        await Promise.all(countPromises);
        setCadetCounts(counts);
        setLoadingCadets(false);
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

  // Logic to determine if user can input marks
  const roles = user?.roles || [];
  const primaryRole = roles.find((r: any) => r.pivot?.is_primary) || roles[0] || user?.role;
  const isInstructorActive = primaryRole?.slug === 'instructor';
  
  const assignWings = user?.assign_wings || [];
  const hasPendingInstructorWings = assignWings.some((aw: any) => aw.status === "pending");

  const canInputMarks = isInstructorActive && !hasPendingInstructorWings;

  const handleAddResult = (e: React.MouseEvent) => {
    if (!canInputMarks) {
      e.preventDefault();
      setShowRoleModal(true);
    } else {
      router.push("/atw/results/create");
    }
  };

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

  // ── Instructor grouping logic ──────────────────────────────────────────
  const courseTree = useMemo(() => {
    if (!isInstructor || results.length === 0) return [];

    const cMap: any = {};
    results.forEach(r => {
      const cId = r.course_id || 'unassigned';
      if (!cMap[cId]) cMap[cId] = { course: r.course, sMap: {} };

      const sId = r.semester_id || 'unassigned';
      if (!cMap[cId].sMap[sId]) cMap[cId].sMap[sId] = { semester: r.semester, pMap: {} };

      const pId = r.program_id || 'unassigned';
      if (!cMap[cId].sMap[sId].pMap[pId]) cMap[cId].sMap[sId].pMap[pId] = { program: r.program, results: [] };

      cMap[cId].sMap[sId].pMap[pId].results.push(r);
    });

    return Object.values(cMap).map((c: any) => {
      const semesters = Object.values(c.sMap).map((s: any) => {
        const programs = Object.values(s.pMap).map((p: any) => ({
          program: p.program,
          results: p.results,
          pRowSpan: p.results.length
        }));
        const sRowSpan = programs.reduce((sum, p) => sum + p.pRowSpan, 0);
        return { semester: s.semester, programs, sRowSpan };
      });
      const cRowSpan = semesters.reduce((sum, s) => sum + s.sRowSpan, 0);
      return { course: c.course, semesters, cRowSpan };
    });
  }, [results, isInstructor]);

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
      render: (res) => res.total_cadets || 0
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
          {can('add') && (
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-sm text-left">
              <thead className="uppercase font-bold tracking-wider bg-gray-50">
                <tr>
                  <th className="px-3 py-3 border border-black text-center w-12">SL.</th>
                  <th className="px-4 py-3 border border-black">Course</th>
                  <th className="px-4 py-3 border border-black">Semester</th>
                  <th className="px-4 py-3 border border-black">Program</th>
                  <th className="px-4 py-3 border border-black">Subject</th>
                  <th className="px-4 py-3 border border-black text-center">Cadets Mark Input</th>
                  <th className="px-4 py-3 border border-black text-center">Approval</th>
                  <th className="px-4 py-3 border border-black text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {(() => {
                  let globalIdx = (pagination.from || 1) - 1;
                  if (courseTree.length === 0) {
                    return (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-gray-500 italic">
                          No results found
                        </td>
                      </tr>
                    );
                  }
                  return courseTree.map((cNode: any) =>
                    cNode.semesters.map((sNode: any, sIdx: number) =>
                      sNode.programs.map((pNode: any, pIdx: number) =>
                        pNode.results.map((r: any, rIdx: number) => {
                          globalIdx++;
                          const isFirstInCourse = sIdx === 0 && pIdx === 0 && rIdx === 0;
                          const isFirstInSem = pIdx === 0 && rIdx === 0;
                          const isFirstInProg = rIdx === 0;

                          const subjectModule = r.subject?.module || r.subject || r.atw_subject_module;
                          const stats = r.approval_stats;
                          const sa = (r as any).subject_approval;

                          return (
                            <tr key={r.id} className="hover:bg-blue-50/20 transition-colors cursor-pointer group" onClick={() => can('view') && handleViewResult(r.id)}>
                              <td className="px-3 py-3 border border-black text-center font-medium text-gray-500 group-hover:text-blue-600">
                                {globalIdx}
                              </td>

                              {isFirstInCourse && (
                                <td rowSpan={cNode.cRowSpan} className="px-4 py-3 border border-black text-gray-900 font-bold align-middle bg-white">
                                  {cNode.course?.name || "—"}
                                </td>
                              )}

                              {isFirstInSem && (
                                <td rowSpan={sNode.sRowSpan} className="px-4 py-3 border border-black text-gray-700 font-medium align-middle bg-white">
                                  {sNode.semester?.name || "—"}
                                </td>
                              )}

                              {isFirstInProg && (
                                <td rowSpan={pNode.pRowSpan} className="px-4 py-3 border border-black text-gray-900 font-bold align-middle bg-white">
                                  {pNode.program?.name || "—"}
                                </td>
                              )}

                              <td className="px-4 py-3 border border-black group-hover:text-blue-700">
                                <div className="flex flex-col">
                                  <span className="font-bold">{subjectModule?.subject_name || "N/A"}</span>
                                  <span className="text-xs text-gray-500 font-mono">{subjectModule?.subject_code || ""}</span>
                                </div>
                              </td>

                              <td className="px-4 py-3 border border-black text-center">
                                <span className="font-semibold text-blue-700">
                                  {r.result_getting_cadets?.length ?? 0}/{r.total_cadets ?? 0}
                                </span>
                              </td>

                              <td className="px-4 py-3 border border-black text-center align-middle">
                                {(() => {
                                  if (sa?.approved_by) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">↑ Forwarded</span>;
                                  if (sa?.forwarded_by) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">⏳ Under Review</span>;
                                  if (!stats || stats.total === 0) return "—";
                                  if (stats.approved === stats.total) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">✓ Approved</span>;
                                  if (stats.approved === 0) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">✗ Not Approved</span>;
                                  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800">{stats.approved}/{stats.total} Appr.</span>;
                                })()}
                              </td>

                              <td className="px-4 py-3 border border-black text-center align-middle no-print">
                                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  {can('view') && (
                                    <button onClick={() => handleViewResult(r.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
                                  )}
                                  {can('edit') && (
                                    <button onClick={() => handleEditResult(r)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
                                  )}
                                  {can('delete') && (
                                    <button onClick={() => handleDeleteResult(r)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
                                  )}
                                  {canInitialForward && (() => {
                                    const isMyResultForwarded = !!(stats as any)?.is_result_forwarded;
                                    if (isMyResultForwarded) return null;
                                    const allCadetsApproved = (stats?.approved ?? 0) > 0 && (stats?.approved ?? 0) >= (stats?.total ?? 0);
                                    const canForward = (!sa?.approved_by) && allCadetsApproved;
                                    return (
                                      <button
                                        onClick={() => handleForwardResult(r)}
                                        disabled={!canForward}
                                        title={canForward ? "Forward to Higher Authority" : "All cadets must be approved before forwarding"}
                                        className={`p-1 rounded ${canForward ? "text-indigo-600 hover:bg-indigo-50" : "text-gray-300 cursor-not-allowed"}`}
                                      >
                                        <Icon icon="hugeicons:share-04" className="w-4 h-4" />
                                      </button>
                                    );
                                  })()}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )
                    )
                  );
                })()}
              </tbody>
            </table>
          </div>
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

      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        className="max-w-md mx-4 p-6"
        showCloseButton={true}
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="flex justify-center mb-2"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          
          <div className="mt-2">
            <h2 className="text-md font-semibold text-red-600 uppercase flex items-center justify-center gap-2">
              <Icon icon="hugeicons:alert-square" className="w-5 h-5" />
              Access Denied
            </h2>
            <p className="text-sm text-gray-600 mt-3">
              {hasPendingInstructorWings 
                ? "Your Instructor assignment is currently pending admin approval. You will be able to input marks once approved."
                : "To input marks, please switch your active role to Instructor from the top-right menu."}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
            <button
              onClick={() => setShowRoleModal(false)}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
