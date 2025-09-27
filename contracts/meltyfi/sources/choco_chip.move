module meltyfi::choco_chip {
    use sui::coin;
    use sui::transfer;
    use sui::tx_context::TxContext;
    use sui::object::{Self, UID};
    use sui::balance::{Self, Balance};
    use sui::coin_registry;
    use std::option;

    // ===============================
    // TYPES & STRUCTS
    // ===============================

    /// The ChocoChip token type
    public struct CHOCO_CHIP has drop {}

    /// Chocolate Factory for minting ChocoChips
    public struct ChocolateFactory has key {
        id: UID,
        total_supply: u64,
        mint_cap: coin::TreasuryCap<CHOCO_CHIP>,
    }

    /// Factory Admin capability
    public struct FactoryAdmin has key, store {
        id: UID,
    }

    // ===============================
    // CONSTANTS
    // ===============================

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INSUFFICIENT_FUNDS: u64 = 2;
    const E_INVALID_AMOUNT: u64 = 3;

    /// Token constants
    const DECIMALS: u8 = 9;
    const SYMBOL: vector<u8> = b"CHOCO";
    const NAME: vector<u8> = b"ChocoChip";
    const DESCRIPTION: vector<u8> = b"MeltyFi governance and reward token - earn by participating in NFT lotteries";
    const ICON_URL: vector<u8> = b""; // Add your token icon URL here

    // ===============================
    // INIT FUNCTION
    // ===============================

    /// Module initializer - creates the token and factory
    fun init(witness: CHOCO_CHIP, ctx: &mut TxContext) {
        // Use the new recommended function instead of deprecated create_currency
        let (treasury_cap, metadata) = coin_registry::new_currency_with_otw(
            witness,
            DECIMALS,
            SYMBOL,
            NAME,
            DESCRIPTION,
            option::some(ICON_URL),
            ctx
        );

        // Create the chocolate factory
        let factory = ChocolateFactory {
            id: object::new(ctx),
            total_supply: 0,
            mint_cap: treasury_cap,
        };

        // Create factory admin capability
        let admin = FactoryAdmin {
            id: object::new(ctx),
        };

        // Make metadata immutable (publicly accessible)
        transfer::public_freeze_object(metadata);
        
        // Transfer factory and admin to sender
        transfer::transfer(factory, tx_context::sender(ctx));
        transfer::transfer(admin, tx_context::sender(ctx));
    }

    // ===============================
    // PUBLIC FUNCTIONS
    // ===============================

    /// Mint ChocoChips - can only be called by factory owner
    public fun mint(
        factory: &mut ChocolateFactory,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coins = coin::mint(&mut factory.mint_cap, amount, ctx);
        factory.total_supply = factory.total_supply + amount;
        transfer::public_transfer(coins, recipient);
    }

    /// Burn ChocoChips
    public fun burn(factory: &mut ChocolateFactory, coins: coin::Coin<CHOCO_CHIP>) {
        let amount = coin::value(&coins);
        coin::burn(&mut factory.mint_cap, coins);
        factory.total_supply = factory.total_supply - amount;
    }

    /// Get total supply
    public fun total_supply(factory: &ChocolateFactory): u64 {
        factory.total_supply
    }

    /// Get balance of a coin
    public fun balance(coins: &coin::Coin<CHOCO_CHIP>): u64 {
        coin::value(coins)
    }

    /// Split coins
    public fun split(
        coins: &mut coin::Coin<CHOCO_CHIP>,
        amount: u64,
        ctx: &mut TxContext
    ): coin::Coin<CHOCO_CHIP> {
        coin::split(coins, amount, ctx)
    }

    /// Join coins
    public fun join(
        coin1: &mut coin::Coin<CHOCO_CHIP>,
        coin2: coin::Coin<CHOCO_CHIP>
    ) {
        coin::join(coin1, coin2);
    }

    // ===============================
    // ADMIN FUNCTIONS
    // ===============================

    /// Emergency mint function (admin only)
    public fun admin_mint(
        _admin: &FactoryAdmin,
        factory: &mut ChocolateFactory,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        mint(factory, amount, recipient, ctx);
    }

    /// Update factory settings (admin only)
    public fun admin_burn_cap(
        _admin: &FactoryAdmin,
        factory: &mut ChocolateFactory,
        coins: coin::Coin<CHOCO_CHIP>
    ) {
        burn(factory, coins);
    }

    // ===============================
    // GETTER FUNCTIONS
    // ===============================

    /// Get factory total supply (view function)
    public fun get_total_supply(factory: &ChocolateFactory): u64 {
        total_supply(factory)
    }

    /// Check if address owns factory admin capability
    public fun is_admin(factory_admin: &FactoryAdmin): bool {
        // Simple existence check - in production you might want more sophisticated checks
        object::uid_to_address(&factory_admin.id) != @0x0
    }
}