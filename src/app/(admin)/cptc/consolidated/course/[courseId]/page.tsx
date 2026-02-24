"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { cptcService } from "@/libs/services/cptcService";
import FullLogo from "@/components/ui/fulllogo";
import { getOrdinal } from "@/libs/utils/formatter";

// ─── Sub-Components ────────────────────────────────────────────────────────

const OverallMasterConsolidatedTable = ({ data, atwData, ctwData, ftwData, olqData }: { 
    data: any | null,
    atwData: any,
    ctwData: any,
    ftwData: any,
    olqData: any
}) => {
    const router = useRouter();
    const [filter, setFilter] = useState<"gdp" | "others">("gdp");

    const semesters = useMemo(() => data?.semesters || [], [data]);

    // Wings configuration with multipliers
    const wings = [
        { key: 'ftw', label: 'Flg', data: ftwData, weight: 6 },
        { key: 'atw', label: 'ATW', data: atwData, weight: 4 },
        { key: 'ctw', label: 'CTW', data: ctwData, weight: 3 },
        { key: 'olq', label: 'OLQ', data: olqData, weight: 3 }
    ];

    const totalMaxWeighted = useMemo(() => wings.reduce((sum, w) => sum + (100 * w.weight), 0), [wings]);

    // Process Cadets - Unified List
    const processedCadets = useMemo(() => {
        if (!data) return [];

        const cadetMap = new Map<number, any>();
        
        wings.forEach(wing => {
            const allWingCadets = [...wing.data.flying, ...wing.data.others];
            allWingCadets.forEach(c => {
                if (!cadetMap.has(c.id)) {
                    cadetMap.set(c.id, {
                        id: c.id,
                        name: c.name,
                        bd_no: c.bd_no,
                        rank: c.rank,
                        branch: c.branch,
                        isFlying: c.isFlying,
                        wingResults: {} 
                    });
                }
                const cadet = cadetMap.get(c.id);
                
                let wingAchievedTotal = 0;
                let wingFullTotal = 0;

                semesters.forEach((sem: any) => {
                    const achieved = c.semesters[sem.id]?.achieved || 0;
                    const full = c.isFlying ? (wing.data as any).flyingSemFull?.[sem.id] : (wing.data as any).othersSemFull?.[sem.id];
                    const finalFull = full || (wing.data as any).full || 0;
                    
                    wingAchievedTotal += achieved;
                    wingFullTotal += finalFull;
                });

                const wingPct = wingFullTotal > 0 ? (wingAchievedTotal / wingFullTotal) * 100 : 0;

                cadet.wingResults[wing.key] = { 
                    achievedTotal: wingAchievedTotal, 
                    fullTotal: wingFullTotal,
                    weightedAchieved: wingPct * wing.weight,
                    weightedFull: 100 * wing.weight,
                    percentage: wingPct
                };
            });
        });

        return Array.from(cadetMap.values()).map(cadet => {
            let overallWeightedTotal = 0;
            const wingOverallPercentages: any = {};

            wings.forEach(wing => {
                const res = cadet.wingResults[wing.key] || { weightedAchieved: 0, weightedFull: 100 * wing.weight, percentage: 0 };
                overallWeightedTotal += res.weightedAchieved;
                wingOverallPercentages[wing.key] = res.percentage;
            });

            return {
                ...cadet,
                wingOverallPercentages,
                overallWeightedTotal,
                overallPercentage: totalMaxWeighted > 0 ? (overallWeightedTotal / totalMaxWeighted) * 100 : 0
            };
        });
    }, [data, semesters, wings, totalMaxWeighted]);

    // Filter and Rank
    const filteredCadets = useMemo(() => {
        let list = processedCadets.filter(c => filter === "gdp" ? c.isFlying : !c.isFlying);
        const sorted = [...list].sort((a, b) => b.overallWeightedTotal - a.overallWeightedTotal);
        
        return list.map(c => {
            const pos = sorted.findIndex(s => s.id === c.id) + 1;
            return { ...c, position: pos };
        }).sort((a, b) => (a.bd_no || "").localeCompare(b.bd_no || ""));

    }, [processedCadets, filter]);

    if (!data) return null;

    const handleWingClick = (wingKey: string) => {
        const path = `/cptc/consolidated/course/${data.id}/${wingKey}`;
        router.push(path);
    };

    return (
        <div className="mt-8 mb-12">
            <div className="flex justify-between items-end gap-4 border-b border-dashed border-gray-400 mb-4 pb-2">
                <h2 className="text-lg font-bold text-gray-900 uppercase text-base">Master Overall Course Consolidated Performance</h2>
                <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 p-1 rounded-full text-xs no-print">
                    <button 
                        onClick={() => setFilter("gdp")} 
                        className={`px-4 py-1.5 rounded-full transition-all ${filter === "gdp" ? "bg-blue-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                    >
                        GDP
                    </button>
                    <button 
                        onClick={() => setFilter("others")} 
                        className={`px-4 py-1.5 rounded-full transition-all ${filter === "others" ? "bg-blue-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
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
                            <th className="border border-black px-1 py-2 text-center font-bold" colSpan={4}>Particulars of Offr Cdts</th>
                            <th className="border border-black px-1 py-2 text-center font-bold" colSpan={8}>Marks Obtained</th>
                            <th className="border border-black px-2 py-2 text-center" rowSpan={2}>Grand Total</th>
                            <th className="border border-black px-2 py-2 text-center" rowSpan={3}>%</th>
                            <th className="border border-black px-2 py-2 text-center" rowSpan={3}>Posn</th>
                        </tr>
                        <tr>
                            <th rowSpan={2} className="border border-black px-2 py-1 text-center">BD/No</th>
                            <th rowSpan={2} className="border border-black px-1 py-1 text-center">Rank</th>
                            <th rowSpan={2} className="border border-black px-2 py-1 text-center min-w-[150px]">Name</th>
                            <th rowSpan={2} className="border border-black px-2 py-1 text-center">Branch</th>
                            
                            {wings.map(wing => (
                                <th key={wing.key} 
                                    className="border border-black px-2 py-2 text-center cursor-pointer hover:bg-gray-100 hover:underline transition-colors"
                                    colSpan={2}
                                    onClick={() => handleWingClick(wing.key)}
                                >
                                    {wing.label}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {wings.map(wing => {
                                return (
                                    <React.Fragment key={wing.key}>
                                        <th className="border border-black px-2 py-1 text-center font-bold">(%)</th>
                                        <th className="border border-black px-2 py-1 text-center font-bold">x {wing.weight}</th>
                                    </React.Fragment>
                                );
                            })}

                            <th className="border border-black px-2 py-1 text-center font-bold">({totalMaxWeighted.toFixed(0)})</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCadets.length > 0 ? filteredCadets.map((cadet: any, cIdx: number) => (
                            <tr key={cadet.id} className="transition-colors hover:bg-gray-50">
                                <td className="border border-black px-2 py-2 text-center font-medium">{cIdx + 1}</td>
                                <td className="border border-black px-2 py-2 text-center">{cadet.bd_no}</td>
                                <td className="border border-black px-2 py-2 text-center">{cadet.rank}</td>
                                <td className="border border-black px-3 py-2 text-left font-bold">{cadet.name}</td>
                                <td className="border border-black px-2 py-2 text-center">{cadet.branch}</td>

                                {wings.map(wing => {
                                    const res = cadet.wingResults[wing.key] || { weightedAchieved: 0, percentage: 0 };
                                    return (
                                        <React.Fragment key={wing.key}>
                                            <td className="border border-black px-2 py-2 text-center">
                                                {res.percentage.toFixed(4)}
                                            </td>
                                            <td className="border border-black px-2 py-2 text-center">
                                                {res.weightedAchieved.toFixed(4)}
                                            </td>
                                        </React.Fragment>
                                    );
                                })}

                                <td className="border border-black px-2 py-2 text-center font-bold">{cadet.overallWeightedTotal.toFixed(4)}</td>
                                <td className="border border-black px-2 py-2 text-center">{cadet.overallPercentage.toFixed(4)}</td>
                                <td className="border border-black px-2 py-2 text-center">{cadet.position !== 0 ? getOrdinal(cadet.position) : '-'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={16} className="px-4 py-8 text-center text-gray-400 italic font-medium">No results found for {filter.toUpperCase()}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── Main Page Component ───────────────────────────────────────────────────

export default function CourseConsolidatedResultsPage({ params }: { params: Promise<{ courseId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const courseId = parseInt(resolvedParams.courseId);

    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await cptcService.getConsolidatedResultsByCourse(courseId);
                setData(response);
            } catch (error) {
                console.error("Failed to fetch course data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    const handlePrint = () => window.print();
    const handleBack = () => router.push("/cptc/consolidated");

    const isFlyingBranch = (category: string) => {
        const cat = category?.toLowerCase() || "";
        return cat.includes("flying") || cat.includes("pilot") || cat.includes("gdp");
    };

    const extractWingData = (wingResults: any[], syllabusSummary?: any, staticFull?: number) => {
        const cadetMap = new Map<number, any>();
        const flyingSemFull: Record<number, number> = {};
        const othersSemFull: Record<number, number> = {};

        if (syllabusSummary) {
            Object.entries(syllabusSummary).forEach(([semIdStr, semData]: [string, any]) => {
                const semId = parseInt(semIdStr);
                let flyingTotal = 0;
                let othersTotal = 0;

                if (semData.programs) {
                    Object.values(semData.programs).forEach((program: any) => {
                        if (program.branches) {
                            Object.values(program.branches).forEach((branch: any) => {
                                const bName = (branch.branch_name || "").toLowerCase();
                                if (bName.includes("pilot") || bName.includes("gdp")) {
                                    flyingTotal = parseFloat(branch.total_mark || 0);
                                } else if (othersTotal === 0) {
                                    othersTotal = parseFloat(branch.total_mark || 0);
                                }
                            });
                        }
                    });
                }
                flyingSemFull[semId] = flyingTotal;
                othersSemFull[semId] = othersTotal;
            });
        }
        wingResults?.forEach((group: any) => {
            group.results?.forEach((entry: any) => {
                const cadetId = entry.cadet_details.id;
                if (!cadetMap.has(cadetId)) {
                    cadetMap.set(cadetId, {
                        id: cadetId,
                        name: entry.cadet_details.name,
                        bd_no: entry.cadet_details.bd_no,
                        rank: entry.cadet_details.rank,
                        branch: entry.cadet_details.branch,
                        isFlying: isFlyingBranch(entry.cadet_details.branch),
                        semesters: {}
                    });
                }
                const cData = cadetMap.get(cadetId);
                cData.semesters[entry.semester_id] = { achieved: parseFloat(entry.cadet_details.total_achieved || 0) };
            });
        });

        const all = Array.from(cadetMap.values());
        const flyingFullTotal = Object.values(flyingSemFull).reduce((a, b) => a + b, 0);
        const othersFullTotal = Object.values(othersSemFull).reduce((a, b) => a + b, 0);

        return {
            flying: all.filter(c => c.isFlying),
            others: all.filter(c => !c.isFlying),
            flyingSemFull,
            othersSemFull,
            flyingFullTotal,
            othersFullTotal,
            full: staticFull
        };
    };

    const atwConsolidatedData = useMemo(() => {
        return extractWingData(data?.results?.atw, data?.subjects);
    }, [data]);

    const ctwConsolidatedData = useMemo(() => {
        const semFull: Record<number, number> = {};
        data?.semesters?.forEach((sem: any) => {
            let total = 0;
            data?.modules?.forEach((mod: any) => {
                const est = mod.estimated_marks?.find((em: any) => em.semester_id === sem.id);
                total += parseFloat(est?.conversation_mark || 0);
            });
            semFull[sem.id] = total;
        });

        const extracted = extractWingData(data?.results?.ctw);
        return { ...extracted, flyingSemFull: semFull, othersSemFull: semFull };
    }, [data]);

    const ftwConsolidatedData = useMemo(() => {
        return extractWingData(data?.results?.ftw, null, 100);
    }, [data]);

    const olqConsolidatedData = useMemo(() => {
        return extractWingData(data?.results?.olq, null, 100);
    }, [data]);

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
                <h2 className="text-xl font-bold text-gray-900">Course Not Found</h2>
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
                    <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2 inline-block w-full">Consolidated Result Sheet</p>
                </div>

                {/* Course Info */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase text-base">Course Information</h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-base">
                        <div className="flex"><span className="w-64 text-gray-900">Course</span><span className="mr-4">:</span><span className="text-gray-900 flex-1">{data.name} ({data.code})</span></div>
                        <div className="flex"><span className="w-64 text-gray-900">Total Semesters</span><span className="mr-4">:</span><span className="text-gray-900 flex-1">{data.semesters?.length}</span></div>
                    </div>
                </div>

                {/* Master Table */}
                <OverallMasterConsolidatedTable 
                    data={data} 
                    atwData={atwConsolidatedData} 
                    ctwData={ctwConsolidatedData} 
                    ftwData={ftwConsolidatedData} 
                    olqData={olqConsolidatedData} 
                />

                {/* System Information */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase text-base">System Information</h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-base">
                        <div className="flex"><span className="w-64 text-gray-900">Status</span><span className="mr-4">:</span><span className="flex-1 text-green-600">Consolidated & Verified</span></div>
                        <div className="flex">
                            <span className="w-64 text-gray-900">Generated At</span><span className="mr-4">:</span>
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
