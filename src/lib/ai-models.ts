// Available Groq models configuration
export const GROQ_MODELS = {
  // Primary models for complex reasoning and analysis
  PRIMARY: {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    developer: 'Meta',
    contextWindow: 131072,
    maxCompletionTokens: 32768,
    category: 'chat',
    isProduction: true,
    description: 'Best for complex analysis, reasoning, and orchestration'
  },

  // Fast model for simple tasks
  FAST: {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    developer: 'Meta',
    contextWindow: 131072,
    maxCompletionTokens: 8192,
    category: 'chat',
    isProduction: true,
    description: 'Fast and efficient for simple analysis and responses'
  },

  // Fallback model
  FALLBACK: {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B',
    developer: 'Google',
    contextWindow: 8192,
    category: 'chat',
    isProduction: true,
    description: 'Reliable fallback option'
  }
} as const;

// Model selection helpers
export function getModelForTask(task: 'analysis' | 'orchestration' | 'simple' | 'fallback'): string {
  switch (task) {
    case 'analysis':
    case 'orchestration':
      return GROQ_MODELS.PRIMARY.id;
    case 'simple':
      return GROQ_MODELS.FAST.id;
    case 'fallback':
      return GROQ_MODELS.FALLBACK.id;
    default:
      return GROQ_MODELS.PRIMARY.id;
  }
}

// Get appropriate max_tokens for a model
export function getMaxTokensForModel(modelId: string): number {
  const model = Object.values(GROQ_MODELS).find(m => m.id === modelId);
  return (model as any)?.maxCompletionTokens || 4000;
}

// All available models for reference
export const ALL_GROQ_MODELS = {
  // Production Models
  production: [
    {
      id: 'gemma2-9b-it',
      name: 'Gemma 2 9B',
      developer: 'Google',
      contextWindow: 8192,
      category: 'chat',
      isProduction: true,
    },
    {
      id: 'llama3-8b-8192',
      name: 'Llama 3 8B',
      developer: 'Meta',
      contextWindow: 8192,
      maxCompletionTokens: 8192,
      category: 'chat',
      isProduction: true,
    },
    {
      id: 'meta-llama/llama-guard-4-12b',
      name: 'Llama Guard 4 12B',
      developer: 'Meta',
      contextWindow: 131072,
      maxCompletionTokens: 128,
      category: 'guard',
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
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B Instant',
      developer: 'Meta',
      contextWindow: 131072,
      maxCompletionTokens: 8192,
      category: 'chat',
      isProduction: true,
    },
    {
      id: 'whisper-large-v3',
      name: 'Whisper Large V3',
      developer: 'OpenAI',
      maxFileSize: 25 * 1024 * 1024,
      category: 'audio',
      isProduction: true,
    },
    {
      id: 'whisper-large-v3-turbo',
      name: 'Whisper Large V3 Turbo',
      developer: 'OpenAI',
      maxFileSize: 25 * 1024 * 1024,
      category: 'audio',
      isProduction: true,
    },
    {
      id: 'distil-whisper-large-v3-en',
      name: 'Distil Whisper Large V3 EN',
      developer: 'HuggingFace',
      maxFileSize: 25 * 1024 * 1024,
      category: 'audio',
      isProduction: true,
    },
  ],

  // Preview Models
  preview: [
    {
      id: 'allam-2-7b',
      name: 'Allam 2 7B',
      developer: 'Saudi Data and AI Authority (SDAIA)',
      contextWindow: 4096,
      category: 'chat',
      isProduction: false,
    },
    {
      id: 'deepseek-r1-distill-llama-70b',
      name: 'DeepSeek R1 Distill Llama 70B',
      developer: 'DeepSeek',
      contextWindow: 131072,
      category: 'chat',
      isProduction: false,
    },
    {
      id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      name: 'Llama 4 Maverick 17B',
      developer: 'Meta',
      contextWindow: 131072,
      maxCompletionTokens: 8192,
      category: 'chat',
      isProduction: false,
    },
    {
      id: 'meta-llama/llama-4-scout-17b-16e-instruct',
      name: 'Llama 4 Scout 17B',
      developer: 'Meta',
      contextWindow: 131072,
      maxCompletionTokens: 8192,
      category: 'chat',
      isProduction: false,
    },
    {
      id: 'meta-llama/llama-prompt-guard-2-22m',
      name: 'Llama Prompt Guard 2 22M',
      developer: 'Meta',
      contextWindow: 512,
      category: 'guard',
      isProduction: false,
    },
    {
      id: 'meta-llama/llama-prompt-guard-2-86m',
      name: 'Llama Prompt Guard 2 86M',
      developer: 'Meta',
      contextWindow: 512,
      category: 'guard',
      isProduction: false,
    },
    {
      id: 'mistral-saba-24b',
      name: 'Mistral Saba 24B',
      developer: 'Mistral',
      contextWindow: 32768,
      category: 'chat',
      isProduction: false,
    },
    {
      id: 'playai-tts',
      name: 'PlayAI TTS',
      developer: 'Playht',
      contextWindow: 10000,
      category: 'audio',
      isProduction: false,
    },
    {
      id: 'playai-tts-arabic',
      name: 'PlayAI TTS Arabic',
      developer: 'Playht',
      contextWindow: 10000,
      category: 'audio',
      isProduction: false,
    },
    {
      id: 'qwen-qwq-32b',
      name: 'Qwen QWQ 32B',
      developer: 'Alibaba Cloud',
      contextWindow: 131072,
      category: 'chat',
      isProduction: false,
    },
    {
      id: 'qwen/qwen3-32b',
      name: 'Qwen 3 32B',
      developer: 'Alibaba Cloud',
      contextWindow: 131072,
      maxCompletionTokens: 16384,
      category: 'chat',
      isProduction: false,
    },
    {
      id: 'compound-beta',
      name: 'Compound Beta',
      developer: 'Groq',
      contextWindow: 131072,
      maxCompletionTokens: 8192,
      category: 'chat',
      isProduction: false,
    },
    {
      id: 'compound-beta-mini',
      name: 'Compound Beta Mini',
      developer: 'Groq',
      contextWindow: 131072,
      maxCompletionTokens: 8192,
      category: 'chat',
      isProduction: false,
    },
  ],
} as const;