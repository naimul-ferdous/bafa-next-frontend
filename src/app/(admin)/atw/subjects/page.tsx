/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AtwSubject } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { atwSubjectService } from "@/libs/services/atwSubjectService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import { useCan } from "@/context/PagePermissionsContext";

export default function AtwSubjectsPage() {
    const router = useRouter();
    const [subjects, setSubjects] = useState<AtwSubject[]>([]);
    const [loading, setLoading] = useState(true);
    const can = useCan();

    // Modal states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingSubject, setDeletingSubject] = useState<AtwSubject | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusSubject, setStatusSubject] = useState<AtwSubject | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const [currentModalOpen, setCurrentModalOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState<AtwSubject | null>(null);
    const [currentLoading, setCurrentLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    });

    const loadSubjects = useCallback(async () => {
        try {
            setLoading(true);
            const response = await atwSubjectService.getAllSubjects({
                page: currentPage,
                per_page: perPage,
                search: searchTerm || undefined,
            });

            setSubjects(response.data);
            setPagination({
                current_page: response.current_page,
                last_page: response.last_page,
                per_page: response.per_page,
                total: response.total,
                from: response.from,
                to: response.to,
            });
        } catch (error) {
            console.error("Failed to load subjects:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, perPage, searchTerm]);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    const handleAddSubject = () => router.push("/atw/subjects/create");
    const handleEditSubject = (subject: AtwSubject) => router.push(`/atw/subjects/${subject.id}/edit`);
    const handleViewSubject = (subject: AtwSubject) => router.push(`/atw/subjects/${subject.id}`);

    const confirmDelete = async () => {
        if (!deletingSubject) return;
        try {
            setDeleteLoading(true);
            await atwSubjectService.deleteSubject(deletingSubject.id);
            await loadSubjects();
            setDeleteModalOpen(false);
            setDeletingSubject(null);
        } catch (error) {
            console.error("Failed to delete subject:", error);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleToggleStatus = (subject: AtwSubject) => {
        setStatusSubject(subject);
        setStatusModalOpen(true);
    };

    const confirmToggleStatus = async () => {
        if (!statusSubject) return;
        try {
            setStatusLoading(true);
            await atwSubjectService.updateSubject(statusSubject.id, {
                is_active: !statusSubject.is_active
            });
            await loadSubjects();
            setStatusModalOpen(false);
            setStatusSubject(null);
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleToggleCurrent = (subject: AtwSubject) => {
        setCurrentSubject(subject);
        setCurrentModalOpen(true);
    };

    const confirmToggleCurrent = async () => {
        if (!currentSubject) return;
        try {
            setCurrentLoading(true);
            await atwSubjectService.updateSubject(currentSubject.id, {
                is_current: !currentSubject.is_current
            });
            await loadSubjects();
            setCurrentModalOpen(false);
            setCurrentSubject(null);
        } catch (error) {
            console.error("Failed to update current status:", error);
        } finally {
            setCurrentLoading(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const columns: Column<AtwSubject>[] = [
        {
            key: "id",
            header: "SL.",
            headerAlign: "center",
            className: "text-center text-gray-900",
            render: (subject, index) => (pagination.from || 0) + (index)
        },
        {
            key: "module",
            header: "Subject Name",
            className: "font-medium text-gray-900",
            render: (subject) => (
                <div>
                    <div>{subject.module?.subject_name}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{subject.module?.subject_code}</div>
                </div>
            )
        },
        {
            key: "course",
            header: "Course",
            render: (subject) => (
                <div className="max-w-[150px] truncate" title={subject.course?.name}>
                    {subject.course?.name || "—"}
                </div>
            )
        },
        {
            key: "semester",
            header: "Semester",
            render: (subject) => subject.semester?.name || "—"
        },
        {
            key: "program",
            header: "Program",
            render: (subject) => subject.program?.name || "—"
        },
        {
            key: "branch",
            header: "Branch",
            render: (subject) => subject.branch?.name || "—"
        },
        {
            key: "group",
            header: "Group",
            render: (subject) => subject.group?.name || "—"
        },
        {
            key: "is_current",
            header: "Current",
            headerAlign: "center",
            className: "text-center",
            render: (subject) => (
                <span
                    className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full ${subject.is_current
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                        }`}
                >
                    {subject.is_current ? "CURRENT" : "NOT CURRENT"}
                </span>
            ),
        },
        {
            key: "is_active",
            header: "Status",
            headerAlign: "center",
            className: "text-center",
            render: (subject) => (
                <span
                    className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full ${subject.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                        }`}
                >
                    {subject.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            headerAlign: "center",
            className: "text-center no-print",
            render: (subject: AtwSubject) => (
                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {can('edit') ? (
                        <button
                            onClick={() => handleEditSubject(subject)}
                            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                            title="Edit"
                        >
                            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                        </button>
                    ) : null}
                    {can('delete') ? (
                        <button
                            onClick={() => handleToggleCurrent(subject)}
                            className={`p-1 rounded transition-colors ${subject.is_current ? "text-gray-600 hover:bg-gray-50" : "text-blue-600 hover:bg-blue-50"}`}
                            title={subject.is_current ? "Set as Not Current" : "Set as Current"}
                        >
                            <Icon icon={subject.is_current ? "hugeicons:clock-01" : "hugeicons:clock-04"} className="w-4 h-4" />
                        </button>
                    ) : null}
                    {can("delete") ? (
                        subject.is_active ? (
                            <button
                                onClick={() => handleToggleStatus(subject)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Deactivate"
                            >
                                <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={() => handleToggleStatus(subject)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Activate"
                            >
                                <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
                            </button>
                        )
                    ) : null}
                </div>
            ),
        },
    ];

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 shadow-sm">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                    <FullLogo />
                </div>
                <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
                    Bangladesh Air Force Academy
                </h1>
                <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">
                    ATW Subject Mapping Management
                </h2>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative w-80">
                    <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Subjects..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {can('add') ? (
                        <button onClick={handleAddSubject} className="px-4 py-2 rounded-lg text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95 font-medium">
                            <Icon icon="hugeicons:add-circle" className="w-4 h-4 mr-2" />
                            New Subject
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="w-full min-h-[40vh] flex items-center justify-center">
                    <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={subjects}
                    keyExtractor={(subject) => subject.id.toString()}
                    emptyMessage="No subject mappings found"
                    onRowClick={can('view') ? handleViewSubject : undefined}
                />
            )}

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                lastPage={pagination.last_page}
                total={pagination.total}
                from={pagination.from}
                to={pagination.to}
                perPage={perPage}
                onPageChange={setCurrentPage}
                onPerPageChange={(val) => {
                    setPerPage(val);
                    setCurrentPage(1);
                }}
            />

            {/* Modals */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Mapping"
                message={`Are you sure you want to delete this subject mapping? This will remove the subject from this course context.`}
                confirmText="Delete"
                cancelText="Cancel"
                loading={deleteLoading}
                variant="danger"
            />

            <ConfirmationModal
                isOpen={statusModalOpen}
                onClose={() => setStatusModalOpen(false)}
                onConfirm={confirmToggleStatus}
                title={statusSubject?.is_active ? "Deactivate Mapping" : "Activate Mapping"}
                message={`Are you sure you want to ${statusSubject?.is_active ? "deactivate" : "activate"} the subject mapping for "${statusSubject?.module?.subject_name}"?`}
                confirmText={statusSubject?.is_active ? "Deactivate" : "Activate"}
                cancelText="Cancel"
                loading={statusLoading}
                variant={statusSubject?.is_active ? "danger" : "success"}
            />

            <ConfirmationModal
                isOpen={currentModalOpen}
                onClose={() => setCurrentModalOpen(false)}
                onConfirm={confirmToggleCurrent}
                title={currentSubject?.is_current ? "Unset Current" : "Set as Current"}
                message={`Are you sure you want to set "${currentSubject?.module?.subject_name}" as ${currentSubject?.is_current ? "not current" : "current"}?`}
                confirmText={currentSubject?.is_current ? "Unset" : "Set Current"}
                cancelText="Cancel"
                loading={currentLoading}
                variant={currentSubject?.is_current ? "warning" : "info"}
            />
        </div>
    );
}
