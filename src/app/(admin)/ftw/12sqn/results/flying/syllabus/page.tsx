"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Ftw12sqnFlyingSyllabus, Ftw12sqnFlyingSyllabusGlobalNote } from "@/libs/types/ftw12sqnFlying";
import { Icon } from "@iconify/react";
import { ftw12sqnFlyingSyllabusService } from "@/libs/services/ftw12sqnFlyingSyllabusService";
import { ftw12sqnFlyingSyllabusGlobalNoteService } from "@/libs/services/ftw12sqnFlyingSyllabusGlobalNoteService";
import { ftw12sqnSyllabusSignatureService, Ftw12sqnSyllabusSignature } from "@/libs/services/ftw12sqnSyllabusSignatureService";
import { userService, User } from "@/libs/services/userService";
import FullLogo from "@/components/ui/fulllogo";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Modal } from "@/components/ui/modal";
import DatePicker from "@/components/form/input/DatePicker";

interface SyllabusTableRow {
    id: number;
    phase_full_name: string;
    phase_shortname: string;
    phase_symbol: string;
    phase_sort: number;
    semester_id: number | null;
    semester_name: string;
    dual_sorties: number;
    dual_hours: number;
    solo_sorties: number;
    solo_hours: number;
    total_sorties: number;
    total_hours: number;
    is_active: boolean;
    syllabus: Ftw12sqnFlyingSyllabus;
}

interface SemesterGroup {
    semester_id: number | null;
    semester_name: string;
    semester_details: any;
    syllabus: Ftw12sqnFlyingSyllabus[];
}

const formatHoursToHHMM = (hours: number | string | null): string => {
    if (hours === null || hours === undefined) return "-";
    const numHours = typeof hours === "string" ? parseFloat(hours) : hours;
    if (isNaN(numHours) || numHours === 0) return "-";
    const totalMinutes = Math.round(numHours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}:${m.toString().padStart(2, "0")}`;
};

const sumHoursToHHMM = (rows: SyllabusTableRow[], key: keyof SyllabusTableRow): string => {
    const totalMinutes = rows.reduce((s, r) => s + Math.round((Number(r[key]) || 0) * 60), 0);
    if (totalMinutes === 0) return "-";
    return `${Math.floor(totalMinutes / 60)}:${(totalMinutes % 60).toString().padStart(2, "0")}`;
};

export default function Ftw12sqnFlyingSyllabusPage() {
    const router = useRouter();
    const [groupedData, setGroupedData] = useState<SemesterGroup[]>([]);
    const [loading, setLoading] = useState(true);

    // Global Notes state
    const [globalNotes, setGlobalNotes] = useState<Ftw12sqnFlyingSyllabusGlobalNote[]>([]);
    const [globalNotesLoading, setGlobalNotesLoading] = useState(true);
    const [deleteGlobalNoteId, setDeleteGlobalNoteId] = useState<number | null>(null);
    const [deleteGlobalNoteLoading, setDeleteGlobalNoteLoading] = useState(false);

    // Modal states
    const [globalNoteModalOpen, setGlobalNoteModalOpen] = useState(false);
    const [globalNoteFormLoading, setGlobalNoteFormLoading] = useState(false);
    const [editingNote, setEditingNote] = useState<Ftw12sqnFlyingSyllabusGlobalNote | null>(null);
    const [noteFormText, setNoteFormText] = useState("");

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusSyllabus, setStatusSyllabus] = useState<SyllabusTableRow | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    // Flying Summary Signature state
    const [flyingSummarySignatures, setFlyingSummarySignatures] = useState<Ftw12sqnSyllabusSignature[]>([]);
    const [flyingSummaryLoading, setFlyingSummaryLoading] = useState(true);
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [signatureFormLoading, setSignatureFormLoading] = useState(false);
    const [signatureFormUserId, setSignatureFormUserId] = useState<number | "">("");
    const [signatureFormDate, setSignatureFormDate] = useState("");
    const [editingSignature, setEditingSignature] = useState<Ftw12sqnSyllabusSignature | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [deleteSignatureId, setDeleteSignatureId] = useState<number | null>(null);
    const [deleteSignatureLoading, setDeleteSignatureLoading] = useState(false);

    const loadSyllabus = useCallback(async () => {
        try {
            setLoading(true);
            const data = await ftw12sqnFlyingSyllabusService.getCourseGrouped();
            setGroupedData(data);
        } catch (error) {
            console.error("Failed to load grouped flying syllabus:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadGlobalNotes = useCallback(async () => {
        try {
            setGlobalNotesLoading(true);
            const data = await ftw12sqnFlyingSyllabusGlobalNoteService.getAll();
            setGlobalNotes(data);
        } catch (error) {
            console.error("Failed to load global notes:", error);
        } finally {
            setGlobalNotesLoading(false);
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

    const loadFlyingSummarySignatures = useCallback(async () => {
        try {
            setFlyingSummaryLoading(true);
            const data = await ftw12sqnSyllabusSignatureService.getAll({ type: 'flying_summary' });
            setFlyingSummarySignatures(data.data);
        } catch (error) {
            console.error("Failed to load flying summary signatures:", error);
        } finally {
            setFlyingSummaryLoading(false);
        }
    }, []);

    useEffect(() => { loadSyllabus(); loadGlobalNotes(); loadUsers(); loadFlyingSummarySignatures(); }, [loadSyllabus, loadGlobalNotes, loadUsers, loadFlyingSummarySignatures]);

    // Global Notes handlers
    const openAddNoteModal = () => {
        setEditingNote(null);
        setNoteFormText("");
        setGlobalNoteModalOpen(true);
    };

    const openEditNoteModal = (note: Ftw12sqnFlyingSyllabusGlobalNote) => {
        setEditingNote(note);
        setNoteFormText(note.note);
        setGlobalNoteModalOpen(true);
    };

    const handleSaveGlobalNote = async () => {
        if (!noteFormText.trim()) return;
        setGlobalNoteFormLoading(true);
        try {
            if (editingNote) {
                await ftw12sqnFlyingSyllabusGlobalNoteService.update(editingNote.id, { note: noteFormText.trim() });
            } else {
                await ftw12sqnFlyingSyllabusGlobalNoteService.create({ note: noteFormText.trim() });
            }
            setGlobalNoteModalOpen(false);
            await loadGlobalNotes();
        } catch (error) {
            console.error("Failed to save global note:", error);
        } finally {
            setGlobalNoteFormLoading(false);
        }
    };

    const handleDeleteGlobalNote = async () => {
        if (!deleteGlobalNoteId) return;
        setDeleteGlobalNoteLoading(true);
        await ftw12sqnFlyingSyllabusGlobalNoteService.delete(deleteGlobalNoteId);
        setDeleteGlobalNoteId(null);
        await loadGlobalNotes();
        setDeleteGlobalNoteLoading(false);
    };

    const handleToggleGlobalNoteStatus = async (note: Ftw12sqnFlyingSyllabusGlobalNote) => {
        await ftw12sqnFlyingSyllabusGlobalNoteService.update(note.id, { is_active: !note.is_active });
        await loadGlobalNotes();
    };

    const handleOpenSignatureModal = () => {
        setSignatureFormUserId("");
        setSignatureFormDate("");
        setSignatureModalOpen(true);
    };

    const handleCloseSignatureModal = () => {
        setSignatureModalOpen(false);
        setSignatureFormUserId("");
        setSignatureFormDate("");
    };

    const handleSaveSignature = async () => {
        if (!signatureFormUserId || !signatureFormDate) return;

        setSignatureFormLoading(true);
        try {
            // Convert date from dd/mm/yyyy to YYYY-MM-DD for API
            const [day, month, year] = signatureFormDate.split('/');
            const apiDate = `${year}-${month}-${day}`;

            await ftw12sqnSyllabusSignatureService.create({
                user_id: Number(signatureFormUserId),
                type: 'flying_summary',
                approved_date: apiDate,
            });

            handleCloseSignatureModal();
            await loadFlyingSummarySignatures();
        } catch (error) {
            console.error("Failed to save signature:", error);
        } finally {
            setSignatureFormLoading(false);
        }
    };

    const handleToggleSignatureStatus = async (signature: Ftw12sqnSyllabusSignature) => {
        await ftw12sqnSyllabusSignatureService.toggleStatus(signature.id);
        await loadFlyingSummarySignatures();
    };

    const handleDeleteSignature = async () => {
        if (!deleteSignatureId) return;
        setDeleteSignatureLoading(true);
        await ftw12sqnSyllabusSignatureService.remove(deleteSignatureId);
        setDeleteSignatureId(null);
        await loadFlyingSummarySignatures();
        setDeleteSignatureLoading(false);
    };

    const tableData = useMemo((): SyllabusTableRow[] => {
        const rows: SyllabusTableRow[] = [];
        groupedData.forEach(semesterGroup => {
            const sorted = [...(semesterGroup.syllabus || [])].sort(
                (a, b) => (a.phase_sort ?? 0) - (b.phase_sort ?? 0)
            );
            sorted.forEach(syllabus => {
                const dualType = syllabus.syllabus_types?.find(
                    st => st.phase_type?.type_code?.toLowerCase() === "dual"
                );
                const soloType = syllabus.syllabus_types?.find(
                    st => st.phase_type?.type_code?.toLowerCase() === "solo"
                );
                const dualSorties = dualType?.sorties || 0;
                const dualMinutes = (dualType?.exercises || []).reduce(
                    (sum, ex) => sum + Math.round(parseFloat(String(ex.take_time_hours || 0)) * 60), 0
                );
                const soloSorties = soloType?.sorties || 0;
                const soloMinutes = (soloType?.exercises || []).reduce(
                    (sum, ex) => sum + Math.round(parseFloat(String(ex.take_time_hours || 0)) * 60), 0
                );
                rows.push({
                    id: syllabus.id,
                    phase_full_name: syllabus.phase_full_name,
                    phase_shortname: syllabus.phase_shortname,
                    phase_symbol: syllabus.phase_symbol || "",
                    phase_sort: syllabus.phase_sort,
                    semester_id: semesterGroup.semester_id,
                    semester_name: semesterGroup.semester_name,
                    dual_sorties: dualSorties,
                    dual_hours: dualMinutes / 60,
                    solo_sorties: soloSorties,
                    solo_hours: soloMinutes / 60,
                    total_sorties: dualSorties + soloSorties,
                    total_hours: (dualMinutes + soloMinutes) / 60,
                    is_active: syllabus.is_active,
                    syllabus: syllabus,
                });
            });
        });
        return rows;
    }, [groupedData]);

    const confirmToggleStatus = async () => {
        if (!statusSyllabus) return;
        try {
            setStatusLoading(true);
            await ftw12sqnFlyingSyllabusService.update(statusSyllabus.id, {
                is_active: !statusSyllabus.is_active,
            });
            await loadSyllabus();
            setStatusModalOpen(false);
            setStatusSyllabus(null);
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setStatusLoading(false);
        }
    };

    const TableLoading = () => (
        <div className="w-full min-h-[20vh] flex items-center justify-center">
            <div><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" /></div>
        </div>
    );

    let slCounter = 0;

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            <div className="p-4 flex items-center justify-between no-print">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/ftw/12sqn/results/flying/syllabus/create")}
                        className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                    >
                        <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />Add Syllabus
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/ftw/12sqn/results/flying/syllabus/details")}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Icon icon="hugeicons:note" className="w-4 h-4" />
                        Details
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Icon icon="hugeicons:printer" className="w-4 h-4" />
                        Print
                    </button>
                </div>
            </div>

            <div className="p-4">
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 text-center">
                        <div className="flex justify-center mb-4"><FullLogo /></div>
                        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase underline">Summary of the basic Flying Syllabus</h2>
                        <h2 className="text-md font-semibold text-gray-700 uppercase underline">Grob G 120TP 12 SQN BAF</h2>
                        <h2 className="text-md font-semibold text-gray-700 uppercase underline">{sumHoursToHHMM(tableData, 'total_hours')} Hrs</h2>
                    </div>
                </div>

                {loading ? (
                    <TableLoading />
                ) : (
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
                                        <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                                            No flying syllabus found
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {tableData.map((row, index) => {
                                            slCounter++;
                                            const isLast = index === tableData.length - 1;

                                            return (
                                                <React.Fragment key={row.id}>
                                                    <tr
                                                        className={`hover:bg-gray-50 cursor-pointer ${!isLast ? "border-b border-black" : ""}`}
                                                        onClick={() => router.push(`/ftw/12sqn/results/flying/syllabus/${row.id}`)}
                                                    >
                                                        <td className="px-3 py-2 text-center font-medium text-gray-900 border-r border-black">
                                                            {slCounter}
                                                        </td>
                                                        <td className="px-4 py-2 text-gray-900 border-r border-black">
                                                            {row.phase_full_name}
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-gray-700 border-r border-black">
                                                            {row.dual_sorties || "-"}
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-gray-700 border-r border-black">
                                                            {formatHoursToHHMM(row.dual_hours)}
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-gray-700 border-r border-black">
                                                            {row.solo_sorties || "-"}
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-gray-700 border-r border-black">
                                                            {formatHoursToHHMM(row.solo_hours)}
                                                        </td>
                                                        <td className="px-3 py-2 text-center font-semibold text-gray-900 border-r border-black">
                                                            {row.total_sorties}
                                                        </td>
                                                        <td className="px-3 py-2 text-center font-semibold text-green-700 border-r border-black">
                                                            {formatHoursToHHMM(row.total_hours)}
                                                        </td>
                                                        <td className="px-3 py-2 text-center border-r border-black" onClick={e => e.stopPropagation()}>
                                                            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${row.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                                {row.is_active ? "Active" : "Inactive"}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center no-print" onClick={e => e.stopPropagation()}>
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => router.push(`/ftw/12sqn/results/flying/syllabus/${row.id}/edit`)}
                                                                    className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                                                                    title="Edit"
                                                                >
                                                                    <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                                                                </button>
                                                                {row.is_active ? (
                                                                    <button
                                                                        onClick={() => { setStatusSyllabus(row); setStatusModalOpen(true); }}
                                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                                        title="Deactivate"
                                                                    >
                                                                        <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => { setStatusSyllabus(row); setStatusModalOpen(true); }}
                                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                                        title="Activate"
                                                                    >
                                                                        <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}

                                        {/* Grand Total */}
                                        <tr className="font-bold border-t border-black">
                                            <td colSpan={2} className="px-4 py-2 text-xs text-center uppercase tracking-wide border-r border-black">
                                                Total
                                            </td>
                                            <td className="px-3 py-2 text-center border-r border-black">
                                                {tableData.reduce((s, r) => s + r.dual_sorties, 0)}
                                            </td>
                                            <td className="px-3 py-2 text-center border-r border-black">
                                                {sumHoursToHHMM(tableData, 'dual_hours')}
                                            </td>
                                            <td className="px-3 py-2 text-center border-r border-black">
                                                {tableData.reduce((s, r) => s + r.solo_sorties, 0)}
                                            </td>
                                            <td className="px-3 py-2 text-center border-r border-black">
                                                {sumHoursToHHMM(tableData, 'solo_hours')}
                                            </td>
                                            <td className="px-3 py-2 text-center border-r border-black">
                                                {tableData.reduce((s, r) => s + r.total_sorties, 0)}
                                            </td>
                                            <td className="px-3 py-2 text-center text-green-700 border-r border-black">
                                                {sumHoursToHHMM(tableData, 'total_hours')}
                                            </td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Global Notes Section */}
            <div className="mt-6 p-4 no-print">
                <div className="flex justify-between items-center mb-3 pb-1">
                    <h2 className="text-lg font-bold text-gray-900">Note:</h2>
                    <button
                        onClick={openAddNoteModal}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs flex items-center gap-1"
                    >
                        <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                        Add Note
                    </button>
                </div>

                {/* Global Notes list */}
                {globalNotes.length > 0 ? (
                    <div className="space-y-3">
                        {[...globalNotes].sort((a, b) => a.id - b.id).map((note, index) => (
                            <div key={note.id} className={`flex items-center gap-4 ${!note.is_active ? "opacity-60 bg-gray-50" : "bg-white border-gray-300"}`}>
                                <div className="w-8 text-center font-semibold text-gray-600">{index + 1}.</div>
                                <div className="flex-1">
                                    <span className="text-gray-800 whitespace-pre-wrap">{note.note}</span>
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                    <button
                                        onClick={() => openEditNoteModal(note)}
                                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                                        title="Edit"
                                    >
                                        <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleGlobalNoteStatus(note)}
                                        className={`p-1 rounded ${note.is_active ? "text-orange-500 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`}
                                        title={note.is_active ? "Deactivate" : "Activate"}
                                    >
                                        <Icon icon={note.is_active ? "hugeicons:unavailable" : "hugeicons:checkmark-circle-02"} className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteGlobalNoteId(note.id)}
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
                    <p className="text-gray-500 text-center py-4">No global notes yet. Add one above.</p>
                )}
            </div>

            {/* Flying Summary Signature Section */}
            <div className="mt-6 p-4 no-print">
                {flyingSummarySignatures.length === 0 && (
                    <div className="flex justify-between items-center mb-3 pb-1">
                        <h2 className="text-lg font-bold text-gray-900">Signature:</h2>
                        {/* Show Add Signature button only if no signatures exist */}
                        <button
                            onClick={() => handleOpenSignatureModal()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs flex items-center gap-1"
                        >
                            <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                            Add Signature
                        </button>

                    </div>
                )}

                {/* Signatures list */}
                {flyingSummarySignatures.length > 0 ? (
                    <div className="space-y-3">
                        {[...flyingSummarySignatures]
                            .sort((a, b) => new Date(b.approved_date || 0).getTime() - new Date(a.approved_date || 0).getTime())
                            .map((signature, index) => (
                                <div key={signature.id} className={`flex items-start justify-end gap-4 p-3`}>
                                    {/* User Details */}
                                    <div className="min-w-0">
                                        <div className="flex flex-col gap-1">
                                            <div className="w-32 h-20 ">
                                                {signature.user?.signature ? (
                                                    <img
                                                        src={signature.user.signature}
                                                        alt="Signature"
                                                        className="max-w-full max-h-full object-contain p-1"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-gray-400 text-center px-1">No signature</span>
                                                )}
                                            </div>
                                            {/* Name */}
                                            <span className="text-gray-800 font-medium text-base">
                                                {signature.user?.name || 'Unknown User'}
                                            </span>
                                            {/* Rank */}
                                            {signature.user?.rank?.short_name && (
                                                <span className="text-gray-700 text-sm">
                                                    {signature.user.rank.short_name}
                                                </span>
                                            )}
                                        {/* All Assigned Roles */}
                                        {(() => {
                                            const roles = signature.user?.roles || [];
                                            if (roles && roles.length > 0) {
                                                return (
                                                    <div className="flex flex-wrap gap-1">
                                                        {roles.map((role, idx) => (
                                                            <span key={role.id || idx} className="text-gray-600 text-sm">
                                                                {role.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            // Fallback to primary role
                                            if (signature.user?.role) {
                                                return (
                                                    <span className="text-gray-600 text-sm bg-gray-100 px-2 py-0.5 rounded w-fit">
                                                        {typeof signature.user.role === 'object' ? signature.user.role.name : signature.user.role}
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })()}
                                            {/* Approved Date */}
                                            {signature.approved_date && (
                                                <span className="text-gray-500 text-sm mt-1">
                                                    Approved: {new Date(signature.approved_date).toLocaleDateString('en-GB')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-start justify-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => handleOpenSignatureModal(signature)}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit"
                                            >
                                                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleSignatureStatus(signature)}
                                                className={`p-1 rounded ${signature.is_active ? "text-orange-500 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`}
                                                title={signature.is_active ? "Deactivate" : "Activate"}
                                            >
                                                <Icon icon={signature.is_active ? "hugeicons:unavailable" : "hugeicons:checkmark-circle-02"} className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteSignatureId(signature.id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                title="Delete"
                                            >
                                                <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">No signatures yet. Add one above.</p>
                )}
            </div>

            <ConfirmationModal
                isOpen={statusModalOpen}
                onClose={() => setStatusModalOpen(false)}
                onConfirm={confirmToggleStatus}
                title={statusSyllabus?.is_active ? "Deactivate Syllabus" : "Activate Syllabus"}
                message={`Are you sure you want to ${statusSyllabus?.is_active ? "deactivate" : "activate"} the syllabus "${statusSyllabus?.phase_full_name}"?`}
                confirmText={statusSyllabus?.is_active ? "Deactivate" : "Activate"}
                cancelText="Cancel"
                loading={statusLoading}
                variant={statusSyllabus?.is_active ? "danger" : "success"}
            />

            {/* Global Note Form Modal */}
            <Modal isOpen={globalNoteModalOpen} onClose={() => setGlobalNoteModalOpen(false)} showCloseButton={false} className="max-w-xl p-0">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                            {editingNote ? "Edit Global Note" : "Add Global Note"}
                        </h3>
                        <button
                            onClick={() => setGlobalNoteModalOpen(false)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                            <Icon icon="hugeicons:close-circle" className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Note
                        </label>
                        <textarea
                            rows={4}
                            value={noteFormText}
                            onChange={e => setNoteFormText(e.target.value)}
                            placeholder="Write a global note..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setGlobalNoteModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveGlobalNote}
                            disabled={globalNoteFormLoading || !noteFormText.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {globalNoteFormLoading && <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />}
                            {editingNote ? "Update" : "Create"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Signature Form Modal */}
            <Modal isOpen={signatureModalOpen} onClose={handleCloseSignatureModal} showCloseButton={false} className="max-w-lg p-0">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                            {editingSignature ? "Edit Flying Summary Signature" : "Add Flying Summary Signature"}
                        </h3>
                        <button
                            onClick={handleCloseSignatureModal}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
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
                            required
                        >
                            <option value="">Select a user...</option>
                            {users
                                .filter(u => u.is_active)
                                .map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.rank?.short_name ? `${user.rank.short_name} ` : ''}{user.name} ({user.service_number})
                                    </option>
                                ))
                            }
                        </select>
                        {usersLoading && (
                            <p className="text-sm text-gray-500 mt-1">Loading users...</p>
                        )}
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

            {/* Delete Signature Confirmation Modal */}
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

            <ConfirmationModal
                isOpen={!!deleteGlobalNoteId}
                onClose={() => setDeleteGlobalNoteId(null)}
                onConfirm={handleDeleteGlobalNote}
                title="Delete Global Note"
                message="Are you sure you want to delete this global note? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                loading={deleteGlobalNoteLoading}
                variant="danger"
            />
        </div>
    );
}
