# dom-parser

Fast dom parser based on regexps

## installation

    npm install dom-parser

## usage

    var DomParser = require('dom-parser');
    var parser = new DomParser();

    fs.readFile('htmlToParse.html', 'utf8', function(err, html){
      if (!err){
        var dom = parser.parseFromString(html);

        console.log(dom.getElementById('myElement').innerHTML);
      }
    })

## API

##### Dom

Implemented methods:

* getElementById
* getElementsByClassName
* getElementsByTagName
* getElementsByName

##### Node

Implemented properties

* nodeType
* nodeName
* childNodes
* firstChild
* lastChild
* parentNode
* attributes
* innerHTML
* outerHTML
* textContent

Implemented methods

* getAttribute
* getElementById
* getElementsByClassName
* getElementsByTagName
* getElementsByName

Usage - https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement


## contributing

issues and pull requests are welcome!
