const { LOG_CHANNEL_ID } = require('./constants');
exports.sendLogMessage = function (bot, logMessage) {
  if (!LOG_CHANNEL_ID) {
    console.error('LOG_CHANNEL_ID is not set.');
    return;
  }

  const log = `${logMessage}
env: ${process.env.NODE_ENV === 'production' ? 'prod' : 'dev'}`;
  bot.sendMessage(LOG_CHANNEL_ID, log);
};

exports.getChatName = function (msg) {
  if (!msg || !msg.chat) {
    return 'Unknown Chat';
  }
  if (msg.chat.title) {
    return msg.chat.title;
  }
  if (msg.chat.username) {
    return msg.chat.username;
  }
  if (msg.chat.first_name || msg.chat.last_name) {
    return `${msg.chat.first_name || ''} ${msg.chat.last_name || ''}`;
  }
  return 'Unknown Chat';
};
