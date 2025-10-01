"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Send, BookOpen, Lightbulb, ArrowLeft, Loader2, Zap, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import Link from "next/link"

interface Message {
  role: "user" | "assistant"
  content: string
  relatedConcepts?: string[]
}

interface LearningPaths {
  beginner: string[]
  intermediate: string[]
  advanced: string[]
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [learningPaths, setLearningPaths] = useState<LearningPaths | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Fetch learning paths on mount
    fetch("/api/tutor")
      .then((res) => res.json())
      .then((data) => setLearningPaths(data.learningPaths))
      .catch((err) => console.error("Failed to fetch learning paths:", err))

    // Add welcome message
    setMessages([
      {
        role: "assistant",
        content:
          "Hey there! 👋 I'm your Solana AI Tutor. I'm here to help you learn about Solana in a fun, approachable way. Pick a question from the learning paths below, or ask me anything about Solana!",
      },
    ])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const handleResize = () => {
      if (document.activeElement === inputRef.current) {
        setTimeout(() => {
          inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }, 100)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputValue.trim()
    if (!messageToSend) return

    setInputValue("")
    const newUserMessage = { role: "user" as const, content: messageToSend }
    setMessages((prev) => [...prev, newUserMessage])
    setIsLoading(true)
    setIsSidebarOpen(false)

    try {
      const conversationMessages = [...messages, newUserMessage]
        .filter((msg, index) => {
          // Skip the first message if it's the welcome message
          if (index === 0 && msg.role === "assistant" && msg.content.includes("Hey there! 👋")) {
            return false
          }
          return true
        })
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationMessages,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || data.response || "Failed to get response")
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          relatedConcepts: data.relatedConcepts,
        },
      ])
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage = error instanceof Error ? error.message : "Something went wrong"
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Oops! ${errorMessage}. Please try again.`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const difficultyColors = {
    beginner: "bg-green-500/10 text-green-500 border-green-500/20",
    intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    advanced: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  const difficultyIcons = {
    beginner: "🟢",
    intermediate: "🟡",
    advanced: "🔴",
  }

  return (
    <div className="flex flex-col min-h-screen max-h-screen bg-background text-foreground">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-8 w-8 p-0"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline text-xs sm:text-sm">Back to Explainer</span>
                  <span className="inline sm:hidden text-xs">Back</span>
                </Button>
              </Link>
              <motion.div
                className="flex items-center space-x-1.5 sm:space-x-2 min-w-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotate: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                    scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                  }}
                  className="flex-shrink-0"
                >
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </motion.div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent truncate">
                  AI Tutor
                </h1>
              </motion.div>
            </div>
            <div className="flex-shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Learning Paths Sidebar - ChatGPT style collapsible */}
        <AnimatePresence>
          {(isSidebarOpen || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 20 }}
              className={`
                fixed lg:relative inset-y-0 left-0 z-40
                w-[280px] lg:w-[300px]
                bg-background border-r border-border/40
                overflow-y-auto
                ${isSidebarOpen ? "block" : "hidden lg:block"}
                custom-scrollbar
              `}
            >
              <div className="p-4 space-y-4 h-full">
                <div className="flex items-center justify-between lg:justify-start space-x-2">
                  <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
                  <h2 className="text-lg font-semibold">Learning Paths</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden h-8 w-8 p-0 ml-auto"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {learningPaths &&
                    Object.entries(learningPaths).map(([difficulty, questions]) => (
                      <div key={difficulty} className="space-y-2">
                        <Badge
                          variant="outline"
                          className={`${difficultyColors[difficulty as keyof typeof difficultyColors]} text-xs`}
                        >
                          {difficultyIcons[difficulty as keyof typeof difficultyIcons]}{" "}
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </Badge>
                        <div className="space-y-2">
                          {questions.map((question: string, index: number) => (
                            <motion.button
                              key={index}
                              onClick={() => handleSendMessage(question)}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full text-left text-sm p-2.5 rounded-lg bg-muted/10 hover:bg-muted/20 border border-border/20 hover:border-primary/20 transition-all duration-200 text-muted-foreground hover:text-foreground leading-relaxed"
                            >
                              {question}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Messages Container - scrolls naturally in full viewport */}
          <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/20 border border-border/30"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                      )}

                      {/* Related Concepts */}
                      {message.relatedConcepts && message.relatedConcepts.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Lightbulb className="h-3 w-3 flex-shrink-0" />
                            <span>Related Concepts:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {message.relatedConcepts.map((concept, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="cursor-pointer hover:bg-primary/20 transition-colors text-xs px-2 py-0.5"
                                onClick={() => handleSendMessage(concept)}
                              >
                                {concept}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-muted/20 border border-border/30 rounded-lg p-4 flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t-2 border-border/40 bg-background/95 backdrop-blur-sm shadow-lg p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 sm:gap-3 bg-muted/30 rounded-xl p-2 border-2 border-border/60 shadow-sm">
                <Input
                  ref={inputRef}
                  placeholder="Ask me anything about Solana..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base h-10 sm:h-11 placeholder:text-muted-foreground/60"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-11 w-10 sm:w-11 p-0 flex-shrink-0 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 sm:mt-3 flex items-center gap-1 justify-center sm:justify-start">
                <Zap className="h-3 w-3 flex-shrink-0" />
                <span>Press Enter to send, Shift+Enter for new line</span>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// "use client"

// import type React from "react"
// import { useState, useEffect, useRef } from "react"
// import { motion, AnimatePresence } from "framer-motion"
// import { Sparkles, Send, BookOpen, Lightbulb, ArrowLeft, Loader2, Zap, Menu, X } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
// import { ThemeToggle } from "@/components/theme-toggle"
// import { MarkdownRenderer } from "@/components/markdown-renderer"
// import Link from "next/link"

// interface Message {
//   role: "user" | "assistant"
//   content: string
//   relatedConcepts?: string[]
// }

// interface LearningPaths {
//   beginner: string[]
//   intermediate: string[]
//   advanced: string[]
// }

// export default function TutorPage() {
//   const [messages, setMessages] = useState<Message[]>([])
//   const [inputValue, setInputValue] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const [learningPaths, setLearningPaths] = useState<LearningPaths | null>(null)
//   const [copiedCode, setCopiedCode] = useState(false)
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false)
//   const messagesEndRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     // Fetch learning paths on mount
//     fetch("/api/tutor")
//       .then((res) => res.json())
//       .then((data) => setLearningPaths(data.learningPaths))
//       .catch((err) => console.error("Failed to fetch learning paths:", err))

//     // Add welcome message
//     setMessages([
//       {
//         role: "assistant",
//         content:
//           "Hey there! 👋 I'm your Solana AI Tutor. I'm here to help you learn about Solana in a fun, approachable way. Pick a question from the learning paths below, or ask me anything about Solana!",
//       },
//     ])
//   }, [])

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
//   }, [messages])

//   const handleSendMessage = async (message?: string) => {
//     const messageToSend = message || inputValue.trim()
//     if (!messageToSend) return

//     setInputValue("")
//     const newUserMessage = { role: "user" as const, content: messageToSend }
//     setMessages((prev) => [...prev, newUserMessage])
//     setIsLoading(true)
//     setIsSidebarOpen(false)

//     try {
//       const conversationMessages = [...messages, newUserMessage]
//         .filter((msg, index) => {
//           // Skip the first message if it's the welcome message
//           if (index === 0 && msg.role === "assistant" && msg.content.includes("Hey there! 👋")) {
//             return false
//           }
//           return true
//         })
//         .map((msg) => ({
//           role: msg.role,
//           content: msg.content,
//         }))

//       const response = await fetch("/api/tutor", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           messages: conversationMessages,
//         }),
//       })

//       const data = await response.json()

//       if (!response.ok || data.error) {
//         throw new Error(data.error || data.response || "Failed to get response")
//       }

//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: data.response,
//           relatedConcepts: data.relatedConcepts,
//         },
//       ])
//     } catch (error) {
//       console.error("Failed to send message:", error)
//       const errorMessage = error instanceof Error ? error.message : "Something went wrong"
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: `Oops! ${errorMessage}. Please try again.`,
//         },
//       ])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault()
//       handleSendMessage()
//     }
//   }

//   const copyCode = async (code: string) => {
//     await navigator.clipboard.writeText(code)
//     setCopiedCode(true)
//     setTimeout(() => setCopiedCode(false), 2000)
//   }

//   const difficultyColors = {
//     beginner: "bg-green-500/10 text-green-500 border-green-500/20",
//     intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
//     advanced: "bg-red-500/10 text-red-500 border-red-500/20",
//   }

//   const difficultyIcons = {
//     beginner: "🟢",
//     intermediate: "🟡",
//     advanced: "🔴",
//   }

//   return (
//     <div className="flex flex-col h-screen bg-background text-foreground">
//       {/* Header */}
//       <motion.header
//         className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
//         initial={{ y: -100 }}
//         animate={{ y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         <div className="px-4 py-3 sm:py-4">
//           <div className="flex items-center justify-between gap-2">
//             <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="lg:hidden h-8 w-8 p-0"
//                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//               >
//                 {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//               </Button>
//               <Link href="/">
//                 <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
//                   <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
//                   <span className="hidden sm:inline text-xs sm:text-sm">Back to Explainer</span>
//                   <span className="inline sm:hidden text-xs">Back</span>
//                 </Button>
//               </Link>
//               <motion.div
//                 className="flex items-center space-x-1.5 sm:space-x-2 min-w-0"
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.2 }}
//               >
//                 <motion.div
//                   animate={{
//                     rotate: [0, 360],
//                     scale: [1, 1.1, 1],
//                   }}
//                   transition={{
//                     rotate: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
//                     scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
//                   }}
//                   className="flex-shrink-0"
//                 >
//                   <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
//                 </motion.div>
//                 <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent truncate">
//                   AI Tutor
//                 </h1>
//               </motion.div>
//             </div>
//             <div className="flex-shrink-0">
//               <ThemeToggle />
//             </div>
//           </div>
//         </div>
//       </motion.header>

//       <div className="flex flex-1 overflow-hidden">
//         {/* Learning Paths Sidebar - ChatGPT style collapsible */}
//         <AnimatePresence>
//           {(isSidebarOpen || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
//             <motion.aside
//               initial={{ x: -300 }}
//               animate={{ x: 0 }}
//               exit={{ x: -300 }}
//               transition={{ type: "spring", damping: 20 }}
//               className={`
//                 fixed lg:relative inset-y-0 left-0 z-40
//                 w-[280px] lg:w-[300px]
//                 bg-background border-r border-border/40
//                 overflow-y-auto
//                 ${isSidebarOpen ? "block" : "hidden lg:block"}
//                 custom-scrollbar
//               `}
//             >
//               <div className="p-4 space-y-4 h-full">
//                 <div className="flex items-center justify-between lg:justify-start space-x-2">
//                   <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
//                   <h2 className="text-lg font-semibold">Learning Paths</h2>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     className="lg:hidden h-8 w-8 p-0 ml-auto"
//                     onClick={() => setIsSidebarOpen(false)}
//                   >
//                     <X className="h-4 w-4" />
//                   </Button>
//                 </div>

//                 <div className="space-y-4">
//                   {learningPaths &&
//                     Object.entries(learningPaths).map(([difficulty, questions]) => (
//                       <div key={difficulty} className="space-y-2">
//                         <Badge
//                           variant="outline"
//                           className={`${difficultyColors[difficulty as keyof typeof difficultyColors]} text-xs`}
//                         >
//                           {difficultyIcons[difficulty as keyof typeof difficultyIcons]}{" "}
//                           {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
//                         </Badge>
//                         <div className="space-y-2">
//                           {questions.map((question: string, index: number) => (
//                             <motion.button
//                               key={index}
//                               onClick={() => handleSendMessage(question)}
//                               whileHover={{ x: 4 }}
//                               whileTap={{ scale: 0.98 }}
//                               className="w-full text-left text-sm p-2.5 cursor-pointer rounded-lg bg-muted/10 hover:bg-muted/20 border border-border/20 hover:border-primary/20 transition-all duration-200 text-muted-foreground hover:text-foreground leading-relaxed"
//                             >
//                               {question}
//                             </motion.button>
//                           ))}
//                         </div>
//                       </div>
//                     ))}
//                 </div>
//               </div>
//             </motion.aside>
//           )}
//         </AnimatePresence>

//         {isSidebarOpen && (
//           <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
//         )}

//         <main className="flex-1 flex flex-col overflow-hidden">
//           {/* Messages Container - scrolls naturally in full viewport */}
//           <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
//             <div className="max-w-3xl mx-auto space-y-4">
//               <AnimatePresence>
//                 {messages.map((message, index) => (
//                   <motion.div
//                     key={index}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -10 }}
//                     transition={{ delay: index * 0.1 }}
//                     className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
//                   >
//                     <div
//                       className={`max-w-[85%] rounded-lg p-4 ${
//                         message.role === "user"
//                           ? "bg-primary text-primary-foreground"
//                           : "bg-muted/20 border border-border/30"
//                       }`}
//                     >
//                       {message.role === "assistant" ? (
//                         <MarkdownRenderer content={message.content} />
//                       ) : (
//                         <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
//                       )}

//                       {/* Related Concepts */}
//                       {message.relatedConcepts && message.relatedConcepts.length > 0 && (
//                         <div className="mt-3 space-y-2">
//                           <div className="flex items-center gap-2 text-xs text-muted-foreground">
//                             <Lightbulb className="h-3 w-3 flex-shrink-0" />
//                             <span>Related Concepts:</span>
//                           </div>
//                           <div className="flex flex-wrap gap-2">
//                             {message.relatedConcepts.map((concept, i) => (
//                               <Badge
//                                 key={i}
//                                 variant="secondary"
//                                 className="cursor-pointer hover:bg-primary/20 transition-colors text-xs px-2 py-0.5"
//                                 onClick={() => handleSendMessage(concept)}
//                               >
//                                 {concept}
//                               </Badge>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </motion.div>
//                 ))}
//               </AnimatePresence>

//               {isLoading && (
//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
//                   <div className="bg-muted/20 border border-border/30 rounded-lg p-4 flex items-center space-x-2">
//                     <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary flex-shrink-0" />
//                     <span className="text-sm text-muted-foreground">Thinking...</span>
//                   </div>
//                 </motion.div>
//               )}

//               <div ref={messagesEndRef} />
//             </div>
//           </div>

//           <div className="border-t-2 border-border/40 bg-background/95 backdrop-blur-sm shadow-lg p-4 sm:p-6">
//             <div className="max-w-3xl mx-auto">
//               <div className="flex items-center gap-2 sm:gap-3 bg-muted/30 rounded-xl p-2 border-2 border-border/60 shadow-sm">
//                 <Input
//                   placeholder="Ask me anything about Solana..."
//                   value={inputValue}
//                   onChange={(e) => setInputValue(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   disabled={isLoading}
//                   className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base h-10 sm:h-11 placeholder:text-muted-foreground/60"
//                 />
//                 <Button
//                   onClick={() => handleSendMessage()}
//                   disabled={isLoading || !inputValue.trim()}
//                   className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-11 w-10 sm:w-11 p-0 flex-shrink-0 rounded-lg shadow-md hover:shadow-lg transition-all"
//                 >
//                   {isLoading ? (
//                     <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
//                   ) : (
//                     <Send className="h-4 w-4 sm:h-5 sm:w-5" />
//                   )}
//                 </Button>
//               </div>
//               <p className="text-xs text-muted-foreground mt-2 sm:mt-3 flex items-center gap-1 justify-center sm:justify-start">
//                 <Zap className="h-3 w-3 flex-shrink-0" />
//                 <span>Press Enter to send, Shift+Enter for new line</span>
//               </p>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }

// "use client"

// import type React from "react"
// import { useState, useEffect, useRef } from "react"
// import { motion, AnimatePresence } from "framer-motion"
// import { Sparkles, Send, BookOpen, Lightbulb, ArrowLeft, Loader2, Zap, Menu, X } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
// import { ThemeToggle } from "@/components/theme-toggle"
// import { MarkdownRenderer } from "@/components/markdown-renderer"
// import Link from "next/link"

// interface Message {
//   role: "user" | "assistant"
//   content: string
//   relatedConcepts?: string[]
// }

// interface LearningPaths {
//   beginner: string[]
//   intermediate: string[]
//   advanced: string[]
// }

// export default function TutorPage() {
//   const [messages, setMessages] = useState<Message[]>([])
//   const [inputValue, setInputValue] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const [learningPaths, setLearningPaths] = useState<LearningPaths | null>(null)
//   const [copiedCode, setCopiedCode] = useState(false)
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false)
//   const messagesEndRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     // Fetch learning paths on mount
//     fetch("/api/tutor")
//       .then((res) => res.json())
//       .then((data) => setLearningPaths(data.learningPaths))
//       .catch((err) => console.error("Failed to fetch learning paths:", err))

//     // Add welcome message
//     setMessages([
//       {
//         role: "assistant",
//         content:
//           "Hey there! 👋 I'm your Solana AI Tutor. I'm here to help you learn about Solana in a fun, approachable way. Pick a question from the learning paths below, or ask me anything about Solana!",
//       },
//     ])
//   }, [])

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
//   }, [messages])

//   const handleSendMessage = async (message?: string) => {
//     const messageToSend = message || inputValue.trim()
//     if (!messageToSend) return

//     setInputValue("")
//     const newUserMessage = { role: "user" as const, content: messageToSend }
//     setMessages((prev) => [...prev, newUserMessage])
//     setIsLoading(true)
//     setIsSidebarOpen(false)

//     try {
//       const response = await fetch("/api/tutor", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           messages: [...messages, newUserMessage],
//         }),
//       })

//       const data = await response.json()

//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: data.response,
//           relatedConcepts: data.relatedConcepts,
//         },
//       ])
//     } catch (error) {
//       console.error("Failed to send message:", error)
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: "Oops! Something went wrong. Please try again.",
//         },
//       ])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault()
//       handleSendMessage()
//     }
//   }

//   const copyCode = async (code: string) => {
//     await navigator.clipboard.writeText(code)
//     setCopiedCode(true)
//     setTimeout(() => setCopiedCode(false), 2000)
//   }

//   const difficultyColors = {
//     beginner: "bg-green-500/10 text-green-500 border-green-500/20",
//     intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
//     advanced: "bg-red-500/10 text-red-500 border-red-500/20",
//   }

//   const difficultyIcons = {
//     beginner: "🟢",
//     intermediate: "🟡",
//     advanced: "🔴",
//   }

//   return (
//     <div className="flex flex-col h-screen bg-background text-foreground">
//       {/* Header */}
//       <motion.header
//         className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
//         initial={{ y: -100 }}
//         animate={{ y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         <div className="px-4 py-3 sm:py-4">
//           <div className="flex items-center justify-between gap-2">
//             <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="lg:hidden h-8 w-8 p-0"
//                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//               >
//                 {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//               </Button>
//               <Link href="/">
//                 <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
//                   <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
//                   <span className="hidden sm:inline text-xs sm:text-sm">Back to Explainer</span>
//                   <span className="inline sm:hidden text-xs">Back</span>
//                 </Button>
//               </Link>
//               <motion.div
//                 className="flex items-center space-x-1.5 sm:space-x-2 min-w-0"
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.2 }}
//               >
//                 <motion.div
//                   animate={{
//                     rotate: [0, 360],
//                     scale: [1, 1.1, 1],
//                   }}
//                   transition={{
//                     rotate: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
//                     scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
//                   }}
//                   className="flex-shrink-0"
//                 >
//                   <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
//                 </motion.div>
//                 <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent truncate">
//                   AI Tutor
//                 </h1>
//               </motion.div>
//             </div>
//             <div className="flex-shrink-0">
//               <ThemeToggle />
//             </div>
//           </div>
//         </div>
//       </motion.header>

//       <div className="flex flex-1 overflow-hidden">
//         {/* Learning Paths Sidebar - ChatGPT style collapsible */}
//         <AnimatePresence>
//           {(isSidebarOpen || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
//             <motion.aside
//               initial={{ x: -300 }}
//               animate={{ x: 0 }}
//               exit={{ x: -300 }}
//               transition={{ type: "spring", damping: 20 }}
//               className={`
//                 fixed lg:relative inset-y-0 left-0 z-40
//                 w-[280px] lg:w-[300px]
//                 bg-background border-r border-border/40
//                 overflow-y-auto
//                 ${isSidebarOpen ? "block" : "hidden lg:block"}
//                 custom-scrollbar
//               `}
//             >
//               <div className="p-4 space-y-4 h-full">
//                 <div className="flex items-center justify-between lg:justify-start space-x-2">
//                   <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
//                   <h2 className="text-lg font-semibold">Learning Paths</h2>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     className="lg:hidden h-8 w-8 p-0 ml-auto"
//                     onClick={() => setIsSidebarOpen(false)}
//                   >
//                     <X className="h-4 w-4" />
//                   </Button>
//                 </div>

//                 <div className="space-y-4">
//                   {learningPaths &&
//                     Object.entries(learningPaths).map(([difficulty, questions]) => (
//                       <div key={difficulty} className="space-y-2">
//                         <Badge
//                           variant="outline"
//                           className={`${difficultyColors[difficulty as keyof typeof difficultyColors]} text-xs`}
//                         >
//                           {difficultyIcons[difficulty as keyof typeof difficultyIcons]}{" "}
//                           {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
//                         </Badge>
//                         <div className="space-y-2">
//                           {questions.map((question: string, index: number) => (
//                             <motion.button
//                               key={index}
//                               onClick={() => handleSendMessage(question)}
//                               whileHover={{ x: 4 }}
//                               whileTap={{ scale: 0.98 }}
//                               className="w-full text-left text-sm p-2.5 rounded-lg bg-muted/10 hover:bg-muted/20 border border-border/20 hover:border-primary/20 transition-all duration-200 text-muted-foreground hover:text-foreground leading-relaxed"
//                             >
//                               {question}
//                             </motion.button>
//                           ))}
//                         </div>
//                       </div>
//                     ))}
//                 </div>
//               </div>
//             </motion.aside>
//           )}
//         </AnimatePresence>

//         {isSidebarOpen && (
//           <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
//         )}

//         <main className="flex-1 flex flex-col overflow-hidden">
//           {/* Messages Container - scrolls naturally in full viewport */}
//           <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
//             <div className="max-w-3xl mx-auto space-y-4">
//               <AnimatePresence>
//                 {messages.map((message, index) => (
//                   <motion.div
//                     key={index}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -10 }}
//                     transition={{ delay: index * 0.1 }}
//                     className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
//                   >
//                     <div
//                       className={`max-w-[85%] rounded-lg p-4 ${
//                         message.role === "user"
//                           ? "bg-primary text-primary-foreground"
//                           : "bg-muted/20 border border-border/30"
//                       }`}
//                     >
//                       {message.role === "assistant" ? (
//                         <MarkdownRenderer content={message.content} />
//                       ) : (
//                         <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
//                       )}

//                       {/* Related Concepts */}
//                       {message.relatedConcepts && message.relatedConcepts.length > 0 && (
//                         <div className="mt-3 space-y-2">
//                           <div className="flex items-center gap-2 text-xs text-muted-foreground">
//                             <Lightbulb className="h-3 w-3 flex-shrink-0" />
//                             <span>Related Concepts:</span>
//                           </div>
//                           <div className="flex flex-wrap gap-2">
//                             {message.relatedConcepts.map((concept, i) => (
//                               <Badge
//                                 key={i}
//                                 variant="secondary"
//                                 className="cursor-pointer hover:bg-primary/20 transition-colors text-xs px-2 py-0.5"
//                                 onClick={() => handleSendMessage(concept)}
//                               >
//                                 {concept}
//                               </Badge>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </motion.div>
//                 ))}
//               </AnimatePresence>

//               {isLoading && (
//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
//                   <div className="bg-muted/20 border border-border/30 rounded-lg p-4 flex items-center space-x-2">
//                     <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary flex-shrink-0" />
//                     <span className="text-sm text-muted-foreground">Thinking...</span>
//                   </div>
//                 </motion.div>
//               )}

//               <div ref={messagesEndRef} />
//             </div>
//           </div>

//           <div className="border-t-2 border-border/40 bg-background/95 backdrop-blur-sm shadow-lg p-4 sm:p-6">
//             <div className="max-w-3xl mx-auto">
//               <div className="flex items-center gap-2 sm:gap-3 bg-muted/30 rounded-xl p-2 border-2 border-border/60 shadow-sm">
//                 <Input
//                   placeholder="Ask me anything about Solana..."
//                   value={inputValue}
//                   onChange={(e) => setInputValue(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   disabled={isLoading}
//                   className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base h-10 sm:h-11 placeholder:text-muted-foreground/60"
//                 />
//                 <Button
//                   onClick={() => handleSendMessage()}
//                   disabled={isLoading || !inputValue.trim()}
//                   className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-11 w-10 sm:w-11 p-0 flex-shrink-0 rounded-lg shadow-md hover:shadow-lg transition-all"
//                 >
//                   {isLoading ? (
//                     <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
//                   ) : (
//                     <Send className="h-4 w-4 sm:h-5 sm:w-5" />
//                   )}
//                 </Button>
//               </div>
//               <p className="text-xs text-muted-foreground mt-2 sm:mt-3 flex items-center gap-1 justify-center sm:justify-start">
//                 <Zap className="h-3 w-3 flex-shrink-0" />
//                 <span>Press Enter to send, Shift+Enter for new line</span>
//               </p>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }

// "use client"

// import type React from "react"
// import { useState, useEffect, useRef } from "react"
// import { motion, AnimatePresence } from "framer-motion"
// import { Sparkles, Send, BookOpen, Lightbulb, ArrowLeft, Loader2, Zap, Menu, X } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
// import { ThemeToggle } from "@/components/theme-toggle"
// import { MarkdownRenderer } from "@/components/markdown-renderer"
// import Link from "next/link"

// interface Message {
//   role: "user" | "assistant"
//   content: string
//   relatedConcepts?: string[]
// }

// interface LearningPaths {
//   beginner: string[]
//   intermediate: string[]
//   advanced: string[]
// }

// export default function TutorPage() {
//   const [messages, setMessages] = useState<Message[]>([])
//   const [inputValue, setInputValue] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const [learningPaths, setLearningPaths] = useState<LearningPaths | null>(null)
//   const [copiedCode, setCopiedCode] = useState(false)
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false)
//   const messagesEndRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     // Fetch learning paths on mount
//     fetch("/api/tutor")
//       .then((res) => res.json())
//       .then((data) => setLearningPaths(data.learningPaths))
//       .catch((err) => console.error("Failed to fetch learning paths:", err))

//     // Add welcome message
//     setMessages([
//       {
//         role: "assistant",
//         content:
//           "Hey there! 👋 I'm your Solana AI Tutor. I'm here to help you learn about Solana in a fun, approachable way. Pick a question from the learning paths below, or ask me anything about Solana!",
//       },
//     ])
//   }, [])

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
//   }, [messages])

//   const handleSendMessage = async (message?: string) => {
//     const messageToSend = message || inputValue.trim()
//     if (!messageToSend) return

//     setInputValue("")
//     setMessages((prev) => [...prev, { role: "user", content: messageToSend }])
//     setIsLoading(true)
//     setIsSidebarOpen(false)

//     try {
//       const response = await fetch("/api/tutor", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: messageToSend }),
//       })

//       const data = await response.json()

//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: data.response,
//           relatedConcepts: data.relatedConcepts,
//         },
//       ])
//     } catch (error) {
//       console.error("Failed to send message:", error)
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: "Oops! Something went wrong. Please try again.",
//         },
//       ])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault()
//       handleSendMessage()
//     }
//   }

//   const copyCode = async (code: string) => {
//     await navigator.clipboard.writeText(code)
//     setCopiedCode(true)
//     setTimeout(() => setCopiedCode(false), 2000)
//   }

//   const difficultyColors = {
//     beginner: "bg-green-500/10 text-green-500 border-green-500/20",
//     intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
//     advanced: "bg-red-500/10 text-red-500 border-red-500/20",
//   }

//   const difficultyIcons = {
//     beginner: "🟢",
//     intermediate: "🟡",
//     advanced: "🔴",
//   }

//   return (
//     <div className="flex flex-col h-screen bg-background text-foreground">
//       {/* Header */}
//       <motion.header
//         className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
//         initial={{ y: -100 }}
//         animate={{ y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         <div className="px-4 py-3 sm:py-4">
//           <div className="flex items-center justify-between gap-2">
//             <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="lg:hidden h-8 w-8 p-0"
//                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//               >
//                 {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//               </Button>
//               <Link href="/">
//                 <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
//                   <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
//                   <span className="hidden sm:inline text-xs sm:text-sm">Back to Explainer</span>
//                   <span className="inline sm:hidden text-xs">Back</span>
//                 </Button>
//               </Link>
//               <motion.div
//                 className="flex items-center space-x-1.5 sm:space-x-2 min-w-0"
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.2 }}
//               >
//                 <motion.div
//                   animate={{
//                     rotate: [0, 360],
//                     scale: [1, 1.1, 1],
//                   }}
//                   transition={{
//                     rotate: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
//                     scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
//                   }}
//                   className="flex-shrink-0"
//                 >
//                   <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
//                 </motion.div>
//                 <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent truncate">
//                   AI Tutor
//                 </h1>
//               </motion.div>
//             </div>
//             <div className="flex-shrink-0">
//               <ThemeToggle />
//             </div>
//           </div>
//         </div>
//       </motion.header>

//       <div className="flex flex-1 overflow-hidden">
//         {/* Learning Paths Sidebar - ChatGPT style collapsible */}
//         <AnimatePresence>
//           {(isSidebarOpen || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
//             <motion.aside
//               initial={{ x: -300 }}
//               animate={{ x: 0 }}
//               exit={{ x: -300 }}
//               transition={{ type: "spring", damping: 20 }}
//               className={`
//                 fixed lg:relative inset-y-0 left-0 z-40
//                 w-[280px] lg:w-[300px]
//                 bg-background border-r border-border/40
//                 overflow-y-auto
//                 ${isSidebarOpen ? "block" : "hidden lg:block"}
//                 custom-scrollbar
//               `}
//             >
//               <div className="p-4 space-y-4 h-full">
//                 <div className="flex items-center justify-between lg:justify-start space-x-2">
//                   <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
//                   <h2 className="text-lg font-semibold">Learning Paths</h2>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     className="lg:hidden h-8 w-8 p-0 ml-auto"
//                     onClick={() => setIsSidebarOpen(false)}
//                   >
//                     <X className="h-4 w-4" />
//                   </Button>
//                 </div>

//                 <div className="space-y-4">
//                   {learningPaths &&
//                     Object.entries(learningPaths).map(([difficulty, questions]) => (
//                       <div key={difficulty} className="space-y-2">
//                         <Badge
//                           variant="outline"
//                           className={`${difficultyColors[difficulty as keyof typeof difficultyColors]} text-xs`}
//                         >
//                           {difficultyIcons[difficulty as keyof typeof difficultyIcons]}{" "}
//                           {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
//                         </Badge>
//                         <div className="space-y-2">
//                           {questions.map((question: string, index: number) => (
//                             <motion.button
//                               key={index}
//                               onClick={() => handleSendMessage(question)}
//                               whileHover={{ x: 4 }}
//                               whileTap={{ scale: 0.98 }}
//                               className="w-full text-left text-sm p-2.5 rounded-lg bg-muted/10 hover:bg-muted/20 border border-border/20 hover:border-primary/20 transition-all duration-200 text-muted-foreground hover:text-foreground leading-relaxed"
//                             >
//                               {question}
//                             </motion.button>
//                           ))}
//                         </div>
//                       </div>
//                     ))}
//                 </div>
//               </div>
//             </motion.aside>
//           )}
//         </AnimatePresence>

//         {isSidebarOpen && (
//           <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
//         )}

//         <main className="flex-1 flex flex-col overflow-hidden">
//           {/* Messages Container - scrolls naturally in full viewport */}
//           <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
//             <div className="max-w-3xl mx-auto space-y-4">
//               <AnimatePresence>
//                 {messages.map((message, index) => (
//                   <motion.div
//                     key={index}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -10 }}
//                     transition={{ delay: index * 0.1 }}
//                     className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
//                   >
//                     <div
//                       className={`max-w-[85%] rounded-lg p-4 ${
//                         message.role === "user"
//                           ? "bg-primary text-primary-foreground"
//                           : "bg-muted/20 border border-border/30"
//                       }`}
//                     >
//                       {message.role === "assistant" ? (
//                         <MarkdownRenderer content={message.content} />
//                       ) : (
//                         <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
//                       )}

//                       {/* Related Concepts */}
//                       {message.relatedConcepts && message.relatedConcepts.length > 0 && (
//                         <div className="mt-3 space-y-2">
//                           <div className="flex items-center gap-2 text-xs text-muted-foreground">
//                             <Lightbulb className="h-3 w-3 flex-shrink-0" />
//                             <span>Related Concepts:</span>
//                           </div>
//                           <div className="flex flex-wrap gap-2">
//                             {message.relatedConcepts.map((concept, i) => (
//                               <Badge
//                                 key={i}
//                                 variant="secondary"
//                                 className="cursor-pointer hover:bg-primary/20 transition-colors text-xs px-2 py-0.5"
//                                 onClick={() => handleSendMessage(concept)}
//                               >
//                                 {concept}
//                               </Badge>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </motion.div>
//                 ))}
//               </AnimatePresence>

//               {isLoading && (
//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
//                   <div className="bg-muted/20 border border-border/30 rounded-lg p-4 flex items-center space-x-2">
//                     <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
//                     <span className="text-sm text-muted-foreground">Thinking...</span>
//                   </div>
//                 </motion.div>
//               )}

//               <div ref={messagesEndRef} />
//             </div>
//           </div>

//           <div className="border-t-2 border-border/40 bg-background/95 backdrop-blur-sm shadow-lg p-4 sm:p-6">
//             <div className="max-w-3xl mx-auto">
//               <div className="flex items-center gap-2 sm:gap-3 bg-muted/30 rounded-xl p-2 border-2 border-border/60 shadow-sm">
//                 <Input
//                   placeholder="Ask me anything about Solana..."
//                   value={inputValue}
//                   onChange={(e) => setInputValue(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   disabled={isLoading}
//                   className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base h-10 sm:h-11 placeholder:text-muted-foreground/60"
//                 />
//                 <Button
//                   onClick={() => handleSendMessage()}
//                   disabled={isLoading || !inputValue.trim()}
//                   className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-11 w-10 sm:w-11 p-0 flex-shrink-0 rounded-lg shadow-md hover:shadow-lg transition-all"
//                 >
//                   {isLoading ? (
//                     <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
//                   ) : (
//                     <Send className="h-4 w-4 sm:h-5 sm:w-5" />
//                   )}
//                 </Button>
//               </div>
//               <p className="text-xs text-muted-foreground mt-2 sm:mt-3 flex items-center gap-1 justify-center sm:justify-start">
//                 <Zap className="h-3 w-3 flex-shrink-0" />
//                 <span>Press Enter to send, Shift+Enter for new line</span>
//               </p>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }

// "use client"

// import type React from "react"
// import { useState, useEffect, useRef } from "react"
// import { motion, AnimatePresence } from "framer-motion"
// import { Sparkles, Send, BookOpen, Code, Lightbulb, ArrowLeft, Loader2, Copy, Check, Zap, Menu, X } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
// import { ThemeToggle } from "@/components/theme-toggle"
// import Link from "next/link"

// interface Message {
//   role: "user" | "assistant"
//   content: string
//   code?: string
//   relatedConcepts?: string[]
// }

// interface LearningPaths {
//   beginner: string[]
//   intermediate: string[]
//   advanced: string[]
// }

// export default function TutorPage() {
//   const [messages, setMessages] = useState<Message[]>([])
//   const [inputValue, setInputValue] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const [learningPaths, setLearningPaths] = useState<LearningPaths | null>(null)
//   const [copiedCode, setCopiedCode] = useState(false)
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false)
//   const messagesEndRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     // Fetch learning paths on mount
//     fetch("/api/tutor")
//       .then((res) => res.json())
//       .then((data) => setLearningPaths(data.learningPaths))
//       .catch((err) => console.error("Failed to fetch learning paths:", err))

//     // Add welcome message
//     setMessages([
//       {
//         role: "assistant",
//         content:
//           "Hey there! 👋 I'm your Solana AI Tutor. I'm here to help you learn about Solana in a fun, approachable way. Pick a question from the learning paths below, or ask me anything about Solana!",
//       },
//     ])
//   }, [])

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
//   }, [messages])

//   const handleSendMessage = async (message?: string) => {
//     const messageToSend = message || inputValue.trim()
//     if (!messageToSend) return

//     setInputValue("")
//     setMessages((prev) => [...prev, { role: "user", content: messageToSend }])
//     setIsLoading(true)
//     setIsSidebarOpen(false)

//     try {
//       const response = await fetch("/api/tutor", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: messageToSend }),
//       })

//       const data = await response.json()

//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: data.response,
//           code: data.code,
//           relatedConcepts: data.relatedConcepts,
//         },
//       ])
//     } catch (error) {
//       console.error("Failed to send message:", error)
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: "Oops! Something went wrong. Please try again.",
//         },
//       ])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault()
//       handleSendMessage()
//     }
//   }

//   const copyCode = async (code: string) => {
//     await navigator.clipboard.writeText(code)
//     setCopiedCode(true)
//     setTimeout(() => setCopiedCode(false), 2000)
//   }

//   const difficultyColors = {
//     beginner: "bg-green-500/10 text-green-500 border-green-500/20",
//     intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
//     advanced: "bg-red-500/10 text-red-500 border-red-500/20",
//   }

//   const difficultyIcons = {
//     beginner: "🟢",
//     intermediate: "🟡",
//     advanced: "🔴",
//   }

//   return (
//     <div className="flex flex-col h-screen bg-background text-foreground">
//       {/* Header */}
//       <motion.header
//         className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
//         initial={{ y: -100 }}
//         animate={{ y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         <div className="px-4 py-3 sm:py-4">
//           <div className="flex items-center justify-between gap-2">
//             <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="lg:hidden h-8 w-8 p-0"
//                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//               >
//                 {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//               </Button>
//               <Link href="/">
//                 <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
//                   <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
//                   <span className="hidden sm:inline text-xs sm:text-sm">Back to Explainer</span>
//                   <span className="inline sm:hidden text-xs">Back</span>
//                 </Button>
//               </Link>
//               <motion.div
//                 className="flex items-center space-x-1.5 sm:space-x-2 min-w-0"
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.2 }}
//               >
//                 <motion.div
//                   animate={{
//                     rotate: [0, 360],
//                     scale: [1, 1.1, 1],
//                   }}
//                   transition={{
//                     rotate: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
//                     scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
//                   }}
//                   className="flex-shrink-0"
//                 >
//                   <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
//                 </motion.div>
//                 <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent truncate">
//                   AI Tutor
//                 </h1>
//               </motion.div>
//             </div>
//             <div className="flex-shrink-0">
//               <ThemeToggle />
//             </div>
//           </div>
//         </div>
//       </motion.header>

//       <div className="flex flex-1 overflow-hidden">
//         {/* Learning Paths Sidebar - ChatGPT style collapsible */}
//         <AnimatePresence>
//           {(isSidebarOpen || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
//             <motion.aside
//               initial={{ x: -300 }}
//               animate={{ x: 0 }}
//               exit={{ x: -300 }}
//               transition={{ type: "spring", damping: 20 }}
//               className={`
//                 fixed lg:relative inset-y-0 left-0 z-40
//                 w-[280px] lg:w-[300px]
//                 bg-background border-r border-border/40
//                 overflow-y-auto
//                 ${isSidebarOpen ? "block" : "hidden lg:block"}
//                 custom-scrollbar
//               `}
//             >
//               <div className="p-4 space-y-4 h-full">
//                 <div className="flex items-center justify-between lg:justify-start space-x-2">
//                   <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
//                   <h2 className="text-lg font-semibold">Learning Paths</h2>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     className="lg:hidden h-8 w-8 p-0 ml-auto"
//                     onClick={() => setIsSidebarOpen(false)}
//                   >
//                     <X className="h-4 w-4" />
//                   </Button>
//                 </div>

//                 <div className="space-y-4">
//                   {learningPaths &&
//                     Object.entries(learningPaths).map(([difficulty, questions]) => (
//                       <div key={difficulty} className="space-y-2">
//                         <Badge
//                           variant="outline"
//                           className={`${difficultyColors[difficulty as keyof typeof difficultyColors]} text-xs`}
//                         >
//                           {difficultyIcons[difficulty as keyof typeof difficultyIcons]}{" "}
//                           {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
//                         </Badge>
//                         <div className="space-y-2">
//                           {questions.map((question: string, index: number) => (
//                             <motion.button
//                               key={index}
//                               onClick={() => handleSendMessage(question)}
//                               whileHover={{ x: 4 }}
//                               whileTap={{ scale: 0.98 }}
//                               className="w-full text-left text-sm p-2.5 rounded-lg bg-muted/10 hover:bg-muted/20 border border-border/20 hover:border-primary/20 transition-all duration-200 text-muted-foreground hover:text-foreground leading-relaxed"
//                             >
//                               {question}
//                             </motion.button>
//                           ))}
//                         </div>
//                       </div>
//                     ))}
//                 </div>
//               </div>
//             </motion.aside>
//           )}
//         </AnimatePresence>

//         {isSidebarOpen && (
//           <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
//         )}

//         <main className="flex-1 flex flex-col overflow-hidden">
//           {/* Messages Container - scrolls naturally in full viewport */}
//           <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
//             <div className="max-w-3xl mx-auto space-y-4">
//               <AnimatePresence>
//                 {messages.map((message, index) => (
//                   <motion.div
//                     key={index}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -10 }}
//                     transition={{ delay: index * 0.1 }}
//                     className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
//                   >
//                     <div
//                       className={`max-w-[85%] rounded-lg p-4 ${
//                         message.role === "user"
//                           ? "bg-primary text-primary-foreground"
//                           : "bg-muted/20 border border-border/30"
//                       }`}
//                     >
//                       <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>

//                       {/* Code Snippet */}
//                       {message.code && (
//                         <div className="mt-3 space-y-2">
//                           <div className="flex items-center justify-between gap-2">
//                             <Badge variant="outline" className="gap-1 text-xs">
//                               <Code className="h-3 w-3 flex-shrink-0" />
//                               <span>Code Example</span>
//                             </Badge>
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               onClick={() => copyCode(message.code!)}
//                               className="h-7 gap-1 text-xs px-2"
//                             >
//                               {copiedCode ? (
//                                 <>
//                                   <Check className="h-3 w-3 flex-shrink-0" />
//                                   <span>Copied</span>
//                                 </>
//                               ) : (
//                                 <>
//                                   <Copy className="h-3 w-3 flex-shrink-0" />
//                                   <span>Copy</span>
//                                 </>
//                               )}
//                             </Button>
//                           </div>
//                           <pre className="bg-popover text-popover-foreground p-3 rounded-lg overflow-x-auto text-xs font-mono">
//                             <code>{message.code}</code>
//                           </pre>
//                         </div>
//                       )}

//                       {/* Related Concepts */}
//                       {message.relatedConcepts && message.relatedConcepts.length > 0 && (
//                         <div className="mt-3 space-y-2">
//                           <div className="flex items-center gap-2 text-xs text-muted-foreground">
//                             <Lightbulb className="h-3 w-3 flex-shrink-0" />
//                             <span>Related Concepts:</span>
//                           </div>
//                           <div className="flex flex-wrap gap-2">
//                             {message.relatedConcepts.map((concept, i) => (
//                               <Badge
//                                 key={i}
//                                 variant="secondary"
//                                 className="cursor-pointer hover:bg-primary/20 transition-colors text-xs px-2 py-0.5"
//                                 onClick={() => handleSendMessage(concept)}
//                               >
//                                 {concept}
//                               </Badge>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </motion.div>
//                 ))}
//               </AnimatePresence>

//               {isLoading && (
//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
//                   <div className="bg-muted/20 border border-border/30 rounded-lg p-4 flex items-center space-x-2">
//                     <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
//                     <span className="text-sm text-muted-foreground">Thinking...</span>
//                   </div>
//                 </motion.div>
//               )}

//               <div ref={messagesEndRef} />
//             </div>
//           </div>

//           <div className="border-t-2 border-border/40 bg-background/95 backdrop-blur-sm shadow-lg p-4 sm:p-6">
//             <div className="max-w-3xl mx-auto">
//               <div className="flex items-center gap-2 sm:gap-3 bg-muted/30 rounded-xl p-2 border-2 border-border/60 shadow-sm">
//                 <Input
//                   placeholder="Ask me anything about Solana..."
//                   value={inputValue}
//                   onChange={(e) => setInputValue(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   disabled={isLoading}
//                   className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base h-10 sm:h-11 placeholder:text-muted-foreground/60"
//                 />
//                 <Button
//                   onClick={() => handleSendMessage()}
//                   disabled={isLoading || !inputValue.trim()}
//                   className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-11 w-10 sm:w-11 p-0 flex-shrink-0 rounded-lg shadow-md hover:shadow-lg transition-all"
//                 >
//                   {isLoading ? (
//                     <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
//                   ) : (
//                     <Send className="h-4 w-4 sm:h-5 sm:w-5" />
//                   )}
//                 </Button>
//               </div>
//               <p className="text-xs text-muted-foreground mt-2 sm:mt-3 flex items-center gap-1 justify-center sm:justify-start">
//                 <Zap className="h-3 w-3 flex-shrink-0" />
//                 <span>Press Enter to send, Shift+Enter for new line</span>
//               </p>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }