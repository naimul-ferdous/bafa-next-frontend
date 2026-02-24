"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwCadetWarningService } from "@/libs/services/atwCadetWarningService";
import FullLogo from "@/components/ui/fulllogo";
import type { CadetWarning } from "@/libs/types/system";

export default function CadetWarningDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = parseInt(resolvedParams.id);

  const [warning, setWarning] = useState<CadetWarning | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWarning = async () => {
      try {
        setLoading(true);
        const data = await atwCadetWarningService.getById(id);
        if (data) {
          setWarning(data);
        } else {
          setError("Warning not found");
        }
      } catch (err) {
        console.error("Failed to load warning:", err);
        setError("Failed to load warning data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadWarning();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading warning details...</p>
        </div>
      </div>
    );
  }

  if (error || !warning) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Warning not found"}</p>
          <button
            onClick={() => router.push("/atw/assessments/warnings")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to Warnings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/atw/assessments/warnings")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => router.push(`/atw/assessments/warnings/${warning.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Warning
          </button>
        </div>
      </div>

      {/* CV Content */}
      <div className="p-8 cv-content">
        {/* Header with Logo */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            Cadet Warning Detail Report
          </p>
        </div>

        {/* Cadet Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Cadet Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Cadet Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{warning.cadet?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">BD Number</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono font-bold">{warning.cadet?.bd_no || warning.cadet?.bdno || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Rank</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{warning.cadet?.rank?.name || "Cadet"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Flight / Wing</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{warning.cadet?.flight?.name || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Warning Details Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Warning Details
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Warning Type</span>
              <span className="mr-4">:</span>
              <span className="text-red-600 flex-1 font-bold">{warning.warning?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Mark Deduction</span>
              <span className="mr-4">:</span>
              <span className="text-red-700 flex-1 font-bold">-{Number(warning.warning?.reduced_mark || 0).toFixed(1)}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className={`flex-1 font-bold ${warning.is_active ? "text-red-600" : "text-green-600"}`}>
                {warning.is_active ? "Active" : "Resolved / Revoked"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Warning Date</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {warning.created_at ? new Date(warning.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "N/A"}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <span className="w-48 text-gray-900 font-medium block mb-2">Remarks:</span>
            <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 italic text-sm">
              {warning.remarks || "No additional remarks provided."}
            </div>
          </div>
        </div>

        {/* Academic Context Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Academic Context
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Course Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{warning.course?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Course Code</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono">{warning.course?.code || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Semester</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{warning.semester?.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Assigned By</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{warning.creator?.name || "System"}</span>
            </div>
          </div>
        </div>

        {/* System Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            System Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created At</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {warning.created_at ? new Date(warning.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Last Updated</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {warning.updated_at ? new Date(warning.updated_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Signature Section for Print */}
        <div className="hidden print:grid grid-cols-3 gap-12 mt-24">
          <div className="text-center"><div className="border-t-2 border-black pt-3"><p className="font-bold text-sm uppercase tracking-widest">Instructor</p></div></div>
          <div className="text-center"><div className="border-t-2 border-black pt-3"><p className="font-bold text-sm uppercase tracking-widest">Chief Instructor</p></div></div>
          <div className="text-center"><div className="border-t-2 border-black pt-3"><p className="font-bold text-sm uppercase tracking-widest">Commandant</p></div></div>
        </div>

        {/* Footer with date */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}
