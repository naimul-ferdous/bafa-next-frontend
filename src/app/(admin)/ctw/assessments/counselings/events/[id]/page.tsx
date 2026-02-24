"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwAssessmentCounselingTypeService } from "@/libs/services/ctwAssessmentCounselingTypeService";
import FullLogo from "@/components/ui/fulllogo";
import type { CtwAssessmentCounselingType } from "@/libs/types/ctw";
import DataTable, { Column } from "@/components/ui/DataTable";

export default function CounselingTypeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const typeId = resolvedParams.id;

  const [type, setType] = useState<CtwAssessmentCounselingType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadType = async () => {
      try {
        setLoading(true);
        const data = await ctwAssessmentCounselingTypeService.getType(parseInt(typeId));
        if (data) {
          setType(data);
        } else {
          setError("Counseling type not found");
        }
      } catch (err) {
        console.error("Failed to load Counseling type:", err);
        setError("Failed to load Counseling type data");
      } finally {
        setLoading(false);
      }
    };

    if (typeId) {
      loadType();
    }
  }, [typeId]);

  const handlePrint = () => {
    window.print();
  };

  const eventColumns: Column<any>[] = [
    { key: "order", header: "Order", headerAlign: "center", className: "text-center w-16", render: (event) => event.order || "—" },
    { key: "event_name", header: "Event Name", className: "font-semibold" },
    { key: "event_code", header: "Event Code", className: "font-mono text-sm" },
    { key: "event_type", header: "Event Type" },
    {
      key: "is_active",
      header: "Status",
      headerAlign: "center",
      className: "text-center",
      render: (event) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${event.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {event.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading Counseling type details...</p>
        </div>
      </div>
    );
  }

  if (error || !type) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Counseling type not found"}</p>
          <button
            onClick={() => router.push("/ctw/assessments/counselings/events")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to List
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
          onClick={() => router.push("/ctw/assessments/counselings/events")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => router.push(`/ctw/assessments/counselings/events/${type.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Type
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
            Assessment Counseling Type Details
          </p>
        </div>

        {/* Basic Information Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase tracking-tight">
            Type Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Course</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold">{type.course?.name} ({type.course?.code})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Type Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{type.type_name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Type Code</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono">{type.type_code}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className={`flex-1 font-bold ${type.is_active ? "text-green-600" : "text-red-600"}`}>
                {type.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            {type.creator && (
              <div className="flex">
                <span className="w-48 text-gray-900 font-medium">Created By</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1">{type.creator.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Semesters Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase tracking-tight">
            Applicable Semesters
          </h2>
          <div className="flex flex-wrap gap-2">
            {type.semesters && type.semesters.length > 0 ? (
              type.semesters.map((s: any) => (
                <span key={s.id} className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-xs font-semibold">
                  {s.semester?.name || s.name || "N/A"}
                </span>
              ))
            ) : (
              <span className="text-gray-500 italic">No semesters associated</span>
            )}
          </div>
        </div>

        {/* Events Matrix Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase tracking-tight">
            Assessment Events Matrix
          </h2>
          <DataTable
            columns={eventColumns}
            data={type.events || []}
            keyExtractor={(event) => event.id.toString()}
            emptyMessage="No assessment events found for this type"
          />
        </div>

        {/* System Information Section */}
        <div className="mb-6 no-print">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase tracking-tight">
            System Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created At</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {type.created_at ? new Date(type.created_at).toLocaleString("en-GB", {
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
                {type.updated_at ? new Date(type.updated_at).toLocaleString("en-GB", {
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

        {/* Footer with date */}
        <div className="mt-12 text-center text-[10px] text-gray-500 font-medium italic">
          <p>Generated on: {new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>
    </div>
  );
}
