# Classic and "just interesting" CS/tech papers for a web product team's paper club

Scope: classic and broadly interesting papers/essays for a small TypeScript/Next.js/Postgres team. Excludes AI dev-productivity studies, LLM agent benchmarks, and testing/code-review/incident papers (those are covered by other researchers). Because of that exclusion I dropped Cook's "How Complex Systems Fail" (it is an incident/safety paper).

How I checked links (2026-11-17): every PDF/HTML link below was fetched with curl and returned HTTP 200. For each PDF I pulled the first-page text with pdftotext to confirm the title and authors, and counted pages and words. DOIs were checked to be registered (doi.org returns a 302 to the publisher). ACM DL pages return 403 to automated clients, so I could not read the ACM landing pages themselves. Page/word counts are of the linked PDF.

## Key Question 1: Which ~8-10 papers make the best shortlist, and why?

### Takeaway
Ten core picks work as a set. Three are about complexity and what programming is (Tar Pit, No Silver Bullet, Naur), and they pair well with The Bitter Lesson for AI debates. Three are distributed-systems and web-scale fundamentals (End-to-End, Lamport clocks, Memcache at Facebook). Two are Postgres and data-model papers the team can use right away (SSI in PostgreSQL, Stonebraker & Pavlo 2024). One is on security and trust (Thompson). Dynamo and Local-First are strong alternates, and BB(5) and Google's Quantum Echoes are the 2025 "outside software" picks.

### Cited Findings
Core shortlist (recommended order roughly from easiest to hardest session):

| # | Paper | Year / venue | Link (verified 200) | Length of linked file |
|---|---|---|---|---|
| 1 | Reflections on Trusting Trust (Thompson) | 1984, CACM Turing Award Lecture | [PDF](https://www.cs.cmu.edu/~rdriley/487/papers/Thompson_1984_ReflectionsonTrustingTrust.pdf) | 3 pp, ~1.9k words |
| 2 | The Bitter Lesson (Sutton) | 2019, essay | [HTML](http://www.incompleteideas.net/IncIdeas/BitterLesson.html) | ~1 page |
| 3 | Programming as Theory Building (Naur) | 1985, Microprocessing and Microprogramming | [PDF scan](https://pages.cs.wisc.edu/~remzi/Naur.pdf) | 14-page scan (image only, no text layer) |
| 4 | No Silver Bullet (Brooks) | 1986 UNC TR86-020; IEEE Computer 1987 | [PDF](https://www.cs.unc.edu/techreports/86-020.pdf) | 21 pp, ~7.9k words |
| 5 | End-to-End Arguments in System Design (Saltzer, Reed, Clark) | 1984, ACM TOCS | [PDF](https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf) | 10 pp, ~6k words |
| 6 | Time, Clocks, and the Ordering of Events in a Distributed System (Lamport) | 1978, CACM | [PDF](https://lamport.azurewebsites.net/pubs/time-clocks.pdf) | 8 pp, ~7.7k words |
| 7 | Scaling Memcache at Facebook (Nishtala et al.) | 2013, USENIX NSDI | [PDF](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf) | 18 pp in PDF, ~10k words |
| 8 | Serializable Snapshot Isolation in PostgreSQL (Ports & Grittner) | 2012, PVLDB 5(12) / VLDB 2012 | [PDF](https://vldb.org/pvldb/vol5/p1850_danrkports_vldb2012.pdf), [arXiv](https://arxiv.org/abs/1208.4179) | 12 pp, ~12.6k words |
| 9 | What Goes Around Comes Around... And Around... (Stonebraker & Pavlo) | 2024, SIGMOD Record 53(2) | [PDF](https://db.cs.cmu.edu/papers/2024/whatgoesaround-sigmodrec2024.pdf) | 17 pp, ~14.4k words |
| 10 | Out of the Tar Pit (Moseley & Marks) | 2006, self-published paper | [PDF](https://curtclifton.net/papers/MoseleyMarks06a.pdf) | 66 pp, ~22.7k words |

Strong alternates (also verified):
- Dynamo: Amazon's Highly Available Key-value Store (DeCandia et al., SOSP 2007). [PDF](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), 16 pp, ~14.9k words. DOI 10.1145/1294261.1294281 is registered.
- Local-First Software: You Own Your Data, in spite of the Cloud (Kleppmann, Wiggins, van Hardenberg, McGranaghan; Onward! 2019). [Essay](https://www.inkandswitch.com/essay/local-first/) (the old URL https://www.inkandswitch.com/local-first/ meta-refreshes to it), [PDF](https://martin.kleppmann.com/papers/local-first.pdf), 25 pp, ~14.5k words. DOI 10.1145/3359591.3359737 is registered.
- Hints for Computer System Design (Lampson, 1983). [PDF on author's site](https://bwlampson.site/33-Hints/Acrobat.pdf), 27 pp in this rendering. Note: the Microsoft Research PDF URL often listed (microsoft.com/.../acrobat-17.pdf) timed out or failed in my check, so use bwlampson.site.
- The Design of POSTGRES (Stonebraker & Rowe). [Berkeley tech report ERL M85/95 PDF](https://dsf.berkeley.edu/papers/ERL-M85-95.pdf), 28 pp, ~12.8k words. The abstract lists six design goals, including user-extensible data types, operators, and access methods; alerters and triggers; and simpler crash-recovery code. Those goals are why Postgres has extensions today.
- Attention Is All You Need (Vaswani et al., 2017). [arXiv](https://arxiv.org/abs/1706.03762). Famous, but it is denser and less durable as an engineering lesson for this team than The Bitter Lesson.
- Not recommended for a short session: "What Every Programmer Should Know About Memory" (Drepper). It is a book-length document (well over 100 pages), and the CPU-cache material is far from a TS/Postgres stack. Its length is from my own knowledge; I did not fetch it.

### Inferences
- These would fit two-month "tracks": (a) complexity and the nature of programming: Brooks, then Tar Pit, then Naur and Sutton together as an "AI-era" session; (b) Data: SSI, then Stonebraker & Pavlo, optionally The Design of POSTGRES; (c) Distributed and web scale: End-to-End, Lamport, then Memcache, with Dynamo as a bonus.
- Thompson (3 pages) and Sutton (1 page) are ideal "first sessions" or lightning sessions. Tar Pit (66 pages) should be assigned as sections, or presented by one person with others reading only the first half.
- Naur plus Sutton is the strongest single session for current AI-coding debates. Naur argues that the program's real value lives in programmers' heads. Sutton argues that general methods plus compute beat human-encoded knowledge. Together they set up a direct tension.

### Gaps
- I did not find a stable official ACM-hosted free PDF for Thompson. The CMU course mirror works, and the ACM DOI 10.1145/358198.358210 returned 403 to my automated check, so I could not confirm the landing page.
- The Naur PDF is an image-only scan, so I could not confirm the page count against the journal pagination (journal citation is commonly given as 15(5):253–261; that comes from my own knowledge and is not verified here).

## Key Question 2: Presentation details for each pick (summary, core idea, 2026 relevance, discussion questions, difficulty)

### Takeaway
Every core pick has a verified free link and fits a 30–60 minute session. The most directly useful ones for this team are SSI in PostgreSQL (when to use SERIALIZABLE and retry), Memcache at Facebook (cache invalidation, leases, thundering herds), and Stonebraker & Pavlo (why "just use Postgres" keeps winning). The most discussion-provoking are Naur and Sutton.

### Cited Findings
Discussion questions below are my own suggestions, not from the sources. Summaries are drawn from the linked papers (titles, authors, and abstracts confirmed from the PDFs/pages), plus my knowledge of the well-known content.

**1. Reflections on Trusting Trust: Ken Thompson, CACM Turing Award Lecture, Aug 1984**
- Link: [PDF](https://www.cs.cmu.edu/~rdriley/487/papers/Thompson_1984_ReflectionsonTrustingTrust.pdf) (title page confirmed; the subtitle asks to what extent one should trust a statement that a program is free of Trojan horses).
- Summary: Thompson describes a self-reproducing C compiler trojan. It inserts a backdoor into `login` and re-inserts itself when compiling the compiler, so the source code of both is clean. His moral is that you can't trust code you did not totally create yourself.
- Core idea: Source review can't establish trust; trust is transitive through the whole toolchain.
- 2026 relevance: npm/pnpm supply chain, postinstall scripts, compromised maintainers, build caches, reproducible builds, and SLSA-style provenance. Also AI-generated code and models as new "compilers" you don't control.
- Discussion: (1) What in our `node_modules`/CI/Vercel build do we implicitly trust, and how would we know if it were compromised? (2) Are lockfiles, provenance attestations, or reproducible builds an answer to Thompson, or only a partial one? (3) Is an LLM code assistant a "compiler" in Thompson's sense?
- Difficulty/length: Easy; 3 pages (~1.9k words). 20–30 minutes.

**2. The Bitter Lesson: Rich Sutton, 13 March 2019 (essay)**
- Link: [HTML](http://www.incompleteideas.net/IncIdeas/BitterLesson.html) (200, ~7 KB page).
- Summary: Across 70 years of AI research (chess, Go, speech, vision), methods that use general computation (search and learning) have eventually beaten methods that build in human knowledge. Researchers keep relearning this "bitterly".
- Core idea: Bet on general methods that scale with compute, not on encoding what we think we know.
- 2026 relevance: It is the founding text for "scale is all you need" arguments, and it is heavily cited in debates on agents vs. hand-built tooling. It also applies to product decisions such as hand-written rules vs. model-based features.
- Discussion: (1) Does the lesson apply to software engineering itself (hand-crafted architecture vs. models writing code)? (2) Where in our product would a general learned approach beat our hand-tuned logic, and where would it be worse? (3) What does the essay ignore (cost, data, reliability, explainability)?
- Difficulty/length: Easy; about one page. Pair with Naur in one session.

**3. Programming as Theory Building: Peter Naur, Microprocessing and Microprogramming, 1985**
- Link: [PDF scan](https://pages.cs.wisc.edu/~remzi/Naur.pdf) (hosted on Remzi Arpaci-Dusseau's UW-Madison page; 200, image scan).
- Summary: Naur argues that programming is building a theory: a shared understanding in programmers' heads of how the program relates to the world and why it is built the way it is. The code and docs are only a partial, lossy expression of that theory. When the original team leaves, the program "dies" even if the code remains, and newcomers can't fully rebuild the theory from the text.
- Core idea: The theory, not the source code, is the primary product of programming.
- 2026 relevance: It is central to AI-coding debates. If code is generated faster than anyone builds a theory of it, who holds the theory? It also bears on onboarding, handoffs, and "vibe-coded" codebases.
- Discussion: (1) For our codebase, where does the "theory" actually live, and what happens if one person leaves? (2) Can an LLM hold a program's theory, or can it only produce text? (3) What practices (ADRs, pairing, code ownership) actually transfer theory?
- Difficulty/length: Easy to medium; short paper (14-page scan). About 45 minutes with discussion.

**4. No Silver Bullet: Essence and Accidents of Software Engineering: Frederick P. Brooks Jr.**
- Link: [UNC tech report TR86-020, September 1986](https://www.cs.unc.edu/techreports/86-020.pdf) (title, TR number and date confirmed on page 1). Also published in IEEE Computer, 1987 (DOI 10.1109/MC.1987.1663532 resolves to IEEE Xplore).
- Summary: Brooks splits software difficulty into essential complexity (the conceptual construct itself) and accidental complexity (how we represent it in tools and languages). He argues that because past gains attacked accidental complexity, no single technique would deliver an order-of-magnitude productivity gain within a decade. He reviews candidate "bullets" (high-level languages, OOP, AI, expert systems, automatic programming, graphical programming) and recommends buying instead of building, rapid prototyping, incremental growth, and growing great designers.
- Core idea: Essence vs. accident; the hard part is specifying and designing, not coding.
- 2026 relevance: It is the obvious lens on whether AI coding assistants are a "silver bullet". Brooks explicitly discussed AI and "automatic programming" in 1986.
- Discussion: (1) Do LLMs attack essential or accidental complexity? (2) Brooks predicted no 10x gain in a decade; was he right then, and would he be right now? (3) What's the "buy vs. build" equivalent today (SaaS, Supabase, LLM APIs)?
- Difficulty/length: Easy; 21-page TR (~7.9k words).

**5. End-to-End Arguments in System Design: J.H. Saltzer, D.P. Reed, D.D. Clark (MIT LCS), ACM TOCS 1984**
- Link: [PDF from Saltzer's MIT page](https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf) (title/authors confirmed). DOI 10.1145/357401.357402 is registered.
- Summary: Functions such as reliable delivery, deduplication, and encryption can only be completely and correctly implemented with knowledge held by the endpoints of a system. Lower layers can provide them only as performance optimizations, never as a guarantee. The paper's canonical example is "careful file transfer": per-hop checks don't remove the need for an end-to-end checksum.
- Core idea: Put correctness checks at the ends; low-level mechanisms are an optimization, not a guarantee.
- 2026 relevance: Idempotency keys and exactly-once illusions in webhooks and Stripe-style APIs; why client-side validation never replaces server or DB constraints; retries through proxies, edge functions, and queues.
- Discussion: (1) Where do we rely on a middle layer (ORM validation, queue "exactly-once", HTTP retries) for a guarantee only the endpoint (Postgres constraint, idempotency key) can give? (2) Is the database our "end"? (3) Is it worth duplicating some checks at lower layers for performance, as the paper allows?
- Difficulty/length: Easy to medium; 10 pp (~6k words).

**6. Time, Clocks, and the Ordering of Events in a Distributed System: Leslie Lamport, CACM July 1978**
- Link: [PDF from Lamport's site](https://lamport.azurewebsites.net/pubs/time-clocks.pdf) (verified 200; CACM Operating Systems section header confirmed). DOI 10.1145/359545.359563 is registered.
- Summary: Lamport defines the "happened-before" partial order on events and shows how logical clocks (counters) can be used to extend it to a consistent total order without synchronized physical clocks. He uses this to implement a distributed mutual-exclusion algorithm and discusses physical-clock synchronization bounds.
- Core idea: In a distributed system, causality (not wall-clock time) is what you can reason about.
- 2026 relevance: Ordering of events across browser, edge, serverless, and Postgres; why `created_at` timestamps from different machines can't be trusted for ordering; foundation for vector clocks, CRDTs (local-first), and replication.
- Discussion: (1) Where do we order things by `now()` from different machines (client vs. server vs. DB), and could that be wrong? (2) Would a Postgres sequence or LSN be a "Lamport clock" for us? (3) Why does a total order require an arbitrary tiebreak, and where does that show up in our UIs?
- Difficulty/length: Medium (the math is light but needs care); 8 pp (~7.7k words).

**7. Scaling Memcache at Facebook: Nishtala, Fugal, Grimm, Kwiatkowski, Lee, Li, McElroy, Paleczny, Peek, Saab, Stafford, Tung, Venkataramani; USENIX NSDI 2013**
- Link: [USENIX PDF](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf) (authors confirmed). The abstract says the system "handles billions of requests per second and holds trillions of items".
- Summary: Facebook built a distributed key-value cache from plain memcached. It is look-aside (demand-filled) caching in front of MySQL, with leases to prevent stale sets and thundering herds, invalidations driven from the database commit log, regional pools and replication, and cross-region consistency tricks. The paper is a catalog of the real problems of caching in front of a relational DB.
- Core idea: The hard problems of caching are invalidation, stale-set races, and herd effects, not the hashing.
- 2026 relevance: Directly applies to Next.js caching layers (`revalidateTag`, ISR, CDN caches, Redis/Upstash in front of Postgres), Supabase/Postgres read replicas, and the stale-read bugs a web team actually hits.
- Discussion: (1) Map their "look-aside cache + DB invalidation" design onto our Next.js data cache and revalidation; where are our stale-set races? (2) How would their leases idea prevent a cache stampede on our hottest page? (3) What do we lose by invalidating from app code instead of from the DB's commit log?
- Difficulty/length: Medium; 18-page PDF (~10k words). Very practical.

**8. Serializable Snapshot Isolation in PostgreSQL: Dan R. K. Ports (MIT CSAIL) and Kevin Grittner (Wisconsin Supreme Court CCAP); PVLDB 5(12), VLDB 2012**
- Link: [VLDB PDF](https://vldb.org/pvldb/vol5/p1850_danrkports_vldb2012.pdf), [arXiv 1208.4179](https://arxiv.org/abs/1208.4179).
- Summary (from the abstract): This describes implementing PostgreSQL's serializable isolation level using SSI. It was the first SSI implementation in a production database release and the first in a database that did not already have lock-based serializable isolation. It covers a new lock manager, bounding memory use, and a read-only-transaction optimization. Benchmarks show performance only slightly below snapshot isolation and much better than two-phase locking on read-heavy workloads. See [arXiv abstract](https://arxiv.org/abs/1208.4179).
- Core idea: Snapshot isolation allows write-skew anomalies. SSI detects dangerous read-write dependency structures and aborts one transaction, giving true serializability without blocking readers.
- 2026 relevance: It is the team's own database. It explains when `REPEATABLE READ` is not enough (write skew, e.g. double-booking or "at least one admin" invariants). It also explains why `SERIALIZABLE` needs retry loops on serialization failures, and the tradeoffs vs. `SELECT ... FOR UPDATE`.
- Discussion: (1) Find a real invariant in our app that could break under write skew (two concurrent RSVPs taking the last seat?). (2) Do our server actions and ORM calls retry on serialization failures, and should they? (3) When is an explicit row lock or a constraint simpler than SERIALIZABLE?
- Difficulty/length: Medium to hard; 12 pp (~12.6k words). Best presented with a live two-psql-session write-skew demo.

**9. What Goes Around Comes Around... And Around...: Michael Stonebraker (MIT) and Andrew Pavlo (CMU); SIGMOD Record, June 2024 (Vol. 53, No. 2)**
- Link: [CMU DB group PDF](https://db.cs.cmu.edu/papers/2024/whatgoesaround-sigmodrec2024.pdf) (journal footer "SIGMOD Record, June 2024 (Vol. 53, No. 2)" confirmed in the PDF).
- Summary (from the paper): It follows up the 2005 "What Goes Around Comes Around" chapter and reviews 20 years of challengers to SQL and the relational model: MapReduce, key-value stores, document DBs, wide-column, text search, array, vector, and graph databases. It argues that the relational model remains dominant, that SQL absorbs the good ideas, and that many NoSQL systems now expose SQL-like interfaces. It then reviews architecture changes: columnar, cloud, lakehouse, NewSQL, hardware accelerators, and blockchain. See [PDF](https://db.cs.cmu.edu/papers/2024/whatgoesaround-sigmodrec2024.pdf).
- Core idea: Data models are cyclical; relational and SQL keep winning by absorption. The real innovation is in the implementation.
- 2026 relevance: This is the scholarly case behind "just use Postgres" (JSONB instead of a document DB, pgvector instead of a vector DB, full-text search instead of Elasticsearch). It is useful when someone proposes adding a new datastore.
- Discussion: (1) Which "specialized DB" have we been tempted to add, and does the paper's argument hold for it? (2) Is pgvector proof of their vector-DB prediction? (3) Where does the relational model really lose for a web app (e.g., realtime sync, graphs)?
- Difficulty/length: Easy to medium, opinionated and fun; 17 pp (~14.4k words). Sections can be split among presenters.

**10. Out of the Tar Pit: Ben Moseley and Peter Marks, February 6, 2006**
- Link: [PDF](https://curtclifton.net/papers/MoseleyMarks06a.pdf) (title, authors, date confirmed).
- Summary: Building on Brooks, the authors argue that complexity is the root cause of most software problems and that mutable state, then control flow, are its biggest sources. They separate essential from accidental state and logic, and propose "Functional Relational Programming". In FRP, essential state is relational, logic is functional and declarative, and accidental state and control are kept apart. The paper itself notes that relational data independence parallels its essential/accidental split ([PDF](https://curtclifton.net/papers/MoseleyMarks06a.pdf)).
- Core idea: State is the enemy. Model essential state relationally, derive everything else, and quarantine the rest.
- 2026 relevance: React's "derive, don't store" ethos, server components plus a Postgres source of truth, avoiding duplicated client state, and SQL views as derived state. The paper reads almost like a manifesto for a Postgres-centric web stack.
- Discussion: (1) Which pieces of state in our app are essential and which are derived or cached (and thus accidental)? (2) Is a Postgres database with views and constraints plus React server components a partial realization of FRP? (3) Where does their argument break in practice (performance, UX latency)?
- Difficulty/length: Medium; long (66 pp, ~22.7k words). Assign the first parts (complexity, state, and the essential/accidental analysis) and treat the FRP proposal as optional.

**Alternate A. Dynamo: Amazon's Highly Available Key-value Store: DeCandia, Hastorun, Jampani, Kakulapati, Lakshman, Pilchin, Sivasubramanian, Vosshall, Vogels; SOSP 2007**
- Link: [PDF on Werner Vogels' site](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf). The abstract says Dynamo "sacrifices consistency under certain failure scenarios" and uses object versioning and application-assisted conflict resolution.
- Core idea: Choose availability; combine consistent hashing, vector clocks, sloppy quorums, hinted handoff, and Merkle-tree anti-entropy, and push conflict resolution (e.g., merging shopping carts) to the application.
- 2026 relevance: The shopping-cart merge is a great framing for any UI that must accept writes during failures. It is also the conceptual ancestor of Cassandra and Riak, and it influenced the DynamoDB name (the DynamoDB service is a different system; that point is my own knowledge, not verified here).
- Discussion: Would our users accept "deleted items reappearing" in exchange for never failing a write? Which of our features could tolerate eventual consistency?
- Difficulty/length: Medium to hard; 16 pp (~14.9k words).

**Alternate B. Local-First Software: You Own Your Data, in spite of the Cloud: Kleppmann, Wiggins, van Hardenberg, McGranaghan; Onward! 2019 (Ink & Switch)**
- Links: [Ink & Switch essay](https://www.inkandswitch.com/essay/local-first/), [PDF](https://martin.kleppmann.com/papers/local-first.pdf) (title and first authors confirmed on page 1).
- Core idea: The paper proposes seven ideals for software that keeps the primary copy of data on the user's device: fast, multi-device, offline, collaboration, longevity, privacy, and user control. It argues CRDTs are a promising foundation.
- 2026 relevance: Sync engines (ElectricSQL, Zero, PowerSync, Automerge, Yjs) are increasingly built on top of Postgres. That makes this a natural counterpoint to the "server is the source of truth" Next.js model. The tool list is my own knowledge, not verified in this pass.
- Difficulty/length: Easy to medium; 25 pp.

**Alternate C. Hints for Computer System Design: Butler W. Lampson, Xerox PARC (SOSP 1983)**
- Link: [PDF on bwlampson.site](https://bwlampson.site/33-Hints/Acrobat.pdf) (title and abstract confirmed: "general hints for system design", illustrated with examples from the Alto, Dorado, Bravo, and Star).
- Core idea: Slogans organized around functionality, speed, and fault tolerance, e.g. "do one thing well", "use a good idea again", "keep secrets", "end-to-end", "make actions atomic or restartable". The slogans are recalled from my own knowledge; I did not extract them in this pass.
- Difficulty/length: Easy; 27 pp in this rendering. Works well as a "pick 5 hints and argue" session.

### Inferences
- Two papers have live-demo potential: the SSI paper (two concurrent transactions showing write skew in our own Postgres) and the Memcache paper (a cache stampede on a Next.js route). Demos make sessions stick for product engineers.
- Tar Pit and Stonebraker & Pavlo reinforce each other, since both say relational, derived state wins. A presenter could pair them across consecutive sessions.
- Session length estimates are my own and assume ~20–30 minutes of reading per 10 pages of these papers.

### Gaps
- I did not verify Ink & Switch's essay page content beyond the redirect target returning 200 (~111 KB). The PDF's title page was confirmed.
- Exact journal page ranges for several classics (e.g., TOCS 2(4):277–288; CACM 21(7):558–565; CACM 27(8):761–763) are from my own knowledge, not confirmed in this pass, because ACM pages block automated access.

## Key Question 3: Notable 2025–2026 papers outside software engineering that a tech team would find fascinating

### Takeaway
The best two are "Determination of the fifth Busy Beaver value" (bbchallenge Collaboration, arXiv Sept 2025, revised 2026) and Google Quantum AI's "Quantum Echoes" Nature paper (Oct 2025). BB(5) is a mass online collaboration plus a Coq proof settling a 40-year-old question. Quantum Echoes is a claim of verifiable quantum advantage, about 13,000x faster than a supercomputer. Two 2025 algorithms results make good backups: "Breaking the Sorting Barrier" (beats Dijkstra, STOC 2025 Best Paper) and "Optimal Bounds for Open Addressing Without Reordering" (hash tables). Neither is about software engineering practice.

### Cited Findings
**Pick A. Determination of the fifth Busy Beaver value: The bbchallenge Collaboration (Blanchard, Briggs, Deka, Fenner, Forster, Georgiev, House, Hunter, Iijil, Kądziołka, Kropitz, Ligocki, mxdys, Naściszewski, savask, Stérin, Xu, Yuen, and others); arXiv 2509.12337, Sept 2025**
- Link: [arXiv abstract](https://arxiv.org/abs/2509.12337) (verified 200; arXiv lists it as 48 pages, 17 figures, cs.LO).
- Summary (from the abstract): S(n) is the maximum number of steps an n-state, 2-symbol Turing machine can run from a blank tape before halting. Radó introduced it in 1962 as one of the simplest uncomputable functions. The authors prove S(5) = 47,176,870 in the Coq proof assistant by enumerating 181,385,789 five-state machines and deciding for each whether it halts. It is "the first determination of a new Busy Beaver value in over 40 years and the first Busy Beaver value ever to be formally verified", attributed to "massively collaborative online research" (bbchallenge.org) — [arXiv](https://arxiv.org/abs/2509.12337).
- A search summary says the paper was revised in March 2026 and also establishes Σ(5) = 4,098, and that the formal proof (Coq-BB5) is on GitHub — [bbchallenge wiki: Coq-BB5](https://wiki.bbchallenge.org/wiki/Coq-BB5); [arXiv](https://arxiv.org/abs/2509.12337). I did not independently confirm the revision date.
- Why fascinating: The halting problem made concrete, with an open-source, Discord-and-wiki-style collaboration (some authors are pseudonymous) and machine-checked proof as the trust mechanism. It also echoes Thompson: what do you trust, the proof checker?
- Discussion (my own): (1) How do you organize an open collaboration where anyone's "decider" code is trusted only after formal verification? (2) Why will BB(6) likely never be known? (3) Could formal verification play the same role for AI-generated code?
- Difficulty/length: Present at the level of the abstract and intro (easy). The full 48 pages are hard.

**Pick B. Observation of constructive interference at the edge of quantum ergodicity: Google Quantum AI and Collaborators; Nature 646, 825–830, 23 Oct 2025; DOI 10.1038/s41586-025-09526-6**
- Links: [DOI](https://doi.org/10.1038/s41586-025-09526-6) (resolved 200 in my check), [Google Research blog: "A verifiable quantum advantage" (22 Oct 2025)](https://research.google/blog/a-verifiable-quantum-advantage/). The volume/page/date come from a search-result record of the [Nature Index entry](https://www.nature.com/nature-index/article/10.1038/s41586-025-09526-6).
- Summary: The team ran the "Quantum Echoes" algorithm on the Willow chip. It runs the system forward, perturbs it, then runs it backward to measure out-of-time-order correlators (OTOCs). The experiment took about 2 hours; Google estimates a classical supercomputer would need about 13,000 times longer, and that one data point would take about 3.2 years on Frontier. The result is "verifiable" because the observables are expectation values that should be the same on other quantum computers or natural systems, unlike random-circuit bitstrings. A companion preprint applies the idea to NMR-based molecular geometry, and the authors say that demo is not yet beyond classical simulation — [Google Research blog](https://research.google/blog/a-verifiable-quantum-advantage/).
- Qubit counts are inconsistent in the blog: 103 qubits underwent the forward and backward evolution in one place, and 65 of 105 qubits were used for the second-order OTOC data in another — [Google Research blog](https://research.google/blog/a-verifiable-quantum-advantage/).
- Caveat: Per a search summary of the Nature peer-review file, a reviewer noted that classical Monte Carlo methods captured much of the sensitivity, with only the higher-order OTOC(2) values said to require quantum interference — [Nature supplementary/peer review (search result)](https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-025-09526-6/MediaObjects/41586_2025_9526_MOESM2_ESM.pdf). I did not read the peer-review file directly.
- Why fascinating: It asks what "verifiable" computation means and how claims of advantage get contested, which is good material for discussing hype vs. evidence.
- Discussion (my own): (1) What would make you believe a computation you can't check classically? (2) How is "13,000x" estimated, and what assumptions hide in that number? (3) When (if ever) should a web company care about quantum, e.g. post-quantum TLS?
- Difficulty/length: Present from the Google blog plus the paper's abstract and figures (easy to medium). The paper itself is hard physics.

**Backup C. Breaking the Sorting Barrier for Directed Single-Source Shortest Paths: Ran Duan, Jiayi Mao, Xiao Mao, Xinkai Shu, Longhui Yin; arXiv 2504.17033 (Apr 2025); STOC 2025 Best Paper**
- Link: [arXiv](https://arxiv.org/abs/2504.17033). Abstract: a deterministic O(m log^(2/3) n) algorithm for SSSP on directed graphs with real non-negative weights, "the first result to break the O(m+n log n) time bound of Dijkstra's algorithm on sparse graphs, showing that Dijkstra's algorithm is not optimal for SSSP" — [arXiv](https://arxiv.org/abs/2504.17033).
- Best Paper award — [MPI-INF news](https://www.mpi-inf.mpg.de/news/detail/stoc-best-paper-award-how-to-find-the-shortest-path-faster); [Tsinghua IIIS](https://iiis.tsinghua.edu.cn/en/info/1018/2438.htm).
- A secondary source claims a later O(m·sqrt(log n)) improvement — [lacker.io](https://lacker.io/complexity/problems/dijkstra-sorting-barrier-sssp.html). This is unverified; do not present it as fact.
- Caveat: it is theoretical CS rather than "outside software". The constant factors likely make it irrelevant in practice, which is itself a good discussion point (my inference).

**Backup D. Optimal Bounds for Open Addressing Without Reordering: Martin Farach-Colton, Andrew Krapivin, William Kuszmaul; arXiv 2501.02305 (Jan 2025)**
- Link: [arXiv](https://arxiv.org/abs/2501.02305). Abstract: shows a hash table can, without reordering, achieve far better expected search complexities than previously thought possible, and "disprove[s] the central conjecture left by Yao in his seminal paper 'Uniform Hashing is Optimal'" — [arXiv](https://arxiv.org/abs/2501.02305).
- Why fascinating: Even hash tables, the most basic data structure, had a decades-old wrong conjecture in their theory.

### Inferences
- For a team that already sees plenty of AI papers, BB(5) is the best single "outside" pick. It is short to present, has a jaw-dropping number, and connects to formal verification, trust, and collaboration. Quantum Echoes is the best "hype vs. evidence" pick.
- If the club wants "outside software" strictly (not CS at all), Quantum Echoes is the only pick here that fully qualifies. BB(5), Duan et al., and the hash-table paper are theoretical CS and math.

### Gaps
- A broad search for landmark 2026 papers turned up mostly aggregator content. Examples: a Nature news item on OpenAI claiming progress on a Millennium Prize problem about fluid motion ([Nature news](https://www.nature.com/articles/d41586-026-02842-5)), a 2026 Nature critique of Microsoft's Majorana claims ([St Andrews news](https://news.st-andrews.ac.uk/archive/critique-published-by-nature-challenges-microsofts-quantum-computing-claims/)), and a 2026 Nature Physics string-breaking quantum simulation ([ScienceDaily](https://www.sciencedaily.com/releases/2026/09/260925005416.htm)). The Nature news page redirected to a login wall and I could not read it, so the OpenAI claim and its verification status are unconfirmed. I don't recommend any 2026 paper because I couldn't confirm the primary sources.
- I did not search for 2025–2026 papers in biology or neuroscience (e.g., large connectome or genome-model papers), so there may be strong non-CS candidates I didn't evaluate.
