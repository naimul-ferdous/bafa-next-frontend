"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { userService } from "@/libs/services/userService";
import { instructorAssignWingService } from "@/libs/services/instructorAssignWingService";
import { instructorPanelService, type InstructorPanelResponse, type InstructorPanelInstructor } from "@/libs/services/instructorPanelService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { InstructorModalProvider } from "@/context/InstructorModalContext";
import InstructorFormModal from "@/components/instructors/InstructorFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import InstructorAssignWingModal from "@/components/instructors/InstructorAssignWingModal";
import InstructorAssignSubjectModal from "@/components/instructors/InstructorAssignSubjectModal";
import InstructorAssignModuleModal from "@/components/instructors/InstructorAssignModuleModal";
import InstructorAssignMissionModal from "@/components/instructors/InstructorAssignMissionModal";
import InstructorViewAssignedModulesModal from "@/components/instructors/InstructorViewAssignedModulesModal";
import InstructorAssignRoleModal from "@/components/instructors/InstructorAssignRoleModal";
import InstructorAssignAssessmentModal from "@/components/instructors/InstructorAssignAssessmentModal";
import UserAssignRankModal from "@/components/users/UserAssignRankModal";
import UserAssignExtensionModal from "@/components/users/UserAssignExtensionModal";
import UserSignatureModal from "@/components/users/UserSignatureModal";
import type { User, InstructorBiodata } from "@/libs/types/user";
import type { SystemCourse, SystemSemester } from "@/libs/types/system";
import { useAuth } from "@/context/AuthContext";
import { useCan } from "@/context/PagePermissionsContext";

function InstructorsPageContent() {
  const router = useRouter();
  const { user, userIsSystemAdmin } = useAuth();
  const can = useCan();

  const isFtw12SqnUser = !!(
    user?.roleAssignments?.some(
      (ra) => (ra.is_active) && ra.wing?.is_flying && (ra as any).sub_wing_id === 2
    ) ||
    user?.role_assignments?.some(
      (ra) => (ra.is_active) && ra.wing?.is_flying && (ra as any).sub_wing_id === 2
    )
  );

  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userContext, setUserContext] = useState<any>(null);

  // Block modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockingInstructor, setBlockingInstructor] = useState<InstructorBiodata | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);

  // Unblock modal state
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [unblockingInstructor, setUnblockingInstructor] = useState<InstructorBiodata | null>(null);
  const [unblockLoading, setUnblockLoading] = useState(false);

  // Rank assignment modal state
  const [assignRankModalOpen, setAssignRankModalOpen] = useState(false);
  const [rankingUser, setRankingUser] = useState<User | null>(null);

  // Signature modal state
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signingUser, setSigningUser] = useState<User | null>(null);

  // Role assign modal state
  const [assignRoleModalOpen, setAssignRoleModalOpen] = useState(false);
  const [assigningRoleInstructor, setAssigningRoleInstructor] = useState<InstructorBiodata | null>(null);

  const [assignWingModalOpen, setAssignWingModalOpen] = useState(false);
  const [assigningInstructor, setAssigningInstructor] = useState<InstructorBiodata | null>(null);
  const [assignSubjectModalOpen, setAssignSubjectModalOpen] = useState(false);
  const [assigningSubjectInstructor, setAssigningSubjectInstructor] = useState<InstructorBiodata | null>(null);
  const [assignModuleModalOpen, setAssignModuleModalOpen] = useState(false);
  const [assigningModuleInstructor, setAssigningModuleInstructor] = useState<InstructorBiodata | null>(null);
  const [viewModulesModalOpen, setViewModulesModalOpen] = useState(false);
  const [viewingModulesInstructor, setViewingModulesInstructor] = useState<InstructorBiodata | null>(null);
  const [assignMissionModalOpen, setAssignMissionModalOpen] = useState(false);
  const [assigningMissionInstructor, setAssigningMissionInstructor] = useState<InstructorBiodata | null>(null);

  // Assign assessment modal state
  const [assignAssessmentModalOpen, setAssignAssessmentModalOpen] = useState(false);
  const [assignAssessmentInstructor, setAssignAssessmentInstructor] = useState<InstructorBiodata | null>(null);

  // Assign extension modal state
  const [assignExtensionModalOpen, setAssignExtensionModalOpen] = useState(false);
  const [assignExtensionInstructor, setAssignExtensionInstructor] = useState<InstructorBiodata | null>(null);
  const [instructorAssignMap, setInstructorAssignMap] = useState<Record<number, Record<string, string[]>>>({});
  const [ftw11sqnMissionMap, setFtw11sqnMissionMap] = useState<Record<number, any[]>>({});
  const [ftw11sqnGroundMap, setFtw11sqnGroundMap] = useState<Record<number, any[]>>({});
  const [ftw12sqnMissionMap, setFtw12sqnMissionMap] = useState<Record<number, any[]>>({});
  const [ftw12sqnGroundMap, setFtw12sqnGroundMap] = useState<Record<number, any[]>>({});
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingAssignment, setApprovingAssignment] = useState<{ assignmentId: number; instructor: InstructorBiodata } | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });

  // Advanced filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterCourseId, setFilterCourseId] = useState<number>(0);
  const [filterSemesterId, setFilterSemesterId] = useState<number>(0);
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  const userWingIds = userContext?.wing_ids || [];
  const userSubWingIds = userContext?.subwing_ids || [];
  const userHasWingAssigned = userContext?.has_wing_assigned || false;
  const showSystemView = userIsSystemAdmin || !userHasWingAssigned;
  const isItATWingUser = !userIsSystemAdmin && user?.role_assignments?.some(ra => ra.is_active && ra.wing?.is_academy === true);
  const isItCTWingUser = !userIsSystemAdmin && user?.role_assignments?.some(ra => ra.is_active && ra.wing?.is_gst === true);
  const isItFTWingUser = userContext?.is_ftw_wing_user || false;
  const userHasFlyingWingNoSubwing = userContext?.has_flying_wing_no_subwing || false;
  const isItFtw11sqnUser = userContext?.is_11sqn_user || false;

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, per_page: perPage, search: searchTerm || undefined };
      if (filterCourseId) params.course_id = filterCourseId;
      if (filterSemesterId) params.semester_id = filterSemesterId;

      const response = await instructorPanelService.getAll(params);

      const instructorBiodatas = response.instructors.map((inst: any) => ({
        id: inst.user_id,
        user_id: inst.id,
        user: {
          id: inst.id,
          service_number: inst.service_number,
          name: inst.name,
          email: inst.email,
          is_active: inst.is_active,
          failed_login_attempts: inst.failed_login_attempts,
          rank: inst.rank,
          profile_photo: inst.profile_photo,
          signature: inst.signature,
          assign_wings: inst.assign_wings,
          atw_assigned_subjects: inst.atw_assigned_subjects,
          ctw_assigned_modules: inst.ctw_assigned_modules,
          role_assignments: inst.role_assignments,
          roleAssignments: inst.role_assignments,
        },
      }));

      setInstructors(instructorBiodatas);
      setPagination(response.pagination);
      setCourses(response.courses);
      setSemesters(response.semesters);
      setInstructorAssignMap(response.instructor_assign_map || {});
      setFtw11sqnMissionMap(response.mission_assignments || {});
      setFtw11sqnGroundMap(response.ground_assignments || {});
      setFtw12sqnMissionMap(response.mission_assignments_12sqn || {});
      setFtw12sqnGroundMap(response.ground_assignments_12sqn || {});
      setUserContext(response.user_context);
    } catch (error) {
      console.error("Failed to load instructor panel data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, filterCourseId, filterSemesterId]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  useEffect(() => {
    const handleInstructorUpdate = () => loadAllData();
    window.addEventListener('instructorUpdated', handleInstructorUpdate);
    return () => window.removeEventListener('instructorUpdated', handleInstructorUpdate);
  }, [loadAllData]);

  const handleAddInstructor = () => router.push('/users/instructors/create');
  const handleEditInstructor = (instructor: InstructorBiodata) => router.push(`/users/instructors/${instructor.id}/edit`);
  const handleViewInstructor = (instructor: InstructorBiodata) => router.push(`/users/instructors/${instructor.id}`);
  const handleBlockUser = (instructor: InstructorBiodata) => { setBlockingInstructor(instructor); setBlockModalOpen(true); };
  const handleUnblockUser = (instructor: InstructorBiodata) => { setUnblockingInstructor(instructor); setUnblockModalOpen(true); };
  const handleAssignRole = (instructor: InstructorBiodata) => { setAssigningRoleInstructor(instructor); setAssignRoleModalOpen(true); };
  const handleAssignAssessment = (instructor: InstructorBiodata) => { setAssignAssessmentInstructor(instructor); setAssignAssessmentModalOpen(true); };
  const handleAssignExtension = (instructor: InstructorBiodata) => { setAssignExtensionInstructor(instructor); setAssignExtensionModalOpen(true); };
  const handleAssignWing = (instructor: InstructorBiodata) => { setAssigningInstructor(instructor); setAssignWingModalOpen(true); };
  const handleApproveWing = (assignmentId: number, instructor: InstructorBiodata) => { setApprovingAssignment({ assignmentId, instructor }); setApproveModalOpen(true); };

  const handleAssignRank = (instructor: InstructorBiodata) => {
    setRankingUser(instructor.user ?? null);
    setAssignRankModalOpen(true);
  };

  const handleUpdateSignature = (instructor: InstructorBiodata) => {
    setSigningUser(instructor.user ?? null);
    setSignatureModalOpen(true);
  };

  const confirmBlock = async () => {
    if (!blockingInstructor || !blockingInstructor.user) return;
    try {
      setBlockLoading(true);
      await userService.updateUser(blockingInstructor.user.id, { is_active: false });
      await loadAllData();
      setBlockModalOpen(false);
      setBlockingInstructor(null);
    } catch (error) {
      console.error("Failed to block user:", error);
      alert("Failed to block user");
    } finally {
      setBlockLoading(false);
    }
  };

  const confirmUnblock = async () => {
    if (!unblockingInstructor || !unblockingInstructor.user) return;
    try {
      setUnblockLoading(true);
      await userService.updateUser(unblockingInstructor.user.id, { is_active: true, failed_login_attempts: 0, locked_until: null });
      await loadAllData();
      setUnblockModalOpen(false);
      setUnblockingInstructor(null);
    } catch (error) {
      console.error("Failed to unblock user:", error);
      alert("Failed to unblock user");
    } finally {
      setUnblockLoading(false);
    }
  };

  const getPendingAssignmentForUserWing = (instructor: InstructorBiodata) => {
    const assignWings = instructor.user?.assign_wings || [];
    return assignWings.find((aw: any) => {
      if (aw.status !== 'pending') return false;
      if (userHasFlyingWingNoSubwing) return userWingIds.includes(aw.wing_id) && !aw.subwing_id;
      if (userSubWingIds.length > 0) return !!(aw.subwing_id && userSubWingIds.includes(aw.subwing_id));
      return userWingIds.includes(aw.wing_id) || !!(aw.subwing_id && userSubWingIds.includes(aw.subwing_id));
    });
  };

  const hasApprovedWingForUser = (instructor: InstructorBiodata) => {
    const assignWings = instructor.user?.assign_wings || [];
    return assignWings.some((aw: any) => {
      if (aw.status !== 'approved') return false;
      if (userSubWingIds.length > 0) return !!(aw.subwing_id && userSubWingIds.includes(aw.subwing_id));
      return userWingIds.includes(aw.wing_id) || !!(aw.subwing_id && userSubWingIds.includes(aw.subwing_id));
    });
  };

  const handleAssignSubjects = (instructor: InstructorBiodata) => { setAssigningSubjectInstructor(instructor); setAssignSubjectModalOpen(true); };
  const handleAssignModules = (instructor: InstructorBiodata) => { setAssigningModuleInstructor(instructor); setAssignModuleModalOpen(true); };
  const handleAssignMissions = (instructor: InstructorBiodata) => { setAssigningMissionInstructor(instructor); setAssignMissionModalOpen(true); };
  const handleViewAssignedModules = (instructor: InstructorBiodata) => { setViewingModulesInstructor(instructor); setViewModulesModalOpen(true); };

  const confirmApprove = async () => {
    if (!approvingAssignment) return;
    try {
      setApproveLoading(true);
      await instructorAssignWingService.updateStatus(approvingAssignment.assignmentId, 'approved');
      await loadAllData();
      setApproveModalOpen(false);
      setApprovingAssignment(null);
    } catch (error) {
      console.error("Failed to approve assignment:", error);
      alert("Failed to approve assignment");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleExport = () => console.log("Export instructors");
  const handleSearchChange = (value: string) => { setSearchTerm(value); setCurrentPage(1); };
  const handlePerPageChange = (value: number) => { setPerPage(value); setCurrentPage(1); };
  const handleClearFilters = () => { setFilterCourseId(0); setFilterSemesterId(0); setCurrentPage(1); };
  const hasActiveFilters = filterCourseId || filterSemesterId;

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  // ─── Base columns (always shown) ────────────────────────────────────────────
  const baseColumns: Column<InstructorBiodata>[] = [
    {
      key: "id",
      header: "SL.",
      className: "text-center text-gray-900",
      render: (_instructor, index) => (pagination.from || 0) + (index),
    },
    {
      key: "user",
      header: "BD/No",
      className: "font-mono text-sm text-gray-700",
      render: (instructor) => instructor.user?.service_number || "—",
    },
    {
      key: "user",
      header: "Name",
      className: "font-medium text-gray-900",
      render: (instructor) => instructor.user?.name || "—",
    },
    {
      key: "profile_picture",
      header: "Profile",
      className: "text-center",
      render: (instructor) => instructor.user?.profile_photo ? (
        <div className="flex justify-center">
          <div className="relative w-10 h-10 overflow-hidden rounded-full border border-gray-200">
            <Image src={instructor.user.profile_photo} alt={instructor.user?.name || "Profile"} fill className="object-cover" />
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <Icon icon="hugeicons:user-circle" className="w-6 h-6" />
          </div>
        </div>
      ),
    },
    {
      key: "signature",
      header: "Signature",
      className: "text-center",
      render: (instructor) => {
        const isApprovedForUserWing = hasApprovedWingForUser(instructor);
        return instructor.user?.signature ? (
          <div className="flex justify-center">
            <div
              className={`relative w-20 h-10 bg-gray-50 rounded border border-gray-100 overflow-hidden ${can('edit') ? 'cursor-pointer hover:bg-gray-100' : ''}`}
              onClick={((isApprovedForUserWing || isItFtw11sqnUser) && can('edit')) ? (e) => { e.stopPropagation(); handleUpdateSignature(instructor); } : undefined}
              title={can('edit') ? "Update Signature" : undefined}
            >
              <Image src={instructor.user.signature} alt="Signature" fill className="object-contain" />
            </div>
          </div>
        ) : ((userIsSystemAdmin || ((isApprovedForUserWing || isItFtw11sqnUser) && can('edit'))) ? (
          <button onClick={(e) => { e.stopPropagation(); handleUpdateSignature(instructor); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded-full border border-blue-100" title="Add Signature">
            <Icon icon="hugeicons:plus-sign" className="w-4 h-4" />
          </button>
        ) : <span className="text-gray-400 text-xs">—</span>);
      },
    },
    {
      key: "user",
      header: "Rank",
      className: "text-gray-700",
      render: (instructor) => {
        const isApprovedForUserWing = hasApprovedWingForUser(instructor);
        return (
          <div className="flex items-center gap-2">
            {instructor.user?.rank ? (
              <>
                <span className="flex-1">{instructor.user.rank.name}</span>
                {(userIsSystemAdmin || ((isApprovedForUserWing || isItFtw11sqnUser) && can('edit'))) && (
                  <button onClick={(e) => { e.stopPropagation(); handleAssignRank(instructor); }} className="p-0.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-100" title="Update Rank">
                    <Icon icon="hugeicons:pencil-edit-01" className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            ) : ((userIsSystemAdmin || ((isApprovedForUserWing || isItFtw11sqnUser) && can('edit'))) ? (
              <button onClick={(e) => { e.stopPropagation(); handleAssignRank(instructor); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-100 flex items-center gap-1" title="Assign Rank">
                <Icon icon="hugeicons:plus-sign" className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Add Rank</span>
              </button>
            ) : <span className="text-gray-400 text-xs">—</span>)}
          </div>
        );
      },
    },
    {
      key: "assigned_assessments",
      header: "Assessments",
      className: "text-center",
      headerAlign: "center" as const,
      render: (instructor: InstructorBiodata) => {
        const assigns = instructorAssignMap[instructor.user_id] || {};
        const CHIPS = [
          { key: "counseling", label: "Counseling", color: "bg-blue-100 text-blue-700 border-blue-200" },
          { key: "olq", label: "OLQ", color: "bg-green-100 text-green-700 border-green-200" },
        ];
        const chips = CHIPS.flatMap((c) => (assigns[c.key] || []).map((courseName, i) => ({ ...c, courseName, uid: `${c.key}-${i}` })));
        return (
          <div className="flex flex-col items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap gap-1 justify-center">
              {chips.map((c) => (
                <span key={c.uid} className={`px-1.5 py-0.5 text-xs font-medium rounded border ${c.color}`}>
                  {c.label}: {c.courseName}
                </span>
              ))}
            </div>
          </div>
        );
      },
    },
    // {
    //   key: "user",
    //   header: "Roles",
    //   className: "text-gray-700",
    //   render: (instructor) => {
    //     const isApprovedForUserWing = hasApprovedWingForUser(instructor);
    //     const userRoles = instructor.user?.roles || [];
    //     const uniqueRoles = Array.from(new Map(userRoles.map((r: any) => [r.id, r])).values());
    //     const isInstructorRelatedRole = (slug: string, name: string) => {
    //       const s = (slug || '').toLowerCase();
    //       const n = name.toLowerCase();
    //       return s === 'instructor' || n === 'instructor' || s.includes('cic') || n.includes('cic') || s.includes('course-tutor') || n.includes('course tutor');
    //     };
    //     const instructorRoles = uniqueRoles.filter((r: any) => isInstructorRelatedRole(r.slug || '', r.name));
    //     return (
    //       <div className="flex flex-wrap items-center gap-1">
    //         {instructorRoles.length > 0
    //           ? instructorRoles.map((role: any) => (
    //             <span key={role.id} className={`px-2 py-0.5 text-xs rounded-full font-medium ${role.name.toLowerCase() === 'instructor' ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"}`} title={role.description || role.name}>
    //               {role.name}
    //             </span>
    //           ))
    //           : <span className="text-gray-400 text-xs">—</span>
    //         }
            
    //       </div>
    //     );
    //   },
    // },
  ];

  // ─── System-view-only column (assigned wings) ────────────────────────────────
  const systemViewColumns: Column<InstructorBiodata>[] = showSystemView ? [
    {
      key: "assign_wings",
      header: "Assigned Wings",
      className: "text-gray-700",
      render: (instructor: InstructorBiodata) => {
        const assignWings = instructor.user?.assign_wings || [];
        return (
          <div className="flex flex-wrap items-center gap-1">
            {assignWings.length > 0
              ? assignWings.map((aw: any) => (
                <span
                  key={aw.id}
                  className={`px-2 py-0.5 text-xs rounded-full ${aw.status === 'approved' ? 'bg-green-100 text-green-700' : aw.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}
                  title={`${aw.wing?.name || 'Wing'}${aw.sub_wing ? ` - ${aw.sub_wing.name}` : ''} (${aw.status})`}
                >
                  {aw.status === 'pending' ? `${aw.wing?.code}: Pending` : `${aw.wing?.code || aw.wing?.name || 'Wing'}${aw.sub_wing ? `/${aw.sub_wing.code || aw.sub_wing.name}` : ''}`}
                </span>
              ))
              : <span className="text-gray-400 text-xs">No wings</span>
            }
            {can('edit') && (
              <button onClick={(e) => { e.stopPropagation(); handleAssignWing(instructor); }} className="ml-1 p-0.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-100" title="Add / Manage Wings">
                <Icon icon="hugeicons:plus-sign-circle" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ] : [];

  // ─── Wing-view columns (assigned subjects / modules / missions / grounds) ────
  const assignedHeader = isItATWingUser
    ? "Assigned Subjects"
    : isItCTWingUser
      ? "Assigned Modules"
      : (isItFTWingUser && userHasFlyingWingNoSubwing)
        ? "Assigned Sub-Wing"
        : isItFTWingUser
          ? "Assigned Missions"
          : "Assigned";

  const assignedColumn: Column<InstructorBiodata> = {
    key: "assigned_subjects",
    header: assignedHeader,
    className: "text-gray-700",
    render: (instructor: InstructorBiodata) => {
      if (isItATWingUser) {
        const assignedSubjects = instructor.user?.atw_assigned_subjects?.filter((s: any) => s.is_active) || [];
        if (assignedSubjects.length === 0) return <span className="text-gray-400">No subjects</span>;
        return (
          <div className="flex flex-wrap gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); router.push(`/users/instructors/${instructor.id}?tab=subjects`); }}>
            {assignedSubjects.slice(0, 3).map((as: any) => (
              <span key={as.id} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium" title={`${as.subject?.subject_name || 'Subject'} (${as.course?.code || ''} - ${as.semester?.name || ''})`}>
                {as.subject?.subject_code || as.subject?.subject_name || 'Sub'}
              </span>
            ))}
            {assignedSubjects.length > 3 && <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">+{assignedSubjects.length - 3} more</span>}
          </div>
        );
      }

      if (isItCTWingUser) {
        const assignedModules = instructor.user?.ctw_assigned_modules?.filter((m: any) => m.is_active) || [];
        if (assignedModules.length === 0) return <span className="text-gray-400">No modules</span>;
        return (
          <div className="flex flex-wrap gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleViewAssignedModules(instructor); }}>
            {assignedModules.slice(0, 3).map((am: any) => (
              <span key={am.id} className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium" title={`${am.module?.full_name || 'Module'} (${am.course?.code || ''} - ${am.semester?.name || ''})`}>
                {am.semester?.code}: {am.module?.full_name || am.module?.code || 'Module'}
              </span>
            ))}
            {assignedModules.length > 3 && <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">+{assignedModules.length - 3} more</span>}
          </div>
        );
      }

      if (isItFTWingUser && userHasFlyingWingNoSubwing) {
        const subWingAssignments = (instructor.user?.assign_wings || []).filter((aw: any) => userWingIds.includes(aw.wing_id) && aw.subwing_id && aw.sub_wing);
        if (subWingAssignments.length === 0) return <span className="text-gray-400">Not assigned</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {subWingAssignments.map((aw: any) => (
              <span key={aw.id} className={`px-2 py-0.5 text-xs rounded-full font-medium ${aw.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {aw.sub_wing?.code || aw.sub_wing?.name}{aw.status !== 'approved' ? ' (Pending)' : ''}
              </span>
            ))}
          </div>
        );
      }

      if (isItFTWingUser) {
        const userId = instructor.user?.id;
        const missionMap = isFtw12SqnUser ? ftw12sqnMissionMap : ftw11sqnMissionMap;
        const missionAssignments = userId ? (missionMap[userId] || []) : [];
        if (missionAssignments.length > 0) {
          const exerciseLabels: string[] = [];
          missionAssignments.forEach((a: any) => {
            if (a.exercises && a.exercises.length > 0) {
              a.exercises.forEach((ex: any) => {
                if (ex.exercise?.exercise_shortname) exerciseLabels.push(ex.exercise.exercise_shortname);
              });
            }
          });
          const uniqueLabels = [...new Set(exerciseLabels)];
          const visible = uniqueLabels.slice(0, 3);
          const extra = uniqueLabels.length - visible.length;
          const allLabels = uniqueLabels.join(", ");
          return (
            <div className="flex flex-wrap gap-1" title={allLabels}>
              {visible.map((label, idx) => <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">{label}</span>)}
              {extra > 0 && <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">+{extra} more</span>}
            </div>
          );
        }
        return <span className="text-gray-400">No missions</span>;
      }

      return <span className="text-gray-400">—</span>;
    },
  };

  const groundsColumn: Column<InstructorBiodata> = {
    key: "assigned_grounds",
    header: "Assigned Grounds",
    className: "text-gray-700",
    render: (instructor: InstructorBiodata) => {
      const userId = instructor.user?.id;
      const groundMap = isFtw12SqnUser ? ftw12sqnGroundMap : ftw11sqnGroundMap;
      const groundAssignments = userId ? (groundMap[userId] || []) : [];
      if (groundAssignments.length === 0) return <span className="text-gray-400">No grounds</span>;
      const exerciseLabels: string[] = [];
      groundAssignments.forEach((a: any) => {
        if (a.exercises && a.exercises.length > 0) {
          a.exercises.forEach((ex: any) => {
            if (ex.exercise?.exercise_shortname) exerciseLabels.push(ex.exercise.exercise_shortname);
          });
        }
      });
      const uniqueLabels = [...new Set(exerciseLabels)];
      const visible = uniqueLabels.slice(0, 3);
      const extra = uniqueLabels.length - visible.length;
      const allLabels = uniqueLabels.join(", ");
      return (
        <div className="flex flex-wrap gap-1" title={allLabels}>
          {visible.map((label, idx) => <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700">{label}</span>)}
          {extra > 0 && <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">+{extra} more</span>}
        </div>
      );
    },
  };

  const wingViewColumns: Column<InstructorBiodata>[] = (!showSystemView && userHasWingAssigned)
    ? [
      assignedColumn,
      ...(isItFTWingUser && !userHasFlyingWingNoSubwing ? [groundsColumn] : []),
    ]
    : [];

  // ─── Tail columns (status + actions, always shown) ───────────────────────────
  const tailColumns: Column<InstructorBiodata>[] = [
    // {
    //   key: "is_active",
    //   header: "Status",
    //   className: "text-center",
    //   render: (instructor) => {
    //     const isBlocked = instructor.user && !instructor.user.is_active && (instructor.user.failed_login_attempts ?? 0) >= 3;
    //     return (
    //       <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${instructor.user?.is_active ? "bg-green-100 text-green-800" : isBlocked ? "bg-red-100 text-red-800 border border-red-200" : "bg-gray-100 text-gray-800"}`}>
    //         {instructor.user?.is_active ? "Active" : isBlocked ? "Blocked" : "Inactive"}
    //       </span>
    //     );
    //   },
    // },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center" as const,
      className: "text-center no-print",
      render: (instructor: InstructorBiodata) => {
        const pendingAssignment = getPendingAssignmentForUserWing(instructor);
        const isApprovedForUserWing = hasApprovedWingForUser(instructor);

        // Show extension button only if instructor has a non-instructor role
        const instructorSlugs = ['instructor', 'atw-cic', 'atw-course-tutor'];
        const instructorNames = ['ATW CIC', 'ATW Course Tutor', 'Instructor'];
        const hasNonInstructorRole = (instructor.user?.role_assignments || []).some((a: any) => {
          const slug = (a.role?.slug || '').toLowerCase();
          const name = a.role?.name || '';
          return !instructorSlugs.includes(slug) && !instructorNames.includes(name);
        });

        return (
          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
            {can('edit') && (
              <button onClick={() => handleEditInstructor(instructor)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
              </button>
            )}
            {(userIsSystemAdmin || ((isApprovedForUserWing || isItFtw11sqnUser) && can('edit'))) && (
              <>
                <button onClick={(e) => { e.stopPropagation(); handleAssignAssessment(instructor); }} className="p-0.5 text-teal-600 hover:bg-teal-50 rounded border border-teal-100" title="Assign Assessments">
                  <Icon icon="hugeicons:task-daily-02" className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleAssignRole(instructor); }} className="ml-1 p-0.5 text-purple-600 hover:bg-purple-50 rounded border border-purple-100" title="Manage Roles">
                  <Icon icon="hugeicons:plus-sign-circle" className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            {hasNonInstructorRole && (
              <button onClick={(e) => { e.stopPropagation(); handleAssignExtension(instructor); }} className="p-0.5 text-teal-600 hover:bg-teal-50 rounded border border-teal-100" title="Assign Extension">
                <Icon icon="hugeicons:puzzle" className="w-3.5 h-3.5" />
              </button>
            )}
            {pendingAssignment
              ? (
                <button onClick={() => handleApproveWing(pendingAssignment.id, instructor)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve Wing">
                  <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
                </button>
              )
              : ((userIsSystemAdmin || isApprovedForUserWing || isItFtw11sqnUser) && (
                <div className="flex gap-1">
                  {isItATWingUser && (
                    <button onClick={() => handleAssignSubjects(instructor)} className="p-1 text-purple-600 hover:bg-purple-50 rounded" title="Assign Subjects">
                      <Icon icon="hugeicons:book-02" className="w-4 h-4" />
                    </button>
                  )}
                  {isItCTWingUser && (
                    <button onClick={() => handleAssignModules(instructor)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="Assign Modules">
                      <Icon icon="hugeicons:package" className="w-4 h-4" />
                    </button>
                  )}
                  {userHasFlyingWingNoSubwing && can('edit') && (
                    <button onClick={() => handleAssignWing(instructor)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Assign Wing">
                      <Icon icon="hugeicons:hierarchy-square-01" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            }
            {(instructor.user?.assign_wings || []).some((aw: any) => aw.subwing_id && aw.wing?.is_flying) && (
              <button onClick={() => handleAssignMissions(instructor)} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Assign Missions">
                <Icon icon="hugeicons:airplane-landing-01" className="w-4 h-4" />
              </button>
            )}
            {can('delete') && (
              instructor.user?.is_active
                ? (
                  <button onClick={() => handleBlockUser(instructor)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Block / Deactivate">
                    <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
                  </button>
                )
                : (
                  <button onClick={() => handleUnblockUser(instructor)} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Unblock / Activate">
                    <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
                  </button>
                )
            )}
          </div>
        );
      },
    },
  ];

  // ─── Final columns array ─────────────────────────────────────────────────────
  const columns: Column<InstructorBiodata>[] = [
    ...baseColumns,
    ...systemViewColumns,
    ...wingViewColumns,
    ...tailColumns,
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">All Instructors List</h2>
      </div>

      {(() => {
        if (showSystemView) return null;
        const pendingInstructors = instructors.filter(i => {
          const assignWings = i.user?.assign_wings || [];
          return assignWings.some((aw: any) => {
            if (aw.status !== 'pending') return false;
            if (userHasFlyingWingNoSubwing) return userWingIds.includes(aw.wing_id) && !aw.subwing_id;
            if (userSubWingIds.length > 0) return !!(aw.subwing_id && userSubWingIds.includes(aw.subwing_id));
            return userWingIds.includes(aw.wing_id) || !!(aw.subwing_id && userSubWingIds.includes(aw.subwing_id));
          });
        });
        if (pendingInstructors.length === 0) return null;
        return (
          <div className="mb-4 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3">
            <Icon icon="hugeicons:alert-02" className="w-5 h-5 text-orange-500 shrink-0" />
            <p className="text-sm text-orange-700">
              You have <span className="font-bold">{pendingInstructors.length}</span> unapproved instructor{pendingInstructors.length > 1 ? 's' : ''} in your wing assigned from CPTC. Please approve them.
            </p>
          </div>
        );
      })()}

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, specialization..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 text-sm ${hasActiveFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <Icon icon="hugeicons:filter" className="w-4 h-4" />Filters
          </button>
          {hasActiveFilters ? (
            <button onClick={handleClearFilters} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 flex items-center gap-1">
              <Icon icon="hugeicons:cancel-01" className="w-4 h-4" />Clear
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {can('add') && (
            <button onClick={handleAddInstructor} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
              <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Instructor
            </button>
          )}
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700">
            <Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Icon icon="hugeicons:filter" className="w-4 h-4 text-blue-500" />Advanced Filters
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Course</label>
              <select
                value={filterCourseId}
                onChange={(e) => { setFilterCourseId(Number(e.target.value)); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>All Courses</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
              <select
                value={filterSemesterId}
                onChange={(e) => { setFilterSemesterId(Number(e.target.value)); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>All Semesters</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {loading
        ? <TableLoading />
        : <DataTable columns={columns} data={instructors} keyExtractor={(instructor) => instructor.id.toString()} emptyMessage="No instructors found" onRowClick={can('view') ? handleViewInstructor : undefined} />
      }

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results
          </div>
          <select
            value={perPage}
            onChange={(e) => handlePerPageChange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />Prev
          </button>
          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 text-sm rounded-lg ${currentPage === page ? "bg-blue-600 text-white" : "border border-black hover:bg-gray-50"}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
            disabled={currentPage === pagination.last_page}
            className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      </div>

      <InstructorFormModal />

      <ConfirmationModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        onConfirm={confirmBlock}
        title="Block Instructor"
        message={`Are you sure you want to block/deactivate "${blockingInstructor?.user?.name}"? They will not be able to login.`}
        confirmText="Block"
        cancelText="Cancel"
        loading={blockLoading}
        variant="danger"
      />

      <ConfirmationModal
        isOpen={unblockModalOpen}
        onClose={() => setUnblockModalOpen(false)}
        onConfirm={confirmUnblock}
        title="Unblock Instructor"
        message={`Are you sure you want to activate/unblock "${unblockingInstructor?.user?.name}"? This will reset failed login attempts.`}
        confirmText="Unblock"
        cancelText="Cancel"
        loading={unblockLoading}
        variant="success"
      />

      <ConfirmationModal
        isOpen={approveModalOpen}
        onClose={() => { setApproveModalOpen(false); setApprovingAssignment(null); }}
        onConfirm={confirmApprove}
        title="Approve Wing Assignment"
        message={`Are you sure you want to approve wing assignment for ${approvingAssignment?.instructor?.user?.name || 'this instructor'}?`}
        confirmText="Approve"
        cancelText="Cancel"
        loading={approveLoading}
        variant="success"
      />

      <InstructorAssignRoleModal
        isOpen={assignRoleModalOpen}
        onClose={() => { setAssignRoleModalOpen(false); setAssigningRoleInstructor(null); }}
        instructor={assigningRoleInstructor}
        onSuccess={() => { loadAllData(); }}
      />
      <InstructorAssignWingModal
        isOpen={assignWingModalOpen}
        onClose={() => { setAssignWingModalOpen(false); setAssigningInstructor(null); }}
        instructor={assigningInstructor}
        onSuccess={() => loadAllData()}
      />
      <InstructorAssignSubjectModal
        isOpen={assignSubjectModalOpen}
        onClose={() => { setAssignSubjectModalOpen(false); setAssigningSubjectInstructor(null); }}
        instructor={assigningSubjectInstructor}
        onSuccess={() => loadAllData()}
      />
      <InstructorAssignModuleModal
        isOpen={assignModuleModalOpen}
        onClose={() => { setAssignModuleModalOpen(false); setAssigningModuleInstructor(null); }}
        instructor={assigningModuleInstructor}
        onSuccess={() => loadAllData()}
      />
      <InstructorViewAssignedModulesModal
        isOpen={viewModulesModalOpen}
        onClose={() => { setViewModulesModalOpen(false); setViewingModulesInstructor(null); }}
        instructor={viewingModulesInstructor}
      />
      <InstructorAssignMissionModal
        isOpen={assignMissionModalOpen}
        onClose={() => { setAssignMissionModalOpen(false); setAssigningMissionInstructor(null); }}
        instructor={assigningMissionInstructor}
        onSuccess={() => { loadAllData(); }}
        squadronType={isFtw12SqnUser ? "12sqn" : "11sqn"}
      />

      <UserAssignRankModal
        isOpen={assignRankModalOpen}
        onClose={() => { setAssignRankModalOpen(false); setRankingUser(null); }}
        user={rankingUser}
        onSuccess={() => loadAllData()}
      />

      <UserSignatureModal
        isOpen={signatureModalOpen}
        onClose={() => { setSignatureModalOpen(false); setSigningUser(null); }}
        user={signingUser}
        onSuccess={() => loadAllData()}
      />

      <UserAssignExtensionModal
        isOpen={assignExtensionModalOpen}
        onClose={() => { setAssignExtensionModalOpen(false); setAssignExtensionInstructor(null); }}
        user={assignExtensionInstructor?.user ?? null}
        onSuccess={() => loadAllData()}
      />
    </div>
  );
}

export default function InstructorsPage() {
  return (
    <InstructorModalProvider>
      <InstructorsPageContent />
    </InstructorModalProvider>
  );
}