import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
 
const firebaseConfig = {
  apiKey: "AIzaSyAwrG6EaK3R_olkVELt5PQA_AUsdzKnIqE",
  databaseURL: "https://project-8070304670066937245-default-rtdb.firebaseio.com"
};
 
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
 
let currentPostId = null;
let currentPost = null;
 
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentPostId = urlParams.get('id');
  
  if (currentPostId) {
    loadPost();
    loadComments();
    setupEventListeners();
  } else {
    window.location.href = 'index.html';
  }
});
 
function setupEventListeners() {
  document.getElementById('commentBtn').addEventListener('click', createComment);
}
 
function loadPost() {
  const postRef = ref(db, `posts/${currentPostId}`);
  
  onValue(postRef, (snapshot) => {
    if (snapshot.exists()) {
      currentPost = snapshot.val();
      currentPost.id = currentPostId;
      renderPost(currentPost);
    } else {
      document.getElementById('postDetail').innerHTML = '<div class="no-posts">帖子不存在！</div>';
    }
  });
}
 
function loadComments() {
  const commentsRef = ref(db, 'comments');
  
  onValue(commentsRef, (snapshot) => {
    const comments = [];
    snapshot.forEach((childSnapshot) => {
      const comment = childSnapshot.val();
      if (comment.postId === currentPostId) {
        comment.id = childSnapshot.key;
        comments.push(comment);
      }
    });
    
    comments.sort((a, b) => a.timestamp - b.timestamp);
    renderComments(comments);
  });
}
 
function renderPost(post) {
  const postDetail = document.getElementById('postDetail');
  const timeAgo = getTimeAgo(post.timestamp);
  const avatarLetter = post.author.charAt(0).toUpperCase();
  
  postDetail.innerHTML = `
    <div class="post-detail-card">
      <div class="post-header">
        <div class="avatar">${avatarLetter}</div>
        <div class="author-info">
          <div class="author-name">${escapeHtml(post.author)}</div>
          <div class="post-time">${timeAgo}</div>
        </div>
      </div>
      <div class="post-content">${escapeHtml(post.content)}</div>
      <div class="post-footer">
        <button class="like-btn" id="likeBtn">
          ❤️ ${post.likes || 0}
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('likeBtn').addEventListener('click', () => {
    likePost();
  });
}
 
function renderComments(comments) {
  const commentsList = document.getElementById('commentsList');
  
  if (comments.length === 0) {
    commentsList.innerHTML = '<div class="no-posts">暂无评论，快来发表第一条吧！</div>';
    return;
  }
  
  commentsList.innerHTML = comments.map(comment => createCommentCard(comment)).join('');
}
 
function createCommentCard(comment) {
  const timeAgo = getTimeAgo(comment.timestamp);
  const avatarLetter = comment.author.charAt(0).toUpperCase();
  
  return `
    <div class="comment-card">
      <div class="comment-header">
        <div class="avatar">${avatarLetter}</div>
        <div class="author-info">
          <div class="author-name">${escapeHtml(comment.author)}</div>
          <div class="comment-time">${timeAgo}</div>
        </div>
      </div>
      <div class="comment-content">${escapeHtml(comment.content)}</div>
    </div>
  `;
}
 
function likePost() {
  const postRef = ref(db, `posts/${currentPostId}`);
  
  if (currentPost) {
    update(postRef, {
      likes: (currentPost.likes || 0) + 1
    });
  }
}
 
function createComment() {
  const author = document.getElementById('commentAuthorInput').value.trim();
  const content = document.getElementById('commentContentInput').value.trim();
  
  if (!author || !content) {
    alert('请填写昵称和评论内容！');
    return;
  }
  
  const commentsRef = ref(db, 'comments');
  push(commentsRef, {
    postId: currentPostId,
    author: author,
    content: content,
    timestamp: Date.now()
  }).then(() => {
    document.getElementById('commentAuthorInput').value = '';
    document.getElementById('commentContentInput').value = '';
  }).catch((error) => {
    console.error('Error adding comment:', error);
    alert('评论失败，请重试！');
  });
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
