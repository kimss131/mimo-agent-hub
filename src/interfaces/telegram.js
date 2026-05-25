const { Telegraf } = require('telegraf');
const logger = require('../utils/logger');

class TelegramInterface {
    constructor({ token, orchestrator }) {
        this.bot = new Telegraf(token);
        this.orchestrator = orchestrator;
        this._setupCommands();
    }

    _setupCommands() {
        this.bot.command('start', (ctx) => {
            ctx.reply('MiMo Agent Hub ready. Send a goal and I\'ll execute it.');
        });

        this.bot.command('balance', async (ctx) => {
            const results = await this.orchestrator.executeGoal(
                'Check ETH balance on all chains',
                { walletAddress: process.env.WALLET_ADDRESS }
            );
            const msg = results.results
                .filter(r => r.status === 'success')
                .map(r => \`\${r.result.chain}: \${r.result.balance} ETH\`)
                .join('\n');
            ctx.reply(msg || 'No balance data');
        });

        this.bot.command('gas', async (ctx) => {
            const chains = ['ethereum', 'base', 'arbitrum'];
            const results = await this.orchestrator.executeGoal(
                'Check current gas prices',
                {}
            );
            ctx.reply(JSON.stringify(results, null, 2));
        });

        this.bot.on('text', async (ctx) => {
            const goal = ctx.message.text;
            ctx.reply(\`Executing: \${goal}\`);
            try {
                const result = await this.orchestrator.executeGoal(goal, {
                    walletAddress: process.env.WALLET_ADDRESS
                });
                ctx.reply(JSON.stringify(result, null, 2).substring(0, 4000));
            } catch (err) {
                ctx.reply(\`Error: \${err.message}\`);
            }
        });
    }

    async start() {
        await this.bot.launch();
        logger.info('Telegram bot started');
    }
}

module.exports = { TelegramInterface };
