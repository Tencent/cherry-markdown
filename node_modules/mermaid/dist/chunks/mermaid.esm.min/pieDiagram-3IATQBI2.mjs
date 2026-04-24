import{a as Q}from"./chunk-AEOMTBSW.mjs";import{a as K}from"./chunk-DKKBVRCY.mjs";import"./chunk-DU5LTGQ6.mjs";import"./chunk-6NTNNK5N.mjs";import"./chunk-RNJOYNJ4.mjs";import"./chunk-XGPFEOL4.mjs";import"./chunk-A34GCYZU.mjs";import"./chunk-W7ZLLLMY.mjs";import"./chunk-WSB5WSVC.mjs";import"./chunk-DJ7UZH7F.mjs";import{a as Y}from"./chunk-267PNR3T.mjs";import{k as H,l as J}from"./chunk-2HR5LOFI.mjs";import"./chunk-XBXGYYE5.mjs";import{N as W,Q as _,R as z,S as L,T as I,U as N,V as q,W as V,Y as U,j as M}from"./chunk-5YUVU3PZ.mjs";import{F as w,I as Z,b as p,m as X}from"./chunk-MGPAVIPZ.mjs";import"./chunk-TYMNRAUI.mjs";import"./chunk-FXACKDTF.mjs";import"./chunk-H3VCZNTA.mjs";import"./chunk-QU3B7NT4.mjs";import"./chunk-JIN56HTB.mjs";import{a as r}from"./chunk-VELTKBKT.mjs";var ee=M.pie,C={sections:new Map,showData:!1,config:ee},D=C.sections,A=C.showData,ue=structuredClone(ee),Se=r(()=>structuredClone(ue),"getConfig"),he=r(()=>{D=new Map,A=C.showData,_()},"clear"),ye=r(({label:e,value:i})=>{if(i<0)throw new Error(`"${e}" has invalid value: ${i}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);D.has(e)||(D.set(e,i),p.debug(`added new section: ${e}, with value: ${i}`))},"addSection"),xe=r(()=>D,"getSections"),Pe=r(e=>{A=e},"setShowData"),we=r(()=>A,"getShowData"),u={getConfig:Se,clear:he,setDiagramTitle:q,getDiagramTitle:V,setAccTitle:z,getAccTitle:L,setAccDescription:I,getAccDescription:N,addSection:ye,getSections:xe,setShowData:Pe,getShowData:we};var Ce=r((e,i)=>{Q(e,i),i.setShowData(e.showData),e.sections.map(i.addSection)},"populateDb"),te={parse:r(async e=>{let i=await K("pie",e);p.debug(i),Ce(i,u)},"parse")};var Ae=r(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),ie=Ae;var Te=r(e=>{let i=[...e.values()].reduce((n,s)=>n+s,0),T=[...e.entries()].map(([n,s])=>({label:n,value:s})).filter(n=>n.value/i*100>=1);return Z().value(n=>n.value).sort(null)(T)},"createPieArcs"),ve=r((e,i,T,v)=>{p.debug(`rendering pie chart
`+e);let n=v.db,s=U(),$=J(n.getConfig(),s.pie),b=40,a=18,d=4,c=450,m=c,S=Y(i),l=S.append("g");l.attr("transform","translate("+m/2+","+c/2+")");let{themeVariables:o}=s,[R]=H(o.pieOuterStrokeWidth);R??=2;let E=$.textPosition,f=Math.min(m,c)/2-b,oe=w().innerRadius(0).outerRadius(f),ne=w().innerRadius(f*E).outerRadius(f*E);l.append("circle").attr("cx",0).attr("cy",0).attr("r",f+R/2).attr("class","pieOuterCircle");let g=n.getSections(),ae=Te(g),se=[o.pie1,o.pie2,o.pie3,o.pie4,o.pie5,o.pie6,o.pie7,o.pie8,o.pie9,o.pie10,o.pie11,o.pie12],h=0;g.forEach(t=>{h+=t});let k=ae.filter(t=>(t.data.value/h*100).toFixed(0)!=="0"),y=X(se).domain([...g.keys()]);l.selectAll("mySlices").data(k).enter().append("path").attr("d",oe).attr("fill",t=>y(t.data.label)).attr("class","pieCircle"),l.selectAll("mySlices").data(k).enter().append("text").text(t=>(t.data.value/h*100).toFixed(0)+"%").attr("transform",t=>"translate("+ne.centroid(t)+")").style("text-anchor","middle").attr("class","slice");let ce=l.append("text").text(n.getDiagramTitle()).attr("x",0).attr("y",-(c-50)/2).attr("class","pieTitleText"),G=[...g.entries()].map(([t,P])=>({label:t,value:P})),x=l.selectAll(".legend").data(G).enter().append("g").attr("class","legend").attr("transform",(t,P)=>{let j=a+d,fe=j*G.length/2,ge=12*a,De=P*j-fe;return"translate("+ge+","+De+")"});x.append("rect").attr("width",a).attr("height",a).style("fill",t=>y(t.label)).style("stroke",t=>y(t.label)),x.append("text").attr("x",a+d).attr("y",a-d).text(t=>n.getShowData()?`${t.label} [${t.value}]`:t.label);let le=Math.max(...x.selectAll("text").nodes().map(t=>t?.getBoundingClientRect().width??0)),pe=m+b+a+d+le,B=ce.node()?.getBoundingClientRect().width??0,me=m/2-B/2,de=m/2+B/2,F=Math.min(0,me),O=Math.max(pe,de)-F;S.attr("viewBox",`${F} 0 ${O} ${c}`),W(S,c,O,$.useMaxWidth)},"draw"),re={draw:ve};var Ye={parser:te,db:u,renderer:re,styles:ie};export{Ye as diagram};
