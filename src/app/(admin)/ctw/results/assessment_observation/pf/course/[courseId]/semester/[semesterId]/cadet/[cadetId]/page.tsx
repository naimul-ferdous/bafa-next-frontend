/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwPfAssessmentResultService } from "@/libs/services/ctwPfAssessmentResultService";
import FullLogo from "@/components/ui/fulllogo";

export default function PfAssessmentCourseSemesterCadetPage() {
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

    const loadData = useCallback(async () => {
        if (isNaN(courseId) || isNaN(semesterId) || isNaN(cadetId)) return;
        try {
            setLoading(true);
            setError("");

            const data = await ctwPfAssessmentResultService.getInitialFetchData({
                module_code: "pf_assessment",
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
                    const subs = (data.grouped_results[0].submissions || []).slice().sort((a: any, b: any) => {
                        const dA = new Date(a.result_date || a.created_at).getTime();
                        const dB = new Date(b.result_date || b.created_at).getTime();
                        return dA - dB;
                    });
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

    const getCadetRank = (cadet: any): string => {
        if (!cadet?.assigned_ranks) return "Officer Cadet";
        const currentRank = cadet.assigned_ranks.find((ar: any) => ar.is_current);
        return currentRank?.rank?.short_name || cadet.assigned_ranks[0]?.rank?.name || "Officer Cadet";
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

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
    };

    const criteriaDetails: any[] = estimatedMark?.details || [];
    const estimatedMarkPerInstructor = estimatedMark?.estimated_mark_per_instructor || 0;
    const conversationMarkLimit = estimatedMark?.conversation_mark || 0;
    const criteriaMax = criteriaDetails.reduce((sum: number, d: any) => sum + parseFloat(String(d.male_marks || 0)), 0);
    const effectiveMax = criteriaMax > 0 ? criteriaMax : estimatedMarkPerInstructor;

    const calculatedData = useMemo(() => {
        const rows = submissions.map((sub, index) => ({
            index,
            submission: sub,
            instructorName: sub?.instructor_details?.name || `Instructor ${index + 1}`,
            resultDate: sub.result_date || sub.created_at,
            mark: getCadetTotalMark(sub),
        }));

        const grandTotal = rows.reduce((sum, r) => sum + r.mark, 0);
        const avgMark = rows.length > 0 ? grandTotal / rows.length : 0;
        const conv = effectiveMax > 0 && conversationMarkLimit > 0
            ? (avgMark / effectiveMax) * conversationMarkLimit
            : avgMark;
        const inPercent = effectiveMax > 0 ? (avgMark / effectiveMax) * 100 : 0;
        const passThreshold = conversationMarkLimit * 0.5;
        const remark = conv >= passThreshold ? "Pass" : "Fail";

        return { rows, grandTotal, conv, inPercent, remark };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submissions, effectiveMax, conversationMarkLimit]);

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
                        onClick={() => router.push(`/ctw/results/assessment_observation/pf/course/${courseId}/semester/${semesterId}`)}
                        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-bold"
                    >
                        Back to Results
                    </button>
                </div>
            </div>
        );
    }

    const rowCount = calculatedData.rows.length;

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
                    onClick={() => router.push(`/ctw/results/assessment_observation/pf/course/${courseId}/semester/${semesterId}`)}
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
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
                    <p className="font-medium text-gray-900 uppercase tracking-wider">GST PF Data Score Sheet for Individual Offr Cadts</p>
                    <p className="font-medium text-gray-900 uppercase tracking-wider pb-2">Cadets Trg Wing, Bafa</p>
                </div>

                {/* Cadet Info */}
                <div className="mb-6">
                    <div className="grid grid-cols-3 md:grid-cols-6 text-sm gap-y-1">
                        <div className="flex"><span className="w-24 text-gray-900 font-medium">BD/No</span><span className="mr-2">:</span><span className="text-gray-900 font-bold">{cadetInfo?.cadet_number || "N/A"}</span></div>
                        <div className="flex"><span className="w-24 text-gray-900 font-medium">Rank</span><span className="mr-2">:</span><span className="text-gray-900 font-bold">{getCadetRank(cadetInfo)}</span></div>
                        <div className="flex"><span className="w-24 text-gray-900 font-medium">Name</span><span className="mr-2">:</span><span className="text-gray-900 font-bold uppercase">{cadetInfo?.name || "N/A"}</span></div>
                        <div className="flex"><span className="w-24 text-gray-900 font-medium">Branch</span><span className="mr-2">:</span><span className="text-gray-900 font-bold">{cadetInfo?.assigned_branchs?.filter((b: any) => b.is_current)?.[0]?.branch?.name || cadetInfo?.assigned_branchs?.[0]?.branch?.name || "—"}</span></div>
                        <div className="flex"><span className="w-24 text-gray-900 font-medium">Semester</span><span className="mr-2">:</span><span className="text-gray-900 font-bold">{semesterDetails?.name || "N/A"}</span></div>
                        <div className="flex"><span className="w-24 text-gray-900 font-medium">Course</span><span className="mr-2">:</span><span className="text-gray-900 font-bold">{courseDetails?.name || "N/A"}</span></div>
                    </div>
                </div>

                {/* Marks Table */}
                <div className="mb-6 overflow-x-auto">
                    <table className="w-full border-collapse border border-black text-xs">
                        <thead>
                            <tr>
                                <th className="border border-black px-2 py-2 text-center align-middle">Ser</th>
                                <th className="border border-black px-2 py-2 text-center align-middle">Instructor</th>
                                <th className="border border-black px-2 py-2 text-center align-middle">Result Date</th>
                                <th className="border border-black px-2 py-2 text-center align-middle font-bold">
                                    Mark - {estimatedMarkPerInstructor || "—"}
                                </th>
                                <th className="border border-black px-2 py-2 text-center align-middle font-bold">
                                    Total - {effectiveMax > 0 ? effectiveMax * rowCount : "—"}
                                </th>
                                <th className="border border-black px-2 py-2 text-center align-middle font-bold">
                                    Conv - {conversationMarkLimit || "—"}
                                </th>
                                <th className="border border-black px-2 py-2 text-center align-middle font-bold">In %</th>
                                <th className="border border-black px-2 py-2 text-center align-middle font-bold">Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculatedData.rows.map((row, index) => (
                                <tr key={row.submission.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="border border-black px-2 py-2 text-center font-medium">{index + 1}</td>
                                    <td className="border border-black px-2 py-2 text-center">{row.instructorName}</td>
                                    <td className="border border-black px-2 py-2 text-center">{formatDate(row.resultDate)}</td>
                                    <td className="border border-black px-2 py-2 text-center font-bold">{row.mark.toFixed(2)}</td>

                                    {/* Summary cells rowspan from first row */}
                                    {index === 0 && rowCount > 0 && (
                                        <>
                                            <td className="border border-black px-2 py-2 text-center font-bold" rowSpan={rowCount}>
                                                {calculatedData.grandTotal.toFixed(2)}
                                            </td>
                                            <td className="border border-black px-2 py-2 text-center font-black text-emerald-700" rowSpan={rowCount}>
                                                {calculatedData.conv.toFixed(2)}
                                            </td>
                                            <td className="border border-black px-2 py-2 text-center" rowSpan={rowCount}>
                                                {calculatedData.inPercent.toFixed(2)}%
                                            </td>
                                            <td className={`border border-black px-2 py-2 text-center font-bold ${calculatedData.remark === "Fail" ? "text-red-600" : "text-green-700"}`} rowSpan={rowCount}>
                                                {calculatedData.remark}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {rowCount === 0 && (
                                <tr>
                                    <td colSpan={8} className="border border-black px-2 py-6 text-center text-gray-400">No mark entries found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-12 text-center text-[10px] text-gray-500 font-medium italic">
                    <p>Generated on: {new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
            </div>
        </div>
    );
}
