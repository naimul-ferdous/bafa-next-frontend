import React, { useState, useEffect } from "react";
import { filePrintTypeService } from "@/libs/services/filePrintTypeService";
import { useFilePrintTypeModal } from "@/context/FilePrintTypeModalContext";
import { useNotification } from "@/context/NotificationContext";
import { Modal } from "@/components/ui/modal";

interface FormData {
  name: string;
  code: string;
  is_active: boolean;
}

const emptyForm: FormData = { name: "", code: "", is_active: true };

export default function FilePrintTypeFormModal() {
  const { isModalOpen, closeModal, selectedFilePrintType } = useFilePrintTypeModal();
  const { showNotification } = useNotification();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedFilePrintType) {
      setForm({
        name: selectedFilePrintType.name,
        code: selectedFilePrintType.code,
        is_active: selectedFilePrintType.is_active,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [selectedFilePrintType, isModalOpen]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.code.trim()) e.code = "Code is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      if (selectedFilePrintType) {
        await filePrintTypeService.updateFilePrintType(selectedFilePrintType.id, form);
        showNotification("File Print Type updated successfully", "success");
      } else {
        await filePrintTypeService.createFilePrintType(form);
        showNotification("File Print Type created successfully", "success");
      }
      window.dispatchEvent(new Event("filePrintTypeUpdated"));
      closeModal();
    } catch (error: any) {
      console.error("Failed to save file print type:", error);
      showNotification(
        error.response?.data?.message || "Failed to save file print type",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedFilePrintType ? "Edit File Print Type" : "Add File Print Type"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Assessment Form"
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="e.g. ATW_ASSESS_FORM"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
          </div>

          <div className="flex items-start gap-3">
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
              <p className="text-xs text-gray-500">If inactive, this print type will not be available in the system.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : selectedFilePrintType ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
