"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { InstructorBiodata, User } from "@/libs/types/user";
import { Icon } from "@iconify/react";
import { instructorService } from "@/libs/services/instructorService";
import { userService } from "@/libs/services/userService";
import { instructorAssignWingService } from "@/libs/services/instructorAssignWingService";
import { commonService } from "@/libs/services/commonService";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup } from "@/libs/types/system";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { InstructorModalProvider } from "@/context/InstructorModalContext";
import InstructorFormModal from "@/components/instructors/InstructorFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import InstructorAssignWingModal from "@/components/instructors/InstructorAssignWingModal";
import InstructorAssignSubjectModal from "@/components/instructors/InstructorAssignSubjectModal";
import InstructorAssignCadetModal from "@/components/instructors/InstructorAssignCadetModal";
import InstructorAssignModuleModal from "@/components/instructors/InstructorAssignModuleModal";
import CtwInstructorAssignCadetModal from "@/components/instructors/CtwInstructorAssignCadetModal";
import InstructorViewAssignedModulesModal from "@/components/instructors/InstructorViewAssignedModulesModal";
import UserAssignRankModal from "@/components/users/UserAssignRankModal";
import UserSignatureModal from "@/components/users/UserSignatureModal";
import { useAuth } from "@/context/AuthContext";
import { usePageContext, useCan } from "@/context/PagePermissionsContext";

function InstructorsPageContent() {
  const router = useRouter();
  const { user, userIsSystemAdmin } = useAuth();
  const can = useCan();
  const [instructors, setInstructors] = useState<InstructorBiodata[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  const [rankingUser, setRankingUser] = useState<any>(null);

  // Signature modal state
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signingUser, setSigningUser] = useState<any>(null);

  const [assignWingModalOpen, setAssignWingModalOpen] = useState(false);
  const [assigningInstructor, setAssigningInstructor] = useState<InstructorBiodata | null>(null);
  const [assignSubjectModalOpen, setAssignSubjectModalOpen] = useState(false);
  const [assigningSubjectInstructor, setAssigningSubjectInstructor] = useState<InstructorBiodata | null>(null);
  const [assignModuleModalOpen, setAssignModuleModalOpen] = useState(false);
  const [assigningModuleInstructor, setAssigningModuleInstructor] = useState<InstructorBiodata | null>(null);
  const [assignCadetModalOpen, setAssignCadetModalOpen] = useState(false);
  const [assigningCadetInstructor, setAssigningCadetInstructor] = useState<InstructorBiodata | null>(null);
  const [assignCtwCadetModalOpen, setAssignCtwCadetModalOpen] = useState(false);
  const [assigningCtwCadetInstructor, setAssigningCtwCadetInstructor] = useState<InstructorBiodata | null>(null);
  const [viewModulesModalOpen, setViewModulesModalOpen] = useState(false);
  const [viewingModulesInstructor, setViewingModulesInstructor] = useState<InstructorBiodata | null>(null);
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
  const [filterProgramId, setFilterProgramId] = useState<number>(0);
  const [filterBranchId, setFilterBranchId] = useState<number>(0);
  const [filterGroupId, setFilterGroupId] = useState<number>(0);
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);

  // Get logged-in user's wing/subwing from role_assignments
  const userWingIds = user?.role_assignments?.filter(ra => ra.is_active && ra.wing_id).map(ra => ra.wing_id) || [];
  const userSubWingIds = user?.role_assignments?.filter(ra => ra.is_active && ra.sub_wing_id).map(ra => ra.sub_wing_id) || [];

  // Check if user has any wing/subwing assigned (not a system-level user)
  const userHasWingAssigned = userWingIds.length > 0 || userSubWingIds.length > 0;
  
  // Determine if we should show system-level management view or wing-specific view
  // CPTC is same as Super Admin (System Level)
  const showSystemView = userIsSystemAdmin || !userHasWingAssigned;
  
  const isItATWingUser = !userIsSystemAdmin && user?.role_assignments?.some(ra => ra.is_active && ra.wing?.code === 'ATW');
  const isItCTWingUser = !userIsSystemAdmin && user?.role_assignments?.some(ra => ra.is_active && ra.wing?.code === 'CTW');
  const isItFTWingUser = !userIsSystemAdmin && user?.role_assignments?.some(ra => ra.is_active && ra.wing?.code === 'FTW');
  const isInstructor = !!user?.instructor_biodata;

  // Load common dropdown data
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await commonService.getResultOptions();
        if (options) {
          setCourses(options.courses);
          setSemesters(options.semesters);
          setPrograms(options.programs);
          setBranches(options.branches);
          setGroups(options.groups);
        }
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    };
    loadOptions();
  }, []);

  const loadInstructors = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, per_page: perPage, search: searchTerm || undefined };
      if (filterCourseId) params.course_id = filterCourseId;
      if (filterSemesterId) params.semester_id = filterSemesterId;
      if (filterProgramId) params.program_id = filterProgramId;
      if (filterBranchId) params.branch_id = filterBranchId;
      if (filterGroupId) params.group_id = filterGroupId;
      const response = await instructorService.getAllInstructors(params);
      setInstructors(response.data);
      setPagination({ current_page: response.current_page, last_page: response.last_page, per_page: response.per_page, total: response.total, from: response.from, to: response.to });
    } catch (error) {
      console.error("Failed to load instructors:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, filterCourseId, filterSemesterId, filterProgramId, filterBranchId, filterGroupId]);

  useEffect(() => { loadInstructors(); }, [loadInstructors]);
  useEffect(() => {
    const handleInstructorUpdate = () => loadInstructors();
    window.addEventListener('instructorUpdated', handleInstructorUpdate);
    return () => window.removeEventListener('instructorUpdated', handleInstructorUpdate);
  }, [loadInstructors]);

  const handleAddInstructor = () => router.push('/users/instructors/create');
  const handleEditInstructor = (instructor: InstructorBiodata) => router.push(`/users/instructors/${instructor.id}/edit`);
  const handleViewInstructor = (instructor: InstructorBiodata) => router.push(`/users/instructors/${instructor.id}`);
  const handleBlockUser = (instructor: InstructorBiodata) => { setBlockingInstructor(instructor); setBlockModalOpen(true); };
  const handleUnblockUser = (instructor: InstructorBiodata) => { setUnblockingInstructor(instructor); setUnblockModalOpen(true); };
  const handleAssignWing = (instructor: InstructorBiodata) => { setAssigningInstructor(instructor); setAssignWingModalOpen(true); };
  const handleApproveWing = (assignmentId: number, instructor: InstructorBiodata) => { setApprovingAssignment({ assignmentId, instructor }); setApproveModalOpen(true); };
  
  const handleAssignRank = (instructor: InstructorBiodata) => {
    setRankingUser(instructor.user);
    setAssignRankModalOpen(true);
  };

  const handleUpdateSignature = (instructor: InstructorBiodata) => {
    setSigningUser(instructor.user);
    setSignatureModalOpen(true);
  };

  const confirmBlock = async () => {
    if (!blockingInstructor || !blockingInstructor.user) return;
    try {
      setBlockLoading(true);
      await userService.updateUser(blockingInstructor.user.id, {
        is_active: false,
      });
      await loadInstructors();
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
      await userService.updateUser(unblockingInstructor.user.id, {
        is_active: true,
        failed_login_attempts: 0,
        locked_until: null,
      });
      await loadInstructors();
      setUnblockModalOpen(false);
      setUnblockingInstructor(null);
    } catch (error) {
      console.error("Failed to unblock user:", error);
      alert("Failed to unblock user");
    } finally {
      setUnblockLoading(false);
    }
  };

  // Check if instructor has pending assignment for user's wing
  const getPendingAssignmentForUserWing = (instructor: InstructorBiodata) => {
    const assignWings = instructor.user?.assign_wings || [];
    return assignWings.find(aw =>
      aw.status === 'pending' &&
      (userWingIds.includes(aw.wing_id) || (aw.subwing_id && userSubWingIds.includes(aw.subwing_id)))
    );
  };

  // Check if instructor has approved wing assignment for user's wing
  const hasApprovedWingForUser = (instructor: InstructorBiodata) => {
    const assignWings = instructor.user?.assign_wings || [];
    return assignWings.some(aw =>
      aw.status === 'approved' &&
      (userWingIds.includes(aw.wing_id) || (aw.subwing_id && userSubWingIds.includes(aw.subwing_id)))
    );
  };

  // Handle assign subjects
  const handleAssignSubjects = (instructor: InstructorBiodata) => {
    setAssigningSubjectInstructor(instructor);
    setAssignSubjectModalOpen(true);
  };

  // Handle assign modules (CTW)
  const handleAssignModules = (instructor: InstructorBiodata) => {
    setAssigningModuleInstructor(instructor);
    setAssignModuleModalOpen(true);
  };

  // Handle assign cadets
  const handleAssignCadets = (instructor: InstructorBiodata) => {
    setAssigningCadetInstructor(instructor);
    setAssignCadetModalOpen(true);
  };

  // Handle assign CTW cadets
  const handleAssignCtwCadets = (instructor: InstructorBiodata) => {
    setAssigningCtwCadetInstructor(instructor);
    setAssignCtwCadetModalOpen(true);
  };

  // Handle view assigned modules
  const handleViewAssignedModules = (instructor: InstructorBiodata) => {
    setViewingModulesInstructor(instructor);
    setViewModulesModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!approvingAssignment) return;
    try {
      setApproveLoading(true);
      await instructorAssignWingService.updateStatus(approvingAssignment.assignmentId, 'approved');
      await loadInstructors();
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
  const handleClearFilters = () => { setFilterCourseId(0); setFilterSemesterId(0); setFilterProgramId(0); setFilterBranchId(0); setFilterGroupId(0); setCurrentPage(1); };
  const hasActiveFilters = filterCourseId || filterSemesterId || filterProgramId || filterBranchId || filterGroupId;

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  const columns: Column<InstructorBiodata>[] = [
    { key: "id", header: "SL.", className: "text-center text-gray-900", render: (instructor, index) => (pagination.from || 0) + (index) },
    { key: "user", header: "BD Number", className: "font-mono text-sm text-gray-700", render: (instructor) => instructor.user?.service_number || "—" },
    { key: "user", header: "Name", className: "font-medium text-gray-900", render: (instructor) => instructor.user?.name || "—" },
    {
      key: "profile_picture", header: "Profile", className: "text-center", render: (instructor) => (
        instructor.user?.profile_photo ? (
          <div className="flex justify-center">
            <div className="relative w-10 h-10 overflow-hidden rounded-full border border-gray-200">
              <Image
                src={instructor.user.profile_photo}
                alt={instructor.user?.name || "Profile"}
                fill
                className="object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <Icon icon="hugeicons:user-circle" className="w-6 h-6" />
            </div>
          </div>
        )
      )
    },
    {
      key: "signature", header: "Signature", className: "text-center", render: (instructor) => (
        instructor.user?.signature ? (
          <div className="flex justify-center">
            <div
              className={`relative w-20 h-10 bg-gray-50 rounded border border-gray-100 overflow-hidden ${can('edit') ? 'cursor-pointer hover:bg-gray-100' : ''}`}
              onClick={can('edit') ? (e) => { e.stopPropagation(); handleUpdateSignature(instructor); } : undefined}
              title={can('edit') ? "Update Signature" : undefined}
            >
              <Image src={instructor.user.signature} alt="Signature" fill className="object-contain" />
            </div>
          </div>
        ) : (
          can('edit') ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleUpdateSignature(instructor); }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded-full border border-blue-100"
              title="Add Signature"
            >
              <Icon icon="hugeicons:plus-sign" className="w-4 h-4" />
            </button>
          ) : <span className="text-gray-400 text-xs">—</span>
        )
      )
    },
    { key: "user", header: "Rank", className: "text-gray-700", render: (instructor) => (
      <div className="flex items-center gap-2">
        {instructor.user?.rank ? (
          <>
            <span className="flex-1">{instructor.user.rank.name}</span>
            {can('edit') && (
              <button
                onClick={(e) => { e.stopPropagation(); handleAssignRank(instructor); }}
                className="p-0.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-100"
                title="Update Rank"
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        ) : (
          can('edit') ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleAssignRank(instructor); }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-100 flex items-center gap-1"
              title="Assign Rank"
            >
              <Icon icon="hugeicons:plus-sign" className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Add Rank</span>
            </button>
          ) : <span className="text-gray-400 text-xs">—</span>
        )}
      </div>
    )},
    { key: "years_of_experience", header: "Experience", headerAlign: "center" as const, className: "text-gray-700 text-center", render: (instructor) => instructor.years_of_experience ? `${instructor.years_of_experience} years` : "—" },
    { key: "date_of_commission", header: "Commission Date", className: "text-gray-700", render: (instructor) => instructor.date_of_commission ? new Date(instructor.date_of_commission).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
    // Show Assigned Wings column if system-level user (Super Admin or CPTC)
    ...(showSystemView ? [{
      key: "assign_wings", header: `Assigned Wings`, className: "text-gray-700", render: (instructor: InstructorBiodata) => {
        const assignWings = instructor.user?.assign_wings || [];
        return (
          <div className="flex flex-wrap items-center gap-1">
            {assignWings.length > 0 ? (
              assignWings.map((aw) => (
                <span key={aw.id} className={`px-2 py-0.5 text-xs rounded-full ${aw.status === 'approved' ? 'bg-green-100 text-green-700' : aw.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`} title={`${aw.wing?.name || 'Wing'}${aw.sub_wing ? ` - ${aw.sub_wing.name}` : ''} (${aw.status})`}>
                  {aw.status === 'pending' ? `${aw.wing?.code}: Pending` : `${aw.wing?.code || aw.wing?.name || 'Wing'}${aw.sub_wing ? `/${aw.sub_wing.code || aw.sub_wing.name}` : ''}`}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-xs">No wings</span>
            )}
            {can('edit') && (
              <button
                onClick={(e) => { e.stopPropagation(); handleAssignWing(instructor); }}
                className="ml-1 p-0.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-100"
                title="Add / Manage Wings"
              >
                <Icon icon="hugeicons:plus-sign-circle" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      }
    }] : []),
    // Only show Assigned Subjects column if user has wing assigned and NOT a system view (filtering by wing)
    ...(!showSystemView && userHasWingAssigned ? [{
      key: "assigned_subjects",
      header: isItATWingUser ? "Assigned Subjects" : isItCTWingUser ? "Assigned Modules" : isItFTWingUser ? "Assigned Missions" : "Assigned",
      className: "text-gray-700",
      render: (instructor: InstructorBiodata) => {
        if (isItATWingUser) {
          const assignedSubjects = instructor.user?.atw_assigned_subjects?.filter(s => s.is_active) || [];
          const assignedCadets = instructor.user?.atw_assigned_cadets?.filter(c => c.is_active) || [];

          if (assignedSubjects.length === 0) return <span className="text-gray-400">No subjects</span>;

          return (
            <div className="flex flex-wrap gap-1">
              {assignedSubjects.slice(0, 3).map((as) => {
                // Count cadets assigned to this specific subject for this instructor
                const cadetCount = assignedCadets.filter(c => c.subject_id === as.subject_id).length;

                return (
                  <span key={as.id} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium" title={`${as.subject?.subject_name || 'Subject'} (${as.course?.code || ''} - ${as.semester?.name || ''})`}>
                    {as.subject?.subject_code || as.subject?.subject_name || 'Sub'}: {cadetCount} Cadets
                  </span>
                );
              })}
              {assignedSubjects.length > 3 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  +{assignedSubjects.length - 3} more
                </span>
              )}
            </div>
          );
        } else if (isItCTWingUser) {
          const assignedModules = instructor.user?.ctw_assigned_modules?.filter(m => m.is_active) || [];
          const assignedCadets = instructor.user?.ctw_assigned_cadets?.filter(c => c.is_active) || [];

          if (assignedModules.length === 0) return <span className="text-gray-400">No modules</span>;

          return (
            <div className="flex flex-wrap gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleViewAssignedModules(instructor); }}>
              {assignedModules.slice(0, 3).map((am) => {
                const cadetCount = assignedCadets.filter(c => c.ctw_results_module_id === am.ctw_results_module_id).length;
                return (
                  <span key={am.id} className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium" title={`${am.module?.full_name || 'Module'} (${am.course?.code || ''} - ${am.semester?.name || ''})`}>
                    {am.semester?.code}: {am.module?.full_name || am.module?.code || 'Module'}: {cadetCount} Cadets
                  </span>
                );
              })}
              {assignedModules.length > 3 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  +{assignedModules.length - 3} more
                </span>
              )}
            </div>
          );
        } else if (isItFTWingUser) {
          const wingData = instructor.wing_data?.find(wd => userWingIds.includes(wd.wing_id)) ||
            instructor.sub_wing_data?.find(swd => userSubWingIds.includes(swd.sub_wing_id));
          const courses = wingData?.courses_taught || [];

          if (courses.length === 0) return <span className="text-gray-400">No missions</span>;

          return (
            <div className="flex flex-wrap gap-1">
              {courses.slice(0, 3).map((course, idx) => (
                <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                  {course}
                </span>
              ))}
              {courses.length > 3 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  +{courses.length - 3} more
                </span>
              )}
            </div>
          );
        }
        return <span className="text-gray-400">—</span>;
      }
    }] : []),
    { key: "is_active", header: "Status", className: "text-center", render: (instructor) => {
      const isBlocked = instructor.user && !instructor.user.is_active && (instructor.user.failed_login_attempts ?? 0) >= 3;
      return (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
          instructor.user?.is_active 
            ? "bg-green-100 text-green-800" 
            : isBlocked 
              ? "bg-red-100 text-red-800 border border-red-200" 
              : "bg-gray-100 text-gray-800"
        }`}>
          {instructor.user?.is_active ? "Active" : isBlocked ? "Blocked" : "Inactive"}
        </span>
      );
    }},
    ...(!isInstructor ? [{
      key: "actions", header: "Actions", headerAlign: "center" as const, className: "text-center no-print", render: (instructor: InstructorBiodata) => {
        const pendingAssignment = getPendingAssignmentForUserWing(instructor);
        const isApprovedForUserWing = hasApprovedWingForUser(instructor);
        return (
          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
            {can('edit') && (
              <button onClick={() => handleEditInstructor(instructor)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
            )}
            {pendingAssignment ? (
              can('edit') && <button onClick={() => handleApproveWing(pendingAssignment.id, instructor)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve Wing"><Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" /></button>
            ) : isApprovedForUserWing && can('edit') && (
              <div className="flex gap-1">
                {isItATWingUser && (
                  <>
                    <button onClick={() => handleAssignSubjects(instructor)} className="p-1 text-purple-600 hover:bg-purple-50 rounded" title="Assign Subjects"><Icon icon="hugeicons:book-02" className="w-4 h-4" /></button>
                    <button onClick={() => handleAssignCadets(instructor)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Assign Cadets"><Icon icon="hugeicons:user-group" className="w-4 h-4" /></button>
                  </>
                )}
                {isItCTWingUser && (
                  <>
                    <button onClick={() => handleAssignModules(instructor)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="Assign Modules"><Icon icon="hugeicons:package" className="w-4 h-4" /></button>
                    <button onClick={() => handleAssignCtwCadets(instructor)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Assign Cadets"><Icon icon="hugeicons:user-group" className="w-4 h-4" /></button>
                  </>
                )}
              </div>
            )}
            {can('delete') && (
              instructor.user?.is_active ? (
                <button onClick={() => handleBlockUser(instructor)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Block / Deactivate"><Icon icon="hugeicons:unavailable" className="w-4 h-4" /></button>
              ) : (
                <button onClick={() => handleUnblockUser(instructor)} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Unblock / Activate"><Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" /></button>
              )
            )}
          </div>
        );
      }
    }] : []),
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">All Instructors List</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search by name, specialization..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 text-sm ${hasActiveFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <Icon icon="hugeicons:filter" className="w-4 h-4" />
            Filters
          </button>
          {hasActiveFilters ? (
            <button onClick={handleClearFilters} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 flex items-center gap-1">
              <Icon icon="hugeicons:cancel-01" className="w-4 h-4" />
              Clear
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {can('add') && (
            <button onClick={handleAddInstructor} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
              <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
              Add Instructor
            </button>
          )}
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Icon icon="hugeicons:filter" className="w-4 h-4 text-blue-500" />
            Advanced Filters
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Course</label>
              <select value={filterCourseId} onChange={(e) => { setFilterCourseId(Number(e.target.value)); setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={0}>All Courses</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
              <select value={filterSemesterId} onChange={(e) => { setFilterSemesterId(Number(e.target.value)); setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={0}>All Semesters</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
              <select value={filterProgramId} onChange={(e) => { setFilterProgramId(Number(e.target.value)); setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={0}>All Programs</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
              <select value={filterBranchId} onChange={(e) => { setFilterBranchId(Number(e.target.value)); setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={0}>All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Group</label>
              <select value={filterGroupId} onChange={(e) => { setFilterGroupId(Number(e.target.value)); setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={0}>All Groups</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.code})</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? <TableLoading /> : <DataTable columns={columns} data={instructors} keyExtractor={(instructor) => instructor.id.toString()} emptyMessage="No instructors found" onRowClick={can('view') ? handleViewInstructor : undefined} />}

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

      <ConfirmationModal isOpen={approveModalOpen} onClose={() => { setApproveModalOpen(false); setApprovingAssignment(null); }} onConfirm={confirmApprove} title="Approve Wing Assignment" message={`Are you sure you want to approve wing assignment for ${approvingAssignment?.instructor?.user?.name || 'this instructor'}?`} confirmText="Approve" cancelText="Cancel" loading={approveLoading} variant="success" />
      <InstructorAssignWingModal isOpen={assignWingModalOpen} onClose={() => { setAssignWingModalOpen(false); setAssigningInstructor(null); }} instructor={assigningInstructor} onSuccess={() => loadInstructors()} />
      <InstructorAssignSubjectModal isOpen={assignSubjectModalOpen} onClose={() => { setAssignSubjectModalOpen(false); setAssigningSubjectInstructor(null); }} instructor={assigningSubjectInstructor} onSuccess={() => loadInstructors()} />
      <InstructorAssignCadetModal isOpen={assignCadetModalOpen} onClose={() => { setAssignCadetModalOpen(false); setAssigningCadetInstructor(null); }} instructor={assigningCadetInstructor} onSuccess={() => loadInstructors()} />
      <InstructorAssignModuleModal isOpen={assignModuleModalOpen} onClose={() => { setAssignModuleModalOpen(false); setAssigningModuleInstructor(null); }} instructor={assigningModuleInstructor} onSuccess={() => loadInstructors()} />
      <CtwInstructorAssignCadetModal isOpen={assignCtwCadetModalOpen} onClose={() => { setAssignCtwCadetModalOpen(false); setAssigningCtwCadetInstructor(null); }} instructor={assigningCtwCadetInstructor} onSuccess={() => loadInstructors()} />
      <InstructorViewAssignedModulesModal isOpen={viewModulesModalOpen} onClose={() => { setViewModulesModalOpen(false); setViewingModulesInstructor(null); }} instructor={viewingModulesInstructor} />
      
      <UserAssignRankModal 
        isOpen={assignRankModalOpen} 
        onClose={() => { setAssignRankModalOpen(false); setRankingUser(null); }} 
        user={rankingUser} 
        onSuccess={() => loadInstructors()} 
      />

      <UserSignatureModal 
        isOpen={signatureModalOpen} 
        onClose={() => { setSignatureModalOpen(false); setSigningUser(null); }} 
        user={signingUser} 
        onSuccess={() => loadInstructors()} 
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
