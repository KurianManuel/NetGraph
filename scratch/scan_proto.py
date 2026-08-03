import os
import re
import socket
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
import ipaddress

def get_local_ip_and_subnet():
    """
    Runs ipconfig on Windows to parse the active IPv4 and Subnet Mask.
    """
    try:
        output = subprocess.check_output("ipconfig", shell=True, text=True)
    except Exception as e:
        print(f"Error running ipconfig: {e}")
        return None, None

    current_section = None
    ipv4 = None
    subnet = None
    has_ip = False

    # Regex to match IPv4 and Subnet Mask lines (flexible matching for Windows ipconfig)
    ip_re = re.compile(r"IPv4 Address[\s\.]*:\s*([\d\.]+)")
    subnet_re = re.compile(r"Subnet Mask[\s\.]*:\s*([\d\.]+)")

    for line in output.splitlines():
        # Check if line indicates a new adapter section
        if line.strip() and not line.startswith(" "):
            current_section = line.strip()
        
        ip_match = ip_re.search(line)
        if ip_match:
            ipv4 = ip_match.group(1)
            # Skip loopback or autoconfiguration IPs (169.254.x.x)
            if not ipv4.startswith("169.254") and ipv4 != "127.0.0.1":
                has_ip = True
        
        subnet_match = subnet_re.search(line)
        if subnet_match and has_ip:
            subnet = subnet_match.group(1)
            break
        elif subnet_match:
            # reset flag if we didn't match a valid IP in this section
            has_ip = False

    return ipv4, subnet

def get_local_mac():
    """
    Runs getmac /v /fo csv on Windows to find the MAC address of the active adapter.
    """
    try:
        output = subprocess.check_output("getmac /v /fo csv", shell=True, text=True)
        import csv
        reader = csv.reader(output.strip().splitlines())
        header = next(reader, None)
        if not header:
            return None
        # Connection Name, Network Adapter, Physical Address, Transport Name
        for row in reader:
            if len(row) >= 4:
                transport = row[3]
                physical = row[2]
                # If transport name has a Tcpip binding, it means it is the active connection
                if "Tcpip" in transport and physical and physical != "N/A":
                    return physical.replace("-", ":").lower()
    except Exception as e:
        pass
    return None

def ping_ip(ip):
    """
    Pings a single IP address with a short timeout.
    Returns (ip, status_online)
    """
    # -n 1: 1 packet
    # -w 300: 300ms timeout
    cmd = ["ping", "-n", "1", "-w", "300", str(ip)]
    
    # Run the ping command securely
    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return str(ip), res.returncode == 0

def parse_arp_table():
    """
    Runs arp -a and parses the IP-to-MAC mapping.
    """
    try:
        output = subprocess.check_output(["arp", "-a"], text=True)
    except Exception as e:
        print(f"Error running arp -a: {e}")
        return {}

    arp_map = {}
    # Line format: 192.168.31.1          94-32-51-56-a2-35     dynamic
    arp_re = re.compile(r"([\d\.]+)\s+([a-fA-F0-9\-]{17})\s+(dynamic|static)")

    for line in output.splitlines():
        match = arp_re.search(line)
        if match:
            ip = match.group(1)
            mac = match.group(2).replace("-", ":").lower()
            arp_map[ip] = mac
    return arp_map

def resolve_hostname(ip):
    """
    Tries to resolve hostnames via reverse DNS.
    """
    try:
        host, _, _ = socket.gethostbyaddr(ip)
        return host
    except socket.herror:
        return "Unknown"

def main():
    print("=== NetGraph Discovery Scanner Prototype ===")
    
    # 1. Detect Network
    local_ip, subnet_mask = get_local_ip_and_subnet()
    if not local_ip or not subnet_mask:
        print("Failed to auto-detect active IPv4 network interface.")
        # Fallback defaults for testing
        local_ip = "192.168.31.39"
        subnet_mask = "255.255.255.0"
        print(f"Using fallback defaults: IP {local_ip}, Mask {subnet_mask}")
    
    print(f"Detected Local IP: {local_ip}")
    print(f"Detected Subnet Mask: {subnet_mask}")
    
    # Calculate network CIDR
    try:
        net = ipaddress.IPv4Network(f"{local_ip}/{subnet_mask}", strict=False)
        network_cidr = str(net)
        print(f"Target Subnet: {network_cidr}")
    except Exception as e:
        print(f"Error calculating subnet: {e}")
        sys.exit(1)
        
    hosts = list(net.hosts())
    print(f"Number of target hosts to scan: {len(hosts)}")
    print("\nScanning network... (please wait)")
    
    online_hosts = []
    
    # 2. Ping sweep in parallel
    # A ThreadPoolExecutor handles concurrent pings.
    # 100 concurrent workers allow scanning /24 subnet in < 3 seconds.
    with ThreadPoolExecutor(max_workers=100) as executor:
        futures = {executor.submit(ping_ip, host): host for host in hosts}
        for future in as_completed(futures):
            ip, is_online = future.result()
            if is_online:
                online_hosts.append(ip)
                
    print(f"Scan complete. Found {len(online_hosts)} active hosts responding to Ping.")
    
    # 3. Retrieve MAC addresses from ARP table
    print("\nRetrieving MAC addresses from system ARP cache...")
    arp_map = parse_arp_table()
    
    # 4. Compile and display results
    print("\n=== Active Discovered Devices ===")
    print(f"{'IP Address':<18} | {'MAC Address':<20} | {'Hostname':<30}")
    print("-" * 74)
    
    discovered_count = 0
    local_mac = get_local_mac()
    
    for ip in sorted(online_hosts, key=lambda x: ipaddress.IPv4Address(x)):
        if ip == local_ip and local_mac:
            mac = local_mac
        else:
            mac = arp_map.get(ip, "Unknown (Check Firewall)")
            
        hostname = resolve_hostname(ip)
        
        # Format printing
        print(f"{ip:<18} | {mac:<20} | {hostname:<30}")
        discovered_count += 1
        
    print("-" * 74)
    print(f"Total active devices found: {discovered_count}")

if __name__ == "__main__":
    main()
