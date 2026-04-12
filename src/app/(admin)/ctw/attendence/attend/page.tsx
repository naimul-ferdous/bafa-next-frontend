"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { ctwAttendenceResultService } from "@/libs/services/ctwAttendenceResultService";

type SemesterRow = {
    course_id: number;
    semester_id: number;
    total_sessions: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    course?: { id: number; name: string; code: string };
    semester?: { id: number; name: string; code: string };
};

export default function CtwAttendancePage() {
    const router = useRouter();
    const [rows, setRows] = useState<SemesterRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const loadRows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ctwAttendenceResultService.getSemesterWise({ page: currentPage, per_page: perPage });
            setRows(res.data);
            setPagination({ current_page: res.current_page, last_page: res.last_page, per_page: res.per_page, total: res.total, from: res.from, to: res.to });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [currentPage, perPage]);

    useEffect(() => { loadRows(); }, [loadRows]);

    const columns: Column<SemesterRow>[] = [
        {
            key: "course_id",
            header: "SL.",
            headerAlign: "center",
            className: "text-center text-gray-900",
            render: (_, i) => (pagination.from || 0) + i,
        },
        {
            key: "course_id",
            header: "Course",
            render: (r) => (
                <div>
                    <div className="font-medium text-gray-900">{r.course?.name ?? "—"}</div>
                    <div className="text-xs text-gray-500">{r.course?.code}</div>
                </div>
            ),
        },
        {
            key: "semester_id",
            header: "Semester",
            render: (r) => (
                <div>
                    <div className="font-medium text-gray-900">{r.semester?.name ?? "—"}</div>
                    <div className="text-xs text-gray-500">{r.semester?.code}</div>
                </div>
            ),
        },
        {
            key: "total_sessions",
            header: "Sessions",
            headerAlign: "center",
            className: "text-center",
            render: (r) => <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded font-semibold">{r.total_sessions} Total</span>,
        },
        {
            key: "present_count",
            header: "Present",
            headerAlign: "center",
            className: "text-center",
            render: (r) => <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded font-semibold">{r.present_count ?? 0}</span>,
        },
        {
            key: "absent_count",
            header: "Absent",
            headerAlign: "center",
            className: "text-center",
            render: (r) => <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded font-semibold">{r.absent_count ?? 0}</span>,
        },
        {
            key: "late_count",
            header: "Late",
            headerAlign: "center",
            className: "text-center",
            render: (r) => <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded font-semibold">{r.late_count ?? 0}</span>,
        },
        {
            key: "excused_count",
            header: "Excused",
            headerAlign: "center",
            className: "text-center",
            render: (r) => <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded font-semibold">{r.excused_count ?? 0}</span>,
        },
        {
            key: "course_id",
            header: "Actions",
            headerAlign: "center",
            className: "text-center no-print",
            render: (r) => (
                <button
                    onClick={() => router.push(`/ctw/attendence/attend/course/${r.course_id}/semester/${r.semester_id}`)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 mx-auto"
                >
                    <Icon icon="hugeicons:view" className="w-3 h-3" /> View Details
                </button>
            ),
        },
    ];

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4"><FullLogo /></div>
                <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">CTW Attendance — Semester Wise</h2>
            </div>

            {loading ? (
                <div className="w-full min-h-[20vh] flex items-center justify-center">
                    <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={rows}
                    keyExtractor={(r) => `${r.course_id}-${r.semester_id}`}
                    emptyMessage="No attendance records found"
                    onRowClick={(r) => router.push(`/ctw/attendence/attend/course/${r.course_id}/semester/${r.semester_id}`)}
                />
            )}

            {!loading && (
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600">Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results</span>
                        <select
                            value={perPage}
                            onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none"
                        >
                            {[10, 25, 50].map((n) => <option key={n} value={n}>{n} per page</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline" /> Prev
                        </button>
                        {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((p) => (
                            <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 rounded-lg ${currentPage === p ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"}`}>{p}</button>
                        ))}
                        <button onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))} disabled={currentPage === pagination.last_page} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                            Next <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
