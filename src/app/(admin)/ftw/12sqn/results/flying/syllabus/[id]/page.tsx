"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams, forbidden } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnFlyingSyllabusService } from "@/libs/services/ftw12sqnFlyingSyllabusService";
import { ftw12sqnFlyingSyllabusNoteService } from "@/libs/services/ftw12sqnFlyingSyllabusNoteService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw12sqnFlyingSyllabus, Ftw12sqnFlyingSyllabusExercise, Ftw12sqnFlyingSyllabusCreateData, Ftw12sqnFlyingSyllabusNote } from "@/libs/types/ftw12sqnFlying";
import { Ftw12sqnExerciseModalProvider, useFtw12sqnExerciseModal } from "@/context/Ftw12sqnExerciseModalContext";
import ExerciseFormModal from "@/components/ftw-12sqn-flying/ExerciseFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Modal } from "@/components/ui/modal";

const formatHoursToHHMM = (hours: number | string | null): string => {
  if (hours === null || hours === undefined) return "—";
  const numHours = typeof hours === "string" ? parseFloat(hours) : hours;
  if (isNaN(numHours) || numHours === 0) return "—";
  const totalMinutes = Math.round(numHours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
};

interface AggregatedExercise extends Ftw12sqnFlyingSyllabusExercise {
  phase_type_name?: string;
  syllabus_type_id: number;
}

function ViewFlyingSyllabusContent() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { openModal } = useFtw12sqnExerciseModal();

  const [syllabus, setSyllabus] = useState<Ftw12sqnFlyingSyllabus | null>(null);
  const [loading, setLoading] = useState(true);

  // Notes state
  const [notes, setNotes] = useState<Ftw12sqnFlyingSyllabusNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<Ftw12sqnFlyingSyllabusNote | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
  const [deleteNoteLoading, setDeleteNoteLoading] = useState(false);

  // Status toggle modal state for exercise
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusExercise, setStatusExercise] = useState<AggregatedExercise | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Add note modal state
  const [addNoteModalOpen, setAddNoteModalOpen] = useState(false);

  const loadSyllabus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ftw12sqnFlyingSyllabusService.get(id);
      setSyllabus(data);
    } catch (error) {
      console.error("Failed to load syllabus:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadNotes = useCallback(async () => {
    if (!id) return;
    const data = await ftw12sqnFlyingSyllabusNoteService.getAll(id);
    setNotes(data);
  }, [id]);

  useEffect(() => {
    if (id) {
      loadSyllabus();
      loadNotes();
    }
  }, [id, loadSyllabus, loadNotes]);

  // Listen for updates from modal
  useEffect(() => {
    const handleUpdate = () => loadSyllabus();
    window.addEventListener('syllabusUpdated', handleUpdate);
    return () => window.removeEventListener('syllabusUpdated', handleUpdate);
  }, [loadSyllabus]);

  // Derived data
  const aggregated = useMemo(() => {
    if (!syllabus?.syllabus_types) return { sorties: 0, hours: 0, exercises: [], types: [] };

    let totalSorties = 0;
    let totalHours = 0;
    let exercises: AggregatedExercise[] = [];

    (syllabus.syllabus_types || []).forEach(st => {
      totalSorties += (st.sorties || 0);
      totalHours += parseFloat(String(st.hours || 0));
      if (st.exercises) {
        const mappedExercises: AggregatedExercise[] = st.exercises.map(ex => ({
          ...ex,
          phase_type_name: st.phase_type?.type_name,
          syllabus_type_id: st.id
        }));
        exercises = [...exercises, ...mappedExercises];
      }
    });

    return {
      sorties: totalSorties,
      hours: totalHours,
      exercises: exercises.sort((a, b) =>
        (a.exercise_name || "").localeCompare(b.exercise_name || "", undefined, { numeric: true, sensitivity: "base" })
      ),
      types: syllabus.syllabus_types
    };
  }, [syllabus]);

  // Actions
  const handleEditExercise = (exercise: AggregatedExercise) => {
    const syllabusType = aggregated.types.find(t => t.id === exercise.syllabus_type_id);
    openModal(exercise, syllabusType?.ftw_12sqn_flying_phase_type_id, id);
  };

  const handleAddExercise = () => {
    openModal(undefined, undefined, id);
  };

  const handleToggleExerciseStatus = (exercise: AggregatedExercise) => {
    setStatusExercise(exercise);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusExercise || !syllabus) return;

    try {
      setStatusLoading(true);

      const updatedSyllabusData: Partial<Ftw12sqnFlyingSyllabusCreateData> = {
        phase_full_name: syllabus.phase_full_name,
        phase_shortname: syllabus.phase_shortname,
        phase_symbol: syllabus.phase_symbol,
        phase_sort: syllabus.phase_sort,
        flying_type_id: syllabus.flying_type_id,
        is_active: syllabus.is_active,
        syllabus_types: syllabus.syllabus_types?.map(st => ({
          id: st.id,
          ftw_12sqn_flying_phase_type_id: st.ftw_12sqn_flying_phase_type_id,
          sorties: st.sorties,
          hours: Number(st.hours),
          is_active: st.is_active,
          exercises: st.exercises?.map(ex => ({
            id: ex.id,
            ftw_12sqn_flying_syllabus_type_id: st.id,
            exercise_name: ex.exercise_name,
            exercise_shortname: ex.exercise_shortname,
            exercise_content: ex.exercise_content ?? undefined,
            take_time_hours: Number(ex.take_time_hours),
            remarks: ex.remarks ?? undefined,
            exercise_sort: ex.exercise_sort,
            is_non_grade: ex.is_non_grade,
            is_active: ex.id === statusExercise.id ? !ex.is_active : ex.is_active,
          })) || []
        }))
      };

      await ftw12sqnFlyingSyllabusService.update(id, updatedSyllabusData);
      await loadSyllabus();
      setStatusModalOpen(false);
      setStatusExercise(null);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setNoteLoading(true);
    await ftw12sqnFlyingSyllabusNoteService.create(id, { note: noteText.trim() });
    setNoteText("");
    await loadNotes();
    setNoteLoading(false);
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editText.trim()) return;
    setNoteLoading(true);
    await ftw12sqnFlyingSyllabusNoteService.update(id, editingNote.id, { note: editText.trim() });
    setEditingNote(null);
    setEditText("");
    await loadNotes();
    setNoteLoading(false);
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteId) return;
    setDeleteNoteLoading(true);
    await ftw12sqnFlyingSyllabusNoteService.delete(id, deleteNoteId);
    setDeleteNoteId(null);
    await loadNotes();
    setDeleteNoteLoading(false);
  };

  const handleToggleNoteStatus = async (note: Ftw12sqnFlyingSyllabusNote) => {
    await ftw12sqnFlyingSyllabusNoteService.update(id, note.id, { is_active: !note.is_active });
    await loadNotes();
  };

  const handlePrint = () => {
    window.print();
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
          <p className="text-red-600">Flying Syllabus not found</p>
          <button
            onClick={() => router.push("/ftw/12sqn/results/flying/syllabus")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ftw/12sqn/results/flying/syllabus")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => router.push(`/ftw/12sqn/results/flying/syllabus/${syllabus.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Syllabus
          </button>
        </div>
      </div>

      {/* CV Content */}
      <div className="p-8 cv-content">
        {/* Header with Logo */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider">Flying Syllabus Details - {syllabus.phase_full_name}</p>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">T:{formatHoursToHHMM(aggregated.hours)}
            {aggregated.types.map(type => (
              <span key={type.id} className="text-gray-900 flex-1">
                {type?.phase_type?.type_name ?? type?.phase_type?.type_code}: {formatHoursToHHMM(type.hours)}
              </span>
            ))}
          </p>
        </div>

        {/* Exercises List Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4 pb-1 border-b border-dashed border-gray-400">
            <h2 className="text-lg font-bold text-gray-900">
              Exercises List ({aggregated.exercises.length})
            </h2>
            <div className="flex gap-2 no-print">
              <button
                onClick={handleAddExercise}
                className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-200 hover:bg-blue-100 transition-all flex items-center gap-1"
              >
                <Icon icon="hugeicons:add-circle" className="w-3.5 h-3.5" />
                Add Exercise
              </button>
            </div>
          </div>

          <table className="w-full border-collapse border border-gray-900 text-xs">
            <thead>
              <tr>
                <th className="border border-gray-900 px-3 py-2 text-center text-gray-900 font-semibold w-10">SL</th>
                <th className="border border-gray-900 px-3 py-2 text-left text-gray-900 font-semibold">Exercise</th>
                <th className="border border-gray-900 px-3 py-2 text-center text-gray-900 font-semibold">Symbol</th>
                <th className="border border-gray-900 px-3 py-2 text-left text-gray-900 font-semibold">Content</th>
                <th className="border border-gray-900 px-3 py-2 text-center text-gray-900 font-semibold w-20">Dual</th>
                <th className="border border-gray-900 px-3 py-2 text-center text-gray-900 font-semibold w-20">Solo</th>
                <th className="border border-gray-900 px-3 py-2 text-center text-gray-900 font-semibold w-24">Prog Total</th>
                <th className="border border-gray-900 px-3 py-2 text-left text-gray-900 font-semibold">Remark</th>
                <th className="border border-gray-900 px-3 py-2 text-center text-gray-900 font-semibold w-16">N/G</th>
                <th className="border border-gray-900 px-3 py-2 text-center text-gray-900 font-semibold w-20 no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.exercises.length === 0 ? (
                <tr>
                  <td colSpan={10} className="border border-gray-900 px-4 py-8 text-center text-gray-500 italic">
                    No exercises found for this syllabus.
                  </td>
                </tr>
              ) : (
                (() => {
                  let runningTotalMinutes = 0;
                  return aggregated.exercises.map((exercise, index) => {
                    const isDual = exercise.phase_type_name?.toLowerCase().includes("dual");
                    const isSolo = exercise.phase_type_name?.toLowerCase().includes("solo");
                    const hours = parseFloat(String(exercise.take_time_hours || 0));
                    const dualHours = isDual ? hours : 0;
                    const soloHours = isSolo ? hours : 0;
                    runningTotalMinutes += Math.round((dualHours + soloHours) * 60);

                    return (
                      <tr key={exercise.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEditExercise(exercise)}>
                        <td className="border border-gray-900 px-3 py-2 text-center text-gray-900">{index + 1}</td>
                        <td className="border border-gray-900 px-3 py-2 text-gray-900">{exercise.exercise_name}</td>
                        <td className="border border-gray-900 px-3 py-2 text-center font-bold">{exercise.exercise_shortname}</td>
                        <td className="border border-gray-900 px-3 py-2 text-gray-700 text-sm">
                          {exercise.exercise_content
                            ? <div
                                className="prose prose-sm max-w-xl [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_ol:not([style])]:list-decimal [&_li>ol]:mt-1 [&_li>ul]:mt-1"
                                dangerouslySetInnerHTML={{ __html: exercise.exercise_content }}
                              />
                            : "—"}
                        </td>
                        <td className="border border-gray-900 px-3 py-2 text-center font-mono">{formatHoursToHHMM(dualHours)}</td>
                        <td className="border border-gray-900 px-3 py-2 text-center font-mono">{formatHoursToHHMM(soloHours)}</td>
                        <td className="border border-gray-900 px-3 py-2 text-center font-mono font-bold text-green-700">{`${Math.floor(runningTotalMinutes / 60)}:${(runningTotalMinutes % 60).toString().padStart(2, "0")}`}</td>
                        <td className="border border-gray-900 px-3 py-2 text-gray-600">{exercise.remarks || "—"}</td>
                        <td className="border border-gray-900 px-3 py-2 text-center font-semibold">
                          <span className={exercise.is_non_grade ? "text-red-600" : "text-gray-400"}>
                            {exercise.is_non_grade ? "N/G" : "—"}
                          </span>
                        </td>
                        <td className="border border-gray-900 px-3 py-2 text-center no-print" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEditExercise(exercise)}
                              className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleExerciseStatus(exercise)}
                              className={`p-1 rounded transition-colors ${exercise.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                              title={exercise.is_active ? "Deactivate" : "Activate"}
                            >
                              <Icon icon={exercise.is_active ? "hugeicons:unavailable" : "hugeicons:checkmark-circle-02"} className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* Notes Section */}
        <div className="mb-6 no-print">
          <div className="flex justify-between items-center mb-3 pb-1">
            <h2 className="text-lg font-bold text-gray-900">Note:</h2>
            <button
              onClick={() => {
                setNoteText("");
                setAddNoteModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs flex items-center gap-1"
            >
              <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
              Add Note
            </button>
          </div>

          {/* Notes list */}
          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note, index) => (
                <div key={note.id} className={`flex items-center gap-4 ${!note.is_active ? "opacity-60 bg-gray-50" : "bg-white border-gray-300"}`}>
                  <div className="w-8 text-center font-semibold text-gray-600">{index + 1}.</div>
                  <div className="flex-1">
                    {editingNote?.id === note.id ? (
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={handleUpdateNote}
                            disabled={noteLoading}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                          >Save</button>
                          <button
                            onClick={() => { setEditingNote(null); setEditText(""); }}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                          >Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-800 whitespace-pre-wrap">{note.note}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {editingNote?.id !== note.id && (
                      <button
                        onClick={() => { setEditingNote(note); setEditText(note.note); }}
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Edit"
                      >
                        <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleNoteStatus(note)}
                      className={`p-1 rounded ${note.is_active ? "text-orange-500 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`}
                      title={note.is_active ? "Deactivate" : "Activate"}
                    >
                      <Icon icon={note.is_active ? "hugeicons:unavailable" : "hugeicons:checkmark-circle-02"} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteNoteId(note.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No notes yet. Add one above.</p>
          )}
        </div>

        {/* Footer with date */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <ExerciseFormModal />
      <ConfirmationModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusExercise?.is_active ? "Deactivate Exercise" : "Activate Exercise"}
        message={`Are you sure you want to ${statusExercise?.is_active ? "deactivate" : "activate"} the exercise "${statusExercise?.exercise_name}"?`}
        confirmText={statusExercise?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        loading={statusLoading}
        variant={statusExercise?.is_active ? "danger" : "success"}
      />
      <ConfirmationModal
        isOpen={!!deleteNoteId}
        onClose={() => setDeleteNoteId(null)}
        onConfirm={handleDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteNoteLoading}
        variant="danger"
      />
      <Modal isOpen={addNoteModalOpen} onClose={() => setAddNoteModalOpen(false)} showCloseButton={false} className="max-w-xl p-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Add Note</h3>
            <button
              onClick={() => setAddNoteModalOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <Icon icon="hugeicons:close-circle" className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
            <textarea
              rows={4}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Write a note..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setAddNoteModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!noteText.trim()) return;
                setNoteLoading(true);
                await ftw12sqnFlyingSyllabusNoteService.create(id, { note: noteText.trim() });
                setNoteText("");
                setAddNoteModalOpen(false);
                await loadNotes();
                setNoteLoading(false);
              }}
              disabled={noteLoading || !noteText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {noteLoading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ViewFlyingSyllabusPage() {
  return (
    <Ftw12sqnExerciseModalProvider>
      <ViewFlyingSyllabusContent />
    </Ftw12sqnExerciseModalProvider>
  );
}
