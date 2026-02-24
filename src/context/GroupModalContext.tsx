"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { SystemGroup } from "@/libs/types/system";

interface GroupModalContextType {
  isOpen: boolean;
  editingGroup: SystemGroup | null;
  openModal: (group?: SystemGroup) => void;
  closeModal: () => void;
}

const GroupModalContext = createContext<GroupModalContextType | undefined>(undefined);

export function GroupModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SystemGroup | null>(null);

  const openModal = (group?: SystemGroup) => {
    setEditingGroup(group || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingGroup(null), 300);
  };

  return (
    <GroupModalContext.Provider value={{ isOpen, editingGroup, openModal, closeModal }}>
      {children}
    </GroupModalContext.Provider>
  );
}

export function useGroupModal() {
  const context = useContext(GroupModalContext);
  if (context === undefined) {
    throw new Error("useGroupModal must be used within a GroupModalProvider");
  }
  return context;
}
