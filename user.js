// ==================== Local Storage Helpers ====================

function getLocalIncidents() {
  const data = localStorage.getItem("incidents");
  return data ? JSON.parse(data) : [];
}

function saveLocalIncidents(incidents) {
  localStorage.setItem("incidents", JSON.stringify(incidents));
}

// ==================== DOM Elements ====================

const logoutBtn = document.getElementById("logout-btn");
const incidentForm = document.getElementById("incident-form");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const severityInput = document.getElementById("severity");
const datetimeInput = document.getElementById("datetime");
const photoInput = document.getElementById("photo");
const formMessage = document.getElementById("form-message");
const incidentsList = document.getElementById("incidents-list");

const detailModal = document.getElementById("detail-modal");
const modalClose = document.getElementById("modal-close");
const modalTitle = document.getElementById("modal-title");
const modalDescription = document.getElementById("modal-description");
const modalSeverity = document.getElementById("modal-severity");
const modalStatus = document.getElementById("modal-status");
const modalDate = document.getElementById("modal-date");
const modalPhoto = document.getElementById("modal-photo");
const modalMessage = document.getElementById("modal-message");
const editBtn = document.getElementById("edit-btn");
const deleteBtn = document.getElementById("delete-btn");
const loader = document.getElementById("loader");

let currentIncidentId = null;
let editingIncidentId = null;
let touchStartY = 0;
let touchEndY = 0;

// ==================== Mobile Touch Helpers ====================

function isMobileDevice() {
  return window.innerWidth <= 768 || "ontouchstart" in window;
}

function addMobileOptimizations() {
  // Prevent zoom on input focus for iOS
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    const inputs = document.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        input.style.fontSize = "16px"; // Prevent zoom
      });
      input.addEventListener("blur", () => {
        input.style.fontSize = ""; // Reset
      });
    });
  }

  // Add touch feedback for cards
  if (isMobileDevice()) {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
  }
}

function handleTouchStart(e) {
  if (e.target.closest(".incident-card")) {
    touchStartY = e.touches[0].clientY;
    e.target.closest(".incident-card").style.transform = "scale(0.98)";
  }
}

function handleTouchEnd(e) {
  if (e.target.closest(".incident-card")) {
    touchEndY = e.changedTouches[0].clientY;
    const card = e.target.closest(".incident-card");
    card.style.transform = "";

    if (Math.abs(touchStartY - touchEndY) < 10) {
      card.click();
    }
  }
}

// ==================== Loader ====================

function showLoader() {
  loader.style.display = "block";
  loader.setAttribute("aria-hidden", "false");
  if (isMobileDevice()) {
    document.body.style.overflow = "hidden";
  }
}

function hideLoader() {
  loader.style.display = "none";
  loader.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// ==================== Messages ====================

function showFormMessage(message, type = "success", duration = 3000) {
  formMessage.style.color = type === "success" ? "#27ae60" : "#e74c3c";
  formMessage.textContent = message;
  formMessage.style.padding = "10px";
  formMessage.style.borderRadius = "8px";
  formMessage.style.background =
    type === "success" ? "rgba(46, 204, 113, 0.1)" : "rgba(231, 76, 60, 0.1)";
  formMessage.style.border = `1px solid ${
    type === "success" ? "#27ae60" : "#e74c3c"
  }`;

  setTimeout(() => {
    formMessage.textContent = "";
    formMessage.style.background = "";
    formMessage.style.border = "";
    formMessage.style.padding = "";
  }, duration);
}

function showModalMessage(message, type = "success") {
  modalMessage.style.color = type === "success" ? "#27ae60" : "#e74c3c";
  modalMessage.textContent = message;
  modalMessage.style.padding = "8px";
  modalMessage.style.borderRadius = "6px";
  modalMessage.style.background =
    type === "success" ? "rgba(46, 204, 113, 0.1)" : "rgba(231, 76, 60, 0.1)";
}

// ==================== Logout ====================


if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("currentUser");  // 👈 clear session
      window.location.href = "index.html";
    }
  });
}


// ==================== Form Validation ====================

function validateForm() {
  const errors = [];

  if (!titleInput.value.trim()) {
    errors.push("Title is required");
    titleInput.style.borderColor = "#e74c3c";
  } else {
    titleInput.style.borderColor = "";
  }

  if (!descriptionInput.value.trim()) {
    errors.push("Description is required");
    descriptionInput.style.borderColor = "#e74c3c";
  } else {
    descriptionInput.style.borderColor = "";
  }

  if (!severityInput.value) {
    errors.push("Severity is required");
    severityInput.style.borderColor = "#e74c3c";
  } else {
    severityInput.style.borderColor = "";
  }

  if (!datetimeInput.value) {
    errors.push("Date & Time is required");
    datetimeInput.style.borderColor = "#e74c3c";
  } else {
    datetimeInput.style.borderColor = "";
  }

  return errors;
}

// ==================== Submit Incident ====================

incidentForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const errors = validateForm();
  if (errors.length > 0) {
    showFormMessage(errors[0], "error");
    return;
  }

  showLoader();
  showFormMessage(
    editingIncidentId ? "Updating incident..." : "Submitting incident...",
    "success"
  );

  setTimeout(() => {
    if (photoInput.files.length > 0) {
      const file = photoInput.files[0];
      if (file.size > 5 * 1024 * 1024) {
        hideLoader();
        showFormMessage("Photo must be less than 5MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = function (event) {
        saveIncident(event.target.result);
      };
      reader.onerror = function () {
        hideLoader();
        showFormMessage("Error reading photo file", "error");
      };
      reader.readAsDataURL(file);
    } else {
      let existingPhoto = "";
      if (editingIncidentId) {
        const incidents = getLocalIncidents();
        const inc = incidents.find((i) => i.id === editingIncidentId);
        if (inc) existingPhoto = inc.photoURL || "";
      }
      saveIncident(existingPhoto);
    }
  }, 500);
});

function saveIncident(photoURL) {
  try {
    let incidents = getLocalIncidents();

    if (editingIncidentId) {
      incidents = incidents.map((incident) => {
        if (incident.id === editingIncidentId) {
          return {
            ...incident,
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            severity: severityInput.value,
            date: new Date(datetimeInput.value).toISOString(),
            photoURL: photoURL || incident.photoURL,
            updatedAt: new Date().toISOString(),
          };
        }
        return incident;
      });
      saveLocalIncidents(incidents);
      showFormMessage("Incident updated successfully!", "success");
      editingIncidentId = null;
    } else {
      const incidentData = {
        id: Date.now().toString(),
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        severity: severityInput.value,
        date: new Date(datetimeInput.value).toISOString(),
        photoURL: photoURL || "",
        status: "Open",
        createdAt: new Date().toISOString(),
      };
      incidents.unshift(incidentData);
      saveLocalIncidents(incidents);
      showFormMessage("Incident submitted successfully!", "success");
    }

    incidentForm.reset();
    loadUserIncidents();
  } catch (error) {
    showFormMessage("Error saving incident. Please try again.", "error");
    console.error("Save error:", error);
  } finally {
    hideLoader();
  }
}

// ==================== Load Incidents ====================

function loadUserIncidents() {
  const incidents = getLocalIncidents();

  if (incidents.length === 0) {
    incidentsList.innerHTML = `
      <div style="text-align:center; margin-top:40px; color:#ddd; padding:20px;">
        <p style="font-size:1.2em; margin-bottom:10px;">📝 No incidents yet</p>
        <p style="opacity:0.7;">Submit your first incident using the form above</p>
      </div>
    `;
    return;
  }

  incidentsList.innerHTML = "";

  incidents.forEach((incident, index) => {
    const card = document.createElement("article");
    card.className = "incident-card";
    card.setAttribute("tabindex", 0);
    card.setAttribute("role", "button");
    card.setAttribute(
      "aria-label",
      `Open details for incident: ${incident.title}`
    );
    card.style.animationDelay = `${index * 0.1}s`;

    const title = document.createElement("h3");
    title.className = "incident-title";
    title.textContent = incident.title;

    const desc = document.createElement("p");
    desc.className = "incident-description";
    desc.textContent = incident.description;

    const meta = document.createElement("div");
    meta.className = "incident-meta";

    const leftMeta = document.createElement("div");
    leftMeta.style.display = "flex";
    leftMeta.style.gap = "8px";
    leftMeta.style.flexWrap = "wrap";

    const severityBadge = document.createElement("span");
    severityBadge.className = "badge severity-" + incident.severity.toLowerCase();
    severityBadge.textContent = incident.severity;

    const statusBadge = document.createElement("span");
    statusBadge.className =
      "badge status-" + incident.status.toLowerCase().replace(" ", "");
    statusBadge.textContent = incident.status;

    leftMeta.appendChild(severityBadge);
    leftMeta.appendChild(statusBadge);

    const dateSpan = document.createElement("span");
    dateSpan.textContent = new Date(incident.date).toLocaleDateString();
    dateSpan.style.fontSize = "clamp(0.75rem, 2.5vw, 0.85rem)";
    dateSpan.style.opacity = "0.8";

    meta.appendChild(leftMeta);
    meta.appendChild(dateSpan);

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(meta);

    card.addEventListener("click", () => openDetailModal(incident.id, incident));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetailModal(incident.id, incident);
      }
    });

    incidentsList.appendChild(card);
  });
}

// ==================== Modal ====================

function openDetailModal(id, incident) {
  currentIncidentId = id;

  modalTitle.innerHTML = `<strong>TITLE:</strong> <span class="modal-text-box">${incident.title}</span>`;
  modalDescription.innerHTML = `<strong>DESC:</strong> <span class="modal-text-box">${incident.description}</span>`;
  modalSeverity.textContent = incident.severity;
  modalStatus.textContent = incident.status;
  modalDate.textContent = new Date(incident.date).toLocaleString();
  modalPhoto.src = incident.photoURL || "";
  modalPhoto.style.display = incident.photoURL ? "block" : "none";
  modalMessage.textContent = "";

  detailModal.classList.add("active");

  setTimeout(() => {
    modalClose.focus();
  }, 100);

  if (isMobileDevice()) {
    document.body.style.overflow = "hidden";
  }
}

function closeModal() {
  detailModal.classList.remove("active");
  document.body.style.overflow = "";
  modalMessage.textContent = "";
  modalMessage.style.background = "";
}

modalClose.addEventListener("click", closeModal);
detailModal.addEventListener("click", (e) => {
  if (e.target === detailModal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && detailModal.classList.contains("active")) {
    closeModal();
  }
});

// ==================== Edit & Delete ====================

editBtn.addEventListener("click", () => {
  if (!currentIncidentId) return;

  const incidents = getLocalIncidents();
  const incident = incidents.find((i) => i.id === currentIncidentId);
  if (!incident) return;

  titleInput.value = incident.title;
  descriptionInput.value = incident.description;
  severityInput.value = incident.severity;
  datetimeInput.value = incident.date
    ? new Date(incident.date).toISOString().slice(0, 16)
    : "";

  editingIncidentId = currentIncidentId;

  showModalMessage("Loaded incident into form for editing.", "success");

  setTimeout(() => {
    closeModal();
    document.querySelector(".form-container").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setTimeout(() => titleInput.focus(), 500);
  }, 1000);
});

deleteBtn.addEventListener("click", () => {
  if (!currentIncidentId) return;

  if (confirm("Are you sure you want to delete this incident?")) {
    let incidents = getLocalIncidents();
    incidents = incidents.filter((inc) => inc.id !== currentIncidentId);
    saveLocalIncidents(incidents);

    showModalMessage("Incident deleted successfully!", "success");
    loadUserIncidents();

    setTimeout(() => {
      closeModal();
    }, 1500);
  }
});

// ==================== Init ====================

document.addEventListener("DOMContentLoaded", () => {
  addMobileOptimizations();
  loadUserIncidents();

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  datetimeInput.value = now.toISOString().slice(0, 16);

  console.log("Dashboard loaded successfully (localStorage mode)");
});
