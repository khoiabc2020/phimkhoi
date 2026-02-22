const db = db.getSiblingDB('phimkhoi');

print("=== WATCH HISTORY userIds ===");
const histUserIds = db.watchhistories.distinct('userId');
histUserIds.forEach(uid => {
    const count = db.watchhistories.countDocuments({ userId: uid });
    print("  userId: " + uid + "  -> " + count + " records");
});

print("\n=== FAVORITES userIds ===");
const favUserIds = db.favorites.distinct('userId');
favUserIds.forEach(uid => {
    const count = db.favorites.countDocuments({ userId: uid });
    print("  userId: " + uid + "  -> " + count + " records");
});

print("\n=== USERS in DB ===");
db.users.find({}, { name: 1, email: 1, role: 1 }).forEach(u => {
    print("  _id: " + u._id + "  name: " + u.name + "  email: " + u.email + "  role: " + u.role);
});
