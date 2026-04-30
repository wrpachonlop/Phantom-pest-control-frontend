"use client";

import React, { useState, useEffect, useRef } from "react";

interface Props {
  defaultValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PhotonAddressInput({ defaultValue = "", onChange, placeholder }: Props) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú si haces clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3 || !isOpen) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        // Priorizamos Vancouver (lat: 49.28, lon: -123.12)
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lat=49.28&lon=-123.12&location_bias_scale=0.5`;
        const res = await fetch(url);
        const data = await res.json();
        
        // Filtramos solo resultados de Canadá
        const canadaOnly = data.features.filter((f: any) => f.properties.countrycode === "CA");
        setSuggestions(canadaOnly);
      } catch (error) {
        console.error("Error fetching from Photon:", error);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isOpen]);

  const handleSelect = (feature: any) => {
    const p = feature.properties;
    // Formato: "Número Calle, Ciudad, Código Postal"
    const display = [
      p.housenumber ? `${p.housenumber} ${p.name}` : p.name,
      p.city,
      p.postcode
    ].filter(Boolean).join(", ");

    setQuery(display);
    onChange(display);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        className="input-base w-full"
        placeholder={placeholder || "Start typing address..."}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
      />

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
              onClick={() => handleSelect(s)}
            >
              <div className="text-sm font-semibold text-gray-900">
                {s.properties.housenumber} {s.properties.name}
              </div>
              <div className="text-xs text-gray-500">
                {s.properties.city}, {s.properties.state} {s.properties.postcode || ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}