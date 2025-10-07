# Pharmalens Documentation Unlocker - Secure Edition

## 🔒 Enhanced Security System

This is the **Secure Edition** of the Pharmalens Documentation Unlocker, featuring advanced security measures, tamper detection, and comprehensive audit capabilities.

## 🚀 Quick Start

### Secure Launch
```bash
# Use the secure launcher (recommended)
secure-launcher.bat

# Or launch directly
node pharmalens-secure.cjs
```

### ⚠️ Important Security Notice
- **DO NOT** use the legacy `unlock-docs.bat` or `file-encrypt.cjs` directly
- Always use the secure system for enhanced protection
- All operations are logged and monitored

## 🛡️ Security Features

### 1. **Multi-Layer Authentication**
- Master password authentication
- Session management with timeout
- Rate limiting on failed attempts
- Account lockout protection

### 2. **Advanced Encryption**
- AES-256-GCM encryption (upgraded from CBC)
- PBKDF2 key derivation with high iterations
- Cryptographically secure random salt/IV generation
- Authenticated encryption with integrity checks

### 3. **Tamper Detection**
- File integrity monitoring using SHA-256 hashes
- System file verification before each operation
- Detection of unauthorized modifications
- Automatic security lockdown on tampering

### 4. **Access Control**
- Secure session management
- Operation authorization checks
- Environment variable security validation
- Process isolation and sandboxing

### 5. **Comprehensive Auditing**
- All operations logged with timestamps
- Security event monitoring
- Failed attempt tracking
- Audit trail export capabilities

### 6. **System Hardening**
- Secure file permissions
- Environment variable sanitization
- Memory protection measures
- Network security checks

## 📁 File Structure

```
pharmalens-secure/
├── pharmalens-secure.cjs      # Main secure application
├── secure-wrapper.cjs         # Security wrapper layer
├── security-enhancer.cjs      # Core security engine
├── secure-launcher.bat        # Secure batch launcher
├── SECURITY_README.md         # This documentation
└── security.log              # Audit log (auto-generated)
```

## 🔧 System Requirements

- **Node.js** 14.0 or higher
- **Windows** 10/11 (for batch launcher)
- **Disk Space** 50MB minimum
- **Memory** 512MB available RAM

## 📋 Usage Guide

### Main Menu Options

#### 📁 File Operations
1. **Encrypt Documentation File** - Secure single file encryption
2. **Decrypt Documentation File** - Secure single file decryption
3. **Batch Encrypt Multiple Files** - Process multiple files at once
4. **Batch Decrypt Multiple Files** - Decrypt multiple files
5. **List Encrypted Files** - View all encrypted files with metadata

#### 🔍 Security & Status
6. **Check System Status** - View overall security status
7. **Verify Password Strength** - Test password complexity
8. **Security Report** - Comprehensive security analysis
9. **View Audit Log** - Review security events

#### 🛠️ Maintenance
10. **Cleanup Operations** - Secure file cleanup with confirmation
11. **System Diagnostics** - Check system health
12. **Export Security Report** - Generate security report file

### Password Requirements

Passwords must meet the following criteria:
- **Minimum 12 characters**
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- No common dictionary words
- No sequential patterns

## 🔐 Security Configuration

### Default Security Settings
```javascript
{
  "sessionTimeout": 1800000,        // 30 minutes
  "maxPasswordAttempts": 3,         // Before lockout
  "lockoutDuration": 300000,        // 5 minutes
  "keyDerivationIterations": 100000, // PBKDF2 iterations
  "encryptionAlgorithm": "aes-256-gcm",
  "hashAlgorithm": "sha256",
  "auditLogEnabled": true,
  "integrityCheckEnabled": true
}
```

### Environment Variables
```bash
PHARMALENS_SECURE_MODE=1          # Enable secure mode
PHARMALENS_AUDIT_ENABLED=1        # Enable audit logging
PHARMALENS_INTEGRITY_CHECK=1      # Enable integrity checks
```

## 🚨 Security Alerts

### Critical Issues That Trigger Lockdown
- **File Tampering** - Modification of core system files
- **Integrity Violations** - Hash mismatches in encrypted files
- **Bypass Attempts** - Detection of security bypass variables
- **Suspicious Processes** - Presence of debugging/hacking tools
- **Multiple Failed Logins** - Exceeding authentication attempts

### Warning Conditions
- **Legacy Files Present** - Old insecure files detected
- **Admin Privileges** - Running with elevated permissions
- **Debug Mode** - Debug environment variables found
- **Weak Passwords** - Passwords not meeting complexity requirements

## 📊 Audit and Monitoring

### Logged Events
- Authentication attempts (success/failure)
- File operations (encrypt/decrypt)
- Security violations
- System status checks
- Configuration changes
- Error conditions

### Log Format
```
[TIMESTAMP] LEVEL: EVENT_TYPE - Description (Additional Info)
```

### Example Log Entries
```
[2024-01-15 10:30:15] INFO: AUTH_SUCCESS - User authenticated successfully
[2024-01-15 10:31:22] INFO: OPERATION_START - Starting operation: encrypt
[2024-01-15 10:31:25] INFO: OPERATION_SUCCESS - Operation completed: encrypt
[2024-01-15 10:35:10] WARNING: WEAK_PASSWORD - Password strength below requirements
[2024-01-15 10:40:33] CRITICAL: INTEGRITY_VIOLATION - File tampering detected
```

## 🔧 Troubleshooting

### Common Issues

#### "System integrity check failed"
- **Cause**: Core files missing or modified
- **Solution**: Restore original secure files from backup

#### "Authentication failed repeatedly"
- **Cause**: Incorrect password or account locked
- **Solution**: Wait for lockout period to expire, verify password

#### "Node.js not found"
- **Cause**: Node.js not installed or not in PATH
- **Solution**: Install Node.js from https://nodejs.org/

#### "Permission denied"
- **Cause**: Insufficient file permissions
- **Solution**: Check file permissions, avoid running as administrator

### Security Recovery

If the system detects tampering:
1. **Stop all operations immediately**
2. **Review audit logs** for suspicious activity
3. **Restore files** from known good backup
4. **Change passwords** if compromise suspected
5. **Run full system scan** for malware

## 🔄 Migration from Legacy System

### From Original file-encrypt.cjs
1. **Backup** existing encrypted files
2. **Install** secure system files
3. **Test** decryption with legacy files
4. **Re-encrypt** files with secure system
5. **Remove** legacy files

### Compatibility Notes
- Legacy `.encrypted` files are **compatible**
- Password hashes may need **regeneration**
- Audit logs start **fresh** with secure system

## 🛡️ Best Practices

### Security Recommendations
1. **Use strong, unique passwords** for each encryption operation
2. **Regularly update** the secure system components
3. **Monitor audit logs** for suspicious activity
4. **Backup encrypted files** to secure locations
5. **Remove legacy files** to prevent bypass
6. **Run with standard privileges** (not administrator)
7. **Keep Node.js updated** to latest stable version

### Operational Guidelines
1. **Always use secure launcher** instead of direct execution
2. **Verify system status** before critical operations
3. **Export security reports** regularly
4. **Review audit logs** weekly
5. **Test recovery procedures** periodically

## 📞 Support and Contact

### Security Issues
- **Critical vulnerabilities**: Report immediately to system administrator
- **Suspected tampering**: Isolate system and investigate
- **Lost passwords**: Use recovery procedures if available

### System Updates
- Check for updates regularly
- Test updates in non-production environment first
- Backup system before applying updates

## 📄 License and Compliance

This secure system is designed to meet enterprise security standards and includes:
- **Encryption compliance** with industry standards
- **Audit trail** for regulatory requirements
- **Access control** for data protection
- **Tamper detection** for integrity assurance

---

**Version**: 2.0.0 Secure Edition  
**Last Updated**: January 2024  
**Security Level**: Enterprise Grade  

🔒 **Remember**: Security is everyone's responsibility. Report any suspicious activity immediately.