"use client"

import { useEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle, FontFamily, FontSize as TiptapFontSize } from "@tiptap/extension-text-style"
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table"
import { useCallback, useEffect, useState, useRef } from "react"
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Sparkles,
  Loader2,
  ChevronDown,
  Table as TableIcon,
  Plus,
  Minus,
  Trash2,
  Columns,
  Rows,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus as HorizontalRuleIcon,
  Smile,
  Type,
  ALargeSmall,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


// Available fonts and sizes
const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Sans Serif", value: "Inter, ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, ui-serif, serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, monospace" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Times New Roman", value: "Times New Roman, Times, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Courier New", value: "Courier New, monospace" },
]

const FONT_SIZES = [
  { label: "Small", value: "12px" },
  { label: "Normal", value: "" },
  { label: "Medium", value: "16px" },
  { label: "Large", value: "18px" },
  { label: "X-Large", value: "24px" },
  { label: "XX-Large", value: "32px" },
]

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  onAIAssist?: (prompt: string, selectedText: string) => Promise<string>
  onTextSelect?: (selectedText: string) => void
  placeholder?: string
  className?: string
  editorClassName?: string
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 w-8 p-0",
        isActive && "bg-muted"
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-1" />
}

export function RichTextEditor({
  content,
  onChange,
  onAIAssist,
  onTextSelect,
  placeholder = "Start writing...",
  className,
  editorClassName,
}: RichTextEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMenuOpen, setAiMenuOpen] = useState(false)
  const [tableMenuOpen, setTableMenuOpen] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [fontMenuOpen, setFontMenuOpen] = useState(false)
  const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setEmojiPickerOpen(false)
      }
    }
    if (emojiPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [emojiPickerOpen])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        horizontalRule: {
          HTMLAttributes: {
            class: "my-6 border-t border-border",
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer hover:text-primary/80",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      Underline,
      TextStyle,
      FontFamily,
      TiptapFontSize,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-border bg-muted/50 px-3 py-2 text-left font-semibold",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-border px-3 py-2",
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3",
          editorClassName
        ),
      },
      // Parse pasted HTML content - preserve structure while cleaning up problematic styles
      transformPastedHTML(html) {
        // Create a temporary container to parse and clean the HTML
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = html

        // Remove Notion-specific data attributes and classes that break rendering
        const elementsToClean = tempDiv.querySelectorAll('*')
        elementsToClean.forEach((el) => {
          // Remove data-* attributes that can cause issues
          Array.from(el.attributes).forEach((attr) => {
            if (attr.name.startsWith('data-') || attr.name === 'contenteditable') {
              el.removeAttribute(attr.name)
            }
          })

          // Remove Notion-specific classes but keep semantic ones
          const classList = Array.from(el.classList)
          classList.forEach((className) => {
            if (className.startsWith('notion-') ||
                className.includes('block-') ||
                className.includes('page-')) {
              el.classList.remove(className)
            }
          })

          // Clean up problematic inline styles but preserve text formatting
          const style = el.getAttribute('style')
          if (style) {
            // Keep only essential text styles
            const allowedStyles = ['font-weight', 'font-style', 'text-decoration']
            const styleMap: Record<string, string> = {}
            style.split(';').forEach((rule) => {
              const [prop, value] = rule.split(':').map(s => s?.trim())
              if (prop && value && allowedStyles.some(allowed => prop.includes(allowed))) {
                styleMap[prop] = value
              }
            })
            const newStyle = Object.entries(styleMap).map(([k, v]) => `${k}: ${v}`).join('; ')
            if (newStyle) {
              el.setAttribute('style', newStyle)
            } else {
              el.removeAttribute('style')
            }
          }
        })

        // Convert Notion-style checkboxes to bullet points
        const checkboxes = tempDiv.querySelectorAll('input[type="checkbox"]')
        checkboxes.forEach((checkbox) => {
          const parent = checkbox.parentElement
          if (parent) {
            checkbox.remove()
          }
        })

        return tempDiv.innerHTML
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onSelectionUpdate: ({ editor }) => {
      if (onTextSelect) {
        const { from, to } = editor.state.selection
        const selectedText = editor.state.doc.textBetween(from, to, " ")
        if (selectedText.trim()) {
          onTextSelect(selectedText)
        }
      }
    },
    // Enable parsing of pasted content
    parseOptions: {
      preserveWhitespace: "full",
    },
  })

  // Update content when prop changes (for initial load)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const handleEmojiSelect = useCallback((emojiData: EmojiClickData) => {
    if (!editor) return
    editor.chain().focus().insertContent(emojiData.emoji).run()
    setEmojiPickerOpen(false)
  }, [editor])

  const handleSetLink = useCallback(() => {
    if (!editor) return

    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run()
    }
    setLinkDialogOpen(false)
    setLinkUrl("")
  }, [editor, linkUrl])

  const handleRemoveLink = useCallback(() => {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
    setLinkDialogOpen(false)
  }, [editor])

  const handleAddImage = useCallback(() => {
    if (!editor || !imageUrl) return
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setImageDialogOpen(false)
    setImageUrl("")
  }, [editor, imageUrl])

  const handleAIAssist = useCallback(async (action: string) => {
    if (!editor || !onAIAssist) return

    setAiLoading(true)
    setAiMenuOpen(false)

    try {
      const { from, to } = editor.state.selection
      const selectedText = editor.state.doc.textBetween(from, to, " ")

      let prompt = ""
      switch (action) {
        case "improve":
          prompt = "Improve the writing quality, clarity, and flow of this text while keeping the same meaning:"
          break
        case "simplify":
          prompt = "Simplify this text to make it clearer and more concise:"
          break
        case "expand":
          prompt = "Expand on this idea with more detail and examples:"
          break
        case "summarize":
          prompt = "Summarize the key points of this text:"
          break
        case "fix-grammar":
          prompt = "Fix any grammar, spelling, and punctuation errors in this text:"
          break
        case "continue":
          prompt = "Continue writing from where this text left off, maintaining the same style and context:"
          break
        default:
          prompt = action
      }

      const textToProcess = selectedText || editor.getText()
      const result = await onAIAssist(prompt, textToProcess)

      if (result) {
        if (selectedText) {
          // Replace selection with AI result
          editor.chain().focus().deleteSelection().insertContent(result).run()
        } else {
          // Append AI result at the end
          editor.chain().focus().insertContent(`\n\n${result}`).run()
        }
      }
    } catch (error) {
      console.error("AI assist error:", error)
    } finally {
      setAiLoading(false)
    }
  }, [editor, onAIAssist])

  if (!editor) {
    return null
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden flex flex-col", className)}>
      {/* Sticky Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1 border-b bg-muted/50 sticky top-0 z-10">
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Font Family */}
        <DropdownMenu open={fontMenuOpen} onOpenChange={setFontMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 min-w-[80px] justify-between"
              title="Font family"
            >
              <Type className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {FONT_FAMILIES.map((font) => (
              <DropdownMenuItem
                key={font.label}
                onClick={() => {
                  if (font.value) {
                    editor.chain().focus().setFontFamily(font.value).run()
                  } else {
                    editor.chain().focus().unsetFontFamily().run()
                  }
                  setFontMenuOpen(false)
                }}
                className={cn(
                  font.value && editor.isActive("textStyle", { fontFamily: font.value }) && "bg-muted"
                )}
                style={{ fontFamily: font.value || undefined }}
              >
                {font.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Font Size */}
        <DropdownMenu open={fontSizeMenuOpen} onOpenChange={setFontSizeMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 min-w-[70px] justify-between"
              title="Font size"
            >
              <ALargeSmall className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-32">
            {FONT_SIZES.map((size) => (
              <DropdownMenuItem
                key={size.label}
                onClick={() => {
                  if (size.value) {
                    editor.chain().focus().setFontSize(size.value).run()
                  } else {
                    editor.chain().focus().unsetFontSize().run()
                  }
                  setFontSizeMenuOpen(false)
                }}
                className={cn(
                  size.value && editor.isActive("textStyle", { fontSize: size.value }) && "bg-muted"
                )}
              >
                {size.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Text Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Align left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Align center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Align right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Horizontal Rule */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Insert divider"
        >
          <HorizontalRuleIcon className="h-4 w-4" />
        </ToolbarButton>

        {/* Emoji Picker */}
        <div className="relative" ref={emojiPickerRef}>
          <ToolbarButton
            onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
            isActive={emojiPickerOpen}
            title="Insert emoji"
          >
            <Smile className="h-4 w-4" />
          </ToolbarButton>
          {emojiPickerOpen && (
            <div className="absolute top-full left-0 z-50 mt-1">
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                theme={Theme.AUTO}
                width={320}
                height={400}
                searchPlaceholder="Search emoji..."
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Link and Image */}
        <ToolbarButton
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href
            setLinkUrl(previousUrl || "")
            setLinkDialogOpen(true)
          }}
          isActive={editor.isActive("link")}
          title="Add link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setImageDialogOpen(true)}
          title="Add image"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        {/* Table */}
        <DropdownMenu open={tableMenuOpen} onOpenChange={setTableMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("table") && "bg-muted"
              )}
              title="Table"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                setTableMenuOpen(false)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Insert table
            </DropdownMenuItem>
            {editor.isActive("table") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    editor.chain().focus().addRowBefore().run()
                    setTableMenuOpen(false)
                  }}
                >
                  <Rows className="h-4 w-4 mr-2" />
                  Add row above
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    editor.chain().focus().addRowAfter().run()
                    setTableMenuOpen(false)
                  }}
                >
                  <Rows className="h-4 w-4 mr-2" />
                  Add row below
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    editor.chain().focus().deleteRow().run()
                    setTableMenuOpen(false)
                  }}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Delete row
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    editor.chain().focus().addColumnBefore().run()
                    setTableMenuOpen(false)
                  }}
                >
                  <Columns className="h-4 w-4 mr-2" />
                  Add column left
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    editor.chain().focus().addColumnAfter().run()
                    setTableMenuOpen(false)
                  }}
                >
                  <Columns className="h-4 w-4 mr-2" />
                  Add column right
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    editor.chain().focus().deleteColumn().run()
                    setTableMenuOpen(false)
                  }}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Delete column
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    editor.chain().focus().deleteTable().run()
                    setTableMenuOpen(false)
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete table
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarDivider />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        {/* AI Assistant */}
        {onAIAssist && (
          <>
            <ToolbarDivider />
            <DropdownMenu open={aiMenuOpen} onOpenChange={setAiMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 gap-1 px-2 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20",
                    aiLoading && "opacity-50"
                  )}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">AI Assist</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => handleAIAssist("improve")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Improve writing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAIAssist("simplify")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Simplify
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAIAssist("expand")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Expand on this
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAIAssist("summarize")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Summarize
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAIAssist("fix-grammar")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Fix grammar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAIAssist("continue")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Continue writing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Editor content - scrollable area */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {editor.isActive("link") && (
              <Button variant="outline" onClick={handleRemoveLink}>
                Remove Link
              </Button>
            )}
            <Button onClick={handleSetLink}>
              {editor.isActive("link") ? "Update" : "Add"} Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddImage}>Add Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { type Editor }
