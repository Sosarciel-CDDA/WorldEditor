import { SpriteData } from "@/src/static/TilesetLoader";
import * as PIXI from 'pixi.js';
import { TileSlotPos } from "../TileSlot";
import { getSpriteTexture } from "../../Util";



type StringSpriteData = {
    tileId:string
};

export type AnySpriteData = null|SpriteData|StringSpriteData;

/**创建一个白色的图形对象
 * @param width - 图形的宽度。
 * @param height - 图形的高度。
 * @returns 创建的图形对象。
 */
function getWhiteGraphics(width:number,height:number){
    const graphics = new PIXI.Graphics();
    graphics.fill(0xffffff);
    graphics.rect(0, 0, width, height);
    graphics.fill();
    return graphics;
}
/**获取精灵对象
 * @param data - 精灵数据对象。
 * @param pos - 位置对象，包含 tileWidth 和 tileHeight 等信息。
 * @returns 创建的精灵对象或包含图形和文本的容器。
 */
export async function getSprite(data:AnySpriteData,pos:TileSlotPos){
    const {tileWidth,tileHeight}=pos;
    //空图片
    if(data==null) return getWhiteGraphics(tileWidth,tileHeight);
    //正常图片
    if(('spriteId' in data)) {
        const node = new PIXI.Sprite(await getSpriteTexture(data));
        const {displayOfstx,displayOfsty} = (data!=null && 'spriteId' in data)
            ? data : {displayOfstx:0,displayOfsty:0};
        node.x = displayOfstx;
        node.y = displayOfsty;
        return node;
    }
    //文本
    const {tileId} = data;
    // 创建一个容器来包含图形和文本
    const container = new PIXI.Container();
    // 底图
    const graphics = getWhiteGraphics(tileWidth,tileHeight);
    // 创建遮罩
    const mask = getWhiteGraphics(tileWidth,tileHeight);
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
    container.addChild(graphics)
        .addChild(text)
        .addChild(mask);
    container.mask = mask;
    return container;
}