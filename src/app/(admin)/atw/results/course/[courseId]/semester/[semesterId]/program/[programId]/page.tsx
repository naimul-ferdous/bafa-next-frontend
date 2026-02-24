"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwResultService } from "@/libs/services/atwResultService";
import FullLogo from "@/components/ui/fulllogo";

interface SubjectComponent {
    id: number;
    name: string;
    estimate_mark: number;
    percentage: number;
}

interface Subject {
    id: number;
    name: string;
    code: string;
    full_mark: number;
    components: SubjectComponent[];
}

interface Cadet {
    id: number;
    name: string;
    bd_no: string;
    rank: string | null;
    branch: string | null;
    marks: Record<number, number>; // key is component_id
    result_ids: Record<number, number>; // key is subject_id
    total_achieved: number;
    total_estimated: number;
    percentage: number;
    position: number;
    remarks: string;
}

interface ApiResponseData {
    course_details: { id: number; name: string; code: string } | null;
    semester_details: { id: number; name: string; code: string } | null;
    program_details: { id: number; name: string } | null;
    subjects: Subject[];
    cadets: Cadet[];
}

export default function AtwCourseSemesterProgramResultsPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;
    const semesterId = params.semesterId as string;
    const programId = params.programId as string;

    const [data, setData] = useState<ApiResponseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Cadet; direction: 'asc' | 'desc' } | null>({ key: 'bd_no', direction: 'asc' });

    const loadResults = useCallback(async () => {
        if (!courseId || !semesterId || !programId) return;
        try {
            setLoading(true);
            const responseData = await atwResultService.getSubjectWiseByProgram(
                parseInt(courseId),
                parseInt(semesterId),
                parseInt(programId)
            );
            setData(responseData);
        } catch (error) {
            console.error("Failed to load program results:", error);
        } finally {
            setLoading(false);
        }
    }, [courseId, semesterId, programId]);

    useEffect(() => {
        loadResults();
    }, [loadResults]);

    const handleBack = () => router.push(`/atw/results/course/${courseId}/semester/${semesterId}`);

    const handleViewResultDetails = (resultId: number) => {
        router.push(`/atw/results/${resultId}`);
    };

    const handleSort = (key: keyof Cadet) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedCadets = useMemo(() => {
        const cadets = data?.cadets;
        if (!cadets) return [];
        const sortableItems = [...cadets];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [data?.cadets, sortConfig]);

    // Calculate subject-wise totals for summary view
    const calculateSubjectTotal = useCallback((cadet: Cadet, subject: Subject) => {
        let hasAnyMark = false;
        const total = subject.components.reduce((acc, comp) => {
            const inputMark = cadet.marks[comp.id];
            if (inputMark !== undefined) {
                hasAnyMark = true;
                const markVal = Number(inputMark) || 0;
                const estimateMark = Number(comp.estimate_mark) || 0;
                const percentageMark = Number(comp.percentage) || 0;

                let adjustedMark = markVal;

                if (estimateMark !== percentageMark && estimateMark > 0) {
                    adjustedMark = (markVal / estimateMark) * percentageMark;
                }
                return acc + adjustedMark;
            }
            return acc;
        }, 0);

        if (!hasAnyMark) return null;
        return isNaN(total) ? 0 : total;
    }, []);

    const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof Cadet }) => {
        if (sortConfig?.key !== columnKey) return <Icon icon="hugeicons:sorting-05" className="w-3 h-3 text-gray-400 ml-1 inline" />;
        return sortConfig.direction === 'asc' 
            ? <Icon icon="hugeicons:sorting-05" className="w-3 h-3 text-blue-600 rotate-180 ml-1 inline" />
            : <Icon icon="hugeicons:sorting-05" className="w-3 h-3 text-blue-600 ml-1 inline" />;
    };

    const TableLoading = () => (
        <div className="w-full min-h-[20vh] flex items-center justify-center">
            <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
        </div>
    );

    if (loading) return <TableLoading />;
    if (!data) return <div className="p-6 text-center text-gray-500">No result data found.</div>;

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 overflow-hidden max-w-full lg:max-w-[calc(100vw-340px)]">
            <div className="text-center mb-8 relative">
                <button onClick={handleBack} className="absolute left-0 top-0 flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors no-print">
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back to Semester Results
                </button>
                <div className="flex justify-center mb-4"><FullLogo /></div>
                <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
                    ATW Result - {data?.program_details?.name || "Program"}
                </h2>
                <h3 className="text-sm text-gray-500 uppercase">
                    {data?.course_details?.name || "Course"} ({data?.semester_details?.name || "Semester"})
                </h3>
            </div>

            <div className="overflow-x-auto border border-black rounded-lg">
                <table className="min-w-max w-full border-collapse text-sm text-left">
                    <thead className="uppercase">
                        <tr className="font-bold border-b border-black">
                            <th rowSpan={4} className="border-r border-black p-2 text-center">Sl.</th>
                            <th 
                                rowSpan={4} 
                                className="border-r border-black p-2 cursor-pointer hover:bg-gray-100 transition-colors group"
                                onClick={() => handleSort('bd_no')}
                            >
                                <div className="flex items-center justify-between">
                                    BD Number
                                    <SortIcon columnKey="bd_no" />
                                </div>
                            </th>
                            <th 
                                rowSpan={4} 
                                className="border-r border-black p-2 cursor-pointer hover:bg-gray-100 transition-colors group"
                                onClick={() => handleSort('rank')}
                            >
                                <div className="flex items-center justify-between">
                                    Rank
                                    <SortIcon columnKey="rank" />
                                </div>
                            </th>
                            <th 
                                rowSpan={4} 
                                className="border-r border-black p-2 cursor-pointer hover:bg-gray-100 transition-colors group"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center justify-between">
                                    Name
                                    <SortIcon columnKey="name" />
                                </div>
                            </th>
                            <th rowSpan={4} className="border-r border-black p-2 text-center">Branch</th>
                            <th colSpan={data?.subjects.length || 0} className="border-r border-black p-2 text-center uppercase tracking-wider">BUP Subjects</th>
                            <th rowSpan={4} className="border-r border-black p-2 text-center">Total</th>
                            <th rowSpan={4} className="border-r border-black p-2 text-center">Percentage</th>
                            <th 
                                rowSpan={4} 
                                className="border-r border-black p-2 text-center cursor-pointer hover:bg-gray-100 transition-colors group"
                                onClick={() => handleSort('position')}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Position
                                    <SortIcon columnKey="position" />
                                </div>
                            </th>
                            <th rowSpan={4} className="p-2 text-center">Remarks</th>
                        </tr>
                        <tr className="font-semibold border-b border-black">
                            {data?.subjects.map((_, idx) => (
                                <th key={idx} className="border-r border-black p-1 text-center">
                                    {idx + 1}
                                </th>
                            ))}
                        </tr>
                        <tr className="font-bold border-b border-black">
                            {data?.subjects.map((sub, idx) => (
                                <th key={idx} className="border-r border-black p-2 text-center">
                                    <div className="truncate max-w-[120px]" title={sub.name}>{sub.code}</div>
                                </th>
                            ))}
                        </tr>
                        <tr className="font-medium border-b border-black">
                            {data?.subjects.map((sub, idx) => (
                                <th key={idx} className="border-r border-black p-1 text-center text-[10px]">
                                    <span className="font-bold">{sub.full_mark || 0}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCadets.map((cadet, index) => {
                            const failedSubjects = (data?.subjects || [])
                                .filter(sub => {
                                    const total = calculateSubjectTotal(cadet, sub);
                                    const roundedTotal = total !== null ? Math.ceil(total) : null;
                                    return roundedTotal !== null && roundedTotal < 50;
                                })
                                .map(sub => sub.code || sub.name);

                            const failMessage = failedSubjects.length > 0
                                ? `Failed in ${failedSubjects.join(' & ')}`
                                : "";

                            const finalRemarks = [failMessage, cadet.remarks].filter(Boolean).join('. ');

                            return (
                                <tr key={cadet.id} className={`${index === (data?.cadets.length || 0) - 1 ? "" : "border-b border-black"} hover:bg-gray-50/50 transition-colors`}>
                                    <td className="border-r border-black p-2 text-center">{index + 1}</td>
                                    <td className="border-r border-black p-2 font-mono">{cadet.bd_no}</td>
                                    <td className="border-r border-black p-2">{cadet.rank || "—"}</td>
                                    <td className="border-r border-black p-2 font-medium">{cadet.name}</td>
                                    <td className="border-r border-black p-2 text-center">{cadet.branch || "—"}</td>
                                    {data?.subjects.map((sub) => {
                                        const subTotal = calculateSubjectTotal(cadet, sub);
                                        const roundedTotal = subTotal !== null ? Math.ceil(subTotal) : null;
                                        const resultId = cadet.result_ids[sub.id];
                                        return (
                                            <td
                                                key={`${cadet.id}-${sub.id}`}
                                                onClick={() => resultId && handleViewResultDetails(resultId)}
                                                className={`border-r border-black p-2 text-center font-bold ${roundedTotal !== null && roundedTotal < 50 ? 'text-red-600' : ''} ${resultId ? 'cursor-pointer hover:bg-blue-50 transition-colors' : ''}`}
                                                title={resultId ? "Click to view result details" : ""}
                                            >
                                                {roundedTotal !== null ? roundedTotal : "—"}
                                            </td>
                                        );
                                    })}
                                    <td className="border-r border-black p-2 text-center font-bold">
                                        {Math.ceil(Number(cadet.total_achieved || 0))}
                                    </td>
                                    <td className="border-r border-black p-2 text-center font-semibold">{cadet.percentage}</td>
                                    <td className="border-r border-black p-2 text-center">{getOrdinal(cadet.position)}</td>
                                    <td className={`p-2 text-center italic ${failedSubjects.length > 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                        {finalRemarks || "—"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center text-[10px] text-gray-400 no-print pt-4">
                <div>Generated on: {new Date().toLocaleDateString()}</div>
            </div>
        </div>
    );
}