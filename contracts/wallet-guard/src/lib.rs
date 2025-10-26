#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SpendingInfo {
    pub daily_limit: i128,
    pub monthly_limit: i128,
    pub daily_spent: i128,
    pub monthly_spent: i128,
    pub is_frozen: bool,
}

const SPENDING_INFO: Symbol = symbol_short!("SPENDING");

#[contract]
pub struct WalletGuard;

#[contractimpl]
impl WalletGuard {
    /// Initialize wallet with default settings
    pub fn initialize(env: Env, owner: Address) {
        owner.require_auth();
        
        let default_spending = SpendingInfo {
            daily_limit: 1000_0000000, // 1000 XLM
            monthly_limit: 10000_0000000, // 10000 XLM
            daily_spent: 0,
            monthly_spent: 0,
            is_frozen: false,
        };
        
        env.storage().instance().set(&(SPENDING_INFO, owner), &default_spending);
    }
    
    /// Set daily spending limit
    pub fn set_daily_limit(env: Env, owner: Address, limit: i128) {
        owner.require_auth();
        
        let mut spending_info: SpendingInfo = env.storage()
            .instance()
            .get(&(SPENDING_INFO, owner.clone()))
            .unwrap_or(SpendingInfo {
                daily_limit: 1000_0000000,
                monthly_limit: 10000_0000000,
                daily_spent: 0,
                monthly_spent: 0,
                is_frozen: false,
            });
            
        spending_info.daily_limit = limit;
        env.storage().instance().set(&(SPENDING_INFO, owner), &spending_info);
    }
    
    /// Set monthly spending limit
    pub fn set_monthly_limit(env: Env, owner: Address, limit: i128) {
        owner.require_auth();
        
        let mut spending_info: SpendingInfo = env.storage()
            .instance()
            .get(&(SPENDING_INFO, owner.clone()))
            .unwrap_or(SpendingInfo {
                daily_limit: 1000_0000000,
                monthly_limit: 10000_0000000,
                daily_spent: 0,
                monthly_spent: 0,
                is_frozen: false,
            });
            
        spending_info.monthly_limit = limit;
        env.storage().instance().set(&(SPENDING_INFO, owner), &spending_info);
    }
    
    /// Freeze wallet
    pub fn freeze_wallet(env: Env, owner: Address) {
        owner.require_auth();
        
        let mut spending_info: SpendingInfo = env.storage()
            .instance()
            .get(&(SPENDING_INFO, owner.clone()))
            .unwrap_or(SpendingInfo {
                daily_limit: 1000_0000000,
                monthly_limit: 10000_0000000,
                daily_spent: 0,
                monthly_spent: 0,
                is_frozen: false,
            });
            
        spending_info.is_frozen = true;
        env.storage().instance().set(&(SPENDING_INFO, owner), &spending_info);
    }
    
    /// Unfreeze wallet
    pub fn unfreeze_wallet(env: Env, owner: Address) {
        owner.require_auth();
        
        let mut spending_info: SpendingInfo = env.storage()
            .instance()
            .get(&(SPENDING_INFO, owner.clone()))
            .unwrap_or(SpendingInfo {
                daily_limit: 1000_0000000,
                monthly_limit: 10000_0000000,
                daily_spent: 0,
                monthly_spent: 0,
                is_frozen: false,
            });
            
        spending_info.is_frozen = false;
        env.storage().instance().set(&(SPENDING_INFO, owner), &spending_info);
    }
    
    /// Validate transaction
    pub fn validate_transaction(env: Env, owner: Address, amount: i128) -> bool {
        let spending_info: SpendingInfo = env.storage()
            .instance()
            .get(&(SPENDING_INFO, owner))
            .unwrap_or(SpendingInfo {
                daily_limit: 1000_0000000,
                monthly_limit: 10000_0000000,
                daily_spent: 0,
                monthly_spent: 0,
                is_frozen: false,
            });
            
        if spending_info.is_frozen {
            return false;
        }
        
        if spending_info.daily_spent + amount > spending_info.daily_limit {
            return false;
        }
        
        if spending_info.monthly_spent + amount > spending_info.monthly_limit {
            return false;
        }
        
        true
    }
    
    /// Get spending information
    pub fn get_spending_info(env: Env, owner: Address) -> SpendingInfo {
        env.storage()
            .instance()
            .get(&(SPENDING_INFO, owner))
            .unwrap_or(SpendingInfo {
                daily_limit: 1000_0000000,
                monthly_limit: 10000_0000000,
                daily_spent: 0,
                monthly_spent: 0,
                is_frozen: false,
            })
    }
}