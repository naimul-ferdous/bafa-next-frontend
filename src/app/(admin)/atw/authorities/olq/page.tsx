"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AtwOlqApprovalAuthority } from "@/libs/types/atwOlqApprovalAuthority";
import { Icon } from "@iconify/react";
import { atwOlqApprovalAuthorityService } from "@/libs/services/atwOlqApprovalAuthorityService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import AtwOlqApprovalAuthorityModal from "@/components/atw-results/AtwOlqApprovalAuthorityModal";
import Pagination from "@/components/ui/Pagination";
import { useCan } from "@/context/PagePermissionsContext";

export default function AtwOlqApprovalAuthoritiesPage() {
  const can = useCan();
  const [authorities, setAuthorities] = useState<AtwOlqApprovalAuthority[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthority, setEditingAuthority] = useState<AtwOlqApprovalAuthority | null>(null);
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

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusAuthority, setStatusAuthority] = useState<AtwOlqApprovalAuthority | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const loadAuthorities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await atwOlqApprovalAuthorityService.getAuthorities({
        page: currentPage,
        per_page: perPage,
      });

      if (response.data && Array.isArray(response.data)) {
        setAuthorities(response.data);
        setPagination({
          current_page: response.current_page || 1,
          last_page: response.last_page || 1,
          per_page: response.per_page || 10,
          total: response.total || response.data.length,
          from: response.from || 1,
          to: response.to || response.data.length,
        });
      }
    } catch (error) {
      console.error("Failed to load OLQ approval authorities:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadAuthorities();
  }, [loadAuthorities]);

  const handleAddAuthority = () => {
    setEditingAuthority(null);
    setModalOpen(true);
  };

  const handleEditAuthority = (authority: AtwOlqApprovalAuthority) => {
    setEditingAuthority(authority);
    setModalOpen(true);
  };

  const handleToggleStatus = (authority: AtwOlqApprovalAuthority) => {
    setStatusAuthority(authority);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusAuthority) return;
    try {
      setStatusLoading(true);
      await atwOlqApprovalAuthorityService.update(statusAuthority.id, {
        is_active: !statusAuthority.is_active,
      });
      await loadAuthorities();
      setStatusModalOpen(false);
      setStatusAuthority(null);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const columns: Column<AtwOlqApprovalAuthority>[] = [
    {
      key: "id",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900",
      render: (_, index) => (pagination.from || 0) + index,
    },
    {
      key: "sort",
      header: "Sort",
      headerAlign: "center",
      className: "text-center text-gray-700 font-mono",
      render: (auth) => auth.sort ?? 0,
    },
    {
      key: "role",
      header: "Role",
      render: (auth) => auth.role ? (
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {auth.role.name}
        </span>
      ) : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      key: "user",
      header: "User",
      render: (auth) => auth.user ? (
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
          {auth.user.name}
        </span>
      ) : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      key: "permissions",
      header: "Permissions",
      render: (auth) => (
        <div className="flex flex-wrap gap-1">
          {auth.is_cadet_approve && (
            <span className="px-1.5 py-0.5 text-[10px] bg-green-50 text-green-700 border border-green-200 rounded">Cadet Approve</span>
          )}
          {auth.is_final && (
            <span className="px-1.5 py-0.5 text-[10px] bg-red-50 text-red-700 border border-red-200 rounded">Final</span>
          )}
          {!auth.is_cadet_approve && !auth.is_final && (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (auth) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full ${auth.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {auth.is_active ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (auth) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          {can('edit') && (
            <button onClick={() => handleEditAuthority(auth)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
              <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            </button>
          )}
          {can('delete') && (
            auth.is_active ? (
              <button onClick={() => handleToggleStatus(auth)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Deactivate">
                <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => handleToggleStatus(auth)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Activate">
                <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
              </button>
            )
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">ATW OLQ Assessment Approval Authority Management</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search authorities..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-3">
          {can('add') && (
            <button onClick={handleAddAuthority} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
              <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
              Add Authority
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="w-full min-h-[20vh] flex items-center justify-center">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={authorities}
          keyExtractor={(auth) => auth.id.toString()}
          emptyMessage="No OLQ approval authorities found"
        />
      )}

      <Pagination
        currentPage={currentPage}
        lastPage={pagination.last_page}
        total={pagination.total}
        from={pagination.from}
        to={pagination.to}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={(val) => { setPerPage(val); setCurrentPage(1); }}
      />

      <AtwOlqApprovalAuthorityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadAuthorities}
        authority={editingAuthority}
      />

      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusAuthority?.is_active ? "Deactivate Authority" : "Activate Authority"}
        message={`Are you sure you want to ${statusAuthority?.is_active ? "deactivate" : "activate"} this OLQ approval authority?`}
        confirmText={statusAuthority?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusAuthority?.is_active ? "danger" : "success"}
      />
    </div>
  );
}
