// src/components/reports/OfficerChartReport.jsx
import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper, Avatar, Grid, Divider } from '@mui/material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
import authService from '../../services/auth.service';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

const OfficerChartReport = ({ officer, officerDetails, activities }) => {
    const chartRef = useRef(null);
    
    const formatAmount = (amount) => {
        const num = Number(amount) || 0;
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };

    const formatCompactAmount = (amount) => {
        const num = Number(amount) || 0;
        if (num >= 1000000) return `KES ${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `KES ${(num / 1000).toFixed(1)}K`;
        return `KES ${num}`;
    };

    // Performance data
    const performanceData = {
        collectionRate: officerDetails?.performance?.collectionRate || 78.3,
        callConversion: officerDetails?.performance?.callConversion || 64.0,
        efficiency: officerDetails?.performance?.efficiency || 8.5,
        targetCollection: 85,
        targetConversion: 70,
        targetEfficiency: 9
    };

    // Collections breakdown
    const collectionsData = {
        labels: ['Total', 'Monthly', 'Weekly', 'Today'],
        datasets: [
            {
                label: 'Collections (KES)',
                data: [
                    officerDetails?.collections?.total || 323500,
                    officerDetails?.collections?.monthly || 125000,
                    officerDetails?.collections?.weekly || 32500,
                    officerDetails?.collections?.today || 8500
                ],
                backgroundColor: [
                    'rgba(44, 62, 80, 0.8)',
                    'rgba(52, 73, 94, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)'
                ],
                borderColor: [
                    '#2c3e50',
                    '#34495e',
                    '#3498db',
                    '#27ae60'
                ],
                borderWidth: 1
            }
        ]
    };

    // Customer status distribution
    const customerStatusData = {
        labels: ['Active', 'Overdue', 'New This Month'],
        datasets: [
            {
                data: [
                    officerDetails?.customers?.active || 1,
                    officerDetails?.customers?.overdue || 1,
                    officerDetails?.customers?.newThisMonth || 0
                ],
                backgroundColor: [
                    '#27ae60',
                    '#e74c3c',
                    '#3498db'
                ],
                borderWidth: 0
            }
        ]
    };

    // Weekly call activity
    const weeklyCallData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Calls Made',
                data: [12, 15, 8, officerDetails?.calls?.today || 8, 10, 5, 2],
                backgroundColor: 'rgba(44, 62, 80, 0.6)',
                borderColor: '#2c3e50',
                borderWidth: 1,
                tension: 0.4,
                fill: true
            },
            {
                label: 'Target',
                data: [15, 15, 15, 15, 15, 8, 8],
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderColor: '#e74c3c',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }
        ]
    };

    // Collection trend (last 7 days)
    const collectionTrendData = {
        labels: ['Feb 6', 'Feb 7', 'Feb 8', 'Feb 9', 'Feb 10', 'Feb 11', 'Feb 12'],
        datasets: [
            {
                label: 'Daily Collections',
                data: [4500, 6200, 3800, 7500, 3500, 8500, 5000],
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderColor: '#27ae60',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#27ae60',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ]
    };

    const currentDate = new Date();
    const supervisorName = authService.getCurrentUser()?.fullName || 'System Administrator';

    return (
        <Box sx={{
            width: '1200px',
            height: '900px',
            backgroundColor: 'white',
            padding: '30px',
            fontFamily: 'Century Gothic, sans-serif',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box'
        }}>
            {/* Header Section */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                pb: 2,
                borderBottom: '2px solid #2c3e50'
            }}>
                <Box>
                    <Typography sx={{
                        fontSize: '28px',
                        fontWeight: 900,
                        color: '#2c3e50',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        mb: 0.5
                    }}>
                        PERFORMANCE DASHBOARD
                    </Typography>
                    <Typography sx={{
                        fontSize: '14px',
                        color: '#666',
                        fontWeight: 500
                    }}>
                        Loan Officer Performance Analysis • Generated: {format(currentDate, 'MMMM do, yyyy • HH:mm')}
                    </Typography>
                </Box>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    backgroundColor: '#f8f9fa',
                    padding: '12px 20px',
                    borderRadius: '8px'
                }}>
                    <Avatar sx={{
                        width: 60,
                        height: 60,
                        bgcolor: '#2c3e50',
                        fontSize: '24px',
                        fontWeight: 'bold'
                    }}>
                        {(officer?.fullName || officer?.name || 'O').charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography sx={{ fontSize: '18px', fontWeight: 800, color: '#2c3e50' }}>
                            {officer?.fullName || officer?.name || officer?.username || 'Officer'}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>
                            {officer?.loanType || 'Credit Cards'} Specialist
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#999' }}>
                            ID: {officerDetails?.employeeId || officer?.employeeId || 'EMP6a66a2'}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                    <Paper sx={{
                        p: 2,
                        backgroundColor: '#f8f9fa',
                        borderLeft: '4px solid #2c3e50',
                        borderRadius: '4px'
                    }}>
                        <Typography sx={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                            Collection Rate
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            <Typography sx={{ fontSize: '36px', fontWeight: 900, color: '#2c3e50' }}>
                                {performanceData.collectionRate.toFixed(1)}%
                            </Typography>
                            <Typography sx={{ fontSize: '14px', color: performanceData.collectionRate >= 85 ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>
                                {performanceData.collectionRate >= 85 ? '✓ Target Met' : `-${(85 - performanceData.collectionRate).toFixed(1)}%`}
                            </Typography>
                        </Box>
                        <Box sx={{ mt: 1, backgroundColor: '#ecf0f1', height: '6px', borderRadius: '3px', width: '100%' }}>
                            <Box sx={{
                                width: `${Math.min(100, (performanceData.collectionRate / 85) * 100)}%`,
                                height: '6px',
                                backgroundColor: performanceData.collectionRate >= 85 ? '#27ae60' : '#f39c12',
                                borderRadius: '3px'
                            }} />
                        </Box>
                        <Typography sx={{ fontSize: '10px', color: '#999', mt: 0.5 }}>
                            Target: 85%
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper sx={{
                        p: 2,
                        backgroundColor: '#f8f9fa',
                        borderLeft: '4px solid #2c3e50',
                        borderRadius: '4px'
                    }}>
                        <Typography sx={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                            Call Conversion
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            <Typography sx={{ fontSize: '36px', fontWeight: 900, color: '#2c3e50' }}>
                                {performanceData.callConversion.toFixed(1)}%
                            </Typography>
                            <Typography sx={{ fontSize: '14px', color: performanceData.callConversion >= 70 ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>
                                {performanceData.callConversion >= 70 ? '✓ Target Met' : `-${(70 - performanceData.callConversion).toFixed(1)}%`}
                            </Typography>
                        </Box>
                        <Box sx={{ mt: 1, backgroundColor: '#ecf0f1', height: '6px', borderRadius: '3px', width: '100%' }}>
                            <Box sx={{
                                width: `${Math.min(100, (performanceData.callConversion / 70) * 100)}%`,
                                height: '6px',
                                backgroundColor: performanceData.callConversion >= 70 ? '#27ae60' : '#f39c12',
                                borderRadius: '3px'
                            }} />
                        </Box>
                        <Typography sx={{ fontSize: '10px', color: '#999', mt: 0.5 }}>
                            Target: 70%
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper sx={{
                        p: 2,
                        backgroundColor: '#f8f9fa',
                        borderLeft: '4px solid #2c3e50',
                        borderRadius: '4px'
                    }}>
                        <Typography sx={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                            Efficiency Score
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            <Typography sx={{ fontSize: '36px', fontWeight: 900, color: '#2c3e50' }}>
                                {performanceData.efficiency.toFixed(1)}/10
                            </Typography>
                            <Typography sx={{ fontSize: '14px', color: performanceData.efficiency >= 9 ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>
                                {performanceData.efficiency >= 9 ? '✓ Target Met' : `-${(9 - performanceData.efficiency).toFixed(1)}`}
                            </Typography>
                        </Box>
                        <Box sx={{ mt: 1, backgroundColor: '#ecf0f1', height: '6px', borderRadius: '3px', width: '100%' }}>
                            <Box sx={{
                                width: `${(performanceData.efficiency / 10) * 100}%`,
                                height: '6px',
                                backgroundColor: performanceData.efficiency >= 9 ? '#27ae60' : '#f39c12',
                                borderRadius: '3px'
                            }} />
                        </Box>
                        <Typography sx={{ fontSize: '10px', color: '#999', mt: 0.5 }}>
                            Target: 9/10
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Charts Row 1 */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={7}>
                    <Paper sx={{ p: 2, height: '250px', backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#2c3e50', mb: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Collection Performance
                        </Typography>
                        <Box sx={{ height: '200px' }}>
                            <Bar
                                data={collectionsData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: (context) => `KES ${context.raw.toLocaleString()}`
                                            }
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                callback: (value) => `KES ${(value / 1000)}K`
                                            }
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={5}>
                    <Paper sx={{ p: 2, height: '250px', backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#2c3e50', mb: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Customer Status
                        </Typography>
                        <Box sx={{ height: '180px', display: 'flex', justifyContent: 'center' }}>
                            <Doughnut
                                data={customerStatusData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                font: { size: 10, family: 'Century Gothic' },
                                                padding: 15
                                            }
                                        }
                                    },
                                    cutout: '60%'
                                }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '18px', fontWeight: 800, color: '#2c3e50' }}>
                                    {officerDetails?.customers?.totalAssigned || 2}
                                </Typography>
                                <Typography sx={{ fontSize: '10px', color: '#666' }}>
                                    Total Customers
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '18px', fontWeight: 800, color: '#27ae60' }}>
                                    {officerDetails?.customers?.active || 1}
                                </Typography>
                                <Typography sx={{ fontSize: '10px', color: '#666' }}>
                                    Active
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '18px', fontWeight: 800, color: '#e74c3c' }}>
                                    {officerDetails?.customers?.overdue || 1}
                                </Typography>
                                <Typography sx={{ fontSize: '10px', color: '#666' }}>
                                    Overdue
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Charts Row 2 */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                    <Paper sx={{ p: 2, height: '200px', backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#2c3e50', mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Daily Call Activity
                        </Typography>
                        <Box sx={{ height: '150px' }}>
                            <Line
                                data={weeklyCallData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: { enabled: true }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            max: 20
                                        }
                                    }
                                }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography sx={{ fontSize: '10px', color: '#666' }}>
                                Today's Calls: <span style={{ fontWeight: 700, color: '#2c3e50' }}>{officerDetails?.calls?.today || 8}</span>
                            </Typography>
                            <Typography sx={{ fontSize: '10px', color: '#666' }}>
                                Weekly Total: <span style={{ fontWeight: 700, color: '#2c3e50' }}>{officerDetails?.calls?.weekly || 32}</span>
                            </Typography>
                            <Typography sx={{ fontSize: '10px', color: '#e74c3c' }}>
                                Target: 15/day
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={6}>
                    <Paper sx={{ p: 2, height: '200px', backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#2c3e50', mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Collection Trend (Last 7 Days)
                        </Typography>
                        <Box sx={{ height: '150px' }}>
                            <Line
                                data={collectionTrendData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: (context) => `KES ${context.raw.toLocaleString()}`
                                            }
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                callback: (value) => `KES ${(value / 1000)}K`
                                            }
                                        }
                                    }
                                }}
                            />
                        </Box>
                        <Typography sx={{ fontSize: '10px', color: '#666', textAlign: 'center', mt: 1 }}>
                            Average: {formatCompactAmount(5600)} per day
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Key Metrics Grid */}
            <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={3}>
                    <Box sx={{ p: 1.5, backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <Typography sx={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Assigned Customers</Typography>
                        <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#2c3e50' }}>{officerDetails?.customers?.totalAssigned || 2}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={3}>
                    <Box sx={{ p: 1.5, backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <Typography sx={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Completed Assignments</Typography>
                        <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#2c3e50' }}>{officerDetails?.assignments?.completed || 3}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={3}>
                    <Box sx={{ p: 1.5, backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <Typography sx={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Avg Call Duration</Typography>
                        <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#2c3e50' }}>4:32</Typography>
                    </Box>
                </Grid>
                <Grid item xs={3}>
                    <Box sx={{ p: 1.5, backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <Typography sx={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Pending Collections</Typography>
                        <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#2c3e50' }}>{officerDetails?.assignments?.pending || 0}</Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Footer */}
            <Box sx={{
                position: 'absolute',
                bottom: 30,
                left: 30,
                right: 30,
                borderTop: '1px solid #e0e0e0',
                pt: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box sx={{ display: 'flex', gap: 3 }}>
                    <Typography sx={{ fontSize: '10px', color: '#666' }}>
                        Generated by: <span style={{ fontWeight: 700, color: '#2c3e50' }}>{supervisorName}</span>
                    </Typography>
                    <Typography sx={{ fontSize: '10px', color: '#666' }}>
                        Role: <span style={{ fontWeight: 700, color: '#2c3e50' }}>Collections Supervisor</span>
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '10px', color: '#666' }}>
                        Report ID: <span style={{ fontWeight: 700, color: '#2c3e50' }}>VIS-{currentDate.getTime().toString().slice(-8)}</span>
                    </Typography>
                    <Typography sx={{ fontSize: '10px', color: '#666' }}>
                        {format(currentDate, 'MMMM do, yyyy • HH:mm:ss')} (EAT)
                    </Typography>
                </Box>
            </Box>

            {/* Watermark */}
            <Typography sx={{
                position: 'absolute',
                top: '45%',
                left: '25%',
                fontSize: '60px',
                fontWeight: 900,
                color: 'rgba(44, 62, 80, 0.03)',
                transform: 'rotate(-45deg)',
                textTransform: 'uppercase',
                pointerEvents: 'none',
                zIndex: 0
            }}>
                CONFIDENTIAL
            </Typography>
        </Box>
    );
};

export default OfficerChartReport;