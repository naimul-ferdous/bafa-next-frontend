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
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Modal } from "@/components/ui/modal";
import { useCan } from "@/context/PagePermissionsContext";
import { cadetService } from "@/libs/services/cadetService";
import { atwInstructorAssignSubjectService } from "@/libs/services/atwInstructorAssignSubjectService";
import type { AtwInstructorAssignSubject } from "@/libs/types/user";

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
  const [instructorAssignments, setInstructorAssignments] = useState<AtwInstructorAssignSubject[]>([]);

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
        // Fetch both results and assignments in parallel
        const [response, assignments] = await Promise.all([
          atwResultService.getAllResults({
            page: 1,
            per_page: 999,
            search: searchTerm || undefined,
            instructor_id: instructorId,
          }),
          instructorId ? atwInstructorAssignSubjectService.getByInstructor(instructorId) : Promise.resolve([]),
        ]);

        setInstructorAssignments(assignments.filter((a: AtwInstructorAssignSubject) => a.is_active));

        // Build a set of existing result keys (course-semester-program-subject)
        const resultKeys = new Set<string>();
        response.data.forEach((r: any) => {
          resultKeys.add(`${r.course_id}-${r.semester_id}-${r.program_id}-${r.atw_subject_id}`);
        });

        // Create placeholder results for assignments without results
        const placeholders: any[] = [];
        assignments.filter((a: AtwInstructorAssignSubject) => a.is_active).forEach((a: AtwInstructorAssignSubject) => {
          const key = `${a.course_id}-${a.semester_id}-${a.program_id}-${a.subject_id}`;
          if (!resultKeys.has(key)) {
            placeholders.push({
              id: `placeholder-${a.id}`,
              course_id: a.course_id,
              semester_id: a.semester_id,
              program_id: a.program_id,
              atw_subject_id: a.subject_id,
              instructor_id: a.instructor_id,
              course: a.course,
              semester: a.semester,
              program: a.program,
              subject: { module: a.subject, subject_name: a.subject?.subject_name, subject_code: a.subject?.subject_code },
              atw_subject_module: a.subject,
              result_getting_cadets: [],
              approval_stats: null,
              subject_approval: null,
              _is_placeholder: true,
            });
          }
        });

        const mergedResults = [...response.data, ...placeholders];
        setResults(mergedResults);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: mergedResults.length,
          total: mergedResults.length,
          from: mergedResults.length > 0 ? 1 : 0,
          to: mergedResults.length,
        });

        // Fetch live cadet counts
        setLoadingCadets(true);
        const counts: Record<string, number> = {};
        const uniqueContexts = new Set<string>();
        mergedResults.forEach((r: any) => {
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
        // Admin view: fetch all results AND all assignments in parallel
        const [response, assignResponse] = await Promise.all([
          atwResultService.getAllResults({
            page: 1,
            per_page: 999,
            search: searchTerm || undefined,
          }),
          atwInstructorAssignSubjectService.getAll({ per_page: 999, is_active: 1 }),
        ]);

        // Build set of existing result keys
        const resultKeys = new Set<string>();
        response.data.forEach((r: any) => {
          resultKeys.add(`${r.course_id}-${r.semester_id}-${r.program_id}-${r.atw_subject_id}`);
        });

        // Create placeholder results for assignments without results
        const placeholders: any[] = [];
        (assignResponse.data || []).forEach((a: AtwInstructorAssignSubject) => {
          const key = `${a.course_id}-${a.semester_id}-${a.program_id}-${a.subject_id}`;
          if (!resultKeys.has(key)) {
            resultKeys.add(key); // prevent duplicates from multiple instructors
            placeholders.push({
              id: `placeholder-${a.id}`,
              course_id: a.course_id,
              semester_id: a.semester_id,
              program_id: a.program_id,
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
              _is_placeholder: true,
            });
          }
        });

        const mergedResults = [...response.data, ...placeholders];
        setResults(mergedResults);

        // Fetch live cadet counts for admin too
        setLoadingCadets(true);
        const counts: Record<string, number> = {};
        const uniqueContexts = new Set<string>();
        mergedResults.forEach((r: any) => {
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

  // ── Grouping logic (used by both instructor & admin views) ──────────
  const courseTree = useMemo(() => {
    if (results.length === 0) return [];

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
  }, [results]);

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
    setProgramForwardModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const firstRes = p.results[0];
      // Get the NEXT authority in the chain for program approval
      const nextAuthority = [...approvalAuthorities]
        .filter((a) => !a.is_initial_cadet_approve && a.is_active)
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))[0];

      await atwApprovalService.approveProgram({
        course_id: firstRes.course_id,
        semester_id: firstRes.semester_id,
        program_id: firstRes.program_id,
        status: "approved",
        authority_ids: nextAuthority ? [nextAuthority.id] : [],
      });

      setProgramForwardModal({ open: false, programNode: null, loading: false, error: "" });
      await loadResults();
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

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">ATW Results Management</h2>
      </div>

      <div className="flex flex-col items-center gap-6 mb-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-2">
            <div className="relative w-80">
              <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search results..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
            </div>
            {!isInstructor && (
              <div className="flex items-center gap-1 rounded-full p-1 border border-gray-200 no-print w-fit">
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
                <th className="px-4 py-2 border border-black text-center">Subject Approval Status</th>
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

                      // In consolidated view, each program is exactly one row
                      // So Course rowSpan is the total number of programs in that course
                      const courseProgCount = cNode.semesters.reduce((acc: number, s: any) => acc + s.programs.length, 0);
                      const semProgCount = sNode.programs.length;

                      const approvedCount = pNode.results.filter((r: any) => r.subject_approval?.status === 'approved').length;
                      const totalCount = pNode.results.length;
                      const isFullyApproved = approvedCount === totalCount && totalCount > 0;
                      const firstRes = pNode.results[0];

                      return (
                        <tr key={`${firstRes?.course_id}-${firstRes?.semester_id}-${pNode.program?.id}`} className="hover:bg-indigo-50/20 transition-colors group cursor-pointer" onClick={() => router.push(`/atw/results/course/${firstRes?.course_id}/semester/${firstRes?.semester_id}/program/${firstRes?.program_id}`)}>
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
                          <td className="px-4 py-2 border border-black font-bold text-gray-900">{pNode.program?.name || "—"}</td>
                          <td className="px-4 py-2 border border-black text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${isFullyApproved ? 'bg-gray-100 text-gray-700' : 'bg-blue-50 text-blue-700'
                                }`}>
                                {approvedCount} / {totalCount} Subjects Approved
                              </span>
                              {isFullyApproved && (
                                <span className="text-[10px] text-gray-700 font-bold uppercase tracking-tighter">Ready for Forward</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 border border-black text-center no-print">
                            <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => router.push(`/atw/results/course/${firstRes?.course_id}/semester/${firstRes?.semester_id}/program/${firstRes?.program_id}`)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="View Consolidated Result & Approve"
                              >
                                <Icon icon="hugeicons:view" className="w-5 h-5" />
                              </button>
                              {isFullyApproved && (
                                <button
                                  onClick={() => handleProgramForward(pNode)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Forward Program for Final Approval"
                                >
                                  <Icon icon="hugeicons:share-04" className="w-5 h-5" />
                                </button>
                              )}
                            </div>
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
                          const isPlaceholder = !!(r as any)._is_placeholder;

                          return (
                            <tr key={r.id} className={`hover:bg-blue-50/20 transition-colors group ${isPlaceholder ? 'cursor-default' : 'cursor-pointer'}`} onClick={() => !isPlaceholder && can('view') && handleViewResult(r.id)}>
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
                                  {r.result_getting_cadets?.filter((c: any) => c.cadet_marks && c.cadet_marks.length > 0)?.length ?? 0}/{loadingCadets ? '...' : (cadetCounts[`${r.course_id}-${r.semester_id}-${r.program_id}`] ?? 0)}
                                </span>
                              </td>

                              <td className="px-4 py-3 border border-black text-center align-middle">
                                {(() => {
                                  if (isPlaceholder) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">No Result</span>;
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
                                  {!isPlaceholder && can('view') && (
                                    <button onClick={() => handleViewResult(r.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
                                  )}
                                  {!isPlaceholder && can('edit') && (
                                    <button onClick={() => handleEditResult(r)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
                                  )}
                                  {!isPlaceholder && can('delete') && (
                                    <button onClick={() => handleDeleteResult(r)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
                                  )}
                                  {isPlaceholder && <span className="text-xs text-gray-400">—</span>}
                                  {!isPlaceholder && canInitialForward && (() => {
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
                <th className="px-4 py-3 border border-black text-center">Cadets</th>
                <th className="px-4 py-3 border border-black text-center">Approval Status</th>
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
                        const isPlaceholder = !!(r as any)._is_placeholder;
                        const cadetCount = cadetCounts[`${r.course_id}-${r.semester_id}-${r.program_id}`] ?? 0;

                        return (
                          <tr key={r.id} className={`hover:bg-blue-50/20 transition-colors group ${isPlaceholder ? 'cursor-default' : 'cursor-pointer'}`} onClick={() => !isPlaceholder && can('view') && handleViewResult(r.id)}>
                            {isFirstInCourse && (
                              <td rowSpan={cNode.cRowSpan} className="px-4 py-3 border border-black text-gray-900 font-bold align-middle bg-white cursor-default" onClick={(e) => e.stopPropagation()}>
                                {cNode.course?.name || "—"}
                              </td>
                            )}

                            {isFirstInSem && (
                              <td rowSpan={sNode.sRowSpan} className="px-4 py-3 border border-black text-gray-700 font-medium align-middle bg-white cursor-default" onClick={(e) => e.stopPropagation()}>
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

                            {isFirstInProg && (
                              <td rowSpan={pNode.pRowSpan} className="px-4 py-3 border border-black text-center font-bold text-blue-700 align-middle bg-white cursor-default" onClick={(e) => e.stopPropagation()}>
                                {loadingCadets ? (
                                  <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin mx-auto" />
                                ) : cadetCount}
                              </td>
                            )}

                            <td className="px-4 py-3 border border-black text-center align-middle">
                              {(() => {
                                if (isPlaceholder) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">Waiting for Result</span>;
                                if (sa?.status === 'approved') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">✓ Approved</span>;
                                if (sa?.status === 'rejected') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">✗ Rejected</span>;

                                // Enhanced progress tracking for intermediate steps
                                if (sa?.forwarded_by) {
                                  // If the result has been forwarded, check if there's an authority matching the forwarder
                                  const forwarderId = sa.forwarded_by;
                                  const authority = approvalAuthorities.find(a => a.user_id === forwarderId || (a.role_id && user?.roles?.some((r: any) => r.id === a.role_id)));

                                  return (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">⏳ Under Review</span>
                                      {(stats as any)?.is_result_forwarded && (
                                        <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-tighter">Approved by Step 2+</span>
                                      )}
                                    </div>
                                  );
                                }

                                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">Not Forwarded</span>;
                              })()}
                            </td>

                            <td className="px-4 py-3 border border-black text-center align-middle no-print">
                              <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {!isPlaceholder && can('view') && (
                                  <button onClick={() => handleViewResult(r.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View & Approve"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
                                )}
                                {!isPlaceholder && can('edit') && (
                                  <button onClick={() => handleEditResult(r)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
                                )}
                                {!isPlaceholder && can('delete') && (
                                  <button onClick={() => handleDeleteResult(r)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
                                )}
                                {isPlaceholder && <span className="text-xs text-gray-400">—</span>}
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
        isOpen={programForwardModal.open}
        onClose={() => setProgramForwardModal((prev) => ({ ...prev, open: false }))}
        showCloseButton
        className="max-w-lg"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <FullLogo />
            <h2 className="text-lg font-bold text-gray-900 mt-4 uppercase">Forward Program for Approval</h2>
            <div className="h-1 w-20 bg-green-500 rounded-full mt-2"></div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Course</span>
                <span className="font-bold text-gray-900">{programForwardModal.programNode?.results[0]?.course?.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Semester</span>
                <span className="font-bold text-gray-900">{programForwardModal.programNode?.results[0]?.semester?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Program</span>
                <span className="font-bold text-gray-900">{programForwardModal.programNode?.program?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
            <Icon icon="hugeicons:information-circle" className="w-5 h-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-800 leading-relaxed">
              Are you sure you want to forward the <strong>entire program result</strong> for final approval? This will mark all forwarded subjects within this program as program-approved.
            </p>
          </div>

          {programForwardModal.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
              {programForwardModal.error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setProgramForwardModal((prev) => ({ ...prev, open: false }))}
              disabled={programForwardModal.loading}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmProgramForward}
              disabled={programForwardModal.loading}
              className="px-8 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2 disabled:opacity-50"
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
    </div>
  );
}
