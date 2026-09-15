// ============================================================
// app.js — Application Form Logic for ROP Apply
// Requires: schemas.js, utils.js (loaded before this script)
// ============================================================

// ── Configuration ─────────────────────────────────────────────
// ⚠️ NOTE: This webhook URL is visible in browser source. Do not
//    share or commit sensitive webhooks. Rotate if compromised.
const CONFIG = {
  WEBHOOK_URL: 'https://discord.com/api/webhooks/1549381519670247534/OfCuGQpWqXXDG51Z9rYurHP1ojHLiAax3abCl-RNtZI3OmQ7nz-g0zbaR9CWRLUlz_p0',
  SERVER_NAME: 'aerogrowth',
  DISCORD_INVITE: 'https://discord.gg/EeA7zbjpM3',
  PUBLIC_SITE_URL: 'https://aerogrowth1.github.io/AeroGrowth-/'
};

// ── Character Limits ─────────────────────────────────────────
// Default max for textareas without a specific maxChars in schema
const DEFAULT_MAX_CHARS = 1000;

function buildReviewBaseUrl() {
  const isFileOrigin = window.location.protocol === 'file:' || !window.location.origin || window.location.origin === 'null';
  if (isFileOrigin) return `${CONFIG.PUBLIC_SITE_URL.replace(/\/$/, '')}/review.html`;

  const path = window.location.pathname.replace(/(?:index\.html)?$/, '');
  return `${window.location.origin}${path}review.html`;
}

// ── Draft Save Debounce ───────────────────────────────────────
let draftSaveTimer = null;
const DRAFT_DEBOUNCE_MS = 800;

// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // DOM references
  const form = document.getElementById('staff-app-form');
  const stepNodes = document.querySelectorAll('.step-node');
  const progressBar = document.getElementById('progress-indicator');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');
  const statusCard = document.getElementById('status-card');
  const statusIconSuccess = document.getElementById('status-icon-success');
  const statusIconError = document.getElementById('status-icon-error');
  const statusTitle = document.getElementById('status-title');
  const statusMessage = document.getElementById('status-message');
  const statusResetBtn = document.getElementById('status-reset-btn');
  const dynamicContainer = document.getElementById('dynamic-sections-container');
  const draftBanner = document.getElementById('draft-banner');
  const draftRoleLabel = document.getElementById('draft-role-label');
  const draftRestoreBtn = document.getElementById('draft-restore-btn');
  const draftClearBtn = document.getElementById('draft-clear-btn');
  const cooldownBanner = document.getElementById('cooldown-banner');
  const cooldownTime = document.getElementById('cooldown-time');

  let currentStep = 1;
  const totalSteps = 5;
  let selectedRole = document.querySelector('input[name="role"]:checked').value;
  let isSubmitting = false;

  // ── Initial Setup ──────────────────────────────────────────
  renderDynamicSteps(selectedRole);
  updateNavigation();
  checkForDrafts();

  // ── Role Selection ─────────────────────────────────────────
  form.querySelectorAll('input[name="role"]').forEach(radio => {
    radio.addEventListener('change', e => {
      selectedRole = e.target.value;
      renderDynamicSteps(selectedRole);
      if (currentStep > 1) currentStep = 1;
      updateNavigation();
      checkForDrafts(); // Check if a draft exists for the newly selected role
    });
  });

  // ── Navigation ─────────────────────────────────────────────
  nextBtn.addEventListener('click', () => {
    if (validateStep(currentStep)) {
      currentStep++;
      updateNavigation();
      scheduleDraftSave();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      updateNavigation();
    }
  });

  // Clear invalid state on input change (static step 1 fields)
  form.querySelectorAll('.form-section[data-section="1"] input').forEach(el => {
    el.addEventListener('input', () => {
      el.closest('.form-group')?.classList.remove('invalid');
      scheduleDraftSave();
    });
    el.addEventListener('change', () => {
      el.closest('.form-group')?.classList.remove('invalid');
      scheduleDraftSave();
    });
  });

  // ── Draft Restore / Clear ──────────────────────────────────
  draftRestoreBtn?.addEventListener('click', restoreDraft);
  draftClearBtn?.addEventListener('click', () => {
    clearDraft(selectedRole);
    hideDraftBanner();
  });


  // ── Draft Banner Logic ─────────────────────────────────────
  function checkForDrafts() {
    const draft = loadDraft(selectedRole);
    const hasDraftData = draft && draft.data && Object.keys(draft.data).length > 1;

    if (hasDraftData) {
      const schema = ROLE_SCHEMAS[selectedRole];
      if (draftRoleLabel) setTextSafe(draftRoleLabel, schema?.title || selectedRole);
      showDraftBanner();
    } else {
      hideDraftBanner();
    }
  }

  function showDraftBanner() {
    draftBanner?.classList.remove('hidden');
  }

  function hideDraftBanner() {
    draftBanner?.classList.add('hidden');
  }

  function restoreDraft() {
    const draft = loadDraft(selectedRole);
    if (!draft?.data) return;

    const staticFields = ['discord_tag', 'discord_id', 'age', 'timezone'];
    staticFields.forEach(id => {
      const el = document.getElementById(id);
      if (el && draft.data[id] !== undefined) el.value = draft.data[id];
    });

    if (draft.data.role) {
      const radio = document.querySelector(`input[name="role"][value="${draft.data.role}"]`);
      if (radio) {
        radio.checked = true;
        selectedRole = draft.data.role;
      }
    }

    renderDynamicSteps(selectedRole);
    updateNavigation();

    requestAnimationFrame(() => {
      const schema = ROLE_SCHEMAS[selectedRole];
      if (schema) {
        schema.questions.forEach(q => {
          const el = document.getElementById(q.id);
          if (!el || draft.data[q.id] === undefined) return;
          if (el.type === 'checkbox') {
            el.checked = draft.data[q.id] === 'Yes, I agree';
          } else {
            el.value = draft.data[q.id];
          }
          updateCharCounter(el, q);
        });
      }

      if (typeof draft.data.currentStep === 'number') {
        currentStep = Math.min(Math.max(draft.data.currentStep, 1), totalSteps);
        updateNavigation();
      }

      hideDraftBanner();
    });
  }

  // ── Draft Auto-Save ────────────────────────────────────────
  function scheduleDraftSave() {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(performDraftSave, DRAFT_DEBOUNCE_MS);
  }

  function performDraftSave() {
    const data = collectCurrentValues();
    const hasMeaningfulInput = Object.entries(data).some(([key, value]) => {
      if (key === 'role' || key === 'currentStep') return true;
      return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
    });

    if (hasMeaningfulInput) {
      saveDraft(selectedRole, { ...data, currentStep });
      checkForDrafts();
    }
  }

  function collectCurrentValues() {
    const data = {};
    data.role = selectedRole;
    data.currentStep = currentStep;

    const staticFields = ['discord_tag', 'discord_id', 'age', 'timezone'];
    staticFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) data[id] = el.value.trim();
    });

    const schema = ROLE_SCHEMAS[selectedRole];
    if (schema) {
      schema.questions.forEach(q => {
          const el = form.elements.namedItem(q.id);
        if (!el) return;
          data[q.id] = el.type === 'checkbox' ? (el.checked ? 'Yes, I agree' : '') : String(el.value || '').trim();
      });
    }
    return data;
  }

  // ── Dynamic Step Rendering ─────────────────────────────────
  function renderDynamicSteps(roleKey) {
    const schema = ROLE_SCHEMAS[roleKey];
    dynamicContainer.innerHTML = '';

    const stepMeta = {
      2: { title: 'Step 2: Role Details & Commitment', desc: 'Provide specific details about your availability and qualifications for the role.' },
      3: { title: 'Step 3: Background & Motivation', desc: 'Tell us why you want to join and what experiences you bring.' },
      4: { title: 'Step 4: Scenarios & Decision-Making', desc: 'Describe how you handle specific situations or conflicts.' },
      5: { title: 'Step 5: Agreement & Miscellaneous', desc: 'Almost done! Review the guidelines and provide any final details.' }
    };

    [2, 3, 4, 5].forEach(stepNum => {
      const section = document.createElement('section');
      section.className = 'form-section';
      section.dataset.section = stepNum;

      const meta = stepMeta[stepNum];
      section.innerHTML = `
        <h2 class="section-title">${meta.title}</h2>
        <p class="section-description">${meta.desc}</p>
      `;

      schema.questions
        .filter(q => q.step === stepNum)
        .forEach(q => {
          const group = buildFieldGroup(q);
          section.appendChild(group);
        });

      dynamicContainer.appendChild(section);
    });

    // Attach input listeners to dynamic fields
    dynamicContainer.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input', () => {
        el.closest('.form-group')?.classList.remove('invalid');
        scheduleDraftSave();
      });
      el.addEventListener('change', () => {
        el.closest('.form-group')?.classList.remove('invalid');
        scheduleDraftSave();
      });
    });
  }

  /**
   * Build a complete form-group div for a question schema entry.
   */
  function buildFieldGroup(q) {
    const group = document.createElement('div');
    group.className = 'form-group';

    // Label
    if (q.type !== 'checkbox') {
      const label = document.createElement('label');
      label.setAttribute('for', q.id);
      label.innerHTML = `${q.label} ${q.required ? '<span class="required">*</span>' : ''}`;
      group.appendChild(label);
    } else {
      const label = document.createElement('label');
      label.innerHTML = `Agreement <span class="required">*</span>`;
      group.appendChild(label);
    }

    // Input element
    let input;
    const maxChars = q.maxChars || DEFAULT_MAX_CHARS;

    if (q.type === 'textarea') {
      input = document.createElement('textarea');
      input.id = q.id;
      input.name = q.id;
      input.rows = 4;
      input.placeholder = q.placeholder || '';
      input.maxLength = maxChars;
      if (q.required) input.required = true;

      // Character counter
      const counter = document.createElement('div');
      counter.className = 'char-counter';
      counter.id = `counter-${q.id}`;
      counter.textContent = `0 / ${maxChars}`;
      group.appendChild(input);
      group.appendChild(counter);

      input.addEventListener('input', () => updateCharCounter(input, q));

    } else if (q.type === 'text') {
      input = document.createElement('input');
      input.type = 'text';
      input.id = q.id;
      input.name = q.id;
      input.placeholder = q.placeholder || '';
      if (q.required) input.required = true;
      group.appendChild(input);

    } else if (q.type === 'number') {
      input = document.createElement('input');
      input.type = 'number';
      input.id = q.id;
      input.name = q.id;
      input.placeholder = q.placeholder || '';
      if (q.min !== undefined) input.min = q.min;
      if (q.max !== undefined) input.max = q.max;
      if (q.required) input.required = true;
      group.appendChild(input);

    } else if (q.type === 'select') {
      input = document.createElement('select');
      input.id = q.id;
      input.name = q.id;
      if (q.required) input.required = true;
      q.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        input.appendChild(option);
      });
      group.appendChild(input);

    } else if (q.type === 'checkbox') {
      const wrapper = document.createElement('label');
      wrapper.className = 'checkbox-container';
      wrapper.setAttribute('for', q.id);

      input = document.createElement('input');
      input.type = 'checkbox';
      input.id = q.id;
      input.name = q.id;
      input.value = 'Yes, I agree';
      if (q.required) input.required = true;

      const checkmark = document.createElement('span');
      checkmark.className = 'checkmark';

      const checkLabel = document.createElement('span');
      checkLabel.className = 'checkbox-label';
      checkLabel.textContent = q.checkboxLabel || '';

      wrapper.appendChild(input);
      wrapper.appendChild(checkmark);
      wrapper.appendChild(checkLabel);
      group.appendChild(wrapper);
    }

    // Error message
    const errSpan = document.createElement('span');
    errSpan.className = 'error-msg';
    errSpan.id = `error-${q.id}`;
    errSpan.textContent = q.type === 'checkbox' ? 'You must agree to continue.' : 'Please fill out this field.';
    group.appendChild(errSpan);

    // Helper text
    if (q.helperText) {
      const helper = document.createElement('small');
      helper.className = 'helper-text';
      helper.textContent = q.helperText;
      group.appendChild(helper);
    }

    return group;
  }

  // ── Character Counter Update ───────────────────────────────
  function updateCharCounter(textarea, q) {
    const maxChars = q.maxChars || DEFAULT_MAX_CHARS;
    const counter = document.getElementById(`counter-${q.id}`);
    if (!counter) return;

    const len = textarea.value.length;
    const ratio = len / maxChars;

    counter.textContent = `${len.toLocaleString()} / ${maxChars.toLocaleString()}`;
    counter.classList.remove('char-counter--warn', 'char-counter--danger');

    if (ratio >= 0.95) counter.classList.add('char-counter--danger');
    else if (ratio >= 0.75) counter.classList.add('char-counter--warn');
  }

  // ── Navigation Update ──────────────────────────────────────
  function updateNavigation() {
    document.querySelectorAll('.form-section').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.section) === currentStep);
    });

    stepNodes.forEach(n => {
      const step = parseInt(n.dataset.step);
      n.classList.remove('active', 'completed');
      if (step === currentStep) n.classList.add('active');
      else if (step < currentStep) n.classList.add('completed');
    });

    const pct = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressBar.style.width = `${pct}%`;

    prevBtn.classList.toggle('disabled', currentStep === 1);
    prevBtn.disabled = currentStep === 1;
    nextBtn.classList.toggle('hidden', currentStep === totalSteps);
    submitBtn.classList.toggle('hidden', currentStep !== totalSteps);


    document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Validation ─────────────────────────────────────────────
  function validateStep(step) {
    const section = document.querySelector(`.form-section[data-section="${step}"]`);
    if (!section) return true;
    let isValid = true;

    section.querySelectorAll('input, textarea, select').forEach(input => {
      // Skip honeypot field — it should always be empty
      if (input.id === 'hp_field') return;

      const group = input.closest('.form-group');
      let fieldValid = true;

      if (input.hasAttribute('required')) {
        fieldValid = input.type === 'checkbox' ? input.checked : input.value.trim() !== '';
      }

      // Additional field-level validation
      if (fieldValid) {
        if (input.id === 'discord_id') {
          fieldValid = /^\d{17,19}$/.test(input.value.trim());
        } else if (input.id === 'age') {
          const v = parseInt(input.value, 10);
          fieldValid = !isNaN(v) && v >= 13 && v <= 100;
        } else if (input.id === 'hours_active') {
          const v = parseInt(input.value, 10);
          fieldValid = !isNaN(v) && v >= 1 && v <= 168;
        }
      }

      group?.classList.toggle('invalid', !fieldValid);
      if (!fieldValid) isValid = false;
    });

    return isValid;
  }

  // ── Form Submission ────────────────────────────────────────
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateStep(currentStep)) return;

    // Honeypot check — real users won't fill this
    const honeypot = document.getElementById('hp_field');
    if (honeypot && honeypot.value.trim() !== '') {
      // Silently succeed for bots (don't reveal detection)
      showSuccess('APP-BOT-00000');
      return;
    }


    const schema = ROLE_SCHEMAS[selectedRole];

    // Collect payload
    const payload = {
      role: selectedRole,
      role_title: schema.title,
      discord_tag: document.getElementById('discord_tag').value.trim(),
      discord_id: document.getElementById('discord_id').value.trim(),
      age: document.getElementById('age').value.trim(),
      timezone: document.getElementById('timezone').value.trim()
    };

    schema.questions.forEach(q => {
      const el = form.elements.namedItem(q.id);
      if (el) {
        payload[q.id] = el.type === 'checkbox' ? (el.checked ? 'Yes, I agree' : '') : String(el.value || '').trim();
      }
    });

    // Duplicate ID check (warn, but don't hard-block)
    if (isDuplicateId(payload.discord_id)) {
      const proceed = confirm(
        `Warning: A previous application was already submitted from this browser with the Discord ID "${payload.discord_id}".\n\nDo you want to submit again anyway?`
      );
      if (!proceed) return;
    }

    // Generate Application ID
    const appId = generateAppId();
    payload.app_id = appId;

    // Show loading state
    isSubmitting = true;
    form.classList.add('hidden');
    document.querySelector('.progress-container')?.classList.add('hidden');
    statusCard.classList.remove('hidden');
    statusIconSuccess.classList.add('hidden');
    statusIconError.classList.add('hidden');
    setTextSafe(statusTitle, 'Submitting…');
    setTextSafe(statusMessage, 'Sending your application to the staff review room. Please wait…');
    statusResetBtn.classList.add('hidden');

    try {
      // Build review URL
      const reviewBase = buildReviewBaseUrl();
      const jsonStr = JSON.stringify(payload);
      let answersParam = encodeURIComponent(jsonStr);

      if (typeof CompressionStream !== 'undefined') {
        const compressed = await compressPayload(jsonStr);
        if (compressed) answersParam = 'c:' + compressed;
      }

      const encodedTag = encodeURIComponent(payload.discord_tag);
      const baseUrl = reviewBase ? `${reviewBase}?tag=${encodedTag}&answers=${answersParam}` : null;
      const approveUrl = baseUrl ? `${baseUrl}&action=approve` : null;
      const rejectUrl = baseUrl ? `${baseUrl}&action=reject` : null;

      // Profile embed fields
      const profileFields = [
        { name: '🆔 Application ID', value: `\`${appId}\``, inline: true },
        { name: '📋 Applied Role', value: safeVal(schema.title), inline: true },
        { name: '💬 Discord Username', value: safeVal(payload.discord_tag), inline: true },
        { name: '🔢 Discord User ID', value: `\`${safeVal(payload.discord_id)}\``, inline: true },
        { name: '🎂 Age', value: safeVal(payload.age), inline: true },
        { name: '🌍 Timezone / Country', value: safeVal(payload.timezone), inline: true },
        { name: '⏱️ Hours / Week', value: payload.hours_active ? `${payload.hours_active} hrs` : 'N/A', inline: true },
      ];

      if (payload.media_role) profileFields.push({ name: 'Specialization', value: payload.media_role, inline: true });
      if (payload.portfolio) profileFields.push({ name: 'Portfolio', value: payload.portfolio, inline: true });

      // Build the single application embed. Discord allows up to 25 fields per embed.
      const reviewActionText = baseUrl
        ? `**Review actions:**\n` +
          `• [🟢 Open Portal & Approve](${approveUrl})\n` +
          `• [🔴 Open Portal & Reject](${rejectUrl})`
        : `**Review note:** Open the app from a hosted web URL to approve or reject this application.`;

      const skipKeys = ['hours_active', 'media_role', 'portfolio', 'guidelines_agree'];
      const detailQs = schema.questions.filter(q => !skipKeys.includes(q.id));

      const questionFields = detailQs.map((q, i) => ({
        name: `${i + 1}. ${q.label}`,
        value: formatEmbedValue(payload[q.id]),
        inline: false
      }));

      const embed = {
        author: {
          name: 'aerogrowth • Staff Intake',
          icon_url: 'https://cdn.discordapp.com/embed/avatars/1.png'
        },
        title: `📝 New ${schema.title} Application • ${payload.discord_tag}`,
        description:
          `A new **${schema.title}** application has been submitted for review.\n\n` +
          reviewActionText,
        color: schema.color || 0x6C63FF,
        fields: [...profileFields, ...questionFields],
        footer: { text: `Application ID: ${appId} • ${CONFIG.SERVER_NAME}` },
        timestamp: new Date().toISOString()
      };

      const webhookBody = {
        username: 'aerogrowth • Staff Intake',
        avatar_url: 'https://cdn.discordapp.com/embed/avatars/2.png',
        embeds: [embed],
      };

      const resp = await sendWithRetry(CONFIG.WEBHOOK_URL, webhookBody);

      if (resp.ok || resp.status === 204) {
        // Record anti-spam data
        recordCooldown();
        recordSubmittedId(payload.discord_id);

        // Record to local dashboard history
        recordSubmission({
          appId,
          discordTag: payload.discord_tag,
          discordId: payload.discord_id,
          role: selectedRole,
          roleTitle: schema.title,
          status: 'pending'
        });

        // Clear draft on success
        clearDraft(selectedRole);

        showSuccess(appId);
      } else {
        const err = await resp.text();
        throw new Error(`Discord returned ${resp.status}: ${err}`);
      }

    } catch (error) {
      isSubmitting = false;
      statusIconError.classList.remove('hidden');
      setTextSafe(statusTitle, 'Submission Failed');
      setTextSafe(statusMessage, error.message || 'Could not send your application. Please check your connection and try again.');
      statusResetBtn.classList.remove('hidden');
    }
  });

  function showSuccess(appId) {
    statusIconSuccess.classList.remove('hidden');
    setTextSafe(statusTitle, 'Application Submitted! 🎉');
    setTextSafe(statusMessage, 'Your application was sent to the staff review room. You will be notified on Discord once a decision is made.');
  }

  // ── Reset Button ───────────────────────────────────────────
  statusResetBtn.addEventListener('click', () => {
    isSubmitting = false;
    statusCard.classList.add('hidden');
    document.querySelector('.progress-container')?.classList.remove('hidden');
    form.classList.remove('hidden');
    currentStep = 1;
    updateNavigation();
  });
});
