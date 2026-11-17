import zipfile, html, sys
from xml.dom.minidom import parseString
EMU=914400.0; PX=100.0
A="http://schemas.openxmlformats.org/drawingml/2006/main"
P="http://schemas.openxmlformats.org/presentationml/2006/main"
def kids(n,name): return [c for c in n.childNodes if c.nodeType==1 and c.tagName.endswith(":"+name)]
def kid(n,name):
    k=kids(n,name); return k[0] if k else None
def deep(n,name): return n.getElementsByTagNameNS(A,name)
def color_of(node):
    if node is None: return None
    c=deep(node,"srgbClr")
    if not c: return None
    v=c[0].getAttribute("val")
    al=c[0].getElementsByTagNameNS(A,"alpha")
    a=int(al[0].getAttribute("val"))/100000.0 if al else 1.0
    return "#%s"%v, a
def render(zf,path):
    doc=parseString(zf.read(path)); out=[]
    for sp in doc.getElementsByTagNameNS(P,"sp"):
        spPr=kid(sp,"spPr")
        if spPr is None: continue
        xfrm=kid(spPr,"xfrm")
        if xfrm is None: continue
        off,ext=kid(xfrm,"off"),kid(xfrm,"ext")
        if off is None or ext is None: continue
        x=float(off.getAttribute("x"))/EMU*PX; y=float(off.getAttribute("y"))/EMU*PX
        w=float(ext.getAttribute("cx"))/EMU*PX; h=float(ext.getAttribute("cy"))/EMU*PX
        geom=kid(spPr,"prstGeom"); prst=geom.getAttribute("prst") if geom else "rect"
        radius="14px" if prst=="roundRect" else "0"
        fill=color_of(kid(spPr,"solidFill"))
        ln=kid(spPr,"ln"); lncol=color_of(kid(ln,"solidFill")) if ln is not None else None
        lnw=float(ln.getAttribute("w"))/12700.0 if (ln is not None and ln.getAttribute("w")) else 1.0
        dash=ln is not None and deep(ln,"prstDash")
        st=[f"left:{x:.1f}px",f"top:{y:.1f}px",f"width:{w:.1f}px",f"height:{h:.1f}px",f"border-radius:{radius}"]
        if fill: st.append(f"background:{fill[0]};opacity:{fill[1]:.2f}" if fill[1]<1 else f"background:{fill[0]}")
        if lncol: st.append(f"border:{lnw:.1f}px {'dashed' if dash else 'solid'} {lncol[0]}")
        tx=kid(sp,"txBody"); inner=""
        if tx is not None:
            bodyPr=kid(tx,"bodyPr")
            anchor=bodyPr.getAttribute("anchor") if bodyPr is not None else ""
            ins=bodyPr.getAttribute("lIns") if bodyPr is not None else ""
            pad="0" if ins=="0" else "7px 9px"
            paras=[]
            for p in kids(tx,"p"):
                pPr=kid(p,"pPr"); algn=pPr.getAttribute("algn") if pPr is not None else ""
                al={"ctr":"center","r":"right"}.get(algn,"left"); runs=[]
                for r in kids(p,"r"):
                    rPr=kid(r,"rPr"); t=kid(r,"t")
                    txt=html.escape(t.firstChild.nodeValue) if (t and t.firstChild) else ""
                    sz=float(rPr.getAttribute("sz"))/100.0 if (rPr is not None and rPr.getAttribute("sz")) else 18.0
                    b=rPr is not None and rPr.getAttribute("b")=="1"
                    col=color_of(rPr) if rPr is not None else None
                    sp_=f"font-size:{sz*PX/72:.1f}px;{'font-weight:800;' if b else ''}"
                    if col: sp_+=f"color:{col[0]};"
                    runs.append(f"<span style='{sp_}'>{txt}</span>")
                if runs: paras.append(f"<div style='text-align:{al}'>{''.join(runs)}</div>")
            if paras:
                just={"ctr":"center","b":"flex-end"}.get(anchor,"flex-start")
                inner=(f"<div class='tx' style='padding:{pad};justify-content:{just}'>"+"".join(paras)+"</div>")
        out.append(f"<div class='sp' style='{';'.join(st)}'>{inner}</div>")
    return "".join(out)
zf=zipfile.ZipFile(sys.argv[1])
slides=sorted([n for n in zf.namelist() if n.startswith("ppt/slides/slide") and n.endswith(".xml")],
              key=lambda n:int("".join(ch for ch in n.split("/")[-1] if ch.isdigit())))
body=[f"<div class='wrap'><div class='no'>投影片 {i}</div><div class='slide'>{render(zf,s)}</div></div>" for i,s in enumerate(slides,1)]
open("preview.html","w",encoding="utf-8").write(f"""<!doctype html><meta charset="utf-8">
<style>body{{margin:0;background:#555;font-family:"PingFang TC",sans-serif}}
.wrap{{margin:18px auto;width:1333px}}.no{{color:#fff;font:700 13px/1.6 monospace;padding:2px 0}}
.slide{{position:relative;width:1333px;height:750px;overflow:hidden;background:#07211A;outline:2px solid #000}}
.sp{{position:absolute;box-sizing:border-box}}
.tx{{position:absolute;inset:0;display:flex;flex-direction:column;box-sizing:border-box;line-height:1.25;white-space:pre-wrap;word-break:break-word}}
</style>{''.join(body)}""")
print("投影片數:",len(slides),"→ preview.html")
