"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useAuth } from "@/libs/hooks/useAuth";
import { ctwApprovalService } from "@/libs/services/ctwApprovalService";
import { commonService } from "@/libs/services/commonService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { SystemCourse, SystemSemester } from "@/libs/types/system";

interface SemesterRow {
  course_id: number;
  course_name: string;
  course_code: string;
  semester_id: number;
  semester_name: string;
  semester_code: string;
  total_modules: number;
  submitted_modules: number;
  approved_modules: number;
  pending_modules: number;
  has_pending: boolean;
  status: string;
}

export default function CtwResultsViewPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number>(0);
  const [results, setResults] = useState<SemesterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await commonService.getResultOptions();
        setCourses(res.courses);
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setSemesters([]);
      setSelectedSemesterId(0);
      return;
    }
    const loadSemesters = async () => {
      try {
        setLoadingSemesters(true);
        setSelectedSemesterId(0);
        const res = await commonService.getSemestersByCourse(selectedCourseId);
        setSemesters(res);
      } catch (err) {
        console.error("Failed to load semesters:", err);
        setSemesters([]);
      } finally {
        setLoadingSemesters(false);
      }
    };
    loadSemesters();
  }, [selectedCourseId]);

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ctwApprovalService.getSemesterWiseResults({
        course_id: selectedCourseId || undefined,
      });

      const rows: SemesterRow[] = (data || []).map((item: any) => ({
        course_id: item.course_id,
        course_name: item.course?.name || "N/A",
        course_code: item.course?.code || "",
        semester_id: item.semester_id,
        semester_name: item.semester?.name || "N/A",
        semester_code: item.semester?.code || "",
        total_modules: item.total_modules || 0,
        submitted_modules: item.submitted_modules || 0,
        approved_modules: item.approved_modules || 0,
        pending_modules: item.pending_modules || 0,
        has_pending: item.has_pending || false,
        status: item.status || "pending",
      }));

      setResults(rows);
    } catch (err) {
      console.error("Failed to load results:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleViewSemester = (row: SemesterRow) => {
    router.push(`/ctw/results/view/course/${row.course_id}/semester/${row.semester_id}`);
  };

  const columns: Column<SemesterRow>[] = [
    {
      key: "sl",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900",
      render: (_, index) => index + 1,
    },
    {
      key: "course",
      header: "Course",
      className: "font-medium text-gray-900",
      render: (row) => row.course_name,
    },
    {
      key: "semester",
      header: "Semester",
      className: "font-medium text-gray-900",
      render: (row) => row.semester_name,
    },
    {
      key: "modules",
      header: "Modules",
      headerAlign: "center",
      className: "text-center",
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">{row.total_modules} Total</span>
          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">{row.approved_modules} Approved</span>
          {row.pending_modules > 0 && (
            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">{row.pending_modules} Pending</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (row) => {
        if (row.status === "approved") {
          return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-100 text-green-800">APPROVED</span>;
        }
        if (row.has_pending) {
          return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-yellow-100 text-yellow-800">PENDING</span>;
        }
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-gray-100 text-gray-800">NO DATA</span>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (row) => (
        <button
          onClick={() => handleViewSemester(row)}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 mx-auto"
        >
          <Icon icon="hugeicons:view" className="w-3 h-3" /> View Details
        </button>
      ),
    },
  ];

  const filteredResults = selectedCourseId
    ? results.filter(r => r.course_id === selectedCourseId)
    : results;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">CTW Results - Semester Wise Approval</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
            disabled={loadingCourses}
          >
            <option value={0}>{loadingCourses ? "Loading..." : "All Courses"}</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
        <div className="w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Semester</label>
          <select
            value={selectedSemesterId}
            onChange={(e) => setSelectedSemesterId(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
            disabled={!selectedCourseId || loadingSemesters}
          >
            <option value={0}>{loadingSemesters ? "Loading..." : !selectedCourseId ? "Select course first" : "All Semesters"}</option>
            {semesters.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="w-full min-h-[20vh] flex items-center justify-center">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={selectedSemesterId ? filteredResults.filter(r => r.semester_id === selectedSemesterId) : filteredResults}
          keyExtractor={(row) => `${row.course_id}-${row.semester_id}`}
          emptyMessage="No CTW results found"
        />
      )}
    </div>
  );
}
