"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnFlyingSyllabusService } from "@/libs/services/ftw12sqnFlyingSyllabusService";
import { ftw12sqnFlyingSyllabusNoteService } from "@/libs/services/ftw12sqnFlyingSyllabusNoteService";
import { ftw12sqnSyllabusSignatureService, Ftw12sqnSyllabusSignature } from "@/libs/services/ftw12sqnSyllabusSignatureService";
import { userService } from "@/libs/services/userService";
import type { User } from "@/libs/types/user";
import FullLogo from "@/components/ui/fulllogo";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Modal } from "@/components/ui/modal";
import DatePicker from "@/components/form/input/DatePicker";
import type {
    Ftw12sqnFlyingSyllabusGroupedSemester,
    Ftw12sqnFlyingSyllabus,
    Ftw12sqnFlyingSyllabusExercise,
    Ftw12sqnFlyingSyllabusNote,
} from "@/libs/types/ftw12sqnFlying";

interface FlatExercise extends Ftw12sqnFlyingSyllabusExercise {
    typeName: string;
    typeCode: string;
}

const formatHoursToHHMM = (hours: number | string | null): string => {
    if (hours === null || hours === undefined) return "—";
    const numHours = typeof hours === "string" ? parseFloat(hours) : hours;
    if (isNaN(numHours) || numHours === 0) return "—";
    const totalMinutes = Math.round(numHours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}:${m.toString().padStart(2, "0")}`;
};

export default function Ftw12sqnFullDetailsSyllabusPage() {
    const router = useRouter();
    const [semesterGroups, setSemesterGroups] = useState<Ftw12sqnFlyingSyllabusGroupedSemester[]>([]);
    const [loading, setLoading] = useState(true);

    // Flying Details Signature state
    const [flyingDetailsSignatures, setFlyingDetailsSignatures] = useState<Ftw12sqnSyllabusSignature[]>([]);
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [signatureFormLoading, setSignatureFormLoading] = useState(false);
    const [signatureFormUserId, setSignatureFormUserId] = useState<number | "">("");
    const [signatureFormDate, setSignatureFormDate] = useState("");
    const [editingSignature, setEditingSignature] = useState<Ftw12sqnSyllabusSignature | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [deleteSignatureId, setDeleteSignatureId] = useState<number | null>(null);
    const [deleteSignatureLoading, setDeleteSignatureLoading] = useState(false);

    // Note modal state
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [noteModalSyllabusId, setNoteModalSyllabusId] = useState<number | null>(null);
    const [editingNote, setEditingNote] = useState<Ftw12sqnFlyingSyllabusNote | null>(null);
    const [noteFormText, setNoteFormText] = useState("");
    const [noteFormLoading, setNoteFormLoading] = useState(false);

    // Delete note state
    const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
    const [deleteNoteSyllabusId, setDeleteNoteSyllabusId] = useState<number | null>(null);
    const [deleteNoteLoading, setDeleteNoteLoading] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await ftw12sqnFlyingSyllabusService.getSemesterGrouped();
            setSemesterGroups(data);
        } catch (error) {
            console.error("Failed to load full flying syllabus details:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadFlyingDetailsSignatures = useCallback(async () => {
        try {
            const data = await ftw12sqnSyllabusSignatureService.getAll({ type: 'flying_details' });
            setFlyingDetailsSignatures(data.data);
        } catch (error) {
            console.error("Failed to load flying details signatures:", error);
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
        loadData();
        loadFlyingDetailsSignatures();
        loadUsers();
    }, [loadData, loadFlyingDetailsSignatures, loadUsers]);

    const handleOpenSignatureModal = (sig?: Ftw12sqnSyllabusSignature) => {
        setEditingSignature(sig || null);
        setSignatureFormUserId(sig ? sig.user_id : "");
        setSignatureFormDate(sig?.approved_date ? new Date(sig.approved_date).toLocaleDateString('en-GB') : "");
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
            const [day, month, year] = signatureFormDate.split('/');
            const apiDate = `${year}-${month}-${day}`;
            if (editingSignature) {
                await ftw12sqnSyllabusSignatureService.update(editingSignature.id, {
                    user_id: Number(signatureFormUserId),
                    approved_date: apiDate,
                });
            } else {
                await ftw12sqnSyllabusSignatureService.create({
                    user_id: Number(signatureFormUserId),
                    type: 'flying_details',
                    approved_date: apiDate,
                });
            }
            handleCloseSignatureModal();
            await loadFlyingDetailsSignatures();
        } catch (error) {
            console.error("Failed to save signature:", error);
        } finally {
            setSignatureFormLoading(false);
        }
    };

    const handleToggleSignatureStatus = async (sig: Ftw12sqnSyllabusSignature) => {
        await ftw12sqnSyllabusSignatureService.toggleStatus(sig.id);
        await loadFlyingDetailsSignatures();
    };

    const handleDeleteSignature = async () => {
        if (!deleteSignatureId) return;
        setDeleteSignatureLoading(true);
        await ftw12sqnSyllabusSignatureService.remove(deleteSignatureId);
        setDeleteSignatureId(null);
        await loadFlyingDetailsSignatures();
        setDeleteSignatureLoading(false);
    };

    const handlePrint = () => window.print();

    // Note handlers
    const openAddNoteModal = (syllabusId: number) => {
        setNoteModalSyllabusId(syllabusId);
        setEditingNote(null);
        setNoteFormText("");
        setNoteModalOpen(true);
    };

    const openEditNoteModal = (syllabusId: number, note: Ftw12sqnFlyingSyllabusNote) => {
        setNoteModalSyllabusId(syllabusId);
        setEditingNote(note);
        setNoteFormText(note.note);
        setNoteModalOpen(true);
    };

    const handleSaveNote = async () => {
        if (!noteFormText.trim() || !noteModalSyllabusId) return;
        setNoteFormLoading(true);
        try {
            if (editingNote) {
                await ftw12sqnFlyingSyllabusNoteService.update(noteModalSyllabusId, editingNote.id, { note: noteFormText.trim() });
            } else {
                await ftw12sqnFlyingSyllabusNoteService.create(noteModalSyllabusId, { note: noteFormText.trim() });
            }
            setNoteModalOpen(false);
            await loadData();
        } catch (error) {
            console.error("Failed to save note:", error);
        } finally {
            setNoteFormLoading(false);
        }
    };

    const handleToggleNoteStatus = async (syllabusId: number, note: Ftw12sqnFlyingSyllabusNote) => {
        await ftw12sqnFlyingSyllabusNoteService.update(syllabusId, note.id, { is_active: !note.is_active });
        await loadData();
    };

    const openDeleteNote = (syllabusId: number, noteId: number) => {
        setDeleteNoteSyllabusId(syllabusId);
        setDeleteNoteId(noteId);
    };

    const handleDeleteNote = async () => {
        if (!deleteNoteId || !deleteNoteSyllabusId) return;
        setDeleteNoteLoading(true);
        await ftw12sqnFlyingSyllabusNoteService.delete(deleteNoteSyllabusId, deleteNoteId);
        setDeleteNoteId(null);
        setDeleteNoteSyllabusId(null);
        await loadData();
        setDeleteNoteLoading(false);
    };

    if (loading) {
        return (
            <div className="w-full min-h-[40vh] flex items-center justify-center">
                <Icon icon="hugeicons:fan-01" className="w-12 h-12 animate-spin text-blue-500" />
            </div>
        );
    }

    if (semesterGroups.length === 0) {
        return (
            <div className="bg-white p-12 text-center rounded-lg border border-dashed border-gray-300">
                <Icon icon="hugeicons:alert-circle" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Syllabus Data Found</h3>
                <button
                    onClick={() => router.push("/ftw/12sqn/results/flying/syllabus")}
                    className="mt-4 text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back to Summary
                </button>
            </div>
        );
    }

    let documentProgMinutes = 0;

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            <style>{`
                @media print {
                    @page {
                        size: A3 portrait;
                        margin: 15mm 12mm;
                    }
                    html, body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print { display: none !important; }
                    .print-no-border { border: none !important; }
                    table { border-collapse: collapse !important; }
                    .report-block {
                        page-break-before: always;
                        break-before: page;
                    }
                    .report-block:first-child {
                        page-break-before: avoid;
                        break-before: avoid;
                    }
                    tr {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
            `}</style>

            {/* Action Bar */}
            <div className="p-4 flex items-center justify-between no-print">
                <button
                    onClick={() => history.back()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back to List
                </button>
                <button
                    onClick={handlePrint}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:printer" className="w-4 h-4" />
                    Print
                </button>
            </div>

            <div className="p-8">
                {/* Document Header */}
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-4">
                        <FullLogo />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">
                        Bangladesh Air Force Academy
                    </h1>
                    <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase underline">Basic Flying Training Syllabus: G 120TP AC</h2>
                    <h2 className="text-md font-semibold text-gray-700 uppercase underline">12 SQN BAF</h2>
                </div>

                {/* All Semesters */}
                <div className="space-y-12">
                    {semesterGroups.map((semesterGroup, semIdx) => (
                        <div key={semIdx} className={semIdx > 0 ? "report-block" : ""}>
                            <div className="space-y-10">
                                {(semesterGroup.syllabus ?? [])
                                    .slice()
                                    .sort((a: Ftw12sqnFlyingSyllabus, b: Ftw12sqnFlyingSyllabus) => a.phase_sort - b.phase_sort)
                                    .map((phase: Ftw12sqnFlyingSyllabus) => {
                                        // Flatten exercises from all types (Dual/Solo)
                                        const allExercises: FlatExercise[] = [];
                                        (phase.syllabus_types || []).forEach((type) => {
                                            (type.exercises || []).forEach((ex) => {
                                                allExercises.push({
                                                    ...ex,
                                                    typeName: type.phase_type?.type_name || "",
                                                    typeCode: type.phase_type?.type_code?.toLowerCase() || "",
                                                });
                                            });
                                        });
                                        allExercises.sort((a, b) =>
                                            a.exercise_shortname.localeCompare(b.exercise_shortname, undefined, { numeric: true, sensitivity: "base" })
                                        );

                                        const totalPhaseHours = allExercises.reduce(
                                            (sum, ex) => sum + parseFloat(String(ex.take_time_hours || 0)), 0
                                        );

                                        return (
                                            <div key={phase.id} className="space-y-2">
                                                {/* Phase heading */}
                                                <div className="flex flex-col items-center mb-2">
                                                    <p className="font-semibold text-gray-900 uppercase tracking-wider underline">
                                                        {phase.phase_full_name} ({phase.phase_symbol || "—"}) Phase
                                                    </p>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        Total: {formatHoursToHHMM(totalPhaseHours)} Hrs
                                                    </p>
                                                </div>

                                                <div className="overflow-x-auto border border-black rounded-lg">
                                                    <table className="w-full border-collapse table-fixed">
                                                        <thead>
                                                            <tr className="border-b border-black">
                                                                <th className="px-1 py-2 text-center font-bold text-black border-r border-black w-[4%]">SL</th>
                                                                <th className="px-2 py-2 text-left font-bold text-black border-r border-black w-[18%]">Exercise</th>
                                                                <th className="px-2 py-2 text-left font-bold text-black border-r border-black w-[28%]">Content</th>
                                                                <th className="px-1 py-2 text-center font-bold text-black border-r border-black w-[8%]">Dual</th>
                                                                <th className="px-1 py-2 text-center font-bold text-black border-r border-black w-[8%]">Solo</th>
                                                                <th className="px-1 py-2 text-center font-bold text-black border-r border-black w-[10%]">Prog Total</th>
                                                                <th className="px-2 py-2 text-left font-bold text-black w-[16%]">Remarks</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-black">
                                                            {allExercises.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500 italic">
                                                                        No exercises defined for this phase.
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                allExercises.map((ex, idx) => {
                                                                    const hours = parseFloat(String(ex.take_time_hours || 0));
                                                                    documentProgMinutes += Math.round(hours * 60);

                                                                    return (
                                                                        <tr key={ex.id} className="hover:bg-gray-50">
                                                                            <td className="px-1 py-2 text-center border-r border-black">
                                                                                {(idx + 1).toString().padStart(2, "0")}
                                                                            </td>
                                                                            <td className="px-2 py-2 border-r border-black break-words">
                                                                                {ex.exercise_name}
                                                                            </td>
                                                                            <td className="px-2 py-2 border-r border-black text-gray-700 text-sm leading-relaxed break-words">
                                                                                {ex.exercise_content
                                                                                    ? <div
                                                                                        className="prose prose-sm max-w-xl [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_ol:not([style])]:list-decimal [&_li>ol]:mt-1 [&_li>ul]:mt-1"
                                                                                        dangerouslySetInnerHTML={{ __html: ex.exercise_content }}
                                                                                      />
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
                                                                            <td className="px-2 py-2 text-gray-600 text-sm italic break-words whitespace-pre-wrap">
                                                                                {ex.remarks || "—"}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Phase Notes */}
                                                <div className="py-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="font-semibold text-black text-sm uppercase tracking-wide">Notes:</p>
                                                        <button
                                                            onClick={() => openAddNoteModal(phase.id)}
                                                            className="no-print px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs flex items-center gap-1"
                                                        >
                                                            <Icon icon="hugeicons:add-circle" className="w-3.5 h-3.5" />
                                                            Add Note
                                                        </button>
                                                    </div>

                                                    {phase.notes && phase.notes.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {[...phase.notes].sort((a, b) => a.id - b.id).map((note, ni) => (
                                                                <div
                                                                    key={note.id}
                                                                    className={`flex items-start gap-3 ${!note.is_active ? "opacity-60" : ""}`}
                                                                >
                                                                    <div className="w-6 text-center font-semibold text-gray-600 text-sm flex-shrink-0 mt-0.5">
                                                                        {ni + 1}.
                                                                    </div>
                                                                    <div className="flex-1 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                                                        {note.note}
                                                                    </div>
                                                                    <div className="no-print flex items-center gap-1 flex-shrink-0">
                                                                        <button
                                                                            onClick={() => openEditNoteModal(phase.id, note)}
                                                                            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                                                                            title="Edit"
                                                                        >
                                                                            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleToggleNoteStatus(phase.id, note)}
                                                                            className={`p-1 rounded ${note.is_active ? "text-orange-500 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`}
                                                                            title={note.is_active ? "Deactivate" : "Activate"}
                                                                        >
                                                                            <Icon icon={note.is_active ? "hugeicons:unavailable" : "hugeicons:checkmark-circle-02"} className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openDeleteNote(phase.id, note.id)}
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
                                                        <p className="text-gray-400 text-sm italic no-print">No notes yet. Add one above.</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Flying Details Signature Section */}
                <div className="mt-12 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4 no-print">
                        <h2 className="text-lg font-bold text-gray-900">Signature:</h2>
                        {flyingDetailsSignatures.length === 0 && (
                            <button
                                onClick={() => handleOpenSignatureModal()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs flex items-center gap-1"
                            >
                                <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                                Add Signature
                            </button>
                        )}
                    </div>

                    {flyingDetailsSignatures.length > 0 ? (
                        <div className="flex flex-wrap justify-end gap-8">
                            {[...flyingDetailsSignatures]
                                .sort((a, b) => new Date(b.approved_date || 0).getTime() - new Date(a.approved_date || 0).getTime())
                                .map((sig) => (
                                    <div key={sig.id} className={`flex flex-col items-center gap-1 ${!sig.is_active ? "opacity-60" : ""}`}>
                                        <div className="w-32 h-20">
                                            {(sig.user as any)?.signature ? (
                                                <img
                                                    src={(sig.user as any).signature}
                                                    alt="Signature"
                                                    className="max-w-full max-h-full object-contain p-1"
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-400 text-center block pt-6">No signature</span>
                                            )}
                                        </div>
                                        <span className="text-gray-800 font-medium text-base">{sig.user?.name || 'Unknown'}</span>
                                        {sig.user?.rank?.short_name && (
                                            <span className="text-gray-700 text-sm">{sig.user.rank.short_name}</span>
                                        )}
                                        {(sig.user?.roles || []).length > 0 && (
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                {(sig.user?.roles || []).map((role, idx) => (
                                                    <span key={role.id || idx} className="text-gray-600 text-sm">{role.name}</span>
                                                ))}
                                            </div>
                                        )}
                                        {sig.approved_date && (
                                            <span className="text-gray-500 text-sm">
                                                Approved: {new Date(sig.approved_date).toLocaleDateString('en-GB')}
                                            </span>
                                        )}
                                        <div className="no-print flex items-center gap-1 mt-1">
                                            <button onClick={() => handleOpenSignatureModal(sig)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                                                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleSignatureStatus(sig)}
                                                className={`p-1 rounded ${sig.is_active ? "text-orange-500 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`}
                                                title={sig.is_active ? "Deactivate" : "Activate"}
                                            >
                                                <Icon icon={sig.is_active ? "hugeicons:unavailable" : "hugeicons:checkmark-circle-02"} className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setDeleteSignatureId(sig.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
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

            {/* Note Form Modal */}
            <Modal isOpen={noteModalOpen} onClose={() => setNoteModalOpen(false)} showCloseButton={false} className="max-w-xl p-0">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                            {editingNote ? "Edit Note" : "Add Note"}
                        </h3>
                        <button
                            onClick={() => setNoteModalOpen(false)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                            <Icon icon="hugeicons:close-circle" className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                        <textarea
                            rows={4}
                            value={noteFormText}
                            onChange={e => setNoteFormText(e.target.value)}
                            placeholder="Write a note..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setNoteModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveNote}
                            disabled={noteFormLoading || !noteFormText.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {noteFormLoading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
                            {editingNote ? "Update" : "Create"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Note Confirmation */}
            <ConfirmationModal
                isOpen={!!deleteNoteId}
                onClose={() => { setDeleteNoteId(null); setDeleteNoteSyllabusId(null); }}
                onConfirm={handleDeleteNote}
                title="Delete Note"
                message="Are you sure you want to delete this note? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                loading={deleteNoteLoading}
                variant="danger"
            />

            {/* Signature Form Modal */}
            <Modal isOpen={signatureModalOpen} onClose={handleCloseSignatureModal} showCloseButton={false} className="max-w-lg p-0">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                            {editingSignature ? "Edit Flying Details Signature" : "Add Flying Details Signature"}
                        </h3>
                        <button onClick={handleCloseSignatureModal} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                            <Icon icon="hugeicons:close-circle" className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            User <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={signatureFormUserId}
                            onChange={(e) => setSignatureFormUserId(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a user...</option>
                            {users
                                .filter(u => u.is_active)
                                .map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.rank?.short_name ? `${user.rank.short_name} ` : ''}{user.name} ({user.service_number})
                                    </option>
                                ))}
                        </select>
                        {usersLoading && <p className="text-sm text-gray-500 mt-1">Loading users...</p>}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Approved Date <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                            value={signatureFormDate}
                            onChange={(e) => setSignatureFormDate(e.target.value)}
                            placeholder="dd/mm/yyyy"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleCloseSignatureModal}
                            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveSignature}
                            disabled={signatureFormLoading || !signatureFormUserId || !signatureFormDate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {signatureFormLoading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
                            {editingSignature ? "Update" : "Save"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Signature Confirmation */}
            <ConfirmationModal
                isOpen={!!deleteSignatureId}
                onClose={() => setDeleteSignatureId(null)}
                onConfirm={handleDeleteSignature}
                title="Delete Signature"
                message="Are you sure you want to delete this signature? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                loading={deleteSignatureLoading}
                variant="danger"
            />
        </div>
    );
}
