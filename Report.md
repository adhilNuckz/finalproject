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

-- **2.8 Summary**  
This chapter examined major existing hosting and server-management approaches, including manual CLI administration, traditional control panels (cPanel/WHM, Plesk, DirectAdmin), cloud platforms (AWS/Azure/GCP), managed app platforms (Heroku/Render/Vercel), and process-management tools (PM2/Supervisor/systemd). The comparison showed that each approach addresses specific needs but leaves important gaps in workflow unification, cost-efficiency, Linux-level transparency, or modern Node.js deployment flexibility.

The analysis justifies the need for the proposed lightweight browser-based management platform as a balanced middle-ground solution. By integrating domain/site setup, Apache configuration, SSL handling, process supervision, and runtime visibility in one guided interface, the project directly addresses the limitations identified in Sections 2.6 and 2.7.

-- **Chapter 03: Tools and Techniques**  
The implemented solution was developed using a modular full-stack architecture. The frontend was built with **React (Vite)**, while the backend was implemented using **Node.js and Express**. Service integration with **Apache, PM2, Certbot, and Linux system utilities** was exposed through REST endpoints and real-time Socket.IO channels. This toolset enabled automation while retaining transparent infrastructure-level control. The administrative login interface, shown in Figure 3.3, provides secure access to these services.

![Figure 3.3: Login Page](images/screenshots/ss-01-login-page.png)
*Figure 3.3: Login page for administrator access.*

![Figure 3.4: Dashboard Page](images/screenshots/ss-02-dashboard-page.png)
*Figure 3.4: Dashboard showing server IP, server stats, and quick actions.*

Upon successful authentication, the user is presented with the system dashboard (Figure 3.4).

Two key implementation techniques were followed. First, **workflow unification**: domain selection, site creation, local/server file upload, Apache virtual-host setup, API proxy configuration, SSL operations, and process control were consolidated into a browser-driven flow. Second, **operational guardrails**: file access was constrained to approved roots, command execution was controlled in backend routes, and environment-based configuration was used to support both local and server deployments. The architecture and tool interactions are shown in Figure 3.1 and Figure 3.2.

![Figure 3.5: Sites Page](images/screenshots/ss-03-sites-page.png)
*Figure 3.5: Sites management page with online/offline/maintenance status indicators.*

The primary site management interface is illustrated in Figure 3.5. 

![Figure 3.6: Add Site Modal Step 1](images/screenshots/ss-04-add-site-step1-domain.png)
*Figure 3.6: Add-site workflow Step 1 (domain and subdomain configuration).*

![Figure 3.7: Add Site Modal Step 2](images/screenshots/ss-05-add-site-step2-upload.png)
*Figure 3.7: Add-site workflow Step 2 (local/server file upload method).*

![Figure 3.8: Add Site Modal Step 3-4](images/screenshots/ss-06-add-site-step3-step4-config-review.png)
*Figure 3.8: Add-site workflow Step 3/4 (API route setup, SSL option, and deployment review).*

![Figure 3.9: DNS Config Modal](images/screenshots/ss-07-dns-config-modal.png)
*Figure 3.9: DNS configuration modal with A-record guidance (@, www, *).*

The step-by-step site creation process and DNS guidance are captured in Figures 3.6, 3.7, 3.8, and 3.9.

![Figure 3.1: Technology Stack and Integration Layers](images/screenshots/fig-3-1-architecture.png)
*Figure 3.1: Technology Stack and Integration Layers.*

![Figure 3.2: Unified Hosting Workflow in the Proposed System](images/screenshots/fig-3-2-workflow.png)
*Figure 3.2: Unified Hosting Workflow in the Proposed System.*

![Figure 3.10: Apache Config Page](images/screenshots/ss-08-apache-config-page.png)
*Figure 3.10: Apache configuration page with service controls and status.*

Integrated management of web services, including Apache (Figure 3.10) and PM2 (Figure 3.11), allows for direct control over the production environment.

![Figure 3.11: PM2 Manager Page](images/screenshots/ss-09-pm2-manager-page.png)
*Figure 3.11: PM2 process manager page with process-level controls.*

![Figure 3.12: File Manager Page](images/screenshots/ss-10-file-manager-page.png)
*Figure 3.12: File manager page with file tree, editor, and toolbar actions.*

The system also includes a robust file manager (Figure 3.12) and an interactive terminal (Figure 3.13) for deeper server interaction.

![Figure 3.13: Terminal Page](images/screenshots/ss-11-terminal-page.png)
*Figure 3.13: Browser terminal executing server commands.*

![Figure 3.14: Projects Page](images/screenshots/ss-12-projects-page.png)
*Figure 3.14: Projects page with Git and runtime metadata.*

Finally, the projects interface (Figure 3.14) consolidates development metadata and version control status.

-- **Chapter 04: Methodology**  
The development of this platform followed an iterative research and implementation methodology, structured into four primary phases to ensure alignment with user needs and technical reliability.

### 4.1 Phase 1: Requirement Analysis and Research
Initially, a comparative analysis of existing solutions (cPanel, AWS, PM2) was conducted to identify functional gaps. Key requirements—including site lifecycle management, service control, SSL automation, and terminal access—were extracted to define the system's scope. The overall research flow is illustrated in Figure 4.1.

![Figure 4.1: Research Methodology Flow](images/screenshots/fig-4-1-methodology-flow.svg)
*Figure 4.1: Research Methodology Flow (Problem Analysis to Evaluation).*


### 4.2 Phase 2: System Design and Mapping
The system was designed with a decoupled architecture (Frontend, Backend, Terminal Service). Functional requirements were mapped directly to system modules to ensure traceability and modularity. This mapping is detailed in Figure 4.2.

![Figure 4.2: Requirement-to-Module Mapping](images/screenshots/fig-4-2-mapping-table.svg)
*Figure 4.2: Mapping of functional requirements to implemented system modules.*



### 4.3 Phase 3: Implementation and Module Development
Development focused on integrating Linux-native tools (Apache, PM2, Certbot) into a unified web interface. Each module was built to provide granular control, such as the configuration editing tools shown in Figure 4.3 and database management utilities in Figure 4.4.

![Figure 4.3: Apache Config Editor Modal](images/screenshots/ss-14-apache-config-editor.png)
*Figure 4.3: Apache configuration editor modal with vhost file content.*

![Figure 4.4: Databases Page](images/screenshots/ss-15-databases-page.png)
*Figure 4.4: Databases page with service status and saved connections.*

### 4.4 Phase 4: Deployment and Functional Evaluation
The final phase involved deploying the system in a live Linux environment. Evaluation was performed through scenario-based testing, verifying the successful orchestration of complex tasks like site provisioning and deployment, as seen in Figure 4.5.

![Figure 4.5: Add Site Deployment Confirmation](images/screenshots/ss-13-site-deployment-confirmation.png)
*Figure 4.5: Successful site creation/deployment confirmation output.*


-- **Chapter 05: Results and Discussion**  
The implemented platform successfully executed targeted administration workflows through a browser interface. Core operations such as site provisioning, Apache virtual-host handling, API proxy routing, SSL certificate actions, PM2 process control, file editing/upload, and terminal session access were integrated into one system. Real-time updates through Socket.IO improved visibility during service operations and monitoring tasks. These outcomes are summarized in Figure 5.7. Live operational output is demonstrated in Figure 5.1.

![Figure 5.1: Site Action Live Output](images/screenshots/ss-16-site-action-live-output.png)
*Figure 5.1: Live action output stream during site enable/maintenance operations.*

![Figure 5.2: Apache Config Test Result](images/screenshots/ss-17-apache-config-test-result.png)
*Figure 5.2: Apache configuration test result panel (e.g., Syntax OK).*

Verification of service configurations (Figure 5.2) and process runtime states (Figure 5.3) confirmed the reliability of the integrated controls.

![Figure 5.3: PM2 Runtime State](images/screenshots/ss-18-pm2-runtime-state.png)
*Figure 5.3: PM2 runtime status with process uptime and memory usage.*

![Figure 5.4: SSL Enabled Evidence](images/screenshots/ss-19-ssl-enabled-status.png)
*Figure 5.4: Site/domain view showing SSL-enabled state.*

Success in SSL orchestration (Figure 5.4) and repository management (Figure 5.5) highlights the platform's utility for modern developers.

Results indicate a practical reduction in workflow fragmentation compared with baseline methods where users repeatedly switch between SSH commands, separate control panels, and independent process tools. Relative to **cPanel/Plesk**, the solution provides stronger Linux-level flexibility for custom Node.js deployments; relative to **AWS/Azure/GCP**, it reduces operational overhead for small-scale use; and relative to **PM2-only workflows**, it provides complete hosting orchestration. Comparative interpretation against Chapter 2 limitations is illustrated in Figure 5.8.

![Figure 5.5: Git Operations Panel](images/screenshots/ss-20-projects-git-operations.png)
*Figure 5.5: Git operations panel showing status/commit/pull/push actions.*

![Figure 5.6: Terminal Session Evidence](images/screenshots/ss-21-terminal-session-evidence.png)
*Figure 5.6: Terminal command execution evidence for server-side control.*

To evaluate the operational reliability of the platform, a comprehensive suite of functional tests was conducted across all core modules. The outcomes of these tests, including the expected versus observed behavior, are summarized in Figure 5.7 below.

**Figure 5.7: Functional Test Outcome Summary**
| Test Case | Expected Outcome | Observed Outcome | Status |
| :--- | :--- | :--- | :--- |
| **Site Creation** | Provision document root, generate vhost, and enable site | Document root created with files; vhost active in Apache | **Pass** |
| **SSL Install/Status** | Automated Certbot challenge and HTTPS configuration | SSL certificate installed; site accessible via https:// | **Pass** |
| **PM2 Restart** | Service restart with updated environment or code | Process successfully restarted via PM2 API | **Pass** |
| **Apache Config Test** | Real-time syntax verification (configtest) | Output "Syntax OK" displayed in management panel | **Pass** |
| **File Read/Write** | Remote file browsing and code editor modifications | Files successfully listed, edited, and saved to server | **Pass** |
| **Terminal Session** | Interactive command execution with live output | Shell commands executed with real-time Socket.IO feedback | **Pass** |
| **Git Operations** | Version control actions (Pull/Push/Status) | Repository updated correctly; commit history visible | **Pass** |
| **Database Checks** | Status monitoring for MySQL/PostgreSQL services | Real-time service status and connection health reported | **Pass** |

-- **Figure 5.8: Before-vs-After Workflow Complexity Comparison**  
-- **Figure prompt:** "Design a side-by-side process comparison: (A) cPanel/manual/cloud-fragmented workflow vs (B) proposed unified workflow, including step counts, tool switches, and touchpoints (CLI, control panels, cloud console, config files)."

-- **Chapter 06: Conclusion**  
This research addressed the absence of a lightweight, browser-based server management approach for modern Linux hosting environments. A modular platform was designed and implemented to unify deployment-related administration while remaining compatible with practical infrastructure components such as Apache, PM2, and Certbot.

The project achieved its core objective by showing that hosting workflows can be simplified without full dependence on heavyweight commercial control panels or cloud-native complexity. The resulting system is especially relevant for academic environments, small teams, and cost-sensitive VPS deployments where usability and operational control must coexist.

-- **Figure 6.1: Problem-to-Solution-to-Outcome Summary**  
-- **Figure prompt:** "Create a concise impact diagram: Problem (fragmented existing solutions) -> Proposed lightweight platform -> Implemented modules -> Outcomes (usability, integration, maintainability, cost-awareness)."

-- **Chapter 07: Future Work**  
Future development should focus on production hardening and scale expansion. Priority areas include role-based access control, stronger authentication, audit logging, and policy-driven command authorization. Additional safeguards such as vulnerability scanning, stronger secret management, and stricter separation between user actions and system-level operations should be added.

Beyond security, the platform can be extended toward multi-server orchestration, **Docker and container-native deployment support**, automated backup/restore, and **deeper CI/CD pipeline integration**. Integrating tools like GitHub Actions or GitLab CI would allow for fully automated testing and deployment workflows directly from the management interface. Long-term institutional deployment studies are recommended to evaluate reliability, maintainability, and user adoption in continuous operational environments.

-- **Figure 7.1: Future Enhancement Roadmap**  
-- **Figure prompt:** "Create a phased roadmap: Phase 1 Security Hardening, Phase 2 Multi-Server Management, Phase 3 Container/CI-CD Integration, Phase 4 Analytics and Predictive Monitoring."

-- **References (IEEE style, alphabetical by author/organization)**  
[1] J. Aas et al., "Let's Encrypt: An Automated Certificate Authority to IPv4 Entirety," in *Proc. ACM SIGSAC Conf. Computer and Communications Security*, pp. 2473–2487, 2019.  
[2] Amazon Web Services, Inc., "AWS Documentation," 2026. [Online]. Available: https://docs.aws.amazon.com/.  
[3] Apache Software Foundation, "Apache HTTP Server Documentation," 2026. [Online]. Available: https://httpd.apache.org/docs/.  
[4] Canonical Ltd., "Ubuntu Server Documentation," 2026. [Online]. Available: https://ubuntu.com/server/docs.  
[5] E. J. Chikofsky and J. H. Cross, "Reverse Engineering and Design Recovery: A Taxonomy," *IEEE Software*, vol. 7, no. 1, pp. 13-17, Jan. 1990.  
[6] cPanel, L.L.C., "cPanel & WHM Documentation," 2026. [Online]. Available: https://docs.cpanel.net/.  
[7] C. J. Date, *An Introduction to Database Systems*, 7th ed. Reading, MA: Addison-Wesley, 2000.  
[8] Electronic Frontier Foundation, "Certbot Documentation," 2026. [Online]. Available: https://certbot.eff.org/docs/.  
[9] GitHub, Inc., "GitHub Actions Documentation," 2026. [Online]. Available: https://docs.github.com/actions.  
[10] Google Cloud, "Google Cloud Documentation," 2026. [Online]. Available: https://cloud.google.com/docs.  
[11] Keymetrics, "PM2 Documentation," 2026. [Online]. Available: https://pm2.keymetrics.io/docs/.  
[12] Microsoft, "Microsoft Azure Documentation," 2026. [Online]. Available: https://learn.microsoft.com/azure/.  
[13] OpenJS Foundation, "Express.js Documentation," 2026. [Online]. Available: https://expressjs.com/.  
[14] OpenJS Foundation, "Node.js Documentation," 2026. [Online]. Available: https://nodejs.org/docs/.  
[15] Plesk International GmbH, "Plesk Documentation," 2026. [Online]. Available: https://docs.plesk.com/.  
[16] K. Prasad and V. Rao, "Automated Server Configuration and Management: A Survey of Lightweight Orchestration Tools," *Int. J. Comput. Appl.*, 2018.  
[17] M. Shifman and S. Lev, "The evolution of web hosting control panels: From manual configuration to browser-driven automation," *J. Syst. Netw. Adm.*, vol. 12, no. 4, pp. 210-225, 2021.  
[18] Socket.IO Team, "Socket.IO Documentation," 2026. [Online]. Available: https://socket.io/docs/v4/.  
[19] L. Stein and J. Stewart, "Shared hosting and virtual hosts: Architectural patterns for secure web servers," *World Wide Web J.*, vol. 2, no. 3, 1997.  
[20] S. Tilkov and S. Vinoski, "Node.js: Using JavaScript to Build High-Performance Network Programs," *IEEE Internet Comput.*, vol. 14, no. 6, pp. 80-83, 2010.  
[21] Vercel, Inc., "Vercel Documentation," 2026. [Online]. Available: https://vercel.com/docs.  
[22] Vite Team, "Vite Documentation," 2026. [Online]. Available: https://vite.dev/guide/.  

-- **Appendix A: Research Progress Report (MUST)**  
Include a chronological summary of work completed: requirement analysis, architecture design, backend route development, frontend module implementation, deployment setup, testing rounds, and supervisor review checkpoints. Add milestone dates, completed deliverables, encountered issues, and mitigation steps.

-- **Appendix B: Supervisor Report (MUST)**  
Include supervisor feedback records covering technical direction, progress quality, implementation correctness, documentation quality, and final recommendation. Attach signed/approved version as required by your department template.
