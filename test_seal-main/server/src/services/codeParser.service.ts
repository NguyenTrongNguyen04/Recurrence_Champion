/**
 * Service để parse và detect language từ code files
 */

export interface ParsedFile {
  content: string;
  name: string;
  language: string;
  extension: string;
}

export class CodeParserService {
  private languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.java': 'java',
    '.cs': 'csharp',
    '.php': 'php',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.cpp': 'cpp',
    '.c': 'c',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.sh': 'bash',
    '.sql': 'sql',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.vue': 'vue',
    '.dart': 'dart',
  };

  /**
   * Detect language từ file extension
   */
  detectLanguage(fileName: string): string {
    const extension = this.getExtension(fileName);
    return this.languageMap[extension.toLowerCase()] || 'text';
  }

  /**
   * Get file extension
   */
  getExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) return '';
    return fileName.substring(lastDot);
  }

  /**
   * Detect technology stack từ file names và content
   */
  detectTechnology(files: ParsedFile[]): string[] {
    const tech: Set<string> = new Set();

    for (const file of files) {
      const ext = this.getExtension(file.name).toLowerCase();
      const language = this.detectLanguage(file.name);

      // Detect từ extension
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        if (file.name.includes('package.json') || file.content.includes('"express"')) {
          tech.add('Node.js');
          tech.add('Express');
        }
        if (file.content.includes('react') || file.content.includes('React')) {
          tech.add('React');
        }
        if (file.content.includes('vue') || file.content.includes('Vue')) {
          tech.add('Vue.js');
        }
        if (file.content.includes('angular') || file.content.includes('Angular')) {
          tech.add('Angular');
        }
        if (file.name.includes('package.json') && file.content.includes('"jest"')) {
          tech.add('Jest');
        }
        if (file.name.includes('package.json') && file.content.includes('"vitest"')) {
          tech.add('Vitest');
        }
        tech.add(language.charAt(0).toUpperCase() + language.slice(1));
      }

      if (ext === '.py') {
        tech.add('Python');
        if (file.content.includes('pytest') || file.content.includes('import pytest')) {
          tech.add('PyTest');
        }
        if (file.content.includes('django') || file.content.includes('Django')) {
          tech.add('Django');
        }
        if (file.content.includes('flask') || file.content.includes('Flask')) {
          tech.add('Flask');
        }
      }

      if (ext === '.java') {
        tech.add('Java');
        if (file.content.includes('junit') || file.content.includes('JUnit')) {
          tech.add('JUnit');
        }
        if (file.content.includes('spring') || file.content.includes('Spring')) {
          tech.add('Spring');
        }
      }

      if (['.cs'].includes(ext)) {
        tech.add('C#');
        if (file.content.includes('xunit') || file.content.includes('XUnit')) {
          tech.add('xUnit');
        }
        if (file.content.includes('nunit') || file.content.includes('NUnit')) {
          tech.add('NUnit');
        }
      }

      // Detect database
      if (file.content.includes('mongoose') || file.content.includes('MongoDB')) {
        tech.add('MongoDB');
      }
      if (file.content.includes('sequelize') || file.content.includes('postgres')) {
        tech.add('PostgreSQL');
      }
      if (file.content.includes('mysql') || file.content.includes('MySQL')) {
        tech.add('MySQL');
      }
    }

    return Array.from(tech);
  }

  /**
   * Parse file content từ Buffer hoặc string
   */
  parseFile(fileName: string, content: Buffer | string): ParsedFile {
    const textContent = typeof content === 'string' ? content : content.toString('utf-8');
    const extension = this.getExtension(fileName);
    const language = this.detectLanguage(fileName);

    return {
      content: textContent,
      name: fileName,
      language,
      extension,
    };
  }

  /**
   * Validate file - check size và type
   */
  validateFile(fileName: string, size: number, maxSize: number = 10 * 1024 * 1024): {
    valid: boolean;
    error?: string;
  } {
    if (size > maxSize) {
      return {
        valid: false,
        error: `File ${fileName} exceeds maximum size of ${maxSize / 1024 / 1024}MB`,
      };
    }

    const extension = this.getExtension(fileName);
    const supportedExtensions = Object.keys(this.languageMap);

    if (!extension || !supportedExtensions.includes(extension.toLowerCase())) {
      // Cho phép các file khác như .json, .md, .txt
      const allowedExtensions = ['.json', '.md', '.txt', '.yml', '.yaml', '.xml'];
      if (!allowedExtensions.includes(extension.toLowerCase())) {
        return {
          valid: false,
          error: `File type ${extension} is not supported`,
        };
      }
    }

    return { valid: true };
  }
}

