/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwResultService } from "@/libs/services/ctwResultService";
import { courseService } from "@/libs/services/courseService";
import { semesterService } from "@/libs/services/semesterService";
import FullLogo from "@/components/ui/fulllogo";
import { getOrdinal } from "@/libs/utils/formatter";

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [consolidatedRes, courseRes, semesterRes] = await Promise.all([
        ctwResultService.getConsolidatedResults({ course_id: courseId, semester_id: semesterId }),
        courseService.getCourse(courseId),
        semesterService.getSemester(semesterId),
      ]);
      if (consolidatedRes.success) {
        setConsolidatedData(consolidatedRes.data);
      } else {
        setError(consolidatedRes.message || "Failed to fetch results");
      }
      setCourse(courseRes);
      setSemester(semesterRes);
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
  const computeBreakdownGroupModMark = (mod: any, allMods: any[], cadetGrouped: any, assessKey: string): number => {
    const getMark = (m: any) => {
      const cm = (cadetGrouped[assessKey] || []).find((x: any) => x.id === m.id);
      const im = cm?.instructor_marks || [];
      return im.length > 0 ? computeConvertedMark(m, im) : 0;
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

  const computeConvertedMark = (mod: any, instructorMarks: any[]): number => {
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

  // Compute MSE total for a cadet
  const computeCadetMSE = (item: any): number => {
    const midResult = item.results.find((r: any) => r.exam_type_details.code === "MID");
    if (!midResult) return 0;
    const cadetGrouped = midResult.modules || {};
    let mseTotal = 0;
    Object.entries(midModulesByAssessment).forEach(([assessKey, mods]) => {
      (mods as any[]).forEach((mod: any) => {
        const cadetMod = (cadetGrouped[assessKey] || []).find((m: any) => m.id === mod.id);
        const instructorMarks = cadetMod?.instructor_marks || [];
        if (instructorMarks.length > 0) {
          mseTotal += computeConvertedMark(mod, instructorMarks);
        }
      });
    });
    return mseTotal;
  };

  // Compute MSE total from all non-END exam types (includes MID, BMA, etc.)
  const computeCadetMSEAll = (item: any): number => {
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
              mseTotal += computeConvertedMark(mod, instructorMarks);
            }
          });
        });
      });
    return mseTotal;
  };

  // Compute ESE total for a cadet
  const computeCadetESE = (item: any): number => {
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
            eseTotal += computeConvertedMark(mod, instructorMarks);
          }
        });
      });
    });
    return eseTotal;
  };

  const handlePrint = () => window.print();
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
      {/* Action Buttons */}
      <div className="p-4 flex items-center justify-between no-print">
        <button onClick={handleBack} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />Back to List
        </button>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all">
            <Icon icon="hugeicons:printer" className="w-4 h-4" />Print
          </button>
          <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-bold transition-all shadow-sm">
            <Icon icon="hugeicons:download-04" className="w-4 h-4" />Export Data
          </button>
        </div>
      </div>

      <div className="p-8 cv-content">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2 inline-block w-full">GST Consolidated Result</p>
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

                    {/* All exam assessment group columns */}
                    {allExamTypes.map((et: any) => {
                      const examModules = allModulesByExamAndAssessment[et.id] || {};
                      return Object.entries(examModules).map(([assessKey, mods]) => {
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
                      MSE - {totalPossibleMarkMSEAll.toFixed(0)}
                    </th>
                    <th className="border border-black px-2 py-2 text-center">
                      ESE - {totalPossibleMarkESE.toFixed(0)}
                    </th>
                    <th className="border border-black px-2 py-2 text-center">
                      Total - {totalPossibleMark.toFixed(0)}
                    </th>
                    <th className="border border-black px-2 py-2 text-center">In %</th>
                    <th className="border border-black px-2 py-2 text-center">Posn</th>
                    <th className="border border-black px-2 py-2 text-center">Remarks</th>
                  </tr>
                </thead>

                <tbody>
                  {consolidatedData.map((item, index) => {
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
                            groupTotal += computeConvertedMark(mod, instructorMarks);
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

                        {/* All exam assessment group cells */}
                        {allExamTypes.map((et: any) => {
                          const examModules = allModulesByExamAndAssessment[et.id] || {};
                          return Object.entries(examModules).map(([assessKey]) => {
                            const key = `${et.id}-${assessKey}`;
                            const { total, hasMarks } = allGroupTotals[key] || { total: 0, hasMarks: false };
                            return (
                              <td
                                key={`cell-${item.cadet_details.id}-${key}`}
                                className="border border-black px-1 py-1 text-center"
                              >
                                {hasMarks ? total.toFixed(2) : "-"}
                              </td>
                            );
                          });
                        })}

                        {/* MSE */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {mseTotal > 0 ? mseTotal.toFixed(2) : "-"}
                        </td>
                        {/* ESE */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {eseTotal > 0 ? eseTotal.toFixed(2) : "-"}
                        </td>
                        {/* Grand Total */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {grandTotal.toFixed(2)}
                        </td>
                        {/* Percentage */}
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {totalPossibleMark > 0 ? ((grandTotal / totalPossibleMark) * 100).toFixed(2) : "0.00"}
                        </td>
                        {/* Position */}
                        <td className="border border-black px-1 py-1 text-center font-bold text-blue-700">
                          {getOrdinal(item.cadet_details.position)}
                        </td>
                        {/* Remarks */}
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

                    {/* MSE group header */}
                    {Object.entries(midModulesByAssessment).map(([assessKey, mods]) => (
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

                    {/* All exam group headers */}
                    {allExamTypes.map((et: any) => {
                      const examModules = allModulesByExamAndAssessment[et.id] || {};
                      return Object.entries(examModules).map(([assessKey, mods]) => (
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
                      MSE - {totalPossibleMarkMSEAll.toFixed(0)}
                    </th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">
                      ESE - {totalPossibleMarkESE.toFixed(0)}
                    </th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">
                      Total - {totalPossibleMark.toFixed(0)}
                    </th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">%</th>
                    <th rowSpan={2} className="border border-black px-2 py-2 text-center">Posn</th>
                  </tr>
                  <tr>
                    {/* MID module sub-headers */}
                    {Object.values(midModulesByAssessment).map((mods) =>
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

                    {/* All exam module sub-headers */}
                    {allExamTypes.map((et: any) => {
                      const examModules = allModulesByExamAndAssessment[et.id] || {};
                      return Object.values(examModules).map((mods) =>
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
                  {consolidatedData.map((item, index) => {
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

                        {/* MID module cells */}
                        {Object.entries(midModulesByAssessment).map(([assessKey, mods]) =>
                          (mods as any[]).map((mod: any) => {
                            const cadetMod = (midCadetGrouped[assessKey] || []).find((m: any) => m.id === mod.id);
                            const instructorMarks = cadetMod?.instructor_marks || [];
                            const hasMarks = instructorMarks.length > 0;
                            const conv = hasMarks ? computeConvertedMark(mod, instructorMarks) : 0;
                            mseTotal += conv;
                            return (
                              <td key={`mid-cell-${item.cadet_details.id}-${mod.id}`} className="border border-black px-1 py-1 text-center">
                                {hasMarks ? conv.toFixed(2) : "-"}
                              </td>
                            );
                          })
                        )}

                        {/* All exam module cells */}
                        {allExamTypes.map((et: any) => {
                          const examModules = allModulesByExamAndAssessment[et.id] || {};
                          const cadetExamResult = item.results.find((r: any) => r.exam_type_details.id === et.id);
                          const cadetGrouped = cadetExamResult?.modules || {};
                          return Object.entries(examModules).map(([assessKey, mods]) =>
                            (mods as any[]).map((mod: any) => {
                              const cadetMod = (cadetGrouped[assessKey] || []).find((m: any) => m.id === mod.id);
                              const instructorMarks = cadetMod?.instructor_marks || [];
                              const hasMarks = instructorMarks.length > 0;
                              const conv = hasMarks ? computeConvertedMark(mod, instructorMarks) : 0;
                              if (et.code === "END") eseTotal += conv;
                              else mseTotal += conv;
                              return (
                                <td key={`ese-cell-${item.cadet_details.id}-${et.id}-${mod.id}`} className="border border-black px-1 py-1 text-center">
                                  {hasMarks ? conv.toFixed(2) : "-"}
                                </td>
                              );
                            })
                          );
                        })}

                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {mseTotal > 0 ? mseTotal.toFixed(2) : "-"}
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {eseTotal > 0 ? eseTotal.toFixed(2) : "-"}
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {(mseTotal + eseTotal).toFixed(2)}
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-bold">
                          {totalPossibleMark > 0 ? (((mseTotal + eseTotal) / totalPossibleMark) * 100).toFixed(2) : "0.00"}
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-bold text-blue-700">
                          {getOrdinal(item.cadet_details.position)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Signature Section for Print */}
        <div className="hidden print:grid grid-cols-3 gap-12 mt-24">
          <div className="text-center"><div className="border-t-2 border-black pt-3"><p className="font-bold text-sm uppercase tracking-widest">Instructor</p></div></div>
          <div className="text-center"><div className="border-t-2 border-black pt-3"><p className="font-bold text-sm uppercase tracking-widest">Chief Instructor</p></div></div>
          <div className="text-center"><div className="border-t-2 border-black pt-3"><p className="font-bold text-sm uppercase tracking-widest">Commandant</p></div></div>
        </div>
      </div>
    </div>
  );
}