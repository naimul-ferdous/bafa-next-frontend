"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CadetProfile } from "@/libs/types/user";
import { Icon } from "@iconify/react";
import { cadetService } from "@/libs/services/cadetService";
import {
  SystemCourse,
  SystemSemester,
  SystemProgram,
  SystemBranch,
  SystemGroup,
} from "@/libs/types/system";
import { Rank } from "@/libs/types";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { CadetAssignmentModalProvider } from "@/context/CadetAssignmentModalContext";
import CadetAssignmentModal from "@/components/cadets/CadetAssignmentModal";
import CadetPromotionModal from "@/components/cadets/CadetPromotionModal";
import CadetDemotionModal from "@/components/cadets/CadetDemotionModal";
import CadetRankAssignmentModal from "@/components/cadets/CadetRankAssignmentModal";
import CadetAssignWingModal from "@/components/users/CadetAssignWingModal";
import CadetAssignUniversityModal from "@/components/cadets/CadetAssignUniversityModal";
import CadetAssignMissionModal from "@/components/cadets/CadetAssignMissionModal";
import InstructorAssignMissionModal from "@/components/instructors/InstructorAssignMissionModal";
import { InstructorBiodata } from "@/libs/types/user";
import { useAuth } from "@/context/AuthContext";

// ─── helpers ────────────────────────────────────────────────────────────────

function hasFlyingSubWing(cadet: CadetProfile): boolean {
  return !!(cadet.assigned_sub_wings?.find((a) => a.is_current)?.sub_wing);
}

function isUniversityEligible(cadet: CadetProfile): boolean {
  const currentSemester = cadet.assigned_semesters?.find((s) => s.is_current);
  const currentProgram = cadet.assigned_programs?.find((p) => p.is_current);
  const currentBranch = cadet.assigned_branchs?.find((b) => b.is_current);
  return (
    currentSemester?.is_changeable === true &&
    currentProgram?.program?.is_changeable === true &&
    currentBranch?.branch?.is_university === true
  );
}

// ─── inner page ─────────────────────────────────────────────────────────────

function CadetsPageContent() {
  const router = useRouter();
  const { user, userIsSystemAdmin, userIsInstructor } = useAuth();
  const userHasAcademyWing = userIsSystemAdmin || !!(user?.assign_wings?.some((aw: any) => aw.wing?.is_academy === true));
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Block modal
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockingCadet, setBlockingCadet] = useState<CadetProfile | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);

  // Unblock modal
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [unblockingCadet, setUnblockingCadet] = useState<CadetProfile | null>(null);
  const [unblockLoading, setUnblockLoading] = useState(false);

  // Promotion / demotion / rank
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [promotingCadet, setPromotingCadet] = useState<CadetProfile | null>(null);
  const [demotionModalOpen, setDemotionModalOpen] = useState(false);
  const [demotingCadet, setDemotingCadet] = useState<CadetProfile | null>(null);
  const [rankModalOpen, setRankModalOpen] = useState(false);
  const [rankingCadet, setRankingCadet] = useState<CadetProfile | null>(null);

  // Wing / university assignment
  const [wingModalOpen, setWingModalOpen] = useState(false);
  const [wingingCadet, setWingingCadet] = useState<CadetProfile | null>(null);
  const [universityModalOpen, setUniversityModalOpen] = useState(false);
  const [universityingCadet, setUniversityingCadet] = useState<CadetProfile | null>(null);

  // Instructor-level mission modal (kept for completeness)
  const [assignMissionModalOpen, setAssignMissionModalOpen] = useState(false);
  const [assigningMissionInstructor, setAssigningMissionInstructor] =
    useState<InstructorBiodata | null>(null);

  // Cadet-centric mission modal
  const [cadetAssignMissionModalOpen, setCadetAssignMissionModalOpen] = useState(false);
  const [cadetAssigningMission, setCadetAssigningMission] = useState<CadetProfile | null>(null);

  // Table / search / pagination
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
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    course_id: "",
    semester_id: "",
    program_id: "",
    branch_id: "",
    group_id: "",
    rank_id: "",
  });
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);

  // ── derived role flags ────────────────────────────────────────────────────
  const isUserFlyingWing = !!(
    user?.roleAssignments?.some((ra) => ra.wing?.is_flying) ||
    user?.role_assignments?.some((ra) => ra.wing?.is_flying)
  );

  const userHasSubWing = !!(
    user?.roleAssignments?.some((ra) => ra.is_active && ra.wing_id && (ra as any).sub_wing_id) ||
    user?.role_assignments?.some((ra) => ra.is_active && ra.wing_id && (ra as any).sub_wing_id)
  );

  const isFtw11SqnUser = !!(
    user?.roleAssignments?.some(
      (ra) => ra.is_active && ra.wing?.is_flying && (ra as any).sub_wing_id === 1
    ) ||
    user?.role_assignments?.some(
      (ra) => ra.is_active && ra.wing?.is_flying && (ra as any).sub_wing_id === 1
    )
  );

  const isFtw12SqnUser = !!(
    user?.roleAssignments?.some(
      (ra) => ra.is_active && ra.wing?.is_flying && (ra as any).sub_wing_id === 2
    ) ||
    user?.role_assignments?.some(
      (ra) => ra.is_active && ra.wing?.is_flying && (ra as any).sub_wing_id === 2
    )
  );

  const isFtwUser = isFtw11SqnUser || isFtw12SqnUser;
  const canAssignWing = userIsSystemAdmin || (isUserFlyingWing && !userHasSubWing);

  // ── data loading ──────────────────────────────────────────────────────────
  const loadPageData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cadetService.getListData({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
        course_id: filters.course_id ? Number(filters.course_id) : undefined,
        semester_id: filters.semester_id ? Number(filters.semester_id) : undefined,
        program_id: filters.program_id ? Number(filters.program_id) : undefined,
        branch_id: filters.branch_id ? Number(filters.branch_id) : undefined,
        group_id: filters.group_id ? Number(filters.group_id) : undefined,
        rank_id: filters.rank_id ? Number(filters.rank_id) : undefined,
      });

      if (response) {
        setCadets(response.cadets.data);
        setPagination({
          current_page: response.cadets.pagination.current_page,
          last_page: response.cadets.pagination.last_page,
          per_page: response.cadets.pagination.per_page,
          total: response.cadets.pagination.total,
          from: response.cadets.pagination.from,
          to: response.cadets.pagination.to,
        });
        setCourses(response.options.courses);
        setSemesters(response.options.semesters);
        setPrograms(response.options.programs);
        setBranches(response.options.branches);
        setGroups(response.options.groups);
        setRanks(response.options.ranks);
      }
    } catch (error) {
      console.error("Failed to load cadets:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, filters]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (cadets.length === 0) return;
    const matched = cadets.filter((cadet) => isUniversityEligible(cadet));
    if (matched.length > 0) console.log("[ATW Eligible Cadets]", matched);
  }, [cadets]);

  useEffect(() => {
    const handler = () => loadPageData();
    window.addEventListener("cadetAssignmentUpdated", handler);
    return () => window.removeEventListener("cadetAssignmentUpdated", handler);
  }, [loadPageData]);

  // ── action handlers ───────────────────────────────────────────────────────
  const handleAddCadet = () => router.push("/users/cadets/create");
  const handleEditCadet = (cadet: CadetProfile) =>
    router.push(`/users/cadets/${cadet.id}/edit`);
  const handleViewCadet = (cadet: CadetProfile) =>
    router.push(`/users/cadets/${cadet.id}`);
  const handleAssignRank = (cadet: CadetProfile) => {
    setRankingCadet(cadet);
    setRankModalOpen(true);
  };
  const handlePromoteCadet = (cadet: CadetProfile) => {
    setPromotingCadet(cadet);
    setPromotionModalOpen(true);
  };
  const handleDemoteCadet = (cadet: CadetProfile) => {
    setDemotingCadet(cadet);
    setDemotionModalOpen(true);
  };
  const handleBlockCadet = (cadet: CadetProfile) => {
    setBlockingCadet(cadet);
    setBlockModalOpen(true);
  };
  const handleUnblockCadet = (cadet: CadetProfile) => {
    setUnblockingCadet(cadet);
    setUnblockModalOpen(true);
  };
  const handleAssignWing = (cadet: CadetProfile) => {
    setWingingCadet(cadet);
    setWingModalOpen(true);
  };
  const handleAssignUniversity = (cadet: CadetProfile) => {
    setUniversityingCadet(cadet);
    setUniversityModalOpen(true);
  };
  const handleAssignMissions = (cadet: CadetProfile) => {
    setCadetAssigningMission(cadet);
    setCadetAssignMissionModalOpen(true);
  };

  const confirmBlock = async () => {
    if (!blockingCadet) return;
    try {
      setBlockLoading(true);
      await cadetService.updateCadet(blockingCadet.id, { is_active: false });
      await loadPageData();
      setBlockModalOpen(false);
      setBlockingCadet(null);
    } catch (error) {
      console.error("Failed to block cadet:", error);
      alert("Failed to block cadet");
    } finally {
      setBlockLoading(false);
    }
  };

  const confirmUnblock = async () => {
    if (!unblockingCadet) return;
    try {
      setUnblockLoading(true);
      await cadetService.updateCadet(unblockingCadet.id, { is_active: true });
      await loadPageData();
      setUnblockModalOpen(false);
      setUnblockingCadet(null);
    } catch (error) {
      console.error("Failed to unblock cadet:", error);
      alert("Failed to unblock cadet");
    } finally {
      setUnblockLoading(false);
    }
  };

  const handleExport = () => console.log("Export cadets");
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };
  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };
  const resetFilters = () => {
    setFilters({
      course_id: "",
      semester_id: "",
      program_id: "",
      branch_id: "",
      group_id: "",
      rank_id: "",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  // ── shared / always-visible columns ──────────────────────────────────────
  const baseColumns: Column<CadetProfile>[] = [
    {
      key: "sl",
      header: "SL.",
      headerAlign:'center',
      className: "text-center text-gray-900",
      render: (_, index) => (pagination.from || 0) + index,
    },
    {
      key: "cadet_number",
      header: "BD Number",
      className: "font-mono text-sm text-gray-900",
    },
    {
      key: "name",
      header: "Name",
      className: "font-medium text-gray-900",
      render: (cadet) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200 relative">
            {cadet.profile_picture || cadet.profile_photo ? (
              <Image
                src={cadet.profile_picture || cadet.profile_photo || ""}
                alt={cadet.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-500">
                <Icon icon="hugeicons:user" className="w-5 h-5" />
              </div>
            )}
          </div>
          <span>{cadet.name}</span>
        </div>
      ),
    },
    {
      key: "rank",
      header: "Rank",
      render: (cadet) => {
        const currentRank =
          cadet.rank ||
          cadet.assigned_ranks?.find((r) => r.is_current)?.rank ||
          cadet.assigned_ranks?.[0]?.rank;
        const rankName = currentRank?.short_name || currentRank?.name;
        if (rankName) return rankName;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAssignRank(cadet);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center mx-auto"
            title="Add Rank"
          >
            <Icon icon="hugeicons:plus-sign-circle" className="w-5 h-5" />
          </button>
        );
      },
    },
    {
      key: "course",
      header: "Current Course",
      render: (cadet) => {
        const c =
          cadet.assigned_courses?.find((c) => c.is_current)?.course ||
          cadet.assigned_courses?.[0]?.course;
        return c?.name || "—";
      },
    },
    {
      key: "semester",
      header: "Current Semester",
      render: (cadet) => {
        const s =
          cadet.assigned_semesters?.find((s) => s.is_current)?.semester ||
          cadet.assigned_semesters?.[0]?.semester;
        return s?.name || "—";
      },
    },
  ];

  // ── status badge (shared) ─────────────────────────────────────────────────
  const statusColumn: Column<CadetProfile> = {
    key: "status",
    header: "Status",
    className: "text-center",
    render: (cadet) => (
      <span
        className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
          cadet.is_active
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {cadet.is_active ? "Active" : "Inactive"}
      </span>
    ),
  };

  // ── FTW (11/12 SQN) specific columns ─────────────────────────────────────
  const ftwColumns: Column<CadetProfile>[] = [
    {
      key: "mission_instructor",
      header: "Mission Instructor",
      render: (cadet) => {
        const assignments = isFtw12SqnUser
          ? cadet.ftw12sqn_instructor_assign_mission_cadets || []
          : cadet.ftw11sqn_instructor_assign_mission_cadets || [];
        const instructors = Array.from(
          new Set(
            assignments
              .map((a) => a.assignment?.instructor?.name)
              .filter(Boolean)
          )
        );
        return (
          <div className="flex flex-col gap-1">
            {instructors.length > 0
              ? instructors.map((name, i) => (
                  <span key={i} className="text-xs font-medium text-gray-900">
                    {name}
                  </span>
                ))
              : <span className="text-gray-400">—</span>}
          </div>
        );
      },
    },
    {
      key: "assigned_missions",
      header: "Assigned Missions",
      render: (cadet) => {
        const assignments = isFtw12SqnUser
          ? cadet.ftw12sqn_instructor_assign_mission_cadets || []
          : cadet.ftw11sqn_instructor_assign_mission_cadets || [];
        const missions = Array.from(
          new Set(
            assignments
              .map(
                (a) =>
                  a.assignment?.mission?.phase_symbol ||
                  a.assignment?.mission?.phase_shortname
              )
              .filter(Boolean)
          )
        );
        return (
          <div className="flex flex-wrap gap-1">
            {missions.length > 0
              ? missions.map((m, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100"
                  >
                    {m}
                  </span>
                ))
              : <span className="text-gray-400">—</span>}
          </div>
        );
      },
    },
    {
      key: "assigned_grounds",
      header: "Assigned Grounds",
      render: (cadet) => {
        const assignments = isFtw12SqnUser
          ? cadet.ftw12sqn_instructor_assign_ground_cadets || []
          : cadet.ftw11sqn_instructor_assign_ground_cadets || [];
        const grounds = Array.from(
          new Set(
            assignments
              .map(
                (a) =>
                  a.assignment?.ground?.ground_shortname ||
                  a.assignment?.ground?.ground_full_name
              )
              .filter(Boolean)
          )
        );
        return (
          <div className="flex flex-wrap gap-1">
            {grounds.length > 0
              ? grounds.map((g, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-bold border border-green-100"
                  >
                    {g}
                  </span>
                ))
              : <span className="text-gray-400">—</span>}
          </div>
        );
      },
    },
    {
      key: "ftw_actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (cadet) => (
        <div
          className="flex items-center justify-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleAssignMissions(cadet)}
            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
            title={isFtw12SqnUser ? "Assign 12SQN Missions" : "Assign 11SQN Missions"}
          >
            <Icon icon="hugeicons:airplane-landing-01" className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // ── admin-only extra columns ──────────────────────────────────────────────
  const adminColumns: Column<CadetProfile>[] = [
    {
      key: "university",
      header: "University",
      render: (cadet) => {
        const currentSemesterId = cadet.assigned_semesters?.find(
          (s) => s.is_current
        )?.semester_id;
        const uniAssignment =
          cadet.assigned_universities?.find(
            (u) => u.semester_id === currentSemesterId && u.is_current
          ) ?? cadet.assigned_universities?.find((u) => u.is_current);
        if (!uniAssignment) return <span className="text-gray-400">—</span>;
        return (
          <div>
            <p className="text-sm font-medium text-gray-900">
              {uniAssignment.university?.name || "—"}
            </p>
            {uniAssignment.department?.name && (
              <p className="text-xs text-gray-500">
                {uniAssignment.department.name}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "program",
      header: "Current Program",
      render: (cadet) => {
        const currentProgramAssign =
          cadet.assigned_programs?.find((p) => p.is_current) ??
          cadet.assigned_programs?.[0];
        const currentSemesterId = cadet.assigned_semesters?.find(
          (s) => s.is_current
        )?.semester_id;
        const uniAssignment =
          cadet.assigned_universities?.find(
            (u) => u.semester_id === currentSemesterId && u.is_current
          ) ?? cadet.assigned_universities?.find((u) => u.is_current);
        const changeableProgram = uniAssignment?.changeable_program ?? null;
        return (
          <div>
            <p className="text-sm font-medium text-gray-900">
              {currentProgramAssign?.program?.name || "—"}
            </p>
            {changeableProgram && (
              <p className="text-xs text-indigo-500">
                {changeableProgram.name}
                {changeableProgram.short_name && (
                  <span className="text-gray-400">
                    {" "}· {changeableProgram.short_name}
                  </span>
                )}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "branch",
      header: "Current Branch",
      render: (cadet) => {
        const currentBranch =
          cadet.assigned_branchs?.find((b) => b.is_current)?.branch ||
          cadet.assigned_branchs?.[0]?.branch;
        const currentSemesterId = cadet.assigned_semesters?.find(
          (s) => s.is_current
        )?.semester_id;
        const uniAssignment =
          cadet.assigned_universities?.find(
            (u) => u.semester_id === currentSemesterId && u.is_current
          ) ?? cadet.assigned_universities?.find((u) => u.is_current);
        return (
          <div>
            <p className="text-sm font-medium text-gray-900">
              {currentBranch?.name || "—"}
            </p>
            {uniAssignment?.department?.name && (
              <p className="text-xs text-blue-500">
                {uniAssignment.department.name}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "sub_wing",
      header: "Sub-Wing",
      render: (cadet) => {
        const currentSubWing = cadet.assigned_sub_wings?.find(
          (a) => a.is_current
        )?.sub_wing;
        return currentSubWing ? (
          <span className="text-sm font-medium text-gray-900">
            {currentSubWing.name}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    statusColumn,
    {
      key: "admin_actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (cadet) => (
        <div
          className="flex items-center justify-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleEditCadet(cadet)}
            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
            title="Edit"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
          </button>
          {!hasFlyingSubWing(cadet) && (
            <button
              onClick={() => handleAssignWing(cadet)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Assign Wing"
            >
              <Icon icon="hugeicons:hierarchy-square-01" className="w-4 h-4" />
            </button>
          )}
          {userHasAcademyWing && isUniversityEligible(cadet) && (
            <button
              onClick={() => handleAssignUniversity(cadet)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="Assign University"
            >
              <Icon icon="hugeicons:university" className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handlePromoteCadet(cadet)}
            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
            title="Promote"
          >
            <Icon icon="hugeicons:graduation-scroll" className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDemoteCadet(cadet)}
            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
            title="Demote"
          >
            <Icon icon="hugeicons:sort-by-down-02" className="w-4 h-4" />
          </button>
          {cadet.is_active ? (
            <button
              onClick={() => handleBlockCadet(cadet)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Block / Deactivate"
            >
              <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleUnblockCadet(cadet)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Unblock / Activate"
            >
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ── non-admin flying-wing actions column ──────────────────────────────────
  const flyingWingActionsColumn: Column<CadetProfile> = {
    key: "flying_wing_actions",
    header: "Actions",
    headerAlign: "center",
    className: "text-center no-print",
    render: (cadet) => (
      <div
        className="flex items-center justify-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {canAssignWing && !hasFlyingSubWing(cadet) && (
          <button
            onClick={() => handleAssignWing(cadet)}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Assign Wing"
          >
            <Icon icon="hugeicons:hierarchy-square-01" className="w-4 h-4" />
          </button>
        )}
        {userHasAcademyWing && isUniversityEligible(cadet) && (
          <button
            onClick={() => handleAssignUniversity(cadet)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Assign University"
          >
            <Icon icon="hugeicons:university" className="w-4 h-4" />
          </button>
        )}
      </div>
    ),
  };

  // ── flying-wing sub_wing column ───────────────────────────────────────────
  const subWingColumn: Column<CadetProfile> = {
    key: "sub_wing_fw",
    header: "Sub-Wing",
    render: (cadet) => {
      const currentSubWing = cadet.assigned_sub_wings?.find(
        (a) => a.is_current
      )?.sub_wing;
      return currentSubWing ? (
        <span className="text-sm font-medium text-gray-900">
          {currentSubWing.name}
        </span>
      ) : (
        <span className="text-gray-400">—</span>
      );
    },
  };

  // ── assemble final column list ────────────────────────────────────────────
  let columns: Column<CadetProfile>[];

  if (isFtwUser) {
    // FTW 11/12 SQN: base + ftw-specific (no status, no university, no program, no branch)
    columns = [...baseColumns, ...ftwColumns];
  } else if (userIsSystemAdmin) {
    // System admin: base + admin extras (includes sub_wing, status, actions)
    columns = [...baseColumns, ...adminColumns];
  } else if (isUserFlyingWing) {
    // Flying-wing non-admin: base + sub_wing + status + limited actions
    columns = [...baseColumns, subWingColumn, statusColumn, flyingWingActionsColumn];
  } else {
    // Everyone else: base + status + actions only if user has at least one possible action
    const hasAnyAction = canAssignWing || userHasAcademyWing;
    columns = [...baseColumns, statusColumn, ...(hasAnyAction ? [flyingWingActionsColumn] : [])];
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <FullLogo />
        </div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">
          Bangladesh Air Force Academy
        </h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
          All Cadets List
        </h2>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative w-80">
          <Icon
            icon="hugeicons:search-01"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name, cadet number, batch..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-1 border ${
              showFilters
                ? "bg-blue-50 border-blue-200 text-blue-600"
                : "bg-white border-gray-200 text-gray-700"
            } hover:bg-gray-50 transition-colors`}
          >
            <Icon icon="hugeicons:filter" className="w-4 h-4 mr-1" />
            {showFilters ? "Hide Filters" : "Advanced Filters"}
          </button>
          {userIsSystemAdmin && (
            <button
              onClick={handleAddCadet}
              className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
            >
              <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
              Add Cadet
            </button>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"
          >
            <Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Icon icon="hugeicons:filter" className="w-4 h-4" />
              Advanced Filters
            </h3>
            <button
              onClick={resetFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <Icon icon="hugeicons:refresh" className="w-3 h-3" />
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Course", name: "course_id", options: courses },
              { label: "Semester", name: "semester_id", options: semesters },
              { label: "Program", name: "program_id", options: programs },
              { label: "Branch", name: "branch_id", options: branches },
              { label: "Group", name: "group_id", options: groups },
              { label: "Rank", name: "rank_id", options: ranks },
            ].map(({ label, name, options }) => (
              <div key={name}>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">
                  {label}
                </label>
                <select
                  value={filters[name as keyof typeof filters]}
                  onChange={(e) => handleFilterChange(name, e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All {label}s</option>
                  {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="w-full min-h-[20vh] flex items-center justify-center">
          <Icon
            icon="hugeicons:fan-01"
            className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500"
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={cadets}
          keyExtractor={(cadet) => cadet.id.toString()}
          emptyMessage="No cadets found"
          onRowClick={handleViewCadet}
        />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing {pagination.from || 0} to {pagination.to || 0} of{" "}
            {pagination.total} results
          </div>
          <select
            value={perPage}
            onChange={(e) => handlePerPageChange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />
            Prev
          </button>
          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 text-sm rounded-lg ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "border border-black hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(pagination.last_page, p + 1))
            }
            disabled={currentPage === pagination.last_page}
            className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <CadetAssignmentModal />
      <CadetPromotionModal
        isOpen={promotionModalOpen}
        onClose={() => setPromotionModalOpen(false)}
        cadet={promotingCadet}
        onSuccess={loadPageData}
      />
      <CadetDemotionModal
        isOpen={demotionModalOpen}
        onClose={() => setDemotionModalOpen(false)}
        cadet={demotingCadet}
        onSuccess={loadPageData}
      />
      <CadetRankAssignmentModal
        isOpen={rankModalOpen}
        onClose={() => setRankModalOpen(false)}
        cadet={rankingCadet}
        onSuccess={loadPageData}
      />
      <CadetAssignWingModal
        isOpen={wingModalOpen}
        onClose={() => setWingModalOpen(false)}
        cadet={wingingCadet}
        onSuccess={loadPageData}
      />
      <CadetAssignUniversityModal
        isOpen={universityModalOpen}
        onClose={() => setUniversityModalOpen(false)}
        cadet={universityingCadet}
        onSuccess={loadPageData}
      />
      <InstructorAssignMissionModal
        isOpen={assignMissionModalOpen}
        onClose={() => {
          setAssignMissionModalOpen(false);
          setAssigningMissionInstructor(null);
        }}
        instructor={assigningMissionInstructor}
        onSuccess={loadPageData}
        squadronType={isFtw12SqnUser ? "12sqn" : "11sqn"}
      />
      <CadetAssignMissionModal
        isOpen={cadetAssignMissionModalOpen}
        onClose={() => {
          setCadetAssignMissionModalOpen(false);
          setCadetAssigningMission(null);
        }}
        cadet={cadetAssigningMission}
        onSuccess={loadPageData}
        squadronType={isFtw12SqnUser ? "12sqn" : "11sqn"}
      />
      <ConfirmationModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        onConfirm={confirmBlock}
        title="Block Cadet"
        message={`Are you sure you want to block/deactivate "${blockingCadet?.name}"?`}
        confirmText="Block"
        cancelText="Cancel"
        loading={blockLoading}
        variant="danger"
      />
      <ConfirmationModal
        isOpen={unblockModalOpen}
        onClose={() => setUnblockModalOpen(false)}
        onConfirm={confirmUnblock}
        title="Unblock Cadet"
        message={`Are you sure you want to activate/unblock "${unblockingCadet?.name}"?`}
        confirmText="Unblock"
        cancelText="Cancel"
        loading={unblockLoading}
        variant="success"
      />
    </div>
  );
}

// ─── page export ─────────────────────────────────────────────────────────────

export default function CadetsPage() {
  return (
    <CadetAssignmentModalProvider>
      <CadetsPageContent />
    </CadetAssignmentModalProvider>
  );
}