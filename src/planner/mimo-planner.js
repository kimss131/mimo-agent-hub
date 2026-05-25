const axios = require('axios');
const logger = require('../utils/logger');

class MiMoPlanner {
    constructor({ apiKey, model = 'mimo-v2.5-pro', maxTokens = 4096 }) {
        this.apiKey = apiKey;
        this.model = model;
        this.maxTokens = maxTokens;
        this.endpoint = 'https://api.xiaomimimo.com/v1/chat/completions';
    }

    async decompose(goal, context) {
        const prompt = this._buildPrompt(goal, context);
        
        const response = await axios.post(this.endpoint, {
            model: this.model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            max_tokens: this.maxTokens,
            temperature: 0.2
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const plan = JSON.parse(response.data.choices[0].message.content);
        return this._validatePlan(plan);
    }

    _buildPrompt(goal, context) {
        return `
Goal: ${goal}
Available Chains: ${context.availableChains.join(', ')}
Wallet: ${context.walletAddress || 'not set'}
Balance: ${context.balance || 'unknown'}

Decompose this goal into executable sub-tasks with dependencies.
Return JSON format: { tasks: [...], dependencies: [...] }
Each task: { id, type, chain, action, params, critical }
Each dependency: { from, to }
        `.trim();
    }

    _validatePlan(plan) {
        if (!plan.tasks || !Array.isArray(plan.tasks)) {
            throw new Error('Invalid plan: missing tasks array');
        }
        if (!plan.dependencies) plan.dependencies = [];
        return plan;
    }
}

const SYSTEM_PROMPT = `You are a task decomposition engine for Web3 operations.
Break complex goals into atomic sub-tasks. Each task must:
- Target a specific chain
- Have clear input/output
- Specify if it's critical (abort on failure)
- Respect gas limits and nonce ordering

Output valid JSON only.`;

module.exports = { MiMoPlanner };
