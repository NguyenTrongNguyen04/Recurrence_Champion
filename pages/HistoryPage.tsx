import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { HistoryItem } from '../types';
import { EllipsisVerticalIcon, DocumentArrowDownIcon, TrashIcon } from '../components/icons/Icons';
import { mockData } from '../data/mock';
import { useAuth } from '../contexts/AuthContext';
import { getUserAnalyses, deleteAnalysis, type SavedAnalysis } from '../services/analysisService';

const HistoryPage = () => {
  const { currentUser } = useAuth();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [analysisMenuOpen, setAnalysisMenuOpen] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);

  // Effect to close the dropdown if a click occurs outside of it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if the click is outside any element with the 'data-menu-container' attribute
      if (!target.closest('[data-menu-container]')) {
        setOpenMenu(null);
        setAnalysisMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load analyses from Firebase when user is available
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

  const handleExport = (runId: string, format: 'PDF' | 'CSV' | 'Excel') => {
    alert(`Exporting ${runId} as ${format}...`);
    setOpenMenu(null); // Close menu after action
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('Bạn có chắc muốn xóa phân tích này?')) return;

    try {
      await deleteAnalysis(analysisId);
      // Reload analyses
      if (currentUser) {
        const userAnalyses = await getUserAnalyses(currentUser.uid);
        setAnalyses(userAnalyses);
      }
      setAnalysisMenuOpen(null);
    } catch (error) {
      console.error('Error deleting analysis:', error);
      alert('Lỗi khi xóa phân tích. Vui lòng thử lại.');
    }
  };

  // Columns for Test Case Execution History
  const testHistoryColumns = [
    {
      header: 'Run #',
      accessor: (item: HistoryItem) => <span className="text-accent-cyan font-semibold">{item.runId}</span>,
    },
    { header: 'Total Tests', accessor: (item: HistoryItem) => item.tests },
    {
      header: 'Pass',
      accessor: (item: HistoryItem) => <span className="text-status-success">{item.pass}</span>,
    },
    {
      header: 'Fail',
      accessor: (item: HistoryItem) => <span className="text-status-danger">{item.fail}</span>,
    },
    { header: 'Duration', accessor: (item: HistoryItem) => item.duration },
    { header: 'Date/Time', accessor: (item: HistoryItem) => item.date },
    {
      header: 'Actions',
      accessor: (item: HistoryItem) => (
        <div className="relative" data-menu-container>
          <Button
            variant="ghost"
            className="px-2 py-1"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(openMenu === item.runId ? null : item.runId);
            }}
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </Button>
          {openMenu === item.runId && (
            <div className="absolute right-0 mt-2 w-48 bg-surface2 rounded-xl shadow-lg py-2 z-10 border border-surface">
              <button className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-muted hover:bg-surface2 hover:text-primary">
                View Details
              </button>
              <div className="border-t border-surface my-1"></div>
              <button
                onClick={() => handleExport(item.runId, 'PDF')}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-muted hover:bg-surface2 hover:text-primary"
              >
                <DocumentArrowDownIcon className="mr-3 w-5 h-5" /> Export as PDF
              </button>
              <button
                onClick={() => handleExport(item.runId, 'CSV')}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-muted hover:bg-surface2 hover:text-primary"
              >
                <DocumentArrowDownIcon className="mr-3 w-5 h-5" /> Export as CSV
              </button>
              <button
                onClick={() => handleExport(item.runId, 'Excel')}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-muted hover:bg-surface2 hover:text-primary"
              >
                <DocumentArrowDownIcon className="mr-3 w-5 h-5" /> Export as Excel
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  // Columns for Requirement Analysis History
  const analysisHistoryColumns = [
    {
      header: 'Document Name',
      accessor: (item: SavedAnalysis) => (
        <span className="font-medium text-primary">{item.documentName}</span>
      ),
    },
    {
      header: 'File Type',
      accessor: (item: SavedAnalysis) => (
        <span className="text-primary-muted uppercase">{item.documentType}</span>
      ),
    },
    {
      header: 'Total Requirements',
      accessor: (item: SavedAnalysis) => item.summary.totalRequirements,
    },
    {
      header: 'FR / NFR',
      accessor: (item: SavedAnalysis) => (
        <span className="text-primary-muted">
          {item.summary.functionalCount} / {item.summary.nonFunctionalCount}
        </span>
      ),
    },
    {
      header: 'Conflicts',
      accessor: (item: SavedAnalysis) => (
        <span className={item.summary.conflictsCount > 0 ? 'text-status-danger' : 'text-status-success'}>
          {item.summary.conflictsCount}
        </span>
      ),
    },
    {
      header: 'Analyzed At',
      accessor: (item: SavedAnalysis) => {
        const date = new Date(item.analyzedAt);
        return <span className="text-primary-muted">{date.toLocaleString('vi-VN')}</span>;
      },
    },
    {
      header: 'Actions',
      accessor: (item: SavedAnalysis) => (
        <div className="relative" data-menu-container>
          <Button
            variant="ghost"
            className="px-2 py-1"
            onClick={(e) => {
              e.stopPropagation();
              setAnalysisMenuOpen(analysisMenuOpen === item.id ? null : item.id);
            }}
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </Button>
          {analysisMenuOpen === item.id && (
            <div className="absolute right-0 mt-2 w-48 bg-surface2 rounded-xl shadow-lg py-2 z-10 border border-surface">
              <button className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-muted hover:bg-surface2 hover:text-primary">
                View Details
              </button>
              <div className="border-t border-surface my-1"></div>
              <button
                onClick={() => item.id && handleDeleteAnalysis(item.id)}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-status-danger hover:bg-surface2 hover:text-status-danger"
              >
                <TrashIcon className="mr-3 w-5 h-5" /> Delete
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">History</h1>

      {/* Card 1: Test Case Execution History */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-primary mb-2">Test Execution History</h2>
          <p className="text-sm text-primary-muted">Lịch sử chạy test cases</p>
        </div>
        {mockData.history.length > 0 ? (
          <Table columns={testHistoryColumns} data={mockData.history} />
        ) : (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-primary-muted">No test run history available</p>
          </div>
        )}
      </Card>

      {/* Card 2: Requirement Analysis History */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-primary mb-2">Requirement Analysis History</h2>
          <p className="text-sm text-primary-muted">Lịch sử phân tích requirement documents</p>
        </div>
        {loadingAnalyses ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-primary-muted">Đang tải...</span>
          </div>
        ) : !currentUser ? (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-primary-muted">Vui lòng đăng nhập để xem lịch sử phân tích</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-primary-muted">Chưa có phân tích nào được lưu</p>
          </div>
        ) : (
          <Table columns={analysisHistoryColumns} data={analyses} />
        )}
      </Card>
    </div>
  );
};

export default HistoryPage;
