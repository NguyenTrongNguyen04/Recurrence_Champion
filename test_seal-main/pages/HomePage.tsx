import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import { GithubIcon, CodeBracketIcon, UploadIcon, XIcon, BeakerIcon, PlayIcon, ChartBarIcon, SparklesIcon } from '../components/icons/Icons';
import { apiService } from '../services/api.service';
import ProgressBar from '../components/ui/ProgressBar';

const HomePage = () => {
    const navigate = useNavigate();
    const [files, setFiles] = useState<File[]>([]);
    const [codeSnippet, setCodeSnippet] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyzeFiles = async () => {
        if (files.length === 0) {
            setError('Please select at least one file');
            return;
        }

        setIsAnalyzing(true);
        setProgress(0);
        setError(null);

        try {
            console.log('[HomePage] Starting file analysis...');
            console.log('[HomePage] Files to analyze:', files.map(f => ({ name: f.name, size: f.size })));
            
            setProgress(30);
            const response = await apiService.analyzeFiles(files);
            
            console.log('[HomePage] Analysis response received:');
            console.log('[HomePage] - Session ID:', response.sessionId);
            console.log('[HomePage] - Suggested tests count:', response.suggestedTests?.length || 0);
            console.log('[HomePage] - Suggested tests:', response.suggestedTests);
            console.log('[HomePage] - AI Summary:', response.aiSummary);
            console.log('[HomePage] - Repo:', response.repo);
            
            setProgress(100);
            
            // Save sessionId to localStorage
            localStorage.setItem('currentSessionId', response.sessionId);
            localStorage.setItem('currentAnalysis', JSON.stringify(response));
            
            console.log('[HomePage] Saved to localStorage, navigating to /analyze');
            
            // Navigate to analyze page
            navigate('/analyze');
        } catch (err: any) {
            console.error('[HomePage] Error during analysis:', err);
            console.error('[HomePage] Error message:', err.message);
            console.error('[HomePage] Error stack:', err.stack);
            setError(err.message || 'Failed to analyze files');
            setProgress(0);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAnalyzeSnippet = async () => {
        if (!codeSnippet.trim()) {
            setError('Please enter code snippet');
            return;
        }

        setIsAnalyzing(true);
        setProgress(0);
        setError(null);

        try {
            setProgress(30);
            const response = await apiService.analyzeSnippet(codeSnippet);
            setProgress(100);
            
            localStorage.setItem('currentSessionId', response.sessionId);
            localStorage.setItem('currentAnalysis', JSON.stringify(response));
            
            navigate('/analyze');
        } catch (err: any) {
            setError(err.message || 'Failed to analyze code snippet');
            setProgress(0);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAnalyzeGithub = async () => {
        if (!githubUrl.trim()) {
            setError('Please enter GitHub URL');
            return;
        }

        setError('GitHub URL analysis is not yet implemented');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const removeFile = (fileName: string) => {
        setFiles(files.filter(file => file.name !== fileName));
    };

    const tabs = [
        {
            label: 'GitHub URL',
            content: (
                <div className="space-y-4">
                    <div className="relative">
                        <GithubIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-muted" />
                        <input 
                            type="text" 
                            placeholder="https://github.com/username/repo" 
                            value={githubUrl}
                            onChange={(e) => setGithubUrl(e.target.value)}
                            className="w-full bg-background border border-surface2 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-accent-violet" 
                        />
                    </div>
                    <Button 
                        onClick={handleAnalyzeGithub} 
                        disabled={isAnalyzing || !githubUrl.trim()}
                        className="w-full flex justify-center items-center gap-2"
                    >
                        <SparklesIcon/> Analyze & Generate Tests
                    </Button>
                </div>
            )
        },
        {
            label: 'Code Snippet',
            content: (
                <div className="space-y-4">
                    <textarea 
                        placeholder="// Paste your code snippet here..." 
                        value={codeSnippet}
                        onChange={(e) => setCodeSnippet(e.target.value)}
                        className="w-full h-40 bg-background border border-surface2 rounded-lg p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-violet"
                    />
                    <Button 
                        onClick={handleAnalyzeSnippet} 
                        disabled={isAnalyzing || !codeSnippet.trim()}
                        className="w-full"
                    >
                        Analyze Snippet
                    </Button>
                </div>
            )
        },
        {
            label: 'Upload Files',
            content: (
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-surface2 rounded-lg p-8 text-center relative">
                        <UploadIcon className="mx-auto h-12 w-12 text-primary-muted" />
                        <p className="mt-2 text-sm text-primary-muted">Drag & drop files or click to browse</p>
                        <p className="text-xs text-primary-muted/70">Max 10 files, 10MB per file</p>
                        <input 
                            type="file" 
                            multiple 
                            onChange={handleFileChange} 
                            disabled={isAnalyzing}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                    </div>
                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {files.map(file => (
                                <div key={file.name} className="bg-surface2 rounded-full py-1 pl-3 pr-2 flex items-center text-sm">
                                    <span>{file.name}</span>
                                    <span className="text-xs text-primary-muted ml-2">{Math.round(file.size / 1024)} KB</span>
                                    <button 
                                        onClick={() => removeFile(file.name)} 
                                        disabled={isAnalyzing}
                                        className="ml-2 hover:text-status-danger"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button 
                        onClick={handleAnalyzeFiles} 
                        disabled={files.length === 0 || isAnalyzing}
                        className="w-full"
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Files'}
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-10 relative z-10">
            {/* Live Badge */}
            <div className="flex justify-center">
                <div className="px-4 py-2 rounded-full bg-surface2/50 border border-accent-cyan/50 shadow-glow-border inline-flex items-center gap-2">
                    <span className="relative">
                        <span className="absolute inset-0 w-2 h-2 bg-accent-cyan rounded-full animate-ping opacity-75" />
                        <span className="relative w-2 h-2 bg-accent-cyan rounded-full" />
                    </span>
                    <span className="text-sm font-semibold text-accent-cyan">AI Analysis Live Now</span>
                </div>
            </div>

            {/* Hero Section với gradient text và AI vibes */}
            <div className="text-center p-16 rounded-3xl relative overflow-hidden border border-accent-cyan/20 shadow-glow-border-strong backdrop-blur-xl">
                {/* Modern gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/10 via-transparent to-accent-violet/10 opacity-60" />
                
                {/* Subtle Grid Pattern - smaller và tinh tế hơn */}
                <div className="absolute inset-0 grid-pattern opacity-15" />
                
                {/* Network Dots - subtle hơn */}
                <div className="absolute inset-0 network-dots opacity-10" />
                
                {/* Horizontal light streak - subtle */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent" />
                
                {/* Subtle glowing accents */}
                <div className="absolute top-10 left-10 w-32 h-32 bg-accent-cyan/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent-violet/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
                
                <div className="relative z-10">
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-accent-cyan via-white to-accent-violet bg-clip-text text-transparent leading-tight">
                        Train and use AI testing faster with TestStudio!
                    </h1>
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <SparklesIcon className="w-6 h-6 text-accent-cyan animate-glow-pulse" />
                        <span className="text-accent-violet font-semibold text-sm uppercase tracking-wider">AI-Powered Testing Platform</span>
                    </div>
                    <p className="text-xl text-primary-muted max-w-3xl mx-auto leading-relaxed mb-8">
                        TestStudio pioneers intelligent test case generation using AI. Our comprehensive suite analyzes your code, suggests comprehensive test cases, and automates execution with detailed reporting—all powered by advanced AI models.
                    </p>
                    <Button className="text-lg px-8 py-4">
                        <SparklesIcon /> Deploy AI Testing Now
                    </Button>
                </div>
            </div>

            {/* Two Panel Layout */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Left Panel - Visual với Network */}
                <Card glass={true} hover={true} className="relative overflow-hidden border border-accent-cyan/30 shadow-glow-border min-h-[300px]">
                    <div className="absolute inset-0 grid-pattern opacity-20" />
                    <div className="absolute inset-0 network-dots opacity-15" />
                    <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <p className="text-primary-muted text-sm mb-4">Try AI-powered test generation</p>
                            <h3 className="text-2xl font-bold text-white mb-2">Faster. Smarter. Automated.</h3>
                            <p className="text-primary-muted text-sm">Decentralized AI testing for the modern developer</p>
                        </div>
                        {/* Network Visualization */}
                        <div className="mt-8 opacity-60">
                            <div className="flex items-center justify-center gap-4 flex-wrap">
                                {['AI', 'Tests', 'Code', 'Reports'].map((label, idx) => (
                                    <div key={idx} className="px-3 py-1.5 rounded-lg bg-surface2/50 border border-accent-cyan/30 text-xs text-accent-cyan">
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Right Panel - Content */}
                <Card glass={true} hover={true} className="border border-accent-violet/30 shadow-glow-border">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-gradient-g1/10 border border-accent-cyan/30 shadow-glow-cyan">
                            <SparklesIcon className="w-5 h-5 text-accent-cyan" />
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-primary-muted bg-clip-text text-transparent">
                            Start a New Test Analysis
                        </h2>
                    </div>
                    {error && (
                        <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/50 rounded-lg text-status-danger text-sm">
                            {error}
                        </div>
                    )}
                    {isAnalyzing && (
                        <div className="mb-4 space-y-2">
                            <div className="flex justify-between text-sm text-primary-muted">
                                <span>Analyzing code with AI...</span>
                                <span>{progress}%</span>
                            </div>
                            <ProgressBar progress={progress} />
                        </div>
                    )}
                    <Tabs tabs={tabs} />
                    
                    {/* AI Model Tags */}
                    <div className="mt-6 pt-6 border-t border-surface2/50">
                        <p className="text-sm text-primary-muted mb-3">Supported AI Models:</p>
                        <div className="flex flex-wrap gap-2">
                            {['Unit Test Generator', 'Integration Tests', 'Edge Case Finder', 'Security Analyzer', 'Performance Tests', 'Mock Generator'].map((model, idx) => (
                                <div key={idx} className="px-3 py-1.5 rounded-lg bg-surface2/50 border border-accent-cyan/30 text-xs text-primary-muted hover:text-accent-cyan hover:border-accent-cyan/50 transition-all cursor-pointer">
                                    {model}
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Incentive/Program Section */}
            <Card glass={true} hover={true} className="border border-accent-cyan/30 shadow-glow-border relative overflow-hidden">
                <div className="absolute inset-0 grid-pattern opacity-10" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-accent-cyan to-white bg-clip-text text-transparent">
                        TestStudio Early Access Program
                    </h2>
                    <p className="text-primary-muted mb-6">Join early adopters for exclusive features and priority support</p>
                    <Button variant="secondary" className="border-accent-cyan/50 hover:border-accent-cyan">
                        Participate Now
                    </Button>
                </div>
            </Card>

            <Card glass={true} hover={true} className="border border-accent-violet/30">
                <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-accent-cyan to-accent-violet bg-clip-text text-transparent">
                    How It Works
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center group">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-cyan/5 flex items-center justify-center mb-6 border border-accent-cyan/30 shadow-glow-cyan group-hover:scale-110 transition-all duration-300">
                            <BeakerIcon className="w-10 h-10 text-accent-cyan"/>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl font-bold text-accent-cyan">01</span>
                            <h3 className="text-xl font-bold">Analyze</h3>
                        </div>
                        <p className="text-primary-muted text-sm leading-relaxed text-center">
                            Provide your codebase via GitHub, snippet, or file upload for our AI to analyze its structure and logic.
                        </p>
                    </div>
                    <div className="flex flex-col items-center group">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-violet/20 to-accent-violet/5 flex items-center justify-center mb-6 border border-accent-violet/30 shadow-glow-violet group-hover:scale-110 transition-all duration-300">
                            <PlayIcon className="w-10 h-10 text-accent-violet"/>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl font-bold text-accent-violet">02</span>
                            <h3 className="text-xl font-bold">Select & Run</h3>
                        </div>
                        <p className="text-primary-muted text-sm leading-relaxed text-center">
                            Review AI-generated test cases, select the ones you need, and execute them with a single click.
                        </p>
                    </div>
                    <div className="flex flex-col items-center group">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-status-success/20 to-status-success/5 flex items-center justify-center mb-6 border border-status-success/30 shadow-lg group-hover:scale-110 transition-all duration-300">
                            <ChartBarIcon className="w-10 h-10 text-status-success"/>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl font-bold text-status-success">03</span>
                            <h3 className="text-xl font-bold">Report</h3>
                        </div>
                        <p className="text-primary-muted text-sm leading-relaxed text-center">
                            Get instant results, detailed logs, AI-powered failure analysis, and a comprehensive reporting dashboard.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default HomePage;

