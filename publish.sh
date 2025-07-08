#!/bin/bash

# Check parameters
VERSION_TYPE=${1:-patch}

# Check if package.json exists in current directory
if [ ! -f "./package.json" ]; then
    echo "package.json not found in current directory"
    exit 1
fi

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "Invalid version type. Please use patch, minor, or major"
    echo "Usage: ./publish.sh [patch|minor|major]"
    exit 1
fi

# Get package name
PACKAGE_NAME=$(node -p "require('./package.json').name")

# Execute build
echo "Starting build with pnpm..."
pnpm build

# Check build result
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

# Display current version info
echo "Local version:"
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo $CURRENT_VERSION

# Check GITHUB_TOKEN environment variable
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable not set"
    echo "Usage:"
    echo "1. Temporary: export GITHUB_TOKEN=\"your_github_token\""
    echo "2. Permanent: echo 'export GITHUB_TOKEN=\"your_github_token\"' >> ~/.zshrc"
    echo "3. Or run directly: GITHUB_TOKEN=\"your_github_token\" $0 $1"
    exit 1
fi

# Verify npm authentication
# Set temporary npm authentication
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" > .npmrc.temp
if ! npm whoami --registry=https://npm.pkg.github.com --userconfig .npmrc.temp > /dev/null 2>&1; then
    rm .npmrc.temp
    echo "npm authentication failed, please check token"
    exit 1
fi

# Try to get remote version
echo "Checking remote version..."
REMOTE_VERSION=$(npm view $PACKAGE_NAME version --registry=https://npm.pkg.github.com --userconfig .npmrc.temp 2>/dev/null || echo "not-published")
echo "Remote version: $REMOTE_VERSION"

# If not published remotely, use current version
if [ "$REMOTE_VERSION" = "not-published" ]; then
    NEW_VERSION=$CURRENT_VERSION
    echo -e "\nFirst publish, will use current version ${NEW_VERSION}"
else
    # Calculate new version number
    case $VERSION_TYPE in
        "patch")
            NEW_VERSION=$(node -p "const [major, minor, patch] = '${CURRENT_VERSION}'.split('.'); \`\${major}.\${minor}.\${Number(patch) + 1}\`")
            ;;
        "minor")
            NEW_VERSION=$(node -p "const [major, minor] = '${CURRENT_VERSION}'.split('.'); \`\${major}.\${Number(minor) + 1}.0\`")
            ;;
        "major")
            NEW_VERSION=$(node -p "const [major] = '${CURRENT_VERSION}'.split('.'); \`\${Number(major) + 1}.0.0\`")
            ;;
    esac

    # Compare versions
    VERSION_COMPARE=$(node -p "
        const remote = '${REMOTE_VERSION}'.split('.').map(Number);
        const local = '${NEW_VERSION}'.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (remote[i] > local[i]) process.exit(1);
            if (remote[i] < local[i]) process.exit(0);
        }
        process.exit(0);
    ")

    if [ $? -eq 1 ]; then
        echo -e "\nError: Remote version ${REMOTE_VERSION} is higher than version to publish ${NEW_VERSION}"
        echo "Please update local version number or use higher version type (minor/major)"
        exit 1
    fi

    echo -e "\nWill update from ${CURRENT_VERSION} to ${NEW_VERSION}"
fi

read -p "Confirm publish? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    # Clean up temporary auth file
    rm .npmrc.temp
    echo "Publish cancelled"
    exit 1
fi

# Update version if needed (not first publish)
if [ "$REMOTE_VERSION" != "not-published" ]; then
    # Update package.json version directly
    node -e "
        const fs = require('fs');
        const pkg = require('./package.json');
        pkg.version = '$NEW_VERSION';
        fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
fi

# Publish package
echo "Publishing to GitHub Packages..."
npm publish --registry=https://npm.pkg.github.com --scope=@lunaon --userconfig .npmrc.temp

# Clean up temporary auth file
rm .npmrc.temp

# Check publish result
if [ $? -eq 0 ]; then
    echo "Publish successful!"
    
    # Get organization and package name
    ORG_NAME="lunaon"
    PACKAGE_NAME=$(node -p "require('./package.json').name.split('/')[1]")
    
    echo -e "\nPackage published to:"
    echo "https://github.com/LunaOn/npm_packages/pkgs/npm/${PACKAGE_NAME}"
    echo -e "\nInstall command:"
    echo "pnpm install @${ORG_NAME}/${PACKAGE_NAME}"
else
    echo "Publish failed!"
    exit 1
fi