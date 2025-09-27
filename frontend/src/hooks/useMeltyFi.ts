'use client';

import {
    CHOCO_CHIP_TYPE,
    MELTYFI_PACKAGE_ID,
    PROTOCOL_OBJECT_ID,
    WONKA_BAR_TYPE
} from '@/constants/contracts';
import {
    useCurrentAccount,
    useSignAndExecuteTransaction,
    useSuiClient
} from '@mysten/dapp-kit';
import type { SuiObjectResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

export interface Lottery {
    id: string;
    lotteryId: string;
    owner: string;
    state: 'ACTIVE' | 'CANCELLED' | 'CONCLUDED';
    createdAt: number;
    expirationDate: number;
    wonkaBarPrice: string;
    maxSupply: string;
    soldCount: string;
    totalRaised: string;
    winner?: string;
    winningTicket?: string;
    collateralNft: {
        id: string;
        name: string;
        imageUrl: string;
        collection?: string;
        type?: string;
    };
    participants: number;
}

export interface WonkaBar {
    id: string;
    lotteryId: string;
    owner: string;
    ticketCount: string;
    purchasedAt: number;
}

export interface UserStats {
    activeLotteries: number;
    totalLotteries: number;
    totalWonkaBars: number;
    chocoChipBalance: string;
    suiBalance: string;
}

// Helper function to parse object content
function parseObjectContent(obj: SuiObjectResponse): any {
    if (obj.data?.content?.dataType === 'moveObject') {
        return (obj.data.content as any).fields;
    }
    return null;
}

// Parse WonkaBar object
function parseWonkaBar(obj: SuiObjectResponse): WonkaBar | null {
    const fields = parseObjectContent(obj);
    if (!fields || !obj.data?.objectId) return null;

    try {
        return {
            id: obj.data.objectId,
            lotteryId: fields.lottery_id?.toString() || '0',
            owner: fields.owner || '',
            ticketCount: fields.ticket_count?.toString() || '1',
            purchasedAt: parseInt(fields.purchased_at || '0')
        };
    } catch (error) {
        console.error('Error parsing WonkaBar:', error);
        return null;
    }
}

// NEW: Helper function to fetch NFT details from object ID
async function fetchNFTDetails(suiClient: any, nftId: string) {
    try {
        const nftObject = await suiClient.getObject({
            id: nftId,
            options: {
                showContent: true,
                showDisplay: true,
                showType: true,
            }
        });

        if (!nftObject.data) {
            return {
                id: nftId,
                name: 'Unknown NFT',
                imageUrl: '/placeholder-nft.png',
                collection: 'Unknown'
            };
        }

        const display = nftObject.data.display?.data;
        const content = nftObject.data.content as any;

        const name = display?.name || content?.fields?.name || 'Unknown NFT';
        const imageUrl = display?.image_url || content?.fields?.image_url || display?.url || content?.fields?.url || '';
        const type = nftObject.data.type || '';
        const collection = type.split('::').slice(0, 2).join('::') || 'Unknown';

        return {
            id: nftId,
            name: String(name),
            imageUrl: imageUrl || '/placeholder-nft.png',
            collection,
            type
        };
    } catch (error) {
        console.error('Error fetching NFT details:', error);
        return {
            id: nftId,
            name: 'Unknown NFT',
            imageUrl: '/placeholder-nft.png',
            collection: 'Unknown'
        };
    }
}

export function useMeltyFi() {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    // Fetch all lotteries - UPDATED WITH NFT IMAGE FIX
    const { data: lotteries = [], isLoading: isLoadingLotteries } = useQuery({
        queryKey: ['lotteries'],
        queryFn: async () => {
            try {
                // Fetch lottery creation events
                const objects = await suiClient.queryEvents({
                    query: {
                        MoveEventType: `${MELTYFI_PACKAGE_ID}::core::LotteryCreated`
                    },
                    limit: 100,
                    order: 'descending'
                });

                // Get lottery objects from events
                const lotteryPromises = objects.data.map(async (event) => {
                    try {
                        const parsedJson = event.parsedJson as any;
                        if (parsedJson?.lottery_id) {
                            // Fetch the actual NFT details using the nft_id from the event
                            const nftDetails = parsedJson.nft_id
                                ? await fetchNFTDetails(suiClient, parsedJson.nft_id)
                                : {
                                    id: 'nft_placeholder',
                                    name: 'Collateral NFT',
                                    imageUrl: '/placeholder-nft.png',
                                    collection: 'Unknown'
                                };

                            return {
                                id: `lottery_${parsedJson.lottery_id}`,
                                lotteryId: parsedJson.lottery_id?.toString() || '0',
                                owner: parsedJson.owner || '',
                                state: 'ACTIVE' as const,
                                createdAt: Date.now(),
                                expirationDate: parseInt(parsedJson.expiration_date || '0'),
                                wonkaBarPrice: parsedJson.wonka_price?.toString() || '0',
                                maxSupply: parsedJson.max_supply?.toString() || '0',
                                soldCount: '0',
                                totalRaised: '0',
                                collateralNft: nftDetails,
                                participants: 0
                            } as Lottery;
                        }
                        return null;
                    } catch (err) {
                        console.error('Error processing lottery event:', err);
                        return null;
                    }
                });

                const resolved = await Promise.all(lotteryPromises);
                return resolved.filter((lottery): lottery is Lottery => lottery !== null);
            } catch (error) {
                console.error('Error fetching lotteries:', error);
                return [];
            }
        },
        refetchInterval: 10000,
    });

    // Fetch user's WonkaBars
    const { data: userWonkaBars = [], isLoading: isLoadingWonkaBars } = useQuery({
        queryKey: ['wonkaBars', currentAccount?.address],
        queryFn: async () => {
            if (!currentAccount?.address) return [];

            try {
                const objects = await suiClient.getOwnedObjects({
                    owner: currentAccount.address,
                    filter: { StructType: WONKA_BAR_TYPE },
                    options: {
                        showContent: true,
                        showDisplay: true,
                        showType: true,
                    },
                });

                return objects.data
                    .map((obj: any) => parseWonkaBar(obj))
                    .filter((wonkaBar): wonkaBar is WonkaBar => wonkaBar !== null);
            } catch (error) {
                console.error('Error fetching WonkaBars:', error);
                return [];
            }
        },
        enabled: !!currentAccount?.address,
        refetchInterval: 15000,
    });

    // Fetch user's ChocoChip balance
    const { data: chocoChipBalance = '0' } = useQuery({
        queryKey: ['chocoChipBalance', currentAccount?.address],
        queryFn: async () => {
            if (!currentAccount?.address) return '0';

            try {
                const balance = await suiClient.getBalance({
                    owner: currentAccount.address,
                    coinType: CHOCO_CHIP_TYPE,
                });
                return balance.totalBalance;
            } catch (error) {
                console.error('Error fetching ChocoChip balance:', error);
                return '0';
            }
        },
        enabled: !!currentAccount?.address,
    });

    // Fetch user's SUI balance
    const { data: suiBalance = '0' } = useQuery({
        queryKey: ['suiBalance', currentAccount?.address],
        queryFn: async () => {
            if (!currentAccount?.address) return '0';

            try {
                const balance = await suiClient.getBalance({
                    owner: currentAccount.address,
                });
                return balance.totalBalance;
            } catch (error) {
                console.error('Error fetching SUI balance:', error);
                return '0';
            }
        },
        enabled: !!currentAccount?.address,
    });

    // Calculate user stats
    const userStats = useMemo((): UserStats | null => {
        if (!currentAccount?.address) return null;

        const userLotteries = lotteries.filter(lottery => lottery.owner === currentAccount.address);
        const activeLotteries = userLotteries.filter(lottery =>
            lottery.state === 'ACTIVE' && Date.now() < lottery.expirationDate
        );

        return {
            activeLotteries: activeLotteries.length,
            totalLotteries: userLotteries.length,
            totalWonkaBars: userWonkaBars.length,
            chocoChipBalance,
            suiBalance,
        };
    }, [lotteries, userWonkaBars, chocoChipBalance, suiBalance, currentAccount?.address]);

    // Create lottery mutation
    const { mutateAsync: createLottery, isPending: isCreatingLottery } = useMutation({
        mutationFn: async ({
            nftId,
            expirationDate,
            wonkaBarPrice,
            maxSupply,
        }: {
            nftId: string;
            expirationDate: number;
            wonkaBarPrice: string;
            maxSupply: string;
        }) => {
            console.log('🚀 Starting createLottery with params:', {
                nftId,
                expirationDate,
                wonkaBarPrice,
                maxSupply,
                currentAccount: currentAccount?.address
            });

            if (!currentAccount?.address) {
                console.error('❌ No wallet connected');
                throw new Error('Wallet not connected');
            }

            // Check if contracts are configured
            console.log('🔧 Contract configuration:', {
                MELTYFI_PACKAGE_ID,
                PROTOCOL_OBJECT_ID,
                configured: !!(MELTYFI_PACKAGE_ID && PROTOCOL_OBJECT_ID)
            });

            if (!MELTYFI_PACKAGE_ID || !PROTOCOL_OBJECT_ID) {
                console.error('❌ Contract addresses not configured');
                throw new Error('Contract addresses not configured. Please check your environment variables.');
            }

            const tx = new Transaction();

            console.log('📝 Building transaction...');

            tx.moveCall({
                target: `${MELTYFI_PACKAGE_ID}::core::create_lottery`,
                arguments: [
                    tx.object(PROTOCOL_OBJECT_ID),
                    tx.object(nftId),
                    tx.pure.u64(expirationDate),
                    tx.pure.u64(wonkaBarPrice),
                    tx.pure.u64(maxSupply),
                    tx.object('0x6'), // Clock object
                ],
            });

            console.log('✍️ Signing and executing transaction...');
            const result = await signAndExecuteTransaction({
                transaction: tx
            });

            console.log('✅ Transaction result:', result);
            return result;
        },
        onSuccess: () => {
            console.log('🎉 Lottery created successfully!');
            queryClient.invalidateQueries({ queryKey: ['lotteries'] });
            toast.success('Lottery created successfully!');
        },
        onError: (error: any) => {
            console.error('❌ Error creating lottery:', error);

            if (error.message.includes('object does not exist')) {
                toast.error('NFT not found or inaccessible. Please try a different NFT.');
            } else if (error.message.includes('do not own')) {
                toast.error('You do not own this NFT.');
            } else if (error.message.includes('Expiration date')) {
                toast.error('Please set a valid expiration date in the future.');
            } else if (error.message.includes('price must be greater')) {
                toast.error('Please set a valid WonkaBar price.');
            } else if (error.message.includes('supply must be greater')) {
                toast.error('Please set a valid max supply.');
            } else {
                toast.error(`Failed to create lottery: ${error.message}`);
            }
        },
    });

    // Buy WonkaBars mutation
    const { mutateAsync: buyWonkaBars, isPending: isBuyingWonkaBars } = useMutation({
        mutationFn: async ({
            lotteryId,
            quantity,
            payment,
        }: {
            lotteryId: string;
            quantity: number;
            payment: string;
        }) => {
            if (!currentAccount?.address) throw new Error('Wallet not connected');

            const tx = new Transaction();

            tx.moveCall({
                target: `${MELTYFI_PACKAGE_ID}::core::buy_wonka_bars`,
                arguments: [
                    tx.object(PROTOCOL_OBJECT_ID),
                    tx.object(lotteryId),
                    tx.object(payment),
                    tx.pure.u64(quantity),
                    tx.object('0x6'), // Clock object
                ],
            });

            const result = await signAndExecuteTransaction({
                transaction: tx
            });

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lotteries'] });
            queryClient.invalidateQueries({ queryKey: ['wonkaBars'] });
            queryClient.invalidateQueries({ queryKey: ['suiBalance'] });
            toast.success('WonkaBars purchased successfully!');
        },
        onError: (error) => {
            console.error('Error buying WonkaBars:', error);
            toast.error('Failed to buy WonkaBars');
        },
    });

    // Resolve lottery mutation (for lottery owners or admin)
    const { mutateAsync: resolveLottery, isPending: isResolvingLottery } = useMutation({
        mutationFn: async ({ lotteryId }: { lotteryId: string }) => {
            if (!currentAccount?.address) throw new Error('Wallet not connected');

            const tx = new Transaction();

            tx.moveCall({
                target: `${MELTYFI_PACKAGE_ID}::core::resolve_lottery`,
                arguments: [
                    tx.object(PROTOCOL_OBJECT_ID),
                    tx.object(lotteryId),
                    tx.object('0x8'), // Random object
                    tx.object('0x6'), // Clock object
                ],
            });

            const result = await signAndExecuteTransaction({
                transaction: tx
            });

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lotteries'] });
            queryClient.invalidateQueries({ queryKey: ['wonkaBars'] });
            toast.success('Lottery resolved successfully!');
        },
        onError: (error) => {
            console.error('Error resolving lottery:', error);
            toast.error('Failed to resolve lottery');
        },
    });

    // Redeem WonkaBar mutation (for winners)
    const { mutateAsync: redeemWonkaBars, isPending: isRedeemingWonkaBars } = useMutation({
        mutationFn: async ({
            lotteryId,
            wonkaBarId,
        }: {
            lotteryId: string;
            wonkaBarId: string;
        }) => {
            if (!currentAccount?.address) throw new Error('Wallet not connected');

            const tx = new Transaction();

            // This function would need to be implemented in your Move contract
            tx.moveCall({
                target: `${MELTYFI_PACKAGE_ID}::core::redeem_wonka_bar`,
                arguments: [
                    tx.object(PROTOCOL_OBJECT_ID),
                    tx.object(lotteryId),
                    tx.object(wonkaBarId),
                ],
            });

            const result = await signAndExecuteTransaction({
                transaction: tx
            });

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lotteries'] });
            queryClient.invalidateQueries({ queryKey: ['wonkaBars'] });
            queryClient.invalidateQueries({ queryKey: ['suiBalance'] });
            queryClient.invalidateQueries({ queryKey: ['chocoChipBalance'] });
            toast.success('WonkaBar redeemed successfully!');
        },
        onError: (error) => {
            console.error('Error redeeming WonkaBar:', error);
            toast.error('Failed to redeem WonkaBar');
        },
    });

    return {
        // Data
        lotteries,
        userWonkaBars,
        chocoChipBalance,
        suiBalance,
        userStats,

        // Loading states
        isLoadingLotteries,
        isLoadingWonkaBars,

        // Mutations
        createLottery,
        isCreatingLottery,
        buyWonkaBars,
        isBuyingWonkaBars,
        resolveLottery,
        isResolvingLottery,
        redeemWonkaBars,
        isRedeemingWonkaBars,
    };
}