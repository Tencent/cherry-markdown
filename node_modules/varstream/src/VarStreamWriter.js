'use strict';
/*
 * Copyright (C) 2012-2013 Nicolas Froidure
 *
 * This file is free software;
 * you can redistribute it and/or modify it under the terms of the GNU
 * General Public License (GPL) as published by the Free Software
 * Foundation, in version 3. It is distributed in the
 * hope that it will be useful, but WITHOUT ANY WARRANTY of any kind.
 *
 */
'use strict';
// AMD + global + NodeJS : You can use this object by inserting a script
// or using an AMD loader (like RequireJS) or using NodeJS
(function(root,define){ define([], function() {
// START: Module logic start
 
  function VarStreamWriter(callback, options) {
    this.lastContext='';
    this.callback=callback; // Output stream callback
    this.options=options;
    this.imbricatedArrayEntries=new Array();
    this.scopes=new Array();
    this.contexts=new Array();
    this.previousContext='';
  }

  // Static consts
  VarStreamWriter.MORPH_CONTEXTS=2;
  VarStreamWriter.MERGE_ARRAYS=4;
  VarStreamWriter.OPTIONS=
    VarStreamWriter.MORPH_CONTEXTS|VarStreamWriter.MERGE_ARRAYS;

  VarStreamWriter.prototype.write = function (scope, context, root) {
    context = context || '';
    if('' === context) {
      root = scope;
    }
    if(scope instanceof Object) {
      if(-1 !== this.scopes.indexOf(scope)) {
        if(root == scope) {
          this.callback(context+'&=^0'+"\n");
        } else {
          this.callback(context+'&='+this.contexts[this.scopes.indexOf(scope)]+"\n");
        }
        this.previousContext = context;
        return;
      }
      this.scopes.push(scope);
      this.contexts.push(context);
    }
    if(scope instanceof Array) {
      for(var i=0, j=scope.length; i<j; i++) {
        this.imbricatedArrayEntries.push(true);
        this.write(scope[i],(context?context+'.':'')
          +(this.options&VarStreamWriter.MERGE_ARRAYS?'?':i), root);
        this.imbricatedArrayEntries.pop();
      }
    } else if(scope instanceof Object) {
      for (var prop in scope) {
        if (scope.hasOwnProperty(prop)&&(!(scope instanceof Function))
          &&/^([a-z0-9_]+)$/i.test(prop)) {
          this.write(scope[prop],(context?context+'.':'')+prop, root);
        }
      }
    } else {
      if('' === context) {
        throw new Error('The root scope must be an Object or an Array.');
      }
      // Changing context with imbricated arrays
      for(var i=this.imbricatedArrayEntries.length-1; i>=0; i--) {
        var index=context.lastIndexOf('?');
        if(-1 === index) {
          continue;
        }
        if(this.imbricatedArrayEntries[i]) {
          context=context.substr(0,index)+'+'+context.substr(index+1);
          this.imbricatedArrayEntries[i]=false;
        } else {
          context=context.substr(0,index)+'*'+context.substr(index+1);
        }
      }
      // Trying to reduce context with ^
      var morphedContext=context;
      if(this.options&VarStreamWriter.MORPH_CONTEXTS&&this.lastContext
        &&morphedContext.indexOf(this.lastContext+'.')===0) {
        morphedContext=morphedContext.replace(this.lastContext,'^')
      }
      // Saving this context for later use
      var index=context.lastIndexOf('.');
      this.lastContext=(index!==false?context.substr(0,index):'');
      // Export the value
      if('undefined' === typeof scope) {
        scope = '';
      } else if(null === scope) {
        scope = 'null';
      } else {
        scope = (scope+'').replace(/(\r?\n)/gm,'\\'+"\n");
      }
      // Calling back
      this.callback(morphedContext+'='+scope+"\n");
      this.previousContext = context;
    }
  };

// END: Module logic end

  return VarStreamWriter;

});})(this,typeof define === 'function' && define.amd ?
  // AMD
  define :
  // NodeJS
  (typeof exports === 'object'?function (name, deps, factory) {
    var root=this;
    if(typeof name === 'object') {
      factory=deps; deps=name;
    }
    module.exports=factory.apply(this, deps.map(function(dep){
      return require(dep);
    }));
  }:
  // Global
  function (name, deps, factory) {
    var root=this;
    if(typeof name === 'object') {
      factory=deps; deps=name;
    }
    this.VarStreamWriter=factory.apply(this, deps.map(function(dep){
      return root[dep.substring(dep.lastIndexOf('/')+1)];
    }));
  }.bind(this)
  )
);

