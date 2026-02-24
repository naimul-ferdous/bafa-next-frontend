"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SystemCourse } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { courseService } from "@/libs/services/courseService";
import { cptcService, CptcConsolidatedData } from "@/libs/services/cptcService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { CourseModalProvider, useCourseModal } from "@/context/CourseModalContext";
import CourseFormModal from "@/components/courses/CourseFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

function CptcCTWConsolidatedContent() {
  const router = useRouter();
  const { openModal } = useCourseModal();
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [consolidatedData, setConsolidatedData] = useState<CptcConsolidatedData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Status toggle modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusCourse, setStatusCourse] = useState<SystemCourse | null>(null);
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

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch basic course info for the list
      const response = await courseService.getAllCourses({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
      });
      setCourses(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      });

      // Fetch consolidated results data from backend (includes counts)
      const consolidated = await cptcService.getConsolidatedResults();
      setConsolidatedData(consolidated);
      
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    const handleCourseUpdate = () => loadCourses();
    window.addEventListener('courseUpdated', handleCourseUpdate);
    return () => window.removeEventListener('courseUpdated', handleCourseUpdate);
  }, [loadCourses]);

  const handleAddCourse = () => openModal();
  const handleEditCourse = (course: SystemCourse) => openModal(course);
  const handleViewResults = (course: SystemCourse) => {
    router.push(`/cptc/consolidated/course/${course.id}/ctw`);
  };

  const handleToggleStatus = (course: SystemCourse) => {
    setStatusCourse(course);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusCourse) return;
    try {
      setStatusLoading(true);
      await courseService.updateCourse(statusCourse.id, {
        name: statusCourse.name,
        code: statusCourse.code,
        is_active: !statusCourse.is_active
      });
      await loadCourses();
      setStatusModalOpen(false);
      setStatusCourse(null);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExport = () => console.log("Export courses");
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

  const getBackendCounts = (courseId: number) => {
    const data = consolidatedData.find((c) => c.id === courseId);
    return data?.counts || { semesters: 0, branches: 0, programs: 0, instructors: 0, cadets: 0 };
  };

  const columns: Column<SystemCourse>[] = [
    { key: "id", header: "SL.", className: "text-center text-gray-900", render: (course, index) => (pagination.from || 0) + (index + 1) },
    { key: "name", header: "Course Name", className: "font-medium text-gray-900" },
    { key: "code", header: "Code", className: "text-gray-700 font-mono text-sm" },
    {
      key: "semesters",
      header: "Sems.",
      className: "text-center",
      render: (course) => <span className="font-semibold text-blue-600">{getBackendCounts(course.id).semesters}</span>,
    },
    {
      key: "branches",
      header: "Branches",
      className: "text-center",
      render: (course) => <span className="font-semibold text-purple-600">{getBackendCounts(course.id).branches}</span>,
    },
    {
      key: "programs",
      header: "Programs",
      className: "text-center",
      render: (course) => <span className="font-semibold text-indigo-600">{getBackendCounts(course.id).programs}</span>,
    },
    {
      key: "instructors",
      header: "Insts.",
      className: "text-center",
      render: (course) => <span className="font-semibold text-orange-600">{getBackendCounts(course.id).instructors}</span>,
    },
    {
      key: "cadets",
      header: "Cadets",
      className: "text-center",
      render: (course) => <span className="font-semibold text-green-600">{getBackendCounts(course.id).cadets}</span>,
    },
    {
      key: "is_active",
      header: "Status",
      className: "text-center",
      render: (course) => (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${course.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {course.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 shadow-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">Consolidated Results - Courses</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by course name, code..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAddCourse} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95"><Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Course</button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-gray-700 flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 transition-all"><Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export</button>
        </div>
      </div>

      {loading ? <TableLoading /> : <DataTable columns={columns} data={courses} keyExtractor={(course) => course.id.toString()} emptyMessage="No courses found" onRowClick={handleViewResults} />}

      <Pagination currentPage={currentPage} lastPage={pagination.last_page} total={pagination.total} from={pagination.from} to={pagination.to} perPage={perPage} onPageChange={setCurrentPage} onPerPageChange={handlePerPageChange} />

      <CourseFormModal />
      <ConfirmationModal isOpen={statusModalOpen} onClose={() => setStatusModalOpen(false)} onConfirm={confirmToggleStatus} title={statusCourse?.is_active ? "Deactivate Course" : "Activate Course"} message={`Are you sure you want to ${statusCourse?.is_active ? "deactivate" : "activate"} the course "${statusCourse?.name}"?`} confirmText={statusCourse?.is_active ? "Deactivate" : "Activate"} cancelText="Cancel" loading={statusLoading} variant={statusCourse?.is_active ? "danger" : "success"} />
    </div>
  );
}

export default function CptcCTWConsolidatedPage() {
  return (
    <CourseModalProvider>
      <CptcCTWConsolidatedContent />
    </CourseModalProvider>
  );
}
