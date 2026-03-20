from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'five_app')]

# Create the main app
app = FastAPI(title="Five - Watch. Learn. Earn.")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserBase(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None

class User(UserBase):
    user_id: str
    username: Optional[str] = None
    bio: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    picture: Optional[str] = None

class PostCreate(BaseModel):
    media_data: str  # base64 encoded
    media_type: str  # "video" or "image"
    caption: Optional[str] = None
    intent_tag: str  # "learn", "earn", "relax", "explore", "shop"
    product_links: Optional[List[Dict[str, str]]] = None  # [{"name": "Product", "url": "...", "platform": "amazon"}]

class Post(BaseModel):
    post_id: str
    user_id: str
    media_data: str
    media_type: str
    caption: Optional[str] = None
    intent_tag: str
    product_links: Optional[List[Dict[str, str]]] = None
    likes_count: int = 0
    comments_count: int = 0
    views_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PostResponse(BaseModel):
    post_id: str
    user_id: str
    media_data: str
    media_type: str
    caption: Optional[str] = None
    intent_tag: str
    product_links: Optional[List[Dict[str, str]]] = None
    likes_count: int = 0
    comments_count: int = 0
    views_count: int = 0
    created_at: datetime
    user: Optional[Dict[str, Any]] = None
    is_liked: bool = False
    is_following: bool = False

class CommentCreate(BaseModel):
    content: str

class Comment(BaseModel):
    comment_id: str
    post_id: str
    user_id: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentResponse(BaseModel):
    comment_id: str
    post_id: str
    user_id: str
    content: str
    created_at: datetime
    user: Optional[Dict[str, Any]] = None

# ============== AUTH HELPERS ==============

async def get_current_user(request: Request) -> Optional[User]:
    """Extract user from session token in cookies or Authorization header"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    
    # Check expiry
    expires_at = session.get("expires_at")
    if expires_at:
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            return None
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        return None
    
    return User(**user)

async def require_auth(request: Request) -> User:
    """Require authentication"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client_http:
        auth_response = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = auth_response.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    session_token = auth_data.get("session_token", f"st_{uuid.uuid4().hex}")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": auth_data.get("name", existing_user.get("name")),
                "picture": auth_data.get("picture", existing_user.get("picture"))
            }}
        )
    else:
        # Create new user
        new_user = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data.get("name", "User"),
            "picture": auth_data.get("picture"),
            "username": None,
            "bio": None,
            "followers_count": 0,
            "following_count": 0,
            "posts_count": 0,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get user data
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"user": user, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(user: User = Depends(require_auth)):
    """Get current user"""
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ============== USER ROUTES ==============

@api_router.get("/users/{user_id}")
async def get_user(user_id: str, request: Request):
    """Get user profile"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if current user is following
    current_user = await get_current_user(request)
    is_following = False
    if current_user:
        follow = await db.follows.find_one({
            "follower_id": current_user.user_id,
            "following_id": user_id
        })
        is_following = follow is not None
    
    return {**user, "is_following": is_following}

@api_router.put("/users/me")
async def update_user(update: UserUpdate, user: User = Depends(require_auth)):
    """Update current user profile"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return updated_user

@api_router.get("/users/{user_id}/posts")
async def get_user_posts(user_id: str, skip: int = 0, limit: int = 20):
    """Get posts by user"""
    posts = await db.posts.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return posts

# ============== POST ROUTES ==============

@api_router.post("/posts", response_model=Post)
async def create_post(post_data: PostCreate, user: User = Depends(require_auth)):
    """Create a new post"""
    post_id = f"post_{uuid.uuid4().hex[:12]}"
    
    post = {
        "post_id": post_id,
        "user_id": user.user_id,
        "media_data": post_data.media_data,
        "media_type": post_data.media_type,
        "caption": post_data.caption,
        "intent_tag": post_data.intent_tag,
        "product_links": post_data.product_links or [],
        "likes_count": 0,
        "comments_count": 0,
        "views_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.posts.insert_one(post)
    
    # Update user posts count
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$inc": {"posts_count": 1}}
    )
    
    return Post(**{k: v for k, v in post.items() if k != "_id"})

@api_router.get("/posts/feed")
async def get_feed(
    request: Request,
    intent: Optional[str] = None,
    skip: int = 0,
    limit: int = 10
):
    """Get posts feed, optionally filtered by intent"""
    query = {}
    if intent and intent != "all":
        query["intent_tag"] = intent
    
    posts = await db.posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    current_user = await get_current_user(request)
    
    # Enrich posts with user data and interaction status
    enriched_posts = []
    for post in posts:
        # Get post author
        author = await db.users.find_one({"user_id": post["user_id"]}, {"_id": 0})
        
        # Check if liked and following
        is_liked = False
        is_following = False
        if current_user:
            like = await db.likes.find_one({
                "user_id": current_user.user_id,
                "post_id": post["post_id"]
            })
            is_liked = like is not None
            
            follow = await db.follows.find_one({
                "follower_id": current_user.user_id,
                "following_id": post["user_id"]
            })
            is_following = follow is not None
        
        enriched_posts.append({
            **post,
            "user": {
                "user_id": author["user_id"] if author else None,
                "name": author["name"] if author else "Unknown",
                "username": author.get("username") if author else None,
                "picture": author.get("picture") if author else None
            } if author else None,
            "is_liked": is_liked,
            "is_following": is_following
        })
    
    return enriched_posts

@api_router.get("/posts/{post_id}")
async def get_post(post_id: str, request: Request):
    """Get a single post"""
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Increment view count
    await db.posts.update_one(
        {"post_id": post_id},
        {"$inc": {"views_count": 1}}
    )
    
    # Get author
    author = await db.users.find_one({"user_id": post["user_id"]}, {"_id": 0})
    
    # Check interactions
    current_user = await get_current_user(request)
    is_liked = False
    is_following = False
    if current_user:
        like = await db.likes.find_one({
            "user_id": current_user.user_id,
            "post_id": post_id
        })
        is_liked = like is not None
        
        follow = await db.follows.find_one({
            "follower_id": current_user.user_id,
            "following_id": post["user_id"]
        })
        is_following = follow is not None
    
    return {
        **post,
        "views_count": post.get("views_count", 0) + 1,
        "user": {
            "user_id": author["user_id"] if author else None,
            "name": author["name"] if author else "Unknown",
            "username": author.get("username") if author else None,
            "picture": author.get("picture") if author else None
        } if author else None,
        "is_liked": is_liked,
        "is_following": is_following
    }

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user: User = Depends(require_auth)):
    """Delete a post"""
    post = await db.posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.posts.delete_one({"post_id": post_id})
    await db.likes.delete_many({"post_id": post_id})
    await db.comments.delete_many({"post_id": post_id})
    
    # Update user posts count
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$inc": {"posts_count": -1}}
    )
    
    return {"message": "Post deleted"}

# ============== LIKE ROUTES ==============

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, user: User = Depends(require_auth)):
    """Like a post"""
    post = await db.posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing_like = await db.likes.find_one({
        "user_id": user.user_id,
        "post_id": post_id
    })
    
    if existing_like:
        return {"message": "Already liked", "liked": True}
    
    await db.likes.insert_one({
        "like_id": f"like_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "post_id": post_id,
        "created_at": datetime.now(timezone.utc)
    })
    
    await db.posts.update_one(
        {"post_id": post_id},
        {"$inc": {"likes_count": 1}}
    )
    
    return {"message": "Liked", "liked": True}

@api_router.delete("/posts/{post_id}/like")
async def unlike_post(post_id: str, user: User = Depends(require_auth)):
    """Unlike a post"""
    result = await db.likes.delete_one({
        "user_id": user.user_id,
        "post_id": post_id
    })
    
    if result.deleted_count > 0:
        await db.posts.update_one(
            {"post_id": post_id},
            {"$inc": {"likes_count": -1}}
        )
    
    return {"message": "Unliked", "liked": False}

# ============== COMMENT ROUTES ==============

@api_router.post("/posts/{post_id}/comments")
async def create_comment(post_id: str, comment_data: CommentCreate, user: User = Depends(require_auth)):
    """Create a comment"""
    post = await db.posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment = {
        "comment_id": f"comment_{uuid.uuid4().hex[:12]}",
        "post_id": post_id,
        "user_id": user.user_id,
        "content": comment_data.content,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.comments.insert_one(comment)
    
    await db.posts.update_one(
        {"post_id": post_id},
        {"$inc": {"comments_count": 1}}
    )
    
    # Get user info
    author = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    
    return {
        **{k: v for k, v in comment.items() if k != "_id"},
        "user": {
            "user_id": author["user_id"],
            "name": author["name"],
            "username": author.get("username"),
            "picture": author.get("picture")
        }
    }

@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str, skip: int = 0, limit: int = 50):
    """Get comments for a post"""
    comments = await db.comments.find(
        {"post_id": post_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user data
    enriched_comments = []
    for comment in comments:
        author = await db.users.find_one({"user_id": comment["user_id"]}, {"_id": 0})
        enriched_comments.append({
            **comment,
            "user": {
                "user_id": author["user_id"] if author else None,
                "name": author["name"] if author else "Unknown",
                "username": author.get("username") if author else None,
                "picture": author.get("picture") if author else None
            } if author else None
        })
    
    return enriched_comments

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, user: User = Depends(require_auth)):
    """Delete a comment"""
    comment = await db.comments.find_one({"comment_id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.comments.delete_one({"comment_id": comment_id})
    
    await db.posts.update_one(
        {"post_id": comment["post_id"]},
        {"$inc": {"comments_count": -1}}
    )
    
    return {"message": "Comment deleted"}

# ============== FOLLOW ROUTES ==============

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, user: User = Depends(require_auth)):
    """Follow a user"""
    if user_id == user.user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    target_user = await db.users.find_one({"user_id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing_follow = await db.follows.find_one({
        "follower_id": user.user_id,
        "following_id": user_id
    })
    
    if existing_follow:
        return {"message": "Already following", "following": True}
    
    await db.follows.insert_one({
        "follow_id": f"follow_{uuid.uuid4().hex[:12]}",
        "follower_id": user.user_id,
        "following_id": user_id,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Update counts
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$inc": {"following_count": 1}}
    )
    await db.users.update_one(
        {"user_id": user_id},
        {"$inc": {"followers_count": 1}}
    )
    
    return {"message": "Following", "following": True}

@api_router.delete("/users/{user_id}/follow")
async def unfollow_user(user_id: str, user: User = Depends(require_auth)):
    """Unfollow a user"""
    result = await db.follows.delete_one({
        "follower_id": user.user_id,
        "following_id": user_id
    })
    
    if result.deleted_count > 0:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$inc": {"following_count": -1}}
        )
        await db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"followers_count": -1}}
        )
    
    return {"message": "Unfollowed", "following": False}

@api_router.get("/users/{user_id}/followers")
async def get_followers(user_id: str, skip: int = 0, limit: int = 50):
    """Get user's followers"""
    follows = await db.follows.find(
        {"following_id": user_id},
        {"_id": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    followers = []
    for follow in follows:
        user = await db.users.find_one({"user_id": follow["follower_id"]}, {"_id": 0})
        if user:
            followers.append(user)
    
    return followers

@api_router.get("/users/{user_id}/following")
async def get_following(user_id: str, skip: int = 0, limit: int = 50):
    """Get users that user is following"""
    follows = await db.follows.find(
        {"follower_id": user_id},
        {"_id": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    following = []
    for follow in follows:
        user = await db.users.find_one({"user_id": follow["following_id"]}, {"_id": 0})
        if user:
            following.append(user)
    
    return following

# ============== SEARCH ROUTES ==============

@api_router.get("/search/users")
async def search_users(q: str = Query(..., min_length=1), limit: int = 20):
    """Search users by name or username"""
    users = await db.users.find(
        {
            "$or": [
                {"name": {"$regex": q, "$options": "i"}},
                {"username": {"$regex": q, "$options": "i"}}
            ]
        },
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    return users

@api_router.get("/search/posts")
async def search_posts(q: str = Query(..., min_length=1), intent: Optional[str] = None, limit: int = 20):
    """Search posts by caption"""
    query = {"caption": {"$regex": q, "$options": "i"}}
    if intent:
        query["intent_tag"] = intent
    
    posts = await db.posts.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    return posts

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "Five API - Watch. Learn. Earn.", "status": "healthy"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
