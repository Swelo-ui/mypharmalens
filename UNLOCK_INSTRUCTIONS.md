# 🔐 Encrypted Documentation - Unlock Instructions

## Overview
The `pharmalens-identification-system-architecture.md` file has been encrypted with AES-256-CBC encryption and password protection. This document provides instructions for unlocking the file in different environments.

## 📁 File Status
- **Original File**: `pharmalens-identification-system-architecture.md` (removed after encryption)
- **Encrypted File**: `.trae/documents/pharmalens-identification-system-architecture.md.encrypted`
- **Hash File**: `.trae/documents/.doc-hash` (for integrity verification)
- **Encryption Password**: 

## 🔧 Available Tools

### 1. Windows Batch Script (Recommended for Windows)
Use the `unlock-docs.bat` script for a user-friendly interface:

```batch
# Decrypt the file
unlock-docs.bat decrypt

# Check encryption status
unlock-docs.bat status

# Verify password without decrypting
unlock-docs.bat verify

# Clean up encrypted files (removes encrypted version)
unlock-docs.bat cleanup
```

### 2. Node.js Script (Cross-platform)
Use the `encrypt-docs.cjs` script directly:

```bash
# Decrypt the file
node encrypt-docs.cjs decrypt [password]

# Check status
node encrypt-docs.cjs status

# Verify password
node encrypt-docs.cjs verify [password]

# Clean up
node encrypt-docs.cjs cleanup
```

## 🌐 Instructions for Different Environments

### In Trae IDE
1. **Open Terminal**: Use Ctrl+` or go to Terminal → New Terminal
2. **Navigate to Project**: Ensure you're in the project root directory
3. **Run Unlock Command**:
   ```bash
   # Option 1: Using batch script (Windows)
   unlock-docs.bat decrypt
   
   # Option 2: Using Node.js directly
   node encrypt-docs.cjs decrypt pharmalens2024
   ```
4. **Access File**: The decrypted file will be available at `.trae/documents/pharmalens-identification-system-architecture.md`

### On GitHub (for Collaborators)
1. **Clone Repository**: 
   ```bash
   git clone [repository-url]
   cd mypharmalens
   ```
2. **Install Dependencies**: Ensure Node.js is installed
3. **Decrypt File**:
   ```bash
   # Windows
   unlock-docs.bat decrypt
   
   # Linux/Mac
   node encrypt-docs.cjs decrypt pharmalens2024
   ```
4. **View Documentation**: Open the decrypted file in your preferred editor

### For New Team Members
1. **Get Password**: Contact project administrator for the encryption password
2. **Follow Environment Instructions**: Use the appropriate method above
3. **Verify Integrity**: The script automatically verifies file integrity using SHA-256 hash

## 🔒 Security Notes

- **Password Protection**: The file is encrypted with AES-256-CBC
- **Integrity Check**: SHA-256 hash verification ensures file hasn't been tampered with
- **Git Exclusion**: Encrypted files are excluded from version control via `.gitignore`
- **Safe Cleanup**: The cleanup command removes encrypted versions after successful decryption

## 🚨 Troubleshooting

### Common Issues:
1. **"Node.js not found"**: Install Node.js from https://nodejs.org/
2. **"File not found"**: Ensure you're in the project root directory
3. **"Wrong password"**: Contact administrator for correct password
4. **"Permission denied"**: Run terminal as administrator (Windows) or use `sudo` (Linux/Mac)

### Error Messages:
- **"Encrypted file not found"**: File may already be decrypted or not yet encrypted
- **"Hash verification failed"**: File may be corrupted, re-encrypt from backup
- **"Invalid password"**: Double-check password spelling and case sensitivity

## 📋 Quick Reference

| Command | Purpose |
|---------|---------|
| `unlock-docs.bat decrypt` | Decrypt the documentation file |
| `unlock-docs.bat status` | Check if file is encrypted/decrypted |
| `unlock-docs.bat verify` | Test password without decrypting |
| `unlock-docs.bat cleanup` | Remove encrypted files after decryption |

## 🔄 Re-encryption
To re-encrypt the file after making changes:
```bash
node encrypt-docs.cjs encrypt [password]
```

---
**Note**: Keep the encryption password secure and share only with authorized team members.