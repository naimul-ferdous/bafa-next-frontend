"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import { ctwAttendenceResultService, type CtwAttendenceResult, type AttendanceStatus } from "@/libs/services/ctwAttendenceResultService";

const STATUS_BADGE: Record<string, string> = {
    present: "bg-green-100 text-green-800",
    absent:  "bg-red-100 text-red-800",
    late:    "bg-yellow-100 text-yellow-800",
    excused: "bg-blue-100 text-blue-800",
};

export default function CtwAttendanceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = parseInt(params?.id as string);

    const [result, setResult] = useState<CtwAttendenceResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");

    useEffect(() => {
        if (!id) return;
        ctwAttendenceResultService.getOne(id)
            .then(setResult)
            .catch(() => setError("Failed to load attendance record."))
            .finally(() => setLoading(false));
    }, [id]);

    const statusCounts = (result?.cadet_attendances ?? []).reduce((acc, ca) => {
        acc[ca.status] = (acc[ca.status] ?? 0) + 1;
        return acc;
    }, {} as Record<AttendanceStatus, number>);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-center justify-center min-h-[30vh]">
                <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-center justify-center min-h-[30vh]">
                <p className="text-red-500">{error || "Record not found."}</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="flex justify-center mb-4"><FullLogo /></div>
                <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Attendance Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                    {result.course?.name}{result.course && result.semester ? " — " : ""}{result.semester?.name}
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" /> Back
                </button>
                <button
                    onClick={() => router.push(`/ctw/attendence/attend/${id}/edit`)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-yellow-600"
                >
                    <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /> Edit
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Attendance Type</div>
                    <div className="font-semibold text-gray-900">{result.attendence_type?.name ?? "—"}</div>
                    <div className="text-xs text-gray-400">{result.attendence_type?.short_name}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Date</div>
                    <div className="font-semibold text-gray-900">
                        {result.attendance_date
                            ? new Date(result.attendance_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 mb-2">Status Summary</div>
                    <div className="flex flex-wrap gap-1.5">
                        {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((s) => (
                            <span key={s} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[s]}`}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}: {statusCounts[s] ?? 0}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Remarks</div>
                    <div className="text-sm text-gray-700">{result.remarks || <span className="text-gray-400">—</span>}</div>
                </div>
            </div>

            {/* Cadet attendance table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-10">SL.</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-24">BD No.</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-20">Rank</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-24">Branch</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-24">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(result.cadet_attendances ?? []).length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No cadet records</td></tr>
                        ) : (result.cadet_attendances ?? []).map((ca, idx) => (
                            <tr key={ca.id} className={`hover:bg-gray-50 ${ca.status === "absent" ? "bg-red-50/40" : ca.status === "late" ? "bg-yellow-50/40" : ""}`}>
                                <td className="px-4 py-2.5 text-gray-500">{idx + 1}</td>
                                <td className="px-4 py-2.5 font-mono text-gray-700">{ca.cadet?.cadet_number ?? "—"}</td>
                                <td className="px-4 py-2.5 font-medium text-gray-900">{ca.cadet?.name ?? "—"}</td>
                                <td className="px-4 py-2.5 text-gray-600">{ca.cadet?.assignedRanks?.[0]?.rank?.short_name ?? "—"}</td>
                                <td className="px-4 py-2.5 text-gray-600">{ca.cadet?.assignedBranchs?.[0]?.branch?.name ?? "—"}</td>
                                <td className="px-4 py-2.5 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[ca.status]}`}>
                                        {ca.status.charAt(0).toUpperCase() + ca.status.slice(1)}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-gray-600">{ca.remarks || <span className="text-gray-400">—</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
