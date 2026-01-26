import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  IconButton,
  Typography
} from '@mui/material';
import {
  Event,
  Today,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import axios from 'axios';
import authService from '../../services/auth.service';

const RightSidebar = ({ onToggle }) => {
  const navigate = useNavigate();
  const [upcomingPromises, setUpcomingPromises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarWeek, setCalendarWeek] = useState(0);
  const [collapsed, setCollapsed] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Ref for the sidebar
  const sidebarRef = useRef(null);
  
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

  const fetchPromises = async () => {
    try {
      setLoading(true);
      const api = getApi();
      const response = await api.get("/promises?status=PENDING&limit=50&sortBy=promiseDate&sortOrder=asc");

      if (response.data.success) {
        setUpcomingPromises(response.data.data.promises || []);
      }
    } catch (err) {
      console.error("Error fetching promises:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromises();
  }, []);

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If sidebar is expanded and click is outside, collapse it
      if (!collapsed && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target)) {
        toggleSidebar();
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [collapsed]);

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
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getUpcomingPromisesCount = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return upcomingPromises.filter(promise => {
      const promiseDate = new Date(promise.promiseDate);
      return promiseDate >= today && promiseDate <= nextWeek;
    }).slice(0, 10).length;
  };

  const toggleSidebar = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    
    // Notify parent component about the toggle
    if (onToggle) {
      onToggle(newCollapsedState);
    }
  };

  return (
    <>
      <div 
        className={`right-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}
        ref={sidebarRef}
      >
        {/* When collapsed - show minimal toggle button - ENTIRE AREA CLICKABLE */}
        {collapsed ? (
          <div
            className="right-sidebar-collapsed-content"
            onClick={toggleSidebar}
          >
            <div className="collapsed-icon">
              <Event sx={{ fontSize: 20, color: 'white' }} />
              <Badge
                badgeContent={getUpcomingPromisesCount()}
                color="error"
                sx={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  '& .MuiBadge-badge': {
                    fontSize: '0.5rem',
                    height: '14px',
                    minWidth: '14px',
                    borderRadius: '7px',
                    transform: 'translate(50%, -50%)'
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* When expanded - show full content */}
            <div className="right-sidebar-header">
              <div className="right-sidebar-title">
                <Event sx={{ fontSize: 16, marginRight: '0.5rem' }} />
                Upcoming Promises
              </div>
              <IconButton
                className="right-sidebar-toggle"
                onClick={toggleSidebar}
                size="small"
              >
                <ChevronRight />
              </IconButton>
            </div>

            <div className="right-sidebar-content">
              {/* Calendar Section */}
              <div className="calendar-section">
                <div className="calendar-header">
                  <button
                    className="calendar-nav-btn"
                    onClick={() => setCalendarWeek(prev => prev - 1)}
                  >
                    &lt;
                  </button>
                  <div className="calendar-title">
                    {(() => {
                      const now = new Date();
                      const monday = new Date(now);
                      monday.setDate(now.getDate() - now.getDay() + 1 + (calendarWeek * 7));
                      const sunday = new Date(monday);
                      sunday.setDate(monday.getDate() + 6);

                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const month = monthNames[monday.getMonth()];

                      return `${monday.getDate()} - ${sunday.getDate()} ${month}`;
                    })()}
                  </div>
                  <button
                    className="calendar-nav-btn"
                    onClick={() => setCalendarWeek(prev => prev + 1)}
                  >
                    &gt;
                  </button>
                </div>

                <div className="calendar-grid-promises">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                    <div key={index} className="calendar-day-header-promises">
                      {day}
                    </div>
                  ))}

                  {getWeekDates().map((date, index) => {
                    const promiseCount = upcomingPromises.filter(promise => {
                      const promiseDate = new Date(promise.promiseDate);
                      return promiseDate.getDate() === date.getDate() &&
                        promiseDate.getMonth() === date.getMonth() &&
                        promiseDate.getFullYear() === date.getFullYear();
                    }).length;

                    return (
                      <div
                        key={index}
                        className={`calendar-day-promises ${isToday(date) ? 'today' : ''} ${selectedDate && selectedDate.getTime() === date.getTime() ? 'selected' : ''}`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="calendar-date-number">
                          {date.getDate()}
                        </div>
                        {promiseCount > 0 && (
                          <Badge
                            badgeContent={promiseCount}
                            color="error"
                            className="promise-count-badge"
                            sx={{
                              position: 'absolute',
                              top: -3,
                              right: -3,
                              '& .MuiBadge-badge': {
                                fontSize: '0.5rem',
                                height: '14px',
                                minWidth: '14px',
                                borderRadius: '7px',
                                backgroundColor: promiseCount > 3 ? '#ef4444' :
                                  promiseCount > 1 ? '#f59e0b' : '#10b981'
                              }
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Date Promises */}
              {selectedDate && (
                <div className="selected-date-promises">
                  <div className="selected-date-header">
                    <Today sx={{ fontSize: 14, marginRight: '0.5rem' }} />
                    <Typography className="selected-date-title">
                      {selectedDate.toLocaleDateString('en-KE', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                    <span className="selected-date-count">
                      {upcomingPromises.filter(promise => {
                        const promiseDate = new Date(promise.promiseDate);
                        return promiseDate.getDate() === selectedDate.getDate() &&
                          promiseDate.getMonth() === selectedDate.getMonth() &&
                          promiseDate.getFullYear() === selectedDate.getFullYear();
                      }).length} promises
                    </span>
                  </div>

                  <div className="date-promises-list">
                    {upcomingPromises.filter(promise => {
                      const promiseDate = new Date(promise.promiseDate);
                      return promiseDate.getDate() === selectedDate.getDate() &&
                        promiseDate.getMonth() === selectedDate.getMonth() &&
                        promiseDate.getFullYear() === selectedDate.getFullYear();
                    }).length === 0 ? (
                      <div className="no-promises-for-date">
                        No promises due on this date
                      </div>
                    ) : (
                      upcomingPromises.filter(promise => {
                        const promiseDate = new Date(promise.promiseDate);
                        return promiseDate.getDate() === selectedDate.getDate() &&
                          promiseDate.getMonth() === selectedDate.getMonth() &&
                          promiseDate.getFullYear() === selectedDate.getFullYear();
                      }).slice(0, 5).map(promise => (
                        <div
                          key={promise._id}
                          className="date-promise-item"
                          onClick={() => navigate(`/customers/${promise.customerId?._id || promise.customerId}`)}
                        >
                          <div className="date-promise-info">
                            <div className="date-promise-customer">
                              {promise.customerId?.name || promise.customerName || 'Unknown Customer'}
                            </div>
                            <div className="date-promise-amount">
                              KES {Number(promise.promiseAmount || 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="date-promise-time">
                            Due: {new Date(promise.promiseDate).toLocaleTimeString('en-KE', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Upcoming Promises List */}
              <div className="upcoming-promises-sidebar">
                <div className="upcoming-promises-header">
                  <Typography className="upcoming-promises-title">
                    Next 7 Days
                  </Typography>
                  <button
                    className="view-all-promises-btn"
                    onClick={() => navigate('/promises')}
                  >
                    View All
                  </button>
                </div>

                <div className="upcoming-promises-list-sidebar">
                  {(() => {
                    const today = new Date();
                    const nextWeek = new Date(today);
                    nextWeek.setDate(today.getDate() + 7);

                    const upcoming = upcomingPromises.filter(promise => {
                      const promiseDate = new Date(promise.promiseDate);
                      return promiseDate >= today && promiseDate <= nextWeek;
                    }).slice(0, 10);

                    return upcoming.length === 0 ? (
                      <div className="no-upcoming-promises-sidebar">
                        <div className="no-promises-icon">📅</div>
                        <Typography className="no-promises-text">
                          No upcoming promises
                        </Typography>
                      </div>
                    ) : (
                      upcoming.map(promise => (
                        <div
                          key={promise._id}
                          className="upcoming-promise-item-sidebar"
                          onClick={() => navigate(`/customers/${promise.customerId?._id || promise.customerId}`)}
                        >
                          <div className="upcoming-promise-date-sidebar">
                            {new Date(promise.promiseDate).toLocaleDateString('en-KE', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="upcoming-promise-info-sidebar">
                            <div className="upcoming-promise-customer-sidebar">
                              {promise.customerId?.name || promise.customerName || 'Unknown Customer'}
                            </div>
                            <div className="upcoming-promise-amount-sidebar">
                              KES {Number(promise.promiseAmount || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    );
                  })()}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default RightSidebar;