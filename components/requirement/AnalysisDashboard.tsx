import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import MetricCard from '../ui/MetricCard';
import type { RequirementAnalysis } from '../../types';
import { ChartBarIcon, AlertTriangleIcon } from '../icons/Icons';

interface AnalysisDashboardProps {
  analysis: RequirementAnalysis;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysis }) => {
  // Pie chart data for FR vs NFR
  const pieData = [
    {
      name: 'Functional (FR)',
      value: analysis.summary.functionalCount,
      fill: '#22D3EE', // accent-cyan
    },
    {
      name: 'Non-Functional (NFR)',
      value: analysis.summary.nonFunctionalCount,
      fill: '#7C3AED', // accent-violet
    },
  ];

  const COLORS = ['#22D3EE', '#7C3AED'];

  const frPercentage =
    analysis.summary.totalRequirements > 0
      ? Math.round((analysis.summary.functionalCount / analysis.summary.totalRequirements) * 100)
      : 0;
  const nfrPercentage =
    analysis.summary.totalRequirements > 0
      ? Math.round((analysis.summary.nonFunctionalCount / analysis.summary.totalRequirements) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requirements"
          value={analysis.summary.totalRequirements}
          subtitle="Tổng số yêu cầu"
          icon={<ChartBarIcon className="w-6 h-6" />}
          color="primary"
        />
        <MetricCard
          title="Functional (FR)"
          value={analysis.summary.functionalCount}
          subtitle={`${frPercentage}% của tổng số`}
          icon={<ChartBarIcon className="w-6 h-6" />}
          color="cyan"
          progress={frPercentage}
        />
        <MetricCard
          title="Non-Functional (NFR)"
          value={analysis.summary.nonFunctionalCount}
          subtitle={`${nfrPercentage}% của tổng số`}
          icon={<ChartBarIcon className="w-6 h-6" />}
          color="violet"
          progress={nfrPercentage}
        />
        <MetricCard
          title="Conflicts Detected"
          value={analysis.summary.conflictsCount}
          subtitle={analysis.summary.conflictsCount > 0 ? 'Cần xem xét' : 'Không có mâu thuẫn'}
          icon={<AlertTriangleIcon className="w-6 h-6" />}
          color={analysis.summary.conflictsCount > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Score Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Average Clarity Score"
          value={`${analysis.summary.avgClarityScore}/100`}
          subtitle="Độ rõ ràng trung bình"
          color={analysis.summary.avgClarityScore >= 80 ? 'success' : analysis.summary.avgClarityScore >= 60 ? 'warning' : 'danger'}
          progress={analysis.summary.avgClarityScore}
        />
        <MetricCard
          title="Average Testability Score"
          value={`${analysis.summary.avgTestabilityScore}/100`}
          subtitle="Khả năng kiểm thử trung bình"
          color={analysis.summary.avgTestabilityScore >= 80 ? 'success' : analysis.summary.avgTestabilityScore >= 60 ? 'warning' : 'danger'}
          progress={analysis.summary.avgTestabilityScore}
        />
      </div>

      {/* Pie Chart */}
      {analysis.summary.totalRequirements > 0 && (
        <div className="bg-surface border border-surface2 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">Distribution: FR vs NFR</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;

