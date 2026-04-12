/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import type { CtwMedicalDisposalResult, CtwMedicalDisposalResultPayload, CtwMedicalDisposalSyllabus } from "@/libs/types/ctwMedicalDisposal";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch } from "@/libs/types/system";
import { commonService } from "@/libs/services/commonService";
import { cadetService } from "@/libs/services/cadetService";
import { ctwMedicalDisposalSyllabusService } from "@/libs/services/ctwMedicalDisposalSyllabusService";
import { ctwMedicalDisposalResultService } from "@/libs/services/ctwMedicalDisposalResultService";
import SearchableSelect from "@/components/form/SearchableSelect";

interface ResultFormProps {
  initialData?: CtwMedicalDisposalResult | null;
  onSubmit: (data: CtwMedicalDisposalResultPayload) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function ResultForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: ResultFormProps) {
  const router = useRouter();
  const [courseId, setCourseId]     = useState(0);
  const [semesterId, setSemesterId] = useState(0);
  const [programId, setProgramId]   = useState(0);
  const [branchId, setBranchId]     = useState(0);
  const [cadetId, setCadetId]       = useState(0);
  const [syllabusId, setSyllabusId] = useState(0);
  const [isActive, setIsActive]     = useState(true);
  const [schemaContents, setSchemaContents] = useState<Record<number, string>>({});
  const [error, setError] = useState("");

  const [courses, setCourses]       = useState<SystemCourse[]>([]);
  const [semesters, setSemesters]   = useState<SystemSemester[]>([]);
  const [programs, setPrograms]     = useState<SystemProgram[]>([]);
  const [branches, setBranches]     = useState<SystemBranch[]>([]);
  const [cadets, setCadets]         = useState<any[]>([]);
  const [syllabuses, setSyllabuses] = useState<CtwMedicalDisposalSyllabus[]>([]);
  // cadet_id → count of existing results
  const [cadetResultMap, setCadetResultMap] = useState<Record<number, number>>({});

  const [loadingMeta, setLoadingMeta]           = useState(true);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingCadets, setLoadingCadets]       = useState(false);

  const selectedSyllabus = syllabuses.find((s) => s.id === syllabusId);
  const filledCount = Object.values(schemaContents).filter((v) => v.trim()).length;
  const todayText = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const existingCount = !isEdit && cadetId > 0 ? (cadetResultMap[cadetId] ?? 0) : 0;

  // Load common options + syllabuses
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingMeta(true);
        const [common, sylRes] = await Promise.all([
          commonService.getResultOptions(),
          ctwMedicalDisposalSyllabusService.getAll({ allData: true }),
        ]);
        setCourses(common?.courses || []);
        setPrograms(common?.programs || []);
        setBranches(common?.branches || []);
        const activeSyllabuses = (sylRes.data || []).filter((s: any) => s.is_active);
        setSyllabuses(sylRes.data || []);
        if (!isEdit && activeSyllabuses.length > 0) setSyllabusId(activeSyllabuses[0].id);
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

  // Load cadets + existing results when course + semester selected
  useEffect(() => {
    if (!courseId || !semesterId) {
      setCadets([]);
      setCadetId(0);
      setCadetResultMap({});
      return;
    }
    setLoadingCadets(true);
    Promise.all([
      cadetService.getAllCadets({
        per_page: 500,
        course_id: courseId,
        semester_id: semesterId,
        program_id: programId || undefined,
        branch_id: branchId || undefined,
      }),
      ctwMedicalDisposalResultService.getAll({
        course_id: courseId,
        semester_id: semesterId,
        per_page: 500,
      }),
    ]).then(([cadetRes, resultRes]) => {
      setCadets(cadetRes.data.filter((c: any) => c.is_active));
      const map: Record<number, number> = {};
      (resultRes.data || []).forEach((r) => {
        map[r.cadet_id] = (map[r.cadet_id] || 0) + 1;
      });
      setCadetResultMap(map);
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
    setSyllabusId(initialData.ctw_medical_disposal_id);
    setIsActive(initialData.is_active);
    const map: Record<number, string> = {};
    initialData.result_schemas?.forEach((rs) => {
      map[rs.ctw_medical_disposal_syllabus_schema_id] = rs.result_content || "";
    });
    setSchemaContents(map);
  }, [initialData]);

  // Reset schema contents when syllabus changes
  useEffect(() => {
    if (!isEdit) setSchemaContents({});
  }, [syllabusId, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId)   { setError("Please select a course."); return; }
    if (!semesterId) { setError("Please select a semester."); return; }
    if (!cadetId)    { setError("Please select a cadet."); return; }
    if (!syllabusId) { setError("Please select a syllabus."); return; }
    setError("");

    const schemas = (selectedSyllabus?.schemas || [])
      .filter((s) => schemaContents[s.id]?.trim())
      .map((s) => ({
        ctw_medical_disposal_syllabus_schema_id: s.id,
        result_content: schemaContents[s.id]?.trim(),
      }));

    await onSubmit({
      course_id: courseId,
      semester_id: semesterId,
      program_id: programId || undefined,
      branch_id: branchId || undefined,
      cadet_id: cadetId,
      ctw_medical_disposal_id: syllabusId,
      is_active: isActive,
      schemas,
    });
  };

  const showTable =
    courseId > 0 &&
    semesterId > 0 &&
    cadetId > 0 &&
    syllabusId > 0 &&
    selectedSyllabus &&
    (selectedSyllabus.schemas?.length ?? 0) > 0;

  if (loadingMeta) {
    return (
      <div className="w-full min-h-[20vh] flex items-center justify-center">
        <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Top Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Select Course <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={courses.map((c) => ({ value: c.id.toString(), label: c.name }))}
            value={courseId.toString()}
            onChange={(val) => { setCourseId(parseInt(val)); setSemesterId(0); setCadetId(0); }}
            placeholder="Select Course"
            disabled={isEdit}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Select Semester <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={semesters.map((s) => ({ value: s.id.toString(), label: s.name }))}
            value={semesterId.toString()}
            onChange={(val) => { setSemesterId(parseInt(val)); setCadetId(0); }}
            placeholder={
              loadingSemesters ? "Loading..." :
              !courseId ? "Select course first" :
              semesters.length === 0 ? "No semesters found" : "Select Semester"
            }
            disabled={isEdit || !courseId || loadingSemesters}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Program</label>
          <SearchableSelect
            options={programs.map((p) => ({ value: p.id.toString(), label: p.name }))}
            value={programId.toString()}
            onChange={(val) => setProgramId(parseInt(val))}
            placeholder="Select Program"
            disabled={isEdit}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Branch</label>
          <SearchableSelect
            options={branches.map((b) => ({ value: b.id.toString(), label: b.name }))}
            value={branchId.toString()}
            onChange={(val) => setBranchId(parseInt(val))}
            placeholder="Select Branch"
            disabled={isEdit}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Select Cadet{" "}
            <span className="text-gray-500 font-normal italic normal-case">(Search by Name or Cadet No)</span>{" "}
            <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={cadets.map((c) => ({
              value: c.id.toString(),
              label: `${c.name} (${c.cadet_number})${cadetResultMap[c.id] ? ` — [${cadetResultMap[c.id]}x RECORD]` : ""}`,
              className: cadetResultMap[c.id] ? "text-red-600 font-semibold" : undefined,
            }))}
            value={cadetId.toString()}
            onChange={(val) => setCadetId(parseInt(val))}
            placeholder={
              !courseId || !semesterId ? "Select course & semester first" :
              loadingCadets ? "Loading cadets..." :
              cadets.length === 0 ? "No cadets found" : "Search for a cadet..."
            }
            disabled={isEdit || !courseId || !semesterId || loadingCadets}
          />
          {existingCount > 0 && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
              <Icon icon="hugeicons:alert-circle" className="w-3.5 h-3.5" />
              This cadet already has {existingCount} medical disposal record{existingCount > 1 ? "s" : ""} for this semester.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Select Syllabus <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={syllabuses.filter((s) => s.is_active).map((s) => ({ value: s.id.toString(), label: s.name }))}
            value={syllabusId.toString()}
            onChange={(val) => setSyllabusId(parseInt(val))}
            placeholder="Select Syllabus"
          />
        </div>
      </div>

      {/* Schema Content Table — column-wise */}
      {!showTable ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-black rounded-xl">
          <Icon icon="hugeicons:document-attachment" className="w-12 h-12 mx-auto mb-3 text-black" />
          {!courseId || !semesterId ? (
            <p>Please select Course and Semester first</p>
          ) : !cadetId ? (
            <p>Please select a Cadet to start inputting results</p>
          ) : !syllabusId ? (
            <p>Please select a Syllabus</p>
          ) : (
            <p>No schema items defined for this syllabus</p>
          )}
        </div>
      ) : (
        <div className="border border-black rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-black uppercase whitespace-nowrap w-12">SL</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-black uppercase whitespace-nowrap">Date</th>
                {(selectedSyllabus?.schemas || []).map((schema) => (
                  <th key={schema.id} className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-black uppercase whitespace-nowrap last:border-r-0">
                    {schema.name}
                    {schema.code && <div className="text-[10px] font-mono font-normal text-gray-400 normal-case">{schema.code}</div>}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 text-center text-sm font-bold text-gray-500 border-r border-black align-middle">1</td>
                <td className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-black align-middle whitespace-nowrap">{todayText}</td>
                {(selectedSyllabus?.schemas || []).map((schema, i, arr) => (
                  <td key={schema.id} className={`px-3 py-3 align-top border-r border-black${i === arr.length - 1 ? " border-r-0" : ""}`}>
                    <textarea
                      value={schemaContents[schema.id] || ""}
                      onChange={(e) => setSchemaContents((p) => ({ ...p, [schema.id]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80px] resize-none text-sm min-w-[160px]"
                      placeholder="Enter content..."
                    />
                  </td>
                ))}
                <td className="px-4 py-3 text-center align-middle font-black text-blue-700">{filledCount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Status */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Status</label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="is_active_result" checked={isActive === true} onChange={() => setIsActive(true)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
            <span className="text-sm font-medium text-gray-900">Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="is_active_result" checked={isActive === false} onChange={() => setIsActive(false)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
            <span className="text-sm font-medium text-gray-900">Inactive</span>
          </label>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-6 py-2 border border-black text-black rounded-xl hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-8 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold">
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Result" : "Save Result")}
        </button>
      </div>
    </form>
  );
}
