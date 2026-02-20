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

                    if (!contents.includes('# EXPO_FIREBASE_MODULAR_HEADERS')) {
                        contents = customBlock + contents;
                    }
                }

                // Add the gRPC modulemap fix to post_install
                if (!contents.includes('# GRPC_MODULEMAP_FIX')) {
                    const grpcFix = `
    # GRPC_MODULEMAP_FIX
    installer.pods_project.targets.each do |target|
      if target.name == 'gRPC-C++'
        target.build_configurations.each do |config|
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'GRPC_TARGET_CPP'
        end
      end
    end
`;
                    // Try to inject at the end of post_install
                    contents = contents.replace(
                        /post_install do \|installer\|([\s\S]*?)end\n/g,
                        (match, p1) => `post_install do |installer|${p1}${grpcFix}    end\n`
                    );
                }

                fs.writeFileSync(filePath, contents);
            }
            return config;
        },
    ]);
};

module.exports = withFirebaseModularHeaders;
