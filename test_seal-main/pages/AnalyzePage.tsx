import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import { SuggestedTest, Repo, AISummary } from '../types';
import { DocumentTextIcon, PlayIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon } from '../components/icons/Icons';
import { apiService } from '../services/api.service';

const AnalyzePage = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState<SuggestedTest[]>([]);
    const [repo, setRepo] = useState<Repo | null>(null);
    const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadAnalysisData();
    }, []);

    const loadAnalysisData = async () => {
        try {
            console.log('[AnalyzePage] loadAnalysisData called');
            
            // Try to load from localStorage first (from HomePage)
            const storedSessionId = localStorage.getItem('currentSessionId');
            const storedAnalysis = localStorage.getItem('currentAnalysis');

            console.log('[AnalyzePage] Stored session ID:', storedSessionId);
            console.log('[AnalyzePage] Stored analysis exists:', !!storedAnalysis);

            if (storedAnalysis && storedSessionId) {
                const analysis = JSON.parse(storedAnalysis);
                console.log('[AnalyzePage] Loading from localStorage');
                console.log('[AnalyzePage] Analysis suggestedTests count:', analysis.suggestedTests?.length || 0);
                console.log('[AnalyzePage] Analysis suggestedTests:', analysis.suggestedTests);
                
                setSessionId(storedSessionId);
                const testsArray = analysis.suggestedTests || [];
                console.log('[AnalyzePage] Setting tests, count:', testsArray.length);
                setTests(testsArray);
                setRepo(analysis.repo || null);
                setAiSummary(analysis.aiSummary || null);
                setLoading(false);
                return;
            }

            // If no stored data, try to load from API by sessionId
            if (storedSessionId) {
                console.log('[AnalyzePage] Loading from API for session:', storedSessionId);
                const response = await apiService.getAnalysisSession(storedSessionId);
                console.log('[AnalyzePage] API response:', response);
                console.log('[AnalyzePage] API suggestedTests count:', response.suggestedTests?.length || 0);
                console.log('[AnalyzePage] API suggestedTests:', response.suggestedTests);
                
                setSessionId(storedSessionId);
                const testsArray = response.suggestedTests || [];
                console.log('[AnalyzePage] Setting tests from API, count:', testsArray.length);
                setTests(testsArray);
                setRepo(response.repo || null);
                setAiSummary(response.aiSummary || null);
            } else {
                console.error('[AnalyzePage] No session ID found');
                setError('No analysis session found. Please start a new analysis.');
            }
        } catch (err: any) {
            console.error('[AnalyzePage] Error loading analysis data:', err);
            console.error('[AnalyzePage] Error message:', err.message);
            console.error('[AnalyzePage] Error stack:', err.stack);
            setError(err.message || 'Failed to load analysis data');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTest = async (id: string) => {
        const updatedTests = tests.map(test => 
            test.id === id ? { ...test, selected: !test.selected } : test
        );
        setTests(updatedTests);

        // Update in backend
        const test = tests.find(t => t.id === id);
        if (test && sessionId) {
            try {
                await apiService.updateTestCase(id, { selected: !test.selected });
            } catch (err) {
                console.error('Failed to update test case:', err);
            }
        }
    };

    const handleSelectAll = async () => {
        const allSelected = tests.every(test => test.selected);
        const updatedTests = tests.map(test => ({ ...test, selected: !allSelected }));
        setTests(updatedTests);

        // Update in backend
        if (sessionId) {
            try {
                const testCaseIds = tests.map(t => t.id);
                await apiService.updateTestCasesBatch(testCaseIds, !allSelected);
            } catch (err) {
                console.error('Failed to update test cases:', err);
            }
        }
    };

    const handleClearSelection = async () => {
        const updatedTests = tests.map(test => ({ ...test, selected: false }));
        setTests(updatedTests);

        // Update in backend
        if (sessionId) {
            try {
                const testCaseIds = tests.map(t => t.id);
                await apiService.updateTestCasesBatch(testCaseIds, false);
            } catch (err) {
                console.error('Failed to clear selection:', err);
            }
        }
    };

    const handleRunTests = async () => {
        const selectedTests = tests.filter(t => t.selected);
        if (selectedTests.length === 0 || !sessionId) {
            setError('Please select at least one test case');
            return;
        }

        try {
            setError(null);
            console.log('[AnalyzePage] Starting test execution...', { 
                sessionId, 
                testCount: selectedTests.length 
            });
            
            const testCaseIds = selectedTests.map(t => t.id);
            const response = await apiService.runTests(sessionId, testCaseIds);

            console.log('[AnalyzePage] Test execution started:', response);

            // Save runId for execution page
            localStorage.setItem('currentRunId', response.runId);
            
            navigate('/runs');
        } catch (err: any) {
            console.error('[AnalyzePage] Error starting test execution:', err);
            setError(err.message || 'Failed to start test execution. Please check if the backend server is running.');
        }
    };

    const toggleExpand = (testId: string) => {
        setExpandedTests(prev => {
            const newSet = new Set(prev);
            if (newSet.has(testId)) {
                newSet.delete(testId);
            } else {
                newSet.add(testId);
            }
            return newSet;
        });
    };
    
    const selectedCount = tests.filter(t => t.selected).length;

    const testTypeVariant = (type: string) => {
      switch (type) {
        case 'unit': return 'info';
        case 'integration': return 'warning';
        case 'negative': return 'danger';
        case 'edge': return 'success';
        default: return 'info';
      }
    };

    const complexityBadge = (complexity: string) => {
        switch (complexity) {
            case 'S': return <Badge variant="success">Simple</Badge>;
            case 'M': return <Badge variant="warning">Medium</Badge>;
            case 'L': return <Badge variant="danger">Large</Badge>;
            default: return <Badge variant="info">{complexity}</Badge>;
        }
    };
    
    const columns = [
        { 
            header: '', 
            accessor: (item: SuggestedTest) => (
                <button
                    onClick={() => toggleExpand(item.id)}
                    className="p-1 hover:bg-surface2 rounded transition-colors"
                    title={expandedTests.has(item.id) ? 'Collapse' : 'Expand'}
                >
                    {expandedTests.has(item.id) ? (
                        <ChevronUpIcon className="w-4 h-4 text-primary-muted" />
                    ) : (
                        <ChevronDownIcon className="w-4 h-4 text-primary-muted" />
                    )}
                </button>
            ), 
            className: 'w-[50px] whitespace-nowrap' 
        },
        { header: '#', accessor: (item: SuggestedTest) => <span className="text-primary-muted text-xs font-mono whitespace-nowrap">{item.id.substring(0, 8)}...</span>, className: 'w-[90px]' },
        { header: 'Test Case', accessor: (item: SuggestedTest) => <span className="font-medium block">{item.name}</span>, className: 'min-w-[250px] max-w-none' },
        { header: 'Function', accessor: (item: SuggestedTest) => <code className="text-xs bg-surface2/50 px-2 py-1 rounded inline-block">{item.function}</code>, className: 'min-w-[180px] max-w-none' },
        { header: 'Type', accessor: (item: SuggestedTest) => <Badge variant={testTypeVariant(item.type)}>{item.type}</Badge>, className: 'w-[90px] whitespace-nowrap' },
        { header: 'Complexity', accessor: (item: SuggestedTest) => complexityBadge(item.complexity), className: 'w-[100px] whitespace-nowrap' },
        { header: 'Scope', accessor: (item: SuggestedTest) => <Badge variant="info">{item.testScope}</Badge>, className: 'w-[85px] whitespace-nowrap' },
        { header: 'Priority', accessor: (item: SuggestedTest) => {
            const variant = item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'success';
            return <Badge variant={variant}>{item.priority}</Badge>;
        }, className: 'w-[95px] whitespace-nowrap' },
        {
            header: 'Select',
            accessor: (item: SuggestedTest) => (
                <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => handleSelectTest(item.id)}
                    className="h-5 w-5 rounded bg-surface2 border-surface2 text-accent-violet focus:ring-accent-violet cursor-pointer"
                />
            ),
            className: 'text-center w-[75px] whitespace-nowrap'
        },
    ];

    if (loading) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">AI Analysis Results</h1>
                <Card>
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-primary-muted">Loading analysis results...</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">AI Analysis Results</h1>
                <Card>
                    <div className="text-center py-12">
                        <div className="text-status-danger text-xl mb-4">⚠️ Error</div>
                        <p className="text-primary-muted mb-4">{error}</p>
                        <Button onClick={() => navigate('/home')}>Go to Home</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">AI Analysis Results</h1>
            
            {error && (
                <div className="p-3 bg-status-danger/10 border border-status-danger/50 rounded-lg text-status-danger text-sm">
                    {error}
                </div>
            )}
            
             <div className="space-y-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <SparklesIcon/> AI Summary
                            </h2>
                            {aiSummary && (
                                <>
                                    <p className="text-primary-muted mb-4">{aiSummary.overview}</p>
                                    {aiSummary.detectedFunctions.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <span className="font-semibold text-sm mr-2">Detected Functions:</span>
                                            {aiSummary.detectedFunctions.map((fn, idx) => (
                                                <Badge key={idx} variant="info">{fn}</Badge>
                                            ))}
                                        </div>
                                    )}
                                    {aiSummary.detectedClasses.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <span className="font-semibold text-sm mr-2">Detected Classes:</span>
                                            {aiSummary.detectedClasses.map((cls, idx) => (
                                                <Badge key={idx} variant="info">{cls}</Badge>
                                            ))}
                                        </div>
                                    )}
                                    {repo && repo.detectedTech.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="font-semibold text-sm mr-2">Detected Tech:</span>
                                            {repo.detectedTech.map(tech => (
                                                <Badge key={tech} variant="info">{tech}</Badge>
                                            ))}
                                        </div>
                                    )}
                                    {aiSummary.risks.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="font-semibold text-sm mr-2">Potential Risks:</span>
                                            {aiSummary.risks.map((risk, idx) => (
                                                <Badge key={idx} variant="danger">{risk}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card>
                            <h2 className="text-xl font-bold mb-4">Code Structure</h2>
                            {repo && repo.files.length > 0 ? (
                                <ul className="space-y-2 text-sm">
                                    {repo.files.map((file, idx) => (
                                        <li key={idx} className="flex items-center text-primary-muted hover:text-primary">
                                            <DocumentTextIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                                            <span className="truncate">{file}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-primary-muted text-sm">No files information available</p>
                            )}
                        </Card>
                    </div>
                </div>

                <Card className="overflow-visible">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Suggested Test Cases ({tests.length})</h2>
                        <div className="space-x-2">
                            <Button variant="secondary" onClick={handleSelectAll}>
                                Select All
                            </Button>
                            <Button variant="ghost" onClick={handleClearSelection}>
                                Clear
                            </Button>
                        </div>
                    </div>
                    {tests.length === 0 ? (
                        <div className="text-center py-8 text-primary-muted">
                            No test cases found. Please start a new analysis.
                        </div>
                    ) : (
                        <>
                            <div className="-mx-6 px-6">
                                <div className="bg-surface border border-surface2 rounded-2xl w-full overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-surface2">
                                            <tr>
                                                {columns.map((col, index) => (
                                                    <th key={index} className={`p-3 text-xs font-semibold text-primary-muted ${col.className || ''}`}>
                                                        {col.header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tests.map((item, rowIndex) => (
                                                <React.Fragment key={item.id}>
                                                    <tr className="border-t border-surface2 hover:bg-surface2/50">
                                                        {columns.map((col, colIndex) => (
                                                            <td key={colIndex} className={`p-3 text-sm align-top ${col.className || ''}`}>
                                                                <div className="break-words whitespace-normal">
                                                                    {col.accessor(item)}
                                                                </div>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                    {expandedTests.has(item.id) && item.code && (
                                                        <tr className="border-t border-surface2 bg-surface2/30">
                                                            <td colSpan={columns.length} className="p-4">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="text-xs font-semibold text-primary-muted">Test Code:</span>
                                                                    </div>
                                                                    <pre className="bg-background border border-surface2 rounded-lg p-4 overflow-x-auto text-xs">
                                                                        <code className="text-primary whitespace-pre-wrap">{item.code}</code>
                                                                    </pre>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button 
                                    onClick={handleRunTests} 
                                    disabled={selectedCount === 0} 
                                    className="flex items-center gap-2"
                                >
                                    <PlayIcon/> Run {selectedCount} Selected Test{selectedCount !== 1 && 's'}
                                </Button>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default AnalyzePage;

