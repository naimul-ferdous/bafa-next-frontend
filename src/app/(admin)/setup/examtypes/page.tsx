"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SystemExam } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { examService } from "@/libs/services/examService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { ExamModalProvider, useExamModal } from "@/context/ExamModalContext";
import ExamFormModal from "@/components/exams/ExamFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

function ExamsPageContent() {
  const { openModal } = useExamModal();
  const [exams, setExams] = useState<SystemExam[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Status toggle modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusExam, setStatusExam] = useState<SystemExam | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });

  const loadExams = useCallback(async () => {
    try {
      setLoading(true);
      const response = await examService.getAllExams({ page: currentPage, per_page: perPage, search: searchTerm || undefined });
      setExams(response.data);
      setPagination({ current_page: response.current_page, last_page: response.last_page, per_page: response.per_page, total: response.total, from: response.from, to: response.to });
    } catch (error) {
      console.error("Failed to load exam types:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => { loadExams(); }, [loadExams]);
  useEffect(() => {
    const handleExamUpdate = () => loadExams();
    window.addEventListener('examUpdated', handleExamUpdate);
    return () => window.removeEventListener('examUpdated', handleExamUpdate);
  }, [loadExams]);

  const handleAddExam = () => openModal();
  const handleEditExam = (exam: SystemExam) => openModal(exam);
  const handleViewExam = (exam: SystemExam) => openModal(exam);

  const handleToggleStatus = (exam: SystemExam) => {
    setStatusExam(exam);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusExam) return;

    try {
      setStatusLoading(true);
      await examService.updateExam(statusExam.id, {
        name: statusExam.name,
        code: statusExam.code,
        is_active: !statusExam.is_active
      });
      await loadExams();
      setStatusModalOpen(false);
      setStatusExam(null);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExport = () => console.log("Export exams");
  const handleSearchChange = (value: string) => { setSearchTerm(value); setCurrentPage(1); };
  const handlePerPageChange = (value: number) => { setPerPage(value); setCurrentPage(1); };

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  const columns: Column<SystemExam>[] = [
    { key: "id", header: "SL.", className: "text-center text-gray-900", render: (exam, index) => (pagination.from || 0) + (index) },
    { key: "name", header: "Exam Type Name", className: "font-medium text-gray-900" },
    { key: "code", header: "Code", className: "text-gray-700 font-mono text-sm" },
    { key: "description", header: "Description", className: "text-gray-700", render: (exam) => (
      <span className="line-clamp-2">{exam.description || "—"}</span>
    )},
    { key: "is_active", header: "Status", className: "text-center", render: (exam) => (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${exam.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
        {exam.is_active ? "Active" : "Inactive"}
      </span>
    )},
    { key: "created_at", header: "Created At", className: "text-gray-700", render: (exam) => exam.created_at ? new Date(exam.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
    { key: "actions", header: "Actions", headerAlign: "center", className: "text-center no-print", render: (exam) => (
      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => handleEditExam(exam)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
        {exam.is_active ? (
          <button
            onClick={() => handleToggleStatus(exam)}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Deactivate"
          >
            <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => handleToggleStatus(exam)}
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
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">All Exam Types List</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by exam type name, code..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAddExam} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Exam Type</button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-gray-700 flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 transition-all"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {loading ? <TableLoading /> : <DataTable columns={columns} data={exams} keyExtractor={(exam) => exam.id.toString()} emptyMessage="No exam types found" onRowClick={handleViewExam} />}

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

      <ExamFormModal />
      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusExam?.is_active ? "Deactivate Exam Type" : "Activate Exam Type"}
        message={`Are you sure you want to ${statusExam?.is_active ? "deactivate" : "activate"} the exam type "${statusExam?.name}"?`}
        confirmText={statusExam?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusExam?.is_active ? "danger" : "success"}
      />
    </div>
  );
}

export default function ExamsPage() {
  return (
    <ExamModalProvider>
      <ExamsPageContent />
    </ExamModalProvider>
  );
}
