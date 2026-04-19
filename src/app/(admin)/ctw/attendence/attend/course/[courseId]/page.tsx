/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import { ctwAttendenceResultService } from "@/libs/services/ctwAttendenceResultService";

interface StatusCatalogItem {
    slug: string;
    label: string;
    short: string;
}

interface CadetMissingRow {
    cadet_id: number;
    cadet_number: string;
    name: string;
    rank: string;
    branch: string;
    counts: Record<string, number>;
    workingDays: number;
    total: number;
    percent: number;
}

export default function CtwAttendanceCourseClassMissingPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params?.courseId as string);

    const [loading, setLoading] = useState(true);
    const [statusCatalog, setStatusCatalog] = useState<StatusCatalogItem[]>([]);
    const [rows, setRows] = useState<CadetMissingRow[]>([]);
    const [courseName, setCourseName] = useState("");

    const loadData = useCallback(async () => {
        if (isNaN(courseId)) return;
        setLoading(true);
        try {
            const data = await ctwAttendenceResultService.getClassMissingReport(courseId);
            setStatusCatalog(data.status_catalog || []);
            setRows(data.cadets || []);
            setCourseName(data.course?.name || "");
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleBack = () => history.back();
    const handlePrint = () => window.print();

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            <style jsx global>{`
                @media print {
                    @page { size: A4 landscape; margin: 12mm; }
                    .cv-content { width: 100% !important; max-width: none !important; }
                    table { font-size: 11px !important; border-collapse: collapse !important; width: 100% !important; }
                    th, td { border: 1px solid black !important; padding: 4px !important; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="p-4 flex items-center justify-between no-print">
                <button
                    onClick={handleBack}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" /> Back to List
                </button>
                <button
                    onClick={handlePrint}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:printer" className="w-4 h-4" /> Print
                </button>
            </div>

            <div className="p-6 cv-content">
                <div className="mb-6 text-center">
                    <div className="flex justify-center mb-3"><FullLogo /></div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
                    <p className="font-medium text-gray-900 uppercase tracking-wider underline">Ctw Trg Missing State</p>
                    {courseName && <p className="text-sm text-gray-700 uppercase underline">No {courseName} Course</p>}
                </div>

                {loading ? (
                    <div className="w-full min-h-[20vh] flex items-center justify-center">
                        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No attendance data found for this course</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-black text-xs">
                            <thead>
                                <tr>
                                    <th className="border border-black px-2 py-2 text-center">SL</th>
                                    <th className="border border-black px-2 py-2 text-center">BD</th>
                                    <th className="border border-black px-2 py-2 text-center">Rank</th>
                                    <th className="border border-black px-2 py-2 text-left">Name</th>
                                    <th className="border border-black px-2 py-2 text-center">Br</th>
                                    {statusCatalog.map((s) => (
                                        <th
                                            key={s.slug}
                                            className="border border-black px-2 py-2 text-center"
                                            title={s.label}
                                        >
                                            {s.short}
                                        </th>
                                    ))}
                                    <th className="border border-black px-2 py-2 text-center font-bold">Ttl</th>
                                    <th className="border border-black px-2 py-2 text-center font-bold">Wkr day</th>
                                    <th className="border border-black px-2 py-2 text-center font-bold">In %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={r.cadet_id} className="hover:bg-gray-50">
                                        <td className="border border-black px-2 py-1 text-center">{i + 1}</td>
                                        <td className="border border-black px-2 py-1 text-center font-mono">{r.cadet_number}</td>
                                        <td className="border border-black px-2 py-1 text-center">{r.rank || "—"}</td>
                                        <td className="border border-black px-2 py-1 font-medium">{r.name}</td>
                                        <td className="border border-black px-2 py-1 text-center">{r.branch || "—"}</td>
                                        {statusCatalog.map((s) => {
                                            const v = r.counts?.[s.slug] ?? 0;
                                            return (
                                                <td key={s.slug} className="border border-black px-2 py-1 text-center">
                                                    {v > 0 ? v : ""}
                                                </td>
                                            );
                                        })}
                                        <td className="border border-black px-2 py-1 text-center font-bold">{r.total || 0}</td>
                                        <td className="border border-black px-2 py-1 text-center">{r.workingDays || 0}</td>
                                        <td className="border border-black px-2 py-1 text-center font-semibold">
                                            {r.percent > 0 ? `${r.percent.toFixed(2)}%` : "0.00%"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Legend */}
                        <div className="mt-4 text-xs text-gray-700">
                            <span className="font-bold">Legend: </span>
                            {statusCatalog.map((s, idx) => (
                                <span key={s.slug}>
                                    {s.short} = {s.label}{idx < statusCatalog.length - 1 ? ", " : ""}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
