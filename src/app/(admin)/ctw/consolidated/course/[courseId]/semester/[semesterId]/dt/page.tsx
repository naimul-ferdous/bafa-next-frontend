/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwResultService } from "@/libs/services/ctwResultService";
import { courseService } from "@/libs/services/courseService";
import { semesterService } from "@/libs/services/semesterService";
import FullLogo from "@/components/ui/fulllogo";
import { getOrdinal } from "@/libs/utils/formatter";

export default function CtwCourseSemesterDtConsolidatedPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = parseInt(params.courseId as string);
    const semesterId = parseInt(params.semesterId as string);

    const [consolidatedData, setConsolidatedData] = useState<any[]>([]);
    const [consolidateTab, setConsolidateTab] = useState<"main" | "breakdown">("main");
    const [course, setCourse] = useState<any>(null);
    const [semester, setSemester] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const [consolidatedRes, courseRes, semesterRes] = await Promise.all([
                ctwResultService.getConsolidatedResults({ course_id: courseId, semester_id: semesterId }),
                courseService.getCourse(courseId),
                semesterService.getSemester(semesterId),
            ]);
            if (consolidatedRes.success) {
                setConsolidatedData(consolidatedRes.data);
            } else {
                setError(consolidatedRes.message || "Failed to fetch results");
            }
            setCourse(courseRes);
            setSemester(semesterRes);
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError("An error occurred while fetching data");
        } finally {
            setLoading(false);
        }
    }, [courseId, semesterId]);

    useEffect(() => {
        if (courseId && semesterId) fetchData();
    }, [fetchData, courseId, semesterId]);

    const endDtModules = useMemo(() => {
        if (consolidatedData.length === 0) return [];
        const endResult = consolidatedData[0].results.find((r: any) => r.exam_type_details.code === "END");
        if (!endResult || !endResult.modules?.dt) return [];
        return endResult.modules.dt;
    }, [consolidatedData]);

    const totalPossibleMarkEND = useMemo(() =>
        endDtModules.reduce((sum: number, mod: any) => sum + (parseFloat(mod.conversation_mark) || 0), 0)
        , [endDtModules]);

    const computeConvertedMark = (mod: any, instructorMarks: any[]): number => {
        const instCount = parseInt(mod.instructor_count) || 1;
        const convMarkLimit = parseFloat(mod.conversation_mark) || 0;

        const isPercentageBased = (parseFloat(mod.convert_of_practice) || 0) + (parseFloat(mod.convert_of_exam) || 0) > 0;
        const isDetailBased = !isPercentageBased && (mod.estimated_mark_config?.details?.length > 0);

        if (isPercentageBased) {
            const convPracticeWeight = parseFloat(mod.convert_of_practice) || 0;
            const convExamWeight = parseFloat(mod.convert_of_exam) || 0;
            let totalFinal = 0;
            instructorMarks.forEach((im: any) => {
                const practices = (im.details || [])
                    .filter((d: any) => d.practices_marks !== null && d.practices_marks !== undefined)
                    .map((d: any) => parseFloat(String(d.practices_marks)));
                const avgPractice = practices.length > 0
                    ? practices.reduce((a: number, b: number) => a + b, 0) / practices.length : 0;
                const testMark = parseFloat(String(im.achieved_mark || 0));
                let finalMark = (avgPractice * convPracticeWeight / 100) + (testMark * convExamWeight / 100);
                if (convMarkLimit > 0 && finalMark > convMarkLimit) finalMark = convMarkLimit;
                totalFinal += finalMark;
            });
            return instructorMarks.length > 0 ? totalFinal / instructorMarks.length : 0;
        } else if (isDetailBased) {
            const details: any[] = mod.estimated_mark_config?.details || [];
            const detailEstTotal = details.reduce((sum: number, d: any) => sum + (parseFloat(d.male_marks) || 0), 0);
            const totalAchieved = instructorMarks.reduce((s: number, im: any) => s + (parseFloat(im.achieved_mark) || 0), 0);
            return detailEstTotal > 0 ? (totalAchieved / detailEstTotal) * convMarkLimit : 0;
        } else {
            const totalEst = (parseFloat(mod.estimated_mark) || 1) * instCount;
            const totalAchieved = instructorMarks.reduce((s: number, im: any) => s + (parseFloat(im.achieved_mark) || 0), 0);
            return totalEst > 0 ? (totalAchieved / totalEst) * convMarkLimit : 0;
        }
    };

    // Compute each cadet's END DT total once — used for ranking
    const cadetEndTotals = useMemo(() => {
        return consolidatedData.map((item: any) => {
            const endRes = item.results.find((r: any) => r.exam_type_details.code === "END")?.modules?.dt || [];
            let total = 0;
            endDtModules.forEach((mod: any) => {
                const m = endRes.find((x: any) => x.id === mod.id);
                if (m?.instructor_marks?.length) {
                    total += computeConvertedMark(mod, m.instructor_marks);
                }
            });
            return { id: item.cadet_details.id, total };
        });
    }, [consolidatedData, endDtModules]);

    // Build rank map: cadet id → rank (ties share the same rank)
    const cadetRankMap = useMemo(() => {
        const sorted = [...cadetEndTotals].sort((a, b) => b.total - a.total);
        const rankMap: Record<number, number> = {};
        sorted.forEach((item, idx) => {
            if (idx === 0) {
                rankMap[item.id] = 1;
            } else if (item.total === sorted[idx - 1].total) {
                rankMap[item.id] = rankMap[sorted[idx - 1].id];
            } else {
                rankMap[item.id] = idx + 1;
            }
        });
        return rankMap;
    }, [cadetEndTotals]);

    // Remarks based on percentage
    const getRemarks = (total: number): { text: string; className: string } => {
        if (total === 0) {
            return { text: "Not Assessed", className: "text-gray-400 italic" };
        }
        const pct = totalPossibleMarkEND > 0 ? (total / totalPossibleMarkEND) * 100 : 0;
        if (pct < 50) {
            return { text: "Below Standard", className: "text-red-600 font-semibold" };
        }
        return { text: "Satisfactory", className: "text-green-700 font-semibold" };
    };

    const handlePrint = () => window.print();
    const handleBack = () => router.push("/ctw/consolidated");

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-center justify-center min-h-[400px]">
                <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
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
                <div className="mb-8">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
                     <p className="text-center font-medium text-gray-900 uppercase tracking-wider inline-block w-full text-blue-700">Breakdown of DT Result : {course?.name}</p>
                    <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2 inline-block w-full text-blue-700">{semester?.name}</p>
                </div>

                <div className="mb-6">
                    <div className="flex justify-end items-center gap-4 mb-4 no-print">
                        <div className="flex items-center gap-1 p-1 rounded-full border border-gray-200 text-xs mb-2">
                            <button onClick={() => setConsolidateTab("main")} className={`px-4 py-1 rounded-full transition-all ${consolidateTab === "main" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}>
                                Summary
                            </button>
                            <button onClick={() => setConsolidateTab("breakdown")} className={`px-4 py-1 rounded-full transition-all ${consolidateTab === "breakdown" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}>
                                Breakdown
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {consolidateTab === "main" ? (
                            <table className="w-full border-collapse border border-black text-sm">
                                <thead>
                                    <tr>
                                        <th rowSpan={2} className="border border-black px-2 py-2 text-center">Ser</th>
                                        <th rowSpan={2} className="border border-black px-2 py-2 text-center">BD/No</th>
                                        <th rowSpan={2} className="border border-black px-2 py-2 text-center">Rank</th>
                                        <th rowSpan={2} className="border border-black px-3 py-2 text-left min-w-[160px]">Name</th>
                                        <th rowSpan={2} className="border border-black px-2 py-2 text-left">Branch</th>
                                        <th colSpan={endDtModules.length} className="border border-black px-1 py-1 text-center font-bold uppercase">END FINAL - DT</th>
                                        <th rowSpan={2} className="border border-black px-2 py-2 text-center font-bold">
                                            Total<br />({totalPossibleMarkEND.toFixed(0)})
                                        </th>
                                        <th rowSpan={2} className="border border-black px-2 py-2 text-center">%</th>
                                        <th rowSpan={2} className="border border-black px-2 py-2 text-center">Position</th>
                                        <th rowSpan={2} className="border border-black px-2 py-2 text-center min-w-[100px]">Remarks</th>
                                    </tr>
                                    <tr>
                                        {endDtModules.map((mod: any) => (
                                            <th key={`mod-head-${mod.id}`} className="border border-black px-1 py-1 text-start align-bottom" style={{ minWidth: '35px', maxWidth: '60px' }}>
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="font-semibold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '130px' }}>
                                                        {mod.name} - {(parseFloat(mod.conversation_mark) || 0).toFixed(0)}
                                                    </span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {consolidatedData.map((item: any, index: number) => {
                                        let endTotal = 0;
                                        const endRes = item.results.find((r: any) => r.exam_type_details.code === "END")?.modules?.dt || [];

                                        // Accumulate total inside the map (same pattern as before)
                                        const modCells = endDtModules.map((mod: any) => {
                                            const m = endRes.find((x: any) => x.id === mod.id);
                                            const conv = m?.instructor_marks?.length ? computeConvertedMark(mod, m.instructor_marks) : 0;
                                            endTotal += conv;
                                            return (
                                                <td key={`end-cell-${item.cadet_details.id}-${mod.id}`} className="border border-black px-1 py-1 text-center">
                                                    {conv > 0 ? conv.toFixed(2) : "-"}
                                                </td>
                                            );
                                        });

                                        const pct = totalPossibleMarkEND > 0
                                            ? ((endTotal / totalPossibleMarkEND) * 100)
                                            : 0;
                                        const remarks = getRemarks(endTotal);

                                        return (
                                            <tr key={item.cadet_details.id} className="transition-colors hover:bg-gray-50">
                                                <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                                                <td className="border border-black px-2 py-2 text-center">{item.cadet_details.bd_no}</td>
                                                <td className="border border-black px-2 py-2 text-center">{item.cadet_details.rank}</td>
                                                <td className="border border-black px-3 py-2 font-medium">{item.cadet_details.name}</td>
                                                <td className="border border-black px-2 py-2 text-left">{item.cadet_details.branch}</td>

                                                {modCells}

                                                {/* Total */}
                                                <td className="border border-black px-2 py-2 text-center font-bold">
                                                    {endTotal.toFixed(2)}
                                                </td>
                                                {/* Percentage */}
                                                <td className="border border-black px-2 py-2 text-center font-bold">
                                                    {pct.toFixed(2)}
                                                </td>
                                                {/* Position — ranked by total descending, with tie handling */}
                                                <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">
                                                    {endTotal > 0 ? getOrdinal(cadetRankMap[item.cadet_details.id]) : "-"}
                                                </td>
                                                {/* Remarks: "Not Assessed" if 0, "Below Standard" if < 50%, else "Satisfactory" */}
                                                <td className={`border border-black px-2 py-2 text-center text-xs ${remarks.className}`}>
                                                    {remarks.text}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full border-collapse border border-black text-sm">
                                <thead>
                                    <tr>
                                        <th rowSpan={3} className="border border-black px-1 py-1 text-center">Ser</th>
                                        <th rowSpan={3} className="border border-black px-1 py-1 text-center">BD/No</th>
                                        <th rowSpan={3} className="border border-black px-1 py-1 text-center">Rank</th>
                                        <th rowSpan={3} className="border border-black px-2 py-1 text-left min-w-[120px]">Name</th>
                                        <th rowSpan={3} className="border border-black px-2 py-1 text-left">Branch</th>
                                        {endDtModules.map((mod: any) => {
                                            const instCount = parseInt(mod.instructor_count) || 1;
                                            const colSpan = instCount > 1 ? instCount + 2 : 2;
                                            return (
                                                <th key={`head-${mod.id}`} colSpan={colSpan} className="border border-black px-1 py-1 text-center font-bold">
                                                    {mod.name}
                                                </th>
                                            );
                                        })}
                                        <th rowSpan={3} className="border border-black px-1 py-1 text-center font-bold uppercase">Total</th>
                                    </tr>
                                    <tr>
                                        {endDtModules.map((mod: any) => {
                                            const instCount = parseInt(mod.instructor_count) || 1;
                                            const estimatedMark = parseFloat(mod.estimated_mark) || 100;
                                            const conversationMark = parseFloat(mod.conversation_mark) || 0;

                                            if (instCount > 1) {
                                                return (
                                                    <React.Fragment key={`subhead-${mod.id}`}>
                                                        <th colSpan={instCount} className="border border-black px-1 py-1 text-center font-bold">
                                                            Instructors
                                                        </th>
                                                        <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold">
                                                            Avg <br /> {estimatedMark.toFixed(0)}
                                                        </th>
                                                        <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold">
                                                            Conv. <br /> {conversationMark.toFixed(2)}
                                                        </th>
                                                    </React.Fragment>
                                                );
                                            } else {
                                                return (
                                                    <React.Fragment key={`subhead-${mod.id}`}>
                                                        <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold">
                                                            Mark <br /> {estimatedMark.toFixed(0)}
                                                        </th>
                                                        <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold">
                                                            Conv. <br /> {conversationMark.toFixed(2)}
                                                        </th>
                                                    </React.Fragment>
                                                );
                                            }
                                        })}
                                    </tr>
                                    <tr>
                                        {endDtModules.map((mod: any) => {
                                            const instCount = parseInt(mod.instructor_count) || 1;
                                            if (instCount <= 1) return null;
                                            return Array.from({ length: instCount }, (_, i) => (
                                                <th key={`instr-${mod.id}-${i}`} className="border border-black px-1 py-1 text-center font-semibold">
                                                    Instr {i + 1}
                                                </th>
                                            ));
                                        })}
                                    </tr>
                                </thead>

                                <tbody>
                                    {consolidatedData.map((item: any, index: number) => {
                                        let grandConvertedTotal = 0;
                                        const endRes = item.results.find((r: any) => r.exam_type_details.code === "END")?.modules?.dt || [];

                                        return (
                                            <tr key={`break-${item.cadet_details.id}`} className="hover:bg-gray-50 transition-colors">
                                                <td className="border border-black px-1 py-1 text-center">{index + 1}</td>
                                                <td className="border border-black px-1 py-1 text-center">{item.cadet_details.bd_no}</td>
                                                <td className="border border-black px-1 py-1 text-center">{item.cadet_details.rank}</td>
                                                <td className="border border-black px-2 py-1 font-medium">{item.cadet_details.name}</td>
                                                <td className="border border-black px-2 py-1">{item.cadet_details.branch}</td>

                                                {endDtModules.map((mod: any) => {
                                                    const m = endRes.find((x: any) => x.id === mod.id);
                                                    const instructorMarks = m?.instructor_marks || [];
                                                    const instCount = parseInt(mod.instructor_count) || 1;
                                                    const conv = instructorMarks.length ? computeConvertedMark(mod, instructorMarks) : 0;
                                                    grandConvertedTotal += conv;

                                                    if (instCount > 1) {
                                                        const avgMark = instructorMarks.length
                                                            ? instructorMarks.reduce((s: number, mark: any) => s + parseFloat(mark.achieved_mark), 0) / instructorMarks.length
                                                            : 0;
                                                        return (
                                                            <React.Fragment key={`cells-${mod.id}`}>
                                                                {Array.from({ length: instCount }, (_, i) => {
                                                                    const mark = instructorMarks[i];
                                                                    return (
                                                                        <td key={i} className="border border-black px-1 py-1 text-center">
                                                                            {mark && parseFloat(mark.achieved_mark) !== 0 ? parseFloat(mark.achieved_mark).toFixed(1) : "-"}
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td className="border border-black px-1 py-1 text-center font-medium">
                                                                    {instructorMarks.length && avgMark !== 0 ? avgMark.toFixed(1) : "-"}
                                                                </td>
                                                                <td className="border border-black px-1 py-1 text-center font-bold text-blue-700">
                                                                    {conv > 0 ? conv.toFixed(2) : "-"}
                                                                </td>
                                                            </React.Fragment>
                                                        );
                                                    } else {
                                                        const singleMark = instructorMarks[0];
                                                        return (
                                                            <React.Fragment key={`cells-${mod.id}`}>
                                                                <td className="border border-black px-1 py-1 text-center font-medium">
                                                                    {singleMark && parseFloat(singleMark.achieved_mark) !== 0 ? parseFloat(singleMark.achieved_mark).toFixed(1) : "-"}
                                                                </td>
                                                                <td className="border border-black px-1 py-1 text-center font-bold text-blue-700">
                                                                    {conv > 0 ? conv.toFixed(2) : "-"}
                                                                </td>
                                                            </React.Fragment>
                                                        );
                                                    }
                                                })}

                                                <td className="border border-black px-1 py-1 text-center font-bold">
                                                    {grandConvertedTotal > 0 ? grandConvertedTotal.toFixed(2) : "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="hidden print:grid grid-cols-3 gap-12 mt-24">
                    <div className="text-center"><div className="border-t-2 border-black pt-3"><p className="font-bold text-sm uppercase tracking-widest">Instructor</p></div></div>
                    <div className="text-center"><div className="border-t-2 border-black pt-3"><p className="font-bold text-sm uppercase tracking-widest">Chief Instructor</p></div></div>
                    <div className="text-center"><div className="border-t-2 border-black pt-3"><p className="font-bold text-sm uppercase tracking-widest">Commandant</p></div></div>
                </div>
            </div>
        </div>
    );
}