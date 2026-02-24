/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import FullLogo from "@/components/ui/fulllogo";
import type { CtwResultsModule, CtwResultsModuleEstimatedMark } from "@/libs/types/ctw";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

export default function ModuleDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = parseInt(params?.id as string);

  const [module, setModule] = useState<CtwResultsModule | null>(null);
  const [estimatedMarks, setEstimatedMarks] = useState<CtwResultsModuleEstimatedMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingMark, setDeletingMark] = useState<CtwResultsModuleEstimatedMark | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [moduleData, marksData] = await Promise.all([
        ctwResultsModuleService.getModule(moduleId),
        ctwResultsModuleService.getEstimatedMarks(moduleId)
      ]);

      if (moduleData) {
        setModule(moduleData);
        setEstimatedMarks(marksData);
      } else {
        setError("Module not found");
      }
    } catch (err) {
      console.error("Failed to load module data:", err);
      setError("Failed to load module data");
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    if (moduleId) {
      loadData();
    }
  }, [moduleId, loadData]);

  // Determine which columns have data across all estimated marks
  const columnVisibility = useMemo(() => {
    const allDetails = estimatedMarks.flatMap(m => m.details || []);
    const allScores = allDetails.flatMap(d => d.scores || []);

    return {
      hasMarkPerInstructor: estimatedMarks.some(m => m.estimated_mark_per_instructor),
      hasConversationMark: estimatedMarks.some(m => m.conversation_mark),
      hasPracticeCount: estimatedMarks.some(m => m.practice_count),
      hasConvertOfPractice: estimatedMarks.some(m => m.convert_of_practice),
      hasConvertOfExam: estimatedMarks.some(m => m.convert_of_exam),
      // Detail columns
      hasDetailName: allDetails.some(d => d.name),
      hasDetailMaleQty: allDetails.some(d => d.male_quantity !== undefined && d.male_quantity !== null && d.male_quantity !== 0),
      hasDetailFemaleQty: allDetails.some(d => d.female_quantity !== undefined && d.female_quantity !== null && d.female_quantity !== 0),
      hasDetailMaleMarks: allDetails.some(d => d.male_marks !== undefined && d.male_marks !== null && Number(d.male_marks) !== 0),
      hasDetailFemaleMarks: allDetails.some(d => d.female_marks !== undefined && d.female_marks !== null && Number(d.female_marks) !== 0),
      hasDetails: allDetails.length > 0,
      hasScores: allScores.length > 0,
      // Score columns
      hasScoreMaleQty: allScores.some(s => s.male_quantity !== undefined && s.male_quantity !== null && s.male_quantity !== 0),
      hasScoreMaleTime: allScores.some(s => s.male_time),
      hasScoreMaleMark: allScores.some(s => s.male_mark !== undefined && s.male_mark !== null && Number(s.male_mark) !== 0),
      hasScoreFemaleQty: allScores.some(s => s.female_quantity !== undefined && s.female_quantity !== null && s.female_quantity !== 0),
      hasScoreFemaleTime: allScores.some(s => s.female_time),
      hasScoreFemaleMark: allScores.some(s => s.female_mark !== undefined && s.female_mark !== null && Number(s.female_mark) !== 0),
    };
  }, [estimatedMarks]);

  const detailSubColCount = useMemo(() => {
    let count = 0;
    if (columnVisibility.hasDetailName) count++;
    if (columnVisibility.hasDetailMaleQty) count++;
    if (columnVisibility.hasDetailFemaleQty) count++;
    if (columnVisibility.hasDetailMaleMarks) count++;
    if (columnVisibility.hasDetailFemaleMarks) count++;
    return count;
  }, [columnVisibility]);

  const totalColCount = useMemo(() => {
    let count = 4; // Ser, Course, Semester, Exam Type
    if (columnVisibility.hasDetails) count += detailSubColCount;
    if (columnVisibility.hasMarkPerInstructor) count++;
    if (columnVisibility.hasConversationMark) count++;
    count++; // Actions
    return count;
  }, [columnVisibility, detailSubColCount]);

  const handlePrint = () => {
    window.print();
  };

  const handleAddMark = () => {
    router.push(`/ctw/modules/${moduleId}/estimated-marks/create`);
  };

  const handleEditMark = (mark: CtwResultsModuleEstimatedMark) => {
    router.push(`/ctw/modules/${moduleId}/estimated-marks/${mark.id}/edit`);
  };

  const handleViewMark = (mark: CtwResultsModuleEstimatedMark) => {
    router.push(`/ctw/modules/${moduleId}/estimated-marks/${mark.id}`);
  };

  const handleDeleteMark = (mark: CtwResultsModuleEstimatedMark) => {
    setDeletingMark(mark);
    setDeleteModalOpen(true);
  };

  const confirmDeleteMark = async () => {
    if (!deletingMark) return;
    try {
      setDeleteLoading(true);
      await ctwResultsModuleService.deleteEstimatedMark(moduleId, deletingMark.id);
      await loadData();
      setDeleteModalOpen(false);
      setDeletingMark(null);
    } catch (err) {
      console.error("Failed to delete estimated mark:", err);
      alert("Failed to delete estimated mark");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Calculate total rows for a mark (details + score rows)
  const getMarkRowCount = (mark: CtwResultsModuleEstimatedMark) => {
    const details = mark.details || [];
    if (details.length === 0) return 1;
    let rows = 0;
    for (const detail of details) {
      rows++; // detail row itself
      if (detail.scores && detail.scores.length > 0) rows++; // score sub-table row
    }
    return rows;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
        <Icon icon="hugeicons:alert-circle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 font-semibold mb-4">{error || "Module not found"}</p>
        <button
          onClick={() => router.push("/ctw/modules")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Modules
        </button>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ctw/modules")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => router.push(`/ctw/modules/${module.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Module
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 cv-content">
        {/* Header with Logo */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            CTW Module Detail Sheet
          </p>
        </div>

        {/* Module Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Module Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Module Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold">{module.full_name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Short Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{module.short_name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Module Code</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono">{module.code}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Total Mark</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold">{module.total_mark}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Instructor Count</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{module.instructor_count}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className={`flex-1 font-bold ${module.is_active ? "text-green-600" : "text-red-600"}`}>
                {module.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Estimated Marks Configuration Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 border-b border-dashed border-gray-400 pb-1">
            <h2 className="text-lg font-bold text-gray-900">
              Estimated Marks Configuration
            </h2>
            <button
                onClick={handleAddMark}
                className="no-print flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 font-semibold"
            >
                <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                Add New Config
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={columnVisibility.hasDetails ? 2 : 1}>Ser</th>
                  <th className="border border-black px-2 py-2 text-left align-middle" rowSpan={columnVisibility.hasDetails ? 2 : 1}>Course</th>
                  <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={columnVisibility.hasDetails ? 2 : 1}>Semester</th>
                  <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={columnVisibility.hasDetails ? 2 : 1}>Exam Type</th>
                  {columnVisibility.hasPracticeCount && (
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={columnVisibility.hasDetails ? 2 : 1}>Prac. Qty</th>
                  )}
                  {columnVisibility.hasConvertOfPractice && (
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={columnVisibility.hasDetails ? 2 : 1}>Conv. Prac</th>
                  )}
                  {columnVisibility.hasConvertOfExam && (
                    <th className="border border-black px-2 py-2 text-center align-middle" rowSpan={columnVisibility.hasDetails ? 2 : 1}>Conv. Exam</th>
                  )}
                  {columnVisibility.hasDetails && (
                    <th className="border border-black px-2 py-2 text-center align-middle" colSpan={detailSubColCount}>Configuration Details</th>
                  )}
                  {columnVisibility.hasMarkPerInstructor && (
                    <th className="border border-black px-2 py-2 text-center align-middle text-blue-700" rowSpan={columnVisibility.hasDetails ? 2 : 1}>Total Mark/Inst</th>
                  )}
                  {columnVisibility.hasConversationMark && (
                    <th className="border border-black px-2 py-2 text-center align-middle text-green-700" rowSpan={columnVisibility.hasDetails ? 2 : 1}>Total Conv. Mark</th>
                  )}
                  <th className="border border-black px-2 py-2 text-center align-middle no-print" rowSpan={columnVisibility.hasDetails ? 2 : 1}>Actions</th>
                </tr>
                {columnVisibility.hasDetails && (
                  <tr>
                    {columnVisibility.hasDetailName && <th className="border border-black px-1 py-1 text-left align-middle text-[10px]">Name</th>}
                    {columnVisibility.hasDetailMaleQty && <th className="border border-black px-1 py-1 text-center align-middle text-[10px]">M Qty</th>}
                    {columnVisibility.hasDetailFemaleQty && <th className="border border-black px-1 py-1 text-center align-middle text-[10px]">F Qty</th>}
                    {columnVisibility.hasDetailMaleMarks && <th className="border border-black px-1 py-1 text-center align-middle text-[10px]">M Marks</th>}
                    {columnVisibility.hasDetailFemaleMarks && <th className="border border-black px-1 py-1 text-center align-middle text-[10px]">F Marks</th>}
                  </tr>
                )}
              </thead>
              <tbody>
                {estimatedMarks.length > 0 ? (
                  estimatedMarks.map((mark, index) => {
                    const details = mark.details || [];
                    const totalRows = getMarkRowCount(mark);

                    if (details.length === 0) {
                      return (
                        <tr key={mark.id}>
                          <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                          <td className="border border-black px-2 py-2">
                            <div className="font-bold text-gray-900">{mark.course?.name || "N/A"}</div>
                          </td>
                          <td className="border border-black px-2 py-2 text-center">{mark.semester?.name || "N/A"}</td>
                          <td className="border border-black px-2 py-2 text-center">{mark.exam_type?.name || "N/A"}</td>
                          {columnVisibility.hasPracticeCount && (
                            <td className="border border-black px-2 py-2 text-center">{mark.practice_count ?? "-"}</td>
                          )}
                          {columnVisibility.hasConvertOfPractice && (
                            <td className="border border-black px-2 py-2 text-center">{mark.convert_of_practice ?? "-"}</td>
                          )}
                          {columnVisibility.hasConvertOfExam && (
                            <td className="border border-black px-2 py-2 text-center">{mark.convert_of_exam ?? "-"}</td>
                          )}
                          {columnVisibility.hasDetails && (
                            <td className="border border-black px-1 py-1 text-center" colSpan={detailSubColCount}>-</td>
                          )}
                          {columnVisibility.hasMarkPerInstructor && (
                            <td className="border border-black px-2 py-2 text-center font-bold text-blue-700">
                              {mark.estimated_mark_per_instructor ? parseFloat(String(mark.estimated_mark_per_instructor)).toFixed(2) : "-"}
                            </td>
                          )}
                          {columnVisibility.hasConversationMark && (
                            <td className="border border-black px-2 py-2 text-center font-bold text-green-700">
                              {mark.conversation_mark ? parseFloat(String(mark.conversation_mark)).toFixed(2) : "-"}
                            </td>
                          )}
                          <td className="border border-black px-2 py-2 text-center no-print">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleViewMark(mark)} className="text-blue-600 hover:text-blue-700" title="View">
                                <Icon icon="hugeicons:view" className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEditMark(mark)} className="text-yellow-600 hover:text-yellow-700" title="Edit">
                                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteMark(mark)} className="text-red-600 hover:text-red-700" title="Delete">
                                <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <React.Fragment key={mark.id}>
                        {details.map((detail, dIndex) => (
                          <React.Fragment key={`${mark.id}-${dIndex}`}>
                            <tr>
                              {dIndex === 0 && (
                                <>
                                  <td className="border border-black px-2 py-2 text-center" rowSpan={totalRows}>{index + 1}</td>
                                  <td className="border border-black px-2 py-2" rowSpan={totalRows}>
                                    <div className="font-bold text-gray-900">{mark.course?.name || "N/A"}</div>
                                  </td>
                                  <td className="border border-black px-2 py-2 text-center" rowSpan={totalRows}>{mark.semester?.name || "N/A"}</td>
                                  <td className="border border-black px-2 py-2 text-center" rowSpan={totalRows}>{mark.exam_type?.name || "N/A"}</td>
                                  {columnVisibility.hasPracticeCount && (
                                    <td className="border border-black px-2 py-2 text-center" rowSpan={totalRows}>{mark.practice_count ?? "-"}</td>
                                  )}
                                  {columnVisibility.hasConvertOfPractice && (
                                    <td className="border border-black px-2 py-2 text-center" rowSpan={totalRows}>{mark.convert_of_practice ?? "-"}</td>
                                  )}
                                  {columnVisibility.hasConvertOfExam && (
                                    <td className="border border-black px-2 py-2 text-center" rowSpan={totalRows}>{mark.convert_of_exam ?? "-"}</td>
                                  )}
                                </>
                              )}
                              {columnVisibility.hasDetailName && <td className="border border-black px-1 py-1 text-[11px]" rowSpan={detail.scores && detail.scores.length > 0 ? 2 : 1}>{detail.name || "-"}</td>}
                              {columnVisibility.hasDetailMaleQty && <td className="border border-black px-1 py-1 text-center text-[11px]">{detail.male_quantity ?? "-"}</td>}
                              {columnVisibility.hasDetailFemaleQty && <td className="border border-black px-1 py-1 text-center text-[11px]">{detail.female_quantity ?? "-"}</td>}
                              {columnVisibility.hasDetailMaleMarks && <td className="border border-black px-1 py-1 text-center text-[11px]">{detail.male_marks ?? "-"}</td>}
                              {columnVisibility.hasDetailFemaleMarks && <td className="border border-black px-1 py-1 text-center text-[11px]">{detail.female_marks ?? "-"}</td>}
                              {dIndex === 0 && (
                                <>
                                  {columnVisibility.hasMarkPerInstructor && (
                                    <td className="border border-black px-2 py-2 text-center font-bold text-blue-700" rowSpan={totalRows}>
                                      {mark.estimated_mark_per_instructor ? parseFloat(String(mark.estimated_mark_per_instructor)).toFixed(2) : "-"}
                                    </td>
                                  )}
                                  {columnVisibility.hasConversationMark && (
                                    <td className="border border-black px-2 py-2 text-center font-bold text-green-700" rowSpan={totalRows}>
                                      {mark.conversation_mark ? parseFloat(String(mark.conversation_mark)).toFixed(2) : "-"}
                                    </td>
                                  )}
                                  <td className="border border-black px-2 py-2 text-center no-print" rowSpan={totalRows}>
                                    <div className="flex items-center justify-center gap-2">
                                      <button onClick={() => handleViewMark(mark)} className="text-blue-600 hover:text-blue-700" title="View">
                                        <Icon icon="hugeicons:view" className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleEditMark(mark)} className="text-yellow-600 hover:text-yellow-700" title="Edit">
                                        <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleDeleteMark(mark)} className="text-red-600 hover:text-red-700" title="Delete">
                                        <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                            {detail.scores && detail.scores.length > 0 && (
                              <tr>
                                <td colSpan={detailSubColCount - (columnVisibility.hasDetailName ? 1 : 0)} className="border border-black px-2 py-2">
                                  {(() => {
                                    const scores = detail.scores;
                                    const scoreVis = {
                                      hasMaleQty: scores.some(s => s.male_quantity !== undefined && s.male_quantity !== null && s.male_quantity !== 0),
                                      hasMaleTime: scores.some(s => s.male_time && s.male_time !== "-"),
                                      hasMaleMark: scores.some(s => s.male_mark !== undefined && s.male_mark !== null && Number(s.male_mark) !== 0),
                                      hasFemaleQty: scores.some(s => s.female_quantity !== undefined && s.female_quantity !== null && s.female_quantity !== 0),
                                      hasFemaleTime: scores.some(s => s.female_time && s.female_time !== "-"),
                                      hasFemaleMark: scores.some(s => s.female_mark !== undefined && s.female_mark !== null && Number(s.female_mark) !== 0),
                                    };
                                    return (
                                      <table className="w-full border-collapse border border-black text-xs">
                                        <thead>
                                          <tr className="">
                                            <th className="border border-black px-1 py-1 text-center">#</th>
                                            {scoreVis.hasMaleQty && <th className="border border-black px-1 py-1 text-center">Male Qty</th>}
                                            {scoreVis.hasMaleTime && <th className="border border-black px-1 py-1 text-center">Male Time</th>}
                                            {scoreVis.hasMaleMark && <th className="border border-black px-1 py-1 text-center">Male Mark</th>}
                                            {scoreVis.hasFemaleQty && <th className="border border-black px-1 py-1 text-center">Female Qty</th>}
                                            {scoreVis.hasFemaleTime && <th className="border border-black px-1 py-1 text-center">Female Time</th>}
                                            {scoreVis.hasFemaleMark && <th className="border border-black px-1 py-1 text-center">Female Mark</th>}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {scores.map((score, sIdx) => (
                                            <tr key={score.id || sIdx}>
                                              <td className="border border-black px-1 py-1 text-center">{sIdx + 1}</td>
                                              {scoreVis.hasMaleQty && <td className="border border-black px-1 py-1 text-center">{score.male_quantity ?? "-"}</td>}
                                              {scoreVis.hasMaleTime && <td className="border border-black px-1 py-1 text-center">{score.male_time || "-"}</td>}
                                              {scoreVis.hasMaleMark && <td className="border border-black px-1 py-1 text-center">{score.male_mark ?? "-"}</td>}
                                              {scoreVis.hasFemaleQty && <td className="border border-black px-1 py-1 text-center">{score.female_quantity ?? "-"}</td>}
                                              {scoreVis.hasFemaleTime && <td className="border border-black px-1 py-1 text-center">{score.female_time || "-"}</td>}
                                              {scoreVis.hasFemaleMark && <td className="border border-black px-1 py-1 text-center">{score.female_mark ?? "-"}</td>}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    );
                                  })()}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={totalColCount} className="border border-black px-4 py-8 text-center text-gray-500 italic">
                      No estimated marks configured for this module.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            System Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created At</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {module.created_at ? new Date(module.created_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Last Updated</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                {module.updated_at ? new Date(module.updated_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer with date */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteMark}
        title="Delete Estimated Mark"
        message="Are you sure you want to delete this estimated mark configuration? This will affect results calculation."
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
