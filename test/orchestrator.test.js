const { AgentOrchestrator } = require('../src/orchestrator');

describe('AgentOrchestrator', () => {
    let orchestrator;
    let mockPlanner;

    beforeEach(() => {
        mockPlanner = {
            decompose: jest.fn().mockResolvedValue({
                tasks: [
                    { id: 't1', type: 'check', chain: 'ethereum', action: 'check_balance', params: { address: '0x123' }, critical: false }
                ],
                dependencies: []
            })
        };
        orchestrator = new AgentOrchestrator({
            planner: mockPlanner,
            chains: ['ethereum'],
            maxConcurrent: 2
        });
    });

    test('should initialize with correct chain count', () => {
        expect(orchestrator.chains).toHaveLength(1);
        expect(orchestrator.chains).toContain('ethereum');
    });

    test('should have correct queue concurrency', () => {
        expect(orchestrator.queue.concurrency).toBe(2);
    });

    test('should call planner on executeGoal', async () => {
        // Mock executor
        orchestrator.executors.set('ethereum', {
            execute: jest.fn().mockResolvedValue({ balance: '1.0', chain: 'ethereum' })
        });
        
        await orchestrator.executeGoal('Check balance', {});
        expect(mockPlanner.decompose).toHaveBeenCalled();
    });
});
