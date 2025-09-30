"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Sparkles,
  CheckCircle,
  Clock,
  DollarSign,
  Zap,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Coins,
  Settings,
  Code,
  ArrowUpDown,
  Wallet,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Github,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/theme-toggle"

interface TransactionData {
  signature: string
  status: string
  timestamp: string
  fee: {
    sol: string
    usd: string
  }
  type: string
  explanations: {
    beginner: string
    developer: string
  }
  steps: Array<{
    title: string
    description: string
    time: string
  }>
  programs: Array<{
    name: string
    description: string
    programId: string
  }>
  tokenTransfers: Array<{
    token: string
    amount: string
    usdValue: string
    from: string
    to: string
    color: string
  }>
  accountChanges: Array<{
    wallet: string
    change: string
    reason: string
    color: string
    type: string
  }>
  feeComparison: {
    solanaFee: string
    ethereumFee: string
    savings: string
  }
  analyzedAt: string
}

export default function SolanaExplainer() {
  const [searchValue, setSearchValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeveloperMode, setIsDeveloperMode] = useState(false)
  const [typewriterText, setTypewriterText] = useState("")
  const [showContent, setShowContent] = useState(false)
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentExplanation = transactionData
    ? isDeveloperMode
      ? transactionData.explanations.developer
      : transactionData.explanations.beginner
    : ""

  useEffect(() => {
    if (currentExplanation) {
      setTypewriterText("")
      let i = 0
      const timer = setInterval(() => {
        if (i < currentExplanation.length) {
          setTypewriterText(currentExplanation.slice(0, i + 1))
          i++
        } else {
          clearInterval(timer)
        }
      }, 30)
      return () => clearInterval(timer)
    }
  }, [currentExplanation])

  const analyzeTransaction = async (signature: string) => {
    console.log("[v0] Starting transaction analysis for:", signature)
    setIsLoading(true)
    setShowContent(false)
    setError(null)

    try {
      const response = await fetch("/api/analyze-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signature }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze transaction")
      }

      console.log("[v0] Transaction analysis successful")
      setTransactionData(data)
      setShowContent(true)
    } catch (err) {
      console.error("[v0] Transaction analysis failed:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleTransaction = () => {
    const exampleSignature = "2Mq8GjqKKmva7q8WAmYPtE5NKe12B2wbH3oE9oEv3YAb4J844AiYQNEwAWUJHH7Jbkw39PVhf159Kx9vygEP4URQ"
    setSearchValue(exampleSignature)
    analyzeTransaction(exampleSignature)
  }

  const handleAnalyze = () => {
    if (searchValue.trim()) {
      analyzeTransaction(searchValue.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAnalyze()
    }
  }

  useEffect(() => {
    handleExampleTransaction()
  }, [])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    return `${diffInHours}h ago`
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <motion.div
              className="flex items-center space-x-2"
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
              >
                <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              </motion.div>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                SolanaLens AI
              </h1>
            </motion.div>

            <motion.div
              className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative flex-1 md:flex-initial min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Enter transaction signature..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full md:w-80 pl-10 bg-card border-border/50 focus:border-primary/50 transition-all duration-200"
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isLoading || !searchValue.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Analyzing...</span>
                  </>
                ) : (
                  <span className="hidden sm:inline">Analyze Transaction</span>
                )}
                {!isLoading && <span className="sm:hidden">Analyze</span>}
              </Button>
              <Button
                onClick={handleExampleTransaction}
                variant="ghost"
                disabled={isLoading}
                className="text-muted-foreground hover:text-primary"
              >
                <span className="hidden sm:inline">Try Example</span>
                <span className="sm:hidden">Example</span>
              </Button>
              <motion.a
                href="https://github.com/SeunOnTech/SolanaLens-AI"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Github className="h-4 w-4" />
              </motion.a>
              <ThemeToggle />
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Sparkles className="h-12 w-12 text-primary mx-auto" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Analyzing Transaction</h3>
                <p className="text-muted-foreground">AI is processing the blockchain data...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container mx-auto px-4 py-4"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence>
        {showContent && transactionData && (
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-4 py-8 space-y-8"
          >
            {/* Transaction Overview Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-300">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                      <motion.div
                        animate={{
                          rotate: 360,
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          rotate: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                          scale: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                        }}
                      >
                        <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                      </motion.div>
                      <span>Transaction Overview</span>
                    </CardTitle>
                    <motion.a
                      href={`https://solscan.io/tx/${transactionData.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all duration-200 text-sm font-medium group"
                    >
                      <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">View on Solscan</span>
                      <span className="sm:hidden">Solscan</span>
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </motion.a>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[
                      {
                        icon: CheckCircle,
                        label: "Status",
                        value: transactionData.status,
                        color: "text-green-500",
                        bgColor: "bg-green-500/10",
                        borderColor: "border-green-500/20",
                      },
                      {
                        icon: Clock,
                        label: "Time",
                        value: formatTimestamp(transactionData.timestamp),
                        color: "text-muted-foreground",
                      },
                      {
                        icon: DollarSign,
                        label: "Fee",
                        value: `${transactionData.fee.sol} SOL ($${transactionData.fee.usd})`,
                        color: "text-muted-foreground",
                      },
                      {
                        icon: Zap,
                        label: "Type",
                        value: transactionData.type,
                        color: "text-muted-foreground",
                      },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                        </div>
                        {item.label === "Status" ? (
                          <Badge variant="secondary" className={`${item.bgColor} ${item.color} ${item.borderColor}`}>
                            {item.value}
                          </Badge>
                        ) : (
                          <p className="font-medium text-sm md:text-base break-words">{item.value}</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Explanation Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-300">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                      <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                      <span>What Happened?</span>
                    </CardTitle>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30 border border-border/30">
                      <button
                        onClick={() => setIsDeveloperMode(false)}
                        className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${
                          !isDeveloperMode
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Beginner
                      </button>
                      <button
                        onClick={() => setIsDeveloperMode(true)}
                        className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${
                          isDeveloperMode
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Developer
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="min-h-[120px] p-3 md:p-4 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors duration-200">
                      <p className="text-foreground leading-relaxed text-balance text-sm md:text-base">
                        {typewriterText}
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
                          className="inline-block w-0.5 h-4 md:h-5 bg-primary ml-1"
                        />
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step-by-Step Timeline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                    <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    <span>Step-by-Step Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 md:space-y-6">
                    {transactionData.steps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.2 }}
                        className="flex items-start space-x-3 md:space-x-4 p-3 md:p-4 rounded-lg bg-muted/10 border border-border/20 hover:bg-muted/20 hover:border-primary/20 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          {index === 0 && <RefreshCw className="h-4 w-4 md:h-5 md:w-5" />}
                          {index === 1 && <Coins className="h-4 w-4 md:h-5 md:w-5" />}
                          {index === 2 && <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />}
                          {index === 3 && <Settings className="h-4 w-4 md:h-5 md:w-5" />}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-semibold text-foreground text-sm md:text-base">{step.title}</h4>
                            <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded whitespace-nowrap">
                              {step.time}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed text-pretty break-words">
                            {step.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Programs Used section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
              <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                    <Code className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    <span>Programs Used</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {transactionData.programs.map((program, index) => (
                      <motion.a
                        key={index}
                        href={`https://solscan.io/account/${program.programId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 + index * 0.1 }}
                        className="p-3 md:p-4 rounded-lg bg-muted/10 border border-border/20 hover:bg-muted/20 hover:border-primary/20 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors duration-200">
                            {index === 0 && <ArrowUpDown className="h-5 w-5 md:h-6 md:w-6" />}
                            {index === 1 && <Coins className="h-5 w-5 md:h-6 md:w-6" />}
                            {index === 2 && <Settings className="h-5 w-5 md:h-6 md:w-6" />}
                          </div>
                          <div className="flex-1 space-y-2 min-w-0">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200 text-sm md:text-base">
                              {program.name}
                            </h4>
                            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed text-pretty break-words">
                              {program.description}
                            </p>
                            <div className="flex items-center space-x-2">
                              <code className="text-xs bg-muted/30 px-2 py-1 rounded font-mono text-muted-foreground break-all">
                                {program.programId.slice(0, 8)}...
                              </code>
                              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0" />
                            </div>
                          </div>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Token Transfers section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}>
              <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                    <Wallet className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    <span>Token Transfers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {transactionData.tokenTransfers.map((transfer, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 + index * 0.1 }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 rounded-lg bg-muted/10 border border-border/20 hover:bg-muted/20 hover:border-primary/20 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
                          <div className="flex-shrink-0">
                            <Badge variant="outline" className="font-mono text-xs">
                              {transfer.token}
                            </Badge>
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`font-semibold text-sm md:text-base ${transfer.color}`}>
                                {transfer.amount}
                              </span>
                              <span className="text-xs md:text-sm text-muted-foreground">({transfer.usdValue})</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                              <code className="bg-muted/30 px-2 py-0.5 rounded text-xs break-all">{transfer.from}</code>
                              <ArrowRight className="h-3 w-3 flex-shrink-0" />
                              <code className="bg-muted/30 px-2 py-0.5 rounded text-xs break-all">{transfer.to}</code>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Account Changes section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7 }}>
              <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    <span>Account Changes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactionData.accountChanges.map((change, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.9 + index * 0.1 }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-muted/10 border border-border/20 hover:bg-muted/20 hover:border-primary/20 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {change.type === "swap_in" && <TrendingUp className="h-4 w-4 text-green-400 flex-shrink-0" />}
                          {change.type === "swap_out" && (
                            <TrendingDown className="h-4 w-4 text-red-400 flex-shrink-0" />
                          )}
                          {change.type === "fee" && <TrendingDown className="h-4 w-4 text-red-400 flex-shrink-0" />}
                          <code className="text-xs md:text-sm bg-muted/30 px-2 py-1 rounded font-mono break-all">
                            {change.wallet}
                          </code>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end space-x-3 sm:ml-3">
                          <span className="text-xs md:text-sm text-muted-foreground">{change.reason}</span>
                          <span className={`font-semibold text-sm md:text-base whitespace-nowrap ${change.color}`}>
                            {change.change}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Fee Comparison Highlight */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 2.1 }}
            >
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur relative overflow-hidden transition-all duration-300">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                />
                <CardContent className="relative p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-semibold text-foreground">Fee Comparison</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        This transaction fee was{" "}
                        <span className="text-primary font-semibold">{transactionData.feeComparison.solanaFee}</span>
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        On Ethereum, the same swap could cost{" "}
                        <span className="text-red-400 font-semibold">{transactionData.feeComparison.ethereumFee}</span>
                      </p>
                    </div>
                    <motion.div
                      className="text-left md:text-right"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    >
                      <div className="text-2xl md:text-3xl font-bold text-primary">
                        {transactionData.feeComparison.savings}
                      </div>
                      <div className="text-sm text-muted-foreground">cheaper</div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Footer */}
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.3 }}
              className="text-center py-6 md:py-8 border-t border-border/20"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-xs md:text-sm text-muted-foreground">
                <span>Built for Solana Hackathon</span>
                <motion.a
                  href="https://github.com/SeunOnTech/SolanaLens-AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 hover:text-primary transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Github className="h-4 w-4" />
                  <span>View on GitHub</span>
                </motion.a>
                {transactionData && (
                  <motion.a
                    href={`https://solscan.io/tx/${transactionData.signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sm:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    <Eye className="h-6 w-6" />
                  </motion.a>
                )}
              </div>
            </motion.footer>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  )
}
