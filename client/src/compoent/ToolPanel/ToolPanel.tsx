import { css } from "styled-components";
import { MouseTipsDom } from "./Panel";
import React, { FC, forwardRef, Ref, useCallback, useContext, useRef } from "react";
import { InputCard } from "../InputCard";
import { GlobalContext, InitData } from "../GlobalContext";
import { Card } from "@zwa73/react-utils";
import { getOMSSize, getZoneChunkData } from "../Util";
import { BrushSharedData } from "../Brush";
import { CanvasPanelRef } from "../CanvasPanel";











const StyledToolPanel = css`
    position: fixed;
    right: 0px;
    top: 0px;
    padding: 10px;
    border: 1px solid black;
    z-index: 1000;
    width: 30%;
    transition: width 0.3s ease, height 0.3s ease;
    &:hover{
        transition: width 0.3s ease, height 0.3s ease;
        width: 80%;
    }
`;

const TerrainInputStyled = css`
    background-color: transparent;
    &:hover{
        background-color: transparent;
    }
`;
const TerrainDescStyled = css`
    width: max(60px, 20%);
`;


const OMSInputStyled = TerrainInputStyled;
const OMSDescStyled = css`
    width: max(90px, 20%);
`;

const ZAxisInputStyled = TerrainInputStyled;
const ZAxisDescStyled = css`
    width: max(20px, 20%);
`;

type ToolPanelProps = {}
export type ToolPanel = {};

const _ToolPanel = forwardRef((props:ToolPanelProps,ref:Ref<ToolPanel>)=>{
    const {} = props;
    const {inited} = useContext(GlobalContext);

    //#region 地形笔刷输入
    const terrainInputRef = useRef<InputCard>(null);
    const handleTerrainSubmit = useCallback(()=>{
        BrushSharedData.brushSlot = terrainInputRef.current?.getText();
        //console.log(GlobalVarHelper.brusnId);
    },[]);
    //#endregion

    //#region 地图ID输入
    const omsInputRef = useRef<InputCard>(null);
    const handleOMTSubmit = useCallback(()=>{
        const canvas = CanvasPanelRef.current;
        if(canvas==null) return;
        if(inited!==true) return;
        if(omsInputRef.current==null) return;
        const {} = canvas.getData();
        const omsid = omsInputRef.current.getText();
        const oms = InitData.gameDataTable.OvermapSpecial[omsid];
        const size = (oms==null) ? {
            minChunkX:0,
            maxChunkX:2,
            minChunkY:0,
            maxChunkY:2,
            minChunkZ:0,
            maxChunkZ:0,
        } : getOMSSize(oms);

        //console.log(size);
        canvas.initMap({
            ...size,
            tileHeight:InitData.tilesetData.info.height,
            tileWidth:InitData.tilesetData.info.width,
        },getZoneChunkData(omsid,InitData.gameDataTable,InitData.tilesetData));
    },[inited]);
    //#endregion

    //#region Z轴输入
    const zAxisInputRef = useRef<InputCard>(null);
    const handleZAxisInputSubmit = useCallback(()=>{
        const canvas = CanvasPanelRef.current;
        if(canvas==null) return;
        if(zAxisInputRef.current==null) return;
        const num = Number(zAxisInputRef.current?.getText());
        if(isNaN(num) || num ==null) return;
        if(canvas==null) return;
        void canvas.changeZ(num);
    },[]);
    //#endregion



    console.log('rendering ToolPanel');

    return(<Card cardStyle={StyledToolPanel}>
        <InputCard
            desc="Terrain ID"
            onClick={handleTerrainSubmit}
            initialText='null'
            overlayStyle={TerrainInputStyled}
            descStyle={TerrainDescStyled}
            ref={terrainInputRef}
        />
        <InputCard
            desc="Overmap Special ID"
            onClick={handleOMTSubmit}
            initialText='null'
            overlayStyle={OMSInputStyled}
            descStyle={OMSDescStyled}
            ref={omsInputRef}
        />
        <InputCard
            desc="Z-Axis"
            onClick={handleZAxisInputSubmit}
            initialText='0'
            overlayStyle={ZAxisInputStyled}
            descStyle={ZAxisDescStyled}
            ref={zAxisInputRef}
        />
        {MouseTipsDom}
    </Card>);
});

export const {ToolPanelDom,ToolPanelRef} = (()=>{
    const ToolPanelRef = React.createRef<ToolPanel>();
    return {
        ToolPanelDom:<_ToolPanel ref={ToolPanelRef}/>,
        ToolPanelRef,
    };
})();