#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, String, Symbol, Vec,
};

#[derive(Clone)]
#[contracttype]
pub struct Asset {
    pub code: String,
    pub issuer: Address,
    pub balance: i128,
    pub price_xlm: i128, // Price in stroops per unit
}

#[derive(Clone)]
#[contracttype]
pub struct SwapOrder {
    pub id: u64,
    pub owner: Address,
    pub from_asset: String,
    pub to_asset: String,
    pub amount: i128,
    pub min_receive: i128,
    pub timestamp: u64,
    pub status: String, // "pending", "completed", "cancelled"
}

#[derive(Clone)]
#[contracttype]
pub struct Portfolio {
    pub owner: Address,
    pub assets: Map<String, Asset>,
    pub total_value_xlm: i128,
    pub last_updated: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct SwapPool {
    pub asset_a: String,
    pub asset_b: String,
    pub reserve_a: i128,
    pub reserve_b: i128,
    pub fee_rate: u32, // Basis points (100 = 1%)
}

const ADMIN: Symbol = symbol_short!("ADMIN");
const PORTFOLIOS: Symbol = symbol_short!("PORTFOLIOS");
const SWAP_ORDERS: Symbol = symbol_short!("ORDERS");
const SWAP_POOLS: Symbol = symbol_short!("POOLS");
const ORDER_COUNTER: Symbol = symbol_short!("COUNTER");

#[contract]
pub struct MultiAssetManager;

#[contractimpl]
impl MultiAssetManager {
    /// Initialize the contract with admin
    pub fn initialize(env: Env, admin: Address) {
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&ORDER_COUNTER, &0u64);
    }

    /// Add a new supported asset
    pub fn add_asset(
        env: Env,
        admin: Address,
        code: String,
        issuer: Address,
        initial_price_xlm: i128,
    ) {
        let stored_admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        stored_admin.require_auth();
        
        // Create asset entry
        let asset = Asset {
            code: code.clone(),
            issuer,
            balance: 0,
            price_xlm: initial_price_xlm,
        };
        
        // Store asset info (this would be expanded for real asset management)
        env.storage().persistent().set(&code, &asset);
    }

    /// Update asset price (oracle function)
    pub fn update_asset_price(env: Env, admin: Address, asset_code: String, new_price_xlm: i128) {
        let stored_admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        stored_admin.require_auth();
        
        let mut asset: Asset = env.storage().persistent().get(&asset_code).unwrap();
        asset.price_xlm = new_price_xlm;
        env.storage().persistent().set(&asset_code, &asset);
    }

    /// Get user's portfolio
    pub fn get_portfolio(env: Env, owner: Address) -> Portfolio {
        let portfolio_key = (PORTFOLIOS, owner.clone());
        
        match env.storage().persistent().get(&portfolio_key) {
            Some(portfolio) => portfolio,
            None => Portfolio {
                owner,
                assets: Map::new(&env),
                total_value_xlm: 0,
                last_updated: env.ledger().timestamp(),
            }
        }
    }

    /// Update user's asset balance (called when assets are deposited/withdrawn)
    pub fn update_balance(
        env: Env,
        owner: Address,
        asset_code: String,
        new_balance: i128,
    ) {
        owner.require_auth();
        
        let portfolio_key = (PORTFOLIOS, owner.clone());
        let mut portfolio = Self::get_portfolio(env.clone(), owner.clone());
        
        // Get asset info
        let asset_info: Asset = env.storage().persistent().get(&asset_code).unwrap();
        let mut user_asset = asset_info.clone();
        user_asset.balance = new_balance;
        
        portfolio.assets.set(asset_code, user_asset);
        portfolio.last_updated = env.ledger().timestamp();
        
        // Recalculate total portfolio value
        portfolio.total_value_xlm = Self::calculate_portfolio_value(env.clone(), &portfolio);
        
        env.storage().persistent().set(&portfolio_key, &portfolio);
    }

    /// Create a swap order
    pub fn create_swap_order(
        env: Env,
        owner: Address,
        from_asset: String,
        to_asset: String,
        amount: i128,
        min_receive: i128,
    ) -> u64 {
        owner.require_auth();
        
        // Get and increment order counter
        let mut counter: u64 = env.storage().instance().get(&ORDER_COUNTER).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&ORDER_COUNTER, &counter);
        
        let order = SwapOrder {
            id: counter,
            owner: owner.clone(),
            from_asset: from_asset.clone(),
            to_asset: to_asset.clone(),
            amount,
            min_receive,
            timestamp: env.ledger().timestamp(),
            status: String::from_str(&env, "pending"),
        };
        
        let order_key = (SWAP_ORDERS, counter);
        env.storage().persistent().set(&order_key, &order);
        
        counter
    }

    /// Execute a swap (simplified AMM-style)
    pub fn execute_swap(env: Env, order_id: u64) -> bool {
        let order_key = (SWAP_ORDERS, order_id);
        let mut order: SwapOrder = env.storage().persistent().get(&order_key).unwrap();
        
        if order.status != String::from_str(&env, "pending") {
            return false;
        }
        
        // Get swap pool
        let pool_key = Self::get_pool_key(env.clone(), &order.from_asset, &order.to_asset);
        let mut pool: SwapPool = match env.storage().persistent().get(&pool_key) {
            Some(pool) => pool,
            None => return false, // No pool exists
        };
        
        // Calculate swap amount using constant product formula (x * y = k)
        let amount_out = Self::calculate_swap_amount(
            order.amount,
            pool.reserve_a,
            pool.reserve_b,
            pool.fee_rate,
        );
        
        if amount_out < order.min_receive {
            return false; // Slippage too high
        }
        
        // Update pool reserves
        pool.reserve_a += order.amount;
        pool.reserve_b -= amount_out;
        env.storage().persistent().set(&pool_key, &pool);
        
        // Update user balances
        Self::update_balance(
            env.clone(),
            order.owner.clone(),
            order.from_asset.clone(),
            Self::get_user_balance(env.clone(), &order.owner, &order.from_asset) - order.amount,
        );
        
        Self::update_balance(
            env.clone(),
            order.owner.clone(),
            order.to_asset.clone(),
            Self::get_user_balance(env.clone(), &order.owner, &order.to_asset) + amount_out,
        );
        
        // Mark order as completed
        order.status = String::from_str(&env, "completed");
        env.storage().persistent().set(&order_key, &order);
        
        true
    }

    /// Get swap orders for a user
    pub fn get_user_orders(env: Env, owner: Address) -> Vec<SwapOrder> {
        let mut orders = Vec::new(&env);
        
        // This is simplified - in practice you'd maintain an index
        let counter: u64 = env.storage().instance().get(&ORDER_COUNTER).unwrap_or(0);
        
        for i in 1..=counter {
            let order_key = (SWAP_ORDERS, i);
            if let Some(order) = env.storage().persistent().get::<_, SwapOrder>(&order_key) {
                if order.owner == owner {
                    orders.push_back(order);
                }
            }
        }
        
        orders
    }

    /// Create or update a swap pool
    pub fn create_swap_pool(
        env: Env,
        admin: Address,
        asset_a: String,
        asset_b: String,
        initial_reserve_a: i128,
        initial_reserve_b: i128,
        fee_rate: u32,
    ) {
        let stored_admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        stored_admin.require_auth();
        
        let pool = SwapPool {
            asset_a: asset_a.clone(),
            asset_b: asset_b.clone(),
            reserve_a: initial_reserve_a,
            reserve_b: initial_reserve_b,
            fee_rate,
        };
        
        let pool_key = Self::get_pool_key(env.clone(), &asset_a, &asset_b);
        env.storage().persistent().set(&pool_key, &pool);
    }

    /// Get swap pool info
    pub fn get_swap_pool(env: Env, asset_a: String, asset_b: String) -> Option<SwapPool> {
        let pool_key = Self::get_pool_key(env.clone(), &asset_a, &asset_b);
        env.storage().persistent().get(&pool_key)
    }

    /// Calculate expected swap output
    pub fn calculate_swap_output(
        env: Env,
        from_asset: String,
        to_asset: String,
        amount_in: i128,
    ) -> i128 {
        let pool_key = Self::get_pool_key(env.clone(), &from_asset, &to_asset);
        let pool: SwapPool = match env.storage().persistent().get(&pool_key) {
            Some(pool) => pool,
            None => return 0,
        };
        
        Self::calculate_swap_amount(amount_in, pool.reserve_a, pool.reserve_b, pool.fee_rate)
    }

    // Helper functions
    fn calculate_portfolio_value(env: Env, portfolio: &Portfolio) -> i128 {
        let mut total_value = 0i128;
        
        for (asset_code, asset) in portfolio.assets.iter() {
            total_value += asset.balance * asset.price_xlm / 10_000_000; // Convert from stroops
        }
        
        total_value
    }

    fn get_user_balance(env: Env, owner: &Address, asset_code: &String) -> i128 {
        let portfolio = Self::get_portfolio(env, owner.clone());
        match portfolio.assets.get(asset_code.clone()) {
            Some(asset) => asset.balance,
            None => 0,
        }
    }

    fn get_pool_key(env: Env, asset_a: &String, asset_b: &String) -> (Symbol, String) {
        // Ensure consistent ordering
        let key = if asset_a < asset_b {
            format!("{}_{}", asset_a, asset_b)
        } else {
            format!("{}_{}", asset_b, asset_a)
        };
        (SWAP_POOLS, String::from_str(&env, &key))
    }

    fn calculate_swap_amount(
        amount_in: i128,
        reserve_in: i128,
        reserve_out: i128,
        fee_rate: u32,
    ) -> i128 {
        // Constant product formula: (x + Δx) * (y - Δy) = x * y
        // Δy = (y * Δx * (10000 - fee)) / (x * 10000 + Δx * (10000 - fee))
        
        let amount_in_with_fee = amount_in * (10000 - fee_rate as i128) / 10000;
        let numerator = reserve_out * amount_in_with_fee;
        let denominator = reserve_in + amount_in_with_fee;
        
        numerator / denominator
    }
}