"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import { Mark, mergeAttributes } from '@tiptap/core';
import { Button } from './ui/button';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Minus,
    Plus,
    Focus,
    FileText,
    FileDown,
} from 'lucide-react';
import { useState } from 'react';

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

    const sizes = {
        small: '0.875',    // 14px
        normal: '1',      // 16px
        large: '1.125'    // 18px
    };

    const sizeOrder = ['small', 'normal', 'large'] as const;

    const getCurrentSizeIndex = () => {
        if (editor.isActive('fontSize', { size: sizes.small })) return 0;
        if (editor.isActive('fontSize', { size: sizes.large })) return 2;
        return 1; // normal
    };

    const decreaseSize = () => {
        const currentIndex = getCurrentSizeIndex();
        const newIndex = Math.max(0, currentIndex - 1);
        const newSize = sizeOrder[newIndex];

        if (newSize === 'normal') {
            editor.chain().focus().unsetMark('fontSize').run();
        } else {
            editor.chain().focus().setMark('fontSize', { size: sizes[newSize] }).run();
        }
    };

    const increaseSize = () => {
        const currentIndex = getCurrentSizeIndex();
        const newIndex = Math.min(2, currentIndex + 1);
        const newSize = sizeOrder[newIndex];

        if (newSize === 'normal') {
            editor.chain().focus().unsetMark('fontSize').run();
        } else {
            editor.chain().focus().setMark('fontSize', { size: sizes[newSize] }).run();
        }
    };

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
                <div className="w-px h-6 bg-border mx-2" />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={decreaseSize}
                    disabled={getCurrentSizeIndex() === 0}
                    className="hover:bg-primary hover:text-primary-foreground"
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={increaseSize}
                    disabled={getCurrentSizeIndex() === 2}
                    className="hover:bg-primary hover:text-primary-foreground"
                >
                    <Plus className="h-4 w-4" />
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

export function Editor() {
    const [wordCount, setWordCount] = useState(0);
    const [isFocusMode, setIsFocusMode] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                codeBlock: false,
            }),
            Underline,
            TextStyle,
            CustomFontSize,
        ],
        content: '',
        onUpdate: ({ editor }) => {
            const text = editor.getText();
            const words = text.trim().split(/\s+/).filter(word => word.length > 0);
            setWordCount(words.length);
        },
        editorProps: {
            attributes: {
                class: 'prose max-w-none focus:outline-none h-full w-full overflow-y-auto px-4 py-2',
            },
        },
    });

    return (
        <div className={`flex flex-col h-full w-full overflow-hidden transition-all duration-300 ${isFocusMode ? 'fixed inset-0 bg-background/95 backdrop-blur-sm z-50' : ''}`}>
            <div className={`flex items-center justify-between border-b ${isFocusMode ? 'px-4' : ''}`}>
                <MenuBar
                    editor={editor}
                    isFocusMode={isFocusMode}
                    setIsFocusMode={setIsFocusMode}
                />
            </div>
            <div className={`flex-1 flex flex-col min-h-0 ${isFocusMode ? 'container mx-auto max-w-3xl' : ''}`}>
                <EditorContent editor={editor} className="flex-1 overflow-auto" />
                <div className="p-2 text-sm text-muted-foreground text-right border-t">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </div>
            </div>
        </div>
    );
} 