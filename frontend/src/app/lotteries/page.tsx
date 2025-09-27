'use client';

import { useMeltyFi } from '@/hooks/useMeltyFi';
import { useCurrentAccount } from '@mysten/dapp-kit';
import {
    Calendar,
    Clock,
    Coins,
    Filter,
    Loader2,
    Plus,
    Search,
    Ticket,
    Trophy,
    Users
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

// Helper functions
function formatSuiAmount(amount: string | bigint): string {
    const amountNum = typeof amount === 'string' ? BigInt(amount) : amount;
    return (Number(amountNum) / 1_000_000_000).toFixed(4);
}

function getDaysLeft(expirationDate: number): number {
    const timeLeft = expirationDate - Date.now();
    return Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
}

// Lottery Display Data Interface
interface LotteryDisplayData {
    id: string;
    lotteryId: string;
    owner: string;
    collateralNft: {
        name?: string;
        imageUrl?: string;
        description?: string;
    };
    expirationDate: Date;
    wonkaBarPrice: string;
    maxSupply: string;
    soldCount: string;
    state: string;
    daysLeft: number;
    progressPercentage: number;
    isExpired: boolean;
    isSoldOut: boolean;
    status: 'ACTIVE' | 'EXPIRED' | 'CONCLUDED' | 'SOLD_OUT';
    participants: number;
}

// Lottery Card Component
function LotteryCard({ lottery }: { lottery: LotteryDisplayData }) {
    const [imageError, setImageError] = useState(false);
    const [buyAmount, setBuyAmount] = useState(1);
    const currentAccount = useCurrentAccount();
    const { buyWonkaBars, isBuyingWonkaBars } = useMeltyFi();

    const wonkaBarPrice = parseFloat(formatSuiAmount(lottery.wonkaBarPrice));
    const totalRaised = wonkaBarPrice * parseInt(lottery.soldCount);
    const isOwned = currentAccount?.address === lottery.owner;
    const canBuy = lottery.status === 'ACTIVE' && !lottery.isExpired && !lottery.isSoldOut && !isOwned;
    const maxBuyAmount = Math.min(10, parseInt(lottery.maxSupply) - parseInt(lottery.soldCount));

    const handleBuyWonkaBars = async () => {
        if (!currentAccount || !canBuy) {
            if (!currentAccount) {
                alert('Please connect your wallet first');
            }
            return;
        }

        try {
            const totalCost = BigInt(Math.floor(wonkaBarPrice * buyAmount * 1_000_000_000));
            await buyWonkaBars.mutateAsync({
                lotteryId: lottery.lotteryId,
                amount: buyAmount,
                totalCost
            });
            setBuyAmount(1); // Reset to 1 after successful purchase
        } catch (error) {
            console.error('Failed to buy WonkaBars:', error);
        }
    };

    const getStatusBadge = () => {
        switch (lottery.status) {
            case 'CONCLUDED':
                return <span className="px-2 py-1 text-xs font-medium bg-green-600/20 text-green-400 rounded-full">Concluded</span>;
            case 'EXPIRED':
                return <span className="px-2 py-1 text-xs font-medium bg-orange-600/20 text-orange-400 rounded-full">Expired</span>;
            case 'SOLD_OUT':
                return <span className="px-2 py-1 text-xs font-medium bg-blue-600/20 text-blue-400 rounded-full">Sold Out</span>;
            case 'ACTIVE':
            default:
                return <span className="px-2 py-1 text-xs font-medium bg-purple-600/20 text-purple-400 rounded-full">Active</span>;
        }
    };

    return (
        <div className="group hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg">
            {/* NFT Image */}
            <div className="relative aspect-square overflow-hidden">
                {!imageError && lottery.collateralNft?.imageUrl ? (
                    <Image
                        src={lottery.collateralNft.imageUrl}
                        alt={lottery.collateralNft.name || 'NFT'}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => setImageError(true)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                        <Trophy className="w-16 h-16 text-white/40" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    {getStatusBadge()}
                </div>

                {/* Owner Badge */}
                {isOwned && (
                    <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 text-xs font-medium bg-purple-600/80 text-white rounded-full">
                            Your Lottery
                        </span>
                    </div>
                )}

                {/* Time Left Overlay */}
                {lottery.status === 'ACTIVE' && (
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                        <div className="flex items-center text-white text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {lottery.daysLeft}d left
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Header */}
                <div>
                    <h3 className="font-semibold text-white text-lg mb-1 line-clamp-2">
                        {lottery.collateralNft?.name || `Lottery #${lottery.lotteryId}`}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-white/60">
                        <span>#{lottery.lotteryId}</span>
                        <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            <span>{lottery.participants}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-white/60 block">Price per bar</span>
                        <span className="text-white font-semibold">{wonkaBarPrice.toFixed(4)} SUI</span>
                    </div>
                    <div>
                        <span className="text-white/60 block">Total raised</span>
                        <span className="text-white font-semibold">{totalRaised.toFixed(2)} SUI</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                            style={{ width: `${Math.min(lottery.progressPercentage, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-white/60">
                        <span>{lottery.progressPercentage.toFixed(1)}% filled</span>
                        <span>{lottery.soldCount}/{lottery.maxSupply} sold</span>
                    </div>
                </div>

                {/* Buy Section */}
                {canBuy && (
                    <div className="space-y-3 pt-2 border-t border-white/10">
                        {/* Amount Selector */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white/80">Buy amount:</span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setBuyAmount(Math.max(1, buyAmount - 1))}
                                    disabled={buyAmount <= 1}
                                    className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm flex items-center justify-center"
                                >
                                    -
                                </button>
                                <span className="text-white font-medium min-w-[2rem] text-center">{buyAmount}</span>
                                <button
                                    onClick={() => setBuyAmount(Math.min(maxBuyAmount, buyAmount + 1))}
                                    disabled={buyAmount >= maxBuyAmount}
                                    className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm flex items-center justify-center"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Total Cost */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60">Total cost:</span>
                            <span className="text-white font-semibold">
                                {(wonkaBarPrice * buyAmount).toFixed(4)} SUI
                            </span>
                        </div>

                        {/* Buy Button */}
                        <button
                            onClick={handleBuyWonkaBars}
                            disabled={isBuyingWonkaBars || !currentAccount}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                        >
                            {isBuyingWonkaBars ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Ticket className="w-5 h-5 mr-2" />
                                    Buy {buyAmount} WonkaBar{buyAmount > 1 ? 's' : ''}
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Status Messages */}
                {!canBuy && (
                    <div className="pt-2 border-t border-white/10">
                        {isOwned ? (
                            <div className="text-center py-2">
                                <span className="text-purple-300 text-sm font-medium">Your Lottery</span>
                            </div>
                        ) : lottery.isSoldOut ? (
                            <div className="text-center py-2">
                                <span className="text-blue-300 text-sm font-medium">Sold Out</span>
                            </div>
                        ) : lottery.isExpired ? (
                            <div className="text-center py-2">
                                <span className="text-orange-300 text-sm font-medium">Expired</span>
                            </div>
                        ) : lottery.status === 'CONCLUDED' ? (
                            <div className="text-center py-2">
                                <span className="text-green-300 text-sm font-medium">Concluded</span>
                            </div>
                        ) : !currentAccount ? (
                            <div className="text-center py-2">
                                <span className="text-white/60 text-sm">Connect wallet to buy</span>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}

// Main Lotteries Page Component
export default function LotteriesPage() {
    const currentAccount = useCurrentAccount();
    const { lotteries, isLoadingLotteries } = useMeltyFi();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'concluded'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'ending-soon' | 'progress'>('newest');

    // Process and transform lottery data for display
    const displayLotteries: LotteryDisplayData[] = useMemo(() => {
        if (!lotteries) return [];

        return lotteries.map(lottery => {
            const expirationDate = new Date(lottery.expirationDate);
            const isExpired = expirationDate.getTime() < Date.now();
            const isSoldOut = parseInt(lottery.soldCount) >= parseInt(lottery.maxSupply);
            const daysLeft = getDaysLeft(lottery.expirationDate);
            const progressPercentage = (parseInt(lottery.soldCount) / parseInt(lottery.maxSupply)) * 100;

            let status: 'ACTIVE' | 'EXPIRED' | 'CONCLUDED' | 'SOLD_OUT';
            if (lottery.state === 'CONCLUDED') {
                status = 'CONCLUDED';
            } else if (isExpired) {
                status = 'EXPIRED';
            } else if (isSoldOut) {
                status = 'SOLD_OUT';
            } else {
                status = 'ACTIVE';
            }

            return {
                id: lottery.id || lottery.lotteryId,
                lotteryId: lottery.lotteryId,
                owner: lottery.owner,
                collateralNft: lottery.collateralNft || {},
                expirationDate,
                wonkaBarPrice: lottery.wonkaBarPrice,
                maxSupply: lottery.maxSupply,
                soldCount: lottery.soldCount,
                state: lottery.state,
                daysLeft,
                progressPercentage,
                isExpired,
                isSoldOut,
                status,
                participants: lottery.participants || 0,
            };
        });
    }, [lotteries]);

    // Filter and sort lotteries
    const filteredLotteries = useMemo(() => {
        let filtered = [...displayLotteries];

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(lottery =>
                lottery.collateralNft?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lottery.lotteryId.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(lottery => {
                if (statusFilter === 'active') {
                    return lottery.status === 'ACTIVE';
                }
                if (statusFilter === 'concluded') {
                    return lottery.status === 'CONCLUDED' || lottery.status === 'EXPIRED';
                }
                return true;
            });
        }

        // Sort lotteries
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'ending-soon':
                    // Active lotteries first, then by days left
                    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
                    if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
                    return a.daysLeft - b.daysLeft;
                case 'progress':
                    return b.progressPercentage - a.progressPercentage;
                case 'newest':
                default:
                    return b.expirationDate.getTime() - a.expirationDate.getTime();
            }
        });

        return filtered;
    }, [displayLotteries, searchQuery, statusFilter, sortBy]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-500/10 via-transparent to-transparent" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-blue-500/10 via-transparent to-transparent" />
            </div>

            <div className="relative z-10 container mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                        NFT Lotteries
                    </h1>
                    <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
                        Discover amazing NFTs in active lotteries. Buy WonkaBars for a chance to win, or create your own lottery to unlock instant liquidity.
                    </p>
                </div>

                {/* Stats Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 text-center">
                        <div className="text-3xl font-bold text-white mb-2">
                            {displayLotteries.length}
                        </div>
                        <div className="text-white/60">Total Lotteries</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 text-center">
                        <div className="text-3xl font-bold text-white mb-2">
                            {displayLotteries.filter(l => l.status === 'ACTIVE').length}
                        </div>
                        <div className="text-white/60">Active Lotteries</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 text-center">
                        <div className="text-3xl font-bold text-white mb-2">
                            {displayLotteries.reduce((sum, l) => sum + parseInt(l.soldCount), 0)}
                        </div>
                        <div className="text-white/60">WonkaBars Sold</div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search lotteries..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="concluded">Concluded</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                        >
                            <option value="newest">Newest</option>
                            <option value="ending-soon">Ending Soon</option>
                            <option value="progress">Most Progress</option>
                        </select>
                    </div>
                </div>

                {/* Loading State */}
                {isLoadingLotteries && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                            <p className="text-white/60">Loading lotteries...</p>
                        </div>
                    </div>
                )}

                {/* Lotteries Grid */}
                {!isLoadingLotteries && (
                    <>
                        {filteredLotteries.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredLotteries.map((lottery) => (
                                    <LotteryCard key={lottery.id} lottery={lottery} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center">
                                <Trophy className="w-16 h-16 text-white/40 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    {searchQuery || statusFilter !== 'all' ? 'No matching lotteries' : 'No lotteries available'}
                                </h3>
                                <p className="text-white/60 mb-8 max-w-md mx-auto">
                                    {searchQuery || statusFilter !== 'all'
                                        ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                                        : 'Be the first to create a lottery and unlock NFT liquidity!'
                                    }
                                </p>
                                {(!searchQuery && statusFilter === 'all') && (
                                    <Link href="/create">
                                        <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center mx-auto">
                                            <Plus className="w-5 h-5 mr-2" />
                                            Create First Lottery
                                        </button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}