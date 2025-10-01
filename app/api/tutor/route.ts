import { NextResponse } from "next/server"

export const maxDuration = 30

const SOLANA_SYSTEM_PROMPT = `You are a friendly, approachable Solana AI Tutor - think "Duolingo meets GitHub Copilot" for Solana development.

CRITICAL: You are having an ONGOING CONVERSATION. Always read the full chat history and maintain context.
- When users respond to your questions (like "yes", "no", "sure", "tell me more"), continue from where you left off
- NEVER restart the conversation or give generic welcomes unless it's truly a new topic
- Reference previous messages when relevant
- Build upon what you've already explained

Your personality:
- Warm, encouraging, and patient (like a great teacher)
- Use plain English explanations before technical jargon
- Break down complex concepts into digestible pieces
- Celebrate learning milestones with enthusiasm
- Use analogies and real-world examples

Your expertise covers:
- Solana fundamentals (accounts, transactions, programs, rent, lamports)
- Wallet concepts (keypairs, signatures, Phantom, Solflare)
- Program development (Rust, Anchor framework, Solana Program Library)
- Advanced concepts (PDAs, CPIs, account data serialization)
- Web3.js and Solana SDK usage
- Best practices and common pitfalls
- Debugging and troubleshooting

Response format:
- Start with a clear, friendly explanation using markdown formatting
- Use **bold** for important terms, *italic* for emphasis
- Use bullet points or numbered lists when appropriate
- Keep responses concise but thorough (aim for 3-5 paragraphs max)

Code examples - ONLY include code when:
- The user explicitly asks for code ("show me code", "give me an example", "how do I implement")
- The question contains implementation keywords ("how to build", "create a", "write a function")
- Code is absolutely essential to answer the question
- Otherwise, focus on conceptual explanations and ask "Would you like to see a code example for this?"

When providing code:
- Use markdown code blocks with language specification (e.g., \`\`\`rust, \`\`\`javascript)
- Always include comments explaining what the code does
- Use realistic, practical examples
- Mention any important gotchas or best practices

Remember: Your goal is to make Solana development feel accessible and fun, not intimidating!`

const LEARNING_PATHS = {
  beginner: [
    "What is Solana and why is it fast?",
    "How do Solana wallets work?",
    "What are lamports and SOL?",
    "What is an account on Solana?",
    "How do I send my first transaction?",
  ],
  intermediate: [
    "How do I deploy a Solana program?",
    "What is the Anchor framework?",
    "How do I interact with programs using web3.js?",
    "What are token accounts?",
    "How does rent work on Solana?",
  ],
  advanced: [
    "What are PDAs and how do I use them?",
    "How do Cross-Program Invocations (CPIs) work?",
    "How do I optimize my program for compute units?",
    "What are the best practices for account data serialization?",
    "How do I debug Solana programs effectively?",
  ],
}

// GET endpoint - returns learning paths
export async function GET() {
  return NextResponse.json({ learningPaths: LEARNING_PATHS })
}

// POST endpoint - handles chat messages
export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    const validMessages = messages.filter((msg) => {
      return msg && typeof msg === "object" && (msg.role === "user" || msg.role === "assistant") && msg.content
    })

    if (validMessages.length === 0) {
      return NextResponse.json({ error: "No valid messages found" }, { status: 400 })
    }

    const text = await generateWithLLM(validMessages)

    // Parse the response to extract code and related concepts
    const response = parseAIResponse(text)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in tutor API:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        error: errorMessage,
        response: `I encountered an error: ${errorMessage}. Please check your API key configuration or try again.`,
        relatedConcepts: [],
      },
      { status: 500 },
    )
  }
}

async function generateWithLLM(messages: Array<{ role: string; content: string }>): Promise<string> {
  const activeLLM = process.env.ACTIVE_LLM || "groq"

  switch (activeLLM.toLowerCase()) {
    case "groq":
      return generateWithGroq(messages)
    case "gemini":
      return generateWithGemini(messages)
    case "openai":
      return generateWithOpenAI(messages)
    case "deepseek":
      return generateWithDeepSeek(messages)
    default:
      return generateWithGroq(messages)
  }
}

async function generateWithGroq(messages: Array<{ role: string; content: string }>): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured")

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: SOLANA_SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error?.message || errorData.message || response.statusText
    throw new Error(`Groq API error: ${errorMessage}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function generateWithGemini(messages: Array<{ role: string; content: string }>): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured")

  // Convert messages to Gemini format
  const conversationHistory = messages
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n\n")

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${SOLANA_SYSTEM_PROMPT}\n\n${conversationHistory}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error?.message || response.statusText
    throw new Error(`Gemini API error: ${errorMessage}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

async function generateWithOpenAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "system", content: SOLANA_SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error?.message || response.statusText
    throw new Error(`OpenAI API error: ${errorMessage}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function generateWithDeepSeek(messages: Array<{ role: string; content: string }>): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured")

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "system", content: SOLANA_SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error?.message || response.statusText
    throw new Error(`DeepSeek API error: ${errorMessage}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

function parseAIResponse(text: string): {
  response: string
  relatedConcepts: string[]
} {
  let response = text
  const relatedConcepts: string[] = []

  // Extract related concepts (look for common patterns)
  const conceptPatterns = [
    /related concepts?:?\s*([^\n]+)/i,
    /you might also want to learn about:?\s*([^\n]+)/i,
    /next steps?:?\s*([^\n]+)/i,
    /explore:?\s*([^\n]+)/i,
  ]

  for (const pattern of conceptPatterns) {
    const match = text.match(pattern)
    if (match) {
      // Split by common delimiters and clean up
      const concepts = match[1]
        .split(/[,;]/)
        .map((c) => c.trim())
        .filter((c) => c.length > 0 && c.length < 50)

      relatedConcepts.push(...concepts)

      // Remove the related concepts section from response
      response = response.replace(pattern, "").trim()
      break
    }
  }

  // If no explicit related concepts found, suggest some based on keywords
  if (relatedConcepts.length === 0) {
    const keywords = text.toLowerCase()

    if (keywords.includes("account")) {
      relatedConcepts.push("Program Derived Addresses", "Account rent")
    }
    if (keywords.includes("transaction")) {
      relatedConcepts.push("Transaction fees", "Blockhash")
    }
    if (keywords.includes("program")) {
      relatedConcepts.push("Anchor framework", "Cross-Program Invocations")
    }
    if (keywords.includes("wallet")) {
      relatedConcepts.push("Keypairs", "Signing transactions")
    }
    if (keywords.includes("token")) {
      relatedConcepts.push("Token Program", "Associated Token Accounts")
    }
  }

  // Limit to 3 related concepts
  const limitedConcepts = relatedConcepts.slice(0, 3)

  return {
    response: response.trim(),
    relatedConcepts: limitedConcepts,
  }
}

// import { NextResponse } from "next/server"

// export const maxDuration = 30

// const SOLANA_SYSTEM_PROMPT = `You are a friendly, approachable Solana AI Tutor - think "Duolingo meets GitHub Copilot" for Solana development.

// CRITICAL: You are having an ONGOING CONVERSATION. Always read the full chat history and maintain context.
// - When users respond to your questions (like "yes", "no", "sure", "tell me more"), continue from where you left off
// - NEVER restart the conversation or give generic welcomes unless it's truly a new topic
// - Reference previous messages when relevant
// - Build upon what you've already explained

// Your personality:
// - Warm, encouraging, and patient (like a great teacher)
// - Use plain English explanations before technical jargon
// - Break down complex concepts into digestible pieces
// - Celebrate learning milestones with enthusiasm
// - Use analogies and real-world examples

// Your expertise covers:
// - Solana fundamentals (accounts, transactions, programs, rent, lamports)
// - Wallet concepts (keypairs, signatures, Phantom, Solflare)
// - Program development (Rust, Anchor framework, Solana Program Library)
// - Advanced concepts (PDAs, CPIs, account data serialization)
// - Web3.js and Solana SDK usage
// - Best practices and common pitfalls
// - Debugging and troubleshooting

// Response format:
// - Start with a clear, friendly explanation using markdown formatting
// - Use **bold** for important terms, *italic* for emphasis
// - Use bullet points or numbered lists when appropriate
// - Keep responses concise but thorough (aim for 3-5 paragraphs max)

// Code examples - ONLY include code when:
// - The user explicitly asks for code ("show me code", "give me an example", "how do I implement")
// - The question contains implementation keywords ("how to build", "create a", "write a function")
// - Code is absolutely essential to answer the question
// - Otherwise, focus on conceptual explanations and ask "Would you like to see a code example for this?"

// When providing code:
// - Use markdown code blocks with language specification (e.g., \`\`\`rust, \`\`\`javascript)
// - Always include comments explaining what the code does
// - Use realistic, practical examples
// - Mention any important gotchas or best practices

// Remember: Your goal is to make Solana development feel accessible and fun, not intimidating!`

// const LEARNING_PATHS = {
//   beginner: [
//     "What is Solana and why is it fast?",
//     "How do Solana wallets work?",
//     "What are lamports and SOL?",
//     "What is an account on Solana?",
//     "How do I send my first transaction?",
//   ],
//   intermediate: [
//     "How do I deploy a Solana program?",
//     "What is the Anchor framework?",
//     "How do I interact with programs using web3.js?",
//     "What are token accounts?",
//     "How does rent work on Solana?",
//   ],
//   advanced: [
//     "What are PDAs and how do I use them?",
//     "How do Cross-Program Invocations (CPIs) work?",
//     "How do I optimize my program for compute units?",
//     "What are the best practices for account data serialization?",
//     "How do I debug Solana programs effectively?",
//   ],
// }

// // GET endpoint - returns learning paths
// export async function GET() {
//   return NextResponse.json({ learningPaths: LEARNING_PATHS })
// }

// // POST endpoint - handles chat messages
// export async function POST(req: Request) {
//   try {
//     const { messages } = await req.json()

//     if (!messages || !Array.isArray(messages) || messages.length === 0) {
//       return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
//     }

//     const validMessages = messages.filter((msg) => {
//       return msg && typeof msg === "object" && (msg.role === "user" || msg.role === "assistant") && msg.content
//     })

//     if (validMessages.length === 0) {
//       return NextResponse.json({ error: "No valid messages found" }, { status: 400 })
//     }

//     const text = await generateWithLLM(validMessages)

//     // Parse the response to extract code and related concepts
//     const response = parseAIResponse(text)

//     return NextResponse.json(response)
//   } catch (error) {
//     console.error("Error in tutor API:", error)
//     const errorMessage = error instanceof Error ? error.message : "Unknown error"

//     return NextResponse.json(
//       {
//         error: errorMessage,
//         response: `I encountered an error: ${errorMessage}. Please check your API key configuration or try again.`,
//         relatedConcepts: [],
//       },
//       { status: 500 },
//     )
//   }
// }

// async function generateWithLLM(messages: Array<{ role: string; content: string }>): Promise<string> {
//   const activeLLM = process.env.ACTIVE_LLM || "groq"

//   switch (activeLLM.toLowerCase()) {
//     case "groq":
//       return generateWithGroq(messages)
//     case "gemini":
//       return generateWithGemini(messages)
//     case "openai":
//       return generateWithOpenAI(messages)
//     case "deepseek":
//       return generateWithDeepSeek(messages)
//     default:
//       return generateWithGroq(messages)
//   }
// }

// async function generateWithGroq(messages: Array<{ role: string; content: string }>): Promise<string> {
//   const apiKey = process.env.GROQ_API_KEY
//   if (!apiKey) throw new Error("GROQ_API_KEY is not configured")

//   const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${apiKey}`,
//     },
//     body: JSON.stringify({
//       model: "llama-3.3-70b-versatile",
//       messages: [{ role: "system", content: SOLANA_SYSTEM_PROMPT }, ...messages],
//       temperature: 0.7,
//       max_tokens: 2000,
//     }),
//   })

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}))
//     const errorMessage = errorData.error?.message || errorData.message || response.statusText
//     throw new Error(`Groq API error: ${errorMessage}`)
//   }

//   const data = await response.json()
//   return data.choices[0].message.content
// }

// async function generateWithGemini(messages: Array<{ role: string; content: string }>): Promise<string> {
//   const apiKey = process.env.GEMINI_API_KEY
//   if (!apiKey) throw new Error("GEMINI_API_KEY is not configured")

//   // Convert messages to Gemini format
//   const conversationHistory = messages
//     .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
//     .join("\n\n")

//   const response = await fetch(
//     `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [{ text: `${SOLANA_SYSTEM_PROMPT}\n\n${conversationHistory}` }],
//           },
//         ],
//         generationConfig: {
//           temperature: 0.7,
//           maxOutputTokens: 2000,
//         },
//       }),
//     },
//   )

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}))
//     const errorMessage = errorData.error?.message || response.statusText
//     throw new Error(`Gemini API error: ${errorMessage}`)
//   }

//   const data = await response.json()
//   return data.candidates[0].content.parts[0].text
// }

// async function generateWithOpenAI(messages: Array<{ role: string; content: string }>): Promise<string> {
//   const apiKey = process.env.OPENAI_API_KEY
//   if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")

//   const response = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${apiKey}`,
//     },
//     body: JSON.stringify({
//       model: "gpt-4o",
//       messages: [{ role: "system", content: SOLANA_SYSTEM_PROMPT }, ...messages],
//       temperature: 0.7,
//       max_tokens: 2000,
//     }),
//   })

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}))
//     const errorMessage = errorData.error?.message || response.statusText
//     throw new Error(`OpenAI API error: ${errorMessage}`)
//   }

//   const data = await response.json()
//   return data.choices[0].message.content
// }

// async function generateWithDeepSeek(messages: Array<{ role: string; content: string }>): Promise<string> {
//   const apiKey = process.env.DEEPSEEK_API_KEY
//   if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured")

//   const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${apiKey}`,
//     },
//     body: JSON.stringify({
//       model: "deepseek-chat",
//       messages: [{ role: "system", content: SOLANA_SYSTEM_PROMPT }, ...messages],
//       temperature: 0.7,
//       max_tokens: 2000,
//     }),
//   })

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}))
//     const errorMessage = errorData.error?.message || response.statusText
//     throw new Error(`DeepSeek API error: ${errorMessage}`)
//   }

//   const data = await response.json()
//   return data.choices[0].message.content
// }

// function parseAIResponse(text: string): {
//   response: string
//   relatedConcepts: string[]
// } {
//   let response = text
//   const relatedConcepts: string[] = []

//   // Extract related concepts (look for common patterns)
//   const conceptPatterns = [
//     /related concepts?:?\s*([^\n]+)/i,
//     /you might also want to learn about:?\s*([^\n]+)/i,
//     /next steps?:?\s*([^\n]+)/i,
//     /explore:?\s*([^\n]+)/i,
//   ]

//   for (const pattern of conceptPatterns) {
//     const match = text.match(pattern)
//     if (match) {
//       // Split by common delimiters and clean up
//       const concepts = match[1]
//         .split(/[,;]/)
//         .map((c) => c.trim())
//         .filter((c) => c.length > 0 && c.length < 50)

//       relatedConcepts.push(...concepts)

//       // Remove the related concepts section from response
//       response = response.replace(pattern, "").trim()
//       break
//     }
//   }

//   // If no explicit related concepts found, suggest some based on keywords
//   if (relatedConcepts.length === 0) {
//     const keywords = text.toLowerCase()

//     if (keywords.includes("account")) {
//       relatedConcepts.push("Program Derived Addresses", "Account rent")
//     }
//     if (keywords.includes("transaction")) {
//       relatedConcepts.push("Transaction fees", "Blockhash")
//     }
//     if (keywords.includes("program")) {
//       relatedConcepts.push("Anchor framework", "Cross-Program Invocations")
//     }
//     if (keywords.includes("wallet")) {
//       relatedConcepts.push("Keypairs", "Signing transactions")
//     }
//     if (keywords.includes("token")) {
//       relatedConcepts.push("Token Program", "Associated Token Accounts")
//     }
//   }

//   // Limit to 3 related concepts
//   const limitedConcepts = relatedConcepts.slice(0, 3)

//   return {
//     response: response.trim(),
//     relatedConcepts: limitedConcepts,
//   }
// }



// import { NextResponse } from "next/server"

// export const maxDuration = 30

// const SOLANA_SYSTEM_PROMPT = `You are a friendly, approachable Solana AI Tutor - think "Duolingo meets GitHub Copilot" for Solana development.

// Your personality:
// - Warm, encouraging, and patient (like a great teacher)
// - Use plain English explanations before technical jargon
// - Break down complex concepts into digestible pieces
// - Celebrate learning milestones with enthusiasm
// - Use analogies and real-world examples

// Your expertise covers:
// - Solana fundamentals (accounts, transactions, programs, rent, lamports)
// - Wallet concepts (keypairs, signatures, Phantom, Solflare)
// - Program development (Rust, Anchor framework, Solana Program Library)
// - Advanced concepts (PDAs, CPIs, account data serialization)
// - Web3.js and Solana SDK usage
// - Best practices and common pitfalls
// - Debugging and troubleshooting

// Response format:
// - Start with a clear, friendly explanation using markdown formatting
// - Use **bold** for important terms, *italic* for emphasis
// - Use bullet points or numbered lists when appropriate
// - Keep responses concise but thorough (aim for 3-5 paragraphs max)

// Code examples - ONLY include code when:
// - The user explicitly asks for code ("show me code", "give me an example", "how do I implement")
// - The question contains implementation keywords ("how to build", "create a", "write a function")
// - Code is absolutely essential to answer the question
// - Otherwise, focus on conceptual explanations and ask "Would you like to see a code example for this?"

// When providing code:
// - Use markdown code blocks with language specification (e.g., \`\`\`rust, \`\`\`javascript)
// - Always include comments explaining what the code does
// - Use realistic, practical examples
// - Mention any important gotchas or best practices

// Remember: Your goal is to make Solana development feel accessible and fun, not intimidating!`

// const LEARNING_PATHS = {
//   beginner: [
//     "What is Solana and why is it fast?",
//     "How do Solana wallets work?",
//     "What are lamports and SOL?",
//     "What is an account on Solana?",
//     "How do I send my first transaction?",
//   ],
//   intermediate: [
//     "How do I deploy a Solana program?",
//     "What is the Anchor framework?",
//     "How do I interact with programs using web3.js?",
//     "What are token accounts?",
//     "How does rent work on Solana?",
//   ],
//   advanced: [
//     "What are PDAs and how do I use them?",
//     "How do Cross-Program Invocations (CPIs) work?",
//     "How do I optimize my program for compute units?",
//     "What are the best practices for account data serialization?",
//     "How do I debug Solana programs effectively?",
//   ],
// }

// // GET endpoint - returns learning paths
// export async function GET() {
//   return NextResponse.json({ learningPaths: LEARNING_PATHS })
// }

// // POST endpoint - handles chat messages
// export async function POST(req: Request) {
//   try {
//     const { message } = await req.json()

//     if (!message || typeof message !== "string") {
//       return NextResponse.json({ error: "Message is required" }, { status: 400 })
//     }

//     const text = await generateWithLLM(message)

//     // Parse the response to extract code and related concepts
//     const response = parseAIResponse(text)

//     return NextResponse.json(response)
//   } catch (error) {
//     console.error("Error in tutor API:", error)
//     const errorMessage = error instanceof Error ? error.message : "Unknown error"

//     return NextResponse.json(
//       {
//         response: `Error: ${errorMessage}. Please check your API key configuration.`,
//         code: undefined,
//         relatedConcepts: [],
//       },
//       { status: 500 },
//     )
//   }
// }

// async function generateWithLLM(message: string): Promise<string> {
//   const activeLLM = process.env.ACTIVE_LLM || "groq"

//   switch (activeLLM.toLowerCase()) {
//     case "groq":
//       return generateWithGroq(message)
//     case "gemini":
//       return generateWithGemini(message)
//     case "openai":
//       return generateWithOpenAI(message)
//     case "deepseek":
//       return generateWithDeepSeek(message)
//     default:
//       return generateWithGroq(message)
//   }
// }

// async function generateWithGroq(message: string): Promise<string> {
//   const apiKey = process.env.GROQ_API_KEY
//   if (!apiKey) throw new Error("GROQ_API_KEY is not configured")

//   const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${apiKey}`,
//     },
//     body: JSON.stringify({
//       model: "llama-3.3-70b-versatile",
//       messages: [
//         { role: "system", content: SOLANA_SYSTEM_PROMPT },
//         { role: "user", content: message },
//       ],
//       temperature: 0.7,
//       max_tokens: 2000,
//     }),
//   })

//   if (!response.ok) {
//     throw new Error(`Groq API error: ${response.statusText}`)
//   }

//   const data = await response.json()
//   return data.choices[0].message.content
// }

// async function generateWithGemini(message: string): Promise<string> {
//   const apiKey = process.env.GEMINI_API_KEY
//   if (!apiKey) throw new Error("GEMINI_API_KEY is not configured")

//   const response = await fetch(
//     `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [{ text: `${SOLANA_SYSTEM_PROMPT}\n\nUser: ${message}` }],
//           },
//         ],
//         generationConfig: {
//           temperature: 0.7,
//           maxOutputTokens: 2000,
//         },
//       }),
//     },
//   )

//   if (!response.ok) {
//     throw new Error(`Gemini API error: ${response.statusText}`)
//   }

//   const data = await response.json()
//   return data.candidates[0].content.parts[0].text
// }

// async function generateWithOpenAI(message: string): Promise<string> {
//   const apiKey = process.env.OPENAI_API_KEY
//   if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")

//   const response = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${apiKey}`,
//     },
//     body: JSON.stringify({
//       model: "gpt-4o",
//       messages: [
//         { role: "system", content: SOLANA_SYSTEM_PROMPT },
//         { role: "user", content: message },
//       ],
//       temperature: 0.7,
//       max_tokens: 2000,
//     }),
//   })

//   if (!response.ok) {
//     throw new Error(`OpenAI API error: ${response.statusText}`)
//   }

//   const data = await response.json()
//   return data.choices[0].message.content
// }

// async function generateWithDeepSeek(message: string): Promise<string> {
//   const apiKey = process.env.DEEPSEEK_API_KEY
//   if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured")

//   const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${apiKey}`,
//     },
//     body: JSON.stringify({
//       model: "deepseek-chat",
//       messages: [
//         { role: "system", content: SOLANA_SYSTEM_PROMPT },
//         { role: "user", content: message },
//       ],
//       temperature: 0.7,
//       max_tokens: 2000,
//     }),
//   })

//   if (!response.ok) {
//     throw new Error(`DeepSeek API error: ${response.statusText}`)
//   }

//   const data = await response.json()
//   return data.choices[0].message.content
// }

// function parseAIResponse(text: string): {
//   response: string
//   relatedConcepts: string[]
// } {
//   let response = text
//   const relatedConcepts: string[] = []

//   // Extract related concepts (look for common patterns)
//   const conceptPatterns = [
//     /related concepts?:?\s*([^\n]+)/i,
//     /you might also want to learn about:?\s*([^\n]+)/i,
//     /next steps?:?\s*([^\n]+)/i,
//     /explore:?\s*([^\n]+)/i,
//   ]

//   for (const pattern of conceptPatterns) {
//     const match = text.match(pattern)
//     if (match) {
//       // Split by common delimiters and clean up
//       const concepts = match[1]
//         .split(/[,;]/)
//         .map((c) => c.trim())
//         .filter((c) => c.length > 0 && c.length < 50)

//       relatedConcepts.push(...concepts)

//       // Remove the related concepts section from response
//       response = response.replace(pattern, "").trim()
//       break
//     }
//   }

//   // If no explicit related concepts found, suggest some based on keywords
//   if (relatedConcepts.length === 0) {
//     const keywords = text.toLowerCase()

//     if (keywords.includes("account")) {
//       relatedConcepts.push("Program Derived Addresses", "Account rent")
//     }
//     if (keywords.includes("transaction")) {
//       relatedConcepts.push("Transaction fees", "Blockhash")
//     }
//     if (keywords.includes("program")) {
//       relatedConcepts.push("Anchor framework", "Cross-Program Invocations")
//     }
//     if (keywords.includes("wallet")) {
//       relatedConcepts.push("Keypairs", "Signing transactions")
//     }
//     if (keywords.includes("token")) {
//       relatedConcepts.push("Token Program", "Associated Token Accounts")
//     }
//   }

//   // Limit to 3 related concepts
//   const limitedConcepts = relatedConcepts.slice(0, 3)

//   return {
//     response: response.trim(),
//     relatedConcepts: limitedConcepts,
//   }
// }


// import { NextResponse } from "next/server"

// export const maxDuration = 30

// const SOLANA_SYSTEM_PROMPT = `You are a friendly, approachable Solana AI Tutor - think "Duolingo meets GitHub Copilot" for Solana development.

// Your personality:
// - Warm, encouraging, and patient (like a great teacher)
// - Use plain English explanations before technical jargon
// - Break down complex concepts into digestible pieces
// - Celebrate learning milestones with enthusiasm
// - Use analogies and real-world examples

// Your expertise covers:
// - Solana fundamentals (accounts, transactions, programs, rent, lamports)
// - Wallet concepts (keypairs, signatures, Phantom, Solflare)
// - Program development (Rust, Anchor framework, Solana Program Library)
// - Advanced concepts (PDAs, CPIs, account data serialization)
// - Web3.js and Solana SDK usage
// - Best practices and common pitfalls
// - Debugging and troubleshooting

// Response format:
// - Start with a clear, friendly explanation
// - If relevant, provide code examples (Rust, Anchor, or JavaScript)
// - Suggest 2-3 related concepts the user might want to explore next
// - Keep responses concise but thorough (aim for 3-5 paragraphs max)

// When providing code:
// - Always include comments explaining what the code does
// - Use realistic, practical examples
// - Mention any important gotchas or best practices

// Remember: Your goal is to make Solana development feel accessible and fun, not intimidating!`

// const LEARNING_PATHS = {
//   beginner: [
//     "What is Solana and why is it fast?",
//     "How do Solana wallets work?",
//     "What are lamports and SOL?",
//     "What is an account on Solana?",
//     "How do I send my first transaction?",
//   ],
//   intermediate: [
//     "How do I deploy a Solana program?",
//     "What is the Anchor framework?",
//     "How do I interact with programs using web3.js?",
//     "What are token accounts?",
//     "How does rent work on Solana?",
//   ],
//   advanced: [
//     "What are PDAs and how do I use them?",
//     "How do Cross-Program Invocations (CPIs) work?",
//     "How do I optimize my program for compute units?",
//     "What are the best practices for account data serialization?",
//     "How do I debug Solana programs effectively?",
//   ],
// }

// // GET endpoint - returns learning paths
// export async function GET() {
//   return NextResponse.json({ learningPaths: LEARNING_PATHS })
// }

// // POST endpoint - handles chat messages
// export async function POST(req: Request) {
//   try {
//     const { message } = await req.json()

//     if (!message || typeof message !== "string") {
//       return NextResponse.json({ error: "Message is required" }, { status: 400 })
//     }

//     const text = await generateWithLLM(message)

//     // Parse the response to extract code and related concepts
//     const response = parseAIResponse(text)

//     return NextResponse.json(response)
//   } catch (error) {
//     console.error("Error in tutor API:", error)
//     const errorMessage = error instanceof Error ? error.message : "Unknown error"

//     return NextResponse.json(
//       {
//         response: `Error: ${errorMessage}. Please check your API key configuration.`,
//         code: undefined,
//         relatedConcepts: [],
//       },
//       { status: 500 },
//     )
//   }
// }

// async function generateWithLLM(message: string): Promise<string> {
//   const activeLLM = process.env.ACTIVE_LLM || "groq"

//   switch (activeLLM.toLowerCase()) {
//     case "groq":
//       return generateWithGroq(message)
//     case "gemini":
//       return generateWithGemini(message)
//     case "openai":
//       return generateWithOpenAI(message)
//     case "deepseek":
//       return generateWithDeepSeek(message)
//     default:
//       return generateWithGroq(message)
//   }
// }

// async function generateWithGroq(message: string): Promise<string> {
//   const apiKey = process.env.GROQ_API_KEY
//   if (!apiKey) throw new Error("GROQ_API_KEY is not configured")

//   const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${apiKey}`,
//     },
//     body: JSON.stringify({
//       model: "llama-3.3-70b-versatile",
//       messages: [
//         { role: "system", content: SOLANA_SYSTEM_PROMPT },
//         { role: "user", content: message },
//       ],
//       temperature: 0.7,
//       max_tokens: 2000,
//     }),
//   })

//   if (!response.ok) {
//     throw new Error(`Groq API error: ${response.statusText}`)
//   }

//   const data = await response.json()
//   return data.choices[0].message.content
// }

// async function generateWithGemini(message: string): Promise<string> {
//   const apiKey = process.env.GEMINI_API_KEY
//   if (!apiKey) throw new Error("GEMINI_API_KEY is not configured")

//   const response = await fetch(
//     `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [{ text: `${SOLANA_SYSTEM_PROMPT}\n\nUser: ${message}` }],
//           },
//         ],
//         generationConfig: {
//           temperature: 0.7,
//           maxOutputTokens: 2000,
//         },
//       }),
//     },
//   )

//   if (!response.ok) {
//     throw new Error(`Gemini API error: ${response.statusText}`)
//   }

//   const data = await response.json()
//   return data.candidates[0].content.parts[0].text
// }

// async function generateWithOpenAI(message: string): Promise<string> {
//   const apiKey = process.env.OPENAI_API_KEY
//   if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")

//   const response = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${apiKey}`,
//     },
//     body: JSON.stringify({
//       model: "gpt-4o",
//       messages: [
//         { role: "system", content: SOLANA_SYSTEM_PROMPT },
//         { role: "user", content: message },
//       ],
//       temperature: 0.7,
//       max_tokens: 2000,
//     }),
//   })

//   if (!response.ok) {
//     throw new Error(`OpenAI API error: ${response.statusText}`)
//   }

//   const data = await response.json()
//   return data.choices[0].message.content
// }

// async function generateWithDeepSeek(message: string): Promise<string> {
//   const apiKey = process.env.DEEPSEEK_API_KEY
//   if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured")

//   const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${apiKey}`,
//     },
//     body: JSON.stringify({
//       model: "deepseek-chat",
//       messages: [
//         { role: "system", content: SOLANA_SYSTEM_PROMPT },
//         { role: "user", content: message },
//       ],
//       temperature: 0.7,
//       max_tokens: 2000,
//     }),
//   })

//   if (!response.ok) {
//     throw new Error(`DeepSeek API error: ${response.statusText}`)
//   }

//   const data = await response.json()
//   return data.choices[0].message.content
// }

// // Helper function to parse AI response and extract code blocks and related concepts
// function parseAIResponse(text: string): {
//   response: string
//   code?: string
//   relatedConcepts: string[]
// } {
//   let response = text
//   let code: string | undefined
//   const relatedConcepts: string[] = []

//   // Extract code blocks (markdown format)
//   const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/
//   const codeMatch = text.match(codeBlockRegex)

//   if (codeMatch) {
//     code = codeMatch[1].trim()
//     // Remove code block from response text
//     response = text.replace(codeBlockRegex, "[See code example below]").trim()
//   }

//   // Extract related concepts (look for common patterns)
//   const conceptPatterns = [
//     /related concepts?:?\s*([^\n]+)/i,
//     /you might also want to learn about:?\s*([^\n]+)/i,
//     /next steps?:?\s*([^\n]+)/i,
//     /explore:?\s*([^\n]+)/i,
//   ]

//   for (const pattern of conceptPatterns) {
//     const match = text.match(pattern)
//     if (match) {
//       // Split by common delimiters and clean up
//       const concepts = match[1]
//         .split(/[,;]/)
//         .map((c) => c.trim())
//         .filter((c) => c.length > 0 && c.length < 50) // Reasonable length for a concept

//       relatedConcepts.push(...concepts)

//       // Remove the related concepts section from response
//       response = response.replace(pattern, "").trim()
//       break
//     }
//   }

//   // If no explicit related concepts found, suggest some based on keywords
//   if (relatedConcepts.length === 0) {
//     const keywords = text.toLowerCase()

//     if (keywords.includes("account")) {
//       relatedConcepts.push("Program Derived Addresses", "Account rent")
//     }
//     if (keywords.includes("transaction")) {
//       relatedConcepts.push("Transaction fees", "Blockhash")
//     }
//     if (keywords.includes("program")) {
//       relatedConcepts.push("Anchor framework", "Cross-Program Invocations")
//     }
//     if (keywords.includes("wallet")) {
//       relatedConcepts.push("Keypairs", "Signing transactions")
//     }
//     if (keywords.includes("token")) {
//       relatedConcepts.push("Token Program", "Associated Token Accounts")
//     }
//   }

//   // Limit to 3 related concepts
//   const limitedConcepts = relatedConcepts.slice(0, 3)

//   return {
//     response: response.trim(),
//     code,
//     relatedConcepts: limitedConcepts,
//   }
// }


// import { type NextRequest, NextResponse } from "next/server"
// import { generateText } from "ai"

// // Demo data for learning paths
// const learningPaths = {
//   beginner: [
//     "What is SOL?",
//     "How do wallets work?",
//     "What is a transaction signature?",
//     "How do I send SOL?",
//     "What are tokens on Solana?",
//   ],
//   intermediate: [
//     "How do I deploy a program?",
//     "What is Anchor framework?",
//     "How do SPL tokens work?",
//     "What are PDAs?",
//     "How do I interact with programs?",
//   ],
//   advanced: [
//     "How do CPIs work?",
//     "What are account constraints?",
//     "How do I optimize compute units?",
//     "What is rent exemption?",
//     "How do I debug programs?",
//   ],
// }

// // Demo responses for common questions
// const demoResponses: Record<string, { explanation: string; code?: string; relatedConcepts: string[] }> = {
//   "what is sol?": {
//     explanation:
//       "SOL is the native cryptocurrency of the Solana blockchain! Think of it like the 'fuel' that powers everything on Solana. You need SOL to pay for transactions (called 'gas fees'), and you can also use it to stake and help secure the network. Unlike Bitcoin or Ethereum, Solana is super fast and cheap - transactions usually cost less than a penny!",
//     relatedConcepts: ["Wallets", "Transaction Fees", "Staking"],
//   },
//   "how do wallets work?": {
//     explanation:
//       "A Solana wallet is like your digital bank account! It has two main parts: a public key (like your account number that you can share) and a private key (like your password that you NEVER share). Your wallet stores your SOL and tokens, and you use it to sign transactions. Popular wallets include Phantom, Solflare, and Backpack.",
//     code: `// Creating a wallet in JavaScript
// import { Keypair } from '@solana/web3.js';

// // Generate a new wallet
// const wallet = Keypair.generate();

// console.log('Public Key:', wallet.publicKey.toString());
// // Never log your private key in production!
// console.log('Private Key:', wallet.secretKey);`,
//     relatedConcepts: ["Public/Private Keys", "Transaction Signing", "Security Best Practices"],
//   },
//   "what is a transaction signature?": {
//     explanation:
//       "A transaction signature is like a unique receipt for every action on Solana! When you send SOL or interact with a program, the blockchain creates a signature - a long string of letters and numbers that proves the transaction happened. You can use this signature to look up your transaction on explorers like Solscan or Solana Explorer.",
//     code: `// Sending a transaction and getting the signature
// import { Connection, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';

// const connection = new Connection(clusterApiUrl('devnet'));

// // Send transaction
// const signature = await connection.requestAirdrop(
//   wallet.publicKey,
//   LAMPORTS_PER_SOL
// );

// console.log('Transaction Signature:', signature);
// // Use this to track your transaction!`,
//     relatedConcepts: ["Transactions", "Block Explorers", "Transaction Status"],
//   },
//   "how do i deploy a program?": {
//     explanation:
//       "Deploying a Solana program is like publishing your app to the blockchain! First, you write your program in Rust, then compile it to BPF (Berkeley Packet Filter) bytecode. Finally, you use the Solana CLI to deploy it to the network. The program gets a unique address (Program ID) that others can use to interact with it.",
//     code: `# Build your program
// cargo build-bpf

// # Deploy to devnet
// solana program deploy target/deploy/my_program.so

// # Your program will get a Program ID like:
// # 7N4HggYEJAtCLJdnHGCtFqfxcB5rhQCsQTze3ftYstVj`,
//     relatedConcepts: ["Rust Programming", "Anchor Framework", "Program IDs"],
//   },
//   "what is anchor framework?": {
//     explanation:
//       "Anchor is like the 'Ruby on Rails' of Solana development! It's a framework that makes building Solana programs much easier by handling a lot of the complex stuff for you. Instead of writing hundreds of lines of boilerplate code, Anchor lets you focus on your program's logic. It includes built-in security checks, automatic serialization, and a clean syntax.",
//     code: `// Example Anchor program
// use anchor_lang::prelude::*;

// declare_id!("YourProgramIDHere");

// #[program]
// pub mod my_program {
//     use super::*;
    
//     pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
//         let account = &mut ctx.accounts.my_account;
//         account.data = 0;
//         Ok(())
//     }
// }

// #[derive(Accounts)]
// pub struct Initialize<'info> {
//     #[account(init, payer = user, space = 8 + 8)]
//     pub my_account: Account<'info, MyAccount>,
//     #[account(mut)]
//     pub user: Signer<'info>,
//     pub system_program: Program<'info, System>,
// }

// #[account]
// pub struct MyAccount {
//     pub data: u64,
// }`,
//     relatedConcepts: ["Program Development", "Account Validation", "IDL"],
//   },
//   "what are pdas?": {
//     explanation:
//       "PDAs (Program Derived Addresses) are special accounts that only programs can control - no private key needed! Think of them like 'smart' accounts that your program can create and manage. They're super useful for storing data that belongs to your program, like user profiles or game state. PDAs are deterministic, meaning you can always find them using the same seeds.",
//     code: `// Finding a PDA in JavaScript
// import { PublicKey } from '@solana/web3.js';

// const [pda, bump] = await PublicKey.findProgramAddress(
//   [
//     Buffer.from("user-profile"),
//     userWallet.publicKey.toBuffer(),
//   ],
//   programId
// );

// console.log('PDA:', pda.toString());
// console.log('Bump:', bump);`,
//     relatedConcepts: ["Account Model", "Seeds and Bumps", "Program Authority"],
//   },
// }

// export async function POST(request: NextRequest) {
//   try {
//     const { message, useAI = false } = await request.json()

//     if (!message) {
//       return NextResponse.json({ error: "Message is required" }, { status: 400 })
//     }

//     // Check if we have a demo response for this question
//     const normalizedMessage = message.toLowerCase().trim()
//     const demoResponse = demoResponses[normalizedMessage]

//     if (demoResponse) {
//       // Return demo response
//       return NextResponse.json({
//         response: demoResponse.explanation,
//         code: demoResponse.code || null,
//         relatedConcepts: demoResponse.relatedConcepts,
//         isDemo: true,
//       })
//     }

//     // If useAI is true and we have the API configured, use real AI
//     if (useAI && process.env.OPENAI_API_KEY) {
//       const { text } = await generateText({
//         model: "openai/gpt-4o-mini",
//         prompt: `You are a friendly Solana tutor. Answer this question in a warm, approachable way, like you're explaining to a friend. Use analogies and simple language. Keep it concise but informative.

// Question: ${message}

// If relevant, suggest 2-3 related concepts the user might want to learn about next.`,
//       })

//       return NextResponse.json({
//         response: text,
//         code: null,
//         relatedConcepts: [],
//         isDemo: false,
//       })
//     }

//     // Fallback response for questions not in demo data
//     return NextResponse.json({
//       response: `Great question! "${message}" is an interesting topic in Solana development. While I don't have a specific answer prepared for this yet, I'd recommend checking out the official Solana documentation or asking in the Solana Discord community. In the meantime, try exploring some of the curated questions in the learning paths above!`,
//       code: null,
//       relatedConcepts: ["Solana Documentation", "Community Resources", "Developer Guides"],
//       isDemo: true,
//     })
//   } catch (error) {
//     console.error("[v0] Tutor API error:", error)
//     return NextResponse.json({ error: "Failed to process your question" }, { status: 500 })
//   }
// }

// export async function GET() {
//   // Return learning paths
//   return NextResponse.json({ learningPaths })
// }
