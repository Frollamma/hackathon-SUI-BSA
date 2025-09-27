'use client';

import { useMeltyFi } from '@/hooks/useMeltyFi';
import { useCurrentAccount } from '@mysten/dapp-kit';
import {
    Check,
    Clock,
    Copy,
    Ticket,
    Trophy,
    User,
    Wallet
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

// Separate component for lottery card to properly use hooks
function LotteryCard({ lottery, formatSuiAmount, formatTimeLeft }: {
    lottery: any;
    formatSuiAmount: (amount: string | number) => string;
    formatTimeLeft: (expirationDate: number) => string;
}) {
    const [imageError, setImageError] = useState(false);

    const hasValidImage = lottery.collateralNft?.imageUrl &&
        lottery.collateralNft.imageUrl !== '/placeholder-nft.png' &&
        !imageError;

    return (
        <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden hover:bg-white/10 transition-colors">
            {/* NFT Image */}
            <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                {hasValidImage ? (
                    <Image
                        src={lottery.collateralNft.imageUrl}
                        alt={lottery.collateralNft?.name || 'NFT'}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                        unoptimized
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Ticket className="w-8 h-8 text-white" />
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${lottery.state === 'ACTIVE'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : lottery.state === 'CONCLUDED'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                        {lottery.state}
                    </div>
                    <span className="text-sm text-white/60">#{lottery.lotteryId}</span>
                </div>

                <div className="mb-4">
                    <h3 className="font-semibold text-white mb-2">
                        {lottery.collateralNft?.name || 'Unknown NFT'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-white/60">Sold</span>
                            <p className="text-white font-medium">
                                {lottery.soldCount}/{lottery.maxSupply}
                            </p>
                        </div>
                        <div>
                            <span className="text-white/60">Price</span>
                            <p className="text-white font-medium">
                                {formatSuiAmount(lottery.wonkaBarPrice)} SUI
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-white/60" />
                    <span className="text-white/60">
                        {lottery.state === 'ACTIVE'
                            ? formatTimeLeft(lottery.expirationDate)
                            : 'Ended'
                        }
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const currentAccount = useCurrentAccount();
    const { lotteries, userStats, isLoadingLotteries } = useMeltyFi();
    const [copiedAddress, setCopiedAddress] = useState(false);

    const formatSuiAmount = (amount: string | number) => (Number(amount) / 1_000_000_000).toFixed(4);

    const shortenAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const copyAddress = () => {
        if (currentAccount?.address) {
            navigator.clipboard.writeText(currentAccount.address);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

    const formatTimeLeft = (expirationDate: number) => {
        const timeLeft = expirationDate - Date.now();
        const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (timeLeft <= 0) return 'Expired';
        if (daysLeft > 0) return `${daysLeft}d ${hoursLeft}h left`;
        if (hoursLeft > 0) return `${hoursLeft}h left`;
        return '< 1h left';
    };

    if (!currentAccount) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="text-center">
                    <Wallet className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Connect Your Wallet
                    </h2>
                    <p className="text-sm text-white/40">
                        Make sure you're on Sui Testnet and have some testnet SUI tokens.
                    </p>
                </div>
            </div>
        );
    }

    // Get user's active lotteries
    const userLotteries = lotteries.filter(lottery => lottery.owner === currentAccount.address);
    const activeLotteries = userLotteries.filter(lottery => lottery.state === 'ACTIVE');

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-500/10 via-transparent to-transparent" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-blue-500/10 via-transparent to-transparent" />
            </div>

            <div className="relative z-10 container mx-auto px-6 py-12">
                {/* Profile Header */}
                <div className="mb-12">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        {/* User Info */}
                        <div className="flex items-center space-x-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
                                <div className="flex items-center space-x-2 text-white/60">
                                    <span className="font-mono text-sm">
                                        {shortenAddress(currentAccount.address)}
                                    </span>
                                    <button
                                        onClick={copyAddress}
                                        className="h-6 w-6 p-0 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                                    >
                                        {copiedAddress ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <Link
                            href="/create"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                        >
                            Create New Lottery
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Lotteries */}
                    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Trophy className="w-8 h-8 text-purple-400" />
                            <span className="text-sm text-white/60">Lotteries</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {userStats?.activeLotteries || 0}
                        </div>
                        <div className="text-sm text-white/60">
                            Active of {userStats?.totalLotteries || 0} total
                        </div>
                    </div>

                    {/* WonkaBars */}
                    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Ticket className="w-8 h-8 text-pink-400" />
                            <span className="text-sm text-white/60">WonkaBars</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {userStats?.totalWonkaBars || 0}
                        </div>
                        <div className="text-sm text-white/60">
                            Lottery tickets owned
                        </div>
                    </div>

                    {/* Balance */}
                    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Wallet className="w-8 h-8 text-blue-400" />
                            <span className="text-sm text-white/60">Balance</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {formatSuiAmount(userStats?.suiBalance || '0')}
                        </div>
                        <div className="text-sm text-white/60">
                            SUI
                        </div>
                    </div>
                </div>

                {/* My Lotteries Section */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">My Lotteries</h2>
                        {userLotteries.length > 0 && (
                            <Link
                                href="/create"
                                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                            >
                                Create New Lottery →
                            </Link>
                        )}
                    </div>

                    {isLoadingLotteries ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            <p className="text-white/60 mt-4">Loading your lotteries...</p>
                        </div>
                    ) : userLotteries.length === 0 ? (
                        <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center">
                            <Trophy className="w-16 h-16 text-white/40 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No Lotteries Yet</h3>
                            <p className="text-white/60 mb-6">
                                Create your first lottery to start earning liquidity from your NFTs.
                            </p>
                            <Link
                                href="/create"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-block"
                            >
                                Create Your First Lottery
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {userLotteries.map((lottery) => (
                                <LotteryCard
                                    key={lottery.id}
                                    lottery={lottery}
                                    formatSuiAmount={formatSuiAmount}
                                    formatTimeLeft={formatTimeLeft}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}