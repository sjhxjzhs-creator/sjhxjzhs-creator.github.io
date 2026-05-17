import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, query, orderByChild, limitToLast, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
 
const firebaseConfig = {
  apiKey: "AIzaSyAwrG6EaK3R_olkVELt5PQA_AUsdzKnIqE",
  databaseURL: "https://project-8070304670066937245-default-rtdb.firebaseio.com"
};
 
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
 
let allPosts = [];
let commentCounts = {};
 
document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  setupEventListeners();
});
 
function setupEventListeners() {
  document.getElementById('postBtn').addEventListener('click', createPost);
  document.getElementById('searchBtn').addEventListener('click', searchPosts);
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchPosts();
  });
}
 
function loadPosts() {
  const postsRef = query(ref(db, 'posts'), orderByChild('timestamp'), limitToLast(50));
  
  onValue(postsRef, (snapshot) => {
    allPosts = [];
    snapshot.forEach((childSnapshot) => {
      const post = childSnapshot.val();
      post.id = childSnapshot.key;
      allPosts.unshift(post);
    });
    
    loadCommentCounts();
  });
}
 
function loadCommentCounts() {
  const commentsRef = ref(db, 'comments');
  onValue(commentsRef, (snapshot) => {
    commentCounts = {};
    snapshot.forEach((childSnapshot) => {
      const comment = childSnapshot.val();
      if (commentCounts[comment.postId]) {
        commentCounts[comment.postId]++;
      } else {
        commentCounts[comment.postId] = 1;
      }
    });
    renderPosts(allPosts);
  });
}
 
function renderPosts(posts) {
  const postsList = document.getElementById('postsList');
  
  if (posts.length === 0) {
    postsList.innerHTML = '<div class="no-posts">暂无帖子，快来发布第一条吧！</div>';
    return;
  }
  
  postsList.innerHTML = posts.map(post => createPostCard(post)).join('');
  
  posts.forEach(post => {
    const likeBtn = document.getElementById(`like-${post.id}`);
    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        likePost(post.id);
      });
    }
  });
}
 
function createPostCard(post) {
  const timeAgo = getTimeAgo(post.timestamp);
  const commentCount = commentCounts[post.id] || 0;
  const avatarLetter = post.author.charAt(0).toUpperCase();
  
  return `
    <div class="post-card">
      <a href="post.html?id=${post.id}">
        <div class="post-header">
          <div class="avatar">${avatarLetter}</div>
          <div class="author-info">
            <div class="author-name">${escapeHtml(post.author)}</div>
            <div class="post-time">${timeAgo}</div>
          </div>
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
        <div class="post-footer">
          <button class="like-btn" id="like-${post.id}">
            ❤️ ${post.likes || 0}
          </button>
          <button class="comment-btn">
            💬 ${commentCount}
          </button>
        </div>
      </a>
    </div>
  `;
}
 
function createPost() {
  const author = document.getElementById('authorInput').value.trim();
  const content = document.getElementById('contentInput').value.trim();
  
  if (!author || !content) {
    alert('请填写昵称和内容！');
    return;
  }
  
  const postsRef = ref(db, 'posts');
  push(postsRef, {
    author: author,
    content: content,
    timestamp: Date.now(),
    likes: 0
  }).then(() => {
    document.getElementById('authorInput').value = '';
    document.getElementById('contentInput').value = '';
  }).catch((error) => {
    console.error('Error adding post:', error);
    alert('发布失败，请重试！');
  });
}
 
function likePost(postId) {
  const postRef = ref(db, `posts/${postId}`);
  const post = allPosts.find(p => p.id === postId);
  
  if (post) {
    update(postRef, {
      likes: (post.likes || 0) + 1
    });
  }
}
 
function searchPosts() {
  const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
  
  if (!searchTerm) {
    renderPosts(allPosts);
    return;
  }
  
  const filteredPosts = allPosts.filter(post => 
    post.content.toLowerCase().includes(searchTerm) || 
    post.author.toLowerCase().includes(searchTerm)
  );
  
  renderPosts(filteredPosts);
}
 
function getTimeAgo(timestamp) {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);
  
  if (seconds < 60) return '刚刚';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} 天前`;
  
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
 
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
