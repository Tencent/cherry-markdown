import{m as $e}from"./chunk-2HR5LOFI.mjs";import{a as ii}from"./chunk-XBXGYYE5.mjs";import{F as oe,N as ce,Q as le,R as ue,S as de,T as fe,U as he,V as me,W as ke,Y as nt}from"./chunk-5YUVU3PZ.mjs";import{A as Me,B as Ot,C as Ft,D as Ee,a as ae,b as et,d as ye,e as pe,f as ge,g as xe,h as pt,i as be,o as Te,p as $t,q as Yt,r as Lt,s as It,t as At,u as ve,v as we,w as _e,x as De,y as Se,z as Ce}from"./chunk-MGPAVIPZ.mjs";import"./chunk-JIN56HTB.mjs";import{a as o,c as wt,f as ot}from"./chunk-VELTKBKT.mjs";var Le=wt((Pt,Vt)=>{"use strict";(function(t,i){typeof Pt=="object"&&typeof Vt<"u"?Vt.exports=i():typeof define=="function"&&define.amd?define(i):(t=typeof globalThis<"u"?globalThis:t||self).dayjs_plugin_isoWeek=i()})(Pt,(function(){"use strict";var t="day";return function(i,a,r){var s=o(function(D){return D.add(4-D.isoWeekday(),t)},"a"),u=a.prototype;u.isoWeekYear=function(){return s(this).year()},u.isoWeek=function(D){if(!this.$utils().u(D))return this.add(7*(D-this.isoWeek()),t);var S,P,C,W,R=s(this),z=(S=this.isoWeekYear(),P=this.$u,C=(P?r.utc:r)().year(S).startOf("year"),W=4-C.isoWeekday(),C.isoWeekday()>4&&(W+=7),C.add(W,t));return R.diff(z,"week")+1},u.isoWeekday=function(D){return this.$utils().u(D)?this.day()||7:this.day(this.day()%7?D:D-7)};var x=u.startOf;u.startOf=function(D,S){var P=this.$utils(),C=!!P.u(S)||S;return P.p(D)==="isoweek"?C?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):x.bind(this)(D,S)}}}))});var Ie=wt((Nt,zt)=>{"use strict";(function(t,i){typeof Nt=="object"&&typeof zt<"u"?zt.exports=i():typeof define=="function"&&define.amd?define(i):(t=typeof globalThis<"u"?globalThis:t||self).dayjs_plugin_customParseFormat=i()})(Nt,(function(){"use strict";var t={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},i=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,a=/\d/,r=/\d\d/,s=/\d\d?/,u=/\d*[^-_:/,()\s\d]+/,x={},D=o(function(v){return(v=+v)+(v>68?1900:2e3)},"a"),S=o(function(v){return function(k){this[v]=+k}},"f"),P=[/[+-]\d\d:?(\d\d)?|Z/,function(v){(this.zone||(this.zone={})).offset=(function(k){if(!k||k==="Z")return 0;var O=k.match(/([+-]|\d\d)/g),L=60*O[1]+(+O[2]||0);return L===0?0:O[0]==="+"?-L:L})(v)}],C=o(function(v){var k=x[v];return k&&(k.indexOf?k:k.s.concat(k.f))},"u"),W=o(function(v,k){var O,L=x.meridiem;if(L){for(var G=1;G<=24;G+=1)if(v.indexOf(L(G,0,k))>-1){O=G>12;break}}else O=v===(k?"pm":"PM");return O},"d"),R={A:[u,function(v){this.afternoon=W(v,!1)}],a:[u,function(v){this.afternoon=W(v,!0)}],Q:[a,function(v){this.month=3*(v-1)+1}],S:[a,function(v){this.milliseconds=100*+v}],SS:[r,function(v){this.milliseconds=10*+v}],SSS:[/\d{3}/,function(v){this.milliseconds=+v}],s:[s,S("seconds")],ss:[s,S("seconds")],m:[s,S("minutes")],mm:[s,S("minutes")],H:[s,S("hours")],h:[s,S("hours")],HH:[s,S("hours")],hh:[s,S("hours")],D:[s,S("day")],DD:[r,S("day")],Do:[u,function(v){var k=x.ordinal,O=v.match(/\d+/);if(this.day=O[0],k)for(var L=1;L<=31;L+=1)k(L).replace(/\[|\]/g,"")===v&&(this.day=L)}],w:[s,S("week")],ww:[r,S("week")],M:[s,S("month")],MM:[r,S("month")],MMM:[u,function(v){var k=C("months"),O=(C("monthsShort")||k.map((function(L){return L.slice(0,3)}))).indexOf(v)+1;if(O<1)throw new Error;this.month=O%12||O}],MMMM:[u,function(v){var k=C("months").indexOf(v)+1;if(k<1)throw new Error;this.month=k%12||k}],Y:[/[+-]?\d+/,S("year")],YY:[r,function(v){this.year=D(v)}],YYYY:[/\d{4}/,S("year")],Z:P,ZZ:P};function z(v){var k,O;k=v,O=x&&x.formats;for(var L=(v=k.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,(function(I,f,y){var p=y&&y.toUpperCase();return f||O[y]||t[y]||O[p].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,(function(T,g,c){return g||c.slice(1)}))}))).match(i),G=L.length,X=0;X<G;X+=1){var E=L[X],b=R[E],d=b&&b[0],M=b&&b[1];L[X]=M?{regex:d,parser:M}:E.replace(/^\[|\]$/g,"")}return function(I){for(var f={},y=0,p=0;y<G;y+=1){var T=L[y];if(typeof T=="string")p+=T.length;else{var g=T.regex,c=T.parser,l=I.slice(p),h=g.exec(l)[0];c.call(f,h),I=I.replace(h,"")}}return(function(m){var w=m.afternoon;if(w!==void 0){var n=m.hours;w?n<12&&(m.hours+=12):n===12&&(m.hours=0),delete m.afternoon}})(f),f}}return o(z,"l"),function(v,k,O){O.p.customParseFormat=!0,v&&v.parseTwoDigitYear&&(D=v.parseTwoDigitYear);var L=k.prototype,G=L.parse;L.parse=function(X){var E=X.date,b=X.utc,d=X.args;this.$u=b;var M=d[1];if(typeof M=="string"){var I=d[2]===!0,f=d[3]===!0,y=I||f,p=d[2];f&&(p=d[2]),x=this.$locale(),!I&&p&&(x=O.Ls[p]),this.$d=(function(l,h,m,w){try{if(["x","X"].indexOf(h)>-1)return new Date((h==="X"?1e3:1)*l);var n=z(h)(l),F=n.year,e=n.month,_=n.day,A=n.hours,$=n.minutes,Y=n.seconds,H=n.milliseconds,V=n.zone,N=n.week,U=new Date,st=_||(F||e?1:U.getDate()),rt=F||U.getFullYear(),lt=0;F&&!e||(lt=e>0?e-1:U.getMonth());var kt,yt=A||0,j=$||0,at=Y||0,K=H||0;return V?new Date(Date.UTC(rt,lt,st,yt,j,at,K+60*V.offset*1e3)):m?new Date(Date.UTC(rt,lt,st,yt,j,at,K)):(kt=new Date(rt,lt,st,yt,j,at,K),N&&(kt=w(kt).week(N).toDate()),kt)}catch{return new Date("")}})(E,M,b,O),this.init(),p&&p!==!0&&(this.$L=this.locale(p).$L),y&&E!=this.format(M)&&(this.$d=new Date("")),x={}}else if(M instanceof Array)for(var T=M.length,g=1;g<=T;g+=1){d[1]=M[g-1];var c=O.apply(this,d);if(c.isValid()){this.$d=c.$d,this.$L=c.$L,this.init();break}g===T&&(this.$d=new Date(""))}else G.call(this,X)}}}))});var Ae=wt((Rt,Ht)=>{"use strict";(function(t,i){typeof Rt=="object"&&typeof Ht<"u"?Ht.exports=i():typeof define=="function"&&define.amd?define(i):(t=typeof globalThis<"u"?globalThis:t||self).dayjs_plugin_advancedFormat=i()})(Rt,(function(){"use strict";return function(t,i){var a=i.prototype,r=a.format;a.format=function(s){var u=this,x=this.$locale();if(!this.isValid())return r.bind(this)(s);var D=this.$utils(),S=(s||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,(function(P){switch(P){case"Q":return Math.ceil((u.$M+1)/3);case"Do":return x.ordinal(u.$D);case"gggg":return u.weekYear();case"GGGG":return u.isoWeekYear();case"wo":return x.ordinal(u.week(),"W");case"w":case"ww":return D.s(u.week(),P==="w"?1:2,"0");case"W":case"WW":return D.s(u.isoWeek(),P==="W"?1:2,"0");case"k":case"kk":return D.s(String(u.$H===0?24:u.$H),P==="k"?1:2,"0");case"X":return Math.floor(u.$d.getTime()/1e3);case"x":return u.$d.getTime();case"z":return"["+u.offsetName()+"]";case"zzz":return"["+u.offsetName("long")+"]";default:return P}}));return r.bind(this)(S)}}}))});var Qe=wt((ie,ne)=>{"use strict";(function(t,i){typeof ie=="object"&&typeof ne<"u"?ne.exports=i():typeof define=="function"&&define.amd?define(i):(t=typeof globalThis<"u"?globalThis:t||self).dayjs_plugin_duration=i()})(ie,(function(){"use strict";var t,i,a=1e3,r=6e4,s=36e5,u=864e5,x=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,D=31536e6,S=2628e6,P=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/,C={years:D,months:S,days:u,hours:s,minutes:r,seconds:a,milliseconds:1,weeks:6048e5},W=o(function(E){return E instanceof G},"c"),R=o(function(E,b,d){return new G(E,d,b.$l)},"f"),z=o(function(E){return i.p(E)+"s"},"m"),v=o(function(E){return E<0},"l"),k=o(function(E){return v(E)?Math.ceil(E):Math.floor(E)},"$"),O=o(function(E){return Math.abs(E)},"y"),L=o(function(E,b){return E?v(E)?{negative:!0,format:""+O(E)+b}:{negative:!1,format:""+E+b}:{negative:!1,format:""}},"v"),G=(function(){function E(d,M,I){var f=this;if(this.$d={},this.$l=I,d===void 0&&(this.$ms=0,this.parseFromMilliseconds()),M)return R(d*C[z(M)],this);if(typeof d=="number")return this.$ms=d,this.parseFromMilliseconds(),this;if(typeof d=="object")return Object.keys(d).forEach((function(T){f.$d[z(T)]=d[T]})),this.calMilliseconds(),this;if(typeof d=="string"){var y=d.match(P);if(y){var p=y.slice(2).map((function(T){return T!=null?Number(T):0}));return this.$d.years=p[0],this.$d.months=p[1],this.$d.weeks=p[2],this.$d.days=p[3],this.$d.hours=p[4],this.$d.minutes=p[5],this.$d.seconds=p[6],this.calMilliseconds(),this}}return this}o(E,"l");var b=E.prototype;return b.calMilliseconds=function(){var d=this;this.$ms=Object.keys(this.$d).reduce((function(M,I){return M+(d.$d[I]||0)*C[I]}),0)},b.parseFromMilliseconds=function(){var d=this.$ms;this.$d.years=k(d/D),d%=D,this.$d.months=k(d/S),d%=S,this.$d.days=k(d/u),d%=u,this.$d.hours=k(d/s),d%=s,this.$d.minutes=k(d/r),d%=r,this.$d.seconds=k(d/a),d%=a,this.$d.milliseconds=d},b.toISOString=function(){var d=L(this.$d.years,"Y"),M=L(this.$d.months,"M"),I=+this.$d.days||0;this.$d.weeks&&(I+=7*this.$d.weeks);var f=L(I,"D"),y=L(this.$d.hours,"H"),p=L(this.$d.minutes,"M"),T=this.$d.seconds||0;this.$d.milliseconds&&(T+=this.$d.milliseconds/1e3,T=Math.round(1e3*T)/1e3);var g=L(T,"S"),c=d.negative||M.negative||f.negative||y.negative||p.negative||g.negative,l=y.format||p.format||g.format?"T":"",h=(c?"-":"")+"P"+d.format+M.format+f.format+l+y.format+p.format+g.format;return h==="P"||h==="-P"?"P0D":h},b.toJSON=function(){return this.toISOString()},b.format=function(d){var M=d||"YYYY-MM-DDTHH:mm:ss",I={Y:this.$d.years,YY:i.s(this.$d.years,2,"0"),YYYY:i.s(this.$d.years,4,"0"),M:this.$d.months,MM:i.s(this.$d.months,2,"0"),D:this.$d.days,DD:i.s(this.$d.days,2,"0"),H:this.$d.hours,HH:i.s(this.$d.hours,2,"0"),m:this.$d.minutes,mm:i.s(this.$d.minutes,2,"0"),s:this.$d.seconds,ss:i.s(this.$d.seconds,2,"0"),SSS:i.s(this.$d.milliseconds,3,"0")};return M.replace(x,(function(f,y){return y||String(I[f])}))},b.as=function(d){return this.$ms/C[z(d)]},b.get=function(d){var M=this.$ms,I=z(d);return I==="milliseconds"?M%=1e3:M=I==="weeks"?k(M/C[I]):this.$d[I],M||0},b.add=function(d,M,I){var f;return f=M?d*C[z(M)]:W(d)?d.$ms:R(d,this).$ms,R(this.$ms+f*(I?-1:1),this)},b.subtract=function(d,M){return this.add(d,M,!0)},b.locale=function(d){var M=this.clone();return M.$l=d,M},b.clone=function(){return R(this.$ms,this)},b.humanize=function(d){return t().add(this.$ms,"ms").locale(this.$l).fromNow(!d)},b.valueOf=function(){return this.asMilliseconds()},b.milliseconds=function(){return this.get("milliseconds")},b.asMilliseconds=function(){return this.as("milliseconds")},b.seconds=function(){return this.get("seconds")},b.asSeconds=function(){return this.as("seconds")},b.minutes=function(){return this.get("minutes")},b.asMinutes=function(){return this.as("minutes")},b.hours=function(){return this.get("hours")},b.asHours=function(){return this.as("hours")},b.days=function(){return this.get("days")},b.asDays=function(){return this.as("days")},b.weeks=function(){return this.get("weeks")},b.asWeeks=function(){return this.as("weeks")},b.months=function(){return this.get("months")},b.asMonths=function(){return this.as("months")},b.years=function(){return this.get("years")},b.asYears=function(){return this.as("years")},E})(),X=o(function(E,b,d){return E.add(b.years()*d,"y").add(b.months()*d,"M").add(b.days()*d,"d").add(b.hours()*d,"h").add(b.minutes()*d,"m").add(b.seconds()*d,"s").add(b.milliseconds()*d,"ms")},"p");return function(E,b,d){t=d,i=d().$utils(),d.duration=function(f,y){var p=d.locale();return R(f,{$l:p},y)},d.isDuration=W;var M=b.prototype.add,I=b.prototype.subtract;b.prototype.add=function(f,y){return W(f)?X(this,f,1):M.bind(this)(f,y)},b.prototype.subtract=function(f,y){return W(f)?X(this,f,-1):I.bind(this)(f,y)}}}))});var Wt=(function(){var t=o(function(g,c,l,h){for(l=l||{},h=g.length;h--;l[g[h]]=c);return l},"o"),i=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],a=[1,26],r=[1,27],s=[1,28],u=[1,29],x=[1,30],D=[1,31],S=[1,32],P=[1,33],C=[1,34],W=[1,9],R=[1,10],z=[1,11],v=[1,12],k=[1,13],O=[1,14],L=[1,15],G=[1,16],X=[1,19],E=[1,20],b=[1,21],d=[1,22],M=[1,23],I=[1,25],f=[1,35],y={trace:o(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:o(function(c,l,h,m,w,n,F){var e=n.length-1;switch(w){case 1:return n[e-1];case 2:this.$=[];break;case 3:n[e-1].push(n[e]),this.$=n[e-1];break;case 4:case 5:this.$=n[e];break;case 6:case 7:this.$=[];break;case 8:m.setWeekday("monday");break;case 9:m.setWeekday("tuesday");break;case 10:m.setWeekday("wednesday");break;case 11:m.setWeekday("thursday");break;case 12:m.setWeekday("friday");break;case 13:m.setWeekday("saturday");break;case 14:m.setWeekday("sunday");break;case 15:m.setWeekend("friday");break;case 16:m.setWeekend("saturday");break;case 17:m.setDateFormat(n[e].substr(11)),this.$=n[e].substr(11);break;case 18:m.enableInclusiveEndDates(),this.$=n[e].substr(18);break;case 19:m.TopAxis(),this.$=n[e].substr(8);break;case 20:m.setAxisFormat(n[e].substr(11)),this.$=n[e].substr(11);break;case 21:m.setTickInterval(n[e].substr(13)),this.$=n[e].substr(13);break;case 22:m.setExcludes(n[e].substr(9)),this.$=n[e].substr(9);break;case 23:m.setIncludes(n[e].substr(9)),this.$=n[e].substr(9);break;case 24:m.setTodayMarker(n[e].substr(12)),this.$=n[e].substr(12);break;case 27:m.setDiagramTitle(n[e].substr(6)),this.$=n[e].substr(6);break;case 28:this.$=n[e].trim(),m.setAccTitle(this.$);break;case 29:case 30:this.$=n[e].trim(),m.setAccDescription(this.$);break;case 31:m.addSection(n[e].substr(8)),this.$=n[e].substr(8);break;case 33:m.addTask(n[e-1],n[e]),this.$="task";break;case 34:this.$=n[e-1],m.setClickEvent(n[e-1],n[e],null);break;case 35:this.$=n[e-2],m.setClickEvent(n[e-2],n[e-1],n[e]);break;case 36:this.$=n[e-2],m.setClickEvent(n[e-2],n[e-1],null),m.setLink(n[e-2],n[e]);break;case 37:this.$=n[e-3],m.setClickEvent(n[e-3],n[e-2],n[e-1]),m.setLink(n[e-3],n[e]);break;case 38:this.$=n[e-2],m.setClickEvent(n[e-2],n[e],null),m.setLink(n[e-2],n[e-1]);break;case 39:this.$=n[e-3],m.setClickEvent(n[e-3],n[e-1],n[e]),m.setLink(n[e-3],n[e-2]);break;case 40:this.$=n[e-1],m.setLink(n[e-1],n[e]);break;case 41:case 47:this.$=n[e-1]+" "+n[e];break;case 42:case 43:case 45:this.$=n[e-2]+" "+n[e-1]+" "+n[e];break;case 44:case 46:this.$=n[e-3]+" "+n[e-2]+" "+n[e-1]+" "+n[e];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(i,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:a,13:r,14:s,15:u,16:x,17:D,18:S,19:18,20:P,21:C,22:W,23:R,24:z,25:v,26:k,27:O,28:L,29:G,30:X,31:E,33:b,35:d,36:M,37:24,38:I,40:f},t(i,[2,7],{1:[2,1]}),t(i,[2,3]),{9:36,11:17,12:a,13:r,14:s,15:u,16:x,17:D,18:S,19:18,20:P,21:C,22:W,23:R,24:z,25:v,26:k,27:O,28:L,29:G,30:X,31:E,33:b,35:d,36:M,37:24,38:I,40:f},t(i,[2,5]),t(i,[2,6]),t(i,[2,17]),t(i,[2,18]),t(i,[2,19]),t(i,[2,20]),t(i,[2,21]),t(i,[2,22]),t(i,[2,23]),t(i,[2,24]),t(i,[2,25]),t(i,[2,26]),t(i,[2,27]),{32:[1,37]},{34:[1,38]},t(i,[2,30]),t(i,[2,31]),t(i,[2,32]),{39:[1,39]},t(i,[2,8]),t(i,[2,9]),t(i,[2,10]),t(i,[2,11]),t(i,[2,12]),t(i,[2,13]),t(i,[2,14]),t(i,[2,15]),t(i,[2,16]),{41:[1,40],43:[1,41]},t(i,[2,4]),t(i,[2,28]),t(i,[2,29]),t(i,[2,33]),t(i,[2,34],{42:[1,42],43:[1,43]}),t(i,[2,40],{41:[1,44]}),t(i,[2,35],{43:[1,45]}),t(i,[2,36]),t(i,[2,38],{42:[1,46]}),t(i,[2,37]),t(i,[2,39])],defaultActions:{},parseError:o(function(c,l){if(l.recoverable)this.trace(c);else{var h=new Error(c);throw h.hash=l,h}},"parseError"),parse:o(function(c){var l=this,h=[0],m=[],w=[null],n=[],F=this.table,e="",_=0,A=0,$=0,Y=2,H=1,V=n.slice.call(arguments,1),N=Object.create(this.lexer),U={yy:{}};for(var st in this.yy)Object.prototype.hasOwnProperty.call(this.yy,st)&&(U.yy[st]=this.yy[st]);N.setInput(c,U.yy),U.yy.lexer=N,U.yy.parser=this,typeof N.yylloc>"u"&&(N.yylloc={});var rt=N.yylloc;n.push(rt);var lt=N.options&&N.options.ranges;typeof U.yy.parseError=="function"?this.parseError=U.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function kt(q){h.length=h.length-2*q,w.length=w.length-q,n.length=n.length-q}o(kt,"popStack");function yt(){var q;return q=m.pop()||N.lex()||H,typeof q!="number"&&(q instanceof Array&&(m=q,q=m.pop()),q=l.symbols_[q]||q),q}o(yt,"lex");for(var j,at,K,Z,Hi,Mt,ut={},Tt,tt,re,vt;;){if(K=h[h.length-1],this.defaultActions[K]?Z=this.defaultActions[K]:((j===null||typeof j>"u")&&(j=yt()),Z=F[K]&&F[K][j]),typeof Z>"u"||!Z.length||!Z[0]){var Et="";vt=[];for(Tt in F[K])this.terminals_[Tt]&&Tt>Y&&vt.push("'"+this.terminals_[Tt]+"'");N.showPosition?Et="Parse error on line "+(_+1)+`:
`+N.showPosition()+`
Expecting `+vt.join(", ")+", got '"+(this.terminals_[j]||j)+"'":Et="Parse error on line "+(_+1)+": Unexpected "+(j==H?"end of input":"'"+(this.terminals_[j]||j)+"'"),this.parseError(Et,{text:N.match,token:this.terminals_[j]||j,line:N.yylineno,loc:rt,expected:vt})}if(Z[0]instanceof Array&&Z.length>1)throw new Error("Parse Error: multiple actions possible at state: "+K+", token: "+j);switch(Z[0]){case 1:h.push(j),w.push(N.yytext),n.push(N.yylloc),h.push(Z[1]),j=null,at?(j=at,at=null):(A=N.yyleng,e=N.yytext,_=N.yylineno,rt=N.yylloc,$>0&&$--);break;case 2:if(tt=this.productions_[Z[1]][1],ut.$=w[w.length-tt],ut._$={first_line:n[n.length-(tt||1)].first_line,last_line:n[n.length-1].last_line,first_column:n[n.length-(tt||1)].first_column,last_column:n[n.length-1].last_column},lt&&(ut._$.range=[n[n.length-(tt||1)].range[0],n[n.length-1].range[1]]),Mt=this.performAction.apply(ut,[e,A,_,U.yy,Z[1],w,n].concat(V)),typeof Mt<"u")return Mt;tt&&(h=h.slice(0,-1*tt*2),w=w.slice(0,-1*tt),n=n.slice(0,-1*tt)),h.push(this.productions_[Z[1]][0]),w.push(ut.$),n.push(ut._$),re=F[h[h.length-2]][h[h.length-1]],h.push(re);break;case 3:return!0}}return!0},"parse")},p=(function(){var g={EOF:1,parseError:o(function(l,h){if(this.yy.parser)this.yy.parser.parseError(l,h);else throw new Error(l)},"parseError"),setInput:o(function(c,l){return this.yy=l||this.yy||{},this._input=c,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:o(function(){var c=this._input[0];this.yytext+=c,this.yyleng++,this.offset++,this.match+=c,this.matched+=c;var l=c.match(/(?:\r\n?|\n).*/g);return l?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),c},"input"),unput:o(function(c){var l=c.length,h=c.split(/(?:\r\n?|\n)/g);this._input=c+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-l),this.offset-=l;var m=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),h.length-1&&(this.yylineno-=h.length-1);var w=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:h?(h.length===m.length?this.yylloc.first_column:0)+m[m.length-h.length].length-h[0].length:this.yylloc.first_column-l},this.options.ranges&&(this.yylloc.range=[w[0],w[0]+this.yyleng-l]),this.yyleng=this.yytext.length,this},"unput"),more:o(function(){return this._more=!0,this},"more"),reject:o(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:o(function(c){this.unput(this.match.slice(c))},"less"),pastInput:o(function(){var c=this.matched.substr(0,this.matched.length-this.match.length);return(c.length>20?"...":"")+c.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:o(function(){var c=this.match;return c.length<20&&(c+=this._input.substr(0,20-c.length)),(c.substr(0,20)+(c.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:o(function(){var c=this.pastInput(),l=new Array(c.length+1).join("-");return c+this.upcomingInput()+`
`+l+"^"},"showPosition"),test_match:o(function(c,l){var h,m,w;if(this.options.backtrack_lexer&&(w={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(w.yylloc.range=this.yylloc.range.slice(0))),m=c[0].match(/(?:\r\n?|\n).*/g),m&&(this.yylineno+=m.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:m?m[m.length-1].length-m[m.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+c[0].length},this.yytext+=c[0],this.match+=c[0],this.matches=c,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(c[0].length),this.matched+=c[0],h=this.performAction.call(this,this.yy,this,l,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),h)return h;if(this._backtrack){for(var n in w)this[n]=w[n];return!1}return!1},"test_match"),next:o(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var c,l,h,m;this._more||(this.yytext="",this.match="");for(var w=this._currentRules(),n=0;n<w.length;n++)if(h=this._input.match(this.rules[w[n]]),h&&(!l||h[0].length>l[0].length)){if(l=h,m=n,this.options.backtrack_lexer){if(c=this.test_match(h,w[n]),c!==!1)return c;if(this._backtrack){l=!1;continue}else return!1}else if(!this.options.flex)break}return l?(c=this.test_match(l,w[m]),c!==!1?c:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:o(function(){var l=this.next();return l||this.lex()},"lex"),begin:o(function(l){this.conditionStack.push(l)},"begin"),popState:o(function(){var l=this.conditionStack.length-1;return l>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:o(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:o(function(l){return l=this.conditionStack.length-1-Math.abs(l||0),l>=0?this.conditionStack[l]:"INITIAL"},"topState"),pushState:o(function(l){this.begin(l)},"pushState"),stateStackSize:o(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:o(function(l,h,m,w){var n=w;switch(m){case 0:return this.begin("open_directive"),"open_directive";break;case 1:return this.begin("acc_title"),31;break;case 2:return this.popState(),"acc_title_value";break;case 3:return this.begin("acc_descr"),33;break;case 4:return this.popState(),"acc_descr_value";break;case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return g})();y.lexer=p;function T(){this.yy={}}return o(T,"Parser"),T.prototype=y,y.Parser=T,new T})();Wt.parser=Wt;var Ye=Wt;var We=ot(ii(),1),Q=ot(ae(),1),Pe=ot(Le(),1),Ve=ot(Ie(),1),Ne=ot(Ae(),1);Q.default.extend(Pe.default);Q.default.extend(Ve.default);Q.default.extend(Ne.default);var Oe={friday:5,saturday:6},J="",Xt="",Ut,Zt="",gt=[],xt=[],qt=new Map,Qt=[],St=[],ht="",Kt="",ze=["active","done","crit","milestone","vert"],Jt=[],dt="",bt=!1,te=!1,ee="sunday",Ct="saturday",jt=0,ni=o(function(){Qt=[],St=[],ht="",Jt=[],_t=0,Gt=void 0,Dt=void 0,B=[],J="",Xt="",Kt="",Ut=void 0,Zt="",gt=[],xt=[],bt=!1,te=!1,jt=0,qt=new Map,dt="",le(),ee="sunday",Ct="saturday"},"clear"),si=o(function(t){dt=t},"setDiagramId"),ri=o(function(t){Xt=t},"setAxisFormat"),ai=o(function(){return Xt},"getAxisFormat"),oi=o(function(t){Ut=t},"setTickInterval"),ci=o(function(){return Ut},"getTickInterval"),li=o(function(t){Zt=t},"setTodayMarker"),ui=o(function(){return Zt},"getTodayMarker"),di=o(function(t){J=t},"setDateFormat"),fi=o(function(){bt=!0},"enableInclusiveEndDates"),hi=o(function(){return bt},"endDatesAreInclusive"),mi=o(function(){te=!0},"enableTopAxis"),ki=o(function(){return te},"topAxisEnabled"),yi=o(function(t){Kt=t},"setDisplayMode"),pi=o(function(){return Kt},"getDisplayMode"),gi=o(function(){return J},"getDateFormat"),xi=o(function(t){gt=t.toLowerCase().split(/[\s,]+/)},"setIncludes"),bi=o(function(){return gt},"getIncludes"),Ti=o(function(t){xt=t.toLowerCase().split(/[\s,]+/)},"setExcludes"),vi=o(function(){return xt},"getExcludes"),wi=o(function(){return qt},"getLinks"),_i=o(function(t){ht=t,Qt.push(t)},"addSection"),Di=o(function(){return Qt},"getSections"),Si=o(function(){let t=Fe(),i=10,a=0;for(;!t&&a<i;)t=Fe(),a++;return St=B,St},"getTasks"),Re=o(function(t,i,a,r){let s=t.format(i.trim()),u=t.format("YYYY-MM-DD");return r.includes(s)||r.includes(u)?!1:a.includes("weekends")&&(t.isoWeekday()===Oe[Ct]||t.isoWeekday()===Oe[Ct]+1)||a.includes(t.format("dddd").toLowerCase())?!0:a.includes(s)||a.includes(u)},"isInvalidDate"),Ci=o(function(t){ee=t},"setWeekday"),Mi=o(function(){return ee},"getWeekday"),Ei=o(function(t){Ct=t},"setWeekend"),He=o(function(t,i,a,r){if(!a.length||t.manualEndTime)return;let s;t.startTime instanceof Date?s=(0,Q.default)(t.startTime):s=(0,Q.default)(t.startTime,i,!0),s=s.add(1,"d");let u;t.endTime instanceof Date?u=(0,Q.default)(t.endTime):u=(0,Q.default)(t.endTime,i,!0);let[x,D]=$i(s,u,i,a,r);t.endTime=x.toDate(),t.renderEndTime=D},"checkTaskDates"),$i=o(function(t,i,a,r,s){let u=!1,x=null;for(;t<=i;)u||(x=i.toDate()),u=Re(t,a,r,s),u&&(i=i.add(1,"d")),t=t.add(1,"d");return[i,x]},"fixTaskDates"),Bt=o(function(t,i,a){if(a=a.trim(),o(D=>{let S=D.trim();return S==="x"||S==="X"},"isTimestampFormat")(i)&&/^\d+$/.test(a))return new Date(Number(a));let u=/^after\s+(?<ids>[\d\w- ]+)/.exec(a);if(u!==null){let D=null;for(let P of u.groups.ids.split(" ")){let C=ct(P);C!==void 0&&(!D||C.endTime>D.endTime)&&(D=C)}if(D)return D.endTime;let S=new Date;return S.setHours(0,0,0,0),S}let x=(0,Q.default)(a,i.trim(),!0);if(x.isValid())return x.toDate();{et.debug("Invalid date:"+a),et.debug("With date format:"+i.trim());let D=new Date(a);if(D===void 0||isNaN(D.getTime())||D.getFullYear()<-1e4||D.getFullYear()>1e4)throw new Error("Invalid date:"+a);return D}},"getStartDate"),je=o(function(t){let i=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());return i!==null?[Number.parseFloat(i[1]),i[2]]:[NaN,"ms"]},"parseDuration"),Be=o(function(t,i,a,r=!1){a=a.trim();let u=/^until\s+(?<ids>[\d\w- ]+)/.exec(a);if(u!==null){let C=null;for(let R of u.groups.ids.split(" ")){let z=ct(R);z!==void 0&&(!C||z.startTime<C.startTime)&&(C=z)}if(C)return C.startTime;let W=new Date;return W.setHours(0,0,0,0),W}let x=(0,Q.default)(a,i.trim(),!0);if(x.isValid())return r&&(x=x.add(1,"d")),x.toDate();let D=(0,Q.default)(t),[S,P]=je(a);if(!Number.isNaN(S)){let C=D.add(S,P);C.isValid()&&(D=C)}return D.toDate()},"getEndDate"),_t=0,ft=o(function(t){return t===void 0?(_t=_t+1,"task"+_t):t},"parseId"),Yi=o(function(t,i){let a;i.substr(0,1)===":"?a=i.substr(1,i.length):a=i;let r=a.split(","),s={};qe(r,s,ze);for(let x=0;x<r.length;x++)r[x]=r[x].trim();let u="";switch(r.length){case 1:s.id=ft(),s.startTime=t.endTime,u=r[0];break;case 2:s.id=ft(),s.startTime=Bt(void 0,J,r[0]),u=r[1];break;case 3:s.id=ft(r[0]),s.startTime=Bt(void 0,J,r[1]),u=r[2];break;default:}return u&&(s.endTime=Be(s.startTime,J,u,bt),s.manualEndTime=(0,Q.default)(u,"YYYY-MM-DD",!0).isValid(),He(s,J,xt,gt)),s},"compileData"),Li=o(function(t,i){let a;i.substr(0,1)===":"?a=i.substr(1,i.length):a=i;let r=a.split(","),s={};qe(r,s,ze);for(let u=0;u<r.length;u++)r[u]=r[u].trim();switch(r.length){case 1:s.id=ft(),s.startTime={type:"prevTaskEnd",id:t},s.endTime={data:r[0]};break;case 2:s.id=ft(),s.startTime={type:"getStartDate",startData:r[0]},s.endTime={data:r[1]};break;case 3:s.id=ft(r[0]),s.startTime={type:"getStartDate",startData:r[1]},s.endTime={data:r[2]};break;default:}return s},"parseData"),Gt,Dt,B=[],Ge={},Ii=o(function(t,i){let a={section:ht,type:ht,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:i},task:t,classes:[]},r=Li(Dt,i);a.raw.startTime=r.startTime,a.raw.endTime=r.endTime,a.id=r.id,a.prevTaskId=Dt,a.active=r.active,a.done=r.done,a.crit=r.crit,a.milestone=r.milestone,a.vert=r.vert,a.order=jt,jt++;let s=B.push(a);Dt=a.id,Ge[a.id]=s-1},"addTask"),ct=o(function(t){let i=Ge[t];return B[i]},"findTaskById"),Ai=o(function(t,i){let a={section:ht,type:ht,description:t,task:t,classes:[]},r=Yi(Gt,i);a.startTime=r.startTime,a.endTime=r.endTime,a.id=r.id,a.active=r.active,a.done=r.done,a.crit=r.crit,a.milestone=r.milestone,a.vert=r.vert,Gt=a,St.push(a)},"addTaskOrg"),Fe=o(function(){let t=o(function(a){let r=B[a],s="";switch(B[a].raw.startTime.type){case"prevTaskEnd":{let u=ct(r.prevTaskId);r.startTime=u.endTime;break}case"getStartDate":s=Bt(void 0,J,B[a].raw.startTime.startData),s&&(B[a].startTime=s);break}return B[a].startTime&&(B[a].endTime=Be(B[a].startTime,J,B[a].raw.endTime.data,bt),B[a].endTime&&(B[a].processed=!0,B[a].manualEndTime=(0,Q.default)(B[a].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),He(B[a],J,xt,gt))),B[a].processed},"compileTask"),i=!0;for(let[a,r]of B.entries())t(a),i=i&&r.processed;return i},"compileTasks"),Oi=o(function(t,i){let a=i;nt().securityLevel!=="loose"&&(a=(0,We.sanitizeUrl)(i)),t.split(",").forEach(function(r){ct(r)!==void 0&&(Ue(r,()=>{window.open(a,"_self")}),qt.set(r,a))}),Xe(t,"clickable")},"setLink"),Xe=o(function(t,i){t.split(",").forEach(function(a){let r=ct(a);r!==void 0&&r.classes.push(i)})},"setClass"),Fi=o(function(t,i,a){if(nt().securityLevel!=="loose"||i===void 0)return;let r=[];if(typeof a=="string"){r=a.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let u=0;u<r.length;u++){let x=r[u].trim();x.startsWith('"')&&x.endsWith('"')&&(x=x.substr(1,x.length-2)),r[u]=x}}r.length===0&&r.push(t),ct(t)!==void 0&&Ue(t,()=>{$e.runFunc(i,...r)})},"setClickFun"),Ue=o(function(t,i){Jt.push(function(){let a=dt?`${dt}-${t}`:t,r=document.querySelector(`[id="${a}"]`);r!==null&&r.addEventListener("click",function(){i()})},function(){let a=dt?`${dt}-${t}`:t,r=document.querySelector(`[id="${a}-text"]`);r!==null&&r.addEventListener("click",function(){i()})})},"pushFun"),Wi=o(function(t,i,a){t.split(",").forEach(function(r){Fi(r,i,a)}),Xe(t,"clickable")},"setClickEvent"),Pi=o(function(t){Jt.forEach(function(i){i(t)})},"bindFunctions"),Ze={getConfig:o(()=>nt().gantt,"getConfig"),clear:ni,setDateFormat:di,getDateFormat:gi,enableInclusiveEndDates:fi,endDatesAreInclusive:hi,enableTopAxis:mi,topAxisEnabled:ki,setAxisFormat:ri,getAxisFormat:ai,setTickInterval:oi,getTickInterval:ci,setTodayMarker:li,getTodayMarker:ui,setAccTitle:ue,getAccTitle:de,setDiagramTitle:me,getDiagramTitle:ke,setDiagramId:si,setDisplayMode:yi,getDisplayMode:pi,setAccDescription:fe,getAccDescription:he,addSection:_i,getSections:Di,getTasks:Si,addTask:Ii,findTaskById:ct,addTaskOrg:Ai,setIncludes:xi,getIncludes:bi,setExcludes:Ti,getExcludes:vi,setClickEvent:Wi,setLink:Oi,getLinks:wi,bindFunctions:Pi,parseDuration:je,isInvalidDate:Re,setWeekday:Ci,getWeekday:Mi,setWeekend:Ei};function qe(t,i,a){let r=!0;for(;r;)r=!1,a.forEach(function(s){let u="^\\s*"+s+"\\s*$",x=new RegExp(u);t[0].match(x)&&(i[s]=!0,t.shift(1),r=!0)})}o(qe,"getTaskTags");var mt=ot(ae(),1),Je=ot(Qe(),1);mt.default.extend(Je.default);var Vi=o(function(){et.debug("Something is calling, setConf, remove the call")},"setConf"),Ke={monday:we,tuesday:_e,wednesday:De,thursday:Se,friday:Ce,saturday:Me,sunday:ve},Ni=o((t,i)=>{let a=[...t].map(()=>-1/0),r=[...t].sort((u,x)=>u.startTime-x.startTime||u.order-x.order),s=0;for(let u of r)for(let x=0;x<a.length;x++)if(u.startTime>=a[x]){a[x]=u.endTime,u.order=x+i,x>s&&(s=x);break}return s},"getMaxIntersections"),it,se=1e4,zi=o(function(t,i,a,r){let s=nt().gantt;r.db.setDiagramId(i);let u=nt().securityLevel,x;u==="sandbox"&&(x=pt("#i"+i));let D=u==="sandbox"?pt(x.nodes()[0].contentDocument.body):pt("body"),S=u==="sandbox"?x.nodes()[0].contentDocument:document,P=S.getElementById(i);it=P.parentElement.offsetWidth,it===void 0&&(it=1200),s.useWidth!==void 0&&(it=s.useWidth);let C=r.db.getTasks(),W=[];for(let f of C)W.push(f.type);W=I(W);let R={},z=2*s.topPadding;if(r.db.getDisplayMode()==="compact"||s.displayMode==="compact"){let f={};for(let p of C)f[p.section]===void 0?f[p.section]=[p]:f[p.section].push(p);let y=0;for(let p of Object.keys(f)){let T=Ni(f[p],y)+1;y+=T,z+=T*(s.barHeight+s.barGap),R[p]=T}}else{z+=C.length*(s.barHeight+s.barGap);for(let f of W)R[f]=C.filter(y=>y.type===f).length}P.setAttribute("viewBox","0 0 "+it+" "+z);let v=D.select(`[id="${i}"]`),k=Ee().domain([pe(C,function(f){return f.startTime}),ye(C,function(f){return f.endTime})]).rangeRound([0,it-s.leftPadding-s.rightPadding]);function O(f,y){let p=f.startTime,T=y.startTime,g=0;return p>T?g=1:p<T&&(g=-1),g}o(O,"taskCompare"),C.sort(O),L(C,it,z),ce(v,z,it,s.useMaxWidth),v.append("text").text(r.db.getDiagramTitle()).attr("x",it/2).attr("y",s.titleTopMargin).attr("class","titleText");function L(f,y,p){let T=s.barHeight,g=T+s.barGap,c=s.topPadding,l=s.leftPadding,h=Te().domain([0,W.length]).range(["#00B9FA","#F95002"]).interpolate(be);X(g,c,l,y,p,f,r.db.getExcludes(),r.db.getIncludes()),b(l,c,y,p),G(f,g,c,l,T,h,y,p),d(g,c,l,T,h),M(l,c,y,p)}o(L,"makeGantt");function G(f,y,p,T,g,c,l){f.sort((e,_)=>e.vert===_.vert?0:e.vert?1:-1);let m=[...new Set(f.map(e=>e.order))].map(e=>f.find(_=>_.order===e));v.append("g").selectAll("rect").data(m).enter().append("rect").attr("x",0).attr("y",function(e,_){return _=e.order,_*y+p-2}).attr("width",function(){return l-s.rightPadding/2}).attr("height",y).attr("class",function(e){for(let[_,A]of W.entries())if(e.type===A)return"section section"+_%s.numberSectionStyles;return"section section0"}).enter();let w=v.append("g").selectAll("rect").data(f).enter(),n=r.db.getLinks();if(w.append("rect").attr("id",function(e){return i+"-"+e.id}).attr("rx",3).attr("ry",3).attr("x",function(e){return e.milestone?k(e.startTime)+T+.5*(k(e.endTime)-k(e.startTime))-.5*g:k(e.startTime)+T}).attr("y",function(e,_){return _=e.order,e.vert?s.gridLineStartPadding:_*y+p}).attr("width",function(e){return e.milestone?g:e.vert?.08*g:k(e.renderEndTime||e.endTime)-k(e.startTime)}).attr("height",function(e){return e.vert?C.length*(s.barHeight+s.barGap)+s.barHeight*2:g}).attr("transform-origin",function(e,_){return _=e.order,(k(e.startTime)+T+.5*(k(e.endTime)-k(e.startTime))).toString()+"px "+(_*y+p+.5*g).toString()+"px"}).attr("class",function(e){let _="task",A="";e.classes.length>0&&(A=e.classes.join(" "));let $=0;for(let[H,V]of W.entries())e.type===V&&($=H%s.numberSectionStyles);let Y="";return e.active?e.crit?Y+=" activeCrit":Y=" active":e.done?e.crit?Y=" doneCrit":Y=" done":e.crit&&(Y+=" crit"),Y.length===0&&(Y=" task"),e.milestone&&(Y=" milestone "+Y),e.vert&&(Y=" vert "+Y),Y+=$,Y+=" "+A,_+Y}),w.append("text").attr("id",function(e){return i+"-"+e.id+"-text"}).text(function(e){return e.task}).attr("font-size",s.fontSize).attr("x",function(e){let _=k(e.startTime),A=k(e.renderEndTime||e.endTime);if(e.milestone&&(_+=.5*(k(e.endTime)-k(e.startTime))-.5*g,A=_+g),e.vert)return k(e.startTime)+T;let $=this.getBBox().width;return $>A-_?A+$+1.5*s.leftPadding>l?_+T-5:A+T+5:(A-_)/2+_+T}).attr("y",function(e,_){return e.vert?s.gridLineStartPadding+C.length*(s.barHeight+s.barGap)+60:(_=e.order,_*y+s.barHeight/2+(s.fontSize/2-2)+p)}).attr("text-height",g).attr("class",function(e){let _=k(e.startTime),A=k(e.endTime);e.milestone&&(A=_+g);let $=this.getBBox().width,Y="";e.classes.length>0&&(Y=e.classes.join(" "));let H=0;for(let[N,U]of W.entries())e.type===U&&(H=N%s.numberSectionStyles);let V="";return e.active&&(e.crit?V="activeCritText"+H:V="activeText"+H),e.done?e.crit?V=V+" doneCritText"+H:V=V+" doneText"+H:e.crit&&(V=V+" critText"+H),e.milestone&&(V+=" milestoneText"),e.vert&&(V+=" vertText"),$>A-_?A+$+1.5*s.leftPadding>l?Y+" taskTextOutsideLeft taskTextOutside"+H+" "+V:Y+" taskTextOutsideRight taskTextOutside"+H+" "+V+" width-"+$:Y+" taskText taskText"+H+" "+V+" width-"+$}),nt().securityLevel==="sandbox"){let e;e=pt("#i"+i);let _=e.nodes()[0].contentDocument;w.filter(function(A){return n.has(A.id)}).each(function(A){var $=_.querySelector("#"+CSS.escape(i+"-"+A.id)),Y=_.querySelector("#"+CSS.escape(i+"-"+A.id+"-text"));let H=$.parentNode;var V=_.createElement("a");V.setAttribute("xlink:href",n.get(A.id)),V.setAttribute("target","_top"),H.appendChild(V),V.appendChild($),V.appendChild(Y)})}}o(G,"drawRects");function X(f,y,p,T,g,c,l,h){if(l.length===0&&h.length===0)return;let m,w;for(let{startTime:$,endTime:Y}of c)(m===void 0||$<m)&&(m=$),(w===void 0||Y>w)&&(w=Y);if(!m||!w)return;if((0,mt.default)(w).diff((0,mt.default)(m),"year")>5){et.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}let n=r.db.getDateFormat(),F=[],e=null,_=(0,mt.default)(m);for(;_.valueOf()<=w;)r.db.isInvalidDate(_,n,l,h)?e?e.end=_:e={start:_,end:_}:e&&(F.push(e),e=null),_=_.add(1,"d");v.append("g").selectAll("rect").data(F).enter().append("rect").attr("id",$=>i+"-exclude-"+$.start.format("YYYY-MM-DD")).attr("x",$=>k($.start.startOf("day"))+p).attr("y",s.gridLineStartPadding).attr("width",$=>k($.end.endOf("day"))-k($.start.startOf("day"))).attr("height",g-y-s.gridLineStartPadding).attr("transform-origin",function($,Y){return(k($.start)+p+.5*(k($.end)-k($.start))).toString()+"px "+(Y*f+.5*g).toString()+"px"}).attr("class","exclude-range")}o(X,"drawExcludeDays");function E(f,y,p,T){if(p<=0||f>y)return 1/0;let g=y-f,c=mt.default.duration({[T??"day"]:p}).asMilliseconds();return c<=0?1/0:Math.ceil(g/c)}o(E,"getEstimatedTickCount");function b(f,y,p,T){let g=r.db.getDateFormat(),c=r.db.getAxisFormat(),l;c?l=c:g==="D"?l="%d":l=s.axisFormat??"%Y-%m-%d";let h=xe(k).tickSize(-T+y+s.gridLineStartPadding).tickFormat(Ft(l)),w=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(r.db.getTickInterval()||s.tickInterval);if(w!==null){let n=parseInt(w[1],10);if(isNaN(n)||n<=0)et.warn(`Invalid tick interval value: "${w[1]}". Skipping custom tick interval.`);else{let F=w[2],e=r.db.getWeekday()||s.weekday,_=k.domain(),A=_[0],$=_[1],Y=E(A,$,n,F);if(Y>se)et.warn(`The tick interval "${n}${F}" would generate ${Y} ticks, which exceeds the maximum allowed (${se}). This may indicate an invalid date or time range. Skipping custom tick interval.`);else switch(F){case"millisecond":h.ticks($t.every(n));break;case"second":h.ticks(Yt.every(n));break;case"minute":h.ticks(Lt.every(n));break;case"hour":h.ticks(It.every(n));break;case"day":h.ticks(At.every(n));break;case"week":h.ticks(Ke[e].every(n));break;case"month":h.ticks(Ot.every(n));break}}}if(v.append("g").attr("class","grid").attr("transform","translate("+f+", "+(T-50)+")").call(h).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),r.db.topAxisEnabled()||s.topAxis){let n=ge(k).tickSize(-T+y+s.gridLineStartPadding).tickFormat(Ft(l));if(w!==null){let F=parseInt(w[1],10);if(isNaN(F)||F<=0)et.warn(`Invalid tick interval value: "${w[1]}". Skipping custom tick interval.`);else{let e=w[2],_=r.db.getWeekday()||s.weekday,A=k.domain(),$=A[0],Y=A[1];if(E($,Y,F,e)<=se)switch(e){case"millisecond":n.ticks($t.every(F));break;case"second":n.ticks(Yt.every(F));break;case"minute":n.ticks(Lt.every(F));break;case"hour":n.ticks(It.every(F));break;case"day":n.ticks(At.every(F));break;case"week":n.ticks(Ke[_].every(F));break;case"month":n.ticks(Ot.every(F));break}}}v.append("g").attr("class","grid").attr("transform","translate("+f+", "+y+")").call(n).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}o(b,"makeGrid");function d(f,y){let p=0,T=Object.keys(R).map(g=>[g,R[g]]);v.append("g").selectAll("text").data(T).enter().append(function(g){let c=g[0].split(oe.lineBreakRegex),l=-(c.length-1)/2,h=S.createElementNS("http://www.w3.org/2000/svg","text");h.setAttribute("dy",l+"em");for(let[m,w]of c.entries()){let n=S.createElementNS("http://www.w3.org/2000/svg","tspan");n.setAttribute("alignment-baseline","central"),n.setAttribute("x","10"),m>0&&n.setAttribute("dy","1em"),n.textContent=w,h.appendChild(n)}return h}).attr("x",10).attr("y",function(g,c){if(c>0)for(let l=0;l<c;l++)return p+=T[c-1][1],g[1]*f/2+p*f+y;else return g[1]*f/2+y}).attr("font-size",s.sectionFontSize).attr("class",function(g){for(let[c,l]of W.entries())if(g[0]===l)return"sectionTitle sectionTitle"+c%s.numberSectionStyles;return"sectionTitle"})}o(d,"vertLabels");function M(f,y,p,T){let g=r.db.getTodayMarker();if(g==="off")return;let c=v.append("g").attr("class","today"),l=new Date,h=c.append("line");h.attr("x1",k(l)+f).attr("x2",k(l)+f).attr("y1",s.titleTopMargin).attr("y2",T-s.titleTopMargin).attr("class","today"),g!==""&&h.attr("style",g.replace(/,/g,";"))}o(M,"drawToday");function I(f){let y={},p=[];for(let T=0,g=f.length;T<g;++T)Object.prototype.hasOwnProperty.call(y,f[T])||(y[f[T]]=!0,p.push(f[T]));return p}o(I,"checkUnique")},"draw"),ti={setConf:Vi,draw:zi};var Ri=o(t=>`
  .mermaid-main-font {
        font-family: ${t.fontFamily};
  }

  .exclude-range {
    fill: ${t.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${t.sectionBkgColor};
  }

  .section2 {
    fill: ${t.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${t.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${t.titleColor};
  }

  .sectionTitle1 {
    fill: ${t.titleColor};
  }

  .sectionTitle2 {
    fill: ${t.titleColor};
  }

  .sectionTitle3 {
    fill: ${t.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: ${t.fontFamily};
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${t.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${t.fontFamily};
    fill: ${t.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${t.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideRight {
    fill: ${t.taskTextDarkColor};
    text-anchor: start;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideLeft {
    fill: ${t.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${t.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${t.taskBkgColor};
    stroke: ${t.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${t.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${t.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${t.activeTaskBkgColor};
    stroke: ${t.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${t.doneTaskBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  /* Done task text displayed outside the bar sits against the diagram background,
     not against the done-task bar, so it must use the outside/contrast color. */
  .doneText0.taskTextOutsideLeft,
  .doneText0.taskTextOutsideRight,
  .doneText1.taskTextOutsideLeft,
  .doneText1.taskTextOutsideRight,
  .doneText2.taskTextOutsideLeft,
  .doneText2.taskTextOutsideRight,
  .doneText3.taskTextOutsideLeft,
  .doneText3.taskTextOutsideRight {
    fill: ${t.taskTextOutsideColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  /* Done-crit task text outside the bar \u2014 same reasoning as doneText above. */
  .doneCritText0.taskTextOutsideLeft,
  .doneCritText0.taskTextOutsideRight,
  .doneCritText1.taskTextOutsideLeft,
  .doneCritText1.taskTextOutsideRight,
  .doneCritText2.taskTextOutsideLeft,
  .doneCritText2.taskTextOutsideRight,
  .doneCritText3.taskTextOutsideLeft,
  .doneCritText3.taskTextOutsideRight {
    fill: ${t.taskTextOutsideColor} !important;
  }

  .vert {
    stroke: ${t.vertLineColor};
  }

  .vertText {
    font-size: 15px;
    text-anchor: middle;
    fill: ${t.vertLineColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${t.titleColor||t.textColor};
    font-family: ${t.fontFamily};
  }
`,"getStyles"),ei=Ri;var kn={parser:Ye,db:Ze,renderer:ti,styles:ei};export{kn as diagram};
