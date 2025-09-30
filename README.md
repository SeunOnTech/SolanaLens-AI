# Solana Transaction Analyzer API - Setup Guide

## Overview
This API analyzes Solana transactions and generates AI-powered explanations using LLMs (Groq, Gemini, OpenAI, or DeepSeek).

## Installation

### 1. Install Dependencies

```bash
npm install @solana/web3.js node-fetch
# or
pnpm add @solana/web3.js node-fetch
```

### 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Choose your preferred LLM provider
ACTIVE_LLM=groq

# Add at least one API key
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
# GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxx
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
# DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

### 3. Get API Keys

#### Groq (Recommended - Fast & Free)
1. Visit https://console.groq.com
2. Sign up for a free account
3. Go to API Keys section
4. Create a new API key
5. Copy and paste into `.env.local`

#### Gemini (Google)
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Create an API key
4. Copy and paste into `.env.local`

#### OpenAI
1. Visit https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new secret key
4. Copy and paste into `.env.local`

#### DeepSeek
1. Visit https://platform.deepseek.com
2. Sign up for an account
3. Go to API Keys
4. Create a new key
5. Copy and paste into `.env.local`

## File Structure

```
your-project/
├── app/
│   └── api/
│       └── analyze-transaction/
│           └── route.ts          # Main API route
├── .env.local                    # Your environment variables
├── .env.example                  # Example environment file
└── README.md                     # This file
```

## Usage

### Start Development Server

```bash
npm run dev
# or
pnpm dev
```

### Test the API

#### Health Check
```bash
curl http://localhost:3000/api/analyze-transaction
```

#### Analyze Transaction
```bash
curl -X POST http://localhost:3000/api/analyze-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "signature": "2Mq8GjqKKmva7q8WAmYPtE5NKe12B2wbH3oE9oEv3YAb4J844AiYQNEwAWUJHH7Jbkw39PVhf159Kx9vygEP4URQ"
  }'
```

### Example Response

```json
{
  "signature": "2Mq8GjqKKmva7q8WAmYPtE5NKe12B2wbH3oE9oEv3YAb4J844AiYQNEwAWUJHH7Jbkw39PVhf159Kx9vygEP4URQ",
  "status": "Confirmed",
  "timestamp": "2025-09-29T12:00:00.000Z",
  "fee": {
    "sol": "0.000005000",
    "usd": "0.0010"
  },
  "type": "Token Swap",
  "explanations": {
    "beginner": "This transaction swapped tokens on Solana...",
    "developer": "This transaction executed a swap instruction..."
  },
  "steps": [...],
  "programs": [...],
  "tokenTransfers": [...],
  "accountChanges": [...],
  "feeComparison": {
    "solanaFee": "$0.0010",
    "ethereumFee": "$5–10",
    "savings": "99.98%"
  },
  "analyzedAt": "2025-09-29T12:00:05.000Z",
  "requestId": "req_1234567890_abc123",
  "processingTime": "2500ms",
  "metadata": {
    "apiVersion": "1.0.0",
    "solanaCluster": "mainnet-beta",
    "aiModel": "groq",
    "confidence": 0.97
  }
}
```

## Switching LLM Providers

Change the `ACTIVE_LLM` variable in `.env.local`:

```env
# Use Groq (fastest, free)
ACTIVE_LLM=groq

# Use Gemini (good quality)
ACTIVE_LLM=gemini

# Use OpenAI (best quality, paid)
ACTIVE_LLM=openai

# Use DeepSeek (good for technical content)
ACTIVE_LLM=deepseek
```

## Custom Solana RPC (Optional)

For production or high-volume usage, use a private RPC endpoint:

```env
# QuickNode
SOLANA_RPC_URL=https://your-endpoint.quiknode.pro/xxxxx/

# Helius
SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=xxxxx

# Alchemy
SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/xxxxx
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad request (invalid signature or missing parameters)
- `404` - Transaction not found
- `500` - Server error (LLM API failure, network issues, etc.)

## Features

✅ **Real-time transaction analysis** - Fetches live data from Solana  
✅ **AI-powered explanations** - Beginner and developer explanations  
✅ **Multiple LLM support** - Choose from 4 different AI providers  
✅ **Token price data** - Live prices from Jupiter API  
✅ **Program detection** - Identifies Jupiter, Raydium, Orca, etc.  
✅ **Step-by-step breakdown** - Clear transaction flow  

## Troubleshooting

### API Key Not Working
- Verify the key is correctly copied (no extra spaces)
- Check the key is valid on the provider's dashboard
- Ensure you have credits/quota remaining

### Transaction Not Found
- Verify the signature is correct
- Check if the transaction is on mainnet-beta
- Wait a few seconds for transaction confirmation

### Slow Response Times
- Switch to a faster LLM (Groq is fastest)
- Use a private Solana RPC endpoint
- Reduce the number of AI calls (modify prompt complexity)

### Rate Limits
- Most providers have generous free tiers
- Implement caching for repeated requests
- Consider upgrading to paid plans for production

## Production Checklist

- [ ] Set up private Solana RPC endpoint
- [ ] Configure production API keys
- [ ] Add rate limiting middleware
- [ ] Implement response caching
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Add request logging
- [ ] Configure CORS if needed
- [ ] Set up environment-specific configs

## Support

For issues or questions:
- Check the console logs for detailed error messages
- Verify all environment variables are set correctly
- Test with a known valid transaction signature
- Ensure your API keys have the necessary permissions

## License

MIT