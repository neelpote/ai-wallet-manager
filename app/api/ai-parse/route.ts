import { NextRequest, NextResponse } from "next/server";

// Clean, reliable command parser — no false positives
function parseCommand(command: string) {
  const raw = command.trim();
  const cmd = raw.toLowerCase();

  // ── Greetings ──────────────────────────────────────────────────────────────
  if (/^(hi+|hey+|hello+|howdy|sup|yo|hiya|greetings|good (morning|evening|afternoon))[\s!?.]*$/i.test(cmd)) {
    return { action: 'greeting', confidence: 1.0 };
  }

  // ── Help ───────────────────────────────────────────────────────────────────
  if (/^(help|what can you do|commands?|options|menu|what do you do)[\s!?.]*$/i.test(cmd)) {
    return { action: 'help', confidence: 1.0 };
  }

  // ── Balance ────────────────────────────────────────────────────────────────
  if (/balance|how much (do i have|xlm|money)|what('?s| is) my (balance|xlm|funds?)|check (my )?balance|show (my )?balance/.test(cmd)) {
    return { action: 'balance', confidence: 1.0 };
  }

  // ── Portfolio ──────────────────────────────────────────────────────────────
  if (/portfolio|my assets|all (my )?assets|holdings|what (do i own|assets)/.test(cmd)) {
    return { action: 'get_portfolio', confidence: 1.0 };
  }

  // ── Transaction history ────────────────────────────────────────────────────
  if (/history|transactions?|recent (transactions?|activity)|show (my )?(transactions?|history)/.test(cmd)) {
    return { action: 'history', confidence: 1.0 };
  }

  // ── Swap history ───────────────────────────────────────────────────────────
  if (/swap (history|log)|my swaps?|recent swaps?/.test(cmd)) {
    return { action: 'get_swap_history', confidence: 1.0 };
  }

  // ── Asset prices ───────────────────────────────────────────────────────────
  if (/price|rates?|current (price|rate)|how much is (xlm|usdc|eurc)|asset prices?/.test(cmd)) {
    return { action: 'get_asset_prices', confidence: 1.0 };
  }

  // ── Trustlines ─────────────────────────────────────────────────────────────
  if (/trustlines?|check trustlines?|my trustlines?/.test(cmd)) {
    return { action: 'check_trustlines', confidence: 1.0 };
  }

  // ── Freeze wallet ──────────────────────────────────────────────────────────
  if (/freeze (my )?(wallet|account)|lock (everything|my wallet|my account|it all down)|emergency (freeze|lock)|lock everything/.test(cmd)) {
    return { action: 'freeze_wallet', confidence: 1.0, requiresConfirmation: true };
  }

  // ── Unfreeze wallet ────────────────────────────────────────────────────────
  if (/unfreeze (my )?(wallet|account)|unlock (my )?(wallet|account)/.test(cmd)) {
    return { action: 'unfreeze_wallet', confidence: 1.0, requiresConfirmation: true };
  }

  // ── Spending info / status ─────────────────────────────────────────────────
  if (/spending (info|limits?|status)|check (spending|limits?)|status|wallet status|security status/.test(cmd)) {
    return { action: 'get_spending_info', confidence: 1.0 };
  }

  // ── Set daily limit ────────────────────────────────────────────────────────
  const dailyLimitMatch = cmd.match(/set (daily|day) limit (to )?(\d+(\.\d+)?)|daily limit (\d+(\.\d+)?)/);
  if (dailyLimitMatch) {
    const limit = parseFloat(dailyLimitMatch[3] || dailyLimitMatch[5]);
    return { action: 'set_daily_limit', limit, confidence: 1.0 };
  }

  // ── Set monthly limit ──────────────────────────────────────────────────────
  const monthlyLimitMatch = cmd.match(/set (monthly|month) limit (to )?(\d+(\.\d+)?)|monthly limit (\d+(\.\d+)?)/);
  if (monthlyLimitMatch) {
    const limit = parseFloat(monthlyLimitMatch[3] || monthlyLimitMatch[5]);
    return { action: 'set_monthly_limit', limit, confidence: 1.0 };
  }

  // ── Calculate swap ─────────────────────────────────────────────────────────
  const calcSwapMatch = cmd.match(/calc(ulate)? swap (\d+(\.\d+)?) (xlm|usdc|eurc|aqua|ybx) (to|for|into) (xlm|usdc|eurc|aqua|ybx)/i);
  if (calcSwapMatch) {
    return {
      action: 'calculate_swap',
      amount: parseFloat(calcSwapMatch[2]),
      fromAsset: calcSwapMatch[4].toUpperCase(),
      toAsset: calcSwapMatch[6].toUpperCase(),
      confidence: 1.0
    };
  }

  // ── Swap tokens ────────────────────────────────────────────────────────────
  const swapMatch = cmd.match(/(swap|trade|convert|exchange) (\d+(\.\d+)?) (xlm|usdc|eurc|aqua|ybx) (to|for|into) (xlm|usdc|eurc|aqua|ybx)/i);
  if (swapMatch) {
    return {
      action: 'swap_tokens',
      amount: parseFloat(swapMatch[2]),
      fromAsset: swapMatch[4].toUpperCase(),
      toAsset: swapMatch[6].toUpperCase(),
      confidence: 1.0,
      requiresConfirmation: true
    };
  }

  // ── Send to contact (name) ─────────────────────────────────────────────────
  const sendContactMatch = cmd.match(/send (\d+(\.\d+)?) (xlm|usdc|eurc)? ?(to|for) ([a-z][a-z0-9 ]{1,20})$/i);
  if (sendContactMatch && !/^g[a-z0-9]{54}$/i.test(sendContactMatch[5].trim())) {
    return {
      action: 'send_to_contact',
      amount: parseFloat(sendContactMatch[1]),
      fromAsset: (sendContactMatch[3] || 'XLM').toUpperCase(),
      contactName: sendContactMatch[5].trim().toLowerCase(),
      confidence: 1.0,
      requiresConfirmation: true
    };
  }

  // ── Send to address ────────────────────────────────────────────────────────
  const sendMatch = cmd.match(/send (\d+(\.\d+)?) (xlm|usdc|eurc)? ?(to )?(g[a-z0-9]{54})/i);
  if (sendMatch) {
    return {
      action: 'send',
      amount: parseFloat(sendMatch[1]),
      fromAsset: (sendMatch[3] || 'XLM').toUpperCase(),
      recipient: sendMatch[5],
      confidence: 1.0,
      requiresConfirmation: true
    };
  }

  // ── Save contact to contract ───────────────────────────────────────────────
  const saveContractMatch = cmd.match(/save (g[a-z0-9]{54}) as ([a-z][a-z0-9 ]+) (to contract|on blockchain|on chain)/i);
  if (saveContractMatch) {
    return {
      action: 'save_contact_to_contract',
      recipient: saveContractMatch[1],
      contactName: saveContractMatch[2].trim().toLowerCase(),
      confidence: 1.0
    };
  }

  // ── Save contact locally ───────────────────────────────────────────────────
  const saveContactMatch = cmd.match(/save (g[a-z0-9]{54}) as ([a-z][a-z0-9 ]+)/i);
  if (saveContactMatch) {
    return {
      action: 'save_contact',
      recipient: saveContactMatch[1],
      contactName: saveContactMatch[2].trim().toLowerCase(),
      confidence: 1.0
    };
  }

  // ── List contacts ──────────────────────────────────────────────────────────
  if (/list contacts?|show contacts?|my contacts?|view contacts?/.test(cmd)) {
    return { action: 'list_contacts', confidence: 1.0 };
  }

  // ── Nothing matched ────────────────────────────────────────────────────────
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    const parsed = parseCommand(command);

    if (parsed) {
      return NextResponse.json(parsed);
    }

    // Nothing matched — return a helpful error
    return NextResponse.json(
      {
        error: `I didn't understand "${command}"`,
        suggestions: [
          '"What\'s my balance?"',
          '"Show my portfolio"',
          '"Swap 10 XLM to USDC"',
          '"Send 5 XLM to G..."',
          '"Freeze my wallet"',
          '"Set daily limit to 500 XLM"',
          '"List contacts"',
          '"Help"'
        ]
      },
      { status: 400 }
    );

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Parse error' }, { status: 500 });
  }
}
