import { useState, useEffect } from "react";
import { useWeb3Wallet } from "../../hooks/useWeb3Wallet";

import "./index.css";

import AppLogo from "../../assets/images/logo.png";

function Header() {
    const {
        account,
        balance,
        sendAddress,
        sendAmount,
        txStatus,
        txHash,
        isSending,
        isCompleted,
        setSendAddress,
        setSendAmount,
        setTxStatus,
        setTxHash,
        setIsCompleted,
        connectWallet,
        updateBalance,
        sendETH,
        switchToSepolia,
        checkSepolia,
        disconnectWallet,
        copyToClipboard,
    } = useWeb3Wallet();

    const [showWalletMenu, setShowWalletMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [isOnSepolia, setIsOnSepolia] = useState(false);

    // Check network when Receive modal opens
    useEffect(() => {
        if (showReceiveModal) {
            checkSepolia().then(setIsOnSepolia);
        }
    }, [showReceiveModal, checkSepolia]);

    // Clear transaction state and form when Send modal closes
    useEffect(() => {
        if (!showSendModal) {
            setTxStatus('');
            setTxHash('');
            setIsCompleted(false);
            setSendAddress('');
            setSendAmount('');
        }
    }, [showSendModal, setTxStatus, setTxHash, setIsCompleted, setSendAddress, setSendAmount]);

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
                                           onClick={() => {
                                               disconnectWallet();
                                               setShowWalletMenu(false);
                                           }}
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
                       <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="send-modal-title" onClick={(e) => e.stopPropagation()}>
                           <div className="modal-header">
                               <h3 id="send-modal-title">Send ETH</h3>
                               <button 
                                   type="button"
                                   className="modal-close"
                                   aria-label="Close Send ETH modal"
                                   onClick={() => !isSending && setShowSendModal(false)}
                               >
                                   ×
                               </button>
                           </div>
                           <div className="modal-body">
                               <div className="form-group">
                                   <label htmlFor="sendAddress">Recipient Address</label>
                                   <input 
                                       id="sendAddress"
                                       type="text"
                                       className="form-control"
                                       placeholder="0x..."
                                       value={sendAddress}
                                       onChange={(e) => setSendAddress(e.target.value)}
                                       disabled={isSending || isCompleted}
                                   />
                               </div>
                               <div className="form-group">
                                   <label htmlFor="sendAmount">Amount (ETH)</label>
                                   <input 
                                       id="sendAmount"
                                       type="number"
                                       className="form-control"
                                       placeholder="0.0"
                                       value={sendAmount}
                                       onChange={(e) => setSendAmount(e.target.value)}
                                       disabled={isSending || isCompleted}
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
                                   disabled={isSending || isCompleted}
                               >
                                   Cancel
                               </button>
                               <button 
                                   className="btn btn-send"
                                   onClick={sendETH}
                                   disabled={isSending || isCompleted}
                               >
                                   {isSending ? 'Sending...' : isCompleted ? '✓ Sent!' : 'Send'}
                               </button>
                           </div>
                       </div>
                   </div>
               )}

               {/* Receive ETH Modal */}
               {showReceiveModal && (
                   <div className="modal-overlay" onClick={() => setShowReceiveModal(false)}>
                       <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="receive-modal-title" onClick={(e) => e.stopPropagation()}>
                           <div className="modal-header">
                               <h3 id="receive-modal-title">Receive ETH</h3>
                               <button 
                                   type="button"
                                   className="modal-close"
                                   aria-label="Close Receive ETH modal"
                                   onClick={() => setShowReceiveModal(false)}
                               >
                                   ×
                               </button>
                           </div>
                           <div className="modal-body receive-body">
                               {isOnSepolia ? (
                                   <>
                                       <p className="receive-label">Your Sepolia Address:</p>
                                       <div className="receive-address-box">
                                           <p className="receive-address">{account}</p>
                                       </div>
                                        <button 
                                            className="btn btn-copy-address"
                                            onClick={copyToClipboard}
                                        >
                                            <i className="fa fa-copy"></i> Copy Address
                                       </button>
                                       <div className="receive-info">
                                           <p><strong>Network:</strong> Sepolia Testnet</p>
                                           <p><strong>Chain ID:</strong> 11155111</p>
                                           <p><strong>Testnet Faucet:</strong> Visit <a href="https://sepolia-faucet.pk910.de/" target="_blank" rel="noopener noreferrer">Sepolia Faucet</a> to get free test ETH</p>
                                       </div>
                                   </>
                               ) : (
                                   <div className="network-warning">
                                       <p><strong>Please switch to Sepolia Testnet to receive ETH.</strong></p>
                                       <button
                                           type="button"
                                           className="btn btn-primary"
                                           onClick={switchToSepolia}
                                       >
                                           <i className="fa fa-network-wired"></i> Switch to Sepolia
                                       </button>
                                   </div>
                               )}
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