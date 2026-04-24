import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import util from 'node:util';
import lint from '@commitlint/lint';
import load, { resolveFromSilent, resolveGlobalSilent } from '@commitlint/load';
import read from '@commitlint/read';
import { x } from 'tinyexec';
import yargs from 'yargs';
import { CliError, ExitCode } from './cli-error.js';
const require = createRequire(import.meta.url);
const __dirname = path.resolve(fileURLToPath(import.meta.url), '..');
const dynamicImport = async (id) => {
    const imported = await import(path.isAbsolute(id) ? pathToFileURL(id).toString() : id);
    return ('default' in imported && imported.default) || imported;
};
const pkg = require('../package.json');
const gitDefaultCommentChar = '#';
const cli = yargs(process.argv.slice(2))
    .options({
    color: {
        alias: 'c',
        default: true,
        description: 'toggle colored output',
        type: 'boolean',
    },
    config: {
        alias: 'g',
        description: 'path to the config file; result code 9 if config is missing',
        type: 'string',
    },
    'print-config': {
        choices: ['', 'text', 'json'],
        description: 'print resolved config',
        type: 'string',
    },
    cwd: {
        alias: 'd',
        default: process.cwd(),
        defaultDescription: '(Working Directory)',
        description: 'directory to execute in',
        type: 'string',
    },
    edit: {
        alias: 'e',
        description: 'read last commit message from the specified file or fallbacks to ./.git/COMMIT_EDITMSG',
        type: 'string',
    },
    env: {
        alias: 'E',
        description: 'check message in the file at path given by environment variable value',
        type: 'string',
    },
    extends: {
        alias: 'x',
        description: 'array of shareable configurations to extend',
        type: 'array',
    },
    'help-url': {
        alias: 'H',
        type: 'string',
        description: 'help url in error message',
    },
    from: {
        alias: 'f',
        description: 'lower end of the commit range to lint; applies if edit=false',
        type: 'string',
    },
    'from-last-tag': {
        description: 'uses the last tag as the lower end of the commit range to lint; applies if edit=false and from is not set',
        type: 'boolean',
    },
    'git-log-args': {
        description: "additional git log arguments as space separated string, example '--first-parent --cherry-pick'",
        type: 'string',
    },
    last: {
        alias: 'l',
        description: 'just analyze the last commit; applies if edit=false',
        type: 'boolean',
    },
    format: {
        alias: 'o',
        description: 'output format of the results',
        type: 'string',
    },
    'parser-preset': {
        alias: 'p',
        description: 'configuration preset to use for conventional-commits-parser',
        type: 'string',
    },
    quiet: {
        alias: 'q',
        default: false,
        description: 'toggle console output',
        type: 'boolean',
    },
    to: {
        alias: 't',
        description: 'upper end of the commit range to lint; applies if edit=false',
        type: 'string',
    },
    verbose: {
        alias: 'V',
        type: 'boolean',
        description: 'enable verbose output for reports without problems',
    },
    strict: {
        alias: 's',
        type: 'boolean',
        description: 'enable strict mode; result code 2 for warnings, 3 for errors',
    },
})
    .version('version', 'display version information', `${pkg.name}@${pkg.version}`)
    .alias('v', 'version')
    .help('help')
    .alias('h', 'help')
    .config('options', 'path to a JSON file or Common.js module containing CLI options', require)
    .usage(`${pkg.name}@${pkg.version} - ${pkg.description}\n`)
    .usage(`[input] reads from stdin if --edit, --env, --from and --to are omitted`)
    .strict();
/**
 * avoid description words to be divided in new lines when there is enough space
 * @see https://github.com/conventional-changelog/commitlint/pull/3850#discussion_r1472251234
 */
cli.wrap(cli.terminalWidth());
main(cli.argv).catch((err) => {
    setTimeout(() => {
        if (err.type === pkg.name) {
            process.exit(err.error_code);
        }
        throw err;
    }, 0);
});
async function stdin() {
    let result = '';
    if (process.stdin.isTTY) {
        return result;
    }
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) {
        result += chunk;
    }
    return result;
}
async function resolveArgs(args) {
    return typeof args.then === 'function' ? await args : args;
}
async function main(args) {
    const options = await resolveArgs(args);
    if (typeof options.edit === 'undefined') {
        options.edit = false;
    }
    const raw = options._;
    const flags = normalizeFlags(options);
    if (typeof options['print-config'] === 'string') {
        const loaded = await load(getSeed(flags), {
            cwd: flags.cwd,
            file: flags.config,
        });
        switch (options['print-config']) {
            case 'json':
                console.log(JSON.stringify(loaded));
                return;
            case 'text':
            default:
                console.log(util.inspect(loaded, false, null, options.color));
                return;
        }
    }
    const fromStdin = checkFromStdin(raw, flags);
    if (Object.hasOwn(flags, 'last') &&
        (Object.hasOwn(flags, 'from') || Object.hasOwn(flags, 'to') || flags.edit)) {
        const err = new CliError('Please use the --last flag alone. The --last flag should not be used with --to or --from or --edit.', pkg.name);
        cli.showHelp('log');
        console.log(err.message);
        throw err;
    }
    const input = await (fromStdin
        ? stdin()
        : read({
            to: flags.to,
            from: flags.from,
            fromLastTag: flags['from-last-tag'],
            last: flags.last,
            edit: flags.edit,
            cwd: flags.cwd,
            gitLogArgs: flags['git-log-args'],
        }));
    const messages = (Array.isArray(input) ? input : [input])
        .filter((message) => typeof message === 'string')
        .filter((message) => message.trim() !== '')
        .filter(Boolean);
    if (messages.length === 0 && !checkFromRepository(flags)) {
        const err = new CliError('[input] is required: supply via stdin, or --env or --edit or --last or --from and --to', pkg.name);
        cli.showHelp('log');
        console.log(err.message);
        throw err;
    }
    const loaded = await load(getSeed(flags), {
        cwd: flags.cwd,
        file: flags.config,
    });
    const parserOpts = selectParserOpts(loaded.parserPreset);
    const opts = {
        parserOpts: {},
        plugins: {},
        ignores: [],
        defaultIgnores: true,
    };
    if (parserOpts) {
        opts.parserOpts = parserOpts;
    }
    if (loaded.plugins) {
        opts.plugins = loaded.plugins;
    }
    if (loaded.ignores) {
        opts.ignores = loaded.ignores;
    }
    if (loaded.defaultIgnores === false) {
        opts.defaultIgnores = false;
    }
    const format = await loadFormatter(loaded, flags);
    // If reading from `.git/COMMIT_EDIT_MSG`, strip comments using
    // core.commentChar from git configuration, falling back to '#'.
    if (flags.edit) {
        const result = x('git', ['config', 'core.commentChar']);
        const output = await result;
        if (result.exitCode && result.exitCode > 1) {
            console.warn('Could not determine core.commentChar git configuration', output.stderr);
            opts.parserOpts.commentChar = gitDefaultCommentChar;
        }
        else {
            opts.parserOpts.commentChar =
                output.stdout.trim() || gitDefaultCommentChar;
        }
    }
    const results = await Promise.all(messages.map((message) => lint(message, loaded.rules, opts)));
    let isRulesEmpty = false;
    if (Object.keys(loaded.rules).length === 0) {
        let input = '';
        if (results.length !== 0) {
            input = results[0].input;
        }
        results.splice(0, results.length, {
            valid: false,
            errors: [
                {
                    level: 2,
                    valid: false,
                    name: 'empty-rules',
                    message: [
                        'Please add rules to your `commitlint.config.js`',
                        '    - Getting started guide: https://commitlint.js.org/guides/getting-started',
                        '    - Example config: https://github.com/conventional-changelog/commitlint/blob/master/%40commitlint/config-conventional/src/index.ts',
                    ].join('\n'),
                },
            ],
            warnings: [],
            input,
        });
        isRulesEmpty = true;
    }
    const report = results.reduce((info, result) => {
        info.valid = result.valid ? info.valid : false;
        info.errorCount += result.errors.length;
        info.warningCount += result.warnings.length;
        info.results.push(result);
        return info;
    }, {
        valid: true,
        errorCount: 0,
        warningCount: 0,
        results: [],
    });
    const helpUrl = flags['help-url']?.trim() || loaded.helpUrl;
    const output = format(report, {
        color: flags.color,
        verbose: flags.verbose,
        helpUrl,
    });
    if (!flags.quiet && output !== '') {
        console.log(output);
    }
    if (flags.strict) {
        if (report.errorCount > 0) {
            throw new CliError(output, pkg.name, ExitCode.CommitLintError);
        }
        if (report.warningCount > 0) {
            throw new CliError(output, pkg.name, ExitCode.CommitLintWarning);
        }
    }
    if (isRulesEmpty) {
        throw new CliError(output, pkg.name, ExitCode.CommitlintInvalidArgument);
    }
    if (!report.valid) {
        throw new CliError(output, pkg.name);
    }
}
function checkFromStdin(input, flags) {
    return input.length === 0 && !checkFromRepository(flags);
}
function checkFromRepository(flags) {
    return checkFromHistory(flags) || checkFromEdit(flags);
}
function checkFromEdit(flags) {
    return Boolean(flags.edit) || Boolean(flags.env);
}
function checkFromHistory(flags) {
    return (typeof flags.from === 'string' ||
        typeof flags['from-last-tag'] === 'boolean' ||
        typeof flags.to === 'string' ||
        typeof flags.last === 'boolean');
}
function normalizeFlags(flags) {
    const edit = getEditValue(flags);
    return {
        ...flags,
        edit,
    };
}
function getEditValue(flags) {
    if (flags.env) {
        if (!(flags.env in process.env)) {
            throw new Error(`Received '${flags.env}' as value for -E | --env, but environment variable '${flags.env}' is not available globally`);
        }
        return process.env[flags.env];
    }
    const { edit } = flags;
    // If the edit flag is set but empty (i.e '-e') we default
    // to .git/COMMIT_EDITMSG
    if (edit === '') {
        return true;
    }
    if (typeof edit === 'boolean') {
        return edit;
    }
    // The recommended method to specify -e with husky was `commitlint -e $HUSKY_GIT_PARAMS`
    // This does not work properly with win32 systems, where env variable declarations
    // use a different syntax
    // See https://github.com/conventional-changelog/commitlint/issues/103 for details
    // This has been superceded by the `-E GIT_PARAMS` / `-E HUSKY_GIT_PARAMS`
    const isGitParams = edit === '$GIT_PARAMS' || edit === '%GIT_PARAMS%';
    const isHuskyParams = edit === '$HUSKY_GIT_PARAMS' || edit === '%HUSKY_GIT_PARAMS%';
    if (isGitParams || isHuskyParams) {
        console.warn(`Using environment variable syntax (${edit}) in -e |\
--edit is deprecated. Use '{-E|--env} HUSKY_GIT_PARAMS instead'`);
        if (isGitParams && 'GIT_PARAMS' in process.env) {
            return process.env.GIT_PARAMS;
        }
        if ('HUSKY_GIT_PARAMS' in process.env) {
            return process.env.HUSKY_GIT_PARAMS;
        }
        throw new Error(`Received ${edit} as value for -e | --edit, but GIT_PARAMS or HUSKY_GIT_PARAMS are not available globally.`);
    }
    return edit;
}
function getSeed(flags) {
    const n = (flags.extends || []).filter((i) => typeof i === 'string');
    return n.length > 0
        ? { extends: n, parserPreset: flags['parser-preset'] }
        : { parserPreset: flags['parser-preset'] };
}
function selectParserOpts(parserPreset) {
    if (typeof parserPreset !== 'object') {
        return undefined;
    }
    if (typeof parserPreset.parserOpts !== 'object') {
        return undefined;
    }
    return parserPreset.parserOpts;
}
function loadFormatter(config, flags) {
    const moduleName = flags.format || config.formatter || '@commitlint/format';
    const modulePath = resolveFromSilent(moduleName, __dirname) ||
        resolveFromSilent(moduleName, flags.cwd) ||
        resolveGlobalSilent(moduleName);
    if (modulePath) {
        return dynamicImport(modulePath);
    }
    throw new Error(`Using format ${moduleName}, but cannot find the module.`);
}
// Catch unhandled rejections globally
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at: Promise ', promise, ' reason: ', reason);
    throw reason;
});
//# sourceMappingURL=cli.js.map