/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Icon } from "@iconify/react";
import type { AtwSubjectModule } from "@/libs/types/system";

interface SubjectFormProps {
  initialData?: AtwSubjectModule | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

interface SubjectMark {
  id?: number;
  name: string;
  type: string;
  percentage: number | string;
  estimate_mark: number | string;
}

export default function SubjectModuleForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: SubjectFormProps) {
  const [formData, setFormData] = useState({
    subject_name: "",
    subject_code: "",
    subject_legend: "",
    subject_period: "",
    subjects_full_mark: 100,
    subjects_credit: 0,
    is_active: true,
  });
  const [subjectMarks, setSubjectMarks] = useState<SubjectMark[]>([
    { name: "", type: "", percentage: '', estimate_mark: '' }
  ]);
  const [error, setError] = useState("");

  // Populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        subject_name: initialData.subject_name,
        subject_code: initialData.subject_code,
        subject_legend: initialData.subject_legend || "",
        subject_period: initialData.subject_period || "",
        subjects_full_mark: initialData.subjects_full_mark,
        subjects_credit: initialData.subjects_credit,
        is_active: initialData.is_active,
      });

      const marks = initialData.subject_marks || (initialData as any).subjectMarks;
      if (marks && marks.length > 0) {
        setSubjectMarks(marks.map((mark: any) => ({
          id: mark.id,
          name: mark.name,
          type: mark.type || "",
          percentage: mark.percentage,
          estimate_mark: mark.estimate_mark,
        })));
      }
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMarkChange = (index: number, field: keyof SubjectMark, value: any) => {
    setSubjectMarks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMarkRow = () => {
    setSubjectMarks(prev => [...prev, { name: "", type: "", percentage: 0, estimate_mark: 0 }]);
  };

  const removeMarkRow = (index: number) => {
    if (subjectMarks.length > 1) {
      setSubjectMarks(prev => prev.filter((_, i) => i !== index));
    }
  };

  const totalPercentage = subjectMarks.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
  const fullMark = Number(formData.subjects_full_mark) || 0;

  // Sample values for preview: estimate_mark - 1
  const previewSamples = useMemo(() => {
    return subjectMarks.map(m => {
      const est = Number(m.estimate_mark) || 0;
      return Math.max(0, est - 1);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectMarks.map(m => m.estimate_mark).join('-')]);

  // Auto-remove unfilled rows (percentage = 0) when total reaches full mark
  useEffect(() => {
    if (fullMark > 0 && totalPercentage >= fullMark) {
      setSubjectMarks(prev => {
        const filtered = prev.filter(m => Number(m.percentage) > 0);
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
        subject_marks: subjectMarks.filter(mark => mark.name.trim() !== ""),
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} subject module`);
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
            <Label>Subject Module Name <span className="text-red-500">*</span></Label>
            <Input value={formData.subject_name} onChange={(e) => handleChange("subject_name", e.target.value)} placeholder="Enter subject name" required />
          </div>
          <div>
            <Label>Subject Module Code <span className="text-red-500">*</span></Label>
            <Input value={formData.subject_code} onChange={(e) => handleChange("subject_code", e.target.value)} placeholder="Enter subject code" required />
          </div>
          <div>
            <Label>Subject Legend</Label>
            <Input value={formData.subject_legend} onChange={(e) => handleChange("subject_legend", e.target.value)} placeholder="Enter legend (optional)" />
          </div>
          <div>
            <Label>Subject Period</Label>
            <Input value={formData.subject_period} onChange={(e) => handleChange("subject_period", e.target.value)} placeholder="Enter period (optional)" />
          </div>
          <div>
            <Label>Full Mark <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              step={1}
              min="0"
              max="100"
              value={formData.subjects_full_mark}
              onChange={(e) => handleChange("subjects_full_mark", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Credit</Label>
            <Input type="number" step={1} value={formData.subjects_credit} onChange={(e) => handleChange("subjects_credit", parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </div>
        </div>

        {/* Live Preview — auto-updates as marks are filled */}
        {subjectMarks.some(m => m.name.trim() || Number(m.percentage) > 0) && (() => {
          const previewGroups = Object.values(
            subjectMarks
              .filter(m => m.name.trim() || Number(m.percentage) > 0)
              .reduce((acc, m, idx) => {
                const key = m.type || `__none_${idx}`;
                if (!acc[key]) acc[key] = { type: m.type, marks: [] as (SubjectMark & { _idx: number })[] };
                acc[key].marks.push({ ...m, _idx: idx });
                return acc;
              }, {} as Record<string, { type: string; marks: (SubjectMark & { _idx: number })[] }>)
          );

          const previewTotal = previewGroups.reduce((acc, group) =>
            acc + group.marks.reduce((gacc, m) => {
              const est = Number(m.estimate_mark) || 0;
              const pct = Number(m.percentage) || 0;
              const sample = previewSamples[m._idx] ?? 0;
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
                          colSpan={group.marks.reduce((acc, m) => acc + (Number(m.estimate_mark) !== Number(m.percentage) ? 2 : 1), 0)}
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
                            colSpan={Number(m.estimate_mark) !== Number(m.percentage) ? 2 : 1}
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
                          if (est !== pct) {
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
                  <th className="border border-black px-4 py-2 text-leftm font-semibold text-gray-900">Exam Mark</th>
                  <th className="border border-black px-4 py-2 text-left font-semibold text-gray-900">Mark Percentage</th>
                  <th className="border border-black px-4 py-2 text-center font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {subjectMarks.map((mark, index) => {
                  const otherTotal = subjectMarks.filter((_, i) => i !== index).reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
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
                        <select
                          value={mark.type}
                          onChange={(e) => handleMarkChange(index, "type", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">Select a Subject Type</option>
                          <option value="entrytest">Entry Test</option>
                          <option value="attendance">Attendence</option>
                          <option value="classtest">Class Test</option>
                          <option value="quiztest">Quiz Test</option>
                          <option value="assignment">Assignment</option>
                          <option value="presentation">Presentation</option>
                          <option value="viva">Viva</option>
                          <option value="note">Note</option>
                          <option value="experiment">Experiment</option>
                          <option value="midsemester">Mid Semester</option>
                          <option value="endsemester">End Semester</option>
                        </select>
                      </td>
                      <td className="border border-black px-2 py-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          value={mark.estimate_mark}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              handleMarkChange(index, "estimate_mark", "");
                              return;
                            }
                            if (/^\d*\.?\d*$/.test(val)) {
                              handleMarkChange(index, "estimate_mark", val);
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== "") {
                              const parsed = parseFloat(val);
                              if (!isNaN(parsed)) {
                                handleMarkChange(index, "estimate_mark", parsed);
                              } else {
                                handleMarkChange(index, "estimate_mark", "");
                              }
                            }
                          }}
                          placeholder="Enter Exam Mark"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="border border-black px-2 py-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          value={mark.percentage}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              handleMarkChange(index, "percentage", "");
                              return;
                            }
                            if (/^\d*\.?\d*$/.test(val)) {
                              const numVal = parseFloat(val);
                              if (!isNaN(numVal) && numVal > maxForRow) {
                                handleMarkChange(index, "percentage", maxForRow);
                              } else {
                                handleMarkChange(index, "percentage", val);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== "") {
                              const parsed = parseFloat(val);
                              if (!isNaN(parsed)) {
                                handleMarkChange(index, "percentage", parsed);
                              } else {
                                handleMarkChange(index, "percentage", "");
                              }
                            }
                          }}
                          placeholder={`Max ${maxForRow}`}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="border border-black px-2 py-2 text-center">
                        {subjectMarks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMarkRow(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remove"
                          >
                            <Icon icon="hugeicons:delete-02" className="w-5 h-5" />
                          </button>
                        )}
                        {subjectMarks.length === 1 && (
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
                  <span className="">Add at least one mark distribution for the subject module.</span>
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
              <div className="text-sm text-gray-500">This subject module will be available for use throughout the system.</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="radio" name="is_active" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="mt-1 w-4 h-4 text-blue-600 border-black focus:ring-blue-500" />
            <div>
              <div className="font-medium text-gray-900">Inactive:</div>
              <div className="text-sm text-gray-500">This subject module will be hidden from general use.</div>
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
            !formData.subject_name.trim() ||
            !formData.subject_code.trim() ||
            !formData.subject_legend.trim() ||
            fullMark === 0 ||
            totalPercentage !== fullMark
          }
        >
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Subject Module" : "Save Subject Module")}
        </button>
      </div>
    </form>
  );
}
