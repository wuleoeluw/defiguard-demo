import { useEffect, useState } from "react";
import Web3 from "web3";
import BigNumber from "bignumber.js";

import "./index.css";

import AppLogo from "../../assets/images/logo.png"

function Header() {
    const [account, setAccount] = useState('');
    const [balance, setBalance] = useState('0');
    const [web3, setWeb3] = useState(null);
    const [showWalletMenu, setShowWalletMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [sendAddress, setSendAddress] = useState('');
    const [sendAmount, setSendAmount] = useState('');
    const [txStatus, setTxStatus] = useState('');
    const [txHash, setTxHash] = useState('');
    const [isSending, setIsSending] = useState(false);

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
            console.error('Failed to fetch balance');
        }
    };

    // Listen to account changes
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                } else {
                    setAccount('');
                    setBalance('0');
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners();
            }
        };
    }, []);

    // Copy to clipboard
    const copyToClipboard = () => {
        navigator.clipboard.writeText(account);
        alert('Address copied to clipboard!');
    };

    const disconnectWallet = () => {
        setAccount('');
        setBalance('0');
        setWeb3(null);
        setShowWalletMenu(false);
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

        const amountInEth = parseFloat(sendAmount);
        if (amountInEth <= 0 || amountInEth > parseFloat(balance)) {
            alert('Invalid amount or insufficient balance');
            return;
        }

        setIsSending(true);
        setTxStatus('Preparing transaction...');
        
        try {
            const amountInWei = web3.utils.toWei(amountInEth.toString(), 'ether');
            
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
            
            // Reset form and update balance
            setSendAddress('');
            setSendAmount('');
            await updateBalance();
            
            setTimeout(() => {
                setShowSendModal(false);
                setTxStatus('');
                setTxHash('');
            }, 2000);
        } catch (err) {
            console.error('Transaction error:', err);
            setTxStatus(`Error: ${err.message}`);
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

    return (
        <div className="container">
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <a className="navbar-brand" href="/">
                    <img src={AppLogo} alt="DefiGuard logo" />
                </a>
                <div className="navbar-right-controls">
                    <div className="wallet-dropdown">
                       {!account ? (
                           <button 
                               className="btn btn-primary btn-connect-wallet"
                               onClick={connectWallet}
                           >
                               Connect
                           </button>
                       ) : (
                           <div className="wallet-info-container">
                               <button 
                                   className="btn btn-wallet-connected"
                                   onClick={() => setShowWalletMenu(!showWalletMenu)}
                               >
                                   <i className="fa fa-ethereum" aria-hidden="true"></i>
                                   <span className="account-short">{account.substring(0, 6)}...{account.substring(38)}</span>
                                   <span className="balance-badge">{parseFloat(balance).toFixed(3)} ETH</span>
                               </button>
                               {showWalletMenu && (
                                   <div className="wallet-menu-dropdown">
                                       <div className="wallet-menu-item">
                                           <p className="wallet-label">Address</p>
                                           <p className="wallet-value">{account}</p>
                                       </div>
                                       <div className="wallet-menu-item">
                                           <p className="wallet-label">Balance</p>
                                           <p className="wallet-value">{parseFloat(balance).toFixed(4)} ETH</p>
                                       </div>
                                       <button 
                                           className="wallet-menu-btn send-btn"
                                           onClick={() => setShowSendModal(true)}
                                       >
                                           <i className="fa fa-send"></i> Send
                                       </button>
                                       <button 
                                           className="wallet-menu-btn receive-btn"
                                           onClick={() => setShowReceiveModal(true)}
                                       >
                                           <i className="fa fa-arrow-down"></i> Receive
                                       </button>
                                       <button 
                                           className="wallet-menu-btn network-btn"
                                           onClick={switchToSepolia}
                                       >
                                           <i className="fa fa-network-wired"></i> Sepolia
                                       </button>
                                       <button 
                                           className="wallet-menu-btn copy-btn"
                                           onClick={copyToClipboard}
                                       >
                                           <i className="fa fa-copy"></i> Copy Address
                                       </button>
                                       <button 
                                           className="wallet-menu-btn refresh-btn"
                                           onClick={updateBalance}
                                       >
                                           <i className="fa fa-refresh"></i> Refresh Balance
                                       </button>
                                       <button 
                                           className="wallet-menu-btn disconnect-btn"
                                           onClick={disconnectWallet}
                                       >
                                           <i className="fa fa-sign-out"></i> Disconnect
                                       </button>
                                   </div>
                               )}
                           </div>
                       )}
                    </div>
                    <button 
                        className="navbar-toggler" 
                        type="button" 
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        aria-controls="navbarSupportedContent" 
                        aria-expanded={showMobileMenu}
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                </div>
                <div className={`collapse navbar-collapse ${showMobileMenu ? 'show' : ''}`} id="navbarSupportedContent">
                    <ul className="navbar-nav ml-auto">
                        <li className="nav-item">
                            <a className="nav-link" href="/">Home</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="services">Services</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="about">About</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="features">Features</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="team">Team</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="blog">Blog</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="contact">Contact</a>
                        </li>
                    </ul>
                    <form className="form-inline my-2 my-lg-0">
                        <div className="search_bt">
                            <a href="#">
                                <i className="fa fa-search" aria-hidden="true"></i>
                            </a>
                        </div>
                    </form>
               </div>

               {/* Send ETH Modal */}
               {showSendModal && (
                   <div className="modal-overlay" onClick={() => !isSending && setShowSendModal(false)}>
                       <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                           <div className="modal-header">
                               <h3>Send ETH</h3>
                               <button 
                                   className="modal-close"
                                   onClick={() => !isSending && setShowSendModal(false)}
                               >
                                   ×
                               </button>
                           </div>
                           <div className="modal-body">
                               <div className="form-group">
                                   <label>Recipient Address</label>
                                   <input 
                                       type="text"
                                       className="form-control"
                                       placeholder="0x..."
                                       value={sendAddress}
                                       onChange={(e) => setSendAddress(e.target.value)}
                                       disabled={isSending}
                                   />
                               </div>
                               <div className="form-group">
                                   <label>Amount (ETH)</label>
                                   <input 
                                       type="number"
                                       className="form-control"
                                       placeholder="0.0"
                                       value={sendAmount}
                                       onChange={(e) => setSendAmount(e.target.value)}
                                       disabled={isSending}
                                       step="0.0001"
                                   />
                                   <small>Available: {parseFloat(balance).toFixed(4)} ETH</small>
                               </div>
                               {txStatus && (
                                   <div className={`tx-status ${txStatus.includes('Error') ? 'error' : txStatus.includes('confirmed') ? 'success' : 'pending'}`}>
                                       {txStatus}
                                       {txHash && (
                                           <div className="tx-hash">
                                               <small>Hash: {txHash.substring(0, 16)}...</small>
                                           </div>
                                       )}
                                   </div>
                               )}
                           </div>
                           <div className="modal-footer">
                               <button 
                                   className="btn btn-cancel"
                                   onClick={() => setShowSendModal(false)}
                                   disabled={isSending}
                               >
                                   Cancel
                               </button>
                               <button 
                                   className="btn btn-send"
                                   onClick={sendETH}
                                   disabled={isSending}
                               >
                                   {isSending ? 'Sending...' : 'Send'}
                               </button>
                           </div>
                       </div>
                   </div>
               )}

               {/* Receive ETH Modal */}
               {showReceiveModal && (
                   <div className="modal-overlay" onClick={() => setShowReceiveModal(false)}>
                       <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                           <div className="modal-header">
                               <h3>Receive ETH</h3>
                               <button 
                                   className="modal-close"
                                   onClick={() => setShowReceiveModal(false)}
                               >
                                   ×
                               </button>
                           </div>
                           <div className="modal-body receive-body">
                               <p className="receive-label">Your Sepolia Address:</p>
                               <div className="receive-address-box">
                                   <p className="receive-address">{account}</p>
                               </div>
                               <button 
                                   className="btn btn-copy-address"
                                   onClick={() => {
                                       navigator.clipboard.writeText(account);
                                       alert('Address copied to clipboard!');
                                   }}
                               >
                                   <i className="fa fa-copy"></i> Copy Address
                               </button>
                               <div className="receive-info">
                                   <p><strong>Network:</strong> Sepolia Testnet</p>
                                   <p><strong>Chain ID:</strong> 11155111</p>
                                   <p><strong>Testnet Faucet:</strong> Visit <a href="https://sepolia-faucet.pk910.de/" target="_blank" rel="noopener noreferrer">Sepolia Faucet</a> to get free test ETH</p>
                               </div>
                           </div>
                           <div className="modal-footer">
                               <button 
                                   className="btn btn-close-modal"
                                   onClick={() => setShowReceiveModal(false)}
                               >
                                   Close
                               </button>
                           </div>
                       </div>
                   </div>
               )}
            </nav>
         </div>
    );
}


export default Header;