"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { cptcService, CptcConsolidatedData } from "@/libs/services/cptcService";
import FullLogo from "@/components/ui/fulllogo";

export default function AtwConsolidatedResultsPage({ params }: { params: Promise<{ courseId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const courseId = parseInt(resolvedParams.courseId);

    const [data, setData] = useState<CptcConsolidatedData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const courseData = await cptcService.getConsolidatedResultsByCourse(courseId);
                setData(courseData);
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
    const handleExport = () => console.log("Export data");

    // ─── Helpers ───────────────────────────────────────────────────────────────

    const isFlyingBranch = (category: string) => {
        const cat = category?.toLowerCase() || "";
        return cat.includes("flying") || cat.includes("pilot") || cat.includes("gdp");
    };

    // ─── ATW Consolidated Aggregation ─────────────────────────────────────────

    const atwConsolidatedData = useMemo(() => {
        if (!data?.semesters_details) return { flying: [], others: [], flyingSemFull: {}, othersSemFull: {} };

        const cadetMap = new Map<number, any>();
        const flyingSemFull: Record<number, number> = {};
        const othersSemFull: Record<number, number> = {};
        const flyingSubjectsPerSem = new Map<number, Set<number>>();
        const othersSubjectsPerSem = new Map<number, Set<number>>();
        const subjectFullMarks = new Map<number, number>();

        data.semesters_details.forEach((sem) => {
            sem.atw.results?.forEach((res: any) => {
                if (!subjectFullMarks.has(res.atw_subject_id)) {
                    const fullMark = Number(res.atw_subject?.subjects_full_mark) || res.atw_subject?.subject_marks?.reduce(
                        (sum: number, sm: any) => sum + Number(sm.percentage || 0), 0
                    ) || 0;
                    subjectFullMarks.set(res.atw_subject_id, fullMark);
                }

                const isFlyingSubject = isFlyingBranch(res.branch?.category || "");
                const semSet = isFlyingSubject ? flyingSubjectsPerSem : othersSubjectsPerSem;
                if (!semSet.has(sem.id)) semSet.set(sem.id, new Set());
                semSet.get(sem.id)!.add(res.atw_subject_id);

                res.result_getting_cadets?.forEach((rc: any) => {
                    const isFlying = isFlyingBranch(rc.cadet?.branch?.category || "");
                    if (!cadetMap.has(rc.cadet_id)) {
                        cadetMap.set(rc.cadet_id, {
                            id: rc.cadet_id,
                            name: rc.cadet?.name,
                            bd_no: rc.cadet?.cadet_number,
                            rank: rc.cadet?.rank?.name || rc.cadet?.rank || "Cdt",
                            branch: rc.cadet?.branch?.name || res.branch?.name,
                            isFlying,
                            semesters: {}
                        });
                    }
                    const cData = cadetMap.get(rc.cadet_id);
                    if (!cData.semesters[sem.id]) cData.semesters[sem.id] = { achieved: 0 };

                    let subjectTotal = 0;
                    rc.cadet_marks?.forEach((cm: any) => {
                        const achieved = Number(cm.achieved_mark || 0);
                        const estimate = Number(cm.subject_mark?.estimate_mark || 1);
                        const percentage = Number(cm.subject_mark?.percentage || 0);
                        subjectTotal += (achieved / estimate) * percentage;
                    });
                    cData.semesters[sem.id].achieved += Math.ceil(subjectTotal);
                });
            });
        });

        data.semesters_details.forEach(sem => {
            flyingSemFull[sem.id] = Array.from(flyingSubjectsPerSem.get(sem.id) || []).reduce(
                (sum, sid) => sum + (subjectFullMarks.get(sid) || 0), 0
            );
            othersSemFull[sem.id] = Array.from(othersSubjectsPerSem.get(sem.id) || []).reduce(
                (sum, sid) => sum + (subjectFullMarks.get(sid) || 0), 0
            );
        });

        const allCadets = Array.from(cadetMap.values());
        return {
            flying: allCadets.filter(c => c.isFlying).sort((a, b) => (a.bd_no || "").localeCompare(b.bd_no || "")),
            others: allCadets.filter(c => !c.isFlying).sort((a, b) => (a.bd_no || "").localeCompare(b.bd_no || "")),
            flyingSemFull,
            othersSemFull,
        };
    }, [data]);

    // ─── Loading / Error ──────────────────────────────────────────────────────

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Icon icon="hugeicons:fan-01" className="w-12 h-12 animate-spin text-blue-600" />
        </div>
    );

    if (!data) return (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
            <Icon icon="hugeicons:alert-circle" className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Course Not Found</h2>
        </div>
    );

    const sections = [
        { title: "Flying Branches Results",         cadets: atwConsolidatedData.flying, full: atwConsolidatedData.flyingSemFull },
        { title: "Ground & Admin Branches Results", cadets: atwConsolidatedData.others, full: atwConsolidatedData.othersSemFull },
    ];
    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">

            {/* ── Page Header ── */}
            <div className="text-center mb-8 relative">
                <button
                    onClick={handleBack}
                    className="absolute left-0 top-0 flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors no-print"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />Back
                </button>
                <div className="flex justify-center mb-4"><FullLogo /></div>
                <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
                    ATW Consolidated Result Sheet — {data.name}
                </h2>
                <p className="text-xs text-gray-500 mt-1 font-mono">{data.code} • Academic Training Wing</p>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex items-center justify-between gap-4 mb-6 no-print">
                <button
                    onClick={handlePrint}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium text-sm"
                >
                    <Icon icon="hugeicons:printer" className="w-4 h-4" />Print
                </button>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-green-600 hover:bg-green-700 font-bold text-sm"
                >
                    <Icon icon="hugeicons:download-04" className="w-4 h-4 mr-1" />Export
                </button>
            </div>

            {/* ── Course Info ── */}
            <div className="mb-6">
                <h2 className=" text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase flex items-center gap-2">
                    <Icon icon="hugeicons:information-circle" className="text-blue-600" />Course Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-3 text-xs">
                    <div className="flex"><span className="w-48 text-gray-400 font-bold uppercase">Course</span><span className="mr-4 text-gray-300">:</span><span className="text-gray-900 font-medium flex-1">{data.name}</span></div>
                    <div className="flex"><span className="w-48 text-gray-400 font-bold uppercase">Course Code</span><span className="mr-4 text-gray-300">:</span><span className="text-gray-900 font-medium flex-1 font-mono">{data.code}</span></div>
                    <div className="flex"><span className="w-48 text-gray-400 font-bold uppercase">Total Semesters</span><span className="mr-4 text-gray-300">:</span><span className="text-gray-900 font-medium flex-1">{data.semesters_details.length} Semester(s)</span></div>
                    <div className="flex"><span className="w-48 text-gray-400 font-bold uppercase">Wing</span><span className="mr-4 text-gray-300">:</span><span className="text-gray-900 font-medium flex-1">ATW — Academic Training Wing</span></div>
                </div>
            </div>

            {/* ── ATW Consolidated Table ── */}
            <div className="mb-12">
                <h2 className=" text-gray-900 mb-6 pb-1 border-b border-dashed border-gray-400 uppercase flex items-center gap-2">
                    <Icon icon="hugeicons:book-open-01" className="text-blue-600" />ATW Consolidated Performance
                </h2>

                {sections.map((section, sIdx) => (
                    <div key={sIdx} className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-xs  text-gray-900 uppercase">{section.title} (Academic)</h3>
                        </div>
                        <div className="overflow-x-auto border border-black rounded-lg">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-black">
                                        <th rowSpan={3} className="border-r border-black px-1 py-2 text-center w-10">Ser</th>
                                        <th colSpan={4} className="border-r border-black px-1 py-2 text-center ">Particulars of Cdts</th>
                                        <th colSpan={data.semesters_details.length} className="border-r border-black px-1 py-2 text-center">
                                            Results of Academics
                                        </th>
                                        <th rowSpan={2} className="border-r border-black px-2 py-2 text-center">Total</th>
                                        <th rowSpan={3} className="px-2 py-2 text-center">Avg %</th>
                                    </tr>
                                    <tr className="border-b border-black">
                                        <th rowSpan={2} className="border-r border-black px-2 py-2 text-center  min-w-[70px]">BD/No</th>
                                        <th rowSpan={2} className="border-r border-black px-1 py-2 text-center ">Rank</th>
                                        <th rowSpan={2} className="border-r border-black px-2 py-2 text-center  min-w-[150px]">Name</th>
                                        <th rowSpan={2} className="border-r border-black px-2 py-2 text-center ">Branch</th>
                                        {data.semesters_details.map(sem => (
                                            <th key={sem.id} className="border-r border-black px-1 py-2 text-center">
                                                {sem.name}
                                            </th>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-black">
                                        {data.semesters_details.map(sem => (
                                            <th key={sem.id} className="border-r border-black px-1 py-2 text-center">
                                                {section.full[sem.id] || 0}
                                            </th>
                                        ))}
                                        <th className="border-r border-black px-2 py-2 text-center">
                                            {Object.values(section.full).reduce((a, b) => a + b, 0)}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.cadets.length > 0 ? section.cadets.map((cadet, idx) => {
                                        let gAchieved = 0, gFull = 0;
                                        const isLast = idx === section.cadets.length - 1;
                                        return (
                                            <tr key={cadet.id} className={`${isLast ? "" : "border-b border-black"} hover:bg-gray-50/50 transition-colors`}>
                                                <td className="border-r border-black px-1 py-2 text-center font-medium">{idx + 1}</td>
                                                <td className="border-r border-black px-1 py-2 text-center">{cadet.bd_no}</td>
                                                <td className="border-r border-black px-1 py-2 text-center">{cadet.rank}</td>
                                                <td className="border-r border-black px-2 py-2 text-left font-bold">{cadet.name}</td>
                                                <td className="border-r border-black px-1 py-2 text-center">{cadet.branch}</td>
                                                {data.semesters_details.map(sem => {
                                                    const ach = cadet.semesters[sem.id]?.achieved || 0;
                                                    const full = section.full[sem.id] || 0;
                                                    gAchieved += ach;
                                                    gFull += full;
                                                    return (
                                                        <td key={sem.id} className="border-r border-black px-1 py-2 text-center">
                                                            {ach > 0 ? Math.ceil(ach) : "-"}
                                                        </td>
                                                    );
                                                })}
                                                <td className="border-r border-black px-1 py-2 text-center">
                                                    {Math.ceil(gAchieved)}
                                                </td>
                                                <td className="px-1 py-2 text-center">
                                                    {gFull > 0 ? ((gAchieved / gFull) * 100).toFixed(2) : "0.00"}%
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={7 + data.semesters_details.length} className="px-4 py-8 text-center text-gray-400 italic">
                                                No cadets found in this category.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Footer ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4 text-[11px] pt-8 border-t border-gray-100">
                <div className="flex items-center">
                    <span className="w-48 text-gray-400 font-bold uppercase">Report Status</span>
                    <span className="mr-4 text-gray-300">:</span>
                    <span className="text-green-600  uppercase flex items-center gap-2">
                        <Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3" />Consolidated & Verified
                    </span>
                </div>
                <div className="flex items-center">
                    <span className="w-48 text-gray-400 font-bold uppercase">Generation Date</span>
                    <span className="mr-4 text-gray-300">:</span>
                    <span className="text-gray-900 font-medium">{new Date().toLocaleString("en-GB")}</span>
                </div>
            </div>

            {/* ── Print Signatures ── */}
            <div className="hidden print:grid grid-cols-3 gap-16 mt-32">
                {["Instructor", "Chief Instructor", "Commandant"].map((role, i) => (
                    <div key={i} className="text-center">
                        <div className="border-t border-black pt-4">
                            <p className=" text-[10px] uppercase tracking-[0.2em]">{role}</p>
                            <p className="text-[8px] text-gray-400 mt-1 uppercase">Bangladesh Air Force Academy</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}