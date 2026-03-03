/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AtwSubject, SystemCourse, SystemSemester, SystemProgram, SystemBranch } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import { atwSubjectService } from "@/libs/services/atwSubjectService";
import { commonService } from "@/libs/services/commonService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import { useCan } from "@/context/PagePermissionsContext";
import { useAuth } from "@/libs/hooks/useAuth";
import { atwInstructorAssignSubjectService } from "@/libs/services/atwInstructorAssignSubjectService";
import type { AtwInstructorAssignSubject } from "@/libs/types/user";

export default function AtwSubjectsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const isInstructor = !!user?.instructor_biodata;
    const [subjects, setSubjects] = useState<AtwSubject[]>([]);
    const [loading, setLoading] = useState(true);
    const can = useCan();

    // Instructor-specific state
    const [instructorAssignments, setInstructorAssignments] = useState<AtwInstructorAssignSubject[]>([]);
    const [instructorLoading, setInstructorLoading] = useState(false);

    // Filter options
    const [filterOptions, setFilterOptions] = useState<{
        courses: SystemCourse[];
        semesters: SystemSemester[];
        programs: SystemProgram[];
        branches: SystemBranch[];
    }>({ courses: [], semesters: [], programs: [], branches: [] });

    // Advanced filter toggle
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

    // Active filters
    const [filterCourse, setFilterCourse] = useState(0);
    const [filterSemester, setFilterSemester] = useState(0);
    const [filterProgram, setFilterProgram] = useState(0);
    const [filterBranch, setFilterBranch] = useState(0);

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkDisableModalOpen, setBulkDisableModalOpen] = useState(false);
    const [bulkDisableLoading, setBulkDisableLoading] = useState(false);

    // Modal states
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

    // Load instructor assignments when user is an instructor
    useEffect(() => {
        if (!isInstructor || !user?.id) return;
        setInstructorLoading(true);
        atwInstructorAssignSubjectService.getByInstructor(user.id).then(data => {
            setInstructorAssignments(data);
            setInstructorLoading(false);
        });
    }, [isInstructor, user?.id]);

    // Load filter options once
    useEffect(() => {
        commonService.getResultOptions().then(data => {
            if (data) {
                setFilterOptions({
                    courses: data.courses || [],
                    semesters: data.semesters || [],
                    programs: data.programs || [],
                    branches: data.branches || [],
                });
            }
        });
    }, []);

    const loadSubjects = useCallback(async () => {
        try {
            setLoading(true);
            setSelectedIds(new Set());
            const response = await atwSubjectService.getAllSubjects({
                page: currentPage,
                per_page: perPage,
                search: searchTerm || undefined,
                course_id: filterCourse || undefined,
                semester_id: filterSemester || undefined,
                program_id: filterProgram || undefined,
                branch_id: filterBranch || undefined,
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
    }, [currentPage, perPage, searchTerm, filterCourse, filterSemester, filterProgram, filterBranch]);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    const handleAddSubject = () => router.push("/atw/subjects/create");
    const handleEditSubject = (subject: AtwSubject) => { if (subject.id) router.push(`/atw/subjects/${subject.id}/edit`); };
    const handleViewSubject = (subject: AtwSubject) => { if (subject.id) router.push(`/atw/subjects/${subject.id}`); };

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

    const handleFilterChange = () => setCurrentPage(1);

    const clearFilters = () => {
        setFilterCourse(0);
        setFilterSemester(0);
        setFilterProgram(0);
        setFilterBranch(0);
        setCurrentPage(1);
    };

    const toggleAdvancedFilter = () => {
        if (showAdvancedFilter) {
            clearFilters();
            setSelectedIds(new Set());
        }
        setShowAdvancedFilter(prev => !prev);
    };

    const hasActiveFilters = filterCourse || filterSemester || filterProgram || filterBranch;

    // Bulk selection helpers
    const allSelected = subjects.length > 0 && subjects.every(s => selectedIds.has(s.id));
    const someSelected = subjects.some(s => selectedIds.has(s.id));

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(subjects.map(s => s.id)));
        }
    };

    const toggleSelectOne = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const confirmBulkDisable = async () => {
        try {
            setBulkDisableLoading(true);
            await atwSubjectService.bulkDisable([...selectedIds]);
            await loadSubjects();
            setBulkDisableModalOpen(false);
        } catch (error) {
            console.error("Failed to bulk disable:", error);
        } finally {
            setBulkDisableLoading(false);
        }
    };

    // ── Instructor view ──────────────────────────────────────────────────────
    if (isInstructor) {
        const instructorColumns: Column<AtwInstructorAssignSubject>[] = [
            {
                key: "sl",
                header: "SL.",
                headerAlign: "center",
                className: "text-center w-12 text-gray-800",
                render: (_, index) => index + 1,
            },
            {
                key: "subject_code",
                header: "Subject Code",
                className: "text-gray-800 font-mono text-sm",
                render: (a) => (a.subject as any)?.module?.subject_code ?? "—",
            },
            {
                key: "subject_name",
                header: "Subject Name",
                className: "text-gray-800 font-medium",
                render: (a) => (a.subject as any)?.module?.subject_name ?? "—",
            },
            {
                key: "credit",
                header: "Credit",
                headerAlign: "center",
                className: "text-center text-gray-800",
                render: (a) => (a.subject as any)?.module?.subjects_credit ?? "—",
            },
            {
                key: "total_mark",
                header: "Total Mark",
                headerAlign: "center",
                className: "text-center text-gray-800",
                render: (a) => (a.subject as any)?.module?.subjects_full_mark ?? "—",
            },
            {
                key: "semester",
                header: "Semester",
                className: "text-gray-800",
                render: (a) => a.semester?.name ?? "—",
            },
            {
                key: "syllabus",
                header: "Syllabus",
                headerAlign: "center",
                className: "text-center",
                render: (a) => (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (a.subject_id) router.push(`/atw/subjects/${a.subject_id}`);
                        }}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 mx-auto"
                    >
                        <Icon icon="hugeicons:book-open-01" className="w-3.5 h-3.5" />
                        View
                    </button>
                ),
            },
        ];

        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 shadow-sm">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
                    <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">My Assigned Subjects</h2>
                </div>

                {instructorLoading ? (
                    <div className="w-full min-h-[40vh] flex items-center justify-center">
                        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                ) : instructorAssignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                        <Icon icon="hugeicons:book-02" className="w-12 h-12" />
                        <p className="text-sm font-medium">No subjects assigned yet.</p>
                    </div>
                ) : (
                    <DataTable
                        columns={instructorColumns}
                        data={instructorAssignments}
                        keyExtractor={(a) => a.id.toString()}
                        onRowClick={(a) => { if (a.subject_id) router.push(`/atw/subjects/${a.subject_id}`); }}
                        emptyMessage="No subjects assigned"
                    />
                )}
            </div>
        );
    }
    // ─────────────────────────────────────────────────────────────────────────

    const checkboxColumn: Column<AtwSubject> = {
        key: "checkbox",
        header: (
            <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                onClick={e => e.stopPropagation()}
            />
        ),
        headerAlign: "center",
        className: "text-center w-10",
        render: (subject) => (
            <input
                type="checkbox"
                checked={selectedIds.has(subject.id)}
                onChange={() => toggleSelectOne(subject.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                onClick={e => e.stopPropagation()}
            />
        ),
    };

    const columns: Column<AtwSubject>[] = [
        ...(showAdvancedFilter ? [checkboxColumn] : []),
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
            key: "is_current",
            header: "Current",
            headerAlign: "center",
            className: "text-center",
            render: (subject) => (
                <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full ${subject.is_current ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
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
                <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full ${subject.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
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
                    ATW Subject Management
                </h2>
            </div>

            {/* Search & Add */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative w-72">
                        <Icon icon="hugeicons:search-01" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Subjects..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        />
                    </div>
                    <button
                        onClick={toggleAdvancedFilter}
                        className={`px-3 py-2 text-sm rounded-lg border flex items-center gap-1.5 transition-colors ${showAdvancedFilter
                            ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        <Icon icon="hugeicons:filter" className="w-4 h-4" />
                        Advanced Filter
                        {hasActiveFilters ? (
                            <span className="ml-1 w-4 h-4 text-[10px] font-bold bg-white text-blue-600 rounded-full flex items-center justify-center">
                                {[filterCourse, filterSemester, filterProgram, filterBranch].filter(Boolean).length}
                            </span>
                        ) : null}
                    </button>
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

            {/* Advanced Filters Panel */}
            {showAdvancedFilter && (
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 gap-2 space-x-2 flex flex-wrap items-center">
                        <select
                            value={filterCourse}
                            onChange={(e) => { setFilterCourse(Number(e.target.value)); setFilterSemester(0); handleFilterChange(); }}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[80px]"
                        >
                            <option value={0}>All Courses</option>
                            {filterOptions.courses.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                            ))}
                        </select>

                        <select
                            value={filterSemester}
                            onChange={(e) => { setFilterSemester(Number(e.target.value)); handleFilterChange(); }}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[80px]"
                        >
                            <option value={0}>All Semesters</option>
                            {filterOptions.semesters.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                        </select>

                        <select
                            value={filterProgram}
                            onChange={(e) => { setFilterProgram(Number(e.target.value)); handleFilterChange(); }}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[80px]"
                        >
                            <option value={0}>All Programs</option>
                            {filterOptions.programs.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                            ))}
                        </select>

                        <select
                            value={filterBranch}
                            onChange={(e) => { setFilterBranch(Number(e.target.value)); handleFilterChange(); }}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[80px]"
                        >
                            <option value={0}>All Branches</option>
                            {filterOptions.branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                            ))}
                        </select>

                        {hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1 transition-colors"
                            >
                                <Icon icon="hugeicons:cancel-01" className="w-4 h-4" />
                                Clear Filters
                            </button>
                        ) : null}
                    </div>
                    {selectedIds.size > 0 && (
                        <div className="flex justify-end items-center gap-3">
                            <span className="text-sm font-medium text-blue-700">
                                {selectedIds.size} item{selectedIds.size > 1 ? "s" : ""} selected
                            </span>
                            <div className="flex items-center gap-2 ml-auto">
                                {can('delete') && (
                                    <button
                                        onClick={() => setBulkDisableModalOpen(true)}
                                        className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1.5 transition-colors"
                                    >
                                        <Icon icon="hugeicons:unavailable" className="w-4 h-4" />
                                        Disable Selected
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Bulk Action Bar */}


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
                isOpen={bulkDisableModalOpen}
                onClose={() => setBulkDisableModalOpen(false)}
                onConfirm={confirmBulkDisable}
                title="Disable Selected"
                message={`Are you sure you want to disable ${selectedIds.size} selected subject mapping${selectedIds.size > 1 ? "s" : ""}? They can be re-enabled individually later.`}
                confirmText="Disable All"
                cancelText="Cancel"
                loading={bulkDisableLoading}
                variant="warning"
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
