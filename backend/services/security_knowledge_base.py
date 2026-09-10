"""
Structured security knowledge mapped to Bandit test IDs and CWE identifiers.
Analysis is derived from vulnerability metadata — not simulated LLM output.
"""

from typing import Any


VULNERABILITY_PROFILES: dict[str, dict[str, Any]] = {
    "B105": {
        "title": "Hardcoded Password",
        "simple_explanation": (
            "Credentials stored directly in source code may be exposed "
            "through version control, logs, or unauthorized repository access."
        ),
        "technical_explanation": (
            "Bandit detected a hardcoded password string (CWE-259). "
            "Static secrets in code bypass rotation policies and appear in "
            "git history, CI logs, and crash dumps."
        ),
        "business_impact": (
            "Attackers gaining repository or deployment access can compromise "
            "systems, databases, and third-party services using the exposed credentials."
        ),
        "attack_scenario": (
            "An attacker clones the repository or reads a deployed container image, "
            "extracts the hardcoded password, and uses it to authenticate to "
            "production services."
        ),
        "risk_reasoning": (
            "Severity reflects credential exposure risk combined with Bandit confidence. "
            "Hardcoded secrets are a common initial access vector in breaches."
        ),
        "remediation": (
            "Remove hardcoded credentials. Use environment variables, a secrets manager "
            "(AWS Secrets Manager, HashiCorp Vault), or runtime configuration injection."
        ),
        "secure_coding_example": (
            "import os\n"
            "password = os.environ.get('DB_PASSWORD')\n"
            "if not password:\n"
            "    raise RuntimeError('DB_PASSWORD environment variable is required')"
        ),
    },
    "B404": {
        "title": "Subprocess Module Import",
        "simple_explanation": (
            "The subprocess module can execute operating system commands. "
            "If user input reaches shell execution, attackers may run arbitrary commands."
        ),
        "technical_explanation": (
            "Importing subprocess (CWE-78) enables OS command execution. "
            "Risk increases when combined with shell=True or unsanitized user input."
        ),
        "business_impact": (
            "Command injection can lead to full server compromise, data exfiltration, "
            "and lateral movement within infrastructure."
        ),
        "attack_scenario": (
            "User-controlled input is passed to subprocess.call with shell=True, "
            "allowing injection of commands such as '; rm -rf /' or reverse shells."
        ),
        "risk_reasoning": (
            "Import alone is informational; severity rises when used with shell=True "
            "or external input (see B602/B603)."
        ),
        "remediation": (
            "Avoid shell=True. Pass arguments as a list. Validate and allowlist inputs. "
            "Prefer higher-level libraries over raw shell invocation."
        ),
        "secure_coding_example": (
            "import subprocess\n"
            "subprocess.run(['ls', '-la', safe_directory], check=True, shell=False)"
        ),
    },
    "B602": {
        "title": "Subprocess with Shell=True",
        "simple_explanation": (
            "Running subprocess with shell=True passes commands through a shell, "
            "making command injection possible if any input is attacker-controlled."
        ),
        "technical_explanation": (
            "shell=True (CWE-78) invokes /bin/sh -c, interpreting metacharacters. "
            "Concatenated or formatted user input enables injection."
        ),
        "business_impact": (
            "Successful injection grants attackers the privileges of the application process, "
            "potentially leading to data theft or service disruption."
        ),
        "attack_scenario": (
            "Application builds a command string from user input and executes it with "
            "shell=True, allowing the attacker to append arbitrary shell commands."
        ),
        "risk_reasoning": (
            "High confidence findings with shell=True are critical because injection "
            "requires no additional vulnerabilities."
        ),
        "remediation": (
            "Set shell=False and pass command as a list of arguments. "
            "Sanitize inputs with strict allowlists."
        ),
        "secure_coding_example": (
            "subprocess.run(['ping', '-c', '4', validated_host], shell=False, check=True)"
        ),
    },
    "B608": {
        "title": "SQL Injection",
        "simple_explanation": (
            "User input is concatenated into SQL queries, allowing attackers "
            "to modify query logic and access or manipulate database data."
        ),
        "technical_explanation": (
            "String formatting in SQL (CWE-89) breaks query structure. "
            "Attackers inject UNION, OR 1=1, or stacked queries to bypass authentication "
            "or exfiltrate data."
        ),
        "business_impact": (
            "Data breaches, regulatory fines, reputational damage, and unauthorized "
            "modification or deletion of business-critical records."
        ),
        "attack_scenario": (
            "Login form input ' OR '1'='1' -- bypasses authentication. "
            "UNION-based injection extracts user tables."
        ),
        "risk_reasoning": (
            "SQL injection is consistently in OWASP Top 10. Severity is typically HIGH "
            "when user input reaches query construction."
        ),
        "remediation": (
            "Use parameterized queries or ORM methods. Never concatenate user input into SQL. "
            "Apply least-privilege database accounts."
        ),
        "secure_coding_example": (
            "cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))"
        ),
    },
    "B501": {
        "title": "Insecure Request with verify=False",
        "simple_explanation": (
            "Disabling TLS certificate verification allows man-in-the-middle attacks "
            "where traffic can be intercepted or modified."
        ),
        "technical_explanation": (
            "requests with verify=False (CWE-295) skips certificate chain validation, "
            "accepting self-signed or malicious certificates."
        ),
        "business_impact": (
            "Sensitive API tokens, credentials, and customer data may be intercepted "
            "on untrusted networks."
        ),
        "attack_scenario": (
            "Attacker on the same network performs MITM, presents a rogue certificate, "
            "and captures authentication headers from the application."
        ),
        "risk_reasoning": (
            "TLS verification is a baseline control. Disabling it removes transport-layer "
            "integrity for all affected requests."
        ),
        "remediation": (
            "Always use verify=True (default). Pin certificates or use a trusted CA bundle. "
            "Fix certificate issues on the server rather than disabling verification."
        ),
        "secure_coding_example": (
            "response = requests.get(url, timeout=10, verify=True)"
        ),
    },
    "B201": {
        "title": "Flask Debug Mode Enabled",
        "simple_explanation": (
            "Running Flask with debug=True exposes an interactive debugger "
            "that can execute arbitrary Python code on the server."
        ),
        "technical_explanation": (
            "Debug mode (CWE-215) enables Werkzeug debugger PIN bypass risks and "
            "verbose error pages leaking stack traces and environment details."
        ),
        "business_impact": (
            "Remote code execution in production leads to full application and "
            "infrastructure compromise."
        ),
        "attack_scenario": (
            "Attacker triggers an error, accesses the Werkzeug debugger console, "
            "and executes Python code with server privileges."
        ),
        "risk_reasoning": (
            "Debug mode must never run in production; findings are treated as HIGH severity."
        ),
        "remediation": (
            "Set debug=False in production. Use environment-specific configuration. "
            "Enable debug only on local development machines."
        ),
        "secure_coding_example": (
            "app.run(debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true')"
        ),
    },
}

CWE_PROFILES: dict[int, dict[str, str]] = {
    259: {
        "title": "Use of Hard-coded Password",
        "remediation": "Store secrets outside source code using a secrets manager.",
    },
    78: {
        "title": "OS Command Injection",
        "remediation": "Avoid shell invocation; validate all external inputs.",
    },
    89: {
        "title": "SQL Injection",
        "remediation": "Use parameterized queries and ORM escaping.",
    },
    295: {
        "title": "Improper Certificate Validation",
        "remediation": "Enable TLS verification and use trusted certificates.",
    },
    215: {
        "title": "Insertion of Sensitive Information Into Debugging Code",
        "remediation": "Disable debug features in production deployments.",
    },
}

GENERIC_PROFILE: dict[str, str] = {
    "title": "Security Issue",
    "simple_explanation": (
        "Bandit identified a pattern associated with insecure coding practices "
        "based on the reported test and severity."
    ),
    "technical_explanation": (
        "Review the Bandit test ID, CWE reference, and affected code location "
        "to understand the specific weakness."
    ),
    "business_impact": (
        "Unresolved security issues increase the likelihood of exploitation, "
        "data loss, and operational disruption."
    ),
    "attack_scenario": (
        "An attacker leverages the reported weakness in the affected code path "
        "to bypass controls or access sensitive resources."
    ),
    "risk_reasoning": (
        "Risk is assessed from Bandit severity and confidence levels combined "
        "with the nature of the reported issue."
    ),
    "remediation": (
        "Follow Bandit documentation for the reported test. Apply secure coding "
        "guidelines and re-scan after remediation."
    ),
    "secure_coding_example": (
        "# Refer to OWASP Secure Coding Practices and Bandit plugin documentation\n"
        "# for test-specific remediation patterns."
    ),
}

ASSISTANT_TOPICS: dict[str, dict[str, Any]] = {
    "sql injection": {
        "answer": (
            "SQL Injection occurs when untrusted input is concatenated into SQL queries, "
            "allowing attackers to alter query logic."
        ),
        "recommendations": [
            "Use parameterized queries or ORM methods exclusively.",
            "Apply least-privilege database permissions.",
            "Validate and sanitize all user inputs.",
            "Use stored procedures where appropriate with proper parameter binding.",
        ],
    },
    "hardcoded password": {
        "answer": (
            "Hardcoded passwords expose credentials in source code and version control. "
            "Anyone with repository access can retrieve them."
        ),
        "recommendations": [
            "Move secrets to environment variables or a secrets manager.",
            "Rotate any credentials that were ever committed to git history.",
            "Add pre-commit hooks to detect secrets before push.",
        ],
    },
    "command injection": {
        "answer": (
            "Command injection happens when user input is passed to a system shell, "
            "allowing execution of arbitrary OS commands."
        ),
        "recommendations": [
            "Never use shell=True with subprocess.",
            "Pass arguments as lists, not concatenated strings.",
            "Allowlist permitted inputs and reject unexpected characters.",
        ],
    },
    "xss": {
        "answer": (
            "Cross-Site Scripting (XSS) allows attackers to inject malicious scripts "
            "into web pages viewed by other users."
        ),
        "recommendations": [
            "Encode output based on context (HTML, JavaScript, URL).",
            "Use Content Security Policy (CSP) headers.",
            "Validate input on the server side.",
        ],
    },
    "severity high": {
        "answer": (
            "HIGH severity indicates vulnerabilities that are likely exploitable "
            "with significant impact, such as injection flaws or remote code execution vectors."
        ),
        "recommendations": [
            "Prioritize HIGH findings for immediate remediation.",
            "Verify exploitability in your specific deployment context.",
            "Re-scan after fixes to confirm resolution.",
        ],
    },
    "improve security": {
        "answer": (
            "Improve application security through defense in depth: secure coding, "
            "automated scanning, dependency updates, and least-privilege access."
        ),
        "recommendations": [
            "Integrate SAST tools like Bandit into CI/CD pipelines.",
            "Keep dependencies patched and monitor CVE advisories.",
            "Conduct regular security reviews and threat modeling.",
            "Use secrets management and environment-based configuration.",
        ],
    },
}


def get_profile_for_vulnerability(finding: dict) -> dict[str, Any]:
    """Resolve the best knowledge-base profile for a Bandit finding."""
    test_id = finding.get("test_id", "")
    if test_id in VULNERABILITY_PROFILES:
        return {**GENERIC_PROFILE, **VULNERABILITY_PROFILES[test_id]}

    cwe_id = finding.get("issue_cwe", {}).get("id")
    if cwe_id and cwe_id in CWE_PROFILES:
        cwe = CWE_PROFILES[cwe_id]
        return {
            **GENERIC_PROFILE,
            "title": cwe["title"],
            "remediation": cwe["remediation"],
            "technical_explanation": (
                f"Bandit mapped this finding to CWE-{cwe_id}: {cwe['title']}."
            ),
        }

    return {**GENERIC_PROFILE}


def match_assistant_topic(question: str) -> dict[str, Any] | None:
    """Match a user question to a structured assistant topic."""
    normalized = question.lower().strip()
    for keyword, response in ASSISTANT_TOPICS.items():
        if keyword in normalized:
            return response
    return None
