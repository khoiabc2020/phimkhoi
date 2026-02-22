from pymongo import MongoClient
import os

# Connect to local MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['phimkhoi']

print("=== WATCH HISTORY userIds ===")
userIds = db.watchhistories.distinct('userId')
for uid in userIds:
    count = db.watchhistories.count_documents({'userId': uid})
    print(f"  userId: {uid}  ->  {count} records")

print("\n=== FAVORITES userIds ===")
favIds = db.favorites.distinct('userId')
for uid in favIds:
    count = db.favorites.count_documents({'userId': uid})
    print(f"  userId: {uid}  ->  {count} records")

print("\n=== USERS in DB ===")
users = list(db.users.find({}, {'name': 1, 'email': 1, 'role': 1, '_id': 1}))
for u in users:
    print(f"  _id: {u['_id']}  name: {u.get('name')}  email: {u.get('email')}  role: {u.get('role')}")

client.close()
