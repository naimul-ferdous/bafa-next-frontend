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

interface ModuleRow {
  module_id: number;
  module_name: string;
  module_code: string;
  total_cadets: number;
  approved_cadets: number;
  pending_cadets: number;
  rejected_cadets: number;
  status: string;
  can_approve: boolean;
  can_forward: boolean;
}

export default function CtwSemesterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const courseId = parseInt(params.courseId as string);
  const semesterId = parseInt(params.semesterId as string);

  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardModuleId, setForwardModuleId] = useState<number | null>(null);
  const [forwardLoading, setForwardLoading] = useState(false);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveModuleId, setApproveModuleId] = useState<number | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  const loadModules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ctwApprovalService.getModuleWiseBySemester({
        course_id: courseId,
        semester_id: semesterId,
      });

      const rows: ModuleRow[] = (data || []).map((item: any) => ({
        module_id: item.module_id,
        module_name: item.module?.full_name || item.module?.name || "N/A",
        module_code: item.module?.code || "",
        total_cadets: item.total_cadets || 0,
        approved_cadets: item.approved_cadets || 0,
        pending_cadets: item.pending_cadets || 0,
        rejected_cadets: item.rejected_cadets || 0,
        status: item.status || "pending",
        can_approve: item.can_approve || false,
        can_forward: item.can_forward || false,
      }));

      setModules(rows);
    } catch (err) {
      console.error("Failed to load modules:", err);
      setError("Failed to load module data.");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const handleForward = (moduleId: number) => {
    setForwardModuleId(moduleId);
    setForwardModalOpen(true);
  };

  const confirmForward = async () => {
    if (!forwardModuleId) return;
    try {
      setForwardLoading(true);
      await ctwApprovalService.forwardModule({
        course_id: courseId,
        semester_id: semesterId,
        module_id: forwardModuleId,
      });
      await loadModules();
      setForwardModalOpen(false);
    } catch (err) {
      console.error("Failed to forward module:", err);
    } finally {
      setForwardLoading(false);
    }
  };

  const handleApprove = (moduleId: number) => {
    setApproveModuleId(moduleId);
    setApproveModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!approveModuleId) return;
    try {
      setApproveLoading(true);
      await ctwApprovalService.approveModule({
        course_id: courseId,
        semester_id: semesterId,
        module_id: approveModuleId,
        status: "approved",
      });
      await loadModules();
      setApproveModalOpen(false);
    } catch (err) {
      console.error("Failed to approve module:", err);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleViewModule = (row: ModuleRow) => {
    router.push(`/ctw/results/view/course/${courseId}/semester/${semesterId}/module/${row.module_id}`);
  };

  const columns: Column<ModuleRow>[] = [
    {
      key: "sl",
      header: "SL.",
      headerAlign: "center",
      className: "text-center text-gray-900",
      render: (_, index) => index + 1,
    },
    {
      key: "module",
      header: "Module",
      className: "font-medium text-gray-900",
      render: (row) => row.module_name,
    },
    {
      key: "cadets",
      header: "Cadets",
      headerAlign: "center",
      className: "text-center",
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">{row.total_cadets}</span>
          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">{row.approved_cadets} ✓</span>
          {row.pending_cadets > 0 && <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">{row.pending_cadets} ⏳</span>}
          {row.rejected_cadets > 0 && <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">{row.rejected_cadets} ✗</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (row) => {
        if (row.status === "approved") {
          return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-100 text-green-800">APPROVED</span>;
        }
        if (row.status === "forwarded") {
          return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">FORWARDED</span>;
        }
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-yellow-100 text-yellow-800">PENDING</span>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => handleViewModule(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View">
            <Icon icon="hugeicons:view" className="w-4 h-4" />
          </button>
          {row.can_forward && row.status !== "approved" && (
            <button onClick={() => handleForward(row.module_id)} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Forward">
              <Icon icon="hugeicons:arrow-right-02" className="w-4 h-4" />
            </button>
          )}
          {row.can_approve && row.status !== "approved" && (
            <button onClick={() => handleApprove(row.module_id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve">
              <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">CTW Semester Approval - Module Wise</h2>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push("/ctw/results/view")} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-1">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" /> Back
        </button>
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
        <DataTable
          columns={columns}
          data={modules}
          keyExtractor={(row) => row.module_id.toString()}
          emptyMessage="No modules found for this semester"
        />
      )}

      <ConfirmationModal
        isOpen={forwardModalOpen}
        onClose={() => setForwardModalOpen(false)}
        onConfirm={confirmForward}
        title="Forward Module"
        message="Are you sure you want to forward this module to the next authority?"
        confirmText="Forward"
        cancelText="Cancel"
        loading={forwardLoading}
        variant="info"
      />

      <ConfirmationModal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        onConfirm={confirmApprove}
        title="Approve Module"
        message="Are you sure you want to approve this module?"
        confirmText="Approve"
        cancelText="Cancel"
        loading={approveLoading}
        variant="success"
      />
    </div>
  );
}
