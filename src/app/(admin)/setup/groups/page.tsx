"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SystemGroup } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { groupService } from "@/libs/services/groupService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { GroupModalProvider, useGroupModal } from "@/context/GroupModalContext";
import GroupFormModal from "@/components/groups/GroupFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

function GroupsPageContent() {
  const { openModal } = useGroupModal();
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Status toggle modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusGroup, setStatusGroup] = useState<SystemGroup | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

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

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const response = await groupService.getAllGroups({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });
      setGroups(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    const handleGroupUpdate = () => loadGroups();
    window.addEventListener('groupUpdated', handleGroupUpdate);
    return () => window.removeEventListener('groupUpdated', handleGroupUpdate);
  }, [loadGroups]);

  const handleAddGroup = () => openModal();
  const handleEditGroup = (group: SystemGroup) => openModal(group);
  const handleViewGroup = (group: SystemGroup) => openModal(group);

  const handleToggleStatus = (group: SystemGroup) => {
    setStatusGroup(group);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusGroup) return;

    try {
      setStatusLoading(true);
      await groupService.updateGroup(statusGroup.id, {
        name: statusGroup.name,
        code: statusGroup.code,
        is_active: !statusGroup.is_active
      });
      await loadGroups();
      setStatusModalOpen(false);
      setStatusGroup(null);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExport = () => console.log("Export groups");
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

  const columns: Column<SystemGroup>[] = [
    { key: "id", header: "SL.", className: "text-center text-gray-900", render: (group, index) => (pagination.from || 0) + (index) },
    { key: "name", header: "Group Name", className: "font-medium text-gray-900" },
    { key: "code", header: "Code", className: "text-gray-700 font-mono text-sm" },
    { key: "capacity", header: "Capacity", className: "text-gray-700 text-center", render: (group) => group.capacity || "—" },
    { key: "current_strength", header: "Current Strength", className: "text-gray-700 text-center", render: (group) => group.current_strength || "—" },
    {
      key: "formation_date",
      header: "Formation Date",
      className: "text-gray-700",
      render: (group) => group.formation_date ? new Date(group.formation_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
    },
    {
      key: "is_active",
      header: "Status",
      className: "text-center",
      render: (group) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${group.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {group.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700",
      render: (group) => group.created_at ? new Date(group.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—",
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (group) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleEditGroup(group)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          {group.is_active ? (
            <button
              onClick={() => handleToggleStatus(group)}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Deactivate"
            >
              <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus(group)}
              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Activate"
            >
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 shadow-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">All Groups List</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by group name, code..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAddGroup} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Group</button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-gray-700 flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 transition-all"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {loading ? <TableLoading /> : <DataTable columns={columns} data={groups} keyExtractor={(group) => group.id.toString()} emptyMessage="No groups found" onRowClick={handleViewGroup} />}

      <Pagination
        currentPage={currentPage}
        lastPage={pagination.last_page}
        total={pagination.total}
        from={pagination.from}
        to={pagination.to}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={handlePerPageChange}
      />

      <GroupFormModal />
      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusGroup?.is_active ? "Deactivate Group" : "Activate Group"}
        message={`Are you sure you want to ${statusGroup?.is_active ? "deactivate" : "activate"} the group "${statusGroup?.name}"?`}
        confirmText={statusGroup?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusGroup?.is_active ? "danger" : "success"}
      />
    </div>
  );
}

export default function GroupsPage() {
  return (
    <GroupModalProvider>
      <GroupsPageContent />
    </GroupModalProvider>
  );
}
