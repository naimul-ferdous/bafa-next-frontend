"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { SystemExtension } from "@/libs/types/systemExtension";

interface ExtensionModalContextType {
  isOpen: boolean;
  editingExtension: SystemExtension | null;
  openModal: (extension?: SystemExtension) => void;
  closeModal: () => void;
}

const ExtensionModalContext = createContext<ExtensionModalContextType | undefined>(undefined);

export function ExtensionModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingExtension, setEditingExtension] = useState<SystemExtension | null>(null);

  const openModal = (extension?: SystemExtension) => {
    setEditingExtension(extension || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingExtension(null), 300);
  };

  return (
    <ExtensionModalContext.Provider value={{ isOpen, editingExtension, openModal, closeModal }}>
      {children}
    </ExtensionModalContext.Provider>
  );
}

export function useExtensionModal() {
  const context = useContext(ExtensionModalContext);
  if (context === undefined) {
    throw new Error("useExtensionModal must be used within an ExtensionModalProvider");
  }
  return context;
}
