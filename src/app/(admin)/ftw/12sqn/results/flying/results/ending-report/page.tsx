"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnFlyingExaminationMarkService } from "@/libs/services/ftw12sqnFlyingExaminationMarkService";
import { courseService } from "@/libs/services/courseService";
import { semesterService } from "@/libs/services/semesterService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";

interface Course {
  id: number;
  name: string;
  code: string;
}

interface Semester {
  id: number;
  name: string;
  code: string;
}

interface CadetRow {
  id: string;
  cadet_id: number;
  bd_no: string;
  rank: string;
  name: string;
  course_name: string;
  semester_name: string;
  semester_id: number | null;
  total_examinations: number;
  total_achieved_marks: number;
  average_mark: number;
  highest_mark: number;
  lowest_mark: number;
  pass_count: number;
  fail_count: number;
}

export default function Ftw12sqnFlyingEndingReportPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CadetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);

  // Load courses and semesters
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [coursesRes, semestersRes] = await Promise.all([
          courseService.getAllCourses({ allData: true }),
          semesterService.getAllSemesters({ allData: true }),
        ]);
        setCourses(coursesRes.data || []);
        setSemesters(semestersRes.data || []);
      } catch (error) {
        console.error("Failed to load filters:", error);
      }
    };
    loadFilters();
  }, []);

  const loadResults = useCallback(async () => {
    if (!selectedCourseId) {
      setRows([]);
      return;
    }

    try {
      setLoading(true);
      const response = await ftw12sqnFlyingExaminationMarkService.getAllMarks({
        course_id: selectedCourseId,
        ...(selectedSemesterId ? { semester_id: selectedSemesterId } : {}),
        per_page: 1000,
      });

      if (!response.data || response.data.length === 0) {
        setRows([]);
        return;
      }

      // Group marks by cadet
      const cadetMap = new Map<number, {
        cadet_id: number;
        bd_no: string;
        rank: string;
        name: string;
        course_name: string;
        semester_name: string;
        semester_id: number | null;
        marks: number[];
      }>();

      response.data.forEach((mark) => {
        const cadetId = mark.cadet?.id;
        if (!cadetId) return;

        if (!cadetMap.has(cadetId)) {
          cadetMap.set(cadetId, {
            cadet_id: cadetId,
            bd_no: mark.cadet?.bd_no || mark.cadet?.cadet_number || mark.cadet?.bdno || "",
            rank: mark.cadet?.rank?.name || "",
            name: mark.cadet?.name || "",
            course_name: mark.course?.name || "",
            semester_name: mark.semester?.name || "",
            semester_id: mark.semester?.id || null,
            marks: [],
          });
        }

        const achievedMark = parseFloat(mark.achieved_mark || "0");
        if (!isNaN(achievedMark)) {
          cadetMap.get(cadetId)!.marks.push(achievedMark);
        }
      });

      // Calculate stats for each cadet
      const flattenedRows: CadetRow[] = Array.from(cadetMap.values()).map((cadetData, index) => {
        const validMarks = cadetData.marks.filter(m => m > 0);
        const totalAchieved = validMarks.reduce((sum, m) => sum + m, 0);
        const avgMark = validMarks.length > 0 ? totalAchieved / validMarks.length : 0;
        const highestMark = validMarks.length > 0 ? Math.max(...validMarks) : 0;
        const lowestMark = validMarks.length > 0 ? Math.min(...validMarks) : 0;
        const passCount = validMarks.filter(m => m >= 60).length;
        const failCount = validMarks.filter(m => m > 0 && m < 60).length;

        return {
          id: `${cadetData.cadet_id}-${index}`,
          cadet_id: cadetData.cadet_id,
          bd_no: cadetData.bd_no,
          rank: cadetData.rank,
          name: cadetData.name,
          course_name: cadetData.course_name,
          semester_name: cadetData.semester_name,
          semester_id: cadetData.semester_id,
          total_examinations: cadetData.marks.length,
          total_achieved_marks: totalAchieved,
          average_mark: avgMark,
          highest_mark: highestMark,
          lowest_mark: lowestMark,
          pass_count: passCount,
          fail_count: failCount,
        };
      });

      // Sort by bd_no
      flattenedRows.sort((a, b) => a.bd_no.localeCompare(b.bd_no));

      setRows(flattenedRows);
    } catch (error) {
      console.error("Failed to load flying examination results:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, selectedSemesterId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handlePrint = () => window.print();

  const handleCadetClick = (row: CadetRow) => {
    router.push(`/ftw/12sqn/results/flying/results/ending-report/cadet/${row.cadet_id}`);
  };

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  const columns: Column<CadetRow>[] = [
    {
      key: "sl",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900 w-16",
      render: (row, index) => index + 1
    },
    {
      key: "bd_no",
      header: "BD No",
      headerAlign: "center",
      className: "text-center font-medium text-gray-900",
      render: (row) => row.bd_no || "-"
    },
    {
      key: "rank",
      header: "Rank",
      headerAlign: "center",
      className: "text-center text-gray-700",
      render: (row) => row.rank || "-"
    },
    {
      key: "name",
      header: "Name",
      className: "font-medium text-gray-900",
      render: (row) => row.name || "-"
    },
    {
      key: "total_examinations",
      header: "Total Exams",
      headerAlign: "center",
      className: "text-center",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
          {row.total_examinations}
        </span>
      )
    },
    {
      key: "total_achieved_marks",
      header: "Total Marks",
      headerAlign: "center",
      className: "text-center",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
          {row.total_achieved_marks.toFixed(2)}
        </span>
      )
    },
    {
      key: "average_mark",
      header: "Average",
      headerAlign: "center",
      className: "text-center",
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full ${
          row.average_mark >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.average_mark.toFixed(2)}
        </span>
      )
    },
    {
      key: "highest_mark",
      header: "Highest",
      headerAlign: "center",
      className: "text-center",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
          {row.highest_mark.toFixed(2)}
        </span>
      )
    },
    {
      key: "lowest_mark",
      header: "Lowest",
      headerAlign: "center",
      className: "text-center",
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full ${
          row.lowest_mark >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.lowest_mark.toFixed(2)}
        </span>
      )
    },
    {
      key: "pass_count",
      header: "Pass",
      headerAlign: "center",
      className: "text-center",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
          {row.pass_count}
        </span>
      )
    },
    {
      key: "fail_count",
      header: "Fail",
      headerAlign: "center",
      className: "text-center",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
          {row.fail_count}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (row) => (
        <button
          onClick={() => handleCadetClick(row)}
          className="px-3 py-1.5 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1 mx-auto"
          title="View Cadet Details"
        >
          <Icon icon="hugeicons:view" className="w-4 h-4" />
          View
        </button>
      )
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 12SQN Flying Examination Ending Report</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Course:</label>
          <select
            value={selectedCourseId || ""}
            onChange={(e) => setSelectedCourseId(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Semester:</label>
          <select
            value={selectedSemesterId || ""}
            onChange={(e) => setSelectedSemesterId(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Semesters</option>
            {semesters.map((sem) => (
              <option key={sem.id} value={sem.id}>
                {sem.name} ({sem.code})
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4 mr-2" />Print
          </button>
        </div>
      </div>

      {/* Results Summary */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm text-blue-700 font-medium">Total Cadets: {rows.length}</span>
          </div>
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-sm text-green-700 font-medium">
              Class Average: {(rows.reduce((sum, r) => sum + r.average_mark, 0) / rows.length).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      {!selectedCourseId ? (
        <div className="w-full min-h-[20vh] flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Icon icon="hugeicons:filter" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Please select a course to view the ending report</p>
          </div>
        </div>
      ) : loading ? (
        <TableLoading />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.id}
          emptyMessage="No flying examination results found for the selected course and semester"
        />
      )}
    </div>
  );
}
