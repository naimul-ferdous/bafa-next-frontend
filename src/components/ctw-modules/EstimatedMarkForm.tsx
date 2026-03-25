/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { commonService } from "@/libs/services/commonService";
import type {
  CtwResultsModuleEstimatedMark,
  CtwResultsModuleEstimatedMarkDetail,
  CtwResultsModuleEstimatedMarkDetailScore
} from "@/libs/types/ctw";
import type { SystemSemester, SystemExam } from "@/libs/types/system";

interface EstimatedMarkFormProps {
  initialData?: CtwResultsModuleEstimatedMark | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
}

export default function EstimatedMarkForm({ initialData, onSubmit, onCancel, loading, isEdit = false }: EstimatedMarkFormProps) {
  const [formData, setFormData] = useState({
    semester_id: 0,
    exam_type_id: 0,
    practice_count: "" as string | number,
    convert_of_practice: "" as string | number,
    convert_of_exam: "" as string | number,
    estimated_mark_per_instructor: "" as string | number,
    conversation_mark: "" as string | number,
    is_active: true,
    details: [] as CtwResultsModuleEstimatedMarkDetail[],
  });

  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [exams, setExams] = useState<SystemExam[]>([]);

  const [hasPractice, setHasPractice] = useState(false);
  const [hasConfigure, setHasConfigure] = useState(false);
  const [hasScoresMap, setHasScoresMap] = useState<boolean[]>([]);

  type DetailOptions = { gender: 'male' | 'female' | 'both'; showQuantity: boolean; showMark: boolean };
  const defaultDetailOptions: DetailOptions = { gender: 'both', showQuantity: false, showMark: false };
  const [detailOptionsMap, setDetailOptionsMap] = useState<DetailOptions[]>([]);

  type ScoreOptions = { gender: 'male' | 'female' | 'both'; showQty: boolean; showTime: boolean; showMark: boolean };
  const defaultScoreOptions: ScoreOptions = { gender: 'both', showQty: false, showTime: false, showMark: false };
  const [scoreOptionsMap, setScoreOptionsMap] = useState<ScoreOptions[]>([]);
  const [fetchingOptions, setFetchingOptions] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setFetchingOptions(true);
        const options = await commonService.getResultOptions();

        if (options) {
          setSemesters(options.semesters || []);
          setExams(options.exams || []);
        }
      } catch (err) {
        console.error("Failed to fetch form options:", err);
        setError("Failed to load form options. Please refresh the page.");
      } finally {
        setFetchingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    if (initialData) {
      const hasPracticeData = !!(initialData.practice_count || initialData.convert_of_practice || initialData.convert_of_exam);
      setHasPractice(hasPracticeData);
      setHasConfigure(!!(initialData.details && initialData.details.length > 0));
      setHasScoresMap((initialData.details || []).map(d => !!(d.scores && d.scores.length > 0)));
      setDetailOptionsMap((initialData.details || []).map(() => ({ ...defaultDetailOptions })));
      setScoreOptionsMap((initialData.details || []).map(() => ({ ...defaultScoreOptions })));
      setFormData({
        semester_id: initialData.semester_id,
        exam_type_id: initialData.exam_type_id,
        practice_count: initialData.practice_count ?? "",
        convert_of_practice: initialData.convert_of_practice ?? "",
        convert_of_exam: initialData.convert_of_exam ?? "",
        estimated_mark_per_instructor: initialData.estimated_mark_per_instructor ?? "",
        conversation_mark: initialData.conversation_mark ?? "",
        is_active: initialData.is_active !== false,
        details: initialData.details || [],
      });
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailChange = (index: number, field: keyof CtwResultsModuleEstimatedMarkDetail, value: any) => {
    const updatedDetails = [...formData.details];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setFormData(prev => ({ ...prev, details: updatedDetails }));
  };

  const addDetailRow = () => {
    setFormData(prev => ({
      ...prev,
      details: [...prev.details, { name: "", male_quantity: "" as any, female_quantity: "" as any, male_marks: "" as any, female_marks: "" as any, scores: [] }]
    }));
    setHasScoresMap(prev => [...prev, false]);
    setDetailOptionsMap(prev => [...prev, { ...defaultDetailOptions }]);
    setScoreOptionsMap(prev => [...prev, { ...defaultScoreOptions }]);
  };

  const removeDetailRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
    setHasScoresMap(prev => prev.filter((_, i) => i !== index));
    setDetailOptionsMap(prev => prev.filter((_, i) => i !== index));
    setScoreOptionsMap(prev => prev.filter((_, i) => i !== index));
  };

  const setScoreOption = <K extends keyof ScoreOptions>(index: number, key: K, value: ScoreOptions[K]) => {
    setScoreOptionsMap(prev => prev.map((opt, i) => i === index ? { ...opt, [key]: value } : opt));
  };

  const setDetailOption = <K extends keyof DetailOptions>(index: number, key: K, value: DetailOptions[K]) => {
    setDetailOptionsMap(prev => prev.map((opt, i) => i === index ? { ...opt, [key]: value } : opt));
  };

  const toggleHasScores = (index: number, checked: boolean) => {
    setHasScoresMap(prev => prev.map((v, i) => i === index ? checked : v));
    if (!checked) {
      const updatedDetails = [...formData.details];
      updatedDetails[index] = { ...updatedDetails[index], scores: [] };
      setFormData(prev => ({ ...prev, details: updatedDetails }));
    }
  };

  const handleScoreChange = (detailIndex: number, scoreIndex: number, field: keyof CtwResultsModuleEstimatedMarkDetailScore, value: any) => {
    const updatedDetails = [...formData.details];
    const updatedScores = [...(updatedDetails[detailIndex].scores || [])];
    updatedScores[scoreIndex] = { ...updatedScores[scoreIndex], [field]: value };
    updatedDetails[detailIndex] = { ...updatedDetails[detailIndex], scores: updatedScores };
    setFormData(prev => ({ ...prev, details: updatedDetails }));
  };

  const addScoreRow = (detailIndex: number) => {
    const updatedDetails = [...formData.details];
    const currentScores = updatedDetails[detailIndex].scores || [];
    updatedDetails[detailIndex] = {
      ...updatedDetails[detailIndex],
      scores: [...currentScores, { male_quantity: "" as any, male_time: "", male_mark: "" as any, female_quantity: "" as any, female_time: "", female_mark: "" as any, sort: currentScores.length }]
    };
    setFormData(prev => ({ ...prev, details: updatedDetails }));
  };

  const removeScoreRow = (detailIndex: number, scoreIndex: number) => {
    const updatedDetails = [...formData.details];
    updatedDetails[detailIndex] = {
      ...updatedDetails[detailIndex],
      scores: (updatedDetails[detailIndex].scores || []).filter((_, i) => i !== scoreIndex)
    };
    setFormData(prev => ({ ...prev, details: updatedDetails }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await onSubmit({ ...formData });
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? "update" : "create"} estimated mark`);
    }
  };

  if (fetchingOptions) {
    return (
      <div className="w-full min-h-[20vh] flex items-center justify-center">
        <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <Icon icon="hugeicons:alert-circle" className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div>
            <Label>Semester <span className="text-red-500">*</span></Label>
            <select
              value={formData.semester_id}
              onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Select Semester</option>
              {semesters.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Exam Type <span className="text-red-500">*</span></Label>
            <select
              value={formData.exam_type_id}
              onChange={(e) => handleChange("exam_type_id", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Select Exam Type</option>
              {exams.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-full">
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={hasPractice}
                onChange={(e) => {
                  setHasPractice(e.target.checked);
                  if (!e.target.checked) {
                    handleChange("practice_count", "");
                    handleChange("convert_of_practice", "");
                    handleChange("convert_of_exam", "");
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900">Are you want Practices?</span>
            </label>
          </div>

          {hasPractice && (
            <>
              <div>
                <Label>Practice Count (Optional)</Label>
                <Input type="number" value={formData.practice_count} onChange={(e) => handleChange("practice_count", e.target.value === "" ? "" : parseInt(e.target.value))} placeholder="Enter count" />
              </div>
              <div>
                <Label>Convert of Practice % (Optional)</Label>
                <Input type="number" step={1} value={formData.convert_of_practice} onChange={(e) => handleChange("convert_of_practice", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="Enter %" />
              </div>
              <div>
                <Label>Convert of Exam % (Optional)</Label>
                <Input type="number" step={1} value={formData.convert_of_exam} onChange={(e) => handleChange("convert_of_exam", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="Enter %" />
              </div>
            </>
          )}

          <div>
            <Label>Total Mark Per Instructor (Optional)</Label>
            <Input type="number" step={1} value={formData.estimated_mark_per_instructor} onChange={(e) => handleChange("estimated_mark_per_instructor", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="Enter mark" />
          </div>
          <div>
            <Label>Total Conversation Mark (Optional)</Label>
            <Input type="number" step={1} value={formData.conversation_mark} onChange={(e) => handleChange("conversation_mark", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="Enter mark" />
          </div>
        </div>

        <div className="">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConfigure}
                  onChange={(e) => {
                    setHasConfigure(e.target.checked);
                    if (!e.target.checked) {
                      setFormData(prev => ({ ...prev, details: [] }));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Are you want Configure?</span>
              </label>
            </div>
            {hasConfigure && (
              <button
                type="button"
                onClick={addDetailRow}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 flex items-center gap-1 font-semibold"
              >
                <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                Add Row
              </button>
            )}
          </div>

          {hasConfigure && <div className="space-y-4">
            {formData.details.map((detail, index) => (
              <div key={index} className="p-4 rounded-lg border border-dashed border-gray-200 relative">
                <button
                  type="button"
                  onClick={() => removeDetailRow(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                >
                  <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <Label>Detail Name</Label>
                    <Input
                      value={detail.name}
                      onChange={(e) => handleDetailChange(index, "name", e.target.value)}
                      placeholder="e.g. Practical, Theory"
                    />
                  </div>
                </div>

                {/* Field visibility controls */}
                <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  {(['male', 'female', 'both'] as const).map((g) => (
                    <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={detailOptionsMap[index]?.gender === g}
                        onChange={() => setDetailOption(index, 'gender', g)}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700 capitalize">{g}</span>
                    </label>
                  ))}
                  <div className="w-px h-4 bg-gray-300" />
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!detailOptionsMap[index]?.showQuantity}
                      onChange={(e) => setDetailOption(index, 'showQuantity', e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Quantity</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!detailOptionsMap[index]?.showMark}
                      onChange={(e) => setDetailOption(index, 'showMark', e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Mark</span>
                  </label>
                </div>

                {(detailOptionsMap[index]?.showQuantity || detailOptionsMap[index]?.showMark) && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {detailOptionsMap[index]?.showQuantity && (detailOptionsMap[index]?.gender === 'male' || detailOptionsMap[index]?.gender === 'both') && (
                  <div>
                    <Label>Male Quantity</Label>
                    <Input
                      type="number"
                      value={detail.male_quantity}
                      onChange={(e) => handleDetailChange(index, "male_quantity", e.target.value === "" ? "" : parseInt(e.target.value))}
                      placeholder="Male Qty"
                    />
                  </div>
                  )}
                  {detailOptionsMap[index]?.showQuantity && (detailOptionsMap[index]?.gender === 'female' || detailOptionsMap[index]?.gender === 'both') && (
                  <div>
                    <Label>Female Quantity</Label>
                    <Input
                      type="number"
                      value={detail.female_quantity}
                      onChange={(e) => handleDetailChange(index, "female_quantity", e.target.value === "" ? "" : parseInt(e.target.value))}
                      placeholder="Female Qty"
                    />
                  </div>
                  )}
                  {detailOptionsMap[index]?.showMark && (detailOptionsMap[index]?.gender === 'male' || detailOptionsMap[index]?.gender === 'both') && (
                  <div>
                    <Label>Male Marks</Label>
                    <Input
                      type="number"
                      step={1}
                      value={detail.male_marks}
                      onChange={(e) => handleDetailChange(index, "male_marks", e.target.value === "" ? "" : parseFloat(e.target.value))}
                      placeholder="Male Marks"
                    />
                  </div>
                  )}
                  {detailOptionsMap[index]?.showMark && (detailOptionsMap[index]?.gender === 'female' || detailOptionsMap[index]?.gender === 'both') && (
                  <div>
                    <Label>Female Marks</Label>
                    <Input
                      type="number"
                      step={1}
                      value={detail.female_marks}
                      onChange={(e) => handleDetailChange(index, "female_marks", e.target.value === "" ? "" : parseFloat(e.target.value))}
                      placeholder="Female Marks"
                    />
                  </div>
                  )}
                </div>
                )}

                {/* Scores Section */}
                <div className="border-t border-gray-300 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-bold text-gray-700">Scores</h4>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!hasScoresMap[index]}
                          onChange={(e) => toggleHasScores(index, e.target.checked)}
                          className="w-3.5 h-3.5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-xs font-medium text-gray-600">Are you want Scores?</span>
                      </label>
                    </div>
                    {hasScoresMap[index] && (
                      <button
                        type="button"
                        onClick={() => addScoreRow(index)}
                        className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-lg border border-green-200 hover:bg-green-100 flex items-center gap-1 font-semibold"
                      >
                        <Icon icon="hugeicons:add-circle" className="w-3 h-3" />
                        Add Score
                      </button>
                    )}
                  </div>

                  {hasScoresMap[index] && (
                    <>
                    {/* Score field visibility controls */}
                    <div className="flex flex-wrap items-center gap-4 mb-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                      {(['male', 'female', 'both'] as const).map((g) => (
                        <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={scoreOptionsMap[index]?.gender === g}
                            onChange={() => setScoreOption(index, 'gender', g)}
                            className="w-3.5 h-3.5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-xs font-medium text-gray-700 capitalize">{g}</span>
                        </label>
                      ))}
                      <div className="w-px h-4 bg-gray-300" />
                      {([['showQty', 'Qty'], ['showTime', 'Time'], ['showMark', 'Mark']] as const).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!scoreOptionsMap[index]?.[key]}
                            onChange={(e) => setScoreOption(index, key, e.target.checked)}
                            className="w-3.5 h-3.5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-xs font-medium text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="space-y-3 px-4">
                      {(detail.scores || []).map((score, scoreIndex) => (
                        <div key={scoreIndex} className="p-3 bg-white rounded-lg border border-gray-200 relative">
                          <button
                            type="button"
                            onClick={() => removeScoreRow(index, scoreIndex)}
                            className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1"
                          >
                            <Icon icon="hugeicons:delete-02" className="w-3.5 h-3.5" />
                          </button>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
                            {scoreOptionsMap[index]?.showQty && (scoreOptionsMap[index]?.gender === 'male' || scoreOptionsMap[index]?.gender === 'both') && (
                            <div>
                              <Label>Male Qty</Label>
                              <Input
                                type="number"
                                value={score.male_quantity}
                                onChange={(e) => handleScoreChange(index, scoreIndex, "male_quantity", e.target.value === "" ? "" : parseInt(e.target.value))}
                                placeholder="Male Qty"
                              />
                            </div>
                            )}
                            {scoreOptionsMap[index]?.showTime && (scoreOptionsMap[index]?.gender === 'male' || scoreOptionsMap[index]?.gender === 'both') && (
                            <div>
                              <Label>Male Time</Label>
                              <Input
                                value={score.male_time}
                                onChange={(e) => handleScoreChange(index, scoreIndex, "male_time", e.target.value)}
                                placeholder="e.g. 10:30"
                              />
                            </div>
                            )}
                            {scoreOptionsMap[index]?.showMark && (scoreOptionsMap[index]?.gender === 'male' || scoreOptionsMap[index]?.gender === 'both') && (
                            <div>
                              <Label>Male Mark</Label>
                              <Input
                                type="number"
                                step={1}
                                value={score.male_mark}
                                onChange={(e) => handleScoreChange(index, scoreIndex, "male_mark", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                placeholder="Male Mark"
                              />
                            </div>
                            )}
                            {scoreOptionsMap[index]?.showQty && (scoreOptionsMap[index]?.gender === 'female' || scoreOptionsMap[index]?.gender === 'both') && (
                            <div>
                              <Label>Female Qty</Label>
                              <Input
                                type="number"
                                value={score.female_quantity}
                                onChange={(e) => handleScoreChange(index, scoreIndex, "female_quantity", e.target.value === "" ? "" : parseInt(e.target.value))}
                                placeholder="Female Qty"
                              />
                            </div>
                            )}
                            {scoreOptionsMap[index]?.showTime && (scoreOptionsMap[index]?.gender === 'female' || scoreOptionsMap[index]?.gender === 'both') && (
                            <div>
                              <Label>Female Time</Label>
                              <Input
                                value={score.female_time}
                                onChange={(e) => handleScoreChange(index, scoreIndex, "female_time", e.target.value)}
                                placeholder="e.g. 10:30"
                              />
                            </div>
                            )}
                            {scoreOptionsMap[index]?.showMark && (scoreOptionsMap[index]?.gender === 'female' || scoreOptionsMap[index]?.gender === 'both') && (
                            <div>
                              <Label>Female Mark</Label>
                              <Input
                                type="number"
                                step={1}
                                value={score.female_mark}
                                onChange={(e) => handleScoreChange(index, scoreIndex, "female_mark", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                placeholder="Female Mark"
                              />
                            </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!detail.scores || detail.scores.length === 0) && (
                        <div className="text-center py-4 text-gray-400 italic text-sm border border-dashed border-gray-200 rounded-lg">
                          No scores added yet.
                        </div>
                      )}
                    </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {formData.details.length === 0 && (
              <div className="text-center py-8 text-gray-500 italic border-2 border-dashed border-gray-200 rounded-lg">
                No details added yet. Click &quot;Add Row&quot; to start configuring.
              </div>
            )}
          </div>}
        </div>

        <div>
          <Label className="mb-3">Status</Label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="is_active_mark" checked={formData.is_active === true} onChange={() => handleChange("is_active", true)} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
              <span className="text-sm font-medium text-gray-900">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="is_active_mark" checked={formData.is_active === false} onChange={() => handleChange("is_active", false)} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
              <span className="text-sm font-medium text-gray-900">Inactive</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-black rounded-xl hover:bg-gray-50" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2" disabled={loading}>
          {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update Mark" : "Save Mark")}
        </button>
      </div>
    </form>
  );
}
