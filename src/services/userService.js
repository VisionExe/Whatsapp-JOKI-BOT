const { v4: uuidv4 }   = require('uuid');
const DataService      = require('./dataService');
const config           = require('../config/config');

class UserService {

    static async create_user(phoneNumber, name) {
        const user = {
            id           : uuidv4(),
            phoneNumber  : phoneNumber,
            name         : name,
            totalOrders  : 0,
            totalSpent   : 0,
            currentMoney : 0,
            targetMoney  : 0,
            createdAt    : new Date().toISOString(),
            lastActivity : new Date().toISOString()
        };

        await DataService.add_user(user);
        return user;
    }

    static async get_user_by_phone(phoneNumber) {
        const users = await DataService.get_users();
        return users.find(user => user.phoneNumber === phoneNumber);
    }

    static async update_user_activity(phoneNumber) {
        await DataService.update_user(phoneNumber, {
            lastActivity: new Date().toISOString()
        });
    }

    static async update_user_stats(phoneNumber, orderAmount) {
        const user = await this.get_user_by_phone(phoneNumber);
        if (user) {
            const updateData = {
                totalOrders  : user.totalOrders + 1,
                totalSpent   : user.totalSpent + orderAmount,
                currentMoney : user.currentMoney + (orderAmount / config.JOKI_PRICE_PER_1000),
                lastActivity : new Date().toISOString()
            };

            return await DataService.update_user(phoneNumber, updateData);
        }
        return null;
    }

    static async set_user_target(phoneNumber, targetAmount) {
        return await DataService.update_user(phoneNumber, {
            targetMoney: targetAmount,
            lastActivity: new Date().toISOString()
        });
    }

    static calculate_progress(currentMoney, targetMoney) {
        if (targetMoney === 0) return 0;
        return Math.min((currentMoney / targetMoney) * 100, 100);
    }

    static format_activity_report(user) {
        const progress = this.calculate_progress(user.currentMoney, user.targetMoney);
        
        return `📊 *Account Activity Report*\n\n` +
               `👤 *Name:* ${user.name}\n` +
               `📱 *Phone:* ${user.phoneNumber}\n` +
               `💰 *Current Money:* ${user.currentMoney.toLocaleString()} (In-Game)\n` +
               `🎯 *Target Money:* ${user.targetMoney.toLocaleString()} (In-Game)\n` +
               `📈 *Progress:* ${progress.toFixed(1)}%\n` +
               `📦 *Total Orders:* ${user.totalOrders}\n` +
               `💸 *Total Spent:* Rp ${user.totalSpent.toLocaleString()}\n` +
               `🕐 *Last Activity:* ${new Date(user.lastActivity).toLocaleString('id-ID')}\n` +
               `⏰ *Member Since:* ${new Date(user.createdAt).toLocaleString('id-ID')}`;
    }

}

module.exports = UserService;
