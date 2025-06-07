import React, { CSSProperties, forwardRef, memo, Ref, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { GlobalContext } from "./GlobalContext";
import { TileSlot, ZoneChunkDataMap, ZoneMap, ZoneMapPos } from "./TileMap";
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { BrushRoute } from "./Brush";

const styled:CSSProperties={
    width:'100%',
    height:'100%'
};

export type PIXIApp = PIXI.Application<PIXI.Renderer>;

export type CanvasPanelData = {
    currentTile?:TileSlot;
    inLeftDown? :boolean;
    hover?      :boolean;
    vp?         :Viewport;
    app?        :PIXI.Application;
    zoneMap?    :ZoneMap;
};

export type CanvasPanel = {
    initMap:(data:ZoneMapPos,map?:ZoneChunkDataMap)=>void;
    changeZ:(z:number)=>Promise<void>;
    getData:()=>CanvasPanelData;
};


const _CanvasPanel = forwardRef((props:{},ref:Ref<CanvasPanel>)=>{
    const {inited} = useContext(GlobalContext);
    const canvasRef = useRef<HTMLDivElement>(null);
    const refData = useRef<CanvasPanelData>({});

    //#region 初始化视窗
    useEffect(() => {
        console.log('CanvasPanel useEffect');
        if(!canvasRef.current) return;
        void (async ()=>{
            const app = new PIXI.Application();
            await app.init({
                width: window.innerWidth,
                height: window.innerHeight,
                backgroundColor: 0x1099bb,
            });

            app.ticker.maxFPS = 30;
            app.ticker.minFPS = 20;
            refData.current.app = app;
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

            refData.current.vp = viewport;

            // 监听窗口resize事件
            const handleResize = () => {
                app.renderer.resize(window.innerWidth, window.innerHeight);
                viewport.resize(window.innerWidth, window.innerHeight);
            };

            window.addEventListener("resize", handleResize);

            //监听鼠标移动
            const handleMouseMove = (event:PIXI.FederatedPointerEvent) => {
                const {hover,zoneMap} = refData.current;
                if(!hover || !zoneMap) return;
                const {x,y} = viewport.toWorld(event.clientX, event.clientY);
                const ct = zoneMap.getSlotByWorldPos(x,y);
                refData.current.currentTile = ct;
                BrushRoute({
                    event,
                    map: zoneMap,
                    vp:viewport,
                    canvas:localRef
                });
            };
            viewport.on('mousemove', handleMouseMove);

            return () => {
                viewport.off('mousemove', handleMouseMove);
                window.removeEventListener("resize", handleResize);
                app.destroy(true, {
                    children: true,
                    texture:true,
                    textureSource:true,
                    context:true,
                    style:true,
                });
                console.log('destory app');
            };
        })();
    }, []);
    //#endregion

    //#region 拖曳
    const handleMouseDown = useCallback((e: React.MouseEvent)=>{
        if(e.button === 0){
            e.preventDefault();
            refData.current.inLeftDown=true;
        }
    },[]);
    const handleMouseLeave = useCallback((e: React.MouseEvent)=>{
        refData.current.inLeftDown=false;
        refData.current.hover=false;
    },[]);
    const handleMouseHover = useCallback((e: React.MouseEvent)=>{
        refData.current.hover=true;
    },[]);
    const handleMouseMove = useCallback((e: React.MouseEvent)=>{
        refData.current.hover=true;
    },[]);
    //#endregion

    //#region 初始化
    const initMap = useCallback((data:ZoneMapPos,chunkDataMap?:ZoneChunkDataMap)=>{
        console.time('initMap');
        const vp = refData.current.vp;
        if(vp==null || inited!=true) return;
        vp.removeChildren()
            .forEach(co=>co.destroy({
                children:true,
                texture: true,
                context: true,
                style: true,
            }));

        const zp = new ZoneMap({ pos: data, chunkDataMap });
        void (async ()=>{
            const node = await zp.getNode();
            vp.addChild(node);
            refData.current.zoneMap=zp;
            console.timeEnd('initMap');
        })();
    },[inited]);
    const changeZ = useCallback(async (z:number)=>{
        await refData.current.zoneMap?.init(z);
    },[]);
    const getData = useCallback(()=>refData.current,[]);
    const styled:CSSProperties = useMemo(()=>{
        return {
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
        };
    },[]);
    const localRef = {initMap,changeZ,getData};
    //#endregion
    useImperativeHandle(ref,()=>localRef);
    console.log('rendering CanvasPanel');

    return(
        <div style={styled}
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseOver={handleMouseHover}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseLeave}
            onMouseMove={handleMouseMove}
        />
    );
});

export const {CanvasPanelRef,CanvasPanelDom} = (()=>{
    const ref = React.createRef<CanvasPanel>();
    const dom = <_CanvasPanel ref={ref}/>;
    return{
        CanvasPanelDom:dom,
        CanvasPanelRef:ref
    };
})();

