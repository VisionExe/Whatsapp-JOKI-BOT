const { v4: uuidv4 }   = require('uuid');
const DataService      = require('./dataService');
const config           = require('../config/config');

class OrderService {

    static async create_order(userPhone, orderData) {
        const order = {
            id           : uuidv4(),
            userPhone    : userPhone,
            amount       : orderData.amount,
            description  : orderData.description,
            status       : config.ORDER_STATUS.PENDING,
            createdAt    : new Date().toISOString(),
            updatedAt    : new Date().toISOString(),
            estimatedTime: this.calculate_estimated_time(orderData.amount),
            progress     : 0
        };

        await DataService.add_order(order);
        return order;
    }

    static async get_orders_by_user(userPhone) {
        const orders = await DataService.get_orders();
        return orders.filter(order => order.userPhone === userPhone);
    }

    static async get_order_by_id(orderId) {
        const orders = await DataService.get_orders();
        return orders.find(order => order.id === orderId);
    }

    static async update_order_status(orderId, status, progress = null) {
        const updateData = {
            status,
            updatedAt: new Date().toISOString()
        };

        if (progress !== null) {
            updateData.progress = progress;
        }

        return await DataService.update_order(orderId, updateData);
    }

    static async get_pending_orders() {
        const orders = await DataService.get_orders();
        return orders.filter(order => order.status === config.ORDER_STATUS.PENDING);
    }

    static calculate_estimated_time(amount) {
        const amountInBillions = amount / 1000000000;
        const hoursNeeded      = amountInBillions / 3;
        
        return Math.max(0.33, hoursNeeded);
    }

    static format_currency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: config.CURRENCY
        }).format(amount);
    }

}

module.exports = OrderService;
