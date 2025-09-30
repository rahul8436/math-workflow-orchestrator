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
// Get multiple fallback models in priority order - ALL production models for maximum availability
export function getModelFallbackChain(task: 'analysis' | 'orchestration' | 'simple'): string[] {
  switch (task) {
    case 'analysis':
    case 'orchestration':
      return [
        GROQ_MODELS.PRIMARY.id,              // 1. llama-3.3-70b-versatile (best quality)
        GROQ_MODELS.OPENAI_120B.id,          // 2. openai/gpt-oss-120b (large, high quality)
        GROQ_MODELS.QWEN.id,                 // 3. qwen/qwen3-32b (good alternative)
        GROQ_MODELS.KIMI.id,                 // 4. moonshotai/kimi-k2-instruct-0905 (large context)
        GROQ_MODELS.OPENAI_20B.id,           // 5. openai/gpt-oss-20b (reliable)
        GROQ_MODELS.FAST.id,                 // 6. llama-3.1-8b-instant (fast, always available)
        GROQ_MODELS.PREVIEW_LLAMA4_MAVERICK.id, // 7. llama-4-maverick (preview)
        GROQ_MODELS.PREVIEW_LLAMA4_SCOUT.id     // 8. llama-4-scout (preview)
      ];
    case 'simple':
      return [
        GROQ_MODELS.FAST.id,                 // 1. llama-3.1-8b-instant (fastest)
        GROQ_MODELS.OPENAI_20B.id,           // 2. openai/gpt-oss-20b (reliable)
        GROQ_MODELS.PRIMARY.id,              // 3. llama-3.3-70b-versatile (quality)
        GROQ_MODELS.QWEN.id,                 // 4. qwen/qwen3-32b (alternative)
        GROQ_MODELS.OPENAI_120B.id,          // 5. openai/gpt-oss-120b (powerful)
        GROQ_MODELS.KIMI.id,                 // 6. moonshotai/kimi-k2-instruct-0905
        GROQ_MODELS.PREVIEW_LLAMA4_SCOUT.id  // 7. llama-4-scout (preview)
      ];
    default:
      return [
        GROQ_MODELS.FAST.id, 
        GROQ_MODELS.OPENAI_20B.id,
        GROQ_MODELS.PRIMARY.id,
        GROQ_MODELS.QWEN.id,
        GROQ_MODELS.OPENAI_120B.id,
        GROQ_MODELS.KIMI.id
      ];
  }
}
// Get appropriate max_tokens for a model - Updated for current models
export function getMaxTokensForModel(modelId: string): number {
  const model = Object.values(GROQ_MODELS).find(m => m.id === modelId);
  return model?.maxCompletionTokens || 32768; // Default to reasonable limit
}

// Retry configuration for rate limit handling
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 8, // Try up to 8 models in the fallback chain
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2
};

// Track model availability (simple in-memory cache)
const modelAvailability = new Map<string, { lastFailed: number; failCount: number }>();

export function markModelUnavailable(modelId: string): void {
  const current = modelAvailability.get(modelId) || { lastFailed: 0, failCount: 0 };
  modelAvailability.set(modelId, {
    lastFailed: Date.now(),
    failCount: current.failCount + 1
  });
}

export function isModelAvailable(modelId: string): boolean {
  const info = modelAvailability.get(modelId);
  if (!info) return true;
  
  // If model failed recently (within last 60 seconds) and has failed multiple times, consider it unavailable
  const timeSinceFailure = Date.now() - info.lastFailed;
  const cooldownPeriod = Math.min(60000, info.failCount * 10000); // Up to 60s cooldown
  
  return timeSinceFailure > cooldownPeriod;
}

export function resetModelAvailability(modelId: string): void {
  modelAvailability.delete(modelId);
}

// Get next available model from fallback chain
export function getNextAvailableModel(task: 'analysis' | 'orchestration' | 'simple', skipModels: string[] = []): string | null {
  const chain = getModelFallbackChain(task);
  
  for (const modelId of chain) {
    if (!skipModels.includes(modelId) && isModelAvailable(modelId)) {
      return modelId;
    }
  }
  
  // If all models are marked unavailable, reset and try again (desperation mode)
  if (chain.length > 0) {
    chain.forEach(resetModelAvailability);
    return chain[0];
  }
  
  return null;
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

// Retry utility for AI requests with automatic model fallback
export async function retryWithFallback<T>(
  operation: (modelId: string) => Promise<T>,
  task: 'analysis' | 'orchestration' | 'simple' = 'orchestration',
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ result: T; modelUsed: string; attempts: number }> {
  const modelChain = getModelFallbackChain(task);
  const errors: Array<{ model: string; error: any }> = [];
  
  for (let i = 0; i < Math.min(config.maxRetries, modelChain.length); i++) {
    const modelId = modelChain[i];
    
    // Skip if model is temporarily unavailable
    if (!isModelAvailable(modelId)) {
      console.log(`⏭️  Skipping ${modelId} (temporarily unavailable)`);
      continue;
    }
    
    try {
      console.log(`🔄 Attempt ${i + 1}/${modelChain.length}: Trying ${modelId}...`);
      const result = await operation(modelId);
      
      // Success! Reset availability tracking for this model
      resetModelAvailability(modelId);
      
      console.log(`✅ Success with ${modelId} on attempt ${i + 1}`);
      return { result, modelUsed: modelId, attempts: i + 1 };
      
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      errors.push({ model: modelId, error: errorMessage });
      
      // Check if it's a rate limit error
      const isRateLimit = errorMessage.toLowerCase().includes('rate limit') ||
                         errorMessage.toLowerCase().includes('too many requests') ||
                         errorMessage.toLowerCase().includes('429');
      
      if (isRateLimit) {
        console.log(`⚠️  Rate limit hit on ${modelId}, marking unavailable and trying next model...`);
        markModelUnavailable(modelId);
        
        // Add exponential backoff delay before trying next model
        const delay = Math.min(
          config.initialDelayMs * Math.pow(config.backoffMultiplier, i),
          config.maxDelayMs
        );
        
        if (i < modelChain.length - 1) {
          console.log(`⏳ Waiting ${delay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } else {
        // Non-rate-limit error, log and try next model immediately
        console.error(`❌ Error with ${modelId}:`, errorMessage);
      }
    }
  }
  
  // All models failed
  console.error('❌ All models failed. Errors:', errors);
  throw new Error(
    `All ${errors.length} models failed. Last error: ${errors[errors.length - 1]?.error || 'Unknown'}`
  );
}