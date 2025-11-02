import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import Card from '../components/ui/Card';
import MetricCard from '../components/ui/MetricCard';
import ChartTooltip from '../components/ui/ChartTooltip';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  RefreshIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  SparklesIcon,
  AlertTriangleIcon,
} from '../components/icons/Icons';
import { useAuth } from '../contexts/AuthContext';
import { getUserAnalyses, type SavedAnalysis } from '../services/analysisService';

// Custom tooltip formatter
const formatTooltipValue = (value: number, name: string): [string, string] => {
  if (name === 'Passed' || name === 'Failed') {
    return [`${value} tests`, name];
  }
  return [value.toString(), name];
};

const DashboardPage = () => {
  // State management
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Requirement Analysis Dashboard state
  const { currentUser } = useAuth();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  
  // Empty state - will be populated from API later
  const lastRun = { total: 0, passed: 0, failed: 0, durationMs: 0 };
  const passPercentage = '0.0';
  const passPercentageNum = parseFloat(passPercentage) || 0;
  
  // Mock trends data - will be populated from API later
  const trends = {
    passRate: 0,
    passed: 0,
    failed: 0,
    totalTime: 0,
  };

  // Pie chart data with fill colors
  const pieData = [
    { name: 'Pass', value: lastRun.passed, fill: '#10B981' },
    { name: 'Fail', value: lastRun.failed, fill: '#EF4444' },
  ];
  
  const barData: any[] = [];
  
  // Custom label renderer for pie chart
  const renderCustomLabel = (entry: any) => {
    const percent = entry.value > 0 ? ((entry.value / (lastRun.passed + lastRun.failed)) * 100).toFixed(1) : 0;
    return `${entry.name}: ${percent}%`;
  };
  
  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Fetch fresh data from API
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    setIsRefreshing(false);
  };
  
  // Page load animation
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // Load requirement analyses from Firebase
  useEffect(() => {
    const loadAnalyses = async () => {
      if (!currentUser) {
        setAnalyses([]);
        return;
      }

      try {
        setLoadingAnalyses(true);
        const userAnalyses = await getUserAnalyses(currentUser.uid);
        setAnalyses(userAnalyses);
      } catch (error) {
        console.error('Error loading analyses:', error);
        setAnalyses([]);
      } finally {
        setLoadingAnalyses(false);
      }
    };

    loadAnalyses();
  }, [currentUser]);

  // Calculate Requirement Analysis metrics
  const totalDocuments = analyses.length;
  const totalRequirements = analyses.reduce((sum, a) => sum + a.summary.totalRequirements, 0);
  const totalFR = analyses.reduce((sum, a) => sum + a.summary.functionalCount, 0);
  const totalNFR = analyses.reduce((sum, a) => sum + a.summary.nonFunctionalCount, 0);
  const avgClarity = totalDocuments > 0 
    ? Math.round(analyses.reduce((sum, a) => sum + a.summary.avgClarityScore, 0) / totalDocuments)
    : 0;
  const avgTestability = totalDocuments > 0
    ? Math.round(analyses.reduce((sum, a) => sum + a.summary.avgTestabilityScore, 0) / totalDocuments)
    : 0;
  const totalConflicts = analyses.reduce((sum, a) => sum + a.summary.conflictsCount, 0);
  const avgConflictsPerDoc = totalDocuments > 0 ? (totalConflicts / totalDocuments).toFixed(1) : '0.0';

  // Requirement Analysis Charts Data
  const reqPieData = [
    { name: 'Functional (FR)', value: totalFR, fill: '#22D3EE' },
    { name: 'Non-Functional (NFR)', value: totalNFR, fill: '#7C3AED' },
  ];

  // Group analyses by month for trends
  const getMonthLabel = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
  };

  const analysesByMonth = analyses.reduce((acc: any, analysis) => {
    const monthLabel = getMonthLabel(analysis.createdAt);
    if (!acc[monthLabel]) {
      acc[monthLabel] = { count: 0, claritySum: 0, testabilitySum: 0 };
    }
    acc[monthLabel].count += 1;
    acc[monthLabel].claritySum += analysis.summary.avgClarityScore;
    acc[monthLabel].testabilitySum += analysis.summary.avgTestabilityScore;
    return acc;
  }, {});

  const trendBarData = Object.entries(analysesByMonth).map(([month, data]: [string, any]) => ({
    name: month,
    documents: data.count,
    avgClarity: Math.round(data.claritySum / data.count),
    avgTestability: Math.round(data.testabilitySum / data.count),
  }));

  // Top 3 documents by clarity score
  const topDocuments = [...analyses]
    .sort((a, b) => b.summary.avgClarityScore - a.summary.avgClarityScore)
    .slice(0, 3);

  return (
    <div 
      className="space-y-6"
      style={{
        opacity: isPageLoaded ? 1 : 0,
        transform: isPageLoaded ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
      }}
    >
      {/* Header với title và refresh button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary">Test Execution Analytics</h1>
          <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="
              flex items-center gap-2
              px-4 py-2
              bg-surface border border-surface2 rounded-lg
              text-primary text-sm font-medium
              hover:bg-surface2 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <RefreshIcon
              className={`w-4 h-4 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
          <button
            className="
              flex items-center gap-2
              px-4 py-2
              bg-accent-violet text-white rounded-lg
              text-sm font-medium
              hover:bg-accent-violet/90 transition-all duration-200
            "
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <MetricCard
          title="Pass Rate"
          value={`${passPercentage}%`}
          subtitle={`${lastRun.passed} of ${lastRun.total} tests`}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          trend={trends.passRate}
          progress={passPercentageNum}
          color="success"
        />
        <MetricCard
          title="Tests Passed"
          value={lastRun.passed}
          subtitle="Successful executions"
          icon={<CheckCircleIcon className="w-6 h-6" />}
          trend={trends.passed}
          color="success"
        />
        <MetricCard
          title="Tests Failed"
          value={lastRun.failed}
          subtitle="Requires attention"
          icon={<XCircleIcon className="w-6 h-6" />}
          trend={trends.failed}
          color="danger"
        />
        <MetricCard
          title="Total Time"
          value={`${(lastRun.durationMs / 1000).toFixed(1)}s`}
          subtitle="Execution duration"
          icon={<ClockIcon className="w-6 h-6" />}
          trend={trends.totalTime}
          color="cyan"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
        {/* Pie Chart - Test Distribution */}
        <Card className="lg:col-span-1 xl:col-span-2" hover={true}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-primary mb-1">Test Distribution</h2>
              <p className="text-sm text-primary-muted">Overall pass/fail breakdown</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                animationDuration={800}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={formatTooltipValue} />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-primary-muted text-sm">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart - Test Trends */}
        <Card className="lg:col-span-2 xl:col-span-3" hover={true}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-primary mb-1">Test Trends</h2>
              <p className="text-sm text-primary-muted">Pass/fail ratio over time</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={barData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <XAxis
                dataKey="name"
                stroke="#94A3B8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="square"
                formatter={(value) => (
                  <span className="text-primary-muted text-sm">{value}</span>
                )}
              />
              <Bar
                dataKey="pass"
                stackId="a"
                fill="#10B981"
                name="Pass"
                radius={[4, 4, 0, 0]}
                animationDuration={800}
              />
              <Bar
                dataKey="fail"
                stackId="a"
                fill="#EF4444"
                name="Fail"
                radius={[4, 4, 0, 0]}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Requirement Analysis Dashboard Section */}
      <div className="space-y-6 mt-12 pt-8 border-t border-surface2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-primary">Requirement Analysis Dashboard</h2>
            <p className="text-primary-muted mt-1">Thống kê và đánh giá requirement documents</p>
          </div>
        </div>

        {loadingAnalyses ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-primary-muted">Đang tải dữ liệu...</span>
          </div>
        ) : !currentUser ? (
          <Card className="p-8 text-center">
            <p className="text-primary-muted">Vui lòng đăng nhập để xem requirement analysis dashboard</p>
          </Card>
        ) : totalDocuments === 0 ? (
          <Card className="p-8 text-center">
            <DocumentTextIcon className="w-16 h-16 mx-auto text-primary-muted mb-4" />
            <p className="text-primary-muted text-lg">Chưa có phân tích nào</p>
            <p className="text-primary-muted text-sm mt-2">Hãy analyze requirement document đầu tiên!</p>
          </Card>
        ) : (
          <>
            {/* Requirement Analysis Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
              <MetricCard
                title="Total Documents Analyzed"
                value={totalDocuments}
                subtitle="Tổng số files đã phân tích"
                icon={<DocumentTextIcon className="w-6 h-6" />}
                color="primary"
              />
              <MetricCard
                title="Total Requirements"
                value={totalRequirements}
                subtitle={`${totalFR} FR, ${totalNFR} NFR`}
                icon={<ChartBarIcon className="w-6 h-6" />}
                color="cyan"
              />
              <MetricCard
                title="Average Clarity Score"
                value={`${avgClarity}/100`}
                subtitle="Độ rõ ràng trung bình"
                icon={<CheckCircleIcon className="w-6 h-6" />}
                color={avgClarity >= 80 ? 'success' : avgClarity >= 60 ? 'warning' : 'danger'}
                progress={avgClarity}
              />
              <MetricCard
                title="Average Testability Score"
                value={`${avgTestability}/100`}
                subtitle="Khả năng kiểm thử trung bình"
                icon={<SparklesIcon className="w-6 h-6" />}
                color={avgTestability >= 80 ? 'success' : avgTestability >= 60 ? 'warning' : 'danger'}
                progress={avgTestability}
              />
            </div>

            {/* Requirement Analysis Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
              {/* Pie Chart - FR vs NFR Distribution */}
              <Card className="lg:col-span-1 xl:col-span-2" hover={true}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-primary mb-1">FR vs NFR Distribution</h2>
                    <p className="text-sm text-primary-muted">Phân bố Functional và Non-Functional Requirements</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reqPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => {
                        const percent = entry.percent as number;
                        return `${entry.name}: ${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                      animationDuration={800}
                    >
                      {reqPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Bar Chart - Documents Analyzed Over Time */}
              <Card className="lg:col-span-2 xl:col-span-3" hover={true}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-primary mb-1">Documents Analyzed Over Time</h2>
                    <p className="text-sm text-primary-muted">Số lượng documents được phân tích theo thời gian</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={trendBarData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="documents"
                      fill="#22D3EE"
                      name="Documents"
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Scores Trend Chart */}
            {trendBarData.length > 0 && (
              <Card hover={true}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-primary mb-1">Average Scores Trend</h2>
                    <p className="text-sm text-primary-muted">Xu hướng clarity và testability scores theo thời gian</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={trendBarData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="avgClarity"
                      fill="#10B981"
                      name="Avg Clarity Score"
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    />
                    <Bar
                      dataKey="avgTestability"
                      fill="#7C3AED"
                      name="Avg Testability Score"
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <Card hover={true}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-primary">Total Conflicts</h3>
                    <AlertTriangleIcon className="w-6 h-6 text-status-danger" />
                  </div>
                  <p className="text-3xl font-bold text-primary">{totalConflicts}</p>
                  <p className="text-sm text-primary-muted mt-1">
                    Trung bình: {avgConflictsPerDoc} conflicts/document
                  </p>
                </div>
              </Card>

              <Card hover={true}>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-primary mb-4">Top Documents by Clarity</h3>
                  {topDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {topDocuments.map((analysis, idx) => (
                        <div key={analysis.id} className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary truncate">
                              {idx + 1}. {analysis.documentName}
                            </p>
                            <p className="text-xs text-primary-muted">
                              {analysis.summary.totalRequirements} requirements
                            </p>
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-lg font-semibold text-primary">
                              {analysis.summary.avgClarityScore}/100
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-primary-muted">No data available</p>
                  )}
                </div>
              </Card>

              <Card hover={true}>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-primary mb-4">Documents with Conflicts</h3>
                  {totalConflicts > 0 ? (
                    <div className="space-y-3">
                      {analyses
                        .filter((a) => a.summary.conflictsCount > 0)
                        .slice(0, 3)
                        .map((analysis) => (
                          <div key={analysis.id} className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-primary truncate">
                                {analysis.documentName}
                              </p>
                            </div>
                            <div className="ml-4">
                              <span className="text-status-danger font-semibold">
                                {analysis.summary.conflictsCount} conflicts
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-status-success" />
                      <p className="text-sm text-primary-muted">Không có conflicts nào</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default DashboardPage;
