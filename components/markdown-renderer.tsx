"use client"

import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        components={{
          // Paragraphs
          p: ({ children }) => <p className="mb-3 leading-relaxed text-sm">{children}</p>,

          // Headings
          h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-3">{children}</h3>,

          // Lists
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,

          // Inline code
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "")
            const codeString = String(children).replace(/\n$/, "")

            if (!inline && match) {
              // Code block with syntax highlighting
              return (
                <div className="relative my-3 rounded-lg overflow-hidden border border-border/30">
                  <div className="flex items-center justify-between bg-muted/50 px-3 py-2 border-b border-border/30">
                    <span className="text-xs font-mono text-muted-foreground">{match[1]}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyCode(codeString)}
                      className="h-6 gap-1 text-xs px-2"
                    >
                      {copiedCode === codeString ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    className="!m-0 !bg-[#1e1e1e] text-xs"
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      background: "#1e1e1e",
                    }}
                    {...props}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              )
            }

            // Inline code
            return (
              <code
                className="bg-muted/50 text-primary px-1.5 py-0.5 rounded text-xs font-mono border border-border/30"
                {...props}
              >
                {children}
              </code>
            )
          },

          // Bold text
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,

          // Italic text
          em: ({ children }) => <em className="italic">{children}</em>,

          // Links
          a: ({ children, href }) => (
            <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic my-3 text-muted-foreground">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
