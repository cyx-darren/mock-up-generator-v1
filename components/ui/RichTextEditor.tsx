'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  className,
  minHeight = '200px',
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  useEffect(() => {
    setIsEditorReady(true);
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  };

  const execCommand = (command: string, value?: string) => {
    if (disabled) return;

    document.execCommand(command, false, value);

    // Update active formats
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });

    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleSelectionChange = () => {
    if (disabled) return;

    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  };

  const insertList = (type: 'ul' | 'ol') => {
    if (disabled) return;

    if (type === 'ul') {
      execCommand('insertUnorderedList');
    } else {
      execCommand('insertOrderedList');
    }
  };

  const formatBlock = (tag: string) => {
    if (disabled) return;
    execCommand('formatBlock', `<${tag}>`);
  };

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
        {
          'bg-blue-100 dark:bg-blue-900 border-blue-500': active,
          'opacity-50 cursor-not-allowed': disabled,
        }
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn('border border-gray-300 dark:border-gray-600 rounded-lg', className)}>
      {/* Toolbar */}
      <div className="border-b border-gray-300 dark:border-gray-600 p-2 flex flex-wrap gap-1">
        {/* Format Buttons */}
        <ToolbarButton
          onClick={() => execCommand('bold')}
          active={activeFormats.bold}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => execCommand('italic')}
          active={activeFormats.italic}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => execCommand('underline')}
          active={activeFormats.underline}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* List Buttons */}
        <ToolbarButton onClick={() => insertList('ul')} title="Bullet List">
          <span className="text-sm">•</span>
        </ToolbarButton>

        <ToolbarButton onClick={() => insertList('ol')} title="Numbered List">
          <span className="text-sm">1.</span>
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Heading Buttons */}
        <ToolbarButton onClick={() => formatBlock('h3')} title="Heading 3">
          <span className="text-sm font-semibold">H3</span>
        </ToolbarButton>

        <ToolbarButton onClick={() => formatBlock('p')} title="Paragraph">
          <span className="text-sm">P</span>
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        className={cn(
          'p-4 outline-none min-h-[200px] prose prose-sm max-w-none dark:prose-invert',
          'focus:ring-2 focus:ring-blue-500 focus:ring-inset',
          'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
          {
            'opacity-50 cursor-not-allowed': disabled,
          }
        )}
        style={{ minHeight }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Character Count */}
      <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
        {value.replace(/<[^>]*>/g, '').length} characters
      </div>

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }
        [contenteditable] p {
          margin: 0.5rem 0;
        }
        [contenteditable] ul,
        [contenteditable] ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}
