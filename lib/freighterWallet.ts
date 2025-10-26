import {
  isConnected,
  getAddress,
  requestAccess,
  setAllowed,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';

export async function connectWallet(): Promise<string | null> {
  try {
    console.log('Attempting to connect wallet...');

    // First, request access/permission
    try {
      console.log('Requesting wallet access...');
      await requestAccess();
      console.log('Access granted');
    } catch (accessError) {
      console.log('requestAccess not available or failed, trying setAllowed...');
      try {
        await setAllowed();
      } catch (setAllowedError) {
        console.log('setAllowed also failed, continuing anyway...');
      }
    }

    // Now get the public key
    const addressResult = await getAddress();
    console.log('Wallet connection result:', addressResult);

    // Extract the address from the result
    let publicKey: string | null = null;
    if (typeof addressResult === 'string') {
      publicKey = addressResult;
    } else if (addressResult && typeof addressResult === 'object' && 'address' in addressResult) {
      publicKey = addressResult.address;
    }

    if (!publicKey || publicKey === '') {
      console.error('No public key returned from wallet');
      alert('No address returned from wallet.\n\nPlease:\n1. Open Freighter extension\n2. Make sure you have an account created\n3. Make sure the account is unlocked\n4. Try connecting again');
      return null;
    }

    console.log('Successfully connected to wallet:', publicKey);
    return publicKey;
  } catch (error) {
    console.error('Wallet connection error:', error);
    alert(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}\n\nMake sure Freighter is installed and unlocked.`);
    return null;
  }
}

export async function signTransaction(xdr: string, networkPassphrase: string): Promise<string> {
  try {
    console.log('🔏 Signing transaction...');

    const result = await freighterSignTransaction(xdr, {
      networkPassphrase,
    });

    console.log('🔏 Sign result:', result);

    if (!result) {
      throw new Error('No result from Freighter');
    }

    if (result.error) {
      throw new Error(result.error);
    }

    if (!result.signedTxXdr) {
      throw new Error('No signed transaction returned from Freighter');
    }

    console.log('✅ Transaction signed successfully');
    return result.signedTxXdr;
  } catch (error) {
    console.error('❌ Transaction signing error:', error);
    throw error;
  }
}

export async function isWalletInstalled(): Promise<boolean> {
  try {
    console.log('Checking if wallet is installed...');
    const result = await isConnected();
    console.log('Wallet installed:', result);

    // Handle the result which can be a boolean or an object
    if (typeof result === 'boolean') {
      return result;
    } else if (result && typeof result === 'object' && 'isConnected' in result) {
      return result.isConnected;
    }

    return false;
  } catch (error) {
    console.error('Error checking wallet installation:', error);
    return false;
  }
}

// Utility functions
export const detectFreighterInstallation = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).freighter
}

export const getFreighterInstallUrl = (): string => {
  return 'https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk'
}