"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import { ftw11sqnFlyingExamApprovalStatusService } from "@/libs/services/ftw11sqnFlyingExamApprovalStatusService";
import { ftw11sqnFlyingExamApprovalProcessService } from "@/libs/services/ftw11sqnFlyingExamApprovalProcessService";
import type { ApprovalStatus, ApprovalProcess } from "@/libs/types/approval";

interface RejectModalProps {
  open: boolean;
  onClose: () => void;
  semesterData: {
    course_details?: { id: number; title?: string; name?: string };
    semester_details?: { id: number; name: string };
  } | null;
  courseId: number;
  semesterId: number;
  currentApprovalStatus?: ApprovalStatus | null;
  approvalProcess?: ApprovalProcess | null;
  onSuccess?: () => void;
}

const RejectModal = ({
  open,
  onClose,
  semesterData,
  courseId,
  semesterId,
  currentApprovalStatus,
  onSuccess,
}: RejectModalProps) => {
  const router = useRouter();
  const [rejectLoading, setRejectLoading] = useState<boolean>(false);
  const [rejectRemark, setRejectRemark] = useState<string>("");
  const [approvalProcesses, setApprovalProcesses] = useState<ApprovalProcess[]>([]);
  const [processesLoading, setProcessesLoading] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchApprovalProcesses = async () => {
      if (!open) return;

      try {
        setProcessesLoading(true);
        const result = await ftw11sqnFlyingExamApprovalProcessService.getAll({ allData: true });

        if (result?.data && Array.isArray(result.data)) {
          setApprovalProcesses(result.data);
        }
      } catch (error) {
        console.error("Error fetching approval processes:", error);
      } finally {
        setProcessesLoading(false);
      }
    };

    fetchApprovalProcesses();
  }, [open]);

  if (!open || !semesterData) return null;

  const currentProgressId = currentApprovalStatus?.progress_id;
  const previousProgressId = currentProgressId ? currentProgressId - 1 : null;

  const currentProcess = approvalProcesses.find((p) => p.id === currentProgressId);
  const previousProcess = approvalProcesses.find((p) => p.id === previousProgressId);

  const currentRoleName = currentProcess?.role?.name || "Current Level";
  const rejectedToRole = previousProcess?.role?.name || "Previous Level";

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
      setRejectRemark("");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectRemark.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    if (rejectRemark.trim().length < 10) {
      alert("Rejection reason must be at least 10 characters");
      return;
    }

    setRejectLoading(true);
    try {
      const previousProgressIdValue = currentApprovalStatus?.progress_id
        ? currentApprovalStatus.progress_id - 1
        : undefined;

      const rejectData = {
        course_id: courseId,
        semester_id: semesterId,
        exam_type: "Flying Mission Examination - 11 Squadron",
        progress_id: previousProgressIdValue,
        status: "active" as const,
        approval_status: "rejected" as const,
        remark: `REJECTED: ${rejectRemark}`,
      };

      await ftw11sqnFlyingExamApprovalStatusService.create(rejectData);

      alert(`Successfully rejected to ${rejectedToRole}!`);
      setRejectRemark("");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
      router.push("/ftw/11sqn/results/flying/results");
    } catch (err: unknown) {
      console.error("Error rejecting:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to reject";
      alert(errorMessage);
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[5000]"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden relative"
      >
        <div className="p-6 max-h-[calc(90vh)] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-6">
            <div className="w-full flex flex-col items-center justify-center">
              <FullLogo />
              <h3 className="text-lg font-medium text-black uppercase underline">
                Reject Examination - Send back to {rejectedToRole}
              </h3>
              <h3 className="text-lg font-medium text-black uppercase underline">
                Flying Mission Examination - 11 Squadron
              </h3>
            </div>
          </div>

          {/* Information Section */}
          <div className="mb-6">
            <p className="text-gray-600 mb-4 text-center">Please review the following information before rejecting:</p>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-black">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider border border-black">
                      Field
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider border border-black">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap border border-black">
                      <div className="text-sm font-semibold text-black">Course Name</div>
                    </td>
                    <td className="px-4 py-3 border border-black">
                      <div className="text-sm text-black">
                        {semesterData.course_details?.title || semesterData.course_details?.name || "N/A"}
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap border border-black">
                      <div className="text-sm font-semibold text-black">Semester Name</div>
                    </td>
                    <td className="px-4 py-3 border border-black">
                      <div className="text-sm text-black">{semesterData.semester_details?.name || "N/A"}</div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap border border-black">
                      <div className="text-sm font-semibold text-black">Exam Type</div>
                    </td>
                    <td className="px-4 py-3 border border-black">
                      <div className="text-sm text-black">Flying Mission Examination - 11 Squadron</div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap border border-black">
                      <div className="text-sm font-semibold text-black">Current Level</div>
                    </td>
                    <td className="px-4 py-3 border border-black">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {currentRoleName}
                        {currentProcess?.status_code && ` (Level ${currentProcess.status_code})`}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap border border-black">
                      <div className="text-sm font-semibold text-black">Rejecting To</div>
                    </td>
                    <td className="px-4 py-3 border border-black">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {rejectedToRole}
                        {previousProcess?.status_code && ` (Level ${previousProcess.status_code})`}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Warning Alert */}
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <Icon icon="solar:danger-triangle-linear" className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-1">Warning:</p>
                <p>
                  By rejecting this examination, you are sending it back from <strong>{currentRoleName}</strong> to{" "}
                  <strong>{rejectedToRole}</strong> for revision. Please provide a clear and detailed reason for
                  rejection.
                </p>
              </div>
            </div>
          </div>

          {/* Rejection Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectRemark}
              onChange={(e) => setRejectRemark(e.target.value)}
              placeholder="Please provide detailed reason for rejection... (minimum 10 characters)"
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              disabled={rejectLoading}
            />
            <p className="mt-1 text-xs text-gray-500">{rejectRemark.length} / 10 characters minimum</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                onClose();
                setRejectRemark("");
              }}
              disabled={rejectLoading}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={rejectLoading || rejectRemark.trim().length < 10}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
            >
              {rejectLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Close button (X) in top-right corner */}
        <button
          onClick={() => {
            onClose();
            setRejectRemark("");
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors duration-200 bg-gray-200 hover:bg-red-500/10 p-1.5 rounded-full"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default RejectModal;
