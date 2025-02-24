'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Mark, mergeAttributes } from '@tiptap/core';
import { Button } from './ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Focus,
  FileText,
  FileDown,
  Quote,
  Strikethrough,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import { Editor as TiptapEditor } from '@tiptap/react';

const CustomFontSize = Mark.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addAttributes() {
    return {
      size: {
        default: 'normal',
        parseHTML: element => {
          return element.style.fontSize?.replace('rem', '') || 'normal';
        },
        renderHTML: attributes => {
          if (!attributes.size || attributes.size === 'normal') {
            return {};
          }

          return {
            style: `font-size: ${attributes.size}rem`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        style: 'font-size',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options, HTMLAttributes), 0];
  },
});

const MenuBar = ({
  editor,
  isFocusMode,
  setIsFocusMode,
}: {
  editor: TiptapEditor | null;
  isFocusMode: boolean;
  setIsFocusMode: (value: boolean) => void;
}) => {
  if (!editor) {
    return null;
  }

  const handleExportTxt = () => {
    const content = editor.getText();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDocx = () => {
    const content = editor.getHTML();
    // For now, we'll just download as HTML. In a real app, you'd want to convert to DOCX
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center justify-between border-b">
      <div className="flex items-center gap-1 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`hover:bg-primary hover:text-primary-foreground ${editor.isActive('paragraph') ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`hover:bg-primary hover:text-primary-foreground ${editor.isActive('heading', { level: 1 }) ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`hover:bg-primary hover:text-primary-foreground ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`hover:bg-primary hover:text-primary-foreground ${editor.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`hover:bg-primary hover:text-primary-foreground ${editor.isActive('blockquote') ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="mx-2 h-6 w-px bg-border" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`hover:bg-primary hover:text-primary-foreground ${editor.isActive('bold') ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`hover:bg-primary hover:text-primary-foreground ${editor.isActive('italic') ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`hover:bg-primary hover:text-primary-foreground ${editor.isActive('underline') ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`hover:bg-primary hover:text-primary-foreground ${editor.isActive('strike') ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportTxt}
          className="text-blue-500 hover:bg-blue-50 hover:text-blue-600"
        >
          <FileText className="mr-2 h-4 w-4" />
          TXT
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportDocx}
          className="text-blue-500 hover:bg-blue-50 hover:text-blue-600"
        >
          <FileDown className="mr-2 h-4 w-4" />
          DOCX
        </Button>
        <div className="mx-2 h-6 w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFocusMode(!isFocusMode)}
          className="text-blue-500 hover:bg-blue-50 hover:text-blue-600"
        >
          <Focus className="mr-2 h-4 w-4" />
          {isFocusMode ? 'Exit Focus' : 'Focus'}
        </Button>
      </div>
    </div>
  );
};

interface EditorProps {
  content: string;
  onUpdate: (content: string) => void;
  isLoading?: boolean;
}

export function Editor({ content, onUpdate, isLoading = false }: EditorProps) {
  const [wordCount, setWordCount] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const updateWordCount = useCallback((text: string) => {
    const words = text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
    setWordCount(words.length);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      CustomFontSize,
      Highlight,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      updateWordCount(editor.getText());
      onUpdate(html);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-base max-w-none focus:outline-none w-full h-full overflow-y-auto px-4 py-2',
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor) {
      // If the content starts with '<', assume it's HTML; otherwise, convert markdown to HTML.
      const newContent = content.trim().startsWith('<') ? content : marked(content);

      // Only update if the new content is different from the current editor HTML.
      if (newContent !== editor.getHTML()) {
        editor.commands.setContent(newContent);
        updateWordCount(editor.getText());
      }
    }
  }, [editor, content, updateWordCount]);

  return (
    <div
      className={`flex h-full w-full flex-col ${isFocusMode ? 'fixed inset-0 z-50 bg-background/95 backdrop-blur-sm' : ''}`}
    >
      <MenuBar editor={editor} isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} />
      <div
        className={`relative flex min-h-0 flex-1 flex-col ${isFocusMode ? 'container mx-auto max-w-3xl' : ''}`}
      >
        <div className="flex-1 overflow-auto">
          <EditorContent editor={editor} className="h-full" />
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="animate-pulse text-sm text-muted-foreground">Processing...</p>
            </div>
          </div>
        )}
        <div className="border-t p-2 text-right text-sm text-muted-foreground">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </div>
      </div>
    </div>
  );
}
