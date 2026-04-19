"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { ctwAttendenceResultService, type CtwAttendenceResult } from "@/libs/services/ctwAttendenceResultService";
import { FilePrintType } from "@/libs/types/filePrintType";
import PrintTypeModal from "@/components/ui/modal/PrintTypeModal";

const STATUS_STYLE: Record<string, { bg: string; text: string; ring: string; short: string }> = {
    present: { bg: "bg-green-50",  text: "text-green-700",  ring: "text-green-600",  short: "P" },
    leave:   { bg: "bg-red-50",    text: "text-red-700",    ring: "text-red-600",    short: "L" },
    off:     { bg: "bg-gray-100",  text: "text-gray-700",   ring: "text-gray-500",   short: "O" },
};

// Fallback style for dynamic medical schema statuses
const FALLBACK_STYLE = { bg: "bg-blue-50", text: "text-blue-700", ring: "text-blue-600" };

const getShortCode = (slug: string, label?: string): string => {
    if (STATUS_STYLE[slug]?.short) return STATUS_STYLE[slug].short;
    // Use uppercase slug or first letters of label
    return (slug || label || "?").toUpperCase().slice(0, 3);
};

interface AttendanceTypeCard {
    id: number;
    name: string;
    short_name: string;
    total_sessions: number;
    status_counts: Record<string, number>;
    status_catalog: { slug: string; label: string }[];
}

export default function CtwAttendanceCourseSemesterPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params?.courseId as string);
    const semesterId = parseInt(params?.semesterId as string);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);

    const [results, setResults] = useState<CtwAttendenceResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const [courseName, setCourseName] = useState("");
    const [semesterName, setSemesterName] = useState("");
    const [attendanceTypes, setAttendanceTypes] = useState<AttendanceTypeCard[]>([]);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingResult, setDeletingResult] = useState<CtwAttendenceResult | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const loadResults = useCallback(async () => {
        setLoading(true);
        try {
            const [resultsRes, typesRes] = await Promise.all([
                ctwAttendenceResultService.getAll({
                    course_id: courseId,
                    semester_id: semesterId,
                    page: 1,
                    per_page: 1000,
                }),
                ctwAttendenceResultService.getAttendanceTypesByCourseSemester(courseId, semesterId),
            ]);
            setResults(resultsRes.data);
            setPagination({
                current_page: resultsRes.current_page,
                last_page: resultsRes.last_page,
                per_page: resultsRes.per_page,
                total: resultsRes.total,
                from: resultsRes.from,
                to: resultsRes.to,
            });
            setAttendanceTypes(typesRes);
            if (resultsRes.data.length > 0) {
                setCourseName(resultsRes.data[0].course?.name ?? "");
                setSemesterName(resultsRes.data[0].semester?.name ?? "");
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [courseId, semesterId]);

    useEffect(() => { loadResults(); }, [loadResults]);

    const confirmDelete = async () => {
        if (!deletingResult) return;
        setDeleteLoading(true);
        try {
            await ctwAttendenceResultService.delete(deletingResult.id);
            setDeleteModalOpen(false);
            setDeletingResult(null);
            loadResults();
        } catch (e) { console.error(e); }
        finally { setDeleteLoading(false); }
    };

    const handlePrintClick = () => setIsPrintModalOpen(true);
    const confirmPrint = (type: FilePrintType) => {
        setSelectedPrintType(type);
        setIsPrintModalOpen(false);
        setTimeout(() => window.print(), 100);
    };

    const columns: Column<CtwAttendenceResult>[] = [
        {
            key: "id",
            header: "SL.",
            headerAlign: "center",
            className: "text-center",
            render: (_, i) => (pagination.from || 0) + i,
        },
        {
            key: "attendance_date",
            header: "Date",
            render: (r) => r.attendance_date
                ? new Date(r.attendance_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : <span className="text-gray-400">—</span>,
        },
        {
            key: "attendence_type_id",
            header: "Attendance Type",
            render: (r) => (
                <div>
                    <div className="font-medium text-gray-900">{r.attendence_type?.name ?? "—"}</div>
                    <div className="text-xs text-gray-500">{r.attendence_type?.short_name}</div>
                </div>
            ),
        },
        {
            key: "cadet_attendances_count",
            header: "Total",
            headerAlign: "center",
            className: "text-center",
            render: (r) => <span className="font-semibold">{r.cadet_attendances_count ?? 0}</span>,
        },
        {
            key: "present_count",
            header: "Present",
            headerAlign: "center",
            className: "text-center",
            render: (r) => <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">{r.present_count ?? 0}</span>,
        },
        {
            key: "absent_count",
            header: "Absent",
            headerAlign: "center",
            className: "text-center",
            render: (r) => <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">{r.absent_count ?? 0}</span>,
        },
        {
            key: "late_count",
            header: "Late",
            headerAlign: "center",
            className: "text-center",
            render: (r) => <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">{r.late_count ?? 0}</span>,
        },
        {
            key: "excused_count",
            header: "Excused",
            headerAlign: "center",
            className: "text-center",
            render: (r) => <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{r.excused_count ?? 0}</span>,
        },
        {
            key: "remarks",
            header: "Remarks",
            render: (r) => <span className="text-sm text-gray-600">{r.remarks || <span className="text-gray-400">—</span>}</span>,
        },
        {
            key: "id",
            header: "Actions",
            headerAlign: "center",
            className: "text-center no-print",
            render: (r) => (
                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => router.push(`/ctw/attendence/attend/${r.id}`)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"
                    >
                        <Icon icon="hugeicons:view" className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => router.push(`/ctw/attendence/attend/${r.id}/edit`)}
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"
                    >
                        <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => { setDeletingResult(r); setDeleteModalOpen(true); }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"
                    >
                        <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            <style jsx global>{`
                @media print {
                .cv-content { width: 100% !important; max-width: none !important; }
                table { font-size: 14px !important; }
                .print-div { max-width: 60vh !important; margin: 0 auto !important; }
                .no-print { display: none !important; }
                .tab-container { display: none !important; }
                .signature-section {
                    margin-top: 40px !important;
                    padding-top: 20px !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    gap: 40px !important;
                    padding-left: 8px !important;
                    padding-right: 8px !important;
                    page-break-inside: avoid !important;
                }
                .signature-box {
                    min-width: 180px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: flex-start !important;
                }
                .signature-box .sig-label {
                    font-size: 10px !important;
                    font-weight: 700 !important;
                    color: #b91c1c !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    margin-bottom: 4px !important;
                }
                .signature-box .sig-area {
                    height: 60px !important;
                    display: flex !important;
                    align-items: flex-end !important;
                    padding-bottom: 4px !important;
                    margin-bottom: 4px !important;
                }
                .signature-box .sig-name {
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    color: #111827 !important;
                    margin-top: 2px !important;
                }
                .signature-box .sig-rank {
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    color: #f97316 !important;
                }
                .signature-box .sig-designation {
                    font-size: 10px !important;
                    color: #374151 !important;
                }
                .signature-box .sig-date {
                    font-size: 10px !important;
                    color: #6b7280 !important;
                    padding-top: 3px !important;
                    border-top: 1px solid #1f2937 !important;
                    margin-top: 4px !important;
                }
                }
            `}</style>

            {/* Dynamic @page rules — overrides browser default header/footer with custom content */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A3 landscape;
                        margin: 14mm 10mm 14mm 10mm;

                        @top-left   { content: ""; }
                        @top-center {
                        content: "${(selectedPrintType?.name ?? '').replace(/"/g, '\\"')}";
                            font-size: 10pt;
                            white-space: pre;
                            text-align: center;
                            text-transform: uppercase;
                        }
                        @top-right  {
                            content: "";
                            font-size: 10pt;
                            text-align: right;
                        }

                        @bottom-left   { content: ""; }
                        @bottom-center {
                            content: "${(selectedPrintType?.name ?? '').replace(/"/g, '\\"')}" "\\A" counter(page);
                            font-size: 10pt;
                            white-space: pre;
                            text-align: center;
                            text-transform: uppercase;
                        }
                        @bottom-right  { content: ""; }
                    }
                }
            ` }} />
            {/* Action Bar */}
            <div className="p-4 flex items-center justify-between no-print">
                <button
                    onClick={() => history.back()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back to List
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={()=> router.push(`/ctw/attendence/attend/course/${courseId}`)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-white bg-blue-500 hover:bg-blue-600 flex items-center gap-2"
                    >
                        <Icon icon="hugeicons:note" className="w-4 h-4" />
                        Report
                    </button>
                    <button
                        onClick={handlePrintClick}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Icon icon="hugeicons:printer" className="w-4 h-4" />
                        Print
                    </button>
                </div>
            </div>

            <div className="p-4 cv-content space-y-4">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                    <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">CTW Attendance</h2>
                    {(courseName || semesterName) && (
                        <h2 className="text-md font-semibold text-gray-700 uppercase">{courseName}{courseName && semesterName ? " — " : ""}{semesterName}</h2>
                    )}
                </div>

                {/* Attendance Type Cards */}
                <div className="mb-6">
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => router.push(`/ctw/attendence/attend/create?course_id=${courseId}&semester_id=${semesterId}`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700"
                        >
                            <Icon icon="hugeicons:add-circle" className="w-4 h-4" /> Add Attendance
                        </button>
                    </div>
                    {loading ? (
                        <div className="w-full min-h-[20vh] flex items-center justify-center">
                            <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
                        </div>
                    ) : attendanceTypes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No attendance types found</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {attendanceTypes.map((type) => (
                                <div
                                    key={type.id}
                                    onClick={() => router.push(`/ctw/attendence/attend/course/${courseId}/semester/${semesterId}/${type.id}`)}
                                    className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{type.name}</h4>
                                            <p className="text-xs text-gray-500">{type.short_name}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                            {type.total_sessions} sessions
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        {(type.status_catalog || []).map((s) => {
                                            const style = STATUS_STYLE[s.slug] || FALLBACK_STYLE;
                                            const count = type.status_counts?.[s.slug] ?? 0;
                                            return (
                                                <div key={s.slug} className={`${style.bg} rounded py-1`} title={s.label}>
                                                    <div className={`text-xs font-semibold ${style.text}`}>{count}</div>
                                                    <div className={`text-[10px] ${style.ring}`}>{getShortCode(s.slug, s.label)}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Toolbar */}
                {/* <div className="flex items-center justify-end gap-4">
                    <button
                        onClick={() => router.push(`/ctw/attendence/attend/create?course_id=${courseId}&semester_id=${semesterId}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Icon icon="hugeicons:add-circle" className="w-4 h-4" /> Add Attendance
                    </button>
                </div> */}

                {/* Table */}
                {/* {loading ? (
                    <div className="w-full min-h-[20vh] flex items-center justify-center">
                        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={results}
                        keyExtractor={(r) => r.id.toString()}
                        emptyMessage="No attendance sessions found"
                        onRowClick={(r) => router.push(`/ctw/attendence/attend/${r.id}`)}
                    />
                )} */}

                {/* Pagination */}
                {/* {!loading && (
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600">Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} results</span>
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
                )} */}
            </div>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Attendance Session"
                message="Are you sure you want to delete this attendance session? All cadet records will be removed."
                confirmText="Delete"
                loading={deleteLoading}
                variant="danger"
            />
            <PrintTypeModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                onConfirm={confirmPrint}
            />
        </div>
    );
}
