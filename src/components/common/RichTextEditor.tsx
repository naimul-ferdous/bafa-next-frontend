"use client";

import React, { useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Sync internal state with external value
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
    isInternalUpdate.current = false;
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      isInternalUpdate.current = true;
      onChange(newValue === "<br>" ? "" : newValue);
    }
  };

  const execCommand = (command: string, val: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, val);
      handleInput();
    }
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all ${className} relative`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("bold"); }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Bold"
        >
          <Icon icon="hugeicons:text-bold" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("italic"); }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Italic"
        >
          <Icon icon="hugeicons:text-italic" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("underline"); }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Underline"
        >
          <Icon icon="hugeicons:text-underline" className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("insertUnorderedList"); }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Bullet List"
        >
          <Icon icon="hugeicons:left-to-right-list-bullet" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("insertOrderedList"); }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Numbered List"
        >
          <Icon icon="hugeicons:left-to-right-list-number" className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("undo"); }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Undo"
        >
          <Icon icon="hugeicons:undo-03" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("redo"); }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Redo"
        >
          <Icon icon="hugeicons:redo-03" className="w-4 h-4" />
        </button>
      </div>

      {/* Editable Area */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="p-4 min-h-[150px] outline-none prose prose-sm max-w-none text-gray-900 overflow-y-auto"
          style={{
            lineHeight: "1.6",
            fontSize: "14px",
          }}
        />
        {!value && (
          <div className="absolute top-4 left-4 pointer-events-none text-gray-400 text-sm">
            {placeholder}
          </div>
        )}
      </div>
      
      {/* Simple styling for rich text lists */}
      <style jsx global>{`
        [contenteditable] ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        [contenteditable] ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        [contenteditable] p { margin: 0.5rem 0; }
      `}</style>
    </div>
  );
}
