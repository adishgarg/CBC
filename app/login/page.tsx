import SignInForm from "@/components/auth/SignInForm";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen">
            {/* Left side - Image (40% width) */}
            <div className="hidden lg:flex lg:w-2/5 relative bg-gradient-to-br from-brand-500 to-brand-700">
                <div className="relative w-full h-full">
                    <Image
                        src="/images/siginin1.png"
                        alt="Sign In"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </div>

            {/* Right side - Split into Contact Us and Sign In (60% width) */}
            <div className="flex flex-col w-full lg:w-3/5 bg-white dark:bg-gray-900">
                {/* Upper section - Contact Us Section */}
                <div className="border-b border-gray-200 dark:border-gray-800 py-6 px-8 sm:px-12 lg:px-16 bg-[#f5f0eb] dark:bg-gray-800">
                    <div className="flex flex-col gap-4">
                        {/* Logo */}
                        <div>
                            <Image
                                src="/images/logo/logo.png"
                                alt="CBC Logo"
                                width={60}
                                height={60}
                                className="dark:hidden"
                            />
                            <Image
                                src="/images/logo/logo.png"
                                alt="CBC Logo"
                                width={60}
                                height={60}
                                className="hidden dark:block"
                            />
                        </div>
                        
                        {/* Heading and Button Row */}
                        <div className="flex items-start justify-between gap-4">
                            {/* Heading and Subtitle */}
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-light text-gray-900 dark:text-white mb-1">
                                    Contact Us
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-400">
                                    We're here to listen. Your thoughts can change everything
                                </p>
                            </div>
                            
                            {/* Request Form Button */}
                            <Link href="https://CBCindia.org/contact/" className="hidden lg:flex items-center gap-2 px-5 py-2 border-2 border-gray-800 dark:border-white text-gray-800 dark:text-white text-xs font-medium rounded whitespace-nowrap relative overflow-hidden group transition-all duration-300 hover:cursor-pointer flex-shrink-0 mr-5">
                                <span className="absolute inset-0 bg-brand-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
                                <span className="relative z-10 group-hover:text-white transition-colors duration-300">Request Form</span>
                                <svg className="w-3.5 h-3.5 relative z-10 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>
                        
                        {/* Bottom row - Contact Information */}
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-12 lg:gap-16 text-xs sm:text-sm">
                            {/* Left column - Company and Address */}
                            <div className="flex-1 space-y-0.5 text-gray-900 dark:text-gray-300">
                                <p className="font-semibold">CBC</p>
                                <p>Architecture | Vastu Consultant</p>
                                <p>#20 (Basement) Raj Kamal Square</p>
                                <p>Bhupindra Road,</p>
                                <p>Patiala PB 147001</p>
                            </div>
                            
                            {/* Right column - Email and Phone */}
                            <div className="flex flex-col gap-1 text-gray-900 dark:text-gray-300">
                                <p>hello.CBCteam@gmail.com</p>
                                <p className="underline">T. +91 99155 00782</p>
                            </div>
                        </div>
                        
                        {/* Mobile button */}
                        <Link href="https://CBCindia.org/contact/" className="lg:hidden mt-1 w-full px-5 py-2 border-2 border-gray-800 dark:border-white text-gray-800 dark:text-white text-xs font-medium rounded relative overflow-hidden group transition-all duration-300 flex items-center justify-center gap-2">
                            <span className="absolute inset-0 bg-brand-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
                            <span className="relative z-10 group-hover:text-white transition-colors duration-300">Request Form</span>
                            <svg className="w-4 h-4 relative z-10 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Lower section - Sign In Form (expanded) */}
                <div className="flex-1 flex items-center justify-center p-2 overflow-y-auto min-h-0">
                    <SignInForm />
                </div>
            </div>
        </div>
    );
}