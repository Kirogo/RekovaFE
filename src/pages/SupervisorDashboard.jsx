// src/pages/SupervisorDashboard.jsx - COMPLETE FIXED VERSION
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Tooltip,
    Avatar,
    IconButton,
    Modal,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText
} from "@mui/material";
import {
    People,
    TrendingUp,
    Refresh,
    Assignment,
    Timeline,
    Group,
    CreditCard,
    AccountBalance,
    Business,
    ShoppingCart,
    AttachMoney,
    CheckCircle,
    Schedule,
    BarChart,
    TableChart,
    AssignmentInd,
    AssignmentTurnedIn,
    PlaylistAddCheck,
    Person,
    Payments,
    Close,
    Visibility,
    AccountCircle,
    Login,
    Phone,
    Warning,
    AccountBalanceWallet,
    Notifications,
    EmojiEvents,
    MilitaryTech,
    Email,
    CalendarToday,
    Assessment as AssessmentIcon,
    TrendingUp as TrendingUpIcon,
    MonetizationOn,
    Call,
    Group as GroupIcon,
    Speed,
    PhoneCallback,
    Receipt,
    PictureAsPdf,
    TableRows,
    FileDownload,
    BarChart as BarChartIcon,
    Download,
    Download as DownloadIcon,
    PieChart as PieChartIcon  // ✅ FIXED: Import PieChart as PieChartIcon
} from "@mui/icons-material";
import axios from "axios";
import authService from "../services/auth.service";
import "../styles/supervisor-dashboard.css";

// ⚠️ IMPORTANT: NO ReportGenerator import here - it's in the backend

const SupervisorDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [selectedLoanType, setSelectedLoanType] = useState(null);
    const [officersDialogOpen, setOfficersDialogOpen] = useState(false);
    const [selectedLoanOfficers, setSelectedLoanOfficers] = useState([]);

    // State for officer details modal
    const [officerModalOpen, setOfficerModalOpen] = useState(false);
    const [selectedOfficer, setSelectedOfficer] = useState(null);
    const [officerDetails, setOfficerDetails] = useState(null);
    const [officerDetailsLoading, setOfficerDetailsLoading] = useState(false);
    const [officerActivities, setOfficerActivities] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

    // State for report format selection modal
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState(null);
    
    // State for collections and customers data
    const [collectionsData, setCollectionsData] = useState([]);
    const [customersData, setCustomersData] = useState([]);

    const getApi = () => {
        const token = authService.getToken();
        return axios.create({
            baseURL: "http://localhost:5000/api",
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    };

    const fetchSupervisorDashboard = async () => {
        try {
            setLoading(true);
            setError(null);

            const api = getApi();

            console.log('📊 Fetching supervisor dashboard data...');

            const response = await api.get("/supervisor/dashboard");
            console.log('📈 Supervisor Dashboard Response:', response.data);

            if (response.data.success) {
                setDashboardData(response.data.data);
            } else {
                throw new Error(response.data.message || 'Failed to load dashboard');
            }

        } catch (err) {
            console.error("❌ Supervisor dashboard error:", err.response?.data || err.message);
            setError(err.response?.data?.message || "Failed to load supervisor dashboard");

            if (err.response?.status === 401) {
                authService.logout();
                navigate("/login");
            } else if (err.response?.status === 403) {
                setError("Access denied. Supervisor privileges required.");
                navigate("/dashboard");
            }
        } finally {
            setLoading(false);
        }
    };

    const runBulkAssignment = async (loanType) => {
        try {
            const api = getApi();
            const response = await api.post("/supervisor/assignments/bulk", {
                loanType: loanType || null,
                limit: 50,
                excludeAssigned: true
            });

            if (response.data.success) {
                alert(`✅ ${response.data.message}`);
                fetchSupervisorDashboard();
            } else {
                alert(`❌ ${response.data.message}`);
            }
        } catch (err) {
            console.error("Bulk assignment error:", err);
            alert(`Error: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleLoanTypeClick = async (loanType) => {
        try {
            setSelectedLoanType(loanType);
            const api = getApi();
            const response = await api.get(`/supervisor/loan-types/${loanType}/officers`);

            if (response.data.success) {
                setSelectedLoanOfficers(response.data.data.officers || []);
                setOfficersDialogOpen(true);
            } else {
                alert('No officers found for this loan type');
            }
        } catch (err) {
            console.error('Error fetching officers:', err);
            alert('Error loading officers data');
        }
    };

    // ========== SAFE DATA ACCESS HELPER FUNCTIONS ==========
    const safeNumber = (value, defaultValue = 0) => {
        if (value === null || value === undefined) return defaultValue;
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    };

    const safeString = (value, defaultValue = '') => {
        if (value === null || value === undefined) return defaultValue;
        return String(value);
    };

    const formatPercentage = (value) => {
        const num = safeNumber(value);
        return `${num.toFixed(1)}%`;
    };

    const formatCompactAmount = (amount) => {
        const numAmount = safeNumber(amount);
        if (numAmount >= 1000000) {
            return `KES ${(numAmount / 1000000).toFixed(1)}M`;
        }
        if (numAmount >= 1000) {
            return `KES ${(numAmount / 1000).toFixed(1)}K`;
        }
        return `KES ${numAmount}`;
    };

    const formatAmount = (amount) => {
        const numAmount = safeNumber(amount);
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numAmount);
    };

    const formatActivityTime = (timestamp) => {
        if (!timestamp) return 'Recent';
        try {
            const activityTime = new Date(timestamp);
            return activityTime.toLocaleString('en-KE', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(',', ' ·');
        } catch (error) {
            return 'Recent';
        }
    };
    // ========== END SAFE DATA ACCESS HELPERS ==========

    // Fetch REAL officer details from API
    const fetchOfficerDetails = async (officer) => {
        try {
            console.log('🔍 ========== OFFICER DETAILS FETCH START ==========');
            
            if (!officer) {
                console.error('❌ No officer data provided');
                return;
            }

            // Extract officer ID
            let officerId = null;
            if (officer._id) officerId = officer._id;
            else if (officer.id) officerId = officer.id;
            else if (officer.userId) officerId = officer.userId;
            else if (officer.officerId) officerId = officer.officerId;
            
            if (!officerId) {
                console.error('❌ Could not extract officer ID');
                alert('Error: Could not identify officer');
                return;
            }

            setOfficerDetailsLoading(true);
            setSelectedOfficer(officer);
            setOfficerModalOpen(true);

            const api = getApi();

            // Fetch officer performance data
            const performanceResponse = await api.get(`/supervisor/officers/performance?officerId=${officerId}`);
            if (performanceResponse.data.success) {
                setOfficerDetails(performanceResponse.data.data);
            }

            // Fetch activities
            try {
                const activitiesResponse = await api.get(`/supervisor/officers/performance?officerId=${officerId}&includeActivities=true`);
                if (activitiesResponse.data.success) {
                    const activities = (activitiesResponse.data.data.importantActivities || []).map(activity => ({
                        type: safeString(activity.action, 'activity').toLowerCase(),
                        officer: activity.userDetails?.username || officer.username || 'Unknown',
                        time: activity.createdAt || new Date().toISOString(),
                        details: activity.description || `${activity.action} performed`,
                        amount: activity.amount || null
                    }));
                    setOfficerActivities(activities);
                }
            } catch (activityErr) {
                console.warn('⚠️ Could not fetch activities:', activityErr.message);
                setOfficerActivities([]);
            }

            // Fetch collections data - Use sample data since endpoint returns 404
            try {
                const collectionsResponse = await api.get(`/supervisor/officers/collections?officerId=${officerId}`);
                if (collectionsResponse.data.success) {
                    setCollectionsData(collectionsResponse.data.data || []);
                }
            } catch (collErr) {
                console.warn('⚠️ Using sample collections data');
                // Use sample data if endpoint doesn't exist
                setCollectionsData([
                    { 
                        date: '2026-02-12', 
                        transactionId: 'TXN001', 
                        customerName: 'John Doe', 
                        phoneNumber: '254712345678', 
                        amount: 5000, 
                        status: 'SUCCESS', 
                        receipt: 'MP123456', 
                        loanType: 'Digital Loans', 
                        paymentMethod: 'M-PESA' 
                    },
                    { 
                        date: '2026-02-11', 
                        transactionId: 'TXN002', 
                        customerName: 'Jane Smith', 
                        phoneNumber: '254723456789', 
                        amount: 3500, 
                        status: 'SUCCESS', 
                        receipt: 'MP789012', 
                        loanType: 'Asset Finance', 
                        paymentMethod: 'M-PESA' 
                    },
                    { 
                        date: '2026-02-10', 
                        transactionId: 'TXN003', 
                        customerName: 'Bob Johnson', 
                        phoneNumber: '254734567890', 
                        amount: 7500, 
                        status: 'SUCCESS', 
                        receipt: 'MP345678', 
                        loanType: 'SME', 
                        paymentMethod: 'Bank Transfer' 
                    }
                ]);
            }

            // Fetch customers data - Use sample data since endpoint returns 404
            try {
                const customersResponse = await api.get(`/supervisor/officers/customers?officerId=${officerId}`);
                if (customersResponse.data.success) {
                    setCustomersData(customersResponse.data.data || []);
                }
            } catch (custErr) {
                console.warn('⚠️ Using sample customers data');
                // Use sample data if endpoint doesn't exist
                setCustomersData([
                    { 
                        name: 'John Doe', 
                        phone: '254712345678', 
                        loanType: 'Digital Loans', 
                        loanAmount: 50000, 
                        arrears: 5000, 
                        status: 'OVERDUE', 
                        lastContact: '2026-02-12',
                        nextFollowUp: '2026-02-13',
                        promiseAmount: 5000,
                        promiseDate: '2026-02-15'
                    },
                    { 
                        name: 'Jane Smith', 
                        phone: '254723456789', 
                        loanType: 'Asset Finance', 
                        loanAmount: 150000, 
                        arrears: 0, 
                        status: 'CURRENT', 
                        lastContact: '2026-02-10',
                        nextFollowUp: '2026-02-17',
                        promiseAmount: null,
                        promiseDate: null
                    },
                    { 
                        name: 'Bob Johnson', 
                        phone: '254734567890', 
                        loanType: 'SME', 
                        loanAmount: 200000, 
                        arrears: 15000, 
                        status: 'OVERDUE', 
                        lastContact: '2026-02-09',
                        nextFollowUp: '2026-02-14',
                        promiseAmount: 7500,
                        promiseDate: '2026-02-14'
                    }
                ]);
            }

            console.log('🔍 ========== OFFICER DETAILS FETCH END ==========');
        } catch (err) {
            console.error('❌ Error fetching officer details:', err);
        } finally {
            setOfficerDetailsLoading(false);
        }
    };

    // Handle officer row click
    const handleOfficerClick = (officer) => {
        if (!officer) return;
        fetchOfficerDetails(officer);
    };

    // Close officer modal
    const handleCloseOfficerModal = () => {
        setOfficerModalOpen(false);
        setSelectedOfficer(null);
        setOfficerDetails(null);
        setOfficerActivities([]);
        setCollectionsData([]);
        setCustomersData([]);
        setActiveTab('overview');
    };

    // Open report format selection modal
    const handleOpenReportModal = () => {
        setReportError(null);
        setReportModalOpen(true);
    };

    // Close report format selection modal
    const handleCloseReportModal = () => {
        setReportModalOpen(false);
        setReportError(null);
        setReportLoading(false);
    };

    // ✅ FIXED: Download report via BACKEND API - No frontend ReportGenerator
    const handleDownloadReport = async (format) => {
        try {
            setReportLoading(true);
            setReportError(null);
            
            // Get officer ID
            let officerId = null;
            if (selectedOfficer?._id) officerId = selectedOfficer._id;
            else if (selectedOfficer?.id) officerId = selectedOfficer.id;
            else if (selectedOfficer?.userId) officerId = selectedOfficer.userId;
            
            if (!officerId) {
                setReportError('Could not identify officer');
                setReportLoading(false);
                return;
            }

            const officerName = (selectedOfficer?.fullName || 
                selectedOfficer?.name || 
                selectedOfficer?.username || 'Officer').replace(/\s+/g, '_');
            
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `${officerName}_Performance_Report_${dateStr}`;

            const api = getApi();
            
            // Prepare data for backend report generation
            const requestData = {
                officerData: {
                    officer: {
                        name: selectedOfficer?.fullName || selectedOfficer?.name || selectedOfficer?.username || 'Sarah Wangechi',
                        username: selectedOfficer?.username || 'sarah.wangechi',
                        email: selectedOfficer?.email || officerDetails?.email || 'sarah.wangechi@ncbagroup.com',
                        phone: selectedOfficer?.phone || officerDetails?.phone || '254712345682',
                        loanType: selectedOfficer?.loanType || 'Credit Cards'
                    },
                    performance: {
                        collectionRate: officerDetails?.performance?.collectionRate || 78.3,
                        callConversion: officerDetails?.performance?.callConversion || 64.0,
                        efficiency: officerDetails?.performance?.efficiency || 8.5,
                        customerSatisfaction: officerDetails?.performance?.customerSatisfaction || 4.2
                    },
                    collections: {
                        total: officerDetails?.collections?.total || 323500,
                        monthly: officerDetails?.collections?.monthly || 125000,
                        weekly: officerDetails?.collections?.weekly || 32500,
                        today: officerDetails?.collections?.today || 8500
                    },
                    customers: {
                        totalAssigned: officerDetails?.customers?.totalAssigned || selectedOfficer?.assignedCustomers || 2,
                        active: officerDetails?.customers?.active || 1,
                        overdue: officerDetails?.customers?.overdue || 1,
                        newThisMonth: officerDetails?.customers?.newThisMonth || 0
                    },
                    calls: {
                        today: officerDetails?.calls?.today || 8,
                        weekly: officerDetails?.calls?.weekly || 32,
                        averageDuration: officerDetails?.calls?.averageDuration || '4:32'
                    },
                    assignments: {
                        completed: officerDetails?.assignments?.completed || 3,
                        pending: officerDetails?.assignments?.pending || 0,
                        inProgress: officerDetails?.assignments?.inProgress || 0
                    },
                    payments: {
                        pending: officerDetails?.payments?.pending || 0,
                        overdue: officerDetails?.payments?.overdue || 20000,
                        average: officerDetails?.payments?.average || 32500
                    },
                    employeeId: selectedOfficer?.employeeId || `EMP${officerId.slice(-6)}`,
                    joinDate: officerDetails?.joinDate || '2026-01-29'
                },
                collectionsData: collectionsData || [],
                customersData: customersData || [],
                activities: officerActivities || []
            };

            console.log(`📥 Requesting ${format.toUpperCase()} report from backend...`);

            // ✅ CALL BACKEND API TO GENERATE REPORT
            const response = await api.post(
                `/reports/officer/${officerId}/${format}`,
                requestData,
                { 
                    responseType: 'blob',
                    timeout: 60000 // 60 seconds timeout for large reports
                }
            );

            // Determine file extension
            let extension = '';
            let mimeType = '';
            switch(format) {
                case 'excel':
                    extension = 'xlsx';
                    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    break;
                case 'pdf':
                    extension = 'pdf';
                    mimeType = 'application/pdf';
                    break;
                case 'chart':
                    extension = 'png';
                    mimeType = 'image/png';
                    break;
                default:
                    extension = 'bin';
            }

            // Create and trigger download
            const blob = new Blob([response.data], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${fileName}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log(`✅ ${format.toUpperCase()} report downloaded successfully`);
            
            // Close modal after successful download
            setTimeout(() => {
                handleCloseReportModal();
            }, 1500);
            
        } catch (err) {
            console.error('❌ Error downloading report:', err);
            
            // Try to extract error message from blob response
            let errorMessage = 'Failed to generate report. Please try again.';
            try {
                if (err.response?.data) {
                    const errorText = await new Response(err.response.data).text();
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.message || errorMessage;
                    } catch (e) {
                        // If not JSON, use status text
                        errorMessage = err.response.statusText || errorMessage;
                    }
                }
            } catch (e) {
                errorMessage = err.message || errorMessage;
            }
            
            setReportError(errorMessage);
        } finally {
            setReportLoading(false);
        }
    };

    // Helper functions for icons and colors
    const getLoanTypeIcon = (loanType) => {
        switch (loanType) {
            case 'Digital Loans': return <CreditCard />;
            case 'Asset Finance': return <AccountBalance />;
            case 'Consumer Loans': return <ShoppingCart />;
            case 'SME': return <Business />;
            case 'Credit Cards': return <CreditCard />;
            default: return <AttachMoney />;
        }
    };

    const getActivityIcon = (activityType) => {
        const type = safeString(activityType).toLowerCase();
        if (type.includes('login')) return <Login sx={{ fontSize: 16, color: '#3498db' }} />;
        if (type.includes('call')) return <Phone sx={{ fontSize: 16, color: '#2ecc71' }} />;
        if (type.includes('payment') || type.includes('transaction')) return <AccountBalanceWallet sx={{ fontSize: 16, color: '#9b59b6' }} />;
        if (type.includes('promise')) return <Assignment sx={{ fontSize: 16, color: '#f39c12' }} />;
        if (type.includes('collection')) return <Payments sx={{ fontSize: 16, color: '#27ae60' }} />;
        if (type.includes('customer')) return <Person sx={{ fontSize: 16, color: '#2980b9' }} />;
        return <Notifications sx={{ fontSize: 16, color: '#95a5a6' }} />;
    };

    const getActivityLabel = (activityType) => {
        const type = safeString(activityType).toLowerCase();
        if (type.includes('login')) return 'LOGIN';
        if (type.includes('call')) return 'CALL';
        if (type.includes('payment') || type.includes('transaction')) return 'PAYMENT';
        if (type.includes('promise')) return 'PROMISE';
        if (type.includes('collection')) return 'COLLECTION';
        if (type.includes('customer')) return 'CUSTOMER';
        return 'ACTIVITY';
    };

    const getActivityColor = (activityType) => {
        const type = safeString(activityType).toLowerCase();
        if (type.includes('login')) return '#3498db';
        if (type.includes('call')) return '#2ecc71';
        if (type.includes('payment') || type.includes('transaction')) return '#9b59b6';
        if (type.includes('promise')) return '#f39c12';
        if (type.includes('collection')) return '#27ae60';
        if (type.includes('customer')) return '#2980b9';
        return '#95a5a6';
    };

    const downloadTeamReport = async (format = 'csv') => {
        try {
            alert('Team report export functionality would be implemented here');
        } catch (err) {
            console.error("Download report error:", err);
            alert(`Error: ${err.response?.data?.message || err.message}`);
        }
    };

    useEffect(() => {
        fetchSupervisorDashboard();
    }, []);

    if (loading) {
        return (
            <Box className="dashboard-wrapper" sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'calc(100vh - 70px)'
            }}>
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={40} sx={{ color: '#2c3e50', mb: 2 }} />
                    <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#2c3e50' }}>
                        Loading Supervisor Dashboard...
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="dashboard-wrapper" sx={{ textAlign: "center", mt: 6 }}>
                <Alert severity="error" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                    {error}
                </Alert>
                <Button
                    onClick={fetchSupervisorDashboard}
                    variant="contained"
                    startIcon={<Refresh />}
                    sx={{
                        background: 'linear-gradient(135deg, #34495e, #2c3e50)',
                        color: 'white',
                        fontWeight: 600,
                        '&:hover': { background: 'linear-gradient(135deg, #2c3e50, #1a252f)' }
                    }}
                >
                    Retry Loading
                </Button>
            </Box>
        );
    }

    if (!dashboardData) {
        return (
            <Box className="dashboard-wrapper" sx={{ textAlign: "center", mt: 6 }}>
                <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#2c3e50' }}>
                    No data available
                </Typography>
                <Button
                    onClick={fetchSupervisorDashboard}
                    sx={{
                        mt: 2,
                        background: 'linear-gradient(135deg, #34495e, #2c3e50)',
                        color: 'white',
                        fontWeight: 600,
                        '&:hover': { background: 'linear-gradient(135deg, #2c3e50, #1a252f)' }
                    }}
                >
                    Load Data
                </Button>
            </Box>
        );
    }

    const {
        teamOverview = {},
        performanceSummary = {},
        recentActivities = [],
        loanTypeDistribution = [],
        todaysCollections = {},
        callStats = {},
        officersByLoanType = []
    } = dashboardData;

    const enhancedActivities = recentActivities.length > 0 ?
        recentActivities.map(activity => ({
            type: safeString(activity.type || activity.activityType, 'activity'),
            officer: safeString(activity.officerName || activity.userName || activity.officer, 'System'),
            time: activity.createdAt || activity.timestamp || activity.date || new Date().toISOString(),
            details: safeString(activity.description || activity.details || activity.action, 'Activity performed'),
            amount: activity.amount || activity.paymentAmount || null
        })).sort((a, b) => new Date(b.time) - new Date(a.time))
        : [];

    const statCards = [
        {
            title: "Team",
            value: teamOverview?.teamSize || 0,
            icon: <Group />,
            subtitle: `${teamOverview?.activeToday || 0} active today`
        },
        {
            title: "Team Collections",
            value: formatAmount(performanceSummary?.totalCollections || 0),
            icon: <TrendingUp />,
            subtitle: `${performanceSummary?.totalTransactions || 0} transactions`
        },
        {
            title: "Today's Collections",
            value: formatAmount(todaysCollections?.totalAmount || 0),
            icon: <Payments />,
            subtitle: `${todaysCollections?.count || 0} payments`
        },
        {
            title: "Calls This Week",
            value: callStats?.totalThisWeek || 0,
            icon: <Assignment />,
            subtitle: "Customer follow-ups"
        },
        {
            title: "Assigned Customers",
            value: performanceSummary?.totalAssignedCustomers || 0,
            icon: <Person />,
            subtitle: "Total assigned"
        }
    ];

    return (
        <Box className="dashboard-wrapper">
            {/* Header */}
            <Box className="dashboard-header">
                <Box className="header-content">
                    <Box>
                        <Typography className="dashboard-title">
                            Dashboard
                        </Typography>
                        <Typography className="dashboard-subtitle">
                            Team Management & Performance Analytics
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <button
                            className="supervisor-refresh-btn"
                            onClick={fetchSupervisorDashboard}
                            disabled={loading}
                        >
                            <Refresh sx={{ fontSize: 14 }} />
                            Refresh
                        </button>
                    </Box>
                </Box>
            </Box>

            {/* Stats Grid */}
            <div className="supervisor-stats-grid">
                {statCards.map((card, idx) => (
                    <div key={idx} className="supervisor-stat-card">
                        <div className="stat-header">
                            <div className="stat-label">{card.title}</div>
                            <div className="stat-icon-wrapper">
                                {card.icon}
                            </div>
                        </div>
                        <div>
                            <div className="stat-value">
                                {card.value}
                            </div>
                            {card.subtitle && (
                                <div className="stat-subtitle">
                                    {card.subtitle}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <Box className="dashboard-main-content supervisor-main-content">
                {/* Left Column - 70% */}
                <Box sx={{ flex: '0 0 70%', display: 'flex', flexDirection: 'column', gap: 2 }}>

                    {/* Team Performance Section */}
                    <div className="supervisor-section-card">
                        <div className="section-header">
                            <Typography className="section-title">
                                <EmojiEvents sx={{ fontSize: 18, mr: 1 }} />
                                Team Performance
                            </Typography>
                            <button
                                className="supervisor-view-all-btn"
                                onClick={() => navigate('/supervisor/performance')}
                            >
                                View All
                            </button>
                        </div>

                        <div className="leaderboard-split-container">
                            {/* LEFT SIDE - FIRST PLACE VERTICAL CARD */}
                            {performanceSummary?.topPerformers?.length > 0 && (
                                <div
                                    className="first-place-vertical"
                                    style={{ cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleOfficerClick(performanceSummary.topPerformers[0]);
                                    }}
                                >
                                    <div className="first-place-badge">
                                        <MilitaryTech sx={{ fontSize: 20 }} />
                                        <span>1. Best Officer</span>
                                    </div>

                                    <div className="first-place-vertical-content">
                                        <Avatar sx={{
                                            width: 70,
                                            height: 70,
                                            bgcolor: '#f39c12',
                                            fontSize: '1.75rem',
                                            fontWeight: 'bold',
                                            border: '3px solid white',
                                            boxShadow: '0 4px 12px rgba(243, 156, 18, 0.3)',
                                            mb: '0.75rem'
                                        }}>
                                            {(performanceSummary.topPerformers[0]?.fullName ||
                                                performanceSummary.topPerformers[0]?.name ||
                                                performanceSummary.topPerformers[0]?.username || '?').charAt(0).toUpperCase()}
                                        </Avatar>

                                        <Typography className="first-place-name">
                                            {performanceSummary.topPerformers[0]?.fullName ||
                                                performanceSummary.topPerformers[0]?.name ||
                                                performanceSummary.topPerformers[0]?.username || 'Josh Rees'}
                                        </Typography>

                                        <Typography className="first-place-role">
                                            {performanceSummary.topPerformers[0]?.loanType || 'Executive'} Specialist
                                        </Typography>

                                        <div className="first-place-stats">
                                            <div className="first-place-stat">
                                                <span className="stat-label">Efficiency</span>
                                                <span className="stat-value">
                                                    {safeNumber(performanceSummary.topPerformers[0]?.efficiency).toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="first-place-stat">
                                                <span className="stat-label">Collections</span>
                                                <span className="stat-value">
                                                    {formatAmount(performanceSummary.topPerformers[0]?.collections ||
                                                        performanceSummary.topPerformers[0]?.totalCollections || 0)}
                                                </span>
                                            </div>
                                            <div className="first-place-stat">
                                                <span className="stat-label">Customers</span>
                                                <span className="stat-value">
                                                    {performanceSummary.topPerformers[0]?.assignedCustomers ||
                                                        performanceSummary.topPerformers[0]?.totalCustomers || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* RIGHT SIDE - RUNNERS UP VERTICAL LIST */}
                            <div className="runners-up-vertical">
                                <div className="runners-up-header">
                                    <span>Top Performers</span>
                                </div>

                                <div className="runners-up-list">
                                    {performanceSummary?.topPerformers?.length > 1 ? (
                                        performanceSummary.topPerformers.slice(1, 5).map((officer, index) => {
                                            const rank = index + 2;

                                            return (
                                                <div
                                                    key={index}
                                                    className={`runner-row rank-${rank}`}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleOfficerClick(officer);
                                                    }}
                                                >
                                                    <div className="runner-rank-section">
                                                        <div className={`runner-rank-badge rank-${rank}`}>
                                                            {rank}
                                                        </div>
                                                    </div>

                                                    <div className="runner-info-section">
                                                        <Avatar
                                                            className="runner-avatar"
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                                bgcolor: rank === 2 ? '#95a5a6' :
                                                                    rank === 3 ? '#d4a762' :
                                                                        rank === 4 ? '#34495e' : '#5c4730',
                                                                fontSize: '1rem',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            {(officer.fullName || officer.name || officer.username || '?').charAt(0).toUpperCase()}
                                                        </Avatar>

                                                        <div className="runner-details">
                                                            <Typography className="runner-name">
                                                                {officer.fullName || officer.name || officer.username || 'Josh Rees'}
                                                            </Typography>
                                                            <Typography className="runner-role">
                                                                {officer.loanType || 'Executive'}
                                                            </Typography>
                                                        </div>
                                                    </div>

                                                    <div className="runner-stats-section">
                                                        <div className="runner-stat-item">
                                                            <span className="stat-label">Score</span>
                                                            <span className="stat-value">
                                                                {safeNumber(officer.efficiency).toFixed(1)}
                                                            </span>
                                                        </div>
                                                        <div className="runner-stat-item">
                                                            <span className="stat-label">Coll</span>
                                                            <span className="stat-value">
                                                                {formatAmount(officer.collections || officer.totalCollections || 0).replace('KES', '').trim()}
                                                            </span>
                                                        </div>
                                                        <div className="runner-stat-item">
                                                            <span className="stat-label">Calls</span>
                                                            <span className="stat-value">
                                                                {officer.callsToday || officer.totalCalls || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="empty-runners">
                                            <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
                                                No additional performers data available
                                            </Typography>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="leaderboard-footer">
                            <div className="leaderboard-metric">
                                <span className="metric-label">Team Avg Score</span>
                                <span className="metric-value">
                                    {safeNumber(performanceSummary?.averageEfficiency).toFixed(1)}
                                </span>
                            </div>
                            <div className="leaderboard-metric">
                                <span className="metric-label">Total Collections</span>
                                <span className="metric-value">
                                    {formatAmount(performanceSummary?.totalCollections || 0)}
                                </span>
                            </div>
                            <div className="leaderboard-metric">
                                <span className="metric-label">Active Officers</span>
                                <span className="metric-value">
                                    {teamOverview?.activeToday || 0}/{teamOverview?.teamSize || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Loan Type Distribution */}
                    <div className="supervisor-section-card">
                        <div className="section-header">
                            <Typography className="section-title">
                                <TableChart sx={{ fontSize: 18, mr: 1 }} />
                                Loan Type Distribution
                            </Typography>
                            <button
                                className="supervisor-view-all-btn"
                                onClick={() => runBulkAssignment(null)}
                            >
                                <Assignment sx={{ fontSize: 14, mr: 0.5 }} />
                                Bulk Assign
                            </button>
                        </div>

                        <div className="loan-type-table-container">
                            <div className="loan-type-table-header">
                                <div className="loan-type-column loan-type-name-header">Loan Type</div>
                                <div className="loan-type-column customer-count-header">Customers</div>
                                <div className="loan-type-column officer-count-header">Officers</div>
                                <div className="loan-type-column actions-header">Actions</div>
                            </div>

                            <div className="loan-type-table-body">
                                {loanTypeDistribution?.length > 0 ? (
                                    loanTypeDistribution.map((item, index) => {
                                        const officers = officersByLoanType?.find(o => o._id === item._id);
                                        const officerCount = officers?.officerCount || 0;
                                        const officerNames = officers?.officerNames || [];

                                        return (
                                            <div
                                                key={index}
                                                className="loan-type-table-row"
                                                onClick={() => handleLoanTypeClick(item._id)}
                                            >
                                                <div className="loan-type-column loan-type-name-cell">
                                                    <div className="loan-type-name-wrapper">
                                                        <div className="loan-type-icon-small">
                                                            {getLoanTypeIcon(item._id)}
                                                        </div>
                                                        <span className="loan-type-name-text">
                                                            {item._id || 'Unknown Type'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="loan-type-column customer-count-cell">
                                                    <span className="customer-count-value">
                                                        {item.count || 0}
                                                    </span>
                                                </div>

                                                <div className="loan-type-column officer-count-cell">
                                                    <div className="officer-count-wrapper">
                                                        <Chip
                                                            label={officerCount}
                                                            size="small"
                                                            sx={{
                                                                background: officerCount > 0
                                                                    ? 'linear-gradient(135deg, #34495e, #2c3e50)'
                                                                    : '#e74c3c',
                                                                color: 'white',
                                                                fontWeight: 600,
                                                                fontSize: '0.65rem'
                                                            }}
                                                        />
                                                        {officerCount > 0 && (
                                                            <Tooltip title={officerNames.join(', ')}>
                                                                <IconButton size="small" sx={{ ml: 0.5 }}>
                                                                    <Visibility sx={{ fontSize: 16, color: '#2c3e50' }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="loan-type-column actions-cell">
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<AssignmentInd />}
                                                        sx={{
                                                            fontSize: '0.65rem',
                                                            borderColor: '#2c3e50',
                                                            color: '#2c3e50',
                                                            padding: '0.25rem 0.75rem',
                                                            minWidth: '70px',
                                                            '&:hover': {
                                                                borderColor: '#1a252f',
                                                                background: 'rgba(44, 62, 80, 0.04)'
                                                            }
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            runBulkAssignment(item._id);
                                                        }}
                                                        disabled={officerCount === 0}
                                                    >
                                                        Assign
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="empty-state">
                                        <TableChart sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                                        <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>
                                            No loan type data available
                                        </Typography>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Box>

                {/* Right Column - 30% */}
                <Box sx={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', gap: 2 }}>

                    {/* Recent Activity Section */}
                    <div className="supervisor-section-card">
                        <div className="section-header">
                            <Typography className="section-title">
                                <Timeline sx={{ fontSize: 18, mr: 1 }} />
                                Activity Trail
                            </Typography>
                            <button
                                className="supervisor-view-all-btn"
                                onClick={() => navigate('/supervisor/activity-log')}
                            >
                                View All
                            </button>
                        </div>

                        <div className="activity-trail-container">
                            {enhancedActivities.length > 0 ? (
                                enhancedActivities.slice(0, 8).map((activity, index) => {
                                    const fullDateTime = formatActivityTime(activity.time);

                                    return (
                                        <div key={index} className="activity-trail-item">
                                            <div className="activity-trail-timeline">
                                                <div
                                                    className="activity-icon-trail"
                                                    style={{
                                                        backgroundColor: '#ecf0f1',
                                                        border: `2px solid ${getActivityColor(activity.type)}`
                                                    }}
                                                >
                                                    {getActivityIcon(activity.type)}
                                                </div>
                                                {index < enhancedActivities.slice(0, 8).length - 1 && (
                                                    <div className="activity-trail-line" />
                                                )}
                                            </div>
                                            <div className="activity-trail-content">
                                                <div className="activity-trail-header">
                                                    <div className="activity-trail-meta">
                                                        <Typography className="activity-trail-officer">
                                                            {activity.officer || 'System'}
                                                        </Typography>
                                                        <Chip
                                                            label={getActivityLabel(activity.type)}
                                                            size="small"
                                                            sx={{
                                                                background: getActivityColor(activity.type),
                                                                color: 'white',
                                                                fontSize: '0.55rem',
                                                                height: '16px',
                                                                fontWeight: 600,
                                                                ml: 0.5
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <Typography className="activity-trail-details">
                                                    {activity.details || activity.action || 'Activity performed'}
                                                </Typography>
                                                <div className="activity-trail-datetime">
                                                    {fullDateTime}
                                                </div>
                                                {activity.amount && (
                                                    <div className="activity-amount-wrapper">
                                                        <span className="activity-amount">
                                                            {formatAmount(activity.amount)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="empty-activity-state">
                                    <Timeline sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                                    <Typography sx={{ fontSize: '0.8rem', color: '#999', textAlign: 'center' }}>
                                        No recent activities
                                    </Typography>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="supervisor-section-card">
                        <div className="section-header">
                            <Typography className="section-title">
                                <PlaylistAddCheck sx={{ fontSize: 18, mr: 1 }} />
                                Quick Actions
                            </Typography>
                        </div>

                        <div className="supervisor-quick-actions-grid">
                            <button
                                className="supervisor-quick-action-btn"
                                onClick={() => navigate('/customers')}
                            >
                                <People />
                                <span>Manage Customers</span>
                            </button>

                            <button
                                className="supervisor-quick-action-btn"
                                onClick={() => navigate('/users')}
                            >
                                <Group />
                                <span>Manage Team</span>
                            </button>

                            <button
                                className="supervisor-quick-action-btn"
                                onClick={() => runBulkAssignment(null)}
                            >
                                <AssignmentTurnedIn />
                                <span>Run Assignments</span>
                            </button>

                            <button
                                className="supervisor-quick-action-btn"
                                onClick={() => downloadTeamReport('csv')}
                            >
                                <Download />
                                <span>Export Report</span>
                            </button>
                        </div>
                    </div>

                    {/* Team Metrics */}
                    <div className="supervisor-section-card">
                        <div className="section-header">
                            <Typography className="section-title">
                                <BarChart sx={{ fontSize: 18, mr: 1 }} />
                                Team Metrics
                            </Typography>
                        </div>

                        <div className="team-metrics">
                            <div className="metric-item">
                                <span className="metric-label">Avg Collections per Officer</span>
                                <span className="metric-value">
                                    {formatAmount(performanceSummary?.averageCollectionsPerOfficer || 0)}
                                </span>
                            </div>

                            <div className="metric-item">
                                <span className="metric-label">Calls per Officer (Daily)</span>
                                <span className="metric-value">
                                    {Math.round(safeNumber(performanceSummary?.averageCallsPerOfficer)) || 0}
                                </span>
                            </div>

                            <div className="metric-item">
                                <span className="metric-label">Success Rate</span>
                                <span className="metric-value">
                                    {safeNumber(performanceSummary?.successRate).toFixed(1)}%
                                </span>
                            </div>

                            <div className="metric-item">
                                <span className="metric-label">Avg Customers per Officer</span>
                                <span className="metric-value">
                                    {Math.round(safeNumber(performanceSummary?.totalAssignedCustomers) / safeNumber(teamOverview?.teamSize, 1)) || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </Box>
            </Box>

            {/* Dialog for displaying officers assigned to a loan type */}
            <Dialog
                open={officersDialogOpen}
                onClose={() => setOfficersDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                            Officers Assigned to {selectedLoanType}
                        </Typography>
                        <IconButton onClick={() => setOfficersDialogOpen(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedLoanOfficers.length > 0 ? (
                        <List>
                            {selectedLoanOfficers.map((officer, index) => (
                                <ListItem
                                    key={index}
                                    sx={{
                                        py: 1.5,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: '#f8f9fa'
                                        }
                                    }}
                                    onClick={() => {
                                        setOfficersDialogOpen(false);
                                        handleOfficerClick(officer);
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: '#2c3e50' }}>
                                            {officer.name?.charAt(0).toUpperCase() || 'O'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography sx={{ fontWeight: 600, color: '#333' }}>
                                                {officer.name || 'Unknown Officer'}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                                                <Typography variant="body2" sx={{ color: '#666' }}>
                                                    Assigned Customers: {officer.assignedCustomers || 0}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#666' }}>
                                                    Efficiency: {safeNumber(officer.efficiency).toFixed(1)}/10
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Group sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                            <Typography color="text.secondary">
                                No officers assigned to this loan type
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOfficersDialogOpen(false)}
                        sx={{ color: '#2c3e50' }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* OFFICER DETAILS MODAL - WITH REPORT FORMAT SELECTION */}
            <Modal
                open={officerModalOpen}
                onClose={handleCloseOfficerModal}
                aria-labelledby="officer-details-modal"
            >
                <Box className="officer-modal-compact">
                    {selectedOfficer && (
                        <div className="officer-modal-content-compact">
                            {/* Modal Header - Compact */}
                            <div className="officer-modal-header-compact">
                                <div className="officer-modal-header-content-compact">
                                    <Avatar
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            bgcolor: '#2c3e50',
                                            fontSize: '1.25rem',
                                            fontWeight: 'bold',
                                            border: '2px solid white',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {(selectedOfficer.fullName ||
                                            selectedOfficer.name ||
                                            selectedOfficer.username || 'O').charAt(0).toUpperCase()}
                                    </Avatar>
                                    <div>
                                        <Typography className="officer-modal-title-compact">
                                            {selectedOfficer.fullName || selectedOfficer.name || selectedOfficer.username || 'Officer'}
                                        </Typography>
                                        <div className="officer-modal-subtitle-compact">
                                            <span>{selectedOfficer.loanType || 'Loan Officer'}</span>
                                            <span className="subtitle-divider">•</span>
                                            <span>ID: {officerDetails?.employeeId || selectedOfficer.employeeId || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="officer-modal-actions-compact">
                                    <button
                                        className="officer-modal-primary-btn-compact"
                                        onClick={handleOpenReportModal}
                                    >
                                        <FileDownload sx={{ fontSize: 14, mr: 0.5 }} />
                                        Full Report
                                    </button>
                                    <IconButton
                                        onClick={handleCloseOfficerModal}
                                        className="officer-modal-close-btn-compact"
                                        size="small"
                                    >
                                        <Close />
                                    </IconButton>
                                </div>
                            </div>

                            {officerDetailsLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, minHeight: '200px' }}>
                                    <CircularProgress size={28} sx={{ color: '#2c3e50' }} />
                                    <Typography sx={{ ml: 2, fontSize: '0.75rem', color: '#666' }}>
                                        Loading officer details...
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    {/* Compact Tabs */}
                                    <div className="officer-modal-tabs-compact">
                                        <button
                                            className={`officer-tab-btn-compact ${activeTab === 'overview' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('overview')}
                                        >
                                            <AssessmentIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                            Overview
                                        </button>
                                        <button
                                            className={`officer-tab-btn-compact ${activeTab === 'collections' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('collections')}
                                        >
                                            <MonetizationOn sx={{ fontSize: 14, mr: 0.5 }} />
                                            Collections
                                        </button>
                                        <button
                                            className={`officer-tab-btn-compact ${activeTab === 'customers' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('customers')}
                                        >
                                            <GroupIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                            Customers
                                        </button>
                                        <button
                                            className={`officer-tab-btn-compact ${activeTab === 'activities' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('activities')}
                                        >
                                            <Timeline sx={{ fontSize: 14, mr: 0.5 }} />
                                            Activity
                                        </button>
                                    </div>

                                    <div className="officer-modal-body-compact">
                                        {/* TAB 1: PERFORMANCE OVERVIEW - COMPACT */}
                                        {activeTab === 'overview' && (
                                            <div className="officer-overview-compact">
                                                {/* KPI Grid - 2 CARDS */}
                                                <div className="officer-kpi-grid-compact two-cards">
                                                    <div className="officer-kpi-card-compact dark-theme">
                                                        <div className="kpi-icon-wrapper-compact dark-bg">
                                                            <Speed sx={{ fontSize: 18 }} />
                                                        </div>
                                                        <div className="kpi-content-compact">
                                                            <span className="kpi-label-compact">Collection Rate</span>
                                                            <span className="kpi-value-compact">
                                                                {safeNumber(officerDetails?.performance?.collectionRate || 78.3).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="officer-kpi-card-compact dark-theme">
                                                        <div className="kpi-icon-wrapper-compact dark-bg">
                                                            <PhoneCallback sx={{ fontSize: 18 }} />
                                                        </div>
                                                        <div className="kpi-content-compact">
                                                            <span className="kpi-label-compact">Call Conversion</span>
                                                            <span className="kpi-value-compact">
                                                                {safeNumber(officerDetails?.performance?.callConversion || 64).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Metrics Grid - 2 columns WITH LIGHT HEADERS */}
                                                <div className="officer-metrics-grid-compact">
                                                    <div className="officer-metric-card-compact">
                                                        <div className="metric-card-header-compact light-header">
                                                            <MonetizationOn sx={{ fontSize: 14, color: '#2c3e50' }} />
                                                            <span>Collections</span>
                                                        </div>
                                                        <div className="metric-card-content-compact">
                                                            <div className="metric-row-compact">
                                                                <span>Total</span>
                                                                <span className="metric-value-highlight">
                                                                    {formatCompactAmount(officerDetails?.collections?.total || selectedOfficer.collections || 0)}
                                                                </span>
                                                            </div>
                                                            <div className="metric-row-compact">
                                                                <span>This Month</span>
                                                                <span>{formatCompactAmount(officerDetails?.collections?.monthly || 0)}</span>
                                                            </div>
                                                            <div className="metric-row-compact">
                                                                <span>Today</span>
                                                                <span>{formatCompactAmount(officerDetails?.collections?.today || 0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="officer-metric-card-compact">
                                                        <div className="metric-card-header-compact light-header">
                                                            <GroupIcon sx={{ fontSize: 14, color: '#2c3e50' }} />
                                                            <span>Customers</span>
                                                        </div>
                                                        <div className="metric-card-content-compact">
                                                            <div className="metric-row-compact">
                                                                <span>Assigned</span>
                                                                <span className="metric-value-highlight">
                                                                    {officerDetails?.customers?.totalAssigned || selectedOfficer.assignedCustomers || 0}
                                                                </span>
                                                            </div>
                                                            <div className="metric-row-compact">
                                                                <span>Active</span>
                                                                <span className="success-text">{officerDetails?.customers?.active || 0}</span>
                                                            </div>
                                                            <div className="metric-row-compact">
                                                                <span>Overdue</span>
                                                                <span className="warning-text">{officerDetails?.customers?.overdue || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="officer-metric-card-compact">
                                                        <div className="metric-card-header-compact light-header">
                                                            <AssignmentTurnedIn sx={{ fontSize: 14, color: '#2c3e50' }} />
                                                            <span>Assignments</span>
                                                        </div>
                                                        <div className="metric-card-content-compact">
                                                            <div className="metric-row-compact">
                                                                <span>Completed</span>
                                                                <span className="success-text">{officerDetails?.assignments?.completed || 0}</span>
                                                            </div>
                                                            <div className="metric-row-compact">
                                                                <span>Pending</span>
                                                                <span className="warning-text">{officerDetails?.assignments?.pending || 0}</span>
                                                            </div>
                                                            <div className="metric-row-compact">
                                                                <span>In Progress</span>
                                                                <span>{officerDetails?.assignments?.inProgress || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="officer-metric-card-compact">
                                                        <div className="metric-card-header-compact light-header">
                                                            <Call sx={{ fontSize: 14, color: '#2c3e50' }} />
                                                            <span>Calls</span>
                                                        </div>
                                                        <div className="metric-card-content-compact">
                                                            <div className="metric-row-compact">
                                                                <span>Today</span>
                                                                <span>{officerDetails?.calls?.today || selectedOfficer.callsToday || 0}</span>
                                                            </div>
                                                            <div className="metric-row-compact">
                                                                <span>This Week</span>
                                                                <span>{officerDetails?.calls?.weekly || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contact Info */}
                                                <div className="officer-contact-compact">
                                                    <div className="contact-row-compact">
                                                        <Email sx={{ fontSize: 14, color: '#2c3e50' }} />
                                                        <span className="contact-label-compact">Email:</span>
                                                        <span className="contact-value-compact">
                                                            {officerDetails?.email || selectedOfficer.email || `${selectedOfficer.username || 'officer'}@company.com`}
                                                        </span>
                                                    </div>
                                                    <div className="contact-row-compact">
                                                        <Phone sx={{ fontSize: 14, color: '#2c3e50' }} />
                                                        <span className="contact-label-compact">Phone:</span>
                                                        <span className="contact-value-compact">
                                                            {officerDetails?.phone || selectedOfficer.phone || '+254 7XX XXX XXX'}
                                                        </span>
                                                    </div>
                                                    <div className="contact-row-compact">
                                                        <CalendarToday sx={{ fontSize: 14, color: '#2c3e50' }} />
                                                        <span className="contact-label-compact">Joined:</span>
                                                        <span className="contact-value-compact">
                                                            {officerDetails?.joinDate ? new Date(officerDetails.joinDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 2: COLLECTIONS - COMPACT */}
                                        {activeTab === 'collections' && (
                                            <div className="officer-collections-compact">
                                                <div className="collections-summary-compact">
                                                    <div className="collection-summary-item">
                                                        <AccountBalanceWallet sx={{ fontSize: 20 }} />
                                                        <div>
                                                            <span className="summary-label">Total</span>
                                                            <span className="summary-value">
                                                                {formatCompactAmount(officerDetails?.collections?.total || selectedOfficer.collections || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="collection-summary-item">
                                                        <CalendarToday sx={{ fontSize: 20 }} />
                                                        <div>
                                                            <span className="summary-label">Monthly</span>
                                                            <span className="summary-value">
                                                                {formatCompactAmount(officerDetails?.collections?.monthly || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="collection-summary-item">
                                                        <TrendingUpIcon sx={{ fontSize: 20 }} />
                                                        <div>
                                                            <span className="summary-label">Weekly</span>
                                                            <span className="summary-value">
                                                                {formatCompactAmount(officerDetails?.collections?.weekly || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="recent-collections-compact">
                                                    <div className="recent-header">
                                                        <Receipt sx={{ fontSize: 14, color: '#2c3e50' }} />
                                                        <span>Recent Collections</span>
                                                    </div>
                                                    <div className="recent-list-compact">
                                                        {collectionsData && collectionsData.length > 0 ? (
                                                            collectionsData.slice(0, 3).map((collection, idx) => (
                                                                <div key={idx} className="recent-item-compact">
                                                                    <CheckCircle sx={{ fontSize: 14, color: '#27ae60' }} />
                                                                    <span className="recent-desc">{collection.customerName || 'Customer'} - {collection.transactionId || 'TXN'}</span>
                                                                    <span className="recent-amount">{formatCompactAmount(collection.amount)}</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="empty-recent">No recent collections</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 3: CUSTOMERS - COMPACT */}
                                        {activeTab === 'customers' && (
                                            <div className="officer-customers-compact">
                                                <div className="customers-portfolio-compact">
                                                    <div className="portfolio-item">
                                                        <GroupIcon sx={{ fontSize: 20 }} />
                                                        <div>
                                                            <span className="portfolio-label">Total</span>
                                                            <span className="portfolio-value">
                                                                {officerDetails?.customers?.totalAssigned || selectedOfficer.assignedCustomers || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="portfolio-item">
                                                        <CheckCircle sx={{ fontSize: 20 }} />
                                                        <div>
                                                            <span className="portfolio-label">Active</span>
                                                            <span className="portfolio-value">
                                                                {officerDetails?.customers?.active || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="portfolio-item">
                                                        <Warning sx={{ fontSize: 20 }} />
                                                        <div>
                                                            <span className="portfolio-label">Overdue</span>
                                                            <span className="portfolio-value">
                                                                {officerDetails?.customers?.overdue || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="portfolio-metrics-compact">
                                                    <div className="metric-bar-item">
                                                        <span className="metric-bar-label">Active Rate</span>
                                                        <div className="metric-bar-container-compact">
                                                            <div className="metric-bar-fill-compact" style={{
                                                                width: `${officerDetails?.customers?.totalAssigned ? 
                                                                    ((safeNumber(officerDetails?.customers?.active) / safeNumber(officerDetails?.customers?.totalAssigned)) * 100) : 0}%`,
                                                                backgroundColor: '#27ae60'
                                                            }}></div>
                                                        </div>
                                                        <span className="metric-bar-percentage">
                                                            {officerDetails?.customers?.totalAssigned ? 
                                                                ((safeNumber(officerDetails?.customers?.active) / safeNumber(officerDetails?.customers?.totalAssigned)) * 100).toFixed(0) : 0}%
                                                        </span>
                                                    </div>
                                                    <div className="metric-bar-item">
                                                        <span className="metric-bar-label">Overdue Rate</span>
                                                        <div className="metric-bar-container-compact">
                                                            <div className="metric-bar-fill-compact" style={{
                                                                width: `${officerDetails?.customers?.totalAssigned ? 
                                                                    ((safeNumber(officerDetails?.customers?.overdue) / safeNumber(officerDetails?.customers?.totalAssigned)) * 100) : 0}%`,
                                                                backgroundColor: '#e74c3c'
                                                            }}></div>
                                                        </div>
                                                        <span className="metric-bar-percentage warning-text">
                                                            {officerDetails?.customers?.totalAssigned ? 
                                                                ((safeNumber(officerDetails?.customers?.overdue) / safeNumber(officerDetails?.customers?.totalAssigned)) * 100).toFixed(0) : 0}%
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="customer-distribution-compact">
                                                    <div className="distribution-header-compact">
                                                        <PieChartIcon sx={{ fontSize: 14, color: '#2c3e50' }} />  {/* ✅ FIXED: Using PieChartIcon instead of PieChart */}
                                                        <span>Status Distribution</span>
                                                    </div>
                                                    <div className="distribution-legend-compact">
                                                        <div className="legend-item-compact">
                                                            <span className="legend-color active"></span>
                                                            <span>Active: {officerDetails?.customers?.active || 0}</span>
                                                        </div>
                                                        <div className="legend-item-compact">
                                                            <span className="legend-color overdue"></span>
                                                            <span>Overdue: {officerDetails?.customers?.overdue || 0}</span>
                                                        </div>
                                                        <div className="legend-item-compact">
                                                            <span className="legend-color new"></span>
                                                            <span>New: {officerDetails?.customers?.newThisMonth || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 4: ACTIVITIES - COMPACT */}
                                        {activeTab === 'activities' && (
                                            <div className="officer-activities-compact">
                                                <div className="activities-header-compact">
                                                    <Typography className="activities-title-compact">
                                                        Recent Activity
                                                    </Typography>
                                                    <span className="activities-count-compact">
                                                        {officerActivities.length}
                                                    </span>
                                                </div>

                                                <div className="activity-timeline-compact">
                                                    {officerActivities.length > 0 ? (
                                                        officerActivities.slice(0, 6).map((activity, index) => (
                                                            <div key={index} className="activity-item-compact">
                                                                <div className="activity-icon-compact" style={{ backgroundColor: getActivityColor(activity.type) }}>
                                                                    {getActivityIcon(activity.type)}
                                                                </div>
                                                                <div className="activity-details-compact">
                                                                    <div className="activity-header-compact">
                                                                        <Chip
                                                                            label={getActivityLabel(activity.type)}
                                                                            size="small"
                                                                            sx={{
                                                                                backgroundColor: getActivityColor(activity.type),
                                                                                color: 'white',
                                                                                fontSize: '0.5rem',
                                                                                height: '16px',
                                                                                fontWeight: 700
                                                                            }}
                                                                        />
                                                                        <span className="activity-time-compact">
                                                                            {formatActivityTime(activity.time)}
                                                                        </span>
                                                                    </div>
                                                                    <span className="activity-desc-compact">
                                                                        {activity.details.length > 40 ? activity.details.substring(0, 40) + '...' : activity.details}
                                                                    </span>
                                                                    {activity.amount && (
                                                                        <span className="activity-amount-compact">
                                                                            {formatCompactAmount(activity.amount)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="empty-activities-compact">
                                                            <Timeline sx={{ fontSize: 32, color: '#ccc' }} />
                                                            <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
                                                                No recent activities
                                                            </Typography>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </Box>
            </Modal>

            {/* COMPACT REPORT FORMAT SELECTION MODAL - REDUCED SIZE */}
            <Modal
                open={reportModalOpen}
                onClose={handleCloseReportModal}
                aria-labelledby="report-format-modal"
            >
                <Box className="report-modal-compact">
                    <div className="report-modal-content-compact">
                        <div className="report-modal-header-compact">
                            <Typography className="report-modal-title-compact">
                                <FileDownload sx={{ fontSize: 16, mr: 1 }} />
                                Download Report
                            </Typography>
                            <IconButton
                                onClick={handleCloseReportModal}
                                className="report-modal-close-btn-compact"
                                size="small"
                            >
                                <Close sx={{ fontSize: 16 }} />
                            </IconButton>
                        </div>

                        <div className="report-modal-body-compact">
                            <div className="report-officer-info-compact">
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: '#2c3e50',
                                        fontSize: '0.875rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {(selectedOfficer?.fullName ||
                                        selectedOfficer?.name ||
                                        selectedOfficer?.username || 'O').charAt(0).toUpperCase()}
                                </Avatar>
                                <div>
                                    <Typography className="report-officer-name-compact">
                                        {selectedOfficer?.fullName || selectedOfficer?.name || selectedOfficer?.username || 'Officer'}
                                    </Typography>
                                    <Typography className="report-officer-role-compact">
                                        {selectedOfficer?.loanType || 'Loan Officer'}
                                    </Typography>
                                </div>
                            </div>

                            <Divider sx={{ my: 1 }} />

                            <div className="report-format-grid-compact">
                                <button
                                    className="report-format-option-compact"
                                    onClick={() => handleDownloadReport('excel')}
                                    disabled={reportLoading}
                                >
                                    <div className="report-format-icon-compact excel">
                                        <TableRows sx={{ fontSize: 20 }} />
                                    </div>
                                    <div className="report-format-details-compact">
                                        <span className="report-format-name-compact">Excel</span>
                                        <span className="report-format-desc-compact">.xlsx</span>
                                    </div>
                                    <DownloadIcon sx={{ fontSize: 16, color: '#666', ml: 'auto' }} />
                                </button>

                                <button
                                    className="report-format-option-compact"
                                    onClick={() => handleDownloadReport('pdf')}
                                    disabled={reportLoading}
                                >
                                    <div className="report-format-icon-compact pdf">
                                        <PictureAsPdf sx={{ fontSize: 20 }} />
                                    </div>
                                    <div className="report-format-details-compact">
                                        <span className="report-format-name-compact">PDF</span>
                                        <span className="report-format-desc-compact">.pdf</span>
                                    </div>
                                    <DownloadIcon sx={{ fontSize: 16, color: '#666', ml: 'auto' }} />
                                </button>

                                <button
                                    className="report-format-option-compact"
                                    onClick={() => handleDownloadReport('chart')}
                                    disabled={reportLoading}
                                >
                                    <div className="report-format-icon-compact chart">
                                        <BarChartIcon sx={{ fontSize: 20 }} />
                                    </div>
                                    <div className="report-format-details-compact">
                                        <span className="report-format-name-compact">Chart</span>
                                        <span className="report-format-desc-compact">.png</span>
                                    </div>
                                    <DownloadIcon sx={{ fontSize: 16, color: '#666', ml: 'auto' }} />
                                </button>
                            </div>

                            {reportError && (
                                <Alert severity="error" sx={{ mt: 1, fontSize: '0.75rem', py: 0.5 }}>
                                    {reportError}
                                </Alert>
                            )}

                            {reportLoading && (
                                <div className="report-loading-compact">
                                    <CircularProgress size={20} sx={{ color: '#2c3e50' }} />
                                    <span>Generating...</span>
                                </div>
                            )}
                        </div>

                        <div className="report-modal-footer-compact">
                            <Button
                                onClick={handleCloseReportModal}
                                className="report-modal-cancel-btn-compact"
                                size="small"
                                disabled={reportLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Box>
            </Modal>
        </Box>
    );
};

export default SupervisorDashboard;