"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SystemSemester } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { semesterService } from "@/libs/services/semesterService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { SemesterModalProvider, useSemesterModal } from "@/context/SemesterModalContext";
import SemesterFormModal from "@/components/semesters/SemesterFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

function SemestersPageContent() {
  const router = useRouter();
  const { openModal } = useSemesterModal();
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Status toggle modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusSemester, setStatusSemester] = useState<SystemSemester | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });

  const loadSemesters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await semesterService.getAllSemesters({ page: currentPage, per_page: perPage, search: searchTerm || undefined });
      setSemesters(response.data);
      setPagination({ current_page: response.current_page, last_page: response.last_page, per_page: response.per_page, total: response.total, from: response.from, to: response.to });
    } catch (error) {
      console.error("Failed to load semesters:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => { loadSemesters(); }, [loadSemesters]);
  useEffect(() => {
    const handleSemesterUpdate = () => loadSemesters();
    window.addEventListener('semesterUpdated', handleSemesterUpdate);
    return () => window.removeEventListener('semesterUpdated', handleSemesterUpdate);
  }, [loadSemesters]);

  const handleAddSemester = () => openModal();
  const handleEditSemester = (semester: SystemSemester) => openModal(semester);
  const handleViewSemester = (semester: SystemSemester) => router.push(`/setup/semesters/${semester.id}`);
  
  const handleToggleStatus = (semester: SystemSemester) => {
    setStatusSemester(semester);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusSemester) return;

    try {
      setStatusLoading(true);
      await semesterService.updateSemester(statusSemester.id, {
        name: statusSemester.name,
        short_name: statusSemester.short_name,
        start_date: statusSemester.start_date,
        end_date: statusSemester.end_date,
        is_active: !statusSemester.is_active
      });
      await loadSemesters();
      setStatusModalOpen(false);
      setStatusSemester(null);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExport = () => console.log("Export semesters");
  const handleSearchChange = (value: string) => { setSearchTerm(value); setCurrentPage(1); };
  const handlePerPageChange = (value: number) => { setPerPage(value); setCurrentPage(1); };

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  const columns: Column<SystemSemester>[] = [
    { key: "id", header: "SL.", className: "text-center text-gray-900", render: (semester, index) => (pagination.from || 0) + (index) },
    { key: "name", header: "Semester Name", className: "font-medium text-gray-900", render: (semester) => (
      <>{semester.name}{semester.is_current && <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">Current</span>}</>
    )},
    { key: "short_name", header: "Short Name", className: "text-gray-700 font-mono text-sm" },
    { key: "start_date", header: "Start Date", className: "text-gray-700", render: (semester) => new Date(semester.start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
    { key: "end_date", header: "End Date", className: "text-gray-700", render: (semester) => new Date(semester.end_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
    { key: "is_active", header: "Status", className: "text-center", render: (semester) => (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${semester.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
        {semester.is_active ? "Active" : "Inactive"}
      </span>
    )},
    { key: "actions", header: "Actions", headerAlign: "center", className: "text-center no-print", render: (semester) => (
      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => handleEditSemester(semester)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
        {semester.is_active ? (
          <button
            onClick={() => handleToggleStatus(semester)}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Deactivate"
          >
            <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => handleToggleStatus(semester)}
            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Activate"
          >
            <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 shadow-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">All Semesters List</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by semester name, code..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAddSemester} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Semester</button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {loading ? <TableLoading /> : <DataTable columns={columns} data={semesters} keyExtractor={(semester) => semester.id.toString()} emptyMessage="No semesters found" onRowClick={handleViewSemester} />}

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

      <SemesterFormModal />
      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusSemester?.is_active ? "Deactivate Semester" : "Activate Semester"}
        message={`Are you sure you want to ${statusSemester?.is_active ? "deactivate" : "activate"} the semester "${statusSemester?.name}"?`}
        confirmText={statusSemester?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusSemester?.is_active ? "danger" : "success"}
      />
    </div>
  );
}

export default function SemestersPage() {
  return (
    <SemesterModalProvider>
      <SemestersPageContent />
    </SemesterModalProvider>
  );
}
