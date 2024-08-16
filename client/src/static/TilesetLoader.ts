import { SLogger, throwError, UtilFT } from '@zwa73/utils';
import fs from 'fs';
import path from 'pathe';
import Jimp from 'jimp';
import { IpcMainInvokeEvent } from 'electron';
import * as PIXI from 'pixi.js';


type TilesetJson = {
    tile_info: [{
        width: number;
        height: number;
    }];
    "tiles-new": {
        file: string;
        tiles: {
            id: string;
            fg: number|{
                weight:number,
                sprite:number
            }[];
            rotates?: boolean;
            animated?: boolean,
        }[];
        sprite_width?: number,
        sprite_height?: number,
        sprite_offset_x?: number,
        sprite_offset_y?: number,
    }[];
};
export type TilesetData = {
    table:Record<string,SpriteData>;
    info:{width:number,height:number};
};
export type SpriteData = {
    tileId:string;
    spriteId:number;
    filepath:string;
    width:number;
    height:number;
    /**基于图片原点的偏移 */
    ofstx:number;
    /**基于图片原点的偏移 */
    ofsty:number;
    /**显示时的偏移 */
    displayOfstx:number;
    /**显示时的偏移 */
    displayOfsty:number;
};

export const loadTileset = async (e:IpcMainInvokeEvent|undefined,gamePath:string,gfxName:string):Promise<TilesetData>=>{
    const gfxDir = path.join(gamePath,'gfx',gfxName);
    const tilesetTxt = path.join(gfxDir,'tileset.txt');
    const txt = await fs.promises.readFile(tilesetTxt,'utf-8');
    const ptxt = txt.match(
        /JSON: (.+)/
    );
    if(ptxt==null){
        SLogger.warn(`tileset.txt格式错误 ${txt}`);
        return {table:{},info:{width:0,height:0}};
    }
    const jsonPath = path.join(gfxDir,ptxt[1]);
    const json = await UtilFT.loadJSONFile(jsonPath) as TilesetJson;

    const tbase = json.tile_info[0];
    const tnews = json['tiles-new'];
    const out:Record<string,SpriteData> = {};

    let index = 0;
    const imageSizes = await Promise.all(tnews.map(async tnew=>
        (await Jimp.read(path.join(gfxDir,tnew.file))).bitmap
    ));
    const fileIndexList = tnews.map((tnew,i)=>{
        const filepath = path.join(gfxDir,tnew.file);
        const {width: imageWidth,height: imageHeight} = imageSizes[i];
        const tileWidth = tnew.sprite_width??tbase.width;
        const tileHeight = tnew.sprite_height??tbase.height;
        const out = {
            filepath,tileWidth,tileHeight,
            imageWidth:imageWidth!,
            imageHeight:imageHeight!,
            start:index,
            ofstx: tnew.sprite_offset_x??0,
            ofsty: tnew.sprite_offset_y??0,
        };
        index += (imageWidth!/tileWidth * imageHeight!/tileHeight);
        return out;
    });

    const foundSpriteWithMap = (id:number)=>{
        for(let i=0;i<fileIndexList.length;i++){
            const fd = fileIndexList[i];
            const end = i>=fileIndexList.length -1
                ? Infinity : fileIndexList[i+1].start;
            if(end > id && fd.start <= id){
                const inImageId = id-fd.start;
                const forRow = fd.imageWidth/fd.tileWidth;
                const row = inImageId%forRow;
                const column = Math.floor(inImageId/forRow);
                return {
                    spriteId:id,
                    filepath:fd.filepath,
                    displayOfstx:fd.ofstx,
                    displayOfsty:fd.ofsty,
                    ofstx: row   * fd.tileWidth ,
                    ofsty: column* fd.tileHeight,
                }
            }
        }
        return undefined;
    }

    for(const tnew of tnews){
        const tiles = tnew.tiles;
        for(const tile of tiles){
            if(tile.fg ==undefined) continue;
            const spriteId = typeof tile.fg == 'number'
                ? tile.fg : tile.fg[0].sprite;
            if(spriteId==undefined) continue;
            const foundD = foundSpriteWithMap(spriteId);
            if(foundD==undefined){
                console.log(`can'not found spriteId data ${spriteId} skip`);
                continue;
            }

            out[tile.id]={
                ...foundD,
                tileId:tile.id,
                width:tnew.sprite_width??tbase.width,
                height:tnew.sprite_height??tbase.height,
            }
        }
    }

    return {
        table:out,
        info:tbase
    };
}

if(false)(async()=>{
    console.time('load');
    const d = await loadTileset(undefined,
        'H:/CDDA/cdda-windows-tiles-x64-2023-05-08-0608/','MSX++UnDeadPeopleEdition'
    );
    console.log(d.table['mon_dragon_dummy']);
})()