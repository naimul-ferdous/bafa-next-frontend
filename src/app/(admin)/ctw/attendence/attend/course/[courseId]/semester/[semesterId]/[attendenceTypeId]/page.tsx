"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import { ctwAttendenceResultService, type CtwAttendenceResult, type AttendanceStatus } from "@/libs/services/ctwAttendenceResultService";

const STATUS_BADGE: Record<string, string> = {
    present: "text-green-800",
    absent: "text-red-800",
    late: "text-yellow-800",
    excused: "text-blue-800",
};

const STATUS_SHORT: Record<string, string> = {
    present: "P",
    absent: "A",
    late: "L",
    excused: "E",
};

interface CadetAttendanceData {
    cadet_id: number;
    cadet_number: string;
    name: string;
    rank: string;
    branch: string;
    attendances: Record<string, AttendanceStatus>;
}

interface MonthData {
    year: number;
    month: number;
    name: string;
    cadets: CadetAttendanceData[];
    hasData: boolean;
}

export default function CtwAttendanceTypeDetailPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params?.courseId as string);
    const semesterId = parseInt(params?.semesterId as string);
    const attendenceTypeId = parseInt(params?.attendenceTypeId as string);

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const [allResults, setAllResults] = useState<CtwAttendenceResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [courseName, setCourseName] = useState("");
    const [semesterName, setSemesterName] = useState("");
    const [attendanceTypeName, setAttendanceTypeName] = useState("");
    const [attendanceTypeShortName, setAttendanceTypeShortName] = useState("");

    const loadAttendanceData = useCallback(async () => {
        setLoading(true);
        try {
            const monthsToFetch = [];
            for (let i = 0; i < 4; i++) {
                const date = new Date(currentYear, currentMonth - 1 - i, 1);
                monthsToFetch.push({
                    year: date.getFullYear(),
                    month: date.getMonth() + 1
                });
            }

            const allData: CtwAttendenceResult[] = [];
            
            for (const m of monthsToFetch) {
                try {
                    const data = await ctwAttendenceResultService.getAttendanceByTypeForMonth(
                        courseId,
                        semesterId,
                        attendenceTypeId,
                        m.year,
                        m.month
                    );
                    if (data.length > 0) {
                        allData.push(...data);
                        if (!courseName) {
                            setCourseName(data[0].course?.name ?? "");
                            setSemesterName(data[0].semester?.name ?? "");
                            setAttendanceTypeName(data[0].attendence_type?.name ?? "");
                            setAttendanceTypeShortName(data[0].attendence_type?.short_name ?? "");
                        }
                    }
                } catch (e) {
                    console.error(`Error fetching ${m.year}-${m.month}:`, e);
                }
            }

            setAllResults(allData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [courseId, semesterId, attendenceTypeId, currentYear, currentMonth]);

    useEffect(() => {
        loadAttendanceData();
    }, [loadAttendanceData]);

    const monthTables = useMemo((): MonthData[] => {
        const months: Map<string, Map<number, CadetAttendanceData>> = new Map();

        allResults.forEach((result) => {
            const dateStr = result.attendance_date;
            if (!dateStr) return;

            const date = new Date(dateStr);
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const monthKey = `${year}-${month}`;

            if (!months.has(monthKey)) {
                months.set(monthKey, new Map());
            }
            const monthCadetMap = months.get(monthKey)!;

            (result.cadet_attendances ?? []).forEach((cadetAttendance) => {
                const c = cadetAttendance.cadet;
                if (!c) return;

                if (!monthCadetMap.has(cadetAttendance.cadet_id)) {
                    const cadetAny = c as any;
                    const rank = cadetAny.assignedRanks?.[0]?.rank?.short_name 
                        ?? cadetAny.assigned_ranks?.[0]?.rank?.short_name 
                        ?? "";
                    const branch = cadetAny.assignedBranchs?.[0]?.branch?.name 
                        ?? cadetAny.assigned_branchs?.[0]?.branch?.name 
                        ?? "";
                    monthCadetMap.set(cadetAttendance.cadet_id, {
                        cadet_id: c.id,
                        cadet_number: c.cadet_number ?? "",
                        name: c.name ?? "",
                        rank: rank,
                        branch: branch,
                        attendances: {},
                    });
                }

                monthCadetMap.get(cadetAttendance.cadet_id)!.attendances[`${day}`] = cadetAttendance.status;
            });
        });

        const resultArr: MonthData[] = [];
        
        for (let i = 0; i < 4; i++) {
            const date = new Date(currentYear, currentMonth - 1 - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const monthKey = `${year}-${month}`;
            
            if (months.has(monthKey)) {
                const cadetMap = months.get(monthKey)!;
                const cadets = Array.from(cadetMap.values()).sort((a, b) => a.cadet_number.localeCompare(b.cadet_number));
                const hasData = cadets.some(c => Object.keys(c.attendances).length > 0);
                
                resultArr.push({
                    year,
                    month,
                    name: new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" }),
                    cadets,
                    hasData
                });
            }
        }

        return resultArr.filter(m => m.hasData || m.cadets.length > 0);
    }, [allResults, currentYear, currentMonth]);

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            <style jsx global>{`
                @media print {
                .cv-content { width: 100% !important; max-width: none !important; }
                table { font-size: 14px !important; }
                .print-div { max-width: 60vh !important; margin: 0 auto !important; }
                .no-print { display: none !important; }
                .tab-container { display: none !important; }
                .signature-section {
                    margin-top: 40px !important;
                    padding-top: 20px !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    gap: 40px !important;
                    padding-left: 8px !important;
                    padding-right: 8px !important;
                    page-break-inside: avoid !important;
                }
                .signature-box {
                    min-width: 180px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: flex-start !important;
                }
                .signature-box .sig-label {
                    font-size: 10px !important;
                    font-weight: 700 !important;
                    color: #b91c1c !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    margin-bottom: 4px !important;
                }
                .signature-box .sig-area {
                    height: 60px !important;
                    display: flex !important;
                    align-items: flex-end !important;
                    padding-bottom: 4px !important;
                    margin-bottom: 4px !important;
                }
                .signature-box .sig-name {
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    color: #111827 !important;
                    margin-top: 2px !important;
                }
                .signature-box .sig-rank {
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    color: #f97316 !important;
                }
                .signature-box .sig-designation {
                    font-size: 10px !important;
                    color: #374151 !important;
                }
                .signature-box .sig-date {
                    font-size: 10px !important;
                    color: #6b7280 !important;
                    padding-top: 3px !important;
                    border-top: 1px solid #1f2937 !important;
                    margin-top: 4px !important;
                }
                }
            `}</style>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A3 landscape;
                        margin: 14mm 10mm 14mm 10mm;

                        @top-left   { content: ""; }
                        @top-center {
                        content: "";
                            font-size: 10pt;
                            white-space: pre;
                            text-align: center;
                            text-transform: uppercase;
                        }
                        @top-right  {
                            content: "";
                            font-size: 10pt;
                            text-align: right;
                        }

                        @bottom-left   { content: ""; }
                        @bottom-center {
                            content: "" counter(page);
                            font-size: 10pt;
                            white-space: pre;
                            text-align: center;
                            text-transform: uppercase;
                        }
                        @bottom-right  { content: ""; }
                    }
                }
            ` }} />

            <div className="p-4 flex items-center justify-between no-print">
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-black rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back
                </button>
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-black rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:printer" className="w-4 h-4" />
                    Print
                </button>
            </div>

            <div className="p-4 cv-content space-y-6">
                <div className="text-center mb-4">
                    <div className="flex justify-center mb-3"><FullLogo /></div>
                    <h1 className="text-lg font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                    <h2 className="text-sm font-semibold text-gray-700 mt-1 uppercase">CTW Attendance Sheet</h2>
                    {(courseName || semesterName) && (
                        <h2 className="text-sm font-semibold text-gray-700 uppercase">
                            {courseName}{courseName && semesterName ? " — " : ""}{semesterName}
                        </h2>
                    )}
                    <h2 className="text-sm font-semibold text-gray-700 uppercase mt-1">
                        {attendanceTypeName}
                    </h2>
                </div>

                {loading ? (
                    <div className="w-full min-h-[20vh] flex items-center justify-center">
                        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                ) : monthTables.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No attendance records found
                    </div>
                ) : (
                    monthTables.map((monthData) => {
                        const daysInMonth = new Date(monthData.year, monthData.month, 0).getDate();
                        const days: number[] = [];
                        for (let i = 1; i <= daysInMonth; i++) {
                            days.push(i);
                        }

                        return (
                            <div key={`${monthData.year}-${monthData.month}`} className="month-table">
                                <div className="text-center mb-3">
                                    <h3 className="text-md font-semibold text-gray-800 uppercase">
                                        {monthData.name}
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="border border-black px-1 py-2 text-center font-semibold text-black w-8">SL</th>
                                                <th className="border border-black px-2 py-2 text-left font-semibold text-black w-16">BD/No</th>
                                                <th className="border border-black px-2 py-2 text-left font-semibold text-black w-12">Rank</th>
                                                <th className="border border-black px-2 py-2 text-left font-semibold text-black w-24">Name</th>
                                                <th className="border border-black px-2 py-2 text-left font-semibold text-black w-20">Branch</th>
                                                {days.map((day) => {
                                                    const hasData = monthData.cadets.some(c => c.attendances[`${day}`]);
                                                    return (
                                                        <th
                                                            key={day}
                                                            className={`border border-black px-0.5 py-1 text-center text-black w-6 ${
                                                                !hasData ? 'text-black' : ''
                                                            }`}
                                                        >
                                                            {day}
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthData.cadets.map((cadet, idx) => (
                                                <tr key={cadet.cadet_id} className="hover:bg-gray-50">
                                                    <td className="border border-black px-1 py-1.5 text-center text-black">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="border border-black px-2 py-1.5 font-mono text-gray-700">
                                                        {cadet.cadet_number}
                                                    </td>
                                                    <td className="border border-black px-2 py-1.5 text-gray-700">
                                                        {cadet.rank}
                                                    </td>
                                                    <td className="border border-black px-2 py-1.5 font-medium text-gray-900">
                                                        {cadet.name}
                                                    </td>
                                                    <td className="border border-black px-2 py-1.5 text-black">
                                                        {cadet.branch}
                                                    </td>
                                                    {days.map((day) => {
                                                        const status = cadet.attendances[`${day}`];
                                                        return (
                                                            <td
                                                                key={day}
                                                                className={`border border-black px-0.5 py-1 text-center text-xs ${
                                                                    status ? STATUS_BADGE[status] : "text-gray-300"
                                                                }`}
                                                            >
                                                                {status ? STATUS_SHORT[status] : "—"}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })
                )}

                {monthTables.length > 0 && (
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2 no-print">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-semibold">P = Present</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs font-semibold">A = Absent</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold">L = Late</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-semibold">E = Excused</span>
                        </div>
                        <div>Generated: {new Date().toLocaleDateString("en-GB")}</div>
                    </div>
                )}
            </div>
        </div>
    );
}