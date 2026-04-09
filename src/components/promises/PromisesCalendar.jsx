// src/components/promises/PromisesCalendar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Badge,
  Button,
  Card,
  CardContent,
  Divider,
  Paper
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  CalendarToday,
  AccessTime
} from '@mui/icons-material';
import '../styles/promises-calendar.css';

const PromisesCalendar = ({ promises = [], userRole = 'officer', isSupervisor = false, isAdmin = false }) => {
  const navigate = useNavigate();
  const [calendarWeek, setCalendarWeek] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1 + (calendarWeek * 7));

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getPromisesForDate = (date) => {
    return promises.filter((promise) => {
      const promiseDate = new Date(promise.promiseDate);
      return (
        promiseDate.getDate() === date.getDate() &&
        promiseDate.getMonth() === date.getMonth() &&
        promiseDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getPromisesForSelectedDate = () => {
    if (!selectedDate) return [];
    return getPromisesForDate(selectedDate);
  };

  const getRoleColor = () => {
    if (isAdmin) return '#9333ea';
    if (isSupervisor) return '#0ea5e9';
    return '#5c4730';
  };

  const getRoleAccent = () => {
    if (isAdmin) return 'admin-promise-calendar';
    if (isSupervisor) return 'supervisor-promise-calendar';
    return 'officer-promise-calendar';
  };

  const handlePromiseClick = (promise) => {
    const customerId = promise.customerId?._id || promise.customerId;
    // Navigate to the customer details page with promises tab
    navigate(`/customers/${customerId}?activeTab=promises`);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  const weekDates = getWeekDates();
  const monday = weekDates[0];
  const sunday = weekDates[6];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <Paper elevation={0} className={`promises-calendar-container ${getRoleAccent()}`}>
      {/* Calendar Header with Navigation */}
      <Box className="promises-calendar-header">
        <Box className="promises-calendar-nav">
          <Button
            size="small"
            onClick={() => setCalendarWeek((prev) => prev - 1)}
            className="promises-calendar-nav-btn"
            sx={{ color: getRoleColor() }}
          >
            <ChevronLeft sx={{ fontSize: 16 }} />
          </Button>
          <Typography className="promises-calendar-week-range">
            {monday.getDate()} - {sunday.getDate()} {monthNames[monday.getMonth()]}
          </Typography>
          <Button
            size="small"
            onClick={() => setCalendarWeek((prev) => prev + 1)}
            className="promises-calendar-nav-btn"
            sx={{ color: getRoleColor() }}
          >
            <ChevronRight sx={{ fontSize: 16 }} />
          </Button>
        </Box>
      </Box>

      {/* Calendar Grid */}
      <Box className="promises-calendar-grid">
        {/* Day Headers */}
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <div key={`header-${index}`} className="promises-calendar-day-header">
            {day}
          </div>
        ))}

        {/* Day Cells */}
        {weekDates.map((date, index) => {
          const dayPromises = getPromisesForDate(date);
          const isSelected = selectedDate && selectedDate.getTime() === date.getTime();

          return (
            <div
              key={index}
              className={`promises-calendar-day ${isToday(date) ? 'today' : ''} ${
                isSelected ? 'selected' : ''
              }`}
              onClick={() => setSelectedDate(date)}
              style={{
                borderColor: isSelected ? getRoleColor() : undefined,
                backgroundColor: isToday(date) ? `${getRoleColor()}15` : undefined
              }}
            >
              <div className="promises-calendar-date-number">{date.getDate()}</div>
              {dayPromises.length > 0 && (
                <Badge
                  badgeContent={dayPromises.length}
                  color="error"
                  className="promise-count-badge"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.5rem',
                      padding: '0 3px',
                      height: '12px',
                      minWidth: '12px',
                      borderRadius: '6px',
                      backgroundColor:
                        dayPromises.length > 3
                          ? '#ef4444'
                          : dayPromises.length > 1
                          ? '#f59e0b'
                          : '#10b981'
                    }
                  }}
                />
              )}
            </div>
          );
        })}
      </Box>

      <Divider sx={{ my: 0.75, backgroundColor: `${getRoleColor()}20` }} />

      {/* Selected Date Promises */}
      {selectedDate && (
        <Box className="promises-calendar-selected-date">
          <Box className="promises-calendar-selected-header">
            <Today sx={{ fontSize: 14, color: getRoleColor(), marginRight: '0.35rem' }} />
            <Typography className="promises-calendar-selected-date-text">
              {formatDate(selectedDate)}
            </Typography>
          </Box>

          {getPromisesForSelectedDate().length === 0 ? (
            <Box className="promises-calendar-no-data">
              <Typography sx={{ color: '#999', fontSize: '0.7rem' }}>
                No promises due on this date
              </Typography>
            </Box>
          ) : (
            <Box className="promises-calendar-promises-list">
              {getPromisesForSelectedDate().map((promise) => (
                <Card
                  key={promise._id}
                  className="promises-calendar-promise-item"
                  onClick={() => handlePromiseClick(promise)}
                  sx={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                >
                  <CardContent sx={{ padding: '0.5rem', '&:last-child': { paddingBottom: '0.5rem' } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography className="promises-calendar-promise-customer" sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#2c3e50' }}>
                          {promise.customerId?.name || promise.customerName || 'Unknown'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: '#666', marginTop: '0.15rem' }}>
                          {promise.customerId?.phone || promise.phoneNumber || 'N/A'}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 700, color: getRoleColor(), fontSize: '0.7rem' }}>
                        {formatCurrency(promise.promiseAmount)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      <Divider sx={{ my: 0.75, backgroundColor: `${getRoleColor()}20` }} />

      {/* Next 7 Days Upcoming */}
      <Box className="promises-calendar-upcoming">
        <Typography className="promises-calendar-upcoming-title" sx={{ fontWeight: 600, fontSize: '0.7rem', color: getRoleColor(), marginBottom: '0.6rem' }}>
          <AccessTime sx={{ fontSize: 12, marginRight: '0.35rem', verticalAlign: 'middle' }} />
          Next 7 Days
        </Typography>

        {(() => {
          const today = new Date();
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);

          const upcoming = promises
            .filter((promise) => {
              const promiseDate = new Date(promise.promiseDate);
              return promiseDate >= today && promiseDate <= nextWeek;
            })
            .sort((a, b) => new Date(a.promiseDate) - new Date(b.promiseDate))
            .slice(0, 10);

          return upcoming.length === 0 ? (
            <Box sx={{ textAlign: 'center', padding: '0.6rem 0', color: '#999' }}>
              <Typography sx={{ fontSize: '0.7rem' }}>No upcoming promises this week</Typography>
            </Box>
          ) : (
            <Box className="promises-calendar-upcoming-list">
              {upcoming.map((promise) => (
                <Card
                  key={promise._id}
                  className="promises-calendar-upcoming-item"
                  onClick={() => handlePromiseClick(promise)}
                  sx={{ cursor: 'pointer', transition: 'all 0.2s ease', marginBottom: '0.4rem' }}
                >
                  <CardContent sx={{ padding: '0.5rem', '&:last-child': { paddingBottom: '0.5rem' }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', color: '#999', marginBottom: '0.15rem' }}>
                        {new Date(promise.promiseDate).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#2c3e50' }}>
                        {promise.customerId?.name || promise.customerName || 'Unknown'}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: getRoleColor(), fontSize: '0.7rem' }}>
                      {formatCurrency(promise.promiseAmount)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          );
        })()}
      </Box>
    </Paper>
  );
};

export default PromisesCalendar;
