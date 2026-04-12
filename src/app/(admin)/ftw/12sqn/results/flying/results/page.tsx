"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnFlyingExaminationMarkService } from "@/libs/services/ftw12sqnFlyingExaminationMarkService";
import type { Ftw12sqnFlyingExaminationMark } from "@/libs/types/ftw12sqnExamination";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { useAuth } from "@/context/AuthContext";

interface SemesterRow {
  id: string;
  course_id: number | null;
  course_name: string | null;
  course_code: string | null;
  semester_id: number | null;
  semester_name: string | null;
  semester_code: string | null;
  total_cadets: number;
  total_marks: number;
}

const formatDate = (date?: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const TableLoading = () => (
  <div className="w-full min-h-[20vh] flex items-center justify-center">
    <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
  </div>
);

export default function Ftw12sqnFlyingExaminationMarksPage() {
  const router = useRouter();
  const { user, userIsInstructor } = useAuth();
  const isInstructor = userIsInstructor;

  // ── Instructor view ────────────────────────────────────────────────────
  const [marks, setMarks] = useState<Ftw12sqnFlyingExaminationMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0,
  });

  // ── Non-instructor grouped view ────────────────────────────────────────
  const [rows, setRows] = useState<SemesterRow[]>([]);
  const [groupedLoading, setGroupedLoading] = useState(true);

  // ── Delete modal ───────────────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingMark, setDeletingMark] = useState<Ftw12sqnFlyingExaminationMark | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Load instructor's own marks (paginated) ────────────────────────────
  const loadMarks = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await ftw12sqnFlyingExaminationMarkService.getAllMarks({
        page: currentPage,
        per_page: perPage,
        instructor_id: user.id,
      });
      setMarks(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load marks:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, user?.id]);

  // ── Load grouped semester rows (non-instructor) ────────────────────────
  const loadGrouped = useCallback(async () => {
    try {
      setGroupedLoading(true);
      const response = await ftw12sqnFlyingExaminationMarkService.getSemesterGrouped();
      const flattenedRows: SemesterRow[] = [];
      response.forEach((courseData) => {
        courseData.semester_details.forEach((semesterData) => {
          flattenedRows.push({
            id: `${courseData.course_details.id}-${semesterData.semester_info.id}`,
            course_id: courseData.course_details.id,
            course_name: courseData.course_details.name,
            course_code: courseData.course_details.code,
            semester_id: semesterData.semester_info.id,
            semester_name: semesterData.semester_info.name,
            semester_code: semesterData.semester_info.code,
            total_cadets: semesterData.total_cadets,
            total_marks: semesterData.total_marks,
          });
        });
      });
      setRows(flattenedRows);
    } catch (error) {
      console.error("Failed to load grouped marks:", error);
    } finally {
      setGroupedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInstructor) {
      loadMarks();
    } else {
      loadGrouped();
    }
  }, [isInstructor, loadMarks, loadGrouped]);

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDeleteMark = (mark: Ftw12sqnFlyingExaminationMark) => {
    setDeletingMark(mark);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingMark) return;
    try {
      setDeleteLoading(true);
      await ftw12sqnFlyingExaminationMarkService.deleteMark(deletingMark.id);
      await loadMarks();
      setDeleteModalOpen(false);
      setDeletingMark(null);
    } catch {
      alert("Failed to delete mark");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePerPageChange = (value: number) => { setPerPage(value); setCurrentPage(1); };

  // ── Instructor columns ─────────────────────────────────────────────────
  const markColumns: Column<Ftw12sqnFlyingExaminationMark>[] = [
    {
      key: "sl", header: "SL.", headerAlign: "center", className: "text-center text-gray-900 w-14",
      render: (_, index) => (pagination.from || 0) + (index),
    },
    {
      key: "course", header: "Course",
      render: (m) => (
        <div>
          <div className="font-medium text-gray-900">{m.course?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">{m.course?.code || ""}</div>
        </div>
      ),
    },
    {
      key: "semester", header: "Semester",
      render: (m) => (
        <div>
          <div className="font-medium text-gray-900">{m.semester?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">{m.semester?.code || ""}</div>
        </div>
      ),
    },
    {
      key: "mission", header: "Mission",
      render: (m) => (
        <div>
          <div className="font-medium text-gray-900">{m.syllabus?.phase_shortname || "N/A"}</div>
          {m.exercise && <div className="text-xs text-gray-500">{m.exercise.exercise_name}</div>}
        </div>
      ),
    },
    {
      key: "cadet", header: "Cadet",
      render: (m) => (
        <div>
          <div className="font-medium text-gray-900">{m.cadet?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">
            {m.cadet?.bdno || m.cadet?.bd_no || m.cadet?.cadet_number || ""}
          </div>
        </div>
      ),
    },
    {
      key: "phase_type", header: "Type", className: "text-gray-700",
      render: (m) => m.phaseType?.type_name || m.phase_type?.type_name || "N/A",
    },
    {
      key: "achieved_mark", header: "Mark", headerAlign: "center", className: "text-center",
      render: (m) => (
        <span className="inline-flex items-center px-2 py-0.5 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
          {m.is_present
            ? (m.achieved_mark || m.achieved_time || "—")
            : <span className="text-red-500">Absent</span>}
        </span>
      ),
    },
    {
      key: "participate_date", header: "Date", className: "text-gray-700 text-sm",
      render: (m) => formatDate(m.participate_date),
    },
    {
      key: "actions", header: "Actions", headerAlign: "center", className: "text-center no-print",
      render: (m) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => router.push(`/ftw/12sqn/results/flying/results/${m.id}`)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View">
            <Icon icon="hugeicons:view" className="w-4 h-4" />
          </button>
          <button onClick={() => router.push(`/ftw/12sqn/results/flying/results/${m.id}/edit`)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
          </button>
          <button onClick={() => handleDeleteMark(m)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
            <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // ── Non-instructor columns (grouped) ───────────────────────────────────
  const groupedColumns: Column<SemesterRow>[] = [
    {
      key: "sl", header: "SL.", headerAlign: "center", className: "text-center text-gray-900 w-14",
      render: (_, index) => index,
    },
    {
      key: "course", header: "Course", className: "font-medium text-gray-900",
      render: (row) => (
        <div>
          <div className="font-semibold">{row.course_name}</div>
          <div className="text-xs text-gray-500">{row.course_code}</div>
        </div>
      ),
    },
    {
      key: "semester", header: "Semester", className: "text-gray-700",
      render: (row) => (
        <div>
          <div>{row.semester_name}</div>
          {row.semester_code && <div className="text-xs text-gray-500">{row.semester_code}</div>}
        </div>
      ),
    },
    {
      key: "total_cadets", header: "Total Cadets", headerAlign: "center", className: "text-center",
      render: (row) => (
        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
          {row.total_cadets}
        </span>
      ),
    },
    {
      key: "total_marks", header: "Total Marks", headerAlign: "center", className: "text-center",
      render: (row) => (
        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
          {row.total_marks}
        </span>
      ),
    },
    {
      key: "actions", header: "Actions", headerAlign: "center", className: "text-center no-print",
      render: (row) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => router.push(`/ftw/12sqn/results/flying/results/course/${row.course_id}/semester/${row.semester_id}`)}
            className="px-3 py-1.5 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
          >
            <Icon icon="hugeicons:view" className="w-4 h-4" /> View
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 12SQN Flying Examination Results</h2>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div />
        <div className="flex items-center gap-3">
          {isInstructor && (
            <button
              onClick={() => router.push("/ftw/12sqn/results/flying/results/create")}
              className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
            >
              <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Mark
            </button>
          )}
          <button
            onClick={() => console.log("Export")}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"
          >
            <Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export
          </button>
        </div>
      </div>

      {/* Tables */}
      {isInstructor ? (
        loading ? <TableLoading /> : (
          <>
            <DataTable
              columns={markColumns}
              data={marks}
              keyExtractor={(m) => m.id.toString()}
              emptyMessage="No flying examination marks found"
            />
            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results
                </div>
                <select
                  value={perPage}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                >
                  {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n} per page</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />Prev
                </button>
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 text-sm rounded-lg ${currentPage === page ? "bg-blue-600 text-white" : "border border-black hover:bg-gray-50"}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                  disabled={currentPage === pagination.last_page}
                  className="px-4 py-2 text-sm border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next<Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          </>
        )
      ) : (
        groupedLoading ? <TableLoading /> : (
          <DataTable
            columns={groupedColumns}
            data={rows}
            keyExtractor={(row) => row.id}
            emptyMessage="No flying examination results found"
            onRowClick={(row) => router.push(`/ftw/12sqn/results/flying/results/course/${row.course_id}/semester/${row.semester_id}`)}
          />
        )
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Mark"
        message={`Are you sure you want to delete this examination mark for "${deletingMark?.cadet?.name || "this cadet"}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
