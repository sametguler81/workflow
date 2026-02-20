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

                // Always remove old attempts first
                contents = contents.replace(/# EXPO_FIREBASE_MODULAR_HEADERS[\s\S]*?use_modular_headers!/g, '');
                contents = contents.replace(/> :static[\s\n]*use_modular_headers!/g, '');
                contents = contents.replace(/# GRPC_MODULEMAP_FIX[\s\S]*?end\n    end/g, '');

                if (!contents.includes('# EXPO_SPECIFIC_MODULAR_HEADERS')) {
                    const customBlock = `
# EXPO_SPECIFIC_MODULAR_HEADERS
pod 'FirebaseAuthInterop', :modular_headers => true
pod 'FirebaseAppCheckInterop', :modular_headers => true
pod 'GoogleUtilities', :modular_headers => true
pod 'RecaptchaInterop', :modular_headers => true
pod 'FirebaseFirestoreInternal', :modular_headers => true
`;
                    // Inject before use_react_native!
                    contents = contents.replace(
                        /use_react_native!/g,
                        `${customBlock}\n  use_react_native!`
                    );
                }

                fs.writeFileSync(filePath, contents);
            }
            return config;
        },
    ]);
};

module.exports = withFirebaseModularHeaders;
