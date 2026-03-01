/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import type { SystemCourse, SystemBranch, SystemSemester } from "@/libs/types/system";
import { courseService } from "@/libs/services/courseService";
import { branchService } from "@/libs/services/branchService";
import { semesterService } from "@/libs/services/semesterService";
import { atwResultService } from "@/libs/services/atwResultService";
import { atwAssessmentOlqResultService } from "@/libs/services/atwAssessmentOlqResultService";
import { ctwAssessmentOlqResultService } from "@/libs/services/ctwAssessmentOlqResultService";
import { ctwFootDrillResultService } from "@/libs/services/ctwFootDrillResultService";
import { ctwSwordDrillResultService } from "@/libs/services/ctwSwordDrillResultService";
import { ctwArmsDrillResultService } from "@/libs/services/ctwArmsDrillResultService";
import { ctwLeadershipSkillResultService } from "@/libs/services/ctwLeadershipSkillResultService";
import { ftw11sqnAssessmentOlqResultService } from "@/libs/services/ftw11sqnAssessmentOlqResultService";
import { ftw12sqnAssessmentOlqResultService } from "@/libs/services/ftw12sqnAssessmentOlqResultService";
import { ftw11sqnGroundExaminationMarkService } from "@/libs/services/ftw11sqnGroundExaminationMarkService";
import { ftw12sqnGroundExaminationMarkService } from "@/libs/services/ftw12sqnGroundExaminationMarkService";
import { ftw11sqnFlyingExaminationMarkService } from "@/libs/services/ftw11sqnFlyingExaminationMarkService";
import { ftw12sqnFlyingExaminationMarkService } from "@/libs/services/ftw12sqnFlyingExaminationMarkService";
import { atwCadetWarningService } from "@/libs/services/atwCadetWarningService";
import { ctwCadetWarningService } from "@/libs/services/ctwCadetWarningService";
import { ftw11sqnCadetWarningService } from "@/libs/services/ftw11sqnCadetWarningService";
import { ftw12sqnCadetWarningService } from "@/libs/services/ftw12sqnCadetWarningService";

interface CadetConsolidatedData {
  cadet_id: number;
  bd_no: string;
  rank: string;
  name: string;
  branch: string;
  flg_percent: number;      // Flying percentage
  flg_x6: number;           // Flying x 6
  aca_percent: number;      // Academic percentage
  aca_x4: number;           // Academic x 4
  gst_percent: number;      // GST percentage
  gst_x3: number;           // GST x 3
  olq_percent: number;      // OLQ percentage
  olq_x3: number;           // OLQ x 3
  total: number;            // Total out of 1600
  percentage: number;       // Final percentage
}

// Multipliers
const FLG_MULTIPLIER = 6;
const ACA_MULTIPLIER = 4;
const GST_MULTIPLIER = 3;
const OLQ_MULTIPLIER = 3;
const MAX_TOTAL = 1600;

export default function CptcConsolidatedCoursePage() {
  const [formData, setFormData] = useState({
    course_id: 0,
    branch_id: 0,
    semester_id: 0,
  });

  const [consolidatedData, setConsolidatedData] = useState<CadetConsolidatedData[]>([]);
  const [error, setError] = useState("");

  // Dropdown data
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const [coursesRes, branchesRes, semestersRes] = await Promise.all([
          courseService.getAllCourses({ per_page: 100 }),
          branchService.getAllBranches({ per_page: 100 }),
          semesterService.getAllSemesters({ per_page: 100 }),
        ]);

        setCourses(coursesRes.data.filter(c => c.is_active));
        setBranches(branchesRes.data.filter(b => b.is_active));
        setSemesters(semestersRes.data.filter(s => s.is_active));
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, []);

  // Process OLQ results to get percentage per cadet
  // OLQ calculation: Sum of (estimated_mark × achieved_mark) / Max possible × 100
  // Max possible = Sum of (estimated_mark × 10) where 10 is max achieved score
  const processOlqResults = (results: any[], markIdField: string): { [cadetId: number]: { bd_no: string; rank: string; name: string; branch: string; total: number; achievedTotal: number; maxTotal: number; count: number } } => {
    const cadetTotals: { [cadetId: number]: { bd_no: string; rank: string; name: string; branch: string; total: number; achievedTotal: number; maxTotal: number; count: number } } = {};

    results.forEach(result => {
      const estimatedMarks = result.olq_type?.estimated_marks || [];
      const typeCode = result.olq_type?.type_code;

      // Calculate max possible score for this OLQ type (assuming max achieved is 10)
      let maxPossible = 0;
      estimatedMarks?.forEach((em: any) => {
        const estimatedMark = parseFloat(String(em.estimated_mark || 0));
        maxPossible += estimatedMark * 10; // Max achieved mark is 10
      });

      // Apply 116B multiplier to max as well
      if (typeCode?.toLowerCase() === "for_116b") {
        maxPossible = maxPossible * 1.5;
      }

      result.result_cadets?.forEach((cadetResult: any) => {
        if (!cadetResult.is_present) return;

        const cadetId = cadetResult.cadet_id;
        const bdNo = cadetResult.bd_no || cadetResult.cadet?.bd_no || cadetResult.cadet?.cadet_number || "";
        const rank = cadetResult.cadet?.rank?.name || "";
        const name = cadetResult.cadet?.name || "Unknown";
        const branch = cadetResult.cadet?.branch?.code || cadetResult.cadet?.branch?.name || "";

        if (!cadetTotals[cadetId]) {
          cadetTotals[cadetId] = { bd_no: bdNo, rank, name, branch, total: 0, achievedTotal: 0, maxTotal: 0, count: 0 };
        }

        let cadetTotal = 0;
        estimatedMarks?.forEach((em: any) => {
          const mark = cadetResult.marks?.find((m: any) => m[markIdField] === em.id);
          const achievedMark = mark ? parseFloat(String(mark.achieved_mark || 0)) : 0;
          const estimatedMark = parseFloat(String(em.estimated_mark || 0));
          cadetTotal += estimatedMark * achievedMark;
        });

        if (typeCode?.toLowerCase() === "for_116b") {
          cadetTotal = cadetTotal * 1.5;
        }

        cadetTotals[cadetId].achievedTotal += cadetTotal;
        cadetTotals[cadetId].maxTotal += maxPossible;
        cadetTotals[cadetId].count += 1;
      });
    });

    // Calculate percentage for each cadet
    Object.values(cadetTotals).forEach(cadet => {
      if (cadet.maxTotal > 0) {
        cadet.total = (cadet.achievedTotal / cadet.maxTotal) * 100;
      }
    });

    return cadetTotals;
  };

  // Process ATW academic results - Calculate percentage from all subjects
  const processAtwAcademicResults = (results: any[]): { [cadetId: number]: { bd_no: string; rank: string; name: string; branch: string; total: number; achievedTotal: number; fullMarkTotal: number } } => {
    const cadetTotals: { [cadetId: number]: { bd_no: string; rank: string; name: string; branch: string; total: number; achievedTotal: number; fullMarkTotal: number } } = {};

    results.forEach(result => {
      // Get the full mark for this subject
      const subjectFullMark = parseFloat(String(result.atw_subject_module?.subjects_full_mark || 100));

      result.result_getting_cadets?.forEach((cadetResult: any) => {
        const cadetId = cadetResult.cadet_id;
        const bdNo = cadetResult.cadet_bd_no || cadetResult.cadet?.bd_no || cadetResult.cadet?.cadet_number || "";
        const rank = cadetResult.cadet?.rank?.name || "";
        const name = cadetResult.cadet?.name || "Unknown";
        const branch = cadetResult.cadet?.branch?.code || cadetResult.cadet?.branch?.name || "";

        if (!cadetTotals[cadetId]) {
          cadetTotals[cadetId] = { bd_no: bdNo, rank, name, branch, total: 0, achievedTotal: 0, fullMarkTotal: 0 };
        }

        // Sum all achieved marks for this cadet in this subject
        let achievedSum = 0;
        cadetResult.cadet_marks?.forEach((mark: any) => {
          achievedSum += parseFloat(String(mark.achieved_mark || 0));
        });

        // Add to the cadet's totals
        cadetTotals[cadetId].achievedTotal += achievedSum;
        cadetTotals[cadetId].fullMarkTotal += subjectFullMark;
      });
    });

    // Calculate percentage for each cadet
    Object.values(cadetTotals).forEach(cadet => {
      if (cadet.fullMarkTotal > 0) {
        cadet.total = (cadet.achievedTotal / cadet.fullMarkTotal) * 100;
      }
    });

    return cadetTotals;
  };

  // Process CTW drill results (foot, sword, arms, leadership) - this is GST
  // Returns percentage based on achieved marks / full marks
  const processDrillResults = (results: any[]): { [cadetId: number]: { bd_no: string; rank: string; name: string; branch: string; total: number; achievedTotal: number; fullMarkTotal: number } } => {
    const cadetTotals: { [cadetId: number]: { bd_no: string; rank: string; name: string; branch: string; total: number; achievedTotal: number; fullMarkTotal: number } } = {};

    results.forEach(result => {
      // Get full mark for this drill type (default 100)
      const drillFullMark = parseFloat(String(result.full_mark || result.drill_type?.full_mark || 100));

      result.result_cadets?.forEach((cadetResult: any) => {
        const cadetId = cadetResult.cadet_id;
        const bdNo = cadetResult.bd_no || cadetResult.cadet?.bd_no || cadetResult.cadet?.cadet_number || "";
        const rank = cadetResult.cadet?.rank?.name || "";
        const name = cadetResult.cadet?.name || "Unknown";
        const branch = cadetResult.cadet?.branch?.code || cadetResult.cadet?.branch?.name || "";

        if (!cadetTotals[cadetId]) {
          cadetTotals[cadetId] = { bd_no: bdNo, rank, name, branch, total: 0, achievedTotal: 0, fullMarkTotal: 0 };
        }

        let achievedSum = 0;
        cadetResult.marks?.forEach((mark: any) => {
          achievedSum += parseFloat(String(mark.achieved_mark || 0));
        });

        cadetTotals[cadetId].achievedTotal += achievedSum;
        cadetTotals[cadetId].fullMarkTotal += drillFullMark;
      });
    });

    // Calculate percentage for each cadet
    Object.values(cadetTotals).forEach(cadet => {
      if (cadet.fullMarkTotal > 0) {
        cadet.total = (cadet.achievedTotal / cadet.fullMarkTotal) * 100;
      }
    });

    return cadetTotals;
  };

  // Process FTW flying examination marks - returns percentage
  const processFlyingMarks = (marks: any[]): { [cadetId: number]: { bd_no: string; rank: string; name: string; branch: string; total: number; achievedTotal: number; fullMarkTotal: number; count: number } } => {
    const cadetTotals: { [cadetId: number]: { bd_no: string; rank: string; name: string; branch: string; total: number; achievedTotal: number; fullMarkTotal: number; count: number } } = {};

    marks.forEach((mark: any) => {
      const cadetId = mark.cadet_id;
      const bdNo = mark.cadet?.bd_no || mark.cadet?.cadet_number || "";
      const rank = mark.cadet?.rank?.name || "";
      const name = mark.cadet?.name || "Unknown";
      const branch = mark.cadet?.branch?.code || mark.cadet?.branch?.name || "";
      const fullMark = parseFloat(String(mark.full_mark || mark.syllabus_type?.full_mark || 100));

      if (!cadetTotals[cadetId]) {
        cadetTotals[cadetId] = { bd_no: bdNo, rank, name, branch, total: 0, achievedTotal: 0, fullMarkTotal: 0, count: 0 };
      }

      cadetTotals[cadetId].achievedTotal += parseFloat(String(mark.achieved_mark || 0));
      cadetTotals[cadetId].fullMarkTotal += fullMark;
      cadetTotals[cadetId].count += 1;
    });

    // Calculate percentage for each cadet
    Object.values(cadetTotals).forEach(cadet => {
      if (cadet.fullMarkTotal > 0) {
        cadet.total = (cadet.achievedTotal / cadet.fullMarkTotal) * 100;
      }
    });

    return cadetTotals;
  };

  // Auto-load results when filters change
  useEffect(() => {
    const loadResults = async () => {
      if (!formData.course_id || !formData.branch_id || !formData.semester_id) {
        setConsolidatedData([]);
        return;
      }

      try {
        setLoadingResults(true);
        setError("");

        const queryParams = {
          per_page: 500,
          course_id: formData.course_id,
          branch_id: formData.branch_id,
          semester_id: formData.semester_id,
        };

        // Fetch all data in parallel
        const [
          atwAcademicRes,
          atwOlqRes,
          ctwOlqRes,
          ctwFootDrillRes,
          ctwSwordDrillRes,
          ctwArmsDrillRes,
          ctwLeadershipRes,
          ftw11sqnOlqRes,
          ftw12sqnOlqRes,
          ftw11sqnFlyingRes,
          ftw12sqnFlyingRes,
        ] = await Promise.all([
          atwResultService.getAllResults(queryParams),
          atwAssessmentOlqResultService.getAllResults(queryParams),
          ctwAssessmentOlqResultService.getAllResults(queryParams),
          ctwFootDrillResultService.getAllResults(queryParams),
          ctwSwordDrillResultService.getAllResults(queryParams),
          ctwArmsDrillResultService.getAllResults(queryParams),
          ctwLeadershipSkillResultService.getAllResults(queryParams),
          ftw11sqnAssessmentOlqResultService.getAllResults(queryParams),
          ftw12sqnAssessmentOlqResultService.getAllResults(queryParams),
          ftw11sqnFlyingExaminationMarkService.getAllMarks(queryParams),
          ftw12sqnFlyingExaminationMarkService.getAllMarks(queryParams),
        ]);

        // Process all results
        const atwAcademicTotals = processAtwAcademicResults(atwAcademicRes.data || []);

        // Combine all OLQ results (ATW + CTW + FTW) - average the percentages
        const allOlqTotals: { [cadetId: number]: { bd_no: string; rank: string; name: string; branch: string; total: number; achievedTotal: number; maxTotal: number; count: number } } = {};

        const atwOlqTotals = processOlqResults(atwOlqRes.data || [], "atw_assessment_olq_type_estimated_mark_id");
        const ctwOlqTotals = processOlqResults(ctwOlqRes.data || [], "ctw_assessment_olq_type_estimated_mark_id");
        const ftw11sqnOlqTotals = processOlqResults(ftw11sqnOlqRes.data || [], "ftw_11sqn_assessment_olq_type_estimated_mark_id");
        const ftw12sqnOlqTotals = processOlqResults(ftw12sqnOlqRes.data || [], "ftw_12sqn_assessment_olq_type_estimated_mark_id");

        // Combine OLQ totals - accumulate achieved and max totals for proper percentage calculation
        [atwOlqTotals, ctwOlqTotals, ftw11sqnOlqTotals, ftw12sqnOlqTotals].forEach(totals => {
          Object.entries(totals).forEach(([id, data]) => {
            const cadetId = parseInt(id);
            if (!allOlqTotals[cadetId]) {
              allOlqTotals[cadetId] = { ...data };
            } else {
              allOlqTotals[cadetId].achievedTotal += data.achievedTotal;
              allOlqTotals[cadetId].maxTotal += data.maxTotal;
              allOlqTotals[cadetId].count += data.count;
            }
          });
        });

        // Recalculate overall OLQ percentage for each cadet
        Object.values(allOlqTotals).forEach(cadet => {
          if (cadet.maxTotal > 0) {
            cadet.total = (cadet.achievedTotal / cadet.maxTotal) * 100;
          }
        });

        // Combine CTW drill results (GST) - accumulate totals for proper percentage
        const gstTotals: { [cadetId: number]: { bd_no: string; rank: string; name: string; branch: string; total: number; achievedTotal: number; fullMarkTotal: number } } = {};
        const combineDrillTotals = (drillTotals: { [cadetId: number]: { bd_no: string; rank: string; name: string; branch: string; total: number; achievedTotal: number; fullMarkTotal: number } }) => {
          Object.entries(drillTotals).forEach(([id, data]) => {
            const cadetId = parseInt(id);
            if (!gstTotals[cadetId]) {
              gstTotals[cadetId] = { ...data };
            } else {
              gstTotals[cadetId].achievedTotal += data.achievedTotal;
              gstTotals[cadetId].fullMarkTotal += data.fullMarkTotal;
            }
          });
        };

        combineDrillTotals(processDrillResults(ctwFootDrillRes.data || []));
        combineDrillTotals(processDrillResults(ctwSwordDrillRes.data || []));
        combineDrillTotals(processDrillResults(ctwArmsDrillRes.data || []));
        combineDrillTotals(processDrillResults(ctwLeadershipRes.data || []));

        // Recalculate GST percentage for each cadet
        Object.values(gstTotals).forEach(cadet => {
          if (cadet.fullMarkTotal > 0) {
            cadet.total = (cadet.achievedTotal / cadet.fullMarkTotal) * 100;
          }
        });

        // Combine FTW flying (11SQN + 12SQN) - accumulate totals for proper percentage
        const flyingTotals: { [cadetId: number]: { bd_no: string; rank: string; name: string; branch: string; total: number; achievedTotal: number; fullMarkTotal: number; count: number } } = {};
        const ftw11sqnFlyingTotals = processFlyingMarks(ftw11sqnFlyingRes.data || []);
        const ftw12sqnFlyingTotals = processFlyingMarks(ftw12sqnFlyingRes.data || []);

        [ftw11sqnFlyingTotals, ftw12sqnFlyingTotals].forEach(totals => {
          Object.entries(totals).forEach(([id, data]) => {
            const cadetId = parseInt(id);
            if (!flyingTotals[cadetId]) {
              flyingTotals[cadetId] = { ...data };
            } else {
              flyingTotals[cadetId].achievedTotal += data.achievedTotal;
              flyingTotals[cadetId].fullMarkTotal += data.fullMarkTotal;
              flyingTotals[cadetId].count += data.count;
            }
          });
        });

        // Recalculate Flying percentage for each cadet
        Object.values(flyingTotals).forEach(cadet => {
          if (cadet.fullMarkTotal > 0) {
            cadet.total = (cadet.achievedTotal / cadet.fullMarkTotal) * 100;
          }
        });

        // Get all unique cadet IDs
        const allCadetIds = new Set<number>();
        Object.keys(atwAcademicTotals).forEach(id => allCadetIds.add(parseInt(id)));
        Object.keys(allOlqTotals).forEach(id => allCadetIds.add(parseInt(id)));
        Object.keys(gstTotals).forEach(id => allCadetIds.add(parseInt(id)));
        Object.keys(flyingTotals).forEach(id => allCadetIds.add(parseInt(id)));

        // Build consolidated data
        const consolidated: CadetConsolidatedData[] = [];

        allCadetIds.forEach(cadetId => {
          const academic = atwAcademicTotals[cadetId];
          const olq = allOlqTotals[cadetId];
          const gst = gstTotals[cadetId];
          const flying = flyingTotals[cadetId];

          // Get cadet info from any available source
          const cadetInfo = flying || academic || olq || gst;
          if (!cadetInfo) return;

          // Calculate percentages (assuming max 100 for each category)
          const flgPercent = flying?.total || 0;
          const acaPercent = academic?.total || 0;
          const gstPercent = gst?.total || 0;
          const olqPercent = olq?.total || 0;

          // Calculate multiplied values
          const flgX6 = flgPercent * FLG_MULTIPLIER;
          const acaX4 = acaPercent * ACA_MULTIPLIER;
          const gstX3 = gstPercent * GST_MULTIPLIER;
          const olqX3 = olqPercent * OLQ_MULTIPLIER;

          // Calculate total
          const total = flgX6 + acaX4 + gstX3 + olqX3;

          // Calculate final percentage
          const percentage = (total / MAX_TOTAL) * 100;

          consolidated.push({
            cadet_id: cadetId,
            bd_no: cadetInfo.bd_no,
            rank: cadetInfo.rank,
            name: cadetInfo.name,
            branch: cadetInfo.branch,
            flg_percent: flgPercent,
            flg_x6: flgX6,
            aca_percent: acaPercent,
            aca_x4: acaX4,
            gst_percent: gstPercent,
            gst_x3: gstX3,
            olq_percent: olqPercent,
            olq_x3: olqX3,
            total: total,
            percentage: percentage,
          });
        });

        // Sort by total (descending) for position
        consolidated.sort((a, b) => b.total - a.total);

        setConsolidatedData(consolidated);
      } catch (err) {
        console.error("Failed to load results:", err);
        setError("Failed to load results");
      } finally {
        setLoadingResults(false);
      }
    };

    loadResults();
  }, [formData.course_id, formData.branch_id, formData.semester_id]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Get position suffix
  const getPositionSuffix = (pos: number) => {
    if (pos >= 11 && pos <= 13) return "th";
    switch (pos % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  // Get remarks based on position
  const getRemarks = (pos: number) => {
    if (pos === 1) return "Sword of Honour";
    return "";
  };

  const filtersSelected = formData.course_id && formData.branch_id && formData.semester_id;
  const selectedCourse = courses.find(c => c.id === formData.course_id);
  const selectedBranch = branches.find(b => b.id === formData.branch_id);

  if (loadingDropdowns) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="w-full min-h-[20vh] flex items-center justify-center">
          <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      {/* Filter Section - Hidden on Print */}
      <div className="border border-gray-200 rounded-lg p-6 no-print">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:filter" className="w-5 h-5 text-blue-500" />
          Filter Options
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Course <span className="text-red-500">*</span></Label>
            <select
              value={formData.course_id}
              onChange={(e) => handleChange("course_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Semester <span className="text-red-500">*</span></Label>
            <select
              value={formData.semester_id}
              onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select Semester</option>
              {semesters.map(semester => (
                <option key={semester.id} value={semester.id}>{semester.name} ({semester.code})</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Branch <span className="text-red-500">*</span></Label>
            <select
              value={formData.branch_id}
              onChange={(e) => handleChange("branch_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select Branch</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Print Button */}
        {filtersSelected && consolidatedData.length > 0 && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Icon icon="hugeicons:printer" className="w-4 h-4" />
              Print
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2 no-print">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Results Section */}
      <div>
        {!filtersSelected ? (
          <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-lg no-print">
            <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
            <p>Please select Course, Semester, and Branch to load consolidated results</p>
          </div>
        ) : loadingResults ? (
          <div className="w-full min-h-[20vh] flex items-center justify-center border border-gray-200 rounded-lg">
            <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
          </div>
        ) : consolidatedData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-lg no-print">
            <Icon icon="hugeicons:document-01" className="w-10 h-10 mx-auto mb-2" />
            <p>No results found for the selected filters</p>
          </div>
        ) : (
          <div className="relative">
            {/* CONFIDENTIAL - Top Left */}
            <p className="absolute -left-2 top-0 text-xs font-bold text-black transform -rotate-90 origin-top-left hidden print:block" style={{ marginTop: '100px' }}>CONFIDENTIAL</p>

            {/* CONFIDENTIAL - Top Right */}
            <p className="text-right text-xs font-bold text-black mb-2">CONFIDENTIAL</p>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <FullLogo />
              </div>
              <h1 className="text-lg font-bold text-black uppercase">
                BANGLADESH AIR FORCE ACADEMY
              </h1>
              <h2 className="text-md font-bold text-black uppercase mt-1">
                CONSOLIDATED END OF COURSE RESULT
              </h2>
              <h3 className="text-md font-bold text-black uppercase mt-1">
                FOR SWORD OF HONOUR
              </h3>
              <p className="text-sm font-bold text-black mt-1 uppercase">
                NO {selectedCourse?.code || ""} BAFA COURSE : {selectedBranch?.code || ""} BR
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse', border: '1px solid black' }}>
                <thead>
                  {/* Header Row 1 */}
                  <tr>
                    <th rowSpan={3} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold min-w-[30px] bg-gray-100">Ser</th>
                    <th rowSpan={3} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold min-w-[60px] bg-gray-100">BD/No</th>
                    <th colSpan={2} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold bg-gray-100">
                      Particulars of Offr Cdts
                    </th>
                    <th rowSpan={3} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold min-w-[30px] bg-gray-100">Br</th>
                    <th colSpan={8} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold bg-gray-100">
                      Marks Obtained
                    </th>
                    <th rowSpan={3} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold min-w-[60px] bg-gray-100">
                      Total<br/><span className="text-[10px]">1600</span>
                    </th>
                    <th rowSpan={3} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold min-w-[40px] bg-gray-100">%</th>
                    <th rowSpan={3} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold min-w-[40px] bg-gray-100">Posn</th>
                    <th rowSpan={3} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold min-w-[80px] bg-gray-100">Rmk</th>
                  </tr>

                  {/* Header Row 2 */}
                  <tr>
                    <th rowSpan={2} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold min-w-[40px] bg-gray-100">Rank</th>
                    <th rowSpan={2} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold min-w-[120px] bg-gray-100">Name</th>
                    <th colSpan={2} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold bg-gray-50">Flg</th>
                    <th colSpan={2} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold bg-gray-50">Aca</th>
                    <th colSpan={2} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold bg-gray-50">GST</th>
                    <th colSpan={2} style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold bg-gray-50">OLQ</th>
                  </tr>

                  {/* Header Row 3 - Sub columns */}
                  <tr>
                    <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[50px] bg-gray-50">Flg(%)</th>
                    <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[55px] bg-gray-50">Flgx6</th>
                    <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[50px] bg-gray-50">Aca(%)</th>
                    <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[55px] bg-gray-50">Acax4</th>
                    <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[50px] bg-gray-50">GST(%)</th>
                    <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[55px] bg-gray-50">GSTx3</th>
                    <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[50px] bg-gray-50">OLQ(%)</th>
                    <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[55px] bg-gray-50">OLQx3</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedData.map((cadet, index) => {
                    const position = index + 1;
                    const remarks = getRemarks(position);

                    return (
                      <tr key={cadet.cadet_id}>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center">{position}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-medium">{cadet.bd_no}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center">{cadet.rank}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-left">{cadet.name}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center">{cadet.branch}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center">{cadet.flg_percent.toFixed(4)}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center">{cadet.flg_x6.toFixed(4)}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center">{cadet.aca_percent.toFixed(4)}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center">{cadet.aca_x4.toFixed(4)}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center">{cadet.gst_percent.toFixed(4)}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center">{cadet.gst_x3.toFixed(4)}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center">{cadet.olq_percent.toFixed(4)}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center">{cadet.olq_x3.toFixed(4)}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-medium">{cadet.total.toFixed(4)}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center">{cadet.percentage.toFixed(4)}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center font-bold">{position}{getPositionSuffix(position)}</td>
                        <td style={{ border: '1px solid black' }} className="px-1 py-1 text-center text-[10px]">{remarks}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs font-bold text-black">CONFIDENTIAL</p>
              <p className="text-xs text-black">1</p>
              <p className="text-xs font-bold text-black">CONFIDENTIAL</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
