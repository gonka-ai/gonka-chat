import { Run, Providers } from '@librechat/agents';
import { providerEndpointMap, KnownEndpoints } from 'librechat-data-provider';
import type {
  StandardGraphConfig,
  EventHandler,
  GenericTool,
  GraphEvents,
  IState,
} from '@librechat/agents';
import type { Agent } from 'librechat-data-provider';
import type * as t from '~/types';

const customProviders = new Set([
  Providers.XAI,
  Providers.OLLAMA,
  Providers.DEEPSEEK,
  Providers.OPENROUTER,
]);

/**
 * Creates a new Run instance with custom handlers and configuration.
 *
 * @param options - The options for creating the Run instance.
 */
export async function createRun({
  runId,
  agent,
  signal,
  customHandlers,
  streaming = true,
  streamUsage = true,
}: {
  agent: Omit<Agent, 'tools'> & { tools?: GenericTool[] };
  signal: AbortSignal;
  runId?: string;
  streaming?: boolean;
  streamUsage?: boolean;
  customHandlers?: Record<GraphEvents, EventHandler>;
}): Promise<Run<IState>> {
  const provider =
    (providerEndpointMap[
      agent.provider as keyof typeof providerEndpointMap
    ] as unknown as Providers) ?? agent.provider;

  console.log('packages/api/src/agents/run.ts SAYS agent', agent);
  const llmConfig: t.RunLLMConfig = Object.assign(
    {
      provider,
      streaming,
      streamUsage,
      endpoint: agent.endpoint, // add our custom parameter 
    },
    agent.model_parameters,
  );

  console.log('packages/api/src/agents/run.ts SAYS llmConfig', llmConfig);
  /** Resolves issues with new OpenAI usage field */
  if (
    customProviders.has(agent.provider) ||
    (agent.provider === Providers.OPENAI && agent.endpoint !== agent.provider)
  ) {
    llmConfig.streamUsage = false;
    llmConfig.usage = true;
  }

  let reasoningKey: 'reasoning_content' | 'reasoning' | undefined;
  if (provider === Providers.GOOGLE) {
    reasoningKey = 'reasoning';
  } else if (
    llmConfig.configuration?.baseURL?.includes(KnownEndpoints.openrouter) ||
    (agent.endpoint && agent.endpoint.toLowerCase().includes(KnownEndpoints.openrouter))
  ) {
    reasoningKey = 'reasoning';
  }

  const graphConfig: StandardGraphConfig = {
    signal,
    llmConfig,
    reasoningKey,
    tools: agent.tools,
    instructions: agent.instructions,
    additional_instructions: agent.additional_instructions,
  };

  console.log('packages/api/src/agents/run.ts SAYS graphConfig', graphConfig);

  if (agent.provider === Providers.ANTHROPIC || agent.provider === Providers.BEDROCK) {
    graphConfig.streamBuffer = 2000;
  }

  return Run.create({
    runId,
    graphConfig,
    customHandlers,
  });
}
