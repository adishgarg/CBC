"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import FloatingMeetingButton from "@/components/common/FloatingMeetingButton";
import MeetingMinutesModal from "@/components/common/MeetingMinutesModal";
import PWAInstallPrompt from "@/components/common/PWAInstallPrompt";
import { useModal } from "@/hooks/useModal";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, openModal, closeModal } = useModal();

  // Extract project ID from URL if on project details page
  const getProjectIdFromUrl = () => {
    const match = pathname?.match(/\/dashboard\/projects\/([a-f0-9]+)/);
    return match ? match[1] : undefined;
  };

  const projectId = getProjectIdFromUrl();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden dark:bg-gray-900">
      <AppSidebar />
      <Backdrop />
      <div className="flex flex-col h-screen overflow-hidden">
        <AppHeader />
        <main className={`flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ${
          isExpanded ? 'lg:ml-72' : 'lg:ml-20'
        }`}>
          <div className="p-4 mx-auto max-w-screen-2xl md:p-6 2xl:p-10">
            {children}
          </div>
        </main>
      </div>
      
      {/* Floating Meeting Minutes Button - Available on all dashboard pages */}
      <FloatingMeetingButton onClick={openModal} />
      
      {/* Meeting Minutes Modal */}
      <MeetingMinutesModal
        isOpen={isOpen}
        onClose={closeModal}
        preSelectedProjectId={projectId}
      />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
