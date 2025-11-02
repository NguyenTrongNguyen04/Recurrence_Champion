import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { HistoryItem } from '../types';
import { EllipsisVerticalIcon, DocumentArrowDownIcon } from '../components/icons/Icons';

const HistoryPage = () => {
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    // Effect to close the dropdown if a click occurs outside of it.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Check if the click is outside any element with the 'data-menu-container' attribute
            if (!target.closest('[data-menu-container]')) {
                setOpenMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleExport = (runId: string, format: 'PDF' | 'CSV' | 'Excel') => {
        alert(`Exporting ${runId} as ${format}...`);
        setOpenMenu(null); // Close menu after action
    };

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
                            <button className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-muted hover:bg-surface2 hover:text-primary">
                                View Details
                            </button>
                            <div className="border-t border-surface my-1"></div>
                            <button onClick={() => handleExport(item.runId, 'PDF')} className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-muted hover:bg-surface2 hover:text-primary">
                                <DocumentArrowDownIcon className="mr-3 w-5 h-5" /> Export as PDF
                            </button>
                            <button onClick={() => handleExport(item.runId, 'CSV')} className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-muted hover:bg-surface2 hover:text-primary">
                                 <DocumentArrowDownIcon className="mr-3 w-5 h-5" /> Export as CSV
                            </button>
                            <button onClick={() => handleExport(item.runId, 'Excel')} className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-muted hover:bg-surface2 hover:text-primary">
                                 <DocumentArrowDownIcon className="mr-3 w-5 h-5" /> Export as Excel
                            </button>
                        </div>
                    )}
                </div>
            )
        },
    ];
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Run History</h1>
            <Card>
                 <Table columns={historyColumns} data={[]} />
                 <div className="flex justify-between items-center mt-4">
                     <p className="text-sm text-primary-muted">No test run history available</p>
                 </div>
            </Card>
        </div>
    );
};

export default HistoryPage;