/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw12sqnGroundSyllabusService } from "@/libs/services/ftw12sqnGroundSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import GroundSyllabusForm from "@/components/ftw-12sqn-ground/GroundSyllabusForm";
import type { Ftw12sqnGroundSyllabus, Ftw12sqnGroundSyllabusCreateData } from "@/libs/types/ftw12sqnFlying";

export default function EditGroundSyllabusPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [syllabus, setSyllabus] = useState<Ftw12sqnGroundSyllabus | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadSyllabus = async () => {
      try {
        setLoadingData(true);
        const data = await ftw12sqnGroundSyllabusService.get(id, { include_inactive: true });
        setSyllabus(data);
      } catch (error) {
        console.error("Failed to load syllabus:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (id) {
      loadSyllabus();
    }
  }, [id]);

  const handleSubmit = async (data: Ftw12sqnGroundSyllabusCreateData) => {
    setLoading(true);
    try {
      await ftw12sqnGroundSyllabusService.update(id, data);
      router.push("/ftw/12sqn/results/ground/syllabus");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/12sqn/results/ground/syllabus");
  };

  if (loadingData) {
    return (
      <div className="bg-white p-12 rounded-xl border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <Icon icon="hugeicons:fan-01" className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Syllabus...</p>
        </div>
      </div>
    );
  }

  if (!syllabus) {
    return (
      <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
        <Icon icon="hugeicons:alert-02" className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-gray-900 uppercase">Ground Syllabus Not Found</h2>
        <p className="text-gray-500 mt-2 font-medium">The ground syllabus you are looking for does not exist or has been removed.</p>
        <button
          onClick={() => router.push("/ftw/12sqn/results/ground/syllabus")}
          className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-widest text-xs"
        >
          Return to Summary
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-lg font-bold text-blue-800 mt-2 uppercase tracking-widest">Edit Ground Syllabus</h2>
        <p className="text-gray-500 text-sm mt-1 uppercase font-semibold">
          {syllabus.ground_full_name} ({syllabus.ground_shortname})
        </p>
      </div>

      <GroundSyllabusForm
        initialData={syllabus}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
