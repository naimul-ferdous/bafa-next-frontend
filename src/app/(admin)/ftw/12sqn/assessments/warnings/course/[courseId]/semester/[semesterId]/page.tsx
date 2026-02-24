/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnCadetWarningService } from "@/libs/services/ftw12sqnCadetWarningService";
import FullLogo from "@/components/ui/fulllogo";
import type { CadetWarning } from "@/libs/types/system";
import DataTable, { Column } from "@/components/ui/DataTable";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";

export default function Ftw12sqnWarningsCourseSemesterResultPage({ params }: { params: Promise<{ courseId: string; semesterId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId);
  const semesterId = parseInt(resolvedParams.semesterId);

  const [results, setResults] = useState<CadetWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingResult, setDeletingResult] = useState<CadetWarning | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await ftw12sqnCadetWarningService.getAll({
        course_id: courseId,
        semester_id: semesterId,
        per_page: 1000
      } as any);
      
      if (response.data.length > 0) {
        setResults(response.data);
      } else {
        setError("No cadet warnings found for this course and semester");
      }
    } catch (err) {
      console.error("Failed to load warnings:", err);
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [courseId, semesterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = (result: CadetWarning) => {
    router.push(`/ftw/12sqn/assessments/warnings/${result.id}/edit`);
  };

  const handleView = (result: CadetWarning) => {
    router.push(`/ftw/12sqn/assessments/warnings/${result.id}`);
  };

  const handleDelete = (result: CadetWarning) => {
    setDeletingResult(result);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingResult) return;
    try {
      setDeleteLoading(true);
      await ftw12sqnCadetWarningService.delete(deletingResult.id);
      await loadData();
      setDeleteModalOpen(false);
      setDeletingResult(null);
    } catch (err) {
      console.error("Failed to delete warning:", err);
      alert("Failed to delete warning");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: Column<CadetWarning>[] = [
    { 
      key: "id", 
      header: "SL.", 
      headerAlign: "center", 
      className: "text-center", 
      render: (_, index) => index + 1 
    },
    { 
      key: "bd_no", 
      header: "BD/No", 
      className: "font-mono font-bold", 
      render: (res) => (res.cadet as any)?.cadet_number || (res.cadet as any)?.bd_no || (res.cadet as any)?.bdno || "—" 
    },
    { 
      key: "name", 
      header: "Name", 
      className: "font-bold text-blue-600", 
      render: (res) => (res.cadet as any)?.name || "—" 
    },
    { 
      key: "warning_type", 
      header: "Warning Type", 
      render: (res) => (
        <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded bg-red-50 text-red-700 border border-red-100">
          {res.warning?.name || "—"}
        </span>
      )
    },
    { 
      key: "remarks", 
      header: "Remarks", 
      className: "text-gray-700 italic max-w-md truncate",
      render: (res) => res.remarks || "—" 
    },
    {
      key: "status",
      header: "Status",
      render: (res) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${res.is_active ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {res.is_active ? "Active" : "Inactive"}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      headerAlign: "center",
      className: "text-center no-print",
      render: (res) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleView(res)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all" title="View"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
          <button onClick={() => handleEdit(res)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-all" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(res)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-all" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || results.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-medium">{error || "Warnings not found"}</p>
          <button
            onClick={() => router.push("/ftw/12sqn/assessments/warnings")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  const course = results[0]?.course;
  const semester = results[0]?.semester;

  return (
    <div className="print-no-border bg-white rounded-lg border border-gray-200">
      {/* Action Buttons - Hidden on print */}
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push("/ftw/12sqn/assessments/warnings")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium transition-all"
          >
            <Icon icon="hugeicons:printer" className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      <div className="p-8 cv-content">
        {/* Header with Logo */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
            Bangladesh Air Force Academy
          </h1>
          <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
            FTW 12SQN Cadet Warnings Summary Sheet
          </p>
        </div>

        {/* Batch Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase text-base">
            Batch Information
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Course</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold">{course?.name || "N/A"} ({course?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Semester</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold">{semester?.name || "N/A"} ({semester?.code || "N/A"})</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Total Warnings</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold text-red-700">{results.length} Record(s)</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-900 font-medium">Report Type</span>
              <span className="mr-4">:</span>
              <span className="text-gray-900 flex-1 font-bold">Warnings Summary</span>
            </div>
          </div>
        </div>

        {/* Warnings Matrix Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400 uppercase text-base">
            Cadet Warnings Matrix
          </h2>
          
          <DataTable 
            columns={columns} 
            data={results} 
            keyExtractor={(res) => res.id.toString()} 
            onRowClick={handleView}
            emptyMessage="No warning records found"
          />
        </div>

        {/* Signature Section for Print */}
        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
          <div className="border-t-2 border-black pt-2">
            <p className="font-bold text-sm uppercase tracking-widest">Instructor</p>
          </div>
          <div className="border-t-2 border-black pt-2">
            <p className="font-bold text-sm uppercase tracking-widest">Chief Instructor</p>
          </div>
          <div className="border-t-2 border-black pt-2">
            <p className="font-bold text-sm uppercase tracking-widest">Commandant</p>
          </div>
        </div>

        <div className="mt-12 text-center text-[10px] text-gray-500 font-medium italic">
          <p>Generated on: {new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={confirmDelete} 
        title="Delete Warning" 
        message={`Are you sure you want to delete this warning record for "${deletingResult?.cadet?.name}"? This action cannot be undone.`} 
        confirmText="Delete" 
        cancelText="Cancel" 
        loading={deleteLoading} 
        variant="danger" 
      />
    </div>
  );
}
