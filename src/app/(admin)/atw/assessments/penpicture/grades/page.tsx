"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AtwAssessmentPenpictureGrade, SystemCourse, SystemSemester } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { atwAssessmentPenpictureGradeService } from "@/libs/services/atwAssessmentPenpictureGradeService";
import { commonService } from "@/libs/services/commonService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

export default function AtwAssessmentPenpictureGradesPage() {
  const router = useRouter();
  const [grades, setGrades] = useState<AtwAssessmentPenpictureGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingGrade, setDeletingGrade] = useState<AtwAssessmentPenpictureGrade | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<number | "">("");
  const [selectedSemester, setSelectedSemester] = useState<number | "">("");
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const options = await commonService.getResultOptions();
        if (options) {
          setCourses(options.courses || []);
          setSemesters(options.semesters || []);
        }
      } catch (err) {
        console.error("Failed to fetch metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  const loadGrades = useCallback(async () => {
    try {
      setLoading(true);
      const response = await atwAssessmentPenpictureGradeService.getAllGrades({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
        course_id: selectedCourse || undefined,
        semester_id: selectedSemester || undefined,
      } as any);
      setGrades(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });
    } catch (error) {
      console.error("Failed to load grades:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, selectedCourse, selectedSemester]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const handleAddGrade = () => router.push("/atw/assessments/penpicture/grades/create");
  const handleEditGrade = (grade: AtwAssessmentPenpictureGrade) => router.push(`/atw/assessments/penpicture/grades/${grade.id}/edit`);
  const handleViewGrade = (grade: AtwAssessmentPenpictureGrade) => router.push(`/atw/assessments/penpicture/grades/${grade.id}`);
  const handleDeleteGrade = (grade: AtwAssessmentPenpictureGrade) => {
    setDeletingGrade(grade);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingGrade) return;
    try {
      setDeleteLoading(true);
      await atwAssessmentPenpictureGradeService.deleteGrade(deletingGrade.id);
      await loadGrades();
      setDeleteModalOpen(false);
      setDeletingGrade(null);
    } catch (error) {
      console.error("Failed to delete grade:", error);
      alert("Failed to delete grade");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = () => console.log("Export grades");
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

  const columns: Column<AtwAssessmentPenpictureGrade>[] = [
    { key: "id", header: "SL.", headerAlign:"center", className: "text-center text-gray-900", render: (grade, index) => (pagination.from || 0) + (index + 1) },
    {
      key: "course",
      header: "Course",
      render: (grade) => (
        <div>
          <div className="font-medium text-gray-900">{grade.course?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">{grade.course?.code || ""}</div>
        </div>
      ),
    },
    { key: "grade_name", header: "Grade Name", className: "font-medium text-gray-900" },
    { key: "grade_code", header: "Grade Code", className: "text-gray-700 font-mono text-sm" },
    {
      key: "semesters",
      header: "Semesters",
      render: (grade) => (
        <div className="flex flex-wrap gap-1">
          {grade.semesters && grade.semesters.length > 0 ? (
            grade.semesters.map((s, i) => (
              <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded border border-purple-100">
                {s.semester?.name}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-xs italic">No semesters assigned</span>
          )}
        </div>
      )
    },
    {
      key: "is_active",
      header: "Status",
      headerAlign:"center",
      className: "text-center",
      render: (grade) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${grade.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {grade.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700 text-sm",
      render: (grade) => grade.created_at ? new Date(grade.created_at).toLocaleDateString("en-GB") : "—"
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (grade) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => handleViewGrade(grade)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
          <button onClick={() => handleEditGrade(grade)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          <button onClick={() => handleDeleteGrade(grade)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">ATW Assessment Pen Picture Grades</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-64">
            <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search by grade name, code..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" />
          </div>
          
          <select
            value={selectedCourse}
            onChange={(e) => { setSelectedCourse(e.target.value ? parseInt(e.target.value) : ""); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-0"
          >
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            value={selectedSemester}
            onChange={(e) => { setSelectedSemester(e.target.value ? parseInt(e.target.value) : ""); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-0"
          >
            <option value="">All Semesters</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleAddGrade} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Grade</button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {loading ? <TableLoading /> : <DataTable columns={columns} data={grades} keyExtractor={(grade) => grade.id.toString()} emptyMessage="No grades found" />}

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

      <ConfirmationModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Delete Grade" message={`Are you sure you want to delete "${deletingGrade?.grade_name}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" loading={deleteLoading} variant="danger" />
    </div>
  );
}
