import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import './index.css';

const Wallet = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('receive');

  // Connect Wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask not detected. Please install MetaMask.');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      setAccount(accounts[0]);
      setError('');

      // Get initial balance
      const balanceWei = await web3Instance.eth.getBalance(accounts[0]);
      const balanceEth = web3Instance.utils.fromWei(balanceWei, 'ether');
      setBalance(balanceEth);
    } catch (err) {
      setError(err.message);
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
      setError('Failed to fetch balance');
    }
  };

  // Listen to account changes
  useEffect(() => {
    if (!window.ethereum) return;

    // Define named handlers so we can remove them specifically
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
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
  }, []);

  // Send ETH
  const sendETH = async (e) => {
    e.preventDefault();
    if (!web3 || !account) {
      setError('Wallet not connected');
      return;
    }

    if (!recipientAddress || !amount) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const amountWei = web3.utils.toWei(amount, 'ether');

      // web3.eth.sendTransaction returns a receipt object with transactionHash property
      const receipt = await web3.eth.sendTransaction({
        from: account,
        to: recipientAddress,
        value: amountWei,
      });

      // Extract the transaction hash from the receipt
      setTransactionHash(receipt.transactionHash);
      setRecipientAddress('');
      setAmount('');

      // Update balance immediately after transaction confirmation
      await updateBalance();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(account);
    alert('Address copied to clipboard!');
  };

  return (
    <div className="wallet-container">
      <div className="wallet-card">
        <h1>ETH Wallet</h1>

        {!account ? (
          <button className="connect-btn" onClick={connectWallet}>
            Connect
          </button>
        ) : (
          <>
            <div className="wallet-info">
              <div className="info-box">
                <p className="label">Connected Account</p>
                <p className="address">{account.substring(0, 6)}...{account.substring(38)}</p>
                <button className="copy-btn" onClick={copyToClipboard}>Copy Address</button>
              </div>

              <div className="info-box">
                <p className="label">Balance</p>
                <p className="balance">{parseFloat(balance).toFixed(4)} ETH</p>
                <button className="refresh-btn" onClick={updateBalance}>Refresh</button>
              </div>
            </div>

            <div className="tabs">
              <button
                className={`tab ${activeTab === 'receive' ? 'active' : ''}`}
                onClick={() => setActiveTab('receive')}
              >
                Receive
              </button>
              <button
                className={`tab ${activeTab === 'send' ? 'active' : ''}`}
                onClick={() => setActiveTab('send')}
              >
                Send
              </button>
            </div>

            {activeTab === 'receive' && (
              <div className="tab-content">
                <h3>Receive ETH</h3>
                <p>Share this address to receive ETH:</p>
                <div className="address-display">
                  <p>{account}</p>
                  <button onClick={copyToClipboard}>Copy</button>
                </div>
              </div>
            )}

            {activeTab === 'send' && (
              <form onSubmit={sendETH} className="send-form">
                <h3>Send ETH</h3>
                <div className="form-group">
                  <label>Recipient Address</label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="0x..."
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Amount (ETH)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="send-btn" disabled={loading}>
                  {loading ? 'Processing...' : 'Send ETH'}
                </button>

                {transactionHash && (
                  <div className="tx-success">
                    <p>✓ Transaction sent!</p>
                    <p className="tx-hash">Hash: {transactionHash.substring(0, 10)}...{transactionHash.substring(58)}</p>
                  </div>
                )}
              </form>
            )}

            {error && <div className="error-message">{error}</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default Wallet;
