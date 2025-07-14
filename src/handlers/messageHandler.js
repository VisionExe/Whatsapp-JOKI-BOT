const UserService       = require('../services/userService');
const OrderService      = require('../services/orderService');
const ComplaintService  = require('../services/complaintService');
const config            = require('../config/config');

class MessageHandler {

    static async handle_message(message, client) {
        // Skip if message is from status or group
        if (message.from === 'status@broadcast' || message.from.includes('@g.us')) {
            return;
        }

        // Get user info
        const phoneNumber = message.from.replace('@c.us', '');
        const contact = await message.getContact();
        const userName = contact.pushname || contact.name || 'User';

        // Check if user exists, if not create new user
        let user = await UserService.get_user_by_phone(phoneNumber);
        if (!user) {
            user = await UserService.create_user(phoneNumber, userName);
        }

        // Update user activity
        await UserService.update_user_activity(phoneNumber);

        // Handle message based on content
        const messageText = message.body.toLowerCase().trim();

        if (messageText === 'menu' || messageText === '/start') {
            await this.send_main_menu(message, client);
        } else if (messageText === '1' || messageText === 'order') {
            await this.handle_order_joki(message, client, user);
        } else if (messageText === '2' || messageText === 'activity') {
            await this.handle_view_activity(message, client, user);
        } else if (messageText === '3' || messageText === 'complaint') {
            await this.handle_complaint(message, client, user);
        } else if (messageText === '4' || messageText === 'order id') {
            await this.handle_view_order_id(message, client, user);
        } else if (messageText === '5' || messageText === 'pending' && this.is_admin(phoneNumber)) {
            await this.handle_view_pending_orders(message, client);
        } else if (messageText.startsWith('order:')) {
            await this.process_order(message, client, user);
        } else if (messageText.startsWith('complaint:')) {
            await this.process_complaint(message, client, user);
        } else if (messageText.startsWith('target:')) {
            await this.process_set_target(message, client, user);
        } else {
            await this.send_unknown_command(message, client);
        }
    }

    static async send_main_menu(message, client) {
        const menuText = `🎮 *WELCOME TO JOKI BOT* 🎮\n\n` +
                        `🎯 *Available Services:*\n` +
                        `1️⃣ Order JOKI (CDID)\n` +
                        `2️⃣ View Account Activity\n` +
                        `3️⃣ Submit Complaint\n` +
                        `4️⃣ View Order ID\n` +
                        `5️⃣ View Pending Orders (Admin Only)\n\n` +
                        `💰 *Current Rate:* Rp ${config.JOKI_PRICE_PER_1000.toLocaleString()} per 1 Billion in-game money\n\n` +
                        `📝 *How to use:*\n` +
                        `• Type the number (1-5) or keyword\n` +
                        `• Follow the instructions\n\n` +
                        `🤖 Type "menu" anytime to see this menu`;

        await client.sendMessage(message.from, menuText);
    }

    static async handle_order_joki(message, client, user) {
        const orderText = `💰 *ORDER JOKI SERVICE* 💰\n\n` +
                         `💵 *Current Rate:* Rp ${config.JOKI_PRICE_PER_1000.toLocaleString()} per 1 Billion in-game money\n\n` +
                         `📝 *How to order:*\n` +
                         `Type: order:[amount in billions]\n\n` +
                         `📋 *Example:*\n` +
                         `• order:5 (for 5 billion)\n` +
                         `• order:10 (for 10 billion)\n\n` +
                         `⚠️ *Important:*\n` +
                         `• Minimum order: 1 billion\n` +
                         `• Maximum order: 100 billion\n` +
                         `• Payment required before processing\n\n` +
                         `🔙 Type "menu" to return to main menu`;

        await client.sendMessage(message.from, orderText);
    }

    static async handle_view_activity(message, client, user) {
        const activityReport = UserService.format_activity_report(user);
        
        const additionalInfo = `\n\n📊 *Set Target:*\n` +
                              `Type: target:[amount]\n` +
                              `Example: target:50 (for 50 billion target)\n\n` +
                              `🔙 Type "menu" to return to main menu`;

        await client.sendMessage(message.from, activityReport + additionalInfo);
    }

    static async handle_complaint(message, client, user) {
        const complaintText = `📞 *COMPLAINT SYSTEM* 📞\n\n` +
                             `🚨 *Submit your complaint and admin will contact you directly*\n\n` +
                             `📝 *How to submit:*\n` +
                             `Type: complaint:[your message]\n\n` +
                             `📋 *Example:*\n` +
                             `complaint:Order belum selesai setelah 24 jam\n\n` +
                             `⚠️ *Important:*\n` +
                             `• Admin will respond within 1-24 hours\n` +
                             `• Please be clear and detailed\n` +
                             `• Include order ID if applicable\n\n` +
                             `🔙 Type "menu" to return to main menu`;

        await client.sendMessage(message.from, complaintText);
    }

    static async handle_view_order_id(message, client, user) {
        const orders = await OrderService.get_orders_by_user(user.phoneNumber);
        
        if (orders.length === 0) {
            await client.sendMessage(message.from, 
                `📦 *YOUR ORDERS* 📦\n\n` +
                `❌ No orders found\n\n` +
                `🛒 Type "1" to place your first order\n` +
                `🔙 Type "menu" to return to main menu`
            );
            return;
        }

        let orderText = `📦 *YOUR ORDERS* 📦\n\n`;
        
        orders.forEach((order, index) => {
            const status = this.get_status_emoji(order.status);
            orderText += `${index + 1}. *Order ID:* ${order.id.substring(0, 8)}\n` +
                        `   💰 Amount: ${(order.amount / 1000000000).toLocaleString()} Billion\n` +
                        `   ${status} Status: ${order.status.toUpperCase()}\n` +
                        `   📅 Created: ${new Date(order.createdAt).toLocaleString('id-ID')}\n` +
                        `   📊 Progress: ${order.progress}%\n\n`;
        });

        orderText += `🔙 Type "menu" to return to main menu`;
        
        await client.sendMessage(message.from, orderText);
    }

    static async handle_view_pending_orders(message, client) {
        const pendingOrders = await OrderService.get_pending_orders();
        
        if (pendingOrders.length === 0) {
            await client.sendMessage(message.from, 
                `👑 *ADMIN - PENDING ORDERS* 👑\n\n` +
                `✅ No pending orders\n\n` +
                `🔙 Type "menu" to return to main menu`
            );
            return;
        }

        let orderText = `👑 *ADMIN - PENDING ORDERS* 👑\n\n`;
        
        pendingOrders.forEach((order, index) => {
            orderText += `${index + 1}. *Order ID:* ${order.id.substring(0, 8)}\n` +
                        `   👤 User: ${order.userPhone}\n` +
                        `   💰 Amount: ${(order.amount / 1000000000).toLocaleString()} Billion\n` +
                        `   💵 Price: ${OrderService.format_currency(order.amount / 1000000000 * config.JOKI_PRICE_PER_1000)}\n` +
                        `   📅 Created: ${new Date(order.createdAt).toLocaleString('id-ID')}\n` +
                        `   ⏰ Est. Time: ${order.estimatedTime} hours\n\n`;
        });

        orderText += `🔙 Type "menu" to return to main menu`;
        
        await client.sendMessage(message.from, orderText);
    }

    static async process_order(message, client, user) {
        const orderAmount = message.body.split(':')[1];
        const amountInBillions = parseFloat(orderAmount);

        if (isNaN(amountInBillions) || amountInBillions < 1 || amountInBillions > 100) {
            await client.sendMessage(message.from, 
                `❌ *Invalid Amount*\n\n` +
                `Please enter amount between 1-100 billions\n` +
                `Example: order:5\n\n` +
                `🔙 Type "menu" to return to main menu`
            );
            return;
        }

        const amountInGame = amountInBillions * 1000000000;
        const priceInIDR = amountInBillions * config.JOKI_PRICE_PER_1000;

        // Create order
        const order = await OrderService.create_order(user.phoneNumber, {
            amount: amountInGame,
            description: `JOKI ${amountInBillions} Billion in-game money`
        });

        // Update user stats
        await UserService.update_user_stats(user.phoneNumber, priceInIDR);

        // Send confirmation
        const confirmationText = `✅ *ORDER CREATED SUCCESSFULLY* ✅\n\n` +
                               `📋 *Order ID:* ${order.id.substring(0, 8)}\n` +
                               `💰 *Amount:* ${amountInBillions.toLocaleString()} Billion (in-game)\n` +
                               `💵 *Price:* ${OrderService.format_currency(priceInIDR)}\n` +
                               `⏰ *Estimated Time:* ${order.estimatedTime} hours\n` +
                               `📊 *Status:* PENDING\n\n` +
                               `🔔 *Admin has been notified*\n` +
                               `💳 *Payment instructions will be sent shortly*\n\n` +
                               `🔙 Type "menu" to return to main menu`;

        await client.sendMessage(message.from, confirmationText);

        // Notify admin
        await this.notify_admin_new_order(client, order, user);
    }

    static async process_complaint(message, client, user) {
        const complaintMessage = message.body.split(':')[1];

        if (!complaintMessage || complaintMessage.trim().length < 10) {
            await client.sendMessage(message.from, 
                `❌ *Complaint too short*\n\n` +
                `Please provide detailed complaint (minimum 10 characters)\n` +
                `Example: complaint:Order belum selesai setelah 24 jam\n\n` +
                `🔙 Type "menu" to return to main menu`
            );
            return;
        }

        // Create complaint
        const complaint = await ComplaintService.create_complaint(
            user.phoneNumber,
            user.name,
            complaintMessage.trim()
        );

        // Send confirmation to user
        const confirmationText = ComplaintService.format_complaint_confirmation(complaint);
        await client.sendMessage(message.from, confirmationText);

        // Send to admin
        await this.notify_admin_new_complaint(client, complaint);
    }

    static async process_set_target(message, client, user) {
        const targetAmount = message.body.split(':')[1];
        const amountInBillions = parseFloat(targetAmount);

        if (isNaN(amountInBillions) || amountInBillions < 1) {
            await client.sendMessage(message.from, 
                `❌ *Invalid Target Amount*\n\n` +
                `Please enter valid amount (minimum 1 billion)\n` +
                `Example: target:50\n\n` +
                `🔙 Type "menu" to return to main menu`
            );
            return;
        }

        const targetInGame = amountInBillions * 1000000000;
        
        // Update user target
        await UserService.set_user_target(user.phoneNumber, targetInGame);

        const confirmationText = `🎯 *TARGET SET SUCCESSFULLY* 🎯\n\n` +
                               `💰 *New Target:* ${amountInBillions.toLocaleString()} Billion (in-game)\n` +
                               `📊 *Current Money:* ${(user.currentMoney / 1000000000).toLocaleString()} Billion\n` +
                               `📈 *Progress:* ${UserService.calculate_progress(user.currentMoney, targetInGame).toFixed(1)}%\n\n` +
                               `🔙 Type "menu" to return to main menu`;

        await client.sendMessage(message.from, confirmationText);
    }

    static async notify_admin_new_order(client, order, user) {
        try {
            const adminNumber = config.ADMIN_NUMBER + '@c.us';
            const priceInIDR = (order.amount / 1000000000) * config.JOKI_PRICE_PER_1000;
            
            const adminMessage = `🛒 *NEW ORDER RECEIVED* 🛒\n\n` +
                               `📋 *Order ID:* ${order.id.substring(0, 8)}\n` +
                               `👤 *Customer:* ${user.name}\n` +
                               `📱 *Phone:* ${user.phoneNumber}\n` +
                               `💰 *Amount:* ${(order.amount / 1000000000).toLocaleString()} Billion\n` +
                               `💵 *Price:* ${OrderService.format_currency(priceInIDR)}\n` +
                               `⏰ *Est. Time:* ${order.estimatedTime} hours\n` +
                               `📅 *Created:* ${new Date(order.createdAt).toLocaleString('id-ID')}\n\n` +
                               `⚠️ *Please process this order*`;

            await client.sendMessage(adminNumber, adminMessage);
        } catch (error) {
            console.error('❌ Error notifying admin:', error);
        }
    }

    static async notify_admin_new_complaint(client, complaint) {
        try {
            const adminNumber = config.ADMIN_NUMBER + '@c.us';
            const adminMessage = ComplaintService.format_complaint_for_admin(complaint);
            await client.sendMessage(adminNumber, adminMessage);
        } catch (error) {
            console.error('❌ Error notifying admin about complaint:', error);
        }
    }

    static async send_unknown_command(message, client) {
        const unknownText = `❓ *Unknown Command* ❓\n\n` +
                          `🤖 I don't understand that command\n\n` +
                          `📋 *Available commands:*\n` +
                          `• menu - Show main menu\n` +
                          `• 1 or "order" - Order JOKI\n` +
                          `• 2 or "activity" - View activity\n` +
                          `• 3 or "complaint" - Submit complaint\n` +
                          `• 4 or "order id" - View orders\n\n` +
                          `🔙 Type "menu" to see all options`;

        await client.sendMessage(message.from, unknownText);
    }

    static get_status_emoji(status) {
        switch (status.toLowerCase()) {
            case 'pending': return '⏳';
            case 'processing': return '⚙️';
            case 'completed': return '✅';
            case 'cancelled': return '❌';
            default: return '📋';
        }
    }

    static is_admin(phoneNumber) {
        return phoneNumber === config.ADMIN_NUMBER;
    }

}

module.exports = MessageHandler;
