import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

import { scoreResumeAgainstRequirements } from "../lib/ai-scoring";

const prisma = new PrismaClient();

async function main() {
  // ── Passwords ──────────────────────────────────────────────────────────────
  const adminPassword     = await bcrypt.hash("Admin@123",     12);
  const recruiterPassword = await bcrypt.hash("Recruit@123",   12);
  const applicantPassword = await bcrypt.hash("Applicant@123", 12);

  // ── Staff accounts ─────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where:  { email: "admin@devspark.com" },
    update: { role: Role.ADMIN, passwordHash: adminPassword },
    create: {
      name: "DevSpark Admin",
      email: "admin@devspark.com",
      role: Role.ADMIN,
      passwordHash: adminPassword,
      profile: { create: { headline: "Operations lead" } },
    },
  });

  const recruiter = await prisma.user.upsert({
    where:  { email: "recruiter@devspark.com" },
    update: { role: Role.RECRUITER, passwordHash: recruiterPassword },
    create: {
      name: "Talent Recruiter",
      email: "recruiter@devspark.com",
      role: Role.RECRUITER,
      passwordHash: recruiterPassword,
      profile: { create: { headline: "Technical recruiter" } },
    },
  });

  // ── 20 Applicants ──────────────────────────────────────────────────────────
  const applicantsData = [
    {
      name: "Nadia Rahman",
      email: "applicant@example.com",
      profile: {
        headline: "Full Stack Developer",
        summary: "Motivated developer with project experience in full stack applications and quality-driven engineering.",
        skills: "Next.js, TypeScript, Prisma, PostgreSQL, Node.js, Testing",
        experience: "Built an e-commerce app with Next.js and Stripe; Developed role-based dashboard for recruitment workflow",
        education: "BSc in Computer Science, University Project Work",
        projects: "Smart Recruitment System, Campus Event Management Portal",
        certifications: "React Developer Certificate",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000001",
      },
      resume: "Nadia Rahman\nFull Stack Developer\nSkills: Next.js, TypeScript, Prisma, Testing\nExperience: Built recruitment dashboard and API services with role-based access\nEducation: BSc in Computer Science",
    },
    {
      name: "Arif Hossain",
      email: "arif.hossain@example.com",
      profile: {
        headline: "Backend Engineer",
        summary: "Node.js and Python backend engineer with strong API design skills.",
        skills: "Node.js, Express, Python, Django, PostgreSQL, Redis, Docker",
        experience: "3 years at a fintech startup building payment microservices",
        education: "BSc Computer Science, BUET",
        projects: "Payment Gateway Integration, Inventory Management API",
        certifications: "AWS Certified Developer",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000002",
      },
      resume: "Arif Hossain\nBackend Engineer\nSkills: Node.js, Express, Python, PostgreSQL, Docker\nExperience: 3 years fintech microservices development\nEducation: BSc Computer Science BUET",
    },
    {
      name: "Sadia Islam",
      email: "sadia.islam@example.com",
      profile: {
        headline: "Frontend Developer",
        summary: "React specialist focused on accessible and performant UIs.",
        skills: "React, Next.js, TypeScript, Tailwind CSS, Figma, Jest",
        experience: "2 years building SaaS dashboards; contributed to open-source UI library",
        education: "BSc Software Engineering, BRACU",
        projects: "Design System Library, Analytics Dashboard",
        certifications: "Meta Frontend Developer Certificate",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000003",
      },
      resume: "Sadia Islam\nFrontend Developer\nSkills: React, Next.js, TypeScript, Tailwind CSS, Jest\nExperience: 2 years SaaS dashboard development\nEducation: BSc Software Engineering BRACU",
    },
    {
      name: "Tahmid Karim",
      email: "tahmid.karim@example.com",
      profile: {
        headline: "DevOps Engineer",
        summary: "Cloud and CI/CD specialist with hands-on Kubernetes and AWS experience.",
        skills: "AWS, Kubernetes, Docker, Terraform, GitHub Actions, Linux, Bash",
        experience: "4 years managing cloud infrastructure for e-commerce platforms",
        education: "BSc Computer Science, NSU",
        projects: "Zero-downtime Deployment Pipeline, Multi-region Kubernetes Cluster",
        certifications: "AWS Solutions Architect Associate, CKA",
        location: "Chittagong, Bangladesh",
        phone: "+8801711000004",
      },
      resume: "Tahmid Karim\nDevOps Engineer\nSkills: AWS, Kubernetes, Docker, Terraform, CI/CD\nExperience: 4 years cloud infrastructure management\nEducation: BSc Computer Science NSU",
    },
    {
      name: "Farhan Alam",
      email: "farhan.alam@example.com",
      profile: {
        headline: "Data Scientist",
        summary: "ML practitioner with experience in NLP and time-series forecasting.",
        skills: "Python, TensorFlow, PyTorch, scikit-learn, SQL, Pandas, Spark",
        experience: "2 years building recommendation engines and churn prediction models",
        education: "MSc Data Science, DU",
        projects: "Customer Churn Predictor, Product Recommendation Engine",
        certifications: "Google Professional Data Engineer",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000005",
      },
      resume: "Farhan Alam\nData Scientist\nSkills: Python, TensorFlow, PyTorch, scikit-learn, SQL\nExperience: 2 years ML model development recommendation systems\nEducation: MSc Data Science DU",
    },
    {
      name: "Mitu Begum",
      email: "mitu.begum@example.com",
      profile: {
        headline: "QA Engineer",
        summary: "Detail-oriented QA engineer experienced in manual and automation testing.",
        skills: "Selenium, Playwright, Cypress, Postman, JIRA, TestRail, Python",
        experience: "3 years QA at a software house; led regression test suite migration to Playwright",
        education: "BSc CSE, IUT",
        projects: "Automated Regression Suite, API Contract Testing Framework",
        certifications: "ISTQB Foundation",
        location: "Rajshahi, Bangladesh",
        phone: "+8801711000006",
      },
      resume: "Mitu Begum\nQA Engineer\nSkills: Selenium, Playwright, Cypress, Postman, API testing\nExperience: 3 years automation and manual testing\nEducation: BSc CSE IUT",
    },
    {
      name: "Rahim Uddin",
      email: "rahim.uddin@example.com",
      profile: {
        headline: "Android Developer",
        summary: "Kotlin-first Android developer with Play Store publishing experience.",
        skills: "Kotlin, Jetpack Compose, Android SDK, Retrofit, Room, Firebase",
        experience: "2 years building consumer Android apps; published 3 apps on Play Store",
        education: "BSc CSE, RUET",
        projects: "Ride-sharing Companion App, Personal Finance Tracker",
        certifications: "Associate Android Developer",
        location: "Khulna, Bangladesh",
        phone: "+8801711000007",
      },
      resume: "Rahim Uddin\nAndroid Developer\nSkills: Kotlin, Jetpack Compose, Retrofit, Firebase\nExperience: 2 years Android app development Play Store\nEducation: BSc CSE RUET",
    },
    {
      name: "Puja Chakraborty",
      email: "puja.chakraborty@example.com",
      profile: {
        headline: "UI/UX Designer",
        summary: "User-centered designer bridging design and development with Figma expertise.",
        skills: "Figma, Adobe XD, Sketch, Prototyping, User Research, HTML, CSS",
        experience: "3 years designing B2B SaaS products; conducted 50+ user interviews",
        education: "BFA Design, DU",
        projects: "Redesigned onboarding flow reducing drop-off by 30%, Design System v2",
        certifications: "Google UX Design Certificate",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000008",
      },
      resume: "Puja Chakraborty\nUI/UX Designer\nSkills: Figma, Adobe XD, Prototyping, User Research, HTML, CSS\nExperience: 3 years B2B SaaS product design\nEducation: BFA Design DU",
    },
    {
      name: "Mahmudul Hasan",
      email: "mahmudul.hasan@example.com",
      profile: {
        headline: "Cybersecurity Analyst",
        summary: "Security-focused engineer with penetration testing and SIEM experience.",
        skills: "Penetration Testing, Burp Suite, Wireshark, SIEM, Linux, Python, Nmap",
        experience: "2 years security analyst at a bank; performed quarterly vulnerability assessments",
        education: "BSc CSE, CUET",
        projects: "Internal Vulnerability Scanner, Phishing Simulation Platform",
        certifications: "CompTIA Security+, CEH",
        location: "Chittagong, Bangladesh",
        phone: "+8801711000009",
      },
      resume: "Mahmudul Hasan\nCybersecurity Analyst\nSkills: Penetration Testing, Burp Suite, Wireshark, SIEM, Python\nExperience: 2 years bank security analyst\nEducation: BSc CSE CUET",
    },
    {
      name: "Sharmin Akter",
      email: "sharmin.akter@example.com",
      profile: {
        headline: "Product Manager",
        summary: "Data-driven PM with a background in software engineering.",
        skills: "Product Strategy, Roadmapping, SQL, Agile, JIRA, User Stories, Figma",
        experience: "4 years PM at a SaaS company; launched 3 major product lines",
        education: "MBA, IBA DU; BSc CSE, BUET",
        projects: "Launched Subscription Billing Module, Led Mobile App Revamp",
        certifications: "Pragmatic Marketing Certified",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000010",
      },
      resume: "Sharmin Akter\nProduct Manager\nSkills: Product Strategy, Roadmapping, SQL, Agile, JIRA\nExperience: 4 years SaaS product management\nEducation: MBA IBA DU, BSc CSE BUET",
    },
    {
      name: "Rakibul Islam",
      email: "rakibul.islam@example.com",
      profile: {
        headline: "Machine Learning Engineer",
        summary: "ML engineer specializing in model deployment and MLOps pipelines.",
        skills: "Python, MLflow, FastAPI, Docker, AWS SageMaker, PyTorch, SQL",
        experience: "3 years at an AI startup; built end-to-end ML pipelines for NLP tasks",
        education: "MSc Computer Science, BUET",
        projects: "Sentiment Analysis API, Document Classification Pipeline",
        certifications: "AWS ML Specialty",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000011",
      },
      resume: "Rakibul Islam\nMachine Learning Engineer\nSkills: Python, MLflow, FastAPI, Docker, PyTorch, AWS SageMaker\nExperience: 3 years AI startup MLOps and NLP pipelines\nEducation: MSc Computer Science BUET",
    },
    {
      name: "Nasrin Sultana",
      email: "nasrin.sultana@example.com",
      profile: {
        headline: "Technical Writer",
        summary: "Technical writer specializing in API docs and developer-facing content.",
        skills: "Technical Writing, Markdown, OpenAPI, Confluence, JIRA, Git, REST APIs",
        experience: "3 years writing API references and developer guides for SaaS platforms",
        education: "BA English, DU",
        projects: "Developer Portal Redesign, SDK Documentation Suite",
        certifications: "Google Technical Writing Certificate",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000012",
      },
      resume: "Nasrin Sultana\nTechnical Writer\nSkills: Technical Writing, Markdown, OpenAPI, REST APIs, Git\nExperience: 3 years API docs and developer guides\nEducation: BA English DU",
    },
    {
      name: "Tanvir Ahmed",
      email: "tanvir.ahmed@example.com",
      profile: {
        headline: "iOS Developer",
        summary: "Swift developer with 4 App Store apps and SwiftUI expertise.",
        skills: "Swift, SwiftUI, UIKit, Core Data, Firebase, Xcode, REST APIs",
        experience: "3 years iOS development; apps across health, productivity, and finance verticals",
        education: "BSc CSE, NSU",
        projects: "Habit Tracker App (10k+ downloads), Budget Planner App",
        certifications: "Apple Developer Academy Graduate",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000013",
      },
      resume: "Tanvir Ahmed\niOS Developer\nSkills: Swift, SwiftUI, UIKit, Core Data, Firebase\nExperience: 3 years iOS App Store development\nEducation: BSc CSE NSU",
    },
    {
      name: "Lamia Chowdhury",
      email: "lamia.chowdhury@example.com",
      profile: {
        headline: "Database Administrator",
        summary: "DBA with expertise in PostgreSQL, MySQL, and cloud-managed databases.",
        skills: "PostgreSQL, MySQL, MongoDB, Redis, AWS RDS, Query Optimization, Bash",
        experience: "5 years DBA; managed databases for 10M+ row production systems",
        education: "BSc Information Systems, BRACU",
        projects: "Database Sharding Implementation, Automated Backup & Recovery System",
        certifications: "Oracle Database Administrator Certified Professional",
        location: "Sylhet, Bangladesh",
        phone: "+8801711000014",
      },
      resume: "Lamia Chowdhury\nDatabase Administrator\nSkills: PostgreSQL, MySQL, MongoDB, Redis, AWS RDS, Query Optimization\nExperience: 5 years managing large-scale production databases\nEducation: BSc Information Systems BRACU",
    },
    {
      name: "Sabbir Hossain",
      email: "sabbir.hossain@example.com",
      profile: {
        headline: "Blockchain Developer",
        summary: "Solidity and Web3 developer with DeFi protocol experience.",
        skills: "Solidity, Ethereum, Hardhat, Web3.js, TypeScript, IPFS, Smart Contracts",
        experience: "2 years building DeFi protocols and NFT marketplaces",
        education: "BSc CSE, CUET",
        projects: "Decentralized Exchange (DEX), NFT Auction Platform",
        certifications: "Ethereum Developer Bootcamp Graduate",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000015",
      },
      resume: "Sabbir Hossain\nBlockchain Developer\nSkills: Solidity, Ethereum, Hardhat, Web3.js, TypeScript, IPFS\nExperience: 2 years DeFi and NFT smart contract development\nEducation: BSc CSE CUET",
    },
    {
      name: "Jannatul Ferdous",
      email: "jannatul.ferdous@example.com",
      profile: {
        headline: "Data Analyst",
        summary: "BI analyst turning raw data into executive-ready dashboards.",
        skills: "SQL, Power BI, Tableau, Excel, Python, Google Analytics, dbt",
        experience: "3 years data analyst at a retail company; built KPI dashboards for C-suite",
        education: "BSc Statistics, DU",
        projects: "Sales KPI Dashboard, Customer Segmentation Analysis",
        certifications: "Microsoft Power BI Data Analyst",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000016",
      },
      resume: "Jannatul Ferdous\nData Analyst\nSkills: SQL, Power BI, Tableau, Python, dbt, Google Analytics\nExperience: 3 years retail BI and KPI dashboards\nEducation: BSc Statistics DU",
    },
    {
      name: "Miraz Hossain",
      email: "miraz.hossain@example.com",
      profile: {
        headline: "Cloud Architect",
        summary: "Multi-cloud architect designing resilient and cost-optimized infrastructures.",
        skills: "AWS, GCP, Azure, Terraform, Kubernetes, Networking, Cost Optimization",
        experience: "6 years cloud architecture; reduced cloud spend 35% through FinOps practices",
        education: "BSc EEE, BUET",
        projects: "Multi-region Active-Active Architecture, FinOps Cost Dashboard",
        certifications: "AWS Solutions Architect Professional, GCP Professional Cloud Architect",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000017",
      },
      resume: "Miraz Hossain\nCloud Architect\nSkills: AWS, GCP, Azure, Terraform, Kubernetes, Networking\nExperience: 6 years multi-cloud architecture and FinOps\nEducation: BSc EEE BUET",
    },
    {
      name: "Sumaiya Khanam",
      email: "sumaiya.khanam@example.com",
      profile: {
        headline: "Scrum Master / Agile Coach",
        summary: "Certified Scrum Master helping engineering teams deliver iteratively.",
        skills: "Scrum, Kanban, JIRA, Confluence, Agile Coaching, Retrospectives, SAFe",
        experience: "4 years Scrum Master across 3 software companies; scaled Agile for 50-person org",
        education: "BSc Business IT, BRACU",
        projects: "Agile Transformation Program, Sprint Velocity Improvement Initiative",
        certifications: "CSM, SAFe Agilist",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000018",
      },
      resume: "Sumaiya Khanam\nScrum Master\nSkills: Scrum, Kanban, JIRA, Agile Coaching, SAFe, Retrospectives\nExperience: 4 years Scrum Master and Agile transformation\nEducation: BSc Business IT BRACU",
    },
    {
      name: "Nazmul Haque",
      email: "nazmul.haque@example.com",
      profile: {
        headline: "Embedded Systems Engineer",
        summary: "Firmware engineer with IoT and RTOS experience.",
        skills: "C, C++, FreeRTOS, Arduino, STM32, MQTT, Embedded Linux, PCB Design",
        experience: "3 years at an IoT startup; shipped firmware for industrial sensor devices",
        education: "BSc EEE, KUET",
        projects: "Industrial IoT Gateway Firmware, RTOS-based Motor Controller",
        certifications: "ARM Cortex-M Embedded Programming",
        location: "Khulna, Bangladesh",
        phone: "+8801711000019",
      },
      resume: "Nazmul Haque\nEmbedded Systems Engineer\nSkills: C, C++, FreeRTOS, STM32, MQTT, Embedded Linux\nExperience: 3 years IoT firmware development\nEducation: BSc EEE KUET",
    },
    {
      name: "Fatema Tuz Zohura",
      email: "fatema.zohura@example.com",
      profile: {
        headline: "Technical Support Engineer",
        summary: "Customer-facing support engineer skilled at diagnosing complex software issues.",
        skills: "Linux, SQL, REST APIs, JIRA, Zendesk, Python scripting, Networking",
        experience: "2 years L2 technical support at a cloud SaaS company",
        education: "BSc CSE, DIU",
        projects: "Internal Diagnostic Tool, Knowledge Base Redesign",
        certifications: "ITIL Foundation",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000020",
      },
      resume: "Fatema Tuz Zohura\nTechnical Support Engineer\nSkills: Linux, SQL, REST APIs, Python, JIRA, Zendesk\nExperience: 2 years L2 cloud SaaS technical support\nEducation: BSc CSE DIU",
    },
    {
      name: "Imran Khan",
      email: "imran.khan@example.com",
      profile: {
        headline: "Game Developer",
        summary: "Unity developer specializing in mobile and casual game mechanics.",
        skills: "Unity, C#, Blender, Shader Graph, Firebase, Ad Networks, Game Design",
        experience: "3 years indie and studio game development; 2 published mobile titles",
        education: "BSc CSE, NSU",
        projects: "Endless Runner Mobile Game (50k downloads), Puzzle RPG Prototype",
        certifications: "Unity Certified Associate",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000021",
      },
      resume: "Imran Khan\nGame Developer\nSkills: Unity, C#, Blender, Shader Graph, Firebase, Game Design\nExperience: 3 years mobile game development\nEducation: BSc CSE NSU",
    },
    {
      name: "Rezwana Parvin",
      email: "rezwana.parvin@example.com",
      profile: {
        headline: "HR Technology Specialist",
        summary: "HRIS specialist bridging HR and tech for workforce analytics and automation.",
        skills: "HRIS, SQL, Python, Power BI, Workday, BambooHR, Excel, Process Automation",
        experience: "4 years implementing and managing HRIS platforms for mid-size companies",
        education: "MBA HRM, IBA DU",
        projects: "HRIS Migration Project, HR Analytics Dashboard",
        certifications: "Workday HCM Certified",
        location: "Dhaka, Bangladesh",
        phone: "+8801711000022",
      },
      resume: "Rezwana Parvin\nHR Technology Specialist\nSkills: HRIS, SQL, Python, Power BI, Workday, BambooHR\nExperience: 4 years HRIS implementation and HR analytics\nEducation: MBA HRM IBA DU",
    },
  ];

  // Upsert all applicants
  const applicants = await Promise.all(
    applicantsData.map(({ name, email, profile }) =>
      prisma.user.upsert({
        where: { email },
        update: { role: Role.APPLICANT, passwordHash: applicantPassword },
        create: {
          name,
          email,
          role: Role.APPLICANT,
          passwordHash: applicantPassword,
          profile: { create: profile },
        },
      })
    )
  );

  // ── 15 Job Postings ────────────────────────────────────────────────────────
  const jobsData = [
    {
      title: "Web Developer",
      department: "Engineering",
      location: "Dhaka (Hybrid)",
      employmentType: "Full-time",
      description: "Develop and maintain modern web applications using React and Next.js with strong focus on performance and UX.",
      requirements: "Next.js TypeScript React Prisma API integration testing communication teamwork",
      responsibilities: "Deliver features, write clean code, collaborate with product and QA teams",
      minExperience: 1,
      postedById: recruiter.id,
    },
    {
      title: "SQA Engineer",
      department: "Quality Engineering",
      location: "Remote",
      employmentType: "Full-time",
      description: "Ensure product quality through test design, automation, and defect tracking.",
      requirements: "Testing automation selenium playwright api testing bug reporting communication",
      responsibilities: "Plan test cases, execute test suites, work with developers",
      minExperience: 1,
      postedById: admin.id,
    },
    {
      title: "Backend Engineer",
      department: "Engineering",
      location: "Dhaka (On-site)",
      employmentType: "Full-time",
      description: "Build scalable APIs and microservices using Node.js and Python.",
      requirements: "Node.js Express Python PostgreSQL REST API Docker Redis microservices",
      responsibilities: "Design and implement backend services, optimize database queries, write unit tests",
      minExperience: 2,
      postedById: recruiter.id,
    },
    {
      title: "DevOps Engineer",
      department: "Infrastructure",
      location: "Remote",
      employmentType: "Full-time",
      description: "Own our CI/CD pipelines and cloud infrastructure on AWS.",
      requirements: "AWS Kubernetes Docker Terraform GitHub Actions Linux CI/CD monitoring",
      responsibilities: "Maintain deployment pipelines, manage Kubernetes clusters, on-call rotation",
      minExperience: 2,
      postedById: admin.id,
    },
    {
      title: "Data Scientist",
      department: "AI & Analytics",
      location: "Dhaka (Hybrid)",
      employmentType: "Full-time",
      description: "Build ML models to improve recommendation and personalization systems.",
      requirements: "Python TensorFlow PyTorch scikit-learn SQL Pandas statistics machine learning NLP",
      responsibilities: "Train and evaluate ML models, deploy models to production, collaborate with product",
      minExperience: 2,
      postedById: recruiter.id,
    },
    {
      title: "Frontend Developer",
      department: "Engineering",
      location: "Remote",
      employmentType: "Full-time",
      description: "Craft beautiful, accessible, performant UIs using React and Tailwind CSS.",
      requirements: "React TypeScript Tailwind CSS Next.js Jest accessibility performance optimization",
      responsibilities: "Implement UI components, write tests, optimize Core Web Vitals",
      minExperience: 1,
      postedById: recruiter.id,
    },
    {
      title: "Android Developer",
      department: "Mobile",
      location: "Dhaka (Hybrid)",
      employmentType: "Full-time",
      description: "Build and maintain our Android application used by 100k+ users.",
      requirements: "Kotlin Jetpack Compose Android SDK Retrofit Room Firebase Google Play",
      responsibilities: "Develop new features, fix bugs, publish releases to Play Store",
      minExperience: 2,
      postedById: admin.id,
    },
    {
      title: "iOS Developer",
      department: "Mobile",
      location: "Remote",
      employmentType: "Full-time",
      description: "Develop Swift-based iOS features for our consumer app.",
      requirements: "Swift SwiftUI UIKit Core Data Firebase REST API Xcode App Store",
      responsibilities: "Build new screens, integrate APIs, submit App Store releases",
      minExperience: 2,
      postedById: recruiter.id,
    },
    {
      title: "UI/UX Designer",
      department: "Design",
      location: "Dhaka (On-site)",
      employmentType: "Full-time",
      description: "Lead design for web and mobile products from research to high-fidelity prototypes.",
      requirements: "Figma Adobe XD prototyping user research design systems accessibility HTML CSS",
      responsibilities: "Conduct user research, create wireframes and prototypes, maintain design system",
      minExperience: 2,
      postedById: recruiter.id,
    },
    {
      title: "Cybersecurity Analyst",
      department: "Security",
      location: "Dhaka (On-site)",
      employmentType: "Full-time",
      description: "Protect company assets through proactive threat detection and penetration testing.",
      requirements: "Penetration testing Burp Suite Wireshark SIEM Linux Python vulnerability assessment",
      responsibilities: "Conduct security assessments, monitor SIEM alerts, prepare security reports",
      minExperience: 2,
      postedById: admin.id,
    },
    {
      title: "Machine Learning Engineer",
      department: "AI & Analytics",
      location: "Remote",
      employmentType: "Full-time",
      description: "Deploy ML models into production and maintain MLOps infrastructure.",
      requirements: "Python MLflow FastAPI Docker AWS SageMaker PyTorch MLOps pipeline monitoring",
      responsibilities: "Build ML pipelines, monitor model drift, optimize inference latency",
      minExperience: 2,
      postedById: recruiter.id,
    },
    {
      title: "Cloud Architect",
      department: "Infrastructure",
      location: "Remote",
      employmentType: "Contract",
      description: "Design and govern multi-cloud architecture strategy for the organization.",
      requirements: "AWS GCP Azure Terraform Kubernetes networking cost optimization FinOps security",
      responsibilities: "Define cloud standards, review architectures, drive FinOps initiatives",
      minExperience: 5,
      postedById: admin.id,
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "Dhaka (On-site)",
      employmentType: "Full-time",
      description: "Own the product roadmap for our B2B recruitment platform.",
      requirements: "Product strategy roadmapping SQL Agile JIRA user stories stakeholder management",
      responsibilities: "Define product vision, prioritize backlog, work with engineering and design",
      minExperience: 3,
      postedById: recruiter.id,
    },
    {
      title: "Database Administrator",
      department: "Engineering",
      location: "Dhaka (Hybrid)",
      employmentType: "Full-time",
      description: "Own database performance, reliability, and scaling strategy.",
      requirements: "PostgreSQL MySQL MongoDB Redis AWS RDS query optimization backup replication",
      responsibilities: "Tune queries, manage backups, support engineers with schema design",
      minExperience: 3,
      postedById: admin.id,
    },
    {
      title: "Technical Writer",
      department: "Developer Relations",
      location: "Remote",
      employmentType: "Part-time",
      description: "Write clear, accurate API docs and developer guides for our platform.",
      requirements: "Technical writing Markdown OpenAPI REST API Git Confluence JIRA communication",
      responsibilities: "Maintain API reference docs, write tutorials, collaborate with engineering",
      minExperience: 1,
      postedById: recruiter.id,
    },
  ];

  const jobs = await Promise.all(
    jobsData.map((job) =>
      prisma.jobPosting.create({
        data: { ...job, status: "OPEN" },
      })
    )
  );

  // ── Applications ───────────────────────────────────────────────────────────
  // Map each applicant (by index) to the job indices they should apply for
  const applicationPlan: Array<{ applicantIdx: number; jobIndices: number[] }> = [
    { applicantIdx: 0,  jobIndices: [0, 5] },         // Nadia → Web Dev, Frontend
    { applicantIdx: 1,  jobIndices: [2, 13] },         // Arif → Backend, DBA
    { applicantIdx: 2,  jobIndices: [5, 0] },          // Sadia → Frontend, Web Dev
    { applicantIdx: 3,  jobIndices: [3, 11] },         // Tahmid → DevOps, Cloud Arch
    { applicantIdx: 4,  jobIndices: [4, 10] },         // Farhan → Data Sci, ML Eng
    { applicantIdx: 5,  jobIndices: [1] },             // Mitu → SQA
    { applicantIdx: 6,  jobIndices: [6] },             // Rahim → Android
    { applicantIdx: 7,  jobIndices: [8] },             // Puja → UI/UX
    { applicantIdx: 8,  jobIndices: [9] },             // Mahmudul → Cybersec
    { applicantIdx: 9,  jobIndices: [12] },            // Sharmin → PM
    { applicantIdx: 10, jobIndices: [10, 4] },         // Rakibul → ML Eng, Data Sci
    { applicantIdx: 11, jobIndices: [14] },            // Nasrin → Tech Writer
    { applicantIdx: 12, jobIndices: [7] },             // Tanvir → iOS
    { applicantIdx: 13, jobIndices: [13, 2] },         // Lamia → DBA, Backend
    { applicantIdx: 14, jobIndices: [0, 5] },          // Sabbir → Web Dev, Frontend
    { applicantIdx: 15, jobIndices: [4, 10] },         // Jannatul → Data Sci, ML
    { applicantIdx: 16, jobIndices: [3, 11] },         // Miraz → DevOps, Cloud Arch
    { applicantIdx: 17, jobIndices: [12, 1] },         // Sumaiya → PM, SQA
    { applicantIdx: 18, jobIndices: [3] },             // Nazmul → DevOps
    { applicantIdx: 19, jobIndices: [2, 9] },          // Fatema → Backend, Cybersec
    { applicantIdx: 20, jobIndices: [0] },             // Imran → Web Dev
    { applicantIdx: 21, jobIndices: [12, 14] },        // Rezwana → PM, Tech Writer
  ];

  for (const { applicantIdx, jobIndices } of applicationPlan) {
    const applicant = applicants[applicantIdx];
    const applicantInfo = applicantsData[applicantIdx];

    for (const jobIdx of jobIndices) {
      const job = jobs[jobIdx];
      const score = scoreResumeAgainstRequirements(applicantInfo.resume, job.requirements);

      await prisma.application.upsert({
        where: {
          jobId_applicantId: { jobId: job.id, applicantId: applicant.id },
        },
        update: {
          aiScore: score.score,
          aiReasoning: score.reasoning,
          resumeText: applicantInfo.resume,
          source: "BUILDER",
        },
        create: {
          jobId: job.id,
          applicantId: applicant.id,
          resumeText: applicantInfo.resume,
          source: "BUILDER",
          aiScore: score.score,
          aiReasoning: score.reasoning,
        },
      });
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalApplications = applicationPlan.reduce((sum, p) => sum + p.jobIndices.length, 0);

  console.log("✅ Database seeded successfully.");
  console.log("");
  console.log("── Staff accounts ──────────────────────────────────────");
  console.log("Admin:     admin@devspark.com     / Admin@123");
  console.log("Recruiter: recruiter@devspark.com / Recruit@123");
  console.log("");
  console.log("── Applicants ───────────────────────────────────────────");
  applicantsData.forEach((a) => console.log(`  ${a.name} <${a.email}> / Applicant@123`));
  console.log("");
  console.log("── Jobs created ─────────────────────────────────────────");
  jobsData.forEach((j, i) => console.log(`  ${i + 1}. ${j.title} (${j.department})`));
  console.log("");
  console.log(`── Totals ───────────────────────────────────────────────`);
  console.log(`  Jobs: ${jobs.length}`);
  console.log(`  Applicants: ${applicants.length}`);
  console.log(`  Applications: ${totalApplications}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });