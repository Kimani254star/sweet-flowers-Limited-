const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");

function openLogin() { loginModal.style.display = "flex"; }
function closeLogin() { loginModal.style.display = "none"; }
function openRegister() { registerModal.style.display = "flex"; }
function closeRegister() { registerModal.style.display = "none"; }

document.addEventListener("DOMContentLoaded", function () {

    // Highlight the current page in the main nav
    const current = document.body.getAttribute("data-page");
    document.querySelectorAll(".main-nav-link").forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("data-target") === current);
    });

    // Registration
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const name = document.getElementById("regName").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const phone = document.getElementById("regPhone").value.trim();
            const password = document.getElementById("regPassword").value;
            const confirm = document.getElementById("regConfirm").value;

            if (password !== confirm) { alert("Passwords do not match."); return; }
            let users = JSON.parse(localStorage.getItem("sfgUsers")) || [];
            if (users.some(u => u.email === email)) { alert("Email already registered."); return; }

            users.push({ name, email, phone, password });
            localStorage.setItem("sfgUsers", JSON.stringify(users));
            alert("Account created successfully.");
            closeRegister();
            openLogin();
        });
    }

    // Login -> redirects to the correct dashboard PAGE
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim().toLowerCase();
            const password = document.getElementById("loginPassword").value.trim();

            if ((email === "admin@sweetflowergarden.com" || email === "developeracaciabooks@gmail.com") && password === "admin123") {
                sessionStorage.setItem("sfgAdmin", "1");
                window.location.href = "admin-dashboard.html";
                return;
            }

            const users = JSON.parse(localStorage.getItem("sfgUsers")) || [];
            const user = users.find(u => u.email.toLowerCase() === email && u.password === password);
            if (!user) { alert("Invalid email or password."); return; }

            if (user.role === "sales") {
                sessionStorage.setItem("sfgSalesUser", JSON.stringify(user));
                window.location.href = "sales-dashboard.html";
                return;
            }

            localStorage.setItem("loggedInUser", JSON.stringify(user));
            window.location.href = "customer-dashboard.html";
        });
    }

    // Booking form (services/contact page)
    const bookingForm = document.getElementById("bookingForm");
    if (bookingForm) {
        bookingForm.addEventListener("submit", function (e) {
            e.preventDefault();
            let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
            bookings.push({
                customer: document.getElementById("bookingName").value,
                email: document.getElementById("bookingEmail").value,
                phone: document.getElementById("bookingPhone").value,
                service: document.getElementById("bookingService").value,
                date: document.getElementById("bookingDate").value,
                status: "Pending"
            });
            localStorage.setItem("bookings", JSON.stringify(bookings));
            alert("Booking submitted successfully.");
            bookingForm.reset();
        });
    }

    // Quote request form (contact page)
    const quoteForm = document.getElementById("quoteRequestForm");
    if (quoteForm) {
        quoteForm.addEventListener("submit", function (e) {
            e.preventDefault();
            let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
            bookings.push({
                customer: document.getElementById("quoteName").value,
                email: document.getElementById("quoteEmail").value,
                phone: document.getElementById("quotePhone").value,
                service: document.getElementById("quoteService").value + " (Quote Request)",
                date: "As soon as possible",
                status: "Pending"
            });
            localStorage.setItem("bookings", JSON.stringify(bookings));
            alert("Quotation request submitted to operational dashboard database.");
            quoteForm.reset();
        });
    }

    // Guard + load the Admin dashboard page
    if (current === "admin-dashboard") {
        if (sessionStorage.getItem("sfgAdmin") !== "1") {
            window.location.href = "index.html";
            return;
        }
        loadAdminDashboard();
    }

    // Guard + load the Customer dashboard page
    if (current === "customer-dashboard") {
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
        if (!loggedInUser) {
            window.location.href = "index.html";
            return;
        }
        loadCustomerDashboard();
    }

    // Guard + load the Sales dashboard page
    if (current === "sales-dashboard") {
        if (!sessionStorage.getItem("sfgSalesUser")) {
            window.location.href = "index.html";
            return;
        }
        loadSalesDashboard();
    }

    // Admin: create a Sales account
    const salesAccountForm = document.getElementById("salesAccountForm");
    if (salesAccountForm) {
        salesAccountForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const name = document.getElementById("salesName").value.trim();
            const email = document.getElementById("salesEmail").value.trim();
            const phone = document.getElementById("salesPhone").value.trim();
            const password = document.getElementById("salesPassword").value;

            let users = JSON.parse(localStorage.getItem("sfgUsers")) || [];
            if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                alert("That email is already registered.");
                return;
            }
            users.push({ name, email, phone, password, role: "sales" });
            localStorage.setItem("sfgUsers", JSON.stringify(users));
            alert("Sales account created for " + name + ".");
            salesAccountForm.reset();
            loadAdminDashboard();
        });
    }

    // Admin: add a gallery image (file upload, converted to a data URL)
    const galleryForm = document.getElementById("galleryForm");
    if (galleryForm) {
        galleryForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const fileInput = document.getElementById("galleryImageFile");
            const caption = document.getElementById("galleryCaption").value.trim();
            const file = fileInput.files[0];
            if (!file) { alert("Choose an image to upload."); return; }

            const reader = new FileReader();
            reader.onload = function (evt) {
                let gallery = JSON.parse(localStorage.getItem("sfgGallery")) || [];
                gallery.push({ id: Date.now().toString(), src: evt.target.result, caption: caption });
                localStorage.setItem("sfgGallery", JSON.stringify(gallery));
                galleryForm.reset();
                loadAdminDashboard();
            };
            reader.readAsDataURL(file);
        });
    }

    // Customer: edit profile
    const profileEditForm = document.getElementById("profileEditForm");
    if (profileEditForm) {
        profileEditForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem("loggedInUser"));
            if (!user) return;

            const newName = document.getElementById("editName").value.trim();
            const newPhone = document.getElementById("editPhone").value.trim();

            user.name = newName;
            user.phone = newPhone;
            localStorage.setItem("loggedInUser", JSON.stringify(user));

            let users = JSON.parse(localStorage.getItem("sfgUsers")) || [];
            users = users.map(u => u.email.toLowerCase() === user.email.toLowerCase() ? { ...u, name: newName, phone: newPhone } : u);
            localStorage.setItem("sfgUsers", JSON.stringify(users));

            alert("Profile updated.");
            loadCustomerDashboard();
        });
    }

    // Public gallery page: render admin-uploaded images alongside the defaults
    if (current === "gallery") {
        renderPublicGallery();
    }
});

function showCustomerPage(page) {
    document.querySelectorAll(".customer-page").forEach(p => p.style.display = "none");
    document.getElementById(page).style.display = "block";
}

function showAdminPage(page) {
    document.querySelectorAll(".admin-page").forEach(p => p.style.display = "none");
    document.getElementById(page).style.display = "block";
}

function logoutCustomer() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
}

function logoutAdmin() {
    sessionStorage.removeItem("sfgAdmin");
    window.location.href = "index.html";
}

function logoutSales() {
    sessionStorage.removeItem("sfgSalesUser");
    window.location.href = "index.html";
}

function loadCustomerDashboard() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user) return;
    document.getElementById("welcomeName").textContent = user.name;
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;
    document.getElementById("profilePhone").textContent = user.phone;
    if (document.getElementById("editName")) document.getElementById("editName").value = user.name;
    if (document.getElementById("editPhone")) document.getElementById("editPhone").value = user.phone;

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    let myBookings = bookings.filter(b => b.email.toLowerCase() === user.email.toLowerCase());
    let pending = myBookings.filter(b => b.status === "Pending").length;
    let completed = myBookings.filter(b => b.status === "Completed").length;

    document.getElementById("myBookingCount").textContent = myBookings.length;
    document.getElementById("myPendingCount").textContent = pending;
    document.getElementById("myCompletedCount").textContent = completed;

    let html = "";
    myBookings.forEach(b => {
        html += `<tr><td>${b.service}</td><td>${b.date}</td><td><strong>${b.status}</strong></td></tr>`;
    });
    document.getElementById("customerBookingBody").innerHTML = html || "<tr><td colspan='3'>No bookings yet.</td></tr>";
}

function loadAdminDashboard() {
    let users = JSON.parse(localStorage.getItem("sfgUsers")) || [];
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    let gallery = JSON.parse(localStorage.getItem("sfgGallery")) || [];

    let customers = users.filter(u => u.role !== "sales");
    let salesAccounts = users.filter(u => u.role === "sales");

    document.getElementById("customerCount").textContent = customers.length;
    document.getElementById("bookingCount").textContent = bookings.length;
    if (document.getElementById("salesCount")) document.getElementById("salesCount").textContent = salesAccounts.length;
    if (document.getElementById("galleryCount")) document.getElementById("galleryCount").textContent = gallery.length;

    let userHtml = "";
    customers.forEach((u, index) => {
        userHtml += `<tr><td>${index + 1}</td><td>${u.name}</td><td>${u.phone}</td><td>${u.email}</td></tr>`;
    });
    document.getElementById("customerBody").innerHTML = userHtml || "<tr><td colspan='4'>No registered customers yet.</td></tr>";

    let bookingHtml = "";
    bookings.forEach((b, index) => {
        bookingHtml += `<tr>
            <td>${index + 1}</td>
            <td>${b.customer}</td>
            <td>${b.email} <br> <small>${b.phone}</small></td>
            <td>${b.service}</td>
            <td>${b.date}</td>
            <td><span style="color:#E65100; font-weight:bold;">${b.status}</span></td>
        </tr>`;
    });
    document.getElementById("bookingBody").innerHTML = bookingHtml || "<tr><td colspan='6'>No bookings yet.</td></tr>";

    // Sales accounts table (admin-only)
    if (document.getElementById("salesAccountBody")) {
        let salesHtml = "";
        salesAccounts.forEach((u, index) => {
            salesHtml += `<tr>
                <td>${index + 1}</td>
                <td>${u.name}</td>
                <td>${u.phone}</td>
                <td>${u.email}</td>
                <td><button class="toolbar-delete-btn" onclick="deleteSalesAccount('${u.email}')">Remove</button></td>
            </tr>`;
        });
        document.getElementById("salesAccountBody").innerHTML = salesHtml || "<tr><td colspan='5'>No sales accounts yet.</td></tr>";
    }

    // Gallery management grid (admin-only)
    if (document.getElementById("galleryManageGrid")) {
        let galleryHtml = "";
        gallery.forEach((g) => {
            galleryHtml += `<div class="gallery-manage-item">
                <img src="${g.src}" alt="${g.caption || 'Gallery image'}">
                <p>${g.caption || ""}</p>
                <button class="toolbar-delete-btn" onclick="deleteGalleryImage('${g.id}')">Delete</button>
            </div>`;
        });
        document.getElementById("galleryManageGrid").innerHTML = galleryHtml || "<p>No uploaded images yet.</p>";
    }
}

function deleteSalesAccount(email) {
    if (!confirm("Remove this sales account?")) return;
    let users = JSON.parse(localStorage.getItem("sfgUsers")) || [];
    users = users.filter(u => !(u.role === "sales" && u.email === email));
    localStorage.setItem("sfgUsers", JSON.stringify(users));
    loadAdminDashboard();
}

function deleteGalleryImage(id) {
    if (!confirm("Delete this gallery image?")) return;
    let gallery = JSON.parse(localStorage.getItem("sfgGallery")) || [];
    gallery = gallery.filter(g => g.id !== id);
    localStorage.setItem("sfgGallery", JSON.stringify(gallery));
    loadAdminDashboard();
}

function renderPublicGallery() {
    const gallery = JSON.parse(localStorage.getItem("sfgGallery")) || [];
    const grid = document.getElementById("galleryGrid");
    if (!grid || gallery.length === 0) return;
    gallery.forEach(g => {
        const img = document.createElement("img");
        img.src = g.src;
        img.alt = g.caption || "Sweet Flower Garden project photo";
        grid.appendChild(img);
    });
}

function loadSalesDashboard() {
    const salesUser = JSON.parse(sessionStorage.getItem("sfgSalesUser"));
    if (!salesUser) return;
    if (document.getElementById("salesWelcomeName")) document.getElementById("salesWelcomeName").textContent = salesUser.name;

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    let users = JSON.parse(localStorage.getItem("sfgUsers")) || [];
    let customers = users.filter(u => u.role !== "sales");

    if (document.getElementById("salesBookingCount")) document.getElementById("salesBookingCount").textContent = bookings.length;
    if (document.getElementById("salesCustomerCount")) document.getElementById("salesCustomerCount").textContent = customers.length;

    if (document.getElementById("salesBookingBody")) {
        let bookingHtml = "";
        bookings.forEach((b, index) => {
            bookingHtml += `<tr>
                <td>${index + 1}</td>
                <td>${b.customer}</td>
                <td>${b.email} <br> <small>${b.phone}</small></td>
                <td>${b.service}</td>
                <td>${b.date}</td>
                <td><span style="color:#E65100; font-weight:bold;">${b.status}</span></td>
            </tr>`;
        });
        document.getElementById("salesBookingBody").innerHTML = bookingHtml || "<tr><td colspan='6'>No bookings yet.</td></tr>";
    }

    if (document.getElementById("salesCustomerBody")) {
        let userHtml = "";
        customers.forEach((u, index) => {
            userHtml += `<tr><td>${index + 1}</td><td>${u.name}</td><td>${u.phone}</td><td>${u.email}</td></tr>`;
        });
        document.getElementById("salesCustomerBody").innerHTML = userHtml || "<tr><td colspan='4'>No registered customers yet.</td></tr>";
    }
}
