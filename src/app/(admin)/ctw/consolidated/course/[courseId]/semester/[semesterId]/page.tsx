/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwResultService } from "@/libs/services/ctwResultService";
import { ctwGstoAssessmentResultService } from "@/libs/services/ctwGstoAssessmentResultService";
import { ctwDtAssessmentResultService } from "@/libs/services/ctwDtAssessmentResultService";
import { courseService } from "@/libs/services/courseService";
import { semesterService } from "@/libs/services/semesterService";
import FullLogo from "@/components/ui/fulllogo";
import { getOrdinal } from "@/libs/utils/formatter";
import { FilePrintType } from "@/libs/types/filePrintType";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";

function SignatureBox({ auth, signer, approvedAt, position }: {
  auth: any;
  signer: { name: string; rank?: { name: string; short_name: string } | null; signature?: string | null; designation?: string | null } | null;
  approvedAt?: string | null;
  position?: 'first' | 'middle' | 'last';
}) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const dateStr = approvedAt ? (() => {
    const d = new Date(approvedAt);
    return `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}-${d.getFullYear()}`;
  })() : null;
  const label = position === 'first' ? 'Prepared & Checked By' : position === 'last' ? 'Approved By' : auth.role?.name ?? auth.user?.name ?? '—';
  const roleName = auth.role?.name ?? auth.user?.name ?? null;
  return (
    <div className="signature-box flex flex-col items-start min-w-[180px]">
      {/* <p className="sig-label text-sm font-bold uppercase text-gray-900 mb-1 tracking-wide">{label}</p> */}
      <div className="sig-area w-full flex items-end justify-start pb-1 h-16">
        {signer?.signature && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signer.signature} alt="" className="max-h-14 max-w-[150px] object-contain" onError={() => setImgFailed(true)} />
        ) : (
          <span className="text-sm italic text-gray-400">—</span>
        )}
      </div>
      {signer ? (
        <>
          <p className="sig-name text-sm font-bold text-gray-900 uppercase mt-1">{signer.name}</p>
          {signer?.rank?.short_name && <p className="sig-rank text-xs font-semibold text-orange-500">{signer.rank.short_name}</p>}
          {signer?.designation && <p className="sig-designation text-xs text-gray-700">{signer.designation}</p>}
          {dateStr && <p className="sig-date text-xs text-gray-500 pt-0.5 border-t border-gray-800 mt-1">{dateStr}</p>}
        </>
      ) : (
        roleName && (
          <>
            <p className="text-sm text-gray-700 mt-1">{roleName}</p>
            <p className="text-xs text-gray-400 pt-0.5 border-t border-gray-800 mt-1 w-full">Date: ___________</p>
          </>
        )
      )}
    </div>
  );
}

export default function CtwCourseSemesterConsolidatedPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.courseId as string);
  const semesterId = parseInt(params.semesterId as string);

  const [consolidatedData, setConsolidatedData] = useState<any[]>([]);
  const [consolidateTab, setConsolidateTab] = useState<string>("main");
  const [course, setCourse] = useState<any>(null);
  const [semester, setSemester] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
   const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);
  // Per-cadet GSTO details (last-write-wins) fetched from the gsto_assessment endpoint
  // so values match the GSTO Impression page exactly.
  const [gstoCadetDetails, setGstoCadetDetails] = useState<Map<number, Record<number, number>>>(new Map());
  // Per-cadet DT/PF avg_achieved fetched from the assessment observation endpoint
  const [dtPfAvgByCadet, setDtPfAvgByCadet] = useState<Map<number, number>>(new Map());
  // Per-cadet authoritative dt_converted/pf_converted from the DT/PF assessment endpoint
  const [dtPfConvertedByCadet, setDtPfConvertedByCadet] = useState<
    Map<number, { dt_converted: number; pf_converted: number }>
  >(new Map());
  // Approval data (used for the signature section) — sourced from the GSTO assessment fetch
  const [approvalAuthorities, setApprovalAuthorities] = useState<any[]>([]);
  const [moduleApprovals, setModuleApprovals] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [consolidatedRes, courseRes, semesterRes, gstoRes, dtPfRes] = await Promise.all([
        ctwResultService.getConsolidatedResults({ course_id: courseId, semester_id: semesterId }),
        courseService.getCourse(courseId),
        semesterService.getSemester(semesterId),
        ctwGstoAssessmentResultService.getInitialFetchData({
          module_code: "gsto_assessment",
          course_id: courseId,
          semester_id: semesterId,
        }).catch(() => null),
        ctwDtAssessmentResultService.getAssessmentObservationDtPf({
          course_id: courseId,
          semester_id: semesterId,
        }).catch(() => null),
      ]);
      if (consolidatedRes.success) {
        setConsolidatedData(consolidatedRes.data);
      } else {
        setError(consolidatedRes.message || "Failed to fetch results");
      }
      setCourse(courseRes);
      setSemester(semesterRes);

      // Build per-cadet GSTO details map using the SAME last-write-wins logic as the GSTO page.
      const gstoMap = new Map<number, Record<number, number>>();
      if (gstoRes?.grouped_results?.length) {
        for (const group of gstoRes.grouped_results) {
          for (const sub of group.submissions || []) {
            const marks: any[] = sub.instructor_details?.marks || [];
            for (const m of marks) {
              const cid = m.cadet_id;
              if (!gstoMap.has(cid)) gstoMap.set(cid, {});
              const detailsObj = gstoMap.get(cid)!;
              for (const d of m.details || []) {
                const did = d.ctw_results_module_estimated_marks_details_id;
                if (did) detailsObj[did] = parseFloat(String(d.marks || 0));
              }
            }
          }
        }
      }
      setGstoCadetDetails(gstoMap);

      // Build per-cadet DT/PF avg_achieved map + authoritative converted marks.
      // Recompute dt/pf converted at full precision from dt_achieved/pf_achieved + conv mark
      // (the backend's dt_converted/pf_converted fields are pre-rounded to 2 decimals).
      const dtPfMap = new Map<number, number>();
      const dtPfConvMap = new Map<number, { dt_converted: number; pf_converted: number }>();
      const dtEstPer = parseFloat(String(dtPfRes?.dt_estimated_per_instructor || 100));
      const pfEstPer = parseFloat(String(dtPfRes?.pf_estimated_per_instructor || 100));
      const dtConvLimit = parseFloat(String(dtPfRes?.dt_conversation_mark || 0));
      const pfConvLimit = parseFloat(String(dtPfRes?.pf_conversation_mark || 0));
      (dtPfRes?.data || []).forEach((row: any) => {
        const dtAchieved = parseFloat(String(row.dt_achieved || 0));
        const pfAchieved = parseFloat(String(row.pf_achieved || 0));
        dtPfMap.set(row.cadet_id, parseFloat(String(row.avg_achieved || 0)));
        dtPfConvMap.set(row.cadet_id, {
          dt_converted: dtEstPer > 0 ? (dtAchieved / dtEstPer) * dtConvLimit : 0,
          pf_converted: pfEstPer > 0 ? (pfAchieved / pfEstPer) * pfConvLimit : 0,
        });
      });
      setDtPfAvgByCadet(dtPfMap);
      setDtPfConvertedByCadet(dtPfConvMap);

      // Pull approval authorities + module approvals from the GSTO fetch so the
      // signature section can render the same authority chain as the module pages.
      setApprovalAuthorities(gstoRes?.approval_authorities || []);
      setModuleApprovals(gstoRes?.module_approvals || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId]);

  useEffect(() => {
    if (courseId && semesterId) fetchData();
  }, [fetchData, courseId, semesterId]);

  // Preferred display order for assessment groups (DT first, then PF, GSK, AO, then others)
  const ASSESS_KEY_ORDER: Record<string, number> = {
    dt: 0,
    pf: 1,
    gsk: 2,
    ao: 3,
  };
  const sortAssessKeys = (entries: [string, any][]): [string, any][] => {
    return [...entries].sort(([a], [b]) => {
      const ai = ASSESS_KEY_ORDER[a.toLowerCase()] ?? 99;
      const bi = ASSESS_KEY_ORDER[b.toLowerCase()] ?? 99;
      if (ai !== bi) return ai - bi;
      return a.localeCompare(b);
    });
  };

  // Sorted by BD/No (cadet_number) ascending
  const sortedConsolidatedData = useMemo(() => {
    return [...consolidatedData].sort((a: any, b: any) => {
      const an = String(a?.cadet_details?.bd_no ?? a?.cadet_details?.cadet_number ?? "");
      const bn = String(b?.cadet_details?.bd_no ?? b?.cadet_details?.cadet_number ?? "");
      return an.localeCompare(bn, undefined, { numeric: true });
    });
  }, [consolidatedData]);

  // All exam types (dynamic - includes MID, END, BMA, etc.)
  const allExamTypes = useMemo(() => {
    if (consolidatedData.length === 0) return [];
    return consolidatedData[0].results.map((r: any) => r.exam_type_details);
  }, [consolidatedData]);

  // END exam types (for CTW breakdown columns)
  const examTypes = useMemo(() => {
    if (consolidatedData.length === 0) return [];
    return consolidatedData[0].results
      .filter((r: any) => r.exam_type_details.code === "END")
      .map((r: any) => r.exam_type_details);
  }, [consolidatedData]);

  // All modules grouped by exam and assessment (for all exam types)
  const allModulesByExamAndAssessment = useMemo(() => {
    const map: Record<number, Record<string, any[]>> = {};
    if (consolidatedData.length > 0) {
      consolidatedData[0].results.forEach((examResult: any) => {
        const et = examResult.exam_type_details;
        const examId = et.id;
        const grouped = examResult.modules || {};
        if (Array.isArray(grouped)) {
          map[examId] = {};
          return;
        }
        map[examId] = { ...grouped };
      });
    }
    return map;
  }, [consolidatedData]);

  // All assessment groups — within 'ao' only keep gsto_assessment (END exam)
  const modulesByExamAndAssessment = useMemo(() => {
    const map: Record<number, Record<string, any[]>> = {};
    if (consolidatedData.length > 0) {
      consolidatedData[0].results.forEach((examResult: any) => {
        const et = examResult.exam_type_details;
        if (et.code !== "END") return;

        const examId = et.id;
        const grouped = examResult.modules || {};
        if (Array.isArray(grouped)) {
          map[examId] = {};
          return;
        }
        const all = { ...grouped };
        // if (all["ao"]) {
        //   const gstoOnly = all["ao"].filter((m: any) => m.code === "gsto_assessment");
        //   if (gstoOnly.length > 0) all["ao"] = gstoOnly;
        //   else delete all["ao"];
        // }
        map[examId] = all;
      });
    }
    return map;
  }, [consolidatedData]);

  // MID exam modules grouped by assessment
  const midModulesByAssessment = useMemo(() => {
    if (consolidatedData.length === 0) return {};
    const midResult = consolidatedData[0].results.find(
      (r: any) => r.exam_type_details.code === "MID"
    );
    if (!midResult) return {};
    const grouped = midResult.modules || {};
    if (Array.isArray(grouped)) return {};
    return grouped as Record<string, any[]>;
  }, [consolidatedData]);

  const isPercentageBased = (mod: any): boolean => {
    return (parseFloat(mod.convert_of_practice) || 0) + (parseFloat(mod.convert_of_exam) || 0) > 0;
  };

  const isDetailBased = (mod: any): boolean => {
    return !isPercentageBased(mod) && (mod.estimated_mark_config?.details?.length > 0);
  };

  // When conversation_mark = 0 and module is detail-based, fall back to sum of detail marks
  const getEffectiveConvMark = (mod: any): number => {
    const convMark = parseFloat(mod.conversation_mark) || 0;
    if (convMark > 0) return convMark;
    if (isDetailBased(mod)) {
      return (mod.estimated_mark_config?.details || []).reduce(
        (sum: number, d: any) => sum + (parseFloat(d.male_marks) || 0), 0
      );
    }
    if (isPercentageBased(mod)) {
      const moduleTotal = parseFloat(mod.module_total_mark) || 0;
      const convertExam = parseFloat(mod.convert_of_exam) || 0;
      return moduleTotal * convertExam / 100;
    }
    return parseFloat(mod.estimated_mark) || 0;
  };

  // Breakdown tab: hide dt/pf columns when gsto is in the same group (merged into GSTO column)
  const getBreakdownDisplayMods = (mods: any[]): any[] => {
    const hasGsto = mods.some((m: any) => m.code === 'gsto_assessment');
    if (!hasGsto) return mods;
    return mods.filter((m: any) => !['dt_assessment', 'pf_assessment'].includes(m.code));
  };

  // For GSTO column header: conv mark = sum of ALL mods in the group (DT + PF + GSTO criteria)
  const getBreakdownModConvMark = (mod: any, allMods: any[]): number => {
    if (mod.code !== 'gsto_assessment') return getEffectiveConvMark(mod);
    return allMods.reduce((sum: number, m: any) => sum + getEffectiveConvMark(m), 0);
  };

  // For GSTO cell value: sum all mods in group; for other mods: compute normally
  const computeBreakdownGroupModMark = (mod: any, allMods: any[], cadetGrouped: any, assessKey: string, cadetId?: number): number => {
    const getMark = (m: any) => {
      const cm = (cadetGrouped[assessKey] || []).find((x: any) => x.id === m.id);
      const im = cm?.instructor_marks || [];
      return im.length > 0 ? computeConvertedMark(m, im, cadetId) : 0;
    };
    if (mod.code !== 'gsto_assessment') return getMark(mod);
    return allMods.reduce((sum: number, m: any) => sum + getMark(m), 0);
  };

  // Total possible mark for END (ESE)
  const totalPossibleMarkESE = useMemo(() => {
    let total = 0;
    Object.values(modulesByExamAndAssessment).forEach(examModules => {
      Object.values(examModules).flat().forEach((mod: any) => {
        total += getEffectiveConvMark(mod);
      });
    });
    return total;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulesByExamAndAssessment]);

  // Total possible mark for MID (MSE)
  const totalPossibleMarkMSE = useMemo(() => {
    let total = 0;
    Object.values(midModulesByAssessment).flat().forEach((mod: any) => {
      total += getEffectiveConvMark(mod);
    });
    return total;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [midModulesByAssessment]);

  // MSE total from all non-END exam types (includes MID, BMA, etc.)
  const totalPossibleMarkMSEAll = useMemo(() => {
    let total = 0;
    allExamTypes
      .filter((et: any) => et.code !== "END")
      .forEach((et: any) => {
        const examModules = allModulesByExamAndAssessment[et.id] || {};
        Object.values(examModules).flat().forEach((mod: any) => {
          total += getEffectiveConvMark(mod);
        });
      });
    return total;
  }, [allExamTypes, allModulesByExamAndAssessment]);

  const totalPossibleMark = totalPossibleMarkMSEAll + totalPossibleMarkESE;

  // GSTO Impression override: uses the per-cadet last-write-wins details fetched from the
  // GSTO page's own endpoint, and replaces the "Assessment & Impression of GSTO" detail
  // with (dt/pf avg_achieved / 100) * male_marks. This guarantees the consolidated value
  // matches the GSTO Impression page exactly.
  const computeGstoModMarkWithOverride = (
    gstoMod: any,
    gstoInstructorMarks: any[],
    cadetId: number
  ): number => {
    const details: any[] = gstoMod.estimated_mark_config?.details || [];
    if (details.length === 0) {
      return computeConvertedMarkPlain(gstoMod, gstoInstructorMarks);
    }

    const perDetailLast = gstoCadetDetails.get(cadetId) || {};
    const avgAchieved = dtPfAvgByCadet.get(cadetId) ?? 0;
    const hasDtPf = avgAchieved > 0;

    let total = 0;
    details.forEach((d: any) => {
      const nameNorm = String(d.name || "").toLowerCase();
      const isImpression =
        nameNorm.includes("impression") ||
        (nameNorm.includes("assessment") && nameNorm.includes("gsto"));
      const maxMark = parseFloat(String(d.male_marks || 0));
      if (isImpression && hasDtPf) {
        total += (avgAchieved / 100) * maxMark;
      } else {
        total += perDetailLast[d.id] || 0;
      }
    });
    return total;
  };

  const computeConvertedMarkPlain = (mod: any, instructorMarks: any[]): number => {
    const convMarkLimit = parseFloat(mod.conversation_mark) || 0;

    if (isPercentageBased(mod)) {
      const convPracticeWeight = parseFloat(mod.convert_of_practice) || 0;
      const convExamWeight = parseFloat(mod.convert_of_exam) || 0;
      let totalFinal = 0;
      instructorMarks.forEach((im: any) => {
        const practices = (im.details || [])
          .filter((d: any) => d.practices_marks !== null && d.practices_marks !== undefined)
          .map((d: any) => parseFloat(String(d.practices_marks)));
        const avgPractice = practices.length > 0
          ? practices.reduce((a: number, b: number) => a + b, 0) / practices.length : 0;
        const testMark = parseFloat(String(im.achieved_mark || 0));
        let finalMark = (avgPractice * convPracticeWeight / 100) + (testMark * convExamWeight / 100);
        if (convMarkLimit > 0 && finalMark > convMarkLimit) finalMark = convMarkLimit;
        totalFinal += finalMark;
      });
      return instructorMarks.length > 0 ? totalFinal / instructorMarks.length : 0;
    } else if (isDetailBased(mod)) {
      const details: any[] = mod.estimated_mark_config?.details || [];
      const detailEstTotal = details.reduce(
        (sum: number, d: any) => sum + (parseFloat(d.male_marks) || 0), 0
      );
      const totalAchieved = instructorMarks.reduce(
        (s: number, im: any) => s + (parseFloat(im.achieved_mark) || 0), 0
      );
      const markCount = instructorMarks.length || 1;
      const avgAchieved = totalAchieved / markCount;
      const effectiveConvMark = convMarkLimit > 0 ? convMarkLimit : detailEstTotal;
      return detailEstTotal > 0 ? (avgAchieved / detailEstTotal) * effectiveConvMark : 0;
    } else {
      const totalEst = parseFloat(mod.estimated_mark) || 1;
      const totalAchieved = instructorMarks.reduce(
        (s: number, im: any) => s + (parseFloat(im.achieved_mark) || 0), 0
      );
      const markCount = instructorMarks.length || 1;
      const avgAchieved = totalAchieved / markCount;
      return totalEst > 0 ? (avgAchieved / totalEst) * convMarkLimit : 0;
    }
  };

  const computeConvertedMark = (
    mod: any,
    instructorMarks: any[],
    cadetId?: number
  ): number => {
    if (mod?.code === "gsto_assessment" && cadetId) {
      return computeGstoModMarkWithOverride(mod, instructorMarks, cadetId);
    }
    // Use authoritative converted values from the DT/PF assessment endpoint,
    // which already respects per-mark is_calculateable flags.
    if (mod?.code === "dt_assessment" && cadetId) {
      const row = dtPfConvertedByCadet.get(cadetId);
      if (row) return row.dt_converted;
    }
    if (mod?.code === "pf_assessment" && cadetId) {
      const row = dtPfConvertedByCadet.get(cadetId);
      if (row) return row.pf_converted;
    }
    return computeConvertedMarkPlain(mod, instructorMarks);
  };

  // Compute MSE total for a cadet
  const computeCadetMSE = (item: any): number => {
    const midResult = item.results.find((r: any) => r.exam_type_details.code === "MID");
    if (!midResult) return 0;
    const cadetGrouped = midResult.modules || {};
    const cadetId = item?.cadet_details?.id;
    let mseTotal = 0;
    Object.entries(midModulesByAssessment).forEach(([assessKey, mods]) => {
      (mods as any[]).forEach((mod: any) => {
        const cadetMod = (cadetGrouped[assessKey] || []).find((m: any) => m.id === mod.id);
        const instructorMarks = cadetMod?.instructor_marks || [];
        if (instructorMarks.length > 0) {
          mseTotal += computeConvertedMark(mod, instructorMarks, cadetId);
        }
      });
    });
    return mseTotal;
  };

  // Compute MSE total from all non-END exam types (includes MID, BMA, etc.)
  const computeCadetMSEAll = (item: any): number => {
    const cadetId = item?.cadet_details?.id;
    let mseTotal = 0;
    allExamTypes
      .filter((et: any) => et.code !== "END")
      .forEach((et: any) => {
        const examModules = allModulesByExamAndAssessment[et.id] || {};
        const cadetExamResult = item.results.find((r: any) => r.exam_type_details.id === et.id);
        const cadetGrouped = cadetExamResult?.modules || {};
        Object.entries(examModules).forEach(([assessKey, mods]) => {
          (mods as any[]).forEach((mod: any) => {
            const cadetMod = (cadetGrouped[assessKey] || []).find((m: any) => m.id === mod.id);
            const instructorMarks = cadetMod?.instructor_marks || [];
            if (instructorMarks.length > 0) {
              mseTotal += computeConvertedMark(mod, instructorMarks, cadetId);
            }
          });
        });
      });
    return mseTotal;
  };

  // Compute ESE total for a cadet
  const computeCadetESE = (item: any): number => {
    const cadetId = item?.cadet_details?.id;
    let eseTotal = 0;
    examTypes.forEach((et: any) => {
      const examModules = modulesByExamAndAssessment[et.id] || {};
      const cadetExamResult = item.results.find((r: any) => r.exam_type_details.id === et.id);
      const cadetGrouped = cadetExamResult?.modules || {};
      Object.entries(examModules).forEach(([assessKey, mods]) => {
        (mods as any[]).forEach((mod: any) => {
          const cadetMod = (cadetGrouped[assessKey] || []).find((m: any) => m.id === mod.id);
          const instructorMarks = cadetMod?.instructor_marks || [];
          if (instructorMarks.length > 0) {
            eseTotal += computeConvertedMark(mod, instructorMarks, cadetId);
          }
        });
      });
    });
    return eseTotal;
  };

  const handlePrintClick = () => setIsPrintModalOpen(true);
    const confirmPrint = (type: FilePrintType) => {
      setSelectedPrintType(type);
      setIsPrintModalOpen(false);
      setTimeout(() => window.print(), 100);
    };
  const handleBack = () => router.push("/ctw/consolidated");
  const handleExport = () => console.log("Export data");

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={handleBack} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold">
            Back to Consolidated
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
       <style jsx global>{`
        @media print {
          .cv-content { width: 100% !important; max-width: none !important; }
          table { font-size: 14px !important; }
          .print-div { max-width: 60vh !important; margin: 0 auto !important; }
          .no-print { display: none !important; }
          .tab-container { display: none !important; }
          /* Neutralize button styling in table headers so link text prints as plain text */
          table th button {
            color: #000 !important;
            background: transparent !important;
            border: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            font: inherit !important;
            text-decoration: none !important;
            display: inline !important;
            cursor: default !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .signature-section {
            margin-top: 40px !important;
            padding-top: 20px !important;
            display: flex !important;
            justify-content: space-between !important;
            gap: 40px !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
            page-break-inside: avoid !important;
          }
          .signature-box {
            min-width: 180px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .signature-box .sig-label {
            font-size: 10px !important;
            font-weight: 700 !important;
            color: #b91c1c !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            margin-bottom: 4px !important;
          }
          .signature-box .sig-area {
            height: 60px !important;
            display: flex !important;
            align-items: flex-end !important;
            padding-bottom: 4px !important;
            margin-bottom: 4px !important;
          }
          .signature-box .sig-name {
            font-size: 11px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            color: #111827 !important;
            margin-top: 2px !important;
          }
          .signature-box .sig-rank {
            font-size: 11px !important;
            font-weight: 600 !important;
            color: #f97316 !important;
          }
          .signature-box .sig-designation {
            font-size: 10px !important;
            color: #374151 !important;
          }
          .signature-box .sig-date {
            font-size: 10px !important;
            color: #6b7280 !important;
            padding-top: 3px !important;
            border-top: 1px solid #1f2937 !important;
            margin-top: 4px !important;
          }
        }
      `}</style>

      {/* Dynamic @page rules — overrides browser default header/footer with custom content */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: A3 landscape;
            margin: 14mm 10mm 14mm 10mm;

            @top-left   { content: ""; }
            @top-center {
              content: "${(selectedPrintType?.name ?? '').replace(/"/g, '\\"')}";
              font-size: 10pt;
              white-space: pre;
              text-align: center;
              text-transform: uppercase;
            }
            @top-right  {
              content: "BAFA F-117";
              font-size: 10pt;
              text-align: right;
            }

            @bottom-left   { content: ""; }
            @bottom-center {
              content: "${(selectedPrintType?.name ?? '').replace(/"/g, '\\"')}" "\\A" counter(page);
              font-size: 10pt;
              white-space: pre;
              text-align: center;
              text-transform: uppercase;
            }
            @bottom-right  { content: ""; }
          }
        }
      ` }} />
      {/* Action Buttons */}
      <div className="p-4 flex items-center justify-between no-print">
        <button onClick={handleBack} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />Back to List
        </button>
        <div className="flex items-center gap-3">
          <button onClick={handlePrintClick} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all">
            <Icon icon="hugeicons:printer" className="w-4 h-4" />Print
          </button>
        </div>
      </div>

      <div className="p-8 cv-content">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider inline-block w-full underline">Consolidated GST Result : {course.name}</p>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider inline-block w-full underline">{examTypes.map((et: any) => et.name).join(", ").replace(/term/gi, "").trim()} {semester?.name}</p>
        </div>

        {/* Matrix Table */}
        <div className="mb-6">
          <div className="flex justify-end items-center gap-4 mb-4">
            <div className="flex items-center gap-1 p-1 rounded-full border border-gray-200 text-xs mb-2">
              <button onClick={() => setConsolidateTab("main")} className="px-3 py-1 rounded-full border border-gray-200 transition-all">
                Main
              </button>
              <button onClick={() => setConsolidateTab("breakdown")} className="px-3 py-1 rounded-full border border-gray-200 transition-all">
                Breakdown
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {consolidateTab === "main" ? (
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-2 text-center">Ser</th>
                    <th className="border border-black px-2 py-2 text-center">BD/No</th>
                    <th className="border border-black px-2 py-2 text-center">Rank</th>
                    <th className="border border-black px-3 py-2 text-left min-w-[160px]">Name</th>

                    {/* All exam assessment group columns — sorted: DT, PF, GSK, AO, ... */}
                    {allExamTypes.map((et: any) => {
                      const examModules = allModulesByExamAndAssessment[et.id] || {};
                      return sortAssessKeys(Object.entries(examModules)).map(([assessKey, mods]) => {
                        const groupTotal = (mods as any[]).reduce(
                          (sum, mod) => sum + getEffectiveConvMark(mod), 0
                        );
                        return (
                          <th
                            key={`assess-${et.id}-${assessKey}`}
                            className="border border-black px-1 py-1 text-center font-bold uppercase"
                          >
                            <button
                              onClick={() => router.push(`/ctw/consolidated/course/${courseId}/semester/${semesterId}/${assessKey}`)}
                              className="text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                            >
                              {assessKey.toUpperCase() + ` - ${groupTotal.toFixed(0)}`}
                            </button>
                          </th>
                        );
                      });
                    })}

                    <th className="border border-black px-2 py-2 text-center">
                      Total - {totalPossibleMarkESE.toFixed(0)}
                    </th>
                    <th className="border border-black px-2 py-2 text-center">
                      MTE - {totalPossibleMarkMSEAll.toFixed(0)}
                    </th>
                    <th className="border border-black px-2 py-2 text-center">
                      Total - {totalPossibleMark.toFixed(0)}
                    </th>
                    <th className="border border-black px-2 py-2 text-center">In %</th>
                    <th className="border border-black px-2 py-2 text-center">Position</th>
                    <th className="border border-black px-2 py-2 text-center">Result</th>
                    <th className="border border-black px-2 py-2 text-center">Remark</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedConsolidatedData.map((item, index) => {
                    const cadetId = item?.cadet_details?.id;
                    // Compute all exam group totals for display
                    const allGroupTotals: Record<string, { total: number; hasMarks: boolean }> = {};
                    allExamTypes.forEach((et: any) => {
                      const examModules = allModulesByExamAndAssessment[et.id] || {};
                      const cadetExamResult = item.results.find((r: any) => r.exam_type_details.id === et.id);
                      const cadetGrouped = cadetExamResult?.modules || {};
                      Object.entries(examModules).forEach(([assessKey, mods]) => {
                        let groupTotal = 0;
                        let groupHasMarks = false;
                        (mods as any[]).forEach((mod: any) => {
                          const cadetMod = (cadetGrouped[assessKey] || []).find((m: any) => m.id === mod.id);
                          const instructorMarks = cadetMod?.instructor_marks || [];
                          if (instructorMarks.length > 0) {
                            groupTotal += computeConvertedMark(mod, instructorMarks, cadetId);
                            groupHasMarks = true;
                          }
                        });
                        allGroupTotals[`${et.id}-${assessKey}`] = { total: groupTotal, hasMarks: groupHasMarks };
                      });
                    });

                    const mseTotal = computeCadetMSEAll(item);
                    const eseTotal = computeCadetESE(item);
                    const grandTotal = mseTotal + eseTotal;

                    return (
                      <tr key={item.cadet_details.id} className="transition-colors hover:bg-gray-50">
                        <td className="border border-black px-1 py-1 text-center">{index + 1}</td>
                        <td className="border border-black px-1 py-1 text-center">{item.cadet_details.bd_no}</td>
                        <td className="border border-black px-1 py-1 text-center">{item.cadet_details.rank}</td>
                        <td className="border border-black px-2 py-1 text-left font-medium">{item.cadet_details.name}</td>

                        {/* All exam assessment group cells — sorted: DT, PF, GSK, AO, ... */}
                        {allExamTypes.map((et: any) => {
                          const examModules = allModulesByExamAndAssessment[et.id] || {};
                          return sortAssessKeys(Object.entries(examModules)).map(([assessKey]) => {
                            const key = `${et.id}-${assessKey}`;
                            const { total, hasMarks } = allGroupTotals[key] || { total: 0, hasMarks: false };
                            return (
                              <td
                                key={`cell-${item.cadet_details.id}-${key}`}
                                className="border border-black px-1 py-1 text-center"
                              >
                                {hasMarks ? total.toFixed(3) : "-"}
                              </td>
                            );
                          });
                        })}

                        {/* Total (ESE — sum of END assessment groups) */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {eseTotal > 0 ? eseTotal.toFixed(3) : "-"}
                        </td>
                        {/* MTE (formerly MSE) */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {mseTotal > 0 ? mseTotal.toFixed(3) : "-"}
                        </td>
                        {/* Total (grand = ESE + MTE) */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {grandTotal.toFixed(3)}
                        </td>
                        {/* In % */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {totalPossibleMark > 0 ? ((grandTotal / totalPossibleMark) * 100).toFixed(3) : "0.000"}
                        </td>
                        {/* Position */}
                        <td className="border border-black px-1 py-1 text-center font-bold text-blue-700">
                          {getOrdinal(item.cadet_details.position)}
                        </td>
                        {/* Result — Pass/Fail based on 50% threshold */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {(() => {
                            if (totalPossibleMark <= 0) return "-";
                            const pct = (grandTotal / totalPossibleMark) * 100;
                            return pct >= 50
                              ? <span className="text-green-700">Pass</span>
                              : <span className="text-red-600">Fail</span>;
                          })()}
                        </td>
                        {/* Remark */}
                        <td className="border border-black px-1 py-1 text-center font-bold">-</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">Ser</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">BD/No</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">Rank</th>
                    <th rowSpan={2} className="border border-black px-3 py-2 text-left min-w-[160px]">Name</th>

                    {/* MSE group header — sorted: DT, PF, GSK, AO, ... */}
                    {sortAssessKeys(Object.entries(midModulesByAssessment)).map(([assessKey, mods]) => (
                      <th
                        key={`mid-assess-${assessKey}`}
                        colSpan={(mods as any[]).length}
                        className="border border-black px-1 py-1 text-center font-bold uppercase"
                      >
                        <button
                          onClick={() => router.push(`/ctw/consolidated/course/${courseId}/semester/${semesterId}/${assessKey}`)}
                          className="text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                        >
                          MID - {assessKey.toUpperCase()}
                        </button>
                      </th>
                    ))}

                    {/* All exam group headers — sorted: DT, PF, GSK, AO, ... */}
                    {allExamTypes.map((et: any) => {
                      const examModules = allModulesByExamAndAssessment[et.id] || {};
                      return sortAssessKeys(Object.entries(examModules)).map(([assessKey, mods]) => (
                        <th
                          key={`assess-${et.id}-${assessKey}`}
                          colSpan={(mods as any[]).length}
                          className="border border-black px-1 py-1 text-center font-bold uppercase"
                        >
                          <button
                            onClick={() => router.push(`/ctw/consolidated/course/${courseId}/semester/${semesterId}/${assessKey}`)}
                            className="text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                          >
                            {et.code} - {assessKey.toUpperCase()}
                          </button>
                        </th>
                      ));
                    })}

                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">
                      Total - {totalPossibleMarkESE.toFixed(0)}
                    </th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">
                      MTE - {totalPossibleMarkMSEAll.toFixed(0)}
                    </th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">
                      Total - {totalPossibleMark.toFixed(0)}
                    </th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">In %</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">Position</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">Result</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">Remark</th>
                  </tr>
                  <tr>
                    {/* MID module sub-headers — sorted */}
                    {sortAssessKeys(Object.entries(midModulesByAssessment)).map(([, mods]) =>
                      (mods as any[]).map((mod: any) => (
                        <th
                          key={`mid-mod-${mod.id}`}
                          className="border border-black px-1 py-1 text-start align-bottom"
                          style={{ minWidth: '35px', maxWidth: '60px' }}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className="font-semibold"
                              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '150px' }}
                            >
                              {mod.name} - {getEffectiveConvMark(mod).toFixed(0)}
                            </span>
                          </div>
                        </th>
                      ))
                    )}

                    {/* All exam module sub-headers — sorted */}
                    {allExamTypes.map((et: any) => {
                      const examModules = allModulesByExamAndAssessment[et.id] || {};
                      return sortAssessKeys(Object.entries(examModules)).map(([, mods]) =>
                        (mods as any[]).map((mod: any) => (
                          <th
                            key={`mod-${et.id}-${mod.id}`}
                            className="border border-black px-1 py-1 text-start align-bottom"
                            style={{ minWidth: '35px', maxWidth: '60px' }}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className="font-semibold"
                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed', height: '150px' }}
                              >
                                {mod.name} - {getEffectiveConvMark(mod).toFixed(0)}
                              </span>
                            </div>
                          </th>
                        ))
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {sortedConsolidatedData.map((item, index) => {
                    const cadetId = item?.cadet_details?.id;
                    // MID module marks
                    const midResult = item.results.find((r: any) => r.exam_type_details.code === "MID");
                    const midCadetGrouped = midResult?.modules || {};

                    let mseTotal = 0;
                    let eseTotal = 0;

                    return (
                      <tr key={item.cadet_details.id} className="transition-colors hover:bg-gray-50">
                        <td className="border border-black px-1 py-1 text-center">{index + 1}</td>
                        <td className="border border-black px-1 py-1 text-center">{item.cadet_details.bd_no}</td>
                        <td className="border border-black px-1 py-1 text-center">{item.cadet_details.rank}</td>
                        <td className="border border-black px-2 py-1 text-left font-medium">{item.cadet_details.name}</td>

                        {/* MID module cells — sorted */}
                        {sortAssessKeys(Object.entries(midModulesByAssessment)).map(([assessKey, mods]) =>
                          (mods as any[]).map((mod: any) => {
                            const cadetMod = (midCadetGrouped[assessKey] || []).find((m: any) => m.id === mod.id);
                            const instructorMarks = cadetMod?.instructor_marks || [];
                            const hasMarks = instructorMarks.length > 0;
                            const conv = hasMarks ? computeConvertedMark(mod, instructorMarks, cadetId) : 0;
                            mseTotal += conv;
                            return (
                              <td key={`mid-cell-${item.cadet_details.id}-${mod.id}`} className="border border-black px-1 py-1 text-center">
                                {hasMarks ? conv.toFixed(3) : "-"}
                              </td>
                            );
                          })
                        )}

                        {/* All exam module cells — sorted */}
                        {allExamTypes.map((et: any) => {
                          const examModules = allModulesByExamAndAssessment[et.id] || {};
                          const cadetExamResult = item.results.find((r: any) => r.exam_type_details.id === et.id);
                          const cadetGrouped = cadetExamResult?.modules || {};
                          return sortAssessKeys(Object.entries(examModules)).map(([assessKey, mods]) =>
                            (mods as any[]).map((mod: any) => {
                              const cadetMod = (cadetGrouped[assessKey] || []).find((m: any) => m.id === mod.id);
                              const instructorMarks = cadetMod?.instructor_marks || [];
                              const hasMarks = instructorMarks.length > 0;
                              const conv = hasMarks ? computeConvertedMark(mod, instructorMarks, cadetId) : 0;
                              if (et.code === "END") eseTotal += conv;
                              else mseTotal += conv;
                              return (
                                <td key={`ese-cell-${item.cadet_details.id}-${et.id}-${mod.id}`} className="border border-black px-1 py-1 text-center">
                                  {hasMarks ? conv.toFixed(3) : "-"}
                                </td>
                              );
                            })
                          );
                        })}

                        {/* Total (ESE) */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {eseTotal > 0 ? eseTotal.toFixed(3) : "-"}
                        </td>
                        {/* MTE (formerly MSE) */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {mseTotal > 0 ? mseTotal.toFixed(3) : "-"}
                        </td>
                        {/* Total (grand) */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {(mseTotal + eseTotal).toFixed(3)}
                        </td>
                        {/* In % */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {totalPossibleMark > 0 ? (((mseTotal + eseTotal) / totalPossibleMark) * 100).toFixed(3) : "0.000"}
                        </td>
                        {/* Position */}
                        <td className="border border-black px-1 py-1 text-center font-bold text-blue-700">
                          {getOrdinal(item.cadet_details.position)}
                        </td>
                        {/* Result — Pass/Fail based on 50% threshold */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {(() => {
                            if (totalPossibleMark <= 0) return "-";
                            const pct = ((mseTotal + eseTotal) / totalPossibleMark) * 100;
                            return pct >= 50
                              ? <span className="text-green-700">Pass</span>
                              : <span className="text-red-600">Fail</span>;
                          })()}
                        </td>
                        {/* Remark */}
                        <td className="border border-black px-1 py-1 text-center font-bold">-</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 text-xs text-gray-700">
            <span className="font-bold">Legend: </span>
            <span>DT = Drill Technique, </span>
            <span>PF = Physical Fitness, </span>
            <span>GSK = General Service Knowledge, </span>
            <span>MTE = Mid Term Exam, </span>
            <span>ETE = End Term Exam, </span>
            <span>AO = Assessment &amp; Observation</span>
          </div>
        </div>

        {/* Signature Section */}
        {(() => {
          const signatureAuthorities = [...approvalAuthorities]
            .filter((a: any) => a.is_signature)
            .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
          if (signatureAuthorities.length === 0) return null;
          const allAuthsSorted = [...approvalAuthorities].sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
          return (
            <div className="signature-section max-w-5xl mx-auto mt-10 flex justify-between gap-10 pr-2">
              {signatureAuthorities.map((auth: any, sigIdx: number) => {
                const sigPosition: 'first' | 'middle' | 'last' =
                  sigIdx === 0 ? 'first' : sigIdx === signatureAuthorities.length - 1 ? 'last' : 'middle';
                const authIdx = allAuthsSorted.findIndex((a: any) => a.id === auth.id);
                const nextAuth = authIdx >= 0 && authIdx < allAuthsSorted.length - 1 ? allAuthsSorted[authIdx + 1] : null;
                let rawSigner: any = null;
                if (nextAuth) {
                  const nextApproval = moduleApprovals.find((ma: any) => ma.authority_id === nextAuth.id && ma.forwarded_by != null);
                  rawSigner = nextApproval?.forwarder ?? null;
                }
                if (!rawSigner) {
                  const ownApproval = moduleApprovals.find((ma: any) => ma.authority_id === auth.id && ma.approved_by != null);
                  rawSigner = ownApproval?.approver ?? null;
                }
                const ownRecord = moduleApprovals.find((ma: any) => ma.authority_id === auth.id);
                const nextRecord = nextAuth ? moduleApprovals.find((ma: any) => ma.authority_id === nextAuth.id) : null;
                const approvedAt: string | null = ownRecord?.approved_at ?? ownRecord?.updated_at ?? ownRecord?.created_at ?? nextRecord?.created_at ?? null;
                let designation: string | null = null;
                if (rawSigner?.roles) {
                  const primary = rawSigner.roles.find((r: any) => r.pivot?.is_primary);
                  designation = primary?.name ?? rawSigner.roles[0]?.name ?? null;
                }
                const signer = rawSigner ? { ...rawSigner, designation } : null;
                return <SignatureBox key={auth.id} auth={auth} signer={signer} approvedAt={approvedAt} position={sigPosition} />;
              })}
            </div>
          );
        })()}
      </div>
      <PrintTypeModal
              isOpen={isPrintModalOpen}
              onClose={() => setIsPrintModalOpen(false)}
              onConfirm={confirmPrint}
            />
    </div>
  );
}