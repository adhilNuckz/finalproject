# Report Content Replacement (With Named Existing Solutions)

-- **2.6 Limitations of Existing Solutions**  
Existing server-management approaches solve only parts of the hosting problem. **Manual administration** through SSH and Linux CLI provides high control, but it requires advanced technical expertise and increases configuration risk for students and small teams. **Traditional control panels such as cPanel/WHM, Plesk, and DirectAdmin** simplify domain and hosting tasks, but they are primarily optimized for shared-hosting patterns and do not fully align with modern Node.js-centric workflows, custom reverse-proxy routing, and process-based deployment pipelines.

**Cloud solutions such as AWS (EC2/Elastic Beanstalk), Microsoft Azure (VM/App Service), and Google Cloud Platform (Compute Engine/Cloud Run)** provide scalability and reliability, but they introduce high setup complexity, cost-management overhead, and steeper learning curves for academic or small-scale deployments. **Managed platforms such as Heroku, Render, and Vercel** reduce operations effort, but they provide limited low-level server control when direct Apache/PM2/Linux management is required.  

At the process layer, tools like **PM2, Supervisor, and systemd** are effective for runtime management but do not provide complete hosting orchestration by themselves. As a result, users still combine multiple disconnected tools for domain setup, file handling, SSL, service control, and monitoring. This fragmentation increases setup time and operational failure points. As shown in Figure 2.6, the current solutions are individually valuable but collectively incomplete for lightweight modern hosting.

-- **Figure 2.6: Comparative Limitations of Existing Hosting Approaches (Named Solutions)**  
-- **Figure prompt:** "Create an academic comparison matrix with rows: Manual CLI (SSH), cPanel/WHM, Plesk, DirectAdmin, AWS/Azure/GCP, Heroku/Render/Vercel, PM2/Supervisor; columns: Usability, Node.js Workflow Fit, Cost for Small Teams, Workflow Integration, Learning Curve, Linux-Level Control. Use red/yellow/green indicators and highlight fragmentation."

-- **2.7 Research Gap and Project Positioning**  
The review indicates a clear research gap: a missing middle-ground solution between low-level Linux administration and high-abstraction commercial/cloud ecosystems. Current options either prioritize convenience with reduced control (e.g., cPanel/Plesk/managed platforms) or provide full control at the cost of high complexity (manual CLI and cloud-native stacks). A practical solution is needed that is browser-accessible, Linux-compatible, and capable of unifying domain/site setup, Apache configuration, process supervision, SSL handling, file operations, and runtime visibility.

The proposed project is positioned as a **lightweight web-based server management platform** that integrates these tasks into one guided interface while preserving operational transparency. Instead of replacing Linux tooling, it orchestrates **Apache, PM2, Certbot, Socket.IO, deployment scripts, and API-driven controls** into a single workflow suitable for education, small organizations, and cost-sensitive VPS usage. This positioning is illustrated in Figure 2.7.

-- **Figure 2.7: Positioning of the Proposed System in the Hosting Solution Spectrum**  
-- **Figure prompt:** "Draw a spectrum diagram with left: Manual CLI/SSH, center-left: cPanel/Plesk/DirectAdmin, center: Proposed Lightweight Web Manager, center-right: Managed App Platforms (Heroku/Render/Vercel), right: Full Cloud Platforms (AWS/Azure/GCP). Add overlays for control, complexity, cost, and deployment speed."

-- **Chapter 03: Tools and Techniques**  
The implemented solution was developed using a modular full-stack architecture. The frontend was built with **React (Vite)**, while the backend was implemented using **Node.js and Express**. Service integration with **Apache, PM2, Certbot, and Linux system utilities** was exposed through REST endpoints and real-time Socket.IO channels. This toolset enabled automation while retaining transparent infrastructure-level control.

Two key implementation techniques were followed. First, **workflow unification**: domain selection, site creation, local/server file upload, Apache virtual-host setup, API proxy configuration, SSL operations, and process control were consolidated into a browser-driven flow. Second, **operational guardrails**: file access was constrained to approved roots, command execution was controlled in backend routes, and environment-based configuration was used to support both local and server deployments. The architecture and tool interactions are shown in Figure 3.1 and Figure 3.2.

-- **Figure 3.1: Technology Stack and Integration Layers**  
-- **Figure prompt:** "Create a layered architecture diagram: React/Vite UI -> Express API -> Apache + PM2 + Certbot + File Services + Git/DB helpers -> Linux OS. Add side channels for Socket.IO real-time updates and GitHub Actions CI/CD deployment."

-- **Figure 3.2: Unified Hosting Workflow in the Proposed System**  
-- **Figure prompt:** "Design a workflow diagram: Login -> Add Domain -> Create Site (local/server upload) -> Configure Apache + API Proxy -> Enable SSL -> Manage with PM2 -> Monitor logs/stats -> Update via CI/CD."

-- **Chapter 04: Methodology**  
An iterative design-and-implementation methodology was adopted. Initially, requirements were derived from identified deficiencies in manual hosting, traditional control panels (cPanel/Plesk/DirectAdmin), cloud-heavy approaches (AWS/Azure/GCP), and isolated process-management tools (PM2/Supervisor). Functional requirements (site lifecycle management, service control, SSL handling, file operations, terminal access) and non-functional requirements (usability, modularity, reproducibility, low overhead) were mapped to system modules.

The system was implemented as separated frontend, backend, and terminal services, then deployed in a Linux server environment with Apache reverse proxy and PM2 process supervision. Evaluation was performed through scenario-based functional tests where each module was exercised using realistic administration tasks. The methodological flow is presented in Figure 4.1, and requirement-to-module traceability is presented in Figure 4.2.

-- **Figure 4.1: Research Methodology Flow**  
-- **Figure prompt:** "Create a formal research flowchart: Problem Analysis -> Existing Solution Review (cPanel/Plesk/AWS/etc.) -> Requirement Extraction -> System Design -> Module Implementation -> Deployment Setup -> Functional Evaluation -> Discussion."

-- **Figure 4.2: Requirement-to-Module Mapping**  
-- **Figure prompt:** "Create a mapping table linking requirements (site creation, process control, SSL, file management, terminal, git/database support) to implemented frontend components and backend route modules."

-- **Chapter 05: Results and Discussion**  
The implemented platform successfully executed targeted administration workflows through a browser interface. Core operations such as site provisioning, Apache virtual-host handling, API proxy routing, SSL certificate actions, PM2 process control, file editing/upload, and terminal session access were integrated into one system. Real-time updates through Socket.IO improved visibility during service operations and monitoring tasks. These outcomes are summarized in Figure 5.1.

Results indicate a practical reduction in workflow fragmentation compared with baseline methods where users repeatedly switch between SSH commands, separate control panels, and independent process tools. Relative to **cPanel/Plesk**, the solution provides stronger Linux-level flexibility for custom Node.js deployments; relative to **AWS/Azure/GCP**, it reduces operational overhead for small-scale use; and relative to **PM2-only workflows**, it provides complete hosting orchestration. Comparative interpretation against Chapter 2 limitations is illustrated in Figure 5.2.

-- **Figure 5.1: Functional Test Outcome Summary**  
-- **Figure prompt:** "Create a results table with test cases: site creation, SSL install/status, PM2 restart, Apache config test, file read/write, terminal session, git operations, database status checks; include Expected vs Observed vs Status."

-- **Figure 5.2: Before-vs-After Workflow Complexity Comparison**  
-- **Figure prompt:** "Design a side-by-side process comparison: (A) cPanel/manual/cloud-fragmented workflow vs (B) proposed unified workflow, including step counts, tool switches, and touchpoints (CLI, control panels, cloud console, config files)."

-- **Chapter 06: Conclusion**  
This research addressed the absence of a lightweight, browser-based server management approach for modern Linux hosting environments. A modular platform was designed and implemented to unify deployment-related administration while remaining compatible with practical infrastructure components such as Apache, PM2, and Certbot.

The project achieved its core objective by showing that hosting workflows can be simplified without full dependence on heavyweight commercial control panels or cloud-native complexity. The resulting system is especially relevant for academic environments, small teams, and cost-sensitive VPS deployments where usability and operational control must coexist.

-- **Figure 6.1: Problem-to-Solution-to-Outcome Summary**  
-- **Figure prompt:** "Create a concise impact diagram: Problem (fragmented existing solutions) -> Proposed lightweight platform -> Implemented modules -> Outcomes (usability, integration, maintainability, cost-awareness)."

-- **Chapter 07: Future Work**  
Future development should focus on production hardening and scale expansion. Priority areas include role-based access control, stronger authentication, audit logging, and policy-driven command authorization. Additional safeguards such as vulnerability scanning, stronger secret management, and stricter separation between user actions and system-level operations should be added.

Beyond security, the platform can be extended toward multi-server orchestration, container-native deployment support, automated backup/restore, and deeper CI/CD integration. Long-term institutional deployment studies are recommended to evaluate reliability, maintainability, and user adoption in continuous operational environments.

-- **Figure 7.1: Future Enhancement Roadmap**  
-- **Figure prompt:** "Create a phased roadmap: Phase 1 Security Hardening, Phase 2 Multi-Server Management, Phase 3 Container/CI-CD Integration, Phase 4 Analytics and Predictive Monitoring."

-- **References (IEEE style, alphabetical by author/organization)**  
[1] Apache Software Foundation, "Apache HTTP Server Documentation," 2026. [Online]. Available: https://httpd.apache.org/docs/.  
[2] Canonical Ltd., "Ubuntu Server Documentation," 2026. [Online]. Available: https://ubuntu.com/server/docs.  
[3] cPanel, L.L.C., "cPanel & WHM Documentation," 2026. [Online]. Available: https://docs.cpanel.net/.  
[4] Electronic Frontier Foundation, "Certbot Documentation," 2026. [Online]. Available: https://certbot.eff.org/docs/.  
[5] GitHub, Inc., "GitHub Actions Documentation," 2026. [Online]. Available: https://docs.github.com/actions.  
[6] Google Cloud, "Google Cloud Documentation," 2026. [Online]. Available: https://cloud.google.com/docs.  
[7] Keymetrics, "PM2 Documentation," 2026. [Online]. Available: https://pm2.keymetrics.io/docs/.  
[8] Microsoft, "Microsoft Azure Documentation," 2026. [Online]. Available: https://learn.microsoft.com/azure/.  
[9] OpenJS Foundation, "Express.js Documentation," 2026. [Online]. Available: https://expressjs.com/.  
[10] OpenJS Foundation, "Node.js Documentation," 2026. [Online]. Available: https://nodejs.org/docs/.  
[11] Plesk International GmbH, "Plesk Documentation," 2026. [Online]. Available: https://docs.plesk.com/.  
[12] Socket.IO Team, "Socket.IO Documentation," 2026. [Online]. Available: https://socket.io/docs/v4/.  
[13] Vercel, Inc., "Vercel Documentation," 2026. [Online]. Available: https://vercel.com/docs.  
[14] Vite Team, "Vite Documentation," 2026. [Online]. Available: https://vite.dev/guide/.  
[15] Amazon Web Services, Inc., "AWS Documentation," 2026. [Online]. Available: https://docs.aws.amazon.com/.  

-- **Appendix A: Research Progress Report (MUST)**  
Include a chronological summary of work completed: requirement analysis, architecture design, backend route development, frontend module implementation, deployment setup, testing rounds, and supervisor review checkpoints. Add milestone dates, completed deliverables, encountered issues, and mitigation steps.

-- **Appendix B: Supervisor Report (MUST)**  
Include supervisor feedback records covering technical direction, progress quality, implementation correctness, documentation quality, and final recommendation. Attach signed/approved version as required by your department template.
