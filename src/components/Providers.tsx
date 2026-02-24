'use client';

import { AuthContextProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { MenuModalProvider } from '@/context/MenuModalContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthContextProvider>
        <NotificationProvider>
          <MenuModalProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </MenuModalProvider>
        </NotificationProvider>
      </AuthContextProvider>
    </ThemeProvider>
  );
}
