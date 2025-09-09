
// No mock data - use existing system data
let incidents = [];
let selectedIncident = null;

// DOM Elements
const newIncidentsContainer = document.getElementById('new-incidents');
const progressIncidentsContainer = document.getElementById('progress-incidents');
const resolvedIncidentsContainer = document.getElementById('resolved-incidents');
const emptyState = document.getElementById('empty-state');
const incidentDetail = document.getElementById('incident-detail');
const logoutBtn = document.getElementById('logout-btn');
const commentInput = document.getElementById('comment-input');
const commentSubmitBtn = document.getElementById('comment-submit');
const statusToggleBtn = document.getElementById('status-toggle');
const actionMessage = document.getElementById('action-message');

// Initialize dashboard
function init() {
  loadIncidents();
  setupEventListeners();
}

function setupEventListeners() {
  logoutBtn.addEventListener('click', logout);
  commentSubmitBtn.addEventListener('click', submitComment);
  statusToggleBtn.addEventListener('click', toggleStatus);
}

function loadIncidents() {
  // Get incidents from existing system
  incidents = JSON.parse(localStorage.getItem('incidents') || '[]');
  
  // Clear containers
  newIncidentsContainer.innerHTML = '';
  progressIncidentsContainer.innerHTML = '';
  resolvedIncidentsContainer.innerHTML = '';
  
  // Categorize incidents by status
  const newIncidents = incidents.filter(i => i.status === 'Open');
  const progressIncidents = incidents.filter(i => i.status === 'In Progress');
  const resolvedIncidents = incidents.filter(i => i.status === 'Resolved');
  
  // Update counts
  document.getElementById('new-count').textContent = newIncidents.length;
  document.getElementById('progress-count').textContent = progressIncidents.length;
  document.getElementById('resolved-count').textContent = resolvedIncidents.length;
  
  // Render incidents (newest first)
  renderIncidentList(newIncidents.reverse(), newIncidentsContainer);
  renderIncidentList(progressIncidents.reverse(), progressIncidentsContainer);
  renderIncidentList(resolvedIncidents.reverse(), resolvedIncidentsContainer);
}

function renderIncidentList(incidentList, container) {
  if (incidentList.length === 0) {
    container.innerHTML = '<div style="padding: 1rem; text-align: center; color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">No incidents</div>';
    return;
  }
  
  incidentList.forEach(incident => {
    const incidentElement = document.createElement('div');
    incidentElement.className = `inbox-item ${!incident.isRead ? 'unread' : ''}`;
    incidentElement.dataset.incidentId = incident.id;
    
    // Handle different reporter types from your existing system
    let reporterDisplay;
    if (incident.isAnonymous) {
      reporterDisplay = `Anonymous${incident.referenceCode ? ` (${incident.referenceCode})` : ''}`;
    } else {
      // Use the user data from your existing system
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.id === incident.userId);
      reporterDisplay = user ? user.name : (incident.userEmail || 'Unknown User');
    }
    
    incidentElement.innerHTML = `
      <div class="inbox-item-title">${incident.title || incident.type || 'Untitled Incident'}</div>
      <div class="inbox-item-meta">
        <span class="inbox-item-reporter">${reporterDisplay}</span>
        <span class="inbox-item-date">${formatDate(incident.dateReported || incident.createdAt)}</span>
      </div>
    `;
    
    incidentElement.addEventListener('click', () => selectIncident(incident.id));
    container.appendChild(incidentElement);
  });
}

function selectIncident(incidentId) {
  selectedIncident = incidents.find(i => i.id === incidentId);
  if (!selectedIncident) return;
  
  // Mark as read if not already
  if (!selectedIncident.isRead) {
    selectedIncident.isRead = true;
    localStorage.setItem('incidents', JSON.stringify(incidents));
    loadIncidents(); // Refresh to update read status
  }
  
  // Update UI selection
  document.querySelectorAll('.inbox-item').forEach(item => {
    item.classList.remove('selected');
  });
  const selectedElement = document.querySelector(`[data-incident-id="${incidentId}"]`);
  if (selectedElement) {
    selectedElement.classList.add('selected');
  }
  
  // Show incident details
  showIncidentDetail(selectedIncident);
}

function showIncidentDetail(incident) {
  emptyState.style.display = 'none';
  incidentDetail.classList.add('active');
  
  // Update detail fields using your existing data structure
  document.getElementById('detail-title').textContent = incident.title || incident.type || 'Incident Report';
  document.getElementById('detail-description').textContent = incident.description || 'No description provided.';
  document.getElementById('detail-severity').textContent = incident.severity || 'Not specified';
  document.getElementById('detail-status').textContent = incident.status || 'Open';
  document.getElementById('detail-date').textContent = formatDateTime(incident.dateReported || incident.createdAt);
  
  // Handle reporter display using your existing user system
  let reporterDisplay;
  if (incident.isAnonymous) {
    reporterDisplay = `Anonymous Report${incident.referenceCode ? ` (Code: ${incident.referenceCode})` : ''}`;
  } else {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === incident.userId);
    if (user) {
      reporterDisplay = `${user.name} (${user.email})`;
    } else {
      reporterDisplay = incident.userEmail || 'Unknown User';
    }
  }
  document.getElementById('detail-reporter').textContent = reporterDisplay;
  
  // Update badges
  const badgesContainer = document.getElementById('detail-badges');
  const severity = incident.severity || 'Medium';
  const status = incident.status || 'Open';
  badgesContainer.innerHTML = `
    <span class="badge severity-${severity.toLowerCase()}">${severity}</span>
    <span class="badge status-${status.toLowerCase().replace(' ', '')}">${status}</span>
  `;
  
  // Handle photo from your existing system
  const photoElement = document.getElementById('detail-photo');
  if (incident.photo) {
    photoElement.src = incident.photo;
    photoElement.style.display = 'block';
  } else {
    photoElement.style.display = 'none';
  }
  
  // Update status button text
  updateStatusButtonText();
}

function updateStatusButtonText() {
  if (!selectedIncident) return;
  
  const statusButton = document.getElementById('status-toggle');
  const currentStatus = selectedIncident.status || 'Open';
  
  switch (currentStatus) {
    case 'Open':
      statusButton.textContent = '▶️ Mark In Progress';
      break;
    case 'In Progress':
      statusButton.textContent = '✅ Mark Resolved';
      break;
    case 'Resolved':
      statusButton.textContent = '🔄 Reopen Case';
      break;
    default:
      statusButton.textContent = '▶️ Mark In Progress';
  }
}

function submitComment() {
  if (!selectedIncident) return;
  
  const comment = commentInput.value.trim();
  if (!comment) {
    showMessage('Please enter a comment', 'error');
    return;
  }
  
  // Add comment to incident
  if (!selectedIncident.adminComments) {
    selectedIncident.adminComments = [];
  }
  
  selectedIncident.adminComments.push({
    id: Date.now(),
    text: comment,
    author: 'Admin',
    date: new Date().toISOString()
  });
  
  // Update last modified
  selectedIncident.lastModified = new Date().toISOString();
  
  // Update localStorage
  localStorage.setItem('incidents', JSON.stringify(incidents));
  
  // Clear input and show success
  commentInput.value = '';
  showMessage('Admin comment added successfully', 'success');
}

function toggleStatus() {
  if (!selectedIncident) return;
  
  const currentStatus = selectedIncident.status || 'Open';
  let newStatus;
  
  switch (currentStatus) {
    case 'Open':
      newStatus = 'In Progress';
      break;
    case 'In Progress':
      newStatus = 'Resolved';
      break;
    case 'Resolved':
      newStatus = 'Open';
      break;
    default:
      newStatus = 'In Progress';
  }
  
  // Update incident status
  selectedIncident.status = newStatus;
  selectedIncident.lastModified = new Date().toISOString();
  
  // Add status change to admin comments for tracking
  if (!selectedIncident.adminComments) {
    selectedIncident.adminComments = [];
  }
  
  selectedIncident.adminComments.push({
    id: Date.now(),
    text: `Status changed from "${currentStatus}" to "${newStatus}"`,
    author: 'System',
    date: new Date().toISOString(),
    isStatusChange: true
  });
  
  // Update localStorage
  localStorage.setItem('incidents', JSON.stringify(incidents));
  
  // Refresh UI
  loadIncidents();
  showIncidentDetail(selectedIncident);
  showMessage(`Status updated to: ${newStatus}`, 'success');
}

function showMessage(text, type) {
  actionMessage.textContent = text;
  actionMessage.className = `message ${type} show`;
  
  setTimeout(() => {
    actionMessage.classList.remove('show');
  }, 3000);
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Today';
  } else if (diffDays === 2) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function formatDateTime(dateString) {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleString();
}

function logout() {
  // Clear all admin sessions
  localStorage.removeItem('currentUser');
  localStorage.removeItem('adminSession');
  sessionStorage.clear();
  
  // Redirect to admin login
  window.location.href = 'admin-auth.html';
}

// Check authentication using your existing system
function checkAuth() {
  const adminSession = localStorage.getItem('adminSession');
  if (!adminSession) {
    window.location.href = 'admin-auth.html';
    return;
  }
  
  try {
    const session = JSON.parse(adminSession);
    if (!session.isAdmin) {
      window.location.href = 'admin-auth.html';
      return;
    }
  } catch (error) {
    window.location.href = 'admin-auth.html';
    return;
  }
}

// Category toggle functionality
document.querySelectorAll('.category-header').forEach(header => {
  header.addEventListener('click', () => {
    const categoryItems = header.nextElementSibling;
    const isExpanded = categoryItems.style.maxHeight && categoryItems.style.maxHeight !== '0px';
    
    if (isExpanded) {
      categoryItems.style.maxHeight = '0px';
      categoryItems.style.overflow = 'hidden';
    } else {
      categoryItems.style.maxHeight = '300px';
      categoryItems.style.overflow = 'auto';
    }
  });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  init();
});
