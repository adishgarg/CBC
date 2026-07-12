"use client";
import React, { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    console.log('PWA Install Prompt: Initializing...');
    
    // Check if running on iOS or Android
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    setIsIOS(ios);
    setIsAndroid(android);
    
    console.log('Device detection:', { ios, android, userAgent });

    // Check if already installed (running in standalone mode)
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");
    setIsStandalone(standalone);
    
    console.log('PWA standalone check:', { 
      standalone, 
      displayMode: window.matchMedia("(display-mode: standalone)").matches,
      navigatorStandalone: (window.navigator as any).standalone 
    });

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    console.log('PWA dismissed check:', { dismissed, daysSinceDismissed });

    // Stop early if installed or dismissed recently
    if (standalone || (dismissed && daysSinceDismissed <= 7)) {
      console.log('PWA: Not prompting -', { standalone, dismissed, daysSinceDismissed });
      return;
    }

    if (ios) {
      // iOS does not fire beforeinstallprompt, so show guidance immediately.
      console.log('PWA: Showing iOS prompt');
      setShowPrompt(true);
      return;
    }

    // For Android/Desktop Chromium, use beforeinstallprompt when available.
    // Some browsers never fire it, so we show a fallback prompt with manual instructions.
    let installEventFired = false;
    const handler = (e: Event) => {
      e.preventDefault();
      installEventFired = true;
      console.log('PWA: beforeinstallprompt event fired');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const onAppInstalled = () => {
      console.log('PWA: appinstalled event fired');
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onAppInstalled);

    const fallbackTimer = window.setTimeout(() => {
      if (!installEventFired) {
        console.log('PWA: beforeinstallprompt not fired, showing manual install prompt');
        setShowPrompt(true);
      }
    }, 2500);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    console.log('PWA: Install button clicked', { isIOS, hasDeferredPrompt: !!deferredPrompt });
    
    if (isIOS) {
      // iOS doesn't support auto-install, just keep the prompt open
      console.log('PWA: iOS detected, cannot auto-install');
      return;
    }

    if (deferredPrompt) {
      console.log('PWA: Showing install prompt...');
      try {
        await deferredPrompt.prompt();
        // Chrome requires this to be triggered by user gesture
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log('PWA: User choice:', outcome);
        
        if (outcome === "accepted") {
          console.log("PWA: User accepted the install prompt");
        } else {
          console.log("PWA: User dismissed the install prompt");
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('PWA: Error during installation:', error);
      }
    } else {
      console.log('PWA: No deferred prompt available');
    }
  };

  const handleDismiss = () => {
    console.log('PWA: User dismissed prompt');
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:bottom-4 md:left-4 md:right-auto md:max-w-md">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/20">
              <svg className="h-6 w-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Install CBC Dashboard
            </h3>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {isIOS 
                ? "Use your browser's 'Add to Home Screen' option to install."
                : "Get quick access and work offline with our app."}
            </p>

            <div className="mt-4 flex gap-2">
              {deferredPrompt && !isIOS && (
                <button
                  onClick={handleInstall}
                  className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
                >
                  Install App
                </button>
              )}
              {isIOS && (
                <button
                  className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white opacity-50 cursor-not-allowed"
                  disabled
                >
                  Use Browser Menu to Install
                </button>
              )}
              {!deferredPrompt && !isIOS && (
                <button
                  onClick={() => console.log('PWA: Install prompt not yet available')}
                  className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white opacity-50 cursor-not-allowed"
                  disabled
                >
                  Install from Browser Menu (⋮ → Install App)
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
