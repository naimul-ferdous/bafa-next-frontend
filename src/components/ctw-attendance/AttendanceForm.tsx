/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/input/DatePicker";
import { commonService } from "@/libs/services/commonService";
import {
    ctwAttendenceResultService,
    type CtwAttendenceCadetOption,
    type AttendanceStatus,
} from "@/libs/services/ctwAttendenceResultService";
import { ctwAttendenceTypeService, type CtwAttendenceType } from "@/libs/services/ctwAttendenceTypeService";
import type { SystemCourse, SystemSemester, SystemExam } from "@/libs/types/system";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; short: string; color: string }[] = [
    { value: "present", label: "Present", short: "P", color: "bg-green-500 text-white" },
    { value: "absent", label: "Absent", short: "A", color: "bg-red-500 text-white" },
    { value: "late", label: "Late", short: "L", color: "bg-yellow-500 text-white" },
    { value: "excused", label: "Excused", short: "E", color: "bg-blue-500 text-white" },
];

const getTodayDate = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

interface CadetRow {
    id: number;
    cadet_number: string;
    name: string;
    rank: string;
    status: AttendanceStatus;
    remarks: string;
}

interface AttendanceFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    isEdit?: boolean;
    initialData?: {
        course_id: number;
        semester_id: number;
        attendence_type_id: number;
        attendance_date: string | null;
        remarks: string | null;
        cadet_attendances?: { cadet_id: number; status: AttendanceStatus; remarks: string | null }[];
    };
}

export default function AttendanceForm({ onSubmit, onCancel, loading, isEdit = false, initialData }: AttendanceFormProps) {
    const [formData, setFormData] = useState({
        course_id: 0,
        semester_id: 0,
    });

    const [courses, setCourses] = useState<SystemCourse[]>([]);
    const [semesters, setSemesters] = useState<SystemSemester[]>([]);
    const [exams, setExams] = useState<SystemExam[]>([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(true);
    const [loadingSemesters, setLoadingSemesters] = useState(false);

    const [attendenceTypes, setAttendenceTypes] = useState<CtwAttendenceType[]>([]);
    const [cadets, setCadets] = useState<CadetRow[]>([]);
    const [cadetsLoading, setCadetsLoading] = useState(true);

    const [formTypeId, setFormTypeId] = useState<number | "">("");
    const [formDate, setFormDate] = useState(getTodayDate);
    const [formRemarks, setFormRemarks] = useState("");

    const [existingAttendanceId, setExistingAttendanceId] = useState<number | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);

    const [error, setError] = useState("");

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const data = await commonService.getResultOptions();
                if (data) {
                    setCourses(data.courses || []);
                    setExams(data.exams || []);
                }
                const typeRes = await ctwAttendenceTypeService.getAll({ per_page: 100 });
                setAttendenceTypes(typeRes.data.filter((t: any) => t.is_active));
            } catch (err) {
                console.error("Failed to load options:", err);
                setError("Failed to load required data.");
            } finally {
                setLoadingDropdowns(false);
            }
        };
        loadOptions();
    }, []);

    useEffect(() => {
        if (initialData && !loadingDropdowns) {
            setFormData({
                course_id: initialData.course_id,
                semester_id: initialData.semester_id,
            });
            setFormTypeId(initialData.attendence_type_id);
            if (initialData.attendance_date) {
                const d = new Date(initialData.attendance_date);
                setFormDate(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
            } else {
                setFormDate(getTodayDate);
            }
            setFormRemarks(initialData.remarks || "");
        }
    }, [initialData, loadingDropdowns]);

    useEffect(() => {
        if (!formData.course_id) {
            setSemesters([]);
            return;
        }

        const loadSemesters = async () => {
            try {
                setLoadingSemesters(true);
                const result = await commonService.getSemestersByCourse(formData.course_id);
                setSemesters(result);
            } catch (err) {
                console.error("Failed to load semesters:", err);
                setSemesters([]);
            } finally {
                setLoadingSemesters(false);
            }
        };
        loadSemesters();
    }, [formData.course_id]);

    useEffect(() => {
        if (!formData.course_id || !formData.semester_id) {
            setCadets([]);
            setCadetsLoading(false);
            return;
        }

        ctwAttendenceResultService.getCadetsForAttendance(formData.course_id, formData.semester_id)
            .then((list: CtwAttendenceCadetOption[]) => {
                let existingMap: Record<number, { status: AttendanceStatus; remarks: string }> = {};
                if (initialData?.cadet_attendances) {
                    initialData.cadet_attendances.forEach((a) => {
                        existingMap[a.cadet_id] = { status: a.status, remarks: a.remarks || "" };
                    });
                }
                const rows: CadetRow[] = list.map((c) => ({
                    id: c.id,
                    cadet_number: c.cadet_number,
                    name: c.name,
                    rank: c.assigned_ranks?.[0]?.rank?.short_name ?? "Cadet",
                    status: existingMap[c.id]?.status || "present",
                    remarks: existingMap[c.id]?.remarks || "",
                }));
                setCadets(rows);
            })
            .catch(console.error)
            .finally(() => setCadetsLoading(false));
    }, [formData.course_id, formData.semester_id, initialData]);

    useEffect(() => {
        if (!formData.course_id || !formData.semester_id || !formTypeId) {
            setExistingAttendanceId(null);
            setIsReadOnly(false);
            return;
        }

        const checkExisting = async () => {
            if (isEdit || initialData) return;
            try {
                const apiDate = convertToApiDate(formDate);
                const existing = await ctwAttendenceResultService.checkExisting(
                    formData.course_id,
                    formData.semester_id,
                    formTypeId,
                    apiDate
                );
                if (existing) {
                    setExistingAttendanceId(existing.id);
                    setIsReadOnly(true);
                    if (existing.cadet_attendances) {
                        const existingMap = new Map(
                            existing.cadet_attendances.map(a => [a.cadet_id, a])
                        );
                        setCadets(prev => prev.map(c => {
                            const existingData = existingMap.get(c.id);
                            if (existingData) {
                                return {
                                    ...c,
                                    status: existingData.status,
                                    remarks: existingData.remarks || "",
                                };
                            }
                            return c;
                        }));
                    }
                } else {
                    setExistingAttendanceId(null);
                    setIsReadOnly(false);
                }
            } catch (err) {
                console.error("Failed to check existing:", err);
            }
        };
        checkExisting();
    }, [formData.course_id, formData.semester_id, formTypeId, formDate]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateCadetStatus = (cadetId: number, status: AttendanceStatus) => {
        setCadets(prev => prev.map(c => c.id === cadetId ? { ...c, status } : c));
    };

    const updateCadetRemarks = (cadetId: number, remarks: string) => {
        setCadets(prev => prev.map(c => c.id === cadetId ? { ...c, remarks } : c));
    };

    const markAll = (status: AttendanceStatus) => {
        setCadets(prev => prev.map(c => ({ ...c, status })));
    };

    const convertToApiDate = (displayDate: string) => {
        if (!displayDate) return null;
        const parts = displayDate.split('/');
        if (parts.length !== 3) return displayDate;
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (isReadOnly) return;
        if (!formData.course_id) { setError("Please select a course"); return; }
        if (!formData.semester_id) { setError("Please select a semester"); return; }
        if (!formTypeId) { setError("Please select an attendance type"); return; }

        try {
            const submitData = {
                course_id: formData.course_id,
                semester_id: formData.semester_id,
                attendence_type_id: formTypeId,
                attendance_date: convertToApiDate(formDate),
                remarks: formRemarks || null,
                cadets: cadets.map(c => ({
                    cadet_id: c.id,
                    status: c.status,
                    remarks: c.remarks || null,
                })),
            };
            await onSubmit(submitData);
        } catch (err) {
            console.error("Submit error:", err);
        }
    };

    if (loadingDropdowns) {
        return (
            <div className="w-full min-h-[20vh] flex items-center justify-center">
                <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
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

            <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Icon icon="hugeicons:file-01" className="w-5 h-5 text-blue-500" />
                        Basic Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label>Course <span className="text-red-500">*</span></Label>
                            <select
                                value={formData.course_id}
                                onChange={(e) => handleChange("course_id", parseInt(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value={0}>Select Course</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Semester <span className="text-red-500">*</span></Label>
                            <select
                                value={formData.semester_id}
                                onChange={(e) => handleChange("semester_id", parseInt(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={!formData.course_id || loadingSemesters}
                            >
                                <option value={0}>
                                    {loadingSemesters ? "Loading..." : !formData.course_id ? "Select course first" : "Select Semester"}
                                </option>
                                {semesters.map(semester => (
                                    <option key={semester.id} value={semester.id}>{semester.name} ({semester.code})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Attendance Type <span className="text-red-500">*</span></Label>
                            <select
                                value={formTypeId}
                                onChange={(e) => setFormTypeId(Number(e.target.value) || "")}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={!formData.course_id || !formData.semester_id}
                            >
                                <option value="">— Select Type —</option>
                                {attendenceTypes.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.short_name})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Date</Label>
                            <DatePicker
                                value={formDate}
                                onChange={(e) => setFormDate(e.target.value)}
                                placeholder="dd/mm/yyyy"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label>Remarks</Label>
                            <input
                                type="text"
                                value={formRemarks}
                                onChange={(e) => setFormRemarks(e.target.value)}
                                placeholder="Optional"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Icon icon="hugeicons:user-group" className="w-5 h-5 text-blue-500" />
                            Cadet Attendance {!cadetsLoading && cadets.length > 0 && `(${cadets.length})`}
                        </h3>
                        {cadets.length > 0 && !isReadOnly && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Mark all:</span>
                                {STATUS_OPTIONS.map((s) => (
                                    <button key={s.value} type="button" onClick={() => markAll(s.value)}
                                        className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${s.color}`}>
                                        {s.short}
                                    </button>
                                ))}
                            </div>
                        )}
                        {isReadOnly && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">
                                <Icon icon="hugeicons:information-circle" className="w-4 h-4" />
                                Attendance already submitted for this date
                            </div>
                        )}
                    </div>

                    {!formData.course_id || !formData.semester_id ? (
                        <div className="text-center py-12 text-gray-500">
                            <Icon icon="hugeicons:filter" className="w-10 h-10 mx-auto mb-2" />
                            <p>Please select Course and Semester to load cadets</p>
                        </div>
                    ) : !formTypeId ? (
                        <div className="text-center py-12 text-gray-500">
                            <Icon icon="hugeicons:calendar-02" className="w-10 h-10 mx-auto mb-2" />
                            <p>Please select Attendance Type to view cadets</p>
                        </div>
                    ) : cadetsLoading ? (
                        <div className="w-full min-h-[20vh] flex items-center justify-center">
                            <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
                        </div>
                    ) : cadets.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Icon icon="hugeicons:user-group" className="w-10 h-10 mx-auto mb-2" />
                            <p>No cadets found for this course/semester</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-black">
                                <thead>
                                    <tr>
                                        <th className="border border-black px-3 py-2 text-center text-sm font-semibold text-black">SL.</th>
                                        <th className="border border-black px-3 py-2 text-center text-sm font-semibold text-black">BD No.</th>
                                        <th className="border border-black px-3 py-2 text-center text-sm font-semibold text-black">Rank</th>
                                        <th className="border border-black px-3 py-2 text-left text-sm font-semibold text-black">Name</th>
                                        <th className="border border-black px-3 py-2 text-center text-sm font-semibold text-black">Status</th>
                                        <th className="border border-black px-3 py-2 text-left text-sm font-semibold text-black">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cadets.map((cadet, idx) => (
                                        <tr key={cadet.id} className={``}>
                                            <td className="border border-black px-3 py-2 text-center text-sm text-black">{idx + 1}</td>
                                            <td className="border border-black px-3 py-2 text-center text-sm text-black">{cadet.cadet_number}</td>
                                            <td className="border border-black px-3 py-2 text-center text-sm text-black">{cadet.rank}</td>
                                            <td className="border border-black px-3 py-2 text-sm text-black">{cadet.name}</td>

                                            {isReadOnly ? (
                                                <td
                                                    colSpan={2}
                                                    className="border border-black px-3 py-2 text-center bg-yellow-100"
                                                >
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-800">
                                                        <Icon icon="hugeicons:information-circle" className="w-3.5 h-3.5 shrink-0" />
                                                        This Cadet Attendance Already Stored
                                                    </span>
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="border border-black px-3 py-2 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {STATUS_OPTIONS.map((s) => (
                                                                <button
                                                                    key={s.value}
                                                                    type="button"
                                                                    onClick={() => updateCadetStatus(cadet.id, s.value)}
                                                                    className={`w-7 h-7 rounded-full text-sm font-bold transition-all ${cadet.status === s.value
                                                                        ? s.color + " shadow-sm"
                                                                        : "bg-gray-100 text-gray-400 border border-gray-200 hover:border-gray-400"
                                                                        }`}
                                                                >
                                                                    {s.short}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="border border-black px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={cadet.remarks}
                                                            onChange={(e) => updateCadetRemarks(cadet.id, e.target.value)}
                                                            placeholder="Optional"
                                                            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                        />
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {!isReadOnly && (
                                <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                                    <span className="text-gray-500">Status:</span>
                                    {STATUS_OPTIONS.map((s) => (
                                        <button
                                            key={s.value}
                                            type="button"
                                            onClick={() => markAll(s.value)}
                                            className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${s.color}`}
                                        >
                                            {s.short}
                                        </button>
                                    ))}
                                    <span className="text-gray-400 ml-2">= {STATUS_OPTIONS.map(s => s.label).join(', ')}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className={`px-6 py-2 rounded-xl flex items-center gap-2 ${isReadOnly
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                        disabled={loading || cadetsLoading || isReadOnly}
                    >
                        {loading && <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />}
                        {loading ? "Saving..." : isReadOnly ? "Already Submitted" : (isEdit ? "Update Attendance" : "Save Attendance")}
                    </button>
                </div>
            </div>
        </form>
    );
}