 # Product Requirements Document (PRD)

# NetGraph

### Intelligent Network Discovery & Topology Mapping Platform

**Version:** 1.0

**Author:** Kurian Manuel

**Status:** Planning

---

# 1. Vision

NetGraph is a self-hosted network discovery and monitoring platform that automatically scans local networks, identifies connected devices, visualizes network topology, tracks historical changes, and provides security insights through a modern web dashboard.

Unlike traditional network scanners that provide a snapshot of the current network, NetGraph aims to become a lightweight network asset management and change intelligence platform.

---

# 2. Problem Statement

Most free network scanning tools have one or more of the following limitations:

* Outdated user interfaces
* No historical tracking
* No topology visualization
* No centralized dashboard
* Limited reporting
* No change detection
* Difficult for beginners to understand

Users often need multiple tools to perform network discovery, topology mapping, inventory management, and basic security assessment.

NetGraph aims to consolidate these capabilities into a single, modern platform.

---

# 3. Goals

### Primary Goals

* Discover all devices on a local network
* Display network topology visually
* Maintain a historical inventory
* Detect changes between scans
* Generate useful reports
* Provide a clean and responsive web interface

### Secondary Goals

* Security insights
* Continuous monitoring
* Alerting
* API for automation
* Plugin architecture

---

# 4. Target Users

### Primary

* Students
* Cybersecurity learners
* Home lab enthusiasts
* Network administrators
* Small businesses

### Secondary

* MSPs
* IT support teams
* Open-source contributors

---

# 5. Scope

## In Scope

* Local network discovery
* Device identification
* Port scanning
* Service detection
* Interactive topology
* Dashboard
* Historical tracking
* Reporting
* User authentication
* REST API

## Out of Scope (Version 1)

* Vulnerability exploitation
* Packet capture
* Deep packet inspection
* Cloud infrastructure discovery
* Enterprise SDN integration

---

# 6. Functional Requirements

## FR-1 User Authentication

Users shall be able to:

* Login
* Logout
* Change password
* Manage profile

Future:

* Role-based permissions

---

## FR-2 Network Discovery

The system shall:

* Detect active hosts
* Discover IP addresses
* Resolve hostnames
* Collect MAC addresses
* Identify vendors

Supported discovery methods:

* ARP
* ICMP
* TCP Ping

---

## FR-3 Device Identification

For every discovered device store:

* Hostname
* IPv4
* IPv6 (future)
* MAC
* Vendor
* Operating System
* First Seen
* Last Seen
* Response Time

---

## FR-4 Port Scanning

Support:

* Quick scan
* Full scan
* Custom ports

Store:

* Open ports
* Closed ports
* Filtered ports
* Service names
* Service versions

---

## FR-5 Service Detection

Identify services such as:

* HTTP
* HTTPS
* SSH
* FTP
* SMTP
* DNS
* SMB
* MySQL
* PostgreSQL
* MongoDB

---

## FR-6 Topology Mapping

Generate an interactive network graph.

Features:

* Drag nodes
* Zoom
* Pan
* Search
* Device icons
* Group devices
* Highlight paths

---

## FR-7 Dashboard

Display:

* Devices Online
* Devices Offline
* Routers
* Switches
* Servers
* Unknown Devices
* Total Open Ports
* Recent Changes
* Scan Status

---

## FR-8 Device Details

Each device page shall display:

* Basic information
* Open ports
* Services
* Scan history
* Uptime
* Notes
* Tags

---

## FR-9 Historical Tracking

Store every scan.

Support:

* Device history
* Port history
* Hostname changes
* IP changes
* MAC changes

---

## FR-10 Change Detection

Detect:

* New devices
* Removed devices
* New ports
* Closed ports
* Changed hostnames
* Changed operating systems

Generate a comparison report.

---

## FR-11 Security Insights

Highlight:

* Telnet enabled
* FTP enabled
* SMBv1
* Anonymous FTP
* Open RDP
* Weak configurations

Assign a basic risk score.

---

## FR-12 Reports

Generate:

* PDF
* CSV
* JSON

Reports:

* Asset Inventory
* Scan Summary
* Security Report
* Network Changes
* Device Inventory

---

## FR-13 Continuous Monitoring

Allow scheduled scans.

Examples:

* Every hour
* Every day
* Every week

Notify users when changes occur.

---

## FR-14 REST API

Provide endpoints for:

* Devices
* Networks
* Scans
* Reports
* Alerts

---

## FR-15 Security & Hardening

The system shall enforce the following security controls:

* **Command Injection Prevention:** All system commands (e.g., executing Nmap) must be invoked securely using parameter lists without shell interpolation (`shell=False`).
* **Input Validation:** All user-provided scan targets must be parsed and validated as valid IPv4/IPv6 addresses or CIDR subnets.
* **Scan Range Restrictions:** By default, restrict scanning to private subnets (RFC 1918). Public scans must require administrative opt-in.
* **Credential Encryption:** Any stored credentials (e.g., SNMP community strings, SSH keys) must be encrypted at rest in the database using AES-256-GCM.
* **Audit Logging:** Record sensitive events (logins, scan executions, setting modifications) in a read-only system log.
* **Rate Limiting:** Throttle login attempts and scan execution requests to prevent brute-force attacks and resource exhaustion.

---

# 7. Non-Functional Requirements

Performance

* Scan /24 network in under 60 seconds (host discovery)
* Dashboard loads in under 2 seconds
* Support at least 500 devices in the database

Reliability

* Automatic retries
* Graceful error handling
* Logging

Security

* Password hashing (Argon2id or bcrypt)
* JWT authentication via HttpOnly, Secure, SameSite cookies
* HTTPS support via reverse proxy (Caddy/Nginx)
* Strict CORS policy restricting frontend origin access in production
* Hardened Docker containers running as non-root with limited network capabilities (NET_ADMIN, NET_RAW)

Usability

* Responsive UI
* Dark mode
* Mobile-friendly dashboard

---

# 8. Suggested Technology Stack

Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Query
* React Router
* Cytoscape.js
* Chart.js

Backend

* Python
* FastAPI
* SQLAlchemy
* Alembic
* Uvicorn

Scanning

* Scapy
* python-nmap
* dnspython
* pysnmp (future)

Database

* PostgreSQL

Development

* Docker
* Docker Compose
* GitHub Actions
* Pytest
* Playwright

---

# 9. Database Design

## Devices

* id
* hostname
* ip_address
* mac_address
* vendor
* operating_system
* first_seen
* last_seen

## Scans

* id
* scan_time
* duration
* subnet
* scan_type

## DeviceScan

Maps devices to scans.

## Ports

* device_id
* port
* protocol
* state
* service
* version

## Alerts

* id
* type
* severity
* description
* created_at

## Users

* id
* username
* password_hash
* role
* created_at

## AuditLogs

* id
* user_id (optional)
* action
* ip_address
* details (text or json)
* created_at

---

# 10. User Flow

Login

↓

Dashboard

↓

Start Scan

↓

Network Discovery

↓

Device Identification

↓

Port Scan

↓

Save Results

↓

Generate Topology

↓

View Dashboard

↓

Generate Reports

---

# 11. API Design

GET /devices

Returns all devices.

GET /devices/{id}

Returns device details.

POST /scan

Starts a scan.

GET /scans

Returns scan history.

GET /alerts

Returns active alerts.

GET /topology

Returns graph data.

GET /reports

Lists generated reports.

POST /auth/login

Authenticates a user and returns a session/JWT token.

GET /audit-logs

Returns system audit logs (Admin only).

---

# 12. UI Pages

Authentication

* Login

Dashboard

* Statistics
* Topology
* Alerts

Devices

* Device List
* Device Details

Scans

* Scan History
* Compare Scans

Reports

* Generate
* Download

Settings

* Network
* Users
* Preferences

---

# 13. Development Milestones

## Milestone 1 (MVP)

* Authentication
* Device discovery
* Database
* Dashboard
* Device list

## Milestone 2

* Port scanning
* Service detection
* Device details

## Milestone 3

* Interactive topology
* Scan history
* Change detection

## Milestone 4

* Reports
* Alerts
* Security insights

## Milestone 5

* REST API
* Docker deployment
* Documentation
* Public release

---

# 14. Future Enhancements

* SNMP polling
* LLDP/CDP support
* VLAN visualization
* Multi-network management
* Plugin marketplace
* Remote agents
* Email/Slack/Discord notifications
* Authentication via OAuth
* Multi-user collaboration
* AI-assisted network summaries (optional)

---

# 15. Success Metrics

Technical

* Successful discovery of >95% of active hosts on a local subnet
* Stable scans with no crashes
* Dashboard response time under 2 seconds

User Experience

* One-click network scan
* Interactive topology generation
* Easy-to-read reports
* Clear visualization of network changes

Portfolio Goals

* Production-quality codebase
* Comprehensive documentation
* Docker deployment
* Automated testing
* CI/CD pipeline
* Public GitHub repository with examples and screenshots

---

# 16. Guiding Principles

* Build the scanner as a modular engine, not just a wrapper around Nmap.
* Separate scanning, data storage, analysis, and visualization into independent modules.
* Design for extensibility through clear interfaces and future plugin support.
* Prioritize a polished user experience alongside technical depth.
* Every feature should answer a real operational question, not simply display raw data.
