# GitHub Actions Workflows

This repository includes automated GitHub Actions workflows for building and releasing the Tangent Copilot plugin.

## Workflows

### 1. Build Workflow (`build.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch
- Manual workflow dispatch

**What it does:**
- Sets up Node.js 18 environment
- Installs dependencies with `npm ci`
- Runs TypeScript compilation check
- Builds the plugin using esbuild
- Verifies build artifacts
- Uploads build artifacts for 7 days

**Use case:** Continuous integration to ensure the plugin builds successfully on every push/PR.

### 2. Release Workflow (`release.yml`)

**Triggers:**
- Release creation (when you create a new release on GitHub)
- Manual workflow dispatch

**What it does:**
- Builds the plugin (same as build workflow)
- Creates a release package (`tangent-plugin.zip`)
- Generates release notes from commits
- Creates a GitHub release with:
  - Release package zip file
  - Individual plugin files
  - Auto-generated release notes
  - Installation instructions

**Use case:** Automated release creation when you create a new release on GitHub.

## How to Create a Release

### Method 1: GitHub Web Interface (Recommended)

1. **Update version in `package.json`:**
   ```bash
   npm version patch  # or minor/major
   ```

2. **Create a release on GitHub:**
   - Go to your repository on GitHub
   - Click "Releases" in the right sidebar
   - Click "Create a new release"
   - Choose a tag (e.g., `v1.0.1`)
   - Add a title and description
   - Click "Publish release"

3. **The workflow will automatically:**
   - Build the plugin
   - Create a release package
   - Attach files to the release
   - Generate release notes

### Method 2: Manual Workflow Dispatch

1. Go to the "Actions" tab in your repository
2. Select the "Build and Release" workflow
3. Click "Run workflow"
4. Choose the branch and click "Run workflow"

## Release Package Contents

The release package (`tangent-plugin.zip`) includes:
- `main.js` - Main plugin bundle (built by esbuild)
- `manifest.json` - Plugin metadata and version info
- `versions.json` - Obsidian version compatibility
- `styles.css` - Plugin styles
- `src/` - Source files (if present)

## Installation Instructions

Users can install the plugin by:
1. Downloading the `tangent-plugin.zip` file from the release
2. Extracting it to their Obsidian plugins folder
3. Enabling the plugin in Obsidian settings

## Requirements

- **Obsidian version:** 0.15.0 or higher (as specified in `manifest.json`)
- **Node.js:** 18+ (for building)
- **GitHub repository:** Must have Actions enabled

## Troubleshooting

### Build Failures
- Check the Actions tab for detailed error logs
- Ensure all dependencies are properly listed in `package.json`
- Verify TypeScript compilation passes locally

### Release Issues
- Make sure the release tag matches the version in `package.json`
- Check that the workflow has permission to create releases
- Verify the `GITHUB_TOKEN` secret is available

### Manual Testing
You can test the build locally before pushing:
```bash
npm ci
npm run build
```

## Workflow Customization

### Adding Environment Variables
If your build requires environment variables, add them in the workflow:
```yaml
- name: Build plugin
  run: npm run build
  env:
    NODE_ENV: production
    CUSTOM_VAR: value
```

### Modifying Build Steps
To add additional build steps, insert them before the "Build plugin" step:
```yaml
- name: Run tests
  run: npm test

- name: Lint code
  run: npm run lint
```

### Changing Node.js Version
Update the `node-version` in the setup-node action:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change to desired version
``` 