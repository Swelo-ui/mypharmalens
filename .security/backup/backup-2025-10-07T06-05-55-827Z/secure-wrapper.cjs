const SecurityEnhancer = require('./security-enhancer.cjs');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Secure Wrapper for Pharmalens Documentation Unlocker
 * Intercepts all operations and applies security checks before execution
 */
class SecureWrapper {
  constructor() {
    this.security = new SecurityEnhancer();
    this.sessionToken = null;
    this.sessionExpiry = null;
    this.isInitialized = false;
    
    // Initialize security system
    this.initialize();
  }

  /**
   * Initialize the secure wrapper
   */
  initialize() {
    try {
      console.log('🔒 Initializing Pharmalens Secure System...\n');
      
      // Perform initial security check
      const securityCheck = this.security.performSecurityCheck();
      
      if (securityCheck.overallStatus === 'FAIL') {
        console.error('❌ CRITICAL SECURITY ISSUES DETECTED!');
        console.error(`   Critical Issues: ${securityCheck.criticalIssues}`);
        console.error(`   Warnings: ${securityCheck.warnings}\n`);
        
        console.log('🔍 Security Check Details:');
        securityCheck.checks.forEach(check => {
          const icon = check.status === 'PASS' ? '✅' : check.status === 'WARNING' ? '⚠️' : '❌';
          console.log(`   ${icon} ${check.type}: ${check.reason}`);
        });
        
        console.error('\n🚫 System access denied due to security violations.');
        console.error('   Please contact system administrator or restore original files.\n');
        process.exit(1);
      }

      // Store integrity hashes for critical files
      this.storeSystemIntegrity();
      
      this.isInitialized = true;
      console.log('✅ Security system initialized successfully\n');
      
    } catch (error) {
      console.error('❌ Failed to initialize security system:', error.message);
      process.exit(1);
    }
  }

  /**
   * Store integrity hashes for system files
   */
  storeSystemIntegrity() {
    const criticalFiles = [
      'file-encrypt.cjs',
      'encrypt-docs.cjs',
      'unlock-docs.bat',
      'security-enhancer.cjs',
      'secure-wrapper.cjs'
    ];

    for (const file of criticalFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        try {
          this.security.storeFileIntegrity(filePath, { 
            critical: true,
            component: 'pharmalens-core'
          });
        } catch (error) {
          console.warn(`⚠️ Warning: Could not store integrity for ${file}`);
        }
      }
    }
  }

  /**
   * Authenticate user with enhanced security
   */
  async authenticate(password, identifier = null) {
    try {
      // Generate identifier if not provided
      if (!identifier) {
        identifier = crypto.createHash('sha256')
          .update(this.security.getUserInfo().username)
          .update(process.cwd())
          .digest('hex').substring(0, 16);
      }

      // Check rate limiting
      const rateLimitCheck = this.security.isRateLimited(identifier);
      if (rateLimitCheck && rateLimitCheck.limited) {
        console.error(`❌ Too many failed attempts. Please wait ${rateLimitCheck.remainingTime} seconds.`);
        this.security.logSecurityEvent('AUTH_BLOCKED', `Authentication blocked for ${identifier}`, 'WARNING');
        return false;
      }

      // Validate password strength
      const strengthCheck = this.security.validatePasswordStrength(password);
      if (!strengthCheck.valid) {
        console.error(`❌ Password validation failed: ${strengthCheck.reason}`);
        this.security.recordPasswordAttempt(identifier, false);
        return false;
      }

      // Verify system integrity before authentication
      const integrityCheck = this.verifySystemIntegrity();
      if (!integrityCheck.valid) {
        console.error('❌ System integrity check failed. Authentication denied.');
        this.security.logSecurityEvent('AUTH_INTEGRITY_FAIL', 'Authentication denied due to integrity violation', 'CRITICAL');
        return false;
      }

      // Create session token
      this.sessionToken = crypto.randomBytes(32).toString('hex');
      this.sessionExpiry = Date.now() + this.security.getSecurityConfig().sessionTimeout;
      
      this.security.recordPasswordAttempt(identifier, true);
      this.security.logSecurityEvent('AUTH_SUCCESS', `User authenticated successfully`, 'INFO');
      
      return true;
      
    } catch (error) {
      this.security.logSecurityEvent('AUTH_ERROR', `Authentication error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  /**
   * Verify system integrity
   */
  verifySystemIntegrity() {
    const criticalFiles = [
      'file-encrypt.cjs',
      'encrypt-docs.cjs',
      'unlock-docs.bat'
    ];

    for (const file of criticalFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const integrity = this.security.verifyFileIntegrity(filePath);
        if (!integrity.valid) {
          return { 
            valid: false, 
            reason: `File ${file} failed integrity check: ${integrity.reason}` 
          };
        }
      }
    }

    return { valid: true, reason: 'All critical files passed integrity check' };
  }

  /**
   * Check if session is valid
   */
  isSessionValid() {
    if (!this.sessionToken || !this.sessionExpiry) {
      return false;
    }

    if (Date.now() > this.sessionExpiry) {
      this.sessionToken = null;
      this.sessionExpiry = null;
      this.security.logSecurityEvent('SESSION_EXPIRED', 'User session expired', 'INFO');
      return false;
    }

    return true;
  }

  /**
   * Secure execution wrapper
   */
  async executeSecurely(operation, ...args) {
    try {
      // Check initialization
      if (!this.isInitialized) {
        throw new Error('Security system not initialized');
      }

      // Check session validity
      if (!this.isSessionValid()) {
        throw new Error('Invalid or expired session');
      }

      // Verify system integrity before each operation
      const integrityCheck = this.verifySystemIntegrity();
      if (!integrityCheck.valid) {
        this.security.logSecurityEvent('OPERATION_BLOCKED', `Operation blocked: ${integrityCheck.reason}`, 'CRITICAL');
        throw new Error('Operation denied due to security violation');
      }

      // Log operation
      this.security.logSecurityEvent('OPERATION_START', `Starting operation: ${operation}`, 'INFO');

      // Execute operation based on type
      let result;
      switch (operation) {
        case 'encrypt':
          result = await this.secureEncrypt(...args);
          break;
        case 'decrypt':
          result = await this.secureDecrypt(...args);
          break;
        case 'status':
          result = await this.secureStatus(...args);
          break;
        case 'verify':
          result = await this.secureVerify(...args);
          break;
        case 'cleanup':
          result = await this.secureCleanup(...args);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      this.security.logSecurityEvent('OPERATION_SUCCESS', `Operation completed: ${operation}`, 'INFO');
      return result;

    } catch (error) {
      this.security.logSecurityEvent('OPERATION_ERROR', `Operation failed: ${operation} - ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Secure encrypt operation
   */
  async secureEncrypt(filePath, password) {
    // Additional validation for encryption
    if (!fs.existsSync(filePath)) {
      throw new Error('Source file not found');
    }

    // Check file permissions
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      throw new Error('Source must be a regular file');
    }

    // Use enhanced encryption
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const encryptedData = this.security.encryptWithIntegrity(fileContent, password);
    
    // Store encrypted file with security metadata
    const encryptedPath = filePath + '.encrypted';
    fs.writeFileSync(encryptedPath, encryptedData, { mode: 0o600 });
    
    // Store integrity information
    this.security.storeFileIntegrity(encryptedPath, {
      originalFile: filePath,
      encryptedAt: new Date().toISOString(),
      algorithm: 'aes-256-gcm'
    });

    return { success: true, encryptedPath };
  }

  /**
   * Secure decrypt operation
   */
  async secureDecrypt(encryptedPath, password) {
    // Verify encrypted file integrity
    const integrity = this.security.verifyFileIntegrity(encryptedPath);
    if (!integrity.valid) {
      throw new Error(`Encrypted file integrity check failed: ${integrity.reason}`);
    }

    // Read and decrypt file
    const encryptedData = fs.readFileSync(encryptedPath);
    const decryptedContent = this.security.decryptWithIntegrity(encryptedData, password);
    
    // Determine original file path
    const originalPath = encryptedPath.replace('.encrypted', '');
    
    // Check if original file already exists
    if (fs.existsSync(originalPath)) {
      throw new Error('Original file already exists');
    }

    // Write decrypted file
    fs.writeFileSync(originalPath, decryptedContent, { mode: 0o644 });

    return { success: true, originalPath };
  }

  /**
   * Secure status operation
   */
  async secureStatus() {
    const report = this.security.generateSecurityReport();
    return {
      success: true,
      securityStatus: report.securityCheck.overallStatus,
      lastCheck: report.timestamp,
      criticalIssues: report.securityCheck.criticalIssues,
      warnings: report.securityCheck.warnings
    };
  }

  /**
   * Secure verify operation
   */
  async secureVerify(password) {
    // This is a placeholder - actual verification would depend on stored hashes
    const strengthCheck = this.security.validatePasswordStrength(password);
    return {
      success: true,
      passwordStrength: strengthCheck.valid ? 'STRONG' : 'WEAK',
      reason: strengthCheck.reason
    };
  }

  /**
   * Secure cleanup operation
   */
  async secureCleanup() {
    // Generate security report before cleanup
    const report = this.security.generateSecurityReport();
    
    // Only allow cleanup if system is secure
    if (report.securityCheck.overallStatus !== 'PASS') {
      throw new Error('Cleanup denied due to security issues');
    }

    return { success: true, message: 'Cleanup authorized' };
  }

  /**
   * Show security status
   */
  showSecurityStatus() {
    console.log('🔒 Pharmalens Security Status');
    console.log('============================\n');
    
    const report = this.security.generateSecurityReport();
    
    console.log(`Overall Status: ${report.securityCheck.overallStatus === 'PASS' ? '✅ SECURE' : '❌ COMPROMISED'}`);
    console.log(`Critical Issues: ${report.securityCheck.criticalIssues}`);
    console.log(`Warnings: ${report.securityCheck.warnings}`);
    console.log(`Last Check: ${new Date(report.timestamp).toLocaleString()}\n`);
    
    console.log('Security Checks:');
    report.securityCheck.checks.forEach(check => {
      const icon = check.status === 'PASS' ? '✅' : check.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`  ${icon} ${check.type}: ${check.reason}`);
    });
    
    if (report.recommendations.length > 0) {
      console.log('\nSecurity Recommendations:');
      report.recommendations.forEach(rec => {
        const priority = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`  ${priority} ${rec.category}: ${rec.recommendation}`);
      });
    }
    
    console.log(`\nAudit Summary:`);
    console.log(`  Total Events: ${report.auditSummary.totalEvents || 0}`);
    console.log(`  Recent Events (24h): ${report.auditSummary.recentEvents || 0}`);
    console.log(`  Critical Events: ${report.auditSummary.criticalEvents || 0}`);
    console.log(`  Warning Events: ${report.auditSummary.warningEvents || 0}\n`);
  }
}

module.exports = SecureWrapper;