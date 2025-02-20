"use client";

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
import { useState, useEffect } from 'react';
import { marked } from 'marked';

const CustomFontSize = Mark.create({
    name: 'fontSize',

    addOptions() {
        return {
            types: ['textStyle'],
        }
    },

    addAttributes() {
        return {
            size: {
                default: 'normal',
                parseHTML: element => {
                    return element.style.fontSize?.replace('rem', '') || 'normal'
                },
                renderHTML: attributes => {
                    if (!attributes.size || attributes.size === 'normal') {
                        return {}
                    }

                    return {
                        style: `font-size: ${attributes.size}rem`,
                    }
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                style: 'font-size',
            },
        ]
    },

    renderHTML({ mark, HTMLAttributes }) {
        return ['span', mergeAttributes(this.options, HTMLAttributes), 0]
    },
});

const MenuBar = ({ editor, isFocusMode, setIsFocusMode }: {
    editor: any;
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

                <div className="w-px h-6 bg-border mx-2" />

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
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                >
                    <FileText className="h-4 w-4 mr-2" />
                    TXT
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportDocx}
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                >
                    <FileDown className="h-4 w-4 mr-2" />
                    DOCX
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                >
                    <Focus className="h-4 w-4 mr-2" />
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

    const updateWordCount = (text: string) => {
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3]
                },
            }),
            Underline,
            TextStyle,
            CustomFontSize,
            Highlight,
        ],
        content: '',
        onUpdate: ({ editor }) => {
            const text = editor.getText();
            updateWordCount(text);
            onUpdate(text);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-base max-w-none focus:outline-none w-full h-full overflow-y-auto px-4 py-2',
            },
        },
    });

    // Update editor content when prop changes, parse markdown if content changes
    useEffect(() => {
        if (editor && content !== editor.getText()) {
            // Parse markdown to HTML
            const html = marked(content);
            editor.commands.setContent(html);
            // Update word count after content is set
            updateWordCount(content);
        }
    }, [content, editor]);

    return (
        <div className={`flex flex-col h-full w-full ${isFocusMode ? 'fixed inset-0 bg-background/95 backdrop-blur-sm z-50' : ''}`}>
            <MenuBar
                editor={editor}
                isFocusMode={isFocusMode}
                setIsFocusMode={setIsFocusMode}
            />
            <div className={`flex-1 min-h-0 relative flex flex-col ${isFocusMode ? 'container mx-auto max-w-3xl' : ''}`}>
                <div className="flex-1 overflow-auto">
                    <EditorContent editor={editor} className="h-full" />
                </div>
                {isLoading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground animate-pulse">Processing...</p>
                        </div>
                    </div>
                )}
                <div className="p-2 text-sm text-muted-foreground text-right border-t">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </div>
            </div>
        </div>
    );
} 