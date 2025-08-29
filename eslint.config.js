import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                Buffer: 'readonly',
                global: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly'
            }
        },
        rules: {
            // Prettier integration
            'prettier/prettier': 'error',

            // Code quality rules
            'no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
            ],
            'no-console': 'off', // Allow console.log in Node.js projects
            'prefer-const': 'error',
            'no-var': 'error',

            // Style rules (handled by prettier)
            indent: 'off',
            quotes: 'off',
            semi: 'off',
            'comma-dangle': 'off',
            'max-len': 'off'
        }
    },
    {
        files: ['**/*.js'],
        plugins: {
            prettier: (await import('eslint-plugin-prettier')).default
        }
    },
    {
        ignores: ['node_modules/', 'downloads/', 'coverage/', '*.min.js']
    }
];
