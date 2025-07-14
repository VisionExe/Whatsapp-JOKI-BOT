const { v4: uuidv4 }   = require('uuid');
const DataService      = require('./dataService');
const config           = require('../config/config');

class ComplaintService {

    static async create_complaint(userPhone, userName, message) {
        const complaint = {
            id          : uuidv4(),
            userPhone   : userPhone,
            userName    : userName,
            message     : message,
            status      : 'open',
            createdAt   : new Date().toISOString(),
            resolvedAt  : null,
            adminReply  : null
        };

        await DataService.add_complaint(complaint);
        return complaint;
    }

    static async get_complaints_by_user(userPhone) {
        const complaints = await DataService.get_complaints();
        return complaints.filter(complaint => complaint.userPhone === userPhone);
    }

    static async get_all_complaints() {
        return await DataService.get_complaints();
    }

    static format_complaint_for_admin(complaint) {
        return `🚨 *NEW COMPLAINT*\n\n` +
               `📋 *Complaint ID:* ${complaint.id}\n` +
               `👤 *User:* ${complaint.userName}\n` +
               `📱 *Phone:* ${complaint.userPhone}\n` +
               `💬 *Message:*\n${complaint.message}\n` +
               `🕐 *Time:* ${new Date(complaint.createdAt).toLocaleString('id-ID')}\n\n` +
               `⚠️ *Please respond to this complaint as soon as possible*`;
    }

    static format_complaint_confirmation(complaint) {
        return `✅ *Complaint Submitted Successfully*\n\n` +
               `📋 *Complaint ID:* ${complaint.id}\n` +
               `💬 *Your Message:*\n${complaint.message}\n` +
               `🕐 *Submitted:* ${new Date(complaint.createdAt).toLocaleString('id-ID')}\n\n` +
               `🔔 *Admin telah diberitahu dan akan merespons segera*\n` +
               `⏰ *Estimasi respons: 1-24 jam*`;
    }

}

module.exports = ComplaintService;
