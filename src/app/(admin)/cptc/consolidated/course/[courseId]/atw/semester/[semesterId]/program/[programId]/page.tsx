"use client";

import React, { useState, useEffect, useCallback, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwResultService } from "@/libs/services/atwResultService";
import { cadetService } from "@/libs/services/cadetService";
import { semesterService } from "@/libs/services/semesterService";
import FullLogo from "@/components/ui/fulllogo";
import type { FilePrintType } from "@/libs/types/filePrintType";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";
import CadetPromotionModal from "@/components/cadets/CadetPromotionModal";
import { SystemSemester } from "@/libs/types/system";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface SubjectComponent {
    id: number;
    name: string;
    estimate_mark: number;
    percentage: number;
}

interface Subject {
    id: number;
    mapping_id: number;
    name: string;
    code: string;
    legend: string | null;
    full_mark: number;
    components: SubjectComponent[];
}

interface Cadet {
    id: number;
    name: string;
    bd_no: string;
    rank: string | null;
    branch: string | null;
    marks: Record<number, Record<number, number>>; 
    result_ids: Record<number, number>;
    total_achieved: number;
    total_estimated: number;
    percentage: number;
    position: number;
    remarks: string;
}

interface ApiResponseData {
    course_details: { id: number; name: string; code?: string } | null;
    semester_details: { id: number; name: string; code?: string } | null;
    program_details: { id: number; name: string } | null;
    subjects: Subject[];
    cadets: Cadet[];
}

type ActiveTab = 'consolidated' | 'breakdown';

export default function CptcAtwCourseSemesterProgramResultsPage({ params }: { params: Promise<{ courseId: string; semesterId: string; programId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const courseId = resolvedParams.courseId;
    const semesterId = resolvedParams.semesterId;
    const programId = resolvedParams.programId;

    const [data, setData] = useState<ApiResponseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<ActiveTab>('consolidated');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Cadet; direction: 'asc' | 'desc' } | null>({ key: 'position', direction: 'asc' });

    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);

    // Promote State
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [promotionModalOpen, setPromotionModalOpen] = useState(false);
    const [promotingCadet, setPromotingCadet] = useState<any | null>(null);
    const [promoteFetching, setPromoteFetching] = useState(false);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkSemesters, setBulkSemesters] = useState<SystemSemester[]>([]);
    const [bulkForm, setBulkForm] = useState({ next_semester_id: "", start_date: new Date().toISOString().split("T")[0], description: "" });
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkError, setBulkError] = useState("");

    const loadResults = useCallback(async () => {
        if (!courseId || !semesterId || !programId) return;
        try {
            setLoading(true);
            const responseData = await atwResultService.getSubjectWiseByProgram(
                parseInt(courseId),
                parseInt(semesterId),
                parseInt(programId)
            );
            if (responseData) {
                setData(responseData);
            } else {
                setError("No results found for this program.");
            }
        } catch (err) {
            console.error("Failed to load program results:", err);
            setError("Failed to load results. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [courseId, semesterId, programId]);

    useEffect(() => {
        loadResults();
    }, [loadResults]);

    const handleBack = () => router.push(`/cptc/consolidated/course/${courseId}/atw/semester/${semesterId}`);
    const handlePrintClick = () => setIsPrintModalOpen(true);

    const confirmPrint = (type: FilePrintType) => {
        setSelectedPrintType(type);
        setIsPrintModalOpen(false);
        setTimeout(() => window.print(), 100);
    };

    const handleSort = (key: keyof Cadet) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
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
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [data?.cadets, sortConfig]);

    const calculateSubjectTotal = useCallback((cadet: Cadet, subject: Subject) => {
        let hasAnyMark = false;
        const subMarks = cadet.marks[subject.mapping_id];
        if (!subMarks) return null;

        const total = subject.components.reduce((acc, comp) => {
            const inputMark = subMarks[comp.id];
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

    // Breakdown helpers
    const getCompMark = (cadet: Cadet, subjectId: number, compId: number) =>
        parseFloat(String(cadet.marks[subjectId]?.[compId] || 0));

    const getWeightedCompMark = (cadet: Cadet, subjectId: number, comp: SubjectComponent) => {
        const obtained = getCompMark(cadet, subjectId, comp.id);
        const estimate = parseFloat(String(comp.estimate_mark || 0));
        const percentage = parseFloat(String(comp.percentage || 0));
        if (estimate === 0) return 0;
        return (obtained / estimate) * percentage;
    };

    const isCompDiff = (comp: SubjectComponent) =>
        parseFloat(String(comp.estimate_mark || 0)) !== parseFloat(String(comp.percentage || 0));

    const getSubjectColSpan = (subject: Subject) =>
        subject.components.reduce((acc, c) => acc + (isCompDiff(c) ? 2 : 1), 0);

    const subjectHasWeighted = (subject: Subject) =>
        subject.components.some(c => isCompDiff(c));

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

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === sortedCadets.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(sortedCadets.map((c: any) => c.id)));
        }
    };

    const handlePromoteSingle = async (cadetId: number) => {
        try {
            setPromoteFetching(true);
            const cadet = await cadetService.getCadet(cadetId);
            setPromotingCadet(cadet);
            setPromotionModalOpen(true);
        } catch (err) {
            console.error("Failed to fetch cadet:", err);
        } finally {
            setPromoteFetching(false);
        }
    };

    const openBulkPromote = async () => {
        setBulkError("");
        setBulkForm({ next_semester_id: "", start_date: new Date().toISOString().split("T")[0], description: "" });
        try {
            const res = await semesterService.getAllSemesters({ per_page: 100 });
            setBulkSemesters(res.data);
        } catch { setBulkSemesters([]); }
        setBulkModalOpen(true);
    };

    const handleBulkPromote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkForm.next_semester_id) { setBulkError("Please select the next semester."); return; }
        setBulkLoading(true);
        setBulkError("");
        try {
            const result = await cadetService.bulkPromoteSemester({
                cadet_ids: Array.from(selectedIds),
                next_semester_id: Number(bulkForm.next_semester_id),
                start_date: bulkForm.start_date,
                description: bulkForm.description || undefined,
            });
            
            if (result?.data?.failed_count > 0) {
                setBulkError(`${result.data.failed_count} cadet(s) failed to promote.`);
            } else {
                setBulkModalOpen(false); 
                setSelectedIds(new Set());
            }
        } catch (error: any) {
            setBulkError(error.message || "Failed to bulk promote cadets");
        } finally {
            setBulkLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-center py-12">
                    <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-center py-12">
                    <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
                    <p className="text-red-600">{error || "Data not found"}</p>
                    <button onClick={handleBack} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">Back</button>
                </div>
            </div>
        );
    }

    const grandTotalFullMark = data.subjects.reduce((sum, sub) => sum + parseFloat(String(sub.full_mark || 0)), 0);

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            <style jsx global>{`
                @media print {
                    @page { size: A3 landscape; margin: 10mm; }
                    .cv-content { width: 100% !important; max-width: none !important; }
                    table { font-size: 12px !important; border-collapse: collapse !important; width: 100% !important; }
                    th, td { border: 1px solid black !important; padding: 4px !important; }
                    .print-div { max-width: none !important; margin: 20px 0 !important; }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* Toolbar */}
            <div className="p-4 flex items-center justify-between no-print">
                <button onClick={handleBack} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back to Programs
                </button>
                <div className="flex items-center gap-3">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={openBulkPromote}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-purple-700 transition-colors shadow-sm"
                        >
                            <Icon icon="hugeicons:graduation-scroll" className="w-4 h-4" />
                            Bulk Promote ({selectedIds.size})
                        </button>
                    )}
                    <button onClick={handlePrintClick} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Icon icon="hugeicons:printer" className="w-4 h-4" />
                        Print
                    </button>
                </div>
            </div>

            <div className="p-4 cv-content">
                {selectedPrintType && (
                    <div className="flex justify-center mb-6">
                        <p className="font-light uppercase">{selectedPrintType?.name}</p>
                    </div>
                )}

                {/* Shared header */}
                <div className="mb-8">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
                    <div className="mb-2">
                        <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">Academic Training Wing</p>
                        <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">
                            {data.course_details?.name} ({data.program_details?.name})
                        </p>
                        <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">
                            {data.semester_details?.name} Exam : Mar 2026
                        </p>
                        <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">
                            {activeTab === 'consolidated' ? '(Academics Result)' : '(Subject Breakdown)'}
                        </p>
                    </div>
                </div>

                {/* Tab buttons */}
                <div className="pb-2 no-print flex justify-end">
                    <div className="flex justify-end gap-1 rounded-full p-1 border border-gray-200">
                        {(['consolidated', 'breakdown'] as ActiveTab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 text-sm font-medium rounded-full border capitalize transition-colors ${activeTab === tab
                                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tab === 'consolidated' ? 'Consolidated' : 'Breakdown'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── CONSOLIDATED TAB ── */}
                {activeTab === 'consolidated' && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-black text-sm">
                                <thead className="font-bold">
                                    <tr>
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle w-10 no-print">
                                            <input type="checkbox" checked={sortedCadets.length > 0 && selectedIds.size === sortedCadets.length} onChange={toggleSelectAll} className="w-4 h-4 cursor-pointer" />
                                        </th>
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle">Sl.</th>
                                        <th rowSpan={4} className="border border-black p-2 cursor-pointer hover:bg-gray-100 no-print" onClick={() => handleSort('bd_no')}>
                                            <div className="flex items-center justify-between">BD/No <SortIcon columnKey="bd_no" /></div>
                                        </th>
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle only-print">BD Number</th>
                                        <th rowSpan={4} className="border border-black p-2 cursor-pointer hover:bg-gray-100 no-print" onClick={() => handleSort('rank')}>
                                            <div className="flex items-center justify-between">Rank <SortIcon columnKey="rank" /></div>
                                        </th>
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle only-print">Rank</th>
                                        <th rowSpan={4} className="border border-black p-2 cursor-pointer hover:bg-gray-100 no-print" onClick={() => handleSort('name')}>
                                            <div className="flex items-center justify-between">Name <SortIcon columnKey="name" /></div>
                                        </th>
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle only-print">Name</th>
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle">Branch</th>
                                        <th colSpan={data.subjects.length} className="border border-black p-2 text-center tracking-wider">BUP Subjects</th>
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle">Total<br />({grandTotalFullMark})</th>
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle">%</th>
                                        <th rowSpan={4} className="border border-black p-2 text-center cursor-pointer hover:bg-gray-100 no-print" onClick={() => handleSort('position')}>
                                            <div className="flex items-center justify-center gap-1">Posn. <SortIcon columnKey="position" /></div>
                                        </th>
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle only-print">Posn.</th>
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle">Remarks</th>
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle no-print">Action</th>
                                    </tr>
                                    <tr>
                                        {data.subjects.map((_, idx) => (
                                            <th key={idx} className="border border-black p-1 text-center">{idx + 1}</th>
                                        ))}
                                    </tr>
                                    <tr>
                                        {data.subjects.map((sub, idx) => {
                                            return (
                                                <th
                                                    key={idx}
                                                    className="border border-black p-2 text-center text-xs"
                                                >
                                                    <div className="truncate" title={sub.name}>{sub.code}</div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                    <tr>
                                        {data.subjects.map((sub, idx) => (
                                            <th key={idx} className="border border-black p-1 text-center text-[10px]">{sub.full_mark}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedCadets.map((cadet, index) => {
                                        const failedSubjects = data.subjects
                                            .filter(sub => {
                                                const total = calculateSubjectTotal(cadet, sub);
                                                const roundedTotal = total !== null ? Math.ceil(total) : null;
                                                return roundedTotal !== null && roundedTotal < 50;
                                            })
                                            .map(sub => sub.code);
                                        const failMessage = failedSubjects.length > 0 ? `Failed in ${failedSubjects.join(' & ')}` : "";
                                        const finalRemarks = [failMessage, cadet.remarks].filter(Boolean).join('. ');

                                        return (
                                            <tr key={cadet.id} className={`hover:bg-gray-50/50 transition-colors font-medium ${selectedIds.has(cadet.id) ? "bg-purple-50" : ""}`}>
                                                <td className="border border-black p-2 text-center no-print">
                                                    <input type="checkbox" checked={selectedIds.has(cadet.id)} onChange={() => toggleSelect(cadet.id)} className="w-4 h-4 cursor-pointer" />
                                                </td>
                                                <td className="border border-black p-2 text-center">{index + 1}</td>
                                                <td className="border border-black p-2 text-center">{cadet.bd_no}</td>
                                                <td className="border border-black p-2">{cadet.rank || "—"}</td>
                                                <td className="border border-black p-2">{cadet.name}</td>
                                                <td className="border border-black p-2 text-center">{cadet.branch || "—"}</td>
                                                {data.subjects.map((sub) => {
                                                    const subTotal = calculateSubjectTotal(cadet, sub);
                                                    const roundedTotal = subTotal !== null ? Math.ceil(subTotal) : null;
                                                    return (
                                                        <td
                                                            key={`${cadet.id}-${sub.id}`}
                                                            className={`border border-black p-2 text-center font-bold no-print ${roundedTotal !== null && roundedTotal < 50 ? 'text-red-600' : ''}`}
                                                        >
                                                            {roundedTotal !== null ? roundedTotal : "—"}
                                                        </td>
                                                    );
                                                })}
                                                {data.subjects.map((sub) => {
                                                    const subTotal = calculateSubjectTotal(cadet, sub);
                                                    const roundedTotal = subTotal !== null ? Math.ceil(subTotal) : null;
                                                    return (
                                                        <td key={`print-${cadet.id}-${sub.id}`} className={`border border-black p-2 text-center font-bold only-print ${roundedTotal !== null && roundedTotal < 50 ? 'text-red-600' : ''}`}>
                                                            {roundedTotal !== null ? roundedTotal : "—"}
                                                        </td>
                                                    );
                                                })}
                                                <td className="border border-black p-2 text-center font-bold">{Math.ceil(Number(cadet.total_achieved || 0))}</td>
                                                <td className="border border-black p-2 text-center font-bold">{cadet.percentage}</td>
                                                <td className="border border-black p-2 text-center">{getOrdinal(cadet.position)}</td>
                                                <td className={`border border-black p-2 text-center text-xs italic ${failedSubjects.length > 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                    {finalRemarks || "—"}
                                                </td>
                                                <td className="border border-black p-2 text-center no-print">
                                                    <button
                                                        onClick={() => handlePromoteSingle(cadet.id)}
                                                        disabled={promoteFetching}
                                                        className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1 mx-auto"
                                                        title="Promote"
                                                    >
                                                        <Icon icon="hugeicons:graduation-scroll" className="w-3.5 h-3.5" />
                                                        Promote
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-16">
                            <div className="flex gap-2 mt-6 mb-6">
                                <p className="font-semibold">Legend : </p>
                                <table className="border-collapse border border-black text-sm">
                                    <tbody>
                                        {data.subjects.map((sub, idx) => (
                                            <tr key={idx}>
                                                <td className="border border-black p-2 text-center min-w-24">{sub.legend ?? "—"}</td>
                                                <td className="border border-black p-2 min-w-48">{sub.name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-12 mb-6 break-inside-avoid grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex flex-col items-center">
                                    <div className="w-48 border-t border-black mt-16 text-center pt-2 font-bold uppercase text-sm">Prepared By</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-48 border-t border-black mt-16 text-center pt-2 font-bold uppercase text-sm">Checked By</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-48 border-t border-black mt-16 text-center pt-2 font-bold uppercase text-sm">CI / OC ATW</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ── BREAKDOWN TAB ── */}
                {activeTab === 'breakdown' && (
                    <div className="space-y-10">
                        {data.subjects.map((subject) => {
                            const hasWeighted = subjectHasWeighted(subject);
                            const marksColSpan = getSubjectColSpan(subject);
                            // Show ALL cadets; only hide the subject entirely if nobody has marks
                            const hasAnyMarksForSubject = sortedCadets.some(c => c.result_ids[subject.mapping_id] !== undefined);
                            const subjectCadets = sortedCadets;

                            return (
                                <div key={subject.id} className="break-inside-avoid">
                                    {/* Subject header */}
                                    <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm">
                                                    <span className="font-bold text-gray-900 uppercase mr-2">Subject</span>
                                                    <span className="border-b border-dashed border-black">
                                                        : {subject.name} ({subject.code})
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm">
                                            <span className="font-bold text-gray-900 uppercase mr-2">Full Mark</span>
                                            <span className="border-b border-dashed border-black">: {subject.full_mark}</span>
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-black text-sm">
                                            <thead>
                                                {/* Header Row 1 */}
                                                <tr>
                                                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Ser</th>
                                                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">BD/No</th>
                                                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Rank</th>
                                                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Name</th>
                                                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle">Branch</th>
                                                    <th colSpan={marksColSpan} className="border border-black px-2 py-2 text-center">
                                                        Marks Obtained
                                                    </th>
                                                    {hasWeighted && (
                                                        <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle text-blue-700">
                                                            Total Marks<br />{subject.full_mark}
                                                        </th>
                                                    )}
                                                </tr>
                                                {/* Header Row 2 – component names */}
                                                <tr>
                                                    {subject.components.map(comp => {
                                                        const diff = isCompDiff(comp);
                                                        return diff ? (
                                                            <React.Fragment key={comp.id}>
                                                                <th className="border border-black px-2 py-1 text-center text-xs">
                                                                    {comp.name}<br />({comp.estimate_mark})
                                                                </th>
                                                                <th className="border border-black px-2 py-1 text-center text-xs">
                                                                    {comp.percentage}% of Obt. Mks.
                                                                </th>
                                                            </React.Fragment>
                                                        ) : (
                                                            <th key={comp.id} className="border border-black px-2 py-1 text-center text-xs">
                                                                {comp.name}<br />({comp.estimate_mark})
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {!hasAnyMarksForSubject ? (
                                                    <tr>
                                                        <td colSpan={6 + marksColSpan + (hasWeighted ? 1 : 0)} className="border border-black px-2 py-4 text-center text-gray-400 text-xs">
                                                            No marks recorded for this subject
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    subjectCadets.map((cadet, index) => {
                                                        const subTotal = calculateSubjectTotal(cadet, subject);
                                                        return (
                                                            <tr key={cadet.id}>
                                                                <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                                                                <td className="border border-black px-2 py-2 text-center">{cadet.bd_no}</td>
                                                                <td className="border border-black px-2 py-2 text-center">{cadet.rank || "—"}</td>
                                                                <td className="border border-black px-2 py-2 font-medium">{cadet.name}</td>
                                                                <td className="border border-black px-2 py-2 text-center">{cadet.branch || "—"}</td>

                                                                {subject.components.map(comp => {
                                                                    const diff = isCompDiff(comp);
                                                                    const hasMark = cadet.marks[subject.mapping_id]?.[comp.id] !== undefined;
                                                                    return diff ? (
                                                                        <React.Fragment key={comp.id}>
                                                                            <td className="border border-black px-2 py-2 text-center">
                                                                                {hasMark ? getCompMark(cadet, subject.mapping_id, comp.id).toFixed(2) : "—"}
                                                                            </td>
                                                                            <td className="border border-black px-2 py-2 text-center font-medium">
                                                                                {hasMark ? getWeightedCompMark(cadet, subject.mapping_id, comp).toFixed(2) : "—"}
                                                                            </td>
                                                                        </React.Fragment>
                                                                    ) : (
                                                                        <td key={comp.id} className="border border-black px-2 py-2 text-center">
                                                                            {hasMark ? getCompMark(cadet, subject.mapping_id, comp.id).toFixed(2) : "—"}
                                                                        </td>
                                                                    );
                                                                })}

                                                                {hasWeighted && (
                                                                    <td className="border border-black px-2 py-2 text-center text-blue-700 font-bold">
                                                                        {subTotal !== null ? Math.ceil(subTotal) : "—"}
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex justify-center items-center text-[10px] text-gray-400 no-print pt-6">
                    <div>Generated on: Mar 2026</div>
                </div>
            </div>

            {/* Single Promote Modal */}
            <CadetPromotionModal
                isOpen={promotionModalOpen}
                onClose={() => { setPromotionModalOpen(false); setPromotingCadet(null); }}
                cadet={promotingCadet}
                onSuccess={() => { setPromotionModalOpen(false); setPromotingCadet(null); }}
            />

            {/* Bulk Promote Modal */}
            <Modal isOpen={bulkModalOpen} onClose={() => setBulkModalOpen(false)} showCloseButton={true} className="max-w-xl p-0">
                <form onSubmit={handleBulkPromote} className="p-8">
                    <div className="flex flex-col items-center mb-6">
                        <FullLogo />
                        <h2 className="text-xl font-bold text-gray-900 mt-4">Bulk Promote Cadets</h2>
                        <p className="text-sm text-gray-500">
                            {selectedIds.size} cadet(s) selected
                        </p>
                    </div>

                    {bulkError && (
                        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {bulkError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <Label>Current Semester</Label>
                            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                                {data?.semester_details?.name || "Current Semester"}
                            </div>
                        </div>

                        <div>
                            <Label>Next Semester <span className="text-red-500">*</span></Label>
                            <select
                                value={bulkForm.next_semester_id}
                                onChange={(e) => setBulkForm({ ...bulkForm, next_semester_id: e.target.value })}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Next Semester...</option>
                                {bulkSemesters
                                    .filter(s => s.id !== data?.semester_details?.id)
                                    .map((semester) => (
                                    <option key={semester.id} value={semester.id}>
                                        {semester.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Promotion Date <span className="text-red-500">*</span></Label>
                            <Input
                                type="date"
                                value={bulkForm.start_date}
                                onChange={(e) => setBulkForm({ ...bulkForm, start_date: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label>Remarks</Label>
                            <textarea
                                value={bulkForm.description}
                                onChange={(e) => setBulkForm({ ...bulkForm, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add any remarks for this promotion..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={() => setBulkModalOpen(false)}
                            className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                            disabled={bulkLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
                            disabled={bulkLoading}
                        >
                            {bulkLoading && <Icon icon="hugeicons:fan-01" className="animate-spin w-4 h-4" />}
                            Promote All
                        </button>
                    </div>
                </form>
            </Modal>

            <PrintTypeModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                onConfirm={confirmPrint}
            />

            <style jsx>{`
                .only-print { display: none; }
                @media print {
                    .only-print { display: table-cell; }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
}