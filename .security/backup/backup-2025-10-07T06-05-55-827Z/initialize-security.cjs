#!/usr/bin/env node

/**
 * Pharmalens Security System Initialization
 * Sets up integrity hashes and security configuration
 */

const SecurityEnhancer = require('./security-enhancer.cjs');
const fs = require('fs');
const path = require('path');

class SecurityInitializer {
  constructor() {
    this.security = new SecurityEnhancer();
  }

  /**
   * Initialize the security system
   */
  async initialize() {
    try {
      console.log('🔧 Initializing Pharmalens Security System...\n');

      // Create security directories if they don't exist
      this.createSecurityDirectories();

      // Initialize integrity hashes for all critical files
      this.initializeIntegrityHashes();

      // Create initial security configuration
      this.createSecurityConfiguration();

      // Set up audit logging
      this.initializeAuditLog();

      // Create backup of critical files
      this.createSystemBackup();

      console.log('✅ Security system initialization completed successfully!\n');
      console.log('🔒 System is now ready for secure operations.');
      console.log('   Use: node pharmalens-secure.cjs\n');

    } catch (error) {
      console.error('❌ Security initialization failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Create security directories
   */
  createSecurityDirectories() {
    const dirs = ['.security', '.security/integrity', '.security/audit', '.security/backup'];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  /**
   * Initialize integrity hashes for critical files
   */
  initializeIntegrityHashes() {
    console.log('🔐 Initializing file integrity hashes...');

    const criticalFiles = [
      'pharmalens-secure.cjs',
      'secure-wrapper.cjs',
      'security-enhancer.cjs',
      'initialize-security.cjs'
    ];

    criticalFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          this.security.storeFileIntegrity(file, {
            critical: true,
            component: 'pharmalens-core',
            initialized: new Date().toISOString()
          });
          console.log(`  ✅ ${file} - Integrity hash stored`);
        } catch (error) {
          console.warn(`  ⚠️ ${file} - Failed to store integrity: ${error.message}`);
        }
      } else {
        console.warn(`  ⚠️ ${file} - File not found`);
      }
    });

    // Also store integrity for any existing encrypted files
    const encryptedFiles = fs.readdirSync('.').filter(file => file.endsWith('.encrypted'));
    encryptedFiles.forEach(file => {
      try {
        this.security.storeFileIntegrity(file, {
          critical: false,
          component: 'user-data',
          type: 'encrypted-file'
        });
        console.log(`  ✅ ${file} - Encrypted file integrity stored`);
      } catch (error) {
        console.warn(`  ⚠️ ${file} - Failed to store integrity: ${error.message}`);
      }
    });
  }

  /**
   * Create initial security configuration
   */
  createSecurityConfiguration() {
    console.log('⚙️ Creating security configuration...');

    const config = {
      version: '2.0.0',
      initialized: new Date().toISOString(),
      securityLevel: 'enterprise',
      features: {
        integrityChecking: true,
        auditLogging: true,
        accessControl: true,
        tamperDetection: true,
        encryptionUpgrade: true
      },
      settings: {
        sessionTimeout: 1800000, // 30 minutes
        maxPasswordAttempts: 3,
        lockoutDuration: 300000, // 5 minutes
        keyDerivationIterations: 100000,
        encryptionAlgorithm: 'aes-256-gcm',
        hashAlgorithm: 'sha256'
      }
    };

    const configPath = '.security/config.json';
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
    console.log(`  ✅ Security configuration saved to ${configPath}`);
  }

  /**
   * Initialize audit log
   */
  initializeAuditLog() {
    console.log('📋 Initializing audit log...');

    const auditLogPath = '.security/audit/security.log';
    const initialEntry = `[${new Date().toISOString()}] INFO: SYSTEM_INIT - Security system initialized successfully\n`;
    
    fs.writeFileSync(auditLogPath, initialEntry, { mode: 0o600 });
    console.log(`  ✅ Audit log initialized: ${auditLogPath}`);
  }

  /**
   * Create system backup
   */
  createSystemBackup() {
    console.log('💾 Creating system backup...');

    const backupDir = '.security/backup';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);

    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true, mode: 0o700 });
    }

    const filesToBackup = [
      'pharmalens-secure.cjs',
      'secure-wrapper.cjs',
      'security-enhancer.cjs',
      'initialize-security.cjs',
      'secure-launcher.bat',
      'SECURITY_README.md'
    ];

    filesToBackup.forEach(file => {
      if (fs.existsSync(file)) {
        const backupFile = path.join(backupPath, file);
        fs.copyFileSync(file, backupFile);
        console.log(`  ✅ ${file} - Backed up`);
      }
    });

    // Create backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      files: filesToBackup.filter(file => fs.existsSync(file)),
      version: '2.0.0',
      type: 'system-backup'
    };

    fs.writeFileSync(
      path.join(backupPath, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      { mode: 0o600 }
    );

    console.log(`  ✅ System backup created: ${backupPath}`);
  }

  /**
   * Show post-initialization instructions
   */
  showInstructions() {
    console.log('\n🔒 SECURITY SYSTEM READY');
    console.log('========================\n');
    
    console.log('Next steps:');
    console.log('1. Launch secure system: node pharmalens-secure.cjs');
    console.log('2. Or use batch launcher: secure-launcher.bat');
    console.log('3. Review SECURITY_README.md for detailed instructions\n');
    
    console.log('Security features enabled:');
    console.log('✅ File integrity monitoring');
    console.log('✅ Tamper detection');
    console.log('✅ Audit logging');
    console.log('✅ Access control');
    console.log('✅ Enhanced encryption\n');
    
    console.log('⚠️  Important:');
    console.log('- Keep backup files secure');
    console.log('- Monitor audit logs regularly');
    console.log('- Use strong passwords');
    console.log('- Report any security issues immediately\n');
  }
}

// Run initialization if called directly
if (require.main === module) {
  const initializer = new SecurityInitializer();
  initializer.initialize()
    .then(() => {
      initializer.showInstructions();
    })
    .catch(error => {
      console.error('❌ Initialization failed:', error.message);
      process.exit(1);
    });
}

module.exports = SecurityInitializer;