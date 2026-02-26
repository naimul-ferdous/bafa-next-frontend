"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useParams, useRouter } from "next/navigation";
import { ftw11sqnGroundExaminationMarkService } from "@/libs/services/ftw11sqnGroundExaminationMarkService";
import { useAuth } from "@/libs/hooks/useAuth";
import { Ftw11sqnGroundExaminationMark } from "@/libs/types/ftw11sqnExamination";
import FullLogo from "@/components/ui/fulllogo";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import FinalReportTab from "./components/FinalReportTab";
import DetailsBreakdownTab from "./components/DetailsBreakdownTab";

interface SemesterData {
  semester_details: {
    id: number;
    name: string;
    code: string | null;
    total_examinations: number;
    total_cadets: number;
  };
  course_details: {
    id: number;
    name: string;
    code: string | null;
  };
  cadets: CadetData[];
}

interface CadetData {
  cadet_details: {
    id: number;
    name: string;
    bdno: string;
    rank?: { id: number; name: string };
    course_id: number;
    semester_id: number;
    total_examinations: number;
    average_mark: number;
  };
  marks: Ftw11sqnGroundExaminationMark[];
}

export default function GroundExamination11SqnSemesterView() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.courseId as string;
  const semesterId = params.semesterId as string;

  const [semesterData, setSemesterData] = useState<SemesterData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'final' | 'details'>('final');

  // Modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [deletingMark, setDeletingMark] = useState<Ftw11sqnGroundExaminationMark | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const fetchSemesterData = useCallback(async () => {
    if (!courseId || !semesterId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await ftw11sqnGroundExaminationMarkService.getAllMarks({
        course_id: parseInt(courseId),
        semester_id: parseInt(semesterId),
        per_page: 1000,
      });

      if (response.data.length === 0) {
        setSemesterData(null);
        setError("No examination marks found for this course and semester");
        return;
      }

      const firstMark = response.data[0];
      const cadetMap = new Map<number, CadetData>();

      response.data.forEach((mark) => {
        const cadetId = mark.cadet?.id;
        if (!cadetId) return;

        if (!cadetMap.has(cadetId)) {
          cadetMap.set(cadetId, {
            cadet_details: {
              id: cadetId,
              name: mark.cadet?.name || "",
              bdno: mark.cadet?.bd_no || mark.cadet?.cadet_number || mark.cadet?.bdno || "",
              rank: mark.cadet?.rank,
              course_id: mark.course?.id || parseInt(courseId),
              semester_id: mark.semester?.id || parseInt(semesterId),
              total_examinations: 0,
              average_mark: 0,
            },
            marks: [],
          });
        }

        cadetMap.get(cadetId)!.marks.push(mark);
      });

      cadetMap.forEach((cadetData) => {
        const validMarks = cadetData.marks
          .map((m) => parseFloat(m.achieved_mark || "0"))
          .filter((m) => !isNaN(m) && m > 0);

        cadetData.cadet_details.total_examinations = cadetData.marks.length;
        cadetData.cadet_details.average_mark = validMarks.length > 0
          ? validMarks.reduce((sum, m) => sum + m, 0) / validMarks.length
          : 0;
      });

      const semData: SemesterData = {
        semester_details: {
          id: firstMark.semester?.id || parseInt(semesterId),
          name: firstMark.semester?.name || "",
          code: firstMark.semester?.code || null,
          total_examinations: response.data.length,
          total_cadets: cadetMap.size,
        },
        course_details: {
          id: firstMark.course?.id || parseInt(courseId),
          name: firstMark.course?.name || "",
          code: firstMark.course?.code || null,
        },
        cadets: Array.from(cadetMap.values()),
      };

      setSemesterData(semData);
    } catch (err: unknown) {
      console.error("Error fetching semester data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch semester data");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId]);

  useEffect(() => {
    fetchSemesterData();
  }, [fetchSemesterData]);

  const handleBack = () => {
    router.push("/ftw/11sqn/results/ground/results");
  };

  const handleDeleteExamination = async () => {
    if (!deletingMark) return;

    setDeleteLoading(true);
    try {
      await ftw11sqnGroundExaminationMarkService.deleteMark(deletingMark.id);
      setDeleteModalVisible(false);
      setDeletingMark(null);
      fetchSemesterData();
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

  const handlePrintSummary = () => {
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

  if (error || !semesterData) {
    return (
      <div className="max-w-full mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Icon icon="hugeicons:alert-circle" className="w-6 h-6 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-red-800">Error!</h3>
          </div>
          <p className="text-red-700 mb-4">{error || "Semester data not found"}</p>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              onClick={() => fetchSemesterData()}
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
          {semesterData.semester_details.name} Ground Examination Data - 11SQN BAF
        </h2>

        <div className="absolute top-4 left-4">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 px-4 py-2 bg-transparent hover:bg-gray-100 border border-gray-300 text-black rounded-md transition-colors"
            title="Go Back"
          >
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        <div className="absolute flex top-4 right-4 space-x-2 print:hidden">
          <button
            onClick={handlePrintSummary}
            className="flex items-center space-x-2 px-4 py-2 bg-transparent hover:bg-gray-100 border border-gray-300 text-black rounded-md transition-colors"
            title="Print Report"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div className="print:hidden w-full flex justify-center items-center mb-6">
        <nav className="flex space-x-2 border border-gray-200 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setActiveTab('final')}
            className={`py-1 px-4 font-medium text-sm rounded-full transition-colors ${activeTab === 'final'
              ? 'bg-blue-500 text-white'
              : 'bg-transparent text-black hover:bg-gray-200'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-1 px-4 font-medium text-sm rounded-full transition-colors ${activeTab === 'details'
              ? 'bg-blue-500 text-white'
              : 'bg-transparent text-black hover:bg-gray-200'
            }`}
          >
            Breakdown
          </button>
        </nav>
      </div>

      <div className="tab-content">
        {activeTab === 'final' && (
          <FinalReportTab
            semesterData={semesterData}
            semesterId={parseInt(semesterId)}
            courseId={parseInt(courseId)}
          />
        )}
        {activeTab === 'details' && (
          <DetailsBreakdownTab
            semesterData={semesterData}
            onEdit={handleEditMark}
            onDelete={handleDeleteMark}
          />
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setDeletingMark(null);
        }}
        onConfirm={handleDeleteExamination}
        title="Delete Ground Examination"
        message={`Are you sure you want to delete this examination mark for ${deletingMark?.cadet?.name || "this cadet"}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
