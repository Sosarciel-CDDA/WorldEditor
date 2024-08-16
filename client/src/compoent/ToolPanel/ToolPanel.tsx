import { css, keyframes } from "styled-components"
import { TipsPanel } from "./TipsPanel"
import { FC, Ref, RefObject, useCallback, useContext, useRef } from "react"
import { InputCard } from "../InputCard"
import { GlobalContext, GVar } from "../GlobalContext"
import { Card } from "@zwa73/react-utils"
import { ZoneMap } from "../TileMap"
import { OverMapSpecial } from "cdda-schema"
import { getOMSSize, getZoneChunkData } from "../Util"











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


export const ToolPanel:FC<ToolPanelProps> = (props:ToolPanelProps)=>{
    const {} = props;
    const {tilesetData,gameDataTable} = useContext(GlobalContext);

    //#region 地形笔刷输入
    const terrainInputRef = useRef<InputCard>(null);
    const handleTerrainSubmit = useCallback(()=>{
        GVar.brusnId = terrainInputRef.current?.getText();
        //console.log(GlobalVarHelper.brusnId);
    },[terrainInputRef]);
    //#endregion

    //#region 地图ID输入
    const omsInputRef = useRef<InputCard>(null);
    const handleOMTSubmit = useCallback(()=>{
        if(GVar.mainPanel && tilesetData && gameDataTable && omsInputRef.current){
            const omsid = omsInputRef.current.getText();
            const oms = gameDataTable.OvermapSpecial[omsid];
            const size = (oms==null) ? {
                minChunkX:0,
                maxChunkX:2,
                minChunkY:0,
                maxChunkY:2,
                minChunkZ:0,
                maxChunkZ:0,
            } : getOMSSize(oms);

            //console.log(size);
            const mainPanel = GVar.mainPanel;
            mainPanel.initMap({
                ...size,
                tileHeight:tilesetData.info.height,
                tileWidth:tilesetData.info.width,
            },getZoneChunkData(omsid,gameDataTable,tilesetData));
        }
    },[tilesetData]);
    //#endregion

    //#region Z轴输入
    const zAxisInputRef = useRef<InputCard>(null);
    const handleZAxisInputSubmit = useCallback(()=>{
        if(zAxisInputRef.current==null) return;
        const num = Number(zAxisInputRef.current?.getText());
        if(isNaN(num) || num ==null) return;
        const mainPanel = GVar.mainPanel;
        if(mainPanel==null) return;
        mainPanel.changeZ(num);
    },[zAxisInputRef]);
    //#endregion



    console.log('rendering ToolPanel')

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
        <TipsPanel/>
    </Card>)
}