// Available Groq models configuration - Updated with current production models
export const GROQ_MODELS = {
  // Primary model - Best production model available
  PRIMARY: {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    developer: 'Meta',
    contextWindow: 131072,
    maxCompletionTokens: 32768,
    category: 'chat',
    isProduction: true,
    description: 'Best production model for complex analysis, reasoning, and orchestration'
  },
  // Fast production model
  FAST: {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    developer: 'Meta',
    contextWindow: 131072,
    maxCompletionTokens: 131072,
    category: 'chat',
    isProduction: true,
    description: 'Fast production model for quick responses and simple tasks'
  },
  // OpenAI production models
  OPENAI_120B: {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    developer: 'OpenAI',
    contextWindow: 131072,
    maxCompletionTokens: 65536,
    category: 'chat',
    isProduction: true,
    description: 'Large OpenAI model for complex reasoning'
  },
  OPENAI_20B: {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    developer: 'OpenAI',
    contextWindow: 131072,
    maxCompletionTokens: 65536,
    category: 'chat',
    isProduction: true,
    description: 'Smaller OpenAI model for balanced performance'
  },
  // Preview models for testing (use with caution)
  PREVIEW_LLAMA4_MAVERICK: {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick 17B',
    developer: 'Meta',
    contextWindow: 131072,
    maxCompletionTokens: 8192,
    category: 'chat',
    isProduction: false,
    description: 'Preview Llama 4 model - evaluation only'
  },
  PREVIEW_LLAMA4_SCOUT: {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    developer: 'Meta',
    contextWindow: 131072,
    maxCompletionTokens: 8192,
    category: 'chat',
    isProduction: false,
    description: 'Preview Llama 4 scout model - evaluation only'
  },
  // Alternative models
  QWEN: {
    id: 'qwen/qwen3-32b',
    name: 'Qwen 3 32B',
    developer: 'Alibaba Cloud',
    contextWindow: 131072,
    maxCompletionTokens: 40960,
    category: 'chat',
    isProduction: false,
    description: 'Preview Qwen model - evaluation only'
  },
  KIMI: {
    id: 'moonshotai/kimi-k2-instruct-0905',
    name: 'Kimi K2 Instruct',
    developer: 'Moonshot AI',
    contextWindow: 262144,
    maxCompletionTokens: 16384,
    category: 'chat',
    isProduction: false,
    description: 'Preview Moonshot AI model - evaluation only'
  }
} as const;
// Model selection helpers - Updated for current production models
export function getModelForTask(task: 'analysis' | 'orchestration' | 'simple' | 'fallback' | 'emergency'): string {
  switch (task) {
    case 'analysis':
    case 'orchestration':
      return GROQ_MODELS.PRIMARY.id; // llama-3.3-70b-versatile
    case 'simple':
      return GROQ_MODELS.FAST.id; // llama-3.1-8b-instant
    case 'fallback':
      return GROQ_MODELS.OPENAI_20B.id; // openai/gpt-oss-20b
    case 'emergency':
      return GROQ_MODELS.OPENAI_120B.id; // openai/gpt-oss-120b
    default:
      return GROQ_MODELS.PRIMARY.id;
  }
}
// Get multiple fallback models in priority order - Production models only
export function getModelFallbackChain(task: 'analysis' | 'orchestration' | 'simple'): string[] {
  switch (task) {
    case 'analysis':
    case 'orchestration':
      return [
        GROQ_MODELS.PRIMARY.id,         // Primary: llama-3.3-70b-versatile
        GROQ_MODELS.FAST.id,            // Fast: llama-3.1-8b-instant  
        GROQ_MODELS.OPENAI_20B.id,      // OpenAI small: openai/gpt-oss-20b
        GROQ_MODELS.OPENAI_120B.id,     // OpenAI large: openai/gpt-oss-120b
        GROQ_MODELS.QWEN.id,            // Qwen: qwen/qwen3-32b
        GROQ_MODELS.KIMI.id             // Kimi: moonshotai/kimi-k2-instruct-0905
      ];
    case 'simple':
      return [
        GROQ_MODELS.FAST.id,            // Fast: llama-3.1-8b-instant
        GROQ_MODELS.OPENAI_20B.id,      // OpenAI backup: openai/gpt-oss-20b
        GROQ_MODELS.PRIMARY.id,         // Primary fallback: llama-3.3-70b-versatile
        GROQ_MODELS.QWEN.id             // Final fallback: qwen/qwen3-32b
      ];
    default:
      return [GROQ_MODELS.FAST.id, GROQ_MODELS.OPENAI_20B.id];
  }
}
// Get appropriate max_tokens for a model - Updated for current models
export function getMaxTokensForModel(modelId: string): number {
  const model = Object.values(GROQ_MODELS).find(m => m.id === modelId);
  return model?.maxCompletionTokens || 32768; // Default to reasonable limit
}
// All available models for reference - Updated with current Groq models
export const ALL_GROQ_MODELS = {
  // Production Models - Current as of Groq documentation
  production: [
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B Instant',
      developer: 'Meta',
      contextWindow: 131072,
      maxCompletionTokens: 131072,
      category: 'chat',
      isProduction: true,
    },
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B Versatile',
      developer: 'Meta',
      contextWindow: 131072,
      maxCompletionTokens: 32768,
      category: 'chat',
      isProduction: true,
    },
    {
      id: 'meta-llama/llama-guard-4-12b',
      name: 'Llama Guard 4 12B',
      developer: 'Meta',
      contextWindow: 131072,
      maxCompletionTokens: 1024,
      maxFileSize: 20 * 1024 * 1024, // 20 MB
      category: 'guard',
      isProduction: true,
    },
    {
      id: 'openai/gpt-oss-120b',
      name: 'GPT OSS 120B',
      developer: 'OpenAI',
      contextWindow: 131072,
      maxCompletionTokens: 65536,
      category: 'chat',
      isProduction: true,
    },
    {
      id: 'openai/gpt-oss-20b',
      name: 'GPT OSS 20B',
      developer: 'OpenAI',
      contextWindow: 131072,
      maxCompletionTokens: 65536,
      category: 'chat',
      isProduction: true,
    },
    {
      id: 'whisper-large-v3',
      name: 'Whisper Large V3',
      developer: 'OpenAI',
      maxFileSize: 100 * 1024 * 1024, // 100 MB
      category: 'audio',
      isProduction: true,
    },
    {
      id: 'whisper-large-v3-turbo',
      name: 'Whisper Large V3 Turbo',
      developer: 'OpenAI',
      maxFileSize: 100 * 1024 * 1024, // 100 MB
      category: 'audio',
      isProduction: true,
    },
  ],
  // Production Systems - Collections of models and tools
  systems: [
    {
      id: 'groq/compound',
      name: 'Groq Compound',
      developer: 'Groq',
      contextWindow: 131072,
      maxCompletionTokens: 8192,
      category: 'system',
      isProduction: true,
    },
    {
      id: 'groq/compound-mini',
      name: 'Groq Compound Mini',
      developer: 'Groq',
      contextWindow: 131072,
      maxCompletionTokens: 8192,
      category: 'system',
      isProduction: true,
    },
  ],
  // Preview Models - Evaluation only, may be discontinued
  preview: [
    {
      id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      name: 'Llama 4 Maverick 17B',
      developer: 'Meta',
      contextWindow: 131072,
      maxCompletionTokens: 8192,
      maxFileSize: 20 * 1024 * 1024, // 20 MB
      category: 'chat',
      isProduction: false,
    },
    {
      id: 'meta-llama/llama-4-scout-17b-16e-instruct',
      name: 'Llama 4 Scout 17B',
      developer: 'Meta',
      contextWindow: 131072,
      maxCompletionTokens: 8192,
      maxFileSize: 20 * 1024 * 1024, // 20 MB
      category: 'chat',
      isProduction: false,
    },
    {
      id: 'meta-llama/llama-prompt-guard-2-22m',
      name: 'Llama Prompt Guard 2 22M',
      developer: 'Meta',
      contextWindow: 512,
      maxCompletionTokens: 512,
      category: 'guard',
      isProduction: false,
    },
    {
      id: 'meta-llama/llama-prompt-guard-2-86m',
      name: 'Llama Prompt Guard 2 86M',
      developer: 'Meta',
      contextWindow: 512,
      maxCompletionTokens: 512,
      category: 'guard',
      isProduction: false,
    },
    {
      id: 'moonshotai/kimi-k2-instruct-0905',
      name: 'Kimi K2 Instruct',
      developer: 'Moonshot AI',
      contextWindow: 262144,
      maxCompletionTokens: 16384,
      category: 'chat',
      isProduction: false,
    },
    {
      id: 'playai-tts',
      name: 'PlayAI TTS',
      developer: 'PlayAI',
      contextWindow: 8192,
      maxCompletionTokens: 8192,
      category: 'audio',
      isProduction: false,
    },
    {
      id: 'playai-tts-arabic',
      name: 'PlayAI TTS Arabic',
      developer: 'PlayAI',
      contextWindow: 8192,
      maxCompletionTokens: 8192,
      category: 'audio',
      isProduction: false,
    },
    {
      id: 'qwen/qwen3-32b',
      name: 'Qwen 3 32B',
      developer: 'Alibaba Cloud',
      contextWindow: 131072,
      maxCompletionTokens: 40960,
      category: 'chat',
      isProduction: false,
    },
  ],
  } as const;