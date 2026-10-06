# VeriFit frontend outcomes

## [x] Foundation, app shell, landing page, entry flows, and theme
- Use Next.js + TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, Recharts only where useful, next-themes, and subtle Framer Motion. Use mock/local data only; do not build a complex backend or ML pipeline.
- Create working pages and navigation for `/`, `/login`, `/signup`, `/dashboard`, `/profile`, `/resume`, `/roles`, `/assessment`, `/assessment/result`, `/roadmap`, `/audit`, and `/settings`.
- Create a polished desktop sidebar with VeriFit, Dashboard, Assessments, Roles, Profile, Resume, Roadmap, and Audit; bottom section has Settings, theme toggle, and user profile. Provide responsive mobile navigation.
- Landing hero headline is “Know exactly why you're ready.” Subtitle is “VeriFit checks every job requirement against evidence from your resume, separates eligibility rules from skill fit, and gives you a roadmap you can actually verify.” Buttons are “Check my readiness” and “See how it works”; show a beautiful dashboard preview below/alongside and use subtle animation.
- Use a premium modern SaaS look inspired by Linear, Vercel, Raycast, and modern developer tools, not a generic AI website. Use sophisticated neutral surfaces with one primary accent, Geist or Inter, strong spacing, clean grids, excellent hierarchy. Avoid excessive gradients, glassmorphism, giant glowing text, cartoon illustrations, excessive rounded cards, random decorative blobs, and emoji-heavy UI.
- Implement a real theme system with a sidebar/topbar toggle and persisted user selection. Light mode: warm/cool off-white background, white cards, dark text, subtle borders, sophisticated blue/indigo accent. Dark mode: near-black charcoal background, dark elevated cards, white/gray text, subtle borders, same accent. Every component must work in both themes.

## [x] Dashboard, assessment result, evidence ledger, and evidence drawer
- Use realistic mock data for Manvi Yadav, target role SDE Intern, B.Tech IT, graduation 2027, CGPA 7.9. Dashboard header: “Good evening, Manvi” and “Here's where you stand for your target role.”
- Keep eligibility visually separate from skill readiness. Eligibility card says Eligible, 4/4 rules passed, with CGPA ≥ 7.0, Branch IT/CS, Graduation year, Backlogs: 0.
- Readiness overview has 12 requirements: 8 Met, 2 Partial, 2 Not Evidenced. Do not create a fake hiring-probability score.
- Dashboard requirement table columns: Requirement, Type, Status, Evidence, Action. Include React — Skill — MET; Node.js — Skill — MET; PostgreSQL — Skill — PARTIAL; System Design — Skill — NOT EVIDENCED; Docker — Skill — MET; CGPA — Eligibility — PASSED.
- Next best action is “Your fastest path to stronger readiness”: (1) Add PostgreSQL project evidence, (2) Document REST API implementation, (3) Complete System Design milestone. CTA: “Open roadmap”.
- Result page title “SDE Intern readiness”; subtitle “Your readiness is based on evidence, not a keyword score.” Show Eligibility — PASS; Skills — 8 Met · 2 Partial · 2 Not Evidenced; Evidence coverage — 10/12 requirements supported. Main Evidence Ledger columns: Requirement, Type, Verdict, Evidence, Confidence, Action. Use MET, PARTIAL, NOT EVIDENCED badges; do not rely on color alone.
- Clicking an evidence row opens a side drawer. React example: requirement React; verdict MET; source Resume; exact evidence “Developed a responsive expense-sharing application using React, TypeScript and Tailwind...”; highlight supporting evidence; show ✓ Evidence found, ✓ Requirement matched, ✓ Citation verified.
- For NOT EVIDENCED show “No supporting evidence was found in your current materials.” Explain that NOT EVIDENCED does NOT mean the student does not know the skill; it means current evidence does not demonstrate it.

## [x] Roadmap milestones and evidence transitions
- Title “Close your gaps”; subtitle “The smallest set of verifiable actions that can improve your evidence.” Create polished milestone cards.
- Milestone 01: “Build a PostgreSQL-backed project”; requirement PostgreSQL; effort Medium; evidence required GitHub repository + project description; status Not started; button “Start milestone”.
- Milestone 02: “Document REST API implementation”. Milestone 03: “Complete System Design mini-project”.
- Show Current state → Action → Expected verified state. Example: System Design — NOT EVIDENCED → Complete architecture project → MET.

## [x] Editable profile, resume upload experience, and role cards
- Profile has editable polished form fields: Name, College, Degree, Branch, Graduation year, CGPA, Skills, Projects, Certifications, GitHub, LinkedIn.
- Resume page has a premium PDF-only drag/drop area with the text “Drop your resume here”. Show mock status Uploaded, Extracting, Evidence indexed, Ready for assessment. Allow View, Replace, Delete.
- Roles page has role cards SDE Intern, Data Analyst, and ML Engineer — Coming Soon. Each card shows requirements, eligibility rules, and skills; provide an “Assess myself” button.

## [x] System audit, settings, and demo-only metrics
- Audit title “System audit” with technical-looking styling. Clearly label the section “Demo evaluation metrics”; show Citation precision 94.8%, Citation recall 91.2%, Faithfulness 87.4%, Fairness delta 2.1%. Do not claim these are real production results.
- Show two simple visualizations: Span deletion test — Evidence present → MET; Evidence removed → NOT EVIDENCED. Counterfactual test — Original profile → MET; Perturbed profile → MET.
- Settings include Account, Appearance, Notifications, Privacy, and Data. Appearance options are Light, Dark, System; theme switching works.

## [x] Complete UX, interactions, responsive behavior, and faithful mock data
- Use realistic mock data throughout. Skills: Java, Python, C++, JavaScript, React, Node.js, PostgreSQL, Docker, Git. Projects: Expense Sharing Application, AI Resume Matching System, EcoScan. Requirements: React, JavaScript, Node.js, REST APIs, PostgreSQL, Git, Docker, System Design, DSA, Cloud Deployment, CGPA, Branch.
- No broken links, empty-looking pages, or lorem ipsum. Buttons have interactions; tables are polished; cards align properly; mobile works; dark/light mode works everywhere. Provide loading states, empty states, toast feedback where appropriate, accessible contrast, and keyboard-friendly dialogs.
- Use subtle Framer Motion animations for landing hero, page entrance, assessment progress, counters, and drawers. Do NOT animate every table row.
- Focus especially on the landing page, dashboard, Evidence Ledger, Evidence Drawer, Roadmap, dark/light mode, and responsive design. The final result should look like a real startup product, not a college-project dashboard.
