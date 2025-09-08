
    // Real localStorage functions
    function getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
    }

    function getIncidents() {
    const incidents = localStorage.getItem('incidents');
    return incidents ? JSON.parse(incidents) : [];
    }

    function saveIncidents(incidents) {
    localStorage.setItem('incidents', JSON.stringify(incidents));
    }

    function getCurrentUser() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
    }

    // UI elements
    const logoutBtn = document.getElementById('logout-btn');
    const userListEl = document.getElementById('user-list');
    const userSearchInput = document.getElementById('user-search');
    const incidentListEl = document.getElementById('incident-list');
    const incidentSearchInput = document.getElementById('incident-search');
    const filterStatusSelect = document.getElementById('filter-status');
    const filterSeveritySelect = document.getElementById('filter-severity');

    const detailModal = document.getElementById('detail-modal');
    const detailClose = document.getElementById('detail-close');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalSeverity = document.getElementById('modal-severity');
    const modalStatus = document.getElementById('modal-status');
    const modalDate = document.getElementById('modal-date');
    const modalReporter = document.getElementById('modal-reporter');
    const modalPhoto = document.getElementById('modal-photo');
    const commentInput = document.getElementById('comment-input');
    const commentSubmitBtn = document.getElementById('comment-submit');
    const statusToggleBtn = document.getElementById('status-toggle');
    const modalMessage = document.getElementById('modal-message');

    let users = [];
    let selectedUser = null;
    let incidents = [];
    let allIncidents = [];
    let selectedIncidentId = null;

    // Initialize the application
    function init() {
    // Check if user is admin (you can modify this logic based on your auth system)
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.isAdmin) {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'index.html'; // Redirect to your login page
        return;
    }
    
    loadUsers();
    setupEventListeners();
    }

    function setupEventListeners() {
    logoutBtn.addEventListener('click', logout);
    userSearchInput.addEventListener('input', handleUserSearch);
    incidentSearchInput.addEventListener('input', filterIncidents);
    filterStatusSelect.addEventListener('change', filterIncidents);
    filterSeveritySelect.addEventListener('change', filterIncidents);
    detailClose.addEventListener('click', closeModal);
    detailModal.addEventListener('click', handleModalClick);
    document.addEventListener('keydown', handleEscapeKey);
    commentSubmitBtn.addEventListener('click', submitComment);
    statusToggleBtn.addEventListener('click', toggleStatus);
    }

    function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminSession');
    window.location.href = 'index.html'; // Redirect to your login page
    }

    function loadUsers() {
    users = getUsers();
    allIncidents = getIncidents();
    renderUsers(users);
    }

    function renderUsers(userArray) {
    if (userArray.length === 0) {
        userListEl.innerHTML = '<div class="empty-state"><h3>No Users Found</h3><p>No registered users in the system yet.</p></div>';
        return;
    }
    
    userListEl.innerHTML = '';
    userArray.forEach(user => {
        const div = document.createElement('div');
        div.classList.add('user-item');
        div.tabIndex = 0;
        div.setAttribute('role', 'listitem');
        
        if (selectedUser && selectedUser.id === user.id) {
        div.classList.add('selected');
        }
        
        // Count incidents for this user
        const userIncidentCount = allIncidents.filter(incident => incident.userId === user.id).length;
        
        div.innerHTML = `
        <div class="user-email">${user.email || user.username || '(No email)'}</div>
        <div class="user-meta">
            ${userIncidentCount} incident${userIncidentCount !== 1 ? 's' : ''} • 
            Joined: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
        </div>
        `;
        
        div.addEventListener('click', () => selectUser(user));
        div.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectUser(user);
        }
        });
        
        userListEl.appendChild(div);
    });
    }

    function handleUserSearch() {
    const query = userSearchInput.value.toLowerCase();
    const filteredUsers = users.filter(u => {
        const email = u.email || u.username || '';
        return email.toLowerCase().includes(query);
    });
    renderUsers(filteredUsers);
    }

    function selectUser(user) {
    selectedUser = user;
    renderUsers(users.filter(u => {
        if (!userSearchInput.value) return true;
        const email = u.email || u.username || '';
        return email.toLowerCase().includes(userSearchInput.value.toLowerCase());
    }));
    
    // Reset incident filters
    incidentSearchInput.value = '';
    filterStatusSelect.value = 'all';
    filterSeveritySelect.value = 'all';
    
    loadUserIncidents(user.id);
    }

    function loadUserIncidents(userId) {
    incidentListEl.innerHTML = '<div class="loading">Loading incidents...</div>';
    
    // Filter incidents for the selected user
    incidents = allIncidents.filter(incident => incident.userId === userId);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
        renderIncidents(incidents);
    }, 300);
    }

    function renderIncidents(incidentsArray) {
    if (incidentsArray.length === 0) {
        incidentListEl.innerHTML = '<div class="empty-state"><h3>No Incidents</h3><p>This user has not reported any incidents yet.</p></div>';
        return;
    }
    
    incidentListEl.innerHTML = '';
    incidentsArray.forEach(incident => {
        const card = document.createElement('article');
        card.classList.add('incident-card');
        card.tabIndex = 0;
        card.setAttribute('role', 'listitem');
        
        // Format date properly
        let incidentDate = 'Unknown Date';
        if (incident.date) {
        try {
            const date = new Date(incident.date);
            incidentDate = date.toLocaleString();
        } catch (e) {
            incidentDate = incident.date;
        }
        } else if (incident.createdAt) {
        try {
            const date = new Date(incident.createdAt);
            incidentDate = date.toLocaleString();
        } catch (e) {
            incidentDate = incident.createdAt;
        }
        }
        
        card.innerHTML = `
        <div class="incident-header">
            <h3 class="incident-title">${incident.title || 'Untitled Incident'}</h3>
            <div class="badge-container">
            <span class="badge severity-${(incident.severity || 'medium').toLowerCase()}">${incident.severity || 'Medium'}</span>
            <span class="badge status-${(incident.status || 'open').toLowerCase().replace(' ', '')}">${incident.status || 'Open'}</span>
            </div>
        </div>
        <p class="incident-description">${incident.description || 'No description provided.'}</p>
        <div class="incident-date">${incidentDate}</div>
        `;
        
        card.addEventListener('click', () => openIncidentDetails(incident));
        card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openIncidentDetails(incident);
        }
        });
        
        incidentListEl.appendChild(card);
    });
    }

    function filterIncidents() {
    if (!incidents.length) return;
    
    const searchQuery = incidentSearchInput.value.toLowerCase();
    const statusFilter = filterStatusSelect.value;
    const severityFilter = filterSeveritySelect.value;
    
    const filtered = incidents.filter(incident => {
        const titleMatch = (incident.title || '').toLowerCase().includes(searchQuery);
        const descMatch = (incident.description || '').toLowerCase().includes(searchQuery);
        const textMatch = titleMatch || descMatch;
        
        const statusMatch = (statusFilter === 'all') || (incident.status === statusFilter);
        const severityMatch = (severityFilter === 'all') || (incident.severity === severityFilter);
        
        return textMatch && statusMatch && severityMatch;
    });
    
    renderIncidents(filtered);
    }

    function openIncidentDetails(incident) {
    selectedIncidentId = incident.id;
    modalTitle.textContent = incident.title || 'Untitled Incident';
    modalDescription.textContent = incident.description || 'No description provided.';
    modalSeverity.textContent = incident.severity || 'Medium';
    modalStatus.textContent = incident.status || 'Open';
    
    // Format date
    let formattedDate = 'Unknown';
    if (incident.date) {
        try {
        formattedDate = new Date(incident.date).toLocaleString();
        } catch (e) {
        formattedDate = incident.date;
        }
    } else if (incident.createdAt) {
        try {
        formattedDate = new Date(incident.createdAt).toLocaleString();
        } catch (e) {
        formattedDate = incident.createdAt;
        }
    }
    
    modalDate.textContent = formattedDate;
    modalReporter.textContent = selectedUser.email || selectedUser.username || 'Unknown';
    
    // Handle photo
    if (incident.photoURL || incident.photo) {
        modalPhoto.src = incident.photoURL || incident.photo;
        modalPhoto.style.display = 'block';
    } else {
        modalPhoto.style.display = 'none';
    }
    
    commentInput.value = incident.adminComment || '';
    hideMessage();
    detailModal.classList.add('active');
    commentInput.focus();
    }

    function closeModal() {
    detailModal.classList.remove('active');
    hideMessage();
    }

    function handleModalClick(e) {
    if (e.target === detailModal) {
        closeModal();
    }
    }

    function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
    }

    function submitComment() {
    if (!selectedIncidentId) return;
    
    const comment = commentInput.value.trim();
    commentSubmitBtn.disabled = true;
    commentSubmitBtn.textContent = 'Saving...';
    
    try {
        // Find and update the incident in allIncidents
        const incidentIndex = allIncidents.findIndex(i => i.id === selectedIncidentId);
        if (incidentIndex === -1) {
        throw new Error('Incident not found');
        }
        
        allIncidents[incidentIndex].adminComment = comment;
        
        // Update the local incidents array
        const localIncidentIndex = incidents.findIndex(i => i.id === selectedIncidentId);
        if (localIncidentIndex !== -1) {
        incidents[localIncidentIndex].adminComment = comment;
        }
        
        // Save to localStorage
        saveIncidents(allIncidents);
        
        showMessage('Comment saved successfully!', 'success');
    } catch (error) {
        showMessage('Error saving comment: ' + error.message, 'error');
    } finally {
        commentSubmitBtn.disabled = false;
        commentSubmitBtn.textContent = 'Submit Comment';
    }
    }

    function toggleStatus() {
    if (!selectedIncidentId) return;
    
    statusToggleBtn.disabled = true;
    statusToggleBtn.textContent = 'Updating...';
    
    try {
        // Find the incident in allIncidents
        const incidentIndex = allIncidents.findIndex(i => i.id === selectedIncidentId);
        if (incidentIndex === -1) {
        throw new Error('Incident not found');
        }
        
        const incident = allIncidents[incidentIndex];
        const nextStatus = getNextStatus(incident.status || 'Open');
        
        // Update the incident
        allIncidents[incidentIndex].status = nextStatus;
        
        // Update the local incidents array
        const localIncidentIndex = incidents.findIndex(i => i.id === selectedIncidentId);
        if (localIncidentIndex !== -1) {
        incidents[localIncidentIndex].status = nextStatus;
        }
        
        // Save to localStorage
        saveIncidents(allIncidents);
        
        // Update the modal display
        modalStatus.textContent = nextStatus;
        
        // Refresh the incident list to show updated status
        filterIncidents();
        
        showMessage(`Status updated to "${nextStatus}"!`, 'success');
    } catch (error) {
        showMessage('Error updating status: ' + error.message, 'error');
    } finally {
        statusToggleBtn.disabled = false;
        statusToggleBtn.textContent = 'Change Status';
    }
    }

    function getNextStatus(currentStatus) {
    switch (currentStatus) {
        case 'Open': return 'In Progress';
        case 'In Progress': return 'Resolved';
        case 'Resolved': return 'Open';
        default: return 'Open';
    }
    }

    function showMessage(text, type) {
    modalMessage.textContent = text;
    modalMessage.classList.add('show');
    
    if (type === 'success') {
        modalMessage.style.background = 'rgba(46, 204, 113, 0.2)';
        modalMessage.style.border = '1px solid rgba(46, 204, 113, 0.5)';
        modalMessage.style.color = '#2ecc71';
    } else if (type === 'error') {
        modalMessage.style.background = 'rgba(231, 76, 60, 0.2)';
        modalMessage.style.border = '1px solid rgba(231, 76, 60, 0.5)';
        modalMessage.style.color = '#e74c3c';
    }
    
    // Auto-hide after 5 seconds
    setTimeout(hideMessage, 5000);
    }

    function hideMessage() {
    modalMessage.classList.remove('show');
    setTimeout(() => {
        modalMessage.textContent = '';
    }, 300);
    }

    // Initialize the application when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);