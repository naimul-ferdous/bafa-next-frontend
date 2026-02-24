"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { ftw12sqnFlyingExamCadetApprovalStatusService } from "@/libs/services/ftw12sqnFlyingExamCadetApprovalStatusService";
import { ftw12sqnFlyingExamApprovalProcessService } from "@/libs/services/ftw12sqnFlyingExamApprovalProcessService";
import { useAuth } from "@/libs/hooks/useAuth";
import type { ApprovalProcess } from "@/libs/types/approval";

interface UserWithRole {
  id: number;
  name?: string;
  role_id?: number;
}

interface CadetData {
  cadet_details: {
    id: number;
    name: string;
    bdno: string;
    rank?: { id: number; name: string };
  };
}

interface BulkCadetApprovalModalProps {
  open: boolean;
  onClose: () => void;
  selectedCadets: CadetData[];
  courseId: number;
  semesterId: number;
  approvalProcess?: ApprovalProcess | null;
  nextLevelProcess?: ApprovalProcess | null;
  onSuccess?: () => void;
}

const BulkCadetApprovalModal = ({
  open,
  onClose,
  selectedCadets,
  courseId,
  semesterId,
  approvalProcess: passedApprovalProcess,
  nextLevelProcess: passedNextLevelProcess,
  onSuccess,
}: BulkCadetApprovalModalProps) => {
  const { user: authUser } = useAuth();
  const user = authUser as UserWithRole | null;

  const [loading, setLoading] = useState(false);
  const [remark, setRemark] = useState("");
  const [approvalProcess, setApprovalProcess] = useState<ApprovalProcess | null>(passedApprovalProcess || null);
  const [nextApprovalProcess, setNextApprovalProcess] = useState<ApprovalProcess | null>(passedNextLevelProcess || null);

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
          if (currentIndex !== -1 && currentIndex < sortedProcesses.length - 1) {
            setNextApprovalProcess(sortedProcesses[currentIndex + 1]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching approval process:", error);
    }
  };

  const handleBulkApprove = async () => {
    if (!approvalProcess) {
      alert("No approval process found for your role");
      return;
    }

    if (selectedCadets.length === 0) {
      alert("No cadets selected");
      return;
    }

    setLoading(true);
    try {
      const cadetIds = selectedCadets.map((cadet) => cadet.cadet_details.id);

      const approvalData = {
        cadet_ids: cadetIds,
        course_id: courseId,
        semester_id: semesterId,
        progress_id: approvalProcess.id,
        send_progress_id: approvalProcess.id,
        next_progress_id: nextApprovalProcess?.id,
        remark: remark || `Bulk approved by ${user?.name || "User"}`,
        approved_by: user?.id,
      };

      await ftw12sqnFlyingExamCadetApprovalStatusService.bulkApprove(approvalData);

      alert(`${selectedCadets.length} cadet(s) approved successfully`);
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error("Error bulk approving cadets:", error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err?.response?.data?.message || "Failed to approve cadets");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Bulk Cadet Approval</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Icon icon="solar:close-circle-linear" className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="solar:users-group-two-rounded-bold" className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">{selectedCadets.length} Cadet(s) Selected</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Selected Cadets</label>
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SL</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">BD No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedCadets.map((cadet, index) => (
                    <tr key={cadet.cadet_details.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{cadet.cadet_details.bdno}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{cadet.cadet_details.rank?.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{cadet.cadet_details.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Remark (Optional)</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional comment for approval..."
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Icon icon="solar:info-circle-bold" className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-800">
                All {selectedCadets.length} selected cadet(s) will be approved at the current approval level.
              </p>
            </div>
          </div>
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
            onClick={handleBulkApprove}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {loading && <Icon icon="solar:loading-linear" className="w-4 h-4 animate-spin" />}
            Approve {selectedCadets.length} Cadet(s)
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkCadetApprovalModal;
