import { CSSProperties, forwardRef, memo, Ref, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { GlobalContext, GVar } from "./GlobalContext";
import { ZoneChunkDataMap, ZoneMap, ZoneMapData } from "./TileMap";
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

const styled:CSSProperties={
    width:'100%',
    height:'100%'
};

export type PIXIApp = PIXI.Application<PIXI.Renderer>;
export type MainPanel = {
    initMap:(data:ZoneMapData,map?:ZoneChunkDataMap)=>void;
    changeZ:(z:number)=>Promise<void>;
}
export const MainPanel = memo(forwardRef((props:{},ref:Ref<MainPanel>)=>{
    const {tilesetData} = useContext(GlobalContext);
    const [zoneMap, setZoneMap] = useState<ZoneMap|null>(null);
    //#region 初始化视窗
    const [vp,setVP] = useState<Viewport|undefined>(undefined);
    const canvasRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        console.log('MainPanel useEffect');
        if(canvasRef.current) (async ()=>{
            const app = new PIXI.Application();
            await app.init({
                width: window.innerWidth,
                height: window.innerHeight,
                backgroundColor: 0x1099bb,
            });

            app.ticker.maxFPS = 30;
            app.ticker.minFPS = 20;

            if (canvasRef.current)
                canvasRef.current.appendChild(app.canvas);

            const viewport = new Viewport({
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,
                worldWidth: 1600,
                worldHeight: 1200,
                events: app.renderer.events // 使用events字段
            });

            app.stage.addChild(viewport);

            // 激活插件
            viewport
                .drag({ mouseButtons: 'right' })
                .pinch().wheel().decelerate()
                .clampZoom({ minScale: 0.1, maxScale: 4 }); // 设置缩放的最小值和最大值

            setVP(viewport);

            // 监听窗口resize事件
            const handleResize = () => {
                app.renderer.resize(window.innerWidth, window.innerHeight);
                viewport.resize(window.innerWidth, window.innerHeight);
            };

            window.addEventListener("resize", handleResize);

            return () => {
                window.removeEventListener("resize", handleResize);
                app.destroy(true, { children: true });
            };
        })();
    }, []);
    //#endregion

    //#region 拖曳
    const [brushing, setBrushing] = useState(false);
    const [hover,setHover] = useState(false);
    const handleMouseDown = useCallback((e: React.MouseEvent)=>{
        if(e.button === 0){
            e.preventDefault();
            setBrushing(true);
        }
    },[]);
    const handleMouseLeave = useCallback((e: React.MouseEvent)=>{
        setBrushing(false);
        setHover(false);
    },[]);
    const handleMouseHover = useCallback((e: React.MouseEvent)=>{
        setHover(true);
    },[]);
    const handleMouseMove = useCallback((e: React.MouseEvent)=>{
        setHover(true);
    },[]);
    const inBrushing = useCallback((event:PIXI.FederatedPointerEvent)=>{
        if(!brushing || vp==null || zoneMap==null || tilesetData==null) return;
        const {x,y} = vp.toWorld(event.clientX, event.clientY);
        //console.log(x,y);
        const odat = zoneMap.getSlotByWorldPos(x,y)?.getData();
        const bid = GVar.brusnId=="null" ? undefined
            : GVar.brusnId ?? undefined;
        if(bid==null && odat?.terrain?.tileId==undefined){
            zoneMap.setSlotByWorldPos(undefined,x,y);
            return;
        }
        const ndat = bid == undefined ? undefined : tilesetData.table[bid];
        if(odat?.terrain?.tileId != ndat?.tileId)
            zoneMap.setSlotByWorldPos({terrain:ndat},x,y);
    },[brushing,vp,zoneMap,tilesetData]);
    //#endregion

    //#region 初始化
    const initMap = useCallback((data:ZoneMapData,chunkDataMap?:ZoneChunkDataMap)=>{
        console.time('initMap');
        if(vp==null) return;
        vp.removeChildren()
            .forEach(co=>co.destroy({
                children:true,
                texture: true,
                context: true,
                style: true,
            }));

        const zp = new ZoneMap({ data, chunkDataMap });
        (async ()=>{
            const node = await zp.getNode();
            vp.addChild(node);
            setZoneMap(zp);
            console.timeEnd('initMap');
        })();
    },[vp,tilesetData]);
    const changeZ = useCallback(async (z:number)=>{
        await zoneMap?.init(z);
    },[zoneMap]);
    //#endregion
    useEffect(()=>{
        if (!vp) return;
        const handleMouseMove = (event:PIXI.FederatedPointerEvent) => {
            inBrushing(event);
            if(hover){
                const {x,y} = vp.toWorld(event.clientX, event.clientY);
                const ct = zoneMap?.getSlotByWorldPos(x,y);
                GVar.currentTile = ct;
            }
        };
        vp.on('mousemove', handleMouseMove);
        return () => void vp.off('mousemove', handleMouseMove);
    },[vp,inBrushing,zoneMap,hover]);
    const localRef = {initMap,changeZ};
    useImperativeHandle(ref,()=>localRef);
    GVar.mainPanel=localRef;
    console.log('rendering MainPanel')

    return(
        <div style={styled}
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseOver={handleMouseHover}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseLeave}
            onMouseMove={handleMouseMove}
        />
    )
}));