import { WorkflowTemplate, WorkflowSuggestion, AIAnalysis, OperationType } from '@/types/workflow';
import { expressionParser } from './expression-parser';

export class WorkflowMatcher {
  private templates: WorkflowTemplate[] = [];

  constructor(templates: WorkflowTemplate[] = []) {
    this.templates = templates;
  }

  setTemplates(templates: WorkflowTemplate[]): void {
    this.templates = templates;
  }

  // Main intelligent matching function
  findMatches(
    userInput: string,
    aiAnalysis?: AIAnalysis
  ): WorkflowSuggestion[] {
    const suggestions: WorkflowSuggestion[] = [];

    // Extract patterns and operations from user input
    const patterns = this.extractPatterns(userInput);
    const operations = this.extractOperations(userInput);
    const numbers = this.extractNumbers(userInput);

    // 0. EXACT VALUE MATCHING (highest priority - perfect match)
    const exactValueMatches = this.findExactValueMatches(userInput, numbers);
    suggestions.push(...exactValueMatches);

    // 1. Exact pattern matching
    const exactMatches = this.findExactPatternMatches(patterns);
    suggestions.push(...exactMatches);

    // 2. Operation-based matching
    const operationMatches = this.findOperationMatches(operations);
    suggestions.push(...operationMatches);

    // 3. Semantic similarity matching
    const semanticMatches = this.findSemanticMatches(userInput);
    suggestions.push(...semanticMatches);

    // 4. Complexity-based matching
    const complexityMatches = this.findComplexityMatches(numbers, operations);
    suggestions.push(...complexityMatches);

    // 5. Example-based matching
    const exampleMatches = this.findExampleMatches(userInput);
    suggestions.push(...exampleMatches);

    // Remove duplicates and sort by confidence
    const uniqueSuggestions = this.removeDuplicates(suggestions);
    return this.sortByConfidence(uniqueSuggestions);
  }

  private extractPatterns(input: string): string[] {
    const patterns: string[] = [];

    // Mathematical expression patterns
    const mathPatterns = [
      /(\w+)\s*\+\s*(\w+)/g,           // x + y
      /(\w+)\s*-\s*(\w+)/g,            // x - y
      /(\w+)\s*\*\s*(\w+)/g,           // x * y
      /(\w+)\s*\/\s*(\w+)/g,           // x / y
      /(\w+)\s*\+\s*(\w+)\s*-\s*(\w+)/g, // x + y - z
      /(\w+)\s*\+\s*(\w+)\s*\*\s*(\w+)/g, // x + y * z
    ];

    for (const pattern of mathPatterns) {
      let match;
      while ((match = pattern.exec(input)) !== null) {
        patterns.push(match[0].replace(/\d+/g, 'x').replace(/\s+/g, ' ').trim());
      }
    }

    return patterns;
  }

  private extractOperations(input: string): OperationType[] {
    const operations: OperationType[] = [];
    const operatorMap: Record<string, OperationType> = {
      '+': 'addition',
      'add': 'addition',
      'plus': 'addition',
      'sum': 'addition',
      '-': 'subtraction',
      'subtract': 'subtraction',
      'minus': 'subtraction',
      '*': 'multiplication',
      'multiply': 'multiplication',
      'times': 'multiplication',
      '/': 'division',
      'divide': 'division',
      '^': 'exponentiation',
      'power': 'exponentiation',
      '%': 'modulo',
      'mod': 'modulo',
      'modulo': 'modulo'
    };

    const normalizedInput = input.toLowerCase();
    for (const [key, operation] of Object.entries(operatorMap)) {
      if (normalizedInput.includes(key)) {
        operations.push(operation);
      }
    }

    return [...new Set(operations)]; // Remove duplicates
  }

  private extractNumbers(input: string): number[] {
    const numbers = input.match(/\d+(\.\d+)?/g);
    return numbers ? numbers.map(Number) : [];
  }

  // Convert natural language expressions to symbolic form
  private extractNaturalLanguageExpression(input: string, numbers: number[]): string | null {
    if (numbers.length < 2) return null;

    const lowerInput = input.toLowerCase();
    
    // Operation detection patterns
    const operationPatterns = [
      {
        keywords: ['add', 'added', 'adding', 'plus', 'sum'],
        symbol: '+',
        priority: 1
      },
      {
        keywords: ['subtract', 'subtracted', 'subtracting', 'minus', 'difference'],
        symbol: '-',
        priority: 1
      },
      {
        keywords: ['multiply', 'multiplied', 'multiplying', 'times', 'product'],
        symbol: '*',
        priority: 2
      },
      {
        keywords: ['divide', 'divided', 'dividing', 'over', 'quotient'],
        symbol: '/',
        priority: 2
      }
    ];

    // Find operations mentioned in the text
    const detectedOperations = [];
    for (const pattern of operationPatterns) {
      for (const keyword of pattern.keywords) {
        if (lowerInput.includes(keyword)) {
          detectedOperations.push(pattern);
          break;
        }
      }
    }

    if (detectedOperations.length === 0) return null;

    // For simple two-number operations, construct the expression
    if (numbers.length === 2 && detectedOperations.length === 1) {
      return `${numbers[0]} ${detectedOperations[0].symbol} ${numbers[1]}`;
    }

    return null;
  }

  private findExactValueMatches(userInput: string, numbers: number[]): WorkflowSuggestion[] {
    const matches: WorkflowSuggestion[] = [];
    const normalizedInput = userInput.toLowerCase().replace(/\s+/g, '');

    // Extract natural language expression and convert to symbolic form
    const naturalLanguageExpression = this.extractNaturalLanguageExpression(userInput, numbers);

    for (const template of this.templates) {
      // Check exact expression match first (highest priority)
      if (template.exactExpression) {
        const normalizedExactExpr = template.exactExpression.toLowerCase().replace(/\s+/g, '');
        
        // Exact full match gets highest priority
        if (normalizedInput === normalizedExactExpr) {
          matches.push({
            workflowId: template.id,
            name: template.name,
            confidence: 0.99, // Highest confidence for exact full match
            reason: `Perfect match: "${template.exactExpression}"`,
            matchType: 'exact'
          });
        }
        // Partial match (user input contains this expression) gets lower priority
        else if (normalizedInput.includes(normalizedExactExpr)) {
          // Calculate confidence based on how much of the input this expression covers
          const coverageRatio = normalizedExactExpr.length / normalizedInput.length;
          const confidence = Math.max(0.6, 0.85 * coverageRatio); // Scale down based on coverage
          
          matches.push({
            workflowId: template.id,
            name: template.name,
            confidence: confidence,
            reason: `Partial match: "${template.exactExpression}" (${Math.round(coverageRatio * 100)}% coverage)`,
            matchType: 'partial'
          });
        }
        
        // Natural language expression match
        if (naturalLanguageExpression && 
            naturalLanguageExpression.toLowerCase().replace(/\s+/g, '') === normalizedExactExpr) {
          matches.push({
            workflowId: template.id,
            name: template.name,
            confidence: 0.95, // Very high confidence for natural language match
            reason: `Natural language match: "${naturalLanguageExpression}" → "${template.exactExpression}"`,
            matchType: 'natural_language'
          });
        }
      }

      // Check exact values match (second highest priority)
      if (template.exactValues && numbers.length >= 2) {
        const templateValues = template.exactValues.sort((a, b) => a - b);
        const inputValues = numbers.sort((a, b) => a - b);

        if (templateValues.length === inputValues.length &&
            templateValues.every((val, idx) => val === inputValues[idx])) {
          matches.push({
            workflowId: template.id,
            name: template.name,
            confidence: 0.98, // Very high confidence for exact value match
            reason: `Exact values match: [${templateValues.join(', ')}]`,
            matchType: 'exact'
          });
        }
      }
    }

    return matches;
  }

  private findExactPatternMatches(patterns: string[]): WorkflowSuggestion[] {
    const matches: WorkflowSuggestion[] = [];

    for (const pattern of patterns) {
      const matchingTemplates = this.templates.filter(template =>
        template.pattern.toLowerCase().replace(/\s+/g, ' ') === pattern.toLowerCase()
      );

      for (const template of matchingTemplates) {
        matches.push({
          workflowId: template.id,
          name: template.name,
          confidence: 0.95,
          reason: `Exact pattern match: "${pattern}"`,
          matchType: 'exact'
        });
      }
    }

    return matches;
  }

  private findOperationMatches(operations: OperationType[]): WorkflowSuggestion[] {
    const matches: WorkflowSuggestion[] = [];

    if (operations.length === 0) return matches;

    for (const template of this.templates) {
      const templateOps = template.operations;
      const commonOps = operations.filter(op => templateOps.includes(op));

      if (commonOps.length > 0) {
        const confidence = (commonOps.length / Math.max(operations.length, templateOps.length)) * 0.8;

        matches.push({
          workflowId: template.id,
          name: template.name,
          confidence,
          reason: `Operations match: ${commonOps.join(', ')}`,
          matchType: 'partial'
        });
      }
    }

    return matches;
  }

  private findSemanticMatches(input: string): WorkflowSuggestion[] {
    const matches: WorkflowSuggestion[] = [];
    const normalizedInput = input.toLowerCase();

    // Keywords for different types of calculations
    const keywordGroups = {
      percentage: ['percent', 'percentage', '%', 'of'],
      interest: ['interest', 'rate', 'principal', 'compound', 'simple'],
      average: ['average', 'mean', 'avg'],
      finance: ['calculate', 'computation', 'formula'],
      basic: ['add', 'subtract', 'multiply', 'divide', 'plus', 'minus', 'times']
    };

    for (const template of this.templates) {
      let confidence = 0;
      let reasons: string[] = [];

      // Check description similarity
      const descWords = template.description.toLowerCase().split(' ');
      const inputWords = normalizedInput.split(' ');
      const commonWords = descWords.filter(word => inputWords.includes(word));

      if (commonWords.length > 0) {
        confidence += (commonWords.length / descWords.length) * 0.3;
        reasons.push(`Description similarity: ${commonWords.join(', ')}`);
      }

      // Check tag matches
      const matchingTags = template.tags.filter(tag =>
        normalizedInput.includes(tag.toLowerCase())
      );

      if (matchingTags.length > 0) {
        confidence += (matchingTags.length / template.tags.length) * 0.4;
        reasons.push(`Tag matches: ${matchingTags.join(', ')}`);
      }

      // Keyword group matching
      for (const [group, keywords] of Object.entries(keywordGroups)) {
        const hasKeywords = keywords.some(keyword => normalizedInput.includes(keyword));
        const hasGroupTags = template.tags.some(tag => tag.toLowerCase().includes(group));

        if (hasKeywords && hasGroupTags) {
          confidence += 0.3;
          reasons.push(`Category match: ${group}`);
          break;
        }
      }

      if (confidence > 0.2) {
        matches.push({
          workflowId: template.id,
          name: template.name,
          confidence: Math.min(confidence, 0.85),
          reason: reasons.join('; '),
          matchType: 'similar'
        });
      }
    }

    return matches;
  }

  private findComplexityMatches(numbers: number[], operations: OperationType[]): WorkflowSuggestion[] {
    const matches: WorkflowSuggestion[] = [];

    const operandCount = numbers.length;
    const operationCount = operations.length;

    // Determine complexity level
    let complexity: string;
    if (operandCount <= 2 && operationCount === 1) {
      complexity = 'basic';
    } else if (operandCount <= 3 && operationCount <= 2) {
      complexity = 'intermediate';
    } else if (operandCount <= 4 && operationCount <= 3) {
      complexity = 'advanced';
    } else {
      complexity = 'complex';
    }

    // Find templates with matching complexity and operand count
    const matchingTemplates = this.templates.filter(template =>
      template.complexity === complexity &&
      (Math.abs(template.operandCount - operandCount) <= 1)
    );

    for (const template of matchingTemplates) {
      matches.push({
        workflowId: template.id,
        name: template.name,
        confidence: 0.6,
        reason: `Complexity and operand count match (${complexity}, ${operandCount} operands)`,
        matchType: 'similar'
      });
    }

    return matches;
  }

  private findExampleMatches(input: string): WorkflowSuggestion[] {
    const matches: WorkflowSuggestion[] = [];
    const normalizedInput = input.toLowerCase().replace(/\s+/g, ' ').trim();

    for (const template of this.templates) {
      for (const example of template.examples) {
        const normalizedExample = example.toLowerCase().replace(/\s+/g, ' ').trim();

        // Fuzzy matching for examples
        const similarity = this.calculateStringSimilarity(normalizedInput, normalizedExample);

        if (similarity > 0.5) {
          matches.push({
            workflowId: template.id,
            name: template.name,
            confidence: similarity * 0.7,
            reason: `Similar to example: "${example}"`,
            matchType: 'similar'
          });
        }
      }
    }

    return matches;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator  // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private removeDuplicates(suggestions: WorkflowSuggestion[]): WorkflowSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      if (seen.has(suggestion.workflowId)) {
        return false;
      }
      seen.add(suggestion.workflowId);
      return true;
    });
  }

  private sortByConfidence(suggestions: WorkflowSuggestion[]): WorkflowSuggestion[] {
    return suggestions.sort((a, b) => {
      // First sort by confidence (higher is better)
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      
      // If confidence is equal, prefer exact matches over partial matches
      if (a.matchType === 'exact' && b.matchType === 'partial') return -1;
      if (a.matchType === 'partial' && b.matchType === 'exact') return 1;
      
      // If both are partial matches, prefer the one with longer expression (more complete)
      if (a.matchType === 'partial' && b.matchType === 'partial') {
        const aLength = a.reason.match(/\"([^\"]+)\"/)?.[1]?.length || 0;
        const bLength = b.reason.match(/\"([^\"]+)\"/)?.[1]?.length || 0;
        return bLength - aLength; // Longer expression first
      }
      
      // Default: keep original order
      return 0;
    });
  }

  // Analyze if we should create a new workflow
  shouldCreateNewWorkflow(
    userInput: string,
    existingSuggestions: WorkflowSuggestion[]
  ): { shouldCreate: boolean; reason: string; confidence: number } {
    const bestMatch = existingSuggestions[0];

    // If no matches found
    if (!bestMatch) {
      return {
        shouldCreate: true,
        reason: 'No existing workflows match your requirements',
        confidence: 0.9
      };
    }

    // If best match has low confidence
    if (bestMatch.confidence < 0.4) {
      return {
        shouldCreate: true,
        reason: `Best match "${bestMatch.name}" has low confidence (${(bestMatch.confidence * 100).toFixed(1)}%)`,
        confidence: 0.8
      };
    }

    // Check for unique patterns
    try {
      const parsed = expressionParser.parse(userInput);
      const hasUniquePattern = !this.templates.some(template =>
        template.operations.length === parsed.operations.length &&
        template.operations.every(op => parsed.operations.includes(op))
      );

      if (hasUniquePattern && parsed.complexity > 2) {
        return {
          shouldCreate: true,
          reason: 'This appears to be a unique, complex expression not covered by existing workflows',
          confidence: 0.7
        };
      }
    } catch (error) {
      // If parsing fails, suggest creating a workflow
      return {
        shouldCreate: true,
        reason: 'Complex expression that requires a custom workflow',
        confidence: 0.6
      };
    }

    return {
      shouldCreate: false,
      reason: `Found good match: "${bestMatch.name}" (${(bestMatch.confidence * 100).toFixed(1)}% confidence)`,
      confidence: bestMatch.confidence
    };
  }

  // Generate workflow suggestions for AI responses
  generateResponseSuggestions(
    userInput: string,
    suggestions: WorkflowSuggestion[]
  ): string {
    if (suggestions.length === 0) {
      return "I couldn't find any existing workflows that match your request. Would you like me to create a new workflow for you?";
    }

    const topSuggestions = suggestions.slice(0, 3);
    let response = "I found these matching workflows:\n\n";

    for (let i = 0; i < topSuggestions.length; i++) {
      const suggestion = topSuggestions[i];
      const confidence = (suggestion.confidence * 100).toFixed(1);
      response += `${i + 1}. **${suggestion.name}** (${confidence}% match)\n   ${suggestion.reason}\n\n`;
    }

    const createSuggestion = this.shouldCreateNewWorkflow(userInput, suggestions);
    if (createSuggestion.shouldCreate) {
      response += `\nAlternatively, I can create a new custom workflow for your specific needs. ${createSuggestion.reason}`;
    }

    return response;
  }
}

export const workflowMatcher = new WorkflowMatcher();