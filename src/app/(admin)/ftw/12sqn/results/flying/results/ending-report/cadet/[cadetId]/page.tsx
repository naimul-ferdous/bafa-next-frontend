"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnFlyingExaminationMarkService } from "@/libs/services/ftw12sqnFlyingExaminationMarkService";
import { ftw12sqnGroundExaminationMarkService } from "@/libs/services/ftw12sqnGroundExaminationMarkService";
import { ftw12sqnFlyingSyllabusService } from "@/libs/services/ftw12sqnFlyingSyllabusService";
import { ftw12sqnGroundSyllabusService } from "@/libs/services/ftw12sqnGroundSyllabusService";
import type { Ftw12sqnFlyingSyllabus, Ftw12sqnGroundSyllabus } from "@/libs/types/ftw12sqnFlying";
import FullLogo from "@/components/ui/fulllogo";

interface CadetDetails {
  id: number;
  name: string;
  bd_no: string;
  rank?: { id: number; name: string };
  course?: { id: number; name: string; code: string };
  semester?: { id: number; name: string; code: string };
  enrollment_date?: string;
  joining_date?: string;
  appointment_date?: string;
}

interface FlyingMark {
  id: number;
  achieved_mark?: string | null;
  achieved_time?: string | null;
  participate_date?: string | null;
  is_present?: boolean;
  remark?: string | null;
  dual_flight?: string | null;
  solo_flight?: string | null;
  syllabus?: {
    id: number;
    phase_fullname: string | null;
    phase_shortname: string | null;
    phase_symbol?: string | null;
    exam_type?: string | null;
  };
  exercise?: {
    id: number;
    exercise_name: string | null;
    exercise_shortname: string | null;
    max_mark: number | null;
    type?: string | null;
    take_time?: string | null;
  };
  phase_type?: {
    id: number;
    type_name: string | null;
  };
  instructor?: {
    id: number;
    name: string | null;
  };
  exam_type?: {
    id: number;
    name: string | null;
    code: string | null;
  };
  cadet?: {
    id: number;
    name: string;
    bd_no?: string;
    bdno?: string;
    cadet_number?: string;
    enrollment_date?: string;
    joining_date?: string;
    appointment_date?: string;
    rank?: { id: number; name: string };
  };
}

interface GroundMark {
  id: number;
  ftw_12sqn_ground_syllabus_id?: number;
  achieved_mark?: string | null;
  participate_date?: string | null;
  is_present?: boolean;
  remark?: string | null;
  syllabus?: {
    id: number;
    ground_full_name: string;
    ground_shortname: string;
  };
  exercise?: {
    id: number;
    exercise_name: string;
    max_mark?: string | null;
  };
  cadet?: {
    id: number;
    name: string;
    bd_no?: string;
    bdno?: string;
    cadet_number?: string;
    enrollment_date?: string;
    joining_date?: string;
    appointment_date?: string;
    rank?: { id: number; name: string };
  };
  course?: { id: number; name: string; code: string };
  semester?: { id: number; name: string; code: string };
}

interface GroundPhaseData {
  sl: number;
  phase_name: string;
  tests: number;
  max_mark: number;
  obtained: number;
  percentage: number;
}

interface FlyingPhaseData {
  sl: number;
  phase_shortname: string;
  phase_fullname: string;
  phase_symbol?: string;
  exam_type?: string;
  approved: {
    dual_sorties: number | string;
    solo_sorties: number | string;
    dual_hrs: string;
    solo_hrs: string;
  };
  actual: {
    dual_sorties: number | string;
    solo_sorties: number | string;
    dual_hrs: string;
    solo_hrs: string;
  };
  ph_avg: number | string;
  daily_avg: number | string;
  weight: number | string;
  mark_out_of_1200: number | string;
  is_mission: boolean;
  is_exam: boolean;
}


export default function EndingReportCadetViewPage() {
  const params = useParams();
  const router = useRouter();

  const cadetId = params.cadetId as string;

  const [loading, setLoading] = useState(true);
  const [cadetDetails, setCadetDetails] = useState<CadetDetails | null>(null);
  const [groundData, setGroundData] = useState<GroundPhaseData[]>([]);
  const [flyingData, setFlyingData] = useState<FlyingPhaseData[]>([]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getExamWeight = (phaseSymbol: string) => {
    switch (phaseSymbol) {
      case 'MTT':
      case 'MTT-1':
        return 1.5;
      case 'FHT':
      case 'FHT-1':
      case 'FHT-2':
        return 1.75;
      default:
        return 1;
    }
  };

  const fetchData = useCallback(async () => {
    if (!cadetId) return;

    try {
      setLoading(true);

      // Fetch syllabi, marks in parallel
      const [flyingSyllabusResponse, groundSyllabusResponse, flyingResponse, groundResponse] = await Promise.all([
        ftw12sqnFlyingSyllabusService.getAll({ per_page: 1000 }),
        ftw12sqnGroundSyllabusService.getAll({ per_page: 1000 }),
        ftw12sqnFlyingExaminationMarkService.getAllMarks({ cadet_id: parseInt(cadetId), per_page: 1000 }),
        ftw12sqnGroundExaminationMarkService.getAllMarks({ cadet_id: parseInt(cadetId), per_page: 1000 }),
      ]);

      const syllabi: Ftw12sqnFlyingSyllabus[] = (flyingSyllabusResponse.data || []).sort(
        (a, b) => (a.phase_sort ?? 0) - (b.phase_sort ?? 0)
      );
      const groundSyllabi: Ftw12sqnGroundSyllabus[] = (groundSyllabusResponse.data || []).sort(
        (a, b) => (a.ground_sort ?? 0) - (b.ground_sort ?? 0)
      );

      // Extract cadet details from first flying mark (or ground mark)
      const firstFlyingMark = flyingResponse.data?.[0];
      const firstGroundMark = groundResponse.data?.[0];
      const firstMark = firstFlyingMark || firstGroundMark;
      if (firstMark) {
        setCadetDetails({
          id: firstMark.cadet?.id || parseInt(cadetId),
          name: firstMark.cadet?.name || "",
          bd_no: firstMark.cadet?.bd_no || firstMark.cadet?.cadet_number || firstMark.cadet?.bdno || "",
          rank: firstMark.cadet?.rank,
          course: firstMark.course,
          semester: firstMark.semester,
          enrollment_date: firstMark.cadet?.enrollment_date,
          joining_date: firstMark.cadet?.joining_date,
          appointment_date: firstMark.cadet?.appointment_date,
        });
      }

      // Build a map of syllabus_id -> marks[] from flying marks
      const marksBySyllabusId = new Map<number, FlyingMark[]>();
      ((flyingResponse.data || []) as FlyingMark[]).forEach((mark: FlyingMark) => {
        const sid = mark.syllabus?.id;
        if (!sid) return;
        if (!marksBySyllabusId.has(sid)) marksBySyllabusId.set(sid, []);
        marksBySyllabusId.get(sid)!.push(mark);
      });

      // Build flying table from syllabi (all phases shown, marks filled in if exist)
      const processedFlyingData: FlyingPhaseData[] = syllabi.map((syl, index) => {
        const isExam = syl.flying_type?.type_code?.toLowerCase() === 'exam' ||
                       syl.flying_type?.type_name?.toLowerCase() === 'exam';

        // Approved sorties/hours from syllabus_types
        const dualType = syl.syllabus_types?.find(t =>
          t.phase_type?.type_code?.toLowerCase() === 'dual' ||
          t.phase_type?.type_name?.toLowerCase() === 'dual'
        );
        const soloType = syl.syllabus_types?.find(t =>
          t.phase_type?.type_code?.toLowerCase() === 'solo' ||
          t.phase_type?.type_name?.toLowerCase() === 'solo'
        );

        const marks = marksBySyllabusId.get(syl.id) || [];
        let totalDualSorties = 0, totalSoloSorties = 0;
        let totalDualHrs = 0, totalSoloHrs = 0;

        marks.forEach((mark: FlyingMark) => {
          const typeName = (mark.phase_type?.type_name || "").toLowerCase();
          // Parse achieved_time "H:MM" to decimal hours
          const timeHrs = (() => {
            const t = mark.achieved_time;
            if (!t || t === "-" || t === "") return 0;
            const parts = t.split(':');
            if (parts.length >= 2) return parseInt(parts[0]) + parseInt(parts[1]) / 60;
            return parseFloat(t) || 0;
          })();
          const isSolo = typeName.includes('solo');
          const isDual = typeName.includes('dual') || (!isSolo && typeName !== "");

          if (isSolo) {
            totalSoloSorties += 1;
            totalSoloHrs += timeHrs;
          } else if (isDual) {
            totalDualSorties += 1;
            totalDualHrs += timeHrs;
          } else {
            // No phase_type info — default to dual
            totalDualSorties += 1;
            totalDualHrs += timeHrs;
          }
        });

        const validMarks = marks.filter(m => {
          const v = parseFloat(m.achieved_mark || "0");
          return !isNaN(v) && v > 0;
        });
        const totalMarkSum = validMarks.reduce((s, m) => s + parseFloat(m.achieved_mark || "0"), 0);
        const average = validMarks.length > 0 ? totalMarkSum / validMarks.length : null;

        const formatHrs = (hrs: number) => {
          const h = Math.floor(hrs);
          const m = Math.round((hrs - h) * 60);
          return `${h}:${m.toString().padStart(2, '0')}`;
        };

        return {
          sl: index + 1,
          phase_shortname: syl.phase_shortname,
          phase_fullname: syl.phase_full_name,
          phase_symbol: syl.phase_symbol,
          exam_type: isExam ? 'exam' : 'mission',
          approved: {
            dual_sorties: dualType?.sorties ?? "-",
            solo_sorties: soloType?.sorties ?? "-",
            dual_hrs: dualType?.hours ? formatHrs(parseFloat(String(dualType.hours))) : "-",
            solo_hrs: soloType?.hours ? formatHrs(parseFloat(String(soloType.hours))) : "-",
          },
          actual: {
            dual_sorties: totalDualSorties > 0 ? totalDualSorties : "-",
            solo_sorties: totalSoloSorties > 0 ? totalSoloSorties : "-",
            dual_hrs: totalDualHrs > 0 ? formatHrs(totalDualHrs) : "-",
            solo_hrs: totalSoloHrs > 0 ? formatHrs(totalSoloHrs) : "-",
          },
          ph_avg: average !== null ? average.toFixed(2) : "-",
          daily_avg: "-",
          weight: isExam ? getExamWeight(syl.phase_symbol || syl.phase_shortname) : "-",
          mark_out_of_1200: isExam && average !== null ? (average * getExamWeight(syl.phase_symbol || syl.phase_shortname)).toFixed(2) : "-",
          is_mission: !isExam,
          is_exam: isExam,
        };
      });

      // Sort: missions first (by phase_sort), then exams (by phase_sort), renumber SL
      const missionRows = processedFlyingData.filter(p => p.is_mission);
      const examRows = processedFlyingData.filter(p => p.is_exam);
      const sortedFlyingData = [...missionRows, ...examRows].map((row, i) => ({ ...row, sl: i + 1 }));
      setFlyingData(sortedFlyingData);

      // Build ground table from syllabi (show all phases; fill obtained from marks)
      const groundMarksByPhaseId = new Map<number, GroundMark[]>();
      ((groundResponse.data || []) as GroundMark[]).forEach((mark: GroundMark) => {
        const pid = mark.syllabus?.id ?? mark.ftw_12sqn_ground_syllabus_id;
        if (!pid) return;
        if (!groundMarksByPhaseId.has(pid)) groundMarksByPhaseId.set(pid, []);
        groundMarksByPhaseId.get(pid)!.push(mark);
      });

      const processedGroundData: GroundPhaseData[] = groundSyllabi.map((syl, index) => {
        const marks = groundMarksByPhaseId.get(syl.id) || [];
        const obtained = marks.reduce((s, m) => s + parseFloat(m.achieved_mark || "0"), 0);
        const highestMark = parseFloat(String(syl.highest_mark)) || 0;
        const maxMark = (syl.no_of_test || 1) * highestMark;
        return {
          sl: index + 1,
          phase_name: syl.ground_full_name,
          tests: syl.no_of_test,
          max_mark: maxMark,
          obtained,
          percentage: maxMark > 0 ? (obtained / maxMark) * 100 : 0,
        };
      });
      setGroundData(processedGroundData);

    } catch (error) {
      console.error("Error fetching cadet data:", error);
    } finally {
      setLoading(false);
    }
  }, [cadetId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBack = () => router.back();
  const handlePrint = () => window.print();

  // Calculate totals for flying
  const flyingTotals = {
    approved_dual_sorties: flyingData.reduce((sum, p) => sum + (typeof p.approved.dual_sorties === 'number' ? p.approved.dual_sorties : 0), 0),
    approved_solo_sorties: flyingData.reduce((sum, p) => sum + (typeof p.approved.solo_sorties === 'number' ? p.approved.solo_sorties : 0), 0),
    actual_dual_sorties: flyingData.reduce((sum, p) => sum + (typeof p.actual.dual_sorties === 'number' ? p.actual.dual_sorties : 0), 0),
    actual_solo_sorties: flyingData.reduce((sum, p) => sum + (typeof p.actual.solo_sorties === 'number' ? p.actual.solo_sorties : 0), 0),
    total_weight: flyingData.reduce((sum, p) => sum + (typeof p.weight === 'number' ? p.weight : 0), 0),
  };

  // Calculate mission averages
  const missionPhases = flyingData.filter(p => p.is_mission && p.ph_avg !== "-");
  const dailyAverage = missionPhases.length > 0
    ? missionPhases.reduce((sum, p) => sum + parseFloat(p.ph_avg as string), 0) / missionPhases.length
    : 0;

  // Overall percentage calculation
  const overallPercentage = (dailyAverage * 4) / 12;

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto p-6 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="relative">
        {/* Back Button */}
        <div className="absolute top-0 left-0 flex print:hidden">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 px-4 py-2 bg-transparent hover:bg-gray-100 text-black rounded-md transition-colors text-sm"
            title="Back"
          >
            <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Print Button */}
        <div className="absolute top-0 right-0 flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 bg-transparent hover:bg-gray-100 text-black rounded-md transition-colors text-sm"
            title="Print"
          >
            <Icon icon="solar:printer-linear" className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>

        <div className="text-center flex flex-col justify-center items-center bg-transparent p-4">
          <FullLogo />
          <h2 className="text-lg font-bold text-gray-800 uppercase mt-2">
            PERFORMANCE ANALYSIS REPORT
          </h2>
          <h2 className="text-md font-bold text-gray-800 uppercase">12 SQUADRON BAF</h2>
        </div>
      </div>

      {/* Personal Details */}
      <div className="mt-4">
        <h2 className="uppercase font-bold text-sm mb-2">PERSONAL DETAILS</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div className="flex">
            <span className="font-semibold w-32">BD/No</span>
            <span className="border-b border-black flex-1 text-center">{cadetDetails?.bd_no || "-"}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-32">Rank</span>
            <span className="border-b border-black flex-1 text-center">{cadetDetails?.rank?.name || "Officer Cadet"}</span>
          </div>
          <div></div>

          <div className="flex">
            <span className="font-semibold w-32">Name</span>
            <span className="border-b border-black flex-1 text-center">{cadetDetails?.name || "-"}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-32">Course No</span>
            <span className="border-b border-black flex-1 text-center">{cadetDetails?.course?.name || "-"}</span>
          </div>
          <div></div>

          <div className="flex">
            <span className="font-semibold w-32">Dt of Enrollment</span>
            <span className="border-b border-black flex-1 text-center">{formatDate(cadetDetails?.enrollment_date)}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-32">Dt of Commencement</span>
            <span className="border-b border-black flex-1 text-center">{formatDate(cadetDetails?.joining_date)}</span>
          </div>
          <div></div>

          <div className="flex">
            <span className="font-semibold w-32">Dt of Completion</span>
            <span className="border-b border-black flex-1 text-center">{formatDate(cadetDetails?.appointment_date)}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-32">Type of ac flown</span>
            <span className="border-b border-black flex-1 text-center">-</span>
          </div>
          <div></div>
        </div>
      </div>

      {/* 1. Ground TRG */}
      <div className="mt-6">
        <h1 className="uppercase font-bold text-sm mb-2">1. GROUND TRG</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1 text-center font-medium text-black border border-black uppercase" rowSpan={2}>SL</th>
                <th className="px-2 py-1 text-center font-medium text-black border border-black uppercase" rowSpan={2}>PHASE</th>
                <th className="px-2 py-1 text-center font-medium text-black border border-black uppercase" rowSpan={2}>TESTS</th>
                <th className="px-2 py-1 text-center font-medium text-black border border-black uppercase" rowSpan={2}>MAX MARK</th>
                <th className="px-2 py-1 text-center font-medium text-black border border-black uppercase" colSpan={2}>RESULT</th>
              </tr>
              <tr>
                <th className="px-2 py-1 text-center font-medium text-black border border-black uppercase">OBTAINED</th>
                <th className="px-2 py-1 text-center font-medium text-black border border-black uppercase">PERCENTAGE</th>
              </tr>
            </thead>
            <tbody>
              {groundData.map((phase) => (
                <tr key={phase.sl}>
                  <td className="px-2 py-1 text-center text-black border border-black">{phase.sl}</td>
                  <td className="px-2 py-1 text-black border border-black font-medium">{phase.phase_name}</td>
                  <td className="px-2 py-1 text-center text-black border border-black">{phase.tests}</td>
                  <td className="px-2 py-1 text-center text-black border border-black">{phase.max_mark.toFixed(2)}</td>
                  <td className="px-2 py-1 text-center border border-black">
                    <span className={`font-bold ${phase.percentage >= 80 ? 'text-green-600' : phase.percentage >= 60 ? 'text-orange-500' : 'text-red-600'}`}>
                      {phase.obtained.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-center border border-black">
                    <span className={`font-bold ${phase.percentage >= 80 ? 'text-green-600' : phase.percentage >= 60 ? 'text-orange-500' : 'text-red-600'}`}>
                      {phase.percentage.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. FLY TRG */}
      <div className="mt-6">
        <h1 className="uppercase font-bold text-sm mb-2">2. FLY TRG</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase" rowSpan={3}>SL</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase" rowSpan={3}>PHASE/TEST</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase" colSpan={4}>APPROVED</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase" colSpan={4}>ACTUAL FLOWN</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase" colSpan={4} rowSpan={2}>FLG RESULT</th>
              </tr>
              <tr>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase" colSpan={2}>SORTIES</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase" colSpan={2}>HRS</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase" colSpan={2}>SORTIES</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase" colSpan={2}>HRS</th>
              </tr>
              <tr>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase">DUAL</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase">SOLO</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase">DUAL</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase">SOLO</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase">DUAL</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase">SOLO</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase">DUAL</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase">SOLO</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase">PH AVG</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase">DAILY AVG/TEST</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase">WEIGHT</th>
                <th className="px-1 py-1 text-center font-medium text-black border border-black uppercase">MARK OUT OF 1200</th>
              </tr>
            </thead>
            <tbody>
              {flyingData.map((phase, index) => {
                const isFirstMission = phase.is_mission && flyingData.findIndex(p => p.is_mission) === index;
                const missionCount = flyingData.filter(p => p.is_mission).length;

                return (
                  <tr key={phase.sl}>
                    <td className="px-1 py-1 text-center text-black border border-black">{phase.sl}</td>
                    <td className="px-1 py-1 text-black border border-black">
                      <div className="font-medium">{phase.phase_shortname}</div>
                      <div className="text-gray-500 text-[10px]">{phase.phase_fullname}</div>
                    </td>
                    <td className="px-1 py-1 text-center text-black border border-black">{phase.approved.dual_sorties}</td>
                    <td className="px-1 py-1 text-center text-black border border-black">{phase.approved.solo_sorties}</td>
                    <td className="px-1 py-1 text-center text-black border border-black">{phase.approved.dual_hrs}</td>
                    <td className="px-1 py-1 text-center text-black border border-black">{phase.approved.solo_hrs}</td>
                    <td className="px-1 py-1 text-center border border-black">
                      <span className={phase.actual.dual_sorties !== "-" ? "text-blue-600 font-medium" : "text-gray-400"}>
                        {phase.actual.dual_sorties}
                      </span>
                    </td>
                    <td className="px-1 py-1 text-center border border-black">
                      <span className={phase.actual.solo_sorties !== "-" ? "text-blue-600 font-medium" : "text-gray-400"}>
                        {phase.actual.solo_sorties}
                      </span>
                    </td>
                    <td className="px-1 py-1 text-center border border-black">
                      <span className={phase.actual.dual_hrs !== "-" ? "text-blue-600 font-medium" : "text-gray-400"}>
                        {phase.actual.dual_hrs}
                      </span>
                    </td>
                    <td className="px-1 py-1 text-center border border-black">
                      <span className={phase.actual.solo_hrs !== "-" ? "text-blue-600 font-medium" : "text-gray-400"}>
                        {phase.actual.solo_hrs}
                      </span>
                    </td>
                    <td className="px-1 py-1 text-center text-black border border-black">{phase.ph_avg}</td>
                    {phase.is_mission ? (
                      isFirstMission ? (
                        <td className="px-1 py-1 text-center border border-black" rowSpan={missionCount}>
                          <span className="text-red-500 font-bold">{dailyAverage > 0 ? dailyAverage.toFixed(2) : "-"}</span>
                        </td>
                      ) : null
                    ) : (
                      <td className="px-1 py-1 text-center text-black border border-black">{phase.ph_avg}</td>
                    )}
                    {phase.is_mission ? (
                      isFirstMission ? (
                        <td className="px-1 py-1 text-center text-black border border-black font-bold" rowSpan={missionCount}>4</td>
                      ) : null
                    ) : (
                      <td className="px-1 py-1 text-center text-black border border-black">{phase.weight}</td>
                    )}
                    {phase.is_mission ? (
                      isFirstMission ? (
                        <td className="px-1 py-1 text-center text-black border border-black" rowSpan={missionCount}>
                          {(dailyAverage * 4).toFixed(2)}
                        </td>
                      ) : null
                    ) : (
                      <td className="px-1 py-1 text-center text-black border border-black">{phase.mark_out_of_1200}</td>
                    )}
                  </tr>
                );
              })}
              {/* Total Row */}
              <tr className="font-bold bg-gray-50">
                <td className="px-1 py-1 text-center text-black border border-black">-</td>
                <td className="px-1 py-1 text-black border border-black font-bold">TOTAL</td>
                <td className="px-1 py-1 text-center text-black border border-black">{flyingTotals.approved_dual_sorties || "-"}</td>
                <td className="px-1 py-1 text-center text-black border border-black">{flyingTotals.approved_solo_sorties || "-"}</td>
                <td className="px-1 py-1 text-center text-black border border-black">-</td>
                <td className="px-1 py-1 text-center text-black border border-black">-</td>
                <td className="px-1 py-1 text-center text-blue-600 border border-black font-bold">{flyingTotals.actual_dual_sorties || "-"}</td>
                <td className="px-1 py-1 text-center text-blue-600 border border-black font-bold">{flyingTotals.actual_solo_sorties || "-"}</td>
                <td className="px-1 py-1 text-center text-blue-600 border border-black font-bold">-</td>
                <td className="px-1 py-1 text-center text-blue-600 border border-black font-bold">-</td>
                <td className="px-1 py-1 text-center text-black border border-black">-</td>
                <td className="px-1 py-1 text-center text-black border border-black">-</td>
                <td className="px-1 py-1 text-center text-black border border-black font-bold">{flyingTotals.total_weight + 4}</td>
                <td className="px-1 py-1 text-center text-green-600 border border-black font-bold">{dailyAverage > 0 ? (dailyAverage * 4).toFixed(2) : "-"}</td>
              </tr>
              {/* Overall Percentage Row */}
              <tr className="font-bold">
                <td colSpan={13} className="px-1 py-1 text-right text-black border border-black">OVERALL PERCENTAGE</td>
                <td className="px-1 py-1 text-center border border-black">
                  <span className="text-purple-600 font-bold">{overallPercentage.toFixed(2)}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Info */}
      <div className="mt-6 text-sm space-y-1">
        <div className="flex">
          <span className="font-semibold w-48">12. Total on Type</span>
          <span className="border-b border-black px-4">{"-"}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-48">12. Grand Total</span>
          <span className="border-b border-black px-4">{"-"}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-48">13. Overall Grading</span>
          <span className="border-b border-black px-4">{overallPercentage.toFixed(2)} %</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-48">14. Position in the Course</span>
          <span className="border-b border-black px-4">{"-"}</span>
          <span className="mx-2">out of</span>
          <span className="border-b border-black px-4">{"-"}</span>
          <span className="ml-2">students</span>
        </div>
      </div>

      {/* Rmks by Base Flt Surgeon, MTR */}
      <div className="mt-6">
        <h1 className="font-bold text-sm underline">Rmks by Base Flt Surgeon, MTR</h1>
        <p className="text-xs mt-1">15. The physical statistics info Oftr Cdt {cadetDetails?.name || "Sakib Ahmed"} is appended below:</p>
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1 text-center font-medium text-black border border-black uppercase" rowSpan={2}>Height (Inch)</th>
                <th className="px-2 py-1 text-center font-medium text-black border border-black uppercase" rowSpan={2}>Weight (Lb)</th>
                <th className="px-2 py-1 text-center font-medium text-black border border-black uppercase" colSpan={2}>Dorsal Height (Inch)</th>
                <th className="px-2 py-1 text-center font-medium text-black border border-black uppercase" rowSpan={2}>Leg Length (Inch)</th>
              </tr>
              <tr>
                <th className="px-2 py-1 text-center font-medium text-black border border-black uppercase">Dorsal with Helmet</th>
                <th className="px-2 py-1 text-center font-medium text-black border border-black uppercase">Dorsal without Helmet</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-3 text-center text-black border border-black">-</td>
                <td className="px-2 py-3 text-center text-black border border-black">-</td>
                <td className="px-2 py-3 text-center text-black border border-black">-</td>
                <td className="px-2 py-3 text-center text-black border border-black">-</td>
                <td className="px-2 py-3 text-center text-black border border-black">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature Sections */}
      <div className="mt-8 space-y-12">
        {/* Signature Box Template */}
        {[
          { title: "Rmks by Comdt", number: "16. Pending approval" },
          { title: "Rmks by CI Bafa", number: "17. Pending approval" },
          { title: "Rmks by CIC", number: "18. Bulk approved by 12 Sqn Orderly Room" },
          { title: "Rmks by Flt Cdr", number: "19. Pending approval" },
          { title: "Rmks by OC 12 Sqn", number: "20. Pending approval" },
          { title: "Rmks by OC FTW", number: "21. Pending approval" },
          { title: "Rmks by CPTC", number: "22. Pending approval" },
        ].map((item, idx) => (
          <div key={idx} className="min-h-[100px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm">Date: -</p>
                <p className="font-bold text-sm underline mt-2">{item.title}</p>
                <p className="text-xs text-gray-600">{item.number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-orange-500">Pending</p>
                <div className="mt-8 border-t border-black pt-1 min-w-[150px]">
                  <p className="text-xs">-</p>
                  <p className="text-xs font-semibold">12 Squadron BAF</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
