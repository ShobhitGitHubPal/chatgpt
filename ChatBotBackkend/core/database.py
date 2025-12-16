from common.mongo_client import MongoDBClient
from core.config import MONGO_URL, DB_NAME

mongo = MongoDBClient(uri=MONGO_URL, db_name=DB_NAME)

users_collection = mongo.get_collection("users")
