/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwDtAssessmentResultService } from "@/libs/services/ctwDtAssessmentResultService";
import FullLogo from "@/components/ui/fulllogo";

export default function DtAssessmentCourseSemesterCadetPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params?.courseId as string);
    const semesterId = parseInt(params?.semesterId as string);
    const cadetId = parseInt(params?.cadetId as string);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [courseDetails, setCourseDetails] = useState<any>(null);
    const [semesterDetails, setSemesterDetails] = useState<any>(null);
    const [moduleDetails, setModuleDetails] = useState<any>(null);
    const [estimatedMark, setEstimatedMark] = useState<any>(null);

    const [cadetInfo, setCadetInfo] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);

    const criteriaDetails: any[] = (estimatedMark as any)?.details || [];

    const loadData = useCallback(async () => {
        if (isNaN(courseId) || isNaN(semesterId) || isNaN(cadetId)) return;
        try {
            setLoading(true);
            setError("");

            const data = await ctwDtAssessmentResultService.getInitialFetchData({
                module_code: "dt_assessment",
                course_id: courseId,
                semester_id: semesterId,
            });

            if (data) {
                setModuleDetails(data.module);
                setEstimatedMark(data.estimated_mark_config);
                setCourseDetails(data.course_details);
                setSemesterDetails(data.semester_details);

                const allCadets = data.cadets || [];
                const targetCadet = allCadets.find((c: any) => c.id === cadetId);

                if (targetCadet) {
                    setCadetInfo(targetCadet);
                } else {
                    setError("Cadet not found in this course/semester");
                    setLoading(false);
                    return;
                }

                if (data.grouped_results && data.grouped_results.length > 0) {
                    const resultGroup = data.grouped_results[0];
                    const subs = resultGroup.submissions || [];
                    setSubmissions(subs);
                } else {
                    setError("No results found for this course and semester");
                }
            } else {
                setError("Failed to retrieve data");
            }
        } catch (err) {
            console.error("Failed to load data:", err);
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }, [courseId, semesterId, cadetId]);

    useEffect(() => {
        if (!isNaN(courseId) && !isNaN(semesterId) && !isNaN(cadetId)) {
            loadData();
        }
    }, [loadData]);

    const handleViewResult = (resultId: number) => {
        router.push(`/ctw/results/assessment_observation/dt/${resultId}`);
    };

    const getCadetRank = (cadet: any): string => {
        if (!cadet?.assigned_ranks) return "Officer Cadet";
        const currentRank = cadet.assigned_ranks.find((ar: any) => ar.is_current);
        return currentRank?.rank?.short_name || cadet.assigned_ranks[0]?.rank?.name || "Officer Cadet";
    };

    const getCadetMark = (submission: any, criteriaId?: number): number => {
        const marks = submission?.instructor_details?.marks || [];
        const cadetMark = marks.find((m: any) => m.cadet_id === cadetId);
        if (!cadetMark) return 0;

        if (criteriaId) {
            const detail = cadetMark.details?.find((d: any) => d.ctw_results_module_estimated_marks_details_id === criteriaId);
            return detail ? parseFloat(String(detail.marks || 0)) : 0;
        }

        return parseFloat(String(cadetMark.achieved_mark || cadetMark.mark || 0));
    };

    const getCadetTotalMark = (submission: any): number => {
        const marks = submission?.instructor_details?.marks || [];
        const cadetMark = marks.find((m: any) => m.cadet_id === cadetId);
        if (!cadetMark) return 0;

        if (cadetMark.details && cadetMark.details.length > 0) {
            return cadetMark.details.reduce((sum: number, d: any) => sum + parseFloat(String(d.marks || 0)), 0);
        }
        return parseFloat(String(cadetMark.achieved_mark || cadetMark.mark || 0));
    };

    const hasCriteriaDetails = criteriaDetails.length > 0;
    const maxCriteriaTotal = criteriaDetails.reduce((sum: number, d: any) => sum + parseFloat(String(d.male_marks || 0)), 0);
    const estimatedMarkPerInstructor = (estimatedMark as any)?.estimated_mark_per_instructor || 0;
    const conversationMarkLimit = (estimatedMark as any)?.conversation_mark || 0;
    const instructorCount = moduleDetails?.instructor_count || submissions.length || 1;

    const calculatedData = useMemo(() => {
        const results = submissions.map((submission, index) => {
            const totalMark = getCadetTotalMark(submission);
            const instructorName = submission?.instructor_details?.name || `Instructor ${index + 1}`;

            return {
                submission,
                index,
                instructorName,
                totalMark,
            };
        });

        const grandTotal = results.reduce((sum, r) => sum + r.totalMark, 0);

        const rowCount = results.length;
        const maxGrandTotal = maxCriteriaTotal * rowCount;

        const grandConverted = maxGrandTotal > 0 ? (grandTotal / maxGrandTotal) * conversationMarkLimit : 0;
        const avgConverted = results.length > 0 ? grandConverted / results.length : 0;

        const totalInPercent = maxGrandTotal > 0 ? (grandTotal / maxGrandTotal) * 100 : 0;
        const convInPercent = conversationMarkLimit > 0 ? (grandConverted / conversationMarkLimit) * 100 : 0;

        return {
            results,
            grandTotal,
            grandConverted,
            avgConverted,
            maxGrandTotal,
            totalInPercent,
            convInPercent,
            rowCount,
        };
    }, [submissions, hasCriteriaDetails, maxCriteriaTotal, estimatedMarkPerInstructor, conversationMarkLimit]);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-center py-12">
                    <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-center py-12">
                    <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => router.push(`/ctw/results/assessment_observation/dt/course/${courseId}/semester/${semesterId}`)}
                        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-bold"
                    >
                        Back to Results
                    </button>
                </div>
            </div>
        );
    }

    const hasData = calculatedData.results.length > 0;
    const rowSpanValue = hasData ? calculatedData.rowCount + 1 : 1;

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          .cv-content { width: 100% !important; max-width: none !important; }
          table { font-size: 11px !important; border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid black !important; padding: 4px !important; }
          .no-print { display: none !important; }
        }
      `}</style>

            <div className="p-4 flex items-center justify-between no-print">
                <button
                    onClick={() => router.push(`/ctw/results/assessment_observation/dt/course/${courseId}/semester/${semesterId}`)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back to Course Results
                </button>
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:printer" className="w-4 h-4" /> Print
                </button>
            </div>

            <div className="p-4 cv-content">
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
                    <p className="font-medium text-gray-900 uppercase tracking-wider">GST DT Data Score Sheet for Individual Offr Cadts</p>
                    <p className="font-medium text-gray-900 uppercase tracking-wider pb-2">Cadets Trg Wing, Bafa</p>
                </div>
                <div className="mb-6">
                    <div className="grid grid-cols-3 md:grid-cols-6 text-sm">
                        <div className="flex"><span className="w-24 text-gray-900 font-medium">BD/No</span><span className="mr-4">:</span><span className="text-gray-900 font-bold">{cadetInfo?.cadet_number || "N/A"}</span></div>
                        <div className="flex"><span className="w-24 text-gray-900 font-medium">Rank</span><span className="mr-4">:</span><span className="text-gray-900 font-bold">{getCadetRank(cadetInfo)}</span></div>
                        <div className="flex"><span className="w-24 text-gray-900 font-medium">Name</span><span className="mr-4">:</span><span className="text-gray-900 font-bold uppercase">{cadetInfo?.name || "N/A"}</span></div>
                        <div className="flex"><span className="w-24 text-gray-900 font-medium">Branch</span><span className="mr-4">:</span><span className="text-gray-900 font-bold">{cadetInfo?.assigned_branchs?.filter((b: any) => b.is_current)?.[0]?.branch?.name || cadetInfo?.assigned_branchs?.[0]?.branch?.name || "-"}</span></div>
                        <div className="flex"><span className="w-24 text-gray-900 font-medium">Semester</span><span className="mr-4">:</span><span className="text-gray-900 font-bold">{semesterDetails?.name || "N/A"}</span></div>
                        <div className="flex"><span className="w-24 text-gray-900 font-medium">Course</span><span className="mr-4">:</span><span className="text-gray-900 font-bold">{courseDetails?.name || "N/A"}</span></div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-black text-xs">
                            <thead>
                                <tr>
                                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={hasCriteriaDetails ? 2 : 1}>Ser</th>
                                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={hasCriteriaDetails ? 2 : 1}>Instructor</th>
                                    {hasCriteriaDetails ? (
                                        <>
                                            {criteriaDetails.map((d: any) => (
                                                <th key={d.id} className="border border-black px-1 py-2 text-center align-middle font-semibold text-xs max-w-[50px]">{d.name}</th>
                                            ))}
                                        </>
                                    ) : null}
                                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={hasCriteriaDetails ? 2 : 1}>
                                        Total<br /><span className="font-normal text-gray-500">{hasCriteriaDetails ? maxCriteriaTotal : estimatedMarkPerInstructor}</span>
                                    </th>
                                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={hasCriteriaDetails ? 2 : 1}>
                                        Grand Total<br /><span className="font-normal text-gray-500">{(hasCriteriaDetails ? maxCriteriaTotal : estimatedMarkPerInstructor) * (calculatedData.rowCount || 1)}</span>
                                    </th>
                                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={hasCriteriaDetails ? 2 : 1}>
                                        In %
                                    </th>
                                    <th className="border border-black px-2 py-2 text-center align-middle font-bold" rowSpan={hasCriteriaDetails ? 2 : 1}>
                                        Conv.<br /><span className="font-normal text-gray-500">{conversationMarkLimit}</span>
                                    </th>
                                </tr>
                                {hasCriteriaDetails && (
                                    <tr>
                                        {criteriaDetails.map((d: any) => (
                                            <th key={d.id} className="border border-black px-1 py-1 text-center text-gray-500 text-xs">
                                                {parseFloat(d.male_marks || d.female_marks || 0)}
                                            </th>
                                        ))}
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {calculatedData.results.map((row, index) => {
                                    return (
                                        <tr key={row.submission.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="border border-black px-2 py-2 text-center font-medium">{index + 1}</td>
                                            <td className="border border-black px-2 py-2 text-center">{row.instructorName}</td>
                                            {hasCriteriaDetails ? (
                                                <>
                                                    {criteriaDetails.map((d: any) => (
                                                        <td key={d.id} className="border border-black px-2 py-2 text-center">
                                                            {getCadetMark(row.submission, d.id).toFixed(2)}
                                                        </td>
                                                    ))}
                                                </>
                                            ) : null}
                                            <td className="border border-black px-2 py-2 text-center font-bold">
                                                {row.totalMark.toFixed(2)}
                                            </td>
                                            {index === 0 && hasData && (
                                                <>
                                                    <td className="border border-black px-2 py-2 text-center font-bold" rowSpan={calculatedData.rowCount}>
                                                        {calculatedData.grandTotal.toFixed(2)}
                                                    </td>
                                                    <td className="border border-black px-2 py-2 text-center0" rowSpan={calculatedData.rowCount}>
                                                        {calculatedData.totalInPercent.toFixed(2)}%
                                                    </td>
                                                    <td className="border border-black px-2 py-2 text-center font-black" rowSpan={calculatedData.rowCount}>
                                                        {calculatedData.grandConverted.toFixed(2)}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-8 text-center no-print">
                    <div className="border-t-2 border-black pt-2"><p className="font-bold text-sm uppercase tracking-widest">Instructor</p></div>
                    <div className="border-t-2 border-black pt-2"><p className="font-bold text-sm uppercase tracking-widest">Chief Instructor</p></div>
                    <div className="border-t-2 border-black pt-2"><p className="font-bold text-sm uppercase tracking-widest">Commandant</p></div>
                </div>

                <div className="mt-12 text-center text-[10px] text-gray-500 font-medium italic">
                    <p>Generated on: {new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
            </div>
        </div>
    );
}