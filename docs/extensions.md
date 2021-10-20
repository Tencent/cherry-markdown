# Extensions

## Markdown Config

You can configure the markdown parsing rules by configuring the engine object, such as whether the chart available in table(available in the pro version)

```js
engine: {
    // Custom syntax
    customSyntax: {
        // 'SyntaxClass': SyntaxClass   
        // Force overwrite the built-in syntax parser in case of name conflict
        // 'SyntaxClass': {             
        //    syntax: SyntaxClass,      
        //    force: true,              
        //    before: 'HOOK_NAME',      
        //    after: 'HOOK_NAME'        
        // }
    }
}
```

- Key: `customSyntax`
- Description: Custom syntax configuration
- Type: ``{ [HOOK_NAME: string]: { [option: string]: any } | boolean }``
- Default: `{}`
- Options:
  - SyntaxClass   `<[String]> hook name`
    - syntax    `<[SyntaxBase]> hook constructor`
    - force     `<[Boolean]> whether overwrite hook with the same name`
    - before    `<[String]> hookName，execute before this hook`
    - after     `<[String]> hookName，execute after this hook`

## Custom Syntax

### Markdown.createSyntaxHook( HOOK_NAME, HOOK_TYPE, OPTIONS )

Create a custom syntax hook

| parameter      | type                              | description                                                                     |
| --------- | ---------------------------------- | ------------------------------------------------------------------------ |
| HOOK_NAME | string                             | Syntax hook ID, unique                                                   |
| HOOK_TYPE | Markdown.constants.HOOKS_TYPE_LIST | Syntax Hook type, only SEN (inline grammar) and PAR (paragraph grammar) can be selectedhook type, only Sen (inline syntax) and PAR (paragraph syntax) can be selected               |
| OPTIONS   | { Function }                       | Optional operation                                                            |

**options configuration**

| parameter      | type                              | description                                                                     |
| ----------------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| beforeMakeHtml (<br>str: string<br> ): string                           | Function | Lifecycle, returns the replaced string                                |
| makeHtml (<br>str: string,<br> sentenceMakeFunc: Function<br> ): string | Function | Lifecycle, returns the replaced string                                |
| afterMakeHtml (<br>str: string<br> ): string                            | Function | Lifecycle, returns the replaced string                                |
| rule ( ): { reg: RegExp }                                               | Function | Syntax hook matching rule, return an  reg member object containing regexp type |
| test (<br>str: string<br>): boolean                                     | Function | Syntax matching operation method. You can customize the matching method                          |

#### Basic Example

```Javascript
const CustomHook = Markdown.createSyntaxHook(
    'customHook',
    Markdown.constants.HOOKS_TYPE_LIST.PAR,
    {
        makeHtml(str) {
            console.log('hello custom hook');
            return str;
        },
        rule() {
            return { reg: new RegExp() };
        }
    }
);

new Markdown({
    engine: {
        customSyntax: {
            CustomHook: CustomHook
        }
    }
});
```

#### Insert before or after the specified hook, only one parameter will take effect, and before takes precedence

```Javascript
new Markdown({
    engine: {
        customSyntax: {
            CustomHook: {
                syntax: CustomHook,
                before: 'codeBlock',
                // after: 'codeBlock'
            }
        }
    }
});
```

#### Force overwrite of built-in syntax hook

```Javascript
new Markdown({
    engine: {
        customSyntax: {
            CustomHook: {
                syntax: CustomHook,
                force: true
            }
        }
    }
});
```

## Custom Toolbar

Create a custom menu hook

| parameter      | type                              | description                                                                     |
| --------- | ---------------------------------- | ------------------------------------------------------------------------ |
| HOOK_NAME | string                             | Syntax hook ID, unique                                                   |
| OPTIONS   | { Object }                       | Custom menu configuration                                                       |

**options 配置**

| parameter      | type                              | description                                                                     |
| ----------------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| iconName                           | String | Icon class name                               |
| onClick (<br> selection: Function<br> ) | Function | Callback function when clicked                                |
| shortcutKeys   | Array | Shortcut key collection is used to register keyboard functions. When the matching shortcut key combination hits, the click function will also be called   |
| subMenuConfig (<br>name: String<br>iconName： String<Br>noIcon: Boolean<Br>onClick: Function ) | Function | Submenu collection |
