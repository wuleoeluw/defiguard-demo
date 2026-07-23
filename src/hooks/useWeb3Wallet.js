import { useEffect, useState } from "react";
import Web3 from "web3";
import BigNumber from "bignumber.js";

export const useWeb3Wallet = () => {
    const [account, setAccount] = useState('');
    const [balance, setBalance] = useState('0');
    const [web3, setWeb3] = useState(null);
    const [sendAddress, setSendAddress] = useState('');
    const [sendAmount, setSendAmount] = useState('');
    const [txStatus, setTxStatus] = useState('');
    const [txHash, setTxHash] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // Connect Wallet
    const connectWallet = async () => {
        try {
            if (!window.ethereum) {
                alert('MetaMask not detected. Please install MetaMask.');
                return;
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);
            setAccount(accounts[0]);

            // Get initial balance
            const balanceWei = await web3Instance.eth.getBalance(accounts[0]);
            const balanceEth = web3Instance.utils.fromWei(balanceWei, 'ether');
            setBalance(balanceEth);
        } catch (err) {
            alert(err.message);
        }
    };

    // Update balance
    const updateBalance = async () => {
        if (!web3 || !account) return;
        try {
            const balanceWei = await web3.eth.getBalance(account);
            const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
            setBalance(balanceEth);
        } catch (err) {
            console.error('Failed to fetch balance', err);
        }
    };

    // Listen to account changes
    useEffect(() => {
        if (!window.ethereum) return;

        // Define named handlers so we can remove them specifically
        const handleAccountsChanged = async (accounts) => {
            if (accounts.length > 0) {
                const newAccount = accounts[0];
                setAccount(newAccount);

                // Fetch balance for the new account
                if (web3) {
                    try {
                        const balanceWei = await web3.eth.getBalance(newAccount);
                        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
                        setBalance(balanceEth);
                    } catch (err) {
                        console.error('Failed to fetch balance for new account:', err);
                    }
                }
            } else {
                setAccount('');
                setBalance('0');
            }
        };

        const handleChainChanged = () => {
            window.location.reload();
        };

        // Register only the handlers we need
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        // Cleanup: remove only the handlers we registered
        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
    }, [web3]);

    // Copy to clipboard
    const copyToClipboard = () => {
        navigator.clipboard.writeText(account);
        alert('Address copied to clipboard!');
    };

    const disconnectWallet = () => {
        setAccount('');
        setBalance('0');
        setWeb3(null);
    };

    // Send ETH Function
    const sendETH = async () => {
        if (!sendAddress || !sendAmount) {
            alert('Please enter recipient address and amount');
            return;
        }

        if (!web3 || !web3.utils.isAddress(sendAddress)) {
            alert('Invalid recipient address');
            return;
        }

        // Validate amount using Wei integers (BigNumber for exact precision)
        try {
            const amountInWei = web3.utils.toWei(sendAmount, 'ether');
            const amountBN = new BigNumber(amountInWei);
            const balanceInWei = web3.utils.toWei(balance, 'ether');
            const balanceBN = new BigNumber(balanceInWei);

            if (amountBN.isLessThanOrEqualTo(0)) {
                alert('Amount must be greater than 0');
                return;
            }

            if (amountBN.isGreaterThan(balanceBN)) {
                alert('Insufficient balance');
                return;
            }
        } catch (err) {
            alert('Invalid amount');
            return;
        }

        setIsSending(true);
        setTxStatus('Preparing transaction...');
        
        try {
            const amountInWei = web3.utils.toWei(sendAmount, 'ether');
            
            // Get current block to extract base fee for EIP-1559
            const block = await web3.eth.getBlock('latest');
            const baseFee = new BigNumber(block.baseFeePerGas ?? 0);

            // Set priority fee (tip) - typically 1-2 Gwei
            const priorityFeeWei = new BigNumber(web3.utils.toWei('2', 'gwei'));

            // Calculate max fee per gas = base fee + priority fee
            const maxFeePerGas = baseFee.plus(priorityFeeWei).toString();
            const maxPriorityFeePerGas = priorityFeeWei.toString();
            
            // Estimate gas
            const gasEstimate = await web3.eth.estimateGas({
                from: account,
                to: sendAddress,
                value: amountInWei,
            });

            setTxStatus('Requesting MetaMask approval...');
            
            // Send transaction with EIP-1559 parameters
            const receipt = await web3.eth.sendTransaction({
                from: account,
                to: sendAddress,
                value: amountInWei,
                gas: gasEstimate,
                maxFeePerGas: maxFeePerGas,
                maxPriorityFeePerGas: maxPriorityFeePerGas,
            });

            setTxHash(receipt.transactionHash);
            setTxStatus('Transaction confirmed!');
            setIsCompleted(true);
            
            // Reset form and update balance
            setSendAddress('');
            setSendAmount('');
            await updateBalance();
        } catch (err) {
            console.error('Transaction error:', err);
            setTxStatus(`Error: ${err.message}`);
            setIsCompleted(false);
        } finally {
            setIsSending(false);
        }
    };

    // Check if connected to Sepolia testnet
    const checkSepolia = async () => {
        if (!window.ethereum) return false;
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            return chainId === '0xaa36a7'; // Sepolia chain ID is 11155111 in decimal, 0xaa36a7 in hex
        } catch (err) {
            console.error('Error checking chain:', err);
            return false;
        }
    };

    // Switch to Sepolia
    const switchToSepolia = async () => {
        try {
            const isOnSepolia = await checkSepolia();
            if (isOnSepolia) {
                alert('Already on Sepolia testnet!');
                return;
            }

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }],
            });
            
            window.location.reload();
        } catch (err) {
            if (err.code === 4902) {
                // Network not added, try to add it
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0xaa36a7',
                            chainName: 'Sepolia',
                            rpcUrls: ['https://rpc.sepolia.org'],
                            nativeCurrency: {
                                name: 'ETH',
                                symbol: 'ETH',
                                decimals: 18,
                            },
                            blockExplorerUrls: ['https://sepolia.etherscan.io/'],
                        }],
                    });
                    window.location.reload();
                } catch (addErr) {
                    alert('Failed to add Sepolia network');
                }
            } else {
                alert('Failed to switch to Sepolia testnet');
            }
        }
    };

    return {
        // State
        account,
        balance,
        web3,
        sendAddress,
        sendAmount,
        txStatus,
        txHash,
        isSending,
        isCompleted,
        // Setters
        setSendAddress,
        setSendAmount,
        setTxStatus,
        setTxHash,
        setIsCompleted,
        // Functions
        connectWallet,
        updateBalance,
        sendETH,
        checkSepolia,
        switchToSepolia,
        disconnectWallet,
        copyToClipboard,
    };
};
