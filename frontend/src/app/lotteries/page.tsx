'use client';

import { useMeltyFi } from '@/hooks/useMeltyFi';
import { useCurrentAccount } from '@mysten/dapp-kit';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    Coins,
    ExternalLink,
    Filter,
    Image as ImageIcon,
    Loader2,
    Plus,
    Search,
    Target,
    TrendingUp,
    Trophy,
    Users,
    Zap
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

// Types for better type safety
interface LotteryDisplayData {
    id: string;
    lotteryId: string;
    title: string;
    collection?: string;
    image: string;
    owner: string;
    expirationDate: Date;
    wonkaBarPrice: number;
    wonkaBarsSold: number;
    wonkaBarsMaxSupply: number;
    totalRaised: number;
    status: 'ACTIVE' | 'CANCELLED' | 'CONCLUDED';
    isExpired: boolean;
    isSoldOut: boolean;
    daysLeft: number;
    progressPercentage: number;
}

// Helper functions
function formatSuiAmount(amount: string | bigint): string {
    const amountNum = typeof amount === 'string' ? BigInt(amount) : amount;
    return (Number(amountNum) / 1_000_000_000).toFixed(4);
}

function getDaysLeft(expirationDate: number): number {
    const timeLeft = expirationDate - Date.now();
    return Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
}

// Enhanced Lottery Card Component
function LotteryCard({ lottery }: { lottery: LotteryDisplayData }) {
    const [imageError, setImageError] = useState(false);
    const { buyWonkaBars, isBuyingWonkaBars } = useMeltyFi();
    const currentAccount = useCurrentAccount();

    const handleBuyWonkaBars = async (amount: number) => {
        if (!currentAccount) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            await buyWonkaBars.mutateAsync({
                lotteryId: lottery.lotteryId,
                amount,
                totalCost: BigInt(Math.floor(lottery.wonkaBarPrice * amount * 1_000_000_000))
            });
        } catch (error) {
            console.error('Failed to buy WonkaBars:', error);
        }
    };

    return (
        <div className="group hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg">
            {/* NFT Image */}
            <div className="relative aspect-square overflow-hidden">
                {!imageError ? (
                    <Image
                        src={lottery.image}
                        alt={lottery.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImageError(true)}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-white/40" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${lottery.status === 'CONCLUDED'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : lottery.isExpired
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : lottery.isSoldOut
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                        {lottery.isExpired ? 'EXPIRED' : lottery.isSoldOut ? 'SOLD OUT' : lottery.status}
                    </div>
                </div>

                {/* Time Remaining */}
                <div className="absolute top-4 right-4">
                    <div className="bg-black/50 text-white px-2.5 py-0.5 text-xs font-semibold rounded-md flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {lottery.isExpired ? 'Expired' : `${lottery.daysLeft}d left`}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-2">
                    <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${lottery.progressPercentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-white mt-1">
                        <span>{lottery.wonkaBarsSold}/{lottery.wonkaBarsMaxSupply}</span>
                        <span>{lottery.progressPercentage.toFixed(1)}%</span>
                    </div>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                            {lottery.title}
                        </h3>
                        {lottery.collection && (
                            <p className="text-sm text-white/60">{lottery.collection}</p>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-white/60">Price per Bar</span>
                            <p className="text-white font-medium">{lottery.wonkaBarPrice.toFixed(4)} SUI</p>
                        </div>
                        <div>
                            <span className="text-white/60">Total Raised</span>
                            <p className="text-white font-medium">{lottery.totalRaised.toFixed(2)} SUI</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                        {lottery.status === 'ACTIVE' && !lottery.isExpired && !lottery.isSoldOut && (
                            <button
                                onClick={() => handleBuyWonkaBars(1)}
                                disabled={isBuyingWonkaBars}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 flex items-center justify-center text-sm"
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

                        <Link href={`/lottery/${lottery.lotteryId}`}>
                            <button className="px-4 py-2 border border-white/20 text-white hover:bg-white/10 rounded-md transition-colors text-sm">
                                View Details
                            </button>
                        </Link>
                    </div>
                </div>
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
            const wonkaBarPrice = parseFloat(formatSuiAmount(lottery.wonkaBarPrice));
            const totalRaised = wonkaBarPrice * parseInt(lottery.soldCount);

            return {
                id: lottery.id,
                lotteryId: lottery.lotteryId,
                title: lottery.collateralNft.name || `NFT #${lottery.lotteryId}`,
                collection: lottery.collateralNft.collection,
                image: lottery.collateralNft.imageUrl || '/placeholder-nft.jpg',
                owner: lottery.owner,
                expirationDate,
                wonkaBarPrice,
                wonkaBarsSold: parseInt(lottery.soldCount),
                wonkaBarsMaxSupply: parseInt(lottery.maxSupply),
                totalRaised,
                status: lottery.state,
                isExpired,
                isSoldOut,
                daysLeft,
                progressPercentage
            };
        });
    }, [lotteries]);

    // Filter and sort lotteries
    const filteredLotteries = useMemo(() => {
        let filtered = displayLotteries;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(lottery =>
                lottery.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lottery.collection?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(lottery => {
                if (statusFilter === 'active') {
                    return lottery.status === 'ACTIVE' && !lottery.isExpired;
                }
                return lottery.status === 'CONCLUDED' || lottery.isExpired;
            });
        }

        // Sort lotteries
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'ending-soon':
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
                            <div className="text-center py-20">
                                <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-12 max-w-md mx-auto">
                                    <Trophy className="w-16 h-16 text-white/40 mx-auto mb-6" />
                                    <h3 className="text-xl font-semibold text-white mb-4">No Lotteries Found</h3>
                                    <p className="text-white/60 mb-6">
                                        {searchQuery || statusFilter !== 'all'
                                            ? 'Try adjusting your search or filters'
                                            : 'Be the first to create a lottery and unlock NFT liquidity!'
                                        }
                                    </p>
                                    {!searchQuery && statusFilter === 'all' && (
                                        <Link href="/create">
                                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6 py-3 rounded-md transition-colors flex items-center justify-center mx-auto">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create First Lottery
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Stats Section */}
                {!isLoadingLotteries && filteredLotteries.length > 0 && (
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center">
                            <div className="flex justify-center mb-3">
                                <Trophy className="w-8 h-8 text-amber-400" />
                            </div>
                            <div className="text-2xl font-bold text-white mb-2">
                                {filteredLotteries.filter(l => l.status === 'ACTIVE' && !l.isExpired).length}
                            </div>
                            <div className="text-sm text-white/60">Active Lotteries</div>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center">
                            <div className="flex justify-center mb-3">
                                <Users className="w-8 h-8 text-purple-400" />
                            </div>
                            <div className="text-2xl font-bold text-white mb-2">
                                {filteredLotteries.reduce((sum, l) => sum + l.wonkaBarsSold, 0).toLocaleString()}
                            </div>
                            <div className="text-sm text-white/60">WonkaBars Sold</div>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center">
                            <div className="flex justify-center mb-3">
                                <Coins className="w-8 h-8 text-green-400" />
                            </div>
                            <div className="text-2xl font-bold text-white mb-2">
                                {filteredLotteries.reduce((sum, l) => sum + l.totalRaised, 0).toFixed(2)}
                            </div>
                            <div className="text-sm text-white/60">Total SUI Raised</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}