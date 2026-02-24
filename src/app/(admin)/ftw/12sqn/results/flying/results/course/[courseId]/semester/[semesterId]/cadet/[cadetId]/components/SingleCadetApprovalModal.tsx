"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { ftw12sqnFlyingExamCadetApprovalStatusService } from "@/libs/services/ftw12sqnFlyingExamCadetApprovalStatusService";
import { ftw12sqnFlyingExamApprovalProcessService } from "@/libs/services/ftw12sqnFlyingExamApprovalProcessService";
import { useAuth } from "@/libs/hooks/useAuth";
import type { ApprovalProcess } from "@/libs/types/approval";

// Extended user type for approval workflow
interface UserWithRole {
  id: number;
  name?: string;
  role_id?: number;
}

interface CadetDetails {
  id: number;
  name: string;
  bdno: string;
  rank?: { id: number; name: string };
}

interface SingleCadetApprovalModalProps {
  open: boolean;
  onClose: () => void;
  cadet: CadetDetails;
  courseId: number;
  semesterId: number;
  approvalProcess?: ApprovalProcess | null;
  nextLevelProcess?: ApprovalProcess | null;
  onSuccess?: () => void;
  mode: "approve" | "reject";
}

const SingleCadetApprovalModal = ({
  open,
  onClose,
  cadet,
  courseId,
  semesterId,
  approvalProcess: passedApprovalProcess,
  nextLevelProcess: passedNextLevelProcess,
  onSuccess,
  mode,
}: SingleCadetApprovalModalProps) => {
  const { user: authUser } = useAuth();
  // Cast user to extended type
  const user = authUser as UserWithRole | null;

  const [loading, setLoading] = useState(false);
  const [remark, setRemark] = useState("");
  const [approvalProcess, setApprovalProcess] = useState<ApprovalProcess | null>(passedApprovalProcess || null);
  const [nextApprovalProcess, setNextApprovalProcess] = useState<ApprovalProcess | null>(passedNextLevelProcess || null);
  const [previousApprovalProcess, setPreviousApprovalProcess] = useState<ApprovalProcess | null>(null);

  useEffect(() => {
    if (passedApprovalProcess) {
      setApprovalProcess(passedApprovalProcess);
    }
    if (passedNextLevelProcess) {
      setNextApprovalProcess(passedNextLevelProcess);
    }
  }, [passedApprovalProcess, passedNextLevelProcess]);

  useEffect(() => {
    if (user?.role_id && open && !passedApprovalProcess) {
      fetchApprovalProcess();
    }
  }, [user?.role_id, open, passedApprovalProcess]);

  const fetchApprovalProcess = async () => {
    if (!user?.role_id) return;

    try {
      const result = await ftw12sqnFlyingExamApprovalProcessService.getByRoleId(user.role_id, { allData: true });
      if (result?.data && Array.isArray(result.data) && result.data.length > 0) {
        const currentProcess = result.data[0];
        setApprovalProcess(currentProcess);

        const allProcesses = await ftw12sqnFlyingExamApprovalProcessService.getAll({ allData: true });
        if (allProcesses?.data && Array.isArray(allProcesses.data)) {
          const sortedProcesses = allProcesses.data.sort(
            (a: ApprovalProcess, b: ApprovalProcess) => parseInt(a.status_code) - parseInt(b.status_code)
          );
          const currentIndex = sortedProcesses.findIndex((p: ApprovalProcess) => p.id === currentProcess.id);

          // Get next process for approval
          if (currentIndex !== -1 && currentIndex < sortedProcesses.length - 1) {
            setNextApprovalProcess(sortedProcesses[currentIndex + 1]);
          }

          // Get previous process for rejection
          if (currentIndex > 0) {
            setPreviousApprovalProcess(sortedProcesses[currentIndex - 1]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching approval process:", error);
    }
  };

  const handleApprove = async () => {
    if (!approvalProcess) {
      alert("No approval process found for your role");
      return;
    }

    setLoading(true);
    try {
      const approvalData = {
        cadet_id: cadet.id,
        course_id: courseId,
        semester_id: semesterId,
        progress_id: approvalProcess.id,
        send_progress_id: approvalProcess.id,
        next_progress_id: nextApprovalProcess?.id,
        approval_status: "approved" as const,
        remark: remark || `Approved by ${user?.name || "User"}`,
        approved_by: user?.id,
      };

      await ftw12sqnFlyingExamCadetApprovalStatusService.create(approvalData);

      alert(`Cadet ${cadet.name} approved successfully`);
      setRemark("");
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error("Error approving cadet:", error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err?.response?.data?.message || "Failed to approve cadet");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!remark.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    if (remark.trim().length < 10) {
      alert("Rejection reason must be at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      const rejectData = {
        cadet_id: cadet.id,
        course_id: courseId,
        semester_id: semesterId,
        progress_id: previousApprovalProcess?.id || (approvalProcess ? approvalProcess.id - 1 : 1),
        send_progress_id: approvalProcess?.id,
        approval_status: "rejected" as const,
        remark: `REJECTED: ${remark}`,
        approved_by: user?.id,
      };

      await ftw12sqnFlyingExamCadetApprovalStatusService.create(rejectData);

      alert(`Cadet ${cadet.name} rejected and sent back for revision`);
      setRemark("");
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error("Error rejecting cadet:", error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err?.response?.data?.message || "Failed to reject cadet");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isApproveMode = mode === "approve";
  const title = isApproveMode ? "Approve Cadet" : "Reject Cadet";
  const actionColor = isApproveMode ? "green" : "red";
  const actionIcon = isApproveMode ? "solar:check-circle-linear" : "solar:close-circle-linear";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className={`text-lg font-semibold ${isApproveMode ? "text-green-800" : "text-red-800"}`}>
            {title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Icon icon="solar:close-circle-linear" className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Cadet Info */}
          <div className="mb-4">
            <div className={`${isApproveMode ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="solar:user-bold" className={`w-5 h-5 ${isApproveMode ? "text-green-600" : "text-red-600"}`} />
                <span className={`font-semibold ${isApproveMode ? "text-green-800" : "text-red-800"}`}>Cadet Information</span>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">BD No:</span> {cadet.bdno}</p>
                <p><span className="font-medium">Name:</span> {cadet.name}</p>
                {cadet.rank && <p><span className="font-medium">Rank:</span> {cadet.rank.name}</p>}
              </div>
            </div>
          </div>

          {/* Approval Info */}
          {approvalProcess && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Icon icon="solar:info-circle-bold" className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Current Approval Level:</p>
                  <p>{approvalProcess.role?.name || "Unknown"} (Level {approvalProcess.status_code})</p>
                  {isApproveMode && nextApprovalProcess && (
                    <p className="mt-1">
                      <span className="font-medium">Next Level:</span> {nextApprovalProcess.role?.name || "Unknown"}
                    </p>
                  )}
                  {!isApproveMode && previousApprovalProcess && (
                    <p className="mt-1">
                      <span className="font-medium">Will be sent back to:</span> {previousApprovalProcess.role?.name || "Previous Level"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Remark */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remark {!isApproveMode && <span className="text-red-500">*</span>}
              {isApproveMode && <span className="text-gray-400">(Optional)</span>}
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isApproveMode ? "Optional comment for approval..." : "Please provide reason for rejection (min 10 characters)..."}
            />
            {!isApproveMode && (
              <p className="mt-1 text-xs text-gray-500">{remark.length} / 10 characters minimum</p>
            )}
          </div>

          {/* Warning for rejection */}
          {!isApproveMode && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Icon icon="solar:danger-triangle-linear" className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">
                  By rejecting this cadet, their examination results will be sent back to the previous level for revision.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={isApproveMode ? handleApprove : handleReject}
            disabled={loading || (!isApproveMode && remark.trim().length < 10)}
            className={`px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center gap-2 bg-${actionColor}-600 hover:bg-${actionColor}-700`}
            style={{ backgroundColor: isApproveMode ? "#16a34a" : "#dc2626" }}
          >
            {loading && <Icon icon="solar:loading-linear" className="w-4 h-4 animate-spin" />}
            <Icon icon={actionIcon} className="w-4 h-4" />
            {isApproveMode ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleCadetApprovalModal;
