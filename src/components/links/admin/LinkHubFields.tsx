"use client";

import React from "react";
import { LINK_ICON_KEYS, SOCIAL_ICON_KEYS } from "@/lib/linkHub";
import LinkHubIcon from "../LinkHubIcon";

/** Shared form controls for the link hub admin panels. */

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-full bg-white/[0.04] border border-white/10 px-4 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition-all min-h-[36px]"
      />
      {hint ? <span className="text-[9px] text-zinc-600 mt-1 block">{hint}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block mb-1.5">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition-all resize-y leading-relaxed"
      />
    </label>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block mb-1.5">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          aria-label={`${label} colour`}
          className="w-10 h-9 rounded-lg bg-transparent border border-white/10 cursor-pointer p-0.5 shrink-0"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          spellCheck={false}
          className="flex-1 min-w-0 rounded-full bg-white/[0.04] border border-white/10 px-3 py-2 text-[11px] font-mono text-white outline-none focus:border-white/20 min-h-[36px]"
        />
      </div>
    </label>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  unit = "",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">{label}</span>
        <span className="text-[10px] font-mono text-zinc-400">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-white cursor-pointer h-9"
      />
    </label>
  );
}

export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { key: T; name: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block mb-1.5">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`px-3 min-h-[32px] rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
              value === option.key
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/5 bg-white/[0.02] text-zinc-500 hover:text-zinc-200 hover:border-white/15"
            }`}
          >
            {option.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function IconPicker({
  value,
  onChange,
  socialFirst = false,
}: {
  value: string;
  onChange: (value: string) => void;
  socialFirst?: boolean;
}) {
  const keys = socialFirst
    ? [...SOCIAL_ICON_KEYS, ...LINK_ICON_KEYS.filter((key) => !SOCIAL_ICON_KEYS.includes(key))]
    : [...LINK_ICON_KEYS];

  return (
    <div>
      <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block mb-1.5">
        Icon
      </span>
      <div className="flex flex-wrap gap-1.5">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            title={key}
            aria-label={key}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
              value === key
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/5 bg-white/[0.02] text-zinc-500 hover:text-zinc-200 hover:border-white/15"
            }`}
          >
            <LinkHubIcon icon={key} className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function IconButton({
  children,
  label,
  onClick,
  active,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer ${
        danger
          ? "text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
          : active
            ? "text-white bg-white/10"
            : "text-zinc-500 hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

export function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border-white/8">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
