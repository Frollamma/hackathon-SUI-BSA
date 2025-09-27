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

// UPDATED: Helper function to fetch NFT details from object ID
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
                collection: 'Unknown',
                type: ''
            };
        }

        const display = nftObject.data.display?.data;
        const content = nftObject.data.content as any;

        // Try multiple possible field locations for NFT data
        const name = display?.name ||
            content?.fields?.name ||
            content?.name ||
            `NFT ${nftId.slice(0, 8)}`;

        const imageUrl = display?.image_url ||
            content?.fields?.image_url ||
            display?.url ||
            content?.fields?.url ||
            content?.url ||
            '';

        const description = display?.description ||
            content?.fields?.description ||
            content?.description ||
            '';

        const type = nftObject.data.type || '';

        // Extract collection address from type (package::module format)
        const collection = type ? type.split('::').slice(0, 2).join('::') : 'Unknown';

        return {
            id: nftId,
            name: String(name),
            imageUrl: imageUrl || '/placeholder-nft.png',
            collection,
            type,
            description: String(description)
        };
    } catch (error) {
        console.error('Error fetching NFT details:', error);
        return {
            id: nftId,
            name: 'Unknown NFT',
            imageUrl: '/placeholder-nft.png',
            collection: 'Unknown',
            type: ''
        };
    }
}

export function useMeltyFi() {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    // FIXED: Fetch all lotteries - Use events to get lottery object IDs, then fetch the objects
    const { data: lotteries = [], isLoading: isLoadingLotteries } = useQuery({
        queryKey: ['lotteries'],
        queryFn: async () => {
            try {
                // First, get lottery creation events to find lottery object IDs
                const events = await suiClient.queryEvents({
                    query: {
                        MoveEventType: `${MELTYFI_PACKAGE_ID}::core::LotteryCreated`
                    },
                    limit: 100,
                    order: 'descending'
                });

                console.log(`Found ${events.data.length} lottery creation events`);

                // Extract object IDs from transaction effects
                const lotteryObjectIds: string[] = [];

                for (const event of events.data) {
                    try {
                        // Get the transaction details to find created objects
                        const txDigest = event.id.txDigest;
                        const txBlock = await suiClient.getTransactionBlock({
                            digest: txDigest,
                            options: {
                                showEffects: true,
                                showObjectChanges: true,
                            }
                        });

                        // Look for created Lottery objects
                        if (txBlock.objectChanges) {
                            for (const change of txBlock.objectChanges) {
                                if (change.type === 'created' &&
                                    change.objectType.includes('::core::Lottery')) {
                                    lotteryObjectIds.push(change.objectId);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error processing event:', error);
                    }
                }

                console.log(`Found ${lotteryObjectIds.length} lottery object IDs`);

                // Now fetch the actual lottery objects
                const lotteryObjects = await Promise.all(
                    lotteryObjectIds.map(id =>
                        suiClient.getObject({
                            id,
                            options: {
                                showContent: true,
                                showDisplay: true,
                                showType: true,
                            }
                        })
                    )
                );

                console.log(`Successfully fetched ${lotteryObjects.length} lottery objects`);

                // Process each lottery object
                const lotteryPromises = lotteryObjects.map(async (lotteryObj) => {
                    try {
                        if (!lotteryObj.data) return null;

                        const lotteryFields = parseObjectContent(lotteryObj);
                        if (!lotteryFields || !lotteryObj.data?.objectId) return null;

                        // Get NFT details from the dynamic field
                        let nftDetails = {
                            id: '',
                            name: 'Unknown NFT',
                            imageUrl: '/placeholder-nft.png',
                            collection: 'Unknown',
                            type: ''
                        };

                        try {
                            // Try to get the NFT from dynamic field
                            const dynamicFields = await suiClient.getDynamicFields({
                                parentId: lotteryObj.data.objectId,
                            });

                            // Look for the NFT dynamic field (should be named "nft")
                            const nftField = dynamicFields.data.find(field => {
                                const name = field.name;
                                return (name.type === 'vector<u8>' && name.value === 'nft') ||
                                    (typeof name.value === 'string' && name.value === 'nft');
                            });

                            if (nftField) {
                                const nftFieldObject = await suiClient.getDynamicFieldObject({
                                    parentId: lotteryObj.data.objectId,
                                    name: nftField.name
                                });

                                if (nftFieldObject.data?.objectId) {
                                    nftDetails = await fetchNFTDetails(suiClient, nftFieldObject.data.objectId);
                                }
                            }
                        } catch (nftError) {
                            console.error('Error fetching NFT from dynamic field:', nftError);
                        }

                        // Map state numbers to strings
                        const stateMap: { [key: number]: 'ACTIVE' | 'CANCELLED' | 'CONCLUDED' } = {
                            0: 'ACTIVE',
                            1: 'CANCELLED',
                            2: 'CONCLUDED'
                        };

                        const lottery: Lottery = {
                            id: lotteryObj.data.objectId,
                            lotteryId: lotteryFields.lottery_id?.toString() || '0',
                            owner: lotteryFields.owner || '',
                            state: stateMap[parseInt(lotteryFields.state || '0')] || 'ACTIVE',
                            createdAt: parseInt(lotteryFields.created_at || '0'),
                            expirationDate: parseInt(lotteryFields.expiration_date || '0'),
                            wonkaBarPrice: lotteryFields.wonka_price?.toString() || '0',
                            maxSupply: lotteryFields.max_supply?.toString() || '0',
                            soldCount: lotteryFields.sold_count?.toString() || '0',
                            totalRaised: lotteryFields.total_raised?.toString() || '0',
                            winner: lotteryFields.winner || undefined,
                            winningTicket: lotteryFields.winning_ticket?.toString() || undefined,
                            collateralNft: nftDetails,
                            participants: Object.keys(lotteryFields.participants?.contents || {}).length
                        };

                        return lottery;
                    } catch (error) {
                        console.error('Error processing lottery object:', error);
                        return null;
                    }
                });

                const results = await Promise.all(lotteryPromises);
                const validLotteries = results.filter((lottery): lottery is Lottery => lottery !== null);

                console.log(`Successfully processed ${validLotteries.length} lotteries`);
                return validLotteries;
            } catch (error) {
                console.error('Error fetching lotteries:', error);
                return [];
            }
        },
        refetchInterval: 30000, // Refetch every 30 seconds
        enabled: true
    });

    // Fetch user's WonkaBars
    const { data: userWonkaBars = [], isLoading: isLoadingWonkaBars } = useQuery({
        queryKey: ['user-wonkabars', currentAccount?.address],
        queryFn: async () => {
            if (!currentAccount?.address) return [];

            try {
                const objects = await suiClient.getOwnedObjects({
                    owner: currentAccount.address,
                    filter: {
                        StructType: WONKA_BAR_TYPE
                    },
                    options: {
                        showContent: true,
                        showDisplay: true,
                        showType: true,
                    }
                });

                const wonkaBars = objects.data
                    .map(parseWonkaBar)
                    .filter((wonkaBar): wonkaBar is WonkaBar => wonkaBar !== null);

                return wonkaBars;
            } catch (error) {
                console.error('Error fetching user WonkaBars:', error);
                return [];
            }
        },
        enabled: !!currentAccount?.address,
        refetchInterval: 15000,
    });

    // Fetch user's ChocoChip balance
    const { data: chocoChipBalance = '0' } = useQuery({
        queryKey: ['chocochip-balance', currentAccount?.address],
        queryFn: async () => {
            if (!currentAccount?.address) return '0';

            try {
                const objects = await suiClient.getOwnedObjects({
                    owner: currentAccount.address,
                    filter: {
                        StructType: CHOCO_CHIP_TYPE
                    },
                    options: {
                        showContent: true,
                    }
                });

                let totalBalance = BigInt(0);
                for (const obj of objects.data) {
                    const fields = parseObjectContent(obj);
                    if (fields?.balance) {
                        totalBalance += BigInt(fields.balance);
                    }
                }

                return totalBalance.toString();
            } catch (error) {
                console.error('Error fetching ChocoChip balance:', error);
                return '0';
            }
        },
        enabled: !!currentAccount?.address,
        refetchInterval: 15000,
    });

    // Fetch user's SUI balance
    const { data: suiBalance = '0' } = useQuery({
        queryKey: ['sui-balance', currentAccount?.address],
        queryFn: async () => {
            if (!currentAccount?.address) return '0';

            try {
                const balance = await suiClient.getBalance({
                    owner: currentAccount.address,
                    coinType: '0x2::sui::SUI'
                });
                return balance.totalBalance;
            } catch (error) {
                console.error('Error fetching SUI balance:', error);
                return '0';
            }
        },
        enabled: !!currentAccount?.address,
        refetchInterval: 10000,
    });

    // Calculate user stats
    const userStats: UserStats = useMemo(() => {
        const userLotteries = lotteries.filter(lottery => lottery.owner === currentAccount?.address);
        const activeLotteries = userLotteries.filter(lottery =>
            lottery.state === 'ACTIVE' && lottery.expirationDate > Date.now()
        ).length;

        return {
            activeLotteries,
            totalLotteries: userLotteries.length,
            totalWonkaBars: userWonkaBars.length,
            chocoChipBalance,
            suiBalance
        };
    }, [lotteries, userWonkaBars, chocoChipBalance, suiBalance, currentAccount?.address]);

    // Create lottery mutation
    const { mutateAsync: createLottery, isPending: isCreatingLottery } = useMutation({
        mutationFn: async (params: {
            nftId: string;
            wonkaBarPrice: string;
            maxSupply: number;
            duration: number;
        }) => {
            if (!currentAccount?.address) {
                throw new Error('Wallet not connected');
            }

            // Validate parameters
            const price = parseFloat(params.wonkaBarPrice);
            const supply = params.maxSupply;
            const durationDays = params.duration;

            if (isNaN(price) || price <= 0) {
                throw new Error('Invalid WonkaBar price');
            }
            if (isNaN(supply) || supply <= 0) {
                throw new Error('Invalid max supply');
            }
            if (isNaN(durationDays) || durationDays <= 0) {
                throw new Error('Invalid duration');
            }

            const transaction = new Transaction();

            const wonkaBarPriceInMist = Math.floor(price * 1_000_000_000).toString();
            const durationInMs = Math.floor(durationDays * 24 * 60 * 60 * 1000).toString();

            // Get the NFT object to determine its type
            const nftObject = await suiClient.getObject({
                id: params.nftId,
                options: {
                    showType: true,
                    showOwner: true,
                }
            });

            if (!nftObject.data) {
                throw new Error('NFT not found');
            }

            console.log('NFT ownership details:', {
                id: params.nftId,
                owner: nftObject.data.owner,
                currentAccount: currentAccount.address
            });

            // Verify ownership - handle different owner formats
            let nftOwner = null;
            if (nftObject.data.owner) {
                if (typeof nftObject.data.owner === 'string') {
                    nftOwner = nftObject.data.owner;
                } else if (nftObject.data.owner.AddressOwner) {
                    nftOwner = nftObject.data.owner.AddressOwner;
                } else if (nftObject.data.owner.ObjectOwner) {
                    nftOwner = nftObject.data.owner.ObjectOwner;
                }
            }

            if (!nftOwner || nftOwner !== currentAccount.address) {
                console.error('Ownership verification failed:', {
                    nftOwner,
                    currentAccount: currentAccount.address,
                    ownerObject: nftObject.data.owner
                });
                throw new Error(`You do not own this NFT. Owner: ${nftOwner}, Your address: ${currentAccount.address}`);
            }

            const nftType = nftObject.data.type;
            if (!nftType) {
                throw new Error('Could not determine NFT type');
            }

            console.log('NFT details:', {
                id: params.nftId,
                type: nftType,
                owner: nftOwner
            });

            // Calculate expiration date (current time + duration)
            const currentTime = Date.now();
            const expirationDate = currentTime + Math.floor(durationDays * 24 * 60 * 60 * 1000);

            console.log('Calculated times:', {
                currentTime,
                durationInDays: durationDays,
                durationInMs: Math.floor(durationDays * 24 * 60 * 60 * 1000),
                expirationDate
            });

            transaction.moveCall({
                target: `${MELTYFI_PACKAGE_ID}::core::create_lottery`,
                arguments: [
                    transaction.object(PROTOCOL_OBJECT_ID),    // protocol: &mut Protocol
                    transaction.object(params.nftId),          // nft: T
                    transaction.pure.u64(expirationDate),     // expiration_date: u64
                    transaction.pure.u64(wonkaBarPriceInMist), // wonka_price: u64
                    transaction.pure.u64(supply),             // max_supply: u64
                    transaction.object('0x6'),                // clock: &Clock (0x6 is the correct clock object ID)
                ],
                typeArguments: [nftType] // Specify the NFT type for the generic function
            });

            const result = await signAndExecuteTransaction({
                transaction,
                options: {
                    showEffects: true,
                    showEvents: true,
                }
            });

            return result;
        },
        onSuccess: () => {
            toast.success('Lottery created successfully!');
            queryClient.invalidateQueries({ queryKey: ['lotteries'] });
        },
        onError: (error) => {
            console.error('Error creating lottery:', error);
            toast.error('Failed to create lottery');
        }
    });

    // Buy WonkaBars mutation
    const { mutateAsync: buyWonkaBars, isPending: isBuyingWonkaBars } = useMutation({
        mutationFn: async (params: {
            lotteryId: string;
            quantity: number;
            totalCost: string;
        }) => {
            if (!currentAccount?.address) {
                throw new Error('Wallet not connected');
            }

            const transaction = new Transaction();

            const [coin] = transaction.splitCoins(transaction.gas, [
                transaction.pure.u64(params.totalCost)
            ]);

            transaction.moveCall({
                target: `${MELTYFI_PACKAGE_ID}::core::buy_wonka_bars`,
                arguments: [
                    transaction.object(PROTOCOL_OBJECT_ID),
                    transaction.object(params.lotteryId),
                    coin,
                    transaction.pure.u64(params.quantity),
                    transaction.object('0x8'),
                ]
            });

            const result = await signAndExecuteTransaction({
                transaction,
                options: {
                    showEffects: true,
                    showEvents: true,
                }
            });

            return result;
        },
        onSuccess: () => {
            toast.success('WonkaBars purchased successfully!');
            queryClient.invalidateQueries({ queryKey: ['lotteries'] });
            queryClient.invalidateQueries({ queryKey: ['user-wonkabars'] });
            queryClient.invalidateQueries({ queryKey: ['sui-balance'] });
            queryClient.invalidateQueries({ queryKey: ['chocochip-balance'] });
        },
        onError: (error) => {
            console.error('Error buying WonkaBars:', error);
            toast.error('Failed to purchase WonkaBars');
        }
    });

    // Redeem WonkaBars mutation
    const { mutateAsync: redeemWonkaBars, isPending: isRedeemingWonkaBars } = useMutation({
        mutationFn: async (wonkaBarId: string) => {
            if (!currentAccount?.address) {
                throw new Error('Wallet not connected');
            }

            const transaction = new Transaction();

            transaction.moveCall({
                target: `${MELTYFI_PACKAGE_ID}::core::redeem_wonka_bars`,
                arguments: [
                    transaction.object(PROTOCOL_OBJECT_ID),
                    transaction.object(wonkaBarId),
                    transaction.object('0x8'),
                ]
            });

            const result = await signAndExecuteTransaction({
                transaction,
                options: {
                    showEffects: true,
                    showEvents: true,
                }
            });

            return result;
        },
        onSuccess: () => {
            toast.success('WonkaBars redeemed successfully!');
            queryClient.invalidateQueries({ queryKey: ['lotteries'] });
            queryClient.invalidateQueries({ queryKey: ['user-wonkabars'] });
            queryClient.invalidateQueries({ queryKey: ['sui-balance'] });
        },
        onError: (error) => {
            console.error('Error redeeming WonkaBars:', error);
            toast.error('Failed to redeem WonkaBars');
        }
    });

    return {
        // Data
        lotteries,
        userWonkaBars,
        userStats,
        chocoChipBalance,
        suiBalance,

        // Loading states
        isLoadingLotteries,
        isLoadingWonkaBars,

        // Mutations
        createLottery,
        isCreatingLottery,
        buyWonkaBars,
        isBuyingWonkaBars,
        redeemWonkaBars,
        isRedeemingWonkaBars,
    };
}