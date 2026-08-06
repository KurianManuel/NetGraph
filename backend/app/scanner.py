import ipaddress
import re
import socket
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

# A simple local OUI database for common vendors to show rich aesthetics in the UI
OUI_DB = {
    "94:32:51": "Xiaomi",
    "b4:8c:9d": "Intel",
    "ae:8d:c6": "Apple",
    "be:49:ee": "Huawei",
    "cc:7b:5c": "TP-Link",
    "00:ae:f7": "Hewlett Packard",
    "9e:aa:b5": "Samsung",
    "00:1a:27": "Apple",
    "00:0c:29": "VMware",
    "00:05:cd": "Asus",
    "00:15:5d": "Microsoft",
    "3c:a6:2f": "Apple",
    "dc:a6:32": "Raspberry Pi Foundation",
    "b8:27:eb": "Raspberry Pi Foundation",
    "d8:3b:bf": "TP-Link",
    "e4:5f:01": "Raspberry Pi Foundation",
}

def get_vendor(mac: str) -> str:
    if not mac or mac == "Unknown":
        return "Unknown"
    prefix = mac.lower().replace("-", ":")[:8]
    return OUI_DB.get(prefix, "Unknown Vendor")

def get_local_ip_and_subnet():
    """
    Runs ipconfig on Windows to parse active IPv4 and Subnet Mask.
    """
    try:
        output = subprocess.check_output("ipconfig", shell=True, text=True)
    except Exception:
        return None, None

    current_section = None
    ipv4 = None
    subnet = None
    has_ip = False

    ip_re = re.compile(r"IPv4 Address[\s\.]*:\s*([\d\.]+)")
    subnet_re = re.compile(r"Subnet Mask[\s\.]*:\s*([\d\.]+)")

    for line in output.splitlines():
        if line.strip() and not line.startswith(" "):
            current_section = line.strip()
        
        ip_match = ip_re.search(line)
        if ip_match:
            val = ip_match.group(1)
            if not val.startswith("169.254") and val != "127.0.0.1":
                ipv4 = val
                has_ip = True
        
        subnet_match = subnet_re.search(line)
        if subnet_match and has_ip:
            subnet = subnet_match.group(1)
            break
        elif subnet_match:
            has_ip = False

    return ipv4, subnet

def get_local_mac():
    """
    Runs getmac on Windows to find the MAC address of the active adapter.
    """
    try:
        output = subprocess.check_output("getmac /v /fo csv", shell=True, text=True)
        import csv
        reader = csv.reader(output.strip().splitlines())
        header = next(reader, None)
        if not header:
            return None
        for row in reader:
            if len(row) >= 4:
                transport = row[3]
                physical = row[2]
                if "Tcpip" in transport and physical and physical != "N/A":
                    return physical.replace("-", ":").lower()
    except Exception:
        pass
    return None

def ping_ip(ip: str):
    """
    Pings a single IP. Returns (ip, is_online)
    """
    # Secure parameters, no shell interpolation.
    cmd = ["ping", "-n", "1", "-w", "350", str(ip)]
    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return str(ip), res.returncode == 0

def parse_arp_table():
    """
    Parses current OS ARP table.
    """
    try:
        output = subprocess.check_output(["arp", "-a"], text=True)
    except Exception:
        return {}

    arp_map = {}
    arp_re = re.compile(r"([\d\.]+)\s+([a-fA-F0-9\-]{17})\s+(dynamic|static)")

    for line in output.splitlines():
        match = arp_re.search(line)
        if match:
            ip = match.group(1)
            mac = match.group(2).replace("-", ":").lower()
            arp_map[ip] = mac
    return arp_map

def resolve_hostname(ip: str) -> str:
    try:
        host, _, _ = socket.gethostbyaddr(ip)
        return host
    except socket.herror:
        return "Unknown"

def run_ping_sweep(subnet_cidr: str = None):
    """
    Runs the full network sweep on the specified CIDR.
    If None, attempts auto-detection.
    Returns: list of dicts, active_hosts count
    """
    local_ip, subnet_mask = get_local_ip_and_subnet()
    
    # Use specified subnet or fall back to auto-detected one
    if subnet_cidr:
        try:
            net = ipaddress.IPv4Network(subnet_cidr, strict=False)
        except Exception:
            raise ValueError(f"Invalid target subnet: {subnet_cidr}")
    else:
        if not local_ip or not subnet_mask:
            # Safe default fallback for development
            local_ip = "192.168.31.39"
            subnet_mask = "255.255.255.0"
        net = ipaddress.IPv4Network(f"{local_ip}/{subnet_mask}", strict=False)
        
    hosts = list(net.hosts())
    online_ips = []
    
    # Concurrent ping sweep
    with ThreadPoolExecutor(max_workers=100) as executor:
        futures = {executor.submit(ping_ip, host): host for host in hosts}
        for future in as_completed(futures):
            ip, is_online = future.result()
            if is_online:
                online_ips.append(ip)
                
    arp_map = parse_arp_table()
    local_mac = get_local_mac()
    
    results = []
    for ip in online_ips:
        # Map local host MAC address
        if ip == local_ip and local_mac:
            mac = local_mac
        else:
            mac = arp_map.get(ip, "Unknown")
            
        hostname = resolve_hostname(ip)
        vendor = get_vendor(mac)
        
        results.append({
            "ip_address": ip,
            "mac_address": mac,
            "hostname": hostname,
            "vendor": vendor
        })
        
    return results, str(net)
