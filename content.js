// content.js
// ---------------------------------------------------------------------------
// ALL SITE CONTENT LIVES HERE. Edit this file to update the website —
// no HTML changes needed. Every section is rendered from these lists.
//
// Quick guide:
//   • Add an entry  → copy an existing { ... } block in a list and edit it.
//   • Links         → { label: "Slides", url: "https://..." }.
//                     Leave url "" to show a dashed "+ Slides" placeholder.
//   • Images        → put files in images/ and set  image: "images/your-file.jpg".
//                     Leave image "" to show an empty photo slot.
//   • Bold text     → wrap words in **double asterisks**.
//   • Placeholders  → set showPlaceholders to false before you share the site
//                     to hide every empty link / photo slot at once.
// ---------------------------------------------------------------------------

window.SITE = {
  showPlaceholders: false,

  profile: {
    name: "Rhea Senthil Kumar",
    email: "senthilkumarrhea@gmail.com",
    website: "https://rheask8246.github.io/website/",
    linkedin: "https://www.linkedin.com/in/rhea-senthil-kumar-338593188",
    github: "https://github.com/rheask8246",
    scholar: "",                 // Google Scholar URL
    cv: "files/Rhea_Senthil_Kumar_CV.pdf",
    location: "San Diego, CA",
    portrait: "images/portrait.png",
    eyebrow: "Generative AI for Physics · ML for Space Systems · LLM Agents",
    roles: [
      "generative models for astrophysics",
      "flow matching emulators",
      "ML for space-domain systems",
      "long-horizon LLM agents",
      "AI education at MIT BeaverWorks"
    ],
    summary:
      "M.S. Computer Science & Engineering (AI) at UC San Diego, building generative models that turn thousands of CPU-hours of astrophysics simulation into seconds. Previously at MIT Lincoln Laboratory, Qualcomm, NASA Goddard, and UC Berkeley Space Sciences Laboratory.",
    bio: [
      "I'm a machine learning researcher with roots in astrophysics. At UC San Diego I work with **Dr. Floor Broekgaarden** in the Gravitational Wave Paleontology Group, where I introduced the first application of **conditional flow matching** to gravitational-wave population emulation — accelerating population synthesis by **300–500×** while preserving physical fidelity.",
      "Before graduate school I spent two years as Assistant Staff at **MIT Lincoln Laboratory**, doing systems analysis and red teaming for space-domain systems, building deep generative models for radar imagery, and engineering an **80× faster** distributed signal cross-correlation pipeline.",
      "My research career started at **UC Berkeley Space Sciences Laboratory**, building deep learning event reconstruction for the COSI gamma-ray telescope, testing the GAPS antiparticle spectrometer, and interning at **NASA Goddard** on AMEGO-X. Outside the lab I teach: I founded and run national AI and CubeSat programs at MIT BeaverWorks."
    ],
    now: {
      updated: "October 2026",
      items: [
        "Finishing my M.S. at UC San Diego (December 2026)",
        "Presenting **PLANT** at the NeurIPS 2026 AI4Science and Women in ML workshops",
        "Researching flow-matching emulators for gravitational-wave populations",
        "Leading the MIT BeaverWorks **Forge AI** and **Build a CubeSat** challenges",
        "Just wrapped an engineering internship at **Qualcomm**"
      ]
    },
    stats: [
      { count: "publications", suffix: "", label: "talks & posters" },   // counted automatically
      { count: "experience", suffix: "", label: "research & engineering roles" },
      { value: 4.0, prefix: "", suffix: "", decimals: 1, label: "graduate GPA" }
    ]
  },

  education: [
    {
      school: "University of California San Diego",
      degree: "M.S. Computer Science and Engineering — Artificial Intelligence",
      dates: "Expected December 2026",
      gpa: "4.0",
      links: [],
      image: "images/sourced/ucsd-geisel.jpg",
      coursework: [
        "Machine Learning for Music", "Recommender Systems & Web Mining", "Convex Optimization",
        "AI Agents", "Probabilistic Reasoning & Learning", "Deep Learning"
      ]
    },
    {
      school: "University of California, Berkeley",
      degree: "B.A. Computer Science & Astrophysics",
      dates: "May 2023",
      gpa: "3.8",
      focus: "Dean's List · College of Letters & Science",
      links: [],
      image: "images/sourced/berkeley-campanile.jpg",
      coursework: [
        "Artificial Intelligence", "Intro to Machine Learning", "Computer Graphics",
        "Linear Algebra & Differential Equations", "Multivariable Calculus",
        "Discrete Math & Probability", "Data Structures", "Intro to CS Theory"
      ]
    }
  ],

  // The featured research block with the live flow-matching animation.
  spotlight: {
    kicker: "Current research · UC San Diego",
    title: "PLANT: Conditional Generative Models for Fast Gravitational-Wave Population Synthesis",
    blurb:
      "Gravitational-wave population synthesis pipelines take thousands of CPU-hours to explore how stellar physics shapes the binary black holes and neutron stars LIGO detects. PLANT replaces them with conditional generative emulators. It's the first application of **conditional flow matching** to this problem, and it outperforms diffusion models and standard probabilistic baselines at capturing complex multi-modal populations.",
    stats: [
      { value: "300–500×", label: "faster population generation" },
      { value: "≈0.01", label: "KL divergence on held-out test distributions" },
      { value: "1st", label: "application of CFM to GW population emulation" }
    ],
    links: [
      { label: "Paper", url: "" },
      { label: "Code", url: "" },
      { label: "NeurIPS poster", url: "" },
      { label: "IAIFI talk slides", url: "" }
    ]
  },

  experience: [
    {
      org: "UC San Diego",
      group: "Gravitational Wave Paleontology Group",
      role: "Graduate Student Researcher",
      dates: "Dec 2025 — Present",
      mentors: "Advisor: Dr. Floor Broekgaarden",
      location: "San Diego, CA",
      image: "images/sourced/bbh-merger.jpg",
      imageAlt: "NASA simulation of merging binary black holes",
      bullets: [
        "**Generative AI for physics simulation:** Developed novel generative AI models to emulate computationally intensive gravitational-wave population synthesis pipelines.",
        "**Conditional Flow Matching (CFM):** Introduced the first application of CFM for gravitational-wave population emulation, outperforming diffusion-based models and standard probabilistic baselines in capturing complex multi-modal distributions.",
        "**Scaling & efficiency:** Achieved 300–500× acceleration in population generation while maintaining strict physical fidelity (KL divergence ~0.01) on simulated test distributions."
      ],
      tags: ["Flow Matching", "Diffusion Models", "Generative AI", "Astrophysics"],
      links: [{ label: "Group website", url: "https://www.broekgaarden.nl/floor/wordpress/mentoring/" }]
    },
    {
      org: "Qualcomm",
      group: "SMTR Device Integration",
      role: "Engineering Intern",
      dates: "Jun 2026 — Sep 2026",
      mentors: "Supervisors: Ciara Martin, Alan Shinsato",
      location: "San Diego, CA",
      image: "images/sourced/spectrum-analyzer.jpg",
      imageAlt: "A modern real-time spectrum analyzer",
      bullets: [
        "**Test hardware integration:** Built from scratch a Python library integrating Signal Hound signal generators and spectrum analyzers into the QGov modem team's testing framework. The team adopted it as a drop-in replacement with no change to their workflow.",
        "**Cost reduction:** Enabled test benches built on 250× cheaper equipment while keeping full legacy hardware support.",
        "**Validation & parity:** Kept test performance within factory bounds, achieving identical pass/fail results across the new and legacy test beds."
      ],
      tags: ["Python", "RF Test Automation", "Hardware Integration"],
      links: []
    },
    {
      org: "MIT Lincoln Laboratory",
      group: "Space Systems Analysis and Test Group",
      role: "Assistant Staff",
      dates: "Sep 2023 — Sep 2025",
      mentors: "Supervisor: Eva Nickelson",
      location: "Lexington, MA",
      image: "images/sourced/millstone-radar.jpg",
      imageAlt: "Millstone long-range tracking radar at MIT Haystack Observatory",
      bullets: [
        "**Systems analysis & red teaming:** Conducted systems-level analysis and adversarial evaluation of space-domain systems for national security. Held an active TS//SCI clearance (read out September 2025).",
        "**Generative data augmentation:** Built deep generative models to synthesize high-fidelity radar imagery, mitigating severe class imbalance and data sparsity for downstream classification networks.",
        "**Performance engineering:** Engineered a distributed signal cross-correlation pipeline for grid processing systems, boosting high-throughput data ingestion by 80×."
      ],
      tags: ["Generative Models", "Radar Imagery", "Distributed Computing", "Red Teaming"],
      links: []
    },
    {
      org: "UC Berkeley Space Sciences Laboratory",
      group: "GAPS Integration and Testing",
      role: "Research Apprentice",
      dates: "Aug 2022 — Aug 2023",
      mentors: "Advisor: Dr. Field Rogers",
      location: "Berkeley, CA",
      image: "images/sourced/tvac-chamber.jpg",
      imageAlt: "A NASA thermal vacuum test chamber",
      bullets: [
        "Campaigned to conduct integrated thermal vacuum tests on the General AntiParticle Spectrometer (GAPS).",
        "Developed software tools for GAPS integration and calibration tests in preparation for the 2024 deployment."
      ],
      tags: ["Instrumentation", "Thermal Vacuum Testing", "Calibration"],
      links: []
    },
    {
      org: "UC Berkeley Space Sciences Laboratory",
      group: "COSI Collaboration",
      role: "Research Assistant & Lab Lead",
      dates: "Jan 2020 — Aug 2023",
      mentors: "Advisors: Dr. Andreas Zoglauer, Dr. John Tomsick",
      location: "Berkeley, CA",
      image: "images/sourced/cosi.jpg",
      imageAlt: "Rendering of the COSI Compton Spectrometer and Imager satellite",
      bullets: [
        "**Deep learning reconstruction:** Built custom deep learning architectures in TensorFlow/Keras for spatial event reconstruction, improving classification accuracy by 27% to reach 99%.",
        "**Open-source infrastructure:** Wrote an end-to-end simulation, calibration, and ML inference pipeline that NASA and UC Berkeley high-energy astrophysics teams use worldwide."
      ],
      tags: ["TensorFlow", "Keras", "Gamma-ray Astrophysics", "Open Source"],
      links: [{ label: "Code", url: "https://github.com/rheask8246/COSIPrograms" }]
    },
    {
      org: "NASA Goddard Space Flight Center",
      group: "AMEGO-X Simulation Analysis",
      role: "NASA Intern",
      dates: "Jun 2021 — Aug 2021",
      mentors: "Advisors: Dr. Carolyn Kierans, Dr. Henrike Fleischhack",
      location: "Greenbelt, MD",
      image: "images/sourced/fermi-sky.jpg",
      imageAlt: "Fermi LAT all-sky gamma-ray map",
      bullets: [
        "Developed a Kalman filter pair reconstruction algorithm and validated its performance for the All-Sky Medium-Energy Gamma-ray eXplorer.",
        "Fitted the spatial distribution of energy in the AMEGO-X calorimeter to determine energy resolution in the pair regime."
      ],
      tags: ["Kalman Filtering", "Simulation", "Gamma-ray Instruments"],
      links: []
    }
  ],

  // post: "<slug>" makes the card open a full write-up from posts.js instead of the pop-up.
  // viz: the animated header drawn for each card. Options:
  // attention, spectrogram, memory, catan, embedding, orbits, raytrace, network
  // To use a screenshot instead, set image: "images/your-shot.png".
  projects: [
    {
      title: "From-Scratch 100M-Parameter Language Model",
      date: "May 2026",
      stack: ["PyTorch", "Distributed Training"],
      categories: ["LLMs & Agents", "Generative"],
      metric: "25.8 test perplexity",
      viz: "attention",
      image: "",
      post: "nanogpt",
      summary: "A nanoGPT-style decoder-only Transformer built from scratch and optimized within a strict 100M-parameter budget on FineWeb-Edu.",
      bullets: [
        "Implemented a nanoGPT-style decoder-only Transformer from scratch, optimized strictly within a 100M-parameter threshold on the FineWeb-Edu corpus. Achieved **25.8 perplexity** on the held-out test set.",
        "Integrated modern architectural features: **Grouped Query Attention (GQA)**, **Rotary Position Embeddings (RoPE)**, SwiGLU activations, QK normalization, and weight tying.",
        "Engineered an end-to-end training pipeline using the GPT-2 BPE tokenizer; implemented a progressive context-length curriculum and knowledge-distillation training, and tracked loss convergence dynamics."
      ],
      links: [{ label: "Code", url: "https://github.com/rheask8246/CSE251B-Final-Competition" }, { label: "Slides (PDF)", url: "files/nanogpt-slides.pdf" }]
    },
    {
      title: "Generative Audio & Automatic Music Transcription",
      date: "May 2026",
      stack: ["PyTorch", "Librosa"],
      categories: ["Generative", "Audio"],
      metric: "Best frame/note F1 vs. CRNN & CQT",
      viz: "spectrogram",
      image: "",
      post: "music",
      summary: "Transcribes raw audio waveforms into MIDI, and generates symbolic piano music with Transformers.",
      bullets: [
        "Developed an end-to-end neural transcription pipeline mapping raw acoustic waveforms to symbolic MIDI data by combining multi-scale spectrogram backbones with Transformer sequence models.",
        "Built a Transformer-based unconditioned symbolic music generation model that **outperformed CNN and LSTM baselines** in sequence coherence and musical structure preservation on the MAESTRO dataset.",
        "Developed a **Conformer-based** automatic music transcription architecture that outperformed CRNN and CQT baselines across key transcription metrics, achieving the best frame/note-level F1 scores and the lowest ghost-note and missed-note rates through joint convolutional and self-attention feature learning."
      ],
      links: [{ label: "Code", url: "https://github.com/rheask8246/CSE253-Assignment2" }]
    },
    {
      title: "Memory Architectures for Long-Horizon LLM Agents",
      date: "Mar 2026",
      stack: ["Agent Evaluation", "Memory Systems"],
      categories: ["LLMs & Agents"],
      metric: "Submitted to NeurIPS 2026",
      viz: "memory",
      image: "",
      summary: "A benchmark and evaluation framework for how semantic, working, procedural, and episodic memory shape long-horizon agent capabilities.",
      bullets: [
        "Developed a benchmark and evaluation framework for understanding how different memory mechanisms shape long-horizon LLM agent capabilities. **Submitted to NeurIPS 2026.**",
        "Implemented semantic, working, procedural, and episodic memory architectures, including graph-based world models, ReAct reasoning agents, VQ-VAE latent action models, and compressed memory retrieval systems.",
        "Proposed **hybrid memory agents** that integrate complementary cognitive capabilities and evaluated trade-offs between specialization, robustness, and computational efficiency.",
        "Characterized failure modes in autonomous agents, including memory degradation, repetitive action loops, retrieval errors, and limitations of single-memory architectures."
      ],
      links: [{ label: "Paper", url: "" }, { label: "Code", url: "" }]
    },
    {
      title: "Fair Resource Allocation in Settlers of Catan",
      date: "Mar 2026",
      stack: ["Python", "CVXPY", "Multi-Agent Systems"],
      categories: ["Optimization", "LLMs & Agents"],
      metric: "17,500 simulated games",
      viz: "catan",
      image: "",
      post: "convex-catan",
      summary: "A convex-optimization agent that makes Catan games more equitable, evaluated across 35 agent lineups.",
      bullets: [
        "Conceived and led the project, formulating a **convex optimization framework** for equitable resource allocation in Settlers of Catan through continuous relaxation, opponent-aware fairness constraints, and phase-adaptive production objectives.",
        "Designed and implemented a **quadratic-programming (QP) agent** from scratch, deriving the optimization formulation, constraints, and KKT conditions while integrating the policy into a custom multi-agent simulation framework built on the Catanatron engine.",
        "Engineered a reproducible evaluation pipeline spanning **35 agent lineups and 17,500 simulated games**, demonstrating reduced outcome inequality (lower Victory Point Gini coefficient) while characterizing trade-offs between fairness, resource diversity, computational cost, and competitive performance."
      ],
      links: [{ label: "Code", url: "https://github.com/rheask8246/CSE203B_ConvexCatan" }, { label: "Report", url: "" }]
    },
    {
      title: "Anime Recommendation System",
      date: "Dec 2025",
      stack: ["PyTorch", "BPR", "Python"],
      categories: ["RecSys"],
      metric: "0.95 validation AUC",
      viz: "embedding",
      image: "",                  // card header image (leave "" for the animation)
      post: "anime-recommendation", // full write-up in posts.js → card links to post.html
      summary: "A hybrid top-K recommender trained on 109M+ interactions from 310K users and 17K titles.",
      bullets: [
        "Designed a hybrid recommendation engine for personalized top-K anime retrieval by combining implicit **Bayesian Personalized Ranking (BPR)**, collaborative filtering, content-based metadata embeddings, and popularity-based cold-start fallbacks.",
        "Engineered a scalable data preprocessing pipeline for **109M+ user–anime interactions** across 310K users and 17K titles, including feature engineering, negative sampling, metadata encoding, and train/validation/test dataset construction.",
        "Evaluated ranking performance using Precision@K, Recall@K, Hit Rate@K, and AUC, achieving **0.95 validation AUC** and better personalized recommendations than popularity-based and item-based collaborative filtering baselines."
      ],
      links: [{ label: "Slides (PDF)", url: "files/anime-recommendation-slides.pdf" }, { label: "Code", url: "" }, { label: "Dataset", url: "https://www.kaggle.com/datasets/hernan4444/anime-recommendation-database-2020" }]
    },
    {
      title: "GNN Sensor Tasking for Space Domain Awareness",
      date: "Jun 2025",
      stack: ["PyTorch", "PyTorch Geometric", "PPO", "RL"],
      categories: ["Reinforcement Learning", "Space"],
      metric: "99% tracking coverage",
      viz: "orbits",
      image: "",
      post: "gambitnet",
      summary: "Graph neural network reinforcement learning that coordinates ground sensors to search for and track maneuvering satellites.",
      bullets: [
        "Developed a **graph neural network reinforcement learning** framework for autonomous sensor tasking, modeling ground sensors and orbital targets as graph nodes to optimize multi-sensor coordination in dynamic tracking environments.",
        "Designed a **PPO-based policy** with graph attention networks and recurrent memory to balance search and track objectives under limited sensor resources, enabling adaptive decision-making across varying target densities.",
        "Built a configurable orbital simulation environment and benchmarked the learned policy against heuristic scheduling baselines, achieving **99% target tracking coverage** and consistently meeting the <10-minute mission search constraint for maneuvering targets (**38% improvement** over heuristic baselines). Every non-learning baseline failed this real-time requirement in oversaturated scenarios."
      ],
      links: [{ label: "Slides (PDF)", url: "files/gambitnet-slides.pdf" }]
    },
    {
      title: "Physically-Based Renderer",
      date: "May 2023",
      stack: ["C++", "GLSL"],
      categories: ["Graphics"],
      metric: "Monte Carlo path tracer from scratch",
      viz: "raytrace",
      image: "",
      summary: "A complete graphics pipeline built from scratch: rasterizer, path tracer, mesh processing, and cloth simulation.",
      bullets: [
        "Implemented a complete graphics pipeline from scratch, including triangle rasterization, supersampling anti-aliasing, perspective-correct texture mapping, mipmapping, and hierarchical transformations.",
        "Developed a physically based **Monte Carlo path tracer** featuring ray-scene intersection, BVH acceleration structures, global illumination, importance sampling, microfacet BRDFs, environment lighting, and adaptive sampling.",
        "Built geometry processing and physics simulation systems, implementing half-edge mesh data structures, Bézier curves and surfaces, Loop subdivision, mesh editing operations, and real-time mass-spring cloth simulation with collision handling and GLSL shading."
      ],
      links: [{ label: "Write-up", url: "" }, { label: "Renders", url: "" }]
    }
  ],

  // date: "YYYY-MM" (used for sorting + "Upcoming" badges)
  // coords: [latitude, longitude] for the globe; null for virtual events.
  publications: [
    {
      venue: "NeurIPS AI4Science Workshop",
      location: "Sydney, Australia", coords: [-33.87, 151.21],
      date: "2026-12", type: "Poster", status: "Accepted",
      authors: "R. S. Kumar, F. Broekgaarden",
      title: "PLANT: Conditional Generative Models for Fast Gravitational-Wave Population Synthesis",
      links: [{ label: "Poster", url: "" }, { label: "Paper", url: "" }]
    },
    {
      venue: "NeurIPS Women in ML Workshop",
      location: "Atlanta, GA", coords: [33.75, -84.39],
      date: "2026-12", type: "Poster", status: "Accepted",
      authors: "R. S. Kumar, F. Broekgaarden",
      title: "PLANT: Conditional Generative Models for Fast Gravitational-Wave Population Synthesis",
      links: [{ label: "Poster", url: "" }]
    },
    {
      venue: "GalFRESCA",
      location: "Irvine, CA", coords: [33.68, -117.83],
      date: "2026-09", type: "Talk", status: "",
      authors: "R. S. Kumar, F. Broekgaarden",
      title: "PLANT: Conditional Generative Models for Fast Gravitational-Wave Population Synthesis",
      links: [{ label: "Slides", url: "" }]
    },
    {
      venue: "Ensenada–San Diego Astrophysical Society (ESDAS) Meeting",
      location: "Ensenada, Mexico", coords: [31.87, -116.6],
      date: "2026-09", type: "Talk", status: "Accepted",
      authors: "R. S. Kumar, F. Broekgaarden",
      title: "PLANT: Conditional Generative Models for Fast Gravitational-Wave Population Synthesis",
      links: [{ label: "Slides", url: "" }]
    },
    {
      venue: "Fast Machine Learning for Science Conference",
      location: "San Diego, CA", coords: [32.72, -117.16],
      date: "2026-08", type: "Poster", status: "",
      authors: "R. S. Kumar, F. Broekgaarden",
      title: "PLANT: Conditional Generative Models for Fast Gravitational-Wave Population Synthesis",
      links: [{ label: "Poster", url: "" }]
    },
    {
      venue: "IAIFI Summer Workshop",
      location: "Cambridge, MA", coords: [42.37, -71.11],
      date: "2026-08", type: "Talk", status: "",
      authors: "R. S. Kumar, F. Broekgaarden",
      title: "From Thousands of CPU-Hours to Seconds: Fast Generative Models for Gravitational-Wave Populations",
      links: [{ label: "Slides", url: "" }, { label: "Video", url: "" }]
    },
    {
      venue: "AstroAI Workshop",
      location: "Cambridge, MA", coords: [42.37, -71.11],
      date: "2026-06", type: "Poster", status: "",
      authors: "R. S. Kumar, F. Broekgaarden",
      title: "PLANT: Conditional Generative Models for Fast Gravitational-Wave Population Synthesis",
      links: [{ label: "Poster", url: "" }]
    },
    {
      venue: "IEEE High Performance Extreme Computing Conference (HPEC)",
      location: "Virtual", coords: null,
      date: "2024-09", type: "Poster", status: "",
      authors: "R. S. Kumar et al.",
      title: "Impact of Grid Processing on Signal Cross-Correlation",
      links: [{ label: "Paper", url: "" }]
    },
    {
      venue: "American Astronomical Society, 241st Meeting",
      location: "Seattle, WA", coords: [47.61, -122.33],
      date: "2023-01", type: "Presentation", status: "",
      authors: "H. Gulick et al.",
      title: "The Background and Transient Observer: A Gamma-Ray Detector System for Time-Domain Astrophysics",
      links: [{ label: "Abstract", url: "" }]
    },
    {
      venue: "IEEE NSS MIC RTSD Conference",
      location: "Milan, Italy", coords: [45.46, 9.19],
      date: "2022-11", type: "Talk", status: "",
      authors: "R. S. Kumar, Y. Ebrahimi, O. Salaben, A. Zoglauer",
      title: "Evaluation of Compton Event Reconstruction Approaches using Simulations, Lab Measurements, and Astrophysical Observations of COSI",
      links: [{ label: "Slides", url: "" }]
    },
    {
      venue: "BayLearn — Machine Learning Symposium",
      location: "San Francisco, CA", coords: [37.77, -122.42],
      date: "2022-10", type: "Poster", status: "",
      authors: "Y. Ebrahimi, O. Salaben, R. S. Kumar, A. Zoglauer",
      title: "Physics-based Validation of Machine-learning Approaches for the COSI Space Mission",
      links: [{ label: "Poster", url: "" }]
    },
    {
      venue: "American Astronomical Society, 237th Meeting",
      location: "Virtual", coords: null,
      date: "2021-01", type: "Poster", status: "",
      authors: "A. Zoglauer et al.",
      title: "Enhancing the Event Reconstruction Pipeline of Future Compton-scattering and Pair-creation Telescopes with Deep Learning",
      links: [{ label: "Abstract", url: "" }]
    }
  ],

  // Use either image (a photo) or viz (an animated header) for each card.
  leadership: [
    {
      org: "MIT BeaverWorks Summer Institute",
      program: "Forge AI Challenge",
      role: "Instructor & Program Lead",
      dates: "Mar 2026 — Present",
      image: "",
      viz: "network",
      bullets: [
        "Founded a national online program teaching high school students modern generative AI engineering, scaling, and safety principles.",
        "Designed an interactive curriculum from scratch covering Transformer mechanics, foundational LLM training loops, Retrieval-Augmented Generation (RAG), multi-agent orchestration, and AI safety/alignment.",
        "Direct technical course deployment and project infrastructure, and manage collaborations with MIT faculty and industry researchers."
      ],
      links: [{ label: "Program website", url: "https://bwsi-forge-ai-challenge.github.io/index.html" }, { label: "Curriculum", url: "" }]
    },
    {
      org: "MIT BeaverWorks Summer Institute",
      program: "Build a CubeSat Challenge",
      role: "Instructor & Program Lead",
      dates: "Feb 2024 — Present",
      image: "images/sourced/cubesat-deploy.jpg",
      imageAlt: "CubeSats deployed from the International Space Station",
      bullets: [
        "Lead a national engineering program mentoring student teams through full-lifecycle spacecraft development and edge-computing payloads.",
        "Designed a software curriculum on flight software deployment, embedded environments, and low-latency real-time computer vision pipelines on resource-constrained Raspberry Pi hardware.",
        "Coordinate a nationwide team of instructional staff and industry collaborators from NASA, MIT Lincoln Laboratory, and aerospace research groups."
      ],
      links: [{ label: "Program website", url: "" }, { label: "Student showcase", url: "" }]
    },
    {
      org: "UC Berkeley DeCal Program",
      program: "Studio Ghibli DeCal",
      role: "Course Creator & Facilitator",
      dates: "Sep 2022 — May 2023",
      image: "",
      imageAlt: "",
      bullets: [
        "Created and taught a student-led course in Spring 2023 on the sociopolitical context and art history of Studio Ghibli films, with screenings."
      ],
      links: [{ label: "Syllabus", url: "" }]
    },
    {
      org: "UC Berkeley New Student Services",
      program: "Orientation",
      role: "Orientation Mentor & Leader",
      dates: "Mar 2020 — Aug 2022",
      image: "",
      imageAlt: "",
      bullets: [
        "Oversaw training of orientation group leaders in leadership methods, conflict management, collaboration, and networking.",
        "Managed orientation events for NSS and facilitated discussions on diversity, inclusion, and safety at UC Berkeley."
      ],
      links: []
    }
  ],

  honors: [
    { year: "2025", title: "AIAA New England Section Leadership Award", date: "June 2025" },
    { year: "2024", title: "MIT Advanced Study Program Fellow", date: "September 2024" },
    { year: "2023", title: "Berkeley Undergraduate Research Apprenticeship Program Summer Fellow", date: "April 2023" },
    { year: "2019", title: "National Merit Scholarship", date: "May 2019" },
    { year: "UCB", title: "Dean's List — College of Letters & Science, UC Berkeley", date: "" }
  ],

  memberships: [
    { name: "MIT Lincoln Laboratory Pan Asian Laboratory Staff Network", years: "2023–2025" },
    { name: "Undergraduate Astronomy Society, Berkeley", years: "2019–2023" },
    { name: "UC Berkeley Society of Physics Students", years: "2019–2023" }
  ],

  skills: [
    {
      group: "Languages",
      items: ["Python", "C++", "C", "Java", "JavaScript", "Go", "SQL", "HTML", "MATLAB", "Scheme"]
    },
    {
      group: "Machine Learning",
      items: [
        "PyTorch", "TensorFlow", "Keras", "Neural Network Training & Architecture Design",
        "Conditional Flow Matching", "Diffusion Models", "Large Language Models",
        "Transformers (GQA / RoPE)", "Reinforcement Learning (PPO)", "Graph Neural Networks",
        "Computer Vision", "Probabilistic Modeling", "Model Context Protocol (MCP)",
        "Agentic Guardrails", "Multimodal AI Systems"
      ]
    },
    {
      group: "Tools & Systems",
      items: [
        "Distributed Computing", "Git", "Linux", "Raspberry Pi", "Shell Scripting", "PyQt",
        "Geant4", "ROOT", "TMVA", "Data Visualization", "GUI Development", "LaTeX",
        "AutoCAD", "Technical Briefing"
      ]
    },
    {
      group: "Laboratory",
      items: [
        "Systems Integration", "Instrumentation / Payload Testing & Calibration",
        "Mechanical Assembly", "Pipeline Development", "Optical Telescope Operation",
        "Infrared Telescope Operation", "Radiation Material Handling",
        "Thermal / Vacuum Chamber Usage", "Instrument Commissioning",
        "Analog & Digital Electronics", "Circuit Fabrication & Testing"
      ]
    }
  ],

  // Media gallery. type: "image" | "video" (YouTube/Vimeo embed URL) | "pdf" | "link"
  // Leave src "" to keep an empty slot visible.
  gallery: [
    { type: "image", src: "", caption: "Poster — NeurIPS AI4Science 2026" },
    { type: "video", src: "", caption: "Talk — IAIFI Summer Workshop 2026" },
    { type: "image", src: "", caption: "Build a CubeSat Challenge — student teams" },
    { type: "pdf", src: "", caption: "Slides — GalFRESCA 2026" },
    { type: "image", src: "", caption: "COSI / GAPS lab work at Berkeley SSL" }
  ],

  // Links to your other websites / profiles.
  elsewhere: [
    { label: "GitHub", note: "Code & projects", url: "https://github.com/rheask8246" },
    { label: "LinkedIn", note: "Professional profile", url: "https://www.linkedin.com/in/rhea-senthil-kumar-338593188" },
    { label: "Google Scholar", note: "Publications", url: "" },
    { label: "Forge AI Challenge", note: "Course website", url: "https://bwsi-forge-ai-challenge.github.io/index.html" },
    { label: "Build a CubeSat Challenge", note: "Program website", url: "" },
    { label: "Art portfolio", note: "Drawings & paintings", url: "" }
  ],

  hobbies: [
    {
      title: "Growing Plants",
      image: "",
      text: "I love nurturing indoor and outdoor plants, from propagation and repotting to watching new growth come in. Gardening is a slow, grounding counterbalance to fast-paced technical work."
    },
    {
      title: "Making Art",
      image: "",
      text: "I make art across different media: drawing, painting, and experimenting with visual ideas. Making things by hand keeps my creativity flowing outside of engineering and research."
    }
  ],

  credits: [
    { what: "Merging binary black holes", who: "NASA/Ames Research Center/C. Henze", license: "Public domain", url: "https://commons.wikimedia.org/wiki/File:MergingBinaryBlackHoles.jpg" },
    { what: "Real-time spectrum analyzer", who: "Soulera", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:A_modern_real_time_spectrum_analyzer.jpg" },
    { what: "Millstone tracking radar", who: "Daderot", license: "CC0", url: "https://commons.wikimedia.org/wiki/File:Millstone_Long_Range_Tracking_Radar_-_Haystack_Observatory_-_DSC04043.JPG" },
    { what: "Thermal vacuum Chamber A", who: "NASA Johnson Space Center", license: "Public domain", url: "https://commons.wikimedia.org/wiki/File:Thermal_Vacuum_Test_Chamber_A_with_Door_Open.jpg" },
    { what: "COSI rendering", who: "UC Berkeley / NASA", license: "Public domain", url: "https://commons.wikimedia.org/wiki/File:COSI_higher_quality.jpg" },
    { what: "Fermi gamma-ray sky", who: "NASA/DOE/Fermi LAT Collaboration", license: "CC BY 4.0", url: "https://commons.wikimedia.org/wiki/File:Fermi_Gamma_Ray_All_Sky_(AllSky-16_Gamma1-2000GeV-Fermi-cmap_car_60m_gt1000).jpg" },
    { what: "CubeSat deployment", who: "NASA", license: "Public domain", url: "https://commons.wikimedia.org/wiki/File:ISS-38_NanoRacks_CubeSat_Deployment_Iss038e046579.jpg" },
    { what: "Geisel Library", who: "belisario (Flickr)", license: "CC BY-SA 2.0", url: "https://commons.wikimedia.org/wiki/File:Geisel_Library,_UCSD.jpg" },
    { what: "Sather Tower", who: "Pollito310", license: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Sather_Tower_(Campanile).jpg" }
  ]
};
