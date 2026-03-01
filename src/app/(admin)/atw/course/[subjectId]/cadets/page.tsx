/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/libs/hooks/useAuth";
import { Icon } from "@iconify/react";
import Image from "next/image";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import { atwInstructorAssignCadetService, AtwInstructorAssignCadet } from "@/libs/services/atwInstructorAssignCadetService";

export default function AtwInstructorSubjectCadetsPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = use(params);
  const subjectId = parseInt(resolvedParams.subjectId);

  const [cadets, setCadets] = useState<AtwInstructorAssignCadet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const loadCadets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await atwInstructorAssignCadetService.getAll({
      instructor_id: user.id,
      subject_id: subjectId,
      per_page: 1000,
    });
    setCadets(res.data);
    setLoading(false);
  }, [user?.id, subjectId]);

  useEffect(() => {
    loadCadets();
  }, [loadCadets]);

  // Client-side search filter
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return cadets;
    return cadets.filter((c) => {
      const name = c.cadet?.name?.toLowerCase() ?? "";
      const bdNo = ((c.cadet as any)?.cadet_number ?? "").toLowerCase();
      const rank = ((c.cadet as any)?.assigned_ranks?.find((ar: any) => ar.rank)?.rank?.short_name ?? "").toLowerCase();
      return name.includes(term) || bdNo.includes(term) || rank.includes(term);
    });
  }, [cadets, searchTerm]);

  // Client-side pagination
  const total = filtered.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Reset to page 1 on search
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const headerInfo = cadets[0] ?? null;
  const subjectName = (headerInfo?.subject as any)?.module?.subject_name ?? (headerInfo?.subject as any)?.name ?? "";
  const subjectCode = (headerInfo?.subject as any)?.module?.subject_code ?? "";

  const handlePrint = () => window.print();

  const columns: Column<AtwInstructorAssignCadet>[] = [
    {
      key: "sl",
      header: "SL.",
      headerAlign: "center",
      className: "text-center w-12 text-gray-800",
      render: (_, index) => from + index,
    },
    {
      key: "profile",
      header: "Profile",
      headerAlign: "center",
      className: "text-center w-16 no-print",
      render: (c) => {
        const pic = (c.cadet as any)?.profile_picture;
        return pic ? (
          <div className="flex justify-center">
            <Image src={pic} alt={c.cadet?.name ?? ""} width={36} height={36} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Icon icon="hugeicons:user" className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        );
      },
    },
    {
      key: "bd_no",
      header: "BD No.",
      className: "text-gray-800",
      render: (c) => (c.cadet as any)?.cadet_number || "—",
    },
    {
      key: "rank",
      header: "Rank",
      className: "text-gray-800",
      render: (c) => {
        const rank = (c.cadet as any)?.assigned_ranks?.find((ar: any) => ar.rank)?.rank;
        return rank?.short_name || rank?.name || "—";
      },
    },
    {
      key: "name",
      header: "Name",
      className: "text-gray-800 font-medium",
      render: (c) => (
        <span>
          {c.cadet?.name || "—"}
          {(c.cadet as any)?.gender === "female" && (
            <span className="text-pink-600 font-bold ml-1 text-xs">(F)</span>
          )}
        </span>
      ),
    },
    {
      key: "current_course",
      header: "Current Course",
      className: "text-gray-800",
      render: (c) => {
        const course = (c.cadet as any)?.assigned_courses?.[0]?.course;
        return course ? `${course.name} (${course.code})` : "—";
      },
    },
    {
      key: "current_semester",
      header: "Current Semester",
      className: "text-gray-800",
      render: (c) => {
        const semester = (c.cadet as any)?.assigned_semesters?.[0]?.semester;
        return semester ? semester.name : "—";
      },
    },
    {
      key: "branch",
      header: "Branch",
      className: "text-gray-800",
      render: (c) => {
        const ab = (c.cadet as any)?.assigned_branchs;
        return ab?.find((b: any) => b.is_current)?.branch?.name || ab?.[0]?.branch?.name || "—";
      },
    },
  ];

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">

      {/* Action bar — hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <p className="font-medium text-gray-900 uppercase tracking-wider pb-2">
            {subjectName}{subjectCode ? ` (${subjectCode})` : ""} — Assigned Cadets
          </p>
        </div>

        {/* Search — hidden on print */}
        <div className="flex items-center justify-between mb-4 no-print">
          <div className="relative w-72">
            <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, BD No., rank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-800">{total}</span> cadets
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={paginated}
            keyExtractor={(c) => c.id.toString()}
            emptyMessage="No cadets found"
          />
        )}

        {/* Pagination — hidden on print */}
        {!loading && (
          <div className="no-print">
            <Pagination
              currentPage={currentPage}
              lastPage={lastPage}
              total={total}
              from={from}
              to={to}
              perPage={perPage}
              onPageChange={setCurrentPage}
              onPerPageChange={(val) => { setPerPage(val); setCurrentPage(1); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
