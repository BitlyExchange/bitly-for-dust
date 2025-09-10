import { skipToken, useQuery } from "@tanstack/react-query";
import { useDustClient } from "./useDustClient";
import { usePlayerEntityId } from "./usePlayerEntityId";
import { createPublicClient, http, getAddress, type Hex } from "viem";
import { redstone } from "@latticexyz/common/chains";
import { decodePlayer } from "@dust/world/internal";

// Minimal ERC20 ABI with balanceOf and decimals functions
const erc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function useTokenBalance(contractAddress: string) {
  const { data: dustClient } = useDustClient();
  const { data: playerEntityId } = usePlayerEntityId();

  return useQuery({
    queryKey: ["tokenBalance", contractAddress, playerEntityId],
    queryFn: !dustClient || !playerEntityId || !contractAddress
      ? skipToken
      : async () => {
          try {
            // Create a public client for the redstone network
            const publicClient = createPublicClient({
              chain: redstone,
              transport: http(),
            });

            // Get the player's address
            // Make sure it's a valid address format
            const playerAddress = decodePlayer(playerEntityId);
            
            // Read the token balance and decimals from the contract
            const balance = await publicClient.readContract({
              address: getAddress(contractAddress),
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [playerAddress],
            });
            
            // Try to get the token decimals, default to 18 if it fails
            let decimals = 18;
            try {
              const tokenDecimals = await publicClient.readContract({
                address: getAddress(contractAddress),
                abi: erc20Abi,
                functionName: "decimals",
              });
              decimals = Number(tokenDecimals);
            } catch (error) {
              console.warn(`Could not get decimals for token ${contractAddress}, using default of 18`);
            }
            
            console.log(`Token balance for contract ${contractAddress}:`, balance, `with ${decimals} decimals`);
            
            // Format the balance with proper decimals
            // For display purposes, we divide by 10^decimals
            const divisor = 10n ** BigInt(decimals);
            const formattedBalance = Number(balance) / Number(divisor);
            
            return formattedBalance;
          } catch (error) {
            console.error(`Error fetching token balance for contract ${contractAddress}:`, error);
            return 0;
          }
        },
    enabled: Boolean(dustClient) && Boolean(playerEntityId) && Boolean(contractAddress),
    staleTime: 10000, // 10 seconds
  });
}