// Admin Panel - User Search and Management

document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('userSearchInput');
  const searchResults = document.getElementById('searchResults');

  // Search users
  if (searchBtn) {
    searchBtn.addEventListener('click', async () => {
      const query = searchInput.value.trim();
      
      if (!query) {
        alert('Please enter a username or email to search');
        return;
      }

      searchResults.innerHTML = '<p>Searching...</p>';

      try {
        const response = await fetch(`http://127.0.0.1:5000/api/search?query=${encodeURIComponent(query)}&type=users`);
        
        if (!response.ok) {
          throw new Error('Search failed');
        }

        const users = await response.json();
        
        if (!users || users.length === 0) {
          searchResults.innerHTML = '<p style="color:#aaa;">No users found</p>';
          return;
        }

        displayUserResults(users);

      } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<p style="color:#f44336;">Error searching users. Check console.</p>';
      }
    });

    // Allow Enter key to trigger search
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchBtn.click();
      }
    });
  }

  function displayUserResults(users) {
    searchResults.innerHTML = '';

    users.forEach(user => {
      const userCard = document.createElement('div');
      userCard.style.cssText = `
        background: rgba(60, 60, 60, 0.8);
        border: 1px solid #1e88e5;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
      `;

      const profilePic = user.profile_pic || 'https://via.placeholder.com/60';
      const userInfo = document.createElement('div');
      userInfo.style.cssText = 'flex: 1;';
      userInfo.innerHTML = `
        <div style="display: flex; gap: 12px; align-items: center;">
          <img src="${profilePic}" alt="Profile" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #1e88e5;">
          <div>
            <h4 style="margin: 0 0 5px 0; color: #64b5f6;">${escapeHtml(user.username)}</h4>
            <p style="margin: 0 0 3px 0; color: #aaa; font-size: 12px;">${escapeHtml(user.email)}</p>
            <span style="background: ${user.role === 'Admin' ? '#d32f2f' : user.role === 'Mentor' ? '#ff9800' : '#1e88e5'}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">
              ${user.role || 'Student'}
            </span>
          </div>
        </div>
      `;

      const actionsDiv = document.createElement('div');
      actionsDiv.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';

      // Promote button
      const promoteBtn = document.createElement('button');
      promoteBtn.textContent = user.role === 'Admin' ? 'Demote to Mentor' : user.role === 'Mentor' ? 'Promote to Admin' : 'Promote to Mentor';
      promoteBtn.style.cssText = `
        background: #ff9800;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
      `;
      promoteBtn.addEventListener('click', () => promoteUser(user.UID, user.username, user.role));

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete User';
      deleteBtn.style.cssText = `
        background: #d32f2f;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
      `;
      deleteBtn.addEventListener('click', () => deleteUser(user.UID, user.username));

      actionsDiv.appendChild(promoteBtn);
      actionsDiv.appendChild(deleteBtn);

      userCard.appendChild(userInfo);
      userCard.appendChild(actionsDiv);
      searchResults.appendChild(userCard);
    });
  }

  // Promote/Demote user
  window.promoteUser = async (userId, username, currentRole) => {
    let newRole;
    
    if (currentRole === 'Admin') {
      newRole = 'Mentor';
    } else if (currentRole === 'Mentor') {
      newRole = 'Admin';
    } else {
      newRole = 'Mentor';
    }

    if (!confirm(`Change ${username}'s role to ${newRole}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/admin/promote-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          new_role: newRole,
          admin_email: localStorage.getItem('userEmail')
        })
      });

      if (response.ok) {
        alert(`${username} is now ${newRole}`);
        // Refresh search
        document.getElementById('searchBtn').click();
      } else {
        const data = await response.json();
        alert('Error: ' + (data.error || 'Failed to promote user'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error');
    }
  };

  // Delete user
  window.deleteUser = async (userId, username) => {
    if (!confirm(`Delete user "${username}" and all their data? This cannot be undone!`)) {
      return;
    }

    if (!confirm('Are you absolutely sure? This will delete all their posts, comments, and likes!')) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/admin/delete-user`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          admin_email: localStorage.getItem('userEmail')
        })
      });

      if (response.ok) {
        alert(`User "${username}" deleted successfully`);
        // Refresh search
        document.getElementById('searchBtn').click();
      } else {
        const data = await response.json();
        alert('Error: ' + (data.error || 'Failed to delete user'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error');
    }
  };

  // Utility function to escape HTML
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

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = 'Main.html';
    });
  }
});
