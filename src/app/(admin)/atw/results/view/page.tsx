/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AtwResult } from "@/libs/types/atwResult";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { atwResultService } from "@/libs/services/atwResultService";
import { atwApprovalService } from "@/libs/services/atwApprovalService";
import type { AtwResultApprovalAuthority } from "@/libs/types/atwApproval";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Modal } from "@/components/ui/modal";
import { useCan } from "@/context/PagePermissionsContext";
import type { AtwInstructorAssignSubject } from "@/libs/types/user";

// ── Rejected cadets grouped table ──────────────────────────────────────────
function RejectedTable({ groups, resubmitLoading, onView, onViewDetail, onResubmit, onRejectDown }: {
  groups: any[];
  resubmitLoading: number | null;
  onView: (item: any) => void;
  onViewDetail: (item: any) => void;
  onResubmit: (item: any) => void;
  onRejectDown: (item: any) => void;
}) {
  const subjCount = (sg: any) => sg.items.length;
  const progCount = (pg: any) => pg.subjects.reduce((a: number, s: any) => a + subjCount(s), 0);
  const semCount = (sg: any) => sg.programs.reduce((a: number, p: any) => a + progCount(p), 0);
  const courseCount = (cg: any) => cg.semesters.reduce((a: number, s: any) => a + semCount(s), 0);

  let sl = 0;
  return (
    <table className="w-full text-[10px] border-collapse">
      <thead>
        <tr className="bg-orange-50 text-orange-900">
          <th className="px-2 py-2 border border-orange-200 text-center">Course</th>
          <th className="px-2 py-2 border border-orange-200 text-center">Semester</th>
          <th className="px-2 py-2 border border-orange-200 text-center">Program</th>
          <th className="px-2 py-2 border border-orange-200 text-center">Subject</th>
          <th className="px-2 py-2 border border-orange-200 text-center">Sl</th>
          <th className="px-2 py-2 border border-orange-200 text-left">BD No</th>
          <th className="px-2 py-2 border border-orange-200 text-left">Rank</th>
          <th className="px-2 py-2 border border-orange-200 text-left">Name</th>
          <th className="px-2 py-2 border border-orange-200 text-left">Branch</th>
          <th className="px-2 py-2 border border-orange-200 text-left">Reason</th>
          <th className="px-2 py-2 border border-orange-200 text-left">Status</th>
          <th className="px-2 py-2 border border-orange-200 text-left">Rejected By</th>
          <th className="px-2 py-2 border border-orange-200 text-center no-print">Action</th>
        </tr>
      </thead>
      <tbody>
        {groups.map((cg: any) =>
          cg.semesters.map((sg: any, sIdx: number) =>
            sg.programs.map((pg: any, pIdx: number) =>
              pg.subjects.map((subjg: any, subjIdx: number) =>
                subjg.items.map((item: any, iIdx: number) => {
                  sl++;
                  const isFirstInCourse = sIdx === 0 && pIdx === 0 && subjIdx === 0 && iIdx === 0;
                  const isFirstInSem = pIdx === 0 && subjIdx === 0 && iIdx === 0;
                  const isFirstInProg = subjIdx === 0 && iIdx === 0;
                  const isFirstInSubj = iIdx === 0;
                  return (
                    <tr
                      key={`${cg.key}-${sg.key}-${pg.key}-${subjg.key}-${item.cadet_id}`}
                      className="hover:bg-orange-50/50 cursor-pointer transition-colors"
                      onClick={() => item.result_id && onView(item)}
                    >
                      {isFirstInCourse && <td className="px-2 py-2 text-center border border-orange-100 font-semibold text-orange-800 align-middle" rowSpan={courseCount(cg)}>{cg.course_name}</td>}
                      {isFirstInSem && <td className="px-2 py-2 text-center border border-orange-100 align-middle" rowSpan={semCount(sg)}>{sg.semester_name}</td>}
                      {isFirstInProg && <td className="px-2 py-2 text-center border border-orange-100 align-middle" rowSpan={progCount(pg)}>{pg.program_name}</td>}
                      {isFirstInSubj && (
                        <td className="px-2 py-2 text-center border border-orange-100 align-middle" rowSpan={subjCount(subjg)}>
                          <span className="font-medium">{subjg.subject_name}</span>
                          {subjg.subject_code && <span className="text-[9px] text-gray-400 block">({subjg.subject_code})</span>}
                        </td>
                      )}
                      <td className="px-2 py-2 border border-orange-100 text-center">{sl}</td>
                      <td className="px-2 py-2 border border-orange-100 font-mono font-bold">{item.cadet_bd_no}</td>
                      <td className="px-2 py-2 border border-orange-100">{item.cadet_rank}</td>
                      <td className="px-2 py-2 border border-orange-100 font-medium">{item.cadet_name}</td>
                      <td className="px-2 py-2 border border-orange-100">{item.cadet_branch}</td>
                      <td className="px-2 py-2 border border-orange-100 text-gray-600 max-w-[150px]">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate flex-1" title={item.rejected_reason || ''}>{item.rejected_reason || '—'}</span>
                          <button onClick={(e) => { e.stopPropagation(); onViewDetail(item); }} className="p-1 text-orange-600 hover:bg-orange-100 rounded" title="View Details">
                            <Icon icon="hugeicons:view" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-2 border border-orange-100">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${item.state === 'updated_pending_review' || item.state === 'instructor_updated' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                          {item.message}
                        </span>
                      </td>
                      <td className="px-2 py-2 border border-orange-100 text-red-700 font-medium">{item.rejected_by}</td>
                      <td className="px-2 py-2 border border-orange-100 text-center no-print" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {item.result_id && (
                            <button onClick={() => onView(item)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="View Result">
                              <Icon icon="hugeicons:view" className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {item.can_resubmit && (
                            <button onClick={() => onResubmit(item)} disabled={resubmitLoading === item.cadet_id} className="px-2 py-1 text-[9px] bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
                              {resubmitLoading === item.cadet_id && <Icon icon="hugeicons:fan-01" className="w-3 h-3 animate-spin" />}
                              Re-submit
                            </button>
                          )}
                          {item.can_reject_down && (
                            <button onClick={() => onRejectDown(item)} className="px-2 py-1 text-[9px] bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-1">
                              <Icon icon="hugeicons:arrow-down-01" className="w-3 h-3" />
                              Reject ↓
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )
            )
          )
        )}
      </tbody>
    </table>
  );
}

export default function AtwViewResultsPage() {
  const router = useRouter();
  const { user, userIsInstructor } = useAuth();
  const can = useCan("/atw/results");

  const [results, setResults] = useState<AtwResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingResult, setDeletingResult] = useState<AtwResult | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(100);
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

  const [approvalAuthorities, setApprovalAuthorities] = useState<AtwResultApprovalAuthority[]>([]);
  const [forwardModal, setForwardModal] = useState<{
    open: boolean;
    result: AtwResult | null;
    loading: boolean;
    error: string;
  }>({ open: false, result: null, loading: false, error: "" });
  const [showRoleModal, setShowRoleModal] = useState(false);

  const [rejectedPanelItems, setRejectedPanelItems] = useState<any[]>([]);
  const [rejectedPanelLoading, setRejectedPanelLoading] = useState(false);
  const [rejectedPanelExpanded, setRejectedPanelExpanded] = useState(true);
  const [resubmitLoading, setResubmitLoading] = useState<number | null>(null);
  const [rejectDownModal, setRejectDownModal] = useState<{
    open: boolean; item: any | null; reason: string; loading: boolean; error: string;
  }>({ open: false, item: null, reason: '', loading: false, error: '' });

  const [viewRejectedModal, setViewRejectedModal] = useState<{
    open: boolean;
    item: any | null;
  }>({ open: false, item: null });

  const [resubmitModal, setResubmitModal] = useState<{
    open: boolean;
    item: any | null;
    loading: boolean;
    error: string;
  }>({ open: false, item: null, loading: false, error: "" });

  const [myAuthorityDetails, setMyAuthorityDetails] = useState<any>(null);
  const [subjectApprovals, setSubjectApprovals] = useState<any[]>([]);
  const [programApprovals, setProgramApprovals] = useState<any[]>([]);

  const isInstructor = userIsInstructor;
  const instructorId = isInstructor ? user?.id : undefined;

  // Check if current user can do initial forward (has is_initial_cadet_approve authority)
  const canInitialForward = useMemo(() => {
    const userRoleIds = (user as any)?.roles?.filter((r: any) => r.pivot?.is_primary).map((r: any) => r.id) ?? [];
    const userId = user?.id;
    return approvalAuthorities.some((a) => {
      if (!a.is_initial_cadet_approve || !a.is_active) return false;
      if (a.user_id && a.user_id === userId) return true;
      if (a.role_id && userRoleIds.includes(a.role_id)) return true;
      return false;
    });
  }, [approvalAuthorities, user]);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setRejectedPanelLoading(true);

      const response = await atwResultService.getCombinedViewData({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
        instructor_id: isInstructor ? instructorId : undefined,
      });

      if (!response) return;

      // 1. Set Authorities
      const authorities = response.authorities || [];
      setApprovalAuthorities(authorities);

      // Console log my authority details based on primary role match
      const sorted = [...authorities].sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
      let myAuthority: any = null;
      if (user && authorities) {
        const userRoleIds = (user as any)?.roles?.filter((r: any) => r.pivot?.is_primary).map((r: any) => r.id) ?? [];
        const userId = user?.id;
        myAuthority = authorities.find((a: any) =>
          (a.user_id && a.user_id === userId) || (a.role_id && userRoleIds.includes(a.role_id))
        );
        if (myAuthority) {
          if (myAuthority.is_program_forward) {
            setViewMode('consolidated');
          }
          setMyAuthorityDetails(myAuthority);
        }
      }

      // 2. Set Rejected Panel — only show if the rejecting authority is at or above current user (current user is at or below the rejector)
      const allRejected = response.rejected_cadet_panel || [];
      const myIdx = myAuthority ? sorted.findIndex((a: any) => a.id === myAuthority.id) : -1;
      const assignedSubjectIds = new Set((response.instructor_assign_subjects || []).map((a: any) => a.subject_id));
      const filteredRejected = myIdx === -1
        ? allRejected
        : allRejected.filter((item: any) => {
          const barrierIdx = sorted.findIndex((a: any) => a.id === item.barrier_authority_id);
          if (barrierIdx === -1 || myIdx > barrierIdx) return false;
          // For instructors, only show rejected cadets from subjects assigned to them
          if (isInstructor) return assignedSubjectIds.has(item.subject_id);
          return true;
        });
      setRejectedPanelItems(filteredRejected);

      // 3. Set Cadet Counts
      setCadetCounts(response.context_counts || {});

      // 4. Set Subject Approvals
      setSubjectApprovals(response.atw_result_subject_approvals || []);
      setProgramApprovals(response.atw_result_program_approvals || []);

      // 5. Merge Results and Placeholders
      const resultsData = response.results.data || [];
      const assignments = response.instructor_assign_subjects || [];

      const resultKeys = new Set<string>();
      resultsData.forEach((r: any) => {
        resultKeys.add(`${r.course_id}-${r.semester_id}-${r.program_id}-${r.atw_subject_id}`);
      });

      const placeholders: any[] = [];
      assignments.forEach((a: AtwInstructorAssignSubject) => {
        const key = `${a.course_id}-${a.semester_id}-${a.program_id}-${a.subject_id}`;
        if (!resultKeys.has(key)) {
          resultKeys.add(key); // avoid duplicates
          placeholders.push({
            id: `placeholder-${a.id}`,
            course_id: a.course_id,
            semester_id: a.semester_id,
            program_id: a.program_id,
            system_programs_changeable_semester_id: (a as any).system_programs_changeable_semester_id ?? null,
            atw_subject_id: a.subject_id,
            instructor_id: a.instructor_id,
            course: a.course,
            semester: a.semester,
            program: a.program,
            instructor: a.instructor,
            subject: { module: a.subject, subject_name: a.subject?.subject_name, subject_code: a.subject?.subject_code },
            atw_subject_module: a.subject,
            result_getting_cadets: [],
            approval_stats: null,
            subject_approval: null,
            subject_group: (a as any).subject_group ?? null,
            changeable_program: (a as any).subject_group?.changeable_semester ?? null,
            computed_status: (a as any).computed_status ?? 'not_entered',
            _is_placeholder: true,
          });
        }
      });

      const mergedResults = [...resultsData, ...placeholders];
      setResults(mergedResults);

      // Pagination for the results
      setPagination({
        current_page: response.results.current_page || 1,
        last_page: response.results.last_page || 1,
        per_page: response.results.per_page || 10,
        total: response.results.total + placeholders.length,
        from: response.results.from || 0,
        to: response.results.to + placeholders.length || 0,
      });

    } catch (error) {
      console.error("Failed to load combined data:", error);
    } finally {
      setLoading(false);
      setRejectedPanelLoading(false);
    }
  }, [currentPage, perPage, searchTerm, isInstructor, instructorId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

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

  const handleEditResult = (result: AtwResult) => router.push(`/atw/results/${result.id}/edit`);
  const handleViewResult = (resultId: number) => router.push(`/atw/results/${resultId}`);
  const handleDeleteResult = (result: AtwResult) => {
    setDeletingResult(result);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingResult) return;
    try {
      setDeleteLoading(true);
      await atwResultService.deleteResult(deletingResult.id);
      await loadAllData();
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
        subject_id: result.atw_subject_id,
        instructor_id: result.instructor_id,
        status: "pending",
        cadet_ids: result.result_getting_cadets?.map((c) => c.cadet_id) ?? [],
        authority_ids: nextAuthority ? [nextAuthority.id] : [],
      });
      setForwardModal({ open: false, result: null, loading: false, error: "" });
      await loadAllData();
    } catch (err: any) {
      const msg = err?.errors
        ? Object.values(err.errors).flat().join(" ")
        : err?.message || "Failed to forward result.";
      setForwardModal((prev) => ({ ...prev, loading: false, error: msg }));
    }
  };

  const handleResubmit = (item: any) => {
    setResubmitModal({ open: true, item, loading: false, error: "" });
  };

  const handleConfirmResubmit = async () => {
    const item = resubmitModal.item;
    if (!item) return;
    setResubmitModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      await atwApprovalService.resubmitRejectedCadet({
        course_id: item.course_id,
        semester_id: item.semester_id,
        program_id: item.program_id,
        cadet_id: item.cadet_id,
        subject_id: item.subject_id,
      });
      setResubmitModal({ open: false, item: null, loading: false, error: "" });
      await loadAllData();
    } catch (err: any) {
      setResubmitModal(prev => ({ ...prev, loading: false, error: err?.message || 'Failed to resubmit.' }));
    }
  };

  const handleRejectDown = async () => {
    if (!rejectDownModal.item) return;
    if (!rejectDownModal.reason.trim()) {
      setRejectDownModal(prev => ({ ...prev, error: 'Rejection reason is required.' }));
      return;
    }
    const item = rejectDownModal.item;
    setRejectDownModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await atwApprovalService.approveCadets({
        course_id: item.course_id,
        semester_id: item.semester_id,
        program_id: item.program_id,
        subject_id: item.subject_id,
        cadet_ids: [item.cadet_id],
        authority_id: item.my_authority_id,
        status: 'rejected',
        rejected_reason: rejectDownModal.reason,
      });
      setRejectDownModal({ open: false, item: null, reason: '', loading: false, error: '' });
      await loadAllData();
    } catch (err: any) {
      setRejectDownModal(prev => ({ ...prev, loading: false, error: err?.message || 'Failed to reject.' }));
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

  // ── Program-level forwarding filter ──────────────────────────────────
  // For authorities above is_initial_forward level (e.g. ATW OC, CPTC),
  // only show programs that have been forwarded to their authority_id
  // via atw_result_program_approvals.
  const sortedAuthorities = useMemo(() => {
    return [...approvalAuthorities].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  }, [approvalAuthorities]);

  const filteredResults = useMemo(() => {
    if (!myAuthorityDetails) return results;

    // Instructor, initial_cadet_approve, and initial_forward see all assigned subjects
    if (myAuthorityDetails.is_initial_cadet_approve || myAuthorityDetails.is_initial_forward || isInstructor) {
      return results;
    }
    // Check if any lower authority has init_fwd (applies to ATW OC, CPTC etc.)
    const myIdx = sortedAuthorities.findIndex((a: any) => a.id === myAuthorityDetails.id);
    const hasLowerInitFwd = myIdx > 0 && sortedAuthorities.slice(0, myIdx).some((a: any) => a.is_initial_forward);

    if (hasLowerInitFwd) {
      // Show all results — program-level waiting gate is handled in table rendering
      return results;
    }
    // Fallback: show only subjects forwarded specifically to this authority
    return results.filter(r =>
      subjectApprovals.some((sa: any) =>
        sa.course_id === r.course_id &&
        sa.semester_id === r.semester_id &&
        sa.program_id === r.program_id &&
        sa.subject_id === r.atw_subject_id &&
        sa.authority_id === myAuthorityDetails.id
      )
    );
  }, [results, myAuthorityDetails, subjectApprovals, isInstructor, sortedAuthorities]);

  const lowerAuthority = useMemo(() => {
    if (!myAuthorityDetails) return null;
    const mySort = myAuthorityDetails.sort ?? 0;
    // Find highest-sort authority that is strictly below my sort (skip same-sort peers)
    const lower = [...sortedAuthorities].reverse().find(a => (a.sort ?? 0) < mySort);
    return lower ?? null;
  }, [myAuthorityDetails, sortedAuthorities]);

  const higherAuthority = useMemo(() => {
    if (!myAuthorityDetails) return null;
    const mySort = myAuthorityDetails.sort ?? 0;
    // Find lowest-sort authority that is strictly above my sort (skip same-sort peers)
    const higher = sortedAuthorities.find(a => (a.sort ?? 0) > mySort);
    return higher ?? null;
  }, [myAuthorityDetails, sortedAuthorities]);

  const finalAuthority = useMemo(() => {
    return sortedAuthorities.find((a: any) => a.is_final === true) ?? null;
  }, [sortedAuthorities]);

  const lowerLevelHasInitFwd = useMemo(() => {
    if (!myAuthorityDetails) return false;
    const mySort = myAuthorityDetails.sort ?? 0;
    // Only check authorities strictly below my sort level (exclude same-sort peers)
    return sortedAuthorities.some(a => (a.sort ?? 0) < mySort && a.is_initial_forward);
  }, [myAuthorityDetails, sortedAuthorities]);

  // ── Grouping logic (used by both instructor & admin views) ──────────
  const courseTree = useMemo(() => {
    if (filteredResults.length === 0) return [];

    const cMap: any = {};
    filteredResults.forEach(r => {
      const cId = r.course_id || 'unassigned';
      if (!cMap[cId]) cMap[cId] = { course: r.course, sMap: {} };

      const sId = r.semester_id || 'unassigned';
      if (!cMap[cId].sMap[sId]) cMap[cId].sMap[sId] = { semester: r.semester, pMap: {} };

      const changeableSemId = (r as any).system_programs_changeable_semester_id ?? 'base';
      const pId = `${r.program_id || 'unassigned'}-${changeableSemId}`;
      if (!cMap[cId].sMap[sId].pMap[pId]) cMap[cId].sMap[sId].pMap[pId] = {
        program: r.program,
        changeableProgram: (r as any).changeableProgram ?? (r as any).changeable_program ?? null,
        subjectGroup: (r as any).subject_group ?? null,
        results: []
      };

      cMap[cId].sMap[sId].pMap[pId].results.push(r);
    });

    return Object.values(cMap).map((c: any) => {
      const semesters = Object.values(c.sMap).map((s: any) => {
        const programs = Object.values(s.pMap).map((p: any) => ({
          program: p.program,
          changeableProgram: p.changeableProgram ?? null,
          subjectGroup: p.subjectGroup ?? null,
          results: p.results,
          pRowSpan: p.results.length
        }));
        const sRowSpan = programs.reduce((sum, p) => sum + p.pRowSpan, 0);
        return { semester: s.semester, programs, sRowSpan };
      });
      const cRowSpan = semesters.reduce((sum, s) => sum + s.sRowSpan, 0);
      return { course: c.course, semesters, cRowSpan };
    }).sort((a: any, b: any) => (b.course?.id ?? 0) - (a.course?.id ?? 0));
  }, [filteredResults]);

  // Engineering tree: Course > Semester > Program(changeable) > University > Department > results
  const enggCourseTree = useMemo(() => {
    if (!myAuthorityDetails?.is_only_engg || filteredResults.length === 0) return [];

    const cMap: any = {};
    filteredResults.forEach((r: any) => {
      const cId = r.course_id || 'unassigned';
      if (!cMap[cId]) cMap[cId] = { course: r.course, sMap: {} };

      const sId = r.semester_id || 'unassigned';
      if (!cMap[cId].sMap[sId]) cMap[cId].sMap[sId] = { semester: r.semester, pMap: {} };

      const pId = r.program_id || 'unassigned';
      if (!cMap[cId].sMap[sId].pMap[pId]) cMap[cId].sMap[sId].pMap[pId] = {
        program: r.program,
        changeableProgram: (r as any).changeable_program ?? null,
        uMap: {}
      };

      const uId = (r as any).subject_group?.university_id ?? 'none';
      const uMap = cMap[cId].sMap[sId].pMap[pId].uMap;
      if (!uMap[uId]) uMap[uId] = { university: (r as any).subject_group?.university ?? null, dMap: {} };

      const dId = (r as any).subject_group?.atw_university_department_id ?? 'none';
      const dMap = uMap[uId].dMap;
      if (!dMap[dId]) dMap[dId] = { department: (r as any).subject_group?.university_department ?? null, results: [] };

      dMap[dId].results.push(r);
    });

    return Object.values(cMap).map((c: any) => {
      const semesters = Object.values(c.sMap).map((s: any) => {
        const programs = Object.values(s.pMap).map((p: any) => {
          const universities = Object.values(p.uMap).map((u: any) => {
            const departments = Object.values(u.dMap).map((d: any) => ({
              department: d.department,
              results: d.results,
              dRowSpan: d.results.length,
            }));
            const uRowSpan = departments.reduce((sum: number, d: any) => sum + d.dRowSpan, 0);
            return { university: u.university, departments, uRowSpan };
          });
          const pRowSpan = universities.reduce((sum: number, u: any) => sum + u.uRowSpan, 0);
          return { program: p.program, changeableProgram: p.changeableProgram, universities, pRowSpan };
        });
        const sRowSpan = programs.reduce((sum: number, p: any) => sum + p.pRowSpan, 0);
        return { semester: s.semester, programs, sRowSpan };
      });
      const cRowSpan = semesters.reduce((sum: number, s: any) => sum + s.sRowSpan, 0);
      return { course: c.course, semesters, cRowSpan };
    }).sort((a: any, b: any) => (b.course?.id ?? 0) - (a.course?.id ?? 0));
  }, [filteredResults, myAuthorityDetails]);

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  const [viewMode, setViewMode] = useState<'subjects' | 'consolidated'>('subjects');
  const hasAutoSwitched = React.useRef(false);

  const [programForwardModal, setProgramForwardModal] = useState<{
    open: boolean;
    programNode: any | null;
    loading: boolean;
    error: string;
  }>({ open: false, programNode: null, loading: false, error: "" });

  const handleProgramForward = (pNode: any) => {
    setProgramForwardModal({ open: true, programNode: pNode, loading: false, error: "" });
  };


  const handleConfirmProgramForward = async () => {
    const p = programForwardModal.programNode;
    if (!p) return;

    const isInitFwd = !!myAuthorityDetails?.is_initial_forward;
    const isProgramFwd = !!(myAuthorityDetails as any)?.is_program_forward;
    const firstRes = p.results[0];
    const nextAuthority = higherAuthority?.id;

    setProgramForwardModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      if (isProgramFwd && !isInitFwd) {
        // is_program_forward route — bulk approve all cadets + subjects + program
        await atwApprovalService.bulkApproveAndForwardProgram({
          course_id: firstRes.course_id,
          semester_id: firstRes.semester_id,
          program_id: firstRes.program_id,
          authority_ids: nextAuthority ? [nextAuthority] : [],
        });
      } else {
        // is_initial_forward route — approve program only
        await atwApprovalService.approveProgram({
          course_id: firstRes.course_id,
          semester_id: firstRes.semester_id,
          program_id: firstRes.program_id,
          status: "approved",
          authority_ids: nextAuthority ? [nextAuthority] : [],
        });
      }

      setProgramForwardModal({ open: false, programNode: null, loading: false, error: "" });
      await loadAllData();
    } catch (err: any) {
      const msg = err?.message || "Failed to forward program.";
      setProgramForwardModal(prev => ({ ...prev, loading: false, error: msg }));
    }
  };

  useEffect(() => {
    if (!loading && results.length > 0 && !isInstructor && !hasAutoSwitched.current) {
      const hasFullyApproved = courseTree.some((c: any) =>
        c.semesters.some((s: any) =>
          s.programs.some((p: any) => {
            const approvedCount = p.results.filter((r: any) => r.subject_approval?.status === 'approved').length;
            return approvedCount === p.results.length && p.results.length > 0;
          })
        )
      );

      if (hasFullyApproved) {
        setViewMode('consolidated');
        hasAutoSwitched.current = true;
      }
    }
  }, [loading, results, isInstructor, courseTree]);

  // Build grouped structure for rejected panel: course → semester → program → subject → cadets
  const rejectedGroups = useMemo(() => {
    const courseMap = new Map<string, {
      key: string; course_name: string;
      semesters: {
        key: string; semester_name: string;
        programs: {
          key: string; program_name: string;
          subjects: {
            key: string; subject_name: string; subject_code: string; result_id: number | null;
            items: any[];
          }[];
        }[];
      }[];
    }>();

    rejectedPanelItems.forEach((item: any) => {
      const cKey = item.course_name;
      const semKey = `${cKey}||${item.semester_name}`;
      const progKey = `${semKey}||${item.program_name}`;
      const subjKey = `${progKey}||${item.subject_name}||${item.subject_code}`;

      if (!courseMap.has(cKey)) courseMap.set(cKey, { key: cKey, course_name: item.course_name, semesters: [] });
      const cg = courseMap.get(cKey)!;

      let sg = cg.semesters.find(s => s.key === semKey);
      if (!sg) { sg = { key: semKey, semester_name: item.semester_name, programs: [] }; cg.semesters.push(sg); }

      let pg = sg.programs.find(p => p.key === progKey);
      if (!pg) { pg = { key: progKey, program_name: item.program_name, subjects: [] }; sg.programs.push(pg); }

      let subjg = pg.subjects.find(s => s.key === subjKey);
      if (!subjg) { subjg = { key: subjKey, subject_name: item.subject_name, subject_code: item.subject_code, result_id: item.result_id, items: [] }; pg.subjects.push(subjg); }

      subjg.items.push(item);
    });

    return Array.from(courseMap.values());
  }, [rejectedPanelItems]);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8 relative">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">ATW Results Management</h2>

        {/* {myAuthorityDetails && (
          <div className="absolute top-0 right-0 no-print flex flex-col gap-1 items-end">
            {lowerAuthority && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex flex-col items-end gap-0.5">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Lower Authority</span>
                <span className="text-xs font-semibold text-gray-600">{lowerAuthority.role?.name || lowerAuthority.user?.name || `Auth #${lowerAuthority.id}`}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-400">(id: {lowerAuthority.id})</span>
                  <span className={`px-1 rounded text-[9px] font-bold ${lowerAuthority.is_initial_cadet_approve ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>init_cdt: {lowerAuthority.is_initial_cadet_approve ? 'true' : 'false'}</span>
                  <span className={`px-1 rounded text-[9px] font-bold ${lowerAuthority.is_initial_forward ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>init_fwd: {lowerAuthority.is_initial_forward ? 'true' : 'false'}</span>
                  <span className={`px-1 rounded text-[9px] font-bold ${(lowerAuthority as any).is_program_forward ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>prg_fwd: {(lowerAuthority as any).is_program_forward ? 'true' : 'false'}</span>
                </div>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex flex-col items-end gap-0.5">
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Your Authority Level</span>
              <span className="text-sm font-bold text-blue-800">{myAuthorityDetails.role?.name || 'Authorized User'}</span>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-blue-400">(id: {myAuthorityDetails.id})</span>
                <span className={`px-1 rounded text-[9px] font-bold ${myAuthorityDetails.is_initial_cadet_approve ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-400'}`}>init_cdt: {myAuthorityDetails.is_initial_cadet_approve ? 'true' : 'false'}</span>
                <span className={`px-1 rounded text-[9px] font-bold ${myAuthorityDetails.is_initial_forward ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-400'}`}>init_fwd: {myAuthorityDetails.is_initial_forward ? 'true' : 'false'}</span>
                <span className={`px-1 rounded text-[9px] font-bold ${(myAuthorityDetails as any).is_program_forward ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-400'}`}>prg_fwd: {(myAuthorityDetails as any).is_program_forward ? 'true' : 'false'}</span>
              </div>
              {lowerLevelHasInitFwd && (
                <span className="text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide mt-0.5">Enable</span>
              )}
            </div>
            {higherAuthority && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex flex-col items-end gap-0.5">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Higher Authority</span>
                <span className="text-xs font-semibold text-gray-600">{higherAuthority.role?.name || higherAuthority.user?.name || `Auth #${higherAuthority.id}`}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-400">(id: {higherAuthority.id})</span>
                  <span className={`px-1 rounded text-[9px] font-bold ${higherAuthority.is_initial_cadet_approve ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>init_cdt: {higherAuthority.is_initial_cadet_approve ? 'true' : 'false'}</span>
                  <span className={`px-1 rounded text-[9px] font-bold ${higherAuthority.is_initial_forward ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>init_fwd: {higherAuthority.is_initial_forward ? 'true' : 'false'}</span>
                  <span className={`px-1 rounded text-[9px] font-bold ${(higherAuthority as any).is_program_forward ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>prg_fwd: {(higherAuthority as any).is_program_forward ? 'true' : 'false'}</span>
                </div>
              </div>
            )}
          </div>
        )} */}

        <div className="flex justify-center items-center gap-1 mt-2">
          {!isInstructor && (
            <div className="flex justify-center items-center gap-1 rounded-full p-1 border border-gray-200 no-print w-fit">
              <button
                onClick={() => setViewMode('subjects')}
                className={`px-4 py-1 text-sm font-bold rounded-full transition-all ${viewMode === 'subjects'
                  ? 'text-blue-600 bg-gray-100'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Icon icon="hugeicons:book-open-01" className="w-4 h-4" />
                  Subject Wise
                </div>
              </button>
              <button
                onClick={() => setViewMode('consolidated')}
                className={`px-4 py-1 text-sm font-bold rounded-full transition-all ${viewMode === 'consolidated'
                  ? 'text-indigo-600 bg-gray-100'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Icon icon="hugeicons:file-02" className="w-4 h-4" />
                  Consolidated
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 mb-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-2">
            <div className="relative w-80">
              <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search results..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
            </div>

          </div>

          <div className="flex items-center gap-2">
            {can('add') && viewMode === 'subjects' && (
              <button onClick={handleAddResult} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
                <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
                Add Result
              </button>
            )}
            <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
          </div>
        </div>
      </div>
      {rejectedPanelItems.length > 0 && (
        <div className="mb-6 overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="hugeicons:alert-02" className="w-5 h-5 text-orange-500" />
            Rejected Cadets
            {rejectedPanelItems.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                {rejectedPanelItems.length}
              </span>
            )}
          </div>
          {rejectedPanelExpanded && (
            <div className="overflow-x-auto">
              {rejectedPanelLoading ? (
                <div className="flex justify-center py-4">
                  <Icon icon="hugeicons:fan-01" className="w-6 h-6 animate-spin text-orange-400" />
                </div>
              ) : (
                <RejectedTable
                  groups={rejectedGroups}
                  resubmitLoading={resubmitLoading}
                  onView={(item) => router.push(`/atw/results/${item.result_id}`)}
                  onViewDetail={(item) => setViewRejectedModal({ open: true, item })}
                  onResubmit={handleResubmit}
                  onRejectDown={(item) => setRejectDownModal({ open: true, item, reason: '', loading: false, error: '' })}
                />
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <TableLoading />
      ) : viewMode === 'consolidated' ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black text-sm text-left">
            <thead className="font-bold">
              <tr>
                <th className="px-4 py-2 border border-black">Course</th>
                <th className="px-4 py-2 border border-black">Semester</th>
                <th className="px-3 py-2 border border-black text-center w-12">SL.</th>
                <th className="px-4 py-2 border border-black">Program</th>
                <th className="px-4 py-2 border border-black text-center">Subject Approved</th>
                <th className="px-4 py-2 border border-black text-center">Approval Status</th>
                <th className="px-4 py-2 border border-black text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {(() => {
                let globalIdx = 0;
                if (courseTree.length === 0) {
                  return <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500 italic">No programs found</td></tr>;
                }

                return courseTree.map((cNode: any) =>
                  cNode.semesters.map((sNode: any, sIdx: number) =>
                    sNode.programs.map((pNode: any, pIdx: number) => {
                      globalIdx++;
                      const isFirstInCourse = sIdx === 0 && pIdx === 0;
                      const isFirstInSem = pIdx === 0;

                      const courseProgCount = cNode.semesters.reduce((acc: number, s: any) => acc + s.programs.length, 0);
                      const semProgCount = sNode.programs.length;

                      const approvedCount = pNode.results.filter((r: any) => {
                        if (!!(r as any)._is_placeholder) return false;
                        if (!myAuthorityDetails) return r.subject_approval?.status === 'approved';

                        // Same logic as approval status column
                        if (myAuthorityDetails.is_initial_cadet_approve) {
                          return r.approval_stats?.approved === r.approval_stats?.total && r.approval_stats?.total > 0;
                        }

                        const ctxMatch = (a: any) =>
                          a.course_id === r.course_id &&
                          a.semester_id === r.semester_id &&
                          a.program_id === r.program_id &&
                          a.subject_id === r.atw_subject_id;

                        const mySubApp = subjectApprovals.find((a: any) =>
                          ctxMatch(a) && a.authority_id === myAuthorityDetails.id
                        );

                        if (mySubApp) {
                          if (mySubApp.status === 'approved') return true;
                          if (mySubApp.status === 'rejected') return false;
                          // pending + not latest → shows ✓ Approved in status column
                          const sa = (r as any).subject_approval;
                          if (mySubApp.status === 'pending' && sa?.authority_id !== myAuthorityDetails.id) return true;
                          return false; // pending + my turn
                        }

                        // iForwarded case → shows ✓ Approved in status column
                        if (user) {
                          const iForwarded = subjectApprovals.find((a: any) =>
                            ctxMatch(a) && Number(a.forwarded_by) === Number(user.id)
                          );
                          if (iForwarded) return true;
                        }

                        return false;
                      }).length;
                      const totalCount = pNode.results.length;
                      const isFullyApproved = approvedCount === totalCount && totalCount > 0;
                      const firstRes = pNode.results[0];

                      const pPA = programApprovals.filter((pa: any) =>
                        pa.course_id === firstRes?.course_id &&
                        pa.semester_id === firstRes?.semester_id &&
                        pa.program_id === firstRes?.program_id
                      );
                      const pAlreadyApproved = higherAuthority
                        ? pPA.some((pa: any) => pa.status === 'approved' && pa.authority_id === higherAuthority.id)
                        : pPA.some((pa: any) => pa.status === 'approved' && pa.authority_id === myAuthorityDetails?.id);
                      const pAlreadyForwardedByMe = pPA.some((pa: any) => pa.status === 'pending' && pa.forwarded_by === (user as any)?.id);
                      const approvedByLabel = higherAuthority?.role?.name ?? finalAuthority?.role?.name ?? 'Final Authority';
                      const myPA = pPA.find((pa: any) => pa.authority_id === myAuthorityDetails?.id);
                      const canInitPF = (myAuthorityDetails?.is_initial_cadet_approve || myAuthorityDetails?.is_initial_forward) && pPA.length === 0;
                      const isMyProgTurn = canInitPF || myPA?.status === 'pending';
                      const realResultsProg = pNode.results.filter((res: any) => !(res as any)._is_placeholder);
                      const fwdSubjCount = realResultsProg.filter((res: any) => !!(res as any).subject_approval).length;
                      const totalSubjCount = realResultsProg.length;
                      const allSubjFwd = totalSubjCount > 0 && fwdSubjCount === totalSubjCount;

                      const isProgramForwarded = !lowerLevelHasInitFwd || !myAuthorityDetails ||
                        programApprovals.some((pa: any) =>
                          pa.course_id === firstRes?.course_id &&
                          pa.semester_id === firstRes?.semester_id &&
                          pa.program_id === pNode.program?.id &&
                          pa.authority_id === myAuthorityDetails.id
                        );

                      if (!isProgramForwarded) {
                        return (
                          <tr key={`waiting-cons-${pNode.program?.id}`} className="bg-yellow-50/30">
                            {isFirstInCourse && (
                              <td rowSpan={courseProgCount} className="px-4 py-2 border border-black font-bold text-gray-900 align-middle bg-white cursor-default">
                                {cNode.course?.name || "—"}
                              </td>
                            )}
                            {isFirstInSem && (
                              <td rowSpan={semProgCount} className="px-4 py-2 border border-black font-medium text-gray-700 align-middle bg-white cursor-default">
                                {sNode.semester?.name || "—"}
                              </td>
                            )}
                            <td className="px-3 py-2 border border-black text-center font-medium text-gray-400">{globalIdx}</td>
                            <td className="px-4 py-2 border border-black font-bold text-gray-900">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-gray-900">{pNode.changeableProgram?.name ?? pNode.program?.name ?? "—"}</span>
                                {pNode.subjectGroup?.university && <span className="text-[10px] font-normal text-slate-500">{pNode.subjectGroup.university.name}</span>}
                                {pNode.subjectGroup?.university_department && <span className="inline-block px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-semibold border border-indigo-100 mt-0.5 w-fit">{pNode.subjectGroup.university_department.name}</span>}
                              </div>
                            </td>
                            <td colSpan={2} className="px-4 py-2 border border-black">
                              <div className="flex flex-col items-center justify-center py-4 rounded-lg border border-dashed border-yellow-300 bg-yellow-50 gap-1">
                                <Icon icon="hugeicons:clock-01" className="w-5 h-5 text-yellow-500" />
                                <p className="text-sm font-semibold text-yellow-700">Waiting for Result</p>
                                <p className="text-xs text-yellow-600">This program has not been forwarded to your authority level yet.</p>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const hasResultsInputted = realResultsProg.length > 0;

                      return (
                        <tr
                          key={`${firstRes?.course_id}-${firstRes?.semester_id}-${pNode.program?.id}`}
                          className={`transition-colors group ${hasResultsInputted ? 'hover:bg-indigo-50/20 cursor-pointer' : 'cursor-default'}`}
                          onClick={() => hasResultsInputted && router.push(`/atw/results/course/${firstRes?.course_id}/semester/${firstRes?.semester_id}/program/${firstRes?.program_id}`)}
                        >
                          {isFirstInCourse && (
                            <td rowSpan={courseProgCount} className="px-4 py-2 border border-black font-bold text-gray-900 align-middle bg-white cursor-default" onClick={(e) => e.stopPropagation()}>
                              {cNode.course?.name || "—"}
                            </td>
                          )}

                          {isFirstInSem && (
                            <td rowSpan={semProgCount} className="px-4 py-2 border border-black font-medium text-gray-700 align-middle bg-white cursor-default" onClick={(e) => e.stopPropagation()}>
                              {sNode.semester?.name || "—"}
                            </td>
                          )}
                          <td className="px-3 py-2 border border-black text-center font-medium text-gray-500 group-hover:text-indigo-600">{globalIdx}</td>
                          <td className="px-4 py-2 border border-black font-bold text-gray-900">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-900">{pNode.changeableProgram?.name ?? pNode.program?.name ?? "—"}</span>
                              {pNode.subjectGroup?.university && <span className="text-[10px] font-normal text-slate-500">{pNode.subjectGroup.university.name}</span>}
                              {pNode.subjectGroup?.university_department && <span className="inline-block px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-semibold border border-indigo-100 mt-0.5 w-fit">{pNode.subjectGroup.university_department.name}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-2 border border-black text-center">
                            <div className="flex flex-col items-center gap-2">
                              {/* Subject Stats */}
                              <div className="flex flex-col items-center">
                                <span className={`px-3 py-0.5 text-sm font-bold`}>
                                  {approvedCount} / {totalCount}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2 border border-black text-left" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col">
                              {(() => {
                                const progSubjectIds = realResultsProg.map((r: any) => r.atw_subject_id);
                                const totalSubj = progSubjectIds.length;

                                // Determine if this program row is engineering (any result has changeable semester)
                                const isEnggRow = realResultsProg.some((r: any) => !!r.system_programs_changeable_semester_id);

                                // Filter out peer authorities that don't apply to this result type
                                const chainAuthorities = sortedAuthorities.filter((auth: any) => {
                                  if (auth.is_only_engg) return isEnggRow; // engg authority: only for engg results
                                  const hasPeerEnggAtSameSort = sortedAuthorities.some(
                                    (a: any) => a.is_only_engg && (a.sort ?? 0) === (auth.sort ?? 0)
                                  );
                                  if (hasPeerEnggAtSameSort) return !isEnggRow; // non-engg peer: only for non-engg results
                                  return true;
                                });

                                return chainAuthorities.map((auth: any, idx: number) => {
                                  const isMe   = auth.id === myAuthorityDetails?.id;
                                  const isLast = idx === chainAuthorities.length - 1;

                                  let isApproved = false;
                                  let isPending  = false;
                                  let statusText = 'Not reached';

                                  if (auth.is_program_forward || (!auth.is_initial_cadet_approve && !auth.is_initial_forward)) {
                                    // ── is_program_forward or generic: check atw_result_program_approvals ──
                                    // pPA may have BOTH a pending record (forwarded TO this auth) AND an approved
                                    // record (this auth forwarded onward). Prioritise approved over pending.
                                    isApproved = pPA.some((pa: any) => pa.authority_id === auth.id && pa.status === 'approved');
                                    isPending  = !isApproved && pPA.some((pa: any) => pa.authority_id === auth.id && pa.status === 'pending');
                                    statusText = isApproved ? 'Approved' : isPending ? 'Pending' : 'Not reached';

                                  } else if (auth.is_initial_forward) {
                                    // ── is_initial_forward: check approved AND pending (forwarded to this authority) ──
                                    // Use all subject IDs including placeholders so pending approvals on stub rows are detected
                                    const allSubjIds = pNode.results.map((r: any) => r.atw_subject_id);
                                    const approvedSubjCount = allSubjIds.filter((sid: any) =>
                                      subjectApprovals.some((sa: any) =>
                                        sa.authority_id === auth.id &&
                                        sa.subject_id === sid &&
                                        sa.course_id === firstRes?.course_id &&
                                        sa.semester_id === firstRes?.semester_id &&
                                        sa.program_id === firstRes?.program_id &&
                                        sa.status === 'approved'
                                      )
                                    ).length;
                                    const pendingSubjCount = allSubjIds.filter((sid: any) =>
                                      subjectApprovals.some((sa: any) =>
                                        sa.authority_id === auth.id &&
                                        sa.subject_id === sid &&
                                        sa.course_id === firstRes?.course_id &&
                                        sa.semester_id === firstRes?.semester_id &&
                                        sa.program_id === firstRes?.program_id &&
                                        sa.status === 'pending'
                                      )
                                    ).length;
                                    const totalAllSubj = allSubjIds.length;
                                    isApproved = totalAllSubj > 0 && approvedSubjCount === totalAllSubj;
                                    isPending  = !isApproved && (approvedSubjCount > 0 || pendingSubjCount > 0);
                                    statusText = isApproved
                                      ? 'All Subjects Approved'
                                      : isPending
                                        ? `${approvedSubjCount + pendingSubjCount}/${totalAllSubj} Subjects`
                                        : 'Not reached';

                                  } else if (auth.is_initial_cadet_approve) {
                                    // ── is_initial_cadet_approve (instructor) ──────────────────────────────────────
                                    // Instructor does NOT get their own 'approved' SA record — they create a pending
                                    // record for the next authority when they forward. So "done" = ANY SA record
                                    // exists for this subject (meaning the instructor has forwarded it).
                                    const approvedSubjCount = progSubjectIds.filter((sid: any) =>
                                      subjectApprovals.some((sa: any) =>
                                        sa.subject_id === sid &&
                                        sa.course_id === firstRes?.course_id &&
                                        sa.semester_id === firstRes?.semester_id &&
                                        sa.program_id === firstRes?.program_id
                                        // no authority_id / status filter — any record means instructor forwarded
                                      )
                                    ).length;
                                    const rejectedCount = rejectedPanelItems.filter((item: any) =>
                                      item.course_id === firstRes?.course_id &&
                                      item.semester_id === firstRes?.semester_id &&
                                      item.program_id === firstRes?.program_id
                                    ).length;
                                    isApproved = totalSubj > 0 && approvedSubjCount === totalSubj;
                                    isPending  = !isApproved && approvedSubjCount > 0;
                                    statusText = isApproved
                                      ? rejectedCount > 0
                                        ? `Approved, ${rejectedCount} rejected`
                                        : 'Approved'
                                      : isPending
                                        ? `${approvedSubjCount}/${totalSubj} Subjects`
                                        : 'Not reached';
                                  }

                                  const dotColor = isApproved ? 'bg-green-500' : isPending ? 'bg-yellow-400' : 'bg-gray-300';
                                  const dotIcon  = isApproved
                                    ? <Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3 text-white" />
                                    : isPending
                                      ? <Icon icon="hugeicons:clock-01" className="w-3 h-3 text-white" />
                                      : <Icon icon="hugeicons:circle" className="w-3 h-3 text-white opacity-60" />;
                                  const labelColor = isApproved ? 'text-green-700 font-semibold' : isPending ? 'text-yellow-700 font-semibold' : 'text-gray-400';

                                  return (
                                    <div key={auth.id} className="flex items-stretch gap-2">
                                      <div className="flex flex-col items-center w-4 shrink-0">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${dotColor}`}>
                                          {dotIcon}
                                        </div>
                                        {!isLast && <div className="w-px flex-1 bg-gray-200 my-0.5" />}
                                      </div>
                                      <div className="pb-2 text-[10px] leading-tight">
                                        <span className={labelColor}>{auth.role?.name ?? `Auth ${auth.id}`}</span>
                                        {isMe && <span className="ml-1 text-[9px] text-blue-500">(me)</span>}
                                        <div className="text-[9px] text-gray-400">{statusText}</div>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </td>
                          <td className="px-4 py-2 border border-black text-center no-print" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => hasResultsInputted && router.push(`/atw/results/course/${firstRes?.course_id}/semester/${firstRes?.semester_id}/program/${firstRes?.program_id}`)}
                                disabled={!hasResultsInputted}
                                className={`${hasResultsInputted ? 'text-indigo-600 hover:bg-indigo-50' : 'text-gray-300 cursor-not-allowed'} rounded-lg transition-colors`}
                                title={hasResultsInputted ? "View Consolidated Result & Approve" : "No results inputted yet"}
                              >
                                <Icon icon="hugeicons:view" className="w-5 h-5" />
                              </button>
                              {pAlreadyApproved ? (
                                <button disabled title={`Approved by ${approvedByLabel}`} className="flex items-center gap-2 text-green-500 cursor-default">
                                  <Icon icon="hugeicons:checkmark-circle-02" className="inline-block w-4 h-4" />
                                </button>
                              ) : pAlreadyForwardedByMe ? (
                                <button disabled title="Already Forwarded" className="flex items-center gap-2 text-green-500 cursor-default">
                                  <Icon icon="hugeicons:checkmark-circle-02" className="inline-block w-4 h-4" />
                                  <span className="inline-block text-[10px] text-green-500 font-medium">Forwarded</span>
                                </button>
                              ) : (() => {
                                const canForward = isMyProgTurn && allSubjFwd;
                                return (
                                  <button
                                    onClick={() => canForward && handleProgramForward(pNode)}
                                    disabled={!canForward}
                                    title={!isMyProgTurn ? 'Not your turn' : !allSubjFwd ? `All subjects must be forwarded first (${fwdSubjCount}/${totalSubjCount})` : `Forward Program (${fwdSubjCount}/${totalSubjCount})`}
                                    className={`transition-colors ${canForward ? 'text-blue-600' : 'text-gray-300 cursor-not-allowed'}`}
                                  >
                                    <Icon icon="hugeicons:share-04" className="w-4 h-4" />
                                  </button>
                                );
                              })()}
                            </div>
                            {pAlreadyApproved ? (
                              <p className="text-[10px] text-green-500">Approved by {higherAuthority?.role?.name ?? null}. Now it is in {finalAuthority?.role?.name}</p>
                            ) : pAlreadyForwardedByMe ? (
                              <p className="text-[10px] text-orange-500">Awaiting {higherAuthority?.role?.name} Approval</p>
                            ) : !hasResultsInputted ? (
                              <p className="text-[10px] text-orange-500 italic">Waiting for Result</p>
                            ) : (
                              <p className="text-[10px] text-red-500">Awaiting for my Approval</p>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )
                );
              })()}
            </tbody>
          </table>
        </div>
      ) : isInstructor ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-sm text-left">
              <thead className="font-bold">
                <tr>
                  <th className="px-4 py-3 border border-black">Course</th>
                  <th className="px-4 py-3 border border-black">Semester</th>
                  <th className="px-4 py-3 border border-black">Program</th>
                  <th className="px-3 py-3 border border-black text-center w-12">SL.</th>
                  <th className="px-4 py-3 border border-black">Subject</th>
                  <th className="px-4 py-3 border border-black">Instructor</th>
                  <th className="px-4 py-3 border border-black text-center">Approval Status</th>
                  <th className="px-4 py-3 border border-black text-center">Cadets</th>
                  <th className="px-4 py-3 border border-black text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {(() => {
                  let globalIdx = 0;
                  if (courseTree.length === 0) {
                    return (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-gray-500 italic">
                          No results found
                        </td>
                      </tr>
                    );
                  }
                  return courseTree.map((cNode: any) => {
                    const getEffPRows = (p: any) => {
                      if (!lowerLevelHasInitFwd || !myAuthorityDetails) return p.pRowSpan;
                      const fwd = programApprovals.some((pa: any) =>
                        pa.course_id === p.results[0]?.course_id &&
                        pa.semester_id === p.results[0]?.semester_id &&
                        pa.program_id === p.program?.id &&
                        pa.authority_id === myAuthorityDetails.id
                      );
                      return fwd ? p.pRowSpan : 1;
                    };
                    return cNode.semesters.map((sNode: any, sIdx: number) => {
                      const effSRowSpan = sNode.programs.reduce((s: number, p: any) => s + getEffPRows(p), 0);
                      const effCRowSpan = cNode.semesters.reduce((s: number, sn: any) =>
                        s + sn.programs.reduce((ps: number, p: any) => ps + getEffPRows(p), 0), 0);

                      return sNode.programs.map((pNode: any, pIdx: number) => {
                        const isFirstInCourse = sIdx === 0 && pIdx === 0;
                        const isFirstInSem = pIdx === 0;

                        const isProgramForwarded = !lowerLevelHasInitFwd || !myAuthorityDetails ||
                          programApprovals.some((pa: any) =>
                            pa.course_id === pNode.results[0]?.course_id &&
                            pa.semester_id === pNode.results[0]?.semester_id &&
                            pa.program_id === pNode.program?.id &&
                            pa.authority_id === myAuthorityDetails.id
                          );

                        // Per-program forward logic
                        const firstRes = pNode.results[0];
                        const pPA = programApprovals.filter((pa: any) =>
                          pa.course_id === firstRes?.course_id &&
                          pa.semester_id === firstRes?.semester_id &&
                          pa.program_id === firstRes?.program_id
                        );
                        const pAlreadyApproved = higherAuthority
                          ? pPA.some((pa: any) => pa.status === 'approved' && pa.authority_id === higherAuthority.id)
                          : pPA.some((pa: any) => pa.status === 'approved' && pa.authority_id === myAuthorityDetails?.id);
                        const pAlreadyForwardedByMe = pPA.some((pa: any) => pa.status === 'pending' && pa.forwarded_by === (user as any)?.id);
                        const approvedByLabel = higherAuthority?.role?.name ?? finalAuthority?.role?.name ?? 'Final Authority';
                        const myPA = pPA.find((pa: any) => pa.authority_id === myAuthorityDetails?.id);
                        const canInitPF = (myAuthorityDetails?.is_initial_cadet_approve || myAuthorityDetails?.is_initial_forward) && pPA.length === 0;
                        const isMyProgTurn = canInitPF || myPA?.status === 'pending';
                        const realResults = pNode.results.filter((res: any) => !(res as any)._is_placeholder);
                        const fwdSubjCount = realResults.filter((res: any) => !!(res as any).subject_approval).length;
                        const totalSubjCount = realResults.length;
                        const allSubjFwd = totalSubjCount > 0 && fwdSubjCount === totalSubjCount;
                        const allCadetsApproved = realResults.length > 0 && realResults.every((res: any) => {
                          const s = res.approval_stats;
                          return s?.total > 0 && s?.approved === s?.total;
                        });

                        if (!isProgramForwarded) {
                          globalIdx++;
                          return (
                            <tr key={`waiting-prog-${pNode.program?.id}`} className="bg-yellow-50/30">
                              {isFirstInCourse && (
                                <td rowSpan={effCRowSpan} className="px-4 py-3 border border-black text-gray-900 font-medium align-middle bg-white cursor-default">
                                  {cNode.course?.name || "—"}
                                </td>
                              )}
                              {isFirstInSem && (
                                <td rowSpan={effSRowSpan} className="px-4 py-3 border border-black text-gray-900 font-medium align-middle bg-white cursor-default">
                                  {sNode.semester?.name || "—"}
                                </td>
                              )}
                              <td className="px-4 py-3 border border-black text-gray-900 font-medium align-middle bg-white">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-gray-900">{pNode.changeableProgram?.name ?? pNode.program?.name ?? "—"}</span>
                                  {pNode.subjectGroup?.university && <span className="text-[10px] font-normal text-slate-500">{pNode.subjectGroup.university.name}</span>}
                                  {pNode.subjectGroup?.university_department && <span className="inline-block px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-semibold border border-indigo-100 mt-0.5 w-fit">{pNode.subjectGroup.university_department.name}</span>}
                                </div>
                              </td>
                              <td colSpan={6} className="px-4 py-3 border border-black">
                                <div className="flex flex-col items-center justify-center py-6 rounded-lg border border-dashed border-yellow-300 bg-yellow-50 gap-2">
                                  <Icon icon="hugeicons:clock-01" className="w-6 h-6 text-yellow-500" />
                                  <p className="text-sm font-semibold text-yellow-700">Waiting for Result</p>
                                  <p className="text-xs text-yellow-600">This program has not been forwarded to your authority level yet.</p>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return pNode.results.map((r: any, rIdx: number) => {
                          globalIdx++;
                          const isFirstInCourse2 = sIdx === 0 && pIdx === 0 && rIdx === 0;
                          const isFirstInSem2 = pIdx === 0 && rIdx === 0;
                          const isFirstInProg = rIdx === 0;

                          const subjectModule = r.subject?.module || r.subject || r.atw_subject_module;
                          const stats = r.approval_stats;
                          const sa = (r as any).subject_approval;
                          const isPlaceholder = !!(r as any)._is_placeholder;

                          const isSubjectApproved = (() => {
                            if (myAuthorityDetails?.is_initial_cadet_approve) {
                              return stats?.total > 0 && stats?.approved === stats?.total;
                            }
                            if (myAuthorityDetails) {
                              const mySubApp = subjectApprovals.find((a: any) =>
                                a.course_id === r.course_id &&
                                a.semester_id === r.semester_id &&
                                a.program_id === r.program_id &&
                                a.subject_id === r.atw_subject_id &&
                                a.authority_id === myAuthorityDetails.id
                              );
                              return mySubApp?.status === 'approved';
                            }
                            return sa?.status === 'approved';
                          })();

                          const isWaitingForResult = (() => {
                            if (isPlaceholder) {
                              // For is_initial_forward: not waiting if a pending approval was forwarded to this authority
                              if (myAuthorityDetails?.is_initial_forward) {
                                const ctxMatch = (a: any) =>
                                  a.course_id === r.course_id && a.semester_id === r.semester_id &&
                                  a.program_id === r.program_id && a.subject_id === r.atw_subject_id;
                                if (subjectApprovals.some((a: any) => ctxMatch(a) && a.authority_id === myAuthorityDetails.id && a.status === 'pending')) return false;
                              }
                              return true;
                            }
                            if (myAuthorityDetails && user) {
                              const ctxMatch = (a: any) =>
                                a.course_id === r.course_id &&
                                a.semester_id === r.semester_id &&
                                a.program_id === r.program_id &&
                                a.subject_id === r.atw_subject_id;
                              const mySubApp = subjectApprovals.find((a: any) =>
                                ctxMatch(a) && a.authority_id === myAuthorityDetails.id
                              );
                              const iForwarded = subjectApprovals.find((a: any) =>
                                ctxMatch(a) && Number(a.forwarded_by) === Number(user.id)
                              );
                              if (mySubApp || iForwarded) return false;
                              if (myAuthorityDetails.is_initial_forward && sa?.status === 'pending' && sa?.authority_id === myAuthorityDetails.id) return false;
                              if (myAuthorityDetails.is_initial_cadet_approve &&
                                (stats?.has_marks || (stats?.total > 0 && stats?.approved === stats?.total))) return false;
                              return true;
                            }
                            return false;
                          })();

                          return (
                            <tr key={r.id} className={`transition-colors group ${isWaitingForResult ? 'cursor-default' : 'hover:bg-blue-50/20 cursor-pointer'}`} onClick={() => !isWaitingForResult && can('view') && handleViewResult(r.id)}>
                              {isFirstInCourse2 && (
                                <td rowSpan={effCRowSpan} className="px-4 py-3 border border-black text-gray-900 font-bold align-middle bg-white cursor-default" onClick={(e) => e.stopPropagation()}>
                                  {cNode.course?.name || "—"}
                                </td>
                              )}
                              {isFirstInSem2 && (
                                <td rowSpan={effSRowSpan} className="px-4 py-3 border border-black text-gray-700 font-medium align-middle bg-white cursor-default" onClick={(e) => e.stopPropagation()}>
                                  {sNode.semester?.name || "—"}
                                </td>
                              )}
                              {isFirstInProg && (
                                <td rowSpan={pNode.pRowSpan} className="px-4 py-3 border border-black text-gray-900 font-bold align-middle bg-white cursor-default" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-gray-900">{pNode.changeableProgram?.name ?? pNode.program?.name ?? "—"}</span>
                                    {pNode.subjectGroup?.university && <span className="text-[10px] font-normal text-slate-500">{pNode.subjectGroup.university.name}</span>}
                                    {pNode.subjectGroup?.university_department && <span className="inline-block px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-semibold border border-indigo-100 mt-0.5 w-fit">{pNode.subjectGroup.university_department.name}</span>}
                                  </div>
                                </td>
                              )}
                              <td className="px-3 py-3 border border-black text-center font-medium text-gray-500 group-hover:text-blue-600">{globalIdx}</td>
                              <td className="px-4 py-3 border border-black group-hover:text-blue-700">
                                <div className="flex flex-col">
                                  <span className="font-bold">{subjectModule?.subject_name || "N/A"}</span>
                                  <span className="text-xs text-gray-500 font-mono">{subjectModule?.subject_code || ""}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 border border-black text-gray-700">
                                {r.instructor ? (
                                  <span className="font-medium">
                                    {r.instructor.rank?.short_name && <>{r.instructor.rank.short_name} </>}
                                    {r.instructor.name}
                                  </span>
                                ) : "—"}
                              </td>
                              <td className="px-4 py-3 border border-black text-center align-middle">
                                {(() => {
                                  if (isPlaceholder) {
                                    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">Waiting for Result</span>;
                                  }
                                  const subjAppContext = (a: any) =>
                                    a.course_id === r.course_id &&
                                    a.semester_id === r.semester_id &&
                                    a.program_id === r.program_id &&
                                    a.subject_id === r.atw_subject_id;
                                  const latestSubjApproval = [...subjectApprovals].filter(subjAppContext).sort((a, b) => b.id - a.id)[0];
                                  const currentStepAuth = latestSubjApproval?.authority_id
                                    ? approvalAuthorities.find(a => a.id === latestSubjApproval.authority_id)
                                    : null;
                                  const stepName = currentStepAuth?.role?.name || null;
                                  if (myAuthorityDetails && user) {
                                    const contextMatches = (a: any) =>
                                      a.course_id === r.course_id &&
                                      a.semester_id === r.semester_id &&
                                      a.program_id === r.program_id &&
                                      a.subject_id === r.atw_subject_id;
                                    const mySubApp = subjectApprovals.find(a => contextMatches(a) && a.authority_id === myAuthorityDetails.id);
                                    const iForwarded = subjectApprovals.find(a => contextMatches(a) && Number(a.forwarded_by) === Number(user.id));
                                    
                                    // If result doesn't have marks or cadets aren't approved yet (for authorities), it's still "Waiting for Result"
                                    const hasActualResult = !isPlaceholder && stats?.has_marks;

                                    if (mySubApp) {
                                      if (mySubApp.status === 'approved') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>;
                                      if (mySubApp.status === 'rejected') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">✗ Rejected</span>;
                                      if (mySubApp.status === 'pending' && sa?.authority_id === myAuthorityDetails.id) {
                                        if (!hasActualResult) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">Waiting for Result</span>;
                                        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">⏳ Pending for My Approval</span>;
                                      }
                                      return (
                                        <div className="flex flex-col items-center gap-0.5">
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>
                                          {sa?.status === 'pending' && stepName && <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-tighter">Stage: {stepName}</span>}
                                        </div>
                                      );
                                    }
                                    if (iForwarded) {
                                      return (
                                        <div className="flex flex-col items-center gap-0.5">
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>
                                          {sa?.status === 'pending' && stepName && <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-tighter">Stage: {stepName}</span>}
                                        </div>
                                      );
                                    }
                                    if (myAuthorityDetails.is_initial_cadet_approve) {
                                      if (stats?.is_result_forwarded) {
                                        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Forwarded</span>;
                                      }
                                      if (stats?.total > 0 && stats?.approved === stats?.total) {
                                        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>;
                                      }
                                      if (stats?.has_marks) {
                                        return (
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">⏳ Pending ({stats.approved}/{stats.total})</span>
                                          </div>
                                        );
                                      }
                                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">⏳ Waiting for Result</span>;
                                    }
                                    if (myAuthorityDetails.is_initial_forward && sa?.status === 'pending' && sa?.authority_id === myAuthorityDetails.id) {
                                      if (!hasActualResult) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">Waiting for Result</span>;
                                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">⏳ Pending for My Approval</span>;
                                    }
                                    return (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">⏳ Waiting for Result</span>
                                        {stepName && <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-tighter">Stage: {stepName}</span>}
                                      </div>
                                    );
                                  }
                                  if (sa?.status === 'approved') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>;
                                  if (sa?.status === 'rejected') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">✗ Rejected</span>;
                                  if (sa?.status === 'pending') {
                                    return (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">⏳ Waiting for Result</span>
                                        {stepName && <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-tighter">Stage: {stepName}</span>}
                                      </div>
                                    );
                                  }
                                  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">Not Forwarded</span>;
                                })()}
                              </td>
                              <td className="px-4 py-3 border border-black text-center font-bold text-blue-700 align-middle bg-white cursor-default" onClick={(e) => e.stopPropagation()}>
                                {(() => { const csKey = (r as any).system_programs_changeable_semester_id ?? (r as any).subject_group?.system_programs_changeable_semester_id ?? 'base'; const ck = `${r.course_id}-${r.semester_id}-${r.program_id}-${csKey}`; return isPlaceholder ? `0/${cadetCounts[ck] ?? 0}` : `${r.result_getting_cadets?.length ?? 0}/${cadetCounts[ck] ?? 0}`; })()}
                              </td>

                              <td className="px-4 py-3 border border-black text-center align-middle no-print" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-center items-center gap-1">
                                  {!isPlaceholder && can('view') && (
                                    <button onClick={() => handleViewResult(r.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
                                  )}
                                  {!isPlaceholder && can('edit') && !sa && (
                                    <button onClick={() => handleEditResult(r)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
                                  )}
                                  {!isPlaceholder && can('delete') && !sa && (
                                    <button onClick={() => handleDeleteResult(r)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
                                  )}
                                  {(() => {
                                    if (isPlaceholder) return null;
                                    if (sa) {
                                      return (
                                        <button disabled title="Already Forwarded" className="p-1 flex items-center justify-center gap-1 text-green-600 cursor-default">
                                          <Icon icon="hugeicons:checkmark-circle-02" className="inline-block w-4 h-4" />
                                          <span className="inline-block text-[10px] text-green-600 font-medium">Forwarded</span>
                                        </button>
                                      );
                                    }
                                    const canForwardSubj = !!(stats?.total > 0 && stats?.approved === stats?.total);
                                    return (
                                      <>
                                        <button
                                          onClick={() => canForwardSubj && handleForwardResult(r)}
                                          disabled={!canForwardSubj}
                                          title={canForwardSubj ? 'Forward Subject' : 'All cadets must be approved first'}
                                          className={`p-1 transition-colors ${canForwardSubj ? 'text-blue-600 hover:bg-blue-50 rounded' : 'text-gray-300 cursor-not-allowed'}`}
                                        >
                                          <Icon icon="hugeicons:share-04" className="w-4 h-4" />
                                        </button>
                                        <span className="text-[10px] text-gray-400 font-medium">{stats?.approved ?? 0}/{stats?.total ?? 0}</span>
                                      </>
                                    );
                                  })()}

                                </div>
                              </td>
                            </tr>
                          );
                        });
                      });
                    });
                  });
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
        // This is for High Authority..not for Instructor
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black text-sm text-left">
            <thead className="font-bold">
              <tr>
                <th className="px-4 py-3 border border-black">Course</th>
                <th className="px-4 py-3 border border-black">Semester</th>
                <th className="px-4 py-3 border border-black">Program</th>
                {myAuthorityDetails?.is_only_engg && <>
                  <th className="px-4 py-3 border border-black">University</th>
                  <th className="px-4 py-3 border border-black">Department</th>
                </>}
                <th className="px-3 py-3 border border-black text-center w-12">SL.</th>
                <th className="px-4 py-3 border border-black">Subject</th>
                <th className="px-4 py-3 border border-black">Instructor</th>
                <th className="px-4 py-3 border border-black text-center">Approval Status</th>
                <th className="px-4 py-3 border border-black text-center">Cadets</th>
                <th className="px-4 py-3 border border-black text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {(() => {
                let globalIdx = 0;
                const totalCols = myAuthorityDetails?.is_only_engg ? 11 : 9;

                // ── Engineering view (is_only_engg) ────────────────────────────────
                if (myAuthorityDetails?.is_only_engg) {
                  if (enggCourseTree.length === 0) {
                    return <tr><td colSpan={totalCols} className="px-4 py-10 text-center text-gray-500 italic">No results found</td></tr>;
                  }
                  return enggCourseTree.map((cNode: any) => {
                    return cNode.semesters.map((sNode: any, sIdx: number) => {
                      const effCRowSpan = cNode.cRowSpan;
                      const effSRowSpan = sNode.sRowSpan;
                      return sNode.programs.map((pNode: any, pIdx: number) => {
                        const isFirstInCourse = sIdx === 0 && pIdx === 0;
                        const isFirstInSem = pIdx === 0;
                        const progName = pNode.changeableProgram?.name ?? pNode.changeableProgram?.short_name ?? pNode.program?.name ?? '—';

                        return pNode.universities.map((uNode: any, uIdx: number) => {
                          const isFirstInProg = uIdx === 0;
                          return uNode.departments.map((dNode: any, dIdx: number) => {
                            const isFirstInUniv = dIdx === 0;
                            return dNode.results.map((r: any, rIdx: number) => {
                              globalIdx++;
                              const isFirstInDept = rIdx === 0;
                              const isPlaceholder = !!(r as any)._is_placeholder;
                              const subjectModule = r.subject?.module || r.subject || r.atw_subject_module;
                              const stats = r.approval_stats;
                              const sa = (r as any).subject_approval;

                              const isWaiting = isPlaceholder;

                              return (
                                <tr key={r.id} className={`transition-colors group ${isWaiting ? 'cursor-default' : 'hover:bg-blue-50/20 cursor-pointer'}`} onClick={() => !isWaiting && can('view') && handleViewResult(r.id)}>
                                  {isFirstInCourse && isFirstInProg && isFirstInUniv && isFirstInDept && (
                                    <td rowSpan={effCRowSpan} className="px-4 py-3 border border-black font-bold text-gray-900 align-middle bg-white cursor-default" onClick={e => e.stopPropagation()}>{cNode.course?.name || '—'}</td>
                                  )}
                                  {isFirstInSem && isFirstInProg && isFirstInUniv && isFirstInDept && (
                                    <td rowSpan={effSRowSpan} className="px-4 py-3 border border-black font-medium text-gray-700 align-middle bg-white cursor-default" onClick={e => e.stopPropagation()}>{sNode.semester?.name || '—'}</td>
                                  )}
                                  {isFirstInProg && isFirstInUniv && isFirstInDept && (
                                    <td rowSpan={pNode.pRowSpan} className="px-4 py-3 border border-black font-bold text-gray-900 align-middle bg-white cursor-default" onClick={e => e.stopPropagation()}>{progName}</td>
                                  )}
                                  {isFirstInUniv && isFirstInDept && (
                                    <td rowSpan={uNode.uRowSpan} className="px-4 py-3 border border-black text-gray-700 align-middle bg-white cursor-default" onClick={e => e.stopPropagation()}>{uNode.university?.name ?? '—'}</td>
                                  )}
                                  {isFirstInDept && (
                                    <td rowSpan={dNode.dRowSpan} className="px-4 py-3 border border-black text-gray-700 align-middle bg-white cursor-default" onClick={e => e.stopPropagation()}>{dNode.department?.name ?? '—'}</td>
                                  )}
                                  <td className="px-3 py-3 border border-black text-center font-medium text-gray-500">{globalIdx}</td>
                                  <td className="px-4 py-3 border border-black group-hover:text-blue-700">
                                    <div className="flex flex-col">
                                      <span className="font-bold">{subjectModule?.subject_name || 'N/A'}</span>
                                      <span className="text-xs text-gray-500 font-mono">{subjectModule?.subject_code || ''}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 border border-black text-gray-700">
                                    {r.instructor ? <span className="font-medium">{r.instructor.rank?.short_name && <>{r.instructor.rank.short_name} </>}{r.instructor.name}</span> : '—'}
                                  </td>
                                  <td className="px-4 py-3 border border-black text-center align-middle">
                                    {(() => {
                                      if (isPlaceholder) {
                                        if (myAuthorityDetails?.is_initial_forward) {
                                          const ctxFwd = (a: any) => a.course_id === r.course_id && a.semester_id === r.semester_id && a.program_id === r.program_id && a.subject_id === r.atw_subject_id;
                                          if (subjectApprovals.find((a: any) => ctxFwd(a) && a.authority_id === myAuthorityDetails.id && a.status === 'pending')) {
                                            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">⏳ Pending for My Approval</span>;
                                          }
                                        }
                                        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">Waiting for Result</span>;
                                      }
                                      const subjAppContext = (a: any) =>
                                        a.course_id === r.course_id &&
                                        a.semester_id === r.semester_id &&
                                        a.program_id === r.program_id &&
                                        a.subject_id === r.atw_subject_id;
                                      const latestSubjApproval = [...subjectApprovals].filter(subjAppContext).sort((a, b) => b.id - a.id)[0];
                                      const currentStepAuth = latestSubjApproval?.authority_id
                                        ? approvalAuthorities.find(a => a.id === latestSubjApproval.authority_id)
                                        : null;
                                      const stepName = currentStepAuth?.role?.name || null;
                                      if (myAuthorityDetails && user) {
                                        const contextMatches = (a: any) =>
                                          a.course_id === r.course_id &&
                                          a.semester_id === r.semester_id &&
                                          a.program_id === r.program_id &&
                                          a.subject_id === r.atw_subject_id;
                                        const mySubApp = subjectApprovals.find((a: any) => contextMatches(a) && a.authority_id === myAuthorityDetails.id);
                                        const iForwarded = subjectApprovals.find((a: any) => contextMatches(a) && Number(a.forwarded_by) === Number(user.id));
                                        if (mySubApp) {
                                          if (mySubApp.status === 'approved') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>;
                                          if (mySubApp.status === 'rejected') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">✗ Rejected</span>;
                                          if (mySubApp.status === 'pending' && sa?.authority_id === myAuthorityDetails.id) {
                                            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">⏳ Pending for My Approval</span>;
                                          }
                                          return (
                                            <div className="flex flex-col items-center gap-0.5">
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>
                                              {sa?.status === 'pending' && stepName && <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-tighter">Stage: {stepName}</span>}
                                            </div>
                                          );
                                        }
                                        if (iForwarded) {
                                          return (
                                            <div className="flex flex-col items-center gap-0.5">
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>
                                              {sa?.status === 'pending' && stepName && <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-tighter">Stage: {stepName}</span>}
                                            </div>
                                          );
                                        }
                                        if (myAuthorityDetails.is_initial_cadet_approve) {
                                          if (stats?.is_result_forwarded) {
                                            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Forwarded</span>;
                                          }
                                          if (stats?.total > 0 && stats?.approved === stats?.total) {
                                            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>;
                                          }
                                          if (stats?.has_marks) {
                                            return (
                                              <div className="flex flex-col items-center gap-0.5">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">⏳ Pending ({stats.approved}/{stats.total})</span>
                                              </div>
                                            );
                                          }
                                          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">⏳ Waiting for Result</span>;
                                        }
                                        if (myAuthorityDetails.is_initial_forward && sa?.status === 'pending' && sa?.authority_id === myAuthorityDetails.id) {
                                          return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">⏳ Pending for My Approval</span>;
                                        }
                                        return (
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">⏳ Waiting for Result</span>
                                            {stepName && <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-tighter">Stage: {stepName}</span>}
                                          </div>
                                        );
                                      }
                                      if (sa?.status === 'approved') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>;
                                      if (sa?.status === 'rejected') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">✗ Rejected</span>;
                                      if (sa?.status === 'pending') {
                                        return (
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">⏳ Waiting for Result</span>
                                            {stepName && <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-tighter">Stage: {stepName}</span>}
                                          </div>
                                        );
                                      }
                                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">Not Forwarded</span>;
                                    })()}
                                  </td>
                                  <td className="px-4 py-3 border border-black text-center font-bold text-blue-700 align-middle">{r.result_getting_cadets?.length ?? 0}/{(() => { const csKey = (r as any).system_programs_changeable_semester_id ?? (r as any).subject_group?.system_programs_changeable_semester_id ?? 'base'; return cadetCounts[`${r.course_id}-${r.semester_id}-${r.program_id}-${csKey}`] ?? 0; })()}</td>
                                  <td className="px-4 py-3 border border-black text-center no-print" onClick={e => e.stopPropagation()}>
                                    {!isWaiting && can('view') && (
                                      <button onClick={() => handleViewResult(r.id)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="View Result">
                                        <Icon icon="hugeicons:view" className="w-4 h-4" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            });
                          });
                        });
                      });
                    });
                  });
                }

                // ── Normal view ─────────────────────────────────────────────────────
                if (courseTree.length === 0) {
                  return <tr><td colSpan={totalCols} className="px-4 py-10 text-center text-gray-500 italic">No results found</td></tr>;
                }
                return courseTree.map((cNode: any) => {
                  // Compute effective row spans accounting for waiting programs (1 row each)
                  const getEffPRows = (p: any) => {
                    if (!lowerLevelHasInitFwd || !myAuthorityDetails) return p.pRowSpan;
                    const fwd = programApprovals.some((pa: any) =>
                      pa.course_id === p.results[0]?.course_id &&
                      pa.semester_id === p.results[0]?.semester_id &&
                      pa.program_id === p.program?.id &&
                      pa.authority_id === myAuthorityDetails.id
                    );
                    return fwd ? p.pRowSpan : 1;
                  };
                  return cNode.semesters.map((sNode: any, sIdx: number) => {
                    const effSRowSpan = sNode.programs.reduce((s: number, p: any) => s + getEffPRows(p), 0);
                    const effCRowSpan = cNode.semesters.reduce((s: number, sn: any) =>
                      s + sn.programs.reduce((ps: number, p: any) => ps + getEffPRows(p), 0), 0);

                    return sNode.programs.map((pNode: any, pIdx: number) => {
                      const isFirstInCourse = sIdx === 0 && pIdx === 0;
                      const isFirstInSem = pIdx === 0;

                      // Program-level forwarding gate when lower level has init_fwd
                      const isProgramForwarded = !lowerLevelHasInitFwd || !myAuthorityDetails ||
                        programApprovals.some((pa: any) =>
                          pa.course_id === pNode.results[0]?.course_id &&
                          pa.semester_id === pNode.results[0]?.semester_id &&
                          pa.program_id === pNode.program?.id &&
                          pa.authority_id === myAuthorityDetails.id
                        );

                      // Per-program forward logic
                      const firstResProg = pNode.results[0];
                      const pPA = programApprovals.filter((pa: any) =>
                        pa.course_id === firstResProg?.course_id &&
                        pa.semester_id === firstResProg?.semester_id &&
                        pa.program_id === firstResProg?.program_id
                      );
                      const pAlreadyApproved = higherAuthority
                        ? pPA.some((pa: any) => pa.status === 'approved' && pa.authority_id === higherAuthority.id)
                        : pPA.some((pa: any) => pa.status === 'approved' && pa.authority_id === myAuthorityDetails?.id);
                      const pAlreadyForwardedByMe = pPA.some((pa: any) => pa.status === 'pending' && pa.forwarded_by === (user as any)?.id);
                      const approvedByLabel = higherAuthority?.role?.name ?? finalAuthority?.role?.name ?? 'Final Authority';
                      const myPA = pPA.find((pa: any) => pa.authority_id === myAuthorityDetails?.id);
                      const canInitPF = (myAuthorityDetails?.is_initial_cadet_approve || myAuthorityDetails?.is_initial_forward) && pPA.length === 0;
                      const isMyProgTurn = canInitPF || myPA?.status === 'pending';
                      const realResultsProg = pNode.results.filter((res: any) => !(res as any)._is_placeholder);
                      const fwdSubjCount = realResultsProg.filter((res: any) => !!(res as any).subject_approval).length;
                      const totalSubjCount = pNode.results.length; // includes placeholders (Waiting for Result subjects)
                      const allSubjFwd = realResultsProg.length > 0 && fwdSubjCount === realResultsProg.length;
                      // Count subjects approved (status='approved') by MY authority specifically (only non-placeholder)
                      const myApprovedSubjCount = realResultsProg.filter((res: any) =>
                        subjectApprovals.some((sa: any) =>
                          sa.course_id === res.course_id &&
                          sa.semester_id === res.semester_id &&
                          sa.program_id === res.program_id &&
                          sa.subject_id === res.atw_subject_id &&
                          sa.authority_id === myAuthorityDetails?.id &&
                          sa.status === 'approved'
                        )
                      ).length;
                      // All approved only when count matches ALL subjects (including placeholders that must be 0)
                      const allSubjApprovedByMe = totalSubjCount > 0 && myApprovedSubjCount === totalSubjCount;

                      if (!isProgramForwarded) {
                        globalIdx++;
                        return (
                          <tr key={`waiting-prog-${pNode.program?.id}`} className="bg-yellow-50/30">
                            {isFirstInCourse && (
                              <td rowSpan={effCRowSpan} className="px-4 py-3 border border-black text-gray-900 font-medium align-middle bg-white cursor-default">
                                {cNode.course?.name || "—"}
                              </td>
                            )}
                            {isFirstInSem && (
                              <td rowSpan={effSRowSpan} className="px-4 py-3 border border-black text-gray-700 font-medium align-middle bg-white cursor-default">
                                {sNode.semester?.name || "—"}
                              </td>
                            )}
                            <td className="px-4 py-3 border border-black text-gray-900 font-medium align-middle bg-white">
                              {pNode.program?.name || "—"}
                            </td>
                            <td colSpan={6} className="px-4 py-3 border border-black">
                              <div className="flex flex-col items-center justify-center py-6 rounded-lg border border-dashed border-yellow-300 bg-yellow-50 gap-2">
                                <Icon icon="hugeicons:clock-01" className="w-6 h-6 text-yellow-500" />
                                <p className="text-sm font-semibold text-yellow-700">Waiting for Result</p>
                                <p className="text-xs text-yellow-600">This program has not been forwarded to your authority level yet.</p>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return pNode.results.map((r: any, rIdx: number) => {
                        globalIdx++;
                        const isFirstInCourse2 = sIdx === 0 && pIdx === 0 && rIdx === 0;
                        const isFirstInSem2 = pIdx === 0 && rIdx === 0;
                        const isFirstInProg = rIdx === 0;

                        const subjectModule = r.subject?.module || r.subject || r.atw_subject_module;
                        const stats = r.approval_stats;
                        const sa = (r as any).subject_approval;
                        const isPlaceholder = !!(r as any)._is_placeholder;

                        // Subject is approved from current user's perspective
                        const isSubjectApproved = (() => {
                          if (myAuthorityDetails?.is_initial_cadet_approve) {
                            return stats?.total > 0 && stats?.approved === stats?.total;
                          }
                          if (myAuthorityDetails) {
                            const mySubApp = subjectApprovals.find((a: any) =>
                              a.course_id === r.course_id &&
                              a.semester_id === r.semester_id &&
                              a.program_id === r.program_id &&
                              a.subject_id === r.atw_subject_id &&
                              a.authority_id === myAuthorityDetails.id
                            );
                            return mySubApp?.status === 'approved';
                          }
                          return sa?.status === 'approved';
                        })();

                        // Determine if this row is in "Waiting for Result" state (not clickable)
                        const isWaitingForResult = (() => {
                          if (isPlaceholder) {
                            if (myAuthorityDetails?.is_initial_forward) {
                              const ctxMatch = (a: any) =>
                                a.course_id === r.course_id && a.semester_id === r.semester_id &&
                                a.program_id === r.program_id && a.subject_id === r.atw_subject_id;
                              if (subjectApprovals.some((a: any) => ctxMatch(a) && a.authority_id === myAuthorityDetails.id && a.status === 'pending')) return false;
                            }
                            return true;
                          }
                          if (myAuthorityDetails && user) {
                            const ctxMatch = (a: any) =>
                              a.course_id === r.course_id &&
                              a.semester_id === r.semester_id &&
                              a.program_id === r.program_id &&
                              a.subject_id === r.atw_subject_id;
                            const mySubApp = subjectApprovals.find((a: any) =>
                              ctxMatch(a) && a.authority_id === myAuthorityDetails.id
                            );
                            const iForwarded = subjectApprovals.find((a: any) =>
                              ctxMatch(a) && Number(a.forwarded_by) === Number(user.id)
                            );
                            if (mySubApp || iForwarded) return false;
                            if (myAuthorityDetails.is_initial_forward && sa?.status === 'pending' && sa?.authority_id === myAuthorityDetails.id) return false;
                            if (myAuthorityDetails.is_initial_cadet_approve &&
                              (stats?.has_marks || (stats?.total > 0 && stats?.approved === stats?.total))) return false;
                            return true;
                          }
                          return false;
                        })();

                        return (
                          <tr key={r.id} className={`transition-colors group ${isWaitingForResult ? 'cursor-default' : 'hover:bg-blue-50/20 cursor-pointer'}`} onClick={() => !isWaitingForResult && can('view') && handleViewResult(r.id)}>
                            {isFirstInCourse2 && (
                              <td rowSpan={effCRowSpan} className="px-4 py-3 border border-black text-gray-900 font-bold align-middle bg-white cursor-default" onClick={(e) => e.stopPropagation()}>
                                {cNode.course?.name || "—"}
                              </td>
                            )}

                            {isFirstInSem2 && (
                              <td rowSpan={effSRowSpan} className="px-4 py-3 border border-black text-gray-700 font-medium align-middle bg-white cursor-default" onClick={(e) => e.stopPropagation()}>
                                {sNode.semester?.name || "—"}
                              </td>
                            )}

                            {isFirstInProg && (
                              <td rowSpan={pNode.pRowSpan} className="px-4 py-3 border border-black text-gray-900 font-bold align-middle bg-white cursor-default" onClick={(e) => e.stopPropagation()}>
                                {pNode.program?.name || "—"}
                              </td>
                            )}
                            <td className="px-3 py-3 border border-black text-center font-medium text-gray-500 group-hover:text-blue-600">{globalIdx}</td>
                            <td className="px-4 py-3 border border-black group-hover:text-blue-700">
                              <div className="flex flex-col">
                                <span className="font-bold">{subjectModule?.subject_name || "N/A"}</span>
                                <span className="text-xs text-gray-500 font-mono">{subjectModule?.subject_code || ""}</span>
                              </div>
                            </td>

                            <td className="px-4 py-3 border border-black text-gray-700">
                              {r.instructor ? (
                                <span className="font-medium">
                                  {r.instructor.rank?.short_name && <>{r.instructor.rank.short_name} </>}
                                  {r.instructor.name}
                                </span>
                              ) : "—"}
                            </td>

                            <td className="px-4 py-3 border border-black text-center align-middle">
                              {(() => {
                                if (isPlaceholder) {
                                  if (myAuthorityDetails?.is_initial_forward) {
                                    const ctxFwd = (a: any) => a.course_id === r.course_id && a.semester_id === r.semester_id && a.program_id === r.program_id && a.subject_id === r.atw_subject_id;
                                    if (subjectApprovals.find((a: any) => ctxFwd(a) && a.authority_id === myAuthorityDetails.id && a.status === 'pending')) {
                                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">⏳ Pending for My Approval</span>;
                                    }
                                  }
                                  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">Waiting for Result</span>;
                                }

                                // Find the latest subject approval entry for this subject to get current stage
                                const subjAppContext = (a: any) =>
                                  a.course_id === r.course_id &&
                                  a.semester_id === r.semester_id &&
                                  a.program_id === r.program_id &&
                                  a.subject_id === r.atw_subject_id;
                                const latestSubjApproval = [...subjectApprovals]
                                  .filter(subjAppContext)
                                  .sort((a, b) => b.id - a.id)[0];
                                const currentStepAuth = latestSubjApproval?.authority_id
                                  ? approvalAuthorities.find(a => a.id === latestSubjApproval.authority_id)
                                  : null;
                                const stepName = currentStepAuth?.role?.name || null;

                                // NEW Logic based on user request
                                if (myAuthorityDetails && user) {
                                  const contextMatches = (a: any) =>
                                    a.course_id === r.course_id &&
                                    a.semester_id === r.semester_id &&
                                    a.program_id === r.program_id &&
                                    a.subject_id === r.atw_subject_id;

                                  const mySubApp = subjectApprovals.find(a =>
                                    contextMatches(a) && a.authority_id === myAuthorityDetails.id
                                  );

                                  const iForwarded = subjectApprovals.find(a =>
                                    contextMatches(a) && Number(a.forwarded_by) === Number(user.id)
                                  );

                                  if (mySubApp) {
                                    if (mySubApp.status === 'approved') {
                                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>;
                                    }
                                    if (mySubApp.status === 'rejected') {
                                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">✗ Rejected</span>;
                                    }
                                    if (mySubApp.status === 'pending' && sa?.authority_id === myAuthorityDetails.id) {
                                      return (
                                        <div className="flex flex-col items-center gap-0.5">
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">⏳ Pending for My Approval</span>
                                        </div>
                                      );
                                    }
                                    // If record exists but it's not currently with me
                                    return (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>
                                        {sa?.status === 'pending' && stepName && (
                                          <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-tighter">Stage: {stepName}</span>
                                        )}
                                      </div>
                                    );
                                  }
                                  else if (iForwarded) {
                                    // I forwarded it, show who it's with now
                                    return (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>
                                        {sa?.status === 'pending' && stepName && (
                                          <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-tighter">Stage: {stepName}</span>
                                        )}
                                      </div>
                                    );
                                  } else {
                                    // For initial approvers, also check cadet-level approval stats
                                    if (myAuthorityDetails.is_initial_cadet_approve) {
                                      if (stats?.is_result_forwarded) {
                                        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Forwarded</span>;
                                      }
                                      if (stats?.total > 0 && stats?.approved === stats?.total) {
                                        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>;
                                      }
                                      if (stats?.has_marks) {
                                        return (
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">⏳ Pending ({stats.approved}/{stats.total})</span>
                                          </div>
                                        );
                                      }
                                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">⏳ Waiting for Result</span>;
                                    }
                                    if (myAuthorityDetails.is_initial_forward && sa?.status === 'pending' && sa?.authority_id === myAuthorityDetails.id) {
                                      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">⏳ Pending for My Approval</span>;
                                    }
                                    // Record doesn't exist for my authority yet
                                    return (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">⏳ Waiting for Result</span>
                                        {stepName && (
                                          <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-tighter">Stage: {stepName}</span>
                                        )}
                                      </div>
                                    );
                                  }
                                }
                                if (sa?.status === 'approved') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>;
                                if (sa?.status === 'rejected') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">✗ Rejected</span>;
                                if (sa?.status === 'pending') {
                                  return (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">⏳ Waiting for Result</span>
                                      {stepName && <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-tighter">Stage: {stepName}</span>}
                                    </div>
                                  );
                                }

                                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">Not Forwarded</span>;
                              })()}
                            </td>

                            {isFirstInProg && (
                              <td rowSpan={pNode.pRowSpan} className="px-4 py-3 border border-black text-center font-bold text-blue-700 align-middle bg-white cursor-default" onClick={(e) => e.stopPropagation()}>
                                {`${r.result_getting_cadets?.length ?? 0}/${(() => { const csKey = (r as any).system_programs_changeable_semester_id ?? (r as any).subject_group?.system_programs_changeable_semester_id ?? 'base'; return cadetCounts[`${r.course_id}-${r.semester_id}-${r.program_id}-${csKey}`] ?? 0; })()}`}
                              </td>
                            )}
                            {isFirstInProg && (
                              <td rowSpan={pNode.pRowSpan} className="px-4 py-3 border border-black text-center cursor-default align-middle no-print" onClick={(e) => e.stopPropagation()}>
                                <div className="flex flex-col items-center gap-1">
                                  {pAlreadyApproved ? (
                                    <button disabled title={`Approved by ${approvedByLabel}`} className="flex items-center gap-1 text-green-600 cursor-default">
                                      <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5" />
                                      <span className="text-[10px] font-medium">{approvedByLabel}</span>
                                    </button>
                                  ) : pAlreadyForwardedByMe ? (
                                    <button disabled title={`Awaiting ${higherAuthority?.role?.name} Approval`} className="flex items-center gap-1 text-orange-500 cursor-default">
                                      <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5" />
                                      <span className="text-[10px] font-medium">Forwarded</span>
                                    </button>
                                  ) : (() => {
                                    const isInitFwd = !!myAuthorityDetails?.is_initial_forward;
                                    const isProgramFwd = !!(myAuthorityDetails as any)?.is_program_forward;

                                    if (isInitFwd) {
                                      // is_initial_forward branch — existing logic
                                      const subjsReady = allSubjApprovedByMe;
                                      const canForward = isMyProgTurn && subjsReady;
                                      const disabledTitle = !isMyProgTurn
                                        ? 'Not your turn'
                                        : !allSubjApprovedByMe
                                          ? `All subjects must be approved by you first (${myApprovedSubjCount}/${totalSubjCount})`
                                          : `Forward Program`;
                                      return (
                                        <button
                                          onClick={() => canForward && handleProgramForward(pNode)}
                                          disabled={!canForward}
                                          title={canForward ? `Forward Program` : disabledTitle}
                                          className={`rounded-lg transition-colors ${canForward ? 'text-blue-600' : 'text-gray-300 cursor-not-allowed'}`}
                                        >
                                          <Icon icon="hugeicons:share-04" className="w-5 h-5" />
                                        </button>
                                      );
                                    } else if (isProgramFwd) {
                                      // is_program_forward branch — different route (console for now)
                                      const subjsReady = !lowerLevelHasInitFwd || allSubjFwd;
                                      const canForward = isMyProgTurn && subjsReady;
                                      const disabledTitle = !isMyProgTurn
                                        ? 'Not your turn'
                                        : lowerLevelHasInitFwd && !allSubjFwd
                                          ? `All subjects must be forwarded first (${fwdSubjCount}/${totalSubjCount})`
                                          : `Forward Program`;
                                      return (
                                        <button
                                          onClick={() => canForward && handleProgramForward(pNode)}
                                          disabled={!canForward}
                                          title={canForward ? `Forward Program` : disabledTitle}
                                          className={`rounded-lg transition-colors ${canForward ? 'text-blue-600' : 'text-gray-300 cursor-not-allowed'}`}
                                        >
                                          <Icon icon="hugeicons:share-04" className="w-5 h-5" />
                                        </button>
                                      );
                                    } else {
                                      // No forward authority — button disabled
                                      return (
                                        <button
                                          disabled
                                          title="No forward permission"
                                          className="rounded-lg text-gray-300 cursor-not-allowed"
                                        >
                                          <Icon icon="hugeicons:share-04" className="w-5 h-5" />
                                        </button>
                                      );
                                    }
                                  })()}
                                  <span className="text-[10px] text-gray-400 font-medium">{myAuthorityDetails?.is_initial_forward ? `${myApprovedSubjCount}/${totalSubjCount}` : `${fwdSubjCount}/${totalSubjCount}`}</span>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      });
                    });
                  });
                });
              })()}
            </tbody>
          </table>
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
          <div className="flex items-center gap-1 mb-4">
            <div className="flex items-center justify-center w-12 h-12">
              <Image
                src="/images/logo/logo.png"
                alt="BAFA Logo"
                width={50}
                height={50}
                className="dark:hidden"
              />
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

          {myAuthorityDetails && (
            <div className="flex justify-between items-center gap-2">
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Your Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{myAuthorityDetails.role.name}</span>
                </div>
              </div>
              <div>
                <Icon icon="hugeicons:arrow-right-02" className="w-5 h-5 text-blue-600 inline-block mr-2" />
              </div>
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Next Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{higherAuthority?.role?.name}</span>
                </div>
              </div>
            </div>
          )}

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
        isOpen={programForwardModal.open}
        onClose={() => setProgramForwardModal((prev) => ({ ...prev, open: false }))}
        showCloseButton
        className="max-w-lg"
      >
        <div className="p-6">
          <div className="flex items-center gap-1 mb-4">
            <div className="flex items-center justify-center w-12 h-12">
              <Image
                src="/images/logo/logo.png"
                alt="BAFA Logo"
                width={50}
                height={50}
                className="dark:hidden"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Forward Program for Approval</h2>
              <p className="text-xs text-gray-500">Forward entire program result to higher authority</p>
            </div>
          </div>

          {programForwardModal.programNode && (() => {
            const firstRes = programForwardModal.programNode.results[0];
            const rows: [string, string][] = [
              ["Course", firstRes?.course?.name || "—"],
              ["Semester", firstRes?.semester?.name || "—"],
              ["Program", programForwardModal.programNode.program?.name || "—"],
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

          {myAuthorityDetails && (
            <div className="flex justify-between items-center gap-2 mb-5">
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Your Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{myAuthorityDetails.role.name}</span>
                </div>
              </div>
              <div>
                <Icon icon="hugeicons:arrow-right-02" className="w-5 h-5 text-blue-600 inline-block mr-2" />
              </div>
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-1">Next Authority Level</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{higherAuthority?.role?.name}</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-5">
            This will forward the entire program result to the higher authority for final approval. All approved subjects within this program will be marked as program-forwarded.
          </p>

          {programForwardModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {programForwardModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            <button
              onClick={() => setProgramForwardModal((prev) => ({ ...prev, open: false }))}
              disabled={programForwardModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmProgramForward}
              disabled={programForwardModal.loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
            >
              {programForwardModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
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

      {/* Reject Down Modal */}
      <Modal
        isOpen={rejectDownModal.open}
        onClose={() => setRejectDownModal(prev => ({ ...prev, open: false }))}
        showCloseButton
        className="max-w-md"
      >
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Icon icon="hugeicons:alert-02" className="w-5 h-5 text-orange-500" />
            Reject to Lower Authority
          </h2>
          {rejectDownModal.item && (
            <p className="text-sm text-gray-600 mb-4">
              Cadet: <span className="font-medium text-gray-900">{rejectDownModal.item.cadet_name}</span>
              {rejectDownModal.item.cadet_bd_no && rejectDownModal.item.cadet_bd_no !== '—' && (
                <span className="ml-1 text-gray-400">({rejectDownModal.item.cadet_bd_no})</span>
              )}
            </p>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectDownModal.reason}
              onChange={e => setRejectDownModal(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
              rows={3}
              placeholder="Enter reason for rejection..."
            />
          </div>
          {rejectDownModal.error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {rejectDownModal.error}
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setRejectDownModal(prev => ({ ...prev, open: false }))}
              disabled={rejectDownModal.loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectDown}
              disabled={rejectDownModal.loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
            >
              {rejectDownModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              Confirm Reject
            </button>
          </div>
        </div>
      </Modal>

      {/* Re-submit Confirmation Modal */}
      <Modal
        isOpen={resubmitModal.open}
        onClose={() => !resubmitModal.loading && setResubmitModal({ open: false, item: null, loading: false, error: "" })}
        showCloseButton
        className="max-w-md"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 uppercase">Confirm Re-submission</h2>
            <div className="h-1 w-20 bg-green-500 rounded-full mt-2"></div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
            <p className="text-sm text-center text-gray-600">
              Are you sure you have updated the marks for<br />
              <span className="font-bold text-gray-900">{resubmitModal.item?.cadet_name}</span>
              {resubmitModal.item?.cadet_bd_no && <span className="text-gray-400 ml-1">({resubmitModal.item?.cadet_bd_no})</span>}?
            </p>
          </div>

          {resubmitModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {resubmitModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setResubmitModal({ open: false, item: null, loading: false, error: "" })}
              disabled={resubmitModal.loading}
              className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmResubmit}
              disabled={resubmitModal.loading}
              className="px-8 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2"
            >
              {resubmitModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              Confirm & Re-submit
            </button>
          </div>
        </div>
      </Modal>

      {/* View Rejection Details Modal */}
      <Modal
        isOpen={viewRejectedModal.open}
        onClose={() => setViewRejectedModal({ open: false, item: null })}
        showCloseButton
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2"><FullLogo /></div>
            <h1 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Rejection Details</h1>
            <div className="h-1 w-20 bg-orange-500 rounded-full mx-auto mt-2"></div>
          </div>

          {viewRejectedModal.item && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Cadet: <span className="font-bold text-gray-900">{viewRejectedModal.item.cadet_name} ({viewRejectedModal.item.cadet_bd_no})</span></p>
                  <p className="text-sm text-gray-600">Rank/Branch: <span className="font-medium text-gray-800">{viewRejectedModal.item.cadet_rank} / {viewRejectedModal.item.cadet_branch}</span></p>
                  <p className="text-sm text-gray-600">Subject: <span className="font-bold text-gray-900">{viewRejectedModal.item.subject_name} ({viewRejectedModal.item.subject_code})</span></p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Rejected By: <span className="font-bold text-red-600">{viewRejectedModal.item.rejected_by}</span></p>
                  <p className="text-sm text-gray-600">Date: <span className="font-medium text-gray-800">{viewRejectedModal.item.rejected_at ? new Date(viewRejectedModal.item.rejected_at).toLocaleString() : '—'}</span></p>
                  <p className="text-sm text-gray-600">Status: <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">{viewRejectedModal.item.message}</span></p>
                </div>
                <div className="col-span-full mt-2 border-t border-orange-200 pt-2">
                  <p className="text-sm font-bold text-gray-700 mb-1">Rejection Reason:</p>
                  <div className="p-3 bg-white rounded-lg border border-orange-200 text-sm text-red-700 italic leading-relaxed shadow-sm">
                    {viewRejectedModal.item.rejected_reason}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                <Icon icon="hugeicons:information-circle" className="w-5 h-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800 leading-relaxed">
                  To view the full mark sheet and individual components for this result, please click the <strong>View Result</strong> icon in the actions column of the rejected cadets table.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setViewRejectedModal({ open: false, item: null })}
              className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
            >
              Close Details
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
