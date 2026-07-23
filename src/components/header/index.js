import { useEffect, useState } from "react";
import Web3 from "web3";

import "./index.css";

import AppLogo from "../../assets/images/logo.png"

function Header() {
    const [account, setAccount] = useState('');
    const [balance, setBalance] = useState('0');
    const [web3, setWeb3] = useState(null);
    const [showWalletMenu, setShowWalletMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

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

    return (
        <div className="container">
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <a className="navbar-brand" href="/">
                    <img src={AppLogo} />
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
            </nav>
         </div>
    );
}


export default Header;