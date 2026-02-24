"use client";

import FullLogo from "@/components/ui/fulllogo";
import { useState, useEffect } from "react";


export default function Ftw11sqnGroundExaminationMarksCadetPage () {
    const { cadetId } = useParams();
    const navigate = useNavigate();
    const [cadetData, setCadetData] = useState(null);
    const [groundSyllabuses, setGroundSyllabuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedExamination, setSelectedExamination] = useState(null);
    const [selectedExaminationId, setSelectedExaminationId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        semester_id: '',
        phase_id: '',
        test_id: '',
        exam_type: '',
        status: '',
        date_from: '',
        date_to: ''
    });

    const fetchGroundSyllabuses = async () => {
        try {
            const result = await ftwGroundSyllabus11SqnApi.getAll();
            const syllabusesData = result.data || [];
            setGroundSyllabuses(syllabusesData);
        } catch (err) {
            console.error('Error fetching ground syllabuses:', err);
        }
    };

    const fetchCadetData = async (cadetId, appliedFilters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await groundExamination11SqnApi.getByCadetId(cadetId, appliedFilters);
            setCadetData(response.data);
        } catch (error) {
            console.error('Error fetching cadet data:', error);
            setError(error.response?.data?.message || 'Failed to fetch cadet examination data');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleEditExamination = (examination) => {
        setSelectedExamination(examination);
        setEditModalVisible(true);
    };

    const handleSaveExamination = async (data) => {
        if (!selectedExamination) return;

        setEditLoading(true);
        try {
            await groundExamination11SqnApi.update(selectedExamination.id, data);
            toast.success('Examination updated successfully');
            // Refresh cadet data after update
            if (cadetId) {
                const activeFilters = Object.fromEntries(
                    Object.entries(filters).filter(([key, value]) => value !== '')
                );
                fetchCadetData(parseInt(cadetId), activeFilters);
            }
            setEditModalVisible(false);
            setSelectedExamination(null);
        } catch (error) {
            console.error('Error updating examination:', error);
            toast.error(error.response?.data?.message || 'Failed to update examination');
        } finally {
            setEditLoading(false);
        }
    };

    const showDeleteModal = (examinationId) => {
        setSelectedExaminationId(examinationId);
        setDeleteModalVisible(true);
    };

    const handleDeleteExamination = async () => {
        if (!selectedExaminationId) return;

        setDeleteLoading(true);
        try {
            await groundExamination11SqnApi.delete(selectedExaminationId);
            // Refresh cadet data after deletion
            if (cadetId) {
                const activeFilters = Object.fromEntries(
                    Object.entries(filters).filter(([key, value]) => value !== '')
                );
                fetchCadetData(parseInt(cadetId), activeFilters);
            }
            setDeleteModalVisible(false);
            setSelectedExaminationId(null);
        } catch (error) {
            console.error('Error deleting examination:', error);
            setError(error.response?.data?.message || 'Failed to delete examination');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Helper function to calculate phase rowspans for grouped phases
    const calculatePhaseRowspans = (examinations) => {
        if (!examinations || examinations.length === 0) return { rowspans: {}, shouldRenderPhase: {}, phaseAverages: {}, totalAverage: 0 };

        const rowspans = {};
        const shouldRenderPhase = {};
        const phaseAverages = {};

        // Sort examinations by phase_id first to group them together
        const sortedExaminations = [...examinations].sort((a, b) => {
            if (a.phase.id !== b.phase.id) {
                return a.phase.id - b.phase.id;
            }
            // If same phase, maintain original order by using original index
            return examinations.indexOf(a) - examinations.indexOf(b);
        });

        // Calculate total average for all examinations
        const allMarks = examinations.map(exam => parseFloat(exam.exam_mark?.toString() || '0'));
        const validTotalMarks = allMarks.filter(mark => !isNaN(mark) && mark > 0);
        const totalSum = validTotalMarks.reduce((sum, mark) => sum + mark, 0);
        const totalAverage = validTotalMarks.length > 0 ? totalSum / validTotalMarks.length : 0;

        // Count consecutive same phases and mark first occurrence
        for (let i = 0; i < sortedExaminations.length; i++) {
            const originalIndex = examinations.indexOf(sortedExaminations[i]);
            const currentPhaseId = sortedExaminations[i].phase.id;

            // Check if this is the first occurrence of this phase in the sorted order
            if (i === 0 || sortedExaminations[i - 1].phase.id !== currentPhaseId) {
                // Count how many consecutive exams have the same phase
                let count = 1;
                const phaseMarks = [parseFloat(sortedExaminations[i].exam_mark?.toString() || '0')];

                for (let j = i + 1; j < sortedExaminations.length; j++) {
                    if (sortedExaminations[j].phase.id === currentPhaseId) {
                        count++;
                        phaseMarks.push(parseFloat(sortedExaminations[j].exam_mark?.toString() || '0'));
                    } else {
                        break;
                    }
                }

                // Calculate phase average
                const totalMarks = phaseMarks.reduce((sum, mark) => sum + (isNaN(mark) ? 0 : mark), 0);
                const validMarks = phaseMarks.filter(mark => !isNaN(mark) && mark > 0);
                const average = validMarks.length > 0 ? totalMarks / validMarks.length : 0;

                rowspans[originalIndex] = count;
                shouldRenderPhase[originalIndex] = true;
                phaseAverages[originalIndex] = average;
            } else {
                shouldRenderPhase[originalIndex] = false;
            }
        }

        return { rowspans, shouldRenderPhase, phaseAverages, totalAverage, sortedExaminations };
    };


    useEffect(() => {
        if (cadetId) {
            fetchCadetData(parseInt(cadetId));
            fetchGroundSyllabuses();
        }
    }, [cadetId]);

    if (loading) {
        return <Spinner />;
    }

    if (error || !cadetData) {
        return (
            <div className="max-w-full mx-auto px-4 py-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <i className="mdi mdi-alert-circle text-red-500 text-2xl mr-3"></i>
                        <h3 className="text-lg font-semibold text-red-800">Error!</h3>
                    </div>
                    <p className="text-red-700 mb-4">{error || 'Cadet data not found'}</p>
                    <div className="flex gap-3">
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            onClick={() => cadetId && fetchCadetData(parseInt(cadetId))}
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
        <div className="mx-auto p-6 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative pb-0">
                <div className="text-center flex flex-col justify-between items-center bg-transparent p-4">
                    <FullLogo />
                    <h2 className="text-lg font-bold text-gray-800 uppercase underline">
                        {cadetData.cadet_details.name} - Ground Examination Records
                    </h2>
                    <h2 className="text-lg font-bold text-gray-800 uppercase underline">11Sqn Baf</h2>
                </div>
                <div className="absolute top-3 left-3 flex space-x-2">
                    <button
                        onClick={handleBack}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-black rounded-md hover:bg-gray-100 transition-colors"
                        title="Back to List"
                    >
                        <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                </div>
                <div className="absolute top-3 right-3 flex space-x-2">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-black rounded-md hover:bg-gray-100 transition-colors"
                        title="Print Summary Report"
                    >
                        <Icon icon="solar:printer-linear" className="w-4 h-4" />
                        <span>Print</span>
                    </button>
                </div>
            </div>

            {/* Cadet Statistics */}
            <div className="mb-6 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Cadet Details</h3>
                        <p className="text-lg font-bold text-gray-900">{cadetData.cadet_details.name}</p>
                        <p className="text-sm text-gray-600">{cadetData.cadet_details.rank.name} - BD: {cadetData.cadet_details.bdno}</p>
                        <p className="text-xs text-gray-500">
                            {cadetData.cadet_details.course.name} | {cadetData.cadet_details.semester.name}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Tests Progress</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Completed</p>
                                <p className="text-xl font-bold text-blue-600">{cadetData.cadet_details.total_examinations}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Total</p>
                                <p className="text-xl font-bold text-gray-700">{groundSyllabuses.reduce((sum, syllabus) => sum + (syllabus.no_of_test || 0), 0)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Progress</p>
                                <p className={`text-xl font-bold ${(() => {
                                    const totalTests = groundSyllabuses.reduce((sum, syllabus) => sum + (syllabus.no_of_test || 0), 0);
                                    const percentage = totalTests > 0 ? (cadetData.cadet_details.total_examinations / totalTests) * 100 : 0;
                                    return percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
                                })()}`}>
                                    {(() => {
                                        const totalTests = groundSyllabuses.reduce((sum, syllabus) => sum + (syllabus.no_of_test || 0), 0);
                                        return totalTests > 0 ? ((cadetData.cadet_details.total_examinations / totalTests) * 100).toFixed(1) : 0;
                                    })()}%
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Average Mark</h3>
                        <p className={`text-2xl font-bold ${cadetData.cadet_details.average_mark >= 80 ? 'text-green-600' :
                            cadetData.cadet_details.average_mark >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {cadetData.cadet_details.average_mark.toFixed(1)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Examinations Table */}
            <div className="bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>

                                <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">Phase</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">Test</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">Instructor</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">Date</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">Remark</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">Mark</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">Phase Average</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider">Total Average</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-black border border-black uppercase tracking-wider print:hidden">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const { rowspans, shouldRenderPhase, phaseAverages, totalAverage, sortedExaminations } = calculatePhaseRowspans(cadetData.examinations);

                                return sortedExaminations.map((examination, sortedIndex) => {
                                    const originalIndex = cadetData.examinations.indexOf(examination);
                                    const isFirstRow = sortedIndex === 0;
                                    return (
                                        <tr key={examination.id} className="hover:bg-gray-50 transition-colors">
                                            {shouldRenderPhase[originalIndex] && (
                                                <td className="px-4 py-2 text-black border border-black align-middle text-center" rowSpan={rowspans[originalIndex]}>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{examination.phase.ground_shortname}</div>
                                                        <div className="text-xs text-black">{examination.phase.ground_fullname}</div>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-4 py-2 text-black border border-black text-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{examination.test.ground_shortname}</div>
                                                    <div className="text-xs text-black">{examination.test.ground_test_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-sm text-gray-900 text-center">
                                                {examination.instructor?.name || 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-sm text-gray-900 text-center">
                                                {formatDate(examination.date)}
                                            </td>
                                            <td className={`px-4 py-2 text-black border border-black text-sm ${!examination.exam_remark ? 'text-center' : ''}`} title={examination.exam_remark || ''}>
                                                {examination.exam_remark ? (
                                                    examination.exam_remark.length > 30 ?
                                                        `${examination.exam_remark.substring(0, 30)}...` :
                                                        examination.exam_remark
                                                ) : 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-center">
                                                {examination.exam_mark !== null ? (
                                                    <span className={`text-sm font-bold ${parseFloat(examination.exam_mark.toString()) >= 80 ? 'text-green-600' :
                                                        parseFloat(examination.exam_mark.toString()) >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                        {parseFloat(examination.exam_mark.toString()).toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            {shouldRenderPhase[originalIndex] && (
                                                <td className="px-4 py-2 text-black border border-black align-middle text-center" rowSpan={rowspans[originalIndex]}>
                                                    {phaseAverages[originalIndex] > 0 ? (
                                                        <span className={`text-sm font-bold ${phaseAverages[originalIndex] >= 80 ? 'text-green-600' :
                                                            phaseAverages[originalIndex] >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                            }`}>
                                                            {phaseAverages[originalIndex].toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                            )}
                                            {isFirstRow && (
                                                <td className="px-4 py-2 text-black border border-black align-middle text-center" rowSpan={sortedExaminations.length}>
                                                    {totalAverage > 0 ? (
                                                        <span className={`text-sm font-bold ${totalAverage >= 80 ? 'text-green-600' :
                                                            totalAverage >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                            }`}>
                                                            {totalAverage.toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-4 py-2 whitespace-nowrap text-black border border-black text-sm font-medium print:hidden">
                                                <div className="flex justify-center items-center space-x-2">
                                                    <button
                                                        className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50 transition-colors"
                                                        onClick={() => handleEditExamination(examination)}
                                                        title="Edit"
                                                    >
                                                        <div className="i-hugeicons:edit-02 w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                                                        onClick={() => showDeleteModal(examination.id)}
                                                        title="Delete"
                                                    >
                                                        <div className="i-hugeicons:delete-02 w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {cadetData.examinations.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500">No examinations found for this cadet with the current filters.</p>
                </div>
            )}

            {/* Edit Modal */}
            <ExaminationEditModal
                isOpen={editModalVisible}
                onClose={() => {
                    setEditModalVisible(false);
                    setSelectedExamination(null);
                }}
                examination={selectedExamination}
                cadetId={cadetId}
                onSave={handleSaveExamination}
                loading={editLoading}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalVisible}
                isLoading={deleteLoading}
                title="Delete Ground Examination"
                message="Are you sure you want to delete this ground examination? This action cannot be undone."
                onConfirm={handleDeleteExamination}
                onClose={() => {
                    setDeleteModalVisible(false);
                    setSelectedExaminationId(null);
                }}
                icon="i-hugeicons:delete-02"
            />
        </div>
    );
};