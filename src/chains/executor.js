const { ethers } = require('ethers');
const logger = require('../utils/logger');

const RPC_MAP = {
    ethereum: 'https://eth.llamarpc.com',
    base: 'https://mainnet.base.org',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    polygon: 'https://polygon-rpc.com'
};

class ChainExecutor {
    constructor(chain) {
        this.chain = chain;
        this.provider = new ethers.JsonRpcProvider(RPC_MAP[chain]);
    }

    async connect() {
        const blockNumber = await this.provider.getBlockNumber();
        logger.info(\`[\${this.chain}] Connected at block \${blockNumber}\`);
    }

    async execute(task, context) {
        switch (task.action) {
            case 'swap':
                return this._swap(task.params, context);
            case 'bridge':
                return this._bridge(task.params, context);
            case 'approve':
                return this._approve(task.params, context);
            case 'check_balance':
                return this._checkBalance(task.params, context);
            case 'estimate_gas':
                return this._estimateGas(task.params, context);
            default:
                throw new Error(\`Unknown action: \${task.action}\`);
        }
    }

    async _checkBalance(params, context) {
        const balance = await this.provider.getBalance(params.address);
        return {
            address: params.address,
            chain: this.chain,
            balance: ethers.formatEther(balance),
            symbol: this.chain === 'ethereum' ? 'ETH' : 'ETH'
        };
    }

    async _estimateGas(params, context) {
        const gasPrice = await this.provider.getFeeData();
        return {
            chain: this.chain,
            gasPrice: ethers.formatUnits(gasPrice.gasPrice, 'gwei'),
            maxFeePerGas: gasPrice.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei') : null,
            maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas ? ethers.formatUnits(gasPrice.maxPriorityFeePerGas, 'gwei') : null
        };
    }

    async _swap(params, context) {
        logger.info(\`[\${this.chain}] Swap \${params.amount} \${params.from} -> \${params.to}\`);
        // Integration with DEX aggregators (Paraswap, 0x, 1inch)
        throw new Error('Swap execution not implemented — use token-swap skill');
    }

    async _bridge(params, context) {
        logger.info(\`[\${this.chain}] Bridge \${params.amount} to \${params.destinationChain}\`);
        throw new Error('Bridge execution not implemented — use bridge-eth skill');
    }

    async _approve(params, context) {
        logger.info(\`[\${this.chain}] Approve \${params.token} for \${params spender}\`);
        throw new Error('Approve execution not implemented');
    }
}

module.exports = { ChainExecutor };
