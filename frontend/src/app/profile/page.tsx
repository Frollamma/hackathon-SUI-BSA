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

    return (
        <div className="group hover:shadow-lg transition-all duration-300 overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg">
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
                <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 text-xs font-medium bg-purple-600/80 text-white rounded-full">
                        Your Lottery
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <div>
                    <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">
                        {lottery.collateralNft?.name || `Lottery #${lottery.lotteryId}`}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-white/60">
                        <span>#{lottery.lotteryId}</span>
                        <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {daysLeft}d left
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-white/60">Price per bar:</span>
                        <span className="text-white font-medium">{wonkaBarPrice.toFixed(4)} SUI</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/60">Total raised:</span>
                        <span className="text-white font-medium">{totalRaised.toFixed(2)} SUI</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-white/60">
                        <span>{progressPercentage.toFixed(1)}% filled</span>
                        <span>{lottery.soldCount}/{lottery.maxSupply} sold</span>
                    </div>
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

    return (
        <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg p-4 hover:bg-white/10 transition-colors">
            {/* Lottery Image */}
            <div className="relative aspect-video overflow-hidden rounded-md mb-3">
                {!imageError && lottery.collateralNft?.imageUrl ? (
                    <Image
                        src={lottery.collateralNft.imageUrl}
                        alt={lottery.collateralNft.name || 'NFT'}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-white/40" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                    {getStatusBadge()}
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
                <div>
                    <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">
                        {lottery.collateralNft?.name || `Lottery #${lottery.lotteryId}`}
                    </h3>
                    <p className="text-xs text-white/60">
                        Lottery #{lottery.lotteryId}
                    </p>
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
                lottery.lotteryId.toString().includes(lotterySearch)
            );
        }

        // Apply status filter
        if (lotteryFilter !== 'all') {
            filtered = filtered.filter(lottery => {
                const isExpired = lottery.expirationDate < Date.now();
                const isConcluded = lottery.state === 'CONCLUDED';

                switch (lotteryFilter) {
                    case 'active':
                        return !isExpired && !isConcluded;
                    case 'expired':
                        return isExpired && !isConcluded;
                    case 'concluded':
                        return isConcluded;
                    default:
                        return true;
                }
            });
        }

        return filtered;
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
                    wonkaBar.lotteryId.toString().includes(wonkaBarSearch);
            });
        }

        // Apply status filter
        if (wonkaBarFilter !== 'all') {
            filtered = filtered.filter(wonkaBar => {
                const lottery = lotteries.find(l => l.lotteryId === wonkaBar.lotteryId);
                if (!lottery) return false;

                const isExpired = lottery.expirationDate < Date.now();
                const isConcluded = lottery.state === 'CONCLUDED';

                switch (wonkaBarFilter) {
                    case 'active':
                        return !isExpired && !isConcluded;
                    case 'expired':
                        return isExpired && !isConcluded;
                    case 'concluded':
                        return isConcluded;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [userWonkaBars, lotteries, wonkaBarSearch, wonkaBarFilter]);

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
                            {filteredUserLotteries.length}
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

                    {/* Active Lotteries */}
                    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Clock className="w-8 h-8 text-green-400" />
                            <span className="text-sm text-white/60">Active</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {filteredUserLotteries.filter(l => l.state === 'ACTIVE' && l.expirationDate > Date.now()).length}
                        </div>
                        <div className="text-sm text-white/60">
                            Currently running
                        </div>
                    </div>

                    {/* Balance */}
                    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-2xl">🍫</span>
                            <span className="text-sm text-white/60">CHOC</span>
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
                                    id: 'my-lotteries',
                                    label: 'My Lotteries',
                                    icon: <Trophy className="w-5 h-5" />,
                                    description: 'Lotteries you created'
                                },
                                {
                                    id: 'my-wonkabars',
                                    label: 'My WonkaBars',
                                    icon: <Ticket className="w-5 h-5" />,
                                    description: 'Lottery tickets you bought'
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
                    {/* My Lotteries Tab */}
                    {activeTab === 'my-lotteries' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">My Lotteries</h2>
                                    <p className="text-white/60 mt-1">
                                        Manage the lotteries you created
                                    </p>
                                </div>
                            </div>

                            {/* Filters for My Lotteries */}
                            <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search your lotteries..."
                                        value={lotterySearch}
                                        onChange={(e) => setLotterySearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                                    />
                                </div>
                                <select
                                    value={lotteryFilter}
                                    onChange={(e) => setLotteryFilter(e.target.value as FilterType)}
                                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                    <option value="concluded">Concluded</option>
                                </select>
                            </div>

                            {isLoadingLotteries ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                                </div>
                            ) : filteredUserLotteries.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredUserLotteries.map((lottery) => (
                                        <MyLotteryCard
                                            key={lottery.lotteryId}
                                            lottery={lottery}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center">
                                    <Trophy className="w-12 h-12 text-white/40 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        {lotterySearch || lotteryFilter !== 'all' ? 'No matching lotteries' : 'No lotteries created yet'}
                                    </h3>
                                    <p className="text-white/60 mb-6">
                                        {lotterySearch || lotteryFilter !== 'all'
                                            ? 'Try adjusting your search or filter criteria.'
                                            : 'Create your first lottery to unlock NFT liquidity!'
                                        }
                                    </p>
                                    {(!lotterySearch && lotteryFilter === 'all') && (
                                        <Link href="/create">
                                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center justify-center mx-auto">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create First Lottery
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* My WonkaBars Tab */}
                    {activeTab === 'my-wonkabars' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">My WonkaBars</h2>
                                    <p className="text-white/60 mt-1">
                                        Track your lottery tickets and win chances
                                    </p>
                                </div>
                            </div>

                            {/* Filters for My WonkaBars */}
                            <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search your tickets..."
                                        value={wonkaBarSearch}
                                        onChange={(e) => setWonkaBarSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                                    />
                                </div>
                                <select
                                    value={wonkaBarFilter}
                                    onChange={(e) => setWonkaBarFilter(e.target.value as FilterType)}
                                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                    <option value="concluded">Concluded</option>
                                </select>
                            </div>

                            {isLoadingWonkaBars ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                                </div>
                            ) : filteredUserWonkaBars.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredUserWonkaBars.map((wonkaBar) => (
                                        <WonkaBarCard key={wonkaBar.id} wonkaBar={wonkaBar} />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center">
                                    <Ticket className="w-12 h-12 text-white/40 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        {wonkaBarSearch || wonkaBarFilter !== 'all' ? 'No matching tickets' : 'No WonkaBars yet'}
                                    </h3>
                                    <p className="text-white/60 mb-6">
                                        {wonkaBarSearch || wonkaBarFilter !== 'all'
                                            ? 'Try adjusting your search or filter criteria.'
                                            : 'Purchase WonkaBars from active lotteries to start winning NFTs!'
                                        }
                                    </p>
                                    {(!wonkaBarSearch && wonkaBarFilter === 'all') && (
                                        <div className="flex gap-4 justify-center">
                                            <Link href="/lotteries">
                                                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center">
                                                    <Ticket className="w-4 h-4 mr-2" />
                                                    Browse Lotteries
                                                </button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}