/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import type { AtwSubject, AtwSubjectModule, SystemSemester, SystemProgram, SystemUniversity, AtwUniversityDepartment } from "@/libs/types/system";
import { commonService } from "@/libs/services/commonService";
import { universitySemesterService, SystemUniversitySemester } from "@/libs/services/universitySemesterService";

interface SubjectFormProps {
  initialData?: AtwSubject | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

interface UIModule {
  ui_id: string;
  atw_subject_module_id: number | "";
}

interface UIDept {
  ui_id: string;
  atw_university_department_id: number | "";
  modules: UIModule[];
}

interface UIProgram {
  ui_id: string;
  program_id: number | "";
  changeable_semester_id: number | null;
  university_id: number | null;
  university_semester_id: number | null;
  departments: UIDept[];
  modules: UIModule[];
}

interface UISemester {
  ui_id: string;
  semester_id: number | "";
  programs: UIProgram[];
}

function SearchableModuleSelect({
  modules,
  value,
  onChange,
  disabledIds,
  universityId,
  semesterId,
  programId,
  changeableSemesterId,
}: {
  modules: AtwSubjectModule[];
  value: number | "";
  onChange: (val: number | "") => void;
  disabledIds: number[];
  universityId?: number | null;
  semesterId?: number | null;
  programId?: number | null;
  changeableSemesterId?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  let filteredByContext = modules;
  if (universityId) filteredByContext = filteredByContext.filter(m => m.university_id === universityId);
  if (semesterId) filteredByContext = filteredByContext.filter(m => m.semester_id === semesterId || !m.semester_id);
  if (programId) filteredByContext = filteredByContext.filter(m => m.program_id === programId || !m.program_id);
  if (changeableSemesterId) filteredByContext = filteredByContext.filter(m => m.system_programs_changeable_semester_id === changeableSemesterId || !m.system_programs_changeable_semester_id);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = modules.find((m) => m.id === value);
  const filtered = filteredByContext.filter(
    (m) =>
      m.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      m.subject_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-2 border border-gray-300 rounded text-sm text-left bg-white hover:border-blue-400 transition-colors flex items-center justify-between"
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? `${selected.subject_name} (${selected.subject_code})` : "-- Select Subject Module --"}
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
                placeholder="Search subject module..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                -- Clear Selection --
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                {universityId || semesterId ? "No subject modules match the selected filters" : "No subject modules found"}
              </div>
            ) : (
              filtered.map((m) => {
                const isDisabled = disabledIds.includes(m.id);
                const isSelected = m.id === value;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => { if (!isDisabled) { onChange(m.id); setOpen(false); setSearch(""); } }}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${
                      isSelected ? "bg-blue-50 text-blue-700 font-medium" :
                      isDisabled ? "text-gray-300 cursor-not-allowed bg-gray-50" :
                      "text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    <span>{m.subject_name} ({m.subject_code})</span>
                    {isDisabled && <span className="text-xs text-gray-400">Already added</span>}
                    {isSelected && <Icon icon="hugeicons:tick-02" className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubjectForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: SubjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    slug: "",
    is_current: true,
    is_active: true,
  });

  const [error, setError] = useState("");

  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [universities, setUniversities] = useState<SystemUniversity[]>([]);
  const [universityDepartments, setUniversityDepartments] = useState<AtwUniversityDepartment[]>([]);
  const [modules, setModules] = useState<AtwSubjectModule[]>([]);
  const [universitySemestersMap, setUniversitySemestersMap] = useState<Record<number, SystemUniversitySemester[]>>({});
  const [loadingData, setLoadingData] = useState(false);

  const [tree, setTree] = useState<UISemester[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        code: initialData.code || "",
        slug: initialData.slug || "",
        is_current: initialData.is_current ?? true,
        is_active: initialData.is_active ?? true,
      });

      if (initialData.groups && Array.isArray(initialData.groups) && initialData.groups.length > 0) {
        // Group by semester → program+changeable+university → department → modules
        const semMap = new Map<number, Map<string, {
          program_id: number;
          changeable_semester_id: number | null;
          university_id: number | null;
          university_semester_id: number | null;
          deptModules: Map<number | null, number[]>;
        }>>();

        initialData.groups.forEach((g: any) => {
          if (!g.semester_id || !g.program_id || !g.atw_subject_module_id) return;

          if (!semMap.has(g.semester_id)) semMap.set(g.semester_id, new Map());
          const progMap = semMap.get(g.semester_id)!;

          const csId = g.system_programs_changeable_semester_id || null;
          const univId = g.university_id || null;
          const univSemId = g.university_semester_id || null;
          const progKey = `${g.program_id}-${csId}-${univId}`;

          if (!progMap.has(progKey)) {
            progMap.set(progKey, {
              program_id: g.program_id,
              changeable_semester_id: csId,
              university_id: univId,
              university_semester_id: univSemId,
              deptModules: new Map(),
            });
          }
          if (univId && univSemId) loadUniversitySemesters(univId);
          const progData = progMap.get(progKey)!;
          const deptId: number | null = g.atw_university_department_id || null;
          if (!progData.deptModules.has(deptId)) progData.deptModules.set(deptId, []);
          progData.deptModules.get(deptId)!.push(g.atw_subject_module_id);
        });

        const newTree: UISemester[] = Array.from(semMap.entries()).map(([semId, progMap]) => ({
          ui_id: generateId(),
          semester_id: semId,
          programs: Array.from(progMap.values()).map(progData => {
            const isChangeable = !!progData.changeable_semester_id;
            const hasDepts = isChangeable && progData.university_id && progData.deptModules.size > 0 &&
              Array.from(progData.deptModules.keys()).some(k => k !== null);

            if (hasDepts) {
              const departments: UIDept[] = Array.from(progData.deptModules.entries())
                .filter(([deptId]) => deptId !== null)
                .map(([deptId, modIds]) => ({
                  ui_id: generateId(),
                  atw_university_department_id: deptId as number,
                  modules: modIds.map(modId => ({ ui_id: generateId(), atw_subject_module_id: modId })),
                }));
              return {
                ui_id: generateId(),
                program_id: progData.program_id,
                changeable_semester_id: progData.changeable_semester_id,
                university_id: progData.university_id,
                university_semester_id: progData.university_semester_id,
                departments,
                modules: [],
              };
            } else {
              const modIds = Array.from(progData.deptModules.values()).flat();
              return {
                ui_id: generateId(),
                program_id: progData.program_id,
                changeable_semester_id: progData.changeable_semester_id,
                university_id: progData.university_id,
                university_semester_id: progData.university_semester_id,
                departments: [],
                modules: modIds.map(modId => ({ ui_id: generateId(), atw_subject_module_id: modId })),
              };
            }
          }),
        }));
        setTree(newTree);
      }
    }
  }, [initialData]);

  useEffect(() => {
    setLoadingData(true);
    commonService.getSubjectFormOptions()
      .then((res) => {
        setSemesters(res?.semesters || []);
        setPrograms(res?.programs || []);
        setUniversities(res?.universities || []);
        setUniversityDepartments(res?.university_departments || []);
        setModules(res?.modules || []);

      })
      .catch(err => console.error("Failed to load options:", err))
      .finally(() => setLoadingData(false));
  }, []);

  // Preload university semesters for universities already in tree
  useEffect(() => {
    const univIds = new Set<number>();
    tree.forEach(s => s.programs.forEach(p => { if (p.university_id) univIds.add(p.university_id); }));
    univIds.forEach(id => { if (!universitySemestersMap[id]) loadUniversitySemesters(id); });
  }, [tree]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Tree Manipulation ---
  const addSemester = () => {
    setTree([...tree, { ui_id: generateId(), semester_id: "", programs: [] }]);
  };
  const removeSem = (semId: string) => {
    setTree(tree.filter(s => s.ui_id !== semId));
  };
  const updateSem = (semId: string, val: number | "") => {
    setTree(tree.map(s => s.ui_id === semId ? { ...s, semester_id: val, programs: [] } : s));
  };

  const addProgram = (semId: string) => {
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: [...s.programs, { ui_id: generateId(), program_id: "", changeable_semester_id: null, university_id: null, university_semester_id: null, departments: [], modules: [] }]
    } : s));
  };
  const removeProg = (semId: string, progId: string) => {
    setTree(tree.map(s => s.ui_id === semId ? { ...s, programs: s.programs.filter(p => p.ui_id !== progId) } : s));
  };
  const updateProg = (semId: string, progId: string, val: string) => {
    let programId: number | "" = "";
    let changeableSemesterId: number | null = null;
    if (val.startsWith("cs:")) {
      const parts = val.split(":");
      changeableSemesterId = Number(parts[1]);
      programId = Number(parts[2]);
    } else if (val) {
      programId = Number(val);
    }
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.map(p => p.ui_id === progId ? { ...p, program_id: programId, changeable_semester_id: changeableSemesterId, university_id: null, university_semester_id: null, departments: [], modules: [] } : p)
    } : s));
  };

  const loadUniversitySemesters = async (universityId: number) => {
    if (universitySemestersMap[universityId]) return;
    try {
      const res = await universitySemesterService.getAll({ university_id: universityId, per_page: 100 });
      setUniversitySemestersMap(prev => ({ ...prev, [universityId]: res.data || [] }));
    } catch {
      setUniversitySemestersMap(prev => ({ ...prev, [universityId]: [] }));
    }
  };

  // Auto-fill modules: strict match — module must have each field set AND matching
  const getAutoModules = (opts: { semesterId?: number | ""; programId?: number | ""; changeableSemesterId?: number | null; universityId?: number | null; deptId?: number | "" }): UIModule[] => {
    return modules
      .filter(m => {
        if (opts.semesterId) { if (!m.semester_id || m.semester_id !== Number(opts.semesterId)) return false; }
        if (opts.programId) { if (!m.program_id || m.program_id !== Number(opts.programId)) return false; }
        if (opts.changeableSemesterId) { if (!m.system_programs_changeable_semester_id || m.system_programs_changeable_semester_id !== opts.changeableSemesterId) return false; }
        else { if (m.system_programs_changeable_semester_id) return false; }
        if (opts.universityId) { if (!m.university_id || m.university_id !== opts.universityId) return false; }
        if (opts.deptId) { if (!m.atw_university_department_id || m.atw_university_department_id !== Number(opts.deptId)) return false; }
        return true;
      })
      .map(m => ({ ui_id: generateId(), atw_subject_module_id: m.id }));
  };

  const updateProgUniversity = (semId: string, progId: string, val: number | null) => {
    const sem = tree.find(s => s.ui_id === semId);
    const prog = sem?.programs.find(p => p.ui_id === progId);

    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.map(p => {
        if (p.ui_id !== progId) return p;
        // For non-changeable programs, auto-fill modules when university is selected
        if (!p.changeable_semester_id && val) {
          const autoMods = getAutoModules({ semesterId: sem?.semester_id, programId: p.program_id, changeableSemesterId: null, universityId: val });
          return { ...p, university_id: val, university_semester_id: null, departments: [], modules: autoMods.length > 0 ? autoMods : p.modules };
        }
        return { ...p, university_id: val, university_semester_id: null, departments: [] };
      })
    } : s));
    if (val) loadUniversitySemesters(val);
  };

  const updateProgUniversitySemester = (semId: string, progId: string, val: number | null) => {
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.map(p => p.ui_id === progId ? { ...p, university_semester_id: val } : p)
    } : s));
  };

  // Dept operations
  const addDept = (semId: string, progId: string) => {
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.map(p => p.ui_id === progId ? {
        ...p,
        departments: [...p.departments, { ui_id: generateId(), atw_university_department_id: "", modules: [] }]
      } : p)
    } : s));
  };
  const removeDept = (semId: string, progId: string, deptId: string) => {
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.map(p => p.ui_id === progId ? { ...p, departments: p.departments.filter(d => d.ui_id !== deptId) } : p)
    } : s));
  };
  const updateDeptValue = (semId: string, progId: string, deptId: string, val: number | "") => {
    const sem = tree.find(s => s.ui_id === semId);
    const prog = sem?.programs.find(p => p.ui_id === progId);

    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.map(p => p.ui_id === progId ? {
        ...p,
        departments: p.departments.map(d => {
          if (d.ui_id !== deptId) return d;
          if (val) {
            const autoMods = getAutoModules({ semesterId: sem?.semester_id, programId: p.program_id, changeableSemesterId: p.changeable_semester_id, universityId: p.university_id, deptId: val });
            return { ...d, atw_university_department_id: val, modules: autoMods.length > 0 ? autoMods : d.modules };
          }
          return { ...d, atw_university_department_id: val };
        })
      } : p)
    } : s));
  };

  // Per-dept module operations
  const addDeptModule = (semId: string, progId: string, deptId: string) => {
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.map(p => p.ui_id === progId ? {
        ...p,
        departments: p.departments.map(d => d.ui_id === deptId ? {
          ...d,
          modules: [...d.modules, { ui_id: generateId(), atw_subject_module_id: "" }]
        } : d)
      } : p)
    } : s));
  };
  const removeDeptModule = (semId: string, progId: string, deptId: string, modId: string) => {
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.map(p => p.ui_id === progId ? {
        ...p,
        departments: p.departments.map(d => d.ui_id === deptId ? {
          ...d,
          modules: d.modules.filter(m => m.ui_id !== modId)
        } : d)
      } : p)
    } : s));
  };
  const updateDeptModule = (semId: string, progId: string, deptId: string, modId: string, val: number | "") => {
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.map(p => p.ui_id === progId ? {
        ...p,
        departments: p.departments.map(d => d.ui_id === deptId ? {
          ...d,
          modules: d.modules.map(m => m.ui_id === modId ? { ...m, atw_subject_module_id: val } : m)
        } : d)
      } : p)
    } : s));
  };

  // Regular (non-changeable) module operations
  const addModule = (semId: string, progId: string) => {
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.map(p => p.ui_id === progId ? {
        ...p,
        modules: [...p.modules, { ui_id: generateId(), atw_subject_module_id: "" }]
      } : p)
    } : s));
  };
  const removeModule = (semId: string, progId: string, modId: string) => {
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.map(p => p.ui_id === progId ? { ...p, modules: p.modules.filter(m => m.ui_id !== modId) } : p)
    } : s));
  };
  const updateModule = (semId: string, progId: string, modId: string, val: number | "") => {
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.map(p => p.ui_id === progId ? {
        ...p,
        modules: p.modules.map(m => m.ui_id === modId ? { ...m, atw_subject_module_id: val } : m)
      } : p)
    } : s));
  };

  // --- Helpers ---
  const getModulePeriod = (moduleId: number | "") => {
    if (!moduleId) return 0;
    return Number(modules.find(m => m.id === moduleId)?.subject_period) || 0;
  };

  const getProgRowSpan = (prog: UIProgram): number => {
    if (!prog.changeable_semester_id) {
      return prog.modules.length + 1;
    }
    if (!prog.university_id) return 1;
    if (prog.departments.length === 0) return 1;
    return prog.departments.reduce((acc, d) => acc + d.modules.length + 1, 0) + 1;
  };

  const getProgramGrandTotal = (prog: UIProgram): number => {
    if (prog.changeable_semester_id && prog.university_id) {
      return prog.departments.reduce((acc, d) =>
        acc + d.modules.reduce((sum, m) => sum + getModulePeriod(m.atw_subject_module_id), 0), 0
      );
    }
    return prog.modules.reduce((acc, m) => acc + getModulePeriod(m.atw_subject_module_id), 0);
  };

  const getChangeableOptions = (semesterId: number | "") => {
    if (!semesterId) return [];
    const result: { csId: number; programId: number; label: string }[] = [];
    programs.forEach(p => {
      p.changeable_semesters?.forEach(cs => {
        if (cs.semester_id === Number(semesterId)) {
          result.push({ csId: cs.id, programId: p.id, label: cs.name });
        }
      });
    });
    return result;
  };

  const getProgSelectValue = (prog: UIProgram): string => {
    if (prog.changeable_semester_id) return `cs:${prog.changeable_semester_id}:${prog.program_id}`;
    return prog.program_id === "" ? "" : String(prog.program_id);
  };

  const renderProgCellContent = (sem: UISemester, prog: UIProgram) => (
    <div className="flex items-center gap-2 w-[220px] max-w-[220px]">
      <select className="flex-1 min-w-0 p-2 border border-gray-300 rounded focus:ring-blue-500 text-sm truncate" value={getProgSelectValue(prog)} onChange={(e) => updateProg(sem.ui_id, prog.ui_id, e.target.value)}>
        <option value="">-- Select Program --</option>
        {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        {getChangeableOptions(sem.semester_id).map((c) => (
          <option key={`cs-${c.csId}`} value={`cs:${c.csId}:${c.programId}`}>{c.label}</option>
        ))}
      </select>
      <button type="button" onClick={() => removeProg(sem.ui_id, prog.ui_id)} className="text-red-500 hover:text-red-700 p-2 border border-transparent hover:border-red-200 rounded hover:bg-red-50 transition-colors" title="Remove">
        <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
      </button>
    </div>
  );

  const renderUniversitySelect = (sem: UISemester, prog: UIProgram) => (
    <div className="space-y-1">
      <select className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 text-sm" value={prog.university_id ?? ""} onChange={(e) => updateProgUniversity(sem.ui_id, prog.ui_id, e.target.value ? Number(e.target.value) : null)}>
        <option value="">-- Select University --</option>
        {universities.map(u => <option key={u.id} value={u.id}>{u.short_name || u.name}</option>)}
      </select>
      {prog.university_id && (universitySemestersMap[prog.university_id] || []).length > 0 && (
        <div>
          <select className="w-full p-2 border border-gray-200 rounded focus:ring-blue-500 text-xs text-gray-600 bg-gray-50" value={prog.university_semester_id ?? ""} onChange={(e) => updateProgUniversitySemester(sem.ui_id, prog.ui_id, e.target.value ? Number(e.target.value) : null)}>
            <option value="">-- Select University Semester --</option>
            {(universitySemestersMap[prog.university_id] || []).map(s => (
              <option key={s.id} value={s.id}>{s.short_name || s.name}</option>
            ))}
          </select>
          {!prog.university_semester_id && <p className="text-[10px] text-red-500 mt-0.5">University Semester is required</p>}
        </div>
      )}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.code) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      const groupsToSubmit: any[] = [];
      tree.forEach(sem => {
        if (!sem.semester_id) return;
        sem.programs.forEach(prog => {
          if (!prog.program_id) return;
          if (prog.changeable_semester_id && prog.university_id) {
            // Changeable: submit per-dept modules
            prog.departments.forEach(dept => {
              if (!dept.atw_university_department_id) return;
              dept.modules.forEach(mod => {
                if (!mod.atw_subject_module_id) return;
                groupsToSubmit.push({
                  semester_id: sem.semester_id,
                  program_id: prog.program_id,
                  system_programs_changeable_semester_id: prog.changeable_semester_id,
                  university_id: prog.university_id,
                  university_semester_id: prog.university_semester_id || null,
                  atw_university_department_id: dept.atw_university_department_id,
                  atw_subject_module_id: mod.atw_subject_module_id,
                  is_current: true,
                  is_active: true,
                });
              });
            });
          } else {
            // Regular: submit prog-level modules
            prog.modules.forEach(mod => {
              if (!mod.atw_subject_module_id) return;
              groupsToSubmit.push({
                semester_id: sem.semester_id,
                program_id: prog.program_id,
                system_programs_changeable_semester_id: null,
                university_id: prog.university_id || null,
                university_semester_id: prog.university_semester_id || null,
                atw_university_department_id: null,
                atw_subject_module_id: mod.atw_subject_module_id,
                is_current: true,
                is_active: true,
              });
            });
          }
        });
      });

      await onSubmit({ ...formData, groups: groupsToSubmit });
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} subject`);
    }
  };

  // --- Cell TD helpers (shared styles) ---
  const tdBase = "border border-black p-3 align-middle bg-white";
  const tdGray = "border border-black p-3 bg-gray-50";

  const semSelectJSX = (sem: UISemester, rowSpan: number) => {
    return (
      <td rowSpan={rowSpan} className={tdBase}>
        <div className="flex items-center gap-2">
          <select className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 text-sm" value={sem.semester_id} onChange={(e) => updateSem(sem.ui_id, e.target.value ? Number(e.target.value) : "")}>
            <option value="">-- Select Semester --</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
          </select>
          <button type="button" onClick={() => removeSem(sem.ui_id)} className="text-red-500 hover:text-red-700 p-2 border border-transparent hover:border-red-200 rounded hover:bg-red-50 transition-colors" title="Remove">
            <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
          </button>
        </div>
      </td>
    );
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
            <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label>Subject Group Name <span className="text-red-500">*</span></Label>
            <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="e.g. Ground Training, Flying Phase 1" required />
          </div>
          <div>
            <Label>Subject Group Code <span className="text-red-500">*</span></Label>
            <Input value={formData.code} onChange={(e) => handleChange("code", e.target.value)} placeholder="e.g. GT-01" required />
          </div>
          <div>
            <Label>Group Slug (Optional)</Label>
            <Input value={formData.slug} onChange={(e) => handleChange("slug", e.target.value)} placeholder="Auto-generated if left blank" />
          </div>
        </div>

        <div>
          <div className="bg-white overflow-x-auto min-h-[200px]">
            {loadingData ? (
              <div className="p-8 flex justify-center text-gray-500">
                <Icon icon="hugeicons:loading-03" className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead className="text-gray-900 font-bold border-b border-black">
                  <tr>
                    <th className="px-4 py-3 border border-black whitespace-nowrap">Semester</th>
                    <th className="px-4 py-3 border border-black whitespace-nowrap w-[220px] max-w-[220px]">Program</th>
                    <th className="px-4 py-3 border border-black whitespace-nowrap">University</th>
                    <th className="px-4 py-3 border border-black whitespace-nowrap">Department</th>
                    <th className="px-4 py-3 border border-black whitespace-nowrap">Syllabus Subject Module</th>
                    <th className="px-4 py-3 border border-black text-center whitespace-nowrap w-24">Total Period</th>
                    <th className="px-4 py-3 border border-black text-center whitespace-nowrap w-28">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900">
                  {tree.length === 0 && (
                    <tr>
                      <td colSpan={7} className="border border-black p-8 text-center text-gray-500 bg-gray-50">
                        No groupings added. Use the button below to add a semester.
                      </td>
                    </tr>
                  )}

                  {tree.map((sem) => {
                    const semRowSpan = sem.programs.length === 0 ? 2
                      : sem.programs.reduce((acc, p) => acc + getProgRowSpan(p), 0) + 1;

                    return (
                      <React.Fragment key={sem.ui_id}>
                        {sem.programs.length === 0 ? (
                          <tr>
                            {semSelectJSX(sem, semRowSpan)}
                            <td colSpan={6} className="border border-black p-3 text-center text-gray-400 italic bg-gray-50">
                              No programs assigned. Use the &quot;+ Add Program&quot; button below.
                            </td>
                          </tr>
                        ) : (
                          sem.programs.map((prog, pIdx) => {
                            const isFirstProg = pIdx === 0;
                            const progRowSpan = getProgRowSpan(prog);
                            const grandTotal = getProgramGrandTotal(prog);

                            // CASE 1: Non-changeable program
                            if (!prog.changeable_semester_id) {
                              return (
                                <React.Fragment key={prog.ui_id}>
                                  {prog.modules.map((mod, mIdx) => (
                                    <tr key={mod.ui_id}>
                                      {isFirstProg && mIdx === 0 && semSelectJSX(sem, semRowSpan)}
                                      {mIdx === 0 && <td rowSpan={progRowSpan} className={tdBase}>{renderProgCellContent(sem, prog)}</td>}
                                      {mIdx === 0 && <td rowSpan={progRowSpan} className={tdBase}>{renderUniversitySelect(sem, prog)}</td>}
                                      {mIdx === 0 && <td rowSpan={progRowSpan} className={tdBase}><span className="text-gray-300 text-xs">—</span></td>}
                                      <td className={tdBase}>
                                        <div className="flex items-center gap-2">
                                          <SearchableModuleSelect
                                            modules={modules}
                                            value={mod.atw_subject_module_id}
                                            onChange={(val) => updateModule(sem.ui_id, prog.ui_id, mod.ui_id, val)}
                                            disabledIds={prog.modules.filter(pm => pm.ui_id !== mod.ui_id && pm.atw_subject_module_id !== "").map(pm => pm.atw_subject_module_id as number)}
                                            universityId={prog.university_id}
                                            semesterId={sem.semester_id || null}
                                            programId={prog.program_id || null}
                                            changeableSemesterId={prog.changeable_semester_id}
                                          />
                                          <button type="button" onClick={() => removeModule(sem.ui_id, prog.ui_id, mod.ui_id)} className="text-red-500 hover:text-red-700 p-2 border border-transparent hover:border-red-200 rounded hover:bg-red-50 transition-colors" title="Remove">
                                            <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                                          </button>
                                        </div>
                                      </td>
                                      <td className="border border-black p-2 text-center align-middle font-medium bg-white">{getModulePeriod(mod.atw_subject_module_id) || '-'}</td>
                                      {mIdx === 0 && <td rowSpan={progRowSpan} className="border border-black p-2 text-center align-middle font-bold text-lg bg-white">{grandTotal}</td>}
                                    </tr>
                                  ))}
                                  {/* Add module row */}
                                  <tr>
                                    {isFirstProg && prog.modules.length === 0 && semSelectJSX(sem, semRowSpan)}
                                    {prog.modules.length === 0 && <td rowSpan={progRowSpan} className={tdBase}>{renderProgCellContent(sem, prog)}</td>}
                                    {prog.modules.length === 0 && <td rowSpan={progRowSpan} className={tdBase}>{renderUniversitySelect(sem, prog)}</td>}
                                    {prog.modules.length === 0 && <td rowSpan={progRowSpan} className={tdBase}><span className="text-gray-300 text-xs">—</span></td>}
                                    <td className={tdGray}>
                                      {/* <button type="button" onClick={() => addModule(sem.ui_id, prog.ui_id)} className="w-full py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium transition-colors">
                                        + Add Subject Module
                                      </button> */}
                                    </td>
                                    <td className={tdGray}></td>
                                    {prog.modules.length === 0 && <td rowSpan={progRowSpan} className="border border-black p-2 text-center align-middle font-bold text-lg bg-white">0</td>}
                                  </tr>
                                </React.Fragment>
                              );
                            }

                            // CASE 2: Changeable — no university selected yet
                            if (!prog.university_id) {
                              return (
                                <React.Fragment key={prog.ui_id}>
                                  <tr>
                                    {isFirstProg && semSelectJSX(sem, semRowSpan)}
                                    <td className={tdBase}>{renderProgCellContent(sem, prog)}</td>
                                    <td className={tdBase}>{renderUniversitySelect(sem, prog)}</td>
                                    <td colSpan={2} className="border border-black p-3 text-center text-gray-400 italic text-xs bg-gray-50">
                                      Select a university to add departments
                                    </td>
                                    <td className="border border-black p-2 text-center align-middle bg-gray-50"></td>
                                    <td className="border border-black p-2 text-center align-middle font-bold text-lg bg-white">0</td>
                                  </tr>
                                </React.Fragment>
                              );
                            }

                            // CASE 3: Changeable + university — no departments yet
                            if (prog.departments.length === 0) {
                              return (
                                <React.Fragment key={prog.ui_id}>
                                  <tr>
                                    {isFirstProg && semSelectJSX(sem, semRowSpan)}
                                    <td className={tdBase}>{renderProgCellContent(sem, prog)}</td>
                                    <td className={tdBase}>{renderUniversitySelect(sem, prog)}</td>
                                    <td colSpan={2} className={tdGray}>
                                      <button type="button" onClick={() => addDept(sem.ui_id, prog.ui_id)} className="w-full py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium transition-colors">
                                        + Add Department
                                      </button>
                                    </td>
                                    <td className={tdGray}></td>
                                    <td className="border border-black p-2 text-center align-middle font-bold text-lg bg-white">0</td>
                                  </tr>
                                </React.Fragment>
                              );
                            }

                            // CASE 4: Changeable + university + departments
                            const deptOptions = universityDepartments.filter(d => d.university_id === prog.university_id);

                            return (
                              <React.Fragment key={prog.ui_id}>
                                {prog.departments.map((dept, dIdx) => {
                                  const isFirstDept = dIdx === 0;
                                  const deptRowSpan = dept.modules.length + 1;
                                  const selectedDeptIds = prog.departments
                                    .filter(d => d.ui_id !== dept.ui_id && d.atw_university_department_id !== "")
                                    .map(d => d.atw_university_department_id as number);

                                  const deptCellContent = (
                                    <div className="flex items-center gap-1">
                                      <select
                                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 text-sm"
                                        value={dept.atw_university_department_id}
                                        onChange={(e) => updateDeptValue(sem.ui_id, prog.ui_id, dept.ui_id, e.target.value ? Number(e.target.value) : "")}
                                      >
                                        <option value="">-- Select Department --</option>
                                        {deptOptions
                                          .filter(d => !selectedDeptIds.includes(d.id) || d.id === Number(dept.atw_university_department_id))
                                          .map(d => <option key={d.id} value={d.id}>{d.code}</option>)
                                        }
                                      </select>
                                      <button type="button" onClick={() => removeDept(sem.ui_id, prog.ui_id, dept.ui_id)} className="text-red-400 hover:text-red-600 p-1.5 border border-transparent hover:border-red-200 rounded hover:bg-red-50 transition-colors" title="Remove Department">
                                        <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                                      </button>
                                    </div>
                                  );

                                  return (
                                    <React.Fragment key={dept.ui_id}>
                                      {dept.modules.map((mod, mIdx) => (
                                        <tr key={mod.ui_id}>
                                          {isFirstProg && isFirstDept && mIdx === 0 && semSelectJSX(sem, semRowSpan)}
                                          {isFirstDept && mIdx === 0 && <td rowSpan={progRowSpan} className={tdBase}>{renderProgCellContent(sem, prog)}</td>}
                                          {isFirstDept && mIdx === 0 && <td rowSpan={progRowSpan} className={tdBase}>{renderUniversitySelect(sem, prog)}</td>}
                                          {mIdx === 0 && <td rowSpan={deptRowSpan} className={tdBase}>{deptCellContent}</td>}
                                          <td className={tdBase}>
                                            <div className="flex items-center gap-2">
                                              <SearchableModuleSelect
                                                modules={modules}
                                                value={mod.atw_subject_module_id}
                                                onChange={(val) => updateDeptModule(sem.ui_id, prog.ui_id, dept.ui_id, mod.ui_id, val)}
                                                disabledIds={dept.modules.filter(dm => dm.ui_id !== mod.ui_id && dm.atw_subject_module_id !== "").map(dm => dm.atw_subject_module_id as number)}
                                                universityId={prog.university_id}
                                                semesterId={sem.semester_id || null}
                                                programId={prog.program_id || null}
                                                changeableSemesterId={prog.changeable_semester_id}
                                              />
                                              <button type="button" onClick={() => removeDeptModule(sem.ui_id, prog.ui_id, dept.ui_id, mod.ui_id)} className="text-red-500 hover:text-red-700 p-2 border border-transparent hover:border-red-200 rounded hover:bg-red-50 transition-colors" title="Remove">
                                                <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                                              </button>
                                            </div>
                                          </td>
                                          <td className="border border-black p-2 text-center align-middle font-medium bg-white">{getModulePeriod(mod.atw_subject_module_id) || '-'}</td>
                                          {isFirstDept && mIdx === 0 && <td rowSpan={progRowSpan} className="border border-black p-2 text-center align-middle font-bold text-lg bg-white">{grandTotal}</td>}
                                        </tr>
                                      ))}
                                      {/* Add module row for this dept */}
                                      <tr>
                                        {isFirstProg && isFirstDept && dept.modules.length === 0 && semSelectJSX(sem, semRowSpan)}
                                        {isFirstDept && dept.modules.length === 0 && <td rowSpan={progRowSpan} className={tdBase}>{renderProgCellContent(sem, prog)}</td>}
                                        {isFirstDept && dept.modules.length === 0 && <td rowSpan={progRowSpan} className={tdBase}>{renderUniversitySelect(sem, prog)}</td>}
                                        {dept.modules.length === 0 && <td rowSpan={deptRowSpan} className={tdBase}>{deptCellContent}</td>}
                                        <td colSpan={2} className={tdGray}>
                                          {/* <button type="button" onClick={() => addDeptModule(sem.ui_id, prog.ui_id, dept.ui_id)} className="w-full py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium transition-colors">
                                            + Add Subject Module
                                          </button> */}
                                        </td>
                                        {isFirstDept && dept.modules.length === 0 && <td rowSpan={progRowSpan} className="border border-black p-2 text-center align-middle font-bold text-lg bg-white">{grandTotal}</td>}
                                      </tr>
                                    </React.Fragment>
                                  );
                                })}
                                {/* Add department row */}
                                <tr>
                                  <td className={tdGray}>
                                    <button type="button" onClick={() => addDept(sem.ui_id, prog.ui_id)} className="w-full py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium transition-colors">
                                      + Add Department
                                    </button>
                                  </td>
                                  <td colSpan={2} className={tdGray}></td>
                                </tr>
                              </React.Fragment>
                            );
                          })
                        )}

                        {/* Add Program row */}
                        <tr>
                          <td className={tdGray}>
                            <button type="button" onClick={() => addProgram(sem.ui_id)} className="w-full py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium transition-colors">
                              + Add Program
                            </button>
                          </td>
                          <td colSpan={5} className={tdGray}></td>
                        </tr>
                      </React.Fragment>
                    );
                  })}

                  {/* Add Semester row */}
                  <tr>
                    <td className={tdGray}>
                      <button type="button" onClick={addSemester} className="w-full py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium transition-colors">
                        + Add Semester
                      </button>
                    </td>
                    <td colSpan={6} className={tdGray}></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex gap-8 border-t border-gray-100 pt-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.is_current} onChange={(e) => handleChange("is_current", e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <span className="font-medium text-gray-900">Is Current</span>
          </label>
        </div>

        <div>
          <Label className="mb-3">Status</Label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">This subject will be available for use.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">This subject will be hidden from general use.</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 pb-6 border-t border-gray-200 mt-8">
          <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-100 transition-colors" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 transition-colors" disabled={loading}>
            {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
            {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Subject" : "Save Subject")}
          </button>
        </div>
      </form>
    </div>
  );
}
