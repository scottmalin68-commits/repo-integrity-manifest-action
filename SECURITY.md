# Security Policy

## Supported Versions

The following versions of **repo-integrity-manifest-action** are currently supported with security updates:

| Version | Supported |
|---------|-----------|
| v1.x.x  | ✔ Active |
| < v1.0.0 | ✖ No longer supported |

Only the latest major version (`v1`) receives security fixes.  
Users are encouraged to pin to `@v1` for long-term stability.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public issue**.

Instead, report it privately via GitHub’s coordinated disclosure process:

**https://github.com/scottmalin68-commits/repo-integrity-manifest-action/security/advisories/new**

Please include:

- A clear description of the issue  
- Steps to reproduce (if applicable)  
- Potential impact  
- Any suggested remediation  

We will acknowledge receipt within **48 hours** and provide a status update within **5 business days**.

---

## What This Action Does *Not* Do

This Action does **not**:

- Access external networks  
- Transmit repository data to third parties  
- Collect telemetry  
- Store or process data outside the GitHub runner  
- Modify files outside `.governance/`  

All processing occurs **locally on the GitHub Actions runner**.

---

## Security Posture

This Action is designed with governance and integrity in mind:

- All file metadata is processed locally  
- No external dependencies beyond system utilities  
- Deterministic output for reproducibility  
- No privileged operations  
- No secrets required  
- No write operations outside `.governance/`  

The Action commits only the generated manifest files and does not alter any other repository content.

---

## Responsible Disclosure

We follow a responsible disclosure model.  
If a vulnerability is confirmed, we will:

1. Prepare a fix  
2. Publish a GitHub Security Advisory  
3. Release a patched version (e.g., `v1.0.1`)  
4. Update documentation as needed  

Thank you for helping keep this project secure and trustworthy.
