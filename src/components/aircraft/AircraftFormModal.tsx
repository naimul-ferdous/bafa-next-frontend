/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { aircraftService } from "@/libs/services/aircraftService";
import { useAircraftModal } from "@/context/AircraftModalContext";
import { AircraftType } from "@/libs/types/aircraft";
import FullLogo from "@/components/ui/fulllogo";

export default function AircraftFormModal() {
  const { isOpen, editingAircraft, closeModal } = useAircraftModal();
  const [aircraftTypes, setAircraftTypes] = useState<AircraftType[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    aircraft_type_id: "",
    tail_no: "",
    code: "",
    tarmac: "" as "old" | "new" | "",
    series: "" as "solo" | "dual" | "",
    svc: "",
    us: "",
    status: "active" as "active" | "deactive",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await aircraftService.getAllAircraftTypes({ per_page: 1000 });
        setAircraftTypes(response.data);
      } catch (err) {
        console.error("Failed to fetch aircraft types:", err);
      }
    };
    if (isOpen) {
      fetchTypes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingAircraft) {
      setFormData({
        title: editingAircraft.title,
        aircraft_type_id: editingAircraft.aircraft_type_id.toString(),
        tail_no: editingAircraft.tail_no.toString(),
        code: editingAircraft.code.toString(),
        tarmac: editingAircraft.tarmac || "",
        series: editingAircraft.series || "",
        svc: editingAircraft.svc || "",
        us: editingAircraft.us || "",
        status: editingAircraft.status,
      });
    } else {
      setFormData({
        title: "",
        aircraft_type_id: "",
        tail_no: "",
        code: "",
        tarmac: "",
        series: "",
        svc: "",
        us: "",
        status: "active",
      });
    }
    setError("");
  }, [editingAircraft, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        aircraft_type_id: Number(formData.aircraft_type_id),
        tail_no: Number(formData.tail_no),
        code: Number(formData.code),
        tarmac: formData.tarmac || null,
        series: formData.series || null,
      };

      if (editingAircraft) {
        await aircraftService.updateAircraft(editingAircraft.id, dataToSubmit);
      } else {
        await aircraftService.createAircraft(dataToSubmit);
      }
      closeModal();
      window.dispatchEvent(new CustomEvent('aircraftUpdated'));
    } catch (err: any) {
      setError(err.message || "Failed to save aircraft");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-3xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <div><FullLogo /></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingAircraft ? "Edit Aircraft" : "Add Aircraft"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingAircraft ? "Update aircraft details" : "Register a new aircraft in the academy fleet"}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Aircraft Title <span className="text-red-500">*</span></Label>
              <Input value={formData.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="e.g. PT-6-01" required />
            </div>
            <div>
              <Label>Aircraft Type <span className="text-red-500">*</span></Label>
              <select 
                value={formData.aircraft_type_id} 
                onChange={(e) => handleChange("aircraft_type_id", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Type</option>
                {aircraftTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tail No <span className="text-red-500">*</span></Label>
              <Input type="number" value={formData.tail_no} onChange={(e) => handleChange("tail_no", e.target.value)} placeholder="Enter Tail No" required />
            </div>
            <div>
              <Label>Code <span className="text-red-500">*</span></Label>
              <Input type="number" value={formData.code} onChange={(e) => handleChange("code", e.target.value)} placeholder="Enter Code" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tarmac</Label>
              <select 
                value={formData.tarmac} 
                onChange={(e) => handleChange("tarmac", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Tarmac</option>
                <option value="old">Old</option>
                <option value="new">New</option>
              </select>
            </div>
            <div>
              <Label>Series</Label>
              <select 
                value={formData.series} 
                onChange={(e) => handleChange("series", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Series</option>
                <option value="solo">Solo</option>
                <option value="dual">Dual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>SVC</Label>
              <Input value={formData.svc} onChange={(e) => handleChange("svc", e.target.value)} placeholder="Enter SVC" />
            </div>
            <div>
              <Label>US</Label>
              <Input value={formData.us} onChange={(e) => handleChange("us", e.target.value)} placeholder="Enter US" />
            </div>
          </div>

          <div>
            <Label className="mb-3">Status</Label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" checked={formData.status === "active"} onChange={() => handleChange("status", "active")} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <span className="text-gray-900 dark:text-white">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" checked={formData.status === "deactive"} onChange={() => handleChange("status", "deactive")} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <span className="text-gray-900 dark:text-white">Inactive</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-2">
          <button type="button" className="px-6 py-2 border border-gray-300 text-black rounded-xl" onClick={closeModal} disabled={loading}>Cancel</button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl" disabled={loading}>{loading ? "Saving..." : editingAircraft ? "Update Aircraft" : "Save Aircraft"}</button>
        </div>
      </form>
    </Modal>
  );
}
