import React from 'react';
import { FileText, Save, Download, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface MockArtifactCanvasProps {
  documentTitle: string;
  content: React.ReactNode;
}

export const MockArtifactCanvas: React.FC<MockArtifactCanvasProps> = ({
  documentTitle,
  content,
}) => {
  return (
    <div className="flex flex-col w-full h-full rounded-xl overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.5)] border-l border-white/5 bg-[#0a0a0a]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 h-14 bg-[#0a0a0a] border-b border-white/5 text-white shrink-0">
        {/* Left: Icon and Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText size={16} className="text-zinc-400 shrink-0" />
          <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase truncate">
            {documentTitle}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
          <button className="h-8 px-3 rounded-lg bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] hover:text-white border border-white/10 hover:border-white/15 text-xs font-medium flex items-center gap-1.5 transition-all duration-200">
            <Save size={13} className="text-zinc-400" /><span className="hidden sm:inline"> Save to Project</span>
          </button>
          <button className="h-8 px-2.5 rounded-lg bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 border border-white/5 hover:border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all duration-200">
            <Download size={13} className="text-zinc-500" /><span className="hidden sm:inline"> CSV</span>
          </button>
          <button className="h-8 px-2.5 rounded-lg bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 border border-white/5 hover:border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all duration-200">
            <Download size={13} className="text-zinc-500" /><span className="hidden sm:inline"> DOCX</span>
          </button>
          <button className="h-8 px-2.5 rounded-lg bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 border border-white/5 hover:border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all duration-200">
            <Download size={13} className="text-zinc-500" /><span className="hidden sm:inline"> PDF</span>
          </button>
          <div className="w-px h-3 bg-zinc-800/85 mx-1"></div>
          <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-md transition-colors cursor-default">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0a0a0a] text-zinc-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={documentTitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-[816px] mx-auto bg-[#18181b] shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/5 min-h-[400px] sm:min-h-[800px] p-6 sm:p-12 md:p-16 relative rounded-md"
          >
            <div 
              className="text-2xl font-bold tracking-tight mb-8 text-white border-b border-white/5 pb-4"
              role="heading"
              aria-level={3}
            >
              {documentTitle}
            </div>
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
