"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw11sqnFlyingExaminationMarkService } from "@/libs/services/ftw11sqnFlyingExaminationMarkService";
import { ftw11sqnGroundExaminationMarkService } from "@/libs/services/ftw11sqnGroundExaminationMarkService";
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
  achieved_mark: string | null;
  participate_date: string | null;
  is_present: boolean;
  remark: string | null;
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
}

interface GroundMark {
  id: number;
  exam_mark: string | null;
  participate_date: string | null;
  is_present: boolean;
  remark: string | null;
  phase?: {
    id: number;
    ground_fullname: string | null;
    ground_shortname: string | null;
  };
  test?: {
    id: number;
    test_name: string | null;
    max_mark: number | null;
  };
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

// Dummy data for when no data is found
const dummyGroundData: GroundPhaseData[] = [
  { sl: 1, phase_name: "MTD", tests: 7, max_mark: 700.00, obtained: 604.90, percentage: 86.41 },
  { sl: 2, phase_name: "Quiz on Flg ph", tests: 8, max_mark: 800.00, obtained: 526.00, percentage: 65.75 },
  { sl: 3, phase_name: "Sessional", tests: 2, max_mark: 200.00, obtained: 172.00, percentage: 86.00 },
];

const dummyFlyingData: FlyingPhaseData[] = [
  { sl: 1, phase_shortname: "ID", phase_fullname: "Initial Dual", approved: { dual_sorties: 8, solo_sorties: "-", dual_hrs: "7:55", solo_hrs: "0:00" }, actual: { dual_sorties: 5, solo_sorties: 0, dual_hrs: "4:45", solo_hrs: "0:00" }, ph_avg: "-", daily_avg: "53.25", weight: "-", mark_out_of_1200: "-", is_mission: true, is_exam: false },
  { sl: 2, phase_shortname: "CCT(Pre-SOLO)", phase_fullname: "Circuit", approved: { dual_sorties: 11, solo_sorties: "-", dual_hrs: "7:35", solo_hrs: "0:00" }, actual: { dual_sorties: 1, solo_sorties: 0, dual_hrs: "0:30", solo_hrs: "0:00" }, ph_avg: "-", daily_avg: "57.00", weight: "-", mark_out_of_1200: "-", is_mission: true, is_exam: false },
  { sl: 3, phase_shortname: "SOLO Ck", phase_fullname: "SOLO Check", approved: { dual_sorties: 1, solo_sorties: "-", dual_hrs: "0:30", solo_hrs: "0:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: "-", mark_out_of_1200: "-", is_mission: true, is_exam: false },
  { sl: 4, phase_shortname: "CCT (Consolidation)", phase_fullname: "CCT (Consolidation)", approved: { dual_sorties: 3, solo_sorties: 5, dual_hrs: "1:30", solo_hrs: "2:05" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: "-", mark_out_of_1200: "-", is_mission: true, is_exam: false },
  { sl: 5, phase_shortname: "GF", phase_fullname: "General Flying", approved: { dual_sorties: 9, solo_sorties: 5, dual_hrs: "9:30", solo_hrs: "5:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: "-", mark_out_of_1200: "-", is_mission: true, is_exam: false },
  { sl: 6, phase_shortname: "IF", phase_fullname: "Instrument Flying", approved: { dual_sorties: 10, solo_sorties: "-", dual_hrs: "11:15", solo_hrs: "0:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: "-", mark_out_of_1200: "-", is_mission: true, is_exam: false },
  { sl: 7, phase_shortname: "GF", phase_fullname: "General Flying", approved: { dual_sorties: 1, solo_sorties: "-", dual_hrs: "1:15", solo_hrs: "0:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "55.13", weight: 4, mark_out_of_1200: "220.50", is_mission: true, is_exam: false },
  { sl: 8, phase_shortname: "NAV", phase_fullname: "Navigation Flying", approved: { dual_sorties: 9, solo_sorties: 2, dual_hrs: "11:30", solo_hrs: "2:50" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: "-", mark_out_of_1200: "-", is_mission: true, is_exam: false },
  { sl: 9, phase_shortname: "GF", phase_fullname: "General Flying", approved: { dual_sorties: 1, solo_sorties: "-", dual_hrs: "1:00", solo_hrs: "0:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: "-", mark_out_of_1200: "-", is_mission: true, is_exam: false },
  { sl: 10, phase_shortname: "FMN", phase_fullname: "Formation Flying", approved: { dual_sorties: 10, solo_sorties: 2, dual_hrs: "11:00", solo_hrs: "1:30" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: "-", mark_out_of_1200: "-", is_mission: true, is_exam: false },
  { sl: 11, phase_shortname: "IF", phase_fullname: "Instrument Flying", approved: { dual_sorties: 1, solo_sorties: "-", dual_hrs: "0:50", solo_hrs: "0:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: "-", mark_out_of_1200: "-", is_mission: true, is_exam: false },
  { sl: 12, phase_shortname: "NF", phase_fullname: "Night Flying", approved: { dual_sorties: 4, solo_sorties: 1, dual_hrs: "2:50", solo_hrs: "0:15" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: "-", mark_out_of_1200: "-", is_mission: true, is_exam: false },
  { sl: 13, phase_shortname: "AA", phase_fullname: "Advance Aerobatics Flying", approved: { dual_sorties: 6, solo_sorties: 5, dual_hrs: "7:30", solo_hrs: "5:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: "-", mark_out_of_1200: "-", is_mission: true, is_exam: false },
  { sl: 14, phase_shortname: "CF", phase_fullname: "Combined Flying", approved: { dual_sorties: 4, solo_sorties: "-", dual_hrs: "4:45", solo_hrs: "0:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: "-", mark_out_of_1200: "-", is_mission: true, is_exam: false },
  { sl: 15, phase_shortname: "MTT-1", phase_fullname: "Mid Term Test", approved: { dual_sorties: 1, solo_sorties: "-", dual_hrs: "1:15", solo_hrs: "0:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: 1.5, mark_out_of_1200: "-", is_mission: false, is_exam: true },
  { sl: 16, phase_shortname: "IFT-1", phase_fullname: "Instrument Flying Test", approved: { dual_sorties: 1, solo_sorties: "-", dual_hrs: "1:15", solo_hrs: "0:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: 1, mark_out_of_1200: "-", is_mission: false, is_exam: true },
  { sl: 17, phase_shortname: "FNT-1", phase_fullname: "Final Navigation Test", approved: { dual_sorties: 1, solo_sorties: "-", dual_hrs: "1:25", solo_hrs: "0:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: 1, mark_out_of_1200: "-", is_mission: false, is_exam: true },
  { sl: 18, phase_shortname: "FFT-1", phase_fullname: "Final Formation Test", approved: { dual_sorties: 1, solo_sorties: "-", dual_hrs: "1:10", solo_hrs: "0:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: 1, mark_out_of_1200: "-", is_mission: false, is_exam: true },
  { sl: 19, phase_shortname: "FHT-1", phase_fullname: "Final Handling Test", approved: { dual_sorties: 1, solo_sorties: "-", dual_hrs: "1:15", solo_hrs: "0:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: 1.75, mark_out_of_1200: "-", is_mission: false, is_exam: true },
  { sl: 20, phase_shortname: "FHT-2", phase_fullname: "Final Handling Test", approved: { dual_sorties: 1, solo_sorties: "-", dual_hrs: "1:15", solo_hrs: "0:00" }, actual: { dual_sorties: "-", solo_sorties: "-", dual_hrs: "-", solo_hrs: "-" }, ph_avg: "-", daily_avg: "-", weight: 1.75, mark_out_of_1200: "-", is_mission: false, is_exam: true },
];

export default function EndingReportCadetViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const cadetId = params.cadetId as string;
  const courseId = searchParams.get("course_id");
  const semesterId = searchParams.get("semester_id");

  const [loading, setLoading] = useState(true);
  const [cadetDetails, setCadetDetails] = useState<CadetDetails | null>(null);
  const [flyingMarks, setFlyingMarks] = useState<FlyingMark[]>([]);
  const [groundMarks, setGroundMarks] = useState<GroundMark[]>([]);
  const [groundData, setGroundData] = useState<GroundPhaseData[]>([]);
  const [flyingData, setFlyingData] = useState<FlyingPhaseData[]>([]);
  const [useDummyData, setUseDummyData] = useState(false);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const fetchData = useCallback(async () => {
    if (!cadetId || !courseId || !semesterId) return;

    try {
      setLoading(true);

      // Fetch flying marks
      const flyingResponse = await ftw11sqnFlyingExaminationMarkService.getAllMarks({
        cadet_id: parseInt(cadetId),
        course_id: parseInt(courseId),
        semester_id: parseInt(semesterId),
        per_page: 1000,
      });

      if (flyingResponse.data && flyingResponse.data.length > 0) {
        setFlyingMarks(flyingResponse.data);

        // Extract cadet details from first mark
        const firstMark = flyingResponse.data[0];
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

        // Process flying data into phase groups
        const phaseMap = new Map<string, {
          marks: FlyingMark[];
          phase_fullname: string;
          phase_symbol?: string;
          exam_type?: string;
          total_dual_sorties: number;
          total_solo_sorties: number;
          total_dual_hrs: number;
          total_solo_hrs: number;
        }>();

        flyingResponse.data.forEach((mark: FlyingMark) => {
          const phaseKey = mark.syllabus?.phase_shortname || "Unknown";

          if (!phaseMap.has(phaseKey)) {
            phaseMap.set(phaseKey, {
              marks: [],
              phase_fullname: mark.syllabus?.phase_fullname || "",
              phase_symbol: mark.syllabus?.phase_symbol || undefined,
              exam_type: mark.syllabus?.exam_type || undefined,
              total_dual_sorties: 0,
              total_solo_sorties: 0,
              total_dual_hrs: 0,
              total_solo_hrs: 0,
            });
          }

          const group = phaseMap.get(phaseKey)!;
          group.marks.push(mark);

          // Count sorties and hours
          if (mark.dual_flight && mark.dual_flight !== "-" && mark.dual_flight !== "") {
            group.total_dual_sorties += 1;
            group.total_dual_hrs += parseFloat(mark.dual_flight) || 0;
          }
          if (mark.solo_flight && mark.solo_flight !== "-" && mark.solo_flight !== "") {
            group.total_solo_sorties += 1;
            group.total_solo_hrs += parseFloat(mark.solo_flight) || 0;
          }
        });

        // Convert to flying data format
        const processedFlyingData: FlyingPhaseData[] = [];
        let sl = 1;
        phaseMap.forEach((data, phaseKey) => {
          const validMarks = data.marks.filter(m => {
            const mark = parseFloat(m.achieved_mark || "0");
            return !isNaN(mark) && mark > 0;
          });
          const totalMarks = validMarks.reduce((sum, m) => sum + parseFloat(m.achieved_mark || "0"), 0);
          const average = validMarks.length > 0 ? totalMarks / validMarks.length : 0;

          const isExam = data.exam_type === 'exam';

          processedFlyingData.push({
            sl: sl++,
            phase_shortname: phaseKey,
            phase_fullname: data.phase_fullname,
            phase_symbol: data.phase_symbol,
            exam_type: data.exam_type,
            approved: {
              dual_sorties: "-",
              solo_sorties: "-",
              dual_hrs: "-",
              solo_hrs: "-",
            },
            actual: {
              dual_sorties: data.total_dual_sorties || "-",
              solo_sorties: data.total_solo_sorties || "-",
              dual_hrs: data.total_dual_hrs > 0 ? data.total_dual_hrs.toFixed(2).replace('.', ':') : "-",
              solo_hrs: data.total_solo_hrs > 0 ? data.total_solo_hrs.toFixed(2).replace('.', ':') : "-",
            },
            ph_avg: average > 0 ? average.toFixed(2) : "-",
            daily_avg: "-",
            weight: isExam ? getExamWeight(data.phase_symbol || phaseKey) : "-",
            mark_out_of_1200: "-",
            is_mission: !isExam,
            is_exam: isExam,
          });
        });

        if (processedFlyingData.length > 0) {
          setFlyingData(processedFlyingData);
        } else {
          setFlyingData(dummyFlyingData);
          setUseDummyData(true);
        }
      } else {
        setFlyingData(dummyFlyingData);
        setUseDummyData(true);
        // Set dummy cadet details
        setCadetDetails({
          id: parseInt(cadetId),
          name: "Sakib Ahmed",
          bd_no: "14672",
          rank: { id: 1, name: "Officer Cadet" },
          course: { id: 1, name: "84 BAFA", code: "84" },
        });
      }

      // Fetch ground marks
      try {
        const groundResponse = await ftw11sqnGroundExaminationMarkService.getAllMarks({
          cadet_id: parseInt(cadetId),
          course_id: parseInt(courseId),
          semester_id: parseInt(semesterId),
          per_page: 1000,
        });

        if (groundResponse.data && groundResponse.data.length > 0) {
          setGroundMarks(groundResponse.data);

          // Process ground data
          const groundPhaseMap = new Map<string, { marks: GroundMark[]; total_max: number; total_obtained: number }>();

          groundResponse.data.forEach((mark: GroundMark) => {
            const phaseName = mark.phase?.ground_fullname || "Unknown";

            if (!groundPhaseMap.has(phaseName)) {
              groundPhaseMap.set(phaseName, { marks: [], total_max: 0, total_obtained: 0 });
            }

            const group = groundPhaseMap.get(phaseName)!;
            group.marks.push(mark);
            group.total_max += mark.test?.max_mark || 100;
            group.total_obtained += parseFloat(mark.exam_mark || "0");
          });

          const processedGroundData: GroundPhaseData[] = [];
          let groundSl = 1;
          groundPhaseMap.forEach((data, phaseName) => {
            processedGroundData.push({
              sl: groundSl++,
              phase_name: phaseName,
              tests: data.marks.length,
              max_mark: data.total_max,
              obtained: data.total_obtained,
              percentage: data.total_max > 0 ? (data.total_obtained / data.total_max) * 100 : 0,
            });
          });

          if (processedGroundData.length > 0) {
            setGroundData(processedGroundData);
          } else {
            setGroundData(dummyGroundData);
          }
        } else {
          setGroundData(dummyGroundData);
        }
      } catch (groundError) {
        console.error("Error fetching ground marks:", groundError);
        setGroundData(dummyGroundData);
      }

    } catch (error) {
      console.error("Error fetching cadet data:", error);
      setFlyingData(dummyFlyingData);
      setGroundData(dummyGroundData);
      setUseDummyData(true);
      setCadetDetails({
        id: parseInt(cadetId),
        name: "Sakib Ahmed",
        bd_no: "14672",
        rank: { id: 1, name: "Officer Cadet" },
        course: { id: 1, name: "84 BAFA", code: "84" },
      });
    } finally {
      setLoading(false);
    }
  }, [cadetId, courseId, semesterId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    : 55.13;

  // Overall percentage calculation
  const overallPercentage = useDummyData ? 18.38 : (dailyAverage * 4) / 12;

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
          <h2 className="text-md font-bold text-gray-800 uppercase">11 SQUADRON BAF</h2>
        </div>
      </div>

      {/* Personal Details */}
      <div className="mt-4">
        <h2 className="uppercase font-bold text-sm mb-2">PERSONAL DETAILS</h2>
        <div className="grid grid-cols-3 gap-x-8 gap-y-1 text-sm">
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
                          <span className="text-red-500 font-bold">{dailyAverage.toFixed(2)}</span>
                        </td>
                      ) : null
                    ) : (
                      <td className="px-1 py-1 text-center text-black border border-black">{phase.daily_avg}</td>
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
                <td className="px-1 py-1 text-center text-black border border-black">{useDummyData ? 84 : flyingTotals.approved_dual_sorties || "-"}</td>
                <td className="px-1 py-1 text-center text-black border border-black">{useDummyData ? 20 : flyingTotals.approved_solo_sorties || "-"}</td>
                <td className="px-1 py-1 text-center text-black border border-black">{useDummyData ? "86:30" : "-"}</td>
                <td className="px-1 py-1 text-center text-black border border-black">{useDummyData ? "16:00" : "-"}</td>
                <td className="px-1 py-1 text-center text-blue-600 border border-black font-bold">{useDummyData ? 6 : flyingTotals.actual_dual_sorties || "-"}</td>
                <td className="px-1 py-1 text-center text-blue-600 border border-black font-bold">{useDummyData ? 0 : flyingTotals.actual_solo_sorties || "-"}</td>
                <td className="px-1 py-1 text-center text-blue-600 border border-black font-bold">{useDummyData ? "5:15" : "-"}</td>
                <td className="px-1 py-1 text-center text-blue-600 border border-black font-bold">{useDummyData ? "0:00" : "-"}</td>
                <td className="px-1 py-1 text-center text-black border border-black">-</td>
                <td className="px-1 py-1 text-center text-black border border-black">-</td>
                <td className="px-1 py-1 text-center text-black border border-black font-bold">{useDummyData ? 12 : flyingTotals.total_weight + 4}</td>
                <td className="px-1 py-1 text-center text-green-600 border border-black font-bold">{useDummyData ? "220.50" : (dailyAverage * 4).toFixed(2)}</td>
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
          <span className="font-semibold w-48">11. Total on Type</span>
          <span className="border-b border-black px-4">{useDummyData ? "5:15 hrs" : "-"}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-48">12. Grand Total</span>
          <span className="border-b border-black px-4">{useDummyData ? "5:15 hrs" : "-"}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-48">13. Overall Grading</span>
          <span className="border-b border-black px-4">{overallPercentage.toFixed(2)} %</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-48">14. Position in the Course</span>
          <span className="border-b border-black px-4">{useDummyData ? "6th" : "-"}</span>
          <span className="mx-2">out of</span>
          <span className="border-b border-black px-4">{useDummyData ? "7" : "-"}</span>
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
          { title: "Rmks by CIC", number: "18. Bulk approved by 11 Sqn Orderly Room" },
          { title: "Rmks by Flt Cdr", number: "19. Pending approval" },
          { title: "Rmks by OC 11 Sqn", number: "20. Pending approval" },
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
                  <p className="text-xs font-semibold">11 Squadron BAF</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
