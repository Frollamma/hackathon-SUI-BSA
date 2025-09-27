'use client';

import { getExplorerUrl } from '@/constants/contracts';
import { useMeltyFi } from '@/hooks/useMeltyFi';
import { shortenAddress } from '@/lib/utils';
import { useCurrentAccount } from '@mysten/dapp-kit';
import {
    Check,
    Clock,
    Copy,
    ExternalLink,
    Filter,
    Loader2,
    Plus,
    Search,
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

// Filter options
type FilterType = 'all' | 'active' | 'expired' | 'concluded';

// My Lottery Card Component
function MyLotteryCard({ lottery }: { lottery: any }) {
    const [imageError, setImageError] = useState(false);

    const progressPercentage = (parseInt(lottery.soldCount) / parseInt(lottery.maxSupply)) * 100;
    const daysLeft = getDaysLeft(lottery.expirationDate);
    const isExpired = lottery.expirationDate < Date.now();
    const isSoldOut = parseInt(lottery.soldCount) >= parseInt(lottery.maxSupply);
    const wonkaBarPrice = parseFloat(formatSuiAmount(lottery.wonkaBarPrice));
    const totalRaised = wonkaBarPrice * parseInt(lottery.soldCount);

    const getStatusBadge = () => {
        if (lottery.state === 'CONCLUDED') {
            return <span className="px-2 py-1 text-xs font-medium bg-green-600/20 text-green-400 rounded-full">Concluded</span>;
        }
        if (isExpired) {
            return <span className="px-2 py-1 text-xs font-medium bg-orange-600/20 text-orange-400 rounded-full">Expired</span>;
        }
        if (isSoldOut) {
            return <span className="px-2 py-1 text-xs font-medium bg-blue-600/20 text-blue-400 rounded-full">Sold Out</span>;
        }
        return <span className="px-2 py-1 text-xs font-medium bg-purple-600/20 text-purple-400 rounded-full">Active</span>;
    };

    // Check if we have valid NFT image data
    const hasValidImage = lottery.collateralNft?.imageUrl &&
        lottery.collateralNft.imageUrl !== '/placeholder-nft.png' &&
        !imageError;

    return (
        <div className="group hover:shadow-lg transition-all duration-300 overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg">
            {/* NFT Image */}
            <div className="relative aspect-square overflow-hidden">
                {hasValidImage ? (
                    <Image
                        src={lottery.collateralNft.imageUrl}
                        alt={lottery.collateralNft?.name || 'NFT'}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => setImageError(true)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        unoptimized
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                        <Trophy className="w-12 h-12 text-white/40" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                    {getStatusBadge()}
                </div>

                {/* Time Left (if active) */}
                {lottery.state === 'ACTIVE' && !isExpired && (
                    <div className="absolute top-2 right-2">
                        <div className="px-2 py-1 bg-black/60 rounded-full text-xs text-white font-medium">
                            {daysLeft > 0 ? `${daysLeft}d left` : 'Ending soon'}
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* NFT Name and Collection Info */}
                <div>
                    <h3 className="font-semibold text-white text-lg mb-1 line-clamp-1">
                        {lottery.collateralNft?.name || `Lottery #${lottery.lotteryId}`}
                    </h3>
                    <div className="space-y-1">
                        <p className="text-sm text-white/60">
                            Collection: {lottery.collateralNft?.collection || 'Unknown'}
                        </p>
                        <p className="text-xs text-white/50">
                            Lottery #{lottery.lotteryId}
                        </p>
                    </div>
                </div>

                {/* Progress Info */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/60">Tickets Sold</span>
                        <span className="text-white font-medium">{lottery.soldCount}/{lottery.maxSupply}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Financial Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/5 rounded-lg p-2">
                        <span className="text-white/60 block text-xs">Price per ticket</span>
                        <span className="text-white font-medium">{formatSuiAmount(lottery.wonkaBarPrice)} SUI</span>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                        <span className="text-white/60 block text-xs">Total raised</span>
                        <span className="text-white font-medium">{totalRaised.toFixed(2)} SUI</span>
                    </div>
                </div>

                {/* Winner Info (if concluded) */}
                {lottery.state === 'CONCLUDED' && lottery.winner && (
                    <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            <Trophy className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">
                                Winner: {shortenAddress(lottery.winner)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                    <Link
                        href={getExplorerUrl(lottery.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                    >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// WonkaBar Card Component
function WonkaBarCard({ wonkaBar }: { wonkaBar: any }) {
    const { lotteries } = useMeltyFi();
    const [imageError, setImageError] = useState(false);

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
    const ticketCount = parseInt(wonkaBar.ticketCount || '1');
    const winChance = ((ticketCount / parseInt(lottery.maxSupply)) * 100);

    const getStatusBadge = () => {
        if (isConcluded) {
            return <span className="px-2 py-1 text-xs font-medium bg-green-600/20 text-green-400 rounded-full">Concluded</span>;
        }
        if (isExpired) {
            return <span className="px-2 py-1 text-xs font-medium bg-orange-600/20 text-orange-400 rounded-full">Expired</span>;
        }
        return <span className="px-2 py-1 text-xs font-medium bg-purple-600/20 text-purple-400 rounded-full">Active</span>;
    };

    // Check if we have valid NFT image data
    const hasValidImage = lottery.collateralNft?.imageUrl &&
        lottery.collateralNft.imageUrl !== '/placeholder-nft.png' &&
        !imageError;

    return (
        <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg p-4 hover:bg-white/10 transition-colors">
            {/* Lottery Image */}
            <div className="relative aspect-video overflow-hidden rounded-md mb-3">
                {hasValidImage ? (
                    <Image
                        src={lottery.collateralNft.imageUrl}
                        alt={lottery.collateralNft?.name || 'NFT'}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        unoptimized
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center rounded-md">
                        <Ticket className="w-8 h-8 text-white/40" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                    {getStatusBadge()}
                </div>
            </div>

            {/* NFT and Lottery Info */}
            <div className="space-y-3">
                <div>
                    <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">
                        {lottery.collateralNft?.name || `Lottery #${lottery.lotteryId}`}
                    </h3>
                    <div className="space-y-1">
                        <p className="text-xs text-white/60">
                            Collection: {lottery.collateralNft?.collection || 'Unknown'}
                        </p>
                        <p className="text-xs text-white/50">
                            Lottery #{lottery.lotteryId}
                        </p>
                    </div>
                </div>

                {/* WonkaBar Info */}
                <div className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-white/60">Your Tickets:</span>
                        <span className="text-sm font-medium text-white">{ticketCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-white/60">Win Chance:</span>
                        <span className="text-sm font-medium text-purple-400">{winChance.toFixed(2)}%</span>
                    </div>
                    {wonkaBar.ticketRange && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-white/60">Ticket Range:</span>
                            <span className="text-xs font-mono text-white/80">
                                {wonkaBar.ticketRange.start}-{wonkaBar.ticketRange.end}
                            </span>
                        </div>
                    )}
                </div>

                {/* Winner Status */}
                {isConcluded && lottery.winner && (
                    <div className={`text-center p-2 rounded-lg ${lottery.winner === wonkaBar.owner
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-gray-600/20 text-gray-400'
                        }`}>
                        <span className="text-xs font-medium">
                            {lottery.winner === wonkaBar.owner ? '🎉 Winner!' : 'Not winner'}
                        </span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                    <Link
                        href={getExplorerUrl(wonkaBar.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                    >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Main Profile Page Component
export default function ProfilePage() {
    const currentAccount = useCurrentAccount();
    const { userStats, lotteries, userWonkaBars, isLoadingLotteries, isLoadingWonkaBars } = useMeltyFi();

    const [copiedAddress, setCopiedAddress] = useState(false);
    const [activeTab, setActiveTab] = useState<'my-lotteries' | 'my-wonkabars'>('my-lotteries');

    // Filters for my lotteries
    const [lotteryFilter, setLotteryFilter] = useState<FilterType>('all');
    const [lotterySearch, setLotterySearch] = useState('');

    // Filters for my wonkabars
    const [wonkaBarFilter, setWonkaBarFilter] = useState<FilterType>('all');
    const [wonkaBarSearch, setWonkaBarSearch] = useState('');

    const copyAddress = async () => {
        if (currentAccount?.address) {
            await navigator.clipboard.writeText(currentAccount.address);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

    // Process user's lotteries with filters
    const filteredUserLotteries = useMemo(() => {
        if (!lotteries || !currentAccount) return [];

        let filtered = lotteries.filter(lottery => lottery.owner === currentAccount.address);

        // Apply search filter
        if (lotterySearch) {
            filtered = filtered.filter(lottery =>
                lottery.collateralNft?.name?.toLowerCase().includes(lotterySearch.toLowerCase()) ||
                lottery.collateralNft?.collection?.toLowerCase().includes(lotterySearch.toLowerCase()) ||
                lottery.lotteryId.includes(lotterySearch)
            );
        }

        // Apply status filter
        if (lotteryFilter !== 'all') {
            const now = Date.now();
            filtered = filtered.filter(lottery => {
                switch (lotteryFilter) {
                    case 'active':
                        return lottery.state === 'ACTIVE' && lottery.expirationDate > now;
                    case 'expired':
                        return lottery.expirationDate <= now && lottery.state !== 'CONCLUDED';
                    case 'concluded':
                        return lottery.state === 'CONCLUDED';
                    default:
                        return true;
                }
            });
        }

        return filtered.sort((a, b) => b.createdAt - a.createdAt);
    }, [lotteries, currentAccount, lotterySearch, lotteryFilter]);

    // Process user's wonkabars with filters
    const filteredUserWonkaBars = useMemo(() => {
        if (!userWonkaBars || !lotteries) return [];

        let filtered = [...userWonkaBars];

        // Apply search filter
        if (wonkaBarSearch) {
            filtered = filtered.filter(wonkaBar => {
                const lottery = lotteries.find(l => l.lotteryId === wonkaBar.lotteryId);
                return lottery?.collateralNft?.name?.toLowerCase().includes(wonkaBarSearch.toLowerCase()) ||
                    lottery?.collateralNft?.collection?.toLowerCase().includes(wonkaBarSearch.toLowerCase()) ||
                    wonkaBar.lotteryId.includes(wonkaBarSearch);
            });
        }

        // Apply status filter
        if (wonkaBarFilter !== 'all') {
            filtered = filtered.filter(wonkaBar => {
                const lottery = lotteries.find(l => l.lotteryId === wonkaBar.lotteryId);
                if (!lottery) return false;

                const now = Date.now();
                switch (wonkaBarFilter) {
                    case 'active':
                        return lottery.state === 'ACTIVE' && lottery.expirationDate > now;
                    case 'expired':
                        return lottery.expirationDate <= now && lottery.state !== 'CONCLUDED';
                    case 'concluded':
                        return lottery.state === 'CONCLUDED';
                    default:
                        return true;
                }
            });
        }

        return filtered.sort((a, b) => b.purchasedAt - a.purchasedAt);
    }, [userWonkaBars, lotteries, wonkaBarSearch, wonkaBarFilter]);

    if (!currentAccount) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="text-center">
                    <User className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
                    <p className="text-white/60">Please connect your wallet to view your profile</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div className="container mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* User Info */}
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">My Profile</h1>
                                <div className="flex items-center space-x-2">
                                    <span className="text-white/60 font-mono text-sm">
                                        {shortenAddress(currentAccount.address)}
                                    </span>
                                    <button
                                        onClick={copyAddress}
                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                    >
                                        {copiedAddress ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-white/40" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                <Trophy className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                                <div className="text-lg font-bold text-white">{userStats?.activeLotteries || 0}</div>
                                <div className="text-xs text-white/60">Active Lotteries</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                <Ticket className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                                <div className="text-lg font-bold text-white">{userStats?.totalWonkaBars || 0}</div>
                                <div className="text-xs text-white/60">WonkaBars</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                <Wallet className="w-5 h-5 text-green-400 mx-auto mb-1" />
                                <div className="text-lg font-bold text-white">{formatSuiAmount(userStats?.suiBalance || '0')}</div>
                                <div className="text-xs text-white/60">SUI</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 text-center">
                                <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mx-auto mb-1"></div>
                                <div className="text-lg font-bold text-white">{formatChocoChips(userStats?.chocoChipBalance || '0')}</div>
                                <div className="text-xs text-white/60">ChocoChips</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-lg p-1 mb-6">
                    <button
                        onClick={() => setActiveTab('my-lotteries')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'my-lotteries'
                                ? 'bg-purple-500 text-white'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        My Lotteries ({filteredUserLotteries.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('my-wonkabars')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'my-wonkabars'
                                ? 'bg-purple-500 text-white'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        My WonkaBars ({filteredUserWonkaBars.length})
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'my-lotteries' ? (
                    <div>
                        {/* Search and Filter for Lotteries */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search your lotteries..."
                                    value={lotterySearch}
                                    onChange={(e) => setLotterySearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div className="relative">
                                <select
                                    value={lotteryFilter}
                                    onChange={(e) => setLotteryFilter(e.target.value as FilterType)}
                                    className="appearance-none bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                    <option value="concluded">Concluded</option>
                                </select>
                                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                            </div>
                        </div>

                        {/* My Lotteries Grid */}
                        {isLoadingLotteries ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                            </div>
                        ) : filteredUserLotteries.length === 0 ? (
                            <div className="text-center py-12">
                                <Trophy className="w-12 h-12 text-white/40 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">No Lotteries Found</h3>
                                <p className="text-white/60 mb-6">
                                    {lotterySearch || lotteryFilter !== 'all'
                                        ? 'Try adjusting your search or filter criteria.'
                                        : "You haven't created any lotteries yet."}
                                </p>
                                {(!lotterySearch && lotteryFilter === 'all') && (
                                    <Link
                                        href="/create"
                                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Create Your First Lottery</span>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredUserLotteries.map((lottery) => (
                                    <MyLotteryCard key={lottery.id} lottery={lottery} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {/* Search and Filter for WonkaBars */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search your WonkaBars..."
                                    value={wonkaBarSearch}
                                    onChange={(e) => setWonkaBarSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div className="relative">
                                <select
                                    value={wonkaBarFilter}
                                    onChange={(e) => setWonkaBarFilter(e.target.value as FilterType)}
                                    className="appearance-none bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                    <option value="concluded">Concluded</option>
                                </select>
                                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                            </div>
                        </div>

                        {/* My WonkaBars Grid */}
                        {isLoadingWonkaBars ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                            </div>
                        ) : filteredUserWonkaBars.length === 0 ? (
                            <div className="text-center py-12">
                                <Ticket className="w-12 h-12 text-white/40 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">No WonkaBars Found</h3>
                                <p className="text-white/60 mb-6">
                                    {wonkaBarSearch || wonkaBarFilter !== 'all'
                                        ? 'Try adjusting your search or filter criteria.'
                                        : "You haven't purchased any WonkaBars yet."}
                                </p>
                                {(!wonkaBarSearch && wonkaBarFilter === 'all') && (
                                    <Link
                                        href="/lotteries"
                                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                                    >
                                        <Ticket className="w-4 h-4" />
                                        <span>Browse Lotteries</span>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredUserWonkaBars.map((wonkaBar) => (
                                    <WonkaBarCard key={wonkaBar.id} wonkaBar={wonkaBar} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Quick Actions */}
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center space-x-4 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                        <span className="text-white/60">Quick Actions:</span>
                        <Link
                            href="/create"
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Lottery</span>
                        </Link>
                        <Link
                            href="/lotteries"
                            className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                            <Search className="w-4 h-4" />
                            <span>Browse Lotteries</span>
                        </Link>
                        <Link
                            href={getExplorerUrl(currentAccount.address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>View on Explorer</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}