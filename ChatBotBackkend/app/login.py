

# app = FastAPI(title="AI Verse API", version="1.0.0")

# CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React app URL
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Security
security = HTTPBearer()

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    
    user_collection = get_user_collection()
    user = await user_collection.find_one({"username": payload["username"]})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(user["_id"]),
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        disabled=user.get("disabled", False),
        created_at=user["created_at"]
    )

# Dependency to check if user is admin
async def get_current_admin(current_user: UserResponse = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# Routes
@app.post("/signup", response_model=Token)
async def signup(user_data: UserCreate):
    user_collection = get_user_collection()
    
    # Check if user already exists
    existing_user = await user_collection.find_one({
        "$or": [
            {"username": user_data.username},
            {"email": user_data.email}
        ]
    })
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Create new user (default role is user)
    from datetime import datetime
    user_dict = user_data.dict()
    user_dict["password"] = get_password_hash(user_data.password)
    user_dict["role"] = UserRole.USER
    user_dict["disabled"] = False
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()
    
    result = await user_collection.insert_one(user_dict)
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user_data.username, "role": UserRole.USER},
        expires_delta=access_token_expires
    )
    
    # Get the created user
    new_user = await user_collection.find_one({"_id": result.inserted_id})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(new_user["_id"]),
            username=new_user["username"],
            email=new_user["email"],
            full_name=new_user["full_name"],
            role=new_user["role"],
            disabled=new_user.get("disabled", False),
            created_at=new_user["created_at"]
        )
    )

@app.post("/login", response_model=Token)
async def login(username: str, password: str):
    user_collection = get_user_collection()
    
    # Find user by username or email
    user = await user_collection.find_one({
        "$or": [
            {"username": username},
            {"email": username}
        ]
    })
    
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if user.get("disabled", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user["_id"]),
            username=user["username"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            disabled=user.get("disabled", False),
            created_at=user["created_at"]
        )
    )

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user

@app.put("/users/me", response_model=UserResponse)
async def update_user_me(
    user_update: UserUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    user_collection = get_user_collection()
    
    update_data = user_update.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data to update"
        )
    
    # Check if email is being updated and if it's already taken
    if "email" in update_data:
        existing_user = await user_collection.find_one({
            "email": update_data["email"],
            "_id": {"$ne": current_user.id}
        })
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    from datetime import datetime
    update_data["updated_at"] = datetime.utcnow()
    
    await user_collection.update_one(
        {"_id": current_user.id},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await user_collection.find_one({"_id": current_user.id})
    
    return UserResponse(
        id=str(updated_user["_id"]),
        username=updated_user["username"],
        email=updated_user["email"],
        full_name=updated_user["full_name"],
        role=updated_user["role"],
        disabled=updated_user.get("disabled", False),
        created_at=updated_user["created_at"]
    )

# Admin only routes
@app.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(admin: UserResponse = Depends(get_current_admin)):
    user_collection = get_user_collection()
    
    users = await user_collection.find().to_list(100)
    
    return [
        UserResponse(
            id=str(user["_id"]),
            username=user["username"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            disabled=user.get("disabled", False),
            created_at=user["created_at"]
        )
        for user in users
    ]

@app.put("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: UserRole,
    admin: UserResponse = Depends(get_current_admin)
):
    user_collection = get_user_collection()
    
    from datetime import datetime
    result = await user_collection.update_one(
        {"_id": user_id},
        {"$set": {"role": role, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": f"User role updated to {role}"}

@app.put("/admin/users/{user_id}/toggle")
async def toggle_user_status(
    user_id: str,
    admin: UserResponse = Depends(get_current_admin)
):
    user_collection = get_user_collection()
    
    user = await user_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    new_status = not user.get("disabled", False)
    
    from datetime import datetime
    await user_collection.update_one(
        {"_id": user_id},
        {"$set": {"disabled": new_status, "updated_at": datetime.utcnow()}}
    )
    
    status_text = "disabled" if new_status else "enabled"
    return {"message": f"User {status_text} successfully"}

# Health check
@app.get("/")
async def root():
    return {"message": "AI Verse API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}