/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import DatePicker from "@/components/form/input/DatePicker";
import FullLogo from "@/components/ui/fulllogo";

interface EditMarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedExercise: any;
  onUpdate: (row: any) => void;
}

export default function EditMarkModal({ isOpen, onClose, selectedExercise, onUpdate }: EditMarkModalProps) {
  const [formData, setFormData] = React.useState({
    date: "",
    mark: "",
    time: "0:00",
  });

  React.useEffect(() => {
    if (selectedExercise?.existing_mark_info) {
      setFormData({
        date: selectedExercise.existing_mark_info.date || "",
        mark: selectedExercise.existing_mark_info.achieved_mark || "",
        time: selectedExercise.existing_mark_info.achieved_time || "0:00",
      });
    }
  }, [selectedExercise]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;
    
    const updatedRow = {
      ...selectedExercise,
      existing_mark_info: {
        ...selectedExercise.existing_mark_info,
        date: formData.date,
        achieved_mark: formData.mark,
        achieved_time: formData.time,
      },
    };
    onUpdate(updatedRow);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true} className="max-w-2xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="flex flex-col items-center mb-6">
          <div><FullLogo /></div>
          <h2 className="text-xl font-bold text-gray-900">
            Edit Mark - {selectedExercise?.exercise_shortname}
          </h2>
          <p className="text-sm text-gray-500">
            Update existing mark details
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
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-black rounded-xl"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-xl">
            Update
          </button>
        </div>
      </form>
    </Modal>
  );
}
