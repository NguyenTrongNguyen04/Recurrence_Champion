import * as geminiService from './geminiService';
import * as cerebrasService from './cerebrasService';
import type { RequirementAnalysis } from '../types';

export type AIModel = 'gemini' | 'cerebras' | 'auto';

/**
 * Unified AI Service with model selection
 * Supports switching between Gemini and Cerebras models
 */
export class AIService {
  private currentModel: AIModel = 'auto';

  /**
   * Set the AI model to use
   */
  setModel(model: AIModel): void {
    this.currentModel = model;
  }

  /**
   * Get current model
   */
  getModel(): AIModel {
    return this.currentModel;
  }

  /**
   * Auto-select model based on document length
   * - Short documents (< 2000 chars): Gemini (better accuracy)
   * - Long documents (>= 2000 chars): Cerebras (faster)
   */
  private autoSelectModel(documentContent: string): 'gemini' | 'cerebras' {
    const length = documentContent.length;
    // For requirement analysis, Gemini is generally better due to better understanding
    // But we can use Cerebras for very long documents for speed
    if (length > 10000) {
      return 'cerebras';
    }
    return 'gemini';
  }

  /**
   * Analyze document with selected model
   */
  async analyzeDocument(documentContent: string): Promise<RequirementAnalysis> {
    const model = this.currentModel === 'auto' ? this.autoSelectModel(documentContent) : this.currentModel;

    try {
      switch (model) {
        case 'gemini':
          return await geminiService.analyzeDocument(documentContent);
        case 'cerebras':
          return await cerebrasService.analyzeDocument(documentContent);
        default:
          throw new Error(`Unknown model: ${model}`);
      }
    } catch (error) {
      // Fallback to Gemini if Cerebras fails
      if (model === 'cerebras') {
        console.warn('Cerebras failed, falling back to Gemini', error);
        try {
          return await geminiService.analyzeDocument(documentContent);
        } catch (fallbackError) {
          throw new Error(
            `Both models failed. Cerebras: ${error instanceof Error ? error.message : 'Unknown error'}, Gemini: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
          );
        }
      }
      throw error;
    }
  }

  /**
   * Generate test cases with selected model
   */
  async generateTestCases(
    functionalReqs: Array<{ id: string; title: string; description: string }>
  ): Promise<any[]> {
    const model = this.currentModel === 'auto' ? 'gemini' : this.currentModel;

    try {
      switch (model) {
        case 'gemini':
          return await geminiService.generateTestCases(functionalReqs);
        case 'cerebras':
          return await cerebrasService.generateTestCases(functionalReqs);
        default:
          throw new Error(`Unknown model: ${model}`);
      }
    } catch (error) {
      // Fallback to Gemini if Cerebras fails
      if (model === 'cerebras') {
        console.warn('Cerebras failed, falling back to Gemini', error);
        try {
          return await geminiService.generateTestCases(functionalReqs);
        } catch (fallbackError) {
          throw new Error(
            `Both models failed. Cerebras: ${error instanceof Error ? error.message : 'Unknown error'}, Gemini: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
          );
        }
      }
      throw error;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export convenience functions
export async function analyzeDocument(
  documentContent: string,
  model: AIModel = 'auto'
): Promise<RequirementAnalysis> {
  const service = new AIService();
  service.setModel(model);
  return service.analyzeDocument(documentContent);
}

