# common/db_config.py

from pymongo import MongoClient, errors
from threading import Lock


class MongoDBClient:
    """
    Thread-safe, Singleton MongoDB connection manager.
    Supports connection pooling and reusable CRUD helper functions.
    """

    __instance = None
    __lock = Lock()

    def __new__(cls, *args, **kwargs):
        if not cls.__instance:
            with cls.__lock:
                if not cls.__instance:
                    cls.__instance = super(MongoDBClient, cls).__new__(cls)
        return cls.__instance

    def __init__(
        self,
        uri: str = "mongodb://localhost:27017",
        min_pool_size: int = 1,
        max_pool_size: int = 20,
        db_name: str = None
    ):
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

    # ========= DATABASE + COLLECTION LOADING ==========
    def use_database(self, db_name: str):
        self.db = self.client[db_name]

    def get_collection(self, collection: str):
        if self.db is None:   # ✅ change here
            raise Exception("Database not selected. Call use_database(db_name).")
        return self.db[collection]


    # ============== CRUD METHODS ======================
    def insert_one(self, collection: str, data: dict):
        return self.get_collection(collection).insert_one(data).inserted_id

    def insert_many(self, collection: str, data: list):
        return self.get_collection(collection).insert_many(data).inserted_ids

    def find_one(self, collection: str, query: dict, projection=None):
        return self.get_collection(collection).find_one(query, projection)

    def find(self, collection: str, query: dict, projection=None, limit=0):
        return list(
            self.get_collection(collection)
            .find(query, projection)
            .limit(limit)
        )

    def update_one(self, collection: str, query: dict, update: dict):
        return self.get_collection(collection).update_one(query, update)

    def update_many(self, collection: str, query: dict, update: dict):
        return self.get_collection(collection).update_many(query, update)

    def delete_one(self, collection: str, query: dict):
        return self.get_collection(collection).delete_one(query)

    def delete_many(self, collection: str, query: dict):
        return self.get_collection(collection).delete_many(query)

    # ============== UTILITY ===========================
    def count(self, collection: str, query=None):
        return self.get_collection(collection).count_documents(query or {})

    def list_collections(self):
        return self.db.list_collection_names()

    def close(self):
        self.client.close()


# GLOBAL CLIENT
mongo = MongoDBClient(
    uri="mongodb://localhost:27017",
    db_name="ai_verse"
)

# Pre-load users collection
users_collection = mongo.get_collection("users")
