# Editor UI ownership

Controls in this directory operate directly on ProseMirror state. They must not
import Cherry's editor, toolbar classes or private preview handlers.

Selection eligibility is shared by visibility and command execution. Native DOM
selections inside atomic NodeViews (diagram source, HTML, MathLive) never enable
text formatting. Controls must not occupy document flow or rewrite rendered text.
