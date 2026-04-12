/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwGstoAssessmentResultService } from "@/libs/services/ctwGstoAssessmentResultService";
import { ctwDtAssessmentResultService } from "@/libs/services/ctwDtAssessmentResultService";
import FullLogo from "@/components/ui/fulllogo";

const GSTO_ASSESSMENT_MODULE_CODE = "gsto_assessment";

export default function GstoAssessmentCourseSemesterResultPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = parseInt(params?.courseId as string);
  const semesterId = parseInt(params?.semesterId as string);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [semesterDetails, setSemesterDetails] = useState<any>(null);
  const [examType, setExamType] = useState<string>("");
  const [cadets, setCadets] = useState<any[]>([]);

  const [estimatedMark, setEstimatedMark] = useState<any>(null);

  // Per-cadet mark map: cadetId => { achieved_mark, details: { detailId => marks } }
  const [cadetMarksMap, setCadetMarksMap] = useState<Map<number, any>>(new Map());

  // DT/PF generated marks: cadetId => { combined_converted, dt_converted, pf_converted, dt_achieved, pf_achieved, avg_achieved }
  const [generatedCadetMarks, setGeneratedCadetMarks] = useState<Map<number, any>>(new Map());
  const [generatedConfig, setGeneratedConfig] = useState({ dt_conversation_mark: 0, pf_conversation_mark: 0 });

  const loadData = useCallback(async () => {
    if (isNaN(courseId) || isNaN(semesterId)) return;
    try {
      setLoading(true);
      setError("");

      const [data, dtPfRes] = await Promise.all([
        ctwGstoAssessmentResultService.getInitialFetchData({
          module_code: GSTO_ASSESSMENT_MODULE_CODE,
          course_id: courseId,
          semester_id: semesterId,
        }),
        ctwDtAssessmentResultService.getAssessmentObservationDtPf({
          course_id: courseId,
          semester_id: semesterId,
        }),
      ]);

      if (!data) {
        setError("Failed to retrieve initial data");
        return;
      }

      setEstimatedMark(data.estimated_mark_config || null);
      setCourseDetails(data.course_details || null);
      setSemesterDetails(data.semester_details || null);
      setCadets(data.cadets || []);

      if (data.grouped_results && data.grouped_results.length > 0) {
        setExamType(data.grouped_results[0].exam_type || "");

        // Build per-cadet marks from all submissions
        const marksMap = new Map<number, any>();
        for (const group of data.grouped_results) {
          for (const sub of group.submissions || []) {
            const marks: any[] = sub.instructor_details?.marks || [];
            for (const m of marks) {
              const cid = m.cadet_id;
              if (!marksMap.has(cid)) {
                marksMap.set(cid, { achieved_mark: 0, details: {} });
              }
              const entry = marksMap.get(cid)!;
              // achieved_mark: use the latest/sum (GSTO typically one submission)
              entry.achieved_mark = parseFloat(String(m.achieved_mark || 0));
              // details: map by estimated_marks_details_id => marks value
              for (const d of m.details || []) {
                const did = d.ctw_results_module_estimated_marks_details_id;
                if (did) entry.details[did] = parseFloat(d.marks || 0);
              }
            }
          }
        }
        setCadetMarksMap(marksMap);
      } else {
        setError("No results found for this course and semester");
      }

      // DT/PF map
      const dtPfMap = new Map<number, any>();
      (dtPfRes.data || []).forEach((row: any) => dtPfMap.set(row.cadet_id, row));
      setGeneratedCadetMarks(dtPfMap);
      setGeneratedConfig({
        dt_conversation_mark: dtPfRes.dt_conversation_mark || 0,
        pf_conversation_mark: dtPfRes.pf_conversation_mark || 0,
      });

    } catch (err) {
      console.error("Failed to load data:", err);
      setError("An unexpected error occurred while loading data");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived config ────────────────────────────────────────────────────────────
  const allDetails: any[] = useMemo(() => estimatedMark?.details || [], [estimatedMark]);
  const detailsTotal = useMemo(
    () => allDetails.reduce((sum: number, d: any) => sum + parseFloat(d.male_marks || 0), 0),
    [allDetails]
  );
  const ncoTotal = generatedConfig.dt_conversation_mark + generatedConfig.pf_conversation_mark;
  const maxTotal = detailsTotal + ncoTotal;
  const passThreshold = maxTotal * 0.5;

  // Cadets who have marks, sorted by BD number
  const cadetRows = useMemo(() => {
    return cadets
      .filter(c => cadetMarksMap.has(c.id))
      .sort((a: any, b: any) =>
        String(a.cadet_number ?? "").localeCompare(String(b.cadet_number ?? ""), undefined, { numeric: true })
      );
  }, [cadets, cadetMarksMap]);

  const handlePrint = () => window.print();

  // ── Guards ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || cadetRows.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-medium">{error || "No results found"}</p>
          <button
            onClick={() => router.push("/ctw/results/assessment_observation/gsto")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-bold"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Top bar */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ctw/results/assessment_observation/gsto")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:printer" className="w-4 h-4" /> Print
        </button>
      </div>

      <div className="p-8 cv-content">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <p className="font-medium text-gray-900 uppercase tracking-wider pb-2">SQN CDR/GSTO Impression Result Sheet</p>
          <p className="text-sm text-gray-700 uppercase">
            {courseDetails?.name || ""}{semesterDetails?.name ? ` — ${semesterDetails.name}` : ""}{examType ? ` — ${examType}` : ""}
          </p>
        </div>

        {/* Marks Table */}
        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="font-semibold">
                  <th className="border border-black px-2 py-2 text-center align-middle">Ser</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">BD</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Rk</th>
                  <th className="border border-black px-2 py-2 text-left align-middle min-w-[130px]">Name</th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Br</th>
                  {allDetails.map((d: any) => (
                    <th key={d.id} className="border border-black px-1 py-2 text-center align-bottom">
                      <div className="h-32 flex flex-col items-center justify-end w-10 mx-auto">
                        <span className="font-semibold [writing-mode:vertical-rl] rotate-180 text-xs">{d.name} -{parseFloat(d.male_marks || 0)}</span>
                      </div>
                    </th>
                  ))}
                  <th className="border border-black px-1 py-2 text-center align-bottom font-bold text-blue-800">
                    <div className="h-32 flex flex-col items-center justify-end w-10 mx-auto">
                      <span className="[writing-mode:vertical-rl] rotate-180 text-xs">Total -{detailsTotal}</span>
                    </div>
                  </th>
                  <th className="border border-black px-1 py-2 text-center align-bottom font-bold text-orange-700">
                    <div className="h-32 flex flex-col items-center justify-end w-10 mx-auto">
                      <span className="[writing-mode:vertical-rl] rotate-180 text-xs">NCO Instr Assessment -{ncoTotal}</span>
                    </div>
                  </th>
                  <th className="border border-black px-1 py-2 text-center align-bottom font-bold text-green-800">
                    <div className="h-32 flex flex-col items-center justify-end w-10 mx-auto">
                      <span className="[writing-mode:vertical-rl] rotate-180 text-xs">Total OA -{maxTotal}</span>
                    </div>
                  </th>
                  <th className="border border-black px-2 py-2 text-center align-middle">Rmk</th>
                </tr>
              </thead>
              <tbody>
                {cadetRows.map((cadet: any, index: number) => {
                  const entry = cadetMarksMap.get(cadet.id);
                  const genData = generatedCadetMarks.get(cadet.id);
                  const achievedMark = parseFloat(String(entry?.achieved_mark || 0));
                  const combinedConverted = genData?.combined_converted || 0;
                  const totalOA = achievedMark + combinedConverted;
                  const remark = totalOA < passThreshold ? "Failed" : "-";

                  const rank =
                    cadet.assigned_ranks?.find((ar: any) => ar.rank)?.rank?.short_name ||
                    cadet.assigned_ranks?.[0]?.rank?.name ||
                    "OC";
                  const branch =
                    cadet.assigned_branchs?.[0]?.branch?.short_name ||
                    cadet.assigned_branchs?.[0]?.branch?.name ||
                    "—";

                  return (
                    <tr key={cadet.id} className="transition-colors">
                      <td className="border border-black px-2 py-2 text-center font-medium">{index + 1}</td>
                      <td className="border border-black px-2 py-2 text-center font-mono">{cadet.cadet_number || "N/A"}</td>
                      <td className="border border-black px-2 py-2 text-center">{rank}</td>
                      <td className="border border-black px-2 py-2 font-bold uppercase">{cadet.name || "N/A"}</td>
                      <td className="border border-black px-2 py-2 text-center">{branch}</td>
                      {allDetails.map((d: any) => {
                        const v = entry?.details?.[d.id] || 0;
                        return (
                          <td key={d.id} className="border border-black px-2 py-1 text-center">
                            {v > 0 ? v.toFixed(2) : "—"}
                          </td>
                        );
                      })}
                      <td className="border border-black px-2 py-1 text-center font-bold text-blue-800">
                        {achievedMark > 0 ? achievedMark.toFixed(2) : "—"}
                      </td>
                      <td className="border border-black px-2 py-1 text-center font-bold text-orange-700">
                        {combinedConverted > 0 ? combinedConverted.toFixed(2) : "—"}
                      </td>
                      <td className="border border-black px-2 py-1 text-center font-bold text-green-800">
                        {totalOA > 0 ? totalOA.toFixed(2) : "—"}
                      </td>
                      <td className={`border border-black px-2 py-1 text-center font-medium ${remark === "Failed" ? "text-red-600" : "text-gray-400"}`}>
                        {remark}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr className="font-black text-xs">
                  <td colSpan={5 + allDetails.length} className="border border-black px-2 py-2 text-right uppercase">Total</td>
                  <td className="border border-black px-2 py-2 text-center text-blue-800">
                    {Array.from(cadetMarksMap.values())
                      .reduce((sum, e) => sum + parseFloat(String(e.achieved_mark || 0)), 0)
                      .toFixed(2)}
                  </td>
                  <td className="border border-black px-2 py-2 text-center text-orange-700">
                    {Array.from(cadetMarksMap.keys())
                      .reduce((sum, cid) => sum + (generatedCadetMarks.get(cid)?.combined_converted || 0), 0)
                      .toFixed(2)}
                  </td>
                  <td className="border border-black px-2 py-2 text-center text-green-800">
                    {Array.from(cadetMarksMap.keys())
                      .reduce((sum, cid) => {
                        const e = cadetMarksMap.get(cid);
                        const gd = generatedCadetMarks.get(cid);
                        return sum + parseFloat(String(e?.achieved_mark || 0)) + (gd?.combined_converted || 0);
                      }, 0)
                      .toFixed(2)}
                  </td>
                  <td colSpan={100} className="border border-black px-2 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 text-center text-[10px] text-gray-500 font-medium italic">
          <p>Generated on: {new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>
    </div>
  );
}
