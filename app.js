// ============================================================
// CONFIGURATION — Edit these values for your Discord server
// ============================================================
const CONFIG = {
  WEBHOOK_URL: 'https://discord.com/api/webhooks/1508490753784152229/2wKdOZuCETLKraReRhbHuCkWFJ0B7OsB690dzcSaMF_dxruSjjoG_ScyYdmxJg3kxBvL',
  SERVER_NAME: '|ROP| Right Order Party'
};
// ============================================================

// Compress a JSON string using deflate compression and return a URL-safe Base64 string
async function compressPayload(str) {
  try {
    const stream = new Blob([str]).stream();
    const compressedStream = stream.pipeThrough(new CompressionStream('deflate'));
    const response = new Response(compressedStream);
    const buffer = await response.arrayBuffer();

    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    console.error('Failed to compress payload', e);
    return null;
  }
}

const ROLE_SCHEMAS = {
  discord_staff: {
    title: "Discord Staff Team",
    questions: [
      { id: 'hours_active',   label: 'How many hours per week can you dedicate to the server?', type: 'number', step: 2, min: 1, max: 168, placeholder: 'e.g. 15', required: true },
      { id: 'why_staff',      label: 'Why do you want to join our staff team?', type: 'textarea', step: 2, placeholder: 'Tell us your motivation...', required: true },
      { id: 'experience',     label: 'What prior moderation/staff experience do you have?', type: 'textarea', step: 2, placeholder: 'Mention server names, sizes, or responsibilities...', required: true },
      { id: 'strengths',      label: 'What are your key strengths?', type: 'textarea', step: 2, placeholder: 'What makes you stand out?', required: true },
      
      { id: 'weaknesses',     label: 'What are your weaknesses, and how do you manage them?', type: 'textarea', step: 3, placeholder: 'Be honest - we value self-awareness...', required: true },
      { id: 'stress_handle',  label: 'How do you handle stressful situations or conflict?', type: 'textarea', step: 3, placeholder: 'Explain your coping mechanisms...', required: true },
      { id: 'handle_spam',    label: 'Scenario: A user is spamming links in chat. What do you do?', type: 'textarea', step: 3, placeholder: 'Detail your step-by-step reaction...', required: true },
      { id: 'handle_argument',label: 'Scenario: Two members are arguing in text/voice. How do you de-escalate?', type: 'textarea', step: 3, placeholder: 'How do you handle conflict between users?', required: true },
      
      { id: 'handle_dm_adv',  label: 'Scenario: A member is reported for advertising in DMs. What do you do?', type: 'textarea', step: 4, placeholder: 'What proof do you ask for, and what action is taken?', required: true },
      { id: 'handle_abuse',   label: 'Scenario: You suspect another staff member is abusing power. What do you do?', type: 'textarea', step: 4, placeholder: 'How do you handle internal staff conflicts?', required: true },
      { id: 'handle_nsfw',    label: 'Scenario: A user posts NSFW content in general chat. What is your response?', type: 'textarea', step: 4, placeholder: 'What actions do you take immediately?', required: true },
      { id: 'handle_unsure',  label: 'If you are unsure of a moderation decision, what do you do?', type: 'textarea', step: 4, placeholder: 'Who do you consult, or how do you decide?', required: true },
      
      { id: 'hobbies',        label: 'What are your hobbies or interests outside of Discord?', type: 'textarea', step: 5, placeholder: 'We want to know the person behind the screen!', required: true },
      { id: 'server_mgmt',    label: 'Do you have experience with server management, bots, or configurations?', type: 'textarea', step: 5, placeholder: 'e.g. setting up dyno, permissions, webhooks...', required: true },
      { id: 'guidelines_agree', label: 'Do you agree to follow all staff guidelines and remain active?', type: 'checkbox', step: 5, required: true, checkboxLabel: 'I agree to behave professionally, uphold server rules, and communicate with the team.' },
      { id: 'additional_info', label: 'Is there anything else you would like to share?', type: 'textarea', step: 5, placeholder: 'Anything else we should know?', required: true }
    ]
  },
  media_team: {
    title: "Media Team",
    questions: [
      { id: 'media_role',     label: 'What specific role are you applying for?', type: 'select', step: 2, options: ['Graphic Designer', 'Video Editor', 'Content Creator', 'Social Media Manager', 'Other'], required: true },
      { id: 'hours_active',   label: 'How many hours per week can you dedicate to media work?', type: 'number', step: 2, min: 1, max: 168, placeholder: 'e.g. 10', required: true },
      { id: 'portfolio',      label: 'Please provide a link to your portfolio or past work.', type: 'text', step: 2, placeholder: 'e.g. Behance, YouTube channel, Drive link...', required: true, helperText: 'Provide links to your graphic designs, edit reels, or channels.' },
      { id: 'tools_used',     label: 'What software/tools do you specialize in?', type: 'text', step: 2, placeholder: 'e.g. Photoshop, Premiere Pro, After Effects, Figma, Canva...', required: true },
      
      { id: 'why_media',      label: 'Why do you want to join our Media Team?', type: 'textarea', step: 3, placeholder: 'Tell us why you want to design/create for ROP...', required: true },
      { id: 'prior_work',     label: 'Detail any prior experience creating media content for servers or organizations.', type: 'textarea', step: 3, placeholder: 'Describe your past projects and responsibilities...', required: true },
      { id: 'strengths_media', label: 'What are your core creative strengths?', type: 'textarea', step: 3, placeholder: 'e.g. visual styling, motion graphics, audio design, branding...', required: true },
      
      { id: 'handle_negative_feedback', label: 'Scenario: A piece of content you designed/edited gets negative feedback. How do you handle it?', type: 'textarea', step: 4, placeholder: 'Explain your reaction and process...', required: true },
      { id: 'handle_deadline', label: 'Scenario: We need a thumbnail or promo video created on short notice (e.g. 24 hours). How do you handle it?', type: 'textarea', step: 4, placeholder: 'How do you handle urgent tasks or tight deadlines?', required: true },
      { id: 'handle_disagreement', label: 'Scenario: You disagree with a lead or staff member on design direction. How do you resolve this?', type: 'textarea', step: 4, placeholder: 'Explain how you approach differences in creative vision...', required: true },
      
      { id: 'hobbies',        label: 'What are your hobbies or interests outside of media work?', type: 'textarea', step: 5, placeholder: 'Tell us about yourself...', required: true },
      { id: 'guidelines_agree', label: 'Do you agree to follow ROP media guidelines and represent the server professionally?', type: 'checkbox', step: 5, required: true, checkboxLabel: 'I agree to follow design guidelines, use licensed assets, and communicate professionally.' },
      { id: 'additional_info', label: 'Is there anything else you would like to share?', type: 'textarea', step: 5, placeholder: 'Anything else we should know?', required: true }
    ]
  },
  rbx_dev: {
    title: "Roblox Dev Team",
    questions: [
      { id: 'dev_role',       label: 'What is your primary development role?', type: 'select', step: 2, options: ['Scripter (Luau)', 'Builder / Map Designer', 'UI/UX Designer', '3D Modeler (Blender)', 'Animator', 'Other'], required: true },
      { id: 'hours_active',   label: 'How many hours per week can you dedicate to project development?', type: 'number', step: 2, min: 1, max: 168, placeholder: 'e.g. 12', required: true },
      { id: 'roblox_profile', label: 'Please provide a link to your Roblox Profile.', type: 'text', step: 2, placeholder: 'e.g. https://www.roblox.com/users/123456/profile', required: true },
      { id: 'portfolio',      label: 'Please provide a link to your portfolio or showcases.', type: 'text', step: 2, placeholder: 'e.g. DevForum portfolio, GitHub, Roblox place links...', required: true },
      
      { id: 'prior_games',    label: 'List any Roblox games you have contributed to or worked on.', type: 'textarea', step: 3, placeholder: 'Provide links and detail what you did in each game...', required: true },
      { id: 'why_dev',        label: 'Why do you want to join the ROP Dev Team?', type: 'textarea', step: 3, placeholder: 'What motivates you to build/script for ROP?', required: true },
      { id: 'collaboration',  label: 'How do you handle working as a team with other devs (builders, scripters, modelers)?', type: 'textarea', step: 3, placeholder: 'Describe your teamwork and communication habits...', required: true },
      
      { id: 'handle_bug',     label: 'Scenario: A critical game-breaking bug is discovered in production right before an event. How do you react?', type: 'textarea', step: 4, placeholder: 'Detail your troubleshooting and response steps...', required: true },
      { id: 'handle_refactor', label: 'Scenario: Another developer refactors your scripts or modifies your assets without warning. What do you do?', type: 'textarea', step: 4, placeholder: 'How do you address creative differences or code ownership disputes?', required: true },
      { id: 'handle_deadline', label: 'Scenario: You are struggling to meet a milestone deadline. What is your action plan?', type: 'textarea', step: 4, placeholder: 'How do you manage stress and communicate delays?', required: true },
      
      { id: 'hobbies',        label: 'What are your hobbies or interests outside of development?', type: 'textarea', step: 5, placeholder: 'Tell us about yourself...', required: true },
      { id: 'guidelines_agree', label: 'Do you agree to follow developer guidelines, protect project assets, and not leak updates?', type: 'checkbox', step: 5, required: true, checkboxLabel: 'I agree to maintain asset security, follow coding/building standards, and cooperate with project leads.' },
      { id: 'additional_info', label: 'Is there anything else you would like to share?', type: 'textarea', step: 5, placeholder: 'Anything else we should know?', required: true }
    ]
  }
};

document.addEventListener('DOMContentLoaded', () => {
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

  let currentStep = 1;
  const totalSteps = 5;

  // Render initial dynamic steps for default selected role
  let selectedRole = document.querySelector('input[name="role"]:checked').value;
  renderDynamicSteps(selectedRole);
  updateNavigation();

  // Handle Role Selection change
  form.querySelectorAll('input[name="role"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      selectedRole = e.target.value;
      renderDynamicSteps(selectedRole);
      // If we are past step 1, reset back to step 1 when they change the role to prevent confusion
      if (currentStep > 1) {
        currentStep = 1;
      }
      updateNavigation();
    });
  });

  nextBtn.addEventListener('click', () => {
    if (validateStep(currentStep)) { currentStep++; updateNavigation(); }
  });
  prevBtn.addEventListener('click', () => {
    if (currentStep > 1) { currentStep--; updateNavigation(); }
  });

  // Attach inputs check for the static inputs in step 1
  form.querySelectorAll('.form-section[data-section="1"] input').forEach(el => {
    el.addEventListener('input', () => el.closest('.form-group')?.classList.remove('invalid'));
    el.addEventListener('change', () => el.closest('.form-group')?.classList.remove('invalid'));
  });

  function renderDynamicSteps(roleKey) {
    const schema = ROLE_SCHEMAS[roleKey];
    dynamicContainer.innerHTML = '';
    
    const steps = [2, 3, 4, 5];
    steps.forEach(stepNum => {
      const section = document.createElement('section');
      section.className = 'form-section';
      section.dataset.section = stepNum;
      
      let stepTitle = '';
      let stepDesc = '';
      if (stepNum === 2) {
        stepTitle = `Step 2: Role Details & Commitment`;
        stepDesc = `Provide specific details about your availability and qualifications for the role.`;
      } else if (stepNum === 3) {
        stepTitle = `Step 3: Background & Motivation`;
        stepDesc = `Tell us why you want to join and what experiences you bring.`;
      } else if (stepNum === 4) {
        stepTitle = `Step 4: Scenarios & Decision-Making`;
        stepDesc = `Describe how you handle specific situations or conflicts.`;
      } else if (stepNum === 5) {
        stepTitle = `Step 5: Agreement & Miscellaneous`;
        stepDesc = `Almost done! Review the guidelines and provide any final details.`;
      }
      
      section.innerHTML = `
        <h2 class="section-title">${stepTitle}</h2>
        <p class="section-description">${stepDesc}</p>
      `;
      
      const stepQuestions = schema.questions.filter(q => q.step === stepNum);
      stepQuestions.forEach((q, idx) => {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        let inputHtml = '';
        if (q.type === 'textarea') {
          inputHtml = `<textarea id="${q.id}" name="${q.id}" rows="3" placeholder="${q.placeholder}" ${q.required ? 'required' : ''}></textarea>`;
        } else if (q.type === 'text') {
          inputHtml = `<input type="text" id="${q.id}" name="${q.id}" placeholder="${q.placeholder}" ${q.required ? 'required' : ''}>`;
        } else if (q.type === 'number') {
          inputHtml = `<input type="number" id="${q.id}" name="${q.id}" placeholder="${q.placeholder}" min="${q.min || ''}" max="${q.max || ''}" ${q.required ? 'required' : ''}>`;
        } else if (q.type === 'select') {
          const optionsHtml = q.options.map(o => `<option value="${o}">${o}</option>`).join('');
          inputHtml = `<select id="${q.id}" name="${q.id}" ${q.required ? 'required' : ''}>${optionsHtml}</select>`;
        } else if (q.type === 'checkbox') {
          inputHtml = `
            <label class="checkbox-container" for="${q.id}">
              <input type="checkbox" id="${q.id}" name="${q.id}" value="Yes, I agree" ${q.required ? 'required' : ''}>
              <span class="checkmark"></span>
              <span class="checkbox-label">${q.checkboxLabel}</span>
            </label>
          `;
        }
        
        const labelHtml = q.type === 'checkbox' 
          ? `<label>Agreement <span class="required">*</span></label>`
          : `<label for="${q.id}">${q.label} ${q.required ? '<span class="required">*</span>' : ''}</label>`;
           
        const helperHtml = q.helperText ? `<small class="helper-text">${q.helperText}</small>` : '';
        const errorMsg = q.type === 'checkbox'
          ? `You must agree to continue.`
          : `Please fill out this field.`;
        
        group.innerHTML = `
          ${labelHtml}
          ${inputHtml}
          <span class="error-msg" id="error-${q.id}">${errorMsg}</span>
          ${helperHtml}
        `;
        section.appendChild(group);
      });
      
      dynamicContainer.appendChild(section);
    });

    // Attach input event listeners to clear invalid classes
    dynamicContainer.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input', () => el.closest('.form-group')?.classList.remove('invalid'));
      el.addEventListener('change', () => el.closest('.form-group')?.classList.remove('invalid'));
    });
  }

  function updateNavigation() {
    const currentSections = document.querySelectorAll('.form-section');
    currentSections.forEach(s => s.classList.toggle('active', parseInt(s.dataset.section) === currentStep));
    stepNodes.forEach(n => {
      const step = parseInt(n.dataset.step);
      n.classList.remove('active', 'completed');
      if (step === currentStep) n.classList.add('active');
      else if (step < currentStep) n.classList.add('completed');
    });
    progressBar.style.width = `${((currentStep - 1) / (totalSteps - 1)) * 100}%`;
    prevBtn.classList.toggle('disabled', currentStep === 1);
    prevBtn.disabled = currentStep === 1;
    nextBtn.classList.toggle('hidden', currentStep === totalSteps);
    submitBtn.classList.toggle('hidden', currentStep !== totalSteps);
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function validateStep(step) {
    const section = document.querySelector(`.form-section[data-section="${step}"]`);
    if (!section) return true;
    let isValid = true;
    section.querySelectorAll('input, textarea, select').forEach(input => {
      const group = input.closest('.form-group');
      let fieldValid = true;
      if (input.hasAttribute('required')) {
        fieldValid = input.type === 'checkbox' ? input.checked : input.value.trim() !== '';
      }
      if (fieldValid) {
        if (input.id === 'discord_id') fieldValid = /^\d{17,19}$/.test(input.value.trim());
        else if (input.id === 'age') { const v = parseInt(input.value); fieldValid = !isNaN(v) && v >= 13 && v <= 100; }
        else if (input.id === 'hours_active') { const v = parseInt(input.value); fieldValid = !isNaN(v) && v >= 1 && v <= 168; }
      }
      group?.classList.toggle('invalid', !fieldValid);
      if (!fieldValid) isValid = false;
    });
    return isValid;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    const schema = ROLE_SCHEMAS[selectedRole];
    const payload = {
      role: selectedRole,
      role_title: schema.title
    };

    // Static fields
    payload.discord_tag = document.getElementById('discord_tag').value.trim();
    payload.discord_id = document.getElementById('discord_id').value.trim();
    payload.age = document.getElementById('age').value.trim();
    payload.timezone = document.getElementById('timezone').value.trim();

    // Dynamic fields
    schema.questions.forEach(q => {
      const el = document.getElementById(q.id);
      if (el) {
        payload[q.id] = el.type === 'checkbox' ? (el.checked ? 'Yes, I agree' : '') : el.value.trim();
      }
    });

    // Show loading
    form.classList.add('hidden');
    document.querySelector('.progress-container').classList.add('hidden');
    statusCard.classList.remove('hidden');
    statusIconSuccess.classList.add('hidden');
    statusIconError.classList.add('hidden');
    statusTitle.innerText = 'Submitting…';
    statusMessage.innerText = 'Sending your application to Discord. Please wait.';
    statusResetBtn.classList.add('hidden');

    try {
      // Build review URL (for the Approve/Reject links in the embed)
      const reviewBase = window.location.origin + window.location.pathname.replace('index.html', '') + 'review.html';
      const jsonStr = JSON.stringify(payload);
      let answersParam = encodeURIComponent(jsonStr);

      if (typeof CompressionStream !== 'undefined') {
        const compressed = await compressPayload(jsonStr);
        if (compressed) {
          answersParam = 'c:' + compressed;
        }
      }

      const encodedTag = encodeURIComponent(payload.discord_tag);
      const approveUrl = `${reviewBase}?action=approve&tag=${encodedTag}&answers=${answersParam}`;
      const rejectUrl = `${reviewBase}?action=reject&tag=${encodedTag}&answers=${answersParam}`;

      // Format field helper with truncation
      const formatEmbedValue = (val, maxLen = 300) => {
        const text = val || 'N/A';
        if (text.length <= maxLen) return text;
        return text.substring(0, maxLen) + '... *(truncated, view full answer in portal)*';
      };

      // Safe value helper — Discord rejects empty-string field values
      const safeVal = (v) => (v !== undefined && v !== null && String(v).trim() !== '') ? String(v).trim() : 'N/A';

      // Profile fields
      const profileFields = [
        { name: 'Applied Role',        value: safeVal(schema.title),         inline: true },
        { name: 'Discord Username',    value: safeVal(payload.discord_tag),  inline: true },
        { name: 'Discord User ID',     value: `\`${safeVal(payload.discord_id)}\``, inline: true },
        { name: 'Age',                 value: safeVal(payload.age),          inline: true },
        { name: 'Timezone / Country',  value: safeVal(payload.timezone),     inline: true },
        { name: 'Hours / Week',        value: payload.hours_active ? `${payload.hours_active} hrs` : 'N/A', inline: true }
      ];

      // Add sub-role if applicable
      if (payload.media_role) {
        profileFields.push({ name: 'Specialization', value: payload.media_role, inline: true });
      } else if (payload.dev_role) {
        profileFields.push({ name: 'Developer Role', value: payload.dev_role, inline: true });
      }

      // Add portfolio or profile links if they exist
      if (payload.portfolio) {
        profileFields.push({ name: 'Portfolio / Past Work', value: payload.portfolio, inline: true });
      }
      if (payload.roblox_profile) {
        profileFields.push({ name: 'Roblox Profile', value: payload.roblox_profile, inline: true });
      }

      // Embed 1: Applicant Profile & Actions
      const embedProfile = {
        title: `📝 New Application — ${payload.discord_tag}`,
        description:
          `A new application has been submitted for the **${schema.title}**. Review the details below or open the review portal to make a decision.\n\n` +
          `⚡ **Review Actions:**\n` +
          `• [🟢 Open Portal & Approve](${approveUrl})\n` +
          `• [🔴 Open Portal & Reject](${rejectUrl})`,
        color: 5793266, // Discord Blurple
        fields: profileFields,
        timestamp: new Date().toISOString()
      };

      // Filter Q&As to exclude profile fields
      const profileKeys = ['hours_active', 'media_role', 'dev_role', 'roblox_profile', 'portfolio', 'guidelines_agree'];
      const detailQuestions = schema.questions.filter(q => !profileKeys.includes(q.id));

      const halfCount = Math.ceil(detailQuestions.length / 2);
      const qa1Questions = detailQuestions.slice(0, halfCount);
      const qa2Questions = detailQuestions.slice(halfCount);

      // Embed 2: Detailed QA part 1
      const embedQA1 = {
        title: '📋 Part 1: Applicant Details & Background',
        color: 3092790, // Dark Grey
        fields: qa1Questions.map((q, idx) => ({
          name: `${idx + 6}. ${q.label}`,
          value: formatEmbedValue(payload[q.id]),
          inline: false
        }))
      };

      // Embed 3: Detailed QA part 2
      const embedQA2 = {
        title: '⚖️ Part 2: Scenarios & Additional Info',
        color: 3092790, // Dark Grey
        fields: qa2Questions.map((q, idx) => ({
          name: `${idx + 6 + halfCount}. ${q.label}`,
          value: formatEmbedValue(payload[q.id]),
          inline: false
        })),
        footer: { text: 'Click review links in the first embed to submit a decision' }
      };

        // Helper to build webhook payload
        function buildWebhookPayload() {
          const embeds = [embedProfile];
          if (embedQA1.fields.length > 0) embeds.push(embedQA1);
          if (embedQA2.fields.length > 0) embeds.push(embedQA2);
          // Add footer to the first embed with Discord invite link
          embeds[0].footer = { text: 'Join our Discord: https://discord.gg/yNgeQmmnWs' };
          return {
            username: 'Staff Application System',
            embeds,
            components: [
              {
                type: 1, // Action Row
                components: [
                  { type: 2, style: 5, label: '✅ Approve', url: approveUrl, emoji: { name: '✅' } },
                  { type: 2, style: 5, label: '❌ Reject', url: rejectUrl, emoji: { name: '❌' } },
                  { type: 2, style: 5, label: '💬 Join Discord', url: 'https://discord.gg/yNgeQmmnWs', emoji: { name: '💬' } }
                ]
              }
            ]
          };
        }

        // Send webhook with retry logic (defined earlier in the file)
        const webhookBody = buildWebhookPayload();
        const resp = await sendWithRetry(webhookBody);

      if (resp.ok || resp.status === 204) {
        statusTitle.innerText = 'Application Submitted!';
        statusMessage.innerText = 'Your application was sent to the staff review room successfully. You will be notified on Discord once a decision is made!';
        statusIconSuccess.classList.remove('hidden');
      } else {
        const err = await resp.text();
        throw new Error(`Discord returned ${resp.status}: ${err}`);
      }
    } catch (error) {
      statusTitle.innerText = 'Submission Failed';
      statusMessage.innerText = error.message || 'Could not send your application. Please try again later.';
      statusIconError.classList.remove('hidden');
      statusResetBtn.classList.remove('hidden');
    }
  });

  statusResetBtn.addEventListener('click', () => {
    statusCard.classList.add('hidden');
    document.querySelector('.progress-container').classList.remove('hidden');
    form.classList.remove('hidden');
    currentStep = 1;
    updateNavigation();
  });
});
