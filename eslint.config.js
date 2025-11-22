import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['src/**/*.{js,ts}', 'scripts/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                localStorage: 'readonly',
                navigator: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                clearTimeout: 'readonly',
                Notification: 'readonly',
                HTMLElement: 'readonly',
                customElements: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                fetch: 'readonly',
                Date: 'readonly',
                Error: 'readonly',
                Math: 'readonly',
                JSON: 'readonly',
                Promise: 'readonly',
                Set: 'readonly',
                Map: 'readonly',
                Array: 'readonly',
                Object: 'readonly',
                String: 'readonly',
                Number: 'readonly',
                Boolean: 'readonly',
                RegExp: 'readonly',
                parseInt: 'readonly',
                parseFloat: 'readonly',
                isNaN: 'readonly',
                CustomEvent: 'readonly',
                AbortController: 'readonly',
                Buffer: 'readonly',
                require: 'readonly',
                process: 'readonly',
                filterTodos: 'readonly',
                sortTodos: 'readonly',
                searchTodos: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            'no-console': 'off',
            'prefer-const': 'warn',
            'no-var': 'error',
            'eqeqeq': ['warn', 'always'],
            'curly': ['warn', 'all'],
            'no-debugger': 'warn',
            'no-alert': 'warn',
            'semi': ['warn', 'always'],
            'quotes': ['warn', 'single', { avoidEscape: true }],
            'indent': ['warn', 4, { SwitchCase: 1 }],
            'comma-dangle': ['warn', 'never'],
            'no-trailing-spaces': 'warn',
            'object-curly-spacing': ['warn', 'always'],
            'array-bracket-spacing': ['warn', 'never'],
            'space-before-function-paren': ['warn', {
                anonymous: 'always',
                named: 'never',
                asyncArrow: 'always'
            }],
            'arrow-spacing': 'warn',
            'keyword-spacing': 'warn',
            'space-infix-ops': 'warn',
            'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],
            'no-multi-spaces': 'warn'
        }
    },
    {
        ignores: [
            '**/node_modules/',
            '**/*.log',
            '**/.DS_Store',
            '**/dist/',
            '**/dist-prod/',
            '**/build/',
            '**/coverage/'
        ]
    }
];
