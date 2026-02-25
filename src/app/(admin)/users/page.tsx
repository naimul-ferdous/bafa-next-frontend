"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDate, getImageUrl } from "@/libs/utils/formatter";
import type { User } from "@/libs/types/user";
import { Icon } from "@iconify/react";
import { userService } from "@/libs/services/userService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import UserAssignRoleModal from "@/components/users/UserAssignRoleModal";
import UserAssignRankModal from "@/components/users/UserAssignRankModal";
import UserSignatureModal from "@/components/users/UserSignatureModal";
import InstructorAssignWingModal from "@/components/instructors/InstructorAssignWingModal";
import CadetAssignWingModal from "@/components/users/CadetAssignWingModal";
import Image from "next/image";
import { usePageContext, useCan } from "@/context/PagePermissionsContext";

export default function UsersPage() {
  const router = useRouter();
  const { menu, permissions } = usePageContext();
  const can = useCan();

  useEffect(() => {
    console.log("Page permissions:", permissions);
  }, [menu, permissions]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Block modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockingUser, setBlockingUser] = useState<User | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);

  // Unblock modal state
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [unblockingUser, setUnblockingUser] = useState<User | null>(null);
  const [unblockLoading, setUnblockLoading] = useState(false);
  
  // Role assignment modal state
  const [assignRoleModalOpen, setAssignRoleModalOpen] = useState(false);
  const [assigningUser, setAssigningUser] = useState<User | null>(null);

  // Rank assignment modal state
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

  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers({ page: currentPage, per_page: perPage, search: searchTerm || undefined });
      setUsers(response.data);
      setPagination({ current_page: response.current_page, last_page: response.last_page, per_page: response.per_page, total: response.total, from: response.from, to: response.to });
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => {
    const handleUserUpdate = () => loadUsers();
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, [loadUsers]);

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
    try {
      setBlockLoading(true);
      await userService.updateUser(blockingUser.id, {
        is_active: false,
      });
      await loadUsers();
      setBlockModalOpen(false);
      setBlockingUser(null);
    } catch (error) {
      console.error("Failed to block user:", error);
      alert("Failed to block user");
    } finally {
      setBlockLoading(false);
    }
  };

  const confirmUnblock = async () => {
    if (!unblockingUser) return;
    try {
      setUnblockLoading(true);
      await userService.updateUser(unblockingUser.id, {
        is_active: true,
        failed_login_attempts: 0,
        locked_until: null,
      });
      await loadUsers();
      setUnblockModalOpen(false);
      setUnblockingUser(null);
    } catch (error) {
      console.error("Failed to unblock user:", error);
      alert("Failed to unblock user");
    } finally {
      setUnblockLoading(false);
    }
  };

  const handleExport = () => console.log("Export users");
  const handleSearchChange = (value: string) => { setSearchTerm(value); setCurrentPage(1); };
  const handlePerPageChange = (value: number) => { setPerPage(value); setCurrentPage(1); };

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  const columns: Column<User>[] = [
    { key: "id", header: "SL.", className: "text-center text-gray-900", render: (user, index) => (pagination.from || 0) + (index) },
    { key: "profile_photo", header: "Profile", className: "text-center", render: (user) => (
      user.profile_photo ? (
        <div className="flex justify-center">
          <div className="relative w-10 h-10 overflow-hidden rounded-full border border-gray-200">
            <Image 
              src={getImageUrl(user.profile_photo)} 
              alt={user.name} 
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
    )},
    { key: "service_number", header: "BD Number", className: "font-mono text-sm text-gray-900" },
    { key: "name", header: "Name", className: "font-medium text-gray-900" },
    { key: "signature", header: "Signature", className: "text-center", render: (user) => (
      user.signature ? (
        <div className="flex justify-center">
          <div
            className={`relative w-20 h-10 overflow-hidden rounded border border-gray-200 bg-gray-50 ${can('edit') ? 'cursor-pointer hover:bg-gray-100' : ''}`}
            onClick={can('edit') ? (e) => { e.stopPropagation(); handleUpdateSignature(user); } : undefined}
            title={can('edit') ? "Update Signature" : undefined}
          >
            <Image src={getImageUrl(user.signature)} alt="Signature" fill className="object-contain" />
          </div>
        </div>
      ) : (
        can('edit') ? (
          <button
            onClick={(e) => { e.stopPropagation(); handleUpdateSignature(user); }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded-full border border-blue-100"
            title="Add Signature"
          >
            <Icon icon="hugeicons:plus-sign" className="w-4 h-4" />
          </button>
        ) : <span className="text-gray-400 text-xs">—</span>
      )
    )},
    { key: "email", header: "Email", className: "text-gray-700" },
    { key: "phone", header: "Phone", className: "text-gray-700", render: (user) => user.phone || "—" },
    { key: "rank", header: "Rank", className: "text-gray-700", render: (user) => (
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
    )},
    { key: "roles", header: "Roles", className: "text-gray-700", render: (user) => (
      <div className="flex flex-wrap items-center gap-1 max-w-xs">
        {user.roles && user.roles.length > 0 ? (
          user.roles.map((role) => (
            <span
              key={role.id}
              className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
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
        {can('edit') && (
          <button
            onClick={(e) => { e.stopPropagation(); handleAssignRole(user); }}
            className="ml-1 p-0.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-100"
            title="Add / Manage Roles"
          >
            <Icon icon="hugeicons:plus-sign-circle" className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )},
    { key: "is_active", header: "Status", className: "text-center", render: (user) => {
      const isBlocked = !user.is_active && (user.failed_login_attempts ?? 0) >= 3;
      return (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
          user.is_active 
            ? "bg-green-100 text-green-800" 
            : isBlocked 
              ? "bg-red-100 text-red-800 border border-red-200" 
              : "bg-gray-100 text-gray-800"
        }`}>
          {user.is_active ? "Active" : isBlocked ? "Blocked" : "Inactive"}
        </span>
      );
    }},
    { key: "actions", header: "Actions", headerAlign: "center", className: "text-center no-print", render: (user) => (
      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
        {can('edit') && (
          <button onClick={() => handleEditUser(user)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
        )}
        {can('edit') && (
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
    )},
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">All Users List</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by name, service number, email..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
        </div>
        <div className="flex items-center gap-3">
          {can('add') && (
            <button onClick={handleAddUser} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add User</button>
          )}
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {loading ? <TableLoading /> : <DataTable columns={columns} data={users} keyExtractor={(user) => user.id.toString()} emptyMessage="No users found" onRowClick={can('view') ? (user) => handleViewUser(user) : undefined} />}

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

      <UserAssignRoleModal isOpen={assignRoleModalOpen} onClose={() => { setAssignRoleModalOpen(false); setAssigningUser(null); }} user={assigningUser} onSuccess={() => loadUsers()} />
      
      <UserAssignRankModal 
        isOpen={assignRankModalOpen} 
        onClose={() => { setAssignRankModalOpen(false); setRankingUser(null); }} 
        user={rankingUser} 
        onSuccess={() => loadUsers()} 
      />

      <UserSignatureModal 
        isOpen={signatureModalOpen} 
        onClose={() => { setSignatureModalOpen(false); setSigningUser(null); }} 
        user={signingUser} 
        onSuccess={() => loadUsers()} 
      />

      <InstructorAssignWingModal 
        isOpen={assignWingModalOpen} 
        onClose={() => { setAssignWingModalOpen(false); setAssigningWingUser(null); }} 
        instructor={assigningWingUser} 
        onSuccess={() => loadUsers()} 
      />

      <CadetAssignWingModal 
        isOpen={assignCadetWingModalOpen} 
        onClose={() => { setAssignCadetWingModalOpen(false); setAssigningCadetWingUser(null); }} 
        user={assigningCadetWingUser} 
        onSuccess={() => loadUsers()} 
      />
    </div>
  );
}
