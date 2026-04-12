/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import DatePicker from "@/components/form/input/DatePicker";
import FullLogo from "@/components/ui/fulllogo";

interface AddAdditionalMarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedExercise: any;
  onAdd: (row: any) => void;
}

export default function AddAdditionalMarkModal({ isOpen, onClose, selectedExercise, onAdd }: AddAdditionalMarkModalProps) {
  const [formData, setFormData] = React.useState({
    date: "",
    mark: "",
    time: "0:00",
    remark: "",
  });

  React.useEffect(() => {
    if (selectedExercise) {
      setFormData({
        date: selectedExercise.date || "",
        mark: selectedExercise.mark || "",
        time: selectedExercise.time || "0:00",
        remark: selectedExercise.remark || "",
      });
    }
  }, [selectedExercise]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;
    
    const updatedRow = {
      ...selectedExercise,
      date: formData.date,
      mark: formData.mark,
      time: formData.time,
      remark: formData.remark,
    };
    onAdd(updatedRow);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true} className="max-w-2xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <div><FullLogo /></div>
          <h2 className="text-xl font-bold text-gray-900">
            Add Additional Mark - {selectedExercise?.exercise_shortname}
          </h2>
          <p className="text-sm text-gray-500">
            Add new mark entry
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <DatePicker
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              placeholder="dd/mm/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mark</label>
            <input
              type="text"
              value={formData.mark}
              onChange={(e) => setFormData({ ...formData, mark: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter mark"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <input
              type="text"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="H:MM"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Remark</label>
            <input
              type="text"
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter remark"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-black rounded-xl"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 bg-green-500 text-white rounded-xl">
            Add
          </button>
        </div>
      </form>
    </Modal>
  );
}
