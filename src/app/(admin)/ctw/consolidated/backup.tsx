/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwResultService } from "@/libs/services/ctwResultService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";

export default function CtwConsolidatedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [groupedData, setGroupedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const loadGroupedData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ctwResultService.getGroupedResults();
      if (response.success) {
        setGroupedData(response.data);
      }
    } catch (error) {
      console.error("Failed to load grouped data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroupedData();
  }, [loadGroupedData]);

  // Flatten the grouped data for DataTable
  const flattenedData = useMemo(() => {
    const flat: any[] = [];
    groupedData.forEach(courseGroup => {
      courseGroup.semesters.forEach((semesterGroup: any) => {
        flat.push({
          id: `${courseGroup.course_details.id}-${semesterGroup.semester_details.id}`,
          course_id: courseGroup.course_details.id,
          course_name: courseGroup.course_details.name,
          course_code: courseGroup.course_details.code,
          semester_id: semesterGroup.semester_details.id,
          semester_name: semesterGroup.semester_details.name,
          semester_code: semesterGroup.semester_details.code,
          results_count: semesterGroup.results?.length || 0,
          results: semesterGroup.results || [],
        });
      });
    });

    // Apply client-side search
    if (!searchTerm) return flat;
    const lowerSearch = searchTerm.toLowerCase();
    return flat.filter(item => 
      item.course_name.toLowerCase().includes(lowerSearch) || 
      item.course_code.toLowerCase().includes(lowerSearch) ||
      item.semester_name.toLowerCase().includes(lowerSearch)
    );
  }, [groupedData, searchTerm]);

  // Pagination logic
  const totalResults = flattenedData.length;
  const lastPage = Math.ceil(totalResults / perPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return flattenedData.slice(start, start + perPage);
  }, [flattenedData, currentPage, perPage]);

  const handleViewConsolidated = (courseId: number, semesterId: number) => {
    router.push(`/ctw/consolidated/course/${courseId}/semester/${semesterId}`);
  };

  const handleExport = () => console.log("Export consolidated results");
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

  const RenderChips = ({ items, max = 3, color = "blue" }: { items: string[], max?: number, color?: string }) => {
    if (!items || items.length === 0) return <span className="text-gray-400">No results</span>;
    
    const colorClasses: Record<string, string> = {
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      purple: "bg-purple-50 text-purple-600 border-purple-100",
      amber: "bg-amber-50 text-amber-600 border-amber-100",
    };

    const selectedColor = colorClasses[color] || colorClasses.blue;
    const displayed = items.slice(0, max);
    const remaining = items.length - max;

    return (
      <div className="flex flex-wrap gap-1">
        {displayed.map((item, i) => (
          <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${selectedColor} whitespace-nowrap`}>
            {item}
          </span>
        ))}
        {remaining > 0 && (
          <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full text-[10px] font-bold border border-gray-200">
            +{remaining}
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
      className: "text-center text-gray-900 w-12",
      render: (_, index) => ((currentPage - 1) * perPage) + (index + 1)
    },
    {
      key: "course",
      header: "Course",
      render: (item) => (
        <div>
          <div className="font-bold text-gray-900">{item.course_name}</div>
          <div className="text-[10px] text-blue-600 font-black uppercase tracking-tighter">{item.course_code}</div>
        </div>
      ),
    },
    {
      key: "semester",
      header: "Semester",
      render: (item) => (
        <div>
          <div className="font-semibold text-gray-700">{item.semester_name}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase">{item.semester_code}</div>
        </div>
      ),
    },
    {
      key: "modules",
      header: "Recorded Modules",
      render: (item) => {
        const moduleCodes = item.results.map((r: any) => r.module.code);
        return <RenderChips items={moduleCodes} color="blue" />;
      },
    },
    {
      key: "exam_types",
      header: "Exam Types",
      render: (item) => {
        const types = Array.from(new Set(item.results.map((r: any) => r.exam_type))) as string[];
        return <RenderChips items={types} color="amber" />;
      },
    },
    {
      key: "count",
      header: "Total Records",
      headerAlign: "center",
      className: "text-center",
      render: (item) => (
        <span className="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-black rounded-lg border border-gray-200">
          {item.results_count}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={() => handleViewConsolidated(item.course_id, item.semester_id)} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all font-bold text-xs border border-blue-100"
            title="View Full Consolidated Sheet"
          >
            <Icon icon="hugeicons:view" className="w-4 h-4" />
            <span>View Consolidated</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">CTW Consolidated Results Management</h2>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-80">
          <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by course or semester..." 
            value={searchTerm} 
            onChange={(e) => handleSearchChange(e.target.value)} 
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport} 
            className="px-4 py-2 rounded-lg text-white font-bold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
          >
            <Icon icon="hugeicons:download-04" className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {loading ? (
        <TableLoading />
      ) : (
        <DataTable 
          columns={columns} 
          data={paginatedData} 
          keyExtractor={(item) => item.id} 
          emptyMessage="No consolidated results found" 
          onRowClick={(item) => handleViewConsolidated(item.course_id, item.semester_id)}
        />
      )}

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 font-medium">
            Showing <span className="text-gray-900 font-bold">{Math.min(totalResults, (currentPage - 1) * perPage + 1)}</span> to <span className="text-gray-900 font-bold">{Math.min(totalResults, currentPage * perPage)}</span> of <span className="text-gray-900 font-bold">{totalResults}</span> results
          </div>
          <select 
            value={perPage} 
            onChange={(e) => handlePerPageChange(Number(e.target.value))} 
            className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
            disabled={currentPage === 1} 
            className="px-4 py-2 text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
          >
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
            Prev
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: lastPage }, (_, i) => i + 1).map(page => (
              <button 
                key={page} 
                onClick={() => setCurrentPage(page)} 
                className={`w-10 h-10 text-sm font-bold rounded-lg transition-all ${currentPage === page ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "border border-gray-200 hover:bg-gray-50 text-gray-600"}`}
              >
                {page}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))} 
            disabled={currentPage === lastPage} 
            className="px-4 py-2 text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
          >
            Next
            <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
