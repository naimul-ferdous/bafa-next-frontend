/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AtwSubjectModule } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { atwSubjectModuleService } from "@/libs/services/atwSubjectModuleService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import { useCan } from "@/context/PagePermissionsContext";

export default function AtwSubjectModulesPage() {
  const router = useRouter();
  const { user, userIsSystemAdmin } = useAuth();
  const can = useCan();
  const [subjects, setSubjects] = useState<AtwSubjectModule[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [statusSubject, setStatusSubject] = useState<AtwSubjectModule | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const isInstructor = !!user?.instructor_biodata && !userIsSystemAdmin;

  const loadSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await atwSubjectModuleService.getAllSubjects({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });

      let subjectsData = response.data;

      if (isInstructor && user?.atw_assigned_subjects) {
        const assignedSubjectIds = user.atw_assigned_subjects.map((as: any) => as.subject_id);
        subjectsData = subjectsData.filter(s => assignedSubjectIds.includes(s.id));
      }

      setSubjects(subjectsData);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load subjects:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, isInstructor, user?.atw_assigned_subjects]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const handleAddSubject = () => router.push("/atw/subjects/modules/create");
  const handleEditSubject = (subject: AtwSubjectModule) => router.push(`/atw/subjects/modules/${subject.id}/edit`);
  const handleViewSubject = (subject: AtwSubjectModule) => router.push(`/atw/subjects/modules/${subject.id}`);

  const handleToggleStatus = (subject: AtwSubjectModule) => {
    setStatusSubject(subject);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusSubject) return;
    try {
      setStatusLoading(true);
      await atwSubjectModuleService.updateSubject(statusSubject.id, {
        is_active: !statusSubject.is_active,
      });
      await loadSubjects();
      setStatusModalOpen(false);
      setStatusSubject(null);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  const columns: Column<AtwSubjectModule>[] = [
    {
      key: "id",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900",
      render: (subject, index) => (pagination.from || 0) + (index)
    },
    { key: "subject_name", header: "Subject Name", className: "font-medium text-gray-900" },
    { key: "subject_code", header: "Code", className: "text-gray-700 font-mono text-sm" },
    {
      key: "subject_legend",
      header: "Legend",
      headerAlign: "center",
      className: "text-gray-700 text-center text-sm",
      render: (subject) => subject.subject_legend || "—"
    },
    {
      key: "subjects_full_mark",
      header: "Full Mark",
      headerAlign: "center",
      className: "text-gray-700 text-center",
      render: (subject) => subject.subjects_full_mark
    },
    {
      key: "subjects_credit",
      header: "Credit",
      headerAlign: "center",
      className: "text-gray-700 text-center",
      render: (subject) => subject.subjects_credit
    },
    {
      key: "subject_marks",
      header: "Marks Distribution",
      className: "max-w-xs",
      render: (subject) => (
        <div className="flex flex-wrap gap-1.5">
          {subject.subject_marks && subject.subject_marks.length > 0 ? (
            subject.subject_marks.map((mark, idx) => {
              let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
              const type = mark.type?.toLowerCase() || "";
              if (type.includes("test")) colorClass = "bg-blue-50 text-blue-700 border-blue-100";
              else if (type.includes("assignment")) colorClass = "bg-purple-50 text-purple-700 border-purple-100";
              else if (type.includes("semester")) colorClass = "bg-amber-50 text-amber-700 border-amber-100";
              else if (type.includes("viva") || type.includes("presentation")) colorClass = "bg-indigo-50 text-indigo-700 border-indigo-100";
              else if (type.includes("attendance")) colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${colorClass}`}
                  title={`${mark.name}: ${mark.percentage}% (${mark.estimate_mark} marks)`}
                >
                  {mark.name} : {Number(mark.percentage).toFixed(0)}
                </span>
              );
            })
          ) : (
            <span className="text-gray-400 text-xs italic">Not Set</span>
          )}
        </div>
      )
    },
    {
      key: "is_active",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (subject) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full ${subject.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {subject.is_active ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center" as const,
      className: "text-center no-print",
      render: (subject: AtwSubjectModule) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          {can('edit') ? (
            <button onClick={() => handleEditSubject(subject)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
              <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            </button>
          ) : null}

          {can('delete') ? (
            <>
              {subject.is_active ? (
                <button
                  onClick={() => handleToggleStatus(subject)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Deactivate"
                >
                  <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleToggleStatus(subject)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Activate"
                >
                  <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
                </button>
              )}
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">ATW Subject Modules</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by subject name, code..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-3">
          {!isInstructor && (
            <button onClick={handleAddSubject} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
              <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
              Add Subject Module
            </button>
          )}
        </div>
      </div>

      {loading ? <TableLoading /> : (
        <DataTable
          columns={columns}
          data={subjects}
          keyExtractor={(subject) => subject.id.toString()}
          emptyMessage="No subject modules found"
          onRowClick={handleViewSubject}
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
        onPerPageChange={(val) => {
          setPerPage(val);
          setCurrentPage(1);
        }}
      />

      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusSubject?.is_active ? "Deactivate Subject Module" : "Activate Subject Module"}
        message={`Are you sure you want to ${statusSubject?.is_active ? "deactivate" : "activate"} "${statusSubject?.subject_name}"?`}
        confirmText={statusSubject?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusSubject?.is_active ? "danger" : "success"}
      />
    </div>
  );
}
