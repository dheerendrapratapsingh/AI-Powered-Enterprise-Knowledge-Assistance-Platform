import ipaddress
import socket
from urllib.parse import urlparse
from typing import List, Tuple

# Blocked private and link-local subnets (SSRF protection)
PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"), # Cloud metadata (AWS, GCP, Azure, DigitalOcean)
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 # 25 MB max download limit
REQUEST_TIMEOUT_SECONDS = 15

def is_private_ip(ip_str: str) -> bool:
    """Checks whether an IP address belongs to any blocked/private subnet."""
    try:
        ip_obj = ipaddress.ip_address(ip_str)
        for net in PRIVATE_NETWORKS:
            if ip_obj in net:
                return True
        return False
    except Exception:
        return True

def is_domain_allowed(url: str, allowed_domains: List[str]) -> bool:
    """
    Checks if a URL belongs to one of the explicitly allowed domains or subdomains.
    E.g. 'https://vitap.ac.in/admissions' matches 'vitap.ac.in'.
    """
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname
        if not hostname:
            return False
        hostname = hostname.lower()

        for allowed in allowed_domains:
            allowed = allowed.lower().strip()
            if hostname == allowed or hostname.endswith("." + allowed):
                return True
        return False
    except Exception:
        return False

def validate_url_for_ssrf(url: str) -> Tuple[bool, str]:
    """
    Validates that the target URL does not resolve to loopback, private,
    or link-local cloud metadata IPs (SSRF Prevention).
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ["http", "https"]:
            return False, f"Unsupported scheme: {parsed.scheme}. Only HTTP/HTTPS permitted."

        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid URL: No hostname detected."

        # Quick reject for literal localhost
        if hostname.lower() in ["localhost", "127.0.0.1", "0.0.0.0", "::1"]:
            return False, "Access to localhost or loopback is strictly prohibited."

        # DNS resolution check
        addr_info = socket.getaddrinfo(hostname, None)
        for item in addr_info:
            ip_str = item[4][0]
            ip_obj = ipaddress.ip_address(ip_str)
            for net in PRIVATE_NETWORKS:
                if ip_obj in net:
                    return False, f"URL resolves to restricted/private IP: {ip_str}"

        return True, "Valid"
    except socket.gaierror:
        return False, "Failed to resolve hostname via DNS."
    except Exception as e:
        return False, f"Security check failed: {str(e)}"
