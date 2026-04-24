import { RuleConfigCondition, RuleConfigSeverity, TargetCaseType } from '@commitlint/types';
declare const _default: {
    parserPreset: string;
    rules: {
        'body-leading-blank': readonly [RuleConfigSeverity.Warning, "always"];
        'body-max-line-length': readonly [RuleConfigSeverity.Error, "always", 100];
        'footer-leading-blank': readonly [RuleConfigSeverity.Warning, "always"];
        'footer-max-line-length': readonly [RuleConfigSeverity.Error, "always", 100];
        'header-max-length': readonly [RuleConfigSeverity.Error, "always", 100];
        'header-trim': readonly [RuleConfigSeverity.Error, "always"];
        'subject-case': [RuleConfigSeverity, RuleConfigCondition, TargetCaseType[]];
        'subject-empty': readonly [RuleConfigSeverity.Error, "never"];
        'subject-full-stop': readonly [RuleConfigSeverity.Error, "never", "."];
        'type-case': readonly [RuleConfigSeverity.Error, "always", "lower-case"];
        'type-empty': readonly [RuleConfigSeverity.Error, "never"];
        'type-enum': [RuleConfigSeverity, RuleConfigCondition, string[]];
    };
    prompt: {
        questions: {
            type: {
                description: string;
                enum: {
                    feat: {
                        description: string;
                        title: string;
                        emoji: string;
                    };
                    fix: {
                        description: string;
                        title: string;
                        emoji: string;
                    };
                    docs: {
                        description: string;
                        title: string;
                        emoji: string;
                    };
                    style: {
                        description: string;
                        title: string;
                        emoji: string;
                    };
                    refactor: {
                        description: string;
                        title: string;
                        emoji: string;
                    };
                    perf: {
                        description: string;
                        title: string;
                        emoji: string;
                    };
                    test: {
                        description: string;
                        title: string;
                        emoji: string;
                    };
                    build: {
                        description: string;
                        title: string;
                        emoji: string;
                    };
                    ci: {
                        description: string;
                        title: string;
                        emoji: string;
                    };
                    chore: {
                        description: string;
                        title: string;
                        emoji: string;
                    };
                    revert: {
                        description: string;
                        title: string;
                        emoji: string;
                    };
                };
            };
            scope: {
                description: string;
            };
            subject: {
                description: string;
            };
            body: {
                description: string;
            };
            isBreaking: {
                description: string;
            };
            breakingBody: {
                description: string;
            };
            breaking: {
                description: string;
            };
            isIssueAffected: {
                description: string;
            };
            issuesBody: {
                description: string;
            };
            issues: {
                description: string;
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map