import { ParsedExpression, Token, ExpressionNode, OperationType, WorkflowNode, WorkflowEdge } from '@/types/workflow';

export class ExpressionParser {
  private tokens: Token[] = [];
  private current = 0;

  parse(expression: string): ParsedExpression {
    this.tokens = this.tokenize(expression);
    this.current = 0;

    const ast = this.parseExpression();
    const variables = this.extractVariables();
    const operations = this.extractOperations();
    const complexity = this.calculateComplexity();

    return {
      tokens: this.tokens,
      ast,
      variables,
      operations,
      complexity
    };
  }

  private tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    const regex = /(\d*\.?\d+|[+\-*/^%()]|[a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;
    let position = 0;

    while ((match = regex.exec(expression)) !== null) {
      const value = match[1];
      let type: Token['type'];

      if (value.match(/\d/)) {
        type = 'number';
        tokens.push({ type, value: parseFloat(value), position });
      } else if (['+', '-', '*', '/', '^', '%'].includes(value)) {
        type = 'operator';
        tokens.push({ type, value, position });
      } else if (['(', ')'].includes(value)) {
        type = 'parenthesis';
        tokens.push({ type, value, position });
      } else {
        type = 'variable';
        tokens.push({ type, value, position });
      }
      position++;
    }

    return tokens;
  }

  private parseExpression(): ExpressionNode {
    return this.parseAdditionSubtraction();
  }

  private parseAdditionSubtraction(): ExpressionNode {
    let left = this.parseMultiplicationDivision();

    while (this.match('+', '-')) {
      const operator = this.previous().value as string;
      const right = this.parseMultiplicationDivision();
      left = {
        type: 'operator',
        value: this.mapOperator(operator),
        left,
        right
      };
    }

    return left;
  }

  private parseMultiplicationDivision(): ExpressionNode {
    let left = this.parseExponentiation();

    while (this.match('*', '/', '%')) {
      const operator = this.previous().value as string;
      const right = this.parseExponentiation();
      left = {
        type: 'operator',
        value: this.mapOperator(operator),
        left,
        right
      };
    }

    return left;
  }

  private parseExponentiation(): ExpressionNode {
    let left = this.parsePrimary();

    if (this.match('^')) {
      const right = this.parseExponentiation(); // Right associative
      left = {
        type: 'operator',
        value: 'exponentiation',
        left,
        right
      };
    }

    return left;
  }

  private parsePrimary(): ExpressionNode {
    if (this.match('(')) {
      const expr = this.parseExpression();
      this.consume(')', "Expected ')' after expression");
      return {
        type: 'group',
        children: [expr]
      };
    }

    if (this.check('number')) {
      return {
        type: 'operand',
        value: this.advance().value
      };
    }

    if (this.check('variable')) {
      return {
        type: 'operand',
        value: this.advance().value
      };
    }

    // Handle unary minus
    if (this.match('-')) {
      const expr = this.parsePrimary();
      return {
        type: 'operator',
        value: 'subtraction',
        left: { type: 'operand', value: 0 },
        right: expr
      };
    }

    throw new Error(`Unexpected token: ${this.peek().value}`);
  }

  private match(...types: string[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(expected: string): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    return token.type === 'operator' ? token.value === expected :
           token.type === 'parenthesis' ? token.value === expected :
           token.type === expected;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(expected: string, message: string): Token {
    if (this.check(expected)) return this.advance();
    throw new Error(message);
  }

  private mapOperator(op: string): OperationType {
    const mapping: Record<string, OperationType> = {
      '+': 'addition',
      '-': 'subtraction',
      '*': 'multiplication',
      '/': 'division',
      '^': 'exponentiation',
      '%': 'modulo'
    };
    return mapping[op] || 'addition';
  }

  private extractVariables(): string[] {
    return this.tokens
      .filter(token => token.type === 'variable')
      .map(token => token.value as string);
  }

  private extractOperations(): OperationType[] {
    return this.tokens
      .filter(token => token.type === 'operator')
      .map(token => this.mapOperator(token.value as string));
  }

  private calculateComplexity(): number {
    let complexity = 0;

    // Base complexity
    complexity += this.tokens.filter(t => t.type === 'operator').length;

    // Parentheses add complexity
    complexity += this.tokens.filter(t => t.type === 'parenthesis').length * 0.5;

    // Variables add complexity
    complexity += this.extractVariables().length * 2;

    // Different operator types
    const operations = this.extractOperations();
    const uniqueOps = new Set(operations);
    complexity += (uniqueOps.size - 1) * 0.5;

    return Math.round(complexity * 10) / 10;
  }

  generateWorkflowNodes(ast: ExpressionNode, startX = 50, startY = 100): { nodes: WorkflowNode[], edges: WorkflowEdge[] } {
    const nodes: WorkflowNode[] = [];
    const edges: WorkflowEdge[] = [];
    let nodeId = 1;
    
    // Improved spacing for smaller nodes
    const horizontalSpacing = 120; // Reduced from 150
    const verticalSpacing = 80;    // For multiple levels
    
    // Track positions to avoid overlaps
    const usedPositions = new Set<string>();
    
    const getValidPosition = (baseX: number, baseY: number): { x: number, y: number } => {
      let x = baseX;
      let y = baseY;
      let offset = 0;
      
      // Check if position is already used and find alternative
      while (usedPositions.has(`${x},${y}`)) {
        offset += 30; // Small offset to avoid overlaps
        x = baseX + (offset % 60); // Alternate left/right
        y = baseY + Math.floor(offset / 60) * 20; // Slight vertical offset if needed
      }
      
      usedPositions.add(`${x},${y}`);
      return { x, y };
    };

    const traverse = (node: ExpressionNode, baseX: number, baseY: number, level = 0): string => {
      const id = `node-${nodeId++}`;
      
      // Adjust Y position based on level to create visual hierarchy
      const adjustedY = baseY + level * 30;

      if (node.type === 'operand') {
        const position = getValidPosition(baseX, adjustedY);
        
        nodes.push({
          id,
          type: typeof node.value === 'string' ? 'variable' : 'operand',
          position,
          data: {
            value: node.value,
            label: String(node.value),
            isVariable: typeof node.value === 'string',
            variableName: typeof node.value === 'string' ? node.value as string : undefined
          }
        });
        return id;
      }

      if (node.type === 'operator' && node.left && node.right) {
        // Create operand nodes with proper spacing
        const leftX = baseX;
        const rightX = baseX + horizontalSpacing;
        const operatorX = baseX + horizontalSpacing * 1.5; // Position operator to the right
        
        const leftId = traverse(node.left, leftX, adjustedY - 20, level + 1); // Slightly higher
        const rightId = traverse(node.right, rightX, adjustedY + 20, level + 1); // Slightly lower

        // Create operator node
        const operatorPosition = getValidPosition(operatorX, adjustedY);
        nodes.push({
          id,
          type: 'operator',
          position: operatorPosition,
          data: {
            operation: node.value as OperationType,
            label: this.getOperatorSymbol(node.value as OperationType)
          }
        });

        // Create edges
        edges.push({
          id: `edge-${leftId}-${id}`,
          source: leftId,
          target: id
        });
        edges.push({
          id: `edge-${rightId}-${id}`,
          source: rightId,
          target: id
        });

        return id;
      }

      if (node.type === 'group' && node.children) {
        return traverse(node.children[0], baseX, baseY, level);
      }

      return id;
    };

    const resultNodeId = traverse(ast, startX, startY);

    // Add final result node with proper spacing
    const resultX = Math.max(...nodes.map(n => n.position.x)) + horizontalSpacing;
    const resultPosition = getValidPosition(resultX, startY);
    
    const finalResultId = `result-${nodeId}`;
    nodes.push({
      id: finalResultId,
      type: 'result',
      position: resultPosition,
      data: {
        label: 'Result',
        value: undefined
      }
    });

    edges.push({
      id: `edge-${resultNodeId}-${finalResultId}`,
      source: resultNodeId,
      target: finalResultId
    });

    return { nodes, edges };
  }

  private getOperatorSymbol(operation: OperationType): string {
    const mapping: Record<OperationType, string> = {
      'addition': '+',
      'subtraction': '-',
      'multiplication': '×',
      'division': '÷',
      'exponentiation': '^',
      'modulo': '%'
    };
    return mapping[operation];
  }
}

export const expressionParser = new ExpressionParser();