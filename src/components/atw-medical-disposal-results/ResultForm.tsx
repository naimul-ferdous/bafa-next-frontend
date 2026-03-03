/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { AtwMedicalDisposalResult, AtwMedicalDisposalResultPayload, AtwMedicalDisposalSyllabus } from "@/libs/types/atwMedicalDisposal";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch } from "@/libs/types/system";
import { commonService } from "@/libs/services/commonService";
import { cadetService } from "@/libs/services/cadetService";
import { atwMedicalDisposalSyllabusService } from "@/libs/services/atwMedicalDisposalSyllabusService";

interface ResultFormProps {
  initialData?: AtwMedicalDisposalResult | null;
  onSubmit: (data: AtwMedicalDisposalResultPayload) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function ResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const [courseId, setCourseId] = useState(0);
  const [semesterId, setSemesterId] = useState(0);
  const [programId, setProgramId] = useState(0);
  const [branchId, setBranchId] = useState(0);
  const [cadetId, setCadetId] = useState(0);
  const [syllabusId, setSyllabusId] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [schemaContents, setSchemaContents] = useState<Record<number, string>>({});
  const [error, setError] = useState("");

  const filledCount = Object.values(schemaContents).filter((v) => v.trim()).length;
  const todayText = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [cadets, setCadets] = useState<any[]>([]);
  const [syllabuses, setSyllabuses] = useState<AtwMedicalDisposalSyllabus[]>([]);

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingCadets, setLoadingCadets] = useState(false);

  const selectedSyllabus = syllabuses.find((s) => s.id === syllabusId);

  // Load common options + syllabuses
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingMeta(true);
        const [common, sylRes] = await Promise.all([
          commonService.getResultOptions(),
          atwMedicalDisposalSyllabusService.getAll({ allData: true }),
        ]);
        setCourses(common?.courses || []);
        setPrograms(common?.programs || []);
        setBranches(common?.branches || []);
        const activeSyllabuses = (sylRes.data || []).filter((s: any) => s.is_active);
        setSyllabuses(sylRes.data || []);
        if (!isEdit && activeSyllabuses.length > 0) {
          setSyllabusId(activeSyllabuses[0].id);
        }
      } finally {
        setLoadingMeta(false);
      }
    };
    load();
  }, []);

  // Load semesters when course changes
  useEffect(() => {
    if (!courseId) { setSemesters([]); setSemesterId(0); return; }
    setLoadingSemesters(true);
    commonService.getSemestersByCourse(courseId).then((data) => {
      setSemesters(data);
      if (!isEdit && data.length > 0) setSemesterId(data[0].id);
    }).finally(() => setLoadingSemesters(false));
  }, [courseId, isEdit]);

  // Load cadets when course + semester selected
  useEffect(() => {
    if (!courseId || !semesterId) { setCadets([]); setCadetId(0); return; }
    setLoadingCadets(true);
    cadetService.getAllCadets({
      per_page: 500,
      course_id: courseId,
      semester_id: semesterId,
      program_id: programId || undefined,
      branch_id: branchId || undefined,
    }).then((res) => {
      setCadets(res.data.filter((c: any) => c.is_active));
    }).finally(() => setLoadingCadets(false));
  }, [courseId, semesterId, programId, branchId]);

  // Populate form when editing
  useEffect(() => {
    if (!initialData) return;
    setCourseId(initialData.course_id);
    setSemesterId(initialData.semester_id);
    setProgramId(initialData.program_id || 0);
    setBranchId(initialData.branch_id || 0);
    setCadetId(initialData.cadet_id);
    setSyllabusId(initialData.atw_medical_disposal_id);
    setIsActive(initialData.is_active);
    const map: Record<number, string> = {};
    initialData.result_schemas?.forEach((rs) => {
      map[rs.atw_medical_disposal_syllabus_schema_id] = rs.result_content || "";
    });
    setSchemaContents(map);
  }, [initialData]);

  // Reset schema contents when syllabus changes
  useEffect(() => {
    if (!isEdit) setSchemaContents({});
  }, [syllabusId, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) { setError("Please select a course."); return; }
    if (!semesterId) { setError("Please select a semester."); return; }
    if (!cadetId) { setError("Please select a cadet."); return; }
    if (!syllabusId) { setError("Please select a syllabus."); return; }
    setError("");

    const schemas = (selectedSyllabus?.schemas || [])
      .filter((s) => schemaContents[s.id]?.trim())
      .map((s) => ({
        atw_medical_disposal_syllabus_schema_id: s.id,
        result_content: schemaContents[s.id]?.trim(),
      }));

    await onSubmit({
      course_id: courseId,
      semester_id: semesterId,
      program_id: programId || undefined,
      branch_id: branchId || undefined,
      cadet_id: cadetId,
      atw_medical_disposal_id: syllabusId,
      is_active: isActive,
      schemas,
    });
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

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course <span className="text-red-500">*</span></label>
          <select value={courseId} onChange={(e) => setCourseId(parseInt(e.target.value))}
            disabled={isEdit}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed">
            <option value={0}>Select Course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester <span className="text-red-500">*</span></label>
          <div className="relative">
            <select value={semesterId} onChange={(e) => setSemesterId(parseInt(e.target.value))}
              disabled={isEdit || !courseId || loadingSemesters}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed">
              <option value={0}>{loadingSemesters ? "Loading..." : !courseId ? "Select course first" : "Select Semester"}</option>
              {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {loadingSemesters && <Icon icon="hugeicons:fan-01" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400 pointer-events-none" />}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
          <select value={programId} onChange={(e) => setProgramId(parseInt(e.target.value))}
            disabled={isEdit}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed">
            <option value={0}>Select Program</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
          <select value={branchId} onChange={(e) => setBranchId(parseInt(e.target.value))}
            disabled={isEdit}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed">
            <option value={0}>Select Branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cadet <span className="text-red-500">*</span></label>
          <div className="relative">
            <select value={cadetId} onChange={(e) => setCadetId(parseInt(e.target.value))}
              disabled={isEdit || !courseId || !semesterId || loadingCadets}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed">
              <option value={0}>{loadingCadets ? "Loading cadets..." : !courseId ? "Select course first" : !semesterId ? "Select semester first" : "Select Cadet"}</option>
              {cadets.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.cadet_number})</option>)}
            </select>
            {loadingCadets && <Icon icon="hugeicons:fan-01" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400 pointer-events-none" />}
          </div>
        </div>
      </div>

      {/* Schema Results Table — column-wise */}
      {syllabusId > 0 && selectedSyllabus ? (
        !selectedSyllabus.schemas || selectedSyllabus.schemas.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
            <Icon icon="hugeicons:file-not-found" className="w-10 h-10 mx-auto mb-2" />
            No schema items defined for this syllabus.
          </div>
        ) : (
          <div className="overflow-x-auto border border-black">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {/* Fixed: SL */}
                  <th className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-r border-black uppercase tracking-wide w-12">
                    SL.
                  </th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-r border-black uppercase tracking-wide w-40">
                    Date
                  </th>
                  {/* Dynamic: schema columns */}
                  {selectedSyllabus.schemas.map((schema) => (
                    <th
                      key={schema.id}
                      className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-r border-black uppercase tracking-wide"
                    >
                      {schema.name}
                    </th>
                  ))}
                  {/* Fixed: Total */}
                  <th className="px-4 py-2 text-center font-semibold text-gray-700 border-b border-black uppercase tracking-wide w-28">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {/* Fixed: SL value */}
                  <td className="px-4 py-3 text-center text-gray-500 font-bold border-r border-black align-middle">
                    1
                  </td>
                  {/* Fixed: Date — display only */}
                  <td className="px-3 py-3 align-middle border-r border-black text-center">
                    <span className="text-sm font-medium text-gray-700">{todayText}</span>
                  </td>
                  {/* Dynamic: schema inputs */}
                  {selectedSyllabus.schemas.map((schema) => (
                    <td key={schema.id} className="px-3 py-3 align-top border-r border-black">
                      <textarea
                        value={schemaContents[schema.id] || ""}
                        onChange={(e) => setSchemaContents((p) => ({ ...p, [schema.id]: e.target.value }))}
                        placeholder="Enter content..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-0 resize-none text-sm text-gray-900 min-w-[160px]"
                      />
                    </td>
                  ))}
                  {/* Fixed: Total — count of filled schema fields */}
                  <td className="px-3 py-3 align-middle text-center">
                    <span className="font-black">{filledCount}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
          <Icon icon="hugeicons:document-attachment" className="w-10 h-10 mx-auto mb-2" />
          Select a cadet and syllabus to fill in schema results.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="is_active"
              checked={isActive === true}
              onChange={() => setIsActive(true)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Active:</div>
              <div className="text-sm text-gray-500">
                This result will be available for use throughout the system.
              </div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="is_active"
              checked={isActive === false}
              onChange={() => setIsActive(false)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Inactive:</div>
              <div className="text-sm text-gray-500">
                This result will be hidden from general use.
              </div>
            </div>
          </label>
        </div>
      </div>

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
            : <><Icon icon="hugeicons:floppy-disk" className="w-4 h-4" />{isEdit ? "Update Result" : "Save Result"}</>
          }
        </button>
      </div>
    </form>
  );
}
