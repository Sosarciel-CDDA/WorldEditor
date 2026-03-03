import { SLogger, UtilFT } from '@zwa73/utils';
import fs from 'fs';
import path from 'pathe';
import { IpcMainInvokeEvent } from 'electron';
import sharp from 'sharp';

/** 设定 WebGL/显卡 允许的最大纹理限制，一般设为 4096 兼容性最好 */
const MAX_TEXTURE_SIZE = 4096; 

// ==========================================
// 类型定义区
// ==========================================

/** CDDA tileset JSON 文件的结构定义 */
type TilesetJson = {
    tile_info: [{
        width: number;
        height: number;
    }];
    "tiles-new": {
        file: string;
        tiles: {
            id: string | string[];
            fg: number | number[] | {
                weight: number,
                sprite: number
            }[];
            bg: number | number[];
            rotates?: boolean;
            animated?: boolean,
        }[];
        sprite_width?: number,
        sprite_height?: number,
        sprite_offset_x?: number,
        sprite_offset_y?: number,
    }[];
};

/** 最终输出的 Tileset 完整数据 */
export type TilesetData = {
    /** 瓦块 ID 到 具体精灵图数据的映射表 */
    table: Record<string, SpriteData>;
    /** 全局默认的图块基础宽高 */
    info: { width: number, height: number };
};

/** 单个 Sprite（精灵）在物理图片上的绝对定位和偏移数据 */
export type SpriteData = {
    /** 逻辑瓦块 ID (例如 "t_soil") */
    tileId: string;
    /** 在整个图集中的线性数字 ID */
    spriteId: number;
    /** 实际对应的物理图片路径 (可能是切片后的路径) */
    filepath: string;
    /** 该图块的实际宽度 */
    width: number;
    /** 该图块的实际高度 */
    height: number;
    /** 基于图片左上角原点的 X 裁剪坐标 */
    ofstx: number;
    /** 基于图片左上角原点的 Y 裁剪坐标 */
    ofsty: number;
    /** 游戏内渲染时的 X 视觉偏移 */
    displayOfstx: number;
    /** 游戏内渲染时的 Y 视觉偏移 */
    displayOfsty: number;
    /** 关联的底图数据 (如果有) */
    bg?: Omit<SpriteData, 'bg' | 'tileId'>;
};

/** 用于记录每张图（或切片）所包含的 Sprite ID 范围及基础属性 */
type FileIndex = {
    filepath: string;
    imageWidth: number;
    imageHeight: number;
    tileWidth: number;
    tileHeight: number;
    /** 该图片/切片包含的第一个 Sprite ID (累加值) */
    start: number;
    /** 整体显示偏移 X */
    ofstx: number;
    /** 整体显示偏移 Y */
    ofsty: number;
}

// ==========================================
// 工具函数区
// ==========================================

/**极速获取 PNG 图片尺寸
 * @description 通过只读取 PNG 文件头的前 24 字节来解析宽高，避免全量加载巨型图片导致内存暴涨和时间浪费
 */
async function getPngSize(filePath: string) {
    return new Promise<{ width: number, height: number }>((resolve, reject) => {
        const buffer = Buffer.alloc(24) as any;
        fs.open(filePath, 'r', (err, fd) => {
            if (err) return reject(err);
            fs.read(fd, buffer, 0, 24, 0, (err) => {
                if (err) return reject(err);
                // PNG 的 IHDR 块中，宽和高分别位于第 16 和 20 字节，占 4 字节大端序
                const width = buffer.readUInt32BE(16);
                const height = buffer.readUInt32BE(20);
                resolve({ width, height });
            });
        });
    });
}

// ==========================================
// 核心加载与处理逻辑
// ==========================================

/**
 * 加载并解析 Tileset，自动处理超大图切片，构建 ID 映射表
 */
export const loadTileset = async (e: IpcMainInvokeEvent | undefined, gamePath: string, gfxName: string): Promise<TilesetData> => {
    console.time('static loadTileset');
    const gfxDir = path.join(gamePath, 'gfx', gfxName);

    // --------------------------------------------------------
    // 【阶段 1：读取并解析基础配置】
    // --------------------------------------------------------
    const tilesetTxt = path.join(gfxDir, 'tileset.txt');
    const txt = await fs.promises.readFile(tilesetTxt, 'utf-8');

    // 寻找具体的 json 配置文件路径
    const ptxt = txt.match(/JSON: (.+)/);
    if (ptxt == null) {
        SLogger.warn(`tileset.txt格式错误 ${txt}`);
        return { table: {}, info: { width: 0, height: 0 } };
    }
    const jsonPath = path.join(gfxDir, ptxt[1]);
    const json = await UtilFT.loadJSONFile(jsonPath) as TilesetJson;

    const tbase = json.tile_info[0];
    const tnews = json['tiles-new'];
    const out: Record<string, SpriteData> = {};
    const fileIndexList: FileIndex[] = [];

    // --------------------------------------------------------
    // 【阶段 2：构建物理文件索引表 (包含自动切片逻辑)】
    // --------------------------------------------------------
    let index = 0; // 全局累加的 Sprite ID (每个图块占 1 个 ID)

    for (const tnew of tnews) {
        const originalFilepath = path.join(gfxDir, tnew.file);
        const { width: imageWidth, height: imageHeight } = await getPngSize(originalFilepath);

        // 优先使用当前文件定义的尺寸，否则 fallback 到全局默认尺寸
        const tileWidth = tnew.sprite_width ?? tbase.width;
        const tileHeight = tnew.sprite_height ?? tbase.height;

        // 如果图片高度超出了显卡限制，执行切片逻辑
        if (imageHeight! > MAX_TEXTURE_SIZE) {
            // 计算每个切片最多能容纳多少“行”图块，强制按图块高度取整，确保图块不会被拦腰切断
            const maxRowsPerChunk = Math.floor(MAX_TEXTURE_SIZE / tileHeight);
            if (maxRowsPerChunk === 0) {
                SLogger.warn(`单个图块的高度 ${tileHeight} 超过了最大纹理限制 ${MAX_TEXTURE_SIZE}!`);
                continue;
            }

            const chunkPixelHeight = maxRowsPerChunk * tileHeight; // 单个切片的实际像素高度
            const totalRows = Math.ceil(imageHeight! / tileHeight); // 该长图总共包含多少行图块
            const chunksCount = Math.ceil(totalRows / maxRowsPerChunk); // 总共需要切多少刀
            const parsedPath = path.parse(tnew.file);

            for (let c = 0; c < chunksCount; c++) {
                // 生成带编号的切片路径，如: player_chunk_0.png
                const chunkRelativePath = path.join(parsedPath.dir, `${parsedPath.name}_chunk_${c}${parsedPath.ext}`);
                const chunkPath = path.join(gfxDir, chunkRelativePath);

                // 计算当前切片的高度 (最后一块通常达不到 chunkPixelHeight，所以取最小值)
                const extractHeight = Math.min(chunkPixelHeight, imageHeight! - c * chunkPixelHeight);
                const extractRows = Math.ceil(extractHeight / tileHeight); // 当前切片包含的行数

                // 如果切片文件不存在，才调用 sharp 进行实际的切割并保存到本地
                if (!await UtilFT.pathExists(chunkPath)) {
                    await sharp(originalFilepath)
                        .extract({
                            left: 0,
                            top: c * chunkPixelHeight,
                            width: imageWidth!,
                            height: extractHeight
                        })
                        .toFile(chunkPath);
                }

                // 将切片作为一张独立的图片，推入索引列表
                fileIndexList.push({
                    filepath: chunkPath,
                    tileWidth,
                    tileHeight,
                    imageWidth: imageWidth!,
                    imageHeight: extractHeight,
                    start: index, // 记录当前切片起始的 Sprite ID
                    ofstx: tnew.sprite_offset_x ?? 0,
                    ofsty: tnew.sprite_offset_y ?? 0,
                });

                // 更新全局索引：累加当前切片所包含的总图块数量 (列数 * 行数)
                index += (imageWidth! / tileWidth) * extractRows;
            }
        } else {
            // 没有超长的图片，按原样推入索引表
            fileIndexList.push({
                filepath: originalFilepath,
                tileWidth,
                tileHeight,
                imageWidth: imageWidth!,
                imageHeight: imageHeight!,
                start: index,
                ofstx: tnew.sprite_offset_x ?? 0,
                ofsty: tnew.sprite_offset_y ?? 0,
            });
            // 累加整张图包含的图块数量
            index += (imageWidth! / tileWidth) * (imageHeight! / tileHeight);
        }
    }

    // --------------------------------------------------------
    // 【阶段 3：构建逻辑 ID 到 物理坐标的最终映射表】
    // --------------------------------------------------------

    /** * 核心寻址函数：输入一个线性的 Sprite ID，算出它落在哪个物理文件上，以及文件内的 XY 裁剪坐标 
     */
    const foundSpriteWithMap = (id: number) => {
        // 遍历索引表，通过对比 start ID 范围，找出目标所在的图片/切片
        for (let i = 0; i < fileIndexList.length; i++) {
            const fd = fileIndexList[i];
            const end = i >= fileIndexList.length - 1
                ? Infinity : fileIndexList[i + 1].start;

            if (end > id && fd.start <= id) {
                // 计算在该图片内部的相对 ID (从 0 开始)
                const inImageId = id - fd.start;
                // 计算一行有多少列图块
                const forRow = fd.imageWidth / fd.tileWidth;

                // 将一维的 ID 转换为二维的 行(column) 列(row) 坐标
                const row = inImageId % forRow; // 第几列
                const column = Math.floor(inImageId / forRow); // 第几行

                return {
                    spriteId: id,
                    filepath: fd.filepath,
                    displayOfstx: fd.ofstx,
                    displayOfsty: fd.ofsty,
                    ofstx: row * fd.tileWidth,     // 换算为物理像素 X 坐标
                    ofsty: column * fd.tileHeight, // 换算为物理像素 Y 坐标
                    width: fd.tileWidth,
                    height: fd.tileHeight,
                };
            }
        }
        return undefined;
    };

    // 遍历所有定义的瓦块，生成最终的字典表 `out`
    for (const tnew of tnews) {
        const tiles = tnew.tiles;
        for (const tile of tiles) {
            if (tile.fg == undefined) continue;

            // 解析前景 ID：支持单数字、数字数组、或是包含权重的对象数组
            const spriteId = typeof tile.fg == 'number' ? tile.fg :
                typeof tile.fg[0] == 'number' ? tile.fg[0] :
                tile.fg[0].sprite;

            if (spriteId == undefined) continue;

            // 通过寻址函数获取物理坐标数据
            const foundD = foundSpriteWithMap(spriteId);
            if (foundD == undefined) {
                console.log(`can't found spriteId data ${spriteId} skip`);
                continue;
            }

            // 解析背景 ID (逻辑同上)
            const bgid = tile.bg == null ? undefined :
                typeof tile.bg == 'number' ? tile.bg :
                tile.bg[0];
            const foundBg = bgid == undefined ? undefined : foundSpriteWithMap(bgid);

            // tile.id 可能是单个字符串也可能是数组，统一转为数组遍历
            const fixedid = typeof tile.id == 'string' ? [tile.id] : tile.id;

            // 写入最终映射表
            fixedid.forEach(id => out[id] = {
                ...foundD,
                tileId: id,
                bg: foundBg,
            });
        }
    }

    console.timeEnd('static loadTileset');
    return {
        table: out,
        info: tbase
    };
};

// ==========================================
// 测试代码区 (已禁用)
// ==========================================
if (false) void (async () => {
    console.time('load');
    const d1 = await loadTileset(undefined,
        'H:/CDDA/newver11/cdda-windows-with-graphics-and-sounds-x64-2025-12-01-0424', 'MshockXotto+'
    );
    console.log(d1.table['t_soil']);
    const d2 = await loadTileset(undefined,
        'H:/CDDA/newver11/cdda-windows-with-graphics-and-sounds-x64-2025-12-01-0424', 'MSX++UnDeadPeopleEdition'
    );
    console.log(d2.table['t_soil']);
})();