"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Icon } from "@iconify/react";
import { useParams, useRouter } from "next/navigation";
import { ftw11sqnGroundExaminationMarkService } from "@/libs/services/ftw11sqnGroundExaminationMarkService";
import { Ftw11sqnGroundExaminationMark } from "@/libs/types/ftw11sqnExamination";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

interface PhaseData {
    phase_details: {
        id: number;
        ground_shortname: string;
        ground_full_name: string;
    };
    exercises: Ftw11sqnGroundExaminationMark[];
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

export default function GroundExamination11SqnCadetView() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const courseId = params.courseId as string;
    const semesterId = params.semesterId as string;
    const cadetId = params.cadetId as string;

    const [cadetData, setCadetData] = useState<CadetViewData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Delete modal state
    const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
    const [deletingMark, setDeletingMark] = useState<Ftw11sqnGroundExaminationMark | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

    const fetchCadetData = useCallback(async () => {
        if (!cadetId || !courseId || !semesterId) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch all marks for this cadet
            const response = await ftw11sqnGroundExaminationMarkService.getAllMarks({
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
                const phaseId = mark.syllabus?.id || 0;
                if (!phaseMap.has(phaseId)) {
                    phaseMap.set(phaseId, {
                        phase_details: {
                            id: phaseId,
                            ground_shortname: mark.syllabus?.ground_shortname || "",
                            ground_full_name: mark.syllabus?.ground_full_name || "",
                        },
                        exercises: [],
                    });
                }
                phaseMap.get(phaseId)!.exercises.push(mark);
            });

            const sortedPhases = Array.from(phaseMap.values()).sort((a, b) => a.phase_details.id - b.phase_details.id);

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

    const handleBack = () => {
        router.push(`/ftw/11sqn/results/ground/results/course/${courseId}/semester/${semesterId}`);
    };

    const handleDeleteExamination = async () => {
        if (!deletingMark) return;

        setDeleteLoading(true);
        try {
            await ftw11sqnGroundExaminationMarkService.deleteMark(deletingMark.id);
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

    const handleEditMark = (mark: Ftw11sqnGroundExaminationMark) => {
        router.push(`/ftw/11sqn/results/ground/results/${mark.id}/edit`);
    };

    const handleDeleteMark = (mark: Ftw11sqnGroundExaminationMark) => {
        setDeletingMark(mark);
        setDeleteModalVisible(true);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="w-full min-h-[60vh] flex items-center justify-center">
                <div>
                    <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
                </div>
            </div>
        );
    }

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

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
            <div className="relative text-center mb-8">
                <div className="flex justify-center mb-4"><FullLogo /></div>
                <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 11SQN Ground Examination Results</h2>

                <div className="absolute top-3 left-3">
                    <button
                        onClick={handleBack}
                        className="flex items-center space-x-2 px-4 py-2 bg-transparent hover:bg-gray-100 border border-gray-200 text-black rounded-md transition-colors"
                        title="Back"
                    >
                        <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                </div>

                <div className="absolute top-3 right-3 flex gap-2 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex items-center space-x-2 px-4 py-2 bg-transparent hover:bg-gray-100 border border-gray-200 text-black rounded-md transition-colors"
                        title="Print Report"
                    >
                        <Icon icon="hugeicons:printer" className="w-4 h-4" />
                        <span>Print</span>
                    </button>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <h3 className="text-lg font-bold text-gray-900 uppercase mb-2">Cadet Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="font-semibold">Name:</span> {cadetData.cadet_details.name}</div>
                    <div><span className="font-semibold">BD No:</span> {cadetData.cadet_details.bdno}</div>
                    <div><span className="font-semibold">Rank:</span> {cadetData.cadet_details.rank?.name || "Officer Cadet"}</div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-black text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 border border-black uppercase">Phase</th>
                            <th className="px-4 py-2 border border-black uppercase">Exercise</th>
                            <th className="px-4 py-2 border border-black uppercase">Date</th>
                            <th className="px-4 py-2 border border-black uppercase text-center">Mark</th>
                            <th className="px-4 py-2 border border-black uppercase">Instructor</th>
                            <th className="px-4 py-2 border border-black uppercase">Remark</th>
                            <th className="px-4 py-2 border border-black uppercase text-center print:hidden">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cadetData.phases.map((phase) => (
                            <Fragment key={phase.phase_details.id}>
                                {phase.exercises.map((mark, idx) => (
                                    <tr key={mark.id} className="hover:bg-gray-50">
                                        {idx === 0 && (
                                            <td className="px-4 py-2 border border-black font-bold align-middle text-center" rowSpan={phase.exercises.length}>
                                                {phase.phase_details.ground_shortname}
                                            </td>
                                        )}
                                        <td className="px-4 py-2 border border-black">{mark.exercise?.exercise_name || mark.exercise?.exercise_shortname}</td>
                                        <td className="px-4 py-2 border border-black text-center">{mark.participate_date || "-"}</td>
                                        <td className="px-4 py-2 border border-black text-center font-bold text-blue-700">{mark.achieved_mark}</td>
                                        <td className="px-4 py-2 border border-black">{mark.instructor?.name || "-"}</td>
                                        <td className="px-4 py-2 border border-black">{mark.remark || "-"}</td>
                                        <td className="px-4 py-2 border border-black text-center print:hidden">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleEditMark(mark)} className="text-blue-600 hover:text-blue-800"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteMark(mark)} className="text-red-600 hover:text-red-800"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmationModal
                isOpen={deleteModalVisible}
                onClose={() => {
                    setDeleteModalVisible(false);
                    setDeletingMark(null);
                }}
                onConfirm={handleDeleteExamination}
                title="Delete Ground Examination"
                message={`Are you sure you want to delete this examination mark? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                loading={deleteLoading}
                variant="danger"
            />
        </div>
    );
}
