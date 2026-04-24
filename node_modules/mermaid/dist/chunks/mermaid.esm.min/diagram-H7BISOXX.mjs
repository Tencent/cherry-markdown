import{a as V}from"./chunk-AEOMTBSW.mjs";import{a as j}from"./chunk-DKKBVRCY.mjs";import"./chunk-DU5LTGQ6.mjs";import"./chunk-6NTNNK5N.mjs";import"./chunk-RNJOYNJ4.mjs";import"./chunk-XGPFEOL4.mjs";import"./chunk-A34GCYZU.mjs";import"./chunk-W7ZLLLMY.mjs";import"./chunk-WSB5WSVC.mjs";import"./chunk-DJ7UZH7F.mjs";import{a as P}from"./chunk-267PNR3T.mjs";import{l as R}from"./chunk-2HR5LOFI.mjs";import"./chunk-XBXGYYE5.mjs";import{N as A,Q as S,R as w,S as M,T as O,U as G,V as L,W as T,h as D,j as v,s as C}from"./chunk-5YUVU3PZ.mjs";import{b as $}from"./chunk-MGPAVIPZ.mjs";import"./chunk-TYMNRAUI.mjs";import"./chunk-FXACKDTF.mjs";import"./chunk-H3VCZNTA.mjs";import"./chunk-QU3B7NT4.mjs";import"./chunk-JIN56HTB.mjs";import{a as i}from"./chunk-VELTKBKT.mjs";var f={showLegend:!0,ticks:5,max:null,min:0,graticule:"circle"},k={axes:[],curves:[],options:f},g=structuredClone(k),q=v.radar,W=i(()=>R({...q,...C().radar}),"getConfig"),E=i(()=>g.axes,"getAxes"),H=i(()=>g.curves,"getCurves"),N=i(()=>g.options,"getOptions"),U=i(e=>{g.axes=e.map(t=>({name:t.name,label:t.label??t.name}))},"setAxes"),X=i(e=>{g.curves=e.map(t=>({name:t.name,label:t.label??t.name,entries:Y(t.entries)}))},"setCurves"),Y=i(e=>{if(e[0].axis==null)return e.map(r=>r.value);let t=E();if(t.length===0)throw new Error("Axes must be populated before curves for reference entries");return t.map(r=>{let a=e.find(o=>o.axis?.$refText===r.name);if(a===void 0)throw new Error("Missing entry for axis "+r.label);return a.value})},"computeCurveEntries"),Z=i(e=>{let t=e.reduce((r,a)=>(r[a.name]=a,r),{});g.options={showLegend:t.showLegend?.value??f.showLegend,ticks:t.ticks?.value??f.ticks,max:t.max?.value??f.max,min:t.min?.value??f.min,graticule:t.graticule?.value??f.graticule}},"setOptions"),J=i(()=>{S(),g=structuredClone(k)},"clear"),x={getAxes:E,getCurves:H,getOptions:N,setAxes:U,setCurves:X,setOptions:Z,getConfig:W,clear:J,setAccTitle:w,getAccTitle:M,setDiagramTitle:L,getDiagramTitle:T,getAccDescription:G,setAccDescription:O};var K=i(e=>{V(e,x);let{axes:t,curves:r,options:a}=e;x.setAxes(t),x.setCurves(r),x.setOptions(a)},"populate"),I={parse:i(async e=>{let t=await j("radar",e);$.debug(t),K(t)},"parse")};var Q=i((e,t,r,a)=>{let o=a.db,s=o.getAxes(),m=o.getCurves(),n=o.getOptions(),l=o.getConfig(),c=o.getDiagramTitle(),d=P(t),p=tt(d,l),u=n.max??Math.max(...m.map(b=>Math.max(...b.entries))),h=n.min,y=Math.min(l.width,l.height)/2;rt(p,s,y,n.ticks,n.graticule),et(p,s,y,l),at(p,s,m,h,u,n.graticule,l),it(p,m,n.showLegend,l),p.append("text").attr("class","radarTitle").text(c).attr("x",0).attr("y",-l.height/2-l.marginTop)},"draw"),tt=i((e,t)=>{let r=t.width+t.marginLeft+t.marginRight,a=t.height+t.marginTop+t.marginBottom,o={x:t.marginLeft+t.width/2,y:t.marginTop+t.height/2};return A(e,a,r,t.useMaxWidth??!0),e.attr("viewBox",`0 0 ${r} ${a}`),e.append("g").attr("transform",`translate(${o.x}, ${o.y})`)},"drawFrame"),rt=i((e,t,r,a,o)=>{if(o==="circle")for(let s=0;s<a;s++){let m=r*(s+1)/a;e.append("circle").attr("r",m).attr("class","radarGraticule")}else if(o==="polygon"){let s=t.length;for(let m=0;m<a;m++){let n=r*(m+1)/a,l=t.map((c,d)=>{let p=2*d*Math.PI/s-Math.PI/2,u=n*Math.cos(p),h=n*Math.sin(p);return`${u},${h}`}).join(" ");e.append("polygon").attr("points",l).attr("class","radarGraticule")}}},"drawGraticule"),et=i((e,t,r,a)=>{let o=t.length;for(let s=0;s<o;s++){let m=t[s].label,n=2*s*Math.PI/o-Math.PI/2;e.append("line").attr("x1",0).attr("y1",0).attr("x2",r*a.axisScaleFactor*Math.cos(n)).attr("y2",r*a.axisScaleFactor*Math.sin(n)).attr("class","radarAxisLine"),e.append("text").text(m).attr("x",r*a.axisLabelFactor*Math.cos(n)).attr("y",r*a.axisLabelFactor*Math.sin(n)).attr("class","radarAxisLabel")}},"drawAxes");function at(e,t,r,a,o,s,m){let n=t.length,l=Math.min(m.width,m.height)/2;r.forEach((c,d)=>{if(c.entries.length!==n)return;let p=c.entries.map((u,h)=>{let y=2*Math.PI*h/n-Math.PI/2,b=ot(u,a,o,l),_=b*Math.cos(y),z=b*Math.sin(y);return{x:_,y:z}});s==="circle"?e.append("path").attr("d",nt(p,m.curveTension)).attr("class",`radarCurve-${d}`):s==="polygon"&&e.append("polygon").attr("points",p.map(u=>`${u.x},${u.y}`).join(" ")).attr("class",`radarCurve-${d}`)})}i(at,"drawCurves");function ot(e,t,r,a){let o=Math.min(Math.max(e,t),r);return a*(o-t)/(r-t)}i(ot,"relativeRadius");function nt(e,t){let r=e.length,a=`M${e[0].x},${e[0].y}`;for(let o=0;o<r;o++){let s=e[(o-1+r)%r],m=e[o],n=e[(o+1)%r],l=e[(o+2)%r],c={x:m.x+(n.x-s.x)*t,y:m.y+(n.y-s.y)*t},d={x:n.x-(l.x-m.x)*t,y:n.y-(l.y-m.y)*t};a+=` C${c.x},${c.y} ${d.x},${d.y} ${n.x},${n.y}`}return`${a} Z`}i(nt,"closedRoundCurve");function it(e,t,r,a){if(!r)return;let o=(a.width/2+a.marginRight)*3/4,s=-(a.height/2+a.marginTop)*3/4,m=20;t.forEach((n,l)=>{let c=e.append("g").attr("transform",`translate(${o}, ${s+l*m})`);c.append("rect").attr("width",12).attr("height",12).attr("class",`radarLegendBox-${l}`),c.append("text").attr("x",16).attr("y",0).attr("class","radarLegendText").text(n.label)})}i(it,"drawLegend");var F={draw:Q};var st=i((e,t)=>{let r="";for(let a=0;a<e.THEME_COLOR_LIMIT;a++){let o=e[`cScale${a}`];r+=`
		.radarCurve-${a} {
			color: ${o};
			fill: ${o};
			fill-opacity: ${t.curveOpacity};
			stroke: ${o};
			stroke-width: ${t.curveStrokeWidth};
		}
		.radarLegendBox-${a} {
			fill: ${o};
			fill-opacity: ${t.curveOpacity};
			stroke: ${o};
		}
		`}return r},"genIndexStyles"),mt=i(e=>{let t=D(),r=C(),a=R(t,r.themeVariables),o=R(a.radar,e);return{themeVariables:a,radarOptions:o}},"buildRadarStyleOptions"),B=i(({radar:e}={})=>{let{themeVariables:t,radarOptions:r}=mt(e);return`
	.radarTitle {
		font-size: ${t.fontSize};
		color: ${t.titleColor};
		dominant-baseline: hanging;
		text-anchor: middle;
	}
	.radarAxisLine {
		stroke: ${r.axisColor};
		stroke-width: ${r.axisStrokeWidth};
	}
	.radarAxisLabel {
		dominant-baseline: middle;
		text-anchor: middle;
		font-size: ${r.axisLabelFontSize}px;
		color: ${r.axisColor};
	}
	.radarGraticule {
		fill: ${r.graticuleColor};
		fill-opacity: ${r.graticuleOpacity};
		stroke: ${r.graticuleColor};
		stroke-width: ${r.graticuleStrokeWidth};
	}
	.radarLegendText {
		text-anchor: start;
		font-size: ${r.legendFontSize}px;
		dominant-baseline: hanging;
	}
	${st(t,r)}
	`},"styles");var Vt={parser:I,db:x,renderer:F,styles:B};export{Vt as diagram};
