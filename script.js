(() => {
    const firebaseConfig = {
        apiKey: "AIzaSyD9qhbGRUuKne_6UG_FBO7PwRyakqGO0eE",
        authDomain: "warung-sh-cellular.firebaseapp.com",
        projectId: "warung-sh-cellular",
        storageBucket: "warung-sh-cellular.firebasestorage.app",
        messagingSenderId: "361126163338",
        appId: "1:361126163338:web:22eabb207d112d261d0e73",
        measurementId: "G-X3QY8GXKND",
    };
    firebase.initializeApp(firebaseConfig);

    const auth = firebase.auth();
    const db = firebase.firestore();

    // Elements
    const daftarTabBtn = document.getElementById("daftar-tab");
    const adminTabBtn = document.getElementById("admin-tab");
    const btnLogout = document.getElementById("btnLogout");
    const btnOpenSettings = document.getElementById("btnOpenSettings");
    // const btnToggleTheme = document.getElementById("btnToggleTheme");
    const overlayBlur = document.getElementById("overlayBlur");

    const judulDaftarProduk = document.getElementById("judulDaftarProduk");
    const judulAdmin = document.getElementById("judulAdmin");

    // Table bodies
    const tabelDaftarProduk = document.getElementById("tabelDaftarProduk");
    const tabelAdminProduk = document.getElementById("tabelAdminProduk");

    // Admin form elements
    const btnTambah = document.getElementById("btnTambah");
    const formProduk = document.getElementById("formProduk");
    const inputNama = document.getElementById("inputNama");
    const inputHarga = document.getElementById("inputHarga");
    const inputBarcode = document.getElementById("inputBarcode");
    const btnBatal = document.getElementById("btnBatal");

    // Modal login elements
    const modalLoginEl = document.getElementById("modalLogin");
    const modalLogin = new bootstrap.Modal(modalLoginEl, {
        keyboard: false,
    });
    const formLogin = document.getElementById("formLogin");
    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");
    const loginErrorDiv = document.getElementById("loginError");
    const btnCancelLogin = document.getElementById("btnCancelLogin");

    // Scanner elements
    const btnScanBarcode = document.getElementById("btnScanBarcode");
    const btnStopScan = document.getElementById("btnStopScan");
    const readerElement = document.getElementById("reader");
    const scanResultElement = document.getElementById("scanResult");

    // Settings panel inside admin
    const adminSettings = document.getElementById("adminSettings");
    const formSettings = document.getElementById("formSettings");
    const settingTitle = document.getElementById("settingTitle");
    const settingLanguage = document.getElementById("settingLanguage");
    const settingTheme = document.getElementById("settingTheme");

    // Variables
    let modeEdit = false;
    let editId = null;
    let produkCache = [];
    let latestProduk = produkCache;

    let html5QrcodeScanner = null;
    let scanning = false;

    // Language data for i18n translations
    const i18nData = {
        id: {
            product_name: "Nama Produk",
            price_rp: "Harga (Rp)",
            loading_data: "Sedang memuat data...",
            scan_barcode: "Scan Kode Batang",
            stop_scan: "Stop Scan",
            add_new_product: "Tambah Produk Baru",
            please_fill_product_name: "Mohon isi nama produk.",
            please_fill_valid_price: "Mohon isi harga produk yang valid.",
            barcode: "Kode Batang (Barcode)",
            barcode_help:
                "Kode batang ini digunakan untuk pencarian dengan scan.",
            save: "Simpan",
            cancel: "Batal",
            actions: "Aksi",
            email: "Email",
            please_enter_email: "Mohon masukkan email yang valid.",
            password: "Password",
            please_enter_password: "Mohon masukkan password.",
            login: "Login",
            loading_failed: "Tidak dapat memuat data.",
            found_product: "Produk ditemukan",
            product_not_found:
                'Produk dengan kode batang "{code}" tidak ditemukan di database.',
            logout_confirm: "Anda yakin ingin logout?",
            logout_success: "Logout berhasil",
            settings_title: "Judul Halaman Daftar Produk",
            settings_language: "Bahasa",
            settings_theme: "Tema",
            settings_save: "Simpan Pengaturan",
            settings_label: "Pengaturan",
            toggle_theme: "Toggle Dark/Light Theme",
        },
        en: {
            product_name: "Product Name",
            price_rp: "Price (Rp)",
            loading_data: "Loading data...",
            scan_barcode: "Scan Barcode",
            stop_scan: "Stop Scan",
            add_new_product: "Add New Product",
            please_fill_product_name: "Please fill product name.",
            please_fill_valid_price: "Please enter a valid price.",
            barcode: "Barcode",
            barcode_help: "Barcode used for product lookup by scanning.",
            save: "Save",
            cancel: "Cancel",
            actions: "Actions",
            email: "Email",
            please_enter_email: "Please enter a valid email.",
            password: "Password",
            please_enter_password: "Please enter the password.",
            login: "Login",
            loading_failed: "Failed to load data.",
            found_product: "Product Found",
            product_not_found:
                'Product with barcode "{code}" not found in database.',
            logout_confirm: "Are you sure you want to logout?",
            logout_success: "Logout successful",
            settings_title: "Product List Page Title",
            settings_language: "Language",
            settings_theme: "Theme",
            settings_save: "Save Settings",
            settings_label: "Settings",
            toggle_theme: "Toggle Dark/Light Theme",
        },
    };

    // Current app state for language and theme
    let currentLanguage = localStorage.getItem("ws_language") || "id";
    let currentTheme = localStorage.getItem("ws_theme") || "light";
    let customTitle = localStorage.getItem("ws_customTitle") || "";

    // ======== Utility functions ========
    function translatePage(lang) {
        currentLanguage = lang;
        localStorage.setItem("ws_language", lang);
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            const text = i18nData[lang][key];
            if (text) {
                if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                    el.placeholder = text;
                } else {
                    el.textContent = text;
                }
            }
        });
        // Update placeholders in some elements that don't use data-i18n attributes for placeholder
        inputNama.placeholder =
            lang === "id" ? "Masukkan nama produk" : "Enter product name";
        inputHarga.placeholder =
            lang === "id" ? "Masukkan harga produk" : "Enter product price";
        inputBarcode.placeholder =
            lang === "id"
                ? "Masukkan kode batang atau scan"
                : "Enter barcode or scan";
        loginEmail.placeholder =
            lang === "id" ? "Masukkan email" : "Enter email";
        loginPassword.placeholder =
            lang === "id" ? "Masukkan password" : "Enter password";

        // Update modal login title and buttons
        const modalLoginLabel = document.getElementById("modalLoginLabel");
        if (modalLoginLabel)
            modalLoginLabel.textContent =
                lang === "id" ? "Login Admin" : "Admin Login";

        // Update buttons with fixed text
        btnTambah.textContent =
            lang === "id" ? "Tambah Produk Baru" : "Add New Product";
        btnScanBarcode.textContent =
            lang === "id" ? "Scan Kode Batang" : "Scan Barcode";
        btnStopScan.textContent = lang === "id" ? "Stop Scan" : "Stop Scan";

        // Settings form labels
        const settingLabels =
            adminSettings.querySelectorAll("label, h3, button");
        settingLabels.forEach((lbl) => {
            if (lbl.tagName === "H3") {
                lbl.textContent = lang === "id" ? "Pengaturan" : "Settings";
            } else if (lbl.tagName === "LABEL") {
                if (lbl.htmlFor === "settingTitle") {
                    lbl.textContent =
                        lang === "id"
                            ? "Judul Halaman Daftar Produk"
                            : "Product List Page Title";
                } else if (lbl.htmlFor === "settingLanguage") {
                    lbl.textContent = lang === "id" ? "Bahasa" : "Language";
                } else if (lbl.htmlFor === "settingTheme") {
                    lbl.textContent = lang === "id" ? "Tema" : "Theme";
                }
            } else if (lbl.tagName === "BUTTON") {
                lbl.textContent =
                    lang === "id" ? "Simpan Pengaturan" : "Save Settings";
            }
        });

        // Update table headers manually since we used data-i18n attribute there:
        document
            .querySelectorAll(
                "#tabelDaftarProduk thead th, #tabelAdminProduk thead th"
            )
            .forEach((th) => {
                const key = th.getAttribute("data-i18n");
                if (key && i18nData[lang][key]) {
                    th.textContent = i18nData[lang][key];
                }
            });

        // Update table content messages if empty or loading:
        if (tabelDaftarProduk.children.length === 0) {
            tabelDaftarProduk.innerHTML = `<tr><td colspan="2" class="text-center fst-italic">${i18nData[lang].loading_data}</td></tr>`;
        }
        if (tabelAdminProduk.children.length === 0) {
            tabelAdminProduk.innerHTML = `<tr><td colspan="3" class="text-center fst-italic">${i18nData[lang].loading_data}</td></tr>`;
        }
    }
    // function applyTheme(theme) {
    //   currentTheme = theme;
    //   if (theme === "dark") {
    //     document.body.classList.add("dark-theme");
    //   } else {
    //     document.body.classList.remove("dark-theme");
    //   }
    //   localStorage.setItem("ws_theme", theme);
    //   // Update toggle button aria-label/title
    //   btnToggleTheme.setAttribute(
    //     "aria-label",
    //     i18nData[currentLanguage].toggle_theme || "Toggle Dark/Light Theme"
    //   );
    //   btnToggleTheme.title = btnToggleTheme.getAttribute("aria-label");
    // }
    function updateTitle(newTitle) {
        if (newTitle.trim() === "") {
            // reset to default language title
            customTitle = "";
        } else {
            customTitle = newTitle.trim();
        }
        localStorage.setItem("ws_customTitle", customTitle);
        renderTitle();
    }
    function renderTitle() {
        // Use customTitle if set, else default language title
        if (customTitle) {
            judulDaftarProduk.textContent = customTitle;
        } else {
            judulDaftarProduk.textContent =
                currentLanguage === "id"
                    ? "Daftar Harga Warung Sembako"
                    : "Product Price List";
        }
    }

    // ========= Initial setup =========
    // On page load apply language, theme and title from localStorage
    translatePage(currentLanguage);
    // applyTheme(currentTheme);
    renderTitle();

    // ========= Firebase + App Logic =========

    // Firestore + Auth setup
    let unsubscribeProduk = null;

    function mulaiSnapshotListener() {
        if (unsubscribeProduk) unsubscribeProduk();

        unsubscribeProduk = db
            .collection("produk")
            .orderBy("nama")
            .onSnapshot(
                (snapshot) => {
                    const items = [];
                    snapshot.forEach((doc) =>
                        items.push({ id: doc.id, ...doc.data() })
                    );
                    produkCache = items;
                    latestProduk = produkCache;
                    renderDaftarProduk(items);
                    renderAdminProduk(items);
                },
                (error) => {
                    if (auth.currentUser) {
                        Swal.fire(
                            i18nData[currentLanguage].loading_failed,
                            error.message,
                            "error"
                        );
                    }
                    if (unsubscribeProduk) {
                        unsubscribeProduk();
                        unsubscribeProduk = null;
                    }
                    tabelDaftarProduk.innerHTML = `<tr><td colspan="2" class="text-center fst-italic">${i18nData[currentLanguage].loading_failed}</td></tr>`;
                    tabelAdminProduk.innerHTML = `<tr><td colspan="3" class="text-center fst-italic">${i18nData[currentLanguage].loading_failed}</td></tr>`;
                }
            );
    }

    // Render daftar produk di halaman publik
    function renderDaftarProduk(items) {
        if (!items.length) {
            tabelDaftarProduk.innerHTML = `<tr><td colspan="2" class="text-center fst-italic">${i18nData[currentLanguage].loading_failed}</td></tr>`;
            return;
        }
        tabelDaftarProduk.innerHTML = items
            .map(
                (p) =>
                    `<tr>
                  <td>${p.nama} ${p.barcode
                        ? `<small class="text-muted">[${p.barcode}]</small>`
                        : ""
                    }</td>
                  <td>Rp ${p.harga.toLocaleString("id-ID")}</td>
                </tr>`
            )
            .join("");
    }
    // Render produk di admin panel
    function renderAdminProduk(items) {
        if (!items.length) {
            tabelAdminProduk.innerHTML = `<tr><td colspan="3" class="text-center fst-italic">${i18nData[currentLanguage].loading_failed}</td></tr>`;
            return;
        }
        tabelAdminProduk.innerHTML = items
            .map(
                (p) =>
                    `<tr data-id="${p.id}">
                  <td>${p.nama}</td>
                  <td>Rp ${p.harga.toLocaleString("id-ID")}</td>
                  <td>
                    <button class="btn btn-warning btn-sm me-2 btn-edit">Edit</button>
                    <button class="btn btn-danger btn-sm btn-delete">Hapus</button>
                  </td>
                </tr>`
            )
            .join("");
        tabelAdminProduk.querySelectorAll(".btn-edit").forEach((btn) => {
            btn.onclick = () => {
                const tr = btn.closest("tr");
                editId = tr.getAttribute("data-id");
                const produk = produkCache.find((p) => p.id === editId);
                if (!produk) return;
                inputNama.value = produk.nama;
                inputHarga.value = produk.harga;
                inputBarcode.value = produk.barcode || "";
                openForm(true);
            };
        });
        tabelAdminProduk.querySelectorAll(".btn-delete").forEach((btn) => {
            btn.onclick = () => {
                const tr = btn.closest("tr");
                const id = tr.getAttribute("data-id");
                Swal.fire({
                    title: "Yakin ingin menghapus produk ini?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText:
                        currentLanguage === "id" ? "Ya, hapus!" : "Yes, delete!",
                    cancelButtonText: currentLanguage === "id" ? "Batal" : "Cancel",
                }).then((result) => {
                    if (result.isConfirmed) {
                        db.collection("produk")
                            .doc(id)
                            .delete()
                            .then(() => {
                                Swal.fire(
                                    currentLanguage === "id" ? "Terhapus!" : "Deleted!",
                                    currentLanguage === "id"
                                        ? "Produk berhasil dihapus."
                                        : "Product successfully deleted.",
                                    "success"
                                );
                            })
                            .catch((err) => {
                                Swal.fire("Error", err.message, "error");
                            });
                    }
                });
            };
        });
    }

    // Form open/close admin product
    function openForm(edit = false) {
        modeEdit = edit;
        formProduk.classList.remove("d-none");
        btnTambah.disabled = true;
        inputNama.focus();
    }
    function closeForm() {
        formProduk.classList.add("d-none");
        btnTambah.disabled = false;
        modeEdit = false;
        editId = null;
        formProduk.reset();
        formProduk.classList.remove("was-validated");
    }

    btnTambah.onclick = () => openForm(false);
    btnBatal.onclick = () => closeForm();

    formProduk.addEventListener("submit", (e) => {
        e.preventDefault();
        e.stopPropagation();
        formProduk.classList.add("was-validated");
        if (!formProduk.checkValidity()) return;

        const nama = inputNama.value.trim();
        const harga = Number(inputHarga.value);
        const barcode = inputBarcode.value.trim();

        if (nama === "" || isNaN(harga) || harga < 0) {
            Swal.fire(
                "Error",
                currentLanguage === "id"
                    ? "Isi nama dan harga produk dengan benar."
                    : "Please fill in the product name and price correctly.",
                "error"
            );
            return;
        }

        if (modeEdit && editId) {
            db.collection("produk")
                .doc(editId)
                .update({ nama, harga, barcode: barcode || null })
                .then(() => {
                    Swal.fire(
                        currentLanguage === "id" ? "Berhasil" : "Success",
                        currentLanguage === "id"
                            ? "Produk berhasil diperbarui."
                            : "Product successfully updated.",
                        "success"
                    );
                    closeForm();
                })
                .catch((err) => {
                    Swal.fire("Error", err.message, "error");
                });
        } else {
            db.collection("produk")
                .add({ nama, harga, barcode: barcode || null })
                .then(() => {
                    Swal.fire(
                        currentLanguage === "id" ? "Berhasil" : "Success",
                        currentLanguage === "id"
                            ? "Produk berhasil ditambahkan."
                            : "Product successfully added.",
                        "success"
                    );
                    closeForm();
                })
                .catch((err) => {
                    Swal.fire("Error", err.message, "error");
                });
        }
    });

    // Tab management
    const daftarTab = new bootstrap.Tab(daftarTabBtn);
    const adminTab = new bootstrap.Tab(adminTabBtn);

    // Blur activation only on login modal
    adminTabBtn.addEventListener("click", (e) => {
        if (!auth.currentUser) {
            e.preventDefault();
            modalLogin.show();
            aktifkanBlur();
        }
    });

    // Login modal handlers
    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        e.stopPropagation();
        formLogin.classList.add("was-validated");
        loginErrorDiv.textContent = "";

        if (!formLogin.checkValidity()) return;

        auth
            .signInWithEmailAndPassword(
                loginEmail.value.trim(),
                loginPassword.value
            )
            .then(() => {
                modalLogin.hide();
                formLogin.reset();
                formLogin.classList.remove("was-validated");
                Swal.fire(
                    currentLanguage === "id"
                        ? "Login berhasil"
                        : "Login successful",
                    "",
                    "success"
                );
                adminTab.show();
            })
            .catch((err) => {
                loginErrorDiv.textContent = err.message;
            });
    });

    btnCancelLogin.addEventListener("click", () => {
        modalLogin.hide();
        daftarTab.show();
    });

    modalLoginEl.addEventListener("hidden.bs.modal", () => {
        matikanBlur();
    });

    // Logout with confirmation
    btnLogout.onclick = () => {
        Swal.fire({
            title: i18nData[currentLanguage].logout_confirm,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText:
                currentLanguage === "id" ? "Ya, Logout" : "Yes, Logout",
            cancelButtonText: currentLanguage === "id" ? "Batal" : "Cancel",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
        }).then((result) => {
            if (result.isConfirmed) {
                auth.signOut();
                Swal.fire(
                    i18nData[currentLanguage].logout_success,
                    "",
                    "success"
                );
            }
        });
    };

    // Auth state changed
    auth.onAuthStateChanged((user) => {
        if (user) {
            matikanBlur();
            btnLogout.classList.remove("d-none");
            btnTambah.disabled = false;
            btnOpenSettings.classList.remove("d-none");
            mulaiSnapshotListener();

            let namaUser = "Admin";
            if (user.displayName && user.displayName.trim()) {
                namaUser = user.displayName;
            } else if (user.email) {
                namaUser = user.email.split("@")[0];
            }
            judulAdmin.textContent = `Hello ${namaUser}!`;
            adminSettings.classList.remove("d-none");
        } else {
            btnLogout.classList.add("d-none");
            btnTambah.disabled = true;
            btnOpenSettings.classList.add("d-none");
            adminSettings.classList.add("d-none");
            closeForm();
            if (unsubscribeProduk) {
                unsubscribeProduk();
                unsubscribeProduk = null;
            }
            tabelDaftarProduk.innerHTML = `<tr><td colspan="2" class="text-center fst-italic">${i18nData[currentLanguage].loading_failed}</td></tr>`;
            tabelAdminProduk.innerHTML = `<tr><td colspan="3" class="text-center fst-italic">${i18nData[currentLanguage].loading_failed}</td></tr>`;

            judulAdmin.textContent = "Hello {User}";

            if (document.querySelector(".nav-link.active").id === "admin-tab") {
                daftarTab.show();
            }
        }
        renderTitle();
    });

    // Barcode scanner setup
    if (window.Html5Qrcode) {
        html5QrcodeScanner = new Html5Qrcode("reader");
    } else {
        console.warn("Library html5-qrcode belum dimuat.");
    }

    function cariProdukByBarcode(code) {
        if (!code) return null;
        code = code.trim();
        if (!Array.isArray(latestProduk)) return null;
        return latestProduk.find((p) => p.barcode && p.barcode === code);
    }
    function playBeep() {
        try {
            const ctx = new (window.AudioContext ||
                window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = "square";
            oscillator.frequency.value = 880; // Hz beep
            gainNode.gain.value = 0.2; // volume

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
                ctx.close();
            }, 150);
        } catch {
            // fallback no sound
        }
    }
    function tampilkanHasilScan(code) {
        playBeep();
        const produk = cariProdukByBarcode(code);
        if (produk) {
            scanResultElement.textContent = `${i18nData[currentLanguage].found_product
                }: ${produk.nama} — Rp ${produk.harga.toLocaleString("id-ID")}`;
            Swal.fire({
                icon: "success",
                title: i18nData[currentLanguage].found_product,
                html: `<b>${produk.nama}</b><br/>Rp ${produk.harga.toLocaleString(
                    "id-ID"
                )}`,
                timer: 3000,
                showConfirmButton: false,
            });
        } else {
            scanResultElement.textContent = `${i18nData[
                currentLanguage
            ].product_not_found.replace("{code}", code)}`;
            Swal.fire({
                icon: "error",
                title: i18nData[currentLanguage].product_not_found.replace(
                    "{code}",
                    code
                ),
                timer: 3000,
                showConfirmButton: false,
            });
        }
    }

    btnScanBarcode.onclick = () => {
        if (scanning) return;
        scanning = true;
        btnScanBarcode.classList.add("d-none");
        btnStopScan.classList.remove("d-none");
        readerElement.style.display = "block";
        scanResultElement.textContent = "";
        if (html5QrcodeScanner) {
            html5QrcodeScanner
                .start(
                    { facingMode: "environment" },
                    {
                        fps: 30,
                        qrbox: { width: 300, height: 100 },
                        formatsToSupport: [
                            Html5QrcodeSupportedFormats.CODE_128,
                            Html5QrcodeSupportedFormats.EAN_13,
                            Html5QrcodeSupportedFormats.EAN_8,
                            Html5QrcodeSupportedFormats.UPC_A,
                            Html5QrcodeSupportedFormats.UPC_E,
                            Html5QrcodeSupportedFormats.CODE_39,
                            Html5QrcodeSupportedFormats.QR_CODE,
                        ],
                    },
                    (decodedText) => {
                        tampilkanHasilScan(decodedText);
                        html5QrcodeScanner.stop();
                        scanning = false;
                        btnScanBarcode.classList.remove("d-none");
                        btnStopScan.classList.add("d-none");
                        readerElement.style.display = "none";
                    },
                    (errorMessage) => { }
                )
                .catch((err) => {
                    Swal.fire(
                        i18nData[currentLanguage].loading_failed,
                        "Tidak dapat mengakses kamera: " + err.message,
                        "error"
                    );
                    scanning = false;
                    btnScanBarcode.classList.remove("d-none");
                    btnStopScan.classList.add("d-none");
                    readerElement.style.display = "none";
                });
        }
    };
    btnStopScan.onclick = () => {
        if (!scanning) return;
        html5QrcodeScanner
            .stop()
            .then(() => {
                scanning = false;
                btnScanBarcode.classList.remove("d-none");
                btnStopScan.classList.add("d-none");
                readerElement.style.display = "none";
                scanResultElement.textContent = "";
            })
            .catch(console.error);
    };

    // Blur control
    function aktifkanBlur() {
        overlayBlur.classList.add("active");
    }
    function matikanBlur() {
        overlayBlur.classList.remove("active");
    }

    // No global click listener activating blur
    // Blur only when modal login is shown, removed when hidden

    // Settings panel toggle (inside admin)
    btnOpenSettings.addEventListener("click", () => {
        if (!adminSettings.classList.contains("d-none")) {
            adminSettings.classList.add("d-none");
        } else {
            // Load current settings values
            settingTitle.value = customTitle;
            settingLanguage.value = currentLanguage;
            // settingTheme.value = currentTheme;
            adminSettings.classList.remove("d-none");
        }
    });

    formSettings.addEventListener("submit", (e) => {
        e.preventDefault();
        // Save settings
        updateTitle(settingTitle.value);
        translatePage(settingLanguage.value);
        //   applyTheme(settingTheme.value);
        Swal.fire(
            currentLanguage === "id" ? "Berhasil" : "Success",
            currentLanguage === "id"
                ? "Pengaturan berhasil disimpan."
                : "Settings successfully saved.",
            "success"
        );
        adminSettings.classList.add("d-none");
    });

    // Theme toggle button (always visible)
    // btnToggleTheme.addEventListener("click", () => {
    //   const newTheme = currentTheme === "dark" ? "light" : "dark";
    //   applyTheme(newTheme);
    // });

    // Initialize aria-label/title of theme toggle button
    btnToggleTheme.setAttribute(
        "aria-label",
        i18nData[currentLanguage].toggle_theme
    );
    btnToggleTheme.title = i18nData[currentLanguage].toggle_theme;
})();