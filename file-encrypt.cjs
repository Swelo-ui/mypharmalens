const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const SALT_LENGTH = 32; // 256 bits

class FileEncryption {
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

  // Get list of files in current directory and subdirectories
  getAvailableFiles(dir = '.', excludePatterns = []) {
    const files = [];
    const defaultExcludes = [
      /node_modules/,
      /\.git/,
      /\.encrypted$/,
      /\.bat$/,
      /\.exe$/,
      /package-lock\.json$/,
      /bun\.lock$/,
      /\.tsbuildinfo$/
    ];
    
    const allExcludes = [...defaultExcludes, ...excludePatterns];

    const scanDirectory = (currentDir) => {
      try {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const relativePath = path.relative('.', fullPath);
          
          // Skip if matches exclude patterns
          if (allExcludes.some(pattern => pattern.test(relativePath))) {
            continue;
          }
          
          const stat = fs.statSync(fullPath);
          
          if (stat.isFile()) {
            files.push({
              path: relativePath,
              size: stat.size,
              modified: stat.mtime
            });
          } else if (stat.isDirectory() && !relativePath.startsWith('.')) {
            scanDirectory(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    scanDirectory(dir);
    return files.sort((a, b) => a.path.localeCompare(b.path));
  }

  // Select files for encryption with interactive navigation
  async selectFilesForEncryption() {
    console.log('📁 Interactive File Selection for Encryption');
    console.log('===========================================\n');
    
    const files = this.getAvailableFiles('.', []);
    
    if (files.length === 0) {
      console.log('ℹ️  No files available for encryption.\n');
      return [];
    }

    console.log('🎯 Navigation Instructions:');
    console.log('• Use ↑/↓ arrow keys to navigate');
    console.log('• Press SPACE to select/deselect files');
    console.log('• Press ENTER to confirm selection');
    console.log('• Press ESC or Q to quit');
    console.log('• Press A to select all files');
    console.log('• Press C to clear all selections\n');

    const selectedFiles = await this.interactiveFileSelection(files, 'Interactive File Selection for Encryption');
    
    if (selectedFiles.length === 0) {
      console.log('❌ No files selected.');
      return [];
    }
    
    console.log('\n✅ Selected files:');
    selectedFiles.forEach(file => {
      console.log(`   • ${file.path}`);
    });
    
    console.log('\n🔐 Starting encryption...\n');
    
    return selectedFiles;
  }

  // Interactive file selection with arrow keys
  async interactiveFileSelection(files) {
    return new Promise((resolve) => {
      let currentIndex = 0;
      let selectedIndices = new Set();
      let isActive = true;
      let buffer = '';

      // Enable raw mode for key detection
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const displayFiles = () => {
        // Clear screen and move cursor to top
        process.stdout.write('\x1b[2J\x1b[H');
        
        console.log('📁 Interactive File Selection for Encryption');
        console.log('===========================================\n');
        console.log('🎯 Navigation: ↑/↓ arrows | SPACE: select | ENTER: confirm | ESC/Q: quit | A: all | C: clear\n');
        
        // Show files with pagination if needed
        const startIndex = Math.max(0, currentIndex - 10);
        const endIndex = Math.min(files.length, currentIndex + 11);
        
        if (startIndex > 0) {
          console.log(`   ... (${startIndex} files above)`);
        }
        
        for (let i = startIndex; i < endIndex; i++) {
          const file = files[i];
          const sizeKB = (file.size / 1024).toFixed(1);
          const isSelected = selectedIndices.has(i);
          const isCurrent = i === currentIndex;
          
          let prefix = '  ';
          if (isCurrent && isSelected) {
            prefix = '▶ ✓';
          } else if (isCurrent) {
            prefix = '▶ ';
          } else if (isSelected) {
            prefix = '  ✓';
          }
          
          const line = `${prefix} [${i + 1}] ${file.path} (${sizeKB} KB)`;
          
          if (isCurrent) {
            // Highlight current line with background color
            console.log(`\x1b[7m${line}\x1b[0m`);
          } else if (isSelected) {
            // Green text for selected files
            console.log(`\x1b[32m${line}\x1b[0m`);
          } else {
            console.log(line);
          }
        }
        
        if (endIndex < files.length) {
          console.log(`   ... (${files.length - endIndex} files below)`);
        }
        
        console.log(`\n📊 Selected: ${selectedIndices.size}/${files.length} files`);
      };

      const handleKeyPress = (chunk) => {
        if (!isActive) return;

        buffer += chunk;
        
        // Handle multi-byte sequences
        if (buffer.includes('\x1b[')) {
          if (buffer.includes('\x1b[A')) { // Up arrow
            currentIndex = Math.max(0, currentIndex - 1);
            displayFiles();
            buffer = '';
            return;
          } else if (buffer.includes('\x1b[B')) { // Down arrow
            currentIndex = Math.min(files.length - 1, currentIndex + 1);
            displayFiles();
            buffer = '';
            return;
          } else if (buffer.includes('\x1b[C') || buffer.includes('\x1b[D')) {
            // Right/Left arrows - ignore
            buffer = '';
            return;
          }
          
          // If we have an incomplete escape sequence, wait for more
          if (buffer.length < 3) {
            return;
          }
          
          // Reset buffer if sequence is unrecognized
          buffer = '';
          return;
        }
        
        // Handle single character inputs
        const key = buffer;
        buffer = '';
        
        switch (key) {
          case '\x1b': // ESC
          case 'q':
          case 'Q':
            isActive = false;
            cleanup();
            resolve([]);
            break;
            
          case '\r': // ENTER (Windows uses \r)
          case '\n': // ENTER (Unix)
            isActive = false;
            cleanup();
            const result = Array.from(selectedIndices).map(i => files[i]);
            resolve(result);
            break;
            
          case ' ': // SPACE
            if (selectedIndices.has(currentIndex)) {
              selectedIndices.delete(currentIndex);
            } else {
              selectedIndices.add(currentIndex);
            }
            displayFiles();
            break;
            
          case 'a':
          case 'A':
            // Select all
            selectedIndices.clear();
            for (let i = 0; i < files.length; i++) {
              selectedIndices.add(i);
            }
            displayFiles();
            break;
            
          case 'c':
          case 'C':
            // Clear all selections
            selectedIndices.clear();
            displayFiles();
            break;
            
          // Alternative navigation with WASD or JK
          case 'w':
          case 'W':
          case 'k':
          case 'K':
            currentIndex = Math.max(0, currentIndex - 1);
            displayFiles();
            break;
            
          case 's':
          case 'S':
          case 'j':
          case 'J':
            currentIndex = Math.min(files.length - 1, currentIndex + 1);
            displayFiles();
            break;
        }
      };

      const cleanup = () => {
        process.stdin.setRawMode(false);
        process.stdin.removeListener('data', handleKeyPress);
        process.stdin.pause();
        console.log('\n');
      };

      // Initial display
      displayFiles();
      
      // Listen for key presses
      process.stdin.on('data', handleKeyPress);
    });
  }

  // Encrypt multiple files
  async encryptFiles() {
    try {
      console.log('🔐 Pharmalens Multi-File Encryption Tool');
      console.log('========================================\n');

      const selectedFiles = await this.selectFilesForEncryption();
      
      if (selectedFiles.length === 0) {
        return;
      }

      // Get password
      let password;
      if (process.argv[3]) {
        password = process.argv[3];
        console.log('\n🔑 Using password from command line argument');
      } else {
        password = await this.getPassword('\n🔑 Enter encryption password: ');
      }

      if (!password || password.length < 8) {
        console.error('❌ Password must be at least 8 characters long!');
        process.exit(1);
      }

      // Confirm password
      let confirmPassword;
      if (process.argv[3]) {
        confirmPassword = password;
      } else {
        confirmPassword = await this.getPassword('🔑 Confirm password: ');
      }

      if (password !== confirmPassword) {
        console.error('❌ Passwords do not match!');
        process.exit(1);
      }

      console.log('\n🔄 Encrypting files...\n');

      let successCount = 0;
      let errorCount = 0;

      for (const file of selectedFiles) {
        try {
          await this.encryptSingleFile(file.path, password);
          console.log(`✅ ${file.path} - Encrypted successfully`);
          successCount++;
        } catch (error) {
          console.log(`❌ ${file.path} - Failed: ${error.message}`);
          errorCount++;
        }
      }

      console.log('\n📊 Encryption Summary:');
      console.log(`✅ Successfully encrypted: ${successCount} files`);
      if (errorCount > 0) {
        console.log(`❌ Failed to encrypt: ${errorCount} files`);
      }
      console.log('\n💡 Use "decrypt-files" command to restore original files.\n');

    } catch (error) {
      console.error('❌ Encryption failed:', error.message);
      process.exit(1);
    }
  }

  // Encrypt a single file
  async encryptSingleFile(filePath, password) {
    const encryptedPath = filePath + '.encrypted';
    const hashPath = filePath + '.hash';

    // Check if already encrypted
    if (fs.existsSync(encryptedPath)) {
      throw new Error('File is already encrypted');
    }

    // Check if source file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Source file not found');
    }

    // Generate salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key
    const key = this.deriveKey(password, salt);

    // Read original file
    const originalData = fs.readFileSync(filePath);

    // Create cipher
    const cipher = crypto.createCipher(ALGORITHM, key);
    
    // Encrypt data
    let encrypted = cipher.update(originalData);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Combine salt, IV, and encrypted data
    const finalData = Buffer.concat([salt, iv, encrypted]);

    // Write encrypted file
    fs.writeFileSync(encryptedPath, finalData);

    // Create password hash for verification
    const passwordHash = this.hashPassword(password, salt);
    const hashData = {
      hash: passwordHash,
      timestamp: new Date().toISOString(),
      algorithm: ALGORITHM,
      originalFile: filePath
    };
    fs.writeFileSync(hashPath, JSON.stringify(hashData, null, 2));

    // Remove original file
    fs.unlinkSync(filePath);
  }

  // List encrypted files
  listEncryptedFiles() {
    console.log('🔐 Encrypted Files Status');
    console.log('=========================\n');

    const encryptedFiles = this.getEncryptedFiles();
    
    if (encryptedFiles.length === 0) {
      console.log('ℹ️  No encrypted files found.\n');
      return;
    }

    console.log('Encrypted files:');
    encryptedFiles.forEach((file, index) => {
      const hashFile = file.replace('.encrypted', '.hash');
      let info = 'No hash file';
      
      if (fs.existsSync(hashFile)) {
        try {
          const hashData = JSON.parse(fs.readFileSync(hashFile, 'utf8'));
          const date = new Date(hashData.timestamp).toLocaleString();
          info = `Encrypted: ${date}`;
        } catch (error) {
          info = 'Invalid hash file';
        }
      }
      
      console.log(`[${index + 1}] ${file} - ${info}`);
    });
    console.log('');
  }

  // Get list of encrypted files
  getEncryptedFiles() {
    const files = [];
    
    const scanDirectory = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relativePath = path.relative('.', fullPath);
          
          if (fs.statSync(fullPath).isFile() && item.endsWith('.encrypted')) {
            files.push(relativePath);
          } else if (fs.statSync(fullPath).isDirectory() && !relativePath.startsWith('.')) {
            scanDirectory(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    scanDirectory('.');
    return files.sort();
  }

  // Decrypt files
  // Select encrypted files for decryption with interactive navigation
  async selectFilesForDecryption() {
    console.log('🔓 Interactive File Selection for Decryption');
    console.log('===========================================\n');

    const encryptedFiles = this.getEncryptedFiles();
    
    if (encryptedFiles.length === 0) {
      console.log('ℹ️  No encrypted files found.\n');
      return [];
    }

    // Convert encrypted file paths to file objects for consistency
    const files = encryptedFiles.map(filePath => ({
      path: filePath,
      size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
    }));

    console.log('🎯 Navigation Instructions:');
    console.log('• Use ↑/↓ arrow keys to navigate');
    console.log('• Press SPACE to select/deselect files');
    console.log('• Press ENTER to confirm selection');
    console.log('• Press ESC or Q to quit');
    console.log('• Press A to select all files');
    console.log('• Press C to clear all selections\n');

    const selectedFiles = await this.interactiveFileSelection(files);
    
    if (selectedFiles.length === 0) {
      console.log('❌ No files selected.');
      return [];
    }
    
    console.log('\n✅ Selected files for decryption:');
    selectedFiles.forEach(file => {
      console.log(`   • ${file.path}`);
    });
    
    console.log('\n🔓 Starting decryption...\n');
    
    return selectedFiles.map(file => file.path);
  }

  // Decrypt multiple files
  async decryptFiles() {
    console.log('🔓 Pharmalens Multi-File Decryption Tool');
    console.log('========================================\n');

    const selectedFiles = await this.selectFilesForDecryption();
    
    if (selectedFiles.length === 0) {
      return;
    }

    // Get password
    let password;
    if (process.argv[3]) {
      password = process.argv[3];
      console.log('\n🔑 Using password from command line argument');
    } else {
      password = await this.getPassword('\n🔑 Enter decryption password: ');
    }

    console.log('\n🔄 Decrypting files...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const encryptedFile of selectedFiles) {
      try {
        await this.decryptSingleFile(encryptedFile, password);
        console.log(`✅ ${encryptedFile} - Decrypted successfully`);
        successCount++;
      } catch (error) {
        console.log(`❌ ${encryptedFile} - Failed: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Decryption Summary:');
    console.log(`✅ Successfully decrypted: ${successCount} files`);
    if (errorCount > 0) {
      console.log(`❌ Failed to decrypt: ${errorCount} files`);
    }
    console.log('');
  }

  // Decrypt a single file
  async decryptSingleFile(encryptedPath, password) {
    const originalPath = encryptedPath.replace('.encrypted', '');
    const hashPath = encryptedPath.replace('.encrypted', '.hash');

    // Check if original file already exists
    if (fs.existsSync(originalPath)) {
      throw new Error('Original file already exists');
    }

    // Check if encrypted file exists
    if (!fs.existsSync(encryptedPath)) {
      throw new Error('Encrypted file not found');
    }

    // Read hash file for verification
    if (!fs.existsSync(hashPath)) {
      throw new Error('Hash file not found');
    }

    const hashData = JSON.parse(fs.readFileSync(hashPath, 'utf8'));

    // Read encrypted file
    const encryptedData = fs.readFileSync(encryptedPath);

    // Extract salt, IV, and encrypted content
    const salt = encryptedData.slice(0, SALT_LENGTH);
    const iv = encryptedData.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = encryptedData.slice(SALT_LENGTH + IV_LENGTH);

    // Verify password
    const passwordHash = this.hashPassword(password, salt);
    if (passwordHash !== hashData.hash) {
      throw new Error('Invalid password');
    }

    // Derive key
    const key = this.deriveKey(password, salt);

    // Create decipher
    const decipher = crypto.createDecipher(ALGORITHM, key);

    // Decrypt data
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Write original file
    fs.writeFileSync(originalPath, decrypted);
  }

  // Cleanup encrypted files
  cleanupEncryptedFiles() {
    console.log('🗑️  Cleanup Encrypted Files');
    console.log('===========================\n');

    const encryptedFiles = this.getEncryptedFiles();
    
    if (encryptedFiles.length === 0) {
      console.log('ℹ️  No encrypted files found to cleanup.\n');
      return;
    }

    console.log('Files to be removed:');
    encryptedFiles.forEach(file => {
      console.log(`   • ${file}`);
      const hashFile = file.replace('.encrypted', '.hash');
      if (fs.existsSync(hashFile)) {
        console.log(`   • ${hashFile}`);
      }
    });

    console.log(`\n⚠️  This will permanently delete ${encryptedFiles.length} encrypted files and their hash files.`);
    
    return new Promise((resolve) => {
      this.rl.question('Are you sure? (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          let removedCount = 0;
          
          encryptedFiles.forEach(file => {
            try {
              fs.unlinkSync(file);
              removedCount++;
              
              const hashFile = file.replace('.encrypted', '.hash');
              if (fs.existsSync(hashFile)) {
                fs.unlinkSync(hashFile);
              }
            } catch (error) {
              console.log(`❌ Failed to remove ${file}: ${error.message}`);
            }
          });
          
          console.log(`✅ Removed ${removedCount} encrypted files.\n`);
        } else {
          console.log('❌ Cleanup cancelled.\n');
        }
        resolve();
      });
    });
  }

  // Get original files that have encrypted versions
  getOriginalFilesWithEncrypted() {
    const encryptedFiles = this.getEncryptedFiles();
    const originalFiles = [];
    
    encryptedFiles.forEach(encryptedFile => {
      const originalFile = encryptedFile.replace('.encrypted', '');
      if (fs.existsSync(originalFile)) {
        originalFiles.push(originalFile);
      }
    });
    
    return originalFiles;
  }

  // Interactive selection for original files cleanup
  async selectOriginalFilesForCleanup() {
    const originalFiles = this.getOriginalFilesWithEncrypted();
    
    if (originalFiles.length === 0) {
      console.log('ℹ️  No original files found that have encrypted versions.\n');
      return [];
    }

    console.log('🗑️  Interactive File Selection for Original Files Cleanup');
    console.log('======================================================\n');

    let selectedFiles = [];
    let currentIndex = 0;

    const displayFiles = () => {
      console.clear();
      console.log('🗑️  Interactive File Selection for Original Files Cleanup');
      console.log('======================================================\n');
      console.log('🎯 Navigation: ↑/↓ arrows | SPACE: select | ENTER: confirm | ESC/Q: quit | A: all | C: clear\n');

      originalFiles.forEach((file, index) => {
        const isSelected = selectedFiles.includes(file);
        const isCurrent = index === currentIndex;
        const stats = fs.statSync(file);
        const size = (stats.size / 1024).toFixed(1);
        
        const marker = isCurrent ? '▶' : ' ';
        const checkbox = isSelected ? '✓' : ' ';
        const selectedIndex = isSelected ? `[${selectedFiles.indexOf(file) + 1}]` : '   ';
        
        console.log(`${marker} ${checkbox} ${selectedIndex} ${file} (${size} KB)`);
      });

      console.log(`\n📊 Selected: ${selectedFiles.length}/${originalFiles.length} files\n`);
      console.log('⚠️  Warning: These original files will be permanently deleted!');
      console.log('   Make sure you have encrypted versions as backup.\n');
    };

    return new Promise((resolve) => {
      displayFiles();

      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const handleInput = (key) => {
        switch (key) {
          case '\u001b[A': // Up arrow
            currentIndex = Math.max(0, currentIndex - 1);
            displayFiles();
            break;
          case '\u001b[B': // Down arrow
            currentIndex = Math.min(originalFiles.length - 1, currentIndex + 1);
            displayFiles();
            break;
          case ' ': // Space - toggle selection
            const file = originalFiles[currentIndex];
            if (selectedFiles.includes(file)) {
              selectedFiles = selectedFiles.filter(f => f !== file);
            } else {
              selectedFiles.push(file);
            }
            displayFiles();
            break;
          case '\r': // Enter - confirm selection
            process.stdin.setRawMode(false);
            process.stdin.removeListener('data', handleInput);
            console.log('\n✅ Selected files for cleanup:');
            selectedFiles.forEach(file => {
              console.log(`   • ${file}`);
            });
            console.log('\n🗑️  Starting cleanup...\n');
            resolve(selectedFiles);
            break;
          case '\u001b': // ESC
          case 'q':
          case 'Q':
            process.stdin.setRawMode(false);
            process.stdin.removeListener('data', handleInput);
            console.log('\n❌ Cleanup cancelled.\n');
            resolve([]);
            break;
          case 'a':
          case 'A': // Select all
            selectedFiles = [...originalFiles];
            displayFiles();
            break;
          case 'c':
          case 'C': // Clear selection
            selectedFiles = [];
            displayFiles();
            break;
        }
      };

      process.stdin.on('data', handleInput);
    });
  }

  // Cleanup original files
  async cleanupOriginalFiles() {
    console.log('🗑️  Pharmalens Original Files Cleanup Tool');
    console.log('==========================================\n');

    const selectedFiles = await this.selectOriginalFilesForCleanup();
    
    if (selectedFiles.length === 0) {
      return;
    }

    console.log('🗑️  Cleaning up original files...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const file of selectedFiles) {
      try {
        fs.unlinkSync(file);
        console.log(`✅ ${file} - Deleted successfully`);
        successCount++;
      } catch (error) {
        console.log(`❌ ${file} - Failed: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Cleanup Summary:');
    console.log(`✅ Successfully deleted: ${successCount} files`);
    if (errorCount > 0) {
      console.log(`❌ Failed to delete: ${errorCount} files`);
    }
    console.log('');
  }

  // Get password input (hidden)
  getPassword(prompt) {
    return new Promise((resolve) => {
      process.stdout.write(prompt);
      
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        
        let password = '';
        
        const onData = (char) => {
          const charStr = char.toString('utf8');
          
          if (charStr === '\n' || charStr === '\r' || charStr === '\u0004') {
            process.stdin.setRawMode(false);
            process.stdin.removeListener('data', onData);
            process.stdout.write('\n');
            resolve(password);
          } else if (charStr === '\u0008' || charStr === '\u007f') {
            if (password.length > 0) {
              password = password.slice(0, -1);
              process.stdout.write('\b \b');
            }
          } else if (charStr === '\u0003') {
            process.exit(1);
          } else if (charStr >= ' ' && charStr <= '~') {
            password += charStr;
            process.stdout.write('*');
          }
        };
        
        process.stdin.on('data', onData);
      } else {
        this.rl.question('', (password) => {
          resolve(password.trim());
        });
      }
    });
  }

  // Get regular input
  // Get confirmation input (works after interactive selection)
  async getConfirmation(prompt) {
    return new Promise((resolve) => {
      // Reset stdin to normal mode
      process.stdin.setRawMode(false);
      process.stdin.setEncoding('utf8');
      
      process.stdout.write(prompt);
      
      const handleInput = (data) => {
        const input = data.toString().trim().toLowerCase();
        process.stdin.removeListener('data', handleInput);
        resolve(input === 'y' || input === 'yes');
      };
      
      process.stdin.on('data', handleInput);
    });
  }

  getInput(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  // Show help
  showHelp() {
    console.log('🔐 Pharmalens Multi-File Encryption Tool');
    console.log('========================================\n');
    console.log('Usage: node file-encrypt.cjs <command> [password]\n');
    console.log('Commands:');
    console.log('  encrypt-files [password]  - Select and encrypt multiple files');
    console.log('  decrypt-files [password]  - Select and decrypt multiple files');
    console.log('  list                      - List all encrypted files');
    console.log('  cleanup                   - Remove all encrypted files');
    console.log('  cleanup-originals         - Remove original files that have encrypted versions');
    console.log('  help                      - Show this help message\n');
    console.log('Examples:');
    console.log('  node file-encrypt.cjs encrypt-files');
    console.log('  node file-encrypt.cjs decrypt-files');
    console.log('  node file-encrypt.cjs list');
    console.log('  node file-encrypt.cjs cleanup');
    console.log('  node file-encrypt.cjs cleanup-originals\n');
    console.log('Security Features:');
    console.log('  • AES-256-CBC encryption');
    console.log('  • PBKDF2 key derivation (100,000 iterations)');
    console.log('  • Random salt and IV generation');
    console.log('  • Password verification with SHA-256');
    console.log('  • Individual file encryption with separate hash files\n');
  }
}

// Main execution
async function main() {
  const encryptor = new FileEncryption();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'encrypt-files':
        await encryptor.encryptFiles();
        break;
      case 'decrypt-files':
        await encryptor.decryptFiles();
        break;
      case 'list':
        encryptor.listEncryptedFiles();
        break;
      case 'cleanup':
        await encryptor.cleanupEncryptedFiles();
        break;
      case 'cleanup-originals':
        await encryptor.cleanupOriginalFiles();
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

module.exports = FileEncryption;