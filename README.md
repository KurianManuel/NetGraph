# NetGraph

Intelligent Network Discovery & Topology Mapping Platform.

NetGraph is a self-hosted network discovery and monitoring tool that automatically scans local subnets, identifies connected devices, visualizes network topology, tracks historical changes, and provides security insights through a modern web dashboard.

## Features

- **Local Network Discovery:** Fast concurrent ping sweeps and ARP scans to discover active hosts.
- **Topology Mapping:** Dynamic graph visualization of devices on your network.
- **Historical Inventory:** Tracks when devices appear, change IPs, or go offline.
- **Security Audit & Insights:** Alerts for insecure open ports and configurations.
- **Audit Logs:** Full logging of administrative actions for security tracking.

## Repository Layout

- `backend/`: FastAPI backend and core network scanning engine.
- `frontend/`: React, TypeScript, and Vite-based web client.
- `scratch/`: Experimental scripts and prototypes.

## Running the Scanning Prototype

To run the local network scanning prototype natively (no dependencies, no root privileges required):

```bash
python scratch/scan_proto.py
```
