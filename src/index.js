const { AgentOrchestrator } = require('./orchestrator');
const { MiMoPlanner } = require('./planner/mimo-planner');
const { TelegramInterface } = require('./interfaces/telegram');
const { loadConfig } = require('./config');
const logger = require('./utils/logger');

async function main() {
    const config = loadConfig();
    
    const planner = new MiMoPlanner({
        apiKey: config.MIMO_API_KEY,
        model: 'mimo-v2.5-pro',
        maxTokens: 4096
    });

    const orchestrator = new AgentOrchestrator({
        planner,
        chains: config.CHAINS,
        maxConcurrent: 5,
        retryAttempts: 3
    });

    const telegram = new TelegramInterface({
        token: config.TELEGRAM_BOT_TOKEN,
        orchestrator
    });

    await orchestrator.initialize();
    await telegram.start();
    
    logger.info('MiMo Agent Hub started');
    logger.info(`Connected chains: ${config.CHAINS.join(', ')}`);
}

main().catch(err => {
    logger.error('Fatal:', err);
    process.exit(1);
});
