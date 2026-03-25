/**
 * Credit Application Form — Client-Side Logic
 * Casa Castelao
 *
 * Handles:
 *  - Toggling company / personal sections
 *  - CUIT mask formatting (XX-XXXXXXXX-X)
 *  - File size validation (max 5 MB)
 *  - Terms checkbox → submit button enable/disable
 *  - Submit loading state
 */
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // ── Elements ────────────────────────────────────────────────────────
    const form = document.getElementById('creditForm');
    if (!form) return; // Not on the form page

    const radios = form.querySelectorAll('input[name="client_type"]');
    const companyFields = document.getElementById('companyFields');
    const personalFields = document.getElementById('personalFields');
    const companyDocs = document.getElementById('companyDocs');
    const personalDocs = document.getElementById('personalDocs');
    const acceptTerms = document.getElementById('accept_terms');
    const submitBtn = document.getElementById('submitBtn');
    const cuitInput = document.getElementById('cuit');

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    // ── Toggle company / personal ──────────────────────────────────────
    function toggleSections() {
        const isCompany = form.querySelector('input[name="client_type"]:checked').value === 'company';

        companyFields.style.display = isCompany ? '' : 'none';
        personalFields.style.display = isCompany ? 'none' : '';
        companyDocs.style.display = isCompany ? '' : 'none';
        personalDocs.style.display = isCompany ? 'none' : '';

        // Clear hidden fields so they don't submit stale data
        const hiddenBlock = isCompany ? personalFields : companyFields;
        hiddenBlock.querySelectorAll('input').forEach(function (el) { el.value = ''; });

        const hiddenDocs = isCompany ? personalDocs : companyDocs;
        hiddenDocs.querySelectorAll('input[type="file"]').forEach(function (el) { el.value = ''; });
    }

    radios.forEach(function (radio) {
        radio.addEventListener('change', toggleSections);
    });

    // ── CUIT mask (basic: XX-XXXXXXXX-X) ───────────────────────────────
    if (cuitInput) {
        cuitInput.addEventListener('input', function () {
            var raw = this.value.replace(/\D/g, '').substring(0, 11);
            var formatted = '';
            if (raw.length > 2) {
                formatted = raw.substring(0, 2) + '-';
                if (raw.length > 10) {
                    formatted += raw.substring(2, 10) + '-' + raw.substring(10, 11);
                } else {
                    formatted += raw.substring(2);
                }
            } else {
                formatted = raw;
            }
            this.value = formatted;
        });
    }

    // ── File size validation ───────────────────────────────────────────
    form.querySelectorAll('.credit-file-input').forEach(function (fileInput) {
        fileInput.addEventListener('change', function () {
            // Remove previous feedback
            var prev = this.parentNode.querySelector('.credit-file-error, .credit-file-ok');
            if (prev) prev.remove();

            if (this.files && this.files[0]) {
                var file = this.files[0];
                var feedback = document.createElement('div');

                if (file.size > MAX_FILE_SIZE) {
                    feedback.className = 'credit-file-error';
                    feedback.textContent = '⚠ El archivo supera los 5 MB. Por favor, elegí uno más liviano.';
                    this.value = ''; // Reset
                } else {
                    feedback.className = 'credit-file-ok';
                    feedback.textContent = '✓ ' + file.name + ' (' + (file.size / 1024 / 1024).toFixed(2) + ' MB)';
                }
                this.parentNode.appendChild(feedback);
            }
        });
    });

    // ── Terms → enable submit ─────────────────────────────────────────
    if (acceptTerms && submitBtn) {
        acceptTerms.addEventListener('change', function () {
            submitBtn.disabled = !this.checked;
        });
    }

    // ── Submit loading state ──────────────────────────────────────────
    if (form) {
        form.addEventListener('submit', function (e) {
            // Basic required-field validation for visible sections
            var isCompany = form.querySelector('input[name="client_type"]:checked').value === 'company';
            var requiredOk = true;

            var requiredFields = isCompany
                ? ['company_name', 'cuit', 'email_corp', 'compras_name', 'compras_mail', 'compras_phone', 'pagos_name', 'pagos_mail', 'pagos_phone', 'cbu_alias']
                : ['full_name', 'dni_cuit', 'email_contact', 'phone', 'cbu_alias_personal'];

            var firstError = null;
            requiredFields.forEach(function (id) {
                var el = document.getElementById(id);
                if (!el || !el.value.trim()) {
                    requiredOk = false;
                    if (el) {
                        el.style.borderColor = '#e53935';
                        if (!firstError) firstError = el;
                    }
                }
            });
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });

            if (!requiredOk) {
                e.preventDefault();
                return;
            }

            if (!acceptTerms.checked) {
                e.preventDefault();
                return;
            }

            // Show spinner
            submitBtn.classList.add('loading');
            submitBtn.textContent = 'Enviando…';
        });
    }

    // ── Clear error border on focus ───────────────────────────────────
    form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]')
        .forEach(function (el) {
            el.addEventListener('focus', function () {
                this.style.borderColor = '';
            });
        });
});
