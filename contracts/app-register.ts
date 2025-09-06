#!/usr/bin/env node

import { Command } from 'commander';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Define the World contract address from the registration.md
const WORLD_CONTRACT_ADDRESS = '0x253eb85B3C953bFE3827CC14a151262482E7189C';

// Define the program
const program = new Command();

program
  .name('app-register')
  .description('CLI tool to register Dust apps')
  .version('1.0.0');

// Helper function to get provider and wallet
function getProviderAndWallet() {
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('Error: PRIVATE_KEY environment variable is required');
    process.exit(1);
  }

  // Use the default provider or specify your own RPC URL
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://mainnet.optimism.io');
  const wallet = new ethers.Wallet(privateKey, provider);
  
  return { provider, wallet };
}

// Helper function to create contract instances
async function createWorldContract(wallet: ethers.Wallet) {
  // Minimal ABI for the World contract with just the functions we need
  const worldAbi = [
    'function registerNamespace(bytes32 namespaceId) external',
  ];
  
  return new ethers.Contract(WORLD_CONTRACT_ADDRESS, worldAbi, wallet);
}

async function createMetadataSystemContract(wallet: ethers.Wallet, metadataSystemAddress?: string) {
  // Use provided address or environment variable
  const address = metadataSystemAddress || process.env.METADATA_SYSTEM_ADDRESS;
  
  if (!address) {
    console.error('Error: Metadata System address is required. Provide it via METADATA_SYSTEM_ADDRESS environment variable or --metadata-address option');
    process.exit(1);
  }
  
  // Minimal ABI for the MetadataSystem contract
  const metadataSystemAbi = [
    'function setResourceTag(bytes32 resourceId, string memory key, bytes memory value) external',
  ];
  
  return new ethers.Contract(address, metadataSystemAbi, wallet);
}

// Command to check if a namespace exists
program
  .command('check-namespace')
  .description('Check if a namespace exists')
  .argument('<namespace>', 'App namespace (up to 14 bytes)')
  .action(async (namespace) => {
    try {
      const { wallet } = getProviderAndWallet();
      
      // Create ResourceIds contract instance
      const resourceIdsAbi = [
        'function getExists(bytes32 resourceId) external view returns (bool)',
      ];
      
      // Encode the namespace
      const namespaceBytes = ethers.toUtf8Bytes(namespace.slice(0, 14).padEnd(14, '\0'));
      
      // Use provided address or environment variable
      const resourceIdsAddress = process.env.RESOURCE_IDS_ADDRESS;
      
      if (!resourceIdsAddress) {
        console.error('Warning: RESOURCE_IDS_ADDRESS environment variable is not set.');
        console.error('Using a mock implementation to encode the namespace.');
        
        // Proceed with the mock implementation in encodeNamespace function
        const namespaceId = await encodeNamespace(namespaceBytes);
        console.log(`Namespace ID: ${namespaceId}`);
        console.log('Note: This is a mock implementation. In a production environment, you would need the actual ResourceIds contract address.');
        return;
      }
      
      const resourceIdsContract = new ethers.Contract(resourceIdsAddress, resourceIdsAbi, wallet);
      
      // Get the namespace ID
      const namespaceId = await encodeNamespace(namespaceBytes);
      
      // Check if the namespace exists
      const exists = await resourceIdsContract.getExists(namespaceId);
      
      console.log(`Namespace ${namespace} ${exists ? 'exists' : 'does not exist'}`);
    } catch (error) {
      console.error('Error checking namespace:', error);
    }
  });

// Helper function to encode a namespace (simplified version)
async function encodeNamespace(namespaceBytes: Uint8Array): Promise<string> {
  // This is a simplified version of the WorldResourceIdLib.encodeNamespace function
  // In a real implementation, you would use the actual contract or replicate the logic exactly
  
  // Prefix for namespaces (this is a placeholder and would need to be updated)
  const namespacePrefix = '0x0000000000000000000000000000000000000000000000000000000000000000';
  
  // Convert bytes to hex and pad to 32 bytes
  const bytesHex = ethers.hexlify(namespaceBytes);
  const paddedHex = bytesHex.slice(2).padEnd(28, '0');
  
  return namespacePrefix.slice(0, -paddedHex.length) + paddedHex;
}

// Command to register a global app
program
  .command('register-global')
  .description('Register a global app')
  .argument('<namespace>', 'App namespace (up to 14 bytes)')
  .argument('<configUrl>', 'URL to the app config JSON')
  .option('--metadata-address <address>', 'Metadata System contract address')
  .option('--dry-run', 'Print the transactions that would be sent without actually sending them')
  .action(async (namespace, configUrl, options) => {
    try {
      const { wallet } = getProviderAndWallet();
      const worldContract = await createWorldContract(wallet);
      const metadataSystemContract = await createMetadataSystemContract(wallet, options.metadataAddress);
      
      // Encode the namespace
      const namespaceBytes = ethers.toUtf8Bytes(namespace.slice(0, 14).padEnd(14, '\0'));
      const namespaceId = await encodeNamespace(namespaceBytes);
      
      // Register the namespace if it doesn't exist
      console.log(`Registering namespace: ${namespace}`);
      
      if (options.dryRun) {
        console.log(`[DRY RUN] Would register namespace with ID: ${namespaceId}`);
      } else {
        const tx1 = await worldContract.registerNamespace(namespaceId);
        await tx1.wait();
        console.log(`Namespace registered successfully. Transaction hash: ${tx1.hash}`);
      }
      
      // Set the resource tag for the app config URL
      console.log(`Setting resource tag for app config URL: ${configUrl}`);
      
      if (options.dryRun) {
        console.log(`[DRY RUN] Would set resource tag 'dust.appConfigUrl' to '${configUrl}' for namespace ID: ${namespaceId}`);
      } else {
        const tx2 = await metadataSystemContract.setResourceTag(
          namespaceId,
          'dust.appConfigUrl',
          ethers.toUtf8Bytes(configUrl)
        );
        await tx2.wait();
        console.log(`Resource tag set successfully. Transaction hash: ${tx2.hash}`);
      }
      
      console.log('Global app registration completed successfully!');
    } catch (error) {
      console.error('Error registering global app:', error);
    }
  });

// Command to register a spawn app
program
  .command('register-spawn')
  .description('Register a spawn app')
  .argument('<namespace>', 'App namespace (up to 14 bytes)')
  .argument('<configUrl>', 'URL to the spawn app config JSON')
  .option('--metadata-address <address>', 'Metadata System contract address')
  .option('--dry-run', 'Print the transactions that would be sent without actually sending them')
  .action(async (namespace, configUrl, options) => {
    try {
      const { wallet } = getProviderAndWallet();
      const worldContract = await createWorldContract(wallet);
      const metadataSystemContract = await createMetadataSystemContract(wallet, options.metadataAddress);
      
      // Encode the namespace
      const namespaceBytes = ethers.toUtf8Bytes(namespace.slice(0, 14).padEnd(14, '\0'));
      const namespaceId = await encodeNamespace(namespaceBytes);
      
      // Register the namespace if it doesn't exist
      console.log(`Registering namespace: ${namespace}`);
      
      if (options.dryRun) {
        console.log(`[DRY RUN] Would register namespace with ID: ${namespaceId}`);
      } else {
        const tx1 = await worldContract.registerNamespace(namespaceId);
        await tx1.wait();
        console.log(`Namespace registered successfully. Transaction hash: ${tx1.hash}`);
      }
      
      // Set the resource tag for the spawn app config URL
      console.log(`Setting resource tag for spawn app config URL: ${configUrl}`);
      
      if (options.dryRun) {
        console.log(`[DRY RUN] Would set resource tag 'dust.spawnAppConfigUrl' to '${configUrl}' for namespace ID: ${namespaceId}`);
      } else {
        const tx2 = await metadataSystemContract.setResourceTag(
          namespaceId,
          'dust.spawnAppConfigUrl',
          ethers.toUtf8Bytes(configUrl)
        );
        await tx2.wait();
        console.log(`Resource tag set successfully. Transaction hash: ${tx2.hash}`);
      }
      
      console.log('Spawn app registration completed successfully!');
    } catch (error) {
      console.error('Error registering spawn app:', error);
    }
  });

// Command to generate a contextual app contract
program
  .command('generate-contextual')
  .description('Generate a Solidity contract for a contextual app')
  .argument('<contractName>', 'Name of the contract')
  .argument('<configUrl>', 'URL to the app config JSON')
  .option('-o, --output <directory>', 'Output directory', './contracts')
  .action((contractName, configUrl, options) => {
    try {
      const outputDir = options.output;
      
      // Create the output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Generate the contract code
      const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

contract ${contractName} {
  function appConfigURI(bytes32 viaEntity) external pure returns (string memory uri) {
    return "${configUrl}";
  }
}
`;
      
      // Write the contract to a file
      const outputPath = path.join(outputDir, `${contractName}.sol`);
      fs.writeFileSync(outputPath, contractCode);
      
      console.log(`Contextual app contract generated at: ${outputPath}`);
    } catch (error) {
      console.error('Error generating contextual app contract:', error);
    }
  });

// Command to preview an app
program
  .command('preview')
  .description('Generate a preview URL for an app')
  .argument('<configUrl>', 'URL to the app config JSON')
  .action((configUrl) => {
    const previewUrl = `https://alpha.dustproject.org/?debug-app=${encodeURIComponent(configUrl)}`;
    console.log(`Preview URL: ${previewUrl}`);
    console.log('You can use this URL to preview your app in the production client.');
  });

// Parse command line arguments
program.parse();