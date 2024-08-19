import { AnySpriteData, SlotSprite } from './SlotItem';
import { PixiNode } from './PixiInterface';


export type TileSlotData = {
    terrain  ?:AnySpriteData;
    furniture?:AnySpriteData;
}
export type TileSlotPos = {
    tileX:number;
    tileY:number;
    chunkX:number;
    chunkY:number;
    tileWidth:number;
    tileHeight:number;
};
type TileSlotProps = {
    pos:TileSlotPos;
    data?:TileSlotData;
};
export class TileSlot extends PixiNode<TileSlot,SlotSprite,TileSlotData>{
    pos:TileSlotPos;
    constructor(props: TileSlotProps) {
        const {data,pos} = props;
        const fixedData = data??{};
        super(fixedData);
        this.pos=pos;
        this.init(pos);
    }
    init(pos:TileSlotPos){
        const td = this.dataTable.terrain;
        if(td!==undefined){
            const terrain = new SlotSprite(td,pos);
            this.setChild('terrain',terrain);
        }
        //console.log(this.node.children);
        const fd = this.dataTable.furniture;
        if(fd!==undefined){
            const furniture = new SlotSprite(fd,pos);
            this.setChild('furniture',furniture);
        }

        this.node.x = pos.tileX * pos.tileWidth;
        this.node.y = pos.tileY * pos.tileHeight;
    }
    getPos(){
        return this.pos;
    }
}
