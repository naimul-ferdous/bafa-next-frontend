"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import DatePicker from "@/components/form/input/DatePicker";
import type { SystemCourse, SystemSemester } from "@/libs/types/system";

interface CadetRow {
  cadet_id: number;
  cadet_number: string;
  cadet_name: string;
  cadet_rank: string;
  branch: string;
}

interface OneMilePracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: SystemCourse[];
  semesters: SystemSemester[];
  selectedCourseId: number;
  selectedSemesterId: number;
  maxTestMark: number;
  cadetRows: CadetRow[];
  modalPracticeDate: string;
  setModalPracticeDate: (date: string) => void;
  modalPracticeMarks: { [cadetId: number]: { achieved_mark: number; remark: string } };
  onChangePracticeMark: (cadetId: number, field: "achieved_mark" | "remark", value: string | number) => void;
  onSave: () => void;
  saving: boolean;
  error: string;
  success: string;
}

export default function OneMilePracticeModal({
  isOpen,
  onClose,
  courses,
  semesters,
  selectedCourseId,
  selectedSemesterId,
  maxTestMark,
  cadetRows,
  modalPracticeDate,
  setModalPracticeDate,
  modalPracticeMarks,
  onChangePracticeMark,
  onSave,
  saving,
  error,
  success,
}: OneMilePracticeModalProps) {
  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const selectedSemester = semesters.find(s => s.id === selectedSemesterId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton className="max-w-4xl">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h2>
          <h3 className="text-lg font-semibold text-gray-700 mt-2">Add Practice Marks</h3>
          <p className="text-sm text-gray-500">
            Enter practice marks for {selectedCourse?.name || ""} - {selectedSemester?.name || ""}
          </p>
        </div>

        {/* Date Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Practice Date <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={modalPracticeDate}
            onChange={(e) => setModalPracticeDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Select date"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
          <table className="w-full border-collapse border border-black text-xs">
            <thead className="sticky top-0">
              <tr className="bg-green-100">
                <th className="border border-black px-3 py-2 text-center whitespace-nowrap">SL</th>
                <th className="border border-black px-3 py-2 text-center whitespace-nowrap">BD No.</th>
                <th className="border border-black px-3 py-2 text-center whitespace-nowrap">Rank</th>
                <th className="border border-black px-3 py-2 text-left whitespace-nowrap">Name</th>
                <th className="border border-black px-3 py-2 text-left whitespace-nowrap">Branch</th>
                <th className="border border-black px-3 py-2 text-center whitespace-nowrap">
                  Mark{maxTestMark > 0 ? ` (Max: ${maxTestMark})` : ""}
                </th>
                <th className="border border-black px-3 py-2 text-left whitespace-nowrap">Remark</th>
              </tr>
            </thead>
            <tbody>
              {cadetRows.map((cadet, index) => (
                <tr key={cadet.cadet_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-black px-3 py-2 text-center">{index + 1}</td>
                  <td className="border border-black px-3 py-2 text-center">{cadet.cadet_number}</td>
                  <td className="border border-black px-3 py-2 text-center">{cadet.cadet_rank}</td>
                  <td className="border border-black px-3 py-2">{cadet.cadet_name}</td>
                  <td className="border border-black px-3 py-2">{cadet.branch}</td>
                  <td className="border border-black px-2 py-1 text-center">
                    <input
                      type="number"
                      min={0}
                      max={maxTestMark > 0 ? maxTestMark : undefined}
                      step={0.01}
                      value={modalPracticeMarks[cadet.cadet_id]?.achieved_mark ?? 0}
                      onChange={(e) => onChangePracticeMark(cadet.cadet_id, "achieved_mark", parseFloat(e.target.value) || 0)}
                      className="w-20 px-1 py-1 border border-gray-300 rounded text-center text-xs focus:ring-2 focus:ring-green-500 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-black px-2 py-1">
                    <input
                      type="text"
                      value={modalPracticeMarks[cadet.cadet_id]?.remark ?? ""}
                      onChange={(e) => onChangePracticeMark(cadet.cadet_id, "remark", e.target.value)}
                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500 bg-white"
                      placeholder="Optional remark"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!modalPracticeDate || saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon icon="hugeicons:save-02" className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}