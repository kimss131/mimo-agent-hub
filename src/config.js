require('dotenv').config();

function loadConfig() {
    const required = ['MIMO_API_KEY', 'TELEGRAM_BOT_TOKEN'];
    for (const key of required) {
        if (!process.env[key]) {
            throw new Error(\`Missing required env var: \${key}\`);
        }
    }

    return {
        MIMO_API_KEY: process.env.MIMO_API_KEY,
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        WALLET_ADDRESS: process.env.WALLET_ADDRESS || '',
        CHAINS: (process.env.CHAINS || 'ethereum,base,arbitrum').split(','),
        LOG_LEVEL: process.env.LOG_LEVEL || 'info'
    };
}

module.exports = { loadConfig };
