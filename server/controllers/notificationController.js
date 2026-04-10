const { Notification } = require('../models');

// GET /api/notifications/my
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.userId },
      order: [['timestamp', 'DESC']],
      limit: 50,
    });
    const unreadCount = notifications.filter(n => n.status === 'unread').length;
    return res.json({ notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({
      where: { notificationId: req.params.id, userId: req.user.userId },
    });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    await notif.update({ status: 'read' });
    return res.json(notif);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { status: 'read' },
      { where: { userId: req.user.userId, status: 'unread' } }
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
