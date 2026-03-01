import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Icon } from "@iconify/react";
import { FilePrintType } from "@/libs/types/filePrintType";
import { filePrintTypeService } from "@/libs/services/filePrintTypeService";

interface PrintTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedType: FilePrintType) => void;
}

export default function PrintTypeModal({ isOpen, onClose, onConfirm }: PrintTypeModalProps) {
  const [printTypes, setPrintTypes] = useState<FilePrintType[]>([]);
  const [selectedPrintType, setSelectedPrintType] = useState<FilePrintType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPrintTypes();
    }
  }, [isOpen]);

  const loadPrintTypes = async () => {
    try {
      setLoading(true);
      const types = await filePrintTypeService.getActiveFilePrintTypes();
      setPrintTypes(types);
      if (types.length > 0) {
        setSelectedPrintType(types[0]);
      }
    } catch (error) {
      console.error("Failed to load print types", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedPrintType) {
      onConfirm(selectedPrintType);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Select Print Format</h2>
      </div>
      
      <div className="space-y-4">
        <p className="text-gray-600 text-sm">Please select the type of file you want to print.</p>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {printTypes.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-2">No print types available.</p>
            ) : (
              printTypes.map((type) => (
                <label 
                  key={type.id} 
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPrintType?.id === type.id 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="printType"
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    checked={selectedPrintType?.id === type.id}
                    onChange={() => setSelectedPrintType(type)}
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">{type.name}</span>
                    {type.code && <span className="block text-xs text-gray-500 font-mono">{type.code}</span>}
                  </div>
                </label>
              ))
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedPrintType || loading}>
            Print Now
          </Button>
        </div>
      </div>
    </Modal>
  );
}
