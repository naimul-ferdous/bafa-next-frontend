"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useParams, useRouter } from "next/navigation";
import { ftw12sqnFlyingExaminationMarkService } from "@/libs/services/ftw12sqnFlyingExaminationMarkService";
import { ftw12sqnGroundExaminationMarkService } from "@/libs/services/ftw12sqnGroundExaminationMarkService";
import { ftw12sqnFlyingExamApprovalProcessService } from "@/libs/services/ftw12sqnFlyingExamApprovalProcessService";
import { ftw12sqnFlyingExamApprovalStatusService } from "@/libs/services/ftw12sqnFlyingExamApprovalStatusService";
import { ftw12sqnFlyingExamCadetApprovalStatusService } from "@/libs/services/ftw12sqnFlyingExamCadetApprovalStatusService";
import { useAuth } from "@/libs/hooks/useAuth";
import { Ftw12sqnFlyingExaminationMark, Ftw12sqnGroundExaminationMark } from "@/libs/types/ftw12sqnExamination";
import type { ApprovalProcess, ApprovalStatus, CadetApprovalStatus } from "@/libs/types/approval";
import { checkAllCadetsApprovedByCurrentRole } from "@/libs/utils/approvalHelpers";
import FullLogo from "@/components/ui/fulllogo";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import FinalReportTab from "./components/FinalReportTab";
import BupReportTab from "./components/BupReportTab";
import DetailsBreakdownTab from "./components/DetailsBreakdownTab";
import ForwardToApprovalModal from "./components/ForwardToApprovalModal";
import RejectModal from "./components/RejectModal";
import BulkCadetApprovalModal from "./components/BulkCadetApprovalModal";

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

export default function FlyingExamination12SqnSemesterView() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.courseId as string;
  const semesterId = params.semesterId as string;

  const [semesterData, setSemesterData] = useState<SemesterData | null>(null);
  const [groundData, setGroundData] = useState<{ cadets: { cadet_details: { id: number; name: string; bdno: string }; marks: Ftw12sqnGroundExaminationMark[] }[] } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'final' | 'bup' | 'details'>('final');

  // Approval system state
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [allApprovalStatuses, setAllApprovalStatuses] = useState<ApprovalStatus[]>([]);
  const [approvalProcess, setApprovalProcess] = useState<ApprovalProcess | null>(null);
  const [allApprovalProcesses, setAllApprovalProcesses] = useState<ApprovalProcess[]>([]);
  const [nextLevelProcess, setNextLevelProcess] = useState<ApprovalProcess | null>(null);
  const [cadetApprovalStatuses, setCadetApprovalStatuses] = useState<CadetApprovalStatus[]>([]);
  const [selectedCadets, setSelectedCadets] = useState<number[]>([]);

  // Modal states
  const [forwardModalVisible, setForwardModalVisible] = useState<boolean>(false);
  const [rejectModalVisible, setRejectModalVisible] = useState<boolean>(false);
  const [bulkApprovalModalVisible, setBulkApprovalModalVisible] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [deletingMark, setDeletingMark] = useState<Ftw12sqnFlyingExaminationMark | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const fetchApprovalProcess = useCallback(async () => {
    if (!user?.role_id) return;

    try {
      const result = await ftw12sqnFlyingExamApprovalProcessService.getByRoleId(user.role_id, { allData: true });

      if (result?.data && Array.isArray(result.data) && result.data.length > 0) {
        const currentProcess = result.data[0];
        setApprovalProcess(currentProcess);

        const allProcessesResult = await ftw12sqnFlyingExamApprovalProcessService.getActive();
        if (allProcessesResult && Array.isArray(allProcessesResult) && allProcessesResult.length > 0) {
          setAllApprovalProcesses(allProcessesResult);
          const currentStatusCode = parseInt(currentProcess.status_code);
          let nextLevel;
          if (currentStatusCode === 0) {
            nextLevel = allProcessesResult.find(
              (process: ApprovalProcess) => parseInt(process.status_code) === 1
            );
          } else {
            nextLevel = allProcessesResult.find(
              (process: ApprovalProcess) => parseInt(process.status_code) === currentStatusCode + 1
            );
          }
          setNextLevelProcess(nextLevel || null);
        }
      } else {
        setApprovalProcess(null);
      }
    } catch (error) {
      console.error("Error fetching approval process:", error);
    }
  }, [user?.role_id]);

  const fetchApprovalStatus = useCallback(async (courseIdNum: number, semesterIdNum: number) => {
    try {
      const response = await ftw12sqnFlyingExamApprovalStatusService.getLatestByCourseAndSemester(courseIdNum, semesterIdNum);
      if (response) {
        setApprovalStatus(response);
      }

      const allResponse = await ftw12sqnFlyingExamApprovalStatusService.getAll({
        course_id: courseIdNum,
        semester_id: semesterIdNum,
        allData: true
      });

      if (allResponse?.data) {
        const approvedStatuses = allResponse.data
          .filter((status: ApprovalStatus) => status.approval_status === 'approved')
          .sort((a: ApprovalStatus, b: ApprovalStatus) => {
            const aProgress = a.progress_id || 0;
            const bProgress = b.progress_id || 0;
            return aProgress - bProgress;
          });
        setAllApprovalStatuses(approvedStatuses);
      }
    } catch (err) {
      console.error('Error fetching approval status:', err);
    }
  }, []);

  const fetchCadetApprovalStatuses = useCallback(async (courseIdNum: number, semesterIdNum: number) => {
    try {
      const response = await ftw12sqnFlyingExamCadetApprovalStatusService.getByCourseAndSemester(
        courseIdNum,
        semesterIdNum,
        { allData: true }
      );

      if (response?.data) {
        setCadetApprovalStatuses(response.data);
      }
    } catch (error) {
      console.error('Error fetching cadet approval statuses:', error);
    }
  }, []);

  const fetchSemesterData = useCallback(async () => {
    if (!courseId || !semesterId) return;

    try {
      setLoading(true);
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

      try {
        const groundResponse = await ftw12sqnGroundExaminationMarkService.getAllMarks({
          course_id: parseInt(courseId),
          semester_id: parseInt(semesterId),
          per_page: 1000,
        });

        if (groundResponse.data.length > 0) {
          const groundCadetMap = new Map<number, { cadet_details: { id: number; name: string; bdno: string }; marks: Ftw12sqnGroundExaminationMark[] }>();

          groundResponse.data.forEach((mark) => {
            const cadetId = mark.cadet?.id;
            if (!cadetId) return;

            if (!groundCadetMap.has(cadetId)) {
              groundCadetMap.set(cadetId, {
                cadet_details: {
                  id: cadetId,
                  name: mark.cadet?.name || "",
                  bdno: mark.cadet?.bd_no || mark.cadet?.cadet_number || mark.cadet?.bdno || "",
                },
                marks: [],
              });
            }

            groundCadetMap.get(cadetId)!.marks.push(mark);
          });

          setGroundData({
            cadets: Array.from(groundCadetMap.values()),
          });
        }
      } catch (groundErr) {
        console.error("Error fetching ground data:", groundErr);
      }

      await fetchApprovalStatus(parseInt(courseId), parseInt(semesterId));
      await fetchCadetApprovalStatuses(parseInt(courseId), parseInt(semesterId));
    } catch (err: unknown) {
      console.error("Error fetching semester data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch semester data");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId, fetchApprovalStatus, fetchCadetApprovalStatuses]);

  useEffect(() => {
    fetchSemesterData();
  }, [fetchSemesterData]);

  useEffect(() => {
    if (user?.role_id) {
      fetchApprovalProcess();
    }
  }, [user?.role_id, fetchApprovalProcess]);

  const handleBack = () => {
    router.push("/ftw/12sqn/results/flying/results");
  };

  const handleDeleteExamination = async () => {
    if (!deletingMark) return;

    setDeleteLoading(true);
    try {
      await ftw12sqnFlyingExaminationMarkService.deleteMark(deletingMark.id);
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

  const handleEditMark = (mark: Ftw12sqnFlyingExaminationMark) => {
    router.push(`/ftw/12sqn/results/flying/results/${mark.id}/edit`);
  };

  const handleDeleteMark = (mark: Ftw12sqnFlyingExaminationMark) => {
    setDeletingMark(mark);
    setDeleteModalVisible(true);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const handleForwardToApproval = () => {
    setForwardModalVisible(true);
  };

  const handleReject = () => {
    setRejectModalVisible(true);
  };

  const handleSelectCadet = (cadetId: number) => {
    setSelectedCadets(prev => {
      if (prev.includes(cadetId)) {
        return prev.filter(id => id !== cadetId);
      } else {
        return [...prev, cadetId];
      }
    });
  };

  const handleSelectAllCadets = (selected: boolean) => {
    if (selected) {
      const allCadetIds = semesterData?.cadets.map(cadet => cadet.cadet_details.id) || [];
      setSelectedCadets(allCadetIds);
    } else {
      setSelectedCadets([]);
    }
  };

  const handleBulkApprovalSuccess = () => {
    setSelectedCadets([]);
    if (semesterData?.course_details?.id && semesterId) {
      fetchApprovalStatus(semesterData.course_details.id, parseInt(semesterId));
      fetchCadetApprovalStatuses(semesterData.course_details.id, parseInt(semesterId));
    }
  };

  const allCadetsApproved = semesterData && approvalProcess
    ? checkAllCadetsApprovedByCurrentRole(
        semesterData.cadets,
        cadetApprovalStatuses,
        approvalProcess
      )
    : false;

  const isFinalApprovalComplete = allApprovalStatuses.some(
    status => status.remark && status.remark.includes('Final approval completed')
  );

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

  // Determine if user can see approval buttons using workflow flags
  const userStatusCode = approvalProcess?.status_code || '';
  const isFirstLevel = approvalProcess?.is_first === true;
  const isFinalLevel = approvalProcess?.is_final === true;
  const noNeedForward = approvalProcess?.no_need_forward === true;
  const isDraftman = userStatusCode === '0' || user?.role?.name?.toLowerCase().includes('draftman');

  const userHasForwardedSemester = allApprovalStatuses.some(
    status => status.send_progress_id === approvalProcess?.id && status.approval_status === 'approved'
  );

  const workflowAtUserLevel = (() => {
    if (!approvalStatus) {
      return isFirstLevel || isDraftman;
    }
    return approvalStatus.progress_id === approvalProcess?.id;
  })();

  const previousLevelForwardedToUser = allApprovalStatuses.some(
    status => status.next_progress_id === approvalProcess?.id && status.approval_status === 'approved'
  );

  const canShowActionButtons = !isFinalApprovalComplete &&
    !userHasForwardedSemester &&
    (workflowAtUserLevel || previousLevelForwardedToUser || (isFirstLevel && !approvalStatus));

  const hasNextLevel = !isFinalLevel && !noNeedForward && nextLevelProcess !== null;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="relative text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
          {semesterData.semester_details.name} Flying Mission Examination Data - 12SQN BAF
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

        <div className="absolute flex flex-col top-4 right-4 space-y-2 print:hidden">
          {approvalProcess && canShowActionButtons && (
            <>
              <div className="flex items-center justify-end space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm text-blue-800">
                  {isFirstLevel || isDraftman ? (
                    <>
                      <span className="font-medium">Initial Level:</span>{' '}
                      <span className="font-semibold">{isDraftman ? 'Draftman' : approvalProcess.role?.name || 'Unknown'}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Current Level:</span>{' '}
                      <span className="font-semibold">{approvalProcess.role?.name || 'Unknown'}</span>
                    </>
                  )}
                  {hasNextLevel && nextLevelProcess && (
                    <>
                      {' '}<span className="mx-2">→</span>{' '}
                      <span className="font-medium">Next Level:</span>{' '}
                      <span className="font-semibold">{nextLevelProcess.role?.name || 'Unknown'}</span>
                    </>
                  )}
                  {isFinalLevel && (
                    <span className="text-green-600 font-medium"> (Final Approval Level)</span>
                  )}
                  {noNeedForward && !isFinalLevel && (
                    <span className="text-orange-600 font-medium"> (Approve Only - No Forward Required)</span>
                  )}
                </div>
              </div>

              {!allCadetsApproved && !isDraftman && !noNeedForward && (
                <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <Icon icon="solar:info-circle-bold" className="w-5 h-5 text-yellow-600" />
                  <div className="text-sm text-yellow-700">
                    <span className="font-medium">
                      {isFinalLevel
                        ? 'Approve all cadets before final approval'
                        : 'Approve all cadets before forwarding'}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex space-x-2">
            {canShowActionButtons && (
              <>
                {approvalStatus?.remark && approvalStatus.remark.startsWith('REJECTED:') && (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md mr-2">
                    <Icon icon="solar:info-circle-bold" className="w-5 h-5 text-red-600" />
                    <div className="text-sm">
                      <span className="font-medium">Previous Rejection:</span>
                      <p className="text-xs text-red-600 mt-1">{approvalStatus.remark.replace('REJECTED: ', '')}</p>
                    </div>
                  </div>
                )}

                {!isDraftman && !isFirstLevel && (
                  <button
                    onClick={handleReject}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    title="Reject and send back to previous level"
                  >
                    <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                )}

                {noNeedForward ? (
                  <button
                    onClick={handleForwardToApproval}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer"
                    title="Approve cadets at this level"
                  >
                    <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                ) : hasNextLevel ? (
                  <button
                    onClick={handleForwardToApproval}
                    disabled={!allCadetsApproved}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                      allCadetsApproved
                        ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={allCadetsApproved ? "Forward to Next Level" : "Approve all cadets first"}
                  >
                    <Icon icon="solar:forward-linear" className="w-4 h-4" />
                    <span>Forward to Next Level</span>
                  </button>
                ) : (
                  <button
                    onClick={handleForwardToApproval}
                    disabled={!allCadetsApproved}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                      allCadetsApproved
                        ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={allCadetsApproved ? "Mark as Final Approval" : "Approve all cadets first"}
                  >
                    <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                    <span>Approve (Final)</span>
                  </button>
                )}
              </>
            )}

            {isFinalApprovalComplete && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-md">
                <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Final Approval Completed
                </span>
              </div>
            )}

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
      </div>

      {/* Approval Workflow Steps */}
      {allApprovalProcesses.length > 0 && approvalProcess && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 print:hidden">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Icon icon="solar:routing-2-linear" className="w-5 h-5" />
            Approval Workflow Steps
          </h3>

          <div className="flex items-center justify-between">
            {[...allApprovalProcesses]
              .sort((a, b) => parseInt(a.status_code) - parseInt(b.status_code))
              .map((process, index, arr) => {
                const isUserStep = approvalProcess?.id === process.id;
                const processIsFirst = process.is_first === true;
                const processIsFinal = process.is_final === true;

                const semesterLevelApproved = allApprovalStatuses.some(
                  (status) =>
                    (status.send_progress_id === process.id && status.approval_status === "approved") ||
                    (status.progress_id === process.id && status.approval_status === "approved")
                );

                const cadetLevelApproved = cadetApprovalStatuses.some(
                  (cadetStatus) =>
                    cadetStatus.progress_id === process.id &&
                    cadetStatus.approval_status === "approved" &&
                    cadetStatus.next_progress_id !== null
                );

                const isApproved = semesterLevelApproved || cadetLevelApproved;

                const isCurrentStep = approvalStatus === null
                  ? processIsFirst
                  : approvalStatus?.progress_id === process.id;

                const isLast = index === arr.length - 1;

                let stepStatus: "completed" | "current" | "user" | "pending" = "pending";
                if (isFinalApprovalComplete || isApproved) {
                  stepStatus = "completed";
                } else if (isCurrentStep && isUserStep) {
                  stepStatus = "user";
                } else if (isCurrentStep) {
                  stepStatus = "current";
                } else if (isUserStep && !isApproved) {
                  stepStatus = "user";
                }

                return (
                  <div key={process.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          stepStatus === "completed"
                            ? "bg-green-500 border-green-500 text-white"
                            : stepStatus === "user"
                            ? "bg-blue-500 border-blue-500 text-white ring-4 ring-blue-200"
                            : stepStatus === "current"
                            ? "bg-yellow-500 border-yellow-500 text-white"
                            : "bg-gray-200 border-gray-300 text-gray-500"
                        }`}
                      >
                        {stepStatus === "completed" ? (
                          <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-bold">{process.status_code}</span>
                        )}
                      </div>

                      <div className="mt-2 text-center max-w-[120px]">
                        <p
                          className={`text-xs font-medium ${
                            stepStatus === "completed"
                              ? "text-green-700"
                              : stepStatus === "user"
                              ? "text-blue-700 font-bold"
                              : stepStatus === "current"
                              ? "text-yellow-700"
                              : "text-gray-500"
                          }`}
                          title={process.role?.name || "Unknown Role"}
                        >
                          {process.role?.name || "Unknown"}
                        </p>
                        {isUserStep && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                            Your Role
                          </span>
                        )}
                        {isCurrentStep && !isUserStep && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-yellow-100 text-yellow-700 rounded-full">
                            In Progress
                          </span>
                        )}
                        {processIsFinal && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-full">
                            Final
                          </span>
                        )}
                      </div>
                    </div>

                    {!isLast && (
                      <div
                        className={`flex-1 h-1 mx-2 rounded ${
                          stepStatus === "completed" ? "bg-green-400" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-200"></div>
                <span className="text-gray-600">Your Level</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-gray-600">Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-purple-100 text-purple-700 rounded">Final</span>
                <span className="text-gray-600">Final Step</span>
              </div>
            </div>

            {isFinalApprovalComplete && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                <Icon icon="solar:verified-check-bold" className="w-4 h-4 text-green-600" />
                <span className="text-green-700 font-medium">All Approvals Complete</span>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCadets.length > 0 && approvalProcess && activeTab === 'final' && canShowActionButtons && (
        <div className="mb-4 flex items-center justify-center">
          <button
            onClick={() => setBulkApprovalModalVisible(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
            <span className="font-medium">Approve {selectedCadets.length} Selected Cadet(s)</span>
          </button>
        </div>
      )}

      <div className="print:hidden w-full flex justify-center items-center mb-6">
        <nav className="flex space-x-2 border border-gray-200 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setActiveTab('final')}
            className={`py-1 px-4 font-medium text-sm rounded-full transition-colors ${activeTab === 'final'
              ? 'bg-blue-500 text-white'
              : 'bg-transparent text-black hover:bg-gray-200'
            }`}
          >
            Sem Flg
          </button>
          <button
            onClick={() => setActiveTab('bup')}
            className={`py-1 px-4 font-medium text-sm rounded-full transition-colors ${activeTab === 'bup'
              ? 'bg-blue-500 text-white'
              : 'bg-transparent text-black hover:bg-gray-200'
            }`}
          >
            BUP Report
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
            selectedCadets={selectedCadets}
            onSelectCadet={handleSelectCadet}
            onSelectAll={handleSelectAllCadets}
            cadetApprovalStatuses={cadetApprovalStatuses}
            approvalProcesses={allApprovalProcesses}
            profile={user}
          />
        )}
        {activeTab === 'bup' && (
          <BupReportTab
            semesterData={semesterData}
            semesterId={parseInt(semesterId)}
            courseId={parseInt(courseId)}
            groundData={groundData}
            selectedCadets={selectedCadets}
            onSelectCadet={handleSelectCadet}
            onSelectAll={handleSelectAllCadets}
            cadetApprovalStatuses={cadetApprovalStatuses}
            approvalProcesses={allApprovalProcesses}
            profile={user}
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
        title="Delete Flying Examination"
        message={`Are you sure you want to delete this examination mark for ${deletingMark?.cadet?.name || "this cadet"}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />

      {forwardModalVisible && semesterData && (
        <ForwardToApprovalModal
          open={forwardModalVisible}
          onClose={() => setForwardModalVisible(false)}
          semesterData={semesterData}
          courseId={parseInt(courseId)}
          semesterId={parseInt(semesterId)}
          currentApprovalStatus={approvalStatus}
          approvalProcess={approvalProcess}
          nextLevelProcess={nextLevelProcess}
          onSuccess={() => {
            fetchApprovalStatus(parseInt(courseId), parseInt(semesterId));
            fetchCadetApprovalStatuses(parseInt(courseId), parseInt(semesterId));
          }}
        />
      )}

      {rejectModalVisible && semesterData && (
        <RejectModal
          open={rejectModalVisible}
          onClose={() => setRejectModalVisible(false)}
          semesterData={semesterData}
          courseId={parseInt(courseId)}
          semesterId={parseInt(semesterId)}
          currentApprovalStatus={approvalStatus}
          approvalProcess={approvalProcess}
          onSuccess={() => {
            fetchApprovalStatus(parseInt(courseId), parseInt(semesterId));
          }}
        />
      )}

      {bulkApprovalModalVisible && semesterData && approvalProcess && (
        <BulkCadetApprovalModal
          open={bulkApprovalModalVisible}
          onClose={() => setBulkApprovalModalVisible(false)}
          selectedCadets={semesterData.cadets.filter(cadet => selectedCadets.includes(cadet.cadet_details.id))}
          courseId={semesterData.course_details.id}
          semesterId={parseInt(semesterId)}
          approvalProcess={approvalProcess}
          nextLevelProcess={nextLevelProcess}
          onSuccess={handleBulkApprovalSuccess}
        />
      )}

      {/* Signature Box - Using cadet approval statuses for accurate approver info */}
      {cadetApprovalStatuses.length > 0 && (() => {
        // Group cadet approvals by progress_id and get unique approvers
        const approversByLevel = cadetApprovalStatuses
          .filter(status => status.approval_status === 'approved' && status.approver)
          .reduce((acc, status) => {
            const levelKey = status.progress_id;
            if (!acc[levelKey]) {
              acc[levelKey] = {
                approver: status.approver,
                approvalProcess: status.approval_process,
                created_at: status.approved_at || status.created_at,
              };
            }
            return acc;
          }, {} as Record<number, { approver: CadetApprovalStatus['approver']; approvalProcess: CadetApprovalStatus['approval_process']; created_at: string | undefined }>);

        const uniqueApprovers = Object.values(approversByLevel);

        if (uniqueApprovers.length === 0) return null;

        return (
          <div className="mt-8 border-t-2 border-gray-300 pt-6">
            <h3 className="text-lg font-bold text-gray-800 uppercase mb-4 text-center">
              Approval Signatures
            </h3>
            <div className={`grid ${uniqueApprovers.length === 1 ? 'justify-end' : uniqueApprovers.length <= 4 ? 'grid-cols-4' : 'grid-cols-4'} gap-6`}>
              {uniqueApprovers.map((item, index) => (
                <div key={index} className="flex flex-col items-center p-4">
                  <div className="w-full h-24 flex items-center justify-center mb-2 bg-white">
                    <span className="text-gray-400 text-xs">Signature</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm uppercase font-semibold text-gray-900 border-t border-black pt-2">
                      {item.approver?.rank?.name && `${item.approver.rank.name} `}
                      {item.approver?.name || 'Unknown'}
                    </p>
                    {item.approver?.role?.name && (
                      <p className="text-xs text-blue-600 font-medium">
                        {item.approver.role.name}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 font-medium">12 Squadron BAF</p>
                    {item.created_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(item.created_at).toLocaleDateString('en-GB')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
