"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CadetProfile } from "@/libs/types/user";
import { Icon } from "@iconify/react";
import { cadetService } from "@/libs/services/cadetService";
import { commonService } from "@/libs/services/commonService";
import { rankService } from "@/libs/services/rankService";
import { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup } from "@/libs/types/system";
import { Rank } from "@/libs/types";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { CadetAssignmentModalProvider } from "@/context/CadetAssignmentModalContext";
import CadetAssignmentModal from "@/components/cadets/CadetAssignmentModal";
import CadetPromotionModal from "@/components/cadets/CadetPromotionModal";
import CadetDemotionModal from "@/components/cadets/CadetDemotionModal";
import CadetPostponeModal from "@/components/cadets/CadetPostponeModal";
import CadetRankAssignmentModal from "@/components/cadets/CadetRankAssignmentModal";
import CadetAssignWingModal from "@/components/users/CadetAssignWingModal";
import { useAuth } from "@/context/AuthContext";

import { getImageUrl } from "@/libs/utils/formatter";

function CadetsPageContent() {
  const router = useRouter();
  const { user, userIsSystemAdmin } = useAuth();
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Block modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockingCadet, setBlockingCadet] = useState<CadetProfile | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);

  // Unblock modal state
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [unblockingCadet, setUnblockingCadet] = useState<CadetProfile | null>(null);
  const [unblockLoading, setUnblockLoading] = useState(false);

  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [promotingCadet, setPromotingCadet] = useState<CadetProfile | null>(null);
  const [demotionModalOpen, setDemotionModalOpen] = useState(false);
  const [demotingCadet, setDemotingCadet] = useState<CadetProfile | null>(null);
  const [rankModalOpen, setRankModalOpen] = useState(false);
  const [rankingCadet, setRankingCadet] = useState<CadetProfile | null>(null);
  
  // Wing assignment modal state
  const [wingModalOpen, setWingModalOpen] = useState(false);
  const [wingingCadet, setWingingCadet] = useState<CadetProfile | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });
  const [showFilters, setShowFilters] = useState(false);

  const isInstructor = !!user?.instructor_biodata;

  // Filter states
  const [filters, setFilters] = useState({
    course_id: "",
    semester_id: "",
    program_id: "",
    branch_id: "",
    group_id: "",
    rank_id: "",
  });

  // Filter options
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [options, ranksRes] = await Promise.all([
          commonService.getResultOptions(),
          rankService.getAllRanks({ per_page: 100 }),
        ]);
        if (options) {
          setCourses(options.courses);
          setSemesters(options.semesters);
          setPrograms(options.programs);
          setBranches(options.branches);
          setGroups(options.groups);
        }
        setRanks(ranksRes.data);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      }
    };
    fetchFilterOptions();
  }, []);

  const loadCadets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cadetService.getAllCadets({
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
      setCadets(response.data);
      setPagination({ current_page: response.current_page, last_page: response.last_page, per_page: response.per_page, total: response.total, from: response.from, to: response.to });
    } catch (error) {
      console.error("Failed to load cadets:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, filters]);

  useEffect(() => { loadCadets(); }, [loadCadets]);

  useEffect(() => {
    const handleCadetAssignmentUpdate = () => loadCadets();
    window.addEventListener('cadetAssignmentUpdated', handleCadetAssignmentUpdate);
    return () => window.removeEventListener('cadetAssignmentUpdated', handleCadetAssignmentUpdate);
  }, [loadCadets]);

  const handleAddCadet = () => router.push('/users/cadets/create');
  const handleEditCadet = (cadet: CadetProfile) => router.push(`/users/cadets/${cadet.id}/edit`);
  const handleViewCadet = (cadet: CadetProfile) => router.push(`/users/cadets/${cadet.id}`);
  const handleAssignCadet = (cadet: CadetProfile) => { setRankingCadet(cadet); setRankModalOpen(true); };
  const handlePromoteCadet = (cadet: CadetProfile) => { setPromotingCadet(cadet); setPromotionModalOpen(true); };
  const handleDemoteCadet = (cadet: CadetProfile) => { setDemotingCadet(cadet); setDemotionModalOpen(true); };
  const handleBlockCadet = (cadet: CadetProfile) => { setBlockingCadet(cadet); setBlockModalOpen(true); };
  const handleUnblockCadet = (cadet: CadetProfile) => { setUnblockingCadet(cadet); setUnblockModalOpen(true); };
  const handleAssignWing = (cadet: CadetProfile) => { setWingingCadet(cadet); setWingModalOpen(true); };

  const confirmBlock = async () => {
    if (!blockingCadet) return;
    try {
      setBlockLoading(true);
      await cadetService.updateCadet(blockingCadet.id, {
        is_active: false,
      });
      await loadCadets();
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
      await cadetService.updateCadet(unblockingCadet.id, {
        is_active: true,
      });
      await loadCadets();
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
  const handleSearchChange = (value: string) => { setSearchTerm(value); setCurrentPage(1); };
  const handlePerPageChange = (value: number) => { setPerPage(value); setCurrentPage(1); };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
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

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  const columns: Column<CadetProfile>[] = [
    { key: "id", header: "SL.", className: "text-center text-gray-900", render: (_, index) => (pagination.from || 0) + (index) },
    { key: "cadet_number", header: "BD Number", className: "font-mono text-sm text-gray-900" },
    { 
      key: "name", 
      header: "Name", 
      className: "font-medium text-gray-900",
      render: (cadet) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
            {cadet.profile_picture || cadet.profile_photo ? (
              <img 
                src={cadet.profile_picture || cadet.profile_photo} 
                alt={cadet.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-500">
                <Icon icon="hugeicons:user" className="w-5 h-5" />
              </div>
            )}
          </div>
          <span>{cadet.name}</span>
        </div>
      )
    },
    { 
      key: "rank", 
      header: "Rank", 
      render: (cadet) => {
        const currentRank = cadet.rank || cadet.assigned_ranks?.find(r => r.is_current)?.rank || cadet.assigned_ranks?.[0]?.rank;
        const rankName = currentRank?.short_name || currentRank?.name;
        
        if (rankName) return rankName;

        return (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleAssignCadet(cadet);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center mx-auto"
            title="Add Rank"
          >
            <Icon icon="hugeicons:plus-sign-circle" className="w-5 h-5" />
          </button>
        );
      }
    },
    { 
      key: "course", 
      header: "Current Course", 
      render: (cadet) => {
        const currentCourse = cadet.assigned_courses?.find(c => c.is_current)?.course || cadet.assigned_courses?.[0]?.course;
        return currentCourse?.name || "—";
      }
    },
    { 
      key: "semester", 
      header: "Current Semester", 
      render: (cadet) => {
        const currentSemester = cadet.assigned_semesters?.find(s => s.is_current)?.semester || cadet.assigned_semesters?.[0]?.semester;
        return currentSemester?.name || "—";
      }
    },
    {
      key: "units",
      header: "Wings/Subwings",
      render: (cadet) => {
        const wingNames = cadet.assigned_wings?.filter(aw => aw.is_current).map(aw => aw.wing?.code || aw.wing?.name).filter(Boolean) || [];
        const subWingNames = cadet.assigned_sub_wings?.filter(asw => asw.is_current).map(asw => {
          const subWingLabel = asw.sub_wing?.code || asw.sub_wing?.name;
          const wingLabel = asw.sub_wing?.wing?.code || asw.sub_wing?.wing?.name;
          return wingLabel ? `${wingLabel}:${subWingLabel}` : subWingLabel;
        }).filter(Boolean) || [];

        const allUnits = Array.from(new Set([...wingNames, ...subWingNames])) as string[];
        
        if (allUnits.length === 0) return "—";

        const displayLimit = 5;
        const visibleUnits = allUnits.slice(0, displayLimit);
        const remainingCount = allUnits.length - displayLimit;

        return (
          <div className="flex flex-wrap gap-1 max-w-[250px]">
            {visibleUnits.map((unit, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100 uppercase whitespace-nowrap">
                {unit}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded border border-gray-200">
                +{remainingCount} more
              </span>
            )}
          </div>
        );
      }
    },
    { key: "email", header: "Email", className: "text-gray-700", render: (cadet) => cadet.email || "—" },
    { key: "is_active", header: "Status", className: "text-center", render: (cadet) => (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${cadet.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
        {cadet.is_active ? "Active" : "Inactive"}
      </span>
    )},
    ...(userIsSystemAdmin ? [{
      key: "actions", header: "Actions", headerAlign: "center" as const, className: "text-center no-print", render: (cadet: CadetProfile) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleEditCadet(cadet)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          <button onClick={() => handleAssignWing(cadet)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Assign Wing"><Icon icon="hugeicons:hierarchy-square-01" className="w-4 h-4" /></button>
          <button onClick={() => handlePromoteCadet(cadet)} className="p-1 text-purple-600 hover:bg-purple-50 rounded" title="Promote"><Icon icon="hugeicons:graduation-scroll" className="w-4 h-4" /></button>
          <button onClick={() => handleDemoteCadet(cadet)} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Demote"><Icon icon="hugeicons:sort-by-down-02" className="w-4 h-4" /></button>
          {cadet.is_active ? (
            <button onClick={() => handleBlockCadet(cadet)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Block / Deactivate"><Icon icon="hugeicons:unavailable" className="w-4 h-4" /></button>
          ) : (
            <button onClick={() => handleUnblockCadet(cadet)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Unblock / Activate"><Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" /></button>
          )}
        </div>
      )
    }] : []),
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">All Cadets List</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by name, cadet number, batch..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`px-4 py-2 rounded-lg flex items-center gap-1 border ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-700'} hover:bg-gray-50 transition-colors`}
          >
            <Icon icon="hugeicons:filter" className="w-4 h-4 mr-1" />
            {showFilters ? 'Hide Filters' : 'Advanced Filters'}
          </button>
          {userIsSystemAdmin && (
            <button onClick={handleAddCadet} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
              <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
              Add Cadet
            </button>
          )}
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

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
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Course</label>
              <select 
                value={filters.course_id} 
                onChange={(e) => handleFilterChange("course_id", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Semester</label>
              <select 
                value={filters.semester_id} 
                onChange={(e) => handleFilterChange("semester_id", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Semesters</option>
                {semesters.map(semester => (
                  <option key={semester.id} value={semester.id}>{semester.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Program</label>
              <select 
                value={filters.program_id} 
                onChange={(e) => handleFilterChange("program_id", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Programs</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Branch</label>
              <select 
                value={filters.branch_id} 
                onChange={(e) => handleFilterChange("branch_id", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Group</label>
              <select 
                value={filters.group_id} 
                onChange={(e) => handleFilterChange("group_id", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Groups</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Rank</label>
              <select 
                value={filters.rank_id} 
                onChange={(e) => handleFilterChange("rank_id", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Ranks</option>
                {ranks.map(rank => (
                  <option key={rank.id} value={rank.id}>{rank.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? <TableLoading /> : <DataTable columns={columns} data={cadets} keyExtractor={(cadet) => cadet.id.toString()} emptyMessage="No cadets found" onRowClick={handleViewCadet} />}

      <div className="flex items-center justify-between">
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

      <CadetAssignmentModal />
      <CadetPromotionModal isOpen={promotionModalOpen} onClose={() => setPromotionModalOpen(false)} cadet={promotingCadet} onSuccess={loadCadets} />
      <CadetDemotionModal isOpen={demotionModalOpen} onClose={() => setDemotionModalOpen(false)} cadet={demotingCadet} onSuccess={loadCadets} />
      <CadetRankAssignmentModal isOpen={rankModalOpen} onClose={() => setRankModalOpen(false)} cadet={rankingCadet} onSuccess={loadCadets} />
      <CadetAssignWingModal isOpen={wingModalOpen} onClose={() => setWingModalOpen(false)} cadet={wingingCadet} onSuccess={loadCadets} />
      
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

export default function CadetsPage() {
  return (
    <CadetAssignmentModalProvider>
      <CadetsPageContent />
    </CadetAssignmentModalProvider>
  );
}
