import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Context storage for conversation memory
const conversationContext = new Map();

// Asset aliases and variations
const ASSET_ALIASES = {
  'stellar': 'XLM',
  'lumens': 'XLM',
  'xml': 'XLM', // Common typo
  'dollars': 'USDC',
  'usd': 'USDC',
  'euros': 'EURC',
  'eur': 'EURC',
  'aqua': 'AQUA',
  'aquarius': 'AQUA',
  'yieldblox': 'YBX',
  'yield': 'YBX'
};

// Intent confidence scoring
function calculateConfidence(command: string, parsedResult: any): number {
  let confidence = 0.5; // Base confidence
  
  // Boost confidence for clear keywords
  const clearKeywords = ['send', 'swap', 'balance', 'freeze', 'unfreeze', 'portfolio'];
  if (clearKeywords.some(keyword => command.toLowerCase().includes(keyword))) {
    confidence += 0.3;
  }
  
  // Boost for valid amounts
  if (parsedResult.amount && !isNaN(parsedResult.amount)) {
    confidence += 0.2;
  }
  
  // Boost for valid addresses
  if (parsedResult.recipient && parsedResult.recipient.startsWith('G')) {
    confidence += 0.2;
  }
  
  return Math.min(confidence, 1.0);
}

// Enhanced fallback parser for when AI is not available
function parseCommandFallback(command: string) {
  const cmd = command.toLowerCase().trim();
  
  // Balance commands - more variations
  if (
    cmd.includes('balance') || 
    cmd.includes('how much') || 
    cmd.includes('what do i have') ||
    cmd.includes('show balance') ||
    cmd.includes('check balance') ||
    cmd.includes('my balance') ||
    cmd.includes('current balance') ||
    cmd.includes('wallet balance') ||
    (cmd.includes('what') && (cmd.includes('balance') || cmd.includes('money'))) ||
    cmd === 'balance' ||
    cmd.match(/^(what|how much|show|check).*(balance|money|funds|xlm)/i)
  ) {
    return { action: 'balance', amount: null, recipient: null, limit: null };
  }
  
  // History commands - more variations
  if (
    cmd.includes('history') || 
    cmd.includes('transactions') || 
    cmd.includes('recent') ||
    cmd.includes('transaction history') ||
    cmd.includes('show transactions') ||
    cmd.includes('my transactions') ||
    cmd.includes('payment history') ||
    cmd.includes('tx history') ||
    cmd.match(/^(show|get|display).*(history|transactions|payments)/i)
  ) {
    return { action: 'history', amount: null, recipient: null, limit: null };
  }
  
  // Contact management commands
  // Check smart contract version first: "save GXXX as Alice to contract"
  const smartContactMatch = cmd.match(/(?:save|add)\s+(g[a-z0-9]{55})\s+as\s+([a-z]+)\s+(?:to|in)\s+(?:contract|blockchain|smart)/i);
  
  if (smartContactMatch) {
    return {
      action: 'save_contact_to_contract',
      amount: null,
      recipient: smartContactMatch[1].toUpperCase(),
      limit: null,
      contactName: smartContactMatch[2].trim(),
      contractAction: 'add_contact'
    };
  }
  
  // Check for contract-specific patterns: "save contract Alice GXXX" or "add Alice to contract"
  if (cmd.includes('contract') || cmd.includes('blockchain') || cmd.includes('smart')) {
    // Pattern: "save contract Alice GXXX" or "add contract Alice GXXX"
    const contractSaveMatch1 = cmd.match(/(?:save|add)\s+contract\s+([a-z0-9\s]+?)\s+(g[a-z0-9]{55})/i);
    // Pattern: "save Alice GXXX contract" or "add Alice GXXX to contract"
    const contractSaveMatch2 = cmd.match(/(?:save|add)\s+([a-z0-9\s]+?)\s+(g[a-z0-9]{55})\s+(?:to\s+)?contract/i);
    
    if (contractSaveMatch1) {
      return {
        action: 'save_contact_to_contract',
        amount: null,
        recipient: contractSaveMatch1[2].toUpperCase(),
        limit: null,
        contactName: contractSaveMatch1[1].trim(),
        contractAction: 'add_contact'
      };
    }
    
    if (contractSaveMatch2) {
      return {
        action: 'save_contact_to_contract',
        amount: null,
        recipient: contractSaveMatch2[2].toUpperCase(),
        limit: null,
        contactName: contractSaveMatch2[1].trim(),
        contractAction: 'add_contact'
      };
    }
  }
  
  // Regular contact saving: "save GXXX as John" or "add contact John GXXX"
  const saveContactMatch = cmd.match(/(?:save|add)\s+(g[a-z0-9]{55})\s+as\s+([a-z0-9\s]+)/i);
  const addContactMatch = cmd.match(/(?:save|add)\s+contact\s+([a-z0-9\s]+)\s+(g[a-z0-9]{55})/i);
  
  if (saveContactMatch) {
    return {
      action: 'save_contact',
      amount: null,
      recipient: saveContactMatch[1].toUpperCase(),
      limit: null,
      contactName: saveContactMatch[2].trim()
    };
  }
  
  if (addContactMatch) {
    return {
      action: 'save_contact',
      amount: null,
      recipient: addContactMatch[2].toUpperCase(),
      limit: null,
      contactName: addContactMatch[1].trim()
    };
  }
  
  // List contacts - more flexible patterns
  if (cmd.match(/^(list|show|get|display).*(contact|address)/i) || 
      cmd.includes('my contacts') || 
      cmd === 'contacts' ||
      cmd === 'list contact' ||
      cmd === 'show contact') {
    const isSmartContract = cmd.includes('contract') || cmd.includes('blockchain') || cmd.includes('smart');
    return { 
      action: isSmartContract ? 'list_contract_contacts' : 'list_contacts', 
      amount: null, 
      recipient: null, 
      limit: null,
      contractAction: isSmartContract ? 'list_contacts' : null
    };
  }
  
  // Send to contact by name: "send 10 XLM to John" or "pay 5 to Alice"
  // More flexible matching for names (handles typos like XML instead of XLM)
  const sendToContactMatch = cmd.match(/(?:send|transfer|pay)\s+(\d+(?:\.\d+)?)\s*(?:xlm|xml)?\s*to\s+([a-z0-9\s]+)$/i);
  
  if (sendToContactMatch && !sendToContactMatch[2].toLowerCase().startsWith('g')) {
    return {
      action: 'send_to_contact',
      amount: parseFloat(sendToContactMatch[1]),
      recipient: null,
      limit: null,
      contactName: sendToContactMatch[2].trim()
    };
  }
  
  // Send commands - Stellar addresses (more flexible patterns)
  // Handle common typos: XML instead of XLM, missing spaces, etc.
  let sendMatch = cmd.match(/(?:send|transfer|pay)\s+(\d+(?:\.\d+)?)\s*(?:xlm|xml)?\s*to\s+(g[a-z0-9]{55})/i);
  
  if (!sendMatch) {
    // Try without "to": "send 10 XLM GXXX"
    sendMatch = cmd.match(/(?:send|transfer|pay)\s+(\d+(?:\.\d+)?)\s*(?:xlm|xml)?\s+(g[a-z0-9]{55})/i);
  }
  
  if (!sendMatch) {
    // Try with just numbers: "send 10 GXXX"
    sendMatch = cmd.match(/(?:send|transfer|pay)\s+(\d+(?:\.\d+)?)\s+(g[a-z0-9]{55})/i);
  }
  
  if (sendMatch) {
    return {
      action: 'send',
      amount: parseFloat(sendMatch[1]),
      recipient: sendMatch[2].toUpperCase(),
      limit: null
    };
  }
  
  // === SMART CONTRACT COMMANDS (Check these first) ===
  
  // Set daily limit: "set daily limit to 500 XLM" or "daily limit 500"
  const dailyLimitMatch = cmd.match(/(?:set.*)?daily.*limit.*?(\d+(?:\.\d+)?)/i) ||
                         cmd.match(/limit.*daily.*?(\d+(?:\.\d+)?)/i);
  if (dailyLimitMatch) {
    return {
      action: 'set_daily_limit',
      amount: null,
      recipient: null,
      limit: parseFloat(dailyLimitMatch[1]),
      contractAction: 'set_daily_limit'
    };
  }
  
  // Set monthly limit: "set monthly limit to 5000 XLM" or "monthly limit 5000"
  const monthlyLimitMatch = cmd.match(/(?:set.*)?monthly.*limit.*?(\d+(?:\.\d+)?)/i) ||
                           cmd.match(/limit.*monthly.*?(\d+(?:\.\d+)?)/i);
  if (monthlyLimitMatch) {
    return {
      action: 'set_monthly_limit',
      amount: null,
      recipient: null,
      limit: parseFloat(monthlyLimitMatch[1]),
      contractAction: 'set_monthly_limit'
    };
  }
  
  // Set limit commands - more variations (fallback for generic limits)
  const limitMatch = cmd.match(/(?:set|create|establish).*?(?:limit|max).*?(\d+(?:\.\d+)?)/i) ||
                    cmd.match(/(?:limit|max).*?(?:set|to).*?(\d+(?:\.\d+)?)/i) ||
                    cmd.match(/spending.*?limit.*?(\d+(?:\.\d+)?)/i);
  
  if (limitMatch) {
    return {
      action: 'set_limit',
      amount: null,
      recipient: null,
      limit: parseFloat(limitMatch[1])
    };
  }
  
  // Check limit commands - more variations
  if (
    (cmd.includes('limit') && (cmd.includes('check') || cmd.includes('what') || cmd.includes('current') || cmd.includes('show'))) ||
    cmd.includes('spending limit') ||
    cmd.includes('my limit') ||
    cmd.match(/^(what|show|check).*(limit|max)/i)
  ) {
    return { action: 'check_limit', amount: null, recipient: null, limit: null };
  }
  

  
  // Freeze wallet: "freeze my wallet" or "emergency freeze" or just "freeze"
  if ((cmd.includes('freeze') && !cmd.includes('unfreeze')) || cmd === 'freeze') {
    return {
      action: 'freeze_wallet',
      amount: null,
      recipient: null,
      limit: null,
      contractAction: 'freeze_wallet'
    };
  }
  
  // Unfreeze wallet: "unfreeze my wallet" or "unfreeze"
  if (cmd.includes('unfreeze')) {
    return {
      action: 'unfreeze_wallet',
      amount: null,
      recipient: null,
      limit: null,
      contractAction: 'unfreeze_wallet'
    };
  }
  
  // Check spending info: "check my spending" or "show spending limits" or "status"
  if (cmd.match(/^(check|show|get).*(spending|limits)/i) || 
      cmd === 'status' || 
      cmd.includes('wallet status') ||
      cmd.includes('spending status')) {
    return {
      action: 'get_spending_info',
      amount: null,
      recipient: null,
      limit: null,
      contractAction: 'get_spending_info'
    };
  }
  
  // Add trusted contact: "add Alice as trusted contact" or "make Alice trusted"
  const trustedContactMatch = cmd.match(/(?:add|make)\s+([a-z0-9\s]+)\s+as\s+trusted/i) ||
                              cmd.match(/make\s+([a-z0-9\s]+)\s+trusted/i);
  if (trustedContactMatch) {
    return {
      action: 'set_contact_trusted',
      amount: null,
      recipient: null,
      limit: null,
      contactName: trustedContactMatch[1].trim(),
      contractAction: 'set_contact_trusted'
    };
  }
  
  // Reset spending: "reset my spending limits"
  if (cmd.match(/reset.*(spending|limits)/i)) {
    return {
      action: 'reset_spending_limits',
      amount: null,
      recipient: null,
      limit: null,
      contractAction: 'reset_spending_limits'
    };
  }
  
  // Get analytics: "show my spending analytics"
  if (cmd.match(/^(show|get).*(analytics|stats|spending.*data)/i)) {
    return {
      action: 'get_spending_analytics',
      amount: null,
      recipient: null,
      limit: null,
      contractAction: 'get_spending_analytics'
    };
  }

  // === MULTI-ASSET COMMANDS ===
  
  // Portfolio commands: "show my portfolio" or "portfolio" or "assets"
  if (cmd.match(/^(show|get|display).*(portfolio|assets)/i) || 
      cmd === 'portfolio' || 
      cmd === 'assets' ||
      cmd.includes('my portfolio') ||
      cmd.includes('my assets')) {
    return {
      action: 'get_portfolio',
      amount: null,
      recipient: null,
      limit: null
    };
  }
  
  // Calculate swap: "calculate swap 100 XLM to USDC" or "how much USDC for 100 XLM" (check BEFORE swap commands)
  if (cmd.includes('calculate') || cmd.includes('estimate') || (cmd.includes('how much') && !cmd.includes('balance'))) {
    const calcMatch = cmd.match(/(?:calculate|estimate|how much)\s+(?:swap\s+)?(\d+(?:\.\d+)?)\s+([a-z]+)\s+(?:to|for|into)\s+([a-z]+)/i) ||
                     cmd.match(/how much\s+([a-z]+)\s+(?:for|from)\s+(\d+(?:\.\d+)?)\s+([a-z]+)/i);
    if (calcMatch) {
      if (cmd.includes('how much') && calcMatch.length === 4) {
        // "how much USDC for 100 XLM" format
        return {
          action: 'calculate_swap',
          amount: parseFloat(calcMatch[2]),
          recipient: null,
          limit: null,
          fromAsset: calcMatch[3].toUpperCase(),
          toAsset: calcMatch[1].toUpperCase()
        };
      } else {
        // "calculate swap 100 XLM to USDC" format
        return {
          action: 'calculate_swap',
          amount: parseFloat(calcMatch[1]),
          recipient: null,
          limit: null,
          fromAsset: calcMatch[2].toUpperCase(),
          toAsset: calcMatch[3].toUpperCase()
        };
      }
    }
  }

  // Swap commands: "swap 100 XLM to USDC" or "convert 50 USDC to XLM"
  const swapMatch = cmd.match(/(?:swap|convert|exchange)\s+(\d+(?:\.\d+)?)\s+([a-z]+)\s+(?:to|for|into)\s+([a-z]+)/i);
  if (swapMatch) {
    return {
      action: 'swap_tokens',
      amount: parseFloat(swapMatch[1]),
      recipient: null,
      limit: null,
      fromAsset: swapMatch[2].toUpperCase(),
      toAsset: swapMatch[3].toUpperCase()
    };
  }
  
  // Asset price commands: "price of USDC" or "what's the price of XLM"
  const priceMatch = cmd.match(/(?:price|cost|value)\s+(?:of\s+)?([a-z]+)/i) ||
                    cmd.match(/what.*(?:price|cost|value).*([a-z]+)/i);
  if (priceMatch || cmd.includes('prices') || cmd.includes('price')) {
    return {
      action: 'get_asset_prices',
      amount: null,
      recipient: null,
      limit: null,
      assetCode: priceMatch ? priceMatch[1].toUpperCase() : null
    };
  }
  
  // Swap history: "swap history" or "show my swaps"
  if (cmd.match(/^(show|get|display).*(swap|exchange).*history/i) || 
      cmd.includes('swap history') ||
      cmd.includes('my swaps') ||
      cmd === 'swaps') {
    return {
      action: 'get_swap_history',
      amount: null,
      recipient: null,
      limit: null
    };
  }

  // Check trustlines: "check trustlines" or "show trustlines" or "my trustlines"
  if (cmd.match(/^(check|show|get|display).*(trustline|trust)/i) || 
      cmd.includes('trustlines') ||
      cmd.includes('my trustlines') ||
      cmd === 'trustlines') {
    return {
      action: 'check_trustlines',
      amount: null,
      recipient: null,
      limit: null
    };
  }
  

  
  // If nothing matches, provide helpful error with suggestions
  console.log('Unrecognized command:', cmd);
  
  // Provide specific suggestions based on what they might have meant
  let suggestions = [];
  
  if (cmd.includes('send') || cmd.includes('transfer') || cmd.includes('pay')) {
    suggestions.push('💡 For sending: "Send 10 XLM to GXXX..." (use XLM not XML)');
    suggestions.push('💡 To contacts: "Send 5 XLM to Alice" (save contacts first)');
  }
  
  if (cmd.includes('save') || cmd.includes('contact')) {
    suggestions.push('💡 Local contacts: "Save GXXX as Alice"');
    suggestions.push('💡 Smart contract: "Save GXXX as Alice to contract"');
    suggestions.push('💡 Make trusted: "Make Alice trusted"');
  }
  
  if (cmd.includes('freeze') || cmd.includes('limit') || cmd.includes('status')) {
    suggestions.push('💡 Security: "Freeze" or "Unfreeze"');
    suggestions.push('💡 Limits: "Daily limit 500" or "Set daily limit to 500 XLM"');
    suggestions.push('💡 Status: "Status" or "Check spending limits"');
  }
  
  if (cmd.includes('limit')) {
    suggestions.push('💡 For limits: "Set daily limit to 500 XLM"');
  }
  
  if (cmd.includes('freeze')) {
    suggestions.push('💡 For security: "Freeze my wallet"');
  }
  
  if (suggestions.length === 0) {
    suggestions = [
      '💰 "What\'s my balance?"',
      '📤 "Send 10 XLM to GXXX..."',
      '👥 "Save GXXX as Alice" (local)',
      '🔗 "Save GXXX as Alice to contract" (blockchain)',
      '🔒 "Set daily limit to 500 XLM"',
      '🚨 "Freeze my wallet"',
      '📋 "List contacts" or "List contact"'
    ];
  }
  
  throw new Error(`Command not recognized: "${command}"\n\nTry these commands:\n${suggestions.join('\n')}`);
}

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    // Try AI first, fallback to simple parser
    try {
      const prompt = `You are a crypto wallet AI assistant. Parse this natural language command and return ONLY valid JSON.

Command: "${command}"

Return format (must be valid JSON):
{
  "action": "send" | "balance" | "history" | "set_limit" | "check_limit" | "save_contact" | "save_contact_to_contract" | "list_contacts" | "list_contract_contacts" | "send_to_contact" | "set_daily_limit" | "set_monthly_limit" | "freeze_wallet" | "unfreeze_wallet" | "get_spending_info" | "reset_spending_limits" | "get_spending_analytics" | "set_contact_trusted" | "get_portfolio" | "swap_tokens" | "get_asset_prices" | "get_swap_history" | "calculate_swap",
  "amount": number or null,
  "recipient": "full stellar address starting with G" or null,
  "limit": number or null,
  "contactName": "contact name" or null,
  "contractAction": "smart contract function name" or null,
  "fromAsset": "asset code like XLM, USDC" or null,
  "toAsset": "asset code like XLM, USDC" or null,
  "assetCode": "single asset code" or null
}

Rules:
- For send: extract amount and recipient address
- For balance: just check balance
- For history: show transaction history
- Recipient must be a full Stellar address (starts with G, 56 chars)
- Only return the JSON object, no markdown, no explanation

Examples:
"Send 10 XLM to GXXXXXXXXX" -> {"action":"send","amount":10,"recipient":"GXXXXXXXXX","limit":null,"contactName":null}
"What's my balance?" -> {"action":"balance","amount":null,"recipient":null,"limit":null,"contactName":null}
"Save GXXX as John" -> {"action":"save_contact","amount":null,"recipient":"GXXX","limit":null,"contactName":"John"}
"Send 5 XLM to John" -> {"action":"send_to_contact","amount":5,"recipient":null,"limit":null,"contactName":"John"}
"List contacts" -> {"action":"list_contacts","amount":null,"recipient":null,"limit":null,"contactName":null}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // Remove markdown code blocks if present
      const jsonText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(jsonText);

      if (!parsed.action) {
        throw new Error("Invalid command format");
      }

      return NextResponse.json(parsed);
    } catch (aiError) {
      console.log("AI parsing failed, using fallback parser:", aiError);
      
      // Use fallback parser
      const parsed = parseCommandFallback(command);
      return NextResponse.json(parsed);
    }
  } catch (error: any) {
    console.error("Parsing error:", error);
    return NextResponse.json(
      { error: 'Could not understand command. Try: "What\'s my balance?" or "Send 10 XLM to GXXX..."' },
      { status: 400 }
    );
  }
}
