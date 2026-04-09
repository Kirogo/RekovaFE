// src/pages/CustomerDetails.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Box,
    Typography,
    LinearProgress,
    Alert,
    Modal,
    IconButton
} from '@mui/material';
import {
    ArrowBack,
    Download,
    SendToMobile,
    Comment,
    Person,
    AccountBalance,
    Receipt,
    History,
    AddToPhotos,
    Close,
    CheckCircle,
    Cancel,
    AccessTime,
    HourglassEmpty,
    Person as PersonIcon,
    Payment,
    ReceiptLong,
    AccountBalance as AccountBalanceIcon,
    DoneAll,
    SupervisorAccount,
    Groups,
    AssignmentInd
} from '@mui/icons-material';
import '../styles/CustomerDetails.css';
import LayoutWrapper from '../LayoutWrapper';
import authService from '../services/auth.service';
import { authAxios } from '../services/api';
import MPesaStkPopup from '../components/payments/MPesaStkPopup';

const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [serverOnline, setServerOnline] = useState(true);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);

    // User role state
    const [userRole, setUserRole] = useState('officer');
    const [isSupervisor, setIsSupervisor] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Comment Section State
    const [newComment, setNewComment] = useState('');
    const [savingComment, setSavingComment] = useState(false);
    const [commentSaved, setCommentSaved] = useState(false);
    const [commentHistory, setCommentHistory] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);

    // Payment Modal States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showFullBalancePopup, setShowFullBalancePopup] = useState(false);
    const [paymentData, setPaymentData] = useState({
        phoneNumber: '',
        alternativePhoneNumber: '',
        amount: '',
        useAlternativeNumber: false
    });
    const [mpesaStatus, setMpesaStatus] = useState(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentInitiated, setPaymentInitiated] = useState(false);
    const [showPinEntry, setShowPinEntry] = useState(false);
    const [manualPin, setManualPin] = useState('');

    // WhatsApp Chat Popup State
    const [showWhatsAppChat, setShowWhatsAppChat] = useState(false);
    const [activeTransaction, setActiveTransaction] = useState(null);

    // Active transaction tracking
    const [hasActiveTransaction, setHasActiveTransaction] = useState(false);
    const [activeTransactionStatus, setActiveTransactionStatus] = useState(null);

    // Transaction filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Promise to pay states
    const [promises, setPromises] = useState([]);
    const [promisesLoading, setPromisesLoading] = useState(false);
    const [showPromiseModal, setShowPromiseModal] = useState(false);
    const [promiseData, setPromiseData] = useState({
        promiseAmount: '',
        promiseDate: '',
        promiseType: 'FULL_PAYMENT',
        notes: ''
    });

    // Tab state
    const [activeTab, setActiveTab] = useState('customers');
    
    // Handle query parameter for tab selection
    const [searchParams] = useSearchParams();
    useEffect(() => {
        const tabParam = searchParams.get('activeTab');
        if (tabParam && ['customers', 'arrears', 'promises'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    // Transaction modal states
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [transactionModalOpen, setTransactionModalOpen] = useState(false);
    const [transactionCustomerDetails, setTransactionCustomerDetails] = useState(null);

    // Ref for auto-close timer
    const autoCloseTimerRef = useRef(null);

    // Get user role from auth service
    const getUserInfo = () => {
        const user = authService.getCurrentUser();
        if (!user) return { role: 'officer', isSupervisor: false, isAdmin: false };

        const role = user.role?.toLowerCase() || 'officer';
        const isSupervisorUser = role === 'supervisor';
        const isAdminUser = role === 'admin';

        console.log('👤 CustomerDetails User Info:', {
            username: user.username,
            role: role,
            isSupervisor: isSupervisorUser,
            isAdmin: isAdminUser,
            userId: user.id || user._id
        });

        return {
            role,
            isSupervisor: isSupervisorUser,
            isAdmin: isAdminUser,
            userId: user.id || user._id,
            username: user.username
        };
    };

    // Clear any existing timer on unmount
    useEffect(() => {
        return () => {
            if (autoCloseTimerRef.current) {
                clearTimeout(autoCloseTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showFullBalancePopup) {
                const popup = document.querySelector('.full-balance-popup-attached');
                const fullBalanceButton = document.querySelector('.payment-amount-btn-customer');

                if (popup &&
                    !popup.contains(event.target) &&
                    !fullBalanceButton?.contains(event.target)) {
                    setShowFullBalancePopup(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFullBalancePopup]);

    // Main data fetching effect
    useEffect(() => {
        console.log('=== CUSTOMER DETAILS MOUNTED ===');
        console.log('ID from URL:', id);

        // Get user info first
        const userInfo = getUserInfo();
        setUserRole(userInfo.role);
        setIsSupervisor(userInfo.isSupervisor);
        setIsAdmin(userInfo.isAdmin);

        console.log('🔐 Auth status:', {
            isAuthenticated: authService.isAuthenticated(),
            token: authService.getToken() ? 'Present' : 'Missing',
            user: authService.getCurrentUser()
        });

        // Check authentication first
        if (!authService.isAuthenticated()) {
            console.log('❌ Not authenticated, redirecting to login');
            authService.logout();
            navigate('/login');
            return;
        }

        if (!id || id === 'undefined' || id === 'null') {
            console.error('❌ Invalid ID received');
            setError('Invalid customer ID');
            setLoading(false);
            return;
        }

        fetchCustomerDetails();
        fetchCustomerTransactions();
        fetchCustomerComments();
        fetchCustomerPromises();
    }, [id]);

    useEffect(() => {
        if (customer && !loading) {
            syncLocalComments();
        }
    }, [customer, loading]);

    // Check for active transactions on component mount and when transactions change
    useEffect(() => {
        const checkActiveTransactions = () => {
            if (!Array.isArray(transactions)) {
                setHasActiveTransaction(false);
                setActiveTransactionStatus(null);
                return;
            }

            const activeTx = transactions.find(tx => {
                const status = tx.status?.toLowerCase();
                return status === 'pending' || status === 'initiated';
            });

            setHasActiveTransaction(!!activeTx);
            if (activeTx) {
                setActiveTransactionStatus(activeTx.status);
            }
        };

        checkActiveTransactions();
    }, [transactions]);

    // Poll for transaction status updates when there's an active transaction
    useEffect(() => {
        let pollInterval;

        if (hasActiveTransaction && Array.isArray(transactions)) {
            pollInterval = setInterval(() => {
                fetchCustomerTransactions();
            }, 5000);
        }

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [hasActiveTransaction, id]);

    const fetchCustomerDetails = async () => {
        console.log('🔄 Starting fetchCustomerDetails');

        try {
            setLoading(true);
            setError(null);

            if (!authService.isAuthenticated()) {
                console.log('❌ Not authenticated');
                authService.logout();
                navigate('/login');
                return;
            }

            console.log('🔑 Fetching customer details for ID:', id);

            const response = await authAxios.get(`/customers/${id}`);

            if (response.data.success) {
                const customerData = response.data.data;
                setCustomer(customerData);
                setPaymentData({
                    phoneNumber: customerData.phoneNumber || '',
                    alternativePhoneNumber: '',
                    amount: customerData.arrears || '',
                    useAlternativeNumber: false
                });
                console.log('✅ Customer details loaded:', customerData.name);
                setServerOnline(true);
            } else {
                console.error('❌ API returned success: false:', response.data.message);
                setError(response.data.message || 'Failed to load customer details');
            }
        } catch (error) {
            console.error('❌ Error in fetchCustomerDetails:', error);

            if (error.code === 'ERR_NETWORK') {
                setServerOnline(false);
                setError('Cannot connect to server. Please make sure the backend is running on port 5555.');
            } else if (error.response?.status === 401) {
                console.log('⚠️ 401 Unauthorized - logging out');
                authService.logout();
                navigate('/login');
                return;
            } else {
                setError('Error: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerTransactions = async () => {
        if (!id || id === 'undefined') {
            console.log('Skipping transactions fetch - invalid ID');
            return;
        }

        try {
            setTransactionsLoading(true);
            console.log('🔄 Fetching transactions for customer:', id);

            const response = await authAxios.get(`/transactions?customerId=${id}&limit=10&sort=-createdAt`);

            if (response.data.success) {
                const newTransactions = Array.isArray(response.data.data)
                    ? response.data.data
                    : Array.isArray(response.data.data?.transactions)
                        ? response.data.data.transactions
                        : [];

                console.log('✅ Processed transactions:', newTransactions.length, 'items');
                setTransactions(newTransactions);

                const activeTx = newTransactions.find(tx => {
                    const status = tx.status?.toLowerCase();
                    return status === 'pending' || status === 'initiated';
                });

                setHasActiveTransaction(!!activeTx);
                if (activeTx) {
                    setActiveTransactionStatus(activeTx.status);
                } else {
                    setActiveTransactionStatus(null);
                }
            } else {
                console.warn('⚠️ API returned success: false for transactions');
                setTransactions([]);
            }
        } catch (error) {
            console.error('❌ Error fetching transactions:', error.message);

            if (error.response?.status === 401) {
                console.log('⚠️ 401 Unauthorized - logging out');
                authService.logout();
                navigate('/login');
                return;
            }

            setTransactions([]);
        } finally {
            setTransactionsLoading(false);
        }
    };

    const fetchCustomerComments = async () => {
        if (!id || id === 'undefined') return;

        try {
            setCommentsLoading(true);

            try {
                const response = await authAxios.get(`/customers/${id}/comments`);

                if (response.data.success) {
                    const comments = response.data.data.comments || [];
                    const sortedComments = comments.sort((a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );
                    setCommentHistory(sortedComments);

                    const commentsKey = `customer_comments_${id}`;
                    localStorage.setItem(commentsKey, JSON.stringify(sortedComments.slice(0, 50)));
                }
            } catch (apiError) {
                console.error('Error fetching comments from API:', apiError.message);

                if (apiError.response?.status === 401) {
                    console.log('⚠️ 401 Unauthorized - logging out');
                    authService.logout();
                    navigate('/login');
                    return;
                }

                const commentsKey = `customer_comments_${id}`;
                const storedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');

                if (storedComments.length > 0) {
                    console.log('Using cached comments from localStorage');
                    setCommentHistory(storedComments);
                } else {
                    console.log('No comments found in cache');
                    setCommentHistory([]);
                }
            }
        } catch (error) {
            console.error('Error in fetchCustomerComments:', error);
        } finally {
            setCommentsLoading(false);
        }
    };


    const syncLocalComments = async () => {
        const commentsKey = `customer_comments_${id}`;
        const storedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
        const localComments = storedComments.filter(c => c.savedLocally);

        if (localComments.length === 0) return;

        try {
            for (const localComment of localComments) {
                try {
                    const commentData = {
                        comment: localComment.comment,
                        type: localComment.type || 'follow_up',
                        customerName: localComment.customerName || customer?.name || ''
                    };

                    const response = await authAxios.post(`/customers/${id}/comments`, commentData);

                    if (response.data.success) {
                        const updatedComments = storedComments.map(c => {
                            if (c._id === localComment._id) {
                                return response.data.data.comment;
                            }
                            return c;
                        }).filter(c => !c.savedLocally);

                        localStorage.setItem(commentsKey, JSON.stringify(updatedComments));
                        fetchCustomerComments();
                    }
                } catch (syncError) {
                    console.error('Failed to sync comment:', syncError);
                }
            }
        } catch (error) {
            console.error('Error in syncLocalComments:', error);
        }
    };

    const saveComment = async () => {
        if (!newComment.trim()) return;

        try {
            setSavingComment(true);

            const user = authService.getCurrentUser();
            const currentUser = user?.name || user?.username || 'Agent';

            const commentData = {
                comment: newComment.trim(),
                type: 'follow_up',
                customerName: customer?.name || ''
            };

            const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const optimisticComment = {
                ...commentData,
                _id: tempId,
                author: currentUser,
                createdAt: new Date().toISOString(),
                customerId: id,
                comment: newComment.trim()
            };

            setCommentHistory(prev => [optimisticComment, ...prev]);
            const commentText = newComment;
            setNewComment('');

            try {
                const response = await authAxios.post(`/customers/${id}/comments`, commentData);

                if (response.data.success) {
                    const savedComment = response.data.data.comment || response.data.data;

                    setCommentHistory(prev =>
                        prev.map(comment =>
                            comment._id === tempId ? savedComment : comment
                        )
                    );

                    setCommentSaved(true);

                    const commentsKey = `customer_comments_${id}`;
                    const cachedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
                    const filteredCache = cachedComments.filter(c => c._id !== tempId);
                    const updatedCache = [savedComment, ...filteredCache];
                    localStorage.setItem(commentsKey, JSON.stringify(updatedCache.slice(0, 50)));

                    setTimeout(() => {
                        setCommentSaved(false);
                    }, 3000);
                } else {
                    console.error('❌ API returned success: false:', response.data.message);
                    throw new Error(response.data.message || 'Failed to save comment');
                }
            } catch (apiError) {
                console.error('❌ API save failed:', apiError.message);

                if (apiError.response?.status === 401) {
                    console.log('⚠️ 401 Unauthorized - logging out');
                    authService.logout();
                    navigate('/login');
                    return;
                }

                const commentsKey = `customer_comments_${id}`;
                const storedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');

                const localComment = {
                    ...optimisticComment,
                    _id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    savedLocally: true,
                    comment: commentText
                };

                const filteredStored = storedComments.filter(c => c._id !== tempId);
                const updatedComments = [localComment, ...filteredStored];
                localStorage.setItem(commentsKey, JSON.stringify(updatedComments.slice(0, 50)));

                setCommentHistory(prev =>
                    prev.map(comment =>
                        comment._id === tempId ? localComment : comment
                    )
                );

                setCommentSaved(true);
                setTimeout(() => setCommentSaved(false), 3000);
                setError('Comment saved locally (server unavailable). Will sync when server is back.');
                setTimeout(() => setError(null), 5000);
            }
        } catch (error) {
            console.error('❌ Error in saveComment:', error);
            setError('Failed to save comment. Please try again.');
        } finally {
            setSavingComment(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            const localDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));
            return localDate.toLocaleDateString('en-KE', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'Africa/Nairobi'
            });
        } catch (error) {
            return 'N/A';
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return { date: 'N/A', time: '', full: 'N/A' };
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return { date: 'Invalid date', time: '', full: 'Invalid date' };
            }

            // Add 3 hours for East African Time (UTC+3)
            const localDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));

            const dateDisplay = localDate.toLocaleDateString('en-KE', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'Africa/Nairobi'
            });

            const timeDisplay = localDate.toLocaleTimeString('en-KE', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Africa/Nairobi'
            });

            return {
                date: dateDisplay,
                time: timeDisplay,
                full: `${dateDisplay} ${timeDisplay}`
            };
        } catch (error) {
            return { date: 'N/A', time: '', full: 'N/A' };
        }
    };

    const formatCurrency = (amount) => {
        const numAmount = parseFloat(amount || 0);
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numAmount);
    };

    const handleRefreshTransactions = () => {
        setTransactionsLoading(true);
        fetchCustomerTransactions();
        setSearchTerm('');
        setStatusFilter('');
        setTimeout(() => {
            setTransactionsLoading(false);
        }, 500);
    };

    const getTransactionNumber = (transaction) => {
        if (transaction.transactionId) return transaction.transactionId;
        if (transaction.mpesaReceiptNumber) return transaction.mpesaReceiptNumber;
        if (transaction.receiptNumber) return transaction.receiptNumber;
        if (transaction.checkoutRequestId) return `CHK${transaction.checkoutRequestId.substring(0, 8)}`;
        if (transaction._id) return `TRX${transaction._id.substring(0, 8).toUpperCase()}`;
        return `TRX${Date.now().toString().substring(5)}`;
    };

    const getStatusColor = (arrears) => {
        const arrearsAmount = parseFloat(arrears || 0);
        if (arrearsAmount === 0) return 'current';
        if (arrearsAmount > 0 && arrearsAmount <= 1000) return 'warning';
        return 'delinquent';
    };

    const getStatusText = (arrears) => {
        const arrearsAmount = parseFloat(arrears || 0);
        if (arrearsAmount === 0) return 'Current';
        if (arrearsAmount > 0 && arrearsAmount <= 1000) return 'Warning';
        return 'In Arrears';
    };

    const getFailureReasonText = (failureReason) => {
        const reasons = {
            'INSUFFICIENT_FUNDS': 'Insufficient Funds',
            'TECHNICAL_ERROR': 'Technical Error',
            'WRONG_PIN': 'Wrong PIN',
            'USER_CANCELLED': 'User Cancelled',
            'NETWORK_ERROR': 'Network Error',
            'EXPIRED': 'Expired',
            'OTHER': 'Other'
        };
        return reasons[failureReason] || 'Unknown';
    };

    const getStatusDisplayText = (status, failureReason) => {
        const statusMap = {
            'success': 'Success',
            'failed': 'Failed',
            'pending': 'Pending',
            'expired': 'Expired',
            'cancelled': 'Cancelled'
        };
        return statusMap[status?.toLowerCase()] || status || 'PENDING';
    };

    const getStatusProps = (status) => {
        const statusUpper = status?.toUpperCase();
        switch (statusUpper) {
            case 'SUCCESS':
                return {
                    text: 'Success',
                    class: 'success',
                    icon: <CheckCircle sx={{ fontSize: 14 }} />
                };
            case 'FAILED':
                return {
                    text: 'Failed',
                    class: 'failed',
                    icon: <Cancel sx={{ fontSize: 14 }} />
                };
            case 'PENDING':
                return {
                    text: 'Pending',
                    class: 'pending',
                    icon: <AccessTime sx={{ fontSize: 14 }} />
                };
            case 'EXPIRED':
                return {
                    text: 'Expired',
                    class: 'expired',
                    icon: <HourglassEmpty sx={{ fontSize: 14 }} />
                };
            case 'CANCELLED':
                return {
                    text: 'Cancelled',
                    class: 'cancelled',
                    icon: <Cancel sx={{ fontSize: 14, color: '#6b7280' }} />
                };
            default:
                return {
                    text: status || 'Unknown',
                    class: 'pending',
                    icon: <AccessTime sx={{ fontSize: 14 }} />
                };
        }
    };

    const filteredTransactions = Array.isArray(transactions)
        ? transactions.filter(transaction => {
            const matchesSearch = !searchTerm ||
                transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getTransactionNumber(transaction).toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = !statusFilter ||
                transaction.status?.toLowerCase() === statusFilter.toLowerCase();
            return matchesSearch && matchesStatus;
        })
        : [];

    const getPromiseStatusClass = (status) => {
        const statusMap = {
            'PENDING': 'pending',
            'FULFILLED': 'fulfilled',
            'BROKEN': 'broken',
            'RESCHEDULED': 'rescheduled',
            'CANCELLED': 'cancelled'
        };
        return statusMap[status] || 'pending';
    };

    const fetchCustomerPromises = async () => {
    if (!id || id === 'undefined') return;

    try {
        setPromisesLoading(true);
        console.log('🔄 Fetching promises for customer:', id);

        const response = await authAxios.get(`/promises/customer/${id}?limit=10`);

        console.log('📦 Promises API Response:', response.data);

        if (response.data.success) {
            // The API returns data as an array directly
            const promisesData = Array.isArray(response.data.data) ? response.data.data : [];
            console.log('✅ Loaded promises:', promisesData.length);
            setPromises(promisesData);
        } else {
            console.warn('⚠️ API returned success: false for promises');
            setPromises([]);
        }
    } catch (error) {
        console.error('❌ Error fetching promises:', error.message);

        if (error.response?.status === 401) {
            console.log('⚠️ 401 Unauthorized - logging out');
            authService.logout();
            navigate('/login');
            return;
        }
        
        setPromises([]);
    } finally {
        setPromisesLoading(false);
    }
};

    const createPromise = async () => {
        console.log('🔄 createPromise called with:', promiseData);
        console.log('📱 Customer ID:', id);

        if (!promiseData.promiseAmount || !promiseData.promiseDate) {
            setError('Please enter amount and date');
            return;
        }

        try {
            const user = authService.getCurrentUser();

            console.log('📤 Sending request to /api/promises with:', {
                customerId: id,
                promiseAmount: parseFloat(promiseData.promiseAmount),
                promiseDate: promiseData.promiseDate,
                promiseType: promiseData.promiseType,
                notes: promiseData.notes
            });

            const response = await authAxios.post('/promises', {
                customerId: id,
                promiseAmount: parseFloat(promiseData.promiseAmount),
                promiseDate: promiseData.promiseDate,
                promiseType: promiseData.promiseType,
                notes: promiseData.notes
            });

            if (response.data.success) {
                setPromiseData({
                    promiseAmount: '',
                    promiseDate: '',
                    promiseType: 'FULL_PAYMENT',
                    notes: ''
                });
                setShowPromiseModal(false);
                fetchCustomerPromises();
                alert('Promise created successfully!');
            }
        } catch (error) {
            console.error('Error creating promise:', error);

            if (error.response?.status === 401) {
                console.log('⚠️ 401 Unauthorized - logging out');
                authService.logout();
                navigate('/login');
                return;
            }

            setError(error.response?.data?.message || 'Failed to create promise');
        }
    };

    const updatePromiseStatus = async (promiseId, status) => {
    try {
        console.log(`🔄 Updating promise ${promiseId} to ${status}`);
        
        // Use the promise ID (not the database id) for the update
        const response = await authAxios.patch(`/promises/${promiseId}/status`, { status });

        console.log('📦 Update response:', response.data);

        if (response.data.success) {
            await fetchCustomerPromises(); // Refresh the promises list
            alert(`Promise marked as ${status.toLowerCase()}`);
        } else {
            setError(response.data.message || 'Failed to update promise');
        }
    } catch (error) {
        console.error('Error updating promise:', error);

        if (error.response?.status === 401) {
            console.log('⚠️ 401 Unauthorized - logging out');
            authService.logout();
            navigate('/login');
            return;
        }

        setError(error.response?.data?.message || 'Failed to update promise');
        setTimeout(() => setError(null), 5000);
    }
};

    const handleProcessPayment = () => {
        console.log('Opening payment modal');
        setShowPaymentModal(true);
        setMpesaStatus(null);
        setPaymentInitiated(false);
        setPaymentData(prev => ({
            ...prev,
            alternativePhoneNumber: '',
            useAlternativeNumber: false
        }));
    };

    const openWhatsAppConversation = () => {
        if (mpesaStatus?.phoneUsed) {
            window.open(`https://wa.me/${mpesaStatus.phoneUsed}`, '_blank');
        }
    };

    const handleManualPinSubmit = async () => {
        if (!manualPin || manualPin.length !== 4 || !/^\d+$/.test(manualPin)) {
            setError('Please enter a valid 4-digit PIN');
            return;
        }

        if (!mpesaStatus?.transactionId) {
            setError('No transaction ID found');
            return;
        }

        try {
            const response = await authAxios.post('/payments/manual-pin', {
                transactionId: mpesaStatus.transactionId,
                pin: manualPin
            });

            if (response.data.success) {
                const transactionStatus = response.data.data?.status || 'SUCCESS';

                setMpesaStatus({
                    status: 'completed',
                    message: 'Payment Completed!',
                    details: '',
                    completedAt: new Date().toISOString(),
                    transactionStatus: transactionStatus
                });
                setShowPinEntry(false);
                setManualPin('');

                setTimeout(() => {
                    fetchCustomerDetails();
                    fetchCustomerTransactions();
                }, 500);

                alert('Payment completed successfully!');
            } else {
                setError(response.data.message || 'Payment failed');
            }
        } catch (error) {
            console.error('Manual PIN error:', error);

            if (error.response?.status === 401) {
                console.log('⚠️ 401 Unauthorized - logging out');
                authService.logout();
                navigate('/login');
                return;
            }

            setError(error.response?.data?.message || 'Failed to process payment');
        }
    };

    const handleExportStatement = async () => {
        try {
            const response = await authAxios.get(`/customers/${id}/statement`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `statement_${customer?.customerId || id}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting statement:', error);

            if (error.response?.status === 401) {
                console.log('⚠️ 401 Unauthorized - logging out');
                authService.logout();
                navigate('/login');
                return;
            }

            setError(error.response?.data?.message || 'Failed to export statement. Please try again.');
        }
    };

    const handlePaymentInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPaymentData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleQuickAmount = (amount, type = 'arrears') => {
        console.log('handleQuickAmount called:', { type, amount });

        if (type === 'fullBalance') {
            console.log('Showing full balance popup');
            setShowFullBalancePopup(true);
        } else {
            setPaymentData(prev => ({
                ...prev,
                amount
            }));
        }
    };

    const confirmFullBalanceFromPopup = () => {
        console.log('confirmFullBalanceFromPopup called');
        const amountNum = parseFloat(customer?.loanBalance || 0);

        if (amountNum > 496500) {
            setError(`Daily MPESA limit is ${formatCurrency(496500)}. The maximum amount that can be collected at once is ${formatCurrency(496500)}.`);
            setTimeout(() => setError(null), 5000);
            setPaymentData(prev => ({
                ...prev,
                amount: '496500'
            }));
        } else {
            setPaymentData(prev => ({
                ...prev,
                amount: customer?.loanBalance || ''
            }));
        }

        setShowFullBalancePopup(false);
    };

    const handleSendPrompt = () => {
        const phoneToUse = paymentData.useAlternativeNumber
            ? paymentData.alternativePhoneNumber
            : paymentData.phoneNumber;

        if (!phoneToUse || !paymentData.amount) {
            setError('Please enter phone number and amount');
            return;
        }

        if (phoneToUse.length !== 12 || !phoneToUse.startsWith('254')) {
            setError('Please enter a valid Kenyan phone number (254XXXXXXXXX)');
            return;
        }

        if (paymentData.useAlternativeNumber && paymentData.alternativePhoneNumber.length !== 12) {
            setError('Please enter a valid alternative Kenyan phone number (254XXXXXXXXX)');
            return;
        }

        const amountNum = parseFloat(paymentData.amount);
        if (amountNum > 496500) {
            setError(`Daily MPESA limit exceeded. Maximum allowed is ${formatCurrency(496500)}`);
            return;
        }

        setShowConfirmationModal(true);
    };

    const handleConfirmPayment = async () => {
        try {
            setProcessingPayment(true);
            setPaymentInitiated(true);
            setShowConfirmationModal(false);

            const user = authService.getCurrentUser();

            const phoneToUse = paymentData.useAlternativeNumber
                ? paymentData.alternativePhoneNumber
                : paymentData.phoneNumber;

            console.log('Sending payment request:', {
                phoneNumber: phoneToUse,
                amount: paymentData.amount,
                customer: customer?.name
            });

            const response = await authAxios.post('/payments/initiate', {
                phoneNumber: phoneToUse,
                amount: parseFloat(paymentData.amount),
                description: `Loan repayment for ${customer?.name}`,
                customerId: customer?.id || id,
                isAlternativeNumber: paymentData.useAlternativeNumber,
                originalPhoneNumber: paymentData.phoneNumber,
                initiatedBy: user?.username || 'Agent'
            });

            console.log('Payment request response:', response.data);

            if (response.data.success) {
                const transactionData = {
                    transactionId: response.data.data?.transactionId,
                    phoneNumber: phoneToUse,
                    amount: parseFloat(paymentData.amount),
                    customerName: customer?.name,
                    mpesaReceiptNumber: response.data.data?.mpesaReceiptNumber,
                    loanBalanceAfter: response.data.data?.customer?.loanBalanceAfter || customer?.loanBalance - parseFloat(paymentData.amount)
                };

                console.log('Setting active transaction:', transactionData);
                setActiveTransaction(transactionData);
                closePaymentModal();
                setShowWhatsAppChat(true);
                fetchCustomerTransactions();
            } else {
                setMpesaStatus({
                    status: 'failed',
                    message: response.data.message || 'Failed to send payment request',
                    details: 'Please check the phone number and try again.'
                });
                setPaymentInitiated(false);
                setProcessingPayment(false);
            }
        } catch (error) {
            console.error('Error sending payment request:', error);

            if (error.response?.status === 401) {
                console.log('⚠️ 401 Unauthorized - logging out');
                authService.logout();
                navigate('/login');
                return;
            }

            setMpesaStatus({
                status: 'error',
                message: error.response?.data?.message || 'Failed to send payment request',
                details: error.response?.data?.error || 'Please check your connection and try again.',
                code: error.response?.status
            });
            setPaymentInitiated(false);
            setProcessingPayment(false);
        }
    };

    const handleWhatsAppPinSubmit = async (pin, status, errorDetails) => {
        console.log('🔍 handleWhatsAppPinSubmit called with:', { pin, status, errorDetails, activeTransaction });

        if (!activeTransaction) {
            console.error('❌ No active transaction found');
            alert('No active transaction found. Please initiate a new payment.');
            return;
        }

        if (!activeTransaction.transactionId) {
            console.error('❌ No transaction ID in active transaction:', activeTransaction);
            alert('Transaction ID missing. Please initiate a new payment.');
            return;
        }

        try {
            if (status === 'SUCCESS') {
                console.log('✅ PIN entered, verifying with backend for transaction:', activeTransaction.transactionId);

                const requestBody = {
                    transactionId: activeTransaction.transactionId,
                    pin: pin
                };
                console.log('📤 Sending request:', requestBody);

                const response = await authAxios.post('/payments/verify-pin', requestBody);

                console.log('PIN verification response:', response.data);

                if (response.data.success) {
                    console.log('✅ PIN verified successfully, transaction status:', response.data.data?.status);

                    setTransactions(prevTransactions =>
                        prevTransactions.map(t =>
                            t.transactionId === activeTransaction.transactionId
                                ? { ...t, status: 'SUCCESS', mpesaReceiptNumber: response.data.data?.mpesaReceiptNumber }
                                : t
                        )
                    );

                    alert(`✅ Payment successful! Receipt: ${response.data.data?.mpesaReceiptNumber || 'N/A'}`);

                    setTimeout(() => {
                        fetchCustomerDetails();
                        fetchCustomerTransactions();
                        setTimeout(() => {
                            setShowWhatsAppChat(false);
                            setActiveTransaction(null);
                        }, 1000);
                    }, 500);
                } else {
                    console.error('PIN verification failed:', response.data.message);
                    alert('Payment failed: ' + (response.data.message || 'Unknown error'));
                }
            } else if (status === 'FAILED' || status === 'EXPIRED') {
                try {
                    await authAxios.post(`/payments/mark-failed/${activeTransaction.transactionId}`, {
                        failureReason: status === 'EXPIRED' ? 'EXPIRED' : 'WRONG_PIN'
                    });
                    fetchCustomerTransactions();
                    alert(`Payment ${status.toLowerCase()}. Please try again.`);
                    setShowWhatsAppChat(false);
                    setActiveTransaction(null);
                } catch (err) {
                    console.error('Error marking transaction as failed:', err);
                }
            }
        } catch (error) {
            console.error('Error in WhatsApp PIN submission:', error);
            if (error.response?.data?.message) {
                alert('Payment failed: ' + error.response.data.message);
            } else {
                alert('An error occurred while processing the payment. Please try again.');
            }
        }
    };

    const handleResendPrompt = async () => {
        setShowWhatsAppChat(false);
        setActiveTransaction(null);
        setShowPaymentModal(true);
        setPaymentInitiated(false);
        setProcessingPayment(false);
    };

    const handlePinSubmit = async (transactionId, pin) => {
        try {
            console.log('Submitting PIN:', { transactionId, pin });

            const response = await authAxios.post('/payments/process-pin', {
                transactionId: transactionId,
                pin: pin
            });

            console.log('PIN Response:', response.data);

            if (response.data.success) {
                alert('✅ Payment successful! Receipt: ' + response.data.data.receipt);
                fetchCustomerDetails();
                fetchCustomerTransactions();
                closePaymentModal();
            } else {
                alert('❌ Payment failed: ' + response.data.message);
            }
        } catch (error) {
            console.error('PIN submission error:', error);

            if (error.response?.status === 401) {
                console.log('⚠️ 401 Unauthorized - logging out');
                authService.logout();
                navigate('/login');
                return;
            }

            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const startStatusPolling = (transactionId) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await authAxios.get(`/payments/status/${transactionId}`);

                if (response.data.success) {
                    const transaction = response.data.data.transaction;
                    const status = transaction.status?.toUpperCase();

                    if (status !== 'PENDING') {
                        clearInterval(pollInterval);

                        if (status === 'SUCCESS') {
                            setMpesaStatus(prev => ({
                                ...prev,
                                status: 'completed',
                                message: 'Payment completed via Prompt',
                                details: 'The customer has confirmed the payment.',
                                completedAt: new Date().toISOString()
                            }));
                            alert('Payment completed successfully!');
                        } else if (status === 'FAILED') {
                            setMpesaStatus(prev => ({
                                ...prev,
                                status: 'failed',
                                message: '❌ Payment failed',
                                details: transaction.errorMessage || 'Payment was not completed.',
                                failedAt: new Date().toISOString()
                            }));
                        } else if (status === 'EXPIRED') {
                            setMpesaStatus(prev => ({
                                ...prev,
                                status: 'expired',
                                message: '⏰ Payment request expired',
                                details: 'The request expired after 30 minutes without response.'
                            }));
                        }

                        fetchCustomerDetails();
                        fetchCustomerTransactions();
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 5000);

        setTimeout(() => {
            clearInterval(pollInterval);
            setMpesaStatus(prev => ({
                ...prev,
                status: 'expired',
                message: '⏰ Polling stopped',
                details: 'Status polling stopped after 30 minutes.'
            }));
        }, 30 * 60 * 1000);
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setMpesaStatus(null);
        setPaymentInitiated(false);
        setShowFullBalancePopup(false);
        setProcessingPayment(false);

        if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current);
            autoCloseTimerRef.current = null;
        }
    };

    const handleTransactionClick = async (transaction) => {
        setSelectedTransaction(transaction);

        if (transaction.customerId?._id || transaction.customerId) {
            try {
                const customerId = transaction.customerId._id || transaction.customerId;
                const response = await authAxios.get(`/customers/${customerId}`);

                if (response.data.success) {
                    setTransactionCustomerDetails(response.data.data.customer);
                } else {
                    setTransactionCustomerDetails(null);
                }
            } catch (error) {
                console.error('Error fetching customer details:', error);
                setTransactionCustomerDetails(null);
            }
        } else {
            setTransactionCustomerDetails(null);
        }

        setTransactionModalOpen(true);
    };

    const handleCloseTransactionModal = () => {
        setTransactionModalOpen(false);
        setSelectedTransaction(null);
        setTransactionCustomerDetails(null);
    };

    const calculateLoanDetails = (transaction) => {
        const currentCustomerData = transactionCustomerDetails || transaction.customerId;
        const transactionAmount = parseFloat(transaction.amount || 0);
        const totalLoanBalance = parseFloat(currentCustomerData?.loanBalance || 0);
        const arrearsAmount = parseFloat(currentCustomerData?.arrears || currentCustomerData?.arrearsBalance || 0);
        const totalRepayments = parseFloat(currentCustomerData?.totalRepayments || 0);

        if (transaction.status?.toUpperCase() === 'SUCCESS') {
            const arrearsCleared = Math.min(transactionAmount, arrearsAmount);
            const principalPaid = Math.max(0, transactionAmount - arrearsCleared);
            const remainingArrears = Math.max(0, arrearsAmount - arrearsCleared);
            const remainingPrincipal = Math.max(0, totalLoanBalance - arrearsAmount - principalPaid);
            const newLoanBalance = remainingArrears + remainingPrincipal;
            const totalCleared = arrearsCleared + principalPaid;

            return {
                transactionAmount,
                totalLoanBalance,
                arrearsAmount,
                arrearsCleared,
                principalPaid,
                remainingArrears,
                remainingPrincipal,
                newLoanBalance,
                totalCleared,
                totalRepayments,
                isPaidOff: newLoanBalance <= 0,
                hasArrears: remainingArrears > 0
            };
        } else {
            return {
                transactionAmount,
                totalLoanBalance,
                arrearsAmount,
                arrearsCleared: 0,
                principalPaid: 0,
                remainingArrears: arrearsAmount,
                remainingPrincipal: Math.max(0, totalLoanBalance - arrearsAmount),
                newLoanBalance: totalLoanBalance,
                totalCleared: 0,
                totalRepayments,
                isPaidOff: false,
                hasArrears: arrearsAmount > 0
            };
        }
    };

    const getRoleIcon = () => {
        if (isSupervisor) return <SupervisorAccount sx={{ fontSize: 16 }} />;
        if (isAdmin) return <Groups sx={{ fontSize: 16 }} />;
        return <AssignmentInd sx={{ fontSize: 16 }} />;
    };

    const getRoleSubtitle = () => {
        if (isSupervisor) return 'Supervisor - Manage All Customer Accounts';
        if (isAdmin) return 'Administrator - Full System Access';
        return 'Officer - My Assigned Customer Details';
    };

    const getRoleTextColor = () => {
        if (isSupervisor) return 'supervisor-text';
        if (isAdmin) return 'admin-text';
        return 'officer-text';
    };

    const getRoleAccentClass = () => {
        if (isSupervisor) return 'supervisor-accent';
        if (isAdmin) return 'admin-accent';
        return 'officer-accent';
    };

    const getRolePrimaryClass = () => {
        if (isSupervisor) return 'supervisor-primary';
        if (isAdmin) return 'admin-primary';
        return 'officer-primary';
    };

    if (loading) {
        return (
            <Box className="customer-details-wrapper">
                <LinearProgress sx={{
                    mb: 2,
                    borderRadius: '4px',
                    backgroundColor: '#f5f0ea',
                    '& .MuiLinearProgress-bar': {
                        backgroundColor: '#5c4730'
                    }
                }} />
                <Typography sx={{ color: '#666', textAlign: 'center', fontSize: '0.875rem' }}>
                    Loading customer details...
                </Typography>
            </Box>
        );
    }

    if (error && !customer) {
        return (
            <Box className="customer-details-wrapper">
                <Alert severity="error" sx={{
                    mb: 2,
                    borderRadius: '8px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    fontSize: '0.875rem'
                }}>
                    {error}
                </Alert>
                <button
                    className="customer-details-action-btn"
                    onClick={() => navigate('/customers')}
                >
                    Back to Customers
                </button>
            </Box>
        );
    }

    if (!customer) {
        return (
            <Box className="customer-details-wrapper">
                <Alert severity="warning" sx={{
                    mb: 2,
                    borderRadius: '8px',
                    backgroundColor: '#fffbeb',
                    color: '#92400e',
                    border: '1px solid #fde68a'
                }}>
                    Customer not found
                </Alert>
                <button
                    className="customer-details-action-btn"
                    onClick={() => navigate('/customers')}
                >
                    Back to Customers
                </button>
            </Box>
        );
    }

    return (
        <LayoutWrapper>
            <Box className="customer-details-wrapper">
                {/* Fixed Header - Won't Scroll */}
                <Box className="customer-details-fixed-header">
                    <Box className="customer-details-header">
                        <div className="customer-details-header-content">
                            <div className="customer-details-title-section">
                                <button
                                    onClick={() => navigate('/customers')}
                                    className="back-button"
                                >
                                    <ArrowBack sx={{ fontSize: 16 }} />
                                    Back
                                </button>
                                <Box>
                                    <Typography className="customer-details-subtitle">
                                        ID: {customer?.customerId || customer?._id || id}
                                    </Typography>
                                </Box>
                            </div>

                            <div className="customer-details-actions">
                                <button
                                    className={`customer-details-primary-btn ${getRolePrimaryClass()}`}
                                    onClick={handleProcessPayment}
                                    disabled={parseFloat(customer?.loanBalance || 0) <= 0 || hasActiveTransaction}
                                    style={{
                                        opacity: hasActiveTransaction ? 0.6 : 1,
                                        cursor: hasActiveTransaction ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <SendToMobile sx={{ fontSize: 16 }} />
                                    {hasActiveTransaction ? `Active (${activeTransactionStatus})` : 'Prompt'}
                                </button>

                                <button
                                    className="customer-details-action-btn"
                                    onClick={() => setShowPromiseModal(true)}
                                    style={{
                                        backgroundColor: '#f5f0ea',
                                        color: '#5c4730'
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                    Promise
                                </button>

                                <button
                                    className="customer-details-action-btn"
                                    onClick={handleExportStatement}
                                >
                                    <Download sx={{ fontSize: 16 }} />
                                    Statement
                                </button>
                            </div>
                        </div>
                    </Box>

                    {/* Horizontal Tab Navigation */}
                    <div className="customer-details-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'customers' ? 'active' : ''} ${getRoleTextColor()}`}
                            onClick={() => setActiveTab('customers')}
                        >
                            <Person sx={{ fontSize: 25, marginRight: '0.5rem' }} />
                            Customer
                            {activeTab === 'customers' && <div className={`tab-indicator ${getRoleAccentClass()}`}></div>}
                        </button>

                        <button
                            className={`tab-btn ${activeTab === 'arrears' ? 'active' : ''} ${getRoleTextColor()}`}
                            onClick={() => setActiveTab('arrears')}
                        >
                            <AddToPhotos sx={{ fontSize: 25, marginRight: '0.5rem' }} />
                            Arrears
                            {activeTab === 'arrears' && <div className={`tab-indicator ${getRoleAccentClass()}`}></div>}
                        </button>

                        <button
                            className={`tab-btn ${activeTab === 'promises' ? 'active' : ''} ${getRoleTextColor()}`}
                            onClick={() => setActiveTab('promises')}
                        >
                            <History sx={{ fontSize: 25, marginRight: '0.5rem' }} />
                            PTP
                            {activeTab === 'promises' && <div className={`tab-indicator ${getRoleAccentClass()}`}></div>}
                        </button>
                    </div>
                </Box>

                {/* Scrollable Content Area */}
                <div className="customer-details-content">
                    {/* Tab Content - Customers */}
                    {activeTab === 'customers' && (
                        <div className="tab-content active">
                            <div className="details-card customer-info-card">
                                <div className={`card-header ${getRoleAccentClass()}-border`}>
                                    <Person sx={{ fontSize: 14, marginRight: '0.5rem' }} />
                                    <Typography className={`card-title ${getRoleTextColor()}`}>
                                        Customer Information
                                    </Typography>
                                </div>

                                <div className="card-body">
                                    <div className="customer-info-grid">
                                        <div className="customer-info-item name-item full-width">
                                            <div className="info-label">Full Name</div>
                                            <div className="info-value">{customer?.name || 'N/A'}</div>
                                        </div>

                                        <div className="customer-info-item half-width">
                                            <div className="info-label">Phone Number</div>
                                            <div className="info-value">{customer?.phoneNumber || 'N/A'}</div>
                                        </div>

                                        <div className="customer-info-item half-width">
                                            <div className="info-label">Customer ID</div>
                                            <div className="info-value">{customer?.customerId || 'N/A'}</div>
                                        </div>

                                        <div className="customer-info-item half-width">
                                            <div className="info-label">Loan Type</div>
                                            <div className="info-value">
                                                <span className="loan-type-badge">
                                                    {customer?.loanType || 'Standard Loan'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="customer-info-item email-item half-width">
                                            <div className="info-label">Email Address</div>
                                            <div className="info-value">{customer?.email || 'N/A'}</div>
                                        </div>

                                        <div className="customer-info-item half-width">
                                            <div className="info-label">National ID</div>
                                            <div className="info-value">{customer?.nationalId || 'N/A'}</div>
                                        </div>

                                        <div className="customer-info-item half-width">
                                            <div className="info-label">Account Number</div>
                                            <div className="info-value">{customer?.accountNumber || 'N/A'}</div>
                                        </div>

                                        <div className="customer-info-item half-width">
                                            <div className="info-label">Date Added</div>
                                            <div className="info-value">
                                                {customer?.createdAt ? formatDate(customer.createdAt) : 'N/A'}
                                            </div>
                                        </div>

                                        <div className="customer-info-item status-item half-width">
                                            <div className="info-label">Account Status</div>
                                            <div className="info-value">
                                                <span className={customer?.isActive ? 'active-status' : 'inactive-status'}>
                                                    {customer?.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Content - Arrears */}
                    {activeTab === 'arrears' && (
                        <div className="tab-content active" data-tab="arrears">
                            <div className="details-card loan-details-card" style={{ width: '100%', gridColumn: '1 / -1' }}>
                                <div className={`card-header ${getRoleAccentClass()}-border`}>
                                    <AccountBalance sx={{ fontSize: 14, marginRight: '0.5rem' }} />
                                    <Typography className={`card-title ${getRoleTextColor()}`}>
                                        Loan Details
                                    </Typography>
                                    <span className={`status-badge ${getStatusColor(customer?.arrears)}`}>
                                        {getStatusText(customer?.arrears)}
                                    </span>
                                </div>

                                <div className="card-body">
                                    <div className="loan-info-grid">
                                        <div className="info-item">
                                            <div className="info-label">Loan Balance</div>
                                            <div className="info-value amount">
                                                {formatCurrency(customer?.loanBalance)}
                                            </div>
                                        </div>

                                        <div className="info-item">
                                            <div className="info-label">Arrears Amount</div>
                                            <div className={`info-value amount ${getStatusColor(customer?.arrears)}`}>
                                                {formatCurrency(customer?.arrears)}
                                            </div>
                                        </div>

                                        <div className="info-item">
                                            <div className="info-label">Total Repayments</div>
                                            <div className="info-value amount success">
                                                {formatCurrency(customer?.totalRepayments || 0)}
                                            </div>
                                        </div>

                                        <div className="info-item">
                                            <div className="info-label">Last Payment Date</div>
                                            <div className="info-value">
                                                {customer?.lastPaymentDate ? formatDate(customer.lastPaymentDate) : 'Never'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="details-card comment-card">
                                <div className={`card-header ${getRoleAccentClass()}-border`}>
                                    <Comment sx={{ fontSize: 14, marginRight: '0.5rem' }} />
                                    <Typography className={`card-title ${getRoleTextColor()}`}>
                                        Customer Follow-up
                                    </Typography>
                                    <button
                                        className={`comment-save-btn ${getRolePrimaryClass()}`}
                                        onClick={saveComment}
                                        disabled={savingComment || !newComment.trim()}
                                    >
                                        {savingComment ? 'Saving...' : commentSaved ? '✓ Saved' : 'Save'}
                                    </button>
                                </div>

                                <div className="card-body">
                                    <div className="comment-input-section">
                                        <textarea
                                            className="comment-textarea"
                                            placeholder="Add notes about follow-up, payment promises, or reasons for non-payment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            rows="3"
                                        />
                                    </div>

                                    <div className="comment-history-section">
                                        <div className="comment-history-header">
                                            <Typography className={`comment-history-title ${getRoleTextColor()}`}>
                                                Comment History
                                            </Typography>
                                            {commentsLoading && <span className="loading-indicator">Loading...</span>}
                                        </div>

                                        <div className="comment-history-container">
                                            {commentsLoading ? (
                                                <div className="loading-comments">
                                                    <Typography sx={{ color: '#666', textAlign: 'center', py: 2, fontSize: '0.875rem' }}>
                                                        Loading comments...
                                                    </Typography>
                                                </div>
                                            ) : commentHistory.length === 0 ? (
                                                <div className="no-comments">
                                                    <div className="no-comments-icon">📝</div>
                                                    <Typography className="no-comments-text">
                                                        No comments yet. Add a comment above.
                                                    </Typography>
                                                </div>
                                            ) : (
                                                commentHistory.map((commentItem) => {
                                                    const { date, time } = formatDateTime(commentItem.createdAt);
                                                    return (
                                                        <div key={commentItem._id} className="comment-history-item">
                                                            {commentItem.savedLocally && (
                                                                <div className="local-comment-badge" title="Saved locally (not synced to server)">
                                                                    📱 Local
                                                                </div>
                                                            )}
                                                            <div className="comment-history-content">
                                                                {commentItem.comment}
                                                            </div>
                                                            <div className="comment-history-meta">
                                                                <span className="comment-history-author">
                                                                    {commentItem.author || 'Agent'}
                                                                </span>
                                                                <span className="comment-history-date">
                                                                    {date} {time}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="details-card transactions-card">
                                <div className={`card-header ${getRoleAccentClass()}-border`}>
                                    <Receipt sx={{ fontSize: 14, marginRight: '0.5rem' }} />
                                    <Typography className={`card-title ${getRoleTextColor()}`}>
                                        Recent Transactions
                                    </Typography>
                                    <button
                                        className="refresh-btn"
                                        onClick={handleRefreshTransactions}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                                        </svg>
                                        Refresh
                                    </button>
                                </div>

                                <div className="card-body">
                                    <div className="transaction-filters">
                                        <input
                                            type="text"
                                            placeholder="Search transactions..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="search-input"
                                        />
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="status-filter"
                                        >
                                            <option value="">All Status</option>
                                            <option value="success">Success</option>
                                            <option value="pending">Pending</option>
                                            <option value="failed">Failed</option>
                                            <option value="expired">Expired</option>
                                        </select>
                                    </div>

                                    {transactionsLoading ? (
                                        <div className="loading-transactions">
                                            <div className="spinner"></div>
                                            <div className="loading-text">Loading...</div>
                                        </div>
                                    ) : filteredTransactions.length === 0 ? (
                                        <div className="empty-transactions">
                                            <div className="empty-icon">📄</div>
                                            <div className="empty-text">
                                                {searchTerm || statusFilter ? 'No matching transactions' : 'No transactions found'}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="transactions-table-container">
                                                <table className="transactions-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Trans No</th>
                                                            <th>Amount</th>
                                                            <th>Status</th>
                                                            <th>Date</th>
                                                            <th>Initiator</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredTransactions.slice(0, 10).map((transaction) => {
                                                            const { date, time } = formatDateTime(transaction.createdAt);
                                                            const status = transaction.status?.toLowerCase();

                                                            return (
                                                                <tr
                                                                    key={transaction._id || transaction.transactionId}
                                                                    className="transactions-table-row"
                                                                    onClick={() => handleTransactionClick(transaction)}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <td className="transaction-id">
                                                                        {getTransactionNumber(transaction)}
                                                                    </td>
                                                                    <td className="amount-cell">
                                                                        {formatCurrency(transaction.amount)}
                                                                    </td>
                                                                    <td>
                                                                        <span
                                                                            className="status-badge"
                                                                            style={{
                                                                                backgroundColor: status === 'success' ? '#d1fae5' :
                                                                                    status === 'pending' ? '#fef3c7' :
                                                                                        status === 'failed' ? '#fee2e2' : '#f3f4f6',
                                                                                color: status === 'success' ? '#059669' :
                                                                                    status === 'pending' ? '#d97706' :
                                                                                        status === 'failed' ? '#dc2626' : '#6b7280',
                                                                                border: `1px solid ${status === 'success' ? '#a7f3d0' :
                                                                                    status === 'pending' ? '#fde68a' :
                                                                                        status === 'failed' ? '#fecaca' : '#d1d5db'}`
                                                                            }}
                                                                        >
                                                                            {getStatusDisplayText(transaction.status, transaction.failureReason)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="date-cell">
                                                                        <div className="date">{date}</div>
                                                                        <div className="time">{time}</div>
                                                                    </td>
                                                                    <td className="initiator-cell">
                                                                        {transaction.initiatedBy || 'Agent'}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {(() => {
                                                const successfulTotal = filteredTransactions
                                                    .filter(transaction => transaction.status?.toLowerCase() === 'success')
                                                    .reduce((sum, transaction) => sum + parseFloat(transaction.amount || 0), 0);

                                                return successfulTotal > 0 ? (
                                                    <div className="transactions-total">
                                                        <div className="total-label">Total Successful:</div>
                                                        <div className="total-amount">{formatCurrency(successfulTotal)}</div>
                                                    </div>
                                                ) : null;
                                            })()}

                                            {(() => {
                                                const successfulTotal = filteredTransactions
                                                    .filter(transaction => transaction.status?.toLowerCase() === 'success')
                                                    .reduce((sum, transaction) => sum + parseFloat(transaction.amount || 0), 0);

                                                return successfulTotal > 0 ? (
                                                    <div className="transactions-total">
                                                        <div className="total-label">Total Successful:</div>
                                                        <div className="total-amount">{formatCurrency(successfulTotal)}</div>
                                                    </div>
                                                ) : null;
                                            })()}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Content - Promises */}
                    {activeTab === 'promises' && (
                        <div className="tab-content active" data-tab="promises">
                            <div className="details-card promises-card">
                                <div className={`card-header ${getRoleAccentClass()}-border`}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.5rem' }}>
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                    <Typography className={`card-title ${getRoleTextColor()}`}>
                                        Payment Promises
                                    </Typography>
                                </div>

                                <div className="card-body">
                                    {promisesLoading ? (
                                        <div className="loading-promises">
                                            <div className="spinner"></div>
                                            <div className="loading-text">Loading...</div>
                                        </div>
                                    ) : promises.length === 0 ? (
                                        <div className="empty-promises">
                                            <div className="empty-icon"></div>
                                            <button
                                                onClick={() => setShowPromiseModal(true)}
                                                className={`create-promise-btn ${getRolePrimaryClass()}`}
                                            >
                                                + Create First Promise
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="promises-list">
                                                {promises.slice(0, 5).map((promise) => (
                                                    <div key={promise._id} className="promise-item">
                                                        <div className="promise-header">
                                                            <span className="promise-id">#{promise.promiseId}</span>
                                                            <span className={`promise-status ${getPromiseStatusClass(promise.status)}`}>
                                                                {promise.status}
                                                            </span>
                                                        </div>

                                                        <div className="promise-details">
                                                            <div className="promise-amount">
                                                                {formatCurrency(promise.promiseAmount)}
                                                            </div>
                                                            <div className="promise-date">
                                                                Due: {formatDate(promise.promiseDate)}
                                                            </div>
                                                            {promise.notes && (
                                                                <div className="promise-notes">
                                                                    {promise.notes}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="promise-footer">
                                                            <div className="promise-type">
                                                                {promise.promiseType.replace('_', ' ')}
                                                            </div>
                                                            {promise.status === 'PENDING' && (
                                                                <div className="promise-actions">
                                                                    <button
                                                                        className="promise-action-btn fulfilled"
                                                                        onClick={() => updatePromiseStatus(promise.promiseId, 'FULFILLED')}
                                                                    >
                                                                        ✓ Fulfilled
                                                                    </button>
                                                                    <button
                                                                        className="promise-action-btn broken"
                                                                        onClick={() => updatePromiseStatus(promise.promiseId, 'BROKEN')}
                                                                    >
                                                                        ✗ Broken
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="promises-summary">
                                                <div className="summary-item">
                                                    <span className="summary-label">Pending:</span>
                                                    <span className="summary-value pending">
                                                        {promises.filter(p => p.status === 'PENDING').length}
                                                    </span>
                                                </div>
                                                <div className="summary-item">
                                                    <span className="summary-label">Fulfilled:</span>
                                                    <span className="summary-value fulfilled">
                                                        {promises.filter(p => p.status === 'FULFILLED').length}
                                                    </span>
                                                </div>
                                                <div className="summary-item">
                                                    <span className="summary-label">Broken:</span>
                                                    <span className="summary-value broken">
                                                        {promises.filter(p => p.status === 'BROKEN').length}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="details-card empty-card">
                                <div className={`card-header ${getRoleAccentClass()}-border`}>
                                    <SendToMobile sx={{ fontSize: 14, marginRight: '0.5rem' }} />
                                    <Typography className={`card-title ${getRoleTextColor()}`}>
                                        Payment Processing
                                    </Typography>
                                </div>
                                <div className="card-body">
                                    <div className="empty-state">
                                        <div className="empty-icon">💳</div>
                                        <Typography className={`empty-title ${getRoleTextColor()}`}>
                                            Payment Processing Moved
                                        </Typography>
                                        <Typography className="empty-text">
                                            Use the "Prompt" button in the header to process payments
                                        </Typography>
                                        <button
                                            className={`process-payment-btn ${getRolePrimaryClass()}`}
                                            onClick={handleProcessPayment}
                                            disabled={parseFloat(customer?.loanBalance || 0) <= 0 || hasActiveTransaction}
                                            style={{ marginTop: '1rem' }}
                                        >
                                            <SendToMobile sx={{ fontSize: 16, marginRight: '0.5rem' }} />
                                            {hasActiveTransaction ? `Active (${activeTransactionStatus})` : 'Process Payment'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Payment Modal */}
                {showPaymentModal && (
                    <div className="payment-modal-overlay-customer">
                        <div className="payment-modal-customer">
                            <div className="payment-modal-header-customer">
                                <Typography className={`payment-modal-title-customer ${getRoleTextColor()}`}>
                                    Process Payment
                                </Typography>
                            </div>

                            <div className="payment-modal-body-customer">
                                {(!mpesaStatus || mpesaStatus.status !== 'success') ? (
                                    <>
                                        <div className="payment-info-container-customer">
                                            <div className="payment-info-item-customer">
                                                <span className="payment-info-label-customer">Customer:</span>
                                                <span className="payment-info-value-customer">{customer?.name}</span>
                                            </div>
                                        </div>

                                        <div className="payment-form-group-customer">
                                            <label className="payment-form-label-customer">Primary Phone Number</label>
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                value={paymentData.phoneNumber}
                                                onChange={handlePaymentInputChange}
                                                className="payment-form-input-customer"
                                                placeholder="2547XXXXXXXX"
                                                maxLength="12"
                                                disabled={paymentData.useAlternativeNumber || paymentInitiated}
                                            />
                                            <div className="phone-number-note-customer">
                                                Customer's registered phone number
                                            </div>
                                        </div>

                                        <div className="payment-form-group-customer">
                                            <div className="checkbox-container-customer">
                                                <input
                                                    type="checkbox"
                                                    id="useAlternativeNumber"
                                                    name="useAlternativeNumber"
                                                    checked={paymentData.useAlternativeNumber}
                                                    onChange={handlePaymentInputChange}
                                                    className="checkbox-input-customer"
                                                    disabled={paymentInitiated}
                                                />
                                                <label htmlFor="useAlternativeNumber" className="checkbox-label-customer">
                                                    Use Alternative Phone Number
                                                </label>
                                            </div>

                                            <div className={`alternative-input-container-customer ${paymentData.useAlternativeNumber ? 'active' : 'disabled'}`}>
                                                <label className="payment-form-label-customer">Alternative Phone Number (254XXXXXXXXX)</label>
                                                <input
                                                    type="text"
                                                    name="alternativePhoneNumber"
                                                    value={paymentData.alternativePhoneNumber}
                                                    onChange={handlePaymentInputChange}
                                                    className="payment-form-input-customer"
                                                    placeholder="2547XXXXXXXX"
                                                    maxLength="12"
                                                    disabled={!paymentData.useAlternativeNumber || paymentInitiated}
                                                />
                                                <div className="alternative-number-note-customer">
                                                    Use if primary number has insufficient funds
                                                </div>
                                            </div>
                                        </div>

                                        <div className="payment-form-group-customer">
                                            <label className="payment-form-label-customer">Amount (KES)</label>
                                            <input
                                                type="number"
                                                name="amount"
                                                value={paymentData.amount}
                                                onChange={handlePaymentInputChange}
                                                className="payment-form-input-customer"
                                                placeholder="Enter amount"
                                                min="1"
                                                step="1"
                                                disabled={paymentInitiated}
                                            />

                                            <div className="payment-amount-suggestions-customer">
                                                <button
                                                    type="button"
                                                    className="payment-amount-btn-customer"
                                                    onClick={() => handleQuickAmount(customer?.arrears || '', 'arrears')}
                                                    disabled={paymentInitiated}
                                                >
                                                    Arrears: {formatCurrency(customer?.arrears)}
                                                </button>

                                                <div className="full-balance-button-container">
                                                    <button
                                                        type="button"
                                                        className="payment-amount-btn-customer"
                                                        onClick={() => handleQuickAmount(customer?.loanBalance || '', 'fullBalance')}
                                                        style={{ width: '100%' }}
                                                        disabled={paymentInitiated}
                                                    >
                                                        Full Balance: {formatCurrency(customer?.loanBalance)}
                                                    </button>

                                                    {showFullBalancePopup && (
                                                        <div className="full-balance-popup-attached">
                                                            <div className="popup-content-attached">
                                                                <Typography className="popup-message-attached">
                                                                    Are you sure you want to clear the full balance?
                                                                </Typography>
                                                                <div className="popup-actions-attached">
                                                                    <button
                                                                        className="popup-cancel-btn-attached"
                                                                        onClick={() => setShowFullBalancePopup(false)}
                                                                    >
                                                                        No
                                                                    </button>
                                                                    <button
                                                                        className={`popup-confirm-btn-attached ${getRolePrimaryClass()}`}
                                                                        onClick={confirmFullBalanceFromPopup}
                                                                    >
                                                                        Yes
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="daily-limit-info-customer">
                                                <strong>Note:</strong> Daily MPESA limit is {formatCurrency(496500)}. Amounts exceeding this will be capped.
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="whatsapp-success-details-customer">
                                        <Typography className="whatsapp-success-title-customer">
                                            Payment Request Sent!
                                        </Typography>

                                        <div className="whatsapp-instructions-customer">
                                            <div className="instruction-step">
                                                <div className="step-content">
                                                    <strong>Prompt message sent to:</strong>
                                                    <div className="phone-highlight">{mpesaStatus?.phoneUsed}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="whatsapp-status-info-customer">
                                            <div className="status-item-customer">
                                                <span className="status-label-customer">Status:</span>
                                                <span className="status-value-customer pending">Waiting for PIN...</span>
                                            </div>
                                            <div className="status-item-customer">
                                                <span className="status-label-customer">Transaction ID:</span>
                                                <span className="status-value-customer">{mpesaStatus?.transactionId}</span>
                                            </div>
                                            <div className="status-item-customer">
                                                <span className="status-label-customer">Amount:</span>
                                                <span className="status-value-customer">{formatCurrency(paymentData.amount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="payment-modal-footer-customer">
                                {mpesaStatus && mpesaStatus.status === 'success' ? (
                                    <button
                                        className={`payment-modal-sent-btn-customer ${getRolePrimaryClass()}`}
                                        onClick={closePaymentModal}
                                    >
                                        Sent
                                    </button>
                                ) : processingPayment ? (
                                    <button
                                        className="payment-modal-processing-btn-customer"
                                        disabled={true}
                                    >
                                        <div className="processing-spinner"></div>
                                        Sending...
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            className="payment-modal-cancel-btn-customer"
                                            onClick={closePaymentModal}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className={`payment-modal-prompt-btn-customer ${getRolePrimaryClass()}`}
                                            onClick={handleSendPrompt}
                                            disabled={!paymentData.phoneNumber || !paymentData.amount}
                                        >
                                            Send Payment Request
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Promise Modal */}
                {showPromiseModal && (
                    <div className="payment-modal-overlay-customer">
                        <div className="payment-modal-customer" style={{ maxWidth: '500px' }}>
                            <div className="payment-modal-header-customer">
                                <Typography className={`payment-modal-title-customer ${getRoleTextColor()}`}>
                                    Create Payment Promise
                                </Typography>
                            </div>

                            <div className="payment-modal-body-customer">
                                <div className="payment-info-container-customer">
                                    <div className="payment-info-item-customer">
                                        <span className="payment-info-label-customer">Customer:</span>
                                        <span className="payment-info-value-customer">{customer?.name}</span>
                                    </div>
                                    <div className="payment-info-item-customer">
                                        <span className="payment-info-label-customer">Arrears:</span>
                                        <span className="payment-info-value-customer">{formatCurrency(customer?.arrears)}</span>
                                    </div>
                                </div>

                                <div className="payment-form-group-customer">
                                    <label className="payment-form-label-customer">Promise Amount (KES)</label>
                                    <input
                                        type="number"
                                        name="promiseAmount"
                                        value={promiseData.promiseAmount}
                                        onChange={(e) => setPromiseData({ ...promiseData, promiseAmount: e.target.value })}
                                        className="payment-form-input-customer"
                                        placeholder="Enter promise amount"
                                        min="1"
                                        max={customer?.arrears || 1000000}
                                        step="1"
                                    />
                                </div>

                                <div className="payment-form-group-customer">
                                    <label className="payment-form-label-customer">Promise Date</label>
                                    <input
                                        type="date"
                                        name="promiseDate"
                                        value={promiseData.promiseDate}
                                        onChange={(e) => setPromiseData({ ...promiseData, promiseDate: e.target.value })}
                                        className="payment-form-input-customer"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div className="payment-form-group-customer">
                                    <label className="payment-form-label-customer">Promise Type</label>
                                    <select
                                        name="promiseType"
                                        value={promiseData.promiseType}
                                        onChange={(e) => setPromiseData({ ...promiseData, promiseType: e.target.value })}
                                        className="payment-form-input-customer"
                                    >
                                        <option value="FULL_PAYMENT">Full Payment</option>
                                        <option value="PARTIAL_PAYMENT">Partial Payment</option>
                                        <option value="SETTLEMENT">Settlement</option>
                                        <option value="PAYMENT_PLAN">Payment Plan</option>
                                    </select>
                                </div>

                                <div className="payment-form-group-customer">
                                    <label className="payment-form-label-customer">Notes (Optional)</label>
                                    <textarea
                                        name="notes"
                                        value={promiseData.notes}
                                        onChange={(e) => setPromiseData({ ...promiseData, notes: e.target.value })}
                                        className="payment-form-input-customer"
                                        placeholder="Add notes about this promise..."
                                        rows="3"
                                        style={{ resize: 'vertical', minHeight: '60px' }}
                                    />
                                </div>
                            </div>

                            <div className="payment-modal-footer-customer">
                                <button
                                    className="payment-modal-cancel-btn-customer"
                                    onClick={() => {
                                        setShowPromiseModal(false);
                                        setPromiseData({
                                            promiseAmount: '',
                                            promiseDate: '',
                                            promiseType: 'FULL_PAYMENT',
                                            notes: ''
                                        });
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={`payment-modal-prompt-btn-customer ${getRolePrimaryClass()}`}
                                    onClick={createPromise}
                                    disabled={!promiseData.promiseAmount || !promiseData.promiseDate}
                                >
                                    Create Promise
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal */}
                {showConfirmationModal && (
                    <div className="payment-modal-overlay-customer">
                        <div className="confirmation-modal-customer">
                            <div className="confirmation-modal-header-customer">
                                <div className="confirmation-modal-icon-customer">
                                    <div className="mpesa-logo-text-customer">MPESA</div>
                                </div>
                                <Typography className="confirmation-modal-title-customer">
                                    Confirm Payment Request
                                </Typography>
                            </div>

                            <div className="confirmation-modal-body-customer">
                                <div className="confirmation-info-customer">
                                    <div className="confirmation-label-customer">
                                        {paymentData.useAlternativeNumber ? 'Alternative Phone Number:' : 'Phone Number:'}
                                    </div>
                                    <div className="confirmation-phone-customer">
                                        {paymentData.useAlternativeNumber ? paymentData.alternativePhoneNumber : paymentData.phoneNumber}
                                        {paymentData.useAlternativeNumber && (
                                            <div className="alternative-original-note-customer">
                                                (Alternative to: {paymentData.phoneNumber})
                                            </div>
                                        )}
                                    </div>
                                    <div className="confirmation-label-customer">
                                        Amount:
                                    </div>
                                    <div className="confirmation-amount-customer">
                                        {formatCurrency(paymentData.amount)}
                                        {parseFloat(paymentData.amount) > 496500 && (
                                            <div className="daily-limit-warning-customer">
                                                ⚠️ Daily limit applied: {formatCurrency(496500)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="confirmation-note-customer">
                                    <strong>Note:</strong> Customer will receive a payment prompt on their phone and must enter their PIN to complete the transaction.
                                    {parseFloat(paymentData.amount) > 496500 && (
                                        <div className="daily-limit-alert-customer">
                                            <strong>⚠️ Daily Limit:</strong> Only {formatCurrency(496500)} can be collected at once (MPESA daily limit).
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="confirmation-modal-footer-customer">
                                <button
                                    className="confirmation-modal-cancel-btn-customer"
                                    onClick={() => setShowConfirmationModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={`confirmation-modal-confirm-btn-customer ${getRolePrimaryClass()}`}
                                    onClick={handleConfirmPayment}
                                >
                                    Send Request
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transaction Details Modal */}
                <Modal
                    open={transactionModalOpen}
                    onClose={handleCloseTransactionModal}
                    aria-labelledby="transaction-details-modal"
                    aria-describedby="transaction-details-description"
                >
                    <Box className="transaction-modal-container">
                        {selectedTransaction && (
                            <div className="transaction-modal-content">
                                <div className="transaction-modal-header">
                                    <div className="transaction-modal-header-content">
                                        <ReceiptLong sx={{ fontSize: 20 }} />
                                        <div>
                                            <Typography className={`transaction-modal-title ${getRoleTextColor()}`}>
                                                Transaction Details
                                            </Typography>
                                            <Typography className="transaction-modal-subtitle">
                                                {selectedTransaction.transactionId || selectedTransaction._id}
                                            </Typography>
                                        </div>
                                    </div>
                                    <IconButton
                                        onClick={handleCloseTransactionModal}
                                        className="transaction-modal-close-btn"
                                        size="small"
                                    >
                                        <Close />
                                    </IconButton>
                                </div>

                                <div className="transaction-modal-body">
                                    <div className="transaction-details-grid-compact">
                                        <div className="transaction-column-compact">
                                            <div className="transaction-card-compact">
                                                <div className="transaction-card-header-compact">
                                                    <PersonIcon sx={{ fontSize: 14 }} />
                                                    <span>Customer Information</span>
                                                </div>
                                                <div className="transaction-card-content-compact">
                                                    <div className="transaction-detail-item-compact">
                                                        <span className="transaction-detail-label-compact">Name</span>
                                                        <span className="transaction-detail-value-compact">
                                                            {selectedTransaction.customerId?.name || selectedTransaction.customerName || customer?.name || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="transaction-detail-item-compact">
                                                        <span className="transaction-detail-label-compact">Phone</span>
                                                        <span className="transaction-detail-value-compact">
                                                            {selectedTransaction.phoneNumber || customer?.phoneNumber || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="transaction-card-compact">
                                                <div className="transaction-card-header-compact">
                                                    <Payment sx={{ fontSize: 14 }} />
                                                    <span>Transaction Information</span>
                                                </div>
                                                <div className="transaction-card-content-compact">
                                                    <div className="transaction-detail-item-compact">
                                                        <span className="transaction-detail-label-compact">Date & Time</span>
                                                        <span className="transaction-detail-value-compact">
                                                            {formatDateTime(selectedTransaction.createdAt).full}
                                                        </span>
                                                    </div>
                                                    <div className="transaction-detail-item-compact">
                                                        <span className="transaction-detail-label-compact">Payment Method</span>
                                                        <span className="transaction-detail-value-compact">
                                                            {selectedTransaction.paymentMethod || 'MPesa'}
                                                        </span>
                                                    </div>
                                                    <div className="transaction-detail-item-compact">
                                                        <span className="transaction-detail-label-compact">Amount</span>
                                                        <span className="transaction-detail-value-compact amount-highlight">
                                                            {formatCurrency(selectedTransaction.amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="transaction-column-compact">
                                            <div className="transaction-card-compact loan-card-compact">
                                                <div className="transaction-card-header-compact">
                                                    <AccountBalanceIcon sx={{ fontSize: 14 }} />
                                                    <span>Loan Balance Summary</span>
                                                </div>
                                                <div className="transaction-card-content-compact">
                                                    {(() => {
                                                        const loanDetails = calculateLoanDetails(selectedTransaction);
                                                        return (
                                                            <>
                                                                <div className="transaction-detail-item-compact highlighted-compact">
                                                                    <span className="transaction-detail-label-compact">
                                                                        Current Loan Balance
                                                                    </span>
                                                                    <span className="transaction-detail-value-compact balance-amount">
                                                                        {formatCurrency(loanDetails.totalLoanBalance)}
                                                                    </span>
                                                                </div>

                                                                {loanDetails.arrearsAmount > 0 && (
                                                                    <div className="transaction-detail-item-compact arrears-info-compact">
                                                                        <span className="transaction-detail-label-compact">
                                                                            Arrears Balance
                                                                        </span>
                                                                        <span className="transaction-detail-value-compact arrears-amount">
                                                                            {formatCurrency(loanDetails.arrearsAmount)}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                <div className="transaction-detail-item-compact success-compact">
                                                                    <span className="transaction-detail-label-compact">
                                                                        Total Repayments Made
                                                                    </span>
                                                                    <span className="transaction-detail-value-compact success-amount">
                                                                        {formatCurrency(loanDetails.totalRepayments)}
                                                                    </span>
                                                                </div>

                                                                {selectedTransaction.status?.toUpperCase() === 'SUCCESS' ? (
                                                                    <>
                                                                        <div className="transaction-detail-item-compact total-cleared-compact">
                                                                            <span className="transaction-detail-label-compact">
                                                                                Total Cleared Now
                                                                            </span>
                                                                            <span className="transaction-detail-value-compact total-success-amount">
                                                                                {formatCurrency(loanDetails.totalCleared)}
                                                                            </span>
                                                                        </div>

                                                                        <div className="transaction-detail-item-compact new-balance-compact">
                                                                            <span className="transaction-detail-label-compact">
                                                                                New Loan Balance
                                                                            </span>
                                                                            <span className={`transaction-detail-value-compact ${loanDetails.isPaidOff ? 'paid-off-amount' : 'new-balance-amount'}`}>
                                                                                {formatCurrency(loanDetails.newLoanBalance)}
                                                                                {loanDetails.isPaidOff && (
                                                                                    <span className="paid-off-badge-compact">
                                                                                        <DoneAll sx={{ fontSize: 10, marginLeft: '0.25rem' }} />
                                                                                        PAID OFF
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="transaction-detail-item-compact">
                                                                        <span className="transaction-detail-label-compact">
                                                                            Status Note
                                                                        </span>
                                                                        <span className="transaction-detail-value-compact pending-note-compact">
                                                                            Payment not processed. Loan balance remains unchanged.
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            <div className="transaction-card-compact status-card-compact">
                                                <div className="transaction-card-header-compact">
                                                    <ReceiptLong sx={{ fontSize: 14 }} />
                                                    <span>Transaction Status</span>
                                                </div>
                                                <div className="transaction-status-wrapper-compact">
                                                    {(() => {
                                                        const statusProps = getStatusProps(selectedTransaction.status);
                                                        return (
                                                            <div className={`transaction-status-display-compact ${statusProps.class}`}>
                                                                <div className="status-icon-compact">
                                                                    {statusProps.icon}
                                                                </div>
                                                                <div>
                                                                    <div className="transaction-status-text-compact">{statusProps.text}</div>
                                                                    <div className="transaction-status-message-compact">
                                                                        {selectedTransaction.status?.toUpperCase() === 'SUCCESS'
                                                                            ? 'Payment successfully processed and applied to loan balance'
                                                                            : selectedTransaction.status?.toUpperCase() === 'PENDING'
                                                                                ? 'Payment is being processed. Loan balance will update upon completion.'
                                                                                : 'Transaction not completed. No changes to loan balance.'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="transaction-modal-footer">
                                    <button
                                        className="transaction-modal-secondary-btn"
                                        onClick={handleCloseTransactionModal}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </Box>
                </Modal>

                {/* M-PESA STK Popup */}
                <MPesaStkPopup
                    open={showWhatsAppChat}
                    onClose={() => {
                        setShowWhatsAppChat(false);
                        setActiveTransaction(null);
                    }}
                    customer={customer}
                    transaction={activeTransaction}
                    onPinSubmit={handleWhatsAppPinSubmit}
                    onResendPrompt={handleResendPrompt}
                    autoCloseTime={30000}
                />
            </Box>
        </LayoutWrapper>
    );
};

export default CustomerDetails;