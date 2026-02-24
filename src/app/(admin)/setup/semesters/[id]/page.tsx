"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { SystemSemester } from "@/libs/types/system";
import { semesterService } from "@/libs/services/semesterService";
import { cadetService } from "@/libs/services/cadetService";
import { CadetProfile } from "@/libs/types/user";
import FullLogo from "@/components/ui/fulllogo";
import { formatDate } from "@/libs/utils/formatter";

export default function SemesterDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const semesterId = params.id as string;
  const [semester, setSemester] = useState<SystemSemester | null>(null);
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [cadetsLoading, setCadetsLoading] = useState(true);

  useEffect(() => {
    const loadSemester = async () => {
      try {
        setLoading(true);
        const data = await semesterService.getSemester(Number(semesterId));
        setSemester(data);
      } catch (error) {
        console.error("Failed to load semester:", error);
        alert("Failed to load semester data");
        router.push('/setup/semesters');
      } finally {
        setLoading(false);
      }
    };

    loadSemester();
  }, [semesterId, router]);

  useEffect(() => {
    const loadCadets = async () => {
      try {
        setCadetsLoading(true);
        const response = await cadetService.getAllCadets({
          semester_id: Number(semesterId),
          per_page: 100
        });
        setCadets(response.data);
      } catch (error) {
        console.error("Failed to load cadets:", error);
      } finally {
        setCadetsLoading(false);
      }
    };

    loadCadets();
  }, [semesterId]);

  const handleBack = () => {
    router.push('/setup/semesters');
  };

  const handleEdit = () => {
    router.push(`/setup/semesters/${semesterId}/edit`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleViewCadet = (cadetId: number) => {
    router.push(`/users/cadets/${cadetId}`);
  };

  const calculateDuration = () => {
    if (!semester) return 0;
    const start = new Date(semester.start_date);
    const end = new Date(semester.end_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center min-h-[400px]">
          <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!semester) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <p className="text-gray-500">Semester not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={handleBack}
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
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
            Edit Semester
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 cv-content">
        {/* Header with Logo */}
        <div className="relative mb-8">
          <div className="flex-1">
            <div className="flex justify-center mb-4">
              <FullLogo />
            </div>
            <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
              Bangladesh Air Force Academy
            </h1>
            <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
              Semester Details - {semester.name}
              {semester.is_current && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                  Current Semester
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Basic Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Semester Name</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{semester.name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Semester Code</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-mono">{semester.code || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Status</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${semester.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {semester.is_active ? "Active" : "Inactive"}
                </span>
              </span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Current Semester</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${semester.is_current ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>
                  {semester.is_current ? "Yes" : "No"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Duration Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Duration Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Start Date</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{formatDate(semester.start_date)}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">End Date</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{formatDate(semester.end_date)}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Total Duration</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{calculateDuration()} Days</span>
            </div>
          </div>
        </div>

        {/* Assigned Cadets Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            Assigned Cadets ({cadets.length})
          </h2>
          {cadetsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon icon="hugeicons:loading-03" className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading cadets...</span>
            </div>
          ) : cadets.length > 0 ? (
            <table className="w-full border-collapse border border-gray-900">
              <thead>
                <tr className="bg-white">
                  <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">SL.</th>
                  <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Cadet Number</th>
                  <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Name</th>
                  <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Batch</th>
                  <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Status</th>
                  <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                {cadets.map((cadet, index) => (
                  <tr key={cadet.id}>
                    <td className="border border-gray-900 px-4 py-2 text-gray-900">{index + 1}</td>
                    <td className="border border-gray-900 px-4 py-2 text-gray-900 font-mono">{cadet.cadet_number}</td>
                    <td className="border border-gray-900 px-4 py-2 text-gray-900">{cadet.name}</td>
                    <td className="border border-gray-900 px-4 py-2 text-gray-900">{cadet.batch || "N/A"}</td>
                    <td className="border border-gray-900 px-4 py-2 text-gray-900">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${cadet.status === 'active' ? "bg-green-100 text-green-800" :
                          cadet.status === 'suspended' ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                        }`}>
                        {cadet.status || "Active"}
                      </span>
                    </td>
                    <td className="border border-gray-900 px-4 py-2 text-center no-print">
                      <button
                        onClick={() => handleViewCadet(cadet.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Cadet"
                      >
                        <Icon icon="hugeicons:view" className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-900">No cadets assigned to this semester.</p>
          )}
        </div>

        {/* System Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
            System Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Created At</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{formatDate(semester.created_at)}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Last Updated</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1">{formatDate(semester.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Footer with date */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}
