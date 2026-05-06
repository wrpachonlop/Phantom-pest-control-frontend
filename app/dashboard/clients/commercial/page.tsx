"use client";

import React from "react";
import { HardHat, Construction, ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

export default function CommercialUnderConstruction() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      {/* Icon Stack */}
      <div className="relative mb-6">
        <div className="absolute -top-4 -right-4 bg-yellow-400 p-2 rounded-full shadow-lg animate-bounce">
          <HardHat className="h-6 w-6 text-phantom-950" />
        </div>
        <div className="bg-phantom-100 p-8 rounded-2xl">
          <Building2 className="h-16 w-16 text-phantom-700" />
        </div>
      </div>

      {/* Text Content */}
      <h1 className="text-3xl font-bold text-phantom-950 mb-2">
        Commercial Module Under Construction
      </h1>
      <p className="text-gray-500 max-w-md mb-8">
        We are currently building a specialized workflow for our commercial partners 
        in Vancouver and Burnaby. This module will include inspector assignments, 
        recurring billing, and multi-location management.
      </p>

      {/* Progress Indicator (Visual only) */}
      <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mb-8">
        <div className="bg-phantom-600 h-2.5 rounded-full w-[65%] shadow-[0_0_8px_rgba(var(--color-phantom-600),0.5)]"></div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/dashboard/clients/residential"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-phantom-700 text-white rounded-xl font-semibold hover:bg-phantom-800 transition-all shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Residential
        </Link>
        
        <div className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium">
          <Construction className="h-4 w-4" />
          Phase 1: Database Ready
        </div>
      </div>

      {/* Footer Note */}
      <p className="mt-12 text-xs text-gray-400 uppercase tracking-widest">
        Phantom Pest Control Engineering • 2026
      </p>
    </div>
  );
}