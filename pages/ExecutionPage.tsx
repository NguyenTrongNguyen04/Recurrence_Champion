import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import { RunResult, SuggestedTest } from '../types';
import { CheckCircleIcon, XCircleIcon, XIcon, TerminalIcon, InformationCircleIcon, ClipboardIcon, SparklesIcon } from '../components/icons/Icons';
import { API_ENDPOINTS } from '../config/api';

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
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6 px-4">
                    <Card className="!p-4 bg-surface2">
                        <div className="text-sm text-primary-muted mb-1">Status</div>
                        <Badge variant={result.status === 'pass' ? 'success' : 'danger'} className="uppercase font-bold tracking-wider">{result.status}</Badge>
                    </Card>
                    <Card className="!p-4 bg-surface2">
                        <div className="text-sm text-primary-muted mb-1">Duration</div>
                        <div className="font-semibold">{result.timeMs}ms</div>
                    </Card>
                    <Card className="!p-4 bg-surface2">
                        <div className="text-sm text-primary-muted mb-1">Branch</div>
                        <div className="font-semibold">{result.branch}</div>
                    </Card>
                    <Card className="!p-4 bg-surface2">
                        <div className="text-sm text-primary-muted mb-1">Author</div>
                        <div className="font-semibold">{result.author}</div>
                    </Card>
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
                        <div className="px-4 mb-4">
                            <div className="border border-status-danger/50 bg-status-danger/10 p-4 rounded-lg">
                                <h3 className="font-semibold flex items-center gap-2 text-status-danger mb-2">
                                    <InformationCircleIcon className="w-5 h-5" /> Error Details
                                </h3>
                                <p className="text-sm text-status-danger font-mono">{result.error}</p>
                            </div>
                        </div>
                        <div className="px-4 mb-6">
                            <div className="border border-accent-violet/50 bg-accent-violet/10 p-4 rounded-lg">
                                <h3 className="font-semibold flex items-center gap-2 text-accent-violet mb-2">
                                    <SparklesIcon className="w-5 h-5" /> AI-Powered Suggestions
                                </h3>
                                <p className="text-sm whitespace-pre-wrap">{result.aiSuggestion?.suggestion}</p>
                            </div>
                        </div>
                    </>
                )}

                <div className="px-4 text-xs text-primary-muted border-t border-surface2 pt-4">
                    Executed At: {result.executedAt}
                </div>
            </div>
        </Modal>
    );
};

const ExecutionPage = () => {
    const [runResults, setRunResults] = useState<RunResult[]>([]);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isCodeModalOpen, setCodeModalOpen] = useState(false);
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [generatedTestCode, setGeneratedTestCode] = useState<string>('');
    const [framework, setFramework] = useState<string>('unknown');
    const [language, setLanguage] = useState<string>('unknown');
    const [executionMode, setExecutionMode] = useState<'real' | 'simulation' | null>(null);
    
    // State for the new modal
    const [isLogModalOpen, setLogModalOpen] = useState(false);
    const [selectedResult, setSelectedResult] = useState<RunResult | null>(null);

    useEffect(() => {
        let isMounted = true; // Flag để tránh update state sau khi component unmount
        
        const executeTests = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // Get selected tests và context từ sessionStorage
                const selectedTestsStr = sessionStorage.getItem('selectedTests');
                const contextStr = sessionStorage.getItem('executeContext');
                
                if (!selectedTestsStr) {
                    setError('No tests selected. Please go back and select tests to run.');
                    setIsLoading(false);
                    return;
                }
                
                const selectedTests: SuggestedTest[] = JSON.parse(selectedTestsStr);
                const context = contextStr ? JSON.parse(contextStr) : {};
                
                // Sắp xếp test cases: Happy case (unit/happy_path) trước, negative/edge sau
                const sortedTests = [...selectedTests].sort((a, b) => {
                    // Ưu tiên theo type: unit/happy_path > integration > edge > negative
                    const typePriority: Record<string, number> = {
                        'unit': 1,
                        'happy_path': 1,
                        'integration': 2,
                        'edge': 3,
                        'negative': 4
                    };
                    
                    const priorityA = typePriority[a.type] || 5;
                    const priorityB = typePriority[b.type] || 5;
                    
                    // Nếu cùng priority, sắp xếp theo complexity (S < M < L)
                    if (priorityA === priorityB) {
                        const complexityOrder: Record<string, number> = { 'S': 1, 'M': 2, 'L': 3 };
                        const compA = complexityOrder[a.complexity] || 4;
                        const compB = complexityOrder[b.complexity] || 4;
                        return compA - compB;
                    }
                    
                    return priorityA - priorityB;
                });
                
                // Prepare test cases for API (đã được sắp xếp)
                const testCases = sortedTests.map(tc => ({
                    id: tc.id,
                    name: tc.name,
                    function: tc.function,
                    type: tc.type,
                    complexity: tc.complexity,
                    // Include additional fields nếu có
                    description: (tc as any).description || '',
                    steps: (tc as any).steps || [],
                    expectedResult: (tc as any).expectedResult || ''
                }));
                
                // Update initial results theo thứ tự đã sắp xếp
                const initialResults: RunResult[] = sortedTests.map((tc, idx) => ({
                    id: idx + 1,
                    name: tc.name,
                    status: 'running' as const,
                    timeMs: null,
                    log: `[INFO] Preparing to run test: ${tc.name}...`,
                    branch: 'main',
                    author: 'System'
                }));
                
                setRunResults(initialResults);
                setProgress(0);
                
                // Call API to execute tests
                const response = await fetch(API_ENDPOINTS.EXECUTE_TESTS, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        test_cases: testCases,
                        original_code: context.original_code || '',
                        language: context.language || 'unknown',
                        framework: null, // Auto-detect
                        risks: context.risks || [], // Truyền risks từ analysis
                        // Truyền generated unit test code từ AI Analysis Agent (nếu có)
                        generated_unit_test_code: context.generated_unit_test_code || '',
                        unit_test_framework: context.unit_test_framework || '',
                        unit_test_cases: context.unit_test_cases || []
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                    throw new Error(errorData.detail || `HTTP ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'Execution failed');
                }
                
                // Update UI with results
                // Ưu tiên lấy language từ execution result (AI Agent đã detect)
                // Hoặc từ generated_code.language hoặc summary.language
                const detectedLanguage = data.execution?.language || 
                                        data.generated_code?.language ||
                                        data.summary?.language ||
                                        context.language || // Fallback về context từ AnalyzePage
                                        'unknown';
                
                setFramework(data.summary?.framework || data.generated_code?.framework || 'unknown');
                setLanguage(detectedLanguage);
                setGeneratedTestCode(data.generated_code?.code || '');
                setExecutionMode(data.execution?.execution_mode || 'simulation');
                
                const execution = data.execution || {};
                const results = execution.results || [];
                
                // Convert API results to RunResult format - match by test name to ensure correct mapping
                // Create a map of results by name for accurate matching
                const resultsMap = new Map<string, any>();
                results.forEach((r: any) => {
                    const testName = r.name || '';
                    // Store both exact name and normalized name (lowercase, no spaces)
                    resultsMap.set(testName, r);
                    resultsMap.set(testName.toLowerCase().trim(), r);
                });
                
                // Also create a function name map for additional matching
                const functionMap = new Map<string, any>();
                sortedTests.forEach((tc) => {
                    if (tc.function) {
                        // Try to find matching result by function name
                        for (const [resultName, resultData] of resultsMap.entries()) {
                            if (resultName.toLowerCase().includes(tc.function.toLowerCase()) ||
                                tc.function.toLowerCase().includes(resultName.toLowerCase().split('_')[0])) {
                                functionMap.set(tc.function.toLowerCase(), resultData);
                                break;
                            }
                        }
                    }
                });
                
                // Debug: Log matching info
                console.log('[ExecutionPage] API Results:', results.length);
                console.log('[ExecutionPage] Sorted Tests:', sortedTests.length);
                console.log('[ExecutionPage] Results Map keys:', Array.from(resultsMap.keys()));
                
                // Map results back to sorted test order, matching by name
                // Use stricter matching - only use fallback if absolutely necessary
                const finalResults: RunResult[] = sortedTests.map((tc, idx) => {
                    // Try exact match first
                    let apiResult = resultsMap.get(tc.name);
                    
                    // Try normalized match (lowercase, trimmed)
                    if (!apiResult) {
                        apiResult = resultsMap.get(tc.name.toLowerCase().trim());
                    }
                    
                    // If no exact match, try partial match (test name contains tc.name or vice versa)
                    if (!apiResult) {
                        for (const [resultName, resultData] of resultsMap.entries()) {
                            // Skip function-based keys
                            if (resultName.startsWith('func:')) continue;
                            
                            const tcNameLower = tc.name.toLowerCase().trim();
                            const resultNameLower = resultName.toLowerCase().trim();
                            
                            // More flexible matching: check if names match after removing common prefixes/suffixes
                            const tcNameClean = tcNameLower.replace(/^test_?|_test$/g, '').replace(/[_\s]/g, '');
                            const resultNameClean = resultNameLower.replace(/^test_?|_test$/g, '').replace(/[_\s]/g, '');
                            
                            if (tcNameLower === resultNameLower || 
                                resultNameLower.includes(tcNameLower) || 
                                tcNameLower.includes(resultNameLower) ||
                                tcNameClean === resultNameClean ||
                                tcNameClean.includes(resultNameClean) ||
                                resultNameClean.includes(tcNameClean)) {
                                apiResult = resultData;
                                console.log(`[ExecutionPage] Matched "${tc.name}" with "${resultName}"`);
                                break;
                            }
                        }
                    }
                    
                    // Try matching by function name if test case has function field
                    if (!apiResult && tc.function) {
                        apiResult = functionMap.get(tc.function.toLowerCase());
                        if (apiResult) {
                            console.log(`[ExecutionPage] Matched "${tc.name}" by function "${tc.function}"`);
                        }
                    }
                    
                    // Last resort: use index-based fallback (only if we have enough results)
                    if (!apiResult && idx < results.length) {
                        apiResult = results[idx];
                        console.log(`[ExecutionPage] Using index-based fallback for "${tc.name}" (idx ${idx})`);
                    }
                    
                    if (!apiResult) {
                        // If no matching result found, check if execution is complete
                        // If execution is complete and we still don't have result, mark as failed
                        console.warn(`[ExecutionPage] No result found for test: ${tc.name}`);
                        return {
                            id: idx + 1,
                            name: tc.name,
                            status: 'fail' as const, // Mark as failed instead of running if no result found
                            timeMs: 0,
                            log: `[ERROR] Test result not found for: ${tc.name}. Execution may have failed.`,
                            error: 'Test execution result not found',
                            branch: 'main',
                            author: 'System',
                            executedAt: new Date().toISOString(),
                            executionMode: execution.execution_mode || 'simulation'
                        };
                    }
                    
                    // Normalize status - ensure it's either 'pass' or 'fail'
                    // Backend should always return 'pass' or 'fail', but handle edge cases
                    let status: 'pass' | 'fail' = 'fail'; // Default to fail if unclear
                    const apiStatus = String(apiResult.status || '').toLowerCase().trim();
                    if (apiStatus === 'pass' || apiStatus === 'passed' || apiStatus === 'success') {
                        status = 'pass';
                    } else if (apiStatus === 'fail' || apiStatus === 'failed' || apiStatus === 'failure') {
                        status = 'fail';
                    } else {
                        // If status is unclear, check other indicators
                        // If there's an error, it's a fail
                        if (apiResult.error) {
                            status = 'fail';
                        } else if (apiResult.timeMs && apiResult.timeMs > 0) {
                            // If test has duration and no error, assume pass
                            status = 'pass';
                        } else {
                            // Default to fail if we can't determine
                            status = 'fail';
                        }
                        console.warn(`[ExecutionPage] Unclear status "${apiResult.status}" for test "${tc.name}", defaulting to "${status}"`);
                    }
                    
                    return {
                        id: apiResult.id || idx + 1,
                        name: apiResult.name || tc.name,
                        status: status,
                        timeMs: apiResult.timeMs || 0,
                        log: apiResult.log || '',
                        error: apiResult.error,
                        branch: 'main',
                        author: 'System',
                        executedAt: apiResult.executedAt || new Date().toISOString(),
                        executionMode: execution.execution_mode || 'simulation'
                    };
                });
                
                // If API returned more results than sorted tests, append them
                // But first check if they're duplicates
                if (results.length > sortedTests.length) {
                    const existingNames = new Set(finalResults.map(r => r.name.toLowerCase()));
                    results.slice(sortedTests.length).forEach((r: any, idx: number) => {
                        const rName = (r.name || '').toLowerCase();
                        if (!existingNames.has(rName)) {
                            // Normalize status
                            let status: 'pass' | 'fail' = 'fail';
                            const apiStatus = String(r.status || '').toLowerCase().trim();
                            if (apiStatus === 'pass' || apiStatus === 'passed' || apiStatus === 'success') {
                                status = 'pass';
                            } else if (apiStatus === 'fail' || apiStatus === 'failed' || apiStatus === 'failure') {
                                status = 'fail';
                            } else if (r.error) {
                                status = 'fail';
                            } else if (r.timeMs && r.timeMs > 0) {
                                status = 'pass';
                            }
                            
                            finalResults.push({
                                id: r.id || sortedTests.length + idx + 1,
                                name: r.name || `Test ${sortedTests.length + idx + 1}`,
                                status: status,
                                timeMs: r.timeMs || 0,
                                log: r.log || '',
                                error: r.error,
                                branch: 'main',
                                author: 'System',
                                executedAt: r.executedAt || new Date().toISOString(),
                                executionMode: execution.execution_mode || 'simulation'
                            });
                            existingNames.add(rName);
                        }
                    });
                }
                
                // Only update state if component is still mounted
                if (!isMounted) return;
                
                // Set all states together để tránh multiple re-renders
                setRunResults(finalResults);
                setProgress(100);
                setIsComplete(true);
                
                // Show drawer nếu có failed tests
                const failedCount = finalResults.filter(r => r.status === 'fail').length;
                if (failedCount > 0) {
                    setDrawerOpen(true);
                }
                
            } catch (err: any) {
                if (!isMounted) return;
                console.error('Error executing tests:', err);
                setError(err.message || 'Failed to execute tests');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        
        executeTests();
        
        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, []);

    const handleViewLog = (result: RunResult) => {
        setSelectedResult(result);
        setLogModalOpen(true);
    };

    const columns = [
        { header: 'Test Name', accessor: (item: RunResult) => item.name },
        { 
            header: 'Status', 
            accessor: (item: RunResult) => {
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
                const isPass = item.status === 'pass';
                const icon = isPass ? <CheckCircleIcon className="text-status-success w-7 h-7" /> : <XCircleIcon className="text-status-danger w-7 h-7" />;
                const badgeVariant = isPass ? 'success' : 'danger';
                const badgeText = isPass ? 'PASS' : 'FAIL';
    
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
                    <Button variant="ghost" className="px-3 py-1 text-xs" onClick={() => setCodeModalOpen(true)}>View Code</Button>
                    <Button variant="ghost" className="px-3 py-1 text-xs" onClick={() => handleViewLog(item)}>View Log</Button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Test Execution</h1>
            
            <Card>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Run Progress</h2>
                        {isComplete && (
                            <Badge variant={runResults.filter(r => r.status === 'fail').length > 0 ? 'danger' : 'success'}>
                                Run Complete
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <ProgressBar progress={progress} />
                        <span className="font-semibold">{progress}%</span>
                    </div>
                    <div className="flex space-x-4 items-center">
                        <Badge variant="info">Selected: {runResults.length}</Badge>
                        <Badge variant="info">Framework: {framework}</Badge>
                        <Badge variant="info">Language: {language}</Badge>
                        {executionMode && (
                            <span 
                                title={executionMode === 'real' ? 'Tests are executed using real pytest' : 'Tests are simulated (pytest not available or execution failed)'}
                            >
                                <Badge 
                                    variant={executionMode === 'real' ? 'success' : 'warning'}
                                >
                                    {executionMode === 'real' ? '✓ Real Execution' : '⚠ Simulation'}
                                </Badge>
                            </span>
                        )}
                        {generatedTestCode && (
                            <Button 
                                variant="secondary" 
                                onClick={() => setCodeModalOpen(true)}
                                className="ml-auto flex items-center gap-2"
                            >
                                <ClipboardIcon className="w-4 h-4" />
                                View Generated Test Code
                            </Button>
                        )}
                    </div>
                    {error && (
                        <div className="bg-status-danger/10 border border-status-danger/50 p-4 rounded-lg text-status-danger">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Results</h2>
                <Table columns={columns} data={runResults} />
            </Card>

            {generatedTestCode && (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ClipboardIcon className="w-6 h-6" />
                            Generated Test Code
                        </h2>
                        <div className="flex gap-2">
                            <Badge variant="info">{framework}</Badge>
                            <Badge variant="info">{language}</Badge>
                            <Button 
                                variant="ghost" 
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedTestCode);
                                    alert('Test code copied to clipboard!');
                                }}
                                className="flex items-center gap-2"
                            >
                                <ClipboardIcon className="w-4 h-4" />
                                Copy
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <pre className="bg-background p-4 rounded-lg text-sm text-primary-muted whitespace-pre-wrap max-h-96 overflow-y-auto font-mono border border-surface2">
                            <code>
                                {generatedTestCode}
                            </code>
                        </pre>
                        <p className="text-xs text-primary-muted">
                            💡 This is the test code generated by AI Agent. You can copy it and save to a file with appropriate extension.
                        </p>
                    </div>
                </Card>
            )}

            <TestLogModal isOpen={isLogModalOpen} onClose={() => setLogModalOpen(false)} result={selectedResult} />
            
            <Modal isOpen={isCodeModalOpen} onClose={() => setCodeModalOpen(false)} title={`Generated Test Code (${framework})`}>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <Badge variant="info">{framework}</Badge>
                            <Badge variant="info">{language}</Badge>
                        </div>
                        <Button 
                            variant="ghost" 
                            onClick={() => {
                                if (generatedTestCode) {
                                    navigator.clipboard.writeText(generatedTestCode);
                                    alert('Test code copied to clipboard!');
                                }
                            }}
                            className="flex items-center gap-2"
                            disabled={!generatedTestCode}
                        >
                            <ClipboardIcon className="w-4 h-4" />
                            Copy Code
                        </Button>
                    </div>
                    <pre className="bg-background p-4 rounded-lg text-sm text-primary-muted whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                        <code>
                            {generatedTestCode || 'No test code generated yet'}
                        </code>
                    </pre>
                    {generatedTestCode && (
                        <div className="text-xs text-primary-muted bg-surface2 p-2 rounded">
                            💡 Tip: You can copy this test code and save it to a file with the appropriate extension (e.g., {language === 'java' ? '.java' : language === 'python' ? '.py' : language === 'javascript' ? '.js' : '.test'})
                        </div>
                    )}
                </div>
            </Modal>
            
            <Drawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} title="Test Execution Results">
                <div className="space-y-6">
                    {runResults.filter(r => r.status === 'fail').map((failure, index) => (
                        <Card key={index} className="bg-surface2">
                            <h3 className="font-bold text-lg">{failure.name}</h3>
                            {failure.error && (
                                <p className="text-sm text-status-danger mb-4"><code>{failure.error}</code></p>
                            )}
                            
                            {failure.log && (
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <h4 className="font-semibold text-primary-muted mb-2">Log:</h4>
                                        <pre className="bg-background p-3 rounded text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                                            {failure.log}
                                        </pre>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-primary-muted">Duration:</h4>
                                        <Badge variant="info">{failure.timeMs}ms</Badge>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                    {runResults.filter(r => r.status === 'fail').length === 0 && (
                        <p className="text-primary-muted">All tests passed! 🎉</p>
                    )}
                </div>
            </Drawer>

        </div>
    );
};

export default ExecutionPage;