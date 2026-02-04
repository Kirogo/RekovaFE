// src/pages/SupervisorDashboard.jsx
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
    AvatarGroup,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    IconButton
} from "@mui/material";
import {
    People,
    TrendingUp,
    Refresh,
    ArrowForward,
    Download,
    Assignment,
    Assessment,
    Timeline,
    Group,
    CreditCard,
    AccountBalance,
    Business,
    ShoppingCart,
    AttachMoney,
    CheckCircle,
    Cancel,
    Schedule,
    BarChart,
    PieChart,
    TableChart,
    AssignmentInd,
    AssignmentTurnedIn,
    PlaylistAddCheck,
    Person,
    Payments,
    ReceiptLong,
    AccessTime,
    Close,
    Visibility,
    AccountCircle,
    Login,
    Phone,
    Warning,
    AccountBalanceWallet,
    Notifications
} from "@mui/icons-material";
import axios from "axios";
import authService from "../services/auth.service";
import "../styles/dashboard.css";
import "../styles/supervisor-dashboard.css";

const SupervisorDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [selectedLoanType, setSelectedLoanType] = useState(null);
    const [officersDialogOpen, setOfficersDialogOpen] = useState(false);
    const [selectedLoanOfficers, setSelectedLoanOfficers] = useState([]);

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

            if (err.response) {
                console.error("Error response:", {
                    status: err.response.status,
                    data: err.response.data,
                    url: err.config?.url
                });
            }

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

    // Helper functions
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
        // Enhanced helper functions that handle API activity types
    const getActivityIcon = (activityType) => {
        const type = activityType?.toLowerCase() || 'activity';
        
        switch (type) {
            case 'login':
            case 'user_login':
            case 'authentication':
                return <Login sx={{ fontSize: 16, color: '#3498db' }} />;
            case 'call':
            case 'phone_call':
            case 'customer_call':
                return <Phone sx={{ fontSize: 16, color: '#2ecc71' }} />;
            case 'transaction':
            case 'payment':
            case 'payment_processed':
                return <AccountBalanceWallet sx={{ fontSize: 16, color: '#9b59b6' }} />;
            case 'promise_made':
            case 'promise_created':
                return <Assignment sx={{ fontSize: 16, color: '#f39c12' }} />;
            case 'promise_due':
            case 'promise_reminder':
                return <Schedule sx={{ fontSize: 16, color: '#e67e22' }} />;
            case 'promise_broken':
            case 'promise_failed':
                return <Warning sx={{ fontSize: 16, color: '#c0392b' }} />;
            case 'collection':
            case 'collection_success':
                return <Payments sx={{ fontSize: 16, color: '#27ae60' }} />;
            case 'assignment':
            case 'customer_assigned':
                return <AssignmentTurnedIn sx={{ fontSize: 16, color: '#8e44ad' }} />;
            case 'payment_received':
                return <ReceiptLong sx={{ fontSize: 16, color: '#16a085' }} />;
            case 'overdue':
            case 'payment_overdue':
                return <Schedule sx={{ fontSize: 16, color: '#c0392b' }} />;
            case 'new_customer':
            case 'customer_registered':
                return <Person sx={{ fontSize: 16, color: '#2980b9' }} />;
            case 'customer_update':
            case 'profile_updated':
                return <AccountCircle sx={{ fontSize: 16, color: '#7f8c8d' }} />;
            case 'comment':
            case 'note_added':
                return <ReceiptLong sx={{ fontSize: 16, color: '#7f8c8d' }} />;
            default:
                return <Notifications sx={{ fontSize: 16, color: '#95a5a6' }} />;
        }
    };

    const getActivityLabel = (activityType) => {
        const type = activityType?.toLowerCase() || 'activity';
        
        switch (type) {
            case 'login':
            case 'user_login':
                return 'LOGIN';
            case 'call':
            case 'phone_call':
                return 'CALL';
            case 'transaction':
            case 'payment':
                return 'TRANSACTION';
            case 'promise_made':
            case 'promise_created':
                return 'PROMISE MADE';
            case 'promise_due':
                return 'PROMISE DUE';
            case 'promise_broken':
                return 'BROKEN PROMISE';
            case 'collection':
                return 'COLLECTION';
            case 'assignment':
                return 'ASSIGNMENT';
            case 'payment_received':
                return 'PAYMENT';
            case 'overdue':
                return 'OVERDUE';
            case 'new_customer':
                return 'NEW CUSTOMER';
            case 'customer_update':
                return 'CUSTOMER UPDATE';
            case 'comment':
                return 'COMMENT';
            default:
                return 'ACTIVITY';
        }
    };

     const getActivityColor = (activityType) => {
        switch (activityType) {
            case 'login':
                return '#3498db'; // Blue for logins
            case 'call':
                return '#2ecc71'; // Green for calls
            case 'transaction':
                return '#9b59b6'; // Purple for transactions
            case 'promise_made':
                return '#f39c12'; // Orange for promises made
            case 'promise_due':
                return '#e67e22'; // Dark orange for promises due
            case 'promise_broken':
                return '#c0392b'; // Dark red for broken promises
            case 'collection':
                return '#27ae60'; // Dark green for collections
            case 'assignment':
                return '#8e44ad'; // Purple for assignments
            case 'payment':
                return '#16a085'; // Teal for payments
            case 'overdue':
                return '#c0392b'; // Dark red for overdue
            case 'new_customer':
                return '#2980b9'; // Blue for new customers
            case 'customer_update':
                return '#7f8c8d'; // Gray for customer updates
            default:
                return '#95a5a6'; // Grey for others
        }
    };

    const formatActivityTime = (dateString) => {
        if (!dateString) return 'Just now';

        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;

            return date.toLocaleDateString('en-KE', {
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Just now';
        }
    };

    const formatAmount = (amount) => {
        const numAmount = Number(amount || 0);
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numAmount);
    };

    const downloadTeamReport = async (format = 'csv') => {
        try {
            alert('Export functionality would be implemented here');
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
        teamOverview,
        performanceSummary,
        assignmentStats,
        recentActivities = [],
        loanTypeDistribution,
        todaysCollections,
        callStats,
        officersByLoanType
    } = dashboardData;


    // Enhanced recent activities with REAL activities data

    // Use actual API data or enhanced fallback data
    const enhancedActivities = recentActivities.length > 0 ? 
        // Transform API response to match our format
        recentActivities.map(activity => ({
            type: activity.type || activity.activityType || 'activity',
            officer: activity.officerName || activity.userName || activity.officer || 'System',
            time: activity.createdAt || activity.timestamp || activity.date || new Date(),
            details: activity.description || activity.details || activity.action || 'Activity performed',
            amount: activity.amount || activity.paymentAmount || null
        })).sort((a, b) => new Date(b.time) - new Date(a.time)) // Sort by time (newest first)
        : 
        // Fallback data for development
        [
            { type: 'login', officer: 'Michael Mwai', time: new Date(Date.now() - 300000), details: 'Officer logged into system' },
            { type: 'transaction', officer: 'Jane Smith', time: new Date(Date.now() - 1200000), details: 'Processed payment from customer James Mwangi', amount: 15000 },
            { type: 'call', officer: 'Mike Johnson', time: new Date(Date.now() - 1800000), details: 'Made follow-up call to customer Sarah Kamau' },
            { type: 'promise_made', officer: 'David Ochieng', time: new Date(Date.now() - 2400000), details: 'Customer made promise to pay KES 12,000 by Friday' },
        ];

    // Sort activities by time (newest first)
    enhancedActivities.sort((a, b) => new Date(b.time) - new Date(a.time));

    const statCards = [
        {
            title: "Team Size",
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
                            Supervisor Dashboard
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
                            <Refresh sx={{ fontSize: 18 }} />
                            Refresh
                        </button>
                        <Tooltip title="Download Team Report">
                            <button
                                className="supervisor-export-btn"
                                onClick={() => downloadTeamReport('csv')}
                            >
                                <Download sx={{ fontSize: 18 }} />
                                Export
                            </button>
                        </Tooltip>
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
                                <People sx={{ fontSize: 18, mr: 1 }} />
                                Team Performance
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip
                                    label="Top Performers"
                                    size="small"
                                    sx={{ background: 'linear-gradient(135deg, #34495e, #2c3e50)', color: 'white', fontWeight: 600 }}
                                />
                            </Box>
                        </div>

                        <div className="team-performance-grid">
                            {performanceSummary?.topPerformers?.length > 0 ? (
                                performanceSummary.topPerformers.map((officer, index) => (
                                    <div key={index} className="team-member-card">
                                        <div className="team-member-header">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#2c3e50' }}>
                                                    {(officer.fullName || officer.name || officer.username || '?').charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography className="officer-name">
                                                        {officer.fullName || officer.name || officer.username || 'Unknown Officer'}
                                                    </Typography>
                                                    <Typography className="officer-role">
                                                        {(officer.loanType || 'General')} Specialist
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Chip
                                                label={`#${index + 1}`}
                                                size="small"
                                                sx={{
                                                    background: index === 0 ? '#f39c12' :
                                                        index === 1 ? '#95a5a6' :
                                                            index === 2 ? '#d4a762' : '#2c3e50',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </div>

                                        <div className="team-member-stats">
                                            <div className="stat-item">
                                                <span className="stat-label-small">Efficiency</span>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={(officer.efficiency || 0) * 10}
                                                        sx={{
                                                            flex: 1,
                                                            height: 6,
                                                            borderRadius: 3,
                                                            backgroundColor: '#ecf0f1',
                                                            '& .MuiLinearProgress-bar': {
                                                                backgroundColor: (officer.efficiency || 0) >= 8 ? '#27ae60' :
                                                                    (officer.efficiency || 0) >= 6 ? '#f39c12' : '#e74c3c'
                                                            }
                                                        }}
                                                    />
                                                    <span className="stat-value-small">{(officer.efficiency || 0).toFixed(1)}</span>
                                                </Box>
                                            </div>

                                            <div className="stats-row">
                                                <div className="stat-pair">
                                                    <span className="stat-label-tiny">Collections</span>
                                                    <span className="stat-value-tiny">{formatAmount(officer.collections || officer.totalCollections || 0)}</span>
                                                </div>
                                                <div className="stat-pair">
                                                    <span className="stat-label-tiny">Customers</span>
                                                    <span className="stat-value-tiny">{officer.assignedCustomers || officer.totalCustomers || 0}</span>
                                                </div>
                                                <div className="stat-pair">
                                                    <span className="stat-label-tiny">Calls Today</span>
                                                    <span className="stat-value-tiny">{officer.callsToday || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            size="small"
                                            endIcon={<ArrowForward />}
                                            sx={{
                                                mt: 1,
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                color: '#2c3e50',
                                                '&:hover': { color: '#1a252f' }
                                            }}
                                            onClick={() => navigate(`/supervisor/officer/${officer.username || officer._id}`)}
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px' }}>
                                    <Group sx={{ fontSize: 40, color: '#2c3e50', mb: 1 }} />
                                    <Typography sx={{ fontSize: '0.9rem', color: '#666', mb: 2 }}>
                                        No performance data available
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            borderColor: '#2c3e50',
                                            color: '#2c3e50',
                                            '&:hover': { borderColor: '#1a252f' }
                                        }}
                                        onClick={() => fetchSupervisorDashboard()}
                                    >
                                        Refresh Data
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Loan Type Distribution - Table format */}
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
                                                style={{ cursor: 'pointer' }}
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
                                                    <span className="customer-count-value">{item.count || 0}</span>
                                                </div>

                                                <div className="loan-type-column officer-count-cell">
                                                    <div className="officer-count-wrapper">
                                                        <Chip
                                                            label={officerCount}
                                                            size="small"
                                                            sx={{
                                                                background: officerCount > 0 ? 'linear-gradient(135deg, #34495e, #2c3e50)' : '#e74c3c',
                                                                color: 'white',
                                                                fontWeight: 600,
                                                                fontSize: '0.65rem'
                                                            }}
                                                        />
                                                        {officerCount > 0 && (
                                                            <Tooltip title={`${officerNames.join(', ')}`}>
                                                                <IconButton size="small" sx={{ ml: 1 }}>
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
                                                            '&:hover': { borderColor: '#1a252f' }
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
                                    <div className="empty-state" style={{ textAlign: 'center', padding: '20px', gridColumn: '1 / -1' }}>
                                        <TableChart sx={{ fontSize: 40, color: '#2c3e50', mb: 1 }} />
                                        <Typography sx={{ fontSize: '0.8rem', color: '#666' }}>
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


                    {/* Enhanced Recent Activity Section */}
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
                            {enhancedActivities.slice(0, 10).map((activity, index) => (
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
                                        {index < enhancedActivities.slice(0, 10).length - 1 && (
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
                                            <Typography className="activity-trail-time">
                                                {formatActivityTime(activity.time || activity.date)}
                                            </Typography>
                                        </div>
                                        <Typography className="activity-trail-details">
                                            {activity.details || activity.action || 'Activity performed'}
                                        </Typography>
                                        {activity.amount && (
                                            <div className="activity-amount-wrapper">
                                                <span className="activity-amount">
                                                    {formatAmount(activity.amount)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
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
                                    {Math.round(performanceSummary?.averageCallsPerOfficer || 0)}
                                </span>
                            </div>

                            <div className="metric-item">
                                <span className="metric-label">Success Rate</span>
                                <span className="metric-value">
                                    {performanceSummary?.successRate || 0}%
                                </span>
                            </div>

                            <div className="metric-item">
                                <span className="metric-label">Avg Customers per Officer</span>
                                <span className="metric-value">
                                    {Math.round(performanceSummary?.totalAssignedCustomers / (teamOverview?.teamSize || 1)) || 0}
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
                                <ListItem key={index} sx={{ py: 1.5 }}>
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
                                                    Efficiency: {(officer.efficiency || 0).toFixed(1)}/10
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
        </Box>
    );
};

export default SupervisorDashboard;