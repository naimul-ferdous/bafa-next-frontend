"use client";

import FullLogo from "@/components/ui/fulllogo";
import ftw11sqnGroundExaminationMarkService from "@/libs/services/ftw11sqnGroundExaminationMarkService";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";

export default function Ftw11sqnGroundExaminationMarksSemester() {
    const { semesterId } = useParams<{ semesterId: string }>();
    const navigate = useNavigate();
    const [semesterData, setSemesterData] = useState<SemesterData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
    const [selectedExaminationId, setSelectedExaminationId] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

    const [filters, setFilters] = useState({
        exam_type: '',
        status: '',
        phase_id: '',
        test_id: '',
        course_id: ''
    });

    useEffect(() => {
        if (semesterId) {
            fetchSemesterData(parseInt(semesterId));
        }
    }, [semesterId]);

    const fetchSemesterData = async (id: number, params = {}) => {
        try {
            setLoading(true);
            const response = await ftw11sqnGroundExaminationMarkService.getMarksBySemester(id, {
                ...filters,
                ...params
            });

            if (response?.data) {
                setSemesterData(response.data);
            } else {
                throw new Error('Semester data not found');
            }
        } catch (err: any) {
            console.error('Error fetching semester data:', err);
            setError(err.message || 'Failed to fetch semester data');
        } finally {
            setLoading(false);
        }
    };


    const handleBack = () => {
        navigate('/ftw/11-sqn/ground-examinations');
    };

    const handleDeleteExamination = async () => {
        if (!selectedExaminationId) return;

        setDeleteLoading(true);
        try {
            await ftw11sqnGroundExaminationMarkService.deleteMark(selectedExaminationId);
            setDeleteModalVisible(false);
            setSelectedExaminationId(null);
            if (semesterId) {
                fetchSemesterData(parseInt(semesterId));
            }
        } catch (err: any) {
            console.error('Error deleting examination:', err);
        } finally {
            setDeleteLoading(false);
        }
    };


    const handlePrintSummary = () => {
        window.print();
    };


    if (loading) {
        return <div className="w-full min-h-[20vh] flex items-center justify-center">
            <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
        </div>;
    }

    if (error || !semesterData) {
        return (
            <div className="max-w-full mx-auto px-4 py-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <i className="mdi mdi-alert-circle text-red-500 text-2xl mr-3"></i>
                        <h3 className="text-lg font-semibold text-red-800">Error!</h3>
                    </div>
                    <p className="text-red-700 mb-4">{error || 'Semester data not found'}</p>
                    <div className="flex gap-3">
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            onClick={() => semesterId && fetchSemesterData(parseInt(semesterId))}
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
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4"><FullLogo /></div>
                <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 11SQN Ground Examination Marks</h2>
            </div>
            <div className="relative">

                {/* Back Button */}
                <div className="absolute top-4 left-4">
                    <button
                        onClick={() => navigate('/ftw/11-sqn/ground-examinations')}
                        className="flex items-center space-x-2 px-4 py-2 bg-transparent hover:bg-gray-100 border border-gray-300 text-black rounded-md transition-colors"
                        title="Go Back"
                    >
                        <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                </div>
                <div className="absolute flex top-4 right-4 space-x-2">
                    <button
                        onClick={() => handlePrintSummary()}
                        className="flex items-center space-x-2 px-4 py-2 bg-transparent hover:bg-gray-100 border border-gray-300 text-black rounded-md transition-colors"
                        title="Print Report"
                    >
                        <Icon icon="solar:printer-linear" className="w-4 h-4" />
                        <span>Print</span>
                    </button>
                    <button
                        onClick={() => navigate(`/ftw/11-sqn/ground-examinations/semester/${semesterData.semester_details.id}/details`)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-500 border border-gray-300 text-white rounded-md transition-colors"
                        title="View Details"
                    >
                        <Icon icon="solar:document-text-linear" className="w-4 h-4" />
                        <span>View Details</span>
                    </button>
                </div>
            </div>


            <ReportsTab
                semesterData={semesterData}
                deleteModalVisible={deleteModalVisible}
                deleteLoading={deleteLoading}
                selectedExaminationId={selectedExaminationId}
                handleDeleteExamination={handleDeleteExamination}
                setDeleteModalVisible={setDeleteModalVisible}
                setSelectedExaminationId={setSelectedExaminationId}
                handlePrintSummary={handlePrintSummary}
            />
        </div >
    );
};