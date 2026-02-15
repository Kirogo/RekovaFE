import React, { useState, useEffect, useRef } from 'react';
import {
    Close,
    Lock,
    SignalCellularAlt,
    BatteryFull,
    Wifi,
    CheckCircle,
    Cancel,
    AccessTime,
    ArrowBack,
    Message
} from '@mui/icons-material';
import '../../styles/MPesaStkPopup.css';

const MPesaStkPopup = ({ 
    open, 
    onClose, 
    customer, 
    transaction,
    onPinSubmit,
    onResendPrompt,
    autoCloseTime = 30000 // 30 seconds default
}) => {
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinAttempts, setPinAttempts] = useState(0);
    const [pinError, setPinError] = useState('');
    const [timeLeft, setTimeLeft] = useState(autoCloseTime / 1000);
    const [transactionStatus, setTransactionStatus] = useState('pending'); // pending, success, failed, expired
    const [processing, setProcessing] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
    const timerRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (open) {
            resetPopup();
            startTimer();
            // Focus first PIN input after a short delay
            setTimeout(() => {
                inputRefs[0].current?.focus();
            }, 500);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [open]);

    const resetPopup = () => {
        setPin(['', '', '', '']);
        setPinAttempts(0);
        setPinError('');
        setTimeLeft(autoCloseTime / 1000);
        setTransactionStatus('pending');
        setProcessing(false);
        setShowReceipt(false);
    };

    const startTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleExpire = () => {
        setTransactionStatus('expired');
        setProcessing(false);
        
        // Update transaction status via callback
        if (onPinSubmit) {
            onPinSubmit(null, 'EXPIRED');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTime12Hour = (date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-KE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handlePinChange = (index, value) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 4).split('');
            const newPin = [...pin];
            digits.forEach((digit, i) => {
                if (i < 4) newPin[i] = digit;
            });
            setPin(newPin);
            
            // Focus last filled or next empty
            const lastFilledIndex = Math.min(digits.length - 1, 3);
            if (lastFilledIndex < 3) {
                inputRefs[lastFilledIndex + 1].current?.focus();
            } else {
                inputRefs[3].current?.focus();
            }
        } else if (value === '') {
            // Handle delete
            const newPin = [...pin];
            newPin[index] = '';
            setPin(newPin);
            
            if (index > 0) {
                inputRefs[index - 1].current?.focus();
            }
        } else if (/^\d*$/.test(value)) {
            // Handle single digit
            const newPin = [...pin];
            newPin[index] = value;
            setPin(newPin);
            
            // Move to next input if not last
            if (index < 3 && value !== '') {
                inputRefs[index + 1].current?.focus();
            }
            
            // Auto-submit if all digits entered
            if (index === 3 && value !== '') {
                const fullPin = [...newPin.slice(0, 3), value].join('');
                setTimeout(() => handlePinSubmit(fullPin), 100);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && pin[index] === '') {
            // Move to previous input on backspace if current is empty
            if (index > 0) {
                inputRefs[index - 1].current?.focus();
            }
        }
    };

    const handlePinSubmit = async (fullPin) => {
        if (processing) return;

        const pinValue = fullPin || pin.join('');
        
        if (pinValue.length !== 4 || !/^\d+$/.test(pinValue)) {
            setPinError('Please enter a valid 4-digit PIN');
            return;
        }

        setProcessing(true);
        setPinError('');

        // Add a small delay to show processing state
        setTimeout(() => {
            // Check PIN (demo: only accept 1234)
            if (pinValue === '1234') {
                // Success path
                setPinAttempts(0);
                setTransactionStatus('success');
                setShowReceipt(true);
                
                // Clear timer
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }

                // Call the success callback
                if (onPinSubmit) {
                    onPinSubmit('1234', 'SUCCESS');
                }
            } else {
                // Failed attempt
                const newAttempts = pinAttempts + 1;
                setPinAttempts(newAttempts);
                setPin(['', '', '', '']);
                setProcessing(false);

                if (newAttempts >= 3) {
                    // Max attempts reached
                    setTransactionStatus('failed');
                    setPinError('Maximum PIN attempts exceeded');
                    
                    // Clear timer
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                    }

                    // Call failure callback
                    if (onPinSubmit) {
                        onPinSubmit(pinValue, 'FAILED', 'Maximum PIN attempts exceeded');
                    }
                } else {
                    // Show error and focus first input
                    setPinError(`Incorrect PIN. ${3 - newAttempts} attempt(s) left.`);
                    inputRefs[0].current?.focus();
                    
                    // Call failed attempt callback
                    if (onPinSubmit) {
                        onPinSubmit(pinValue, 'FAILED_ATTEMPT', { 
                            attemptsLeft: 3 - newAttempts, 
                            totalAttempts: newAttempts 
                        });
                    }
                }
            }
        }, 800);
    };

    const handleResend = () => {
        if (onResendPrompt) {
            onResendPrompt();
            resetPopup();
            startTimer();
            setTimeout(() => {
                inputRefs[0].current?.focus();
            }, 500);
        }
    };

    if (!open) return null;

    // Format amount with commas
    const formattedAmount = transaction?.amount?.toLocaleString() || '0';
    const customerName = customer?.name || transaction?.customerName || 'Customer';
    const accountNumber = customer?.customerId || transaction?.transactionId || 'N/A';
    const currentDateTime = new Date();
    const timestamp = currentDateTime.toLocaleTimeString('en-KE', {
        hour: '2-digit',
        minute: '2-digit'
    });
    const date = formatDate(currentDateTime);

    return (
        <div className="mpesa-stk-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="mpesa-stk-container" onClick={e => e.stopPropagation()}>
                
                {/* Status Bar */}
                <div className="mpesa-status-bar">
                    <div className="status-bar-left">
                        <span>{formatTime12Hour(currentTime)}</span>
                    </div>
                    <div className="status-bar-right">
                        <SignalCellularAlt sx={{ fontSize: 14 }} />
                        <Wifi sx={{ fontSize: 14 }} />
                        <BatteryFull sx={{ fontSize: 14 }} />
                    </div>
                </div>

                {/* App Header */}
                <div className="mpesa-app-header">
                    <div className="app-header-left">
                        <ArrowBack sx={{ fontSize: 20, color: '#757575' }} />
                    </div>
                    <div className="app-header-center">
                        <span className="app-header-title">M-PESA</span>
                    </div>
                </div>

                {/* Timer Bar */}
                <div className="mpesa-timer-bar">
                    <div 
                        className="timer-progress" 
                        style={{ width: `${(timeLeft / (autoCloseTime / 1000)) * 100}%` }}
                    />
                    <span className="timer-text">
                        {timeLeft < 10 ? '⚠️ ' : '⏱️ '}{formatTime(timeLeft)}
                    </span>
                </div>

                {/* Main Content */}
                <div className="mpesa-main-content">
                    
                    {/* Payment Request Message - Always visible */}
                    <div className="payment-request-message">
                        <div className="message-header">
                            <Message sx={{ fontSize: 20, color: '#075e54' }} />
                            <span className="message-label">Payment Request</span>
                        </div>
                        <div className="message-bubble">
                            <div className="message-content">
                                <div className="message-line"><strong>Dear {customerName},</strong></div>
                                <div className="message-line">You have a payment request for <strong>KES {formattedAmount}</strong> to clear this months' arrears.</div>
                                <div className="message-line">To complete payment, please enter your MPESA PIN.</div>
                                <div className="message-footer">
                                    <span className="message-brand"><strong>NCBA, Go For It.</strong></span>
                                    <span className="message-time">{timestamp}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Success Receipt Screen */}
                    {transactionStatus === 'success' && showReceipt ? (
                        <div className="mpesa-receipt-screen">
                            <div className="receipt-header">
                                <CheckCircle sx={{ fontSize: 48, color: '#4CAF50' }} />
                                <div className="receipt-title">Payment Successful!</div>
                            </div>
                            
                            <div className="receipt-body">
                                <div className="receipt-message">
                                    <div className="message-line">Your account has been debited</div>
                                    <div className="message-line amount-line">KES {formattedAmount}</div>
                                    <div className="message-line">on {date} at {timestamp}</div>
                                    <div className="message-line">using {transaction?.phoneNumber || '2547XXXXXXXX'}</div>
                                </div>
                                
                                <div className="receipt-divider"></div>
                                
                                <div className="receipt-ref">
                                    <span className="ref-label">Ref:</span>
                                    <span className="ref-value">{transaction?.transactionId || `MP${Date.now().toString().slice(-8)}`}</span>
                                </div>
                                
                                <div className="receipt-footer-message">
                                    For queries, call 071105644/0732156444.
                                </div>
                                
                                <div className="receipt-balance">
                                    <span className="balance-label">New Loan Balance</span>
                                    <span className="balance-value">
                                        KES {(transaction?.loanBalanceAfter || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            
                            <button 
                                className="receipt-done-btn"
                                onClick={onClose}
                            >
                                Done
                            </button>
                        </div>
                    ) : transactionStatus === 'failed' ? (
                        /* Failed Screen */
                        <div className="mpesa-failed-screen">
                            <Cancel sx={{ fontSize: 48, color: '#F44336' }} />
                            <div className="failed-title">Transaction Failed</div>
                            <div className="failed-message">
                                {pinError || 'Maximum PIN attempts exceeded'}
                            </div>
                            <div className="failed-customer-info">
                                Dear {customerName}, your payment could not be processed.
                            </div>
                            
                            <button 
                                className="failed-retry-btn"
                                onClick={handleResend}
                            >
                                Request New PIN
                            </button>
                        </div>
                    ) : transactionStatus === 'expired' ? (
                        /* Expired Screen */
                        <div className="mpesa-expired-screen">
                            <AccessTime sx={{ fontSize: 48, color: '#FF9800' }} />
                            <div className="expired-title">Request Expired</div>
                            <div className="expired-message">
                                The payment request has timed out
                            </div>
                            <div className="expired-customer-info">
                                Dear {customerName}, please request a new payment prompt.
                            </div>
                            
                            <button 
                                className="expired-resend-btn"
                                onClick={handleResend}
                            >
                                Resend Request
                            </button>
                        </div>
                    ) : (
                        /* PIN Entry Screen Only */
                        <div className="pin-entry-only">
                            {/* PIN Entry */}
                            <div className="mpesa-pin-section">
                                <div className="pin-label">Enter M-PESA PIN:</div>
                                
                                <div className="pin-input-container">
                                    {[0, 1, 2, 3].map((index) => (
                                        <input
                                            key={index}
                                            ref={inputRefs[index]}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength="1"
                                            value={pin[index]}
                                            onChange={(e) => handlePinChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className={`pin-input ${pinError ? 'error' : ''}`}
                                            disabled={processing}
                                        />
                                    ))}
                                </div>

                                {pinError && (
                                    <div className="pin-error-message">
                                        {pinError}
                                    </div>
                                )}

                                {pinAttempts > 0 && !pinError && (
                                    <div className="pin-attempts">
                                        Attempt {pinAttempts}/3
                                    </div>
                                )}

                                {processing && (
                                    <div className="pin-processing">
                                        <div className="processing-spinner"></div>
                                        <span>Processing...</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer Buttons */}
                            <div className="mpesa-footer-buttons">
                                <button 
                                    className="footer-btn cancel-btn"
                                    onClick={onClose}
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="footer-btn send-btn"
                                    onClick={() => handlePinSubmit()}
                                    disabled={pin.some(d => d === '') || processing}
                                >
                                    Send
                                </button>
                            </div>

                            {/* Demo Hint */}
                            <div className="mpesa-demo-hint">
                                <Lock sx={{ fontSize: 12 }} />
                                <span>Demo PIN: 1234</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Bar */}
                <div className="mpesa-nav-bar">
                    <div className="nav-dot active"></div>
                    <div className="nav-dot"></div>
                    <div className="nav-dot"></div>
                </div>
            </div>
        </div>
    );
};

export default MPesaStkPopup;