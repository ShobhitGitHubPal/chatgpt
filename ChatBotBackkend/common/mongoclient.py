from pymongo import MongoClient, errors
from threading import Lock

class MongoDBClient:
    __instance = None
    __lock = Lock()

    def __new__(cls, *args, **kwargs):
        if not cls.__instance:
            with cls.__lock:
                if not cls.__instance:
                    cls.__instance = super(MongoDBClient, cls).__new__(cls)
        return cls.__instance

    def __init__(self,
                 uri: str = "mongodb://localhost:27017",
                 min_pool_size: int = 1,
                 max_pool_size: int = 20,
                 db_name: str = None):

        if hasattr(self, "initialized") and self.initialized:
            return

        self.initialized = True
        self.uri = uri
        self.db_name = db_name

        try:
            self.client = MongoClient(
                uri,
                minPoolSize=min_pool_size,
                maxPoolSize=max_pool_size,
                serverSelectionTimeoutMS=5000,
                connect=True
            )
            self.client.admin.command("ping")

        except errors.ServerSelectionTimeoutError as e:
            raise Exception(f"MongoDB connection failed: {str(e)}")

        self.db = self.client[db_name] if db_name else None

    def use_database(self, db_name: str):
        self.db = self.client[db_name]

    def get_collection(self, collection: str):
        if not self.db:
            raise Exception("Database not selected. Call use_database(db_name).")
        return self.db[collection]

    def insert_one(self, collection: str, data: dict):
        return self.get_collection(collection).insert_one(data).inserted_id

    def find_one(self, collection: str, query: dict, projection=None):
        return self.get_collection(collection).find_one(query, projection)

    def update_one(self, collection: str, query: dict, update: dict):
        return self.get_collection(collection).update_one(query, update)

    def delete_one(self, collection: str, query: dict):
        return self.get_collection(collection).delete_one(query)
