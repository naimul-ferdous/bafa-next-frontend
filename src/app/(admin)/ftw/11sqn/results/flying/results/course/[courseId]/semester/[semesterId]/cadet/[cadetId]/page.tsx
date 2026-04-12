"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useParams, useRouter } from "next/navigation";
import { ftw11sqnFlyingExaminationMarkService } from "@/libs/services/ftw11sqnFlyingExaminationMarkService";
import { ftw11sqnFlyingExamCadetApprovalStatusService } from "@/libs/services/ftw11sqnFlyingExamCadetApprovalStatusService";
import { ftw11sqnFlyingExamApprovalProcessService } from "@/libs/services/ftw11sqnFlyingExamApprovalProcessService";
import { Ftw11sqnFlyingExaminationMark } from "@/libs/types/ftw11sqnExamination";
import type { ApprovalProcess, CadetApprovalStatus } from "@/libs/types/approval";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import SummaryTab from "./components/SummaryTab";
import GraphTab from "./components/GraphTab";
import SingleCadetApprovalModal from "./components/SingleCadetApprovalModal";

// Extended user type for approval workflow
interface UserWithRole {
  id: number;
  name?: string;
  role_id?: number;
}

interface PhaseData {
    phase_details: {
        id: number;
        phase_shortname: string;
        phase_fullname: string;
        phase_sort?: number;
        phase_symbol?: string;
    };
    exercises: Ftw11sqnFlyingExaminationMark[];
}

interface CadetViewData {
    cadet_details: {
        id: number;
        name: string;
        bdno: string;
        rank?: { id: number; name: string };
        course_id: number;
        semester_id: number;
    };
    phases: PhaseData[];
}

export default function FlyingExamination11SqnCadetView() {
    const params = useParams();
    const router = useRouter();
    const { user: authUser } = useAuth();
    const user = authUser as UserWithRole | null;

    const courseId = params.courseId as string;
    const semesterId = params.semesterId as string;
    const cadetId = params.cadetId as string;

    const [cadetData, setCadetData] = useState<CadetViewData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTable, setActiveTable] = useState<"summary" | "graphs">("summary");

    // Delete modal state
    const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
    const [deletingMark, setDeletingMark] = useState<Ftw11sqnFlyingExaminationMark | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

    // Approval state
    const [cadetApprovalStatuses, setCadetApprovalStatuses] = useState<CadetApprovalStatus[]>([]);
    const [approvalProcesses, setApprovalProcesses] = useState<ApprovalProcess[]>([]);
    const [currentApprovalProcess, setCurrentApprovalProcess] = useState<ApprovalProcess | null>(null);
    const [nextApprovalProcess, setNextApprovalProcess] = useState<ApprovalProcess | null>(null);
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [approvalModalMode, setApprovalModalMode] = useState<"approve" | "reject">("approve");
    const [canApprove, setCanApprove] = useState(false);

    // Helper function to calculate phase rowspans
    const calculatePhaseRowspans = (phases: PhaseData[]) => {
        if (!phases || phases.length === 0)
            return { rowspans: {}, shouldRenderPhase: {}, phaseAverages: {}, totalAverage: 0 };

        const rowspans: { [key: number]: number } = {};
        const shouldRenderPhase: { [key: number]: boolean } = {};
        const phaseAverages: { [key: number]: number } = {};

        // Calculate total average for all missions
        const allMarks: number[] = [];
        phases.forEach((phase) => {
            phase.exercises.forEach((exercise) => {
                if (exercise.achieved_mark !== null && exercise.achieved_mark !== undefined) {
                    allMarks.push(parseFloat(exercise.achieved_mark.toString() || "0"));
                }
            });
        });
        const validTotalMarks = allMarks.filter((mark) => !isNaN(mark) && mark > 0);
        const totalSum = validTotalMarks.reduce((sum, mark) => sum + mark, 0);
        const totalAverage = validTotalMarks.length > 0 ? totalSum / validTotalMarks.length : 0;

        // Calculate phase statistics and rowspans
        let missionIndex = 0;
        phases.forEach((phase) => {
            const phaseMarks = phase.exercises
                .map((exercise) => parseFloat(exercise.achieved_mark?.toString() || "0"))
                .filter((mark) => !isNaN(mark) && mark > 0);

            const phaseAverage =
                phaseMarks.length > 0 ? phaseMarks.reduce((sum, mark) => sum + mark, 0) / phaseMarks.length : 0;

            const exerciseCount = phase.exercises.length;

            // Mark the first exercise in each phase
            rowspans[missionIndex] = exerciseCount;
            shouldRenderPhase[missionIndex] = true;
            phaseAverages[missionIndex] = phaseAverage;

            // Mark subsequent exercises in the same phase
            for (let i = 1; i < exerciseCount; i++) {
                shouldRenderPhase[missionIndex + i] = false;
            }

            missionIndex += exerciseCount;
        });

        return { rowspans, shouldRenderPhase, phaseAverages, totalAverage };
    };

    const fetchCadetData = useCallback(async () => {
        if (!cadetId || !courseId || !semesterId) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch all marks for this cadet
            const response = await ftw11sqnFlyingExaminationMarkService.getAllMarks({
                cadet_id: parseInt(cadetId),
                course_id: parseInt(courseId),
                semester_id: parseInt(semesterId),
                per_page: 1000,
            });

            if (response.data.length === 0) {
                setCadetData(null);
                setError("No examination marks found for this cadet");
                return;
            }

            // Group marks by phase (syllabus)
            const phaseMap = new Map<number, PhaseData>();
            const firstMark = response.data[0];

            response.data.forEach((mark) => {
                const phaseId = mark.ftw_11sqn_flying_syllabus_id;
                if (!phaseMap.has(phaseId)) {
                    phaseMap.set(phaseId, {
                        phase_details: {
                            id: phaseId,
                            phase_shortname: mark.syllabus?.phase_shortname || "",
                            phase_fullname: mark.syllabus?.phase_full_name || "",
                            phase_sort: 0,
                            phase_symbol: mark.syllabus?.phase_shortname || "",
                        },
                        exercises: [],
                    });
                }
                phaseMap.get(phaseId)!.exercises.push(mark);
            });

            // Sort phases by syllabus id (ascending)
            const sortedPhases = Array.from(phaseMap.values()).sort(
                (a, b) => a.phase_details.id - b.phase_details.id
            );

            // Sort exercises within each phase by exercise id (ascending)
            sortedPhases.forEach((phase) => {
                phase.exercises.sort((a, b) => 
                    (a.exercise?.id || a.ftw_11sqn_flying_syllabus_exercise_id || 0) - 
                    (b.exercise?.id || b.ftw_11sqn_flying_syllabus_exercise_id || 0)
                );
            });

            const cadetViewData: CadetViewData = {
                cadet_details: {
                    id: firstMark.cadet?.id || parseInt(cadetId),
                    name: firstMark.cadet?.name || "",
                    bdno: firstMark.cadet?.bd_no || firstMark.cadet?.cadet_number || firstMark.cadet?.bdno || "",
                    rank: firstMark.cadet?.rank,
                    course_id: parseInt(courseId),
                    semester_id: parseInt(semesterId),
                },
                phases: sortedPhases,
            };

            setCadetData(cadetViewData);
        } catch (err: unknown) {
            console.error("Error fetching cadet data:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch cadet data");
        } finally {
            setLoading(false);
        }
    }, [cadetId, courseId, semesterId]);

    useEffect(() => {
        fetchCadetData();
    }, [fetchCadetData]);

    // Fetch approval data
    const fetchApprovalData = useCallback(async () => {
        if (!cadetId || !courseId || !semesterId) return;

        try {
            // Fetch all approval processes
            const processResult = await ftw11sqnFlyingExamApprovalProcessService.getAll({ allData: true });
            if (processResult?.data && Array.isArray(processResult.data)) {
                const sortedProcesses = processResult.data.sort(
                    (a: ApprovalProcess, b: ApprovalProcess) => parseInt(a.status_code) - parseInt(b.status_code)
                );
                setApprovalProcesses(sortedProcesses);

                // Find current user's approval process
                if (user?.role_id) {
                    const userProcess = sortedProcesses.find((p: ApprovalProcess) => p.role_id === user.role_id);
                    if (userProcess) {
                        setCurrentApprovalProcess(userProcess);
                        const currentIndex = sortedProcesses.findIndex((p: ApprovalProcess) => p.id === userProcess.id);
                        if (currentIndex !== -1 && currentIndex < sortedProcesses.length - 1) {
                            setNextApprovalProcess(sortedProcesses[currentIndex + 1]);
                        }
                    }
                }
            }

            // Fetch cadet approval statuses
            const statusResult = await ftw11sqnFlyingExamCadetApprovalStatusService.getByCadet(parseInt(cadetId), {
                course_id: parseInt(courseId),
                semester_id: parseInt(semesterId),
                allData: true,
            });
            if (statusResult?.data && Array.isArray(statusResult.data)) {
                setCadetApprovalStatuses(statusResult.data);
            }
        } catch (err) {
            console.error("Error fetching approval data:", err);
        }
    }, [cadetId, courseId, semesterId, user?.role_id]);

    useEffect(() => {
        fetchApprovalData();
    }, [fetchApprovalData]);

    // Check if user can approve this cadet
    useEffect(() => {
        if (!currentApprovalProcess || !user?.role_id) {
            setCanApprove(false);
            return;
        }

        // Check if cadet has already been approved at the current level
        const alreadyApprovedAtCurrentLevel = cadetApprovalStatuses.some(
            (status) => status.progress_id === currentApprovalProcess.id && status.approval_status === "approved"
        );

        // Check if cadet is ready for approval at current level
        // (either no prior approvals or previous level has approved)
        const currentIndex = approvalProcesses.findIndex((p) => p.id === currentApprovalProcess.id);
        let readyForApproval = true;

        if (currentIndex > 0) {
            const previousProcess = approvalProcesses[currentIndex - 1];
            const previousApproved = cadetApprovalStatuses.some(
                (status) => status.progress_id === previousProcess.id && status.approval_status === "approved"
            );
            readyForApproval = previousApproved;
        }

        setCanApprove(!alreadyApprovedAtCurrentLevel && readyForApproval);
    }, [currentApprovalProcess, cadetApprovalStatuses, approvalProcesses, user?.role_id]);

    const handleOpenApproveModal = () => {
        setApprovalModalMode("approve");
        setApprovalModalOpen(true);
    };

    const handleOpenRejectModal = () => {
        setApprovalModalMode("reject");
        setApprovalModalOpen(true);
    };

    const handleApprovalSuccess = () => {
        fetchApprovalData();
    };

    // Get the latest approval status for this cadet
    const getLatestApprovalStatus = () => {
        if (cadetApprovalStatuses.length === 0) return null;
        return cadetApprovalStatuses.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
        })[0];
    };

    const latestStatus = getLatestApprovalStatus();
    const latestProcess = latestStatus ? approvalProcesses.find((p) => p.id === latestStatus.progress_id) : null;

    const handleBack = () => {
        router.push(`/ftw/11sqn/results/flying/results/course/${courseId}/semester/${semesterId}`);
    };

    const handleDeleteExamination = async () => {
        if (!deletingMark) return;

        setDeleteLoading(true);
        try {
            await ftw11sqnFlyingExaminationMarkService.deleteMark(deletingMark.id);
            setDeleteModalVisible(false);
            setDeletingMark(null);
            fetchCadetData();
        } catch (err: unknown) {
            console.error("Error deleting examination:", err);
            alert(err instanceof Error ? err.message : "Failed to delete examination");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleEditMark = (mark: Ftw11sqnFlyingExaminationMark) => {
        router.push(`/ftw/11sqn/results/flying/results/${mark.id}/edit`);
    };

    const handleDeleteMark = (mark: Ftw11sqnFlyingExaminationMark) => {
        setDeletingMark(mark);
        setDeleteModalVisible(true);
    };

    const handlePrint = () => {
        window.print();
    };

    // Loading state
    if (loading) {
        return (
            <div className="w-full min-h-[60vh] flex items-center justify-center">
                <div>
                    <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
                </div>
            </div>
        );
    }

    // Error state
    if (error || !cadetData) {
        return (
            <div className="max-w-full mx-auto px-4 py-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <Icon icon="hugeicons:alert-circle" className="w-6 h-6 text-red-500 mr-3" />
                        <h3 className="text-lg font-semibold text-red-800">Error!</h3>
                    </div>
                    <p className="text-red-700 mb-4">{error || "Cadet data not found"}</p>
                    <div className="flex gap-3">
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            onClick={() => fetchCadetData()}
                        >
                            Try Again
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            onClick={handleBack}
                        >
                            Back to List
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Prepare data for display
    const sortedPhases =
        cadetData.phases?.sort(
            (a, b) => (a.phase_details?.phase_sort || 0) - (b.phase_details?.phase_sort || 0)
        ) || [];

    const allMissions =
        sortedPhases.flatMap((phase) =>
            phase.exercises.map((exercise) => ({
                ...exercise,
                phase_details: phase.phase_details,
            }))
        ) || [];

    const { rowspans, shouldRenderPhase, phaseAverages, totalAverage } = calculatePhaseRowspans(sortedPhases);

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-6">
            <div className="relative text-center mb-8">
                <div className="flex justify-center mb-4"><FullLogo /></div>
                <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 11SQN Flying Examination Results</h2>

                {/* Back Button */}
                <div className="absolute top-0 left-0 flex">
                    <button
                        onClick={handleBack}
                        className="flex items-center space-x-2 px-4 py-2 bg-transparent hover:bg-gray-100 border border-gray-200 text-black rounded-md transition-colors"
                        title="Back"
                    >
                        <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-0 right-0 flex gap-2 print:hidden">
                    {/* Approve Button */}
                    {currentApprovalProcess && canApprove && (
                        <button
                            onClick={handleOpenApproveModal}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                            title="Approve Cadet"
                        >
                            <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                            <span>Approve</span>
                        </button>
                    )}

                    {/* Already Approved Badge */}
                    {currentApprovalProcess && !canApprove && cadetApprovalStatuses.some(
                        (s) => s.progress_id === currentApprovalProcess.id && s.approval_status === "approved"
                    ) && (
                        <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-md">
                            <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                            <span className="text-sm font-medium">Approved</span>
                        </div>
                    )}

                    {/* Reject Button */}
                    {currentApprovalProcess && canApprove && (
                        <button
                            onClick={handleOpenRejectModal}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                            title="Reject Cadet"
                        >
                            <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                            <span>Reject</span>
                        </button>
                    )}

                    {/* Print Button */}
                    <button
                        onClick={handlePrint}
                        className="flex items-center space-x-2 px-4 py-2 bg-transparent hover:bg-gray-100 border border-gray-200 text-black rounded-md transition-colors"
                        title="Print Current Report"
                    >
                        <Icon icon="hugeicons:printer" className="w-4 h-4" />
                        <span>Print</span>
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="print:hidden w-full flex justify-center items-center mb-6">
                <nav className="flex space-x-2 border border-gray-200 bg-gray-100 rounded-full p-1">
                    <button
                        onClick={() => setActiveTable("summary")}
                        className={`py-1 px-4 font-medium text-sm rounded-full transition-colors ${activeTable === "summary"
                                ? "bg-blue-500 text-white"
                                : "bg-transparent text-black hover:bg-gray-200"
                            }`}
                    >
                        Summary
                    </button>
                    <button
                        onClick={() => setActiveTable("graphs")}
                        className={`py-1 px-4 font-medium text-sm rounded-full transition-colors ${activeTable === "graphs"
                                ? "bg-blue-500 text-white"
                                : "bg-transparent text-black hover:bg-gray-200"
                            }`}
                    >
                        Graphs
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTable === "summary" && (
                <SummaryTab
                    allMissions={allMissions}
                    shouldRenderPhase={shouldRenderPhase}
                    rowspans={rowspans}
                    phaseAverages={phaseAverages}
                    dailyAverage={totalAverage}
                    onEdit={handleEditMark}
                    onDelete={handleDeleteMark}
                    sortedPhases={sortedPhases}
                />
            )}

            {activeTable === "graphs" && <GraphTab cadetData={cadetData} />}

            {allMissions.length === 0 && activeTable === "summary" && (
                <div className="text-center py-8">
                    <p className="text-gray-500">No mission examinations found for this cadet.</p>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalVisible}
                onClose={() => {
                    setDeleteModalVisible(false);
                    setDeletingMark(null);
                }}
                onConfirm={handleDeleteExamination}
                title="Delete Flying Examination"
                message={`Are you sure you want to delete this examination mark? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                loading={deleteLoading}
                variant="danger"
            />

            {/* Single Cadet Approval Modal */}
            {cadetData && (
                <SingleCadetApprovalModal
                    open={approvalModalOpen}
                    onClose={() => setApprovalModalOpen(false)}
                    cadet={{
                        id: cadetData.cadet_details.id,
                        name: cadetData.cadet_details.name,
                        bdno: cadetData.cadet_details.bdno,
                        rank: cadetData.cadet_details.rank,
                    }}
                    courseId={parseInt(courseId)}
                    semesterId={parseInt(semesterId)}
                    approvalProcess={currentApprovalProcess}
                    nextLevelProcess={nextApprovalProcess}
                    onSuccess={handleApprovalSuccess}
                    mode={approvalModalMode}
                />
            )}
        </div>
    );
}
