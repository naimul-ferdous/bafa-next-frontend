"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnGroundSyllabusService } from "@/libs/services/ftw12sqnGroundSyllabusService";
import { ftw12sqnGroundSyllabusSimulatorGlobalNoteService } from "@/libs/services/ftw12sqnGroundSyllabusSimulatorGlobalNoteService";
import { ftw12sqnSyllabusSignatureService, Ftw12sqnSyllabusSignature } from "@/libs/services/ftw12sqnSyllabusSignatureService";
import { userService } from "@/libs/services/userService";
import FullLogo from "@/components/ui/fulllogo";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Modal } from "@/components/ui/modal";
import DatePicker from "@/components/form/input/DatePicker";
import type {
  Ftw12sqnGroundSyllabus,
  Ftw12sqnGroundSyllabusExercise,
  Ftw12sqnGroundSyllabusCreateData,
  Ftw12sqnGroundSyllabusSimulatorPhase,
  Ftw12sqnGroundSyllabusSimulatorGlobalNote,
} from "@/libs/types/ftw12sqnFlying";
import { User } from "@/libs/types/user";

// ── helpers ──────────────────────────────────────────────────────────────────
const formatHoursToHHMM = (hours: number | string | null): string => {
  if (hours === null || hours === undefined) return "-";
  const numHours = typeof hours === "string" ? parseFloat(hours) : hours;
  if (isNaN(numHours) || numHours === 0) return "-";
  const totalMinutes = Math.round(numHours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
};

const sumHoursToHHMM = (rows: any[], key: string): string => {
  const totalMinutes = rows.reduce((s, r) => s + Math.round((Number(r[key]) || 0) * 60), 0);
  if (totalMinutes === 0) return "-";
  return `${Math.floor(totalMinutes / 60)}:${(totalMinutes % 60).toString().padStart(2, "0")}`;
};

export default function ViewGroundSyllabusPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [syllabus, setSyllabus] = useState<Ftw12sqnGroundSyllabus | null>(null);
  const [loading, setLoading] = useState(true);

  // ── exercise status toggle (ground mode) ─────────────────────────────────
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusExercise, setStatusExercise] = useState<Ftw12sqnGroundSyllabusExercise | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // ── global notes (flying mode) ────────────────────────────────────────────
  const [globalNotes, setGlobalNotes] = useState<Ftw12sqnGroundSyllabusSimulatorGlobalNote[]>([]);
  const [globalNotesLoading, setGlobalNotesLoading] = useState(true);
  const [globalNoteModalOpen, setGlobalNoteModalOpen] = useState(false);
  const [globalNoteFormLoading, setGlobalNoteFormLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<Ftw12sqnGroundSyllabusSimulatorGlobalNote | null>(null);
  const [noteFormText, setNoteFormText] = useState("");
  const [deleteGlobalNoteId, setDeleteGlobalNoteId] = useState<number | null>(null);
  const [deleteGlobalNoteLoading, setDeleteGlobalNoteLoading] = useState(false);

  // ── signatures (flying mode) ──────────────────────────────────────────────
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

  // ── loaders ───────────────────────────────────────────────────────────────
  const loadSyllabus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ftw12sqnGroundSyllabusService.get(id, { include_inactive: true });
      setSyllabus(data);
    } catch (error) {
      console.error("Failed to load syllabus:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadGlobalNotes = useCallback(async () => {
    try {
      setGlobalNotesLoading(true);
      const data = await ftw12sqnGroundSyllabusSimulatorGlobalNoteService.getAll();
      setGlobalNotes(data);
    } catch (error) {
      console.error("Failed to load global notes:", error);
    } finally {
      setGlobalNotesLoading(false);
    }
  }, []);

  const loadSignatures = useCallback(async () => {
    try {
      const data = await ftw12sqnSyllabusSignatureService.getAll({ type: "simulator_summary" });
      setSignatures(data.data);
    } catch (error) {
      console.error("Failed to load signatures:", error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await userService.getAllUsers({ per_page: 100 });
      setUsers(data.data);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    loadSyllabus();
    loadGlobalNotes();
    loadSignatures();
    loadUsers();
  }, [id, loadSyllabus, loadGlobalNotes, loadSignatures, loadUsers]);

  // ── global note handlers ──────────────────────────────────────────────────
  const openAddNoteModal = () => { setEditingNote(null); setNoteFormText(""); setGlobalNoteModalOpen(true); };
  const openEditNoteModal = (note: Ftw12sqnGroundSyllabusSimulatorGlobalNote) => { setEditingNote(note); setNoteFormText(note.note); setGlobalNoteModalOpen(true); };

  const handleSaveGlobalNote = async () => {
    if (!noteFormText.trim()) return;
    setGlobalNoteFormLoading(true);
    try {
      if (editingNote) {
        await ftw12sqnGroundSyllabusSimulatorGlobalNoteService.update(editingNote.id, { note: noteFormText.trim() });
      } else {
        await ftw12sqnGroundSyllabusSimulatorGlobalNoteService.create({ note: noteFormText.trim() });
      }
      setGlobalNoteModalOpen(false);
      await loadGlobalNotes();
    } catch (error) {
      console.error("Failed to save global note:", error);
    } finally {
      setGlobalNoteFormLoading(false);
    }
  };

  const handleToggleGlobalNoteStatus = async (note: Ftw12sqnGroundSyllabusSimulatorGlobalNote) => {
    await ftw12sqnGroundSyllabusSimulatorGlobalNoteService.update(note.id, { is_active: !note.is_active });
    await loadGlobalNotes();
  };

  const handleDeleteGlobalNote = async () => {
    if (!deleteGlobalNoteId) return;
    setDeleteGlobalNoteLoading(true);
    await ftw12sqnGroundSyllabusSimulatorGlobalNoteService.delete(deleteGlobalNoteId);
    setDeleteGlobalNoteId(null);
    await loadGlobalNotes();
    setDeleteGlobalNoteLoading(false);
  };

  // ── signature handlers ────────────────────────────────────────────────────
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
        await ftw12sqnSyllabusSignatureService.update(editingSignature.id, { user_id: Number(signatureFormUserId), approved_date: apiDate });
      } else {
        await ftw12sqnSyllabusSignatureService.create({ user_id: Number(signatureFormUserId), type: "simulator_summary", approved_date: apiDate });
      }
      handleCloseSignatureModal();
      await loadSignatures();
    } catch (error) {
      console.error("Failed to save signature:", error);
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

  // ── ground mode aggregated ────────────────────────────────────────────────
  const aggregated = useMemo(() => {
    if (!syllabus?.exercises) return { totalMaxMark: 0, exercises: [] };
    let totalMaxMark = 0;
    const exercises = [...syllabus.exercises].filter(ex => !ex.ftw_12sqn_ground_syllabus_simulator_phase_id);
    exercises.forEach(ex => { totalMaxMark += parseFloat(String(ex.max_mark || 0)); });
    return { totalMaxMark, exercises: exercises.sort((a, b) => (a.exercise_sort || 0) - (b.exercise_sort || 0)) };
  }, [syllabus]);

  // ── flying mode: phases sorted ────────────────────────────────────────────
  const sortedPhases = useMemo<Ftw12sqnGroundSyllabusSimulatorPhase[]>(() => {
    if (!syllabus?.simulator_phases) return [];
    return [...syllabus.simulator_phases].sort((a, b) => a.phase_sort - b.phase_sort);
  }, [syllabus]);

  // ── flying mode: aggregated table data ───────────────────────────────────
  const tableData = useMemo(() => {
    return sortedPhases.map(phase => {
      const dualExercises = (phase.exercises || []).filter(ex => ex.phase_type?.type_code?.toLowerCase() === "dual");
      const soloExercises = (phase.exercises || []).filter(ex => ex.phase_type?.type_code?.toLowerCase() === "solo");
      const dualSorties = dualExercises.length;
      const dualMinutes = dualExercises.reduce((s, ex) => s + Math.round(parseFloat(String(ex.take_time_hours || 0)) * 60), 0);
      const soloSorties = soloExercises.length;
      const soloMinutes = soloExercises.reduce((s, ex) => s + Math.round(parseFloat(String(ex.take_time_hours || 0)) * 60), 0);
      return {
        id: phase.id,
        phase_full_name: phase.phase_full_name,
        phase_shortname: phase.phase_shortname,
        phase_symbol: phase.phase_symbol || "",
        phase_sort: phase.phase_sort,
        dual_sorties: dualSorties,
        dual_hours: dualMinutes / 60,
        solo_sorties: soloSorties,
        solo_hours: soloMinutes / 60,
        total_sorties: dualSorties + soloSorties,
        total_hours: (dualMinutes + soloMinutes) / 60,
        is_active: phase.is_active,
      };
    });
  }, [sortedPhases]);

  // ── exercise status toggle (ground mode) ─────────────────────────────────
  const handleToggleExerciseStatus = (exercise: Ftw12sqnGroundSyllabusExercise) => {
    setStatusExercise(exercise);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusExercise || !syllabus) return;
    try {
      setStatusLoading(true);
      const updatedSyllabusData: Partial<Ftw12sqnGroundSyllabusCreateData> = {
        ground_full_name: syllabus.ground_full_name,
        ground_shortname: syllabus.ground_shortname,
        ground_symbol: syllabus.ground_symbol,
        ground_sort: syllabus.ground_sort,
        no_of_test: syllabus.no_of_test,
        highest_mark: Number(syllabus.highest_mark),
        course_id: syllabus.course_id,
        semester_id: syllabus.semester_id,
        is_active: syllabus.is_active,
        is_flying: syllabus.is_flying,
        exercises: syllabus.exercises?.map(ex => ({
          id: ex.id,
          exercise_name: ex.exercise_name,
          exercise_shortname: ex.exercise_shortname,
          exercise_content: ex.exercise_content ?? undefined,
          exercise_remarks: ex.exercise_remarks ?? undefined,
          exercise_sort: ex.exercise_sort,
          max_mark: Number(ex.max_mark),
          is_active: ex.id === statusExercise.id ? !ex.is_active : ex.is_active,
        })) || [],
      };
      await ftw12sqnGroundSyllabusService.update(id, updatedSyllabusData);
      await loadSyllabus();
      setStatusModalOpen(false);
      setStatusExercise(null);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading syllabus details...</p>
        </div>
      </div>
    );
  }

  if (!syllabus) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">Ground Syllabus not found</p>
          <button onClick={() => router.push("/ftw/12sqn/results/ground/syllabus")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to List
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // FLYING / SIMULATOR MODE VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (syllabus.is_flying) {
    let slCounter = 0;

    return (
      <div className="print-no-border bg-white rounded-lg border border-gray-200">
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-no-border { border: none !important; }
            table { border-collapse: collapse !important; }
          }
        `}</style>

        {/* Action Bar */}
        <div className="p-4 flex items-center justify-between no-print">
          <button onClick={() => router.push("/ftw/12sqn/results/ground/syllabus")}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" /> Back to List
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/ftw/12sqn/results/ground/syllabus/${syllabus.id}/details`)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Icon icon="hugeicons:note" className="w-4 h-4" /> Details
            </button>
            <button onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Icon icon="hugeicons:printer" className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4"><FullLogo /></div>
            <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">
              Bangladesh Air Force Academy
            </h1>
            <p className="font-semibold text-gray-700 mt-2 uppercase underline">
              Summary of the simulator flying syllabus: G 120TP Ac
            </p>
            <p className="font-semibold text-gray-700 uppercase underline">12 SQN BAF</p>
            <p className="font-semibold text-gray-700 uppercase underline">
              {sumHoursToHHMM(tableData, "total_hours")} Hrs
            </p>
          </div>

          {/* Phase table */}
          <div className="overflow-x-auto border border-black rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black">
                  <th rowSpan={2} className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">SL</th>
                  <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-gray-700 border-r border-black">PHASE</th>
                  <th colSpan={2} className="px-3 py-2 text-center font-semibold text-gray-700 border-r border-black">DUAL</th>
                  <th colSpan={2} className="px-3 py-2 text-center font-semibold text-gray-700 border-r border-black">SOLO</th>
                  <th colSpan={2} className="px-3 py-2 text-center font-semibold text-gray-700 border-r border-black">TOTAL</th>
                  <th rowSpan={2} className="px-3 py-3 text-center font-semibold text-gray-700 border-r border-black">STATUS</th>
                  <th rowSpan={2} className="px-3 py-3 text-center font-semibold text-gray-700 no-print">ACTIONS</th>
                </tr>
                <tr className="border-b border-black">
                  <th className="px-3 py-2 text-center font-medium text-gray-600 border-r border-black">SORTIES</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600 border-r border-black">HOURS</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600 border-r border-black">SORTIES</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600 border-r border-black">HOURS</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600 border-r border-black">SORTIES</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600 border-r border-black">HOURS</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500 italic">No phases found.</td>
                  </tr>
                ) : (
                  <>
                    {tableData.map((row, index) => {
                      slCounter++;
                      const isLast = index === tableData.length - 1;
                      return (
                        <React.Fragment key={row.id}>
                          <tr className={`hover:bg-gray-50 cursor-pointer ${!isLast ? "border-b border-black" : ""}`}
                            onClick={() => router.push(`/ftw/12sqn/results/ground/syllabus/${syllabus.id}/details`)}>
                            <td className="px-3 py-2 text-center font-medium text-gray-900 border-r border-black">{slCounter}</td>
                            <td className="px-4 py-2 text-gray-900 border-r border-black">{row.phase_full_name}</td>
                            <td className="px-3 py-2 text-center text-gray-700 border-r border-black">{row.dual_sorties || "—"}</td>
                            <td className="px-3 py-2 text-center font-semibold text-green-700 border-r border-black">{formatHoursToHHMM(row.dual_hours)}</td>
                            <td className="px-3 py-2 text-center text-gray-700 border-r border-black">{row.solo_sorties || "—"}</td>
                            <td className="px-3 py-2 text-center font-semibold text-green-700 border-r border-black">{formatHoursToHHMM(row.solo_hours)}</td>
                            <td className="px-3 py-2 text-center font-semibold text-gray-900 border-r border-black">{row.total_sorties || "—"}</td>
                            <td className="px-3 py-2 text-center font-semibold text-green-700 border-r border-black">{formatHoursToHHMM(row.total_hours)}</td>
                            <td className="px-3 py-2 text-center border-r border-black" onClick={e => e.stopPropagation()}>
                              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${row.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                {row.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center no-print" onClick={e => e.stopPropagation()}>
                              <button onClick={() => router.push(`/ftw/12sqn/results/ground/syllabus/${syllabus.id}/edit`)}
                                className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
                                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                    {/* Grand Total */}
                    <tr className="font-bold border-t border-black">
                      <td colSpan={2} className="px-4 py-2 text-xs text-center uppercase tracking-wide border-r border-black">Total</td>
                      <td className="px-3 py-2 text-center border-r border-black">{tableData.reduce((s, r) => s + r.dual_sorties, 0) || "—"}</td>
                      <td className="px-3 py-2 text-center border-r border-black">{sumHoursToHHMM(tableData, "dual_hours")}</td>
                      <td className="px-3 py-2 text-center border-r border-black">{tableData.reduce((s, r) => s + r.solo_sorties, 0) || "—"}</td>
                      <td className="px-3 py-2 text-center border-r border-black">{sumHoursToHHMM(tableData, "solo_hours")}</td>
                      <td className="px-3 py-2 text-center border-r border-black">{tableData.reduce((s, r) => s + r.total_sorties, 0) || "—"}</td>
                      <td className="px-3 py-2 text-center text-green-700 border-r border-black">{sumHoursToHHMM(tableData, "total_hours")}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Global Notes ─────────────────────────────────────────────── */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-gray-900">Note:</h2>
              <button onClick={openAddNoteModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs flex items-center gap-1">
                <Icon icon="hugeicons:add-circle" className="w-4 h-4" /> Add Note
              </button>
            </div>
            {globalNotesLoading ? (
              <div className="text-center py-4"><Icon icon="hugeicons:loading-03" className="w-6 h-6 animate-spin mx-auto text-blue-500" /></div>
            ) : globalNotes.length > 0 ? (
              <div className="space-y-3">
                {[...globalNotes].sort((a, b) => a.id - b.id).map((note, index) => (
                  <div key={note.id} className={`flex items-center gap-4 ${!note.is_active ? "opacity-60 bg-gray-50" : ""}`}>
                    <div className="w-8 text-center font-semibold text-gray-600">{index + 1}.</div>
                    <div className="flex-1">
                      <span className="text-gray-800 whitespace-pre-wrap">{note.note}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditNoteModal(note)}
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
                        <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleGlobalNoteStatus(note)}
                        className={`p-1 rounded ${note.is_active ? "text-orange-500 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`}
                        title={note.is_active ? "Deactivate" : "Activate"}>
                        <Icon icon={note.is_active ? "hugeicons:unavailable" : "hugeicons:checkmark-circle-02"} className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteGlobalNoteId(note.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No global notes yet. Add one above.</p>
            )}
          </div>

          {/* ── Signatures ───────────────────────────────────────────────── */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
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
                      <div className="flex items-center gap-1 mt-1">
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
              <p className="text-gray-500 text-center py-4">No signatures yet. Add one above.</p>
            )}
          </div>

          <div className="mt-12 text-center text-sm text-gray-600">
            <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>

        {/* ── Modals ─────────────────────────────────────────────────────── */}

        {/* Global Note Modal */}
        <Modal isOpen={globalNoteModalOpen} onClose={() => setGlobalNoteModalOpen(false)} showCloseButton={false} className="max-w-xl p-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{editingNote ? "Edit Global Note" : "Add Global Note"}</h3>
              <button onClick={() => setGlobalNoteModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <Icon icon="hugeicons:close-circle" className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
              <textarea rows={4} value={noteFormText} onChange={e => setNoteFormText(e.target.value)}
                placeholder="Write a global note..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                autoFocus />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setGlobalNoteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveGlobalNote} disabled={globalNoteFormLoading || !noteFormText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {globalNoteFormLoading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
                {editingNote ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Signature Modal */}
        <Modal isOpen={signatureModalOpen} onClose={handleCloseSignatureModal} showCloseButton={false} className="max-w-lg p-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingSignature ? "Edit Simulator Summary Signature" : "Add Simulator Summary Signature"}
              </h3>
              <button onClick={handleCloseSignatureModal} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <Icon icon="hugeicons:close-circle" className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">User <span className="text-red-500">*</span></label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Approved Date <span className="text-red-500">*</span></label>
              <DatePicker value={signatureFormDate} onChange={e => setSignatureFormDate(e.target.value)}
                placeholder="dd/mm/yyyy" required />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={handleCloseSignatureModal}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveSignature}
                disabled={signatureFormLoading || !signatureFormUserId || !signatureFormDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {signatureFormLoading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
                {editingSignature ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Note Confirmation */}
        <ConfirmationModal isOpen={!!deleteGlobalNoteId} onClose={() => setDeleteGlobalNoteId(null)}
          onConfirm={handleDeleteGlobalNote} title="Delete Global Note"
          message="Are you sure you want to delete this global note? This action cannot be undone."
          confirmText="Delete" cancelText="Cancel" loading={deleteGlobalNoteLoading} variant="danger" />

        {/* Delete Signature Confirmation */}
        <ConfirmationModal isOpen={!!deleteSignatureId} onClose={() => setDeleteSignatureId(null)}
          onConfirm={handleDeleteSignature} title="Delete Signature"
          message="Are you sure you want to delete this signature? This action cannot be undone."
          confirmText="Delete" cancelText="Cancel" loading={deleteSignatureLoading} variant="danger" />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GROUND MODE VIEW
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      <div className="p-4 flex items-center justify-between no-print">
        <button onClick={() => router.push("/ftw/12sqn/results/ground/syllabus")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" /> Back to List
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Icon icon="hugeicons:printer" className="w-4 h-4" /> Print
          </button>
          <button onClick={() => router.push(`/ftw/12sqn/results/ground/syllabus/${syllabus.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /> Edit Syllabus
          </button>
        </div>
      </div>

      <div className="p-8 cv-content">
        <div className="mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            Ground Syllabus Details - {syllabus.ground_full_name}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">Basic Information</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            {[
              ["Subject Full Name", syllabus.ground_full_name],
              ["Short Name", syllabus.ground_shortname],
              ["Symbol", syllabus.ground_symbol || "—"],
              ["Course", syllabus.course?.name || "—"],
              ["Semester", syllabus.semester?.name || "—"],
              ["Sort Order", syllabus.ground_sort],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex">
                <span className="w-48 text-gray-900 font-medium">{label}</span>
                <span className="mr-4">:</span>
                <span className="text-gray-900 flex-1 uppercase font-bold text-blue-700">{String(value)}</span>
              </div>
            ))}
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className="flex-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${syllabus.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {syllabus.is_active ? "Active" : "Inactive"}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">Assessment Summary</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex"><span className="w-48 text-gray-900 font-medium">Number of Tests</span><span className="mr-4">:</span><span className="text-gray-900 flex-1 font-bold text-blue-600">{syllabus.no_of_test}</span></div>
            <div className="flex"><span className="w-48 text-gray-900 font-medium">Highest Mark</span><span className="mr-4">:</span><span className="text-gray-900 flex-1 font-bold text-green-600">{syllabus.highest_mark}</span></div>
            <div className="flex"><span className="w-48 text-gray-900 font-medium">Component Total</span><span className="mr-4">:</span><span className="text-gray-900 flex-1 font-bold text-purple-600">{aggregated.totalMaxMark}</span></div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4 pb-1 border-b border-dashed border-gray-400">
            <h2 className="text-lg font-bold text-gray-900">Subject Components / Topics ({aggregated.exercises.length})</h2>
          </div>
          <table className="w-full border-collapse border border-gray-900">
            <thead>
              <tr>
                <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold w-12">SL.</th>
                <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Short Name</th>
                <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Component Name</th>
                <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold w-24">Max Mark</th>
                <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold w-24">Status</th>
                <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold w-24 no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.exercises.length === 0 ? (
                <tr><td colSpan={6} className="border border-gray-900 px-4 py-8 text-center text-gray-500 italic">No components found.</td></tr>
              ) : (
                aggregated.exercises.map((exercise, index) => (
                  <tr key={exercise.id} className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/ftw/12sqn/results/ground/syllabus/${id}/edit`)}>
                    <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{index + 1}</td>
                    <td className="border border-gray-900 px-4 py-2 font-bold text-blue-700">{exercise.exercise_shortname}</td>
                    <td className="border border-gray-900 px-4 py-2 text-gray-900">
                      <div>{exercise.exercise_name}</div>
                      {exercise.exercise_content && <div className="text-[10px] text-gray-500 mt-0.5">{exercise.exercise_content}</div>}
                    </td>
                    <td className="border border-gray-900 px-4 py-2 text-center"><span className="font-mono font-bold">{exercise.max_mark}</span></td>
                    <td className="border border-gray-900 px-4 py-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${exercise.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {exercise.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="border border-gray-900 px-4 py-2 text-center no-print" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => router.push(`/ftw/12sqn/results/ground/syllabus/${id}/edit`)}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
                          <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleExerciseStatus(exercise)}
                          className={`p-1 rounded ${exercise.is_active ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                          title={exercise.is_active ? "Deactivate" : "Activate"}>
                          <Icon icon={exercise.is_active ? "hugeicons:unavailable" : "hugeicons:checkmark-circle-02"} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {aggregated.exercises.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={3} className="border border-gray-900 px-4 py-2 text-right uppercase text-xs">Total:</td>
                  <td className="border border-gray-900 px-4 py-2 text-center">{aggregated.totalMaxMark}</td>
                  <td colSpan={2} className="border border-gray-900"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <ConfirmationModal isOpen={statusModalOpen} onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusExercise?.is_active ? "Deactivate Component" : "Activate Component"}
        message={`Are you sure you want to ${statusExercise?.is_active ? "deactivate" : "activate"} "${statusExercise?.exercise_name}"?`}
        confirmText={statusExercise?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel" loading={statusLoading}
        variant={statusExercise?.is_active ? "danger" : "success"} />
    </div>
  );
}
