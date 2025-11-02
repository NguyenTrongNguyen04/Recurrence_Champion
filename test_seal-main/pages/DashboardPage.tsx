import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { HistoryItem } from '../types';
import { apiService } from '../services/api.service';

const DashboardPage = () => {
    const [lastRun, setLastRun] = useState<any>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [historyData] = await Promise.all([
                apiService.getHistory(10),
            ]);

            setHistory(historyData);

            // Use the most recent run as lastRun
            if (historyData.length > 0) {
                const latest = historyData[0];
                // Try to get full run data if we have runId
                // For now, use history data
                setLastRun({
                    total: latest.tests,
                    passed: latest.pass,
                    failed: latest.fail,
                    skipped: latest.skip || 0,
                    durationMs: parseFloat(latest.duration) * 1000 || 0,
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">Reporting Dashboard</h1>
                <Card>
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-primary-muted">Loading dashboard...</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">Reporting Dashboard</h1>
                <Card>
                    <div className="text-center py-12">
                        <div className="text-status-danger text-xl mb-4">⚠️ Error</div>
                        <p className="text-primary-muted">{error}</p>
                    </div>
                </Card>
            </div>
        );
    }

    const passPercentage = lastRun && lastRun.total > 0 
        ? ((lastRun.passed / lastRun.total) * 100).toFixed(1) 
        : '0.0';

    const pieData = lastRun ? [
        { name: 'Pass', value: lastRun.passed },
        { name: 'Fail', value: lastRun.failed },
    ] : [];
    
    const COLORS = ['#10B981', '#EF4444'];

    const barData = history.slice(0, 5).reverse().map(h => ({
        name: h.runId,
        pass: h.pass,
        fail: h.fail,
    }));
    
    const historyColumns = [
        { header: 'Run #', accessor: (item: HistoryItem) => <span className="text-accent-cyan font-semibold">{item.runId}</span> },
        { header: 'Total Tests', accessor: (item: HistoryItem) => item.tests },
        { header: 'Pass', accessor: (item: HistoryItem) => <span className="text-status-success">{item.pass}</span> },
        { header: 'Fail', accessor: (item: HistoryItem) => <span className="text-status-danger">{item.fail}</span> },
        { header: 'Duration', accessor: (item: HistoryItem) => item.duration },
        { header: 'Date/Time', accessor: (item: HistoryItem) => item.date },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Reporting Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <h3 className="text-primary-muted text-sm font-medium">Pass %</h3>
                    <p className="text-3xl font-bold text-status-success">{passPercentage}%</p>
                </Card>
                <Card>
                    <h3 className="text-primary-muted text-sm font-medium">Failed Tests</h3>
                    <p className="text-3xl font-bold text-status-danger">{lastRun?.failed || 0}</p>
                </Card>
                <Card>
                    <h3 className="text-primary-muted text-sm font-medium">Total Time</h3>
                    <p className="text-3xl font-bold">{(lastRun?.durationMs ? (lastRun.durationMs / 1000).toFixed(2) : '0.00')}s</p>
                </Card>
                <Card>
                    <h3 className="text-primary-muted text-sm font-medium"># of Tests</h3>
                    <p className="text-3xl font-bold">{lastRun?.total || 0}</p>
                </Card>
            </div>
            
            {lastRun && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <Card className="lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4">Pass vs Fail (Last Run)</h2>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={110} fill="#8884d8" dataKey="value">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#11162A', border: '1px solid #151B33', borderRadius: '0.75rem' }}/>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center py-12 text-primary-muted">No data available</div>
                        )}
                    </Card>
                    <Card className="lg:col-span-3">
                        <h2 className="text-xl font-bold mb-4">Last 5 Runs Trend</h2>
                        {barData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={barData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#11162A', border: '1px solid #151B33', borderRadius: '0.75rem' }} cursor={{fill: 'rgba(124, 58, 237, 0.1)'}}/>
                                    <Legend />
                                    <Bar dataKey="pass" stackId="a" fill="#10B981" name="Pass" radius={[4, 4, 0, 0]}/>
                                    <Bar dataKey="fail" stackId="a" fill="#EF4444" name="Fail" radius={[4, 4, 0, 0]}/>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center py-12 text-primary-muted">No data available</div>
                        )}
                    </Card>
                </div>
            )}
            
            <Card>
                <h2 className="text-xl font-bold mb-4">Run History</h2>
                {history.length === 0 ? (
                    <div className="text-center py-8 text-primary-muted">
                        No test run history available
                    </div>
                ) : (
                    <Table columns={historyColumns} data={history} />
                )}
            </Card>
        </div>
    );
};

export default DashboardPage;
