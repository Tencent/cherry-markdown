/**
 * @description - The type of commit message to heading mapping.
 */
export const TYPE_TO_HEADING: Record<string, string> = {
	feat: '### Features',
	fix: '### Bug Fixes',
	chore: '### Chores',
	docs: '### Documentation',
	refactor: '### Code Refactoring',
	style: '### Styles',
	test: '### Tests',
	perf: '### Performance Improvements'
};
