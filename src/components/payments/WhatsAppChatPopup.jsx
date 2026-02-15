import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    IconButton
} from '@mui/material';
import {
    Close,
    Send,
    CheckCircle,
    Cancel,
    AccessTime,
    Phone as PhoneIcon,
    WhatsApp as WhatsAppIcon,
    DoneAll,
    Done,
    Schedule
} from '@mui/icons-material';
import '../../styles/WhatsAppChatPopup.css';

const WhatsAppChatPopup = ({ 
    open, 
    onClose, 
    customer, 
    transaction,
    onPinSubmit,
    onResendPrompt,
    autoCloseTime = 30000 // 30 seconds default
}) => {
    const [messages, setMessages] = useState([]);
    const [pinInput, setPinInput] = useState('');
    const [pinAttempts, setPinAttempts] = useState(0);
    const [pinError, setPinError] = useState('');
    const [timeLeft, setTimeLeft] = useState(autoCloseTime / 1000); // in seconds
    const [transactionStatus, setTransactionStatus] = useState('pending'); // pending, success, failed, expired
    const [showPinInput, setShowPinInput] = useState(true);
    const messagesEndRef = useRef(null);
    const timerRef = useRef(null);
    const inputRef = useRef(null);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (open) {
            // Reset state when opened
            resetChat();
            
            // Initial greeting message
            addMessage('system', '🔒 This is a secure payment channel. Your information is encrypted.');
            addMessage('system', '📱 WhatsApp Payment Request', 'system-highlight');
            
            // Add payment request message
            const paymentMessage = `*PAYMENT REQUEST*\n\n` +
                `Amount: *KES ${transaction?.amount?.toLocaleString() || '0'}*\n` +
                `To: *${customer?.name || 'Customer'}*\n` +
                `Reference: *${transaction?.transactionId || 'N/A'}*\n\n` +
                `To complete this payment, please enter your MPESA PIN:`;
            
            addMessage('agent', paymentMessage);
            
            // Focus PIN input
            setTimeout(() => {
                inputRef.current?.focus();
            }, 500);

            // Start countdown timer
            startTimer();
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [open]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const resetChat = () => {
        setMessages([]);
        setPinInput('');
        setPinAttempts(0);
        setPinError('');
        setTimeLeft(autoCloseTime / 1000);
        setTransactionStatus('pending');
        setShowPinInput(true);
    };

    const startTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Time expired
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
        setShowPinInput(false);
        addMessage('system', '⏰ This payment request has expired. Please request a new prompt.', 'system-error');
        
        // Update transaction status via callback
        if (onPinSubmit) {
            onPinSubmit(null, 'EXPIRED');
        }
    };

    const addMessage = (sender, text, className = '') => {
        const newMessage = {
            id: Date.now() + Math.random(),
            sender,
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            className
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePinSubmit = async () => {
        // Clear any previous error
        setPinError('');

        // Validate PIN format
        if (!pinInput || pinInput.length !== 4 || !/^\d+$/.test(pinInput)) {
            setPinError('Please enter a valid 4-digit PIN');
            return;
        }

        // Add user message
        addMessage('customer', '••••');

        // Check PIN (demo: only accept 1234)
        if (pinInput === '1234') {
            // Success path
            setPinAttempts(0);
            setShowPinInput(false);
            setTransactionStatus('success');
            
            // Clear timer
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            // Add processing message
            addMessage('system', '⏳ Processing your payment...', 'system-processing');
            
            // Simulate processing delay
            setTimeout(() => {
                // Success message
                addMessage('system', '✅ Payment successful!', 'system-success');
                addMessage('system', `📄 Receipt: *${transaction?.mpesaReceiptNumber || 'MPESA' + Date.now().toString().slice(-8)}*`, 'system-highlight');
                addMessage('system', `💰 Amount: *KES ${transaction?.amount?.toLocaleString()}*`, 'system-highlight');
                addMessage('system', `📊 New loan balance: *KES ${(transaction?.loanBalanceAfter || 0).toLocaleString()}*`, 'system-highlight');
                
                // Add success checkmark from agent
                setTimeout(() => {
                    addMessage('agent', '✅ Payment confirmed! Thank you.', 'agent-success');
                }, 1000);

                // Call the success callback
                if (onPinSubmit) {
                    onPinSubmit('1234', 'SUCCESS');
                }
            }, 1500);
        } else {
            // Failed attempt
            const newAttempts = pinAttempts + 1;
            setPinAttempts(newAttempts);

            // Add error message
            addMessage('system', '❌ Incorrect PIN. Please try again.', 'system-error');

            if (newAttempts >= 3) {
                // Max attempts reached
                setShowPinInput(false);
                setTransactionStatus('failed');
                addMessage('system', '❌ Too many incorrect attempts. Transaction failed.', 'system-error');
                
                // Clear timer
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }

                // Call failure callback
                if (onPinSubmit) {
                    onPinSubmit(pinInput, 'FAILED', 'Maximum PIN attempts exceeded');
                }
            } else {
                // Show remaining attempts
                const attemptsLeft = 3 - newAttempts;
                addMessage('system', `⚠️ ${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining.`, 'system-warning');
                setPinInput('');
                
                // Call failed attempt callback
                if (onPinSubmit) {
                    onPinSubmit(pinInput, 'FAILED_ATTEMPT', { attemptsLeft, totalAttempts: newAttempts });
                }
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && showPinInput && transactionStatus === 'pending') {
            handlePinSubmit();
        }
    };

    const handleResendPrompt = () => {
        if (onResendPrompt) {
            onResendPrompt();
            resetChat();
            addMessage('system', '🔄 New payment prompt sent.', 'system-info');
        }
    };

    if (!open) return null;

    return (
        <div className="whatsapp-chat-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="whatsapp-chat-container" onClick={e => e.stopPropagation()}>
                {/* Chat Header */}
                <div className="whatsapp-chat-header">
                    <div className="whatsapp-header-left">
                        <div className="whatsapp-header-icon">
                            <WhatsAppIcon sx={{ fontSize: 20 }} />
                        </div>
                        <div className="whatsapp-header-info">
                            <Typography className="whatsapp-header-title">
                                WhatsApp Payment
                            </Typography>
                            <Typography className="whatsapp-header-subtitle">
                                {customer?.name || 'Customer'} • +{transaction?.phoneNumber || '254...'}
                            </Typography>
                        </div>
                    </div>
                    <div className="whatsapp-header-right">
                        <div className={`whatsapp-timer ${timeLeft < 10 ? 'warning' : ''}`}>
                            <Schedule sx={{ fontSize: 14 }} />
                            <span>{formatTime(timeLeft)}</span>
                        </div>
                        <IconButton 
                            onClick={onClose}
                            className="whatsapp-close-btn"
                            size="small"
                        >
                            <Close sx={{ fontSize: 18 }} />
                        </IconButton>
                    </div>
                </div>

                {/* Chat Messages Area */}
                <div className="whatsapp-chat-messages">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`whatsapp-message-wrapper ${message.sender}`}
                        >
                            <div className={`whatsapp-message ${message.className}`}>
                                <div className="whatsapp-message-text">
                                    {message.text.split('\n').map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line}
                                            {i < message.text.split('\n').length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <div className="whatsapp-message-time">
                                    {message.timestamp}
                                    {message.sender === 'customer' && (
                                        <Done sx={{ fontSize: 12, marginLeft: '0.125rem' }} />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* PIN Input Area (only shown when pending and within time) */}
                    {showPinInput && transactionStatus === 'pending' && (
                        <div className="whatsapp-pin-input-wrapper">
                            <div className="whatsapp-pin-header">
                                <Typography className="whatsapp-pin-label">
                                    Enter MPESA PIN
                                </Typography>
                                {pinAttempts > 0 && (
                                    <Typography className="whatsapp-pin-attempts">
                                        Attempt {pinAttempts}/3
                                    </Typography>
                                )}
                            </div>
                            <div className="whatsapp-pin-input-container">
                                <input
                                    ref={inputRef}
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength="4"
                                    value={pinInput}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setPinInput(value);
                                        setPinError('');
                                    }}
                                    onKeyPress={handleKeyPress}
                                    placeholder="• • • •"
                                    className={`whatsapp-pin-input ${pinError ? 'error' : ''}`}
                                    autoFocus
                                />
                                <button
                                    onClick={handlePinSubmit}
                                    disabled={!pinInput || pinInput.length !== 4}
                                    className="whatsapp-pin-submit-btn"
                                >
                                    <Send sx={{ fontSize: 18 }} />
                                </button>
                            </div>
                            {pinError && (
                                <Typography className="whatsapp-pin-error">
                                    {pinError}
                                </Typography>
                            )}
                            <Typography className="whatsapp-pin-hint">
                                For demo, use PIN: <strong>1234</strong>
                            </Typography>
                        </div>
                    )}

                    {/* Success State */}
                    {transactionStatus === 'success' && (
                        <div className="whatsapp-success-state">
                            <div className="success-icon">
                                <CheckCircle sx={{ fontSize: 48 }} />
                            </div>
                            <Typography className="success-title">
                                Payment Successful!
                            </Typography>
                            <Typography className="success-amount">
                                KES {transaction?.amount?.toLocaleString()}
                            </Typography>
                            <button
                                onClick={onClose}
                                className="success-close-btn"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {/* Failed State */}
                    {transactionStatus === 'failed' && (
                        <div className="whatsapp-failed-state">
                            <div className="failed-icon">
                                <Cancel sx={{ fontSize: 48 }} />
                            </div>
                            <Typography className="failed-title">
                                Payment Failed
                            </Typography>
                            <Typography className="failed-message">
                                Too many incorrect attempts.
                            </Typography>
                            <button
                                onClick={handleResendPrompt}
                                className="failed-resend-btn"
                            >
                                Resend Prompt
                            </button>
                        </div>
                    )}

                    {/* Expired State */}
                    {transactionStatus === 'expired' && (
                        <div className="whatsapp-expired-state">
                            <div className="expired-icon">
                                <AccessTime sx={{ fontSize: 48 }} />
                            </div>
                            <Typography className="expired-title">
                                Request Expired
                            </Typography>
                            <Typography className="expired-message">
                                The payment request timed out.
                            </Typography>
                            <button
                                onClick={handleResendPrompt}
                                className="expired-resend-btn"
                            >
                                Resend Prompt
                            </button>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Footer */}
                <div className="whatsapp-chat-footer">
                    <div className="whatsapp-footer-left">
                        <PhoneIcon sx={{ fontSize: 14, color: '#25D366' }} />
                        <span className="whatsapp-footer-phone">
                            +{transaction?.phoneNumber || '254712345678'}
                        </span>
                    </div>
                    <div className="whatsapp-footer-right">
                        <span className="whatsapp-footer-encryption">
                            🔒 End-to-end encrypted
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppChatPopup;