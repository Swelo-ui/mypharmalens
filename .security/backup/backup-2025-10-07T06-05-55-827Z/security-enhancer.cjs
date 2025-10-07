const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Advanced Security Enhancement Module for Pharmalens Documentation Unlocker
 * Provides integrity checks, tamper detection, access control, and audit logging
 */
class SecurityEnhancer {
  constructor() {
    this.securityDir = path.join(__dirname, '.security');
    this.auditLog = path.join(this.securityDir, 'audit.log');
    this.integrityFile = path.join(this.securityDir, 'integrity.json');
    this.accessLog = path.join(this.securityDir, 'access.log');
    this.configFile = path.join(this.securityDir, 'security-config.json');
    
    // Rate limiting storage
    this.attemptTracker = new Map();
    
    // Initialize security directory
    this.initializeSecuritySystem();
  }

  /**
   * Initialize security system and create necessary directories/files
   */
  initializeSecuritySystem() {
    try {
      // Create security directory if it doesn't exist
      if (!fs.existsSync(this.securityDir)) {
        fs.mkdirSync(this.securityDir, { mode: 0o700 }); // Restricted permissions
      }

      // Initialize security configuration
      this.initializeSecurityConfig();
      
      // Log system initialization
      this.logSecurityEvent('SYSTEM_INIT', 'Security system initialized', 'INFO');
      
    } catch (error) {
      console.error('❌ Failed to initialize security system:', error.message);
      process.exit(1);
    }
  }

  /**
   * Initialize security configuration with secure defaults
   */
  initializeSecurityConfig() {
    const defaultConfig = {
      maxPasswordAttempts: 3,
      lockoutDuration: 300000, // 5 minutes in milliseconds
      sessionTimeout: 1800000, // 30 minutes
      requireStrongPasswords: true,
      enableIntegrityChecks: true,
      enableAuditLogging: true,
      allowedUsers: [], // Empty means all users allowed
      blockedIPs: [],
      encryptionSettings: {
        algorithm: 'aes-256-gcm', // More secure than CBC
        keyDerivationIterations: 200000, // Increased from 100000
        saltLength: 32,
        ivLength: 16,
        tagLength: 16
      }
    };

    if (!fs.existsSync(this.configFile)) {
      fs.writeFileSync(this.configFile, JSON.stringify(defaultConfig, null, 2), { mode: 0o600 });
    }
  }

  /**
   * Load security configuration
   */
  getSecurityConfig() {
    try {
      return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
    } catch (error) {
      this.logSecurityEvent('CONFIG_ERROR', `Failed to load security config: ${error.message}`, 'ERROR');
      throw new Error('Security configuration corrupted');
    }
  }

  /**
   * Generate file integrity hash
   */
  generateIntegrityHash(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileContent);
      hash.update(fs.statSync(filePath).mtime.toISOString()); // Include modification time
      return hash.digest('hex');
    } catch (error) {
      throw new Error(`Failed to generate integrity hash: ${error.message}`);
    }
  }

  /**
   * Store file integrity information
   */
  storeFileIntegrity(filePath, additionalData = {}) {
    try {
      const integrity = this.loadIntegrityData();
      const relativePath = path.relative(__dirname, filePath);
      
      integrity[relativePath] = {
        hash: this.generateIntegrityHash(filePath),
        timestamp: new Date().toISOString(),
        size: fs.statSync(filePath).size,
        permissions: fs.statSync(filePath).mode,
        ...additionalData
      };

      fs.writeFileSync(this.integrityFile, JSON.stringify(integrity, null, 2), { mode: 0o600 });
      this.logSecurityEvent('INTEGRITY_STORE', `Stored integrity for ${relativePath}`, 'INFO');
      
    } catch (error) {
      this.logSecurityEvent('INTEGRITY_ERROR', `Failed to store integrity: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Verify file integrity
   */
  verifyFileIntegrity(filePath) {
    try {
      const integrity = this.loadIntegrityData();
      const relativePath = path.relative(__dirname, filePath);
      
      if (!integrity[relativePath]) {
        this.logSecurityEvent('INTEGRITY_MISSING', `No integrity data for ${relativePath}`, 'WARNING');
        return { valid: false, reason: 'No integrity data found' };
      }

      const storedData = integrity[relativePath];
      const currentHash = this.generateIntegrityHash(filePath);
      const currentStats = fs.statSync(filePath);

      // Check hash
      if (storedData.hash !== currentHash) {
        this.logSecurityEvent('INTEGRITY_VIOLATION', `Hash mismatch for ${relativePath}`, 'CRITICAL');
        return { valid: false, reason: 'File content or timestamp modified' };
      }

      // Check size
      if (storedData.size !== currentStats.size) {
        this.logSecurityEvent('INTEGRITY_VIOLATION', `Size mismatch for ${relativePath}`, 'CRITICAL');
        return { valid: false, reason: 'File size changed' };
      }

      return { valid: true, reason: 'File integrity verified' };
      
    } catch (error) {
      this.logSecurityEvent('INTEGRITY_ERROR', `Failed to verify integrity: ${error.message}`, 'ERROR');
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Load integrity data
   */
  loadIntegrityData() {
    try {
      if (fs.existsSync(this.integrityFile)) {
        return JSON.parse(fs.readFileSync(this.integrityFile, 'utf8'));
      }
      return {};
    } catch (error) {
      this.logSecurityEvent('INTEGRITY_ERROR', `Failed to load integrity data: ${error.message}`, 'ERROR');
      return {};
    }
  }

  /**
   * Check if user is rate limited
   */
  isRateLimited(identifier = 'default') {
    const config = this.getSecurityConfig();
    const now = Date.now();
    
    if (!this.attemptTracker.has(identifier)) {
      return false;
    }

    const attempts = this.attemptTracker.get(identifier);
    
    // Clean old attempts
    const validAttempts = attempts.filter(time => now - time < config.lockoutDuration);
    this.attemptTracker.set(identifier, validAttempts);

    if (validAttempts.length >= config.maxPasswordAttempts) {
      const oldestAttempt = Math.min(...validAttempts);
      const remainingTime = config.lockoutDuration - (now - oldestAttempt);
      
      this.logSecurityEvent('RATE_LIMITED', `Rate limit exceeded for ${identifier}`, 'WARNING');
      return { limited: true, remainingTime: Math.ceil(remainingTime / 1000) };
    }

    return false;
  }

  /**
   * Record password attempt
   */
  recordPasswordAttempt(identifier = 'default', success = false) {
    const now = Date.now();
    
    if (!this.attemptTracker.has(identifier)) {
      this.attemptTracker.set(identifier, []);
    }

    if (!success) {
      const attempts = this.attemptTracker.get(identifier);
      attempts.push(now);
      this.attemptTracker.set(identifier, attempts);
      
      this.logSecurityEvent('PASSWORD_ATTEMPT_FAILED', `Failed password attempt for ${identifier}`, 'WARNING');
    } else {
      // Clear attempts on successful authentication
      this.attemptTracker.delete(identifier);
      this.logSecurityEvent('PASSWORD_ATTEMPT_SUCCESS', `Successful authentication for ${identifier}`, 'INFO');
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const config = this.getSecurityConfig();
    
    if (!config.requireStrongPasswords) {
      return { valid: true, reason: 'Strong passwords not required' };
    }

    const minLength = 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (password.length < minLength) {
      return { valid: false, reason: `Password must be at least ${minLength} characters long` };
    }
    
    if (!hasUppercase) {
      return { valid: false, reason: 'Password must contain uppercase letters' };
    }
    
    if (!hasLowercase) {
      return { valid: false, reason: 'Password must contain lowercase letters' };
    }
    
    if (!hasNumbers) {
      return { valid: false, reason: 'Password must contain numbers' };
    }
    
    if (!hasSpecialChars) {
      return { valid: false, reason: 'Password must contain special characters' };
    }

    // Check for common patterns
    const commonPatterns = [
      /(.)\1{3,}/, // Repeated characters
      /123456|654321|abcdef|qwerty/i, // Common sequences
      /password|admin|user|test/i // Common words
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        return { valid: false, reason: 'Password contains common patterns' };
      }
    }

    return { valid: true, reason: 'Password meets strength requirements' };
  }

  /**
   * Enhanced encryption with GCM mode
   */
  encryptWithIntegrity(data, password) {
    try {
      const config = this.getSecurityConfig();
      const settings = config.encryptionSettings;
      
      // Generate salt and IV
      const salt = crypto.randomBytes(settings.saltLength);
      const iv = crypto.randomBytes(settings.ivLength);
      
      // Derive key using PBKDF2
      const key = crypto.pbkdf2Sync(password, salt, settings.keyDerivationIterations, 32, 'sha256');
      
      // Create cipher with GCM mode for authenticated encryption
      const cipher = crypto.createCipher(settings.algorithm, key);
      cipher.setAAD(Buffer.from('pharmalens-security-v1')); // Additional authenticated data
      
      // Encrypt data
      let encrypted = cipher.update(data, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine all components
      const result = Buffer.concat([
        Buffer.from([1]), // Version byte
        salt,
        iv,
        tag,
        encrypted
      ]);

      return result;
      
    } catch (error) {
      this.logSecurityEvent('ENCRYPTION_ERROR', `Encryption failed: ${error.message}`, 'ERROR');
      throw new Error('Encryption failed');
    }
  }

  /**
   * Enhanced decryption with integrity verification
   */
  decryptWithIntegrity(encryptedData, password) {
    try {
      const config = this.getSecurityConfig();
      const settings = config.encryptionSettings;
      
      // Parse encrypted data
      const version = encryptedData[0];
      if (version !== 1) {
        throw new Error('Unsupported encryption version');
      }
      
      let offset = 1;
      const salt = encryptedData.slice(offset, offset + settings.saltLength);
      offset += settings.saltLength;
      
      const iv = encryptedData.slice(offset, offset + settings.ivLength);
      offset += settings.ivLength;
      
      const tag = encryptedData.slice(offset, offset + settings.tagLength);
      offset += settings.tagLength;
      
      const encrypted = encryptedData.slice(offset);
      
      // Derive key
      const key = crypto.pbkdf2Sync(password, salt, settings.keyDerivationIterations, 32, 'sha256');
      
      // Create decipher
      const decipher = crypto.createDecipher(settings.algorithm, key);
      decipher.setAAD(Buffer.from('pharmalens-security-v1'));
      decipher.setAuthTag(tag);
      
      // Decrypt data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString('utf8');
      
    } catch (error) {
      this.logSecurityEvent('DECRYPTION_ERROR', `Decryption failed: ${error.message}`, 'ERROR');
      throw new Error('Decryption failed - invalid password or corrupted data');
    }
  }

  /**
   * Log security events
   */
  logSecurityEvent(eventType, message, level = 'INFO') {
    try {
      const timestamp = new Date().toISOString();
      const userInfo = this.getUserInfo();
      
      const logEntry = {
        timestamp,
        eventType,
        level,
        message,
        user: userInfo.username,
        pid: process.pid,
        platform: os.platform(),
        arch: os.arch()
      };

      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.auditLog, logLine, { mode: 0o600 });
      
      // Also log to access log for certain events
      if (['PASSWORD_ATTEMPT_FAILED', 'INTEGRITY_VIOLATION', 'RATE_LIMITED'].includes(eventType)) {
        fs.appendFileSync(this.accessLog, logLine, { mode: 0o600 });
      }
      
    } catch (error) {
      console.error('Failed to log security event:', error.message);
    }
  }

  /**
   * Get current user information
   */
  getUserInfo() {
    return {
      username: os.userInfo().username,
      uid: os.userInfo().uid,
      gid: os.userInfo().gid,
      homedir: os.userInfo().homedir
    };
  }

  /**
   * Perform comprehensive security check
   */
  performSecurityCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      checks: [],
      overallStatus: 'PASS',
      criticalIssues: 0,
      warnings: 0
    };

    // Check file integrity
    const criticalFiles = [
      'file-encrypt.cjs',
      'encrypt-docs.cjs',
      'unlock-docs.bat'
    ];

    for (const file of criticalFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const integrity = this.verifyFileIntegrity(filePath);
        results.checks.push({
          type: 'INTEGRITY_CHECK',
          file: file,
          status: integrity.valid ? 'PASS' : 'FAIL',
          reason: integrity.reason
        });

        if (!integrity.valid) {
          results.criticalIssues++;
          results.overallStatus = 'FAIL';
        }
      }
    }

    // Check for exposed secrets
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hasExposedSecrets = envContent.includes('API_KEY') || envContent.includes('SECRET');
      
      results.checks.push({
        type: 'SECRET_EXPOSURE_CHECK',
        status: hasExposedSecrets ? 'WARNING' : 'PASS',
        reason: hasExposedSecrets ? 'Potential API keys found in .env file' : 'No obvious secret exposure'
      });

      if (hasExposedSecrets) {
        results.warnings++;
      }
    }

    // Check security configuration
    try {
      const config = this.getSecurityConfig();
      results.checks.push({
        type: 'CONFIG_CHECK',
        status: 'PASS',
        reason: 'Security configuration loaded successfully'
      });
    } catch (error) {
      results.checks.push({
        type: 'CONFIG_CHECK',
        status: 'FAIL',
        reason: 'Security configuration corrupted'
      });
      results.criticalIssues++;
      results.overallStatus = 'FAIL';
    }

    this.logSecurityEvent('SECURITY_CHECK', `Security check completed: ${results.overallStatus}`, 
                         results.overallStatus === 'FAIL' ? 'CRITICAL' : 'INFO');

    return results;
  }

  /**
   * Generate security report
   */
  generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      systemInfo: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        user: this.getUserInfo().username
      },
      securityCheck: this.performSecurityCheck(),
      auditSummary: this.getAuditSummary(),
      recommendations: this.getSecurityRecommendations()
    };

    const reportPath = path.join(this.securityDir, `security-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });

    return report;
  }

  /**
   * Get audit log summary
   */
  getAuditSummary() {
    try {
      if (!fs.existsSync(this.auditLog)) {
        return { totalEvents: 0, recentEvents: [] };
      }

      const logContent = fs.readFileSync(this.auditLog, 'utf8');
      const lines = logContent.trim().split('\n').filter(line => line);
      const events = lines.map(line => JSON.parse(line));

      // Get recent events (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentEvents = events.filter(event => new Date(event.timestamp) > oneDayAgo);

      return {
        totalEvents: events.length,
        recentEvents: recentEvents.length,
        criticalEvents: events.filter(e => e.level === 'CRITICAL').length,
        warningEvents: events.filter(e => e.level === 'WARNING').length
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get security recommendations
   */
  getSecurityRecommendations() {
    const recommendations = [];

    // Check if .env file exists and is exposed
    if (fs.existsSync(path.join(__dirname, '.env'))) {
      recommendations.push({
        priority: 'HIGH',
        category: 'SECRET_MANAGEMENT',
        issue: 'Environment file contains sensitive data',
        recommendation: 'Move .env to .gitignore and use secure secret management'
      });
    }

    // Check for deprecated crypto usage
    const fileEncryptPath = path.join(__dirname, 'file-encrypt.cjs');
    if (fs.existsSync(fileEncryptPath)) {
      const content = fs.readFileSync(fileEncryptPath, 'utf8');
      if (content.includes('createCipher')) {
        recommendations.push({
          priority: 'HIGH',
          category: 'CRYPTOGRAPHY',
          issue: 'Using deprecated crypto.createCipher',
          recommendation: 'Upgrade to crypto.createCipherGCM for authenticated encryption'
        });
      }
    }

    return recommendations;
  }
}

module.exports = SecurityEnhancer;