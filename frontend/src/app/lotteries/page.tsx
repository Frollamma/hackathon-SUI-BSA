'use client';
import { getExplorerUrl } from '@/constants/contracts';
import { useMeltyFi } from '@/hooks/useMeltyFi';
import { useCurrentAccount } from '@mysten/dapp-kit';
import {
    AlertCircle,
    ExternalLink,
    Filter,
    Loader2,
    Plus,
    Search,
    Ticket
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

// Filter options
type FilterType = 'all' | 'active' | 'expired' | 'concluded';

interface LotteryCardProps {
    lottery: any;
    onBuyWonkaBars: (lotteryId: string, quantity: number, totalCost: string) => void;
    isBuying: boolean;
    isConnected: boolean;
}

function LotteryCard({ lottery, onBuyWonkaBars, isBuying, isConnected }: LotteryCardProps) {
    const [quantity, setQuantity] = useState(1);
    const [imageError, setImageError] = useState(false);

    const wonkaBarPrice = parseInt(lottery.wonkaBarPrice);
    const totalCost = (wonkaBarPrice * quantity).toString();

    const isExpired = Date.now() > lottery.expirationDate;
    const isSoldOut = parseInt(lottery.soldCount) >= parseInt(lottery.maxSupply);
    const canPurchase = isConnected && !isExpired && !isSoldOut && lottery.state === 'ACTIVE';

    const timeLeft = lottery.expirationDate - Date.now();
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    // Check if we have a valid image URL
    const hasValidImage = lottery.collateralNft?.imageUrl &&
        lottery.collateralNft.imageUrl !== '/placeholder-nft.png' &&
        !imageError;

    return (
        <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden hover:bg-white/10 transition-all duration-300">
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

                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${lottery.state === 'ACTIVE' && !isExpired && !isSoldOut
                            ? 'bg-green-600/20 text-green-400'
                            : isExpired || lottery.state === 'CONCLUDED'
                                ? 'bg-orange-600/20 text-orange-400'
                                : isSoldOut
                                    ? 'bg-blue-600/20 text-blue-400'
                                    : 'bg-gray-600/20 text-gray-400'
                        }`}>
                        {lottery.state === 'CONCLUDED' ? 'Concluded' :
                            isExpired ? 'Expired' :
                                isSoldOut ? 'Sold Out' : 'Active'}
                    </div>
                </div>

                {/* Time Left */}
                {!isExpired && lottery.state === 'ACTIVE' && (
                    <div className="absolute top-4 right-4">
                        <div className="px-2 py-1 bg-black/50 rounded-full text-xs text-white font-medium">
                            {daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`}
                        </div>
                    </div>
                )}
            </div>

            {/* Card Content */}
            <div className="p-4 space-y-4">
                {/* NFT Name and Collection */}
                <div>
                    <h3 className="font-semibold text-white mb-1 line-clamp-1">
                        {lottery.collateralNft?.name || `Lottery #${lottery.lotteryId}`}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-white/60">
                        <span>Collection: {lottery.collateralNft?.collection || 'Unknown'}</span>
                        <span>#{lottery.lotteryId}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/60">Sold</span>
                        <span className="text-white">{lottery.soldCount}/{lottery.maxSupply}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{
                                width: `${Math.min((parseInt(lottery.soldCount) / parseInt(lottery.maxSupply)) * 100, 100)}%`
                            }}
                        />
                    </div>
                </div>

                {/* Lottery Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-white/60 block">Price per ticket</span>
                        <span className="text-white font-medium">{formatSuiAmount(lottery.wonkaBarPrice)} SUI</span>
                    </div>
                    <div>
                        <span className="text-white/60 block">Participants</span>
                        <span className="text-white font-medium">{lottery.participants}</span>
                    </div>
                </div>

                {/* Purchase Section */}
                {canPurchase && (
                    <div className="space-y-3 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white/60">Quantity</span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    -
                                </button>
                                <span className="w-8 text-center text-white font-medium">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(parseInt(lottery.maxSupply) - parseInt(lottery.soldCount), quantity + 1))}
                                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => onBuyWonkaBars(lottery.lotteryId, quantity, totalCost)}
                            disabled={isBuying}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                            {isBuying ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Buying...</span>
                                </>
                            ) : (
                                <>
                                    <span>Buy {quantity} ticket{quantity > 1 ? 's' : ''}</span>
                                    <span className="text-white/80">({formatSuiAmount(totalCost)} SUI)</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Not Available Messages */}
                {!canPurchase && (
                    <div className="text-center text-white/60 text-sm py-2">
                        {!isConnected ? 'Connect wallet to participate' :
                            isExpired ? 'Lottery expired' :
                                isSoldOut ? 'Sold out' :
                                    lottery.state !== 'ACTIVE' ? 'Lottery not active' : ''}
                    </div>
                )}

                {/* View Details Link */}
                <div className="pt-2 border-t border-white/10">
                    <Link
                        href={getExplorerUrl(lottery.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        <span>View on Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LotteriesPage() {
    const currentAccount = useCurrentAccount();
    const { lotteries, buyWonkaBars, isBuyingWonkaBars, isLoadingLotteries } = useMeltyFi();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');

    // Filter and search lotteries
    const filteredLotteries = useMemo(() => {
        let filtered = [...lotteries];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(lottery =>
                lottery.collateralNft?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lottery.collateralNft?.collection?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lottery.lotteryId.includes(searchTerm)
            );
        }

        // Apply status filter
        if (filterType !== 'all') {
            const now = Date.now();
            filtered = filtered.filter(lottery => {
                switch (filterType) {
                    case 'active':
                        return lottery.state === 'ACTIVE' && lottery.expirationDate > now &&
                            parseInt(lottery.soldCount) < parseInt(lottery.maxSupply);
                    case 'expired':
                        return lottery.expirationDate <= now && lottery.state !== 'CONCLUDED';
                    case 'concluded':
                        return lottery.state === 'CONCLUDED';
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [lotteries, searchTerm, filterType]);

    const handleBuyWonkaBars = async (lotteryId: string, quantity: number, totalCost: string) => {
        try {
            await buyWonkaBars({ lotteryId, quantity, totalCost });
        } catch (error) {
            console.error('Error buying WonkaBars:', error);
        }
    };

    if (isLoadingLotteries) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                            <p className="text-white/60">Loading lotteries...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Active Lotteries</h1>
                            <p className="text-white/60">
                                Purchase WonkaBars for a chance to win amazing NFTs
                            </p>
                        </div>
                        <Link
                            href="/create"
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Lottery</span>
                        </Link>
                    </div>

                    {/* Search and Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search by NFT name, collection, or lottery ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filter */}
                        <div className="relative">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as FilterType)}
                                className="appearance-none bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="all">All Lotteries</option>
                                <option value="active">Active</option>
                                <option value="expired">Expired</option>
                                <option value="concluded">Concluded</option>
                            </select>
                            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Lotteries Grid */}
                {filteredLotteries.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Lotteries Found</h3>
                        <p className="text-white/60 mb-6">
                            {searchTerm || filterType !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'No lotteries have been created yet.'}
                        </p>
                        {(!searchTerm && filterType === 'all') && (
                            <Link
                                href="/create"
                                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Create First Lottery</span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Results count */}
                        <div className="mb-6">
                            <p className="text-white/60 text-sm">
                                Showing {filteredLotteries.length} {filteredLotteries.length === 1 ? 'lottery' : 'lotteries'}
                                {searchTerm && ` matching "${searchTerm}"`}
                            </p>
                        </div>

                        {/* Lotteries Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredLotteries.map((lottery) => (
                                <LotteryCard
                                    key={lottery.id}
                                    lottery={lottery}
                                    onBuyWonkaBars={handleBuyWonkaBars}
                                    isBuying={isBuyingWonkaBars}
                                    isConnected={!!currentAccount}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}