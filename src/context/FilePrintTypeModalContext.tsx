import React, { createContext, useContext, useState, ReactNode } from "react";
import { FilePrintType } from "@/libs/types/filePrintType";

interface FilePrintTypeModalContextType {
  isModalOpen: boolean;
  selectedFilePrintType: FilePrintType | null;
  openModal: (type?: FilePrintType) => void;
  closeModal: () => void;
}

const FilePrintTypeModalContext = createContext<FilePrintTypeModalContextType | undefined>(undefined);

export function FilePrintTypeModalProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilePrintType, setSelectedFilePrintType] = useState<FilePrintType | null>(null);

  const openModal = (type?: FilePrintType) => {
    setSelectedFilePrintType(type || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFilePrintType(null);
  };

  return (
    <FilePrintTypeModalContext.Provider
      value={{
        isModalOpen,
        selectedFilePrintType,
        openModal,
        closeModal,
      }}
    >
      {children}
    </FilePrintTypeModalContext.Provider>
  );
}

export function useFilePrintTypeModal() {
  const context = useContext(FilePrintTypeModalContext);
  if (context === undefined) {
    throw new Error("useFilePrintTypeModal must be used within a FilePrintTypeModalProvider");
  }
  return context;
}
