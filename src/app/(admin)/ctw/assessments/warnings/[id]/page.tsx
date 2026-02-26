"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwCadetWarningService } from "@/libs/services/ctwCadetWarningService";
import type { CadetWarning } from "@/libs/types/system";
import FullLogo from "@/components/ui/fulllogo";

export default function CtwCadetWarningDetailsPage({ params }: { params: Promise<{ id: string }> }) {
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
        const data = await ctwCadetWarningService.getById(id);
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
            onClick={() => router.push("/ctw/assessments/warnings")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to Warnings
          </button>
        </div>
      </div>
    );
  }

  const warningDate = warning.created_at
    ? new Date(warning.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    })
    : "N/A";

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200 min-h-screen">
      <style>{`
        @media print {
          @page {
            size: A3 portrait;
            margin: 15mm 12mm;
          }

          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .print-no-border {
            border: none !important;
          }

          table {
            border-collapse: collapse !important;
          }

          table, th, td {
            border: 1px solid #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .report-block {
            page-break-before: always;
            break-before: page;
          }

          .report-block:first-child {
            page-break-before: avoid;
            break-before: avoid;
          }

          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ctw/assessments/warnings")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white flex items-center gap-2 transition-all font-bold"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white flex items-center gap-2 transition-all font-bold"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print Report
          </button>
          <button
            onClick={() => router.push(`/ctw/assessments/warnings/${warning.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all font-bold shadow-md active:scale-95"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Warning
          </button>
        </div>
      </div>

     <div className="p-10 cv-content">
        <div className="w-full flex justify-between mb-8 text-xs font-bold">
          <div></div>
          <div>
            <p className="text-center font-medium text-gray-900 uppercase px-4 underline">Confidential</p>
          </div>
          <div></div>
        </div>

        <div className="flex justify-end mb-10">
          <div className="text-left space-y-0.5">
            <FullLogo />
            <p className="font-bold">BAFA-110 (REVISED)</p>
            <p>BAF Academy</p>
            <p>Cdts&apos; Trg Wg</p>
            <p>Jashore</p>
            <p className="mt-1 text-xs text-gray-500">
              Tel: 02477762242 ext 5195
            </p>
            <p className="mt-3 font-semibold">
              {warningDate}
            </p>
          </div>
        </div>

        {/* Recipient Section */}
        <div className="mb-8 space-y-1">
          <p className="mb-1">To:</p>
          <p className="font-bold">
            {warning.cadet?.cadet_number || warning.cadet?.bd_no || "N/A"}
          </p>
          <p className="font-bold">
            {warning.cadet?.rank?.name && `${warning.cadet.rank.name} `}
            {warning.cadet?.name || "N/A"}
          </p>
          <p>
            {warning.course?.name || "N/A"}
          </p>
          <p>
            {warning.semester?.name ? `${warning.semester.name}` : "N/A"}
          </p>
        </div>
        <div className="mb-8">
          <p className="font-bold underline text-sm tracking-wide">
            SUBJ:
            <span className="uppercase ml-2">
              {warning.warning?.name || "WARNING"}
            </span>
          </p>
        </div>
        <div className="mb-12">
          <span className="font-bold">Ref:</span>
          <div
            dangerouslySetInnerHTML={{ __html: warning.remarks || "" }}
            className="mt-2 richtext-content leading-relaxed"
          />
        </div>

        {/* Signature Block */}
        <div className="mt-20 flex justify-end">
          <div className="text-start w-64 pt-2 border-t-2 border-gray-900">
            <p className="font-bold uppercase">
              {warning.creator?.name || "AUTHENTICATING OFFICER"}
            </p>
            <p>
              {warning.creator?.rank || "Squadron Leader"}
            </p>
            <p>
              {warning.creator?.role || "Sqn Cdr & Instr of no 1 Sqn"}
            </p>
            <p>Cadets&apos; Training Wing</p>
            <p>Bangladesh Air Force Academy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
