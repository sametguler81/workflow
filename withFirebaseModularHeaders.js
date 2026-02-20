const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFirebaseModularHeaders = (config) => {
    return withDangerousMod(config, [
        'ios',
        async (config) => {
            const filePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
            if (fs.existsSync(filePath)) {
                let contents = fs.readFileSync(filePath, 'utf-8');

                // Check if we've already added our custom block
                if (!contents.includes('# EXPO_FIREBASE_MODULAR_HEADERS')) {
                    const customBlock = `
# EXPO_FIREBASE_MODULAR_HEADERS
$RNFirebaseAsStaticFramework = true
use_modular_headers!
`;
                    // Find the target runner block and inject right before use_react_native
                    contents = contents.replace(
                        /target 'main' do/g,
                        `target 'main' do\n${customBlock}`
                    );

                    // Let's just put it globally at the top if target 'main' wasn't matched properly by Expo
                    if (!contents.includes('# EXPO_FIREBASE_MODULAR_HEADERS')) {
                        contents = customBlock + contents;
                    }

                    fs.writeFileSync(filePath, contents);
                }
            }
            return config;
        },
    ]);
};

module.exports = withFirebaseModularHeaders;
