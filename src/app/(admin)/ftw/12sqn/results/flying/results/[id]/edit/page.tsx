/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ftw12sqnFlyingExaminationMarkService } from "@/libs/services/ftw12sqnFlyingExaminationMarkService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw12sqnFlyingExaminationMark, Ftw12sqnFlyingExaminationMarkCreateData } from "@/libs/types/ftw12sqnExamination";
import { Icon } from "@iconify/react";
import Ftw12sqnFlyingExaminationMarkForm from "@/components/ftw-12sqn-flying-examination/Ftw12sqnFlyingExaminationMarkForm";

export default function EditFtw12sqnFlyingExaminationMarkPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [mark, setMark] = useState<Ftw12sqnFlyingExaminationMark | null>(null);

  useEffect(() => {
    const fetchMark = async () => {
      try {
        setFetchLoading(true);
        const data = await ftw12sqnFlyingExaminationMarkService.getMark(id);
        if (data) {
          setMark(data);
        } else {
          alert("Examination mark not found");
          router.push("/ftw/12sqn/results/flying/results");
        }
      } catch (error) {
        console.error("Failed to fetch examination mark:", error);
        alert("Failed to fetch examination mark");
        router.push("/ftw/12sqn/results/flying/results");
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchMark();
    }
  }, [id, router]);

  const handleSubmit = async (data: Ftw12sqnFlyingExaminationMarkCreateData) => {
    setLoading(true);
    try {
      await ftw12sqnFlyingExaminationMarkService.updateMark(id, data);
      router.push("/ftw/12sqn/results/flying/results");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/12sqn/results/flying/results");
  };

  if (fetchLoading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center min-h-[400px]">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!mark) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-8">
          <p className="text-gray-500">Examination mark not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit FTW 12SQN Flying Examination Mark</h2>
      </div>

      <Ftw12sqnFlyingExaminationMarkForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
        initialData={mark}
      />
    </div>
  );
}
