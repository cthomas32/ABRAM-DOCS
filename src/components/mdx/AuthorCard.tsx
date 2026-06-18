import React from "react";

interface AuthorCardProps {
  name: string;
  title: string;
  image: string;
}

export function AuthorCard({ name, title, image }: AuthorCardProps) {
  return (
    <div className="flex items-center gap-4 p-6 bg-zinc-900/50 backdrop-blur-md rounded-xl border border-white/8 mt-12 font-sans select-text">
      <img 
        src={image} 
        alt={name} 
        className="w-14 h-14 rounded-full object-cover shrink-0 border border-white/10 select-none pointer-events-none" 
      />
      <div className="space-y-0.5">
        <p className="text-zinc-100 font-semibold text-[15px] leading-snug m-0">{name}</p>
        <p className="text-zinc-400 text-xs leading-snug m-0">{title}</p>
      </div>
    </div>
  );
}
