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
import { useAuth } from "@/context/AuthContext";

interface SubjectComponent {
// ... (rest remains unchanged here, just adding useAuth context inside component) ...

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
    marks: Record<number, Record<number, number>>; // New scoped structure: [subjectId][markId]
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
    approved_by?: number | null;
    forwarded_by?: number | null;
    approved_at?: string | null;
    approver?: {
        id: number;
        name: string;
        rank?: { id: number; name: string; short_name: string } | null;
    } | null;
    forwarder?: {
        id: number;
        name: string;
        rank?: { id: number; name: string; short_name: string } | null;
        roles?: { id: number; name: string; pivot?: { is_primary: boolean } }[];
    } | null;
}

interface SemesterApproval {
    status: 'pending' | 'approved' | 'rejected';
    rejected_reason?: string | null;
    approved_by: number;
    approved_at: string;
    approver?: {
        id: number;
        name: string;
        rank?: { id: number; name: string; short_name: string } | null;
    } | null;
}

interface ApprovalAuthority {
    id: number;
    role?: { id: number; name: string } | null;
    user?: { id: number; name: string; rank?: { id: number; name: string; short_name: string } | null } | null;
    is_initial_cadet_approve?: boolean;
    is_final?: boolean;
    sort?: number;
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
    atw_result_semester_approvals?: SemesterApproval[];
}

type ActiveTab = 'consolidated' | 'breakdown';

export default function AtwCourseSemesterProgramResultsPage() {
    const params = useParams();
    const router = useRouter();
    const can = useCan("/atw/results");
    const courseId = params.courseId as string;
    const semesterId = params.semesterId as string;
    const programId = params.programId as string;

    const { user } = useAuth();

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

    const [rejectedPanelItems, setRejectedPanelItems] = useState<any[]>([]);
    const [rejectedPanelLoading, setRejectedPanelLoading] = useState(false);
    const [rejectedPanelExpanded, setRejectedPanelExpanded] = useState(true);
    const [resubmitLoading, setResubmitLoading] = useState<number | null>(null);
    const [rejectDownModal, setRejectDownModal] = useState<{
        open: boolean; item: any | null; reason: string; loading: boolean; error: string;
    }>({ open: false, item: null, reason: '', loading: false, error: '' });

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

    const loadRejectedPanel = useCallback(async () => {
        try {
            setRejectedPanelLoading(true);
            const items = await atwApprovalService.getRejectedCadetPanel({
                course_id:   Number(courseId),
                semester_id: Number(semesterId),
                program_id:  Number(programId),
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

    const handleResubmit = async (item: any) => {
        try {
            setResubmitLoading(item.cadet_id);
            await atwApprovalService.resubmitRejectedCadet({
                course_id:   item.course_id,
                semester_id: item.semester_id,
                program_id:  item.program_id,
                cadet_id:    item.cadet_id,
                subject_id:  item.subject_id,
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
                course_id:   item.course_id,
                semester_id: item.semester_id,
                program_id:  item.program_id,
                subject_id:  item.subject_id,
                cadet_ids:   [item.cadet_id],
                authority_id: item.my_authority_id,
                status:      'rejected',
                rejected_reason: rejectDownModal.reason,
            });
            setRejectDownModal({ open: false, item: null, reason: '', loading: false, error: '' });
            await loadRejectedPanel();
        } catch (err: any) {
            setRejectDownModal(prev => ({ ...prev, loading: false, error: err?.message || 'Failed to reject.' }));
        }
    };

    const myAuthority = useMemo(() => {
        const authorities = data?.atw_result_approval_authorities ?? [];
        const userRoleIds = (user as any)?.roles?.filter((r: any) => r.pivot?.is_primary).map((r: any) => r.id) ?? [];
        const userId = user?.id;
        return authorities.find((a: any) =>
            (a.user_id && a.user_id === userId) || (a.role_id && userRoleIds.includes(a.role_id))
        ) ?? null;
    }, [data?.atw_result_approval_authorities, user]);

    // Active rejections alert logic based on specific architecture
    const activeRejections = useMemo(() => {
        if (!myAuthority || !data?.atw_result_mark_cadet_approvals || !data?.atw_result_approval_authorities) return [];
        
        // CPTC exclusion: "cptc not show cause their dont have now programm, forwarded"
        const userRoles = (user as any)?.roles || [];
        if (userRoles.some((r: any) => r.slug === 'cptc')) return [];

        const sortedAuths = [...data.atw_result_approval_authorities].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
        const rejections: any[] = [];
        
        const grouped = data.atw_result_mark_cadet_approvals.reduce((acc: any, curr: any) => {
            const key = `${curr.cadet_id}-${curr.subject_id}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(curr);
            return acc;
        }, {});

        Object.entries(grouped).forEach(([key, approvals]: [string, any]) => {
            const [cadetId, subjectId] = key.split('-').map(Number);
            const myRecord = approvals.find((a: any) => a.authority_id === myAuthority.id);
            
            // Rejection flow logic:
            // 1. Higher authority rejected down to me (sets my record to 'pending' with a reason)
            const isRejectedToMe = myRecord?.status === 'pending' && myRecord?.rejected_reason?.toLowerCase().includes('rejected by');
            
            // 2. I rejected it (status is 'rejected') and I'm waiting for the person below
            const iRejectedIt = myRecord?.status === 'rejected';

            // Find authority immediately below me
            const authBelow = sortedAuths.filter(a => (a.sort ?? 0) < (myAuthority.sort ?? 0)).pop();
            const recordBelow = authBelow ? approvals.find((a: any) => 
                (a.authority_id === authBelow.id || (authBelow.is_initial_cadet_approve && !a.authority_id))
            ) : null;

            // Has the person below approved a fix since the last action?
            const isFixedByBelow = recordBelow?.status === 'approved' && 
                                   (!myRecord?.approved_date || new Date(recordBelow.approved_date) > new Date(myRecord.approved_date));

            let showInPanel = false;
            let statusLabel = "";
            let displayReason = myRecord?.rejected_reason || "";

            if (isRejectedToMe) {
                showInPanel = true;
                statusLabel = "Waiting for Fix";
            } else if (iRejectedIt) {
                showInPanel = true;
                if (isFixedByBelow) {
                    statusLabel = "Rejected cadet updated. please check";
                } else {
                    statusLabel = "Waiting for Instructor fix";
                }
            } else if (isFixedByBelow && (myRecord?.status === 'pending' || !myRecord)) {
                // Check if there's a history of rejection in this chain
                const hasRejectionHistory = approvals.some((a: any) => a.status === 'rejected');
                if (hasRejectionHistory) {
                    showInPanel = true;
                    statusLabel = "Rejected cadet updated. please check";
                    displayReason = approvals.find((a: any) => a.status === 'rejected')?.rejected_reason || "";
                }
            }

            if (showInPanel) {
                const cadet = data.cadets?.find((c: any) => c.id === cadetId);
                const subject = data.subjects?.find((s: any) => s.id === subjectId);
                
                rejections.push({
                    cadet,
                    subjectName: subject?.name || 'Subject',
                    subjectId,
                    reason: displayReason,
                    statusLabel,
                    isUpdated: statusLabel.includes("updated"),
                    resultId: cadet?.result_ids?.[subjectId]
                });
            }
        });

        return rejections;
    }, [myAuthority, data, user]);

    const getNextAuthority = useCallback(() => {
        const authorities = [...(data?.atw_result_approval_authorities ?? [])]
            .filter(a => !a.is_initial_cadet_approve)
            .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
        
        if (!myAuthority) return authorities[0] || null;
        
        return authorities.find(a => (a.sort ?? 0) > (myAuthority.sort ?? 0)) || null;
    }, [data?.atw_result_approval_authorities, myAuthority]);


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
    
    const programAlreadyForwardedByMe = (data?.atw_result_program_approvals ?? []).some(
        pa => pa.status === 'pending' && pa.forwarded_by === user?.id
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
                    Back to List
                </button>
                <div className="flex items-center gap-3">
                    {/* Forward Program button */}
                    {programAlreadyApproved ? (
                        <span className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                            <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
                            Program Approved
                        </span>
                    ) : programAlreadyForwardedByMe ? (
                        <span className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Icon icon="hugeicons:share-04" className="w-4 h-4" />
                            Already Forwarded
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

            {/* Rejected Cadet Panel */}
            {(rejectedPanelLoading || rejectedPanelItems.length > 0) && (
                <div className="mb-6 border border-orange-200 rounded-lg overflow-hidden no-print mx-4 mt-4">
                    <button
                        className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 text-orange-800 font-semibold text-sm hover:bg-orange-100 transition-colors"
                        onClick={() => setRejectedPanelExpanded(v => !v)}
                    >
                        <div className="flex items-center gap-2">
                            <Icon icon="hugeicons:alert-02" className="w-5 h-5 text-orange-500" />
                            Rejected Cadets
                            {rejectedPanelItems.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                                    {rejectedPanelItems.length}
                                </span>
                            )}
                        </div>
                        <Icon icon={rejectedPanelExpanded ? 'hugeicons:arrow-up-01' : 'hugeicons:arrow-down-01'} className="w-4 h-4" />
                    </button>
                    {rejectedPanelExpanded && (
                        <div className="overflow-x-auto">
                            {rejectedPanelLoading ? (
                                <div className="flex justify-center py-4">
                                    <Icon icon="hugeicons:fan-01" className="w-6 h-6 animate-spin text-orange-400" />
                                </div>
                            ) : (
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-orange-50 text-orange-900">
                                            <th className="px-3 py-2 border border-orange-200 text-left">Cadet</th>
                                            <th className="px-3 py-2 border border-orange-200 text-left">BD No</th>
                                            <th className="px-3 py-2 border border-orange-200 text-left">Subject</th>
                                            <th className="px-3 py-2 border border-orange-200 text-left">Rejected By</th>
                                            <th className="px-3 py-2 border border-orange-200 text-left">Reason</th>
                                            <th className="px-3 py-2 border border-orange-200 text-left">Status</th>
                                            <th className="px-3 py-2 border border-orange-200 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rejectedPanelItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-orange-50/40">
                                                <td className="px-3 py-2 border border-orange-100 font-medium">{item.cadet_name}</td>
                                                <td className="px-3 py-2 border border-orange-100 font-mono text-xs">{item.cadet_bd_no}</td>
                                                <td className="px-3 py-2 border border-orange-100">
                                                    <span className="font-medium">{item.subject_name}</span>
                                                    {item.subject_code && <span className="text-xs text-gray-400 ml-1">({item.subject_code})</span>}
                                                </td>
                                                <td className="px-3 py-2 border border-orange-100 text-red-700 font-medium">{item.rejected_by}</td>
                                                <td className="px-3 py-2 border border-orange-100 text-gray-600 max-w-[200px] truncate" title={item.rejected_reason || ''}>{item.rejected_reason || '—'}</td>
                                                <td className="px-3 py-2 border border-orange-100">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        item.state === 'updated_pending_review' || item.state === 'instructor_updated'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {item.message}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 border border-orange-100 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {item.result_id && (
                                                            <button
                                                                onClick={() => router.push(`/atw/results/${item.result_id}`)}
                                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                                title="View Result"
                                                            >
                                                                <Icon icon="hugeicons:view" className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {item.can_resubmit && (
                                                            <button
                                                                onClick={() => handleResubmit(item)}
                                                                disabled={resubmitLoading === item.cadet_id}
                                                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                                            >
                                                                {resubmitLoading === item.cadet_id && <Icon icon="hugeicons:fan-01" className="w-3 h-3 animate-spin" />}
                                                                Re-submit
                                                            </button>
                                                        )}
                                                        {item.can_reject_down && (
                                                            <button
                                                                onClick={() => setRejectDownModal({ open: true, item, reason: '', loading: false, error: '' })}
                                                                className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-1"
                                                                title="Reject to lower authority"
                                                            >
                                                                <Icon icon="hugeicons:arrow-down-01" className="w-3 h-3" />
                                                                Reject ↓
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            )}

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
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle">Percentile</th>
                                        <th rowSpan={4} className="border border-black p-2 text-center cursor-pointer hover:bg-gray-100 no-print" onClick={() => handleSort('position')}>
                                            <div className="flex items-center justify-center gap-1">Position <SortIcon columnKey="position" /></div>
                                        </th>
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle only-print">Position</th>
                                        <th rowSpan={4} className="border border-black p-2 text-center align-middle">Remarks</th>
                                    </tr>
                                    <tr>
                                        {data.subjects.map((_, idx) => (
                                            <th key={idx} className="border border-black p-1 text-center">{idx + 1}</th>
                                        ))}
                                    </tr>
                                    <tr>
                                        {data.subjects.map((sub, idx) => {
                                            const resultId = data.cadets.find(c => c.result_ids[sub.mapping_id])?.result_ids[sub.mapping_id];
                                            const canView = can('view');
                                            return (
                                                <th
                                                    key={idx}
                                                    className={`border border-black p-2 text-center text-xs ${resultId && canView ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                                                    onClick={() => canView && resultId && handleViewResultDetails(resultId)}
                                                    title={resultId && canView ? "Click to view subject result details" : ""}
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

                            <div className="mt-12 mb-6 break-inside-avoid">
                                {(() => {
                                    const authorities = [...(data.atw_result_approval_authorities || [])].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
                                    const formalAuthorities = authorities.filter(a => !a.is_initial_cadet_approve);

                                    const preparedByAuth = formalAuthorities[0];
                                    const checkedByAuth = formalAuthorities[1];
                                    const finalAuth = formalAuthorities.find(a => a.is_final) || formalAuthorities[formalAuthorities.length - 1];

                                    const programApprovals = data.atw_result_program_approvals || [];
                                    // The very first action on a program is forwarding it to the next authority.
                                    const preparationRecord = programApprovals.length > 0 ? programApprovals[0] : null;

                                    // The person who actually prepared it is the forwarder of the first record
                                    const preparedByActualUser = preparationRecord?.forwarder;

                                    // The person who checked it is the approver of the first record
                                    const checkedByActualUser = preparationRecord?.approver;

                                    // The final approver is the one in semester approval
                                    const semesterApproval = data.atw_result_semester_approvals?.find(sa => sa.status === 'approved');
                                    const approvedByActualUser = semesterApproval?.approver;

                                    const renderSig = (title: string, expectedAuth: ApprovalAuthority | undefined, actualUser: any) => {
                                        const displayName = actualUser?.name || expectedAuth?.user?.name || "—";
                                        const displayRank = actualUser?.rank?.short_name || expectedAuth?.user?.rank?.short_name || "—";
                                        const displayRole = actualUser?.roles?.find((r:any) => r.pivot?.is_primary)?.name || expectedAuth?.role?.name || "—";

                                        const isSigned = !!actualUser;

                                        return (
                                            <div className="flex flex-col items-start min-w-[200px]">
                                                <div className="mt-16 text-left w-full">
                                                    <p className="font-bold uppercase text-[11px] text-gray-900 mb-3">{title}</p>
                                                    {expectedAuth || actualUser ? (
                                                        <div className="text-[11px] space-y-1 transition-all">
                                                            {isSigned ? (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="italic text-green-600 font-bold mb-1">Digitally Signed</div>
                                                                    <p className="font-bold text-gray-900">{displayName}</p>
                                                                    <p className="text-gray-800">{displayRank}</p>
                                                                    <p className="font-bold text-gray-900 uppercase tracking-tight">{displayRole}</p>
                                                                </div>
                                                            ) : (
                                                                <div className="h-24"></div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="h-24"></div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    };

                                    return (
                                        <div className="flex justify-between items-start w-full">
                                            {renderSig("Prepared & Checked By", preparedByAuth, preparedByActualUser)}
                                            {renderSig("Approved By", checkedByAuth, checkedByActualUser)}
                                        </div>
                                    );
                                })()}
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
                                            <div 
                                                className={`flex items-center gap-2 ${data.cadets.find(c => c.result_ids[subject.mapping_id])?.result_ids[subject.mapping_id] && can('view') ? 'cursor-pointer group' : ''}`}
                                                onClick={() => {
                                                    const resultId = data.cadets.find(c => c.result_ids[subject.mapping_id])?.result_ids[subject.mapping_id];
                                                    if (resultId && can('view')) handleViewResultDetails(resultId);
                                                }}
                                            >
                                                <p className="text-sm">
                                                    <span className="font-bold text-gray-900 uppercase mr-2">Subject</span>
                                                    <span className={`border-b border-dashed border-black ${data.cadets.find(c => c.result_ids[subject.mapping_id])?.result_ids[subject.mapping_id] && can('view') ? 'group-hover:text-blue-600 group-hover:border-blue-600 transition-colors' : ''}`}>
                                                        : {subject.name} ({subject.code})
                                                    </span>
                                                </p>
                                                {data.cadets.find(c => c.result_ids[subject.mapping_id])?.result_ids[subject.mapping_id] && can('view') && (
                                                    <Icon icon="hugeicons:view" className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors no-print" />
                                                )}
                                            </div>
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
                    <div>Generated on: Mar 2026</div>
                </div>
            </div>

            {/* Forward Program confirm modal */}
            <Modal
                isOpen={programForwardModal.open}
                onClose={() => !programForwardModal.loading && setProgramForwardModal({ open: false, loading: false, error: '' })}
                showCloseButton
                className="max-w-lg"
            >
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
