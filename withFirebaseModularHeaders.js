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

                contents = contents.replace(/# EXPO_SPECIFIC_MODULAR_HEADERS[\s\S]*?FirebaseFirestoreInternal', :modular_headers => true/g, '');

                if (!contents.includes('# EXPO_FIREBASE_STATIC_FIX')) {
                    const customBlock = `
# EXPO_FIREBASE_STATIC_FIX
$RNFirebaseAsStaticFramework = true
pod 'FirebaseAuthInterop', :modular_headers => true
pod 'FirebaseAppCheckInterop', :modular_headers => true
pod 'GoogleUtilities', :modular_headers => true
pod 'RecaptchaInterop', :modular_headers => true
pod 'FirebaseFirestoreInternal', :modular_headers => true
`;
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
