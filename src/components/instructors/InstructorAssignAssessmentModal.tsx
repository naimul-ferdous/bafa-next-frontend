"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import FullLogo from "../ui/fulllogo";
import { Modal } from "@/components/ui/modal";
import { InstructorBiodata, User } from "@/libs/types/user";
import type { SystemCourse } from "@/libs/types/system";
import { atwUserAssignService } from "@/libs/services/atwUserAssignService";
import {
  AtwPenpictureAssign,
  AtwCounselingAssign,
  AtwOlqAssign,
  AtwWarningAssign,
} from "@/libs/types/atwAssign";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instructor?: InstructorBiodata | null;
  user?: User | null;
  courses: SystemCourse[];
}

type AssessmentType = "penpicture" | "counseling" | "olq" | "warning";

const ASSESSMENTS: { key: AssessmentType; label: string; color: string }[] = [
  { key: "penpicture", label: "Pen Picture",  color: "bg-purple-100 text-purple-700 border-purple-200" },
  { key: "counseling", label: "Counseling",   color: "bg-blue-100   text-blue-700   border-blue-200"   },
  { key: "olq",        label: "OLQ",          color: "bg-green-100  text-green-700  border-green-200"  },
  { key: "warning",    label: "Warning",      color: "bg-red-100    text-red-700    border-red-200"    },
];

interface ExistingAssigns {
  penpicture: AtwPenpictureAssign | null;
  counseling: AtwCounselingAssign | null;
  olq:        AtwOlqAssign        | null;
  warning:    AtwWarningAssign    | null;
}

export default function InstructorAssignAssessmentModal({ isOpen, onClose, onSuccess, instructor, user, courses }: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [checks, setChecks] = useState<Record<AssessmentType, boolean>>({
    penpicture: false,
    counseling: false,
    olq:        false,
    warning:    false,
  });
  const [existing, setExisting] = useState<ExistingAssigns>({ penpicture: null, counseling: null, olq: null, warning: null });
  const [loadingAssigns, setLoadingAssigns] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = instructor?.user?.id ?? user?.id;
  const displayUser = instructor ? instructor.user : user;

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelectedCourseId("");
      setChecks({ penpicture: false, counseling: false, olq: false, warning: false });
      setExisting({ penpicture: null, counseling: null, olq: null, warning: null });
      setError(null);
    }
  }, [isOpen]);

  // Load existing assigns when course selected
  // Query by course_id only — if ANY user has an assessment for this course, disable it
  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchAssigns = async () => {
      setLoadingAssigns(true);
      setError(null);
      try {
        const data = await atwUserAssignService.getAll({
          course_id: parseInt(selectedCourseId),
        });

        const pp  = data.penpicture[0] || null;
        const cn  = data.counseling[0] || null;
        const olq = data.olq[0]        || null;
        const wrn = data.warning[0]    || null;

        setExisting({ penpicture: pp, counseling: cn, olq, warning: wrn });
        // Pre-check only if the CURRENT user already has the assignment
        setChecks({
          penpicture: !!pp  && pp.user_id  === userId,
          counseling: !!cn  && cn.user_id  === userId,
          olq:        !!olq && olq.user_id === userId,
          warning:    !!wrn && wrn.user_id === userId,
        });
      } catch {
        setError("Failed to load existing assignments.");
      } finally {
        setLoadingAssigns(false);
      }
    };

    fetchAssigns();
  }, [selectedCourseId, userId]);

  const handleSave = async () => {
    if (!selectedCourseId || !userId) {
      setError("Please select a course.");
      return;
    }

    setSaving(true);
    setError(null);
    const courseId = parseInt(selectedCourseId);
    const payload = { course_id: courseId, user_id: userId, is_active: true };

    try {
      const ops: Promise<unknown>[] = [];

      (["penpicture", "counseling", "olq", "warning"] as AssessmentType[]).forEach((key) => {
        if (checks[key] && !existing[key]) {
          ops.push(atwUserAssignService.store(key, payload));
        }
        // existing assigns are disabled — cannot be unchecked, so no destroy needed
      });

      await Promise.all(ops);
      onSuccess();
      onClose();
    } catch {
      setError("Failed to save assignments. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { setError(null); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton className="max-w-md">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
            Assign Assessments
          </h2>
          {displayUser && (
            <p className="text-sm text-gray-500 mt-1">
              Select assessment for {displayUser.rank?.name && <span className="font-medium">{displayUser.rank.name} </span>}
              <span>{displayUser.name}</span>
              {displayUser.service_number && (
                <span className="ml-1">({displayUser.service_number})</span>
              )}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <Icon icon="hugeicons:alert-circle" className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Course Select */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
            Course <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 text-sm"
          >
            <option value="">Select Course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        {/* Assessment Checkboxes */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Assessments</label>

          {loadingAssigns ? (
            <div className="flex items-center justify-center py-6">
              <Icon icon="hugeicons:fan-01" className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {ASSESSMENTS.map(({ key, label, color }) => {
                const isExisting = !!existing[key];
                const isDisabled = !selectedCourseId || isExisting;
                const assignedToCurrentUser = isExisting && existing[key]?.user_id === userId;
                const assignedUserName = isExisting && !assignedToCurrentUser
                  ? existing[key]?.user?.name
                  : null;
                return (
                  <label
                    key={key}
                    className={`flex flex-col gap-1 p-3 rounded-lg border transition-colors ${
                      checks[key]
                        ? color
                        : isExisting
                          ? "bg-gray-100 border-gray-300 text-gray-500"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:border-purple-200"
                    } ${isDisabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checks[key]}
                        disabled={isDisabled}
                        onChange={(e) => setChecks((prev) => ({ ...prev, [key]: e.target.checked }))}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium flex-1">{label}</span>
                      {isExisting && (
                        <Icon icon="hugeicons:checkmark-circle-02" className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </div>
                    {assignedUserName && (
                      <span className="text-[10px] text-gray-400 pl-6 leading-tight">{assignedUserName}</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {!selectedCourseId && (
            <p className="text-xs text-gray-400 mt-2 italic">Select a course to manage assessments.</p>
          )}
          {selectedCourseId && Object.values(existing).some(Boolean) && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <Icon icon="hugeicons:information-circle" className="w-3.5 h-3.5" />
              Disabled assessments are already assigned for this course.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedCourseId || loadingAssigns}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
          >
            {saving
              ? <><Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />Saving...</>
              : <><Icon icon="hugeicons:tick-02" className="w-4 h-4" />Save Assignments</>
            }
          </button>
        </div>
      </div>
    </Modal>
  );
}
