document.addEventListener('DOMContentLoaded', () => {
  // Check if viewing another user's profile or own
  const viewingUserEmail = localStorage.getItem('viewingUserEmail');
  const userEmail = viewingUserEmail || localStorage.getItem('userEmail');
  const userRole = localStorage.getItem('userRole');

  // If viewing another user, show "Back" button instead of "Edit" section
  const isViewingOther = viewingUserEmail && viewingUserEmail !== localStorage.getItem('userEmail');

  if (!userEmail) {
    alert('Please log in to view profile');
    window.location.href = 'login.html';
    return;
  }

  // Load profile data
  loadProfile(userEmail, isViewingOther);

  // Show/hide edit section based on whose profile we're viewing
  const editSection = document.querySelector('.edit-section');
  const deleteSection = document.querySelector('.delete-section');
  const adminControls = document.getElementById('adminControls');

  if (isViewingOther) {
    if (editSection) editSection.style.display = 'none';
    if (deleteSection) deleteSection.style.display = 'none';
    if (adminControls) adminControls.style.display = 'none';

    // Add back button
    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back to Search';
    backBtn.className = 'btn';
    backBtn.onclick = () => {
      localStorage.removeItem('viewingUserEmail');
      history.back();
    };
    document.querySelector('.header-btns')?.appendChild(backBtn);
  } else {
    // Own profile - show edit sections
    if (editSection) editSection.style.display = 'block';
    if (deleteSection) deleteSection.style.display = 'block';
    
    // Show admin controls if admin
    if (adminControls) {
      if (userRole === 'Admin') {
        adminControls.style.display = 'block';
      }
    }

    // Handle profile update form
    document.getElementById('updateProfileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const newUsername = document.getElementById('newUsername').value.trim();
      const profilePicFile = document.getElementById('profilePicFile').files;

      if (!newUsername && !profilePicFile) {
        alert('Please enter a new username or select a profile picture');
        return;
      }

      const formData = new FormData();
      formData.append('user_email', userEmail);
      if (newUsername) formData.append('username', newUsername);
      if (profilePicFile) formData.append('profile_pic', profilePicFile);

      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Updating...';

      try {
        const response = await fetch('http://127.0.0.1:5000/api/profile/update', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          alert('Profile updated successfully!');
          if (newUsername) {
            localStorage.setItem('username', newUsername);
          }
          loadProfile(userEmail, false);
          document.getElementById('updateProfileForm').reset();
        } else {
          const data = await response.json();
          alert('Error: ' + (data.error || 'Failed to update profile'));
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Network error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Update Profile';
      }
    });

    // Handle delete account form
    document.getElementById('deleteAccountForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const password = document.getElementById('deletePassword').value;

      if (!confirm('Are you ABSOLUTELY sure you want to delete your account? This cannot be undone!')) {
        return;
      }

      if (!confirm('Last warning! All your posts, comments, and likes will be permanently deleted. Continue?')) {
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:5000/api/profile/delete-account', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_email: userEmail,
            password: password
          })
        });

        if (response.ok) {
          alert('Account deleted successfully. You will be logged out.');
          localStorage.clear();
          window.location.href = 'Main.html';
        } else {
          const data = await response.json();
          alert('Error: ' + (data.error || 'Failed to delete account'));
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Network error');
      }
    });
  }

  // Logout button
  document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'Main.html';
  });

  // Load profile function
  async function loadProfile(email, isViewingOther) {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/profile/${email}`);
      
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      const user = data.user;
      const posts = data.posts;

      // Update profile display
      document.getElementById('profileUsername').textContent = user.username;
      document.getElementById('profileEmail').textContent = user.email;
      
      const roleBadge = document.getElementById('profileRole');
      roleBadge.textContent = user.role;
      roleBadge.className = 'badge';
      if (user.role === 'Admin') roleBadge.classList.add('admin');
      if (user.role === 'Mentor') roleBadge.classList.add('mentor');

      // Update profile picture - KEY FIX!
      if (user.profile_pic) {
        document.getElementById('profilePic').src = user.profile_pic;
      } else {
        document.getElementById('profilePic').src = 'profile.jpg';
      }

      // Display posts
      document.getElementById('postCount').textContent = posts.length;
      const postsContainer = document.getElementById('userPosts');

      if (posts.length === 0) {
        postsContainer.innerHTML = '<p style="text-align:center; color:#aaa;">No posts yet</p>';
      } else {
        postsContainer.innerHTML = posts.map(post => `
          <div class="post-item">
            <h4>${post.topic}</h4>
            <p>${post.message}</p>
            ${post.attachment_url ? `<a href="${post.attachment_url}" target="_blank" class="btn" style="font-size:12px; padding:5px 10px">View Attachment</a>` : ''}
            <div class="post-meta">
              <span><i class="fas fa-heart"></i> ${post.like_count} likes</span>
              <span><i class="fas fa-comment"></i> ${post.comment_count} comments</span>
              <span><i class="fas fa-calendar"></i> ${new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            ${!isViewingOther ? `
              <button class="btn btn-danger" style="margin-top:10px; font-size:12px; padding:5px 10px" onclick="deletePost(${post.id})">
                <i class="fas fa-trash"></i> Delete
              </button>
            ` : ''}
          </div>
        `).join('');
      }

    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Failed to load profile data');
    }
  }

  // Delete post function
  window.deletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/posts/${postId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: userEmail })
      });

      if (response.ok) {
        alert('Post deleted successfully');
        loadProfile(userEmail, false);
      } else {
        const data = await response.json();
        alert('Error: ' + (data.error || 'Failed to delete post'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error');
    }
  };
});