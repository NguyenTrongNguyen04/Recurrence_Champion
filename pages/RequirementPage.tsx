import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import UploadZone from '../components/requirement/UploadZone';
import RequirementTable from '../components/requirement/RequirementTable';
import AnalysisDashboard from '../components/requirement/AnalysisDashboard';
import ConflictAlert from '../components/requirement/ConflictAlert';
import TestCaseSuggestions from '../components/requirement/TestCaseSuggestions';
import { SparklesIcon, DocumentArrowDownIcon, CheckCircleIcon } from '../components/icons/Icons';
import type { RequirementDocument, RequirementAnalysis, TestCaseSuggestion } from '../types';
import { parseDocument, preprocessText } from '../utils/documentParser';
import { analyzeDocument, aiService } from '../services/aiService';

type ProcessingStatus = 'idle' | 'parsing' | 'analyzing' | 'completed';

const RequirementPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [document, setDocument] = useState<RequirementDocument | null>(null);
  const [analysis, setAnalysis] = useState<RequirementAnalysis | null>(null);
  const [testCases, setTestCases] = useState<TestCaseSuggestion[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setAnalysis(null);
    setProcessingStatus('parsing');
    setProgress(0);
    setStatusMessage(' Đã nhận yêu cầu của bạn! Đang xử lý document...');

    try {
      // Simulate progress for parsing
      setProgress(10);
      setStatusMessage(' Đang đọc và parse document...');
      
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UX
      const parsedDoc = await parseDocument(selectedFile);
      
      setProgress(30);
      setStatusMessage(' Document đã được parse thành công!');
      
      setDocument(parsedDoc);
      setProcessingStatus('idle');
      setProgress(0);
      
      // Clear status message after 2 seconds
      setTimeout(() => {
        setStatusMessage('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi parse document');
      setFile(null);
      setDocument(null);
      setProcessingStatus('idle');
      setProgress(0);
      setStatusMessage('');
    }
  };

  const handleFileRemove = () => {
    setFile(null);
    setDocument(null);
    setAnalysis(null);
    setTestCases([]);
    setError(null);
  };

  const handleGenerateTestCases = async () => {
    if (!analysis) return;

    try {
      setIsGeneratingTests(true);
      setError(null);

      const result = await aiService.generateTestCases(analysis.functionalRequirements);
      setTestCases(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi sinh test cases');
    } finally {
      setIsGeneratingTests(false);
    }
  };

  const exportToMarkdown = () => {
    if (!analysis || !document) return;

    const markdown = `# Requirement Analysis Report

**Document:** ${document.fileName}  
**Analyzed At:** ${new Date(analysis.analyzedAt).toLocaleString('vi-VN')}  
**File Type:** ${document.fileType.toUpperCase()}  
**File Size:** ${(document.size / 1024).toFixed(2)} KB

---

## Summary

- **Total Requirements:** ${analysis.summary.totalRequirements}
- **Functional Requirements (FR):** ${analysis.summary.functionalCount}
- **Non-Functional Requirements (NFR):** ${analysis.summary.nonFunctionalCount}
- **Conflicts Detected:** ${analysis.summary.conflictsCount}
- **Average Clarity Score:** ${analysis.summary.avgClarityScore}/100
- **Average Testability Score:** ${analysis.summary.avgTestabilityScore}/100

---

## Functional Requirements

${analysis.functionalRequirements.map((fr, idx) => `
### ${fr.id}: ${fr.title}

**Description:** ${fr.description}

**Scores:**
- Clarity: ${fr.clarityScore}/100
- Testability: ${fr.testabilityScore}/100

${fr.conflicts.length > 0 ? `**Conflicts:** ${fr.conflicts.join(', ')}` : ''}
${fr.suggestions.length > 0 ? `**Suggestions:**\n${fr.suggestions.map((s) => `- ${s}`).join('\n')}` : ''}
`).join('\n---\n')}

---

## Non-Functional Requirements

${analysis.nonFunctionalRequirements.map((nfr, idx) => `
### ${nfr.id}: ${nfr.title}

**Type:** ${nfr.type}  
**Description:** ${nfr.description}

**Scores:**
- Clarity: ${nfr.clarityScore}/100
- Testability: ${nfr.testabilityScore}/100

${nfr.metrics ? `**Metrics:** ${nfr.metrics}` : ''}
${nfr.conflicts.length > 0 ? `**Conflicts:** ${nfr.conflicts.join(', ')}` : ''}
${nfr.suggestions.length > 0 ? `**Suggestions:**\n${nfr.suggestions.map((s) => `- ${s}`).join('\n')}` : ''}
`).join('\n---\n')}

---

## Conflicts

${analysis.conflicts.length === 0 ? 'No conflicts detected.' : analysis.conflicts.map((conflict) => `
### ${conflict.id}

**Type:** ${conflict.type}  
**Severity:** ${conflict.severity}  
**Related Requirements:** ${conflict.requirementIds.join(', ')}

**Description:** ${conflict.description}

**Suggestion:** ${conflict.suggestion}
`).join('\n---\n')}

---

*Generated by Test Studio AI*
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requirement-analysis-${document.fileName.replace(/\.[^/.]+$/, '')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportTestCasesToJSON = () => {
    if (testCases.length === 0) return;

    const json = JSON.stringify(testCases, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = async () => {
    if (!document) return;

    try {
      setProcessingStatus('analyzing');
      setProgress(0);
      setError(null);

      // Step 1: Preprocessing
      setStatusMessage(' Đang tiền xử lý document...');
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const processedText = preprocessText(document.content);
      
      // Step 2: Classifying requirements
      setStatusMessage(' Đang phân loại Functional và Non-Functional Requirements...');
      setProgress(30);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Analyzing (this is the longest step)
      setStatusMessage(' AI đang phân tích yêu cầu và đánh giá chất lượng...');
      setProgress(50);
      
      // Analyze with AI (default to auto model selection)
      const result = await analyzeDocument(processedText, 'auto');
      
      // Step 4: Finalizing
      setProgress(90);
      setStatusMessage('✨ Đang hoàn thiện báo cáo phân tích...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setAnalysis(result);
      setTestCases([]); // Reset test cases when new analysis
      
      // Step 5: Complete
      setProgress(100);
      setStatusMessage(' Hoàn tất! Kết quả phân tích đã sẵn sàng.');
      setProcessingStatus('completed');
      
      // Clear status message after 3 seconds and show results
      setTimeout(() => {
        setProcessingStatus('idle');
        setProgress(0);
        setStatusMessage('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi phân tích document');
      setProcessingStatus('idle');
      setProgress(0);
      setStatusMessage('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Requirement Analysis</h1>
          <p className="text-primary-muted">
            Phân tích tài liệu yêu cầu phần mềm (SRS, FRS, BRD) với AI
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Upload Document</h2>
        <UploadZone
          file={file}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          disabled={processingStatus === 'parsing' || processingStatus === 'analyzing'}
        />

        {document && (
          <div className="mt-4 space-y-4">
            {/* Status Message */}
            {statusMessage && (
              <div className="bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {processingStatus === 'completed' ? (
                    <CheckCircleIcon className="w-5 h-5 text-accent-cyan flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  )}
                  <p className="text-sm font-medium text-primary">{statusMessage}</p>
                </div>
                {progress > 0 && progress < 100 && (
                  <div className="mt-3">
                    <ProgressBar 
                      progress={progress} 
                      className="h-2"
                      colorClass="bg-accent-cyan"
                    />
                    <p className="text-xs text-primary-muted mt-1 text-right">{progress}%</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Analyze Button */}
            <div className="flex gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={processingStatus === 'analyzing' || processingStatus === 'parsing'}
                variant="action"
                icon={<SparklesIcon className="w-4 h-4" />}
              >
                {processingStatus === 'analyzing' 
                  ? 'Đang phân tích với AI...' 
                  : processingStatus === 'parsing'
                  ? 'Đang xử lý...'
                  : 'Phân tích với AI'}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </Card>

      {/* Document Preview */}
      {document && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-primary mb-4">Document Preview</h2>
          <div className="space-y-2 mb-4">
            <p className="text-sm text-primary-muted">
              <span className="font-medium">File:</span> {document.fileName}
            </p>
            <p className="text-sm text-primary-muted">
              <span className="font-medium">Type:</span> {document.fileType.toUpperCase()}
            </p>
            <p className="text-sm text-primary-muted">
              <span className="font-medium">Size:</span> {(document.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto bg-surface2 rounded-lg p-4 border border-surface2">
            <pre className="text-xs text-primary-muted whitespace-pre-wrap font-mono">
              {document.content.substring(0, 1000)}
              {document.content.length > 1000 && '...'}
            </pre>
          </div>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Dashboard Summary */}
          <AnalysisDashboard analysis={analysis} />

          {/* Conflicts */}
          {analysis.conflicts.length > 0 && (
            <Card className="p-6">
              <ConflictAlert conflicts={analysis.conflicts} />
            </Card>
          )}

          {/* Requirements Table */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-primary mb-4">Requirements Table</h2>
            <RequirementTable
              functionalReqs={analysis.functionalRequirements}
              nonFunctionalReqs={analysis.nonFunctionalRequirements}
            />
          </Card>

          {/* Test Case Generation */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary">Test Case Suggestions</h2>
              <div className="flex gap-3">
                {testCases.length > 0 && (
                  <Button
                    variant="secondary"
                    icon={<DocumentArrowDownIcon className="w-4 h-4" />}
                    onClick={() => exportTestCasesToJSON()}
                  >
                    Export Test Cases
                  </Button>
                )}
                <Button
                  variant="action"
                  icon={<SparklesIcon className="w-4 h-4" />}
                  onClick={handleGenerateTestCases}
                  disabled={isGeneratingTests || analysis.functionalRequirements.length === 0}
                >
                  {isGeneratingTests ? 'Đang sinh...' : 'Generate Test Cases'}
                </Button>
              </div>
            </div>
            {testCases.length > 0 && <TestCaseSuggestions testCases={testCases} />}
          </Card>

          {/* Export Report */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary mb-2">Export Report</h2>
                <p className="text-sm text-primary-muted">
                  Tải xuống báo cáo phân tích dưới dạng Markdown
                </p>
              </div>
              <Button
                variant="primary"
                icon={<DocumentArrowDownIcon className="w-4 h-4" />}
                onClick={() => exportToMarkdown()}
              >
                Export Markdown
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RequirementPage;
