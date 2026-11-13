/* =============================================
   ACADEMIC QUERY PORTAL - Student Portal JS
   Features:
   - Form validation with inline field errors
   - localStorage persistence
   - Query display with search, filter
   - Animated hero stats
   - Scroll-to-top button
   - Hamburger navigation
   - Cross-tab sync via storage event
   - Query character counter
============================================= */

"use strict";

// --- DOM References ---
const queryForm       = document.getElementById("queryForm");
const submitBtn       = document.getElementById("submitBtn");
const successBanner   = document.getElementById("successBanner");
const successMessage  = document.getElementById("successMessage");
const queriesContainer= document.getElementById("queriesContainer");
const searchInput     = document.getElementById("searchInput");
const filterCategory  = document.getElementById("filterCategory");
const filterStatus    = document.getElementById("filterStatus");
const clearQueriesBtn = document.getElementById("clearQueriesBtn");
const scrollTopBtn    = document.getElementById("scrollTopBtn");
const hamburgerBtn    = document.getElementById("hamburgerBtn");
const mainNav         = document.getElementById("mainNav");
const charCountEl     = document.getElementById("charCount");
const descTextarea    = document.getElementById("query-description");

// Hero stat elements
const heroTotal    = document.getElementById("heroTotal");
const heroResolved = document.getElementById("heroResolved");
const heroPending  = document.getElementById("heroPending");

// =============================================
// Local Storage Helpers
// =============================================
function getSavedQueries() {
    try {
        return JSON.parse(localStorage.getItem("academicQueries")) || [];
    } catch (e) {
        return [];
    }
}

function saveQueries(queries) {
    localStorage.setItem("academicQueries", JSON.stringify(queries));
}

// =============================================
// Hero Stats (animated counter)
// =============================================
function animateCount(el, target) {
    const duration = 600;
    const start = performance.now();
    function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        el.textContent = Math.round(progress * target);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function updateHeroStats() {
    const queries = getSavedQueries();
    animateCount(heroTotal,    queries.length);
    animateCount(heroResolved, queries.filter(q => q.status === "Resolved").length);
    animateCount(heroPending,  queries.filter(q => q.status === "Pending").length);
}

// =============================================
// Character Counter
// =============================================
if (descTextarea && charCountEl) {
    descTextarea.addEventListener("input", function () {
        const len = this.value.length;
        charCountEl.textContent = len;
        charCountEl.style.color = len > 950 ? "#dc2626" : "";
        if (len > 1000) this.value = this.value.substring(0, 1000);
    });
}

// =============================================
// Form Validation
// =============================================
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field) field.classList.add("invalid");
    if (error) error.textContent = message;
    return false;
}

function clearError(fieldId, errorId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field) field.classList.remove("invalid");
    if (error) error.textContent = "";
}

function clearAllErrors() {
    const fields  = ["student-name","student-id","student-email","student-course","query-category","query-priority","query-subject","query-description"];
    const errors  = ["err-name","err-id","err-email","err-course","err-category","err-priority","err-subject","err-desc"];
    fields.forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove("invalid"); });
    errors.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ""; });
}

function validateForm() {
    clearAllErrors();
    let valid = true;
    const name    = document.getElementById("student-name").value.trim();
    const regNo   = document.getElementById("student-id").value.trim();
    const email   = document.getElementById("student-email").value.trim();
    const course  = document.getElementById("student-course").value.trim();
    const cat     = document.getElementById("query-category").value;
    const prio    = document.getElementById("query-priority").value;
    const subject = document.getElementById("query-subject").value.trim();
    const desc    = document.getElementById("query-description").value.trim();

    if (!name)                           { showError("student-name",  "err-name",    "Full name is required."); valid = false; }
    if (!regNo)                          { showError("student-id",    "err-id",      "Registration number is required."); valid = false; }
    if (!email)                          { showError("student-email", "err-email",   "Email address is required."); valid = false; }
    else if (!emailPattern.test(email))  { showError("student-email", "err-email",   "Enter a valid email (e.g. you@lpu.in)."); valid = false; }
    if (!course)                         { showError("student-course","err-course",  "Course is required."); valid = false; }
    if (!cat)                            { showError("query-category","err-category","Please select a category."); valid = false; }
    if (!prio)                           { showError("query-priority","err-priority","Please select a priority."); valid = false; }
    if (!subject)                        { showError("query-subject", "err-subject", "Query subject/title is required."); valid = false; }
    if (!desc)                           { showError("query-description","err-desc", "Please describe your query."); valid = false; }
    else if (desc.length < 20)           { showError("query-description","err-desc", "Description must be at least 20 characters."); valid = false; }

    return valid;
}

// Live clear errors on input
["student-name","student-id","student-email","student-course","query-category","query-priority","query-subject","query-description"].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener("input",  function() { clearError(id, "err-" + id.split("-").slice(-1)[0].replace("description","desc").replace("category","category").replace("priority","priority").replace("course","course").replace("email","email").replace("name","name").replace("id","id").replace("subject","subject")); });
        el.addEventListener("change", function() { el.classList.remove("invalid"); });
    }
});

// =============================================
// Form Submission
// =============================================
if (queryForm) {
    queryForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!validateForm()) {
            // Scroll to first error
            const firstInvalid = queryForm.querySelector(".invalid");
            if (firstInvalid) firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        const query = {
            id:          "Q" + Date.now(),
            studentName: document.getElementById("student-name").value.trim(),
            studentId:   document.getElementById("student-id").value.trim(),
            email:       document.getElementById("student-email").value.trim(),
            course:      document.getElementById("student-course").value.trim(),
            category:    document.getElementById("query-category").value,
            priority:    document.getElementById("query-priority").value,
            subject:     document.getElementById("query-subject").value.trim(),
            description: document.getElementById("query-description").value.trim(),
            status:      "Pending",
            submittedAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        };

        const queries = getSavedQueries();
        queries.push(query);
        saveQueries(queries);

        // Show success banner
        successMessage.textContent =
            "Thank you, " + query.studentName + "! Your query has been submitted. Query ID: " + query.id;
        successBanner.classList.remove("hidden");
        successBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });

        queryForm.reset();
        if (charCountEl) charCountEl.textContent = "0";
        clearAllErrors();

        displayQueries();
        updateHeroStats();

        // Auto-hide success banner
        setTimeout(function() {
            successBanner.classList.add("hidden");
        }, 7000);
    });
}

// =============================================
// Display Queries (with search/filter)
// =============================================
function getStatusClass(status) {
    if (status === "In Progress") return "status-In-Progress";
    return "status-" + status;
}

function displayQueries() {
    if (!queriesContainer) return;

    const queries   = getSavedQueries();
    const search    = searchInput    ? searchInput.value.toLowerCase().trim()   : "";
    const catFilter = filterCategory ? filterCategory.value                     : "";
    const stFilter  = filterStatus   ? filterStatus.value                       : "";

    let filtered = queries.filter(function (q) {
        const matchSearch = !search ||
            q.id.toLowerCase().includes(search) ||
            q.subject.toLowerCase().includes(search) ||
            q.description.toLowerCase().includes(search) ||
            q.category.toLowerCase().includes(search) ||
            q.studentName.toLowerCase().includes(search);
        const matchCat = !catFilter || q.category === catFilter;
        const matchSt  = !stFilter  || q.status === stFilter;
        return matchSearch && matchCat && matchSt;
    });

    // Sort: newest first
    filtered.reverse();

    queriesContainer.innerHTML = "";

    if (filtered.length === 0) {
        const msg = document.createElement("div");
        msg.className = "no-queries-msg";
        msg.innerHTML = queries.length === 0
            ? "<span class='no-icon'>&#128203;</span>No queries submitted yet. Use the form above to submit your first query!"
            : "<span class='no-icon'>&#128269;</span>No queries match your search. Try different keywords or clear the filters.";
        queriesContainer.appendChild(msg);
        return;
    }

    filtered.forEach(function (query) {
        const card = document.createElement("div");
        card.className = "query-card priority-" + query.priority;
        card.innerHTML =
            "<div class='card-header'>" +
                "<span class='card-id'>" + query.id + "</span>" +
                "<span class='query-status " + getStatusClass(query.status) + "'>" + query.status + "</span>" +
            "</div>" +
            "<div class='card-subject'>" + escapeHTML(query.subject) + "</div>" +
            "<div class='card-desc'>" + escapeHTML(query.description) + "</div>" +
            "<div class='card-meta'>" +
                "<span class='card-meta-tag'>&#128218; " + escapeHTML(query.category) + "</span>" +
                "<span class='card-meta-tag priority-badge priority-" + query.priority + "'>" + query.priority + " Priority</span>" +
                "<span class='card-meta-tag'>&#128197; " + query.submittedAt + "</span>" +
                "<span class='card-meta-tag'>&#127891; " + escapeHTML(query.studentName) + "</span>" +
            "</div>";
        queriesContainer.appendChild(card);
    });
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// =============================================
// Search & Filter event listeners
// =============================================
if (searchInput)    searchInput.addEventListener("input",  displayQueries);
if (filterCategory) filterCategory.addEventListener("change", displayQueries);
if (filterStatus)   filterStatus.addEventListener("change",   displayQueries);

// =============================================
// Clear All Queries
// =============================================
if (clearQueriesBtn) {
    clearQueriesBtn.addEventListener("click", function () {
        if (confirm("Are you sure you want to delete ALL your submitted queries? This cannot be undone.")) {
            saveQueries([]);
            displayQueries();
            updateHeroStats();
        }
    });
}

// =============================================
// Hamburger / Mobile Nav
// =============================================
if (hamburgerBtn && mainNav) {
    hamburgerBtn.addEventListener("click", function () {
        const isOpen = mainNav.classList.toggle("open");
        hamburgerBtn.classList.toggle("open", isOpen);
        hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
    });
    // Close nav on link click
    mainNav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            mainNav.classList.remove("open");
            hamburgerBtn.classList.remove("open");
            hamburgerBtn.setAttribute("aria-expanded", "false");
        });
    });
}

// =============================================
// Active Nav Link on Scroll
// =============================================
function updateActiveNav() {
    const sections = document.querySelectorAll("section[id]");
    const scrollY  = window.scrollY + 90;
    sections.forEach(function (sec) {
        const link = document.querySelector(".nav-link[href='#" + sec.id + "']");
        if (!link) return;
        const top    = sec.offsetTop;
        const bottom = top + sec.offsetHeight;
        if (scrollY >= top && scrollY < bottom) {
            document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
            link.classList.add("active");
        }
    });
}
window.addEventListener("scroll", updateActiveNav, { passive: true });

// =============================================
// Scroll-to-top button
// =============================================
if (scrollTopBtn) {
    window.addEventListener("scroll", function () {
        scrollTopBtn.classList.toggle("visible", window.scrollY > 400);
    }, { passive: true });
    scrollTopBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// =============================================
// Cross-tab sync
// =============================================
window.addEventListener("storage", function (event) {
    if (event.key === "academicQueries") {
        displayQueries();
        updateHeroStats();
    }
});

// =============================================
// Intersection Observer for fade-in animations
// =============================================
const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add("fade-in");
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll(".feature-card, .step, .stat-card").forEach(function (el) {
    observer.observe(el);
});

// =============================================
// Init
// =============================================
displayQueries();
updateHeroStats();
