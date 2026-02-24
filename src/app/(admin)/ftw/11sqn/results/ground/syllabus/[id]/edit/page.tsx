/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ftw11sqnGroundSyllabusService } from "@/libs/services/ftw11sqnGroundSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import GroundSyllabusForm from "@/components/ftw-11sqn-ground/GroundSyllabusForm";
import type { Ftw11sqnGroundSyllabus, Ftw11sqnGroundSyllabusCreateData } from "@/libs/types/ftw11sqnFlying";

export default function EditGroundSyllabusPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [syllabus, setSyllabus] = useState<Ftw11sqnGroundSyllabus | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadSyllabus = async () => {
      try {
        setLoadingData(true);
        const data = await ftw11sqnGroundSyllabusService.get(id);
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

  const handleSubmit = async (data: Ftw11sqnGroundSyllabusCreateData) => {
    setLoading(true);
    try {
      await ftw11sqnGroundSyllabusService.update(id, data);
      router.push("/ftw/11sqn/results/ground/syllabus");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/11sqn/results/ground/syllabus");
  };

  if (loadingData) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!syllabus) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-02" className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Ground Syllabus Not Found</h2>
          <p className="text-gray-500 mt-2">The ground syllabus you are looking for does not exist.</p>
          <button
            onClick={() => router.push("/ftw/11sqn/results/ground/syllabus")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit Ground Syllabus</h2>
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
