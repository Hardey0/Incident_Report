
// ==================== Local Storage Helpers ====================

function getLocalIncidents() {
  return JSON.parse(localStorage.getItem("incidents")) || [];
}

function saveLocalIncidents(incidents) {
  localStorage.setItem("incidents", JSON.stringify(incidents));
}

// ==================== DOM Elements ====================

const logoutBtn = document.getElementById('logout-btn');
const incidentForm = document.getElementById('incident-form');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const severityInput = document.getElementById('severity');
const datetimeInput = document.getElementById('datetime');
const photoInput = document.getElementById('photo');
const formMessage = document.getElementById('form-message');
const incidentsList = document.getElementById('incidents-list');

const detailModal = document.getElementById('detail-modal');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalSeverity = document.getElementById('modal-severity');
const modalStatus = document.getElementById('modal-status');
const modalDate = document.getElementById('modal-date');
const modalPhoto = document.getElementById('modal-photo');
const modalMessage = document.getElementById('modal-message');
const editBtn = document.getElementById('edit-btn');
const deleteBtn = document.getElementById('delete-btn');
const loader = document.getElementById('loader');

let currentIncidentId = null;
let editingIncidentId = null; // track if we are editing

// ==================== Loader ====================

function showLoader() {
  loader.style.display = 'block';
  loader.setAttribute('aria-hidden', 'false');
}

function hideLoader() {
  loader.style.display = 'none';
  loader.setAttribute('aria-hidden', 'true');
}

// ==================== Logout (local only) ====================

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    console.log("Logout clicked (local mode)");
    window.location.href = 'index.html';
  });
}

// ==================== Submit Incident ====================

incidentForm.addEventListener('submit', e => {
  e.preventDefault();
  formMessage.textContent = '';

  if (!titleInput.value.trim() || !descriptionInput.value.trim() || !severityInput.value || !datetimeInput.value) {
    formMessage.style.color = '#ff6b6b';
    formMessage.textContent = 'Please fill in all required fields.';
    return;
  }

  showLoader();
  formMessage.style.color = '#f0f0f0';
  formMessage.textContent = editingIncidentId ? 'Updating incident...' : 'Submitting incident...';

  // Handle photo upload as Base64
  if (photoInput.files.length > 0) {
    const file = photoInput.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
      const photoURL = event.target.result;
      saveIncident(photoURL);
    };
    reader.readAsDataURL(file);
  } else {
    // keep existing photo when editing
    let existingPhoto = '';
    if (editingIncidentId) {
      const incidents = getLocalIncidents();
      const inc = incidents.find(i => i.id === editingIncidentId);
      if (inc) existingPhoto = inc.photoURL;
    }
    saveIncident(existingPhoto);
  }
});

function saveIncident(photoURL) {
  let incidents = getLocalIncidents();

  if (editingIncidentId) {
    // Update existing incident
    incidents = incidents.map(incident => {
      if (incident.id === editingIncidentId) {
        return {
          ...incident,
          title: titleInput.value.trim(),
          description: descriptionInput.value.trim(),
          severity: severityInput.value,
          date: new Date(datetimeInput.value).toISOString(),
          photoURL,
          updatedAt: new Date().toISOString()
        };
      }
      return incident;
    });
    saveLocalIncidents(incidents);
    formMessage.style.color = '#27ae60';
    formMessage.textContent = 'Incident updated successfully!';
    editingIncidentId = null;
  } else {
    // New incident
    const incidentData = {
      id: Date.now().toString(),
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      severity: severityInput.value,
      date: new Date(datetimeInput.value).toISOString(),
      photoURL,
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    incidents.unshift(incidentData);
    saveLocalIncidents(incidents);
    formMessage.style.color = '#27ae60';
    formMessage.textContent = 'Incident submitted successfully!';
  }

  incidentForm.reset();
  loadUserIncidents();
  hideLoader();
}

// ==================== Load Incidents ====================

function loadUserIncidents() {
  incidentsList.innerHTML = '<p style="text-align:center; margin-top:20px; color:#ddd;">Loading incidents...</p>';
  showLoader();

  const incidents = getLocalIncidents();
  if (incidents.length === 0) {
    incidentsList.innerHTML = '<p style="color:#ddd; text-align:center; margin-top:20px;">No incidents submitted yet.</p>';
    hideLoader();
    return;
  }

  incidentsList.innerHTML = '';
  incidents.forEach(incident => {
    const card = document.createElement('article');
    card.className = 'incident-card';
    card.setAttribute('tabindex', 0);
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open details for incident: ${incident.title}`);

    const title = document.createElement('h3');
    title.className = 'incident-title';
    title.textContent = incident.title;

    const desc = document.createElement('p');
    desc.className = 'incident-description';
    desc.textContent = incident.description;

    const meta = document.createElement('div');
    meta.className = 'incident-meta';

    const severityBadge = document.createElement('span');
    severityBadge.className = 'badge severity-' + incident.severity.toLowerCase();
    severityBadge.textContent = incident.severity;

    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge status-' + incident.status.toLowerCase().replace(' ', '');
    statusBadge.textContent = incident.status;

    const dateSpan = document.createElement('span');
    dateSpan.textContent = new Date(incident.date).toLocaleString();

    meta.appendChild(severityBadge);
    meta.appendChild(statusBadge);
    meta.appendChild(dateSpan);

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(meta);

    card.addEventListener('click', () => openDetailModal(incident.id, incident));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetailModal(incident.id, incident);
      }
    });

    incidentsList.appendChild(card);
  });

  hideLoader();
}

// ==================== Modal ====================

function openDetailModal(id, incident) {
  currentIncidentId = id;
  modalTitle.innerHTML = `<strong>TITLE:</strong> <span class="modal-text-box">${incident.title}</span>`;
  modalDescription.innerHTML = `<strong>DESC:</strong> <span class="modal-text-box">${incident.description}</span>`;
  modalSeverity.textContent = incident.severity;
  modalStatus.textContent = incident.status;
  modalDate.textContent = new Date(incident.date).toLocaleString();
  modalPhoto.src = incident.photoURL || '';
  modalPhoto.style.display = incident.photoURL ? 'block' : 'none';
  modalMessage.textContent = '';
  detailModal.classList.add('active');
  modalClose.focus();
}

modalClose.addEventListener('click', () => detailModal.classList.remove('active'));
detailModal.addEventListener('click', e => {
  if (e.target === detailModal) detailModal.classList.remove('active');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') detailModal.classList.remove('active');
});

// ==================== Edit & Delete ====================

editBtn.addEventListener('click', () => {
  if (!currentIncidentId) return;
  const incidents = getLocalIncidents();
  const incident = incidents.find(i => i.id === currentIncidentId);
  if (!incident) return;

  // Fill form with existing data
  titleInput.value = incident.title;
  descriptionInput.value = incident.description;
  severityInput.value = incident.severity;
  datetimeInput.value = incident.date ? new Date(incident.date).toISOString().slice(0,16) : '';

  editingIncidentId = currentIncidentId;

  modalMessage.style.color = '#27ae60';
  modalMessage.textContent = 'Loaded incident into form for editing.';
  detailModal.classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

deleteBtn.addEventListener('click', () => {
  if (!currentIncidentId) return;
  if (confirm('Are you sure you want to delete this incident?')) {
    let incidents = getLocalIncidents();
    incidents = incidents.filter(inc => inc.id !== currentIncidentId);
    saveLocalIncidents(incidents);
    modalMessage.style.color = '#27ae60';
    modalMessage.textContent = 'Incident deleted.';
    loadUserIncidents();
    setTimeout(() => detailModal.classList.remove('active'), 1000);
  }
});

// ==================== Init ====================

document.addEventListener("DOMContentLoaded", loadUserIncidents);

