const { EventEmitter } = require('events');
const { TaskQueue } = require('./queue');
const { ChainExecutor } = require('./chains/executor');
const logger = require('./utils/logger');

class AgentOrchestrator extends EventEmitter {
    constructor({ planner, chains, maxConcurrent = 5, retryAttempts = 3 }) {
        super();
        this.planner = planner;
        this.queue = new TaskQueue({ concurrency: maxConcurrent });
        this.executors = new Map();
        this.retryAttempts = retryAttempts;
        this.chains = chains;
    }

    async initialize() {
        for (const chain of this.chains) {
            const executor = new ChainExecutor(chain);
            await executor.connect();
            this.executors.set(chain, executor);
            logger.info(`Connected to ${chain}`);
        }
    }

    async executeGoal(goal, context = {}) {
        logger.info(`New goal: ${goal}`);
        
        // MiMo decomposes goal into sub-tasks
        const plan = await this.planner.decompose(goal, {
            availableChains: this.chains,
            walletAddress: context.walletAddress,
            balance: context.balance
        });

        logger.info(`Plan: ${plan.tasks.length} tasks, ${plan.dependencies.length} dependencies`);
        
        const results = [];
        const completed = new Set();

        for (const task of plan.tasks) {
            const deps = plan.dependencies
                .filter(d => d.to === task.id)
                .map(d => d.from);

            if (deps.every(d => completed.has(d))) {
                try {
                    const result = await this._executeTask(task, context);
                    results.push({ taskId: task.id, status: 'success', result });
                    completed.add(task.id);
                } catch (err) {
                    results.push({ taskId: task.id, status: 'failed', error: err.message });
                    if (task.critical) break;
                }
            }
        }

        return { plan, results };
    }

    async _executeTask(task, context) {
        const executor = this.executors.get(task.chain);
        if (!executor) throw new Error(`No executor for chain: ${task.chain}`);

        for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
            try {
                return await executor.execute(task, context);
            } catch (err) {
                logger.warn(`Task ${task.id} attempt ${attempt + 1} failed: ${err.message}`);
                if (attempt === this.retryAttempts - 1) throw err;
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            }
        }
    }
}

module.exports = { AgentOrchestrator };
