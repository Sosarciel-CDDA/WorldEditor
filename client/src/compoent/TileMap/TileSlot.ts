import { AnySpriteData, SlotTerrain } from './SlotItem';
import { PixiNode } from './PixiInterface';


export type TileSlotData = {
    terrain?:AnySpriteData;
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
export class TileSlot extends PixiNode<TileSlot,SlotTerrain,TileSlotData>{
    pos:TileSlotPos;
    constructor(props: TileSlotProps) {
        const {data,pos} = props;
        const fixedData = data??{};
        super(fixedData);
        this.pos=pos;
        this.init(pos);
    }
    init(pos:TileSlotPos){
        const terrain = new SlotTerrain(this.dataTable.terrain,pos);
        this.setChild('terrain',terrain);
        //console.log(this.node.children);

        this.node.x = pos.tileX * pos.tileWidth;
        this.node.y = pos.tileY * pos.tileHeight;
    }
    getPos(){
        return this.pos;
    }
}
