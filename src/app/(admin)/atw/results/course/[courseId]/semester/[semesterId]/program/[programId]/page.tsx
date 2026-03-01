"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwResultService } from "@/libs/services/atwResultService";
import { atwApprovalService } from "@/libs/services/atwApprovalService";
import FullLogo from "@/components/ui/fulllogo";
import type { FilePrintType } from "@/libs/types/filePrintType";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";
import { Modal } from "@/components/ui/modal";
import { useCan } from "@/context/PagePermissionsContext";

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
    marks: Record<number, number>;
    result_ids: Record<number, number>;
    total_achieved: number;
    total_estimated: number;
    percentage: number;
    position: number;
    remarks: string;
}

interface CadetApproval {
    cadet_id: number;
    subject_id: number;
    authority_id: number | null;
    branch_id: number;
    status: 'pending' | 'approved' | 'rejected';
    rejected_reason?: string | null;
}

interface SubjectApproval {
    subject_id: number;
    branch_id: number;
    status: 'pending' | 'approved' | 'rejected';
    rejected_reason?: string | null;
    forwarded_by?: number | null;
    approved_by?: number | null;
}

interface ProgramApproval {
    branch_id: number;
    status: 'pending' | 'approved' | 'rejected';
    rejected_reason?: string | null;
}

interface ApprovalAuthority {
    id: number;
    role_id: number | null;
    user_id: number | null;
    sort: number;
    is_cadet_approve: boolean;
    is_forward: boolean;
    is_final: boolean;
    is_initial_cadet_approve: boolean;
    is_initial_forward: boolean;
    is_active: boolean;
    role?: { id: number; name: string } | null;
    user?: { id: number; name: string } | null;
}

interface ApiResponseData {
    course_details: { id: number; name: string; code?: string } | null;
    semester_details: { id: number; name: string; code?: string } | null;
    program_details: { id: number; name: string } | null;
    subjects: Subject[];
    cadets: Cadet[];
    atw_result_approval_authorities?: ApprovalAuthority[];
    atw_result_mark_cadet_approvals?: CadetApproval[];
    atw_result_subject_approvals?: SubjectApproval[];
    atw_result_program_approvals?: ProgramApproval[];
}

type ActiveTab = 'consolidated' | 'breakdown';

export default function AtwCourseSemesterProgramResultsPage() {
    const params = useParams();
    const router = useRouter();
    const can = useCan();
    const courseId = params.courseId as string;
    const semesterId = params.semesterId as string;
    const programId = params.programId as string;

    const [data, setData] = useState<ApiResponseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<ActiveTab>('consolidated');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Cadet; direction: 'asc' | 'desc' } | null>({ key: 'position', direction: 'asc' });

    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);

    const [programForwardModal, setProgramForwardModal] = useState<{
        open: boolean;
        loading: boolean;
        error: string;
    }>({ open: false, loading: false, error: '' });

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

    const handleBack = () => router.push(`/atw/results/course/${courseId}/semester/${semesterId}`);
    const handleViewResultDetails = (resultId: number) => router.push(`/atw/results/${resultId}`);
    const handlePrintClick = () => setIsPrintModalOpen(true);

    const handleForwardProgram = async () => {
        if (!data) return;
        setProgramForwardModal(prev => ({ ...prev, loading: true, error: '' }));
        try {
            const branchIds = [...new Set(
                (data.atw_result_subject_approvals ?? [])
                    .filter(sa => sa.approved_by)
                    .map(sa => sa.branch_id)
            )];
            for (const branchId of branchIds) {
                await atwApprovalService.approveProgram({
                    course_id: parseInt(courseId),
                    semester_id: parseInt(semesterId),
                    program_id: parseInt(programId),
                    branch_id: branchId,
                    status: 'approved',
                });
            }
            setProgramForwardModal({ open: false, loading: false, error: '' });
            await loadResults();
        } catch (err: any) {
            const msg = err?.message || 'Failed to forward program.';
            setProgramForwardModal(prev => ({ ...prev, loading: false, error: msg }));
        }
    };

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

    // Breakdown helpers
    const getCompMark = (cadet: Cadet, compId: number) =>
        parseFloat(String(cadet.marks[compId] || 0));

    const getWeightedCompMark = (cadet: Cadet, comp: SubjectComponent) => {
        const obtained = getCompMark(cadet, comp.id);
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

    // Subjects that have marks entered (any cadet has a result_id for this subject)
    const enteredSubjectMappingIds = data
        ? data.subjects
            .filter(sub => data.cadets.some(c => c.result_ids[sub.mapping_id] !== undefined))
            .map(sub => sub.mapping_id)
        : [];

    // Only subjects with approved_by set count as "forwarded" (approved by authority → forwarded to program level)
    const approvedSubjectIds = new Set(
        (data?.atw_result_subject_approvals ?? [])
            .filter(sa => sa.approved_by)
            .map(sa => sa.subject_id)
    );

    // Button enabled when all entered subjects are approved (approved_by set) AND program not yet approved
    const allEnteredSubjectsForwarded =
        enteredSubjectMappingIds.length > 0 &&
        enteredSubjectMappingIds.every(id => approvedSubjectIds.has(id));

    const programAlreadyApproved = (data?.atw_result_program_approvals ?? []).some(
        pa => pa.status === 'approved'
    );

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
                    Back
                </button>
                <div className="flex items-center gap-3">
                    {/* Forward Program button */}
                    {programAlreadyApproved ? (
                        <span className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                            <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
                            Program Approved
                        </span>
                    ) : (
                        <button
                            onClick={() => setProgramForwardModal({ open: true, loading: false, error: '' })}
                            disabled={!allEnteredSubjectsForwarded}
                            title={
                                allEnteredSubjectsForwarded
                                    ? 'Forward program for final approval'
                                    : `${approvedSubjectIds.size}/${enteredSubjectMappingIds.length} subjects forwarded — forward all subjects first`
                            }
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                                allEnteredSubjectsForwarded
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <Icon icon="hugeicons:share-04" className="w-4 h-4" />
                            Forward Program
                            {!allEnteredSubjectsForwarded && enteredSubjectMappingIds.length > 0 && (
                                <span className="text-[10px] font-bold opacity-70">
                                    ({approvedSubjectIds.size}/{enteredSubjectMappingIds.length})
                                </span>
                            )}
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
                            {data.semester_details?.name} Exam : {new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
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
                                    </tr>
                                    <tr>
                                        {data.subjects.map((_, idx) => (
                                            <th key={idx} className="border border-black p-1 text-center">{idx + 1}</th>
                                        ))}
                                    </tr>
                                    <tr>
                                        {data.subjects.map((sub, idx) => (
                                            <th key={idx} className="border border-black p-2 text-center text-xs">
                                                <div className="truncate" title={sub.name}>{sub.code}</div>
                                            </th>
                                        ))}
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
                                            <tr key={cadet.id} className="hover:bg-gray-50/50 transition-colors font-medium">
                                                <td className="border border-black p-2 text-center">{index + 1}</td>
                                                <td className="border border-black p-2 text-center">{cadet.bd_no}</td>
                                                <td className="border border-black p-2">{cadet.rank || "—"}</td>
                                                <td className="border border-black p-2">{cadet.name}</td>
                                                <td className="border border-black p-2 text-center">{cadet.branch || "—"}</td>
                                                {data.subjects.map((sub) => {
                                                    const subTotal = calculateSubjectTotal(cadet, sub);
                                                    const roundedTotal = subTotal !== null ? Math.ceil(subTotal) : null;
                                                    const resultId = cadet.result_ids[sub.mapping_id];
                                                    const canView = can('view');
                                                    return (
                                                        <td
                                                            key={`${cadet.id}-${sub.id}`}
                                                            onClick={() => canView && resultId && handleViewResultDetails(resultId)}
                                                            className={`border border-black p-2 text-center font-bold ${roundedTotal !== null && roundedTotal < 50 ? 'text-red-600' : ''} ${resultId && canView ? 'cursor-pointer hover:bg-blue-50 transition-colors no-print' : 'no-print'}`}
                                                            title={resultId && canView ? "Click to view result details" : ""}
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

                            // Subject-level approval (may have multiple per branch — show distinct statuses)
                            const subjectApprovals = data.atw_result_subject_approvals?.filter(
                                a => a.subject_id === subject.mapping_id
                            ) ?? [];
                            const allSubjApproved = subjectApprovals.length > 0 && subjectApprovals.every(a => a.approved_by);
                            const anySubjRejected = subjectApprovals.some(a => a.status === 'rejected');
                            const anySubjForwarded = subjectApprovals.some(a => a.forwarded_by && !a.approved_by);

                            // Helper: get ALL cadet-level approvals for this subject (all authority levels)
                            const getCadetSubjectApprovals = (cadetId: number) =>
                                data.atw_result_mark_cadet_approvals?.filter(
                                    a => a.cadet_id === cadetId && a.subject_id === subject.mapping_id
                                ) ?? [];

                            const statusColors: Record<string, string> = {
                                pending: 'bg-yellow-100 text-yellow-800',
                                approved: 'bg-green-100 text-green-800',
                                rejected: 'bg-red-100 text-red-800',
                            };

                            const authorities = (data.atw_result_approval_authorities ?? [])
                                .slice()
                                .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

                            return (
                                <div key={subject.id} className="break-inside-avoid">
                                    {/* Subject header */}
                                    <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm">
                                                <span className="font-bold text-gray-900 uppercase mr-2">Subject</span>
                                                <span className="border-b border-dashed border-black">
                                                    : {subject.name} ({subject.code})
                                                </span>
                                            </p>
                                            {/* Subject-level approval badge */}
                                            {subjectApprovals.length > 0 && (
                                                <span className={`no-print inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                    allSubjApproved ? 'bg-green-100 text-green-800' :
                                                    anySubjRejected ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {allSubjApproved ? '↑ Forwarded' :
                                                     anySubjRejected ? '✗ Subject Rejected' :
                                                     '⏳ Pending'}
                                                </span>
                                            )}
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
                                                    <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle no-print">
                                                        Status
                                                    </th>
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
                                                                    const hasMark = cadet.marks[comp.id] !== undefined;
                                                                    return diff ? (
                                                                        <React.Fragment key={comp.id}>
                                                                            <td className="border border-black px-2 py-2 text-center">
                                                                                {hasMark ? getCompMark(cadet, comp.id).toFixed(2) : "—"}
                                                                            </td>
                                                                            <td className="border border-black px-2 py-2 text-center font-medium">
                                                                                {hasMark ? getWeightedCompMark(cadet, comp).toFixed(2) : "—"}
                                                                            </td>
                                                                        </React.Fragment>
                                                                    ) : (
                                                                        <td key={comp.id} className="border border-black px-2 py-2 text-center">
                                                                            {hasMark ? getCompMark(cadet, comp.id).toFixed(2) : "—"}
                                                                        </td>
                                                                    );
                                                                })}

                                                                {hasWeighted && (
                                                                    <td className="border border-black px-2 py-2 text-center text-blue-700 font-bold">
                                                                        {subTotal !== null ? Math.ceil(subTotal) : "—"}
                                                                    </td>
                                                                )}

                                                                {/* Cadet approval status — per-authority timeline */}
                                                                <td className="border border-black px-2 py-2 no-print">
                                                                    {(() => {
                                                                        const cadetApprovals = getCadetSubjectApprovals(cadet.id);
                                                                        if (authorities.length === 0 && cadetApprovals.length === 0) {
                                                                            return <span className="text-gray-400 text-xs">—</span>;
                                                                        }
                                                                        if (authorities.length > 0) {
                                                                            return (
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    {authorities.map((auth, idx) => {
                                                                                        const label = auth.role?.name || auth.user?.name || `Step ${idx + 1}`;
                                                                                        const rec = auth.is_initial_cadet_approve
                                                                                            ? (cadetApprovals.find(a => a.authority_id === auth.id) ?? cadetApprovals.find(a => !a.authority_id))
                                                                                            : cadetApprovals.find(a => a.authority_id === auth.id);
                                                                                        const st = rec?.status;
                                                                                        return (
                                                                                            <div key={auth.id} className="flex items-center gap-1 whitespace-nowrap">
                                                                                                <span className="text-[9px] text-gray-500 truncate max-w-[70px]" title={label}>{label}:</span>
                                                                                                {st ? (
                                                                                                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${statusColors[st] ?? ''}`}>{st}</span>
                                                                                                ) : (
                                                                                                    <span className="text-[9px] text-gray-300">—</span>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            );
                                                                        }
                                                                        // Fallback: no authorities configured, show first record
                                                                        const first = cadetApprovals[0];
                                                                        return first
                                                                            ? <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${statusColors[first.status] ?? ''}`}>{first.status}</span>
                                                                            : <span className="text-gray-400 text-xs">—</span>;
                                                                    })()}
                                                                </td>
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
                    <div>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
                </div>
            </div>

            {/* Forward Program confirm modal */}
            <Modal
                isOpen={programForwardModal.open}
                onClose={() => !programForwardModal.loading && setProgramForwardModal({ open: false, loading: false, error: '' })}
            >
                <div className="p-4 space-y-4">
                    <h2 className="text-lg font-bold text-gray-900">Forward Program for Approval</h2>
                    <p className="text-sm text-gray-700">
                        Are you sure you want to forward the entire program result for final approval? This will mark all forwarded subjects as program-approved.
                    </p>
                    {programForwardModal.error && (
                        <p className="text-sm text-red-600">{programForwardModal.error}</p>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setProgramForwardModal({ open: false, loading: false, error: '' })}
                            disabled={programForwardModal.loading}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleForwardProgram}
                            disabled={programForwardModal.loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
                        >
                            {programForwardModal.loading ? (
                                <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
                            ) : (
                                <Icon icon="hugeicons:share-04" className="w-4 h-4" />
                            )}
                            {programForwardModal.loading ? 'Forwarding...' : 'Confirm Forward'}
                        </button>
                    </div>
                </div>
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
