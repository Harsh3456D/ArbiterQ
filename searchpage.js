const API_BASE_URL = 'http://127.0.0.1:5000';

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.querySelector('form');
  const searchInput = document.querySelector('input[name="query"]');
  const resultArea = document.querySelector('.result_area');
  const postsRadio = document.getElementById('value-1');
  const usersRadio = document.getElementById('value-2');

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) {
      alert('Please enter a search term');
      return;
    }

    const searchType = postsRadio.checked ? 'posts' : 'users';
    resultArea.innerHTML = '<p>Searching...</p>';

    try {
      const response = await fetch(`${API_BASE_URL}/api/search?query=${encodeURIComponent(query)}&type=${searchType}`);
      if (!response.ok) throw new Error('Search failed');
      const results = await response.json();
      displayResults(results, searchType);
    } catch (error) {
      console.error('Search error:', error);
      resultArea.innerHTML = '<p>Search failed. Please try again.</p>';
    }
  });

  function displayResults(results, searchType) {
    resultArea.innerHTML = '';
    if (!results || results.length === 0) {
      resultArea.innerHTML = '<p>No results found</p>';
      return;
    }

    if (searchType === 'posts') {
      displayPostResults(results);
    } else {
      displayUserResults(results);
    }
  }

  function displayPostResults(posts) {
    posts.forEach(post => {
      const postCard = document.createElement('div');
      postCard.className = 'search_result';
      postCard.style.height = 'auto';
      postCard.style.minHeight = '300px';

      const createdDate = post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Unknown date';
      postCard.innerHTML = `
      <div style="background: #333333ff; color: #fff; padding: 10px; border-radius: 5px; height: 100%;">
        <div style="margin-bottom: 10px;">
          <strong>By:</strong> ${escapeHtml(post.username || 'Anonymous')}<br>
          <strong>Posted:</strong> ${createdDate}<br>
          <strong>Post ID:</strong> ${post.id}<br>
          <strong>Likes:</strong> ${post.like_count || 0}
        </div>

          <h3>${escapeHtml(post.topic || 'No Title')}</h3>
          <p>${escapeHtml(post.message || '')}</p>
        </div>
      `;
      resultArea.appendChild(postCard);
    });
  }

  function displayUserResults(users) {
    users.forEach(user => {
      const userCard = document.createElement('div');
      userCard.className = 'search_result';
      userCard.style.textAlign = 'center';

      // Use user's profile pic or default
      const profilePicUrl = user.profile_pic || 'profile.jpg';

      userCard.innerHTML = `
      <div style="height: 300px; background-color: #3a3a3a83">
        <div style="margin-bottom: 40px;">
          <img src="${profilePicUrl}" alt="Profile" style="width: 80px; height: 80px; margin-top: 20px; border-radius: 50%; object-fit: cover; border: 2px solid #1e88e5;">
        </div>
        <div style="margin-bottom: 10px;">
          <h3 style= color: #ff0000ff >${escapeHtml(user.username)}</h3>
          <p style="color: #969696ff; margin: 5px 0;">${escapeHtml(user.email)}</p>
          <p style="background: #1e88e5; color: white; display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; margin: 5px 0;">
            ${escapeHtml(user.role || 'Student')}
          </p>
        </div>
        <button onclick="viewProfile('${user.email}')" style="background: #1e88e5; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: bold;">
          View Profile
        </button>
        </div>
      `;
      resultArea.appendChild(userCard);
    });
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
});


function viewProfile(userEmail) {

  localStorage.setItem('viewingUserEmail', userEmail);

  window.location.href = 'profile.html';
}