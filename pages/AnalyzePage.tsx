import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import { SuggestedTest } from '../types';
import { DocumentTextIcon, PlayIcon, SparklesIcon } from '../components/icons/Icons';

interface AnalysisResult {
    success: boolean;
    analysis?: {
        success: boolean;
        plan?: {
            agents_needed?: string[];
            workflow?: any[];
            reasoning?: string;
        };
        workflow_results?: Array<{
            step?: string;
            result?: any;
        }>;
        final_output?: any;
    };
    parsed_response?: {
        summary?: {
            overview?: string;
            risks?: string[];
        };
        testCases?: Array<{
            id?: number;
            title?: string;
            name?: string;
            function?: string;
            type?: string;
            complexity?: string;
        }>;
    };
    github_data?: {
        files?: Array<{ name: string; path: string; content?: string }>;
        owner?: string;
        repo?: string;
        branch?: string;
    };
    summary?: {
        total_files?: number;
        detected_languages?: string[];
        repo_info?: any;
    };
    code_info?: {
        language?: string;
        length?: number;
        lines?: number;
    };
    files_info?: Array<{ name: string; language?: string; size?: number; lines?: number }>;
}

const AnalyzePage = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState<SuggestedTest[]>([]);
    const [aiSummary, setAiSummary] = useState<{ overview: string; risks: string[] }>({ overview: '', risks: [] });
    const [repoData, setRepoData] = useState<{ files: string[]; detectedTech: string[] }>({ files: [], detectedTech: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [analysisType, setAnalysisType] = useState<string>('');

    const handleSelectTest = (id: number) => {
        setTests(tests.map(test => test.id === id ? { ...test, selected: !test.selected } : test));
    };

    const handleSelectAll = () => {
        const allSelected = tests.every(test => test.selected);
        setTests(tests.map(test => ({ ...test, selected: !allSelected })));
    };

    const handleClearSelection = () => {
        setTests(tests.map(test => ({ ...test, selected: false })));
    };
    
    const selectedCount = tests.filter(t => t.selected).length;

    // Parse và format dữ liệu từ API response
    const parseAnalysisResult = (result: AnalysisResult) => {
        try {
            const suggestedTests: SuggestedTest[] = [];
            
            // Ưu tiên 1: Parse từ parsed_response (đã được backend parse)
            if ((result as any).parsed_response) {
                const parsed = (result as any).parsed_response;
                if (parsed.testCases && Array.isArray(parsed.testCases)) {
                    parsed.testCases.forEach((tc: any, index: number) => {
                        // Validate và extract name một cách an toàn
                        let testName = '';
                        
                        // Extract name từ title hoặc name
                        if (tc.title) {
                            testName = typeof tc.title === 'string' ? tc.title : String(tc.title);
                        } else if (tc.name) {
                            testName = typeof tc.name === 'string' ? tc.name : String(tc.name);
                        } else {
                            testName = `Test Case ${index + 1}`;
                        }
                        
                        // Nếu name là object hoặc JSON string, try parse
                        if (typeof testName === 'object' || testName.startsWith('{')) {
                            try {
                                const parsedName = typeof testName === 'string' ? JSON.parse(testName) : testName;
                                if (parsedName.analysis?.name) {
                                    testName = parsedName.analysis.name;
                                } else if (parsedName.name) {
                                    testName = parsedName.name;
                                } else {
                                    testName = `Test Case ${index + 1}`;
                                }
                            } catch {
                                testName = `Test Case ${index + 1}`;
                            }
                        }
                        
                        // Validate testName không được quá dài hoặc có ký tự đặc biệt
                        if (testName.length > 200) {
                            testName = testName.substring(0, 200) + '...';
                        }
                        
                        // Skip nếu testName trông như raw JSON object hoặc error analysis
                        if (testName.includes('{') && (testName.includes('success') || testName.includes('cause') || testName.includes('suggestion'))) {
                            testName = `Test Case ${index + 1}`;
                        }
                        
                        // Skip nếu testName chứa error analysis fields
                        if (testName.includes("'cause'") || testName.includes("'suggestion'") || 
                            testName.includes("cause:") || testName.includes("suggestion:")) {
                            testName = `Test Case ${index + 1}`;
                        }
                        
                        // Extract function name
                        let funcName = 'unknown';
                        if (tc.function && typeof tc.function === 'string') {
                            funcName = tc.function;
                        } else if (tc.targetFunction && typeof tc.targetFunction === 'string') {
                            funcName = tc.targetFunction;
                        }
                        
                        // Extract type
                        let testType: 'unit' | 'integration' | 'negative' | 'edge' = 'unit';
                        const typeStr = String(tc.type || 'unit').toLowerCase();
                        if (typeStr.includes('integration')) testType = 'integration';
                        else if (typeStr.includes('negative') || typeStr.includes('fail')) testType = 'negative';
                        else if (typeStr.includes('edge') || typeStr.includes('boundary')) testType = 'edge';
                        
                        // Extract complexity
                        let complexity: 'S' | 'M' | 'L' = 'M';
                        const compStr = String(tc.complexity || 'M').toUpperCase();
                        if (compStr === 'S' || compStr === 'SIMPLE') complexity = 'S';
                        else if (compStr === 'L' || compStr === 'LARGE' || compStr === 'COMPLEX') complexity = 'L';
                        else complexity = 'M';
                        
                        suggestedTests.push({
                            id: tc.id || index + 1,
                            name: testName,
                            function: funcName,
                            type: testType,
                            complexity: complexity,
                            selected: false
                        });
                    });
                }
            }
            
            // Ưu tiên 2: Parse từ final_output
            if (suggestedTests.length === 0 && result.analysis?.final_output) {
                const finalOutput = result.analysis.final_output;
                try {
                    let parsed = typeof finalOutput === 'string' ? JSON.parse(finalOutput) : finalOutput;
                    
                    // Nếu parsed có result hoặc testCases nested
                    if (parsed.result && parsed.result.testCases) {
                        parsed = parsed.result;
                    } else if (parsed.testCases) {
                        // Already have testCases
                    } else if (parsed.analysis && parsed.analysis.testCases) {
                        parsed = parsed.analysis;
                    }
                    
                    if (parsed.testCases && Array.isArray(parsed.testCases)) {
                        parsed.testCases.forEach((tc: any, index: number) => {
                            // Validate và extract name
                            let testName = '';
                            if (tc.title && typeof tc.title === 'string') {
                                testName = tc.title;
                            } else if (tc.name && typeof tc.name === 'string') {
                                testName = tc.name;
                            } else {
                                testName = `Test Case ${index + 1}`;
                            }
                            
                            // Validate testName
                            if (testName.length > 200) {
                                testName = testName.substring(0, 200) + '...';
                            }
                            
                            // Skip nếu testName trông như raw JSON
                            if (testName.includes('{') && testName.includes('success')) {
                                testName = `Test Case ${index + 1}`;
                            }
                            
                            suggestedTests.push({
                                id: tc.id || index + 1,
                                name: testName,
                                function: (tc.function || tc.targetFunction || 'unknown') as string,
                                type: (tc.type || 'unit') as 'unit' | 'integration' | 'negative' | 'edge',
                                complexity: (tc.complexity || 'M') as 'S' | 'M' | 'L',
                                selected: false
                            });
                        });
                    }
                } catch {
                    // Try to extract từ text response
                    const text = typeof finalOutput === 'string' ? finalOutput : JSON.stringify(finalOutput);
                    const lines = text.split('\n').filter((l: string) => l.trim());
                    
                    lines.forEach((line: string, index: number) => {
                        const lineLower = line.toLowerCase();
                        if ((lineLower.includes('test') || lineLower.includes('should')) && 
                            line.length > 10 && 
                            !lineLower.startsWith('#') && 
                            !lineLower.startsWith('```')) {
                            // Extract type
                            let testType: 'unit' | 'integration' | 'negative' | 'edge' = 'unit';
                            if (lineLower.includes('integration')) testType = 'integration';
                            else if (lineLower.includes('negative') || lineLower.includes('fail')) testType = 'negative';
                            else if (lineLower.includes('edge') || lineLower.includes('boundary')) testType = 'edge';
                            
                            // Extract complexity
                            let complexity: 'S' | 'M' | 'L' = 'M';
                            if (lineLower.includes('simple') || lineLower.includes('basic')) complexity = 'S';
                            else if (lineLower.includes('complex') || lineLower.includes('advanced')) complexity = 'L';
                            
                            suggestedTests.push({
                                id: suggestedTests.length + 1,
                                name: line.trim().substring(0, 100),
                                function: 'unknown',
                                type: testType,
                                complexity: complexity,
                                selected: false
                            });
                        }
                    });
                }
            }
            
            // Ưu tiên 3: Parse từ workflow_results
            if (suggestedTests.length === 0 && result.analysis?.workflow_results) {
                for (const workflowResult of result.analysis.workflow_results) {
                    if (workflowResult.step === 'ai_analysis_agent') {
                        const agentResult = workflowResult.result;
                        
                        // Try parse từ result.testCases hoặc result.result.testCases
                        let testCasesToParse = [];
                        if (agentResult?.testCases && Array.isArray(agentResult.testCases)) {
                            testCasesToParse = agentResult.testCases;
                        } else if (agentResult?.result?.testCases && Array.isArray(agentResult.result.testCases)) {
                            testCasesToParse = agentResult.result.testCases;
                        } else if (agentResult?.analysis) {
                            const analysis = agentResult.analysis;
                            if (typeof analysis === 'string') {
                                try {
                                    const parsed = JSON.parse(analysis);
                                    if (parsed.testCases && Array.isArray(parsed.testCases)) {
                                        testCasesToParse = parsed.testCases;
                                    }
                                } catch {
                                    // Skip if not JSON
                                }
                            } else if (typeof analysis === 'object' && analysis.testCases) {
                                testCasesToParse = analysis.testCases;
                            }
                        }
                        
                        // Parse test cases
                        testCasesToParse.forEach((tc: any, index: number) => {
                            // Validate và extract name một cách an toàn
                            let testName = '';
                            if (tc.title && typeof tc.title === 'string') {
                                testName = tc.title;
                            } else if (tc.name && typeof tc.name === 'string') {
                                testName = tc.name;
                            } else {
                                testName = `Test Case ${index + 1}`;
                            }
                            
                            // Validate testName
                            if (testName.includes('{') && testName.includes('success')) {
                                testName = `Test Case ${index + 1}`;
                            }
                            
                            if (testName.length > 200) {
                                testName = testName.substring(0, 200) + '...';
                            }
                            
                            suggestedTests.push({
                                id: tc.id || index + 1,
                                name: testName,
                                function: (tc.function || tc.targetFunction || 'unknown') as string,
                                type: (tc.type || 'unit') as 'unit' | 'integration' | 'negative' | 'edge',
                                complexity: (tc.complexity || 'M') as 'S' | 'M' | 'L',
                                selected: false
                            });
                        });
                        break;
                    }
                }
            }
            
            // Extract repo data
            const files: string[] = [];
            const detectedTech: string[] = [];
            
            if (result.github_data?.files) {
                result.github_data.files.forEach(file => {
                    if (file.path) {
                        files.push(file.path);
                    }
                });
            }
            
            if (result.summary?.detected_languages) {
                detectedTech.push(...result.summary.detected_languages);
            }
            
            if (result.files_info) {
                result.files_info.forEach(file => {
                    if (file.name) {
                        files.push(file.name);
                    }
                    if (file.language) {
                        detectedTech.push(file.language);
                    }
                });
            }
            
            // Filter out invalid test cases (có name là object hoặc JSON hoặc error analysis)
            const validTests = suggestedTests.filter(test => {
                const name = String(test.name || '').trim();
                
                // Skip nếu name trống hoặc quá ngắn
                if (name.length < 3) {
                    return false;
                }
                
                // Skip nếu name trông như raw JSON object
                if (name.includes('{') && (name.includes('success') || name.includes('analysis'))) {
                    return false;
                }
                
                // Skip nếu name chứa error analysis fields (cause, suggestion)
                if (name.includes("'cause'") || name.includes("'suggestion'") || 
                    name.includes("cause:") || name.includes("suggestion:") ||
                    name.includes("'cause':") || name.includes("'suggestion':")) {
                    return false;
                }
                
                // Skip nếu name là JSON string chưa được parse
                if (name.trim().startsWith('{') && name.trim().endsWith('}')) {
                    return false;
                }
                
                // Skip nếu name quá ngắn và không có ý nghĩa
                if (name.length < 10 && name.includes('Test Case') && !name.match(/Test Case \d+/)) {
                    return false;
                }
                
                // Skip nếu name chứa nhiều ký tự JSON/quotes (có thể là raw JSON)
                const quoteCount = (name.match(/'/g) || []).length + (name.match(/"/g) || []).length;
                if (quoteCount > 5) {
                    return false;
                }
                
                return true;
            });
            
            // Nếu không có valid tests, tạo default tests
            const finalTests = validTests.length > 0 ? validTests : [{
                id: 1,
                name: 'Test case extracted from analysis',
                function: 'unknown',
                type: 'unit' as const,
                complexity: 'M' as const,
                selected: false
            }];
            
            // Extract AI summary
            let overview = 'Code analysis completed. Review suggested test cases below.';
            const risks: string[] = [];
            
            // Ưu tiên: Parse từ parsed_response
            if ((result as any).parsed_response?.summary) {
                const summary = (result as any).parsed_response.summary;
                overview = summary.overview || overview;
                risks.push(...(summary.risks || []));
            }
            // Fallback: Extract từ reasoning
            else {
                const reasoning = result.analysis?.plan?.reasoning || '';
                if (reasoning && !reasoning.toLowerCase().includes('agent')) {
                    // Chỉ lấy reasoning nếu không phải là text về agents
                    overview = reasoning.substring(0, 500);
                }
            }
            
            return {
                suggestedTests: finalTests,
                repoData: {
                    files: files.length > 0 ? files : ['No files analyzed'],
                    detectedTech: detectedTech.length > 0 ? [...new Set(detectedTech)] : ['Unknown']
                },
                aiSummary: {
                    overview,
                    risks: risks.length > 0 ? risks : ['No specific risks identified']
                }
            };
        } catch (err) {
            console.error('Error parsing analysis result:', err);
            return {
                suggestedTests: [{
                    id: 1,
                    name: 'Error parsing analysis result',
                    function: 'unknown',
                    type: 'unit',
                    complexity: 'M',
                    selected: false
                }],
                repoData: {
                    files: [],
                    detectedTech: []
                },
                aiSummary: {
                    overview: 'Error parsing analysis result',
                    risks: []
                }
            };
        }
    };

    useEffect(() => {
        // Lấy kết quả từ sessionStorage (được lưu từ HomePage)
        const resultStr = sessionStorage.getItem('analysisResult');
        const type = sessionStorage.getItem('analysisType');
        
        if (!resultStr) {
            setError('No analysis result found. Please start a new analysis from Home page.');
            setIsLoading(false);
            return;
        }
        
        try {
            const result: AnalysisResult = JSON.parse(resultStr);
            setAnalysisType(type || 'unknown');
            
            // Debug: Log parsed_response để kiểm tra
            if ((result as any).parsed_response) {
                console.log('parsed_response:', (result as any).parsed_response);
                console.log('testCases count:', (result as any).parsed_response?.testCases?.length || 0);
                console.log('testCases:', (result as any).parsed_response?.testCases);
                
                // Also check analysis result
                if (result.analysis?.final_output) {
                    console.log('final_output:', result.analysis.final_output);
                }
                if (result.analysis?.workflow_results) {
                    console.log('workflow_results:', result.analysis.workflow_results);
                }
            }
            
            const parsed = parseAnalysisResult(result);
            console.log('Parsed suggestedTests:', parsed.suggestedTests);
            
            setTests(parsed.suggestedTests);
            setRepoData(parsed.repoData);
            setAiSummary(parsed.aiSummary);
        } catch (err) {
            setError('Failed to parse analysis result');
            console.error('Error parsing result:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
        { header: '#', accessor: (item: SuggestedTest) => <span className="text-primary-muted">{item.id}</span> },
        { header: 'Test Case', accessor: (item: SuggestedTest) => item.name },
        { header: 'Target Function', accessor: (item: SuggestedTest) => <code>{item.function}</code> },
        { header: 'Type', accessor: (item: SuggestedTest) => <Badge variant={testTypeVariant(item.type)}>{item.type}</Badge> },
        { header: 'Complexity', accessor: (item: SuggestedTest) => complexityBadge(item.complexity) },
        {
            header: 'Select',
            accessor: (item: SuggestedTest) => (
                <div className="flex justify-center">
                    <Checkbox
                        checked={item.selected || false}
                        onChange={() => handleSelectTest(item.id)}
                    />
                </div>
            ),
            className: 'text-center'
        },
    ];

    if (isLoading) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">AI Analysis Results</h1>
                <Card>
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-primary-muted">Loading analysis results...</p>
                        </div>
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
                    <div className="p-6">
                        <div className="bg-status-danger/10 border border-status-danger/50 rounded-lg p-4 mb-4">
                            <p className="text-status-danger">{error}</p>
                        </div>
                        <Button onClick={() => navigate('/home')}>
                            Back to Home
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">AI Analysis Results</h1>
                <Badge variant="info">{analysisType}</Badge>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><SparklesIcon/> AI Summary</h2>
                        <p className="text-primary-muted mb-4">{aiSummary.overview || 'Analysis completed'}</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="font-semibold text-sm mr-2">Detected Tech:</span>
                            {repoData.detectedTech.length > 0 ? (
                                repoData.detectedTech.map((tech, idx) => <Badge key={idx} variant="info">{tech}</Badge>)
                            ) : (
                                <span className="text-primary-muted text-sm">No tech detected</span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="font-semibold text-sm mr-2">Potential Risks:</span>
                            {aiSummary.risks.length > 0 ? (
                                aiSummary.risks.map((risk, idx) => <Badge key={idx} variant="danger">{risk}</Badge>)
                            ) : (
                                <span className="text-primary-muted text-sm">No specific risks identified</span>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Suggested Test Cases ({tests.length})</h2>
                            <div className="space-x-2">
                                <Button variant="secondary" onClick={handleSelectAll}>Select All</Button>
                                <Button variant="ghost" onClick={handleClearSelection}>Clear</Button>
                            </div>
                        </div>
                        <Table columns={columns} data={tests} />
                        <div className="mt-6 flex justify-end">
                            <Button 
                                onClick={async () => {
                                    // Lưu selected tests và context vào sessionStorage
                                    const selectedTests = tests.filter(t => t.selected);
                                    
                                    // Get original code và language từ sessionStorage (từ HomePage analysis)
                                    const analysisData = sessionStorage.getItem('analysisResult');
                                    let originalCode = '';
                                    let language = 'unknown';
                                    
                                    if (analysisData) {
                                        try {
                                            const parsed = JSON.parse(analysisData);
                                            
                                            // Get language từ code_info hoặc files_info hoặc summary
                                            if (parsed.code_info?.language) {
                                                language = parsed.code_info.language;
                                            } else if (parsed.files_info && parsed.files_info.length > 0) {
                                                language = parsed.files_info[0].language || 'unknown';
                                            } else if (parsed.summary?.detected_languages && parsed.summary.detected_languages.length > 0) {
                                                language = parsed.summary.detected_languages[0];
                                            }
                                            
                                            // Try to get original code từ analysis context (nếu có)
                                            // Hoặc từ github_data/files
                                            if (parsed.github_data?.files) {
                                                // Combine code từ GitHub files
                                                originalCode = parsed.github_data.files
                                                    .map((f: any) => f.content || '')
                                                    .filter((c: string) => c.length > 0)
                                                    .join('\n\n');
                                            }
                                        } catch (e) {
                                            console.error('Error parsing analysis data:', e);
                                        }
                                    }
                                    
                                    // Lưu vào sessionStorage
                                    sessionStorage.setItem('selectedTests', JSON.stringify(selectedTests));
                                    sessionStorage.setItem('executeContext', JSON.stringify({
                                        original_code: originalCode.substring(0, 50000), // Limit size
                                        language: language,
                                        test_cases: selectedTests,
                                        risks: aiSummary.risks || [] // Lưu risks từ analysis
                                    }));
                                    
                                    navigate('/runs');
                                }} 
                                disabled={selectedCount === 0} 
                                className="flex items-center gap-2"
                            >
                               <PlayIcon/> Run {selectedCount} Selected Test{selectedCount !== 1 && 's'}
                            </Button>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card>
                        <h2 className="text-xl font-bold mb-4">Code Structure</h2>
                        {repoData.files.length > 0 ? (
                            <ul className="space-y-2 text-sm max-h-96 overflow-y-auto">
                                {repoData.files.map((file, idx) => (
                                    <li key={idx} className="flex items-center text-primary-muted hover:text-primary">
                                        <DocumentTextIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                                        <span className="truncate" title={file}>{file}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-primary-muted text-sm">No files analyzed</p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AnalyzePage;
