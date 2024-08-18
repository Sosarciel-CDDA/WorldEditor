import * as PIXI from 'pixi.js';
import {Viewport} from 'pixi-viewport';
import { ZoneMap } from '../TileMap';
import { CanvasPanel } from '../CanvasPanel';




export type BrushProps = {
    event:PIXI.FederatedPointerEvent;
    vp:Viewport;
    map:ZoneMap;
    canvas:CanvasPanel;
}

/**笔刷接口 */
export type Brush = (props:BrushProps)=>void;