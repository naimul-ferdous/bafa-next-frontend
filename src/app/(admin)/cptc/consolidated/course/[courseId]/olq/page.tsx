"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { cptcService } from "@/libs/services/cptcService";
import FullLogo from "@/components/ui/fulllogo";
import { getOrdinal } from "@/libs/utils/formatter";

// ─── Sub-Components ────────────────────────────────────────────────────────

const OverallCourseOlqConsolidatedTable = ({ data }: { data: any | null }) => {
    const [filter, setFilter] = useState<"gdp" | "others">("gdp");

    const semesters = useMemo(() => data?.course_details?.semesters || [], [data]);

    // Multipliers: 1st=1, 2nd=1.5, 3rd=2, 4th=2.5, 5th=3, 6th=3...
    const getMultiplier = (index: number) => {
        if (index >= 4) return 3.0; // 5th semester (idx 4) and 6th semester (idx 5) both use 3.0
        return 1 + (index * 0.5);
    };

    const totalPossibleWeightedMarks = useMemo(() => {
        return semesters.reduce((sum: number, _: any, idx: number) => sum + (100 * getMultiplier(idx)), 0);
    }, [semesters]);

    // Wings list keys for calculation
    const wings = ['atw', 'ctw', 'ftw11', 'ftw12'];

    // Process Cadets - Flattened List from Backend Branch Groups
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
                        semesterResults: {},
                        overallWeightedTotal: 0,
                        overallMultiplierSum: 0,
                        overallPercentage: 0
                    });
                }
                const cadet = cadetMap.get(cadetId);
                
                // Calculate Semester Average Percentage
                let semTotalPct = 0;
                let semWingCount = 0;

                wings.forEach(wingKey => {
                    const wingRes = entry.olq_results?.[wingKey];
                    if (wingRes) {
                        // Calculate for this Semester
                        if (wingRes.percentage !== undefined && wingRes.percentage !== null) {
                            semTotalPct += parseFloat(wingRes.percentage);
                            semWingCount++;
                        }
                    }
                });

                const semAvg = semWingCount > 0 ? (semTotalPct / semWingCount) : null;
                const semIdx = semesters.findIndex((s: any) => s.id === entry.semester_id);
                const multiplier = getMultiplier(semIdx);

                if (semAvg !== null) {
                    const weighted = semAvg * multiplier;
                    cadet.overallWeightedTotal += weighted;
                    cadet.overallMultiplierSum += multiplier;
                    
                    cadet.semesterResults[entry.semester_id] = {
                        avg: semAvg,
                        multiplier,
                        weighted: weighted
                    };
                } else {
                    cadet.semesterResults[entry.semester_id] = {
                        avg: null,
                        multiplier,
                        weighted: null
                    };
                }
            });

            const branchCadets = Array.from(cadetMap.values());
            branchCadets.forEach(c => {
                c.overallPercentage = c.overallMultiplierSum > 0 ? (c.overallWeightedTotal / c.overallMultiplierSum) : 0;
            });

            flattened.push(...branchCadets);
        });

        return flattened;

    }, [data, semesters]);

    // Filter Cadets based on selection and calculate Position
    const filteredCadets = useMemo(() => {
        let list = [];
        if (filter === "gdp") {
            list = allCadets.filter(c => (c.branchName || "").toLowerCase().includes("pilot") || (c.branchName || "").includes("GDP"));
        } else {
            list = allCadets.filter(c => !((c.branchName || "").toLowerCase().includes("pilot") || (c.branchName || "").includes("GDP")));
        }

        // Sort by Percentage DESC for position calculation
        const sorted = [...list].sort((a, b) => (b.overallPercentage || 0) - (a.overallPercentage || 0));
        
        // Map back to includes positions
        return list.map(c => {
            const pos = sorted.findIndex(s => s.id === c.id) + 1;
            return { ...c, position: pos };
        }).sort((a, b) => (a.bd_no || "").localeCompare(b.bd_no || "")); // Final sort by BD No

    }, [allCadets, filter]);

    if (!data) return null;

    return (
        <div className="mt-8 mb-12">
            <div className="flex justify-between items-end gap-4 border-b border-dashed border-gray-400 mb-4 pb-2">
                <h2 className="text-lg font-bold text-gray-900 uppercase text-base">Overall Course OLQ Result</h2>
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
                <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                        <tr>
                            <th className="border border-black px-1 py-2 text-center w-8 font-bold" rowSpan={3}>Ser</th>
                            <th className="border border-black px-1 py-2 text-center" colSpan={4} rowSpan={2}>Particulars of Offr Cdts</th>
                            <th className="border border-black px-1 py-2 text-center" colSpan={semesters.length * 2}>Marks Obtained</th>
                            <th className="border border-black px-2 py-2 text-center" rowSpan={2}>Total </th>
                            <th className="border border-black px-2 py-2 text-center" rowSpan={3}>%</th>
                            <th className="border border-black px-2 py-2 text-center" rowSpan={3}>Posn</th>
                        </tr>
                        <tr>
                            {semesters.map((sem: any, idx: number) => (
                                <th key={sem.id} colSpan={2} className="border border-black px-2 py-2 text-center">
                                    {sem.name}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            <th className="border border-black px-2 py-1 text-center">BD/No</th>
                            <th className="border border-black px-2 py-2 text-center">Rank</th>
                            <th className="border border-black px-2 py-1 text-center">Name</th>
                            <th className="border border-black px-2 py-1 text-center">Branch</th>
                            {semesters.map((sem: any, idx: number) => {
                                const mult = getMultiplier(idx);
                                return (
                                    <React.Fragment key={sem.id}>
                                        <th className="border border-black px-2 py-2 text-center">(%)</th>
                                        <th className="border border-black px-2 py-2 text-center">x {mult.toFixed(1)}</th>
                                    </React.Fragment>
                                );
                            })}
                            <th className="border border-black px-2 py-2 text-center">{totalPossibleWeightedMarks}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCadets.length > 0 ? filteredCadets.map((cadet: any, cIdx: number) => (
                            <tr key={cadet.id} className="transition-colors hover:bg-gray-50">
                                <td className="border border-black px-2 py-2 text-center font-medium">{cIdx + 1}</td>
                                <td className="border border-black px-2 py-2 text-center">{cadet.bd_no}</td>
                                <td className="border border-black px-2 py-2 text-center">{cadet.rank}</td>
                                <td className="border border-black px-2 py-2 font-bold">{cadet.name}</td>
                                <td className="border border-black px-2 py-2 text-center">{cadet.branch}</td>

                                {semesters.map((sem: any) => {
                                    const semRes = cadet.semesterResults[sem.id];
                                    return (
                                        <React.Fragment key={sem.id}>
                                            <td className="border border-black px-2 py-2 text-center">
                                                {semRes?.avg != null ? `${semRes.avg.toFixed(4)}` : "-"}
                                            </td>
                                            <td className="border border-black px-2 py-2 text-center">
                                                {semRes?.weighted != null ? `${semRes.weighted.toFixed(4)}` : "-"}
                                            </td>
                                        </React.Fragment>
                                    );
                                })}

                                <td className="border border-black px-2 py-2 text-center font-bold">{(cadet.overallWeightedTotal || 0).toFixed(4)}</td>
                                <td className="border border-black px-2 py-2 text-center">{(cadet.overallPercentage || 0).toFixed(4)}</td>
                                <td className="border border-black px-2 py-2 text-center">{cadet.position !== 0 ? getOrdinal(cadet.position) : '-'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={8 + semesters.length * 2} className="px-4 py-8 text-center text-gray-400 italic font-medium">No results found for {filter.toUpperCase()}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function CptcOlqConsolidatedPage({ params }: { params: Promise<{ courseId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const courseId = parseInt(resolvedParams.courseId);

    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await cptcService.getConsolidatedResultsByCourseOlq(courseId);
                setData(result);
            } catch (error) {
                console.error("Failed to fetch OLQ consolidated results:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    const handlePrint = () => window.print();
    const handleBack = () => router.push("/cptc/consolidated");

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
                </div>
            </div>

            <div className="p-8 cv-content">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
                    <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2 inline-block w-full">Consolidated OLQ Result Sheet</p>
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
                <OverallCourseOlqConsolidatedTable data={data} />

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
