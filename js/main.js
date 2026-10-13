/**
 * ==============================================================================
 * GUNN FULWANI — PERSONAL PORTFOLIO JAVASCRIPT CONTROLLER
 * University JavaScript Assignment (CA3)
 * Demonstrates: DOM manipulation, Event delegation, IntersectionObserver APIs,
 *               Form live validation, Web Animations/Timeline, Clipboard API,
 *               Accordion ARIA patterns, and Reduced Motion handling.
 * ==============================================================================
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* --------------------------------------------------------------------------
     1. GLOBAL CONFIGURATION & REDUCED MOTION CHECK
     -------------------------------------------------------------------------- */
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = motionQuery.matches;

  motionQuery.addEventListener('change', (e) => {
    prefersReducedMotion = e.matches;
    if (prefersReducedMotion) {
      settleIntroImmediately();
    }
  });

  /* --------------------------------------------------------------------------
     2. HERO INTRO TIMELINE CONTROLLER
     Manages the signature 0ms - 3200ms cinematic intro sequence.
     Includes skip on click/keypress, replay via "GF" monogram, and sessionStorage.
     -------------------------------------------------------------------------- */
  const introStage = document.getElementById('introStage');
  const heroWord = document.getElementById('heroWord');
  const monogramBtn = document.getElementById('monogramBtn');
  let introTimeouts = [];
  let isIntroPlaying = false;

  // Clear all pending timeline timeouts
  function clearIntroTimers() {
    introTimeouts.forEach(t => clearTimeout(t));
    introTimeouts = [];
  }

  // Settle intro immediately into its completed, crisp, fully interactive state
  function settleIntroImmediately() {
    clearIntroTimers();
    isIntroPlaying = false;
    document.body.setAttribute('data-intro', 'settled');
    if (heroWord) {
      heroWord.classList.remove('halftone-active');
    }
    sessionStorage.setItem('gf_intro_played', 'true');
  }

  // Play full 3.2s choreographed timeline
  function playIntroTimeline() {
    clearIntroTimers();
    isIntroPlaying = true;
    document.body.setAttribute('data-intro', 'initial');
    if (heroWord) {
      heroWord.classList.add('halftone-active');
    }

    // 0-300ms: Black screen held (data-intro="initial")

    // 300-1000ms: Word and small pills pop in, glass pills pop in over word
    introTimeouts.push(setTimeout(() => {
      document.body.setAttribute('data-intro', 'entering');
    }, 300));

    // 1000-1600ms: Hold
    introTimeouts.push(setTimeout(() => {
      document.body.setAttribute('data-intro', 'holding');
    }, 1000));

    // 1600-2400ms: Glass pills slide left/right, blur 8px -> 0, halftone dissolves
    introTimeouts.push(setTimeout(() => {
      document.body.setAttribute('data-intro', 'sliding');
      if (heroWord) {
        heroWord.classList.remove('halftone-active');
      }
    }, 1600));

    // 2400-3200ms: Sequential reveal of identity line, sparkline, status chip, links, nav
    introTimeouts.push(setTimeout(() => {
      document.body.setAttribute('data-intro', 'revealing');
    }, 2400));

    // 3200ms+: Final settled state, word perfectly crisp
    introTimeouts.push(setTimeout(() => {
      settleIntroImmediately();
    }, 3200));
  }

  // Initialization: check session storage & motion preferences
  const hasIntroPlayed = sessionStorage.getItem('gf_intro_played') === 'true';

  if (prefersReducedMotion || hasIntroPlayed) {
    settleIntroImmediately();
  } else {
    playIntroTimeline();
  }

  // Skip intro on user interaction (Click anywhere or any keypress during playback)
  function handleUserSkip(e) {
    if (!isIntroPlaying) return;
    // Don't skip if clicking the monogram directly (which replays)
    if (monogramBtn && monogramBtn.contains(e.target)) return;
    settleIntroImmediately();
  }

  window.addEventListener('click', handleUserSkip);
  window.addEventListener('keydown', (e) => {
    // Avoid skipping when user uses Tab to navigate
    if (e.key !== 'Tab') {
      handleUserSkip(e);
    }
  });

  // Replay intro when user clicks the "GF" monogram
  if (monogramBtn) {
    monogramBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      playIntroTimeline();
    });
  }

  /* --------------------------------------------------------------------------
     3. SCROLL-DRIVEN TRENDLINE MOTIF (LEFT GUTTER)
     Draws progressively based on window scroll progress using requestAnimationFrame.
     -------------------------------------------------------------------------- */
  const trendlinePath = document.getElementById('trendlinePath');
  const trendlineDot = document.getElementById('trendlineDot');
  let isScrollTicking = false;

  function updateTrendlineProgress() {
    if (!trendlinePath || !trendlineDot) return;
    if (window.innerWidth <= 860 || prefersReducedMotion) {
      isScrollTicking = false;
      return;
    }

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPos = window.scrollY;
    const progress = docHeight > 0 ? Math.min(Math.max(scrollPos / docHeight, 0), 1) : 0;

    // SVG path length = 1000 in viewBox
    const lineLength = 1000;
    const offset = lineLength - (progress * lineLength);

    trendlinePath.style.strokeDasharray = `${lineLength}`;
    trendlinePath.style.strokeDashoffset = `${offset}`;
    trendlineDot.setAttribute('cy', `${progress * lineLength}`);

    isScrollTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!isScrollTicking) {
      window.requestAnimationFrame(updateTrendlineProgress);
      isScrollTicking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    updateTrendlineProgress();
  }, { passive: true });

  // Initial calculation
  updateTrendlineProgress();

  /* --------------------------------------------------------------------------
     4. INTERSECTION OBSERVER: SCROLL REVEALS
     Subtly reveals sections and elements with fade-up 16px as they enter viewport.
     -------------------------------------------------------------------------- */
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // Reveal once
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.12
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback for browsers without IntersectionObserver
    revealElements.forEach(el => el.classList.add('is-visible'));
  }

  /* --------------------------------------------------------------------------
     5. INTERSECTION OBSERVER: ACTIVE NAV SECTION HIGHLIGHTING
     Tracks scroll position to highlight active section in primary navigation.
     -------------------------------------------------------------------------- */
  const navLinks = document.querySelectorAll('.nav-link[data-nav]');
  const contentSections = document.querySelectorAll('section[id]');

  if ('IntersectionObserver' in window && navLinks.length > 0) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            if (link.getAttribute('data-nav') === sectionId) {
              link.classList.add('active');
              link.setAttribute('aria-current', 'page');
            } else {
              link.classList.remove('active');
              link.removeAttribute('aria-current');
            }
          });
        }
      });
    }, {
      root: null,
      rootMargin: '-30% 0px -50% 0px',
      threshold: 0
    });

    contentSections.forEach(sec => sectionObserver.observe(sec));
  }

  /* --------------------------------------------------------------------------
     6. WORK TICKER ACCORDION (ARIA-EXPANDED & SMOOTH EXPANSION)
     Rule: Only one row open at a time; smooth height transition.
     -------------------------------------------------------------------------- */
  const tickerRows = document.querySelectorAll('.ticker-row');

  tickerRows.forEach(row => {
    const headerBtn = row.querySelector('.ticker-header');
    const drawer = row.querySelector('.ticker-drawer');
    const toggleIcon = row.querySelector('.ticker-toggle-btn');

    if (!headerBtn || !drawer) return;

    headerBtn.addEventListener('click', () => {
      const isCurrentlyOpen = row.classList.contains('is-open');

      // Close all rows first
      tickerRows.forEach(otherRow => {
        otherRow.classList.remove('is-open');
        const otherBtn = otherRow.querySelector('.ticker-header');
        const otherIcon = otherRow.querySelector('.ticker-toggle-btn');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        if (otherIcon) otherIcon.textContent = '+';
      });

      // If the clicked row was not open, open it
      if (!isCurrentlyOpen) {
        row.classList.add('is-open');
        headerBtn.setAttribute('aria-expanded', 'true');
        if (toggleIcon) toggleIcon.textContent = '−';
      }
    });

    // Keyboard accessibility for Enter / Space handled natively on <button>
  });

  /* --------------------------------------------------------------------------
     7. WORK FILTER CHIPS SYSTEM
     Filters ticker rows (All / Data / SQL / Finance) with smooth fade transitions.
     -------------------------------------------------------------------------- */
  const filterChips = document.querySelectorAll('.filter-chip');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const selectedFilter = chip.getAttribute('data-filter');

      // Update chip active states
      filterChips.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');

      // Filter rows
      tickerRows.forEach(row => {
        const categories = (row.getAttribute('data-category') || '').split(' ');
        if (selectedFilter === 'all' || categories.includes(selectedFilter)) {
          row.classList.remove('filtered-out');
          row.style.opacity = '1';
        } else {
          row.classList.add('filtered-out');
          // Close row if open
          row.classList.remove('is-open');
          const btn = row.querySelector('.ticker-header');
          const icon = row.querySelector('.ticker-toggle-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
          if (icon) icon.textContent = '+';
        }
      });
    });
  });

  /* --------------------------------------------------------------------------
     8. ANIMATED COUNT-UP NUMBERS
     Interpolates metrics on first viewport appearance.
     -------------------------------------------------------------------------- */
  const countUpElements = document.querySelectorAll('[data-countup]');

  function animateMetric(el, type) {
    if (prefersReducedMotion) return;

    const startTime = performance.now();
    const duration = 1400; // ms

    function frame(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      // Smooth ease-out expo curve
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      if (type === 'sip') {
        const niftyVal = Math.round(54 * easeProgress);
        const btcVal = Math.round(615 * easeProgress);
        el.textContent = `₹1K/mo SIP: Nifty +${niftyVal}% · Bitcoin +${btcVal}%`;
      } else if (type === 'health') {
        const lakhVal = (5.17 * easeProgress).toFixed(2);
        const datasetsVal = Math.round(7 * easeProgress);
        el.textContent = `${lakhVal} lakh records · ${datasetsVal} datasets`;
      }

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window && countUpElements.length > 0) {
    const countObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const metricType = entry.target.getAttribute('data-countup');
          animateMetric(entry.target, metricType);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    countUpElements.forEach(el => countObserver.observe(el));
  }

  /* --------------------------------------------------------------------------
     9. CLIPBOARD COPY & TOAST NOTIFICATION
     Copies Gunn's email to clipboard with friendly feedback toast.
     -------------------------------------------------------------------------- */
  const copyBtn = document.getElementById('copyEmailBtn');
  const emailTextEl = document.getElementById('emailText');
  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-active');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-active');
    }, 2600);
  }

  if (copyBtn && emailTextEl) {
    copyBtn.addEventListener('click', async () => {
      const email = emailTextEl.textContent.trim();

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
        } else {
          // Fallback for non-https/file environments
          const textArea = document.createElement('textarea');
          textArea.value = email;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        showToast(`Email copied: ${email}`);
      } catch (err) {
        showToast(`Copied: ${email}`);
      }
    });
  }

  /* --------------------------------------------------------------------------
     10. CONTACT FORM LIVE VALIDATION & MAILTO SUBMISSION
     Validates name, email format, and message length before enabling submit button.
     -------------------------------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  const nameInput = document.getElementById('senderName');
  const emailInput = document.getElementById('senderEmail');
  const messageInput = document.getElementById('senderMessage');
  const submitBtn = document.getElementById('submitBtn');
  const formFeedback = document.getElementById('formFeedback');

  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const messageError = document.getElementById('messageError');

  // RFC compliant simple email regex
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  function validateField(input, errorEl, isValid) {
    if (!isValid && input.value.trim().length > 0) {
      input.classList.add('is-invalid');
      if (errorEl) errorEl.classList.add('is-visible');
    } else {
      input.classList.remove('is-invalid');
      if (errorEl) errorEl.classList.remove('is-visible');
    }
  }

  function checkFormValidity() {
    if (!nameInput || !emailInput || !messageInput || !submitBtn) return false;

    const isNameValid = nameInput.value.trim().length >= 2;
    const isEmailValid = emailPattern.test(emailInput.value.trim());
    const isMessageValid = messageInput.value.trim().length >= 10;

    const isAllValid = isNameValid && isEmailValid && isMessageValid;
    submitBtn.disabled = !isAllValid;
    return isAllValid;
  }

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      const isValid = nameInput.value.trim().length >= 2;
      validateField(nameInput, nameError, isValid);
      checkFormValidity();
    });
    nameInput.addEventListener('blur', () => {
      validateField(nameInput, nameError, nameInput.value.trim().length >= 2);
    });
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      const isValid = emailPattern.test(emailInput.value.trim());
      validateField(emailInput, emailError, isValid);
      checkFormValidity();
    });
    emailInput.addEventListener('blur', () => {
      validateField(emailInput, emailError, emailPattern.test(emailInput.value.trim()));
    });
  }

  if (messageInput) {
    messageInput.addEventListener('input', () => {
      const isValid = messageInput.value.trim().length >= 10;
      validateField(messageInput, messageError, isValid);
      checkFormValidity();
    });
    messageInput.addEventListener('blur', () => {
      validateField(messageInput, messageError, messageInput.value.trim().length >= 10);
    });
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!checkFormValidity()) return;

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const message = messageInput.value.trim();

      const subject = encodeURIComponent(`Portfolio Inquiry from ${name}`);
      const body = encodeURIComponent(`Hi Gunn,\n\n${message}\n\nFrom: ${name} (${email})`);
      const mailtoLink = `mailto:fulwanigunn06@gmail.com?subject=${subject}&body=${body}`;

      if (formFeedback) {
        formFeedback.textContent = 'Opening your email client with your message draft...';
        formFeedback.classList.add('is-visible');
      }

      // Launch default email client
      window.location.href = mailtoLink;

      // Reset form fields
      contactForm.reset();
      submitBtn.disabled = true;

      setTimeout(() => {
        if (formFeedback) formFeedback.classList.remove('is-visible');
      }, 5000);
    });
  }

  /* --------------------------------------------------------------------------
     11. MOBILE NAVIGATION TOGGLE & ACCESSIBILITY
     Handles drawer expansion, keyboard ESC closing, and aria-expanded state.
     -------------------------------------------------------------------------- */
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const primaryNav = document.getElementById('primaryNav');

  if (mobileNavToggle && primaryNav) {
    mobileNavToggle.addEventListener('click', () => {
      const isExpanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
      mobileNavToggle.setAttribute('aria-expanded', String(!isExpanded));
      primaryNav.classList.toggle('is-active');
    });

    // Close menu when clicking any nav link
    primaryNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNavToggle.setAttribute('aria-expanded', 'false');
        primaryNav.classList.remove('is-active');
      });
    });

    // Close on Escape key press
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && primaryNav.classList.contains('is-active')) {
        mobileNavToggle.setAttribute('aria-expanded', 'false');
        primaryNav.classList.remove('is-active');
        mobileNavToggle.focus();
      }
    });
  }
});
