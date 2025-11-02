import React from 'react';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import type { FunctionalRequirement, NonFunctionalRequirement } from '../../types';

interface RequirementTableProps {
  functionalReqs: FunctionalRequirement[];
  nonFunctionalReqs: NonFunctionalRequirement[];
}

type RequirementRow = {
  id: string;
  type: 'FR' | 'NFR';
  title: string;
  description: string;
  clarityScore: number;
  testabilityScore: number;
  hasConflicts: boolean;
  requirement: FunctionalRequirement | NonFunctionalRequirement;
};

const RequirementTable: React.FC<RequirementTableProps> = ({
  functionalReqs,
  nonFunctionalReqs,
}) => {
  // Combine and transform requirements for table display
  const tableData: RequirementRow[] = [
    ...functionalReqs.map((fr) => ({
      id: fr.id,
      type: 'FR' as const,
      title: fr.title,
      description: fr.description,
      clarityScore: fr.clarityScore,
      testabilityScore: fr.testabilityScore,
      hasConflicts: fr.conflicts.length > 0,
      requirement: fr,
    })),
    ...nonFunctionalReqs.map((nfr) => ({
      id: nfr.id,
      type: 'NFR' as const,
      title: nfr.title,
      description: nfr.description,
      clarityScore: nfr.clarityScore,
      testabilityScore: nfr.testabilityScore,
      hasConflicts: nfr.conflicts.length > 0,
      requirement: nfr,
    })),
  ];

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const columns = [
    {
      header: 'ID',
      accessor: (item: RequirementRow) => (
        <span className="font-mono text-sm text-primary">{item.id}</span>
      ),
      sortable: true,
      sortKey: 'id' as keyof RequirementRow,
    },
    {
      header: 'Type',
      accessor: (item: RequirementRow) => (
        <Badge
          variant={item.type === 'FR' ? 'info' : 'warning'}
          className="text-xs"
        >
          {item.type}
        </Badge>
      ),
      sortable: true,
      sortKey: 'type' as keyof RequirementRow,
    },
    {
      header: 'Title',
      accessor: (item: RequirementRow) => (
        <span className="font-medium text-primary">{item.title}</span>
      ),
      sortable: true,
      sortKey: 'title' as keyof RequirementRow,
    },
    {
      header: 'Description',
      accessor: (item: RequirementRow) => (
        <p className="text-sm text-primary-muted line-clamp-2 max-w-md">
          {item.description}
        </p>
      ),
      className: 'max-w-md',
    },
    {
      header: 'Clarity',
      accessor: (item: RequirementRow) => (
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${getScoreColor(item.clarityScore)}`}>
            {item.clarityScore}
          </span>
          <div className="w-16 h-2 bg-surface2 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                item.clarityScore >= 80
                  ? 'bg-green-400'
                  : item.clarityScore >= 60
                  ? 'bg-yellow-400'
                  : 'bg-red-400'
              }`}
              style={{ width: `${item.clarityScore}%` }}
            />
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'clarityScore' as keyof RequirementRow,
    },
    {
      header: 'Testability',
      accessor: (item: RequirementRow) => (
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${getScoreColor(item.testabilityScore)}`}>
            {item.testabilityScore}
          </span>
          <div className="w-16 h-2 bg-surface2 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                item.testabilityScore >= 80
                  ? 'bg-green-400'
                  : item.testabilityScore >= 60
                  ? 'bg-yellow-400'
                  : 'bg-red-400'
              }`}
              style={{ width: `${item.testabilityScore}%` }}
            />
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'testabilityScore' as keyof RequirementRow,
    },
    {
      header: 'Conflicts',
      accessor: (item: RequirementRow) => (
        <div className="flex items-center gap-2">
          {item.hasConflicts ? (
            <Badge variant="danger" className="text-xs">
              {item.requirement.conflicts.length}
            </Badge>
          ) : (
            <span className="text-primary-muted text-sm">-</span>
          )}
        </div>
      ),
      sortable: true,
      sortKey: 'hasConflicts' as keyof RequirementRow,
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        data={tableData}
        searchable={true}
        searchPlaceholder="Search requirements..."
        pagination={true}
        itemsPerPage={10}
      />
    </div>
  );
};

export default RequirementTable;

