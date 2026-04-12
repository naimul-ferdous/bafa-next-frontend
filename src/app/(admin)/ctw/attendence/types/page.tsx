"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TimePicker from "@/components/form/TimePicker";
import { useCan } from "@/context/PagePermissionsContext";
import {
    ctwAttendenceTypeService,
    type CtwAttendenceType,
    type CtwAttendenceTypeFormData,
} from "@/libs/services/ctwAttendenceTypeService";

const EMPTY_FORM: CtwAttendenceTypeFormData = {
    name: "",
    short_name: "",
    start_time: "",
    end_time: "",
    is_active: true,
};

export default function CtwAttendenceTypesPage() {
    const can = useCan();

    const [types, setTypes] = useState<CtwAttendenceType[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");

    // Form modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<CtwAttendenceType | null>(null);
    const [form, setForm] = useState<CtwAttendenceTypeFormData>(EMPTY_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Delete modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingType, setDeletingType] = useState<CtwAttendenceType | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const loadTypes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ctwAttendenceTypeService.getAll({
                page: currentPage,
                per_page: perPage,
                search: searchTerm || undefined,
            });
            setTypes(res.data);
            setPagination({
                current_page: res.current_page,
                last_page: res.last_page,
                per_page: res.per_page,
                total: res.total,
                from: res.from,
                to: res.to,
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [currentPage, perPage, searchTerm]);

    useEffect(() => { loadTypes(); }, [loadTypes]);

    const openAdd = () => {
        setEditingType(null);
        setForm(EMPTY_FORM);
        setFormError(null);
        setModalOpen(true);
    };

    const openEdit = (type: CtwAttendenceType) => {
        setEditingType(type);
        setForm({
            name: type.name,
            short_name: type.short_name,
            start_time: type.start_time ?? "",
            end_time: type.end_time ?? "",
            is_active: type.is_active,
        });
        setFormError(null);
        setModalOpen(true);
    };

    const openDelete = (type: CtwAttendenceType) => {
        setDeletingType(type);
        setDeleteModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);
        try {
            const payload: CtwAttendenceTypeFormData = {
                ...form,
                start_time: form.start_time || null,
                end_time: form.end_time || null,
            };
            if (editingType) {
                await ctwAttendenceTypeService.update(editingType.id, payload);
            } else {
                await ctwAttendenceTypeService.create(payload);
            }
            setModalOpen(false);
            loadTypes();
        } catch (err: any) {
            setFormError(err?.message || "Failed to save");
        } finally {
            setFormLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deletingType) return;
        setDeleteLoading(true);
        try {
            await ctwAttendenceTypeService.delete(deletingType.id);
            setDeleteModalOpen(false);
            setDeletingType(null);
            loadTypes();
        } catch (e) {
            console.error(e);
        } finally {
            setDeleteLoading(false);
        }
    };

    const columns: Column<CtwAttendenceType>[] = [
        {
            key: "id",
            header: "SL.",
            className: "text-center w-12",
            render: (_, index) => (pagination.from || 0) + index,
        },
        {
            key: "name",
            header: "Name",
            className: "font-medium text-gray-900",
        },
        {
            key: "short_name",
            header: "Short Name",
            className: "font-mono text-gray-700",
        },
        {
            key: "start_time",
            header: "Start Time",
            headerAlign: "center",
            className: "text-center",
            render: (t) => t.start_time || <span className="text-gray-400">—</span>,
        },
        {
            key: "end_time",
            header: "End Time",
            headerAlign: "center",
            className: "text-center",
            render: (t) => t.end_time || <span className="text-gray-400">—</span>,
        },
        {
            key: "is_active",
            header: "Status",
            className: "text-center",
            render: (t) => (
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${t.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {t.is_active ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            key: "id",
            header: "Actions",
            headerAlign: "center",
            className: "text-center no-print",
            render: (t) => (
                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* {can("edit") && ( */}
                        <button onClick={() => openEdit(t)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
                            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                        </button>
                    {/* )} */}
                    {/* {can("delete") && ( */}
                        <button onClick={() => openDelete(t)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                        </button>
                    {/* )} */}
                </div>
            ),
        },
    ];

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="flex justify-center mb-3"><FullLogo /></div>
                <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">CTW Attendance Types</h2>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-72">
                    <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                </div>
                {/* {can("add") && ( */}
                <button
                    onClick={openAdd}
                    className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
                >
                    <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    Add Type
                </button>
                {/* )} */}
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[20vh]">
                    <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={types}
                    keyExtractor={(t) => t.id.toString()}
                    emptyMessage="No attendance types found"
                />
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">
                        Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results
                    </span>
                    <select
                        value={perPage}
                        onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none"
                    >
                        {[10, 25, 50].map((n) => <option key={n} value={n}>{n} per page</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                        <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline" /> Prev
                    </button>
                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((p) => (
                        <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 rounded-lg ${currentPage === p ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"}`}>{p}</button>
                    ))}
                    <button onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))} disabled={currentPage === pagination.last_page} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                        Next <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline" />
                    </button>
                </div>
            </div>

            {/* Add / Edit Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} showCloseButton className="max-w-2xl p-0">
                <form onSubmit={handleSubmit} className="p-8">
                    {/* Logo and Header */}
                    <div className="flex flex-col items-center mb-6">
                        <div><FullLogo /></div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {editingType ? "Edit Attendance Type" : "Add Attendance Type"}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {editingType ? "Update attendance type details" : "Configure new attendance type details"}
                        </p>
                    </div>

                    {formError && (
                        <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                            {formError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Name <span className="text-red-500">*</span></Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Morning Parade"
                                    required
                                />
                            </div>
                            <div>
                                <Label>Short Name <span className="text-red-500">*</span></Label>
                                <Input
                                    value={form.short_name}
                                    onChange={(e) => setForm((f) => ({ ...f, short_name: e.target.value }))}
                                    placeholder="e.g. MP"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Time</Label>
                                <TimePicker
                                    id="ctw-start-time"
                                    value={form.start_time ?? ""}
                                    onChange={(t) => setForm((f) => ({ ...f, start_time: t }))}
                                    placeholder="Start time"
                                />
                            </div>
                            <div>
                                <Label>End Time</Label>
                                <TimePicker
                                    id="ctw-end-time"
                                    value={form.end_time ?? ""}
                                    onChange={(t) => setForm((f) => ({ ...f, end_time: t }))}
                                    placeholder="End time"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="mb-3">Status</Label>
                            <div className="space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="is_active"
                                        checked={form.is_active === true}
                                        onChange={() => setForm((f) => ({ ...f, is_active: true }))}
                                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">Active:</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">This attendance type will be available for use throughout the system.</div>
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="is_active"
                                        checked={form.is_active === false}
                                        onChange={() => setForm((f) => ({ ...f, is_active: false }))}
                                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">Inactive:</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">This attendance type will be hidden from general use.</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6 pt-2">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className="px-6 py-2 border border-gray-300 text-black rounded-xl"
                            disabled={formLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="px-6 py-2 bg-blue-500 text-white rounded-xl disabled:opacity-50"
                        >
                            {formLoading ? "Saving..." : editingType ? "Update Type" : "Save Type"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Attendance Type"
                message={`Are you sure you want to delete "${deletingType?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                loading={deleteLoading}
                variant="danger"
            />
        </div>
    );
}
