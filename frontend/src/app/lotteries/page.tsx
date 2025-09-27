'use client';
import { getExplorerUrl } from '@/constants/contracts';
import { useMeltyFi } from '@/hooks/useMeltyFi';
import { useCurrentAccount } from '@mysten/dapp-kit';
import {
    AlertCircle,
    ExternalLink,
    Search,
    Ticket
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

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
    const formatSuiAmount = (amount: string | number) => (Number(amount) / 1_000_000_000).toFixed(4);

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
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : isExpired
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : isSoldOut
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                        {isExpired ? 'EXPIRED' : isSoldOut ? 'SOLD OUT' : lottery.state}
                    </div>
                </div>

                {/* Lottery ID */}
                <div className="absolute top-4 right-4">
                    <div className="px-2 py-1 bg-black/50 rounded text-xs text-white/80">
                        #{lottery.lotteryId}
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Header */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-1">
                        {lottery.collateralNft?.name || 'Unknown NFT'}
                    </h3>
                    {lottery.collateralNft?.collection && (
                        <p className="text-sm text-white/60">{lottery.collateralNft.collection}</p>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <span className="text-xs text-white/60">Price per WonkaBar</span>
                        <p className="text-sm font-medium text-white">{formatSuiAmount(wonkaBarPrice)} SUI</p>
                    </div>
                    <div>
                        <span className="text-xs text-white/60">Sold</span>
                        <p className="text-sm font-medium text-white">{lottery.soldCount}/{lottery.maxSupply}</p>
                    </div>
                    <div>
                        <span className="text-xs text-white/60">Participants</span>
                        <p className="text-sm font-medium text-white">{lottery.participants}</p>
                    </div>
                    <div>
                        <span className="text-xs text-white/60">Time Left</span>
                        <p className="text-sm font-medium text-white">
                            {isExpired ? (
                                'Expired'
                            ) : daysLeft > 0 ? (
                                `${daysLeft}d ${hoursLeft}h`
                            ) : hoursLeft > 0 ? (
                                `${hoursLeft}h`
                            ) : (
                                '< 1h'
                            )}
                        </p>
                    </div>
                </div>

                {/* Purchase Section */}
                {canPurchase && (
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max={parseInt(lottery.maxSupply) - parseInt(lottery.soldCount)}
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                placeholder="Quantity"
                            />
                            <div className="text-sm text-white/60">
                                Total: {formatSuiAmount(totalCost)} SUI
                            </div>
                        </div>
                        <button
                            onClick={() => onBuyWonkaBars(lottery.id, quantity, totalCost)}
                            disabled={isBuying || !canPurchase}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            {isBuying ? 'Processing...' : 'Buy WonkaBars'}
                        </button>
                    </div>
                )}

                {/* View on Explorer */}
                <a
                    href={getExplorerUrl('object', lottery.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                    View on Explorer
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
}

export default function LotteriesPage() {
    const currentAccount = useCurrentAccount();
    const { lotteries, isLoadingLotteries, buyWonkaBars, isBuyingWonkaBars } = useMeltyFi();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterState, setFilterState] = useState<'all' | 'active' | 'expired' | 'sold-out'>('all');

    const handleBuyWonkaBars = async (lotteryId: string, quantity: number, totalCost: string) => {
        try {
            // TODO: Implement proper payment coin selection
            await buyWonkaBars({
                lotteryId,
                quantity,
                payment: 'payment_coin_id', // This needs to be implemented
            });
        } catch (error) {
            console.error('Error buying WonkaBars:', error);
        }
    };

    // Filter lotteries based on search and state
    const filteredLotteries = lotteries.filter((lottery) => {
        const matchesSearch = lottery.collateralNft?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lottery.collateralNft?.collection?.toLowerCase().includes(searchQuery.toLowerCase());

        const now = Date.now();
        const isExpired = now > lottery.expirationDate;
        const isSoldOut = parseInt(lottery.soldCount) >= parseInt(lottery.maxSupply);

        const matchesFilter =
            filterState === 'all' ||
            (filterState === 'active' && lottery.state === 'ACTIVE' && !isExpired && !isSoldOut) ||
            (filterState === 'expired' && isExpired) ||
            (filterState === 'sold-out' && isSoldOut);

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen px-6 py-12">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Explore <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Lotteries</span>
                    </h1>
                    <p className="text-xl text-white/60">
                        Browse active lotteries and purchase WonkaBars to win NFTs
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search lotteries..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'active', 'expired', 'sold-out'] as const).map((state) => (
                            <button
                                key={state}
                                onClick={() => setFilterState(state)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${filterState === state
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                {state.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {isLoadingLotteries && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        <p className="text-white/60 mt-4">Loading lotteries...</p>
                    </div>
                )}

                {/* Empty State */}
                {!isLoadingLotteries && filteredLotteries.length === 0 && (
                    <div className="text-center py-12">
                        <Ticket className="w-16 h-16 text-white/40 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                            {searchQuery || filterState !== 'all' ? 'No lotteries match your criteria' : 'No lotteries available'}
                        </h3>
                        <p className="text-white/60">
                            {searchQuery || filterState !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Check back later for new lotteries, or create your own!'
                            }
                        </p>
                    </div>
                )}

                {/* Lotteries Grid */}
                {!isLoadingLotteries && filteredLotteries.length > 0 && (
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
                )}

                {/* Connection Warning */}
                {!currentAccount && !isLoadingLotteries && (
                    <div className="mt-8 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-400" />
                            <div>
                                <h3 className="font-medium text-yellow-200">Connect Your Wallet</h3>
                                <p className="text-sm text-yellow-200/70">
                                    Connect your Sui wallet to participate in lotteries and purchase WonkaBars.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}