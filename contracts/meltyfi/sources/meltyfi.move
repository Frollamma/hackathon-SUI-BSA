module meltyfi::meltyfi {
    use meltyfi::meltyfi_core;
    use meltyfi::choco_chip;
    use meltyfi::wonka_bars;

    // ===============================
    // PUBLIC INTERFACE - CORE FUNCTIONS
    // ===============================

    // Fix syntax: Replace semicolons with proper 'as' aliases
    public use fun meltyfi_core::create_lottery as create_lottery;
    public use fun meltyfi_core::buy_wonka_bars as buy_wonka_bars;
    public use fun meltyfi_core::cancel_lottery as cancel_lottery;
    public use fun meltyfi_core::repay_loan as repay_loan;
    public use fun meltyfi_core::draw_winner as draw_winner;

    // Query functions  
    public use fun meltyfi_core::lottery_details as lottery_details;
    public use fun meltyfi_core::protocol_stats as protocol_stats;
    public use fun meltyfi_core::user_participation as user_participation;
    public use fun meltyfi_core::is_lottery_winner as is_lottery_winner;

    // Token functions
    public use fun choco_chip::mint as mint_choco;
    public use fun choco_chip::total_supply as choco_total_supply;
    public use fun choco_chip::balance as choco_balance;

    // WonkaBar functions
    public use fun wonka_bars::mint as mint_wonka_bars;
    public use fun wonka_bars::burn as burn_wonka_bars;
    public use fun wonka_bars::get_lottery_id as get_wonka_lottery_id;

    // ===============================
    // RE-EXPORT CORE TYPES
    // ===============================
    
    // Core protocol types
    public use meltyfi_core::{
        Protocol,
        Lottery,
        LotteryState,
        AdminCap,
        ProtocolStats,
        LotteryDetails,
        UserParticipation
    };

    // Token types
    public use choco_chip::{
        CHOCO_CHIP,
        ChocolateFactory,
        FactoryAdmin
    };

    // WonkaBar types
    public use wonka_bars::{
        WonkaBars
    };

    // ===============================
    // CONVENIENCE FUNCTIONS
    // ===============================

    /// Get the current protocol version
    public fun protocol_version(): u64 {
        1
    }

    /// Check if the protocol is active
    public fun is_protocol_active(): bool {
        true
    }
}