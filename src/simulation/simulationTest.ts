
import { test } from '@jest/globals';
import { SimulationAgent, AgentConstructorArgs } from './agent/SimulationAgent';
import { SimulationAgentRunner } from './SimulationAgentRunner';

export interface SimulationContext {
  agent: SimulationAgent;
  logs: string[];
} 

type SimulationFn = (context: SimulationContext) => void | Promise<void>;

/**
 * Creates a Jest test that executes a simulation with the following sequence:
 * 
 * 1. Creates a SimulationAgentRunner with the provided configuration
 * 2. Provides the agent to the test function BEFORE running any turns
 *    This allows the test to set up event listeners that will capture the entire simulation
 * 3. Executes the test function where you can set up event handlers and expectations
 * 4. After the test function completes, runs all simulation turns to completion
 * 
 * The test function receives a SimulationContext containing:
 * - agent: The SimulationAgent instance with agent.events for setting up handlers
 * - logs: Array for collecting test logs
 * 
 * Example:
 * ```typescript
 * simulationTest(
 *   'captures all turn events',
 *   { role: 'test', task: 'example', inputFn, maxTurns: 3 },
 *   async ({ agent, logs }) => {
 *     // Set up handlers BEFORE any turns run
 *     agent.events.on('turnStart', state => logs.push(`Turn ${state.currentTurn}`));
 *     
 *     // Simulation runs AFTER this function returns
 *     // All events will be captured because handlers were set up first
 *   }
 * );
 * ```
 */
export function simulationTest(
  name: string,
  agentArgs: AgentConstructorArgs,
  fn: SimulationFn,
): void {
  test(name, async () => {
    const logs: string[] = [];

    // Create the runner but don't start the simulation yet
    const runner = new SimulationAgentRunner(agentArgs);
    const agent = runner.getAgent();

    // Provide context to test function first, allowing setup of event handlers
    const context: SimulationContext = { 
      agent,
      logs
    };
    await fn(context);

    // Only after test setup is complete, run the simulation
    await runner.runAllTurns();
  });
}
