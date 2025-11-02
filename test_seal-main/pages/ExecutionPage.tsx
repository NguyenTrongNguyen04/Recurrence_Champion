import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import { RunResult, Run } from '../types';
import { CheckCircleIcon, XCircleIcon, XIcon, TerminalIcon, InformationCircleIcon, ClipboardIcon, SparklesIcon } from '../components/icons/Icons';
import { apiService } from '../services/api.service';

// Sub-component for the new Test Log Modal
const TestLogModal = ({ isOpen, onClose, result }: { isOpen: boolean, onClose: () => void, result: RunResult | null }) => {
    if (!result) return null;

    const getLogLineClass = (line: string) => {
        if (line.startsWith('[SUCCESS]')) return 'text-status-success';
        if (line.startsWith('[ERROR]')) return 'text-status-danger';
        if (line.startsWith('[INFO]')) return 'text-primary-muted';
        return 'text-primary';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="p-2 -mt-8 -mx-6">
                <div className="flex justify-between items-center mb-6 px-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <TerminalIcon />
                        Test Execution Logs
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-surface2">
                        <XIcon />
                    </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6 px-4">
                    <Card className="!p-4 bg-surface2">
                        <div className="text-sm text-primary-muted mb-1">Status</div>
                        <Badge variant={result.status === 'pass' ? 'success' : 'danger'} className="uppercase font-bold tracking-wider">{result.status}</Badge>
                    </Card>
                    <Card className="!p-4 bg-surface2">
                        <div className="text-sm text-primary-muted mb-1">Duration</div>
                        <div className="font-semibold">{result.timeMs ? `${result.timeMs}ms` : 'N/A'}</div>
                    </Card>
                    {result.branch && (
                    <Card className="!p-4 bg-surface2">
                        <div className="text-sm text-primary-muted mb-1">Branch</div>
                        <div className="font-semibold">{result.branch}</div>
                    </Card>
                    )}
                    {result.author && (
                    <Card className="!p-4 bg-surface2">
                        <div className="text-sm text-primary-muted mb-1">Author</div>
                        <div className="font-semibold">{result.author}</div>
                    </Card>
                    )}
                </div>
                
                <div className="px-4 mb-6">
                    <details open>
                        <summary className="font-semibold cursor-pointer flex items-center gap-2 text-primary-muted hover:text-primary transition-colors">
                            <TerminalIcon className="w-5 h-5" /> Console Logs
                        </summary>
                        <pre className="mt-2 bg-background p-4 rounded-lg text-sm whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                            {result.log.split('\n').map((line, i) => (
                                <div key={i} className={getLogLineClass(line)}>{line}</div>
                            ))}
                        </pre>
                    </details>
                </div>

                {result.status === 'fail' && (
                    <>
                        {result.error && (
                        <div className="px-4 mb-4">
                            <div className="border border-status-danger/50 bg-status-danger/10 p-4 rounded-lg">
                                <h3 className="font-semibold flex items-center gap-2 text-status-danger mb-2">
                                    <InformationCircleIcon className="w-5 h-5" /> Error Details
                                </h3>
                                <p className="text-sm text-status-danger font-mono">{result.error}</p>
                            </div>
                        </div>
                        )}
                        {result.aiSuggestion && (
                        <div className="px-4 mb-6">
                            <div className="border border-accent-violet/50 bg-accent-violet/10 p-4 rounded-lg">
                                <h3 className="font-semibold flex items-center gap-2 text-accent-violet mb-2">
                                    <SparklesIcon className="w-5 h-5" /> AI-Powered Suggestions
                                </h3>
                                    <div className="space-y-2">
                                        <div>
                                            <h4 className="font-medium text-sm mb-1">Cause:</h4>
                                            <p className="text-sm whitespace-pre-wrap">{result.aiSuggestion.cause}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm mb-1">Suggestion:</h4>
                                            <p className="text-sm whitespace-pre-wrap">{result.aiSuggestion.suggestion}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-sm">Severity:</h4>
                                            <Badge variant={result.aiSuggestion.severity === 'high' ? 'danger' : result.aiSuggestion.severity === 'medium' ? 'warning' : 'success'}>
                                                {result.aiSuggestion.severity}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="px-4 text-xs text-primary-muted border-t border-surface2 pt-4">
                    Executed At: {result.executedAt || 'N/A'}
                </div>
            </div>
        </Modal>
    );
};

const ExecutionPage = () => {
    const [run, setRun] = useState<Run | null>(null);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isCodeModalOpen, setCodeModalOpen] = useState(false);
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [drawerHasBeenClosed, setDrawerHasBeenClosed] = useState(false); // Track if user manually closed drawer
    const [isLogModalOpen, setLogModalOpen] = useState(false);
    const [selectedResult, setSelectedResult] = useState<RunResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [testCaseCode, setTestCaseCode] = useState<string>('');

    useEffect(() => {
        const runId = localStorage.getItem('currentRunId');
        if (runId) {
            loadRunData(runId);
            // Poll for updates while running
            const interval = setInterval(() => {
                loadRunData(runId);
            }, 2000); // Poll every 2 seconds

            return () => clearInterval(interval);
        } else {
            setError('No test run found. Please start a test run from the Analyze page.');
            setLoading(false);
        }
    }, []);

    // Stop polling when complete
    useEffect(() => {
        if (isComplete && run) {
            // Final update
            loadRunData(run.id);
        }
    }, [isComplete]);

    const loadRunData = async (runId: string) => {
        try {
            const runData = await apiService.getTestRun(runId);
            
            if (runData) {
                setRun(runData);
                
                // Calculate progress
                const total = runData.total || 0;
                const completed = (runData.passed || 0) + (runData.failed || 0) + (runData.skipped || 0);
                const progressValue = total > 0 ? Math.round((completed / total) * 100) : 0;
                setProgress(progressValue);

                // Check if complete (không còn pending hoặc running)
                const stillRunning = runData.results.some(r => r.status === 'running' || r.status === 'pending');
                if (!stillRunning && runData.results.length > 0 && !isComplete) {
                    setIsComplete(true);
                    // Show drawer if there are failures - CHỈ MỞ LẦN ĐẦU KHI COMPLETE
                    const failures = runData.results.filter(r => r.status === 'fail' && r.aiSuggestion);
                    if (failures.length > 0 && !drawerHasBeenClosed) {
                        setDrawerOpen(true);
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load test run data');
        } finally {
            setLoading(false);
        }
    };

    const handleViewLog = (result: RunResult) => {
        setSelectedResult(result);
        setLogModalOpen(true);
    };

    const handleViewCode = async (result: RunResult) => {
        setSelectedResult(result);
        setCodeModalOpen(true);
        
        // Get test case code
        try {
            const sessionId = localStorage.getItem('currentSessionId');
            if (sessionId) {
                const { code } = await apiService.getTestCaseCode(result.testId, sessionId);
                setTestCaseCode(code || 'Test code not available');
            } else {
                setTestCaseCode('Session ID not found');
            }
        } catch (err: any) {
            console.error('Failed to load test code:', err);
            setTestCaseCode('Failed to load test code');
        }
    };

    const getFailedTests = () => {
        if (!run) return [];
        return run.results.filter(r => r.status === 'fail' && r.aiSuggestion);
    };

    const columns = [
        { header: 'Test Name', accessor: (item: RunResult) => item.name },
        { 
            header: 'Status', 
            accessor: (item: RunResult) => {
                // Pending status - chờ bắt đầu chạy
                if (item.status === 'pending') {
                    return (
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 flex items-center justify-center">
                                <div className="w-3 h-3 bg-primary-muted rounded-full"></div>
                            </div>
                            <Badge variant="info" className="px-5 py-2 text-sm uppercase">Pending</Badge>
                        </div>
                    )
                }
                // Running status - đang chạy
                if (item.status === 'running') {
                    return (
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 flex items-center justify-center">
                                <div className="w-4 h-4 bg-accent-cyan rounded-full animate-spin"></div>
                            </div>
                            <Badge variant="running" className="px-5 py-2 text-sm uppercase">Running</Badge>
                        </div>
                    )
                }
                // Pass/Fail/Skip status - đã hoàn thành
                const isPass = item.status === 'pass';
                const icon = isPass ? <CheckCircleIcon className="text-status-success w-7 h-7" /> : <XCircleIcon className="text-status-danger w-7 h-7" />;
                const badgeVariant = isPass ? 'success' : item.status === 'skipped' ? 'warning' : 'danger';
                const badgeText = isPass ? 'PASS' : item.status === 'skipped' ? 'SKIP' : 'FAIL';
    
                return (
                    <div className="flex items-center gap-3">
                        {icon}
                        <Badge variant={badgeVariant} className="px-5 py-2 text-sm">
                            {badgeText}
                        </Badge>
                    </div>
                )
            }
        },
        { header: 'Duration', accessor: (item: RunResult) => item.timeMs ? `${item.timeMs}ms` : '...' },
        {
            header: 'Actions',
            accessor: (item: RunResult) => (
                <div className="space-x-2">
                    <Button 
                        variant="ghost" 
                        className="px-3 py-1 text-xs hover:bg-surface2 transition-colors" 
                        onClick={() => handleViewCode(item)}
                    >
                        View Code
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="px-3 py-1 text-xs hover:bg-surface2 transition-colors" 
                        onClick={() => handleViewLog(item)}
                    >
                        View Log
                    </Button>
                </div>
            )
        },
    ];

    if (loading) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">Test Execution</h1>
                <Card>
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-primary-muted">Loading test run...</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">Test Execution</h1>
                <Card>
                    <div className="text-center py-12">
                        <div className="text-status-danger text-xl mb-4">⚠️ Error</div>
                        <p className="text-primary-muted mb-4">{error}</p>
                        <Button onClick={() => window.location.href = '/#/analyze'}>Go to Analyze Page</Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!run) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">Test Execution</h1>
                <Card>
                    <div className="text-center py-12">
                        <p className="text-primary-muted">No test run data available</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Test Execution</h1>
            
            <Card className="border-accent-cyan/20 shadow-glow-ai">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-accent-cyan" />
                            Run Progress
                        </h2>
                        {isComplete && (
                            <Badge 
                                variant={run.failed > 0 ? 'danger' : 'success'}
                                className="px-4 py-1.5 animate-pulse"
                            >
                                {run.failed > 0 ? '✗ Complete with Failures' : '✓ All Tests Passed'}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                        <ProgressBar progress={progress} />
                        </div>
                        <span className="font-semibold text-lg min-w-[60px] text-right">{progress}%</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Badge variant="info" className="px-3 py-1.5">Total: {run.total}</Badge>
                        <Badge variant="success" className="px-3 py-1.5 animate-fade-in">
                            <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                            Passed: {run.passed}
                        </Badge>
                        {run.failed > 0 && (
                            <Badge variant="danger" className="px-3 py-1.5 animate-fade-in">
                                <XCircleIcon className="w-4 h-4 inline mr-1" />
                                Failed: {run.failed}
                            </Badge>
                        )}
                        {run.skipped > 0 && <Badge variant="warning" className="px-3 py-1.5">Skipped: {run.skipped}</Badge>}
                        <Badge variant="info" className="px-3 py-1.5">
                            Duration: {(run.durationMs / 1000).toFixed(2)}s
                        </Badge>
                    </div>
                </div>
            </Card>

            <Card className="border-surface2/50">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Test Results</h2>
                    {run.results.length > 0 && (
                        <span className="text-sm text-primary-muted">
                            Showing {run.results.length} result{run.results.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                {run.results.length === 0 ? (
                    <div className="text-center py-12 text-primary-muted">
                        <div className="inline-block w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p>Waiting for test results...</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg">
                        <Table columns={columns} data={run.results} />
                    </div>
                )}
            </Card>

            <TestLogModal isOpen={isLogModalOpen} onClose={() => setLogModalOpen(false)} result={selectedResult} />
            
            <Modal isOpen={isCodeModalOpen} onClose={() => setCodeModalOpen(false)} title="Test Code">
                <div className="space-y-4">
                    {selectedResult && (
                        <>
                            <div className="bg-surface2/50 p-3 rounded-lg border border-surface2/50">
                                <div className="text-sm font-semibold text-primary-muted mb-1">Test Name:</div>
                                <div className="text-primary font-medium">{selectedResult.name}</div>
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-primary-muted mb-2">Test Code:</div>
                                <pre className="bg-background border border-surface2 p-4 rounded-lg text-xs text-primary font-mono whitespace-pre-wrap overflow-x-auto max-h-[70vh] shadow-inner">
                                    <code className="block">{testCaseCode || 'Loading...'}</code>
                                </pre>
                            </div>
                            {selectedResult.error && (
                                <div className="bg-status-danger/10 border border-status-danger/50 p-3 rounded-lg">
                                    <div className="text-sm font-semibold text-status-danger mb-1">Error:</div>
                                    <div className="text-sm text-status-danger">{selectedResult.error}</div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Modal>
            
            <Drawer isOpen={isDrawerOpen} onClose={() => {
                setDrawerOpen(false);
                setDrawerHasBeenClosed(true); // Mark that user manually closed drawer
            }} title="AI Failure Analysis">
                <div className="space-y-6">
                    {getFailedTests().map((failure) => (
                        <Card key={failure.id} className="bg-surface2">
                            <h3 className="font-bold text-lg">{failure.name}</h3>
                            {failure.error && (
                                <p className="text-sm text-status-danger mb-4">
                                    <code>{failure.error}</code>
                                </p>
                            )}
                            
                            {failure.aiSuggestion && (
                            <div className="space-y-3 text-sm">
                                <div>
                                    <h4 className="font-semibold text-primary-muted">Cause:</h4>
                                        <p>{failure.aiSuggestion.cause}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-primary-muted">Suggestion:</h4>
                                        <p>{failure.aiSuggestion.suggestion}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-primary-muted">Severity:</h4>
                                        <Badge variant={failure.aiSuggestion.severity === 'high' ? 'danger' : failure.aiSuggestion.severity === 'medium' ? 'warning' : 'success'}>
                                            {failure.aiSuggestion.severity}
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                    {getFailedTests().length > 0 && (
                        <Button 
                            className="w-full flex items-center justify-center gap-2" 
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(getFailedTests().map(f => f.aiSuggestion), null, 2))}
                        >
                        <ClipboardIcon /> Copy Summary
                    </Button>
                    )}
                </div>
            </Drawer>
        </div>
    );
};

export default ExecutionPage;
