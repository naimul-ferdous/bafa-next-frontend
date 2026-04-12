"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useAuth } from "@/libs/hooks/useAuth";
import { ctwApprovalService } from "@/libs/services/ctwApprovalService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

interface CadetRow {
  cadet_id: number;
  cadet_name: string;
  cadet_number: string;
  cadet_rank: string;
  branch: string;
  total_mark: number;
  approval_status: string;
  rejected_reason?: string;
  can_approve: boolean;
}

export default function CtwModuleCadetApprovalPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const courseId = parseInt(params.courseId as string);
  const semesterId = parseInt(params.semesterId as string);
  const moduleId = parseInt(params.moduleId as string);

  const [cadets, setCadets] = useState<CadetRow[]>([]);
  const [moduleName, setModuleName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCadets, setSelectedCadets] = useState<number[]>([]);
  const [bulkApproveModal, setBulkApproveModal] = useState(false);
  const [bulkRejectModal, setBulkRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const marksRes = await ctwResultsModuleService.getEstimatedMarks(moduleId, {
        course_id: courseId,
        semester_id: semesterId,
      });

      if (marksRes && marksRes.length > 0) {
        const firstMark = marksRes[0];
        if (firstMark.module) {
          setModuleName(firstMark.module.full_name || firstMark.module.name || "Module");
        }
      }

      const cadetParams: any = {
        ctw_results_module_id: moduleId,
        course_id: courseId,
        semester_id: semesterId,
      };

      try {
        const resultRes = await ctwResultsModuleService.getAllResults(moduleId, {
          course_id: courseId,
          semester_id: semesterId,
          per_page: 500,
        });

        if (resultRes?.data) {
          const rows: CadetRow[] = [];
          resultRes.data.forEach((result: any) => {
            if (result.achieved_marks) {
              result.achieved_marks.forEach((mark: any) => {
                rows.push({
                  cadet_id: mark.cadet_id,
                  cadet_name: mark.cadet?.name || "Unknown",
                  cadet_number: mark.cadet?.cadet_number || "",
                  cadet_rank: mark.cadet?.assigned_ranks?.[0]?.rank?.short_name || "-",
                  branch: result.branch?.name || "N/A",
                  total_mark: mark.achieved_mark || 0,
                  approval_status: mark.approval_status || "pending",
                  rejected_reason: mark.rejected_reason,
                  can_approve: mark.can_approve ?? true,
                });
              });
            }
          });
          setCadets(rows);
        }
      } catch {
        setCadets([]);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load module data.");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId, moduleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApproveCadets = async () => {
    if (selectedCadets.length === 0) return;
    try {
      setActionLoading(true);
      await ctwApprovalService.approveCadets({
        course_id: courseId,
        semester_id: semesterId,
        module_id: moduleId,
        cadet_ids: selectedCadets,
        status: "approved",
      });
      setSelectedCadets([]);
      setBulkApproveModal(false);
      await loadData();
    } catch (err) {
      console.error("Failed to approve cadets:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCadets = async () => {
    if (selectedCadets.length === 0 || !rejectReason.trim()) return;
    try {
      setActionLoading(true);
      await ctwApprovalService.approveCadets({
        course_id: courseId,
        semester_id: semesterId,
        module_id: moduleId,
        cadet_ids: selectedCadets,
        status: "rejected",
        rejected_reason: rejectReason,
      });
      setSelectedCadets([]);
      setBulkRejectModal(false);
      setRejectReason("");
      await loadData();
    } catch (err) {
      console.error("Failed to reject cadets:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleCadetSelection = (cadetId: number) => {
    setSelectedCadets(prev =>
      prev.includes(cadetId) ? prev.filter(id => id !== cadetId) : [...prev, cadetId]
    );
  };

  const toggleSelectAll = () => {
    const approvable = cadets.filter(c => c.can_approve && c.approval_status !== "approved");
    if (selectedCadets.length === approvable.length) {
      setSelectedCadets([]);
    } else {
      setSelectedCadets(approvable.map(c => c.cadet_id));
    }
  };

  const columns: Column<CadetRow>[] = [
    {
      key: "select",
      header: "",
      headerAlign: "center",
      className: "text-center w-10",
      render: (cadet) => (
        cadet.can_approve && cadet.approval_status !== "approved" ? (
          <input
            type="checkbox"
            checked={selectedCadets.includes(cadet.cadet_id)}
            onChange={() => toggleCadetSelection(cadet.cadet_id)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        ) : null
      ),
    },
    {
      key: "sl",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900",
      render: (_, index) => index + 1,
    },
    {
      key: "cadet_number",
      header: "BD No.",
      className: "text-center font-mono",
      render: (row) => row.cadet_number,
    },
    {
      key: "rank",
      header: "Rank",
      className: "text-center",
      render: (row) => row.cadet_rank,
    },
    {
      key: "name",
      header: "Name",
      render: (row) => <span className="font-medium text-gray-900">{row.cadet_name}</span>,
    },
    {
      key: "branch",
      header: "Branch",
      className: "text-gray-700",
      render: (row) => row.branch,
    },
    {
      key: "mark",
      header: "Mark",
      headerAlign: "center",
      className: "text-center font-mono",
      render: (row) => row.total_mark.toFixed(2),
    },
    {
      key: "status",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (row) => {
        if (row.approval_status === "approved") {
          return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-800">APPROVED</span>;
        }
        if (row.approval_status === "rejected") {
          return (
            <div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-800">REJECTED</span>
              {row.rejected_reason && <p className="text-[10px] text-red-600 mt-1">{row.rejected_reason}</p>}
            </div>
          );
        }
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-100 text-yellow-800">PENDING</span>;
      },
    },
  ];

  const approvableCadets = cadets.filter(c => c.can_approve && c.approval_status !== "approved");

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">CTW Cadet Approval - {moduleName}</h2>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <button onClick={() => router.push(`/ctw/results/view/course/${courseId}/semester/${semesterId}`)} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-1">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" /> Back
        </button>
        {selectedCadets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedCadets.length} selected</span>
            <button onClick={() => setBulkApproveModal(true)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" /> Approve
            </button>
            <button onClick={() => setBulkRejectModal(true)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1">
              <Icon icon="hugeicons:cancel-01" className="w-4 h-4" /> Reject
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="w-full min-h-[20vh] flex items-center justify-center">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          {approvableCadets.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={selectedCadets.length === approvableCadets.length && approvableCadets.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Select All ({approvableCadets.length} approvable)</span>
            </div>
          )}
          <DataTable
            columns={columns}
            data={cadets}
            keyExtractor={(row) => `${row.cadet_id}`}
            emptyMessage="No cadets found for this module"
          />
        </>
      )}

      <ConfirmationModal
        isOpen={bulkApproveModal}
        onClose={() => setBulkApproveModal(false)}
        onConfirm={handleApproveCadets}
        title="Approve Cadets"
        message={`Are you sure you want to approve ${selectedCadets.length} cadet(s)?`}
        confirmText="Approve"
        cancelText="Cancel"
        loading={actionLoading}
        variant="success"
      />

      <ConfirmationModal
        isOpen={bulkRejectModal}
        onClose={() => { setBulkRejectModal(false); setRejectReason(""); }}
        onConfirm={handleRejectCadets}
        title="Reject Cadets"
        message={
          <div>
            <p className="mb-3">Are you sure you want to reject {selectedCadets.length} cadet(s)?</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white text-gray-900"
              rows={3}
            />
          </div>
        }
        confirmText="Reject"
        cancelText="Cancel"
        loading={actionLoading}
        variant="danger"
      />
    </div>
  );
}
