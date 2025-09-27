'use client';
import { useMeltyFi } from '@/hooks/useMeltyFi';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import {
    AlertCircle,
    Calendar,
    ChevronDown,
    Coins,
    Image as ImageIcon,
    Loader2,
    Plus,
    Sparkles,
    Zap
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface NFT {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    collection?: string;
    type: string;
}

const getSafeImageUrl = (url: string): string => {
    if (!url) return '/placeholder-nft.png';
    if (url.startsWith('/')) return url;
    return url || '/placeholder-nft.png';
};

const detectUserNFTs = async (suiClient: any, ownerAddress: string): Promise<NFT[]> => {
    const nfts: NFT[] = [];

    try {
        const allObjects = await suiClient.getOwnedObjects({
            owner: ownerAddress,
            options: {
                showContent: true,
                showDisplay: true,
                showType: true,
            }
        });

        console.log(`Found ${allObjects.data.length} total objects for address ${ownerAddress}`);

        const potentialNFTs = allObjects.data.filter((obj: { data: { type: string; display: { data: any; }; content: any; }; }) => {
            if (!obj.data) return false;

            const type = obj.data.type;
            if (!type) return false;

            const hasDisplay = obj.data.display?.data;
            const hasContent = obj.data.content;

            const typeIndicatesNFT = (
                type.includes('::nft::') ||
                type.includes('::NFT') ||
                type.includes('display') ||
                type.includes('Display') ||
                (hasDisplay && (hasDisplay.name || hasDisplay.description || hasDisplay.image_url))
            );

            const isNotCoin = !type.includes('::coin::Coin');
            const isNotSystemObject = !type.startsWith('0x2::');

            return typeIndicatesNFT && isNotCoin && isNotSystemObject;
        });

        console.log(`Found ${potentialNFTs.length} potential NFTs after filtering`);

        for (const obj of potentialNFTs) {
            try {
                const display = obj.data.display?.data;
                const content = obj.data.content;

                const name = display?.name || content?.name || `NFT ${obj.data.objectId?.slice(0, 8)}`;
                const description = display?.description || content?.description || 'NFT from your collection';
                const imageUrl = display?.image_url || content?.image_url || display?.url || content?.url || '';

                const collectionType = obj.data.type;
                const collection = collectionType.split('::')[0] + '::' + collectionType.split('::')[1];

                const nft: NFT = {
                    id: obj.data.objectId,
                    name: String(name),
                    description: String(description),
                    imageUrl: getSafeImageUrl(String(imageUrl)),
                    collection: collection,
                    type: obj.data.type
                };

                nfts.push(nft);
            } catch (error) {
                console.warn('Error processing NFT object:', error);
            }
        }

        console.log(`Successfully processed ${nfts.length} NFTs`);
        return nfts;
    } catch (error) {
        console.error('Error detecting NFTs:', error);
        return [];
    }
};

export default function CreatePage() {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { createLottery, isCreatingLottery } = useMeltyFi();

    const [nfts, setNfts] = useState<NFT[]>([]);
    const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
    const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
    const [showNFTGrid, setShowNFTGrid] = useState(false);

    // Form state
    const [wonkabarPrice, setWonkabarPrice] = useState('');
    const [maxSupply, setMaxSupply] = useState('');
    const [duration, setDuration] = useState('');

    useEffect(() => {
        if (currentAccount?.address) {
            loadUserNFTs();
        }
    }, [currentAccount?.address]);

    const loadUserNFTs = async () => {
        if (!currentAccount?.address) return;

        setIsLoadingNFTs(true);
        try {
            const userNFTs = await detectUserNFTs(suiClient, currentAccount.address);
            setNfts(userNFTs);
        } catch (error) {
            console.error('Failed to load NFTs:', error);
        } finally {
            setIsLoadingNFTs(false);
        }
    };

    const handleCreateLottery = async () => {
        if (!selectedNFT || !wonkabarPrice || !maxSupply || !duration) {
            alert('Please fill in all fields');
            return;
        }

        try {
            // Validate inputs
            const price = parseFloat(wonkabarPrice);
            const supply = parseInt(maxSupply);
            const durationDays = parseFloat(duration);

            if (isNaN(price) || price <= 0) {
                alert('Please enter a valid WonkaBar price');
                return;
            }
            if (isNaN(supply) || supply <= 0) {
                alert('Please enter a valid max supply');
                return;
            }
            if (isNaN(durationDays) || durationDays <= 0) {
                alert('Please select a valid duration');
                return;
            }

            console.log('Creating lottery with parameters:', {
                nftId: selectedNFT.id,
                wonkaBarPrice: wonkabarPrice, // Pass as SUI string, hook will convert to MIST
                maxSupply: supply,
                duration: durationDays
            });

            await createLottery({
                nftId: selectedNFT.id,
                wonkaBarPrice: wonkabarPrice, // Pass as SUI string (e.g., "0.1")
                maxSupply: supply, // Pass as number
                duration: durationDays // Pass as number of days
            });

            // Reset form after successful creation
            setSelectedNFT(null);
            setWonkabarPrice('');
            setMaxSupply('');
            setDuration('');

            alert('Lottery created successfully!');

        } catch (error) {
            console.error('Failed to create lottery:', error);
            alert(`Failed to create lottery: ${typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: string }).message : String(error)}`);
        }
    };

    if (!currentAccount) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="text-center max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Zap className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
                    <p className="text-white/60 mb-8">
                        Connect your Sui wallet to start creating lotteries with your NFTs.
                    </p>
                    <div className="p-6 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm">
                        <p className="text-white/80 text-sm">
                            Click the Connect Wallet button in the top navigation to get started.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-6 py-12">
            <div className="container mx-auto max-w-6xl">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-300 text-sm font-medium">Create New Lottery</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Turn Your NFT Into
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Instant Liquidity</span>
                    </h1>
                    <p className="text-xl text-white/60 max-w-2xl mx-auto">
                        Create a lottery with your NFT as the prize and receive immediate liquidity.
                        Set your terms and let the community participate.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* NFT Selection Panel */}
                    <div className="space-y-6">
                        <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                                <ImageIcon className="w-6 h-6 text-purple-400" />
                                Select Your NFT
                            </h2>

                            {!selectedNFT ? (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setShowNFTGrid(!showNFTGrid)}
                                        disabled={isLoadingNFTs}
                                        className="w-full p-4 border-2 border-dashed border-white/20 hover:border-purple-400/50 rounded-lg transition-colors group"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            {isLoadingNFTs ? (
                                                <Loader2 className="w-12 h-12 text-white/40 animate-spin" />
                                            ) : (
                                                <Plus className="w-12 h-12 text-white/40 group-hover:text-purple-400 transition-colors" />
                                            )}
                                            <div className="text-center">
                                                <p className="text-white font-medium mb-1">
                                                    {isLoadingNFTs ? 'Loading your NFTs...' : 'Choose an NFT'}
                                                </p>
                                                <p className="text-white/60 text-sm">
                                                    {isLoadingNFTs ? 'Please wait while we scan your wallet' : `Found ${nfts.length} NFTs in your wallet`}
                                                </p>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${showNFTGrid ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    {showNFTGrid && nfts.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
                                            {nfts.map((nft) => (
                                                <button
                                                    key={nft.id}
                                                    onClick={() => {
                                                        setSelectedNFT(nft);
                                                        setShowNFTGrid(false);
                                                    }}
                                                    className="group p-3 rounded-lg border border-white/10 hover:border-purple-400/50 bg-white/5 hover:bg-white/10 transition-all"
                                                >
                                                    <div className="aspect-square relative mb-2 rounded-lg overflow-hidden">
                                                        <Image
                                                            src={getSafeImageUrl(nft.imageUrl)}
                                                            alt={nft.name}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform"
                                                            unoptimized
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = '/placeholder-nft.png';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-white text-sm font-medium truncate" title={nft.name}>
                                                            {nft.name}
                                                        </p>
                                                        {nft.collection && (
                                                            <p className="text-purple-300 text-xs truncate" title={nft.collection}>
                                                                {nft.collection.length > 20 ? `${nft.collection.slice(0, 20)}...` : nft.collection}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {showNFTGrid && nfts.length === 0 && !isLoadingNFTs && (
                                        <div className="text-center py-8">
                                            <ImageIcon className="w-12 h-12 text-white/40 mx-auto mb-3" />
                                            <p className="text-white/60">No NFTs found in your wallet</p>
                                            <button
                                                onClick={loadUserNFTs}
                                                className="text-purple-400 hover:text-purple-300 text-sm mt-2"
                                            >
                                                Refresh
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg border border-purple-400/30 bg-purple-500/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                            <Image
                                                src={getSafeImageUrl(selectedNFT.imageUrl)}
                                                alt={selectedNFT.name}
                                                width={80}
                                                height={80}
                                                className="w-full h-full object-cover"
                                                unoptimized
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/placeholder-nft.png';
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-semibold text-white mb-2" title={selectedNFT.name}>
                                                {selectedNFT.name}
                                            </h3>
                                            <div className="space-y-2">
                                                {selectedNFT.collection && (
                                                    <div>
                                                        <p className="text-purple-300 text-sm font-medium" title={selectedNFT.collection}>
                                                            Collection: {selectedNFT.collection.length > 30 ? `${selectedNFT.collection.slice(0, 30)}...` : selectedNFT.collection}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedNFT(null)}
                                            className="text-white/60 hover:text-white/80 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lottery Configuration Panel */}
                    <div className="space-y-6">
                        <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                                <Coins className="w-6 h-6 text-purple-400" />
                                Lottery Settings
                            </h2>

                            <div className="space-y-6">
                                {/* WonkaBar Price */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        WonkaBar Price
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={wonkabarPrice}
                                            onChange={(e) => setWonkabarPrice(e.target.value)}
                                            placeholder="0.1"
                                            className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">SUI</span>
                                    </div>
                                    <p className="text-white/60 text-sm mt-2">
                                        Price per lottery ticket in SUI tokens
                                    </p>
                                </div>

                                {/* Max Supply */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Maximum Tickets
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={maxSupply}
                                        onChange={(e) => setMaxSupply(e.target.value)}
                                        placeholder="1000"
                                        className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                                    />
                                    <p className="text-white/60 text-sm mt-2">
                                        Total number of tickets available for purchase
                                    </p>
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="block text-white font-medium mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Lottery Duration
                                    </label>
                                    <select
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 appearance-none cursor-pointer"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right 1rem center',
                                            backgroundSize: '1.5em 1.5em',
                                            paddingRight: '3rem'
                                        }}
                                    >
                                        <option value="" disabled className="bg-gray-900">Select duration</option>
                                        <option value="0.00347222" className="bg-gray-900">5 Minutes (Testing)</option>
                                        <option value="1" className="bg-gray-900">1 Day</option>
                                        <option value="7" className="bg-gray-900">7 Days</option>
                                        <option value="30" className="bg-gray-900">30 Days</option>
                                        <option value="90" className="bg-gray-900">90 Days</option>
                                    </select>
                                    <p className="text-white/60 text-sm mt-2">
                                        Choose how long the lottery will run
                                    </p>
                                </div>
                            </div>

                            {/* Lottery Preview */}
                            {wonkabarPrice && maxSupply && (
                                <div className="mt-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                    <h3 className="text-white font-medium mb-3">Lottery Preview</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-white/80">
                                            <span>Total Potential Revenue:</span>
                                            <span className="font-medium">{(parseFloat(wonkabarPrice || '0') * parseInt(maxSupply || '0')).toFixed(2)} SUI</span>
                                        </div>
                                        <div className="flex justify-between text-white/80">
                                            <span>You Receive Upfront (95%):</span>
                                            <span className="font-medium text-green-400">
                                                {(parseFloat(wonkabarPrice || '0') * parseInt(maxSupply || '0') * 0.95).toFixed(2)} SUI
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-white/60">
                                            <span>Protocol Fee (5%):</span>
                                            <span>{(parseFloat(wonkabarPrice || '0') * parseInt(maxSupply || '0') * 0.05).toFixed(2)} SUI</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Important Notice */}
                            <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-yellow-300 font-medium mb-2">Important Notice</h3>
                                        <ul className="text-yellow-200/80 text-sm space-y-1">
                                            <li>• You receive 95% of potential funds immediately</li>
                                            <li>• Your NFT is held in escrow until lottery ends</li>
                                            <li>• You can repay to reclaim your NFT anytime</li>
                                            <li>• If lottery completes, winner gets the NFT</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Create Button */}
                            <button
                                onClick={handleCreateLottery}
                                disabled={!selectedNFT || !wonkabarPrice || !maxSupply || !duration || isCreatingLottery}
                                className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {isCreatingLottery ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating Lottery...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Create Lottery
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}