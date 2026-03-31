"""
Seed script for Five app - Creates users, videos, products, and educational content
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import hashlib
import base64
import os

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client['five_app']

# Sample users data
USERS = [
    {"name": "Sarah Chen", "username": "sarahchen", "bio": "Tech entrepreneur & educator", "email": "sarah@example.com"},
    {"name": "Marcus Johnson", "username": "marcusj", "bio": "Business coach | 10x your income", "email": "marcus@example.com"},
    {"name": "Dr. Emily White", "username": "dremily", "bio": "Medical Doctor | Health tips daily", "email": "emily@example.com"},
    {"name": "Alex Rivera", "username": "alexcodes", "bio": "Full-stack developer | Coding tutorials", "email": "alex@example.com"},
    {"name": "Luna Park", "username": "lunalearns", "bio": "Language teacher | Learn 5 languages", "email": "luna@example.com"},
    {"name": "James Miller", "username": "jamesm", "bio": "Science enthusiast | Mind-blowing facts", "email": "james@example.com"},
    {"name": "Sofia Martinez", "username": "sofiaarts", "bio": "Digital artist | Creative tutorials", "email": "sofia@example.com"},
    {"name": "David Kim", "username": "davidkim", "bio": "Finance expert | Wealth building", "email": "david@example.com"},
    {"name": "Nina Patel", "username": "ninapatel", "bio": "Yoga & wellness coach", "email": "nina@example.com"},
    {"name": "Chris Taylor", "username": "christaylor", "bio": "Travel vlogger | Explore the world", "email": "chris@example.com"},
]

# Video content data
VIDEOS = [
    # Learn - Medicine
    {"caption": "5 Signs Your Body Needs More Water 💧", "intent_tag": "learn", "category": "medicine", "user_idx": 2},
    {"caption": "How to Check Your Heart Rate Properly ❤️", "intent_tag": "learn", "category": "medicine", "user_idx": 2},
    
    # Learn - Business
    {"caption": "Start a Business with $0 - Here's How 💼", "intent_tag": "learn", "category": "business", "user_idx": 1},
    {"caption": "The #1 Mistake New Entrepreneurs Make", "intent_tag": "learn", "category": "business", "user_idx": 7},
    
    # Learn - Technology
    {"caption": "AI Will Change Everything in 2025 🤖", "intent_tag": "learn", "category": "technology", "user_idx": 0},
    {"caption": "Learn Python in 60 Seconds 🐍", "intent_tag": "learn", "category": "technology", "user_idx": 3},
    
    # Learn - Science
    {"caption": "Why the Sky is Blue - Simple Explanation 🌤️", "intent_tag": "learn", "category": "science", "user_idx": 5},
    {"caption": "Black Holes Explained in 30 Seconds 🕳️", "intent_tag": "learn", "category": "science", "user_idx": 5},
    
    # Learn - Languages
    {"caption": "Learn 10 Spanish Words in 1 Minute 🇪🇸", "intent_tag": "learn", "category": "languages", "user_idx": 4},
    {"caption": "Japanese Greetings You Need to Know 🇯🇵", "intent_tag": "learn", "category": "languages", "user_idx": 4},
    
    # Earn
    {"caption": "Make $100/Day with This Side Hustle 💰", "intent_tag": "earn", "category": "business", "user_idx": 1},
    {"caption": "Passive Income Ideas That Actually Work", "intent_tag": "earn", "category": "business", "user_idx": 7},
    
    # Relax
    {"caption": "5-Minute Meditation for Stress Relief 🧘", "intent_tag": "relax", "category": "wellness", "user_idx": 8},
    {"caption": "Lo-fi Beats to Study/Relax To 🎵", "intent_tag": "relax", "category": "entertainment", "user_idx": 6},
    
    # Explore
    {"caption": "Hidden Gem in Bali You Must Visit 🌴", "intent_tag": "explore", "category": "travel", "user_idx": 9},
    {"caption": "Street Food Tour in Tokyo 🍜", "intent_tag": "explore", "category": "travel", "user_idx": 9},
]

# Products data
PRODUCTS = [
    {"name": "Wireless Earbuds Pro", "description": "Premium sound quality, 24hr battery", "price": 49.99, "platform": "amazon", "category": "technology"},
    {"name": "Smart Watch Fitness Tracker", "description": "Heart rate, sleep tracking, waterproof", "price": 79.99, "platform": "amazon", "category": "technology"},
    {"name": "Portable Ring Light", "description": "Perfect for content creators", "price": 24.99, "platform": "aliexpress", "category": "technology"},
    {"name": "Business Success Book Bundle", "description": "Top 5 entrepreneur books", "price": 59.99, "platform": "amazon", "category": "business"},
    {"name": "Language Learning Cards Set", "description": "500 cards in 5 languages", "price": 19.99, "platform": "taobao", "category": "education"},
    {"name": "Meditation Cushion Set", "description": "Organic cotton, comfortable design", "price": 34.99, "platform": "amazon", "category": "wellness"},
    {"name": "Digital Art Tablet", "description": "Professional drawing tablet", "price": 89.99, "platform": "aliexpress", "category": "arts"},
    {"name": "Travel Backpack 40L", "description": "Carry-on size, laptop compartment", "price": 54.99, "platform": "amazon", "category": "travel"},
]

# Educational lessons (PDF content as text)
LESSONS = [
    # Medicine
    {
        "title": "Introduction to First Aid",
        "category": "medicine",
        "description": "Essential first aid knowledge everyone should know",
        "content": """
# First Aid Basics

## 1. Assess the Situation
- Check for danger
- Call for help if needed
- Check the person's response

## 2. CPR Steps
1. Call emergency services
2. 30 chest compressions
3. 2 rescue breaths
4. Repeat until help arrives

## 3. Treating Burns
- Cool with running water
- Cover with clean cloth
- Don't break blisters

## 4. Bleeding Control
- Apply direct pressure
- Elevate the wound
- Use bandage if available
"""
    },
    # Business
    {
        "title": "Starting Your First Business",
        "category": "business",
        "description": "Step-by-step guide to entrepreneurship",
        "content": """
# Business Startup Guide

## 1. Find Your Idea
- Solve a real problem
- Research the market
- Validate with customers

## 2. Create a Business Plan
- Executive summary
- Market analysis
- Financial projections

## 3. Legal Structure
- Sole proprietorship
- LLC
- Corporation

## 4. Funding Options
- Bootstrapping
- Angel investors
- Bank loans
- Crowdfunding
"""
    },
    # Technology
    {
        "title": "Python Programming Basics",
        "category": "technology",
        "description": "Learn Python in 30 minutes",
        "content": """
# Python Fundamentals

## 1. Variables
```python
name = "Five"
age = 25
is_active = True
```

## 2. Functions
```python
def greet(name):
    return f"Hello, {name}!"
```

## 3. Loops
```python
for i in range(5):
    print(i)
```

## 4. Conditionals
```python
if age >= 18:
    print("Adult")
else:
    print("Minor")
```
"""
    },
    # Science
    {
        "title": "The Solar System Explained",
        "category": "science",
        "description": "Journey through our cosmic neighborhood",
        "content": """
# Our Solar System

## The Sun
- Center of our system
- 99.8% of total mass
- 4.6 billion years old

## Inner Planets
1. Mercury - Closest to Sun
2. Venus - Hottest planet
3. Earth - Our home
4. Mars - The red planet

## Outer Planets
5. Jupiter - Largest
6. Saturn - Famous rings
7. Uranus - Tilted axis
8. Neptune - Windiest

## Fun Facts
- Light takes 8 min from Sun to Earth
- Jupiter has 95 moons
"""
    },
    # Languages
    {
        "title": "Spanish for Beginners",
        "category": "languages",
        "description": "Learn essential Spanish phrases",
        "content": """
# Spanish Basics

## Greetings
- Hola = Hello
- Buenos días = Good morning
- Buenas noches = Good night
- Adiós = Goodbye

## Common Phrases
- Por favor = Please
- Gracias = Thank you
- De nada = You're welcome
- Lo siento = I'm sorry

## Numbers
1. Uno
2. Dos
3. Tres
4. Cuatro
5. Cinco

## Practice
"Hola, me llamo [name]. ¿Cómo estás?"
"""
    },
    # Arts
    {
        "title": "Digital Art Fundamentals",
        "category": "arts",
        "description": "Start your digital art journey",
        "content": """
# Digital Art Basics

## 1. Essential Tools
- Drawing tablet
- Software (Procreate, Photoshop)
- Stylus pen

## 2. Basic Techniques
- Layering
- Blending modes
- Brush settings
- Color theory

## 3. Workflow
1. Sketch rough idea
2. Clean line art
3. Base colors
4. Shading
5. Highlights
6. Final touches

## Tips
- Practice daily
- Study references
- Join art communities
"""
    },
]

# Create a simple colored image as base64
def create_placeholder_image(color_hex: str) -> str:
    """Create a simple 200x200 colored PNG as base64"""
    # Simple 1x1 pixel PNG with color
    import struct
    import zlib
    
    def create_png(width, height, r, g, b):
        def png_chunk(chunk_type, data):
            chunk_len = len(data)
            chunk_crc = zlib.crc32(chunk_type + data) & 0xffffffff
            return struct.pack('>I', chunk_len) + chunk_type + data + struct.pack('>I', chunk_crc)
        
        # PNG signature
        signature = b'\x89PNG\r\n\x1a\n'
        
        # IHDR chunk
        ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
        ihdr = png_chunk(b'IHDR', ihdr_data)
        
        # IDAT chunk (raw image data)
        raw_data = b''
        for y in range(height):
            raw_data += b'\x00'  # filter byte
            for x in range(width):
                raw_data += bytes([r, g, b])
        
        compressed = zlib.compress(raw_data)
        idat = png_chunk(b'IDAT', compressed)
        
        # IEND chunk
        iend = png_chunk(b'IEND', b'')
        
        return signature + ihdr + idat + iend
    
    # Parse hex color
    color_hex = color_hex.lstrip('#')
    r, g, b = int(color_hex[0:2], 16), int(color_hex[2:4], 16), int(color_hex[4:6], 16)
    
    png_data = create_png(100, 100, r, g, b)
    return base64.b64encode(png_data).decode('utf-8')

async def seed_database():
    print("🌱 Starting database seed...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.posts.delete_many({})
    await db.products.delete_many({})
    await db.lessons.delete_many({})
    await db.user_sessions.delete_many({})
    print("✓ Cleared existing data")
    
    # Create users
    user_ids = []
    for i, user_data in enumerate(USERS):
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "username": user_data["username"],
            "bio": user_data["bio"],
            "password_hash": hashlib.sha256("demo123".encode()).hexdigest(),
            "picture": None,
            "phone": None,
            "followers_count": (i + 1) * 1000,
            "following_count": (i + 1) * 50,
            "posts_count": 0,
            "total_earnings": (i + 1) * 100,
            "mood": "happy",
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user)
        user_ids.append(user_id)
    print(f"✓ Created {len(USERS)} users")
    
    # Create videos/posts
    colors = ["#F43F5E", "#22D3EE", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899"]
    for i, video_data in enumerate(VIDEOS):
        post_id = f"post_{uuid.uuid4().hex[:12]}"
        user_idx = video_data["user_idx"]
        color = colors[i % len(colors)]
        
        post = {
            "post_id": post_id,
            "user_id": user_ids[user_idx],
            "media_data": create_placeholder_image(color),
            "media_type": "image",
            "caption": video_data["caption"],
            "intent_tag": video_data["intent_tag"],
            "category": video_data["category"],
            "product_links": [],
            "likes_count": (i + 1) * 50 + 100,
            "comments_count": (i + 1) * 10,
            "views_count": (i + 1) * 500,
            "created_at": datetime.now(timezone.utc)
        }
        await db.posts.insert_one(post)
        
        # Update user post count
        await db.users.update_one(
            {"user_id": user_ids[user_idx]},
            {"$inc": {"posts_count": 1}}
        )
    print(f"✓ Created {len(VIDEOS)} videos/posts")
    
    # Create products
    for i, prod_data in enumerate(PRODUCTS):
        product_id = f"prod_{uuid.uuid4().hex[:12]}"
        color = colors[i % len(colors)]
        
        product = {
            "product_id": product_id,
            "creator_id": user_ids[i % len(user_ids)],
            "name": prod_data["name"],
            "description": prod_data["description"],
            "price": prod_data["price"],
            "currency": "USD",
            "image": create_placeholder_image(color),
            "external_url": f"https://{prod_data['platform']}.com/product/{product_id}",
            "platform": prod_data["platform"],
            "category": prod_data["category"],
            "sales_count": (i + 1) * 20,
            "created_at": datetime.now(timezone.utc)
        }
        await db.products.insert_one(product)
    print(f"✓ Created {len(PRODUCTS)} products")
    
    # Create educational lessons
    for i, lesson_data in enumerate(LESSONS):
        lesson_id = f"lesson_{uuid.uuid4().hex[:12]}"
        
        lesson = {
            "lesson_id": lesson_id,
            "title": lesson_data["title"],
            "category": lesson_data["category"],
            "description": lesson_data["description"],
            "content": lesson_data["content"],
            "author_id": user_ids[i % len(user_ids)],
            "views_count": (i + 1) * 200,
            "likes_count": (i + 1) * 50,
            "created_at": datetime.now(timezone.utc)
        }
        await db.lessons.insert_one(lesson)
    print(f"✓ Created {len(LESSONS)} educational lessons")
    
    # Create follow relationships (everyone follows everyone for demo)
    for i, follower_id in enumerate(user_ids):
        for j, following_id in enumerate(user_ids):
            if i != j:
                await db.follows.insert_one({
                    "follow_id": f"follow_{uuid.uuid4().hex[:12]}",
                    "follower_id": follower_id,
                    "following_id": following_id,
                    "created_at": datetime.now(timezone.utc)
                })
    print("✓ Created follow relationships")
    
    print("\n✅ Database seeded successfully!")
    print(f"   - {len(USERS)} users (password: demo123)")
    print(f"   - {len(VIDEOS)} videos/posts")
    print(f"   - {len(PRODUCTS)} products")
    print(f"   - {len(LESSONS)} educational lessons")

if __name__ == "__main__":
    asyncio.run(seed_database())
