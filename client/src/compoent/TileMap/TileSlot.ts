import { SpriteData } from '@/src/static/TilesetLoader';
import * as PIXI from 'pixi.js';
import { GVar } from '../GlobalContext';
import { PixiObject } from './ZoneMap';



async function loadTextureAsset(fp:string){
    GVar.textureAssetTemp ??= {};
    if(GVar.textureAssetTemp[fp]!=null) return GVar.textureAssetTemp[fp];
    GVar.textureAssetTemp[fp] = PIXI.Assets.load(fp) as Promise<PIXI.Texture>;
    return GVar.textureAssetTemp[fp];
}
async function getSpriteTexture(data:SpriteData){
    const {filepath,ofstx,ofsty,width,height,spriteId} = data;
    GVar.spriteTextureTemp ??= {};
    if(GVar.spriteTextureTemp[spriteId]!=null) return GVar.spriteTextureTemp[spriteId];
    const source = (await loadTextureAsset(filepath)).source;
    const frame = new PIXI.Rectangle(ofstx, ofsty, width, height);
    const texture = new PIXI.Texture({source, frame});
    GVar.spriteTextureTemp[spriteId] = texture;
    return texture;
}
type StringSpriteData = {
    tileId:string
};
export type TileSpriteData = {
    terrain?:SpriteData|StringSpriteData;
}
export type TileSlotPos = {
    tileX:number;
    tileY:number;
    chunkX:number;
    chunkY:number;
    tileWidth:number;
    tileHeight:number;
};
export type TileSlotProps = {
    pos:TileSlotPos;
    data?:TileSpriteData;
};
export class TileSlot implements PixiObject{
    inited:Promise<PIXI.Container>;
    data?:TileSpriteData;
    pos:TileSlotPos;
    constructor(props: TileSlotProps) {
        const {data,pos} = props;
        this.data = data;
        this.pos = pos;
        const {tileWidth,tileHeight} = pos;
        const terrain = data?.terrain;
        if(terrain==null){
            this.inited=(async ()=>{
                const graphics = new PIXI.Graphics();
                graphics.fill(0xffffff);
                graphics.rect(0, 0, tileWidth, tileHeight);
                graphics.fill();
                graphics.x = pos.tileX * pos.tileWidth;
                graphics.y = pos.tileY * pos.tileHeight;
                return graphics;
            })();
            return;
        }
        if(('spriteId' in terrain)) {
            this.inited=(async ()=>{
                const {displayOfstx,displayOfsty} = terrain;
                const node = new PIXI.Sprite(await getSpriteTexture(terrain));
                node.x = displayOfstx + pos.tileX * pos.tileWidth;
                node.y = displayOfsty + pos.tileY * pos.tileHeight;
                //console.log('TileSlot',node.x,node.y);
                return node;
            })();
            return;
        }
        this.inited=(async ()=>{
            const {tileId} = terrain;
            // 创建一个容器来包含图形和文本
            const container = new PIXI.Container();
            const graphics = new PIXI.Graphics();
            graphics.fill(0xffffff);
            graphics.rect(0, 0, tileWidth, tileHeight);
            graphics.fill();
            // 创建遮罩
            const mask = new PIXI.Graphics();
            mask.fill(0xffffff);
            mask.rect(0, 0, tileWidth, tileHeight);
            mask.fill();
            // 创建文本对象
            const text = new PIXI.Text({
                text:tileId,
                style:new PIXI.TextStyle({
                    fontFamily: 'Tahoma',
                    fontSize: 10,
                    fill: '#000000',
                    wordWrap:true,
                    breakWords: true,
                    lineHeight: 10,
                    wordWrapWidth:tileWidth,
                }),
            });
            container.addChild(graphics);
            container.addChild(text);
            container.addChild(mask);
            container.mask = mask;
            container.x = pos.tileX * pos.tileWidth;
            container.y = pos.tileY * pos.tileHeight;
            return container;
        })();
    }
    async getNode() {
        return await this.inited;
    }
    getData(){
        return this.data;
    }
    getPos(){
        return this.pos;
    }
}
