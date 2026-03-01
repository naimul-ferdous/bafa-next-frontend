/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwMarksheetService } from "@/libs/services/atwMarksheetService";
import type { AtwSubjectsModuleMarksheet } from "@/libs/types/system";
import FullLogo from "@/components/ui/fulllogo";

export default function MarksheetDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [marksheet, setMarksheet] = useState<AtwSubjectsModuleMarksheet | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await atwMarksheetService.getMarksheet(parseInt(id));
      if (data) setMarksheet(data);
      else router.push("/atw/subjects/modules/marksheets");
    } catch (error) {
      console.error("Failed to load marksheet:", error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

  if (loading) {
    return <div className="py-20 flex justify-center"><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" /></div>;
  }

  if (!marksheet) return null;

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between no-print">
        <button onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" /> Back
        </button>
        <button onClick={() => window.print()} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors">
          <Icon icon="hugeicons:printer" className="w-4 h-4" /> Print
        </button>
      </div>

      <div className="text-center">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-2xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-lg font-semibold text-gray-700 mt-2 uppercase underline">Marksheet Details</h2>
      </div>

      <div className="grid grid-cols-2 gap-8 border-t border-b py-6 border-gray-100">
        <div>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Marksheet Name</p>
          <p className="text-lg font-bold text-gray-900">{marksheet.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Code</p>
          <p className="text-lg font-mono font-bold text-gray-700">{marksheet.code}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-gray-900 uppercase tracking-widest border-l-4 border-blue-500 pl-3">Components</h3>
        <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                <th className="px-6 py-3 text-left">Sl.</th>
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-center">Exam Mark</th>
                <th className="px-6 py-3 text-center">Weightage (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {marksheet.marks?.map((m, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">{idx + 1}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{m.name}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{m.type || "—"}</td>
                  <td className="px-6 py-4 text-center font-mono text-gray-700">{m.estimate_mark}</td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600">{m.percentage}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-gray-700 uppercase">Total</td>
                <td className="px-6 py-3 text-center text-gray-900 font-mono">
                  {marksheet.marks?.reduce((acc, m) => acc + (parseFloat(String(m.estimate_mark)) || 0), 0).toFixed(0)}
                </td>
                <td className="px-6 py-3 text-center text-blue-700">
                  {marksheet.marks?.reduce((acc, m) => acc + (parseFloat(String(m.percentage)) || 0), 0).toFixed(0)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="pt-8 flex justify-center no-print">
        <button
          onClick={() => router.push(`/atw/subjects/modules/marksheets/${marksheet.id}/edit`)}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
        >
          <Icon icon="hugeicons:pencil-edit-01" className="w-5 h-5" />
          Edit this Marksheet
        </button>
      </div>
    </div>
  );
}
