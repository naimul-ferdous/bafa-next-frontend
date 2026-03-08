"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import { userService } from "@/libs/services/userService";
import { commonService } from "@/libs/services/commonService";
import { atwUserAssignService } from "@/libs/services/atwUserAssignService";
import type { SystemCourse } from "@/libs/types/system";
import Image from "next/image";
import type { User } from "@/libs/types/user";
import DataTable, { Column as DataTableColumn } from "@/components/ui/DataTable";
import TableLoading from "@/components/ui/TableLoading";
import { useAuth } from "@/libs/hooks/useAuth";
import { useCan } from "@/context/PagePermissionsContext";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import UserAssignRoleModal from "@/components/users/UserAssignRoleModal";
import UserAssignRankModal from "@/components/users/UserAssignRankModal";
import UserSignatureModal from "@/components/users/UserSignatureModal";
import InstructorAssignWingModal from "@/components/instructors/InstructorAssignWingModal";
import CadetAssignWingModal from "@/components/users/CadetAssignWingModal";
import InstructorAssignAssessmentModal from "@/components/instructors/InstructorAssignAssessmentModal";

export default function UsersPage() {
  const router = useRouter();
  const { user: authUser, userIsSuperAdmin } = useAuth();
  const can = useCan();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Block/Unblock state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockingUser, setBlockingUser] = useState<User | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [unblockingUser, setUnblockingUser] = useState<User | null>(null);
  const [unblockLoading, setUnblockLoading] = useState(false);

  // Role modal state
  const [assignRoleModalOpen, setAssignRoleModalOpen] = useState(false);
  const [assigningUser, setAssigningUser] = useState<User | null>(null);

  // Rank modal state
  const [assignRankModalOpen, setAssignRankModalOpen] = useState(false);
  const [rankingUser, setRankingUser] = useState<User | null>(null);

  // Signature modal state
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signingUser, setSigningUser] = useState<User | null>(null);

  // Wing assignment modal state
  const [assignWingModalOpen, setAssignWingModalOpen] = useState(false);
  const [assigningWingUser, setAssigningWingUser] = useState<any>(null);

  // Cadet Wing assignment modal state
  const [assignCadetWingModalOpen, setAssignCadetWingModalOpen] = useState(false);
  const [assigningCadetWingUser, setAssigningCadetWingUser] = useState<User | null>(null);

  // Assessment assignment modal state
  const [assignAssessmentModalOpen, setAssignAssessmentModalOpen] = useState(false);
  const [assignAssessmentUser, setAssignAssessmentUser] = useState<User | null>(null);

  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [userAssignMap, setUserAssignMap] = useState<Record<number, Record<string, string[]>>>({});

  // Blocked users warning (Super Admin only)
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [showBlockedWarning, setShowBlockedWarning] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers({ page: currentPage, per_page: perPage, search: searchTerm || undefined, status: statusFilter !== 'all' ? statusFilter : undefined });
      setUsers(response.data);
      setPagination({ current_page: response.current_page, last_page: response.last_page, per_page: response.per_page, total: response.total, from: response.from, to: response.to });
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, statusFilter]);

  const loadAssignMap = useCallback(async () => {
    try {
      const data = await atwUserAssignService.getAll();
      const map: Record<number, Record<string, string[]>> = {};
      const push = (userId: number | null | undefined, key: string, courseName: string) => {
        if (!userId) return;
        if (!map[userId]) map[userId] = {};
        if (!map[userId][key]) map[userId][key] = [];
        map[userId][key].push(courseName);
      };
      data.penpicture.forEach((a) => push(a.user_id, "penpicture", a.course?.name || `Course ${a.course_id}`));
      data.counseling.forEach((a) => push(a.user_id, "counseling", a.course?.name || `Course ${a.course_id}`));
      data.olq.forEach((a)        => push(a.user_id, "olq",        a.course?.name || `Course ${a.course_id}`));
      data.warning.forEach((a)    => push(a.user_id, "warning",    a.course?.name || `Course ${a.course_id}`));
      setUserAssignMap(map);
    } catch (error) {
      console.error("Failed to load assign map:", error);
    }
  }, []);

  const refreshData = useCallback(() => {
    loadUsers();
    loadAssignMap();
    if (userIsSuperAdmin) userService.getBlockedUsers().then(setBlockedUsers);
  }, [loadUsers, loadAssignMap, userIsSuperAdmin]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadAssignMap(); }, [loadAssignMap]);

  useEffect(() => {
    if (userIsSuperAdmin) {
      userService.getBlockedUsers().then(setBlockedUsers);
    }
  }, [userIsSuperAdmin]);

  useEffect(() => {
    const handleUserUpdate = () => refreshData();
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, [refreshData]);

  useEffect(() => {
    commonService.getResultOptions().then((options) => {
      if (options?.courses) setCourses(options.courses);
    });
  }, []);

  const handleAddUser = () => router.push('/users/create');
  const handleEditUser = (user: User) => router.push(`/users/${user.id}/edit`);
  const handleViewUser = (user: User) => router.push(`/users/${user.id}`);
  const handleBlockUser = (user: User) => { setBlockingUser(user); setBlockModalOpen(true); };
  const handleUnblockUser = (user: User) => { setUnblockingUser(user); setUnblockModalOpen(true); };
  const handleAssignRole = (user: User) => { setAssigningUser(user); setAssignRoleModalOpen(true); };
  const handleAssignRank = (user: User) => { setRankingUser(user); setAssignRankModalOpen(true); };
  const handleUpdateSignature = (user: User) => { setSigningUser(user); setSignatureModalOpen(true); };
  
  const handleAssignWing = (user: User) => {
    // Check if user is a cadet (by role)
    const hasCadetRole = user.roles?.some(role => 
      role.slug === 'cadet' || 
      role.name.toLowerCase().includes('cadet')
    );

    if (hasCadetRole) {
      setAssigningCadetWingUser(user);
      setAssignCadetWingModalOpen(true);
    } else {
      setAssigningWingUser({ id: 0, user_id: user.id, user: user });
      setAssignWingModalOpen(true);
    }
  };

  const confirmBlock = async () => {
    if (!blockingUser) return;
    setBlockLoading(true);
    try {
      await userService.updateUser(blockingUser.id, { is_active: false });
      refreshData();
      setBlockModalOpen(false);
    } catch (error) {
      console.error("Failed to block user:", error);
    } finally {
      setBlockLoading(false);
    }
  };

  const confirmUnblock = async () => {
    if (!unblockingUser) return;
    setUnblockLoading(true);
    try {
      await userService.updateUser(unblockingUser.id, { is_active: true });
      refreshData();
      setUnblockModalOpen(false);
    } catch (error) {
      console.error("Failed to unblock user:", error);
    } finally {
      setUnblockLoading(false);
    }
  };

  const handleExport = () => {
    // Implement export functionality
    console.log("Exporting users...");
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  const columns: DataTableColumn<User>[] = [
    { 
      key: "sl", 
      header: "Sl", 
      className: "text-center w-12", 
      render: (_, index) => (pagination.from || 0) + index 
    },
    { 
      key: "service_number", 
      header: "BD/No", 
      className: "font-mono font-bold text-gray-700" 
    },
    { 
      key: "name", 
      header: "Name", 
      className: "font-bold text-gray-900" 
    },
    { 
      key: "rank_id" as keyof User, 
      header: "Rank", 
      render: (user) => (
        <div className="flex items-center gap-2">
          {user.rank ? (
            <>
              <span className="flex-1">{user.rank.name}</span>
              {can('edit') && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleAssignRank(user); }}
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
                onClick={(e) => { e.stopPropagation(); handleAssignRank(user); }}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-100 flex items-center gap-1"
                title="Assign Rank"
              >
                <Icon icon="hugeicons:plus-sign" className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Add Rank</span>
              </button>
            ) : <span className="text-gray-400 text-xs">—</span>
          )}
        </div>
      )
    },
    { 
      key: "profile_photo", 
      header: "Profile", 
      className: "w-16",
      render: (user) => (
        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden relative border border-gray-200 mx-auto">
          <Image 
            src={user.profile_photo || '/images/default-avatar.png'} 
            alt={user.name} 
            fill 
            className="object-cover"
          />
        </div>
      )
    },
    { 
      key: "email", 
      header: "Email", 
      className: "text-gray-500",
      render: (user) => user.email || <span className="text-gray-400 italic">No Email</span>
    },
    { 
      key: "roles", 
      header: "Role", 
      className: "text-gray-700", 
      render: (user) => {
        const instructorSlugs = ['instructor', 'atw-cic', 'atw-course-tutor'];
        const instructorRoleNames = ['instructor', 'atw cic', 'atw course tutor', 'cic', 'course tutor'];
        const uniqueRoles = user.roles ? Array.from(new Map(user.roles.map((r) => [r.id, r])).values()) : [];
        const filteredRoles = uniqueRoles.filter(r =>
          !instructorSlugs.includes(r.slug || '') &&
          !instructorRoleNames.includes(r.name.toLowerCase())
        );
        return (
        <div className="flex flex-wrap items-center gap-1 max-w-xs">
          {filteredRoles.length > 0 ? (
            filteredRoles.map((role) => (
              <span
                key={role.id}
                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                  role.is_super_admin
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {role.name}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-xs">No roles</span>
          )}
          {can('asign-role') && (
            <button
              onClick={(e) => { e.stopPropagation(); handleAssignRole(user); }}
              className="ml-1 p-0.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-100"
              title="Add / Manage Roles"
            >
              <Icon icon="hugeicons:plus-sign-circle" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      );
      }
    },
    {
      key: "assessments" as keyof User, 
      header: "Assessments", 
      className: "text-center", 
      render: (user) => {
        const assigns = userAssignMap[user.id] || {};
        const CHIPS = [
          { key: "penpicture", label: "PenPicture", color: "bg-purple-100 text-purple-700 border-purple-200" },
          { key: "counseling", label: "Counseling", color: "bg-blue-100   text-blue-700   border-blue-200"   },
          { key: "olq",        label: "OLQ",        color: "bg-green-100  text-green-700  border-green-200"  },
          { key: "warning",    label: "Warning",    color: "bg-red-100    text-red-700    border-red-200"    },
        ];
        const chips = CHIPS.flatMap((c) =>
          (assigns[c.key] || []).map((courseName, i) => ({ ...c, courseName, uid: `${c.key}-${i}` }))
        );
        return (
          <div className="flex flex-col items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap gap-1 justify-center">
              {chips.map((c) => (
                <span key={c.uid} className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${c.color}`}>
                  {c.label}: {c.courseName}
                </span>
              ))}
            </div>
          </div>
        );
      }
    },
    { 
      key: "actions", 
      header: "Action", 
      headerAlign: "center", 
      className: "text-center no-print", 
      render: (user) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          {can('edit') && (
            <button onClick={() => handleEditUser(user)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          )}
          {can('asign-wings') && (
            <button onClick={() => handleAssignWing(user)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Assign Wing"><Icon icon="hugeicons:hierarchy-square-01" className="w-4 h-4" /></button>
          )}
          {can('delete') && (
            (!user.is_active) ? (
              <button onClick={() => handleUnblockUser(user)} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Unblock / Activate"><Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" /></button>
            ) : (
              <button onClick={() => handleBlockUser(user)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Block / Deactivate"><Icon icon="hugeicons:unavailable" className="w-4 h-4" /></button>
            )
          )}
        </div>
      )
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">All Users List</h2>
      </div>

      {userIsSuperAdmin && blockedUsers.length > 0 && showBlockedWarning && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon icon="hugeicons:alert-02" className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {blockedUsers.length} user{blockedUsers.length > 1 ? 's are' : ' is'} currently blocked and unable to access the system. Please review and take necessary action.
                </p>
              </div>
            </div>
            <button onClick={() => setShowBlockedWarning(false)} className="p-1 text-red-400 hover:text-red-600 rounded">
              <Icon icon="hugeicons:cancel-01" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by name, service number, email..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
        </div>
        <div className="flex items-center gap-3">
          {userIsSuperAdmin && (
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as "all" | "active" | "blocked"); setCurrentPage(1); }}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          )}
          {can('add') && (
            <button onClick={handleAddUser} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add User</button>
          )}
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {loading ? <TableLoading /> : <DataTable columns={columns} data={users} keyExtractor={(user) => user.id.toString()} emptyMessage="No users found" onRowClick={can('view') ? (user) => handleViewUser(user) : undefined} rowClassName={userIsSuperAdmin ? (user) => !user.is_active ? "bg-red-50" : "" : undefined} />}

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

      <ConfirmationModal 
        isOpen={blockModalOpen} 
        onClose={() => setBlockModalOpen(false)} 
        onConfirm={confirmBlock} 
        title="Block User" 
        message={`Are you sure you want to block/deactivate "${blockingUser?.name}"? They will not be able to login.`} 
        confirmText="Block" 
        cancelText="Cancel" 
        loading={blockLoading} 
        variant="danger" 
      />
      
      <ConfirmationModal 
        isOpen={unblockModalOpen} 
        onClose={() => setUnblockModalOpen(false)} 
        onConfirm={confirmUnblock} 
        title="Unblock User" 
        message={`Are you sure you want to activate/unblock "${unblockingUser?.name}"? This will reset failed login attempts.`} 
        confirmText="Unblock" 
        cancelText="Cancel" 
        loading={unblockLoading} 
        variant="success" 
      />

      <UserAssignRoleModal isOpen={assignRoleModalOpen} onClose={() => { setAssignRoleModalOpen(false); setAssigningUser(null); }} user={assigningUser} onSuccess={() => refreshData()} />
      
      <UserAssignRankModal 
        isOpen={assignRankModalOpen} 
        onClose={() => { setAssignRankModalOpen(false); setRankingUser(null); }} 
        user={rankingUser} 
        onSuccess={() => refreshData()} 
      />

      <UserSignatureModal 
        isOpen={signatureModalOpen} 
        onClose={() => { setSignatureModalOpen(false); setSigningUser(null); }} 
        user={signingUser} 
        onSuccess={() => refreshData()} 
      />

      <InstructorAssignWingModal 
        isOpen={assignWingModalOpen} 
        onClose={() => { setAssignWingModalOpen(false); setAssigningWingUser(null); }} 
        instructor={assigningWingUser} 
        onSuccess={() => refreshData()} 
      />

      <CadetAssignWingModal
        isOpen={assignCadetWingModalOpen}
        onClose={() => { setAssignCadetWingModalOpen(false); setAssigningCadetWingUser(null); }}
        user={assigningCadetWingUser}
        onSuccess={() => refreshData()}
      />

      <InstructorAssignAssessmentModal
        isOpen={assignAssessmentModalOpen}
        onClose={() => { setAssignAssessmentModalOpen(false); setAssignAssessmentUser(null); }}
        onSuccess={() => refreshData()}
        user={assignAssessmentUser}
        courses={courses}
      />
    </div>
  );
}
