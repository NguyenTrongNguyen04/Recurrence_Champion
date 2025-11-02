import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { HistoryItem } from '../types';
import { EllipsisVerticalIcon, DocumentArrowDownIcon } from '../components/icons/Icons';
import { apiService } from '../services/api.service';

const HistoryPage = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        loadHistory();
    }, [page]);

    // Effect to close the dropdown if a click occurs outside of it.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-menu-container]')) {
                setOpenMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await apiService.getHistory(pageSize * page);
            setHistory(data);
            setTotalPages(Math.ceil(data.length / pageSize));
        } catch (err: any) {
            setError(err.message || 'Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (runId: string, format: 'PDF' | 'CSV' | 'Excel') => {
        alert(`Exporting ${runId} as ${format}...`);
        setOpenMenu(null);
    };

    const paginatedHistory = history.slice((page - 1) * pageSize, page * pageSize);

    const historyColumns = [
        { header: 'Run #', accessor: (item: HistoryItem) => <span className="text-accent-cyan font-semibold">{item.runId}</span> },
        { header: 'Total Tests', accessor: (item: HistoryItem) => item.tests },
        { header: 'Pass', accessor: (item: HistoryItem) => <span className="text-status-success">{item.pass}</span> },
        { header: 'Fail', accessor: (item: HistoryItem) => <span className="text-status-danger">{item.fail}</span> },
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
                            <button className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-muted hover:bg-surface hover:text-white">
                                View Details
                            </button>
                            <div className="border-t border-surface my-1"></div>
                            <button onClick={() => handleExport(item.runId, 'PDF')} className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-muted hover:bg-surface hover:text-white">
                                <DocumentArrowDownIcon className="mr-3 w-5 h-5" /> Export as PDF
                            </button>
                            <button onClick={() => handleExport(item.runId, 'CSV')} className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-muted hover:bg-surface hover:text-white">
                                <DocumentArrowDownIcon className="mr-3 w-5 h-5" /> Export as CSV
                            </button>
                            <button onClick={() => handleExport(item.runId, 'Excel')} className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-muted hover:bg-surface hover:text-white">
                                <DocumentArrowDownIcon className="mr-3 w-5 h-5" /> Export as Excel
                            </button>
                        </div>
                    )}
                </div>
            )
        },
    ];
    
    if (loading) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">Run History</h1>
                <Card>
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-primary-muted">Loading history...</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">Run History</h1>
                <Card>
                    <div className="text-center py-12">
                        <div className="text-status-danger text-xl mb-4">⚠️ Error</div>
                        <p className="text-primary-muted">{error}</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Run History</h1>
            <Card>
                {history.length === 0 ? (
                    <div className="text-center py-12 text-primary-muted">
                        No test run history available
                    </div>
                ) : (
                    <>
                        <Table columns={historyColumns} data={paginatedHistory} />
                        <div className="flex justify-between items-center mt-4">
                            <p className="text-sm text-primary-muted">
                                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, history.length)} of {history.length} results
                            </p>
                            <div className="space-x-2">
                                <Button 
                                    variant="secondary" 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default HistoryPage;
