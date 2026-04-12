/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/libs/hooks/useAuth";
import { commonService } from "@/libs/services/commonService";
import { cadetService } from "@/libs/services/cadetService";
import { ftw12sqnAssessmentPenpictureResultService } from "@/libs/services/ftw12sqnAssessmentPenpictureResultService";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch } from "@/libs/types/system";

interface ResultFormProps {
  initialData?: any | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function ResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const { user } = useAuth();
  const [courseId, setCourseId]     = useState(0);
  const [semesterId, setSemesterId] = useState(0);
  const [programId, setProgramId]   = useState(0);
  const [branchId, setBranchId]     = useState(0);
  const [error, setError]           = useState("");

  const [courses, setCourses]     = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms]   = useState<SystemProgram[]>([]);
  const [branches, setBranches]   = useState<SystemBranch[]>([]);
  const [cadets, setCadets]       = useState<any[]>([]);

  const [performances, setPerformances] = useState<Record<number, string>>({});
  // cadet_id -> existing result id (if already stored)
  const [existingIds, setExistingIds] = useState<Record<number, number>>({});

  const [loadingMeta, setLoadingMeta]           = useState(true);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingCadets, setLoadingCadets]       = useState(false);

  // Load courses, programs, branches once
  useEffect(() => {
    commonService.getResultOptions()
      .then((opts) => {
        setCourses(opts?.courses?.filter((c: any) => c.is_active) || []);
        setPrograms(opts?.programs?.filter((p: any) => p.is_active) || []);
        setBranches(opts?.branches?.filter((b: any) => b.is_active) || []);
      })
      .finally(() => setLoadingMeta(false));
  }, []);

  // Load semesters when course changes
  useEffect(() => {
    if (!courseId) { setSemesters([]); setSemesterId(0); return; }
    setLoadingSemesters(true);
    commonService.getSemestersByCourse(courseId)
      .then((data) => {
        setSemesters(data);
        if (!isEdit && data.length > 0) setSemesterId(data[0].id);
      })
      .finally(() => setLoadingSemesters(false));
  }, [courseId, isEdit]);

  // Load cadets + existing results when course + semester + program selected
  useEffect(() => {
    if (!courseId || !semesterId || !programId) { setCadets([]); setExistingIds({}); return; }
    setLoadingCadets(true);
    Promise.all([
      cadetService.getAllCadets({
        per_page: 500,
        course_id: courseId,
        semester_id: semesterId,
        program_id: programId,
        branch_id: branchId || undefined,
      }),
      ftw12sqnAssessmentPenpictureResultService.getAllResults({
        per_page: 500,
        course_id: courseId,
      }),
    ]).then(([cadetRes, resultRes]) => {
      const active = cadetRes.data.filter((c: any) => c.is_active);
      setCadets(active);

      if (!isEdit) {
        // Build map of existing stored performances keyed by cadet_id
        const perfMap: Record<number, string> = {};
        const idMap: Record<number, number>   = {};
        (resultRes.data || []).forEach((r: any) => {
          perfMap[r.cadet_id] = r.course_performance || "";
          idMap[r.cadet_id]   = r.id;
        });
        // Initialize all cadets; pre-fill existing ones
        active.forEach((c: any) => {
          if (!(c.id in perfMap)) perfMap[c.id] = "";
        });
        setPerformances(perfMap);
        setExistingIds(idMap);
      }
    }).finally(() => setLoadingCadets(false));
  }, [courseId, semesterId, programId, branchId, isEdit]);

  // Populate edit mode
  useEffect(() => {
    if (!initialData) return;
    setCourseId(initialData.course_id || 0);
    setSemesterId(initialData.semester_id || 0);
    setProgramId(initialData.program_id || 0);
    setBranchId(initialData.branch_id || 0);
    setPerformances({ [initialData.cadet_id]: initialData.course_performance || "" });
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!courseId)   { setError("Please select a course."); return; }
    if (!semesterId) { setError("Please select a semester."); return; }
    if (!programId)  { setError("Please select a program."); return; }

    if (isEdit) {
      await onSubmit({
        course_id:          courseId,
        semester_id:        semesterId,
        program_id:         programId,
        branch_id:          branchId || undefined,
        cadet_id:           initialData.cadet_id,
        instructor_id:      user?.id,
        course_performance: performances[initialData.cadet_id] || "",
      });
      return;
    }

    if (cadets.length === 0) { setError("No cadets found for the selected filters."); return; }

    const batch = cadets.map((c) => ({
      course_id:          courseId,
      semester_id:        semesterId,
      program_id:         programId,
      branch_id:          branchId || undefined,
      cadet_id:           c.id,
      instructor_id:      user?.id,
      course_performance: performances[c.id] || "",
    }));

    await onSubmit(batch);
  };

  if (loadingMeta) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filter dropdowns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course <span className="text-red-500">*</span>
          </label>
          <select
            value={courseId}
            onChange={(e) => { setCourseId(parseInt(e.target.value)); setSemesterId(0); setProgramId(0); setCadets([]); }}
            disabled={isEdit}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            <option value={0}>Select Course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Semester <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={semesterId}
              onChange={(e) => { setSemesterId(parseInt(e.target.value)); setCadets([]); }}
              disabled={isEdit || !courseId || loadingSemesters}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <option value={0}>{loadingSemesters ? "Loading..." : !courseId ? "Select course first" : "Select Semester"}</option>
              {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {loadingSemesters && <Icon icon="hugeicons:fan-01" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400 pointer-events-none" />}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Program <span className="text-red-500">*</span>
          </label>
          <select
            value={programId}
            onChange={(e) => { setProgramId(parseInt(e.target.value)); setCadets([]); }}
            disabled={isEdit}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            <option value={0}>Select Program</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
          <select
            value={branchId}
            onChange={(e) => { setBranchId(parseInt(e.target.value)); setCadets([]); }}
            disabled={isEdit}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            <option value={0}>All Branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* Cadet list with course_performance textareas */}
      {loadingCadets ? (
        <div className="flex items-center justify-center py-12 border border-dashed border-gray-200 rounded-xl">
          <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : isEdit && initialData ? (
        // Edit mode — single cadet
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <span className="font-semibold text-gray-700 text-sm">Cadet</span>
          </div>
          <div className="p-4 flex items-start gap-4">
            <div className="w-48 shrink-0">
              <div className="font-medium text-gray-900">{initialData.cadet?.name || "—"}</div>
              <div className="text-xs text-gray-500 font-mono">{initialData.cadet?.cadet_number || ""}</div>
            </div>
            <textarea
              value={performances[initialData.cadet_id] || ""}
              onChange={(e) => setPerformances({ [initialData.cadet_id]: e.target.value })}
              placeholder="Enter course performance..."
              rows={4}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-sm text-gray-900"
            />
          </div>
        </div>
      ) : courseId && semesterId && programId ? (
        cadets.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
            <Icon icon="hugeicons:user-group" className="w-10 h-10 mx-auto mb-2" />
            No cadets found for the selected filters.
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-semibold text-gray-700 text-sm">Cadets ({cadets.length})</span>
              <span className="text-xs text-gray-400">Fill course performance for each cadet</span>
            </div>
            <div className="divide-y divide-gray-100">
              {cadets.map((cadet, index) => {
                const isSaved = !!existingIds[cadet.id];
                return (
                  <div key={cadet.id} className="p-4 flex items-start gap-4">
                    <div className="w-8 text-center text-sm font-bold text-gray-400 pt-2">{index + 1}</div>
                    <div className="w-44 shrink-0 pt-2">
                      <div className="font-medium text-gray-900 text-sm flex items-center gap-1.5">
                        {cadet.name}
                        {isSaved && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700">Saved</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{cadet.cadet_number}</div>
                    </div>
                    <textarea
                      value={performances[cadet.id] || ""}
                      onChange={(e) => setPerformances((p) => ({ ...p, [cadet.id]: e.target.value }))}
                      placeholder="Enter course performance..."
                      rows={3}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-sm text-gray-900 ${isSaved ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
          <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
          Select Course, Semester and Program to load cadets.
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium">
          {loading
            ? <><Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />{isEdit ? "Updating..." : "Saving..."}</>
            : <><Icon icon="hugeicons:floppy-disk" className="w-4 h-4" />{isEdit ? "Update Result" : "Save Results"}</>
          }
        </button>
      </div>
    </form>
  );
}
