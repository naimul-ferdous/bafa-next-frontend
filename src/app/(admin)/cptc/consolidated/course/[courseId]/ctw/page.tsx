"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { cptcService, CptcCtwConsolidatedData } from "@/libs/services/cptcService";
import FullLogo from "@/components/ui/fulllogo";
import { getOrdinal } from "@/libs/utils/formatter";
import { calculateCtwSyllabusTotals } from "@/hooks/consoidated/ctwSyllabusTotals";

// ─── Sub-Components ────────────────────────────────────────────────────────

const OverallCourseConsolidatedTable = ({ data }: { data: any | null }) => {
    const [filter, setFilter] = useState<"gdp" | "others">("gdp");

    const semesters = useMemo(() => data?.course_details?.semesters || [], [data]);
    const modules = useMemo(() => data?.modules || [], [data]);

    // 1. Calculate Semester Totals (Estimated) from Syllabus
    const semesterTotals = useMemo(() => {
        const map = new Map<number, number>();

        // Use backend pre-calculated syllabus summary if available (Preferred)
        if (data?.syllabus) {
            Object.entries(data.syllabus).forEach(([semId, summary]: [string, any]) => {
                map.set(parseInt(semId), parseFloat(summary.total || 0));
            });
            return map;
        }

        // Fallback to frontend calculation
        semesters.forEach((sem: any) => {
            const { grandFull } = calculateCtwSyllabusTotals(modules, sem.id);
            map.set(sem.id, grandFull);
        });
        return map;
    }, [semesters, modules, data]);

    const totalCourseMarks = Array.from(semesterTotals.values()).reduce((a, b) => a + b, 0);

    // 2. Process Cadets - Flattened List
    const allCadets = useMemo(() => {
        if (!data?.results) return [];

        const flattened: any[] = [];

        data.results.forEach((branchGroup: any) => {
            // Group entries by cadet for this branch
            const cadetMap = new Map<number, any>();

            branchGroup.results.forEach((entry: any) => {
                const cadetId = entry.cadet_details.id;
                if (!cadetMap.has(cadetId)) {
                    cadetMap.set(cadetId, {
                        ...entry.cadet_details, // id, name, bd_no, rank, branch...
                        branchName: branchGroup.branch_name, // Ensure branch name is available
                        semesterMarks: {},
                        grandTotal: 0
                    });
                }
                const cadet = cadetMap.get(cadetId);

                // entry.cadet_details.total_achieved contains the total for this semester entry
                const semTotal = parseFloat(entry.cadet_details.total_achieved) || 0;

                cadet.semesterMarks[entry.semester_id] = semTotal;
                cadet.grandTotal += semTotal;
            });

            flattened.push(...Array.from(cadetMap.values()));
        });

        // Sort by grand total descending
        return flattened.sort((a, b) => b.grandTotal - a.grandTotal);

    }, [data]);

    // Filter Cadets based on selection
    const filteredCadets = useMemo(() => {
        if (filter === "gdp") {
            return allCadets.filter(c => (c.branchName || "").toLowerCase().includes("pilot") || (c.branchName || "").includes("GDP"));
        } else {
            return allCadets.filter(c => !((c.branchName || "").toLowerCase().includes("pilot") || (c.branchName || "").includes("GDP")));
        }
    }, [allCadets, filter]);

    const getRank = (cadetId: number, cadets: any[], sortKey: string) => {
        const sorted = [...cadets].sort((a, b) => b[sortKey] - a[sortKey]);
        const index = sorted.findIndex(c => c.id === cadetId);
        if (index > 0 && sorted[index][sortKey] === sorted[index - 1][sortKey]) {
            return sorted.findIndex(c => c[sortKey] === sorted[index][sortKey]) + 1;
        }
        return index + 1;
    };

    if (!data) return null;

    return (
        <div className="mt-8 mb-12">
            <div className="flex justify-between items-end gap-4 border-b border-dashed border-gray-400 mb-4 pb-2">
                <h2 className="text-lg font-bold text-gray-900 uppercase text-base">Overall Course Result</h2>
                <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 p-1 rounded-full text-xs no-print">
                    <button
                        onClick={() => setFilter("gdp")}
                        className={`px-4 py-1.5 rounded-full font-bold uppercase transition-all ${filter === "gdp" ? "bg-blue-500 text-white" : "text-gray-500 hover:text-gray-900"}`}
                    >
                        GDP
                    </button>
                    <button
                        onClick={() => setFilter("others")}
                        className={`px-4 py-1.5 rounded-full font-bold uppercase transition-all ${filter === "others" ? "bg-blue-500 text-white" : "text-gray-500 hover:text-gray-900"}`}
                    >
                        Others
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-xs sm:text-sm lg:text-base">
                    <thead>
                        <tr>
                            <th className="border border-black px-1 py-2 text-center w-10" rowSpan={3}>Ser</th>
                            <th className="border border-black px-1 py-2 text-center" colSpan={4}>Particulars of Offr Cdts</th>
                            <th className="border border-black px-1 py-2 text-center" colSpan={semesters.length}>Results of GST</th>
                            <th className="border border-black px-2 py-2 text-center" rowSpan={2}>Total</th>
                            <th className="border border-black px-2 py-2 text-center" rowSpan={3}>%</th>
                            <th className="px-2 py-2 text-center">Posn</th>
                        </tr>
                        <tr>
                            <th className="border border-black px-2 py-2 text-center min-w-[80px]" rowSpan={2}>BD/No</th>
                            <th className="border border-black px-1 py-2 text-center" rowSpan={2}>Rank</th>
                            <th className="border border-black px-2 py-2 text-center min-w-[180px]" rowSpan={2}>Name</th>
                            <th className="border border-black px-2 py-2 text-center" rowSpan={2}>Branch</th>
                            {/* Semester Headers */}
                            {semesters.map((sem: any) => (
                                <th key={sem.id} className="border border-black px-2 py-2 text-center">
                                    {sem.name}
                                </th>
                            ))}
                        </tr>
                        <tr className="text-xs">
                            {semesters.map((sem: any) => (
                                <th key={sem.id} className="border border-black px-2 py-2 text-center">
                                    {semesterTotals.get(sem.id)?.toFixed(0) || 0}
                                </th>
                            ))}
                            <th className="border border-black px-2 py-2 text-center">{totalCourseMarks.toFixed(0)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCadets.length > 0 ? filteredCadets.map((cadet: any, cIdx: number) => (
                            <tr key={cadet.id} className="transition-colors hover:bg-gray-50">
                                <td className="border border-black px-1 py-1 text-center font-medium">{cIdx + 1}</td>
                                <td className="border border-black px-1 py-1 text-center font-mono">{cadet.bd_no}</td>
                                <td className="border border-black px-1 py-1 text-center">{cadet.rank}</td>
                                <td className="border border-black px-2 py-1 font-bold">{cadet.name}</td>
                                <td className="border border-black px-2 py-1 text-center">{cadet.branchName}</td>

                                {semesters.map((sem: any) => (
                                    <td key={sem.id} className="border border-black px-1 py-1 text-center">
                                        {(cadet.semesterMarks[sem.id] || 0).toFixed(4)}
                                    </td>
                                ))}

                                <td className="border border-black px-1 py-1 text-center font-bold">{cadet.grandTotal.toFixed(4)}</td>
                                <td className="border border-black px-1 py-1 text-center">
                                    {totalCourseMarks > 0 ? ((cadet.grandTotal / totalCourseMarks) * 100).toFixed(4) : "0.00"}
                                </td>
                                <td className="border border-black px-1 py-1 text-center">{getOrdinal(getRank(cadet.id, filteredCadets, 'grandTotal'))}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={10 + semesters.length} className="px-4 py-8 text-center text-gray-400 italic font-medium">No results found for {filter.toUpperCase()}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function CptcCtwConsolidatedPage({ params }: { params: Promise<{ courseId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const courseId = parseInt(resolvedParams.courseId);

    const [data, setData] = useState<CptcCtwConsolidatedData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSemesterId, setActiveSemesterId] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await cptcService.getConsolidatedResultsByCourseCtw(courseId);
                setData(result);
                if (result?.course_details?.semesters?.length && result.course_details.semesters.length > 0) {
                    setActiveSemesterId(result.course_details.semesters[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch CTW consolidated results:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    const handlePrint = () => window.print();
    const handleBack = () => router.push("/cptc/consolidated");
    const handleExport = () => console.log("Export data");

    if (loading) return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-center py-12">
                <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
            </div>
        </div>
    );

    if (!data) return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-center py-12">
                <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Course Data Not Found</h2>
                <button onClick={handleBack} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold">
                    Back to Consolidated
                </button>
            </div>
        </div>
    );

    const activeSemesterName = data.course_details?.semesters.find(s => s.id === activeSemesterId)?.name || "N/A";

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            {/* Action Buttons */}
            <div className="p-4 flex items-center justify-between no-print">
                <button onClick={handleBack} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all">
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />Back to List
                </button>
                <div className="flex items-center gap-3">
                    <button onClick={handlePrint} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all">
                        <Icon icon="hugeicons:printer" className="w-4 h-4" />Print
                    </button>
                    <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-bold transition-all shadow-sm">
                        <Icon icon="hugeicons:download-04" className="w-4 h-4" />Export Data
                    </button>
                </div>
            </div>

            <div className="p-8 cv-content">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
                    <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2 inline-block w-full">CTW Consolidated Result Sheet</p>
                </div>

                {/* Course Info */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase text-base">Course Information</h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-base">
                        <div className="flex"><span className="w-64 text-gray-900 font-bold uppercase">Course</span><span className="mr-4">:</span><span className="text-gray-900 flex-1">{data.course_details?.name} ({data.course_details?.code})</span></div>
                        {/* Removed activeSemesterName since this is consolidated for course */}
                        <div className="flex"><span className="w-64 text-gray-900 font-bold uppercase">Total Semesters</span><span className="mr-4">:</span><span className="text-gray-900 flex-1">{data.course_details?.semesters.length}</span></div>
                    </div>
                </div>

                {/* Overall Table */}
                <OverallCourseConsolidatedTable data={data} />

                {/* System Information */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase text-base">System Information</h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-base">
                        <div className="flex"><span className="w-64 text-gray-900 font-bold uppercase">Status</span><span className="mr-4">:</span><span className="flex-1 text-green-600 font-bold uppercase">Consolidated & Verified</span></div>
                        <div className="flex">
                            <span className="w-64 text-gray-900 font-bold uppercase">Generated At</span><span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1 font-medium">
                                {new Date().toLocaleString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Signature Section for Print */}
                <div className="hidden print:grid grid-cols-3 gap-12 mt-24">
                    <div className="text-center"><div className="border-t-2 border-black pt-3"><p className="font-bold text-sm uppercase tracking-widest">Instructor</p></div></div>
                    <div className="text-center"><div className="border-t-2 border-black pt-3"><p className="font-bold text-sm uppercase tracking-widest">Chief Instructor</p></div></div>
                    <div className="text-center"><div className="border-t-2 border-black pt-3"><p className="font-bold text-sm uppercase tracking-widest">Commandant</p></div></div>
                </div>
            </div>
        </div>
    );
}
