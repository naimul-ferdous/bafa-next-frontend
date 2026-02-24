"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useParams, useRouter } from "next/navigation";
import { ftw12sqnFlyingExaminationMarkService } from "@/libs/services/ftw12sqnFlyingExaminationMarkService";
import { Ftw12sqnFlyingExaminationMark } from "@/libs/types/ftw12sqnExamination";
import FullLogo from "@/components/ui/fulllogo";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import DetailsBreakdownTab from "./components/DetailsBreakdownTab";
import FinalReportTab from "./components/FinalReportTab";

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
  marks: Ftw12sqnFlyingExaminationMark[];
}

export default function FlyingExamination12sqnDetailsView() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const semesterId = params.semesterId as string;

  const [semesterData, setSemesterData] = useState<SemesterData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dataLoadingComplete, setDataLoadingComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"final" | "details">("final");

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [deletingMark, setDeletingMark] = useState<Ftw12sqnFlyingExaminationMark | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const fetchSemesterData = useCallback(async () => {
    if (!courseId || !semesterId) return;

    try {
      setLoading(true);
      setDataLoadingComplete(false);
      setError(null);

      const response = await ftw12sqnFlyingExaminationMarkService.getAllMarks({
        course_id: parseInt(courseId),
        semester_id: parseInt(semesterId),
        per_page: 1000,
      });

      if (response.data.length === 0) {
        setSemesterData(null);
        setError("No examination marks found for this course and semester");
        return;
      }

      // Transform data into semester grouped format
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
              bdno: mark.cadet?.bdno || "",
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

      // Calculate averages for each cadet
      cadetMap.forEach((cadetData) => {
        const validMarks = cadetData.marks
          .map((m) => parseFloat(m.achieved_mark || "0"))
          .filter((m) => !isNaN(m) && m > 0);

        cadetData.cadet_details.total_examinations = cadetData.marks.length;
        cadetData.cadet_details.average_mark =
          validMarks.length > 0
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
      setDataLoadingComplete(true);
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
    router.push(`/ftw/12sqn/results/flying/results/course/${courseId}/semester/${semesterId}`);
  };

  const handleBackToList = () => {
    router.push("/ftw/12sqn/results/flying/results");
  };

  const handleAddMark = () => {
    router.push("/ftw/12sqn/results/flying/results/create");
  };

  const handleEditMark = (mark: Ftw12sqnFlyingExaminationMark) => {
    router.push(`/ftw/12sqn/results/flying/results/${mark.id}/edit`);
  };

  const handleDeleteMark = (mark: Ftw12sqnFlyingExaminationMark) => {
    setDeletingMark(mark);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deletingMark) return;
    try {
      setDeleteLoading(true);
      await ftw12sqnFlyingExaminationMarkService.deleteMark(deletingMark.id);
      setDeleteModalVisible(false);
      setDeletingMark(null);
      fetchSemesterData();
    } catch (err) {
      console.error("Failed to delete examination mark:", err);
      alert("Failed to delete examination mark");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  // Loading state
  if (loading || !dataLoadingComplete) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div>
          <Icon
            icon="hugeicons:fan-01"
            className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500"
          />
        </div>
      </div>
    );
  }

  // Error state
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
              onClick={handleBackToList}
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6 bg-white rounded-lg shadow overflow-hidden">
      {/* Header Section */}
      <div className="relative pb-0">
        <div className="text-center flex flex-col justify-between items-center bg-transparent p-4">
          <FullLogo />
          <h2 className="text-lg font-bold text-gray-800 uppercase underline">
            {semesterData.semester_details.name} Flying Examination Data
          </h2>
          <h2 className="text-lg font-bold text-gray-800 uppercase underline">
            12sqn BAF
          </h2>
        </div>

        {/* Back Button - Left */}
        <div className="absolute top-3 left-3 flex space-x-2">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-black rounded-md hover:bg-gray-100 transition-colors"
            title="Back to Semester View"
          >
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Action Buttons - Right */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2 print:hidden">
          <div className="flex space-x-2">
            <button
              onClick={handleAddMark}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Add New Mark"
            >
              <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
              <span>Add Mark</span>
            </button>
            <button
              onClick={handlePrintSummary}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-black rounded-md hover:bg-gray-100 transition-colors"
              title="Print Summary Report"
            >
              <Icon icon="hugeicons:printer" className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Course and Semester Info */}
      <div className="mt-3 flex items-center justify-center gap-4 mb-6">
        <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
          {semesterData.course_details.name} ({semesterData.course_details.code})
        </span>
        <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
          {semesterData.semester_details.name}
        </span>
        <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
          Total Cadets: {semesterData.semester_details.total_cadets}
        </span>
        <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
          Total Marks: {semesterData.semester_details.total_examinations}
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="print:hidden w-full flex justify-center items-center mb-6">
        <nav className="flex space-x-2 border border-gray-200 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setActiveTab("final")}
            className={`py-1 px-4 font-medium text-sm rounded-full transition-colors ${
              activeTab === "final"
                ? "bg-blue-500 text-white"
                : "bg-transparent text-black hover:bg-gray-200"
            }`}
          >
            Sem Flg Report
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`py-1 px-4 font-medium text-sm rounded-full transition-colors ${
              activeTab === "details"
                ? "bg-blue-500 text-white"
                : "bg-transparent text-black hover:bg-gray-200"
            }`}
          >
            Breakdown
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "final" && (
        <FinalReportTab
          semesterData={semesterData}
          semesterId={parseInt(semesterId)}
          courseId={parseInt(courseId)}
        />
      )}
      {activeTab === "details" && (
        <DetailsBreakdownTab
          semesterData={semesterData}
          onEdit={handleEditMark}
          onDelete={handleDeleteMark}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setDeletingMark(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Examination Mark"
        message={`Are you sure you want to delete this examination mark for ${
          deletingMark?.cadet?.name || "this cadet"
        }? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
