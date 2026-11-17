# Software engineering practice papers for a small web team's paper club (testing, code review, reliability/incidents, security)

Scope note: this file covers papers on technique and practice only. Studies of how AI affects developer productivity are left out, because another researcher covers them. AI papers appear only where the paper is about a testing, review or risk technique. Verification status is shown for each paper. "Verified" means I fetched the official page or abstract during this research; numbers marked "(from PDF)" were read from the paper's own text.

## Shortlist: verified papers with presentation details

### Takeaway
There are 10 strong picks plus 3 companion papers. Six are classics (2014–2022) and seven are recent (2024–2025). Each one gives a small TypeScript/Next.js/Postgres team something it can act on:
- test the error-handling paths
- keep PRs small
- tune the false-positive rate of linters and AI reviewers
- plan for retry storms
- cluster flaky tests
- harden npm dependencies
- guard against database race conditions
- use safe-by-construction APIs

Suggested order for a mixed series:
1. Yuan
2. Sadowski code review
3. Sadowski static analysis
4. Cihan / AutoCommenter
5. TestGen-LLM / ACH
6. Systemic flakiness
7. Metastable failures
8. Ghosh incidents
9. Kern
10. npm weak links
11. ACIDRain

### Cited Findings

#### 1. Simple Testing Can Prevent Most Critical Failures (classic, peer-reviewed)
- **Citation.** Ding Yuan, Yu Luo, Xin Zhuang, Guilherme Renna Rodrigues, Xu Zhao, Yongle Zhang, Pranay U. Jain, Michael Stumm (University of Toronto). Full title: "Simple Testing Can Prevent Most Critical Failures: An Analysis of Production Failures in Distributed Data-Intensive Systems." OSDI '14, pp. 249–265. — [USENIX page](https://www.usenix.org/conference/osdi14/technical-sessions/presentation/yuan) · [PDF](https://files.usenix.org/s3fs-public/cdn/osdi14-paper-yuan.pdf)
- **Summary.** The authors studied 198 randomly sampled, user-reported failures in Cassandra, HBase, HDFS, Hadoop MapReduce and Redis. They also built Aspirator, a static checker for bad error-handling patterns. Running it on 9 systems found 143 bugs and bad practices, which developers fixed or confirmed. Fixing what Aspirator flagged would have prevented over 30% of the catastrophic failures. — [USENIX page](https://www.usenix.org/conference/osdi14/technical-sessions/presentation/yuan)
- **Key numbers (from PDF).** — [PDF](https://files.usenix.org/s3fs-public/cdn/osdi14-paper-yuan.pdf)
  - 92% of catastrophic failures came from incorrect handling of non-fatal errors that the software explicitly signaled.
  - In 58% of catastrophic failures, simple testing of the error-handling code would have exposed the fault.
  - 35% came from three trivial patterns:
    - an empty handler, or one that only logs
    - aborting on an overly general exception
    - a handler with a TODO or FIXME comment
  - Another 23% would have been caught by statement-coverage testing.
  - 77% of all failures could be reproduced by a unit test.
  - 74% of all failures were deterministic.
  - 98% manifested on 3 or fewer nodes.
- **Caveats.**
  - These are 2014-era Java/JVM distributed data systems, not web apps.
  - The failures are user-reported bugs, which skews the sample toward visible failures.
- **Why a small web team cares.** In TypeScript, `catch (e) { console.error(e) }` and blanket `try/catch` around Postgres calls are the same anti-patterns. The concrete takeaways are:
  - Lint rules such as `no-empty`, plus custom rules for "log-only catch" and "TODO in catch".
  - Unit tests that inject errors, for example a failed DB call, a timeout or a 5xx from a third party.
- **Discussion questions.**
  1. Where in our codebase do we swallow errors? Would an Aspirator-style lint rule be noisy or useful?
  2. Do our tests ever exercise the `catch` branches?
  3. Which of our past incidents would a unit test have caught?
- **Difficulty / length.** Medium. 17 pages, very readable, findings-first format. Good opener.

#### 2. Modern Code Review: A Case Study at Google (classic, peer-reviewed)
- **Citation.** Caitlin Sadowski, Emma Söderberg, Luke Church, Michal Sipko, Alberto Bacchelli. ICSE-SEIP 2018. — [Google Research page](https://research.google/pubs/modern-code-review-a-case-study-at-google/) · [PDF](https://storage.googleapis.com/gweb-research2023-media/pubtools/4476.pdf)
- **Summary.** A mixed-methods study: 12 interviews, a 44-respondent survey, and log analysis of 9 million reviewed changes. It covers why Google reviews code, how the practice works, and where it breaks down. — [Google Research page](https://research.google/pubs/modern-code-review-a-case-study-at-google/)
- **Key numbers (from PDF).** — [PDF](https://storage.googleapis.com/gweb-research2023-media/pubtools/4476.pdf)
  - Change size:
    - The median change modifies 24 lines. Over 10% modify one line, and about 90% touch fewer than 10 files.
    - For comparison, AMD's median is 44 lines and Lucent's is 263 lines.
  - Reviewers and comments:
    - The median reviewer count is 1, and fewer than 25% of changes have more than one reviewer.
    - Comments per change peak at about 12.5 for changes of about 1,250 lines.
  - Speed:
    - Median wait for first feedback is under 1 hour for small changes and about 5 hours for very large ones.
    - Median total review latency is under 4 hours, compared with 14.7–19.8 hours at AMD, Chrome OS and Microsoft.
    - 70% of changes are committed within 24 hours of being mailed out.
  - Time spent: developers review for an average of 3.2 hours a week (median 2.6).
  - Motivations: education, keeping norms, gatekeeping, and accident prevention. The "Finding" sections give the details.
- **Caveats.**
  - The data is from 2016–2017 and comes from a single company with a strong ownership and "readability" culture.
  - The finding that one reviewer is enough may depend on that culture.
- **Why a small web team cares.** It gives empirical backing for small PRs, one reviewer, and fast turnaround as team norms. It also offers baseline numbers for comparing your own GitHub PR stats.
- **Discussion questions.**
  1. What are our median PR size and time-to-first-review? How do they compare with Google's?
  2. Is one reviewer enough for us? When should we require two, for example for migrations or auth?
  3. Which of the paper's breakdowns, such as tone, unclear expectations or slow reviews, do we see?
- **Difficulty / length.** Easy. About 10 pages.

#### 3. Lessons from Building Static Analysis Tools at Google (classic, peer-reviewed magazine)
- **Citation.** Caitlin Sadowski, Edward Aftandilian, Alex Eagle, Liam Miller-Cushon, Ciera Jaspan. *Communications of the ACM* 61(4), 2018, pp. 58–66. — [Google Research page](https://research.google/pubs/lessons-from-building-static-analysis-tools-at-google/) · [PDF](https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf)
- **Summary.** Google's attempts to roll out FindBugs failed: dashboards, bug-filing and early review integrations were all ignored. Two systems succeeded:
  - Tricorder, which shows analysis results in code review.
  - Error Prone, which runs checks in the compiler.

  The central idea is the "effective false positive": a finding the developer took no positive action on, regardless of whether it was technically correct. — [PDF](https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf)
- **Key numbers (from PDF).** — [PDF](https://storage.googleapis.com/gweb-research2023-media/pubtools/4365.pdf)
  - In the 2009 FindBugs "Fixit" week, engineers reviewed 3,954 warnings but only 16% (640) were fixed, although 44% led to bug reports.
  - Survey respondents rated 74% of compile-time issues as "real problems", against 21% of issues found in checked-in code. The authors attribute this to a "survivor effect".
  - Rules for checks:
    - A code-review check must have under 10% effective false positives.
    - A compiler check must have none.
    - If an analyzer's "Not useful" ratio goes above 10%, it is disabled until fixed.
  - Tricorder scale as of January 2018: about 50,000 code-review changes a day, more than 5,000 "Please fix" clicks a day, about 3,000 automated fixes applied a day, and about 250 "Not useful" clicks a day.
  - When proposed fixes were sent for already-checked-in code, 57% of recipients were happy, 41% neutral and 2% negative.
- **Caveats.**
  - It is an experience report, not a controlled study.
  - It covers Java/C++ at Google's scale.
- **Why a small web team cares.** It applies directly to ESLint, TypeScript `strict` flags, CodeQL and Semgrep, and AI review bots:
  - Turn noisy rules off.
  - Move high-confidence checks into `tsc` or CI errors rather than warnings.
  - Prefer checks that come with auto-fixes.
- **Discussion questions.**
  1. Which of our lint warnings does everyone ignore? Should they become errors or be deleted?
  2. How would we measure "effective false positives" for our AI reviewer or linter?
  3. Which checks could move from review time to compile time, for example via stricter `tsconfig` settings?
- **Difficulty / length.** Easy. 9 pages, magazine style.

#### 4. Metastable Failures in the Wild (peer-reviewed), with companion "Metastable Failures in Distributed Systems"
- **Citation.** Lexiang Huang, Matthew Magnusson, Abishek Bangalore Muralikrishna, Salman Estyak, Rebecca Isaacs, Abutalib Aghayev, Timothy Zhu, Aleksey Charapko. OSDI '22. — [USENIX page](https://www.usenix.org/conference/osdi22/presentation/huang-lexiang) · [PDF](https://www.usenix.org/system/files/osdi22-huang-lexiang.pdf)
- **Companion paper.** Bronson et al., "Metastable Failures in Distributed Systems," HotOS 2021. It first defined the concept. I did not fetch it in this session, so it is unverified here and its link should be checked before use.
- **Summary.** A metastable failure is one where a trigger, such as a load spike or a brief slowdown, starts a feedback loop that keeps the system degraded after the trigger is gone. Retry storms and cache-miss cascades are typical examples. The authors studied public incident reports and extended the model with two kinds of trigger and two kinds of amplification mechanism. They then reproduced the failures in example applications. — [USENIX page](https://www.usenix.org/conference/osdi22/presentation/huang-lexiang)
- **Key numbers.** — [USENIX page](https://www.usenix.org/conference/osdi22/presentation/huang-lexiang)
  - The study covers 22 metastable failures from 11 organizations.
  - At least 4 of 15 major AWS outages in the previous decade were metastable failures.
- **Caveats.**
  - It relies on public postmortems, so it inherits their selection bias.
  - Most cases are large-scale.
- **Why a small web team cares.** Next.js API routes behind a Postgres connection pool can fail this way, through client retries, serverless cold-start storms or connection-pool exhaustion. The defenses are:
  - retry budgets, and exponential backoff with jitter
  - load shedding
  - circuit breakers
  - caches whose expiry times are spread out rather than all expiring together
- **Discussion questions.**
  1. Where do we retry automatically: client fetch, SDKs, queue workers? Are the retries capped and jittered?
  2. What happens to our Postgres pool if latency doubles for 60 seconds?
  3. Have we ever had an outage that outlasted its trigger?
- **Difficulty / length.** Medium–hard. The OSDI paper is about 16 pages. Present the HotOS paper first, since workshop papers are usually around 6 pages.

#### 5. How to Fight Production Incidents? An Empirical Study on a Large-scale Cloud Service (peer-reviewed)
- **Citation.** Supriyo Ghosh, Manish Shetty, Chetan Bansal, Suman Nath (Microsoft). ACM SoCC 2022. Best Paper Award. DOI 10.1145/3542929.3563482. — [Microsoft Research page](https://www.microsoft.com/en-us/research/?p=881646) · [DOI](https://doi.org/10.1145/3542929.3563482)
- **Summary.** The authors analyzed high-severity incidents and postmortems from a large Microsoft service. Secondary sources identify it as Microsoft Teams, with 152 incidents. They looked at:
  - root causes
  - how detection, root-causing and mitigation relate
  - which gaps delayed the response
  - what automation or testing would have helped
  
  — [Microsoft Research page](https://www.microsoft.com/en-us/research/?p=881646)
- **Key number.** About 40% of incidents traced to code or configuration bugs, and about 60% to non-code causes such as infrastructure, deployment and service dependencies. This split comes from a secondary summary, not the paper text, so check it in the PDF before presenting. — [systemsdistributed summary](https://systemsdistributed.substack.com/p/how-to-fight-production-incidents) · [talk notes](https://asatarin.github.io/talks/2023-01-how-to-fight-incidents)
- **Caveats.**
  - It is one service at one company.
  - The authors and speakers say the results may not transfer to other services.
  — [talk notes](https://asatarin.github.io/talks/2023-01-how-to-fight-incidents)
- **Why a small web team cares.** Many outages are not code bugs: expired certificates, a vendor going down, a bad environment variable, a failed migration. The paper gives a vocabulary for writing postmortems and for deciding what to automate, such as config validation, deploy checks or dependency health checks.
- **Discussion questions.**
  1. Sort our last 10 incidents into code, config, infrastructure and dependency. What is our split?
  2. Which stage was slowest for us: detection, root-causing or mitigation?
  3. Which config changes, such as environment variables or feature flags, ship without any validation?
- **Difficulty / length.** Medium. A full conference paper, roughly 15 or more pages.

#### 6. TestGen-LLM: Automated Unit Test Improvement using Large Language Models at Meta (peer-reviewed)
- **Citation.** Nadia Alshahwan, Jubin Chheda, Anastasia Finegenova, Beliz Gokkaya, Mark Harman, Inna Harper, Alexandru Marginean, Shubho Sengupta, Eddy Wang. FSE 2024 (32nd ACM Symposium on the Foundations of Software Engineering). arXiv 2402.09171. — [arXiv](https://arxiv.org/abs/2402.09171)
- **Summary.** TestGen-LLM generates candidate unit tests with LLMs and keeps only those that pass a series of filters (an "assured" approach):
  1. the test builds
  2. it passes reliably, which screens out flaky tests
  3. it increases coverage
  
  It was deployed in Instagram and Facebook "test-a-thons". — [arXiv](https://arxiv.org/abs/2402.09171)
- **Key numbers.** — [arXiv](https://arxiv.org/abs/2402.09171)
  - Of the generated tests, 75% built correctly, 57% passed reliably and 25% increased coverage.
  - 11.5% of the classes it was applied to were improved.
  - Engineers accepted 73% of its recommendations for production.
- **Caveats.**
  - It covers Kotlin/Android at Meta.
  - Coverage gain is a proxy and does not show the tests find bugs.
  - The tool and models are internal.
- **Why a small web team cares.** The transferable idea is the filter pipeline. AI-written Jest/Vitest tests should be accepted only if they compile, pass several times in a row, and add coverage. It is a recipe for safely adopting Copilot or Claude-generated tests.
- **Discussion questions.**
  1. Could we run "generate, run 5 times, check coverage diff" in CI for AI-written tests?
  2. Is coverage the right acceptance signal? What would we use instead?
  3. What is the cost of a passing but meaningless test?
- **Difficulty / length.** Easy–medium. 12 pages.

#### 7. ACH: Mutation-Guided LLM-based Test Generation at Meta (preprint, 2025)
- **Citation.** Christopher Foster, Abhishek Gulati, Mark Harman, Inna Harper, Ke Mao, Jillian Ritchey, Hervé Robert, Shubho Sengupta. arXiv 2501.12862, January 2025. arXiv says it was submitted to the FSE 2025 Industry Track. I did not confirm whether it was accepted, so treat it as a preprint. — [arXiv](https://arxiv.org/abs/2501.12862)
- **Summary.** ACH reverses the usual approach. An LLM first creates realistic mutants, meaning simulated faults about a specific concern such as privacy. A second step generates tests that "kill" those mutants. An LLM agent also detects equivalent mutants, which cannot be caught by any test. — [arXiv](https://arxiv.org/abs/2501.12862)
- **Key numbers.** — [arXiv](https://arxiv.org/abs/2501.12862)
  - It was applied to 10,795 Android Kotlin classes across 7 platforms, producing 9,095 mutants and 571 privacy-hardening tests.
  - The equivalent-mutant agent had precision 0.79 and recall 0.47, rising to 0.95 and 0.96 with simple preprocessing.
  - In Messenger and WhatsApp test-a-thons, engineers accepted 73% of the tests and judged 36% privacy-relevant.
- **Caveats.**
  - It is a preprint.
  - It is an internal Meta system, and acceptance by engineers is not the same as bugs found.
- **Why a small web team cares.** It gives a better target than coverage: "would this test catch the bug we're worried about?" A team can do a manual version by writing a mutant for a specific risk, such as a dropped auth check or a broken tenant filter, and checking that a test fails. Stryker, a JavaScript mutation-testing tool, can automate the general case. Pair this paper with #6.
- **Discussion questions.**
  1. What three faults would hurt us most, for example a leaked guest list or a missing RLS policy? Do any tests fail if we inject them?
  2. Is mutation score worth tracking for our critical modules?
  3. When should humans write the "fault model" rather than an LLM?
- **Difficulty / length.** Medium. Industry-track length, about 10–12 pages; I did not verify the page count.

#### 8. Systemic Flakiness: An Empirical Analysis of Co-Occurring Flaky Test Failures (preprint, 2025)
- **Citation.** Owain Parry, Gregory Kapfhammer, Michael Hilton, Phil McMinn. arXiv 2504.16777, April 2025. arXiv lists no venue, so treat it as a preprint. — [arXiv](https://arxiv.org/abs/2504.16777)
- **Summary.** Flaky tests tend to fail together in clusters that share a root cause, such as network issues or external dependencies. Fixing the shared cause is therefore more efficient than fixing tests one by one. — [arXiv](https://arxiv.org/abs/2504.16777)
- **Key numbers.** — [arXiv](https://arxiv.org/abs/2504.16777)
  - The dataset is 10,000 test-suite runs from 24 Java projects on GitHub, containing 810 flaky tests.
  - 75% of flaky tests belong to a cluster, and the mean cluster size is 13.5 tests.
  - The abstract cites an industrial case study in which developers spent 1.28% of their time repairing flaky tests, at $2,250 a month.
- **Caveats.**
  - It is a preprint covering Java projects only.
  - The cost figure is cited from another study.
- **Why a small web team cares.** End-to-end tests with Playwright or Cypress against a shared Postgres or Supabase instance are prime sources of flakiness. When several tests go red together, look for one shared cause, such as test DB state, network or time, instead of adding `retry: 2`.
- **Discussion questions.**
  1. Which of our tests fail together? Do we even record per-test pass/fail history?
  2. Is our quarantine or retry policy hiding a systemic cause?
  3. Would isolating the DB per test file remove most flakiness?
- **Difficulty / length.** Medium. A standard empirical paper.

#### 9. Automated Code Review In Practice (peer-reviewed, 2025), with companion AutoCommenter (Google)
- **Citation.** Umut Cihan, Vahid Haratian, Arda İçöz, Mert Kaan Gül, Ömercan Devran, Emircan Furkan Bayendur, Baykal Mehmet Uçar, Eray Tüzün. ICSE 2025 SEIP track. arXiv 2412.18531. — [arXiv](https://arxiv.org/abs/2412.18531)
- **Summary.** An industrial study at Beko of an LLM-based automated review tool built on Qodo PR-Agent. About 238 practitioners in ten projects had access. — [arXiv](https://arxiv.org/abs/2412.18531)
- **Key numbers.** — [arXiv](https://arxiv.org/abs/2412.18531)
  - The detailed analysis covers 3 projects with 4,335 PRs, of which 1,568 received automated reviews. A survey covered 22 practitioners.
  - 73.8% of automated comments were resolved.
  - Average PR closure time rose from 5h52m to 8h20m.
  - (The vendor and company names come from my knowledge of the full paper; the abstract fetch confirmed only the study design and numbers.)
- **Companion paper.** Vijayvergiya et al., "AI-Assisted Assessment of Coding Practices in Modern Code Review," AIware '24 (DOI 10.1145/3664646.3665664). It describes Google's AutoCommenter, an LLM that flags violations of best practices in C++, Java, Python and Go for "tens of thousands" of developers. The abstract gives no headline metrics, so check numbers in the full text. — [arXiv](https://arxiv.org/abs/2405.13565)
- **Caveats.**
  - It is a single company.
  - Resolving a comment is not the same as the comment being valuable.
  - The longer closure time could mean more fixes or more friction; the paper has to be read to see how the authors interpret it.
- **Why a small web team cares.** It is honest evidence that AI review bots on GitHub, such as CodeRabbit, Copilot review or Claude, have costs as well as benefits. Pair it with #3: a bot needs a false-positive budget and a "not useful" feedback loop. This paper is about the review technique, not developer productivity in general.
- **Discussion questions.**
  1. If we use an AI reviewer, what share of its comments do we act on? Is it above or below Google's 90% bar?
  2. Is a 2.5-hour slower PR closure acceptable if the bot catches real issues?
  3. Which categories should the bot comment on, and which should it never touch?
- **Difficulty / length.** Easy. About 10 pages, practitioner-friendly.

#### 10. Moving Faster and Reducing Risk: Using LLMs in Release Deployment (preprint, 2024)
- **Citation.** Rui Abreu, Vijayaraghavan Murali, Peter C. Rigby, Chandra Maddila, Weiyan Sun, Jun Ge, Kaavya Chinniah, Audris Mockus, Megh Mehta, Nachiappan Nagappan (Meta). arXiv 2410.06351, October 2024. No venue is listed, so treat it as a preprint. — [arXiv](https://arxiv.org/abs/2410.06351)
- **Summary.** Meta assigns each diff a risk score and uses it to gate the riskiest diffs during weekends and code freezes, rather than blocking all changes. The paper compares three ways of producing the score:
  - logistic regression
  - StarBERT
  - fine-tuned code LLMs: iCodeLlama-34B and iDiffLlama-13B
  
  — [arXiv](https://arxiv.org/abs/2410.06351)
- **Key numbers.** — [arXiv](https://arxiv.org/abs/2410.06351)
  - The logistic-regression baseline captures this share of SEVs (serious incidents):
    - 18.7% when gating the top 5% riskiest diffs (weekend gating)
    - 27.9% when gating the top 10% ("yellow")
    - 84.6% when gating the top 50% ("red")
  - StarBERT captured 0.61x, 0.85x and 0.81x as many SEVs as the baseline.
  - The best risk-aligned LLM reached 1.40x, 1.52x and 1.05x the baseline in production. The abstract does not say which model produced which value.
- **Caveats.**
  - It is a preprint.
  - It depends on Meta's SEV labeling at very large scale.
- **Why a small web team cares.** The technique does not need an LLM: "don't block everything, block the risky diffs". A small team can use simple heuristics, such as touching migrations, auth or payments, a large diff, or a Friday deploy, to require an extra reviewer or a delay.
- **Discussion questions.**
  1. Which of our diffs caused incidents? Could simple features have flagged them, such as files touched, size or migration present?
  2. Should we have "yellow" and "red" deploy periods?
  3. What is the cost of a false gate versus a missed SEV for us?
- **Difficulty / length.** Medium.

#### 11. Developer Ecosystems for Software Safety (peer-reviewed, 2024)
- **Citation.** Christoph Kern (Google). Google Research lists it as *ACM Queue* 22 (2024), pp. 73–99. Library catalogs also list a version in *Communications of the ACM* 67(6), June 2024, pp. 52–60. — [Google Research page](https://research.google/pubs/developer-ecosystems-for-software-safety/)
- **Summary.** A decade of Google's experience, arguing that safety and security are emergent properties of the developer ecosystem: languages, libraries, frameworks, and build and deploy tooling. Defect classes like XSS and SQL injection should therefore be ruled out by safe-by-construction APIs, not by hoping each developer is careful. — [Google Research page](https://research.google/pubs/developer-ecosystems-for-software-safety/)
- **Key finding.** Applying secure-by-design principles across hundreds of applications cut common defect classes drastically, in some cases to near-zero residual rates. The abstract gives no per-class numbers, so take those from the full text. — [Google Research page](https://research.google/pubs/developer-ecosystems-for-software-safety/)
- **Related.** Google's Nov 2025 Android security blog post, "Rust in Android: move fast and fix things" by Jeff Vander Stoep, makes the same argument for languages. — [Google blog](https://blog.google/security/rust-in-android-move-fast-fix-things/)
  - Memory-safety vulnerabilities fell below 20% of all Android vulnerabilities for the first time.
  - Rust changes have about a 4x lower rollback rate than C++ for medium and large changes, and spend about 25% less time in code review.
  - It is a blog post, not peer-reviewed, and commenters note the C++ code is older and more complex, which could account for some of the gap. — [Slashdot discussion](https://developers.slashdot.org/story/25/11/17/012246/rust-in-android-more-memory-safety-fewer-revisions-fewer-rollbacks-shorter-reviews)
- **Caveats.**
  - It is an experience and position paper.
  - The quantitative claims are Google-internal.
- **Why a small web team cares.** This is the best security pick for a Next.js/Postgres team. The same principle applies to:
  - React's escaping by default, with `dangerouslySetInnerHTML` as the reviewable exception
  - parameterized queries and query builders instead of string SQL
  - Postgres row-level security instead of ad-hoc `WHERE tenant_id = ...`
  - Trusted Types and CSP
  - typed environment-variable and config schemas
- **Discussion questions.**
  1. Which of our "be careful" rules could become "impossible by construction"?
  2. Where do we escape the safe defaults (raw SQL, `dangerouslySetInnerHTML`, service-role keys), and how is each escape reviewed?
  3. Should we lint-ban the unsafe APIs and allow them only through an explicit exception list?
- **Difficulty / length.** Easy–medium. Long but essay-style; the CACM version is shorter, at about 9 pages.

#### 12. What are Weak Links in the npm Supply Chain? (peer-reviewed)
- **Citation.** Nusrat Zahan, Thomas Zimmermann, Patrice Godefroid, Brendan Murphy, Chandra Maddila, Laurie Williams. ICSE-SEIP 2022, DOI 10.1145/3510457.3513044. arXiv 2112.10165. — [arXiv](https://arxiv.org/abs/2112.10165)
- **Summary.** The authors defined six "weak link" signals in npm packages and measured them across 1.63 million packages. Examples include install scripts and maintainer accounts whose email domains have expired. They then surveyed 470 npm developers about the signals. — [arXiv](https://arxiv.org/abs/2112.10165)
- **Key numbers.** — [arXiv](https://arxiv.org/abs/2112.10165)
  - 2,818 maintainer email addresses were tied to expired domains, putting 8,494 packages at risk of account hijacking.
  - The install-script signal found 11 malicious packages.
  - Developers suggested 8 more signals.
  - The paper cites 650% year-on-year growth in supply-chain attacks in 2021.
- **Caveats.**
  - The data is from 2021, and npm has since added 2FA requirements and provenance.
  - It is still a good base for discussing later npm worm incidents.
- **Why a small web team cares.** Supply-chain risk in `node_modules` is the most realistic security threat for a TypeScript team. Practical steps:
  - `npm ci` with lockfiles
  - `--ignore-scripts` or allowlisted install scripts
  - pinning, plus Renovate or Dependabot with a delay
  - provenance checks
  - fewer dependencies
- **Discussion questions.**
  1. How many of our transitive dependencies run install scripts?
  2. Would we notice if a maintainer account behind one of our dependencies was taken over?
  3. What is our policy for adding a new dependency?
- **Difficulty / length.** Easy. About 10 pages.

#### 13. ACIDRain: Concurrency-Related Attacks on Database-Backed Web Applications (classic, peer-reviewed)
- **Citation.** Todd Warszawski, Peter Bailis (Stanford). SIGMOD 2017. DOI 10.1145/3035918.3064037. — [DOI](https://doi.org/10.1145/3035918.3064037) · [The Morning Paper summary](https://blog.acolyer.org/2017/08/07/acidrain-concurrency-related-attacks-on-database-backed-web-applications/)
- **Summary.** Attackers can fire concurrent API requests to exploit race conditions caused by weak isolation levels or by application-level check-then-act logic. Examples include overspending a gift card or corrupting inventory. The authors propose 2AD (Abstract Anomaly Detection), which works from database logs to find these anomalies. Such an attack bankrupted the Bitcoin exchange Flexcoin in 2014. — [Morning Paper summary](https://blog.acolyer.org/2017/08/07/acidrain-concurrency-related-attacks-on-database-backed-web-applications/)
- **Key number.** In self-hosted eCommerce applications, 2AD found 22 vulnerabilities spanning over 2 million websites. One secondary source says 12 applications were studied, but I did not confirm that count from the paper. — [search summary of abstract via Morning Paper](https://blog.acolyer.org/2017/08/07/acidrain-concurrency-related-attacks-on-database-backed-web-applications/)
- **Caveats.**
  - The apps studied are PHP eCommerce applications.
  - The attacks need specific concurrency windows.
- **Why a small web team cares.** It applies directly to Postgres: its default isolation level is READ COMMITTED. Typical race conditions:
  - "check RSVP capacity, then insert"
  - "check coupon unused, then redeem"
  - "count invites remaining"
  
  Fixes are `SELECT ... FOR UPDATE`, unique constraints, atomic `UPDATE ... WHERE remaining > 0 RETURNING`, or SERIALIZABLE isolation with retries.
- **Discussion questions.**
  1. Where do we read, decide in JavaScript, then write, without a lock or constraint?
  2. Could someone double-redeem or over-book with 50 parallel requests? Can we test that?
  3. When should we use DB constraints instead of application validation?
- **Difficulty / length.** Medium–hard; the database theory is dense. Present it with the Morning Paper summary.

### Inferences
- The strongest thread for a small web team runs through #1, #3, #7 and #11. Prevent defect classes by construction where possible, test the failure paths, and make automated feedback such as linters and AI reviewers high-precision or turn it off.
- The Meta AI testing papers (#6, #7, #10) are worth presenting for their technique: filter pipelines, fault-model-guided tests and risk gating. All three can be done without LLMs at small scale.
- Picks #9 and #3 together make a good AI code review session. Google's 10% effective-false-positive bar gives a concrete standard to judge AI review bots against. Cihan et al.'s slower PR closure is a cost to weigh.
- A 10-session series could be:
  1. #1
  2. #2
  3. #3 with #9
  4. #6 with #7
  5. #8
  6. #4
  7. #5
  8. #11
  9. #12
  10. #13

  That covers testing (4), review (2–3), reliability (3) and security (3).
- Monorepo, DORA/Accelerate and memory-safety-specific papers seem less useful here. A small team gains little from Google's monorepo paper. DORA's main findings are in a book and annual reports, the 2024–2025 reports focus on AI and productivity (out of scope), and Rust results matter little to a TypeScript stack beyond the "safe by construction" argument covered by #11.

### Gaps
- **Bronson et al., HotOS 2021.** I did not fetch it in this session. Its existence is well established, and Huang et al. cite it as the origin of the framework, but confirm its DOI or link before distributing.
- **Ghosh et al., SoCC 2022.** The 40% code/config versus 60% non-code split and the 152-incident / Teams details come from secondary summaries, not the paper text.
- **ACH (#7) and Systemic Flakiness (#8).** I could not confirm their final peer-review status as of Nov 2026. arXiv shows them as preprints; ACH was submitted to the FSE 2025 Industry Track.
- **Meta DRS paper (#10).** I could not confirm a peer-reviewed venue.
- **AutoCommenter.** The abstract has no quantitative results, so the full text must be read for its precision and acceptance numbers.
- **Kern (#11).** The per-defect-class numbers for XSS and SQL injection are not in the abstract. The venue appears differently in different places (Queue vs CACM).
- **2025–2026 web-specific papers.** I found no strong peer-reviewed 2025–2026 paper on cloud incident studies for general web services. The 2025 incident studies I found are specific to GenAI or inference services (Microsoft arXiv 2504.08865; arXiv 2511.07424), so they are less relevant.
- **Searched for but not verified.**
  - newer 2025–2026 Google or Meta AI code review papers beyond AutoCommenter
  - Meta's follow-up work to ACH
  - Feral Concurrency Control (Bailis et al., SIGMOD 2015), which is a possible substitute or companion for #13
  - Google flaky-test papers (e.g., Ziftci & Cavalcanti, ICSME 2020)
- **Not shortlisted.** "Why Google Stores Billions of Lines of Code in a Single Repository" (CACM 2016) and DORA/Accelerate were not shortlisted or re-verified this session. See the Inferences above.
- **Page counts.** Where no page range was on the official page, page counts and difficulty ratings are my estimates.
