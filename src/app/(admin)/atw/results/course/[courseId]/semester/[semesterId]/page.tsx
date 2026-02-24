/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwResultService } from "@/libs/services/atwResultService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";

interface ProgramGroup {
  program: {
    id: number;
    name: string;
  };
  data: any[];
}

interface ApiResponseData {
  course_details: {
    id: number;
    name: string;
    code: string;
  } | null;
  semester_details: {
    id: number;
    name: string;
    code: string;
  } | null;
  results: ProgramGroup[];
}

export default function AtwCourseSemesterResultsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const semesterId = params.semesterId as string;

  const [data, setData] = useState<ApiResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadResults = useCallback(async () => {
    if (!courseId || !semesterId) return;
    try {
      setLoading(true);
      const responseData = await atwResultService.getProgramWiseBySemester(
        parseInt(courseId),
        parseInt(semesterId)
      );
      setData(responseData);
    } catch (error) {
      console.error("Failed to load semester results:", error);
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleBack = () => router.push("/atw/results");
  const handleViewProgramResults = (programId: number) => {
    router.push(`/atw/results/course/${courseId}/semester/${semesterId}/program/${programId}`);
  };

  const summarizedResults = useMemo(() => {
    if (!data || !data.results) return [];
    
    return data.results.map(group => {
      // Extract unique values for chips
      const branches = Array.from(new Set(group.data.map(r => r.branch?.name).filter(Boolean))) as string[];
      const groups = Array.from(new Set(group.data.map(r => r.group?.name).filter(Boolean))) as string[];
      const subjects = Array.from(new Set(group.data.map(r => r.subject?.subject_name).filter(Boolean))) as string[];
      const instructors = Array.from(new Set(group.data.map(r => r.instructor?.name).filter(Boolean))) as string[];
      
      // Calculate total cadets (taking max per result group assuming same cadets, or sum if needed)
      // Based on user feedback, it seems they want to see the count of cadets in that program
      const totalCadets = Math.max(...group.data.map(r => r.total_cadets || 0), 0);

      return {
        id: group.program.id,
        program_name: group.program.name,
        branches,
        groups,
        subjects,
        instructors,
        total_cadets: totalCadets,
        all_results: group.data // Keep original data for reference if needed
      };
    });
  }, [data]);

  const filteredResults = useMemo(() => {
    if (!searchTerm) return summarizedResults;
    const lowerSearch = searchTerm.toLowerCase();
    return summarizedResults.filter(res => 
      res.program_name.toLowerCase().includes(lowerSearch) ||
      res.branches.some(b => b.toLowerCase().includes(lowerSearch)) ||
      res.subjects.some(s => s.toLowerCase().includes(lowerSearch)) ||
      res.instructors.some(i => i.toLowerCase().includes(lowerSearch))
    );
  }, [summarizedResults, searchTerm]);

  const handleExport = () => {
    console.log("Exporting semester results...");
    // Future implementation: CSV or PDF export
  };

  const RenderChips = ({ items, max = 2, color = "gray" }: { items: string[], max?: number, color?: string }) => {
    if (!items || items.length === 0) return <span className="text-gray-400">N/A</span>;
    
    const colorClasses: Record<string, string> = {
      gray: "bg-gray-50 text-gray-600 border-gray-200",
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      purple: "bg-purple-50 text-purple-600 border-purple-100",
      green: "bg-green-50 text-green-600 border-green-100",
      orange: "bg-orange-50 text-orange-600 border-orange-100",
      indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };

    const selectedColor = colorClasses[color] || colorClasses.gray;
    const displayed = items.slice(0, max);
    const remaining = items.length - max;

    return (
      <div className="flex flex-wrap gap-1 max-w-[220px]">
        {displayed.map((item, i) => (
          <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${selectedColor} whitespace-nowrap`}>
            {item}
          </span>
        ))}
        {remaining > 0 && (
          <span className="px-2 py-0.5 bg-white text-gray-500 rounded-full text-[10px] font-bold border border-dashed border-gray-300" title={items.slice(max).join(', ')}>
            +{remaining} more
          </span>
        )}
      </div>
    );
  };

  const columns: Column<any>[] = [
    {
      key: "id",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900",
      render: (_, index) => index + 1
    },
    {
      key: "program",
      header: "Program",
      className: "font-medium text-gray-900",
      render: (res) => res.program_name
    },
    {
      key: "branch",
      header: "Branches",
      render: (res) => <RenderChips items={res.branches} color="blue" />
    },
    {
      key: "group",
      header: "Groups",
      render: (res) => <RenderChips items={res.groups} color="orange" />
    },
    {
      key: "subject",
      header: "Subjects",
      render: (res) => <RenderChips items={res.subjects} color="indigo" max={3} />
    },
    {
      key: "instructor",
      header: "Instructors",
      render: (res) => <RenderChips items={res.instructors} color="green" />
    },
    {
      key: "total_cadets",
      header: "Cadets",
      headerAlign: "center",
      className: "text-center",
      render: (res) => <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{res.total_cadets || 0}</span>
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (res) => (
        <div className="flex items-center justify-center gap-1">
          <button 
            onClick={() => handleViewProgramResults(res.id)} 
            className="p-1 text-blue-600 hover:bg-blue-50 rounded" 
            title="View Program Details"
          >
            <Icon icon="hugeicons:view" className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const TableLoading = () => (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8 relative">
        <button onClick={handleBack} className="absolute left-0 top-0 flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to Results
        </button>
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
          ATW Results Detail - {data?.course_details?.name || "Course"} ({data?.semester_details?.name || "Semester"})
        </h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search programs, subjects..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-0" 
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700">
            <Icon icon="hugeicons:download-04" className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {loading ? (
        <TableLoading />
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No results found.</div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredResults}
          keyExtractor={(res) => res.id.toString()}
          emptyMessage="No program data available"
          onRowClick={(res) => handleViewProgramResults(res.id)}
        />
      )}
    </div>
  );
}
