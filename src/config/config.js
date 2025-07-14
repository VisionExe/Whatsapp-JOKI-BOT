const config = {
    // Admin Configuration
    ADMIN_NUMBER         : '628123456789@c.us', // Ganti dengan nomor admin yang sebenarnya
    
    // Bot Configuration
    BOT_NAME             : '🤖 JOKI Bot',
    BOT_VERSION          : '1.0.0',
    
    // Business Configuration
    JOKI_PRICE_PER_1000  : 1000000, // 1 miliar = 1000 IDR
    CURRENCY             : 'IDR',
    
    // Messages
    WELCOME_MESSAGE      : `🎮 *Selamat datang di JOKI Bot!*\n\n` +
                          `🎯 *Layanan JOKI (CDID)*\n` +
                          `💰 *Harga: 1 Miliar = 1.000 IDR*\n\n` +
                          `📋 *Menu Utama:*\n` +
                          `1️⃣ Order JOKI\n` +
                          `2️⃣ View Account Activity\n` +
                          `3️⃣ Complaint\n` +
                          `4️⃣ View Order ID\n` +
                          `5️⃣ Help\n\n` +
                          `💬 Ketik *menu* untuk melihat menu ini lagi`,
    
    ADMIN_MENU           : `👑 *Admin Menu*\n\n` +
                          `🔧 *Admin Commands:*\n` +
                          `• /pending - View Pending Orders\n` +
                          `• /users - View All Users\n` +
                          `• /orders - View All Orders\n` +
                          `• /stats - View Statistics\n` +
                          `• /broadcast - Broadcast Message\n\n` +
                          `📊 *User Commands:*\n` +
                          `• menu - Show main menu\n` +
                          `• order - Create new order\n` +
                          `• activity - View account activity\n` +
                          `• complaint - Submit complaint\n` +
                          `• orderid - View order ID`,
    
    // Status
    ORDER_STATUS         : {
        PENDING   : 'pending',
        PROGRESS  : 'progress',
        COMPLETED : 'completed',
        CANCELLED : 'cancelled'
    },
    
    // File paths
    DATA_DIR             : './data/',
    ORDERS_FILE          : './data/orders.json',
    USERS_FILE           : './data/users.json',
    COMPLAINTS_FILE      : './data/complaints.json'
};

module.exports = config;
