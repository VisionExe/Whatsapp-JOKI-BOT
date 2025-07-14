const { Client, LocalAuth }     = require('whatsapp-web.js');
const qrcode                    = require('qrcode-terminal');
const config                    = require('./config/config');
const messageHandler            = require('./handlers/messageHandler');
const { initialize_data }       = require('./services/dataService');

class WhatsAppBot {

    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });
        
        this.initialize_bot();
    }

    initialize_bot() {
        // Event listeners
        this.client.on('qr', (qr) => {
            console.log('🔄 Generating QR Code...');
            qrcode.generate(qr, { small: true });
            console.log('📱 Scan QR Code dengan WhatsApp Anda');
        });

        this.client.on('ready', () => {
            console.log('✅ Bot siap digunakan!');
            console.log('🤖 WhatsApp JOKI Bot is running...');
            console.log('📊 Admin:', config.ADMIN_NUMBER);
        });

        this.client.on('message', async (message) => {
            try {
                await messageHandler.handle_message(message, this.client);
            } catch (error) {
                console.error('❌ Error handling message:', error);
            }
        });

        this.client.on('disconnected', (reason) => {
            console.log('⚠️ Bot disconnected:', reason);
        });
    }

    async start() {
        try {
            console.log('🚀 Starting WhatsApp JOKI Bot...');
            
            // Initialize data
            await initialize_data();
            
            // Start client
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Failed to start bot:', error);
        }
    }

}

// Start bot
const bot = new WhatsAppBot();
bot.start();
