#!/usr/bin/env python3
"""
Five App Backend API Testing
Tests all backend endpoints for the Five app
"""

import requests
import json
import base64
import time
from datetime import datetime
import subprocess
import sys

# Configuration
BASE_URL = "https://intent-feed-1.preview.emergentagent.com/api"
MONGO_DB = "five_app"

class FiveAPITester:
    def __init__(self):
        self.session_token = None
        self.user_id = None
        self.test_post_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{BASE_URL}/")
            if response.status_code == 200:
                data = response.json()
                expected_message = "Five API - Watch. Learn. Earn."
                if data.get("message") == expected_message and data.get("status") == "healthy":
                    self.log_result("Health Check", True, "API is healthy")
                    return True
                else:
                    self.log_result("Health Check", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Request failed: {str(e)}")
            return False
    
    def test_feed_empty(self):
        """Test feed endpoint returns empty array initially"""
        try:
            response = requests.get(f"{BASE_URL}/posts/feed")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) == 0:
                    self.log_result("Feed Empty", True, "Feed returns empty array initially")
                    return True
                else:
                    self.log_result("Feed Empty", False, f"Expected empty array, got: {data}")
                    return False
            else:
                self.log_result("Feed Empty", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Feed Empty", False, f"Request failed: {str(e)}")
            return False
    
    def test_feed_with_intent_filter(self):
        """Test feed endpoint with intent filter"""
        try:
            response = requests.get(f"{BASE_URL}/posts/feed?intent=learn")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Feed Intent Filter", True, f"Feed with intent filter works, returned {len(data)} posts")
                    return True
                else:
                    self.log_result("Feed Intent Filter", False, f"Expected array, got: {data}")
                    return False
            else:
                self.log_result("Feed Intent Filter", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Feed Intent Filter", False, f"Request failed: {str(e)}")
            return False
    
    def create_test_user_and_session(self):
        """Create test user and session in MongoDB"""
        try:
            timestamp = int(time.time())
            self.user_id = f"test-user-{timestamp}"
            self.session_token = f"test_session_{timestamp}"
            
            # Create MongoDB entries
            mongo_script = f"""
            use('{MONGO_DB}');
            var userId = '{self.user_id}';
            var sessionToken = '{self.session_token}';
            
            // Insert test user
            db.users.insertOne({{
                user_id: userId,
                email: 'test@example.com',
                name: 'Test User',
                picture: null,
                username: 'testuser{timestamp}',
                bio: 'Test bio for API testing',
                followers_count: 0,
                following_count: 0,
                posts_count: 0,
                created_at: new Date()
            }});
            
            // Insert session
            db.user_sessions.insertOne({{
                user_id: userId,
                session_token: sessionToken,
                expires_at: new Date(Date.now() + 7*24*60*60*1000),
                created_at: new Date()
            }});
            
            print('Test user and session created successfully');
            """
            
            # Execute MongoDB script
            result = subprocess.run(
                ["mongosh", "--eval", mongo_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.log_result("Create Test User", True, f"Test user {self.user_id} and session created")
                return True
            else:
                self.log_result("Create Test User", False, f"MongoDB error: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_result("Create Test User", False, f"Failed to create test user: {str(e)}")
            return False
    
    def test_auth_me(self):
        """Test authentication endpoint"""
        if not self.session_token:
            self.log_result("Auth Me", False, "No session token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("user_id") == self.user_id:
                    self.log_result("Auth Me", True, f"Authentication successful for user {self.user_id}")
                    return True
                else:
                    self.log_result("Auth Me", False, f"User ID mismatch: expected {self.user_id}, got {data.get('user_id')}")
                    return False
            else:
                self.log_result("Auth Me", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Auth Me", False, f"Request failed: {str(e)}")
            return False
    
    def test_create_post(self):
        """Test creating a post"""
        if not self.session_token:
            self.log_result("Create Post", False, "No session token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            # Create test image data (base64 encoded)
            test_image_data = base64.b64encode(b"test image data for Five app").decode('utf-8')
            
            post_data = {
                "media_data": test_image_data,
                "media_type": "image",
                "caption": "Test post for Five app - Learning about API testing! 📚",
                "intent_tag": "learn",
                "product_links": [
                    {
                        "name": "Test Learning Product",
                        "url": "https://amazon.com/test-learning-book",
                        "platform": "amazon"
                    }
                ]
            }
            
            response = requests.post(f"{BASE_URL}/posts", headers=headers, json=post_data)
            
            if response.status_code == 200:
                data = response.json()
                self.test_post_id = data.get("post_id")
                if self.test_post_id:
                    self.log_result("Create Post", True, f"Post created successfully: {self.test_post_id}")
                    return True
                else:
                    self.log_result("Create Post", False, f"No post_id in response: {data}")
                    return False
            else:
                self.log_result("Create Post", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Create Post", False, f"Request failed: {str(e)}")
            return False
    
    def test_feed_with_post(self):
        """Test feed endpoint shows created post"""
        try:
            response = requests.get(f"{BASE_URL}/posts/feed")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if our test post is in the feed
                    post_found = any(post.get("post_id") == self.test_post_id for post in data)
                    if post_found:
                        self.log_result("Feed With Post", True, f"Feed shows created post, total posts: {len(data)}")
                        return True
                    else:
                        self.log_result("Feed With Post", False, f"Created post not found in feed of {len(data)} posts")
                        return False
                else:
                    self.log_result("Feed With Post", False, f"Feed still empty after creating post: {data}")
                    return False
            else:
                self.log_result("Feed With Post", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Feed With Post", False, f"Request failed: {str(e)}")
            return False
    
    def test_like_post(self):
        """Test liking a post"""
        if not self.session_token or not self.test_post_id:
            self.log_result("Like Post", False, "No session token or post ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/like", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("liked") is True:
                    self.log_result("Like Post", True, f"Post liked successfully: {data.get('message')}")
                    return True
                else:
                    self.log_result("Like Post", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Like Post", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Like Post", False, f"Request failed: {str(e)}")
            return False
    
    def test_comment_on_post(self):
        """Test commenting on a post"""
        if not self.session_token or not self.test_post_id:
            self.log_result("Comment Post", False, "No session token or post ID available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            comment_data = {
                "content": "Great post! This is a test comment from the API testing suite. 👍"
            }
            
            response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/comments", headers=headers, json=comment_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("content") == comment_data["content"]:
                    self.log_result("Comment Post", True, f"Comment created successfully: {data.get('comment_id')}")
                    return True
                else:
                    self.log_result("Comment Post", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Comment Post", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Comment Post", False, f"Request failed: {str(e)}")
            return False
    
    def create_second_test_user(self):
        """Create a second test user to test follow functionality"""
        try:
            timestamp = int(time.time()) + 1
            second_user_id = f"test-user-{timestamp}"
            
            mongo_script = f"""
            use('{MONGO_DB}');
            var userId = '{second_user_id}';
            
            db.users.insertOne({{
                user_id: userId,
                email: 'test2@example.com',
                name: 'Second Test User',
                picture: null,
                username: 'testuser{timestamp}',
                bio: 'Second test user for follow testing',
                followers_count: 0,
                following_count: 0,
                posts_count: 0,
                created_at: new Date()
            }});
            
            print('Second test user created successfully');
            """
            
            result = subprocess.run(
                ["mongosh", "--eval", mongo_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.second_user_id = second_user_id
                self.log_result("Create Second User", True, f"Second test user {second_user_id} created")
                return True
            else:
                self.log_result("Create Second User", False, f"MongoDB error: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_result("Create Second User", False, f"Failed to create second user: {str(e)}")
            return False
    
    def test_follow_user(self):
        """Test following a user"""
        if not self.session_token or not hasattr(self, 'second_user_id'):
            self.log_result("Follow User", False, "No session token or second user ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.post(f"{BASE_URL}/users/{self.second_user_id}/follow", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("following") is True:
                    self.log_result("Follow User", True, f"User followed successfully: {data.get('message')}")
                    return True
                else:
                    self.log_result("Follow User", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Follow User", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Follow User", False, f"Request failed: {str(e)}")
            return False
    
    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        try:
            cleanup_script = f"""
            use('{MONGO_DB}');
            
            // Remove test users
            db.users.deleteMany({{user_id: /^test-user-/}});
            
            // Remove test sessions
            db.user_sessions.deleteMany({{session_token: /^test_session_/}});
            
            // Remove test posts
            db.posts.deleteMany({{user_id: /^test-user-/}});
            
            // Remove test likes
            db.likes.deleteMany({{user_id: /^test-user-/}});
            
            // Remove test comments
            db.comments.deleteMany({{user_id: /^test-user-/}});
            
            // Remove test follows
            db.follows.deleteMany({{
                $or: [
                    {{follower_id: /^test-user-/}},
                    {{following_id: /^test-user-/}}
                ]
            }});
            
            print('Test data cleaned up successfully');
            """
            
            result = subprocess.run(
                ["mongosh", "--eval", cleanup_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.log_result("Cleanup", True, "Test data cleaned up successfully")
                return True
            else:
                self.log_result("Cleanup", False, f"Cleanup error: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_result("Cleanup", False, f"Cleanup failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Five App Backend API Tests")
        print(f"Testing against: {BASE_URL}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("Feed Empty", self.test_feed_empty),
            ("Feed Intent Filter", self.test_feed_with_intent_filter),
            ("Create Test User", self.create_test_user_and_session),
            ("Auth Me", self.test_auth_me),
            ("Create Post", self.test_create_post),
            ("Feed With Post", self.test_feed_with_post),
            ("Like Post", self.test_like_post),
            ("Comment Post", self.test_comment_on_post),
            ("Create Second User", self.create_second_test_user),
            ("Follow User", self.test_follow_user),
            ("Cleanup", self.cleanup_test_data)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                success = test_func()
                if success:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log_result(test_name, False, f"Test execution failed: {str(e)}")
                failed += 1
            
            print()  # Add spacing between tests
        
        # Summary
        print("=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['message']}")
        
        return failed == 0

def main():
    """Main test execution"""
    tester = FiveAPITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()