import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import type { ConflictDetection } from '../../types';
import { AlertTriangleIcon } from '../icons/Icons';

interface ConflictAlertProps {
  conflicts: ConflictDetection[];
}

const ConflictAlert: React.FC<ConflictAlertProps> = ({ conflicts }) => {
  if (conflicts.length === 0) {
    return (
      <Card className="p-6 border-green-500/20 bg-green-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <AlertTriangleIcon className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-primary">Không có mâu thuẫn</p>
            <p className="text-sm text-primary-muted">Tất cả yêu cầu đều nhất quán</p>
          </div>
        </div>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'contradiction':
        return 'Mâu thuẫn trực tiếp';
      case 'overlap':
        return 'Trùng lặp';
      case 'dependency':
        return 'Phụ thuộc';
      case 'ambiguity':
        return 'Không rõ ràng';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangleIcon className="w-5 h-5 text-red-400" />
        <h3 className="text-lg font-semibold text-primary">
          Phát hiện {conflicts.length} mâu thuẫn
        </h3>
      </div>

      {conflicts.map((conflict) => (
        <Card
          key={conflict.id}
          className={`p-6 ${
            conflict.severity === 'high'
              ? 'border-red-500/30 bg-red-500/5'
              : conflict.severity === 'medium'
              ? 'border-yellow-500/30 bg-yellow-500/5'
              : 'border-blue-500/30 bg-blue-500/5'
          }`}
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    conflict.severity === 'high'
                      ? 'bg-red-500/20'
                      : conflict.severity === 'medium'
                      ? 'bg-yellow-500/20'
                      : 'bg-blue-500/20'
                  }`}
                >
                  <AlertTriangleIcon
                    className={`w-5 h-5 ${
                      conflict.severity === 'high'
                        ? 'text-red-400'
                        : conflict.severity === 'medium'
                        ? 'text-yellow-400'
                        : 'text-blue-400'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-primary">{conflict.id}</p>
                    <Badge variant={getSeverityColor(conflict.severity)} className="text-xs">
                      {conflict.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="info" className="text-xs">
                      {getTypeLabel(conflict.type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-primary-muted">
                    Liên quan đến: {conflict.requirementIds.join(', ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-surface2 rounded-lg p-4">
              <p className="text-sm text-primary-muted mb-2">
                <span className="font-medium text-primary">Mô tả:</span>
              </p>
              <p className="text-sm text-primary">{conflict.description}</p>
            </div>

            {/* Suggestion */}
            <div className="bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg p-4">
              <p className="text-sm font-medium text-accent-cyan mb-2">💡 Đề xuất:</p>
              <p className="text-sm text-primary">{conflict.suggestion}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ConflictAlert;

