"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white active:bg-primary-dark"
    >
      <Printer className="size-4" />
      Yazdır
    </button>
  );
}
