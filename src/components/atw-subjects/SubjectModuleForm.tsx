/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import type { AtwSubjectModule, AtwSubjectsModuleMarksheet, SystemUniversity, SystemSemester, SystemProgram, AtwUniversityDepartment } from "@/libs/types/system";
import { atwMarksheetService } from "@/libs/services/atwMarksheetService";
import { universityService } from "@/libs/services/universityService";
import { semesterService } from "@/libs/services/semesterService";
import { programService } from "@/libs/services/programService";
import { universitySemesterService, SystemUniversitySemester } from "@/libs/services/universitySemesterService";
import { atwUniversityDepartmentService } from "@/libs/services/atwUniversityDepartmentService";

function SearchableSelect({ label, value, onChange, options, placeholder, disabled, disabledText, required }: {
  label: string;
  value: number | "";
  onChange: (val: number | "") => void;
  options: { id: number; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  disabledText?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => o.id === value);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          className={`w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-left text-sm flex items-center justify-between ${disabled ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
        >
          <span className={selected ? "text-gray-900" : "text-gray-400"}>
            {disabled && disabledText ? disabledText : selected ? selected.label : `Select ${label}`}
          </span>
          <Icon icon="hugeicons:arrow-down-01" className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 flex flex-col">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Icon icon="hugeicons:search-01" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={placeholder || `Search...`}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-50 border-b border-gray-100"
                >
                  -- Clear --
                </button>
              )}
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-400 text-center">No results found</div>
              ) : (
                filtered.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => { onChange(o.id); setOpen(false); setSearch(""); }}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${o.id === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-blue-50"}`}
                  >
                    <span>{o.label}</span>
                    {o.id === value && <Icon icon="hugeicons:tick-02" className="w-4 h-4 text-blue-600" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchableSelectString({ label, value, onChange, options, selectedLabel, placeholder, disabled, disabledText, required }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { id: string; label: string; group?: string }[];
  selectedLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  disabledText?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const regularOptions = filtered.filter(o => !o.group);
  const changeableOptions = filtered.filter(o => o.group);

  return (
    <div>
      <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          className={`w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-left text-sm flex items-center justify-between ${disabled ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
        >
          <span className={selectedLabel ? "text-gray-900" : "text-gray-400"}>
            {disabled && disabledText ? disabledText : selectedLabel || `Select ${label}`}
          </span>
          <Icon icon="hugeicons:arrow-down-01" className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 flex flex-col">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Icon icon="hugeicons:search-01" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={placeholder || "Search..."}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-50 border-b border-gray-100"
                >
                  -- Clear --
                </button>
              )}
              {regularOptions.length === 0 && changeableOptions.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-400 text-center">No results found</div>
              ) : (
                <>
                  {regularOptions.map(o => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => { onChange(o.id); setOpen(false); setSearch(""); }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${o.id === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-blue-50"}`}
                    >
                      <span>{o.label}</span>
                      {o.id === value && <Icon icon="hugeicons:tick-02" className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                  {changeableOptions.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase bg-gray-50 border-y border-gray-100">Changeable Programs</div>
                      {changeableOptions.map(o => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => { onChange(o.id); setOpen(false); setSearch(""); }}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${o.id === value ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700 hover:bg-purple-50"}`}
                        >
                          <span>{o.label}</span>
                          {o.id === value && <Icon icon="hugeicons:tick-02" className="w-4 h-4 text-purple-600" />}
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface SubjectFormProps {
  initialData?: AtwSubjectModule | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function SubjectModuleForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: SubjectFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    atw_subjects_module_marksheet_id: "" as number | "",
    university_id: "" as number | "",
    semester_id: "" as number | "",
    program_id: "" as number | "",
    system_programs_changeable_semester_id: "" as number | "",
    university_semester_id: "" as number | "",
    atw_university_department_id: "" as number | "",
    subject_name: "",
    subject_code: "",
    subject_legend: "",
    subject_period: "",
    subject_type: "academic" as "academic" | "professional",
    subjects_full_mark: "100",
    subjects_credit: "",
    is_current: true,
    is_active: true,
    syllabus_file: null as File | null,
  });

  const [marksheets, setMarksheets] = useState<AtwSubjectsModuleMarksheet[]>([]);
  const [universities, setUniversities] = useState<SystemUniversity[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [universitySemesters, setUniversitySemesters] = useState<SystemUniversitySemester[]>([]);
  const [universityDepartments, setUniversityDepartments] = useState<AtwUniversityDepartment[]>([]);
  const [loadingMarksheets, setLoadingMarksheets] = useState(false);
  const [error, setError] = useState("");

  // Load initial options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingMarksheets(true);
        const [marksheetsRes, universitiesRes, semestersRes, programsRes] = await Promise.all([
          atwMarksheetService.getAllMarksheets({ per_page: 100 }),
          universityService.getAllUniversities({ per_page: 200 }),
          semesterService.getAllSemesters({ per_page: 200 }),
          programService.getAllPrograms({ per_page: 200 }),
        ]);
        setMarksheets(marksheetsRes.data || []);
        setUniversities(universitiesRes.data || []);
        setSemesters(semestersRes.data || []);
        setPrograms(programsRes.data || []);
      } catch (err) {
        console.error("Failed to load form options:", err);
      } finally {
        setLoadingMarksheets(false);
      }
    };
    fetchOptions();
  }, []);

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        atw_subjects_module_marksheet_id: initialData.atw_subjects_module_marksheet_id || "",
        university_id: initialData.university_id || "",
        semester_id: initialData.semester_id || "",
        program_id: initialData.program_id || "",
        system_programs_changeable_semester_id: initialData.system_programs_changeable_semester_id || "",
        university_semester_id: initialData.university_semester_id || "",
        atw_university_department_id: initialData.atw_university_department_id || "",
        subject_name: initialData.subject_name || "",
        subject_code: initialData.subject_code || "",
        subject_legend: initialData.subject_legend || "",
        subject_period: initialData.subject_period || "",
        subject_type: initialData.subject_type || "academic",
        subjects_full_mark: initialData.subjects_full_mark?.toString() || "0",
        subjects_credit: initialData.subjects_credit?.toString() || "0",
        is_current: initialData.is_current ?? true,
        is_active: initialData.is_active ?? true,
        syllabus_file: null,
      });
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Load university semesters & departments when university changes
  const loadUniversityData = useCallback(async (univId: number) => {
    try {
      const [semRes, deptRes] = await Promise.all([
        universitySemesterService.getAll({ university_id: univId, per_page: 100 }),
        atwUniversityDepartmentService.getAllDepartments({ university_id: univId, per_page: 100 }),
      ]);
      setUniversitySemesters(semRes.data || []);
      setUniversityDepartments(deptRes.data || []);
    } catch {
      setUniversitySemesters([]);
      setUniversityDepartments([]);
    }
  }, []);

  // When university_id changes, fetch its semesters & departments
  useEffect(() => {
    if (formData.university_id) {
      loadUniversityData(formData.university_id as number);
    } else {
      setUniversitySemesters([]);
      setUniversityDepartments([]);
    }
  }, [formData.university_id, loadUniversityData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData(prev => ({ ...prev, syllabus_file: e.target.files![0] }));
    }
  };

  const clearFile = () => {
    setFormData(prev => ({ ...prev, syllabus_file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleNumericInput = (field: string, value: string) => {
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const selectedMarksheet = useMemo(() => {
    return marksheets.find(m => m.id === Number(formData.atw_subjects_module_marksheet_id));
  }, [marksheets, formData.atw_subjects_module_marksheet_id]);

  const previewSamples = useMemo(() => {
    const marks = selectedMarksheet?.marks || [];
    if (marks.length === 0) return [];
    const sampleById: { [id: number]: number } = {};
    marks.forEach(m => {
      if (!m.is_combined) sampleById[m.id] = Math.max(0, (Number(m.estimate_mark) || 0) - 1);
    });
    marks.forEach(m => {
      if (m.is_combined && m.combined_cols && m.combined_cols.length > 0) {
        const bestCount = m.combined_cols.length - 1;
        if (bestCount <= 0) { sampleById[m.id] = 0; return; }
        const refVals = m.combined_cols.map(col => {
          const refMark = marks.find(r => r.id === col.referenced_mark_id);
          return { sample: sampleById[col.referenced_mark_id] ?? 0, est: Number(refMark?.estimate_mark) || 0 };
        }).sort((a, b) => b.sample - a.sample).slice(0, bestCount);
        const sumIn = refVals.reduce((a, r) => a + r.sample, 0);
        const sumEst = refVals.reduce((a, r) => a + r.est, 0);
        sampleById[m.id] = sumEst > 0 ? (sumIn / sumEst) * Number(m.percentage) : sumIn;
      }
    });
    return marks.map(m => sampleById[m.id] ?? 0);
  }, [selectedMarksheet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const submitData = {
        ...formData,
        subjects_full_mark: parseFloat(formData.subjects_full_mark) || 0,
        subjects_credit: parseFloat(formData.subjects_credit) || 0,
        atw_subjects_module_marksheet_id: formData.atw_subjects_module_marksheet_id === "" ? null : formData.atw_subjects_module_marksheet_id,
        university_id: formData.university_id === "" ? null : formData.university_id,
        semester_id: formData.semester_id === "" ? null : formData.semester_id,
        program_id: formData.program_id === "" ? null : formData.program_id,
        system_programs_changeable_semester_id: formData.system_programs_changeable_semester_id === "" ? null : formData.system_programs_changeable_semester_id,
        university_semester_id: formData.university_semester_id === "" ? null : formData.university_semester_id,
        atw_university_department_id: formData.atw_university_department_id === "" ? null : formData.atw_university_department_id,
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} subject module`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "SELECT") {
        e.preventDefault();
        const form = target.closest("form");
        if (!form) return;
        const focusableElements = Array.from(
          form.querySelectorAll<HTMLElement>(
            'input:not([disabled]):not([type="radio"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]:not([disabled])'
          )
        );
        const index = focusableElements.indexOf(target);
        if (index > -1 && index < focusableElements.length - 1) {
          focusableElements[index + 1].focus();
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <SearchableSelect
              label="Select Marksheet"
              required
              value={formData.atw_subjects_module_marksheet_id}
              onChange={(val) => handleChange("atw_subjects_module_marksheet_id", val)}
              options={marksheets.map(m => ({ id: m.id, label: `${m.name} (${m.code})`.toUpperCase() }))}
              placeholder="Search marksheet..."
            />
            <p className="mt-1 text-[10px] text-gray-500 italic">Manage marksheets in the Marksheets section.</p>
          </div>

          <SearchableSelect
            label="University"
            required
            value={formData.university_id}
            onChange={(val) => {
              handleChange("university_id", val);
              handleChange("university_semester_id", "");
              handleChange("atw_university_department_id", "");
            }}
            options={universities.map(u => ({ id: u.id, label: `${u.short_name} (${u.code})`.toUpperCase() }))}
            placeholder="Search university..."
          />

          <SearchableSelect
            label="BAFA Semester"
            required
            value={formData.semester_id}
            onChange={(val) => {
              handleChange("semester_id", val);
              handleChange("program_id", "");
              handleChange("system_programs_changeable_semester_id", "");
            }}
            options={semesters.map(s => ({ id: s.id, label: s.name.toLocaleUpperCase() }))}
            placeholder="Search semester..."
          />

          {(() => {
            // Build combined program options: regular programs + changeable programs for selected semester
            const programOptions: { id: string; label: string; group?: string }[] = [];
            programs.forEach(p => {
              programOptions.push({ id: String(p.id), label: `${p.name}`.toLocaleUpperCase() });
            });
            if (formData.semester_id) {
              programs.forEach(p => {
                p.changeable_semesters?.forEach(cs => {
                  if (cs.semester_id === Number(formData.semester_id)) {
                    programOptions.push({ id: `cs:${cs.id}:${p.id}`, label: `${cs.name}`.toLocaleUpperCase(), group: 'Changeable' });
                  }
                });
              });
            }

            // Derive current select value
            const currentVal = formData.system_programs_changeable_semester_id
              ? `cs:${formData.system_programs_changeable_semester_id}:${formData.program_id}`
              : formData.program_id ? String(formData.program_id) : "";

            const selectedOption = programOptions.find(o => o.id === currentVal);

            return (
              <SearchableSelectString
                label="Program"
                required
                value={currentVal}
                onChange={(val) => {
                  if (val.startsWith("cs:")) {
                    const parts = val.split(":");
                    handleChange("system_programs_changeable_semester_id", Number(parts[1]));
                    handleChange("program_id", Number(parts[2]));
                  } else if (val) {
                    handleChange("program_id", Number(val));
                    handleChange("system_programs_changeable_semester_id", "");
                  } else {
                    handleChange("program_id", "");
                    handleChange("system_programs_changeable_semester_id", "");
                  }
                }}
                options={programOptions}
                selectedLabel={selectedOption?.label}
                placeholder="Search program..."
                disabled={!formData.semester_id}
                disabledText="Select a semester first"
              />
            );
          })()}

          {formData.university_id && formData.system_programs_changeable_semester_id && universitySemesters.length > 0 && (
            <SearchableSelect
              label="University Semester"
              required
              value={formData.university_semester_id}
              onChange={(val) => handleChange("university_semester_id", val)}
              options={universitySemesters.map(s => ({ id: s.id, label: s.short_name || s.name }))}
              placeholder="Search university semester..."
            />
          )}

          {formData.university_id && formData.system_programs_changeable_semester_id && (
            <SearchableSelect
              label="University Department"
              required
              value={formData.atw_university_department_id}
              onChange={(val) => handleChange("atw_university_department_id", val)}
              options={universityDepartments.map(d => ({ id: d.id, label: `${d.name} (${d.code})` }))}
              placeholder="Search department..."
            />
          )}

          <div>
            <Label>Subject Name <span className="text-red-500">*</span></Label>
            <Input value={formData.subject_name} onChange={(e) => handleChange("subject_name", e.target.value)} placeholder="Enter subject name" required />
          </div>
          <div>
            <Label>Subject Code <span className="text-red-500">*</span></Label>
            <Input value={formData.subject_code} onChange={(e) => handleChange("subject_code", e.target.value)} placeholder="Enter subject code" required />
          </div>
          <SearchableSelect
            label="Subject Type"
            required
            value={formData.subject_type === "academic" ? 1 : formData.subject_type === "professional" ? 2 : ""}
            onChange={(val) => handleChange("subject_type", val === 1 ? "academic" : val === 2 ? "professional" : "academic")}
            options={[{ id: 1, label: "Academic" }, { id: 2, label: "Professional" }]}
            placeholder="Search type..."
          />
          <div>
            <Label>Subject Legend <span className="text-red-500">*</span></Label>
            <Input value={formData.subject_legend} onChange={(e) => handleChange("subject_legend", e.target.value)} placeholder="Enter legend" required />
          </div>
          <div>
            <Label>Subject Period <span className="text-red-500">*</span></Label>
            <Input value={formData.subject_period} onChange={(e) => handleChange("subject_period", e.target.value)} placeholder="Enter period" required />
          </div>
          <div>
            <Label>Full Mark <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              value={formData.subjects_full_mark}
              onChange={(e) => handleNumericInput("subjects_full_mark", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Credit Hours <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              value={formData.subjects_credit}
              onChange={(e) => handleNumericInput("subjects_credit", e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <Label className="mb-2">Syllabus File (PDF/DOC)</Label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 border border-gray-200 rounded-lg focus:outline-none dark:border-gray-700"
            />
            {formData.syllabus_file && (
              <button
                type="button"
                onClick={clearFile}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Clear selected file"
              >
                <Icon icon="hugeicons:cancel-01" className="w-5 h-5" />
              </button>
            )}
          </div>
          {initialData?.syllabus && !formData.syllabus_file && (
            <p className="mt-2 text-sm text-gray-500">
              Current file: <a href={initialData.syllabus} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1"><Icon icon="hugeicons:document-attachment" /> View Document</a>
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">Optional. Max size 10MB.</p>
        </div>

        {/* Selected Marksheet Preview */}
        {selectedMarksheet && (() => {
          const marks = selectedMarksheet.marks || [];

          // Build set of referenced mark IDs from combined_cols — shown but excluded from Total
          const refMarkIds = new Set(
            marks.flatMap(m => m.is_combined && m.combined_cols ? m.combined_cols.map(c => c.referenced_mark_id) : [])
          );

          // Show ALL marks
          const visibleMarks = marks.map((m, idx) => ({ ...m, _idx: idx }));

          const previewGroups = Object.values(
            visibleMarks.reduce((acc, m) => {
              const key = m.type || `__none_${m._idx}`;
              if (!acc[key]) acc[key] = { type: m.type || "", marks: [] as (typeof m & { _idx: number })[] };
              acc[key].marks.push(m);
              return acc;
            }, {} as Record<string, { type: string; marks: (typeof visibleMarks[0])[] }>)
          );

          // Total only counts non-referenced marks
          const previewTotal = previewGroups.reduce((acc, group) =>
            acc + group.marks.reduce((gacc, m) => {
              if (refMarkIds.has(m.id)) return gacc;
              const sample = previewSamples[m._idx] ?? 0;
              if (m.is_combined) return gacc + sample;
              const est = Number(m.estimate_mark) || 0;
              const pct = Number(m.percentage) || 0;
              return gacc + (est !== pct && est > 0 ? (sample / est) * pct : sample);
            }, 0), 0);

          return (
            <div className="py-2">
              <Label>Result Entry Preview</Label>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-sm">
                  <thead>
                    <tr>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={3}>Sl</th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={3}>BD/No</th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={3}>Rank</th>
                      <th className="border border-black px-3 py-2 text-left" rowSpan={3}>Name</th>
                      <th className="border border-black px-3 py-2 text-center" rowSpan={3}>Branch</th>
                      {previewGroups.map((group, gi) => (
                        <th
                          key={gi}
                          className="border border-black px-3 py-2 text-center font-semibold uppercase"
                          colSpan={group.marks.reduce((acc, m) => acc + (!m.is_combined && Number(m.estimate_mark) !== Number(m.percentage) ? 2 : 1), 0)}
                        >
                          {group.type || '—'}
                        </th>
                      ))}
                      <th className="border border-black px-3 py-2 text-center font-bold" rowSpan={3}>Total</th>
                    </tr>
                    <tr>
                      {previewGroups.flatMap((group, gi) =>
                        group.marks.map((m, mi) => (
                          <th key={`${gi}-${mi}`}
                            className="border border-black px-2 py-2 text-center"
                            colSpan={!m.is_combined && Number(m.estimate_mark) !== Number(m.percentage) ? 2 : 1}
                          >
                            <div className="text-xs font-medium uppercase">{m.name || '—'}</div>
                          </th>
                        ))
                      )}
                    </tr>
                    <tr>
                      {previewGroups.flatMap((group, gi) =>
                        group.marks.map((m, mi) => {
                          const est = Number(m.estimate_mark);
                          const pct = Number(m.percentage);
                          if (!m.is_combined && est !== pct) {
                            return (
                              <React.Fragment key={`${gi}-${mi}`}>
                                <th className="border border-black px-1 py-1 text-center w-[80px] min-w-[80px]">{est.toFixed(0)}</th>
                                <th className="border border-black px-1 py-1 text-center w-[80px] min-w-[80px]">{pct.toFixed(0)}</th>
                              </React.Fragment>
                            );
                          }
                          return (
                            <th key={`${gi}-${mi}`} className="border border-black px-1 py-1 text-center min-w-[100px]">
                              {pct.toFixed(0)}
                            </th>
                          );
                        })
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-3 py-2 text-center text-gray-400 italic text-xs">1</td>
                      <td className="border border-black px-3 py-2 text-center text-gray-400 italic text-xs">BD-001</td>
                      <td className="border border-black px-3 py-2 text-center text-gray-400 italic text-xs">Flt Cdt</td>
                      <td className="border border-black px-3 py-2 text-gray-400 italic text-xs">Example Cadet</td>
                      <td className="border border-black px-3 py-2 text-center text-gray-400 italic text-xs">GD(P)</td>
                      {previewGroups.flatMap((group, gi) =>
                        group.marks.map((m, mi) => {
                          const est = Number(m.estimate_mark) || 0;
                          const pct = Number(m.percentage) || 0;
                          const sample = previewSamples[m._idx] ?? 0;
                          if (m.is_combined) {
                            return (
                              <td key={`${gi}-${mi}`} className="border border-black px-2 py-1 text-center text-gray-400 italic text-xs min-w-[100px]">
                                {sample.toFixed(0)}
                              </td>
                            );
                          }
                          const isSplit = est !== pct;
                          if (isSplit) {
                            const converted = est > 0 ? (sample / est) * pct : 0;
                            return (
                              <React.Fragment key={`${gi}-${mi}`}>
                                <td className="border border-black px-2 py-1 text-center text-gray-400 italic text-xs w-[80px] min-w-[80px]">{sample.toFixed(0)}</td>
                                <td className="border border-black px-2 py-1 text-center text-gray-400 italic text-xs w-[80px] min-w-[80px]">{converted.toFixed(2)}</td>
                              </React.Fragment>
                            );
                          }
                          return (
                            <td key={`${gi}-${mi}`} className="border border-black px-2 py-1 text-center text-gray-400 italic text-xs min-w-[100px]">
                              {sample.toFixed(0)}
                            </td>
                          );
                        })
                      )}
                      <td className="border border-black px-3 py-2 text-center font-bold text-gray-500 text-xs">{previewTotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-3">Is Current?</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="is_current"
                  checked={formData.is_current === true}
                  onChange={() => handleChange("is_current", true)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Current:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This module is part of the current active syllabus.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="is_current"
                  checked={formData.is_current === false}
                  onChange={() => handleChange("is_current", false)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Legacy:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This module is kept for historical records only.</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="is_active"
                  checked={formData.is_active === true}
                  onChange={() => handleChange("is_active", true)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This subject module will be available for use.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="is_active"
                  checked={formData.is_active === false}
                  onChange={() => handleChange("is_active", false)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">This subject module will be hidden from general use.</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-8 mt-6 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors" disabled={loading}>
          Cancel
        </button>
        <button
          type="submit"
          className="px-8 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
          disabled={
            loading ||
            !formData.subject_name.trim() ||
            !formData.subject_code.trim() ||
            !formData.atw_subjects_module_marksheet_id
          }
        >
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {isEdit ? "Update Module" : "Create Module"}
        </button>
      </div>
    </form >
  );
}
