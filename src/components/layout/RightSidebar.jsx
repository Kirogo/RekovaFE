// src/components/layout/RightSidebar.jsx - COMPLETELY FIXED
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
  ChevronRight
} from '@mui/icons-material';
import authService from '../../services/auth.service';
import { authAxios } from '../../services/api';  // ✅ Use the configured axios instance
import '../../styles/rightsidebar.css';
import '../../styles/layout.css';

const RightSidebar = ({ onToggle }) => {
  const navigate = useNavigate();
  const [upcomingPromises, setUpcomingPromises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarWeek, setCalendarWeek] = useState(0);
  const [collapsed, setCollapsed] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Ref for the sidebar
  const sidebarRef = useRef(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setUserRole(user.role);
      setIsSupervisor(user.role === 'supervisor' || user.role === 'SUPERVISOR');
      setIsAdmin(user.role === 'admin' || user.role === 'ADMIN');
      console.log('RightSidebar - User role:', user.role);
    }
  }, []);

  const fetchPromises = async () => {
    try {
      setLoading(true);
      // Use a shorter timeout for this component since it's less critical
      const response = await authAxios.get("/promises?status=PENDING&limit=20&sortBy=promiseDate&sortOrder=asc", {
        timeout: 15000 // 15 seconds for promises
      });

      console.log('✅ Promises response:', response.data);

      if (response.data.success && response.data.data) {
        // Backend returns data as an array directly
        const promises = Array.isArray(response.data.data) 
          ? response.data.data 
          : response.data.data.promises || [];
        setUpcomingPromises(promises);
      }
    } catch (err) {
      console.error("Error fetching promises:", err);

      if (err.code === 'ECONNABORTED') {
        console.warn('⚠️ Promise fetch timed out - will retry on next mount');
        // Don't show error to user, just set empty array
        setUpcomingPromises([]);
      } else if (err.response?.status === 401) {
        console.warn('⚠️ Unauthorized - token may have expired');
        setUpcomingPromises([]);
      } else if (err.response?.status === 500) {
        console.error('❌ Server error fetching promises:', err.response.data);
        setUpcomingPromises([]);
      }
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
      if (!collapsed && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        toggleSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
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

    if (onToggle) {
      onToggle(newCollapsedState);
    }
  };

  // DEBUG: Log role states
  useEffect(() => {
    console.log('RightSidebar Role Debug:', {
      userRole,
      isSupervisor,
      isAdmin,
      collapsed,
      sidebarClass: getSidebarClass()
    });
  }, [userRole, isSupervisor, isAdmin, collapsed]);

  // Determine sidebar color class - FIXED LOGIC
  const getSidebarClass = () => {
    let baseClass = 'right-sidebar';
    if (collapsed) baseClass += ' collapsed';

    // Priority: Admin > Supervisor > Officer
    if (isAdmin) {
      baseClass += ' admin-right-sidebar';
      console.log('Applying admin-right-sidebar class');
    } else if (isSupervisor) {
      baseClass += ' supervisor-right-sidebar';
      console.log('Applying supervisor-right-sidebar class');
    } else {
      console.log('Applying officer (default) styling');
    }

    return baseClass;
  };

  // Get role-based classes with fallback to officer
  const getRoleBasedClass = (type) => {
    if (isAdmin) {
      switch (type) {
        case 'collapsed-content': return 'admin-collapsed-content';
        case 'collapsed-icon': return 'admin-collapsed-icon';
        case 'header': return 'admin-right-sidebar-header';
        case 'title': return 'admin-right-sidebar-title';
        case 'toggle': return 'admin-right-sidebar-toggle';
        case 'calendar-section': return 'admin-calendar-section';
        case 'calendar-nav-btn': return 'admin-calendar-nav-btn';
        case 'calendar-title': return 'admin-calendar-title';
        case 'calendar-day-header': return 'admin-calendar-day-header';
        case 'calendar-day': return 'admin-calendar-day';
        case 'calendar-date-number': return 'admin-calendar-date-number';
        case 'selected-date': return 'admin-selected-date';
        case 'selected-date-title': return 'admin-selected-date-title';
        case 'selected-date-count': return 'admin-selected-date-count';
        case 'no-promises': return 'admin-no-promises';
        case 'date-promise-item': return 'admin-date-promise-item';
        case 'date-promise-customer': return 'admin-date-promise-customer';
        case 'date-promise-amount': return 'admin-date-promise-amount';
        case 'date-promise-time': return 'admin-date-promise-time';
        case 'upcoming-promises': return 'admin-upcoming-promises';
        case 'upcoming-promises-title': return 'admin-upcoming-promises-title';
        case 'view-all-btn': return 'admin-view-all-btn';
        case 'no-upcoming': return 'admin-no-upcoming';
        case 'no-promises-text': return 'admin-no-promises-text';
        case 'upcoming-item': return 'admin-upcoming-item';
        case 'upcoming-date': return 'admin-upcoming-date';
        case 'upcoming-customer': return 'admin-upcoming-customer';
        case 'upcoming-amount': return 'admin-upcoming-amount';
        default: return '';
      }
    } else if (isSupervisor) {
      switch (type) {
        case 'collapsed-content': return 'supervisor-collapsed-content';
        case 'collapsed-icon': return 'supervisor-collapsed-icon';
        case 'header': return 'supervisor-right-sidebar-header';
        case 'title': return 'supervisor-right-sidebar-title';
        case 'toggle': return 'supervisor-right-sidebar-toggle';
        case 'calendar-section': return 'supervisor-calendar-section';
        case 'calendar-nav-btn': return 'supervisor-calendar-nav-btn';
        case 'calendar-title': return 'supervisor-calendar-title';
        case 'calendar-day-header': return 'supervisor-calendar-day-header';
        case 'calendar-day': return 'supervisor-calendar-day';
        case 'calendar-date-number': return 'supervisor-calendar-date-number';
        case 'selected-date': return 'supervisor-selected-date';
        case 'selected-date-title': return 'supervisor-selected-date-title';
        case 'selected-date-count': return 'supervisor-selected-date-count';
        case 'no-promises': return 'supervisor-no-promises';
        case 'date-promise-item': return 'supervisor-date-promise-item';
        case 'date-promise-customer': return 'supervisor-date-promise-customer';
        case 'date-promise-amount': return 'supervisor-date-promise-amount';
        case 'date-promise-time': return 'supervisor-date-promise-time';
        case 'upcoming-promises': return 'supervisor-upcoming-promises';
        case 'upcoming-promises-title': return 'supervisor-upcoming-promises-title';
        case 'view-all-btn': return 'supervisor-view-all-btn';
        case 'no-upcoming': return 'supervisor-no-upcoming';
        case 'no-promises-text': return 'supervisor-no-promises-text';
        case 'upcoming-item': return 'supervisor-upcoming-item';
        case 'upcoming-date': return 'supervisor-upcoming-date';
        case 'upcoming-customer': return 'supervisor-upcoming-customer';
        case 'upcoming-amount': return 'supervisor-upcoming-amount';
        default: return '';
      }
    } else {
      // Officer classes
      switch (type) {
        case 'collapsed-content': return 'officer-collapsed-content';
        case 'collapsed-icon': return 'officer-collapsed-icon';
        case 'header': return 'officer-right-sidebar-header';
        case 'title': return 'officer-right-sidebar-title';
        case 'toggle': return 'officer-right-sidebar-toggle';
        case 'calendar-section': return 'officer-calendar-section';
        case 'calendar-nav-btn': return 'officer-calendar-nav-btn';
        case 'calendar-title': return 'officer-calendar-title';
        case 'calendar-day-header': return 'officer-calendar-day-header';
        case 'calendar-day': return 'officer-calendar-day';
        case 'calendar-date-number': return 'officer-calendar-date-number';
        case 'selected-date': return 'officer-selected-date';
        case 'selected-date-title': return 'officer-selected-date-title';
        case 'selected-date-count': return 'officer-selected-date-count';
        case 'no-promises': return 'officer-no-promises';
        case 'date-promise-item': return 'officer-date-promise-item';
        case 'date-promise-customer': return 'officer-date-promise-customer';
        case 'date-promise-amount': return 'officer-date-promise-amount';
        case 'date-promise-time': return 'officer-date-promise-time';
        case 'upcoming-promises': return 'officer-upcoming-promises';
        case 'upcoming-promises-title': return 'officer-upcoming-promises-title';
        case 'view-all-btn': return 'officer-view-all-btn';
        case 'no-upcoming': return 'officer-no-upcoming';
        case 'no-promises-text': return 'officer-no-promises-text';
        case 'upcoming-item': return 'officer-upcoming-item';
        case 'upcoming-date': return 'officer-upcoming-date';
        case 'upcoming-customer': return 'officer-upcoming-customer';
        case 'upcoming-amount': return 'officer-upcoming-amount';
        default: return '';
      }
    }
  };

  return (
    <div
      className={getSidebarClass()}
      ref={sidebarRef}
    >
      {/* When collapsed - show minimal toggle button */}
      {collapsed ? (
        <div
          className={`right-sidebar-collapsed-content ${getRoleBasedClass('collapsed-content')}`}
          onClick={toggleSidebar}
        >
          <div className={`collapsed-icon ${getRoleBasedClass('collapsed-icon')}`}>
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
          <div className={`right-sidebar-header ${getRoleBasedClass('header')}`}>
            <div className={`right-sidebar-title ${getRoleBasedClass('title')}`}>
              <Event sx={{ fontSize: 16, marginRight: '0.5rem' }} />
              Upcoming Promises
            </div>
            <IconButton
              className={`right-sidebar-toggle ${getRoleBasedClass('toggle')}`}
              onClick={toggleSidebar}
              size="small"
            >
              <ChevronRight />
            </IconButton>
          </div>

          <div className="right-sidebar-content">
            {/* Calendar Section */}
            <div className={`calendar-section ${getRoleBasedClass('calendar-section')}`}>
              <div className="calendar-header">
                <button
                  className={`calendar-nav-btn ${getRoleBasedClass('calendar-nav-btn')}`}
                  onClick={() => setCalendarWeek(prev => prev - 1)}
                >
                  &lt;
                </button>
                <div className={`calendar-title ${getRoleBasedClass('calendar-title')}`}>
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
                  className={`calendar-nav-btn ${getRoleBasedClass('calendar-nav-btn')}`}
                  onClick={() => setCalendarWeek(prev => prev + 1)}
                >
                  &gt;
                </button>
              </div>

              <div className="calendar-grid-promises">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                  <div key={index} className={`calendar-day-header-promises ${getRoleBasedClass('calendar-day-header')}`}>
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
                      className={`calendar-day-promises ${isToday(date) ? 'today' : ''} ${selectedDate && selectedDate.getTime() === date.getTime() ? 'selected' : ''} ${getRoleBasedClass('calendar-day')}`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className={`calendar-date-number ${getRoleBasedClass('calendar-date-number')}`}>
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
              <div className={`selected-date-promises ${getRoleBasedClass('selected-date')}`}>
                <div className="selected-date-header">
                  <Today sx={{ fontSize: 14, marginRight: '0.5rem' }} />
                  <Typography className={`selected-date-title ${getRoleBasedClass('selected-date-title')}`}>
                    {selectedDate.toLocaleDateString('en-KE', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Typography>
                  <span className={`selected-date-count ${getRoleBasedClass('selected-date-count')}`}>
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
                    <div className={`no-promises-for-date ${getRoleBasedClass('no-promises')}`}>
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
                        className={`date-promise-item ${getRoleBasedClass('date-promise-item')}`}
                        onClick={() => navigate(`/customers/${promise.customerId?._id || promise.customerId}`)}
                      >
                        <div className="date-promise-info">
                          <div className={`date-promise-customer ${getRoleBasedClass('date-promise-customer')}`}>
                            {promise.customerId?.name || promise.customerName || 'Unknown Customer'}
                          </div>
                          <div className={`date-promise-amount ${getRoleBasedClass('date-promise-amount')}`}>
                            KES {Number(promise.promiseAmount || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className={`date-promise-time ${getRoleBasedClass('date-promise-time')}`}>
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
            <div className={`upcoming-promises-sidebar ${getRoleBasedClass('upcoming-promises')}`}>
              <div className="upcoming-promises-header">
                <Typography className={`upcoming-promises-title ${getRoleBasedClass('upcoming-promises-title')}`}>
                  Next 7 Days
                </Typography>
                <button
                  className={`view-all-promises-btn ${getRoleBasedClass('view-all-btn')}`}
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
                    <div className={`no-upcoming-promises-sidebar ${getRoleBasedClass('no-upcoming')}`}>
                      <div className="no-promises-icon">📅</div>
                      <Typography className={`no-promises-text ${getRoleBasedClass('no-promises-text')}`}>
                        No upcoming promises
                      </Typography>
                    </div>
                  ) : (
                    upcoming.map(promise => (
                      <div
                        key={promise._id}
                        className={`upcoming-promise-item-sidebar ${getRoleBasedClass('upcoming-item')}`}
                        onClick={() => navigate(`/customers/${promise.customerId?._id || promise.customerId}`)}
                      >
                        <div className={`upcoming-promise-date-sidebar ${getRoleBasedClass('upcoming-date')}`}>
                          {new Date(promise.promiseDate).toLocaleDateString('en-KE', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="upcoming-promise-info-sidebar">
                          <div className={`upcoming-promise-customer-sidebar ${getRoleBasedClass('upcoming-customer')}`}>
                            {promise.customerId?.name || promise.customerName || 'Unknown Customer'}
                          </div>
                          <div className={`upcoming-promise-amount-sidebar ${getRoleBasedClass('upcoming-amount')}`}>
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
  );
};

export default RightSidebar;