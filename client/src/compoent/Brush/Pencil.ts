import { BrushSharedData } from ".";
import { CanvasPanelData } from "../CanvasPanel";
import { InitData } from "../GlobalContext";
import { BrushProps } from "./BrushInterface";





export function Pencil(props:BrushProps){
    const {event,map,vp,canvas} = props;
    const {inLeftDown} = canvas.getData();
    if(inLeftDown!==true) return;
    const {x,y} = vp.toWorld(event.clientX, event.clientY);
    //console.log(x,y);
    const odat = map.getSlotByWorldPos(x,y)?.getDataTable();
    const bid = BrushSharedData.brushSlot=="null" ? undefined
        : BrushSharedData.brushSlot ?? undefined;
    if(bid==null && odat?.terrain?.tileId==undefined){
        map.setSlotByWorldPos(undefined,x,y);
        return;
    }
    const ndat = bid == undefined ? undefined : InitData.tilesetData.table[bid];
    if(odat?.terrain?.tileId != ndat?.tileId)
        map.setSlotByWorldPos({terrain:ndat},x,y);
}