"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function ThemedToaster() {
  const { theme } = useTheme();
  const toasterTheme = theme === "dark" || theme === "light" ? theme : "system";
  return <Toaster position="bottom-right" richColors closeButton theme={toasterTheme} />;
}
