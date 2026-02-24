/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch } from "@/libs/types/system";
import type { AtwAssessmentOlqResult } from "@/libs/types/atwAssessmentOlq";
import type { CtwAssessmentOlqResult } from "@/libs/types/ctwAssessmentOlq";
import type { Ftw11sqnAssessmentOlqResult } from "@/libs/types/ftw11sqnAssessmentOlq";
import type { Ftw12sqnAssessmentOlqResult } from "@/libs/types/ftw12sqnAssessmentOlq";
import { courseService } from "@/libs/services/courseService";
import { semesterService } from "@/libs/services/semesterService";
import { programService } from "@/libs/services/programService";
import { branchService } from "@/libs/services/branchService";
import { atwAssessmentOlqResultService } from "@/libs/services/atwAssessmentOlqResultService";
import { ctwAssessmentOlqResultService } from "@/libs/services/ctwAssessmentOlqResultService";
import { ftw11sqnAssessmentOlqResultService } from "@/libs/services/ftw11sqnAssessmentOlqResultService";
import { ftw12sqnAssessmentOlqResultService } from "@/libs/services/ftw12sqnAssessmentOlqResultService";

type TabType = "ATW" | "CTW" | "11SQN" | "12SQN";

interface WingResults {
  ATW: AtwAssessmentOlqResult[];
  CTW: CtwAssessmentOlqResult[];
  "11SQN": Ftw11sqnAssessmentOlqResult[];
  "12SQN": Ftw12sqnAssessmentOlqResult[];
}

export default function CptcOlqPage() {
  const [formData, setFormData] = useState({
    course_id: 0,
    semester_id: 0,
    program_id: 0,
    branch_id: 0,
  });

  const [wingResults, setWingResults] = useState<WingResults>({
    ATW: [],
    CTW: [],
    "11SQN": [],
    "12SQN": [],
  });
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("ATW");

  // Dropdown data
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);


  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const [coursesRes, semestersRes, programsRes, branchesRes] = await Promise.all([
          courseService.getAllCourses({ per_page: 100 }),
          semesterService.getAllSemesters({ per_page: 100 }),
          programService.getAllPrograms({ per_page: 100 }),
          branchService.getAllBranches({ per_page: 100 }),
        ]);

        setCourses(coursesRes.data.filter(c => c.is_active));
        setSemesters(semestersRes.data.filter(s => s.is_active));
        setPrograms(programsRes.data.filter(p => p.is_active));
        setBranches(branchesRes.data.filter(b => b.is_active));
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setError("Failed to load required data. Please refresh the page.");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, []);

  // Auto-load OLQ results when filters change
  useEffect(() => {
    const loadOlqResults = async () => {
      if (!formData.course_id || !formData.semester_id || !formData.program_id || !formData.branch_id) {
        setWingResults({ ATW: [], CTW: [], "11SQN": [], "12SQN": [] });
        return;
      }

      try {
        setLoadingResults(true);
        setError("");

        const queryParams = {
          per_page: 100,
          course_id: formData.course_id,
          semester_id: formData.semester_id,
          program_id: formData.program_id,
          branch_id: formData.branch_id,
        };

        // Fetch from all 4 wings in parallel
        const [atwRes, ctwRes, ftw11sqnRes, ftw12sqnRes] = await Promise.all([
          atwAssessmentOlqResultService.getAllResults(queryParams),
          ctwAssessmentOlqResultService.getAllResults(queryParams),
          ftw11sqnAssessmentOlqResultService.getAllResults(queryParams),
          ftw12sqnAssessmentOlqResultService.getAllResults(queryParams),
        ]);

        setWingResults({
          ATW: atwRes.data,
          CTW: ctwRes.data,
          "11SQN": ftw11sqnRes.data,
          "12SQN": ftw12sqnRes.data,
        });
      } catch (err) {
        console.error("Failed to load OLQ results:", err);
        setError("Failed to load OLQ results");
      } finally {
        setLoadingResults(false);
      }
    };

    loadOlqResults();
  }, [formData.course_id, formData.semester_id, formData.program_id, formData.branch_id]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Calculate total for a cadet's marks - same logic as CTW OlqResultForm
  const calculateCadetTotal = (marks: any[], estimatedMarks: any[], markIdField: string, typeCode?: string) => {
    let total = 0;
    estimatedMarks?.forEach(em => {
      const mark = marks?.find(m => m[markIdField] === em.id);
      const achievedMark = mark ? parseFloat(String(mark.achieved_mark || 0)) : 0;
      const estimatedMark = parseFloat(String(em.estimated_mark || 0));
      total += estimatedMark * achievedMark;
    });

    // If type_code is "for_116b", multiply by 1.5
    if (typeCode?.toLowerCase() === "for_116b") {
      total = total * 1.5;
    }

    return total;
  };

  // Calculate max total - same logic as CTW OlqResultForm
  const calculateMaxTotal = (estimatedMarks: any[], typeCode?: string) => {
    // Max total = sum of all (estimated_marks * 10) when input is 10 for each
    let total = estimatedMarks?.reduce((sum, em) => sum + (parseFloat(String(em.estimated_mark || 0)) * 10), 0) || 0;

    // If type_code is "for_116b", multiply by 1.5
    if (typeCode?.toLowerCase() === "for_116b") {
      total = total * 1.5;
    }

    return total;
  };

  // Get mark ID field based on tab
  const getMarkIdField = (tab: TabType) => {
    switch (tab) {
      case "ATW": return "atw_assessment_olq_type_estimated_mark_id";
      case "CTW": return "ctw_assessment_olq_type_estimated_mark_id";
      case "11SQN": return "ftw_11sqn_assessment_olq_type_estimated_mark_id";
      case "12SQN": return "ftw_12sqn_assessment_olq_type_estimated_mark_id";
    }
  };

  const filtersSelected = formData.course_id && formData.semester_id && formData.program_id && formData.branch_id;

  // Get selected filter names for display
  const selectedCourse = courses.find(c => c.id === formData.course_id);
  const selectedSemester = semesters.find(s => s.id === formData.semester_id);
  const selectedProgram = programs.find(p => p.id === formData.program_id);
  const selectedBranch = branches.find(b => b.id === formData.branch_id);

  // Get current tab results
  const currentResults = wingResults[activeTab] || [];
  const markIdField = getMarkIdField(activeTab);

  // Tab configuration
  const tabs: { key: TabType; label: string; color: string; bgColor: string; borderColor: string }[] = [
    { key: "ATW", label: "ATW", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-500" },
    { key: "CTW", label: "CTW", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-500" },
    { key: "11SQN", label: "FTW 11SQN", color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-500" },
    { key: "12SQN", label: "FTW 12SQN", color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-500" },
  ];

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
          CPTC - Consolidated OLQ Assessment Results
        </h2>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Filter Section */}
      <div className="border border-gray-200 rounded-lg p-6 no-print">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:filter" className="w-5 h-5 text-blue-500" />
          Filter Options
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Label>Program <span className="text-red-500">*</span></Label>
            <select
              value={formData.program_id}
              onChange={(e) => handleChange("program_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select Program</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>{program.name} ({program.code})</option>
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
      </div>

      {/* Selected Filter Info (for print) */}
      {filtersSelected && (
        <div className="hidden print:block mb-4 border-b pb-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Course:</strong> {selectedCourse?.name}</div>
            <div><strong>Semester:</strong> {selectedSemester?.name}</div>
            <div><strong>Program:</strong> {selectedProgram?.name}</div>
            <div><strong>Branch:</strong> {selectedBranch?.name}</div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {/* {filtersSelected && !loadingResults && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{wingResults.ATW.length}</div>
            <div className="text-sm text-blue-700">ATW Results</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{wingResults.CTW.length}</div>
            <div className="text-sm text-green-700">CTW Results</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{wingResults["11SQN"].length}</div>
            <div className="text-sm text-purple-700">FTW 11SQN Results</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{wingResults["12SQN"].length}</div>
            <div className="text-sm text-orange-700">FTW 12SQN Results</div>
          </div>
        </div>
      )} */}

      {/* Tab Navigation */}
      {filtersSelected && (
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 no-print" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = wingResults[tab.key]?.length || 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-6 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                    isActive
                      ? `${tab.bgColor} ${tab.color} ${tab.borderColor}`
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    isActive ? `${tab.bgColor} ${tab.color}` : "bg-gray-100 text-gray-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
          {/* Print header for active tab */}
          <div className="hidden print:block py-2">
            <h3 className="text-lg font-semibold">{tabs.find(t => t.key === activeTab)?.label} OLQ Results</h3>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Icon icon="hugeicons:document-01" className="w-5 h-5 text-blue-500" />
            {tabs.find(t => t.key === activeTab)?.label} OLQ Results ({currentResults.length})
          </h3>
          {filtersSelected && currentResults.length > 0 && (
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 no-print"
            >
              <Icon icon="hugeicons:printer" className="w-4 h-4" />
              Print
            </button>
          )}
        </div>

        {!filtersSelected ? (
          <div className="text-center py-12 text-gray-500">
            <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
            <p>Please select Course, Semester, Program, and Branch to load OLQ results</p>
          </div>
        ) : loadingResults ? (
          <div className="w-full min-h-[20vh] flex items-center justify-center">
            <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
          </div>
        ) : currentResults.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icon icon="hugeicons:document-01" className="w-10 h-10 mx-auto mb-2" />
            <p>No {tabs.find(t => t.key === activeTab)?.label} OLQ results found for the selected filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentResults.map((result: any) => {
              const estimatedMarks = result.olq_type?.estimated_marks || [];
              const resultCadets = result.result_cadets || [];
              const typeCode = result.olq_type?.type_code;

              return (
                <div key={result.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Result Header */}
                  <div
                    className={`flex items-center justify-between p-4 ${
                      tabs.find(t => t.key === activeTab)?.bgColor
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        activeTab === "ATW" ? "bg-blue-100 text-blue-700" :
                        activeTab === "CTW" ? "bg-green-100 text-green-700" :
                        activeTab === "11SQN" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {result.olq_type?.type_code || "N/A"}
                      </span>
                      <div>
                        <div className="font-semibold text-gray-900">{result.olq_type?.type_name || "Unknown"}</div>
                        <div className="text-sm text-gray-500">Cadets: {resultCadets.length} | Created: {result.created_at ? new Date(result.created_at).toLocaleDateString("en-GB") : "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Table Content - Always Visible */}
                  {resultCadets.length > 0 && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-black text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-black px-3 py-2 text-center" rowSpan={2}>SL.</th>
                              <th className="border border-black px-3 py-2 text-center" rowSpan={2}>BD/NO</th>
                              <th className="border border-black px-3 py-2 text-left" rowSpan={2}>NAME</th>
                              <th className="border border-black px-3 py-2 text-center" rowSpan={2}>PRESENT</th>
                              {estimatedMarks.map((mark: any) => (
                                <th
                                  key={mark.id}
                                  className="border border-black px-2 py-2 text-center"
                                  style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', minWidth: '40px', height: '120px' }}
                                >
                                  <span className="font-semibold text-xs uppercase">{mark.event_name}</span>
                                </th>
                              ))}
                              <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={2}>TOTAL</th>
                            </tr>
                            <tr className="bg-gray-50">
                              {estimatedMarks.map((mark: any) => (
                                <th key={`est-${mark.id}`} className="border border-black px-2 py-1 text-center text-xs">
                                  <span className="block">(Max: 10)</span>
                                  <span className="block text-blue-600">EM: {parseFloat(String(mark.estimated_mark)).toFixed(1)}</span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {resultCadets.map((cadet: any, cadetIndex: number) => {
                              const cadetTotal = calculateCadetTotal(cadet.marks || [], estimatedMarks, markIdField, typeCode);
                              return (
                                <tr key={cadet.cadet_id} className="hover:bg-gray-50">
                                  <td className="border border-black px-3 py-2 text-center">{cadetIndex + 1}</td>
                                  <td className="border border-black px-3 py-2 text-center">{cadet.bd_no}</td>
                                  <td className={`border border-black px-3 py-2 ${!cadet.is_present ? 'text-red-500' : ''}`}>
                                    {cadet.cadet?.name || "Unknown"}
                                  </td>
                                  <td className="border border-black px-2 py-2 text-center">
                                    {cadet.is_present ? (
                                      <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5 text-green-600 mx-auto" />
                                    ) : (
                                      <span className="text-red-600 text-xs">{cadet.absent_reason || "Absent"}</span>
                                    )}
                                  </td>
                                  {estimatedMarks.map((em: any) => {
                                    const mark = cadet.marks?.find((m: any) => m[markIdField] === em.id);
                                    const achieved = mark ? parseFloat(String(mark.achieved_mark)) : 0;
                                    return (
                                      <td key={em.id} className="border border-black px-2 py-2 text-center">
                                        {cadet.is_present ? achieved.toFixed(1) : "—"}
                                      </td>
                                    );
                                  })}
                                  <td className="border border-black px-3 py-2 text-center font-bold">
                                    {cadet.is_present ? cadetTotal.toFixed(2) : "—"}
                                    {cadet.is_present && typeCode?.toLowerCase() === "for_116b" && (
                                      <span className="block text-xs text-green-600">(x1.5)</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {/* Maximum Input / Estimated Mark Row */}
                            <tr className="font-bold bg-gray-50">
                              <td className="border border-black px-3 py-2 text-center" colSpan={4}>Maximum Input / Estimated Mark</td>
                              {estimatedMarks.map((mark: any) => (
                                <td key={`max-${mark.id}`} className="border border-black px-2 py-2 text-center">
                                  <span className="block">10</span>
                                  <span className="block text-blue-600 text-xs">({parseFloat(String(mark.estimated_mark)).toFixed(1)})</span>
                                </td>
                              ))}
                              <td className="border border-black px-3 py-2 text-center">
                                {calculateMaxTotal(estimatedMarks, typeCode).toFixed(2)}
                                {typeCode?.toLowerCase() === "for_116b" && (
                                  <span className="block text-xs text-green-600">(x1.5)</span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {filtersSelected && currentResults.length > 0 && (
        <div className="text-center text-sm text-gray-600 mt-4">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      )}
    </div>
  );
}
