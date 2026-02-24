/**
 * Menu Modal Context
 * Manages the state for menu creation/editing modal
 */

'use client';

import React, { createContext, useContext, useState } from 'react';
import { Menu } from '@/libs/types';

interface MenuModalContextType {
  isOpen: boolean;
  editingMenu: Menu | null;
  openModal: (menu?: Menu) => void;
  closeModal: () => void;
}

const MenuModalContext = createContext<MenuModalContextType | undefined>(undefined);

export function MenuModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  const openModal = (menu?: Menu) => {
    setEditingMenu(menu || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingMenu(null);
  };

  return (
    <MenuModalContext.Provider
      value={{
        isOpen,
        editingMenu,
        openModal,
        closeModal,
      }}
    >
      {children}
    </MenuModalContext.Provider>
  );
}

export function useMenuModal() {
  const context = useContext(MenuModalContext);
  if (context === undefined) {
    throw new Error('useMenuModal must be used within a MenuModalProvider');
  }
  return context;
}
