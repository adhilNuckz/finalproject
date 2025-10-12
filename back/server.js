// const express = require("express");
// const bodyParser = require("body-parser");
// const { exec } = require("child_process");
// const cors = require("cors");
// const fs = require("fs");
// const path = require("path");
// const multer = require("multer");

// const app = express() ;
// app.use(cors());
// app.use(bodyParser.json());

// // Multer setup for file uploads
// const upload = multer({ dest: "uploads/" });

// function runExec(cmd, res) {
//   exec(cmd, (err, stdout, stderr) => {
//     if (err) return res.status(500).json({ success: false, error: stderr });
//     res.json({ success: true, output: stdout });
//   });
// }


// // Route to run user commands
// app.post("/run", (req, res) => {
//   const { command } = req.body;
//   const allowed = ["ls", "pwd", "whoami", "uptime"];
//   if (!allowed.includes(command)) {
//     return res.status(400).json({ success: false, error: "Invalid command" });
//   }
//   runExec(command, res);
// });

// // Route to control Apache
// app.post("/apache", (req, res) => {
//   const { action } = req.body;
//   let cmd = "";
//   if (action === "start") cmd = "sudo service apache2 start";
//   if (action === "stop") cmd = "sudo service apache2 stop";
//   if (action === "restart") cmd = "sudo service apache2 restart";
//   if (action === "status") cmd = "service apache2 status";
//   if (!cmd) return res.status(400).json({ success: false, error: "Invalid action" });
//   runExec(cmd, res);
// });


// app.post("/sites", (req, res) => {
//   const { site, action } = req.body;

//   if (!site || !action) {
//     return res.status(400).json({ success: false, error: "Missing site or action" });
//   }

//   const confFile = `/etc/apache2/sites-available/${site}.conf`;
//   const enabledFile = `/etc/apache2/sites-enabled/${site}.conf`;

//   // check if enabled by symlink
//   exec(`[ -L ${enabledFile} ] && echo "enabled" || echo "disabled"`, (err, stdout) => {
//     if (err) {
//       return res.status(400).json({ success: false, error: `Site ${site} not found` });
//     }

//     const isEnabled = stdout.trim() === "enabled";
//     let cmd = "";

//     if (action === "enable") {
//       if (isEnabled) {
//         return res.status(400).json({ success: false, error: `Site ${site} is already enabled` });
//       }
//       cmd = `
//         if [ -f ${confFile}.bak ]; then
//           sudo mv ${confFile}.bak ${confFile};
//         fi;
//         sudo a2ensite ${site}.conf && sudo apache2ctl configtest && sudo systemctl reload apache2
//       `;
//     } else if (action === "disable") {
//       if (!isEnabled) {
//         return res.status(400).json({ success: false, error: `Site ${site} is already disabled` });
//       }
//       cmd = `sudo a2dissite ${site}.conf && sudo apache2ctl configtest && sudo systemctl reload apache2`;
//     } else if (action === "maintenance") {
//       if (!isEnabled) {
//         return res.status(400).json({ success: false, error: `Cannot enable maintenance because site ${site} is not active` });
//       }
//       cmd = `
//         if [ ! -f ${confFile}.bak ]; then
//           sudo cp ${confFile} ${confFile}.bak;
//         fi;
//         echo '<VirtualHost *:80>
//         ServerName ${site}.local
//         DocumentRoot /var/www/html/maintenance
//         </VirtualHost>' | sudo tee ${confFile};
//         sudo apache2ctl configtest && sudo systemctl reload apache2
//       `;
//     } else {
//       return res.status(400).json({ success: false, error: "Invalid action" });
//     }

//     exec(cmd, (err, stdout, stderr) => {
//       if (err) {
//         return res.json({ success: false, error: stderr });
//       }
//       res.json({ success: true, output: stdout || "Done" });
//     });
//   });
// });


// // List all sites with enabled/disabled status
// app.get("/sites", (req, res) => {
//   const availableDir = "/etc/apache2/sites-available";
//   const enabledDir = "/etc/apache2/sites-enabled";

//   try {
//     const availableSites = fs
//       .readdirSync(availableDir)
//       .filter((file) => file.endsWith(".conf"))
//       .map((file) => file.replace(".conf", ""));

//     const enabledSites = fs
//       .readdirSync(enabledDir)
//       .filter((file) => file.endsWith(".conf"))
//       .map((file) => file.replace(".conf", ""));

//     const sites = availableSites.map((site) => ({
//       name: site,
//       status: enabledSites.includes(site) ? "enabled" : "disabled",
//     }));

//     res.json({ success: true, sites });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });


// // Add new site
// app.post("/site/add", upload.array("files"), (req, res) => {
//   const { subdomain, folder } = req.body;
//   const files = req.files;

//   if (!subdomain || !folder || !files || files.length === 0) {
//     return res.status(400).json({ success: false, error: "Missing required fields or files" });
//   }

//   const documentRoot = `/var/www/html/${folder}`;
//   const confFile = `/etc/apache2/sites-available/${subdomain}.conf`;

//   // Create directory
//   const cmd = `
//     sudo mkdir -p ${documentRoot} &&
//     sudo chown -R www-data:www-data ${documentRoot} &&
//     sudo chmod -R 755 ${documentRoot} &&
//     ${files
//       .map(
//         (file) =>
//           `sudo mv ${file.path} ${documentRoot}/${file.originalname} && sudo chown www-data:www-data ${documentRoot}/${file.originalname}`
//       )
//       .join(" && ")} &&
//     echo '<VirtualHost *:80>
//       ServerName ${subdomain}.local
//       DocumentRoot ${documentRoot}
//       <Directory ${documentRoot}>
//         Options Indexes +FollowSymLinks
//         AllowOverride All
//         Require all granted
//       </Directory>
//     </VirtualHost>' | sudo tee ${confFile} &&
//     echo '127.0.0.1 ${subdomain}.local' | sudo tee -a /etc/hosts &&
//     sudo a2ensite ${subdomain}.conf &&
//     sudo systemctl reload apache2
//   `;

//   runExec(cmd, res);
// });

// app.listen(5000, () => console.log("Backend running on http://localhost:5000"));


const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const upload = multer({ dest: "uploads/" });

// Utility to run shell commands
function runExec(cmd, res) {
  exec(cmd, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ success: false, error: stderr });
    res.json({ success: true, output: stdout || "Done" });
  });
}

// ------------------------- Routes -------------------------

// Run allowed commands
app.post("/run", (req, res) => {
  const { command } = req.body;
  const allowed = ["ls", "pwd", "whoami", "uptime"];
  if (!allowed.includes(command)) {
    return res.status(400).json({ success: false, error: "Invalid command" });
  }
  runExec(command, res);
});

// Control Apache
app.post("/apache", (req, res) => {
  const { action } = req.body;
  let cmd = "";
  if (action === "start") cmd = "sudo service apache2 start";
  if (action === "stop") cmd = "sudo service apache2 stop";
  if (action === "restart") cmd = "sudo service apache2 restart";
  if (!cmd) return res.status(400).json({ success: false, error: "Invalid action" });
  runExec(cmd, res);
});

// Enable / Disable / Maintenance
app.post("/sites", (req, res) => {
  const { site, action } = req.body;
  if (!site || !action) return res.status(400).json({ success: false, error: "Missing site or action" });

  const confFile = `/etc/apache2/sites-available/${site}.conf`;
  const enabledFile = `/etc/apache2/sites-enabled/${site}.conf`;

  // Check if site is enabled
  exec(`[ -L ${enabledFile} ] && echo "enabled" || echo "disabled"`, (err, stdout) => {
    if (err) return res.status(400).json({ success: false, error: `Site ${site} not found` });
    const isEnabled = stdout.trim() === "enabled";
    let cmd = "";

    if (action === "enable") {
      if (isEnabled) return res.status(400).json({ success: false, error: `Site ${site} is already enabled` });
      cmd = `sudo a2ensite ${site}.conf && sudo apache2ctl configtest && sudo systemctl reload apache2`;
    } else if (action === "disable") {
      if (!isEnabled) return res.status(400).json({ success: false, error: `Site ${site} is already disabled` });
      cmd = `sudo a2dissite ${site}.conf && sudo apache2ctl configtest && sudo systemctl reload apache2`;
    } else if (action === "maintenance") {
      if (!isEnabled) return res.status(400).json({ success: false, error: `Cannot enable maintenance; site ${site} is disabled` });
      cmd = `
        if [ ! -f ${confFile}.bak ]; then sudo cp ${confFile} ${confFile}.bak; fi;
        echo '<VirtualHost *:80>
        ServerName ${site}.local
        DocumentRoot /var/www/html/maintenance
        </VirtualHost>' | sudo tee ${confFile};
        sudo apache2ctl configtest && sudo systemctl reload apache2
      `;
    } else return res.status(400).json({ success: false, error: "Invalid action" });

    exec(cmd, (err, stdout, stderr) => {
      if (err) return res.json({ success: false, error: stderr });
      res.json({ success: true, output: stdout || "Done" });
    });
  });
});

// GET all sites with status
app.get("/sites", (req, res) => {
  const availableDir = "/etc/apache2/sites-available";
  const enabledDir = "/etc/apache2/sites-enabled";

  try {
    const availableSites = fs
      .readdirSync(availableDir)
      .filter((f) => f.endsWith(".conf"))
      .map((f) => f.replace(".conf", ""));

    const enabledSites = fs
      .readdirSync(enabledDir)
      .filter((f) => f.endsWith(".conf"))
      .map((f) => f.replace(".conf", ""));

    const sites = availableSites.map((site) => ({
      name: site,
      domain: `${site}.local`,
      status: enabledSites.includes(site) ? "enabled" : "disabled",
    }));

    res.json({ success: true, sites });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add new site
app.post("/site/add", upload.array("files"), (req, res) => {
  const { subdomain, folder, mainFile } = req.body; // get mainFile
  const files = req.files;

  if (!subdomain || !folder || !files || files.length === 0 || !mainFile) {
    return res.status(400).json({ success: false, error: "Missing required fields or files" });
  }

  const documentRoot = `/var/www/html/${folder}`;
  const confFile = `/etc/apache2/sites-available/${subdomain}.conf`;

  // Move all uploaded files to document root
  const moveFilesCmd = files
    .map(f => `sudo mv ${f.path} ${documentRoot}/${f.originalname} && sudo chown www-data:www-data ${documentRoot}/${f.originalname}`)
    .join(" && ");

  // Apache config pointing to the selected main file
  const cmd = `
    sudo mkdir -p ${documentRoot} &&
    sudo chown -R www-data:www-data ${documentRoot} &&
    sudo chmod -R 755 ${documentRoot} &&
    ${moveFilesCmd} &&
    echo '<VirtualHost *:80>
      ServerName ${subdomain}.local
      DocumentRoot ${documentRoot}
      DirectoryIndex ${mainFile}
      <Directory ${documentRoot}>
        Options +Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
      </Directory>
    </VirtualHost>' | sudo tee ${confFile} &&
    echo '127.0.0.1 ${subdomain}.local' | sudo tee -a /etc/hosts &&
    sudo a2ensite ${subdomain}.conf &&
    sudo systemctl reload apache2
  `;

  runExec(cmd, res);
});


// Start server
app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
