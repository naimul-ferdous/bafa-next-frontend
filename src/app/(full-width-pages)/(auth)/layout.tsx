import GridShape from "@/components/common/GridShape";
import { ThemeProvider } from "@/context/ThemeContext";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Bangladesh Air Force Academy - Login",
  description: "Bangladesh Air Force Academy Management System - Secure Login Portal",
  openGraph: {
    title: "Bangladesh Air Force Academy - Login",
    description: "Bangladesh Air Force Academy Management System - Secure Login Portal",
    images: [
      {
        url: "/images/brand/__login-bg.png",
        width: 1200,
        height: 630,
        alt: "Bangladesh Air Force Academy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bangladesh Air Force Academy - Login",
    description: "Bangladesh Air Force Academy Management System - Secure Login Portal",
    images: ["/images/brand/__login-bg.png"],
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden relative overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="/images/brand/__login-bg.png"
                alt="Bangladesh Air Force Academy"
                fill
                className="object-cover opacity-30"
                priority
              />
            </div>
            <div className="relative items-center justify-center flex z-1">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              {/* <GridShape /> */}
              <div className="flex flex-col items-center max-w-xs">
                <Link href="/" className="block mb-4">
                  <Image
                    width={150}
                    height={150}
                    src="/images/logo/logo.png"
                    alt="Bangladesh Air Force Academy Logo"
                    className="rounded-full"
                  />
                </Link>
                <h1 className="text-2xl font-bold text-white text-center mb-2">
                  Bangladesh Air Force Academy
                </h1>
                <p className="text-center text-gray-300 dark:text-white/60">
                  Academy Management System
                </p>
              </div>
            </div>
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
