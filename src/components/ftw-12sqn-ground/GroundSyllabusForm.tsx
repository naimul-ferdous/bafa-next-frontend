/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import type {
  Ftw12sqnGroundSyllabus,
  Ftw12sqnGroundSyllabusCreateData,
  Ftw12sqnGroundSyllabusExerciseCreateData,
  Ftw12sqnGroundSyllabusSimulatorPhaseCreateData,
  Ftw12sqnFlyingPhaseType,
  Ftw12sqnFlyingType,
} from "@/libs/types/ftw12sqnFlying";

interface GroundSyllabusFormProps {
  initialData?: Ftw12sqnGroundSyllabus | null;
  onSubmit: (data: Ftw12sqnGroundSyllabusCreateData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

interface ExerciseInput {
  id?: number;
  exercise_name: string;
  exercise_shortname: string;
  exercise_content: string;
  exercise_remarks: string;
  exercise_sort: number;
  max_mark: number;
  take_time_hours: number | null;
  phase_type_id: number | null;
  is_active: boolean;
}

interface PhaseInput {
  id?: number;
  phase_full_name: string;
  phase_shortname: string;
  phase_symbol: string;
  phase_sort: number;
  flying_type_id: number | null;
  is_active: boolean;
  exercises: ExerciseInput[];
}

export interface GroundSyllabusFormData {
  semester_id: number | null;
  ground_full_name: string;
  ground_shortname: string;
  ground_symbol: string;
  ground_sort: number;
  no_of_test: number;
  highest_mark: number;
  is_active: boolean;
  is_flying: boolean;
  exercises: ExerciseInput[];      // used when is_flying = false
  phases: PhaseInput[];            // used when is_flying = true
}

export default function GroundSyllabusForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: GroundSyllabusFormProps) {
  const [formData, setFormData] = useState<GroundSyllabusFormData>({
    semester_id: null,
    ground_full_name: "",
    ground_shortname: "",
    ground_symbol: "",
    ground_sort: 0,
    no_of_test: 0,
    highest_mark: 0,
    is_active: true,
    is_flying: false,
    exercises: [],
    phases: [],
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [exerciseTimeInputs, setExerciseTimeInputs] = useState<{ [key: string]: string }>({});

  const [semesterOptions, setSemesterOptions] = useState<any[]>([]);
  const [phaseTypeOptions, setPhaseTypeOptions] = useState<Ftw12sqnFlyingPhaseType[]>([]);
  const [flyingTypeOptions, setFlyingTypeOptions] = useState<Ftw12sqnFlyingType[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // ── time helpers ────────────────────────────────────────────────────────────
  const parseTimeToMinutes = (s: string) => {
    if (!s?.trim()) return 0;
    const c = s.replace(".", ":");
    if (c.includes(":")) { const [h, m] = c.split(":"); return (parseInt(h) || 0) * 60 + (parseInt(m) || 0); }
    const n = parseFloat(s); return isNaN(n) ? 0 : Math.round(n * 60);
  };
  const minsToStr = (m: number) => m <= 0 ? "0:00" : `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, "0")}`;
  const decToMins = (h: number) => Math.round(h * 60);
  const minsToDec = (m: number) => Math.round((m / 60) * 100) / 100;
  const decToStr = (h: number) => minsToStr(decToMins(h));

  const getTimeVal = (key: string, h: number | null) =>
    exerciseTimeInputs[key] !== undefined ? exerciseTimeInputs[key] : (h != null ? decToStr(h) : "");
  const onTimeChange = (key: string, v: string) => setExerciseTimeInputs(p => ({ ...p, [key]: v }));
  const onTimeBlur = (setter: (h: number) => void, key: string) => {
    const m = parseTimeToMinutes(exerciseTimeInputs[key] || "");
    setter(minsToDec(m));
    setExerciseTimeInputs(p => ({ ...p, [key]: minsToStr(m) }));
  };

  // ── load options ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setOptionsLoading(true);
        const { commonService } = await import("@/libs/services/commonService");
        const { ftw12sqnFlyingPhaseTypeService } = await import("@/libs/services/ftw12sqnFlyingPhaseTypeService");
        const { ftw12sqnFlyingTypeService } = await import("@/libs/services/ftw12sqnFlyingTypeService");
        const [opts, pts, fts] = await Promise.all([
          commonService.getResultOptions(),
          ftw12sqnFlyingPhaseTypeService.getList(),
          ftw12sqnFlyingTypeService.getList(),
        ]);
        if (opts) setSemesterOptions(opts.semesters.filter((s: any) => s.is_active && s.is_flying) || []);
        setPhaseTypeOptions(pts || []);
        setFlyingTypeOptions(fts || []);
      } catch (e) { console.error(e); }
      finally { setOptionsLoading(false); }
    })();
  }, []);

  // ── load initial data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialData) return;

    const mapEx = (ex: any, idx: number): ExerciseInput => ({
      id: ex.id,
      exercise_name: ex.exercise_name,
      exercise_shortname: ex.exercise_shortname,
      exercise_content: ex.exercise_content || "",
      exercise_remarks: ex.exercise_remarks || "",
      exercise_sort: ex.exercise_sort ?? idx,
      max_mark: parseFloat(String(ex.max_mark || 0)),
      take_time_hours: ex.take_time_hours != null ? parseFloat(String(ex.take_time_hours)) : null,
      phase_type_id: ex.phase_type_id ?? null,
      is_active: ex.is_active,
    });

    // Direct exercises (non-flying)
    const directExercises = (initialData.exercises || [])
      .filter(ex => !ex.ftw_12sqn_ground_syllabus_simulator_phase_id)
      .map(mapEx)
      .sort((a, b) => a.exercise_sort - b.exercise_sort);

    // Phases with their exercises (flying)
    const phases: PhaseInput[] = (initialData.simulator_phases || []).map(p => ({
      id: p.id,
      phase_full_name: p.phase_full_name,
      phase_shortname: p.phase_shortname,
      phase_symbol: p.phase_symbol || "",
      phase_sort: p.phase_sort,
      flying_type_id: p.flying_type_id ?? null,
      is_active: p.is_active,
      exercises: (p.exercises || []).map(mapEx).sort((a, b) => a.exercise_sort - b.exercise_sort),
    })).sort((a, b) => a.phase_sort - b.phase_sort);

    // Init time inputs
    const timeInputs: { [k: string]: string } = {};
    directExercises.forEach((ex, i) => { if (ex.take_time_hours != null) timeInputs[`ex-${i}`] = decToStr(ex.take_time_hours); });
    phases.forEach((ph, pi) => ph.exercises.forEach((ex, ei) => { if (ex.take_time_hours != null) timeInputs[`ph-${pi}-ex-${ei}`] = decToStr(ex.take_time_hours); }));
    setExerciseTimeInputs(timeInputs);

    setFormData({
      semester_id: initialData.semester_id || null,
      ground_full_name: initialData.ground_full_name,
      ground_shortname: initialData.ground_shortname,
      ground_symbol: initialData.ground_symbol || "",
      ground_sort: initialData.ground_sort,
      no_of_test: initialData.no_of_test,
      highest_mark: parseFloat(String(initialData.highest_mark || 0)),
      is_active: initialData.is_active,
      is_flying: initialData.is_flying ?? false,
      exercises: directExercises,
      phases,
    });
  }, [initialData]);

  // ── derived values ────────────────────────────────────────────────────────────
  const totalMaxMarks = useMemo(() => formData.exercises.reduce((s, ex) => s + (ex.max_mark || 0), 0), [formData.exercises]);

  // ── ground mode: tests count ──────────────────────────────────────────────────
  const handleNoOfTestChange = (n: number) => {
    setFormData(prev => {
      const cur = prev.exercises.length;
      let exs: ExerciseInput[];
      if (n > cur) {
        exs = [...prev.exercises, ...Array.from({ length: n - cur }, (_, i) => ({
          exercise_name: `Test ${cur + i + 1}`, exercise_shortname: `T${cur + i + 1}`,
          exercise_content: "", exercise_remarks: "", exercise_sort: cur + i,
          max_mark: 0, take_time_hours: null, phase_type_id: null, is_active: true,
        }))];
      } else {
        exs = prev.exercises.slice(0, n);
      }
      return { ...prev, no_of_test: n, exercises: exs.map((e, i) => ({ ...e, exercise_sort: i })) };
    });
  };

  // ── flying mode: phase helpers ────────────────────────────────────────────────
  const addPhase = () => {
    setFormData(prev => ({
      ...prev,
      phases: [...prev.phases, {
        phase_full_name: `Phase ${prev.phases.length + 1}`,
        phase_shortname: `P${prev.phases.length + 1}`,
        phase_symbol: "", phase_sort: prev.phases.length,
        flying_type_id: null, is_active: true, exercises: [],
      }],
    }));
  };

  const removePhase = (pi: number) => {
    setFormData(prev => ({ ...prev, phases: prev.phases.filter((_, i) => i !== pi) }));
    // clean up time inputs for that phase
    setExerciseTimeInputs(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (k.startsWith(`ph-${pi}-`)) delete next[k]; });
      return next;
    });
  };

  const updatePhase = (pi: number, field: keyof PhaseInput, value: any) => {
    setFormData(prev => ({ ...prev, phases: prev.phases.map((p, i) => i !== pi ? p : { ...p, [field]: value }) }));
  };

  const addPhaseExercise = (pi: number) => {
    setFormData(prev => {
      const phases = prev.phases.map((p, i) => {
        if (i !== pi) return p;
        const idx = p.exercises.length;
        return { ...p, exercises: [...p.exercises, { exercise_name: `Exercise ${idx + 1}`, exercise_shortname: `E${idx + 1}`, exercise_content: "", exercise_remarks: "", exercise_sort: idx, max_mark: 0, take_time_hours: null, phase_type_id: null, is_active: true }] };
      });
      return { ...prev, phases };
    });
  };

  const removePhaseExercise = (pi: number, ei: number) => {
    setFormData(prev => ({ ...prev, phases: prev.phases.map((p, i) => i !== pi ? p : { ...p, exercises: p.exercises.filter((_, j) => j !== ei).map((e, j) => ({ ...e, exercise_sort: j })) }) }));
  };

  const updatePhaseExercise = (pi: number, ei: number, field: keyof ExerciseInput, value: any) => {
    setFormData(prev => ({ ...prev, phases: prev.phases.map((p, i) => i !== pi ? p : { ...p, exercises: p.exercises.map((e, j) => j !== ei ? e : { ...e, [field]: value }) }) }));
  };

  // ── update direct exercise ────────────────────────────────────────────────────
  const updateExercise = (i: number, field: keyof ExerciseInput, value: any) => {
    setFormData(prev => ({ ...prev, exercises: prev.exercises.map((e, j) => j !== i ? e : { ...e, [field]: value }) }));
  };

  // ── validation ────────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.semester_id) e.semester_id = "Semester is required";
    if (!formData.ground_full_name.trim()) e.ground_full_name = "Name is required";
    if (!formData.ground_shortname.trim()) e.ground_shortname = "Short name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const mapExSubmit = (ex: ExerciseInput, idx: number): Ftw12sqnGroundSyllabusExerciseCreateData => ({
        id: ex.id,
        exercise_name: ex.exercise_name.trim() || `Exercise ${idx + 1}`,
        exercise_shortname: ex.exercise_shortname.trim() || `E${idx + 1}`,
        exercise_content: ex.exercise_content || undefined,
        exercise_remarks: ex.exercise_remarks || undefined,
        exercise_sort: idx,
        max_mark: ex.max_mark,
        take_time_hours: ex.take_time_hours ?? undefined,
        phase_type_id: ex.phase_type_id ?? undefined,
        is_active: ex.is_active,
      });

      const data: Ftw12sqnGroundSyllabusCreateData = {
        semester_id: formData.semester_id,
        ground_full_name: formData.ground_full_name,
        ground_shortname: formData.ground_shortname,
        ground_symbol: formData.ground_symbol || undefined,
        ground_sort: formData.ground_sort,
        no_of_test: formData.is_flying ? 0 : formData.exercises.length,
        highest_mark: formData.highest_mark,
        is_active: formData.is_active,
        is_flying: formData.is_flying,
        exercises: formData.is_flying ? [] : formData.exercises.map(mapExSubmit),
        simulator_phases: formData.is_flying
          ? formData.phases.map((p, pi): Ftw12sqnGroundSyllabusSimulatorPhaseCreateData => ({
              id: p.id,
              phase_full_name: p.phase_full_name,
              phase_shortname: p.phase_shortname,
              phase_symbol: p.phase_symbol || undefined,
              phase_sort: pi,
              flying_type_id: p.flying_type_id ?? null,
              is_active: p.is_active,
              exercises: p.exercises.map(mapExSubmit),
            }))
          : [],
      };

      await onSubmit(data);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save syllabus");
    }
  };

  const handleChange = (field: keyof GroundSyllabusFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  // ── reusable exercise row ─────────────────────────────────────────────────────
  const renderExerciseRow = (
    ex: ExerciseInput,
    idx: number,
    timeKey: string,
    onChange: (field: keyof ExerciseInput, v: any) => void,
    onRemove: () => void,
    showMaxMark = true,
  ) => (
    <div key={idx} className="p-4 rounded-lg border border-dashed border-gray-200 hover:border-gray-300 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">{idx + 1}</span>
          <span className="text-sm font-medium text-gray-700">Exercise #{idx + 1}</span>
        </div>
        <button type="button" onClick={onRemove} className="p-1 text-red-500 hover:bg-red-50 rounded">
          <Icon icon="hugeicons:delete-02" className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Exercise Name</label>
          <input type="text" value={ex.exercise_name} onChange={e => onChange("exercise_name", e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Short Name</label>
          <input type="text" value={ex.exercise_shortname} onChange={e => onChange("exercise_shortname", e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {showMaxMark && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Mark</label>
            <input type="number" min="0" step="0.01" value={ex.max_mark} onChange={e => onChange("max_mark", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Time (H:MM)</label>
          <input type="text" value={getTimeVal(timeKey, ex.take_time_hours)}
            onChange={e => onTimeChange(timeKey, e.target.value)}
            onBlur={() => onTimeBlur(h => onChange("take_time_hours", h), timeKey)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0:00" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phase Type</label>
          <select value={ex.phase_type_id ?? ""} onChange={e => onChange("phase_type_id", e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Optional —</option>
            {phaseTypeOptions.map(pt => <option key={pt.id} value={pt.id}>{pt.type_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select value={ex.is_active ? "active" : "inactive"} onChange={e => onChange("is_active", e.target.value === "active")}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="col-span-2 md:col-span-4 lg:col-span-6">
          <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
          <textarea value={ex.exercise_content} onChange={e => onChange("exercise_content", e.target.value)} rows={2}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Exercise content" />
        </div>
        <div className="col-span-2 md:col-span-4 lg:col-span-6">
          <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
          <input type="text" value={ex.exercise_remarks} onChange={e => onChange("exercise_remarks", e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional remarks" />
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Is Flying toggle (TOP) ──────────────────────────────────────────── */}
      <div className={`rounded-lg px-5 py-3 flex items-center gap-3 border ${formData.is_flying ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
        <input
          id="is_flying_chk"
          type="checkbox"
          checked={formData.is_flying}
          onChange={(e) => {
            const v = e.target.checked;
            setFormData(prev => ({ ...prev, is_flying: v, exercises: [], phases: [], no_of_test: 0 }));
            setExerciseTimeInputs({});
          }}
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
        />
        <label htmlFor="is_flying_chk" className={`font-semibold cursor-pointer select-none ${formData.is_flying ? "text-blue-800" : "text-gray-700"}`}>
          Is Flying
        </label>
        <span className={`text-xs ${formData.is_flying ? "text-blue-600" : "text-gray-400"}`}>
          {formData.is_flying ? "Flying mode — add phases with exercises" : "Ground mode — add tests/exercises directly"}
        </span>
      </div>

      {/* ── Basic Information (always shown) ────────────────────────────────── */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon icon="hugeicons:honor" className="w-5 h-5 text-blue-500" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester <span className="text-red-500">*</span></label>
            <select value={formData.semester_id || ""} onChange={e => handleChange("semester_id", e.target.value ? parseInt(e.target.value) : null)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.semester_id ? "border-red-500" : "border-gray-300"}`}>
              <option value="">{optionsLoading ? "Loading..." : "Select Semester"}</option>
              {semesterOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.semester_id && <p className="mt-1 text-xs text-red-500">{errors.semester_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.is_flying ? "Phase Full Name" : "Ground Subject Name"} <span className="text-red-500">*</span>
            </label>
            <input type="text" value={formData.ground_full_name} onChange={e => handleChange("ground_full_name", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.ground_full_name ? "border-red-500" : "border-gray-300"}`}
              placeholder={formData.is_flying ? "Enter phase full name" : "Enter ground subject name"} />
            {errors.ground_full_name && <p className="mt-1 text-xs text-red-500">{errors.ground_full_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.is_flying ? "Phase Short Name" : "Short Name"} <span className="text-red-500">*</span>
            </label>
            <input type="text" value={formData.ground_shortname} onChange={e => handleChange("ground_shortname", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.ground_shortname ? "border-red-500" : "border-gray-300"}`}
              placeholder="Enter short name" />
            {errors.ground_shortname && <p className="mt-1 text-xs text-red-500">{errors.ground_shortname}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
            <input type="text" value={formData.ground_symbol} onChange={e => handleChange("ground_symbol", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., I, II, III" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
            <input type="number" min="0" value={formData.ground_sort} onChange={e => handleChange("ground_sort", parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {!formData.is_flying && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Tests</label>
                <input type="number" min="0" value={formData.no_of_test} onChange={e => handleNoOfTestChange(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                <p className="text-xs text-gray-400 mt-1">Auto-generates exercises</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Highest Mark</label>
                <input type="number" min="0" step="0.01" value={formData.highest_mark} onChange={e => handleChange("highest_mark", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Max Marks</label>
                <div className="w-full px-4 py-2 border border-green-200 rounded-lg bg-green-50 text-green-800 font-semibold text-center">{totalMaxMarks}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Status ───────────────────────────────────────────────────────────── */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
            <span className="font-medium text-gray-900">Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
            <span className="font-medium text-gray-900">Inactive</span>
          </label>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          GROUND MODE — direct exercises
      ══════════════════════════════════════════════════════════════════════ */}
      {!formData.is_flying && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="hugeicons:notebook" className="w-5 h-5 text-purple-500" />
            Tests / Exercises ({formData.exercises.length})
          </h3>
          {formData.exercises.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
              <Icon icon="hugeicons:information-circle" className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Enter number of tests above to auto-generate, or add manually.</p>
              <button type="button" onClick={() => handleNoOfTestChange(formData.exercises.length + 1)}
                className="mt-3 px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                + Add Exercise
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.exercises.map((ex, i) =>
                renderExerciseRow(ex, i, `ex-${i}`,
                  (f, v) => updateExercise(i, f, v),
                  () => setFormData(prev => ({ ...prev, exercises: prev.exercises.filter((_, j) => j !== i).map((e, j) => ({ ...e, exercise_sort: j })) })),
                  true,
                )
              )}
              <button type="button" onClick={() => handleNoOfTestChange(formData.exercises.length + 1)}
                className="w-full py-2 border border-dashed border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 text-sm flex items-center justify-center gap-1">
                <Icon icon="hugeicons:add-circle" className="w-4 h-4" /> Add Exercise
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FLYING MODE — phases with exercises
      ══════════════════════════════════════════════════════════════════════ */}
      {formData.is_flying && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Icon icon="hugeicons:layers-01" className="w-5 h-5 text-blue-500" />
              Phases ({formData.phases.length})
            </h3>
            <button type="button" onClick={addPhase}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1">
              <Icon icon="hugeicons:add-circle" className="w-4 h-4" /> Add Phase
            </button>
          </div>

          {formData.phases.length === 0 && (
            <div className="text-center py-10 text-gray-400 border border-dashed border-blue-200 rounded-lg bg-blue-50">
              <Icon icon="hugeicons:layers-01" className="w-10 h-10 mx-auto mb-2 text-blue-300" />
              <p className="text-sm">No phases yet. Click <strong>Add Phase</strong> to start.</p>
            </div>
          )}

          {formData.phases.map((phase, pi) => (
            <div key={pi} className="border border-blue-200 rounded-xl overflow-hidden">
              {/* Phase header */}
              <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
                <span className="text-white font-semibold text-sm flex items-center gap-2">
                  <Icon icon="hugeicons:layers-01" className="w-4 h-4" />
                  Phase {pi + 1}: {phase.phase_full_name || "Unnamed"}
                </span>
                <button type="button" onClick={() => removePhase(pi)} className="p-1 text-blue-200 hover:text-white hover:bg-blue-700 rounded">
                  <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 bg-blue-50 space-y-4">
                {/* Phase fields */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phase Full Name <span className="text-red-500">*</span></label>
                    <input type="text" value={phase.phase_full_name} onChange={e => updatePhase(pi, "phase_full_name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phase full name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Short Name <span className="text-red-500">*</span></label>
                    <input type="text" value={phase.phase_shortname} onChange={e => updatePhase(pi, "phase_shortname", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Short name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Symbol</label>
                    <input type="text" value={phase.phase_symbol} onChange={e => updatePhase(pi, "phase_symbol", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Symbol" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Flying Type</label>
                    <select value={phase.flying_type_id ?? ""} onChange={e => updatePhase(pi, "flying_type_id", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">— Select —</option>
                      {flyingTypeOptions.map(ft => <option key={ft.id} value={ft.id}>{ft.type_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select value={phase.is_active ? "active" : "inactive"} onChange={e => updatePhase(pi, "is_active", e.target.value === "active")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Phase exercises */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Icon icon="hugeicons:notebook" className="w-4 h-4 text-purple-500" />
                      Exercises ({phase.exercises.length})
                    </span>
                    <button type="button" onClick={() => addPhaseExercise(pi)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 flex items-center gap-1">
                      <Icon icon="hugeicons:add-circle" className="w-3.5 h-3.5" /> Add Exercise
                    </button>
                  </div>

                  {phase.exercises.length === 0 ? (
                    <div className="text-center py-5 text-gray-400 border border-dashed border-purple-200 rounded-lg bg-white text-xs">
                      No exercises yet. Click <strong>Add Exercise</strong>.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {phase.exercises.map((ex, ei) =>
                        renderExerciseRow(
                          ex, ei, `ph-${pi}-ex-${ei}`,
                          (f, v) => updatePhaseExercise(pi, ei, f, v),
                          () => removePhaseExercise(pi, ei),
                          false,
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Action Buttons ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-4">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
          {loading
            ? <><Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />{isEdit ? "Updating..." : "Creating..."}</>
            : <>{isEdit ? "Update Syllabus" : "Create Syllabus"}</>}
        </button>
      </div>
    </form>
  );
}
