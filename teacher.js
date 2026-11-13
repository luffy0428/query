/* =============================================
   ACADEMIC QUERY PORTAL - Teacher Dashboard JS
   Features:
   - Live dashboard statistics with animated counters
   - Full query table with multi-column filters
   - Inline status update (dropdown) with persistence
   - Delete individual queries
   - Clear all data
   - Cross-tab sync via storage event
   - Scroll-to-top, hamburger nav
   - Keyboard accessibility
============================================= */

"use strict";

// --- DOM References ---
const teacherQueriesBody    = document.getElementById("teacherQueries");
const totalQueriesEl        = document.getElementById("totalQueries");
const pendingQueriesEl      = document.getElementById("pendingQueries");
const progressQueriesEl     = document.getElementById("progressQueries");
const resolvedQueriesEl     = document.getElementById("resolvedQueries");
const teacherSearch         = document.getElementById("teacherSearch");
const teacherFilterCat      = document.getElementById("teacherFilterCat");
const teacherFilterStatus   = document.getElementById("teacherFilterStatus");
const teacherFilterPriority = document.getElementById("teacherFilterPriority");
const clearAllTeacherBtn    = document.getElementById("clearAllTeacherBtn");
const scrollTopBtn          = document.getElementById("scrollTopBtn");
const hamburgerBtn          = document.getElementById("hamburgerBtn");
const mainNav               = document.getElementById("mainNav");
const tableMsg              = document.getElementById("tableMsg");

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
// Animated Counter
// =============================================
function animateCount(el, target) {
    if (!el) return;
    const duration = 500;
    const start = performance.now();
    function step(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        el.textContent = Math.round(progress * target);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// =============================================
// Update Dashboard Statistics
// =============================================
function updateStatistics(queries) {
    animateCount(totalQueriesEl,    queries.length);
    animateCount(pendingQueriesEl,  queries.filter(q => q.status === "Pending").length);
    animateCount(progressQueriesEl, queries.filter(q => q.status === "In Progress").length);
    animateCount(resolvedQueriesEl, queries.filter(q => q.status === "Resolved").length);
}

// =============================================
// HTML Escape
// =============================================
function escapeHTML(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Priority badge helper
function priorityBadge(priority) {
    return "<span class='query-status priority-badge priority-" + priority + "'>" + escapeHTML(priority) + "</span>";
}

// Status class helper
function getStatusClass(status) {
    if (status === "In Progress") return "status-In-Progress";
    return "status-" + status;
}

// =============================================
// Display Teacher Queries Table
// =============================================
function displayTeacherQueries() {
    const all = getSavedQueries();

    // Apply filters
    const search   = teacherSearch         ? teacherSearch.value.toLowerCase().trim()   : "";
    const catF     = teacherFilterCat      ? teacherFilterCat.value                     : "";
    const statusF  = teacherFilterStatus   ? teacherFilterStatus.value                  : "";
    const prioF    = teacherFilterPriority ? teacherFilterPriority.value                : "";

    const queries = all.filter(function (q) {
        const matchSearch = !search ||
            q.id.toLowerCase().includes(search) ||
            (q.studentName  || "").toLowerCase().includes(search) ||
            (q.studentId    || "").toLowerCase().includes(search) ||
            (q.subject      || "").toLowerCase().includes(search) ||
            (q.description  || "").toLowerCase().includes(search) ||
            (q.email        || "").toLowerCase().includes(search);
        const matchCat   = !catF    || q.category === catF;
        const matchStat  = !statusF || q.status   === statusF;
        const matchPrio  = !prioF   || q.priority === prioF;
        return matchSearch && matchCat && matchStat && matchPrio;
    });

    updateStatistics(all);
    teacherQueriesBody.innerHTML = "";

    if (tableMsg) tableMsg.textContent = "";

    if (queries.length === 0) {
        const row  = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 11;
        cell.style.textAlign = "center";
        cell.style.padding   = "48px";
        cell.style.color     = "var(--text-light)";
        cell.textContent     = all.length === 0
            ? "No student queries have been submitted yet."
            : "No queries match the current filters.";
        row.appendChild(cell);
        teacherQueriesBody.appendChild(row);
        return;
    }

    // Show newest first
    const sorted = [...queries].reverse();

    sorted.forEach(function (query) {
        const row = document.createElement("tr");

        // Cells: ID, Student, Reg No, Course, Category, Priority, Subject, Description, Date
        const textCells = [
            query.id,
            query.studentName || "-",
            query.studentId   || "-",
            query.course      || "-",
            query.category    || "-",
            "",               // priority badge - injected separately
            query.subject     || "-",
            query.description || "-",
            query.submittedAt || "-"
        ];

        textCells.forEach(function (val, idx) {
            const cell = document.createElement("td");
            if (idx === 5) {
                // Priority badge
                cell.innerHTML = priorityBadge(query.priority || "Low");
            } else if (idx === 7) {
                // Description truncated
                cell.style.maxWidth = "220px";
                cell.style.overflow = "hidden";
                cell.title = val;
                const short = val.length > 80 ? val.substring(0, 80) + "..." : val;
                cell.textContent = short;
            } else {
                cell.textContent = val;
            }
            row.appendChild(cell);
        });

        // Status dropdown cell
        const statusCell   = document.createElement("td");
        const statusSelect = document.createElement("select");
        statusSelect.setAttribute("aria-label", "Update status for query " + query.id);

        ["Pending", "In Progress", "Resolved"].forEach(function (status) {
            const option     = document.createElement("option");
            option.value     = status;
            option.textContent = status;
            if (query.status === status) option.selected = true;
            statusSelect.appendChild(option);
        });

        statusSelect.addEventListener("change", function () {
            const all = getSavedQueries();
            const found = all.find(q => q.id === query.id);
            if (found) {
                found.status = statusSelect.value;
                saveQueries(all);
                displayTeacherQueries();
            }
        });
        statusCell.appendChild(statusSelect);
        row.appendChild(statusCell);

        // Delete button cell
        const actionCell = document.createElement("td");
        const delBtn     = document.createElement("button");
        delBtn.className = "delete-btn";
        delBtn.textContent = "&#128465;";
        delBtn.innerHTML = "&#128465;";
        delBtn.setAttribute("aria-label", "Delete query " + query.id);
        delBtn.title = "Delete this query";
        delBtn.addEventListener("click", function () {
            if (confirm("Delete query " + query.id + "? This cannot be undone.")) {
                const all = getSavedQueries();
                const updated = all.filter(q => q.id !== query.id);
                saveQueries(updated);
                displayTeacherQueries();
            }
        });
        actionCell.appendChild(delBtn);
        row.appendChild(actionCell);

        teacherQueriesBody.appendChild(row);
    });
}

// =============================================
// Filter Event Listeners
// =============================================
if (teacherSearch)         teacherSearch.addEventListener("input",   displayTeacherQueries);
if (teacherFilterCat)      teacherFilterCat.addEventListener("change",      displayTeacherQueries);
if (teacherFilterStatus)   teacherFilterStatus.addEventListener("change",   displayTeacherQueries);
if (teacherFilterPriority) teacherFilterPriority.addEventListener("change", displayTeacherQueries);

// =============================================
// Clear All Data
// =============================================
if (clearAllTeacherBtn) {
    clearAllTeacherBtn.addEventListener("click", function () {
        if (confirm("Are you sure you want to delete ALL queries from ALL students? This cannot be undone.")) {
            saveQueries([]);
            displayTeacherQueries();
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
    mainNav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            mainNav.classList.remove("open");
            hamburgerBtn.classList.remove("open");
            hamburgerBtn.setAttribute("aria-expanded", "false");
        });
    });
}

// =============================================
// Scroll-to-top
// =============================================
if (scrollTopBtn) {
    window.addEventListener("scroll", function () {
        scrollTopBtn.classList.toggle("visible", window.scrollY > 300);
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
        displayTeacherQueries();
    }
});

// =============================================
// Init
// =============================================
displayTeacherQueries();
