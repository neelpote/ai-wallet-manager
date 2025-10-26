#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_initialize_wallet() {
    let env = Env::default();
    let contract_id = env.register_contract(None, WalletGuard);
    let client = WalletGuardClient::new(&env, &contract_id);
    
    let owner = Address::generate(&env);
    
    client.initialize(&owner);
    
    let spending_info = client.get_spending_info(&owner);
    assert_eq!(spending_info.daily_limit, 1000_0000000);
    assert_eq!(spending_info.monthly_limit, 10000_0000000);
    assert_eq!(spending_info.is_frozen, false);
}

#[test]
fn test_set_daily_limit() {
    let env = Env::default();
    let contract_id = env.register_contract(None, WalletGuard);
    let client = WalletGuardClient::new(&env, &contract_id);
    
    let owner = Address::generate(&env);
    
    client.initialize(&owner);
    client.set_daily_limit(&owner, &500_0000000);
    
    let spending_info = client.get_spending_info(&owner);
    assert_eq!(spending_info.daily_limit, 500_0000000);
}

#[test]
fn test_validate_transaction() {
    let env = Env::default();
    let contract_id = env.register_contract(None, WalletGuard);
    let client = WalletGuardClient::new(&env, &contract_id);
    
    let owner = Address::generate(&env);
    
    client.initialize(&owner);
    
    // Should allow transaction within limit
    assert_eq!(client.validate_transaction(&owner, &100_0000000), true);
    
    // Should reject transaction exceeding daily limit
    assert_eq!(client.validate_transaction(&owner, &2000_0000000), false);
}

#[test]
fn test_freeze_wallet() {
    let env = Env::default();
    let contract_id = env.register_contract(None, WalletGuard);
    let client = WalletGuardClient::new(&env, &contract_id);
    
    let owner = Address::generate(&env);
    
    client.initialize(&owner);
    client.freeze_wallet(&owner);
    
    let spending_info = client.get_spending_info(&owner);
    assert_eq!(spending_info.is_frozen, true);
    
    // Should reject transactions when frozen
    assert_eq!(client.validate_transaction(&owner, &10_0000000), false);
}

#[test]
fn test_add_contact() {
    let env = Env::default();
    let contract_id = env.register_contract(None, WalletGuard);
    let client = WalletGuardClient::new(&env, &contract_id);
    
    let owner = Address::generate(&env);
    let contact_address = Address::generate(&env);
    
    client.initialize(&owner);
    client.add_contact(&owner, &String::from_str(&env, "Alice"), &contact_address, &true);
    
    let contact = client.get_contact(&owner, &String::from_str(&env, "Alice"));
    assert!(contact.is_some());
    
    let contact = contact.unwrap();
    assert_eq!(contact.address, contact_address);
    assert_eq!(contact.is_trusted, true);
}