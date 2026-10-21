// posts.js
// ---------------------------------------------------------------------------
// LONG-FORM PROJECT WRITE-UPS. Each post is shown at post.html?p=<slug>.
// To give a project a write-up: add a post here, then set  post: "<slug>"
// on that project in content.js. Its card will link to the post.
//
// A post's body is a list of blocks, rendered top to bottom:
//   { h2: "Heading", id: "anchor" }       section heading (listed in the sidebar)
//   { p: "Text with **bold**, *italic*, [links](https://...) and `code`" }
//   { callout: "Text", label: "Task" }    highlighted box
//   { stats: [{ value, label }, ...] }    big-number tiles
//   { list: ["...", "..."] }              bullet list
//   { steps: [{ title, text }, ...] }     numbered steps
//   { figure: { src, caption, wide } }    one image
//   { figures: [{ src, caption }, ...] }  images side by side
//   { table: { head: [...], rows: [[...]], highlight: rowIndex, caption } }
//   { cards: [{ title, badge, chosen, groups: [{ label, items: [...] }] }] }
//   { slides: { pdf, images: [...] } }    slide-deck viewer
//   { links: [{ label, url }] }           buttons (url "" = placeholder)
//   { math: "LaTeX", caption }            display equation (inline math: $x^2$ inside any text)
//   { flow: [{ q: "Question?", a: "Action" }, ..., { a: "Final step" }] }   decision flowchart
//   { video: { youtube: "VIDEO_ID", title, caption } }   embedded YouTube video
//   slides also accept aspect: "4 / 3" for non-widescreen decks
// A post can also have  note: "..."  shown under the header (e.g. a public-release statement).
// ---------------------------------------------------------------------------

const animeSlides = Array.from({ length: 18 }, (_, i) => `images/projects/anime/slides/slide-${String(i + 1).padStart(2, "0")}.jpg`);

window.POSTS = {
  "anime-recommendation": {
    title: "Recommending Anime with a Hybrid BPR Model",
    subtitle:
      "Ranking 17,000 titles for 310,000 viewers: building a recommender from 109 million MyAnimeList interactions, and why the best model was a team of simpler ones.",
    kicker: "CSE 258 · Recommender Systems & Web Mining · UC San Diego",
    date: "December 2025",
    tags: ["PyTorch", "Bayesian Personalized Ranking", "Collaborative Filtering", "Recommender Systems"],
    cover: { viz: "embedding" },
    tldr: [
      { value: "0.95", label: "best validation AUC" },
      { value: "0.176", label: "Precision@10 (test)" },
      { value: "0.133", label: "Recall@10 (test)" },
      { value: "0.772", label: "Hit Rate@10 (test)" }
    ],
    body: [
      { h2: "The problem", id: "problem" },
      {
        p: "Anyone who has finished a series knows the next question: *what do I watch now?* MyAnimeList catalogs tens of thousands of titles, and most viewers will only ever see a small fraction of them. A good recommender narrows that ocean down to a handful of shows each person is likely to love."
      },
      {
        callout:
          "Given a user's history of ratings, watches, and other implicit signals, rank every anime they haven't seen and return the **top K** they're most likely to enjoy.",
        label: "Predictive task"
      },
      {
        p: "Framing this as **ranking** rather than rating prediction shaped every later decision. The question isn't whether someone would give a show a 7 or an 8; it's whether the shows they'd actually watch end up near the top of their list. That choice drove the loss function, the metrics, and the baselines I compared against."
      },

      { h2: "The data", id: "data" },
      {
        p: "I used the [Anime Recommendation Database 2020](https://www.kaggle.com/datasets/hernan4444/anime-recommendation-database-2020) on Kaggle, which was scraped from MyAnimeList ([scraper on GitHub](https://github.com/Hernan4444/MyAnimeList-Database)). It exists so people can experiment with recommender systems without live-scraping delays, which made it a good testbed for comparing collaborative and content-based approaches."
      },
      {
        stats: [
          { value: "~310K", label: "users" },
          { value: "~17K", label: "anime" },
          { value: "109M", label: "user–anime interactions" }
        ]
      },
      {
        p: "Each interaction records a watching status (watching, completed, dropped, and so on) and, for completed shows, a rating. Every anime also carries metadata: genres, studio, member and favorite counts, review statistics, and more."
      },

      { h2: "Exploring the data", id: "eda" },
      {
        p: "Before modelling, I looked at how ratings and activity are distributed, because those shapes decide what counts as signal and what counts as noise."
      },
      {
        figure: {
          src: "images/projects/anime/ratings-distribution.png",
          caption: "Ratings pile up at the high end: 7, 8 and 9 dominate. People mostly rate shows they finished and liked."
        }
      },
      {
        p: "Ratings are heavily concentrated toward the top of the scale, so absolute ratings don't separate shows very well. This pushed me toward treating interactions as **implicit positive feedback**: the fact that someone engaged with a show matters more than the exact number they gave it."
      },
      {
        figures: [
          { src: "images/projects/anime/user-activity.png", caption: "User activity on a log scale: roughly bell-shaped, with a tail of very light users on the left." },
          { src: "images/projects/anime/anime-popularity.png", caption: "Anime popularity on a log scale: a wide spread, from niche titles to blockbusters." }
        ]
      },
      {
        p: "On a log scale, user activity is roughly unimodal, but with many outliers who have rated only a handful of shows. These three distributions set the thresholds I used later to drop users and titles too sparse to learn from."
      },
      {
        figure: {
          src: "images/projects/anime/metadata-correlation.png",
          caption: "Correlation matrix of anime metadata: engagement features move together."
        }
      },
      {
        p: "The metadata is strongly **collinear**. Favorites track members, and dropped counts track on-hold counts. Popularity is stored as a *rank*, so more popular shows have lower numbers, which is why it correlates negatively with everything else. The takeaway: the metadata features overlap heavily, so they work better as a supporting signal than as the main one."
      },

      { h2: "Cleaning and splitting 109M rows", id: "preprocessing" },
      {
        steps: [
          { title: "Remove sparse users and anime", text: "Using the thresholds from the exploration, which left 293,842 users and 16,018 anime." },
          { title: "Encode user–anime pairs", text: "Map IDs to contiguous indices, convert genre types, and drop rare genres." },
          { title: "Process metadata", text: "One-hot encode categorical features and normalize the numeric ones." },
          { title: "Shuffle and split", text: "80% train (~46M), 10% validation (~5.7M), 10% test (~5.7M)." },
          { title: "Index users for negative sampling", text: "Build a dictionary from each user to the anime they've interacted with, so unseen titles can be sampled quickly." },
          { title: "Cache to disk", text: "Save everything as NumPy arrays, so a 109M-row dataset never has to be reloaded and re-processed." }
        ]
      },
      {
        p: "Removing sparse rows and one-hot encoding metadata and genres follow common practice from Kaggle notebooks and related papers on this dataset."
      },

      { h2: "Modelling: climbing the complexity ladder", id: "models" },
      {
        p: "The model takes in the user–item interaction matrix, each user's history, item–item similarities, global statistics (mean rating, popularity), per-user average ratings, and anime metadata. For each user, it outputs every anime ranked by confidence. The objective is a **pairwise ranking loss** over implicit feedback: rank a show the user engaged with above one they didn't."
      },
      {
        p: "I worked up from simple to complex, so every extra piece of machinery had to earn its place against a cheaper alternative:"
      },
      {
        cards: [
          {
            title: "Popularity & averages",
            badge: "1",
            groups: [
              { label: "Pros", items: ["Handles cold start", "Fast and cheap"] },
              { label: "Cons", items: ["Not personalized", "Buries less popular shows"] }
            ]
          },
          {
            title: "Item-based collaborative filtering",
            badge: "2",
            groups: [
              { label: "Pros", items: ["Simple cosine similarity", "Interpretable"] },
              { label: "Cons", items: ["Can't generalize beyond seen items", "Similarity matrix is expensive at scale"] }
            ]
          },
          {
            title: "Implicit BPR",
            badge: "3",
            groups: [
              { label: "Pros", items: ["Optimizes ranking directly", "Learns latent structure"] },
              { label: "Cons", items: ["More expensive training", "Weak on cold start"] }
            ]
          },
          {
            title: "Hybrid BPR",
            badge: "4",
            chosen: true,
            groups: [
              { label: "Pros", items: ["Personalized", "Falls back gracefully for sparse users"] },
              { label: "Cons", items: ["Several components to build and tune", "Most expensive to train"] }
            ]
          }
        ]
      },
      { h2: "How the hybrid works", id: "hybrid" },
      {
        p: "Each recommender is good at something different, so the hybrid combines them. Each component scores every (user, anime) pair, the scores are **normalized** so they're comparable, and a weighted sum produces the final ranking:"
      },
      {
        list: [
          "**Implicit BPR** (largest weight): latent user and item factors learned from pairs of watched and sampled-unwatched shows.",
          "**Cosine similarity** (item-based collaborative filtering): shows similar to the ones you've already watched.",
          "**Anime metadata**: content-based signal from genre, studio, and engagement features.",
          "**User interaction & popularity baselines** (smallest weights): a reasonable default when a user has very little history."
        ]
      },
      {
        p: "The more powerful components learn implicit relationships when there's enough data. When a user's history is sparse, the simpler components take over, which is what lets the hybrid handle the cold-start cases that plain BPR struggles with."
      },

      { h2: "Evaluating rankings, not ratings", id: "evaluation" },
      {
        p: "Since the goal is to put relevant anime high in each user's top K, the metrics check how well the model retrieves each user's **held-out** interactions from the test set:"
      },
      {
        list: [
          "**Precision@K**: what fraction of the K recommendations were relevant. It penalizes recommending things the user doesn't care about.",
          "**Recall@K**: what fraction of the user's relevant shows made it into the top K. It measures coverage and discourages simply ranking by popularity.",
          "**Hit Rate@K**: whether *at least one* relevant show appears in the top K. It's a blunt yes/no check that each user gets something useful."
        ]
      },
      {
        p: "I deliberately left out MSE and RMSE, which measure rating prediction rather than ranking. I tracked AUC during training to watch for over- and underfitting, but didn't use it on the test set because it scores every pair, not top-K quality."
      },
      {
        figure: {
          src: "images/projects/anime/bpr-auc.png",
          caption: "BPR training: validation AUC rises from about 0.91 to a peak of 0.95 at iteration 7."
        }
      },

      { h2: "Results", id: "results" },
      {
        table: {
          head: ["Model", "Precision@10", "Recall@10", "Hit Rate@10"],
          rows: [
            ["Popularity", "0.103", "0.069", "0.565"],
            ["Cosine (item CF)", "0.157", "0.115", "0.729"],
            ["BPR", "0.144", "0.113", "0.706"],
            ["**Hybrid BPR**", "**0.176**", "**0.133**", "**0.772**"]
          ],
          highlight: 3,
          caption: "Test-set results at K = 10. Hybrid BPR is best on every metric."
        }
      },
      {
        p: "The hybrid beats every baseline on every metric. Its precision is about **71% higher** than the popularity baseline (0.176 vs. 0.103), its recall is nearly **double** (0.133 vs. 0.069), and for **77%** of test users at least one of their top-10 recommendations was a show they actually watched."
      },
      {
        p: "The most interesting result is in the middle rows: **plain BPR slightly underperforms simple cosine-similarity CF**. The latent-factor model alone isn't the winner. The gain comes from *combining* it with collaborative filtering, metadata, and popularity signals, each of which covers the others' blind spots."
      },
      {
        figures: [
          { src: "images/projects/anime/precision-at-10.png", caption: "Precision@10" },
          { src: "images/projects/anime/recall-at-10.png", caption: "Recall@10" },
          { src: "images/projects/anime/hit-rate-at-10.png", caption: "Hit Rate@10" }
        ]
      },

      { h2: "Trying it myself", id: "demo" },
      {
        p: "Metrics are one thing, but a recommender should also pass the sniff test. I built a small interactive demo: enter five anime you like (or none at all, to test cold start) and the hybrid model returns five recommendations. I gave it five Studio Ghibli films."
      },
      { figure: { src: "images/projects/anime/demo-input.png", caption: "Input: Spirited Away, My Neighbor Totoro, Howl's Moving Castle, Porco Rosso, Princess Mononoke.", wide: true } },
      { figure: { src: "images/projects/anime/demo-recommendations.png", caption: "The hybrid model's top-5 recommendations.", wide: true } },
      {
        p: "Four of the five picks (*Kiki's Delivery Service*, *Castle in the Sky*, *Nausicaä of the Valley of the Wind*, and *Ponyo*) are Ghibli films the input didn't include, which is exactly what you'd hope for. The odd one out, *Death Note*, is a reminder that a popularity signal still leaks into the ranking. Overall, it does pretty well."
      },

      { h2: "How this compares to prior work", id: "related" },
      {
        cards: [
          {
            title: "RikoNet (Soni et al., 2021)",
            badge: "↗",
            link: "https://doi.org/10.48550/arXiv.2106.12970",
            groups: [
              { label: "Approach", items: ["One autoencoder predicts ratings for unrated anime", "A second builds anime embeddings from metadata and ratings of top users", "Recommends by clustering similar anime"] },
              { label: "Same as mine", items: ["Hybrid of collaborative filtering and item metadata", "Top-K recommendations from likes and dislikes"] },
              { label: "Different", items: ["Uses autoencoders for collaborative filtering", "Predicts ratings rather than rankings", "Clusters item embeddings"] }
            ]
          },
          {
            title: "Parallel Feature Interaction (Hou et al.)",
            badge: "↗",
            link: "https://ieeexplore.ieee.org/document/10863921",
            groups: [
              { label: "Approach", items: ["Parallel neural networks learn user–item interactions", "One captures high-order interactions; another re-weights user features by context", "Outputs combine into a likelihood score"] },
              { label: "Same as mine", items: ["Uses interactions and item metadata", "Final model combines several sub-models"] },
              { label: "Different", items: ["Skips the interaction matrix to reduce computation", "Uses temporal data"] }
            ]
          }
        ]
      },

      { h2: "Takeaways", id: "takeaways" },
      {
        list: [
          "**Pick the objective before the model.** Treating this as ranking rather than rating prediction changed the loss, the metrics, and which baselines mattered.",
          "**Strong baselines are humbling.** Item-based cosine similarity beat plain BPR. Always check whether the fancy model beats the cheap one.",
          "**Hybrids win by covering blind spots.** Latent factors, item similarity, metadata, and popularity each fail in different places, and a weighted combination beat every one of them alone.",
          "**Cold start is a design requirement.** Falling back to simpler signals for sparse users is what made the system usable for everyone, not just heavy users."
        ]
      },

      { h2: "Slides", id: "slides" },
      { p: "The full presentation, with all 18 slides. Use the arrows or your keyboard to flip through, or download the PDF." },
      { slides: { pdf: "files/anime-recommendation-slides.pdf", images: animeSlides } },
      {
        links: [
          { label: "Download slides (PDF)", url: "files/anime-recommendation-slides.pdf" },
          { label: "Dataset on Kaggle", url: "https://www.kaggle.com/datasets/hernan4444/anime-recommendation-database-2020" },
          { label: "Code", url: "" }
        ]
      }
    ]
  },

  "convex-catan": {
    title: "Can a Catan Agent Play Fair?",
    subtitle:
      "Most Settlers of Catan AIs are built to win. I built one whose job is to keep the game balanced, with a convex quadratic program solved on every turn, then played 17,500 games to measure what fairness costs.",
    kicker: "CSE 203B · Convex Optimization · UC San Diego",
    date: "March 2026",
    tags: ["Python", "CVXPY", "Convex Optimization", "Multi-Agent Systems", "Catanatron"],
    cover: { viz: "catan" },
    tldr: [
      { value: "17,500", label: "simulated games across 35 lineups" },
      { value: "≈4 ms", label: "average time per placement QP solve" },
      { value: "0.292", label: "avg VP Gini in lineups with the convex agent (0.300 without)" },
      { value: "1.50", label: "resource entropy of QP placements (highest of all methods)" }
    ],
    body: [
      { h2: "Why fairness in Catan?", id: "motivation" },
      {
        p: "In Settlers of Catan, players compete for land and resources that the board produces at different rates. Decisions in the opening placements decide who gets access to which resources for the rest of the game, and that often leaves some players with a lasting advantage before the first real turn."
      },
      {
        p: "Almost all research on Catan AI asks one question: *how do you win?* Szita, Chaslot, and Spronck adapted Monte Carlo Tree Search to Catan's stochastic, multiplayer, hidden-information setting. Guhe and Lascarides built a framework for comparing heuristic strategies. Others have used deep networks and reinforcement learning. Every one of these optimizes win rate."
      },
      {
        callout:
          "Instead of an agent that maximizes its own chance of winning, can we build one that **reduces inequality** between players from inside the game, and what does that cost it?",
        label: "Research question"
      },
      {
        p: "Convex optimization is the natural tool for this. It's the standard language for fairness and constrained resource allocation in engineering and economics, and it brings guarantees (global optimality, duality, sensitivity analysis) that heuristic search doesn't."
      },

      { h2: "Turning the board into numbers", id: "model" },
      {
        p: "A Catan board has 19 resource hexes, $L = 54$ settlement nodes, and $K = 5$ resources (wood, brick, sheep, wheat, ore). Each hex has a number token, and it produces when two dice sum to that number:"
      },
      {
        math: String.raw`p_s = \frac{6 - |s - 7|}{36}, \qquad s \in \{2, \dots, 12\} \setminus \{7\}`,
        caption: "Dice probabilities. A 6 or 8 produces five times as often as a 2 or 12, and a 7 moves the robber instead of producing."
      },
      {
        p: "Summing these probabilities over the hexes around each node gives a **production matrix** $A \\in \\mathbb{R}^{54 \\times 5}$, where $A_{lk}$ is the expected per-turn production of resource $k$ at node $l$. A settlement is a yes-or-no choice, so I **relaxed** it to a continuous variable $x_{pl} \\in [0, 1]$ (how much player $p$ occupies node $l$). That turns a combinatorial placement problem into a tractable convex one. Each player's expected production score is then linear in $x$:"
      },
      { math: String.raw`v_p = \sum_{l,k} x_{pl}\, A_{lk}`, caption: "Expected production score of player $p$." },

      { h2: "The first attempt backfired", id: "first-attempt" },
      {
        p: "My first formulation treated every player, including the agent itself, **symmetrically**: maximize a common production floor $t$ with $v_p \\ge t$ for all players, and penalize each player's resource imbalance. It was deliberately fairness-first, with the same rule for everyone."
      },
      {
        p: "It failed in an instructive way. The agent kept choosing weak placements and lost more often than the baselines. Its LP was improving the fairness objective partly by **lowering its own production**: it was sacrificing itself. Worse, by leaving the strongest nodes to opponents, it sometimes *increased* inequality, the opposite of its purpose."
      },
      {
        callout: "A regulator that gives up its own position can't regulate anything. Fairness had to be measured over the **opponents**, while the agent stays a credible competitor.",
        label: "Lesson"
      },

      { h2: "The fix: an opponent-aware QP", id: "qp" },
      {
        p: "The final formulation removes the agent's own score from the fairness terms. It raises the floor of opponent production, pulls down the ceiling, and keeps the agent's own resource mix balanced:"
      },
      {
        math: String.raw`\max_{X,\; t^{\mathrm{opp}},\; v^{\mathrm{opp}}_{\max}} \quad (1+\lambda)\, t^{\mathrm{opp}} \;-\; \lambda\, v^{\mathrm{opp}}_{\max} \;-\; \mu\, \Phi(X)`,
        caption: "$t^{\\mathrm{opp}}$ is a lower bound on the weakest opponent's production, $v^{\\mathrm{opp}}_{\\max}$ an upper bound on the strongest, and $\\Phi$ penalizes imbalance in the agent's own resource mix. Defaults: $\\lambda = 0.8$, $\\mu = 0.05$."
      },
      { math: String.raw`\Phi(X) = \Big\| \rho_c - \tfrac{\mathbf{1}^\top \rho_c}{K}\,\mathbf{1} \Big\|_2^2, \qquad \rho_c = x_c A`, caption: "Self-balance penalty: zero when the agent expects equal production of every resource." },
      { p: "This objective is subject to linear constraints that encode Catan's rules:" },
      {
        list: [
          "**Placement budget**: $\\sum_l x_{pl} \\le b_p$, with 2 settlements in the opening and up to 5 buildings later in the game.",
          "**Opponent bounds**: $t^{\\mathrm{opp}} \\le v_p \\le v^{\\mathrm{opp}}_{\\max}$ for every opponent $p$.",
          "**Self-production floor**: $v_c \\ge \\phi\\, \\bar a\\, b_c$, which keeps the agent at a fraction $\\phi$ of the board-average production per building.",
          "**Node capacity and distance rule**: each node holds at most one settlement, and two adjacent nodes can't both be occupied.",
          "**Occupied nodes** are fixed at zero, and every $x_{pl}$ stays in $[0, 1]$."
        ]
      },
      {
        p: "The floor fraction is **phase-adaptive**: $\\phi = 1.2$ in the early game (fewer than 3 buildings), when the agent must compete for above-average spots before dominant agents claim them, and $\\phi = 0.7$ after that. This one change is what fixed the self-sacrifice problem."
      },
      {
        p: "All constraints are linear and the objective is linear plus a concave quadratic, so the whole problem is a **convex quadratic program**: any local optimum is the global one, and standard solvers handle it reliably."
      },

      { h2: "What the dual says", id: "dual" },
      {
        p: "Because the problem is convex and strictly feasible (a tiny uniform placement satisfies every constraint with slack), **Slater's condition** holds. Strong duality follows, and the KKT conditions are both necessary and sufficient for optimality. The dual variables then have clean interpretations:"
      },
      {
        math: String.raw`\sum_{p \ne c} \gamma_p = 1 + \lambda, \qquad \sum_{p \ne c} \delta_p = \lambda`,
        caption: "Stationarity with respect to the floor and ceiling variables. $\\lambda$ sets how much weight goes to pushing down the strongest opponent versus lifting the weakest."
      },
      {
        list: [
          "**Node prices** $\\beta_l$ act as **shadow prices** for contested board locations. By complementary slackness, $\\beta_l > 0$ only when node $l$ is fully occupied, so the dual points to the spots that matter most for fairness.",
          "**Budget prices** $\\alpha_p$ are positive only when a player's whole placement budget is used.",
          "**Opponent multipliers** $\\gamma_p$ and $\\delta_p$ are nonzero only for the opponents currently setting the floor and the ceiling. They identify who is being protected and who is being held back."
        ]
      },

      { h2: "From one QP to a full agent", id: "agent" },
      {
        p: "A placement solver alone can't play a game. The ConvexAgent applies convex optimization to **every** decision type, following a strict priority order on each game tick:"
      },
      {
        flow: [
          { q: "Opening placement phase?", a: "Settle at $\\arg\\max_l x^*_{c,l}$ from the QP, and place the road that unlocks the best future nodes." },
          { q: "Robber or discard prompt?", a: "Robber goes on the hex that most reduces the **leader's** expected production. Discard the card that leaves the most balanced hand (maximum entropy)." },
          { q: "Can roll?", a: "Roll." },
          { q: "Can build?", a: "Solve the build QP, then score settlements, cities, and roads. Cities get an urgency bonus when the agent trails the median opponent." },
          { q: "Maritime trade available?", a: "Solve a small **trade QP** that balances the hand subject to the port's exchange ratio." },
          { q: "Can buy a development card?", a: "Buy it." },
          { a: "End turn." }
        ]
      },
      {
        math: String.raw`\max_{t^{\mathrm{in}},\,t^{\mathrm{out}} \ge 0} \;\; \mathbf{1}^\top q \;-\; \tfrac{1}{2}\Big\| q - \tfrac{\mathbf{1}^\top q}{K}\mathbf{1} \Big\|_2^2 \quad \text{s.t.} \;\; q = q_0 + t^{\mathrm{in}} - t^{\mathrm{out}} \ge 0,\;\; \mathbf{1}^\top t^{\mathrm{in}} \le \tfrac{1}{\rho}\, \mathbf{1}^\top t^{\mathrm{out}}`,
        caption: "Trade QP: keep as many cards as possible while evening out the hand, with port ratio $\\rho \\in \\{2, 3, 4\\}$."
      },
      {
        p: "**Engineering for robustness.** The QP is solved with CVXPY through a solver chain (CLARABEL, then SCS, then ECOS). If every solver fails, the agent falls back to a closed-form score that blends *blocking* the leader with *helping* the weakest player. It needs no solver and runs in $O(PL)$, so the agent always has a move. For 3 players the placement QP has **164 variables and about 300 constraints**, and it solves in about **4 ms** on average."
      },

      { h2: "Experimental design", id: "experiments" },
      {
        p: "I ran two complementary experiments, both with 3 players, on top of the open-source [Catanatron](https://docs.catanatron.com/) simulator:"
      },
      {
        steps: [
          { title: "Placement-only λ sweep", text: "500 random boards × 10 values of λ in [0, 2]. Solve the opening placement and measure fairness and efficiency from expected production, against Random, Weighted Random, and Greedy placement." },
          { title: "Full-game tournament", text: "Every 3-agent lineup from 7 agents (35 lineups) × 500 games each = 17,500 complete games, measuring win rate, final victory points (VP), VP inequality, and resource diversity." }
        ]
      },
      {
        table: {
          head: ["Agent", "Strategy"],
          rows: [
            ["AB", "Alpha-beta minimax search over a game tree"],
            ["VALUE", "Learned value function that scores states and actions"],
            ["MCTS", "Monte Carlo Tree Search over simulated rollouts"],
            ["GREEDY", "Myopic: picks the best immediate reward"],
            ["WR", "Weighted random, favoring cities over settlements over dev cards"],
            ["R", "Uniformly random"],
            ["**CONVEX**", "**This project:** fairness-regulating QP agent"]
          ],
          highlight: 6
        }
      },

      { h2: "Result 1: placement fairness", id: "placement" },
      {
        table: {
          head: ["Method", "Gini ↓", "Entropy ↑", "Max/Min ↓"],
          rows: [
            ["**QP (mine)**", "0.085", "**1.495**", "1.515"],
            ["Greedy", "**0.060**", "1.214", "**1.315**"],
            ["Weighted Random", "0.103", "1.077", "1.697"],
            ["Random", "0.150", "0.929", "2.321"]
          ],
          highlight: 0,
          caption: "Opening placements at λ ≈ 0.44, averaged over 500 boards (95% CIs are within ±0.01 for Gini and entropy). Gini and max/min measure production inequality across players; entropy measures how balanced each player's resource mix is."
        }
      },
      {
        p: "The QP gives every player the most **balanced resource mix** by a wide margin (entropy 1.50 vs. 1.21 for Greedy), and it cuts inequality well below both random baselines. Greedy actually achieves lower production inequality and higher total production, but it gets there by concentrating each player on fewer resource types. That's a real **efficiency–diversity tradeoff**, not a clean win for either method."
      },
      {
        figures: [
          { src: "images/projects/catan/entropy_violin_by_method.png", caption: "Resource entropy by method: QP placements are the most balanced." },
          { src: "images/projects/catan/max_min_ratio_by_method.png", caption: "Ratio of the strongest player's production to the weakest's." }
        ]
      },
      {
        figure: { src: "images/projects/catan/production_gap_hist_by_method.png", caption: "Production gap from the strongest player. Both QP and Greedy compress the extreme gaps that random placement produces." }
      },
      {
        p: "A surprise: **λ barely mattered.** Across $\\lambda \\in [0, 2]$, Gini, entropy, and total production for the QP stayed essentially flat. The changes show up only in the fifth decimal place. In the opening, the allocation is shaped by the feasibility constraints (budget, distance rule, the self-floor) far more than by how the objective weighs floor against ceiling. The choice of *method* matters much more than the hyperparameter."
      },
      {
        figures: [
          { src: "images/projects/catan/gini_vs_lambda.png", caption: "Production Gini vs. λ: flat for the QP, with the baselines shown for reference." },
          { src: "images/projects/catan/total_expected_production_vs_lambda.png", caption: "Total expected production vs. λ: also flat." }
        ]
      },

      { h2: "Result 2: what fairness costs", id: "full-games" },
      {
        table: {
          head: ["Agent", "Win rate", "Final VP", "VP Gini", "Turns", "ms / decision"],
          rows: [
            ["AB", "0.858", "9.45", "0.309", "79.5", "11.53"],
            ["VALUE", "0.798", "9.17", "0.315", "81.4", "0.70"],
            ["MCTS", "0.203", "6.13", "0.281", "164.3", "22.66"],
            ["WR", "0.187", "6.00", "0.279", "159.3", "0.01"],
            ["R", "0.117", "5.46", "0.271", "167.4", "0.00"],
            ["GREEDY", "0.109", "5.54", "0.276", "169.6", "0.00"],
            ["**CONVEX**", "0.053", "3.79", "0.292", "172.6", "3.89"]
          ],
          highlight: 6,
          caption: "Per-agent results across all 35 lineups (500 games each)."
        }
      },
      {
        p: "Let's be direct: the convex agent **does not win**. At a 5.3% win rate it finishes last, while the search-based agents (alpha-beta and the value function) win roughly 80–86% of their games. That's expected, since nothing in its objective rewards victory points, but the size of the gap is a useful measurement of how much a pure fairness objective gives up."
      },
      {
        figures: [
          { src: "images/projects/catan/win_rate_ci.png", caption: "Win rate by agent with bootstrap 95% confidence intervals." },
          { src: "images/projects/catan/final_vp_violin.png", caption: "Final victory points by agent." }
        ]
      },
      {
        figure: { src: "images/projects/catan/pairwise_vp_diff_heatmap.png", caption: "Head-to-head VP differential (row minus column). AB and VALUE dominate every matchup, including against CONVEX." }
      },

      { h2: "Result 3: does it reduce inequality?", id: "fairness" },
      {
        stats: [
          { value: "0.292", label: "avg VP Gini, 15 lineups with CONVEX" },
          { value: "0.300", label: "avg VP Gini, 20 lineups without" },
          { value: "4 / 5", label: "most-equal lineups include CONVEX" }
        ]
      },
      {
        p: "Yes, modestly. Lineups that include the convex agent end with a **lower average VP Gini** (0.292 vs. 0.300), and the effect holds across many different opponents rather than one tuned matchup. Four of the five most equal lineups include it."
      },
      {
        figure: { src: "images/projects/catan/vp_gini_by_lineup.png", caption: "VP Gini by lineup (lower means more equal end-of-game outcomes).", wide: true }
      },
      {
        table: {
          head: ["Most equal lineups", "VP Gini", "Turns", "Least equal lineups", "VP Gini", "Turns"],
          rows: [
            ["MCTS, R, WR", "0.233", "278.8", "AB, CONVEX, R", "0.343", "78.8"],
            ["CONVEX, MCTS, WR", "0.244", "274.0", "AB, R, WR", "0.341", "78.0"],
            ["CONVEX, MCTS, R", "0.244", "318.9", "R, VALUE, WR", "0.339", "78.4"],
            ["CONVEX, R, WR", "0.246", "295.1", "AB, MCTS, R", "0.339", "76.7"],
            ["CONVEX, GREEDY, R", "0.249", "343.7", "CONVEX, R, VALUE", "0.339", "80.5"]
          ],
          caption: "The most equal lineups run 3–4× longer than the least equal ones."
        }
      },
      {
        p: "There's an important caveat in that table. The most equal lineups are also the **longest games** (275–345 turns vs. about 78). Equal outcomes can come from fair regulation, or simply from a table of weak players where nobody pulls ahead. And when a dominant agent like AB is present, it decides the game no matter who else is at the table. Opponent strength remains the biggest driver of inequality."
      },
      {
        figures: [
          { src: "images/projects/catan/pareto_fairness_winrate_compute.png", caption: "Win rate vs. VP Gini, colored by decision time." },
          { src: "images/projects/catan/turn_order_effect_win_rate.png", caption: "Turn order barely matters: seat win rates are 0.339, 0.327, and 0.330." }
        ]
      },
      {
        p: "Turn order was a possible confound, since earlier seats get first pick of placements. Aggregated over all games, seat effects are small (win rates of 0.339, 0.327, and 0.330), so the differences above come from the agents and lineups, not seat position."
      },

      { h2: "What I learned", id: "takeaways" },
      {
        list: [
          "**A fairness objective has to protect the regulator.** The symmetric formulation sacrificed itself and made things *less* fair. Making it opponent-aware, with a phase-adaptive self-floor, fixed that.",
          "**Constraints can matter more than weights.** λ barely moved the opening allocation. The feasibility structure did most of the work, which I wouldn't have guessed without the sweep.",
          "**Fairness and winning trade off sharply.** A modest reduction in inequality cost nearly all competitive strength against search-based agents.",
          "**Measure fairness carefully.** A low Gini can come from slow, weak games as easily as from good regulation. Game length, opponent strength, and seat order all need to be controlled for.",
          "**Convex structure pays off in engineering.** Every decision solves in milliseconds, has a global optimum, and has a guaranteed closed-form fallback, so the agent never stalls."
        ]
      },

      { h2: "What's next", id: "future" },
      {
        list: [
          "**Hybrid objectives**: add victory-point or expansion terms to the QP to trace a Pareto front between fairness and winning.",
          "**Deeper lookahead**: extend the single-turn QP to a multi-step MPC formulation, or use it as a fairness heuristic inside MCTS.",
          "**Dynamic parameters**: schedule λ, μ, and φ from the game state (turn number, VP gap, hand size) instead of fixing them.",
          "**Player-to-player trades**: model trade offers as their own convex subproblem, so the agent can directly help the weakest player.",
          "**Port strategy**: reward nodes next to 2:1 ports for the resources the agent tends to overproduce."
        ]
      },
      {
        links: [
          { label: "Code on GitHub", url: "https://github.com/rheask8246/CSE203B_ConvexCatan" },
          { label: "Full report (PDF)", url: "files/convex-catan-report.pdf" },
          { label: "Catanatron simulator", url: "https://docs.catanatron.com/" }
        ]
      }
    ]
  },

  gambitnet: {
    title: "GambitNet: Teaching Sensors to Hunt Satellites Together",
    subtitle:
      "Low Earth orbit is getting crowded faster than we can build sensors to watch it. I trained a graph neural network policy that coordinates a network of ground sensors to find and keep track of maneuvering satellites, and it held near-complete catalog coverage where traditional tasking broke down.",
    kicker: "Space Domain Awareness · Graph Neural Networks · Reinforcement Learning",
    date: "June 2025",
    // Add your public-release statement (and case number) to the end of this note.
    note: "Work performed at MIT Lincoln Laboratory, presented June 2025.",
    tags: ["PyTorch", "PyTorch Geometric", "PPO", "Graph Neural Networks", "Multi-Agent RL"],
    cover: { viz: "orbits" },
    tldr: [
      { value: "~100%", label: "of targets detected at every density, with maneuvers" },
      { value: "up to 90%", label: "faster first detection than the 10-minute pass window" },
      { value: "~70%", label: "higher catalog coverage than the heuristic, crowded + maneuvering" },
      { value: "500", label: "Monte Carlo runs per scenario" }
    ],
    body: [
      { h2: "A crowded sky", id: "problem" },
      {
        p: "The number of objects in **Low Earth Orbit (LEO)** is growing fast. Commercial constellations, military and civil satellites, and debris all share the same orbital shells. **Space Domain Awareness (SDA)** is the job of keeping track of all of it: detecting, tracking, and characterizing every resident space object so the orbital environment stays safe and usable."
      },
      {
        p: "The bottleneck is **sensor tasking**: deciding where and when each sensor should look. Ground sensors have narrow fields of view and limited time, and a LEO satellite is only overhead for about ten minutes per pass. Many objects are *non-cooperative*: they don't announce their positions, and some may deliberately maneuver to slip into a sensor's blind spots."
      },
      {
        callout:
          "With a fixed network of ground sensors and a growing, maneuvering population of targets, can a learned policy coordinate the sensors well enough to keep **custody of the whole catalog**, finding targets fast and not losing them?",
        label: "Research question"
      },

      { h2: "Why traditional tasking struggles", id: "approaches" },
      {
        p: "Legacy tasking systems were designed for a much sparser sky. They struggle with narrow fields of view, a high-dimensional and constantly changing environment, latency and scheduling conflicts, and poor scalability. I compared three families of approaches:"
      },
      {
        cards: [
          {
            title: "Brute-force search",
            badge: "1",
            groups: [
              { label: "How", items: ["Sweep fixed patterns (e.g. a spiral scan)"] },
              { label: "Pros", items: ["Quick baseline", "Complete search"] },
              { label: "Cons", items: ["Can't adapt to dynamics", "Doesn't scale"] }
            ]
          },
          {
            title: "Heuristics",
            badge: "2",
            groups: [
              { label: "How", items: ["Simple rules, e.g. look where the target was last seen"] },
              { label: "Pros", items: ["Uses prior information"] },
              { label: "Cons", items: ["Brittle when things change", "Poor scalability"] }
            ]
          },
          {
            title: "Learned policies",
            badge: "3",
            chosen: true,
            groups: [
              { label: "How", items: ["Learn a policy by simulating interactions"] },
              { label: "Pros", items: ["Anticipates behavior and adapts", "Scales to larger systems"] },
              { label: "Cons", items: ["Needs training infrastructure", "High upfront compute"] }
            ]
          }
        ]
      },

      { h2: "Why a graph?", id: "graph" },
      {
        p: "A sensor network is naturally a **graph**: sensors, their fields of view, and targets are entities, and line-of-sight opportunities and conflicts are relationships between them. Graph neural networks reason jointly over that structure and its state, scale with the size of the system, and support **decentralized cooperation**, where each sensor makes decisions informed by its neighbors."
      },
      {
        figure: {
          src: "images/projects/gnn/graph-structure.png",
          caption: "The scenario as a graph: sensors (red), fields of view (orange), targets (blue), and a global node (green) connected to everything."
        }
      },
      {
        list: [
          "**Node types**: sensor, field of view (FOV), target, and a single global node.",
          "**Node features**: longitude, latitude, slew rate, target speed, velocity components, and a **mode flag** (searching vs. tracking).",
          "**Edges**: sensor–sensor, sensor–FOV, sensor–target, FOV–target, FOV–FOV, and global–everything.",
          "**Targets** carry features relative to each sensor, so message passing has spatial context.",
          "**The global node** aggregates mission-level summary statistics that every node can read during message passing."
        ]
      },
      {
        p: "Graph learning alone has limits, though. It tends to overfit to whatever strategies dominate the training data, and it has no built-in notion of goals or of an opponent that reacts. That's where the *gambit* in GambitNet comes in."
      },

      { h2: "Learning to coordinate", id: "rl" },
      {
        p: "GambitNet couples the GNN with **game-theoretic reinforcement learning**. The GNN is the policy, and it's trained with **PPO** in a multi-agent setting: each sensor is an agent acting independently, but they share an objective and converge on equilibrium-style cooperative strategies under uncertainty. Target maneuvers are treated as *strategic* rather than random noise, which pushes the policy to balance **exploration** (searching for unseen objects) against **exploitation** (tracking known ones)."
      },
      {
        p: "The reward function encodes what good tasking looks like:"
      },
      {
        cards: [
          {
            title: "Rewards",
            badge: "+",
            groups: [
              {
                label: "Encourage",
                items: [
                  "Switching from search to track: a new detection",
                  "Each consecutive step spent tracking",
                  "Keeping the target inside the sensor's field of regard",
                  "A coverage bonus for looking somewhere other sensors aren't"
                ]
              }
            ]
          },
          {
            title: "Penalties",
            badge: "−",
            groups: [
              {
                label: "Discourage",
                items: ["Distance (haversine) to the nearest target while searching", "Each consecutive step spent searching without finding anything"]
              }
            ]
          }
        ]
      },
      {
        p: "Together these push sensors to acquire targets fast, hold onto them, and **spread out** instead of piling onto the same object."
      },

      { h2: "The simulation", id: "simulation" },
      {
        p: "The study models a network of ground-based sensors across the continental US observing LEO targets. It's a deliberately simplified, back-of-the-envelope line-of-sight model: the goal was to compare **relative algorithm performance and behavioral trends**, not to model specific hardware."
      },
      {
        table: {
          head: ["Parameter", "Setting"],
          rows: [
            ["Sensor field of view", "1°"],
            ["Max slew rate", "5° / s"],
            ["Elevation constraint", "10° above the horizon"],
            ["Target maneuvers", "Up to ±1° cross-track during the orbit"],
            ["Target density", "Undersaturated (1), saturated (6), oversaturated (10 targets)"],
            ["Evaluation", "500 Monte Carlo runs × 30-minute episodes per scenario"]
          ]
        }
      },
      {
        p: "Out of scope: sensor-specific hardware models, orbital perturbations and atmospheric effects, communication latency, Earth occlusion, and online retraining. I compared three algorithms of increasing coordination: a **spiral scan** (brute force, no prior information), a **greedy heuristic** (uses the expected track direction), and the **GNN policy** (expected track in its features, with dynamic scheduling learned over many episodes)."
      },
      {
        p: "Three metrics map onto SDA's core objectives: **proportion of targets detected** (custody of the full catalog), **time to first detection** (catching a target within its ~10-minute pass), and **system-level detection rate** (sustained tracking for accurate state estimates)."
      },

      { h2: "Result 1: catalog custody", id: "custody" },
      {
        figures: [
          { src: "images/projects/gnn/detected-no-maneuver.png", caption: "Proportion of targets detected, no maneuvers." },
          { src: "images/projects/gnn/detected-maneuver.png", caption: "Proportion of targets detected, with maneuvers. In the plots, PPO is the GNN policy." }
        ]
      },
      {
        p: "This was the headline result. The GNN policy detected **nearly 100% of targets at every density**, with or without maneuvers. The baselines degraded as the sky filled up: the spiral scan fell from about 93% to 65% coverage, and the heuristic was hit hardest by maneuvers, dropping to roughly a third of the catalog. In the most stressed case (oversaturated and maneuvering), the GNN covered about **70% more of the catalog** than the heuristic."
      },

      { h2: "Result 2: finding targets fast", id: "speed" },
      {
        figures: [
          { src: "images/projects/gnn/ttfd-no-maneuver.png", caption: "Time to first detection relative to the 10-minute (600 s) pass, no maneuvers. Lower is better; the red band means the target was missed." },
          { src: "images/projects/gnn/ttfd-maneuver.png", caption: "Time to first detection, with maneuvers." }
        ]
      },
      {
        p: "Speed matters because a target is only overhead for about ten minutes. The GNN found targets **fastest at every density**: up to about **90% faster** than the 10-minute window in single-target scenarios, and still roughly 25–30% faster when the sky was crowded. The heuristic **collapsed under maneuvers**: its detection times landed past the 10-minute mark, which means missed passes."
      },

      { h2: "Result 3: the tradeoff", id: "tradeoff" },
      {
        figures: [
          { src: "images/projects/gnn/sysrate-no-maneuver.png", caption: "System-level detection rate, no maneuvers." },
          { src: "images/projects/gnn/sysrate-maneuver.png", caption: "System-level detection rate, with maneuvers." }
        ]
      },
      {
        p: "Not everything favored the GNN, and this result is the most interesting one. On **system-level detection rate** (the fraction of time sensors spend actively tracking), the baselines are competitive or better in crowded scenarios. They get there by persistently tracking a *few* targets. The GNN learned to **switch targets strategically**, giving up some tracking consistency to visit more of the catalog."
      },
      {
        callout: "The policy learned a real operational tradeoff on its own: **breadth of custody over depth of tracking**. For SDA, where losing an object entirely is worse than tracking it less often, that's usually the right call.",
        label: "Takeaway"
      },
      {
        table: {
          head: ["Metric", "Spiral scan", "Greedy heuristic", "GNN policy"],
          rows: [
            ["Catalog tracked", "Fails", "Fails", "**Meets**"],
            ["Time to first detection", "Fails", "Fails", "**Meets**"],
            ["System-level detection rate", "Partial", "Partial", "Partial"],
            ["Scales with target density", "Fails", "Fails", "**Meets**"],
            ["Runtime efficiency", "Partial", "Partial", "Partial"]
          ],
          highlight: null,
          caption: "Scorecard against SDA mission objectives. \"Partial\" means further development is needed."
        }
      },

      { h2: "What I took away", id: "takeaways" },
      {
        list: [
          "**Graph structure fits the problem.** Modeling sensors, fields of view, and targets as a graph gave the policy a representation that scales with the system and lets sensors coordinate instead of colliding.",
          "**Robustness is the real test.** The heuristic looked fine on predictable targets and fell apart once targets maneuvered. The learned policy kept its performance, which is what matters against non-cooperative objects.",
          "**Rewards define behavior.** The coverage bonus and search penalties are what taught sensors to spread out, and they also produced the breadth-over-depth tradeoff. Reward design is policy design.",
          "**Simple models, real signal.** Even with simplified physics, the relative gaps were large and consistent across 500 Monte Carlo runs, an early sign that learned tasking is worth investing in."
        ]
      },

      { h2: "What's next", id: "future" },
      {
        list: [
          "Integrate higher-fidelity sensor and orbital dynamics models, and evaluate at **constellation scale** (e.g. Starlink).",
          "Run sensitivity analyses on maneuver magnitude and frequency for specific mission scenarios.",
          "Explore online vs. offline learning, alternative architectures, and reward tuning.",
          "Benchmark against current operational tasking algorithms and move toward real or near-operational systems."
        ]
      },

      { h2: "Slides", id: "slides" },
      { p: "The full presentation, including backup slides on the model, the game-theoretic RL framing, and the reward function." },
      { slides: { pdf: "files/gambitnet-slides.pdf", aspect: "4 / 3", images: Array.from({ length: 24 }, (_, i) => `images/projects/gnn/slides/slide-${String(i + 1).padStart(2, "0")}.jpg`) } },
      { links: [{ label: "Download slides (PDF)", url: "files/gambitnet-slides.pdf" }] }
    ]
  },

  nanogpt: {
    title: "Squeezing a Language Model into 100M Parameters",
    subtitle:
      "My solo entry in UC San Diego's NanoGPT competition: how a 99.4M-parameter decoder reached 25.80 perplexity on one rented GPU, and why the choices that looked best early on weren't the ones that won.",
    kicker: "CSE 251B · Deep Learning · UC San Diego",
    date: "May 2026",
    tags: ["PyTorch", "Transformers", "Muon", "Knowledge Distillation", "Weights & Biases"],
    cover: { viz: "attention" },
    tldr: [
      { value: "25.80", label: "final evaluation perplexity (#28, private leaderboard)" },
      { value: "99.4M", label: "parameters, under the 100M cap" },
      { value: "3.5B", label: "training tokens from FineWeb-Edu" },
      { value: "45 h", label: "on a single rented RTX 4090" }
    ],
    body: [
      { h2: "The challenge", id: "challenge" },
      {
        p: "Frontier language models have hundreds of billions of parameters and training budgets to match. This competition asked the opposite question: **how good can a language model get when it's small and cheap?** The rules were simple, and tight:"
      },
      {
        stats: [
          { value: "≤ 100M", label: "parameters" },
          { value: "≤ 5 min", label: "wall-clock time for inference" },
          { value: "lowest", label: "perplexity on a hidden test set wins" }
        ]
      },
      {
        p: "Every model is trained on **next-token prediction** over FineWeb-Edu: given a sequence of tokens, predict the token that comes next at every position. The loss is average cross-entropy, and the score is **perplexity**, its exponential. Lower means the model is less surprised by real text."
      },
      {
        math: String.raw`\mathcal{L}(\theta) = -\frac{1}{T}\sum_{t=1}^{T} \log p_\theta\!\left(x_{t+1} \mid x_{\le t}\right), \qquad \mathrm{PPL} = e^{\mathcal{L}}`,
        caption: "Next-token cross-entropy over a sequence of $T$ tokens, and perplexity."
      },
      {
        p: "Small models matter beyond the leaderboard. They run on-device with lower latency and better privacy, they're accessible to students and small labs, and they cost far less energy to train. With the parameter count capped, every architectural choice (heads, width, depth, normalization, positional encoding) becomes a real tradeoff."
      },
      {
        p: "I worked on this **solo**: the literature review, codebase, ablations, training runs, and analysis are all mine."
      },

      { h2: "Where I started", id: "baseline" },
      {
        p: "The baseline was a classic GPT-2-style decoder. Every later ablation was measured against it, adjusting width or depth to keep the parameter count roughly constant so comparisons stayed fair."
      },
      {
        table: {
          head: ["Component", "Baseline"],
          rows: [
            ["Size", "8 layers, hidden size 256, 4 heads (~19.4M parameters)"],
            ["Context / vocabulary", "1,024 tokens / 50,257 (GPT-2 BPE)"],
            ["Positional encoding", "Learned absolute embeddings"],
            ["Attention", "Standard multi-head causal self-attention"],
            ["MLP", "4× expansion, GELU"],
            ["Normalization / residuals", "Pre-norm LayerNorm, sequential residuals"],
            ["Optimizer", "AdamW, cosine learning-rate schedule"]
          ]
        }
      },

      { h2: "Getting the data right", id: "data" },
      {
        p: "Training data came from the **FineWeb-Edu sample-10BT** corpus, tokenized with the GPT-2 tokenizer. Before writing training shards, I built a preprocessing pipeline:"
      },
      {
        list: [
          "**Noise filtering** and **domain-level shuffling**, so batches mix sources.",
          "**Light augmentation**: swapping words for synonyms and randomly inserting tokens.",
          "**EOS-aware packing**: joining short sequences and cutting at end-of-sequence tokens, with continuous packing so the model learns transitions between documents."
        ]
      },
      {
        p: "Early in training, this made a big difference: **1,414 vs. 2,181 perplexity** after the first 100 steps. That gap turned out to be misleading, though, and it's one of the main threads of this story (see [what I learned](#lessons))."
      },

      { h2: "The architecture", id: "architecture" },
      {
        figure: {
          src: "images/projects/nanogpt/arch.png",
          caption: "The final model: 14 unique transformer blocks, plus layers 2–3 applied twice (depth recurrence) for 16 effective layers, at width 640."
        }
      },
      {
        p: "The final model is a **16-layer, 640-dimensional decoder** with about 99.4M parameters. It borrows the modern refinements used in LLaMA-style models, community NanoGPT speedruns, and OpenAI's Parameter Golf competition:"
      },
      {
        list: [
          "**Grouped-query attention** with 8 query heads but a *single* key–value head. This saves a large share of attention parameters and memory.",
          "**Rotary position embeddings (RoPE)** in place of learned absolute positions.",
          "**SwiGLU** feed-forward layers, plus **QK-normalization** with a learned gain.",
          "**Parallel residuals** (GPT-J style), where attention and the MLP read the same input, plus **scaled residual initialization**.",
          "**Logit soft-capping** (cap 21.44) to keep the output logits stable.",
          "**Tied embeddings**: the input embedding and output projection share one matrix.",
          "**Depth recurrence**: layers 2–3 are looped, so the model gets extra computation without extra parameters."
        ]
      },
      {
        table: {
          head: ["Where the parameters go", "Count"],
          rows: [
            ["Token embedding (tied with output)", "50,257 × 640 ≈ 32.3M"],
            ["Attention, 16 layers", "≈ 26.9M"],
            ["Feed-forward (SwiGLU), 16 layers", "≈ 39.4M"],
            ["LayerNorm scales", "≈ 21K"],
            ["QK gains (one per layer)", "16"],
            ["**Total**", "**99,365,888**"]
          ],
          caption: "Almost a third of the budget goes to the vocabulary embedding alone, which is why tying it to the output layer matters so much at this scale."
        }
      },

      { h2: "Depth beats width, eventually", id: "depth" },
      {
        p: "The biggest architectural question was how to spend a fixed parameter budget: **more layers, or wider layers?** I swept configurations from 4 layers at width 1,056 up to 16 layers at width 640."
      },
      {
        figure: {
          src: "images/projects/nanogpt/depth_vs_width_early_ablation.png",
          caption: "Early training perplexity for depth–width configurations with the same budget. Shallow, wide models lead early."
        }
      },
      {
        p: "In short runs, **shallow models won clearly**, so I spent much of development focused on an 8-layer model. When I finally trained a 16-layer model for longer, it **overtook the shallow ones** and gave the best evaluation perplexity. Shallow models are easier to optimize, so their loss drops faster at first, but they hit a capacity ceiling. Deeper models need more training before their extra representational power pays off."
      },

      { h2: "Experiment: looped layers", id: "looping" },
      {
        p: "Looped (recurrent) layers apply the same block more than once, which buys extra computation for free in parameter terms. The catch is that training can become unstable as loop counts grow, because of gradient oscillation and residual explosion. What I found:"
      },
      {
        list: [
          "**Which layers you loop didn't matter** for this task; I picked layers 2 and 3.",
          "**Looping more than once** drove up runtime, which counts against the 5-minute inference limit, without a noticeable improvement. One extra pass was the sweet spot."
        ]
      },

      { h2: "Training: optimizer, schedule, and sweeps", id: "optimization" },
      {
        p: "I used **Muon** for the 2D weight matrices (attention and MLP projections) and **AdamW** for embeddings, norms, and other 1D tensors. Pretraining used a **flat-then-linear** learning-rate schedule (flat for 78% of training, then decaying), which beat cosine decay in ablations. Later stages switched to cosine decay with much smaller learning rates."
      },
      {
        list: [
          "**Batching**: micro-batches of 32 × 1,024 tokens with 4-step gradient accumulation, for an effective batch of about 131K tokens.",
          "**Context curriculum**: pretrain on 256-token contexts, then extend to 1,024 to fine-tune.",
          "**Flash attention** for faster, memory-efficient attention.",
          "**Regularization**: weight decay 0.05, gradient clipping 1.9, light dropout, and an EMA of the weights during distillation."
        ]
      },
      {
        p: "Hyperparameters came from a **Bayesian sweep in Weights & Biases** over 13 parameters. A few of the chosen values:"
      },
      {
        table: {
          head: ["Hyperparameter", "Search range", "Chosen"],
          rows: [
            ["Muon learning rate", "0.015 – 0.06", "0.0308"],
            ["AdamW learning rate", "5e-4 – 3e-3", "0.00251"],
            ["Muon momentum", "0.82 – 0.93", "0.880"],
            ["Muon Newton–Schulz steps", "7 – 15", "11"],
            ["Flat fraction of LR schedule", "0.7 – 0.9", "0.783"],
            ["Logit soft-cap", "15 – 28", "21.44"],
            ["QK gain init", "8 – 18", "12.42"],
            ["Dropout", "0 – 0.08", "0.003"]
          ]
        }
      },

      { h2: "A seven-stage training pipeline", id: "pipeline" },
      {
        p: "The largest gains didn't come from any single architectural tweak. They came from **how the model was trained over time**. The final run was a sequence of seven checkpointed stages:"
      },
      {
        steps: [
          { title: "Pretrain", text: "Standard cross-entropy on preprocessed FineWeb-Edu shards." },
          { title: "Distill from GPT-2 Medium", text: "Learn from a larger teacher's predictions, not just the data." },
          { title: "Distill from GPT-2 Large", text: "A stronger teacher, with more weight on the distillation loss." },
          { title: "Continue (×2)", text: "Low-learning-rate continuation on fresh data shards to avoid saturating on repeated data." },
          { title: "Distill from GPT-Neo 2.7B", text: "The strongest teacher, used last." },
          { title: "Continue on raw data", text: "Fresh, unprocessed shards, which took evaluation perplexity from 26.34 to 25.80." }
        ]
      },
      {
        figure: {
          src: "images/projects/nanogpt/full_training_progression.png",
          caption: "Log perplexity across all seven stages (about 35.6K steps). Each color is a stage; distillation and fresh-data continuation produce the steady late gains.",
          wide: true
        }
      },
      {
        p: "Distillation trains the student to match the teacher's *softened* output distribution as well as the true next token:"
      },
      {
        math: String.raw`\mathcal{L}_{\text{distill}} = \alpha\, T^2\, D_{\mathrm{KL}}\!\left(\mathrm{softmax}\!\left(\tfrac{z_s}{T}\right) \,\Big\|\, \mathrm{softmax}\!\left(\tfrac{z_t}{T}\right)\right) + (1-\alpha)\, \mathcal{L}_{\mathrm{CE}}(z_s, y)`,
        caption: "Student logits $z_s$, teacher logits $z_t$, temperature $T$ (1.5–2.0), and distillation weight $\\alpha$ (0.65–0.8). The $T^2$ factor keeps gradients at the right scale."
      },
      {
        p: "Two findings stood out. Distillation **only helped once the student had already learned basic language structure**: starting from random weights, it didn't help. And **stronger teachers consistently gave bigger gains**, at the cost of slower training from their larger forward passes."
      },
      {
        p: "**Engineering note:** rented GPU sessions couldn't run continuously, so I built a checkpoint-and-resume system that saved the model weights, full optimizer state, and the position in the learning-rate schedule. That let seven separate runs over about 45 GPU-hours behave like one continuous training run."
      },

      { h2: "Results", id: "results" },
      {
        stats: [
          { value: "25.80", label: "final evaluation perplexity" },
          { value: "28.0 → 25.80", label: "improvement after the course milestone" },
          { value: "#28", label: "on the private leaderboard" }
        ]
      },
      {
        table: {
          head: ["Component", "Options tested", "Final choice"],
          rows: [
            ["Depth / width", "8:832, 10:768, 12:704, 14:640, 16:640", "**16 layers, width 640**"],
            ["Activation", "GELU, SwiGLU", "**SwiGLU**"],
            ["Attention", "MHA; GQA with 1, 2, 4, 8 KV heads", "**GQA, 1 KV head**"],
            ["Optimizer / schedule", "AdamW vs. Muon + AdamW; cosine vs. flat-linear", "**Muon + AdamW, flat-linear**"],
            ["Training pipeline", "Pretrain only; + distillation; + continuation", "**Pretrain → distill → continue**"],
            ["Data", "Raw; preprocessed; raw continuation", "**Preprocessed early, raw late**"]
          ],
          caption: "The ablations that shaped the final model."
        }
      },
      {
        p: "One gap remained: validation perplexity reached about **22.5**, but evaluation on the hidden test set came in at **25.8**. Metrics measured during training didn't always predict final performance, which is why I selected models by evaluation perplexity rather than validation alone."
      },

      { h2: "What I learned", id: "lessons" },
      {
        callout: "Some choices that help early in training **don't carry through to the end**. Short ablations can point you the wrong way.",
        label: "Main lesson"
      },
      {
        list: [
          "**Depth**: shallow models won the early race, but the deeper model won the final result. I spent too long optimizing an 8-layer model because of early curves.",
          "**Preprocessing**: augmentation sped up early learning dramatically, but later the model plateaued around 25 validation perplexity. Synonym swaps and random insertions make the target distribution noisier and harder to match exactly. The best final step used raw data.",
          "**Small-to-large transfer**: settings tuned on small models (learning rates, schedules, which layers to loop) didn't always transfer to the 16-layer model and had to be retuned at full size.",
          "**Training process over architecture**: architectural refinements improved convergence and efficiency, but most of the final improvement came from the staged pretrain–distill–continue pipeline.",
          "**Interactions matter**: distillation, recurrence, optimizer changes, and architecture interact in non-obvious ways, so each has to be validated in combination, not adopted on its own."
        ]
      },

      { h2: "What I'd do next", id: "next" },
      {
        list: [
          "Run longer ablations, and retune hyperparameters directly on the final 16-layer model.",
          "Find the minimum workable embedding width, then build the deepest model that fits.",
          "Use a much larger batch: memory limited me to 128 sequences, versus a target of 1,024–2,048.",
          "Train for more steps in **one continuous run** instead of seven stops and starts.",
          "Make preprocessing **adaptive**: start aggressive to speed up early learning, then taper off so the model ends on the true data distribution."
        ]
      },

      { h2: "Slides", id: "slides" },
      { p: "The competition presentation." },
      { slides: { pdf: "files/nanogpt-slides.pdf", images: Array.from({ length: 16 }, (_, i) => `images/projects/nanogpt/slides/slide-${String(i + 1).padStart(2, "0")}.jpg`) } },
      {
        links: [
          { label: "Code on GitHub", url: "https://github.com/rheask8246/CSE251B-Final-Competition" },
          { label: "Download slides (PDF)", url: "files/nanogpt-slides.pdf" }
        ]
      }
    ]
  },

  music: {
    title: "Writing and Hearing Anime Piano Music",
    subtitle:
      "Two models for one instrument: a Transformer that composes new anime-style piano music from scratch, and a Conformer that listens to a piano recording and writes down the notes.",
    kicker: "CSE 253 · Machine Learning for Music · UC San Diego",
    date: "May 2026",
    tags: ["PyTorch", "Librosa", "Transformers", "Conformer", "MIDI"],
    cover: { viz: "spectrogram" },
    tldr: [
      { value: "21.3", label: "Transformer validation perplexity (LSTM 28.8, CNN 48.5)" },
      { value: "0.526", label: "Conformer frame F1 (CRNN 0.448)" },
      { value: "0.190", label: "Conformer note F1 (CRNN 0.123)" },
      { value: "−19%", label: "ghost notes vs. the CRNN (0.549 vs. 0.676)" }
    ],
    body: [
      { h2: "Two directions, one instrument", id: "overview" },
      {
        p: "Piano covers of anime soundtracks are a whole genre of their own, and they make a good testbed for music modelling: one instrument, dense harmony, fast runs, and a recognizable style. This project approaches that music from both directions."
      },
      {
        cards: [
          {
            title: "Part 1: Generation",
            badge: "1",
            groups: [
              { label: "Task", items: ["Unconditioned symbolic generation: compose a new piano piece as MIDI, with no prompt"] },
              { label: "Model", items: ["Decoder-style Transformer over MIDI event tokens", "Baselines: LSTM and causal CNN"] }
            ]
          },
          {
            title: "Part 2: Transcription",
            badge: "2",
            groups: [
              { label: "Task", items: ["Audio to MIDI: given a piano recording, recover which keys were pressed and when"] },
              { label: "Model", items: ["Conformer (convolution + self-attention) with onset and frame heads", "Baselines: CQT rules and a CRNN"] }
            ]
          }
        ]
      },

      { h2: "Part 1: the anime piano corpus", id: "corpus" },
      {
        p: "For generation I built my own dataset. I wrote a scraper for two fan-run collections of anime piano MIDI arrangements, [Kenzie Smith Piano](https://kenziesmithpiano.com/anime-midi/) (148 songs) and [AnimeMIDI](https://animemidi.wordpress.com/sheet-music-midi-files/) (143 songs), then kept only the files that were valid, piano-only, and tokenizable."
      },
      {
        figure: { src: "images/projects/music/corpus-stats.png", caption: "Corpus overview: piece duration, notes per piece, file size, and estimated tempo, including a comparison of the two sources." }
      },
      {
        figure: { src: "images/projects/music/corpus-pitch-key.png", caption: "Pitch-class counts, the pitch range across the keyboard, and estimated keys per piece (Krumhansl). Minor keys dominate." }
      },
      {
        p: "The exploration set three requirements for any model: it has to cover a **wide pitch range**, support **high polyphony** (many keys at once), and produce **coherent transitions** across many short notes."
      },

      { h2: "Turning music into tokens", id: "tokens" },
      {
        p: "Each MIDI file is parsed with PrettyMIDI and flattened into a sequence of discrete events, in the style of the Music Transformer. The vocabulary has 387 tokens:"
      },
      {
        table: {
          head: ["Event", "Token"],
          rows: [
            ["Start of piece", "`START`"],
            ["Time advance", "`time_shift` (8 ms per step, 128 bins)"],
            ["Key pressed", "`note_on` (pitch 0–127)"],
            ["Key released", "`note_off` (same pitch index)"],
            ["End of piece", "`END`"]
          ]
        }
      },
      {
        p: "Generation then becomes **autoregressive language modelling**: predict the next token given everything before it, trained with cross-entropy and label smoothing on windows of up to 512 tokens. At test time the model samples a sequence token by token, which is decoded back to MIDI and rendered to audio."
      },

      { h2: "Three ways to model a sequence", id: "gen-models" },
      {
        cards: [
          {
            title: "LSTM",
            badge: "1",
            groups: [
              { label: "Pros", items: ["Low memory", "Fast generation", "Strong local modelling"] },
              { label: "Cons", items: ["Limited long-range context", "Can drift or repeat"] }
            ]
          },
          {
            title: "Causal CNN",
            badge: "2",
            groups: [
              { label: "Pros", items: ["Captures local repeated patterns", "WaveNet-style dilated convolutions"] },
              { label: "Cons", items: ["Fixed receptive field", "Sensitive to regularization", "Slow to sample"] }
            ]
          },
          {
            title: "Transformer",
            badge: "3",
            chosen: true,
            groups: [
              { label: "Pros", items: ["Attention sees local and long-range structure", "Trains in parallel over the window"] },
              { label: "Cons", items: ["Quadratic cost in context length", "More hyperparameters"] }
            ]
          }
        ]
      },
      {
        figure: { src: "images/projects/music/transformer-arch.png", caption: "The generator: token and positional embeddings, 4 Transformer layers with 6 attention heads and width 384, and a causal mask so each position only sees the past." }
      },
      {
        p: "With under 300 pieces, the dataset is small, so I kept the model small too: 4 layers, 6 heads, and a hidden size of 384. A bigger model would mostly memorize."
      },

      { h2: "Generation results", id: "gen-results" },
      {
        p: "A good output should stay in a consistent key and tempo, sound harmonic, hold together from start to finish, and use a varied set of notes instead of collapsing onto a few. I measured that with three kinds of metric: **perplexity** (how well the model predicts held-out music), the **Krumhansl key-profile score** (how strongly the notes fit a musical key), and **pitch diversity and repetition** statistics of generated samples."
      },
      {
        table: {
          head: ["Model", "Val. perplexity", "Key-profile score", "Notes / sec", "Pitch classes", "4-gram repetition"],
          rows: [
            ["LSTM", "28.8", "0.1057", "3.99", "8", "0.000"],
            ["Causal CNN", "48.5", "0.1062", "1.94", "10", "0.264"],
            ["**Transformer**", "**21.3**", "**0.1138**", "9.06", "10", "0.016"],
            ["Training corpus (mean)", "–", "–", "6.81", "8.3", "–"]
          ],
          highlight: 2,
          caption: "Generation metrics for a 512-token sample from each model. Lower perplexity is better; a higher key-profile score means a stronger tonal center."
        }
      },
      {
        figure: { src: "images/projects/music/training-curves.png", caption: "Validation loss and perplexity during training, and generation speed. The CNN overfits quickly; the Transformer keeps improving." }
      },
      {
        figures: [
          { src: "images/projects/music/kkps.png", caption: "Key-profile score: the Transformer's output is the most key-consistent." },
          { src: "images/projects/music/pitch-diversity.png", caption: "Unique pitch classes used, against the corpus mean of 8.3." }
        ]
      },
      {
        p: "The Transformer predicts held-out music best by a wide margin (perplexity **21.3** vs. 28.8 and 48.5) and has the strongest sense of key. The baselines fail in recognizable ways. The **CNN repeats itself**: over a quarter of its 4-note patterns are repeats, about 16 times the Transformer's rate, which fits the known limit of a fixed receptive field. The **LSTM plays it safe**, with sparse output and fewer pitch classes."
      },
      {
        p: "The Transformer isn't perfect either. It plays **denser** music than the corpus (about 9 notes per second against a corpus average of 6.8), so its samples sound busier than a typical arrangement."
      },

      { h2: "Part 2: from sound back to notes", id: "transcription" },
      {
        p: "Transcription runs the other way: given audio, recover the score. For this I used **MAESTRO**, Google Magenta's dataset of about 200 hours of virtuoso piano performances recorded on Yamaha Disklaviers, which capture the exact MIDI alongside the audio, aligned to about 3 ms."
      },
      {
        figure: { src: "images/projects/music/mel-and-roll.png", caption: "One training pair: the log-mel spectrogram the model hears (top) and the piano roll it must produce (bottom)." }
      },
      {
        steps: [
          { title: "Audio features", text: "Resample to 16 kHz mono and compute 128-bin log-mel spectrograms." },
          { title: "Labels", text: "Parse the MIDI into an 88-key binary piano roll on the same frame grid as the spectrogram." },
          { title: "Chunk", text: "Slide fixed-length windows with 50% overlap over each piece." },
          { title: "Pair", text: "Each training example is a spectrogram chunk and its matching piano-roll chunk." }
        ]
      },
      {
        figures: [
          { src: "images/projects/music/maestro-polyphony.png", caption: "Polyphony in MAESTRO: several keys are usually down at once." },
          { src: "images/projects/music/maestro-pitch-velocity.png", caption: "Note pitch and velocity distributions across the paired pieces." }
        ]
      },
      {
        p: "The task is **multi-label prediction**: for every time frame, decide independently for each of the 88 keys whether it is sounding. The piano roll is extremely sparse (most keys are off most of the time), which shapes both the loss and the metrics."
      },

      { h2: "The Conformer transcriber", id: "conformer" },
      {
        figure: { src: "images/projects/music/conformer-arch.png", caption: "The transcriber: a CNN front-end, four Conformer blocks, an onset head, and a frame head that is conditioned on the onset predictions." }
      },
      {
        list: [
          "**CNN front-end**: two convolution blocks shrink the frequency axis and pull out local patterns, so attention isn't spent on raw mel bins.",
          "**Four Conformer blocks** (width 192, 4 heads): each combines self-attention for global context with a depthwise convolution for local detail.",
          "**Two heads, as in Onsets and Frames**: one predicts where notes *start*, and its output feeds a bidirectional GRU that predicts which keys are *held*."
        ]
      },
      {
        math: String.raw`\mathcal{L} = \mathrm{Focal}(\hat{Y}, Y) + 0.3\,\mathrm{Focal}(\hat{O}, O^{*}) + 0.35\,\mathrm{Dice}(\hat{Y}, Y) + 0.2\,\big\lVert \Delta\hat{Y} - \Delta Y \big\rVert^{2}`,
        caption: "$\\hat{Y}, Y$ are predicted and true frames, $\\hat{O}, O^{*}$ are onsets, and $\\Delta$ is the change between consecutive frames. Focal and Dice terms counter the sparsity, which would otherwise reward predicting silence everywhere."
      },
      {
        p: "I compared it against two baselines of increasing complexity: a **CQT** baseline with hand-set thresholds and no training, and an **Onsets-and-Frames CRNN** (convolutions plus a bidirectional GRU). Checkpoints were chosen by validation frame F1 on *decoded* notes, because training loss didn't track how the transcriptions actually sounded."
      },

      { h2: "Transcription results", id: "trans-results" },
      {
        table: {
          head: ["Model", "Frame F1 ↑", "Note F1 ↑", "Ghost rate ↓", "Miss rate ↓"],
          rows: [
            ["CQT rules", "0.109", "0.018", "0.936", "0.588"],
            ["CRNN (O&F)", "0.448", "0.123", "0.676", "**0.213**"],
            ["**Conformer**", "**0.526**", "**0.190**", "**0.549**", "0.307"]
          ],
          highlight: 2,
          caption: "Held-out MAESTRO validation. Note F1 requires the onset and offset to land within 80 ms. Ghost rate is the share of predicted notes that aren't real; miss rate is the share of real notes that were dropped."
        }
      },
      {
        p: "The Conformer wins on frame F1, note F1, and ghost notes. Its advantage is **precision**: 0.45 against the CRNN's 0.32. The CRNN finds more of the real notes (recall 0.79 vs. 0.69, so a lower miss rate) but pays for it by hallucinating many more. Global context from self-attention lets the Conformer suppress those false activations, which is the same conclusion as the Conformer paper's own ablations."
      },
      {
        figures: [
          { src: "images/projects/music/frame-f1.png", caption: "Frame F1" },
          { src: "images/projects/music/note-f1.png", caption: "Note F1" }
        ]
      },
      {
        figures: [
          { src: "images/projects/music/ghost-rate.png", caption: "Ghost rate" },
          { src: "images/projects/music/miss-rate.png", caption: "Miss rate" }
        ]
      },
      {
        p: "The charts come from a separate evaluation pass, so their values differ slightly from the logged final-epoch numbers in the table. The ranking is the same in both."
      },
      {
        callout:
          "These scores are far below the published state of the art (about 0.90 frame F1 for Onsets and Frames, and about 0.86 for a Conformer-based transcriber). That gap is mostly scale: I trained for roughly half an hour on 50 pieces, while those systems train for days on more than a thousand.",
        label: "In context"
      },

      { h2: "Trying it on real anime piano", id: "demo" },
      {
        p: "The point of the project was anime piano, so the last step runs the trained transcribers on piano audio from outside MAESTRO. The inference script takes any piano video on YouTube, pulls the audio, and writes out a MIDI file. For the class demo I transcribed this piano arrangement of *KICK BACK*, the Chainsaw Man opening, by Animenz:"
      },
      {
        video: {
          youtube: "ub5dNHEagDA",
          title: "KICK BACK - Chainsaw Man OP [Piano], Animenz Piano Sheets",
          caption: "The original audio used as input for the transcription demo. Performance and arrangement by Animenz Piano Sheets."
        }
      },
      { links: [{ label: "Transcribed MIDI (audio)", url: "" }, { label: "Generated sample from Part 1 (audio)", url: "" }] },
      {
        p: "There's no ground-truth score for a recording like this, so the comparison below (on a second Animenz arrangement) uses the **Conformer's own output as the reference** and shows where the other two models differ from it."
      },
      {
        figure: {
          src: "images/projects/music/transcription-comparison.png",
          caption: "Two minutes of piano audio transcribed by all three models. Colors are relative to the Conformer's output, not to a true score: the CQT baseline sprays extra notes (red) everywhere, and the CRNN adds a smaller layer of them.",
          wide: true
        }
      },

      { h2: "How this compares to prior work", id: "related" },
      {
        cards: [
          {
            title: "WaveNet (van den Oord et al., 2016)",
            badge: "↗",
            groups: [
              { label: "Idea", items: ["Stacked dilated causal convolutions generate audio sample by sample"] },
              { label: "My result", items: ["On music tokens the fixed receptive field becomes the bottleneck: worst perplexity (48.5) and heavy repetition"] }
            ]
          },
          {
            title: "Music Transformer (Huang et al., 2018)",
            badge: "↗",
            groups: [
              { label: "Idea", items: ["Decoder-only Transformer on MIDI event tokens, with relative attention for long-term structure"] },
              { label: "My result", items: ["Same event vocabulary; the Transformer has the best perplexity (21.3) and far less repetition than the CNN"] }
            ]
          },
          {
            title: "Onsets and Frames (Hawthorne et al., 2018)",
            badge: "↗",
            groups: [
              { label: "Idea", items: ["Jointly detect note onsets and held frames; the onset head conditions the frame head"] },
              { label: "My result", items: ["My CRNN follows the same design: high recall (0.79), low precision (0.32), i.e. the ghost-note problem the paper describes"] }
            ]
          },
          {
            title: "Conformer (Gulati et al., 2020)",
            badge: "↗",
            groups: [
              { label: "Idea", items: ["Combine convolution and self-attention in one block; built for speech recognition"] },
              { label: "My result", items: ["Adapted to piano, it beats the CRNN on frame F1, note F1, and ghost rate"] }
            ]
          }
        ]
      },

      { h2: "What I learned", id: "takeaways" },
      {
        list: [
          "**Match model size to data size.** With a few hundred pieces, a 4-layer Transformer was the right scale; the gains came from the architecture, not from parameters.",
          "**Perplexity isn't the whole story.** Key consistency, density, and repetition each showed a failure that the loss alone hid.",
          "**Sparsity drives the design.** Most keys are silent most of the time, so plain cross-entropy rewards predicting nothing. Focal and Dice losses were necessary, not optional.",
          "**Precision and recall trade off audibly.** Ghost notes and missed notes sound very different, and the two learned transcribers sit at different points on that curve.",
          "**Evaluate what you'll listen to.** Selecting checkpoints by decoded-note F1 instead of training loss gave transcriptions that sounded better."
        ]
      },
      {
        links: [{ label: "Code on GitHub", url: "https://github.com/rheask8246/CSE253-Assignment2" }]
      }
    ]
  }
};
