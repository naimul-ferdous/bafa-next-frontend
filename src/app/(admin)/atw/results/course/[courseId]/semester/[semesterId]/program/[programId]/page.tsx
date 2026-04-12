/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwResultService } from "@/libs/services/atwResultService";
import { atwApprovalService } from "@/libs/services/atwApprovalService";
import FullLogo from "@/components/ui/fulllogo";
import type { FilePrintType } from "@/libs/types/filePrintType";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";
import { Modal } from "@/components/ui/modal";
import { useCan } from "@/context/PagePermissionsContext";
import { useAuth } from "@/context/AuthContext";

interface SubjectComponent {
    id: number;
    name: string;
    estimate_mark: number;
    percentage: number;
    type?: string;
    is_combined?: boolean;
    combined_cols?: { id: number; combined_mark_id: number; referenced_mark_id: number }[];
}

interface Subject {
    id: number;
    name: string;
    code: string;
    legend: string | null;
    full_mark: number;
    components: SubjectComponent[];
    university_name?: string | null;
    program_name?: string | null;
    changeable_semester_id?: number | null;
}

interface Cadet {
    id: number;
    name: string;
    bd_no: string;
    rank: string | null;
    branch: string | null;
    marks: Record<number, Record<number, number>>; // [subjectId][markId]
    result_ids: Record<number, number>;
    total_achieved: number;
    total_estimated: number;
    percentage: number;
    position: number;
    remarks: string;
}

interface CadetApproval {
    id: number;
    cadet_id: number;
    subject_id: number;
    authority_id: number | null;
    status: 'pending' | 'approved' | 'rejected';
    rejected_reason?: string | null;
    approved_date?: string | null;
    is_active: boolean;
    rejectedBy?: { id: number; name: string } | null;
}

interface SubjectApproval {
    id: number;
    subject_id: number;
    authority_id: number | null;
    status: 'pending' | 'approved' | 'rejected';
    rejected_reason?: string | null;
    forwarded_by?: number | null;
    approved_by?: number | null;
    is_active: boolean;
}

interface ProgramApproval {
    id: number;
    authority_id: number;
    status: 'pending' | 'approved' | 'rejected';
    rejected_reason?: string | null;
    approved_by?: number | null;
    forwarded_by?: number | null;
    approved_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    is_active: boolean;
    approver?: {
        id: number;
        name: string;
        rank?: { id: number; name: string; short_name: string } | null;
        signature?: string | null;
    } | null;
    forwarder?: {
        id: number;
        name: string;
        rank?: { id: number; name: string; short_name: string } | null;
        roles?: { id: number; name: string; pivot?: { is_primary: boolean } }[];
        signature?: string | null;
    } | null;
}

interface SemesterApproval {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    rejected_reason?: string | null;
    approved_by: number;
    approved_at: string;
    is_active: boolean;
    approver?: {
        id: number;
        name: string;
        rank?: { id: number; name: string; short_name: string } | null;
    } | null;
}

interface ApprovalAuthority {
    id: number;
    user_id?: number | null;
    role_id?: number | null;
    role?: { id: number; name: string } | null;
    user?: { id: number; name: string; rank?: { id: number; name: string; short_name: string } | null } | null;
    is_initial_cadet_approve?: boolean;
    is_initial_forward?: boolean;
    is_final?: boolean;
    is_signature?: boolean;
    sort?: number;
}

interface ApiResponseData {
    course_details: { id: number; name: string; code?: string } | null;
    semester_details: { id: number; name: string; code?: string } | null;
    program_details: { id: number; name: string; is_changeable?: boolean; changeable_program?: { id: number; name: string; short_name?: string; code?: string } | null } | null;
    subjects: Subject[];
    cadets: Cadet[];
    atw_result_approval_authorities?: ApprovalAuthority[];
    atw_result_mark_cadet_approvals?: CadetApproval[];
    atw_result_subject_approvals?: SubjectApproval[];
    atw_result_program_approvals?: ProgramApproval[];
    atw_result_semester_approvals?: SemesterApproval[];
}

type ActiveTab = 'consolidated' | 'breakdown';

interface RejectedCadetItem {
    cadet_id: number;
    cadet_name: string;
    cadet_bd_no: string;
    cadet_rank: string;
    cadet_branch: string;
    course_name: string;
    semester_name: string;
    program_name: string;
    subject_id: number;
    subject_name: string;
    subject_code: string;
    course_id: number;
    semester_id: number;
    program_id: number;
    result_id?: number;
    state?: string;
    message?: string;
    rejected_by?: string;
    rejected_reason?: string;
    can_resubmit?: boolean;
    can_reject_down?: boolean;
    my_authority_id?: number;
}

interface AuthUser {
    id: number;
    name: string;
    roles?: {
        id: number;
        name: string;
        slug?: string;
        pivot?: { is_primary: boolean }
    }[];
}

function SignatureBox({ auth, signer, approvedAt, position }: {
    auth: ApprovalAuthority;
    signer: { name: string; rank?: { name: string; short_name: string } | null; signature?: string | null; designation?: string | null } | null;
    approvedAt?: string | null;
    position?: 'first' | 'middle' | 'last';
}) {
    const [imgFailed, setImgFailed] = React.useState(false);

    const dateStr = approvedAt
        ? (() => {
            const d = new Date(approvedAt);
            const day   = String(d.getDate()).padStart(2, '0');
            const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const year  = d.getFullYear();
            return `${day}-${month}-${year}`;
        })()
        : null;

    const label = position === 'first'
        ? 'Prepared & Checked By'
        : position === 'last'
            ? 'Approved By'
            : auth.role?.name ?? auth.user?.name ?? '—';

    return (
        <div className="signature-box flex flex-col items-start min-w-[180px]">
            <p className="sig-label text-sm uppercase mb-1">{label}</p>
            <div className="sig-area w-full flex items-end justify-start pb-1">
                {signer?.signature && !imgFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={signer.signature}
                        alt=""
                        className="max-h-14 max-w-[150px] object-contain"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <span className="text-sm italic text-gray-400">Signature not provided</span>
                )}
            </div>

            {/* Signer details */}
            {signer && (
                <p className="sig-name text-sm font-bold text-gray-900 uppercase mt-1">{signer.name}</p>
            )}
            {signer?.rank?.short_name && (
                <p className="sig-rank text-xs font-semibold">{signer.rank.short_name}</p>
            )}
            {signer?.designation && (
                <p className="sig-designation text-xs text-gray-700">{signer.designation}</p>
            )}
            {dateStr && (
                <p className="sig-date text-xs text-gray-500 pt-0.5 border-t border-gray-800 mt-1">{dateStr}</p>
            )}
        </div>
    );
}

export default function AtwCourseSemesterProgramResultsPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const can = useCan("/atw/results");
    const courseId = params.courseId as string;
    const semesterId = params.semesterId as string;
    const programId = params.programId as string;
    const changeableId = searchParams.get('changeable') || '';
    const mainOnly = searchParams.get('main') === '1';

    const { user } = useAuth() as { user: AuthUser | null };

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

    const [bulkApproveModal, setBulkApproveModal] = useState<{
        open: boolean;
        loading: boolean;
        error: string;
    }>({ open: false, loading: false, error: '' });

    const [rejectedPanelItems, setRejectedPanelItems] = useState<RejectedCadetItem[]>([]);
    const [rejectedPanelLoading, setRejectedPanelLoading] = useState(false);
    const [rejectedPanelExpanded, setRejectedPanelExpanded] = useState(true);
    const [resubmitLoading, setResubmitLoading] = useState<number | null>(null);
    const [rejectDownModal, setRejectDownModal] = useState<{
        open: boolean; item: RejectedCadetItem | null; reason: string; loading: boolean; error: string;
    }>({ open: false, item: null, reason: '', loading: false, error: '' });

    const loadResults = useCallback(async () => {
        if (!courseId || !semesterId || !programId) return;
        try {
            setLoading(true);
            const responseData = await atwResultService.getSubjectWiseByProgram(
                parseInt(courseId),
                parseInt(semesterId),
                parseInt(programId),
                changeableId ? parseInt(changeableId) : undefined,
                mainOnly || undefined
            );
            if (responseData) {
                if (responseData.atw_result_mark_cadet_approvals) {
                    responseData.atw_result_mark_cadet_approvals.sort((a: any, b: any) => b.id - a.id);
                }
                if (responseData.atw_result_subject_approvals) {
                    responseData.atw_result_subject_approvals.sort((a: any, b: any) => b.id - a.id);
                }
                if (responseData.atw_result_program_approvals) {
                    responseData.atw_result_program_approvals.sort((a: any, b: any) => b.id - a.id);
                }
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
    }, [courseId, semesterId, programId, changeableId, mainOnly]);

    useEffect(() => {
        loadResults();
    }, [loadResults]);

    const loadRejectedPanel = useCallback(async () => {
        try {
            setRejectedPanelLoading(true);
            const items = await atwApprovalService.getRejectedCadetPanel({
                course_id: Number(courseId),
                semester_id: Number(semesterId),
                program_id: Number(programId),
            });
            setRejectedPanelItems(items);
        } catch {
            setRejectedPanelItems([]);
        } finally {
            setRejectedPanelLoading(false);
        }
    }, [courseId, semesterId, programId]);

    useEffect(() => {
        if (courseId && semesterId && programId) loadRejectedPanel();
    }, [loadRejectedPanel, courseId, semesterId, programId]);

    const handleResubmit = async (item: RejectedCadetItem) => {
        try {
            setResubmitLoading(item.cadet_id);
            await atwApprovalService.resubmitRejectedCadet({
                course_id: item.course_id,
                semester_id: item.semester_id,
                program_id: item.program_id,
                cadet_id: item.cadet_id,
                subject_id: item.subject_id,
            });
            await loadRejectedPanel();
        } catch {
            alert('Failed to resubmit cadet.');
        } finally {
            setResubmitLoading(null);
        }
    };

    const handleRejectDown = async () => {
        if (!rejectDownModal.item) return;
        if (!rejectDownModal.reason.trim()) {
            setRejectDownModal(prev => ({ ...prev, error: 'Rejection reason is required.' }));
            return;
        }
        const item = rejectDownModal.item;
        setRejectDownModal(prev => ({ ...prev, loading: true, error: '' }));
        try {
            await atwApprovalService.approveCadets({
                course_id: item.course_id,
                semester_id: item.semester_id,
                program_id: item.program_id,
                subject_id: item.subject_id,
                cadet_ids: [item.cadet_id],
                authority_id: item.my_authority_id ?? 0,
                status: 'rejected',
                rejected_reason: rejectDownModal.reason,
            });
            setRejectDownModal({ open: false, item: null, reason: '', loading: false, error: '' });
            await loadRejectedPanel();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to reject.';
            setRejectDownModal(prev => ({ ...prev, loading: false, error: msg }));
        }
    };

    const myAuthority = useMemo(() => {
        const authorities = data?.atw_result_approval_authorities ?? [];
        const userRoleIds = user?.roles?.filter((r) => r.pivot?.is_primary).map((r) => r.id) ?? [];
        const userId = user?.id;
        return authorities.find((a: ApprovalAuthority) =>
            (a.user_id && a.user_id === userId) || (a.role_id && userRoleIds.includes(a.role_id))
        ) ?? null;
    }, [data?.atw_result_approval_authorities, user]);

    const myProgramApproval = useMemo(() => {
        if (!myAuthority) return null;
        return (data?.atw_result_program_approvals ?? []).find((pa: ProgramApproval) => pa.authority_id === myAuthority.id);
    }, [data?.atw_result_program_approvals, myAuthority]);

    const sortedAuthorities = useMemo(() => {
        return [...(data?.atw_result_approval_authorities ?? [])].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    }, [data?.atw_result_approval_authorities]);

    // Filter to only authorities relevant to this program (engineering vs non-engineering)
    const chainAuthorities = useMemo(() => {
        const isEngg = !!(data?.program_details as any)?.is_changeable;
        return sortedAuthorities.filter((auth: any) => {
            if (auth.is_only_engg) return isEngg;
            const hasPeerEngg = sortedAuthorities.some((a: any) => a.is_only_engg && (a.sort ?? 0) === (auth.sort ?? 0));
            if (hasPeerEngg) return !isEngg;
            return true;
        });
    }, [sortedAuthorities, data?.program_details]);

    const lowerAuthority = useMemo(() => {
        if (!myAuthority) return null;
        const mySort = myAuthority.sort ?? 0;
        return [...chainAuthorities].reverse().find(a => (a.sort ?? 0) < mySort) ?? null;
    }, [myAuthority, chainAuthorities]);

    const higherAuthority = useMemo(() => {
        if (!myAuthority) return null;
        const mySort = myAuthority.sort ?? 0;
        return chainAuthorities.find(a => (a.sort ?? 0) > mySort) ?? null;
    }, [myAuthority, chainAuthorities]);

    const getNextAuthority = useCallback(() => {
        const authorities = chainAuthorities.filter(a => !a.is_initial_cadet_approve);
        if (!myAuthority) return authorities[0] || null;
        return authorities.find(a => (a.sort ?? 0) > (myAuthority.sort ?? 0)) || null;
    }, [chainAuthorities, myAuthority]);


    const handleBack = () => history.back();
    const handleViewResultDetails = (resultId: number) => router.push(`/atw/results/${resultId}`);
    const handlePrintClick = () => setIsPrintModalOpen(true);

    const handleForwardProgram = async () => {
        if (!data) return;
        setProgramForwardModal(prev => ({ ...prev, loading: true, error: '' }));
        try {
            const nextAuthority = getNextAuthority();
            await atwApprovalService.approveProgram({
                course_id: parseInt(courseId),
                semester_id: parseInt(semesterId),
                program_id: parseInt(programId),
                status: 'approved',
                authority_ids: nextAuthority ? [nextAuthority.id] : [],
            });
            setProgramForwardModal({ open: false, loading: false, error: '' });
            await loadResults();
        } catch (err: any) {
            const msg = err?.message || 'Failed to forward program.';
            setProgramForwardModal(prev => ({ ...prev, loading: false, error: msg }));
        }
    };

    const handleBulkApproveAndForward = async () => {
        if (!data) return;
        setBulkApproveModal(prev => ({ ...prev, loading: true, error: '' }));
        try {
            const nextAuthority = getNextAuthority();
            await atwApprovalService.bulkApproveAndForwardProgram({
                course_id: parseInt(courseId),
                semester_id: parseInt(semesterId),
                program_id: parseInt(programId),
                authority_ids: nextAuthority ? [nextAuthority.id] : [],
            });
            setBulkApproveModal({ open: false, loading: false, error: '' });
            await loadResults();
        } catch (err: any) {
            const msg = err?.message || 'Failed to bulk approve and forward program.';
            setBulkApproveModal(prev => ({ ...prev, loading: false, error: msg }));
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
        const subMarks = cadet.marks[subject.id];
        if (!subMarks) return null;

        // Build referenced mark IDs for this subject
        const rIds = new Set(subject.components.flatMap(c =>
            c.is_combined && c.combined_cols ? c.combined_cols.map(col => col.referenced_mark_id) : []
        ));

        const total = subject.components.reduce((acc, comp) => {
            if (rIds.has(comp.id)) return acc; // skip — counted via combined
            const inputMark = subMarks[comp.id];
            if (inputMark !== undefined) {
                hasAnyMark = true;
                const markVal = Number(inputMark) || 0;
                if (comp.is_combined) return acc + markVal; // stored value is already final
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
        if (comp.is_combined) return getCompMark(cadet, subjectId, comp.id); // stored value is already final
        const obtained = getCompMark(cadet, subjectId, comp.id);
        const estimate = parseFloat(String(comp.estimate_mark || 0));
        const percentage = parseFloat(String(comp.percentage || 0));
        if (estimate === 0 && percentage === 0) return 0;
        if (estimate === percentage || estimate === 0) return obtained;
        return (obtained / estimate) * percentage;
    };

    const isCompDiff = (comp: SubjectComponent) =>
        !comp.is_combined && parseFloat(String(comp.estimate_mark || 0)) !== parseFloat(String(comp.percentage || 0));

    const getSubjectColSpan = (subject: Subject) =>
        subject.components.reduce((acc, c) => acc + (isCompDiff(c) ? 2 : 1), 0);

    const subjectHasWeighted = (subject: Subject) =>
        subject.components.some(c => isCompDiff(c));

    const getGroupLabel = (key: string) => {
        if (key === 'classtest') return 'Class Test';
        if (key === 'quiztest') return 'Quiz Test';
        if (key === 'midsemester') return 'Mid Semester';
        if (key === 'endsemester') return 'End Semester';
        return key.replace(/([A-Z])/g, ' $1').trim();
    };

    const getCompGroups = (subject: Subject): Record<string, SubjectComponent[]> => {
        const groups: Record<string, SubjectComponent[]> = {};
        [...subject.components].sort((a, b) => a.id - b.id).forEach(comp => {
            const type = comp.type?.toLowerCase() || 'other';
            if (!groups[type]) groups[type] = [];
            groups[type].push(comp);
        });
        return groups;
    };

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

    // Subjects that have marks entered
    const enteredSubjectMappingIds = data
        ? data.subjects
            .filter(sub => data.cadets.some(c => c.result_ids[sub.id] !== undefined))
            .map(sub => sub.id)
        : [];

    const approvedSubjectIds = new Set(
        (data?.atw_result_subject_approvals ?? [])
            .filter(sa => myAuthority
                ? sa.authority_id === myAuthority.id && sa.status === 'approved'
                : sa.status === 'approved'
            )
            .map(sa => sa.subject_id)
    );

    const allEnteredSubjectsForwarded =
        enteredSubjectMappingIds.length > 0 &&
        enteredSubjectMappingIds.every(id => approvedSubjectIds.has(id));

    const programAlreadyApproved = (data?.atw_result_program_approvals ?? []).some(
        pa => pa.status === 'approved'
    );

    const programAlreadyForwardedByMe = (data?.atw_result_program_approvals ?? []).some(
        pa => pa.status === 'pending' && pa.forwarded_by === user?.id
    );

    const canInitiateProgramForward = (myAuthority?.is_initial_cadet_approve || myAuthority?.is_initial_forward) && (data?.atw_result_program_approvals ?? []).length === 0;
    const isMyProgramTurn = canInitiateProgramForward || (myProgramApproval?.status === 'pending');

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

    // Program-level forwarding gate: higher authorities (not instructor/initial_forward)
    // only see content if the program has been forwarded to their authority level.
    const isProgramForwardedToMe =
        !myAuthority ||
        myAuthority.is_initial_cadet_approve ||
        myAuthority.is_initial_forward ||
        (data.atw_result_program_approvals ?? []).some((pa: any) => pa.authority_id === myAuthority.id);

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            <style jsx global>{`
                @media print {
                    @page { size: A3 landscape; margin: 15mm 15mm 20mm 15mm; }
                    .cv-content { width: 100% !important; max-width: none !important; }
                    table { font-size: 12px !important; border-collapse: collapse !important; width: 100% !important; }
                    th, td { border: 1px solid black !important; padding: 4px !important; }
                    .print-div { max-width: none !important; margin: 20px 0 !important; }
                    .no-print { display: none !important; }

                    .signature-section {
                        margin-top: 40px !important;
                        padding-top: 20px !important;
                        display: flex !important;
                        justify-content: space-between !important;
                        gap: 40px !important;
                        padding-left: 8px !important;
                        padding-right: 8px !important;
                        page-break-inside: avoid !important;
                    }
                    .signature-box {
                        min-width: 180px !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: flex-start !important;
                    }
                    .signature-box .sig-label {
                        font-size: 10px !important;
                        font-weight: 700 !important;
                        color: #b91c1c !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.05em !important;
                        margin-bottom: 4px !important;
                    }
                    .signature-box .sig-area {
                        height: 60px !important;
                        display: flex !important;
                        align-items: flex-end !important;
                        padding-bottom: 4px !important;
                        margin-bottom: 4px !important;
                    }
                    .signature-box .sig-name {
                        font-size: 11px !important;
                        font-weight: 700 !important;
                        text-transform: uppercase !important;
                        color: #111827 !important;
                        margin-top: 2px !important;
                    }
                    .signature-box .sig-rank {
                        font-size: 11px !important;
                        font-weight: 600 !important;
                        color: #f97316 !important;
                    }
                    .signature-box .sig-designation {
                        font-size: 10px !important;
                        color: #374151 !important;
                    }
                    .signature-box .sig-date {
                        font-size: 10px !important;
                        color: #6b7280 !important;
                        padding-top: 3px !important;
                        border-top: 1px solid #1f2937 !important;
                        margin-top: 4px !important;
                    }
                }
            `}</style>

            <div className="p-4 flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                    <button onClick={handleBack} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                        Back to List
                    </button>
                    {(changeableId || mainOnly) && (
                        <button
                            onClick={() => router.push(`/atw/results/course/${courseId}/semester/${semesterId}/program/${programId}`)}
                            className="px-4 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                        >
                            <Icon icon="hugeicons:view" className="w-4 h-4" />
                            View All
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {(myAuthority as any)?.is_program_forward ? (
                        myProgramApproval?.status === 'pending' &&
                        myProgramApproval?.forwarded_by !== user?.id &&
                        !programAlreadyForwardedByMe &&
                        !programAlreadyApproved && (
                            <button
                                onClick={() => setBulkApproveModal({ open: true, loading: false, error: '' })}
                                className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                                title={`Forward to ${higherAuthority?.role?.name || higherAuthority?.user?.name || 'Next Level'}`}
                            >
                                <Icon icon="hugeicons:share-04" className="w-4 h-4" />
                                Forward to {higherAuthority?.role?.name || higherAuthority?.user?.name || 'Next Level'} Program
                            </button>
                        )
                    ) : (
                        <>
                            {programAlreadyApproved && (
                                <span className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                    <Icon icon="hugeicons:checkmark-circle-02" className="w-3.5 h-3.5" />
                                    Program Approved
                                </span>
                            )}
                            {programAlreadyForwardedByMe && !programAlreadyApproved && (
                                <span className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    <Icon icon="hugeicons:share-04" className="w-3.5 h-3.5" />
                                    Already Forwarded
                                </span>
                            )}
                            {(() => {
                                if (programAlreadyForwardedByMe || programAlreadyApproved) return null;
                                const allSubjectMappingIds = (data?.subjects ?? []).map(sub => sub.id);
                                const approvedCount = allSubjectMappingIds.filter(id => approvedSubjectIds.has(id)).length;
                                const totalCount = allSubjectMappingIds.length;
                                const allSubjectsApproved = totalCount > 0 && approvedCount === totalCount;
                                const canForward = isMyProgramTurn && allSubjectsApproved;
                                const isDisabled = !isMyProgramTurn || !allSubjectsApproved;
                                return (
                                    <button
                                        onClick={() => !isDisabled && setProgramForwardModal({ open: true, loading: false, error: '' })}
                                        disabled={isDisabled}
                                        title={!isMyProgramTurn ? 'Not your turn' : !allSubjectsApproved ? `All ${totalCount} subjects must be approved first` : 'Forward program'}
                                        className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${canForward
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <Icon icon="hugeicons:share-04" className="w-4 h-4" />
                                        Forward Program {approvedCount}/{totalCount}
                                    </button>
                                );
                            })()}
                        </>
                    )}
                    <button onClick={handlePrintClick} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Icon icon="hugeicons:printer" className="w-4 h-4" />
                        Print
                    </button>
                </div>
            </div>

            {/* {chainAuthorities.length > 0 && (
                <div className="no-print mx-4 mt-2 mb-2">
                    <div className="flex items-center flex-wrap gap-y-1">
                        {chainAuthorities.map((auth, idx) => {
                            const isMe = myAuthority?.id === auth.id;
                            const isLast = idx === chainAuthorities.length - 1;
                            const pPA = data.atw_result_program_approvals ?? [];
                            const subjectApprovals = data.atw_result_subject_approvals ?? [];
                            const totalSubj = enteredSubjectMappingIds.length;

                            let isApproved = false;
                            let isPending = false;
                            let statusText = 'Not reached';

                            if ((auth as any).is_program_forward || (!auth.is_initial_cadet_approve && !auth.is_initial_forward)) {
                                isApproved = (pPA as any[]).some(pa => pa.authority_id === auth.id && pa.status === 'approved');
                                isPending = !isApproved && (pPA as any[]).some(pa => pa.authority_id === auth.id && pa.status === 'pending');
                                statusText = isApproved ? 'Approved' : isPending ? 'Pending' : 'Not reached';
                            } else if (auth.is_initial_forward) {
                                const approvedCount = enteredSubjectMappingIds.filter(sid =>
                                    (subjectApprovals as any[]).some(sa => sa.authority_id === auth.id && sa.subject_id === sid && sa.status === 'approved')
                                ).length;
                                isApproved = totalSubj > 0 && approvedCount === totalSubj;
                                isPending = !isApproved && approvedCount > 0;
                                statusText = isApproved ? 'All Subjects' : isPending ? `${approvedCount}/${totalSubj}` : 'Not reached';
                            } else if (auth.is_initial_cadet_approve) {
                                const forwardedCount = enteredSubjectMappingIds.filter(sid =>
                                    (subjectApprovals as any[]).some(sa => sa.subject_id === sid)
                                ).length;
                                isApproved = totalSubj > 0 && forwardedCount === totalSubj;
                                isPending = !isApproved && forwardedCount > 0;
                                statusText = isApproved ? 'Forwarded' : isPending ? `${forwardedCount}/${totalSubj}` : 'Not reached';
                            }

                            const dotColor = isApproved ? 'bg-green-500' : isPending ? 'bg-yellow-400' : isMe ? 'bg-blue-500' : 'bg-gray-300';
                            const dotIcon = isApproved
                                ? <Icon icon="hugeicons:checkmark-circle-02" className="w-3 h-3 text-white" />
                                : isPending
                                    ? <Icon icon="hugeicons:clock-01" className="w-3 h-3 text-white" />
                                    : <Icon icon="hugeicons:circle" className="w-3 h-3 text-white opacity-60" />;

                            return (
                                <div key={auth.id} className="flex items-center">
                                    <div className={`flex flex-col items-center px-2 py-1 rounded-lg border ${isMe ? 'bg-blue-50 border-blue-300' : isApproved ? 'bg-green-50 border-green-200' : isPending ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${dotColor}`}>
                                                {dotIcon}
                                            </div>
                                            <span className={`text-xs font-medium ${isMe ? 'text-blue-700' : isApproved ? 'text-green-700' : isPending ? 'text-yellow-700' : 'text-gray-500'}`}>
                                                {auth.role?.name || auth.user?.name || `Auth #${auth.id}`}
                                                {isMe && <span className="ml-1 text-[9px] text-blue-400">(me)</span>}
                                            </span>
                                        </div>
                                        <span className={`text-[9px] mt-0.5 ${isApproved ? 'text-green-600' : isPending ? 'text-yellow-600' : 'text-gray-400'}`}>
                                            {statusText}
                                        </span>
                                    </div>
                                    {!isLast && (
                                        <Icon icon="hugeicons:arrow-right-01" className={`w-4 h-4 mx-1 shrink-0 ${isApproved ? 'text-green-400' : 'text-gray-300'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )} */}

            {rejectedPanelItems.length > 0 && (
                <div className="mb-6 border border-orange-200 rounded-lg overflow-hidden no-print mx-4 mt-4">
                    <button
                        className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 text-orange-800 font-semibold text-sm hover:bg-orange-100 transition-colors"
                        onClick={() => setRejectedPanelExpanded(v => !v)}
                    >
                        <div className="flex items-center gap-2">
                            <Icon icon="hugeicons:alert-02" className="w-5 h-5 text-orange-500" />
                            Rejected Cadets ({rejectedPanelItems.length})
                        </div>
                        <Icon icon={rejectedPanelExpanded ? 'hugeicons:arrow-up-01' : 'hugeicons:arrow-down-01'} className="w-4 h-4" />
                    </button>
                    {rejectedPanelExpanded && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-orange-50 text-orange-900">
                                        <th className="px-2 py-2 border border-orange-200">Sl</th>
                                        <th className="px-2 py-2 border border-orange-200">BD No</th>
                                        <th className="px-2 py-2 border border-orange-200">Rank</th>
                                        <th className="px-2 py-2 border border-orange-200">Name</th>
                                        <th className="px-2 py-2 border border-orange-200">Branch</th>
                                        <th className="px-2 py-2 border border-orange-200">Subject</th>
                                        <th className="px-2 py-2 border border-orange-200">Rejected By</th>
                                        <th className="px-2 py-2 border border-orange-200">Reason</th>
                                        <th className="px-2 py-2 border border-orange-200">Status</th>
                                        <th className="px-2 py-2 border border-orange-200">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rejectedPanelItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-orange-50 cursor-pointer" onClick={() => item.result_id && router.push(`/atw/results/${item.result_id}`)}>
                                            <td className="px-2 py-2 border border-orange-100 text-center">{idx + 1}</td>
                                            <td className="px-2 py-2 border border-orange-100 font-bold">{item.cadet_bd_no}</td>
                                            <td className="px-2 py-2 border border-orange-100">{item.cadet_rank}</td>
                                            <td className="px-2 py-2 border border-orange-100 font-medium">{item.cadet_name}</td>
                                            <td className="px-2 py-2 border border-orange-100">{item.cadet_branch}</td>
                                            <td className="px-2 py-2 border border-orange-100">{item.subject_name}</td>
                                            <td className="px-2 py-2 border border-orange-100 text-red-700">{item.rejected_by}</td>
                                            <td className="px-2 py-2 border border-orange-100 text-gray-600 truncate max-w-[150px]">{item.rejected_reason}</td>
                                            <td className="px-2 py-2 border border-orange-100 text-[10px] font-bold">{item.message}</td>
                                            <td className="px-2 py-2 border border-orange-100 text-center" onClick={e => e.stopPropagation()}>
                                                <div className="flex gap-1 justify-center">
                                                    {item.can_resubmit && (
                                                        <button onClick={() => handleResubmit(item)} className="px-2 py-1 bg-green-600 text-white rounded text-[10px]">Re-submit</button>
                                                    )}
                                                    {item.can_reject_down && (
                                                        <button onClick={() => setRejectDownModal({ open: true, item, reason: '', loading: false, error: '' })} className="px-2 py-1 bg-orange-600 text-white rounded text-[10px]">Reject ↓</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <div className="p-4 cv-content">
                <div className="mb-8">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
                    <div className="mb-2">
                        <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">Academic Training Wing</p>
                        <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">
                            {data.course_details?.name} ({data.program_details?.is_changeable && data.program_details?.changeable_program ? data.program_details.changeable_program.name : data.program_details?.name})
                        </p>
                        <p className="text-center font-medium text-gray-900 uppercase underline tracking-wider">
                            {data.semester_details?.name} Exam : Mar 2026
                        </p>
                    </div>
                </div>

                {!isProgramForwardedToMe ? (
                    <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed border-yellow-300 bg-yellow-50 gap-3 my-4">
                        <Icon icon="hugeicons:clock-01" className="w-10 h-10 text-yellow-500" />
                        <p className="text-base font-semibold text-yellow-700">Waiting for Result</p>
                        <p className="text-sm text-yellow-600">This program has not been forwarded to your authority level yet.</p>
                    </div>
                ) : (<>

                    <div className="pb-2 no-print flex justify-end">
                        <div className="flex justify-end gap-1 rounded-full p-1 border border-gray-200">
                            {(['consolidated', 'breakdown'] as ActiveTab[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-2 text-sm font-medium rounded-full border capitalize transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeTab === 'consolidated' && (
                        <div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-black text-sm">
                                    <thead>
                                        <tr>
                                            <th rowSpan={4} className="border border-black p-2">Sl.</th>
                                            <th rowSpan={4} className="border border-black p-2">BD/No</th>
                                            <th rowSpan={4} className="border border-black p-2">Rank</th>
                                            <th rowSpan={4} className="border border-black p-2">Name</th>
                                            <th rowSpan={4} className="border border-black p-2">Branch</th>
                                            {(() => {
                                                const groups: { programName: string | null; universityName: string | null; changeableId: number | null; count: number }[] = [];
                                                let currentKey = '';
                                                data.subjects.forEach((sub) => {
                                                    const key = `${sub.program_name || ''}-${sub.university_name || ''}-${sub.changeable_semester_id || ''}`;
                                                    if (key === currentKey && groups.length > 0) {
                                                        groups[groups.length - 1].count++;
                                                    } else {
                                                        groups.push({ programName: sub.program_name || null, universityName: sub.university_name || null, changeableId: sub.changeable_semester_id || null, count: 1 });
                                                        currentKey = key;
                                                    }
                                                });
                                                const isFiltered = !!changeableId || mainOnly;
                                                return groups.map((g, i) => {
                                                    const isClickable = !isFiltered && groups.length > 1;
                                                    const handleClick = () => {
                                                        if (!isClickable) return;
                                                        if (g.changeableId) {
                                                            router.push(`/atw/results/course/${courseId}/semester/${semesterId}/program/${programId}?changeable=${g.changeableId}`);
                                                        } else {
                                                            router.push(`/atw/results/course/${courseId}/semester/${semesterId}/program/${programId}?main=1`);
                                                        }
                                                    };
                                                    return (
                                                        <th
                                                            key={i}
                                                            colSpan={g.count}
                                                            className={`border border-black p-2 text-center ${isClickable ? 'cursor-pointer hover:bg-blue-50 transition-colors' : ''}`}
                                                            onClick={isClickable ? handleClick : undefined}
                                                            title={isClickable ? `View ${g.programName} results only` : undefined}
                                                        >
                                                           
                                                            <div>{g.universityName ? `${g.universityName} Subjects` : 'Subjects'}</div>
                                                        </th>
                                                    );
                                                });
                                            })()}
                                            <th rowSpan={4} className="border border-black p-2">Total<br />({grandTotalFullMark})</th>
                                            <th rowSpan={4} className="border border-black p-2">Percentile</th>
                                            <th rowSpan={4} className="border border-black p-2">Position</th>
                                            <th rowSpan={4} className="border border-black p-2">Remarks</th>
                                        </tr>
                                        <tr>{data.subjects.map((_, idx) => <th key={idx} className="border border-black p-1">{idx + 1}</th>)}</tr>
                                        <tr>
                                            {data.subjects.map((sub, idx) => {
                                                const resultId = data.cadets.find(c => c.result_ids[sub.id])?.result_ids[sub.id];
                                                const subjApprovals = data.atw_result_subject_approvals?.filter((a: any) => a.subject_id === sub.id) ?? [];
                                                const isFinalApproved = subjApprovals.some((a: any) => {
                                                    const auth = data.atw_result_approval_authorities?.find((aa: any) => aa.id === a.authority_id);
                                                    return auth?.is_final && a.status === 'approved';
                                                });
                                                const isForwardedFromLower = myAuthority?.is_initial_cadet_approve
                                                    ? true
                                                    : myAuthority
                                                        ? subjApprovals.some((a: any) => a.authority_id === myAuthority.id) || isFinalApproved
                                                        : subjApprovals.length > 0;
                                                const isWaiting = !isForwardedFromLower;
                                                return (
                                                    <th
                                                        key={idx}
                                                        className={`border border-black p-2 text-xs ${isWaiting ? 'bg-orange-100 text-orange-600 cursor-default' : resultId ? 'cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors' : ''}`}
                                                        onClick={() => !isWaiting && resultId && handleViewResultDetails(resultId)}
                                                        title={isWaiting ? 'Waiting for Result' : resultId ? 'View Subject Details' : ''}
                                                    >
                                                        {sub.code}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                        <tr>{data.subjects.map((sub, idx) => <th key={idx} className="border border-black p-1 text-[10px]">{sub.full_mark}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {sortedCadets.map((cadet, index) => (
                                            <tr key={cadet.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="border border-black p-2 text-center">{index + 1}</td>
                                                <td className="border border-black p-2 text-center">{cadet.bd_no}</td>
                                                <td className="border border-black p-2">{cadet.rank || "—"}</td>
                                                <td className="border border-black p-2">{cadet.name}</td>
                                                <td className="border border-black p-2 text-center">{cadet.branch || "—"}</td>
                                                {data.subjects.map((sub) => {
                                                    const total = calculateSubjectTotal(cadet, sub);
                                                    const rounded = total !== null ? Math.ceil(total) : null;
                                                    return <td key={sub.id} className={`border border-black p-2 text-center font-bold ${rounded !== null && rounded < 50 ? 'text-red-600' : ''}`}>{rounded ?? "—"}</td>
                                                })}
                                                <td className="border border-black p-2 text-center font-bold">{Math.ceil(cadet.total_achieved)}</td>
                                                <td className="border border-black p-2 text-center font-bold">{cadet.percentage}</td>
                                                <td className="border border-black p-2 text-center">{getOrdinal(cadet.position)}</td>
                                                <td className="border border-black p-2 text-center text-xs italic text-gray-500">{cadet.remarks || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Signature Section */}
                            {(() => {
                                const signatureAuthorities = chainAuthorities
                                    .filter((a: ApprovalAuthority) => a.is_signature)
                                    .sort((a: ApprovalAuthority, b: ApprovalAuthority) => (a.sort ?? 0) - (b.sort ?? 0));
                                if (signatureAuthorities.length === 0) return null;
                                const allProgramApprovals = data.atw_result_program_approvals ?? [];
                                // All authorities sorted by sort order (for finding next authority)
                                const allAuthsSorted = [...(data.atw_result_approval_authorities ?? [])]
                                    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
                                return (
                                    <div className="signature-section max-w-5xl mx-auto mt-8 flex justify-between gap-10 pr-2">
                                        {signatureAuthorities.map((auth: ApprovalAuthority, sigIdx: number) => {
                                            const sigPosition: 'first' | 'middle' | 'last' =
                                                sigIdx === 0 ? 'first'
                                                : sigIdx === signatureAuthorities.length - 1 ? 'last'
                                                : 'middle';
                                            const authIdx = allAuthsSorted.findIndex(a => a.id === auth.id);
                                            const nextAuth = authIdx >= 0 && authIdx < allAuthsSorted.length - 1
                                                ? allAuthsSorted[authIdx + 1]
                                                : null;

                                            // The signer for this authority box is whoever forwarded FROM this level
                                            // — i.e., the forwarder in the next authority's program approval entry
                                            let rawSigner: ProgramApproval['forwarder'] | ProgramApproval['approver'] = null;
                                            if (nextAuth) {
                                                const nextApproval = allProgramApprovals.find(
                                                    (pa: ProgramApproval) => pa.authority_id === nextAuth.id && pa.forwarded_by != null
                                                );
                                                rawSigner = nextApproval?.forwarder ?? null;
                                            }
                                            // Fallback: person who approved at this authority level
                                            if (!rawSigner) {
                                                const ownApproval = allProgramApprovals.find(
                                                    (pa: ProgramApproval) => pa.authority_id === auth.id && pa.approved_by != null
                                                );
                                                rawSigner = ownApproval?.approver ?? null;
                                            }

                                            // Date: own record's approved_at (for final approver)
                                            // OR next authority's record created_at (for forwarder — no own record exists)
                                            const ownRecord = allProgramApprovals.find(
                                                (pa: ProgramApproval) => pa.authority_id === auth.id
                                            );
                                            const nextRecord = nextAuth ? allProgramApprovals.find(
                                                (pa: ProgramApproval) => pa.authority_id === nextAuth.id
                                            ) : null;
                                            const approvedAt: string | null =
                                                ownRecord?.approved_at
                                                ?? ownRecord?.updated_at
                                                ?? ownRecord?.created_at
                                                ?? nextRecord?.created_at
                                                ?? null;

                                            // Extract designation from signer's primary role (forwarder has roles)
                                            let designation: string | null = null;
                                            if (rawSigner && 'roles' in rawSigner && rawSigner.roles) {
                                                const primary = rawSigner.roles.find((r: any) => r.pivot?.is_primary);
                                                designation = primary?.name ?? rawSigner.roles[0]?.name ?? null;
                                            }

                                            const signer = rawSigner ? { ...rawSigner, designation } : null;

                                            return (
                                                <SignatureBox key={auth.id} auth={auth} signer={signer} approvedAt={approvedAt} position={sigPosition} />
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {activeTab === 'breakdown' && (
                        <div className="space-y-10">
                            {data.subjects.map((subject) => {
                                const compGroups = getCompGroups(subject);
                                const compGroupKeys = Object.keys(compGroups);
                                const hasWeighted = subjectHasWeighted(subject);
                                const marksColSpan = getSubjectColSpan(subject);
                                const subjectApprovals = data.atw_result_subject_approvals?.filter(a => a.subject_id === subject.id) ?? [];
                                const latestSubjApproval = subjectApprovals[0]; // Already sorted by ID desc in loadData

                                const isFinalApproved = subjectApprovals.some(a => {
                                    const auth = data.atw_result_approval_authorities?.find(aa => aa.id === a.authority_id);
                                    return auth?.is_final && a.status === 'approved';
                                });
                                const isRejected = latestSubjApproval?.status === 'rejected';
                                const isForwarded = !isFinalApproved && !isRejected && subjectApprovals.some(a => a.status === 'approved');

                                const isForwardedFromLower = myAuthority?.is_initial_cadet_approve
                                    ? true
                                    : myAuthority
                                        ? subjectApprovals.some(a => a.authority_id === myAuthority.id) || isFinalApproved
                                        : subjectApprovals.length > 0;

                                // Use computed_status from backend if available, fallback to frontend logic
                                const computedStatus = (subject as any).computed_status;

                                const badgeClass = (() => {
                                    if (computedStatus === 'approved' || isFinalApproved) return 'bg-green-100 text-green-800';
                                    if (computedStatus === 'pending') return 'bg-blue-100 text-blue-800 border border-blue-300';
                                    if (computedStatus === 'waiting' && isForwardedFromLower) return 'bg-yellow-100 text-yellow-800';
                                    if (computedStatus === 'waiting') return 'bg-red-100 text-red-500';
                                    if (computedStatus === 'not_entered') return 'bg-gray-100 text-gray-600';
                                    if (isRejected) return 'bg-red-100 text-red-800';
                                    return 'bg-gray-100 text-gray-500';
                                })();

                                const badgeText = (() => {
                                    if (computedStatus === 'approved' || isFinalApproved) return '✓ Approved';
                                    if (computedStatus === 'pending') return '⏳ Pending for My Approval';
                                    if (computedStatus === 'waiting' && isForwardedFromLower) return '⏳ Pending';
                                    if (computedStatus === 'waiting') return `⏳ Waiting for Result from ${lowerAuthority?.role?.name || lowerAuthority?.user?.name || 'Lower Authority'}`;
                                    if (computedStatus === 'not_entered') return 'Result Not Entered';
                                    if (isRejected) return '✗ Subject Rejected';
                                    return 'Not Forwarded';
                                })();

                                const authorities = chainAuthorities;

                                return (
                                    <div key={subject.id} className="break-inside-avoid">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-3">
                                                {(computedStatus === 'waiting' && !isForwardedFromLower && !isRejected) || computedStatus === 'not_entered' ? (
                                                    <p className="text-sm font-bold uppercase">
                                                        Subject: {subject.name} ({subject.code})
                                                    </p>
                                                ) : (
                                                    <div
                                                        className="flex items-center gap-2 cursor-pointer group"
                                                        onClick={() => {
                                                            const resId = data.cadets.find(c => c.result_ids[subject.id])?.result_ids[subject.id];
                                                            if (resId) handleViewResultDetails(resId);
                                                        }}
                                                        title="View Subject Details"
                                                    >
                                                        <p className="text-sm font-bold uppercase group-hover:text-blue-600 transition-colors">
                                                            Subject: {subject.name} ({subject.code})
                                                        </p>
                                                        <Icon icon="hugeicons:view" className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors no-print" />
                                                    </div>
                                                )}
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badgeClass}`}>
                                                    {badgeText}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold uppercase">Full Mark: {subject.full_mark}</p>
                                        </div>

                                        {(computedStatus === 'waiting' && !isForwardedFromLower && !isRejected) || computedStatus === 'not_entered' ? (
                                            <div className="flex flex-col items-center justify-center py-10 rounded-lg border border-dashed border-yellow-300 bg-yellow-50 gap-2">
                                                <Icon icon="hugeicons:clock-01" className="w-8 h-8 text-yellow-500" />
                                                <p className="text-sm font-semibold text-yellow-700">Waiting for Result</p>
                                                <p className="text-xs text-yellow-600">This subject has not been forwarded from the lower level yet.</p>
                                            </div>
                                        ) : (
                                            <table className="w-full border-collapse border border-black text-sm">
                                                <thead>
                                                    <tr>
                                                        <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">Ser</th>
                                                        <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">BD/No</th>
                                                        <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">Rank</th>
                                                        <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">Name</th>
                                                        <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">Branch</th>
                                                        <th colSpan={marksColSpan} className="border border-black px-2 py-2 text-center">Marks Obtained</th>
                                                        {hasWeighted && (
                                                            <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">
                                                                Total Marks<br />{subject.full_mark}
                                                            </th>
                                                        )}
                                                        <th rowSpan={3} className="border border-black px-2 py-2 text-center align-middle">Status</th>
                                                    </tr>
                                                    <tr>
                                                        {compGroupKeys.map(key => {
                                                            const groupTotal = compGroups[key].reduce((acc, c) => acc + parseFloat(String(c.percentage || 0)), 0);
                                                            return (
                                                                <th key={key} colSpan={compGroups[key].reduce((acc, c) => acc + (isCompDiff(c) ? 2 : 1), 0)} className="border border-black px-2 py-1 text-center capitalize">
                                                                    {getGroupLabel(key)}<br />
                                                                    <span className="">{groupTotal % 1 === 0 ? groupTotal : groupTotal.toFixed(2)}%</span>
                                                                </th>
                                                            );
                                                        })}
                                                    </tr>
                                                    <tr>
                                                        {compGroupKeys.map(key =>
                                                            compGroups[key].map(comp => (
                                                                isCompDiff(comp) ? (
                                                                    <React.Fragment key={comp.id}>
                                                                        <th className="border border-black px-2 py-1 text-center text-xs">{Number(comp.estimate_mark).toFixed(0)}%</th>
                                                                        <th className="border border-black px-2 py-1 text-center text-xs">{Number(comp.percentage).toFixed(0)}%</th>
                                                                    </React.Fragment>
                                                                ) : (
                                                                    <th key={comp.id} className="border border-black px-2 py-1 text-center text-xs">{comp.name} <br />{Number(comp.percentage).toFixed(0)}%</th>
                                                                )
                                                            ))
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(() => {
                                                        const hasResults = data.cadets.some(c => c.result_ids[subject.id] !== undefined);
                                                        if (!hasResults || sortedCadets.length === 0) {
                                                            return (
                                                                <tr>
                                                                    <td colSpan={5 + marksColSpan + (hasWeighted ? 1 : 0) + 1} className="border border-black px-4 py-8 text-center text-gray-500 italic">
                                                                        No result inputted yet
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }
                                                        return sortedCadets.map((cadet, index) => {
                                                            const cadetApprovals = data.atw_result_mark_cadet_approvals?.filter(a => a.cadet_id === cadet.id && a.subject_id === subject.id) ?? [];
                                                            const subTotal = calculateSubjectTotal(cadet, subject);
                                                            return (
                                                                <tr key={cadet.id}>
                                                                    <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                                                                    <td className="border border-black px-2 py-2 text-center">{cadet.bd_no}</td>
                                                                    <td className="border border-black px-2 py-2 text-center">{cadet.rank || "—"}</td>
                                                                    <td className="border border-black px-2 py-2 font-medium">{cadet.name}</td>
                                                                    <td className="border border-black px-2 py-2 text-center">{cadet.branch || "—"}</td>
                                                                    {compGroupKeys.map(key =>
                                                                        compGroups[key].map(comp => {
                                                                            if (comp.is_combined) {
                                                                                return (
                                                                                    <td key={comp.id} className="border border-black px-2 py-2 text-center font-medium">
                                                                                        {getCompMark(cadet, subject.id, comp.id).toFixed(2)}
                                                                                    </td>
                                                                                );
                                                                            }
                                                                            return isCompDiff(comp) ? (
                                                                                <React.Fragment key={comp.id}>
                                                                                    <td className="border border-black px-2 py-2 text-center">{getCompMark(cadet, subject.id, comp.id).toFixed(2)}</td>
                                                                                    <td className="border border-black px-2 py-2 text-center font-medium">{getWeightedCompMark(cadet, subject.id, comp).toFixed(2)}</td>
                                                                                </React.Fragment>
                                                                            ) : (
                                                                                <td key={comp.id} className="border border-black px-2 py-2 text-center">{getCompMark(cadet, subject.id, comp.id).toFixed(2)}</td>
                                                                            );
                                                                        })
                                                                    )}
                                                                    {hasWeighted && (
                                                                        <td className="border border-black px-2 py-2 text-center font-bold">
                                                                            {subTotal !== null ? Math.ceil(subTotal) : "—"}
                                                                        </td>
                                                                    )}
                                                                    <td className="border border-black px-2 py-2">
                                                                        {authorities.length === 0 ? (
                                                                            <span className="text-gray-400 text-xs">—</span>
                                                                        ) : (
                                                                            <div className="flex flex-col gap-1">
                                                                                {authorities.map((auth, idx) => {
                                                                                    const label = auth.role?.name || auth.user?.name || `Step ${idx + 1}`;
                                                                                    const rec = auth.is_initial_cadet_approve
                                                                                        ? (cadetApprovals.find((a: any) => a.authority_id === auth.id) ?? cadetApprovals.find((a: any) => !a.authority_id))
                                                                                        : cadetApprovals.find((a: any) => a.authority_id === auth.id);
                                                                                    const colors: Record<string, string> = {
                                                                                        pending: "bg-yellow-100 text-yellow-800",
                                                                                        approved: "bg-green-100 text-green-800",
                                                                                        rejected: "bg-red-100 text-red-800",
                                                                                    };
                                                                                    if (!rec) {
                                                                                        return (
                                                                                            <div key={auth.id} className="flex items-center gap-1">
                                                                                                <span className="text-[9px] text-gray-500">{label}:</span>
                                                                                                <span className="text-[9px] text-gray-300">—</span>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    const st = rec.status;
                                                                                    return (
                                                                                        <div key={auth.id} className="flex flex-col gap-1 border-b border-gray-100 last:border-0 pb-1 mb-1">
                                                                                            <span className="text-[9px] text-gray-500 font-bold">{label}:</span>
                                                                                            <div className="pl-1">
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${colors[st] ?? ""}`}>
                                                                                                        {st}
                                                                                                    </span>
                                                                                                </div>
                                                                                                {st === 'rejected' && (
                                                                                                    <div className="pl-2 border-l-2 border-red-200 mt-0.5">
                                                                                                        <p className="text-[8px] text-red-600 font-medium italic leading-tight">{rec.rejected_reason}</p>
                                                                                                        <p className="text-[7px] text-gray-400">By {rec.rejectedBy?.name || 'Authority'}</p>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        });
                                                    })()}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>)}
            </div>

            <Modal isOpen={programForwardModal.open} onClose={() => !programForwardModal.loading && setProgramForwardModal({ open: false, loading: false, error: '' })} showCloseButton className="max-w-lg">
                <div className="p-6">
                    <div className="flex flex-col items-center text-center mb-6">
                        <FullLogo />
                        <h2 className="text-lg font-bold text-gray-900 mt-4 uppercase">Forward Program for Approval</h2>
                        <div className="h-1 w-20 bg-green-500 rounded-full mt-2"></div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Course</span>
                                <span className="font-bold text-gray-900">{data?.course_details?.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Semester</span>
                                <span className="font-bold text-gray-900">{data?.semester_details?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Program</span>
                                <span className="font-bold text-gray-900">{data?.program_details?.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Authority flow */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="flex flex-col items-center bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 min-w-[110px]">
                            <span className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold mb-0.5">From (You)</span>
                            <span className="text-xs font-bold text-blue-800 text-center leading-tight">
                                {myAuthority?.role?.name || myAuthority?.user?.name || '—'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                            <Icon icon="hugeicons:arrow-right-02" className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex flex-col items-center bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 min-w-[110px]">
                            <span className="text-[10px] text-green-400 uppercase tracking-wider font-semibold mb-0.5">To</span>
                            <span className="text-xs font-bold text-green-800 text-center leading-tight">
                                {higherAuthority?.role?.name || higherAuthority?.user?.name || '—'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                        <Icon icon="hugeicons:information-circle" className="w-5 h-5 text-blue-600 mt-0.5" />
                        <p className="text-sm text-blue-800 leading-relaxed">
                            Are you sure you want to forward the <strong>entire program result</strong> for final approval? This will mark all forwarded subjects within this program as program-approved.
                        </p>
                    </div>

                    {programForwardModal.error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                            <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
                            {programForwardModal.error}
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            onClick={() => setProgramForwardModal({ open: false, loading: false, error: '' })}
                            disabled={programForwardModal.loading}
                            className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleForwardProgram}
                            disabled={programForwardModal.loading}
                            className="px-8 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2 disabled:opacity-50"
                        >
                            {programForwardModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
                            <Icon icon="hugeicons:share-04" className="w-4 h-4" />
                            Confirm Forward
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={bulkApproveModal.open} onClose={() => !bulkApproveModal.loading && setBulkApproveModal({ open: false, loading: false, error: '' })} showCloseButton className="max-w-lg">
                <div className="p-6">
                    <div className="flex flex-col items-center text-center mb-6">
                        <FullLogo />
                        <h2 className="text-lg font-bold text-gray-900 mt-4 uppercase">Bulk Approve &amp; Forward Program</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {data?.course_details?.name} — {data?.semester_details?.name}
                        </p>
                        <p className="text-sm font-semibold text-gray-700">{data?.program_details?.name}</p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <Icon icon="hugeicons:alert-02" className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-purple-800 text-left space-y-1">
                                <p className="font-semibold">This action will do the following in one step:</p>
                                <ul className="list-disc list-inside space-y-0.5 text-purple-700">
                                    <li>Approve all cadets for all subjects at your authority level</li>
                                    <li>Approve all subjects and forward to {higherAuthority?.role?.name || higherAuthority?.user?.name || 'next level'}</li>
                                    <li>Approve program and forward to {higherAuthority?.role?.name || higherAuthority?.user?.name || 'next level'}</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {bulkApproveModal.error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                            <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
                            {bulkApproveModal.error}
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            onClick={() => setBulkApproveModal({ open: false, loading: false, error: '' })}
                            disabled={bulkApproveModal.loading}
                            className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBulkApproveAndForward}
                            disabled={bulkApproveModal.loading}
                            className="px-8 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center gap-2 disabled:opacity-50"
                        >
                            {bulkApproveModal.loading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
                            <Icon icon="hugeicons:share-04" className="w-4 h-4" />
                            Confirm &amp; Forward to {higherAuthority?.role?.name || higherAuthority?.user?.name || 'Next Level'}
                        </button>
                    </div>
                </div>
            </Modal>

            <PrintTypeModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} onConfirm={confirmPrint} />
        </div>
    );
}
