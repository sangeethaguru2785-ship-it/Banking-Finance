/* ============================================================
   STACKLY - Authentication JavaScript
   Login / Signup form handling with role selection
   (Frontend demo using localStorage)
   ============================================================ */

(function () {
    'use strict';

    const USERS_KEY = 'stackly_users';
    const SESSION_KEY = 'stackly_session';

    const DEMO_USERS = [
        { firstName: 'Demo', lastName: 'Admin', email: 'admin@stackly.com', password: 'Admin@123', role: 'admin' },
        { firstName: 'Demo', lastName: 'Customer', email: 'customer@stackly.com', password: 'Customer@123', role: 'customer' }
    ];

    const getUsers = () => {
        try {
            const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

            let changed = false;
            users.forEach((u) => {
                if (u.password === 'admin123') { u.password = 'Admin@123'; changed = true; }
                if (u.password === 'customer123') { u.password = 'Customer@123'; changed = true; }
            });
            if (changed) {
                localStorage.setItem(USERS_KEY, JSON.stringify(users));
            }

            return users;
        } catch (e) {
            return [];
        }
    };

    const saveUser = (user) => {
        const users = getUsers();
        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    };

    const findUser = (email, password, role) => {
        const normalizedEmail = email.trim().toLowerCase();
        const users = getUsers();

        const match = users.find((u) =>
            u.email.toLowerCase() === normalizedEmail &&
            u.password === password &&
            u.role === role
        );

        if (match) return match;

        return DEMO_USERS.find((u) =>
            u.email.toLowerCase() === normalizedEmail &&
            u.password === password &&
            u.role === role
        );
    };

    const setSession = (user) => {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            role: user.role
        }));
    };

    const showMessage = (element, message, type) => {
        if (!element) return;
        element.textContent = message;
        element.hidden = false;
        element.style.display = 'block';

        if (type === 'success') {
            element.classList.add('auth-success');
            element.classList.remove('auth-error');
        } else {
            element.classList.add('auth-error');
            element.classList.remove('auth-success');
        }
    };

    const clearMessages = () => {
        document.querySelectorAll('.auth-error, .auth-success').forEach((el) => {
            el.hidden = true;
            el.style.display = 'none';
        });
    };

    /* ========== ROLE SELECTION (shared) ========== */
    const initRoleCards = (name) => {
        const inputs = Array.from(document.querySelectorAll(`input[name="${name}"]`));

        const select = (target) => {
            inputs.forEach((input) => {
                const isTarget = input === target;
                input.checked = isTarget;
                const card = input.closest('.auth-role-card');
                if (card) card.classList.toggle('active', isTarget);
            });
        };

        inputs.forEach((input) => {
            const card = input.closest('.auth-role-card');
            if (!card) return;

            card.addEventListener('click', (e) => {
                e.preventDefault();
                select(input);
            });
            input.addEventListener('change', () => select(input));
            select(input);
        });
    };

    /* ========== PASSWORD VISIBILITY TOGGLE ========== */
    const initPasswordToggles = () => {
        document.querySelectorAll('.auth-password-toggle').forEach((btn) => {
            btn.addEventListener('click', () => {
                const input = btn.previousElementSibling;
                if (!input || input.type === 'hidden') return;

                const isHidden = input.type === 'password';
                input.type = isHidden ? 'text' : 'password';
                btn.innerHTML = isHidden ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
            });
        });
    };

    document.addEventListener('DOMContentLoaded', () => {

        /* ========== SIGNUP FORM ========== */
        const signupForm = document.getElementById('signupForm');
        initPasswordToggles();

        if (signupForm) {
            initRoleCards('signupRole');

            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                clearMessages();

                const role = document.querySelector('input[name="signupRole"]:checked').value;
                const firstName = document.getElementById('signupFirst').value.trim();
                const lastName = document.getElementById('signupLast').value.trim();
                const email = document.getElementById('signupEmail').value.trim();
                const password = document.getElementById('signupPassword').value;
                const confirm = document.getElementById('signupConfirm').value;
                const terms = document.getElementById('termsCheck').checked;
                const errorBox = document.getElementById('signupError');

                if (!firstName || !lastName || !email || !password || !confirm) {
                    showMessage(errorBox, 'Please fill in all required fields.');
                    return;
                }
                if (!window.StacklyEmail.valid(email)) {
                    showMessage(errorBox, window.StacklyEmail.errorMsg);
                    return;
                }
                if (!window.StacklyPassword.evaluate(password).ok) {
                    document.getElementById('signupPassword').classList.add('is-invalid');
                    showMessage(errorBox, window.StacklyPassword.message(password));
                    return;
                }
                if (password !== confirm) {
                    document.getElementById('signupConfirm').classList.add('is-invalid');
                    showMessage(errorBox, 'Passwords do not match.');
                    return;
                }
                if (!terms) {
                    showMessage(errorBox, 'You must agree to the Terms & Conditions to continue.');
                    return;
                }

                const existing = getUsers().some((u) => u.email.toLowerCase() === email.toLowerCase());
                if (existing) {
                    showMessage(errorBox, 'An account with this email already exists. Please log in instead.');
                    return;
                }

                const newUser = { firstName, lastName, email, password, role };
                saveUser(newUser);

                showMessage(errorBox, 'Account created successfully! Redirecting to login...', 'success');

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1200);
            });
        }

        /* ========== LOGIN FORM ========== */
        const loginForm = document.getElementById('loginForm');

        if (loginForm) {
            initRoleCards('loginRole');

            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                clearMessages();

                const role = document.querySelector('input[name="loginRole"]:checked').value;
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;
                const rememberMe = document.getElementById('rememberMe');
                const errorBox = document.getElementById('loginError');

                if (!rememberMe || !rememberMe.checked) {
                    showMessage(errorBox, 'Please select "Remember Me" to log in.');
                    return;
                }

                if (!email || !password) {
                    showMessage(errorBox, 'Please enter both email and password.');
                    return;
                }
                if (!window.StacklyEmail.valid(email)) {
                    showMessage(errorBox, window.StacklyEmail.errorMsg);
                    return;
                }
                if (!window.StacklyPassword.evaluate(password).ok) {
                    document.getElementById('loginPassword').classList.add('is-invalid');
                    showMessage(errorBox, window.StacklyPassword.message(password));
                    return;
                }

                let user = findUser(email, password, role);

                if (!user) {
                    const nameParts = email.split('@')[0].replace(/[._-]/g, ' ').split(' ');
                    const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
                    const lastName = (nameParts[1] || '').charAt(0).toUpperCase() + (nameParts[1] || '').slice(1) || 'User';
                    user = { firstName, lastName, email, password, role };
                    saveUser(user);
                }

                setSession(user);

                showMessage(errorBox, 'Login successful! Redirecting...', 'success');

                setTimeout(() => {
                    window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'customer-dashboard.html';
                }, 1200);
            });
        }
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