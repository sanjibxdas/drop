import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {
  sanitizeFilePath,
  validateSlug,
  hashPassword,
  verifyPassword,
  generateApiKey,
  hashToken,
} from './security.ts';
import { MemoryStorageProvider } from './storage.ts';
import { DataStore } from './datastore.ts';
import { DeploymentEngine } from './deployment-engine.ts';

test('sanitizeFilePath removes unsafe traversal and OS junk', () => {
  assert.equal(sanitizeFilePath('index.html'), 'index.html');
  assert.equal(sanitizeFilePath('assets/css/main.css'), 'assets/css/main.css');
  assert.equal(sanitizeFilePath('assets\\css\\main.css'), 'assets/css/main.css');
  assert.equal(sanitizeFilePath('/about/team.html/'), 'about/team.html');

  // Directory traversal attacks
  assert.equal(sanitizeFilePath('../etc/passwd'), null);
  assert.equal(sanitizeFilePath('assets/../../secret.txt'), null);
  assert.equal(sanitizeFilePath('..'), null);

  // OS artifacts
  assert.equal(sanitizeFilePath('__MACOSX/._image.png'), null);
  assert.equal(sanitizeFilePath('.DS_Store'), null);
  assert.equal(sanitizeFilePath('assets/.DS_Store'), null);
  assert.equal(sanitizeFilePath('Thumbs.db'), null);

  // Null bytes
  assert.equal(sanitizeFilePath('image.png\0.html'), null);
});

test('slug validation accepts good slugs and rejects illegal/reserved slugs', () => {
  assert.equal(validateSlug('my-cool-site').valid, true);
  assert.equal(validateSlug('v1-preview-3').valid, true);
  assert.equal(validateSlug('ab').valid, false); // too short
  assert.equal(validateSlug('api').valid, false); // reserved
  assert.equal(validateSlug('-invalid-start').valid, false);
  assert.equal(validateSlug('Invalid_Caps!').valid, false);
});

test('password hashing and verification with scrypt/PBKDF2', () => {
  const password = 'SuperSecret123!';
  const { hash, salt } = hashPassword(password);
  assert.ok(hash.length > 32);
  assert.ok(salt.length > 16);

  assert.equal(verifyPassword(password, hash, salt), true);
  assert.equal(verifyPassword('WrongPassword', hash, salt), false);
});

test('API key generation and hashing', () => {
  const { apiKey, keyHash, prefix } = generateApiKey();
  assert.ok(apiKey.startsWith('drop_live_'));
  assert.ok(prefix.startsWith('drop_live_'));
  assert.equal(hashToken(apiKey), keyHash);
});

test('MemoryStorageProvider handles files, listing, and deletion', async () => {
  const storage = new MemoryStorageProvider();
  const depId = 'test_dep_1';

  await storage.putFile(depId, 'index.html', Buffer.from('<h1>Hello</h1>', 'utf-8'), 'text/html');
  await storage.putFile(depId, 'css/style.css', Buffer.from('body { color: red; }', 'utf-8'), 'text/css');

  assert.equal(await storage.hasFile(depId, 'index.html'), true);
  assert.equal(await storage.hasFile(depId, 'missing.txt'), false);

  const file = await storage.getFile(depId, 'index.html');
  assert.ok(file);
  assert.equal(file.content.toString('utf-8'), '<h1>Hello</h1>');
  assert.equal(file.contentType, 'text/html');

  const files = await storage.listFiles(depId);
  assert.equal(files.length, 2);
  assert.ok(files.includes('index.html'));
  assert.ok(files.includes('css/style.css'));

  await storage.deleteDeploymentFiles(depId);
  assert.equal(await storage.hasFile(depId, 'index.html'), false);
  assert.equal((await storage.listFiles(depId)).length, 0);
});

test('DeploymentEngine deploys raw HTML document with tokens and public URL', async () => {
  const storage = new MemoryStorageProvider();
  const datastore = new DataStore('./.data/test_metadata.json');
  const engine = new DeploymentEngine(storage, datastore);

  const html = '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Welcome</h1></body></html>';
  const result = await engine.deployHtml(html, { name: 'My Test Drop' });

  assert.ok(result.deployment.id.startsWith('drop_'));
  assert.ok(result.deployment.slug.length > 0);
  assert.equal(result.deployment.name, 'My Test Drop');
  assert.equal(result.deployment.entrypoint, 'index.html');
  assert.equal(result.deployment.fileCount, 1);
  assert.ok(result.deployment.totalBytes > 0);
  assert.ok(result.url.includes(`/sites/${result.deployment.slug}`));

  // Anonymous tokens must be present
  assert.ok(result.claimToken && result.claimToken.startsWith('claim_'));
  assert.ok(result.deletionToken && result.deletionToken.startsWith('del_'));

  // File must exist in storage
  const stored = await storage.getFile(result.deployment.id, 'index.html');
  assert.ok(stored);
  assert.equal(stored.content.toString('utf-8'), html);
});

test('DeploymentEngine deploys ZIP archive and auto-unwraps redundant root folder', async () => {
  const storage = new MemoryStorageProvider();
  const datastore = new DataStore('./.data/test_metadata_zip.json');
  const engine = new DeploymentEngine(storage, datastore);

  // Create ZIP with redundant top-level directory "my-project/"
  const zip = new JSZip();
  zip.file('my-project/index.html', '<!DOCTYPE html><html><body>Hi</body></html>');
  zip.file('my-project/style.css', 'body { margin: 0; }');
  zip.file('my-project/scripts/app.js', 'console.log("ready");');

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const result = await engine.deployZip(zipBuffer, { name: 'Zip Drop' });

  assert.equal(result.deployment.fileCount, 3);
  assert.ok(result.deployment.files.includes('index.html'));
  assert.ok(result.deployment.files.includes('style.css'));
  assert.ok(result.deployment.files.includes('scripts/app.js'));

  const indexStored = await storage.getFile(result.deployment.id, 'index.html');
  assert.ok(indexStored);
  assert.ok(indexStored.content.toString('utf-8').includes('Hi'));
});

test('DeploymentEngine appends files and increments deployment version', async () => {
  const storage = new MemoryStorageProvider();
  const datastore = new DataStore('./.data/test_metadata_append.json');
  const engine = new DeploymentEngine(storage, datastore);

  const initial = await engine.deployHtml('<h1>V1</h1>', {
    ownerId: 'user_123',
    name: 'Versioned App',
  });
  assert.equal(initial.deployment.version, 1);

  const updated = await engine.appendFiles(
    initial.deployment.id,
    [
      { path: 'about.html', content: '<h1>About Us</h1>' },
      { path: 'style.css', content: 'body { background: #000; }' },
    ],
    { userId: 'user_123', apiKeyId: null, isOwner: true, canClaim: false }
  );

  assert.equal(updated.version, 2);
  assert.equal(updated.fileCount, 3);
  assert.ok(updated.files.includes('about.html'));
  assert.ok(updated.files.includes('style.css'));

  const aboutFile = await storage.getFile(updated.id, 'about.html');
  assert.ok(aboutFile);
  assert.equal(aboutFile.content.toString('utf-8'), '<h1>About Us</h1>');
});

test('Claiming anonymous deployment associates it with an account and invalidates token', async () => {
  const storage = new MemoryStorageProvider();
  const datastore = new DataStore('./.data/test_metadata_claim.json');
  const engine = new DeploymentEngine(storage, datastore);

  const anon = await engine.deployHtml('<h1>Anon</h1>');
  assert.equal(anon.deployment.ownerId, null);
  assert.ok(anon.claimToken);

  // Claim with valid token
  const claimed = await datastore.claimDeployment(anon.deployment.id, anon.claimToken, 'user_456');
  assert.ok(claimed);
  assert.equal(claimed.ownerId, 'user_456');
  assert.equal(claimed.claimTokenHash, null); // Cannot be claimed again

  // Attempting to claim again fails
  await assert.rejects(
    async () => {
      await datastore.claimDeployment(anon.deployment.id, anon.claimToken!, 'user_789');
    },
    /already claimed/
  );
});

test('MCP handler supports initialize, tools/list, and deploy_html', async () => {
  const { handleMcpRequest } = await import('./mcp.ts');

  // Test initialize
  const initRes = await handleMcpRequest(
    { jsonrpc: '2.0', id: 1, method: 'initialize' },
    { userId: null, apiKeyId: null, isOwner: false, canClaim: false }
  );
  assert.equal(initRes.result.serverInfo.name, 'drop-deployment-mcp');

  // Test tools/list
  const listRes = await handleMcpRequest(
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { userId: null, apiKeyId: null, isOwner: false, canClaim: false }
  );
  assert.ok(Array.isArray(listRes.result.tools));
  assert.ok(listRes.result.tools.some((t: any) => t.name === 'deploy_html'));

  // Test deploy_html
  const deployRes = await handleMcpRequest(
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'deploy_html',
        arguments: { html: '<h1>MCP Deployed Site</h1>', name: 'Agent Site' },
      },
    },
    { userId: null, apiKeyId: null, isOwner: false, canClaim: false }
  );
  assert.ok(deployRes.result.content[0].text.includes('MCP Deployed Site') === false); // URL json
  const parsed = JSON.parse(deployRes.result.content[0].text);
  assert.equal(parsed.success, true);
  assert.ok(parsed.url.includes('/sites/'));
});
