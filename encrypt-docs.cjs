const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const SALT_LENGTH = 32; // 256 bits

// File paths
const SOURCE_FILE = path.join(__dirname, '.trae', 'documents', 'pharmalens-identification-system-architecture.md');
const ENCRYPTED_FILE = path.join(__dirname, '.trae', 'documents', 'pharmalens-identification-system-architecture.md.encrypted');
const HASH_FILE = path.join(__dirname, '.trae', 'documents', '.doc-hash');

class DocumentEncryption {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // Derive key from password using PBKDF2
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
  }

  // Hash password for verification
  hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  }

  // Main encrypt method
  async encrypt() {
    try {
      console.log('🔐 Pharmalens Documentation Encryption Tool');
      console.log('==========================================\n');

      // Check if already encrypted
      if (fs.existsSync(ENCRYPTED_FILE)) {
        console.log('⚠️  File is already encrypted!');
        console.log('Use "decrypt" command to decrypt first, or "cleanup" to remove encrypted files.\n');
        return;
      }

      // Check if source file exists
      if (!fs.existsSync(SOURCE_FILE)) {
        console.error('❌ Source file not found:', SOURCE_FILE);
        process.exit(1);
      }

      // Get password from command line argument or prompt
      let password;
      if (process.argv[3]) {
        password = process.argv[3];
        console.log('🔑 Using password from command line argument');
      } else {
        password = await this.getPassword('🔑 Enter encryption password: ');
      }

      if (!password || password.length < 8) {
        console.error('❌ Password must be at least 8 characters long!');
        process.exit(1);
      }

      // Confirm password
      let confirmPassword;
      if (process.argv[3]) {
        confirmPassword = password; // Skip confirmation for command line password
      } else {
        confirmPassword = await this.getPassword('🔑 Confirm password: ');
      }

      if (password !== confirmPassword) {
        console.error('❌ Passwords do not match!');
        process.exit(1);
      }

      console.log('\n🔄 Encrypting file...');

      // Generate salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Derive key
      const key = this.deriveKey(password, salt);

      // Read original file
      const originalData = fs.readFileSync(SOURCE_FILE, 'utf8');

      // Create cipher
      const cipher = crypto.createCipher(ALGORITHM, key);
      
      // Encrypt data
      let encrypted = cipher.update(originalData, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Combine salt, IV, and encrypted data
      const finalData = Buffer.concat([
        salt,
        iv,
        Buffer.from(encrypted, 'hex')
      ]);

      // Write encrypted file
      fs.writeFileSync(ENCRYPTED_FILE, finalData);

      // Create password hash for verification
      const passwordHash = this.hashPassword(password, salt);
      const hashData = {
        hash: passwordHash,
        timestamp: new Date().toISOString(),
        algorithm: ALGORITHM
      };
      fs.writeFileSync(HASH_FILE, JSON.stringify(hashData, null, 2));

      // Remove original file
      fs.unlinkSync(SOURCE_FILE);

      console.log('✅ File encrypted successfully!');
      console.log(`📁 Encrypted file: ${path.basename(ENCRYPTED_FILE)}`);
      console.log(`🔑 Hash file: ${path.basename(HASH_FILE)}`);
      console.log('\n⚠️  Original file has been removed for security.');
      console.log('💡 Use "decrypt" command to restore the original file.\n');

    } catch (error) {
      console.error('❌ Encryption failed:', error.message);
      process.exit(1);
    }
  }

  // Main decrypt method
  async decrypt() {
    try {
      console.log('🔓 Pharmalens Documentation Decryption Tool');
      console.log('==========================================\n');

      // Check if encrypted file exists
      if (!fs.existsSync(ENCRYPTED_FILE)) {
        console.log('ℹ️  No encrypted file found. File may already be decrypted.');
        return;
      }

      // Check if original file already exists
      if (fs.existsSync(SOURCE_FILE)) {
        console.log('⚠️  Original file already exists!');
        console.log('Use "cleanup" command to remove encrypted files first.\n');
        return;
      }

      // Get password from command line argument or prompt
      let password;
      if (process.argv[3]) {
        password = process.argv[3];
        console.log('🔑 Using password from command line argument');
      } else {
        password = await this.getPassword('🔑 Enter decryption password: ');
      }

      console.log('\n🔄 Decrypting file...');

      // Read encrypted file
      const encryptedBuffer = fs.readFileSync(ENCRYPTED_FILE);

      // Extract salt, IV, and encrypted data
      const salt = encryptedBuffer.slice(0, SALT_LENGTH);
      const iv = encryptedBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const encrypted = encryptedBuffer.slice(SALT_LENGTH + IV_LENGTH);

      // Verify password if hash file exists
      if (fs.existsSync(HASH_FILE)) {
        const hashData = JSON.parse(fs.readFileSync(HASH_FILE, 'utf8'));
        const passwordHash = this.hashPassword(password, salt);
        if (passwordHash !== hashData.hash) {
          console.error('❌ Invalid password!');
          process.exit(1);
        }
      }

      // Derive key
      const key = this.deriveKey(password, salt);

      // Create decipher
      const decipher = crypto.createDecipher(ALGORITHM, key);
      
      // Decrypt data
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // Write decrypted file
      fs.writeFileSync(SOURCE_FILE, decrypted);

      console.log('✅ File decrypted successfully!');
      console.log(`📁 Restored file: ${path.basename(SOURCE_FILE)}`);
      console.log('\n💡 Encrypted files are still present. Use "cleanup" to remove them.\n');

    } catch (error) {
      console.error('❌ Decryption failed:', error.message);
      console.error('💡 Make sure you entered the correct password.');
      process.exit(1);
    }
  }

  // Check encryption status
  status() {
    console.log('📊 Pharmalens Documentation Status');
    console.log('==================================\n');

    const originalExists = fs.existsSync(SOURCE_FILE);
    const encryptedExists = fs.existsSync(ENCRYPTED_FILE);
    const hashExists = fs.existsSync(HASH_FILE);

    if (encryptedExists && !originalExists) {
      console.log('🔒 Status: ENCRYPTED');
      console.log(`📁 Encrypted file: ${path.basename(ENCRYPTED_FILE)}`);
      if (hashExists) {
        const hashData = JSON.parse(fs.readFileSync(HASH_FILE, 'utf8'));
        console.log(`🕒 Encrypted on: ${hashData.timestamp}`);
        console.log(`🔐 Algorithm: ${hashData.algorithm}`);
      }
      console.log('\n💡 Use "decrypt" command to restore the original file.');
    } else if (originalExists && !encryptedExists) {
      console.log('🔓 Status: DECRYPTED');
      console.log(`📁 Original file: ${path.basename(SOURCE_FILE)}`);
      console.log('\n💡 Use "encrypt" command to encrypt the file.');
    } else if (originalExists && encryptedExists) {
      console.log('⚠️  Status: BOTH FILES EXIST');
      console.log(`📁 Original: ${path.basename(SOURCE_FILE)}`);
      console.log(`📁 Encrypted: ${path.basename(ENCRYPTED_FILE)}`);
      console.log('\n💡 Use "cleanup" to remove encrypted files.');
    } else {
      console.log('❌ Status: NO FILES FOUND');
      console.log('💡 Make sure the documentation file exists.');
    }
    console.log();
  }

  // Clean up decrypted files with interactive selection
  async cleanupDecrypted() {
    console.clear();
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    🧹 DOCUMENT CLEANUP MANAGEMENT                           ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log();
    console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│                      🔍 SCANNING FOR DECRYPTED FILES                        │');
    console.log('└─────────────────────────────────────────────────────────────────────────────┘');
    console.log();

    // Check if the original file exists
    if (!fs.existsSync(SOURCE_FILE)) {
      console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
      console.log('│                         ℹ️  NO FILES TO CLEANUP                             │');
      console.log('└─────────────────────────────────────────────────────────────────────────────┘');
      console.log();
      console.log('   No decrypted files found in the system.');
      console.log('   Your document security is already optimized.');
      console.log();
      return;
    }

    console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│                        📁 DECRYPTED FILES DETECTED                          │');
    console.log('└─────────────────────────────────────────────────────────────────────────────┘');
    console.log();
    console.log(`   📄 ${path.basename(SOURCE_FILE)}`);
    console.log();
    console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│                      ⚠️  SECURITY CLEANUP WARNING                          │');
    console.log('└─────────────────────────────────────────────────────────────────────────────┘');
    console.log();
    console.log('   This operation will permanently remove decrypted files from your system.');
    console.log('   Ensure you have encrypted copies before proceeding.');
    console.log();

    // Interactive selection with arrow keys
    const files = [path.basename(SOURCE_FILE)];
    let selectedIndex = 0;
    let confirmed = false;

    const showMenu = () => {
      console.clear();
      console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
      console.log('║                    🧹 DOCUMENT CLEANUP MANAGEMENT                           ║');
      console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
      console.log();
      console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
      console.log('│                       🎯 INTERACTIVE FILE SELECTION                         │');
      console.log('└─────────────────────────────────────────────────────────────────────────────┘');
      console.log();
      console.log('   Use ↑/↓ arrow keys to navigate • Enter to confirm • Esc to cancel');
      console.log();
      
      files.forEach((file, index) => {
        if (index === selectedIndex) {
          console.log(`   ► 🗑️  ${file} ◄ [SELECTED]`);
        } else {
          console.log(`     📄 ${file}`);
        }
      });
      
      console.log();
      console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
      console.log('│                      ⚠️  SECURITY CLEANUP WARNING                          │');
      console.log('└─────────────────────────────────────────────────────────────────────────────┘');
      console.log();
      console.log('   This action cannot be undone. Ensure encrypted backups exist.');
      console.log();
      console.log('   [ENTER] Delete Selected File    [ESC] Cancel Operation');
    };

    return new Promise((resolve) => {
      const stdin = process.stdin;
      
      if (!stdin.isTTY) {
        console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
        console.log('│                    ❌ INTERACTIVE MODE NOT SUPPORTED                        │');
        console.log('└─────────────────────────────────────────────────────────────────────────────┘');
        console.log();
        console.log('   This environment does not support interactive file selection.');
        console.log('   Please run this command in a compatible terminal.');
        console.log();
        resolve();
        return;
      }

      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');

      showMenu();

      const onKeyPress = (key) => {
        switch (key) {
          case '\u001b[A': // Up arrow
            selectedIndex = Math.max(0, selectedIndex - 1);
            showMenu();
            break;
          case '\u001b[B': // Down arrow
            selectedIndex = Math.min(files.length - 1, selectedIndex + 1);
            showMenu();
            break;
          case '\r': // Enter
          case '\n':
            confirmed = true;
            stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener('data', onKeyPress);
            
            console.clear();
            console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
            console.log('║                    🧹 DOCUMENT CLEANUP MANAGEMENT                           ║');
            console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
            console.log();
            console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
            console.log('│                        🔄 PROCESSING DELETION                               │');
            console.log('└─────────────────────────────────────────────────────────────────────────────┘');
            console.log();
            console.log('   [⏳] Initializing secure deletion...');
            console.log('   [🗑️] Removing selected file...');
            console.log();
            
            try {
              fs.unlinkSync(SOURCE_FILE);
              console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
              console.log('│                      ✅ CLEANUP OPERATION SUCCESSFUL                        │');
              console.log('└─────────────────────────────────────────────────────────────────────────────┘');
              console.log();
              console.log(`   🗑️  Successfully removed: ${files[selectedIndex]}`);
              console.log('   🛡️  Document security has been optimized');
              console.log('   🎉 Cleanup process completed successfully');
            } catch (error) {
              console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
              console.log('│                        ❌ CLEANUP OPERATION FAILED                          │');
              console.log('└─────────────────────────────────────────────────────────────────────────────┘');
              console.log();
              console.log(`   ❌ Failed to delete: ${files[selectedIndex]}`);
              console.log(`   🔍 Error details: ${error.message}`);
              console.log('   💡 Please check file permissions and try again');
            }
            console.log();
            resolve();
            break;
          case '\u001b': // Escape
          case '\u0003': // Ctrl+C
            stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener('data', onKeyPress);
            
            console.clear();
            console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
            console.log('║                    🧹 DOCUMENT CLEANUP MANAGEMENT                           ║');
            console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
            console.log();
            console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
            console.log('│                         ❌ OPERATION CANCELLED                              │');
            console.log('└─────────────────────────────────────────────────────────────────────────────┘');
            console.log();
            console.log('   Cleanup operation has been cancelled by user request.');
            console.log('   No files were modified or deleted.');
            console.log();
            resolve();
            break;
        }
      };

      stdin.on('data', onKeyPress);
    });
  }

  // Verify password without decrypting
  async verify() {
    try {
      console.log('🔍 Password Verification');
      console.log('========================\n');

      if (!fs.existsSync(HASH_FILE)) {
        console.log('❌ No hash file found. Cannot verify password.');
        return;
      }

      // Get password from command line argument or prompt
      let password;
      if (process.argv[3]) {
        password = process.argv[3];
        console.log('🔑 Using password from command line argument');
      } else {
        password = await this.getPassword('🔑 Enter password to verify: ');
      }

      // Read encrypted file to get salt
      const encryptedBuffer = fs.readFileSync(ENCRYPTED_FILE);
      const salt = encryptedBuffer.slice(0, SALT_LENGTH);

      // Read hash data
      const hashData = JSON.parse(fs.readFileSync(HASH_FILE, 'utf8'));
      const passwordHash = this.hashPassword(password, salt);

      if (passwordHash === hashData.hash) {
        console.log('\n✅ Password is correct!');
      } else {
        console.log('\n❌ Password is incorrect!');
      }
      console.log();

    } catch (error) {
      console.error('❌ Verification failed:', error.message);
    }
  }

  // Helper method to get password input (hidden)
  getPassword(prompt) {
    return new Promise((resolve) => {
      const stdin = process.stdin;
      const stdout = process.stdout;

      stdout.write(prompt);
      
      // Check if stdin supports raw mode (not available in piped input)
      if (stdin.isTTY) {
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        let password = '';
        stdin.on('data', (char) => {
          char = char + '';

          switch (char) {
            case '\n':
            case '\r':
            case '\u0004': // Ctrl+D
              stdin.setRawMode(false);
              stdin.pause();
              stdout.write('\n');
              resolve(password);
              break;
            case '\u0003': // Ctrl+C
              stdout.write('\n');
              process.exit(0);
              break;
            case '\u007f': // Backspace
              if (password.length > 0) {
                password = password.slice(0, -1);
                stdout.write('\b \b');
              }
              break;
            default:
              password += char;
              stdout.write('*');
              break;
          }
        });
      } else {
        // Fallback for non-TTY environments (like piped input)
        this.rl.question('', (password) => {
          resolve(password.trim());
        });
      }
    });
  }

  // Show help
  showHelp() {
    console.log('🔐 Pharmalens Documentation Encryption Tool');
    console.log('==========================================\n');
    console.log('Usage: node encrypt-docs.cjs <command> [password]\n');
    console.log('Commands:');
    console.log('  encrypt [password]  - Encrypt the documentation file');
    console.log('  decrypt [password]  - Decrypt the documentation file');
    console.log('  status              - Check encryption status');
    console.log('  verify [password]   - Verify password without decrypting');
    console.log('  cleanup             - Remove encrypted files');
    console.log('  cleanup-decrypted   - Document Cleanup Management (Interactive)');
    console.log('  help                - Show this help message\n');
    console.log('Examples:');
    console.log('  node encrypt-docs.cjs encrypt');
    console.log('  node encrypt-docs.cjs encrypt mypassword');
    console.log('  node encrypt-docs.cjs decrypt');
    console.log('  node encrypt-docs.cjs status');
    console.log('  node encrypt-docs.cjs cleanup');
    console.log('  node encrypt-docs.cjs cleanup-decrypted\n');
    console.log('Security Features:');
    console.log('  • AES-256-CBC encryption');
    console.log('  • PBKDF2 key derivation (100,000 iterations)');
    console.log('  • Random salt and IV generation');
    console.log('  • Password verification with SHA-256');
    console.log('  • Automatic cleanup of original file after encryption\n');
  }
}

// Main execution
async function main() {
  const encryptor = new DocumentEncryption();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'encrypt':
        await encryptor.encrypt();
        break;
      case 'decrypt':
        await encryptor.decrypt();
        break;
      case 'status':
        encryptor.status();
        break;
      case 'verify':
        await encryptor.verify();
        break;
      case 'cleanup':
        encryptor.cleanup();
        break;
      case 'cleanup-decrypted':
        await encryptor.cleanupDecrypted();
        break;
      case 'help':
      case '--help':
      case '-h':
        encryptor.showHelp();
        break;
      default:
        console.error('❌ Invalid command. Use "help" for usage information.');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    encryptor.rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DocumentEncryption;