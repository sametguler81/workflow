const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withModularHeaders = (config) => {
    return withDangerousMod(config, [
        'ios',
        async (config) => {
            const filePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
            if (fs.existsSync(filePath)) {
                let contents = fs.readFileSync(filePath, 'utf-8');
                if (!contents.includes('use_modular_headers!')) {
                    contents = contents.replace(
                        /platform :ios[^\n]*/,
                        match => match + "\nuse_modular_headers!"
                    );
                    fs.writeFileSync(filePath, contents);
                }
            }
            return config;
        },
    ]);
};

module.exports = withModularHeaders;
