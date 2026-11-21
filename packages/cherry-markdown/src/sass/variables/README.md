# Cherry theme tokens

Cherry uses TDesign-style semantic names for values that themes share. The built-in palettes live in [themes](../themes) and declare CSS variables directly on the Cherry root. Switching the theme class changes those values for that editor. The theme contract test checks that each built-in theme supplies the first six roles below. Other roles and component overrides can inherit their defaults. Add new built-in themes to the [shared loader](../themes/_index.scss) so both CSS builds include them in the same order.

| Role | Existing property | Scope |
| --- | --- | --- |
| `--color-brand-primary` | `--primary-color` | Brand accent |
| `--color-bg-active` | `--secondary-color` | Tinted active background |
| `--color-text-primary` | `--base-font-color` | Base text |
| `--color-bg-canvas` | `--base-editor-bg` | Editor background |
| `--color-bg-surface` | `--base-previewer-bg` | Preview background |
| `--color-border-default` | `--base-border-color` | Base border |
| `--color-text-secondary` | `--base-sub-font-color` | Secondary text |
| `--color-text-link` | `--md-link-color` | Markdown links |
| `--color-brand-primary-hover` | `--md-link-hover-color` | Markdown link hover |

Set new properties on the `.cherry` root, using a selector that can win the cascade against the theme rule. Existing overrides can stay as they are. For example, `--primary-color` reads `--color-brand-primary` by default, but an explicit override of `--primary-color` still wins for existing components. The semantic property reports the configured role; read the corresponding legacy property when integrating with existing components that honor old overrides.

Theme files declare ordinary CSS custom properties. Internal consumers pass semantic names to the private [compatibility helpers](../../theme-compat/). They check the old property where the color is consumed, so an override on a descendant still works. No build step rewrites CSS or JavaScript. After legacy names are retired, the helpers can return the new variable directly; the theme values and call sites can stay as they are.

Keep the semantic value and its compatibility alias in one direction: never point a semantic property back to its own legacy alias, which would create a CSS variable cycle. Component overrides such as `--panel-primary-title-color` stay independent. For a descendant-only override, set the existing component property on that descendant. Applications that already load TDesign can opt in to its palette on the editor root:

```css
.docs-editor.cherry {
  --color-brand-primary: var(--td-brand-color);
  --color-brand-primary-hover: var(--td-brand-color-hover);
}
```

The preview-only stylesheet keeps its existing scope. It does not install new global primitives or default tokens for a bare `.cherry-markdown` element. A preview inside the full editor inherits the editor's tokens.
