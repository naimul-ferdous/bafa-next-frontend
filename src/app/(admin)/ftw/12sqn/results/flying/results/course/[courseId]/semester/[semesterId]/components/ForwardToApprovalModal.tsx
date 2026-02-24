"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import { ftw12sqnFlyingExamApprovalStatusService } from "@/libs/services/ftw12sqnFlyingExamApprovalStatusService";
import { ftw12sqnFlyingExamCadetApprovalStatusService } from "@/libs/services/ftw12sqnFlyingExamCadetApprovalStatusService";
import { ftw12sqnFlyingExamApprovalProcessService } from "@/libs/services/ftw12sqnFlyingExamApprovalProcessService";
import { useAuth } from "@/libs/hooks/useAuth";
import type { ApprovalStatus, ApprovalProcess, ApprovalSummary } from "@/libs/types/approval";

interface UserWithRole {
  id: number;
  name?: string;
  role_id?: number;
}

interface ForwardToApprovalModalProps {
  open: boolean;
  onClose: () => void;
  semesterData: {
    course_details?: { id: number; title?: string; name?: string };
    semester_details?: { id: number; name: string };
    cadet_mission_examinations?: { cadet_details: { id: number } }[];
    cadets?: { cadet_details: { id: number } }[];
  } | null;
  courseId: number;
  semesterId: number;
  currentApprovalStatus?: ApprovalStatus | null;
  approvalProcess?: ApprovalProcess | null;
  nextLevelProcess?: ApprovalProcess | null;
  onSuccess?: () => void;
}

const ForwardToApprovalModal = ({
  open,
  onClose,
  semesterData,
  courseId,
  semesterId,
  currentApprovalStatus,
  approvalProcess: passedApprovalProcess,
  nextLevelProcess,
  onSuccess,
}: ForwardToApprovalModalProps) => {
  const { user: authUser } = useAuth();
  const user = authUser as UserWithRole | null;
  const [forwardLoading, setForwardLoading] = useState<boolean>(false);
  const [approvalSummary, setApprovalSummary] = useState<ApprovalSummary | null>(null);
  const [approvalSummaryLoading, setApprovalSummaryLoading] = useState<boolean>(false);
  const [approvalProcess, setApprovalProcess] = useState<ApprovalProcess | null>(passedApprovalProcess || null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && semesterData && user?.role_id) {
      fetchApprovalSummary();
      fetchApprovalProcess();
    }
  }, [open, semesterData, user?.role_id]);

  const fetchApprovalProcess = async () => {
    if (!user?.role_id) return;

    try {
      const result = await ftw12sqnFlyingExamApprovalProcessService.getByRoleId(user.role_id, { allData: true });
      if (result?.data && Array.isArray(result.data) && result.data.length > 0) {
        setApprovalProcess(result.data[0]);
      }
    } catch (error) {
      console.error("Error fetching approval process:", error);
    }
  };

  const fetchApprovalSummary = async () => {
    if (!courseId || !semesterId || !user?.role_id) return;

    setApprovalSummaryLoading(true);
    try {
      const processResult = await ftw12sqnFlyingExamApprovalProcessService.getByRoleId(user.role_id, { allData: true });

      if (processResult?.data && Array.isArray(processResult.data) && processResult.data.length > 0) {
        const currentProcess = processResult.data[0];

        const result = await ftw12sqnFlyingExamCadetApprovalStatusService.getApprovalSummary(
          courseId,
          semesterId,
          currentProcess.id
        );

        if (result) {
          setApprovalSummary(result);
        }
      }
    } catch (error) {
      console.error("Error fetching approval summary:", error);
    } finally {
      setApprovalSummaryLoading(false);
    }
  };

  if (!open || !semesterData) return null;

  const isFinalLevel = approvalProcess?.is_final === true;
  const noNeedForward = approvalProcess?.no_need_forward === true;
  const hasNextLevel = !isFinalLevel && !noNeedForward && nextLevelProcess !== null && nextLevelProcess !== undefined;

  const currentStatus = currentApprovalStatus?.progress_id ? currentApprovalStatus.progress_id : 0;
  const nextStatus = currentStatus + 1;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirmForward = async () => {
    if (approvalSummary && !approvalSummary.can_forward && !noNeedForward) {
      if (approvalSummary.has_rejected) {
        alert(`Cannot forward: ${approvalSummary.rejected_count} cadet(s) rejected.`);
      } else if (approvalSummary.pending_count > 0) {
        alert(`Cannot forward: ${approvalSummary.pending_count} cadet(s) pending approval.`);
      } else {
        alert("Cannot forward: Not all cadets have been approved.");
      }
      return;
    }

    setForwardLoading(true);
    try {
      let nextProgressId: number | undefined;
      let remarkText;
      const totalCadets = semesterData.cadet_mission_examinations?.length || semesterData.cadets?.length || 0;

      if (noNeedForward) {
        nextProgressId = approvalProcess?.id;
        remarkText = `Approved by ${currentRoleName} with ${totalCadets} cadets (no forwarding required)`;
      } else if (hasNextLevel && nextLevelProcess) {
        nextProgressId = nextLevelProcess.id;
        remarkText = `Forwarded to ${nextRoleName} with ${totalCadets} cadets`;
      } else {
        nextProgressId = approvalProcess?.id;
        remarkText = `Final approval completed with ${totalCadets} cadets`;
      }

      const approvalData = {
        course_id: courseId,
        semester_id: semesterId,
        exam_type: "Flying Mission Examination - 12 Squadron",
        progress_id: nextProgressId,
        send_progress_id: approvalProcess?.id,
        next_progress_id: hasNextLevel ? nextLevelProcess?.id : undefined,
        status: "active" as const,
        approval_status: "approved" as const,
        remark: remarkText,
        created_by: user?.id,
      };

      await ftw12sqnFlyingExamApprovalStatusService.create(approvalData);

      if (noNeedForward) {
        alert(`Successfully approved by ${currentRoleName}!`);
      } else if (hasNextLevel) {
        alert(`Successfully forwarded to ${nextRoleName}!`);
      } else {
        alert("Final approval completed successfully!");
      }

      onClose();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      console.error("Error forwarding to approval:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to forward to approval";
      alert(errorMessage);
    } finally {
      setForwardLoading(false);
    }
  };

  const totalCadets = semesterData.cadet_mission_examinations?.length || semesterData.cadets?.length || 0;

  const statusRoleMap: { [key: number]: string } = {
    0: "Draftman",
    1: "Flt Cdr",
    2: "OC Sqn",
    3: "OC FTW",
    4: "CPTC",
    5: "CI",
    6: "Comdr",
    7: "Air HQ",
  };

  const nextRoleName = nextLevelProcess?.role?.name || statusRoleMap[nextStatus] || "Next Level";
  const currentRoleName = approvalProcess?.role?.name || statusRoleMap[currentStatus] || "Initial";

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
                {noNeedForward
                  ? "Approve Cadets"
                  : hasNextLevel
                    ? `Forward to ${nextRoleName}`
                    : "Final Approval"}
              </h3>
              <h3 className="text-lg font-medium text-black uppercase underline">
                Flying Mission Examination - 12 Squadron
              </h3>
            </div>
          </div>

          {/* Cadet Approval Summary */}
          {approvalSummaryLoading && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Icon icon="solar:loading-linear" className="w-5 h-5 animate-spin text-gray-600" />
                <span className="text-sm text-gray-600">Checking cadet approval status...</span>
              </div>
            </div>
          )}

          {!approvalSummaryLoading && approvalSummary && (
            <div
              className={`mb-6 border rounded-lg p-4 ${
                approvalSummary.can_forward || noNeedForward ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon
                  icon={approvalSummary.can_forward || noNeedForward ? "solar:check-circle-bold" : "solar:danger-triangle-bold"}
                  className={`w-6 h-6 mt-0.5 flex-shrink-0 ${
                    approvalSummary.can_forward || noNeedForward ? "text-green-600" : "text-red-600"
                  }`}
                />
                <div className="flex-1">
                  <h4
                    className={`font-semibold mb-2 ${
                      approvalSummary.can_forward || noNeedForward ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    Cadet Approval Status
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="bg-white/50 rounded p-2">
                      <div className="text-xs text-gray-600">Total Cadets</div>
                      <div className="text-lg font-bold text-gray-900">{approvalSummary.total_cadets}</div>
                    </div>
                    <div className="bg-white/50 rounded p-2">
                      <div className="text-xs text-green-600">Approved</div>
                      <div className="text-lg font-bold text-green-600">{approvalSummary.approved_count}</div>
                    </div>
                    <div className="bg-white/50 rounded p-2">
                      <div className="text-xs text-red-600">Rejected</div>
                      <div className="text-lg font-bold text-red-600">{approvalSummary.rejected_count}</div>
                    </div>
                    <div className="bg-white/50 rounded p-2">
                      <div className="text-xs text-yellow-600">Pending</div>
                      <div className="text-lg font-bold text-yellow-600">{approvalSummary.pending_count}</div>
                    </div>
                  </div>
                  {!approvalSummary.can_forward && !noNeedForward && (
                    <p className="text-sm text-red-700">
                      {approvalSummary.has_rejected
                        ? `Cannot forward: ${approvalSummary.rejected_count} cadet(s) have been rejected.`
                        : `Cannot forward: ${approvalSummary.pending_count} cadet(s) are still pending approval.`}
                    </p>
                  )}
                  {(approvalSummary.can_forward || noNeedForward) && (
                    <p className="text-sm text-green-700">All cadets have been approved. You can proceed.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Information Section */}
          <div className="mb-6">
            <p className="text-gray-600 mb-4 text-center">
              {noNeedForward
                ? "Please review the following information before approval:"
                : hasNextLevel
                  ? "Please review the following information before forwarding to approval:"
                  : "Please review the following information before final approval:"}
            </p>

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
                      <div className="text-sm font-semibold text-black">Total Cadets</div>
                    </td>
                    <td className="px-4 py-3 border border-black">
                      <div className="text-sm font-bold text-blue-600">{totalCadets}</div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap border border-black">
                      <div className="text-sm font-semibold text-black">Exam Type</div>
                    </td>
                    <td className="px-4 py-3 border border-black">
                      <div className="text-sm text-black">Flying Mission Examination - 12 Squadron</div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap border border-black">
                      <div className="text-sm font-semibold text-black">Current Level</div>
                    </td>
                    <td className="px-4 py-3 border border-black">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {currentRoleName}
                      </span>
                    </td>
                  </tr>
                  {noNeedForward ? (
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap border border-black">
                        <div className="text-sm font-semibold text-black">Action</div>
                      </td>
                      <td className="px-4 py-3 border border-black">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Approve Only (No Forwarding Required)
                        </span>
                      </td>
                    </tr>
                  ) : hasNextLevel ? (
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap border border-black">
                        <div className="text-sm font-semibold text-black">Forwarding To</div>
                      </td>
                      <td className="px-4 py-3 border border-black">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {nextRoleName}
                        </span>
                      </td>
                    </tr>
                  ) : (
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap border border-black">
                        <div className="text-sm font-semibold text-black">Action</div>
                      </td>
                      <td className="px-4 py-3 border border-black">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Final Approval (No Further Forwarding)
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Information Alert */}
          <div
            className={`mb-6 rounded-lg p-4 ${
              noNeedForward
                ? "bg-orange-50 border border-orange-200"
                : hasNextLevel
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-green-50 border border-green-200"
            }`}
          >
            <div className="flex items-start">
              <Icon
                icon="solar:info-circle-linear"
                className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                  noNeedForward ? "text-orange-600" : hasNextLevel ? "text-blue-600" : "text-green-600"
                }`}
              />
              <div className={`text-sm ${noNeedForward ? "text-orange-800" : hasNextLevel ? "text-blue-800" : "text-green-800"}`}>
                <p className="font-semibold mb-1">Important Information:</p>
                {noNeedForward ? (
                  <p>
                    By approving this examination data, you are recording approval at the <strong>{currentRoleName}</strong>{" "}
                    level. This role does not require forwarding to the next level.
                  </p>
                ) : hasNextLevel ? (
                  <p>
                    By forwarding this examination data, you are submitting it from <strong>{currentRoleName}</strong>{" "}
                    to <strong>{nextRoleName}</strong> for review and approval.
                  </p>
                ) : (
                  <p>
                    By approving this examination data, you are marking it as <strong>FINAL APPROVED</strong>. This is
                    the last level of approval.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={forwardLoading}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmForward}
              disabled={forwardLoading || (approvalSummary !== null && !approvalSummary.can_forward && !noNeedForward)}
              className={`px-5 py-2.5 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2 ${
                noNeedForward
                  ? "bg-orange-600 hover:bg-orange-700"
                  : hasNextLevel
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {forwardLoading ? (
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
                  <span>{noNeedForward ? "Approving..." : hasNextLevel ? "Forwarding..." : "Approving..."}</span>
                </>
              ) : (
                <>
                  <Icon icon={noNeedForward || !hasNextLevel ? "solar:check-circle-bold" : "solar:forward-linear"} className="w-4 h-4" />
                  <span>
                    {noNeedForward
                      ? "Confirm Approval"
                      : hasNextLevel
                        ? "Confirm & Forward"
                        : "Confirm Final Approval"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Close button (X) in top-right corner */}
        <button
          onClick={onClose}
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

export default ForwardToApprovalModal;
