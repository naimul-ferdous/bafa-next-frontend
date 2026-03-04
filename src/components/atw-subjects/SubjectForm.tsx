/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import type { AtwSubject, AtwSubjectModule, SystemSemester, SystemProgram } from "@/libs/types/system";
import { atwSubjectModuleService } from "@/libs/services/atwSubjectModuleService";
import { semesterService } from "@/libs/services/semesterService";
import { programService } from "@/libs/services/programService";

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

interface UIProgram {
  ui_id: string;
  program_id: number | "";
  modules: UIModule[];
}

interface UISemester {
  ui_id: string;
  semester_id: number | "";
  programs: UIProgram[];
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
  const [modules, setModules] = useState<AtwSubjectModule[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Dynamic Tree State for the Table
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
        const grouped = new Map<number, Map<number, number[]>>();
        initialData.groups.forEach((g: any) => {
          if (!g.semester_id || !g.program_id || !g.atw_subject_module_id) return;

          if (!grouped.has(g.semester_id)) {
            grouped.set(g.semester_id, new Map());
          }
          const progMap = grouped.get(g.semester_id)!;
          if (!progMap.has(g.program_id)) {
            progMap.set(g.program_id, []);
          }
          progMap.get(g.program_id)!.push(g.atw_subject_module_id);
        });

        const newTree: UISemester[] = Array.from(grouped.entries()).map(([semId, progMap]) => ({
          ui_id: generateId(),
          semester_id: semId,
          programs: Array.from(progMap.entries()).map(([progId, modIds]) => ({
            ui_id: generateId(),
            program_id: progId,
            modules: modIds.map(modId => ({
              ui_id: generateId(),
              atw_subject_module_id: modId
            }))
          }))
        }));
        setTree(newTree);
      }
    }
  }, [initialData]);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      semesterService.getAllSemesters({ per_page: 100 }),
      programService.getAllPrograms({ per_page: 100 }),
      atwSubjectModuleService.getAllSubjects({ per_page: 500 })
    ]).then(([semRes, progRes, modRes]) => {
      setSemesters(semRes.data || []);
      setPrograms(progRes.data || []);
      setModules(modRes.data || []);
    }).catch(err => console.error("Failed to load options:", err))
      .finally(() => setLoadingData(false));
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Tree Manipulation Methods ---
  const addSemester = () => {
    setTree([...tree, { ui_id: generateId(), semester_id: "", programs: [] }]);
  };
  const removeSem = (semId: string) => {
    setTree(tree.filter(s => s.ui_id !== semId));
  };
  const updateSem = (semId: string, val: number | "") => {
    setTree(tree.map(s => s.ui_id === semId ? { ...s, semester_id: val } : s));
  };

  const addProgram = (semId: string) => {
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: [...s.programs, { ui_id: generateId(), program_id: "", modules: [] }]
    } : s));
  };
  const removeProg = (semId: string, progId: string) => {
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.filter(p => p.ui_id !== progId)
    } : s));
  };
  const updateProg = (semId: string, progId: string, val: number | "") => {
    setTree(tree.map(s => s.ui_id === semId ? {
      ...s,
      programs: s.programs.map(p => p.ui_id === progId ? { ...p, program_id: val } : p)
    } : s));
  };

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
      programs: s.programs.map(p => p.ui_id === progId ? {
        ...p,
        modules: p.modules.filter(m => m.ui_id !== modId)
      } : p)
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

  // --- Helpers for Periods ---
  const getModulePeriod = (moduleId: number | "") => {
    if (!moduleId) return 0;
    const mod = modules.find(m => m.id === moduleId);
    return Number(mod?.subject_period) || 0;
  };

  const getProgramGrandTotal = (prog: UIProgram) => {
    return prog.modules.reduce((acc, mod) => acc + getModulePeriod(mod.atw_subject_module_id), 0);
  };

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
          prog.modules.forEach(mod => {
            if (!mod.atw_subject_module_id) return;
            // Prevent duplicate assignments
            const exists = groupsToSubmit.find(g => g.semester_id === sem.semester_id && g.program_id === prog.program_id && g.atw_subject_module_id === mod.atw_subject_module_id);
            if (!exists) {
              groupsToSubmit.push({
                semester_id: sem.semester_id,
                program_id: prog.program_id,
                atw_subject_module_id: mod.atw_subject_module_id,
                is_current: true,
                is_active: true
              });
            }
          });
        });
      });

      const submitData = {
        ...formData,
        groups: groupsToSubmit
      };

      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} subject`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Subject Information Form */}
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
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Ground Training, Flying Phase 1"
              required
            />
          </div>

          <div>
            <Label>Subject Code <span className="text-red-500">*</span></Label>
            <Input
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              placeholder="e.g. GT-01"
              required
            />
          </div>

          <div>
            <Label>Custom Slug (Optional)</Label>
            <Input
              value={formData.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              placeholder="Auto-generated if left blank"
            />
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
                    <th className="px-4 py-3 border border-black w-1/5 whitespace-nowrap">Semester</th>
                    <th className="px-4 py-3 border border-black w-1/5 whitespace-nowrap">Program</th>
                    <th className="px-4 py-3 border border-black w-2/5 whitespace-nowrap">Syllabus Module</th>
                    <th className="px-4 py-3 border border-black text-center whitespace-nowrap w-24">Total Period</th>
                    <th className="px-4 py-3 border border-black text-center whitespace-nowrap w-28">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900">
                  {tree.length === 0 && (
                    <tr>
                      <td colSpan={5} className="border border-black p-8 text-center text-gray-500 bg-gray-50">
                        No groupings added. Use the button below to add a semester.
                      </td>
                    </tr>
                  )}

                  {tree.map((sem, sIdx) => {
                    const semRowSpan = sem.programs.reduce((acc, p) => acc + (p.modules.length + 1), 0) + 1;

                    return (
                      <React.Fragment key={sIdx}>
                        {sem.programs.length > 0 ? (
                          sem.programs.map((prog, pIdx) => {
                            const progRowSpan = prog.modules.length + 1;
                            const isFirstProg = pIdx === 0;

                            return (
                              <React.Fragment key={prog.ui_id}>
                                {prog.modules.map((mod, mIdx) => {
                                  const isFirstMod = mIdx === 0;

                                  return (
                                    <tr key={mod.ui_id}>
                                      {isFirstProg && isFirstMod && (
                                        <td rowSpan={semRowSpan} className="border border-black p-3 align-top bg-white">
                                          <div className="flex items-center gap-2">
                                            <select className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 text-sm" value={sem.semester_id} onChange={(e) => updateSem(sem.ui_id, e.target.value ? Number(e.target.value) : "")}>
                                              <option value="">-- Select Semester --</option>
                                              {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                            </select>
                                            <button type="button" onClick={() => removeSem(sem.ui_id)} className="text-red-500 hover:text-red-700 p-2 border border-transparent hover:border-red-200 rounded hover:bg-red-50 transition-colors" title="Remove Module">
                                              <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                                            </button>
                                          </div>
                                        </td>
                                      )}
                                      {isFirstMod && (
                                        <td rowSpan={progRowSpan} className="border border-black p-3 align-top bg-white">
                                          <div className="flex items-center gap-2">
                                            <select className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 text-sm" value={prog.program_id} onChange={(e) => updateProg(sem.ui_id, prog.ui_id, e.target.value ? Number(e.target.value) : "")}>
                                              <option value="">-- Select Program --</option>
                                              {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                            </select>
                                            <button type="button" onClick={() => removeProg(sem.ui_id, prog.ui_id)} className="text-red-500 hover:text-red-700 p-2 border border-transparent hover:border-red-200 rounded hover:bg-red-50 transition-colors" title="Remove Module">
                                              <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                                            </button>
                                          </div>
                                        </td>
                                      )}
                                      <td className="border border-black p-2 align-top bg-white">
                                        <div className="flex items-center gap-2">
                                          <select className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 text-sm" value={mod.atw_subject_module_id} onChange={(e) => updateModule(sem.ui_id, prog.ui_id, mod.ui_id, e.target.value ? Number(e.target.value) : "")}>
                                            <option value="">-- Select Module --</option>
                                            {modules.map(m => <option key={m.id} value={m.id}>{m.subject_name} ({m.subject_code})</option>)}
                                          </select>
                                          <button type="button" onClick={() => removeModule(sem.ui_id, prog.ui_id, mod.ui_id)} className="text-red-500 hover:text-red-700 p-2 border border-transparent hover:border-red-200 rounded hover:bg-red-50 transition-colors" title="Remove Module">
                                            <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                                          </button>
                                        </div>
                                      </td>
                                      <td className="border border-black p-2 text-center align-middle font-medium bg-white">
                                        {getModulePeriod(mod.atw_subject_module_id) || '-'}
                                      </td>
                                      {isFirstMod && (
                                        <td rowSpan={progRowSpan} className="border border-black p-2 text-center align-middle font-bold text-lg bg-white">
                                          {getProgramGrandTotal(prog)}
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                                {/* ADD MODULE ROW */}
                                <tr>
                                  {isFirstProg && prog.modules.length === 0 && (
                                    <td rowSpan={semRowSpan} className="border border-black p-3 align-top bg-white">
                                      <select className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 text-sm" value={sem.semester_id} onChange={(e) => updateSem(sem.ui_id, e.target.value ? Number(e.target.value) : "")}>
                                        <option value="">-- Select Semester --</option>
                                        {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                      </select>
                                      <div className="flex gap-4 mt-3">
                                        <button type="button" onClick={() => removeSem(sem.ui_id)} className="text-sm text-red-600 hover:text-red-800 font-medium">Remove Sem</button>
                                      </div>
                                    </td>
                                  )}
                                  {prog.modules.length === 0 && (
                                    <td rowSpan={progRowSpan} className="border border-black p-3 align-top bg-white">
                                      <div className="flex items-center gap-2">
                                        <select className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 text-sm" value={prog.program_id} onChange={(e) => updateProg(sem.ui_id, prog.ui_id, e.target.value ? Number(e.target.value) : "")}>
                                          <option value="">-- Select Program --</option>
                                          {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                        </select>
                                        <button type="button" onClick={() => removeProg(sem.ui_id, prog.ui_id)} className="text-red-500 hover:text-red-700 p-2 border border-transparent hover:border-red-200 rounded hover:bg-red-50 transition-colors" title="Remove Module">
                                          <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                  <td className="border border-black p-3 align-middle bg-gray-50">
                                    <button type="button" onClick={() => addModule(sem.ui_id, prog.ui_id)} className="w-full py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium transition-colors">
                                      + Add Subject Module
                                    </button>
                                  </td>
                                  <td className="border border-black p-3 bg-gray-50"></td>
                                  {prog.modules.length === 0 && (
                                    <td rowSpan={progRowSpan} className="border border-black p-2 text-center align-middle font-bold text-lg bg-white">
                                      0
                                    </td>
                                  )}
                                </tr>
                              </React.Fragment>
                            );
                          })
                        ) : (
                          // Handle case where semester has no programs yet
                          <tr>
                            <td rowSpan={semRowSpan} className="border border-black p-3 align-top bg-white">
                              <div className="flex items-center gap-2">
                                <select className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 text-sm" value={sem.semester_id} onChange={(e) => updateSem(sem.ui_id, e.target.value ? Number(e.target.value) : "")}>
                                  <option value="">-- Select Semester --</option>
                                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                </select>
                                <button type="button" onClick={() => removeSem(sem.ui_id)} className="text-red-500 hover:text-red-700 p-2 border border-transparent hover:border-red-200 rounded hover:bg-red-50 transition-colors" title="Remove Module">
                                  <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                            <td colSpan={4} className="border border-black p-3 text-center text-gray-400 italic bg-gray-50">
                              No programs assigned. Use the "+ Add Program" button below.
                            </td>
                          </tr>
                        )}

                        {/* ADD PROGRAM ROW (Always show at the end of each semester) */}
                        <tr>
                          {/* Column 1 (Semester) is spanned by the previous rows */}
                          <td className="border border-black p-3 align-middle bg-gray-50">
                            <button type="button" onClick={() => addProgram(sem.ui_id)} className="w-full py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium transition-colors">
                              + Add Program
                            </button>
                          </td>
                          <td colSpan={3} className="border border-black p-3 bg-gray-50"></td>
                        </tr>
                      </React.Fragment>
                    );
                  })}

                  {/* Add Semester Row at the end */}
                  <tr>
                    <td className="border border-black p-3 align-middle bg-gray-50">
                      <button
                        type="button"
                        onClick={addSemester}
                        className="w-full py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium transition-colors"
                      >
                        + Add Semester
                      </button>
                    </td>
                    <td colSpan={4} className="border border-black p-3 bg-gray-50"></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex gap-8 border-t border-gray-100 pt-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_current}
              onChange={(e) => handleChange("is_current", e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="font-medium text-gray-900">Is Current</span>
          </label>
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
                <div className="text-sm text-gray-500 dark:text-gray-400">This subject will be available for use.</div>
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
                <div className="text-sm text-gray-500 dark:text-gray-400">This subject will be hidden from general use.</div>
              </div>
            </label>
          </div>
        </div>


        <div className="flex items-center justify-end gap-3 pt-6 pb-6 border-t border-gray-200 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 transition-colors"
            disabled={loading}
          >
            {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
            {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Subject" : "Save Subject")}
          </button>
        </div>
      </form>
    </div>
  );
}
