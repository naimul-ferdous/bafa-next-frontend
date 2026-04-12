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

export default function CtwCourseSemesterPfConsolidatedPage() {
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

    const endPfModules = useMemo(() => {
        if (consolidatedData.length === 0) return [];
        const endResult = consolidatedData[0].results.find((r: any) => r.exam_type_details.code === "END");
        if (!endResult || !endResult.modules?.pf) return [];
        return endResult.modules.pf;
    }, [consolidatedData]);

    const isPercentageBased = (mod: any): boolean => {
        return (parseFloat(mod.convert_of_practice) || 0) + (parseFloat(mod.convert_of_exam) || 0) > 0;
    };

    const isDetailBased = (mod: any): boolean => {
        return !isPercentageBased(mod) && (mod.estimated_mark_config?.details?.length > 0);
    };

    const getEffectiveConvMark = (mod: any): number => {
        const convMark = parseFloat(mod.conversation_mark) || 0;
        if (convMark > 0) return convMark;
        if (isDetailBased(mod)) {
            return (mod.estimated_mark_config?.details || []).reduce(
                (sum: number, d: any) => sum + (parseFloat(d.male_marks) || 0), 0
            );
        }
        if (isPercentageBased(mod)) {
            const moduleTotal = parseFloat(mod.module_total_mark) || 0;
            const convertExam = parseFloat(mod.convert_of_exam) || 0;
            return moduleTotal * convertExam / 100;
        }
        return parseFloat(mod.estimated_mark) || 0;
    };

    const totalPossibleMarkEND = useMemo(() =>
        endPfModules.reduce((sum: number, mod: any) => sum + getEffectiveConvMark(mod), 0)
        , [endPfModules]);

    const computeConvertedMark = (mod: any, instructorMarks: any[]): number => {
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
            const instCount = parseInt(mod.instructor_count) || 1;
            const totalEst = (parseFloat(mod.estimated_mark) || 1) * instCount;
            const totalAchieved = instructorMarks.reduce((s: number, im: any) => s + (parseFloat(im.achieved_mark) || 0), 0);
            return totalEst > 0 ? (totalAchieved / totalEst) * convMarkLimit : 0;
        }
    };

    const moduleRankings = useMemo(() => {
        const rankings: Record<number, Record<number, number>> = {};
        endPfModules.forEach((mod: any) => {
            const list = consolidatedData.map((item: any) => {
                const endRes = item.results.find((r: any) => r.exam_type_details.code === "END")?.modules?.pf || [];
                const m = endRes.find((x: any) => x.id === mod.id);
                const instructorMarks = m?.instructor_marks || [];
                const conv = instructorMarks.length ? computeConvertedMark(mod, instructorMarks) : 0;
                return { id: item.cadet_details.id, conv };
            });
            list.sort((a: any, b: any) => b.conv - a.conv);
            const modRank: Record<number, number> = {};
            list.forEach((item: any, idx: number) => {
                if (idx === 0) modRank[item.id] = 1;
                else if (item.conv === list[idx - 1].conv) modRank[item.id] = modRank[list[idx - 1].id];
                else modRank[item.id] = idx + 1;
            });
            rankings[mod.id] = modRank;
        });
        return rankings;
    }, [consolidatedData, endPfModules]);

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
                    <p className="text-center font-medium text-gray-900 uppercase tracking-wider inline-block w-full text-blue-700">Breakdown of PF Result : {course?.name}</p>
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
                                        <th colSpan={endPfModules.length} className="border border-black px-1 py-1 text-center font-bold uppercase">END FINAL - PF</th>
                                        <th rowSpan={2} className="border border-black px-2 py-2 text-center font-bold">PF Total<br />({totalPossibleMarkEND.toFixed(0)})</th>
                                        <th rowSpan={2} className="border border-black px-2 py-2 text-center">%</th>
                                    </tr>
                                    <tr>
                                        {endPfModules.map((mod: any) => (
                                            <th key={`mod-head-${mod.id}`} className="border border-black px-1 py-1 text-start align-bottom" style={{ minWidth: '35px', maxWidth: '60px' }}>
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '130px' }}>
                                                        {mod.name} - {getEffectiveConvMark(mod).toFixed(0)}
                                                    </span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {consolidatedData.map((item: any, index: number) => {
                                        let endTotal = 0;
                                        const endRes = item.results.find((r: any) => r.exam_type_details.code === "END")?.modules?.pf || [];

                                        return (
                                            <tr key={item.cadet_details.id} className="transition-colors hover:bg-gray-50">
                                                <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                                                <td className="border border-black px-2 py-2 text-center">{item.cadet_details.bd_no}</td>
                                                <td className="border border-black px-2 py-2 text-center">{item.cadet_details.rank}</td>
                                                <td className="border border-black px-3 py-2 font-medium">{item.cadet_details.name}</td>
                                                <td className="border border-black px-2 py-2 text-left">{item.cadet_details.branch}</td>
                                                {endPfModules.map((mod: any) => {
                                                    const m = endRes.find((x: any) => x.id === mod.id);
                                                    const instructorMarks = m?.instructor_marks || [];
                                                    const conv = instructorMarks.length ? computeConvertedMark(mod, instructorMarks) : 0;
                                                    endTotal += conv;
                                                    return <td key={`end-cell-${item.cadet_details.id}-${mod.id}`} className="border border-black px-1 py-1 text-center">{conv > 0 ? conv.toFixed(2) : "-"}</td>;
                                                })}
                                                <td className="border border-black px-2 py-2 text-center font-bold">{endTotal.toFixed(2)}</td>
                                                <td className="border border-black px-2 py-2 text-center font-bold">{totalPossibleMarkEND > 0 ? ((endTotal / totalPossibleMarkEND) * 100).toFixed(2) : "0.00"}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full border-collapse border border-black text-sm">
                                <thead>
                                    <tr>
                                        <th className="border border-black px-1 py-1 text-center align-middle" rowSpan={3}>Ser</th>
                                        <th className="border border-black px-1 py-1 text-center align-middle font-bold" rowSpan={3}>BD No.</th>
                                        <th className="border border-black px-1 py-1 text-center align-middle" rowSpan={3}>Rank</th>
                                        <th className="border border-black px-2 py-1 text-left align-middle min-w-[100px]" rowSpan={3}>Name</th>
                                        <th className="border border-black px-2 py-1 text-left align-middle" rowSpan={3}>Branch</th>

                                        {endPfModules.map((mod: any) => {
                                            const practiceCount = parseInt(mod.practice_count) || 0;
                                            const details = mod.estimated_mark_config?.details || [];
                                            const hasPractices = practiceCount > 0 && details.length === 0;
                                            const hasDetails = details.length > 0;

                                            let colSpan = 2; // Base: Total, Conv
                                            if (hasPractices) colSpan += (practiceCount + 4); // Practices + Avg + Exam + Prac% + Exam%
                                            else if (hasDetails) {
                                                colSpan += details.reduce((sum: number, d: any) => sum + (d.scores && d.scores.length > 0 ? 2 : 1), 0);
                                            } else {
                                                colSpan += 1; // Exam
                                            }

                                            return (
                                                <th
                                                    key={`head-${mod.id}`}
                                                    colSpan={colSpan}
                                                    className="border border-black px-1 py-1 text-center"
                                                >
                                                    {mod.name} - {getEffectiveConvMark(mod).toFixed(0)}
                                                </th>
                                            );
                                        })}
                                        <th className="border border-black px-1 py-1 text-center font-bold" rowSpan={3}>Grand Total</th>
                                    </tr>

                                    <tr>
                                        {endPfModules.map((mod: any) => {
                                            const practiceCount = parseInt(mod.practice_count) || 0;
                                            const details = mod.estimated_mark_config?.details || [];
                                            const hasPractices = practiceCount > 0 && details.length === 0;
                                            const hasDetails = details.length > 0;

                                            const convPracticeWeight = parseFloat(mod.convert_of_practice) || 0;
                                            const convExamWeight = parseFloat(mod.convert_of_exam) || 0;
                                            const estimatedMark = parseFloat(mod.estimated_mark) || 100;
                                            const convLimit = parseFloat(mod.conversation_mark) || 0;

                                            return (
                                                <React.Fragment key={`sub-${mod.id}`}>
                                                    {hasPractices && (
                                                        <>
                                                            <th className="border border-black px-1 py-1 text-center" colSpan={practiceCount}>Practices</th>
                                                            <th className="border border-black px-1 py-1 text-start align-bottom" rowSpan={2} style={{ minWidth: '35px', maxWidth: '60px' }}>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '130px' }}>
                                                                        Avg. Prac
                                                                    </span>
                                                                </div>
                                                            </th>
                                                            <th className="border border-black px-1 py-1 text-start align-bottom" rowSpan={2} style={{ minWidth: '35px', maxWidth: '60px' }}>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '130px' }}>
                                                                        Exam ({estimatedMark.toFixed(0)})
                                                                    </span>
                                                                </div>
                                                            </th>
                                                            <th className="border border-black px-1 py-1 text-start align-bottom" rowSpan={2} style={{ minWidth: '35px', maxWidth: '60px' }}>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '130px' }}>
                                                                        Prac ({convPracticeWeight}%)
                                                                    </span>
                                                                </div>
                                                            </th>
                                                            <th className="border border-black px-1 py-1 text-start align-bottom" rowSpan={2} style={{ minWidth: '35px', maxWidth: '60px' }}>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '130px' }}>
                                                                        Exam ({convExamWeight}%)
                                                                    </span>
                                                                </div>
                                                            </th>
                                                        </>
                                                    )}

                                                    {hasDetails && details.map((d: any) => {
                                                        const hasScores = d.scores && d.scores.length > 0;
                                                        return (
                                                            <th key={d.id} colSpan={hasScores ? 2 : 1} rowSpan={hasScores ? 1 : 2} className="border border-black px-1 py-1 text-start align-bottom" style={{ minWidth: '35px', maxWidth: '60px' }}>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '130px' }}>
                                                                        {d.name} ({parseFloat(d.male_marks || 0)}/{parseFloat(d.female_marks || 0)})
                                                                    </span>
                                                                </div>
                                                            </th>
                                                        );
                                                    })}

                                                    {!hasPractices && !hasDetails && (
                                                        <th className="border border-black px-1 py-1 text-start align-bottom" rowSpan={2} style={{ minWidth: '35px', maxWidth: '60px' }}>
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '130px' }}>
                                                                    Exam ({estimatedMark.toFixed(0)})
                                                                </span>
                                                            </div>
                                                        </th>
                                                    )}

                                                    <th className="border border-black px-1 py-1 text-start align-bottom" rowSpan={2} style={{ minWidth: '35px', maxWidth: '60px' }}>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '130px' }}>
                                                                Total
                                                            </span>
                                                        </div>
                                                    </th>
                                                    <th className="border border-black px-1 py-1 text-start align-bottom" rowSpan={2} style={{ minWidth: '35px', maxWidth: '60px' }}>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="font-semibold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '130px' }}>
                                                                Conv ({convLimit.toFixed(0)})
                                                            </span>
                                                        </div>
                                                    </th>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tr>

                                    <tr>
                                        {endPfModules.map((mod: any) => {
                                            const practiceCount = parseInt(mod.practice_count) || 0;
                                            const details = mod.estimated_mark_config?.details || [];
                                            const hasPractices = practiceCount > 0 && details.length === 0;
                                            const hasDetails = details.length > 0;

                                            return (
                                                <React.Fragment key={`tri-${mod.id}`}>
                                                    {hasPractices && Array.from({ length: practiceCount }, (_, i) => (
                                                        <th key={i} className="border border-black px-1 py-1 text-center text-xs font-bold">P{i + 1}</th>
                                                    ))}
                                                    {hasDetails && details.map((d: any) => {
                                                        if (d.scores && d.scores.length > 0) {
                                                            return (
                                                                <React.Fragment key={`subtri-${d.id}`}>
                                                                    <th className="border border-black px-1 py-1 text-center text-xs">Qty</th>
                                                                    <th className="border border-black px-1 py-1 text-center text-xs">Mark</th>
                                                                </React.Fragment>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {consolidatedData.map((item: any, index: number) => {
                                        let grandConvertedTotal = 0;
                                        const endRes = item.results.find((r: any) => r.exam_type_details.code === "END")?.modules?.pf || [];

                                        return (
                                            <tr key={`row-${item.cadet_details.id}`} className="hover:bg-gray-50 transition-colors">
                                                <td className="border border-black px-1 py-1 text-center">{index + 1}</td>
                                                <td className="border border-black px-1 py-1 text-center font-mono">{item.cadet_details.bd_no}</td>
                                                <td className="border border-black px-1 py-1 text-center">{item.cadet_details.rank}</td>
                                                <td className="border border-black px-2 py-1 font-medium whitespace-nowrap">{item.cadet_details.name}</td>
                                                <td className="border border-black px-2 py-1">{item.cadet_details.branch || "-"}</td>

                                                {endPfModules.map((mod: any) => {
                                                    const m = endRes.find((x: any) => x.id === mod.id);
                                                    const im = m?.instructor_marks?.[0] || null;
                                                    const practiceCount = parseInt(mod.practice_count) || 0;
                                                    const details = mod.estimated_mark_config?.details || [];
                                                    const hasPractices = practiceCount > 0 && details.length === 0;
                                                    const hasDetails = details.length > 0;
                                                    const convPracticeWeight = parseFloat(mod.convert_of_practice) || 0;
                                                    const convExamWeight = parseFloat(mod.convert_of_exam) || 0;

                                                    const practiceMarksArr = im?.details?.filter((d: any) => d.practices_marks !== null) || [];
                                                    const avgPrac = practiceMarksArr.length > 0
                                                        ? practiceMarksArr.reduce((sum: number, p: any) => sum + parseFloat(p.practices_marks), 0) / practiceMarksArr.length : 0;
                                                    const examMark = parseFloat(im?.achieved_mark || 0);
                                                    const instructorDetailMarks = im?.details || [];

                                                    let finalTotal = 0;
                                                    if (hasPractices) finalTotal = (avgPrac * convPracticeWeight / 100) + (examMark * convExamWeight / 100);
                                                    else finalTotal = examMark;

                                                    const conv = computeConvertedMark(mod, m?.instructor_marks || []);
                                                    grandConvertedTotal += conv;

                                                    return (
                                                        <React.Fragment key={`cells-${mod.id}`}>
                                                            {hasPractices && (
                                                                <>
                                                                    {Array.from({ length: practiceCount }, (_, i) => (
                                                                        <td key={i} className="border border-black px-1 py-1 text-center">
                                                                            {practiceMarksArr[i] ? parseFloat(practiceMarksArr[i].practices_marks).toFixed(0) : "-"}
                                                                        </td>
                                                                    ))}
                                                                    <td className="border border-black px-1 py-1 text-center">{avgPrac > 0 ? avgPrac.toFixed(1) : "-"}</td>
                                                                    <td className="border border-black px-1 py-1 text-center">{examMark > 0 ? examMark.toFixed(1) : "-"}</td>
                                                                    <td className="border border-black px-1 py-1 text-center">{avgPrac > 0 ? (avgPrac * convPracticeWeight / 100).toFixed(2) : "-"}</td>
                                                                    <td className="border border-black px-1 py-1 text-center">{examMark > 0 ? (examMark * convExamWeight / 100).toFixed(2) : "-"}</td>
                                                                </>
                                                            )}

                                                            {hasDetails && details.map((d: any) => {
                                                                const hasScores = d.scores && d.scores.length > 0;
                                                                const dm = instructorDetailMarks.find((det: any) => det.ctw_results_module_estimated_marks_details_id === d.id);
                                                                if (hasScores) {
                                                                    return (
                                                                        <React.Fragment key={`dcell-${d.id}`}>
                                                                            <td className="border border-black px-1 py-1 text-center">{dm && dm.marks ? dm.marks : "-"}</td>
                                                                            <td className="border border-black px-1 py-1 text-center">{dm && dm.qty != null && parseFloat(String(dm.qty)) !== 0 ? parseFloat(String(dm.qty)).toFixed(1) : "-"}</td>
                                                                        </React.Fragment>
                                                                    );
                                                                }
                                                                return <td key={`dcell-${d.id}`} className="border border-black px-1 py-1 text-center">{dm && dm.marks != null && parseFloat(dm.marks) !== 0 ? parseFloat(dm.marks).toFixed(1) : "-"}</td>;
                                                            })}

                                                            {!hasPractices && !hasDetails && (
                                                                <td className="border border-black px-1 py-1 text-center">{examMark > 0 ? examMark.toFixed(1) : "-"}</td>
                                                            )}

                                                            <td className="border border-black px-1 py-1 text-center">{finalTotal > 0 ? finalTotal.toFixed(2) : "-"}</td>
                                                            <td className="border border-black px-1 py-1 text-center">{conv > 0 ? conv.toFixed(2) : "-"}</td>
                                                        </React.Fragment>
                                                    );
                                                })}
                                                <td className="border border-black px-1 py-1 text-center font-bold">{grandConvertedTotal.toFixed(2)}</td>
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
