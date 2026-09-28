export const CATEGORIES = [
  { id: 1, name: "Requirements Quality", order_idx: 1 },
  { id: 2, name: "Delivery & Timeliness", order_idx: 2 },
  { id: 3, name: "Domain & Process Knowledge", order_idx: 3 },
  { id: 4, name: "Stakeholder Comms & Prioritization", order_idx: 4 },
  { id: 5, name: "Documentation & Traceability", order_idx: 5 },
  { id: 6, name: "Collaboration & Teamwork", order_idx: 6 },
  { id: 7, name: "Governance, Attitude & Ownership", order_idx: 7 }
];

export const KPIS = [
  // 1. Requirements Quality
  {
    id: 1,
    category_id: 1,
    code: "1.1",
    title: "Completeness of deliverables (Scope + Rules + Acceptance Criteria).",
    tooltip: "Ensuring all business rules, scope definitions, and given/when/then acceptance criteria are fully documented before handing the task to the tech team.",
    order_idx: 1
  },
  {
    id: 2,
    category_id: 1,
    code: "1.2",
    title: "Clarity of requirements & reducing ambiguity to prevent rework.",
    tooltip: "Writing requirements so clearly that developers and QA do not have to guess or repeatedly ask for the same clarifications.",
    order_idx: 2
  },
  {
    id: 3,
    category_id: 1,
    code: "1.3",
    title: "Covering critical scenarios and Edge cases inside requirements.",
    tooltip: "Thinking beyond the 'happy path' to identify what happens during errors, timeouts, data missing, or unusual user behaviors.",
    order_idx: 3
  },
  {
    id: 4,
    category_id: 1,
    code: "1.4",
    title: "Achieving UAT First-Pass acceptance without major rejections.",
    tooltip: "Delivering requirements that match the client's actual needs, resulting in the client accepting the feature in UAT without demanding major rework.",
    order_idx: 4
  },
  {
    id: 5,
    category_id: 1,
    code: "1.5",
    title: "Minimizing requirement-rooted defects & Change Requests (CRs).",
    tooltip: "Reducing the number of bugs or CRs that occur because the requirement itself was poorly written, contradictory, or missed a core rule.",
    order_idx: 5
  },

  // 2. Delivery & Timeliness
  {
    id: 6,
    category_id: 2,
    code: "2.1",
    title: "Punctuality in delivering specs before Dev/QA cycles start.",
    tooltip: "Ensuring all specifications and user stories are finalized and approved before the development and QA teams are scheduled to start their work.",
    order_idx: 1
  },
  {
    id: 7,
    category_id: 2,
    code: "2.2",
    title: "Meeting standard task deadlines according to project schedules.",
    tooltip: "Delivering individual BA tasks on time according to the agreed-upon project timelines or sprint commitments.",
    order_idx: 2
  },
  {
    id: 8,
    category_id: 2,
    code: "2.3",
    title: "Effectively managing time, priorities, and context-switching across multiple concurrent projects.",
    tooltip: "Balancing workload across multiple active projects without letting one project severely block the progress of the others.",
    order_idx: 3
  },

  // 3. Domain & Process Knowledge
  {
    id: 9,
    category_id: 3,
    code: "3.1",
    title: "Strict adherence to the Definition of Done (DoD) & quality checklists.",
    tooltip: "Checking all mandatory boxes (e.g., UI attached, flows mapped, rules defined) before marking a requirement as 'Ready for Dev'.",
    order_idx: 1
  },
  {
    id: 10,
    category_id: 3,
    code: "3.2",
    title: "Continuous learning and skill development (Technical/Domain).",
    tooltip: "Actively seeking to understand new fintech concepts, system architecture, and better BA methodologies to improve work quality.",
    order_idx: 2
  },
  {
    id: 11,
    category_id: 3,
    code: "3.3",
    title: "Proposing practical improvements to the product or internal processes.",
    tooltip: "Going beyond just writing tickets by proactively suggesting ways to make the software better or the team's internal processes faster.",
    order_idx: 3
  },

  // 4. Stakeholder Comms & Prioritization
  {
    id: 12,
    category_id: 4,
    code: "4.1",
    title: "Clear, professional communication with clients and cross-functional teams.",
    tooltip: "Keeping emails, meetings, and presentations concise, polite, and easy for both technical and non-technical stakeholders to understand.",
    order_idx: 1
  },
  {
    id: 13,
    category_id: 4,
    code: "4.2",
    title: "Defining priorities with stakeholders and resolving conflicting requirements.",
    tooltip: "Helping stakeholders decide which features are most urgent and tactfully handling situations where different departments want conflicting things.",
    order_idx: 2
  },

  // 5. Documentation & Traceability
  {
    id: 14,
    category_id: 5,
    code: "5.1",
    title: "Maintaining Traceability Matrix (linking requirements to deliverables).",
    tooltip: "Ensuring every requirement logically links back to a business need/epic, and forward to a specific test case or release feature.",
    order_idx: 1
  },
  {
    id: 15,
    category_id: 5,
    code: "5.2",
    title: "Documenting decisions and status updates clearly on ClickUp/Jira.",
    tooltip: "Recording what was agreed upon in meetings inside your project management tools so there is a permanent written record if disputes arise.",
    order_idx: 2
  },
  {
    id: 16,
    category_id: 5,
    code: "5.3",
    title: "Creating necessary UI mockups, flows, and diagrams to clarify specs.",
    tooltip: "Drawing clear diagrams (flowcharts, state machines) or basic wireframes so the team can visually understand the requirement.",
    order_idx: 3
  },

  // 6. Collaboration & Teamwork
  {
    id: 17,
    category_id: 6,
    code: "6.1",
    title: "Aligning with Dev/QC to ensure a unified understanding of requirements.",
    tooltip: "Having walkthrough sessions with the tech team before they start to ensure they completely understand the business goal behind the requirement.",
    order_idx: 1
  },
  {
    id: 18,
    category_id: 6,
    code: "6.2",
    title: "Providing rapid clarifications and query responses during implementation.",
    tooltip: "Answering questions quickly while developers are coding or QA is testing so they aren't sitting idle waiting for you.",
    order_idx: 2
  },
  {
    id: 19,
    category_id: 6,
    code: "6.3",
    title: "Supporting the team during urgent releases or critical production issues.",
    tooltip: "Being available, responsive, and helpful during critical deployment days or when a major production bug needs immediate analysis.",
    order_idx: 3
  },
  {
    id: 20,
    category_id: 6,
    code: "6.4",
    title: "Sharing knowledge, reviewing work, and mentoring junior team members.",
    tooltip: "Helping train newer team members, reviewing peers' work constructively, and sharing insights about the product with the wider group.",
    order_idx: 4
  },

  // 7. Governance, Attitude & Ownership
  {
    id: 21,
    category_id: 7,
    code: "7.1",
    title: "Strict adherence to company information security, privacy, and confidentiality policies.",
    tooltip: "Never sharing passwords, locking screens, and following all company protocols regarding sensitive financial data and client privacy.",
    order_idx: 1
  },
  {
    id: 22,
    category_id: 7,
    code: "7.2",
    title: "Adherence to attendance policies, office dress code, and professional appearance.",
    tooltip: "Showing up on time to the office, following the company's dress code policy, and respecting standard working hours.",
    order_idx: 2
  },
  {
    id: 23,
    category_id: 7,
    code: "7.3",
    title: "Maintaining high availability, responsiveness, and clear communication while working from home (WFH).",
    tooltip: "Being consistently reachable on chat/email and actively participating during remote work days, avoiding long unexplained absences.",
    order_idx: 3
  },
  {
    id: 24,
    category_id: 7,
    code: "7.4",
    title: "Solving problems independently without waiting for standard directions.",
    tooltip: "Trying to find the answer through research or past documentation before immediately asking a manager to solve the problem for you.",
    order_idx: 4
  },
  {
    id: 25,
    category_id: 7,
    code: "7.5",
    title: "Handling high-pressure situations and changing requirements professionally.",
    tooltip: "Remaining calm, focused, and adaptable when deadlines are tight or when client requirements change at the last minute.",
    order_idx: 5
  },
  {
    id: 26,
    category_id: 7,
    code: "7.6",
    title: "Applying feedback and peer reviews quickly and positively.",
    tooltip: "Listening to constructive criticism from managers or peers and actively changing behavior without getting defensive.",
    order_idx: 6
  },
  {
    id: 27,
    category_id: 7,
    code: "7.7",
    title: "Maintaining a positive, constructive, and professional general attitude.",
    tooltip: "Fostering a healthy, optimistic work environment; avoiding toxic complaining, and acting as a supportive, reliable colleague.",
    order_idx: 7
  }
];

export const CATEGORY_WEIGHTS = {
  Junior: {
    1: 20, // Requirements Quality: 20%
    2: 30, // Delivery & Timeliness: 30%
    3: 5,  // Domain & Process Knowledge: 5%
    4: 10, // Stakeholder Comms & Prioritization: 10%
    5: 25, // Documentation & Traceability: 25%
    6: 5,  // Collaboration & Teamwork: 5%
    7: 5   // Governance, Attitude & Ownership: 5%
  },
  Mid: {
    1: 25, // Requirements Quality: 25%
    2: 20, // Delivery & Timeliness: 20%
    3: 15, // Domain & Process Knowledge: 15%
    4: 10, // Stakeholder Comms & Prioritization: 10%
    5: 10, // Documentation & Traceability: 10%
    6: 10, // Collaboration & Teamwork: 10%
    7: 10  // Governance, Attitude & Ownership: 10%
  },
  Senior: {
    1: 30, // Requirements Quality: 30%
    2: 15, // Delivery & Timeliness: 15%
    3: 20, // Domain & Process Knowledge: 20%
    4: 10, // Stakeholder Comms & Prioritization: 10%
    5: 5,  // Documentation & Traceability: 5%
    6: 10, // Collaboration & Teamwork: 10%
    7: 10  // Governance, Attitude & Ownership: 10%
  },
  Lead: {
    1: 15, // Requirements Quality: 15%
    2: 10, // Delivery & Timeliness: 10%
    3: 25, // Domain & Process Knowledge: 25%
    4: 20, // Stakeholder Comms & Prioritization: 20%
    5: 5,  // Documentation & Traceability: 5%
    6: 10, // Collaboration & Teamwork: 10%
    7: 15  // Governance, Attitude & Ownership: 15%
  }
};
