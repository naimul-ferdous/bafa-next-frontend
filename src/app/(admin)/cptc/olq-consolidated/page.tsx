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
import { atwAssessmentOlqResultService } from "@/libs/services/atwAssessmentOlqResultService";
import { ctwAssessmentOlqResultService } from "@/libs/services/ctwAssessmentOlqResultService";
import { ftw11sqnAssessmentOlqResultService } from "@/libs/services/ftw11sqnAssessmentOlqResultService";
import { ftw12sqnAssessmentOlqResultService } from "@/libs/services/ftw12sqnAssessmentOlqResultService";
import { atwCadetWarningService } from "@/libs/services/atwCadetWarningService";
import { ctwCadetWarningService } from "@/libs/services/ctwCadetWarningService";
import { ftw11sqnCadetWarningService } from "@/libs/services/ftw11sqnCadetWarningService";
import { ftw12sqnCadetWarningService } from "@/libs/services/ftw12sqnCadetWarningService";

interface CadetConsolidatedData {
  cadet_id: number;
  bd_no: string;
  rank: string;
  name: string;
  ftw_marks: number;      // FTW total (11SQN + 12SQN combined or whichever has data)
  atw_marks: number;      // ATW total
  ctw_marks: number;      // CTW total
  deduction: number;      // Total deduction from warnings
}

// Weightage factors
const FTW_WEIGHT = 0.45;  // 45%
const ATW_WEIGHT = 0.25;  // 25%
const CTW_WEIGHT = 0.30;  // 30%
const MAX_MARKS = 300;    // Maximum marks per wing

// Semester multipliers for coursewise calculation
const SEMESTER_MULTIPLIERS: { [key: string]: number } = {
  "S1": 1,
  "S2": 1.5,
  "S3": 2,
  "S4": 2.5,
  "S5": 3,
  "S6": 3,
};

// Semester display names
const SEMESTER_NAMES: { [key: string]: string } = {
  "S1": "1st Term",
  "S2": "2nd Term",
  "S3": "3rd Term",
  "S4": "4th Term",
  "S5": "5th Term",
  "S6": "6th Term",
};

export default function CptcOlqConsolidatedPage() {
  const [activeTab, setActiveTab] = useState<"consolidated" | "coursewise">("coursewise");
  const [formData, setFormData] = useState({
    course_id: 0,
    branch_id: 0,
    semester_id: 0,
  });

  const [consolidatedData, setConsolidatedData] = useState<CadetConsolidatedData[]>([]);
  const [coursewiseData, setCoursewiseData] = useState<any[]>([]);
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

  // Calculate total for a cadet's marks
  const calculateCadetTotal = (marks: any[], estimatedMarks: any[], markIdField: string, typeCode?: string) => {
    let total = 0;
    estimatedMarks?.forEach(em => {
      const mark = marks?.find(m => m[markIdField] === em.id);
      const achievedMark = mark ? parseFloat(String(mark.achieved_mark || 0)) : 0;
      const estimatedMark = parseFloat(String(em.estimated_mark || 0));
      total += estimatedMark * achievedMark;
    });

    if (typeCode?.toLowerCase() === "for_116b") {
      total = total * 1.5;
    }

    return total;
  };

  // Process results from a wing
  const processWingResults = (results: any[], markIdField: string): { [cadetId: number]: { bd_no: string; rank: string; name: string; total: number } } => {
    const cadetTotals: { [cadetId: number]: { bd_no: string; rank: string; name: string; total: number } } = {};

    results.forEach(result => {
      const estimatedMarks = result.olq_type?.estimated_marks || [];
      const typeCode = result.olq_type?.type_code;

      result.result_cadets?.forEach((cadetResult: any) => {
        if (!cadetResult.is_present) return;

        const cadetId = cadetResult.cadet_id;
        const bdNo = cadetResult.bd_no || "";
        const rank = cadetResult.cadet?.rank?.name || "";
        const name = cadetResult.cadet?.name || "Unknown";

        if (!cadetTotals[cadetId]) {
          cadetTotals[cadetId] = { bd_no: bdNo, rank, name, total: 0 };
        }

        const cadetTotal = calculateCadetTotal(cadetResult.marks || [], estimatedMarks, markIdField, typeCode);
        cadetTotals[cadetId].total += cadetTotal;
      });
    });

    return cadetTotals;
  };

  // Auto-load coursewise OLQ results (all semesters) when course and branch change
  useEffect(() => {
    const loadCoursewiseOlqResults = async () => {
      if (!formData.course_id || !formData.branch_id || activeTab !== "coursewise") {
        setCoursewiseData([]);
        return;
      }

      try {
        setLoadingResults(true);
        setError("");

        // Get all semesters for this course
        const activeSemesters = semesters.filter(s => s.is_active);

        // Fetch data for all semesters in parallel
        const allSemestersData = await Promise.all(
          activeSemesters.map(async (semester) => {
            const queryParams = {
              per_page: 500,
              course_id: formData.course_id,
              branch_id: formData.branch_id,
              semester_id: semester.id,
            };

            const warningQueryParams = {
              per_page: 500,
              course_id: formData.course_id,
              semester_id: semester.id,
              is_active: true,
            };

            const [atwRes, ctwRes, ftw11sqnRes, ftw12sqnRes, atwWarnings, ctwWarnings, ftw11sqnWarnings, ftw12sqnWarnings] = await Promise.all([
              atwAssessmentOlqResultService.getAllResults(queryParams),
              ctwAssessmentOlqResultService.getAllResults(queryParams),
              ftw11sqnAssessmentOlqResultService.getAllResults(queryParams),
              ftw12sqnAssessmentOlqResultService.getAllResults(queryParams),
              atwCadetWarningService.getAll(warningQueryParams),
              ctwCadetWarningService.getAll(warningQueryParams),
              ftw11sqnCadetWarningService.getAll(warningQueryParams),
              ftw12sqnCadetWarningService.getAll(warningQueryParams),
            ]);

            // Process warnings
            const cadetDeductions: { [cadetId: number]: number } = {};
            const processWarnings = (warnings: any[]) => {
              warnings.forEach(warning => {
                if (warning.is_active && warning.warning?.reduced_mark) {
                  const cadetId = warning.cadet_id;
                  const reducedMark = parseFloat(String(warning.warning.reduced_mark || 0));
                  if (!cadetDeductions[cadetId]) {
                    cadetDeductions[cadetId] = 0;
                  }
                  cadetDeductions[cadetId] += reducedMark;
                }
              });
            };

            processWarnings(atwWarnings.data || []);
            processWarnings(ctwWarnings.data || []);
            processWarnings(ftw11sqnWarnings.data || []);
            processWarnings(ftw12sqnWarnings.data || []);

            const atwTotals = processWingResults(atwRes.data, "atw_assessment_olq_type_estimated_mark_id");
            const ctwTotals = processWingResults(ctwRes.data, "ctw_assessment_olq_type_estimated_mark_id");
            const ftw11sqnTotals = processWingResults(ftw11sqnRes.data, "ftw_11sqn_assessment_olq_type_estimated_mark_id");
            const ftw12sqnTotals = processWingResults(ftw12sqnRes.data, "ftw_12sqn_assessment_olq_type_estimated_mark_id");

            // Combine FTW
            const ftwTotals: { [cadetId: number]: { bd_no: string; rank: string; name: string; total: number } } = {};
            Object.entries(ftw11sqnTotals).forEach(([cadetId, data]) => {
              const id = parseInt(cadetId);
              if (!ftwTotals[id]) {
                ftwTotals[id] = { ...data };
              } else {
                ftwTotals[id].total += data.total;
              }
            });
            Object.entries(ftw12sqnTotals).forEach(([cadetId, data]) => {
              const id = parseInt(cadetId);
              if (!ftwTotals[id]) {
                ftwTotals[id] = { ...data };
              } else {
                ftwTotals[id].total += data.total;
              }
            });

            // Get all unique cadet IDs
            const allCadetIds = new Set<number>();
            Object.keys(atwTotals).forEach(id => allCadetIds.add(parseInt(id)));
            Object.keys(ctwTotals).forEach(id => allCadetIds.add(parseInt(id)));
            Object.keys(ftwTotals).forEach(id => allCadetIds.add(parseInt(id)));

            // Build semester data per cadet
            const semesterCadetData: { [cadetId: number]: any } = {};
            allCadetIds.forEach(cadetId => {
              const atw = atwTotals[cadetId];
              const ctw = ctwTotals[cadetId];
              const ftw = ftwTotals[cadetId];
              const cadetInfo = ftw || atw || ctw;

              if (!cadetInfo) return;

              const showFTW = semester.code === "S5" || semester.code === "S6";
              const atwWeightedValue = showFTW ? ATW_WEIGHT : 0.35;
              const ctwWeightedValue = showFTW ? CTW_WEIGHT : 0.65;
              const totalWeighted = showFTW
                ? calcTotalWeighted(ftw?.total || 0, atw?.total || 0, ctw?.total || 0)
                : ((atw?.total || 0) * 0.35) + ((ctw?.total || 0) * 0.65);
              const percentage = calcPercentage(totalWeighted);
              const deduction = cadetDeductions[cadetId] || 0;
              const finalScore = percentage - deduction;

              semesterCadetData[cadetId] = {
                cadet_id: cadetId,
                bd_no: cadetInfo.bd_no,
                rank: cadetInfo.rank,
                name: cadetInfo.name,
                ftw_marks: ftw?.total || 0,
                atw_marks: atw?.total || 0,
                ctw_marks: ctw?.total || 0,
                deduction,
                finalScore,
                totalWeighted,
                percentage,
                showFTW,
              };
            });

            return {
              semester,
              cadetData: semesterCadetData,
            };
          })
        );

        // Combine all cadets across all semesters
        const allCadetsMap: { [cadetId: number]: any } = {};

        allSemestersData.forEach(({ semester, cadetData }) => {
          Object.entries(cadetData).forEach(([cadetId, data]: [string, any]) => {
            const id = parseInt(cadetId);
            if (!allCadetsMap[id]) {
              allCadetsMap[id] = {
                cadet_id: id,
                bd_no: data.bd_no,
                rank: data.rank,
                name: data.name,
                semesters: {},
              };
            }
            allCadetsMap[id].semesters[semester.code] = data;
          });
        });

        // Calculate total for each cadet and sort by total (descending)
        const coursewiseResult = Object.values(allCadetsMap).map(cadet => {
          let totalMultiplied = 0;
          activeSemesters.forEach(semester => {
            if (cadet.semesters[semester.code]) {
              const multiplier = SEMESTER_MULTIPLIERS[semester.code] || 1;
              const percentage = cadet.semesters[semester.code].percentage || 0;
              totalMultiplied += percentage * multiplier;
            }
          });
          return { ...cadet, totalMultiplied };
        }).sort((a, b) => b.totalMultiplied - a.totalMultiplied);

        setCoursewiseData(coursewiseResult);
      } catch (err) {
        console.error("Failed to load coursewise OLQ results:", err);
        setError("Failed to load coursewise OLQ results");
      } finally {
        setLoadingResults(false);
      }
    };

    loadCoursewiseOlqResults();
  }, [formData.course_id, formData.branch_id, activeTab, semesters]);

  // Auto-load OLQ results when filters change (for single semester)
  useEffect(() => {
    const loadOlqResults = async () => {
      if (!formData.course_id || !formData.branch_id || !formData.semester_id || activeTab !== "consolidated") {
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

        const warningQueryParams = {
          per_page: 500,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          is_active: true,
        };

        // Fetch OLQ results and warnings in parallel
        const [atwRes, ctwRes, ftw11sqnRes, ftw12sqnRes, atwWarnings, ctwWarnings, ftw11sqnWarnings, ftw12sqnWarnings] = await Promise.all([
          atwAssessmentOlqResultService.getAllResults(queryParams),
          ctwAssessmentOlqResultService.getAllResults(queryParams),
          ftw11sqnAssessmentOlqResultService.getAllResults(queryParams),
          ftw12sqnAssessmentOlqResultService.getAllResults(queryParams),
          atwCadetWarningService.getAll(warningQueryParams),
          ctwCadetWarningService.getAll(warningQueryParams),
          ftw11sqnCadetWarningService.getAll(warningQueryParams),
          ftw12sqnCadetWarningService.getAll(warningQueryParams),
        ]);

        // Process warnings to get total deduction per cadet
        const cadetDeductions: { [cadetId: number]: number } = {};

        const processWarnings = (warnings: any[]) => {
          warnings.forEach(warning => {
            if (warning.is_active && warning.warning?.reduced_mark) {
              const cadetId = warning.cadet_id;
              const reducedMark = parseFloat(String(warning.warning.reduced_mark || 0));
              if (!cadetDeductions[cadetId]) {
                cadetDeductions[cadetId] = 0;
              }
              cadetDeductions[cadetId] += reducedMark;
            }
          });
        };

        processWarnings(atwWarnings.data || []);
        processWarnings(ctwWarnings.data || []);
        processWarnings(ftw11sqnWarnings.data || []);
        processWarnings(ftw12sqnWarnings.data || []);

        const atwTotals = processWingResults(atwRes.data, "atw_assessment_olq_type_estimated_mark_id");
        const ctwTotals = processWingResults(ctwRes.data, "ctw_assessment_olq_type_estimated_mark_id");
        const ftw11sqnTotals = processWingResults(ftw11sqnRes.data, "ftw_11sqn_assessment_olq_type_estimated_mark_id");
        const ftw12sqnTotals = processWingResults(ftw12sqnRes.data, "ftw_12sqn_assessment_olq_type_estimated_mark_id");

        // Combine FTW 11SQN and 12SQN
        const ftwTotals: { [cadetId: number]: { bd_no: string; rank: string; name: string; total: number } } = {};

        // Add 11SQN totals
        Object.entries(ftw11sqnTotals).forEach(([cadetId, data]) => {
          const id = parseInt(cadetId);
          if (!ftwTotals[id]) {
            ftwTotals[id] = { ...data };
          } else {
            ftwTotals[id].total += data.total;
          }
        });

        // Add 12SQN totals
        Object.entries(ftw12sqnTotals).forEach(([cadetId, data]) => {
          const id = parseInt(cadetId);
          if (!ftwTotals[id]) {
            ftwTotals[id] = { ...data };
          } else {
            ftwTotals[id].total += data.total;
          }
        });

        // Get all unique cadet IDs
        const allCadetIds = new Set<number>();
        Object.keys(atwTotals).forEach(id => allCadetIds.add(parseInt(id)));
        Object.keys(ctwTotals).forEach(id => allCadetIds.add(parseInt(id)));
        Object.keys(ftwTotals).forEach(id => allCadetIds.add(parseInt(id)));

        // Build consolidated data
        const consolidated: CadetConsolidatedData[] = [];

        allCadetIds.forEach(cadetId => {
          const atw = atwTotals[cadetId];
          const ctw = ctwTotals[cadetId];
          const ftw = ftwTotals[cadetId];

          // Get cadet info from any available source
          const cadetInfo = ftw || atw || ctw;
          if (!cadetInfo) return;

          consolidated.push({
            cadet_id: cadetId,
            bd_no: cadetInfo.bd_no,
            rank: cadetInfo.rank,
            name: cadetInfo.name,
            ftw_marks: ftw?.total || 0,
            atw_marks: atw?.total || 0,
            ctw_marks: ctw?.total || 0,
            deduction: cadetDeductions[cadetId] || 0,
          });
        });

        // Sort by BD number
        consolidated.sort((a, b) => a.bd_no.localeCompare(b.bd_no));

        setConsolidatedData(consolidated);
      } catch (err) {
        console.error("Failed to load OLQ results:", err);
        setError("Failed to load OLQ results");
      } finally {
        setLoadingResults(false);
      }
    };

    loadOlqResults();
  }, [formData.course_id, formData.branch_id, formData.semester_id, activeTab]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate weighted marks
  const calcWeighted = (marks: number, weight: number) => marks * weight;

  // Calculate total weighted average
  const calcTotalWeighted = (ftw: number, atw: number, ctw: number) => {
    return (ftw * FTW_WEIGHT) + (atw * ATW_WEIGHT) + (ctw * CTW_WEIGHT);
  };

  // Calculate percentage (total out of 100)
  const calcPercentage = (totalWeighted: number) => (totalWeighted / MAX_MARKS) * 100;

  // Calculate positions for a specific column
  const calculatePositions = (data: CadetConsolidatedData[], getValue: (d: CadetConsolidatedData) => number): Map<number, number> => {
    const sorted = [...data].sort((a, b) => getValue(b) - getValue(a));
    const positions = new Map<number, number>();

    sorted.forEach((item, index) => {
      positions.set(item.cadet_id, index + 1);
    });

    return positions;
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

  const filtersSelected = activeTab === "consolidated"
    ? (formData.course_id && formData.branch_id && formData.semester_id)
    : (formData.course_id && formData.branch_id);
  const selectedCourse = courses.find(c => c.id === formData.course_id);
  const selectedBranch = branches.find(b => b.id === formData.branch_id);
  const selectedSemester = semesters.find(s => s.id === formData.semester_id);

  const activeSemesters = semesters.filter(s => s.is_active).sort((a, b) => a.code.localeCompare(b.code));

  // Check if FTW should be shown (only for S5 and S6 semesters)
  const showFTW = selectedSemester?.code === "S5" || selectedSemester?.code === "S6";

  // Calculate all positions
  const ftwPositions = calculatePositions(consolidatedData, d => d.ftw_marks);
  const atwPositions = calculatePositions(consolidatedData, d => d.atw_marks);
  const ctwPositions = calculatePositions(consolidatedData, d => d.ctw_marks);

  // Final positions based on final score (percentage - deduction)
  const finalPositions = calculatePositions(consolidatedData, d => {
    const totalWeighted = showFTW
      ? calcTotalWeighted(d.ftw_marks, d.atw_marks, d.ctw_marks)
      : (d.atw_marks * 0.35) + (d.ctw_marks * 0.65);
    const percentage = calcPercentage(totalWeighted);
    return percentage - d.deduction;
  });

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
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <FullLogo />
        </div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">
          Bangladesh Air Force Academy
        </h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
          {activeTab === "consolidated" && selectedSemester ? `END ${selectedSemester.name} ` : ""}CONSOLIDATED OLQ RESULT
        </h2>
        {filtersSelected && (
          <p className="text-sm text-gray-600 mt-1 uppercase">
            {selectedCourse?.name} COURSE : {selectedBranch?.name}
          </p>
        )}
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="no-print mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("coursewise")}
            className={`px-6 py-2.5 font-medium rounded-full transition-all ${
              activeTab === "coursewise"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Course and Branch wise
          </button>
          <button
            onClick={() => setActiveTab("consolidated")}
            className={`px-6 py-2.5 font-medium rounded-full transition-all ${
              activeTab === "consolidated"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Consolidated Only
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="border border-gray-200 rounded-lg p-6 no-print">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:filter" className="w-5 h-5 text-blue-500" />
          Filter Options
        </h3>

        <div className={`grid grid-cols-1 ${activeTab === "consolidated" ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4`}>
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

          {activeTab === "consolidated" && (
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
          )}
        </div>
      </div>

      {/* Print Button */}
      {filtersSelected && ((activeTab === "consolidated" && consolidatedData.length > 0) || (activeTab === "coursewise" && coursewiseData.length > 0)) && (
        <div className="flex justify-end no-print">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
        </div>
      )}

      {/* Results Section */}
      <div>
        {!filtersSelected ? (
          <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-lg">
            <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
            <p>Please select {activeTab === "consolidated" ? "Course, Branch, and Semester" : "Course and Branch"} to load consolidated OLQ results</p>
          </div>
        ) : loadingResults ? (
          <div className="w-full min-h-[20vh] flex items-center justify-center border border-gray-200 rounded-lg">
            <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
          </div>
        ) : activeTab === "consolidated" ? (
          consolidatedData.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-lg">
              <Icon icon="hugeicons:document-01" className="w-10 h-10 mx-auto mb-2" />
              <p>No OLQ results found for the selected filters</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse', border: '1px solid black' }}>
              <thead>
                {/* Header Row 1 */}
                <tr>
                  <th rowSpan={2} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[40px]">Ser</th>
                  <th rowSpan={2} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[70px]">BD/No</th>
                  <th rowSpan={2} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[60px]">Rank</th>
                  <th rowSpan={2} style={{ border: '1px solid black' }} className="px-2 py-2 text-left font-bold min-w-[150px]">Name</th>

                  {/* FTW Section - Only for S5 and S6 */}
                  {showFTW && (
                    <th colSpan={3} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold">
                      FTW={MAX_MARKS}
                    </th>
                  )}

                  {/* ATW Section */}
                  <th colSpan={3} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold">
                    ATW={MAX_MARKS}
                  </th>

                  {/* CTW Section */}
                  <th colSpan={3} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold">
                    CTW={MAX_MARKS}
                  </th>

                  {/* Total Section */}
                  <th rowSpan={2} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[80px]">
                    Total<br/>Weighted<br/>Avg<br/>{MAX_MARKS}
                  </th>
                  <th rowSpan={2} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[80px]">
                    Total=100%<br/><span className="text-[10px]">{showFTW ? "(FTW=45%," : "(ATW=35%,"}<br/>{showFTW ? "ATW=25%," : ""}<br/>{showFTW ? "CTW=30%)" : "CTW=65%)"}</span>
                  </th>
                  <th rowSpan={2} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[70px]">Deduction</th>
                  <th rowSpan={2} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[60px]">Final</th>
                  <th rowSpan={2} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[50px]">Posn</th>
                </tr>

                {/* Header Row 2 - Sub columns */}
                <tr>
                  {/* FTW Sub - Only for S5 and S6 */}
                  {showFTW && (
                    <>
                      <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[60px]">{MAX_MARKS}</th>
                      <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[60px]">{FTW_WEIGHT.toFixed(4)}</th>
                      <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[50px]">Posn</th>
                    </>
                  )}

                  {/* ATW Sub */}
                  <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[60px]">{MAX_MARKS}</th>
                  <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[60px]">{showFTW ? ATW_WEIGHT.toFixed(4) : "0.3500"}</th>
                  <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[50px]">Posn</th>

                  {/* CTW Sub */}
                  <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[60px]">{MAX_MARKS}</th>
                  <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[60px]">{showFTW ? CTW_WEIGHT.toFixed(4) : "0.6500"}</th>
                  <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[50px]">Posn</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedData.map((cadet, index) => {
                  const ftwWeighted = calcWeighted(cadet.ftw_marks, FTW_WEIGHT);
                  const atwWeightedValue = showFTW ? ATW_WEIGHT : 0.35;
                  const ctwWeightedValue = showFTW ? CTW_WEIGHT : 0.65;
                  const atwWeighted = calcWeighted(cadet.atw_marks, atwWeightedValue);
                  const ctwWeighted = calcWeighted(cadet.ctw_marks, ctwWeightedValue);
                  const totalWeighted = showFTW
                    ? calcTotalWeighted(cadet.ftw_marks, cadet.atw_marks, cadet.ctw_marks)
                    : (cadet.atw_marks * 0.35) + (cadet.ctw_marks * 0.65);
                  const percentage = calcPercentage(totalWeighted);
                  const deduction = cadet.deduction;
                  const finalScore = percentage - deduction;

                  const ftwPos = ftwPositions.get(cadet.cadet_id) || 0;
                  const atwPos = atwPositions.get(cadet.cadet_id) || 0;
                  const ctwPos = ctwPositions.get(cadet.cadet_id) || 0;
                  const finalPos = finalPositions.get(cadet.cadet_id) || 0;

                  return (
                    <tr key={cadet.cadet_id}>
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{index + 1}</td>
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center font-medium">{cadet.bd_no}</td>
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{cadet.rank}</td>
                      <td style={{ border: '1px solid black' }} className="px-2 py-1">{cadet.name}</td>

                      {/* FTW - Only for S5 and S6 */}
                      {showFTW && (
                        <>
                          <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{cadet.ftw_marks.toFixed(2)}</td>
                          <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{ftwWeighted.toFixed(4)}</td>
                          <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{ftwPos}{getPositionSuffix(ftwPos)}</td>
                        </>
                      )}

                      {/* ATW */}
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{cadet.atw_marks.toFixed(2)}</td>
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{atwWeighted.toFixed(4)}</td>
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{atwPos}{getPositionSuffix(atwPos)}</td>

                      {/* CTW */}
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{cadet.ctw_marks.toFixed(2)}</td>
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{ctwWeighted.toFixed(4)}</td>
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{ctwPos}{getPositionSuffix(ctwPos)}</td>

                      {/* Totals */}
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center font-medium">{totalWeighted.toFixed(4)}</td>
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center font-medium">{percentage.toFixed(4)}</td>
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{deduction.toFixed(2)}</td>
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center font-bold">{finalScore.toFixed(4)}</td>
                      <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center font-bold">{finalPos}{getPositionSuffix(finalPos)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
        ) : (
          // Coursewise Tab
          coursewiseData.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-lg">
              <Icon icon="hugeicons:document-01" className="w-10 h-10 mx-auto mb-2" />
              <p>No OLQ results found for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse', border: '1px solid black' }}>
                <thead>
                  {/* Header Row 1 */}
                  <tr>
                    <th rowSpan={3} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[40px]">Ser</th>
                    <th colSpan={3} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold">Particulars of Offr Cdts</th>
                    <th rowSpan={3} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[40px]">Br</th>

                    {/* Marks Obtained section spanning all semesters */}
                    <th colSpan={activeSemesters.length * 2} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold">
                      Marks Obtained
                    </th>

                    <th rowSpan={3} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[70px]">
                      Total<br/>(1300)
                    </th>
                    <th rowSpan={3} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[50px]">%</th>
                    <th rowSpan={3} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[50px]">Posn</th>
                  </tr>

                  {/* Header Row 2 */}
                  <tr>
                    <th rowSpan={2} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[70px]">BD/No</th>
                    <th rowSpan={2} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[60px]">Rank</th>
                    <th rowSpan={2} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold min-w-[150px]">Name</th>

                    {/* Semester columns with full names */}
                    {activeSemesters.map(semester => {
                      const semesterName = SEMESTER_NAMES[semester.code] || semester.name;
                      return (
                        <th key={semester.id} colSpan={2} style={{ border: '1px solid black' }} className="px-2 py-2 text-center font-bold">
                          {semesterName}
                        </th>
                      );
                    })}
                  </tr>

                  {/* Header Row 3 - Sub columns */}
                  <tr>
                    {activeSemesters.map(semester => {
                      const multiplier = SEMESTER_MULTIPLIERS[semester.code] || 1;
                      return (
                        <React.Fragment key={semester.id}>
                          <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[60px]">(%)</th>
                          <th style={{ border: '1px solid black' }} className="px-1 py-1 text-center min-w-[60px]">X {multiplier}</th>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {coursewiseData.map((cadet, index) => {
                    // Calculate total across all semesters (sum of multiplied values)
                    let totalMultiplied = 0;
                    let semesterCount = 0;

                    activeSemesters.forEach(semester => {
                      if (cadet.semesters[semester.code]) {
                        const multiplier = SEMESTER_MULTIPLIERS[semester.code] || 1;
                        const percentage = cadet.semesters[semester.code].percentage || 0;
                        totalMultiplied += percentage * multiplier;
                        semesterCount++;
                      }
                    });

                    // Calculate percentage out of 1300
                    const percentageOutOf1300 = (totalMultiplied / 1300) * 100;

                    return (
                      <tr key={cadet.cadet_id}>
                        <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{index + 1}</td>
                        <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center font-medium">{cadet.bd_no}</td>
                        <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{cadet.rank}</td>
                        <td style={{ border: '1px solid black' }} className="px-2 py-1">{cadet.name}</td>
                        <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">{selectedBranch?.code || ""}</td>

                        {/* Semester data */}
                        {activeSemesters.map(semester => {
                          const semData = cadet.semesters[semester.code];
                          const multiplier = SEMESTER_MULTIPLIERS[semester.code] || 1;
                          const percentage = semData ? semData.percentage : 0;
                          const multipliedValue = percentage * multiplier;

                          return (
                            <React.Fragment key={semester.id}>
                              <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">
                                {semData ? percentage.toFixed(4) : "-"}
                              </td>
                              <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center">
                                {semData ? multipliedValue.toFixed(4) : "-"}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center font-bold">
                          {totalMultiplied.toFixed(4)}
                        </td>
                        <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center font-bold">
                          {percentageOutOf1300.toFixed(4)}
                        </td>
                        <td style={{ border: '1px solid black' }} className="px-2 py-1 text-center font-bold">
                          {index + 1}{getPositionSuffix(index + 1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Footer */}
      {filtersSelected && ((activeTab === "consolidated" && consolidatedData.length > 0) || (activeTab === "coursewise" && coursewiseData.length > 0)) && (
        <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
          <p className="uppercase">CONFIDENTIAL</p>
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          <p className="uppercase">CONFIDENTIAL</p>
        </div>
      )}
    </div>
  );
}
