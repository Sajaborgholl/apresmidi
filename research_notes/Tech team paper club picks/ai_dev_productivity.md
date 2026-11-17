# AI-Assisted Software Development: Productivity, Quality and Skill (Paper Club Shortlist)

Scope: empirical studies (RCTs, field experiments, careful observational and survey studies) on how AI coding tools affect developer productivity, code quality, learning and skill. Each entry was checked against its arXiv, DOI or official page during this session (2026-11-17). Where a page count or number could not be confirmed, these notes say so instead of guessing.

## Which rigorous studies measure the effect of AI coding tools on productivity, quality, learning or skill?

### Takeaway
The strongest evidence falls into four groups:
- **Lab and field RCTs on speed:** Peng 2023, Google 2024/25 and Cui et al. find speedups of about 21–56% or about 26% more completed tasks. METR 2025 finds a 19% slowdown for experienced developers working in their own mature repositories.
- **Observational repository studies on quality:** the Cursor and coding-agent studies from CMU find short-lived velocity gains and lasting increases in static-analysis warnings and complexity.
- **Learning and skill studies:** Anthropic 2026, the ICER 2024 novice study and the Microsoft CHI 2025 survey find that heavy delegation weakens comprehension and critical engagement.
- **Industry survey:** DORA 2025 ties AI adoption to higher throughput but continuing instability.

### Cited Findings

**Shortlist, in suggested presentation order (11 candidates; pick 8–10):**

1. **Shen & Tamkin (Anthropic), "How AI Impacts Skill Formation"**
   - arXiv 2601.20245, v1 28 Jan 2026, v2 1 Feb 2026. Preprint, not peer-reviewed. [arXiv](https://arxiv.org/abs/2601.20245)
   - **Title note:** the arXiv title is "How AI Impacts Skill Formation". The assignment called it "How AI assistance impacts the formation of coding skills", which may be the blog or post title; use the arXiv title when citing. [arXiv](https://arxiv.org/abs/2601.20245)
   - **Design:** RCT with 52 participants analyzed (26 per arm). They learned the Python **Trio** async library across two tasks in 35 minutes. The AI arm had a GPT-4o chat assistant that could see their code and write full solutions. [arXiv HTML v2](https://arxiv.org/html/2601.20245v2)
   - **Key number:** the AI group scored **4.15 points lower on a 27-point quiz** (about 17%, or about two grade points). Cohen's d = 0.738, p = 0.010, and the effect held after controlling for warm-up time (d = 0.725, p = 0.016). There was **no significant speedup on average**. [arXiv HTML v2](https://arxiv.org/html/2601.20245v2)
   - **Full delegation:** the subgroup that fully delegated finished faster (about 19.5 vs 23 minutes) but was only about 20% of the AI group. [arXiv HTML v2](https://arxiv.org/html/2601.20245v2)
   - **Six interaction patterns.** [arXiv HTML v2](https://arxiv.org/html/2601.20245v2)
     - Low-scoring (quiz below 40%): AI Delegation (n=4), Progressive AI Reliance (n=4), Iterative AI Debugging (n=4).
     - High-scoring (quiz 65% or higher), where learning was preserved: Generation-Then-Comprehension (n=2), Hybrid Code-Explanation (n=3), Conceptual Inquiry (n=7).
   - **Authors' conclusion:** the abstract says "AI-enhanced productivity is not a shortcut to competence". It also reports impaired conceptual understanding, code reading and debugging. [arXiv](https://arxiv.org/abs/2601.20245)
   - **Stated limitations:** [arXiv HTML v2](https://arxiv.org/html/2601.20245v2)
     - One task, using a chat interface rather than an agentic tool.
     - About one hour per participant, so not longitudinal.
     - No real job incentive to learn the library.
     - Prompting skill was self-reported.
     - The quiz was the only skill measure, and there was no human-help comparison arm.
     - Some pattern clusters are very small.
   - **Length:** not confirmed. Estimated at about 20–25 pages including appendices. Accessible, low on technical detail.

2. **Becker, Rush, Barnes, Rein (METR), "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity"**
   - arXiv 2507.09089, v1 12 Jul 2025, v2 25 Jul 2025. Preprint. [arXiv](https://arxiv.org/abs/2507.09089)
   - **Design:** RCT with 16 developers on 246 real tasks in mature open-source repositories they knew well (about 5 years of prior experience on average). Each task was randomized to AI allowed or disallowed. Tools were mainly Cursor Pro with Claude 3.5/3.7 Sonnet. [arXiv](https://arxiv.org/abs/2507.09089)
   - **Key number:** with AI allowed, tasks took **19% longer**. [arXiv](https://arxiv.org/abs/2507.09089)
     - Before the study, developers forecast a 24% speedup. Afterwards they believed AI had sped them up by 20%.
     - Economics experts forecast a 39% speedup and ML experts 38%.
     - The authors examined 20 possible confounders and judged experimental artifacts unlikely to be the main cause.
   - **Length:** 51 pages, 8 tables, 22 figures. Medium difficulty; the main text is readable and the appendices are heavy. [arXiv](https://arxiv.org/abs/2507.09089)
   - **2026 follow-up: METR "uplift update", 24 Feb 2026.** [METR blog](https://metr.org/blog/2026-02-24-uplift-update/)
     - Sample: 57 developers (10 returning, 47 new), 800+ tasks and 143 repositories. Median experience was 10 years and pay was $50/hour, down from $150/hour.
     - Returning developers: **−18%** time with AI, a speedup (CI −38% to +9%).
     - New developers: **−4%** (CI −15% to +9%).
     - For comparison, the original study's CI was +2% to +39%.
   - **Why METR says the follow-up number is unreliable:** [METR blog](https://metr.org/blog/2026-02-24-uplift-update/)
     - **Selection effects:** developers declined to take part because they did not want to work without AI. 30–50% said they held back tasks they did not want to do without AI.
     - METR calls the speedup "likely a lower bound".
     - It is changing the design: shorter fixed-task experiments, observational transcript and commit analysis, and developer-level randomization.
   - **Misreporting:** some secondary coverage misreported the update as an "18% boost". [Rob Bowley analysis](https://blog.robbowley.net/2026/04/04/metrs-developer-productivity-research-2026-update/)

3. **Cui, Demirer, Jaffe, Musolff, Peng, Salz, "The Effects of Generative AI on High-Skilled Work: Evidence from Three Field Experiments with Software Developers"**
   - Management Science, DOI 10.1287/mnsc.2025.00535. Peer-reviewed. Earlier version on SSRN 4945566. [Management Science](https://pubsonline.informs.org/doi/fpi/10.1287/mnsc.2025.00535); [SSRN](https://papers.ssrn.com/abstract=4945566)
   - **Design:** GitHub Copilot access was randomly assigned to 4,867 developers at **Microsoft, Accenture and an anonymous Fortune 100 company**. [SSRN](https://papers.ssrn.com/abstract=4945566)
   - **Key number:** pooled across the three experiments, completed tasks (pull requests) rose **26.08% (SE 10.3%)**. Less experienced developers adopted more and gained more. Each single experiment is noisy on its own. [SSRN](https://papers.ssrn.com/abstract=4945566); [Microsoft Research](https://www.microsoft.com/en-us/research/?p=1148213)
   - **Draft discrepancy:** an earlier 2024 draft listed Dell as the third site and 5,114 developers. The published sample is 4,867. [MIT draft](https://economics.mit.edu/sites/default/files/inline-files/draft_copilot_experiments.pdf)
   - **Length and difficulty:** an economics paper with a heavier econometrics style. Page count not confirmed.

4. **Paradis, Grey, Madison, Nam, Macvean, Meimand, Zhang, Ferrari-Church, Chandra (Google), "How much does AI impact development speed? An enterprise-based randomized controlled trial"**
   - ICSE-SEIP 2025, pp. 618–629. Peer-reviewed. [arXiv](https://arxiv.org/abs/2410.12944); [ICSE 2025 program](https://conf.researchr.org/details/icse-2025/icse-2025-software-engineering-in-practice/26/How-much-does-AI-impact-development-speed-An-enterprise-based-randomized-controlled-); [DBLP](https://dblp.org/rec/conf/icse-seip/ParadisGMNMMZFC25.html)
   - **Design:** RCT with 96 full-time Google engineers on one complex, enterprise-grade task. It tested three AI features. [arXiv](https://arxiv.org/abs/2410.12944)
   - **Key number:** about **21% less time on task**, with a wide confidence interval. Developers who spend more hours a day on code were faster with AI. There was no significant evidence that seniority or AI familiarity mattered. [arXiv](https://arxiv.org/abs/2410.12944); [course slides summary](https://bvasiles.github.io/empirical-methods/assets/presentations/barros.pdf)
   - **Length:** 12 pages, 7 figures, 3 tables. Short and easy. [arXiv](https://arxiv.org/abs/2410.12944)

5. **Peng, Kalliamvakou, Cihon, Demirer, "The Impact of AI on Developer Productivity: Evidence from GitHub Copilot"**
   - arXiv 2302.06590, Feb 2023. Preprint. This is the classic paper behind the "55% faster" claim. [arXiv](https://arxiv.org/abs/2302.06590)
   - **Design:** controlled experiment in which developers implemented an HTTP server in JavaScript. [arXiv](https://arxiv.org/abs/2302.06590)
   - **Key number:** the Copilot group "completed the task 55.8% faster". [arXiv](https://arxiv.org/abs/2302.06590)
   - **Not confirmed:** the sample size (commonly cited as 95 recruited) was not visible on the abstract page, so check it in the PDF. The paper is short.

6. **He, Miller, Agarwal, Kästner, Vasilescu (CMU), "Speed at the Cost of Quality: How Cursor AI Increases Short-Term Velocity and Long-Term Complexity in Open-Source Projects"**
   - MSR '26 (Rio de Janeiro, April 2026). Peer-reviewed. arXiv 2511.04427, v3 26 Jan 2026. [arXiv](https://arxiv.org/abs/2511.04427)
   - **Design:** 806 GitHub repositories that adopted Cursor, detected through committed `.cursorrules` files or `.cursor` folders, against 1,380 propensity-matched controls. Monthly panel from Jan 2024 to Aug 2025. Staggered difference-in-differences (Borusyak imputation estimator) plus SonarQube metrics. [arXiv HTML v3](https://arxiv.org/html/2511.04427v3)
   - **Velocity:** [arXiv HTML v3](https://arxiv.org/html/2511.04427v3)
     - Lines added rose **+281% in month 1** and +48% in month 2. There were no significant gains after month 2.
     - The overall effect on lines added was +28.6%. Commits did not change significantly overall (+2.6%).
   - **Quality:** [arXiv HTML v3](https://arxiv.org/html/2511.04427v3)
     - Static-analysis warnings rose **+30.3%** and the increase persisted.
     - Code complexity rose **+41.6%** (Table 2) and the increase persisted. The paper's own text elsewhere says about 25%, an inconsistency inside the paper.
     - In a dynamic-panel (GMM) analysis, a doubling of complexity is associated with 64.5% fewer lines added later.
   - **Threats to validity:** [arXiv HTML v3](https://arxiv.org/html/2511.04427v3)
     - Adoption is only observed through committed files, so estimates are intent-to-treat.
     - Usage intensity and model backend are unknown.
     - Other AI tools could contaminate the comparison.
     - Results cover open source only, mostly JS/TS/Python.
   - **Relevance to the team:** JS/TS is the main language in the sample.

7. **Agarwal, He, Vasilescu, "AI IDEs or Autonomous Agents? Measuring the Impact of Coding Agents on Software Development"**
   - arXiv 2601.13597, Jan 2026. The arXiv page lists no venue. The CMU STRUDEL lab site hosts it as `msr2026agarwal.pdf`, which suggests MSR 2026, but that was not confirmed. [arXiv](https://arxiv.org/abs/2601.13597); [STRUDEL PDF](https://cmustrudel.github.io/papers/msr2026agarwal.pdf)
   - **Design:** staggered difference-in-differences on the AIDev dataset. Adoption means a repository's first agent-authored pull request. [arXiv](https://arxiv.org/abs/2601.13597)
   - **Key findings:** [arXiv](https://arxiv.org/abs/2601.13597)
     - Large, front-loaded velocity gains appear **only when the agent is the project's first observable AI tool**. Repositories that already used AI IDEs saw minimal or short-lived gains.
     - Static-analysis warnings rose by about **18%** and cognitive complexity by about **39%** in every setting.
   - **Length:** a short paper (72 KB on arXiv). Pairs naturally with entry 6.

8. **Borg, Hewett, Hagatulah, Couderc, Söderberg, Graham, Kini, Farley, "Echoes of AI: Investigating the Downstream Effects of AI Assistants on Software Maintainability"**
   - arXiv 2507.00788, v3 26 Feb 2026. A registered report with in-principle acceptance at ICSME 2025; the arXiv version is a preprint. [arXiv](https://arxiv.org/abs/2507.00788)
   - **Design:** 151 participants, 95% of them professionals. [arXiv](https://arxiv.org/abs/2507.00788)
     - Phase 1 (observational): participants built a feature with or without AI.
     - Phase 2 (RCT): new developers evolved that code **without** AI.
   - **Key numbers:** [arXiv](https://arxiv.org/abs/2507.00788)
     - Phase 1: AI use gave a 30.7% median reduction in completion time, and habitual AI users about 55.9%.
     - Phase 2: no significant difference in how fast or how well others could later maintain the AI-assisted code. A Bayesian analysis suggests any such effects are small and uncertain.
   - **Caveats:** conducted in late 2024, before agentic tools. [arXiv HTML v3](https://arxiv.org/html/2507.00788v3)
   - **Use in a session:** a useful counterweight to entries 6 and 7.

9. **DORA (Google Cloud), "2025 State of AI-assisted Software Development"**
   - Published 23 Sep 2025. Industry survey report, not peer-reviewed. [Report PDF](https://services.google.com/fh/files/misc/2025_state_of_ai_assisted_software_development.pdf); [Google blog](https://blog.google/technology/developers/dora-report-2025/)
   - **Headline numbers:** [Google blog](https://blog.google/technology/developers/dora-report-2025/)
     - Nearly 5,000 respondents. 90% use AI, with a median of about 2 hours a day.
     - Over 80% say AI raised their productivity, and 59% report a positive effect on code quality.
     - Only 24% trust AI output "a lot" or "a great deal", while 30% trust it "a little" or "not at all".
   - **Throughput vs. stability:** AI adoption is now linked to **higher delivery throughput**, reversing the 2024 finding. Ensuring software works as intended before delivery is still described as an open challenge. [Google blog](https://blog.google/technology/developers/dora-report-2025/)
   - **Secondary summaries** describe the result as "faster, but more fragile", with instability tied to larger changesets, and say small batches are "especially powerful" with AI. These come from summaries; the stability statistics were not checked against the PDF. [Splunk review](https://www.splunk.com/en_us/blog/learn/state-of-devops); [InfoQ](https://www.infoq.com/news/2025/09/dora-state-of-ai-in-dev-2025)
   - **New framework:** the report introduces a 7-capability "DORA AI Capabilities Model". [Google blog](https://blog.google/technology/developers/dora-report-2025/)
   - **Length:** long (a full report). Better presented as selected chapters.

10. **Prather et al., "The Widening Gap: The Benefits and Harms of Generative AI for Novice Programmers"**
    - ICER 2024. Peer-reviewed. arXiv 2405.17739. [arXiv](https://arxiv.org/abs/2405.17739); [ICER 2024](https://icer2024.acm.org/details/icer-2024-papers/26/The-Widening-Gap-The-Benefits-and-Harms-of-Generative-AI-for-Novice-Programmers)
    - **Design:** 21 lab sessions combining observation, interviews and eye tracking. [arXiv HTML](https://arxiv.org/html/2405.17739v1)
    - **Findings:** students who already had a plan used AI to speed it up and ignored bad suggestions. Struggling students had their metacognitive difficulties made worse, and they showed an "illusion of competence", overrating how well they were doing. [arXiv](https://arxiv.org/abs/2405.17739)
    - **Caveat:** qualitative, with a small N. Group sizes were not confirmed.

11. **Lee, Sarkar, Tankelevitch, Drosos, Rintel, Banks, Wilson (Microsoft Research), "The Impact of Generative AI on Critical Thinking: Self-Reported Reductions in Cognitive Effort and Confidence Effects From a Survey of Knowledge Workers"**
    - CHI 2025, DOI 10.1145/3706598.3713778. Peer-reviewed. [Microsoft Research](https://www.microsoft.com/en-us/research/?p=1135061); [author PDF](https://advait.org/files/lee_2025_ai_critical_thinking_survey.pdf); [DBLP](https://dblp.dagstuhl.de/rec/conf/chi/LeeSTDRBW25.txt)
    - **Design:** survey of 319 knowledge workers with 936 first-hand examples of GenAI use. Not developer-specific. [Microsoft Research](https://www.microsoft.com/en-us/research/?p=1135061)
    - **Findings:** [Microsoft Research](https://www.microsoft.com/en-us/research/?p=1135061)
      - Higher confidence in GenAI went with **less** critical thinking. Higher self-confidence went with **more**.
      - Critical thinking shifted toward verifying, integrating and stewarding AI output.
    - **Caveat:** self-reported and cross-sectional.

### Inferences
- **Most "presentable" entries:**
  - Entries 1, 2, 4 and 6 are the most presentable: short or readable, a clear design, and a clear headline number.
  - Entry 3 is the most rigorous in scale but econometrics-heavy.
  - Entries 9 and 11 are best as context or "discussion starter" sessions rather than the main evidence.
- **Suggested pairings for sessions:**
  - (2 + 4 + 3) "Does AI make us faster?"
  - (6 + 7 + 8) "What happens to the codebase?"
  - (1 + 10 + 11) "What happens to us?"
  - (9) "Org-level view".
- **For this team specifically:**
  - Entry 6's sample is mostly JS/TS/Python open-source repos, the closest match to a TypeScript/Next.js stack.
  - Entry 1's Trio setting is analogous to learning a new framework (e.g., a Next.js App Router migration or an unfamiliar Postgres extension) with an AI assistant.

### Gaps
- **Unconfirmed page counts:** Shen & Tamkin, Cui et al., Peng et al., He et al., Agarwal et al., Borg et al. and Prather et al. Abstract pages list file sizes only. Check the PDFs before stating lengths in the deck.
- **Peng et al. 2023:** sample size not confirmed from the primary page (commonly cited as 95 participants).
- **DORA 2025:** specific instability and throughput effect sizes not retrieved from the primary PDF.
- **Cui et al.:** exact Management Science issue and year not confirmed (DOI only).
- **Missing study type:** no 2026 *randomized* trial of autonomous coding agents (Claude Code, Codex, etc.) on professional developers was found. The evidence on agents is observational (entry 7) or METR's admittedly biased follow-up.
- **Not searched for lack of budget:** Kazemitabaar et al. (CHI 2023, novice learners with Codex), Bastani et al. ("Generative AI Can Harm Learning", PNAS 2025; mathematics, not coding), Hoffmann et al. ("Generative AI and the Nature of Work", Copilot shifting developers toward coding work), and GitClear code-churn reports (industry, not peer-reviewed). These are worth a quick check if a substitute is needed.

## For each paper: why an engineering team would care, discussion questions, difficulty

### Takeaway
Each paper maps to a concrete team decision: how to onboard juniors, how to review AI-generated pull requests, whether to trust self-reported speedups, and whether to add quality gates (lint, complexity budgets, small batches).

### Cited Findings
These are the facts each discussion hook rests on. The questions themselves are prompts, not findings.

1. **Shen & Tamkin.** Basis: the 17% quiz penalty, no average speedup, and "Conceptual Inquiry" users preserving learning. [arXiv HTML v2](https://arxiv.org/html/2601.20245v2)
   - **Why care:** onboarding juniors to the stack, or anyone learning a new library with AI.
   - **Discussion questions:**
     - Which of the six patterns do we use when learning a new API?
     - Should onboarding tasks be done in "explain mode" first?
     - What is our equivalent of the quiz (can the person debug it without AI)?
   - **Difficulty:** low to medium.

2. **METR 2025 and the 2026 update.** Basis: the 19% slowdown against a perceived 20% speedup, and the 2026 selection-effects problem. [arXiv](https://arxiv.org/abs/2507.09089); [METR blog](https://metr.org/blog/2026-02-24-uplift-update/)
   - **Why care:** self-reports of speedup are unreliable, and the setting (experts in familiar, mature repos) matches senior engineers on the team's own codebase.
   - **Discussion questions:**
     - How would we measure our own uplift without relying on gut feel?
     - Which tasks do we "refuse" to do without AI, and what does that tell us?
     - Does the slowdown result still hold with 2026 agents?
   - **Difficulty:** medium, at 51 pages; present the main text only.

3. **Cui et al.** Basis: +26% completed tasks with Copilot, larger gains for less experienced developers. [SSRN](https://papers.ssrn.com/abstract=4945566)
   - **Why care:** large-scale, real-company evidence; "completed PRs" is a metric the team could track.
   - **Discussion questions:**
     - Is PR count a good productivity proxy for us?
     - Why would juniors gain more here, yet learn less in Shen & Tamkin?
   - **Difficulty:** medium to high (econometrics).

4. **Google RCT.** Basis: about 21% faster with a wide CI, and heavy coders benefiting more. [arXiv](https://arxiv.org/abs/2410.12944)
   - **Why care:** an enterprise task with a clean design, and short.
   - **Discussion questions:**
     - Why might heavy coders benefit more?
     - How representative is a single assigned task of our sprint work?
   - **Difficulty:** low, at 12 pages.

5. **Peng 2023.** Basis: 55.8% faster on an HTTP server task in JavaScript. [arXiv](https://arxiv.org/abs/2302.06590)
   - **Why care:** the origin of the vendor "55% faster" claims, and a lesson in how greenfield, well-specified tasks inflate effects.
   - **Discussion question:** how does a greenfield HTTP server differ from editing our Next.js app?
   - **Difficulty:** low.

6. **Cursor study (He et al.).** Basis: a month-1 velocity spike, then lasting +30% warnings and +41.6% complexity (Table 2). [arXiv HTML v3](https://arxiv.org/html/2511.04427v3)
   - **Why care:** argues directly for lint, complexity and SonarQube-style gates in CI.
   - **Discussion questions:**
     - Should we add complexity budgets or ESLint rules as gates for AI-heavy pull requests?
     - Is "lines added" a metric we would ever want to optimize?
   - **Difficulty:** medium (difference-in-differences).

7. **Coding agents (Agarwal et al.).** Basis: gains only when agents are the first AI tool, plus +18% warnings and +39% cognitive complexity. [arXiv](https://arxiv.org/abs/2601.13597)
   - **Why care:** the team likely already uses AI IDEs, and the paper suggests diminishing returns from adding agents on top.
   - **Discussion question:** should agent-authored pull requests get different review rules or provenance tags?
   - **Difficulty:** low to medium (short paper).

8. **Echoes of AI (Borg et al.).** Basis: no measurable downstream maintainability penalty in an RCT. [arXiv](https://arxiv.org/abs/2507.00788)
   - **Why care:** tests a commonly assumed harm and finds none, under controlled conditions.
   - **Discussion question:** how do we reconcile this with the Cursor and agent studies (scale, time horizon, agents vs. assistants)?
   - **Difficulty:** medium.

9. **DORA 2025.** Basis: 90% adoption, low trust, and higher throughput alongside a continuing stability challenge. [Google blog](https://blog.google/technology/developers/dora-report-2025/)
   - **Why care:** an org-level framework (the seven capabilities, small batches).
   - **Discussion question:** which of DORA's AI capabilities do we lack?
   - **Difficulty:** low per chapter; long overall.

10. **Widening Gap (Prather et al.).** Basis: illusion of competence among struggling novices. [arXiv](https://arxiv.org/abs/2405.17739)
    - **Why care:** mentoring interns and juniors.
    - **Discussion question:** how do we detect "illusion of competence" in code review?
    - **Difficulty:** low.

11. **Critical thinking (Lee et al.).** Basis: confidence in AI predicts less critical thinking. [Microsoft Research](https://www.microsoft.com/en-us/research/?p=1135061)
    - **Why care:** review fatigue; the team's shift from writing code to verifying it.
    - **Discussion question:** what review practices force active verification of AI output?
    - **Difficulty:** low.

### Inferences
- A good opener is METR (counterintuitive and memorable) followed by Google and Cui (the "speedup" side), so the team confronts the conflict early.
- The Anthropic paper works best as the anchor session on learning, with Prather et al. as optional background.

### Gaps
- Discussion questions are my suggestions, not drawn from the papers.
- Difficulty ratings are judgments based on length and method.

## Where findings conflict (speedups vs slowdowns), why?

### Takeaway
The conflicts mostly come from **task type, developer familiarity, outcome metric, tool generation and selection effects**:
- Speedups appear on well-specified or greenfield tasks, in enterprise settings, and for less experienced developers.
- Slowdowns appear for experts working in large, familiar, high-standard codebases.
- Velocity gains measured from repository data fade within months, while quality costs persist.

### Cited Findings
- **Task type and familiarity.**
  - Peng 2023 used a single greenfield JS HTTP-server task and found 55.8% faster. [arXiv](https://arxiv.org/abs/2302.06590)
  - METR used real tasks in mature repos where developers had about 5 years of experience and found 19% slower. [arXiv](https://arxiv.org/abs/2507.09089)
  - Google used one enterprise task and found about 21% faster with a large CI. [arXiv](https://arxiv.org/abs/2410.12944)
- **Experience level.**
  - In Cui et al., less experienced developers gained more. [SSRN](https://papers.ssrn.com/abstract=4945566)
  - In the Google study, seniority showed no significant effect. [slides summary](https://bvasiles.github.io/empirical-methods/assets/presentations/barros.pdf)
  - In Shen & Tamkin, novices to a library learned less and were not faster on average. [arXiv HTML v2](https://arxiv.org/html/2601.20245v2)
- **Outcome metric.**
  - Cui et al. count completed PRs/tasks. [SSRN](https://papers.ssrn.com/abstract=4945566)
  - METR and Google measure time per task. [arXiv](https://arxiv.org/abs/2507.09089); [arXiv](https://arxiv.org/abs/2410.12944)
  - The CMU studies measure repository-level commits and lines added, and add quality metrics. [arXiv](https://arxiv.org/abs/2511.04427)
- **Perception vs. measurement.** METR developers believed they were 20% faster while being 19% slower. [arXiv](https://arxiv.org/abs/2507.09089) DORA's "80%+ report productivity gains" is self-report. [Google blog](https://blog.google/technology/developers/dora-report-2025/)
- **Time horizon.** Cursor's velocity gains vanish after month 2, while warnings and complexity persist. [arXiv HTML v3](https://arxiv.org/html/2511.04427v3) This contrasts with Borg et al., where a controlled maintainability RCT found no downstream penalty. [arXiv](https://arxiv.org/abs/2507.00788)
- **Tool generation and selection.** METR's 2026 follow-up moved toward speedups (−18% returning, −4% new), but METR itself says selection effects make these numbers a poor proxy. Developers now refuse AI-disallowed work. [METR blog](https://metr.org/blog/2026-02-24-uplift-update/)

### Inferences
- There is no single "AI speedup" number. The effect depends on context, so the team should measure its own work rather than import vendor or survey figures.
- The quality findings (CMU) and the null maintainability result (Borg) may both hold. Borg tested one controlled feature handed to new developers. CMU measured cumulative, repo-wide drift over months with real, unsupervised use.
- The learning findings (Shen & Tamkin, Prather) and the "juniors gain most" finding (Cui) are not contradictory. Short-term output and long-term skill are different outcomes.

### Gaps
- No study found directly compares the same developers across greenfield and brownfield tasks within one RCT.
- No rigorous study found yet on full-stack TypeScript/Next.js teams specifically.
