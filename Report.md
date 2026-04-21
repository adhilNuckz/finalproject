# Report Continuation (Chapters 02–07)

**IEEE ethics note:** The content below is written in an objective academic style, avoids fabricated claims, and is intended to be supported by verifiable citations in final submission (e.g., official documentation, peer-reviewed articles, and vendor technical reports).

## Chapter 02: Related Work (Continuation)

### 2.7 Positioning of the Proposed System
Based on the reviewed approaches, a clear gap exists between low-level manual administration and highly abstract cloud platforms. The proposed system is positioned as a lightweight browser-based management layer for Linux VPS environments, combining usability with operational control. Its focus is to integrate deployment, process handling, and service configuration in one interface while preserving transparency of underlying server operations.

Figure 2.6 positions the proposed system between traditional control panels and cloud-native consoles, showing how it balances accessibility, flexibility, and cost for small teams and academic users.

**Suggested image/screenshot for Figure 2.6:** A comparative positioning diagram with three columns: (1) Manual/Control Panel, (2) Proposed System, (3) Cloud Console; include criteria rows such as usability, control, cost, and learning curve.

### 2.8 Identified Deficiencies and Research Gap
Existing solutions remain insufficient for this context due to four recurring deficiencies: fragmented workflows, platform constraints, high operational complexity, and limited support for modern JavaScript deployment practices. In particular, users often switch between SSH, process managers, and separate hosting dashboards, increasing the probability of configuration errors and reducing reproducibility. Therefore, the research gap is identified as the absence of a unified, browser-accessible, Linux-oriented management framework tailored to modern full-stack project deployment.

Figure 2.7 summarizes the deficiency mapping used to derive the project requirements.

**Suggested image/screenshot for Figure 2.7:** A gap-analysis matrix (rows: existing approaches; columns: deployment automation, process management, frontend hosting, usability, cost-efficiency) with highlighted unmet requirements.

## Chapter 03: Tools and Techniques

### 3.1 Introduction
This chapter describes the tools and implementation techniques selected to build the browser-based server management platform. Selection was guided by compatibility with Linux hosting, open-source availability, and maintainability for academic and small-scale production use.

### 3.2 Core Development Stack
The solution was implemented using a JavaScript/TypeScript-based stack with a frontend interface, backend API layer, and Linux service integration. REST-style communication was used between interface and backend services, while environment-based configuration was used for deployment flexibility across development and production servers.

Figure 3.1 illustrates the high-level technology stack used in the implementation.

**Suggested image/screenshot for Figure 3.1:** Layered architecture diagram showing frontend, backend API, process manager, web server (Nginx/Apache), and Linux host.

### 3.3 Deployment and Service Management Tools
Modern deployment tooling was combined with process supervision to support reliable application execution. A reverse proxy was used to expose services securely, and process management utilities were used for restart policies, runtime monitoring, and log access. This combination reduced manual operational effort while preserving administrator control.

Figure 3.2 demonstrates the deployment and runtime management workflow.

**Suggested image/screenshot for Figure 3.2:** Flow diagram: code update -> build/deploy script -> process manager restart -> reverse proxy route -> browser access.

### 3.4 Security and Reliability Techniques
Security controls were implemented through SSH-based administration boundaries, restricted service exposure, and environment-variable handling for sensitive configuration. Reliability was improved through controlled restart behavior, structured logging, and health-oriented service checks.

Figure 3.3 presents the security and reliability control points in the deployed environment.

**Suggested image/screenshot for Figure 3.3:** Security control diagram marking firewall, reverse proxy, backend port isolation, and authenticated admin interface.

## Chapter 04: Methodology

### 4.1 Research Design
An iterative design-and-build methodology was adopted. First, requirements were derived from limitations observed in existing hosting approaches. Next, a prototype was implemented and deployed on a Linux-based environment. Finally, functional and operational evaluations were carried out using predefined test scenarios.

Figure 4.1 shows the methodological sequence followed in this study.

**Suggested image/screenshot for Figure 4.1:** Methodology flowchart: requirement analysis -> system design -> implementation -> deployment -> evaluation.

### 4.2 Requirement Analysis and System Modeling
Functional requirements (deployment control, service monitoring, and configuration management) and non-functional requirements (usability, reliability, and low resource overhead) were identified through comparative review of current tools. System components and interactions were modeled before implementation to support reproducibility.

Figure 4.2 illustrates the requirement-to-component mapping.

**Suggested image/screenshot for Figure 4.2:** Table/diagram mapping each requirement to a concrete module in your system.

### 4.3 Implementation Procedure
The system was developed in modular form, with frontend and backend components implemented separately and integrated through API contracts. Deployment scripts and service configuration files were prepared to standardize setup. The implementation procedure was documented step-by-step to allow replication by other researchers.

Figure 4.3 presents the implementation pipeline used for development and deployment.

**Suggested image/screenshot for Figure 4.3:** Screenshot collage: project structure, terminal deployment command, and running service status.

### 4.4 Evaluation Plan
Evaluation was performed using task-based tests: service deployment, process recovery, configuration updates, and user interaction through the web interface. Measurements included task completion success, response consistency, and administrative effort compared with manual workflows.

Figure 4.4 shows the structure of the evaluation plan.

**Suggested image/screenshot for Figure 4.4:** Test plan table with columns: test ID, objective, input, expected result, observed result.

## Chapter 05: Results and Discussion

### 5.1 Overview of Results
The implemented platform successfully provided browser-based control for deployment and server-process operations on Linux. Core administrative tasks were completed without requiring continuous command-line interaction, indicating improved accessibility for non-expert users.

Figure 5.1 summarizes completion status across primary functional tests.

**Suggested image/screenshot for Figure 5.1:** Bar chart or table showing pass/fail counts for deployment, restart handling, configuration update, and monitoring tasks.

### 5.2 Functional Performance Discussion
Results indicated that integration of deployment and process management in a single interface reduced operational fragmentation observed in existing approaches. Compared with manual administration, the proposed system improved task consistency and reduced repetitive configuration overhead.

Figure 5.2 compares workflow complexity between manual and proposed approaches.

**Suggested image/screenshot for Figure 5.2:** Side-by-side workflow diagram with step count comparison.

### 5.3 Reliability and Usability Findings
Service continuity improved through controlled restart behavior and centralized monitoring visibility. Usability outcomes indicated that common management tasks could be performed with fewer steps and lower configuration risk, supporting the project objective of practical accessibility.

Figure 5.3 demonstrates reliability behavior during process interruption and recovery.

**Suggested image/screenshot for Figure 5.3:** PM2/service monitor screenshot before and after a forced process stop, showing automatic recovery.

### 5.4 Relation to Prior Work
The findings align with prior research that emphasizes the trade-off between control and simplicity in hosting management. Unlike conventional control panels and isolated process tools, the proposed approach contributes a balanced model that remains lightweight while supporting modern deployment workflows relevant to educational and small-team environments.

Figure 5.4 positions study outcomes against the limitations identified in Chapter 2.

**Suggested image/screenshot for Figure 5.4:** Requirement-coverage matrix showing which Chapter 2 deficiencies were resolved.

## Chapter 06: Conclusion

This research addressed the lack of an accessible yet flexible server management solution for modern Linux-based hosting. A browser-based management platform was designed and implemented to unify deployment control, process supervision, and routine server administration tasks. The final system demonstrated that key hosting operations can be simplified without fully sacrificing administrative transparency and control.

The project achieved its primary objective by reducing operational fragmentation and improving usability for small teams and academic users. In summary, the study contributes a practical and cost-aware management approach positioned between manual administration and complex cloud-native infrastructures.

Figure 6.1 summarizes the overall research outcomes and contributions.

**Suggested image/screenshot for Figure 6.1:** Final contribution diagram linking problem -> approach -> implementation -> outcomes.

## Chapter 07: Future Work

Future work may extend the system with multi-server orchestration, role-based access control, automated backup scheduling, and deeper security auditing support. Integration with container-native deployment and CI/CD pipelines can further improve scalability and maintainability for larger use cases. Additional longitudinal testing in real institutional environments is recommended to evaluate performance and usability over extended operational periods.

Figure 7.1 illustrates the proposed roadmap for future enhancement.

**Suggested image/screenshot for Figure 7.1:** Roadmap timeline with phases: security hardening, multi-node support, CI/CD integration, analytics dashboard.

---

## Optional IEEE Citation Placeholders (for final editing)

Use numbered references in IEEE style where needed, for example:

- Linux distribution and server usage claims -> cite Ubuntu/Linux Foundation or hosting survey reports.
- cPanel/Plesk limitations and licensing context -> cite official documentation and pricing pages.
- Cloud complexity/cost observations -> cite AWS/Azure architecture and cost-management docs.
- PM2 capabilities -> cite official PM2 documentation.

Example in-text style: *as discussed in [1], [2]*.
