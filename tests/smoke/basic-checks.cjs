#!/usr/bin/env node
// Smoke Test: Basic Health Checks (1-2 seconds)
// Catches catastrophic failures before push

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '../..');
let failures = [];

console.log('🔥 Running smoke tests for mission-control-cole...\n');

// Test 1: Critical files exist
console.log('Test 1: Critical files exist');
const criticalFiles = [
    'src/main.tsx',
    'src/App.tsx',
    'index.html',
    'package.json',
    'tsconfig.json'
];

criticalFiles.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(filePath)) {
        failures.push(`❌ Missing critical file: ${file}`);
    } else {
        console.log(`  ✓ ${file} exists`);
    }
});

// Test 2: package.json valid
console.log('\nTest 2: Package configuration');
try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
    if (!pkg.name || !pkg.version) {
        failures.push('❌ package.json missing name or version');
    } else {
        console.log(`  ✓ package.json valid (${pkg.name}@${pkg.version})`);
    }
    
    // Check for build script
    if (!pkg.scripts || !pkg.scripts.build) {
        failures.push('❌ package.json missing build script');
    } else {
        console.log('  ✓ build script present');
    }
} catch (err) {
    failures.push(`❌ package.json invalid: ${err.message}`);
}

// Test 3: TypeScript config valid
console.log('\nTest 3: TypeScript configuration');
try {
    const tsconfig = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'tsconfig.json'), 'utf8'));
    // Check for either compilerOptions or references (project references pattern)
    if (!tsconfig.compilerOptions && !tsconfig.references) {
        failures.push('❌ tsconfig.json missing compilerOptions or references');
    } else {
        console.log('  ✓ tsconfig.json valid');
    }
} catch (err) {
    failures.push(`❌ tsconfig.json invalid: ${err.message}`);
}

// Test 4: No hardcoded secrets in source files
console.log('\nTest 4: Security check');
const secretPatterns = [
    { pattern: /sk-[a-zA-Z0-9]{48}/, name: 'OpenAI key' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub token' },
    { pattern: /AIza[0-9A-Za-z_-]{35}/, name: 'Google API key' },
    { pattern: /pk_live_[a-zA-Z0-9]{24,}/, name: 'Stripe live key' }
];

const srcFiles = ['src/main.tsx', 'src/App.tsx'];
let secretsFound = false;

srcFiles.forEach(file => {
    if (!fs.existsSync(path.join(PROJECT_ROOT, file))) return;
    const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
    
    secretPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(content)) {
            failures.push(`❌ Hardcoded ${name} detected in ${file}`);
            secretsFound = true;
        }
    });
});

if (!secretsFound) {
    console.log('  ✓ No hardcoded secrets detected');
}

// Test 5: Dependencies installed
console.log('\nTest 5: Dependencies check');
if (!fs.existsSync(path.join(PROJECT_ROOT, 'node_modules'))) {
    failures.push('❌ node_modules missing - run npm install');
} else {
    console.log('  ✓ node_modules present');
}

// Results
console.log('\n' + '='.repeat(50));
if (failures.length === 0) {
    console.log('✅ All smoke tests passed (5/5)');
    console.log('Safe to commit/push');
    process.exit(0);
} else {
    console.log(`❌ Smoke tests failed (${failures.length} failures):\n`);
    failures.forEach(f => console.log(f));
    console.log('\n🚨 DO NOT PUSH - Fix failures first');
    process.exit(1);
}
