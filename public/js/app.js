/**
 * Aswathy Associates – Main Frontend JavaScript
 * Handles: Navigation, scroll effects, animations, toast notifications, utilities
 */

// ============================================
// NAVBAR & SCROLL EFFECTS
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const scrollTop = document.getElementById('scrollTop');

  // Navbar scroll effect
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
    // Trigger on load
    if (window.scrollY > 50) navbar.classList.add('scrolled');
  }

  // Mobile nav toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      navToggle.classList.toggle('active');
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!navbar.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
      }
    });
  }

  // Scroll to top button
  if (scrollTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        scrollTop.classList.add('visible');
      } else {
        scrollTop.classList.remove('visible');
      }
    });

    scrollTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================
  // SCROLL ANIMATIONS (IntersectionObserver)
  // ============================================
  const animatedElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .stagger-children > *');

  if (animatedElements.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    animatedElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show everything
    animatedElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ============================================
  // FAQ ACCORDION
  // ============================================
  document.querySelectorAll('.faq-question').forEach(function (question) {
    question.addEventListener('click', function () {
      const item = this.parentElement;
      const isActive = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.faq-item').forEach(function (faq) {
        faq.classList.remove('active');
      });

      // Open clicked if wasn't active
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const hash = this.getAttribute('href');
      if (hash === '#') return;
      e.preventDefault();
      const target = document.querySelector(hash);
      if (target) {
        const offset = navbar ? navbar.offsetHeight + 20 : 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ============================================
  // CONTACT FORM (Home page)
  // ============================================
  const contactForm = document.getElementById('contactFormHome');
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = this.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending...';

      const formData = {
        name: document.getElementById('homeContactName')?.value?.trim(),
        phone: document.getElementById('homeContactPhone')?.value?.trim(),
        email: document.getElementById('homeContactEmail')?.value?.trim(),
        service_interested: document.getElementById('homeContactService')?.value,
        message: document.getElementById('homeContactMessage')?.value?.trim()
      };

      try {
        const res = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          showToast('Message sent! We will contact you soon.');
          contactForm.reset();
        } else {
          const data = await res.json();
          showToast(data.error || 'Failed to send. Please try again.', 'error');
        }
      } catch (err) {
        showToast('Message sent! (Demo mode)');
        contactForm.reset();
      }

      btn.disabled = false;
      btn.textContent = originalText;
    });
  }
});

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) {
    // Fallback alert
    console.log('[Toast]', type, message);
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:1.2rem;">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${message}</span>
    </div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;font-size:1.2rem;cursor:pointer;opacity:0.7;">×</button>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================
// CHECKLIST DOWNLOAD
// ============================================
function downloadChecklist(type) {
  const checklists = {
    gst: {
      title: 'GST Registration Checklist',
      items: [
        'PAN Card of the business / proprietor',
        'Aadhaar Card of the proprietor / partners / directors',
        'Photograph (passport size)',
        'Business address proof (electricity bill / rent agreement)',
        'Bank account statement / cancelled cheque',
        'Digital Signature Certificate (for companies/LLPs)',
        'Letter of authorization / board resolution',
        'Partnership deed (if partnership firm)',
        'Certificate of Incorporation (if company)',
        'Details of goods/services to be supplied'
      ]
    },
    itr: {
      title: 'Income Tax Return Filing Checklist',
      items: [
        'PAN Card',
        'Aadhaar Card',
        'Form 16 (from employer)',
        'Form 16A (TDS certificates for other income)',
        'Bank statements (all accounts)',
        'Interest certificates (FD, savings)',
        'Investment proofs (80C, 80D, etc.)',
        'Home loan interest certificate (if applicable)',
        'Rental income details (if applicable)',
        'Capital gains statements (if applicable)',
        'Foreign income details (if applicable)',
        'Previous year ITR acknowledgement'
      ]
    },
    company: {
      title: 'Company Registration Checklist',
      items: [
        'Proposed company name (minimum 2 options)',
        'PAN & Aadhaar of all directors',
        'Address proof of all directors',
        'Photograph of all directors',
        'Digital Signature Certificate (DSC)',
        'Director Identification Number (DIN)',
        'Registered office address proof',
        'NOC from property owner',
        'Memorandum of Association (MoA)',
        'Articles of Association (AoA)',
        'Declaration by first directors',
        'Consent to act as director (DIR-2)'
      ]
    },
    msme: {
      title: 'MSME/Udyam Registration Checklist',
      items: [
        'Aadhaar number of the applicant',
        'PAN Card (for partnership/company)',
        'Business name and type',
        'Bank account details',
        'NIC code (activity classification)',
        'Number of employees',
        'Investment in plant & machinery',
        'Annual turnover details',
        'Business address',
        'Date of commencement of business'
      ]
    }
  };

  const checklist = checklists[type];
  if (!checklist) return;

  const content = `
${checklist.title.toUpperCase()}
${'='.repeat(checklist.title.length)}
Prepared by: Aswathy Associates – GST & Auditing
Date: ${new Date().toLocaleDateString('en-IN')}

${checklist.items.map((item, i) => `${i + 1}. [ ] ${item}`).join('\n')}

---
For assistance with ${checklist.title.replace(' Checklist', '')}, contact us:
Phone: 9846 560 665 / 8304 844 504
Email: aswathyandco@gmail.com
WhatsApp: wa.me/919846560665

Aswathy Associates – Your Trusted CA Partner
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${checklist.title.replace(/\s+/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);

  showToast(`${checklist.title} downloaded!`);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format currency
function formatCurrency(amount) {
  return '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// Format date
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// Get auth token
function getToken() {
  return localStorage.getItem('token');
}

// Get current user
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

// Check if logged in
function isLoggedIn() {
  return !!getToken();
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// Counter animation for hero stats
function animateCounters() {
  document.querySelectorAll('.stat-count').forEach(counter => {
    const target = parseInt(counter.dataset.target) || 0;
    const suffix = counter.dataset.suffix || '';
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      counter.textContent = Math.floor(current) + suffix;
    }, 16);
  });
}

// Trigger counter animation when hero is visible
const heroStats = document.querySelector('.hero-stats');
if (heroStats && 'IntersectionObserver' in window) {
  const statsObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      animateCounters();
      statsObserver.disconnect();
    }
  }, { threshold: 0.5 });
  statsObserver.observe(heroStats);
}
