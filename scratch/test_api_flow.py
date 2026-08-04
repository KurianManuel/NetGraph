import urllib.request
import urllib.parse
import json
import time
import http.cookiejar

API_URL = "http://127.0.0.1:8000/api"

# Set up automatic cookie handling to simulate browser HTTP-Only cookie storage
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
urllib.request.install_opener(opener)

def make_request(path, method="GET", data=None):
    url = f"{API_URL}{path}"
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, method=method)
    req.add_header("Content-Type", "application/json")
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            if res_body:
                return json.loads(res_body)
            return None
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_body)
            print(f"HTTP ERROR {e.code}: {err_json}")
        except Exception:
            print(f"HTTP ERROR {e.code}: {err_body}")
        raise e

def main():
    print("=== NetGraph API Integration Verification ===")
    
    # 1. Setup Initial Admin
    print("\n[1] Registering Initial Admin Account...")
    try:
        admin_data = {
            "username": "admin_test",
            "password": "password_test"
        }
        setup_res = make_request("/auth/setup", "POST", admin_data)
        print("Admin user registered successfully:")
        print(json.dumps(setup_res, indent=2))
    except Exception as e:
        print("Setup skipped (might already be completed). Proceeding to login...")

    # 2. Login
    print("\n[2] Logging In...")
    login_data = {
        "username": "admin_test",
        "password": "password_test"
    }
    login_res = make_request("/auth/login", "POST", login_data)
    print("Login successful. Cookies set:")
    for cookie in cj:
        print(f" - {cookie.name}: {cookie.value[:10]}...")

    # 3. Trigger Subnet Scan
    print("\n[3] Triggering Subnet Scanning (Background task)...")
    trigger_res = make_request("/scans/trigger", "POST", {})
    print("Scan trigger accepted:", trigger_res)

    # 4. Poll for Scan Completion
    print("\n[4] Polling scan progress...")
    scan_completed = False
    for i in range(10): # Poll up to 10 times (20 seconds max)
        print(f"Checking scan status (attempt {i+1})...")
        scans = make_request("/scans", "GET")
        if scans and len(scans) > 0:
            latest_scan = scans[0]
            # Since scans list is sorted by time desc, latest is scans[0]
            if latest_scan["duration"] > 0:
                print(f"Scan complete! Duration: {latest_scan['duration']}s on subnet {latest_scan['subnet']}")
                scan_completed = True
                break
        time.sleep(2)
        
    if not scan_completed:
        print("Scan timed out or duration not updated. Proceeding anyway...")

    # 5. List Discovered Devices
    print("\n[5] Fetching discovered devices inventory...")
    devices = make_request("/devices", "GET")
    print(f"Found {len(devices)} devices in inventory:")
    for dev in devices:
        print(f" - IP: {dev['ip_address']:<15} | MAC: {dev['mac_address']:<18} | Host: {dev['hostname']:<25} | Vendor: {dev['vendor']}")

    # 6. Retrieve Audit Logs
    print("\n[6] Fetching System Audit Logs...")
    logs = make_request("/audit-logs", "GET")
    print(f"Retrieved {len(logs)} audit entries:")
    # Print latest 5 logs
    for log in logs[:5]:
        print(f" - [{log['created_at']}] ACTION: {log['action']:<15} | USER: {log['username']:<12} | IP: {log['ip_address']}")

if __name__ == "__main__":
    main()
