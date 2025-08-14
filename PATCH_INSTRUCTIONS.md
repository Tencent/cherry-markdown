# Cherry Markdown PR #1349 Conflict Resolution Patch

## Overview
This patch resolves the merge conflicts between PR #1349 (chart refactor) and PR #1362 (scatter charts + theme compatibility). It integrates changes from both PRs to provide a working solution.

## What This Patch Includes

### 1. Chart Plugin Architecture Integration
- Merges the refactored handler-based system from PR #1349
- Integrates scatter chart support and theme compatibility from PR #1362
- Maintains architectural improvements while adding new functionality

### 2. Syntax Unification
- Updates chart syntax from `| :line:{x,y} |` to `| :line:{title: 折线图,} |` format
- Applied across all examples and documentation
- Consistent configuration system for all chart types

### 3. Theme Integration
- Theme compatibility fixes for all chart types including scatter charts
- Enhanced theme switching compatibility
- Improved export/print functionality that preserves chart interactivity

### 4. New Features
- Scatter chart support with syntax: `| :scatter:{title: 散点图,} |`
- Added missing translations for heatmapTable, pieTable, and scatterTable
- SVG icons for all chart types including scatter charts
- Updated chart insertion tools to use the new configuration system

## Files Modified

### Core Plugin Files
- `packages/cherry-markdown/src/addons/advance/cherry-table-echarts-plugin.js` - Main chart plugin with integrated functionality
- `packages/cherry-markdown/src/core/hooks/Table.js` - Table processing with new chart syntax
- `packages/cherry-markdown/src/toolbars/hooks/ProTable.js` - Toolbar integration

### Documentation and Examples
- `examples/assets/markdown/basic.md` - Updated chart examples with new syntax
- `examples/assets/scripts/index-demo.js` - Demo script updates

### Localization
- `packages/cherry-markdown/src/locales/zh_CN.js` - Chinese translations
- `packages/cherry-markdown/src/locales/en_US.js` - English translations
- `packages/cherry-markdown/src/locales/ru_RU.js` - Russian translations

### Icons and Styling
- `packages/cherry-markdown/src/sass/ch-icon.scss` - Icon definitions
- `packages/cherry-markdown/src/sass/icons/` - SVG icon files for all chart types

## How to Apply This Patch

### Method 1: Using git apply (Recommended)
```bash
# Save the patch file to your local repository
# Apply the patch
git apply cherry-markdown-conflict-resolution.patch

# Check what files were modified
git status

# Review the changes
git diff

# If everything looks good, commit the changes
git add .
git commit -m "Resolve conflicts between chart refactor (#1349) and scatter charts (#1362)

- Integrate handler-based chart architecture with scatter chart support
- Update chart syntax to unified configuration format
- Add theme compatibility and locale support
- Include SVG icons for all chart types
"
```

### Method 2: Using git am (Alternative)
```bash
# Apply the patch and commit automatically
git am cherry-markdown-conflict-resolution.patch
```

## Verification Steps

After applying the patch, verify the integration:

1. **Build the project:**
   ```bash
   npm install
   npm run build
   ```

2. **Test chart functionality:**
   - Open `examples/index.html`
   - Test all chart types (line, bar, pie, radar, heatmap, scatter)
   - Verify theme switching works correctly
   - Test export/print functionality

3. **Check syntax examples:**
   - Verify new chart syntax works: `| :line:{title: 折线图,} |`
   - Test scatter chart syntax: `| :scatter:{title: 散点图,} |`
   - Ensure all chart types render correctly

## Troubleshooting

If the patch doesn't apply cleanly:

1. **Check for conflicts:**
   ```bash
   git apply --check cherry-markdown-conflict-resolution.patch
   ```

2. **Apply with 3-way merge:**
   ```bash
   git apply --3way cherry-markdown-conflict-resolution.patch
   ```

3. **Manually resolve conflicts:**
   - If conflicts occur, manually merge the conflicting sections
   - Key areas to check: chart configuration syntax and theme handling

## Technical Notes

- The patch maintains backward compatibility where possible
- All existing chart types continue to work with new syntax
- Theme detection logic is enhanced for better compatibility
- Icon assets are properly integrated into the build system

## Contact

If you encounter issues applying this patch, please:
1. Check the troubleshooting section above
2. Ensure your branch is up to date with the latest main branch
3. Report any remaining conflicts with specific error messages

This patch successfully resolves the conflicts and provides a working integration of both PR #1349 and PR #1362 functionality.