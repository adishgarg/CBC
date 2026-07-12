"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";

const ClientNavbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 flex w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-sm md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              className="dark:hidden"
              src="/images/logo/logo.png"
              alt="Logo"
              width={90}
              height={30}
            />
            <Image
              className="hidden dark:block"
              src="/images/logo/logo.png"
              alt="Logo"
              width={90}
              height={30}
            />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Client View
          </span>
        </div>
      </div>
    </header>
  );
};

export default ClientNavbar;
