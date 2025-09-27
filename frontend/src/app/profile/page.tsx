'use client';

import { getExplorerUrl } from '@/constants/contracts';
import { useMeltyFi } from '@/hooks/useMeltyFi';
import { shortenAddress } from '@/lib/utils';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import {
    Check,
    Clock,
    Coins,
    Copy,
    ExternalLink,
    Gift,
    Loader2,
    Plus,
    Ticket,
    Trophy,
    User,
    Wallet
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

// Helper functions
function formatSuiAmount(amount: string | bigint): string {
    const amountNum = typeof amount === 'string' ? BigInt(amount) : amount;
    return (Number(amountNum) / 1_000_000_000).toFixed(4);
}

function formatChocoChips(amount: string): string {
    const amountNum = BigInt(amount);
    return (Number(amountNum) / 1_000_000_000).toFixed(2);
}

function getDaysLeft(expirationDate: number): number {
    const timeLeft = expirationDate - Date.now();
    return Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
}

// Lottery Card Component for All Lotteries
function LotteryCard({ lottery, isOwned = false }: { lottery: any; isOwned?: boolean }) {
    const [imageError, setImageError] = useState(false);
    const currentAccount = useCurrentAccount();
    const { buyWonkaBars, isBuyingWonkaBars } = useMeltyFi();

    const progressPercentage = (parseInt(lottery.soldCount) / parseInt(lottery.maxSupply)) * 100;
    const daysLeft = getDaysLeft(lottery.expirationDate);
    const isExpired = lottery.expirationDate < Date.now();
    const isSoldOut = parseInt(lottery.soldCount) >= parseInt(lottery.maxSupply);
    const wonkaBarPrice = parseFloat(formatSuiAmount(lottery.wonkaBarPrice));
    const totalRaised = wonkaBarPrice * parseInt(lottery.soldCount);

    const handleBuyWonkaBars = async (amount: number) => {
        if (!currentAccount) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            await buyWonkaBars.mutateAsync({
                lotteryId: lottery.lotteryId,
                amount,
                totalCost: BigInt(Math.floor(wonkaBarPrice * amount * 1_000_000_000))
            });
        } catch (error) {
            console.error('Failed to buy WonkaBars:', error);
        }
    };

    return (
        <div className="group hover:shadow-lg transition-all duration-300 overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg">
            {/* NFT Image */}
            <div className="relative aspect-square overflow-hidden">
                {!imageError && lottery.collateralNft?.imageUrl ? (
                    <Image
                        src={lottery.collateralNft.imageUrl}
                        alt={lottery.collateralNft.name || `NFT #${lottery.lotteryId}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Trophy className="w-12 h-12 text-white/40" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${lottery.state === 'CONCLUDED'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : isExpired
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isSoldOut
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                        {isExpired ? 'EXPIRED' : isSoldOut ? 'SOLD OUT' : lottery.state}
                    </div>
                </div>

                {/* Lottery ID */}
                <div className="absolute top-3 right-3">
                    <div className="px-2 py-1 bg-black/50 rounded text-xs text-white/80">
                        #{lottery.lotteryId}
                    </div>
                </div>

                {/* Owner Badge */}
                {isOwned && (
                    <div className="absolute bottom-3 left-3">
                        <div className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-medium backdrop-blur-sm">
                            Your Lottery
                        </div>
                    </div>
                )}

                {/* Time Remaining */}
                <div className="absolute bottom-3 right-3">
                    <div className="bg-black/50 text-white px-2.5 py-0.5 text-xs font-semibold rounded-md flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {isExpired ? 'Expired' : `${daysLeft}d left`}
                    </div>
                </div>
            </div>

            <div className="p-4">
                {/* Header */}
                <div className="mb-3">
                    <h3 className="text-base font-semibold text-white mb-1 line-clamp-1">
                        {lottery.collateralNft?.name || `NFT #${lottery.lotteryId}`}
                    </h3>
                    {lottery.collateralNft?.collection && (
                        <p className="text-sm text-white/60">{lottery.collateralNft.collection}</p>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                        <span className="text-white/60">Price per WonkaBar</span>
                        <p className="text-white font-medium">{wonkaBarPrice.toFixed(4)} SUI</p>
                    </div>
                    <div>
                        <span className="text-white/60">Sold</span>
                        <p className="text-white font-medium">{lottery.soldCount}/{lottery.maxSupply}</p>
                    </div>
                    <div>
                        <span className="text-white/60">Total Raised</span>
                        <p className="text-white font-medium">{totalRaised.toFixed(2)} SUI</p>
                    </div>
                    <div>
                        <span className="text-white/60">Participants</span>
                        <p className="text-white font-medium">{lottery.participants || 0}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                    <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                        <span>{progressPercentage.toFixed(1)}% filled</span>
                        <span>{lottery.participants || 0} participants</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                    {!isOwned && lottery.state === 'ACTIVE' && !isExpired && !isSoldOut && (
                        <button
                            onClick={() => handleBuyWonkaBars(1)}
                            disabled={isBuyingWonkaBars}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 flex items-center justify-center text-sm"
                        >
                            {isBuyingWonkaBars ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Buy WonkaBar
                                </>
                            )}
                        </button>
                    )}

                    {isOwned ? (
                        <div className="text-center">
                            <span className="text-purple-300 text-sm font-medium">Your Lottery</span>
                        </div>
                    ) : (
                        <div className="text-center">
                            <span className="text-white/60 text-xs">Lottery #{lottery.lotteryId}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// WonkaBar Card Component
function WonkaBarCard({ wonkaBar }: { wonkaBar: any }) {
    const { lotteries } = useMeltyFi();

    // Find the corresponding lottery
    const lottery = lotteries?.find(l => l.lotteryId === wonkaBar.lotteryId);

    if (!lottery) {
        return (
            <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg p-4">
                <div className="text-white/60 text-sm">Loading lottery data...</div>
            </div>
        );
    }

    const isExpired = lottery.expirationDate < Date.now();
    const isConcluded = lottery.state === 'CONCLUDED';
    const ticketCount = parseInt(wonkaBar.ticketCount);
    const winChance = ((ticketCount / parseInt(lottery.maxSupply)) * 100);

    return (
        <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg p-4 hover:bg-white/10 transition-colors">
            {/* Lottery Image */}
            <div className="relative aspect-video overflow-hidden rounded-md mb-3">
                {lottery.collateralNft?.imageUrl ? (
                    <Image
                        src={lottery.collateralNft.imageUrl}
                        alt={lottery.collateralNft.name || `NFT #${lottery.lotteryId}`}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Ticket className="w-8 h-8 text-white/40" />
                    </div>
                )}

                {/* Ticket Count Badge */}
                <div className="absolute top-2 right-2">
                    <div className="bg-black/70 text-white px-2 py-1 rounded-md text-xs font-bold">
                        {ticketCount} Tickets
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {/* Header */}
                <div>
                    <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">
                        {lottery.collateralNft?.name || `Lottery #${lottery.lotteryId}`}
                    </h3>
                    <p className="text-white/60 text-xs">
                        {lottery.collateralNft?.collection || 'NFT Collection'}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <span className="text-white/60">Win Chance</span>
                        <p className="text-white font-medium text-lg">
                            {winChance.toFixed(2)}%
                        </p>
                    </div>
                    <div>
                        <span className="text-white/60">Status</span>
                        <p className={`font-medium ${isConcluded ? 'text-green-400' :
                                isExpired ? 'text-red-400' : 'text-blue-400'
                            }`}>
                            {isConcluded ? 'Concluded' : isExpired ? 'Expired' : 'Active'}
                        </p>
                    </div>
                </div>

                {/* Purchase Info */}
                <div className="text-xs">
                    <div className="flex justify-between items-center">
                        <span className="text-white/60">Purchased</span>
                        <span className="text-white">
                            {new Date(wonkaBar.purchasedAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-white/60">Investment</span>
                        <span className="text-white font-medium">
                            {(parseFloat(formatSuiAmount(lottery.wonkaBarPrice)) * ticketCount).toFixed(4)} SUI
                        </span>
                    </div>
                </div>

                {/* Action Button */}
                <div className="text-center pt-2">
                    <span className="text-purple-300 text-xs font-medium">
                        Lottery #{lottery.lotteryId}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Main Profile Component
export default function ProfilePage() {
    const currentAccount = useCurrentAccount();
    const { data: balance } = useSuiClientQuery(
        'getBalance',
        { owner: currentAccount?.address || '' },
        { enabled: !!currentAccount?.address }
    );

    const {
        userStats,
        lotteries,
        userWonkaBars,
        isLoadingLotteries,
        isLoadingWonkaBars
    } = useMeltyFi();

    const [copiedAddress, setCopiedAddress] = useState(false);
    const [activeTab, setActiveTab] = useState<'lotteries' | 'wonkabars'>('lotteries');

    const copyAddress = async () => {
        if (currentAccount?.address) {
            await navigator.clipboard.writeText(currentAccount.address);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

    // Process user's lotteries
    const userLotteries = useMemo(() => {
        if (!lotteries || !currentAccount) return [];
        return lotteries.filter(lottery => lottery.owner === currentAccount.address);
    }, [lotteries, currentAccount]);

    // Wallet not connected state
    if (!currentAccount) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center max-w-md">
                    <Wallet className="w-16 h-16 text-white/40 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                    <p className="text-white/60 mb-8">
                        Connect your Sui wallet to access your profile and manage your lotteries.
                    </p>
                    <p className="text-sm text-white/40">
                        Make sure you're on Sui Testnet and have some testnet SUI tokens.
                    </p>
                </div>
            </div>
        );
    }

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
                                        className="h-6 w-6 p-0 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors flex items-center justify-center"
                                    >
                                        {copiedAddress ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                    <a
                                        href={getExplorerUrl('address', currentAccount.address)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-6 w-6 p-0 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors flex items-center justify-center"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <Link href="/create">
                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center">
                                <Plus className="w-5 h-5 mr-2" />
                                Create New Lottery
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {/* My Lotteries */}
                    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Trophy className="w-8 h-8 text-purple-400" />
                            <span className="text-sm text-white/60">My Lotteries</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {userLotteries.length}
                        </div>
                        <div className="text-sm text-white/60">
                            Total created
                        </div>
                    </div>

                    {/* WonkaBars */}
                    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Ticket className="w-8 h-8 text-pink-400" />
                            <span className="text-sm text-white/60">WonkaBars</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {userWonkaBars?.length || 0}
                        </div>
                        <div className="text-sm text-white/60">
                            Lottery tickets owned
                        </div>
                    </div>

                    {/* SUI Balance */}
                    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Coins className="w-8 h-8 text-blue-400" />
                            <span className="text-sm text-white/60">SUI Balance</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {balance ? formatSuiAmount(balance.totalBalance) : '0.0000'}
                        </div>
                        <div className="text-sm text-white/60">
                            Available SUI
                        </div>
                    </div>

                    {/* ChocoChips */}
                    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Gift className="w-8 h-8 text-amber-400" />
                            <span className="text-sm text-white/60">ChocoChips</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {userStats?.chocoChipBalance ? formatChocoChips(userStats.chocoChipBalance) : '0.00'}
                        </div>
                        <div className="text-sm text-white/60">
                            Reward tokens
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-1">
                        <div className="grid grid-cols-2 gap-1">
                            {[
                                {
                                    id: 'lotteries',
                                    label: 'All Lotteries',
                                    icon: <Trophy className="w-5 h-5" />,
                                    description: 'Browse and participate in lotteries'
                                },
                                {
                                    id: 'wonkabars',
                                    label: 'My WonkaBars',
                                    icon: <Ticket className="w-5 h-5" />,
                                    description: 'Track your lottery tickets'
                                }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex flex-col items-center space-y-2 p-6 rounded-lg font-medium transition-all duration-200 ${activeTab === tab.id
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                            : 'text-white/60 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {tab.icon}
                                    <div className="text-center">
                                        <div className="font-semibold">{tab.label}</div>
                                        <div className={`text-xs mt-1 ${activeTab === tab.id ? 'text-white/80' : 'text-white/40'
                                            }`}>
                                            {tab.description}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-8">
                    {/* All Lotteries Tab */}
                    {activeTab === 'lotteries' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">All Lotteries</h2>
                                    <p className="text-white/60 mt-1">
                                        Browse all available lotteries. Your lotteries are highlighted.
                                    </p>
                                </div>
                                <Link href="/create">
                                    <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Lottery
                                    </button>
                                </Link>
                            </div>

                            {isLoadingLotteries ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                                </div>
                            ) : lotteries && lotteries.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {lotteries.map((lottery) => (
                                        <LotteryCard
                                            key={lottery.id}
                                            lottery={lottery}
                                            isOwned={lottery.owner === currentAccount.address}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center">
                                    <Trophy className="w-12 h-12 text-white/40 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-white mb-2">No lotteries available</h3>
                                    <p className="text-white/60 mb-6">
                                        Be the first to create a lottery and unlock NFT liquidity!
                                    </p>
                                    <Link href="/create">
                                        <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center justify-center mx-auto">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create First Lottery
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* My WonkaBars Tab */}
                    {activeTab === 'wonkabars' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">My WonkaBars</h2>
                                    <p className="text-white/60 mt-1">
                                        Track your lottery tickets and win chances.
                                    </p>
                                </div>
                                <Link href="/lotteries">
                                    <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center">
                                        <Ticket className="w-4 h-4 mr-2" />
                                        Buy More
                                    </button>
                                </Link>
                            </div>

                            {isLoadingWonkaBars ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                                </div>
                            ) : userWonkaBars && userWonkaBars.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {userWonkaBars.map((wonkaBar) => (
                                        <WonkaBarCard key={wonkaBar.id} wonkaBar={wonkaBar} />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center">
                                    <Ticket className="w-12 h-12 text-white/40 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-white mb-2">No WonkaBars yet</h3>
                                    <p className="text-white/60 mb-6">
                                        Purchase WonkaBars from active lotteries to start winning NFTs
                                    </p>
                                    <div className="flex gap-4 justify-center">
                                        <Link href="/lotteries">
                                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center">
                                                <Ticket className="w-4 h-4 mr-2" />
                                                Browse Lotteries
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => setActiveTab('lotteries')}
                                            className="border border-white/20 text-white hover:bg-white/10 px-4 py-2 rounded-md transition-colors"
                                        >
                                            View All Lotteries
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}