// src/pages/AgentPerformancePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Share,
  Print,
  Email,
  Timeline,
  BarChart,
  PieChart,
  ShowChart,
  AttachMoney,
  People,
  TrendingUp,
  TrendingDown,
  Star,
  Bolt,
  WorkspacePremium,
  Schedule,
  Timer,
  DoneAll,
  Pending,
  Cancel,
  AccessTime,
  EmojiEvents,
  LocalAtm,
  Receipt,
  CalendarToday,
  TrendingFlat,
  Speed,
  Grade,
  MilitaryTech
} from '@mui/icons-material';
import axios from 'axios';
import LayoutWrapper from '../LayoutWrapper';

const AgentPerformancePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    fetchAgentData();
  }, [id, timeframe]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/reports/agent-performance/${id}?timeframe=${timeframe}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setAgent(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
      // For demo purposes, create sample data
      setAgent({
        _id: id,
        username: 'john.doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'agent',
        department: 'Collections',
        performanceMetrics: {
          totalCollections: 1250000,
          totalTransactions: 128,
          successfulTransactions: 120,
          failedTransactions: 8,
          successRate: 93.8,
          avgTransactionAmount: 10416,
          dailyAverage: 41666,
          monthlyTarget: 1000000,
          dailyTarget: 50000,
          targetAchievement: 125,
          efficiencyRating: 8.7,
          performanceScore: 87.5
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
          { title: 'Millionaire Maker', description: 'Collected 1M+', icon: '💰', type: 'collection' },
          { title: 'Efficiency Expert', description: '9+ rating', icon: '⚡', type: 'efficiency' }
        ],
        recentActivity: [
          { amount: 15000, status: 'SUCCESS', description: 'Loan repayment', customerName: 'James Mutua', timestamp: new Date(Date.now() - 3600000) },
          { amount: 25000, status: 'SUCCESS', description: 'Monthly installment', customerName: 'Mary Wanjiku', timestamp: new Date(Date.now() - 7200000) },
          { amount: 12000, status: 'FAILED', description: 'Payment failed', customerName: 'Robert Omondi', timestamp: new Date(Date.now() - 10800000) }
        ],
        dailyActivity: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 86400000),
          transactions: Math.floor(Math.random() * 10) + 5,
          amountCollected: Math.floor(Math.random() * 50000) + 20000,
          promisesCreated: Math.floor(Math.random() * 3),
          promisesFulfilled: Math.floor(Math.random() * 2)
        }))
      });
    } finally {
      setLoading(false);
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

  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(1)}%`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </LayoutWrapper>
    );
  }

  if (!agent) {
    return (
      <LayoutWrapper>
        <Box sx={{ p: 3 }}>
          <Typography>Agent not found</Typography>
        </Box>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #5c4730 0%, #3c2a1c 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={() => navigate('/reports')} sx={{ color: 'white' }}>
                <ArrowBack />
              </IconButton>
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'white', color: '#5c4730', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {agent.firstName?.charAt(0) || agent.username?.charAt(0) || 'A'}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {agent.firstName && agent.lastName ? `${agent.firstName} ${agent.lastName}` : agent.username}
                </Typography>
                <Typography variant="subtitle1">
                  {agent.department || 'Collections'} • {agent.role || 'Agent'}
                </Typography>
                <Typography variant="body2">
                  {agent.email}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Export">
                <IconButton sx={{ color: 'white' }}>
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton sx={{ color: 'white' }}>
                  <Share />
                </IconButton>
              </Tooltip>
              <Tooltip title="Print">
                <IconButton sx={{ color: 'white' }}>
                  <Print />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* Performance Score Card */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                <CircularProgress 
                  variant="determinate" 
                  value={agent.performanceMetrics?.performanceScore || 0}
                  size={120}
                  thickness={4}
                  sx={{ color: '#5c4730' }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" component="div" sx={{ fontWeight: 800 }}>
                    {Math.round(agent.performanceMetrics?.performanceScore || 0)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Performance Score
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Overall rating
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Grade sx={{ color: '#f39c12', fontSize: 16 }} />
                <Typography variant="body2">
                  {agent.performanceMetrics?.efficiencyRating?.toFixed(1) || '0.0'} Efficiency
                </Typography>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocalAtm sx={{ color: '#5c4730' }} />
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {formatCurrency(agent.performanceMetrics?.totalCollections || 0)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Collections
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#2ecc71', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TrendingUp fontSize="small" />
                      +12.5% this month
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Receipt sx={{ color: '#5c4730' }} />
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {agent.performanceMetrics?.totalTransactions || 0}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Transactions
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#2ecc71', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TrendingUp fontSize="small" />
                      {agent.performanceMetrics?.successRate?.toFixed(1) || '0'}% success
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <DoneAll sx={{ color: '#5c4730' }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#2ecc71' }}>
                        {formatPercentage(agent.performanceMetrics?.successRate || 0)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Success Rate
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Speed fontSize="small" />
                      {agent.promiseMetrics?.promiseFulfillmentRate?.toFixed(1) || '0'}% promises kept
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarToday sx={{ color: '#5c4730' }} />
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {agent.activityMetrics?.currentStreak || 0} days
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Current Streak
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MilitaryTech fontSize="small" />
                      Best: {agent.activityMetrics?.longestStreak || 0} days
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, value) => setTabValue(value)}>
            <Tab label="Overview" icon={<Timeline />} />
            <Tab label="Transactions" icon={<BarChart />} />
            <Tab label="Promises" icon={<PieChart />} />
            <Tab label="Activity" icon={<ShowChart />} />
            <Tab label="Achievements" icon={<EmojiEvents />} />
          </Tabs>
        </Paper>

        {/* Content based on tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Daily Performance
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    {/* Chart placeholder */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: 1, p: 2 }}>
                      {agent.dailyActivity?.slice(0, 7).reverse().map((day, index) => (
                        <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: '100%',
                              height: `${Math.min((day.amountCollected / 100000) * 100, 100)}%`,
                              bgcolor: '#5c4730',
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.3s ease'
                            }}
                          />
                          <Typography variant="caption" sx={{ mt: 1 }}>
                            {new Date(day.date).toLocaleDateString('en-KE', { weekday: 'short' })}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(day.amountCollected)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {agent.recentActivity?.slice(0, 5).map((activity, index) => (
                      <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < 4 ? '1px solid rgba(0,0,0,0.1)' : 'none' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {activity.customerName}
                          </Typography>
                          <Chip
                            label={activity.status}
                            size="small"
                            sx={{
                              bgcolor: activity.status === 'SUCCESS' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                              color: activity.status === 'SUCCESS' ? '#2ecc71' : '#e74c3c',
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {activity.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {formatCurrency(activity.amount)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatTimeAgo(activity.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction History
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {agent.recentActivity?.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatTimeAgo(activity.timestamp)}</TableCell>
                        <TableCell>{activity.customerName}</TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>
                            {formatCurrency(activity.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={activity.status}
                            size="small"
                            sx={{
                              bgcolor: activity.status === 'SUCCESS' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                              color: activity.status === 'SUCCESS' ? '#2ecc71' : '#e74c3c'
                            }}
                          />
                        </TableCell>
                        <TableCell>{activity.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {tabValue === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Promise Performance
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <CircularProgress
                        variant="determinate"
                        value={agent.promiseMetrics?.promiseFulfillmentRate || 0}
                        size={120}
                        sx={{ color: '#5c4730', mb: 2 }}
                      />
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {formatPercentage(agent.promiseMetrics?.promiseFulfillmentRate || 0)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Promise Fulfillment Rate
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#2ecc71' }}>
                          {agent.promiseMetrics?.fulfilledPromises || 0}
                        </Typography>
                        <Typography variant="caption">Fulfilled</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#f39c12' }}>
                          {agent.promiseMetrics?.pendingPromises || 0}
                        </Typography>
                        <Typography variant="caption">Pending</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Promise Summary
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Total Promises:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {agent.promiseMetrics?.totalPromises || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Total Promise Amount:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(agent.promiseMetrics?.totalPromiseAmount || 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Fulfilled Amount:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#2ecc71' }}>
                        {formatCurrency(agent.promiseMetrics?.fulfilledAmount || 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Broken Promises:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#e74c3c' }}>
                        {agent.promiseMetrics?.brokenPromises || 0}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" color="textSecondary">
                      Last updated: {formatDate(new Date())}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tabValue === 4 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Achievements & Awards
              </Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {agent.achievements?.map((achievement, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '50%', 
                            bgcolor: 'rgba(92, 71, 48, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem'
                          }}>
                            {achievement.icon || '🏆'}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {achievement.title}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {achievement.description}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={achievement.type}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    </LayoutWrapper>
  );
};

export default AgentPerformancePage;