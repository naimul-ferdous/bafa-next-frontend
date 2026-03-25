/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import { Icon } from "@iconify/react";
import type { AtwSubjectsModuleMarksheet } from "@/libs/types/system";

interface MarksheetFormProps {
  initialData?: AtwSubjectsModuleMarksheet | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

interface MarkRow {
  id?: number;
  name: string;
  type: string;
  percentage: number | string;
  estimate_mark: number | string;
  is_active: boolean;
  is_combined: boolean;
  combined_indices: number[];
}

const MARK_TYPE_OPTIONS = [
  { value: "entrytest", label: "Entry Test" },
  { value: "attendance", label: "Attendance" },
  { value: "classtest", label: "Class Test" },
  { value: "quiztest", label: "Quiz Test" },
  { value: "assignment", label: "Assignment" },
  { value: "presentation", label: "Presentation" },
  { value: "viva", label: "Viva" },
  { value: "note", label: "Note" },
  { value: "experiment", label: "Experiment" },
  { value: "midsemester", label: "Mid Semester" },
  { value: "endsemester", label: "End Semester" },
  { value: "combined", label: "Combined" },
  { value: "performance", label: "Performance" },
];

export default function MarksheetForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: MarksheetFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    full_mark: 100,
    is_active: true,
  });
  const [marks, setMarks] = useState<MarkRow[]>([
    { name: "", type: "", percentage: '', estimate_mark: '', is_active: true, is_combined: false, combined_indices: [] }
  ]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      if (initialData.marks && initialData.marks.length > 0) {
        // Build ID → positional index map so combined_cols can be converted to combined_indices
        const idToIndex: Record<number, number> = {};
        initialData.marks.forEach((m: any, idx: number) => { idToIndex[m.id] = idx; });

        // Calculate full_mark: sum of percentages excluding rows referenced by combined marks
        const refMarkIds = new Set(
          initialData.marks.flatMap((m: any) =>
            m.is_combined && Array.isArray(m.combined_cols)
              ? m.combined_cols.map((c: any) => c.referenced_mark_id)
              : []
          )
        );
        const calculatedFullMark = initialData.marks.reduce((sum: number, m: any) => {
          if (refMarkIds.has(m.id)) return sum;
          return sum + (Number(m.percentage) || 0);
        }, 0);

        setFormData({
          name: initialData.name,
          code: initialData.code,
          full_mark: calculatedFullMark || 100,
          is_active: initialData.is_active,
        });

        setMarks(initialData.marks.map((m: any) => ({
          id: m.id,
          name: m.name,
          type: m.type || "",
          percentage: m.percentage,
          estimate_mark: m.estimate_mark,
          is_active: m.is_active,
          is_combined: m.is_combined ?? false,
          combined_indices: m.is_combined && Array.isArray(m.combined_cols)
            ? m.combined_cols
                .map((c: any) => idToIndex[c.referenced_mark_id])
                .filter((i: number) => i !== undefined)
            : [],
        })));
      } else {
        setFormData({
          name: initialData.name,
          code: initialData.code,
          full_mark: 100,
          is_active: initialData.is_active,
        });
      }
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMarkChange = (index: number, field: keyof MarkRow, value: any) => {
    setMarks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMarkRow = () => {
    setMarks(prev => [...prev, { name: "", type: "", percentage: '', estimate_mark: '', is_active: true, is_combined: false, combined_indices: [] }]);
  };

  const toggleCombinedIndex = (rowIndex: number, targetIndex: number) => {
    setMarks(prev => {
      const updated = [...prev];
      const current = updated[rowIndex].combined_indices;
      updated[rowIndex] = {
        ...updated[rowIndex],
        combined_indices: current.includes(targetIndex)
          ? current.filter(i => i !== targetIndex)
          : [...current, targetIndex],
      };
      return updated;
    });
  };

  const removeMarkRow = (index: number) => {
    if (marks.length > 1) {
      setMarks(prev => prev.filter((_, i) => i !== index));
    }
  };

  const fullMark = Number(formData.full_mark) || 0;

  // Indices that are referenced (checked) inside any combined row — excluded from total
  const referencedByCombined = useMemo(() => {
    const set = new Set<number>();
    marks.forEach(m => { if (m.is_combined) m.combined_indices.forEach(i => set.add(i)); });
    return set;
  }, [marks]);

  // Only count a row if it is NOT referenced by a combined row
  const totalPercentage = marks.reduce((sum, m, i) => {
    if (referencedByCombined.has(i)) return sum;
    return sum + (Number(m.percentage) || 0);
  }, 0);

  // Sample values for preview: for combined rows use percentage-1, otherwise estimate_mark-1
  const previewSamples = useMemo(() => {
    return marks.map(m => {
      if (m.is_combined) return Math.max(0, Number(m.percentage) - 1);
      return Math.max(0, (Number(m.estimate_mark) || 0) - 1);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marks.map(m => m.is_combined ? m.percentage : m.estimate_mark).join('-')]);

  // Auto-remove unfilled rows when total reaches full mark (skip referenced rows)
  useEffect(() => {
    if (fullMark > 0 && totalPercentage >= fullMark) {
      setMarks(prev => {
        const refSet = new Set<number>();
        prev.forEach(m => { if (m.is_combined) m.combined_indices.forEach(i => refSet.add(i)); });
        const filtered = prev.filter((m, i) => refSet.has(i) || Number(m.percentage) > 0);
        return filtered.length !== prev.length ? filtered : prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPercentage, fullMark]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const submitData = {
        ...formData,
        marks: marks
          .filter(m => m.name.trim() !== "")
          .map(m => ({
            ...m,
            percentage: parseFloat(String(m.percentage)) || 0,
            estimate_mark: parseFloat(String(m.estimate_mark)) || 0,
          })),
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} marksheet`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Marksheet Name <span className="text-red-500">*</span></Label>
            <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="e.g., Engineering Basic Marksheet" required />
          </div>
          <div>
            <Label>Marksheet Code <span className="text-red-500">*</span></Label>
            <Input value={formData.code} onChange={(e) => handleChange("code", e.target.value)} placeholder="e.g., ENG-BASIC-01" required />
          </div>
          <div>
            <Label>Full Mark <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              step={1}
              min="0"
              value={formData.full_mark}
              onChange={(e) => handleChange("full_mark", parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>

        {/* Live Preview */}
        {marks.some(m => m.name.trim() || Number(m.percentage) > 0) && (() => {
          // Indices referenced by combined rows — shown but excluded from Total
          const refSet = new Set(marks.flatMap((m, i) => m.is_combined ? m.combined_indices : []));

          // Show ALL marks that have content
          const visibleMarks = marks
            .map((m, idx) => ({ ...m, _idx: idx }))
            .filter(m => m.name.trim() || Number(m.percentage) > 0);

          const previewGroups = Object.values(
            visibleMarks.reduce((acc, m) => {
              const key = m.type || `__none_${m._idx}`;
              if (!acc[key]) acc[key] = { type: m.type, marks: [] as (MarkRow & { _idx: number })[] };
              acc[key].marks.push(m);
              return acc;
            }, {} as Record<string, { type: string; marks: (MarkRow & { _idx: number })[] }>)
          );

          // Total only counts non-referenced marks
          const previewTotal = previewGroups.reduce((acc, group) =>
            acc + group.marks.reduce((gacc, m) => {
              if (refSet.has(m._idx)) return gacc; // referenced — visible but not counted
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

        <div className="py-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Marks Distribution</Label>
            <span className={`text-sm font-medium ${totalPercentage > fullMark ? 'text-red-500' : totalPercentage === fullMark && fullMark > 0 ? 'text-green-600' : 'text-gray-500'}`}>
              {totalPercentage} / {fullMark} marks used
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full rounded-xl border-collapse">
              <thead>
                <tr>
                  <th className="border border-black px-4 py-2 text-left font-semibold text-gray-900">Sl.</th>
                  <th className="border border-black px-4 py-2 text-left font-semibold text-gray-900">Title</th>
                  <th className="border border-black px-4 py-2 text-left font-semibold text-gray-900">Select Type</th>
                  <th className="border border-black px-4 py-2 text-left font-semibold text-gray-900">Exam Mark</th>
                  <th className="border border-black px-4 py-2 text-left font-semibold text-gray-900">Mark Percentage</th>
                  <th className="border border-black px-4 py-2 text-center font-semibold text-gray-900">Combined</th>
                  <th className="border border-black px-4 py-2 text-center font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((mark, index) => {
                  const otherTotal = marks.reduce((sum, m, i) => {
                    if (i === index) return sum;
                    if (referencedByCombined.has(i)) return sum;
                    return sum + (Number(m.percentage) || 0);
                  }, 0);
                  const maxForRow = Math.max(0, fullMark - otherTotal);
                  return (
                    <tr key={index} className="bg-white">
                      <td className="border border-black px-4 py-2 text-center text-gray-900">{index + 1}</td>
                      <td className="border border-black px-2 py-2">
                        <input
                          type="text"
                          value={mark.name}
                          onChange={(e) => handleMarkChange(index, "name", e.target.value)}
                          placeholder="Enter Mark Title"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="border border-black px-2 py-2">
                        <SearchableSelect
                          options={MARK_TYPE_OPTIONS}
                          value={mark.type}
                          onChange={(val) => handleMarkChange(index, "type", val)}
                          placeholder="Select a Subject Type"
                          searchPlaceholder="Search type..."
                        />
                      </td>
                      {/* Exam Mark column */}
                      <td className="border border-black px-2 py-2">
                        {mark.is_combined ? (
                          <div className="space-y-1 min-w-[160px]">
                            {marks.map((m, i) => {
                              if (i === index || m.is_combined) return null;
                              return (
                                <label key={i} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={mark.combined_indices.includes(i)}
                                    onChange={() => toggleCombinedIndex(index, i)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span>{m.name || `Row ${i + 1}`}</span>
                                </label>
                              );
                            })}
                            {marks.filter((m, i) => i !== index && !m.is_combined).length === 0 && (
                              <span className="text-xs text-gray-400 italic">No rows available</span>
                            )}
                          </div>
                        ) : (
                          <input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*\.?[0-9]*"
                            value={mark.estimate_mark}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") { handleMarkChange(index, "estimate_mark", ""); return; }
                              if (/^\d*\.?\d*$/.test(val)) handleMarkChange(index, "estimate_mark", val);
                            }}
                            onBlur={(e) => {
                              const val = e.target.value;
                              if (val !== "") {
                                const parsed = parseFloat(val);
                                handleMarkChange(index, "estimate_mark", isNaN(parsed) ? "" : parsed);
                              }
                            }}
                            placeholder="Enter Exam Mark"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        )}
                      </td>
                      {/* Percentage / Total Mark column */}
                      <td className="border border-black px-2 py-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          value={mark.percentage}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") { handleMarkChange(index, "percentage", ""); return; }
                            if (/^\d*\.?\d*$/.test(val)) {
                              if (!mark.is_combined) {
                                const numVal = parseFloat(val);
                                if (!isNaN(numVal) && numVal > maxForRow) {
                                  handleMarkChange(index, "percentage", maxForRow);
                                  return;
                                }
                              }
                              handleMarkChange(index, "percentage", val);
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== "") {
                              const parsed = parseFloat(val);
                              handleMarkChange(index, "percentage", isNaN(parsed) ? "" : parsed);
                            }
                          }}
                          placeholder={mark.is_combined ? "Enter Total Mark" : `Max ${maxForRow}`}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="border border-black px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={mark.is_combined}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setMarks(prev => {
                              const updated = [...prev];
                              updated[index] = {
                                ...updated[index],
                                is_combined: checked,
                                estimate_mark: checked ? "" : updated[index].estimate_mark,
                                combined_indices: checked ? updated[index].combined_indices : [],
                              };
                              return updated;
                            });
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-black px-2 py-2 text-center">
                        {marks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMarkRow(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remove"
                          >
                            <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                          </button>
                        )}
                        {marks.length === 1 && (
                          <button
                            type="button"
                            onClick={addMarkRow}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Add"
                          >
                            <Icon icon="hugeicons:add-circle" className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {totalPercentage < fullMark && fullMark > 0 && (
              <div className="mt-2 rounded border border-dashed border-gray-200 p-4">
                <div className="flex flex-col items-center justify-center h-12 text-gray-500 cursor-pointer" onClick={() => addMarkRow()}>
                  <Icon icon="hugeicons:add-circle" className="w-8 h-8 mr-2" />
                  <span className="">Add at least one mark distribution for the marksheet.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="py-4">
        <Label className="mb-3">Status</Label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="radio" name="is_active" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="mt-1 w-4 h-4 text-blue-600 border-black focus:ring-blue-500" />
            <div>
              <div className="font-medium text-gray-900">Active:</div>
              <div className="text-sm text-gray-500">This marksheet will be available for use throughout the system.</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-black focus:ring-blue-500" />
            <div>
              <div className="font-medium text-gray-900">Inactive:</div>
              <div className="text-sm text-gray-500">This marksheet will be hidden from general use.</div>
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-black text-black rounded-xl hover:bg-gray-50" disabled={loading}>
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={
            loading ||
            !formData.name.trim() ||
            !formData.code.trim() ||
            fullMark === 0 ||
            totalPercentage !== fullMark
          }
        >
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Marksheet" : "Save Marksheet")}
        </button>
      </div>
    </form>
  );
}
