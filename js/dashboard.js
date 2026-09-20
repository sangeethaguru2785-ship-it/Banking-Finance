/* ============================================================
   STACKLY - Dashboard JavaScript (Admin + Customer)
   Session guard, sidebar, view switching, charts, animations
   ============================================================ */

(function () {
    'use strict';

    const SESSION_KEY = 'stackly_session';

    const pageRole = document.body.dataset.dash || '';
    const readSession = () => {
        try {
            return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
        } catch (e) {
            return null;
        }
    };

    /* ========== SESSION GUARD ========== */
    const session = readSession();
    if (!session) {
        window.location.replace('login.html');
        return;
    }
    if (session.role !== pageRole) {
        window.location.replace(session.role === 'admin' ? 'admin-dashboard.html' : 'customer-dashboard.html');
        return;
    }

    document.addEventListener('DOMContentLoaded', () => {

        /* ========== USER CHIP ========== */
        const displayName = ((session && session.name) || '').trim() || (pageRole === 'admin' ? 'Administrator' : 'Customer');
        const roleLabel = pageRole === 'admin' ? 'Administrator' : 'Premium Member';

        const nameEl = document.getElementById('dashUserName');
        const roleEl = document.getElementById('dashUserRole');
        const avatarEl = document.getElementById('dashUserAvatar');

        if (nameEl) nameEl.textContent = displayName;
        if (roleEl) roleEl.textContent = roleLabel;

        if (avatarEl) {
            const initials = displayName.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'D';
            avatarEl.textContent = initials;
        }

        const cardHolder = document.getElementById('dashCardHolder');
        const cardHolder2 = document.getElementById('dashCardHolder2');
        if (cardHolder) cardHolder.textContent = displayName;
        if (cardHolder2) cardHolder2.textContent = displayName;

        /* ========== TOAST ========== */
        const toastWrap = document.getElementById('dashToastWrap');

        const showToast = (message, icon) => {
            if (!toastWrap) return;
            const toast = document.createElement('div');
            toast.className = 'dash-toast';
            toast.innerHTML = `<i class="bi ${icon || 'bi-check-circle-fill'}"></i><span></span>`;
            toast.querySelector('span').textContent = message;
            toastWrap.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('out');
                setTimeout(() => toast.remove(), 400);
            }, 3200);
        };

        /* ========== SIDEBAR (mobile) ========== */
        const sidebar = document.getElementById('dashSidebar');
        const overlay = document.getElementById('dashSidebarOverlay');
        const toggleBtn = document.getElementById('dashSidebarToggle');
        const closeBtn = document.getElementById('dashSidebarClose');

        const closeSidebar = () => {
            if (!sidebar) return;
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('show');
        };

        const openSidebar = () => {
            if (!sidebar) return;
            sidebar.classList.add('open');
            if (overlay) overlay.classList.add('show');
        };

        if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        if (overlay) overlay.addEventListener('click', closeSidebar);

        /* ========== VIEW SWITCHING ========== */
        const views = Array.from(document.querySelectorAll('.dash-view'));
        const navLinks = Array.from(document.querySelectorAll('.dash-nav-link[data-view]'));
        const pageTitleEl = document.getElementById('dashPageTitle');

        const switchView = (viewKey) => {
            const viewEl = document.getElementById('view-' + viewKey);
            if (!viewEl) return;

            navLinks.forEach((l) => l.classList.toggle('active', l.dataset.view === viewKey));

            views.forEach((v) => {
                v.classList.remove('active');
                if (v === viewEl) v.classList.add('active');
            });

            const activeLink = navLinks.find((l) => l.dataset.view === viewKey);
            if (pageTitleEl && activeLink) {
                pageTitleEl.textContent = activeLink.querySelector('span').textContent;
            }

            closeSidebar();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            animateViewIn(viewEl);
            ensureCharts(viewEl);
        };

        // Nav links
        navLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchView(link.dataset.view);
            });
        });

        // Quick action buttons & cross-links
        document.querySelectorAll('[data-view-target]').forEach((btn) => {
            btn.addEventListener('click', () => switchView(btn.dataset.viewTarget));
        });

        // Anchors with data-view-link (e.g. user chip -> settings)
        document.querySelectorAll('[data-view-link]').forEach((el) => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                switchView(el.dataset.viewLink);
            });
        });

        // Plain "#" anchors (decorative icon buttons)
        document.querySelectorAll('a[href="#"]').forEach((el) => {
            el.addEventListener('click', (e) => e.preventDefault());
        });

        /* ========== GSAP VIEW ANIMATION ========== */
        const animateViewIn = (viewEl) => {
            if (!window.gsap) return;
            const target = viewEl.querySelector('.dash-welcome, .dash-stats-grid, .dash-chart-grid, .dash-card, .dash-grid-2, .dash-report-cards, .dash-support-hero, .dash-actions-grid');
            if (!target) return;
            gsap.fromTo(target,
                { opacity: 0, y: 24 },
                { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' });
        };

        /* ========== ANIMATED COUNTERS ========== */
        const animateCounter = (el) => {
            const target = parseFloat(el.getAttribute('data-count')) || 0;
            const prefix = el.getAttribute('data-prefix') || '';
            const decimals = (String(target).split('.')[1] || '').length;
            const start = performance.now();
            const duration = 1600;

            const fmt = (n) => n.toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });

            const tick = (now) => {
                const p = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = prefix + fmt(eased * target);
                if (p < 1) requestAnimationFrame(tick);
                else el.textContent = prefix + fmt(target);
            };
            requestAnimationFrame(tick);
        };

        const initCounters = () => {
            document.querySelectorAll('.dash-stat-value[data-count]').forEach((el) => {
                if (el.dataset.counted) return;
                el.dataset.counted = 'true';
                animateCounter(el);
            });
        };

        /* ========== CHARTS ========== */
        const chartInstances = {};

        Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
        Chart.defaults.color = '#6b7280';

        const red = '#dc2626';
        const redLight = '#f87171';
        const dark = '#16161c';
        const gray = '#9ca3af';

        const rgba = (base, alpha) => `rgba(${base}, ${alpha})`;
        const redGradient = (context) => {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return rgba('220, 38, 38', 0.32);
            const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, rgba('220, 38, 38', 0.32));
            g.addColorStop(1, rgba('220, 38, 38', 0.02));
            return g;
        };

        const chartBuilders = {
            adminActivityChart: (ctx) => ({
                type: 'line',
                data: {
                    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                    datasets: [
                        {
                            label: 'Deposits',
                            data: [520, 610, 590, 700, 780, 720, 810, 860, 940, 900, 980, 1040],
                            borderColor: red,
                            backgroundColor: redGradient,
                            fill: true,
                            tension: 0.45,
                            pointRadius: 0,
                            pointHoverRadius: 5,
                            borderWidth: 2.5
                        },
                        {
                            label: 'Withdrawals',
                            data: [410, 460, 520, 480, 540, 620, 580, 640, 700, 660, 740, 720],
                            borderColor: dark,
                            backgroundColor: 'rgba(22,22,28,0.1)',
                            fill: false,
                            tension: 0.45,
                            pointRadius: 0,
                            pointHoverRadius: 5,
                            borderWidth: 2.5
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8 } },
                        tooltip: { backgroundColor: dark, padding: 12, cornerRadius: 10 }
                    },
                    scales: {
                        y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { callback: (v) => '$' + v + 'k' } },
                        x: { grid: { display: false } }
                    }
                }
            }),

            adminSplitChart: (ctx) => ({
                type: 'doughnut',
                data: {
                    labels: ['Deposits', 'Withdrawals', 'Transfers', 'Loan Payments'],
                    datasets: [{
                        data: [42, 28, 20, 10],
                        backgroundColor: [red, dark, redLight, gray],
                        borderWidth: 3,
                        borderColor: '#ffffff',
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '68%',
                    plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 14 } },
                        tooltip: { backgroundColor: dark, padding: 12, cornerRadius: 10 }
                    }
                }
            }),

            adminReportChart: (ctx) => ({
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                    datasets: [
                        {
                            label: 'Revenue',
                            data: [610, 680, 640, 760, 820, 780, 880, 948],
                            backgroundColor: red,
                            borderRadius: 6,
                            barPercentage: 0.6
                        },
                        {
                            label: 'Expenses',
                            data: [420, 460, 500, 480, 540, 520, 590, 620],
                            backgroundColor: dark,
                            borderRadius: 6,
                            barPercentage: 0.6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8 } },
                        tooltip: { backgroundColor: dark, padding: 12, cornerRadius: 10 }
                    },
                    scales: {
                        y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { callback: (v) => '$' + v + 'k' } },
                        x: { grid: { display: false } }
                    }
                }
            }),

            adminRevenueSourceChart: (ctx) => ({
                type: 'doughnut',
                data: {
                    labels: ['Banking', 'Investments', 'Loans', 'Cards'],
                    datasets: [{
                        data: [38, 27, 22, 13],
                        backgroundColor: [red, dark, redLight, gray],
                        borderWidth: 3,
                        borderColor: '#ffffff',
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '68%',
                    plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 14 } },
                        tooltip: { backgroundColor: dark, padding: 12, cornerRadius: 10 }
                    }
                }
            }),

            customerBalanceChart: (ctx) => ({
                type: 'line',
                data: {
                    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                    datasets: [{
                        label: 'Account Balance',
                        data: [31500, 33900, 36200, 38900, 41300, 48250],
                        borderColor: red,
                        backgroundColor: redGradient,
                        fill: true,
                        tension: 0.45,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        borderWidth: 2.5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: dark, padding: 12, cornerRadius: 10, callbacks: { label: (i) => ' $' + i.parsed.y.toLocaleString() } }
                    },
                    scales: {
                        y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { callback: (v) => '$' + (v / 1000) + 'k' } },
                        x: { grid: { display: false } }
                    }
                }
            }),

            customerSpendChart: (ctx) => ({
                type: 'doughnut',
                data: {
                    labels: ['Housing', 'Shopping', 'Groceries', 'Transport', 'Other'],
                    datasets: [{
                        data: [36, 22, 16, 12, 14],
                        backgroundColor: [red, dark, redLight, gray, '#e5e7eb'],
                        borderWidth: 3,
                        borderColor: '#ffffff',
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '68%',
                    plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 14 } },
                        tooltip: { backgroundColor: dark, padding: 12, cornerRadius: 10 }
                    }
                }
            })
        };

        const ensureCharts = (viewEl) => {
            if (typeof Chart === 'undefined') return;
            viewEl.querySelectorAll('canvas').forEach((canvas) => {
                if (chartInstances[canvas.id]) return;
                const builder = chartBuilders[canvas.id];
                if (!builder) return;
                const ctx = canvas.getContext('2d');
                chartInstances[canvas.id] = new Chart(ctx, builder(ctx));
            });
        };

        /* ========== INIT ========== */
        const init = () => {
            initCounters();
            ensureCharts(document.querySelector('.dash-view.active'));

            if (window.gsap) {
                gsap.set('.dash-nav-link', { autoAlpha: 1 });
                gsap.from('.dash-nav-link', {
                    opacity: 0,
                    x: -16,
                    stagger: 0.045,
                    duration: 0.5,
                    delay: 0.1,
                    ease: 'power3.out'
                });
                gsap.fromTo('.dash-welcome',
                    { opacity: 0, y: 24 },
                    { opacity: 1, y: 0, duration: 0.6, delay: 0.25, ease: 'power3.out' });
                gsap.fromTo('.dash-stat-card',
                    { opacity: 0, y: 22 },
                    { opacity: 1, y: 0, stagger: 0.07, duration: 0.55, delay: 0.35, ease: 'power3.out' });
            }
        };

        init();

        /* ========== FORMS: DEMO SUBMIT ========== */
        document.querySelectorAll('.dash-content form').forEach((form) => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                let label = 'Action';
                const title = form.closest('.dash-card')?.querySelector('.dash-card-title');
                if (title) label = title.textContent.replace(/^\s*<[^>]*>/i, '').trim() || 'Action';
                showToast('Completed successfully', 'bi-check-circle-fill');
                form.reset && form.reset();
            });
        });

        /* ========== DEMO ACTION BUTTONS ========== */
        [
            ['addCustomerBtn', 'New customer form loaded (demo).'],
            ['addAccountBtn', 'Account opening flow started (demo).'],
            ['pendingBtn', 'No pending transactions to review.']
        ].forEach(([id, msg]) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', () => showToast(msg, 'bi-info-circle-fill'));
        });

        ['markReadBtn', 'newLoanBtn', 'newCardBtn', 'applyLoanBtn', 'allStatementsBtn'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', () => showToast('Done (demo action).', 'bi-check-circle-fill'));
        });

        /* ========== TABLE SEARCH ========== */
        document.querySelectorAll('.dash-table-search').forEach((input) => {
            input.addEventListener('input', () => {
                const q = input.value.trim().toLowerCase();
                const tbody = input.closest('.dash-card').querySelector('.dash-table-body');
                if (!tbody) return;
                tbody.querySelectorAll('tr').forEach((row) => {
                    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
                });
            });
        });

        /* ========== LOGOUT ========== */
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                try { localStorage.removeItem(SESSION_KEY); } catch (err) { /* noop */ }
                window.location.href = 'login.html';
            });
        }

        /* ========== RESIZE: refresh counters when stats re-flow ========== */
        window.addEventListener('resize', () => {
            Object.values(chartInstances).forEach((c) => c.resize());
        });

        /* ========== CONTENT INTERACTIONS REDIRECT TO 404 ========== */
        const redirectTo404 = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            window.location.href = '404.html';
        };

        /* ========== CHANGE PASSWORD VALIDATION ========== */
        const validateSettingsForm = (e) => {
            const form = e.target && e.target.closest ? e.target.closest('#settingsForm') : null;
            if (!form) return;

            const inputs = form.querySelectorAll('input[type="password"]');
            if (!inputs.length) return;

            const newPw = inputs[0].value;
            const confirmPw = inputs[1] ? inputs[1].value : '';
            let message = '';

            if (!window.StacklyPassword.evaluate(newPw).ok) {
                message = window.StacklyPassword.message(newPw);
            } else if (newPw !== confirmPw) {
                message = 'Passwords do not match.';
            }

            if (!message) return;

            e.preventDefault();
            e.stopImmediatePropagation();
            inputs.forEach((input) => input.classList.add('is-invalid'));

            let err = form.querySelector('.dash-form-error');
            if (!err) {
                err = document.createElement('p');
                err.className = 'dash-form-error';
                form.insertBefore(err, form.firstChild);
            }
            err.textContent = message;
            inputs[0].focus();
        };

        document.addEventListener('click', (e) => {
            if (e.target.closest && e.target.closest('#settingsForm button[type="submit"]')) {
                validateSettingsForm(e);
            }
        }, true);

        document.addEventListener('submit', (e) => {
            if (e.target && e.target.id === 'settingsForm') {
                validateSettingsForm(e);
            }
        }, true);

        document.addEventListener('click', (e) => {
            // Header, sidebar, sidebar overlay and logout stay fully functional
            if (e.target.closest('.dash-topbar, .dash-sidebar, .dash-sidebar-overlay')) return;

            const interactive = e.target.closest(
                'a[href], button, [role="button"], [data-bs-toggle], [data-view-target], ' +
                'input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], ' +
                'select, .dash-btn, .dash-btn-link-sm, .dash-action-btn, .dash-switch, .dash-tab, .dash-accordion-header'
            );

            if (interactive) redirectTo404(e);
        }, true);

        document.addEventListener('submit', (e) => {
            if (e.target.closest('.dash-content')) redirectTo404(e);
        }, true);

        document.addEventListener('change', (e) => {
            const el = e.target;
            if (!el || !el.closest || !el.closest('.dash-content')) return;
            if (el.matches('select, input[type="checkbox"], input[type="radio"]')) redirectTo404(e);
        }, true);
    });
})();

/* ========== EMAIL INPUT VALIDATION (site-wide) ========== */
(function () {
    'use strict';

    // Email format rules (site-wide):
    //  - Allowed characters: A-Z, a-z, 0-9, @ and . only (no spaces/symbols)
    //  - Exactly one @; at least one character before it
    //  - Domain after @ must contain at least one dot
    //  - At least one character before and after the final dot
    //  - No consecutive dots; cannot start or end with '.' or '@'
    var EMAIL_REGEX = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)+$/;
    var ALLOWED_CHARS = /^[A-Za-z0-9@.]$/;
    var INVALID_MSG = 'Email must use only letters, numbers, @ and . (e.g. example123@gmail.com).';

    function isValidEmail(value) {
        return EMAIL_REGEX.test(String(value).trim());
    }

    function syncField(el) {
        var cleaned = el.value.replace(/[^A-Za-z0-9@.]/g, '');
        if (cleaned !== el.value) {
            el.value = cleaned;
        }
        var ok = isValidEmail(cleaned);
        var inNewsletter = !!el.closest('.newsletter-input-wrap');
        if (inNewsletter) {
            el.classList.remove('is-invalid');
        } else {
            el.classList.toggle('is-invalid', cleaned !== '' && !ok);
        }
        el.setCustomValidity(ok ? '' : 'Use only A-Z, a-z, 0-9, @ and . — e.g. example123@gmail.com');

        var wrap = el.closest('.newsletter-input-wrap');
        if (wrap) {
            wrap.style.borderColor = ok ? '' : '#ef4444';
        }

        var form = el.closest('form');
        if (form && ok) {
            var err = form.querySelector('.input-error-msg');
            if (err) {
                err.remove();
            }
        }

        return ok;
    }

    function showError(form) {
        var err = form.querySelector('.input-error-msg');
        if (!err) {
            err = document.createElement('p');
            err.className = 'input-error-msg';
            err.style.cssText = 'margin:8px 0 0;font-size:0.78rem;color:#f87171;';
            var input = form.querySelector('input[type="email"]');
            var wrap = input ? input.closest('.newsletter-input-wrap') : null;
            (wrap || form).appendChild(err);
        }
        err.textContent = INVALID_MSG;
    }

    document.addEventListener('keydown', function (e) {
        var el = e.target;
        if (!el || !el.matches || !el.matches('input[type="email"]')) return;
        if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key.length === 1 && !ALLOWED_CHARS.test(e.key)) {
            e.preventDefault();
        }
    }, true);

    document.addEventListener('input', function (e) {
        var el = e.target;
        if (el && el.matches && el.matches('input[type="email"]')) {
            syncField(el);
        }
    }, true);

    document.addEventListener('change', function (e) {
        var el = e.target;
        if (el && el.matches && el.matches('input[type="email"]')) {
            syncField(el);
        }
    }, true);

    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!form || !form.classList || !form.classList.contains('newsletter-form')) return;
        var input = form.querySelector('input[type="email"]');
        if (!input) return;
        if (!isValidEmail(input.value)) {
            e.preventDefault();
            e.stopPropagation();
            syncField(input);
            showError(form);
            input.focus();
        }
    }, true);

    window.StacklyEmail = {
        valid: isValidEmail,
        validate: syncField,
        errorMsg: INVALID_MSG
    };
})();

/* ========== PASSWORD VALIDATION (site-wide) ========== */
(function () {
    'use strict';

    var PASSWORD_RULES = [
        { regex: /.{8,}/, label: 'at least 8 characters' },
        { regex: /[A-Z]/, label: 'at least 1 uppercase letter (A-Z)' },
        { regex: /[a-z]/, label: 'at least 1 lowercase letter (a-z)' },
        { regex: /[0-9]/, label: 'at least 1 number (0-9)' },
        { regex: /[^A-Za-z0-9]/, label: 'at least 1 special character (e.g. @, #, $, %)' }
    ];

    function evaluate(pw) {
        var value = String(pw || '');
        var missing = [];
        PASSWORD_RULES.forEach(function (rule) {
            if (!rule.regex.test(value)) missing.push(rule.label);
        });
        return { ok: missing.length === 0, missing: missing };
    }

    function message(pw) {
        var result = evaluate(pw);
        if (result.ok) return '';
        return 'Password must include: ' + result.missing.join(', ') + '.';
    }

    document.addEventListener('input', function (e) {
        var el = e.target;
        if (el && el.matches && el.matches('input[type="password"]')) {
            el.classList.remove('is-invalid');
        }
    }, true);

    window.StacklyPassword = {
        evaluate: evaluate,
        message: message
    };
})();

/* ========== NAME / NUMBER FIELD VALIDATION (site-wide) ========== */
(function () {
    'use strict';

    // data-validate="name"   -> letters (A-Z, a-z) and spaces only
    // data-validate="number" -> digits (0-9) only
    var PATTERNS = {
        name: { regex: /^[A-Za-z ]*$/, strip: /[^A-Za-z ]/g },
        number: { regex: /^[0-9]*$/, strip: /[^0-9]/g }
    };

    function cleanField(el) {
        var type = el.getAttribute('data-validate');
        var pattern = PATTERNS[type];
        if (!pattern) return;
        var cleaned = el.value.replace(pattern.strip, '');
        if (cleaned !== el.value) el.value = cleaned;
        if (el.classList) el.classList.remove('is-invalid');
    }

    document.addEventListener('keydown', function (e) {
        var el = e.target;
        if (!el || !el.getAttribute || !el.getAttribute('data-validate')) return;
        var pattern = PATTERNS[el.getAttribute('data-validate')];
        if (!pattern) return;
        if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' || e.key === 'Enter' || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key.length === 1 && !pattern.regex.test(e.key)) e.preventDefault();
    }, true);

    document.addEventListener('input', function (e) {
        var el = e.target;
        if (el && el.getAttribute && el.getAttribute('data-validate')) cleanField(el);
    }, true);

    document.addEventListener('paste', function (e) {
        var el = e.target;
        if (!el || !el.getAttribute || !el.getAttribute('data-validate')) return;
        var pattern = PATTERNS[el.getAttribute('data-validate')];
        if (!pattern) return;
        e.preventDefault();
        var text = (e.clipboardData.getData('text') || '').replace(pattern.strip, '');
        var start = el.selectionStart || el.value.length;
        var end = el.selectionEnd || el.value.length;
        el.value = el.value.slice(0, start) + text + el.value.slice(end);
        cleanField(el);
    }, true);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll('[data-validate]').forEach(cleanField);
        });
    } else {
        document.querySelectorAll('[data-validate]').forEach(cleanField);
    }

    window.StacklyField = { clean: cleanField };
})();