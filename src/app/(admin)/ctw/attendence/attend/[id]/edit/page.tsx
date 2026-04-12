"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import FullLogo from "@/components/ui/fulllogo";
import AttendanceForm from "@/components/ctw-attendance/AttendanceForm";
import { ctwAttendenceResultService } from "@/libs/services/ctwAttendenceResultService";

export default function EditCtwAttendancePage() {
    const router = useRouter();
    const params = useParams();
    const id = parseInt(params?.id as string);

    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<any>(null);

    useEffect(() => {
        if (!id) return;
        ctwAttendenceResultService.getOne(id)
            .then((data) => {
                setInitialData(data);
            })
            .catch(() => {
                router.push("/ctw/attendence/attend");
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (data: any) => {
        await ctwAttendenceResultService.update(id, data);
        router.refresh();
        router.push("/ctw/attendence/attend");
    };

    const handleCancel = () => {
        router.push("/ctw/attendence/attend");
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-center justify-center min-h-[30vh]">
                <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 2.927A7.947 7.947 0 014 12H0c0 3.314 2.343 6.073 5.364 6.95v-4z"></path>
                </svg>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4"><FullLogo /></div>
                <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit CTW Attendance</h2>
                {initialData && (
                    <p className="text-sm text-gray-500 mt-1">
                        {initialData.course?.name} — {initialData.semester?.name}
                    </p>
                )}
            </div>

            <button type="button" onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
                ← Back
            </button>

            <AttendanceForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={false}
                isEdit={true}
                initialData={initialData}
            />
        </div>
    );
}