import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface ScreenshotShieldProps {
  roomId: string;
  currentUserName: string;
  children: React.ReactNode;
}

export const ScreenshotShield: React.FC<ScreenshotShieldProps> = ({
  roomId,
  currentUserName,
  children
}) => {
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [captureAttempt, setCaptureAttempt] = useState(false);

  useEffect(() => {
    // Window focus and tab visibility listeners
    const handleBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleFocus = () => {
      // Small debounce before restoring view
      setTimeout(() => {
        setIsWindowBlurred(false);
      }, 150);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsWindowBlurred(true);
      } else {
        setTimeout(() => {
          setIsWindowBlurred(false);
        }, 150);
      }
    };

    // Keyboard shortcut prevention (PrintScreen, Snipping tool, Print to PDF)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isPrintScreen = e.key === 'PrintScreen' || e.code === 'PrintScreen';
      const isSnippingTool =
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === 's' || e.key === 'S' || e.code === 'KeyS');
      const isPrint =
        (e.metaKey || e.ctrlKey) &&
        (e.key === 'p' || e.key === 'P' || e.code === 'KeyP');
      const isMacScreenCapture =
        e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key);

      if (isPrintScreen || isSnippingTool || isPrint || isMacScreenCapture) {
        e.preventDefault();
        e.stopPropagation();
        triggerCaptureAlert();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        triggerCaptureAlert();
      }
    };

    // Triggered when screenshot is attempted
    const triggerCaptureAlert = () => {
      setCaptureAttempt(true);
      // Overwrite clipboard with security notification
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(
            '⚠️ [VEIL// SECURITY NOTICE]: Content is encrypted and screenshot-restricted.'
          );
        }
      } catch (err) {
        // Clipboard access might require focus
      }

      setTimeout(() => {
        setCaptureAttempt(false);
      }, 4000);
    };

    // Context menu prevention on right click
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu only on standard input elements
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden no-select select-none"
      onClick={() => {
        if (isWindowBlurred) setIsWindowBlurred(false);
      }}
    >
      {/* Dynamic Ephemeral Watermark Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-30 opacity-40 select-none overflow-hidden veil-shield-watermark flex flex-wrap gap-12 p-4 items-center justify-around font-mono text-[9px] text-offwhite/5 uppercase"
        style={{ transform: 'rotate(-4deg) scale(1.05)' }}
      >
        {[...Array(18)].map((_, i) => (
          <span key={i} className="whitespace-nowrap tracking-widest">
            VEIL// {roomId} • {currentUserName} • SECURE_NODE • NO_RECORD
          </span>
        ))}
      </div>

      {/* Main Content Viewport with Privacy Blur if unfocused */}
      <div
        className={`w-full h-full transition-all duration-200 ${
          isWindowBlurred ? 'privacy-blur-active pointer-events-none' : ''
        }`}
      >
        {children}
      </div>

      {/* Unfocus / Screen Recording Shield Barrier */}
      {isWindowBlurred && (
        <div className="absolute inset-0 z-50 bg-ink/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none font-mono">
          <div className="border-2 border-danger bg-ink-950 p-6 sm:p-8 max-w-md shadow-brutal-white relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 text-danger mb-3">
              <ShieldAlert className="w-8 h-8 animate-pulse text-danger" />
              <span className="text-sm font-black tracking-widest uppercase">
                ANTI_SCREENSHOT_SHIELD // ARMED
              </span>
            </div>
            <p className="text-xs text-offwhite/80 mb-4 leading-relaxed font-mono">
              WINDOW UNFOCUS OR CAPTURE TOOL DETECTED.
              <br />
              EPHEMERAL CONTENTS ARE REDACTED IN REAL TIME TO PREVENT EXTERNAL RECORDING.
            </p>
            <div className="p-2 border border-acid/50 bg-ink text-[11px] text-acid font-bold tracking-wider cursor-pointer">
              CLICK WINDOW TO RESTORE TERMINAL_
            </div>
          </div>
        </div>
      )}

      {/* Intercept Alert Banner */}
      {captureAttempt && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-danger text-offwhite border-2 border-offwhite px-5 py-2 font-mono text-xs font-black shadow-brutal-white flex items-center gap-2.5 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span>SCREEN_CAPTURE ATTEMPT INTERCEPTED & BLOCKED BY VEIL// SECURITY PROTOCOL</span>
        </div>
      )}
    </div>
  );
};
