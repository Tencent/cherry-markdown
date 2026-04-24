(function (mod) {
  "use strict";

  if (typeof exports === "object" && typeof module === "object")
    // CommonJS
    mod(require("codemirror"));
  else if (typeof define === "function" && define.amd)
    // AMD
    define(["codemirror"], mod);
  else mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";

  var Search;

  CodeMirror.defineOption("searchbox", false, function (cm) {
    cm.addKeyMap({
      "Ctrl-F": function () {
        var cmEle = cm.display.wrapper;
        if (!Search || !cmEle.parentElement.contains(Search.searchBox)) {
          Search = new SearchBox(cm);
        }
        var isReplace = false;
        if (cmEle.parentElement.querySelector("[action=toggleReplace]")) {
          isReplace =
            cmEle.parentElement.querySelector("[action=toggleReplace]")
              .innerText === "-";
        }
        Search.show(cm.getSelection(), isReplace);
      },

      Esc: function () {
        if (!Search || !Search.isVisible()) return CodeMirror.Pass;

        Search.hide();

        if (typeof event !== "undefined") event.stopPropagation();
      },

      "Cmd-F": function () {
        var cmEle = cm.display.wrapper;
        if (!Search || !cmEle.parentElement.contains(Search.searchBox)) {
          Search = new SearchBox(cm);
        }
        var isReplace = false;
        if (cmEle.parentElement.querySelector("[action=toggleReplace]")) {
          isReplace =
            cmEle.parentElement.querySelector("[action=toggleReplace]")
              .innerText === "-";
        }
        Search.show(cm.getSelection(), isReplace);
      },
    });
  });

  function SearchBox(cm) {
    var self = this;

    init();

    function initElements(el) {
      self.searchBox = el.querySelector(".ace_search_form");
      self.replaceBox = el.querySelector(".ace_replace_form");
      self.searchOptions = el.querySelector(".ace_search_options");

      self.regExpOption = el.querySelector("[action=toggleRegexpMode]");
      self.caseSensitiveOption = el.querySelector(
        "[action=toggleCaseSensitive]"
      );
      self.wholeWordOption = el.querySelector("[action=toggleWholeWords]");

      self.searchInput = self.searchBox.querySelector(".ace_search_field");
      self.replaceInput = self.replaceBox.querySelector(".ace_search_field");
    }

    function init() {
      var el = (self.element = addHtml());

      addStyle();

      initElements(el);
      bindKeys();

      el.addEventListener("mousedown", function (e) {
        setTimeout(function () {
          self.activeInput.focus();
        }, 0);

        e.stopPropagation();
      });

      el.addEventListener("click", function (e) {
        var t = e.target || e.srcElement;
        var action = t.getAttribute("action");
        if (action && self[action]) self[action]();
        else if (self.commands[action]) self.commands[action]();
        e.stopPropagation();
      });

      self.searchInput.addEventListener("input", function () {
        self.$onChange.schedule(20);
      });

      self.searchInput.addEventListener("focus", function () {
        self.activeInput = self.searchInput;
      });

      self.replaceInput.addEventListener("focus", function () {
        self.activeInput = self.replaceInput;
      });

      self.$onChange = delayedCall(function () {
        self.find(false, false);
      });
    }

    function bindKeys() {
      var sb = self,
        obj = {
          "Ctrl-F|Cmd-F|Ctrl-H|Command-Alt-F": function () {
            var isReplace = (sb.isReplace = !sb.isReplace);
            sb.replaceBox.style.display = isReplace ? "" : "none";
            sb[isReplace ? "replaceInput" : "searchInput"].focus();
          },
          "Ctrl-G|Cmd-G": function () {
            sb.findNext();
          },
          "Ctrl-Shift-G|Cmd-Shift-G": function () {
            sb.findPrev();
          },
          Esc: function () {
            setTimeout(function () {
              sb.hide();
            });
          },
          Enter: function () {
            if (sb.activeInput === sb.replaceInput) sb.replace();
            sb.findNext();
          },
          "Shift-Enter": function () {
            if (sb.activeInput === sb.replaceInput) sb.replace();
            sb.findPrev();
          },
          "Alt-Enter": function () {
            if (sb.activeInput === sb.replaceInput) sb.replaceAll();
            sb.findAll();
          },
          Tab: function () {
            if (self.activeInput === self.replaceInput)
              self.searchInput.focus();
            else self.replaceInput.focus();
          },
        };

      self.element.addEventListener("keydown", function (event) {
        Object.keys(obj).some(function (name) {
          var is = key(name, event);

          if (is) {
            event.stopPropagation();
            event.preventDefault();
            obj[name](event);
          }

          return is;
        });
      });
    }

    this.commands = {
      toggleRegexpMode: function () {
        self.regExpOption.checked = !self.regExpOption.checked;
        self.$syncOptions();
      },

      toggleCaseSensitive: function () {
        self.caseSensitiveOption.checked = !self.caseSensitiveOption.checked;
        self.$syncOptions();
      },

      toggleWholeWords: function () {
        self.wholeWordOption.checked = !self.wholeWordOption.checked;
        self.$syncOptions();
      },
    };

    this.$syncOptions = function () {
      setCssClass(this.regExpOption, "checked", this.regExpOption.checked);
      setCssClass(
        this.wholeWordOption,
        "checked",
        this.wholeWordOption.checked
      );
      setCssClass(
        this.caseSensitiveOption,
        "checked",
        this.caseSensitiveOption.checked
      );

      this.find(false, false);
    };

    this.find = function (skipCurrent, backwards) {
      var value = this.searchInput.value,
        options = {
          skipCurrent: skipCurrent,
          backwards: backwards,
          regExp: this.regExpOption.checked,
          caseSensitive: this.caseSensitiveOption.checked,
          wholeWord: this.wholeWordOption.checked,
        };

      find(value, options, function (searchCursor) {
        var current = searchCursor.matches(false, searchCursor.from());
        cm.setSelection(current.from, current.to);
      });
    };

    function find(value, options, callback) {
      if (!value) {
        clearSearch(cm);
        updateCount();
        return;
      }
      var done,
        noMatch,
        searchCursor,
        next,
        prev,
        matches,
        cursor,
        position,
        val = value,
        o = options,
        is = true,
        caseSensitive = o.caseSensitive,
        regExp = o.regExp,
        wholeWord = o.wholeWord;

      if (regExp) {
        val = val.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      }
      if (wholeWord) {
        if (caseSensitive) {
          val = val = RegExp("\\b" + val + "\\b");
        } else {
          val = RegExp("\\b" + val + "\\b", "i");
        }
      }
      if (regExp) {
        val = RegExp(val);
      }
      clearSearch(cm);
      doSearch(cm, val, caseSensitive);
      updateCount();
      if (o.backwards) position = o.skipCurrent ? "from" : "to";
      else position = o.skipCurrent ? "to" : "from";

      cursor = cm.getCursor(position);
      searchCursor = cm.getSearchCursor(val, cursor, !caseSensitive);

      (next = searchCursor.findNext.bind(searchCursor)),
        (prev = searchCursor.findPrevious.bind(searchCursor)),
        (matches = searchCursor.matches.bind(searchCursor));

      if (o.backwards && !prev()) {
        is = next();

        if (is) {
          cm.setCursor(cm.doc.size - 1, 0);
          find(value, options, callback);
          done = true;
        }
      } else if (!o.backwards && !next()) {
        is = prev();

        if (is) {
          cm.setCursor(0, 0);
          find(value, options, callback);
          done = true;
        }
      }

      noMatch = !is && self.searchInput.value;
      setCssClass(self.searchBox, "ace_nomatch", noMatch);

      if (!done && is) callback(searchCursor);
    }

    this.findNext = function () {
      this.find(true, false);
    };

    this.findPrev = function () {
      this.find(true, true);
    };

    this.findAll = function () {
      var value = this.searchInput.value,
        range,
        noMatch = !range && this.searchInput.value;

      setCssClass(this.searchBox, "ace_nomatch", noMatch);

      if (cm.showMatchesOnScrollbar) cm.showMatchesOnScrollbar(value);

      this.hide();
    };

    this.replace = function () {
      var readOnly = cm.getOption("readOnly"),
        isSelection = !!cm.getSelection();
      if (!readOnly && isSelection)
        cm.replaceSelection(this.replaceInput.value, "start");
      updateCount();
    };

    this.replaceAndFindNext = function () {
      var readOnly = cm.getOption("readOnly");

      if (!readOnly) {
        this.replace();
        this.findNext();
      }
    };

    this.replaceAll = function () {
      var value,
        cursor,
        from = this.searchInput.value,
        to = this.replaceInput.value,
        reg = RegExp(from, this.caseSensitiveOption.checked ? "g" : "gi");

      if (this.wholeWordOption.checked && !this.regExpOption.checked) {
        if (this.caseSensitiveOption.checked) {
          reg = RegExp("\\b" + from + "\\b", 'g');
        } else {
          reg = RegExp("\\b" + from + "\\b", "gi");
        }
      }

      if (!cm.getOption("readOnly") && cm.getSelection()) {
        cursor = cm.getCursor();
        value = cm.getValue();
        value = value.replace(reg, to);

        cm.setValue(value);
        cm.setCursor(cursor);
      }
      updateCount();
    };

    this.toggleReplace = function () {
      var cmEle = cm.display.wrapper;
      if (
        cmEle.parentElement.querySelector("[action=toggleReplace]")
          .innerText === "+"
      ) {
        cmEle.parentElement.querySelector("[action=toggleReplace]").innerText =
          "-";
        this.replaceBox.style.display = "";
        this.isReplace = true;
      } else {
        cmEle.parentElement.querySelector("[action=toggleReplace]").innerText =
          "+";
        this.replaceBox.style.display = "none";
        this.isReplace = false;
      }
    };

    this.hide = function () {
      clearSearch(cm);
      var cmEle = cm.getWrapperElement();
      Search = null;
      cmEle.removeChild(this.element);
      cm.focus();
    };

    this.isVisible = function () {
      var is = this.element.style.display === "";
      return is;
    };

    this.show = function (value, isReplace) {
      this.element.style.display = "";
      if (!isReplace) {
        this.replaceBox.style.display = isReplace ? "" : "none";
      }
      this.isReplace = isReplace;
      if (value) {
        this.searchInput.value = value;
        this.find(false, false);
      }
      this.searchInput.focus();
      this.searchInput.select();
    };

    this.isFocused = function () {
      var el = document.activeElement;
      return el === this.searchInput || el === this.replaceInput;
    };

    function doSearch(cm, value, caseSensitive) {
      var state = getSearchState(cm);
      var query = value;
      if (query && query !== state.queryText) {
        startSearch(cm, state, query, caseSensitive);
        state.posFrom = state.posTo = cm.getCursor();
      }
    }

    function parseString(string) {
      return string.replace(/\\([nrt\\])/g, function (match, ch) {
        if (ch == "n") return "\n";
        if (ch == "r") return "\r";
        if (ch == "t") return "\t";
        if (ch == "\\") return "\\";
        return match;
      });
    }

    function parseQuery(query) {
      var reStr = typeof query === "object" ? query.toString() : query;
      var isRE = reStr.match(/^\/(.*)\/([a-z]*)$/);
      if (isRE) {
        try {
          query = new RegExp(isRE[1], isRE[2].indexOf("i") == -1 ? "" : "i");
        } catch (e) {} // Not a regular expression after all, do a string search
      } else {
        query = parseString(query);
      }
      if (typeof query == "string" ? query == "" : query.test("")) query = /x^/;
      return query;
    }

    function startSearch(cm, state, query, caseSensitive) {
      state.queryText = query;
      state.query = parseQuery(query);
      cm.removeOverlay(
        state.overlay,
        queryCaseInsensitive(state.query, caseSensitive)
      );
      state.overlay = searchOverlay(
        state.query,
        queryCaseInsensitive(state.query, caseSensitive)
      );
      cm.addOverlay(state.overlay);
      if (cm.showMatchesOnScrollbar) {
        if (state.annotate) {
          state.annotate.clear();
          state.annotate = null;
        }
        state.annotate = cm.showMatchesOnScrollbar(
          state.query,
          queryCaseInsensitive(state.query, caseSensitive)
        );
      }
    }

    function queryCaseInsensitive(query, caseSensitive) {
      return typeof query == "string" && !caseSensitive;
    }

    function searchOverlay(query, caseInsensitive) {
      if (typeof query == "string")
        query = new RegExp(
          query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"),
          caseInsensitive ? "gi" : "g"
        );
      else if (!query.global)
        query = new RegExp(query.source, query.ignoreCase ? "gi" : "g");

      return {
        token: function (stream) {
          query.lastIndex = stream.pos;
          var match = query.exec(stream.string);
          if (match && match.index == stream.pos) {
            stream.pos += match[0].length || 1;
            return "searching";
          } else if (match) {
            stream.pos = match.index;
          } else {
            stream.skipToEnd();
          }
        },
      };
    }

    function SearchState() {
      this.posFrom = this.posTo = this.lastQuery = this.query = null;
      this.overlay = null;
    }

    function getSearchState(cm) {
      return cm.state.search || (cm.state.search = new SearchState());
    }

    function clearSearch(cm) {
      cm.operation(function () {
        var state = getSearchState(cm);
        state.lastQuery = state.query;
        if (!state.query) return;
        state.query = state.queryText = null;
        cm.removeOverlay(state.overlay);
        if (state.annotate) {
          state.annotate.clear();
          state.annotate = null;
        }
      });
    }

    function updateCount() {
      var val = self.searchInput.value;
      var matches = [];
      if (val) {
        val = val.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        var reg;
        if (self.caseSensitiveOption.checked) {
          reg = RegExp(val, "g");
        } else {
          reg = RegExp(val, "gi");
        }
        if (self.wholeWordOption.checked) {
          if (self.caseSensitiveOption.checked) {
            reg = RegExp("\\b" + val + "\\b", "g");
          } else {
            reg = RegExp("\\b" + val + "\\b", "gi");
          }
        }
        if (self.regExpOption.checked) {
          reg = RegExp(val, "gi");
        }
        matches = cm.getValue().match(reg);
      }
      var count = matches ? matches.length : 0;
      var cmEle = cm.display.wrapper;
      var countEle = cmEle.parentElement.querySelector(".ace_search_counter");
      if (countEle) {
        countEle.innerText = count + " matches found.";
      }
      if (count === 0){
        cm.setSelection({ch: 0, line: 0},{ch: 0, line: 0});
      }
    }

    function addStyle() {
      var style = document.createElement("style"),
        css = [
          ".ace_search {",
          "color: black;",
          "background-color: #ddd;",
          "border: 1px solid #cbcbcb;",
          "border-top: 0 none;",
          "max-width: 325px;",
          "overflow: hidden;",
          "margin: 0;",
          "padding: 4px;",
          "padding-right: 6px;",
          "padding-bottom: 0;",
          "position: absolute;",
          "top: 0px;",
          "z-index: 99;",
          "white-space: normal;",
          "font-size: 12px;",
          "}",
          ".ace_search.left {",
          "border-left: 0 none;",
          "border-radius: 0px 0px 5px 0px;",
          "left: 0;",
          "}",
          ".ace_search.right {",
          "border-radius: 0px 0px 0px 5px;",
          "border-right: 0 none;",
          "right: 0;",
          "}",
          ".ace_search_form, .ace_replace_form {",
          "border-radius: 3px;",
          "border: 1px solid #cbcbcb;",
          "float: left;",
          "margin-bottom: 4px;",
          "overflow: hidden;",
          "}",
          ".ace_search_form.ace_nomatch {",
          "outline: 1px solid red;",
          "}",
          ".ace_search_field {",
          "background-color: white;",
          "border-right: 1px solid #cbcbcb;",
          "border: 0 none;",
          "-webkit-box-sizing: border-box;",
          "-moz-box-sizing: border-box;",
          "box-sizing: border-box;",
          "float: left;",
          "height: 22px;",
          "outline: 0;",
          "padding: 0 7px;",
          "width: 238px;",
          "margin: 0;",
          "}",
          ".ace_searchbtn,",
          ".ace_replacebtn {",
          "background: #fff;",
          "border: 0 none;",
          "border-left: 1px solid #dcdcdc;",
          "cursor: pointer;",
          "float: left;",
          "height: 22px;",
          "padding: 0 5px;",
          "margin: 0;",
          "position: relative;",
          "}",
          ".ace_searchbtn:last-child,",
          ".ace_replacebtn:last-child {",
          "border-top-right-radius: 3px;",
          "border-bottom-right-radius: 3px;",
          "}",
          ".ace_searchbtn:disabled {",
          "background: none;",
          "cursor: default;",
          "}",
          ".ace_searchbtn {",
          "background-position: 50% 50%;",
          "background-repeat: no-repeat;",
          "width: 27px;",
          "}",
          ".ace_searchbtn.prev {",
          "background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADFJREFUeNpiSU1NZUAC/6E0I0yACYskCpsJiySKIiY0SUZk40FyTEgCjGgKwTRAgAEAQJUIPCE+qfkAAAAASUVORK5CYII=);    ",
          "}",
          ".ace_searchbtn.next {",
          "background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADRJREFUeNpiTE1NZQCC/0DMyIAKwGJMUAYDEo3M/s+EpvM/mkKwCQxYjIeLMaELoLMBAgwAU7UJObTKsvAAAAAASUVORK5CYII=);    ",
          "}",
          ".ace_searchbtn_close {",
          "background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAcCAYAAABRVo5BAAAAZ0lEQVR42u2SUQrAMAhDvazn8OjZBilCkYVVxiis8H4CT0VrAJb4WHT3C5xU2a2IQZXJjiQIRMdkEoJ5Q2yMqpfDIo+XY4k6h+YXOyKqTIj5REaxloNAd0xiKmAtsTHqW8sR2W5f7gCu5nWFUpVjZwAAAABJRU5ErkJggg==) no-repeat 50% 0;",
          "border-radius: 50%;",
          "border: 0 none;",
          "color: #656565;",
          "cursor: pointer;",
          "float: right;",
          "font: 16px/16px Arial;",
          "height: 14px;",
          "margin: 5px 1px 9px 5px;",
          "padding: 0;",
          "text-align: center;",
          "width: 14px;",
          "}",
          ".ace_searchbtn_close:hover {",
          "background-color: #656565;",
          "background-position: 50% 100%;",
          "color: white;",
          "}",
          ".ace_replacebtn.prev {",
          "width: 54px",
          "}",
          ".ace_replacebtn.next {",
          "width: 27px",
          "}",
          ".ace_button {",
          "margin-left: 2px;",
          "cursor: pointer;",
          "-webkit-user-select: none;",
          "-moz-user-select: none;",
          "-o-user-select: none;",
          "-ms-user-select: none;",
          "user-select: none;",
          "overflow: hidden;",
          "opacity: 0.7;",
          "border: 1px solid rgba(100,100,100,0.23);",
          "padding: 1px;",
          "-moz-box-sizing: border-box;",
          "box-sizing:    border-box;",
          "color: black;",
          "}",
          ".ace_button:hover {",
          "background-color: #eee;",
          "opacity:1;",
          "}",
          ".ace_button:active {",
          "background-color: #ddd;",
          "}",
          ".ace_button.checked {",
          "border-color: #3399ff;",
          "opacity:1;",
          "}",
          ".ace_search_options{",
          "clear: both;",
          "margin: 4px 0;",
          "text-align: right;",
          "-webkit-user-select: none;",
          "-moz-user-select: none;",
          "-o-user-select: none;",
          "-ms-user-select: none;",
          "user-select: none;",
          "}",
          ".replace_toggle{",
          "float: left;",
          "margin-top: -2px;",
          "padding: 0 5px;",
          " }",
          ".ace_search_counter{",
          "float: left;",
          "font-family: arial;",
          "padding: 0 8px;",
          "}",
          "button svg,path {",
          "pointer-events: none;",
          "}",
        ].join("");

      style.setAttribute("data-name", "js-searchbox");

      style.textContent = css;

      document.head.appendChild(style);
    }

    function addHtml() {
      var elSearch,
        el = cm.getWrapperElement(),
        div = document.createElement("div"),
        html = [
          '<div class="ace_search right">',
          '<button type="button" action="hide" class="ace_searchbtn_close"></button>',
          '<div class="ace_search_form">',
          '<input class="ace_search_field" placeholder="Search for" spellcheck="false"></input>',
          '<button type="button" action="findNext" class="ace_searchbtn next"></button>',
          '<button type="button" action="findPrev" class="ace_searchbtn prev"></button>',
          "</div>",
          '<div class="ace_replace_form">',
          '<input class="ace_search_field" placeholder="Replace with" spellcheck="false"></input>',
          '<button type="button" action="replaceAndFindNext" title="Replace" class="ace_replacebtn">',
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">',
          '<path fill-rule="evenodd" clip-rule="evenodd" d="M3.221 3.739L5.482 6.008L7.7 3.784L7 3.084L5.988 4.091L5.98 2.491C5.97909 2.35567 6.03068 2.22525 6.12392 2.12716C6.21716 2.02908 6.3448 1.97095 6.48 1.965H8V1H6.48C6.28496 1.00026 6.09189 1.03902 5.91186 1.11405C5.73183 1.18908 5.56838 1.29892 5.43088 1.43725C5.29338 1.57558 5.18455 1.73969 5.11061 1.92018C5.03667 2.10066 4.99908 2.29396 5 2.489V4.1L3.927 3.033L3.221 3.739ZM9.89014 5.53277H9.90141C10.0836 5.84426 10.3521 6 10.707 6C11.0995 6 11.4131 5.83236 11.6479 5.49708C11.8826 5.1618 12 4.71728 12 4.16353C12 3.65304 11.8995 3.2507 11.6986 2.95652C11.4977 2.66234 11.2113 2.51525 10.8394 2.51525C10.4338 2.51525 10.1211 2.70885 9.90141 3.09604H9.89014V1H9V5.91888H9.89014V5.53277ZM9.87606 4.47177V4.13108C9.87606 3.88449 9.93427 3.6844 10.0507 3.53082C10.169 3.37724 10.3174 3.30045 10.4958 3.30045C10.6854 3.30045 10.831 3.37833 10.9324 3.53407C11.0357 3.68765 11.0873 3.9018 11.0873 4.17651C11.0873 4.50746 11.031 4.76379 10.9183 4.94549C10.8075 5.12503 10.6507 5.2148 10.4479 5.2148C10.2808 5.2148 10.1437 5.14449 10.0366 5.00389C9.92958 4.86329 9.87606 4.68592 9.87606 4.47177ZM9 12.7691C8.74433 12.923 8.37515 13 7.89247 13C7.32855 13 6.87216 12.8225 6.5233 12.4674C6.17443 12.1124 6 11.6543 6 11.0931C6 10.4451 6.18638 9.93484 6.55914 9.5624C6.93429 9.18747 7.43489 9.00001 8.06093 9.00001C8.49343 9.00001 8.80645 9.0596 9 9.17878V10.1769C8.76344 9.99319 8.4994 9.90132 8.20789 9.90132C7.88292 9.90132 7.62485 10.0006 7.43369 10.1993C7.24492 10.3954 7.15054 10.6673 7.15054 11.0149C7.15054 11.3526 7.24134 11.6183 7.42294 11.8119C7.60454 12.0031 7.85424 12.0987 8.17204 12.0987C8.454 12.0987 8.72999 12.0068 9 11.8231V12.7691ZM4 7L3 8V14L4 15H11L12 14V8L11 7H4ZM4 8H5H10H11V9V13V14H10H5H4V13V9V8Z" fill="#656565"/>',
          "</svg></button>",
          '<button type="button" action="replaceAll" title="Replace All" class="ace_replacebtn">',
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">',
          '<path fill-rule="evenodd" clip-rule="evenodd" d="M11.6009 2.67683C11.7474 2.36708 11.9559 2.2122 12.2263 2.2122C12.4742 2.2122 12.6651 2.32987 12.7991 2.56522C12.933 2.80056 13 3.12243 13 3.53082C13 3.97383 12.9218 4.32944 12.7653 4.59766C12.6088 4.86589 12.3997 5 12.138 5C11.9014 5 11.7224 4.87541 11.6009 4.62622H11.5934V4.93511H11V1H11.5934V2.67683H11.6009ZM11.584 3.77742C11.584 3.94873 11.6197 4.09063 11.6911 4.20311C11.7624 4.3156 11.8538 4.37184 11.9653 4.37184C12.1005 4.37184 12.205 4.30002 12.2789 4.15639C12.354 4.01103 12.3915 3.80597 12.3915 3.54121C12.3915 3.32144 12.3571 3.15012 12.2883 3.02726C12.2207 2.90266 12.1236 2.84036 11.9972 2.84036C11.8782 2.84036 11.7793 2.9018 11.7005 3.02466C11.6228 3.14752 11.584 3.30759 11.584 3.50487V3.77742ZM4.11969 7.695L2 5.56781L2.66188 4.90594L3.66781 5.90625V4.39594C3.66695 4.21309 3.70219 4.03187 3.7715 3.86266C3.84082 3.69346 3.94286 3.53961 4.07176 3.40992C4.20066 3.28023 4.3539 3.17727 4.52268 3.10692C4.69146 3.03658 4.87246 3.00024 5.05531 3H7.39906V3.90469H5.05531C4.92856 3.91026 4.8089 3.96476 4.72149 4.05672C4.63408 4.14868 4.58571 4.27094 4.58656 4.39781L4.59406 5.89781L5.54281 4.95375L6.19906 5.61L4.11969 7.695ZM9.3556 4.93017H10V3.22067C10 2.40689 9.68534 2 9.05603 2C8.92098 2 8.77083 2.02421 8.6056 2.07263C8.44181 2.12104 8.3125 2.17691 8.21767 2.24022V2.90503C8.45474 2.70205 8.70474 2.60056 8.96767 2.60056C9.22917 2.60056 9.35991 2.75698 9.35991 3.06983L8.76078 3.17318C8.25359 3.25885 8 3.57914 8 4.13408C8 4.39665 8.06106 4.60708 8.18319 4.76536C8.30675 4.92179 8.47557 5 8.68966 5C8.97989 5 9.19899 4.83985 9.34698 4.51955H9.3556V4.93017ZM9.35991 3.57542V3.76816C9.35991 3.9432 9.31968 4.08845 9.23922 4.20391C9.15876 4.3175 9.0546 4.3743 8.92672 4.3743C8.83477 4.3743 8.76149 4.34264 8.7069 4.27933C8.65374 4.21415 8.62716 4.13128 8.62716 4.03073C8.62716 3.80912 8.73779 3.6797 8.95905 3.64246L9.35991 3.57542ZM7 12.9302H6.3556V12.5196H6.34698C6.19899 12.8399 5.97989 13 5.68966 13C5.47557 13 5.30675 12.9218 5.18319 12.7654C5.06106 12.6071 5 12.3966 5 12.1341C5 11.5791 5.25359 11.2588 5.76078 11.1732L6.35991 11.0698C6.35991 10.757 6.22917 10.6006 5.96767 10.6006C5.70474 10.6006 5.45474 10.702 5.21767 10.905V10.2402C5.3125 10.1769 5.44181 10.121 5.6056 10.0726C5.77083 10.0242 5.92098 10 6.05603 10C6.68534 10 7 10.4069 7 11.2207V12.9302ZM6.35991 11.7682V11.5754L5.95905 11.6425C5.73779 11.6797 5.62716 11.8091 5.62716 12.0307C5.62716 12.1313 5.65374 12.2142 5.7069 12.2793C5.76149 12.3426 5.83477 12.3743 5.92672 12.3743C6.0546 12.3743 6.15876 12.3175 6.23922 12.2039C6.31968 12.0885 6.35991 11.9432 6.35991 11.7682ZM9.26165 13C9.58343 13 9.82955 12.9423 10 12.8268V12.1173C9.81999 12.2551 9.636 12.324 9.44803 12.324C9.23616 12.324 9.06969 12.2523 8.94863 12.1089C8.82756 11.9637 8.76702 11.7644 8.76702 11.5112C8.76702 11.2505 8.82995 11.0466 8.95579 10.8994C9.08323 10.7505 9.25528 10.676 9.47192 10.676C9.66627 10.676 9.84229 10.7449 10 10.8827V10.1341C9.87097 10.0447 9.66229 10 9.37395 10C8.95659 10 8.62286 10.1406 8.37276 10.4218C8.12425 10.7011 8 11.0838 8 11.5698C8 11.9907 8.11629 12.3343 8.34887 12.6006C8.58144 12.8669 8.8857 13 9.26165 13ZM2 9L3 8H12L13 9V14L12 15H3L2 14V9ZM3 9V14H12V9H3ZM6 7L7 6H14L15 7V12L14 13V12V7H7H6Z" fill="#656565"/>',
          "</svg></button>",
          "</div>",
          '<div class="ace_search_options">',
          '<span action="toggleReplace" class="ace_button replace_toggle">+</span>',
          '<span class="ace_search_counter">0 matches found.</span>',
          '<span action="toggleRegexpMode" title="RegExp Search"></span>',
          '<span action="toggleCaseSensitive" class="ace_button" title="CaseSensitive Search">Aa</span>',
          '<span action="toggleWholeWords" title="Whole Word Search"></span>',
          "</div>",
          "</div>",
        ].join("");

      div.innerHTML = html;

      elSearch = div.firstChild;

      el.appendChild(elSearch);

      return elSearch;
    }
  }

  function setCssClass(el, className, condition) {
    var list = el.classList;

    list[condition ? "add" : "remove"](className);
  }

  function delayedCall(fcn, defaultTimeout) {
    var timer,
      callback = function () {
        timer = null;
        fcn();
      },
      _self = function (timeout) {
        if (!timer) timer = setTimeout(callback, timeout || defaultTimeout);
      };

    _self.delay = function (timeout) {
      timer && clearTimeout(timer);
      timer = setTimeout(callback, timeout || defaultTimeout);
    };
    _self.schedule = _self;

    _self.call = function () {
      this.cancel();
      fcn();
    };

    _self.cancel = function () {
      timer && clearTimeout(timer);
      timer = null;
    };

    _self.isPending = function () {
      return timer;
    };

    return _self;
  }

  /* https://github.com/coderaiser/key */
  function key(str, event) {
    var right,
      KEY = {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        ESC: 27,

        SPACE: 32,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        END: 35,
        HOME: 36,
        UP: 38,
        DOWN: 40,

        INSERT: 45,
        DELETE: 46,

        INSERT_MAC: 96,

        ASTERISK: 106,
        PLUS: 107,
        MINUS: 109,

        F1: 112,
        F2: 113,
        F3: 114,
        F4: 115,
        F5: 116,
        F6: 117,
        F7: 118,
        F8: 119,
        F9: 120,
        F10: 121,

        SLASH: 191,
        TRA: 192 /* Typewritten Reverse Apostrophe (`) */,
        BACKSLASH: 220,
      };

    keyCheck(str, event);

    right = str.split("|").some(function (combination) {
      var wrong;

      wrong = combination.split("-").some(function (key) {
        var right;

        switch (key) {
          case "Ctrl":
            right = event.ctrlKey;
            break;

          case "Shift":
            right = event.shiftKey;
            break;

          case "Alt":
            right = event.altKey;
            break;

          case "Cmd":
            right = event.metaKey;
            break;

          default:
            if (key.length === 1) right = event.keyCode === key.charCodeAt(0);
            else
              Object.keys(KEY).some(function (name) {
                var up = key.toUpperCase();

                if (up === name) right = event.keyCode === KEY[name];
              });
            break;
        }

        return !right;
      });

      return !wrong;
    });

    return right;
  }

  function keyCheck(str, event) {
    if (typeof str !== "string") throw Error("str should be string!");

    if (typeof event !== "object") throw Error("event should be object!");
  }
});
