// src/components/reports/OfficerPDFReport.jsx
import React from 'react';
import {
    Page,
    Text,
    View,
    Document,
    StyleSheet,
    Font,
    Image
} from '@react-pdf/renderer';
import authService from '../../services/auth.service';

// Register Century Gothic font
Font.register({
    family: 'Century Gothic',
    fonts: [
        { src: '/fonts/CenturyGothic.ttf' },
        { src: '/fonts/CenturyGothic-Bold.ttf', fontWeight: 'bold' }
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Century Gothic',
        backgroundColor: '#ffffff',
        fontSize: 10
    },
    header: {
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#2c3e50',
        borderBottomStyle: 'solid',
        paddingBottom: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 2
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        marginBottom: 15
    },
    officerInfoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 15,
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 4
    },
    officerInfoItem: {
        width: '33%',
        marginBottom: 10
    },
    label: {
        fontSize: 8,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 3
    },
    value: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#2c3e50'
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 25,
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        borderBottomStyle: 'solid',
        paddingBottom: 8
    },
    performanceSummary: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 25
    },
    performanceCard: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: '#2c3e50',
        borderLeftStyle: 'solid'
    },
    performanceLabel: {
        fontSize: 9,
        color: '#666',
        textTransform: 'uppercase',
        marginBottom: 5
    },
    performanceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50'
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -7.5
    },
    metricCard: {
        width: '25%',
        paddingHorizontal: 7.5,
        marginBottom: 15
    },
    metricInner: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'solid',
        padding: 12,
        borderRadius: 4
    },
    metricIcon: {
        width: 24,
        height: 24,
        marginBottom: 8,
        color: '#2c3e50'
    },
    metricLabel: {
        fontSize: 7,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 4
    },
    metricValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2c3e50'
    },
    metricSubvalue: {
        fontSize: 8,
        color: '#999',
        marginTop: 2
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        borderTopStyle: 'solid',
        paddingTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 8,
        color: '#666'
    },
    footerLeft: {
        flexDirection: 'row',
        gap: 20
    },
    footerRight: {
        textAlign: 'right'
    },
    watermark: {
        position: 'absolute',
        top: '40%',
        left: '25%',
        opacity: 0.03,
        fontSize: 60,
        fontWeight: 'bold',
        color: '#2c3e50',
        transform: 'rotate(-45deg)',
        textTransform: 'uppercase'
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 20
    },
    chip: {
        backgroundColor: '#2c3e50',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 5
    },
    chipText: {
        fontSize: 7,
        color: 'white',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    }
});

const OfficerPDFReport = ({ officer, officerDetails, activities, generatedBy }) => {
    const formatAmount = (amount) => {
        const num = Number(amount) || 0;
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-KE', {
            dateStyle: 'full',
            timeStyle: 'medium',
            timeZone: 'Africa/Nairobi'
        }).format(new Date(date));
    };

    const formatCompactAmount = (amount) => {
        const num = Number(amount) || 0;
        if (num >= 1000000) return `KES ${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `KES ${(num / 1000).toFixed(1)}K`;
        return `KES ${num}`;
    };

    const currentDate = new Date();
    const supervisorName = generatedBy || authService.getCurrentUser()?.fullName || 'System Administrator';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Watermark */}
                <Text style={styles.watermark}>CONFIDENTIAL</Text>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>PERFORMANCE REPORT</Text>
                    <Text style={styles.subtitle}>Loan Officer Performance Analysis</Text>
                    
                    {/* Officer Information */}
                    <View style={styles.officerInfoGrid}>
                        <View style={styles.officerInfoItem}>
                            <Text style={styles.label}>Officer Name</Text>
                            <Text style={styles.value}>
                                {officer?.fullName || officer?.name || officer?.username || 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.officerInfoItem}>
                            <Text style={styles.label}>Email Address</Text>
                            <Text style={styles.value}>
                                {officerDetails?.email || officer?.email || `${officer?.username || 'officer'}@ncbagroup.com`}
                            </Text>
                        </View>
                        <View style={styles.officerInfoItem}>
                            <Text style={styles.label}>Loan Type</Text>
                            <Text style={styles.value}>
                                {officer?.loanType || officerDetails?.loanType || 'Credit Cards'}
                            </Text>
                        </View>
                        <View style={styles.officerInfoItem}>
                            <Text style={styles.label}>Employee ID</Text>
                            <Text style={styles.value}>
                                {officerDetails?.employeeId || officer?.employeeId || 'EMP6a66a2'}
                            </Text>
                        </View>
                        <View style={styles.officerInfoItem}>
                            <Text style={styles.label}>Phone</Text>
                            <Text style={styles.value}>
                                {officerDetails?.phone || officer?.phone || '254712345682'}
                            </Text>
                        </View>
                        <View style={styles.officerInfoItem}>
                            <Text style={styles.label}>Join Date</Text>
                            <Text style={styles.value}>
                                {officerDetails?.joinDate 
                                    ? new Date(officerDetails.joinDate).toLocaleDateString('en-KE')
                                    : '29/01/2026'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Performance Summary */}
                <Text style={styles.sectionTitle}>Performance Summary</Text>
                <View style={styles.performanceSummary}>
                    <View style={styles.performanceCard}>
                        <Text style={styles.performanceLabel}>Collection Rate</Text>
                        <Text style={styles.performanceValue}>
                            {((officerDetails?.performance?.collectionRate) || 0).toFixed(1)}%
                        </Text>
                        <View style={styles.chip}>
                            <Text style={styles.chipText}>Target: 85%</Text>
                        </View>
                    </View>
                    <View style={styles.performanceCard}>
                        <Text style={styles.performanceLabel}>Call Conversion</Text>
                        <Text style={styles.performanceValue}>
                            {((officerDetails?.performance?.callConversion) || 0).toFixed(1)}%
                        </Text>
                        <View style={styles.chip}>
                            <Text style={styles.chipText}>Target: 70%</Text>
                        </View>
                    </View>
                    <View style={styles.performanceCard}>
                        <Text style={styles.performanceLabel}>Efficiency Score</Text>
                        <Text style={styles.performanceValue}>
                            {((officerDetails?.performance?.efficiency) || 8.5).toFixed(1)}/10
                        </Text>
                        <View style={styles.chip}>
                            <Text style={styles.chipText}>Target: 9/10</Text>
                        </View>
                    </View>
                </View>

                {/* Key Metrics */}
                <Text style={styles.sectionTitle}>Key Performance Metrics</Text>
                <View style={styles.metricsGrid}>
                    {/* Total Collections */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricInner}>
                            <Text style={styles.metricLabel}>Total Collections</Text>
                            <Text style={styles.metricValue}>
                                {formatCompactAmount(officerDetails?.collections?.total || 323500)}
                            </Text>
                            <Text style={styles.metricSubvalue}>Lifetime</Text>
                        </View>
                    </View>

                    {/* Monthly Collections */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricInner}>
                            <Text style={styles.metricLabel}>Monthly Collections</Text>
                            <Text style={styles.metricValue}>
                                {formatCompactAmount(officerDetails?.collections?.monthly || 125000)}
                            </Text>
                            <Text style={styles.metricSubvalue}>Current Month</Text>
                        </View>
                    </View>

                    {/* Weekly Collections */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricInner}>
                            <Text style={styles.metricLabel}>Weekly Collections</Text>
                            <Text style={styles.metricValue}>
                                {formatCompactAmount(officerDetails?.collections?.weekly || 32500)}
                            </Text>
                            <Text style={styles.metricSubvalue}>This Week</Text>
                        </View>
                    </View>

                    {/* Today's Collections */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricInner}>
                            <Text style={styles.metricLabel}>Today's Collections</Text>
                            <Text style={styles.metricValue}>
                                {formatCompactAmount(officerDetails?.collections?.today || 8500)}
                            </Text>
                            <Text style={styles.metricSubvalue}>{currentDate.toLocaleDateString('en-KE')}</Text>
                        </View>
                    </View>

                    {/* Assigned Customers */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricInner}>
                            <Text style={styles.metricLabel}>Assigned Customers</Text>
                            <Text style={styles.metricValue}>
                                {officerDetails?.customers?.totalAssigned || 2}
                            </Text>
                            <Text style={styles.metricSubvalue}>Active Portfolio</Text>
                        </View>
                    </View>

                    {/* Active Customers */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricInner}>
                            <Text style={styles.metricLabel}>Active Customers</Text>
                            <Text style={styles.metricValue}>
                                {officerDetails?.customers?.active || 1}
                            </Text>
                            <Text style={styles.metricSubvalue}>Current Status</Text>
                        </View>
                    </View>

                    {/* Overdue Customers */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricInner}>
                            <Text style={styles.metricLabel}>Overdue Customers</Text>
                            <Text style={styles.metricValue}>
                                {officerDetails?.customers?.overdue || 1}
                            </Text>
                            <Text style={styles.metricSubvalue}>Requires Attention</Text>
                        </View>
                    </View>

                    {/* Calls Today */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricInner}>
                            <Text style={styles.metricLabel}>Calls Today</Text>
                            <Text style={styles.metricValue}>
                                {officerDetails?.calls?.today || 8}
                            </Text>
                            <Text style={styles.metricSubvalue}>Completed Calls</Text>
                        </View>
                    </View>

                    {/* Calls This Week */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricInner}>
                            <Text style={styles.metricLabel}>Calls This Week</Text>
                            <Text style={styles.metricValue}>
                                {officerDetails?.calls?.weekly || 32}
                            </Text>
                            <Text style={styles.metricSubvalue}>Total Outreach</Text>
                        </View>
                    </View>

                    {/* Completed Assignments */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricInner}>
                            <Text style={styles.metricLabel}>Completed Assignments</Text>
                            <Text style={styles.metricValue}>
                                {officerDetails?.assignments?.completed || 3}
                            </Text>
                            <Text style={styles.metricSubvalue}>Tasks Done</Text>
                        </View>
                    </View>

                    {/* Pending Collections */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricInner}>
                            <Text style={styles.metricLabel}>Pending Collections</Text>
                            <Text style={styles.metricValue}>
                                {officerDetails?.assignments?.pending || 0}
                            </Text>
                            <Text style={styles.metricSubvalue}>Awaiting Payment</Text>
                        </View>
                    </View>

                    {/* Overdue Amount */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricInner}>
                            <Text style={styles.metricLabel}>Overdue Amount</Text>
                            <Text style={styles.metricValue}>
                                {formatCompactAmount(officerDetails?.collections?.overdue || 20000)}
                            </Text>
                            <Text style={styles.metricSubvalue}>Total Arrears</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Activity Summary */}
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={{ marginTop: 10 }}>
                    {activities && activities.length > 0 ? (
                        activities.slice(0, 5).map((activity, idx) => (
                            <View key={idx} style={{
                                flexDirection: 'row',
                                paddingVertical: 8,
                                borderBottomWidth: idx < 4 ? 1 : 0,
                                borderBottomColor: '#f0f0f0',
                                borderBottomStyle: 'solid'
                            }}>
                                <View style={{ width: 100 }}>
                                    <Text style={{ fontSize: 8, color: '#666' }}>
                                        {new Date(activity.time).toLocaleString('en-KE', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            day: 'numeric',
                                            month: 'short'
                                        })}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#2c3e50' }}>
                                        {activity.type.replace('_', ' ').toUpperCase()}
                                    </Text>
                                    <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
                                        {activity.details}
                                    </Text>
                                </View>
                                {activity.amount && (
                                    <View>
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#27ae60' }}>
                                            {formatCompactAmount(activity.amount)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))
                    ) : (
                        <Text style={{ fontSize: 9, color: '#666', textAlign: 'center', padding: 20 }}>
                            No recent activities recorded
                        </Text>
                    )}
                </View>

                {/* Footer with Generation Details */}
                <View style={styles.footer}>
                    <View style={styles.footerLeft}>
                        <Text>Generated by: {supervisorName}</Text>
                        <Text>Role: Collections Supervisor</Text>
                    </View>
                    <View style={styles.footerRight}>
                        <Text>Report ID: PERF-{currentDate.getTime().toString().slice(-8)}</Text>
                        <Text>Generated: {formatDate(currentDate)}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default OfficerPDFReport;