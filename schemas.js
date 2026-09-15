// ============================================================
// schemas.js — Shared Role Question Schemas
// Single source of truth for all role definitions.
// Imported by: index.html, review.html
// ============================================================

const ROLE_SCHEMAS = {
  discord_staff: {
    title: "Discord Staff Team",
    icon: "💬",
    color: 5793266, // Discord Blurple
    description: "Moderate text/voice channels, help members, and keep the community active.",
    // maxChars applies to all textarea fields in this schema unless overridden
    questions: [
      { id: 'hours_active',   label: 'How many hours per week can you dedicate to the server?',              type: 'number',   step: 2, min: 1, max: 168,  placeholder: 'e.g. 15', required: true },
      { id: 'why_staff',      label: 'Why do you want to join our staff team?',                              type: 'textarea', step: 2, placeholder: 'Tell us your motivation...', required: true,     maxChars: 1000 },
      { id: 'experience',     label: 'What prior moderation/staff experience do you have?',                  type: 'textarea', step: 2, placeholder: 'Mention server names, sizes, or responsibilities...', required: true, maxChars: 1000 },
      { id: 'strengths',      label: 'What are your key strengths?',                                         type: 'textarea', step: 2, placeholder: 'What makes you stand out?', required: true,      maxChars: 800 },

      { id: 'weaknesses',     label: 'What are your weaknesses, and how do you manage them?',               type: 'textarea', step: 3, placeholder: 'Be honest - we value self-awareness...', required: true,   maxChars: 800 },
      { id: 'stress_handle',  label: 'How do you handle stressful situations or conflict?',                 type: 'textarea', step: 3, placeholder: 'Explain your coping mechanisms...', required: true,        maxChars: 800 },
      { id: 'handle_spam',    label: 'Scenario: A user is spamming links in chat. What do you do?',         type: 'textarea', step: 3, placeholder: 'Detail your step-by-step reaction...', required: true,     maxChars: 1000 },
      { id: 'handle_argument',label: 'Scenario: Two members are arguing in text/voice. How do you de-escalate?', type: 'textarea', step: 3, placeholder: 'How do you handle conflict between users?', required: true, maxChars: 1000 },

      { id: 'handle_dm_adv',  label: 'Scenario: A member is reported for advertising in DMs. What do you do?',           type: 'textarea', step: 4, placeholder: 'What proof do you ask for, and what action is taken?', required: true, maxChars: 1000 },
      { id: 'handle_abuse',   label: 'Scenario: You suspect another staff member is abusing power. What do you do?',     type: 'textarea', step: 4, placeholder: 'How do you handle internal staff conflicts?', required: true,            maxChars: 1000 },
      { id: 'handle_nsfw',    label: 'Scenario: A user posts NSFW content in general chat. What is your response?',      type: 'textarea', step: 4, placeholder: 'What actions do you take immediately?', required: true,                   maxChars: 1000 },
      { id: 'handle_unsure',  label: 'If you are unsure of a moderation decision, what do you do?',                      type: 'textarea', step: 4, placeholder: 'Who do you consult, or how do you decide?', required: true,                maxChars: 800 },

      { id: 'hobbies',         label: 'What are your hobbies or interests outside of Discord?',                          type: 'textarea', step: 5, placeholder: 'We want to know the person behind the screen!', required: true, maxChars: 600 },
      { id: 'server_mgmt',     label: 'Do you have experience with server management, bots, or configurations?',         type: 'textarea', step: 5, placeholder: 'e.g. setting up dyno, permissions, webhooks...', required: true, maxChars: 800 },
      { id: 'guidelines_agree',label: 'Do you agree to follow all staff guidelines and remain active?',                  type: 'checkbox', step: 5, required: true, checkboxLabel: 'I agree to behave professionally, uphold server rules, and communicate with the team.' },
      { id: 'additional_info', label: 'Is there anything else you would like to share?',                                 type: 'textarea', step: 5, placeholder: 'Anything else we should know?', required: true, maxChars: 1000 }
    ]
  },

  media_team: {
    title: "Media Team",
    icon: "🎥",
    color: 16766720, // Gold
    description: "Create graphic designs, edit videos, manage socials, and promote the server.",
    questions: [
      { id: 'media_role',     label: 'What specific role are you applying for?',                             type: 'select',   step: 2, options: ['Graphic Designer', 'Video Editor', 'Content Creator', 'Social Media Manager', 'Other'], required: true },
      { id: 'hours_active',   label: 'How many hours per week can you dedicate to media work?',              type: 'number',   step: 2, min: 1, max: 168, placeholder: 'e.g. 10', required: true },
      { id: 'portfolio',      label: 'Please provide a link to your portfolio or past work.',                type: 'text',     step: 2, placeholder: 'e.g. Behance, YouTube channel, Drive link...', required: true, helperText: 'Provide links to your graphic designs, edit reels, or channels.' },
      { id: 'tools_used',     label: 'What software/tools do you specialize in?',                           type: 'text',     step: 2, placeholder: 'e.g. Photoshop, Premiere Pro, After Effects, Figma, Canva...', required: true },

      { id: 'why_media',      label: 'Why do you want to join our Media Team?',                             type: 'textarea', step: 3, placeholder: 'Tell us why you want to design/create for Webhook Builder...', required: true, maxChars: 1000 },
      { id: 'prior_work',     label: 'Detail any prior experience creating media content for servers or organizations.', type: 'textarea', step: 3, placeholder: 'Describe your past projects and responsibilities...', required: true, maxChars: 1000 },
      { id: 'strengths_media',label: 'What are your core creative strengths?',                              type: 'textarea', step: 3, placeholder: 'e.g. visual styling, motion graphics, audio design, branding...', required: true, maxChars: 800 },

      { id: 'handle_negative_feedback', label: 'Scenario: A piece of content you designed/edited gets negative feedback. How do you handle it?', type: 'textarea', step: 4, placeholder: 'Explain your reaction and process...', required: true, maxChars: 1000 },
      { id: 'handle_deadline',   label: 'Scenario: We need a thumbnail or promo video created on short notice (e.g. 24 hours). How do you handle it?', type: 'textarea', step: 4, placeholder: 'How do you handle urgent tasks or tight deadlines?', required: true, maxChars: 1000 },
      { id: 'handle_disagreement',label: 'Scenario: You disagree with a lead or staff member on design direction. How do you resolve this?',         type: 'textarea', step: 4, placeholder: 'Explain how you approach differences in creative vision...', required: true, maxChars: 1000 },

      { id: 'hobbies',         label: 'What are your hobbies or interests outside of media work?',          type: 'textarea', step: 5, placeholder: 'Tell us about yourself...', required: true, maxChars: 600 },
      { id: 'guidelines_agree',label: 'Do you agree to follow Webhook Builder media guidelines and represent the server professionally?', type: 'checkbox', step: 5, required: true, checkboxLabel: 'I agree to follow design guidelines, use licensed assets, and communicate professionally.' },
      { id: 'additional_info', label: 'Is there anything else you would like to share?',                    type: 'textarea', step: 5, placeholder: 'Anything else we should know?', required: true, maxChars: 1000 }
    ]
  },

};
