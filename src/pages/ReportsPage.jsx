// src/pages/ReportsPage.jsx - WITH PROPER SPACING
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  Refresh,
  Download,
  Assessment,
  TrendingUp,
  TrendingDown,
  People,
  AttachMoney,
  ShowChart,
  Analytics,
  Timer,
  Schedule,
  Bolt,
  WorkspacePremium,
  MoreVert,
  ArrowForward,
  Star,
  EmojiEvents,
  MilitaryTech,
  Leaderboard,
  Timeline
} from '@mui/icons-material';
import axios from 'axios';
import authService from '../services/auth.service';
import LayoutWrapper from '../LayoutWrapper';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [performanceData, setPerformanceData] = useState({
    agents: [],
    summary: {
      totalCollections: 0,
      successRate: 0,
      activeAgents: 0,
      avgEfficiency: 0,
      totalPromises: 0,
      fulfilledPromises: 0,
      promiseRate: 0
    }
  });

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

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data - same as before
      const mockAgents = [
        {
          _id: '1',
          officerName: 'John Doe',
          department: 'Collections',
          role: 'agent',
          email: 'john.doe@company.com',
          performanceMetrics: {
            totalCollections: 1250000,
            totalTransactions: 128,
            successfulTransactions: 120,
            failedTransactions: 8,
            successRate: 93.8,
            avgTransactionAmount: 10416,
            performanceScore: 87.5,
            efficiencyRating: 8.7,
            dailyAverage: 41666,
            monthlyTarget: 1000000,
            dailyTarget: 50000,
            targetAchievement: 125
          },
          activityMetrics: {
            currentStreak: 14,
            longestStreak: 21,
            avgResponseTime: 24,
            avgTransactionTime: 45,
            loginCount: 42
          },
          promiseMetrics: {
            totalPromises: 45,
            fulfilledPromises: 38,
            pendingPromises: 5,
            brokenPromises: 2,
            promiseFulfillmentRate: 84.4,
            totalPromiseAmount: 850000,
            fulfilledAmount: 720000
          },
          achievements: [
            { title: 'Week Warrior', description: '7-day streak', icon: '🔥', type: 'consistency' },
            { title: 'Millionaire Maker', description: 'Collected 1M+', icon: '💰', type: 'collection' }
          ],
          recentActivity: [
            { amount: 15000, status: 'SUCCESS', description: 'Loan repayment', customerName: 'James Mutua', timestamp: new Date(Date.now() - 3600000) },
            { amount: 25000, status: 'SUCCESS', description: 'Monthly installment', customerName: 'Mary Wanjiku', timestamp: new Date(Date.now() - 7200000) }
          ]
        },
        // ... rest of mock data (same as before)
      ];

      // Calculate summary
      const totalCollections = mockAgents.reduce((sum, agent) => sum + agent.performanceMetrics.totalCollections, 0);
      const totalTransactions = mockAgents.reduce((sum, agent) => sum + agent.performanceMetrics.totalTransactions, 0);
      const successfulTransactions = mockAgents.reduce((sum, agent) => sum + agent.performanceMetrics.successfulTransactions, 0);
      const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
      const avgEfficiency = mockAgents.reduce((sum, agent) => sum + agent.performanceMetrics.efficiencyRating, 0) / mockAgents.length;
      const totalPromises = mockAgents.reduce((sum, agent) => sum + agent.promiseMetrics.totalPromises, 0);
      const fulfilledPromises = mockAgents.reduce((sum, agent) => sum + agent.promiseMetrics.fulfilledPromises, 0);
      const promiseRate = totalPromises > 0 ? (fulfilledPromises / totalPromises) * 100 : 0;

      setPerformanceData({
        agents: mockAgents,
        summary: {
          totalCollections,
          successRate,
          activeAgents: mockAgents.length,
          avgEfficiency,
          totalPromises,
          fulfilledPromises,
          promiseRate
        }
      });

      setSuccess('Performance data loaded successfully');

    } catch (err) {
      console.error("Reports error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load performance data");
      
      if (err.response?.status === 401) {
        authService.logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return `KES ${numAmount.toLocaleString()}`;
  };

  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <LayoutWrapper title="Reports">
        <Box className="dashboard-wrapper" sx={{ textAlign: "center", mt: 6 }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#5c4730' }}>
            Loading reports data...
          </Typography>
        </Box>
      </LayoutWrapper>
    );
  }

  if (error) {
    return (
      <LayoutWrapper title="Reports">
        <Box className="dashboard-wrapper" sx={{ textAlign: "center", mt: 6 }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#c0392b', mb: 2 }}>
            {error}
          </Typography>
          <Button 
            onClick={fetchReportsData} 
            sx={{ 
              mt: 2,
              background: '#5c4730',
              color: 'white',
              fontWeight: 600,
              '&:hover': { background: '#3c2a1c' }
            }}
          >
            Retry
          </Button>
        </Box>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <Box className="dashboard-wrapper">
        {/* Header - EXACTLY LIKE DASHBOARD */}
        <Box className="dashboard-header">
          <Box className="header-content">
            <Box>
              <Typography className="dashboard-title">
                Reports & Analytics
              </Typography>
              <Typography className="dashboard-subtitle">
                Performance metrics and productivity insights
              </Typography>
            </Box>
            <button 
              className="minimal-refresh-btn" 
              onClick={fetchReportsData}
              disabled={loading}
            >
              <Refresh sx={{ fontSize: 18 }} />
              Refresh
            </button>
          </Box>
        </Box>

        {/* Minimal Stats Grid - EXACTLY LIKE DASHBOARD */}
        <div className="minimal-stats-grid">
          <div className="minimal-stat-card">
            <div className="stat-header">
              <div className="stat-label">Total Collections</div>
              <div className="stat-icon-wrapper">
                <AttachMoney />
              </div>
            </div>
            <div>
              <div className="stat-value">
                {formatCurrency(performanceData.summary.totalCollections)}
              </div>
            </div>
          </div>

          <div className="minimal-stat-card">
            <div className="stat-header">
              <div className="stat-label">Success Rate</div>
              <div className="stat-icon-wrapper">
                <ShowChart />
              </div>
            </div>
            <div>
              <div className="stat-value" style={{ color: performanceData.summary.successRate >= 90 ? '#2ecc71' : '#f39c12' }}>
                {formatPercentage(performanceData.summary.successRate)}
              </div>
            </div>
          </div>

          <div className="minimal-stat-card">
            <div className="stat-header">
              <div className="stat-label">Active Agents</div>
              <div className="stat-icon-wrapper">
                <People />
              </div>
            </div>
            <div>
              <div className="stat-value">
                {performanceData.summary.activeAgents}
              </div>
            </div>
          </div>

          <div className="minimal-stat-card">
            <div className="stat-header">
              <div className="stat-label">Avg Efficiency</div>
              <div className="stat-icon-wrapper">
                <Analytics />
              </div>
            </div>
            <div>
              <div className="stat-value">
                {performanceData.summary.avgEfficiency.toFixed(1)}/10
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - 65%/35% HORIZONTAL LAYOUT LIKE DASHBOARD */}
        <Box className="dashboard-main-content">
          {/* Performance Analytics Section - 65% width */}
          <Box className="recent-customers-section">
            <div className="recent-customers-card">
              <div className="section-header">
                <Typography className="section-title">
                  Agent Performance
                </Typography>
                <button 
                  className="view-all-btn"
                  onClick={() => navigate('/agent-performance')}
                >
                  View All
                </button>
              </div>
              
              <div className="customers-list">
                {performanceData.agents.length === 0 ? (
                  <div className="customers-empty-state">
                    <div className="empty-icon">📊</div>
                    <Typography className="empty-title">
                      No Performance Data
                    </Typography>
                    <Typography className="empty-subtitle">
                      Agent performance data will appear here
                    </Typography>
                  </div>
                ) : (
                  performanceData.agents.map((agent) => (
                    <div 
                      key={agent._id} 
                      className="customer-row"
                      onClick={() => navigate(`/agent-performance/${agent._id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="customer-info">
                        <Typography className="customer-name">
                          {agent.officerName}
                        </Typography>
                        <Typography className="customer-phone">
                          {agent.email}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Star sx={{ fontSize: 12, color: '#f39c12' }} />
                          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.625rem' }}>
                            {agent.performanceMetrics.efficiencyRating.toFixed(1)} rating
                          </Typography>
                        </Box>
                      </div>
                      <div className="arrears-info">
                        <Typography className="arrears-amount">
                          {formatCurrency(agent.performanceMetrics.totalCollections)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography className="arrears-label" style={{ 
                            color: agent.performanceMetrics.successRate >= 90 ? '#2ecc71' : 
                                  agent.performanceMetrics.successRate >= 80 ? '#f39c12' : '#e74c3c'
                          }}>
                            {formatPercentage(agent.performanceMetrics.successRate)}
                          </Typography>
                          <ArrowForward sx={{ fontSize: 14, color: '#5c4730' }} />
                        </Box>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Box>

          {/* Quick Metrics Section - 35% width */}
          <Box className="quick-actions-section">
            <div className="quick-actions-card">
              <div className="section-header">
                <Typography className="section-title">
                  Quick Metrics
                </Typography>
              </div>
              
              <div className="quick-actions-grid">
                <a
                  className="quick-action-item"
                  onClick={() => console.log('View detailed analytics')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    <Timer />
                  </div>
                  <div>
                    <Typography className="action-label">
                      2.4 hrs
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.625rem', display: 'block' }}>
                      Avg. Payment Time
                    </Typography>
                  </div>
                </a>

                <a
                  className="quick-action-item"
                  onClick={() => console.log('View peak hours')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    <Schedule />
                  </div>
                  <div>
                    <Typography className="action-label">
                      2:00 PM
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.625rem', display: 'block' }}>
                      Peak Collection Hour
                    </Typography>
                  </div>
                </a>

                <a
                  className="quick-action-item"
                  onClick={() => console.log('View efficiency')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    <Bolt />
                  </div>
                  <div>
                    <Typography className="action-label">
                      87.5%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.625rem', display: 'block' }}>
                      Agent Efficiency
                    </Typography>
                  </div>
                </a>

                <a
                  className="quick-action-item"
                  onClick={() => console.log('View productivity')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="action-icon">
                    <WorkspacePremium />
                  </div>
                  <div>
                    <Typography className="action-label">
                      94.5%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.625rem', display: 'block' }}>
                      Team Productivity
                    </Typography>
                  </div>
                </a>
              </div>

              {/* Generate Report Button */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(92, 71, 48, 0.1)' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Assessment />}
                  onClick={() => console.log('Generate report')}
                  sx={{ 
                    borderColor: '#5c4730',
                    color: '#5c4730',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '8px',
                    '&:hover': {
                      bgcolor: 'rgba(92, 71, 48, 0.1)',
                      borderColor: '#3c2a1c'
                    }
                  }}
                >
                  Generate Report
                </Button>
              </Box>
            </div>
          </Box>
        </Box>

        {/* Notifications */}
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar 
          open={!!success} 
          autoHideDuration={3000} 
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </LayoutWrapper>
  );
};

export default ReportsPage;