import React, { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import type { TestCaseSuggestion } from '../../types';

interface TestCaseSuggestionsProps {
  testCases: TestCaseSuggestion[];
}

const TestCaseSuggestions: React.FC<TestCaseSuggestionsProps> = ({ testCases }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (testCases.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-primary-muted text-center">Chưa có test case suggestions</p>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'happy_path':
        return 'success';
      case 'edge_case':
        return 'warning';
      case 'error_handling':
        return 'danger';
      case 'integration':
        return 'info';
      default:
        return 'info';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'happy_path':
        return 'Happy Path';
      case 'edge_case':
        return 'Edge Case';
      case 'error_handling':
        return 'Error Handling';
      case 'integration':
        return 'Integration';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary">
          Test Case Suggestions ({testCases.length})
        </h3>
      </div>

      {testCases.map((testCase) => {
        const isExpanded = expandedId === testCase.id;
        return (
          <Card key={testCase.id} className="p-6 hover:border-accent-cyan/30 transition-colors">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm text-accent-cyan">{testCase.id}</span>
                    <Badge variant={getPriorityColor(testCase.priority)} className="text-xs">
                      {testCase.priority.toUpperCase()}
                    </Badge>
                    <Badge variant={getTypeColor(testCase.type)} className="text-xs">
                      {getTypeLabel(testCase.type)}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-primary mb-1">{testCase.title}</h4>
                  <p className="text-sm text-primary-muted mb-2">
                    Requirement: {testCase.requirementId}
                  </p>
                  {testCase.description && (
                    <p className="text-sm text-primary-muted">{testCase.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : testCase.id)}
                  className="text-primary-muted hover:text-primary transition-colors"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>

              {/* Given/When/Then - Expanded view */}
              {isExpanded && (
                <div className="space-y-3 pt-4 border-t border-surface2">
                  <div className="bg-surface2 rounded-lg p-4">
                    <p className="text-xs font-semibold text-primary-muted mb-2 uppercase tracking-wide">
                      Given
                    </p>
                    <p className="text-sm text-primary">{testCase.given}</p>
                  </div>
                  <div className="bg-surface2 rounded-lg p-4">
                    <p className="text-xs font-semibold text-primary-muted mb-2 uppercase tracking-wide">
                      When
                    </p>
                    <p className="text-sm text-primary">{testCase.when}</p>
                  </div>
                  <div className="bg-surface2 rounded-lg p-4">
                    <p className="text-xs font-semibold text-primary-muted mb-2 uppercase tracking-wide">
                      Then
                    </p>
                    <p className="text-sm text-primary">{testCase.then}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default TestCaseSuggestions;

