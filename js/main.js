/* ============================================================
   STACKLY - Main JavaScript
   GSAP Animations, Counters, Navigation, and Interactions
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ========== HERO VIDEO: DISABLE PICTURE-IN-PICTURE ========== */
    document.querySelectorAll('.hero-dashboard-video, .hero-bg-video').forEach((video) => {
        if (typeof video.disablePictureInPicture !== 'undefined') {
            video.disablePictureInPicture = true;
        }
    });

    /* ========== HERO BACKGROUND VIDEO ========== */
    const heroVideo = document.querySelector('.hero-bg-video');
    if (heroVideo) {
        const playVideo = () => {
            const p = heroVideo.play();
            if (p) p.catch(() => { /* Muted autoplay may be blocked; fallback image is shown instead. */ });
        };
        playVideo();
        if (heroVideo.paused) {
            document.addEventListener('click', playVideo, { once: true });
        }
    }

    /* ========== GSAP REGISTRATION ========== */
    gsap.registerPlugin(ScrollTrigger);

    /* ========== NAVBAR SCROLL EFFECT ========== */
    const mainNav = document.getElementById('mainNav');

    if (mainNav) {
        const handleScroll = () => {
            if (window.scrollY > 80) {
                mainNav.classList.add('scrolled');
            } else {
                mainNav.classList.remove('scrolled');
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();
    }

    /* ========== SCROLL PROGRESS BAR ========== */
    const scrollProgress = document.getElementById('scroll-progress');

    if (scrollProgress) {
        const updateProgress = () => {
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (window.scrollY / scrollable) * 100;
            scrollProgress.style.width = scrolled + '%';
        };

        window.addEventListener('scroll', updateProgress);
    }

    /* ========== BACK TO TOP ========== */
    const backToTop = document.getElementById('backToTop');

    if (backToTop) {
        const toggleBackToTop = () => {
            if (window.scrollY > 600) {
                backToTop.classList.add('show');
            } else {
                backToTop.classList.remove('show');
            }
        };

        window.addEventListener('scroll', toggleBackToTop);

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ========== ACTIVE NAV LINK BY PAGE ========== */
    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    const pageLinks = {
        'index.html': 'index.html',
        'about.html': 'about.html',
        'banking.html': 'banking.html',
        'loans.html': 'loans.html',
        'investments.html': 'investments.html',
        'wealth.html': 'wealth.html',
        'contact.html': 'contact.html'
    };
    const activePage = pageLinks[pageName] || 'index.html';

    document.querySelectorAll('.navbar-nav .nav-link').forEach((link) => {
        if (link.getAttribute('href') === activePage) {
            link.classList.add('active');
        }
    });

    /* ========== ANIMATED COUNTERS ========== */
    const animateCounter = (element, target, duration = 2500) => {
        const start = 0;
        const startTime = performance.now();
        const prefix = element.getAttribute('data-prefix') || '';
        const suffix = element.getAttribute('data-suffix') || '';
        const decimals = (String(target).split('.')[1] || '').length;

        const tick = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easing = 1 - Math.pow(1 - progress, 3);
            const raw = easing * (target - start) + start;
            const current = decimals > 0 ? raw.toFixed(decimals) : Math.floor(raw).toLocaleString();
            element.textContent = prefix + current + suffix;

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                const final = decimals > 0 ? target.toFixed(decimals) : target.toLocaleString();
                element.textContent = prefix + final + suffix;
            }
        };

        requestAnimationFrame(tick);
    };

    // Hero counters
    gsap.utils.toArray('.counter').forEach((counter) => {
        const target = parseFloat(counter.getAttribute('data-target'), 10);

        // If counter is already visible on load, animate immediately
        if (counter.getBoundingClientRect().top < window.innerHeight) {
            setTimeout(() => animateCounter(counter, target), 300);
        }

        // Otherwise animate when scrolled into view
        ScrollTrigger.create({
            trigger: counter,
            start: 'top 90%',
            once: true,
            onEnter: () => {
                if (!counter.dataset.animated) {
                    counter.dataset.animated = 'true';
                    animateCounter(counter, target);
                }
            }
        });
    });

    /* ========== LOAN CALCULATOR ========== */
    const loanCalc = document.getElementById('loanCalculator');

    if (loanCalc) {
        const amountRange = document.getElementById('loanAmountRange');
        const rateRange = document.getElementById('loanRateRange');
        const termRange = document.getElementById('loanTermRange');
        const amountOut = document.getElementById('loanAmountOut');
        const rateOut = document.getElementById('loanRateOut');
        const termOut = document.getElementById('loanTermOut');
        const monthlyOut = document.getElementById('loanMonthlyOut');
        const totalInterestOut = document.getElementById('loanTotalInterestOut');
        const totalPayOut = document.getElementById('loanTotalPayOut');

        const formatCurrency = (value, decimals = 0) =>
            '$' + value.toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });

        const calculate = (amount, annualRate, years) => {
            const monthlyRate = annualRate / 100 / 12;
            const months = years * 12;
            const monthly = monthlyRate === 0
                ? amount / months
                : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
            const totalPaid = monthly * months;
            const totalInterest = totalPaid - amount;

            monthlyOut.textContent = formatCurrency(monthly, 2);
            totalInterestOut.textContent = formatCurrency(totalInterest);
            totalPayOut.textContent = formatCurrency(totalPaid);
        };

        const sync = () => {
            const amount = parseFloat(amountRange.value) || 0;
            const rate = parseFloat(rateRange.value) || 0;
            const term = parseInt(termRange.value, 10) || 1;

            amountOut.textContent = formatCurrency(amount);
            rateOut.textContent = rate.toFixed(2) + '%';
            termOut.textContent = term + ' yrs';
            calculate(amount, rate, term);
        };

        [amountRange, rateRange, termRange].forEach((input) => {
            input.addEventListener('input', sync);
        });

        sync();
    }

    /* ========== INVESTMENT GROWTH CALCULATOR ========== */
    const growthCalc = document.getElementById('growthCalculator');

    if (growthCalc) {
        const initialRange = document.getElementById('growthInitialRange');
        const monthlyRange = document.getElementById('growthMonthlyRange');
        const returnRange = document.getElementById('growthReturnRange');
        const yearsRange = document.getElementById('growthYearsRange');
        const initialOut = document.getElementById('growthInitialOut');
        const monthlyOut = document.getElementById('growthMonthlyOut');
        const returnOut = document.getElementById('growthReturnOut');
        const yearsOut = document.getElementById('growthYearsOut');
        const fvOut = document.getElementById('growthFVOut');
        const contribOut = document.getElementById('growthContribOut');
        const earnedOut = document.getElementById('growthEarnedOut');

        const formatCurrency = (value) =>
            '$' + value.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });

        const calculate = (initial, monthly, annualRate, years) => {
            const r = annualRate / 100 / 12;
            const n = years * 12;
            const fv = initial * Math.pow(1 + r, n) + monthly * ((Math.pow(1 + r, n) - 1) / r) || 0;
            const totalContrib = initial + monthly * n;
            const totalEarned = fv - totalContrib;

            fvOut.textContent = formatCurrency(fv);
            contribOut.textContent = formatCurrency(totalContrib);
            earnedOut.textContent = formatCurrency(totalEarned);
        };

        const sync = () => {
            const initial = parseFloat(initialRange.value) || 0;
            const monthly = parseFloat(monthlyRange.value) || 0;
            const annualRate = parseFloat(returnRange.value) || 0;
            const years = parseInt(yearsRange.value, 10) || 1;

            initialOut.textContent = formatCurrency(initial);
            monthlyOut.textContent = formatCurrency(monthly) + '/mo';
            returnOut.textContent = annualRate.toFixed(1) + '%';
            yearsOut.textContent = years + ' yrs';
            calculate(initial, monthly, annualRate, years);
        };

        [initialRange, monthlyRange, returnRange, yearsRange].forEach((input) => {
            input.addEventListener('input', sync);
        });

        sync();
    }

    /* ========== RETIREMENT CALCULATOR ========== */
    const retireCalc = document.getElementById('retirementCalculator');

    if (retireCalc) {
        const currentAgeRange = document.getElementById('retireCurrentAgeRange');
        const targetAgeRange = document.getElementById('retireTargetAgeRange');
        const savingRange = document.getElementById('retireSavingRange');
        const monthlyRange = document.getElementById('retireMonthlyRange');
        const returnRange = document.getElementById('retireReturnRange');
        const currentAgeOut = document.getElementById('retireCurrentAgeOut');
        const targetAgeOut = document.getElementById('retireTargetAgeOut');
        const savingOut = document.getElementById('retireSavingOut');
        const monthlyOut = document.getElementById('retireMonthlyOut');
        const returnOut = document.getElementById('retireReturnOut');
        const projectedOut = document.getElementById('retireProjectedOut');
        const contribOut = document.getElementById('retireContribOut');
        const earnedOut = document.getElementById('retireEarnedOut');

        const formatCurrency = (value) =>
            '$' + value.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });

        const calculate = () => {
            const currentAge = parseInt(currentAgeRange.value, 10) || 30;
            const targetAge = parseInt(targetAgeRange.value, 10) || 65;
            const savings = parseFloat(savingRange.value) || 0;
            const monthly = parseFloat(monthlyRange.value) || 0;
            const annualRate = parseFloat(returnRange.value) || 0;
            const years = Math.max(targetAge - currentAge, 0);
            const r = annualRate / 100 / 12;
            const n = years * 12;
            const projected = savings * Math.pow(1 + r, n) + monthly * ((Math.pow(1 + r, n) - 1) / r) || 0;
            const totalContrib = savings + monthly * n;
            const totalEarned = projected - totalContrib;

            projectedOut.textContent = formatCurrency(projected);
            contribOut.textContent = formatCurrency(totalContrib);
            earnedOut.textContent = formatCurrency(totalEarned);
        };

        const sync = () => {
            currentAgeOut.textContent = currentAgeRange.value + ' yrs';
            targetAgeOut.textContent = targetAgeRange.value + ' yrs';
            savingOut.textContent = formatCurrency(parseFloat(savingRange.value) || 0);
            monthlyOut.textContent = formatCurrency(parseFloat(monthlyRange.value) || 0) + '/mo';
            returnOut.textContent = parseFloat(returnRange.value).toFixed(1) + '%';
            calculate();
        };

        [currentAgeRange, targetAgeRange, savingRange, monthlyRange, returnRange].forEach((input) => {
            input.addEventListener('input', sync);
        });

        sync();
    }

    /* ========== GSAP: HERO INTRO ANIMATION (Home page only) ========== */
    const heroSection = document.querySelector('.hero-section');

    if (heroSection) {

        const heroTl = gsap.timeline({ delay: 0.2 });

        heroTl
            .from('.hero-badge', {
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: 'power3.out'
            })
            .from('.hero-title', {
                opacity: 0,
                y: 60,
                duration: 1,
                ease: 'power3.out'
            }, '-=0.4')
            .from('.hero-subtitle', {
                opacity: 0,
                y: 40,
                duration: 0.8,
                ease: 'power3.out'
            }, '-=0.6')
            .from('.hero-btn', {
                opacity: 1,
                y: 24,
                stagger: 0.12,
                duration: 0.6,
                ease: 'power3.out'
            }, '-=0.5')
            .from('.hero-cta-strip', {
                opacity: 1,
                y: 24,
                duration: 0.6,
                ease: 'power3.out'
            }, '-=0.4');

        // Background zoom + dashboard image + floating cards
        const heroVisualTl = gsap.timeline({ delay: 0.6 });

        heroVisualTl
            .from('.hero-bg-video', {
                scale: 1.2,
                opacity: 0.2,
                duration: 2,
                ease: 'power3.out'
            })
            .from('.hero-dashboard-img-wrap', {
                opacity: 0,
                y: 80,
                scale: 0.95,
                duration: 1.1,
                ease: 'power3.out'
            }, '-=0.8')
            .from('.balance-card-float', {
                opacity: 0,
                y: -60,
                x: -40,
                duration: 0.8,
                ease: 'back.out(1.7)'
            }, '-=0.6')
            .from('.invest-card-float', {
                opacity: 0,
                y: 60,
                x: 40,
                duration: 0.8,
                ease: 'back.out(1.7)'
            }, '-=0.6')
            .from('.dash-notification', {
                opacity: 0,
                scale: 0.6,
                duration: 0.7,
                ease: 'back.out(2.2)'
            }, '-=0.5')
            .from('.hero-stats-bar', {
                opacity: 1,
                y: 40,
                duration: 0.8,
                ease: 'power3.out'
            }, '-=0.5');

        // Safety net: never allow hero elements to be left hidden by a failed animation
        window.setTimeout(() => {
            gsap.set(
                '.hero-badge, .hero-title, .hero-subtitle, .hero-btn, .hero-cta-strip, .hero-dashboard-img-wrap, .dash-card, .dash-notification, .hero-stats-bar',
                { clearProps: 'all' }
            );
        }, 4500);
    }

    /* ========== GSAP: PAGE HERO INTRO (Sub-pages) ========== */
    const pageHero = document.querySelector('.page-hero');

    if (pageHero) {
        gsap.timeline({ delay: 0.2 })
            .from('.page-hero .section-label', {
                opacity: 0,
                y: 24,
                duration: 0.6,
                ease: 'power3.out'
            })
            .from('.page-hero-title', {
                opacity: 0,
                y: 40,
                duration: 0.8,
                ease: 'power3.out'
            }, '-=0.3')
            .from('.page-hero-sub', {
                opacity: 0,
                y: 24,
                duration: 0.6,
                ease: 'power3.out'
            }, '-=0.4')
            .from('.page-hero-breadcrumb', {
                opacity: 0,
                y: 16,
                duration: 0.5,
                ease: 'power3.out'
            }, '-=0.3');
    }

    /* ========== GSAP: SECTION REVEAL ANIMATIONS ========== */
    // Partners
    gsap.from('.partner-logo', {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.partner-section',
            start: 'top 85%',
            once: true
        }
    });

    // About images
    gsap.from('.about-main-img', {
        scale: 0.92,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.about-image-wrap',
            start: 'top 80%',
            once: true
        }
    });

    gsap.from('.about-floating-card', {
        opacity: 0,
        y: 50,
        x: -30,
        duration: 1,
        delay: 0.3,
        ease: 'back.out(1.7)',
        scrollTrigger: {
            trigger: '.about-image-wrap',
            start: 'top 80%',
            once: true
        }
    });

    gsap.from('.about-floating-card-2', {
        opacity: 0,
        y: -50,
        x: 30,
        duration: 1,
        delay: 0.5,
        ease: 'back.out(1.7)',
        scrollTrigger: {
            trigger: '.about-image-wrap',
            start: 'top 80%',
            once: true
        }
    });

    // About feature items stagger
    gsap.from('.about-feature-item', {
        opacity: 0,
        y: 40,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.about-features',
            start: 'top 85%',
            once: true
        }
    });

    /* ========== GSAP: SERVICE CARDS ========== */
    gsap.utils.toArray('.service-card').forEach((card, index) => {
        gsap.from(card, {
            opacity: 0,
            y: 60,
            duration: 0.8,
            delay: index * 0.1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 88%',
                once: true
            }
        });
    });

    /* ========== GSAP: APP SECTION ========== */
    gsap.from('.app-img', {
        opacity: 0,
        y: 80,
        rotate: 3,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.app-visual',
            start: 'top 85%',
            once: true
        }
    });

    /* ========== GSAP: TESTIMONIAL CARDS ========== */
    gsap.utils.toArray('.testimonial-card').forEach((card, index) => {
        gsap.from(card, {
            opacity: 0,
            y: 60,
            rotationX: 15,
            duration: 0.9,
            delay: index * 0.12,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 88%',
                once: true
            }
        });
    });

    /* ========== GSAP: CTA BANNER ========== */
    gsap.from('.cta-content', {
        opacity: 0,
        y: 60,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.cta-banner',
            start: 'top 85%',
            once: true
        }
    });

    /* ========== GSAP: CONTACT SECTION ========== */
    gsap.from('.contact-item', {
        opacity: 0,
        x: -40,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.contact-info',
            start: 'top 85%',
            once: true
        }
    });

    gsap.from('.contact-section .social-links .social-link', {
        y: 20,
        stagger: 0.08,
        duration: 0.6,
        ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: {
            trigger: '.contact-section',
            start: 'top 85%',
            once: true,
            onEnter: () => {
                gsap.set('.contact-section .social-links .social-link', { clearProps: 'all' });
            }
        }
    });

    // Safety net: never allow icons to remain hidden if the scroll trigger fails
    window.setTimeout(() => {
        gsap.set('.contact-section .social-links .social-link', { clearProps: 'all' });
    }, 800);

    gsap.from('.contact-form-wrap', {
        opacity: 0,
        y: 60,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.contact-form-wrap',
            start: 'top 85%',
            once: true
        }
    });

    /* ========== GSAP: FOOTER ========== */
    gsap.from('.footer-top', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.footer-section',
            start: 'top 90%',
            once: true
        }
    });

    /* ========== AOS INITIALIZE ========== */
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 80
        });
        document.body.classList.add('aos-initialized');
    }

    /* ========== GSAP FALLBACK: never allow content to stay hidden ========== */
    window.setTimeout(() => {
        if (typeof gsap !== 'undefined') {
            gsap.set(
                '.about-main-img, .about-floating-card, .about-floating-card-2, .about-feature-item, .service-card, .app-img, .testimonial-card, .cta-content, .footer-top',
                { clearProps: 'all' }
            );
        }
    }, 3500);

    /* ========== CONTACT FORM SUBMIT ========== */
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const emailField = contactForm.querySelector('#email');
            if (emailField && !window.StacklyEmail.valid(emailField.value)) {
                window.StacklyEmail.validate(emailField);
                emailField.focus();
                return;
            }

            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalHtml = submitBtn.innerHTML;

            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Sending...';
            submitBtn.disabled = true;

            // Simulate an API call
            setTimeout(() => {
                submitBtn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> Message Sent!';
                submitBtn.classList.add('btn-sent');

                setTimeout(() => {
                    submitBtn.innerHTML = originalHtml;
                    submitBtn.classList.remove('btn-sent');
                    submitBtn.disabled = false;
                    contactForm.reset();
                }, 2500);
            }, 1500);
        });
    }

    /* ========== SMOOTH SCROLL FOR NAV LINKS ========== */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                // Close mobile menu if open
                const navCollapse = document.querySelector('.navbar-collapse.show');
                if (navCollapse) {
                    bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
                }
                window.scrollTo({
                    top: target.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* ========== PARALLAX MOUSE EFFECT ON HERO (Desktop only) ========== */
    if (window.matchMedia('(min-width: 992px)').matches && heroSection) {
        const heroBg = document.querySelector('.hero-bg-video');
        const heroContainer = document.querySelector('.hero-container');

        if (heroBg && heroContainer) {
            let frames = 0;
            const maxFrames = 30;

            const calcBgPos = (x, y) => {
                heroBg.style.transition = 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)';
                heroContainer.style.transition = 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)';

                heroBg.style.transform = `scale(1.05) translate(${x * -22}px, ${y * -22}px)`;
                heroContainer.style.transform = `translate(${x * 14}px, ${y * 14}px)`;
            };

            heroSection.addEventListener('mousemove', (e) => {
                if (frames < maxFrames) {
                    const rect = heroSection.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    calcBgPos(x, y);
                    frames++;
                }
            });

            setTimeout(() => {
                frames = 0;
            }, 500);

            heroSection.addEventListener('mouseleave', () => {
                heroBg.style.transform = 'scale(1.05)';
                heroContainer.style.transform = '';
            });
        }
    }

    /* ========== TILT EFFECT ON TESTIMONIAL CARDS (Desktop) ========== */
    if (window.matchMedia('(min-width: 992px)').matches) {
        const tiltCards = document.querySelectorAll('.testimonial-card, .service-card');

        tiltCards.forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${y * -6}deg) translateY(-8px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }
});

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