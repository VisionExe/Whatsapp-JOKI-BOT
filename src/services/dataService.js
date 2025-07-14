const fs               = require('fs').promises;
const path             = require('path');
const config           = require('../config/config');

class DataService {

    static async initialize_data() {
        try {
            // Create data directory if it doesn't exist
            const dataDir = path.dirname(config.ORDERS_FILE);
            await fs.mkdir(dataDir, { recursive: true });
            
            // Initialize files
            await this.initialize_file(config.ORDERS_FILE, []);
            await this.initialize_file(config.USERS_FILE, []);
            await this.initialize_file(config.COMPLAINTS_FILE, []);
            
            console.log('✅ Data files initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing data:', error);
        }
    }

    static async initialize_file(filePath, defaultData) {
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
        }
    }

    static async read_file(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`❌ Error reading file ${filePath}:`, error);
            return [];
        }
    }

    static async write_file(filePath, data) {
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`❌ Error writing file ${filePath}:`, error);
        }
    }

    // Orders management
    static async get_orders() {
        return await this.read_file(config.ORDERS_FILE);
    }

    static async save_orders(orders) {
        await this.write_file(config.ORDERS_FILE, orders);
    }

    static async add_order(order) {
        const orders = await this.get_orders();
        orders.push(order);
        await this.save_orders(orders);
    }

    static async update_order(orderId, updateData) {
        const orders = await this.get_orders();
        const index = orders.findIndex(order => order.id === orderId);
        if (index !== -1) {
            orders[index] = { ...orders[index], ...updateData };
            await this.save_orders(orders);
            return orders[index];
        }
        return null;
    }

    // Users management
    static async get_users() {
        return await this.read_file(config.USERS_FILE);
    }

    static async save_users(users) {
        await this.write_file(config.USERS_FILE, users);
    }

    static async add_user(user) {
        const users = await this.get_users();
        const existingUser = users.find(u => u.phoneNumber === user.phoneNumber);
        if (!existingUser) {
            users.push(user);
            await this.save_users(users);
        }
    }

    static async update_user(phoneNumber, updateData) {
        const users = await this.get_users();
        const index = users.findIndex(user => user.phoneNumber === phoneNumber);
        if (index !== -1) {
            users[index] = { ...users[index], ...updateData };
            await this.save_users(users);
            return users[index];
        }
        return null;
    }

    // Complaints management
    static async get_complaints() {
        return await this.read_file(config.COMPLAINTS_FILE);
    }

    static async save_complaints(complaints) {
        await this.write_file(config.COMPLAINTS_FILE, complaints);
    }

    static async add_complaint(complaint) {
        const complaints = await this.get_complaints();
        complaints.push(complaint);
        await this.save_complaints(complaints);
    }

}

module.exports = DataService;
