"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnGroundExaminationMarkService } from "@/libs/services/ftw12sqnGroundExaminationMarkService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";

// Flattened row type for the table
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

export default function Ftw12sqnGroundExaminationMarksPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SemesterRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMarks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ftw12sqnGroundExaminationMarkService.getSemesterGrouped();

      // Flatten the grouped data into table rows
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
      console.error("Failed to load ground examination marks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarks();
  }, [loadMarks]);

  const handleAddMark = () => router.push("/ftw/12sqn/results/ground/results/create");
  const handleExport = () => console.log("Export ground examination marks");

  const handleViewDetails = (row: SemesterRow) => {
    // Navigate to detailed view with course and semester in URL path
    router.push(`/ftw/12sqn/results/ground/results/course/${row.course_id}/semester/${row.semester_id}`);
  };

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  const columns: Column<SemesterRow>[] = [
    {
      key: "sl",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900 w-16",
      render: (row, index) => index + 1
    },
    {
      key: "course",
      header: "Course",
      className: "font-medium text-gray-900",
      render: (row) => (
        <div>
          <div className="font-semibold">{row.course_name}</div>
          <div className="text-xs text-gray-500">{row.course_code}</div>
        </div>
      )
    },
    {
      key: "semester",
      header: "Semester",
      className: "text-gray-700",
      render: (row) => (
        <div>
          <div>{row.semester_name}</div>
          {row.semester_code && <div className="text-xs text-gray-500">{row.semester_code}</div>}
        </div>
      )
    },
    {
      key: "total_cadets",
      header: "Total Cadets",
      headerAlign: "center",
      className: "text-center",
      render: (row) => (
        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
          {row.total_cadets}
        </span>
      )
    },
    {
      key: "total_marks",
      header: "Total Marks",
      headerAlign: "center",
      className: "text-center",
      render: (row) => (
        <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
          {row.total_marks}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleViewDetails(row)}
            className="px-3 py-1.5 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
            title="View Details"
          >
            <Icon icon="hugeicons:view" className="w-4 h-4" />
            View
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 12sqn Ground Examination Results</h2>
      </div>

      <div className="flex items-center justify-end gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleAddMark} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Mark
          </button>
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700">
            <Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />Export
          </button>
        </div>
      </div>

      {loading ? (
        <TableLoading />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.id}
          emptyMessage="No ground examination results found"
          onRowClick={handleViewDetails}
        />
      )}
    </div>
  );
}
