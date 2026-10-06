export type Verdict = "MET" | "PARTIAL" | "NOT EVIDENCED";
export type RequirementType = "Skill" | "Eligibility";

export interface Requirement {
  id: string;
  name: string;
  type: RequirementType;
  verdict: Verdict;
  confidence: number;
  source?: string;
  evidence?: string;
  action?: string;
}

export const profile = {
  name: "Manvi Yadav",
  college: "North Valley Institute of Technology",
  degree: "B.Tech",
  branch: "Information Technology",
  graduationYear: "2027",
  cgpa: "7.9",
  backlogCount: "0",
  targetRole: "SDE Intern",
  skills: ["Java", "Python", "C++", "JavaScript", "React", "Node.js", "PostgreSQL", "Docker", "Git"],
  projects: ["Expense Sharing Application", "AI Resume Matching System", "EcoScan"],
  certifications: ["AWS Cloud Practitioner — in progress"],
  github: "github.com/manviyadav",
  linkedin: "linkedin.com/in/manvi-yadav",
};

export const eligibilityRules = [
  { label: "CGPA ≥ 7.0", value: "7.9", passed: true },
  { label: "Branch: IT / CS", value: "Information Technology", passed: true },
  { label: "Graduation year", value: "2027", passed: true },
  { label: "Backlogs", value: "0", passed: true },
];

export const requirements: Requirement[] = [
  { id: "react", name: "React", type: "Skill", verdict: "MET", confidence: 98, source: "Resume · Expense Sharing Application", evidence: "Developed a responsive expense-sharing application using React, TypeScript and Tailwind, with reusable components and accessible form flows." },
  { id: "javascript", name: "JavaScript", type: "Skill", verdict: "MET", confidence: 96, source: "Resume · Skills", evidence: "Built interactive client-side features with JavaScript and TypeScript, including validation, filtering, and stateful user flows." },
  { id: "node", name: "Node.js", type: "Skill", verdict: "MET", confidence: 94, source: "Resume · AI Resume Matching System", evidence: "Implemented Node.js services to parse profile data and coordinate resume-matching requests for the project demo." },
  { id: "rest", name: "REST APIs", type: "Skill", verdict: "PARTIAL", confidence: 71, source: "Project description · EcoScan", evidence: "Connected the EcoScan client to a REST endpoint to retrieve product classification results; route design and API ownership are not documented.", action: "Document endpoints, request/response shapes, and error handling." },
  { id: "postgresql", name: "PostgreSQL", type: "Skill", verdict: "PARTIAL", confidence: 68, source: "Resume · Expense Sharing Application", evidence: "Stored expense records in a relational database during the project prototype; schema design and PostgreSQL usage are not described.", action: "Add a PostgreSQL-backed project with a documented schema." },
  { id: "git", name: "Git", type: "Skill", verdict: "MET", confidence: 93, source: "Resume · Projects", evidence: "Maintained project repositories and used Git branches and pull requests to review changes with a small student team." },
  { id: "docker", name: "Docker", type: "Skill", verdict: "MET", confidence: 90, source: "Resume · EcoScan", evidence: "Packaged the EcoScan development environment in Docker to keep local setup consistent across contributors." },
  { id: "system-design", name: "System Design", type: "Skill", verdict: "NOT EVIDENCED", confidence: 0, action: "Complete a small architecture project and document the decisions." },
  { id: "dsa", name: "DSA", type: "Skill", verdict: "MET", confidence: 88, source: "Resume · Coursework", evidence: "Practiced data structures and algorithms in Java and Python through coursework and weekly problem-solving sessions." },
  { id: "cloud", name: "Cloud Deployment", type: "Skill", verdict: "NOT EVIDENCED", confidence: 0, action: "Deploy one project and add the live URL and setup notes." },
  { id: "cgpa", name: "CGPA", type: "Eligibility", verdict: "MET", confidence: 100, source: "Profile · Academic record", evidence: "Current CGPA 7.9; role requirement is CGPA ≥ 7.0." },
  { id: "branch", name: "Branch", type: "Eligibility", verdict: "MET", confidence: 100, source: "Profile · Education", evidence: "B.Tech in Information Technology; role accepts IT / Computer Science branches." },
];

export const roadmap = [
  { id: "01", title: "Build a PostgreSQL-backed project", requirement: "PostgreSQL", effort: "Medium", evidence: "GitHub repository + project description", initialStatus: "Not started", currentState: "PARTIAL", expectedState: "MET" },
  { id: "02", title: "Document REST API implementation", requirement: "REST APIs", effort: "Small", evidence: "Endpoint notes + request/response examples", initialStatus: "Not started", currentState: "PARTIAL", expectedState: "MET" },
  { id: "03", title: "Complete System Design mini-project", requirement: "System Design", effort: "Medium", evidence: "Architecture diagram + decision notes", initialStatus: "Not started", currentState: "NOT EVIDENCED", expectedState: "MET" },
];

export const roles = [
  { title: "SDE Intern", company: "General profile", requirements: 12, eligibility: ["CGPA ≥ 7.0", "IT / CS", "Graduating in 2027"], skills: ["React", "Node.js", "PostgreSQL", "REST APIs"], status: "active" },
  { title: "Data Analyst", company: "General profile", requirements: 10, eligibility: ["CGPA ≥ 7.0", "Any quantitative branch"], skills: ["Python", "SQL", "Data visualization", "Statistics"], status: "active" },
  { title: "ML Engineer", company: "Coming soon", requirements: 14, eligibility: ["Coming soon"], skills: ["Python", "Model evaluation", "ML systems"], status: "soon" },
];

export const demoMetrics = [
  { label: "Citation precision", value: 94.8, display: "94.8%" },
  { label: "Citation recall", value: 91.2, display: "91.2%" },
  { label: "Faithfulness", value: 87.4, display: "87.4%" },
  { label: "Fairness delta", value: 2.1, display: "2.1%" },
];

export const skillCounts = {
  met: requirements.filter((item) => item.verdict === "MET").length,
  partial: requirements.filter((item) => item.verdict === "PARTIAL").length,
  notEvidenced: requirements.filter((item) => item.verdict === "NOT EVIDENCED").length,
  supported: requirements.filter((item) => item.verdict !== "NOT EVIDENCED").length,
};
