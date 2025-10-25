import { NextRequest, NextResponse } from 'next/server';

// Simulated smart contract storage (in production, this would be on Stellar blockchain)
const smartContractStorage = new Map();

function getStorageKey(publicKey: string, dataType: string) {
  return `${publicKey}_${dataType}`;
}

function getSpendingData(publicKey: string) {
  const key = getStorageKey(publicKey, 'spending');
  return smartContractStorage.get(key) || {
    dailyLimit: 1000,
    monthlyLimit: 10000,
    dailySpent: 0,
    monthlySpent: 0,
    dayStart: Date.now(),
    monthStart: Date.now(),
    isFrozen: false
  };
}

function setSpendingData(publicKey: string, data: any) {
  const key = getStorageKey(publicKey, 'spending');
  smartContractStorage.set(key, data);
}

// Helper function to handle time-based spending resets
function resetSpendingIfNeeded(spendingData: any) {
  const currentTime = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const ONE_MONTH = 30 * ONE_DAY;
  
  // Reset daily spending if new day
  if (currentTime - spendingData.dayStart > ONE_DAY) {
    spendingData.dailySpent = 0;
    spendingData.dayStart = currentTime;
  }
  
  // Reset monthly spending if new month
  if (currentTime - spendingData.monthStart > ONE_MONTH) {
    spendingData.monthlySpent = 0;
    spendingData.monthStart = currentTime;
  }
  
  return spendingData;
}

function getWalletSettings(publicKey: string) {
  const key = getStorageKey(publicKey, 'settings');
  return smartContractStorage.get(key) || {
    autoApproveTrusted: false,
    requireMemo: false,
    maxTxAmount: 1000,
    emergencyContact: publicKey
  };
}

function setWalletSettings(publicKey: string, settings: any) {
  const key = getStorageKey(publicKey, 'settings');
  smartContractStorage.set(key, settings);
}

export async function POST(request: NextRequest) {
  try {
    const { 
      action, 
      publicKey, 
      secretKey, 
      dailyLimit, 
      monthlyLimit, 
      amount, 
      contactName, 
      contactAddress, 
      isTrusted,
      memo,
      emergencyContact,
      settings 
    } = await request.json();
    
    if (!publicKey) {
      throw new Error('Public key is required');
    }

    // Simulate smart contract operations
    let responseData: any = {
      success: true,
      action: action,
      smartContract: 'simulated'
    };
    
    switch (action) {
      // === SPENDING LIMITS ===
      case 'set_daily_limit':
        if (!dailyLimit) throw new Error('Daily limit is required');
        
        const currentData = getSpendingData(publicKey);
        currentData.dailyLimit = dailyLimit;
        setSpendingData(publicKey, currentData);
        
        responseData.message = `Daily spending limit set to ${dailyLimit} XLM`;
        responseData.dailyLimit = dailyLimit;
        break;
        
      case 'set_monthly_limit':
        if (!monthlyLimit) throw new Error('Monthly limit is required');
        
        const monthlyData = getSpendingData(publicKey);
        monthlyData.monthlyLimit = monthlyLimit;
        setSpendingData(publicKey, monthlyData);
        
        responseData.message = `Monthly spending limit set to ${monthlyLimit} XLM`;
        responseData.monthlyLimit = monthlyLimit;
        break;
        
      case 'can_spend':
        if (!amount) throw new Error('Amount is required');
        
        const spendData = resetSpendingIfNeeded(getSpendingData(publicKey));
        
        const canSpend = !spendData.isFrozen && 
                        (spendData.dailySpent + amount <= spendData.dailyLimit) &&
                        (spendData.monthlySpent + amount <= spendData.monthlyLimit);
        
        if (canSpend) {
          spendData.dailySpent += amount;
          spendData.monthlySpent += amount;
          setSpendingData(publicKey, spendData);
        }
        
        responseData.canSpend = canSpend;
        responseData.message = canSpend ? 'Transaction allowed' : 'Transaction exceeds limits or wallet is frozen';
        break;
        
      case 'get_spending_info':
        const info = getSpendingData(publicKey);
        responseData.spendingInfo = {
          dailyLimit: info.dailyLimit,
          dailySpent: info.dailySpent,
          monthlyLimit: info.monthlyLimit,
          monthlySpent: info.monthlySpent,
          isFrozen: info.isFrozen
        };
        responseData.message = 'Spending info retrieved';
        break;
        
      // === EMERGENCY CONTROLS ===
      case 'freeze_wallet':
        const freezeData = getSpendingData(publicKey);
        freezeData.isFrozen = true;
        setSpendingData(publicKey, freezeData);
        
        responseData.message = 'Wallet has been frozen for security';
        responseData.isFrozen = true;
        break;
        
      case 'unfreeze_wallet':
        const unfreezeData = getSpendingData(publicKey);
        unfreezeData.isFrozen = false;
        setSpendingData(publicKey, unfreezeData);
        
        responseData.message = 'Wallet has been unfrozen';
        responseData.isFrozen = false;
        break;
        
      case 'emergency_freeze':
        if (!emergencyContact) throw new Error('Emergency contact is required');
        
        const emergencyData = getSpendingData(publicKey);
        const walletSettings = getWalletSettings(publicKey);
        
        if (walletSettings.emergencyContact === emergencyContact) {
          emergencyData.isFrozen = true;
          setSpendingData(publicKey, emergencyData);
          responseData.message = 'Wallet frozen by emergency contact';
        } else {
          throw new Error('Unauthorized emergency contact');
        }
        break;
        
      // === CONTACT MANAGEMENT ===
      case 'add_contact':
        if (!contactName || !contactAddress) throw new Error('Contact name and address are required');
        
        const contactKey = getStorageKey(publicKey, `contact_${contactName}`);
        smartContractStorage.set(contactKey, {
          name: contactName,
          address: contactAddress,
          isTrusted: isTrusted || false
        });
        
        responseData.message = `Contact "${contactName}" added successfully`;
        break;
        
      case 'remove_contact':
        if (!contactName) throw new Error('Contact name is required');
        
        const removeKey = getStorageKey(publicKey, `contact_${contactName}`);
        smartContractStorage.delete(removeKey);
        
        responseData.message = `Contact "${contactName}" removed`;
        break;
        
      case 'set_contact_trusted':
        if (!contactName) throw new Error('Contact name is required');
        
        const trustKey = getStorageKey(publicKey, `contact_${contactName}`);
        const existingContact = smartContractStorage.get(trustKey);
        
        if (!existingContact) {
          throw new Error(`Contact "${contactName}" not found`);
        }
        
        existingContact.isTrusted = isTrusted !== false; // Default to true
        smartContractStorage.set(trustKey, existingContact);
        
        responseData.message = `Contact "${contactName}" trust status updated`;
        responseData.isTrusted = existingContact.isTrusted;
        break;
        
      case 'get_contact':
        if (!contactName) throw new Error('Contact name is required');
        
        const getKey = getStorageKey(publicKey, `contact_${contactName}`);
        const contact = smartContractStorage.get(getKey);
        
        if (!contact) {
          throw new Error(`Contact "${contactName}" not found`);
        }
        
        responseData.contact = contact;
        responseData.message = 'Contact retrieved';
        break;
        
      // === TRANSACTION LOGGING ===
      case 'log_transaction':
        if (!contactAddress || !amount) throw new Error('Recipient and amount are required');
        
        const txKey = getStorageKey(publicKey, 'transactions');
        const transactions = smartContractStorage.get(txKey) || [];
        
        transactions.push({
          from: publicKey,
          to: contactAddress,
          amount: amount,
          timestamp: Date.now(),
          type: 'send',
          memo: memo || ''
        });
        
        smartContractStorage.set(txKey, transactions);
        responseData.message = 'Transaction logged to smart contract';
        break;
        
      case 'get_transaction_history':
        const historyKey = getStorageKey(publicKey, 'transactions');
        const history = smartContractStorage.get(historyKey) || [];
        
        responseData.transactions = history.slice(-10); // Last 10 transactions
        responseData.message = 'Transaction history retrieved';
        break;
        
      // === WALLET SETTINGS ===
      case 'set_wallet_settings':
        if (!settings) throw new Error('Settings are required');
        
        setWalletSettings(publicKey, {
          autoApproveTrusted: settings.autoApproveTrusted || false,
          requireMemo: settings.requireMemo || false,
          maxTxAmount: settings.maxTxAmount || 1000,
          emergencyContact: settings.emergencyContact || publicKey
        });
        
        responseData.message = 'Wallet settings updated';
        break;
        
      case 'get_wallet_settings':
        const currentSettings = getWalletSettings(publicKey);
        responseData.settings = currentSettings;
        responseData.message = 'Wallet settings retrieved';
        break;
        
      // === VALIDATION ===
      case 'validate_transaction':
        if (!contactAddress || !amount) throw new Error('Recipient and amount are required');
        
        const validateData = getSpendingData(publicKey);
        const validateSettings = getWalletSettings(publicKey);
        
        let isValid = true;
        let validationErrors = [];
        
        // Check if wallet is frozen
        if (validateData.isFrozen) {
          isValid = false;
          validationErrors.push('Wallet is frozen');
        }
        
        // Check max transaction amount
        if (amount > validateSettings.maxTxAmount) {
          isValid = false;
          validationErrors.push(`Amount exceeds max transaction limit of ${validateSettings.maxTxAmount} XLM`);
        }
        
        // Check spending limits using the helper function
        resetSpendingIfNeeded(validateData);
        
        // Check daily limit
        if (validateData.dailySpent + amount > validateData.dailyLimit) {
          isValid = false;
          validationErrors.push(`Amount ${amount} XLM exceeds daily spending limit. Daily spent: ${validateData.dailySpent}/${validateData.dailyLimit} XLM`);
        }
        
        // Check monthly limit
        if (validateData.monthlySpent + amount > validateData.monthlyLimit) {
          isValid = false;
          validationErrors.push(`Amount ${amount} XLM exceeds monthly spending limit. Monthly spent: ${validateData.monthlySpent}/${validateData.monthlyLimit} XLM`);
        }
        
        // IMPORTANT: Only update spending if validation passes
        if (isValid) {
          validateData.dailySpent += amount;
          validateData.monthlySpent += amount;
        }
        
        // Save the updated spending data (with reset times and potentially updated spending)
        setSpendingData(publicKey, validateData);
        
        responseData.isValid = isValid;
        responseData.errors = validationErrors;
        responseData.message = isValid ? 'Transaction validation passed' : 'Transaction validation failed';
        break;
        
      // === ANALYTICS ===
      case 'get_spending_analytics':
        const analyticsData = getSpendingData(publicKey);
        const analyticsHistory = smartContractStorage.get(getStorageKey(publicKey, 'transactions')) || [];
        
        responseData.analytics = {
          dailySpent: analyticsData.dailySpent,
          monthlySpent: analyticsData.monthlySpent,
          totalTransactions: analyticsHistory.length,
          dailyLimit: analyticsData.dailyLimit,
          monthlyLimit: analyticsData.monthlyLimit
        };
        responseData.message = 'Analytics retrieved';
        break;
        
      case 'reset_spending_limits':
        const resetData = getSpendingData(publicKey);
        resetData.dailySpent = 0;
        resetData.monthlySpent = 0;
        resetData.dayStart = Date.now();
        resetData.monthStart = Date.now();
        setSpendingData(publicKey, resetData);
        
        responseData.message = 'Spending limits reset successfully';
        break;
        
      default:
        throw new Error(`Invalid action: ${action}`);
    }
    
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('Smart contract error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Smart contract operation failed'
      },
      { status: 500 }
    );
  }
}