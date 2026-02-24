"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AtwResultApprovalAuthority } from "@/libs/types/atwApproval";
import { Icon } from "@iconify/react";
import { atwApprovalService } from "@/libs/services/atwApprovalService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import AtwApprovalAuthorityModal from "@/components/atw-results/AtwApprovalAuthorityModal";

export default function AtwApprovalAuthoritiesPage() {
  const [authorities, setAuthorities] = useState<AtwResultApprovalAuthority[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthority, setEditingAuthority] = useState<AtwResultApprovalAuthority | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAuthority, setDeletingAuthority] = useState<AtwResultApprovalAuthority | null>(null);
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

  const loadAuthorities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await atwApprovalService.getAuthorities({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });
      
      // Handle both structured pagination and flat array
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
      } else if (Array.isArray(response)) {
        setAuthorities(response);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: response.length,
          total: response.length,
          from: 1,
          to: response.length,
        });
      }
    } catch (error) {
      console.error("Failed to load authorities:", error);
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

  const handleEditAuthority = (authority: AtwResultApprovalAuthority) => {
    setEditingAuthority(authority);
    setModalOpen(true);
  };

  const handleDeleteAuthority = (authority: AtwResultApprovalAuthority) => {
    setDeletingAuthority(authority);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAuthority) return;
    try {
      setDeleteLoading(true);
      await atwApprovalService.deleteAuthority(deletingAuthority.id);
      await loadAuthorities();
      setDeleteModalOpen(false);
      setDeletingAuthority(null);
    } catch (error) {
      console.error("Failed to delete authority:", error);
      alert("Failed to delete authority");
    } finally {
      setDeleteLoading(false);
    }
  };

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

  const columns: Column<AtwResultApprovalAuthority>[] = [
    {
      key: "id",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900",
      render: (_, index) => (pagination.from || 0) + index,
    },
    {
      key: "role",
      header: "Role",
      render: (auth) => (
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {auth.role?.name || "N/A"}
        </span>
      ),
    },
    {
      key: "permissions",
      header: "Permissions",
      render: (auth) => (
        <div className="flex flex-wrap gap-1">
          {auth.is_cadet_approve && <span className="px-1.5 py-0.5 text-[10px] bg-green-50 text-green-700 border border-green-200 rounded">Cadet Approve</span>}
          {auth.is_forward && <span className="px-1.5 py-0.5 text-[10px] bg-orange-50 text-orange-700 border border-orange-200 rounded">Forward</span>}
          {auth.is_final && <span className="px-1.5 py-0.5 text-[10px] bg-red-50 text-red-700 border border-red-200 rounded">Final</span>}
          {auth.is_initial_cadet_approve && <span className="px-1.5 py-0.5 text-[10px] bg-teal-50 text-teal-700 border border-teal-200 rounded">Initial Cadet Approve</span>}
          {auth.is_initial_forward && <span className="px-1.5 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">Initial Forward</span>}
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (auth) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${auth.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {auth.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (auth) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => handleEditAuthority(auth)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          <button onClick={() => handleDeleteAuthority(auth)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">ATW Approval Authority Management</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search authorities..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAddAuthority} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
            Add Authority
          </button>
        </div>
      </div>

      {loading ? (
        <TableLoading />
      ) : (
        <DataTable
          columns={columns}
          data={authorities}
          keyExtractor={(auth) => auth.id.toString()}
          emptyMessage="No approval authorities found"
        />
      )}

      {pagination.last_page > 1 && (
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
      )}

      <AtwApprovalAuthorityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadAuthorities}
        authority={editingAuthority}
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Authority"
        message={`Are you sure you want to delete this approval authority? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
