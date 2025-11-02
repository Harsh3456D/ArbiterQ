let isSubmitting = false;

document.addEventListener('DOMContentLoaded', () => {

const postForm = document.getElementById('createPostForm');

if (postForm) {

const submitButton = postForm.querySelector('button[type="submit"]');

postForm.addEventListener('submit', async (event) => {

event.preventDefault();

event.stopImmediatePropagation();

if (isSubmitting) {

console.log('Already submitting, ignoring duplicate submission');

return;

}

isSubmitting = true;

if (submitButton) {

submitButton.textContent = 'Posting...';

submitButton.disabled = true;

}

const topic = document.getElementById('topic')?.value;

const message = document.getElementById('message')?.value;

const attachmentFile = document.getElementById('attachment')?.files[0];

if (!topic || !message) {

alert('Please fill in both topic and message fields');

if (submitButton) {

submitButton.textContent = 'Post';

submitButton.disabled = false;

}

return;

}

const userEmail = localStorage.getItem('userEmail');

if (!userEmail) {

alert('You must be logged in to post');

window.location.href = 'login.html';

return;

}

const formData = new FormData();

formData.append('topic', topic);

formData.append('message', message);

formData.append('user_email', userEmail);

if (attachmentFile) {

formData.append('attachment', attachmentFile);

}

try {

const response = await fetch('http://127.0.0.1:5000/api/create-post', {

method: 'POST',

body: formData,

});

const data = await response.json();

if (response.ok) {

alert('Post created successfully!');

postForm.reset();

const modal = document.getElementById('createPostModal');

if (modal) {

modal.classList.remove('active');

}

if (typeof window.fetchAllPosts === 'function') {

window.fetchAllPosts();

}

} else {

alert('Failed to create post: ' + (data.error || 'Unknown error'));

}

} catch (error) {

console.error('Post creation error:', error);

alert('Error: Could not connect to the server');

} finally {

if (submitButton) {

submitButton.textContent = 'Post';

submitButton.disabled = false;

}

}

});

}

const queryFeed = document.getElementById('queryFeed');

const postTemplate = document.getElementById('post-template');

if (!queryFeed || !postTemplate) {

return;

}

let isFetchingPosts = false;

window.fetchAllPosts = async function() {

if (isFetchingPosts) {

console.log('Already fetching posts, skipping...');

return;

}

isFetchingPosts = true;

try {

const response = await fetch('http://127.0.0.1:5000/api/posts');

if (!response.ok) {

throw new Error(`Server returned ${response.status}`);

}

const posts = await response.json();

const existingPosts = queryFeed.querySelectorAll('.query-card:not(#post-template)');

existingPosts.forEach(card => card.remove());

if (!posts || posts.length === 0) {

const emptyMsg = document.createElement('p');

emptyMsg.style.cssText = 'text-align:center;color:#aaa;padding:20px;grid-column:1/-1;';

emptyMsg.textContent = 'No posts yet. Be the first to create one!';

queryFeed.appendChild(emptyMsg);

return;

}

const userEmail = localStorage.getItem('userEmail');

const userId = localStorage.getItem('userUid');

posts.forEach(post => {

const card = postTemplate.cloneNode(true);

card.id = `post-${post.id}`;

card.style.display = 'flex';

const questionElement = card.querySelector('.post-question');

const descriptionElement = card.querySelector('.post-description');

const infoElement = card.querySelector('.post-info');

const attachmentBtn = card.querySelector('.attachment-button');

if (questionElement) questionElement.textContent = post.topic || 'Untitled';

if (descriptionElement) descriptionElement.textContent = post.message || '';

if (infoElement) {

const postDate = new Date(post.created_at).toLocaleDateString();

infoElement.textContent = `Posted by: ${post.username || 'Anonymous'} | ${postDate}`;

}

if (attachmentBtn) {

if (post.attachment_url) {

attachmentBtn.style.display = 'block';

attachmentBtn.onclick = () => window.open(post.attachment_url, '_blank');

} else {

attachmentBtn.style.display = 'none';

}

}

// MENTOR ASSIGN BUTTON
const assignMentorBtn = card.querySelector('.assign-mentor-btn');

const mentorSelect = card.querySelector('.mentor-select');

if (assignMentorBtn && mentorSelect && localStorage.getItem('userRole') === 'Admin') {

assignMentorBtn.style.display = 'inline-block';

mentorSelect.style.display = 'inline-block';

// Load mentors
(async () => {

try {

const response = await fetch('http://127.0.0.1:5000/api/mentors');

if (response.ok) {

const mentors = await response.json();

let html = '<option value="">Select Mentor</option>';

mentors.forEach(m => {

html += `<option value="${m.UID}">${m.username}</option>`;

});

mentorSelect.innerHTML = html;

}

} catch (error) {

console.error('Error loading mentors:', error);

}

})();

// Assign mentor on button click
assignMentorBtn.addEventListener('click', async () => {

const mentorId = mentorSelect.value;

if (!mentorId) {

alert('Please select a mentor');

mentorSelect.focus();

return;

}

try {

const response = await fetch(`http://127.0.0.1:5000/api/posts/${post.id}/assign-mentor`, {

method: 'POST',

headers: { 'Content-Type': 'application/json' },

body: JSON.stringify({ mentor_id: mentorId })

});

if (response.ok) {

alert('Mentor assigned successfully!');

mentorSelect.value = '';

} else {

alert('Failed to assign mentor');

}

} catch (error) {

console.error('Error:', error);

alert('Network error');

}

});

} else if (assignMentorBtn && mentorSelect) {

assignMentorBtn.style.display = 'none';

mentorSelect.style.display = 'none';

}

// LIKE SYSTEM
const likeInput = card.querySelector('input[id="heart-template"]');

const likeLabel = card.querySelector('label.like');

const likeCount = card.querySelector('.like-count');

if (likeInput && likeLabel && likeCount) {

const uniqueId = `heart-${post.id}`;

likeInput.id = uniqueId;

likeLabel.htmlFor = uniqueId;

likeCount.textContent = post.like_count || '0';

if (userEmail) {

(async () => {

try {

const statusResponse = await fetch(`http://127.0.0.1:5000/api/posts/${post.id}/like-status?user_email=${userEmail}`);

if (statusResponse.ok) {

const statusData = await statusResponse.json();

likeCount.textContent = statusData.like_count;

likeInput.checked = statusData.user_liked;

}

} catch (error) {

console.error('Error loading like status:', error);

}

})();

}

likeInput.addEventListener('change', async () => {

if (!userEmail) {

alert('Please log in to like posts');

likeInput.checked = false;

window.location.href = 'login.html';

return;

}

try {

const likeResponse = await fetch(`http://127.0.0.1:5000/api/posts/${post.id}/like`, {

method: 'POST',

headers: { 'Content-Type': 'application/json' },

body: JSON.stringify({ user_email: userEmail })

});

if (likeResponse.ok) {

const likeData = await likeResponse.json();

likeCount.textContent = likeData.like_count;

} else {

likeInput.checked = !likeInput.checked;

}

} catch (error) {

console.error('Error:', error);

likeInput.checked = !likeInput.checked;

}

});

}

// COMMENT LINK
const commentLink = card.querySelector('.comment-link');

if (commentLink) {

commentLink.href = `comments.html?post_id=${post.id}`;

}

// DELETE BUTTON
const deleteBtn = card.querySelector('.delete-post-btn');

if (deleteBtn) {

if (userId == post.user_id || localStorage.getItem('userRole') === 'Admin') {

deleteBtn.style.display = 'inline-block';

deleteBtn.onclick = () => {

if (confirm('Delete this post?')) {

deletePostUser(post.id, userEmail);

}

};

} else {

deleteBtn.style.display = 'none';

}

}

queryFeed.appendChild(card);

});

} catch (error) {

console.error('Error fetching posts:', error);

const existingPosts = queryFeed.querySelectorAll('.query-card:not(#post-template)');

existingPosts.forEach(card => card.remove());

const errorMsg = document.createElement('p');

errorMsg.style.cssText = 'text-align:center;color:#f44336;padding:20px;grid-column:1/-1;';

errorMsg.innerHTML = `<strong>Error:</strong> Could not load posts`;

queryFeed.appendChild(errorMsg);

} finally {

isFetchingPosts = false;

}

};

async function deletePostUser(postId, userEmail) {

try {

const response = await fetch(`http://127.0.0.1:5000/api/posts/${postId}/delete`, {

method: 'DELETE',

headers: { 'Content-Type': 'application/json' },

body: JSON.stringify({ user_email: userEmail })

});

if (response.ok) {

alert('Post deleted successfully');

window.fetchAllPosts();

} else {

const data = await response.json();

alert('Error: ' + (data.error || 'Failed to delete post'));

}

} catch (error) {

console.error('Error:', error);

alert('Network error');

}

}

window.fetchAllPosts();

setInterval(() => {

window.fetchAllPosts();

}, 10000);

});