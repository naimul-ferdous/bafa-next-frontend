/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { aroService } from "@/libs/services/aroService";
import FullLogo from "@/components/ui/fulllogo";
import AroForm from "@/components/notices/AroForm";
import type { Aro } from "@/libs/types/aro";

export default function EditNoticePage() {
  const router = useRouter();
  const params = useParams();
  const noticeId = parseInt(params?.id as string);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [noticeData, setNoticeData] = useState<Aro | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingData(true);
        const data = await aroService.getOne(noticeId);
        if (data) {
          setNoticeData(data);
        } else {
          setError("Notice not found");
        }
      } catch (err) {
        console.error("Failed to load notice:", err);
        setError("Failed to load notice data. Please refresh the page.");
      } finally {
        setLoadingData(false);
      }
    };

    if (noticeId) load();
  }, [noticeId]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await aroService.update(noticeId, data);
      router.push("/setup/notices");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error}</p>
          <button onClick={() => router.push("/setup/notices")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to Notices
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit Notice / ARO</h2>
        <p className="text-sm text-gray-500 mt-1">Update the notice details</p>
      </div>

      <AroForm
        initialData={noticeData}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/setup/notices")}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
