"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { cptcService, CptcConsolidatedData } from "@/libs/services/cptcService";
import FullLogo from "@/components/ui/fulllogo";
import { getOrdinal } from "@/libs/utils/formatter";

// ─── Sub-Components ────────────────────────────────────────────────────────

const OverallCourseConsolidatedTable = ({ data, courseId }: { data: any | null, courseId: number }) => {
    const router = useRouter();
    const [filter, setFilter] = useState<"gdp" | "others">("gdp");

    const semesters = useMemo(() => data?.course_details?.semesters || [], [data]);

    // 1. Calculate Semester Totals (Max Marks) from Subjects (Nested: Sem -> Program -> Branch)
    const semesterTotals = useMemo(() => {
        const map = new Map<number, number>();
        if (!data?.subjects) return map;

        Object.entries(data.subjects).forEach(([semIdStr, semData]: [string, any]) => {
            const semId = parseInt(semIdStr);
            let targetTotal = 0;
            let fallbackTotal = 0;

            if (semData.programs) {
                Object.values(semData.programs).forEach((program: any) => {
                    if (program.branches) {
                        Object.values(program.branches).forEach((branch: any) => {
                            const bName = (branch.branch_name || "").toLowerCase();
                            const isGdp = bName.includes("pilot") || bName.includes("gdp");
                            const mark = parseFloat(branch.total_mark || 0);

                            if (filter === "gdp" && isGdp) {
                                targetTotal = mark;
                            } else if (filter === "others" && !isGdp && !bName.includes("common")) {
                                if (targetTotal === 0) targetTotal = mark;
                            }

                            // Fallback: use any branch total if no specific match found
                            if (fallbackTotal === 0 && mark > 0) {
                                fallbackTotal = mark;
                            }
                        });
                    }
                });
            }

            map.set(semId, targetTotal > 0 ? targetTotal : fallbackTotal);
        });
        return map;
    }, [data, filter]);

    const totalCourseMarks = Array.from(semesterTotals.values()).reduce((a, b) => a + b, 0);

    // 2. Process Cadets - Flattened List from Backend Branch Groups
    const allCadets = useMemo(() => {
        if (!data?.results) return [];

        const flattened: any[] = [];

        data.results.forEach((branchGroup: any) => {
            const cadetMap = new Map<number, any>();

            branchGroup.results.forEach((entry: any) => {
                const cadetId = entry.cadet_details.id;
                if (!cadetMap.has(cadetId)) {
                    cadetMap.set(cadetId, {
                        ...entry.cadet_details, // id, name, bd_no, rank, branch...
                        branchName: branchGroup.branch_name, 
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
                <div className="flex items-center gap-1 bg-gray-100 border-gray-200 p-1 rounded-full text-xs no-print">
                    <button 
                        onClick={() => setFilter("gdp")} 
                        className={`px-2 py-1 rounded-full font-bold uppercase transition-all ${filter === "gdp" ? "bg-blue-500 text-white" : "text-gray-500 hover:text-gray-900"}`}
                    >
                        GDP
                    </button>
                    <button 
                        onClick={() => setFilter("others")} 
                        className={`px-2 py-1 rounded-full font-bold uppercase transition-all ${filter === "others" ? "bg-blue-500 text-white" : "text-gray-500 hover:text-gray-900"}`}
                    >
                        Others
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-sm">
                    <thead className="font-semibold">
                        <tr>
                            <th className="border border-black px-1 py-2 text-center w-10" rowSpan={3}>Ser</th>
                            <th className="border border-black px-1 py-2 text-center font-base" colSpan={4}>Particulars of Offr Cdts</th>
                            <th className="border border-black px-1 py-2 text-center" colSpan={semesters.length}>Results of Academics</th>
                            <th className="border border-black px-2 py-2 text-center" rowSpan={2}>Total</th>
                            <th className="border border-black px-2 py-2 text-center" rowSpan={3}>%</th>
                            <th className="px-2 py-2 text-center"  rowSpan={3}>Posn</th>
                        </tr>
                        <tr>
                            <th className="border border-black px-2 py-2 text-center min-w-[80px]" rowSpan={2}>BD/No</th>
                            <th className="border border-black px-1 py-2 text-center" rowSpan={2}>Rank</th>
                            <th className="border border-black px-2 py-2 text-center min-w-[180px]" rowSpan={2}>Name</th>
                            <th className="border border-black px-2 py-2 text-center" rowSpan={2}>Branch</th>
                            
                            {/* Semester Headers */}
                            {semesters.map((sem: any) => (
                                <th 
                                    key={sem.id} 
                                    className="border border-black px-2 py-2 text-center cursor-pointer hover:bg-gray-100 transition-colors group"
                                    onClick={() => router.push(`/cptc/consolidated/course/${courseId}/atw/semester/${sem.id}`)}
                                >
                                    <span className="group-hover:text-blue-600 group-hover:underline">{sem.name}</span>
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
                                <td className="border border-black px-2 py-2 text-center font-medium">{cIdx + 1}</td>
                                <td className="border border-black px-2 py-2 text-center font-mono">{cadet.bd_no}</td>
                                <td className="border border-black px-2 py-2 text-center">{cadet.rank}</td>
                                <td className="border border-black px-2 py-2 font-bold text-gray-800">{cadet.name}</td>
                                <td className="border border-black px-2 py-2 text-center">{cadet.branchName}</td>

                                {semesters.map((sem: any) => (
                                    <td key={sem.id} className="border border-black px-2 py-2 text-center">
                                        {(cadet.semesterMarks[sem.id] || 0).toFixed(4)}
                                    </td>
                                ))}

                                <td className="border border-black px-2 py-2 text-center font-bold">{cadet.grandTotal.toFixed(4)}</td>
                                <td className="border border-black px-2 py-2 text-center">
                                    {totalCourseMarks > 0 ? ((cadet.grandTotal / totalCourseMarks) * 100).toFixed(4) : "0.00"}
                                </td>
                                <td className="border border-black px-2 py-2 text-center text-gray-400">{getOrdinal(getRank(cadet.id, filteredCadets, 'grandTotal'))}</td>
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

export default function CptcAtwConsolidatedPage({ params }: { params: Promise<{ courseId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const courseId = parseInt(resolvedParams.courseId);

    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Call the new specific ATW endpoint
                const result = await cptcService.getConsolidatedResultsByCourseAtw(courseId);
                setData(result);
            } catch (error) {
                console.error("Failed to fetch ATW consolidated results:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    const handlePrint = () => window.print();
    const handleBack = () => router.push("/cptc/consolidated/course/" + courseId);
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
                    <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2 inline-block w-full">ATW Consolidated Result Sheet</p>
                </div>

                {/* Course Info */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase text-base">Course Information</h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-base">
                        <div className="flex"><span className="w-64 text-gray-900 font-bold uppercase">Course</span><span className="mr-4">:</span><span className="text-gray-900 flex-1">{data.course_details?.name} ({data.course_details?.code})</span></div>
                        <div className="flex"><span className="w-64 text-gray-900 font-bold uppercase">Total Semesters</span><span className="mr-4">:</span><span className="text-gray-900 flex-1">{data.course_details?.semesters.length}</span></div>
                    </div>
                </div>

                {/* Overall Table */}
                <OverallCourseConsolidatedTable data={data} courseId={courseId} />

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