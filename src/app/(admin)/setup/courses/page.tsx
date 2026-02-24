"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SystemCourse } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { courseService } from "@/libs/services/courseService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { CourseModalProvider, useCourseModal } from "@/context/CourseModalContext";
import CourseFormModal from "@/components/courses/CourseFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";

function CoursesPageContent() {
  const { openModal } = useCourseModal();
  const [courses, setCourses] = useState<SystemCourse[]>([]);
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
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Listen for course updates
  useEffect(() => {
    const handleCourseUpdate = () => loadCourses();
    window.addEventListener('courseUpdated', handleCourseUpdate);
    return () => window.removeEventListener('courseUpdated', handleCourseUpdate);
  }, [loadCourses]);

  const handleAddCourse = () => {
    openModal();
  };

  const handleEditCourse = (course: SystemCourse) => {
    openModal(course);
  };

  const handleViewCourse = (course: SystemCourse) => {
    openModal(course);
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

  const handleExport = () => {
    console.log("Export courses");
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Table skeleton loader
  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div>
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
      </div>
    </div>
  );

  // Define table columns
  const columns: Column<SystemCourse>[] = [
    {
      key: "id",
      header: "SL.",
      className: "text-center text-gray-900",
      render: (course, index) => (pagination.from || 0) + (index + 1),
    },
    {
      key: "name",
      header: "Course Name",
      className: "font-medium text-gray-900",
    },
    {
      key: "code",
      header: "Code",
      className: "text-gray-700 font-mono text-sm",
    },
    {
      key: "description",
      header: "Description",
      className: "text-gray-700",
      render: (course) => (
        <span className="line-clamp-2">
          {course.description || "—"}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      className: "text-center",
      render: (course) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
            course.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {course.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      className: "text-gray-700",
      render: (course) =>
        course.created_at
          ? new Date(course.created_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (course) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEditCourse(course)}
            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
            title="Edit"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
          </button>
          {course.is_active ? (
            <button
              onClick={() => handleToggleStatus(course)}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Deactivate"
            >
              <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus(course)}
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
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <FullLogo />
        </div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
          Bangladesh Air Force Academy
        </h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">
          All Courses List
        </h2>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by course name, code..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleAddCourse} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95">
            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
            Add Course
          </button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-gray-700 flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
            <Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableLoading />
      ) : (
        <DataTable
          columns={columns}
          data={courses}
          keyExtractor={(course) => course.id.toString()}
          emptyMessage="No courses found"
          onRowClick={handleViewCourse}
        />
      )}

      {/* Pagination */}
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

      {/* Course Form Modal */}
      <CourseFormModal />

      {/* Status Toggle Confirmation Modal */}
      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusCourse?.is_active ? "Deactivate Course" : "Activate Course"}
        message={`Are you sure you want to ${statusCourse?.is_active ? "deactivate" : "activate"} the course "${statusCourse?.name}"?`}
        confirmText={statusCourse?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusCourse?.is_active ? "danger" : "success"}
      />
    </div>
  );
}

export default function CoursesPage() {
  return (
    <CourseModalProvider>
      <CoursesPageContent />
    </CourseModalProvider>
  );
}
