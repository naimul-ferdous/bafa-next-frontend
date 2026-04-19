"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnGroundSyllabusService } from "@/libs/services/ftw12sqnGroundSyllabusService";
import { ftw12sqnFlyingPhaseTypeService } from "@/libs/services/ftw12sqnFlyingPhaseTypeService";
import { ftw12sqnSyllabusSignatureService, Ftw12sqnSyllabusSignature } from "@/libs/services/ftw12sqnSyllabusSignatureService";
import { userService } from "@/libs/services/userService";
import type { User } from "@/libs/types/user";
import FullLogo from "@/components/ui/fulllogo";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Modal } from "@/components/ui/modal";
import DatePicker from "@/components/form/input/DatePicker";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import RichTextEditor from "@/components/common/RichTextEditor";
import type {
  Ftw12sqnGroundSyllabus,
  Ftw12sqnGroundSyllabusSimulatorPhase,
  Ftw12sqnGroundSyllabusExercise,
  Ftw12sqnFlyingPhaseType,
} from "@/libs/types/ftw12sqnFlying";

interface FlatExercise extends Ftw12sqnGroundSyllabusExercise {
  typeCode: string;
  phaseId: number;
}

const formatHoursToHHMM = (hours: number | string | null | undefined): string => {
  if (hours === null || hours === undefined) return "—";
  const n = typeof hours === "string" ? parseFloat(hours) : hours;
  if (isNaN(n) || n === 0) return "—";
  const totalMinutes = Math.round(n * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
};

const parseTimeToMinutes = (s: string): number => {
  if (!s?.trim()) return 0;
  const c = s.replace(".", ":");
  if (c.includes(":")) {
    const [h, m] = c.split(":");
    return (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n * 60);
};

const minutesToTimeString = (m: number): string =>
  m <= 0 ? "0:00" : `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, "0")}`;

export default function SimulatorGroundSyllabusDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [syllabus, setSyllabus] = useState<Ftw12sqnGroundSyllabus | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Exercise edit modal ───────────────────────────────────────────────────
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<FlatExercise | null>(null);
  const [exerciseSaving, setExerciseSaving] = useState(false);
  const [exerciseError, setExerciseError] = useState("");
  const [phaseTypes, setPhaseTypes] = useState<Ftw12sqnFlyingPhaseType[]>([]);
  const [phaseTypesLoading, setPhaseTypesLoading] = useState(false);
  const [exForm, setExForm] = useState({
    phase_type_id: null as number | null,
    exercise_name: "",
    exercise_shortname: "",
    exercise_content: "",
    exercise_remarks: "",
    take_time_hours: 0,
    exercise_sort: 0,
    is_active: true,
  });
  const [timeInput, setTimeInput] = useState("0:00");

  // ── Signature state ───────────────────────────────────────────────────────
  const [signatures, setSignatures] = useState<Ftw12sqnSyllabusSignature[]>([]);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureFormLoading, setSignatureFormLoading] = useState(false);
  const [signatureFormUserId, setSignatureFormUserId] = useState<number | "">("");
  const [signatureFormDate, setSignatureFormDate] = useState("");
  const [editingSignature, setEditingSignature] = useState<Ftw12sqnSyllabusSignature | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [deleteSignatureId, setDeleteSignatureId] = useState<number | null>(null);
  const [deleteSignatureLoading, setDeleteSignatureLoading] = useState(false);

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadSyllabus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ftw12sqnGroundSyllabusService.get(id, { include_inactive: true });
      setSyllabus(data);
    } catch (err) {
      console.error("Failed to load syllabus:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadSignatures = useCallback(async () => {
    try {
      const data = await ftw12sqnSyllabusSignatureService.getAll({ type: "simulator_details" });
      setSignatures(data.data);
    } catch (err) {
      console.error("Failed to load signatures:", err);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await userService.getAllUsers({ per_page: 100 });
      setUsers(data.data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    loadSyllabus();
    loadSignatures();
    loadUsers();
  }, [id, loadSyllabus, loadSignatures, loadUsers]);

  // Load phase types once
  useEffect(() => {
    setPhaseTypesLoading(true);
    ftw12sqnFlyingPhaseTypeService.getList()
      .then(setPhaseTypes)
      .finally(() => setPhaseTypesLoading(false));
  }, []);

  // ── Exercise modal handlers ───────────────────────────────────────────────
  const openExerciseModal = (ex: FlatExercise) => {
    setEditingExercise(ex);
    const decHours = parseFloat(String(ex.take_time_hours || 0));
    const mins = Math.round(decHours * 60);
    setExForm({
      phase_type_id: ex.phase_type_id ?? null,
      exercise_name: ex.exercise_name,
      exercise_shortname: ex.exercise_shortname,
      exercise_content: ex.exercise_content || "",
      exercise_remarks: ex.exercise_remarks || "",
      take_time_hours: decHours,
      exercise_sort: ex.exercise_sort,
      is_active: ex.is_active !== false,
    });
    setTimeInput(minutesToTimeString(mins));
    setExerciseError("");
    setExerciseModalOpen(true);
  };

  const closeExerciseModal = () => {
    setExerciseModalOpen(false);
    setEditingExercise(null);
    setExerciseError("");
  };

  const handleTimeBlur = () => {
    const mins = parseTimeToMinutes(timeInput);
    setExForm(prev => ({ ...prev, take_time_hours: Math.round((mins / 60) * 100) / 100 }));
    setTimeInput(minutesToTimeString(mins));
  };

  const handleExerciseSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise || !syllabus) return;
    setExerciseError("");
    setExerciseSaving(true);

    try {
      // Build simulator_phases payload with updated exercise
      const simulator_phases = (syllabus.simulator_phases || []).map(phase => ({
        id: phase.id,
        phase_full_name: phase.phase_full_name,
        phase_shortname: phase.phase_shortname,
        phase_symbol: phase.phase_symbol ?? undefined,
        phase_sort: phase.phase_sort,
        flying_type_id: phase.flying_type_id ?? null,
        is_active: phase.is_active,
        exercises: (phase.exercises || []).map(ex => ({
          id: ex.id,
          exercise_name: ex.id === editingExercise.id ? exForm.exercise_name : ex.exercise_name,
          exercise_shortname: ex.id === editingExercise.id ? exForm.exercise_shortname : ex.exercise_shortname,
          exercise_content: ex.id === editingExercise.id ? exForm.exercise_content || undefined : ex.exercise_content ?? undefined,
          exercise_remarks: ex.id === editingExercise.id ? exForm.exercise_remarks || undefined : ex.exercise_remarks ?? undefined,
          exercise_sort: ex.id === editingExercise.id ? exForm.exercise_sort : ex.exercise_sort,
          take_time_hours: ex.id === editingExercise.id ? exForm.take_time_hours : parseFloat(String(ex.take_time_hours || 0)),
          phase_type_id: ex.id === editingExercise.id ? exForm.phase_type_id ?? undefined : ex.phase_type_id ?? undefined,
          is_active: ex.id === editingExercise.id ? exForm.is_active : ex.is_active,
        })),
      }));

      await ftw12sqnGroundSyllabusService.update(id, {
        ground_full_name: syllabus.ground_full_name,
        ground_shortname: syllabus.ground_shortname,
        ground_symbol: syllabus.ground_symbol ?? undefined,
        ground_sort: syllabus.ground_sort,
        no_of_test: syllabus.no_of_test,
        highest_mark: Number(syllabus.highest_mark),
        semester_id: syllabus.semester_id,
        is_active: syllabus.is_active,
        is_flying: syllabus.is_flying,
        exercises: [],
        simulator_phases,
      });

      closeExerciseModal();
      await loadSyllabus();
    } catch (err: any) {
      setExerciseError(err?.response?.data?.message || "Failed to save exercise");
    } finally {
      setExerciseSaving(false);
    }
  };

  // ── Signature handlers ────────────────────────────────────────────────────
  const handleOpenSignatureModal = (sig?: Ftw12sqnSyllabusSignature) => {
    setEditingSignature(sig || null);
    setSignatureFormUserId(sig ? sig.user_id : "");
    setSignatureFormDate(sig?.approved_date ? new Date(sig.approved_date).toLocaleDateString("en-GB") : "");
    setSignatureModalOpen(true);
  };

  const handleCloseSignatureModal = () => {
    setSignatureModalOpen(false);
    setSignatureFormUserId("");
    setSignatureFormDate("");
    setEditingSignature(null);
  };

  const handleSaveSignature = async () => {
    if (!signatureFormUserId || !signatureFormDate) return;
    setSignatureFormLoading(true);
    try {
      const [day, month, year] = signatureFormDate.split("/");
      const apiDate = `${year}-${month}-${day}`;
      if (editingSignature) {
        await ftw12sqnSyllabusSignatureService.update(editingSignature.id, {
          user_id: Number(signatureFormUserId),
          approved_date: apiDate,
        });
      } else {
        await ftw12sqnSyllabusSignatureService.create({
          user_id: Number(signatureFormUserId),
          type: "simulator_details",
          approved_date: apiDate,
        });
      }
      handleCloseSignatureModal();
      await loadSignatures();
    } catch (err) {
      console.error("Failed to save signature:", err);
    } finally {
      setSignatureFormLoading(false);
    }
  };

  const handleToggleSignatureStatus = async (sig: Ftw12sqnSyllabusSignature) => {
    await ftw12sqnSyllabusSignatureService.toggleStatus(sig.id);
    await loadSignatures();
  };

  const handleDeleteSignature = async () => {
    if (!deleteSignatureId) return;
    setDeleteSignatureLoading(true);
    await ftw12sqnSyllabusSignatureService.remove(deleteSignatureId);
    setDeleteSignatureId(null);
    await loadSignatures();
    setDeleteSignatureLoading(false);
  };

  if (loading) {
    return (
      <div className="w-full min-h-[40vh] flex items-center justify-center">
        <Icon icon="hugeicons:fan-01" className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!syllabus) {
    return (
      <div className="bg-white p-12 text-center rounded-lg border border-dashed border-gray-300">
        <Icon icon="hugeicons:alert-circle" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Syllabus Not Found</h3>
        <button onClick={() => router.push("/ftw/12sqn/results/ground/syllabus")}
          className="mt-4 text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" /> Back to List
        </button>
      </div>
    );
  }

  const sortedPhases: Ftw12sqnGroundSyllabusSimulatorPhase[] = [...(syllabus.simulator_phases || [])]
    .sort((a, b) => a.phase_sort - b.phase_sort);

  let documentProgMinutes = 0;

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      <style>{`
        @media print {
          @page { size: A3 portrait; margin: 15mm 12mm; }
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-no-border { border: none !important; }
          table { border-collapse: collapse !important; }
          tr { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>

      {/* Action Bar */}
      <div className="p-4 flex items-center justify-between no-print">
        <button onClick={() => router.push(`/ftw/12sqn/results/ground/syllabus/${id}`)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" /> Back to Summary
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Icon icon="hugeicons:printer" className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Document Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase underline">
            Basic Flying Training Syllabus: G 120TP AC
          </h2>
          <h2 className="text-md font-semibold text-gray-700 uppercase underline">12 SQN BAF</h2>
        </div>

        {/* Single table — all phases + exercises */}
        {sortedPhases.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic">No simulator phases found.</div>
        ) : (
          <div className="overflow-x-auto border border-black rounded-lg">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="border-b border-black">
                  <th className="px-1 py-2 text-center font-bold text-black border-r border-black w-[4%]">SL</th>
                  <th className="px-2 py-2 text-left font-bold text-black border-r border-black w-[17%]">Exercise</th>
                  <th className="px-2 py-2 text-left font-bold text-black border-r border-black w-[27%]">Content</th>
                  <th className="px-1 py-2 text-center font-bold text-black border-r border-black w-[8%]">Dual</th>
                  <th className="px-1 py-2 text-center font-bold text-black border-r border-black w-[8%]">Solo</th>
                  <th className="px-1 py-2 text-center font-bold text-black border-r border-black w-[10%]">Prog Total</th>
                  <th className="px-2 py-2 text-left font-bold text-black border-r border-black w-[20%]">Remarks</th>
                  <th className="px-1 py-2 text-center font-bold text-black w-[6%] no-print">Edit</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let sl = 0;
                  return sortedPhases.flatMap(phase =>
                    [...(phase.exercises || [])]
                      .map(ex => ({
                        ...ex,
                        typeCode: ex.phase_type?.type_code?.toLowerCase() || "",
                        phaseId: phase.id,
                      } as FlatExercise))
                      .sort((a, b) =>
                        a.exercise_shortname.localeCompare(b.exercise_shortname, undefined, {
                          numeric: true, sensitivity: "base",
                        })
                      )
                      .map(ex => {
                        sl++;
                        const hours = parseFloat(String(ex.take_time_hours || 0));
                        documentProgMinutes += Math.round(hours * 60);
                        return (
                          <tr key={ex.id} className="border-t border-black hover:bg-gray-50">
                            <td className="px-1 py-2 text-center border-r border-black">
                              {sl.toString().padStart(2, "0")}
                            </td>
                            <td className="px-2 py-2 border-r border-black break-words">
                              {ex.exercise_name}
                            </td>
                            <td className="px-2 py-2 border-r border-black text-gray-700 text-sm leading-relaxed break-words">
                              {ex.exercise_content
                                ? <div className="prose prose-sm max-w-none [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_ol:not([style])]:list-decimal [&_li>ol]:mt-1 [&_li>ul]:mt-1"
                                    dangerouslySetInnerHTML={{ __html: ex.exercise_content }} />
                                : "—"}
                            </td>
                            <td className="px-1 py-2 text-center font-mono border-r border-black">
                              {ex.typeCode === "dual" ? formatHoursToHHMM(hours) : "—"}
                            </td>
                            <td className="px-1 py-2 text-center font-mono border-r border-black">
                              {ex.typeCode === "solo" ? formatHoursToHHMM(hours) : "—"}
                            </td>
                            <td className="px-1 py-2 text-center font-mono font-bold text-green-700 border-r border-black">
                              {`${Math.floor(documentProgMinutes / 60)}:${(documentProgMinutes % 60).toString().padStart(2, "0")}`}
                            </td>
                            <td className="px-2 py-2 text-gray-600 text-sm italic break-words whitespace-pre-wrap border-r border-black">
                              {ex.exercise_remarks || "—"}
                            </td>
                            <td className="px-1 py-2 text-center no-print">
                              <button
                                onClick={() => openExerciseModal(ex)}
                                className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                                title="Edit Exercise"
                              >
                                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  );
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* Signature Section */}
        <div className="mt-12 pt-6">
          <div className="flex items-center justify-between mb-4 no-print">
            {signatures.length === 0 && (
              <button onClick={() => handleOpenSignatureModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs flex items-center gap-1">
                <Icon icon="hugeicons:add-circle" className="w-4 h-4" /> Add Signature
              </button>
            )}
          </div>

          {signatures.length > 0 ? (
            <div className="flex flex-wrap justify-end gap-8">
              {[...signatures]
                .sort((a, b) => new Date(b.approved_date || 0).getTime() - new Date(a.approved_date || 0).getTime())
                .map(sig => (
                  <div key={sig.id} className={`flex flex-col items-center gap-1 ${!sig.is_active ? "opacity-60" : ""}`}>
                    <div className="w-32 h-20">
                      {(sig.user as any)?.signature ? (
                        <img src={(sig.user as any).signature} alt="Signature"
                          className="max-w-full max-h-full object-contain p-1" />
                      ) : (
                        <span className="text-xs text-gray-400 text-center block pt-6">No signature</span>
                      )}
                    </div>
                    <span className="text-gray-800 font-medium text-base">{sig.user?.name || "Unknown"}</span>
                    {sig.user?.rank?.short_name && (
                      <span className="text-gray-700 text-sm">{sig.user.rank.short_name}</span>
                    )}
                    {(sig.user?.roles || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {(sig.user?.roles || []).map((role: any, idx: number) => (
                          <span key={role.id || idx} className="text-gray-600 text-sm">{role.name}</span>
                        ))}
                      </div>
                    )}
                    {sig.approved_date && (
                      <span className="text-gray-500 text-sm">
                        Approved: {new Date(sig.approved_date).toLocaleDateString("en-GB")}
                      </span>
                    )}
                    <div className="no-print flex items-center gap-1 mt-1">
                      <button onClick={() => handleOpenSignatureModal(sig)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleSignatureStatus(sig)}
                        className={`p-1 rounded ${sig.is_active ? "text-orange-500 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`}
                        title={sig.is_active ? "Deactivate" : "Activate"}>
                        <Icon icon={sig.is_active ? "hugeicons:unavailable" : "hugeicons:checkmark-circle-02"} className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteSignatureId(sig.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic no-print">No signatures yet. Add one above.</p>
          )}
        </div>
      </div>

      {/* ── Exercise Edit Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={exerciseModalOpen} onClose={closeExerciseModal} showCloseButton={true} className="max-w-2xl p-0">
        <form onSubmit={handleExerciseSave} className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <FullLogo />
            <h2 className="text-xl font-bold text-gray-900 mt-2">Edit Exercise</h2>
            <p className="text-sm text-gray-500">Update exercise details</p>
          </div>

          {exerciseError && (
            <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
              <Icon icon="hugeicons:alert-circle" className="w-5 h-5 flex-shrink-0" />
              {exerciseError}
            </div>
          )}

          <div className="space-y-4">
            {/* Phase Type */}
            <div>
              <Label>Phase Type</Label>
              {phaseTypesLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                  <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" /> Loading types...
                </div>
              ) : (
                <div className="flex gap-3 mt-1 flex-wrap">
                  {phaseTypes.map(pt => {
                    const isSolo = pt.type_code === "solo";
                    const isSelected = exForm.phase_type_id === pt.id;
                    return (
                      <label key={pt.id} className={`flex items-center gap-2 px-5 py-2 rounded-lg border-2 cursor-pointer transition-all select-none font-semibold text-sm ${
                        isSelected
                          ? isSolo ? "border-orange-400 bg-orange-50 text-orange-700" : "border-blue-400 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}>
                        <input type="radio" name="phase_type_id" value={pt.id}
                          checked={isSelected}
                          onChange={() => setExForm(prev => ({ ...prev, phase_type_id: pt.id }))}
                          className="sr-only" />
                        <Icon icon={isSolo ? "hugeicons:user" : "hugeicons:user-multiple-02"} className="w-4 h-4" />
                        {pt.type_name}
                        {isSelected && <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Name / Short Name */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Exercise Name <span className="text-red-500">*</span></Label>
                <Input value={exForm.exercise_name}
                  onChange={e => setExForm(prev => ({ ...prev, exercise_name: e.target.value }))}
                  placeholder="Enter exercise name" required />
              </div>
              <div>
                <Label>Short Name <span className="text-red-500">*</span></Label>
                <Input value={exForm.exercise_shortname}
                  onChange={e => setExForm(prev => ({ ...prev, exercise_shortname: e.target.value }))}
                  placeholder="Enter short name" required />
              </div>
              <div>
                <Label>Time (H:MM) <span className="text-red-500">*</span></Label>
                <input value={timeInput}
                  onChange={e => setTimeInput(e.target.value)}
                  onBlur={handleTimeBlur}
                  placeholder="0:00" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number"
                  value={exForm.exercise_sort}
                  onChange={e => setExForm(prev => ({ ...prev, exercise_sort: parseInt(e.target.value) || 0 }))}
                  placeholder="0" />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <Label>Remarks</Label>
              <Input value={exForm.exercise_remarks}
                onChange={e => setExForm(prev => ({ ...prev, exercise_remarks: e.target.value }))}
                placeholder="Optional remarks" />
            </div>

            {/* Content */}
            <div>
              <Label>Content</Label>
              <RichTextEditor
                value={exForm.exercise_content}
                onChange={val => setExForm(prev => ({ ...prev, exercise_content: val }))}
                placeholder="Exercise content details..."
                className="border border-gray-200 shadow-none !bg-transparent min-h-[200px]"
              />
            </div>

            {/* Status */}
            <div>
              <Label className="mb-3">Status</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="ex_is_active" checked={exForm.is_active === true}
                    onChange={() => setExForm(prev => ({ ...prev, is_active: true }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <span className="text-gray-900">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="ex_is_active" checked={exForm.is_active === false}
                    onChange={() => setExForm(prev => ({ ...prev, is_active: false }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <span className="text-gray-900">Inactive</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
            <button type="button" onClick={closeExerciseModal} disabled={exerciseSaving}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={exerciseSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md">
              {exerciseSaving && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
              Update Exercise
            </button>
          </div>
        </form>
      </Modal>

      {/* Signature Form Modal */}
      <Modal isOpen={signatureModalOpen} onClose={handleCloseSignatureModal} showCloseButton={false} className="max-w-lg p-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {editingSignature ? "Edit Simulator Details Signature" : "Add Simulator Details Signature"}
            </h3>
            <button onClick={handleCloseSignatureModal} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <Icon icon="hugeicons:close-circle" className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User <span className="text-red-500">*</span>
            </label>
            <select value={signatureFormUserId}
              onChange={e => setSignatureFormUserId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
              <option value="">Select a user...</option>
              {users.filter(u => u.is_active).map(user => (
                <option key={user.id} value={user.id}>
                  {user.rank?.short_name ? `${user.rank.short_name} ` : ""}{user.name} ({user.service_number})
                </option>
              ))}
            </select>
            {usersLoading && <p className="text-sm text-gray-500 mt-1">Loading users...</p>}
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approved Date <span className="text-red-500">*</span>
            </label>
            <DatePicker value={signatureFormDate} onChange={e => setSignatureFormDate(e.target.value)}
              placeholder="dd/mm/yyyy" required />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={handleCloseSignatureModal}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSaveSignature}
              disabled={signatureFormLoading || !signatureFormUserId || !signatureFormDate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {signatureFormLoading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              {editingSignature ? "Update" : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Signature Confirmation */}
      <ConfirmationModal isOpen={!!deleteSignatureId} onClose={() => setDeleteSignatureId(null)}
        onConfirm={handleDeleteSignature} title="Delete Signature"
        message="Are you sure you want to delete this signature? This action cannot be undone."
        confirmText="Delete" cancelText="Cancel" loading={deleteSignatureLoading} variant="danger" />
    </div>
  );
}
